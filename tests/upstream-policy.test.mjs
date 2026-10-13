import test from "node:test";
import assert from "node:assert/strict";
import {
  schoolGrant,
  networkRoster,
  attendanceCells,
  removeAnchorPaths,
  stableIdPlan,
} from "../src/server/upstream-policy.ts";
test("staff approval is scoped to the device and its current school", () => {
  const rows = [
    ["מזהה", "קוד ישיבה", "מצב"],
    ["DEVICE1", "S1", "אושר"],
    ["DEVICE2", "S1", "נעול"],
    ["DEVICE3", "S1", "ממתין"],
  ];
  assert.equal(schoolGrant(rows, "S1", "DEVICE1"), "ok");
  assert.equal(schoolGrant(rows, "S2", "DEVICE1"), "unknown");
  assert.equal(schoolGrant(rows, "S1", ""), "unknown");
  assert.equal(schoolGrant(rows, "S1", "DEVICE2"), "locked");
  assert.equal(schoolGrant(rows, "S1", "DEVICE3"), "wait");
});
test("network attendance exposes only seventh and eighth grade names in the approved school", () => {
  const rows = [
    ["קוד ישיבה", "שכבה", "כיתה", "משפחה", "פרטי", "טלפון"],
    ["S1", "ז׳", "2", "Family", "First", "PRIVATE"],
    ["S1", "ח", "1", "Other", "Second", "PRIVATE"],
    ["S1", "ט", "1", "Old", "Student", "PRIVATE"],
    ["S2", "ז", "1", "Other", "School", "PRIVATE"],
  ];
  assert.deepEqual(networkRoster(rows, "S1"), [
    ["ז", "2", "Family First"],
    ["ח", "1", "Other Second"],
  ]);
  assert.ok(!JSON.stringify(networkRoster(rows, "S1")).includes("PRIVATE"));
  assert.deepEqual(
    attendanceCells(
      [
        ["שם", "Example"],
        ["קוד ישיבה", "S2"],
        ["טלפון", "PRIVATE"],
      ],
      "S1",
    ),
    [
      ["שם", "Example"],
      ["קוד ישיבה", "S1"],
    ],
  );
});
test("removed slide anchors preserve numeric anchors and all metadata", () => {
  const changed = removeAnchorPaths(
    JSON.stringify({
      A: "slides/taanit-1/01.jpg",
      B: 2,
      __cover: "slides/taanit-1/01.jpg",
      C: "slides/taanit-1/02.jpg",
    }),
    new Set(["slides/taanit-1/01.jpg"]),
  );
  assert.deepEqual(changed.removed, [
    { key: "A", val: "slides/taanit-1/01.jpg" },
  ]);
  assert.deepEqual(JSON.parse(changed.next), {
    B: 2,
    __cover: "slides/taanit-1/01.jpg",
    C: "slides/taanit-1/02.jpg",
  });
});
test("stable ID migration rejects stale snapshots, destructive plans and unrelated edits", () => {
  const head = ["מסכת", "דף", "פירוש"],
    rows = [head, ["taanit", "ב", "OLD"]];
  assert.equal(
    stableIdPlan(
      "פירוש",
      rows,
      [head, ["taanit", "ב", "STALE"]],
      [["taanit", "ב", "NEW"]],
      head,
    ).status,
    "changed",
  );
  assert.throws(
    () => stableIdPlan("פירוש", rows, rows, [], head),
    /removes rows/,
  );
  assert.throws(
    () => stableIdPlan("פירוש", rows, rows, [["megila", "ב", "NEW"]], head),
    /another column/,
  );
  const valid = stableIdPlan(
    "פירוש",
    rows,
    rows,
    [
      ["taanit", "ב", "NEW"],
      ["taanit", "ג", "NEW"],
    ],
    head,
  );
  assert.equal(valid.status, "ok");
  assert.equal(valid.cells, 1);
  assert.equal(valid.added, 1);
});

import { deckCovers } from "../src/lib/deck-covers.ts";
test("published covers choose the explicit slide and reject external or traversal URLs", () => {
  const head = ["מסכת", "שבוע", "תיקייה", "קבצים", "כותרת", "שער"];
  assert.deepEqual(
    deckCovers([
      head,
      ["taanit", "2", "slides/taanit-2", "01.jpg,02.jpg", "Title", "02.jpg"],
    ]),
    { "taanit-2": { src: "/slides/taanit-2/02.jpg", title: "Title" } },
  );
  assert.equal(
    deckCovers([head, ["taanit", "1", "slides/taanit-1", "01.jpg", "", ""]])[
      "taanit-1"
    ].src,
    "/slides/taanit-1/01.jpg",
  );
  for (const cover of [
    "https://example.com/slide.jpg",
    "../PRIVATE.jpg",
    "slides/taanit-1/../PRIVATE.jpg",
  ])
    assert.equal(
      deckCovers([
        head,
        ["taanit", "1", "slides/taanit-1", "01.jpg", "", cover],
      ])["taanit-1"].src,
      "",
    );
});
