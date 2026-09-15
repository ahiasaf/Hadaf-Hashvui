/* כל נוסח שבקוד חייב להיות ניתן לעריכה בניהול.
   ============================================================
   `TEXT_FIELDS` נכתב ביד, ולכן כל נוסח שנוסף ל-data.js ולא
   נוספה לו שורה שם פשוט לא היה קיים בניהול — לא לעריכה, לא
   לפרסום ולא לסימון על המסך. אחיאסף גילה את זה מסך אחרי מסך,
   וכל תיקון ניסוח קטן חייב לעבור דרך מתכנת.

   `textedit.js` כבר דואג שלא ייעלם כלום: מה שאין לו שורה מקבל
   שורה אוטומטית. הבדיקה כאן היא השלב הבא — היא מונה כמה
   מפתחות נשענים על הרשת הזו ועדיין אין להם תיאור בעברית,
   כלומר מופיעים בניהול בשם המפתח שבקוד. זו אזהרה ולא כישלון:
   הנוסח עובד, הוא רק לא נקרא יפה.

   `tools/preflight.py` קורא לקובץ הזה ומדפיס את התוצאה. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var ROOT = path.dirname(__dirname);

var ctx = { console: console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), ctx);

/* אותה רשימה בדיוק כמו ב-`roots()` שב-textedit.js. אם נוסף שם
   שורש חדש ולא כאן, הבדיקה תצעק שהיא אינה מכירה אותו. */
var ROOTS = { fit:'FIT', ui:'UI', sfarim:'SFARIM', rights:'RIGHTS', join:'JOIN',
              gate:'GATE', tour:'TOUR', a11y:'A11Y', info:'INFO',
              tzevet:'TZEVET', play:'PLAY', head:'HEAD_ASK', askui:'ASK_UI',
              headf:'HEAD_ASK_F', guide:'GUIDE' };
var NOTTEXT = /\.(id|tone|key|code|src|hi)$/;

var listed = {};
ctx.TEXT_FIELDS.forEach(function (f) { if (f.k) listed[f.k] = f; });

var all = [];
function walk(pre, o, depth) {
  if (!o || depth > 4) return;
  Object.keys(o).forEach(function (kk) {
    var v = o[kk], key = pre + '.' + kk;
    if (typeof v === 'string') { if (!NOTTEXT.test(key)) all.push(key); }
    else if (v && typeof v === 'object') walk(key, v, depth + 1);
  });
}
Object.keys(ROOTS).forEach(function (r) {
  if (!ctx[ROOTS[r]]) { console.log('MISSING-ROOT ' + r + ' (' + ROOTS[r] + ')'); return; }
  walk(r, ctx[ROOTS[r]], 1);
});

var noLabel = all.filter(function (k) { return !listed[k]; });
var ghost   = Object.keys(listed).filter(function (k) { return all.indexOf(k) < 0; });

console.log('TOTAL ' + all.length);
console.log('NOLABEL ' + noLabel.length + (noLabel.length ? ' ' + noLabel.join(' ') : ''));
console.log('GHOST ' + ghost.length + (ghost.length ? ' ' + ghost.join(' ') : ''));
