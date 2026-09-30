# HBOT Treatment Target Knowledge Assembly

Node.js package implementing the **HBOT Treatment Target Knowledge Assembly** (CKS Version 1.0): an orchestration-mode Knowledge Assembly that engages four constituent Knowledge Objects and applies KA-owned routing, gate mapping, and supported-case synthesis to produce one governed HBOT Treatment Target Classification.

This implementation follows `specs/HBOT_Treatment_Target_KA_CKS_Version_1_0.docx` and its bound machine-readable release artifacts (`specs/KA_Dependency_Manifest.json`, `specs/HBOT_Treatment_Target_KA_Schema_Bundle_1_0.json`, `specs/KA_Identity_and_Governance_Metadata.json`, and `specs/HBOT_Treatment_Target_KA_Canonical_Fixtures_1_0/`).

## Constituent dependencies

The KA orchestrates, without reimplementing, the following four Knowledge Objects from `collection/`:

| Role | Knowledge Object | Package |
| --- | --- | --- |
| `DEP-WAGNER` | Meggitt-Wagner Classification | `@wagner/classification` (`collection/DFU-Severity-Score-KO`) |
| `DEP-HBOT-DECISION` | UHMS Figure 6 HBOT Decision | `@kgrid/dfu-hbo2-treatment-decision` (`collection/HBOT-Treatment-Decision-KO`) |
| `DEP-BURDEN` | DFU HBOT Bounded Regimen and Execution Burden | `@dfu-hbot/bounded-regimen-and-execution-burden` (`collection/HBOT-Regimen-Burden-KO`) |
| `DEP-MARGOLIS` | Margolis 2022 DFU Prognostic Model | `@kgrid/margolis-dfu-prognostic` (`collection/DFU-Prognostic-Indicator-KO`) |

`package.json` declares these as `file:` dependencies pointing at the sibling `collection/` packages. Internally, the KA resolves them by relative path (`src/dependency-packages.js`) so the package is runnable without a registry or a prior `npm install` of the constituent KOs; their own runtime dependencies (for example the Burden KO's `ajv`/`ajv-formats`) must still be installed inside their own package directories.

## Install

```bash
cd HBOT-Regimen-Burden-KO && npm install   # installs ajv/ajv-formats used by the Burden KO
cd ../../HBOT3-KA && npm install           # optional: registers file: dependencies
```

## Usage

The closed KA core requires both `wagner_response_artifact` and `burden_questionnaire_artifact` as Section 2.5 specifies. A separate preparation interface may accept either artifact as already supplied, or collect the missing response through its owning KO's Questionnaire Logic capability. A supplied artifact is never silently recollected. Both paths freshly invoke the constituent analysis; neither reuses a prior computed score or burden result.

```js
const { prepareAndExecuteKnowledgeAssembly } = require('@kgrid/hbot-treatment-target-ka');

const { result, preparation } = await prepareAndExecuteKnowledgeAssembly({
  request_id: 'req-001',
  requested_at: '2026-09-20T12:00:00Z',
  index_time: '2026-09-20T10:00:00Z',
  subject_binding: { /* subject_identifier, ulcer_identifier, care_episode_identifier, source_evidence */ },
  hbot_case_assertions: { /* dfu_confirmed, acute_surgical_intervention, not_healed_after_30_days */ },
  margolis_first_visit_assessment: { /* wound_area, wound_duration, first_visit_at, first_visit_attested */ }
  // Either or both Section 2.5 response artifacts may be supplied here.
}, {
  collectionMetadata: {
    wagner: { /* artifact_locator, completed_at, source_evidence */ },
    burden: { /* artifact_locator, confirmed_at, treatment_plan_identifier, source_evidence */ }
  },
  artifactPayloads: { /* supplied artifact locator -> response and subject/ulcer binding */ }
});

console.log(result.target_classification, result.reason_code);
```

The preparation options may include `wagnerAskYesNo` and `burdenAskQuestion` callback overrides for missing artifacts. Without overrides, the KO-owned prompters use stdin/stdout. The caller must supply attributable `collectionMetadata` for every artifact it asks the KA to collect; the runtime will not invent provenance. A supplied descriptor needs a matching payload in `artifactPayloads` (or an explicit `resolveArtifact` callback); the KA never dereferences an IRI automatically. `preparation.source_modes` reports `supplied` or `collected` for each role. Applications that already possess a complete request can call `executeKnowledgeAssembly(request, { artifactPayloads })` directly.

See Section 2.5 of the CKS for the complete closed input contract; `hbot_case_assertions` and `margolis_first_visit_assessment` remain required direct KA inputs because neither the HBOT Decision KO nor the Margolis KO owns an interactive collection capability — those values must already be attested clinical facts (Section 2.5/2.6), not something any KO can collect from the user.

## CLI

```bash
npm run cli -- --file test/request.json --preparation path/to/preparation.json
```

`test/request.json` is a partial sample for the preparation interface, not a complete Section 2.5 core request. The preparation JSON supplies `collectionMetadata` for missing artifacts and/or `artifactPayloads` for supplied ones. The CLI only prompts for a missing questionnaire after the required provenance metadata is provided.

## Notebooks

Try this package here:

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/kgrid-objects/FAIR-DO-Workshop/HEAD?urlpath=lab/tree/HBOT3-KA/auxiliary/aux-notebook/hbot_treatment_target_ka_binder.ipynb%3Fkernel_name%3Djavascript)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/kgrid-objects/FAIR-DO-Workshop/blob/HEAD/HBOT3-KA/auxiliary/aux-notebook/hbot_treatment_target_ka_colab.ipynb)

## Architecture


- `src/input-validation.js` — closed input-contract and subject/ulcer coherence checks (Sections 2.5–2.7).
- `src/dependency-manifest-validation.js` — exact dependency identity/version verification against `KA_Dependency_Manifest.json` (Section 3.6).
- `src/transformations.js` — TX-01 through TX-05, the closed set of permitted routing transformations (Section 5.5).
- `src/engagement.js` — engages each constituent KO, always collecting Wagner's and Burden's questionnaire answers live through their own interactive Questionnaire Logic capability, and builds each dependency-execution record (Section 7.7).
- `src/gate-mapping.js` — native HBOT Decision result to KA gate-state mapping (Section 6.2 / DEC-GATE-06A).
- `src/synthesis.js` — prognosis/burden projections and the twelve-cell supported-case matrix (Sections 6.3, 6.4, 7.8–7.11).
- `src/orchestrator.js` — the execution sequence, mandatory four-KO join, failure precedence, and final result construction (Sections 5, 7, 8, 9).
- `src/provenance.js`, `src/result-builder.js` — assembly provenance and the closed canonical result object (Section 7.3, Section 9.3).
- `src/errors.js` — controlled reason codes, warning codes, and Section 8.4 failure precedence.

## Tests

```bash
npm test
```

`test/canonical-fixtures.test.js` runs the KA's gate-mapping and synthesis logic against all 65 cases in the published canonical fixture suite. `test/orchestrator.test.js` exercises end-to-end orchestration through the real constituent KOs, including a supported-synthesis case, an HBOT-not-supported case, an out-of-scope case, and input/subject-coherence failure cases.

## Scope and limitations

This is an implementation of the CKS Version 1.0 architecture; it is not a clinical decision-support system and does not predict HBOT efficacy, estimate treatment effect, rank patients, or authorize care. Fingerprinting uses a deterministic sorted-key canonical JSON stringification as a pragmatic stand-in for full RFC 8785 JCS. Temporal, provenance, and provider-roster checks implement the normative intent of the CKS at a level sufficient for orchestration correctness, not the complete exhaustive JSON Schema validation described in Section 10.1.4.
