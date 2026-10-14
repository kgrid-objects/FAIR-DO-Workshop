'use strict';

// A stable, reviewable teaching projection of one real KA execution. This is
// deliberately separate from the closed, timestamped canonical KA result.
const ROLES = [
  ['wagner', 'DEP-WAGNER'],
  ['hbot_decision', 'DEP-HBOT-DECISION'],
  ['burden', 'DEP-BURDEN'],
  ['margolis', 'DEP-MARGOLIS']
];

const INCIDENTAL_KEYS = new Set([
  'result_instance_iri', 'issued_at', 'input_received_at', 'provenance'
]);

function stableNativeOutput(value) {
  if (Array.isArray(value)) return value.map(stableNativeOutput);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !INCIDENTAL_KEYS.has(key) && !/fingerprint/i.test(key))
      .map(([key, child]) => [key, stableNativeOutput(child)]));
  }
  return value;
}

function requireEvidence(evidence, result) {
  for (const [key, role] of ROLES) {
    const record = result.dependency_execution_records.find((item) => item.dependency_role === role);
    if (!record || record.state !== 'completed_valid' ||
        !evidence[key]?.invocation_request || !evidence[key]?.native_output) {
      throw new Error(`A complete ${role} invocation and native output are required for the teaching trace.`);
    }
  }
}

function buildSemanticTrace(evidence, result) {
  requireEvidence(evidence, result);
  const provenance = result.provenance;
  const transformations = result.transformations;
  const hasRule = (id) => transformations.some((item) => item.rule_id === id);
  for (const id of ['TX-01', 'TX-02', 'TX-03', 'TX-04']) {
    if (!hasRule(id)) throw new Error(`Missing KA handoff rule ${id}.`);
  }

  const ko_outputs = Object.fromEntries(ROLES.map(([key, role]) => [key, {
    produced_by: role,
    native_output: stableNativeOutput(evidence[key].native_output)
  }]));
  const handoffs = [
    {
      owned_by: 'KA', from: 'supplied_wagner_response', to: 'DEP-WAGNER',
      action: 'invoke', value: evidence.wagner.invocation_request
    },
    {
      owned_by: 'KA', from: 'margolis_first_visit_assessment', to: 'DEP-MARGOLIS',
      action: 'TX-03', value: evidence.margolis.invocation_request
    },
    {
      owned_by: 'KA', from: 'supplied_burden_response + fixed_regimen_range', to: 'DEP-BURDEN',
      action: 'TX-04', value: {
        questionnaire_response: evidence.burden.invocation_request.questionnaire_response.response_projection,
        fixed_regimen_range: evidence.burden.invocation_request.fixed_regimen_range_response.combined_range
      }
    },
    {
      owned_by: 'KA', from: 'DEP-WAGNER + hbot_case_assertions', to: 'DEP-HBOT-DECISION',
      action: 'TX-01 + TX-02', value: evidence.hbot_decision.invocation_request
    },
    {
      owned_by: 'KA', from: 'DEP-HBOT-DECISION.result_id', to: 'KA gate',
      action: provenance.gate_mapping_record.gate_mapping_rule_id,
      value: provenance.gate_mapping_record.native_result_identifier
    }
  ];
  const projections = (provenance.projection_records || []).map((item) => ({
    owned_by: 'KA', from: `${item.dependency_role}.native_output`, to: 'KA synthesis band',
    action: item.projection_rule_id, native_value: item.native_value,
    projected_value: item.projected_value
  }));
  handoffs.push(...projections);

  return {
    trace_version: 1,
    ko_outputs,
    handoffs,
    ka_decisions: {
      owned_by: 'KA',
      mandatory_join: {
        outcome: provenance.join_record.validation_outcome,
        dependency_states: provenance.join_record.observed_terminal_states
      },
      gate: {
        rule_id: provenance.gate_mapping_record.gate_mapping_rule_id,
        native_result_id: provenance.gate_mapping_record.native_result_identifier,
        result: result.gate_result
      },
      synthesis: provenance.synthesis_record ? {
        rule_id: provenance.synthesis_record.synthesis_rule_id,
        ordered_bands: provenance.synthesis_record.ordered_projection_values,
        target_classification: provenance.synthesis_record.target_classification
      } : null,
      final: {
        target_classification: result.target_classification,
        reason_code: result.reason_code
      }
    }
  };
}

module.exports = { buildSemanticTrace, stableNativeOutput };
