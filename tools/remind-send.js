/* ============================================================
   התזכורות של הרכז — לעצמו.
   ============================================================
   אחיאסף מנהל את המבצע כולו, והתזכורות שהוא צריך אינן קשורות
   לדף השבועי: "להתקשר לחדרה", "לשלוח לפלטי סיכום". הוא כותב
   אותן במסך השיחות, הן נשמרות בלשונית "תזכורות", והקובץ הזה
   דוחף אותן במועד.

   רץ ב-GitHub Actions בלבד, כמו כל שליחה: חתימת VAPID דורשת
   מפתח פרטי, והוא יושב בסודות הריפו.

   --- למה יש כאן סימון "נשלח", אחרי שלא היה ---
   קודם כל הרצה טיפלה במשבצת אחת בדיוק — זו שהיא נפלה בה —
   ולכן לא היה מה לסמן: תזכורת מתאימה למשבצת אחת, ואם ההרצה
   שלה קרתה היא יצאה.

   אלא שההרצה **לא קרתה**. הקרון של GitHub הוא מאמץ סביר ולא
   הבטחה, וביומן ההרצות נראות כשש הרצות ביממה במקום ארבעים
   ושמונה. כלומר רוב המשבצות לא טופלו מעולם, וזו הסיבה שתזכורת
   שנרשמה לא הגיעה. לא ההתראות היו שבורות — השעון היה.

   עכשיו כל הרצה משלימה את כל המשבצות שנפספסו מהיום (ראו
   `tools/sched.js`), והמפתח שנרשם בלשונית "נשלחו" הוא מה
   שמונע שליחה כפולה. תזכורת יוצאת באיחור ועם השעה המקורית
   כתובה בה — וזה עדיף בהרבה על תזכורת שלא יוצאת.

   --- ומה קורה לתזכורת של אתמול ---
   כלום, והיא נשארת ברשימה עד שהוא מסיר אותה. תזכורת של אתמול
   אינה תזכורת, ופספוס עדיין עדיף על הודעה שאין לה מובן.
   ============================================================ */
var webpush = require('web-push');

var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var priv = process.env.VAPID_PRIVATE || '';
var key  = process.env.READ_KEY || '';
var DRY  = /^(1|true|yes)$/i.test(String(process.env.DRY_RUN || ''));
/* לבדיקה: כופה תאריך ושעה (YYYY-MM-DD HH:MM) במקום השעון. */
var FORCE = String(process.env.FORCE_WHEN || '').trim();

if (!priv && !DRY) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }

/* השעון, הקריאה לגיליון ורישום מה שיצא — משותפים לשתי
   השליחות המתוזמנות. ראו את ההסבר שם. */
var S = require('./sched.js');
/* מסירה בזהירות (זמן קצוב, ניסיון חוזר) — ראו push-deliver.js.
   נכשל כשהמסירה נכשלה, כדי ש-S.once ירשום "נכשל". */
var D = require('./push-deliver.js');
function pushOne(sub, payload, ttl) {
  return D.deliver(webpush, sub, payload, { TTL: ttl }).then(function (r) {
    if (r.ok) return { statusCode: r.code };
    throw { statusCode: r.code, gone: !!r.gone, body: r.gone ? 'המנוי פג' : r.err };
  });
}
function rows(tab)   { return S.rows(tab, key); }
function byHead(r)   { return S.byHead(r); }

var now = FORCE
  ? (function () {
      var q = FORCE.split(' '), hm = (q[1] || '00:00').split(':');
      return { date: q[0], day: 0,
               hour: parseInt(hm[0], 10) || 0, min: parseInt(hm[1], 10) || 0 };
    })()
  : S.israelNow();
var slots = S.slotsDue(now);
console.log('עכשיו: ' + now.date + ' ' + S.two(now.hour) + ':' + S.two(now.min) +
            ' · משלימים ' + slots.length + ' משבצות (' + slots[0].t + '–' +
            slots[slots.length - 1].t + ')' + (DRY ? ' · הרצה יבשה' : ''));

/* מפתח אחד לכל תזכורת בכל ההיסטוריה: מי, באיזה יום, ובאיזו שעה. */
function keyOf(o) {
  return 'rm|' + o['מזהה'] + '|' + o['תאריך'] + '|' + o['שעה'];
}

/* ============================================================
   וכשהיא מאחרת — אומרים את זה.
   ============================================================
   תזכורת ל-9:00 שמגיעה ב-12:30 בלי לומר זאת נראית כמו תקלה,
   ומי שמקבל אותה אינו יודע על מה היא מדברת.
   ============================================================ */
function title(o) {
  var cur = S.two(now.hour) + ':' + (now.min < 30 ? '00' : '30');
  return o['שעה'] === cur ? 'תזכורת' : 'תזכורת ל-' + o['שעה'];
}

/* ============================================================
   הרישום נקרא לפני הכול.
   ============================================================
   "נשלחו" הוא מה שמונע כפילות עכשיו שכל הרצה משלימה משבצות,
   ולכן קריאה שנכשלת אינה "עוד לא נשלח כלום" — היא סיבה לא
   לשלוח בהרצה הזו. תזכורת שתגיע פעמיים גרועה מתזכורת שתגיע
   בהרצה הבאה.
   ============================================================ */
/* sentRaw ולא sentLoad: "פג:…" על מנוי ישן אינו "יצא" — אם הותקן
   מחדש, התזכורת יוצאת אל המנוי החדש. ראו isGone ב-sched.js. */
var st = {}, STILL = [], LOG_KEY = 'rm|יומן';
Promise.all([rows('תזכורות'), rows('התראות'), S.sentRaw(key)])
  .then(function (all) {
  var rem = byHead(all[0]), subs = byHead(all[1]);
  st = all[2];
  var sent = S.sentFrom(st);

  var times = {};
  slots.forEach(function (sl) { times[sl.t] = 1; });
  var due = rem.filter(function (o) {
    return o['תאריך'] === now.date && times[o['שעה']] && o['נוסח'] &&
           !sent[keyOf(o)];
  });
  /* מהישנה לחדשה, כדי שתזכורות של אותו בוקר יגיעו בסדר
     שבו נקבעו ולא הפוך. */
  due.sort(function (x, y) { return x['שעה'] < y['שעה'] ? -1 : 1; });
  if (!due.length) { console.log('אין תזכורת שממתינה.'); return []; }

  /* המנוי האחרון לכל מזהה. מי שהתקין מחדש רשם שורה נוספת,
     והישנה כבר אינה תקפה. */
  var last = {};
  subs.forEach(function (x) {
    if (x['מזהה'] && x['מנוי']) last[x['מזהה']] = x['מנוי'];
  });

  if (!DRY) webpush.setVapidDetails(SUBJECT, PUBLIC, priv);
  /* בזה אחר זה, ולא במקביל: הרישום נכתב לפי מה שבאמת יצא. */
  return due.reduce(function (chain, o) {
    return chain.then(function (res) {
      var raw = last[o['מזהה']];
      if (!raw) {
        console.log('  ! אין מנוי למזהה ' + o['מזהה'] + ' — מדלג');
        STILL.push(keyOf(o));
        res.push(0); return res;
      }
      var sub;
      try { sub = JSON.parse(raw); }
      catch (e) {
        console.log('  ! מנוי פגום למזהה ' + o['מזהה']);
        res.push(0); return res;
      }
      /* אותו מנוי שכבר נמצא פג — לא מנסים שוב, ולא כותבים שורה. */
      if (S.isGone(st, keyOf(o), sub)) {
        console.log('  · ' + o['שעה'] + ' — המנוי פג ולא חודש, מדלג');
        res.push(3); return res;
      }
      if (DRY) {
        console.log('  · ' + o['שעה']);
        res.push(1); return res;
      }
      /* הלחיצה פותחת את מסך השיחות — שם הוא ממילא עומד לפעול. */
      return S.once(keyOf(o), function () {
        return pushOne(sub, JSON.stringify({ title: title(o), body: o['נוסח'],
                                             url: './#admin', tag: 'remind' }), 3600);
      }, S.failGone(sub))
        .then(function (r) {
          if (r && r.skipped) { res.push(0); return res; }
          /* בלי הנוסח: הוא כתוב ביד ועלול לכלול שמות, והלוג ציבורי. */
          console.log('  ✓ ' + o['שעה'] + ' → ' + r.statusCode);
          res.push(1); return res;
        })
        .catch(function (e) {
          console.log('  ✗ ' + o['שעה'] + ' → ' + (e.statusCode || '') + ' ' +
                      String(e.body || e.message || '').slice(0, 120));
          if (e && e.gone) return S.markGone(st, sub).then(function () { res.push(4); return res; });
          STILL.push(keyOf(o));
          res.push(2); return res;
        });
    });
  }, Promise.resolve([]));
}).then(function (res) {
  /* שליחה שנכשלה נרשמה "נכשל" ותנסה שוב בהרצה הבאה. */
  S.finish();
  if (!res || !res.length) return;
  /* 1 = יצא · 2 = נכשל · 0 = אין מנוי / דילוג
     4 = המנוי פג, נמצא עכשיו · 3 = המנוי פג קודם, דולג */
  var cnt = function (v) { return res.filter(function (x) { return x === v; }).length; };
  var ok = cnt(1), bad = cnt(2), none = cnt(0), goneNew = cnt(4), gone = goneNew + cnt(3);
  console.log('\nיצאו: ' + ok + ' · נכשלו: ' + bad + ' · בלי מנוי: ' + none +
              ' · מנוי פג: ' + gone + (goneNew ? ' (חדשים: ' + goneNew + ')' : ''));
  if (DRY) return;
  /* שורה ביומן רק כשמשהו השתנה: מנוי שפג קודם ודולג אינו חדשות,
     וגם אותם נכשלים/חסרי מנוי של ההרצה הקודמת (טביעה ב"נשלחו"). */
  var sig = STILL.length
    ? require('crypto').createHash('sha1').update(STILL.sort().join('\n')).digest('hex').slice(0, 12)
    : 'אין';
  var prev = st[LOG_KEY] || 'אין';
  var news = ok || goneNew || ((bad || none) && sig !== prev);
  var log = news
    ? S.logRun('תזכורות לרכז', 'התזכורות שנקבעו במסך השיחות', 'מכשירי רכז',
               ok, bad + none, 0, gone)
    : Promise.resolve(false);
  return log.then(function () { if (sig !== prev) return S.markOne(LOG_KEY, sig); });
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
