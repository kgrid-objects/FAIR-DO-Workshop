'use strict';

// Section 7.5 / 8.2 controlled reason codes.
const REASON_CODES = {
  SUPPORTED_SYNTHESIS: 'KA-RESULT-SUPPORTED-SYNTHESIS',
  HBOT_NOT_SUPPORTED: 'KA-RESULT-HBOT-NOT-SUPPORTED',
  INPUT_VALIDATION: 'KA-ERR-INPUT-VALIDATION',
  DEPENDENCY_UNAVAILABLE: 'KA-ERR-DEPENDENCY-UNAVAILABLE',
  DEPENDENCY_IDENTITY: 'KA-ERR-DEPENDENCY-IDENTITY',
  DEPENDENCY_VERSION: 'KA-ERR-DEPENDENCY-VERSION',
  INVOCATION: 'KA-ERR-INVOCATION',
  CONSTITUENT_RESULT: 'KA-ERR-CONSTITUENT-RESULT',
  OUTPUT_CONTRACT: 'KA-ERR-OUTPUT-CONTRACT',
  SUBJECT_COHERENCE: 'KA-ERR-SUBJECT-COHERENCE',
  TEMPORAL_COHERENCE: 'KA-ERR-TEMPORAL-COHERENCE',
  PROVENANCE: 'KA-ERR-PROVENANCE',
  TRANSFORMATION: 'KA-ERR-TRANSFORMATION',
  GATE_UNDEFINED: 'KA-ERR-GATE-UNDEFINED',
  HBOT_INSUFFICIENT_DECISION: 'KA-INDET-HBOT-INSUFFICIENT-DECISION',
  HBOT_OUT_OF_SCOPE: 'KA-INDET-HBOT-OUT-OF-SCOPE',
  SYNTHESIS_UNKNOWN_PROJECTION: 'KA-ERR-SYNTHESIS-UNKNOWN-PROJECTION',
  SYNTHESIS_COMBINATION_NONCONFORMING: 'KA-ERR-SYNTHESIS-COMBINATION-NONCONFORMING',
  SYNTHESIS_COMBINATION_UNDEFINED: 'KA-ERR-SYNTHESIS-COMBINATION-UNDEFINED',
  SYNTHESIS_COMBINATION_DISPUTED: 'KA-ERR-SYNTHESIS-COMBINATION-DISPUTED',
  JOIN_INCOMPLETE: 'KA-ERR-JOIN-INCOMPLETE',
  RESULT_CONSTRUCTION: 'KA-ERR-RESULT-CONSTRUCTION'
};

// Section 7.6 closed KA warning vocabulary.
const WARNING_CODES = {
  NONTERMINAL_CONSTITUENT_INFORMATION: 'KA-WARN-NONTERMINAL-CONSTITUENT-INFORMATION',
  PROVENANCE_EXTENSION_IGNORED: 'KA-WARN-PROVENANCE-EXTENSION-IGNORED'
};

const DEPENDENCY_ROLES = ['DEP-WAGNER', 'DEP-HBOT-DECISION', 'DEP-BURDEN', 'DEP-MARGOLIS'];

// Section 8.4 ascending failure precedence (lower number wins).
const REASON_PRECEDENCE = [
  REASON_CODES.INPUT_VALIDATION,
  REASON_CODES.DEPENDENCY_IDENTITY,
  REASON_CODES.DEPENDENCY_VERSION,
  REASON_CODES.DEPENDENCY_UNAVAILABLE,
  REASON_CODES.INVOCATION,
  REASON_CODES.CONSTITUENT_RESULT,
  REASON_CODES.OUTPUT_CONTRACT,
  REASON_CODES.SUBJECT_COHERENCE,
  REASON_CODES.TEMPORAL_COHERENCE,
  REASON_CODES.PROVENANCE,
  REASON_CODES.TRANSFORMATION,
  REASON_CODES.JOIN_INCOMPLETE,
  REASON_CODES.GATE_UNDEFINED,
  REASON_CODES.HBOT_INSUFFICIENT_DECISION,
  REASON_CODES.HBOT_OUT_OF_SCOPE,
  REASON_CODES.SYNTHESIS_UNKNOWN_PROJECTION,
  REASON_CODES.SYNTHESIS_COMBINATION_NONCONFORMING,
  REASON_CODES.SYNTHESIS_COMBINATION_UNDEFINED,
  REASON_CODES.SYNTHESIS_COMBINATION_DISPUTED,
  REASON_CODES.RESULT_CONSTRUCTION
];

// Selects the single primary reason from all detected diagnostics under
// Section 8.4, breaking ties by fixed dependency-role order and then by
// stable occurrence index.
function selectPrimaryDiagnostic(diagnostics) {
  if (!diagnostics.length) return null;
  let best = null;
  let bestPrecedence = Infinity;
  let bestRoleIndex = Infinity;
  diagnostics.forEach((diagnostic, occurrenceIndex) => {
    const precedence = REASON_PRECEDENCE.indexOf(diagnostic.reason_code);
    if (precedence === -1) return;
    const roleIndex = diagnostic.dependency_role
      ? DEPENDENCY_ROLES.indexOf(diagnostic.dependency_role)
      : DEPENDENCY_ROLES.length;
    const better =
      precedence < bestPrecedence ||
      (precedence === bestPrecedence &&
        (roleIndex < bestRoleIndex ||
          (roleIndex === bestRoleIndex && (best === null || occurrenceIndex < best._occ))));
    if (better) {
      best = { ...diagnostic, _occ: occurrenceIndex };
      bestPrecedence = precedence;
      bestRoleIndex = roleIndex;
    }
  });
  if (!best) return null;
  const { _occ, ...clean } = best;
  return clean;
}

function makeDiagnostic({
  reasonCode,
  dependencyRole = null,
  stage,
  nativeCode = null,
  nativeStatus = null,
  nativeText = null,
  message,
  terminal = true
}) {
  return {
    diagnostic_source: dependencyRole ? 'constituent' : 'KA',
    dependency_role: dependencyRole,
    processing_stage: stage,
    reason_code: reasonCode,
    native_code: nativeCode,
    native_status: nativeStatus,
    native_text: nativeText,
    message,
    terminal
  };
}

module.exports = {
  REASON_CODES,
  WARNING_CODES,
  DEPENDENCY_ROLES,
  REASON_PRECEDENCE,
  selectPrimaryDiagnostic,
  makeDiagnostic
};
