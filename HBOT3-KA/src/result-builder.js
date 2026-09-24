'use strict';

const crypto = require('node:crypto');
const { KA_SPECIFICATION_IRI, RESULT_MODEL_IRI } = require('./provenance');

const SEMANTIC_QUALIFIER =
  'This target-zone classification describes position within this knowledge assembly only. It does not predict HBOT efficacy or benefit, recommend or authorize treatment, rank or prioritize patients, or calculate treatment utility.';

const TITLES = {
  ON_TARGET: 'On Target',
  NEAR_TARGET: 'Near Target',
  OUTER_TARGET: 'Outer Target',
  OFF_TARGET: 'Off Target',
  INDETERMINATE: 'Indeterminate'
};

const SUPPORTED_SUMMARY_BY_CLASS = {
  ON_TARGET:
    'HBOT is supported by the constituent decision result. Within supported cases, the validated prognosis and execution-burden combination places this case in the On Target zone of this knowledge assembly.',
  NEAR_TARGET:
    'HBOT is supported by the constituent decision result. Within supported cases, the validated prognosis and execution-burden combination places this case in the Near Target zone of this knowledge assembly.',
  OUTER_TARGET:
    'HBOT is supported by the constituent decision result. Within supported cases, the validated prognosis and execution-burden combination places this case in the Outer Target zone of this knowledge assembly.'
};

// Section 7.6: closed display object.
function buildDisplay(targetClassification, reasonCode) {
  const title = TITLES[targetClassification] || 'Indeterminate';
  let summary;
  if (SUPPORTED_SUMMARY_BY_CLASS[targetClassification]) {
    summary = SUPPORTED_SUMMARY_BY_CLASS[targetClassification];
  } else if (targetClassification === 'OFF_TARGET') {
    summary =
      'The validated constituent HBOT Decision did not support HBOT. The completed KA classification is Off Target.';
  } else {
    summary = `The KA could not produce a completed target classification. Controlling reason: ${reasonCode}.`;
  }
  return {
    title,
    summary,
    semantic_qualifier: SEMANTIC_QUALIFIER
  };
}

// Section 7.3: closed canonical result schema.
function buildFinalResult({
  executionId,
  status,
  targetClassification,
  reasonCode,
  diagnostics,
  gateResult,
  synthesisRuleId,
  dependencyExecutionRecords,
  transformations,
  provenance,
  warnings
}) {
  const resultInstanceIri = `https://kgrid.org/cks/hbot-treatment-target-ka/result-instances/${crypto.randomUUID()}`;
  const result = {
    result_instance_iri: resultInstanceIri,
    ka_specification_iri: KA_SPECIFICATION_IRI,
    result_model_iri: RESULT_MODEL_IRI,
    execution_id: executionId,
    issued_at: new Date().toISOString(),
    status,
    target_classification: targetClassification,
    reason_code: reasonCode,
    diagnostics,
    display: buildDisplay(targetClassification, reasonCode),
    gate_result: gateResult,
    synthesis_rule_id: synthesisRuleId,
    dependency_execution_records: dependencyExecutionRecords,
    transformations,
    provenance,
    warnings
  };
  return result;
}

module.exports = { SEMANTIC_QUALIFIER, TITLES, buildDisplay, buildFinalResult };
