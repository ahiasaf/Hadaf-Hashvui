import { parentNotificationTargets } from "./parent-notification-targets.ts";
import { createHash } from "node:crypto";
import { authorized, readDatabaseTable } from "./database.ts";
import { databaseAction } from "./database-actions.ts";
import {
  selectRecipients,
  filterAudience,
  parseAudienceFilter,
} from "./notification-recipients.ts";
import {
  requireImmediateNotifications,
  enqueueNotification,
} from "./notification-outbox.ts";
export async function queueNotificationRequest(
  payload: Record<string, string>,
) {
  await requireImmediateNotifications();
  const admin = authorized(payload.key, process.env.READ_KEY),
    scope = admin ? payload.only || "" : payload.inst;
  if (!admin) {
    if (!scope) throw new Error("Authentication required");
    const board = await databaseAction("read", {
      board: scope,
      k: payload.k || "",
    });
    if (
      !board ||
      typeof board !== "object" ||
      !("status" in board) ||
      board.status !== "ok"
    )
      throw new Error("Access denied");
  }
  const title = (payload.title || "הדף השבועי").trim(),
    body = (payload.body || "").trim(),
    url = (payload.url || "./").trim();
  if (!body || title.length > 200 || body.length > 4000)
    throw new Error("Invalid notification text");
  if (
    !/^(?:\.\/)?[A-Za-z0-9_/-]{0,60}(?:\?[A-Za-z0-9_=&%\u0590-\u05FF-]{0,120})?(?:#[A-Za-z0-9_-]{0,30})?$/.test(
      url,
    ) ||
    url.startsWith("//")
  )
    throw new Error("Invalid notification destination");
  if (
    payload.aud &&
    !["kids", "students", "parents", "both"].includes(payload.aud)
  )
    throw new Error("Unsupported notification audience");
  const raw: unknown = JSON.parse(payload.flt || "{}");
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid notification filter");
  const { par, ...rest } = raw as Record<string, unknown>;
  if (par !== undefined && !["p", "pk"].includes(String(par)))
    throw new Error("Invalid parent audience");
  const parentMode =
    payload.aud === "parents"
      ? "p"
      : payload.aud === "both"
        ? "pk"
        : admin
          ? String(par || "")
          : "";
  const filter = parseAudienceFilter(JSON.stringify(rest)),
    wait = admin ? payload.wait || "" : "";
  const [subscriptions, people, progress] = await Promise.all([
    readDatabaseTable(wait ? "ממתינים לדף" : "התראות"),
    readDatabaseTable("לומדים"),
    filter.seg ? readDatabaseTable("לימוד") : Promise.resolve([]),
  ]);
  const selected = selectRecipients(
    subscriptions,
    parentMode
      ? {}
      : {
          only: scope,
          grade: payload.grade,
          klass: payload.klass,
          role: admin ? payload.role : "תלמיד",
          wait,
        },
  );
  const allowed = parentMode
    ? parentNotificationTargets(
        people,
        progress,
        filter,
        scope,
        payload.grade || "",
        payload.klass || "",
        parentMode === "pk",
      )
    : null;
  const recipients = filterAudience(
    allowed
      ? selected.recipients.filter((recipient) => allowed.has(recipient.id))
      : selected.recipients,
    allowed ? { per: filter.per } : filter,
    people,
    progress,
  );
  const identity = {
    title,
    body,
    url,
    scope,
    grade: payload.grade || "",
    klass: payload.klass || "",
    role: admin ? payload.role || "" : "תלמיד",
    wait,
    filter,
    parentMode,
  };
  return enqueueNotification(
    payload.requestId,
    recipients,
    { title, body, url },
    !!filter.per,
    createHash("sha256").update(JSON.stringify(identity)).digest("hex"),
    payload.who || (admin ? "רכז" : "צוות"),
    undefined,
    [
      ["יעד", scope],
      ["שכבה", identity.grade],
      ["כיתה", identity.klass],
      ["תפקיד", identity.role],
      ["ממתינים", wait],
      ["קישור", url],
      ["פילוח", (payload.flt || "").slice(0, 40000)],
    ],
  );
}
