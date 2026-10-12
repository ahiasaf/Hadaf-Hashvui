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
                      ? '"code","name","last","joined"\n"demo","ישיבה לדוגמה","true","true"'
                      : '"מסכת","דף","נתונים"';
      return route.fulfill({ contentType: "text/csv;charset=utf-8", body });
    });
    await context.route("**/api/action", (route) => {
      const request = route.request().postDataJSON();
      if (writeFailure && request.operation === "write")
        return route.fulfill({ status: 502, json: { status: "error" } });
      const payload = request.payload;
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
                "ישיבה לדוגמה",
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
        assert.equal(await page.locator('a[href="/join"]').count(), 1);
        assert.equal(
          await page.getByText("פרטי ההרשמה שלי", { exact: true }).count(),
          0,
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
  await page.getByRole("button", { name: "מגילה", exact: true }).click();
  await page.reload();
  await page
    .locator('.track-tabs button[aria-pressed="true"]')
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
  await page.getByRole("heading", { name: "שלום, תלמיד" }).waitFor();
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
  assert.match(
    await page.locator("#to-next").getAttribute("href"),
    /^\/lesson-tools\?/,
  );
  assert.equal(await page.locator("#to-home").getAttribute("href"), "/app");
  await page.clock.setFixedTime(new Date());
  await page.goto(base + "/board?inst=" + program.institutions[0].code);
  await page.getByLabel("קוד גישה", { exact: true }).fill("DEMO");
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
  await restored.getByRole("heading", { name: "שלום, תלמיד" }).waitFor();
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
      value: { requestPermission: async () => "granted" },
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
  await locked.locator("#lock-ask").click();
  await locked.getByRole("alert").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    null,
  );
  waitFailure = false;
  await locked.locator("#lock-ask").click();
  await locked.locator("#veil-s [role=status]").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    "1",
  );
  await lockContext.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base);
  assert.ok(await staticPage.getByRole("heading", { level: 1 }).count());
  assert.ok(await staticPage.locator('a[href^="/lesson-tools?"]').count());
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
  await legacyPage.locator("#r-step-1 .rnav button").click();
  await legacyPage.locator("#r-err1:not([hidden])").waitFor();
  assert.equal(await legacyPage.locator("#r-step-1.on").count(), 1);
  await legacyPage.locator("#r-step-1 .pk").click();
  await legacyPage.locator("#sheet-l .it").first().click();
  await legacyPage.locator("#r-step-1 .rnav button").click();
  await legacyPage.locator("#r-step-2.on").waitFor();
  await legacyPage.locator("#r-step-2 .mascard").first().click();
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
  await legacyPage.locator(".order-preview summary").first().click();
  assert.equal(await legacyPage.locator(".order-preview[open]").count(), 1);
  await legacyPage.locator(".order-preview summary").first().click();
  await legacyPage.locator("#r-send").click();
  await legacyPage.locator("#r-err3:not([hidden])").waitFor();
  await legacyPage.locator("#r-fold .ctl button").nth(1).click();
  assert.equal(await legacyPage.locator("#r-step-3.on").count(), 1);
  assert.equal(
    await legacyPage.locator("#r-fold input").first().inputValue(),
    "5",
  );
  await legacyPage.locator("#r-step-3 .rnav button").click();
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
  await legacyPage.reload();
  await legacyPage.locator("#v-reg.on #reg-body button").first().waitFor();
  await legacyPage.goto(base + "/#admin");
  await legacyPage.waitForURL("**/management#admin");
  await legacyPage.locator("#pad button").first().waitFor();
  const pin = await legacyPage.evaluate(() => window.ADMIN_PIN);
  for (const digit of pin)
    await legacyPage
      .locator("#pad button")
      .filter({ hasText: new RegExp("^" + digit + "$") })
      .click();
  await legacyPage.locator("#v-admin.on").waitFor();
  await legacyContext.close();
  console.log("Original admin bookmark and local PIN flow passed.");
  assert.deepEqual(errors, []);
  console.log(
    "Signup acknowledgements, lesson parsing/resume/completion, private roster, admin retry, locked notifications and no-JS fallback passed.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
