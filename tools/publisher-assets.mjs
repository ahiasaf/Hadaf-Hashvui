import fs from "node:fs/promises";
import path from "node:path";

// Apps Script and GitHub Contents use these source paths on main.
// Mirror them into Astro's ignored public input, keeping browser URLs unchanged.
export async function stagePublisherAssets(root = ".") {
  for (const name of ["slides", "audio"]) {
    const source = path.join(root, name);
    const target = path.join(root, "static", name);
    await fs.rm(target, { recursive: true, force: true });
    const exists = await fs.stat(source).catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (exists) await fs.cp(source, target, { recursive: true });
  }
}
