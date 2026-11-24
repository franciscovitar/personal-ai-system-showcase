# PAS Explorer — browser reference (development)

From the repository root, run `npm run build:explorer` with Node 20+ and serve the generated `dist/` directory:

```sh
npm run build:explorer
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8080/explorer/` (Spanish), or `/explorer/?lang=en` for English. Alternatively serve the repository root locally and visit `/explorer/` without a build. No dependency installation, backend, account, model API or database is needed.

The nine views import the public reference functions directly. The Node-only synthetic store is excluded from the browser graph. All interactions are fictional fixtures held in memory. Reload/reset discards them; language change resets the study exercise because its blueprint changes. No real provider prices, sources, operations or PAS runtime are verified by this interface.

Try unavailable sources, incompatible routes, conflicting evidence, unknown-cost tools, local/global blockers, missing buyer decisions and suppression. Inspect the JSON traces. Native tests, visual/browser QA and release verification are separate. This README does not claim a deployed application.
