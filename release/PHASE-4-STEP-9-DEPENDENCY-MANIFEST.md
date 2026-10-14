# Phase 4, Step 9 — KA dependency-manifest regeneration

Completed on 2026-10-14 under the Phase 4 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** `HBOT-Treatment-Target-KA/specs/KA_Dependency_Manifest.json` was regenerated from the current release-candidate tree after the four constituent objects received production DOI metadata.

| Dependency | Git directory tree | Canonical archive SHA-256 | Bytes | Files | Production DOI |
| --- | --- | --- | ---: | ---: | --- |
| DEP-WAGNER | `fb77576f75636d1c791df2909c7c37104a6647a2` | `3ed13d27767273b0d2d6aaee1de2ee63f6034f23dd49aafc39435c03bc7f0f58` | 1,259,520 | 53 | `10.5281/zenodo.23367043` |
| DEP-HBOT-DECISION | `a0a34c184ae4a6978b204cca5b2f75401f4b241e` | `c5148ab3ba22491cecfe00144354cdff411e03c7c525f1f085bde504eb6930b8` | 839,680 | 28 | `10.5281/zenodo.23367087` |
| DEP-BURDEN | `a750ec9a77be626432c8cbe40228de750aa24572` | `1ff2bdf026bfa2f3084c8b61543fa224f9ff4431105049ca3cf6138d52233cb6` | 2,570,240 | 152 | `10.5281/zenodo.23367111` |
| DEP-MARGOLIS | `e6e33398c9ee609bc6698c3606f80a1d481783f9` | `fb1bfa021e859359b5f497b00879e335c96906e346d83123a9f8ef69a14df518` | 696,320 | 28 | `10.5281/zenodo.23367115` |

## Expected changes

For each dependency, regeneration updated:

- `metadataSha256`, because production DOI metadata changed the constituent `metadata.json`;
- `gitTreeOid`, because the complete constituent directory tree changed;
- `canonicalTarSha256`, because the canonical dependency archive contains the changed metadata.

The package-manifest checksum, file count, and canonical archive byte size remained unchanged for every dependency. This is expected because no `package.json` was changed, no files were added, and the metadata-size changes remained within the archives' existing tar-block padding even though their content digests changed.

## Verification

The regenerated manifest was checked independently against the current repository tree:

- direct SHA-256 calculation matched every `metadataSha256` and `packageJsonSha256`;
- Git tree resolution matched every `gitTreeOid`;
- recursive Git tree enumeration matched every `fileCount`;
- deterministic synthetic commits and uncompressed Git archives reproduced every `canonicalTarSha256` and `canonicalTarByteSize`;
- each `publishedPackageLocator` matched the identifier registry;
- each `doi` matched the production identifier registry and no `sandboxDoi` field remained;
- every binding status is `content-bound; production-doi-bound; directory-swhid-pending`;
- each unresolved `directorySwhid` still matches the intentional Phase 6 placeholder in the identifier registry.

The regeneration command was run a second time after the update. The resulting manifest file was byte-for-byte unchanged, demonstrating deterministic regeneration for the current inputs.

## Boundary retained

The manifest binds reserved production DOIs but does not claim that they are registered or publicly dereferenceable. Directory SWHIDs remain explicitly pending. No tag, GitHub release, Zenodo publication, or Software Heritage request was created by this step.
