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

/* f: { n, bad, why, none } */
function report(f) {
  var sid = String(process.env.SID || '').trim();
  var key = process.env.READ_KEY || '';
  var url = scriptUrl();
  if (!sid || !key || !url) return Promise.resolve(false);
  var q = url + '?sayDone=' + encodeURIComponent(sid) + '&key=' + encodeURIComponent(key);
  if (f.n != null)  q += '&n=' + f.n;
  if (f.bad != null) q += '&bad=' + f.bad;
  if (f.none) q += '&none=1';
  if (f.why) q += '&why=' + encodeURIComponent(String(f.why).slice(0, 180));
  return fetch(q).then(function () { return true; })['catch'](function () { return false; });
}
module.exports = { report: report };

if (require.main === module && process.argv[2] === 'crash') {
  report({ why: 'ההרצה ב-GitHub נפלה' }).then(function () { process.exit(0); });
}
