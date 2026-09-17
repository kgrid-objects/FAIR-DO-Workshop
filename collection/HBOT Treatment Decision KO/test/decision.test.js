'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { evaluateFixture } = require('../src/decision');

const vectorsPath = path.join(
  __dirname,  
  'UHMS_Figure_6_DFU_HBO2_Algorithm_CKS_Canonical_Test_Vectors_1_0.json'
);

const vectorFile = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));

test('canonical vector count is 51', () => {
  assert.equal(vectorFile.vector_count, 51);
  assert.equal(vectorFile.vectors.length, 51);
});

for (const vector of vectorFile.vectors) {
  test(`canonical vector ${vector.test_id}`, () => {
    const actual = evaluateFixture(vector.input_fixture);
    assert.deepEqual(actual, vector.expected_result);
  });
}
