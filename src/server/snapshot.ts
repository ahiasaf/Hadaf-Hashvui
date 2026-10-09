import { createHash } from "node:crypto";
type Sheet = {
  name: string;
  rows: string[][];
  metadata?: Record<string, unknown>;
};
export type Snapshot = { version: 1; capturedAt: string; tables: Sheet[] };
export function prepareSnapshot(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid snapshot");
  const snapshot = input as Snapshot;
  if (
    snapshot.version !== 1 ||
    !Number.isFinite(Date.parse(snapshot.capturedAt)) ||
    !Array.isArray(snapshot.tables)
  )
    throw new Error("Invalid snapshot");
  const names = new Set<string>();
  for (const table of snapshot.tables) {
    if (
      !table ||
      typeof table.name !== "string" ||
      !table.name.trim() ||
      names.has(table.name) ||
      !Array.isArray(table.rows) ||
      !table.rows.every(
        (row) =>
          Array.isArray(row) && row.every((cell) => typeof cell === "string"),
      )
    )
      throw new Error("Invalid or duplicate table");
    names.add(table.name);
    const headers = table.rows[0] || [];
    if (
      new Set(headers).size !== headers.length ||
      table.rows.some((row) => row.length > headers.length)
    )
      throw new Error("Invalid columns");
  }
  function records(name: string, required: string[]) {
    const table = snapshot.tables.find((table) => table.name === name);
    if (!table) throw new Error("Required source table missing");
    const headers = table.rows[0] || [];
    if (required.some((column) => !headers.includes(column)))
      throw new Error("Required source columns missing");
    return table.rows.slice(1).map((row, index) => ({
      ordinal: index + 1,
      cells: Object.fromEntries(
        headers.map((header, col) => [header, row[col] || ""]),
      ),
    }));
  }
  const people = new Map<string, Record<string, string>>();
  for (const { cells } of records("לומדים", [
    "מזהה",
    "שם",
    "משפחה",
    "קוד ישיבה",
  ])) {
    const id = cells["מזהה"].trim();
    if (id) people.set(id, cells);
  }
  const aliases = new Map<string, string>();
  for (const [id, person] of people) {
    for (const alias of [
      id,
      ...(person["מזהים נוספים"] || "").split(/\s+/),
    ].filter(Boolean)) {
      if (aliases.has(alias) && aliases.get(alias) !== id)
        throw new Error("Conflicting device aliases");
      aliases.set(alias, id);
    }
  }
  const progress = records("לימוד", ["מזהה", "מסלול", "שבוע"])
    .filter(({ cells }) => cells["מזהה"].trim())
    .map(({ ordinal, cells }) => {
      const week = Number(cells["שבוע"]);
      if (
        !Number.isInteger(week) ||
        week < 1 ||
        !["taanit", "megila"].includes(cells["מסלול"])
      )
        throw new Error("Invalid progress identity");
      const at = cells["קטע"]?.trim() || "";
      const segment = Number.parseInt(at, 10),
        total = Number.parseInt(cells["מתוך"] || "", 10);
      const complete = !at || !(total > 0) || segment >= total;
      const fraction = complete
        ? 1
        : Number.isFinite(segment / total)
          ? Math.max(0, Math.min(1, segment / total))
          : 0;
      return { ordinal, cells, week, complete, fraction };
    });
  const hash = createHash("sha256")
    .update(JSON.stringify(snapshot))
    .digest("hex");
  const report = {
    tables: snapshot.tables.map((table) => ({
      name: table.name,
      rows: Math.max(0, table.rows.length - 1),
    })),
    people: people.size,
    aliases: aliases.size,
    progress: progress.length,
    sourceHash: hash,
  };
  return { snapshot, people, aliases, progress, report };
}
