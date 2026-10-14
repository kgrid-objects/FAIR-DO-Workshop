# Phase 5, Step 1 — local annotated Version 1.0 tags

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** Five local annotated Git tags were created. Each tag names one independent Version 1.0 release unit in the monorepo and points to the DOI-complete content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`.

| Object | Annotated tag | Target commit |
| --- | --- | --- |
| DFU Severity Score KO | `dfu-severity-score-ko-v1.0.0` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| HBOT Treatment Decision KO | `hbot-treatment-decision-ko-v1.0.0` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| HBOT Regimen Burden KO | `hbot-regimen-burden-ko-v1.0.0` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| DFU Prognostic Indicator KO | `dfu-prognostic-indicator-ko-v1.0.0` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| HBOT Treatment Target KA | `hbot-treatment-target-ka-v1.0.0` | `e42624bfed0b28ba35a743690141ef4f566af250` |

## Checks performed

- The tag names exactly match `release/objects.json`.
- None of the five names existed before this step.
- Each created reference is an annotated Git tag object, not a lightweight tag.
- Peeling each tag resolves to the exact content-freeze commit.
- The content-freeze commit exists locally and is a commit object.

## Publication boundary

The tags remain local. This step did not push the branch or any tag, create a GitHub release, attach an archive, publish a Zenodo record, or initiate Software Heritage archival. Consequently, the future tagged directory URLs are not yet public operational identifiers; that exposure occurs after Phase 5, Step 3 pushes the verified tags.
