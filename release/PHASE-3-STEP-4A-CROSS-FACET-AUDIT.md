# Phase 3, Step 4A — cross-facet metadata audit and correction

Audit and correction completed on 2026-10-14 for the five Version 1.0 release objects. The review covered all 25 FAIR facet files (`findability`, `access`, `existence`, `interoperability`, and `reusability`) together with `metadata.json`, `CITATION.cff`, `zenodo.sandbox.template.json`, `package.json`, and the release identifier workflow.

## Corrections made

### Access

- Removed four FDO Bench download routes whose service-side identifiers, authentication conditions, API version, ZIP representation, and payment conditions were not independently evidenced in the repository.
- Retained two evidence-supported routes for every object: its release-pinned GitHub directory and its release-pinned existence-metadata file.
- Standardized route wording so a monorepo subdirectory is not described as a separate repository.
- Did not add Zenodo Sandbox routes, because Sandbox identifiers are rehearsal evidence rather than permanent access locations.
- Did not add production Zenodo or Software Heritage routes, because those locations do not yet exist and have not been verified.

### Existence

- Preserved every existence-record UUID.
- Added `CITATION.cff`, `zenodo.sandbox.template.json`, and `package.json` as metadata components for all five objects.
- Confirmed that every listed component exists and appears exactly once.
- Did not list `LICENSE` as an existence metadata component because its primary purpose is to state legal terms rather than describe the object.

### Reusability

- Removed unsupported pre-publication `schema:datePublished` values from all five records.
- Replaced the ambiguous `https://kgrid.org` attribution target with the approved organization ROR `https://ror.org/00jmfr291`.
- Standardized the affiliation as `Department of Learning Health Sciences, University of Michigan Medical School`.
- Retained the MIT SPDX license reference, scope statements, tests, evidence citations, and object-specific provenance descriptions.
- Deferred production DOI citation additions until DOI reservation and deferred SWHID provenance additions until exact post-tag Software Heritage resolution.

### Findability, interoperability, and core identity

- Confirmed that no Sandbox DOI was added to findability, citation, or core production metadata.
- Confirmed that no unverified SWHID was added to any Turtle record.
- Retained interoperability as an input/output/profile/interface facet; Zenodo and Software Heritage access facts do not belong there.
- Aligned the DFU Severity Score KO's `metadata.json`, access, existence, and reusability subject with its already-established canonical object-version IRI, `https://kgrid.org/kos/wagner/versions/ko-1.0`. Its tagged GitHub directory remains a distinct access and distribution location.
- For the other four objects, retained their established release-pinned GitHub object subjects rather than inventing new canonical `kgrid.org` object IRIs. The interoperability CKS IRIs continue to identify capabilities rather than substitute for KO identity.

## Validation

- All 25 Turtle facet files parse successfully.
- Every access action has an action type, name, target entry point, route, and access mechanism.
- The five existence records list 47 total metadata components: nine for each constituent KO and eleven for the KA.
- Every existence component path resolves to a real file, with no duplicate path in an object record.
- No unsupported FDO Bench access assertion remains.
- No unsupported publication date remains in reusability metadata.
- The KA dependency manifest was regenerated after constituent metadata changes.

## Deferred identifier additions

- Production Zenodo DOI statements remain scheduled for Phase 4 after DOI reservation.
- GitHub release routes become operational only after the proposed tags are created in Phase 5.
- Software Heritage identifiers and access routes remain scheduled after exact tagged-directory archival and verification in Phase 6 and the post-release metadata follow-up in Phase 8.
- Directory SWHIDs must not be embedded into the Version 1.0 directories they identify.

## Archive consequence

These metadata corrections changed all five object contents. The KA dependency manifest was regenerated, all five deterministic archives were built twice with identical SHA-256 values and byte sizes, and every earlier Sandbox file was replaced. Zenodo's MD5 for each replacement matches the corresponding local archive. Each unpublished draft again contains exactly one intended archive. The final digests and byte sizes are recorded in `release/zenodo-sandbox-drafts.json`.
