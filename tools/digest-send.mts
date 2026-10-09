import {
  runtime,
  boolean,
  failureSignature,
  summarize,
  printSummary,
  failJob,
} from "./notification-runtime.mts";
import * as schedule from "./scheduler.mts";
import {
  selectRecipients,
  type Recipient,
} from "../src/server/notification-recipients.ts";
import { notificationProgram } from "../src/server/notification-program.ts";
import {
  parseWhen,
  digestMessage,
  parseStudents,
  type Student,
} from "../src/server/notification-digest.ts";
import { mapLimit } from "./push-delivery.mts";
import { report } from "./push-report.mts";
async function main() {
  const job = runtime(),
    program = notificationProgram(),
    now = schedule.israelNow(),
    all = boolean(process.env.SEND_ALL),
    mode = process.env.MODE || "learn";
  if (mode !== "learn" && mode !== "joined")
    throw new Error("Invalid digest mode");
  let slots = schedule.slotsDue(now);
  if (process.env.FORCE_SLOT) {
    const match = /^([0-6]):([0-2]?\d:[0-5]\d)$/.exec(process.env.FORCE_SLOT);
    if (!match || Number(match[2].split(":")[0]) > 23)
      throw new Error("Invalid digest slot");
    slots = [
      { day: Number(match[1]), t: match[2].padStart(5, "0"), date: now.date },
    ];
  }
  slots = slots.filter((slot) => slot.day !== 6 || slot.t >= "20:00");
  const current = slots.at(-1);
  async function stop(reason: string) {
    console.log(reason);
    if (!job.dry && process.env.SID && !(await report({ why: reason })))
      process.exitCode = 1;
  }
  if (!current) {
    await stop("No eligible digest slot");
    return;
  }
  const next = current.day === 6 && current.t >= "20:00";
  let week = Math.floor(
    (Date.parse(now.date + "T00:00:00Z") -
      Date.parse(program.program.startDate + "T00:00:00Z")) /
      604800000,
  );
  if (
    week < 0 &&
    program.program.earlyFrom &&
    now.date >= program.program.earlyFrom
  )
    week = 0;
  week += next ? 1 : 0;
  if (
    mode === "learn" &&
    (week < 0 ||
      week >= program.tracks[0].cal.length ||
      !program.tracks.some(
        (track) => track.cal[week]?.[2] && track.cal[week][2] !== "סיום",
      ))
  ) {
    await stop("No active learning week");
    return;
  }
  const [subscriptions, states] = await Promise.all([
    schedule.rows("התראות", job.key),
    schedule.sentRaw(job.key),
  ]);
  if (subscriptions.length > 1 && !subscriptions[0].includes("מועד"))
    throw new Error("Staff schedule column missing");
  const recipients = selectRecipients(subscriptions, {
    role: "צוות",
  }).recipients;
  const sent = schedule.sentFrom(states);
  const keyOf = (recipient: Recipient, slot: schedule.Slot) =>
    "dg|" +
    mode +
    "|" +
    (recipient.id || recipient.sub.endpoint.slice(-24)) +
    "|" +
    slot.date +
    "|" +
    slot.t;
  const due = recipients.flatMap((recipient) => {
    const when = parseWhen(recipient.schedule);
    const slot = all
      ? current
      : [...slots]
          .reverse()
          .find(
            (slot) =>
              when.some(
                (want) =>
                  want.t === slot.t && want.d.includes(String(slot.day)),
              ) && !sent[keyOf(recipient, slot)],
          );
    return slot ? [{ ...recipient, slot }] : [];
  });
  const codes = [
    ...new Set(due.map((recipient) => recipient.code).filter(Boolean)),
  ];
  const boards = new Map<string, Student[] | null>();
  await mapLimit(codes, 4, async (code) => {
    try {
      const result = await schedule.ask({ board: code, key: job.key });
      boards.set(code, parseStudents(result.students));
    } catch {
      boards.set(code, null);
    }
  });
  const failed: string[] = [],
    results = await mapLimit(due, 8, async (recipient) => {
      const students = boards.get(recipient.code);
      if (!students) return 5;
      const message = digestMessage(
        program,
        recipient,
        students,
        week,
        mode,
        next,
      );
      if (!message) return 0;
      const key = all
        ? "dg|manual|" +
          (process.env.SID ||
            process.env.GITHUB_RUN_ID ||
            now.date + "|" + current.t) +
          "|" +
          schedule.subPrint(recipient.sub)
        : keyOf(recipient, recipient.slot);
      if (schedule.isGone(states, key, recipient.sub)) return 3;
      if (job.dry) return 1;
      try {
        const result = await schedule.once(
          key,
          () =>
            job.send(recipient.sub, {
              ...message,
              url: recipient.code
                ? "tzevet?inst=" + encodeURIComponent(recipient.code) + "#my"
                : "./",
            }),
          schedule.failGone(recipient.sub),
        );
        return result && "skipped" in result ? 0 : 1;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "gone" in error &&
          error.gone
        ) {
          if (!(await schedule.markGone(states, recipient.sub)))
            process.exitCode = 1;
          return 4;
        }
        failed.push(key);
        return 2;
      }
    });
  schedule.finish();
  const counts = summarize(results);
  printSummary("digest", counts, job.dry);
  if (counts.failed || counts.readFailures) process.exitCode = 1;
  if (job.dry) return;
  const signature = failureSignature(failed),
    logKey = "dg|" + mode + "|יומן",
    previous = states[logKey] || "אין";
  if (process.env.SID) {
    if (
      !(await report(
        due.length
          ? { n: counts.sent, bad: counts.failed, gone: counts.gone }
          : { none: true },
      ))
    )
      process.exitCode = 1;
  } else if (
    counts.sent ||
    counts.goneNew ||
    (counts.failed && signature !== previous)
  ) {
    if (
      !(await schedule.logRun(
        mode === "joined" ? "כמה מכיתתך הצטרפו" : "העדכון לצוות",
        "עדכון אישי לכל איש צוות שביקש אותו",
        "צוות שביקש עדכון",
        counts.sent,
        counts.failed,
        0,
        counts.gone,
      ))
    )
      process.exitCode = 1;
  }
  if (
    !process.env.SID &&
    signature !== previous &&
    !(await schedule.markOne(logKey, signature))
  )
    process.exitCode = 1;
}
void main().catch(async () => {
  failJob();
  if (process.env.SID && !boolean(process.env.DRY_RUN))
    await report({ why: "ההרצה נפלה" });
});
