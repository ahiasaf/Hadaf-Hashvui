import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "html-minifier-terser";
import mediaMap from "../src/generated/program.json" with { type: "json" };
import settings from "../src/generated/settings.json" with { type: "json" };
import { publicTabs } from "../src/server/upstream.ts";
async function script(source, target) {
  for (const [original, optimized] of Object.entries(mediaMap.media)) {
    if (!/^(sfarim|weekpics|flyer)\//.test(original)) continue;
    source = source
      .replaceAll(JSON.stringify(original), JSON.stringify(optimized))
      .replaceAll("'" + original + "'", JSON.stringify(optimized));
  }
  const result = await minifyJs(source, {
    compress: true,
    mangle: false,
    format: { ascii_only: true },
  });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, result.code);
}
// Astro already copies static assets. Emit only generated media and specialist scripts.
await fs.cp("src/generated/media", "dist/media", { recursive: true });
await fs.copyFile("src/generated/media.js", "dist/media.js");
await fs.copyFile("src/styles/mobile.css", "dist/mobile.css");
await fs.writeFile(
  "dist/net-config.js",
  "window.DF_API=" +
    JSON.stringify(settings.api) +
    ";window.DF_SHEET_ID=" +
    JSON.stringify(settings.sheetId) +
    ";window.DF_PUBLIC_TABS=" +
    JSON.stringify([...publicTabs]) +
    ";",
);
for (const name of await fs.readdir("src/shared")) {
  if (name.endsWith(".js"))
    await script(
      await fs.readFile(path.join("src/shared", name), "utf8"),
      path.join("dist", name),
    );
}
await script(
  await fs.readFile("src/generated/data.js", "utf8"),
  "dist/data.js",
);
await script(
  await fs.readFile("src/generated/links.js", "utf8"),
  "dist/links.js",
);
await fs.mkdir("dist/tool-styles", { recursive: true });
for (const name of await fs.readdir("src/features")) {
  const directory = path.join("src/features", name);
  const page = JSON.parse(
    await fs.readFile(path.join(directory, "page.json"), "utf8"),
  );
  const css = (
    await fs.readFile(path.join(directory, "styles.css"), "utf8")
  ).replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (value, quote, url) =>
    /^(?:\/|#|data:|https?:)/.test(url)
      ? value
      : "url(" + quote + "/" + url + quote + ")",
  );
  const optimized = await minifyHtml("<style>" + css + "</style>", {
    minifyCSS: true,
  });
  await fs.writeFile(
    path.join("dist/tool-styles", name + ".css"),
    optimized.slice(7, -8),
  );
  for (const [index, item] of page.scripts.entries()) {
    if (!item.files) continue;
    const code = (
      await Promise.all(
        item.files.map((file) =>
          fs.readFile(path.join(directory, file), "utf8"),
        ),
      )
    ).join("\n");
    await script(
      code,
      path.join("dist/scripts", name, "entry-" + index + ".js"),
    );
  }
}
// Rewrite known display images to their fingerprinted variants and defer offscreen images.
for (const name of (await fs.readdir("dist")).filter((name) =>
  name.endsWith(".html"),
)) {
  const file = "dist/" + name;
  let html = await fs.readFile(file, "utf8");
  html = html.replace(
    /<link rel="icon" href="\/icon-192.png"[^>]*>/,
    '<link rel="icon" href="' +
      mediaMap.media["icon-192.png"] +
      '" sizes="32x32">',
  );
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    tag = tag.replace(/\bsrc=["']([^"']+)["']/i, (attribute, src) => {
      const optimized = src.startsWith("http")
        ? null
        : mediaMap.media[src.replace(/^\//, "")];
      return optimized ? 'src="' + optimized + '"' : attribute;
    });
    if (!/\bloading=/.test(tag) && !tag.includes("/media/brand/"))
      tag = tag.replace(/^<img/, '<img loading="lazy"');
    if (!/\bdecoding=/.test(tag))
      tag = tag.replace(/^<img/, '<img decoding="async"');
    return tag;
  });
  await fs.writeFile(file, html);
}
const assets = (await fs.readdir("dist/_astro"))
  .filter((name) => /\.(js|css|woff2)$/.test(name))
  .map((name) => "./_astro/" + name);
// Homepage registration must not precache every React screen or specialist tool.
const home = await fs.readFile("dist/index.html", "utf8");
const requested = new Set(
  [
    ...home.matchAll(
      /(?:src|href|component-url|renderer-url)="(\/_astro\/[^"?]+)"|["'](\/_astro\/[^"']+\.js)["']/g,
    ),
  ].map((match) => "." + (match[1] || match[2])),
);
// Include the static homepage's module dependencies, without pulling in other screens.
async function dependencies(asset) {
  if (!asset.endsWith(".js")) return;
  const source = await fs.readFile("dist/" + asset.slice(2), "utf8");
  for (const match of source.matchAll(
    /(?:from|import)\s*["'](\.\/[^"']+\.js)["']/g,
  )) {
    const dependency = "./_astro/" + path.basename(match[1]);
    if (!requested.has(dependency)) {
      requested.add(dependency);
      await dependencies(dependency);
    }
  }
}
for (const asset of [...requested]) await dependencies(asset);
const core = assets.filter((asset) => requested.has(asset));
let worker = await fs.readFile("src/service-worker.js", "utf8");
const release = createHash("sha256")
  .update(home + core.join("|") + worker)
  .digest("hex")
  .slice(0, 12);
worker = worker.replace(/(var CACHE_NAME = '[^']+)'/, "$1-" + release + "'");
worker = worker
  .replace("var CORE = [", "var CORE = " + JSON.stringify(core) + ".concat([")
  .replace("'./icon-512.png'];", "'./icon-512.png']);");
await script(worker, "dist/sw.js");
console.log(
  "Built specialist scripts and fingerprinted media; prerendered public routes retained.",
);
