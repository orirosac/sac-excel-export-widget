# ORIOR SAC Flat Excel Export (prototype)

**Prototype only. Not production-ready.** Reusable XLSX generator with **one header row** and explicit column order. No production SAC connection or large-data guarantee has been tested.

## Contents
- `manifest.json`: example SAC custom widget definition. Replace `YOUR-HTTPS-HOST` and validate against the widget manifest schema supported by your SAC tenant.
- `src/main.js`: browser Web Component. Expects an approved SheetJS (`window.XLSX`) library to be loaded **before** this script.
- `examples/payload.json`: sample columns/rows contract.
- `examples/sac-integration.js`: intentionally schematic SAC data mapping.
- `examples/sample-export.xlsx`: independently generated fixture to check desired output layout.

## Data contract
Pass JSON via the widget `payload` property:

```json
{"columns":[{"key":"UNIT","label":"Unit"},{"key":"FTE","label":"FTE"}],"rows":[{"UNIT":"1200","FTE":1}]}
```

`columns` controls ordering; all labels appear in row 1. `rows` is an array of flat objects. Use the widget's `exportExcel()` method or built-in button.

## Hosting and SAC installation
1. Host the manifest, JavaScript, and an approved SheetJS build on HTTPS reachable by SAC clients. GitHub private repository raw URLs are **not** a suitable authenticated hosting solution.
2. Ensure `window.XLSX` is loaded before `src/main.js`, e.g. using a vetted bundling workflow or a separate approved script dependency. The prototype does not bundle this dependency.
3. Replace the manifest URL, validate manifest compatibility, and register the custom widget in your SAC tenant.
4. Map SAC `getResultSet()` entries into the flat payload and explicitly verify record counts, measures, hierarchy and filters before enabling real exports.

## Known limitations
- SAC `getResultSet()` is **not** a reliable way to retrieve all rows for arbitrary large tables.
- This prototype cannot guarantee export of all filtered rows, drill states, hierarchies, or formatting.
- Widget registration, API property/method binding, HTTPS/CSP, external libraries and mobile support are **unverified** in the target tenant.
- Never expose credentials or confidential data in public hosting. Exported content must respect SAC authorization.
- For large-scale complete exports, a properly secured backend with server-side pagination and authorization may be necessary.
