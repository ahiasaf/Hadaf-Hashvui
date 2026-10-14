import type { IncomingMessage, ServerResponse } from "node:http";
import { waitUntil } from "@vercel/functions";
import {
  flushNotificationOutbox,
  immediateNotificationsEnabled,
} from "../src/server/notification-outbox.ts";
import { forwardAction } from "../src/server/actions.ts";
import { runServerTask } from "../src/server/effects.ts";
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
  const outcome = await runServerTask("api.action", async () => {
    const envelope =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await forwardAction(envelope);
    const pairWrite =
      envelope &&
      typeof envelope === "object" &&
      "payload" in envelope &&
      envelope.payload?.tab === "זוגות";
    if (
      (await immediateNotificationsEnabled()) &&
      result &&
      typeof result === "object" &&
      ("sid" in result || "notified" in result || pairWrite)
    )
      waitUntil(
        flushNotificationOutbox(undefined, 45000).catch(() =>
          console.error(
            "Notification background delivery failed; inspect pending ledger",
          ),
        ),
      );
    return result;
  });
  if (outcome.ok === true) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(outcome.value));
  } else {
    const paused = outcome.paused;
    res.writeHead(paused ? 503 : 502, {
      "Content-Type": "application/json",
      ...(paused ? { "Retry-After": "120" } : {}),
    });
    res.end(JSON.stringify({ status: paused ? "paused" : "error" }));
  }
}
