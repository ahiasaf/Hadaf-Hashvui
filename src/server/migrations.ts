import { createHash } from "node:crypto";
import fs from "node:fs/promises";

// PostgreSQL functions contain semicolons, so statements must respect dollar quotes.
export function splitSql(source: string): string[] {
  const statements: string[] = [];
  let start = 0,
    at = 0,
    quote = "",
    dollar = "",
    comment = 0;
  while (at < source.length) {
    const char = source[at],
      next = source[at + 1];
    if (comment === -1) {
      if (char === "\n") comment = 0;
      at++;
      continue;
    }
    if (comment > 0) {
      if (char === "/" && next === "*") {
        comment++;
        at += 2;
      } else if (char === "*" && next === "/") {
        comment--;
        at += 2;
      } else at++;
      continue;
    }
    if (dollar) {
      if (source.startsWith(dollar, at)) {
        at += dollar.length;
        dollar = "";
      } else at++;
      continue;
    }
    if (quote) {
      if (char === quote) {
        if (next === quote) at += 2;
        else {
          quote = "";
          at++;
        }
      } else at++;
      continue;
    }
    if (char === "-" && next === "-") {
      comment = -1;
      at += 2;
      continue;
    }
    if (char === "/" && next === "*") {
      comment = 1;
      at += 2;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      at++;
      continue;
    }
    if (char === "$") {
      const match = /^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/.exec(source.slice(at));
      if (match) {
        dollar = match[0];
        at += dollar.length;
        continue;
      }
    }
    if (char === ";") {
      const statement = source.slice(start, at).trim();
      if (statement) statements.push(statement);
      start = at + 1;
    }
    at++;
  }
  if (quote || dollar || comment > 0)
    throw new Error("Unterminated SQL statement");
  const last = source.slice(start).trim();
  if (last) statements.push(last);
  return statements;
}
export async function runtimeMigrations() {
  const folder = new URL("../../backend/database/", import.meta.url);
  const names = (await fs.readdir(folder))
    // 001 is the import schema; every later numbered file is a runtime migration.
    .filter((name) => /^\d{3}-[a-z-]+\.sql$/.test(name) && name > "002")
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const source = await fs.readFile(new URL(name, folder), "utf8");
      return {
        name,
        hash: createHash("sha256").update(source).digest("hex"),
        statements: splitSql(source),
      };
    }),
  );
}
