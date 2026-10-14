# Phase 4, Step 10 — DOI-complete archive rebuild

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** All five file-level content manifests, deterministic release archives, aggregate SHA-256 records, byte-size records, and file counts were regenerated from the current DOI-complete release candidate.

| Object | Files | Archive SHA-256 | Archive bytes | Content-manifest SHA-256 |
| --- | ---: | --- | ---: | --- |
| DFU Severity Score KO | 53 | `6a18182ab8e8bd06fa438ea5dc37d5e28ccd74fd72f13ef66f7f9ee4adb1d35c` | 928,509 | `fd7b5c05521450c598ebf36732714d97eedef7aa7a2852ea0cc1f58bbcd15a5f` |
| HBOT Treatment Decision KO | 28 | `57edfacd9ed418df7c0067596d0e5c0cfd28f4e9bdece057533129e64598952c` | 575,254 | `55ad22b979e7f9eb055377430dffa322b66aaf40b2757f6c95e5f4e468b60c84` |
| HBOT Regimen Burden KO | 152 | `fc3dc81841d62624b9392fb4f18f3b548a61576bb7c1d07ce25b41d65fef24b4` | 909,732 | `2344a9712bd0e550fd1e541ede8a7131f049388f46c1492bf1c783a87efbd2f6` |
| DFU Prognostic Indicator KO | 28 | `ed9d96fe219c22798a35d47d7a0b819d2f5e42abca7a9aa5c18f2ba7fe00ef5e` | 492,626 | `0258a08556914384faed3dd8014a5a5b6afc1de61890386c467f5f59c95a77a2` |
| HBOT Treatment Target KA | 54 | `7b4655caaad315b07fdee2946ec6825483e738ba2d4f6d71bb703dc1f7b4aedf` | 479,332 | `ff5645a7f67d72797fcbc90f653fee98ac43d044d1630a81594d1dcfca37b971` |

Total compressed archive size: **3,385,453 bytes**.

## Content manifests

The five tracked manifests under `release/manifests/` contain one SHA-256 entry for every Git-tracked file below the corresponding exact object root. Their line counts match the file counts in the table. The rights-excluded third-party PDF is absent.

## Archive integrity verification

For every archive:

- the package contains exactly one correctly named top-level directory;
- the number of extracted files equals the content-manifest line count;
- every extracted file passes its recorded SHA-256 check;
- `release/dist/SHA256SUMS` matches the five compressed archives;
- `release/dist/BYTE-SIZES.txt` matches the five compressed archive sizes.

## Clean-checkout reproduction

An isolated detached Git worktree was created at the current release-candidate commit. The content-manifest and archive builders were run independently in that clean checkout. The following were byte-for-byte identical to the primary build:

- all five `.files.sha256` content manifests;
- all five compressed `.tar.gz` archives;
- the aggregate `SHA256SUMS` file;
- the aggregate `BYTE-SIZES.txt` file.

This confirms that no untracked file, local installation, build timestamp, or current working-tree state affected the outputs.

## Storage disposition

The file-level content manifests are tracked release evidence. The binary archives and their aggregate checksum/size files remain under `release/dist/`, which is intentionally excluded by `.gitignore`; they are local upload artifacts rather than repository content. No archive was uploaded and no Zenodo record was published in this step.
