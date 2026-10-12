import { sheet, stored, store, type Person } from "./client";

export async function communityGroup(): Promise<string | null> {
  const rows = await sheet("הגדרות");
  const row = rows.find((row) => row[0] === "waGroup");
  if (!row) return null;
  try {
    const value: unknown = JSON.parse(row[1]);
    if (typeof value !== "string") return null;
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.host === "chat.whatsapp.com" &&
      /^\/[A-Za-z0-9]{6,}$/.test(url.pathname)
      ? url.origin + url.pathname
      : null;
  } catch {
    return null;
  }
}
export function groupJoined(group: string | null = null) {
  const joined = stored<string>("communityGroup", "");
  return !!joined && (!group || joined === group);
}
export function confirmGroup(group: string) {
  store("communityGroup", group);
  window.dispatchEvent(new Event("df-community-change"));
}
export function remindersEnabled() {
  const person = stored<Person | null>("me", null);
  try {
    return (
      !!person?.id &&
      localStorage.getItem("df:noteOn") === person.id &&
      "Notification" in window &&
      Notification.permission === "granted"
    );
  } catch {
    return false;
  }
}
