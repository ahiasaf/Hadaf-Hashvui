type Runtime = typeof import("./effect-animation");
let runtime: Runtime | undefined;
let loading: Promise<Runtime> | undefined;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const visible = (element: HTMLElement) => {
  const bounds = element.getBoundingClientRect();
  return (
    element.isConnected &&
    !document.hidden &&
    !reduced() &&
    !element.closest('[aria-hidden="true"], [hidden]') &&
    bounds.width > 0 &&
    bounds.height > 0 &&
    bounds.bottom > 0 &&
    bounds.top < innerHeight &&
    getComputedStyle(element).visibility !== "hidden"
  );
};
function warm() {
  return (loading ??= import("./effect-animation")
    .then((module) => (runtime = module))
    .catch((error) => {
      loading = undefined;
      throw error;
    }));
}
export function requestEffectEntrance(element: HTMLElement) {
  element.dispatchEvent(new CustomEvent("df-motion-enter", { bubbles: true }));
}
// Existing dismissal animations start immediately, even on the first uncached interaction.
export async function finishWithEffect(
  animation: Animation,
  signal?: AbortSignal,
) {
  const settled = animation.finished;
  settled.catch(() => undefined);
  const cancel = () => animation.cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    if (signal?.aborted) return;
    if (runtime) await runtime.finish(animation, signal);
    else {
      void warm().catch(() => undefined);
      await settled;
    }
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}

function initializeRegistrationHelp() {
  const transitions = new WeakMap<HTMLDetailsElement, AbortController>();
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const summary = event.target.closest(".registration-help > summary");
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    const content = details.querySelector<HTMLElement>(
      ".registration-audience",
    );
    if (!content) return;
    event.preventDefault();
    const opening = !details.open || details.hasAttribute("data-closing");
    const height = details.open ? content.getBoundingClientRect().height : 0;
    const style = getComputedStyle(content);
    const opacity = details.open ? style.opacity : "0";
    const paddingTop = details.open ? style.paddingTop : "0px";
    const paddingBottom = details.open ? style.paddingBottom : "0px";
    const previous = transitions.get(details);
    transitions.delete(details);
    previous?.abort();
    details.toggleAttribute("data-closing", !opening);
    if (reduced() || !visible(summary as HTMLElement) || !content.animate) {
      details.open = opening;
      details.removeAttribute("data-closing");
      content.style.overflow = "";
      return;
    }
    details.open = true;
    const controller = new AbortController();
    transitions.set(details, controller);
    content.style.overflow = "hidden";
    const animation = content.animate(
      [
        { height: `${height}px`, opacity, paddingTop, paddingBottom },
        {
          height: `${opening ? content.scrollHeight : 0}px`,
          opacity: opening ? 1 : 0,
          paddingTop: opening ? "4px" : "0px",
          paddingBottom: opening ? "16px" : "0px",
        },
      ],
      { duration: 280, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    );
    void finishWithEffect(animation, controller.signal)
      .catch(() => undefined)
      .finally(() => {
        if (transitions.get(details) !== controller) return;
        details.open = opening;
        details.removeAttribute("data-closing");
        content.style.overflow = "";
        animation.cancel();
        transitions.delete(details);
      });
  });
}

export function initializeEffectMotion() {
  initializeRegistrationHelp();
  if (!("IntersectionObserver" in window)) return;
  const active = new Map<HTMLElement, AbortController>();
  const veil = document.querySelector<HTMLElement>("#veil, #splash");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (!entry.isIntersecting) active.get(element)?.abort();
      else if (element === veil) syncLoader();
    }
  });
  const run = (
    element: HTMLElement,
    task: (engine: Runtime, signal: AbortSignal) => Promise<unknown>,
  ) => {
    if (!runtime || !visible(element) || typeof element.animate !== "function")
      return;
    active.get(element)?.abort();
    const controller = new AbortController();
    active.set(element, controller);
    observer.observe(element);
    element.setAttribute("data-effect-driven", "");
    void task(runtime, controller.signal)
      .catch(() => undefined)
      .finally(() => {
        if (active.get(element) !== controller) return;
        active.delete(element);
        if (element !== veil) observer.unobserve(element);
        else if (controller.signal.aborted && visible(element))
          queueMicrotask(syncLoader);
      });
  };
  function syncLoader() {
    if (!veil) return;
    if (
      veil.classList.contains("off") ||
      (veil.id === "veil" && veil.getAttribute("aria-busy") !== "true") ||
      !visible(veil)
    ) {
      active.get(veil)?.abort();
      return;
    }
    if (active.has(veil)) return;
    if (runtime)
      run(veil, (engine, signal) =>
        engine.reading(
          Array.from(
            veil.querySelectorAll<HTMLElement>(
              ".load-reading i, .splash-reading i",
            ),
          ),
          signal,
        ),
      );
    else
      void warm()
        .then(syncLoader)
        .catch(() => undefined);
  }
  const weeklyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting || !visible(element)) continue;
        weeklyObserver.unobserve(element);
        void warm()
          .then(() => {
            if (element.getAttribute("aria-hidden") !== "true")
              run(element, (engine, signal) => engine.enter(element, signal));
          })
          .catch(() => undefined);
      }
    },
    { threshold: 0.15 },
  );
  document
    .querySelectorAll<HTMLElement>(
      '.lesson-variant[aria-hidden="false"], .dashboard-welcome',
    )
    .forEach((element) => weeklyObserver.observe(element));
  document.addEventListener(
    "animationstart",
    (event) => {
      const element = event.target;
      if (
        !(element instanceof HTMLElement) ||
        !visible(element) ||
        !element.matches(
          ".flow-step, .rstep.on, .chb p, .community-panel > div, .lesson-grid, .install-guided, .dashboard-welcome",
        )
      )
        return;
      if (!runtime) {
        void warm().catch(() => undefined);
        return;
      }
      run(element, (engine, signal) => engine.enter(element, signal));
    },
    true,
  );
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>(
      "button:not(:disabled), a.button, a.btn",
    );
    if (!button || !visible(button)) return;
    const kind = button.matches("[role=tab][aria-selected=true]")
      ? "tab"
      : "press";
    if (runtime)
      run(button, (engine, signal) => engine.feedback(button, kind, signal));
  });
  document.addEventListener("df-motion-enter", (event) => {
    if (event.target instanceof HTMLElement) {
      if (!visible(event.target)) {
        weeklyObserver.observe(event.target);
        return;
      }
      if (runtime)
        run(event.target, (engine, signal) =>
          engine.enter(event.target as HTMLElement, signal),
        );
      else if (visible(event.target)) {
        const element = event.target;
        void warm()
          .then(() =>
            run(element, (engine, signal) => engine.enter(element, signal)),
          )
          .catch(() => undefined);
      }
    }
  });
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.target === veil) syncLoader();
      const element = record.target;
      if (
        element instanceof HTMLElement &&
        element.matches(".community-panel") &&
        record.attributeName === "hidden"
      ) {
        for (const child of Array.from(element.children)) {
          if (!(child instanceof HTMLElement)) continue;
          if (element.hidden) active.get(child)?.abort();
          else if (runtime)
            run(child, (engine, signal) => engine.enter(child, signal));
          else if (visible(child))
            void warm()
              .then(() =>
                run(child, (engine, signal) => engine.enter(child, signal)),
              )
              .catch(() => undefined);
        }
      }
      if (
        element instanceof HTMLElement &&
        element.getAttribute("aria-hidden") === "true"
      )
        active.get(element)?.abort();
      if (
        element instanceof HTMLElement &&
        element.matches(".rstep.on[data-effect-driven]") &&
        !/\bon\b/.test(record.oldValue || "")
      )
        run(element, (engine, signal) => engine.enter(element, signal));
    }
  }).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "aria-busy", "aria-hidden", "hidden"],
    attributeOldValue: true,
  });
  const stop = () => {
    if (document.hidden || reduced())
      active.forEach((controller) => controller.abort());
    else syncLoader();
  };
  document.addEventListener("visibilitychange", stop);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    stop,
  );
  document.addEventListener(
    "pointerdown",
    () => {
      if (!reduced()) void warm().catch(() => undefined);
    },
    { once: true, passive: true },
  );
  document.addEventListener(
    "focusin",
    () => {
      if (!reduced()) void warm().catch(() => undefined);
    },
    { once: true },
  );
  if (veil) {
    observer.observe(veil);
    // The HTML/CSS loader paints first; the orchestration chunk never gates lesson readiness.
    requestAnimationFrame(() => requestAnimationFrame(syncLoader));
  }
}
