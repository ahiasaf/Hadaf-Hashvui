import type { NeonQueryFunction } from "@neondatabase/serverless";
import { prepareSnapshot } from "../src/server/snapshot.ts";
import { runtimeMigrations } from "../src/server/migrations.ts";
import {
  applyPendingMigrations,
  expectedCounts,
  importQueries,
  refuseImportedTarget,
} from "./database-import.mts";
type Sql = NeonQueryFunction<false, false>;
export type CutoverOptions = {
  sql: Sql;
  // Must return a stable, read-only source snapshot.
  capture: () => Promise<unknown>;
  wait: (ms: number) => Promise<void>;
  dryRun: boolean;
  // Covers the runtime marker cache (15 s) and the longest API request (60 s).
  graceMs?: number;
  freezeMinutes?: number;
};
async function markerState(sql: Sql) {
  const table = await sql`SELECT to_regclass('public.cutover_state') AS name`;
  if (!table[0].name) return "";
  const rows = await sql`SELECT state FROM cutover_state WHERE id`;
  return String(rows[0]?.state || "");
}
async function pendingMigrations(sql: Sql) {
  const table =
    await sql`SELECT to_regclass('public.schema_migrations') AS name`;
  const applied = table[0].name
    ? (await sql`SELECT name FROM schema_migrations`).map((row) => row.name)
    : [];
  return (await runtimeMigrations())
    .map(({ name }) => name)
    .filter((name) => !applied.includes(name));
}
// Idempotent production cutover: import once behind a short write freeze, otherwise only migrate.
export async function runCutover(options: CutoverOptions) {
  const { sql, dryRun } = options;
  if ((await markerState(sql)) === "active") {
    if (dryRun)
      return {
        mode: "dry-run",
        active: true,
        pending: await pendingMigrations(sql),
      };
    return { mode: "migrated", applied: await applyPendingMigrations(sql) };
  }
  // An import without a marker was made by hand; never overwrite or activate it automatically.
  await refuseImportedTarget(sql);
  if (dryRun) {
    const prepared = prepareSnapshot(await options.capture());
    return {
      mode: "dry-run",
      active: false,
      ...expectedCounts(prepared),
      sourceHash: prepared.report.sourceHash,
    };
  }
  await sql`CREATE TABLE IF NOT EXISTS cutover_state (id boolean PRIMARY KEY DEFAULT true CHECK (id), state text NOT NULL CHECK (state IN ('frozen','active')), frozen_until timestamptz, activated_at timestamptz, source_hash text, report jsonb)`;
  const minutes = options.freezeMinutes ?? 20;
  await sql`INSERT INTO cutover_state(id,state,frozen_until) VALUES(true,'frozen',now()+make_interval(mins=>${minutes})) ON CONFLICT(id) DO UPDATE SET state='frozen',frozen_until=EXCLUDED.frozen_until WHERE cutover_state.state<>'active'`;
  try {
    // Requests that started before the freeze finish against the source before the snapshot.
    await options.wait(options.graceMs ?? 90000);
    const prepared = prepareSnapshot(await options.capture());
    const queries = await importQueries(sql, prepared);
    // Activation commits with the import; an expired freeze means writes may have resumed, so abort.
    queries.push(
      sql`SELECT require_condition((SELECT frozen_until>now() FROM cutover_state WHERE id AND state='frozen'),'Write freeze expired before activation')`,
      sql`UPDATE cutover_state SET state='active',activated_at=now(),frozen_until=NULL,source_hash=${prepared.report.sourceHash},report=${JSON.stringify(prepared.report)}::jsonb WHERE id`,
    );
    await sql.transaction(queries);
    return {
      mode: "activated",
      ...expectedCounts(prepared),
      sourceHash: prepared.report.sourceHash,
    };
  } catch (error) {
    // Releasing the freeze returns traffic to the unchanged source; the import rolled back.
    await sql`DELETE FROM cutover_state WHERE id AND state='frozen'`;
    throw error;
  }
}
