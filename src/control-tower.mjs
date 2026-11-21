import { routeIntent } from "./catalog.mjs";
import { resolveSources, SYNTHETIC_SOURCES } from "./source-registry.mjs";
import { SyntheticStore } from "./synthetic-store.mjs";
import { compileContext } from "./context-compiler.mjs";

const MAX_TEXT_LENGTH = 500;

export class ControlTower {
  #issuedWritePlans = new WeakSet();

  constructor({ sources = SYNTHETIC_SOURCES, store = new SyntheticStore() } = {}) {
    this.sources = sources;
    this.store = store;
  }

  plan({ message, scope = "example-project" } = {}) {
    const routing = routeIntent(message);
    if (routing.status !== "ROUTED") {
      return { status: routing.status, action: "NONE", next: "Clarify the intent before selecting tools." };
    }
    if (message.length > MAX_TEXT_LENGTH || !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(scope)) {
      return { status: "INVALID_INPUT", action: "NONE" };
    }

    const { workflow } = routing;
    const { found, missing } = resolveSources(workflow.sourceIds, this.sources);
    const context = compileContext({ workflow: workflow.id, scope, sourceIds: found.map(({ id }) => id), limit: 3 });
    const base = {
      workflow: workflow.id,
      label: workflow.label,
      scope,
      selectedSources: found,
      missingSources: missing,
      context,
      steps: workflow.steps,
      operation: workflow.operation,
      target: workflow.target ?? null,
      synthetic: true,
    };

    if (missing.length) {
      return { ...base, status: "BLOCKED_MISSING_SOURCE", action: "NONE", next: "Restore verified source access or clarify the request." };
    }

    const plan = Object.freeze({
      ...base,
      status: "PLAN_READY",
      action: workflow.operation === "WRITE_PROPOSAL" ? "PROPOSE_ONLY" : "READ_ONLY",
      next: workflow.operation === "WRITE_PROPOSAL"
        ? "Owner approval and an idempotency key are required for a synthetic append."
        : "Use the source-checked method; no external action was executed.",
    });
    if (plan.action === "PROPOSE_ONLY") this.#issuedWritePlans.add(plan);
    return plan;
  }

  /**
   * A separate, consent-gated operation. Only the synthetic store is writable.
   * No real PAS connector, account, source or secret is included in this project.
   */
  applySyntheticWrite(plan, { approved = false, idempotencyKey, record } = {}) {
    if (!plan || !this.#issuedWritePlans.has(plan) || plan.status !== "PLAN_READY" || plan.synthetic !== true || plan.action !== "PROPOSE_ONLY") {
      return { status: "DENIED_NOT_WRITE_PROPOSAL", written: false };
    }
    if (plan.target !== "training_store" && plan.target !== "nutrition_store") {
      return { status: "DENIED_TARGET", written: false };
    }
    if (!approved) return { status: "APPROVAL_REQUIRED", written: false };
    if (typeof idempotencyKey !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(idempotencyKey)) {
      return { status: "INVALID_IDEMPOTENCY_KEY", written: false };
    }
    let serialized;
    try { serialized = JSON.stringify(record); } catch { return { status: "INVALID_RECORD", written: false }; }
    if (!record || typeof record !== "object" || Array.isArray(record) || !Object.keys(record).length || !serialized || serialized.length > 2000) {
      return { status: "INVALID_RECORD", written: false };
    }

    // Accept a small, explicit record shape rather than treating an arbitrary
    // tool/model payload as a safe command.
    const keys = plan.target === "training_store" ? ["exercise", "sets", "reps", "kg"] : ["food", "portion"];
    if (Object.keys(record).some((key) => !keys.includes(key)) || keys.some((key) => !(key in record))) {
      return { status: "INVALID_RECORD", written: false };
    }
    const valid = plan.target === "training_store"
      ? typeof record.exercise === "string" && record.exercise.trim().length > 0 && record.exercise.length <= 80 &&
        Number.isInteger(record.sets) && record.sets > 0 && record.sets <= 30 &&
        Number.isInteger(record.reps) && record.reps > 0 && record.reps <= 100 &&
        typeof record.kg === "number" && Number.isFinite(record.kg) && record.kg >= 0 && record.kg <= 500
      : typeof record.food === "string" && record.food.trim().length > 0 && record.food.length <= 100 &&
        typeof record.portion === "string" && record.portion.trim().length > 0 && record.portion.length <= 100;
    if (!valid) return { status: "INVALID_RECORD", written: false };

    const receipt = this.store.append({ target: plan.target, idempotencyKey, record });
    const readback = receipt.receiptId ? this.store.getByReceipt(receipt.receiptId) : null;
    return {
      ...receipt,
      readbackVerified: Boolean(readback && readback.target === plan.target),
      destination: "SYNTHETIC_MEMORY_ONLY",
    };
  }
}
