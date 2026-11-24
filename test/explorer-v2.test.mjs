import test from "node:test";
import assert from "node:assert/strict";
import { ROUTES, compatibleRoute, selectFamilies, planBlock, applyCheckpoint, designDeliveryPlan } from "../src/index.mjs";

const task=(id,owner,dependsOn=[],status="PENDING",evidence)=>({id,owner,dependsOn,status,evidence});
const tasks=()=>[task("scope","HUMAN"),task("research","AI"),task("build","AI",["scope","research"])];
test("45 routes are valid, unsupported pairs and inherited keys are rejected",()=>{
  assert.equal(Object.keys(ROUTES).length,12);
  assert.equal(Object.values(ROUTES).flat().length,45);
  for(const [service,interventions] of Object.entries(ROUTES)){
    for(const intervention of interventions){
      assert.equal(compatibleRoute(service,intervention),true);
      const p=selectFamilies({service,intervention});
      assert.equal(p.status,"CATALOG_CANDIDATES_ONLY");
      assert.equal(p.execute,false);
      assert.equal(p.executionAuthority,"NONE");
      assert.equal(p.readOnly,intervention==="AUDIT");
      assert.equal(new Set(p.families.map(f=>f.id)).size,p.families.length);
    }
  }
  assert.equal(designDeliveryPlan({service:"ecommerce",intervention:"REPAIR"}).status,"UNSUPPORTED_COMBINATION");
  assert.equal(compatibleRoute("__proto__","CREATE"),false);
});
test("family selection varies by context and all 35 are eligible on demand",()=>{
  const e=selectFamilies({service:"ecommerce",intervention:"CREATE"});
  const s=selectFamilies({service:"seo",intervention:"AUDIT"});
  assert.ok(e.families.some(f=>f.id==="L22"));
  assert.ok(!s.families.some(f=>f.id==="L22"));
  const all=Array.from({length:35},(_,i)=>"L"+String(i+1).padStart(2,"0"));
  assert.equal(selectFamilies({service:"web-new",intervention:"CREATE",requested:all}).families.length,35);
  assert.equal(selectFamilies({service:"web-new",intervention:"CREATE",requested:["L99"]}).status,"INVALID_FAMILY_REQUEST");
  const receipt={status:"VERIFIED_ACTIVE",commit:"fixture-commit",blobsVerified:true};
  const p=designDeliveryPlan({service:"web-redesign",intervention:"REDESIGN",sourceReceipt:receipt,requestedFamilies:["L08"]});
  assert.equal(p.status,"DESIGN_PLAN_ONLY");
  assert.ok(p.libraryCandidates.includes("L08"));
  assert.equal(p.execute,false);
});
test("planner groups ready human work and advances independent tasks",()=>{
  const p=planBlock({tasks:tasks()});
  assert.deepEqual(p.ai,["research"]);
  assert.deepEqual(p.human,["scope"]);
  assert.equal(p.blocked[0].id,"build");
  const blocked=tasks();blocked[0].status="BLOCKED";
  assert.deepEqual(planBlock({tasks:blocked}).ai,["research"]);
  assert.equal(planBlock({tasks:tasks(),globalBlock:true}).status,"GLOBAL_STOP");
  assert.deepEqual(planBlock({tasks:tasks(),globalBlock:true}).ai,[]);
});
test("invalid dependencies, cycles and inconsistent completion fail closed",()=>{
  assert.equal(planBlock({tasks:[task("a","AI",["b"])]}).status,"INVALID_PLAN");
  assert.equal(planBlock({tasks:[task("a","AI",["b"]),task("b","AI",["a"])]}).status,"INVALID_PLAN");
  const t=tasks();t[2].status="DONE";t[2].evidence="fixture:done";
  assert.equal(planBlock({tasks:t}).status,"INVALID_PLAN");
});
test("checkpoint requires revision, actor, readiness, human approval and fixture evidence",()=>{
  const t=tasks();
  const commit=(event,expectedRevision=1)=>applyCheckpoint({tasks:t,revision:1,expectedRevision,event});
  assert.equal(commit({id:"research",actor:"AI",status:"DONE",evidence:"fixture:research"},0).status,"REVISION_CONFLICT");
  assert.equal(commit({id:"scope",actor:"AI",status:"DONE",approved:true,evidence:"fixture:scope"}).status,"ACTOR_MISMATCH");
  assert.equal(commit({id:"scope",actor:"HUMAN",status:"DONE",evidence:"fixture:scope"}).status,"HUMAN_APPROVAL_REQUIRED");
  assert.equal(commit({id:"research",actor:"AI",status:"DONE",evidence:"done"}).status,"INVALID_EVIDENCE");
  assert.equal(commit({id:"build",actor:"AI",status:"DONE",evidence:"fixture:build"}).status,"TASK_NOT_READY");
  const cp=commit({id:"research",actor:"AI",status:"DONE",evidence:"fixture:research"});
  assert.equal(cp.revision,2);
  assert.equal(t[1].status,"PENDING");
  const next=applyCheckpoint({tasks:cp.tasks,revision:2,expectedRevision:2,event:{id:"scope",actor:"HUMAN",status:"DONE",approved:true,evidence:"fixture:scope"}});
  assert.deepEqual(next.checkpoint.ai,["build"]);
  assert.equal(next.checkpoint.completed.length,2);
  assert.equal(next.execute,false);
});
