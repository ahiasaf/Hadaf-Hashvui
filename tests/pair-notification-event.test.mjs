import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { resolvePairNotificationEvents } from "../src/server/pair-notification-event.ts";
const url = process.env.DATABASE_TEST_URL;
test(
  "pair writes atomically queue one event, resolve device aliases and cancel queued alerts after approval",
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
    const write = (tab, cols) =>
      sql`SELECT append_sheet_record(${tab},${JSON.stringify(cols)}::jsonb)`;
    await write("לומדים", [
      ["מזהה", "TEST_PARENT"],
      ["שם", "TestParent"],
      ["משפחה", "FixtureFamily"],
      ["טלפון", "0509998888"],
      ["תפקיד", "הורה"],
      ["קוד ישיבה", "demo"],
      ["מזהים נוספים", "TEST_PARENT_DEVICE"],
    ]);
    await write("לומדים", [
      ["מזהה", "TEST_PARENT_DEVICE"],
      ["שם", "TestParent"],
      ["משפחה", "FixtureFamily"],
      ["טלפון", "0509998888"],
      ["תפקיד", "הורה"],
      ["קוד ישיבה", "demo"],
    ]);
    const endpoint = "https://example.invalid/pair-" + randomUUID();
    await write("התראות", [
      ["מזהה", "TEST_PARENT_DEVICE"],
      [
        "מנוי",
        JSON.stringify({
          endpoint,
          keys: { auth: "TEST_AUTH", p256dh: "TEST_KEY" },
        }),
      ],
      ["תפקיד", "הורה"],
    ]);
    const id = "TEST_PAIR_" + randomUUID(),
      key = "pr|" + id + "|taanit|2";
    const columns = [
      ["מזהה", id],
      ["מסלול", "taanit"],
      ["שבוע", "2"],
      ["דף", "ב"],
      ["שם", "Example"],
      ["טלפון השותף", "0509998888"],
      ["דיווח", "הבן"],
    ];
    await write("זוגות", columns);
    await write("זוגות", columns);
    assert.equal(
      (
        await sql`SELECT count(*)::int AS n FROM notification_events WHERE key=${key}`
      )[0].n,
      1,
    );
    await Promise.all([
      resolvePairNotificationEvents(),
      resolvePairNotificationEvents(),
    ]);
    const queued =
      await sql`SELECT state,subscription FROM notification_outbox WHERE key=${key}`;
    assert.equal(queued.length, 1);
    assert.equal(queued[0].state, "queued");
    assert.equal(queued[0].subscription.endpoint, endpoint);
    const clock =
      await sql`SELECT extract(isodow FROM now() AT TIME ZONE 'Asia/Jerusalem') AS day,extract(hour FROM now() AT TIME ZONE 'Asia/Jerusalem') AS hour`;
    const day = Number(clock[0].day),
      hour = Number(clock[0].hour);
    if ((day === 5 && hour >= 12) || (day === 6 && hour < 20)) {
      const claimed = await sql`SELECT key FROM claim_notification_outbox(64)`;
      assert.ok(
        !claimed.some((row) => row.key === key),
        "Pair alerts keep the existing Shabbat window",
      );
    }
    await write("זוגות", [...columns, ["אושר", "כן"]]);
    assert.equal(
      (await sql`SELECT state FROM notification_outbox WHERE key=${key}`)[0]
        .state,
      "cancelled",
    );
    assert.equal(
      (await sql`SELECT resolved FROM notification_events WHERE key=${key}`)[0]
        .resolved,
      true,
    );
  },
);
