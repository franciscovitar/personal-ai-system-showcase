# Recruiter / technical review tour

## En 3 minutos

1. **Propósito:** PAS es una capa de coordinación de métodos, fuentes y permisos para trabajo continuado con IA.
2. **Arquitectura:** [diagrama y límites](architecture.md).
3. **Código:** `src/control-tower.mjs` separa plan, propuesta y aplicación. `src/source-registry.mjs` modela autoridad de fuentes.
4. **Calidad:** `test/control-tower.test.mjs` comprueba bloqueos y reintentos, no solo el camino feliz.
5. **Contexto:** el sistema original es privado; esta es una reconstrucción pública, sintética y mucho más pequeña.

## In 3 minutes

- **System thinking:** orchestration is more than writing prompts.
- **Boundaries:** source authority, domain methods, least privilege and explicit approval.
- **Evidence:** inspect tests rather than relying on architecture graphics.
- **Honesty:** this is a standalone reference, not a live/private-system export.

### Questions this code is designed to answer

- What happens when a needed source disappears?
- What prevents a read-only request from becoming a write?
- Can an unauthorized or forged plan produce a side effect?
- What happens when an identical write is retried?
- Which behaviors are intentionally *not* guaranteed by the reference?

Run `npm test` to inspect those behaviors. No credentials, backend service or browser setup required.
