# Phase 3, Step 6 — clean-checkout archive reproduction

Completed on 2026-10-14 at commit `8b5dd26fc9e3eedd2a7426e45e5e338cfe06dd67`.

## Initial finding and correction

The first isolated rebuild identified that `release/build-archives.sh` used `git archive HEAD:<object-path>`. Git embedded the containing commit identity, so later evidence-only commits changed archive digests even when an object's directory tree was unchanged. Archiving a bare tree removed that coupling but introduced build-time tar timestamps.

The builder now anchors each exact object tree to a deterministic synthetic commit with a fixed author, committer, timestamp, and message before creating the tar archive. Gzip already uses `-n`, so it records neither an original filename nor a current timestamp.

## Clean-checkout result

A detached clean Git worktree was created at the commit above. The five archives were built independently in that checkout and compared with the primary checkout. For every object:

- the compressed archive was byte-for-byte identical;
- SHA-256 was identical;
- byte size was identical; and
- the expected single top-level object directory was retained.

| Archive | SHA-256 | Bytes |
|---|---|---:|
| `dfu-severity-score-ko-v1.0.0.tar.gz` | `c05ec41597a950e11c52d1c4f64582ab10aa3e6ee9e08d6bb595bff13878e827` | 928425 |
| `hbot-treatment-decision-ko-v1.0.0.tar.gz` | `6de82822a2153bee8090cc30cd958fbe38e31e6e473cf5e24cd8dd8f4d0a6546` | 575190 |
| `hbot-regimen-burden-ko-v1.0.0.tar.gz` | `367021b1e44de04351d1ce3667fd76b8182f8f3cf5e1ec4176f943bc6072f343` | 909696 |
| `dfu-prognostic-indicator-ko-v1.0.0.tar.gz` | `fef25b18ee227975357eb26e0943efdc2723713aa680ef852fee5df78773e096` | 492574 |
| `hbot-treatment-target-ka-v1.0.0.tar.gz` | `56dd9a0129e457c085386f8f9f7806b285273497bdb9ec4470b003993589c1f0` | 479150 |

## Sandbox synchronization

The five prior Sandbox files were replaced with these final reproducible archives. Zenodo's MD5 values match the local files, every draft contains exactly one intended archive, all metadata and relationships remain intact, and all records remain unpublished. The native Zenodo JSON exports were refreshed after replacement.
