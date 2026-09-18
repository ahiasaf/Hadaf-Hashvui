/* ============================================================
   התקנה והתראות — הפרימיטיבים, במקום אחד.
   ============================================================
   מה שיושב כאן אינו מסך אלא **הידע על המכשיר**: האם אנחנו
   בתוך אפליקציה, מה התפריט נראה בדפדפן הזה, ואיך נרשמים
   לקבל התראה. שלושה מסכים שונים צריכים בדיוק את זה, ושלושה
   עותקים של אותו ידע נפרדים זה מזה בשקט ביום שמישהו מתקן
   אחד מהם.

   מה שאינו כאן, ובכוונה: הציור. כל מסך מציג את השלבים בשפה
   שלו — לתלמיד ולר״ם לא אומרים את אותו דבר — ורק הידע
   משותף.

   הקובץ אינו נשען על שום דבר שקיים בעמוד אחד בלבד.
   ============================================================ */

var APPX = (function () {

  /* המפתח הציבורי של שירות ההתראות. הפרטי לעולם אינו כאן —
     הריפו ציבורי, ומפתח שנדחף אליו מאפשר לכל אחד לשלוח
     התראות בשם התוכנית. */
  var VAPID = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';

  function b64ToU8(str) {
    var pad = '='.repeat((4 - str.length % 4) % 4);
    var raw = atob((str + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  /* ---------- המכשיר ---------- */
  /* גרסת ה-iOS, מהחתימה של הדפדפן. נדרשת כי אפל הזיזה את
     כפתור השיתוף: עד 18 הוא בסרגל, ומ-26 הוא חבוי מאחורי
     שלוש הנקודות. 0 = לא ידוע, ואז נוקטים בזהיר. */
  function iosVer() {
    var m = /(?:CPU |iPhone )OS (\d+)[_ ]/.exec(navigator.userAgent || '');
    if (m) return parseInt(m[1], 10) || 0;
    m = /Version\/(\d+)/.exec(navigator.userAgent || '');
    return m ? (parseInt(m[1], 10) || 0) : 0;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function standalone() {
    try {
      if (navigator.standalone === true) return true;
      return !!(window.matchMedia &&
        matchMedia('(display-mode: standalone)').matches);
    } catch (e) { return false; }
  }
  /* דפדפן בתוך אפליקציה — וזו הסיבה שזה לא עובד לחלק מהם.
     הקישור מופץ בוואטסאפ, והקשה עליו פותחת חלון **בתוך**
     וואטסאפ. משם אי אפשר להוסיף למסך הבית בשום דרך.
     היוריסטיקה ולא ודאות, ולכן מי שמשתמש בה אומר "נראה ש". */
  function inApp() {
    var ua = navigator.userAgent || '';
    if (/; wv\)|FBAN|FBAV|Instagram|Line\/|MicroMessenger|OKApp/.test(ua)) return true;
    if (isIOS() && typeof navigator.standalone === 'undefined') return true;
    return false;
  }

  /* ההצעה של הדפדפן להתקין. באייפון היא לא קיימת ולעולם לא
     תגיע — שם נשארות ההוראות בלבד. */
  var BIP = null, ON_BIP = [];
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); BIP = e;
    ON_BIP.forEach(function (f) { try { f(); } catch (x) {} });
  });
  window.addEventListener('appinstalled', function () {
    BIP = null; mark();
    ON_BIP.forEach(function (f) { try { f(); } catch (x) {} });
  });

  function mark() { try { localStorage.setItem('df:appAdded', '1'); } catch (e) {} }
  function wasAdded() {
    try { return localStorage.getItem('df:appAdded') === '1'; } catch (e) { return false; }
  }
  /* **באנדרואיד די בכך שהדפדפן דיווח שהתקין.** המנוי שייך
     לאתר ולא לחלון, ולכן אישור שניתן בדפדפן עובד גם מהאייקון.
     באייפון אין דיווח כזה ואין התראות מחוץ לאפליקציה — ולכן
     שם האייקון חייב להיפתח. */
  function installed() {
    if (standalone()) return true;
    return !isIOS() && wasAdded();
  }

  /* ---------- ההתראות ---------- */
  function canNote() { return typeof window.Notification !== 'undefined'; }
  function perm() { return canNote() ? Notification.permission : 'default'; }

  /* **פעם אחת, ולא פעמיים.** `requestPermission` תומך גם
     ב-callback וגם ב-Promise, ודפדפן מודרני מפעיל את שניהם.
     בלי השומר הזה כל נרשם היה נרשם פעמיים — שני מנויים לאותו
     מכשיר, ושתי התראות על כל הודעה. */
  function ask(cb) {
    var done = false;
    var after = function (p) {
      if (done) return;
      done = true;
      cb(p === 'granted' ? 'granted' : (p === 'denied' ? 'denied' : 'default'));
    };
    if (!canNote()) { cb('none'); return; }
    try {
      var pr = Notification.requestPermission(after);
      if (pr && pr.then) pr.then(after)['catch'](function () { after('default'); });
    } catch (e) { cb('none'); }
  }

  /* מנוי שנוצר עם מפתח ישן נראה תקין, אבל דחיפה שלנו לא תגיע
     אליו לעולם. נזרק ונוצר מחדש. */
  function sameKey(sub) {
    try {
      var k = sub.options && sub.options.applicationServerKey;
      if (!k) return false;
      var a = new Uint8Array(k), b = b64ToU8(VAPID), i;
      if (a.length !== b.length) return false;
      for (i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    } catch (e) { return false; }
  }

  function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return Promise.reject(new Error('הדפדפן הזה אינו תומך בהתראות'));
    }
    return navigator.serviceWorker.register('sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function (reg) {
      var fresh = function () {
        return reg.pushManager.subscribe({
          userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID)
        });
      };
      return reg.pushManager.getSubscription().then(function (sub) {
        if (!sub) return fresh();
        if (sameKey(sub)) return sub;
        return sub.unsubscribe().then(fresh, fresh);
      });
    });
  }

  /* ============================================================
     בדיקה שההתראה באמת קופצת אצלו.
     ============================================================
     "יהיה לו כפתור של בדיקת התראות, וברגע שילחץ עליו תופיע לו
     התראה — ואז תשאל אותו: קיבלת?"

     **מקומית, דרך ה-Service Worker, ולא דרך השרת.** דחיפה
     אמיתית נוסעת דרך GitHub Actions ומגיעה בעוד דקה ארוכה —
     בדיקה שאי אפשר לעמוד מולה ולחכות. מה שנבדק כאן הוא מה
     שמעניין אותו: שהאישור ניתן, שהמכשיר מצייר התראה, ושהוא
     רואה אותה. ערוץ הדחיפה עצמו כבר נבדק ברישום.

     `showNotification` ולא `new Notification`: באנדרואיד
     ובאייפון המותקן רק הראשון עובד, והשני נכשל בשקט.
     ============================================================ */
  function demo(title, body) {
    if (!('serviceWorker' in navigator)) {
      return Promise.reject(new Error('הדפדפן הזה אינו תומך בהתראות'));
    }
    if (perm() !== 'granted') {
      return Promise.reject(new Error('ההתראות אינן מאושרות במכשיר הזה'));
    }
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.showNotification(title, {
        body: body, icon: 'icon-192.png', badge: 'icon-192.png',
        tag: 'df-demo', renotify: true
      });
    });
  }

  /* ---------- הסמלים ----------
     אי אפשר לכתוב "לחצו על הסמל" ולקוות שיזוהה. מציירים אותו,
     וכך העין מוצאת אותו על המסך. */
  var SHARE = '<span class="gl"><svg viewBox="0 0 24 24">' +
    '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/>' +
    '<path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg></span>';
  /* שלוש שוכבות — התפריט בספארי החדש. שלוש עומדות — כרום
     באנדרואיד. שני כפתורים שונים לגמרי, ומי שמחפש את
     הלא-נכון לא ימצא כלום. */
  var DOTS_H = '<span class="gl"><svg viewBox="0 0 24 24">' +
    '<circle cx="5" cy="12" r="1.6" fill="#17468F" stroke="none"/>' +
    '<circle cx="12" cy="12" r="1.6" fill="#17468F" stroke="none"/>' +
    '<circle cx="19" cy="12" r="1.6" fill="#17468F" stroke="none"/></svg></span>';
  var DOTS_V = '<span class="gl"><svg viewBox="0 0 24 24">' +
    '<circle cx="12" cy="5" r="1.6" fill="#17468F" stroke="none"/>' +
    '<circle cx="12" cy="12" r="1.6" fill="#17468F" stroke="none"/>' +
    '<circle cx="12" cy="19" r="1.6" fill="#17468F" stroke="none"/></svg></span>';

  function icon() {
    return '<div class="apic"><img src="icon-192.png" alt="">' +
           '<span>הדף השבועי</span></div>';
  }

  /* ההוראות הידניות, ולכל דפדפן שלו. נוסח כללי אחד ("תפריט
     הדפדפן ← הוספה למסך הבית") נמסר לבודקת על שיאומי והיא לא
     מצאה כלום. תפריט נראה אחרת בכל מכשיר, וזה ההבדל בין
     הוראה שמתבצעת להוראה שנקראת. */
  function howList() {
    if (isIOS()) {
      /* ============================================================
         **אפל הזיזה את כפתור השיתוף, ולכן יש כאן שני מסלולים.**
         ============================================================
         עד iOS 18 סמל השיתוף יושב בסרגל עצמו. ב-iOS 26 הסרגל
         התכווץ, הסמל ירד ממנו, והשיתוף חבוי מאחורי שלוש הנקודות.

         ההוראה שהייתה כאן הפנתה לסרגל, ובאייפונים החדשים אין שם
         מה ללחוץ — המסלול הנכון היה קבור בהערת שוליים. וזה בדיוק
         המקום שבו ר"ם לחץ "שיתוף" ושלח את הקישור לעצמו בוואטסאפ
         במקום להוסיף למסך הבית.

         **ופיצול לפי גרסה אינו פותר את זה.** הקישור מגיע
         בוואטסאפ ונפתח בדפדפן שבתוכו, ושם הסרגל הוא של וואטסאפ
         ולא של ספארי: שלוש נקודות בצד שמאל, בכל מכשיר ובכל
         גרסה. לכן הוראה אחת שמתחילה בשלוש הנקודות, ומי שרואה
         את סמל השיתוף בסרגל מוזמן ללחוץ עליו ישירות. אותו סדר
         בדיוק במדריך המאויר — ראו `guide.js`. */
      return '<ol class="gsteps">' +
        '<li>לחצו על שלוש הנקודות ' + DOTS_H + ' שבסרגל שלמטה, ' +
          'ואז על <b>"שיתוף"</b>.<br>' +
          '<b>רואים כבר את סמל השיתוף ' + SHARE + ' בסרגל?</b> ' +
          'לחצו עליו ישירות.</li>' +
        '<li>גללו למטה ובחרו <b>"הוספה למסך הבית"</b>, ואז "הוסף".<br>' +
          '<b>אין ברשימה?</b> גללו עד הסוף, "עריכת פעולות", ' +
          'והוסיפו אותה משם.</li>' +
        '<li><b>פתחו את האייקון החדש</b> שנוסף למסך הבית — ומשם ' +
          'נמשיך.</li></ol>' + icon();
    }
    return '<ol class="gsteps">' +
      '<li>לחצו על שלוש הנקודות ' + DOTS_V + ' בפינת הדפדפן.</li>' +
      '<li>בחרו <b>"התקנת אפליקציה"</b>, או <b>"הוספה למסך ' +
        'הבית"</b>.<br>בדפדפן של סמסונג זה "הוספת דף אל" ואז ' +
        '"מסך הבית".</li>' +
      '<li><b>פתחו את האייקון החדש</b> שנוסף למסך הבית.</li></ol>' +
      icon();
  }

  /* הוראות פתיחה כשההתראות חסומות. גם כאן לכל מכשיר המסלול
     שלו — הוראות אנדרואיד לאייפון הן אותה תקלה, הפוך. */
  function unblock() {
    return isIOS()
      ? 'ב<b>הגדרות ← הדף השבועי ← התראות</b>'
      : 'ב<b>הגדרות ← אפליקציות ← הדף השבועי ← התראות</b>';
  }

  /* ============================================================
     עדכון גרסה — מעצמו, בלי שיבקשו ממנו.
     ============================================================
     עד כאן העדכון היה פס ירוק שכתוב עליו "גרסה חדשה זמינה —
     לחצו לעדכון", והוא **חיכה ללחיצה**. בשטח זה אומר שהוא לא
     קורה: ראש חטיבה שפתח את האפליקציה לפני שבועיים ממשיך
     לראות את הגרסה של אז, בלי לדעת שיש חדשה ובלי לדעת שהפס
     הזה בכלל מיועד לו. תיקון שיצא לאוויר ולא הגיע לטלפון הוא
     תיקון שלא קרה.

     עכשיו זה הפוך: עובד־השירות החדש נכנס לתפקיד מיד
     (`skipWaiting` ב-sw.js), לוקח שליטה, והעמוד טוען את עצמו
     מחדש. הקפיצה נמשכת רגע, ואחריה נשארת שורה ירוקה קצרה
     שאומרת שזה קרה — ונעלמת לבד.

     שלוש הגנות, וכל אחת מהן נובעת ממשהו שנשבר:

     · **השתלטות ראשונה אינה עדכון.** בביקור הראשון אין עדיין
       עובד־שירות, הוא נרשם עכשיו ולוקח שליטה — וזה מפעיל את
       אותו אירוע בדיוק. בלי הבדיקה הזו כל כניסה ראשונה הייתה
       נטענת פעמיים, ומסך הפתיחה היה מהבהב.

     · **לא באמצע הקלדה.** מי שכותב הודעה בפינה שלו, או ממלא
       את שמו בטופס, מאבד את מה שהקליד ברענון. במקרה כזה
       הרענון ממתין עד שהוא מסיים — ולא מוותר.

     · **פעם אחת.** `refreshing` חוסם רענון שני, כי שני
       מאזינים שרצים יחד על אותו אירוע הם לולאה.
     ============================================================ */
  var upReady = false, upBusy = false, upHad = false;

  /* השורה הירוקה. היא מגיעה **אחרי** הרענון, ולכן הסימון עובר
     דרך האחסון: העמוד שמצייר אותה אינו העמוד שידע שהעדכון קרה.
     `sessionStorage` ולא `localStorage` — סימון שנשאר על
     המכשיר היה מציג "עודכנה" גם מחר בבוקר. */
  function upSaid() {
    try { return sessionStorage.getItem('df:upd') === '1'; } catch (e) { return false; }
  }
  function upSay(v) {
    try {
      if (v) sessionStorage.setItem('df:upd', '1');
      else sessionStorage.removeItem('df:upd');
    } catch (e) {}
  }

  function upBar() {
    if (!upSaid()) return;
    upSay(false);
    /* בעמוד הראשי כבר יש פס כזה ומעוצב. בשאר העמודים אין,
       ולכן הוא נבנה כאן — אותו מראה בדיוק בשלושתם. */
    var el = document.getElementById('upd');
    if (!el) {
      if (!document.getElementById('upd-css')) {
        var st = document.createElement('style');
        st.id = 'upd-css';
        st.textContent =
          '#upd{position:fixed;bottom:0;left:0;right:0;z-index:70;display:none;' +
          'text-align:center;padding:15px;font-weight:800;font-size:.94rem;' +
          'color:#fff;background:linear-gradient(140deg,#2E7D52,#1F5C3B);' +
          'box-shadow:0 -6px 24px rgba(0,0,0,.2)}' +
          '#upd.on{display:block}';
        document.head.appendChild(st);
      }
      el = document.createElement('div');
      el.id = 'upd';
      document.body.appendChild(el);
    }
    /* הנוסח מ-data.js, ככל נוסח אחר. נפילה לברירת מחדל רק אם
       data.js ישן יושב במטמון. */
    el.textContent = (window.UI && UI.updated) || 'האפליקציה עודכנה';
    el.onclick = null;
    el.style.cursor = 'default';
    el.className = 'on';
    setTimeout(function () { el.className = ''; }, 4000);
  }

  /* הקלדה פתוחה? ממתינים לסופה. */
  function upTyping() {
    var a = document.activeElement;
    if (!a) return false;
    var t = (a.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' ||
           a.isContentEditable === true;
  }
  function upGo() {
    if (upBusy) return;
    if (upTyping()) {
      /* לא מוותרים — רק ממתינים. `blur` מגיע ברגע שהוא מסיים. */
      document.activeElement.addEventListener('blur', function () {
        setTimeout(upGo, 120);
      }, { once: true });
      return;
    }
    upBusy = true;
    upSay(true);
    location.reload();
  }

  function update() {
    if (upReady || !('serviceWorker' in navigator)) return;
    upReady = true;
    upBar();                       /* אולי בדיוק חזרנו מרענון */
    upHad = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!upHad) return;          /* השתלטות ראשונה אינה עדכון */
      upGo();
    });

    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var poke = function () { try { reg.update(); } catch (e) {} };
      poke();
      setInterval(poke, 3600000);
      /* חזרה לאפליקציה אחרי שהייתה ברקע — שם רוב הזמן נשמר,
         ושם `setInterval` של אייפון פשוט אינו רץ. */
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) poke();
      });
      /* עובד שכבר ממתין מגרסה קודמת — לדחוף אותו פנימה עכשיו.
         `skipWaiting` ב-sw.js מטפל בחדשים; זה מטפל במי שכבר
         נתקע בהמתנה אצל מי שלא לחץ על הפס הישן. */
      if (reg.waiting && navigator.serviceWorker.controller) {
        reg.waiting.postMessage({ type:'SKIP_WAITING' });
      }
    })['catch'](function () {});
  }

  /* ============================================================
     יציאה מהדפדפן שבתוך וואטסאפ.
     ============================================================
     "אם פותחים דרך קישור בוואטסאפ אז הוא יפתח את זה בדפדפן של
     הוואטסאפ, ואנחנו צריכים להעביר אותו לדפדפן הרגיל."

     מהדפדפן המוטמע אי אפשר להתקין — אין בו "הוספה למסך הבית"
     ואין בו הצעת התקנה — ולכן כל מי שמגיע משם נתקע. הבקשה
     "תפתחו בדפדפן" בעברית פשוטה עובדת, אבל היא עוד שלב שאפשר
     לטעות בו.

     **באנדרואיד יש דרך אמיתית:** כתובת `intent://` פותחת את
     כרום עצמו. `browser_fallback_url` דואג שמי שאין לו כרום
     פשוט יישאר איפה שהוא ולא ייתקל בשגיאה.

     **באייפון אין דרך כזו.** כל מה שקיים שם הן סכמות פרטיות
     שאינן מובטחות, וכפתור שלפעמים לא עושה כלום גרוע מהיעדרו.
     שם נשארת ההנחיה, והיא מדויקת: בתפריט של וואטסאפ יש
     "פתיחה בדפדפן".

     מחזיר '' כשאין מה להציע — והמסך שמעליו יודע להסתדר. */
  function toBrowser() {
    if (isIOS() || !inApp()) return '';
    var u = location.href.replace(/^https?:\/\//, '');
    return 'intent://' + u + '#Intent;scheme=https;' +
           'package=com.android.chrome;' +
           'S.browser_fallback_url=' + encodeURIComponent(location.href) + ';end';
  }

  return {
    update: update, toBrowser: toBrowser,
    isIOS: isIOS, iosVer: iosVer, standalone: standalone, inApp: inApp,
    installed: installed, wasAdded: wasAdded, mark: mark,
    bip: function () { return BIP; },
    onBip: function (f) { ON_BIP.push(f); },
    prompt: function (after) {
      var p = BIP; if (!p) { after(false); return; }
      p.prompt();
      var back = function (r) {
        var okd = !!(r && r.outcome === 'accepted');
        if (okd) { BIP = null; mark(); }
        after(okd);
      };
      if (p.userChoice && p.userChoice.then) p.userChoice.then(back)['catch'](back);
      else back(null);
    },
    canNote: canNote, perm: perm, ask: ask, subscribe: subscribe, demo: demo,
    howList: howList, icon: icon, unblock: unblock,
    SHARE: SHARE, DOTS_H: DOTS_H, DOTS_V: DOTS_V
  };
})();
