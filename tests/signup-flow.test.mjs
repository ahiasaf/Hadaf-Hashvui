import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyAnswers,
  parseDraft,
  restoreSteps,
  stepValid,
  stepsFor,
} from "../src/lib/signup-flow.ts";

test("the partner step only appears when learning with someone", () => {
  assert.deepEqual(stepsFor({ way: "solo" }), [
    "role",
    "name",
    "phone",
    "inst",
    "grade",
    "way",
    "confirm",
  ]);
  assert.equal(stepsFor({ way: "dad" })[6], "partner");
  assert.equal(stepsFor({ way: "chav" }).length, 8);
  assert.deepEqual(restoreSteps, ["name", "phone", "confirm"]);
});

test("each step validates its own answers", () => {
  const answers = { ...emptyAnswers, first: "ישראל", last: "כהן" };
  assert.equal(stepValid("name", answers), true);
  assert.equal(stepValid("name", { ...answers, last: " " }), false);
  assert.equal(stepValid("phone", { ...answers, phone: "0501111111" }), true);
  assert.equal(stepValid("phone", { ...answers, phone: "1234" }), false);
  assert.equal(stepValid("inst", answers), false);
  assert.equal(stepValid("confirm", answers), true);
});

test("a saved draft resumes at its step and ignores junk", () => {
  const draft = parseDraft({
    step: 4,
    answers: { ...emptyAnswers, first: "משה", way: "chav", extra: 1 },
  });
  assert.equal(draft.step, 4);
  assert.equal(draft.answers.first, "משה");
  assert.equal("extra" in draft.answers, false);
  assert.equal(parseDraft({ step: 99, answers: emptyAnswers }).step, 7);
  assert.equal(
    parseDraft({ step: 99, answers: emptyAnswers, restore: true }).step,
    3,
  );
  assert.equal(parseDraft("nope"), null);
  assert.equal(parseDraft({ step: 2 }), null);
});
