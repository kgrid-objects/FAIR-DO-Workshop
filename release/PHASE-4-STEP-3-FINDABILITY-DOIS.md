# Phase 4, Step 3 — Production DOIs in findability metadata

Completed: 2026-10-14

## Result

**PASS.** Each object's reserved production DOI was added to its `findability.metadata.txt` as an IRI-valued `schema:identifier`. Every existing local identifier was preserved.

| Object | Preserved local identifier | Added DOI identifier IRI |
| --- | --- | --- |
| DFU Severity Score KO | `workshop-ko-1` | `https://doi.org/10.5281/zenodo.23367043` |
| HBOT Treatment Decision KO | `workshop-ko-2` | `https://doi.org/10.5281/zenodo.23367087` |
| HBOT Regimen Burden KO | `workshop-ko-3` | `https://doi.org/10.5281/zenodo.23367111` |
| DFU Prognostic Indicator KO | `workshop-ko-4` | `https://doi.org/10.5281/zenodo.23367115` |
| HBOT Treatment Target KA | `workshop-ka-1` | `https://doi.org/10.5281/zenodo.23367129` |

## Verification and profile disposition

- Source of DOI evidence: the five production Zenodo draft reservations recorded in `release/zenodo-production-drafts.json` and verified in Phase 4, Step 2.
- The canonical subject IRI, `schema:url`, local identifier, version, catalog relationships, controlled subjects, and technical discovery fields were preserved.
- No DOI replaced a canonical object-version IRI or landing-page URL.
- No `schema:sameAs` assertion was added.
- No Sandbox DOI, placeholder, empty value, or unsupported SWHID was added.
- All five resulting files parsed successfully as RDF/Turtle.

## Gap report

- Missing required findability fields: none introduced or discovered by this targeted update.
- Omitted optional fields: the production Zenodo record is not yet added under `schema:subjectOf`; Phase 4, Step 7 explicitly governs that indexed-record decision.
- Unresolved candidates or conflicts: none.
- External IRI verification: the DOI assignments were verified directly in their corresponding authenticated, unpublished Zenodo production drafts. Public DOI resolution is not expected until publication.
