import test from "node:test";
import assert from "node:assert/strict";
import { enter, reading, finish } from "../src/lib/effect-animation.ts";

function fixture(complete = false) {
  const animations = [];
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const element = {
    classList: { contains: () => false },
    parentElement: null,
    animate: (_frames, options) => {
      let resolve, reject;
      const animation = {
        options,
        cancelled: false,
        finished: new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        }),
        cancel: () => {
          animation.cancelled = true;
          reject(new Error("Cancelled"));
        },
      };
      animations.push(animation);
      markStarted();
      if (complete) globalThis.queueMicrotask(() => resolve(animation));
      return animation;
    },
  };
  return { element, animations, started };
}
test("Effect entrance releases its native animation after completion", async () => {
  const { element, animations } = fixture(true);
  await enter(element, new AbortController().signal);
  assert.equal(animations.length, 1);
  assert.equal(animations[0].cancelled, true);
});
test("Effect reading cancellation releases active animations and stops queued rows", async () => {
  const { element, animations, started } = fixture();
  const controller = new AbortController();
  const pending = reading(
    [element, element, element, element],
    controller.signal,
  );
  const rejected = assert.rejects(pending);
  await started;
  controller.abort();
  await rejected;
  assert.equal(animations.length, 1);
  assert.equal(animations[0].cancelled, true);
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(animations.length, 1);
});
test("Effect cancels an existing dismissal animation when its request is replaced", async () => {
  const { element, animations } = fixture();
  const animation = element.animate([], {});
  const controller = new AbortController();
  const pending = finish(animation, controller.signal);
  const rejected = assert.rejects(pending);
  controller.abort();
  await rejected;
  assert.equal(animations[0].cancelled, true);
});
