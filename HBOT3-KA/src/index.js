'use strict';

const { executeKnowledgeAssembly } = require('./orchestrator');
const { REASON_CODES, WARNING_CODES, DEPENDENCY_ROLES } = require('./errors');
const { GATE_BY_NATIVE_RESULT, mapGate } = require('./gate-mapping');
const {
  PROGNOSIS_PROJECTION,
  BURDEN_PROJECTION,
  MATRIX,
  projectPrognosis,
  projectBurden,
  lookupMatrix
} = require('./synthesis');
const { loadManifest, verifyDependencyIdentity } = require('./dependency-manifest-validation');

module.exports = {
  executeKnowledgeAssembly,
  REASON_CODES,
  WARNING_CODES,
  DEPENDENCY_ROLES,
  GATE_BY_NATIVE_RESULT,
  mapGate,
  PROGNOSIS_PROJECTION,
  BURDEN_PROJECTION,
  MATRIX,
  projectPrognosis,
  projectBurden,
  lookupMatrix,
  loadManifest,
  verifyDependencyIdentity
};
