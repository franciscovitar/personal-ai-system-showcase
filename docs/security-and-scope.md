# Security, privacy and scope

## Public release boundary

This repository was authored independently as a **synthetic reference**, not cloned or filtered from the private Personal AI System. It intentionally has no common Git history, original records, live endpoints, credentials, personal schedules, university materials or customer data.

| Risk | Reference behavior | Production gap |
| --- | --- | --- |
| Missing required source | Fail closed (`BLOCKED_MISSING_SOURCE`) | Real connectors need retry, authentication and freshness checks |
| Unauthorized write | Separate `applySyntheticWrite()` with approval | Real identity and consent must be verified outside caller-provided flags |
| Forged plan | Instance-issued frozen plan checked with `WeakSet` | Server-side trusted sessions or signed capabilities required in a service |
| Duplicate command | Stable idempotency key and receipt | Durable transactional storage required across restarts and processes |
| Invalid payload | Allowlisted shapes and basic bounds | Domain-specific schemas and robust normalization needed |
| Sensitive data | No real data or external I/O | Classification, minimization, retention and redaction enforced per provider |
| Prompt injection | Untrusted strings are classified, not executed | This example does not implement the complete private trust model |
| Cross-project or subject leakage | Scope filtering and owner-bound ledger | Real tenant boundaries require authenticated identity and database access controls |
| Stale or weak claim | Risk-based promotion eligibility and remote candidate flags | No online verification or independently reviewed source corpus in showcase |
| Concurrency | Optimistic revision checks and per-process idempotency | No transactional durability across servers or process crashes |
| Skill/plugin privilege | Capability registry is descriptive; no tool invocation | Host runtime installation, tool credentials and permission grants are external |
| Professional planning | `DESIGN_PLAN_ONLY` and `executionAuthority: NONE` | Neither V2 delivery libraries nor production execution are provided |

**Important:** Anyone can construct a synthetic scenario on their own machine. An `approved: true` flag here is only a **testing seam**, never evidence of authorization for real accounts or APIs. Node process exit discards every record. No third-party service receives data.

The public catalog includes names and generalized responsibilities of private system capabilities, **not their underlying proprietary text, personal knowledge or source data**. Broad architectural coverage is intentional; no private content dump or automatic mirror exists. The original PAS repository and its integrations must remain private.

## What the example does not prove

- That the private PAS is publicly runnable or has a particular uptime.
- That every workflow in PAS is implemented by these simplified modules.
- That declarative Skills are running agents, or that all project domains have public runtime implementations.
- That 35 designed library families are fully researched, coded or certified operational.
- That any ChatGPT, Sheets, Drive, Calendar or GitHub write succeeded.
- That a model was trained or that autonomous agent permissions are safe in production.
- That CI succeeded: check GitHub Actions for its observed state.

The project makes **design choices and testable examples** public, not private operational state or unverifiable claims.
