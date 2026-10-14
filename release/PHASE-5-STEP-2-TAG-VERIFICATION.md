# Phase 5, Step 2 — annotated-tag and operational-ID verification

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** All five Version 1.0 references are unique annotated Git tag objects. Peeling any tag resolves to the DOI-complete content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`.

| Object | Tag | Frozen directory tree | Operational GitHub tagged-directory URL after push |
| --- | --- | --- | --- |
| DFU Severity Score KO | `dfu-severity-score-ko-v1.0.0` | `fb77576f75636d1c791df2909c7c37104a6647a2` | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/dfu-severity-score-ko-v1.0.0/collection/DFU-Severity-Score-KO` |
| HBOT Treatment Decision KO | `hbot-treatment-decision-ko-v1.0.0` | `a0a34c184ae4a6978b204cca5b2f75401f4b241e` | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-treatment-decision-ko-v1.0.0/collection/HBOT-Treatment-Decision-KO` |
| HBOT Regimen Burden KO | `hbot-regimen-burden-ko-v1.0.0` | `a750ec9a77be626432c8cbe40228de750aa24572` | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-regimen-burden-ko-v1.0.0/collection/HBOT-Regimen-Burden-KO` |
| DFU Prognostic Indicator KO | `dfu-prognostic-indicator-ko-v1.0.0` | `e6e33398c9ee609bc6698c3606f80a1d481783f9` | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/dfu-prognostic-indicator-ko-v1.0.0/collection/DFU-Prognostic-Indicator-KO` |
| HBOT Treatment Target KA | `hbot-treatment-target-ka-v1.0.0` | `a628a360aa387f9c3b39648a98a89edc98b3003c` | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-treatment-target-ka-v1.0.0/HBOT-Treatment-Target-KA` |

## Independent checks

For each tag, the audit independently confirmed:

- `git cat-file` identifies the reference target as a tag object, not a lightweight commit reference;
- the tag peels to the exact content-freeze commit;
- the object path declared in `release/objects.json` exists at the tag and is a Git tree;
- the object directory tree at the tag equals the same directory tree at the freeze commit;
- the tag name and directory URL exactly match `release/identifiers.template.json`;
- the annotation subject names the intended object and Version 1.0.0.

Exactly five local tags match the Version 1.0 naming pattern; there is one per release object and no duplicate tag name.

## Operational-identifier disposition

The table records the GitHub tagged-directory URL that will serve as the operational version-specific ID for each KO and the KA. The identifier structure is now fully verified locally. The URLs cannot resolve through GitHub until Phase 5, Step 3 pushes the tags.

## Boundary retained

No branch or tag was pushed in this step. No GitHub release was created, no archive was uploaded, no Zenodo record was published, and no Software Heritage request was initiated.
