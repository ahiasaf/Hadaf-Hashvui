import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

function storage(values) {
  return Object.defineProperties(
    { ...values },
    {
      getItem: {
        value(key) {
          return this[key] ?? null;
        },
      },
      setItem: {
        value(key, value) {
          this[key] = value;
        },
      },
      removeItem: {
        value(key) {
          delete this[key];
        },
      },
    },
  );
}
async function load(file, context) {
  const exports = {};
  const source = ts.transpileModule(await fs.readFile(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, { ...context, exports });
  return exports;
}
test("device reset removes only app storage, caches and its own active worker", async () => {
  const localStorage = storage({
    "df:me": "ACCOUNT",
    "df:ownDraft": "DRAFT",
    "boardKey:A": "TEST",
    "other:account": "KEEP",
  });
  const sessionStorage = storage({
    "df:public:x": "DATA",
    "other:session": "KEEP",
  });
  const deleted = [];
  const unregistered = [];
  const registration = (scriptURL) => ({
    active: scriptURL ? { scriptURL } : null,
    pushManager: { getSubscription: async () => null },
    unregister: async () => {
      unregistered.push(scriptURL);
      return true;
    },
  });
  const registrations = [
    registration("https://test.invalid/sw.js"),
    registration("https://test.invalid/other/sw.js"),
    registration(null),
  ];
  const api = await load("src/lib/device-reset.ts", {
    localStorage,
    sessionStorage,
    URL,
    setTimeout,
    clearTimeout,
    navigator: {
      serviceWorker: { getRegistrations: async () => registrations },
    },
    window: { caches: true },
    caches: {
      keys: async () => ["hadaf-v9.0.0", "other-cache"],
      delete: async (key) => {
        deleted.push(key);
        return true;
      },
    },
  });
  assert.equal(JSON.stringify(await api.resetDevice(true)), "[]");
  assert.deepEqual(unregistered, ["https://test.invalid/sw.js"]);
  assert.deepEqual(deleted, ["hadaf-v9.0.0"]);
  assert.equal(localStorage["other:account"], "KEEP");
  assert.equal(sessionStorage["other:session"], "KEEP");
  assert.equal(localStorage["df:tester"], "1");
  assert.equal(localStorage["df:ownDraft"], undefined);
  assert.equal(localStorage["boardKey:A"], undefined);
});
test("failed notification cleanup remains an explicit reset failure", async () => {
  let unregistered = false;
  const api = await load("src/lib/device-reset.ts", {
    localStorage: storage({}),
    sessionStorage: storage({}),
    URL,
    navigator: {
      serviceWorker: {
        getRegistrations: async () => [
          {
            active: { scriptURL: "https://test.invalid/sw.js" },
            pushManager: {
              getSubscription: async () => ({ unsubscribe: async () => false }),
            },
            unregister: async () => {
              unregistered = true;
              return true;
            },
          },
        ],
      },
    },
    window: {},
  });
  assert.equal((await api.resetDevice(false)).length, 1);
  assert.equal(unregistered, false);
});
test("draft recovery sorts numeric segments, retains source and rejects unreadable storage", async () => {
  const text = JSON.stringify({
    "taanit|ב|10": { pieces: [{ text: "TEN" }] },
    "taanit|ב|2": { pieces: [{ text: "TWO", audio: "audio/example.webm" }] },
  });
  const localStorage = storage({ "df:ownDraft": text });
  const api = await load("src/lib/draft-recovery.ts", { localStorage });
  assert.equal(
    JSON.stringify(api.loadDrafts().map((d) => d.segment)),
    JSON.stringify(["2", "10"]),
  );
  assert.equal(localStorage["df:ownDraft"], text);
  localStorage["df:ownDraft"] = "BROKEN";
  assert.throws(() => api.loadDrafts(), /unreadable/);
});
