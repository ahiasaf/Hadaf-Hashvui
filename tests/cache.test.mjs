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
function environment(request) {
  const exports = {};
  const sessionStorage = {};
  Object.defineProperties(sessionStorage, {
    getItem: { value: (key) => sessionStorage[key] ?? null },
    setItem: {
      value: (key, value) => {
        sessionStorage[key] = value;
      },
    },
    removeItem: {
      value: (key) => {
        delete sessionStorage[key];
      },
    },
  });
  const context = {
    exports,
    require: () => ({ parseCsv }),
    sessionStorage,
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
  await env.api.action("write", { action: "table", key: "TEST" });
  assert.equal(
    Object.keys(env.sessionStorage).filter((key) =>
      key.startsWith("df:public:"),
    ).length,
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
  const key = Object.keys(env.sessionStorage)[0];
  const value = JSON.parse(env.sessionStorage[key]);
  value.expires = 0;
  env.sessionStorage[key] = JSON.stringify(value);
  await env.reload().sheet("סימוני הדף");
  assert.equal(calls, 3);
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
});
