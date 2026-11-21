/**
 * A strict normalization boundary between conversational interpretation and
 * canonical writes. Real interpretation may use a model; this reference only
 * processes explicitly supplied fields and does no external mutation.
 */
export function prepareCapture({ kind, reported = {} } = {}) {
  if (!reported || typeof reported !== "object" || Array.isArray(reported)) return { status: "INVALID_INPUT" };
  if (kind === "training") {
    const fields = ["exercise", "sets", "reps", "kg"];
    if (Object.keys(reported).some((field) => !fields.includes(field))) return { status: "UNKNOWN_FIELD" };
    const missing = fields.filter((field) => reported[field] == null);
    if (missing.length) return { status: "NEEDS_CLARIFICATION", missing, inferred: [] };
    if (typeof reported.exercise !== "string" || !reported.exercise.trim() || reported.exercise.length > 80 || !Number.isInteger(reported.sets) || reported.sets <= 0 || reported.sets > 30 || !Number.isInteger(reported.reps) || reported.reps <= 0 || reported.reps > 100 || typeof reported.kg !== "number" || !Number.isFinite(reported.kg) || reported.kg < 0 || reported.kg > 500) {
      return { status: "INVALID_VALUES" };
    }
    return { status: "PROPOSAL_READY", target: "training_store", record: structuredClone(reported), inferred: [], action: "PROPOSE_ONLY" };
  }
  if (kind === "nutrition") {
    const fields = ["food", "portion"];
    if (Object.keys(reported).some((field) => !fields.includes(field))) return { status: "UNKNOWN_FIELD" };
    const missing = fields.filter((field) => reported[field] == null);
    if (missing.length) return { status: "NEEDS_CLARIFICATION", missing, inferred: [] };
    if (fields.some((field) => typeof reported[field] !== "string" || !reported[field].trim() || reported[field].length > 100)) return { status: "INVALID_VALUES" };
    return { status: "PROPOSAL_READY", target: "nutrition_store", record: structuredClone(reported), inferred: [], action: "PROPOSE_ONLY" };
  }
  return { status: "UNKNOWN_CAPTURE_DOMAIN" };
}
