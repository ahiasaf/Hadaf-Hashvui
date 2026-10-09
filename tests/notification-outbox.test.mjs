import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import {
  enqueueNotification,
  drainNotificationOutbox,
} from "../src/server/notification-outbox.ts";
const url = process.env.DATABASE_TEST_URL;
test(
  "immediate outbox deduplicates submission and concurrent workers without retrying uncertain delivery",
  { skip: !url },
  async () => {
    const sql = neon(url),
      journal = await sql`SELECT source_hash FROM migration_runs`;
    assert.equal(journal.length, 1);
    assert.equal(
      journal[0].source_hash,
      "0d224f3b0d2fb381fd1729d8e24f438ed0fd24bbbf5b4215318a8f8b264aeb1c",
      "Use an isolated synthetic fixture database only",
    );
    process.env.DATABASE_URL = url;
    process.env.HADAF_DATABASE_BACKEND = "neon";
    process.env.HADAF_NOTIFICATION_DELIVERY = "direct";
    process.env.VAPID_PRIVATE = "TEST_PRIVATE_KEY";
    const sid = "TEST_" + randomUUID(),
      endpoint = "https://example.invalid/" + sid;
    const recipient = {
      id: "TEST_DEVICE",
      sub: { endpoint, keys: { auth: "TEST_AUTH", p256dh: "TEST_KEY" } },
      first: "Example",
      institution: "Demo",
      code: "demo",
      grade: "",
      klass: "",
      role: "תלמיד",
      schedule: "",
    };
    const payload = {
      title: "Fixture notification",
      body: "Fixture body",
      url: "./",
    };
    const enqueue = () =>
      enqueueNotification(
        sid,
        [recipient],
        payload,
        false,
        "TEST_HASH",
        "מערכת",
      );
    const submitted = await Promise.all([enqueue(), enqueue()]);
    assert.equal(submitted.filter((result) => !result.reused).length, 1);
    await assert.rejects(
      enqueueNotification(
        sid,
        [recipient],
        payload,
        false,
        "CHANGED_TEST_HASH",
        "מערכת",
      ),
    );
    let deliveries = 0;
    const sender = {
      sendNotification: async (sub) => {
        if (sub.endpoint === endpoint) deliveries++;
        return { statusCode: 201 };
      },
    };
    await Promise.all([
      drainNotificationOutbox(sender),
      drainNotificationOutbox(sender),
    ]);
    assert.equal(deliveries, 1);
    assert.equal(
      (await sql`SELECT state FROM notification_outbox WHERE sid=${sid}`)[0]
        .state,
      "sent",
    );
    const uncertainSid = "TEST_" + randomUUID();
    await enqueueNotification(
      uncertainSid,
      [recipient],
      payload,
      false,
      "UNCERTAIN_TEST_HASH",
      "מערכת",
    );
    let attempts = 0;
    const ambiguous = {
      sendNotification: async () => {
        attempts++;
        throw new Error("TEST_TIMEOUT_AFTER_ACCEPTANCE");
      },
    };
    await drainNotificationOutbox(ambiguous);
    await drainNotificationOutbox(ambiguous);
    assert.equal(attempts, 1);
    const uncertain =
      await sql`SELECT state,attempts FROM notification_outbox WHERE sid=${uncertainSid}`;
    assert.equal(uncertain[0].state, "uncertain");
    assert.equal(uncertain[0].attempts, 1);
    const failedSid = "TEST_" + randomUUID();
    await enqueueNotification(
      failedSid,
      [recipient],
      payload,
      false,
      "FAILED_TEST_HASH",
      "מערכת",
    );
    await drainNotificationOutbox({
      sendNotification: async () => {
        throw { statusCode: 429 };
      },
    });
    assert.equal(
      (
        await sql`SELECT state FROM notification_outbox WHERE sid=${failedSid}`
      )[0].state,
      "failed",
    );
    await sql`UPDATE notification_outbox SET next_attempt_at=now() WHERE sid=${failedSid}`;
    await drainNotificationOutbox(sender);
    assert.equal(
      (
        await sql`SELECT state,attempts FROM notification_outbox WHERE sid=${failedSid}`
      )[0].state,
      "sent",
    );
  },
);
