'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { executeKnowledgeAssembly } = require('../src/orchestrator');
const { REASON_CODES } = require('../src/errors');

const SUBJECT = { system: 'https://example.org/mrn', value: 'MRN-001' };
const ULCER = { system: 'https://example.org/ulcer', value: 'ULCER-001' };
const CARE_EPISODE = { system: 'https://example.org/episode', value: 'EPISODE-001' };

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
      source_evidence: {}
    },
    hbot_case_assertions: {
      dfu_confirmed: { value: dfuConfirmed, source_evidence: {} },
      acute_surgical_intervention: { value: acuteSurgical, source_evidence: {} },
      not_healed_after_30_days: { value: notHealed, source_evidence: {} }
    },
    margolis_first_visit_assessment: {
      wound_area: { value: 1, ucum_code: 'cm2' },
      wound_duration: { value: 4, ucum_code: 'wk' },
      first_visit_at: '2026-09-10T09:00:00Z',
      first_visit_attested: true,
      subject_identifier: SUBJECT,
      ulcer_identifier: ULCER
    }
  };
}

function baseOptions({ wagnerAnswers, burdenAnswers = BURDEN_ANSWERS_LOWER } = {}) {
  return {
    wagnerAskYesNo: makeAskYesNo(wagnerAnswers),
    burdenAskQuestion: makeAskQuestion(burdenAnswers)
  };
}

test('supported gate with relatively-favorable prognosis and lower burden yields NEAR_TARGET', async () => {
  const request = baseRequest({ acuteSurgical: true });
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const result = await executeKnowledgeAssembly(request, options);
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
  const result = await executeKnowledgeAssembly(request, options);
  assert.equal(result.status, 'completed');
  assert.equal(result.target_classification, 'OFF_TARGET');
  assert.equal(result.reason_code, REASON_CODES.HBOT_NOT_SUPPORTED);
  assert.equal(result.gate_result, 'NOT_SUPPORTED');
  assert.equal(result.synthesis_rule_id, null);
});

test('dfu not confirmed yields OUT-OF-SCOPE INDETERMINATE', async () => {
  const request = baseRequest({ dfuConfirmed: false });
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const result = await executeKnowledgeAssembly(request, options);
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

test('a wagner_response_artifact or burden_questionnaire_artifact field is rejected as unknown', async () => {
  const request = baseRequest();
  request.wagner_response_artifact = { question_ids: [], responses: [] };
  const result = await executeKnowledgeAssembly(request);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.INPUT_VALIDATION);
});

test('subject/ulcer mismatch across engagement inputs yields KA-ERR-SUBJECT-COHERENCE', async () => {
  const request = baseRequest();
  request.margolis_first_visit_assessment.ulcer_identifier = {
    system: 'https://example.org/ulcer',
    value: 'DIFFERENT-ULCER'
  };
  const options = baseOptions({ wagnerAnswers: WAGNER_ANSWERS_SCORE_3 });
  const result = await executeKnowledgeAssembly(request, options);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.SUBJECT_COHERENCE);
});

test('an interactive collection error yields KA-ERR-INVOCATION for the affected role', async () => {
  const request = baseRequest();
  const options = {
    wagnerAskYesNo: async () => {
      throw new Error('user cancelled the questionnaire');
    },
    burdenAskQuestion: makeAskQuestion(BURDEN_ANSWERS_LOWER)
  };
  const result = await executeKnowledgeAssembly(request, options);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.reason_code, REASON_CODES.INVOCATION);
  const wagnerRecord = result.dependency_execution_records.find((r) => r.dependency_role === 'DEP-WAGNER');
  assert.equal(wagnerRecord.state, 'invocation_failure');
});
