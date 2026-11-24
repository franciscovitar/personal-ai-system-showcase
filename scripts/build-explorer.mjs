import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
// Only the inspected browser graph and static assets are shipped. No Node-only store,
// tests, private connections, dependency installation, or network requests.
export const STATIC_FILES=Object.freeze([
  "explorer/index.html","explorer/styles.css","explorer/app.mjs","explorer/fixtures.mjs",
  "src/catalog.mjs","src/source-registry.mjs",
  "src/reference/skill-registry.mjs","src/reference/knowledge-runtime.mjs",
  "src/reference/policy-engine.mjs","src/reference/evidence-runtime.mjs",
  "src/reference/browser-trace.mjs","src/reference/delivery-selection.mjs",
  "src/reference/professional-delivery.mjs","src/reference/research-review.mjs",
  "src/reference/tool-comparison.mjs","src/reference/execution-block.mjs",
  "src/reference/commercial-case.mjs","src/reference/improvement-runtime.mjs",
  "src/reference/study-runtime.mjs"
]);
const home='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./explorer/"><title>PAS Explorer</title><p><a href="./explorer/">Open PAS Explorer</a></p></html>\n';
function checkExisting(out,folder=out){
  for(const name of readdirSync(folder)){
    const path=join(folder,name),rel=relative(out,path).replaceAll("\\","/");
    const stat=lstatSync(path);
    if(stat.isSymbolicLink())throw Error("Unexpected symlink in output: "+rel);
    if(stat.isDirectory()){
      if(!STATIC_FILES.some(f=>f.startsWith(rel+"/")))throw Error("Unexpected output directory: "+rel);
      checkExisting(out,path);
    }else if(!stat.isFile()||!(STATIC_FILES.includes(rel)||rel==="index.html"))throw Error("Unexpected output file: "+rel);
  }
}
export function buildExplorer(destination=join(root,"dist")){
  const out=resolve(destination);
  // A build only writes its own generated files, never removes arbitrary paths.
  if(existsSync(out)){
    if(!lstatSync(out).isDirectory()||lstatSync(out).isSymbolicLink())throw Error("Invalid output directory");
    checkExisting(out);
  }else mkdirSync(out,{recursive:true});
  for(const path of STATIC_FILES){const dst=join(out,path);mkdirSync(dirname(dst),{recursive:true});copyFileSync(join(root,path),dst);}
  writeFileSync(join(out,"index.html"),home,"utf8");
  return {files:STATIC_FILES.length+1,out};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=buildExplorer();
  console.log("Static Explorer: "+result.files+" files in "+result.out);
}
