# Engineering decisions / Decisiones de ingeniería

## ADR-01 — Fuente autoritativa por dominio

**Problema:** datos originales, contexto curado y estado operativo tienen vidas distintas.

**Decisión:** PAS distingue inteligencia canónica, evidencia original y registros de herramientas. En este ejemplo, cada source tiene `owner`, `kind`, `version` y disponibilidad. No hay una base de datos universal creada por el asistente.

**Trade-off:** aumenta la complejidad de seleccionar fuentes, a cambio de reducir duplicaciones y contradicciones.

**Límite público:** el ejemplo no consulta Google Drive, GitHub privado ni ningún conector real.

## ADR-02 — Planificar no es ejecutar

**Problema:** un modelo puede producir una respuesta plausible sin haber obtenido autorización o evidencia.

**Decisión:** `plan()` devuelve `READ_ONLY`, `PROPOSE_ONLY` o un bloqueo. Los cambios de estado requieren una segunda operación explícita, aprobación y validaciones específicas.

**Trade-off:** más pasos para una escritura, menor riesgo de transformar lenguaje ambiguo en un efecto no deseado.

**Límite público:** aprobar un booleano en una simulación **no** reemplaza autenticación ni consentimiento comprobable en producción.

## ADR-03 — Fallar de manera visible

**Problema:** usar una fuente sintética como reemplazo silencioso de una fuente real hace que una respuesta parezca verificada.

**Decisión:** si falta una fuente requerida, el plan termina en `BLOCKED_MISSING_SOURCE`; jamás inventa un registro alternativo.

**Trade-off:** algunas tareas no continúan hasta resolver la fuente, pero el estado es honesto y auditable.

## ADR-04 — Reintentos e idempotencia

**Problema:** un reintento no debe duplicar una captura ni reinterpretar la misma clave con valores distintos.

**Decisión:** la memoria sintética vincula una clave al fingerprint de un payload. Repetir el mismo devuelve el recibo; cambiarlo falla. La lectura posterior confirma la presencia del registro.

**Trade-off:** claves y contratos deben mantenerse coherentes. El ejemplo no cubre transacciones distribuidas, recuperación de caídas ni carreras multiproceso.

## ADR-05 — Evidencia antes que apariencia

**Problema:** un portfolio puede sugerir que una integración está activa porque hay un diagrama elegante.

**Decisión:** la evidencia pública es el código y los tests ejecutables, no una demo conectada falsamente. Los documentos separan el PAS privado de esta referencia.

**Trade-off:** el visitante técnico debe abrir GitHub, pero puede inspeccionar decisiones y pruebas reales del ejemplo.

## ADR-06 — Preservar amplitud sin exponer el sistema personal

**Problema:** una muestra de seis rutas regex escondía la riqueza de PAS; publicar el repo privado filtrado introduciría otros riesgos: permisos, originales, personas, estados y evolución particular.

**Decisión:** reconstruir los **contratos técnicos principales** en módulos autocontenidos, con datos ficticios, sin historia Git compartida ni conectores. Mantener `ControlTower` como caso mínimo e incorporar Skills, retrieval, política, aprendizaje, continuidad, delivery, QA y mejora por composición.

**Trade-off:** la cobertura conceptual es amplia, pero la ejecución no es paridad; la tabla de [cobertura](system-map.md) etiqueta ese límite.

## ADR-07 — Knowledge scope separado de storage

**Problema:** guardar un original en Drive/GitHub no explica a qué proyecto se aplica ni cuándo hay que revisarlo.

**Decisión:** seleccionar primero packs, después claims por GLOBAL/DOMAIN/PROJECT/SUBJECT, versión/estado y fuentes; mantener los originales fuera del contexto salvo necesidad documentada. `remoteCandidates` son punteros, nunca descargas fingidas.

**Trade-off:** aumenta metadata y exige mantener catálogos; reduce contaminaciones entre materias, proyectos y hechos desactualizados.

## ADR-08 — Evidencia y riesgos por afirmación, no por apariencia de documento

**Problema:** un buen resumen y un vínculo a una fuente no prueban una afirmación de riesgo alto.

**Decisión:** distinguir curation, canonical status, verification, locator precision, autoridad, frescura y revisión humana. Separar `PLAN_ONLY`, `EXECUTED_NOT_VERIFIED` y `SYNTHETIC_READBACK_VERIFIED`.

**Trade-off:** el sistema muestra incertidumbre y bloquea promociones sin evidencia; no promete verificar contenido online desde esta referencia.

## ADR-09 — Continuidad por registro versionado y control de concurrencia

**Problema:** seguir un proyecto según recuerdos del chat puede pisar cambios hechos después o contaminar otro proyecto.

**Decisión:** identidad/owner, lectura de revisión actual, propuesta emitida por instancia, CAS, idempotencia y lectura posterior; conflicto requiere releer.

**Trade-off:** el ejemplo usa una memoria volátil; transacciones, locks y credenciales reales pertenecerían a un backend autorizado.

## ADR-10 — Catálogo profesional como contrato, no como feature-complete

**Problema:** confundir 12 servicios, 7 intervenciones y 35 familias diseñadas con 35 herramientas listas para usar es engañoso.

**Decisión:** versionar el catálogo de *capacidades posibles*; verificar metodología vigente y Research First antes de definir trabajo, y no activar un ejecutor desde una planificación. V1 conversacional y V2 diseñada conservan estados separados.

**Trade-off:** una demo estática no impresiona por efectos superficiales; sí permite demostrar taxonomía, criterio y los checks necesarios para un proyecto serio.
