import test from "node:test";
import assert from "node:assert/strict";
import { forwardAction } from "../src/server/actions.ts";
test("private tables and global participant reads require a key", async () => {
  let calls = 0;
  const request = async () => {
    calls++;
    return Response.json({ status: "ok" });
  };
  for (const payload of [
    { read: "לומדים" },
    { board: "*" },
    { codes: "1" },
    { team: "1" },
    { ss: "OTHER", read: "לומדים", key: "TEST" },
  ]) {
    await assert.rejects(
      forwardAction({ operation: "read", payload }, request),
    );
  }
  assert.equal(calls, 0);
});
test("denied or unacknowledged actions never become an empty roster or a successful save", async () => {
  for (const result of [
    { status: "denied" },
    { students: [] },
    { status: "error" },
  ]) {
    await assert.rejects(
      forwardAction(
        { operation: "read", payload: { board: "TEST", k: "TEST" } },
        async () => Response.json(result),
      ),
    );
  }
  const result = await forwardAction(
    { operation: "read", payload: { board: "TEST", k: "TEST" } },
    async () => Response.json({ status: "ok", students: [] }),
  );
  assert.deepEqual(result.students, []);
});
test("public writes cannot edit content, use custom sheets or write coordinator subscriptions", async () => {
  for (const payload of [
    { action: "table", tab: "טקסטים", rows: "[]" },
    {
      action: "row",
      tab: "לומדים",
      cols: JSON.stringify([["unknown", "TEST"]]),
    },
    { action: "row", tab: "התראות", cols: JSON.stringify([["תפקיד", "רכז"]]) },
    {
      action: "row",
      tab: "לומדים",
      cols: JSON.stringify([["מזהה", "TEST"]]),
      ss: "OTHER",
      key: "TEST",
    },
  ])
    await assert.rejects(forwardAction({ operation: "write", payload }));
});
test("read credentials are forwarded only upstream and not included in the response", async () => {
  const result = await forwardAction(
    { operation: "read", payload: { board: "TEST", key: "TEST_KEY" } },
    async (url) => {
      assert.equal(url.searchParams.get("key"), "TEST_KEY");
      return Response.json({ status: "ok", students: [] });
    },
  );
  assert.ok(!JSON.stringify(result).includes("TEST_KEY"));
});
