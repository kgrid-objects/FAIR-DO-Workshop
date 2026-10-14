# Phase 3, Step 4 — Zenodo Sandbox metadata validation

Validation was performed on 2026-10-13 against the five unpublished Zenodo Sandbox drafts recorded in `release/zenodo-sandbox-drafts.json` and the approved local metadata in `release/objects.json` and each object's `zenodo.sandbox.template.json`.

## Result

**Passed after correction and revalidation on 2026-10-14.** No record was published during correction or validation.

## Checks that passed for all five drafts

- The title exactly matches the corresponding release object and Zenodo template.
- Resource type is Software.
- Version is `1.0.0`.
- Creator name is `Knowledge Systems Lab` and the creator is represented as an organization.
- The reserved Sandbox DOI is present and matches the draft ID.
- Each draft contains exactly one intended archive, and every upload reports 100% complete.
- Each Zenodo-reported archive MD5 matches the locally computed MD5, confirming that the uploaded bytes match the locally validated archive.
- Every local archive still matches its recorded SHA-256 value in `release/dist/SHA256SUMS` and `release/zenodo-sandbox-drafts.json`.
- The KA has four DOI-scheme `Requires` relationships, one to each constituent KO.
- Each constituent KO has one reciprocal DOI-scheme `Is required by` relationship to the KA.
- All five records remain unpublished drafts.

## Initial defects found in all five drafts

1. **License:** Zenodo contains its default Creative Commons Attribution 4.0 International license. The approved software license and each object's template require MIT.
2. **Creator affiliation:** The organization creator lacks `Department of Learning Health Sciences, University of Michigan Medical School`.
3. **Creator ROR:** The organization creator lacks the approved ROR identifier `https://ror.org/00jmfr291`.
4. **Tagged GitHub relationship:** The template's release-pinned GitHub URL with relation `IsSupplementTo` is absent. The DOI dependency relationships are correct but do not replace this source relationship.

## Corrections completed on 2026-10-14

- Replaced Creative Commons Attribution 4.0 International with MIT on all five drafts.
- Added `Department of Learning Health Sciences, University of Michigan Medical School` to the organization creator on all five drafts.
- Added the ROR identifier `https://ror.org/00jmfr291`; Zenodo normalizes and displays the saved identifier as `00jmfr291` in its creator editor.
- Added each object's release-pinned GitHub URL with relation `Is supplement to`, URL scheme, and Software resource type.
- Saved and reopened every draft. Revalidation confirmed the four corrections, preserved DOI dependency relationships, exact file boundaries, and unpublished-draft state.

## Archive byte verification

| Draft | Archive | Local SHA-256 | Zenodo/local MD5 |
|---|---|---|---|
| 619883 | `dfu-severity-score-ko-v1.0.0.tar.gz` | `4399005593c5cf22a04e60a6c91128fe3f08e41fecc54abe4f213b34ec4715c9` | `1d6e6050d4972e2b5ddc4f8d3d1f8b48` |
| 619885 | `hbot-treatment-decision-ko-v1.0.0.tar.gz` | `c6d1c9664268bf5d4e6336e29e159e744cd763706c5128791188a625f1e94ffd` | `248352683387577f479deb62cb958655` |
| 619887 | `hbot-regimen-burden-ko-v1.0.0.tar.gz` | `020e38834dad569727016aaa01c301ce6dc6a9843404f6f689bb6ae838532e9b` | `05185c402893a5583a7ac4a9a6fd8359` |
| 619889 | `dfu-prognostic-indicator-ko-v1.0.0.tar.gz` | `3451e26758d0a297218093b019f57b8a1c324a3fdea21dce7d9efad928c5cde7` | `940b9abbd8104b612fceded12b8e7e09` |
| 619891 | `hbot-treatment-target-ka-v1.0.0.tar.gz` | `9ecf510f9e1115406ddff48dfa40d4da2426f159b6d6d2d8a702e84ef1d379ec` | `0122fc0aba3397f75e07aa06be16877f` |

## Disposition

Phase 3, Step 4 passes. Proceed to Phase 3, Step 5.
