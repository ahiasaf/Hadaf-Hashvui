import { sheetOf, value } from "./legacy-policy.ts";
export function schoolGrant(rows: string[][], school: string, device: string) {
  if (!school || !device) return "unknown";
  const sheet = sheetOf(rows);
  const row = sheet.rows.findLast(
    (row) => value(sheet, row, "מזהה") === device,
  );
  if (!row || value(sheet, row, "קוד ישיבה") !== school) return "unknown";
  const state = value(sheet, row, "מצב");
  return state === "אושר" ? "ok" : state === "נעול" ? "locked" : "wait";
}
export function networkRoster(rows: string[][], school: string) {
  const sheet = sheetOf(rows);
  return sheet.rows.flatMap((row) => {
    if (value(sheet, row, "קוד ישיבה") !== school) return [];
    const grade = value(sheet, row, "שכבה").replace(/["'׳״\s]/g, "");
    const klass = value(sheet, row, "כיתה");
    const name = (value(sheet, row, "משפחה") + " " + value(sheet, row, "פרטי"))
      .replace(/\s+/g, " ")
      .trim();
    return ["ז", "ח"].includes(grade) && klass && name
      ? [[grade, klass, name]]
      : [];
  });
}
export const attendanceColumns = [
  "מזהה",
  "שבוע",
  "יום",
  "עמדה",
  "קוד עמדה",
  "סוג",
  "מסלול",
  "דף",
  "מקום",
  "רמה",
  "שכבה",
  "כיתה",
  "שם",
  "מתי",
];
export function attendanceCells(
  cols: [string, string][],
  school: string,
): [string, string][] {
  if (!school || cols.some(([, cell]) => cell.length > 4000))
    throw new Error("Invalid attendance");
  return [
    ...cols.filter(([name]) => attendanceColumns.includes(name)),
    ["קוד ישיבה", school],
  ];
}
export function pageKey(value: unknown) {
  return String(value ?? "").replace(/["'׳״\s]/g, "");
}
export function removeAnchorPaths(raw: string, paths: Set<string>) {
  let anchors: unknown;
  try {
    anchors = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!anchors || typeof anchors !== "object" || Array.isArray(anchors))
    return null;
  const next = { ...anchors } as Record<string, unknown>;
  const removed: { key: string; val: string }[] = [];
  for (const [key, val] of Object.entries(next)) {
    if (!key.startsWith("__") && typeof val === "string" && paths.has(val)) {
      removed.push({ key, val });
      delete next[key];
    }
  }
  return { next: JSON.stringify(next), removed };
}
export const stableIdColumns: Record<string, number> = {
  "סימוני הדף": 3,
  פירוש: 2,
  "שאלות בדף": 2,
  מצגת: 2,
};
export function stableIdPlan(
  tab: string,
  current: string[][],
  base: string[][],
  plan: string[][],
  head: string[],
) {
  const column = stableIdColumns[tab];
  if (column === undefined) throw new Error("Unknown stable ID table");
  const width = Math.max(current[0]?.length || 0, head.length, 1);
  const normalize = (rows: string[][]) =>
    rows.map((row) =>
      Array.from({ length: width }, (_, i) => String(row[i] ?? "")),
    );
  const same = (a: string[][], b: string[][]) =>
    JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  const existing = current.length ? current : [head];
  if (!same(existing, base.length ? base : [head]))
    return { status: "changed" as const };
  const data = existing.slice(1);
  if (plan.length < data.length) throw new Error("Stable ID plan removes rows");
  let cells = 0;
  for (let i = 0; i < plan.length; i++)
    for (let j = 0; j < width; j++) {
      const next = String(plan[i][j] ?? "");
      if (next.length > 50000) throw new Error("Stable ID cell too long");
      if (i < data.length && next !== String(data[i][j] ?? "")) {
        if (j !== column)
          throw new Error("Stable ID plan changes another column");
        cells++;
      }
    }
  return {
    status: "ok" as const,
    headers: existing[0],
    rows: normalize(plan),
    cells,
    added: plan.length - data.length,
  };
}
