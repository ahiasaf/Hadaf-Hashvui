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

var priv = process.env.VAPID_PRIVATE || '';
var raw  = process.env.PUSH_SUBS || '[]';
var title = process.env.TITLE || 'הדף השבועי';
var body  = process.env.BODY  || 'דף חדש מחכה לך.';

if (!priv) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }

var subs;
try { subs = JSON.parse(raw); }
catch (e) { console.error('PUSH_SUBS אינו JSON תקין.'); process.exit(1); }
if (!Array.isArray(subs)) subs = [subs];
if (!subs.length) { console.error('אין מנויים ב-PUSH_SUBS.'); process.exit(1); }

webpush.setVapidDetails(SUBJECT, PUBLIC, priv);

var payload = JSON.stringify({ title: title, body: body, url: './' });
var done = 0, bad = 0;

console.log('שולח ל-' + subs.length + ' מכשירים.');
subs.forEach(function (s, i) {
  var host = '—';
  try { host = new URL(s.endpoint).host; } catch (e) {}
  webpush.sendNotification(s, payload, { TTL: 3600 })
    .then(function (r) {
      done++;
      console.log('  ✓ [' + (i + 1) + '] ' + host + ' → ' + r.statusCode);
      fin();
    })
    .catch(function (e) {
      bad++;
      console.log('  ✗ [' + (i + 1) + '] ' + host + ' → ' +
                  (e.statusCode || '') + ' ' + (e.body || e.message || ''));
      fin();
    });
});

function fin() {
  if (done + bad < subs.length) return;
  console.log('\nהצליחו: ' + done + ' · נכשלו: ' + bad);
  /* מנוי שפג (410/404) אינו תקלה של הקוד — המכשיר הסיר את
     ההרשאה או נמחק. נכשלו הכל = כן תקלה. */
  if (!done) process.exit(1);
}
