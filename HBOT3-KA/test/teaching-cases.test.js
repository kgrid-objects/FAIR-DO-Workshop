'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { validateInputContract, checkSubjectCoherence, checkTemporalCoherence } = require('../src/input-validation');
const { executeKnowledgeAssembly } = require('../src/orchestrator');
const { prepareKnowledgeAssemblyRequest } = require('../src/preparation');
const { buildSemanticTrace } = require('../auxiliary/aux-teaching/semantic-trace');
const acceptedBaseline = require('../auxiliary/aux-teaching/accepted-three-case-baseline.v1.json');

const casesDir = path.resolve(__dirname, '../auxiliary/aux-teaching/cases');
const files = fs.readdirSync(casesDir).filter((file) => /^case-[1-5]\.json$/.test(file)).sort();

test('teaching set contains five ordered, complete fictional cases', () => {
  assert.deepEqual(files, ['case-1.json', 'case-2.json', 'case-3.json', 'case-4.json', 'case-5.json']);
});

test('first three cases change burden, then prognosis, without outcome-revealing titles', () => {
  const [first, second, third] = [1, 2, 3].map((number) =>
    JSON.parse(fs.readFileSync(path.join(casesDir, `case-${number}.json`), 'utf8')));
  const prognosis = (entry) => entry.request.margolis_first_visit_assessment;
  const burden = (entry) => entry.request.burden_questionnaire_artifact;
  assert.equal(prognosis(first).wound_area.value, prognosis(second).wound_area.value);
  assert.equal(prognosis(first).wound_duration.value, prognosis(second).wound_duration.value);
  assert.notDeepEqual(burden(first), burden(second));
  assert.equal(prognosis(second).wound_area.value !== prognosis(third).wound_area.value, true);
  assert.equal(prognosis(second).wound_duration.value !== prognosis(third).wound_duration.value, true);
  assert.deepEqual(burden(second).responses, burden(third).responses);
  for (const entry of [first, second, third]) {
    assert.doesNotMatch(entry.title, /on.target|near.target|outer.target|supported|indeterminate/i);
  }
});

test('version 1 acceptance baseline fixes the three-case sequence independently of generation', () => {
  assert.equal(acceptedBaseline.baseline_version, 1);
  assert.deepEqual(acceptedBaseline.cases.map((entry) => entry.id), ['case-1', 'case-2', 'case-3']);
  const [first, second, third] = acceptedBaseline.cases;
  assert.equal(first.inputs.wound_area_cm2, second.inputs.wound_area_cm2);
  assert.equal(first.inputs.wound_duration_weeks, second.inputs.wound_duration_weeks);
  assert.notEqual(first.inputs.one_way_travel_minutes, second.inputs.one_way_travel_minutes);
  assert.equal(second.inputs.one_way_travel_minutes, third.inputs.one_way_travel_minutes);
  assert.notEqual(second.inputs.wound_area_cm2, third.inputs.wound_area_cm2);
  assert.notEqual(second.inputs.wound_duration_weeks, third.inputs.wound_duration_weeks);
  assert.deepEqual(acceptedBaseline.cases.map((entry) => entry.ka.classification),
    ['ON_TARGET', 'NEAR_TARGET', 'OUTER_TARGET']);
});

for (const accepted of acceptedBaseline.cases) {
  test(`${accepted.id} matches the independent version 1 acceptance baseline`, async () => {
    const entry = JSON.parse(fs.readFileSync(path.join(casesDir, `${accepted.id}.json`), 'utf8'));
    const request = entry.request;
    assert.equal(validateInputContract(request).valid, true);
    assert.equal(checkSubjectCoherence(request).coherent, true);
    assert.equal(checkTemporalCoherence(request).coherent, true);
    const subject = request.subject_binding.subject_identifier;
    const ulcer = request.subject_binding.ulcer_identifier;
    const plan = entry.plan_binding.treatment_plan_identifier;
    assert.deepEqual(request.margolis_first_visit_assessment.subject_identifier, subject);
    assert.deepEqual(request.margolis_first_visit_assessment.ulcer_identifier, ulcer);
    assert.deepEqual(request.wagner_response_artifact.subject_identifier, subject);
    assert.deepEqual(request.wagner_response_artifact.ulcer_identifier, ulcer);
    assert.deepEqual(request.burden_questionnaire_artifact.subject_identifier, subject);
    assert.deepEqual(entry.plan_binding.ulcer_identifier, ulcer);
    assert.deepEqual(request.burden_questionnaire_artifact.treatment_plan_identifier, plan);

    const teachingEvidence = {};
    const result = await executeKnowledgeAssembly(request, {
      planBinding: entry.plan_binding, teachingEvidence
    });
    const projections = result.provenance.projection_records;
    const observed = {
      id: entry.id,
      title: entry.title,
      identity: {
        subject: subject.value,
        ulcer: ulcer.value,
        episode: request.subject_binding.care_episode_identifier.value,
        plan: plan.value
      },
      inputs: {
        wound_area_cm2: request.margolis_first_visit_assessment.wound_area.value,
        wound_duration_weeks: request.margolis_first_visit_assessment.wound_duration.value,
        one_way_travel_minutes: request.burden_questionnaire_artifact.one_way_travel_minutes
      },
      ko_outputs: {
        wagner_score: teachingEvidence.wagner.native_output.wagner_score[0],
        hbot_result_id: teachingEvidence.hbot_decision.native_output.result_id,
        hbot_rule_id: teachingEvidence.hbot_decision.native_output.rule_id,
        burden_result_code: teachingEvidence.burden.native_output.result_code,
        burden_category: teachingEvidence.burden.native_output.execution_burden_level.category,
        margolis_group: teachingEvidence.margolis.native_output.prognostic_group,
        margolis_healing_probability_16_weeks:
          teachingEvidence.margolis.native_output.healing_probability_16_weeks
      },
      ka: {
        join: result.provenance.join_record.validation_outcome,
        gate_rule: result.provenance.gate_mapping_record.gate_mapping_rule_id,
        gate: result.gate_result,
        prognosis_band: projections[0].projected_value,
        burden_band: projections[1].projected_value,
        synthesis_rule: result.synthesis_rule_id,
        classification: result.target_classification,
        reason_code: result.reason_code
      }
    };
    assert.deepEqual(observed, accepted);
    assert.equal(teachingEvidence.hbot_decision.invocation_request.wagner_grade,
      accepted.ko_outputs.wagner_score);
    assert.equal(teachingEvidence.burden.invocation_request.questionnaire_response
      .response_projection.one_way_travel_minutes, accepted.inputs.one_way_travel_minutes);
    assert.equal(teachingEvidence.margolis.invocation_request.wound_area.value,
      accepted.inputs.wound_area_cm2);
    assert.equal(teachingEvidence.margolis.invocation_request.wound_duration.value,
      accepted.inputs.wound_duration_weeks);
  });
}

for (const file of files) {
  test(`${file} preserves its declared KA outcome without recollecting responses`, async () => {
    const entry = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
    assert.equal(validateInputContract(entry.request).valid, true);
    assert.equal(checkSubjectCoherence(entry.request).coherent, true);
    assert.equal(checkTemporalCoherence(entry.request).coherent, true);
    assert.ok(entry.teaching_note);
    assert.equal(entry.plan_binding.ulcer_identifier.value, entry.request.subject_binding.ulcer_identifier.value);
    assert.equal(entry.plan_binding.treatment_plan_identifier.value,
      entry.request.burden_questionnaire_artifact.treatment_plan_identifier.value);
    const teachingEvidence = {};
    const result = await executeKnowledgeAssembly(entry.request, {
      planBinding: entry.plan_binding, teachingEvidence
    });
    assert.equal(result.target_classification, entry.expected.target_classification);
    assert.equal(result.gate_result, entry.expected.gate_result);
    assert.equal(result.synthesis_rule_id, entry.expected.synthesis_rule_id);
    assert.equal(result.reason_code, entry.expected.reason_code);
    const trace = buildSemanticTrace(teachingEvidence, result);
    assert.deepEqual(trace, entry.semantic_trace);
    assert.deepEqual(Object.keys(trace.ko_outputs), ['wagner', 'hbot_decision', 'burden', 'margolis']);
    assert.ok(trace.handoffs.every((handoff) => handoff.owned_by === 'KA'));
    assert.equal(trace.ka_decisions.owned_by, 'KA');
    assert.equal(trace.ka_decisions.mandatory_join.outcome, 'pass');
    assert.equal(trace.ko_outputs.wagner.native_output.wagner_score[0],
      trace.handoffs.find((handoff) => handoff.to === 'DEP-HBOT-DECISION').value.wagner_grade);
    assert.deepEqual(trace.handoffs.find((handoff) => handoff.to === 'DEP-MARGOLIS').value.wound_area,
      {
        value: entry.request.margolis_first_visit_assessment.wound_area.value,
        ucum_code: entry.request.margolis_first_visit_assessment.wound_area.ucum_code
      });
    assert.equal(trace.handoffs.find((handoff) => handoff.to === 'DEP-BURDEN').value
      .questionnaire_response.one_way_travel_minutes,
    trace.ko_outputs.burden.native_output.objective_burden.reported_one_way_travel.minutes);
    assert.equal(trace.ka_decisions.gate.native_result_id,
      trace.ko_outputs.hbot_decision.native_output.result_id);
    assert.equal(trace.ka_decisions.synthesis?.rule_id || null, entry.expected.synthesis_rule_id);
    if (trace.ka_decisions.synthesis) {
      assert.deepEqual(trace.ka_decisions.synthesis.ordered_bands,
        trace.handoffs.filter((handoff) => handoff.to === 'KA synthesis band')
          .map((handoff) => handoff.projected_value));
    }
    assert.doesNotMatch(JSON.stringify(trace), /urn:uuid:|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i);
    const secondEvidence = {};
    const repeated = await executeKnowledgeAssembly(entry.request, {
      planBinding: entry.plan_binding, teachingEvidence: secondEvidence
    });
    assert.deepEqual(buildSemanticTrace(secondEvidence, repeated), trace);
    const prepared = await prepareKnowledgeAssemblyRequest(entry.request, {
      wagnerAskYesNo: () => { throw new Error('Unexpected Wagner recollection'); },
      burdenAskQuestion: () => { throw new Error('Unexpected Burden recollection'); }
    });
    assert.deepEqual(prepared.sourceModes, { wagner: 'supplied', burden: 'supplied' });
  });
}
