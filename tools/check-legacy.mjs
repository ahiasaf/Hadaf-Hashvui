import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
let count = 0;
async function check(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.name.endsWith(".js")) {
      new vm.Script(await fs.readFile(file, "utf8"), { filename: file });
      count++;
    }
  }
}
await check("src/shared");
await check("src/config");
await check("src/features");
new vm.Script(await fs.readFile("src/service-worker.js", "utf8"));
console.log("Specialist script syntax:", count + 1, "files passed.");
