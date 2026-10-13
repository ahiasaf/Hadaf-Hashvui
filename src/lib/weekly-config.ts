import program from "../generated/program.json";
export const titles = Object.fromEntries(
  Object.entries(program.content).map(([key, value]) => [key, value.title]),
);
export const lessonUi = Object.fromEntries(
  Object.entries(program.ui).filter(([key]) =>
    [
      "siteLesson",
      "siteCurrentWeek",
      "siteChoose",
      "siteFinish",
      "sitePause",
      "siteCalendar",
      "deckGo",
      "deckAlt",
      "deckSoon",
    ].includes(key),
  ),
);
// First slide of every week folder, already fingerprinted by the build.
const media: Record<string, string> = program.media;
export const covers: Record<string, string> = {};
for (const key of Object.keys(media).sort()) {
  const match = key.match(/^slides\/([a-z]+-\d+)\//);
  if (match && !covers[match[1]]) covers[match[1]] = media[key];
}
