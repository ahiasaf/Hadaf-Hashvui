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
   ומנוי שפג

   שירות ההתראות עונה 410: המכשיר הסיר את ההרשאה או את
   האפליקציה. לנסות שוב על אותו מנוי זה לנסות לנצח — ב-1.10
   אותם 12 נמענים "נכשלו" כל חצי שעה, וכל הרצה כתבה שורה
   ביומן ההודעות ושתי שורות לכל אחד ב"נשלחו".

   לכן נרשם "פג:" ואחריו טביעה של המנוי, וההרצה הבאה מדלגת
   **כל עוד זה אותו מנוי**. מי שיתקין מחדש ירשום מנוי חדש,
   הטביעה תהיה אחרת, וההודעה תצא אליו מעצמה.

   ------------------------------------------------------------
   רץ ב-GitHub Actions בלבד, כמו כל שליחה: חתימת VAPID דורשת
   מפתח פרטי, והוא בסודות הריפו. לשונית "נשלחו" מונעת כפילות.
   ============================================================ */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
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
/* מסירה בזהירות (זמן קצוב, ניסיון חוזר) — ראו push-deliver.js.
   נכשל כשהמסירה נכשלה, כדי ש-S.once ירשום "נכשל". */
var D = require('./push-deliver.js');
function pushOne(sub, payload, ttl) {
  return D.deliver(webpush, sub, payload, { TTL: ttl }).then(function (r) {
    if (r.ok) return { statusCode: r.code };
    throw { statusCode: r.code, body: r.gone ? 'המנוי פג' : r.err, gone: !!r.gone };
  });
}

/* טביעה קצרה של מנוי — כדי לדעת אם "פג" נאמר על המנוי הזה או
   על אחד קודם. לא המנוי עצמו: "נשלחו" אינה המקום לשמור אותו. */
var GONE = 'פג:';
function subPrint(sub) {
  return crypto.createHash('sha1').update(String(sub && sub.endpoint || ''))
    .digest('hex').slice(0, 12);
}

/* ============================================================
   יומן ההודעות — רק כשמשהו השתנה.
   ============================================================
   מה שנכשל נשאר "נכשל" ומנסים שוב בכל הרצה; אם אותם נכשלים
   נכשלים שוב, אין כאן חדשות. הרשימה שלהם נשמרת כטביעה ב"נשלחו"
   תחת המפתח הזה, ושורה ביומן נכתבת רק כשמשהו יצא, כשמנוי נמצא
   פג לראשונה, או כשרשימת הנכשלים אינה זו של ההרצה הקודמת. */
var LOG_KEY = 'pr|יומן';

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

var st = {}, FAILED = [];
Promise.all([S.rows('זוגות', key), S.rows('לומדים', key),
             S.rows('התראות', key), S.sentRaw(key)])
  .then(function (r) {
    var pairs = S.byHead(r[0]), who = S.byHead(r[1]), subs = S.byHead(r[2]);
    /* "נכשל" ו"פג:…" — עוד לא יצא. כל השאר נחשב יצא, כמו
       ב-sentLoad. "פג" נבדק מול המנוי הנוכחי בהמשך. */
    st = r[3];
    var sent = {};
    for (var k in st) {
      if (st[k] !== 'נכשל' && st[k].indexOf(GONE) !== 0) sent[k] = 1;
    }
    var now = S.israelNow();

    /* null ולא []: שבת אינה "אין נכשלים", והטביעה ביומן נשארת. */
    if (shabbat(now)) { console.log('שבת — לא נשלח דבר.'); return null; }

    var due = pairs.filter(function (o) {
      return o['מזהה'] && o['מסלול'] && o['שבוע'] && !sent[keyOf(o)];
    });
    /* "במידה וטרם אישר" — שורה שההורה כבר אישר אינה מזמינה
       אותו לאשר שוב. */
    due = due.filter(function (o) {
      return !(o['דיווח'] !== 'ההורה' && o['אושר'] === 'כן');
    });
    /* דיווח אחד — הודעה אחת, גם כשהשורה נכתבה פעמיים. האפליקציה
       שולחת שוב דיווח שלא אומת בכל פתיחה, ושתי שורות זהות יצאו
       כשתי הודעות באותה הרצה ("נשלחו" נקרא פעם אחת, בתחילתה). */
    var once1 = {};
    due = due.filter(function (o) {
      if (once1[keyOf(o)]) return false;
      once1[keyOf(o)] = 1; return true;
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
    /* בזה אחר זה, ולא במקביל: הרישום נכתב לפי מה שבאמת יצא. */
    return due.reduce(function (chain, o) {
      return chain.then(function (res) {
        var name = (o['שם'] || '').split(' ')[0] || o['שם'] || '';
        var daf  = o['דף'] ? 'דף ' + o['דף'] : '';
        var pk = phoneKey(o['טלפון השותף']);
        var pid = pk && byPhone[pk];
        if (!pid) {
          console.log('  · #' + (res.length + 1) + ' — הצד השני עדיין לא נרשם, ממתין');
          res.push(0); return res;
        }
        var raw = last[pid];
        if (!raw) {
          console.log('  · #' + (res.length + 1) + ' — הצד השני נרשם ולא התקין, ממתין');
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
        /* אותו מנוי שכבר נמצא פג — אין טעם לנסות. מנוי חדש לאותו
           אדם נותן טביעה אחרת, ואז שולחים. */
        var fp = subPrint(sub);
        if (st[keyOf(o)] === GONE + fp) {
          console.log('  · #' + (res.length + 1) + ' — המנוי פג ולא חודש, מדלג');
          res.push(3); return res;
        }
        if (DRY) {
          console.log('  · #' + (res.length + 1) + ' → ' + pid);
          res.push(1); return res;
        }
        return S.once(keyOf(o), function () {
          return pushOne(sub, JSON.stringify({ title: T.pushT || '', body: body,
                                               url: link, tag: 'pair' }), 86400);
        }, function (e) { return e && e.gone ? GONE + fp : 'נכשל'; })
          .then(function (x) {
            if (x && x.skipped) { res.push(0); return res; }
            /* בלי שמות בלוג: יומני ההרצה של ריפו ציבורי גלויים לכל. */
            console.log('  ✓ #' + (res.length + 1) + ' → ' + x.statusCode);
            res.push(1); return res;
          })
          .catch(function (e) {
            console.log('  ✗ #' + (res.length + 1) + ' → ' + (e.statusCode || '') + ' ' +
                        String(e.body || e.message || '').slice(0, 120));
            if (e && e.gone) { res.push(4); return res; }
            FAILED.push(keyOf(o));
            res.push(2); return res;
          });
      });
    }, Promise.resolve([]));
  })
  .then(function (res) {
    /* מה שנכשל נרשם "נכשל" וינסה שוב בהרצה הבאה — אבא שיתקין מחר
       יקבל את ההודעה מחר. ראו once ב-sched.js. */
    S.finish();
    if (res == null) return;
    /* 1 = יצא · 2 = נכשל · 0 = ממתין (הצד השני לא נרשם/לא התקין)
       4 = המנוי פג, נמצא עכשיו · 3 = המנוי פג קודם, דולג */
    var cnt = function (v) { return res.filter(function (x) { return x === v; }).length; };
    var ok = cnt(1), bad = cnt(2), goneNew = cnt(4), gone = goneNew + cnt(3);
    var wait = cnt(0);
    if (res.length) {
      console.log('\nיצאו: ' + ok + ' · נכשלו: ' + bad + ' · ממתינים: ' + wait +
                  ' · מנוי פג: ' + gone + (goneNew ? ' (חדשים: ' + goneNew + ')' : ''));
    }
    if (DRY) return;
    /* טביעת הנכשלים של ההרצה הזו, מול זו של הקודמת. */
    var sig = FAILED.length
      ? crypto.createHash('sha1').update(FAILED.sort().join('\n')).digest('hex').slice(0, 12)
      : 'אין';
    var prev = st[LOG_KEY] || 'אין';
    /* ממתינים ומנויים שפג קודם חוזרים בכל הרצה — אינם חדשות. */
    var news = ok || goneNew || (bad && sig !== prev);
    var log = news
      ? S.logRun('לימוד משותף — הודעה להורה או לבן', 'הודעה על לימוד משותף שדווח',
                 'הורים ובנים שדיווחו', ok, bad, wait, gone)
      : Promise.resolve(false);
    return log.then(function () {
      if (sig !== prev) return S.markOne(LOG_KEY, sig);
    });
  })
  ['catch'](function (e) {
    console.error('נכשל: ' + (e && e.message || e));
    process.exit(1);
  });
