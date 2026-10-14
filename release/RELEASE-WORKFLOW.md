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
3. Add each object's reserved DOI to its `findability.metadata.txt` as a supported `schema:identifier` IRI while preserving its existing local identifier.
4. Set or verify `schema:url` as the supported human-facing landing page and retain the exact release-tag source URL as a distinct, release-pinned access or catalog location. Do not replace the canonical object-version IRI merely because a DOI now exists.
5. Add the reserved DOI to the same object's `metadata.json`, `CITATION.cff`, and Zenodo metadata.
6. Add the four constituent DOI relationships to the KA Zenodo metadata, KA metadata, and KA dependency manifest. Add reciprocal relations to the constituent drafts when supported.
7. In each `findability.metadata.txt`, verify the release-pinned `schema:isPartOf` catalog link and `schema:subjectOf` indexed-record links. Add the Zenodo record as an indexed record only when the production record URL is known and supported.
8. Validate all five Turtle records. Confirm that every identifier and relationship is evidenced, no placeholders occur in Turtle, and no unsupported `schema:sameAs` claim has been introduced.
9. Regenerate the KA dependency manifest because constituent metadata changed.
10. Regenerate all content manifests, checksums, file counts, and deterministic archives.
11. Run the complete release validator and all tests. The DOI placeholders should now be resolved; SWHID template fields remain pending by design.
12. Commit the DOI-complete release candidate. This commit is the intended Version 1.0 content freeze.

## Phase 5 — Create and expose the immutable GitHub release identity

1. Create one annotated Version 1.0 tag per object using the names in `release/objects.json`. The tags may point to the same monorepo commit, but each object remains an independent release unit.
2. Verify every tag points to the DOI-complete content-freeze commit.
3. Push the final commit and the five annotated tags to GitHub.
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

Proceed with **Phase 4, Step 3**: add each object's reserved production DOI to its `findability.metadata.txt` as a supported `schema:identifier` IRI while preserving the existing local identifier.
