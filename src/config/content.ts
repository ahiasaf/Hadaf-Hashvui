import program from "./program.json" with { type: "json" };
import copy from "./copy.json" with { type: "json" };
import links from "./links.json" with { type: "json" };
const { CALENDARS, TRACKS, ...constants } = program;
const tracks = TRACKS.map(({ calendarKey, ...track }) => {
  if (!Object.hasOwn(CALENDARS, calendarKey))
    throw new Error("Unknown program calendar");
  const cal = CALENDARS[calendarKey as keyof typeof CALENDARS];
  if (
    cal.some(
      (row) =>
        row.length < 3 ||
        row.some((cell) => cell !== null && typeof cell !== "string"),
    )
  )
    throw new Error("Invalid program calendar");
  return { ...track, cal };
});
if (
  !/^\d{4}-\d{2}-\d{2}$/.test(constants.PROGRAM.startDate) ||
  !/^https:\/\/script\.google\.com\//.test(constants.APPS_SCRIPT_URL)
)
  throw new Error("Invalid program configuration");
const content = {
  ...constants,
  ...copy,
  CAL_TAANIT: CALENDARS.taanit,
  CAL_MEGILA: CALENDARS.megila,
  TRACKS: tracks,
};
export function programContent() {
  return content;
}
export function programScript() {
  const declarations = Object.entries(content)
    .filter(([key]) => key !== "TRACKS")
    .map(([key, value]) => "var " + key + " = " + JSON.stringify(value) + ";");
  // Legacy tools share the same calendar arrays as their track definitions.
  declarations.push(
    "var TRACKS = [" +
      TRACKS.map(
        ({ calendarKey, ...track }) =>
          JSON.stringify(track).slice(0, -1) +
          ',"cal":' +
          (calendarKey === "taanit" ? "CAL_TAANIT" : "CAL_MEGILA") +
          "}",
      ).join(",") +
      "];",
  );
  return declarations.join("\n");
}
export function linksScript() {
  return "var DAF_LINKS = " + JSON.stringify(links) + ";\n";
}
