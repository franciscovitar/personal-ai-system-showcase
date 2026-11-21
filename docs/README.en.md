# Personal AI System — Public Showcase

**An AI control tower designed to preserve context, source authority and human control across long-running work.**

[Portfolio case study](https://franvitar.genovasite.com/work/personal-ai-system) · [Español](../README.md) · [Full system map](system-map.md) · [Architecture](architecture.md) · [End-to-end workflows](workflows.md) · [Engineering decisions](engineering-decisions.md) · [Security & scope](security-and-scope.md) · [Recruiter review guide](recruiter-tour.md)

> This is a **separate, synthetic reference implementation** of Personal AI System architectural ideas. It is **not** a copy of the private system, a deployed service, an LLM model, or a live connector. Its code and tests are intentionally open for technical review.

**Engineering depth matters.** Beyond the original six sample routes, this repository now demonstrates contracts for **14 specialized Skills**, scoped knowledge and source governance, policy/permission gates, claim-level evidence, learning and capture runtimes, optimistic concurrency for project continuity, controlled improvement, and a professional delivery taxonomy of **12 services, 7 intervention types and 35 designed library families**. These are distinct architectural dimensions—not a claim that 14 autonomous agents or 35 production libraries are deployed.

## The challenge

AI assistants can help with research, learning, software engineering and personal operations. But a single conversation is not a durable source of truth. A generated response is not evidence that an operation happened, and the ability to read a tool does not imply permission to write to it.

PAS approaches those problems with explicit routing, scoped retrieval, domain-specific methods, source ownership, authorization boundaries and verification steps.

```mermaid
flowchart TD
    A["Human intent"] --> B["Control tower"]
    B --> C["Scoped context and method"]
    C --> D["Authoritative sources"]
    C --> E["Specialized workflow"]
    D --> F["Proposal or authorized action"]
    E --> F
    F --> G["Evidence and review"]
```

In the **private PAS**, GitHub holds curated knowledge, skills and governance; Drive and other authorized systems retain their own domain records or originals. ChatGPT can serve as a conversational interface, not as the database or a substitute for verification. This public implementation replaces all such integrations with synthetic metadata and in-memory behavior.

## Architecture covered here

| Area | Reference workflow | Key concept |
| --- | --- | --- |
| Adaptive learning | `study` | Subject sources and assessment-oriented workflow |
| Training | `training` | Structured capture as a gated proposal |
| Nutrition | `nutrition` | Reported information, without invented data |
| Research | `research` | Scoped knowledge and evidence references |
| Professional delivery | `professional` | Task-specific method and acceptance steps |
| Projects | `projects` | Project continuity from an explicit source |

These are **representative flows**, not complete products or faithful exports of private modules. The [technical system map](system-map.md) also documents the wider domain inventory and a candid implemented/reference/documented coverage matrix.

## Review the actual code

- [`src/catalog.mjs`](../src/catalog.mjs): readable domain routing.
- [`src/source-registry.mjs`](../src/source-registry.mjs): source availability and minimal retrieval.
- [`src/context-compiler.mjs`](../src/context-compiler.mjs): bounded, scope-isolated synthetic context selection.
- [`src/control-tower.mjs`](../src/control-tower.mjs): the boundary between a plan, a write proposal and an authorized synthetic write.
- [`src/synthetic-store.mjs`](../src/synthetic-store.mjs): idempotency and readback in memory.
- [`test/control-tower.test.mjs`](../test/control-tower.test.mjs): failure paths, misuse and safe retries.
- [`src/reference/skill-registry.mjs`](../src/reference/skill-registry.mjs): fourteen capability contracts.
- [`src/reference/knowledge-runtime.mjs`](../src/reference/knowledge-runtime.mjs): candidate packs, scoped retrieval, provenance and unexecuted remote source candidates.
- [`src/reference/policy-engine.mjs`](../src/reference/policy-engine.mjs) and [`evidence-runtime.mjs`](../src/reference/evidence-runtime.mjs): trust, permissions, risk and verifiable evidence states.
- [`src/reference/study-runtime.mjs`](../src/reference/study-runtime.mjs) and [`capture-runtime.mjs`](../src/reference/capture-runtime.mjs): learning evidence and conservative capture.
- [`src/reference/project-ledger.mjs`](../src/reference/project-ledger.mjs): project owner isolation, CAS, replay protection and readback.
- [`src/reference/professional-delivery.mjs`](../src/reference/professional-delivery.mjs) and [`improvement-runtime.mjs`](../src/reference/improvement-runtime.mjs): service/overlay catalog and evidence-gated improvements.
- [`src/reference/orchestrator.mjs`](../src/reference/orchestrator.mjs) and [`test/reference-runtime.test.mjs`](../test/reference-runtime.test.mjs): composed traces and negative tests.

Run with Node.js 20+ (no credentials or dependencies):

```bash
npm run check
npm test
npm run example
npm run tour
```

The reference has **no web UI**. Code and automated tests are the public evidence, while the actual PAS remains private. See the [verification matrix](verification.md), [real-world-inspired scenarios](workflows.md) and [security boundary](security-and-scope.md). Simulated guards are explicitly distinct from real authentication, integrations and production operation.

**Francisco Vitar** · Systems Engineering · Applied AI and software architecture.
