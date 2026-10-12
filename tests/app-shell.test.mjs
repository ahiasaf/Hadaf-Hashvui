import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import { setImmediate } from "node:timers";

const source = await fs.readFile("src/shared/app-shell.js", "utf8");
function events(object = {}) {
  const handlers = new Map();
  object.addEventListener = (name, callback) => {
    handlers.set(name, [...(handlers.get(name) || []), callback]);
  };
  object.fire = (name, event = {}) => {
    for (const callback of handlers.get(name) || []) callback(event);
  };
  return object;
}
async function load({
  controlled = true,
  installed = true,
  person = null,
} = {}) {
  const storage = new Map([["df:me", JSON.stringify(person)]]);
  const guest = { hidden: false };
  const classes = new Set();
  const timers = [];
  const state = { reloads: 0, checks: 0, registrations: 0, messages: [] };
  const worker = events({ controller: controlled ? {} : null });
  worker.register = async (url, options) => {
    assert.equal(url, "/sw.js");
    assert.equal(options.updateViaCache, "none");
    state.registrations++;
    return {
      update: async () => {
        state.checks++;
      },
      waiting: { postMessage: (message) => state.messages.push(message.type) },
    };
  };
  const window = events({ matchMedia: () => ({ matches: installed }) });
  const navigator = { serviceWorker: worker, onLine: true };
  const document = events({
    hidden: false,
    querySelectorAll: () => [guest],
    documentElement: {
      classList: {
        toggle: (name, value) =>
          value ? classes.add(name) : classes.delete(name),
      },
    },
  });
  vm.runInNewContext(source, {
    window,
    document,
    navigator,
    location: {
      reload: () => {
        state.reloads++;
      },
    },
    localStorage: { getItem: (key) => storage.get(key) },
    setTimeout: (callback) => timers.push(callback),
    setInterval: () => {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  return {
    state,
    window,
    document,
    worker,
    navigator,
    storage,
    guest,
    classes,
    flush: () => {
      for (const callback of timers.splice(0)) callback();
    },
  };
}

test("guest prompts follow the account on registration, another tab and sign out", async () => {
  const app = await load();
  assert.equal(app.guest.hidden, false);
  app.storage.set("df:me", JSON.stringify({ id: "student" }));
  app.window.fire("df-account-change");
  assert.equal(app.guest.hidden, true);
  assert.ok(app.classes.has("signed-in"));
  app.storage.set("df:me", "invalid JSON");
  app.window.fire("storage", { key: "df:me" });
  assert.equal(app.guest.hidden, false);
});

test("installed apps check on resume and online, then reload once in the background", async () => {
  const app = await load();
  assert.equal(app.state.registrations, 1);
  assert.deepEqual(app.state.messages, ["SKIP_WAITING"]);
  app.window.DF_APP.update();
  assert.equal(app.state.registrations, 1);
  app.window.fire("online");
  app.document.fire("visibilitychange");
  assert.equal(app.state.checks, 3);
  app.worker.fire("controllerchange");
  app.flush();
  assert.equal(app.state.reloads, 0);
  app.document.hidden = true;
  app.document.fire("visibilitychange");
  app.worker.fire("controllerchange");
  app.flush();
  assert.equal(app.state.reloads, 1);
});

test("first installation does not reload, but a later release does", async () => {
  const app = await load({ controlled: false });
  app.worker.controller = {};
  app.worker.fire("controllerchange");
  app.document.hidden = true;
  app.document.fire("visibilitychange");
  app.flush();
  assert.equal(app.state.reloads, 0);
  app.worker.fire("controllerchange");
  app.flush();
  assert.equal(app.state.reloads, 1);
});

test("updates preserve typed forms and school selections made with buttons", async () => {
  for (const kind of ["input", "click"]) {
    const app = await load({ person: { id: "student" } });
    app.document.fire(kind, { target: { closest: () => ({}) } });
    app.document.hidden = true;
    app.worker.fire("controllerchange");
    app.flush();
    assert.equal(app.state.reloads, 0);
    assert.equal(app.storage.get("df:me"), '{"id":"student"}');
  }
});

test("background updates never cancel navigation or reload ordinary browser tabs", async () => {
  const app = await load();
  app.document.hidden = true;
  app.worker.fire("controllerchange");
  app.window.fire("pagehide");
  app.flush();
  assert.equal(app.state.reloads, 0);
  const browser = await load({ installed: false });
  browser.document.hidden = true;
  browser.worker.fire("controllerchange");
  browser.flush();
  assert.equal(browser.state.reloads, 0);
});

test("a pending installed-app update waits for a network connection", async () => {
  const app = await load();
  app.navigator.onLine = false;
  app.document.hidden = true;
  app.worker.fire("controllerchange");
  app.flush();
  assert.equal(app.state.reloads, 0);
  app.navigator.onLine = true;
  app.window.fire("online");
  app.flush();
  assert.equal(app.state.reloads, 1);
});
