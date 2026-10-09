import test from "node:test";
import assert from "node:assert/strict";
import { prepareSnapshot } from "../src/server/snapshot.ts";
const source = {
  version: 1,
  capturedAt: "2026-10-09T00:00:00Z",
  tables: [
    {
      name: "לומדים",
      rows: [
        ["מזהה", "שם", "משפחה", "קוד ישיבה", "מזהים נוספים"],
        ["TEST", "Example", "Student", "demo", "DEVICE"],
      ],
    },
    {
      name: "לימוד",
      rows: [
        ["מזהה", "מסלול", "שבוע", "קטע", "מתוך"],
        ["DEVICE", "taanit", "1", "2", "4"],
        ["TEST", "taanit", "1", "4", "4"],
        ["UNREGISTERED", "megila", "2", "", ""],
      ],
    },
  ],
};
test("snapshot retains original rows, canonical device IDs and complete versus partial progress", () => {
  const plan = prepareSnapshot(source);
  assert.equal(plan.aliases.get("DEVICE"), "TEST");
  assert.equal(plan.progress[0].fraction, 0.5);
  assert.equal(plan.progress[0].complete, false);
  assert.equal(plan.progress[1].complete, true);
  assert.equal(plan.progress[2].cells["מזהה"], "UNREGISTERED");
  assert.deepEqual(plan.snapshot.tables, source.tables);
  assert.equal(plan.report.people, 1);
  assert.equal(plan.report.progress, 3);
  assert.match(plan.report.sourceHash, /^[a-f0-9]{64}$/);
});
test("ambiguous aliases, headers or missing source tables stop migration", () => {
  for (const change of [
    (x) =>
      x.tables[0].rows.push(["OTHER", "Other", "Student", "demo", "DEVICE"]),
    (x) => x.tables[0].rows[0].push("שם"),
    (x) => x.tables.pop(),
    (x) => (x.tables[1].rows[1][2] = "INVALID"),
  ]) {
    const input = globalThis.structuredClone(source);
    change(input);
    assert.throws(() => prepareSnapshot(input));
  }
});
