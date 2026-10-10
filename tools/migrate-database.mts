import { neon } from "@neondatabase/serverless";
import { runtimeMigrations } from "../src/server/migrations.ts";
import { applyPendingMigrations } from "./database-import.mts";
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply"))
  throw new Error("Usage: node tools/migrate-database.mts [--apply]");
if (!args.includes("--apply")) {
  console.log(
    JSON.stringify({
      mode: "dry-run",
      migrations: (await runtimeMigrations()).map(({ name, statements }) => ({
        name,
        statements: statements.length,
      })),
    }),
  );
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const applied = await applyPendingMigrations(neon(process.env.DATABASE_URL));
  console.log(JSON.stringify({ mode: "migrated", applied }));
}
