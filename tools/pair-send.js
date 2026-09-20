/* ============================================================
   הלימוד המשותף — ההתראה שיוצאת להורה.
   ============================================================
   הבן סימן "למדנו ביחד", והשורה נכתבה בלשונית "זוגות". מכאן
   יוצאת הודעה קצרה להורה: "יוסי סימן שלמדתם יחד את דף ב׳.
   אתם בהגרלה."

   **היא אינה שער ואינה אישור שצריך לתת.** ההגרלה נרשמה כבר
   ברגע שהבן סימן, וההתראה הזו אינה משנה דבר בנתונים. היא
   שם לשני דברים:

     · הרגע הנחמד. אבא מקבל בשורה טובה במקום עוד התראה של
       אפליקציה.
     · והאדם השני בלולאה. ילד שיסמן שקר יודע שאבא יראה את
       זה — וזו כל היושרה שנדרשת כאן. מנגנון שימנע את זה
       טכנית יעלה בחיכוך לכל המשפחות הישרות ויחסום בודדים,
       בעוד שמי שרוצה לרמות כבר יכול לדפדף בדף האינטראקטיבי
       ולסמן.

   ------------------------------------------------------------
   ובשני הכיוונים

   למדו מהמכשיר של אבא? אבא מסמן, וההודעה יוצאת לבן. הקובץ
   הזה אינו יודע מי מהם דיווח ואינו צריך לדעת: הוא שולח
   ל"שותף" שבשורה, ועמודת "דיווח" רק בוחרת את הנוסח.

   ------------------------------------------------------------
   איך הצד השני נמצא

   מי שמדווח אינו יודע את המזהה של השני — כל אחד נרשם במכשיר
   שלו, עם מזהה משלו. מה שמחבר ביניהם הוא **הטלפון**: הוא
   נמסר בהרשמה (חובה, מאז שהוא מה שמחבר), והשני נרשם איתו.
   לכן: טלפון → שורה ב"לומדים" → מזהה → מנוי ב"התראות".

   מי שהצד השני שלו לא התקין — ההודעה פשוט אינה יוצאת. השורה
   נשארת בגיליון, ההגרלה תקפה, והריצה הבאה תנסה שוב. אין
   כאן מה להפסיד.

   ------------------------------------------------------------
   רץ ב-GitHub Actions בלבד, כמו כל שליחה: חתימת VAPID דורשת
   מפתח פרטי, והוא בסודות הריפו. לשונית "נשלחו" מונעת כפילות.
   ============================================================ */
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var webpush = require('web-push');

var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var priv = process.env.VAPID_PRIVATE || '';
var key  = process.env.READ_KEY || '';
var DRY  = /^(1|true|yes)$/i.test(String(process.env.DRY_RUN || ''));

if (!priv && !DRY) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }

var S = require('./sched.js');

/* הנוסח מגיע מ-data.js — כלומר אחיאסף עורך גם את ההתראה הזו
   מהניהול, ככל נוסח אחר בתוכנית. */
var T = (function () {
  var c = {}; c.window = c; vm.createContext(c);
  vm.runInContext(fs.readFileSync(
    path.join(path.dirname(__dirname), 'data.js'), 'utf8'), c);
  return c.PAIR || {};
})();
function fill(s, v) {
  return String(s == null ? '' : s).replace(/\{(\w+)\}/g, function (m, k) {
    return v[k] == null ? m : v[k];
  });
}

/* ---------- הטלפון כמפתח ----------
   מספר עם מקף, עם רווח או עם קידומת בינלאומית הוא אותו מספר.
   תשע הספרות האחרונות הן מה שמשווים. */
function phoneKey(p) {
  var d = String(p == null ? '' : p).replace(/[^0-9]/g, '');
  return d.length >= 9 ? d.slice(-9) : '';
}

function keyOf(o) {
  return 'pr|' + o['מזהה'] + '|' + o['מסלול'] + '|' + o['שבוע'];
}

/* ---------- ובשבת לא שולחים ----------
   אלה הודעות שמחה ולא תזכורות, ואין בהן שום דחיפות. מה
   שנדחה למוצאי שבת יוצא במוצאי שבת. */
function shabbat(now) {
  if (now.day === 6) return now.hour < 20;
  return now.day === 5 && now.hour >= 12;
}

Promise.all([S.rows('זוגות', key), S.rows('לומדים', key),
             S.rows('התראות', key), S.sentLoad(key)])
  .then(function (r) {
    var pairs = S.byHead(r[0]), who = S.byHead(r[1]), subs = S.byHead(r[2]);
    var sent = r[3];
    var now = S.israelNow();

    if (shabbat(now)) { console.log('שבת — לא נשלח דבר.'); return []; }

    var due = pairs.filter(function (o) {
      return o['מזהה'] && o['מסלול'] && o['שבוע'] && !sent[keyOf(o)];
    });
    /* "במידה וטרם אישר" — שורה שההורה כבר אישר אינה מזמינה
       אותו לאשר שוב. */
    due = due.filter(function (o) {
      return !(o['דיווח'] !== 'ההורה' && o['אושר'] === 'כן');
    });
    if (!due.length) { console.log('אין לימוד משותף שממתין להודעה.'); return []; }

    /* טלפון → מזהה. השורה האחרונה גוברת: מי שנרשם מחדש. */
    var byPhone = {};
    who.forEach(function (x) {
      var k = phoneKey(x['טלפון']);
      if (k && x['מזהה']) byPhone[k] = x['מזהה'];
    });
    /* והמנוי האחרון לכל מזהה — מי שהתקין מחדש רשם שורה נוספת,
       והישנה כבר אינה תקפה. */
    var last = {};
    subs.forEach(function (x) {
      if (x['מזהה'] && x['מנוי']) last[x['מזהה']] = x['מנוי'];
    });

    if (!DRY) webpush.setVapidDetails(SUBJECT, PUBLIC, priv);
    var done = [];
    /* בזה אחר זה, ולא במקביל: הרישום נכתב לפי מה שבאמת יצא. */
    return due.reduce(function (chain, o) {
      return chain.then(function (res) {
        var name = (o['שם'] || '').split(' ')[0] || o['שם'] || '';
        var daf  = o['דף'] ? 'דף ' + o['דף'] : '';
        var pk = phoneKey(o['טלפון השותף']);
        var pid = pk && byPhone[pk];
        if (!pid) {
          console.log('  · ' + name + ' — הצד השני עדיין לא נרשם, ממתין');
          res.push(0); return res;
        }
        var raw = last[pid];
        if (!raw) {
          console.log('  · ' + name + ' — הצד השני נרשם ולא התקין, ממתין');
          res.push(0); return res;
        }
        var sub;
        try { sub = JSON.parse(raw); }
        catch (e) {
          console.log('  ! מנוי פגום למזהה ' + pid);
          res.push(0); return res;
        }
        /* ============================================================
           שתי הודעות שונות, ולא אחת.
           ============================================================
           ההורה דיווח → ההודעה הולכת לבן, והיא הבשורה עצמה:
           "נכנסת להגרלה".

           הבן דיווח → ההודעה הולכת להורה, והיא מזמינה אותו
           לאשר. הכתובת נושאת את מי דיווח ועל איזה שבוע, ולכן
           הלחיצה פותחת את מסך האישור ולא סתם את האפליקציה.

           **וההורה אינו בהגרלה — הבן הוא שבהגרלה.** שתי
           ההודעות אומרות את זה.
           ============================================================ */
        var byParent = (o['דיווח'] === 'ההורה');
        var body = fill(byParent ? T.pushKidB : T.pushB,
                        { name: name, daf: daf });
        /* `join` ולא `./`: זה העמוד שההורה והבן מתקינים, והוא
           מה שנפתח מהאייקון שלהם. */
        var link = byParent ? './join'
          : './join?pr=' + encodeURIComponent(
              o['מזהה'] + '|' + o['מסלול'] + '|' + o['שבוע']);
        if (DRY) {
          console.log('  · ' + name + ' → ' + pid + ' | ' + body);
          res.push(1); return res;
        }
        return webpush.sendNotification(sub,
          JSON.stringify({ title: T.pushT || '', body: body,
                           url: link, tag: 'pair' }), { TTL: 86400 })
          .then(function (x) {
            console.log('  ✓ ' + name + ' → ' + x.statusCode + ' | ' + body);
            done.push(keyOf(o));
            res.push(1); return res;
          })
          .catch(function (e) {
            console.log('  ✗ ' + name + ' → ' + (e.statusCode || '') + ' ' +
                        String(e.body || e.message || '').slice(0, 120));
            res.push(0); return res;
          });
      });
    }, Promise.resolve([])).then(function (res) {
      /* רק מה שבאמת יצא נרשם. מה שלא — ינסה שוב בהרצה הבאה,
         וזה בדיוק הרצוי: אבא שיתקין מחר יקבל את ההודעה מחר. */
      return S.sentMark(done).then(function () { return res; });
    });
  })
  .then(function (res) {
    if (!res || !res.length) return;
    var ok = res.reduce(function (x, y) { return x + y; }, 0);
    console.log('\nיצאו: ' + ok + ' · ממתינים: ' + (res.length - ok));
  })
  ['catch'](function (e) {
    console.error('נכשל: ' + (e && e.message || e));
    process.exit(1);
  });
