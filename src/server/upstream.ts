import { parseCsv } from "../lib/csv.ts";
import settings from "../generated/settings.json" with { type: "json" };
import { publicTabs, validatePublicRows } from "./public-schema.ts";
export { publicTabs, validatePublicRows } from "./public-schema.ts";
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
  validatePublicRows(tab, rows);
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
  const { databaseEnabled, appendDatabaseRecord, requireWritable } =
    await import("./database.ts");
  await requireWritable();
  if (await databaseEnabled()) {
    const result: unknown = await appendDatabaseRecord("ממתינים לדף", cols);
    if (
      !result ||
      typeof result !== "object" ||
      !("status" in result) ||
      result.status !== "success"
    )
      throw new Error("Write was not acknowledged");
    return { status: "ok" };
  }
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
