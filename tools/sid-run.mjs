/* ============================================================
   ההסבה למזהים קבועים - מ-GitHub, בלי הטלפון.
   ============================================================
   "דרך האפליקציה זה יותר מדי תלוי במכשיר שלי." אותה הסבה בדיוק
   כמו הכפתור בניהול (אותו קוד: stepid.js והפונקציות sid* מתוך
   index.html), אבל רצה על מכונת GitHub עם READ_KEY מהסודות.

     node tools/sid-run.mjs check   - קריאה בלבד: מה הוסב ומה ממתין.
     node tools/sid-run.mjs next    - לשונית אחת: הבאה בתור. הסקריפט
                                     מגבה, כותב, מאמת, ואם לא - מחזיר
                                     (sidStep_ ב-apps-script.gs).
                                     אחר כך קוראים שוב ומשווים כאן.

   היומן של ריפו ציבורי גלוי לכל: מודפסים רק מספרים, שמות לשוניות
   ומזהים - לא תוכן.
   ============================================================ */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {
  ROOT,
  maintenanceContext,
  maintenanceFetch as fetch,
} from "./maintenance-runtime.mjs";
var mode = process.argv[2] || "check";
var key = (process.env.READ_KEY || "").trim();
if (!key) {
  console.error("חסר READ_KEY בסודות הריפו.");
  process.exit(1);
}
if (mode !== "check" && mode !== "next") {
  console.error("check או next");
  process.exit(1);
}

var URL_ = "https://maintenance.invalid/";

/* הקוד של הכפתור עצמו - לא עותק שעלול להיפרד ממנו */
var html = ["entry-21-37-admPing.js", "entry-21-38-sidHead_.js"]
  .map(function (f) {
    return fs.readFileSync(
      path.join(ROOT, "src/features/management", f),
      "utf8",
    );
  })
  .join("\n");
var a = html.indexOf("var SID_TABS = {"),
  b = html.indexOf("\nfunction admSet(el) {");
if (a < 0 || b < a) {
  console.error("לא נמצא קוד ההסבה ב-index.html");
  process.exit(1);
}
var ctx = maintenanceContext();
vm.runInContext(
  html.slice(a, b) + "\nthis.SID = SID; this.SID_VER = SID_VER;",
  ctx,
);
var TABS = ctx.SID_TABS;

function get(params, tries) {
  var q = Object.keys(params)
    .map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    })
    .join("&");
  tries = tries || 0;
  return fetch(URL_ + "?" + q, { redirect: "follow" })
    .then(function (r) {
      return r.text().then(function (txt) {
        try {
          return JSON.parse(txt);
        } catch {
          throw new Error(
            "תשובה שאינה JSON (HTTP " +
              r.status +
              ", " +
              txt.length +
              " תווים)",
          );
        }
      });
    })
    .catch(function (e) {
      /* גוגל מחזיר לפעמים דף שגיאה רגעי - מנסים שוב, ולא יותר מארבע פעמים */
      if (tries >= 4) throw e;
      console.log(
        "  ניסיון חוזר (" + (tries + 1) + "): " + ((e && e.message) || e),
      );
      return sleep(3000 * (tries + 1)).then(function () {
        return get(params, tries + 1);
      });
    });
}
/* אחת אחרי השנייה, לא במקביל */
function readAll() {
  var out = {},
    chain = Promise.resolve();
  Object.keys(TABS).forEach(function (k) {
    chain = chain.then(function () {
      return get({ read: TABS[k], key: key }).then(
        function (d) {
          if (!d || d.status !== "ok")
            throw new Error(
              'קריאת "' + TABS[k] + '" נכשלה: ' + ((d && d.message) || ""),
            );
          out[k] = d.rows || [];
          console.log(
            '  נקראה "' +
              TABS[k] +
              '": ' +
              Math.max(0, out[k].length - 1) +
              " שורות",
          );
        },
        function (e) {
          throw new Error(
            'קריאת "' + TABS[k] + '": ' + ((e && e.message) || e),
          );
        },
      );
    });
  });
  return chain.then(function () {
    return out;
  });
}
function sleep(ms) {
  return new Promise(function (ok) {
    setTimeout(ok, ms);
  });
}
function report(S) {
  var r = S.res,
    items = 0,
    orph = [];
  r.report.forEach(function (d) {
    items += d.items.length;
    ["own", "q", "deck"].forEach(function (k) {
      d.orph[k].forEach(function (n) {
        orph.push(d.mas + " " + d.daf + " · " + TABS[k] + " · " + n);
      });
    });
  });
  console.log(
    "דפים: " +
      r.report.length +
      " · קטעים: " +
      items +
      " · עמודים שיקבלו מזהים: " +
      r.changedPages,
  );
  r.report.forEach(function (d) {
    console.log(
      "  " +
        d.mas +
        " " +
        d.daf +
        " · " +
        d.groups +
        " קטעים · פירוש:" +
        (d.was.own || "-") +
        " שאלות:" +
        (d.was.q || "-") +
        " מצגת:" +
        (d.was.deck || "-"),
    );
  });
  if (orph.length)
    console.log(
      "מספרים בלי קטע (יעברו ל-__orph, לא יימחקו): " + orph.join(" | "),
    );
  Object.keys(TABS).forEach(function (k) {
    console.log(
      (S.todo[k] ? "◻ " : "✓ ") +
        TABS[k] +
        (S.todo[k] ? " - ממתינה" : " - מוסבת"),
    );
  });
  if (S.bad) console.log('✗ ללשונית "' + S.bad + '" אין שורת כותרת');
}

function waitStep(rid, tries) {
  return sleep(4000)
    .then(function () {
      return get({ sidStep: 1, key: key }).catch(function () {
        return null;
      });
    })
    .then(function (d) {
      if (d && d.sid && d.sid.rid === rid) return d.sid;
      if (tries < 60) return waitStep(rid, tries + 1);
      throw new Error(
        "לא התקבלה תשובה מהסקריפט תוך 4 דקות. להריץ check - הוא יראה מה נכתב.",
      );
    });
}

get({ sidStep: 1, key: key })
  .then(function (v) {
    if (!v || v.status === "denied") throw new Error("הסקריפט דחה את הסיסמה.");
    if (!(+v.version >= ctx.SID_VER))
      throw new Error("הסקריפט בגרסה " + v.version + ", צריך " + ctx.SID_VER);
    console.log("הסקריפט: גרסה " + v.version);
    return readAll();
  })
  .then(function (t) {
    var S = ctx.sidState_(t);
    console.log("--- לפני ---");
    report(S);
    if (mode === "check") {
      console.log("קריאה בלבד. לא נכתב דבר.");
      return;
    }
    if (S.bad) throw new Error("לא נכתב דבר.");
    var k = S.next;
    if (!k) {
      console.log("✓ ארבע הלשוניות כבר מוסבות. לא נכתב דבר.");
      return;
    }
    var name = TABS[k],
      plan = S.plan[k];
    var rid = "gh" + Date.now() + Math.floor(Math.random() * 1000);
    console.log('--- מסב את "' + name + '" ---');
    var body = JSON.stringify({
      action: "sidStep",
      rid: rid,
      key: key,
      tab: name,
      head: JSON.stringify(ctx.sidHead_(k, t[k])),
      base: JSON.stringify(t[k]),
      plan: JSON.stringify(plan),
    });
    return fetch(URL_, {
      method: "POST",
      body: body,
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    })
      .catch(function () {})
      .then(function () {
        return waitStep(rid, 0);
      })
      .then(function (res) {
        console.log(
          "תשובת הסקריפט: " +
            res.status +
            (res.message ? " · " + res.message : "") +
            (res.back ? " · " + res.back : ""),
        );
        if (res.status !== "ok") throw new Error('"' + name + '" לא הוסבה.');
        console.log(
          'גיבוי: "' +
            res.backup +
            '"' +
            (res.aside ? ' · גיבוי ישן הועבר ל"' + res.aside + '"' : "") +
            (res.already
              ? " · כבר הייתה מוסבת"
              : " · תאים: " + res.cells + " · שורות שנוספו: " + res.added),
        );
        /* אימות שני, מכאן: קוראים שוב ומשווים לתוכנית */
        return readAll().then(function (t2) {
          var w = Math.max(ctx.sidWidth_(plan), ctx.sidWidth_(t2[k]));
          if (ctx.sidFlat_(t2[k].slice(1), w) !== ctx.sidFlat_(plan, w))
            throw new Error(
              'הסקריפט דיווח שנכתב, אבל "' + name + '" אינה זהה לתוכנית.',
            );
          console.log('✓ "' + name + '" נקראה שוב וזהה לתוכנית.');
          console.log("--- אחרי ---");
          report(ctx.sidState_(t2));
        });
      });
  })
  .catch(function (e) {
    console.error("✗ " + ((e && e.message) || e));
    process.exit(1);
  });
