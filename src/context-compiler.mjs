/**
 * A small, bounded stand-in for curated knowledge retrieval. All statements
 * are invented architecture examples, not private PAS knowledge exports.
 */
export const SYNTHETIC_KNOWLEDGE = Object.freeze([
  { id: "global-boundary", workflow: "all", scope: "GLOBAL", sourceId: "knowledge_pack", status: "CURRENT", claim: "A generated answer is not evidence that an external write succeeded." },
  { id: "study-assessment", workflow: "study", scope: "GLOBAL", sourceId: "subject_blueprint", status: "CURRENT", claim: "Choose study activities from an assessment blueprint, then evaluate the result." },
  { id: "study-obsolete", workflow: "study", scope: "GLOBAL", sourceId: "subject_blueprint", status: "SUPERSEDED", claim: "A historical example must not override the current method." },
  { id: "training-capture", workflow: "training", scope: "GLOBAL", sourceId: "training_store", status: "CURRENT", claim: "Only record training fields actually reported by the person." },
  { id: "nutrition-capture", workflow: "nutrition", scope: "GLOBAL", sourceId: "nutrition_store", status: "CURRENT", claim: "Separate reported portions from estimates; never silently invent quantities." },
  { id: "research-confidence", workflow: "research", scope: "GLOBAL", sourceId: "knowledge_pack", status: "CURRENT", claim: "Distinguish retrieved claims from independently verified primary sources." },
  { id: "professional-gates", workflow: "professional", scope: "GLOBAL", sourceId: "delivery_method", status: "CURRENT", claim: "A service method is a planning contract, not permission to deploy or contact a client." },
  { id: "project-progress", workflow: "projects", scope: "example-project", sourceId: "project_context", status: "CURRENT", claim: "The example project uses a bounded current record for continuity." },
  { id: "isolated-other-project", workflow: "projects", scope: "another-project", sourceId: "project_context", status: "CURRENT", claim: "This example belongs to a different project and must stay isolated." },
]);

export function compileContext({ workflow, scope, sourceIds, knowledge = SYNTHETIC_KNOWLEDGE, limit = 3 }) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    return { status: "INVALID_LIMIT", items: [] };
  }
  const allowed = new Set(sourceIds);
  const items = knowledge
    .filter((item) => item.status === "CURRENT")
    .filter((item) => item.workflow === workflow || item.workflow === "all")
    .filter((item) => item.scope === "GLOBAL" || item.scope === scope)
    .filter((item) => allowed.has(item.sourceId))
    .sort((a, b) => Number(b.scope === scope) - Number(a.scope === scope))
    .slice(0, limit)
    .map(({ id, sourceId, claim, scope: sourceScope }) => ({ id, sourceId, scope: sourceScope, claim, evidence: "SYNTHETIC_METHOD_EXAMPLE" }));
  return { status: "COMPILED", items, limit, totalSelected: items.length };
}
