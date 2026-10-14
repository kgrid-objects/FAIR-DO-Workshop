#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

status=0
for f in HBOT-Treatment-Target-KA/zenodo.sandbox.template.json collection/*/zenodo.sandbox.template.json release/objects.json release/identifiers.template.json; do
  jq empty "$f" || status=1
done

if rg -n '__(SANDBOX_DOI|SWHID)_' HBOT-Treatment-Target-KA collection release/identifiers.template.json; then
  echo "BLOCKED: DOI or SWHID placeholders remain (expected before draft reservation and Software Heritage ingestion)." >&2
  status=1
fi

if rg -n '__PUBLICATION_DATE__' HBOT-Treatment-Target-KA/zenodo.sandbox.template.json collection/*/zenodo.sandbox.template.json; then
  echo "BLOCKED: publication-date placeholders remain (replace them with the supported deposit date)." >&2
  status=1
fi

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
