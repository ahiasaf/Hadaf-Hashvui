import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import sheets from "../api/sheets.ts";
import { runServerTask } from "../src/server/effects.ts";
import { WritesPaused } from "../src/server/database.ts";
import {
  readPublicSheet,
  requestNotification,
} from "../src/server/upstream.ts";
import { mapLimit } from "../src/server/push-delivery.ts";

test("shared server effects retain paused responses and hide source errors", async () => {
  assert.deepEqual(await runServerTask("fixture", async () => "OK"), {
    ok: true,
    value: "OK",
  });
  assert.deepEqual(
    await runServerTask("fixture", async () => {
      throw new WritesPaused();
    }),
    { ok: false, paused: true },
  );
  const result = await runServerTask("fixture", async () => {
    throw new Error("PRIVATE_SOURCE_DATA");
  });
  assert.deepEqual(result, { ok: false, paused: false });
  assert.ok(!JSON.stringify(result).includes("PRIVATE_SOURCE_DATA"));
});

test("public read effects retry temporary failures once but never retry invalid data", async () => {
  let calls = 0;
  const text = await readPublicSheet("מוסדות", "", "", async () =>
    ++calls === 1
      ? new Response("PRIVATE_SOURCE_DATA", { status: 503 })
      : new Response("code,name,last,joined"),
  );
  assert.equal(text, "code,name,last,joined");
  assert.equal(calls, 2);
  for (const response of [
    new Response("<html>login</html>"),
    new Response("bad,columns"),
    new Response("Denied", { status: 403 }),
  ]) {
    calls = 0;
    await assert.rejects(
      readPublicSheet("מוסדות", "", "", async () => {
        calls++;
        return response;
      }),
    );
    assert.equal(calls, 1);
  }
});

test("interrupting a public read aborts its underlying request and prevents retry", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = readPublicSheet(
    "מוסדות",
    "",
    "",
    async (_url, { signal }) => {
      calls++;
      return new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new TypeError("Aborted")),
          { once: true },
        );
      });
    },
    controller.signal,
  );
  controller.abort();
  await assert.rejects(pending);
  assert.equal(calls, 1);
});

test("closing a public API response aborts its fetch and sends no late response", async () => {
  const originalFetch = globalThis.fetch;
  const originalBackend = process.env.HADAF_DATABASE_BACKEND;
  process.env.HADAF_DATABASE_BACKEND = "legacy";
  let started,
    cancelled = false;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  globalThis.fetch = async (_url, { signal }) => {
    started();
    return new Promise((_resolve, reject) =>
      signal.addEventListener(
        "abort",
        () => {
          cancelled = true;
          reject(new TypeError("Aborted"));
        },
        { once: true },
      ),
    );
  };
  const res = Object.assign(new EventEmitter(), {
    destroyed: false,
    writeHead: () => {
      throw new Error("Late response");
    },
  });
  try {
    const pending = sheets(
      { method: "GET", url: "/api/sheets?tab=" + encodeURIComponent("מוסדות") },
      res,
    );
    await ready;
    res.destroyed = true;
    res.emit("close");
    await pending;
    assert.equal(cancelled, true);
    assert.equal(res.listenerCount("close"), 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBackend === undefined)
      delete process.env.HADAF_DATABASE_BACKEND;
    else process.env.HADAF_DATABASE_BACKEND = originalBackend;
  }
});

test("structured delivery stops queued work and cancels an active sibling after failure", async () => {
  const started = [];
  let cancelled = false;
  await assert.rejects(
    mapLimit([0, 1, 2, 3], 2, async (item, _index, signal) => {
      started.push(item);
      if (item === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("TEST_FAILURE");
      }
      return new Promise((_resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => {
            cancelled = true;
            reject(new Error("Interrupted"));
          },
          { once: true },
        ),
      );
    }),
  );
  assert.deepEqual(started, [0, 1]);
  assert.equal(cancelled, true);
});

test("notification signup effects never automatically retry a write", async () => {
  let calls = 0;
  const payload = {
    action: "row",
    tab: "ממתינים לדף",
    cols: JSON.stringify([
      ["דף", "taanit|ב"],
      ["מזהה", "TEST"],
      ["שם", ""],
      ["ישיבה", ""],
      ["מכשיר", ""],
      [
        "מנוי",
        JSON.stringify({
          endpoint: "https://push.invalid/test",
          keys: { auth: "TEST", p256dh: "TEST" },
        }),
      ],
      ["מתי", "2026-10-14"],
    ]),
  };
  const result = await runServerTask("fixture.wait", () =>
    requestNotification(payload, async () => {
      calls++;
      throw new TypeError("TEST_NETWORK_FAILURE");
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(calls, 1);
});
