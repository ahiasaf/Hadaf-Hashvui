// Program phases: the current one is the last phase that has already started.
export type Phase = { t: string; sub: string; from: string; to: string };
export function currentPhase(phases: Phase[], date = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  let index = 0;
  phases.forEach((phase, i) => {
    if (today >= phase.from) index = i;
  });
  return index;
}
export function paintTimeline(root: HTMLElement, phases: Phase[]) {
  const now = currentPhase(phases);
  root.querySelectorAll<HTMLElement>("[data-phase]").forEach((step, i) => {
    step.classList.toggle("is-done", i < now);
    step.classList.toggle("is-now", i === now);
  });
  root.style.setProperty(
    "--progress",
    String(phases.length > 1 ? now / (phases.length - 1) : 1),
  );
}
