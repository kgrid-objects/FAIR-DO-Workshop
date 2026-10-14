'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadPackageJson, loadMetadataJson, packageDir } = require('./dependency-packages');

const MANIFEST_PATH = path.join(__dirname, '..', 'specs', 'KA_Dependency_Manifest.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function manifestEntry(manifest, role) {
  return manifest.dependencies.find((dep) => dep.dependencyRole === role) || null;
}

// Section 3.6: exact-version evidence requires agreement among the declared
// CKS version IRI, KO metadata dc:version, package version, published main
// package path, and (when available) checksum evidence recorded in the
// manifest. This verifies the locally resolvable subset of that evidence.
function verifyDependencyIdentity(role, manifest = loadManifest()) {
  const entry = manifestEntry(manifest, role);
  if (!entry) {
    return {
      ok: false,
      reason: 'unavailable',
      packageEvidence: null
    };
  }

  let pkg;
  let metadata;
  try {
    pkg = loadPackageJson(role);
    metadata = loadMetadataJson(role);
  } catch (error) {
    return { ok: false, reason: 'unavailable', packageEvidence: null };
  }

  const expectedNameVersion = entry.npmPackageIdentity;
  const actualNameVersion = `${pkg.name}@${pkg.version}`;
  const identityMatches = expectedNameVersion === actualNameVersion;
  const versionMatches =
    pkg.version === entry.knowledgeObjectVersion + '.0' ||
    pkg.version.startsWith(entry.knowledgeObjectVersion) ||
    metadata['dc:version'] === entry.knowledgeObjectVersion;

  const packageEvidence = {
    manifest_version: manifest.manifestVersion,
    package_locator: entry.publishedPackageLocator,
    git_tree_oid: entry.gitTreeOid,
    canonical_package_fingerprint: `sha256:${entry.canonicalTarSha256}`,
    realization_version: pkg.version,
    verification_status: identityMatches && versionMatches ? 'verified' : 'failed'
  };

  if (!identityMatches) {
    return { ok: false, reason: 'identity', packageEvidence };
  }
  if (!versionMatches) {
    return { ok: false, reason: 'version', packageEvidence };
  }
  return { ok: true, reason: null, packageEvidence, entry };
}

module.exports = { MANIFEST_PATH, loadManifest, manifestEntry, verifyDependencyIdentity, packageDir };
