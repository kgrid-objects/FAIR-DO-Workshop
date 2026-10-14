# Phase 5, Step 3 — branch and annotated tags pushed to GitHub

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** The `prepare-v1.0-releases` branch and the five explicitly named annotated Version 1.0 tags were pushed to `https://github.com/kgrid-objects/FAIR-DO-Workshop.git`.

| Tag | Remote annotated-tag object | Remote peeled target |
| --- | --- | --- |
| `dfu-severity-score-ko-v1.0.0` | `12877fa8729911634b250411332ba5c17437c332` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-treatment-decision-ko-v1.0.0` | `6cc6353e197b2bc4d70031c867f137fc090e982b` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-regimen-burden-ko-v1.0.0` | `5dd9d8cdd9e4df3960d223d66c7087474e8761ca` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `dfu-prognostic-indicator-ko-v1.0.0` | `d85a98665e62989b4586a9cd39d8885e36462727` | `e42624bfed0b28ba35a743690141ef4f566af250` |
| `hbot-treatment-target-ka-v1.0.0` | `e9561f9c3d3fdd9ad7ce99d1845a996205e57dc7` | `e42624bfed0b28ba35a743690141ef4f566af250` |

## Remote verification

The remote was queried directly after the push. The audit confirmed:

- the remote branch matched the local `prepare-v1.0-releases` branch at the time of the tag push;
- each remote tag reference equals the corresponding local annotated tag-object ID;
- each remote peeled `^{}` reference equals the local peeled target;
- every peeled target is the DOI-complete Version 1.0 content-freeze commit;
- no wildcard or `--tags` push was used; only the five approved names were transferred.

The evidence commit containing this file is pushed immediately after it is created so the remote branch records completion of Step 3. The five tags intentionally remain fixed at the earlier content-freeze commit rather than moving to this evidence-only commit.

## Operational-ID state

The five object-specific GitHub tagged-directory URLs are now exposed by remote tags and can serve as the operational version-specific IDs for the KOs and KA. Full browser resolution and path verification remain Phase 5, Step 5 after the GitHub release records are created.

## Boundary retained

No GitHub release was created and no archive was uploaded in this step. No Zenodo record was published, and no Software Heritage request was initiated.
