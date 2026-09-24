'use strict';

// Regression test that ports the CKS Version 1.0 canonical-fixture oracle
// (specs/HBOT_Treatment_Target_KA_Canonical_Fixtures_1_0/run_fixtures.py)
// onto this package's real gate-mapping, synthesis, and reason-code exports,
// so the 65-case canonical suite is exercised against actual library code
// for the KA-owned gate/synthesis/precedence logic.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { mapGate } = require('../src/gate-mapping');
const { lookupMatrix } = require('../src/synthesis');
const { REASON_CODES } = require('../src/errors');

const fixturesPath = path.join(
  __dirname,
  '..',
  'specs',
  'HBOT_Treatment_Target_KA_Canonical_Fixtures_1_0',
  'canonical-fixtures.json'
);
const suite = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

const ROLES = ['DEP-WAGNER', 'DEP-HBOT-DECISION', 'DEP-BURDEN', 'DEP-MARGOLIS'];

const INJECTED_CONDITION_PRECEDENCE = [
  ['input_validation', REASON_CODES.INPUT_VALIDATION],
  ['identity_mismatch', REASON_CODES.DEPENDENCY_IDENTITY],
  ['version_mismatch', REASON_CODES.DEPENDENCY_VERSION],
  ['dependency_unavailable', REASON_CODES.DEPENDENCY_UNAVAILABLE],
  ['invocation_failure', REASON_CODES.INVOCATION],
  ['native_failure', REASON_CODES.CONSTITUENT_RESULT],
  ['output_contract', REASON_CODES.OUTPUT_CONTRACT],
  ['subject_incoherence', REASON_CODES.SUBJECT_COHERENCE],
  ['temporal_incoherence', REASON_CODES.TEMPORAL_COHERENCE],
  ['provenance_failure', REASON_CODES.PROVENANCE],
  ['transformation_failure', REASON_CODES.TRANSFORMATION],
  ['cached_engagement', REASON_CODES.JOIN_INCOMPLETE],
  ['join_incomplete', REASON_CODES.JOIN_INCOMPLETE],
  ['result_construction', REASON_CODES.RESULT_CONSTRUCTION]
];

const SPECIAL_SYNTHESIS_CONDITIONS = {
  synthesis_unknown_projection: REASON_CODES.SYNTHESIS_UNKNOWN_PROJECTION,
  synthesis_nonconforming: REASON_CODES.SYNTHESIS_COMBINATION_NONCONFORMING,
  synthesis_undefined: REASON_CODES.SYNTHESIS_COMBINATION_UNDEFINED,
  synthesis_disputed: REASON_CODES.SYNTHESIS_COMBINATION_DISPUTED
};

function evaluate(given) {
  const conditions = new Set((given.injected_conditions || []).map((c) => c.code));

  for (const [code, reason] of INJECTED_CONDITION_PRECEDENCE) {
    if (conditions.has(code)) {
      return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: reason, gate_result: 'NOT_EVALUABLE', synthesis_rule_id: null };
    }
  }

  const records = given.dependency_engagements;
  const joinOk =
    records.map((r) => r.role).join(',') === ROLES.join(',') &&
    records.every(
      (r) => r.state === 'completed_valid' && r.engagement_mode === 'fresh_invocation' && r.validation_status === 'valid'
    );
  if (!joinOk) {
    return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: REASON_CODES.JOIN_INCOMPLETE, gate_result: 'NOT_EVALUABLE', synthesis_rule_id: null };
  }

  const gate = mapGate(given.hbot_native_result);
  if (gate === null) {
    return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: REASON_CODES.GATE_UNDEFINED, gate_result: 'NOT_EVALUABLE', synthesis_rule_id: null };
  }
  if (gate === 'NOT_SUPPORTED') {
    return { status: 'completed', target_classification: 'OFF_TARGET', reason_code: REASON_CODES.HBOT_NOT_SUPPORTED, gate_result: gate, synthesis_rule_id: null };
  }
  if (gate === 'INSUFFICIENT_DECISION') {
    return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: REASON_CODES.HBOT_INSUFFICIENT_DECISION, gate_result: gate, synthesis_rule_id: null };
  }
  if (gate === 'OUT_OF_SCOPE') {
    return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: REASON_CODES.HBOT_OUT_OF_SCOPE, gate_result: gate, synthesis_rule_id: null };
  }

  for (const [code, reason] of Object.entries(SPECIAL_SYNTHESIS_CONDITIONS)) {
    if (conditions.has(code)) {
      return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: reason, gate_result: 'SUPPORTED', synthesis_rule_id: null };
    }
  }

  const hit = lookupMatrix(given.prognosis_projection, given.burden_projection);
  if (!hit) {
    return { status: 'indeterminate', target_classification: 'INDETERMINATE', reason_code: REASON_CODES.SYNTHESIS_COMBINATION_UNDEFINED, gate_result: 'SUPPORTED', synthesis_rule_id: null };
  }
  return { status: 'completed', target_classification: hit.targetClassification, reason_code: REASON_CODES.SUPPORTED_SYNTHESIS, gate_result: 'SUPPORTED', synthesis_rule_id: hit.ruleId };
}

test('canonical fixture suite metadata', () => {
  assert.equal(suite.suite_id, 'HBOT-TREATMENT-TARGET-KA-CANONICAL-FIXTURES');
  assert.equal(suite.fixtures.length, 65);
});

for (const fixture of suite.fixtures) {
  test(`canonical fixture ${fixture.fixture_id}`, () => {
    const actual = evaluate(fixture.given);
    const expected = fixture.expect;
    assert.equal(actual.status, expected.status);
    assert.equal(actual.target_classification, expected.target_classification);
    assert.equal(actual.reason_code, expected.reason_code);
    assert.equal(actual.gate_result, expected.gate_result);
    assert.equal(actual.synthesis_rule_id, expected.synthesis_rule_id);
    assert.equal(actual.status === 'completed', expected.completed_classification_permitted);
  });
}
