import { Effect } from "effect";

// Loaded on demand. Native animations own every frame; Effect owns their lifetime.
function finished(animation: Animation) {
  return Effect.tryPromise({
    try: async (signal) => {
      const cancel = () => animation.cancel();
      signal.addEventListener("abort", cancel, { once: true });
      try {
        return await animation.finished;
      } finally {
        signal.removeEventListener("abort", cancel);
      }
    },
    catch: () => new Error("Animation interrupted"),
  });
}
function play(
  element: Element,
  frames: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  return Effect.acquireUseRelease(
    Effect.sync(() => element.animate(frames, options)),
    finished,
    (animation) => Effect.sync(() => animation.cancel()),
  );
}
export function finish(animation: Animation, signal?: AbortSignal) {
  return Effect.runPromise(finished(animation), { signal });
}
export function enter(element: HTMLElement, signal: AbortSignal) {
  const back = element.classList.contains("is-back");
  const horizontal = element.classList.contains("flow-step");
  const community =
    element.parentElement?.classList.contains("community-panel");
  const frames = [
    {
      opacity: 0,
      transform: community
        ? `translateX(${element.parentElement?.id === "community-reminders" ? -12 : 12}px)`
        : horizontal
          ? `translateX(${back ? 16 : -16}px)`
          : "translateY(10px)",
    },
    { opacity: 1, transform: "none" },
  ];
  return Effect.runPromise(
    play(element, frames, {
      duration: 360,
      delay: element.classList.contains("community-action") ? 55 : 0,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "both",
    }),
    { signal },
  );
}
export function reading(lines: HTMLElement[], signal: AbortSignal) {
  return Effect.runPromise(
    Effect.forever(
      Effect.forEach(
        lines,
        (line, index) =>
          Effect.gen(function* () {
            yield* Effect.sleep(index * 100);
            yield* play(
              line,
              [
                { opacity: 0.25, transform: "scaleX(.72)" },
                { opacity: 1, transform: "scaleX(1)", offset: 0.45 },
                { opacity: 0.25, transform: "scaleX(.72)" },
              ],
              {
                duration: 1250,
                easing: "cubic-bezier(.4,0,.2,1)",
                fill: "both",
              },
            );
          }),
        { concurrency: "unbounded" },
      ),
    ),
    { signal },
  );
}
