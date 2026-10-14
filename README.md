# FAIR Digital Objects, from principle to practice

What does it take to make computable biomedical knowledge (CBK) genuinely **findable, accessible, interoperable, and reusable**?

This repo supports a workshop that answers that question by example. It develops four self-contained Knowledge Objects (KOs) for diabetic foot ulcer assessment and hyperbaric oxygen therapy, then composes them into a governed Knowledge Assembly (KA) that produces an **HBOT Treatment Target Classification**. The result is not just working code: it is knowledge packaged with explicit meaning, provenance, validation, tests, citations, and release metadata.

## What is here

| Component | Role |
|---|---|
| `DFU-Severity-Score-KO` | Classifies ulcer severity using the Meggitt–Wagner system |
| `HBOT-Treatment-Decision-KO` | Implements the UHMS Figure 6 treatment-decision logic |
| `HBOT-Regimen-Burden-KO` | Characterizes treatment regimen and execution burden |
| `DFU-Prognostic-Indicator-KO` | Implements the Margolis 2022 DFU prognostic model |
| `HBOT-Treatment-Target-KA` | Orchestrates the four KOs and applies governed routing, gates, and synthesis |

Each object carries its own implementation, formal specifications, machine-readable metadata, canonical fixtures, tests, citation information, license, and release materials. The Knowledge Assembly invokes the other four constituent KOs and treats them as identifiable and traceable dependencies rather than absorbing their logic. By so doing, it preserves clear boundaries of ownership, identity, and responsibility.

## Explore the workshop

Start with [`collection/`](collection/) to inspect the four KOs individually. Then open [`HBOT-Treatment-Target-KA/`](HBOT-Treatment-Target-KA/) to see how independently governed knowledge can be combined into a reproducible higher-order result.

For the quickest hands-on introduction, launch the assembly notebook in Binder:

[![Launch the HBOT Treatment Target KA in Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/kgrid-objects/FAIR-DO-Workshop/hbot-treatment-target-ka-v1.0.0?urlpath=lab/tree/HBOT-Treatment-Target-KA/auxiliary/aux-notebook/hbot_treatment_target_ka_binder.ipynb%3Fkernel_name%3Djavascript)

To run the JavaScript packages locally, use a current Node.js/npm environment and follow the README in the object or assembly you want to explore. Tests are run within each package with:

```bash
npm install
npm test
```

## Why it matters

FAIRness is more than attaching metadata to an algorithm. A reusable digital object must make its identity, inputs, outputs, dependencies, evidence, limits, and behavior legible to both people and machines. This repository makes those commitments concrete—and shows how they survive composition.

The included examples use fictional instructional data. They are research and teaching artifacts, not patient records and should never be used to provide clinical guidance. Not ever.

## Repository map

```text
.
├── collection/                  # Four constituent Knowledge Objects
├── HBOT-Treatment-Target-KA/    # Governed orchestration and teaching cases
├── binder/                      # Reproducible notebook environment
└── release/                     # Versioned release and archival materials
```

Begin with one object. Follow its contracts. Run its tests. Then watch four bounded pieces of computable knowledge become a transparent, inspectable assembly.
