# Recruiter / technical review tour

## En 3 minutos

1. **Propósito:** PAS es una capa de coordinación de métodos, fuentes y permisos para trabajo continuado con IA.
2. **Arquitectura:** [diagrama y límites](architecture.md).
3. **Complejidad:** [mapa técnico](system-map.md) para entender las 14 Skills, recuperación por ámbito, gobernanza de conocimiento y 12×7×35 de delivery.
4. **Código:** `src/reference/orchestrator.mjs` compone Skills, contexto, permisos y evidencia; `src/control-tower.mjs` separa plan, propuesta y aplicación.
5. **Calidad:** `test/` comprueba aislamiento, fallos de origen, reintentos, propuesta falsificada y revisión por riesgo, no solo el camino feliz.
6. **Contexto:** el sistema original es privado; esta es una reconstrucción pública **con cobertura arquitectónica amplia pero implementación sintética y parcial**.

## En 10 minutos: recorrido técnico sugerido

1. `npm run tour`: traza representativa del conjunto, sin secretos ni servicios.
2. `src/reference/knowledge-runtime.mjs`: selección de packs antes del retrieval, cuatro niveles, procedencia y candidatos remotos.
3. `src/reference/policy-engine.mjs`: por qué una fuente sin permiso no puede ordenar una escritura.
4. `src/reference/project-ledger.mjs`: optimistic concurrency, aislamiento entre proyectos, replay y readback.
5. `src/reference/professional-delivery.mjs`: servicios, intervenciones, status `DESIGN_CATALOG` y ausencia de ejecución.
6. `test/reference-runtime.test.mjs`: invariantes y escenarios negativos.

**Si revisás una sola cosa:** buscá una diferencia consistente entre *declarar una acción*, *estar autorizado para ella* y *probar que ocurrió*. Es el diseño que atraviesa todos los subsistemas.

## In 3 minutes

- **System thinking:** orchestration is more than writing prompts.
- **Breadth:** 14 Skills and a multi-domain architecture without claiming production parity.
- **Boundaries:** source authority, domain methods, least privilege and explicit approval.
- **Evidence:** inspect the two test suites and `npm run tour` instead of relying on diagrams.
- **Honesty:** this is a standalone reference, not a live/private-system export.

### Questions this code is designed to answer

- What happens when a needed source disappears?
- What prevents a read-only request from becoming a write?
- Can an unauthorized or forged plan produce a side effect?
- What happens when an identical write is retried?
- Which behaviors are intentionally *not* guaranteed by the reference?
- How are high-risk claims prevented from being automatically canonical?
- How are two project owners or two university subjects kept apart?
- Why are 35 designed library families not described as 35 deployed integrations?

Run `npm test` to inspect those behaviors. No credentials, backend service or browser setup required.
