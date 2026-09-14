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
      return '<ol class="gsteps">' +
        '<li>לחצו על כפתור השיתוף ' + SHARE + ' שבתחתית המסך.<br>' +
          '<b>לא רואים אותו?</b> לחצו קודם על שלוש הנקודות ' + DOTS_H +
          ' שבפינה, ואז על "שיתוף".</li>' +
        '<li>גללו למטה ובחרו <b>"הוספה למסך הבית"</b>, ואז "הוסף".</li>' +
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

  return {
    isIOS: isIOS, standalone: standalone, inApp: inApp,
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
    canNote: canNote, perm: perm, ask: ask, subscribe: subscribe,
    howList: howList, icon: icon, unblock: unblock,
    SHARE: SHARE, DOTS_H: DOTS_H, DOTS_V: DOTS_V
  };
})();
