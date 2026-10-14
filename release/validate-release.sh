#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

status=0
for f in HBOT-Treatment-Target-KA/zenodo.sandbox.template.json collection/*/zenodo.sandbox.template.json release/objects.json release/identifiers.template.json; do
  jq empty "$f" || status=1
done

if rg -n '__SANDBOX_DOI_' HBOT-Treatment-Target-KA collection release/identifiers.template.json --glob '!zenodo.sandbox.template.json'; then
  echo "BLOCKED: a Sandbox DOI placeholder remains outside a Sandbox-only deposit template." >&2
  status=1
fi

if rg -n '__PUBLICATION_DATE__' HBOT-Treatment-Target-KA collection --glob '!zenodo.sandbox.template.json'; then
  echo "BLOCKED: a publication-date placeholder remains outside a Sandbox-only deposit template." >&2
  status=1
fi

node <<'NODE' || status=1
const fs = require('fs');
const path = require('path');

const objects = JSON.parse(fs.readFileSync('release/objects.json')).objects;
const identifiers = JSON.parse(fs.readFileSync('release/identifiers.template.json')).objects;
const byKey = Object.fromEntries(identifiers.map((item) => [item.key, item]));
const allowedSwhidFiles = new Set([
  'release/identifiers.template.json',
  'HBOT-Treatment-Target-KA/specs/KA_Dependency_Manifest.json',
  ...objects.map((object) => path.join(object.path, 'metadata.json'))
]);

function inspectSwhidLocations(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      inspectSwhidLocations(filePath);
    } else if (fs.readFileSync(filePath).toString().includes('__SWHID_') && !allowedSwhidFiles.has(filePath)) {
      throw new Error(`Unexpected SWHID placeholder location: ${filePath}`);
    }
  }
}

for (const object of objects) {
  const binding = byKey[object.key];
  if (!binding || !/^10\.5281\/zenodo\.\d+$/.test(binding.doi)) {
    throw new Error(`Missing production DOI binding for ${object.key}`);
  }
  if (!/^__SWHID_[A-Z0-9_]+__$/.test(binding.directorySwhid)) {
    throw new Error(`Unexpected directory SWHID state for ${object.key}`);
  }
  const metadata = JSON.parse(fs.readFileSync(path.join(object.path, 'metadata.json')));
  const values = Array.isArray(metadata['dc:identifier']) ? metadata['dc:identifier'] : [metadata['dc:identifier']];
  if (!values.includes(`https://doi.org/${binding.doi}`)) {
    throw new Error(`Core metadata lacks production DOI for ${object.key}`);
  }
  if (!values.includes(binding.directorySwhid)) {
    throw new Error(`Core metadata SWHID placeholder differs from registry for ${object.key}`);
  }
}

const manifest = JSON.parse(fs.readFileSync('HBOT-Treatment-Target-KA/specs/KA_Dependency_Manifest.json'));
const roleToKey = {
  'DEP-WAGNER': 'dfu-severity-score-ko',
  'DEP-HBOT-DECISION': 'hbot-treatment-decision-ko',
  'DEP-BURDEN': 'hbot-regimen-burden-ko',
  'DEP-MARGOLIS': 'dfu-prognostic-indicator-ko'
};
for (const dependency of manifest.dependencies) {
  const binding = byKey[roleToKey[dependency.dependencyRole]];
  if (!binding || dependency.doi !== binding.doi || dependency.directorySwhid !== binding.directorySwhid) {
    throw new Error(`Dependency identifier mismatch for ${dependency.dependencyRole}`);
  }
  if (dependency.sandboxDoi !== undefined) {
    throw new Error(`Sandbox DOI field remains in dependency ${dependency.dependencyRole}`);
  }
}
inspectSwhidLocations('HBOT-Treatment-Target-KA');
inspectSwhidLocations('collection');
console.log('PASS: production DOI bindings are complete; registered directory SWHID fields remain intentionally pending.');
NODE

if rg -n '(github\.com/kgrid-objects/FAIR-DO-Workshop|raw\.githubusercontent\.com/kgrid-objects/FAIR-DO-Workshop).*(/main/|/HEAD/|/HEAD\?|/tree/main|/tree/HEAD|/blob/main|/blob/HEAD)' HBOT-Treatment-Target-KA collection --glob 'metadata.json' --glob '*.json' --glob '*.md' --glob '*.ipynb' --glob '*.txt' --glob '*.html' --glob '*.jsnb'; then
  echo "BLOCKED: mutable main/HEAD locators remain in release-significant files." >&2
  status=1
fi

if [[ -e collection/HBOT-Regimen-Burden-KO/specs/1E41C3D7-66F4-C168-3A91-D951BE77CBAF.pdf ]]; then
  echo "BLOCKED: uncleared third-party PDF remains in the release tree." >&2
  status=1
fi

for d in collection/DFU-Severity-Score-KO collection/HBOT-Treatment-Decision-KO collection/HBOT-Regimen-Burden-KO collection/DFU-Prognostic-Indicator-KO HBOT-Treatment-Target-KA; do
  test -f "$d/LICENSE" && test -f "$d/CITATION.cff" && test -f "$d/zenodo.sandbox.template.json" || status=1
  npm test --prefix "$d" || status=1
done

exit "$status"
