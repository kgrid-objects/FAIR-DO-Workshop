'use strict';

// Section 6.2 / DEC-GATE-06A: closed native-result-to-gate-state mapping.
// This maps exact returned result identifiers only and does not reproduce
// the HBOT Decision KO's internal branch logic.
const GATE_BY_NATIVE_RESULT = {
  'OUTPUT-01': 'NOT_SUPPORTED',
  'OUTPUT-02': 'SUPPORTED',
  'OUTPUT-03': 'SUPPORTED',
  'OUTPUT-04': 'INSUFFICIENT_DECISION',
  'OUT-OF-SCOPE': 'OUT_OF_SCOPE'
};

function mapGate(nativeResultId) {
  return Object.prototype.hasOwnProperty.call(GATE_BY_NATIVE_RESULT, nativeResultId)
    ? GATE_BY_NATIVE_RESULT[nativeResultId]
    : null;
}

module.exports = { GATE_BY_NATIVE_RESULT, mapGate };
