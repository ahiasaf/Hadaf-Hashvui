/* שליחת התראה למכשירים שנרשמו — רץ ב-GitHub Actions בלבד.
   ============================================================
   למה לא מכאן ולא מהסקריפט של גוגל:
     · שירות ההתראות של אפל אינו נגיש מסביבת הפיתוח, ולכן
       שליחה משם מגיעה לאנדרואיד ולא לאייפון — כלומר בדיוק
       חצי מהתשובה.
     · חתימת VAPID דורשת ECDSA, ו-Apps Script אינו יודע לחתום
       כך. GitHub Actions כבר רץ כאן על כל דחיפה, יש לו רשת
       פתוחה, והוא חינם.

   **המפתח הפרטי והמנויים הם סודות של הריפו ולא קבצים.**
   הריפו ציבורי: מפתח פרטי שנדחף אליו מאפשר לכל אחד לשלוח
   התראות בשם התוכנית, ומנוי הוא כתובת לדחוף למכשיר מסוים.

   מה שנכתב ללוג: מארח השירות וקוד התשובה בלבד. לא הכתובת
   המלאה, כי לוגים של ריפו ציבורי הם ציבוריים. */
var webpush = require('web-push');

var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
/* נושא ה-VAPID חייב להיות mailto או כתובת. כתובת האתר, ולא
   דוא"ל — אין לשים פרט אישי בריפו ציבורי. */
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var fs = require('fs');

var priv  = process.env.VAPID_PRIVATE || '';
var key   = process.env.READ_KEY || '';
var title = process.env.TITLE || 'הדף השבועי';
var body  = process.env.BODY  || 'דף חדש מחכה לך.';

if (!priv) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key)  { console.error('חסר READ_KEY בסודות הריפו.');      process.exit(1); }

/* כתובת הסקריפט יושבת ב-data.js ממילא — אין סיבה לשכפל אותה
   לסוד נוסף שיישכח ביום שהיא תתחלף. */
function scriptUrl() {
  var src = fs.readFileSync(__dirname + '/../data.js', 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src) ||
          /APPS_SCRIPT_URL\s*=\s*\n?\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

/* המנויים מגיעים מהלשונית הפרטית ולא מסוד שצריך לעדכן ביד.
   כך בודק חדש פשוט נרשם מהעמוד, ואיש אינו נוגע בהגדרות. */
function loadSubs() {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  /* **`read` ולא `tab`.** הפרמטר לקריאה נקרא `read`; `tab` הוא
     של הכתיבה. עם השם הלא נכון הסקריפט אינו נכנס לענף הקריאה
     כלל, ומחזיר תשובה תקינה בלי שורות — וזה נקרא כאן בטעות
     "הלשונית ריקה". שלוש שליחות אבדו על זה. */
  var q = url + '?read=' + encodeURIComponent('התראות') +
          '&key=' + encodeURIComponent(key) + '&t=' + Date.now();
  return fetch(q).then(function (r) { return r.json(); }).then(function (j) {
    if (!j || j.status !== 'ok') {
      throw new Error('הגיליון לא נענה: ' + ((j && j.message) || 'לא ידוע'));
    }
    /* **תשובה בלי שדה `rows` אינה לשונית ריקה — היא קריאה
       שנכשלה.** זה כלל הברזל של הפרויקט, והבלבול בין השניים
       הוא בדיוק מה שהסתיר את הבאג למעלה. */
    if (!j.rows) {
      throw new Error('התשובה מהגיליון אינה מכילה שורות כלל — ' +
                      'כנראה לא נקראה הלשונית הנכונה.');
    }
    var rows = j.rows;
    if (rows.length < 2) return [];
    /* מיפוי לפי שם העמודה ולא לפי מספרה: סדר עמודות משתנה
       ביום שמישהו גורר אחת, וקריאה לפי מספר נשברת בשקט. */
    var head = rows[0].map(function (x) { return String(x).trim(); });
    var iSub = head.indexOf('מנוי'), iWho = head.indexOf('שם');
    /* סינון לישיבה אחת. ריק = לכולם. */
    var only = String(process.env.ONLY || '').trim();
    var iIns = head.indexOf('ישיבה');
    if (iSub < 0) throw new Error('אין עמודת "מנוי" בלשונית התראות');
    var seen = {}, out = [], blocked = 0;
    /* מהסוף להתחלה: מי שנרשם שוב מאותו מכשיר — הרישום האחרון
       הוא הנכון, והישן עלול כבר להיות פג. */
    for (var i = rows.length - 1; i >= 1; i--) {
      if (only && iIns >= 0 &&
          String(rows[i][iIns] || '').trim() !== only) continue;
      var raw = rows[i][iSub];
      /* שורה בלי מנוי היא דיווח שההתראות חסומות במכשיר — נתון
         על ציבור המשתמשים, לא נמען. סופרים ולא שולחים. */
      if (!raw) { blocked++; continue; }
      var s;
      try { s = JSON.parse(raw); } catch (e) { continue; }
      if (!s || !s.endpoint || seen[s.endpoint]) continue;
      seen[s.endpoint] = 1;
      out.push({ sub: s, who: (iWho >= 0 ? rows[i][iWho] : '') || 'בלי שם' });
    }
    out.blocked = blocked;
    return out;
  });
}

webpush.setVapidDetails(SUBJECT, PUBLIC, priv);
var payload = JSON.stringify({ title: title, body: body, url: './' });

loadSubs().then(function (list) {
  if (!list.length) {
    /* חשוב להפריד בין "לא הגענו לגיליון" ל"הגענו ואין בו איש":
       אם הגענו — הסודות תקינים, והחסר הוא רק שמישהו יירשם.
       בלי ההבחנה הזו מחפשים תקלה במקום שאין בה. */
    console.error('הגיליון נקרא בהצלחה — כלומר הסודות תקינים.');
    console.error(list.blocked
      ? 'אבל אין בו אף מנוי פעיל — רק ' + list.blocked +
        ' דיווחים על מכשירים שההתראות בהם חסומות.'
      : 'אבל אין בו אף מנוי: הלשונית "התראות" ריקה.');
    console.error('צריך שמישהו ייכנס ל-/pushtest, יתקין, וילחץ');
    console.error('"הרשמה לקבלת התראות". רק אז יש למי לשלוח.');
    process.exit(1);
  }
  if (list.blocked) {
    console.log(list.blocked + ' מכשירים דיווחו שההתראות בהם חסומות — ' +
                'מדלגים עליהם.');
  }
  console.log('שולח ל-' + list.length + ' מכשירים.\n');
  return Promise.all(list.map(function (it) {
    var host = '—';
    try { host = new URL(it.sub.endpoint).host; } catch (e) {}
    return webpush.sendNotification(it.sub, payload, { TTL: 3600 })
      .then(function (r) {
        console.log('  ✓ ' + it.who + ' · ' + host + ' → ' + r.statusCode);
        return 1;
      })
      .catch(function (e) {
        console.log('  ✗ ' + it.who + ' · ' + host + ' → ' +
                    (e.statusCode || '') + ' ' +
                    String(e.body || e.message || '').slice(0, 120));
        return 0;
      });
  }));
}).then(function (res) {
  var done = res.reduce(function (a, b) { return a + b; }, 0);
  console.log('\nהגיעו: ' + done + ' · נכשלו: ' + (res.length - done));
  /* מנוי שפג (410/404) אינו תקלה של הקוד — המכשיר הסיר את
     ההרשאה. נכשלו כולם = כן תקלה. */
  if (!done) process.exit(1);
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
