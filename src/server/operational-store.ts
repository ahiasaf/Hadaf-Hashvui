import { programContent } from "../config/content.ts";
import {
  appendDatabaseRecord,
  database,
  databaseEnabled,
  stringRows,
} from "./database.ts";
export type Report = {
  n?: number;
  bad?: number;
  gone?: number;
  why?: string;
  none?: boolean | number;
  run?: boolean | number;
};
export class SourceUnavailable extends Error {}
export function scriptUrl() {
  return programContent().APPS_SCRIPT_URL;
}
export function pause(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
async function legacyRequest(
  params: Record<string, string>,
  body?: Record<string, string>,
  tries = 3,
): Promise<Record<string, unknown>> {
  const url = new URL(scriptUrl());
  if (!body)
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await fetch(url, {
        ...(body
          ? {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(body),
            }
          : {}),
        signal: AbortSignal.timeout(45000),
      });
      if ([401, 403].includes(response.status))
        throw new Error("Operational request denied");
      if (!response.ok)
        throw new SourceUnavailable("Operational source unavailable");
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("status" in result) ||
        !["ok", "success"].includes(String(result.status))
      )
        throw new Error("Operational request was not acknowledged");
      return result as Record<string, unknown>;
    } catch (error) {
      // Never log URLs, source bodies, participant rows or delivery payloads.
      if (
        error instanceof Error &&
        [
          "Operational request was not acknowledged",
          "Operational request denied",
        ].includes(error.message)
      )
        throw error;
      if (attempt === tries)
        throw new SourceUnavailable(
          "Operational source unavailable after bounded retries",
        );
      await pause(attempt * 3000);
    }
  }
  throw new SourceUnavailable("Operational source unavailable");
}
export async function operationalAsk(
  params: Record<string, string>,
  tries = 3,
): Promise<Record<string, unknown>> {
  if (!databaseEnabled()) return legacyRequest(params, undefined, tries);
  if (params.read) {
    const rows =
      await database()`SELECT headers,(SELECT coalesce(jsonb_agg(cells ORDER BY ordinal),'[]'::jsonb) FROM sheet_rows WHERE table_name=${params.read}) AS rows FROM sheet_tables WHERE name=${params.read}`;
    return {
      status: "ok",
      rows: rows.length ? [rows[0].headers, ...stringRows(rows[0].rows)] : [],
    };
  }
  if (params.board) {
    const { databaseAction } = await import("./database-actions.ts");
    return (await databaseAction("read", params)) as Record<string, unknown>;
  }
  if (params.sayDone) {
    const result = await reportOperationalMessage(params.sayDone, {
      n: Number(params.n) || 0,
      bad: Number(params.bad) || 0,
      gone: Number(params.gone) || 0,
      why: params.why,
      none: params.none === "1",
      run: params.run === "1",
    });
    return { status: "ok", none: !result };
  }
  throw new Error("Unsupported operational request");
}
export async function operationalWrite(tab: string, cols: [string, string][]) {
  if (databaseEnabled()) {
    await appendDatabaseRecord(tab, cols);
    return;
  }
  await legacyRequest(
    {},
    {
      action: "row",
      tab,
      key: process.env.READ_KEY || "",
      cols: JSON.stringify(cols),
    },
  );
}
export async function claimOperationalNotification(key: string) {
  const rows = await database()`SELECT claim_notification(${key}) AS claimed`;
  return rows[0].claimed === true;
}
export async function settleOperationalNotification(
  key: string,
  state: string,
) {
  const rows =
    await database()`SELECT settle_notification(${key},${state}) AS settled`;
  return rows[0].settled === true;
}
export function reportText(report: Report) {
  const n = report.n || 0,
    bad = report.bad || 0,
    gone = report.gone || 0;
  const tail =
    (bad ? " · נכשלה ל-" + bad : "") +
    (gone ? " · אין מנוי פעיל ל-" + gone : "");
  return report.run
    ? "בשליחה"
    : report.why
      ? "נכשלה: " + report.why.slice(0, 200)
      : report.none
        ? "אין נמענים עם התראות" + tail
        : (bad ? "חלקית: " : "") + "התקבלה אצל שירות ההתראות ל-" + n + tail;
}
export async function reportOperationalMessage(sid: string, report: Report) {
  if (!databaseEnabled()) {
    const params: Record<string, string> = {
      sayDone: sid,
      key: process.env.READ_KEY || "",
    };
    for (const [key, value] of Object.entries(report))
      if (value !== undefined)
        params[key] =
          typeof value === "boolean" ? (value ? "1" : "") : String(value);
    await legacyRequest(params);
    return true;
  }
  const rows =
    await database()`SELECT report_notification(${sid},${reportText(report)},${!!report.run}) AS found`;
  return rows[0].found === true;
}
