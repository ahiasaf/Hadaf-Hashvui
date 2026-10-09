import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import {
  readPublicSheet,
  requestNotification,
  sheetUrl,
} from "../src/server/upstream.ts";
const code = await fs.readFile("src/shared/net.js", "utf8");
test("management institution loading rejects lesson-tab fallback while allowing a new school beside known codes", async () => {
  const source = await fs.readFile(
    "src/features/management/entry-21-14-bulkImportClose.js",
    "utf8",
  );
  const context = {
    INST_BUILTIN: [{ code: "alpha" }, { code: "beta" }],
    YES: /^(true|1|כן)$/i,
    trackById: () => null,
  };
  vm.runInNewContext(
    source.slice(
      source.indexOf("function instFromRows"),
      source.indexOf("function loadInstitutions"),
    ),
    context,
  );
  assert.equal(
    context.instFromRows([
      ["מסכת", "דף"],
      ["taanit", "ב"],
      ["megila", "ב"],
    ]).ok,
    false,
  );
  assert.equal(
    context.instFromRows([
      ["code", "name"],
      ["alpha", "Example A"],
      ["new", "Example B"],
    ]).ok,
    true,
  );
});
test("management private reads share in-flight requests without retaining results or URL credentials", async () => {
  const source = await fs.readFile(
    "src/features/management/entry-21-08-quizWho.js",
    "utf8",
  );
  const legacy = source.slice(
    source.indexOf("var legacyReadsPending"),
    source.indexOf("function callSay"),
  );
  let calls = 0;
  const context = {
    CFG: {},
    API: "https://script.invalid/exec",
    APPS_SCRIPT_URL: "https://script.invalid/exec",
    AbortSignal,
    Promise,
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, "/api/action");
      assert.equal(options.cache, "no-store");
      assert.equal(JSON.parse(options.body).payload.key, "TEST");
      return new Response(
        JSON.stringify({ status: "ok", rows: [["Example"]] }),
      );
    },
    pingScript: () => {
      throw new Error("Private credentials must not use JSONP");
    },
  };
  vm.runInNewContext(legacy, context);
  const [first, second] = await Promise.all([
    context.scriptGet({ read: "לומדים", key: "TEST" }),
    context.scriptGet({ key: "TEST", read: "לומדים" }),
  ]);
  assert.equal(calls, 1);
  first.rows[0][0] = "Changed";
  assert.equal(second.rows[0][0], "Example");
  await context.scriptGet({ read: "לומדים", key: "TEST" });
  assert.equal(calls, 2);
  assert.equal(Object.keys(context.legacyReadsPending).length, 0);
});
function client(fetcher) {
  const window = {
    fetch: fetcher,
    location: { origin: "https://test.invalid" },
    DF_SHEET_ID: "PUBLIC",
    DF_PUBLIC_TABS: ["מוסדות"],
  };
  window.parent = window;
  vm.runInNewContext(code, {
    window,
    URL,
    Response,
    Promise,
    Date,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return window;
}
test("concurrent reads share one request while each body can be consumed", async () => {
  let calls = 0;
  const window = client(async () => {
    calls++;
    return new Response("code,name,last,joined\na,Example,true,true");
  });
  const url =
    "https://docs.google.com/spreadsheets/d/PUBLIC/gviz/tq?tqx=out:csv&sheet=" +
    encodeURIComponent("מוסדות");
  const responses = await Promise.all([
    window.fetch(url + "&t=1"),
    window.fetch(url + "&t=2"),
  ]);
  const values = await Promise.all(
    responses.map((response) => response.text()),
  );
  assert.equal(calls, 1);
  assert.equal(values[0], values[1]);
  await window.fetch(url + "&t=3");
  assert.equal(calls, 1);
});
test("failed responses are retried, not cached as empty data", async () => {
  let calls = 0;
  const window = client(
    async () => new Response("", { status: ++calls === 1 ? 502 : 200 }),
  );
  const url = "/api/sheets?tab=public";
  assert.equal((await window.fetch(url)).status, 502);
  assert.equal((await window.fetch(url)).status, 200);
  assert.equal(calls, 2);
});
test("writes invalidate public cached reads before verification", async () => {
  let calls = 0;
  const window = client(async () => {
    calls++;
    return new Response("ok");
  });
  await window.fetch("/api/sheets?tab=public");
  await window.fetch("/write", {
    method: "POST",
    body: JSON.stringify({ tab: "public" }),
  });
  await window.fetch("/api/sheets?tab=public");
  assert.equal(calls, 3);
});
test("CSV preserves quoted commas, newline fields, empty tables and BOM", () => {
  const window = client(fetch);
  assert.equal(
    JSON.stringify(
      window.DFNet.csv('\uFEFFcode,name\na,"One, Two"\nb,"Three\nFour"'),
    ),
    JSON.stringify([
      ["code", "name"],
      ["a", "One, Two"],
      ["b", "Three\nFour"],
    ]),
  );
  assert.equal(
    JSON.stringify(window.DFNet.csv("code,name")),
    JSON.stringify([["code", "name"]]),
  );
});
test("private tabs never enter the public proxy", () => {
  assert.throws(() => sheetUrl("לומדים"));
});
test("upstream login pages and failed reads remain errors", async () => {
  await assert.rejects(
    readPublicSheet(
      "מוסדות",
      "",
      "",
      async () => new Response("<html>login</html>"),
    ),
  );
  await assert.rejects(
    readPublicSheet(
      "מוסדות",
      "",
      "",
      async () => new Response("", { status: 500 }),
    ),
  );
});
const payload = {
  action: "row",
  tab: "ממתינים לדף",
  cols: JSON.stringify([
    ["דף", "taanit|ג"],
    ["מזהה", "TEST"],
    ["שם", ""],
    ["ישיבה", ""],
    ["מכשיר", ""],
    [
      "מנוי",
      JSON.stringify({
        endpoint: "https://push.invalid/subscription",
        keys: { auth: "TEST", p256dh: "TEST" },
      }),
    ],
    ["מתי", "2026-10-08"],
  ]),
};
test("notification success requires an explicit upstream acknowledgement", async () => {
  await assert.rejects(
    requestNotification(
      payload,
      async () => new Response(JSON.stringify({ status: "denied" })),
    ),
  );
  await assert.rejects(
    requestNotification(payload, async () => {
      throw new Error("offline");
    }),
  );
  assert.deepEqual(
    await requestNotification(
      payload,
      async () => new Response(JSON.stringify({ status: "ok" })),
    ),
    { status: "ok" },
  );
});
test("notification proxy cannot write to other tabs or use admin credentials", async () => {
  await assert.rejects(requestNotification({ ...payload, tab: "לומדים" }));
  await assert.rejects(requestNotification({ ...payload, key: "TEST" }));
});

test("a missing Google tab falling back to contact data is never forwarded", async () => {
  await assert.rejects(
    readPublicSheet(
      "מוסדות",
      "",
      "",
      async () =>
        new Response(
          "תאריך,ישיבה,קוד,איש קשר,טלפון\nDATE,SCHOOL,CODE,NAME,PHONE",
        ),
    ),
  );
  await assert.rejects(
    readPublicSheet(
      "מוסדות",
      "",
      "",
      async () => new Response("other,columns\nA,B"),
    ),
  );
  assert.equal(
    await readPublicSheet(
      "מוסדות",
      "",
      "",
      async () => new Response("code,name,last,joined"),
    ),
    "code,name,last,joined",
  );
});
