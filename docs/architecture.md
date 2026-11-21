# Architecture / Arquitectura

> Model conceptual público, no diagrama de despliegue del PAS privado.

**Para la arquitectura completa:** [mapa de capas, Skills, dominios y alcance](system-map.md). Este diagrama es la ruta de control más pequeña; el mapa técnico muestra las capas de seguridad, aprendizaje, contexto, mejora y delivery que se sumaron después.

```mermaid
flowchart TD
    A["Conversación o pedido"] --> B["Control tower"]
    B --> C["Router de dominio"]
    C --> D["Método especializado"]
    C --> E["Selector de fuentes"]
    E --> F{"¿Fuentes disponibles?"}
    F -->|No| G["Bloqueo explícito"]
    F -->|Sí| H["Propuesta / resultado"]
    D --> H
    H --> I{"¿Requiere escribir?"}
    I -->|No| J["Resultado con fuentes"]
    I -->|Sí| K["Aprobación + validación"]
    K --> L["Acción autorizada"]
    L --> M["Readback + recibo"]
```

## Límites de responsabilidad

1. **Interfaz.** En el sistema personal, una conversación puede iniciar el pedido. Este repositorio comienza con una cadena de texto, sin ChatGPT API ni credenciales.
2. **Control.** `routeIntent()` identifica uno de seis métodos iniciales; `orchestrateReferenceRequest()` ahora incorpora contratos de Skills, contexto, permisos y evidencia. No replica el ruteo avanzado privado.
3. **Conocimiento.** `resolveSources()` retorna roles y versiones ficticios; `compileKnowledgePacket()` selecciona packs sintéticos por ámbito y señala candidatos remotos no descargados. No hay búsqueda en un repositorio privado.
4. **Ejecución.** `plan()` no ejecuta escrituras. Incluso `training` y `nutrition` terminan como `PROPOSE_ONLY`.
5. **Autorización.** `applySyntheticWrite()` requiere un plan emitido por esa instancia, aprobación, clave de idempotencia y registro validado.
6. **Evidencia.** Las únicas operaciones mutantes (`SyntheticStore` y `ProjectLedger`) escriben en memoria, con recibo e inspección posterior; no sincronizan sistemas reales.
7. **Dominio.** `StudyRuntime`, `prepareCapture()` y `designDeliveryPlan()` exhiben decisiones específicas sin inventar datos ni ejecutar producción.
8. **Mejora.** `reviewImprovement()` analiza baseline/regresiones y nunca modifica el sistema automáticamente.

## Posibles escenarios y sus pruebas

| Solicitud ficticia | Ruta | Fuentes requeridas | Resultado público |
| --- | --- | --- | --- |
| "Preparar mi parcial de Redes" | `study` | Blueprint + material de curso | Plan de lectura, sin puntajes inventados |
| "Hoy entrené en el gimnasio" | `training` | Registro de entrenamiento | Propuesta; autorización antes de append sintético |
| "Hoy comí una manzana" | `nutrition` | Registro nutricional | Datos informados, sin calcular calorías ficticias |
| "Investigar alternativas" | `research` | Pack + referencias | Selección de fuente; no simula navegación real |
| "Remodelar una web" | `professional` | Método + contexto | Ruta y pasos; no inicia un proyecto de cliente |
| "Continuemos el proyecto" | `projects` | Estado de proyecto | Plan con fuente identificada; sin persistencia remota |

## Diferencia fundamental con una aplicación monolítica

En PAS, cada dominio conserva sus reglas y su autoridad. El sistema no necesita convertirse en otra base de datos universal. El punto de integración es **cómo se toma una decisión respaldada por fuentes y permisos**, no copiar toda la información en un chat o repositorio público.

Ver [engineering decisions](engineering-decisions.md) para trade-offs y [security & scope](security-and-scope.md) para límites.
