import webpush from "web-push";
import { createHash } from "node:crypto";
import { database, databaseEnabled, stringRecord } from "./database.ts";
import {
  parseSubscription,
  personalize,
  type Recipient,
} from "./notification-recipients.ts";
import { pushPublicKey, pushSubject } from "../config/push.ts";
import { deliver, mapLimit, type PushSender } from "./push-delivery.ts";
import { reportOperationalMessage } from "./operational-store.ts";
export type NotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};
export function immediateNotificationsEnabled() {
  return (
    databaseEnabled() && process.env.HADAF_NOTIFICATION_DELIVERY === "direct"
  );
}
export function requireImmediateNotifications() {
  if (!immediateNotificationsEnabled() || !process.env.VAPID_PRIVATE)
    throw new Error("Immediate notification delivery is not configured");
}
export async function enqueueNotification(
  sid: string,
  recipients: Recipient[],
  payload: NotificationPayload,
  personal = false,
  hash: string,
  who: string,
  deliveryKey?: string,
) {
  if (!/^[\w.-]{1,100}$/.test(sid))
    throw new Error("Invalid notification request identity");
  if (deliveryKey && (recipients.length !== 1 || deliveryKey.length > 500))
    throw new Error("Invalid semantic notification identity");
  const rows = recipients.map((recipient) => ({
    key:
      deliveryKey ||
      "manual|" +
        sid +
        "|" +
        createHash("sha1")
          .update(recipient.sub.endpoint)
          .digest("hex")
          .slice(0, 12),
    sid,
    subscription: recipient.sub,
    payload: {
      ...payload,
      title: personalize(payload.title, personal ? recipient.first : ""),
      body: personalize(payload.body, personal ? recipient.first : ""),
    },
  }));
  const columns = JSON.stringify([
    ["מזהה שליחה", sid],
    ["מי", who],
    ["כותרת", payload.title],
    ["הטקסט", payload.body],
    ["תוצאה", rows.length ? "ממתין" : "אין נמענים עם התראות"],
  ]);
  const result =
    await database()`SELECT enqueue_notification_request(${sid},${hash},${columns}::jsonb,${JSON.stringify(rows)}::jsonb) AS created`;
  return { status: "ok", sid, queued: rows.length, reused: !result[0].created };
}
export async function drainNotificationOutbox(sender?: PushSender, limit = 16) {
  requireImmediateNotifications();
  if (!sender) {
    webpush.setVapidDetails(
      pushSubject,
      pushPublicKey,
      process.env.VAPID_PRIVATE!,
    );
    sender = webpush;
  }
  const { resolvePairNotificationEvents } =
    await import("./pair-notification-event.ts");
  await resolvePairNotificationEvents();
  const { resolveNotificationFailureEvents } =
    await import("./notification-failure-event.ts");
  await resolveNotificationFailureEvents();
  const rows =
    await database()`SELECT * FROM claim_notification_outbox(${limit})`;
  const sids = new Set<string>();
  const counts = { sent: 0, failed: 0, gone: 0, uncertain: 0 };
  await mapLimit(rows, 8, async (row) => {
    const sub = parseSubscription(JSON.stringify(row.subscription)),
      payload = stringRecord(row.payload);
    if (!sub || !payload.title || !payload.body || !payload.url)
      throw new Error("Invalid stored notification");
    const result = await deliver(sender!, sub, JSON.stringify(payload), {
      TTL: payload.tag === "pair" ? 86400 : 3600,
      attempts: 1,
      timeout: 8000,
    });
    const state = result.ok
      ? "sent"
      : result.gone
        ? "gone"
        : result.uncertain
          ? "uncertain"
          : "failed";
    const settled =
      await database()`SELECT settle_notification_outbox(${String(row.key)},${state}) AS settled`;
    if (!settled[0].settled)
      throw new Error("Notification settlement was not acknowledged");
    counts[state]++;
    sids.add(String(row.sid));
  });
  for (const sid of sids) {
    const status =
      await database()`SELECT state,count(*)::int AS n,bool_or(attempts<3) AS retryable FROM notification_outbox WHERE sid=${sid} GROUP BY state`;
    const count = (state: string) =>
      Number(status.find((row) => row.state === state)?.n || 0);
    if (
      !count("queued") &&
      !count("sending") &&
      !count("uncertain") &&
      !status.some((row) => row.state === "failed" && row.retryable)
    )
      await reportOperationalMessage(sid, {
        n: count("sent"),
        gone: count("gone"),
        bad: count("failed"),
        why:
          !count("sent") && count("failed")
            ? "שירות ההתראות דחה את השליחות"
            : "",
      });
  }
  return counts;
}

export async function flushNotificationOutbox(
  sender?: PushSender,
  budget = 100000,
) {
  const deadline = Date.now() + budget,
    counts = { sent: 0, failed: 0, gone: 0, uncertain: 0 };
  while (Date.now() < deadline - 20000) {
    const batch = await drainNotificationOutbox(sender);
    for (const state of ["sent", "failed", "gone", "uncertain"] as const)
      counts[state] += batch[state];
    if (Object.values(batch).reduce((sum, value) => sum + value, 0) < 16) break;
  }
  return counts;
}
