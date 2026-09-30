'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const schema = require('../specs/HBOT_Treatment_Target_KA_Schema_Bundle_1_0.json');
const { validateInputContract } = require('../src/input-validation');
const firstCase = require('../auxiliary/aux-teaching/cases/case-1.json');

const expected = {
  wagner_response_artifact: [
    'specification_iri', 'response_model_iri', 'question_set_iri', 'question_ids',
    'responses', 'directly_answered_questions', 'entailed_questions', 'completed_at',
    'subject_identifier', 'ulcer_identifier', 'source_artifact_iri',
    'artifact_fingerprint', 'source_evidence'
  ],
  margolis_first_visit_assessment: [
    'wound_area', 'wound_duration', 'first_visit_at', 'measurement_method',
    'first_visit_attested', 'subject_identifier', 'ulcer_identifier', 'source_evidence'
  ],
  burden_questionnaire_artifact: [
    'specification_iri', 'response_model_iri', 'provider_roster_version_iri',
    'confirmation_status', 'hyperbaric_oxygen_therapy_location', 'one_way_miles',
    'one_way_travel_minutes', 'weekday_attendance_difficulty', 'completed_at',
    'subject_identifier', 'treatment_plan_identifier', 'source_artifact_iri',
    'artifact_fingerprint', 'source_evidence'
  ]
};

test('machine-readable closed input artifacts use the CKS 2.5 fields', () => {
  const properties = schema.$defs.kaRequest.properties;
  for (const [field, keys] of Object.entries(expected)) {
    assert.deepEqual(Object.keys(properties[field].properties), keys);
    assert.deepEqual(properties[field].required, keys);
    assert.equal(properties[field].additionalProperties, false);
    assert.deepEqual(Object.keys(firstCase.request[field]), keys);
  }
});

test('valid_until is optional source evidence, not a required field', () => {
  assert.equal(schema.$defs.sourceEvidence.required.includes('valid_until'), false);
  const copy = structuredClone(firstCase.request);
  delete copy.subject_binding.source_evidence.valid_until;
  assert.equal(validateInputContract(copy).valid, true);
});
