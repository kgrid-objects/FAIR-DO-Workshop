# Phase 3, Step 7 — Sandbox identifier confinement audit

Completed: 2026-10-14

## Result

**PASS.** Real Zenodo Sandbox identifiers remain confined to rehearsal evidence under `release/`. None entered any of the five release-object directories or their production-facing `findability.metadata.txt`, `metadata.json`, or `CITATION.cff` records.

## Scope

The audit covered these five release objects:

- `collection/DFU-Severity-Score-KO`
- `collection/HBOT-Treatment-Decision-KO`
- `collection/HBOT-Regimen-Burden-KO`
- `collection/DFU-Prognostic-Indicator-KO`
- `HBOT-Treatment-Target-KA`

The search checked for:

- Zenodo Sandbox DOI prefix `10.5072`
- Zenodo Sandbox URLs
- DataCite test-handle URLs
- all five Sandbox draft IDs and parent record IDs recorded during the rehearsal

## Findings

1. No real Sandbox DOI, Sandbox URL, draft ID, or parent record ID occurs in any release-object directory.
2. No real Sandbox DOI or URL occurs in any production-facing `findability.metadata.txt`, `metadata.json`, or `CITATION.cff` file.
3. No real Sandbox identifier occurs outside `release/`, where the rehearsal reports, draft registry, and native Zenodo exports are intentionally retained as evidence.
4. DOI placeholders remain in the object-level Zenodo preparation files and in the KA dependency preparation records. These are symbolic tokens, not issued identifiers. They must not be replaced with Sandbox values and remain subject to the release validator until production DOIs are reserved.
5. No production metadata was changed as a result of this audit.

## Disposition

Phase 3 is complete. The Sandbox drafts and their identifiers remain rehearsal evidence only. Creating unpublished production Zenodo drafts is a separate external action and requires explicit production-deposit authorization before Phase 4 begins.
