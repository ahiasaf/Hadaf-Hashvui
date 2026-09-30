/* ============================================================
   מסירה של התראה אחת, בזהירות — משותף לכל השולחים.
   ============================================================
   · **זמן קצוב** לכל ניסיון (15 שניות). שירות התראות שנתקע אינו
     תוקע את כל ההרצה.
   · **ניסיון חוזר** רק למה שעשוי לעבור: 429, 5xx ותקלת רשת — עד
     שלושה ניסיונות, לפי Retry-After אם נשלח, אחרת המתנה גדלה עם
     רעש אקראי (שלא כל ההרצות יחזרו באותה שנייה).
   · **404/410 = המנוי פג.** אין טעם לנסות שוב, ואין כאן מחיקה של
     שום דבר מהגיליון — מכשיר אחד שפג אינו אדם שעזב.
   · **מקביליות מוגבלת** (mapLimit) במקום Promise.all על כולם.

   deliver() לעולם אינו נכשל: הוא מחזיר { ok, code, gone, tries, err }.
   ============================================================ */
var TIMEOUT = 15000, TRIES = 3;

function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

function deliver(webpush, sub, payload, opts) {
  opts = opts || {};
  var go = function (n) {
    return webpush.sendNotification(sub, payload, { TTL: opts.TTL || 3600, timeout: TIMEOUT })
      .then(function (r) { return { ok: true, code: r && r.statusCode, tries: n }; },
        function (e) {
          var code = e && e.statusCode;
          if (code === 404 || code === 410) return { ok: false, code: code, gone: true, tries: n };
          var again = !code || code === 429 || code >= 500;
          if (!again || n >= TRIES) {
            return { ok: false, code: code, tries: n,
                     err: String((e && (e.body || e.message)) || e || '').slice(0, 120) };
          }
          var ra = e && e.headers && (e.headers['retry-after'] || e.headers['Retry-After']);
          var ms = ra && /^\d+$/.test(String(ra)) ? Math.min(30000, +ra * 1000)
                 : Math.min(20000, 1000 * Math.pow(2, n)) + Math.floor(Math.random() * 700);
          return wait(ms).then(function () { return go(n + 1); });
        });
  };
  return go(1);
}

/* כמו Promise.all(items.map(fn)), אבל לכל היותר `limit` בבת אחת,
   ובסדר המקורי של התוצאות. */
function mapLimit(items, limit, fn) {
  var out = new Array(items.length), i = 0;
  var worker = function () {
    if (i >= items.length) return Promise.resolve();
    var k = i++;
    return Promise.resolve(fn(items[k], k)).then(function (v) { out[k] = v; return worker(); });
  };
  var ws = [];
  for (var w = 0; w < Math.min(limit, items.length); w++) ws.push(worker());
  return Promise.all(ws).then(function () { return out; });
}

module.exports = { deliver: deliver, mapLimit: mapLimit };
