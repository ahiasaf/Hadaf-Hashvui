// One observer for CSS motion, including controls inserted by React and retained tools.
// Keep the DOM prerendered and accessible; suspend animation work, never its content.
export function initializeViewportMotion() {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window)) return;
  const watched = new Set<Element>();
  const painted = (element: Element) => {
    const bounds = element.getBoundingClientRect();
    return (
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < innerHeight &&
      bounds.right > 0 &&
      bounds.left < innerWidth &&
      !element.closest(
        '.lesson-variant[aria-hidden="true"], [role="tabpanel"][aria-hidden="true"], [hidden]',
      ) &&
      getComputedStyle(element).visibility !== "hidden"
    );
  };
  const update = (element: Element) =>
    element.toggleAttribute("data-motion-paused", !painted(element));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (!entry.isIntersecting)
        entry.target.setAttribute("data-motion-paused", "");
      else update(entry.target);
  });
  const watch = (element: Element) => {
    if (watched.has(element) || preference.matches) return;
    watched.add(element);
    element.setAttribute("data-motion-watch", "");
    update(element);
    observer.observe(element);
  };
  const forget = (element: Element) => {
    observer.unobserve(element);
    watched.delete(element);
    element.removeAttribute("data-motion-watch");
    element.removeAttribute("data-motion-paused");
  };
  const scan = () => {
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;
      if (
        animation instanceof CSSAnimation &&
        effect instanceof KeyframeEffect &&
        effect.target instanceof Element
      )
        watch(effect.target);
    }
  };
  document.addEventListener(
    "animationstart",
    (event) => {
      if (event.target instanceof Element) watch(event.target);
    },
    true,
  );
  const settle = (event: Event) => {
    const element = event.target;
    if (
      element instanceof Element &&
      !element
        .getAnimations()
        .some(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.playState !== "finished" &&
            animation.playState !== "idle",
        )
    )
      forget(element);
  };
  document.addEventListener("animationend", settle, true);
  document.addEventListener("animationcancel", settle, true);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof Element) {
        if (watched.has(record.target)) update(record.target);
        record.target.querySelectorAll("[data-motion-watch]").forEach(update);
      }
      for (const node of record.removedNodes) {
        if (!(node instanceof Element) || node.isConnected) continue;
        if (watched.has(node)) forget(node);
        node.querySelectorAll("[data-motion-watch]").forEach(forget);
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "aria-hidden"],
  });
  const visibility = () =>
    root.toggleAttribute("data-motion-hidden", document.hidden);
  document.addEventListener("visibilitychange", visibility);
  preference.addEventListener("change", () => {
    if (preference.matches) [...watched].forEach(forget);
    else scan();
  });
  visibility();
  scan();
}
