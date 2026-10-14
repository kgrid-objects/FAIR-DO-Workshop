'use strict';

const crypto = require('node:crypto');
const { fingerprintJson } = require('./fingerprint');

function urnUuid() {
  return `urn:uuid:${crypto.randomUUID()}`;
}

const KA_SPECIFICATION_IRI = 'https://kgrid.org/cks/hbot-treatment-target-ka/versions/cks-1.0';
const RESULT_MODEL_IRI = 'https://kgrid.org/cks/hbot-treatment-target-ka/result-model/1.0';
const PROVENANCE_MODEL_IRI = 'https://kgrid.org/cks/hbot-treatment-target-ka/provenance-model/1.0';

// Section 9.3: closed assembly-provenance object (simplified internal
// bookkeeping; all normative fields are present with the required shape).
function buildProvenance({
  executionId,
  manifest,
  requestedAt,
  indexTime,
  executionStartedAt,
  executionEndedAt,
  eventRecords,
  sourceEvidenceRecords,
  transformationRecords,
  dependencyEngagementRecordIds,
  joinRecord,
  gateMappingRecord,
  projectionRecords,
  synthesisRecord
}) {
  const provenance = {
    provenance_model_iri: PROVENANCE_MODEL_IRI,
    provenance_record_id: urnUuid(),
    execution_id: executionId,
    ka_specification_iri: KA_SPECIFICATION_IRI,
    result_model_iri: RESULT_MODEL_IRI,
    dependency_manifest_version: manifest.manifestVersion,
    dependency_manifest_fingerprint: fingerprintJson(manifest),
    orchestrator_identity: '@kgrid/hbot-treatment-target-ka',
    orchestrator_version: '1.0.0',
    execution_started_at: executionStartedAt,
    execution_ended_at: executionEndedAt,
    requested_at: requestedAt,
    index_time: indexTime,
    execution_plan: {
      stages: [
        { stage: 0, action: 'validate_ka_request_and_sources', concurrency: 'sequential' },
        { stage: '1A', action: 'engage_and_validate_wagner', concurrency: 'parallel_with_1B_1C' },
        { stage: '1B', action: 'engage_and_validate_margolis', concurrency: 'parallel_with_1A_1C' },
        { stage: '1C', action: 'engage_and_validate_burden', concurrency: 'parallel_with_1A_1B' },
        { stage: 2, action: 'build_hbot_decision_input', concurrency: 'waits_for_1A' },
        { stage: 3, action: 'engage_and_validate_hbot_decision', concurrency: 'may_overlap_1B_1C' },
        { stage: 4, action: 'join_four_terminal_engagement_records', concurrency: 'waits_for_all_four' },
        { stage: 5, action: 'apply_gate_and_synthesis', concurrency: 'waits_for_stage_4' },
        { stage: 6, action: 'construct_final_result_and_provenance', concurrency: 'waits_for_stage_5' }
      ]
    },
    event_records: eventRecords,
    source_evidence_records: sourceEvidenceRecords,
    transformation_records: transformationRecords,
    dependency_engagement_record_ids: dependencyEngagementRecordIds,
    join_record: joinRecord,
    gate_mapping_record: gateMappingRecord,
    projection_records: projectionRecords,
    synthesis_record: synthesisRecord,
    replay_status: 'fresh_only',
    result_fingerprint: null
  };
  return provenance;
}

function makeEventRecord(eventType, dependencyRole, inputRecordIds, outputRecordIds) {
  return {
    event_id: urnUuid(),
    event_type: eventType,
    dependency_role: dependencyRole,
    occurred_at: new Date().toISOString(),
    agent_identity: '@kgrid/hbot-treatment-target-ka',
    input_record_ids: inputRecordIds,
    output_record_ids: outputRecordIds,
    event_fingerprint: fingerprintJson({ eventType, dependencyRole, inputRecordIds, outputRecordIds })
  };
}

function makeSourceEvidenceRecord(sourceEvidence, bindings = {}) {
  if (!sourceEvidence) return null;
  const record = {
    source_evidence_id: urnUuid(),
    source_record_iri: sourceEvidence.source_record_iri || null,
    source_system_iri: sourceEvidence.source_system_iri || null,
    subject_identifier: bindings.subject_identifier || null,
    ulcer_identifier: bindings.ulcer_identifier || null,
    treatment_plan_identifier: bindings.treatment_plan_identifier || null,
    effective_at: sourceEvidence.effective_at || null,
    recorded_at: sourceEvidence.recorded_at || null,
    valid_until: sourceEvidence.valid_until !== undefined ? sourceEvidence.valid_until : null,
    author_or_respondent_iri: sourceEvidence.author_or_respondent_iri || null,
    author_or_respondent_role: sourceEvidence.author_or_respondent_role || null,
    artifact_locator: sourceEvidence.source_record_iri || null,
    media_type: 'application/json',
    artifact_fingerprint: fingerprintJson(sourceEvidence)
  };
  record.source_evidence_fingerprint = fingerprintJson(record);
  return record;
}

module.exports = {
  KA_SPECIFICATION_IRI,
  RESULT_MODEL_IRI,
  PROVENANCE_MODEL_IRI,
  urnUuid,
  buildProvenance,
  makeEventRecord,
  makeSourceEvidenceRecord
};
