import {
  records,
  filterAudience,
  type AudienceFilter,
} from "./notification-recipients.ts";
export function parentNotificationTargets(
  people: string[][],
  progress: string[][],
  filter: AudienceFilter,
  scope: string,
  grade: string,
  klass: string,
  both: boolean,
) {
  const persons = new Map(
    records(people)
      .filter((row) => row["מזהה"])
      .map((row) => [row["מזהה"], row]),
  );
  const ids = (row: Record<string, string>) =>
    [row["מזהה"], ...(row["מזהים נוספים"] || "").split(/\s+/)].filter(Boolean);
  const phone = (value: string) => value.replace(/[^0-9]/g, "").slice(-9);
  const children = [...persons.values()].filter(
    (row) =>
      row["תפקיד"] === "תלמיד" &&
      (!scope || row["קוד ישיבה"] === scope || row["ישיבה"] === scope) &&
      (!grade || row["שכבה"] === grade) &&
      (!klass || row["כיתה"] === klass),
  );
  const selected = new Set(
    filterAudience(
      children.map((row) => ({ id: row["מזהה"], first: row["שם"] || "" })),
      filter,
      people,
      progress,
    ).map((child) => child.id),
  );
  const byPhone = new Map<string, Record<string, string>[]>(),
    byAlias = new Map<string, Record<string, string>>(),
    byInviter = new Map<string, Record<string, string>[]>();
  const group = (
    map: Map<string, Record<string, string>[]>,
    key: string,
    row: Record<string, string>,
  ) => {
    if (key) map.set(key, [...(map.get(key) || []), row]);
  };
  for (const parent of persons.values()) {
    if (!["הורה", "אב"].includes(parent["תפקיד"])) continue;
    const key = phone(parent["טלפון"] || "");
    if (key.length === 9) group(byPhone, key, parent);
    for (const id of ids(parent)) byAlias.set(id, parent);
    group(byInviter, parent["מזהה המזמין"] || "", parent);
  }
  const allowed = new Set<string>();
  for (const child of children.filter((row) => selected.has(row["מזהה"]))) {
    const childIds = ids(child),
      parents = new Set(byPhone.get(phone(child["טלפון ההורה"] || "")) || []);
    if (both) for (const id of childIds) allowed.add(id);
    const invited = byAlias.get(child["מזהה המזמין"] || "");
    if (invited) parents.add(invited);
    for (const id of childIds)
      for (const parent of byInviter.get(id) || []) parents.add(parent);
    for (const parent of parents) for (const id of ids(parent)) allowed.add(id);
  }
  return allowed;
}
