import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { makeResearchFixture, makeToolFixture, makeTasks, commercialNext, studyFixture, SCENARIOS } from "../explorer/fixtures.mjs";
import { reviewResearch, compareToolRoutes, applyCheckpoint, reconcileTask, traceBrowserRequest, StudyRuntime, makeCommercialCase, advanceCommercialCase } from "../src/index.mjs";
import { STATIC_FILES, buildExplorer } from "../scripts/build-explorer.mjs";
test("every browser scenario routes or asks for clarification; missing sources fail closed",()=>{
  for(const s of SCENARIOS){
    const r=traceBrowserRequest({message:s.message,subjectId:s.subjectId});
    assert.equal(r.status,s.id==="unknown"?"NEEDS_CLARIFICATION":"REFERENCE_PLAN_READY");
    if(s.missing)assert.equal(traceBrowserRequest({message:s.message,subjectId:s.subjectId,missingSource:s.missing}).status,"SOURCE_BLOCKED");
  }
});
test("research fixtures exercise gap, completion, conflicting and stale evidence",()=>{
  for(const [mode,expected] of [["gap","COVERAGE_INCOMPLETE"],["complete","READY_FOR_HUMAN_COMPARISON"],["conflict","CONTRADICTIONS_REQUIRE_REVIEW"],["stale","COVERAGE_INCOMPLETE"]])assert.equal(reviewResearch(makeResearchFixture(mode)).status,expected);
});
test("tool fixtures exclude unknown cost, paid and unauthorized routes across capabilities",()=>{
  for(const kind of ["repo","browser","research"]){
    const r=compareToolRoutes(makeToolFixture(kind));
    assert.ok(r.eligible.length>0);
    for(const id of ["unknown-cost","unverified-access","paid-option"])assert.ok(r.excluded.some(c=>c.id===id));
    assert.equal(r.executionAuthority,"NONE");
  }
});
test("blocked fixture task reconciles only at current revision with approval and evidence",()=>{
  const r=applyCheckpoint({tasks:makeTasks(),revision:1,expectedRevision:1,event:{id:"scope",actor:"HUMAN",status:"BLOCKED"}});
  assert.equal(r.status,"SYNTHETIC_CHECKPOINT");assert.deepEqual(r.checkpoint.ai,["research"]);
  const p={tasks:r.tasks,revision:2,expectedRevision:2,taskId:"scope",approved:true,evidence:"fixture:resolved"};
  assert.equal(reconcileTask({...p,expectedRevision:1}).status,"REVISION_CONFLICT");
  assert.equal(reconcileTask({...p,approved:false}).status,"RECONCILIATION_REQUIRED");
  assert.equal(reconcileTask({...p,globalBlock:true}).status,"GLOBAL_STOP");
  const resolved=reconcileTask(p);assert.equal(resolved.revision,3);assert.deepEqual(resolved.checkpoint.human,["scope"]);assert.equal(resolved.execute,false);
});
test("commercial journey fixture completes without external authority",()=>{
  let state=makeCommercialCase();
  for(let i=0;i<6;i++){const event=commercialNext(state.stage);assert.ok(event);const r=advanceCommercialCase({state,expectedRevision:state.revision,event:{...event,evidence:"fixture:step-"+i}});assert.equal(r.status,"SYNTHETIC_TRANSITION");assert.equal(r.send,false);state=r.state;}
  assert.equal(state.stage,"REVIEWED");assert.equal(commercialNext(state.stage),null);
});
test("study fixture supports both languages without claiming mastery",()=>{
  for(const lang of ["es","en"]){
    const f=studyFixture(lang);const runtime=new StudyRuntime(f);const q=runtime.next();
    const a=runtime.answer({questionId:q.question.id,response:f.items[0].answerKey,selfRating:"good"});
    assert.equal(a.recalledKey,true);assert.equal(a.masteryClaimed,false);
    assert.equal(runtime.summary().readiness,"NOT_ESTIMATED");
  }
});
test("static package copies only the browser graph, validates imports, preserves unrelated files",()=>{
  const out=mkdtempSync(join(tmpdir(),"pas-explorer-"));
  try{
    assert.equal(buildExplorer(out).files,STATIC_FILES.length+1);
    const html=readFileSync(join(out,"explorer/index.html"),"utf8");
    assert.match(html,/connect-src 'none'/);assert.match(html,/type="module" src="\.\/app\.mjs"/);
    assert.ok(!existsSync(join(out,"src/synthetic-store.mjs")));
    for(const path of STATIC_FILES.filter(x=>x.endsWith(".mjs"))){
      const content=readFileSync(join(out,path),"utf8");
      for(const match of content.matchAll(/import\s*\{[^}]+\}\s*from\s*["']([^"']+)["'];/g)){
        assert.ok(match[1].startsWith("."));assert.ok(STATIC_FILES.includes(posix.normalize(posix.join(posix.dirname(path),match[1]))),"missing browser import: "+match[1]);
      }
      assert.doesNotMatch(content,/\.innerHTML\s*=/);
    }
    assert.equal(buildExplorer(out).files,STATIC_FILES.length+1);
    writeFileSync(join(out,"unrelated.txt"),"keep");
    assert.throws(()=>buildExplorer(out),/Unexpected output file/);
    assert.equal(readFileSync(join(out,"unrelated.txt"),"utf8"),"keep");
  }finally{rmSync(out,{recursive:true,force:true});}
});
