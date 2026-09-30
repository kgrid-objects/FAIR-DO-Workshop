'use strict';

// Section 2.5 / 2.7: the core accepts a complete, closed KA envelope.
// Optional collection belongs to the separate preparation interface.

const TOP_LEVEL_FIELDS = [
  'request_id',
  'requested_at',
  'index_time',
  'subject_binding',
  'hbot_case_assertions',
  'wagner_response_artifact',
  'margolis_first_visit_assessment',
  'burden_questionnaire_artifact'
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
  return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function fail(message, path) {
  return { field: path, message };
}

function isAbsoluteIri(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9+.-]*:[^\s]+$/i.test(value);
}

function validIdentifier(value) {
  return isPlainObject(value) &&
    typeof value.system === 'string' && value.system.length > 0 &&
    typeof value.value === 'string' && value.value.length > 0;
}

function validateSourceEvidence(value, path, problems) {
  const fields = ['source_record_iri', 'source_system_iri', 'recorded_at', 'effective_at',
    'valid_until', 'author_or_respondent_iri', 'author_or_respondent_role', 'record_fingerprint'];
  if (!isPlainObject(value) || fields.some((field) => !(field in value)) ||
      Object.keys(value).some((field) => !fields.includes(field))) {
    problems.push(fail('source_evidence must contain exactly the declared evidence fields.', path));
    return;
  }
  for (const field of ['source_record_iri', 'source_system_iri', 'author_or_respondent_iri']) {
    if (!isAbsoluteIri(value[field])) {
      problems.push(fail(`${field} must be an absolute IRI.`, `${path}.${field}`));
    }
  }
  for (const field of ['recorded_at', 'effective_at']) {
    if (!isIsoDateTime(value[field])) problems.push(fail(`${field} must be a date-time.`, `${path}.${field}`));
  }
  if (value.valid_until !== null && !isIsoDateTime(value.valid_until)) {
    problems.push(fail('valid_until must be a date-time or null.', `${path}.valid_until`));
  }
  if (typeof value.author_or_respondent_role !== 'string' || !value.author_or_respondent_role) {
    problems.push(fail('author_or_respondent_role is required.', `${path}.author_or_respondent_role`));
  }
  if (!/^sha256:[0-9a-f]{64}$/.test(value.record_fingerprint)) {
    problems.push(fail('record_fingerprint must be SHA-256.', `${path}.record_fingerprint`));
  }
}

function validateResponseArtifact(value, kind, problems) {
  const path = `${kind}_response_artifact`;
  const fields = kind === 'wagner'
    ? ['artifact_locator', 'media_type', 'response_fingerprint', 'completed_at', 'source_evidence']
    : ['artifact_locator', 'media_type', 'response_fingerprint', 'confirmed_at',
      'treatment_plan_identifier', 'treatment_location', 'source_evidence'];
  if (!isPlainObject(value) || fields.some((field) => !(field in value)) ||
      Object.keys(value).some((field) => !fields.includes(field))) {
    problems.push(fail(`${path} must contain exactly the schema-bundle fields.`, path));
    return;
  }
  if (!isAbsoluteIri(value.artifact_locator)) {
    problems.push(fail('artifact_locator must be an absolute IRI.', `${path}.artifact_locator`));
  }
  if (value.media_type !== 'application/json') problems.push(fail('media_type must be application/json.', `${path}.media_type`));
  if (!/^sha256:[0-9a-f]{64}$/.test(value.response_fingerprint)) {
    problems.push(fail('response_fingerprint must be SHA-256.', `${path}.response_fingerprint`));
  }
  const timeField = kind === 'wagner' ? 'completed_at' : 'confirmed_at';
  if (!isIsoDateTime(value[timeField])) problems.push(fail(`${timeField} must be a date-time.`, `${path}.${timeField}`));
  if (kind === 'burden') {
    if (!validIdentifier(value.treatment_plan_identifier)) {
      problems.push(fail('treatment_plan_identifier must contain system and value.', `${path}.treatment_plan_identifier`));
    }
    if (typeof value.treatment_location !== 'string' || !value.treatment_location) {
      problems.push(fail('treatment_location is required.', `${path}.treatment_location`));
    }
  }
  validateSourceEvidence(value.source_evidence, `${path}.source_evidence`, problems);
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

  validateResponseArtifact(request.wagner_response_artifact, 'wagner', problems);
  validateResponseArtifact(request.burden_questionnaire_artifact, 'burden', problems);

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
  const assessmentFields = ['wound_area', 'wound_duration', 'assessment_time', 'source_evidence'];
  if (!isPlainObject(margolisAssessment) || assessmentFields.some((field) => !(field in margolisAssessment)) ||
      Object.keys(margolisAssessment).some((field) => !assessmentFields.includes(field))) {
    problems.push(fail('margolis_first_visit_assessment must match the closed schema-bundle fields.', 'margolis_first_visit_assessment'));
  } else {
    if (!isIsoDateTime(margolisAssessment.assessment_time)) {
      problems.push(fail('assessment_time must be a date-time.', 'margolis_first_visit_assessment.assessment_time'));
    }
    validateSourceEvidence(margolisAssessment.source_evidence, 'margolis_first_visit_assessment.source_evidence', problems);
    for (const field of ['wound_area', 'wound_duration']) {
      const quantity = margolisAssessment[field];
      const allowedUnits = field === 'wound_area' ? ['cm2', 'mm2'] : ['wk', 'd'];
      if (!isPlainObject(quantity) || Object.keys(quantity).some((key) => !['value', 'unit', 'source_evidence'].includes(key)) ||
          !Number.isFinite(quantity.value) || quantity.value <= 0 || !allowedUnits.includes(quantity.unit)) {
        problems.push(fail(`${field} needs a positive value, supported unit, and source evidence.`, `margolis_first_visit_assessment.${field}`));
      } else {
        validateSourceEvidence(quantity.source_evidence, `margolis_first_visit_assessment.${field}.source_evidence`, problems);
      }
    }
  }

  // Section 2.7.2: acceptable timing by input (basic as-of ordering).
  if (isIsoDateTime(request.index_time)) {
    const indexMs = new Date(request.index_time).getTime();
    if (isIsoDateTime(margolisAssessment && margolisAssessment.assessment_time)) {
      if (new Date(margolisAssessment.assessment_time).getTime() > indexMs) {
        problems.push(
          fail(
            'margolis_first_visit_assessment.assessment_time SHALL NOT be later than index_time.',
            'margolis_first_visit_assessment.assessment_time'
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
