/* ============================================================
   השעון של השליחות המתוזמנות — ומה שמונע כפילות.
   ============================================================
   "רשמתי לעצמי תזכורות ולא הגיעה לי התראה."

   הסיבה אינה במערכת ההתראות. היא בשעון.

   שתי השליחות המתוזמנות עוגלו לחצי שעה וטיפלו **במשבצת אחת
   בדיוק** — זו שבה ההרצה נפלה. ההיגיון היה נכון כל עוד הקרון
   רץ כל חצי שעה; אלא שהקרון של GitHub הוא מאמץ סביר ולא
   הבטחה, והמציאות ביומן ההרצות היא כשש הרצות ביממה במקום
   ארבעים ושמונה. כלומר תשע מכל עשר משבצות לא טופלו מעולם,
   וכל תזכורת שנפלה באחת מהן פשוט לא יצאה.

   ------------------------------------------------------------
   מה שהשתנה

   כל הרצה מטפלת עכשיו **בכל המשבצות שנפספסו** מאז, ולא רק
   בזו שהיא עומדת בה. תזכורת ל-9:00 שההרצה שלה לא קרתה תצא
   בהרצה הבאה — באיחור, ועם השעה המקורית כתובה בה, אבל תצא.

   וכדי שזה לא ייצור כפילות — שהיא הסיבה שנבחר המודל הישן —
   כל שליחה שיוצאת נרשמת בלשונית "נשלחו", וכל הרצה מדלגת על
   מה שכבר רשום שם. אין כאן הימור על תזמון: יש רישום.

   ------------------------------------------------------------
   ולמה רק מהיום

   תזכורת של אתמול אינה תזכורת, והיא גם לא נשלחת. החלון נעצר
   בחצות של היום הישראלי, ולכל היותר `HOURS` שעות אחורה.
   פספוס עדיין עדיף על הודעה שאין לה מובן.
   ============================================================ */
var fs = require('fs');
var path = require('path');

var ROOT = path.dirname(__dirname);
var HOURS = 14;              /* כמה אחורה מותר להשלים */
var SENT_TAB = 'נשלחו';

/* ---------- השעון הישראלי ----------
   הקרון רץ ב-UTC ואינו יודע על שעון קיץ, ולכן השעה הישראלית
   מחושבת כאן ולא בלוח הזמנים. */
function israelNow(when) {
  var f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit',
    weekday: 'short', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(when || new Date());
  var g = {};
  f.forEach(function (p) { g[p.type] = p.value; });
  var days = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return {
    date: g.year + '-' + g.month + '-' + g.day,
    day:  days[g.weekday],
    hour: parseInt(g.hour, 10),
    min:  parseInt(g.minute, 10)
  };
}

function two(n) { return (n < 10 ? '0' : '') + n; }

/* ============================================================
   כל המשבצות שצריך לטפל בהן עכשיו.
   ============================================================
   מהמשבצת הנוכחית אחורה, עד גבול החלון או עד חצות — הישנה
   ביותר ראשונה, כדי שתזכורות יֵצאו בסדר שבו נכתבו.

   `now` הוא תוצאת `israelNow`. מוחזר מערך של
   `{ date, day, t }`, כשכולן באותו יום ישראלי.
   ============================================================ */
function slotsDue(now, hours) {
  var back = hours == null ? HOURS : hours;
  var cur = now.hour * 60 + (now.min < 30 ? 0 : 30);
  var out = [];
  for (var m = cur; m >= 0; m -= 30) {
    if ((cur - m) > back * 60) break;
    out.push({ date: now.date, day: now.day,
               t: two(Math.floor(m / 60)) + ':' + two(m % 60) });
  }
  return out.reverse();
}

/* ---------- הגשר לגיליון ---------- */
function scriptUrl() {
  var src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

/* ============================================================
   קריאה שמנסה שוב.
   ============================================================
   ב-16.9 נפלה הרצה על `Unexpected token '<'` — הסקריפט החזיר
   דף HTML במקום JSON. זה קורה לגוגל מדי פעם, וזה הפיל את כל
   הצעד ולא רק את הקריאה הבודדת. שני ניסיונות נוספים, ואם גם
   הם חוזרים עם HTML — נאמר מה באמת חזר, ולא "לא תקין".

   ב-22.9 קרה שוב, כמה פעמים באותו יום, ושלושה ניסיונות לא
   הספיקו: כל ניסיון עצמו נמשך כחצי דקה, כלומר גוגל היה תקוע
   על ה-HTML הזה במשך יותר משתי דקות ברצף, לא רגע חולף אחד.
   חמישה ניסיונות, פרוסים על פני כארבע דקות, נותנים לתקלה כזו
   סיכוי אמיתי לחלוף לפני שהצעד נכשל — ובלי לפגוע בהרצה
   הרגילה, שאינה נוגעת בהמתנה הזו כלל.
   ============================================================ */
function ask(params, tries) {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var left = tries == null ? 5 : tries;
  var go = function (n) {
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + q + '&t=' + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var t = String(txt || '').trim();
        if (t.charAt(0) === '{' || t.charAt(0) === '[') return JSON.parse(t);
        throw new Error('הסקריפט החזיר ' + (/^<!DOCTYPE|^<html/i.test(t)
          ? 'דף HTML ולא JSON' : 'תשובה שאינה JSON') +
          ' (' + t.slice(0, 60).replace(/\s+/g, ' ') + '…)');
      })
      .catch(function (e) {
        if (n <= 1) throw e;
        /* המתנה קצרה וגדלה — תקלה חולפת של גוגל חולפת. */
        return new Promise(function (ok) { setTimeout(ok, (6 - n) * 3000); })
          .then(function () { return go(n - 1); });
      });
  };
  return go(left);
}

/* קריאה שנכשלה אינה לשונית ריקה. כלל הברזל של הפרויקט:
   תשובה בלי `rows` היא כישלון, ואסור להסיק ממנה "אין שורות". */
function rows(tab, key) {
  return ask({ read: tab, key: key }).then(function (j) {
    if (!j || j.status !== 'ok' || !j.rows) {
      throw new Error('לשונית "' + tab + '" לא נענתה: ' +
                      ((j && j.message) || 'תשובה בלי שורות'));
    }
    return j.rows;
  });
}
function byHead(r) {
  if (!r || r.length < 2) return [];
  var h = r[0], ix = {}, i;
  for (i = 0; i < h.length; i++) ix[String(h[i]).trim()] = i;
  return r.slice(1).map(function (row) {
    var o = {};
    for (var k in ix) o[k] = String(row[ix[k]] == null ? '' : row[ix[k]]).trim();
    return o;
  });
}

/* ============================================================
   מה שכבר יצא.
   ============================================================
   לשונית "נשלחו": מפתח אחד לכל שליחה שהצליחה. היא מה שמחליף
   את ההימור על התזמון — ולכן קריאה שנכשלת אינה "עוד לא נשלח
   כלום", אלא סיבה לא לשלוח כלום בהרצה הזו. שליחה כפולה לכל
   הצוות גרועה מהרצה שדילגה.

   לשונית שעדיין לא נוצרה היא המקרה היחיד שבו ריק הוא אמת:
   הסקריפט מחזיר עליה `rows` ריק, ולא שגיאה.
   ============================================================ */
function sentLoad(key) {
  return rows(SENT_TAB, key).then(function (r) {
    var seen = {};
    byHead(r).forEach(function (o) { if (o['מפתח']) seen[o['מפתח']] = 1; });
    return seen;
  });
}

/* רישום מה שיצא. כתיבה אמיתית ולא `no-cors` — כאן אנחנו
   ב-Node, התשובה נקראת, וכישלון נאמר. */
function sentMark(keys) {
  if (!keys.length) return Promise.resolve(0);
  var url = scriptUrl();
  var stamp = new Date().toISOString();
  var one = function (k) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action:'row', tab:SENT_TAB,
        cols: JSON.stringify([['מפתח', k], ['מתי', stamp]]) })
    }).then(function (r) { return r.text(); })
      .then(function (t) {
        /* `appendCols_` עונה "success", ומסלולים אחרים "ok".
           שניהם הצלחה; כל השאר אינו. */
        var ok = /"status"\s*:\s*"(success|ok)"/.test(String(t));
        if (!ok) throw new Error(String(t).slice(0, 80).replace(/\s+/g, ' '));
        return 1;
      });
  };
  /* בזה אחר זה: הסקריפט כותב לגיליון אחד, וכתיבות מקבילות
     אליו נדחפות זו על זו. */
  return keys.reduce(function (chain, k) {
    return chain.then(function (n) {
      return one(k).then(function () { return n + 1; })
        .catch(function (e) {
          /* **וזה נאמר בקול.** מפתח שלא נרשם פירושו שההודעה
             הזו תצא שוב בהרצה הבאה. */
          console.log('  ! לא נרשם ב"' + SENT_TAB + '": ' + k +
                      ' — ' + (e.message || e));
          return n;
        });
    });
  }, Promise.resolve(0));
}

module.exports = { israelNow: israelNow, slotsDue: slotsDue, two: two,
                   ask: ask, rows: rows, byHead: byHead,
                   sentLoad: sentLoad, sentMark: sentMark,
                   SENT_TAB: SENT_TAB, HOURS: HOURS, scriptUrl: scriptUrl };
