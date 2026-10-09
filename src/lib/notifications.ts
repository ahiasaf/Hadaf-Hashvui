import { stored, writeRow, type Person } from "./client";
const publicKey =
  "BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw";
export async function subscribe() {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  )
    throw new Error("Unsupported notifications");
  if ((await Notification.requestPermission()) !== "granted")
    throw new Error("Notifications denied");
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const bytes = Uint8Array.from(
    atob(
      publicKey.replaceAll("-", "+").replaceAll("_", "/") +
        "=".repeat((4 - (publicKey.length % 4)) % 4),
    ),
    (character) => character.charCodeAt(0),
  );
  return (
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes,
    }))
  );
}
export async function waitForLesson(lessonKey: string) {
  const subscription = await subscribe();
  const me = stored<Person | null>("me", null);
  const response = await fetch("/api/wait", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "row",
      tab: "ממתינים לדף",
      cols: JSON.stringify([
        ["דף", lessonKey],
        ["מזהה", me?.id || ""],
        ["שם", me?.first || ""],
        ["ישיבה", me?.inst || ""],
        ["מכשיר", "web"],
        ["מנוי", JSON.stringify(subscription)],
        ["מתי", new Date().toISOString()],
      ]),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok || (await response.json()).status !== "ok")
    throw new Error("Request was not acknowledged");
  try {
    localStorage.setItem("df:wait:" + lessonKey, "1");
  } catch {
    /* The server acknowledgement remains authoritative. */
  }
}
export async function enableReminders() {
  const me = stored<Person | null>("me", null);
  if (!me) throw new Error("Registration required");
  const subscription = await subscribe();
  await writeRow("התראות", [
    ["מזהה", me.id],
    ["שם", me.first],
    ["טלפון", me.phone],
    ["ישיבה", me.instName],
    ["קוד ישיבה", me.inst],
    ["תפקיד", me.role === "dad" ? "הורה" : "תלמיד"],
    ["מכשיר", "web"],
    ["מנוי", JSON.stringify(subscription)],
    ["תוצאה", "אושר"],
    ["מתי", new Date().toISOString()],
  ]);
  try {
    localStorage.setItem("df:noteOn", me.id);
  } catch {
    /* Storage is optional. */
  }
}
