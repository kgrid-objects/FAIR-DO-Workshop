# Version 1.0 identifier release workflow

This workflow prepares five independently citable records: four constituent Knowledge Objects (KOs) and the HBOT Treatment Target KA. It does not itself authorize any external deposit or publication.

## Identity rules that apply throughout

1. Each object is released independently and receives its own DOI, tagged GitHub location, archive, and directory SWHID.
2. A canonical object-version IRI, a DOI, an accessible landing-page URL, a tagged source location, and a directory SWHID have different roles. Do not silently substitute one for another.
3. Never put unresolved DOI or SWHID placeholders in `findability.metadata.txt`. Omit an unavailable optional identifier and report the gap until the real value exists.
4. A reserved production Zenodo DOI can be embedded before publication. A final Software Heritage directory SWHID cannot be embedded in the directory it identifies without changing that directory and therefore changing its SWHID.
5. Do not move or rewrite a published Version 1.0 tag. Post-release metadata additions belong in a later commit and must describe, rather than alter, the tagged Version 1.0 object.
6. Use `schema:sameAs` only when two identifiers denote the same object. Do not assert byte-for-byte identity between a Git directory and a differently packaged Zenodo archive.

## Phase 1 — Local release-candidate preparation

1. **Complete:** Create local branch `prepare-v1.0-releases` from commit `e2a074005470ecfaa2544ed7d5a25f3bc443b7ce`.
2. **Complete:** Remove the third-party PDF from the burden KO while retaining its citation, external source URL, and redistribution notice.
3. **Complete:** Resolve the high-severity npm advisory by updating `fast-uri` from 3.1.5 to 3.1.8. Confirm that `npm audit` reports zero vulnerabilities and all tests pass.
4. **Complete:** Add per-object licenses, citation files, Zenodo templates, and verified creator/affiliation information.
5. **Complete:** Define exact, independent release boundaries for the four KOs and the KA.
6. **Complete:** Replace mutable branch locators with proposed object-specific release-tag locators. Retain explicit DOI and SWHID placeholders only in files designed to be completed later; do not add them to Turtle findability records.
7. **Complete:** Regenerate the KA dependency manifest with exact constituent metadata checksums, package checksums, Git tree IDs, canonical archive digests, byte counts, and file counts.
8. **Complete:** Review and validate the complete local candidate and commit it as `6b445da`. All 227 tests pass. The validator's only remaining stop condition is the intentionally unresolved DOI/SWHID template values.

## Phase 2 — Governance approval and GitHub review

1. **Complete:** Allen Flynn, Faculty Lab Member, approved the copyright statement, MIT licensing for all five objects, and proceeding with release review on 2026-10-13. The approval and its authorization boundary are recorded in `release/RELEASE-APPROVAL.md`.
2. **Complete:** Allen Flynn, Faculty Lab Member, explicitly authorized external activity under this staged workflow on 2026-10-13. Later actions remain limited by their individual workflow steps and publication gates; see `release/RELEASE-APPROVAL.md`.
3. **Complete:** Pushed only `prepare-v1.0-releases` to GitHub at commit `af803dc8e54d59dba5429babfb88011ec5f23446`. No Version 1.0 tags or releases were created.
4. **Complete:** Reviewed titles, object boundaries, creator information, license scope, third-party notices, dependency relationships, and proposed tag names. The review passed with one required date-field resolution recorded in `release/PHASE-2-REVIEW.md`.
5. **Complete:** Resolved the unsupported release dates by removing them from `CITATION.cff` and replacing Zenodo template dates with `__PUBLICATION_DATE__`. The actual supported date will be inserted for each deposit and added to production citation metadata before content freeze. The disposition is recorded in `release/PHASE-2-REVIEW.md`.

## Phase 3 — Zenodo Sandbox rehearsal

1. **Complete:** Created four constituent KO drafts followed by one KA draft in Zenodo Sandbox. All five are unpublished software records. Draft IDs and URLs are recorded in `release/zenodo-sandbox-drafts.json`.
2. **Complete:** Built the five per-object archives twice with `release/build-archives.sh` and confirmed identical SHA-256 values across both builds. Uploaded exactly one corresponding archive to each unpublished draft and verified each upload reached 100%. Filenames, SHA-256 values, byte sizes, draft IDs, and URLs are recorded in `release/zenodo-sandbox-drafts.json`. The generated `release/dist/` directory remains local and is excluded from Git.
3. **Complete:** Reserved all five Sandbox DOIs. Added four `Requires` relationships from the KA to the constituent KOs and one reciprocal `IsRequiredBy` relationship from each KO to the KA. Zenodo Sandbox supports both relation types. All relationships use the DOI scheme and Software resource type; all records remain unpublished drafts. The DOI and relationship evidence is recorded in `release/zenodo-sandbox-drafts.json`.
4. **Complete:** Validated and corrected all five Sandbox drafts. Titles, Software resource type, organization name, approved affiliation, ROR, versions, MIT license, Sandbox DOIs, release-pinned GitHub `IsSupplementTo` links, DOI dependency relationships, file lists, upload completion, and archive bytes now pass. Full evidence is in `release/PHASE-3-STEP-4-VALIDATION.md`.
4A. **Complete:** Audited and corrected all FAIR metadata facets across the five objects before final rehearsal evidence export. Removed unsupported FDO Bench access claims, expanded existence inventories, corrected reusability provenance and premature publication dates, aligned the Severity KO's supported canonical identity, and deferred production DOI/SWHID access claims until they exist. Regenerated the KA dependency manifest, built all five archives twice with identical results, replaced every Sandbox file, and verified Zenodo/local MD5 agreement. Full evidence is in `release/PHASE-3-STEP-4A-CROSS-FACET-AUDIT.md` and `release/zenodo-sandbox-drafts.json`.
5. **Complete:** Exported Zenodo's native JSON metadata for all five corrected unpublished drafts. Recorded draft IDs, parent record IDs, reserved Sandbox DOIs, exact export files, export SHA-256 values, file metadata, and relationship validation in `release/zenodo-sandbox-exports/`, `release/zenodo-sandbox-drafts.json`, and `release/PHASE-3-STEP-5-EXPORT.md`.
6. **Complete:** Rebuilt all five archives in an isolated detached clean checkout. The initial test exposed commit-ID and build-time coupling in the archive builder; corrected it by anchoring each exact object tree to a deterministic synthetic commit. The clean rebuild is now byte-for-byte identical for all five archives. Replaced the Sandbox files with the final archives and refreshed the native JSON exports. Evidence is in `release/PHASE-3-STEP-6-CLEAN-REBUILD.md`.
7. **Complete:** Confirmed that real Sandbox DOIs, URLs, draft IDs, and parent record IDs remain confined to rehearsal evidence under `release/` and have not entered any release-object directory or production-facing `findability.metadata.txt`, `metadata.json`, or `CITATION.cff` record. Intentional unresolved tokens remain placeholders rather than issued identifiers. Evidence is in `release/PHASE-3-STEP-7-SANDBOX-IDENTIFIER-AUDIT.md`.

## Phase 4 — Reserve production DOIs and freeze findability metadata

**Authorized:** Allen Flynn, Faculty Lab Member, explicitly authorized Phase 4 production-deposit preparation on 2026-10-14. The authorization is limited to unpublished production drafts, DOI integration, validation, and content freeze; it does not authorize publication or later-phase external actions. See `release/RELEASE-APPROVAL.md`.

1. **Complete:** Created five unpublished production Zenodo software drafts in the required order: four constituent KOs first, followed by the KA. No files were uploaded and no production DOI was reserved. Draft IDs and URLs are recorded in `release/zenodo-production-drafts.json`; full evidence is in `release/PHASE-4-STEP-1-PRODUCTION-DRAFTS.md`.
2. **Complete:** Reserved one production DOI for each of the five unpublished drafts and saved every reservation without publishing a record. The DOI-to-object mapping is recorded in `release/zenodo-production-drafts.json`; evidence is in `release/PHASE-4-STEP-2-PRODUCTION-DOIS.md`.
3. **Complete:** Added each reserved production DOI to the corresponding `findability.metadata.txt` as an IRI-valued `schema:identifier` while preserving the existing local identifier. All five records parse as Turtle, and no Sandbox identifier or `schema:sameAs` assertion was introduced. Evidence and the aggregate gap report are in `release/PHASE-4-STEP-3-FINDABILITY-DOIS.md`.
4. **Complete with a disclosed pre-tag limitation:** Every findability record now explicitly declares its proposed object-specific, release-tagged GitHub directory as `schema:url`, and every access record retains that exact directory as a release-pinned retrieval route. The Severity KO preserves its independently evidenced KGrid object-version IRI. The other four objects retain their existing GitHub subject IRIs because no separate packaged-object IRI is evidenced; no new identity was invented. Live URL resolution remains deferred until Phase 5 creates and pushes the tags. Evidence and the aggregate gap report are in `release/PHASE-4-STEP-4-URL-ROLES.md`.
5. **Complete:** Added each reserved production DOI to the corresponding `metadata.json` and `CITATION.cff`, and verified it in the unpublished production Zenodo draft. Aligned each draft's core description, organizational creator, affiliation, ROR, version, MIT license, copyright, repository URL, and release-tagged `IsSupplementTo` source relationship. No record was published, and KA dependency relations remain deferred to Step 6. Evidence is in `release/PHASE-4-STEP-5-DOI-INTEGRATION.md` and `release/zenodo-production-drafts.json`.
6. **Complete:** Added four DOI-scheme `Requires` relationships from the unpublished KA Zenodo draft to the four constituent KO drafts and one reciprocal `IsRequiredBy` relationship from each constituent draft to the KA. Added the production DOI dependency bindings to the KA's `metadata.json`, dependency manifest, identifier registry, and manifest-regeneration logic. All five records remain unpublished with zero files. Evidence is in `release/PHASE-4-STEP-6-DEPENDENCY-RELATIONSHIPS.md` and `release/zenodo-production-drafts.json`.
7. **Complete:** Verified the release-pinned GitHub `schema:isPartOf` catalog link and `schema:subjectOf` metadata-record link for all five objects. The four constituent records were already correct; added the two missing release-pinned indexing statements to the KA. Deliberately did not add authenticated Zenodo draft URLs or not-yet-existing public record URLs as indexed records. Evidence and the aggregate gap report are in `release/PHASE-4-STEP-7-FINDABILITY-INDEXING.md`.
8. **Complete:** Parsed all five findability records as RDF/Turtle and cross-checked each subject, local identifier, production DOI, human-facing URL, containing-catalog link, and indexed metadata-record link against the object registry, core metadata, identifier registry, and Zenodo reservation evidence. No Turtle placeholder or `schema:sameAs` assertion occurs, and no correction was required. Evidence is in `release/PHASE-4-STEP-8-TURTLE-VALIDATION.md`.
9. **Complete:** Regenerated the KA dependency manifest from the current release-candidate tree after the constituent DOI metadata changes. Recomputed and independently verified all four metadata checksums, package checksums, directory tree IDs, canonical archive digests and byte sizes, file counts, release locators, production DOI bindings, and pending directory-SWHID states. A second regeneration was byte-stable. Evidence is in `release/PHASE-4-STEP-9-DEPENDENCY-MANIFEST.md`.
10. **Complete:** Regenerated all five file-level content manifests and deterministic release archives from the DOI-complete candidate. Recomputed archive checksums, byte sizes, and file counts; verified every extracted file against its content manifest; and reproduced every output byte-for-byte in an isolated detached clean checkout. Evidence is in `release/PHASE-4-STEP-10-ARCHIVE-REBUILD.md`, with file manifests under `release/manifests/` and local build outputs under the intentionally ignored `release/dist/` directory.
11. **Complete:** Ran the complete release validator and all five object test suites. Corrected the validator's obsolete placeholder rule so it rejects Sandbox DOI or publication-date tokens outside Sandbox-only templates, verifies complete production DOI bindings, and validates the exact intentionally pending SWHID fields against the identifier registry and KA dependency manifest. Final result: validator exit 0, 227 tests passed, zero failed. Evidence is in `release/PHASE-4-STEP-11-RELEASE-VALIDATION.md`.
12. **Complete:** Re-ran the complete validator with 227 passing tests and committed the DOI-complete release candidate as the intended Version 1.0 content freeze. The freeze commit is identified by the Git commit containing `release/PHASE-4-STEP-12-CONTENT-FREEZE.md` and the commit message `Freeze DOI-complete Version 1.0 candidate`; its resulting SHA is recorded in the release-preparation conversation and Git history because a commit cannot contain its own content-derived identifier. No tag, push, GitHub release, archive upload, Zenodo publication, or Software Heritage request was performed.

## Phase 5 — Create and expose the immutable GitHub release identity

**Authorized:** Allen Flynn, Faculty Lab Member, explicitly authorized Phase 5 on 2026-10-14. Phase 5 establishes the five GitHub tagged directory URLs as the operational version-specific KO and KA identifiers. It does not authorize Zenodo publication or Software Heritage archival. See `release/RELEASE-APPROVAL.md`.

1. **Complete:** Created one local annotated Version 1.0 tag per object using the exact names in `release/objects.json`. All five annotated tag objects point to the DOI-complete content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`; no tag was pushed. Evidence is in `release/PHASE-5-STEP-1-ANNOTATED-TAGS.md`.
2. **Complete:** Independently verified all five references as unique annotated tag objects that peel to content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`. Confirmed each tagged object directory exists as a Git tree, matches the frozen directory tree, maps to the intended registry entry, and produces the exact future operational GitHub tagged-directory URL. Evidence is in `release/PHASE-5-STEP-2-TAG-VERIFICATION.md`.
3. **Complete:** Pushed the `prepare-v1.0-releases` branch and only the five explicitly named annotated Version 1.0 tags to GitHub. Independently queried the remote refs and confirmed the branch commit, all five annotated tag-object IDs, and all five peeled targets match locally; every tag peels to content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`. Evidence is in `release/PHASE-5-STEP-3-REMOTE-TAGS.md`.
4. Create one GitHub release per object and attach only that object's deterministic archive and checksum evidence.
5. Verify that every release-tag URL, raw metadata URL, notebook URL, and archive link resolves as intended.
6. Do not move these tags after they become public.

## Phase 6 — Software Heritage archival and SWHID registration

1. Request Software Heritage archival of the tagged public repository state.
2. Resolve each object directory at its release tag and capture its unqualified directory SWHID: `swh:1:dir:<directory-hash>`.
3. Capture the qualified SWHID with origin, snapshot, revision anchor, and directory path for provenance and navigation.
4. Verify that each SWHID resolves to the exact tagged directory. Record the verification date and evidence.
5. Add the unqualified directory SWHID to the corresponding unpublished Zenodo draft as a related identifier. Use the qualified SWHID in release evidence where provenance/navigation is needed.
6. Use `IsIdenticalTo` only if the deposited artifact is proven to reproduce the identified directory exactly. Otherwise use `IsSupplementTo` or another accurate relationship and explain the packaging difference.
7. Store all five SWHIDs in the release-evidence record and the identifier registry used by the workflow.
8. Do not insert a directory SWHID into the already tagged directory: doing so would change the directory hash and invalidate the assertion.

## Phase 7 — Publish Zenodo records

1. Recheck the four constituent drafts, including DOI, GitHub tag, SWHID relationship, archive digest, file list, creator, affiliation, version, license, and KA relationship.
2. Publish the four constituent KO records first.
3. Confirm the four DOI landing pages resolve and their metadata is correct.
4. Recheck the KA draft and its `Requires` relationships against the now-published constituent records.
5. Publish the KA record last.
6. Confirm the KA DOI landing page and all five cross-record relationships resolve correctly.
7. Export the final Zenodo metadata and record IDs into the release-evidence record.

## Phase 8 — Post-release findability completion and audit

1. Create a metadata-only follow-up commit after publication.
2. In each `findability.metadata.txt`, add supported post-release discovery links that could not exist at content freeze, such as the published Zenodo catalog record and the object's SWHID.
3. Keep the tagged Version 1.0 object as the subject of those assertions. Clearly state that the follow-up record describes the frozen release; it does not redefine or replace it.
4. Where the findability profile supports it, retain:
   - the local identifier and production DOI under `schema:identifier`;
   - the canonical object-version IRI as the RDF subject;
   - a human-facing landing page under `schema:url`;
   - the tagged containing catalog under `schema:isPartOf`;
   - the tagged metadata record and published Zenodo record under `schema:subjectOf`;
   - the SWHID as an additional persistent content identifier only after exact resolution is verified.
5. Do not add purpose, detailed access conditions, licensing, provenance, testing, or evidence statements merely to duplicate other FAIR facets. Add only concise information that materially improves discovery and identification.
6. Validate all Turtle, JSON, YAML, checksums, cross-record relationships, tag resolutions, DOI resolutions, and SWHID resolutions.
7. Re-run all tests and archive verification from a clean clone.
8. Publish the follow-up metadata commit without changing the five Version 1.0 tags.
9. Close the release only after the evidence record shows all checks complete.

## Immediate next step

Proceed with **Phase 5, Step 4**: create one GitHub release per object from its existing verified tag and attach only that object's deterministic archive and checksum evidence.
