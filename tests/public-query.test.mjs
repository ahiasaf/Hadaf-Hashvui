import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePublicQuery,
  compilePredicate,
  csvText,
} from "../src/server/public-query.ts";
test("public query parser preserves parentheses and uses parameterized literals", () => {
  const parsed = parsePublicQuery(
    'select A,B,C,D where A = "taanit" and (B = "ב" or B = "ג")',
  );
  assert.deepEqual(parsed.columns, [0, 1, 2, 3]);
  const parameters = ["סימוני הדף"];
  const sql = compilePredicate(parsed.predicate, parameters);
  assert.deepEqual(parameters, ["סימוני הדף", "taanit", "ב", "ג"]);
  assert.ok(sql.includes("AND") && sql.includes("OR"));
  assert.ok(!sql.includes("taanit"));
});
test("unsupported syntax and injection are rejected rather than forwarded", () => {
  for (const q of [
    "select A; DROP TABLE people",
    'select A where A = "x" limit 9',
    "select A where A = 3",
    'select A where (A = "x"',
    'select A where A="x" union select B',
  ])
    assert.throws(() => parsePublicQuery(q));
});
test("CSV output preserves quotes, line breaks and leading phone zeros", () => {
  assert.equal(
    csvText([
      ["שם", "טלפון"],
      ['a,b\n"c', "0500000000"],
    ]),
    'שם,טלפון\n"a,b\n""c",0500000000',
  );
});
