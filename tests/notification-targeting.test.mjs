import test from "node:test";
import assert from "node:assert/strict";
import {
  selectRecipients,
  filterAudience,
  parseAudienceFilter,
  personalize,
} from "../src/server/notification-recipients.ts";
import { parseWhen } from "../src/server/notification-digest.ts";
const subscription = (name) =>
  JSON.stringify({
    endpoint: "https://example.test/" + name,
    keys: { auth: "TEST_AUTH", p256dh: "TEST_KEY" },
  });
const headers = ["מזהה", "מנוי", "שכבה", "כיתה", "תפקיד", "דף"];
test("latest device permissions and class prevent stale targeting", () => {
  const rows = [
    headers,
    ["DEVICE", subscription("old"), "9", "A", "תלמיד", ""],
    ["DEVICE", subscription("new"), "10", "B", "הורה", ""],
  ];
  assert.equal(selectRecipients(rows, { grade: "9" }).recipients.length, 0);
  assert.equal(selectRecipients(rows, { role: "תלמיד" }).recipients.length, 0);
  assert.equal(
    selectRecipients([...rows, ["DEVICE", "", "10", "B", "הורה", ""]])
      .recipients.length,
    0,
  );
  assert.throws(
    () => selectRecipients([["מנוי"], [subscription("one")]], { grade: "9" }),
    /columns/,
  );
});
test("a device can request separate daf notifications", () => {
  const rows = [
    headers,
    ["DEVICE", subscription("one"), "", "", "", "taanit|2"],
    ["DEVICE", subscription("one"), "", "", "", "taanit|3"],
  ];
  assert.equal(
    selectRecipients(rows, { wait: "taanit|2" }).recipients.length,
    1,
  );
});
test("canonical aliases share completion while removed aliases stay detached", () => {
  const recipient = selectRecipients([
    headers,
    ["DEVICE", subscription("one"), "", "", "", ""],
  ]).recipients;
  const people = [
    ["מזהה", "מזהים נוספים", "שם", "מסגרת"],
    ["PERSON", "OLD DEVICE", "Example", "school"],
    ["PERSON", "DEVICE", "Example", "school"],
  ];
  const progress = [
    ["מזהה", "שבוע", "קטע", "מתוך"],
    ["PERSON", "2", "4", "4"],
    ["DEVICE", "2", "1", "4"],
  ];
  const completed = filterAudience(
    recipient,
    { wk: 2, seg: "done", ids: ["PERSON"] },
    people,
    progress,
  );
  assert.equal(completed.length, 1);
  assert.equal(completed[0].first, "Example");
  assert.equal(
    filterAudience(recipient, { wk: 2, seg: "todo" }, people, progress).length,
    0,
  );
  const staleProgress = [
    ["מזהה", "שבוע", "קטע", "מתוך"],
    ["OLD", "2", "4", "4"],
  ];
  assert.equal(
    filterAudience(recipient, { wk: 2, seg: "done" }, people, staleProgress)
      .length,
    0,
  );
});
test("invalid segments fail closed and missing names leave no placeholder", () => {
  for (const value of [
    { seg: "done" },
    { seg: "done", wk: 61 },
    { ids: ["bad id"] },
    { ids: Array(61).fill("ID") },
    { par: "p" },
  ])
    assert.throws(
      () => parseAudienceFilter(JSON.stringify(value)),
      /filter|week/,
    );
  assert.equal(parseAudienceFilter('{"seg":"done","wk":"2"}').wk, 2);
  assert.equal(personalize("{name}, דף חדש מחכה לך.", ""), "דף חדש מחכה לך.");
});
test("digest schedules reject invalid hours while retaining multiple choices", () => {
  assert.deepEqual(parseWhen("5@09:00;0@18:30"), [
    { d: "5", t: "09:00" },
    { d: "0", t: "18:30" },
  ]);
  assert.deepEqual(parseWhen("5@25:00"), []);
  assert.deepEqual(parseWhen("off"), []);
});
test("parent targeting follows scoped children and canonical device links", async () => {
  const { parentNotificationTargets } =
    await import("../src/server/parent-notification-targets.ts");
  const people = [
    [
      "מזהה",
      "שם",
      "תפקיד",
      "קוד ישיבה",
      "שכבה",
      "כיתה",
      "טלפון",
      "טלפון ההורה",
      "מזהים נוספים",
      "מזהה המזמין",
    ],
    [
      "CHILD",
      "Example",
      "תלמיד",
      "demo",
      "9",
      "A",
      "0501111111",
      "0509998888",
      "CHILD_DEVICE",
      "",
    ],
    [
      "PARENT",
      "ExampleParent",
      "הורה",
      "other",
      "",
      "",
      "0509998888",
      "",
      "PARENT_DEVICE",
      "",
    ],
    [
      "OTHER_CHILD",
      "OtherExample",
      "תלמיד",
      "other",
      "9",
      "A",
      "0500000000",
      "0501111111",
      "",
      "",
    ],
    [
      "OTHER_PARENT",
      "OtherParent",
      "הורה",
      "other",
      "",
      "",
      "0501111111",
      "",
      "",
      "",
    ],
  ];
  const progress = [
    ["מזהה", "שבוע", "קטע", "מתוך"],
    ["CHILD_DEVICE", "2", "4", "4"],
  ];
  const parents = parentNotificationTargets(
    people,
    progress,
    { seg: "done", wk: 2 },
    "demo",
    "9",
    "A",
    false,
  );
  assert.deepEqual([...parents].sort(), ["PARENT", "PARENT_DEVICE"]);
  const both = parentNotificationTargets(
    people,
    progress,
    {},
    "demo",
    "9",
    "A",
    true,
  );
  assert.ok(both.has("CHILD_DEVICE"));
  assert.ok(!both.has("OTHER_PARENT"));
  assert.equal(
    parentNotificationTargets(
      people,
      progress,
      { seg: "todo", wk: 2 },
      "demo",
      "9",
      "A",
      false,
    ).size,
    0,
  );
});
