import {
  lessonHref,
  lessonRow,
  studyUnits,
  weekIndex,
  type Track,
} from "./calendar";
type Settings = {
  tracks: Track[];
  startDate: string;
  titles: Record<string, string>;
  covers: Record<string, string>;
  ui: Record<string, string>;
};
// Dapim learned so far, counting the current week as started.
export function unitsDone(track: Track, week: number) {
  return track.cal.filter(
    (row, index) => index <= week && row[2] && row[2] !== "סיום",
  ).length;
}
export function initializeWeeklyLesson() {
  const section = document.getElementById("lesson");
  const settings = document.getElementById("weekly-config")?.textContent;
  if (!section || !settings) return;
  const { tracks, startDate, titles, covers, ui }: Settings =
    JSON.parse(settings);
  const week = weekIndex(startDate);
  function current(track: Track) {
    const result = lessonRow(track, week);
    return { ...result, active: !!result.row[2] && result.row[2] !== "סיום" };
  }
  // Populate every stacked variant before switching; the action keeps its position.
  for (const track of tracks) {
    const { index, row, active } = current(track);
    const variant = section.querySelector<HTMLElement>(
      `[data-variant="${track.id}"]`,
    )!;
    const text = (selector: string, value: string) => {
      const element = variant.querySelector<HTMLElement>(selector);
      if (element && element.textContent !== value) element.textContent = value;
    };
    text(
      "[data-week]",
      ui.siteCurrentWeek +
        " " +
        (index + 1) +
        " מתוך " +
        track.cal.length +
        (active ? " · דף " + row[2] + (row[3] ? " ע״" + row[3] : "") : ""),
    );
    text(
      "[data-lesson-title]",
      active
        ? titles[track.id + "-" + (index + 1)] || "מסכת " + track.name
        : ui.sitePause,
    );
    text("[data-date]", row[1] + " · " + row[0]);
    text(
      "[data-progress]",
      unitsDone(track, index) + " מתוך " + studyUnits(track),
    );
    const cover = covers[track.id + "-" + (index + 1)] || "";
    const frame = variant.querySelector<HTMLElement>("[data-frame]");
    if (frame) {
      frame.classList.toggle("is-empty", !cover);
      const image = frame.querySelector<HTMLImageElement>("img");
      if (cover && !image) {
        const added = new Image();
        added.src = cover;
        added.alt = "";
        added.decoding = "async";
        frame.prepend(added);
      } else if (cover && image && !image.src.endsWith(cover))
        image.src = cover;
    }
    variant
      .querySelectorAll<HTMLElement>("[data-dot]")
      .forEach((dot, i) =>
        dot.classList.toggle("is-done", i < unitsDone(track, index)),
      );
  }
  function show(id: string) {
    const track = tracks.find((track) => track.id === id);
    if (!track) return;
    const { row, active } = current(track);
    section!
      .querySelectorAll<HTMLElement>("[data-variant]")
      .forEach((variant) =>
        variant.setAttribute(
          "aria-hidden",
          String(variant.dataset.variant !== id),
        ),
      );
    const open = section!.querySelector<HTMLAnchorElement>("[data-open]")!;
    open.href = active ? lessonHref(track, row) : "/calendar";
    open.textContent = active ? ui.deckGo : ui.siteCalendar;
    const tabs = [...section!.querySelectorAll<HTMLElement>("[data-track]")];
    tabs.forEach((tab) =>
      tab.setAttribute("aria-pressed", String(tab.dataset.track === id)),
    );
    const position = tabs.findIndex((tab) => tab.dataset.track === id);
    section!.style.setProperty("--tab", String(Math.max(0, position)));
  }
  section.querySelectorAll<HTMLElement>("[data-track]").forEach((tab) =>
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      show(tab.dataset.track || "");
    }),
  );
  if (tracks[0]) show(tracks[0].id);
}
