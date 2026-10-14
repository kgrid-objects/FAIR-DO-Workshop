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
| `619883.json` | `600e863de440355764d337724126d99ae8e94b6c426149aaaf66930880b6ef2a` |
| `619885.json` | `26398c4508a16e7f89edaef42a2a24540ad46a7cddb3b29f95f3ce150b37c2c2` |
| `619887.json` | `93c92aec4345fbdb047343184887aaedced069ee53b86a1e316c3c4146bc3f55` |
| `619889.json` | `c1fc818547f4dec3547d10ec35ae53eda8d49ab69796addde4dc2368b72d89e8` |
| `619891.json` | `ecf06f9de31e4e3f8e64bf317712881d93df1466ff11ee615280d25667a0fd67` |

The exports were refreshed after Phase 3, Step 6 corrected the archive builder and replaced the five Sandbox files with the final reproducible archives.

Sandbox DOIs and parent record IDs remain rehearsal evidence only. They must not be copied into production metadata.
