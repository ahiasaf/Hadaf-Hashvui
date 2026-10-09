import test from "node:test";
import assert from "node:assert/strict";
import {
  createScheduler,
  slotsDue,
  israelNow,
  sentFrom,
  goneKey,
  isGone,
} from "../tools/scheduler.mts";
import { deliver, mapLimit } from "../tools/push-delivery.mts";
const subscription = {
  endpoint: "https://example.invalid/fixture",
  keys: { auth: "TEST", p256dh: "TEST" },
};
test("Jerusalem catch-up stays inside the current day and runs oldest first", () => {
  const now = israelNow(new Date("2026-10-09T21:45:00Z"));
  assert.deepEqual(now, { date: "2026-10-10", day: 6, hour: 0, min: 45 });
  assert.deepEqual(
    slotsDue(now).map((slot) => slot.t),
    ["00:00", "00:30"],
  );
  const afternoon = slotsDue({ ...now, hour: 20, min: 5 });
  assert.equal(afternoon.length, 29);
  assert.equal(afternoon[0].t, "06:00");
  assert.equal(afternoon.at(-1).t, "20:00");
});
function store() {
  const states = new Map();
  let failSettlement = false;
  return {
    states,
    fail: () => {
      failSettlement = true;
    },
    store: {
      isNeon: () => true,
      read: async () => [
        ["מפתח", "מצב"],
        ...[...states].map(([key, state]) => [key, state]),
      ],
      write: async (_tab, cols) => {
        const row = Object.fromEntries(cols);
        states.set(row["מפתח"], row["מצב"]);
      },
      claim: async (key) => {
        if (states.has(key) && states.get(key) !== "נכשל") return false;
        states.set(key, "ממתין");
        return true;
      },
      settle: async (key, state) => {
        if (failSettlement) throw new Error("TEST_FAILURE");
        states.set(key, state);
        return true;
      },
    },
  };
}
test("overlapping jobs send once and failed delivery can retry", async () => {
  const fixture = store(),
    scheduler = createScheduler(fixture.store);
  let calls = 0;
  await Promise.all(
    Array.from({ length: 8 }, () =>
      scheduler.once("TEST_KEY", async () => {
        calls++;
        return "OK";
      }),
    ),
  );
  assert.equal(calls, 1);
  assert.equal(fixture.states.get("TEST_KEY"), "נשלח");
  await assert.rejects(
    scheduler.once("FAIL_KEY", async () => {
      throw new Error("TEST_FAILURE");
    }),
  );
  assert.equal(fixture.states.get("FAIL_KEY"), "נכשל");
  await scheduler.once("FAIL_KEY", async () => "RETRY");
  assert.equal(fixture.states.get("FAIL_KEY"), "נשלח");
});
test("successful delivery with a failed acknowledgement stays pending and blocks duplicates", async () => {
  const fixture = store();
  fixture.fail();
  const scheduler = createScheduler(fixture.store);
  let calls = 0;
  await scheduler.once("UNCERTAIN_KEY", async () => {
    calls++;
    return "OK";
  });
  await scheduler.once("UNCERTAIN_KEY", async () => {
    calls++;
    return "DUPLICATE";
  });
  assert.equal(calls, 1);
  assert.equal(fixture.states.get("UNCERTAIN_KEY"), "ממתין");
  const previous = process.exitCode;
  try {
    scheduler.finish();
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previous;
  }
});
test("expired subscriptions are skipped only while their endpoint stays the same", () => {
  const states = {
    [goneKey(subscription)]: "פג",
    FAILED: "נכשל",
    PENDING: "ממתין",
    SENT: "נשלח",
  };
  assert.equal(isGone(states, "TEST", subscription), true);
  assert.equal(
    isGone(states, "TEST", { endpoint: "https://example.invalid/new" }),
    false,
  );
  assert.deepEqual(sentFrom(states), { PENDING: 1, SENT: 1 });
});
test("delivery retries transient errors, honors Retry-After and never retries expired subscriptions", async () => {
  let attempts = 0;
  const delays = [];
  const sender = {
    sendNotification: async () => {
      if (++attempts < 3)
        throw {
          statusCode: 429,
          headers: { "retry-after": "2" },
          body: "DO_NOT_LOG",
        };
      return { statusCode: 201 };
    },
  };
  const result = await deliver(sender, subscription, "TEST", {}, async (ms) => {
    delays.push(ms);
  });
  assert.deepEqual(result, { ok: true, code: 201, tries: 3 });
  assert.deepEqual(delays, [2000, 2000]);
  attempts = 0;
  const gone = await deliver(
    {
      sendNotification: async () => {
        attempts++;
        throw { statusCode: 410 };
      },
    },
    subscription,
    "TEST",
    {},
    async () => {
      throw new Error("Unexpected retry");
    },
  );
  assert.equal(gone.gone, true);
  assert.equal(attempts, 1);
  const bad = await deliver(
    {
      sendNotification: async () => {
        throw { statusCode: 400, body: "PRIVATE_BODY" };
      },
    },
    subscription,
    "TEST",
  );
  assert.ok(!bad.err.includes("PRIVATE_BODY"));
});
test("bounded delivery preserves ordering and rejects zero-worker configurations", async () => {
  let active = 0,
    max = 0;
  const result = await mapLimit([4, 3, 2, 1], 2, async (value) => {
    max = Math.max(max, ++active);
    await new Promise((resolve) => setTimeout(resolve, value));
    active--;
    return value * 2;
  });
  assert.deepEqual(result, [8, 6, 4, 2]);
  assert.equal(max, 2);
  await assert.rejects(mapLimit([1], 0, async (value) => value));
});
test("missing delivery acknowledgement is never retried as a confirmed failure", async () => {
  let attempts = 0;
  const result = await deliver(
    {
      sendNotification: async () => {
        attempts++;
        throw new Error("TEST_NETWORK_TIMEOUT");
      },
    },
    subscription,
    "TEST",
  );
  assert.equal(result.uncertain, true);
  assert.equal(attempts, 1);
  const fixture = store(),
    scheduler = createScheduler(fixture.store);
  await assert.rejects(
    scheduler.once("AMBIGUOUS", async () => {
      throw { uncertain: true };
    }),
  );
  assert.equal(fixture.states.get("AMBIGUOUS"), "ממתין");
  const duplicate = await scheduler.once("AMBIGUOUS", async () => "DUPLICATE");
  assert.deepEqual(duplicate, { skipped: true });
});
