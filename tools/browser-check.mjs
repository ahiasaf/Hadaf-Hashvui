import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { weekIndex } from "../src/lib/calendar.ts";
const server = spawn(process.execPath, ["tools/preview.mjs"], {
  env: { ...process.env, PORT: "4322" },
  stdio: "pipe",
});
const base = "http://127.0.0.1:4322";
let browser;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* Wait for the local server. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const lesson = await fs.readFile("tests/fixtures/lesson.csv", "utf8");
  const program = JSON.parse(
    await fs.readFile("src/generated/program.json", "utf8"),
  );
  const errors = [];
  const lessonData = (data) =>
    '"מסכת","דף","נתונים"\n"taanit","ב","' +
    JSON.stringify(data).replaceAll('"', '""') +
    '"';
  let readFailure = false,
    closed = false,
    writeFailure = false,
    waitFailure = false;
  async function prepare(context) {
    await context.addInitScript(() => {
      if (location.protocol !== "http:") return;
      if (!/^\/(app|learn|lesson-tools)(\.html)?$/.test(location.pathname)) {
        if (
          JSON.parse(localStorage.getItem("df:me") || "null")?.id ===
          "browser-student"
        )
          localStorage.removeItem("df:me");
        return;
      }
      localStorage.setItem("df:installed", "true");
      if (!localStorage.getItem("df:me"))
        localStorage.setItem(
          "df:me",
          JSON.stringify({
            id: "browser-student",
            first: "תלמיד",
            inst: "avir",
            role: "kid",
          }),
        );
    });
    context.on("page", (page) =>
      page.on("pageerror", (error) => errors.push(error.message)),
    );
    await context.route("https://**", (route) => route.abort());
    await context.route("**/api/sheets?**", (route) => {
      const tab = new URL(route.request().url()).searchParams.get("tab");
      if (readFailure && tab === "סימוני הדף")
        return route.fulfill({ status: 502, body: "Unavailable" });
      const body =
        tab === "סימוני הדף"
          ? lesson
          : tab === "מצגת"
            ? lessonData({ 1: 1 })
            : tab === "שאלות בדף"
              ? lessonData({
                  __pub: 1,
                  1: [{ q: "שאלת בדיקה", a: ["כן", "לא"], correct: 0 }],
                })
              : tab === "דפים פתוחים"
                ? '"מסכת","דף","נפתח"\n' +
                  (closed
                    ? ""
                    : '"taanit","ב.","2026-10-04"\n"taanit","ב:","2026-10-04"')
                : tab === "טקסטים"
                  ? '"מפתח","נוסח"'
                  : tab === "הגדרות"
                    ? '"מפתח","ערך"\n"waGroup","""https://chat.whatsapp.com/DEMO1234567890"""'
                    : tab === "מוסדות"
                      ? '"code","name","last","joined"\n"demo","ישיבת בדיקה","true","true"'
                      : '"מסכת","דף","נתונים"';
      return route.fulfill({ contentType: "text/csv;charset=utf-8", body });
    });
    await context.route("**/api/action", (route) => {
      const request = route.request().postDataJSON();
      if (writeFailure && request.operation === "write")
        return route.fulfill({ status: 502, json: { status: "error" } });
      const payload = request.payload;
      if (payload.idFor)
        return route.fulfill({
          json: { status: "ok", id: payload.idFor, learned: [] },
        });
      if (payload.whoIs)
        return route.fulfill({
          json: {
            status: "ok",
            me: {
              id: "restored-student",
              first: "תלמיד",
              last: "לדוגמה",
              inst: program.institutions[0].code,
              instName: program.institutions[0].name,
              role: "kid",
              way: "solo",
              grade: "ז",
              klass: "1",
            },
            learned: ["taanit|1"],
          },
        });
      if (payload.team)
        return route.fulfill({
          json: {
            status: "ok",
            rows: [
              ["ישיבה", "עדכון", "תגיות", "אנשי קשר"],
              [
                "ישיבת בדיקה",
                "עדכון לדוגמה",
                '["משתתפים"]',
                '[{"name":"איש קשר לדוגמה","phone":"0500000000"}]',
              ],
            ],
          },
        });
      if (payload.board)
        return route.fulfill({
          json: {
            status: "ok",
            students: [
              {
                id: "demo-student",
                first: "תלמיד",
                last: "לדוגמה",
                grade: "ז",
                // The board counts completions of the current program week.
                weeks: ["taanit|" + (weekIndex(program.startDate) + 1)],
                push: true,
              },
            ],
          },
        });
      if (payload.health)
        return route.fulfill({
          json: {
            status: "ok",
            backend: "neon",
            tabs: [{ name: "סימוני הדף", rows: 17 }],
            privTabs: [{ name: "הרשמות", rows: 3 }],
          },
        });
      if (payload.read === "הרשמות")
        return route.fulfill({
          json: {
            status: "ok",
            rows: [
              ["ישיבה", "קוד", "איש קשר", 'סה"כ גמרות'],
              ["ישיבת בדיקה", "TEST", "רכז קודם", "20"],
              ["ישיבה ללא הזמנה", "OTHER", "רכז", "0"],
              ["ישיבת בדיקה", "TEST", "רכז מעודכן", "30"],
              ["ישיבה א מחוץ לרשת", "other", "רכז א", "12"],
              ["ישיבה ב מחוץ לרשת", "other", "רכז ב", "15"],
              ["ישיבה לדוגמה", "demo", "רכז בדיקה", "99"],
            ],
          },
        });
      if (payload.read)
        return route.fulfill({
          json: {
            status: "ok",
            rows: [
              ["מפתח", "נוסח"],
              ["ui.siteTitle", "כותרת לדוגמה"],
            ],
          },
        });
      return route.fulfill({ json: { status: "ok", id: "demo-student" } });
    });
    await context.route("**/api/wait", (route) =>
      route.fulfill({
        status: waitFailure ? 502 : 200,
        json: { status: waitFailure ? "error" : "ok" },
      }),
    );
  }
  const viewportMotionContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  await prepare(viewportMotionContext);
  const viewportMotionPage = await viewportMotionContext.newPage();
  await viewportMotionPage.goto(base);
  await viewportMotionPage.waitForFunction(() =>
    document.documentElement.classList.contains("motion-observed"),
  );
  const beacon = viewportMotionPage.locator(".stage-dot");
  await beacon.scrollIntoViewIfNeeded();
  await viewportMotionPage.waitForFunction(() =>
    document
      .querySelector(".stage-dot")
      ?.getAnimations()
      .some((animation) => animation.playState === "running"),
  );
  await viewportMotionPage.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await beacon.waitFor({ state: "attached" });
  await viewportMotionPage.waitForFunction(() =>
    document.querySelector(".stage-dot")?.hasAttribute("data-motion-paused"),
  );
  const pausedTime = await beacon.evaluate(
    (node) => node.getAnimations()[0].currentTime,
  );
  await viewportMotionPage.waitForTimeout(100);
  assert.ok(
    Math.abs(
      (await beacon.evaluate((node) => node.getAnimations()[0].currentTime)) -
        pausedTime,
    ) < 20,
  );
  await beacon.scrollIntoViewIfNeeded();
  await viewportMotionPage.waitForFunction(
    () =>
      !document.querySelector(".stage-dot")?.hasAttribute("data-motion-paused"),
  );
  await viewportMotionPage.waitForTimeout(100);
  assert.ok(
    (await beacon.evaluate((node) => node.getAnimations()[0].currentTime)) >
      pausedTime + 30,
  );
  const activeFrame = viewportMotionPage.locator(
    '.lesson-variant[aria-hidden="false"] .frame',
  );
  await activeFrame.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await viewportMotionPage.waitForFunction(
    () =>
      !document
        .querySelector('.lesson-variant[aria-hidden="false"] .frame')
        ?.hasAttribute("data-motion-paused"),
  );
  assert.equal(
    await viewportMotionPage
      .locator('.lesson-variant[aria-hidden="true"] .frame')
      .getAttribute("data-motion-paused"),
    "",
  );
  await viewportMotionPage.locator('[data-track="megila"]').click();
  await viewportMotionPage
    .locator('.lesson-variant[aria-hidden="false"] .frame')
    .evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await viewportMotionPage.waitForFunction(
    () =>
      !document
        .querySelector('.lesson-variant[aria-hidden="false"] .frame')
        ?.hasAttribute("data-motion-paused"),
  );
  assert.equal(
    await viewportMotionPage
      .locator('.lesson-variant[aria-hidden="true"] .frame')
      .getAttribute("data-motion-paused"),
    "",
  );
  const counter = viewportMotionPage.locator("[data-count-to]").first();
  await counter.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await viewportMotionPage.waitForTimeout(100);
  await viewportMotionPage.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "instant" }),
  );
  await viewportMotionPage.waitForTimeout(50);
  const pausedCount = await counter.textContent();
  await viewportMotionPage.waitForTimeout(150);
  assert.equal(await counter.textContent(), pausedCount);
  await counter.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await viewportMotionPage.waitForFunction(() => {
    const node = document.querySelector("[data-count-to]");
    return node.textContent === node.dataset.countTo;
  });
  await viewportMotionPage.emulateMedia({ reducedMotion: "reduce" });
  await viewportMotionPage.waitForFunction(
    () => document.querySelector(".stage-dot")?.getAnimations().length === 0,
  );
  await viewportMotionPage.goto(base + "/management#reg");
  await viewportMotionPage.locator("#r-contact").waitFor();
  assert.equal(
    await viewportMotionPage
      .locator("#r-contact")
      .evaluate((node) => window.getComputedStyle(node).transitionDuration),
    "0s",
  );
  await viewportMotionContext.close();
  console.log(
    "Offscreen motion and counters pause and resume; hidden track panels and reduced-motion fields stay still.",
  );
  const delayedAdminContext = await browser.newContext();
  await prepare(delayedAdminContext);
  let releaseAdminScripts;
  const adminScriptsReady = new Promise((resolve) => {
    releaseAdminScripts = resolve;
  });
  await delayedAdminContext.route("**/_astro/*.js", async (route) => {
    await adminScriptsReady;
    await route.continue();
  });
  const delayedAdminPage = await delayedAdminContext.newPage();
  await delayedAdminPage.goto(base + "/admin", { waitUntil: "commit" });
  await delayedAdminPage
    .locator(".admin-login-form input")
    .waitFor({ state: "attached" });
  assert.equal(
    await delayedAdminPage.locator(".admin-login-form input").isDisabled(),
    true,
  );
  assert.equal(
    await delayedAdminPage.locator(".admin-login-form > button").isDisabled(),
    true,
  );
  releaseAdminScripts();
  await delayedAdminPage
    .getByLabel("סיסמת הקריאה", { exact: true })
    .fill("DEMO");
  await delayedAdminPage
    .getByRole("button", { name: "כניסה לניהול", exact: true })
    .click();
  await delayedAdminPage.getByText("Neon · מחובר", { exact: true }).waitFor();
  await delayedAdminContext.close();
  console.log("Admin controls stay inactive until their handlers are ready.");
  const routes = [
    "/",
    "/calendar",
    "/join",
    "/app",
    "/tzevet",
    "/board",
    "/admin",
    "/learn?mas=taanit&daf=ב&amud=1",
    "/info",
    "/accessibility",
    "/kishurim",
    "/shlach",
    "/hitraot",
    "/slidetest",
    "/team",
    "/management#reg",
    "/studio",
    "/lab",
    "/masa",
    "/tiul",
  ];
  for (const width of [320, 360, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(context);
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForTimeout(250);
      assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
      if (route.startsWith("/learn?") || route.startsWith("/lesson-tools?")) {
        assert.ok(
          (await page.locator("#t-daf").boundingBox()).height < 32,
          `Shared styles enlarge the lesson title at ${width}px`,
        );
        assert.ok(
          (await page.locator("body > header").boundingBox()).height <= 72,
          `Lesson toolbar crowds the reading area at ${width}px`,
        );
      }

      if (
        ["/app", "/join", "/tzevet", "/info", "/accessibility"].includes(route)
      ) {
        assert.equal(
          await page
            .locator(
              `.site-header a[href="${route}"], .site-footer a[href="${route}"]`,
            )
            .count(),
          0,
          `${route} repeats a link to the current page`,
        );
      }
      if (route === "/app") {
        assert.equal(await page.locator(".stage-band #lesson").count(), 1);
        assert.equal(await page.locator(".track-switch button").count(), 2);
        assert.equal(await page.locator(".track-tabs, .study-next").count(), 0);
        assert.ok(
          await page
            .locator("#lesson .lesson-text")
            .evaluateAll((nodes) =>
              nodes.every(
                (node) =>
                  window.getComputedStyle(node).overflowY === "visible" &&
                  node.scrollHeight <= node.clientHeight + 1,
              ),
            ),
          "The dashboard inherited a reader scrollbar",
        );
        assert.equal(await page.locator('a[href="/join"]').count(), 1);
        assert.equal(
          await page.getByText("פרטי ההרשמה שלי", { exact: true }).count(),
          1,
        );
      }

      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} overflows at ${width}px`,
      );
      if (route === "/tzevet" || route === "/management#reg") {
        const identity = await page.locator(".footer-identity").boundingBox();
        assert.ok(
          Math.abs(identity.x + identity.width / 2 - width / 2) < 2,
          `Footer identity is not centered at ${width}px`,
        );
      }
    }
    await page.goto(base);
    const community = page.locator("[data-community-tabs]");
    await community.scrollIntoViewIfNeeded();
    const whatsappTab = community.getByRole("tab", { name: "קבוצת הוואטסאפ" });
    const remindersTab = community.getByRole("tab", {
      name: "עדכונים ותזכורות",
    });
    await community.locator("[data-community][href]").waitFor();
    assert.equal(await whatsappTab.getAttribute("aria-selected"), "true");
    assert.equal(
      await page.locator(".site-footer [data-community]").count(),
      0,
    );
    assert.equal(
      await page.locator('.site-footer a[href="/hitraot"]').count(),
      0,
    );
    await whatsappTab.focus();
    await page.keyboard.press("ArrowLeft");
    assert.equal(await remindersTab.getAttribute("aria-selected"), "true");
    assert.equal(
      await community.locator("#community-whatsapp").isVisible(),
      false,
    );
    assert.equal(
      await community
        .getByRole("link", { name: /הגדרת התראות/ })
        .getAttribute("href"),
      "/hitraot",
    );
    await page.keyboard.press("Home");
    assert.equal(await whatsappTab.getAttribute("aria-selected"), "true");
    await remindersTab.click();
    await whatsappTab.click();
    assert.equal(
      await page.evaluate(async () => {
        document.getElementById("community-whatsapp-tab").focus();
        window.dispatchEvent(new window.Event("pageshow"));
        const track = document.querySelector(
          '.track-switch [aria-pressed="false"]',
        );
        track.focus();
        await new Promise((resolve) =>
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(resolve),
          ),
        );
        return document.activeElement === track;
      }),
      true,
      "Community settings refresh steals track selector focus",
    );
    assert.ok((await whatsappTab.boundingBox()).height >= 44);
    assert.ok(
      await community.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    );
    await page.locator("[data-institutions]").scrollIntoViewIfNeeded();
    await page
      .locator("[data-inst-status][hidden]")
      .waitFor({ state: "attached" });
    assert.equal(await page.locator("[data-inst-status]").textContent(), "");
    await page.locator(".phases").scrollIntoViewIfNeeded();
    assert.ok(
      await page.locator(".phases li i").evaluateAll((dots) =>
        dots.every((dot) => {
          const box = dot.getBoundingClientRect();
          return (
            document.elementFromPoint(
              box.x + box.width / 2,
              box.y + box.height / 2,
            ) === dot
          );
        }),
      ),
      `Timeline rail paints over the dots at ${width}px`,
    );
    assert.equal(await page.locator(".lesson-actions a").count(), 1);
    assert.equal(await page.locator(".track-switch a").count(), 0);
    assert.equal(await page.locator('a[href="/join"]').count(), 1);
    assert.equal(await page.locator('a[href="/tzevet"]').count(), 1);
    await page.locator('.track-switch [aria-pressed="false"]').focus();
    const beforeSwitch = await page.locator(".lesson .button").boundingBox();
    await page.keyboard.press("Space");
    await page.waitForTimeout(250);
    const afterSwitch = await page.locator(".lesson .button").boundingBox();
    assert.ok(
      Math.abs(beforeSwitch.y - afterSwitch.y) < 1,
      `Lesson action shifts when switching tracks at ${width}px`,
    );
    assert.equal(
      await page.locator('.track-switch [aria-pressed="true"]').textContent(),
      "מסכת מגילה",
    );
    assert.match(
      await page.locator("[data-open]").getAttribute("href"),
      /mas=megila/,
    );
    assert.ok(
      await page
        .locator(".brand-mark img")
        .evaluate((image) => image.naturalWidth > 0),
    );
    assert.ok(
      await page
        .locator(".button")
        .first()
        .evaluate((button) => button.getBoundingClientRect().height >= 44),
    );
    await context.close();
    console.log("Responsive Hebrew RTL:", width, "px passed.");
  }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(context);
  const page = await context.newPage();
  const progressTotal = program.tracks[0].cal.filter(
    (row) => row[2] && row[2] !== "סיום",
  ).length;
  for (const units of [0, 8, progressTotal]) {
    await page.goto(base + "/app");
    await page.evaluate(
      ({ units, cal }) => {
        const learned = {};
        let count = 0;
        cal.forEach((row, index) => {
          if (row[2] && (count++ < units || row[2] === "סיום"))
            learned["taanit|" + (index + 1)] = "2026-10-12";
        });
        localStorage.setItem("df:learned", JSON.stringify(learned));
        localStorage.setItem("df:track", "taanit");
      },
      { units, cal: program.tracks[0].cal },
    );
    await page.reload();
    await page
      .locator(".progress-count strong")
      .filter({ hasText: new RegExp("^" + units + "$") })
      .waitFor();
    assert.equal(
      await page.locator(".progress-overview progress").getAttribute("value"),
      String(units),
    );
    assert.equal(
      await page.locator(".progress-percent").textContent(),
      Math.round((units / progressTotal) * 100) + "%",
    );
    assert.ok(
      (await page.locator(".progress-overview progress").boundingBox())
        .height >= 12,
    );
  }
  await page.evaluate(() => localStorage.removeItem("df:learned"));
  await page.goto(base + "/join");
  // The dashboard remembers the selected track and offers the unfinished interactive lesson.
  await page.goto(base + "/app");
  await page.getByRole("button", { name: "מסכת מגילה", exact: true }).click();
  await page.reload();
  await page
    .locator('.track-switch button[aria-pressed="true"]')
    .filter({ hasText: "מגילה" })
    .waitFor();
  await page.evaluate(() => {
    localStorage.setItem(
      "df:spot",
      JSON.stringify({ mas: "megila", daf: "ב", am: 2, i: 1, n: 5 }),
    );
  });
  await page.reload();
  await page.getByRole("link", { name: "להמשך הלימוד", exact: true }).waitFor();
  assert.match(
    await page.locator("[data-continue]").getAttribute("href"),
    /^\/lesson-tools\?.*mas=megila.*amud=2/,
  );
  await page.evaluate(() => {
    localStorage.removeItem("df:installed");
    localStorage.removeItem("df:me");
  });
  await page.goto(base + "/join");
  // Signup is a step flow: big choices advance on tap, Enter continues, a reload resumes.
  await page.getByRole("button", { name: /^תלמיד/ }).click();
  await page.getByLabel("שם פרטי", { exact: true }).fill("תלמיד");
  await page.getByLabel("שם משפחה", { exact: true }).fill("לדוגמה");
  await page.getByLabel("שם משפחה", { exact: true }).press("Enter");
  await page.getByLabel("טלפון", { exact: true }).fill("0500000000");
  await page.reload();
  await page.getByText("שלב 3 מתוך 7", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("טלפון", { exact: true }).inputValue(),
    "0500000000",
  );
  await page.getByRole("button", { name: "המשך", exact: true }).click();
  await page
    .getByRole("button", { name: program.institutions[0].name, exact: true })
    .click();
  await page.getByRole("button", { name: "ז", exact: true }).click();
  await page.getByRole("button", { name: "המשך", exact: true }).click();
  await page.getByRole("button", { name: /^לבד/ }).click();
  await page.getByText("שלב 7 מתוך 7", { exact: true }).waitFor();
  writeFailure = true;
  await page.getByRole("button", { name: "שמירת ההרשמה", exact: true }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("df:me")), null);
  writeFailure = false;
  await page.getByRole("button", { name: "שמירת ההרשמה", exact: true }).click();
  await page.getByRole("heading", { name: "מכינים את הדף ללימוד" }).waitFor();
  assert.equal(
    JSON.parse(await page.evaluate(() => localStorage.getItem("df:me"))).id,
    "demo-student",
  );
  await page.clock.setFixedTime(
    new Date(program.startDate + "T12:00:00+03:00"),
  );
  await page.evaluate(() => localStorage.setItem("df:gate", "1"));
  readFailure = true;
  await page.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page.getByText("הדף הזה עוד לא הוכן ללימוד קטע-אחר-קטע").count(),
    0,
  );
  readFailure = false;
  await page.getByRole("button", { name: "ניסיון נוסף", exact: true }).click();
  await page
    .locator("#count")
    .filter({ hasText: /^קטע 1 מתוך/ })
    .waitFor();
  assert.equal(await page.locator("#back").getAttribute("href"), "/app");
  await page.locator("#ttl").press("Enter");
  await page.locator("#pick.on").waitFor();
  await page.locator(".pk-x").click();
  async function viewToggle(id) {
    await page.waitForFunction(
      (id) => document.getElementById(id).style.display !== "none",
      id,
    );
    if (
      (await page.locator("#viewmenu > summary").isVisible()) &&
      (await page.locator("#viewmenu").getAttribute("open")) === null
    )
      await page.locator("#viewmenu > summary").click();
    await page.locator("#" + id).click();
  }
  await viewToggle("dktog");
  assert.equal(
    await page.locator("#dktog").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator("#chtog").getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(await page.locator("#chav").isVisible(), false);
  await viewToggle("chtog");
  assert.equal(await page.locator("#side").isVisible(), false);
  assert.equal(
    await page.locator("#chtog").getAttribute("aria-pressed"),
    "true",
  );
  await viewToggle("dktog");
  await page.locator("#sd-x").click();
  assert.equal(await page.locator("#chav").isVisible(), true);
  await viewToggle("dktog");
  const beforeQuestion = await page.locator("#count").textContent();
  await page.locator("#qfab").click();
  await page.getByText("שאלת בדיקה", { exact: true }).waitFor();
  assert.equal(await page.locator("#count").textContent(), beforeQuestion);
  assert.equal(await page.locator("#side").isVisible(), false);
  await viewToggle("chtog");
  assert.equal(await page.getByText("שאלת בדיקה", { exact: true }).count(), 0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await viewToggle("dktog");
  assert.equal(
    await page.locator("#chtog").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator("#dktog").getAttribute("aria-pressed"),
    "true",
  );
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator("#chtog").getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(await page.locator("#chav").getAttribute("aria-hidden"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.getElementById("viewmenu").open);
  await viewToggle("dktog");
  const stage = await page.locator("#stage").boundingBox();
  const controls = await page.locator("body > nav").boundingBox();
  await page.locator("#next").click();
  await page
    .locator("#count")
    .filter({ hasText: /^קטע 2 מתוך/ })
    .waitFor();
  assert.ok(
    Math.abs(stage.y - (await page.locator("#stage").boundingBox()).y) < 1,
  );
  assert.ok(
    Math.abs(controls.y - (await page.locator("body > nav").boundingBox()).y) <
      1,
  );
  await page.reload();
  await page
    .locator("#count")
    .filter({ hasText: /^קטע 2 מתוך/ })
    .waitFor();
  await page.locator("#viewmenu > summary").press("Enter");
  const textSize = await page
    .locator("#chb")
    .evaluate((e) =>
      parseFloat(e.ownerDocument.defaultView.getComputedStyle(e).fontSize),
    );
  await page.locator("#czp").click();
  assert.ok(
    (await page
      .locator("#chb")
      .evaluate((e) =>
        parseFloat(e.ownerDocument.defaultView.getComputedStyle(e).fontSize),
      )) > textSize,
  );
  assert.notEqual(await page.locator("#viewmenu").getAttribute("open"), null);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#viewmenu").getAttribute("open"), null);
  assert.ok(
    await page
      .locator("#viewmenu > summary")
      .evaluate((e) => document.activeElement === e),
  );
  const countBeforeMenu = await page.locator("#count").textContent();
  await page.locator("#viewmenu > summary").press("Space");
  assert.equal(await page.locator("#count").textContent(), countBeforeMenu);
  await page.locator("#whole").click();
  assert.equal(await page.locator("#viewmenu").getAttribute("open"), null);
  assert.ok(
    await page
      .locator("body")
      .evaluate((element) => element.classList.contains("whole")),
  );
  await page.reload();
  await page
    .locator("#count")
    .filter({ hasText: /^קטע 2 מתוך/ })
    .waitFor();
  assert.equal(await page.locator("#whole").textContent(), "כל הדף");
  assert.equal(
    await page.locator("#whole").getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#viewmenu > summary").click();
  await page.locator("#whole").click();
  let count = 0;
  while (
    !(await page
      .locator("#done")
      .evaluate((element) => element.classList.contains("on")))
  ) {
    await page.locator("#next").click();
    if (++count > 150) throw new Error("Reader navigation did not terminate");
  }
  await page.getByRole("heading", { name: "ישר כוח!", exact: true }).waitFor();
  assert.ok(
    JSON.parse(await page.evaluate(() => localStorage.getItem("df:learned")))[
      "taanit|1"
    ],
  );
  assert.equal(await page.locator("#to-next").count(), 0);
  assert.equal(await page.locator("#to-home").count(), 0);
  assert.match(
    await page.locator("#to-quiz").getAttribute("href"),
    /^\/management(?:\?|#)/,
  );
  await page.locator("#done-x").click();
  assert.equal(await page.locator("#done").getAttribute("class"), "sheet");
  await page.clock.setFixedTime(new Date());
  await page.evaluate(
    (code) =>
      localStorage.setItem(
        "df:head",
        JSON.stringify({ id: "approved-test-device", inst: code }),
      ),
    program.institutions[0].code,
  );
  await page.goto(base + "/board?inst=" + program.institutions[0].code);
  await page.getByLabel("קוד ישיבה (אם קיבלתם)", { exact: true }).fill("DEMO");
  await page.getByRole("button", { name: "פתיחת הלוח", exact: true }).click();
  await page.getByText("תלמיד לדוגמה", { exact: true }).waitFor();
  assert.equal(
    await page
      .locator(".stats div")
      .filter({ hasText: "סיימו השבוע" })
      .locator("strong")
      .textContent(),
    "1",
  );
  await page.getByLabel("חיפוש תלמיד", { exact: true }).fill("לא נמצא");
  await page.getByText("לא נמצאו תלמידים בחיפוש הזה.").waitFor();
  await page.goto(base + "/admin");
  await page.getByLabel("סיסמת הקריאה", { exact: true }).fill("DEMO");
  await page.getByRole("button", { name: "כניסה לניהול", exact: true }).click();
  await page.getByText("Neon · מחובר", { exact: true }).waitFor();
  await page
    .locator(".admin-section-nav")
    .getByRole("button", { name: "ישיבות", exact: true })
    .click();
  await page
    .locator(".admin-school-record summary")
    .getByText("רכז מעודכן", { exact: true })
    .waitFor();
  assert.equal(await page.locator(".admin-school-record").count(), 4);
  await page
    .locator(".admin-section-nav")
    .getByRole("button", { name: "הזמנות", exact: true })
    .click();
  await page.getByText("30 גמרות", { exact: true }).waitFor();
  assert.equal(await page.locator(".admin-school-record").count(), 3);
  await page.getByRole("button", { name: "מלל", exact: true }).click();
  await page
    .getByRole("textbox", { name: "נוסח, שורה 1", exact: true })
    .fill("טיוטה לדוגמה");
  writeFailure = true;
  await page
    .getByRole("button", { name: "שמירת השינויים", exact: true })
    .click();
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: "נוסח, שורה 1", exact: true })
      .inputValue(),
    "טיוטה לדוגמה",
  );
  writeFailure = false;
  await page
    .getByRole("button", { name: "שמירת השינויים", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  await context.close();
  const toolsContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(toolsContext);
  const toolsPage = await toolsContext.newPage();
  await toolsPage.goto(base + "/team?k=DEMO");
  await toolsPage.getByRole("button", { name: "אחיאסף", exact: true }).click();
  await toolsPage.getByText("איש קשר לדוגמה", { exact: true }).waitFor();
  const initialCard = await toolsPage.locator(".team-card").boundingBox();
  writeFailure = true;
  await toolsPage
    .locator(".contact-actions a")
    .first()
    .evaluate((link) => {
      link.addEventListener("click", (event) => event.preventDefault());
      link.click();
    });
  await toolsPage
    .getByRole("button", { name: "רישום חוזר", exact: true })
    .waitFor();
  const failedCard = await toolsPage.locator(".team-card").boundingBox();
  assert.ok(
    Math.abs(initialCard.height - failedCard.height) < 1,
    "Team logging shifts its contact card",
  );
  writeFailure = false;
  await toolsPage
    .getByRole("button", { name: "רישום חוזר", exact: true })
    .click();
  await toolsPage
    .getByRole("button", { name: "רישום חוזר", exact: true })
    .waitFor({ state: "hidden" });
  assert.equal(
    await toolsPage.evaluate(() => localStorage.getItem("df:teamKey")),
    null,
  );
  await toolsPage.goto(base + "/shlach");
  assert.ok(
    await toolsPage.locator(".invitation > .button").first().isDisabled(),
  );
  await toolsPage.locator(".grade-grid button").first().click();
  assert.ok(
    await toolsPage.locator(".invitation > .button").first().isEnabled(),
  );
  await toolsPage.reload();
  assert.ok(
    await toolsPage.locator(".invitation > .button").first().isEnabled(),
  );
  await toolsContext.close();
  console.log(
    "Typed team log retry, stable card layout and invitation grade persistence passed.",
  );
  const restoreContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(restoreContext);
  const restored = await restoreContext.newPage();
  await restored.goto(base + "/join");
  await restored
    .getByRole("button", { name: "כבר נרשמתם? שחזור ההרשמה", exact: true })
    .click();
  await restored.getByLabel("שם פרטי", { exact: true }).fill("תלמיד");
  await restored.getByLabel("שם משפחה", { exact: true }).fill("לדוגמה");
  await restored.getByRole("button", { name: "המשך", exact: true }).click();
  await restored.getByLabel("טלפון", { exact: true }).fill("0500000000");
  await restored.getByRole("button", { name: "המשך", exact: true }).click();
  await restored
    .getByRole("button", { name: "שחזור ההרשמה", exact: true })
    .click();
  await restored
    .getByRole("heading", { name: "מכינים את הדף ללימוד" })
    .waitFor();
  assert.ok(
    JSON.parse(
      await restored.evaluate(() => localStorage.getItem("df:learned")),
    )["taanit|1"],
  );
  await restoreContext.close();
  const aliasContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(aliasContext);
  await aliasContext.addInitScript(() => {
    if (location.protocol === "http:") localStorage.setItem("df:gate", "1");
  });
  const alias = await aliasContext.newPage();
  const layouts = [];
  for (const route of ["/learn", "/lesson-tools"]) {
    await alias.goto(base + route + "?mas=taanit&daf=ב&amud=1");
    await alias
      .locator("#count")
      .filter({ hasText: /^קטע 1 מתוך/ })
      .waitFor();
    layouts.push(await alias.locator("#stage").boundingBox());
    assert.equal(
      await alias.evaluate(
        () =>
          window.performance
            .getEntriesByType("resource")
            .filter((resource) => resource.name.includes("pdf.min.mjs")).length,
      ),
      0,
    );
  }
  assert.deepEqual(layouts[0], layouts[1]);
  await alias.evaluate(async () => {
    await window.DF_LOAD_PDF();
  });
  assert.ok(await alias.evaluate(() => !!window.pdfjsLib?.getDocument));
  await aliasContext.close();
  console.log(
    "Learning aliases share a layout; PDF fallback loads only on demand.",
  );
  const resumeContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await prepare(resumeContext);
  await resumeContext.addInitScript(() => {
    if (location.protocol === "http:") localStorage.setItem("df:gate", "1");
  });
  const resumePage = await resumeContext.newPage();
  await resumePage.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await resumePage
    .locator("#count")
    .filter({ hasText: /^קטע 1 מתוך/ })
    .waitFor();
  await resumePage.locator("#next").click();
  await resumePage
    .locator("#count")
    .filter({ hasText: /^קטע 2 מתוך/ })
    .waitFor();
  await resumePage.reload();
  await resumePage
    .locator("#count")
    .filter({ hasText: /^קטע 2 מתוך/ })
    .waitFor();
  const resumeMeter = resumePage.locator("#resume .resume-timer");
  await resumeMeter.waitFor();
  assert.equal(await resumeMeter.getAttribute("aria-valuemax"), "6");
  await resumePage.evaluate(() => window.resumeHide());
  await resumePage.clock.install();
  await resumePage.evaluate(() =>
    window.resumeBar(
      'המשכנו מהמקום שעצרת · <button onclick="resumeTop()">מתחילת הדף</button>',
    ),
  );
  await resumePage.clock.runFor(1000);
  assert.equal(await resumeMeter.getAttribute("aria-valuenow"), "5");
  await resumePage.evaluate(() =>
    window.resumeBar("המשכנו מהמקום שעצרת", 4200),
  );
  await resumePage.clock.runFor(3500);
  assert.equal(
    await resumePage.locator("#resume").getAttribute("aria-hidden"),
    "false",
  );
  await resumePage.clock.runFor(700);
  assert.equal(
    await resumePage.locator("#resume").getAttribute("aria-hidden"),
    "true",
  );
  assert.equal(
    await resumePage.locator("#resume").evaluate((element) => element.inert),
    true,
  );
  await resumePage.evaluate(() => {
    window.resumeBar("המשכנו מהמקום שעצרת");
    window.resumeTop();
  });
  await resumePage.clock.runFor(6500);
  assert.equal(
    await resumePage.locator("#resume").getAttribute("class"),
    "resume",
  );
  await resumePage.clock.resume();
  await resumeContext.close();
  console.log("Resume countdown, replacement and dismissal cleanup passed.");
  const signedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(signedContext);
  await signedContext.addInitScript(() => {
    if (location.protocol === "http:")
      localStorage.setItem("df:me", JSON.stringify({ id: "signed-student" }));
  });
  const signed = await signedContext.newPage();
  await signed.goto(base + "/calendar");
  assert.equal(await signed.locator(".nav-join").isVisible(), false);
  await signed.goto(base);
  assert.equal(
    await signed.locator('.hero-actions a[href="/join"]').isVisible(),
    false,
  );
  assert.equal(
    await signed.locator("[data-guest-only].path").isVisible(),
    false,
  );
  await signed.locator("[data-community]").waitFor();
  assert.equal(
    await signed.locator("[data-community]").getAttribute("href"),
    "https://chat.whatsapp.com/DEMO1234567890",
  );
  await signed.evaluate(() => {
    localStorage.removeItem("df:me");
    window.dispatchEvent(new window.Event("df-account-change"));
  });
  assert.equal(
    await signed.locator('.hero-actions a[href="/join"]').isVisible(),
    true,
  );
  await signedContext.close();
  const updatesContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await prepare(updatesContext);
  await updatesContext.addInitScript(() => {
    if (location.protocol !== "http:") return;
    if (
      !localStorage.getItem("df:me") ||
      JSON.parse(localStorage.getItem("df:me")).id === "browser-student"
    )
      localStorage.setItem(
        "df:me",
        JSON.stringify({
          id: "demo-student",
          first: "בדיקה",
          last: "תלמיד",
          phone: "0500000000",
          inst: "DEMO",
          instName: "ישיבת בדיקה",
          role: "boy",
        }),
      );
    window.Notification = class {
      static permission = "granted";
      static requestPermission() {
        return Promise.resolve("granted");
      }
    };
    window.PushManager = function () {};
    const registration = {
      addEventListener() {},
      update: () => Promise.resolve(),
      pushManager: {
        getSubscription: () =>
          Promise.resolve({
            endpoint: "https://example.invalid/community-test",
            keys: { p256dh: "TEST", auth: "TEST" },
          }),
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: () => Promise.resolve(registration),
        ready: Promise.resolve(registration),
        addEventListener() {},
      },
    });
  });
  const updatesPage = await updatesContext.newPage();
  await updatesPage.goto(base + "/app");
  await updatesPage
    .locator("[data-community-tabs] [data-community][href]")
    .waitFor();
  assert.equal(
    await updatesPage
      .getByText("תזכורת קטנה בכל שבוע?", { exact: true })
      .count(),
    0,
  );
  await updatesPage.getByRole("tab", { name: "עדכונים ותזכורות" }).click();
  writeFailure = true;
  await updatesPage.getByRole("button", { name: "הפעלת התראות" }).click();
  await updatesPage.locator(".community .notice.error").waitFor();
  assert.equal(
    await updatesPage.evaluate(() => localStorage.getItem("df:noteOn")),
    null,
  );
  assert.equal(
    await updatesPage
      .getByRole("tab", { name: "עדכונים ותזכורות" })
      .isVisible(),
    true,
  );
  writeFailure = false;
  await updatesPage.getByRole("button", { name: "הפעלת התראות" }).click();
  await updatesPage
    .getByRole("tab", { name: "עדכונים ותזכורות" })
    .waitFor({ state: "hidden" });
  assert.equal(
    await updatesPage
      .getByText("התזכורות נרשמו ואושרו.", { exact: true })
      .count(),
    0,
  );
  await updatesPage.reload();
  await updatesPage.getByRole("button", { name: "כבר בקבוצה" }).waitFor();
  assert.equal(
    await updatesPage
      .getByRole("button", { name: "כבר בקבוצה" })
      .locator("svg")
      .count(),
    1,
  );
  assert.equal(
    await updatesPage.getByRole("button", { name: "כבר בקבוצה" }).innerText(),
    "",
  );
  assert.ok(
    (
      await updatesPage
        .getByRole("button", { name: "כבר בקבוצה" })
        .boundingBox()
    ).width >= 44,
  );
  assert.equal(
    await updatesPage
      .getByRole("tab", { name: "עדכונים ותזכורות" })
      .isVisible(),
    false,
  );
  await updatesPage.emulateMedia({ reducedMotion: "no-preference" });
  await updatesPage.getByRole("button", { name: "כבר בקבוצה" }).click();
  await updatesPage.waitForFunction(() => {
    const root = document.querySelector("[data-community-tabs]");
    return (
      root &&
      root.inert &&
      !root.hidden &&
      root
        .getAnimations()
        .some((animation) => animation.playState === "running")
    );
  });
  await updatesPage
    .locator("[data-community-tabs]")
    .waitFor({ state: "hidden" });
  await updatesPage.reload();
  await updatesPage.getByRole("heading", { name: "שלום, בדיקה" }).waitFor();
  assert.equal(await updatesPage.locator("[data-community-tabs]").count(), 0);
  await updatesPage.goto(base);
  await updatesPage
    .locator("[data-community-tabs][hidden]")
    .waitFor({ state: "attached" });
  await updatesPage.evaluate(() => {
    const person = JSON.parse(localStorage.getItem("df:me"));
    localStorage.setItem(
      "df:me",
      JSON.stringify({ ...person, id: "another-account" }),
    );
    window.dispatchEvent(new window.Event("df-account-change"));
  });
  await updatesPage.getByRole("tab", { name: "עדכונים ותזכורות" }).waitFor();
  assert.equal(
    await updatesPage.getByRole("tab", { name: "קבוצת הוואטסאפ" }).isVisible(),
    false,
  );
  writeFailure = true;
  await updatesPage.getByRole("button", { name: "הפעלת התראות" }).click();
  await updatesPage
    .locator("[data-community-notification-status]:not([hidden])")
    .waitFor();
  assert.equal(
    await updatesPage.evaluate(() => localStorage.getItem("df:noteOn")),
    "demo-student",
  );
  writeFailure = false;
  await updatesPage.getByRole("button", { name: "הפעלת התראות" }).click();
  await updatesPage
    .locator("[data-community-tabs][hidden]")
    .waitFor({ state: "attached" });
  await updatesContext.close();
  console.log(
    "Community enrollment retry, confirmed-only hiding, persistence and account scope passed.",
  );
  console.log(
    "Account-aware join prompts and published WhatsApp group link passed.",
  );

  const installedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await prepare(installedContext);
  await installedContext.addInitScript(() => {
    if (location.protocol !== "http:") return;
    localStorage.setItem("df:gate", "1");
    Object.defineProperty(navigator, "standalone", { value: true });
    window.__lessonViewportHeight = 640;
    Object.defineProperty(window.visualViewport, "height", {
      get: () => window.__lessonViewportHeight,
    });
  });
  await installedContext.route("**/api/sheets?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("tab") === "סימוני הדף")
      await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fallback();
  });
  const installed = await installedContext.newPage();
  await installed.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await installed.locator('#veil[aria-busy="true"] .load-page').waitFor();
  assert.equal(
    await installed.locator("#veil-t").textContent(),
    "פותחים את הדף",
  );
  await installed
    .locator("#count")
    .filter({ hasText: /^קטע 1 מתוך/ })
    .waitFor();
  await installed.evaluate(() => {
    document.querySelector("body > nav").style.paddingBottom = "42px";
    document.querySelector("body > header").style.paddingTop = "28px";
  });
  await installed.locator("#chd").click({ position: { x: 20, y: 8 } });
  await installed.locator("body.sheet-full").waitFor();
  for (const height of [640, 480]) {
    await installed.evaluate((height) => {
      window.__lessonViewportHeight = height;
      window.visualViewport.dispatchEvent(new window.Event("resize"));
    }, height);
    const nav = await installed.locator("body > nav").boundingBox();
    const next = await installed.locator("#next").boundingBox();
    const explanation = await installed.locator("#chav").boundingBox();
    assert.ok(
      nav.y + nav.height <= height + 1,
      "Installed lesson navigation falls below the visible viewport",
    );
    assert.ok(
      next.y + next.height <= height - 32,
      "Bottom safe area covers the next button",
    );
    assert.ok(
      explanation.y + explanation.height <= nav.y + 1,
      "Expanded explanation overlaps the bottom controls",
    );
  }
  await installedContext.close();
  console.log(
    "Compact loading screen and installed-app viewport with safe areas passed.",
  );
  const offlineContext = await browser.newContext();
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(base);
  await offlinePage.evaluate(() => navigator.serviceWorker.ready);
  await offlinePage.reload();
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage.locator('.track-switch [aria-pressed="false"]').click();
  assert.equal(
    await offlinePage
      .locator('.track-switch [aria-pressed="true"]')
      .textContent(),
    "מסכת מגילה",
  );
  await offlineContext.close();
  console.log("Restored progress and offline homepage module caching passed.");
  // Native permission and subscription are controlled; no real subscriptions or writes are made.
  const lockContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(lockContext);
  await lockContext.addInitScript(() => {
    Object.defineProperty(window, "Notification", {
      value: {
        permission: "granted",
        requestPermission: async () => "granted",
      },
    });
    Object.defineProperty(window, "PushManager", { value: function () {} });
    const subscription = {
      endpoint: "https://example.invalid/push",
      keys: { auth: "DEMO", p256dh: "DEMO" },
      unsubscribe: async () => true,
    };
    const registration = {
      update: async () => {},
      pushManager: {
        getSubscription: async () => subscription,
        subscribe: async () => subscription,
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        controller: null,
        addEventListener: () => {},
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    });
  });
  closed = true;
  waitFailure = true;
  const locked = await lockContext.newPage();
  await locked.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await locked.locator("#gate-go").click();
  await locked.locator("#lock-nt button.lockbtn").click();
  await locked.getByRole("alert").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    null,
  );
  waitFailure = false;
  await locked.locator("#lock-nt button.lockbtn").click();
  await locked.locator("#veil-s [role=status]").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    "1",
  );
  await lockContext.close();
  const motionContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  await prepare(motionContext);
  const motionPage = await motionContext.newPage();
  await motionPage.goto(base);
  await motionPage.locator("[data-community-tabs]").scrollIntoViewIfNeeded();
  await motionPage.locator("[data-community-tabs].is-in").waitFor();
  await motionPage.getByRole("tab", { name: "עדכונים ותזכורות" }).click();
  assert.equal(
    await motionPage
      .locator("#community-reminders > div")
      .evaluateAll((elements) =>
        elements.every((element) => element.getAnimations().length > 0),
      ),
    true,
  );
  await motionPage.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await motionPage
      .locator("#community-reminders > div")
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            element.ownerDocument.defaultView.getComputedStyle(element)
              .animationName === "none",
        ),
      ),
    true,
  );
  await motionContext.close();
  const unavailableContext = await browser.newContext();
  await prepare(unavailableContext);
  await unavailableContext.route("**/api/sheets?**", (route) => {
    if (new URL(route.request().url()).searchParams.get("tab") !== "הגדרות")
      return route.fallback();
    return route.fulfill({
      contentType: "text/csv",
      body: '"מפתח","ערך"\n"waGroup","""https://example.com/untrusted"""',
    });
  });
  const unavailablePage = await unavailableContext.newPage();
  await unavailablePage.goto(base);
  await unavailablePage
    .getByText("קישור הקבוצה אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.")
    .waitFor();
  assert.equal(
    await unavailablePage.locator("[data-community]").isVisible(),
    false,
  );
  await unavailablePage.getByRole("tab", { name: "עדכונים ותזכורות" }).click();
  assert.equal(
    await unavailablePage
      .getByRole("link", { name: /הגדרת התראות/ })
      .isVisible(),
    true,
  );
  await unavailableContext.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base);
  assert.ok(await staticPage.getByRole("heading", { level: 1 }).count());
  assert.ok(await staticPage.locator('a[href^="/lesson-tools?"]').count());
  assert.equal(
    await staticPage.locator("#community-reminders a").isVisible(),
    true,
  );
  await noJs.close();
  const legacyContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await prepare(legacyContext);
  const legacyPage = await legacyContext.newPage();
  await legacyPage.goto(base + "/management?st=1#quiz=taanit-1");
  await legacyPage.locator("#splash.off").waitFor({ state: "attached" });
  await legacyPage.evaluate(() => {
    window.QUIZ["taanit-1"] = [
      { q: "חידת בדיקה", a: ["נכון", "ניסיון נוסף"], correct: 0 },
    ];
    window.openWeek("taanit", 0);
    window.openQuiz(0);
  });
  const questionBox = await legacyPage.locator(".qq").boundingBox();
  const answerBox = await legacyPage.locator("#opt0").boundingBox();
  assert.ok(
    answerBox.y - questionBox.y - questionBox.height >= 15,
    "Question card touches the first answer",
  );
  await legacyPage.locator("#opt1").click();
  await legacyPage.locator("#q-step-b.on").waitFor();
  await legacyPage.locator("#q-send").click();
  await legacyPage.locator("#q-err:not([hidden])").waitFor();
  await legacyPage.locator("#q-name").fill("תלמיד בדיקה");
  await legacyPage.locator("#q-phone").fill("0500000000");
  await legacyPage.locator("#q-who .pk").click();
  await legacyPage.locator("#sheet-l .it").first().click();
  assert.equal(await legacyPage.locator("#q-name").inputValue(), "תלמיד בדיקה");
  assert.equal(await legacyPage.locator("#q-phone").inputValue(), "0500000000");
  assert.equal(await legacyPage.evaluate(() => window.state.ans), 1);
  await legacyPage.locator("#q-send").click();
  await legacyPage.locator("#q-step-a.on .opt.wrong").waitFor();
  await legacyPage.locator("#opt0").click();
  await legacyPage.locator("#q-step-b.on").waitFor();
  await legacyPage.locator("#q-send").click();
  await legacyPage.locator(".q-done").waitFor();
  assert.equal(
    await legacyPage
      .locator(".q-seal path")
      .evaluate(
        (el) =>
          el.ownerDocument.defaultView.getComputedStyle(el).strokeDashoffset,
      ),
    "0px",
  );
  await legacyPage.reload();
  await legacyPage.locator("#splash.off").waitFor({ state: "attached" });
  await legacyPage.evaluate(() => {
    window.QUIZ["taanit-1"] = [
      { q: "חידת בדיקה", a: ["נכון", "ניסיון נוסף"], correct: 0 },
    ];
    window.openWeek("taanit", 0);
    window.openQuiz(0);
  });
  assert.equal(await legacyPage.locator("#qflow.locked").count(), 1);
  assert.equal(await legacyPage.locator("#opt0.right").count(), 1);
  console.log(
    "Quiz steps, inline validation, retained identity, retry and solved persistence passed.",
  );
  await legacyPage.goto(base + "/management#reg");
  await legacyPage.locator("#v-reg.on #reg-body button").first().waitFor();
  assert.equal(await legacyPage.locator("footer").count(), 1);
  assert.equal(
    await legacyPage.locator('footer a[href="/management#reg"]').count(),
    0,
  );
  assert.equal(
    await legacyPage.locator('footer a[href="/info#privacy"]').count(),
    1,
  );
  assert.equal(await legacyPage.locator("#v-home.on").count(), 0);
  assert.equal(
    new URL(await legacyPage.evaluate(() => window.joinUrl("halihot")))
      .pathname,
    "/join.html",
  );
  await legacyPage.locator("#r-step-1 .rnav button").click();
  await legacyPage.locator("#r-err1:not([hidden])").waitFor();
  assert.equal(await legacyPage.locator("#r-step-1.on").count(), 1);
  await legacyPage.evaluate(() => {
    window.reg.inst = "other";
    window.reg.instOther = "   ";
    window.renderReg();
  });
  await legacyPage.locator("#r-step-1 .rnav button").click();
  assert.equal(await legacyPage.locator("#r-step-1.on").count(), 1);
  assert.equal(await legacyPage.locator("#r-err1").isVisible(), true);
  await legacyPage.evaluate(() => {
    window.reg.inst = "";
    window.renderReg();
  });
  await legacyPage.locator("#r-step-1 .pk").click();
  await legacyPage.locator("#sheet-l .it").first().click();
  await legacyPage.locator("#r-step-1 .rnav button").click();
  await legacyPage.locator("#r-step-2.on").waitFor();
  assert.equal(
    await legacyPage
      .locator('[data-reg-stage="2"]')
      .getAttribute("aria-current"),
    "step",
  );
  await legacyPage.locator("#r-step-2 .mascard").first().click();
  assert.equal(
    await legacyPage
      .locator("#r-step-2 .mascard")
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await legacyPage
      .locator("#r-step-2 .mascard")
      .first()
      .evaluate((el) => document.activeElement === el),
    true,
  );
  assert.equal(await legacyPage.locator("#r-step-2.on .mascard.on").count(), 1);
  await legacyPage.locator("#r-step-2 .rnav .gd").click();
  await legacyPage.locator("#r-step-3.on").waitFor();
  await legacyPage.locator("#r-wantsw").click();
  assert.equal(
    await legacyPage.locator("#r-wantsw").getAttribute("aria-checked"),
    "true",
  );
  assert.equal(
    await legacyPage.locator("#r-fold").evaluate((el) => el.inert),
    false,
  );
  for (const width of [320, 390, 1440]) {
    await legacyPage.setViewportSize({ width, height: 844 });
    const row = await legacyPage
      .locator(".order-track .num")
      .first()
      .boundingBox();
    const controls = await legacyPage
      .locator(".order-track .ctl")
      .first()
      .boundingBox();
    assert.ok(
      controls.x >= row.x &&
        controls.x + controls.width <= row.x + row.width + 1,
    );
    assert.ok(
      (
        await legacyPage
          .locator(".order-track .ctl button")
          .first()
          .boundingBox()
      ).width >= 44,
    );
  }
  await legacyPage.setViewportSize({ width: 390, height: 844 });
  await legacyPage.locator(".registration-catalog > summary").click();
  await legacyPage.locator(".order-preview summary").first().click();
  assert.equal(await legacyPage.locator(".order-preview[open]").count(), 1);
  await legacyPage.locator(".order-preview summary").first().click();
  await legacyPage.locator("#r-send").click();
  await legacyPage.locator("#r-err3:not([hidden])").waitFor();
  await legacyPage.locator(".order-preview summary").first().click();
  await legacyPage.evaluate(() => {
    window.__quantityInput = document.querySelector("#r-fold input");
  });
  await legacyPage.locator("#r-fold .ctl button").nth(1).click();
  assert.equal(
    await legacyPage.evaluate(
      () => window.__quantityInput === document.querySelector("#r-fold input"),
    ),
    true,
  );
  assert.equal(await legacyPage.locator(".order-preview[open]").count(), 1);
  assert.match(await legacyPage.locator("#r-total").innerText(), /5 גמרות/);
  assert.equal(await legacyPage.locator("#r-step-3.on").count(), 1);
  assert.equal(
    await legacyPage.locator("#r-fold input").first().inputValue(),
    "5",
  );
  await legacyPage.locator("#r-step-3 .rnav .g").click();
  assert.equal(await legacyPage.locator("#r-step-2.on .mascard.on").count(), 1);
  await legacyPage.locator("#r-step-2 .rnav .gd").click();
  assert.equal(
    await legacyPage.locator("#r-fold input").first().inputValue(),
    "5",
  );
  await legacyPage.locator("#r-wantsw").click();
  assert.equal(
    await legacyPage.locator("#r-fold").evaluate((el) => el.inert),
    true,
  );
  console.log(
    "School steps, required school, retained track and quantity, and order validation passed.",
  );
  const registrationPosts = [];
  let registerFailure = true;
  await legacyPage.route("**/api/action", async (route) => {
    const envelope = route.request().postDataJSON();
    const body =
      envelope.operation === "legacy" && envelope.payload.method === "POST"
        ? JSON.parse(envelope.payload.body)
        : null;
    if (body?.action !== "register") return route.fallback();
    registrationPosts.push(body);
    await route.fulfill({
      json: registerFailure ? { status: "error" } : { status: "ok" },
    });
  });
  await legacyPage.evaluate(() => {
    const input = document.querySelector("#r-fold input");
    window.reg.qty = {};
    window.qtySet(input.id.slice(2), 0);
  });
  await legacyPage.locator("#r-wantsw").click();
  await legacyPage.locator("#r-fold input").first().fill("5");
  await legacyPage.locator("#r-send").click();
  await legacyPage
    .getByRole("button", { name: "ניסיון שליחה נוסף", exact: true })
    .waitFor();
  assert.equal(await legacyPage.locator("#r-send.sent").count(), 0);
  assert.equal(
    await legacyPage.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dfQueue")).filter(
          (item) => item.action === "register",
        ).length,
    ),
    1,
  );
  registerFailure = false;
  await legacyPage.evaluate(() => {
    window.sendReg();
    window.sendReg();
  });
  await legacyPage.locator("#r-send.sent").waitFor();
  assert.equal(registrationPosts.length, 2);
  assert.equal(registrationPosts[0].total, 5);
  assert.equal(registrationPosts[0].requestId, registrationPosts[1].requestId);
  assert.equal(
    await legacyPage.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dfQueue")).filter(
          (item) => item.action === "register",
        ).length,
    ),
    0,
  );
  await legacyPage.locator("#r-fold input").first().fill("7");
  assert.equal(await legacyPage.locator("#r-send").isEnabled(), true);
  await legacyPage.locator("#r-fold .ctl button").nth(1).click();
  assert.equal(await legacyPage.locator("#r-send").isEnabled(), true);
  assert.equal(await legacyPage.locator("#r-send.sent").count(), 0);
  assert.equal(
    await legacyPage
      .locator("#v-reg > .registration-home")
      .getAttribute("href"),
    "/",
  );
  console.log(
    "Registration waits for acknowledgement, retains failed requests, deduplicates retries and permits order updates.",
  );
  await legacyPage.reload();
  await legacyPage.locator("#v-reg.on #reg-body button").first().waitFor();
  await legacyPage.goto(base + "/#admin");
  await legacyPage.waitForURL("**/admin");
  await legacyPage.getByLabel("סיסמת הקריאה", { exact: true }).waitFor();
  assert.equal(
    await legacyPage
      .getByText("הסיסמה נבדקת בשרת ואינה נשמרת במכשיר.", { exact: true })
      .count(),
    0,
  );
  await legacyPage.goto(base + "/management?legacy=1#admin");
  await legacyPage.locator("#pad button").first().waitFor();
  const pin = await legacyPage.evaluate(() => window.ADMIN_PIN);
  for (const digit of pin)
    await legacyPage
      .locator("#pad button")
      .filter({ hasText: new RegExp("^" + digit + "$") })
      .click();
  await legacyPage.locator("#v-admin.on").waitFor();
  await legacyContext.close();
  console.log(
    "Admin bookmark opens the new workspace; additional PIN tools remain available.",
  );
  closed = false;
  readFailure = false;
  writeFailure = false;
  const setupContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(setupContext);
  await setupContext.addInitScript(() => {
    if (location.protocol !== "http:") return;
    localStorage.setItem(
      "df:me",
      JSON.stringify({
        id: "setup-student",
        first: "תלמיד",
        role: "kid",
        inst: "avir",
      }),
    );
    localStorage.setItem("df:chav", "0");
    localStorage.setItem("df:chavTab", "own");
    localStorage.setItem("df:gate", "1");
  });
  const setupPage = await setupContext.newPage();
  const setupTarget = "/learn?mas=taanit&daf=ב&amud=1";
  await setupPage.goto(base + "/start?next=" + encodeURIComponent(setupTarget));
  await setupPage
    .getByRole("heading", { name: "מכינים את הדף ללימוד" })
    .waitFor();
  await setupPage.evaluate(() => {
    window.__installPrompt = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    };
    window.dispatchEvent(new window.Event("df-install-ready"));
  });
  await setupPage
    .getByRole("button", { name: "התקנה במסך הבית", exact: true })
    .click();
  await setupPage.getByText("בתפריט הדפדפן בוחרים", { exact: false }).waitFor();
  assert.equal(
    await setupPage.evaluate(() => localStorage.getItem("df:installed")),
    null,
  );
  await setupPage.evaluate(() => {
    window.__installPrompt = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted" }),
    };
    window.dispatchEvent(new window.Event("df-install-ready"));
  });
  await setupPage
    .getByRole("button", { name: "התקנה במסך הבית", exact: true })
    .click();
  await setupPage
    .getByRole("status")
    .filter({ hasText: "מסיימים את ההתקנה" })
    .waitFor();
  assert.ok(new URL(setupPage.url()).pathname === "/start");
  assert.equal(
    await setupPage.evaluate(() => localStorage.getItem("df:installed")),
    null,
  );
  await setupPage.evaluate(() =>
    window.dispatchEvent(new window.Event("appinstalled")),
  );
  await setupPage.waitForURL("**/learn?**");
  await setupPage.locator("body.chav-on").waitFor();
  assert.equal(await setupPage.evaluate(() => window.CHAV_TAB), "chav");
  await setupPage.locator("#chclose").click();
  assert.equal(
    await setupPage
      .locator("body")
      .evaluate((body) => body.classList.contains("chav-on")),
    false,
  );
  await setupPage.reload();
  await setupPage.locator("body.chav-on").waitFor();
  assert.equal(await setupPage.evaluate(() => window.CHAV_TAB), "chav");
  await setupContext.close();
  console.log(
    "Installation dismissal/retry, confirmed continuation and default explanation passed.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Signup acknowledgements, lesson parsing/resume/completion, private roster, admin retry, locked notifications and no-JS fallback passed.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
