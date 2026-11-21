import { ControlTower } from "../src/index.mjs";

const tower = new ControlTower();

const scenarios = [
  "Quiero preparar mi parcial de Redes",
  "Quiero registrar lo que entrené en el gimnasio",
  "Necesito investigar alternativas de arquitectura",
  "Voy a remodelar una web para un cliente",
  "Continuemos con el proyecto de ejemplo",
];

for (const message of scenarios) {
  const plan = tower.plan({ message });
  console.log(`\n> ${message}`);
  console.log(JSON.stringify({ status: plan.status, workflow: plan.workflow, action: plan.action, sources: plan.selectedSources?.map((source) => source.id) }, null, 2));
}

// This is a standalone code example, not a hosted product or access to PAS.
const capturePlan = tower.plan({ message: "Registré entrenamiento en el gimnasio" });
const proposal = { exercise: "Press de pecho", sets: 3, reps: 10, kg: 35 };
console.log("\nSynthetic write without approval:", tower.applySyntheticWrite(capturePlan, { record: proposal }).status);
console.log("Synthetic write with approval:", tower.applySyntheticWrite(capturePlan, { approved: true, idempotencyKey: "example-capture-001", record: proposal }));
