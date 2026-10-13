import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { programScript, programContent } from "../src/config/content.ts";
export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export function maintenanceContext(files = ["stepid.js"]) {
  const context = { console, JSON, Math, Object, String, esc: String, CFG: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(programScript(), context);
  for (const file of files)
    vm.runInContext(
      fs.readFileSync(path.join(ROOT, "src/shared", file), "utf8"),
      context,
    );
  return context;
}
export async function maintenanceFetch(input, init = {}) {
  const url = new URL(input);
  try {
    const generated = path.join(ROOT, "src/generated");
    if (!fs.existsSync(path.join(generated, "settings.json"))) {
      fs.mkdirSync(generated, { recursive: true });
      const config = programContent();
      fs.writeFileSync(
        path.join(generated, "settings.json"),
        JSON.stringify({
          sheetId: config.SHEET_ID,
          api: config.APPS_SCRIPT_URL,
        }),
      );
    }
    const { legacyAction } = await import("../src/server/legacy-actions.ts");
    const result = await legacyAction(
      init.method === "POST"
        ? { method: "POST", body: String(init.body) }
        : { method: "GET", query: url.search.slice(1) },
    );
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error("Maintenance request failed; no source values are logged");
  }
}
