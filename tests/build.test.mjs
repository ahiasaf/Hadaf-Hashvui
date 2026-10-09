import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import program from "../src/generated/program.json" with { type: "json" };
import { lessonHref, studyUnits, weekIndex } from "../src/lib/calendar.ts";
test("calendar separates learning units from calendar weeks", () => {
  assert.equal(studyUnits(program.tracks[0]), 31);
  assert.equal(program.tracks[0].cal.length, 36);
  assert.match(
    lessonHref(program.tracks[0], program.tracks[0].cal[1]),
    /amud=2/,
  );
});
test("week changes at Jerusalem calendar midnight, not browser timezone", () => {
  assert.equal(weekIndex("2026-10-04", new Date("2026-10-10T20:59:00Z")), 0);
  assert.equal(weekIndex("2026-10-04", new Date("2026-10-10T21:01:00Z")), 1);
});
test("built slide fallback references only existing originals and optimized assets", async () => {
  const window = {
    localStorage: { getItem: () => null },
    CONTENT: program.content,
    DF_DECK_FILES: program.defaults,
    DF_MEDIA: program.media,
  };
  const context = {
    window,
    localStorage: window.localStorage,
    CONTENT: program.content,
    DF_DECK_FILES: program.defaults,
    DF_MEDIA: program.media,
  };
  vm.createContext(context);
  vm.runInContext(await fs.readFile("src/shared/deck.js", "utf8"), context);
  for (const key of Object.keys(program.defaults)) {
    const [mas, week] = key.split("-");
    const deck = context.DeckOf(mas, Number(week));
    for (let index = 1; index <= deck.files.length; index++) {
      const src = context.DeckSrc(deck, index);
      await fs.access("dist/" + src.replace(/^\//, ""));
    }
  }
});
test("home contains prerendered content and excludes legacy admin payload", async () => {
  const source = await fs.readFile("dist/index.html", "utf8");
  assert.ok(source.includes(program.ui.siteTitle.split(" ")[0]));
  assert.ok(!source.includes('src="data.js"'));
  assert.ok(!source.includes("function admEnterOnce"));
  assert.ok(Buffer.byteLength(source) < 45000);
  await fs.access("dist/app.html");
  await fs.access("dist/admin.html");
  await fs.access("dist/tyuta.html");
  for (const page of ["voicetest", "pushtest"])
    await assert.rejects(fs.access("dist/" + page + ".html"));
});

test("homepage precache contains its scripts and excludes the React runtime", async () => {
  const source = await fs.readFile("dist/index.html", "utf8");
  const worker = await fs.readFile("dist/sw.js", "utf8");
  assert.ok(!source.includes("astro-island"));
  for (const match of source.matchAll(/["'](\/_astro\/[^"']+\.js)["']/g))
    assert.ok(worker.includes(match[1].slice(1)), match[1]);
  for (const file of await fs.readdir("dist/_astro")) {
    if ((await fs.stat("dist/_astro/" + file)).size > 50000)
      assert.ok(!worker.includes(file));
  }
});

test("reader metadata is a compact cacheable file instead of repeated page props", async () => {
  const source = await fs.readFile("dist/learn.html", "utf8");
  const manifest = JSON.parse(
    await fs.readFile("src/generated/library.json", "utf8"),
  );
  assert.ok(Buffer.byteLength(source) < 30000);
  assert.ok(!source.includes("responsiveBytes"));
  const publicFile = JSON.parse(
    await fs.readFile("dist" + manifest.url, "utf8"),
  );
  assert.equal(Object.keys(publicFile.pages).length, 119);
  for (const image of Object.values(publicFile.pages))
    await fs.access("dist" + image.responsive);
});

test("workspace pages link the workspace stylesheet and the home stays without it", async () => {
  const styles = async (page) => {
    const html = await fs.readFile("dist/" + page + ".html", "utf8");
    let css = "";
    for (const match of html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g))
      css += await fs.readFile("dist" + match[1], "utf8");
    return css;
  };
  assert.ok(!(await styles("index")).includes(".workspace{"));
  for (const page of [
    "join",
    "app",
    "tzevet",
    "board",
    "admin",
    "learn",
    "info",
    "accessibility",
    "rights",
  ])
    assert.ok((await styles(page)).includes(".workspace{"), page);
});
