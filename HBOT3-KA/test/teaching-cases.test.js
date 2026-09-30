'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { validateInputContract } = require('../src/input-validation');
const { executeKnowledgeAssembly } = require('../src/orchestrator');
const { prepareKnowledgeAssemblyRequest } = require('../src/preparation');

const casesDir = path.resolve(__dirname, '../auxiliary/aux-teaching/cases');
const files = fs.readdirSync(casesDir).filter((file) => /^case-[1-5]\.json$/.test(file)).sort();

test('teaching set contains five ordered, complete fictional cases', () => {
  assert.deepEqual(files, ['case-1.json', 'case-2.json', 'case-3.json', 'case-4.json', 'case-5.json']);
});

for (const file of files) {
  test(`${file} preserves its declared KA outcome without recollecting responses`, async () => {
    const entry = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
    assert.equal(validateInputContract(entry.request).valid, true);
    assert.ok(entry.teaching_note);
    const result = await executeKnowledgeAssembly(entry.request, { artifactPayloads: entry.artifact_payloads });
    assert.equal(result.target_classification, entry.expected.target_classification);
    assert.equal(result.gate_result, entry.expected.gate_result);
    assert.equal(result.reason_code, entry.expected.reason_code);
    const prepared = await prepareKnowledgeAssemblyRequest(entry.request, {
      artifactPayloads: entry.artifact_payloads,
      wagnerAskYesNo: () => { throw new Error('Unexpected Wagner recollection'); },
      burdenAskQuestion: () => { throw new Error('Unexpected Burden recollection'); }
    });
    assert.deepEqual(prepared.sourceModes, { wagner: 'supplied', burden: 'supplied' });
  });
}
