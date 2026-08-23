/* הדף השבועי של בני עקיבא — Service Worker
   ============================================================
   CACHE_NAME חייב להיות זהה ל-APP_VERSION שב-index.html, ומעדכנים
   אותו **ביד**. כאן היה כתוב שסקריפט הבנייה עושה זאת — אין סקריפט
   כזה ואין שלב בנייה, וההבטחה הזו היא בדיוק איך גרסת מטמון נשכחת.
   `tools/preflight.py` בודק את ההתאמה ורץ ב-CI.

   אסטרטגיה: קוד מהרשת קודם, נכסים מהמטמון קודם.

   קבצי הקוד (index.html, data.js, links.js, logo.js) נטענים
   מהרשת ורק בכישלון מהמטמון. הסיבה: גרסה מעורבת — index.html
   ישן עם data.js חדש — שוברת מסכים שלמים, וזה בדיוק מה שקרה
   כשגרסת המטמון לא עודכנה. עדיף המתנה של חצי שנייה על שבירה.

   גם תמונות הספרים (sfarim/) נטענות מהרשת קודם: הן מתחלפות תוך
   כדי עבודה — כריכה חדשה, גרסה חדה להגדלה — ומטמון שהקדים את
   הרשת החזיק במכשיר כריכה ישנה וגרסה חדה שכלל לא קיימת אצלו.

   שקפי המצגות והאייקונים נטענים מהמטמון קודם. הם כבדים ולעולם
   לא משתנים בשקט — שם מהירות עדיפה.

   ל"מהרשת קודם" יש פסק זמן, וזה קריטי: fetch על חיבור תקוע אינו
   נכשל — הוא פשוט תלוי, עשרות שניות, עד שהדפדפן מוותר. בלי פסק
   זמן data.js לא הגיע, boot() לא רץ, ומסך הכניסה נתקע על הלוגו.
   עכשיו הרשת מתחרה בשעון: לא ענתה בזמן — מגישים מיד את העותק
   השמור, והרשת ממשיכה ברקע ומעדכנת את המטמון לפעם הבאה.
   ============================================================ */
var CACHE_NAME = 'hadaf-v7.14.0';
// learn.html ו-rights.html אינם כאן בכוונה: המערכת האינטראקטיבית
// אינה מוצגת כרגע מתוך האפליקציה, ואין סיבה שכל מכשיר מותקן
// יוריד אותה מראש. כשתוחזר — להחזיר גם אותן לרשימה.
var CORE = ['./', './index.html', './data.js', './links.js', './logo.js',
            './manifest.json', './admin-manifest.json',
            './icon-192.png', './icon-512.png',
            './icon-admin-192.png', './icon-admin-512.png'];

// מהרשת קודם: קוד, תמונות הספרים, ורשימת הדפים שבמאגר.
// עמודי הדף עצמם (daf/*.webp) הם מהמטמון קודם — הם כבדים ולעולם
// אינם משתנים, וזה מה שמאפשר ללמוד את הדף גם בלי רשת.
var CODE = /\.(html|js)$|\/$|\/sfarim\/|\/daf\/index\.json$/;

// כמה להמתין לרשת לפני שנופלים למטמון. מספיק לחיבור סביר, קצר מכדי להרגיז.
var NET_TIMEOUT = 2500;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(CORE); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE_NAME; })
                           .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // גוגל שיטס וכד' — ישר לרשת

  var save = function (res) {
    if (res && res.status === 200) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
    }
    return res;
  };

  if (req.mode === 'navigate' || CODE.test(url.pathname)) {
    /* הרשת מקבלת הזדמנות ראשונה — אבל לא בלי הגבלה.
       אם היא איטית או תקועה, העותק השמור מנצח, והרשת ממשיכה
       ברקע לעדכן את המטמון. אין עותק שמור — ממתינים לרשת עד הסוף,
       כי אין למה ליפול. */
    var live = fetch(req).then(save).catch(function () { return null; });

    e.respondWith(
      caches.match(req).then(function (m) {
        /* הנפילה ל-index.html היא **רק** לניווט — עמוד שנפתח בלי
           רשת. כאן היא חלה על כל בקשה שתואמת ל-CODE, ולכן קובץ
           נתונים שלא נמצא במטמון קיבל בתשובה מסמך HTML.

           זה מה שקרה ל-`daf/index.json`: הוא חזר כ-index.html,
           `r.json()` נכשל, רשימת המאגר יצאה ריקה, והלימוד הסיק
           שאין תמונה לדף — ופנה למסלול הדרייב. משם ארבע שניות
           טעינה, **וגם** דף שמצויר מ-PDF דו-עמודי בקנה מידה אחר
           מזה שהסימונים מכוילים אליו. שתי התקלות, מקור אחד. */
        return m || (req.mode === 'navigate' ? caches.match('./index.html') : null);
      }).then(function (cached) {
        if (!cached) return live;   // אין למה ליפול — ממתינים לרשת עד הסוף

        return new Promise(function (done) {
          var settled = false;
          var finish = function (r) { if (!settled) { settled = true; done(r); } };
          live.then(function (r) { finish(r || cached); });   // כולל כישלון מיידי
          setTimeout(function () { finish(cached); }, NET_TIMEOUT);
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(save).catch(function () { return null; });
      return cached || net;
    })
  );
});
