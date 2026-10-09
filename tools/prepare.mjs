import fs from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { stagePublisherAssets } from "./publisher-assets.mjs";
await stagePublisherAssets();
const source = await fs.readFile("src/config/program.js", "utf8");
const context = {};
vm.runInNewContext(source, context, { timeout: 1000 });
await fs.mkdir("src/generated", { recursive: true });
const media = {};
const defaults = {};
for (const [key, content] of Object.entries(context.CONTENT)) {
  const deck = content.deck;
  if (!deck) continue;
  const files = await fs.readdir(path.join("static", deck.dir));
  defaults[key] = files.filter((name) => /^\d{2}\.jpg$/.test(name)).sort();
}
for (const directory of await fs.readdir("static/slides")) {
  const folder = path.join("slides", directory);
  for (const name of await fs.readdir(path.join("static", folder))) {
    if (!/\.(png|jpe?g)$/i.test(name)) continue;
    const input = path.join("static", folder, name);
    const digest = createHash("sha256")
      .update(await fs.readFile(input))
      .digest("hex")
      .slice(0, 12);
    const optimizedName = name + "." + digest + ".webp";
    const output = path.join("src/generated/media", folder, optimizedName);
    await fs.mkdir(path.dirname(output), { recursive: true });
    const previous = await fs.stat(output).catch(() => null);
    if (!previous || previous.mtimeMs < (await fs.stat(input)).mtimeMs)
      await sharp(input)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(output);
    if ((await fs.stat(output)).size < (await fs.stat(input)).size)
      media[path.join(folder, name)] =
        "/media/" + path.join(folder, optimizedName);
  }
}
// Book previews and logos are display assets, not full-resolution document downloads.
for (const folder of ["sfarim", "weekpics", "flyer"]) {
  for (const name of await fs.readdir("static/" + folder)) {
    if (!/\.(png|jpe?g|webp)$/i.test(name) || name.includes("-hi.")) continue;
    const input = path.join("static", folder, name);
    const bytes = await fs.readFile(input);
    const digest = createHash("sha256")
      .update(bytes)
      .digest("hex")
      .slice(0, 12);
    const optimizedName = name + "." + digest + ".webp";
    const output = path.join("src/generated/media", folder, optimizedName);
    await fs.mkdir(path.dirname(output), { recursive: true });
    if (!(await fs.stat(output).catch(() => null)))
      await sharp(bytes)
        .resize({
          width: folder === "sfarim" ? 720 : 1200,
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(output);
    if ((await fs.stat(output)).size < bytes.length)
      media[folder + "/" + name] = "/media/" + folder + "/" + optimizedName;
  }
}
const logoBytes = await fs.readFile("static/logo-mark.png");
const logoHash = createHash("sha256")
  .update(logoBytes)
  .digest("hex")
  .slice(0, 12);
const logoName = "logo-mark." + logoHash + ".webp";
await fs.mkdir("src/generated/media/brand", { recursive: true });
await sharp(logoBytes)
  .resize({ width: 96 })
  .webp({ lossless: true })
  .toFile("src/generated/media/brand/" + logoName);
media["logo-mark.png"] = "/media/brand/" + logoName;
const iconBytes = await fs.readFile("static/icon-192.png");
const iconHash = createHash("sha256")
  .update(iconBytes)
  .digest("hex")
  .slice(0, 12);
const iconName = "favicon." + iconHash + ".png";
await sharp(iconBytes)
  .resize(32, 32)
  .png()
  .toFile("src/generated/media/brand/" + iconName);
media["icon-192.png"] = "/media/brand/" + iconName;
const library = JSON.parse(await fs.readFile("static/daf/index.json", "utf8"));
const pages = {};
let originalBytes = 0,
  responsiveBytes = 0;
for (const [track, entries] of Object.entries(library)) {
  for (const [daf, sides] of Object.entries(entries)) {
    for (const side of sides) {
      const source = path.join("daf", track, `${daf}-${side}.webp`);
      const input = path.join("static", source);
      const bytes = await fs.readFile(input);
      const digest = createHash("sha256")
        .update(bytes)
        .digest("hex")
        .slice(0, 12);
      const metadata = await sharp(bytes).metadata();
      if (!metadata.width || !metadata.height || metadata.width < 800)
        throw new Error("Invalid library image: " + source);
      const name = `${daf}-${side}.${digest}.800.webp`;
      const output = path.join("src/generated/media/daf", track, name);
      await fs.mkdir(path.dirname(output), { recursive: true });
      if (!(await fs.stat(output).catch(() => null)))
        await sharp(bytes)
          .resize({ width: 800 })
          .webp({ lossless: true })
          .toFile(output);
      const size = (await fs.stat(output)).size;
      pages[`${track}|${daf}|${side}`] = {
        original: "/" + source,
        responsive: `/media/daf/${track}/${name}`,
        width: metadata.width,
        height: metadata.height,
        bytes: bytes.length,
        responsiveBytes: size,
      };
      originalBytes += bytes.length;
      responsiveBytes += size;
    }
  }
}
const readerManifest = JSON.stringify({
  library,
  pages: Object.fromEntries(
    Object.entries(pages).map(([key, value]) => [
      key,
      {
        responsive: value.responsive,
        width: value.width,
        height: value.height,
      },
    ]),
  ),
});
const readerHash = createHash("sha256")
  .update(readerManifest)
  .digest("hex")
  .slice(0, 12);
const readerName = "library." + readerHash + ".json";
await fs.writeFile("src/generated/media/" + readerName, readerManifest);
await fs.writeFile(
  "src/generated/library.json",
  JSON.stringify({
    pages,
    originalBytes,
    responsiveBytes,
    url: "/media/" + readerName,
  }),
);
console.log(
  "Validated",
  Object.keys(pages).length,
  "library pages; responsive images:",
  responsiveBytes,
  "bytes vs",
  originalBytes,
);
const program = {
  year: context.PROGRAM.year,
  startDate: context.PROGRAM.startDate,
  tracks: context.TRACKS.map((track) => ({
    id: track.id,
    name: track.masechet,
    cal: track.cal,
    dapim: track.dapim,
  })),
  institutions: context.INSTITUTIONS,
  content: Object.fromEntries(
    Object.entries(context.CONTENT).map(([key, value]) => [
      key,
      { title: value.title, deck: value.deck },
    ]),
  ),
  ui: context.UI,
  landing: context.LANDING,
  info: context.INFO,
  rights: context.RIGHTS,
  accessibility: context.A11Y,
  defaults,
  media,
};
await fs.writeFile("src/generated/program.json", JSON.stringify(program));
await fs.writeFile(
  "src/generated/settings.json",
  JSON.stringify({ sheetId: context.SHEET_ID, api: context.APPS_SCRIPT_URL }),
);
await fs.writeFile(
  "src/generated/media.js",
  "window.DF_MEDIA=" +
    JSON.stringify(media) +
    ";window.DF_DECK_FILES=" +
    JSON.stringify(defaults) +
    ";\n",
);
console.log(
  "Prepared public content and",
  Object.keys(media).length,
  "optimized display images.",
);

// Reconstruct only active specialist tools for the established maintenance checks.
await fs.rm("src/generated/compatibility", { recursive: true, force: true });
await fs.mkdir("src/generated/compatibility", { recursive: true });
for (const name of await fs.readdir("src/features")) {
  const directory = path.join("src/features", name);
  const page = JSON.parse(
    await fs.readFile(path.join(directory, "page.json"), "utf8"),
  );
  const css = await fs.readFile(path.join(directory, "styles.css"), "utf8");
  const view = await fs.readFile(path.join(directory, "view.html"), "utf8");
  let html =
    '<html><head><meta property="og:image" content="share-card.jpg"><meta property="og:title" content="' +
    page.title +
    '"><meta property="og:description" content="הדף השבועי"><meta property="og:url" content="https://hadaf-hashvui.vercel.app/' +
    name +
    '"><link rel="stylesheet" href="/mobile.css"><style>' +
    css +
    "</style></head><body>" +
    view;
  for (const script of page.scripts) {
    if (script.src)
      html += '<script src="' + script.src.slice(1) + '"></script>';
    else {
      const code = script.inline
        ? await fs.readFile(path.join(directory, script.inline), "utf8")
        : (
            await Promise.all(
              script.files.map((file) =>
                fs.readFile(path.join(directory, file), "utf8"),
              ),
            )
          ).join("\n");
      html +=
        "<script" +
        (script.type ? ' type="' + script.type + '"' : "") +
        ">" +
        code +
        "</script>";
    }
  }
  await fs.writeFile(
    path.join("src/generated/compatibility", page.original + ".html"),
    html + "</body></html>",
  );
}
