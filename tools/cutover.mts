import { neon } from "@neondatabase/serverless";
import { scriptUrl } from "../src/server/operational-store.ts";
import { runCutover } from "./database-cutover.mts";
import { stableSnapshot } from "./source-snapshot.mts";
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--dry-run"))
  throw new Error("Usage: node tools/cutover.mts [--dry-run]");
async function main() {
  // The owner opts in by selecting the marker-driven backend; otherwise production stays on Sheets.
  if (process.env.HADAF_DATABASE_BACKEND !== "auto") {
    console.log(
      JSON.stringify({
        mode: "skipped",
        reason: "HADAF_DATABASE_BACKEND is not auto",
      }),
    );
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const dryRun = args.includes("--dry-run");
  if (!dryRun && process.env.HADAF_NOTIFICATION_DELIVERY !== "direct")
    throw new Error(
      "Neon notifications require HADAF_NOTIFICATION_DELIVERY=direct",
    );
  const result = await runCutover({
    sql: neon(process.env.DATABASE_URL),
    capture: () => stableSnapshot(scriptUrl()),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    dryRun,
  });
  // Counts and hashes only: never print rows, identities or credentials.
  console.log(JSON.stringify(result));
}
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  console.error(
    "Database cutover failed: " +
      (/^(Missing |Google refresh|Private source|Source |Call-center export|Target already imported|Write freeze expired|Imported (table|identity) counts|Applied migration changed|Neon notifications|DATABASE_URL)/.test(
        message,
      )
        ? message
        : "unexpected error") +
      ". Credentials and rows are withheld; the source remains authoritative unless activation committed.",
  );
  process.exitCode = 1;
});
