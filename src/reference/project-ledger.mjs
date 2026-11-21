/**
 * Synthetic, volatile event-sourced continuity with a compare-and-swap guard.
 * Identity, owner, approval, readback and retry behavior are explicit so the
 * example does not quietly equate conversation memory with source of truth.
 */
export class ProjectLedger {
  #projects = new Map();
  #receipts = new Map();
  #issuedProposals = new WeakSet();

  constructor(seed = []) {
    for (const project of seed) {
      if (!project.id || !project.owner || this.#projects.has(project.id)) throw new Error("Invalid project seed");
      this.#projects.set(project.id, { ...structuredClone(project), revision: 1, events: [] });
    }
  }

  read({ projectId, owner }) {
    const item = this.#projects.get(projectId);
    if (!item || item.owner !== owner) return { status: "NOT_FOUND_OR_NOT_AUTHORIZED" };
    return { status: "FOUND", project: structuredClone(item) };
  }

  propose({ projectId, owner, expectedRevision, change }) {
    const current = this.read({ projectId, owner });
    if (current.status !== "FOUND") return { status: current.status };
    if (current.project.revision !== expectedRevision) return { status: "REVISION_CONFLICT", currentRevision: current.project.revision };
    if (!change || typeof change.nextAction !== "string" || !change.nextAction.trim() || change.nextAction.length > 300) {
      return { status: "INVALID_CHANGE" };
    }
    const proposal = Object.freeze({ status: "PROPOSED_ONLY", projectId, owner, expectedRevision, change: Object.freeze({ nextAction: change.nextAction }), synthetic: true });
    this.#issuedProposals.add(proposal);
    return proposal;
  }

  commit(proposal, { approved = false, idempotencyKey } = {}) {
    if (!proposal || !this.#issuedProposals.has(proposal) || proposal.status !== "PROPOSED_ONLY" || proposal.synthetic !== true) return { status: "DENIED_INVALID_PROPOSAL" };
    if (!approved) return { status: "APPROVAL_REQUIRED" };
    if (typeof idempotencyKey !== "string" || !/^[\w-]{8,64}$/.test(idempotencyKey)) return { status: "INVALID_IDEMPOTENCY_KEY" };
    const previous = this.#receipts.get(idempotencyKey);
    const fingerprint = JSON.stringify({ projectId: proposal.projectId, owner: proposal.owner, expectedRevision: proposal.expectedRevision, change: proposal.change });
    if (previous) return previous.fingerprint === fingerprint ? { ...previous.result, status: "IDEMPOTENT_REPLAY" } : { status: "KEY_REUSE_CONFLICT" };
    const item = this.#projects.get(proposal.projectId);
    if (!item || item.owner !== proposal.owner) return { status: "NOT_FOUND_OR_NOT_AUTHORIZED" };
    if (item.revision !== proposal.expectedRevision) return { status: "REVISION_CONFLICT", currentRevision: item.revision };
    item.events.push({ revision: item.revision + 1, change: structuredClone(proposal.change) });
    item.nextAction = proposal.change.nextAction;
    item.revision += 1;
    const verified = item.nextAction === proposal.change.nextAction && item.revision === proposal.expectedRevision + 1;
    const result = { status: "SYNTHETIC_COMMITTED", revision: item.revision, readbackVerified: verified };
    this.#receipts.set(idempotencyKey, { fingerprint, result });
    return result;
  }
}
