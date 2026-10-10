import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { webcrypto as crypto } from "node:crypto";
import settings from "../src/generated/settings.json" with { type: "json" };
import {
  backendState,
  resetBackendState,
  WritesPaused,
} from "../src/server/database.ts";
import { legacyAction } from "../src/server/legacy-actions.ts";

function environment(values) {
  for (const name of ["HADAF_DATABASE_BACKEND", "DATABASE_URL"])
    if (values[name] === undefined) delete process.env[name];
    else process.env[name] = values[name];
  resetBackendState();
}

test("production follows the cutover marker and caches only the one-way activation", async () => {
  environment({});
  assert.equal(
    await backendState(() => assert.fail("no marker read without opt-in")),
    "legacy",
  );
  environment({ HADAF_DATABASE_BACKEND: "neon" });
  assert.equal(await backendState(), "neon");
  environment({
    HADAF_DATABASE_BACKEND: "auto",
    DATABASE_URL: "postgres://user:pass@db.invalid/test",
  });
  let reads = 0;
  const legacy = async () => {
    reads++;
    return "legacy";
  };
  assert.equal(await backendState(legacy), "legacy");
  assert.equal(await backendState(legacy), "legacy");
  assert.equal(reads, 1);
  resetBackendState();
  await assert.rejects(
    backendState(async () => {
      throw new Error("offline");
    }),
  );
  resetBackendState();
  assert.equal(await backendState(async () => "neon"), "neon");
  assert.equal(
    await backendState(() => assert.fail("activation stays cached")),
    "neon",
  );
  environment({});
});

test("before cutover legacy calls reach Apps Script unchanged and without server credentials", async () => {
  environment({});
  process.env.READ_KEY = "SERVER_SECRET";
  const seen = [];
  const request = async (url, init = {}) => {
    seen.push({ url: String(url), init });
    return Response.json({ status: "denied" });
  };
  const result = await legacyAction(
    { method: "GET", query: "pairok=A&wk=taanit%7C2&yes=1&cb=__x" },
    request,
  );
  assert.equal(result.status, "denied");
  const forwarded = new URL(seen[0].url);
  assert.equal(forwarded.origin + forwarded.pathname, settings.api);
  assert.equal(forwarded.searchParams.get("wk"), "taanit|2");
  assert.equal(forwarded.searchParams.has("cb"), false);
  assert.ok(!seen[0].url.includes("SERVER_SECRET"));
  const body = JSON.stringify({ action: "quiz", cols: "[]" });
  await legacyAction({ method: "POST", body }, request);
  assert.equal(seen[1].init.method, "POST");
  assert.equal(seen[1].init.body, body);
  await assert.rejects(
    legacyAction({ method: "GET", query: "file=ID" }, request),
  );
  await assert.rejects(legacyAction({ method: "PUT", body }, request));
  delete process.env.READ_KEY;
});

test("during the write freeze reads continue and every write is refused", async () => {
  environment({
    HADAF_DATABASE_BACKEND: "auto",
    DATABASE_URL: "postgres://user:pass@db.invalid/test",
  });
  await backendState(async () => "frozen");
  let calls = 0;
  const request = async () => {
    calls++;
    return Response.json({ status: "ok", rows: [] });
  };
  await legacyAction({ method: "GET", query: "pair=A&wk=taanit%7C2" }, request);
  for (const payload of [
    { method: "POST", body: JSON.stringify({ action: "row", tab: "לימוד" }) },
    { method: "GET", query: "helpdone=3&key=K" },
    { method: "GET", query: "read=" + encodeURIComponent("עמדת לימוד") },
  ])
    await assert.rejects(legacyAction(payload, request), WritesPaused);
  assert.equal(calls, 1);
  environment({});
});

function page(fetcher) {
  class HTMLScriptElement {}
  let assigned = "";
  Object.defineProperty(HTMLScriptElement.prototype, "src", {
    configurable: true,
    get: () => assigned,
    set: (value) => {
      assigned = value;
    },
  });
  const window = {
    fetch: fetcher,
    location: { origin: "https://test.invalid" },
    DF_API: "https://script.invalid/exec",
    HTMLScriptElement,
  };
  window.parent = window;
  vm.runInNewContext(code, {
    window,
    crypto,
    URL,
    Response,
    Promise,
    Date,
    Event: globalThis.Event,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return { window, assigned: () => assigned };
}
const code = await fs.readFile("src/shared/net.js", "utf8");
test("legacy pages reach the backend only through the same-origin route", async () => {
  const calls = [];
  const { window, assigned } = page(async (url, options = {}) => {
    calls.push({ url, body: options.body ? JSON.parse(options.body) : null });
    return Response.json({ status: "ok", has: true });
  });
  await window.fetch("https://script.invalid/exec?pair=A&wk=1");
  await window.fetch("https://script.invalid/exec", {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "row", tab: "לימוד" }),
  });
  await window.fetch("https://script.invalid/exec?file=ID");
  assert.equal(calls[0].url, "/api/action");
  assert.deepEqual(calls[0].body, {
    operation: "legacy",
    payload: { method: "GET", query: "pair=A&wk=1" },
  });
  assert.equal(calls[1].body.payload.method, "POST");
  assert.equal(JSON.parse(calls[1].body.payload.body).tab, "לימוד");
  assert.equal(calls[2].url, "https://script.invalid/exec?file=ID");
  const script = new window.HTMLScriptElement();
  const delivered = new Promise((resolve) => {
    window.__cb = resolve;
  });
  script.src = "https://script.invalid/exec?pendingFor=050&cb=__cb";
  assert.equal((await delivered).has, true);
  assert.equal(assigned(), "");
  assert.equal(
    calls[3].body.payload.query,
    "pendingFor=050",
    "the callback name never reaches the server",
  );
  script.src = "https://script.invalid/exec?file=ID&callback=__f";
  assert.equal(assigned(), "https://script.invalid/exec?file=ID&callback=__f");
});
