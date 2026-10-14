# Phase 5, Step 4 — object-specific GitHub releases

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** Five public GitHub releases were created from the five existing verified annotated tags. No new or replacement tag was created by the release operation.

| Object | GitHub release | Archive SHA-256 | Archive bytes |
| --- | --- | --- | ---: |
| DFU Severity Score KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/releases/tag/dfu-severity-score-ko-v1.0.0` | `6a18182ab8e8bd06fa438ea5dc37d5e28ccd74fd72f13ef66f7f9ee4adb1d35c` | 928,509 |
| HBOT Treatment Decision KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/releases/tag/hbot-treatment-decision-ko-v1.0.0` | `57edfacd9ed418df7c0067596d0e5c0cfd28f4e9bdece057533129e64598952c` | 575,254 |
| HBOT Regimen Burden KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/releases/tag/hbot-regimen-burden-ko-v1.0.0` | `fc3dc81841d62624b9392fb4f18f3b548a61576bb7c1d07ce25b41d65fef24b4` | 909,732 |
| DFU Prognostic Indicator KO | `https://github.com/kgrid-objects/FAIR-DO-Workshop/releases/tag/dfu-prognostic-indicator-ko-v1.0.0` | `ed9d96fe219c22798a35d47d7a0b819d2f5e42abca7a9aa5c18f2ba7fe00ef5e` | 492,626 |
| HBOT Treatment Target KA | `https://github.com/kgrid-objects/FAIR-DO-Workshop/releases/tag/hbot-treatment-target-ka-v1.0.0` | `7b4655caaad315b07fdee2946ec6825483e738ba2d4f6d71bb703dc1f7b4aedf` | 479,332 |

## Asset policy and verification

Each release contains exactly three assets belonging only to that object:

1. `<object-key>-v1.0.0.tar.gz` — deterministic release archive;
2. `<object-key>-v1.0.0.tar.gz.sha256` — checksum sidecar for the compressed archive;
3. `<object-key>.files.sha256` — file-level manifest for the archive contents.

Across the five releases, the audit confirmed:

- exactly 15 assets are present, three per release;
- every asset reports state `uploaded`;
- every remote asset byte size equals the corresponding local file;
- GitHub's reported SHA-256 digest for every archive equals the digest recorded in Phase 4, Step 10;
- GitHub's reported SHA-256 digest for every file-level manifest equals its local digest;
- no release contains an asset belonging to another object;
- none of the releases is a draft or prerelease;
- none was designated the repository-wide “latest” release, because the monorepo contains five peer release units.

## Release notes

Each release note identifies its GitHub tagged-directory URL as the operational version-specific ID. Each also states that the corresponding Zenodo DOI is reserved but remains unpublished.

## Boundary retained

This step publishes GitHub release records and their approved assets under the Phase 5 authorization. It does not publish a Zenodo record and does not initiate Software Heritage archival.
