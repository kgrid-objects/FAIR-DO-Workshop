'use strict';

const { wagnerQuestionnaire, questionnaireLogic } = require('./dependency-packages');
const { fingerprintJson } = require('./fingerprint');
const { validateInputContract, validateSourceEvidence } = require('./input-validation');

const same = (a, b) => a && b && a.system === b.system && a.value === b.value;
const WAGNER_NATIVE_FIELDS = ['specification_iri', 'response_model_iri', 'question_set_iri',
  'question_ids', 'responses', 'directly_answered_questions', 'entailed_questions'];
const WAGNER_IDENTITY = {
  specification_iri: 'https://kgrid.org/cks/meggitt-wagner/versions/cks-1.0',
  response_model_iri: 'https://kgrid.org/cks/meggitt-wagner/response-models/1.0',
  question_set_iri: 'https://kgrid.org/cks/meggitt-wagner/question-sets/mw-qs-02/versions/1.0'
};

function wagnerNative(artifact) {
  return Object.fromEntries(WAGNER_NATIVE_FIELDS.map((field) => [field, artifact[field]]));
}
function burdenNative(artifact) {
  return {
    specification_iri: artifact.specification_iri,
    questionnaire_status: 'completed',
    response_model_iri: artifact.response_model_iri,
    provider_roster_version_iri: artifact.provider_roster_version_iri,
    response_projection: {
      hyperbaric_oxygen_therapy_location: artifact.hyperbaric_oxygen_therapy_location,
      one_way_miles: artifact.one_way_miles,
      one_way_travel_minutes: artifact.one_way_travel_minutes,
      weekday_attendance_difficulty: artifact.weekday_attendance_difficulty
    },
    confirmed: true
  };
}

function collectedWagner(response, request, metadata) {
  if (!metadata?.source_artifact_iri || !metadata?.completed_at || !metadata?.source_evidence) {
    throw new TypeError('Wagner collection needs source_artifact_iri, completed_at, and source_evidence.');
  }
  return {
    ...wagnerNative(response),
    completed_at: metadata.completed_at,
    subject_identifier: request.subject_binding.subject_identifier,
    ulcer_identifier: request.subject_binding.ulcer_identifier,
    source_artifact_iri: metadata.source_artifact_iri,
    artifact_fingerprint: fingerprintJson(response),
    source_evidence: metadata.source_evidence
  };
}
function collectedBurden(response, request, metadata) {
  if (!metadata?.source_artifact_iri || !metadata?.completed_at || !metadata?.source_evidence ||
      !metadata?.treatment_plan_identifier) {
    throw new TypeError('Burden collection needs source_artifact_iri, completed_at, treatment_plan_identifier, and source_evidence.');
  }
  return {
    specification_iri: response.specification_iri,
    response_model_iri: response.response_model_iri,
    provider_roster_version_iri: response.provider_roster_version_iri,
    confirmation_status: 'confirmed',
    ...response.response_projection,
    completed_at: metadata.completed_at,
    subject_identifier: request.subject_binding.subject_identifier,
    treatment_plan_identifier: metadata.treatment_plan_identifier,
    source_artifact_iri: metadata.source_artifact_iri,
    artifact_fingerprint: fingerprintJson(response),
    source_evidence: metadata.source_evidence
  };
}

// Only preparation permits absent questionnaire artifacts. The core does not.
async function prepareKnowledgeAssemblyRequest(input, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('KA preparation input must be an object.');
  const request = { ...input }, sourceModes = {};
  if (!request.wagner_response_artifact) {
    if (!request.subject_binding?.subject_identifier || !request.subject_binding?.ulcer_identifier) throw new TypeError('Subject and ulcer identifiers are needed before collection.');
    if (!options.collectionMetadata?.wagner) throw new TypeError('Wagner collection metadata is required.');
    const response = await wagnerQuestionnaire.runQuestionnaire(options.wagnerAskYesNo);
    request.wagner_response_artifact = collectedWagner(response, request, options.collectionMetadata.wagner);
    sourceModes.wagner = 'collected';
  } else sourceModes.wagner = 'supplied';
  if (!request.burden_questionnaire_artifact) {
    if (!request.subject_binding?.subject_identifier) throw new TypeError('Subject identifier is needed before collection.');
    if (!options.collectionMetadata?.burden) throw new TypeError('Burden collection metadata is required.');
    const response = await questionnaireLogic.runBurdenQuestionnaire(options.burdenAskQuestion);
    request.burden_questionnaire_artifact = collectedBurden(response, request, options.collectionMetadata.burden);
    sourceModes.burden = 'collected';
  } else sourceModes.burden = 'supplied';
  const contract = validateInputContract(request);
  if (!contract.valid) throw new TypeError(`Prepared KA request is invalid: ${contract.problems.map((p) => `${p.field}: ${p.message}`).join(' | ')}`);
  return { request, sourceModes };
}

function resolveKnowledgeAssemblyArtifacts(request, options = {}) {
  const wagner = request.wagner_response_artifact;
  const burden = request.burden_questionnaire_artifact;
  const wagnerResponse = wagnerNative(wagner);
  const burdenResponse = burdenNative(burden);
  for (const [field, expected] of Object.entries(WAGNER_IDENTITY)) {
    if (wagner[field] !== expected) {
      const error = new TypeError(`Wagner ${field} is not the bound version.`);
      error.reasonCode = 'KA-ERR-DEPENDENCY-VERSION';
      throw error;
    }
  }
  for (const [field, expected] of Object.entries({
    specification_iri: questionnaireLogic.SPECIFICATION_IRI,
    response_model_iri: questionnaireLogic.RESPONSE_MODEL_IRI,
    provider_roster_version_iri: questionnaireLogic.PROVIDER_ROSTER_VERSION_IRI
  })) {
    if (burden[field] !== expected) {
      const error = new TypeError(`Burden ${field} is not the bound version.`);
      error.reasonCode = 'KA-ERR-DEPENDENCY-VERSION';
      throw error;
    }
  }
  if (fingerprintJson(wagnerResponse) !== wagner.artifact_fingerprint ||
      fingerprintJson(burdenResponse) !== burden.artifact_fingerprint) {
    throw new TypeError('A questionnaire artifact does not match its declared fingerprint.');
  }
  const plan = options.planBinding;
  const evidenceProblems = [];
  validateSourceEvidence(plan?.source_evidence, 'planBinding.source_evidence', evidenceProblems);
  if (evidenceProblems.length || !same(plan?.treatment_plan_identifier, burden.treatment_plan_identifier)) {
    throw new TypeError('Attributable treatment-plan binding is required for the Burden artifact.');
  }
  const planEvidence = plan.source_evidence;
  const index = Date.parse(request.index_time), requested = Date.parse(request.requested_at);
  if (Date.parse(planEvidence.recorded_at) > requested || Date.parse(planEvidence.effective_at) > index ||
      Date.parse(planEvidence.effective_at) > Date.parse(planEvidence.recorded_at) ||
      (planEvidence.valid_until && Date.parse(planEvidence.valid_until) < index)) {
    const error = new TypeError('Treatment-plan evidence does not apply at the clinical index time.');
    error.reasonCode = 'KA-ERR-TEMPORAL-COHERENCE';
    throw error;
  }
  if (!same(plan.ulcer_identifier, request.subject_binding.ulcer_identifier)) {
    const error = new TypeError('Treatment plan does not apply to the bound ulcer.');
    error.reasonCode = 'KA-ERR-SUBJECT-COHERENCE';
    throw error;
  }
  return { wagner: wagnerResponse, burden: burdenResponse };
}

async function prepareAndExecuteKnowledgeAssembly(input, options = {}) {
  const prepared = await prepareKnowledgeAssemblyRequest(input, options);
  const { executeKnowledgeAssembly } = require('./orchestrator');
  const result = await executeKnowledgeAssembly(prepared.request, options);
  return { result, preparation: { source_modes: prepared.sourceModes, request: prepared.request } };
}

module.exports = {
  prepareKnowledgeAssemblyRequest, prepareAndExecuteKnowledgeAssembly,
  resolveKnowledgeAssemblyArtifacts
};
