import { parseCsv } from "../lib/csv.ts";
import settings from "../generated/settings.json" with { type: "json" };
export const publicTabs = new Set([
  "מוסדות",
  "מצגות",
  "דפים פתוחים",
  "מונים",
  "מוני-לימוד",
  "טקסטים",
  "הגדרות",
  "נוסחים",
  "סימוני הדף",
  "פירוש",
  "שאלות בדף",
  "מצגת",
]);
export function sheetUrl(tab: string, query = "", headers = "") {
  if (
    !publicTabs.has(tab) ||
    query.length > 400 ||
    (headers && !/^\d$/.test(headers))
  )
    throw new Error("Invalid public sheet request");
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${settings.sheetId}/gviz/tq`,
  );
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", tab);
  if (query) url.searchParams.set("tq", query);
  url.searchParams.set("headers", headers || "1");
  return url;
}
export async function readPublicSheet(
  tab: string,
  query = "",
  headers = "",
  request = fetch,
) {
  const response = await request(sheetUrl(tab, query, headers), {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Upstream read failed");
  const text = await response.text();
  if (/^\s*</.test(text)) throw new Error("Unexpected sheet response");
  const rows = parseCsv(text);
  const header = rows[0] || [];
  if (
    !header.length ||
    /טלפון|איש קשר|phone|contact|מנוי/i.test(header.join("|"))
  )
    throw new Error("Unexpected private schema");
  if (
    tab === "מוסדות" &&
    (!/^(code|קוד)$/i.test(header[0]) ||
      !/^(name|שם|ישיבה)$/i.test(header[1] || ""))
  )
    throw new Error("Unexpected institutions schema");
  if (
    ["טקסטים", "הגדרות"].includes(tab) &&
    !header.some((value) => /^(מפתח|key)$/i.test(value))
  )
    throw new Error("Unexpected settings schema");
  if (
    tab === "נוסחים" &&
    (!header.includes("קטגוריה") || !header.includes("נוסח"))
  )
    throw new Error("Unexpected templates schema");
  if (["מונים", "מוני-לימוד"].includes(tab) && !header.includes("קוד ישיבה"))
    throw new Error("Unexpected counts schema");
  if (
    [
      "מצגות",
      "דפים פתוחים",
      "סימוני הדף",
      "פירוש",
      "שאלות בדף",
      "מצגת",
    ].includes(tab) &&
    (!header.some((value) => value === "מסכת") ||
      (tab !== "מצגות" && !header.some((value) => value === "דף")))
  )
    throw new Error("Unexpected lesson schema");
  const required: Record<string, string[]> = {
    "דפים פתוחים": ["נפתח"],
    "סימוני הדף": ["עמוד", "נתונים"],
    מצגות: ["שבוע", "קבצים"],
  };
  if ((required[tab] || []).some((value) => !header.includes(value)))
    throw new Error("Unexpected public schema");
  return text;
}
export async function requestNotification(payload: unknown, request = fetch) {
  if (!payload || typeof payload !== "object")
    throw new Error("Invalid request");
  const value = payload as Record<string, unknown>;
  if (
    value.action !== "row" ||
    value.tab !== "ממתינים לדף" ||
    typeof value.cols !== "string" ||
    value.cols.length > 12000 ||
    value.key ||
    value.ss
  )
    throw new Error("Invalid request");
  const cols: unknown = JSON.parse(value.cols);
  const allowed = ["דף", "מזהה", "שם", "ישיבה", "מכשיר", "מנוי", "מתי"];
  if (
    !Array.isArray(cols) ||
    cols.length !== allowed.length ||
    !cols.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        allowed.includes(pair[0]) &&
        typeof pair[1] === "string",
    )
  )
    throw new Error("Invalid columns");
  if (new Set(cols.map((pair) => pair[0])).size !== allowed.length)
    throw new Error("Duplicate columns");
  if (
    !/^(taanit|megila)\|[א-ת]{1,4}[.:]?$/.test(
      cols.find((pair) => pair[0] === "דף")[1],
    )
  )
    throw new Error("Invalid lesson");
  const sub = JSON.parse(cols.find((pair) => pair[0] === "מנוי")[1]);
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.endpoint.startsWith("https://") ||
    !sub.keys?.auth ||
    !sub.keys?.p256dh
  )
    throw new Error("Invalid subscription");
  const response = await request(settings.api, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "row", tab: value.tab, cols: value.cols }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Upstream write failed");
  const result = await response.json();
  if (result.status !== "ok") throw new Error("Write was not acknowledged");
  return { status: "ok" };
}
