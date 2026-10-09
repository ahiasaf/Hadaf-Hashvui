import test from "node:test";
import assert from "node:assert/strict";
import { createPublisher } from "../src/server/github-publisher.ts";
const config = {
  token: "TEST_TOKEN",
  readKey: "TEST_READ_KEY",
  repository: "example/hadaf",
  branch: "preview",
};
const payload = {
  action: "ghput",
  key: "TEST_READ_KEY",
  path: "slides/taanit-1/one.webp",
  b64: Buffer.from("FIXTURE").toString("base64"),
};
test("publisher uses configured branch and the observed SHA with an English commit", async () => {
  const calls = [];
  const publish = createPublisher(config, async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? Response.json({ type: "file", sha: "TEST_OLD_SHA" })
      : Response.json({ commit: { sha: "TEST_COMMIT" } });
  });
  const result = await publish({
    ...payload,
    msg: "Hebrew user text is not a commit title",
  });
  assert.equal(result.commit, "TEST_COMMIT");
  assert.ok(calls[0].url.endsWith("?ref=preview"));
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.branch, "preview");
  assert.equal(body.sha, "TEST_OLD_SHA");
  assert.equal(body.message, "chore: replace slides/taanit-1/one.webp");
});
test("lookup failure or conflict never becomes an overwrite retry", async () => {
  let calls = 0;
  const unavailable = createPublisher(config, async () => {
    calls++;
    return new Response("TEST_PRIVATE_RESPONSE", { status: 503 });
  });
  await assert.rejects(unavailable(payload), /lookup failed/);
  assert.equal(calls, 1);
  calls = 0;
  const conflict = createPublisher(config, async () => {
    calls++;
    return calls === 1
      ? Response.json({ type: "file", sha: "OLD" })
      : new Response("TEST_PRIVATE_RESPONSE", { status: 409 });
  });
  await assert.rejects(conflict(payload), /changed/);
  assert.equal(calls, 2);
});
test("missing files can be created or acknowledged as already deleted", async () => {
  const bodies = [];
  const publish = createPublisher(config, async (_url, options) => {
    if (!options.method) return new Response(null, { status: 404 });
    bodies.push(JSON.parse(options.body));
    return Response.json({ commit: { sha: "CREATED" } }, { status: 201 });
  });
  assert.equal((await publish(payload)).replaced, false);
  assert.ok(!("sha" in bodies[0]));
  assert.equal((await publish({ ...payload, action: "ghdel" })).gone, true);
  assert.equal(bodies.length, 1);
});
test("unauthorized requests, arbitrary code paths and unset branches fail before network access", async () => {
  let calls = 0;
  const request = async () => {
    calls++;
    throw new Error("Unexpected network");
  };
  const publish = createPublisher(config, request);
  for (const path of [
    "src/server/actions.ts",
    "slides/../secret",
    "slides/test/a\\b.png",
    "slides/test/deep/file.png",
  ])
    await assert.rejects(publish({ ...payload, path }), /path/);
  await assert.rejects(publish({ ...payload, key: "WRONG" }), /denied/);
  await assert.rejects(publish({ ...payload, b64: "bad!?" }), /content/);
  await assert.rejects(
    createPublisher({ ...config, branch: "" }, request)(payload),
    /configuration/,
  );
  assert.equal(calls, 0);
});
