import {
  SKILLS, SERVICES, INTERVENTIONS, LIBRARY_FAMILIES,
  orchestrateReferenceRequest, ProjectLedger, StudyRuntime, prepareCapture,
  assessClaim, reviewImprovement,
} from "../src/index.mjs";

const show = (label, result) => console.log(`\n## ${label}\n${JSON.stringify(result, null, 2)}`);
show("Architecture inventory (public descriptions)", { skills: SKILLS.length, services: SERVICES.length, interventions: INTERVENTIONS.length, designedLibraryFamilies: LIBRARY_FAMILIES.length });
show("Control Tower → Skills → Sources → Context → Policy → Evidence", orchestrateReferenceRequest({ message: "Voy a remodelar una web para un cliente" }));
show("Captura: never silently infer a missing load", prepareCapture({ kind: "training", reported: { exercise: "Squat", sets: 3, reps: 8 } }));

const study = new StudyRuntime();
show("Adaptive learning: one question and no fictional readiness score", { question: study.next(), coverage: study.summary() });

const ledger = new ProjectLedger([{ id: "example", owner: "fictional-owner", nextAction: "Define scope" }]);
const proposal = ledger.propose({ projectId: "example", owner: "fictional-owner", expectedRevision: 1, change: { nextAction: "Review sources" } });
show("Continuity: versioned, explicitly approved synthetic commit + readback", ledger.commit(proposal, { approved: true, idempotencyKey: "demo-project-001" }));
show("Source governance: stale high-risk claim", assessClaim({ risk: 3, curation: "curated", verification: "structural", sourceCurrent: false, sourceAuthority: "B", retrievalEvalPassed: true }));
show("Continuous improvement: no automatic adoption", reviewImprovement({ proposal: "New retrieval algorithm", targetLayer: "knowledge", risk: 2 }));
