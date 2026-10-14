# Phase 4, Step 6 — KA dependency relationships

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Production Zenodo draft relationships

The unpublished HBOT Treatment Target KA draft, DOI `10.5281/zenodo.23367129`, now has four DOI-scheme `Requires` relationships:

| Constituent object | Required DOI |
| --- | --- |
| Meggitt-Wagner Classification KO | `10.5281/zenodo.23367043` |
| HBOT Treatment Decision KO | `10.5281/zenodo.23367087` |
| HBOT Regimen Burden KO | `10.5281/zenodo.23367111` |
| DFU Prognostic Indicator KO | `10.5281/zenodo.23367115` |

Each constituent draft has the reciprocal DOI-scheme `IsRequiredBy` relationship to `10.5281/zenodo.23367129`. Every relationship declares resource type `Software`. The existing release-tagged GitHub `IsSupplementTo` relationship remains separate on all five drafts.

The saved draft forms were checked after the edits. The KA displays one source relationship plus the four distinct dependency relationships. Each constituent displays one source relationship plus one reciprocal KA relationship. The Publish control remains disabled because no archive has been uploaded; no record was published.

## Local metadata and workflow bindings

- `HBOT-Treatment-Target-KA/metadata.json` now uses `dc:requires` for the four DOI-identified constituent objects and adds the matching DOI identifier to each external `koio:hasKnowledge` object.
- `HBOT-Treatment-Target-KA/specs/KA_Dependency_Manifest.json` replaces the four Sandbox DOI placeholders with reserved production DOI bindings. Its binding status now distinguishes fixed production DOIs from still-pending directory SWHIDs.
- `release/identifiers.template.json` records all five reserved production DOIs while retaining only the SWHID placeholders that Phase 6 must resolve.
- `release/regenerate-dependency-manifest.js` now preserves production DOI bindings during the required Phase 4, Step 9 regeneration.
- `release/zenodo-production-drafts.json` records the four forward and four reciprocal Zenodo relationships as release evidence.

## Boundary preserved

All five Zenodo records remain unpublished drafts. No file was uploaded, no DOI was registered through publication, no Git tag was created or pushed, and no Software Heritage action was initiated.
