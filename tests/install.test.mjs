import test from "node:test";
import assert from "node:assert/strict";
import { nextStep, readDevice, setupNext } from "../src/lib/install.ts";

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

test("iPhone browsers get visual installation steps; embedded browsers need an external browser", () => {
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
  assert.equal(nextStep(chrome), "install-ios");
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

test("desktop installation stays a setup step even before its prompt is available", () => {
  const desktop = readDevice(
    { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/128" },
    false,
    false,
    "default",
    false,
  );
  assert.equal(nextStep(desktop), "install-browser");
  assert.equal(
    nextStep({ ...desktop, standalone: true, notifications: "denied" }),
    "done",
  );
  assert.equal(
    nextStep({ ...desktop, standalone: true, notifications: "unsupported" }),
    "done",
  );
});

test("setup return paths preserve lessons and reject external or looping targets", () => {
  assert.equal(
    setupNext("/lesson-tools?mas=taanit&daf=ב&amud=2"),
    "/lesson-tools?mas=taanit&daf=%D7%91&amud=2",
  );
  for (const path of [
    "https://other.invalid/learn",
    "//other.invalid/app",
    "/start",
    "/join",
    "/admin",
    "/\\other.invalid/app",
    null,
  ])
    assert.equal(setupNext(path), "/app");
});
test("unsupported desktop browsers have an explicit browser-only path", () => {
  assert.equal(
    nextStep(
      readDevice(
        { userAgent: "Mozilla/5.0 Firefox/140" },
        false,
        false,
        "unsupported",
        false,
      ),
    ),
    "browser-only",
  );
});
