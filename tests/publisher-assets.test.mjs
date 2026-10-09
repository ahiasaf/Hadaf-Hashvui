import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { stagePublisherAssets } from "../tools/publisher-assets.mjs";

test("publisher source paths survive staging, including uploads, replacements and removals", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "hadaf-publisher-"));
  try {
    await fs.mkdir(path.join(root, "slides", "example"), { recursive: true });
    const source = path.join(root, "slides", "example", "01.jpg");
    const output = path.join(root, "static", "slides", "example", "01.jpg");
    await fs.writeFile(source, "original");
    await stagePublisherAssets(root);
    assert.equal(await fs.readFile(output, "utf8"), "original");
    assert.equal(await fs.readFile(source, "utf8"), "original");

    await fs.writeFile(source, "replacement");
    await fs.mkdir(path.join(root, "audio", "example"), { recursive: true });
    await fs.writeFile(path.join(root, "audio", "example", "01.webm"), "clip");
    await stagePublisherAssets(root);
    assert.equal(await fs.readFile(output, "utf8"), "replacement");
    assert.equal(
      await fs.readFile(
        path.join(root, "static", "audio", "example", "01.webm"),
        "utf8",
      ),
      "clip",
    );

    await fs.rm(source);
    await fs.rm(path.join(root, "audio"), { recursive: true });
    await stagePublisherAssets(root);
    await assert.rejects(fs.access(output), { code: "ENOENT" });
    await assert.rejects(fs.access(path.join(root, "static", "audio")), {
      code: "ENOENT",
    });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
