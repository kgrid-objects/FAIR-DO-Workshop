# Phase 4, Step 7 — Findability catalog and indexed-record links

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS with a pre-tag resolution limitation.** Every `findability.metadata.txt` now contains an object-appropriate, release-pinned GitHub `schema:isPartOf` catalog link and a release-pinned GitHub `schema:subjectOf` link to the object's `metadata.json` record.

| Object | `schema:isPartOf` | `schema:subjectOf` |
| --- | --- | --- |
| DFU Severity Score KO | tagged `/collection` tree | tagged KO `metadata.json` blob |
| HBOT Treatment Decision KO | tagged `/collection` tree | tagged KO `metadata.json` blob |
| HBOT Regimen Burden KO | tagged `/collection` tree | tagged KO `metadata.json` blob |
| DFU Prognostic Indicator KO | tagged `/collection` tree | tagged KO `metadata.json` blob |
| HBOT Treatment Target KA | tagged repository tree | tagged KA `metadata.json` blob |

The four constituent KO records already contained the correct statements and did not require modification. The KA record was missing both statements. Its containing catalog is the root repository snapshot at tag `hbot-treatment-target-ka-v1.0.0`, because the KA directory is located at the repository root rather than under `collection/`. Its indexed record is `HBOT-Treatment-Target-KA/metadata.json` at that same tag.

## Zenodo indexed-record decision

No Zenodo URL was added under `schema:subjectOf` in this step.

- The authenticated `https://zenodo.org/uploads/<draft-id>` pages are private deposit-editing interfaces, not public indexed catalog records.
- The reserved DOI supplies an evidenced persistent identifier, but it is not registered and does not dereference before publication.
- The eventual public `https://zenodo.org/records/<record-id>` page is not yet available as a record that can be verified.
- Adding either the private draft interface or an unavailable future page would overstate current findability.

The published Zenodo record belongs in the post-publication metadata follow-up described in Phase 8, when its public existence and content can be verified.

## Evidence inspected

- all five `findability.metadata.txt` records;
- all five root `metadata.json` records and package manifests;
- `release/objects.json` for object paths and release-tag names;
- `release/zenodo-production-drafts.json` for reserved DOI and unpublished-draft state;
- candidate reports generated with the findability metadata inspection tool for all five objects on 2026-10-14.

## Aggregate gap report

- Missing required fields: none.
- Omitted optional indexed record: public Zenodo record, because publication has not occurred.
- Unresolved candidates: no additional public catalog record is supported at this stage.
- Verification limitation: the five release-tagged GitHub URLs cannot resolve until Phase 5 creates and pushes the proposed tags. Their paths and tag assignments were checked internally against the release registry; live resolution remains required in Phase 5, Step 5.
- Unsupported assertions rejected: private Zenodo draft URLs, prospective public Zenodo record URLs, and `schema:sameAs`.
