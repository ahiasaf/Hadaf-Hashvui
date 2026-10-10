import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { required, stableSnapshot } from "./source-snapshot.mts";

async function main() {
  const response = await fetch(
    "https://api.github.com/repos/ahiasaf/Hadaf-Hashvui/contents/data.js?ref=main",
    {
      headers: {
        Authorization: "Bearer " + required("GITHUB_TOKEN"),
        Accept: "application/vnd.github.raw+json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error("Main configuration unavailable");
  const source = await response.text();
  const api = /APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/.exec(source)?.[1];
  if (!api) throw new Error("Main source API unavailable");
  const data = await stableSnapshot(api);
  const snapshot = Buffer.from(JSON.stringify(data));
  const key = Buffer.from(required("MIGRATION_EXPORT_KEY"), "hex");
  if (key.length !== 32) throw new Error("Invalid export encryption key");
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(snapshot), cipher.final()]);
  await writeFile(
    "database-export.enc",
    Buffer.concat([
      Buffer.from("HADF1"),
      nonce,
      cipher.getAuthTag(),
      encrypted,
    ]),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      tables: data.tables.length,
      rows: data.tables.reduce(
        (n, table) => n + Math.max(0, table.rows.length - 1),
        0,
      ),
      sourceHash: createHash("sha256").update(snapshot).digest("hex"),
      stable: true,
      encrypted: true,
    }),
  );
}
main().catch((error: unknown) => {
  const message =
    error instanceof Error &&
    /^(Service request failed:|Missing |Google refresh|Private source|Source changed|Main configuration|Main source|Source metadata|Call-center export|Invalid export encryption)/.test(
      error.message,
    )
      ? error.message
      : "Invalid source response";
  console.error(
    "Database export failed: " +
      message +
      ". Credentials and rows are withheld.",
  );
  process.exitCode = 1;
});
