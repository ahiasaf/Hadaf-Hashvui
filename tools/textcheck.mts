import { programContent } from "../src/config/content.ts";
const context: Record<string, unknown> = programContent();
const roots: Record<string, string> = {
  fit: "FIT",
  ui: "UI",
  sfarim: "SFARIM",
  rights: "RIGHTS",
  join: "JOIN",
  gate: "GATE",
  tour: "TOUR",
  a11y: "A11Y",
  info: "INFO",
  tzevet: "TZEVET",
  play: "PLAY",
  head: "HEAD_ASK",
  askui: "ASK_UI",
  headf: "HEAD_ASK_F",
  guide: "GUIDE",
  panel: "PANEL",
  ways: "WAYS_T",
  trip: "TRIP",
  send: "SEND",
  kish: "KISHURIM",
  pair: "PAIR",
  amda: "AMDA",
};
const fields = context.TEXT_FIELDS;
if (
  !Array.isArray(fields) ||
  !fields.every(
    (field) =>
      field &&
      typeof field === "object" &&
      (!field.k || typeof field.k === "string"),
  )
)
  throw new Error("Text field registry invalid");
const listed = new Set<string>(
  fields.flatMap((field) => (field.k ? [field.k] : [])),
);
const all = new Set<string>();
function walk(prefix: string, value: unknown, depth: number) {
  if (!value || typeof value !== "object" || depth > 4) return;
  for (const [name, item] of Object.entries(value)) {
    const key = prefix + "." + name;
    if (typeof item === "string") {
      if (!/\.(id|tone|key|code|src|hi)$/.test(key)) all.add(key);
    } else walk(key, item, depth + 1);
  }
}
for (const [name, variable] of Object.entries(roots)) {
  if (!context[variable])
    console.log("MISSING-ROOT " + name + " (" + variable + ")");
  else walk(name, context[variable], 1);
}
const missing = [...all].filter((key) => !listed.has(key)),
  ghost = [...listed].filter((key) => !all.has(key));
console.log("TOTAL " + all.size);
console.log(
  "NOLABEL " + missing.length + (missing.length ? " " + missing.join(" ") : ""),
);
console.log(
  "GHOST " + ghost.length + (ghost.length ? " " + ghost.join(" ") : ""),
);
