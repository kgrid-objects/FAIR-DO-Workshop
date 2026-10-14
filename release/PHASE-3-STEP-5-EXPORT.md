# Phase 3, Step 5 — Zenodo Sandbox metadata export

Completed on 2026-10-14. Zenodo Sandbox's authenticated draft-preview export produced one native JSON record for each of the five unpublished drafts. The exact downloaded exports are preserved without normalization in `release/zenodo-sandbox-exports/`.

| Object | Draft record ID | Parent record ID | Reserved Sandbox DOI | Export file |
|---|---:|---:|---|---|
| DFU Severity Score KO | 619883 | 619882 | `10.5072/zenodo.619883` | `619883.json` |
| HBOT Treatment Decision KO | 619885 | 619884 | `10.5072/zenodo.619885` | `619885.json` |
| HBOT Regimen Burden KO | 619887 | 619886 | `10.5072/zenodo.619887` | `619887.json` |
| DFU Prognostic Indicator KO | 619889 | 619888 | `10.5072/zenodo.619889` | `619889.json` |
| HBOT Treatment Target KA | 619891 | 619890 | `10.5072/zenodo.619891` | `619891.json` |

## Export validation

Every exported record was checked against `release/objects.json`, `release/zenodo-sandbox-drafts.json`, and the rebuilt local archive. All five exports confirm:

- draft status is true, published status is false, and record status is `draft`;
- the title, Software resource type, and Version `1.0.0` are correct;
- the license is MIT;
- the creator is the organizational creator `Knowledge Systems Lab`;
- the affiliation is `Department of Learning Health Sciences, University of Michigan Medical School`;
- the creator identifier is ROR `00jmfr291`;
- the reserved DOI matches the draft record;
- exactly one `application/gzip` archive is present;
- the filename, byte size, and Zenodo MD5 match the rebuilt local archive;
- one release-pinned GitHub `Is supplement to` relationship is present;
- each constituent KO has one reciprocal `Is required by` relationship to the KA; and
- the KA has four `Requires` relationships, one for each constituent KO.

## Export integrity

| Export | SHA-256 |
|---|---|
| `619883.json` | `5597f081b041848b4938dfcfb924c17b3e3425e8910abffadb9d41cfde6add63` |
| `619885.json` | `3ed0fa9e0c632733a95a598637570ce0eb006186e46e53fe7d56e5dedfeea56b` |
| `619887.json` | `6d4397dd7171a8848563e52ce45171dbf7834421cf1f10cd92c314ccad5cb93e` |
| `619889.json` | `b9cc7f91fd19b2828d041317dbf896596a7b3be505e440609e6fd03a421c7d83` |
| `619891.json` | `16d974aca15e8016a3e001f005c683846815bafc4c6976d879149de9c31de18c` |

Sandbox DOIs and parent record IDs remain rehearsal evidence only. They must not be copied into production metadata.
