import { ControlTower } from "../control-tower.mjs";
import { selectSkillStack } from "./skill-registry.mjs";
import { compileKnowledgePacket } from "./knowledge-runtime.mjs";
import { evaluateAccess } from "./policy-engine.mjs";
import { evidenceState } from "./evidence-runtime.mjs";

/** A compositional trace across routing, skills, retrieval, policy and evidence. */
export function orchestrateReferenceRequest({ message, scope = "example-project", subjectId = null, tower = new ControlTower() } = {}) {
  const base = tower.plan({ message, scope });
  if (base.status !== "PLAN_READY") return { status: base.status, base, synthetic: true, executed: false };
  const skills = selectSkillStack(base.workflow);
  const context = compileKnowledgePacket({
    task: message, domain: base.workflow, projectId: scope, subjectId,
    candidateIds: base.workflow === "study" ? ["learning", "course-material"]
      : base.workflow === "professional" ? ["product-delivery"]
      : base.workflow === "training" ? ["fitness"] : ["reliable-systems"],
  });
  const policy = evaluateAccess({ operation: base.action === "PROPOSE_ONLY" ? "PROPOSE" : "READ", sourceVerified: !base.missingSources.length });
  return {
    status: policy.allowed ? "REFERENCE_PLAN_READY" : "POLICY_BLOCKED",
    intent: base.workflow,
    skills,
    sources: base.selectedSources.map(({ id, owner, version }) => ({ id, owner, version })),
    knowledge: context,
    policy,
    evidence: evidenceState({ planned: true, sourceIds: base.selectedSources.map((s) => s.id) }),
    next: base.next,
    executed: false,
    synthetic: true,
  };
}
