/* ============================================================
   דיווח לסקריפט: איך נגמרה שליחה (`?sayDone=`).
   ============================================================
   נקרא מ-push-send.js בסוף כל הרצה, ומשלב ה-failure ב-workflow
   (`node tools/push-report.js crash`) — למקרה שההרצה נפלה עוד
   לפני שהקוד רץ (התקנה שנכשלה וכדומה).

   בלי שמות ובלי תוכן בלוג: רק המזהה והמספרים. */
var fs = require('fs');

function scriptUrl() {
  var src = fs.readFileSync(__dirname + '/../data.js', 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*\n?\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

/* f: { n, bad, gone, prev, det, why, none, run }
   prev = מכשירים שכבר קיבלו את ההודעה בהרצה קודמת (ולכן דולגו).
   det  = הסיבה המדויקת לכישלון מכשירים ("שגיאה 500 ×2").
   **רק status=ok הוא דיווח שהגיע.** תשובת HTTP כלשהי (דף שגיאה של
   גוגל, סירוב) אינה ראיה. הדיווח הסופי הוא מה שמפעיל את ההתרעה
   לרכז — ולכן עד שישה ניסיונות, בהמתנה גדלה (כשתי דקות וחצי), כדי
   שתקלה רגעית של גוגל לא תבלע גם אותו. "בשליחה" — שלושה מספיקים. */
function report(f) {
  var sid = String(process.env.SID || '').trim();
  var key = process.env.READ_KEY || '';
  var url = scriptUrl();
  if (!sid || !key || !url) return Promise.resolve(false);
  var q = url + '?sayDone=' + encodeURIComponent(sid) + '&key=' + encodeURIComponent(key);
  if (f.n != null)  q += '&n=' + f.n;
  if (f.bad != null) q += '&bad=' + f.bad;
  if (f.gone != null) q += '&gone=' + f.gone;
  if (f.prev) q += '&prev=' + f.prev;
  if (f.det) q += '&det=' + encodeURIComponent(String(f.det).slice(0, 120));
  if (f.none) q += '&none=1';
  if (f.run) q += '&run=1';
  if (f.why) q += '&why=' + encodeURIComponent(String(f.why).slice(0, 300));
  var once = function () {
    var ac = typeof AbortController === 'function' ? new AbortController() : null;
    var t = ac ? setTimeout(function () { ac.abort(); }, 15000) : null;
    return fetch(q, ac ? { signal: ac.signal } : {}).then(function (r) { return r.text(); })
      .then(function (txt) {
        if (t) clearTimeout(t);
        var j = null; try { j = JSON.parse(txt); } catch (e) {}
        if (!j || j.status !== 'ok') throw new Error('הדיווח לא התקבל');
        return true;
      });
  };
  var max = f.run ? 3 : 6;
  var go = function (n) {
    return once()['catch'](function (e) {
      if (n >= max) { console.log('  ! הדיווח לסקריפט לא הגיע: ' + (e.message || e)); return false; }
      return new Promise(function (ok) { setTimeout(ok, 5000 * Math.pow(2, n - 1)); }).then(function () { return go(n + 1); });
    });
  };
  return go(1);
}
module.exports = { report: report };

/* דיווח "לא נשלח, ולמה" מהרצה שעצרה בכוונה (digest-send.js). */
if (require.main === module && process.argv[2] === 'why') {
  report({ why: String(process.argv[3] || '') }).then(function () { process.exit(0); });
}
if (require.main === module && process.argv[2] === 'crash') {
  report({ why: 'ההרצה ב-GitHub נפלה' }).then(function () { process.exit(0); });
}
