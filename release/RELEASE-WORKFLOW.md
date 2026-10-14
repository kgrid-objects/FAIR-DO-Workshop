# Version 1.0 identifier release workflow

This workflow prepares five independently citable records. It does not authorize publication.

## Gates before any deposit

1. **Pending:** Obtain an authorized organizational release approver and confirm the copyright statement before any external deposit or publication.
2. **Complete:** The third-party PDF was removed. Its citation, external source URL, and redistribution notice remain in `collection/HBOT-Regimen-Burden-KO/THIRD_PARTY_NOTICES.md`.
3. **Complete:** Updated `fast-uri` in the burden KO lockfile from 3.1.5 to 3.1.8. `npm audit` now reports zero vulnerabilities, and the tests pass.
4. **Complete:** Replaced mutable `tree/main` and `raw/.../main` references with proposed object-specific release tags. DOI and SWHID fields remain explicit placeholders until those identifiers exist. A DOI is not used as an execution locator.
5. **Complete for the local candidate:** Regenerated the KA dependency manifest with current metadata checksums, package checksums, Git tree IDs, canonical archive digests, byte counts, and file counts. Run `release/regenerate-dependency-manifest.js` again after replacing identifier placeholders.

## Candidate build and identity

1. **Complete:** Prepared on local branch `prepare-v1.0-releases`, based on commit `e2a074005470ecfaa2544ed7d5a25f3bc443b7ce`.
2. **Complete for the local candidate:** `release/validate-release.sh` passes its syntax, content, security, checksum, and test checks. It intentionally remains blocked by unresolved DOI and SWHID placeholders.
3. Create one annotated tag per object, using the names in `release/objects.json`. Tags may point to the same monorepo commit but each Zenodo upload must contain only its object's directory.
4. Build deterministic per-object `.tar.gz` archives with `release/build-archives.sh`. The archive builder rejects the burden archive if the removed third-party PDF is reintroduced without an explicit, recorded rights-review override.
5. Archive the tagged public commit in Software Heritage. Resolve each directory at the tag and record its qualified directory SWHID: `swh:1:dir:<directory-hash>;origin=https://github.com/kgrid-objects/FAIR-DO-Workshop;visit=swh:1:snp:<snapshot>;anchor=swh:1:rev:<revision>;path=/.../`. Use the unqualified directory SWHID for content identity and the qualified form for provenance/navigation.

## Zenodo Sandbox sequence

1. Create four constituent KO drafts first in Zenodo Sandbox. Upload the corresponding deterministic archives and metadata derived from each `zenodo.sandbox.template.json`.
2. Reserve Sandbox DOIs; substitute them into the KA template placeholders. Use DataCite `Requires` from the KA to each KO. Add reciprocal `IsRequiredBy` relations to constituent drafts if the Sandbox UI/API supports editing after all reservations.
3. Add the final directory SWHID to each record as a related identifier (use `IsIdenticalTo` only for an archive that exactly reproduces the directory content; otherwise use `IsSupplementTo` and explain the packaging difference).
4. Validate titles, organization creator, affiliation, ROR in notes, version, license scope, related identifiers, archive SHA-256, and file list. Publish only Sandbox records during rehearsal.
5. Export the Sandbox metadata and record IDs into a release evidence file. Rebuild from a clean clone and confirm identical digests.

## Production sequence (requires explicit authorization)

Repeat the proven Sandbox sequence in production Zenodo. Reserve constituent DOIs, update and validate the assembly relationships, then publish constituents before the assembly. Create the GitHub releases/tags and request Software Heritage archival only under the same authorization. After DOI issuance, replace placeholders in CITATION.cff and object metadata in a follow-up commit; do not rewrite the released tag.
