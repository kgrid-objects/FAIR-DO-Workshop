'use strict';

// Closed KA envelope from CKS 2.5; collection occurs only before this boundary.
const TOP_LEVEL_FIELDS = ['request_id', 'requested_at', 'index_time', 'subject_binding',
  'hbot_case_assertions', 'wagner_response_artifact', 'margolis_first_visit_assessment',
  'burden_questionnaire_artifact'];
const HBOT_ASSERTION_FIELDS = ['dfu_confirmed', 'acute_surgical_intervention', 'not_healed_after_30_days'];
const EVIDENCE_FIELDS = ['source_record_iri', 'source_system_iri', 'recorded_at', 'effective_at',
  'author_or_respondent_iri', 'author_or_respondent_role', 'record_fingerprint'];
const WAGNER_FIELDS = ['specification_iri', 'response_model_iri', 'question_set_iri', 'question_ids',
  'responses', 'directly_answered_questions', 'entailed_questions', 'completed_at',
  'subject_identifier', 'ulcer_identifier', 'source_artifact_iri', 'artifact_fingerprint', 'source_evidence'];
const BURDEN_FIELDS = ['specification_iri', 'response_model_iri', 'provider_roster_version_iri',
  'confirmation_status', 'hyperbaric_oxygen_therapy_location', 'one_way_miles',
  'one_way_travel_minutes', 'weekday_attendance_difficulty', 'completed_at',
  'subject_identifier', 'treatment_plan_identifier', 'source_artifact_iri',
  'artifact_fingerprint', 'source_evidence'];
const MARGOLIS_FIELDS = ['wound_area', 'wound_duration', 'first_visit_at', 'measurement_method',
  'first_visit_attested', 'subject_identifier', 'ulcer_identifier', 'source_evidence'];
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isIsoDateTime = (v) => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v) &&
  !Number.isNaN(Date.parse(v));
const isAbsoluteIri = (v) => typeof v === 'string' && /^[a-z][a-z0-9+.-]*:[^\s]+$/i.test(v);
const fail = (message, field) => ({ field, message });

function closed(v, required, path, problems, optional = []) {
  if (!isPlainObject(v) || required.some((k) => !(k in v)) ||
      Object.keys(v).some((k) => !required.includes(k) && !optional.includes(k))) {
    problems.push(fail('Missing or unknown field in closed object.', path));
    return false;
  }
  return true;
}
function identifier(v, path, problems) {
  if (closed(v, ['system', 'value'], path, problems) &&
      (!isAbsoluteIri(v.system) || typeof v.value !== 'string' || !v.value)) {
    problems.push(fail('Identifier requires absolute system IRI and nonempty value.', path));
  }
}
function evidence(v, path, problems) {
  if (!closed(v, EVIDENCE_FIELDS, path, problems, ['valid_until'])) return;
  for (const field of ['source_record_iri', 'source_system_iri', 'author_or_respondent_iri']) {
    if (!isAbsoluteIri(v[field])) problems.push(fail('Absolute IRI required.', `${path}.${field}`));
  }
  for (const field of ['recorded_at', 'effective_at']) {
    if (!isIsoDateTime(v[field])) problems.push(fail('Explicit-offset date-time required.', `${path}.${field}`));
  }
  if ('valid_until' in v && v.valid_until !== null && !isIsoDateTime(v.valid_until)) {
    problems.push(fail('Date-time or null required.', `${path}.valid_until`));
  }
  if (typeof v.author_or_respondent_role !== 'string' || !v.author_or_respondent_role) {
    problems.push(fail('Respondent role required.', `${path}.author_or_respondent_role`));
  }
  if (!/^sha256:[0-9a-f]{64}$/.test(v.record_fingerprint)) {
    problems.push(fail('SHA-256 fingerprint required.', `${path}.record_fingerprint`));
  }
}
function strings(v, path, problems) {
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string' && x)) {
    problems.push(fail('Array of nonempty strings required.', path));
  }
}
function iriFields(v, fields, path, problems) {
  for (const field of fields) if (!isAbsoluteIri(v[field])) problems.push(fail('Absolute IRI required.', `${path}.${field}`));
}
function validateInputContract(request) {
  const problems = [];
  if (!closed(request, TOP_LEVEL_FIELDS, '$', problems)) return { valid: false, problems };
  if (typeof request.request_id !== 'string' || !request.request_id) problems.push(fail('Request ID required.', 'request_id'));
  for (const field of ['requested_at', 'index_time']) {
    if (!isIsoDateTime(request[field])) problems.push(fail('Explicit-offset date-time required.', field));
  }
  const binding = request.subject_binding;
  if (closed(binding, ['subject_identifier', 'ulcer_identifier', 'care_episode_identifier', 'source_evidence'], 'subject_binding', problems)) {
    for (const field of ['subject_identifier', 'ulcer_identifier', 'care_episode_identifier']) identifier(binding[field], `subject_binding.${field}`, problems);
    evidence(binding.source_evidence, 'subject_binding.source_evidence', problems);
  }
  const assertions = request.hbot_case_assertions;
  if (closed(assertions, HBOT_ASSERTION_FIELDS, 'hbot_case_assertions', problems)) {
    for (const field of HBOT_ASSERTION_FIELDS) {
      const path = `hbot_case_assertions.${field}`, a = assertions[field];
      if (closed(a, ['value', 'source_evidence'], path, problems)) {
        if (typeof a.value !== 'boolean') problems.push(fail('Explicit Boolean required.', `${path}.value`));
        evidence(a.source_evidence, `${path}.source_evidence`, problems);
      }
    }
  }
  const w = request.wagner_response_artifact, wp = 'wagner_response_artifact';
  if (closed(w, WAGNER_FIELDS, wp, problems)) {
    iriFields(w, ['specification_iri', 'response_model_iri', 'question_set_iri', 'source_artifact_iri'], wp, problems);
    for (const field of ['question_ids', 'responses', 'directly_answered_questions', 'entailed_questions']) strings(w[field], `${wp}.${field}`, problems);
    if (Array.isArray(w.question_ids) && Array.isArray(w.responses) && w.question_ids.length !== w.responses.length) problems.push(fail('Question and response arrays must align.', `${wp}.responses`));
    if (!isIsoDateTime(w.completed_at)) problems.push(fail('Completion time required.', `${wp}.completed_at`));
    identifier(w.subject_identifier, `${wp}.subject_identifier`, problems);
    identifier(w.ulcer_identifier, `${wp}.ulcer_identifier`, problems);
    if (!/^sha256:[0-9a-f]{64}$/.test(w.artifact_fingerprint)) problems.push(fail('SHA-256 fingerprint required.', `${wp}.artifact_fingerprint`));
    evidence(w.source_evidence, `${wp}.source_evidence`, problems);
  }
  const m = request.margolis_first_visit_assessment, mp = 'margolis_first_visit_assessment';
  if (closed(m, MARGOLIS_FIELDS, mp, problems)) {
    for (const [field, units] of [['wound_area', ['cm2', 'mm2']], ['wound_duration', ['wk', 'd']]]) {
      const q = m[field], path = `${mp}.${field}`;
      if (closed(q, ['value', 'ucum_code'], path, problems) && (!Number.isFinite(q.value) || q.value <= 0 || !units.includes(q.ucum_code))) problems.push(fail('Positive value and accepted UCUM code required.', path));
    }
    if (!isIsoDateTime(m.first_visit_at)) problems.push(fail('First-visit time required.', `${mp}.first_visit_at`));
    if (typeof m.measurement_method !== 'string' || !m.measurement_method) problems.push(fail('Measurement method required.', `${mp}.measurement_method`));
    if (m.first_visit_attested !== true) problems.push(fail('First visit must be attested.', `${mp}.first_visit_attested`));
    identifier(m.subject_identifier, `${mp}.subject_identifier`, problems);
    identifier(m.ulcer_identifier, `${mp}.ulcer_identifier`, problems);
    evidence(m.source_evidence, `${mp}.source_evidence`, problems);
  }
  const b = request.burden_questionnaire_artifact, bp = 'burden_questionnaire_artifact';
  if (closed(b, BURDEN_FIELDS, bp, problems)) {
    iriFields(b, ['specification_iri', 'response_model_iri', 'provider_roster_version_iri', 'hyperbaric_oxygen_therapy_location', 'source_artifact_iri'], bp, problems);
    if (b.confirmation_status !== 'confirmed') problems.push(fail('Artifact must be confirmed.', `${bp}.confirmation_status`));
    for (const field of ['one_way_miles', 'one_way_travel_minutes']) if (!Number.isFinite(b[field]) || b[field] < 0) problems.push(fail('Nonnegative number required.', `${bp}.${field}`));
    if (!['none', 'some', 'major'].includes(b.weekday_attendance_difficulty)) problems.push(fail('Unsupported difficulty.', `${bp}.weekday_attendance_difficulty`));
    if (!isIsoDateTime(b.completed_at)) problems.push(fail('Completion time required.', `${bp}.completed_at`));
    identifier(b.subject_identifier, `${bp}.subject_identifier`, problems);
    identifier(b.treatment_plan_identifier, `${bp}.treatment_plan_identifier`, problems);
    if (!/^sha256:[0-9a-f]{64}$/.test(b.artifact_fingerprint)) problems.push(fail('SHA-256 fingerprint required.', `${bp}.artifact_fingerprint`));
    evidence(b.source_evidence, `${bp}.source_evidence`, problems);
  }
  return { valid: problems.length === 0, problems };
}
function checkSubjectCoherence(request) {
  const problems = [], binding = request.subject_binding;
  const same = (a, b) => a.system === b.system && a.value === b.value;
  for (const [name, artifact] of [
    ['wagner_response_artifact', request.wagner_response_artifact],
    ['margolis_first_visit_assessment', request.margolis_first_visit_assessment],
    ['burden_questionnaire_artifact', request.burden_questionnaire_artifact]
  ]) {
    if (!same(artifact.subject_identifier, binding.subject_identifier)) problems.push(fail('Subject differs from binding.', `${name}.subject_identifier`));
    if (artifact.ulcer_identifier && !same(artifact.ulcer_identifier, binding.ulcer_identifier)) problems.push(fail('Ulcer differs from binding.', `${name}.ulcer_identifier`));
  }
  return { coherent: problems.length === 0, problems };
}
function checkTemporalCoherence(request, options = {}) {
  const problems = [], index = Date.parse(request.index_time), requested = Date.parse(request.requested_at);
  if (index > requested) problems.push(fail('index_time follows requested_at.', 'index_time'));
  if (index > Date.now()) problems.push(fail('Future index_time is prohibited.', 'index_time'));
  for (const [path, source] of [
    ['subject_binding', request.subject_binding],
    ...HBOT_ASSERTION_FIELDS.map((field) => [`hbot_case_assertions.${field}`, request.hbot_case_assertions[field]]),
    ['wagner_response_artifact', request.wagner_response_artifact],
    ['margolis_first_visit_assessment', request.margolis_first_visit_assessment],
    ['burden_questionnaire_artifact', request.burden_questionnaire_artifact]
  ]) {
    const e = source.source_evidence;
    if (Date.parse(e.recorded_at) > requested) problems.push(fail('Recorded after request.', `${path}.source_evidence.recorded_at`));
    if (Date.parse(e.effective_at) > Date.parse(e.recorded_at)) problems.push(fail('Effective after recorded.', `${path}.source_evidence.effective_at`));
    if (Date.parse(e.effective_at) > index) problems.push(fail('Future clinical fact.', `${path}.source_evidence.effective_at`));
    if (e.valid_until && Date.parse(e.valid_until) < index) problems.push(fail('Evidence expired.', `${path}.source_evidence.valid_until`));
  }
  for (const [path, value] of [
    ['wagner_response_artifact.completed_at', request.wagner_response_artifact.completed_at],
    ['margolis_first_visit_assessment.first_visit_at', request.margolis_first_visit_assessment.first_visit_at],
    ['burden_questionnaire_artifact.completed_at', request.burden_questionnaire_artifact.completed_at]
  ]) if (Date.parse(value) > index) problems.push(fail('Input after index_time.', path));
  if (Date.parse(request.margolis_first_visit_assessment.source_evidence.effective_at) !==
      Date.parse(request.margolis_first_visit_assessment.first_visit_at)) {
    problems.push(fail('Source must describe the attested first visit.', 'margolis_first_visit_assessment.source_evidence.effective_at'));
  }
  for (const field of HBOT_ASSERTION_FIELDS) {
    const e = request.hbot_case_assertions[field].source_evidence;
    const attestation = options.currentnessAttestations?.[field];
    const explicitCurrentness = attestation?.source_record_iri === e.source_record_iri &&
      attestation?.index_time === request.index_time &&
      isAbsoluteIri(attestation?.attestor_iri) && isIsoDateTime(attestation?.attested_at) &&
      Date.parse(attestation.attested_at) >= index && Date.parse(attestation.attested_at) <= requested;
    if (!e.valid_until && !explicitCurrentness) {
      problems.push(fail('Currentness at index_time is not attested.', `hbot_case_assertions.${field}.source_evidence.valid_until`));
    }
  }
  return { coherent: problems.length === 0, problems };
}
module.exports = { TOP_LEVEL_FIELDS, HBOT_ASSERTION_FIELDS, isPlainObject, isIsoDateTime,
  validateSourceEvidence: evidence, validateInputContract, checkSubjectCoherence, checkTemporalCoherence };
