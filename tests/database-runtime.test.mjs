import test from "node:test";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { forwardAction } from "../src/server/actions.ts";
import { readDatabaseSheet } from "../src/server/database.ts";
import { parseCsv } from "../src/lib/csv.ts";
const fixtureUrl = process.env.DATABASE_TEST_URL;
test(
  "Neon writes preserve identity, acknowledge saves and roll back invalid data",
  { skip: !fixtureUrl },
  async () => {
    const sql = neon(fixtureUrl);
    const journal = await sql`SELECT source_hash FROM migration_runs`;
    assert.equal(journal.length, 1);
    assert.equal(
      journal[0].source_hash,
      "0d224f3b0d2fb381fd1729d8e24f438ed0fd24bbbf5b4215318a8f8b264aeb1c",
      "Use the isolated synthetic fixture branch only",
    );
    process.env.DATABASE_URL = fixtureUrl;
    process.env.HADAF_DATABASE_BACKEND = "neon";
    process.env.READ_KEY = "TEST_READ_KEY";
    process.env.TEAM_KEY = "TEST_TEAM_KEY";
    const write = (tab, cols, key = "") =>
      forwardAction({
        operation: "write",
        payload: {
          action: "row",
          tab,
          cols: JSON.stringify(cols),
          ...(key ? { key } : {}),
        },
      });
    await assert.rejects(
      write("לומדים", [["מזהה", "DENIED"]], "WRONG_KEY"),
      /denied/,
    );
    await assert.rejects(
      write("אנשי קשר", [["שם", "DENIED"]]),
      /Authentication/,
    );
    const student = (id) => [
      ["מזהה", id],
      ["שם", "TestChild"],
      ["משפחה", "FixtureFamily"],
      ["טלפון", "0500000001"],
      ["קוד ישיבה", "demo"],
      ["תפקיד", "תלמיד"],
      ["טלפון ההורה", "0500000002"],
    ];
    const first = await write("לומדים", student("TEST_CHILD"));
    assert.equal(first.status, "success");
    assert.equal(first.id, "TEST_CHILD");
    const alias = await write("לומדים", student("TEST_CHILD_DEVICE"));
    assert.equal(alias.id, "TEST_CHILD");
    assert.equal(alias.updated, true);
    await write("לומדים", [
      ["מזהה", "TEST_PARENT"],
      ["שם", "TestParent"],
      ["משפחה", "FixtureFamily"],
      ["טלפון", "0500000002"],
      ["קוד ישיבה", "demo"],
      ["תפקיד", "הורה"],
    ]);
    await write("לימוד", [
      ["מזהה", "TEST_CHILD_DEVICE"],
      ["קוד ישיבה", "demo"],
      ["מסלול", "taanit"],
      ["שבוע", "2"],
      ["קטע", "2"],
      ["מתוך", "4"],
    ]);
    await write("לימוד", [
      ["מזהה", "TEST_CHILD"],
      ["קוד ישיבה", "demo"],
      ["מסלול", "taanit"],
      ["שבוע", "2"],
      ["קטע", "4"],
      ["מתוך", "4"],
    ]);
    const restored = await forwardAction({
      operation: "read",
      payload: {
        whoIs: "+972500000001",
        first: "TestChild",
        last: "FixtureFamily",
        role: "kid",
      },
    });
    assert.equal(restored.me.id, "TEST_CHILD");
    assert.ok(restored.learned.includes("taanit|2"));
    assert.ok(!("dadPhone" in restored.me));
    const canonical = await forwardAction({
      operation: "read",
      payload: { idFor: "TEST_CHILD_DEVICE" },
    });
    assert.equal(canonical.id, "TEST_CHILD");
    assert.ok(canonical.learned.includes("taanit|2"));
    const roster = await forwardAction({
      operation: "read",
      payload: { board: "*", key: "TEST_READ_KEY" },
    });
    const child = roster.students.find((p) => p.id === "TEST_CHILD");
    assert.ok(child.weeks.includes("taanit|2"));
    assert.ok(!("taanit|2" in child.pos));
    assert.equal(child.withOk, 1);
    assert.equal(child.with, "TestParent");
    assert.deepEqual(child.pars, ["TEST_PARENT"]);
    const counts = parseCsv(await readDatabaseSheet("מונים", "", true));
    const count = counts.find((row) => row[0] === "demo");
    assert.ok(Number(count[1]) >= 1);
    const completions = parseCsv(
      await readDatabaseSheet(
        "מוני-לימוד",
        'select A,B,C,D where A="taanit" and B="2"',
        true,
      ),
    );
    assert.ok(Number(completions.find((row) => row[2] === "demo")[3]) >= 1);
    assert.ok(!JSON.stringify(counts).includes("TestChild"));
    assert.ok(!JSON.stringify(completions).includes("TEST_CHILD"));
    const before =
      await sql`SELECT count(*)::int AS rows FROM sheet_rows WHERE table_name='לימוד'`;
    await assert.rejects(
      write("לימוד", [
        ["מזהה", "TEST_CHILD"],
        ["מסלול", "INVALID"],
        ["שבוע", "2"],
      ]),
    );
    const after =
      await sql`SELECT count(*)::int AS rows FROM sheet_rows WHERE table_name='לימוד'`;
    assert.equal(after[0].rows, before[0].rows);
    const logged = await forwardAction({
      operation: "write",
      payload: {
        action: "teamlog",
        key: "TEST_TEAM_KEY",
        cols: JSON.stringify([
          ["מי", "Example"],
          ["ישיבה", "Demo"],
          ["פעולה", "שיחה"],
        ]),
      },
    });
    assert.equal(logged.status, "success");
    await assert.rejects(
      forwardAction({
        operation: "write",
        payload: {
          action: "teamlog",
          key: "WRONG_KEY",
          cols: JSON.stringify([
            ["מי", "Example"],
            ["ישיבה", "Demo"],
            ["פעולה", "שיחה"],
          ]),
        },
      }),
      /denied/,
    );
  },
);
