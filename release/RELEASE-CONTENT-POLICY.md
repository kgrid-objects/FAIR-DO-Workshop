# Release content policy

This policy fixes the boundaries of the five independently citable version 1.0.0 objects. Final file inventories and checksums are generated only after identifier normalization and dependency-manifest regeneration, because those required changes alter the content hashes.

## Inclusion rule

Each release archive contains every Git-tracked file below exactly one object root at the annotated release tag, including source, tests, specifications, schemas, fixtures, notebooks, documentation, graphics, KO metadata, `LICENSE`, `CITATION.cff`, and the Zenodo metadata template.

| Release key | Exact object root |
|---|---|
| `dfu-severity-score-ko` | `collection/DFU-Severity-Score-KO/` |
| `hbot-treatment-decision-ko` | `collection/HBOT-Treatment-Decision-KO/` |
| `hbot-regimen-burden-ko` | `collection/HBOT-Regimen-Burden-KO/` |
| `dfu-prognostic-indicator-ko` | `collection/DFU-Prognostic-Indicator-KO/` |
| `hbot-treatment-target-ka` | `HBOT-Treatment-Target-KA/` |

No archive includes the repository root, another object's directory, or Git history. The release tag and Software Heritage archive preserve repository-level provenance separately.

## Exclusions

The following never belong in an object archive:

- `node_modules/` and other regenerated dependency caches;
- `.git/`, editor state, notebook checkpoints, OS metadata, logs, temporary files, credentials, and local environment files;
- files outside the object's exact root;
- `collection/HBOT-Regimen-Burden-KO/specs/1E41C3D7-66F4-C168-3A91-D951BE77CBAF.pdf`, removed because redistribution permission is not documented;
- release-building scripts and evidence stored in the repository-level `release/` directory.

## Assembly boundary

The HBOT Treatment Target KA archive contains only `HBOT-Treatment-Target-KA/`. It does not duplicate the four constituent KOs. The four KOs are separate citable dependencies identified by DOI, SWHID, package identity, exact version, and checksum in the final dependency manifest. To execute from a source checkout, retrieve those four dependencies at the declared sibling paths or use a future installation mechanism explicitly documented for the release. A DOI landing page is never used as an executable package locator.

## Freeze rule

After Steps 6 and 7, generate a manifest for every object from the release candidate commit. Any subsequent object-file change requires:

1. regenerating that object's file manifest, directory SWHID, archive, SHA-256, byte size, and file count;
2. regenerating the KA dependency manifest if a constituent changed;
3. rerunning affected tests and metadata validation;
4. replacing—not silently reusing—the candidate tag and Sandbox files.

Once a production tag or DOI version is published, it is immutable. Corrections require a new version.
