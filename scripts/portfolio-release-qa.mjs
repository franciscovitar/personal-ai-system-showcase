import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
const cwd=resolve(process.argv[2]);
const origin="http://127.0.0.1:3080";
const baselineOrigin="http://127.0.0.1:3081";
const baselineCwd=resolve(process.argv[3]);
const temp=mkdtempSync(join(tmpdir(),"portfolio-qa-"));
const output=resolve("portfolio-qa-evidence");
mkdirSync(output,{recursive:true});
const browser=[process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"].find(x=>x&&existsSync(x));
assert.ok(browser,"Chromium unavailable");
const groups=[];
const start=(command,args,options={})=>{
 const child=spawn(command,args,{detached:true,stdio:"inherit",...options});
 groups.push(child);return child;
};
let socket;
const pending=new Map();
const errors=[];
try {
 const server=start("node",["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3080"],{cwd,env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}});
 let ready=false;
 for(let i=0;i<80;i++){try{ready=(await fetch(origin+"/?lang=es")).ok;}catch{}if(ready)break;assert.equal(server.exitCode,null);await delay(250);}
 assert.ok(ready,"Next server unavailable");
 const baselineServer=start("node",["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3081"],{cwd:baselineCwd,env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}});
 let baselineReady=false;
 for(let i=0;i<80;i++){try{baselineReady=(await fetch(baselineOrigin+"/?lang=es")).ok;}catch{}if(baselineReady)break;assert.equal(baselineServer.exitCode,null);await delay(250);}
 assert.ok(baselineReady,"Unchanged baseline server unavailable");
 const manifest=JSON.parse(readFileSync(join(cwd,"docs/pas-explorer-snapshot.json"),"utf8"));
 for(const f of manifest.files){
   const response=await fetch(origin+"/"+f.path.replace(/^public\//,""));
   assert.equal(response.status,200,f.path);
   const bytes=Buffer.from(await response.arrayBuffer());
   assert.deepEqual(bytes,readFileSync(join(cwd,f.path)),f.path);
   if(f.path.endsWith(".mjs"))assert.match(response.headers.get("content-type")??"",/javascript/,f.path);
 }
 console.log("PORTFOLIO_ASSET_PASS",manifest.files.length);
 const profile=join(temp,"profile");
 start(browser,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-background-networking","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 let port;
 for(let i=0;i<100;i++){const f=join(profile,"DevToolsActivePort");if(existsSync(f)){port=Number(readFileSync(f,"utf8").split("\n")[0]);if(port)break;}await delay(100);}
 assert.ok(port);
 const page=(await (await fetch("http://127.0.0.1:"+port+"/json/list")).json()).find(t=>t.type==="page");
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
 socket.addEventListener("message",event=>{
  const m=JSON.parse(event.data);
  if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
  if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
 });
 let seq=0;
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout "+method));},10000);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const wait=async(expression,label)=>{for(let i=0;i<100;i++){try{if(await evaluate(expression))return;}catch(e){if(!/context|navigat|destroyed|not find/i.test(String(e)))throw e;}await delay(100);}throw Error("Condition failed: "+label);};
 const navigate=async (path,host=origin)=>{
  await send("Page.navigate",{url:host+path});
  await wait("location.href==="+JSON.stringify(host+path)+"&&document.readyState==='complete'",path);
  await evaluate("document.fonts.ready.then(()=>true)");
 };
 const screenshot=async name=>{
  await evaluate("document.fonts.ready.then(()=>true)");await delay(250);
  const s=await send("Page.captureScreenshot",{format:"png",fromSurface:true});writeFileSync(join(output,name+".png"),Buffer.from(s.data,"base64"));
 };
 const width=async w=>send("Emulation.setDeviceMetricsOverride",{width:w,height:w===390?844:900,deviceScaleFactor:1,mobile:false});
 const noOverflow=async(label)=>{const v=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:String(e.className?.baseVal??e.className??''),right:Math.round(e.getBoundingClientRect().right),left:Math.round(e.getBoundingClientRect().left),width:Math.round(e.getBoundingClientRect().width)})).filter(e=>e.width>0&&(e.right>innerWidth+2||e.left< -2)).sort((a,b)=>b.right-a.right).slice(0,12)})");if(v.scroll>v.width+2){await screenshot("overflow-"+label);throw Error("Horizontal overflow "+label+" "+JSON.stringify(v));}};
 const homeMetrics=async()=>evaluate("(()=>{const w=document.documentElement.clientWidth;const offenders=[...document.querySelectorAll('body *')].map(e=>{const r=e.getBoundingClientRect();let right=r.right,left=r.left;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX)){const a=p.getBoundingClientRect();right=Math.min(right,a.right);left=Math.max(left,a.left);}}return {tag:e.tagName,cls:String(e.className?.baseVal??e.className??''),right:Math.round(right),left:Math.round(left),width:Math.round(r.width)};}).filter(e=>e.width>0&&(e.right>w+2||e.left< -2)).sort((a,b)=>b.right-a.right).slice(0,20);return {viewport:innerWidth,client:w,scroll:document.documentElement.scrollWidth,offenders};})()");
 const explorer="/pas-explorer/explorer/index.html";
 const caseRoute="/work/personal-ai-system";
 await send("Runtime.enable");await send("Page.enable");await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const w of [1440,390]){
  await width(w);
  for(const lang of ["es","en"]){
   let baselineHome=null;
   if(w===390){await navigate("/?lang="+lang,baselineOrigin);baselineHome=await homeMetrics();console.log("PORTFOLIO_BASELINE_HOME",lang,JSON.stringify(baselineHome));}
   await navigate("/?lang="+lang);
   const href=await evaluate("Array.from(document.querySelectorAll('a[href]')).find(a=>a.getAttribute('href')==="+JSON.stringify(explorer+"?lang="+lang)+")?.getAttribute('href')");
   assert.equal(href,explorer+"?lang="+lang,"homepage Explorer link");
   assert.equal(await evaluate("document.documentElement.lang"),lang);
   await evaluate("Array.from(document.querySelectorAll('a[href]')).find(a=>a.getAttribute('href')==="+JSON.stringify(href)+").closest('article')?.scrollIntoView({block:'start',behavior:'instant'})");
   const copyWidth=await evaluate("Array.from(document.querySelectorAll('a[href]')).find(a=>a.getAttribute('href')==="+JSON.stringify(href)+").closest('article').querySelector('h3').getBoundingClientRect().width");assert.ok(copyWidth>=Math.min(280,w-32),"flagship text column "+copyWidth);if(w===390){
    const actual=await homeMetrics();
    const bounds=await evaluate("(()=>{const a=[...document.querySelectorAll('article')].find(e=>e.querySelector('a[href^=\"/pas-explorer/\"]'));const r=a.getBoundingClientRect();const w=document.documentElement.clientWidth;return {left:r.left,right:r.right,client:w,overflow:[...a.querySelectorAll('*')].map(e=>({cls:String(e.className?.baseVal??e.className??''),r:e.getBoundingClientRect().right,l:e.getBoundingClientRect().left})).filter(e=>e.r>w+2||e.l< -2).slice(0,10)};})()");
    console.log("PORTFOLIO_CANDIDATE_HOME",lang,JSON.stringify(actual),"PAS_BOUNDS",JSON.stringify(bounds));
    assert.ok(bounds.left>=-2&&bounds.right<=bounds.client+2&&bounds.overflow.length===0,"new PAS block exceeds viewport "+JSON.stringify(bounds));
    assert.ok(actual.scroll<=Math.max(actual.viewport,baselineHome.scroll)+2,"new homepage horizontal regression "+JSON.stringify(actual));
    if(actual.scroll>actual.viewport+2)console.log("PORTFOLIO_EXISTING_HOME_OVERFLOW",lang,baselineHome.scroll,actual.scroll);
   }else await noOverflow("home-"+lang+"-"+w);
   await screenshot("home-pas-"+lang+"-"+w);
   await navigate(caseRoute+"?lang="+lang);
   assert.equal(await evaluate("document.documentElement.lang"),lang);
   await wait("document.querySelector('#pas-ecosystem')!==null","ecosystem rendered");
   assert.ok(await evaluate("Array.from(document.querySelectorAll('a[href]')).some(a=>a.getAttribute('href')==="+JSON.stringify(href)+")"),"case Explorer link");
   assert.equal(await evaluate("document.querySelectorAll('#pas-ecosystem details').length"),7);
   await noOverflow("case-"+lang+"-"+w);await screenshot("case-hero-"+lang+"-"+w);
   await evaluate("document.querySelector('#pas-ecosystem').scrollIntoView({block:'start',behavior:'instant'})");
   await screenshot("ecosystem-"+lang+"-"+w);
   await evaluate("document.querySelector('#pas-ecosystem details summary').click()");
   assert.equal(await evaluate("document.querySelector('#pas-ecosystem details').open"),true);
   await navigate(href);
   await wait("document.querySelectorAll('#navigation button').length===9","Explorer boot");
   assert.equal(await evaluate("document.documentElement.lang"),lang);
   await noOverflow("explorer-"+lang+"-"+w);await screenshot("explorer-"+lang+"-"+w);
   await evaluate("document.querySelectorAll('#navigation button')[1].click()");
   await wait("document.body.innerText.includes('REFERENCE_PLAN_READY')","working integrated Explorer");
   await evaluate("document.getElementById('missing').click()");
   await wait("document.body.innerText.includes('SOURCE_BLOCKED')","integrated negative case");
   await noOverflow("explorer-negative-"+lang+"-"+w);
   console.log("PORTFOLIO_BROWSER_PASS",w,lang);
  }
 }
 assert.deepEqual(errors,[],"uncaught JavaScript exceptions");
 console.log("PORTFOLIO_RELEASE_QA_PASS");
} catch(e){console.error("PORTFOLIO_RELEASE_QA_FAIL",e.stack??String(e));throw e;}
finally {
 if(socket)try{socket.close();}catch{}
 for(const p of pending.values())clearTimeout(p.timer);
 for(const child of groups.reverse())if(child.pid)try{process.kill(-child.pid,"SIGTERM");}catch{}
 await delay(800);
 for(const child of groups)if(child.pid)try{process.kill(-child.pid,"SIGKILL");}catch{}
 try{rmSync(temp,{recursive:true,force:true,maxRetries:8,retryDelay:250});}catch(e){console.warn("Temporary profile cleanup:",e.code);}
}
