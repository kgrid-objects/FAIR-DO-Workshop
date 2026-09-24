'use strict';

const crypto = require('node:crypto');
const {
  wagnerScorer,
  wagnerQuestionnaire,
  hbotDecision,
  burdenAnalysis,
  regimenRange,
  questionnaireLogic,
  margolisPrognosis
} = require('./dependency-packages');
const { verifyDependencyIdentity } = require('./dependency-manifest-validation');
const { fingerprintJson } = require('./fingerprint');
const { REASON_CODES, makeDiagnostic } = require('./errors');
const {
  tx01WagnerToHbotGrade,
  tx02BooleanToString,
  tx03FirstVisitToMargolisQuantities,
  tx04FromQuestionnaireResponse
} = require('./transformations');

function urnUuid() {
  return `urn:uuid:${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function baseValidationEvidence(overrides = {}) {
  return {
    identity_check: 'not_applicable',
    version_check: 'not_applicable',
    package_check: 'not_applicable',
    schema_check: 'not_applicable',
    vocabulary_check: 'not_applicable',
    native_status_check: 'not_applicable',
    subject_check: 'not_applicable',
    temporal_check: 'not_applicable',
    provenance_check: 'not_applicable',
    transformation_check: 'not_applicable',
    ...overrides
  };
}

function notAttemptedRecord(role, sequenceNumber, executionId, expectedIri, packageEvidence, reasonCode) {
  return {
    dependency_role: role,
    engagement_record_id: urnUuid(),
    execution_id: executionId,
    sequence_number: sequenceNumber,
    engagement_mode: 'not_applicable',
    expected_knowledge_object_iri: expectedIri,
    realized_knowledge_object_iri: null,
    representation_binding: null,
    package_evidence: packageEvidence,
    state: 'not_attempted',
    started_at: null,
    ended_at: null,
    input_artifact_locator: null,
    input_fingerprint: null,
    engagement_context_fingerprint: null,
    native_result_identifier: null,
    native_result_artifact_locator: null,
    native_result_fingerprint: null,
    validation_status: 'not_validated',
    validation_evidence: baseValidationEvidence(),
    input_lineage_indices: [],
    transformation_indices: [],
    routed_output_fields: [],
    diagnostic_indices: [],
    not_attempted_reason_code: reasonCode
  };
}

function identityGateOrNull(role, sequenceNumber, executionId, expectedIri) {
  const identity = verifyDependencyIdentity(role);
  if (identity.ok) return { identity, blocked: null };

  const reasonCode =
    identity.reason === 'identity'
      ? REASON_CODES.DEPENDENCY_IDENTITY
      : identity.reason === 'version'
        ? REASON_CODES.DEPENDENCY_VERSION
        : REASON_CODES.DEPENDENCY_UNAVAILABLE;

  const record = notAttemptedRecord(
    role,
    sequenceNumber,
    executionId,
    expectedIri,
    identity.packageEvidence,
    reasonCode
  );
  const diagnostic = makeDiagnostic({
    reasonCode,
    dependencyRole: role,
    stage: 'dependency_identity_validation',
    message: `${role} failed exact dependency identity/version validation.`
  });
  return { identity, blocked: { record, diagnostics: [diagnostic] } };
}

async function engageWagner({ askYesNoFn, executionId, sequenceNumber, expectedIri }) {
  const gate = identityGateOrNull('DEP-WAGNER', sequenceNumber, executionId, expectedIri);
  if (gate.blocked) return { ok: false, ...gate.blocked, native: null };

  const startedAt = nowIso();
  let request;
  try {
    // Section 3.1: the KA controls interactive collection through Wagner's
    // own Questionnaire Logic capability; the KA never receives pre-recorded
    // answers.
    const collected = await wagnerQuestionnaire.runQuestionnaire(askYesNoFn);
    request = { question_ids: collected.question_ids, responses: collected.responses };
  } catch (error) {
    const record = {
      dependency_role: 'DEP-WAGNER',
      engagement_record_id: urnUuid(),
      execution_id: executionId,
      sequence_number: sequenceNumber,
      engagement_mode: 'fresh_invocation',
      expected_knowledge_object_iri: expectedIri,
      realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
      representation_binding: 'javascript-function-call:runQuestionnaire',
      package_evidence: gate.identity.packageEvidence,
      state: 'invocation_failure',
      started_at: startedAt,
      ended_at: nowIso(),
      input_artifact_locator: null,
      input_fingerprint: null,
      engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-WAGNER' }),
      native_result_identifier: null,
      native_result_artifact_locator: null,
      native_result_fingerprint: null,
      validation_status: 'invalid',
      validation_evidence: baseValidationEvidence({ identity_check: 'pass', version_check: 'pass', package_check: 'pass' }),
      input_lineage_indices: [],
      transformation_indices: [],
      routed_output_fields: [],
      diagnostic_indices: [],
      not_attempted_reason_code: null
    };
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-WAGNER',
      stage: 'wagner_interactive_collection',
      message: `Wagner interactive collection raised an error: ${error.message}`
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  let native;
  try {
    native = wagnerScorer.analyzeQuestionnaireResponse(request);
  } catch (error) {
    const record = {
      dependency_role: 'DEP-WAGNER',
      engagement_record_id: urnUuid(),
      execution_id: executionId,
      sequence_number: sequenceNumber,
      engagement_mode: 'fresh_invocation',
      expected_knowledge_object_iri: expectedIri,
      realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
      representation_binding: 'javascript-function-call:analyzeQuestionnaireResponse',
      package_evidence: gate.identity.packageEvidence,
      state: 'invocation_failure',
      started_at: startedAt,
      ended_at: nowIso(),
      input_artifact_locator: 'memory://wagner-request',
      input_fingerprint: fingerprintJson(request),
      engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-WAGNER' }),
      native_result_identifier: null,
      native_result_artifact_locator: null,
      native_result_fingerprint: null,
      validation_status: 'invalid',
      validation_evidence: baseValidationEvidence({ identity_check: 'pass', version_check: 'pass', package_check: 'pass' }),
      input_lineage_indices: [],
      transformation_indices: [],
      routed_output_fields: [],
      diagnostic_indices: [],
      not_attempted_reason_code: null
    };
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-WAGNER',
      stage: 'wagner_invocation',
      message: `Wagner invocation raised an error: ${error.message}`
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  const usable = native.analysis_status === 'grade_computed';
  const record = {
    dependency_role: 'DEP-WAGNER',
    engagement_record_id: urnUuid(),
    execution_id: executionId,
    sequence_number: sequenceNumber,
    engagement_mode: 'fresh_invocation',
    expected_knowledge_object_iri: expectedIri,
    realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
    representation_binding: 'javascript-function-call:analyzeQuestionnaireResponse',
    package_evidence: gate.identity.packageEvidence,
    state: usable ? 'completed_valid' : 'completed_invalid',
    started_at: startedAt,
    ended_at: nowIso(),
    input_artifact_locator: 'memory://wagner-request',
    input_fingerprint: fingerprintJson(request),
    engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-WAGNER' }),
    native_result_identifier: native.analysis_status,
    native_result_artifact_locator: 'memory://wagner-native-result',
    native_result_fingerprint: fingerprintJson(native),
    validation_status: usable ? 'valid' : 'invalid',
    validation_evidence: baseValidationEvidence({
      identity_check: 'pass',
      version_check: 'pass',
      package_check: 'pass',
      native_status_check: usable ? 'pass' : 'fail'
    }),
    input_lineage_indices: [],
    transformation_indices: [],
    routed_output_fields: usable ? ['wagner_score[0]'] : [],
    diagnostic_indices: [],
    not_attempted_reason_code: null
  };
  const diagnostics = usable
    ? []
    : [
        makeDiagnostic({
          reasonCode: REASON_CODES.CONSTITUENT_RESULT,
          dependencyRole: 'DEP-WAGNER',
          stage: 'wagner_result_validation',
          nativeCode: native.analysis_status,
          message: `Wagner returned a nonusable analysis_status: ${native.analysis_status}.`
        })
      ];
  return { ok: usable, record, diagnostics, native };
}

function engageMargolis({ assessment, executionId, sequenceNumber, expectedIri }) {
  const gate = identityGateOrNull('DEP-MARGOLIS', sequenceNumber, executionId, expectedIri);
  if (gate.blocked) return { ok: false, ...gate.blocked, native: null };

  const tx03 = tx03FirstVisitToMargolisQuantities(assessment);
  if (!tx03.ok) {
    const record = notAttemptedRecord(
      'DEP-MARGOLIS',
      sequenceNumber,
      executionId,
      expectedIri,
      gate.identity.packageEvidence,
      REASON_CODES.TRANSFORMATION
    );
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.TRANSFORMATION,
      dependencyRole: 'DEP-MARGOLIS',
      stage: 'tx03_transformation',
      message: 'TX-03 preconditions were not satisfied; Margolis invocation was unsafe.'
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  const startedAt = nowIso();
  const request = { wound_area: tx03.woundArea, wound_duration: tx03.woundDuration };
  let native;
  try {
    native = margolisPrognosis.evaluate(request);
  } catch (error) {
    const record = {
      dependency_role: 'DEP-MARGOLIS',
      engagement_record_id: urnUuid(),
      execution_id: executionId,
      sequence_number: sequenceNumber,
      engagement_mode: 'fresh_invocation',
      expected_knowledge_object_iri: expectedIri,
      realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
      representation_binding: 'javascript-function-call:evaluate',
      package_evidence: gate.identity.packageEvidence,
      state: 'invocation_failure',
      started_at: startedAt,
      ended_at: nowIso(),
      input_artifact_locator: 'memory://margolis-request',
      input_fingerprint: fingerprintJson(request),
      engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-MARGOLIS' }),
      native_result_identifier: null,
      native_result_artifact_locator: null,
      native_result_fingerprint: null,
      validation_status: 'invalid',
      validation_evidence: baseValidationEvidence({ identity_check: 'pass', version_check: 'pass', package_check: 'pass' }),
      input_lineage_indices: [],
      transformation_indices: [tx03.record.transformation_id],
      routed_output_fields: [],
      diagnostic_indices: [],
      not_attempted_reason_code: null
    };
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-MARGOLIS',
      stage: 'margolis_invocation',
      message: `Margolis invocation raised an error: ${error.message}`
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null, transformation: tx03.record };
  }

  const usable = native.status === 'success';
  const record = {
    dependency_role: 'DEP-MARGOLIS',
    engagement_record_id: urnUuid(),
    execution_id: executionId,
    sequence_number: sequenceNumber,
    engagement_mode: 'fresh_invocation',
    expected_knowledge_object_iri: expectedIri,
    realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
    representation_binding: 'javascript-function-call:evaluate',
    package_evidence: gate.identity.packageEvidence,
    state: usable ? 'completed_valid' : 'native_failure',
    started_at: startedAt,
    ended_at: nowIso(),
    input_artifact_locator: 'memory://margolis-request',
    input_fingerprint: fingerprintJson(request),
    engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-MARGOLIS' }),
    native_result_identifier: usable ? native.result_id : null,
    native_result_artifact_locator: 'memory://margolis-native-result',
    native_result_fingerprint: fingerprintJson(native),
    validation_status: usable ? 'valid' : 'invalid',
    validation_evidence: baseValidationEvidence({
      identity_check: 'pass',
      version_check: 'pass',
      package_check: 'pass',
      native_status_check: usable ? 'pass' : 'fail',
      transformation_check: 'pass'
    }),
    input_lineage_indices: [],
    transformation_indices: [tx03.record.transformation_id],
    routed_output_fields: usable ? ['prognostic_group'] : [],
    diagnostic_indices: [],
    not_attempted_reason_code: null
  };
  const diagnostics = usable
    ? []
    : [
        makeDiagnostic({
          reasonCode: REASON_CODES.CONSTITUENT_RESULT,
          dependencyRole: 'DEP-MARGOLIS',
          stage: 'margolis_result_validation',
          nativeStatus: native.status,
          message: 'Margolis returned a native failure status.'
        })
      ];
  return { ok: usable, record, diagnostics, native, transformation: tx03.record };
}

async function engageBurden({ askQuestionFn, executionId, sequenceNumber, expectedIri }) {
  const gate = identityGateOrNull('DEP-BURDEN', sequenceNumber, executionId, expectedIri);
  if (gate.blocked) return { ok: false, ...gate.blocked, native: null };

  const fixedRegimenRangeResponse = regimenRange.showRegimenRange({
    request_type: 'show_regimen_range'
  });

  let tx04;
  try {
    // Section 3.1: the KA controls interactive collection through the
    // Burden KO's own Questionnaire Logic capability; the KA never receives
    // pre-recorded answers.
    const questionnaireResponse = await questionnaireLogic.runBurdenQuestionnaire(askQuestionFn);
    tx04 = tx04FromQuestionnaireResponse(questionnaireResponse, fixedRegimenRangeResponse);
  } catch (error) {
    const record = notAttemptedRecord(
      'DEP-BURDEN',
      sequenceNumber,
      executionId,
      expectedIri,
      gate.identity.packageEvidence,
      REASON_CODES.INVOCATION
    );
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-BURDEN',
      stage: 'burden_interactive_collection',
      message: `Burden interactive collection raised an error: ${error.message}`
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }
  if (!tx04.ok) {
    const record = notAttemptedRecord(
      'DEP-BURDEN',
      sequenceNumber,
      executionId,
      expectedIri,
      gate.identity.packageEvidence,
      REASON_CODES.TRANSFORMATION
    );
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.TRANSFORMATION,
      dependencyRole: 'DEP-BURDEN',
      stage: 'tx04_transformation',
      message: 'TX-04 preconditions were not satisfied; Burden invocation was unsafe.'
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  const startedAt = nowIso();
  let native;
  try {
    native = burdenAnalysis.calculateBurdenRange(tx04.request);
  } catch (error) {
    const record = {
      dependency_role: 'DEP-BURDEN',
      engagement_record_id: urnUuid(),
      execution_id: executionId,
      sequence_number: sequenceNumber,
      engagement_mode: 'fresh_invocation',
      expected_knowledge_object_iri: expectedIri,
      realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
      representation_binding: 'javascript-function-call:calculateBurdenRange',
      package_evidence: gate.identity.packageEvidence,
      state: 'invocation_failure',
      started_at: startedAt,
      ended_at: nowIso(),
      input_artifact_locator: 'memory://burden-request',
      input_fingerprint: fingerprintJson(tx04.request),
      engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-BURDEN' }),
      native_result_identifier: null,
      native_result_artifact_locator: null,
      native_result_fingerprint: null,
      validation_status: 'invalid',
      validation_evidence: baseValidationEvidence({ identity_check: 'pass', version_check: 'pass', package_check: 'pass' }),
      input_lineage_indices: [],
      transformation_indices: [tx04.record.transformation_id],
      routed_output_fields: [],
      diagnostic_indices: [],
      not_attempted_reason_code: null
    };
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-BURDEN',
      stage: 'burden_invocation',
      message: `Burden invocation raised an error: ${error.message}`
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null, transformation: tx04.record };
  }

  const usable = native.status === 'completed';
  const record = {
    dependency_role: 'DEP-BURDEN',
    engagement_record_id: urnUuid(),
    execution_id: executionId,
    sequence_number: sequenceNumber,
    engagement_mode: 'fresh_invocation',
    expected_knowledge_object_iri: expectedIri,
    realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
    representation_binding: 'javascript-function-call:calculateBurdenRange',
    package_evidence: gate.identity.packageEvidence,
    state: usable ? 'completed_valid' : 'native_failure',
    started_at: startedAt,
    ended_at: nowIso(),
    input_artifact_locator: 'memory://burden-request',
    input_fingerprint: fingerprintJson(tx04.request),
    engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-BURDEN' }),
    native_result_identifier: native.result_code || native.error && native.error.code || null,
    native_result_artifact_locator: 'memory://burden-native-result',
    native_result_fingerprint: fingerprintJson(native),
    validation_status: usable ? 'valid' : 'invalid',
    validation_evidence: baseValidationEvidence({
      identity_check: 'pass',
      version_check: 'pass',
      package_check: 'pass',
      native_status_check: usable ? 'pass' : 'fail',
      transformation_check: 'pass'
    }),
    input_lineage_indices: [],
    transformation_indices: [tx04.record.transformation_id],
    routed_output_fields: usable ? ['execution_burden_level.category'] : [],
    diagnostic_indices: [],
    not_attempted_reason_code: null
  };
  const diagnostics = usable
    ? []
    : [
        makeDiagnostic({
          reasonCode: REASON_CODES.CONSTITUENT_RESULT,
          dependencyRole: 'DEP-BURDEN',
          stage: 'burden_result_validation',
          nativeCode: native.result_code,
          message: 'Burden returned a native error status.'
        })
      ];
  return { ok: usable, record, diagnostics, native, transformation: tx04.record };
}

function engageHbotDecision({
  wagnerOutcome,
  assertions,
  executionId,
  sequenceNumber,
  expectedIri
}) {
  const gate = identityGateOrNull('DEP-HBOT-DECISION', sequenceNumber, executionId, expectedIri);
  if (gate.blocked) return { ok: false, ...gate.blocked, native: null };

  if (!wagnerOutcome.ok) {
    const record = notAttemptedRecord(
      'DEP-HBOT-DECISION',
      sequenceNumber,
      executionId,
      expectedIri,
      gate.identity.packageEvidence,
      REASON_CODES.JOIN_INCOMPLETE
    );
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.JOIN_INCOMPLETE,
      dependencyRole: 'DEP-HBOT-DECISION',
      stage: 'precondition_check',
      message: 'HBOT Decision was not attempted because no usable Wagner result was available.'
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  const tx01 = tx01WagnerToHbotGrade(wagnerOutcome.native);
  const tx02Results = {
    dfu_confirmed: tx02BooleanToString(assertions.dfu_confirmed.value, 'dfu_confirmed'),
    acute_surgical_intervention: tx02BooleanToString(
      assertions.acute_surgical_intervention.value,
      'acute_surgical_intervention'
    ),
    not_healed_after_30_days: tx02BooleanToString(
      assertions.not_healed_after_30_days.value,
      'not_healed_after_30_days'
    )
  };
  const tx02Failed = Object.values(tx02Results).some((r) => !r.ok);

  if (!tx01.ok || tx02Failed) {
    const record = notAttemptedRecord(
      'DEP-HBOT-DECISION',
      sequenceNumber,
      executionId,
      expectedIri,
      gate.identity.packageEvidence,
      REASON_CODES.TRANSFORMATION
    );
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.TRANSFORMATION,
      dependencyRole: 'DEP-HBOT-DECISION',
      stage: 'tx01_tx02_transformation',
      message: 'TX-01/TX-02 preconditions were not satisfied; HBOT Decision invocation was unsafe.'
    });
    return { ok: false, record, diagnostics: [diagnostic], native: null };
  }

  const request = {
    dfu_confirmed: tx02Results.dfu_confirmed.serialized,
    wagner_grade: tx01.wagnerGrade,
    acute_surgical_intervention: tx02Results.acute_surgical_intervention.serialized,
    not_healed_after_30_days: tx02Results.not_healed_after_30_days.serialized
  };

  const startedAt = nowIso();
  let native;
  try {
    native = hbotDecision.evaluateInputObject(request);
  } catch (error) {
    const record = {
      dependency_role: 'DEP-HBOT-DECISION',
      engagement_record_id: urnUuid(),
      execution_id: executionId,
      sequence_number: sequenceNumber,
      engagement_mode: 'fresh_invocation',
      expected_knowledge_object_iri: expectedIri,
      realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
      representation_binding: 'javascript-function-call:evaluateInputObject',
      package_evidence: gate.identity.packageEvidence,
      state: 'invocation_failure',
      started_at: startedAt,
      ended_at: nowIso(),
      input_artifact_locator: 'memory://hbot-decision-request',
      input_fingerprint: fingerprintJson(request),
      engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-HBOT-DECISION' }),
      native_result_identifier: null,
      native_result_artifact_locator: null,
      native_result_fingerprint: null,
      validation_status: 'invalid',
      validation_evidence: baseValidationEvidence({ identity_check: 'pass', version_check: 'pass', package_check: 'pass' }),
      input_lineage_indices: [],
      transformation_indices: [tx01.record.transformation_id, 'TX-02'],
      routed_output_fields: [],
      diagnostic_indices: [],
      not_attempted_reason_code: null
    };
    const diagnostic = makeDiagnostic({
      reasonCode: REASON_CODES.INVOCATION,
      dependencyRole: 'DEP-HBOT-DECISION',
      stage: 'hbot_decision_invocation',
      message: `HBOT Decision invocation raised an error: ${error.message}`
    });
    return {
      ok: false,
      record,
      diagnostics: [diagnostic],
      native: null,
      transformations: [tx01.record, tx02Results.dfu_confirmed.record, tx02Results.acute_surgical_intervention.record, tx02Results.not_healed_after_30_days.record]
    };
  }

  const usable = native.status === 'completed' || native.status === 'out-of-scope';
  const record = {
    dependency_role: 'DEP-HBOT-DECISION',
    engagement_record_id: urnUuid(),
    execution_id: executionId,
    sequence_number: sequenceNumber,
    engagement_mode: 'fresh_invocation',
    expected_knowledge_object_iri: expectedIri,
    realized_knowledge_object_iri: `npm:${gate.identity.entry.npmPackageIdentity}`,
    representation_binding: 'javascript-function-call:evaluateInputObject',
    package_evidence: gate.identity.packageEvidence,
    state: usable ? 'completed_valid' : 'native_failure',
    started_at: startedAt,
    ended_at: nowIso(),
    input_artifact_locator: 'memory://hbot-decision-request',
    input_fingerprint: fingerprintJson(request),
    engagement_context_fingerprint: fingerprintJson({ executionId, role: 'DEP-HBOT-DECISION' }),
    native_result_identifier: native.result_id,
    native_result_artifact_locator: 'memory://hbot-decision-native-result',
    native_result_fingerprint: fingerprintJson(native),
    validation_status: usable ? 'valid' : 'invalid',
    validation_evidence: baseValidationEvidence({
      identity_check: 'pass',
      version_check: 'pass',
      package_check: 'pass',
      native_status_check: usable ? 'pass' : 'fail',
      transformation_check: 'pass'
    }),
    input_lineage_indices: [],
    transformation_indices: [tx01.record.transformation_id, 'TX-02'],
    routed_output_fields: usable ? ['result_id'] : [],
    diagnostic_indices: [],
    not_attempted_reason_code: null
  };
  const diagnostics = usable
    ? []
    : [
        makeDiagnostic({
          reasonCode: REASON_CODES.CONSTITUENT_RESULT,
          dependencyRole: 'DEP-HBOT-DECISION',
          stage: 'hbot_decision_result_validation',
          nativeCode: native.result_id,
          message: 'HBOT Decision returned a native error status.'
        })
      ];
  return {
    ok: usable,
    record,
    diagnostics,
    native,
    transformations: [
      tx01.record,
      tx02Results.dfu_confirmed.record,
      tx02Results.acute_surgical_intervention.record,
      tx02Results.not_healed_after_30_days.record
    ]
  };
}

module.exports = {
  urnUuid,
  nowIso,
  notAttemptedRecord,
  engageWagner,
  engageMargolis,
  engageBurden,
  engageHbotDecision
};
