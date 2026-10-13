import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "@neondatabase/serverless";
import { neonLegacyGet, neonLegacyPost } from "../src/server/legacy-neon.ts";
const key = "DUMMY_ADMIN_KEY",
  device = "DUMMY_DEVICE";
const originalFetch = globalThis.fetch,
  originalConnect = Pool.prototype.connect;
const environment = {
  DATABASE_URL: process.env.DATABASE_URL,
  READ_KEY: process.env.READ_KEY,
};
process.env.DATABASE_URL = "postgresql://DUMMY:DUMMY@test.neon.tech/DUMMY";
process.env.READ_KEY = key;
let sheets = new Map(),
  snapshot,
  queries = 0;
function fixture(name, headers, rows = []) {
  sheets.set(name, { headers, rows, metadata: {}, revision: 1 });
}
function query(sql, params = []) {
  queries++;
  if (sql === "BEGIN") {
    snapshot = globalThis.structuredClone(sheets);
    return [];
  }
  if (sql === "ROLLBACK") {
    sheets = snapshot;
    return [];
  }
  if (
    sql === "COMMIT" ||
    sql.startsWith("SET LOCAL") ||
    sql.includes("pg_advisory_xact_lock")
  )
    return [];
  const tab = sheets.get(params[0]);
  if (sql.startsWith("SELECT headers,coalesce"))
    return tab
      ? [
          {
            headers: tab.headers,
            rows: tab.rows.map((cells, i) => [i + 1, cells]),
          },
        ]
      : [];
  if (sql.startsWith("SELECT headers,revision"))
    return tab ? [{ headers: tab.headers, revision: tab.revision }] : [];
  if (sql.startsWith("SELECT jsonb_build_array"))
    return (tab?.rows || [])
      .filter((row) => row[params[6]] === params[1])
      .map((row) => ({
        cells: [params[1], ...params.slice(2, 6).map((i) => row[i])],
      }));
  if (sql.includes("replace_sheet_table")) {
    fixture(params[0], JSON.parse(params[1]), JSON.parse(params[2]));
    return [{ result: { status: "ok" } }];
  }
  if (sql.startsWith("SELECT metadata->>"))
    return tab ? [{ verified: String(tab.metadata.sidVerified || false) }] : [];
  if (sql.startsWith("UPDATE sheet_tables SET metadata")) {
    tab.metadata.sidVerified = true;
    return [];
  }
  if (sql.includes("append_sheet_record")) {
    const cols = JSON.parse(params[1]);
    if (!tab)
      fixture(
        params[0],
        cols.map((pair) => pair[0]),
      );
    const table = sheets.get(params[0]);
    for (const [name] of cols)
      if (!table.headers.includes(name)) table.headers.push(name);
    table.rows.push(
      table.headers.map(
        (name) => cols.find((pair) => pair[0] === name)?.[1] || "",
      ),
    );
    return [{ result: { status: "ok" } }];
  }
  if (sql.includes("update_sheet_record")) {
    const row = tab.rows[params[1] - 1];
    for (const [name, value] of JSON.parse(params[2]))
      row[tab.headers.indexOf(name)] = value;
    return [];
  }
  if (sql.startsWith("SELECT name FROM sheet_tables"))
    return tab ? [{ name: params[0] }] : [];
  if (sql.startsWith("INSERT INTO sheet_tables")) {
    if (!tab) fixture(params[0], JSON.parse(params[1]));
    return [];
  }
  throw new Error("Unexpected mock query: " + sql);
}
Pool.prototype.connect = async function () {
  return {
    query: async (sql, params) => ({ rows: query(sql, params) }),
    release() {},
  };
};
globalThis.fetch = async (_url, init) => {
  const request = JSON.parse(init.body),
    result = query(request.query, request.params);
  const names = Object.keys(result[0] || {}),
    fields = names.map((name) => ({
      name,
      dataTypeID: typeof result[0][name] === "object" ? 3802 : 25,
    }));
  return new Response(
    JSON.stringify({
      fields,
      rows: result.map((row) =>
        names.map((name) =>
          typeof row[name] === "object"
            ? JSON.stringify(row[name])
            : String(row[name]),
        ),
      ),
      rowCount: result.length,
      command: "SELECT",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
test.after(() => {
  globalThis.fetch = originalFetch;
  Pool.prototype.connect = originalConnect;
  for (const [name, value] of Object.entries(environment))
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
});
test("new private operations deny missing credentials without contacting the database", async () => {
  const before = queries;
  assert.equal((await neonLegacyGet("sidStep", {})).status, "denied");
  assert.equal(
    (
      await neonLegacyPost({
        action: "deckRow",
        mas: "taanit",
        daf: "ב",
        val: "{}",
      })
    ).status,
    "denied",
  );
  assert.equal(
    (await neonLegacyGet("netroster", { netroster: "S1" })).status,
    "unknown",
  );
  assert.equal(queries, before);
});
test("network roster projection and attendance writes retain the approved school boundary", async () => {
  sheets = new Map();
  fixture("גישה", ["מזהה", "קוד ישיבה", "מצב"], [[device, "S1", "אושר"]]);
  fixture(
    "תלמידי הרשת",
    ["קוד ישיבה", "שכבה", "כיתה", "משפחה", "פרטי", "טלפון"],
    [
      ["S1", "ז", "1", "FAMILY", "FIRST", "PRIVATE_PHONE"],
      ["S1", "ט", "1", "OLD", "STUDENT", "PRIVATE_PHONE"],
      ["S2", "ז", "1", "OTHER", "SCHOOL", "PRIVATE_PHONE"],
    ],
  );
  const result = await neonLegacyGet("netroster", {
    netroster: "S1",
    dev: device,
  });
  assert.deepEqual(result.rows, [["ז", "1", "FAMILY FIRST"]]);
  assert.ok(!JSON.stringify(result).includes("PRIVATE_PHONE"));
  fixture(
    "עמדת לימוד",
    ["מזהה", "קוד ישיבה", "שם"],
    [["ROW", "S2", "OTHER SCHOOL"]],
  );
  const body = {
    action: "row",
    tab: "עמדת לימוד",
    dev: device,
    inst: "S1",
    cols: JSON.stringify([
      ["מזהה", "ROW"],
      ["שם", "FIRST"],
      ["קוד ישיבה", "S2"],
      ["טלפון", "PRIVATE_PHONE"],
    ]),
  };
  assert.equal((await neonLegacyPost(body)).status, "ok");
  assert.equal((await neonLegacyPost(body)).status, "ok");
  const table = sheets.get("עמדת לימוד");
  assert.deepEqual(table.rows, [
    ["ROW", "S2", "OTHER SCHOOL"],
    ["ROW", "S1", "FIRST"],
  ]);
  assert.ok(!table.headers.includes("טלפון"));
});
test("anchor saves compare the base before changing a single page", async () => {
  sheets = new Map();
  fixture(
    "מצגת",
    ["מסכת", "דף", "עוגנים"],
    [
      ["taanit", "ב", "OLD"],
      ["taanit", "ג", "OTHER"],
    ],
  );
  const request = {
    action: "deckRow",
    key,
    mas: "taanit",
    daf: "ב",
    base: "STALE",
    val: "NEW",
  };
  assert.equal((await neonLegacyPost(request)).status, "changed");
  assert.equal(sheets.get("מצגת").rows[0][2], "OLD");
  assert.equal(
    (await neonLegacyPost({ ...request, base: "OLD" })).status,
    "ok",
  );
  assert.deepEqual(sheets.get("מצגת").rows, [
    ["taanit", "ב", "NEW"],
    ["taanit", "ג", "OTHER"],
  ]);
});
test("stable ID migration backs up, acknowledges the polling protocol, and restores atomically", async () => {
  sheets = new Map();
  const headers = ["מסכת", "דף", "פירוש"],
    original = [["taanit", "ב", "OLD"]];
  fixture("פירוש", headers, globalThis.structuredClone(original));
  const request = {
    action: "sidStep",
    key,
    tab: "פירוש",
    rid: "REQUEST1",
    head: JSON.stringify(headers),
    base: JSON.stringify([headers, ...original]),
    plan: JSON.stringify([["taanit", "ב", "NEW"]]),
  };
  assert.equal((await neonLegacyPost(request)).status, "ok");
  assert.deepEqual(sheets.get("גיבוי מזהים · פירוש").rows, original);
  const state = await neonLegacyGet("sidStep", { key, sidStep: "1" });
  assert.equal(state.status, "ok");
  assert.equal(state.version, 60);
  assert.equal(state.sid.rid, "REQUEST1");
  assert.equal(state.sid.status, "ok");
  assert.equal(
    (await neonLegacyPost({ ...request, mode: "restore", rid: "REQUEST2" }))
      .status,
    "ok",
  );
  assert.deepEqual(sheets.get("פירוש").rows, original);
  const rejected = await neonLegacyPost({
    ...request,
    rid: "REQUEST3",
    plan: JSON.stringify([["megila", "ב", "BAD"]]),
  });
  assert.equal(rejected.status, "error");
  assert.deepEqual(sheets.get("פירוש").rows, original);
});
