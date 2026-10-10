import { neon, Pool } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";
import { publicTabs, validatePublicRows } from "./public-schema.ts";
import { compilePredicate, csvText, parsePublicQuery } from "./public-query.ts";
export type BackendState = "legacy" | "frozen" | "neon";
export class WritesPaused extends Error {
  constructor() {
    super("Writes are paused for the database migration");
  }
}
let resolved: { state: BackendState; expires: number } | undefined;
export function resetBackendState() {
  resolved = undefined;
}
// The cutover marker is the only production switch. Activation is one-way, so it stays cached.
export async function readCutoverState(): Promise<BackendState> {
  try {
    const rows =
      await database()`SELECT state,frozen_until>now() AS freezing FROM cutover_state WHERE id`;
    if (rows[0]?.state === "active") return "neon";
    return rows[0]?.state === "frozen" && rows[0].freezing
      ? "frozen"
      : "legacy";
  } catch (error) {
    // Only a database that has never been prepared for cutover means "not migrated".
    if ((error as { code?: string }).code === "42P01") return "legacy";
    throw error;
  }
}
export async function backendState(
  read = readCutoverState,
): Promise<BackendState> {
  const mode = process.env.HADAF_DATABASE_BACKEND;
  if (mode === "neon") return "neon";
  if (mode !== "auto" || !process.env.DATABASE_URL) return "legacy";
  if (resolved && resolved.expires > Date.now()) return resolved.state;
  // A failed marker read fails the request: falling back could write to the retired source.
  const state = await read();
  resolved = {
    state,
    expires: state === "neon" ? Infinity : Date.now() + 15000,
  };
  return state;
}
export async function databaseEnabled() {
  return (await backendState()) === "neon";
}
export async function requireWritable() {
  if ((await backendState()) === "frozen") throw new WritesPaused();
}
export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database configuration missing");
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(8000) } });
}
export type Query = (
  text: string,
  parameters?: unknown[],
) => Promise<Record<string, unknown>[]>;
// Read-modify-write operations hold one advisory lock, matching the Apps Script script lock.
export async function withTransaction<T>(work: (query: Query) => Promise<T>) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database configuration missing");
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = 20000");
    await client.query("SELECT pg_advisory_xact_lock(1736901330)");
    const result = await work(
      async (text, parameters = []) =>
        (await client.query(text, parameters)).rows,
    );
    await client.query("COMMIT");
    invalidateDatabaseCache();
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
export function authorized(
  value: string | undefined,
  secret: string | undefined,
) {
  if (!value || !secret) return false;
  const left = Buffer.from(value),
    right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function stringRows(value: unknown): string[][] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (row) =>
        Array.isArray(row) && row.every((cell) => typeof cell === "string"),
    )
  )
    throw new Error("Invalid database rows");
  return value;
}
export function stringRecord(value: unknown): Record<string, string> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.values(value).some((value) => typeof value !== "string")
  )
    throw new Error("Invalid database record");
  return value as Record<string, string>;
}
const publicCache = new Map<string, { expires: number; text: string }>();
const inflight = new Map<string, Promise<string>>();
let cacheGeneration = 0;
export function invalidateDatabaseCache() {
  cacheGeneration++;
  publicCache.clear();
  inflight.clear();
}
export async function readDatabaseSheet(
  tab: string,
  query = "",
  fresh = false,
) {
  if (!publicTabs.has(tab)) throw new Error("Not a public table");
  const parsed = parsePublicQuery(query);
  const key = tab + "|" + query;
  const cached = publicCache.get(key);
  if (!fresh && cached && cached.expires > Date.now()) return cached.text;
  if (!fresh && inflight.has(key)) return inflight.get(key)!;
  const generation = cacheGeneration;
  const task = (async () => {
    const sql = database();
    const parameters = [tab];
    const where = compilePredicate(parsed.predicate, parameters);
    const result = await sql.query(
      `SELECT headers,(SELECT coalesce(jsonb_agg(cells ORDER BY ordinal),'[]'::jsonb) FROM public_sheet_rows WHERE table_name=$1 AND ${where}) AS rows FROM public_sheet_headers WHERE name=$1`,
      parameters,
    );
    if (!result.length) throw new Error("Database table unavailable");
    let rows = stringRows([result[0].headers, ...stringRows(result[0].rows)]);
    validatePublicRows(tab, rows);
    if (parsed.columns) {
      const columns = parsed.columns;
      if (columns.some((column) => column >= rows[0].length))
        throw new Error("Unknown column");
      rows = rows.map((row) => columns.map((column) => row[column] || ""));
    }
    const text = csvText(rows);
    // Cache approved public content only. Private reads and all writes bypass this cache.
    if (generation === cacheGeneration && text.length < 2000000) {
      if (publicCache.size >= 32)
        publicCache.delete(publicCache.keys().next().value!);
      publicCache.set(key, {
        expires:
          Date.now() +
          (["מונים", "מוני-לימוד", "דפים פתוחים"].includes(tab) ? 5000 : 60000),
        text,
      });
    }
    return text;
  })();
  if (!fresh) inflight.set(key, task);
  try {
    return await task;
  } finally {
    if (inflight.get(key) === task) inflight.delete(key);
  }
}
export async function readDatabaseTable(tab: string) {
  if (!tab || tab.length > 100) throw new Error("Invalid table");
  const result =
    await database()`SELECT headers,(SELECT coalesce(jsonb_agg(cells ORDER BY ordinal),'[]'::jsonb) FROM sheet_rows WHERE table_name=${tab}) AS rows FROM sheet_tables WHERE name=${tab}`;
  if (!result.length) throw new Error("Database table unavailable");
  const headers = stringRows([result[0].headers])[0];
  return headers.length
    ? [headers, ...stringRows(result[0].rows)]
    : stringRows(result[0].rows);
}
export async function appendDatabaseRecord(
  tab: string,
  cols: [string, string][],
) {
  const result =
    await database()`SELECT append_sheet_record(${tab},${JSON.stringify(cols)}::jsonb) AS result`;
  invalidateDatabaseCache();
  return result[0].result as unknown;
}
