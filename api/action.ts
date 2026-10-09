import type { IncomingMessage, ServerResponse } from "node:http";
import { waitUntil } from "@vercel/functions";
import {
  flushNotificationOutbox,
  immediateNotificationsEnabled,
} from "../src/server/notification-outbox.ts";
import { forwardAction } from "../src/server/actions.ts";
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Origin");
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
  try {
    const envelope =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await forwardAction(envelope);
    const pairWrite =
      envelope &&
      typeof envelope === "object" &&
      "payload" in envelope &&
      envelope.payload?.tab === "זוגות";
    if (
      immediateNotificationsEnabled() &&
      result &&
      typeof result === "object" &&
      ("sid" in result || pairWrite)
    )
      waitUntil(
        flushNotificationOutbox().catch(() =>
          console.error(
            "Notification background delivery failed; inspect pending ledger",
          ),
        ),
      );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error" }));
  }
}
