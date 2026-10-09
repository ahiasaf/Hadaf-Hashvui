import {
  runtime,
  failureSignature,
  summarize,
  printSummary,
  failJob,
} from "./notification-runtime.mts";
import * as schedule from "./scheduler.mts";
import { selectRecipients } from "../src/server/notification-recipients.ts";
import {
  notificationProgram,
  fillTemplate,
} from "../src/server/notification-program.ts";
function phoneKey(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 9 ? digits.slice(-9) : "";
}
async function main() {
  const job = runtime(),
    now = schedule.israelNow();
  if ((now.day === 6 && now.hour < 20) || (now.day === 5 && now.hour >= 12)) {
    console.log("Pair notifications deferred during Shabbat");
    return;
  }
  const [pairRows, peopleRows, subscriptionRows, states] = await Promise.all([
    schedule.rows("זוגות", job.key),
    schedule.rows("לומדים", job.key),
    schedule.rows("התראות", job.key),
    schedule.sentRaw(job.key),
  ]);
  const copy = notificationProgram().pair,
    seen = new Set<string>(),
    sent = schedule.sentFrom(states),
    failed: string[] = [],
    results: number[] = [];
  const people = new Map(
    schedule
      .byHead(peopleRows)
      .filter((row) => row["מזהה"])
      .map((row) => [row["מזהה"], row]),
  );
  const byPhone = new Map<string, string[]>();
  for (const [id, row] of people) {
    const phone = phoneKey(row["טלפון"] || "");
    if (phone)
      byPhone.set(
        phone,
        [id, ...(row["מזהים נוספים"] || "").split(/\s+/)].filter(Boolean),
      );
  }
  const recipients = selectRecipients(subscriptionRows).recipients;
  const keyOf = (row: Record<string, string>) =>
    "pr|" + row["מזהה"] + "|" + row["מסלול"] + "|" + row["שבוע"];
  for (const row of schedule.byHead(pairRows)) {
    const key = keyOf(row);
    if (
      !row["מזהה"] ||
      !row["מסלול"] ||
      !row["שבוע"] ||
      sent[key] ||
      seen.has(key) ||
      row["בלי התראה"] === "כן" ||
      (row["דיווח"] !== "ההורה" && row["אושר"] === "כן")
    )
      continue;
    seen.add(key);
    const ids = byPhone.get(phoneKey(row["טלפון השותף"] || "")),
      sub = ids
        ? recipients.find((recipient) => ids.includes(recipient.id))?.sub
        : null;
    if (!sub) {
      results.push(0);
      continue;
    }
    if (schedule.isGone(states, key, sub)) {
      results.push(3);
      continue;
    }
    if (job.dry) {
      results.push(1);
      continue;
    }
    const byParent = row["דיווח"] === "ההורה";
    const body = fillTemplate(byParent ? copy.pushKidB : copy.pushB, {
      name: (row["שם"] || "").split(/\s+/)[0],
      daf: row["דף"] ? "דף " + row["דף"] : "",
    });
    const link = byParent
      ? "./join"
      : "./join?pr=" +
        encodeURIComponent(
          row["מזהה"] + "|" + row["מסלול"] + "|" + row["שבוע"],
        );
    try {
      const delivered = await schedule.once(
        key,
        () =>
          job.send(
            sub,
            { title: copy.pushT, body, url: link, tag: "pair" },
            86400,
          ),
        schedule.failGone(sub),
      );
      results.push(delivered && "skipped" in delivered ? 0 : 1);
    } catch (error) {
      if (error && typeof error === "object" && "gone" in error && error.gone) {
        if (!(await schedule.markGone(states, sub))) process.exitCode = 1;
        results.push(4);
      } else {
        failed.push(key);
        results.push(2);
      }
    }
  }
  schedule.finish();
  const counts = summarize(results);
  printSummary("pairs", counts, job.dry);
  if (job.dry) return;
  const signature = failureSignature(failed),
    previous = states["pr|יומן"] || "אין";
  if (
    counts.sent ||
    counts.goneNew ||
    (counts.failed && signature !== previous)
  ) {
    if (
      !(await schedule.logRun(
        "לימוד משותף",
        "הודעה על לימוד משותף שדווח",
        "הורים ובנים שדיווחו",
        counts.sent,
        counts.failed,
        counts.waiting,
        counts.gone,
      ))
    )
      process.exitCode = 1;
  }
  if (signature !== previous && !(await schedule.markOne("pr|יומן", signature)))
    process.exitCode = 1;
  if (counts.failed) process.exitCode = 1;
}
void main().catch(failJob);
