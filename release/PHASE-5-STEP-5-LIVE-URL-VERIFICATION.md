# Phase 5, Step 5 — live release URL verification

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** The live GitHub identity, metadata, notebook, release-page, and release-asset routes for all five Version 1.0 objects resolve to their intended tags and content. No tag, release, asset, object file, or Zenodo draft was changed during this read-only verification.

## Operational identifiers and metadata

For each object, the operational tagged-directory URL returned HTTP 200 and the GitHub contents API confirmed that the tagged path is a directory. Each GitHub release page returned HTTP 200. Each release-tagged raw `metadata.json` returned HTTP 200, and its SHA-256 digest exactly matched `git show <tag>:<object-path>/metadata.json`.

| Object | Tag | Tagged directory | Release page | Raw metadata |
| --- | --- | --- | --- | --- |
| DFU Severity Score KO | `dfu-severity-score-ko-v1.0.0` | 200 / directory | 200 | 200 / byte match |
| HBOT Treatment Decision KO | `hbot-treatment-decision-ko-v1.0.0` | 200 / directory | 200 | 200 / byte match |
| HBOT Regimen Burden KO | `hbot-regimen-burden-ko-v1.0.0` | 200 / directory | 200 | 200 / byte match |
| DFU Prognostic Indicator KO | `dfu-prognostic-indicator-ko-v1.0.0` | 200 / directory | 200 | 200 / byte match |
| HBOT Treatment Target KA | `hbot-treatment-target-ka-v1.0.0` | 200 / directory | 200 | 200 / byte match |

This confirms the five GitHub tagged-directory URLs now function as the operational version-specific KO and KA identifiers established by Phase 5.

## Notebook routes

All 14 notebook files in the five tagged object directories were checked through both their GitHub human-facing blob route and their `raw.githubusercontent.com` content route. Every route returned HTTP 200, and every downloaded raw notebook was byte-identical to the file in its corresponding annotated tag.

The 14 user-facing launch routes published in the object READMEs were also checked:

- five Binder routes returned HTTP 200;
- five Colab routes returned HTTP 200;
- four Scribbler routes returned HTTP 200;
- every route contains the intended object-specific Version 1.0 tag, including the nested raw URL used by Scribbler.

The KA has Binder and Colab notebooks but no Scribbler notebook, accounting for the 5/5/4 route count.

## Release assets

The GitHub release API reported exactly three browser-download links per release. All 15 assets were downloaded from the live releases and compared with the frozen local release outputs.

| Object | Assets | Archive | Archive sidecar | File manifest |
| --- | ---: | --- | --- | --- |
| DFU Severity Score KO | 3 | byte match | byte match | byte match |
| HBOT Treatment Decision KO | 3 | byte match | byte match | byte match |
| HBOT Regimen Burden KO | 3 | byte match | byte match | byte match |
| DFU Prognostic Indicator KO | 3 | byte match | byte match | byte match |
| HBOT Treatment Target KA | 3 | byte match | byte match | byte match |

The archive SHA-256 values remain:

| Object | SHA-256 |
| --- | --- |
| DFU Severity Score KO | `6a18182ab8e8bd06fa438ea5dc37d5e28ccd74fd72f13ef66f7f9ee4adb1d35c` |
| HBOT Treatment Decision KO | `57edfacd9ed418df7c0067596d0e5c0cfd28f4e9bdece057533129e64598952c` |
| HBOT Regimen Burden KO | `fc3dc81841d62624b9392fb4f18f3b548a61576bb7c1d07ce25b41d65fef24b4` |
| DFU Prognostic Indicator KO | `ed9d96fe219c22798a35d47d7a0b819d2f5e42abca7a9aa5c18f2ba7fe00ef5e` |
| HBOT Treatment Target KA | `7b4655caaad315b07fdee2946ec6825483e738ba2d4f6d71bb703dc1f7b4aedf` |

## Interpretation and boundary

An HTTP success was not treated as sufficient for content-bearing routes: raw metadata, raw notebooks, and all release assets were compared with the immutable tagged or frozen local bytes. The GitHub tagged-directory URLs are therefore live and operational before Zenodo publication.

This step does not assert that reserved Zenodo DOIs dereference publicly. Those records remain unpublished. It also does not request Software Heritage archival, publish Zenodo records, or move any tag.
