import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { prepareSnapshot } from "../src/server/snapshot.ts";
import { importQueries, refuseImportedTarget } from "./database-import.mts";
const args = process.argv.slice(2);
if (!args[0] || args.some((arg) => arg.startsWith("--") && arg !== "--apply"))
  throw new Error(
    "Usage: node tools/import-database.mts SNAPSHOT.json [--apply]",
  );
const prepared = prepareSnapshot(
  JSON.parse(await fs.readFile(args[0], "utf8")),
);
if (!args.includes("--apply")) {
  console.log(JSON.stringify({ mode: "dry-run", ...prepared.report }, null, 2));
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = neon(process.env.DATABASE_URL);
  await refuseImportedTarget(sql);
  await sql.transaction(await importQueries(sql, prepared));
  console.log(
    JSON.stringify({ mode: "imported", ...prepared.report }, null, 2),
  );
}
