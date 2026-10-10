import test from "node:test";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { runCutover } from "../tools/database-cutover.mts";
import { backendState, resetBackendState } from "../src/server/database.ts";
import { forwardAction } from "../src/server/actions.ts";

// Requires an EMPTY throwaway branch with synthetic data only. Never the candidate or production branch.
const url = process.env.DATABASE_CUTOVER_TEST_URL;
const learners = [
  "מזהה",
  "שם",
  "משפחה",
  "טלפון",
  "ישיבה",
  "קוד ישיבה",
  "שכבה",
  "כיתה",
  "מסגרת",
  "תפקיד",
  "טלפון ההורה",
  "מזהה המזמין",
  "מזהים נוספים",
  "בדיקה",
];
const snapshot = {
  version: 1,
  capturedAt: "2026-10-10T08:00:00.000Z",
  tables: [
    {
      name: "לומדים",
      rows: [
        learners,
        [
          "KID1",
          "Example",
          "Family",
          "0500000001",
          "School A",
          "S1",
          "ט",
          "2",
          "אבות ובנים",
          "תלמיד",
          "0500000002",
          "",
          "",
          "",
        ],
        [
          "DAD1",
          "Parent",
          "Family",
          "0500000002",
          "School A",
          "S1",
          "",
          "",
          "אבות ובנים",
          "הורה",
          "",
          "",
          "DAD1B",
          "",
        ],
        [
          "KID2",
          "Second",
          "Person",
          "0500000003",
          "School A",
          "S1",
          "ט",
          "1",
          "לימוד עצמי",
          "תלמיד",
          "",
          "",
          "",
          "",
        ],
        [
          "KID3",
          "Second",
          "Person",
          "0500000003",
          "School A",
          "S1",
          "ט",
          "1",
          "לימוד עצמי",
          "תלמיד",
          "",
          "",
          "",
          "",
        ],
      ],
    },
    {
      name: "לימוד",
      rows: [
        ["מזהה", "קוד ישיבה", "מסלול", "שבוע", "דף", "קטע", "מתוך", "בדיקה"],
        ["KID1", "S1", "taanit", "2", "ג", "3", "8", ""],
        ["KID1", "S1", "taanit", "1", "ב.", "", "", ""],
      ],
    },
    {
      name: "מוסדות",
      rows: [
        ["code", "name", "last", "joined"],
        ["S1", "School A", "", ""],
        ["S2", "School B", "", ""],
      ],
    },
    {
      name: "טקסטים",
      rows: [
        ["מפתח", "נוסח"],
        ["hello", "שלום"],
      ],
    },
    {
      name: "קודים",
      rows: [
        ["קוד ישיבה", "קוד גישה", "נוצר"],
        ["S1", "abc234", ""],
      ],
    },
    {
      name: "התראות",
      rows: [
        ["מזהה", "שם", "טלפון", "ישיבה", "קוד ישיבה", "תפקיד", "מנוי"],
        ["STAFFDEVICE1", "Staff", "0500000009", "School A", "S1", 'ר"ם', ""],
      ],
    },
    {
      name: "זוגות",
      rows: [
        ["מזהה", "מסלול", "שבוע", "דיווח", "טלפון השותף"],
        ["KID1", "taanit", "2", "הבן", "0500000002"],
      ],
    },
    {
      name: "הרשמות",
      rows: [
        ["ישיבה", "קוד", "איש קשר", "טלפון", 'סה"כ גמרות'],
        ["School A", "S1", "Head One", "0500000010", "20"],
      ],
    },
    { name: "תקועים", rows: [["שם", "טלפון", "טופל"]] },
    {
      name: "עמדת לימוד",
      rows: [
        [
          "יום",
          "קוד עמדה",
          "סוג",
          "קוד ישיבה",
          "שכבה",
          "כיתה",
          "שם",
          "מסלול",
          "שבוע",
          "דף",
          "רמה",
        ],
        [
          "2026-10-09",
          "A",
          "שיעור",
          "S1",
          "ט",
          "2",
          "Family Example",
          "",
          "2",
          "",
          "",
        ],
      ],
    },
    {
      name: "אנשי קשר",
      rows: [
        ["ישיבה", "שם", "טלפון"],
        ["School A", "Contact", "0500000011"],
      ],
    },
    { name: "public:לומדים", rows: [["מזהה"], ["OLDCOPY"]] },
  ],
};
const READ = "TEST_READ_KEY";
const legacy = (method, input) =>
  forwardAction({
    operation: "legacy",
    payload:
      method === "GET"
        ? { method, query: new URLSearchParams(input).toString() }
        : { method, body: JSON.stringify(input) },
  });

test(
  "cutover imports once behind a freeze, activates atomically and then only migrates",
  { skip: !url },
  async () => {
    const sql = neon(url);
    const empty =
      await sql`SELECT to_regclass('public.migration_runs') AS name`;
    assert.equal(empty[0].name, null, "Use an empty throwaway branch");
    const options = {
      sql,
      capture: async () => JSON.parse(JSON.stringify(snapshot)),
      wait: async () => {},
      graceMs: 0,
    };
    const dry = await runCutover({ ...options, dryRun: true });
    assert.equal(dry.mode, "dry-run");
    assert.equal(dry.tables["לומדים"], 4);
    // An expired freeze must abort before activation and leave nothing behind.
    await assert.rejects(
      runCutover({ ...options, dryRun: false, freezeMinutes: 0 }),
      /Write freeze expired/,
    );
    assert.equal(
      (await sql`SELECT to_regclass('public.migration_runs') AS name`)[0].name,
      null,
    );
    assert.equal(
      (await sql`SELECT count(*)::int AS n FROM cutover_state`)[0].n,
      0,
    );
    const done = await runCutover({ ...options, dryRun: false });
    assert.equal(done.mode, "activated");
    const marker =
      await sql`SELECT state,frozen_until FROM cutover_state WHERE id`;
    assert.equal(marker[0].state, "active");
    assert.equal(marker[0].frozen_until, null);
    const counts =
      await sql`SELECT table_name,count(*)::int AS n FROM sheet_rows GROUP BY table_name`;
    assert.equal(counts.find((row) => row.table_name === "לומדים").n, 4);
    const again = await runCutover({ ...options, dryRun: false });
    assert.deepEqual(again, { mode: "migrated", applied: [] });
    process.env.DATABASE_URL = url;
    process.env.HADAF_DATABASE_BACKEND = "auto";
    process.env.READ_KEY = READ;
    resetBackendState();
    assert.equal(await backendState(), "neon");
  },
);

test(
  "legacy operations keep their authorization, acknowledgements and effects on Neon",
  { skip: !url },
  async () => {
    const health = await legacy("GET", { key: READ });
    assert.equal(health.version, 55);
    assert.ok(health.privTabs.some((tab) => tab.name === "לומדים"));
    assert.equal((await legacy("GET", {})).privTabs, undefined);

    // Public writes keep only allowed columns and cannot register a coordinator device.
    const join = await legacy("POST", {
      action: "row",
      tab: "לומדים",
      cols: JSON.stringify([
        ["מזהה", "KID4"],
        ["שם", "New"],
        ["משפחה", "Learner"],
        ["קוד ישיבה", "S2"],
        ["סוד", "x"],
      ]),
    });
    assert.equal(join.status, "success");
    const institutions = await legacy("GET", { read: "מוסדות" });
    assert.equal(institutions.rows.find((row) => row[0] === "S2")[3], "TRUE");
    const learnersTable = await legacy("GET", { read: "לומדים", key: READ });
    assert.ok(!learnersTable.rows[0].includes("סוד"));
    assert.deepEqual(learnersTable.pairs.KID1.pids, ["DAD1"]);
    assert.equal((await legacy("GET", { read: "לומדים" })).status, "error");
    assert.equal(
      (await legacy("GET", { read: "public:לומדים" })).status,
      "error",
    );
    assert.equal(
      (
        await legacy("POST", {
          action: "row",
          tab: "התראות",
          cols: JSON.stringify([
            ["מזהה", "X"],
            ["תפקיד", "רכז"],
          ]),
        })
      ).status,
      "denied",
    );
    assert.equal(
      (await legacy("POST", { action: "row", tab: "קודים", cols: "[]" }))
        .status,
      "denied",
    );

    // Device progress and shared-learning confirmations.
    assert.deepEqual(await legacy("GET", { mark: "KID1", wk: "taanit|2" }), {
      status: "ok",
      at: 3,
      done: false,
    });
    assert.equal(
      (await legacy("GET", { pair: "KID1", wk: "taanit|2" })).has,
      true,
    );
    assert.deepEqual(
      (await legacy("GET", { pendingFor: "050-000-0002" })).pending,
      { id: "KID1", track: "taanit", wk: "2" },
    );
    assert.equal(
      (await legacy("GET", { pairok: "KID1", wk: "taanit|2", yes: "1" })).set,
      1,
    );
    assert.equal(
      (await legacy("GET", { pendingFor: "0500000002" })).pending,
      null,
    );
    assert.equal((await legacy("GET", { arrived: "DAD1B" })).has, true);

    // Help requests are public; marking them handled needs the read key and a real row.
    assert.equal(
      (await legacy("GET", { help: "1", name: "Example", phone: "050" }))
        .status,
      "error",
    );
    assert.equal(
      (
        await legacy("GET", {
          help: "1",
          name: "Example",
          phone: "0500000001",
          what: "install",
        })
      ).status,
      "ok",
    );
    assert.equal((await legacy("GET", { helpdone: "2" })).status, "denied");
    assert.equal(
      (await legacy("GET", { helpdone: "9", key: READ })).status,
      "error",
    );
    assert.equal(
      (await legacy("GET", { helpdone: "2", key: READ })).status,
      "ok",
    );
    const stuck = await legacy("GET", { read: "תקועים", key: READ });
    assert.ok(stuck.rows[1][stuck.rows[0].indexOf("טופל")]);

    // Staff access: waiting until approved, then the school code; codes rotate only with the key.
    assert.equal(
      (await legacy("GET", { acc: "S1", dev: "STAFFDEVICE1" })).status,
      "wait",
    );
    assert.equal(
      (await legacy("GET", { accset: "STAFFDEVICE1", st: "אושר" })).status,
      "denied",
    );
    assert.equal(
      (await legacy("GET", { accset: "STAFFDEVICE1", st: "אושר", key: READ }))
        .status,
      "ok",
    );
    assert.deepEqual(await legacy("GET", { acc: "S1", dev: "STAFFDEVICE1" }), {
      status: "ok",
      k: "abc234",
    });
    const rotated = await legacy("GET", { newcode: "S1", key: READ });
    assert.match(rotated.code, /^[a-z2-9]{6}$/);
    assert.equal(
      (await legacy("GET", { codes: "1", key: READ })).codes.S1,
      rotated.code,
    );

    // Registrations flag a second contact and mark the institution with its tractates.
    await legacy("POST", {
      action: "register",
      inst: "School A",
      code: "S1",
      who: "Head Two",
      phone: "0500000012",
      total: 30,
      mas: ["taanit"],
    });
    const conflicts = await legacy("GET", {
      read: "התנגשויות הרשמה",
      key: READ,
    });
    assert.equal(conflicts.rows.length, 2);
    assert.equal(
      (await legacy("GET", { read: "מוסדות" })).rows.find(
        (row) => row[0] === "S1",
      )[4],
      "taanit",
    );
    assert.equal(
      (await legacy("GET", { conflictdone: "2", key: READ })).status,
      "ok",
    );
    assert.equal(
      (
        await legacy("POST", {
          action: "quiz",
          week: "2",
          inst: "S1",
          name: "N",
          phone: "P",
          answer: 1,
          correct: true,
        })
      ).status,
      "success",
    );

    // Contacts merge without overwriting existing cells.
    const created = await legacy("GET", {
      key: READ,
      contactSave: JSON.stringify({
        name: "School B",
        people: [{ name: "B1", phone: "0500000020" }],
      }),
    });
    assert.equal(created.created, 1);
    const merged = await legacy("GET", {
      key: READ,
      contactSave: JSON.stringify({
        name: "School A",
        people: [
          { name: "Contact", phone: "0500000011" },
          { name: "New", phone: "0500000021" },
        ],
      }),
    });
    assert.deepEqual([merged.created, merged.added], [0, 1]);
    const contacts = await legacy("GET", { read: "אנשי קשר", key: READ });
    assert.deepEqual(contacts.rows[1], [
      "School A",
      "Contact",
      "0500000011",
      "New",
      "0500000021",
    ]);

    // Archive is reversible and keeps people in sync.
    assert.equal(
      (await legacy("GET", { archive: "KID4", key: READ })).moved,
      1,
    );
    assert.equal(
      (await legacy("GET", { archived: "1", key: READ })).people[0].id,
      "KID4",
    );
    assert.equal((await legacy("GET", { idFor: "KID4" })).id, "");
    assert.equal(
      (await legacy("GET", { unarchive: "KID4", key: READ })).restored,
      1,
    );
    assert.equal((await legacy("GET", { idFor: "KID4" })).id, "KID4");

    // Duplicate registrations of one person merge under the first ID.
    const deduped = await legacy("GET", { dedupe: "1", key: READ });
    assert.equal(deduped.merged, 1);
    assert.equal((await legacy("GET", { idFor: "KID3" })).id, "KID2");

    // Station edits relink learning and create a stable learner for unknown names.
    assert.equal(
      (
        await legacy("POST", {
          action: "amdakind",
          key: READ,
          day: "2026-10-09",
          slot: "A",
          kind: "d",
          track: "taanit",
          daf: "ג",
          lvl: "",
        })
      ).rows,
      1,
    );
    const station = await legacy("GET", { read: "עמדה — שיוך", key: READ });
    assert.equal(station.rows[1][station.rows[0].indexOf("מזהה")], "KID1");
    assert.deepEqual((await legacy("GET", { amdaFor: "KID1" })).learned, [
      "taanit|2",
    ]);

    // Destructive and source-owned operations stay guarded.
    assert.equal((await legacy("GET", { clear: "טקסטים" })).status, "denied");
    assert.equal(
      (
        await legacy("POST", {
          action: "table",
          key: READ,
          tab: "מצב ישיבות",
          cols: "[]",
          rows: "[]",
        })
      ).status,
      "denied",
    );
    assert.equal(
      (
        await legacy("POST", {
          action: "texts",
          key: READ,
          rows: JSON.stringify([{ key: "a", value: "b" }]),
        })
      ).status,
      "success",
    );
    assert.deepEqual((await legacy("GET", { read: "טקסטים" })).rows, [
      ["מפתח", "נוסח"],
      ["a", "b"],
    ]);
    assert.equal(
      (
        await legacy("GET", {
          delrow: "זוגות",
          col: "מזהה",
          vals: JSON.stringify(["KID1"]),
          key: READ,
        })
      ).removed,
      1,
    );
    assert.equal(
      (await legacy("GET", { recount: "1", key: READ })).status,
      "ok",
    );
    assert.equal(
      (await legacy("GET", { setup: "clockstate", key: READ })).clock,
      true,
    );
    await assert.rejects(legacy("GET", { file: "ID" }));
  },
);
