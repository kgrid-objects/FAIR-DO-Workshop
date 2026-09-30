'use strict';

// Rebuildable, fictional teaching data. The generated records live in cases/.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { prepareKnowledgeAssemblyRequest } = require('../../src/preparation');
const { executeKnowledgeAssembly } = require('../../src/orchestrator');
const { buildSemanticTrace } = require('./semantic-trace');

const root = path.resolve(__dirname, '../..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'test/request.json'), 'utf8'));
const provider = 'https://kgrid.org/cks/dfu-hbot-burden/providers/e-001';
const scoreThree = { Q01: false, Q02: false, Q06: true, Q07: true, Q03: true };
const scoreZero = { Q01: false, Q02: false, Q06: false, Q10: true };
const definitions = [
  { id: 'case-1', title: 'A nearby facility', expected: 'ON_TARGET', area: 4, weeks: 10, wagner: scoreThree, minutes: 10, dfu: true },
  { id: 'case-2', title: 'A distant facility', expected: 'NEAR_TARGET', area: 4, weeks: 10, wagner: scoreThree, minutes: 70, dfu: true },
  { id: 'case-3', title: 'A different first visit', expected: 'OUTER_TARGET', area: 1, weeks: 4, wagner: scoreThree, minutes: 70, dfu: true },
  { id: 'case-4', title: 'Decision gate not supported', expected: 'OFF_TARGET', area: 1, weeks: 4, wagner: scoreZero, minutes: 10, dfu: true },
  { id: 'case-5', title: 'Outside the DFU scope', expected: 'INDETERMINATE', area: 1, weeks: 4, wagner: scoreThree, minutes: 10, dfu: false }
];

function evidence(id, role) {
  return {
    source_record_iri: `urn:teaching:${id}:${role}`,
    source_system_iri: 'urn:teaching:fictional-records',
    recorded_at: '2026-09-20T09:00:00Z',
    effective_at: '2026-09-20T09:00:00Z',
    valid_until: null,
    author_or_respondent_iri: `urn:teaching:${id}:fictional-respondent`,
    author_or_respondent_role: 'fictional_case_author',
    record_fingerprint: `sha256:${crypto.createHash('sha256').update(`${id}:${role}`).digest('hex')}`
  };
}

async function buildCase(definition) {
  const { id } = definition;
  const input = structuredClone(template);
  input.request_id = `teaching-${id}`;
  input.subject_binding.subject_identifier.value = `SUBJECT-${id}`;
  input.subject_binding.ulcer_identifier.value = `ULCER-${id}`;
  input.subject_binding.care_episode_identifier.value = `EPISODE-${id}`;
  input.subject_binding.source_evidence = evidence(id, 'subject-binding');
  for (const [key, assertion] of Object.entries(input.hbot_case_assertions)) {
    assertion.source_evidence = evidence(id, key);
  }
  input.hbot_case_assertions.dfu_confirmed.value = definition.dfu;
  input.margolis_first_visit_assessment.wound_area.value = definition.area;
  input.margolis_first_visit_assessment.wound_duration.value = definition.weeks;
  input.margolis_first_visit_assessment.subject_identifier = input.subject_binding.subject_identifier;
  input.margolis_first_visit_assessment.ulcer_identifier = input.subject_binding.ulcer_identifier;
  input.margolis_first_visit_assessment.source_evidence = {
    ...evidence(id, 'first-visit'),
    effective_at: input.margolis_first_visit_assessment.first_visit_at,
    recorded_at: input.margolis_first_visit_assessment.first_visit_at
  };
  for (const assertion of Object.values(input.hbot_case_assertions)) {
    assertion.source_evidence.valid_until = input.index_time;
  }

  const burdenAnswers = { Q01: provider, Q02: 5, Q03: definition.minutes, Q04: 'none' };
  const prepared = await prepareKnowledgeAssemblyRequest(input, {
    wagnerAskYesNo: async ({ id: questionId }) => definition.wagner[questionId],
    burdenAskQuestion: async ({ id: questionId }) => burdenAnswers[questionId],
    collectionMetadata: {
      wagner: {
        source_artifact_iri: `urn:teaching:${id}:wagner-response`,
        completed_at: '2026-09-20T09:30:00Z',
        source_evidence: evidence(id, 'wagner-response')
      },
      burden: {
        source_artifact_iri: `urn:teaching:${id}:burden-response`,
        completed_at: '2026-09-20T09:30:00Z',
        treatment_plan_identifier: { system: 'urn:teaching:treatment-plan', value: `PLAN-${id}` },
        source_evidence: evidence(id, 'burden-response')
      }
    }
  });
  const planBinding = {
    treatment_plan_identifier: prepared.request.burden_questionnaire_artifact.treatment_plan_identifier,
    ulcer_identifier: prepared.request.subject_binding.ulcer_identifier,
    source_evidence: { ...evidence(id, 'plan-for-ulcer'), valid_until: input.index_time }
  };
  const teachingEvidence = {};
  const result = await executeKnowledgeAssembly(prepared.request, { planBinding, teachingEvidence });
  if (result.target_classification !== definition.expected) {
    throw new Error(`${id}: expected ${definition.expected}, received ${result.target_classification} (${result.reason_code})`);
  }
  return {
    id, title: definition.title,
    teaching_note: `${definition.title} illustrates a distinct KA classification or gate outcome using one fictional patient–ulcer pair.`,
    expected: {
      target_classification: result.target_classification,
      gate_result: result.gate_result,
      synthesis_rule_id: result.synthesis_rule_id,
      reason_code: result.reason_code
    },
    semantic_trace: buildSemanticTrace(teachingEvidence, result),
    request: prepared.request,
    plan_binding: planBinding
  };
}

async function main() {
  const cases = [];
  for (const definition of definitions) cases.push(await buildCase(definition));
  process.stdout.write(JSON.stringify(cases, null, 2));
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { definitions, buildCase };
