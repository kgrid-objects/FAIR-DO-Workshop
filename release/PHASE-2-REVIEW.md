# Phase 2 release-branch review

- Review date: 2026-10-13
- Reviewed branch: `prepare-v1.0-releases`
- Reviewed remote commit: `af803dc8e54d59dba5429babfb88011ec5f23446`
- Outcome: Pass with one required date-field resolution before external deposits

## Review results

### Titles and versions — pass

For all five objects, the title in `release/objects.json` matches `metadata.json`, `CITATION.cff`, and `zenodo.sandbox.template.json`. Package and deposit versions consistently represent Version 1.0 as `1.0` or `1.0.0`, according to the applicable format.

### Object boundaries — pass

Each object has one exact release root in `release/content-policy.json`. No object root contains another object root. The KA archive is separate from the four constituent KO archives.

### Creator information — pass

All five objects consistently identify:

- Creator: Knowledge Systems Lab
- Affiliation: Department of Learning Health Sciences, University of Michigan Medical School
- ROR: `https://ror.org/00jmfr291`
- Contact: `kgrid-developers@umich.edu`

### License and copyright — pass

All five objects contain the identical MIT License and the approved copyright statement. The five license files have the same SHA-256 digest.

### Third-party content — pass

The third-party UHMS PDF is absent. Its citation and publisher-hosted link remain, its former checksum is recorded, and the archive builder blocks the file if it is reintroduced without a recorded rights-review override.

### Dependency relationships — pass

The KA dependency manifest binds exactly four constituent KOs. Each dependency path and proposed release tag matches `release/objects.json`. The KA Zenodo template declares four corresponding `Requires` relationships, currently represented by Sandbox DOI placeholders as intended for rehearsal.

### Proposed tag names — pass

The following tag names are internally consistent, object-specific, and unused in the GitHub repository as of the review date:

- `dfu-severity-score-ko-v1.0.0`
- `hbot-treatment-decision-ko-v1.0.0`
- `hbot-regimen-burden-ko-v1.0.0`
- `dfu-prognostic-indicator-ko-v1.0.0`
- `hbot-treatment-target-ka-v1.0.0`

## Required resolution before deposits

The five `CITATION.cff` and Zenodo template records contain different release/publication dates:

- DFU Severity Score KO: 2026-08-03
- HBOT Treatment Decision KO: 2026-08-05
- HBOT Regimen Burden KO: 2026-08-12
- DFU Prognostic Indicator KO: 2026-08-18
- HBOT Treatment Target KA: 2026-09-23

No corresponding Version 1.0 GitHub tags currently exist. Before Sandbox or production deposits, either:

1. confirm that these dates are supported original release dates and retain them with evidence; or
2. replace them with the actual Version 1.0 publication date when that date is known.

Do not invent or silently normalize the dates. This resolution belongs to Phase 2, Step 5.
