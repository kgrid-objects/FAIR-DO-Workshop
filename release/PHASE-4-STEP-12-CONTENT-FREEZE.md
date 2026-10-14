# Phase 4, Step 12 — DOI-complete Version 1.0 content freeze

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Freeze declaration

The Git commit containing this evidence file and bearing the commit message `Freeze DOI-complete Version 1.0 candidate` is the intended Version 1.0 content-freeze commit for the five release objects.

The resulting commit SHA is recorded in Git history and in the release-preparation conversation after commit creation. It is not embedded in this file because a Git commit cannot contain its own content-derived identifier.

## Included release state

The freeze incorporates the completed Phase 4 work:

- five reserved production Zenodo DOIs;
- production DOI identifiers in findability metadata, core `metadata.json`, and `CITATION.cff`;
- verified release-pinned human-facing URLs and indexed GitHub metadata records;
- bidirectional KA-to-constituent Zenodo dependency relationships;
- production DOI bindings in the KA dependency manifest;
- validated RDF/Turtle findability records;
- regenerated constituent dependency checksums and Git tree identities;
- five regenerated file-level content manifests;
- five reproducible deterministic release archives and recorded digests;
- a passing DOI-era release validator;
- 227 passing tests and zero failures.

## Pre-freeze gate

Immediately before preparing this freeze commit, `release/validate-release.sh` exited with status 0:

| Object | Tests passed |
| --- | ---: |
| DFU Severity Score KO | 39 |
| HBOT Treatment Decision KO | 57 |
| HBOT Regimen Burden KO | 10 |
| DFU Prognostic Indicator KO | 24 |
| HBOT Treatment Target KA | 97 |
| **Total** | **227** |

Production DOI bindings were complete. The remaining directory-SWHID fields were confined to their approved registry, core-metadata, and KA-dependency-manifest locations and were intentionally pending Phase 6.

## Content-change rule after freeze

Any later change within one of the five object directories changes the frozen candidate and requires, at minimum:

1. a new dependency-manifest regeneration;
2. new content manifests and deterministic archives;
3. a complete release-validator and test run; and
4. a new explicitly identified content-freeze commit.

Evidence-only changes outside the object directories must still be reviewed, but they do not alter the five object directory trees or their deterministic archives.

## Authorization boundary

This step creates only the local content-freeze commit. It does not authorize or perform:

- annotated tag creation or tag pushing;
- pushing the content-freeze commit;
- GitHub release creation;
- archive upload;
- Zenodo publication;
- Software Heritage archival.

Phase 5 must not begin until separate authorization is obtained and recorded.
