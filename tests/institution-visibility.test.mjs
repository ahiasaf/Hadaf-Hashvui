import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/sheets.ts";
import { parseCsv } from "../src/lib/csv.ts";
test("public school responses omit the sample while preserving real schools and CSV values", async () => {
  const originalFetch = globalThis.fetch;
  const originalBackend = process.env.HADAF_DATABASE_BACKEND;
  process.env.HADAF_DATABASE_BACKEND = "legacy";
  globalThis.fetch = async () =>
    new Response(
      '"code","name","last","joined"\n"demo","ישיבה לדוגמה","true","true"\n"REAL","ישיבה, אמיתית","true","true"',
    );
  let status, body;
  try {
    await handler(
      { method: "GET", url: "/api/sheets?tab=" + encodeURIComponent("מוסדות") },
      {
        writeHead(code) {
          status = code;
        },
        end(value) {
          body = value;
        },
      },
    );
    assert.equal(status, 200);
    assert.deepEqual(parseCsv(body), [
      ["code", "name", "last", "joined"],
      ["REAL", "ישיבה, אמיתית", "true", "true"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBackend === undefined)
      delete process.env.HADAF_DATABASE_BACKEND;
    else process.env.HADAF_DATABASE_BACKEND = originalBackend;
  }
});
