import fs from "node:fs/promises";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { prepareSnapshot } from "../src/server/snapshot.ts";
import { splitSql, runtimeMigrations } from "../src/server/migrations.ts";
type Sql = NeonQueryFunction<false, false>;
type Prepared = ReturnType<typeof prepareSnapshot>;
// Expected stored row counts per table, used to verify an import inside its own transaction.
export function expectedCounts(prepared: Prepared) {
  return {
    tables: Object.fromEntries(
      prepared.snapshot.tables
        .filter((table) => table.rows.length > 1)
        .map((table) => [table.name, table.rows.length - 1]),
    ),
    people: prepared.report.people,
    aliases: prepared.report.aliases,
    progress: prepared.report.progress,
  };
}
export async function refuseImportedTarget(sql: Sql) {
  const occupied =
    await sql`SELECT to_regclass('public.migration_runs') AS table_name`;
  if (!occupied[0].table_name) return;
  const imported = await sql`SELECT count(*)::int AS count FROM migration_runs`;
  if (imported[0].count)
    throw new Error("Target already imported; use a separate database branch");
}
// Builds one atomic import: schema, rows, normalized records, runtime migrations and count checks.
export async function importQueries(sql: Sql, prepared: Prepared) {
  const { snapshot, people, aliases, progress, report } = prepared;
  const schema = await fs.readFile(
    new URL("../backend/database/001-preview.sql", import.meta.url),
    "utf8",
  );
  const queries = splitSql(schema).map((query) => sql.query(query));
  for (const table of snapshot.tables) {
    queries.push(
      sql`INSERT INTO sheet_tables (name,headers,metadata,source_hash,captured_at) VALUES (${table.name},${JSON.stringify(table.rows[0] || [])}::jsonb,${JSON.stringify(table.metadata || {})}::jsonb,${report.sourceHash},${snapshot.capturedAt})`,
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
  const expected = expectedCounts(prepared);
  // Any mismatch raises inside the transaction, so a partial import can never commit.
  queries.push(
    sql`SELECT require_condition((SELECT coalesce(jsonb_object_agg(table_name,n),'{}'::jsonb) FROM (SELECT table_name,count(*)::int AS n FROM sheet_rows GROUP BY table_name) c)=${JSON.stringify(expected.tables)}::jsonb,'Imported table counts do not match')`,
    sql`SELECT require_condition((SELECT count(*) FROM people)=${expected.people} AND (SELECT count(*) FROM person_aliases)=${expected.aliases} AND (SELECT count(*) FROM progress_events)=${expected.progress},'Imported identity counts do not match')`,
  );
  return queries;
}
// Applies only migrations not yet recorded, atomically under a transaction lock.
export async function applyPendingMigrations(sql: Sql) {
  const ready = await sql`SELECT to_regclass('public.migration_runs') AS name`;
  if (!ready[0].name) throw new Error("Import a verified snapshot first");
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  const applied = await sql`SELECT name,hash FROM schema_migrations`;
  const pending = (await runtimeMigrations()).filter((migration) => {
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
  return pending.map(({ name }) => name);
}
