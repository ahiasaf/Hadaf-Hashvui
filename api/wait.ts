import type { IncomingMessage, ServerResponse } from "node:http";
import { runServerTask } from "../src/server/effects.ts";
import { requestNotification } from "../src/server/upstream.ts";
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end();
    return;
  }
  if (req.headers["sec-fetch-site"] === "cross-site") {
    res.writeHead(403);
    res.end();
    return;
  }
  const outcome = await runServerTask("api.wait", () =>
    requestNotification(
      typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    ),
  );
  if (outcome.ok) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(outcome.value));
  } else {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error" }));
  }
}
