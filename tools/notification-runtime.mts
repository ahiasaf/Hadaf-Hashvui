import webpush from "web-push";
import { createHash } from "node:crypto";
import { pushPublicKey, pushSubject } from "../src/config/push.ts";
import { deliver, type Subscription } from "./push-delivery.mts";
export type Payload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};
export function boolean(value: string | undefined) {
  return /^(1|true|yes)$/i.test(value || "");
}
export function runtime() {
  const dry = boolean(process.env.DRY_RUN),
    key = process.env.READ_KEY || "",
    privateKey = process.env.VAPID_PRIVATE || "";
  if (!key) throw new Error("READ_KEY is required");
  if (!dry && !privateKey)
    throw new Error("VAPID_PRIVATE is required for live delivery");
  if (!dry) webpush.setVapidDetails(pushSubject, pushPublicKey, privateKey);
  return {
    dry,
    key,
    send: async (sub: Subscription, payload: Payload, ttl = 3600) => {
      if (dry) throw new Error("Dry runs must not deliver notifications");
      const result = await deliver(webpush, sub, JSON.stringify(payload), {
        TTL: ttl,
      });
      if (!result.ok)
        throw Object.assign(new Error("Notification delivery failed"), {
          statusCode: result.code,
          gone: !!result.gone,
          uncertain: !!result.uncertain,
        });
      return { statusCode: result.code };
    },
  };
}
export function failureSignature(keys: string[]) {
  return keys.length
    ? createHash("sha1")
        .update([...keys].sort().join("\n"))
        .digest("hex")
        .slice(0, 12)
    : "אין";
}
export function summarize(results: number[]) {
  const count = (value: number) =>
    results.filter((result) => result === value).length;
  return {
    sent: count(1),
    failed: count(2),
    goneNew: count(4),
    gone: count(3) + count(4),
    waiting: count(0),
    readFailures: count(5),
  };
}
export function printSummary(
  kind: string,
  counts: ReturnType<typeof summarize>,
  dry: boolean,
) {
  const { sent, ...rest } = counts;
  console.log(
    JSON.stringify(
      dry
        ? { job: kind, dry, eligible: sent, ...rest }
        : { job: kind, dry, ...counts },
    ),
  );
}
export function failJob() {
  console.error("Notification job failed; no private source values are logged");
  process.exitCode = 1;
}
