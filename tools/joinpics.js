/* Generate screenshots of the actual signup flow using isolated browser fixtures. */
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const root = path.resolve(__dirname, "../dist");
const output = path.resolve(__dirname, "../static/joinpics");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
(async () => {
  const server = http
    .createServer(async (request, response) => {
      try {
        let name = decodeURIComponent(
          new URL(request.url, "http://localhost").pathname,
        );
        if (name === "/") name = "/index.html";
        else if (!path.extname(name)) name += ".html";
        const file = path.resolve(root, "." + name);
        if (!file.startsWith(root + path.sep)) throw new Error("Invalid path");
        response.setHeader(
          "Content-Type",
          types[path.extname(file)] || "application/octet-stream",
        );
        response.end(await fs.readFile(file));
      } catch {
        response.writeHead(404);
        response.end();
      }
    })
    .listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await context.route("https://**", (route) => route.abort());
    await context.route("**/api/**", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ json: { status: "ok", id: "SCREENSHOT_DEMO" } })
        : route.fulfill({ body: "key,value", contentType: "text/csv" }),
    );
    const page = await context.newPage();
    await fs.mkdir(output, { recursive: true });
    async function save(name) {
      await sharp(await page.screenshot({ fullPage: true }))
        .resize({ width: 360 })
        .webp({ quality: 80 })
        .toFile(path.join(output, name + ".webp"));
      console.log("Signup screenshot:", name);
    }
    await page.goto("http://127.0.0.1:" + server.address().port + "/join");
    await page.getByRole("button", { name: "מתחילים", exact: true }).waitFor();
    await save("landing");
    await page.getByRole("button", { name: "מתחילים", exact: true }).click();
    await save("form");
    await page.getByLabel("שם פרטי", { exact: true }).first().fill("תלמיד");
    await page.getByLabel("שם משפחה", { exact: true }).first().fill("לדוגמה");
    await page.getByLabel("טלפון", { exact: true }).fill("0500000000");
    await page.getByLabel("ישיבה", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("שכבה", { exact: true }).selectOption("ז");
    await page
      .getByRole("button", { name: "שמירת ההרשמה", exact: true })
      .click();
    await page.getByRole("heading", { name: "שלום, תלמיד" }).waitFor();
    await save("registered");
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
