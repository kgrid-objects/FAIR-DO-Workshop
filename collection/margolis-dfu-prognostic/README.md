# Margolis DFU Prognostic Model

Node.js package implementing the two-factor Margolis model for diabetic foot ulcer healing by 16 weeks, using wound area and wound duration.

## Install

```bash
npm install @kgrid/margolis-dfu-prognostic
```

## Exports

- `evaluate(input)`
- `evaluateWithRuleCardinalityFault(input, cardinality)`

## Input Contract

The evaluator accepts exactly two top-level properties:

- `wound_area`: `{ value, ucum_code }` where `ucum_code` is `cm2` or `mm2`
- `wound_duration`: `{ value, ucum_code }` where `ucum_code` is `wk` or `d`

Validation behavior follows the CKS canonical schema in `spec/`:

- closed objects (no additional properties)
- strict numeric validation (`area > 0`, `duration >= 0`)
- deterministic error codes and paths

## Usage

```js
const {
  evaluate,
  evaluateWithRuleCardinalityFault
} = require('@kgrid/margolis-dfu-prognostic');

const output = evaluate({
  wound_area: { value: 1, ucum_code: 'cm2' },
  wound_duration: { value: 56, ucum_code: 'd' }
});

console.log(output.status); // success
console.log(output.result_id); // ALG-03

const fault = evaluateWithRuleCardinalityFault(
  {
    wound_area: { value: 1, ucum_code: 'cm2' },
    wound_duration: { value: 4, ucum_code: 'wk' }
  },
  0
);

console.log(fault.errors[0]); // { code: 'ERR-08', path: 'internal', ... }
```

## Testing

```bash
npm test
```

The conformance suite is driven by:

- `spec/Margolis_2022_DFU_Prognostic_CKS-1_0.fixtures.json`

Notes:

- The implementation follows the attached CKS specification's normative matrix and conversion rules.
- Five fixture records are currently skipped in `test/conformance.test.js` because their expected values conflict with the same spec's decision matrix and exact unit conversions.

## CLI

From this package directory:

```bash
cd collection/margolis-dfu-prognostic
node bin/margolis-dfu-prognostic.js --input '{\"wound_area\":{\"value\":1,\"ucum_code\":\"cm2\"},\"wound_duration\":{\"value\":56,\"ucum_code\":\"d\"}}'
```

From the repository root:

```bash
node collection/margolis-dfu-prognostic/bin/margolis-dfu-prognostic.js --input '{"wound_area":{"value":1,"ucum_code":"cm2"},"wound_duration":{"value":56,"ucum_code":"d"}}'
```

Or using a JSON file:

```bash
node bin/margolis-dfu-prognostic.js --file input.json
```
