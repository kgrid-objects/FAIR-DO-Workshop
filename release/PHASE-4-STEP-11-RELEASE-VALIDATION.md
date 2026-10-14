# Phase 4, Step 11 — complete release validation

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** The final release validator exited with status 0. All five object test suites passed: **227 tests passed, zero failed, zero skipped, and zero cancelled**.

| Object | Tests | Passed | Failed |
| --- | ---: | ---: | ---: |
| DFU Severity Score KO | 39 | 39 | 0 |
| HBOT Treatment Decision KO | 57 | 57 | 0 |
| HBOT Regimen Burden KO | 10 | 10 | 0 |
| DFU Prognostic Indicator KO | 24 | 24 | 0 |
| HBOT Treatment Target KA | 97 | 97 | 0 |
| **Total** | **227** | **227** | **0** |

## Validator correction

The initial run executed all tests successfully but returned a blocked status because the validator still used the pre-Phase-4 rule that treated every DOI or SWHID template token as unresolved. That rule no longer represented the release workflow:

- production DOIs have been reserved and integrated;
- the `zenodo.sandbox.template.json` files remain explicitly Sandbox-only rehearsal templates;
- directory SWHIDs cannot be known until the tagged repository is archived in Phase 6.

The validator was corrected to enforce the current boundary:

- a `__SANDBOX_DOI_...__` token is forbidden outside a Sandbox-only deposit template;
- a `__PUBLICATION_DATE__` token is forbidden outside a Sandbox-only deposit template;
- every object must have a syntactically valid reserved production DOI in the identifier registry;
- every core `metadata.json` must contain that production DOI;
- every core `metadata.json` must retain exactly the directory-SWHID placeholder assigned by the registry;
- every KA dependency must match the registry's production DOI and pending directory-SWHID value;
- no `sandboxDoi` field may remain in the KA dependency manifest.

This was a release-tooling correction only. It did not change any of the five packaged object directories, so it did not invalidate the dependency-manifest regeneration, content manifests, or deterministic archives from Steps 9 and 10.

## Other release gates

The final validator also confirmed:

- all required JSON files parse;
- no mutable `main` or `HEAD` GitHub locator remains in release-significant object files;
- the rights-uncleared third-party PDF is absent;
- each object contains its required license, citation file, and Sandbox-only deposit template;
- production DOI bindings are complete;
- the remaining SWHID fields are internally consistent and intentionally pending.

## Boundary retained

No Git tag or GitHub release was created or pushed. No archive was uploaded. No Zenodo record was published. No Software Heritage archival request was initiated.
