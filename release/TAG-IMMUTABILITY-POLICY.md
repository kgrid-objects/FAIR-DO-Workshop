# Version 1.0 tag immutability policy

Effective 2026-10-14.

The following annotated Git tags are permanent, version-specific release identifiers for the four Knowledge Objects and the HBOT Treatment Target KA:

- `dfu-severity-score-ko-v1.0.0`
- `hbot-treatment-decision-ko-v1.0.0`
- `hbot-regimen-burden-ko-v1.0.0`
- `dfu-prognostic-indicator-ko-v1.0.0`
- `hbot-treatment-target-ka-v1.0.0`

Each tag identifies the DOI-complete Version 1.0 content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`. The tagged object directory URL is the operational version-specific identifier established in Phase 5.

## Required handling

1. Never move, overwrite, recreate, or delete any listed tag.
2. Never disable, weaken, or bypass the protecting GitHub ruleset in order to change a listed tag.
3. Do not reuse a listed tag name for different content, even if a release or repository is later reorganized.
4. Make corrections in a new commit and issue a new semantic version tag. Do not alter Version 1.0.0 history.
5. If a release is withdrawn, preserve its tag and evidence, mark the release as withdrawn or superseded, and point users to the replacement version.
6. If repository administration or migration requires changing the protection mechanism, restore equivalent or stronger protection before the repository returns to normal operation and verify the tag-object IDs and peeled commit recorded below.

GitHub ruleset `25109217`, **Protect FAIR DO Version 1.0 object tags**, enforces this policy at the remote repository. It targets exactly the five fully qualified tag refs above, is active, has no bypass actors, and applies update, deletion, and non-fast-forward restrictions. Repository administrators retain the technical ability to edit repository rulesets; this policy prohibits using that administrative ability to rewrite these identifiers.

## Frozen references

| Tag | Annotated tag-object ID | Peeled commit |
| --- | --- | --- |
| `dfu-severity-score-ko-v1.0.0` | `12877fa8729911634b250411332ba5c17437c332` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-treatment-decision-ko-v1.0.0` | `6cc6353e197b2bc4d70031c867f137fc090e982b` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-regimen-burden-ko-v1.0.0` | `5dd9d8cdd9e4df3960d223d66c7087474e8761ca` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `dfu-prognostic-indicator-ko-v1.0.0` | `d85a98665e62989b4586a9cd39d8885e36462727` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-treatment-target-ka-v1.0.0` | `e9561f9c3d3fdd9ad7ce99d1845a996205e57dc7` | `e42624bfed0b28ba35a743690141ef4f566af250` |

