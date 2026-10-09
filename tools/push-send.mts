import { readFileSync } from "node:fs";
import {
  runtime,
  summarize,
  printSummary,
  failJob,
} from "./notification-runtime.mts";
import { mapLimit } from "../src/server/push-delivery.ts";
import { report } from "./push-report.mts";
import * as schedule from "./scheduler.mts";
import {
  selectRecipients,
  filterAudience,
  parseAudienceFilter,
  personalize,
} from "../src/server/notification-recipients.ts";
function eventPayload(): Record<string, unknown> {
  if (!process.env.GITHUB_EVENT_PATH) return {};
  const value: unknown = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  if (!value || typeof value !== "object")
    throw new Error("Invalid notification event");
  const payload =
    "client_payload" in value
      ? value.client_payload
      : "inputs" in value
        ? value.inputs
        : {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("Invalid notification payload");
  return payload as Record<string, unknown>;
}
async function main() {
  const job = runtime(),
    event = eventPayload();
  const field = (env: string, key: string, fallback = "") =>
    String(process.env[env] || event[key] || fallback).trim();
  process.env.SID = field("SID", "sid");
  const title = field("TITLE", "title", "הדף השבועי"),
    body = field("BODY", "body", "דף חדש מחכה לך."),
    link = field("LINK", "url") || field("LINK", "link") || "./";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:|^\/\//.test(link) || /[\\\r\n]/.test(link))
    throw new Error("Notification link must be relative");
  const filter = parseAudienceFilter(field("FLT", "flt", "{}")),
    wait = field("WAIT", "wait");
  const [subscriptions, people, progress, states] = await Promise.all([
    schedule.rows(wait ? "ממתינים לדף" : "התראות", job.key),
    filter.per || filter.way || filter.ids || filter.seg
      ? schedule.rows("לומדים", job.key)
      : Promise.resolve([]),
    filter.seg ? schedule.rows("לימוד", job.key) : Promise.resolve([]),
    schedule.sentRaw(job.key),
  ]);
  const selected = selectRecipients(subscriptions, {
    only: field("ONLY", "only"),
    grade: field("GRADE", "grade"),
    klass: field("KLASS", "klass"),
    role: field("ROLE", "role"),
    wait,
  });
  const recipients = filterAudience(
    selected.recipients,
    filter,
    people,
    progress,
  );
  if (job.dry) {
    printSummary("manual", summarize(recipients.map(() => 1)), true);
    return;
  }
  if (process.env.SID && !(await report({ run: true })))
    throw new Error("Notification start was not acknowledged");
  const run = process.env.SID || process.env.GITHUB_RUN_ID;
  const results = await mapLimit(recipients, 8, async (recipient) => {
    const key = run
      ? "manual|" + run + "|" + schedule.subPrint(recipient.sub)
      : "";
    if (schedule.isGone(states, key, recipient.sub)) return 3;
    const first = filter.per ? recipient.first : "";
    const send = () =>
      job.send(recipient.sub, {
        title: personalize(title, first),
        body: personalize(body, first),
        url: link,
      });
    try {
      const result = key
        ? await schedule.once(key, send, schedule.failGone(recipient.sub))
        : await send();
      return "skipped" in result ? 0 : 1;
    } catch (error) {
      if (error && typeof error === "object" && "gone" in error && error.gone) {
        if (!(await schedule.markGone(states, recipient.sub)))
          process.exitCode = 1;
        return 4;
      }
      return 2;
    }
  });
  schedule.finish();
  const counts = summarize(results);
  printSummary("manual", counts, false);
  if (
    process.env.SID &&
    !(await report({
      n: counts.sent,
      bad: counts.failed,
      gone: counts.gone,
      none: !counts.sent && !counts.failed,
      why:
        counts.failed && !counts.sent ? "שירות ההתראות דחה את כל השליחות" : "",
    }))
  )
    process.exitCode = 1;
  if (counts.failed && !counts.sent) process.exitCode = 1;
}
void main().catch(async () => {
  if (!/^(1|true|yes)$/i.test(process.env.DRY_RUN || ""))
    await report({ why: "השליחה נכשלה. יש לבדוק את ההרצה ב-GitHub." });
  failJob();
});
