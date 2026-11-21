import test from "node:test";
import assert from "node:assert/strict";
import { ControlTower, SYNTHETIC_SOURCES, compileContext, routeIntent } from "../src/index.mjs";

test("routes study without any external write", () => {
  const plan = new ControlTower().plan({ message: "Preparar parcial de Redes" });
  assert.equal(plan.workflow, "study");
  assert.equal(plan.status, "PLAN_READY");
  assert.equal(plan.action, "READ_ONLY");
  assert.deepEqual(plan.selectedSources.map(({ id }) => id), ["subject_blueprint", "official_material"]);
});

test("scopes only the sources needed by a workflow", () => {
  const plan = new ControlTower().plan({ message: "Investigar alternativas de arquitectura" });
  assert.equal(plan.workflow, "research");
  assert.deepEqual(plan.selectedSources.map(({ id }) => id), ["knowledge_pack", "external_references"]);
});

test("context compiler excludes superseded claims and unrelated projects", () => {
  const compiled = compileContext({ workflow: "projects", scope: "example-project", sourceIds: ["project_context"], limit: 3 });
  assert.ok(compiled.items.some((item) => item.id === "project-progress"));
  assert.ok(!compiled.items.some((item) => item.id === "isolated-other-project"));
  const study = compileContext({ workflow: "study", scope: "example-project", sourceIds: ["subject_blueprint"], limit: 3 });
  assert.ok(!study.items.some((item) => item.id === "study-obsolete"));
});

test("context selection obeys its declared item budget", () => {
  const result = compileContext({ workflow: "study", scope: "example-project", sourceIds: ["subject_blueprint"], limit: 1 });
  assert.equal(result.items.length, 1);
  assert.equal(compileContext({ workflow: "study", scope: "example-project", sourceIds: ["subject_blueprint"], limit: -1 }).status, "INVALID_LIMIT");
});

test("routes professional work separately from university work", () => {
  assert.equal(routeIntent("Voy a remodelar una web para un cliente").workflow.id, "professional");
  assert.equal(routeIntent("Continuemos con el proyecto").workflow.id, "projects");
});

test("fails closed when a required source is absent", () => {
  const sources = { ...SYNTHETIC_SOURCES };
  delete sources.official_material;
  const plan = new ControlTower({ sources }).plan({ message: "Preparar examen" });
  assert.equal(plan.status, "BLOCKED_MISSING_SOURCE");
  assert.equal(plan.action, "NONE");
  assert.deepEqual(plan.missingSources, ["official_material"]);
});

test("does not invent an intent or process an empty request", () => {
  const tower = new ControlTower();
  assert.equal(tower.plan({ message: "Hola" }).status, "NEEDS_CLARIFICATION");
  assert.equal(tower.plan({ message: "" }).status, "NEEDS_INPUT");
});

test("rejects oversize messages and malformed scopes", () => {
  const tower = new ControlTower();
  assert.equal(tower.plan({ message: "parcial " + "x".repeat(501) }).status, "INVALID_INPUT");
  assert.equal(tower.plan({ message: "parcial", scope: "../../private" }).status, "INVALID_INPUT");
});

test("capture is a proposal, never an implicit write", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Hoy entrené en el gimnasio" });
  assert.equal(plan.action, "PROPOSE_ONLY");
  assert.equal(tower.store.size, 0);
  const result = tower.applySyntheticWrite(plan, { record: { exercise: "Press", sets: 3, reps: 10, kg: 35 } });
  assert.equal(result.status, "APPROVAL_REQUIRED");
  assert.equal(tower.store.size, 0);
});

test("only approved, validated records enter the synthetic store", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Hoy entrené en el gimnasio" });
  const result = tower.applySyntheticWrite(plan, {
    approved: true,
    idempotencyKey: "training-0001",
    record: { exercise: "Press", sets: 3, reps: 10, kg: 35 },
  });
  assert.equal(result.status, "SYNTHETIC_COMMITTED");
  assert.equal(result.readbackVerified, true);
  assert.equal(result.destination, "SYNTHETIC_MEMORY_ONLY");
  assert.equal(tower.store.size, 1);
});

test("idempotent retries return the same receipt without duplicating records", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Hoy comí una manzana" });
  const options = { approved: true, idempotencyKey: "meal-00001", record: { food: "Manzana", portion: "1 unidad" } };
  const first = tower.applySyntheticWrite(plan, options);
  const retry = tower.applySyntheticWrite(plan, options);
  assert.equal(first.status, "SYNTHETIC_COMMITTED");
  assert.equal(retry.status, "IDEMPOTENT_REPLAY");
  assert.equal(retry.receiptId, first.receiptId);
  assert.equal(tower.store.size, 1);
});

test("reusing an idempotency key with a different payload fails", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Hoy comí arroz" });
  const base = { approved: true, idempotencyKey: "meal-00002" };
  tower.applySyntheticWrite(plan, { ...base, record: { food: "Arroz", portion: "1 plato" } });
  const conflict = tower.applySyntheticWrite(plan, { ...base, record: { food: "Arroz", portion: "2 platos" } });
  assert.equal(conflict.status, "REJECTED_KEY_REUSE");
  assert.equal(tower.store.size, 1);
});

test("a read-only plan cannot be repurposed into an authorized write", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Preparar parcial" });
  const result = tower.applySyntheticWrite(plan, { approved: true, idempotencyKey: "forged-00001", record: { food: "X", portion: "1" } });
  assert.equal(result.status, "DENIED_NOT_WRITE_PROPOSAL");
  assert.equal(tower.store.size, 0);
});

test("a forged proposal object cannot bypass the plan issuer", () => {
  const tower = new ControlTower();
  const fake = { status: "PLAN_READY", synthetic: true, action: "PROPOSE_ONLY", target: "training_store" };
  const result = tower.applySyntheticWrite(fake, { approved: true, idempotencyKey: "forged-00002", record: { exercise: "Press", sets: 3, reps: 10, kg: 35 } });
  assert.equal(result.status, "DENIED_NOT_WRITE_PROPOSAL");
  assert.equal(tower.store.size, 0);
});

test("invalid records and idempotency keys are refused", () => {
  const tower = new ControlTower();
  const plan = tower.plan({ message: "Gimnasio" });
  assert.equal(tower.applySyntheticWrite(plan, { approved: true, idempotencyKey: "short", record: { exercise: "Press", sets: 3, reps: 10, kg: 35 } }).status, "INVALID_IDEMPOTENCY_KEY");
  assert.equal(tower.applySyntheticWrite(plan, { approved: true, idempotencyKey: "valid-000001", record: { exercise: "Press", sets: -1, reps: 10, kg: 35 } }).status, "INVALID_RECORD");
  assert.equal(tower.applySyntheticWrite(plan, { approved: true, idempotencyKey: "valid-000002", record: { exercise: "Press", sets: 3, reps: 10, kg: 35, secret: "not allowed" } }).status, "INVALID_RECORD");
  assert.equal(tower.store.size, 0);
});
