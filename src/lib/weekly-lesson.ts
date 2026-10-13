import { sheet, stored, store, type Person } from "./client";
import { deckCovers } from "./deck-covers";
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
  personal?: boolean;
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
  const {
    tracks,
    startDate,
    titles,
    covers,
    ui,
    personal = false,
  }: Settings = JSON.parse(settings);
  function current(track: Track) {
    const spot = personal
      ? stored<{
          mas: string;
          daf: string;
          am: number;
          i: number;
          n: number;
        } | null>("spot", null)
      : null;
    const resume =
      spot?.mas === track.id && spot.i > 0 && spot.i < spot.n - 1
        ? track.cal.findIndex(
            (row) =>
              row[2] === spot.daf &&
              (row[3] === "א" ? 1 : row[3] === "ב" ? 2 : 0) === spot.am,
          )
        : -1;
    const result = lessonRow(
      track,
      resume >= 0 ? resume : weekIndex(startDate),
    );
    return {
      ...result,
      resume: resume >= 0,
      active: !!result.row[2] && result.row[2] !== "סיום",
    };
  }
  // Populate every stacked variant before switching; the action keeps its position.
  function paint() {
    for (const track of tracks) {
      const { index, row, active } = current(track);
      const variant = section!.querySelector<HTMLElement>(
        `[data-variant="${track.id}"]`,
      )!;
      const text = (selector: string, value: string) => {
        const element = variant.querySelector<HTMLElement>(selector);
        if (element && element.textContent !== value)
          element.textContent = value;
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
  }
  // Published covers override the fallback without blocking the first render.
  void sheet("מצגות")
    .then((rows) => {
      const published = deckCovers(rows);
      for (const track of tracks) {
        const { index } = current(track),
          deck = published[track.id + "-" + (index + 1)];
        if (!deck) continue;
        if (deck.src) covers[track.id + "-" + (index + 1)] = deck.src;
        if (deck.title) titles[track.id + "-" + (index + 1)] = deck.title;
        const variant = section!.querySelector<HTMLElement>(
          `[data-variant="${track.id}"]`,
        )!;
        const frame = variant.querySelector<HTMLElement>("[data-frame]")!,
          image = frame.querySelector<HTMLImageElement>("img");
        frame.classList.toggle("is-empty", !deck.src);
        if (deck.src) {
          if (image) image.src = deck.src;
          else {
            const added = new Image();
            added.alt = "השקף שנבחר ללימוד השבועי";
            added.decoding = "async";
            added.src = deck.src;
            frame.prepend(added);
          }
        }
        if (deck.title)
          variant.querySelector<HTMLElement>(
            "[data-lesson-title]",
          )!.textContent = deck.title;
      }
    })
    .catch(() => undefined);
  function show(id: string) {
    const track = tracks.find((track) => track.id === id);
    if (!track) return;
    const { row, active, resume } = current(track);
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
    const label = section!.querySelector<HTMLElement>("[data-stage-label]");
    if (label)
      label.textContent = resume ? "ממשיכים מהמקום שעצרתם" : ui.siteLesson;
    open.textContent = active
      ? resume
        ? "להמשך הלימוד"
        : ui.deckGo
      : ui.siteCalendar;
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
      const id = tab.dataset.track || "";
      show(id);
      if (personal) {
        store("track", id);
        window.dispatchEvent(new Event("df-track-change"));
      }
    }),
  );
  function refresh() {
    paint();
    const spot = stored<{ mas?: string } | null>("spot", null);
    const id = personal
      ? stored("track", spot?.mas || tracks[0]?.id || "")
      : tracks[0]?.id;
    show(tracks.some((track) => track.id === id) ? id! : tracks[0]?.id || "");
    if (personal) {
      const me = stored<Person | null>("me", null);
      const greeting = document.querySelector<HTMLElement>(
        "[data-dashboard-greeting]",
      );
      const school = document.querySelector<HTMLElement>(
        "[data-dashboard-school]",
      );
      if (greeting)
        greeting.textContent = me?.first ? "שלום, " + me.first : "הלימוד שלי";
      if (school) {
        school.textContent = me?.instName || "";
        school.hidden = !me?.instName;
      }
    }
  }
  refresh();
  if (personal) {
    addEventListener("pageshow", refresh);
    addEventListener("df-account-change", refresh);
    addEventListener("storage", (event) => {
      if (
        event.key === null ||
        ["df:me", "df:track", "df:spot"].includes(event.key)
      )
        refresh();
    });
  }
}
