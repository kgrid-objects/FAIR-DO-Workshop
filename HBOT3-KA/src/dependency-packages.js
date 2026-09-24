'use strict';

// Resolves the four constituent KOs directly from the sibling collection/
// folder so the KA is runnable without a prior `npm install` step (the KOs
// are not published to a registry). package.json still declares them as
// file: dependencies for standard npm tooling and documentation purposes.

const fs = require('node:fs');
const path = require('node:path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const COLLECTION_DIR = path.join(WORKSPACE_ROOT, 'collection');

const PACKAGE_DIRS = {
  'DEP-WAGNER': path.join(COLLECTION_DIR, 'DFU-Severity-Score-KO'),
  'DEP-HBOT-DECISION': path.join(COLLECTION_DIR, 'HBOT-Treatment-Decision-KO'),
  'DEP-BURDEN': path.join(COLLECTION_DIR, 'HBOT-Regimen-Burden-KO'),
  'DEP-MARGOLIS': path.join(COLLECTION_DIR, 'DFU-Prognostic-Indicator-KO')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function packageDir(role) {
  const dir = PACKAGE_DIRS[role];
  if (!dir) {
    throw new RangeError(`Unknown dependency role: ${role}`);
  }
  return dir;
}

function loadPackageJson(role) {
  return readJson(path.join(packageDir(role), 'package.json'));
}

function loadMetadataJson(role) {
  return readJson(path.join(packageDir(role), 'metadata.json'));
}

const wagnerScorer = require(path.join(PACKAGE_DIRS['DEP-WAGNER'], 'src', 'scorer'));
// Wagner's own interactive Questionnaire Logic capability (Section 3.1: "...
// Questionnaire Logic when the KA controls interactive collection").
const wagnerQuestionnaire = require(path.join(PACKAGE_DIRS['DEP-WAGNER'], 'src', 'index'));
const hbotDecision = require(path.join(PACKAGE_DIRS['DEP-HBOT-DECISION'], 'src', 'decision'));
const burdenAnalysis = require(path.join(
  PACKAGE_DIRS['DEP-BURDEN'],
  'src',
  'burden-response-analysis'
));
const regimenRange = require(path.join(PACKAGE_DIRS['DEP-BURDEN'], 'src', 'regimen-range'));
const questionnaireLogic = require(path.join(
  PACKAGE_DIRS['DEP-BURDEN'],
  'src',
  'questionnaire-logic'
));
const margolisPrognosis = require(path.join(
  PACKAGE_DIRS['DEP-MARGOLIS'],
  'src',
  'prognosis'
));

module.exports = {
  PACKAGE_DIRS,
  packageDir,
  loadPackageJson,
  loadMetadataJson,
  wagnerScorer,
  wagnerQuestionnaire,
  hbotDecision,
  burdenAnalysis,
  regimenRange,
  questionnaireLogic,
  margolisPrognosis
};
