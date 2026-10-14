import { runServerTask } from "../src/server/effects.ts";
import { parseCsv } from "../src/lib/csv.ts";
import { isSampleInstitution } from "../src/lib/institution-visibility.ts";
import { csvText } from "../src/server/public-query.ts";
import { databaseEnabled, readDatabaseSheet } from "../src/server/database.ts";
import type { IncomingMessage, ServerResponse } from "node:http";
import { publicTabs, readPublicSheet } from "../src/server/upstream.ts";
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end();
    return;
  }
  const url = new URL(req.url || "/", "https://local.invalid");
  const tab = url.searchParams.get("tab") || "";
  if (!publicTabs.has(tab)) {
    res.writeHead(400);
    res.end("Unknown public sheet");
    return;
  }
  const controller = new AbortController();
  const disconnect = () => controller.abort();
  res.once("close", disconnect);
  const outcome = await runServerTask("api.sheets", async () => {
    const text = (await databaseEnabled())
      ? await readDatabaseSheet(
          tab,
          url.searchParams.get("tq") || "",
          url.searchParams.has("fresh"),
        )
      : await readPublicSheet(
          tab,
          url.searchParams.get("tq") || "",
          url.searchParams.get("headers") || "",
          fetch,
          controller.signal,
        );
    if (tab === "מוסדות") {
      const rows = parseCsv(text);
      const name =
        rows[0]?.findIndex((header) =>
          /^(name|שם|ישיבה)$/i.test(header.trim()),
        ) ?? -1;
      return name >= 0
        ? csvText([
            rows[0],
            ...rows
              .slice(1)
              .filter((row) => !isSampleInstitution(row[name] || "")),
          ])
        : text;
    }
    return text;
  });
  res.off("close", disconnect);
  if (res.destroyed) return;
  if (outcome.ok === true) {
    res.writeHead(200, {
      "Content-Type": "text/csv;charset=utf-8",
      "Cache-Control": url.searchParams.has("fresh")
        ? "no-store"
        : ["דפים פתוחים", "מונים", "מוני-לימוד"].includes(tab)
          ? "public, max-age=30, s-maxage=30, stale-while-revalidate=30"
          : "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(outcome.value);
  } else {
    res.writeHead(502, { "Cache-Control": "no-store" });
    res.end("Public sheet unavailable");
  }
}
