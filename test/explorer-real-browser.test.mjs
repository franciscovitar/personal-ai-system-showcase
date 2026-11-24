import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { buildExplorer, STATIC_FILES } from "../scripts/build-explorer.mjs";

const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(x=>x && existsSync(x));
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".mjs":"text/javascript; charset=utf-8"};

test("Explorer: actual Chromium journeys, mobile/desktop, language, permissions and isolation", { timeout: 90000, skip: !chrome && !process.env.CI ? "Chromium not installed; set CHROME_BIN" : false }, async () => {
  assert.ok(chrome, "CI requires a Chromium executable");
  const temp=mkdtempSync(join(tmpdir(),"pas-browser-"));
  const root=join(temp,"dist"), profile=join(temp,"profile");
  let child, socket, server, closeBrowser, failed;
  const errors=[], external=[], pending=new Map();
  let id=0;
  try {
    buildExplorer(root);
    const paths=new Set(["index.html",...STATIC_FILES]);
    server=createServer((req,res)=>{
      let path=new URL(req.url,"http://localhost").pathname.slice(1);
      if(path===""||path.endsWith("/"))path+="index.html";
      if(!paths.has(path)){res.writeHead(404);res.end();return;}
      res.writeHead(200,{"Content-Type":mime[extname(path)],"Cache-Control":"no-store"});
      res.end(readFileSync(join(root,path)));
    });
    await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
    const origin="http://127.0.0.1:"+server.address().port;
    child=spawn(chrome,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore",detached:true});
    let spawnError;child.on("error",err=>spawnError=err);
    let port;
    for(let i=0;i<100;i++){
      if(spawnError)throw spawnError;
      if(child.exitCode!==null)throw Error("Chromium exited before startup");
      const file=join(profile,"DevToolsActivePort");
      if(existsSync(file)){port=Number(readFileSync(file,"utf8").split("\n")[0]);if(port)break;}
      await delay(100);
    }
    assert.ok(port,"DevTools port unavailable");
    const tabs=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
    const page=tabs.find(t=>t.type==="page");
    assert.ok(page?.webSocketDebuggerUrl,"No page target");
    socket=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
    socket.addEventListener("message",event=>{
      const m=JSON.parse(event.data);
      if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
      if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text+" "+(m.params.exceptionDetails.exception?.description??""));
      if(m.method==="Network.requestWillBeSent"&&/^https?:/.test(m.params.request.url)&&!m.params.request.url.startsWith(origin+"/"))external.push(m.params.request.url);
    });
    const send=(method,params={})=>new Promise((resolve,reject)=>{
      const key=++id;
      const timer=setTimeout(()=>{pending.delete(key);reject(Error("CDP timeout: "+method));},10000);
      pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
    });
    closeBrowser=()=>send("Browser.close");
    const evaluate=async expression=>{
      const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
      if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);
      return r.result.value;
    };
    const wait=async (expression,description)=>{
      for(let i=0;i<100;i++){
        try{if(await evaluate(expression))return;}catch(err){if(!/context|navigat|destroyed|not find/i.test(String(err)))throw err;}
        await delay(75);
      }
      throw Error("Browser condition failed: "+description);
    };
    const contains=async text=>{await wait("document.body.innerText.includes("+JSON.stringify(text)+")",text);console.log("EXPLORER_CHECK "+text);};
    const nav=async index=>{console.log("EXPLORER_VIEW "+index);await evaluate("document.querySelectorAll('#navigation button')["+index+"].click()");await wait("document.querySelectorAll('#navigation button')["+index+"].getAttribute('aria-current')==='page'","navigation "+index);};
    const field=async (id,value)=>{await evaluate("(()=>{const n=document.getElementById("+JSON.stringify(id)+");n.value="+JSON.stringify(String(value))+";n.dispatchEvent(new Event('change',{bubbles:true}));})()");};
    const toggle=async id=>evaluate("document.getElementById("+JSON.stringify(id)+").click()");
    const clickText=async text=>{const found=await evaluate("(()=>{const b=[...document.querySelectorAll('#screen button')].find(n=>!n.disabled&&n.textContent.trim()==="+JSON.stringify(text)+");if(!b)return false;b.click();return true;})()");assert.equal(found,true,"button "+text);};
    const width=async w=>send("Emulation.setDeviceMetricsOverride",{width:w,height:900,deviceScaleFactor:1,mobile:false});
    const noOverflow=async()=>{const size=await evaluate("({body:document.documentElement.scrollWidth,viewport:innerWidth})");assert.ok(size.body<=size.viewport+2,JSON.stringify(size));};
    await send("Runtime.enable");await send("Network.enable");await send("Page.enable");
    await width(1440);
    await send("Page.navigate",{url:origin+"/explorer/"});
    await contains("Inteligencia compartida");
    assert.equal(await evaluate("document.querySelectorAll('#navigation button').length"),9);
    await noOverflow();
    // Keyboard activation (not merely programmatic click).
    await evaluate("document.querySelectorAll('#navigation button')[1].focus()");
    assert.equal(await evaluate("document.activeElement===document.querySelectorAll('#navigation button')[1]"),true,"navigation keyboard focus");
    await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,text:"\r",unmodifiedText:"\r"});
    await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});
    await contains("REFERENCE_PLAN_READY");
    await toggle("missing");await contains("SOURCE_BLOCKED");
    await toggle("missing");await contains("REFERENCE_PLAN_READY");
    await field("scenario","study");await contains("REFERENCE_PLAN_READY");
    await field("scenario","unknown");await contains("NEEDS_CLARIFICATION");
    await nav(2);await contains("COVERAGE_INCOMPLETE");
    await field("research-mode","complete");await contains("READY_FOR_HUMAN_COMPARISON");
    await field("research-mode","conflict");await contains("CONTRADICTIONS_REQUIRE_REVIEW");
    await nav(3);await field("service","ecommerce");await field("intervention","REPAIR");await contains("UNSUPPORTED_COMBINATION");
    await field("intervention","CREATE");await field("requested-family","L08");await contains("L08");await contains("CATALOG_CANDIDATES_ONLY");
    await nav(4);await contains("AI_WORK_AVAILABLE");
    await clickText("Bloquear");await contains("SYNTHETIC_CHECKPOINT");
    await clickText("Reconciliar bloqueo ficticio");await contains("SYNTHETIC_RECONCILED");
    await toggle("global-stop");await contains("GLOBAL_STOP");
    await toggle("global-stop");await contains("AI_WORK_AVAILABLE");
    await nav(5);await contains("unknown-cost");
    await field("tool-kind","browser");await contains("browser-specialist");
    await nav(6);await contains("CONTACT_BLOCKED");
    await clickText("Aceptar sin evidencia");await contains("BUYER_DECISION_REQUIRED");
    await clickText("Registrar consentimiento ficticio");await contains("DRAFT_FOR_HUMAN_REVIEW");
    await clickText("Suprimir contacto");await contains("CONTACT_BLOCKED");
    await nav(7);await contains("¿Qué usa un router");
    await clickText("tabla de rutas");await contains("ATTEMPT_RECORDED");
    await clickText("Siguiente pregunta");await contains("¿Qué dirección");
    await nav(8);await contains("APPROVAL_REQUIRED");
    await toggle("gov-approval");await contains("SYNTHETIC_WRITE_ELIGIBLE");
    await toggle("gov-live");await contains("DENY_NO_LIVE_CONNECTOR");
    await toggle("gov-regression");await contains("HOLD");
    await toggle("language");await contains("Verify before acting or adopting");
    assert.equal(await evaluate("document.documentElement.lang"),"en");
    await width(390);
    for(let i=0;i<9;i++){await nav(i);await noOverflow();assert.equal(await evaluate("document.querySelectorAll('h1').length"),1);}
    await toggle("reset");await contains("Shared intelligence");
    await nav(6);await contains("CONTACT_BLOCKED");assert.equal(await evaluate("document.querySelector('#screen').innerText.includes('SUPPRESS')"),false);
    await send("Page.navigate",{url:origin+"/explorer/?lang=es"});await contains("Inteligencia compartida");
    await nav(4);await contains("AI_WORK_AVAILABLE");
    assert.deepEqual(errors,[],"browser runtime errors");
    assert.deepEqual(external,[],"external HTTP requests");
    console.log("EXPLORER_BROWSER_PASS: 9 views; desktop and 390px; ES/EN; keyboard; routing, evidence, delivery, blockers, tool selection, consent, learning, policy, reset; no external requests");
  } catch(err) {
    failed=err;
    console.error("EXPLORER_JOURNEY_FAILURE",err.stack??String(err));
    throw err;
  } finally {
    if(closeBrowser){try{await Promise.race([closeBrowser(),delay(1500)]);}catch{}}
    if(socket){try{socket.close();}catch{}}
    for(const p of pending.values())clearTimeout(p.timer);
    if(child&&child.exitCode===null&&child.signalCode===null){
      await Promise.race([new Promise(resolve=>child.once("exit",resolve)),delay(3000)]);
    }
    // Stop only the dedicated detached browser process group, including helpers.
    if(child?.pid){try{process.kill(-child.pid,"SIGTERM");}catch(err){if(err.code!=="ESRCH")console.warn("Browser group termination:",err.code);}}
    await delay(500);
    if(child?.pid){try{process.kill(-child.pid,"SIGKILL");}catch(err){if(err.code!=="ESRCH")console.warn("Browser group termination:",err.code);}}
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    try{rmSync(temp,{recursive:true,force:true,maxRetries:8,retryDelay:250});}
    catch(err){console.error("EXPLORER_CLEANUP_FAILURE",err.code);if(!failed)throw err;}
  }
});
