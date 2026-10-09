import { neon } from "@neondatabase/serverless";
import { runtimeMigrations } from "../src/server/migrations.ts";
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply"))
  throw new Error("Usage: node tools/migrate-database.mts [--apply]");
const migrations = await runtimeMigrations();
if (!args.includes("--apply")) {
  console.log(
    JSON.stringify({
      mode: "dry-run",
      migrations: migrations.map(({ name, statements }) => ({
        name,
        statements: statements.length,
      })),
    }),
  );
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = neon(process.env.DATABASE_URL);
  const ready = await sql`SELECT to_regclass('public.migration_runs') AS name`;
  if (!ready[0].name) throw new Error("Import a verified snapshot first");
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  const applied = await sql`SELECT name,hash FROM schema_migrations`;
  const pending = migrations.filter((migration) => {
    const previous = applied.find((row) => row.name === migration.name);
    if (previous && previous.hash !== migration.hash)
      throw new Error("Applied migration changed; add a new migration instead");
    return !previous;
  });
  if (pending.length)
    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(1736901321)`,
      ...pending.flatMap((migration) => [
        ...migration.statements.map((statement) => sql.query(statement)),
        sql`INSERT INTO schema_migrations(name,hash) VALUES (${migration.name},${migration.hash})`,
      ]),
    ]);
  console.log(
    JSON.stringify({
      mode: "migrated",
      applied: pending.map(({ name }) => name),
    }),
  );
}
