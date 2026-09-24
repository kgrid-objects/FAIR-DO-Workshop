'use strict';

// Section 6.3 / DEC-SYN-03A: native Margolis prognostic group projection.
const PROGNOSIS_PROJECTION = {
  AREA_GE_2__DURATION_GE_8: 'VERY_UNFAVORABLE_PROGNOSIS_BAND',
  AREA_GE_2__DURATION_LT_8: 'UNFAVORABLE_PROGNOSIS_BAND',
  AREA_LT_2__DURATION_GE_8: 'INTERMEDIATE_PROGNOSIS_BAND',
  AREA_LT_2__DURATION_LT_8: 'RELATIVELY_FAVORABLE_PROGNOSIS_BAND'
};

// Section 6.4 / DEC-SYN-02A: native Treatment Burden category projection.
const BURDEN_PROJECTION = {
  low_execution_burden: 'LOWER_BURDEN_BAND',
  moderate_execution_burden: 'MIDDLE_BURDEN_BAND',
  high_execution_burden: 'HIGHER_BURDEN_BAND',
  very_high_execution_burden: 'HIGHER_BURDEN_BAND',
  extreme_execution_burden: 'HIGHER_BURDEN_BAND'
};

// Section 7.10: the twelve approved supported-case synthesis cells.
const MATRIX = {
  'VERY_UNFAVORABLE_PROGNOSIS_BAND|LOWER_BURDEN_BAND': ['SYN-VU-L-01', 'ON_TARGET'],
  'VERY_UNFAVORABLE_PROGNOSIS_BAND|MIDDLE_BURDEN_BAND': ['SYN-VU-M-02', 'ON_TARGET'],
  'VERY_UNFAVORABLE_PROGNOSIS_BAND|HIGHER_BURDEN_BAND': ['SYN-VU-H-03', 'NEAR_TARGET'],
  'UNFAVORABLE_PROGNOSIS_BAND|LOWER_BURDEN_BAND': ['SYN-U-L-04', 'ON_TARGET'],
  'UNFAVORABLE_PROGNOSIS_BAND|MIDDLE_BURDEN_BAND': ['SYN-U-M-05', 'NEAR_TARGET'],
  'UNFAVORABLE_PROGNOSIS_BAND|HIGHER_BURDEN_BAND': ['SYN-U-H-06', 'NEAR_TARGET'],
  'INTERMEDIATE_PROGNOSIS_BAND|LOWER_BURDEN_BAND': ['SYN-I-L-07', 'NEAR_TARGET'],
  'INTERMEDIATE_PROGNOSIS_BAND|MIDDLE_BURDEN_BAND': ['SYN-I-M-08', 'NEAR_TARGET'],
  'INTERMEDIATE_PROGNOSIS_BAND|HIGHER_BURDEN_BAND': ['SYN-I-H-09', 'OUTER_TARGET'],
  'RELATIVELY_FAVORABLE_PROGNOSIS_BAND|LOWER_BURDEN_BAND': ['SYN-RF-L-10', 'NEAR_TARGET'],
  'RELATIVELY_FAVORABLE_PROGNOSIS_BAND|MIDDLE_BURDEN_BAND': ['SYN-RF-M-11', 'OUTER_TARGET'],
  'RELATIVELY_FAVORABLE_PROGNOSIS_BAND|HIGHER_BURDEN_BAND': ['SYN-RF-H-12', 'OUTER_TARGET']
};

function projectPrognosis(nativeGroup) {
  return Object.prototype.hasOwnProperty.call(PROGNOSIS_PROJECTION, nativeGroup)
    ? PROGNOSIS_PROJECTION[nativeGroup]
    : null;
}

function projectBurden(nativeCategory) {
  return Object.prototype.hasOwnProperty.call(BURDEN_PROJECTION, nativeCategory)
    ? BURDEN_PROJECTION[nativeCategory]
    : null;
}

// Section 7.11: exact ordered-pair matrix lookup. No interpolation,
// extrapolation, weighting, or neighbor-cell substitution is permitted.
function lookupMatrix(prognosisBand, burdenBand) {
  const key = `${prognosisBand}|${burdenBand}`;
  const hit = MATRIX[key];
  return hit ? { ruleId: hit[0], targetClassification: hit[1] } : null;
}

module.exports = {
  PROGNOSIS_PROJECTION,
  BURDEN_PROJECTION,
  MATRIX,
  projectPrognosis,
  projectBurden,
  lookupMatrix
};
