import { createHash } from "node:crypto";
import { database, readDatabaseTable, stringRecord } from "./database.ts";
import { selectRecipients } from "./notification-recipients.ts";
import { enqueueNotification } from "./notification-outbox.ts";
export async function resolveNotificationFailureEvents() {
  const events =
    await database()`SELECT key,payload FROM notification_events WHERE NOT resolved AND key LIKE 'failure|%' ORDER BY created_at LIMIT 32`;
  if (!events.length) return;
  const recipients = selectRecipients(await readDatabaseTable("התראות"), {
    role: "רכז",
  }).recipients;
  if (!recipients.length) return;
  for (const event of events) {
    const row = stringRecord(event.payload),
      key = String(event.key);
    for (const recipient of recipients) {
      const hash = createHash("sha256")
        .update(key + "|" + recipient.sub.endpoint)
        .digest("hex");
      await enqueueNotification(
        "failure-" + hash,
        [recipient],
        {
          title: "שליחת הודעה נכשלה",
          body:
            (row["מי"] || "הצוות") +
            ": יש לבדוק את תוצאת השליחה ביומן ההודעות.",
          url: "./#admin",
          tag: "failure",
        },
        false,
        hash,
        "מערכת",
      );
    }
    await database()`UPDATE notification_events SET resolved=true WHERE key=${key}`;
  }
}
