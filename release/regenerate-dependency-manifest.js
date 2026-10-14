const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const repo = path.resolve(__dirname, '..');
const manifestPath = path.join(repo, 'HBOT-Treatment-Target-KA/specs/KA_Dependency_Manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath));
const releaseObjects = JSON.parse(fs.readFileSync(path.join(repo, 'release/objects.json'))).objects;
const identifierObjects = JSON.parse(fs.readFileSync(path.join(repo, 'release/identifiers.template.json'))).objects;
const indexPath = path.join(os.tmpdir(), `fair-do-release-index-${process.pid}`);
fs.writeFileSync(indexPath, '');
const env = { ...process.env, GIT_INDEX_FILE: indexPath };

function git(args, options = {}) {
  return cp.execFileSync('git', ['-C', repo, ...args], { env, maxBuffer: 64 * 1024 * 1024, ...options });
}
function text(args) { return git(args, { encoding: 'utf8' }).trim(); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function canonicalCommit(tree) {
  const fixedEnv = {
    ...env,
    GIT_AUTHOR_NAME: 'FAIR-DO release tooling',
    GIT_AUTHOR_EMAIL: 'kgrid-developers@umich.edu',
    GIT_AUTHOR_DATE: '2000-01-01T00:00:00Z',
    GIT_COMMITTER_NAME: 'FAIR-DO release tooling',
    GIT_COMMITTER_EMAIL: 'kgrid-developers@umich.edu',
    GIT_COMMITTER_DATE: '2000-01-01T00:00:00Z'
  };
  return cp.execFileSync('git', ['-C', repo, 'commit-tree', tree], {
    env: fixedEnv,
    input: 'Canonical dependency archive\n',
    encoding: 'utf8'
  }).trim();
}

git(['read-tree', 'HEAD']);
git(['add', '-A']);
const rootTree = text(['write-tree']);

const roleToKey = {
  'DEP-WAGNER': 'dfu-severity-score-ko',
  'DEP-HBOT-DECISION': 'hbot-treatment-decision-ko',
  'DEP-BURDEN': 'hbot-regimen-burden-ko',
  'DEP-MARGOLIS': 'dfu-prognostic-indicator-ko'
};

for (const dep of manifest.dependencies) {
  const key = roleToKey[dep.dependencyRole];
  const object = releaseObjects.find((item) => item.key === key);
  const identifiers = identifierObjects.find((item) => item.key === key);
  if (!object || !identifiers) throw new Error(`No release mapping for ${dep.dependencyRole}`);
  const entry = text(['ls-tree', rootTree, object.path]);
  const match = entry.match(/^040000 tree ([0-9a-f]{40})\t/);
  if (!match) throw new Error(`No tree for ${object.path}`);
  const metadata = git(['show', `${rootTree}:${object.path}/metadata.json`]);
  const packageJson = git(['show', `${rootTree}:${object.path}/package.json`]);
  const prefix = `${path.basename(object.path)}/`;
  const archive = git(['archive', '--format=tar', `--prefix=${prefix}`, canonicalCommit(match[1])]);
  const names = text(['ls-tree', '-r', '--name-only', `${rootTree}:${object.path}`]);

  dep.packagePath = object.path;
  dep.publishedPackageLocator = identifiers.gitDirectoryUrl;
  dep.publishedMetadataLocator = `https://raw.githubusercontent.com/kgrid-objects/FAIR-DO-Workshop/${object.tag}/${object.path}/metadata.json`;
  dep.metadataSha256 = sha256(metadata);
  dep.packageJsonSha256 = sha256(packageJson);
  dep.gitTreeOid = match[1];
  dep.directorySwhid = identifiers.directorySwhid;
  dep.sandboxDoi = identifiers.sandboxDoi;
  dep.canonicalTarSha256 = sha256(archive);
  dep.canonicalTarByteSize = archive.length;
  dep.fileCount = names ? names.split('\n').length : 0;
  dep.bindingStatus = 'content-bound; persistent-identifiers-pending';
}

manifest.manifestVersion = '2.0-release-candidate';
manifest.generatedAt = '2026-10-13';
manifest.bindingPolicy = 'release-tag-with-exact-directory-tree-and-canonical-archive-verification';
manifest.repository = {
  url: 'https://github.com/kgrid-objects/FAIR-DO-Workshop',
  releaseTag: 'hbot-treatment-target-ka-v1.0.0',
  publishedReleaseLocator: 'https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-treatment-target-ka-v1.0.0',
  commitEvidenceStatus: 'pending release-candidate commit and annotated tag; record the resulting commit SHA outside this content-addressed manifest'
};
delete manifest.suppliedBundleEvidence;
manifest.packageChecksumMethod = 'For each dependency, gitTreeOid is the Git tree object ID for the complete object directory in the prepared release tree. directorySwhid is swh:1:dir:<gitTreeOid> once the exact tree is ingested by Software Heritage. canonicalTarSha256 is SHA-256 over an uncompressed git archive of that directory tree, prefixed with <directoryName>/ and anchored by a deterministic synthetic commit with no parent, the fixed author/committer FAIR-DO release tooling <kgrid-developers@umich.edu>, timestamp 2000-01-01T00:00:00Z, and message Canonical dependency archive. The manifest does not embed the containing release commit SHA because content cannot contain its own content-derived commit identifier; commit/tag evidence is recorded after commit creation.';
manifest.conformanceRule = 'CKS Version 1.0 retrieves each dependency through its immutable release-tag locator and accepts it only when dependency role, CKS version IRI, package identity and version, package path, Git directory tree ID, and canonical package checksum match this manifest. DOI and directory SWHID bindings must replace their explicit placeholders before publication. Later versions, locally edited folders, mutable branch locators, and semantically similar packages do not satisfy the binding.';

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
fs.unlinkSync(indexPath);
console.log(JSON.stringify({ rootTreeUsedForConstituentCalculation: rootTree, dependencies: manifest.dependencies.map((d) => ({ role: d.dependencyRole, tree: d.gitTreeOid, tarSha256: d.canonicalTarSha256, bytes: d.canonicalTarByteSize, files: d.fileCount })) }, null, 2));
