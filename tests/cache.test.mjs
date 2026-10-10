import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { parseCsv } from "../src/lib/csv.ts";
const source = ts.transpileModule(
  await fs.readFile("src/lib/client.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function storage() {
  const store = {};
  Object.defineProperties(store, {
    getItem: { value: (key) => store[key] ?? null },
    setItem: {
      value: (key, value) => {
        store[key] = value;
      },
    },
    removeItem: {
      value: (key) => {
        delete store[key];
      },
    },
  });
  return store;
}
function environment(request) {
  const exports = {};
  const sessionStorage = storage(),
    localStorage = storage();
  const context = {
    exports,
    require: () => ({ parseCsv }),
    sessionStorage,
    localStorage,
    fetch: request,
    AbortSignal,
    URLSearchParams,
    Date,
    Map,
    Set,
  };
  vm.runInNewContext(source, context);
  return {
    api: exports,
    sessionStorage,
    localStorage,
    reload: () => {
      const next = {};
      vm.runInNewContext(source, { ...context, exports: next });
      return next;
    },
  };
}
test("public reads deduplicate and survive navigation without another database call", async () => {
  let calls = 0;
  const env = environment(async () => {
    calls++;
    return new Response("key,value\nA,B");
  });
  const rows = await Promise.all([
    env.api.sheet("טקסטים"),
    env.api.sheet("טקסטים"),
  ]);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(rows[0]), JSON.stringify(rows[1]));
  await env.reload().sheet("טקסטים");
  assert.equal(calls, 1);
  await env.api.sheet("טקסטים", true);
  assert.equal(calls, 2);
});
test("successful writes invalidate public caches while private data never enters them", async () => {
  let calls = 0;
  const env = environment(async (_url, options) => {
    calls++;
    return options.method === "POST"
      ? Response.json({ status: "ok", students: ["PRIVATE"] })
      : new Response("key,value\nA,B");
  });
  await assert.rejects(env.api.sheet("לומדים"));
  assert.equal(calls, 0);
  await env.api.sheet("טקסטים");
  await env.api.action("read", { board: "TEST", k: "TEST" });
  assert.ok(!JSON.stringify(env.sessionStorage).includes("PRIVATE"));
  assert.ok(!JSON.stringify(env.localStorage).includes("PRIVATE"));
  await env.api.action("write", { action: "table", key: "TEST" });
  assert.equal(
    Object.keys(env.localStorage).filter((key) => key.startsWith("df:public:"))
      .length,
    0,
  );
  await env.reload().sheet("טקסטים");
  assert.equal(calls, 4);
});
test("expired and failed responses cause a fresh read instead of retaining an empty lesson", async () => {
  let calls = 0;
  const env = environment(
    async () =>
      new Response("key,value", { status: ++calls === 1 ? 502 : 200 }),
  );
  await assert.rejects(env.api.sheet("סימוני הדף"));
  await env.api.sheet("סימוני הדף");
  const key = Object.keys(env.localStorage)[0];
  const value = JSON.parse(env.localStorage[key]);
  value.at = 0;
  env.localStorage[key] = JSON.stringify(value);
  await env.reload().sheet("סימוני הדף");
  assert.equal(calls, 3);
});
test("a stale device copy answers instantly and one background read refreshes it", async () => {
  let calls = 0,
    release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const env = environment(async () => {
    calls++;
    if (calls > 1) await gate;
    return new Response("key,value\nA," + (calls === 1 ? "OLD" : "NEW"));
  });
  await env.api.sheet("טקסטים");
  const key = "df:public:טקסטים|";
  const value = JSON.parse(env.localStorage[key]);
  value.at = Date.now() - 600000;
  env.localStorage[key] = JSON.stringify(value);
  const next = env.reload();
  const [first, second] = await Promise.all([
    next.sheet("טקסטים"),
    next.sheet("טקסטים"),
  ]);
  assert.equal(first[1][1], "OLD");
  assert.equal(second[1][1], "OLD");
  assert.equal(calls, 2);
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(JSON.parse(env.localStorage[key]).value[1][1], "NEW");
});
test("own progress lookups are revalidated from the device while staff reads are never stored", async () => {
  let calls = 0;
  const env = environment(async (_url, options) => {
    calls++;
    const payload = JSON.parse(options.body).payload;
    return Response.json(
      payload.idFor
        ? { status: "ok", id: "CANONICAL", learned: ["taanit|" + calls] }
        : { status: "ok", students: ["PRIVATE"] },
    );
  });
  const first = await env.api.action("read", { idFor: "DEVICE" });
  assert.equal(JSON.stringify(first.learned), '["taanit|1"]');
  const second = await env.reload().action("read", { idFor: "DEVICE" });
  assert.equal(JSON.stringify(second.learned), '["taanit|1"]');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls, 2);
  assert.match(env.localStorage["df:own:idFor:DEVICE"], /taanit\|2/);
  await env.api.action("read", { board: "*", key: "TEST" });
  assert.ok(!JSON.stringify(env.localStorage).includes("PRIVATE"));
});

test("private reads share only in-flight work, separate credentials and return independent values", async () => {
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const env = environment(async (_url, options) => {
    calls++;
    assert.equal(options.cache, "no-store");
    await gate;
    return Response.json({ status: "ok", students: [{ first: "Example" }] });
  });
  const first = env.api.action("read", { board: "TEST", k: "A" });
  const second = env.api.action("read", { k: "A", board: "TEST" });
  const other = env.api.action("read", { board: "TEST", k: "B" });
  assert.equal(calls, 2);
  release();
  const results = await Promise.all([first, second, other]);
  results[0].students[0].first = "Changed";
  assert.equal(results[1].students[0].first, "Example");
  await env.api.action("read", { board: "TEST", k: "A" });
  assert.equal(calls, 3);
  assert.equal(Object.keys(env.sessionStorage).length, 0);
  assert.equal(Object.keys(env.localStorage).length, 0);
});

test("an older pending read cannot restore a cache invalidated by a save", async () => {
  let release;
  let reads = 0;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const env = environment(async (_url, options) => {
    if (options.method === "POST") return Response.json({ status: "ok" });
    reads++;
    if (reads === 1) {
      await gate;
      return new Response("key,value\nA,OLD");
    }
    return new Response("key,value\nA,NEW");
  });
  const oldRead = env.api.sheet("טקסטים");
  await env.api.action("write", { action: "table", key: "TEST" });
  release();
  await oldRead;
  assert.equal(
    Object.keys(env.localStorage).filter((key) => key.startsWith("df:public:"))
      .length,
    0,
  );
  const current = await env.api.sheet("טקסטים");
  assert.equal(current[1][1], "NEW");
  assert.equal(reads, 2);
});
