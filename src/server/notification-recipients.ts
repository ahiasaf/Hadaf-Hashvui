import type { Subscription } from "./push-delivery.ts";
export type Recipient = {
  sub: Subscription;
  id: string;
  first: string;
  institution: string;
  code: string;
  grade: string;
  klass: string;
  role: string;
  schedule: string;
};
export type RecipientFilter = {
  only?: string;
  grade?: string;
  klass?: string;
  role?: string;
  wait?: string;
};
export type AudienceFilter = {
  seg?: "done" | "mid" | "todo" | "none";
  way?: string;
  ids?: string[];
  per?: boolean;
  wk?: number;
};
export function parseSubscription(text: string): Subscription | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object") return null;
    const { endpoint, keys } = value as { endpoint?: unknown; keys?: unknown };
    if (
      typeof endpoint !== "string" ||
      !endpoint.startsWith("https://") ||
      !keys ||
      typeof keys !== "object"
    )
      return null;
    const { auth, p256dh } = keys as { auth?: unknown; p256dh?: unknown };
    return typeof auth === "string" &&
      auth &&
      typeof p256dh === "string" &&
      p256dh
      ? { endpoint, keys: { auth, p256dh } }
      : null;
  } catch {
    return null;
  }
}
export function records(rows: string[][]) {
  return rows
    .slice(1)
    .map((row) =>
      Object.fromEntries(
        (rows[0] || []).map((header, index) => [
          header.trim(),
          (row[index] || "").trim(),
        ]),
      ),
    );
}
export function selectRecipients(
  rows: string[][],
  filter: RecipientFilter = {},
) {
  const required = [
    "מנוי",
    ...(filter.grade ? ["שכבה"] : []),
    ...(filter.klass ? ["כיתה"] : []),
    ...(filter.role ? ["תפקיד"] : []),
    ...(filter.wait ? ["דף"] : []),
  ];
  if (
    rows.length > 1 &&
    (required.some((column) => !rows[0].includes(column)) ||
      (filter.only &&
        !rows[0].includes("ישיבה") &&
        !rows[0].includes("קוד ישיבה")))
  )
    throw new Error("Notification targeting columns missing");
  const recipients: Recipient[] = [],
    seenIds = new Set<string>(),
    seenEndpoints = new Set<string>();
  let blocked = 0;
  for (const row of records(rows).reverse()) {
    const id = row["מזהה"] || "";
    // An older class, role or permission record must never override the current device record.
    const deviceKey = filter.wait ? id + "|" + (row["דף"] || "") : id;
    if (id && seenIds.has(deviceKey)) continue;
    if (id) seenIds.add(deviceKey);
    if (filter.wait && row["דף"] !== filter.wait) continue;
    if (
      filter.only &&
      row["ישיבה"] !== filter.only &&
      row["קוד ישיבה"] !== filter.only
    )
      continue;
    if (filter.grade && row["שכבה"] !== filter.grade) continue;
    if (filter.klass && row["כיתה"] !== filter.klass) continue;
    const role = row["תפקיד"] || "";
    if (
      filter.role === "צוות"
        ? !role || ["תלמיד", "הורה", "אב"].includes(role)
        : filter.role && role !== filter.role
    )
      continue;
    if (!row["מנוי"]) {
      blocked++;
      continue;
    }
    const sub = parseSubscription(row["מנוי"]);
    if (!sub || seenEndpoints.has(sub.endpoint)) continue;
    seenEndpoints.add(sub.endpoint);
    recipients.push({
      sub,
      id,
      first: (row["שם"] || "").split(/\s+/)[0],
      institution: row["ישיבה"] || "",
      code: row["קוד ישיבה"] || "",
      grade: row["שכבה"] || "",
      klass: row["כיתה"] || "",
      role,
      schedule: row["מועד"] || "",
    });
  }
  return { recipients, blocked };
}
export function filterAudience<T extends { id: string; first: string }>(
  recipients: T[],
  filter: AudienceFilter,
  people: string[][],
  progress: string[][],
) {
  const aliases = new Map<string, string>(),
    persons = new Map<string, Record<string, string>>();
  for (const row of records(people)) {
    const id = row["מזהה"];
    if (!id) continue;
    persons.set(id, row);
  }
  for (const [id, row] of persons) {
    for (const alias of [
      id,
      ...(row["מזהים נוספים"] || "").split(/\s+/),
    ].filter(Boolean))
      aliases.set(alias, id);
  }
  const states = new Map<string, "done" | "mid">();
  for (const row of records(progress)) {
    if (row["שבוע"] !== String(filter.wk)) continue;
    const id = aliases.get(row["מזהה"]) || row["מזהה"];
    const segment = (row["קטע"] || "").trim(),
      at = Number.parseInt(segment, 10),
      total = Number.parseInt(row["מתוך"] || "", 10);
    if (!segment || !(total > 0) || at >= total) states.set(id, "done");
    else if (states.get(id) !== "done") states.set(id, "mid");
  }
  return recipients.flatMap((recipient) => {
    const canonical = aliases.get(recipient.id) || recipient.id,
      p = persons.get(canonical);
    if (
      filter.ids &&
      !filter.ids.includes(recipient.id) &&
      !filter.ids.includes(canonical)
    )
      return [];
    if (filter.way && (!p || p["מסגרת"] !== filter.way)) return [];
    const state = states.get(canonical) || "none";
    if (
      filter.seg === "todo"
        ? state === "done"
        : filter.seg && state !== filter.seg
    )
      return [];
    return [{ ...recipient, first: p?.["שם"] || recipient.first }];
  });
}
export function personalize(text: string, first: string) {
  return first
    ? text.replaceAll("{name}", first)
    : text.replace(/\{name\}[,،]?\s*/g, "");
}
export function parseAudienceFilter(text: string): AudienceFilter {
  const value: unknown = JSON.parse(text || "{}");
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid notification filter");
  const filter = value as Record<string, unknown>;
  if (
    Object.keys(filter).some(
      (key) => !["seg", "way", "ids", "per", "wk"].includes(key),
    ) ||
    (filter.seg !== undefined &&
      !["done", "mid", "todo", "none", ""].includes(String(filter.seg))) ||
    (filter.way !== undefined && typeof filter.way !== "string") ||
    (filter.ids !== undefined &&
      (!Array.isArray(filter.ids) ||
        filter.ids.length > 60 ||
        !filter.ids.every(
          (id) => typeof id === "string" && /^[\w:.-]+$/.test(id),
        ))) ||
    (filter.wk !== undefined &&
      (!Number.isInteger(Number(filter.wk)) ||
        Number(filter.wk) < 1 ||
        Number(filter.wk) > 60)) ||
    (filter.per !== undefined &&
      ![true, false, 1, 0].includes(filter.per as number))
  )
    throw new Error("Invalid notification filter");
  if (filter.seg && filter.wk === undefined)
    throw new Error("A notification segment requires a week");
  return {
    seg: filter.seg ? (filter.seg as AudienceFilter["seg"]) : undefined,
    way: filter.way as string | undefined,
    ids: filter.ids as string[] | undefined,
    per: !!filter.per,
    wk: filter.wk === undefined ? undefined : Number(filter.wk),
  };
}
