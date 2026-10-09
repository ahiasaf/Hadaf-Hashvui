import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { prepareSnapshot } from "../src/server/snapshot.ts";
import { splitSql, runtimeMigrations } from "../src/server/migrations.ts";
const args = process.argv.slice(2);
if (!args[0] || args.some((arg) => arg.startsWith("--") && arg !== "--apply"))
  throw new Error(
    "Usage: node tools/import-database.mts SNAPSHOT.json [--apply]",
  );
const { snapshot, people, aliases, progress, report } = prepareSnapshot(
  JSON.parse(await fs.readFile(args[0], "utf8")),
);
if (!args.includes("--apply")) {
  console.log(JSON.stringify({ mode: "dry-run", ...report }, null, 2));
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = neon(process.env.DATABASE_URL);
  const occupied =
    await sql`SELECT to_regclass('public.migration_runs') AS table_name`;
  if (occupied[0].table_name) {
    const imported =
      await sql`SELECT count(*)::int AS count FROM migration_runs`;
    if (imported[0].count)
      throw new Error("Target already imported; use a separate preview branch");
  }
  const schema = await fs.readFile(
    new URL("../backend/database/001-preview.sql", import.meta.url),
    "utf8",
  );
  const queries = splitSql(schema).map((query) => sql.query(query));
  for (const table of snapshot.tables) {
    const tableHash = report.sourceHash;
    queries.push(
      sql`INSERT INTO sheet_tables (name,headers,metadata,source_hash,captured_at) VALUES (${table.name},${JSON.stringify(table.rows[0] || [])}::jsonb,${JSON.stringify(table.metadata || {})}::jsonb,${tableHash},${snapshot.capturedAt})`,
    );
    const rows = table.rows
      .slice(1)
      .map((cells, index) => ({ ordinal: index + 1, cells }));
    if (rows.length)
      queries.push(
        sql`INSERT INTO sheet_rows (table_name,ordinal,cells) SELECT ${table.name}, ordinal, cells FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS r(ordinal integer,cells jsonb)`,
      );
  }
  const persons = [...people].map(([id, p]) => ({
    id,
    school_code: p["קוד ישיבה"] || "",
    role: p["תפקיד"] === "הורה" ? "dad" : "kid",
    first_name: p["שם"] || "",
    last_name: p["משפחה"] || "",
    phone: p["טלפון"] || "",
    grade: p["שכבה"] || "",
    class_name: p["כיתה"] || "",
    is_test: p["בדיקה"] === "כן",
    details: p,
  }));
  if (persons.length)
    queries.push(
      sql`INSERT INTO people SELECT * FROM jsonb_to_recordset(${JSON.stringify(persons)}::jsonb) AS r(id text,school_code text,role text,first_name text,last_name text,phone text,grade text,class_name text,is_test boolean,details jsonb)`,
    );
  if (aliases.size)
    queries.push(
      sql`INSERT INTO person_aliases SELECT * FROM jsonb_to_recordset(${JSON.stringify([...aliases].map(([alias_id, person_id]) => ({ alias_id, person_id })))}::jsonb) AS r(alias_id text,person_id text)`,
    );
  const events = progress.map((p) => ({
    source_row: p.ordinal,
    device_id: p.cells["מזהה"].trim(),
    track: p.cells["מסלול"],
    week: p.week,
    is_complete: p.complete,
    fraction: p.fraction,
    is_test: p.cells["בדיקה"] === "כן",
    details: p.cells,
  }));
  if (events.length)
    queries.push(
      sql`INSERT INTO progress_events SELECT * FROM jsonb_to_recordset(${JSON.stringify(events)}::jsonb) AS r(source_row integer,device_id text,track text,week integer,is_complete boolean,fraction double precision,is_test boolean,details jsonb)`,
    );
  queries.push(
    sql`INSERT INTO migration_runs (source_hash,captured_at,report) VALUES (${report.sourceHash},${snapshot.capturedAt},${JSON.stringify(report)}::jsonb)`,
  );
  queries.push(
    sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`,
  );
  for (const migration of await runtimeMigrations()) {
    queries.push(
      ...migration.statements.map((statement) => sql.query(statement)),
    );
    queries.push(
      sql`INSERT INTO schema_migrations(name,hash) VALUES (${migration.name},${migration.hash})`,
    );
  }
  await sql.transaction(queries);
  const counts =
    await sql`SELECT (SELECT count(*)::int FROM people) AS people,(SELECT count(*)::int FROM person_aliases) AS aliases,(SELECT count(*)::int FROM progress_events) AS progress`;
  if (
    counts[0].people !== report.people ||
    counts[0].aliases !== report.aliases ||
    counts[0].progress !== report.progress
  )
    throw new Error("Imported counts do not match");
  console.log(JSON.stringify({ mode: "imported", ...report }, null, 2));
}
