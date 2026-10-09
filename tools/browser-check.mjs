import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
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
          : tab === "דפים פתוחים"
            ? '"מסכת","דף","נפתח"\n' +
              (closed
                ? ""
                : '"taanit","ב.","2026-10-04"\n"taanit","ב:","2026-10-04"')
            : tab === "טקסטים"
              ? '"מפתח","נוסח"'
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
                weeks: ["taanit|1"],
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
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} overflows at ${width}px`,
      );
    }
    await page.goto(base);
    const beforeSwitch = await page.locator(".lesson .button").boundingBox();
    await page.locator('[aria-pressed="false"]').first().click();
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
  await page.goto(base + "/join");
  await page.getByLabel("שם פרטי", { exact: true }).first().fill("תלמיד");
  await page.getByLabel("שם משפחה", { exact: true }).first().fill("לדוגמה");
  await page.getByLabel("טלפון", { exact: true }).fill("0500000000");
  await page
    .getByLabel("ישיבה", { exact: true })
    .selectOption(program.institutions[0].code);
  await page.getByLabel("שכבה", { exact: true }).selectOption("ז");
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
  readFailure = true;
  await page.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByText("הדף עדיין לא מוכן ללימוד").count(), 0);
  readFailure = false;
  await page.getByRole("button", { name: "ניסיון נוסף", exact: true }).click();
  await page.getByText(/^קטע 1 מתוך/).waitFor();
  const firstScan = await page.locator(".page-image").boundingBox();
  const firstControls = await page.locator(".reader-controls").boundingBox();
  await page.getByRole("button", { name: "הקטע הבא", exact: true }).click();
  await page.getByText(/^קטע 2 מתוך/).waitFor();
  const secondScan = await page.locator(".page-image").boundingBox();
  const secondControls = await page.locator(".reader-controls").boundingBox();
  assert.ok(
    Math.abs(firstScan.y - secondScan.y) < 1,
    "Scan moves between explanations",
  );
  assert.ok(
    Math.abs(firstControls.y - secondControls.y) < 1,
    "Reader actions move between explanations",
  );
  assert.equal(
    await page
      .getByRole("region", { name: "פירוש חברותא" })
      .getAttribute("tabindex"),
    "0",
  );
  await page.reload();
  await page.getByText(/^קטע 2 מתוך/).waitFor();
  await page.getByRole("button", { name: "הגדלה", exact: true }).click();
  assert.ok(
    await page
      .locator(".page-canvas")
      .evaluate((element) => element.getBoundingClientRect().width >= 1600),
  );
  await page.getByRole("button", { name: "תצוגה רגילה", exact: true }).click();
  let count = 0;
  let scrolledExplanation = false;
  while (
    await page.getByRole("button", { name: "הקטע הבא", exact: true }).count()
  ) {
    await page.getByRole("button", { name: "הקטע הבא", exact: true }).click();
    const explanation = page.getByRole("region", { name: "פירוש חברותא" });
    if (
      !scrolledExplanation &&
      (await explanation.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ))
    ) {
      await explanation.focus();
      await explanation.press("End");
      await page.waitForTimeout(250);
      assert.ok(
        await explanation.evaluate((element) => element.scrollTop > 0),
        "Long explanation cannot be scrolled with the keyboard",
      );
      scrolledExplanation = true;
    }
    if (++count > 150) throw new Error("Reader navigation did not terminate");
  }
  assert.ok(scrolledExplanation, "Long explanation fixture was not exercised");
  const continuationPosition = await page
    .locator(".segment-indicator")
    .textContent();
  await page.reload();
  await page.getByText(continuationPosition, { exact: true }).waitFor();
  await page.getByText("המשך הקטע מהעמוד הקודם", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "סיימתי את הדף", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "עוד דף בדרך לסיום המסכת." })
    .waitFor();
  assert.ok(
    JSON.parse(await page.evaluate(() => localStorage.getItem("df:learned")))[
      "taanit|1"
    ],
  );
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
  await restored.getByLabel("טלפון", { exact: true }).fill("0500000000");
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
    };
    const registration = {
      pushManager: { getSubscription: async () => subscription },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    });
  });
  closed = true;
  waitFailure = true;
  const locked = await lockContext.newPage();
  await locked.goto(base + "/learn?mas=taanit&daf=ב&amud=1");
  await locked
    .getByRole("button", { name: "הודיעו לי כשהדף נפתח", exact: true })
    .click();
  await locked.getByRole("alert").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    null,
  );
  waitFailure = false;
  await locked
    .getByRole("button", { name: "הודיעו לי כשהדף נפתח", exact: true })
    .click();
  await locked.getByRole("status").waitFor();
  assert.equal(
    await locked.evaluate(() => localStorage.getItem("df:wait:taanit|ב.")),
    "1",
  );
  await lockContext.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base);
  assert.ok(await staticPage.getByRole("heading", { level: 1 }).count());
  assert.ok(await staticPage.locator('a[href^="/learn?"]').count());
  await noJs.close();
  const legacyContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await prepare(legacyContext);
  const legacyPage = await legacyContext.newPage();
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
