# Phase 4, Step 8 — Turtle validation and evidence audit

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** All five `findability.metadata.txt` files parsed successfully as RDF/Turtle with RDFLib 7.1.4. No Turtle correction was required.

| Object | Parsed triples | RDF subject | Production DOI identifier |
| --- | ---: | --- | --- |
| DFU Severity Score KO | 128 | `https://kgrid.org/kos/wagner/versions/ko-1.0` | `https://doi.org/10.5281/zenodo.23367043` |
| HBOT Treatment Decision KO | 87 | release-tagged GitHub object directory | `https://doi.org/10.5281/zenodo.23367087` |
| HBOT Regimen Burden KO | 95 | release-tagged GitHub object directory | `https://doi.org/10.5281/zenodo.23367111` |
| DFU Prognostic Indicator KO | 90 | release-tagged GitHub object directory | `https://doi.org/10.5281/zenodo.23367115` |
| HBOT Treatment Target KA | 102 | release-tagged GitHub object directory | `https://doi.org/10.5281/zenodo.23367129` |

## Checks performed

For each graph, the audit confirmed:

- exactly one `schema:SoftwareSourceCode` subject and a matching `prov:Entity` type;
- the preserved local identifier matches the object's core `metadata.json`;
- the DOI IRI matches both `release/identifiers.template.json` and the reserved DOI in `release/zenodo-production-drafts.json`;
- the DOI and local identifier both occur in the corresponding core `metadata.json`;
- `schema:url` exactly matches the object-specific release-tagged directory in the identifier registry;
- exactly one `schema:isPartOf` value points to the correct release-tagged containing catalog;
- exactly one `schema:subjectOf` value points to the correct release-tagged `metadata.json` record;
- all graph IRIs use absolute HTTP or HTTPS identifiers;
- no production-facing Turtle contains a Sandbox DOI, SWHID placeholder, publication-date placeholder, or `schema:sameAs` assertion.

## Evidence sources

- the five `findability.metadata.txt` files;
- the five core `metadata.json` files;
- `release/objects.json`;
- `release/identifiers.template.json`;
- `release/zenodo-production-drafts.json`;
- the Phase 4 Steps 2–7 evidence records.

## Limitations retained by design

- The five proposed Git tags do not yet exist, so their live GitHub resolution remains a Phase 5 check.
- The reserved production DOIs are not registered and are not expected to dereference before publication.
- Public Zenodo record pages and directory SWHIDs do not yet exist and therefore are not asserted in the Turtle.

These limitations do not invalidate the current graphs: the identifiers and relationships are supported by release-candidate evidence, and their future live-resolution gates remain explicit in the workflow.
