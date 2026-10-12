import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { releaseFingerprint } from "../tools/release-fingerprint.mjs";

test("lesson and dashboard fixes trigger an update without changing the homepage", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "hadaf-release-"));
  try {
    await fs.mkdir(path.join(directory, "scripts"));
    await fs.writeFile(
      path.join(directory, "index.html"),
      "unchanged homepage",
    );
    const lesson = path.join(directory, "scripts", "lesson.js");
    await fs.writeFile(lesson, "old lesson");
    const before = await releaseFingerprint(directory, "worker");
    assert.equal(await releaseFingerprint(directory, "worker"), before);
    await fs.writeFile(lesson, "fixed lesson");
    const updated = await releaseFingerprint(directory, "worker");
    assert.notEqual(updated, before);
    await fs.writeFile(
      path.join(directory, "dashboard.css"),
      "new progress style",
    );
    const styled = await releaseFingerprint(directory, "worker");
    assert.notEqual(styled, updated);
    await fs.writeFile(
      path.join(directory, "sw.js"),
      "previous generated worker",
    );
    await fs.writeFile(
      path.join(directory, "page.webp"),
      "immutable page scan",
    );
    assert.equal(await releaseFingerprint(directory, "worker"), styled);
    assert.notEqual(
      await releaseFingerprint(directory, "changed worker"),
      styled,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
