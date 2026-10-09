import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { parseCsv } from "../src/lib/csv.ts";
import { parseLesson, segmentRects } from "../src/lib/lesson.ts";
const rows = parseCsv(await fs.readFile("tests/fixtures/lesson.csv", "utf8"));
const original = await fs.readFile("src/shared/stepid.js", "utf8");
const reference = {};
vm.createContext(reference);
vm.runInContext(original, reference);
test("typed lesson parser preserves original order, IDs and page continuations", () => {
  const previous = reference.SidFlat(reference.SidParse(rows), "taanit", "ב");
  for (const amud of [0, 1, 2]) {
    const allowed = new Set(
      previous.flat
        .filter(
          (segment) =>
            segment.part === 1 &&
            (!amud || (previous.pages[segment.p].pg === 2 ? 2 : 1) === amud),
        )
        .map((segment) => segment.n),
    );
    const expected = previous.flat.filter((segment) => allowed.has(segment.n));
    const current = parseLesson(rows, "taanit", "ב", amud);
    assert.equal(current.groups, previous.groups);
    assert.deepEqual(
      current.segments.map((segment) => [
        segment.page,
        segment.number,
        segment.id,
        segment.parts,
        segment.part,
      ]),
      JSON.parse(
        JSON.stringify(
          expected.map((segment) => [
            segment.p,
            segment.n,
            segment.id,
            segment.parts,
            segment.part,
          ]),
        ),
      ),
    );
  }
});
test("whole segment follows its first page even when it continues on the next page", () => {
  const data = { w: 1000, h: 2000, zones: [], steps: [{ id: "first" }] };
  const next = { ...data, steps: [{ cont: true }, { id: "second" }] };
  const input = [
    ["taanit", "ב", "0|1", JSON.stringify(data)],
    ["taanit", "ב", "0|2", JSON.stringify(next)],
  ];
  assert.equal(parseLesson(input, "taanit", "ב", 1).segments.length, 2);
  assert.equal(parseLesson(input, "taanit", "ב", 2).segments[0].id, "second");
});
test("tail of next daf retains stable identity and is included in the current daf", () => {
  const data = { w: 1000, h: 2000, zones: [], steps: [{ id: "start" }] };
  const next = {
    ...data,
    prev: 1,
    prevDaf: "ב",
    steps: [{ cont: true }, { id: "next" }],
  };
  const input = [
    ["taanit", "ב", "0|2", JSON.stringify(data)],
    ["taanit", "ג", "0|1", JSON.stringify(next)],
  ];
  const current = parseLesson(input, "taanit", "ב", 2);
  assert.equal(current.segments.length, 2);
  assert.equal(current.segments[1].id, "start");
  assert.equal(parseLesson(input, "taanit", "ג").segments[0].id, "next");
});
test("RTL rectangle fractions align with normalized scan coordinates", () => {
  const rects = segmentRects(
    { zones: [{ a: 0.2, b: 0.8, lines: [[0.1, 0.2]] }] },
    { g: { from: { line: 0, x: 0.25 }, to: { line: 0, x: 0.75 } } },
  );
  assert.ok(Math.abs(rects[0].left - 0.35) < 1e-9);
  assert.ok(Math.abs(rects[0].width - 0.3) < 1e-9);
});
