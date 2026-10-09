import { createHash } from "node:crypto";
import { database, readDatabaseTable, stringRecord } from "./database.ts";
import { records, selectRecipients } from "./notification-recipients.ts";
import { notificationProgram, fillTemplate } from "./notification-program.ts";
import { enqueueNotification } from "./notification-outbox.ts";
export async function resolvePairNotificationEvents() {
  const events =
    await database()`SELECT key,payload FROM notification_events WHERE NOT resolved AND key LIKE 'pr|%' ORDER BY created_at LIMIT 64`;
  if (!events.length) return;
  const [peopleRows, subscriptions] = await Promise.all([
    readDatabaseTable("לומדים"),
    readDatabaseTable("התראות"),
  ]);
  const people = new Map(
    records(peopleRows)
      .filter((row) => row["מזהה"])
      .map((row) => [row["מזהה"], row]),
  );
  const phone = (value: string) => value.replace(/[^0-9]/g, "").slice(-9);
  const recipients = selectRecipients(subscriptions).recipients,
    copy = notificationProgram().pair;
  for (const event of events) {
    const row = stringRecord(event.payload),
      key = String(event.key);
    if (
      row["בלי התראה"] === "כן" ||
      (row["דיווח"] !== "ההורה" && row["אושר"] === "כן")
    ) {
      await database()`UPDATE notification_events SET resolved=true WHERE key=${key}`;
      continue;
    }
    const partner = phone(row["טלפון השותף"] || "");
    if (partner.length !== 9) continue;
    const person = [...people.values()].find(
      (row) => phone(row["טלפון"] || "") === partner,
    );
    if (!person) continue;
    const ids = [
      person["מזהה"],
      ...(person["מזהים נוספים"] || "").split(/\s+/),
    ].filter(Boolean);
    const recipient = recipients.find((recipient) =>
      ids.includes(recipient.id),
    );
    if (!recipient) continue;
    const sid = "pair-" + createHash("sha256").update(key).digest("hex"),
      byParent = row["דיווח"] === "ההורה";
    const payload = {
      title: copy.pushT,
      body: fillTemplate(byParent ? copy.pushKidB : copy.pushB, {
        name: (row["שם"] || "").split(/\s+/)[0],
        daf: row["דף"] ? "דף " + row["דף"] : "",
      }),
      url: byParent
        ? "./join"
        : "./join?pr=" +
          encodeURIComponent(
            row["מזהה"] + "|" + row["מסלול"] + "|" + row["שבוע"],
          ),
      tag: "pair",
    };
    // One semantic delivery key is shared with the scheduled fallback.
    await enqueueNotification(
      sid,
      [recipient],
      payload,
      false,
      createHash("sha256").update(key).digest("hex"),
      "מערכת",
      key,
    );
    await database()`UPDATE notification_events SET resolved=true WHERE key=${key}`;
  }
}
