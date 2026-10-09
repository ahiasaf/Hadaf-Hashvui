import { createHash } from "node:crypto";
export type NotificationState = {
  push: 0 | 1;
  pstate: "on" | "gone" | "blocked" | "?" | "none";
  why: string;
  dev: string;
  br: string;
};
type Device = {
  seen: boolean;
  blocked: boolean;
  endpoint: string;
  why: string;
  dev: string;
  br: string;
};
export function notificationStates(
  events: Record<string, string>[],
  expired: Set<string>,
) {
  const devices = new Map<string, Device>();
  for (const row of events) {
    const id = (row["מזהה"] || "").trim();
    if (!id) continue;
    const device = devices.get(id) || {
      seen: false,
      blocked: false,
      endpoint: "",
      why: "",
      dev: "",
      br: "",
    };
    device.seen = true;
    if (row["מכשיר"]?.trim()) device.dev = row["מכשיר"].trim();
    if (row["דפדפן"]?.trim()) device.br = row["דפדפן"].trim();
    if (row["מנוי"]?.trim()) {
      try {
        const subscription: unknown = JSON.parse(row["מנוי"]);
        if (
          subscription &&
          typeof subscription === "object" &&
          "endpoint" in subscription &&
          typeof subscription.endpoint === "string" &&
          subscription.endpoint.startsWith("https://")
        )
          device.endpoint = subscription.endpoint;
      } catch {
        /* A malformed historical subscription is not active. */
      }
    } else if (row["תוצאה"]?.trim()) {
      device.why = row["תוצאה"].trim();
      device.blocked ||= /חסום|נדחה|לא הצליח/.test(device.why);
    }
    devices.set(id, device);
  }
  return (ids: string[]): NotificationState => {
    const matching = ids.flatMap((id) =>
      devices.has(id) ? [devices.get(id)!] : [],
    );
    const gone = (device: Device) =>
      !!device.endpoint &&
      expired.has(
        createHash("sha1").update(device.endpoint).digest("hex").slice(0, 12),
      );
    const push = matching.some((device) => device.endpoint && !gone(device))
      ? 1
      : 0;
    const first = (field: "why" | "dev" | "br") =>
      matching.find((device) => device[field])?.[field] || "";
    return {
      push,
      pstate: push
        ? "on"
        : matching.some(gone)
          ? "gone"
          : matching.some((device) => device.blocked)
            ? "blocked"
            : matching.length
              ? "?"
              : "none",
      why: push ? "" : first("why"),
      dev: first("dev"),
      br: first("br"),
    };
  };
}
