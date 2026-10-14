import { initializeViewportMotion } from "./viewport-motion";
// Shared page motion: scroll reveals, counters and the header shadow.
// Content is visible by default; the "js" class only enables the entrance states.
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(element: HTMLElement) {
  const target = Number(element.dataset.countTo || 0);
  if (!target || reduced() || !("IntersectionObserver" in window)) {
    element.textContent = String(target);
    return;
  }
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const duration = 1300;
  let elapsed = 0,
    last = 0,
    frameId = 0,
    visible = false;
  const cleanup = () => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    document.removeEventListener("visibilitychange", resume);
    preference.removeEventListener("change", finish);
  };
  const finish = () => {
    if (!preference.matches) return;
    element.textContent = String(target);
    cleanup();
  };
  const frame = (now: number) => {
    if (!element.isConnected) {
      cleanup();
      return;
    }
    elapsed += last ? now - last : 0;
    last = now;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) frameId = requestAnimationFrame(frame);
    else cleanup();
  };
  const resume = () => {
    cancelAnimationFrame(frameId);
    last = 0;
    if (visible && !document.hidden) frameId = requestAnimationFrame(frame);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", resume);
  preference.addEventListener("change", finish);
}

// Images fade in once decoded; a capture listener also covers images React adds later.
function watchImages() {
  const settle = (image: HTMLImageElement) => {
    image.classList.remove("is-loading");
    image.classList.add("is-loaded");
  };
  for (const image of document.images)
    if (!image.complete) image.classList.add("is-loading");
  for (const type of ["load", "error"])
    document.addEventListener(
      type,
      (event) => {
        if (event.target instanceof HTMLImageElement) settle(event.target);
      },
      true,
    );
}

export function initializeMotion() {
  initializeViewportMotion();
  const root = document.documentElement;
  if (!reduced()) watchImages();
  const header = document.querySelector<HTMLElement>(".site-header");
  if (header) {
    let stuck = scrollY > 8;
    header.classList.toggle("is-stuck", stuck);
    addEventListener(
      "scroll",
      () => {
        const next = scrollY > 8;
        if (next === stuck) return;
        stuck = next;
        header.classList.toggle("is-stuck", next);
      },
      { passive: true },
    );
  }
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
  const counters = document.querySelectorAll<HTMLElement>("[data-count-to]");
  const show = (element: HTMLElement) => {
    element.classList.add("is-in");
    element.querySelectorAll<HTMLElement>("[data-count-to]").forEach(countUp);
    if (element.dataset.countTo) countUp(element);
  };
  if (!("IntersectionObserver" in window) || reduced()) {
    targets.forEach(show);
    counters.forEach(countUp);
    root.classList.remove("js");
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        show(entry.target as HTMLElement);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  root.classList.add("motion-observed");
  targets.forEach((element) => observer.observe(element));
  // Elements already in view reveal immediately with their stagger.
  requestAnimationFrame(() => root.classList.add("motion-ready"));
}
