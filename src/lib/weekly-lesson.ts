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
  ui: Record<string, string>;
};
export function initializeWeeklyLesson() {
  const section = document.getElementById("lesson");
  const settings = document.getElementById("weekly-config")?.textContent;
  if (!section || !settings) return;
  const { tracks, startDate, titles, ui }: Settings = JSON.parse(settings);
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
    variant.querySelector<HTMLElement>("[data-daf]")!.textContent = active
      ? "דף " + row[2] + (row[3] ? " · עמוד " + row[3] : "")
      : row[1];
    variant.querySelector<HTMLElement>("[data-lesson-title]")!.textContent =
      active
        ? titles[track.id + "-" + (index + 1)] || "מסכת " + track.name
        : ui.sitePause;
    variant.querySelector<HTMLElement>("[data-date]")!.textContent =
      row[1] + " · " + row[0];
  }
  function show(id: string) {
    const track = tracks.find((track) => track.id === id);
    if (!track) return;
    const { index, row, active } = current(track);
    section!.querySelector<HTMLElement>("[data-week]")!.textContent =
      ui.siteCurrentWeek + " " + (index + 1) + "/" + track.cal.length;
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
    open.textContent = active ? ui.siteOpen : ui.siteCalendar;
    section!.querySelector<HTMLElement>("[data-count]")!.textContent =
      studyUnits(track) + " " + ui.siteStudyUnits;
    section!.querySelector<HTMLAnchorElement>("[data-calendar]")!.href =
      "/calendar#" + track.id;
    section!
      .querySelectorAll<HTMLElement>("[data-track]")
      .forEach((tab) =>
        tab.setAttribute("aria-pressed", String(tab.dataset.track === id)),
      );
  }
  section.querySelectorAll<HTMLElement>("[data-track]").forEach((tab) =>
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      show(tab.dataset.track || "");
    }),
  );
  if (tracks[0]) show(tracks[0].id);
}
