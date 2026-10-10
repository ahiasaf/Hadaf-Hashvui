import test from "node:test";
import assert from "node:assert/strict";
import { nextStep, readDevice } from "../src/lib/install.ts";

const android =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36";
const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

test("Android with a captured prompt installs in one tap, then asks for reminders", () => {
  const device = readDevice(
    { userAgent: android },
    false,
    true,
    "default",
    false,
  );
  assert.equal(nextStep(device), "install-prompt");
  assert.equal(nextStep({ ...device, standalone: true }), "notify");
  assert.equal(
    nextStep({
      ...device,
      standalone: true,
      notifications: "granted",
      remindersOn: true,
    }),
    "done",
  );
});

test("iPhone Safari gets the two visual steps; other iOS browsers are sent to Safari", () => {
  const safari = readDevice(
    { userAgent: iphone, standalone: false },
    false,
    false,
    "default",
    false,
  );
  assert.equal(safari.iosSafari, true);
  assert.equal(nextStep(safari), "install-ios");
  const chrome = readDevice(
    { userAgent: iphone + " CriOS/128" },
    false,
    false,
    "default",
    false,
  );
  assert.equal(nextStep(chrome), "open-safari");
  const whatsapp = readDevice(
    { userAgent: iphone },
    false,
    false,
    "default",
    false,
  );
  assert.equal(whatsapp.inApp, true);
  assert.equal(nextStep(whatsapp), "open-browser");
});

test("desktop without a prompt skips straight to reminders, and denied permission ends the flow", () => {
  const desktop = readDevice(
    { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/128" },
    false,
    false,
    "default",
    false,
  );
  assert.equal(nextStep(desktop), "notify");
  assert.equal(nextStep({ ...desktop, notifications: "denied" }), "done");
  assert.equal(nextStep({ ...desktop, notifications: "unsupported" }), "done");
});
