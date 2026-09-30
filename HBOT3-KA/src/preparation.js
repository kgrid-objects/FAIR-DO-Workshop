'use strict';

const { wagnerQuestionnaire, questionnaireLogic } = require('./dependency-packages');
const { fingerprintJson } = require('./fingerprint');
const { validateInputContract } = require('./input-validation');

function sameIdentifier(a, b) {
  return a && b && a.system === b.system && a.value === b.value;
}

function preparedArtifact(kind, response, request, metadata) {
  const timeField = kind === 'wagner' ? 'completed_at' : 'confirmed_at';
  if (!metadata || !metadata.artifact_locator || !metadata.source_evidence || !metadata[timeField]) {
    throw new TypeError(`${kind} collection requires an artifact locator, ${timeField}, and attributable source evidence.`);
  }
  const descriptor = {
    artifact_locator: metadata.artifact_locator,
    media_type: 'application/json',
    response_fingerprint: fingerprintJson(response),
    ...(kind === 'wagner'
      ? { completed_at: metadata.completed_at }
      : {
          confirmed_at: metadata.confirmed_at,
          treatment_plan_identifier: metadata.treatment_plan_identifier,
          treatment_location: response.response_projection.hyperbaric_oxygen_therapy_location
        }),
    source_evidence: metadata.source_evidence
  };
  const payload = {
    response,
    subject_identifier: request.subject_binding.subject_identifier,
    ulcer_identifier: request.subject_binding.ulcer_identifier,
    ...(kind === 'burden' ? { treatment_plan_identifier: metadata.treatment_plan_identifier } : {})
  };
  return { descriptor, payload };
}

// Preparation is the only interface where either artifact may be absent.
// It never fabricates source evidence, identifiers, or questionnaire answers.
async function prepareKnowledgeAssemblyRequest(input, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('KA preparation input must be an object.');
  const request = { ...input };
  const artifactPayloads = { ...(options.artifactPayloads || {}) };
  const sourceModes = {};

  if (!request.wagner_response_artifact) {
    if (!request.subject_binding?.subject_identifier || !request.subject_binding?.ulcer_identifier) {
      throw new TypeError('Subject and ulcer identifiers are required before questionnaire collection.');
    }
    if (!options.collectionMetadata?.wagner?.artifact_locator || !options.collectionMetadata?.wagner?.completed_at ||
        !options.collectionMetadata?.wagner?.source_evidence) {
      throw new TypeError('Wagner collection requires an artifact locator, completed_at, and attributable source evidence.');
    }
    const response = await wagnerQuestionnaire.runQuestionnaire(options.wagnerAskYesNo);
    const prepared = preparedArtifact('wagner', response, request, options.collectionMetadata?.wagner);
    request.wagner_response_artifact = prepared.descriptor;
    artifactPayloads[prepared.descriptor.artifact_locator] = prepared.payload;
    sourceModes.wagner = 'collected';
  } else {
    sourceModes.wagner = 'supplied';
  }

  if (!request.burden_questionnaire_artifact) {
    if (!request.subject_binding?.subject_identifier || !request.subject_binding?.ulcer_identifier) {
      throw new TypeError('Subject and ulcer identifiers are required before questionnaire collection.');
    }
    if (!options.collectionMetadata?.burden?.artifact_locator || !options.collectionMetadata?.burden?.confirmed_at ||
        !options.collectionMetadata?.burden?.source_evidence ||
        !options.collectionMetadata?.burden?.treatment_plan_identifier) {
      throw new TypeError('Burden collection requires an artifact locator, treatment-plan identifier, and attributable source evidence.');
    }
    const response = await questionnaireLogic.runBurdenQuestionnaire(options.burdenAskQuestion);
    const prepared = preparedArtifact('burden', response, request, options.collectionMetadata?.burden);
    request.burden_questionnaire_artifact = prepared.descriptor;
    artifactPayloads[prepared.descriptor.artifact_locator] = prepared.payload;
    sourceModes.burden = 'collected';
  } else {
    sourceModes.burden = 'supplied';
  }

  if (request.wagner_response_artifact.artifact_locator === request.burden_questionnaire_artifact.artifact_locator) {
    throw new TypeError('Wagner and Burden response artifacts require distinct locators.');
  }

  const contract = validateInputContract(request);
  if (!contract.valid) throw new TypeError(`Prepared KA request is invalid: ${contract.problems.map((p) => `${p.field}: ${p.message}`).join(' | ')}`);
  return { request, artifactPayloads, sourceModes };
}

async function resolveArtifact(descriptor, kind, request, options) {
  const payload = options.artifactPayloads?.[descriptor.artifact_locator] ??
    (options.resolveArtifact ? await options.resolveArtifact(descriptor, kind) : undefined);
  if (!payload || typeof payload !== 'object' || !payload.response) {
    throw new TypeError(`${kind} response artifact cannot be resolved; no automatic network retrieval is permitted.`);
  }
  if (!sameIdentifier(payload.subject_identifier, request.subject_binding.subject_identifier) ||
      !sameIdentifier(payload.ulcer_identifier, request.subject_binding.ulcer_identifier)) {
    const error = new TypeError(`${kind} response artifact does not match the request subject and ulcer.`);
    error.reasonCode = 'KA-ERR-SUBJECT-COHERENCE';
    throw error;
  }
  if (kind === 'burden' &&
      (!sameIdentifier(payload.treatment_plan_identifier, descriptor.treatment_plan_identifier) ||
       payload.response?.response_projection?.hyperbaric_oxygen_therapy_location !== descriptor.treatment_location)) {
    throw new TypeError('Burden response artifact does not match its declared plan and treatment location.');
  }
  if (fingerprintJson(payload.response) !== descriptor.response_fingerprint) {
    throw new TypeError(`${kind} response fingerprint does not match the resolved artifact.`);
  }
  if (kind === 'wagner' &&
      (!Array.isArray(payload.response.question_ids) || !Array.isArray(payload.response.responses) ||
       payload.response.question_ids.length !== payload.response.responses.length)) {
    throw new TypeError('Wagner response artifact lacks aligned question IDs and responses.');
  }
  if (kind === 'burden' && payload.response.confirmed !== true) {
    throw new TypeError('Burden response artifact is not confirmed.');
  }
  return payload.response;
}

async function resolveKnowledgeAssemblyArtifacts(request, options) {
  return {
    wagner: await resolveArtifact(request.wagner_response_artifact, 'wagner', request, options),
    burden: await resolveArtifact(request.burden_questionnaire_artifact, 'burden', request, options)
  };
}

async function prepareAndExecuteKnowledgeAssembly(input, options = {}) {
  const prepared = await prepareKnowledgeAssemblyRequest(input, options);
  const { executeKnowledgeAssembly } = require('./orchestrator');
  const result = await executeKnowledgeAssembly(prepared.request, { ...options, artifactPayloads: prepared.artifactPayloads });
  return { result, preparation: { source_modes: prepared.sourceModes, request: prepared.request } };
}

module.exports = {
  prepareKnowledgeAssemblyRequest,
  prepareAndExecuteKnowledgeAssembly,
  resolveKnowledgeAssemblyArtifacts
};
