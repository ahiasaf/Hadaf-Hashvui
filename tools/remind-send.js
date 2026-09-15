/* ============================================================
   התזכורות של הרכז — לעצמו.
   ============================================================
   אחיאסף מנהל את המבצע כולו, והתזכורות שהוא צריך אינן קשורות
   לדף השבועי: "להתקשר לחדרה", "לשלוח לפלטי סיכום". הוא כותב
   אותן במסך השיחות, הן נשמרות בלשונית "תזכורות", והקובץ הזה
   דוחף אותן במועד.

   רץ ב-GitHub Actions בלבד, כמו כל שליחה: חתימת VAPID דורשת
   מפתח פרטי, והוא יושב בסודות הריפו.

   --- למה אין כאן סימון "נשלח" ---
   הקרון רץ בכל חצי שעה, והקוד מעגל את השעה הישראלית כלפי מטה
   לחצי שעה ומטפל במשבצת הזו בלבד. לתזכורת יש תאריך ושעה
   מדויקים, ולכן היא מתאימה למשבצת **אחת בדיוק** בכל ההיסטוריה
   — ואי אפשר לשלוח אותה פעמיים. סימון חוזר לגיליון היה מוסיף
   כתיבה שאפשר להסתדר בלעדיה, ובדרך גם עוד נקודת כשל.

   --- ומה קורה לתזכורת שהמועד שלה עבר ---
   כלום. היא נשארת ברשימה עד שהוא מסיר אותה. הרצה שאיחרה מעבר
   לחצי שעה מפספסת — ופספוס עדיף על כפילות, כמו בכל השאר.
   ============================================================ */
var webpush = require('web-push');
var fs = require('fs');
var path = require('path');

var ROOT = path.dirname(__dirname);
var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var priv = process.env.VAPID_PRIVATE || '';
var key  = process.env.READ_KEY || '';
var DRY  = /^(1|true|yes)$/i.test(String(process.env.DRY_RUN || ''));
/* לבדיקה: כופה תאריך ושעה (YYYY-MM-DD HH:MM) במקום השעון. */
var FORCE = String(process.env.FORCE_WHEN || '').trim();

if (!priv && !DRY) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }

/* השעון הישראלי. הקרון רץ ב-UTC ואינו יודע על שעון קיץ. */
function israelNow() {
  var f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit',
    hour12: false, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  var g = {};
  f.forEach(function (p) { g[p.type] = p.value; });
  return {
    date: g.year + '-' + g.month + '-' + g.day,
    t: g.hour + ':' + (parseInt(g.minute, 10) < 30 ? '00' : '30')
  };
}

function scriptUrl() {
  var src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}
function ask(params) {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + q + '&t=' + Date.now())
    .then(function (r) { return r.json(); });
}

/* קריאה שנכשלה אינה לשונית ריקה. כלל הברזל של הפרויקט: תשובה
   בלי `rows` היא כישלון, ואסור להסיק ממנה "אין תזכורות". */
function rows(tab) {
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

var now = FORCE
  ? { date: FORCE.split(' ')[0], t: FORCE.split(' ')[1] || '' }
  : israelNow();
console.log('משבצת: ' + now.date + ' ' + now.t + (DRY ? ' · הרצה יבשה' : ''));

Promise.all([rows('תזכורות'), rows('התראות')]).then(function (both) {
  var rem = byHead(both[0]), subs = byHead(both[1]);

  var due = rem.filter(function (o) {
    return o['תאריך'] === now.date && o['שעה'] === now.t && o['נוסח'];
  });
  if (!due.length) { console.log('אין תזכורת למשבצת הזו.'); return []; }

  /* המנוי האחרון לכל מזהה. מי שהתקין מחדש רשם שורה נוספת,
     והישנה כבר אינה תקפה. */
  var last = {};
  subs.forEach(function (s) {
    if (s['מזהה'] && s['מנוי']) last[s['מזהה']] = s['מנוי'];
  });

  if (!DRY) webpush.setVapidDetails(SUBJECT, PUBLIC, priv);
  return Promise.all(due.map(function (o) {
    var raw = last[o['מזהה']];
    if (!raw) { console.log('  ! אין מנוי למזהה ' + o['מזהה'] + ' — מדלג'); return 0; }
    var sub;
    try { sub = JSON.parse(raw); }
    catch (e) { console.log('  ! מנוי פגום למזהה ' + o['מזהה']); return 0; }

    if (DRY) { console.log('  · ' + o['שעה'] + ' | ' + o['נוסח']); return 1; }
    /* הלחיצה פותחת את מסך השיחות — שם הוא ממילא עומד לפעול. */
    return webpush.sendNotification(sub,
      JSON.stringify({ title: 'תזכורת', body: o['נוסח'],
                       url: './#admin', tag: 'remind' }), { TTL: 3600 })
      .then(function (r) {
        console.log('  ✓ ' + o['שעה'] + ' → ' + r.statusCode + ' | ' + o['נוסח']);
        return 1;
      })
      .catch(function (e) {
        console.log('  ✗ ' + o['שעה'] + ' → ' + (e.statusCode || '') + ' ' +
                    String(e.body || e.message || '').slice(0, 120));
        return 0;
      });
  }));
}).then(function (res) {
  if (!res || !res.length) return;
  var ok = res.reduce(function (a, b) { return a + b; }, 0);
  console.log('\nיצאו: ' + ok + ' · נכשלו: ' + (res.length - ok));
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
