import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

function modules(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? modules(path) : entry.isFile() && path.endsWith(".mjs") ? [path] : [];
  });
}

const files = ["src", "test", "examples", "scripts", "explorer"].flatMap(modules);
for (const path of files) execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
console.log(`Syntax checked: ${files.length} JavaScript modules`);
