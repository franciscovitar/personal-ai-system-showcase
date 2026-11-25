# Engineering verification / Evidencia y QA

## Reproducción

```bash
node --version # 20+
npm run check
npm test
npm run example
npm run tour
```

The core reference requires no dependencies, API keys, internet, database or private inputs. Browser smoke tests also require an available Chromium installation; they use a loopback-only static server. CI runs syntax and tests on GitHub Actions for pushes and PRs. The repository does not self-certify a remote workflow run: inspect the corresponding Actions result.

## Failure-mode matrix

| Invariante / claim | Test de referencia | Qué demuestra | Qué **no** demuestra |
| --- | --- | --- | --- |
| Required source missing → block | `control-tower.test.mjs` | No implicit fallback to fabricated data | Availability of Google/Drive integrations |
| Plan ≠ approval ≠ execution | Both test suites | Separate contracts and status | Real OAuth identity or human consent |
| Scope isolation | `reference-runtime.test.mjs` | Other project/subject claims excluded | Completeness of real PAS knowledge index |
| Idempotent retry and readback | Both suites | In-process, single-thread replay behavior | Distributed transaction atomicity or persistence |
| Forged proposal rejected | Both suites | `WeakSet` issuer in a single process | Signed capabilities across servers |
| Risk-aware claim eligibility | `reference-runtime.test.mjs` | Rules for provenance/freshness and review | Online truth/fact checking |
| Study coverage is not mastery | `reference-runtime.test.mjs` | No invented readiness percentage | Learning outcomes or FSRS parity |
| 12 services, 7 overlays, L01–L35 | `reference-runtime.test.mjs` | Catalog contract and separation of lifecycle status | 35 implemented/approved libraries |
| Improvement does not self-modify | `reference-runtime.test.mjs` | Baseline/regression and approval gates | Live observation of operational impact |

## Test pyramid and evidence standard

- **Syntax:** dynamically discovers all `.mjs` files in `src`, `test`, `examples`, and `scripts`.
- **Unit/contract:** deterministic routing, policy, normalization, claim verification and study sessions.
- **Integration in memory:** orchestrated planning, proposal/commit, optimistic concurrency, replay and readback.
- **Negative scenarios:** missing evidence, cross-scope leakage, spoofed proposals, unknown permissions, higher-risk claims and stale revisions.
- **Browser smoke and static integration:** [run 45485921797](https://github.com/franciscovitar/personal-ai-system-showcase/actions/runs/45485921797) recorded 49/49 passing tests, including the public Explorer Chromium journey; [portfolio integration run 45487710073](https://github.com/franciscovitar/personal-ai-system-showcase/actions/runs/45487710073) covers the static bundle in the portfolio. See the [versioned checkpoint](PAS_EXPLORER_V2_CHECKPOINT.md) for boundaries and evidence.
- **Not in scope:** end-to-end private-system integration, cloud connectors, authentication, secrets, wearable synchronization, live LLM evaluation, performance/load testing and private project data.

The test counts can evolve; the CI badge is a pointer to observed test runs, not a substitute for examining the actual workflow.
