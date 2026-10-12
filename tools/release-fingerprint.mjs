import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// Stable across identical builds, changed by any served screen or script update.
export async function releaseFingerprint(directory, worker) {
  const hash = createHash("sha256").update(worker);
  const files = (await fs.readdir(directory, { recursive: true }))
    .filter((file) => file !== "sw.js" && /\.(html|js|css)$/.test(file))
    .sort();
  for (const file of files) {
    hash.update(file).update(await fs.readFile(path.join(directory, file)));
  }
  return hash.digest("hex").slice(0, 12);
}
