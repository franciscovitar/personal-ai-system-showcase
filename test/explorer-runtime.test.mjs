import test from "node:test";
import assert from "node:assert/strict";
import { reviewResearch, compareToolRoutes, makeCommercialCase, advanceCommercialCase, contactDraftEligibility, reviewEconomics, traceBrowserRequest } from "../src/index.mjs";

const f={question:"Fixture decision",facets:[{id:"cost",label:"Cost"}],options:[{id:"keep",label:"Keep",kind:"NO_CHANGE"},{id:"build",label:"Build",kind:"BUILD"}],sources:[{id:"a",label:"Fixture report",origin:"team-a",authority:"PRIMARY",current:true,checked:true}],evidence:[{id:"e1",optionId:"keep",facetId:"cost",sourceId:"a",kind:"OBSERVATION",direction:"SUPPORT",locator:"fixture section",claim:"Synthetic observation"}]};
test("research exposes gaps, contrary evidence, stale sources and no-change requirement",()=>{
  assert.equal(reviewResearch(f).status,"COVERAGE_INCOMPLETE");
  const e={...f.evidence[0],id:"e2",optionId:"build"};
  assert.equal(reviewResearch({...f,evidence:[...f.evidence,e]}).status,"READY_FOR_HUMAN_COMPARISON");
  const disputed=reviewResearch({...f,evidence:[...f.evidence,e,{...e,id:"e3",direction:"CONTRARY"}]});
  assert.equal(disputed.status,"CONTRADICTIONS_REQUIRE_REVIEW");
  assert.equal(disputed.winner,null);
  assert.equal(reviewResearch({...f,sources:[{...f.sources[0],current:false}]}).coverage.examined,0);
  assert.equal(reviewResearch({...f,options:[f.options[1]]}).status,"INVALID_RESEARCH");
  assert.equal(reviewResearch({...f,evidence:[{...f.evidence[0],sourceId:"unknown"}]}).status,"INVALID_RESEARCH");
});
const task={id:"code",requires:["repo"],maxCostCents:0,minQuality:80,risk:2,dataClass:"SYNTHETIC"};
const candidate={id:"local",capabilities:["repo"],available:true,targetBound:true,authorized:true,dataClasses:["SYNTHETIC"],costCents:0,quality:90,humanMinutes:5,reworkMinutes:3,evalTaskId:"code",evidenceKind:"MATCHED_FIXTURE",independentVerification:true};
test("tool evaluation rejects unknown cost, permissions, incomparable tests and weak verification",()=>{
  const r=compareToolRoutes({task,candidates:[candidate,{...candidate,id:"unknown-cost",costCents:null},{...candidate,id:"unapproved",authorized:false},{...candidate,id:"weak",independentVerification:false},{...candidate,id:"other-test",evalTaskId:"other"}]});
  assert.deepEqual(r.eligible.map(x=>x.id),["local"]);
  assert.equal(r.suggestion,"local");assert.equal(r.executionAuthority,"NONE");
  assert.equal(r.excluded.length,4);
  assert.equal(compareToolRoutes({task,candidates:[{...candidate,costCents:1}]}).status,"NO_ELIGIBLE_ROUTE");
});
test("tool comparison shows real tradeoff and preserves nondominated baseline",()=>{
  const other={...candidate,id:"other",quality:95,humanMinutes:10};
  assert.equal(compareToolRoutes({task,candidates:[candidate,other]}).status,"TRADEOFF_REVIEW");
  assert.equal(compareToolRoutes({task,candidates:[candidate,other],baselineId:"local"}).suggestion,"local");
});
const step=(state,type,extra={})=>advanceCommercialCase({state,expectedRevision:state.revision,event:{type,evidence:"fixture:review",...extra}});
test("commercial lifecycle cannot infer terms, buyer acceptance or send authority",()=>{
  let state=makeCommercialCase();
  assert.equal(contactDraftEligibility(state).status,"CONTACT_BLOCKED");
  assert.equal(step(state,"BUYER_ACCEPT").status,"BUYER_DECISION_REQUIRED");
  assert.equal(step(state,"QUALIFY",{observedNeed:false}).status,"QUALIFICATION_REQUIRED");
  state=step(state,"QUALIFY",{observedNeed:true,goalRef:"fixture:goal"}).state;
  state=step(state,"SCOPE",{feasibilityRef:"fixture:fit",acceptanceRef:"fixture:scope"}).state;
  assert.equal(step(state,"PROPOSE",{termsRef:"fixture:terms",amountCents:500}).status,"TERMS_APPROVAL_REQUIRED");
  state=step(state,"PROPOSE",{termsRef:"fixture:terms",amountCents:500,ownerApproved:true}).state;
  assert.equal(step(state,"BUYER_ACCEPT",{termsRef:"fixture:wrong",buyerConfirmed:true}).status,"BUYER_DECISION_REQUIRED");
  const won=step(state,"BUYER_ACCEPT",{termsRef:"fixture:terms",buyerConfirmed:true});
  assert.equal(won.state.stage,"WON");assert.equal(won.send,false);
  assert.equal(advanceCommercialCase({state,expectedRevision:1,event:{type:"NO_DEAL",evidence:"fixture:decision"}}).status,"REVISION_CONFLICT");
});
test("suppression sticks; no deal and incomplete economics remain explicit",()=>{
  let state=step(makeCommercialCase(),"RECORD_CONSENT",{buyerConfirmed:true}).state;
  assert.equal(contactDraftEligibility(state).status,"DRAFT_FOR_HUMAN_REVIEW");
  state=step(state,"SUPPRESS").state;
  assert.equal(contactDraftEligibility(state).status,"CONTACT_BLOCKED");
  assert.equal(step(state,"RECORD_CONSENT",{buyerConfirmed:true}).status,"CONSENT_BLOCKED");
  assert.equal(step(state,"NO_DEAL").state.stage,"LOST");
  assert.equal(reviewEconomics({revenueCents:1000,directCostCents:300}).contributionCents,null);
  assert.equal(reviewEconomics({revenueCents:1000,directCostCents:300,deliveryMinutes:30}).contributionPerHourCents,1400);
});
test("browser trace composes existing modules without exposing other subjects or fake execution",()=>{
  const r=traceBrowserRequest({message:"Preparar parcial de Redes",subjectId:"networks"});
  assert.equal(r.status,"REFERENCE_PLAN_READY");assert.equal(r.workflow,"study");assert.equal(r.executed,false);
  assert.ok(!r.knowledge.claims.some(c=>c.id==="K-008"));
  assert.equal(traceBrowserRequest({message:"Preparar parcial de Redes",subjectId:"networks",missingSource:"official_material"}).status,"SOURCE_BLOCKED");
  assert.equal(traceBrowserRequest({message:""}).status,"NEEDS_INPUT");
});
