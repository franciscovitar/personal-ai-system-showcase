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
