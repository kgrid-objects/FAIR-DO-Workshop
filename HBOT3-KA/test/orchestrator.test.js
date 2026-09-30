'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { executeKnowledgeAssembly } = require('../src/orchestrator');
const { prepareKnowledgeAssemblyRequest, prepareAndExecuteKnowledgeAssembly } = require('../src/preparation');
const { REASON_CODES } = require('../src/errors');

const SUBJECT = { system: 'https://example.org/mrn', value: 'MRN-001' };
const ULCER = { system: 'https://example.org/ulcer', value: 'ULCER-001' };
const CARE_EPISODE = { system: 'https://example.org/episode', value: 'EPISODE-001' };

function testEvidence(name, effectiveAt = '2026-09-20T09:00:00Z') {
  return {
    source_record_iri: `https://example.org/records/${name}`,
    source_system_iri: 'https://example.org/systems/teaching',
    recorded_at: effectiveAt,
    effective_at: effectiveAt,
    valid_until: '2026-09-20T10:00:00Z',
    author_or_respondent_iri: 'https://example.org/people/fictional-respondent',
    author_or_respondent_role: 'fictional_patient',
    record_fingerprint: `sha256:${'0'.repeat(64)}`
  };
}

// Deterministic simulated answers to Wagner's adaptive yes/no questionnaire.
// Q01=no, Q02=no, Q06=yes, Q07=yes, Q03=yes scores 3 ("deep ulcer with
// abscess or osteomyelitis"); everything else is entailed by the KO itself.
const WAGNER_ANSWERS_SCORE_3 = { Q01: false, Q02: false, Q06: true, Q07: true, Q03: true };
// Q01=no, Q02=no, Q06=no, Q10=yes deterministically scores 0 ("at-risk foot").
const WAGNER_ANSWERS_SCORE_0 = { Q01: false, Q02: false, Q06: false, Q10: true };

const BURDEN_ANSWERS_LOWER = {
  Q01: 'https://kgrid.org/cks/dfu-hbot-burden/providers/e-001',
  Q02: 5,
  Q03: 10,
  Q04: 'none'
};

function makeAskYesNo(answers) {
  return async (question) => answers[question.id];
}

function makeAskQuestion(answers) {
  return async (question) => answers[question.id];
}

function baseRequest({ dfuConfirmed = true, acuteSurgical = true, notHealed = false } = {}) {
  return {
    request_id: 'req-001',
    requested_at: '2026-09-20T12:00:00Z',
    index_time: '2026-09-20T10:00:00Z',
    subject_binding: {
      subject_identifier: SUBJECT,
      ulcer_identifier: ULCER,
      care_episode_identifier: CARE_EPISODE,
      source_evidence: testEvidence('subject-binding')
    },
    hbot_case_assertions: {
      dfu_confirmed: { value: dfuConfirmed, source_evidence: testEvidence('dfu-confirmed') },
      acute_surgical_intervention: { value: acuteSurgical, source_evidence: testEvidence('acute-surgery') },
      not_healed_after_30_days: { value: notHealed, source_evidence: testEvidence('not-healed') }
    },
    margolis_first_visit_assessment: {
      wound_area: { value: 1, ucum_code: 'cm2' },
      wound_duration: { value: 4, ucum_code: 'wk' },
      first_visit_at: '2026-09-10T09:00:00Z',
      measurement_method: 'Clinician-authored first-visit wound assessment',
      first_visit_attested: true,
      subject_identifier: SUBJECT,
      ulcer_identifier: ULCER,
      source_evidence: testEvidence('margolis-assessment', '2026-09-10T09:00:00Z')
    }
  };
}

function baseOptions({ wagnerAnswers, burdenAnswers = BURDEN_ANSWERS_LOWER } = {}) {
  return {
    wagnerAskYesNo: makeAskYesNo(wagnerAnswers),
    burdenAskQuestion: makeAskQuestion(burdenAnswers),
    collectionMetadata: {
      wagner: {
        source_artifact_iri: 'urn:teaching:wagner-response',
        completed_at: '2026-09-20T09:00:00Z',
        source_evidence: testEvidence('wagner')
      },
      burden: {
        source_artifact_iri: 'urn:teaching:burden-response',
        completed_at: '2026-09-20T09:00:00Z',
        treatment_plan_identifier: { system: 'https://example.org/plans', value: 'PLAN-001' },
        source_evidence: testEvidence('burden')
      }
    },
    planBinding: {
      treatment_plan_identifier: { system: 'https://example.org/plans', value: 'PLAN-001' },
      ulcer_identifier: ULCER,
      source_evidence: testEvidence('plan-for-ulcer')
    }
  };
}

async function runPrepared(request, options) {
  return (await prepareAndExecuteKnowledgeAssembly(request, options)).result;
}

test('supported gate with relatively-favorable prognosis and lower burden yields NEAR_TARGET', async () => {
  const request = baseRequest({ acuteSurgical: true });
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const result = await runPrepared(request, options);
  assert.equal(result.status, 'completed');
  assert.equal(result.target_classification, 'NEAR_TARGET');
  assert.equal(result.reason_code, REASON_CODES.SUPPORTED_SYNTHESIS);
  assert.equal(result.synthesis_rule_id, 'SYN-RF-L-10');
  assert.equal(result.gate_result, 'SUPPORTED');
  assert.equal(result.dependency_execution_records.length, 4);
  assert.deepEqual(
    result.dependency_execution_records.map((r) => r.dependency_role),
    ['DEP-WAGNER', 'DEP-HBOT-DECISION', 'DEP-BURDEN', 'DEP-MARGOLIS']
  );
  for (const record of result.dependency_execution_records) {
    assert.equal(record.state, 'completed_valid');
    assert.equal(record.engagement_mode, 'fresh_invocation');
    assert.equal(record.validation_status, 'valid');
  }
});

test('HBOT not-supported gate (Wagner grade <= 2) yields OFF_TARGET', async () => {
  const request = baseRequest();
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_0 });
  const result = await runPrepared(request, options);
  assert.equal(result.status, 'completed');
  assert.equal(result.target_classification, 'OFF_TARGET');
  assert.equal(result.reason_code, REASON_CODES.HBOT_NOT_SUPPORTED);
  assert.equal(result.gate_result, 'NOT_SUPPORTED');
  assert.equal(result.synthesis_rule_id, null);
});

test('dfu not confirmed yields OUT-OF-SCOPE INDETERMINATE', async () => {
  const request = baseRequest({ dfuConfirmed: false });
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const result = await runPrepared(request, options);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.target_classification, 'INDETERMINATE');
  assert.equal(result.reason_code, REASON_CODES.HBOT_OUT_OF_SCOPE);
  assert.equal(result.gate_result, 'OUT_OF_SCOPE');
});

test('malformed KA request yields KA-ERR-INPUT-VALIDATION with four not_attempted records', async () => {
  const result = await executeKnowledgeAssembly({ request_id: 'incomplete' });
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.target_classification, 'INDETERMINATE');
  assert.equal(result.reason_code, REASON_CODES.INPUT_VALIDATION);
  assert.equal(result.dependency_execution_records.length, 4);
  for (const record of result.dependency_execution_records) {
    assert.equal(record.state, 'not_attempted');
    assert.equal(record.not_attempted_reason_code, REASON_CODES.INPUT_VALIDATION);
  }
});

test('the closed core rejects a request missing its required response artifacts', async () => {
  const request = baseRequest();
  const result = await executeKnowledgeAssembly(request);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.INPUT_VALIDATION);
});

test('subject/ulcer mismatch across engagement inputs yields KA-ERR-SUBJECT-COHERENCE', async () => {
  const request = baseRequest();
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(request, options);
  prepared.request.wagner_response_artifact.ulcer_identifier = {
    system: 'https://example.org/ulcer', value: 'DIFFERENT-ULCER'
  };
  const result = await executeKnowledgeAssembly(prepared.request, { planBinding: options.planBinding });
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.SUBJECT_COHERENCE);
});

test('a preparation-stage collection error is not mistaken for a completed KA invocation', async () => {
  const request = baseRequest();
  const options = {
    ...baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }),
    wagnerAskYesNo: async () => {
      throw new Error('user cancelled the questionnaire');
    }
  };
  await assert.rejects(() => prepareAndExecuteKnowledgeAssembly(request, options), /user cancelled the questionnaire/);
});

test('the preparation interface supplies two artifacts and the closed core freshly analyzes them', async () => {
  const input = baseRequest();
  const prepared = await prepareKnowledgeAssemblyRequest(input, baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }));
  assert.deepEqual(prepared.sourceModes, { wagner: 'collected', burden: 'collected' });
  assert.equal(Object.keys(input).includes('wagner_response_artifact'), false);
  assert.ok(prepared.request.wagner_response_artifact);
  assert.ok(prepared.request.burden_questionnaire_artifact);
  const result = await executeKnowledgeAssembly(prepared.request, { planBinding: baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }).planBinding });
  assert.equal(result.status, 'completed');
  assert.equal(result.dependency_execution_records[0].engagement_mode, 'fresh_invocation');
  assert.equal(result.dependency_execution_records[0].input_artifact_locator, 'urn:teaching:wagner-response');
});

test('supplied artifacts are reused as inputs without recollecting, but computations run freshly', async () => {
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }));
  const noCollection = {
    planBinding: baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }).planBinding,
    wagnerAskYesNo: () => { throw new Error('Wagner recollection is forbidden'); },
    burdenAskQuestion: () => { throw new Error('Burden recollection is forbidden'); }
  };
  const reused = await prepareAndExecuteKnowledgeAssembly(prepared.request, noCollection);
  assert.deepEqual(reused.preparation.source_modes, { wagner: 'supplied', burden: 'supplied' });
  assert.equal(reused.result.status, 'completed');
  assert.ok(reused.result.dependency_execution_records.every((record) => record.engagement_mode === 'fresh_invocation'));
});

test('one supplied artifact does not prevent collection of the other', async () => {
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }));
  const partial = { ...prepared.request };
  delete partial.burden_questionnaire_artifact;
  const mixed = await prepareAndExecuteKnowledgeAssembly(partial, {
    ...baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }),
    wagnerAskYesNo: () => { throw new Error('Wagner recollection is forbidden'); }
  });
  assert.deepEqual(mixed.preparation.source_modes, { wagner: 'supplied', burden: 'collected' });
  assert.equal(mixed.result.status, 'completed');
});

test('a tampered supplied artifact fails provenance validation and is never recollected', async () => {
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }));
  prepared.request.wagner_response_artifact.responses[0] = '1';
  const result = await executeKnowledgeAssembly(prepared.request, { planBinding: baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 }).planBinding });
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.PROVENANCE);
  assert.ok(result.dependency_execution_records.every((record) => record.state === 'not_attempted'));
});

test('a future-dated Wagner completion is rejected before any constituent invocation', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  prepared.request.wagner_response_artifact.completed_at = '2026-09-20T10:01:00Z';
  const result = await executeKnowledgeAssembly(prepared.request, options);
  assert.equal(result.reason_code, REASON_CODES.TEMPORAL_COHERENCE);
  assert.ok(result.dependency_execution_records.every((record) => record.state === 'not_attempted'));
});

test('an expired current assertion is rejected before any constituent invocation', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  prepared.request.hbot_case_assertions.dfu_confirmed.source_evidence.valid_until = '2026-09-20T09:59:59Z';
  const result = await executeKnowledgeAssembly(prepared.request, options);
  assert.equal(result.reason_code, REASON_CODES.TEMPORAL_COHERENCE);
});

test('a plan bound to a different ulcer cannot be used for Burden', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  const result = await executeKnowledgeAssembly(prepared.request, {
    ...options,
    planBinding: { ...options.planBinding, ulcer_identifier: { ...ULCER, value: 'OTHER-ULCER' } }
  });
  assert.equal(result.reason_code, REASON_CODES.SUBJECT_COHERENCE);
});

test('a locator-only Wagner descriptor is not a complete CKS artifact', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  prepared.request.wagner_response_artifact = {
    artifact_locator: 'urn:legacy:response',
    media_type: 'application/json',
    response_fingerprint: `sha256:${'0'.repeat(64)}`
  };
  const result = await executeKnowledgeAssembly(prepared.request, options);
  assert.equal(result.reason_code, REASON_CODES.INPUT_VALIDATION);
});

test('an explicitly attested current assertion may omit valid_until', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  const evidence = prepared.request.hbot_case_assertions.dfu_confirmed.source_evidence;
  delete evidence.valid_until;
  const result = await executeKnowledgeAssembly(prepared.request, {
    ...options,
    currentnessAttestations: {
      dfu_confirmed: {
        source_record_iri: evidence.source_record_iri,
        index_time: prepared.request.index_time,
        attested_at: prepared.request.index_time,
        attestor_iri: evidence.author_or_respondent_iri
      }
    }
  });
  assert.equal(result.status, 'completed');
});

test('a plan binding without attributable evidence is not accepted', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  const result = await executeKnowledgeAssembly(prepared.request, {
    ...options,
    planBinding: { ...options.planBinding, source_evidence: undefined }
  });
  assert.equal(result.reason_code, REASON_CODES.PROVENANCE);
});

test('a supplied response with the wrong question-set version is not analyzed', async () => {
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const prepared = await prepareKnowledgeAssemblyRequest(baseRequest(), options);
  prepared.request.wagner_response_artifact.question_set_iri = 'urn:wrong-question-set';
  const result = await executeKnowledgeAssembly(prepared.request, options);
  assert.equal(result.reason_code, REASON_CODES.DEPENDENCY_VERSION);
  assert.ok(result.dependency_execution_records.every((record) => record.state === 'not_attempted'));
});
