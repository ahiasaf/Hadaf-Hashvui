import { createHash } from "node:crypto";
// Pure ports of the Apps Script routing and table rules, shared by the Neon handlers and tests.
export const privateTabs = new Set([
  "לומדים",
  "לימוד",
  "הרשמות",
  "חידות",
  "קודים",
  "התראות",
  "הודעות",
  "תקועים",
  "תזכורות",
  "נשלחו",
  "זוגות",
  "התנגשויות הרשמה",
  "ממתינים לדף",
  "גישה",
  "תלמידי בית הספר",
  "עמדת לימוד",
  "טלפוני תלמידים",
  "תלמידי הרשת",
  "עמדה — שיוך",
  "עמדה — סימונים",
  "עמדה — שיעורים",
  "ארכיון",
  "מצב ישיבות",
  "הוספות יומן",
  "אנשי קשר",
  "יומן שיחות",
  "תצוגת צוות",
  "הגדרות תגיות",
  "פעולות צוות",
]);
// The call center writes these directly in Sheets; the application may only read them.
export const sourceOwnedTabs: Record<string, string[]> = {
  "מצב ישיבות": [
    "ישיבה",
    "בקבוצה",
    "בדף צוות",
    "זום",
    "דירוג",
    "רכז פעיל",
    "הערת מצב",
    "עודכן",
  ],
  "הוספות יומן": ["ישיבה", "מתי", "איש קשר", "הערה", "מזהה"],
};
export const publicRowTabs: Record<string, string[]> = {
  לומדים: [
    "מזהה",
    "שם",
    "משפחה",
    "טלפון",
    "ישיבה",
    "קוד ישיבה",
    "שכבה",
    "כיתה",
    "מסגרת",
    "תפקיד",
    "שם ההורה",
    "משפחת ההורה",
    "טלפון ההורה",
    "לומד עם",
    "הוזמן על ידי",
    "מזהה המזמין",
    "בדיקה",
  ],
  התראות: [
    "מזהה",
    "שם",
    "טלפון",
    "ישיבה",
    "קוד ישיבה",
    "תפקיד",
    "שכבה",
    "כיתה",
    "מכשיר",
    "מנוי",
    "תוצאה",
    "מועד",
    "מתי",
    "דפדפן",
  ],
  לימוד: ["מזהה", "קוד ישיבה", "מסלול", "שבוע", "דף", "קטע", "מתוך", "בדיקה"],
  זוגות: [
    "מזהה",
    "שם",
    "ישיבה",
    "קוד ישיבה",
    "שכבה",
    "כיתה",
    "מסלול",
    "שבוע",
    "דף",
    "דיווח",
    "מתי",
    "בלי התראה",
  ],
  "ממתינים לדף": ["מזהה", "שם", "ישיבה", "דף", "מכשיר", "מנוי", "מתי"],
};
export type Route = { name: string; write: boolean };
const has = (params: Record<string, string>, name: string) => !!params[name];
// Same precedence as doGet: the first matching parameter decides the operation.
const getRoutes: [string, (params: Record<string, string>) => boolean][] = [
  ["file", (p) => has(p, "file")],
  ["help", (p) => p.help === "1"],
  ["setup", (p) => /^clock(off|state)?$/.test(p.setup || "")],
  ["digest", (p) => p.fire === "digest"],
  ["helpdone", (p) => has(p, "helpdone")],
  ["conflictdone", (p) => has(p, "conflictdone")],
  ["sayDone", (p) => has(p, "sayDone")],
  ["resend", (p) => has(p, "resend")],
  ["say", (p) => p.fire === "say"],
  ["mark", (p) => has(p, "mark")],
  ["funnel", (p) => has(p, "funnel")],
  ["trails", (p) => has(p, "trails")],
  ["arrived", (p) => has(p, "arrived")],
  ["pair", (p) => has(p, "pair")],
  ["pairok", (p) => has(p, "pairok")],
  ["pairSeen", (p) => has(p, "pairSeen")],
  ["pairFor", (p) => has(p, "pairFor")],
  ["idFor", (p) => has(p, "idFor")],
  ["amdaFor", (p) => has(p, "amdaFor")],
  ["whoIs", (p) => has(p, "whoIs")],
  ["pendingFor", (p) => has(p, "pendingFor")],
  ["acc", (p) => has(p, "acc")],
  ["accset", (p) => has(p, "accset")],
  ["board", (p) => has(p, "board")],
  ["team", (p) => has(p, "team")],
  ["codes", (p) => has(p, "codes") || has(p, "newcode")],
  ["recount", (p) => has(p, "recount")],
  ["delete", (p) => has(p, "clear") || has(p, "delrow")],
  ["contactSave", (p) => has(p, "contactSave")],
  [
    "archive",
    (p) => has(p, "archive") || has(p, "unarchive") || has(p, "archived"),
  ],
  ["dedupe", (p) => has(p, "dedupe")],
  ["read", (p) => has(p, "read")],
];
const getWrites = new Set([
  "help",
  "setup",
  "digest",
  "helpdone",
  "conflictdone",
  "sayDone",
  "resend",
  "say",
  "pairok",
  "acc",
  "accset",
  "recount",
  "delete",
  "contactSave",
  "dedupe",
]);
export function legacyGetRoute(params: Record<string, string>): Route {
  const name = getRoutes.find(([, match]) => match(params))?.[0] || "health";
  const write =
    getWrites.has(name) ||
    (name === "codes" && has(params, "newcode")) ||
    (name === "archive" && !has(params, "archived")) ||
    // Reading the station list starts its learner matching in Apps Script.
    (name === "read" && params.read === "עמדת לימוד");
  return { name, write };
}
export function legacyPostRoute(body: Record<string, unknown>): Route {
  return { name: String(body.action || ""), write: true };
}
export function phoneKey(value: string) {
  let digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("972")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length >= 8 ? digits : "";
}
export function nameKey(value: string) {
  return String(value || "").replace(/["'׳״\s]/g, "");
}
export function personKey(
  phone: string,
  first: string,
  last: string,
  parent: boolean,
) {
  const p = phoneKey(phone),
    f = nameKey(first),
    l = nameKey(last);
  return p && f && l ? p + "|" + f + "|" + l + "|" + (parent ? "ה" : "ת") : "";
}
export type Sheet = { headers: string[]; rows: string[][]; ordinals: number[] };
export function sheetOf(rows: string[][], ordinals?: number[]): Sheet {
  return {
    headers: (rows[0] || []).map((header) => String(header).trim()),
    rows: rows.slice(1),
    ordinals: ordinals || rows.slice(1).map((_, index) => index + 1),
  };
}
export function value(sheet: Sheet, row: string[], name: string) {
  const index = sheet.headers.indexOf(name);
  return index < 0 ? "" : String(row[index] || "").trim();
}
export function rowIds(sheet: Sheet, row: string[]) {
  return [
    value(sheet, row, "מזהה"),
    ...value(sheet, row, "מזהים נוספים").split(/\s+/),
  ].filter(Boolean);
}
export function rowOfId(sheet: Sheet, id: string) {
  const wanted = String(id || "").trim();
  if (!wanted) return -1;
  for (let index = sheet.rows.length - 1; index >= 0; index--)
    if (rowIds(sheet, sheet.rows[index]).includes(wanted)) return index;
  return -1;
}
export function rowKey(sheet: Sheet, row: string[]) {
  if (value(sheet, row, "מזהה").includes(":k")) return "";
  return personKey(
    value(sheet, row, "טלפון"),
    value(sheet, row, "שם"),
    value(sheet, row, "משפחה"),
    value(sheet, row, "תפקיד") === "הורה",
  );
}
type Pair = { with: string; ok: 1; pids: string[] };
export function pairMap(rows: string[][]) {
  const sheet = sheetOf(rows),
    out: Record<string, Pair> = {};
  if (!sheet.headers.includes("מזהה")) return out;
  const aliases: Record<string, string> = {};
  for (const row of sheet.rows) {
    const id = value(sheet, row, "מזהה");
    if (id)
      for (const alias of value(sheet, row, "מזהים נוספים").split(/\s+/))
        if (alias) aliases[alias] = id;
  }
  type Person = {
    id: string;
    first: string;
    dad: boolean;
    mine: string;
    other: string;
    wid: string;
  };
  const by = new Map<string, Person>();
  for (const row of sheet.rows) {
    const id = value(sheet, row, "מזהה");
    if (!id) continue;
    // Later rows refresh the details while keeping first-seen order, like the source map.
    by.set(id, {
      id,
      first: value(sheet, row, "שם"),
      dad: value(sheet, row, "תפקיד") === "הורה",
      mine: phoneKey(value(sheet, row, "טלפון")),
      other: phoneKey(value(sheet, row, "טלפון ההורה")),
      wid: value(sheet, row, "מזהה המזמין"),
    });
  }
  const byPhone = new Map<string, string[]>(),
    byOther = new Map<string, string[]>();
  for (const person of by.values()) {
    if (person.mine)
      byPhone.set(person.mine, [
        ...(byPhone.get(person.mine) || []),
        person.id,
      ]);
    if (person.other)
      byOther.set(person.other, [
        ...(byOther.get(person.other) || []),
        person.id,
      ]);
  }
  const link = (x?: Person, y?: Person) => {
    if (!x || !y || x.id === y.id || x.dad === y.dad) return;
    out[x.id] ||= { with: y.first, ok: 1, pids: [] };
    out[y.id] ||= { with: x.first, ok: 1, pids: [] };
    if (!out[x.id].pids.includes(y.id)) out[x.id].pids.push(y.id);
    if (!out[y.id].pids.includes(x.id)) out[y.id].pids.push(x.id);
  };
  for (const me of by.values()) {
    for (const id of me.other ? byPhone.get(me.other) || [] : [])
      link(me, by.get(id));
    for (const id of me.mine ? byOther.get(me.mine) || [] : [])
      link(me, by.get(id));
    const wid = me.wid ? aliases[me.wid] || me.wid : "";
    if (wid) link(me, by.get(wid));
  }
  return out;
}
export function markProgress(rows: string[][], id: string, tag: string) {
  const sheet = sheetOf(rows);
  let at = 0,
    done = false;
  for (const row of sheet.rows) {
    if (value(sheet, row, "מזהה") !== id) continue;
    if (value(sheet, row, "מסלול") + "|" + value(sheet, row, "שבוע") !== tag)
      continue;
    const segment = value(sheet, row, "קטע"),
      total = Number.parseInt(value(sheet, row, "מתוך"), 10),
      reached = Number.parseInt(segment, 10);
    if (!segment || !(total > 0) || reached >= total) {
      done = true;
      at = total > 0 ? total : 1;
    } else if (reached > at) at = reached;
  }
  return { at, done };
}
export function pendingFor(rows: string[][], phone: string) {
  const sheet = sheetOf(rows),
    digits = String(phone || "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  for (let index = sheet.rows.length - 1; index >= 0; index--) {
    const row = sheet.rows[index];
    if (
      value(sheet, row, "טלפון השותף").replace(/[^0-9]/g, "") !== digits ||
      value(sheet, row, "דיווח") !== "הבן" ||
      value(sheet, row, "אושר")
    )
      continue;
    return {
      id: value(sheet, row, "מזהה"),
      track: value(sheet, row, "מסלול"),
      wk: value(sheet, row, "שבוע"),
    };
  }
  return null;
}
export function pairSeen(
  rows: string[][],
  phone: string,
  tag: string,
  side: string,
) {
  const sheet = sheetOf(rows),
    key = phoneKey(phone),
    by = side === "parent" ? "הבן" : "ההורה";
  if (!key || !tag) return null;
  for (let index = sheet.rows.length - 1; index >= 0; index--) {
    const row = sheet.rows[index];
    if (
      value(sheet, row, "דיווח") === by &&
      value(sheet, row, "מסלול") + "|" + value(sheet, row, "שבוע") === tag &&
      phoneKey(value(sheet, row, "טלפון השותף")) === key
    )
      return { id: value(sheet, row, "מזהה"), ok: value(sheet, row, "אושר") };
  }
  return null;
}
export function contactKey(value: unknown) {
  return String(value ?? "")
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/^'/, "")
    .replace(/["'״׳]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
type Contact = { name?: string; phone?: string; phone2?: string };
// Returns the cells to append to a new institution row, or the cells to add to an existing one.
export function contactCells(people: Contact[], existing?: string[]) {
  const digits = (value: unknown) => String(value || "").replace(/\D/g, "");
  const known = new Set<string>(),
    phones = new Set<string>();
  for (const cell of existing || []) {
    if (contactKey(cell)) known.add(contactKey(cell));
    if (digits(cell).length >= 9) phones.add(digits(cell));
  }
  const cells: string[] = [];
  for (const person of people) {
    const first = digits(person.phone),
      second = digits(person.phone2);
    if (
      existing &&
      ((person.name && known.has(contactKey(person.name))) ||
        (first && phones.has(first)) ||
        (second && phones.has(second)))
    )
      continue;
    cells.push(String(person.name || ""));
    if (person.phone) cells.push(String(person.phone));
    if (person.phone2) cells.push(String(person.phone2));
  }
  return cells;
}
export const stationTab = "עמדת לימוד",
  stationLinkTab = "עמדה — שיוך",
  stationAttended = "השתתף";
export function stationName(value: string) {
  return String(value || "")
    .replace(/["'׳״`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function stationKey(sheet: Sheet, row: string[]) {
  return [
    value(sheet, row, "קוד ישיבה"),
    value(sheet, row, "שכבה"),
    value(sheet, row, "כיתה"),
    stationName(value(sheet, row, "שם")),
    value(sheet, row, "מסלול"),
    value(sheet, row, "שבוע"),
  ].join("|");
}
export function stationLearnerId(
  school: string,
  grade: string,
  className: string,
  name: string,
) {
  const digest = createHash("md5")
    .update([school, grade, className.replace(/\D/g, ""), name].join("|"))
    .digest("base64url");
  return "Am" + digest.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
}
type Directory = Record<string, { l: string; f: string; p: string } | null>;
export function stationDirectory(network: string[][], phones: string[][]) {
  const out: Directory = {};
  const add = (
    school: string,
    grade: string,
    last: string,
    first: string,
    phone: string,
  ) => {
    last = String(last || "")
      .replace(/\s+/g, " ")
      .trim();
    first = String(first || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!last || !first) return;
    const key =
      school +
      "|" +
      stationName(grade).replace(/["'׳״]/g, "") +
      "|" +
      stationName(last + " " + first);
    out[key] =
      out[key] === undefined ? { l: last, f: first, p: phone.trim() } : null;
  };
  for (const [rows, scoped] of [
    [network, true],
    [phones, false],
  ] as const) {
    if (rows.length < 2) continue;
    const head = rows[0].map((header) => String(header).trim());
    const find = (pattern: RegExp) =>
      head.findIndex((header) => pattern.test(header));
    const school = find(/^קוד ישיבה$/),
      grade = find(/שכבה/),
      last = find(/משפחה/),
      first = find(/פרטי/),
      phone = find(/טלפון|נייד/);
    if (grade < 0 || last < 0 || first < 0 || (scoped && school < 0)) continue;
    for (const row of rows.slice(1))
      add(
        scoped ? String(row[school] || "").trim() : "*",
        row[grade] || "",
        row[last] || "",
        row[first] || "",
        phone >= 0 ? row[phone] || "" : "",
      );
  }
  return out;
}
export type StationPlan = {
  learners: [string, string][][];
  progress: [string, string][][];
  quizzes: [string, string][][];
  links: [string, string][][];
};
// Matches station learners to registered students, as amdaSync_ does, without touching storage.
export function planStationSync(
  stationRows: string[][],
  linkRows: string[][],
  learnerRows: string[][],
  directory: Directory,
): StationPlan {
  const plan: StationPlan = {
    learners: [],
    progress: [],
    quizzes: [],
    links: [],
  };
  const station = sheetOf(stationRows);
  if (!station.rows.length) return plan;
  const links = sheetOf(linkRows),
    had = new Set<string>();
  for (const row of links.rows) {
    had.add(
      value(links, row, "מזהה") +
        "|" +
        value(links, row, "מסלול") +
        "|" +
        value(links, row, "שבוע"),
    );
    had.add("k:" + value(links, row, "מפתח"));
  }
  const seen = new Set<string>();
  const wanted = [];
  for (const row of station.rows) {
    const get = (name: string) => value(station, row, name);
    if (
      get("סוג") !== "דף" ||
      !get("קוד ישיבה") ||
      !get("מסלול") ||
      !get("שבוע") ||
      get("רמה") === stationAttended
    )
      continue;
    const key = stationKey(station, row);
    if (seen.has(key) || had.has("k:" + key)) continue;
    seen.add(key);
    wanted.push({
      key,
      school: get("קוד ישיבה"),
      grade: stationName(get("שכבה")),
      className: get("כיתה"),
      name: stationName(get("שם")),
      track: get("מסלול"),
      week: get("שבוע"),
      page: get("דף"),
      quiz: get("רמה").includes("חידון"),
    });
  }
  if (!wanted.length) return plan;
  const learners = sheetOf(learnerRows),
    byName = new Map<string, number[]>(),
    schoolNames: Record<string, string> = {};
  learners.rows.forEach((row, index) => {
    const school = value(learners, row, "קוד ישיבה");
    if (school && !schoolNames[school])
      schoolNames[school] = value(learners, row, "ישיבה");
    if (
      value(learners, row, "תפקיד") === "הורה" ||
      !value(learners, row, "מזהה")
    )
      return;
    const first = stationName(value(learners, row, "שם")),
      last = stationName(value(learners, row, "משפחה"));
    if (!first || !last) return;
    for (const name of [last + " " + first, first + " " + last]) {
      const key = school + "|" + name;
      byName.set(key, [...(byName.get(key) || []), index]);
    }
  });
  const created = new Set<string>();
  for (const want of wanted) {
    let candidates = [
      ...new Set(byName.get(want.school + "|" + want.name) || []),
    ].filter((index) => {
      const grade = stationName(value(learners, learners.rows[index], "שכבה"));
      return !grade || grade === want.grade;
    });
    if (candidates.length > 1)
      candidates = candidates.filter(
        (index) =>
          value(learners, learners.rows[index], "כיתה").replace(/\D/g, "") ===
          want.className.replace(/\D/g, ""),
      );
    let id = "";
    if (candidates.length === 1)
      id = value(learners, learners.rows[candidates[0]], "מזהה");
    else if (!candidates.length && want.school && want.name) {
      id = stationLearnerId(want.school, want.grade, want.className, want.name);
      if (rowOfId(learners, id) < 0 && !created.has(id)) {
        const hit =
          directory[want.school + "|" + want.grade + "|" + want.name] ||
          directory["*|" + want.grade + "|" + want.name] ||
          null;
        created.add(id);
        plan.learners.push([
          ["מזהה", id],
          ["ישיבה", schoolNames[want.school] || ""],
          ["קוד ישיבה", want.school],
          ["שם", hit ? hit.f : want.name],
          ["משפחה", hit ? hit.l : ""],
          ["שכבה", want.grade],
          ["כיתה", want.className],
          ["טלפון", hit ? hit.p : ""],
          ["מקור", "עמדת לימוד"],
        ]);
      }
    }
    if (!id) continue;
    const tag = id + "|" + want.track + "|" + want.week;
    if (!had.has(tag)) {
      plan.progress.push([
        ["מזהה", id],
        ["קוד ישיבה", want.school],
        ["מסלול", want.track],
        ["שבוע", want.week],
        ["דף", want.page],
        ["קטע", ""],
        ["מתוך", ""],
        ["בדיקה", ""],
        ["מקור", "עמדת לימוד"],
      ]);
      had.add(tag);
    }
    if (want.quiz)
      plan.quizzes.push([
        ["דף", want.track + "|" + want.page],
        ["קטע", "עמדת לימוד"],
        ["שבוע", want.track + "-" + want.week],
        ["ישיבה", want.school],
        ["שם", want.name],
        ["נכון", "נכון"],
        ["מזהה", id],
        ["מקור", "עמדת לימוד"],
      ]);
    plan.links.push([
      ["מזהה", id],
      ["מסלול", want.track],
      ["שבוע", want.week],
      ["דף", want.page],
      ["מפתח", want.key],
    ]);
  }
  return plan;
}
