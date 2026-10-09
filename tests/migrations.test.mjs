import test from "node:test";
import assert from "node:assert/strict";
import { splitSql, runtimeMigrations } from "../src/server/migrations.ts";
test("SQL migrations keep function bodies, strings and nested comments intact", () => {
  const source = `CREATE FUNCTION f() RETURNS text AS $hadaf$ BEGIN RETURN 'a;b'; END $hadaf$ LANGUAGE plpgsql;
    /* nested /* ; */ comment */ SELECT 'a'';b', "c;d";
    -- ignored ;
    SELECT $$semicolon;$$;`;
  const statements = splitSql(source);
  assert.equal(statements.length, 3);
  assert.match(statements[0], /RETURN 'a;b'; END/);
  for (const bad of ["SELECT 'open", "SELECT $body$open", "/* open"])
    assert.throws(() => splitSql(bad));
});
test("runtime migrations are ordered and produce complete SQL statements", async () => {
  const migrations = await runtimeMigrations();
  assert.deepEqual(
    migrations.map((migration) => migration.name),
    ["002-runtime.sql", "003-public-counts.sql", "004-notification-ledger.sql"],
  );
  assert.ok(
    migrations.every(
      (migration) =>
        migration.statements.length > 0 &&
        /^[a-f0-9]{64}$/.test(migration.hash),
    ),
  );
});
