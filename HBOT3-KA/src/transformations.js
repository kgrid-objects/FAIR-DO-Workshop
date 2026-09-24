'use strict';

const { fingerprintJson } = require('./fingerprint');

// Section 5.5: the closed register of permitted routing/representation
// transformations. No other transformation may be applied by the KA.

// TX-01: Wagner wagner_score[0] -> HBOT Decision wagner_grade.
function tx01WagnerToHbotGrade(wagnerResult) {
  if (
    !wagnerResult ||
    wagnerResult.analysis_status !== 'grade_computed' ||
    !Array.isArray(wagnerResult.wagner_score) ||
    wagnerResult.wagner_score.length !== 1 ||
    !Array.isArray(wagnerResult.grade_label) ||
    wagnerResult.grade_label.length !== 1 ||
    !Number.isInteger(wagnerResult.wagner_score[0])
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    wagnerGrade: wagnerResult.wagner_score[0],
    record: {
      transformation_id: 'TX-01',
      source_path: 'wagner_result.wagner_score[0]',
      destination_path: 'hbot_decision_request.wagner_grade',
      operation: 'unwrap_and_rename',
      before_fingerprint: fingerprintJson(wagnerResult.wagner_score),
      after_fingerprint: fingerprintJson(wagnerResult.wagner_score[0]),
      rule_id: 'TX-01',
      semantic_preservation_status: 'affirmed'
    }
  };
}

// TX-02: authoritative Boolean assertion -> exact lowercase string.
function tx02BooleanToString(value, destinationPath) {
  if (typeof value !== 'boolean') {
    return { ok: false };
  }
  const serialized = value ? 'true' : 'false';
  return {
    ok: true,
    serialized,
    record: {
      transformation_id: 'TX-02',
      source_path: `hbot_case_assertions.${destinationPath}.value`,
      destination_path: `hbot_decision_request.${destinationPath}`,
      operation: 'boolean_to_lowercase_string',
      before_fingerprint: fingerprintJson(value),
      after_fingerprint: fingerprintJson(serialized),
      rule_id: 'TX-02',
      semantic_preservation_status: 'affirmed'
    }
  };
}

// TX-03: first-visit assessment -> Margolis wound_area / wound_duration.
function tx03FirstVisitToMargolisQuantities(assessment) {
  const isFiniteQuantity = (q, allowedUnits) =>
    q &&
    typeof q === 'object' &&
    typeof q.value === 'number' &&
    Number.isFinite(q.value) &&
    allowedUnits.includes(q.ucum_code);

  if (
    !assessment ||
    !isFiniteQuantity(assessment.wound_area, ['cm2', 'mm2']) ||
    !isFiniteQuantity(assessment.wound_duration, ['wk', 'd'])
  ) {
    return { ok: false };
  }

  const woundArea = { value: assessment.wound_area.value, ucum_code: assessment.wound_area.ucum_code };
  const woundDuration = {
    value: assessment.wound_duration.value,
    ucum_code: assessment.wound_duration.ucum_code
  };

  return {
    ok: true,
    woundArea,
    woundDuration,
    record: {
      transformation_id: 'TX-03',
      source_path: 'margolis_first_visit_assessment',
      destination_path: 'margolis_request.{wound_area,wound_duration}',
      operation: 'construct_closed_quantities',
      before_fingerprint: fingerprintJson({
        wound_area: assessment.wound_area,
        wound_duration: assessment.wound_duration
      }),
      after_fingerprint: fingerprintJson({ wound_area: woundArea, wound_duration: woundDuration }),
      rule_id: 'TX-03',
      semantic_preservation_status: 'affirmed'
    }
  };
}

// TX-04: the Burden KO's own Questionnaire Logic capability already returns a
// closed, completed questionnaire_response object; the KA only adds the
// fixed regimen response and wrapping fields. No field is trimmed,
// flattened, or recomputed.
function tx04FromQuestionnaireResponse(questionnaireResponse, fixedRegimenRangeResponse) {
  if (!questionnaireResponse || questionnaireResponse.confirmed !== true) {
    return { ok: false };
  }
  const request = {
    request_type: 'calculate_burden_range',
    provider_roster_version_iri: questionnaireResponse.provider_roster_version_iri,
    questionnaire_response: questionnaireResponse,
    fixed_regimen_range_response: fixedRegimenRangeResponse
  };
  return {
    ok: true,
    request,
    record: {
      transformation_id: 'TX-04',
      source_path: 'burden_questionnaire_logic_response + fixed_regimen_range_response',
      destination_path: 'burden_request',
      operation: 'construct_closed_composite_request',
      before_fingerprint: fingerprintJson({ questionnaireResponse, fixedRegimenRangeResponse }),
      after_fingerprint: fingerprintJson(request),
      rule_id: 'TX-04',
      semantic_preservation_status: 'affirmed'
    }
  };
}

// TX-05: constituent invocation/native return -> KA dependency-execution and
// provenance records. Copies identifiers/evidence and computes KA
// fingerprints outside the closed constituent objects.
function tx05ProvenanceRecord(dependencyRole, request, nativeResult) {
  return {
    transformation_id: 'TX-05',
    source_path: `${dependencyRole}.invocation`,
    destination_path: `${dependencyRole}.dependency_execution_record`,
    operation: 'record_provenance',
    before_fingerprint: fingerprintJson(request),
    after_fingerprint: fingerprintJson(nativeResult),
    rule_id: 'TX-05',
    semantic_preservation_status: 'affirmed'
  };
}

module.exports = {
  tx01WagnerToHbotGrade,
  tx02BooleanToString,
  tx03FirstVisitToMargolisQuantities,
  tx04FromQuestionnaireResponse,
  tx05ProvenanceRecord
};
