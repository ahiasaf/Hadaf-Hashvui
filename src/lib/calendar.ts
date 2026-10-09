export type CalendarRow = (string | null)[];
export type Track = {
  id: string;
  name: string;
  cal: CalendarRow[];
  dapim: number;
};
export function weekIndex(startDate: string, date = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return Math.max(
    0,
    Math.floor(
      (Date.parse(day + "T00:00:00Z") - Date.parse(startDate + "T00:00:00Z")) /
        604800000,
    ),
  );
}
export function lessonRow(track: Track, index: number) {
  const bounded = Math.min(index, track.cal.length - 1);
  return { index: bounded, row: track.cal[bounded] };
}
export function lessonHref(track: Track, row: CalendarRow) {
  const params = new URLSearchParams({ mas: track.id, daf: row[2] || "" });
  if (row[3] === "א" || row[3] === "ב")
    params.set("amud", row[3] === "א" ? "1" : "2");
  return "/learn?" + params.toString();
}
export function studyUnits(track: Track) {
  return track.cal.filter((row) => row[2] && row[2] !== "סיום").length;
}
