import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_TEST_URL;
test(
  "Neon atomically claims overlapping notifications and keeps reports monotonic",
  { skip: !url },
  async () => {
    const sql = neon(url);
    const journal = await sql`SELECT source_hash FROM migration_runs`;
    assert.equal(journal.length, 1);
    assert.equal(
      journal[0].source_hash,
      "0d224f3b0d2fb381fd1729d8e24f438ed0fd24bbbf5b4215318a8f8b264aeb1c",
      "Use an isolated synthetic fixture database only",
    );
    const key = "TEST_DELIVERY_" + randomUUID();
    const claim = () => sql`SELECT claim_notification(${key}) AS claimed`;
    const claims = await Promise.all(Array.from({ length: 8 }, claim));
    assert.equal(claims.filter((rows) => rows[0].claimed).length, 1);
    assert.equal(
      (await claim())[0].claimed,
      false,
      "Pending deliveries must not automatically retry",
    );
    assert.equal(
      (await sql`SELECT settle_notification(${key},'נכשל') AS settled`)[0]
        .settled,
      true,
    );
    assert.equal(
      (await claim())[0].claimed,
      true,
      "Acknowledged failures can retry",
    );
    assert.equal(
      (await sql`SELECT settle_notification(${key},'נשלח') AS settled`)[0]
        .settled,
      true,
    );
    assert.equal((await claim())[0].claimed, false);
    assert.equal(
      (
        await sql`SELECT attempts FROM notification_deliveries WHERE key=${key}`
      )[0].attempts,
      2,
    );
    const sid = "TEST_REPORT_" + randomUUID();
    const cols = JSON.stringify([
      ["מזהה שליחה", sid],
      ["תוצאה", "ממתין"],
      ["מי", "מערכת"],
    ]);
    await sql`SELECT append_sheet_record('הודעות',${cols}::jsonb)`;
    const result = async () =>
      (
        await sql`SELECT record->>'תוצאה' AS result FROM sheet_rows WHERE table_name='הודעות' AND record->>'מזהה שליחה'=${sid} ORDER BY ordinal DESC LIMIT 1`
      )[0].result;
    await sql`SELECT report_notification(${sid},'בשליחה',true)`;
    await sql`SELECT report_notification(${sid},'התקבלה אצל שירות ההתראות ל-1',false)`;
    await sql`SELECT report_notification(${sid},'בשליחה',true)`;
    assert.equal(await result(), "התקבלה אצל שירות ההתראות ל-1");
    await sql`SELECT report_notification(${sid},'נכשלה: TEST_FIRST_FAILURE',false)`;
    await sql`SELECT report_notification(${sid},'נכשלה: TEST_SECOND_FAILURE',false)`;
    assert.equal(await result(), "נכשלה: TEST_FIRST_FAILURE");
    assert.equal(
      (
        await sql`SELECT report_notification('MISSING_TEST_REPORT','בשליחה',true) AS found`
      )[0].found,
      false,
    );
    const manual = "TEST_MANUAL_" + randomUUID();
    await sql`SELECT append_sheet_record('הודעות',${JSON.stringify([
      ["מזהה שליחה", manual],
      ["מי", "Example"],
      ["תוצאה", "ממתין"],
    ])}::jsonb)`;
    await sql`SELECT report_notification(${manual},'נכשלה: TEST_FAILURE',false)`;
    await sql`SELECT report_notification(${manual},'נכשלה: TEST_SECOND_FAILURE',false)`;
    assert.equal(
      (
        await sql`SELECT count(*)::int AS n FROM notification_events WHERE key=${"failure|" + manual}`
      )[0].n,
      1,
    );
    assert.equal(
      (
        await sql`SELECT count(*)::int AS n FROM notification_events WHERE key=${"failure|" + sid}`
      )[0].n,
      0,
      "System notification failures must not create alert loops",
    );
  },
);
