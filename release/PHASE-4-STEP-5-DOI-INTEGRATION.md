# Phase 4, Step 5 — Production DOI and Zenodo metadata integration

Completed: 2026-10-14

## Result

**PASS.** Each reserved production DOI is now represented consistently in the corresponding core `metadata.json`, `CITATION.cff`, `findability.metadata.txt`, and unpublished production Zenodo draft.

| Object | Production DOI |
| --- | --- |
| DFU Severity Score KO | `10.5281/zenodo.23367043` |
| HBOT Treatment Decision KO | `10.5281/zenodo.23367087` |
| HBOT Regimen Burden KO | `10.5281/zenodo.23367111` |
| DFU Prognostic Indicator KO | `10.5281/zenodo.23367115` |
| HBOT Treatment Target KA | `10.5281/zenodo.23367129` |

## Local metadata changes

- Replaced each object-level `__SANDBOX_DOI_...__` token in `metadata.json` with its production DOI URL under `dc:identifier`.
- Added the corresponding bare DOI in the standard `doi` field of each `CITATION.cff`.
- Preserved the unresolved SWHID tokens because Software Heritage registration is a later phase.
- Did not replace the canonical RDF subject, local identifier, release-tag source URL, or `schema:url`.

## Unpublished Zenodo draft metadata

Each production draft was saved with:

- its reserved `10.5281/zenodo...` DOI;
- Software resource type;
- the approved title and description;
- version `1.0.0`;
- organization creator `Knowledge Systems Lab`;
- affiliation `Department of Learning Health Sciences, University of Michigan Medical School`;
- ROR `https://ror.org/00jmfr291`;
- MIT License;
- the approved copyright statement;
- repository URL `https://github.com/kgrid-objects/FAIR-DO-Workshop`; and
- an `IsSupplementTo` URL relationship to the exact proposed release-tagged object directory, typed as Software.

All five records continued to display as drafts with the Publish control disabled because no archive has yet been uploaded. No record was published. KA-to-KO dependency relationships were intentionally left for Phase 4, Step 6.

The machine-readable production draft registry is `release/zenodo-production-drafts.json`.
