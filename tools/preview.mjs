import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import sheets from "../api/sheets.ts";
import wait from "../api/wait.ts";
import action from "../api/action.ts";
const root = path.resolve("dist");
const demo = process.env.HADAF_DEMO === "1";
const demoStudents = [];
const demoProgress = new Map();
async function demoReply(req, res, url) {
  res.setHeader("Cache-Control", "no-store");
  if (url.pathname === "/api/sheets") {
    const tab = url.searchParams.get("tab");
    let body;
    if (tab === "סימוני הדף")
      body = await fs.readFile("tests/fixtures/lesson.csv", "utf8");
    else if (tab === "דפים פתוחים")
      body =
        '"מסכת","דף","נפתח"\n"taanit","ב.","2026-10-04"\n"megila","ב.","2026-10-04"';
    else if (tab === "מוסדות") {
      const program = JSON.parse(
        await fs.readFile("src/generated/program.json", "utf8"),
      );
      body =
        '"code","name","last","joined"\n' +
        program.institutions
          .map((inst) =>
            [inst.code, inst.name, "true", String(!!inst.joined)]
              .map((value) => '"' + value.replaceAll('"', '""') + '"')
              .join(","),
          )
          .join("\n");
    } else if (tab === "טקסטים") body = '"מפתח","נוסח"';
    else body = '"מסכת","דף","נתונים"';
    res.writeHead(200, { "Content-Type": "text/csv;charset=utf-8" });
    res.end(body);
    return;
  }
  let source = "";
  for await (const chunk of req) {
    source += chunk;
    if (source.length > 4500000) {
      res.writeHead(413);
      res.end();
      return;
    }
  }
  const envelope = JSON.parse(source);
  const payload = envelope.payload || envelope;
  let result = { status: "ok" };
  if (envelope.operation === "read") {
    if (payload.codes && payload.key !== "DEMO") {
      res.writeHead(403);
      res.end('{"status":"denied"}');
      return;
    }
    if (payload.team) {
      if (payload.key !== "DEMO") {
        res.writeHead(403);
        res.end('{"status":"denied"}');
        return;
      }
      result = {
        status: "ok",
        rows: [
          ["ישיבה", "עדכון", "תגיות", "אנשי קשר"],
          [
            "ישיבה לדוגמה",
            "נרשמו תלמידים חדשים",
            '["משתתפים"]',
            '[{"name":"איש קשר לדוגמה","phone":"0500000000"}]',
          ],
        ],
      };
    } else if (payload.board) {
      if (payload.key !== "DEMO" && payload.k !== "DEMO") {
        res.writeHead(403);
        res.end('{"status":"denied"}');
        return;
      }
      result = {
        status: "ok",
        students: demoStudents.map((person) => ({
          ...person,
          weeks: demoProgress.get(person.id) || [],
        })),
      };
    } else if (payload.read)
      result = {
        status: "ok",
        rows:
          payload.read === "טקסטים"
            ? [["מפתח", "נוסח"]]
            : payload.read === "הגדרות"
              ? [["מפתח", "ערך"]]
              : [["מסכת", "דף", "עמוד", "נתונים"]],
      };
    else if (payload.whoIs) {
      const person = demoStudents.find(
        (person) =>
          person.phone === payload.whoIs &&
          person.first === payload.first &&
          person.last === payload.last,
      );
      result = {
        status: "ok",
        me: person || null,
        learned: person ? demoProgress.get(person.id) || [] : [],
      };
    } else if (payload.amdaFor)
      result = {
        status: "ok",
        learned: demoProgress.get(payload.amdaFor) || [],
      };
    else if (payload.idFor)
      result = {
        status: "ok",
        id: payload.idFor,
        learned: demoProgress.get(payload.idFor) || [],
      };
  } else if (payload.action === "teamlog") {
    if (payload.key !== "DEMO") {
      res.writeHead(403);
      res.end('{"status":"denied"}');
      return;
    }
  } else if (payload.action === "row") {
    const columns = Object.fromEntries(JSON.parse(payload.cols));
    if (payload.tab === "לומדים") {
      const person = {
        id: columns["מזהה"],
        first: columns["שם"],
        last: columns["משפחה"],
        phone: columns["טלפון"],
        inst: columns["קוד ישיבה"],
        instName: columns["ישיבה"],
        grade: columns["שכבה"],
        klass: columns["כיתה"],
        way: columns["מסגרת"],
        role: columns["תפקיד"] === "הורה" ? "dad" : "kid",
      };
      const index = demoStudents.findIndex((item) => item.id === person.id);
      if (index < 0) demoStudents.push(person);
      else demoStudents[index] = person;
      result = { status: "ok", id: person.id };
    } else if (payload.tab === "לימוד") {
      const tags = demoProgress.get(columns["מזהה"]) || [];
      const tag = columns["מסלול"] + "|" + columns["שבוע"];
      if (!tags.includes(tag)) tags.push(tag);
      demoProgress.set(columns["מזהה"], tags);
    }
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result));
}
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (demo && url.pathname.startsWith("/api/")) {
        await demoReply(req, res, url);
        return;
      }
      if (url.pathname === "/api/sheets") {
        await sheets(req, res);
        return;
      }
      if (["/api/wait", "/api/action"].includes(url.pathname)) {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 4500000) {
            res.writeHead(413);
            res.end();
            return;
          }
        }
        req.body = JSON.parse(body);
        await (url.pathname === "/api/wait" ? wait : action)(req, res);
        return;
      }
      let name = decodeURIComponent(url.pathname);
      if (name === "/") name = "/index.html";
      else if (!path.extname(name)) name += ".html";
      const file = path.resolve(root, "." + name);
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let contents = await fs.readFile(file);
      if (demo && file.endsWith(".html"))
        contents = Buffer.from(
          contents
            .toString()
            .replace(
              "<body>",
              '<body><div dir="rtl" style="background:#112c50;color:white;padding:6px 12px;text-align:center;font:14px system-ui">הדגמה בלבד · קוד לניהול: <b dir="ltr">DEMO</b></div>',
            ),
        );
      const contentType =
        types[path.extname(file)] || "application/octet-stream";
      const compressed =
        /text|javascript|json/.test(contentType) &&
        String(req.headers["accept-encoding"] || "").includes("gzip");
      if (compressed) contents = gzipSync(contents);
      res.writeHead(200, {
        "Content-Type": contentType,
        ...(compressed
          ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" }
          : {}),
      });
      res.end(contents);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(
    Number(process.env.PORT || 4321),
    process.env.HOST || "127.0.0.1",
    () =>
      console.log(
        `Built-site preview: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 4321}`,
      ),
  );
