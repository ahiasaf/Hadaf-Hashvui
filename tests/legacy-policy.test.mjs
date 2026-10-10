import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  contactCells,
  legacyGetRoute,
  legacyPostRoute,
  markProgress,
  pairMap,
  pairSeen,
  pendingFor,
  planStationSync,
  stationLearnerId,
} from "../src/server/legacy-policy.ts";

test("legacy reads follow the source precedence and classify side effects", () => {
  assert.deepEqual(legacyGetRoute({ file: "X", help: "1" }), {
    name: "file",
    write: false,
  });
  assert.deepEqual(legacyGetRoute({ mark: "A", board: "B" }), {
    name: "mark",
    write: false,
  });
  assert.equal(legacyGetRoute({ acc: "S", dev: "D" }).write, true);
  assert.equal(legacyGetRoute({ codes: "1" }).write, false);
  assert.equal(legacyGetRoute({ newcode: "S" }).write, true);
  assert.equal(legacyGetRoute({ archived: "1" }).write, false);
  assert.equal(legacyGetRoute({ archive: "ID" }).write, true);
  assert.equal(legacyGetRoute({ read: "לומדים" }).write, false);
  assert.equal(legacyGetRoute({ read: "עמדת לימוד" }).write, true);
  assert.deepEqual(legacyGetRoute({ key: "K" }), {
    name: "health",
    write: false,
  });
  assert.deepEqual(legacyPostRoute({ action: "quiz" }), {
    name: "quiz",
    write: true,
  });
});

test("every routed legacy operation has a Neon handler", async () => {
  const source = await fs.readFile("src/server/legacy-neon.ts", "utf8");
  const policy = await fs.readFile("src/server/legacy-policy.ts", "utf8");
  const handled = new Set(
    [...source.matchAll(/case "([A-Za-z]+)":/g)].map((match) => match[1]),
  );
  const routed = [...policy.matchAll(/\["([A-Za-z]+)", \(p\)/g)].map(
    (match) => match[1],
  );
  // Files stay on Drive; pairFor has no caller in this application.
  const missing = routed.filter(
    (name) => !handled.has(name) && !["file", "pairFor"].includes(name),
  );
  assert.deepEqual(missing, []);
  for (const action of [
    "row",
    "table",
    "teamlog",
    "ghput",
    "ghdel",
    "clear",
    "delrow",
    "register",
    "quiz",
    "amdakind",
    "texts",
  ])
    assert.ok(handled.has(action), action);
});

const people = [
  [
    "מזהה",
    "שם",
    "משפחה",
    "תפקיד",
    "טלפון",
    "טלפון ההורה",
    "מזהה המזמין",
    "מזהים נוספים",
  ],
  ["KID", "Example", "Family", "תלמיד", "050-000-0001", "050-000-0002", "", ""],
  ["DAD", "Parent", "Family", "הורה", "+972 50 000 0002", "", "", "DAD2"],
  ["KID2", "Second", "Other", "תלמיד", "", "", "DAD2", ""],
];
test("pair map links parents and students by phone and invitation alias", () => {
  const pairs = pairMap(people);
  assert.deepEqual(pairs.KID, { with: "Parent", ok: 1, pids: ["DAD"] });
  assert.deepEqual(pairs.DAD.pids.sort(), ["KID", "KID2"]);
  assert.equal(pairs.KID2.with, "Parent");
});

test("progress, pair confirmations and pending reports match the source rules", () => {
  const progress = [
    ["מזהה", "מסלול", "שבוע", "קטע", "מתוך"],
    ["A", "taanit", "2", "3", "8"],
    ["A", "taanit", "2", "5", "8"],
    ["A", "megila", "1", "", ""],
  ];
  assert.deepEqual(markProgress(progress, "A", "taanit|2"), {
    at: 5,
    done: false,
  });
  assert.deepEqual(markProgress(progress, "A", "megila|1"), {
    at: 1,
    done: true,
  });
  const pairs = [
    ["מזהה", "מסלול", "שבוע", "דיווח", "טלפון השותף", "אושר"],
    ["KID", "taanit", "2", "הבן", "0500000002", ""],
    ["DAD", "taanit", "3", "ההורה", "0500000001", "כן"],
  ];
  assert.deepEqual(pendingFor(pairs, "050-000-0002"), {
    id: "KID",
    track: "taanit",
    wk: "2",
  });
  assert.equal(pendingFor(pairs, "0599999999"), null);
  assert.deepEqual(pairSeen(pairs, "+972500000001", "taanit|3", "kid"), {
    id: "DAD",
    ok: "כן",
  });
  assert.equal(pairSeen(pairs, "0500000001", "taanit|3", "parent"), null);
});

test("contact saves append only unknown names and phones", () => {
  assert.deepEqual(contactCells([{ name: "A", phone: "0501234567" }]), [
    "A",
    "0501234567",
  ]);
  assert.deepEqual(
    contactCells(
      [
        { name: "A", phone: "0500000000" },
        { name: "B", phone: "050-123-4567" },
        { name: "C", phone: "0507654321" },
      ],
      ["School", "‎A", "0501234567"],
    ),
    ["C", "0507654321"],
  );
});

test("station sync links known students and creates stable learners once", () => {
  const station = [
    ["סוג", "קוד ישיבה", "שכבה", "כיתה", "שם", "מסלול", "שבוע", "דף", "רמה"],
    ["דף", "S1", "ט", "2", "Family Example", "taanit", "2", "ג", "חידון"],
    ["דף", "S1", "ט", "2", "Unknown Person", "taanit", "2", "ג", ""],
    ["דף", "S1", "ט", "2", "Unknown Person", "taanit", "2", "ג", ""],
    ["דף", "S1", "ט", "2", "Only There", "taanit", "2", "ג", "השתתף"],
    ["שיעור", "S1", "ט", "2", "Family Example", "", "", "", ""],
  ];
  const learners = [
    ["מזהה", "שם", "משפחה", "קוד ישיבה", "שכבה", "כיתה", "תפקיד", "ישיבה"],
    ["KID", "Example", "Family", "S1", "ט", "2", "תלמיד", "School"],
  ];
  const plan = planStationSync(
    station,
    [["מזהה", "מסלול", "שבוע", "מפתח"]],
    learners,
    {},
  );
  assert.equal(plan.links.length, 2);
  assert.equal(plan.progress.length, 2);
  assert.equal(plan.quizzes.length, 1);
  assert.equal(plan.learners.length, 1);
  const created = Object.fromEntries(plan.learners[0]);
  assert.equal(
    created["מזהה"],
    stationLearnerId("S1", "ט", "2", "Unknown Person"),
  );
  assert.match(created["מזהה"], /^Am[A-Za-z0-9]{12}$/);
  assert.equal(created["ישיבה"], "School");
  const linked = plan.links.map((link) => Object.fromEntries(link));
  const again = planStationSync(
    station,
    [
      ["מזהה", "מסלול", "שבוע", "מפתח"],
      ...linked.map((l) => [l["מזהה"], l["מסלול"], l["שבוע"], l["מפתח"]]),
    ],
    learners,
    {},
  );
  assert.equal(again.links.length + again.progress.length, 0);
});
