'use strict';

const crypto = require('node:crypto');
const { loadManifest } = require('./dependency-manifest-validation');
const {
  engageWagner,
  engageMargolis,
  engageBurden,
  engageHbotDecision
} = require('./engagement');
const { mapGate } = require('./gate-mapping');
const { projectPrognosis, projectBurden, lookupMatrix } = require('./synthesis');
const { REASON_CODES, selectPrimaryDiagnostic, makeDiagnostic } = require('./errors');
const { validateInputContract, checkSubjectCoherence } = require('./input-validation');
const { buildFinalResult } = require('./result-builder');
const { buildProvenance, makeEventRecord, urnUuid } = require('./provenance');
const { fingerprintJson } = require('./fingerprint');

const DEPENDENCY_ROLE_ORDER = ['DEP-WAGNER', 'DEP-HBOT-DECISION', 'DEP-BURDEN', 'DEP-MARGOLIS'];

function urnExecutionId() {
  return `urn:uuid:${crypto.randomUUID()}`;
}

function notAttemptedForAll(manifest, executionId, reasonCode) {
  const { notAttemptedRecord } = require('./engagement');
  return DEPENDENCY_ROLE_ORDER.map((role, index) => {
    const entry = manifest.dependencies.find((d) => d.dependencyRole === role);
    return notAttemptedRecord(
      role,
      index + 1,
      executionId,
      entry ? entry.cksVersionIri : null,
      null,
      reasonCode
    );
  });
}

function isJoinComplete(records) {
  return (
    records.length === 4 &&
    DEPENDENCY_ROLE_ORDER.every((role, idx) => records[idx].dependency_role === role) &&
    records.every(
      (r) =>
        r.state === 'completed_valid' &&
        r.engagement_mode === 'fresh_invocation' &&
        r.validation_status === 'valid'
    )
  );
}

// Main entry point: executes one HBOT Treatment Target Knowledge Assembly
// request and returns the closed canonical result object (Section 7.3).
async function executeKnowledgeAssembly(request, options = {}) {
  const executionId = options.executionId || urnExecutionId();
  const executionStartedAt = new Date().toISOString();
  const manifest = loadManifest();

  const contract = validateInputContract(request);
  if (!contract.valid) {
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INPUT_VALIDATION,
      stage: 'input_contract_validation',
      message: contract.problems.map((p) => `${p.field}: ${p.message}`).join(' | ')
    });
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request && request.requested_at,
      indexTime: request && request.index_time,
      executionStartedAt,
      reasonCode: REASON_CODES.INPUT_VALIDATION,
      diagnostics: [diagnostic],
      gateResult: 'NOT_EVALUABLE',
      dependencyExecutionRecords: notAttemptedForAll(manifest, executionId, REASON_CODES.INPUT_VALIDATION),
      transformationRecords: []
    });
  }

  const coherence = checkSubjectCoherence(request);
  if (!coherence.coherent) {
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.SUBJECT_COHERENCE,
      stage: 'subject_coherence_validation',
      message: coherence.problems.map((p) => `${p.field}: ${p.message}`).join(' | ')
    });
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode: REASON_CODES.SUBJECT_COHERENCE,
      diagnostics: [diagnostic],
      gateResult: 'NOT_EVALUABLE',
      dependencyExecutionRecords: notAttemptedForAll(manifest, executionId, REASON_CODES.SUBJECT_COHERENCE),
      transformationRecords: []
    });
  }

  const entryFor = (role) => manifest.dependencies.find((d) => d.dependencyRole === role);

  // Phase 1A/1B/1C: engage Wagner, Margolis, Burden independently. The CKS
  // permits concurrent engagement, but when Wagner/Burden fall back to their
  // own interactive Questionnaire Logic capability (Section 3.1) they share
  // one terminal/stdin with the user, so those two are engaged sequentially
  // to avoid interleaved prompts; a failure in one branch does not cancel
  // another safely invocable branch.
  const wagnerOutcome = await engageWagner({
    askYesNoFn: options.wagnerAskYesNo,
    executionId,
    sequenceNumber: 1,
    expectedIri: entryFor('DEP-WAGNER') && entryFor('DEP-WAGNER').cksVersionIri
  });
  const margolisOutcome = await engageMargolis({
    assessment: request.margolis_first_visit_assessment,
    executionId,
    sequenceNumber: 1,
    expectedIri: entryFor('DEP-MARGOLIS') && entryFor('DEP-MARGOLIS').cksVersionIri
  });
  const burdenOutcome = await engageBurden({
    askQuestionFn: options.burdenAskQuestion,
    executionId,
    sequenceNumber: 1,
    expectedIri: entryFor('DEP-BURDEN') && entryFor('DEP-BURDEN').cksVersionIri
  });

  // Phase 2/3: build HBOT Decision input from the validated Wagner score and
  // engage HBOT Decision. May overlap with unfinished Margolis/Burden work.
  const hbotOutcome = engageHbotDecision({
    wagnerOutcome,
    assertions: request.hbot_case_assertions,
    executionId,
    sequenceNumber: 2,
    expectedIri: entryFor('DEP-HBOT-DECISION') && entryFor('DEP-HBOT-DECISION').cksVersionIri
  });

  // Section 7.3: exactly four role-indexed records in prescribed order.
  const dependencyExecutionRecords = [
    wagnerOutcome.record,
    hbotOutcome.record,
    burdenOutcome.record,
    margolisOutcome.record
  ];

  const allDiagnostics = [
    ...wagnerOutcome.diagnostics,
    ...hbotOutcome.diagnostics,
    ...burdenOutcome.diagnostics,
    ...margolisOutcome.diagnostics
  ];

  const transformationRecords = [
    ...(margolisOutcome.transformation ? [margolisOutcome.transformation] : []),
    ...(burdenOutcome.transformation ? [burdenOutcome.transformation] : []),
    ...(hbotOutcome.transformations || [])
  ];

  // Phase 4: mandatory four-KO join.
  if (!isJoinComplete(dependencyExecutionRecords)) {
    const primary = selectPrimaryDiagnostic(allDiagnostics);
    const reasonCode = primary ? primary.reason_code : REASON_CODES.JOIN_INCOMPLETE;
    const diagnostics = primary ? allDiagnostics : [
      ...allDiagnostics,
      makeDiagnostic({
        reasonCode: REASON_CODES.JOIN_INCOMPLETE,
        stage: 'mandatory_join',
        message: 'The mandatory four-dependency join did not complete with four valid fresh engagements.'
      })
    ];

    // The gate is only meaningfully FAILURE when HBOT Decision itself
    // returned an error/invalid native result while the other three roles
    // engaged validly; otherwise the gate could not be evaluated at all.
    const onlyHbotFailed =
      hbotOutcome.record.state !== 'completed_valid' &&
      wagnerOutcome.record.state === 'completed_valid' &&
      burdenOutcome.record.state === 'completed_valid' &&
      margolisOutcome.record.state === 'completed_valid';

    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode,
      diagnostics,
      gateResult: onlyHbotFailed ? 'FAILURE' : 'NOT_EVALUABLE',
      dependencyExecutionRecords,
      transformationRecords
    });
  }

  // Phase 5: apply the HBOT gate and, when supported, approved synthesis.
  const gateState = mapGate(hbotOutcome.native.result_id);
  const gateMappingRecord = {
    gate_mapping_record_id: urnUuid(),
    native_result_identifier: hbotOutcome.native.result_id,
    native_result_fingerprint: fingerprintJson(hbotOutcome.native),
    gate_mapping_rule_id: 'DEC-GATE-06A',
    gate_state: gateState,
    mapping_record_fingerprint: fingerprintJson({ native: hbotOutcome.native.result_id, gateState })
  };

  if (gateState === null) {
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode: REASON_CODES.GATE_UNDEFINED,
      diagnostics: [
        ...allDiagnostics,
        makeDiagnostic({
          reasonCode: REASON_CODES.GATE_UNDEFINED,
          dependencyRole: 'DEP-HBOT-DECISION',
          stage: 'gate_mapping',
          message: `HBOT Decision native result ${hbotOutcome.native.result_id} lacks an approved KA gate mapping.`
        })
      ],
      gateResult: 'NOT_EVALUABLE',
      dependencyExecutionRecords,
      transformationRecords
    });
  }

  if (gateState === 'NOT_SUPPORTED') {
    return finalizeCompleted({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      targetClassification: 'OFF_TARGET',
      reasonCode: REASON_CODES.HBOT_NOT_SUPPORTED,
      diagnostics: allDiagnostics,
      gateResult: gateState,
      synthesisRuleId: null,
      dependencyExecutionRecords,
      transformationRecords,
      gateMappingRecord,
      projectionRecords: [],
      synthesisRecord: null
    });
  }

  if (gateState === 'INSUFFICIENT_DECISION' || gateState === 'OUT_OF_SCOPE') {
    const reasonCode =
      gateState === 'INSUFFICIENT_DECISION'
        ? REASON_CODES.HBOT_INSUFFICIENT_DECISION
        : REASON_CODES.HBOT_OUT_OF_SCOPE;
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode,
      diagnostics: allDiagnostics,
      gateResult: gateState,
      dependencyExecutionRecords,
      transformationRecords,
      gateMappingRecord
    });
  }

  // gateState === 'SUPPORTED': independent prognosis and burden projections.
  const prognosisBand = projectPrognosis(margolisOutcome.native.prognostic_group);
  const burdenBand = projectBurden(burdenOutcome.native.execution_burden_level.category);

  const projectionRecords = [
    {
      projection_record_id: urnUuid(),
      dependency_role: 'DEP-MARGOLIS',
      native_value: margolisOutcome.native.prognostic_group,
      native_result_fingerprint: fingerprintJson(margolisOutcome.native),
      projection_rule_id: 'DEC-SYN-03A',
      projected_value: prognosisBand,
      projection_record_fingerprint: fingerprintJson({ role: 'DEP-MARGOLIS', prognosisBand })
    },
    {
      projection_record_id: urnUuid(),
      dependency_role: 'DEP-BURDEN',
      native_value: burdenOutcome.native.execution_burden_level.category,
      native_result_fingerprint: fingerprintJson(burdenOutcome.native),
      projection_rule_id: 'DEC-SYN-02A',
      projected_value: burdenBand,
      projection_record_fingerprint: fingerprintJson({ role: 'DEP-BURDEN', burdenBand })
    }
  ];

  if (!prognosisBand || !burdenBand) {
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode: REASON_CODES.SYNTHESIS_UNKNOWN_PROJECTION,
      diagnostics: [
        ...allDiagnostics,
        makeDiagnostic({
          reasonCode: REASON_CODES.SYNTHESIS_UNKNOWN_PROJECTION,
          stage: 'synthesis_projection',
          message: 'A native prognosis or burden value fell outside its approved projection vocabulary.'
        })
      ],
      gateResult: gateState,
      dependencyExecutionRecords,
      transformationRecords,
      gateMappingRecord,
      projectionRecords
    });
  }

  const matrixHit = lookupMatrix(prognosisBand, burdenBand);
  if (!matrixHit) {
    return finalizeIndeterminate({
      executionId,
      manifest,
      requestedAt: request.requested_at,
      indexTime: request.index_time,
      executionStartedAt,
      reasonCode: REASON_CODES.SYNTHESIS_COMBINATION_UNDEFINED,
      diagnostics: [
        ...allDiagnostics,
        makeDiagnostic({
          reasonCode: REASON_CODES.SYNTHESIS_COMBINATION_UNDEFINED,
          stage: 'synthesis_matrix_lookup',
          message: `No approved cell rule exists for (${prognosisBand}, ${burdenBand}).`
        })
      ],
      gateResult: gateState,
      dependencyExecutionRecords,
      transformationRecords,
      gateMappingRecord,
      projectionRecords
    });
  }

  const synthesisRecord = {
    synthesis_record_id: urnUuid(),
    synthesis_rule_id: matrixHit.ruleId,
    ordered_projection_record_ids: [projectionRecords[0].projection_record_id, projectionRecords[1].projection_record_id],
    ordered_projection_values: [prognosisBand, burdenBand],
    target_classification: matrixHit.targetClassification,
    synthesis_record_fingerprint: fingerprintJson({ rule: matrixHit.ruleId, values: [prognosisBand, burdenBand] })
  };

  return finalizeCompleted({
    executionId,
    manifest,
    requestedAt: request.requested_at,
    indexTime: request.index_time,
    executionStartedAt,
    targetClassification: matrixHit.targetClassification,
    reasonCode: REASON_CODES.SUPPORTED_SYNTHESIS,
    diagnostics: allDiagnostics,
    gateResult: gateState,
    synthesisRuleId: matrixHit.ruleId,
    dependencyExecutionRecords,
    transformationRecords,
    gateMappingRecord,
    projectionRecords,
    synthesisRecord
  });
}

function finalizeCompleted(args) {
  return finalize({ ...args, status: 'completed' });
}

function finalizeIndeterminate(args) {
  return finalize({
    ...args,
    status: 'indeterminate',
    targetClassification: 'INDETERMINATE',
    synthesisRuleId: null,
    gateMappingRecord: args.gateMappingRecord || null,
    projectionRecords: args.projectionRecords || [],
    synthesisRecord: null
  });
}

function finalize({
  executionId,
  manifest,
  requestedAt,
  indexTime,
  executionStartedAt,
  status,
  targetClassification,
  reasonCode,
  diagnostics,
  gateResult,
  synthesisRuleId,
  dependencyExecutionRecords,
  transformationRecords,
  gateMappingRecord,
  projectionRecords,
  synthesisRecord
}) {
  const executionEndedAt = new Date().toISOString();
  const joinRecord = {
    join_record_id: urnUuid(),
    required_dependency_roles: DEPENDENCY_ROLE_ORDER,
    observed_terminal_states: dependencyExecutionRecords.map((r) => ({
      dependency_role: r.dependency_role,
      state: r.state
    })),
    validation_outcome: isJoinComplete(dependencyExecutionRecords) ? 'pass' : 'fail',
    completed_at: executionEndedAt,
    join_record_fingerprint: fingerprintJson(dependencyExecutionRecords.map((r) => r.state))
  };

  const eventRecords = [
    makeEventRecord('request_validated', null, [], []),
    ...dependencyExecutionRecords.map((r) =>
      makeEventRecord('dependency_ended', r.dependency_role, [], [r.engagement_record_id])
    ),
    makeEventRecord('join_evaluated', null, dependencyExecutionRecords.map((r) => r.engagement_record_id), []),
    ...(gateMappingRecord ? [makeEventRecord('gate_mapped', 'DEP-HBOT-DECISION', [], [])] : []),
    ...(projectionRecords && projectionRecords.length
      ? projectionRecords.map((p) => makeEventRecord('projection_applied', p.dependency_role, [], []))
      : []),
    ...(synthesisRecord ? [makeEventRecord('synthesis_applied', null, [], [])] : []),
    makeEventRecord('result_issued', null, [], [])
  ];

  const provenance = buildProvenance({
    executionId,
    manifest,
    requestedAt: requestedAt || null,
    indexTime: indexTime || null,
    executionStartedAt,
    executionEndedAt,
    eventRecords,
    sourceEvidenceRecords: [],
    transformationRecords,
    dependencyEngagementRecordIds: dependencyExecutionRecords.map((r) => r.engagement_record_id),
    joinRecord,
    gateMappingRecord: gateMappingRecord || null,
    projectionRecords: projectionRecords || [],
    synthesisRecord: synthesisRecord || null
  });

  const result = buildFinalResult({
    executionId,
    status,
    targetClassification,
    reasonCode,
    diagnostics,
    gateResult,
    synthesisRuleId,
    dependencyExecutionRecords,
    transformations: transformationRecords,
    provenance,
    warnings: []
  });

  result.provenance.result_fingerprint = fingerprintJson({ ...result, provenance: { ...result.provenance, result_fingerprint: undefined } });
  return result;
}

module.exports = { executeKnowledgeAssembly };
