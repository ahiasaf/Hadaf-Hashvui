import test from "node:test";
import assert from "node:assert/strict";
import {
  inviteDraft,
  inviteMessage,
  inviteUrl,
  phoneReady,
  whatsappInvite,
  whatsappNumber,
  withInviteUrl,
} from "../src/lib/invite.ts";
import { currentPhase } from "../src/lib/timeline.ts";

const parent = {
  id: "abc123",
  inst: "lapid",
  instName: "לפיד",
  first: "משה",
  last: "כהן",
  phone: "050-1234567",
  role: "dad",
  way: "dad",
  grade: "ז",
  klass: "1",
  dadFirst: "ישראל",
  dadPhone: "0529998888",
};

test("WhatsApp numbers drop formatting and use the 972 prefix", () => {
  assert.equal(whatsappNumber("050-123 4567"), "972501234567");
  assert.equal(whatsappNumber("+972 52 999 8888"), "972529998888");
  assert.equal(phoneReady("05012345"), false);
  assert.equal(phoneReady("050 123 4567"), true);
});

test("personal invite link carries the yeshiva, the son and the sender", () => {
  const url = new URL(inviteUrl("https://example.test", parent));
  assert.equal(url.pathname, "/join");
  assert.equal(url.searchParams.get("inst"), "lapid");
  assert.equal(url.searchParams.get("rel"), "kid");
  assert.equal(url.searchParams.get("f"), "ישראל");
  assert.equal(url.searchParams.get("sf"), "משה");
  assert.equal(url.searchParams.get("sp"), "050-1234567");
  assert.deepEqual(inviteDraft(url.search), {
    first: "ישראל",
    last: "",
    phone: "0529998888",
    dadFirst: "משה",
    dadLast: "כהן",
    dadPhone: "050-1234567",
  });
  assert.equal(inviteDraft("?inst=lapid"), null);
});

test("the invite text keeps the link even after the parent edits it out", () => {
  const url = "https://example.test/join?inst=lapid";
  const text = inviteMessage("היי {them}, {me} מזמין:\n{url}", {
    me: "משה",
    them: "ישראל",
    url,
  });
  assert.equal(withInviteUrl(text, url), text);
  assert.equal(withInviteUrl("היי ישראל  \n", url), "היי ישראל\n\n" + url);
  assert.match(
    whatsappInvite("0529998888", "שלום"),
    /^https:\/\/wa\.me\/972529998888\?text=%D7/,
  );
});

test("the current program phase is the last one that already started", () => {
  const phases = [
    { t: "a", sub: "", from: "2026-06-01", to: "2026-09-13" },
    { t: "b", sub: "", from: "2026-09-14", to: "2026-10-03" },
    { t: "c", sub: "", from: "2026-10-04", to: "2027-06-05" },
  ];
  assert.equal(currentPhase(phases, new Date("2026-05-01T12:00:00Z")), 0);
  assert.equal(currentPhase(phases, new Date("2026-09-20T12:00:00Z")), 1);
  assert.equal(currentPhase(phases, new Date("2026-10-03T21:30:00Z")), 2);
});
