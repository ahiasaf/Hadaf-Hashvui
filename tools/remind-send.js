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
Promise.all([rows('תזכורות'), rows('התראות'), S.sentLoad(key)])
  .then(function (all) {
  var rem = byHead(all[0]), subs = byHead(all[1]), sent = all[2];

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
  var done = [];
  /* בזה אחר זה, ולא במקביל: הרישום נכתב לפי מה שבאמת יצא. */
  return due.reduce(function (chain, o) {
    return chain.then(function (res) {
      var raw = last[o['מזהה']];
      if (!raw) {
        console.log('  ! אין מנוי למזהה ' + o['מזהה'] + ' — מדלג');
        res.push(0); return res;
      }
      var sub;
      try { sub = JSON.parse(raw); }
      catch (e) {
        console.log('  ! מנוי פגום למזהה ' + o['מזהה']);
        res.push(0); return res;
      }
      if (DRY) {
        console.log('  · ' + o['שעה'] + ' | ' + o['נוסח']);
        res.push(1); return res;
      }
      /* הלחיצה פותחת את מסך השיחות — שם הוא ממילא עומד לפעול. */
      return webpush.sendNotification(sub,
        JSON.stringify({ title: title(o), body: o['נוסח'],
                         url: './#admin', tag: 'remind' }), { TTL: 3600 })
        .then(function (r) {
          console.log('  ✓ ' + o['שעה'] + ' → ' + r.statusCode + ' | ' + o['נוסח']);
          done.push(keyOf(o));
          res.push(1); return res;
        })
        .catch(function (e) {
          console.log('  ✗ ' + o['שעה'] + ' → ' + (e.statusCode || '') + ' ' +
                      String(e.body || e.message || '').slice(0, 120));
          res.push(0); return res;
        });
    });
  }, Promise.resolve([])).then(function (res) {
    /* רק מה שבאמת יצא נרשם. שליחה שנכשלה תנסה שוב בהרצה הבאה. */
    return S.sentMark(done).then(function () { return res; });
  });
}).then(function (res) {
  if (!res || !res.length) return;
  var ok = res.reduce(function (x, y) { return x + y; }, 0);
  console.log('\nיצאו: ' + ok + ' · נכשלו: ' + (res.length - ok));
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
