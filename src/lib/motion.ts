// Shared page motion: scroll reveals, counters and the header shadow.
// Content is visible by default; the "js" class only enables the entrance states.
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(element: HTMLElement) {
  const target = Number(element.dataset.countTo || 0);
  if (!target || reduced()) {
    element.textContent = String(target);
    return;
  }
  const started = performance.now();
  const duration = 1300;
  const frame = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function initializeMotion() {
  const root = document.documentElement;
  const header = document.querySelector<HTMLElement>(".site-header");
  if (header) {
    const paint = () => header.classList.toggle("is-stuck", scrollY > 8);
    paint();
    addEventListener("scroll", paint, { passive: true });
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
  targets.forEach((element) => observer.observe(element));
  // Elements already in view reveal immediately with their stagger.
  requestAnimationFrame(() => root.classList.add("motion-ready"));
}
