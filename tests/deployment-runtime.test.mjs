import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import ts from "typescript";

test("emitted API modules load without TypeScript source files", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "hadaf-runtime-"));
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile).config;
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, ".");
  try {
    await fs.writeFile(
      path.join(directory, "package.json"),
      '{"type":"module"}',
    );
    await fs.symlink(
      path.resolve("node_modules"),
      path.join(directory, "node_modules"),
    );
    const files = ["src/lib/csv.ts", "src/generated/settings.json"];
    for (const folder of ["api", "src/server", "src/config"])
      for (const name of await fs.readdir(folder))
        if (/\.(ts|json)$/.test(name)) files.push(path.join(folder, name));
    for (const file of files) {
      const source = await fs.readFile(file, "utf8");
      const output = /\.(ts|mts)$/.test(file)
        ? ts.transpileModule(source, {
            compilerOptions: { ...options, noEmit: false },
            fileName: file,
          }).outputText
        : source;
      const target = path.join(
        directory,
        file.replace(/\.mts$/, ".mjs").replace(/\.ts$/, ".js"),
      );
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, output);
    }
    for (const name of ["action", "sheets", "wait"]) {
      const module = await import(
        pathToFileURL(path.join(directory, "api", name + ".js"))
      );
      assert.equal(typeof module.default, "function");
    }
    for (const name of [
      "notification-request",
      "pair-notification-event",
      "notification-failure-event",
      "github-publisher",
    ])
      await import(
        pathToFileURL(path.join(directory, "src/server", name + ".js"))
      );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
