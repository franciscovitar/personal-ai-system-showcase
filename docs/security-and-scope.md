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

**Important:** Anyone can construct a synthetic scenario on their own machine. An `approved: true` flag here is only a **testing seam**, never evidence of authorization for real accounts or APIs. Node process exit discards every record. No third-party service receives data.

## What the example does not prove

- That the private PAS is publicly runnable or has a particular uptime.
- That every workflow in PAS is implemented by these simplified modules.
- That any ChatGPT, Sheets, Drive, Calendar or GitHub write succeeded.
- That a model was trained or that autonomous agent permissions are safe in production.
- That CI succeeded: check GitHub Actions for its observed state.

The project makes **design choices and testable examples** public, not private operational state or unverifiable claims.
