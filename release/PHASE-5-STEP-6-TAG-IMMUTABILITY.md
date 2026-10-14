# Phase 5, Step 6 — tag immutability

Completed on 2026-10-14 under the Phase 5 authorization recorded in `release/RELEASE-APPROVAL.md`.

## Result

**PASS.** The five public Version 1.0 annotated tags remain anchored to the DOI-complete content-freeze commit, their immutability requirements are recorded in `release/TAG-IMMUTABILITY-POLICY.md`, and a live GitHub tag ruleset now prevents routine update or deletion of the five remote refs.

## Remote reference verification

Immediately before protection was enabled, each remote tag-object ID matched the previously recorded value and each annotated tag peeled to content-freeze commit `e42624bfed0b28ba35a743690141ef4f566af250`. All five corresponding GitHub releases remained public, non-draft, and non-prerelease.

## GitHub enforcement

Created and then independently read back the following repository ruleset:

- Ruleset ID: `25109217`
- Name: `Protect FAIR DO Version 1.0 object tags`
- Target: `tag`
- Enforcement: `active`
- Included refs: exactly the five fully qualified Version 1.0 tag refs listed in the policy
- Excluded refs: none
- Bypass actors: none
- Restrictions: `update`, `deletion`, and `non_fast_forward`
- Created: `2026-10-14T15:07:37.924-04:00`

No destructive push was attempted as a test. The ruleset was verified through GitHub's repository-rules API, and the remote references were re-read directly.

## Governance boundary

Ruleset enforcement protects the tag refs from ordinary Git operations, including operations by actors who otherwise have repository write access. A repository administrator can still edit or remove the ruleset itself. The durable policy therefore separately prohibits weakening the ruleset to rewrite a published identifier and requires corrections to be issued under a new semantic version.

This step did not change a tag, release asset, object directory, Zenodo draft, or Software Heritage state.

