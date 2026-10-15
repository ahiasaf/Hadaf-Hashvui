import { Data, Effect } from "effect";

class AnimationInterrupted extends Data.TaggedError("AnimationInterrupted")<{
  readonly cause: unknown;
}> {}

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
    catch: (cause) => new AnimationInterrupted({ cause }),
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
function inView(element: Element) {
  const bounds = element.getBoundingClientRect();
  return (
    element.isConnected &&
    bounds.width > 0 &&
    bounds.height > 0 &&
    bounds.bottom > 0 &&
    bounds.top < innerHeight
  );
}
function ink(element: Element) {
  const paths = Array.from(
    element.querySelectorAll<SVGGeometryElement>(
      "svg[aria-hidden] path, svg[aria-hidden] circle, svg[aria-hidden] polyline",
    ),
  )
    .filter((path) => inView(path) && getComputedStyle(path).stroke !== "none")
    .slice(0, 4);
  return Effect.forEach(
    paths,
    (path, index) => {
      const length = path.getTotalLength();
      return play(
        path,
        [
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
        ],
        {
          duration: 460,
          delay: index * 35,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "both",
        },
      );
    },
    { concurrency: "unbounded" },
  );
}
function weekly(element: HTMLElement, signal: AbortSignal) {
  const text = Array.from(
    element.querySelectorAll<HTMLElement>(".lesson-text > *"),
  ).filter(inView);
  const showcase = element.querySelector<HTMLElement>(".showcase");
  const sheen = element.querySelector<HTMLElement>(".frame-sheen");
  const dots = Array.from(
    element.querySelectorAll<HTMLElement>(".dots .is-done"),
  ).filter(inView);
  const timing = {
    duration: 620,
    easing: "cubic-bezier(.16,1,.3,1)",
    fill: "both" as const,
  };
  return Effect.runPromise(
    Effect.all(
      [
        Effect.forEach(
          text,
          (child, index) =>
            play(
              child,
              [
                {
                  opacity: 0,
                  transform: "translateY(16px)",
                  clipPath: "inset(0 0 100% 0)",
                },
                { opacity: 1, transform: "none", clipPath: "inset(0)" },
              ],
              { ...timing, delay: index * 65 },
            ),
          { concurrency: "unbounded" },
        ),
        showcase && inView(showcase)
          ? play(
              showcase,
              [
                {
                  opacity: 0,
                  transform:
                    "perspective(1000px) rotateY(-9deg) translateY(18px) scale(.96)",
                },
                {
                  opacity: 1,
                  transform: "perspective(1000px) rotateY(2deg) scale(1.01)",
                  offset: 0.72,
                },
                { opacity: 1, transform: "none" },
              ],
              timing,
            )
          : Effect.void,
        sheen && inView(sheen)
          ? play(
              sheen,
              [
                { opacity: 0, transform: "translateX(80%)" },
                { opacity: 0.8, transform: "translateX(0)", offset: 0.45 },
                { opacity: 0, transform: "translateX(-80%)" },
              ],
              { ...timing, duration: 800, delay: 120 },
            )
          : Effect.void,
        Effect.forEach(
          dots,
          (dot, index) =>
            play(
              dot,
              [
                { transform: "scale(.55)", opacity: 0.3 },
                { transform: "scale(1.2)", opacity: 1, offset: 0.65 },
                { transform: "scale(1)", opacity: 1 },
              ],
              { ...timing, duration: 380, delay: 180 + index * 18 },
            ),
          { concurrency: "unbounded" },
        ),
      ],
      { concurrency: "unbounded" },
    ),
    { signal },
  );
}
// A single reading rhythm: short horizontal reveals, with no nested card flips.
function readingLayout(element: HTMLElement, signal: AbortSignal) {
  const grid = element.classList.contains("lesson-grid");
  const direction = grid ? Number(element.dataset.direction || 1) : 1;
  const nodes = Array.from(
    element.querySelectorAll<HTMLElement>(
      grid
        ? ":scope > .lesson-tile"
        : ".dashboard-copy > *, .dashboard-profile, .lesson-text > *, .showcase, .community-copy > *, :scope > .button, :scope > .reminders > *, .progress-summary > *, :scope > progress",
    ),
  )
    .filter(inView)
    .slice(0, 8);
  return Effect.runPromise(
    Effect.all(
      [
        Effect.forEach(
          nodes,
          (node, index) =>
            play(
              node,
              node.classList.contains("showcase")
                ? [
                    {
                      opacity: 0,
                      transform:
                        "perspective(1000px) translateY(12px) rotateX(5deg) scale(.98)",
                    },
                    { opacity: 1, transform: "none" },
                  ]
                : [
                    {
                      opacity: 0,
                      transform: `translateX(${direction * -14}px)`,
                      clipPath: "inset(0 0 0 8%)",
                    },
                    { opacity: 1, transform: "none", clipPath: "inset(0)" },
                  ],
              {
                duration: 380,
                delay: index * 38,
                easing: "cubic-bezier(.2,.8,.2,1)",
                fill: "both",
              },
            ),
          { concurrency: "unbounded" },
        ),
        ink(element),
      ],
      { concurrency: "unbounded" },
    ),
    { signal },
  );
}
export function enter(element: HTMLElement, signal: AbortSignal) {
  if (
    element.classList.contains("dashboard-welcome") ||
    element.classList.contains("lesson-grid") ||
    element.closest?.(".dashboard-band, .dashboard-details")
  )
    return readingLayout(element, signal);
  if (element.classList.contains("lesson-variant"))
    return weekly(element, signal);
  const back = element.classList.contains("is-back");
  const community =
    element.parentElement?.classList.contains("community-panel");
  const horizontal = element.classList.contains("flow-step");
  const direction =
    back || element.parentElement?.id === "community-reminders" ? 1 : -1;
  const children = Array.from(
    element.querySelectorAll<HTMLElement>(
      ":scope > h1, :scope > .flow-lead, :scope > .flow-form > *, :scope > header, :scope > .fld, :scope > .mascards > *, :scope > .rnav, :scope > .community-copy > *, :scope > .lesson-tile, :scope > .install-title, :scope > .install-launch-icon, :scope > .install-reopen > .install-text, :scope > .install-reopen > .install-handoff > li",
    ),
  )
    .filter(inView)
    .slice(0, 8);
  return Effect.runPromise(
    Effect.all(
      [
        play(
          element,
          [
            {
              opacity: 0,
              transform:
                horizontal || community
                  ? `translateX(${direction * 22}px)`
                  : "translateY(12px)",
            },
            { opacity: 1, transform: "none" },
          ],
          { duration: 420, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" },
        ),
        Effect.forEach(
          children,
          (child, index) =>
            play(
              child,
              [
                {
                  opacity: 0,
                  transform: "translateY(12px)",
                  clipPath: "inset(0 0 12% 0)",
                },
                { opacity: 1, transform: "none", clipPath: "inset(0 0 0 0)" },
              ],
              {
                duration: 400,
                delay: 45 + index * 32,
                easing: "cubic-bezier(.16,1,.3,1)",
                fill: "both",
              },
            ),
          { concurrency: "unbounded" },
        ),
        ink(element),
      ],
      { concurrency: "unbounded" },
    ),
    { signal },
  );
}
export function feedback(
  element: HTMLElement,
  kind: "press" | "tab",
  signal: AbortSignal,
) {
  const icon = kind === "tab" ? element.querySelector("svg") : null;
  const reminder = element.id === "community-reminders-tab";
  return Effect.runPromise(
    Effect.all(
      [
        play(
          icon || element,
          icon
            ? [
                {
                  transform: reminder
                    ? "rotate(-16deg)"
                    : "scale(.82) rotate(-8deg)",
                },
                {
                  transform: reminder
                    ? "rotate(10deg)"
                    : "scale(1.08) rotate(3deg)",
                  offset: 0.45,
                },
                {
                  transform: reminder ? "rotate(-5deg)" : "scale(.98)",
                  offset: 0.72,
                },
                { transform: "none" },
              ]
            : [
                { transform: "scale(.965)" },
                { transform: "scale(1.015)", offset: 0.65 },
                { transform: "none" },
              ],
          {
            duration: icon ? 480 : 260,
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "both",
          },
        ),
        kind === "tab" ? ink(element) : Effect.void,
      ],
      { concurrency: "unbounded" },
    ),
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
            yield* Effect.sleep(index * 140);
            yield* play(
              line,
              [
                { opacity: 0.2, transform: "scaleX(.08)" },
                { opacity: 1, transform: "scaleX(1)", offset: 0.48 },
                { opacity: 1, transform: "scaleX(1)", offset: 0.72 },
                { opacity: 0.2, transform: "scaleX(.08)" },
              ],
              {
                duration: 1750,
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
