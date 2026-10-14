# Phase 4, Step 4 — Landing-page and source-location roles

Completed: 2026-10-14

## Result

**PASS with a disclosed pre-tag resolution limitation.** Every findability record now explicitly identifies its proposed object-specific, release-tagged GitHub directory as the human-facing `schema:url`. The same exact release-pinned directory remains independently declared as a retrieval route in `access.metadata.txt`; it was not replaced by the production DOI.

| Object | `schema:url` and release-pinned source directory |
| --- | --- |
| DFU Severity Score KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/dfu-severity-score-ko-v1.0.0/collection/DFU-Severity-Score-KO` |
| HBOT Treatment Decision KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-treatment-decision-ko-v1.0.0/collection/HBOT-Treatment-Decision-KO` |
| HBOT Regimen Burden KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-regimen-burden-ko-v1.0.0/collection/HBOT-Regimen-Burden-KO` |
| DFU Prognostic Indicator KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/dfu-prognostic-indicator-ko-v1.0.0/collection/DFU-Prognostic-Indicator-KO` |
| HBOT Treatment Target KA | `https://github.com/kgrid-objects/FAIR-DO-Workshop/tree/hbot-treatment-target-ka-v1.0.0/HBOT-Treatment-Target-KA` |

## Identity disposition

- The Severity KO retains its independently evidenced canonical KGrid object-version IRI, `https://kgrid.org/kos/wagner/versions/ko-1.0`, as the RDF subject. Its GitHub location remains a distinct `schema:url` and access route.
- The other three KOs and the KA retain their existing, release-tagged GitHub directory IRIs as RDF subjects because no separate canonical **object-version** IRI is evidenced in their current core metadata. Their CKS/specification IRIs were not substituted because those identify specifications or contracts rather than necessarily identifying the packaged KO or KA.
- For those four objects, `schema:url` now makes the human-facing role explicit, but its value necessarily coincides with the existing RDF subject. No unsupported KGrid object IRI was invented.
- Reserved Zenodo DOI IRIs remain `schema:identifier` values and were not promoted to RDF subjects or used as landing pages before publication.

## Verification and gap report

- Every `schema:url` exactly matches the corresponding tag and object path in `release/objects.json`.
- Every URL is HTTPS, contains the object-specific Version 1.0 tag, and points to the correct directory boundary.
- Every `access.metadata.txt` retains the same release-pinned directory as an access route and the release-pinned existence-metadata record as its metadata route.
- The five proposed Git tags do not yet exist locally. Consequently, live URL resolution cannot be claimed before Phase 5 creates and pushes the tags. Phase 5, Step 5 remains the mandatory live-resolution check.
- External direct-fetch verification was attempted on 2026-10-14 but did not return usable page evidence; no resolution claim is based on that attempt.
- Missing required findability fields: none.
- Unresolved identity limitation: four objects do not yet have an independently evidenced object-version IRI distinct from their GitHub landing/source URL.
