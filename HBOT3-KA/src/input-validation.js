'use strict';

// Section 2.5 / 2.7 (as narrowed for this implementation): closed KA
// input-envelope validation and subject/ulcer/temporal coherence checks.
// Wagner and Burden questionnaire answers are intentionally excluded from
// this contract: only the Wagner and Burden KOs' own interactive
// Questionnaire Logic capability may collect them (Section 3.1), so the KA
// never accepts them as request fields, optional or otherwise.

const TOP_LEVEL_FIELDS = [
  'request_id',
  'requested_at',
  'index_time',
  'subject_binding',
  'hbot_case_assertions',
  'margolis_first_visit_assessment'
];

const HBOT_ASSERTION_FIELDS = [
  'dfu_confirmed',
  'acute_surgical_intervention',
  'not_healed_after_30_days'
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDateTime(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

function fail(message, path) {
  return { field: path, message };
}

// Returns { valid: boolean, problems: [{field, message}] }.
function validateInputContract(request) {
  const problems = [];

  if (!isPlainObject(request)) {
    return { valid: false, problems: [fail('KA request must be a JSON object.', '$')] };
  }

  const unknown = Object.keys(request).filter((key) => !TOP_LEVEL_FIELDS.includes(key));
  if (unknown.length) {
    problems.push(fail(`Unknown top-level field(s): ${unknown.join(', ')}.`, '$'));
  }
  for (const field of TOP_LEVEL_FIELDS) {
    if (!(field in request) || request[field] === null || request[field] === undefined) {
      problems.push(fail(`Required field is missing or null: ${field}.`, field));
    }
  }
  if (problems.length) return { valid: false, problems };

  if (!isIsoDateTime(request.requested_at)) {
    problems.push(fail('requested_at must be a valid UTC date-time.', 'requested_at'));
  }
  if (!isIsoDateTime(request.index_time)) {
    problems.push(fail('index_time must be a valid UTC date-time.', 'index_time'));
  }
  if (
    isIsoDateTime(request.requested_at) &&
    isIsoDateTime(request.index_time) &&
    new Date(request.index_time).getTime() > new Date(request.requested_at).getTime()
  ) {
    problems.push(fail('index_time SHALL NOT be later than requested_at.', 'index_time'));
  }

  if (!isPlainObject(request.subject_binding)) {
    problems.push(fail('subject_binding must be an object.', 'subject_binding'));
  } else {
    for (const idField of ['subject_identifier', 'ulcer_identifier', 'care_episode_identifier']) {
      const id = request.subject_binding[idField];
      if (!isPlainObject(id) || typeof id.system !== 'string' || typeof id.value !== 'string') {
        problems.push(
          fail(`subject_binding.${idField} must contain system and value.`, `subject_binding.${idField}`)
        );
      }
    }
  }

  if (!isPlainObject(request.hbot_case_assertions)) {
    problems.push(fail('hbot_case_assertions must be an object.', 'hbot_case_assertions'));
  } else {
    for (const field of HBOT_ASSERTION_FIELDS) {
      const assertion = request.hbot_case_assertions[field];
      if (!isPlainObject(assertion) || typeof assertion.value !== 'boolean') {
        problems.push(
          fail(
            `hbot_case_assertions.${field} must be an explicit attested Boolean.`,
            `hbot_case_assertions.${field}`
          )
        );
      }
    }
  }

  const margolisAssessment = request.margolis_first_visit_assessment;
  if (
    !isPlainObject(margolisAssessment) ||
    !isPlainObject(margolisAssessment.wound_area) ||
    !isPlainObject(margolisAssessment.wound_duration) ||
    !isIsoDateTime(margolisAssessment.first_visit_at) ||
    margolisAssessment.first_visit_attested !== true
  ) {
    problems.push(
      fail(
        'margolis_first_visit_assessment must contain wound_area, wound_duration, first_visit_at, and first_visit_attested=true.',
        'margolis_first_visit_assessment'
      )
    );
  }

  // Section 2.7.2: acceptable timing by input (basic as-of ordering).
  if (isIsoDateTime(request.index_time)) {
    const indexMs = new Date(request.index_time).getTime();
    if (isIsoDateTime(margolisAssessment && margolisAssessment.first_visit_at)) {
      if (new Date(margolisAssessment.first_visit_at).getTime() > indexMs) {
        problems.push(
          fail(
            'margolis_first_visit_assessment.first_visit_at SHALL NOT be later than index_time.',
            'margolis_first_visit_assessment.first_visit_at'
          )
        );
      }
    }
  }

  return { valid: problems.length === 0, problems };
}

// Section 2.7: subject/ulcer identity coherence across engagement inputs.
function checkSubjectCoherence(request) {
  const problems = [];
  const subjectId = request.subject_binding && request.subject_binding.subject_identifier;
  const ulcerId = request.subject_binding && request.subject_binding.ulcer_identifier;

  const sameId = (a, b) => a && b && a.system === b.system && a.value === b.value;

  const margolisAssessment = request.margolis_first_visit_assessment || {};

  if (margolisAssessment.subject_identifier && !sameId(margolisAssessment.subject_identifier, subjectId)) {
    problems.push(fail('margolis_first_visit_assessment subject does not match subject_binding.', 'margolis_first_visit_assessment.subject_identifier'));
  }
  if (margolisAssessment.ulcer_identifier && !sameId(margolisAssessment.ulcer_identifier, ulcerId)) {
    problems.push(fail('margolis_first_visit_assessment ulcer does not match subject_binding.', 'margolis_first_visit_assessment.ulcer_identifier'));
  }

  return { coherent: problems.length === 0, problems };
}

module.exports = {
  TOP_LEVEL_FIELDS,
  HBOT_ASSERTION_FIELDS,
  isPlainObject,
  isIsoDateTime,
  validateInputContract,
  checkSubjectCoherence
};
