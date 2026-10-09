import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { notificationStates } from "../src/server/notification-state.ts";
test("notification state follows merged devices, expiration and renewed endpoints", () => {
  const expiredEndpoint = "https://example.invalid/expired";
  const expired = new Set([
    createHash("sha1").update(expiredEndpoint).digest("hex").slice(0, 12),
  ]);
  const events = [
    {
      מזהה: "OLD",
      מנוי: JSON.stringify({ endpoint: expiredEndpoint }),
      מכשיר: "Android",
    },
    { מזהה: "BLOCKED", תוצאה: "חסום", מכשיר: "iPhone", דפדפן: "Safari" },
    { מזהה: "UNKNOWN", מנוי: "not json" },
  ];
  let state = notificationStates(events, expired);
  assert.equal(state(["NONE"]).pstate, "none");
  assert.equal(state(["UNKNOWN"]).pstate, "?");
  assert.equal(state(["BLOCKED"]).pstate, "blocked");
  assert.equal(state(["CANONICAL", "OLD"]).pstate, "gone");
  events.push({
    מזהה: "OLD",
    מנוי: JSON.stringify({ endpoint: "https://example.invalid/renewed" }),
  });
  state = notificationStates(events, expired);
  assert.equal(state(["CANONICAL", "OLD"]).push, 1);
  assert.equal(state(["BLOCKED", "OLD"]).pstate, "on");
  assert.equal(state(["BLOCKED", "OLD"]).why, "");
  assert.equal(state(["BLOCKED", "OLD"]).dev, "iPhone");
});
