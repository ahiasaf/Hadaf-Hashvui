import {
  runtime,
  failureSignature,
  summarize,
  printSummary,
  failJob,
} from "./notification-runtime.mts";
import * as schedule from "./scheduler.mts";
import { selectRecipients } from "../src/server/notification-recipients.ts";
async function main() {
  const job = runtime();
  const force = process.env.FORCE_WHEN?.trim();
  let now = schedule.israelNow();
  if (force) {
    const match = /^(\d{4}-\d{2}-\d{2}) ([0-2]\d):([0-5]\d)$/.exec(force);
    if (
      !match ||
      Number(match[2]) > 23 ||
      !Number.isFinite(Date.parse(match[1] + "T00:00:00Z")) ||
      new Date(match[1] + "T00:00:00Z").toISOString().slice(0, 10) !== match[1]
    )
      throw new Error("Invalid forced reminder time");
    now = {
      ...now,
      date: match[1],
      hour: Number(match[2]),
      min: Number(match[3]),
    };
  }
  const times = new Set(schedule.slotsDue(now).map((slot) => slot.t));
  const [reminders, subscriptions, states] = await Promise.all([
    schedule.rows("תזכורות", job.key),
    schedule.rows("התראות", job.key),
    schedule.sentRaw(job.key),
  ]);
  const recipients = selectRecipients(subscriptions).recipients;
  const byId = new Map(
    recipients.map((recipient) => [recipient.id, recipient.sub]),
  );
  const sent = schedule.sentFrom(states),
    seen = new Set<string>(),
    failed: string[] = [],
    results: number[] = [];
  const keyOf = (row: Record<string, string>) =>
    "rm|" + row["מזהה"] + "|" + row["תאריך"] + "|" + row["שעה"];
  const due = schedule
    .byHead(reminders)
    .filter(
      (row) =>
        row["תאריך"] === now.date &&
        times.has(row["שעה"]) &&
        row["נוסח"] &&
        !sent[keyOf(row)],
    )
    .sort((a, b) => a["שעה"].localeCompare(b["שעה"]));
  for (const row of due) {
    const key = keyOf(row);
    if (seen.has(key)) continue;
    seen.add(key);
    const sub = byId.get(row["מזהה"]);
    if (!sub) {
      failed.push(key);
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
    const current = schedule.two(now.hour) + ":" + (now.min < 30 ? "00" : "30");
    try {
      const delivered = await schedule.once(
        key,
        () =>
          job.send(sub, {
            title: row["שעה"] === current ? "תזכורת" : "תזכורת ל-" + row["שעה"],
            body: row["נוסח"],
            url: "./#admin",
            tag: "remind",
          }),
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
  printSummary("reminders", counts, job.dry);
  if (job.dry || !results.length) return;
  const signature = failureSignature(failed),
    previous = states["rm|יומן"] || "אין";
  if (
    counts.sent ||
    counts.goneNew ||
    ((counts.failed || counts.waiting) && signature !== previous)
  ) {
    if (
      !(await schedule.logRun(
        "תזכורות לרכז",
        "התזכורות שנקבעו במסך השיחות",
        "מכשירי רכז",
        counts.sent,
        counts.failed + counts.waiting,
        0,
        counts.gone,
      ))
    )
      process.exitCode = 1;
  }
  if (signature !== previous && !(await schedule.markOne("rm|יומן", signature)))
    process.exitCode = 1;
  if (counts.failed) process.exitCode = 1;
}
void main().catch(failJob);
