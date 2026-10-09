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
  try {
    const text = await readPublicSheet(
      tab,
      url.searchParams.get("tq") || "",
      url.searchParams.get("headers") || "",
    );
    res.writeHead(200, {
      "Content-Type": "text/csv;charset=utf-8",
      "Cache-Control": url.searchParams.has("fresh")
        ? "no-store"
        : ["דפים פתוחים", "מונים", "מוני-לימוד"].includes(tab)
          ? "public, max-age=30, s-maxage=30, stale-while-revalidate=30"
          : "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(text);
  } catch {
    res.writeHead(502, { "Cache-Control": "no-store" });
    res.end("Public sheet unavailable");
  }
}
