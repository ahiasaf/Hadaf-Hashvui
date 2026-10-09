/* ============================================================
   התקנה והתראות - הפרימיטיבים, במקום אחד.
   ============================================================
   מה שיושב כאן אינו מסך אלא **הידע על המכשיר**: האם אנחנו
   בתוך אפליקציה, מה התפריט נראה בדפדפן הזה, ואיך נרשמים
   לקבל התראה. שלושה מסכים שונים צריכים בדיוק את זה, ושלושה
   עותקים של אותו ידע נפרדים זה מזה בשקט ביום שמישהו מתקן
   אחד מהם.

   מה שאינו כאן, ובכוונה: הציור. כל מסך מציג את השלבים בשפה
   שלו - לתלמיד ולר״ם לא אומרים את אותו דבר - ורק הידע
   משותף.

   הקובץ אינו נשען על שום דבר שקיים בעמוד אחד בלבד.
   ============================================================ */

var APPX = (function () {

  /* המפתח הציבורי של שירות ההתראות. הפרטי לעולם אינו כאן -
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
  /* דפדפן בתוך אפליקציה - וזו הסיבה שזה לא עובד לחלק מהם.
     הקישור מופץ בוואטסאפ, והקשה עליו פותחת חלון **בתוך**
     וואטסאפ. משם אי אפשר להוסיף למסך הבית בשום דרך.
     היוריסטיקה ולא ודאות, ולכן מי שמשתמש בה אומר "נראה ש". */
  /* ============================================================
     ובאייפון - כרום ופיירפוקס אינם "בתוך וואטסאפ".
     ============================================================
     שניהם בנויים על אותו מנוע מוטמע שבו `navigator.standalone`
     אינו קיים, ולכן המבחן שלמטה סימן אותם כדפדפן של אפליקציה
     אחרת - ומי שברירת המחדל שלו היא כרום קיבל הודעה שהוא
     בתוך וואטסאפ בזמן שהוא בדפדפן.

     הם אמנם באמת אינם יכולים להוסיף למסך הבית - באייפון רק
     ספארי יכול - אבל זו עובדה אחרת, והיא נאמרת אחרת. ראו
     `iosOther`.
     ============================================================ */
  function iosOther() {
    return isIOS() && /CriOS|FxiOS|EdgiOS|OPT\//.test(navigator.userAgent || '');
  }
  function inApp() {
    var ua = navigator.userAgent || '';
    if (/; wv\)|FBAN|FBAV|Instagram|Line\/|MicroMessenger|OKApp/.test(ua)) return true;
    if (iosOther()) return false;
    if (isIOS() && typeof navigator.standalone === 'undefined') return true;
    return false;
  }
  /* דפדפן סמסונג. ראו `toBrowser` - ההתקנה שלו נחסמת בחלק
     מהמכשירים, ולכן יש מקרים שבהם מפנים ממנו לכרום. */
  function samsung() {
    return /SamsungBrowser/.test(navigator.userAgent || '');
  }
  /* פיירפוקס באנדרואיד - מסלול התקנה משלו במדריך (guide.js). */
  /* **גם לפי המנוע, לא רק לפי המחרוזת.** פיירפוקס במצב "אתר
     למחשב שולחני" מזדהה כלינוקס בלי "Android" - ואז קיבל את מסגרת
     כרום ואת המדריך של כרום, ונתקע. `MozAppearance` קיים רק במנוע
     של פיירפוקס; ומסך מגע מבדיל טלפון ממחשב. */
  function firefox() {
    var ua = navigator.userAgent || '';
    if (isIOS()) return false;
    var gecko = /Firefox\//.test(ua) ||
      (document.documentElement && 'MozAppearance' in document.documentElement.style);
    if (!gecko) return false;
    return /Android/.test(ua) || (navigator.maxTouchPoints || 0) > 0;
  }
  /* דפדפן אנדרואיד שזוהה בוודאות ואינו כרום. בכרום עצמו אי אפשר
     לדעת אם זה כרום או החלון של וואטסאפ - הם מזדהים אותו דבר. */
  /* **אדג' מתקין.** נבדק במכשיר: ההתקנה ממנו עובדת, ולכן הוא אינו
     "דפדפן אחר" שמפנים ממנו לכרום - יש לו מדריך קצר משלו (join). */
  function edge() {
    return !isIOS() && /EdgA\//.test(navigator.userAgent || '');
  }
  function otherBrowser() {
    var ua = navigator.userAgent || '';
    return !isIOS() && !firefox() && !edge() &&
      /SamsungBrowser|OPR\/|OPT\/|Opera|YaBrowser|MiuiBrowser|XiaoMi|UCBrowser|DuckDuckGo|HuaweiBrowser|HeyTapBrowser/.test(ua);
  }

  /* ההצעה של הדפדפן להתקין. באייפון היא לא קיימת ולעולם לא
     תגיע - שם נשארות ההוראות בלבד. */
  var BIP = null, ON_BIP = [];
  /* ============================================================
     דיווח אנונימי לניהול ← התקנה: הוצעה התקנה, מה ענו לה, ומה
     ענו לבקשת ההתראות. רק join.html מגדיר את `APPX_HIT` (ראו hit
     שם); עד שהוא נטען - בתור. בשאר העמודים זה לא הולך לשום מקום. */
  var TEL_Q = [];
  function tel(s, x) {
    try { if (window.APPX_HIT) window.APPX_HIT(s, x); else if (TEL_Q.length < 10) TEL_Q.push([s, x]); } catch (e) {}
  }
  function telFlush() {
    var q = TEL_Q; TEL_Q = [];
    q.forEach(function (a) { tel(a[0], a[1]); });
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); BIP = e; tel('bip');
    ON_BIP.forEach(function (f) { try { f(); } catch (x) {} });
  });
  window.addEventListener('appinstalled', function () {
    BIP = null; mark();
    ON_BIP.forEach(function (f) { try { f(); } catch (x) {} });
  });

  /* ============================================================
     "נתקע" - עברו כמה שניות ואף הצעת התקנה לא הגיעה.
     ============================================================
     `inApp()` מזהה חלון-בתוך-אפליקציה לפי מחרוזת הדפדפן, וזה
     עובד לפייסבוק/אינסטגרם/וכד'. וואטסאפ באנדרואיד שונה: הוא
     פותח קישורים ב-Custom Tab שמזדהה בדיוק כמו כרום רגיל, כולל
     ב-user agent - ואין שום מחרוזת לזהות בה "זה וואטסאפ".

     מה שכן אפשר לבדוק: `beforeinstallprompt` הוא הסימן היחיד
     שההתקנה בכלל זמינה מכאן, ואם הוא לא הגיע תוך זמן סביר -
     לא משנה בדיוק למה (Custom Tab, גרסת כרום ישנה, מדיניות
     ארגונית) - האדם תקוע באותה נקודה בדיוק כמו מי שזוהה
     כ-`inApp()`. אותה תרופה: לצאת לדפדפן אמיתי או להעתיק קישור. */
  /* ============================================================
     **הניחוש הזה בוטל.**
     ============================================================
     "המסך הזה קופץ גם בגוגל כרום - קודם מופיע המסך הרגיל, ואחרי
     רגע קצר זה קופץ." כרום רגיל לא תמיד מציע התקנה תוך שלוש
     וחצי שניות, ולכן תלמידים בכרום אמיתי קיבלו "אתם בתוך וואטסאפ"
     והועברו הלאה. `stuck()` נשאר (ה-API משמש כמה עמודים) ותמיד
     אומר לא. במקומו: המסך הרגיל, ובתחתיתו מסגרת וואטסאפ קבועה -
     ראו `waBox()` למטה. */
  var ON_STUCK = [];
  function stuck() { return false; }

  function mark() { try { localStorage.setItem('df:appAdded', '1'); } catch (e) {} }

  /* ============================================================
     מסגרת וואטסאפ - בראש כל מסך התקנה.
     ============================================================
     אין דרך לזהות את הדפדפן שבתוך וואטסאפ, ולכן היא קבועה
     ואינה מחליפה דבר. המלל ב-ASK_UI (data.js), וההעתקה -
     מאזין אחד לכל העמודים, לפי `data-wa-copy`.

     "ההודעה לא חסכנית, והיא למטה - אפשר לפספס אותה."
     ============================================================
     עכשיו היא בראש מסך ההתקנה, שורה אחת עם הסמלים של וואטסאפ
     ושל כרום (באייפון - ספארי), וכפתור אחד:
       · **אנדרואיד** - "פתיחה בכרום" פותח את כרום עצמו
         (`intent://`, כמו `toBrowser`). מי שכבר בכרום מקבל את
         אותו עמוד בלשונית - בלי נזק. לצידו קישור העתקה קטן,
         למי שאין לו כרום.
       · **אייפון** - אין מסגרת. וואטסאפ באייפון פותח קישורים
         ישר בספארי, ולא בדפדפן פנימי, ולכן אין ממה לצאת.
     ומי שהדפדפן כבר הציע לו להתקין, או שהוא בפיירפוקס (שיש לו
     מדריך משלו) - אינו בוואטסאפ, ואינו רואה את המסגרת כלל. */
  /* ============================================================
     "יותר הבנה, פחות מלל" (בריף 30.9, 8.99.81).
     ============================================================
     המסגרת מספרת את עצמה בציור: הסמל של המקום שבו האדם נמצא,
     חץ, והסמל של המקום שאליו עוברים. החץ בין הסמלים ולא על
     הכפתור - הוא ההסבר, והכפתור הוא הפעולה.

     **כיוון החץ לפי כיוון העמוד.** בעברית "מכאן לשם" נקרא מימין
     לשמאל: וואטסאפ מימין, כרום משמאל, והחץ מצביע שמאלה. בעמוד
     משמאל לימין הוא מתהפך מעצמו. הנקודות זורמות לאורכו לאט -
     ומי שביקש מהטלפון פחות תנועה מקבל חץ עומד. */
  var IC = {
    wa: '<circle cx="16" cy="16" r="15" fill="#25D366"/>' +
      '<path fill="#fff" d="M16 7.2a8.8 8.8 0 0 0-7.6 13.2L7.2 24.8l4.5-1.2A8.8 8.8 0 1 0 16 7.2zm0 16a7.2 7.2 0 0 1-3.7-1l-.3-.2-2.7.7.7-2.6-.2-.3A7.2 7.2 0 1 1 16 23.2z"/>' +
      '<path fill="#fff" d="M20 17.6c-.2-.1-1.3-.7-1.5-.7s-.3-.1-.5.1-.6.7-.7.9-.3.2-.5.1a5.9 5.9 0 0 1-2.9-2.6c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.8 4.2 4.2 0 0 0 .9 2.2 9.6 9.6 0 0 0 3.7 3.3c1.4.6 1.9.6 2.6.5a2.2 2.2 0 0 0 1.5-1c.2-.5.2-.9.1-1l-.3-.3z"/>',
    chrome: '<path d="M16 16L3 8.5A15 15 0 0 1 29 8.5z" fill="#DB4437"/>' +
      '<path d="M16 16L29 8.5A15 15 0 0 1 16 31z" fill="#F4B400"/>' +
      '<path d="M16 16L16 31A15 15 0 0 1 3 8.5z" fill="#0F9D58"/>' +
      '<circle cx="16" cy="16" r="7" fill="#fff"/><circle cx="16" cy="16" r="5.4" fill="#4285F4"/>',
    safari: '<circle cx="16" cy="16" r="15" fill="#1A8CFF"/><circle cx="16" cy="16" r="12" fill="#fff"/>' +
      '<path d="M22 10l-7.5 4.5L16 16z" fill="#FF3B30"/><path d="M10 22l4.5-7.5L16 16z" fill="#FF3B30"/>' +
      '<path d="M22 10l-6 6 1.5 1.5z" fill="#C7CDD6"/><path d="M10 22l6-6-1.5-1.5z" fill="#C7CDD6"/>',
    /* דפדפן אחר (סמסונג, אופרה, כרום באייפון...) - כדור כללי, ולא
       סמל של חברה שאולי אינה זו שבידו. */
    web: '<circle cx="16" cy="16" r="15" fill="#5A6780"/>' +
      '<g fill="none" stroke="#fff" stroke-width="1.6"><circle cx="16" cy="16" r="9"/>' +
      '<ellipse cx="16" cy="16" rx="4" ry="9"/><path d="M7 16h18M8.6 11.5h14.8M8.6 20.5h14.8"/></g>'
  };
  var TO_C = { chrome: '#4285F4', safari: '#1A8CFF' };
  function ic(k) {
    return '<svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true" ' +
      'style="display:block;flex:none;filter:drop-shadow(0 2px 4px rgba(11,37,80,.18))">' +
      IC[k] + '</svg>';
  }
  function rtl() {
    try {
      var d = window.getComputedStyle && getComputedStyle(document.body || document.documentElement).direction;
      if (d) return d === 'rtl';
    } catch (e) {}
    return (document.documentElement.getAttribute('dir') || '').toLowerCase() === 'rtl';
  }
  function flowCss() {
    if (document.getElementById('wa-flow-css')) return;
    var s = document.createElement('style');
    s.id = 'wa-flow-css';
    s.textContent = '@keyframes waFlow{to{stroke-dashoffset:-14}}' +
      '.wa-flow{animation:waFlow 1.2s linear infinite}' +
      '@media (prefers-reduced-motion:reduce){.wa-flow{animation:none}}';
    (document.head || document.documentElement).appendChild(s);
  }
  /* מאיפה ← לאן. החץ מצויר ימינה ומתהפך בעמוד מימין לשמאל. */
  function flow(from, to) {
    flowCss();
    var c2 = TO_C[to] || '#4285F4', c1 = from === 'wa' ? '#25D366' : '#8A94A8';
    var arrow = '<svg viewBox="0 0 60 16" width="60" height="16" aria-hidden="true" ' +
      'style="display:block;flex:none;overflow:visible' + (rtl() ? ';transform:scaleX(-1)' : '') + '">' +
      /* userSpaceOnUse: קו ישר הוא תיבה בגובה אפס, ושם מעבר צבע
         יחסי אינו מצויר כלל. */
      '<defs><linearGradient id="wa-flow-g" gradientUnits="userSpaceOnUse" x1="3" x2="46" y1="8" y2="8">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/>' +
      '</linearGradient></defs>' +
      '<path class="wa-flow" d="M3 8H46" fill="none" stroke="url(#wa-flow-g)" ' +
      'stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7"/>' +
      '<path d="M46 2.5L54 8L46 13.5" fill="none" stroke="' + c2 + '" ' +
      'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<div aria-hidden="true" style="display:flex;align-items:center;' +
      'justify-content:center;gap:10px;margin:2px 0 10px">' +
      ic(from) + arrow + ic(to) + '</div>';
  }
  /* הכתובת שעוברת לכרום נושאת `nointro=1`: מי שעובר מוואטסאפ לכרום
     כבר ראה את הדגמת הפתיחה, והוא באמצע התקנה - לא מראים לו שוב
     (ראו intro ב-join.html). לכרום יש אחסון משלו, ולכן הזיכרון
     במכשיר לא היה עוזר כאן. */
  function noIntroHref() {
    var h = location.href.split('#')[0];
    if (/[?&]nointro=1/.test(h)) return h;
    return h + (h.indexOf('?') < 0 ? '?' : '&') + 'nointro=1';
  }
  function chromeUrl() {
    var u = noIntroHref().replace(/^https?:\/\//, '');
    return 'intent://' + u + '#Intent;scheme=https;package=com.android.chrome;' +
           'S.browser_fallback_url=' + encodeURIComponent(noIntroHref()) + ';end';
  }
  /* המסגרת עצמה - אחת לכל המסלולים, ורק מה שבתוכה משתנה:
       from/to - הסמלים שמשני צידי החץ
       t/b     - הכותרת והשורה שמתחת
       href    - הכפתור הראשי ("פתיחה בכרום"). בלעדיו - אין כפתור.
     ההעתקה תמיד שם, **כגיבוי**: קישור קטן ליד הכפתור. רק כשאין
     כפתור ראשי (אייפון - אין דרך אמינה לפתוח את ספארי מבחוץ)
     היא נראית ככפתור, כדי שיהיה על מה ללחוץ. */
  function frame(o) {
    var U = window.ASK_UI || {};
    var btn = 'display:inline-block;padding:10px 20px;border:0;border-radius:12px;' +
      'background:#25D366;color:#fff;font:inherit;font-size:.9rem;font-weight:800;' +
      'cursor:pointer;text-decoration:none;box-shadow:0 3px 10px rgba(37,211,102,.28)';
    var copy = o.href
      ? '<button type="button" data-wa-copy="1" style="margin-inline-start:14px;padding:4px 0;' +
        'border:0;background:none;color:#5A6780;font:inherit;font-size:.8rem;font-weight:700;' +
        'text-decoration:underline;cursor:pointer">' + esc(U.waBoxGo || '') + '</button>'
      : '<button type="button" data-wa-copy="1" style="padding:8px 16px;border:1.5px solid #25D366;' +
        'border-radius:12px;background:#fff;color:#1B7A43;font:inherit;font-size:.84rem;' +
        'font-weight:800;cursor:pointer">' + esc(U.waBoxGo || '') + '</button>';
    return '<div class="wa-box" style="margin:0 0 14px;padding:14px 14px 13px;' +
      'border:1.5px solid #25D366;border-radius:16px;background:rgba(37,211,102,.07);' +
      'text-align:center;line-height:1.4">' + flow(o.from, o.to) +
      (o.t ? '<b style="display:block;font-size:.9rem;font-weight:800;color:#1B2A45">' +
        esc(o.t) + '</b>' : '') +
      (o.b ? '<span style="display:block;margin-top:2px;font-size:.82rem;font-weight:600;color:#5A6780">' +
        esc(o.b) + '</span>' : '') +
      '<div style="margin-top:11px;display:flex;align-items:center;justify-content:center;' +
      'flex-wrap:wrap;row-gap:6px">' +
      (o.href ? '<a href="' + esc(o.href) + '" style="' + btn + '">' + esc(o.go || U.openGo || '') + '</a>' : '') +
      copy + '</div></div>';
  }
  /* ============================================================
     `watch` - הנחיה ולא שאלה (עמוד ההצטרפות בלבד).
     ============================================================
     "במקום שבן אדם יעצור ויחשוב 'רגע, אני בוואטסאפ?' - הוא לוחץ
     על כפתור בשנייה אחת." אם היה בוואטסאפ - עבר לכרום; אם היה
     בכרום - נפתח עוד חלון, ולא קרה כלום.

     ולכן בלי מסגרת, בלי סמלים, בלי כותרת ובלי "העתקת הקישור":
     כפתור כחול אחד, כמו כל כפתור של המסע - "צפו בתהליך ההתקנה"
     (`watchGo`). מה שנפתח בכרום הוא בדיוק ההדגמה. המחלקה `wa-box`
     נשארת כדי שהעמוד יזהה את הלחיצה (ראו WZ_WENT ב-join.html).
     עמודים אחרים (הצוות, הבקשה האישית) אינם מבקשים את זה,
     ושם המסגרת נשארת כמו שהייתה. */
  function watchFrame(o, watch) {
    if (!watch || !o.href) return frame(o);
    var U = window.ASK_UI || {};
    return '<div class="wa-box"><a class="wznext" href="' + esc(o.href) + '">' +
      esc(U.watchGo || U.openGo || '') + '</a></div>';
  }
  function waBox(watch) {
    /* **גם כשיש הצעת התקנה.** קודם המסגרת הוסתרה כשהדפדפן הציע
       להתקין - אבל דפדפן סמסונג מציע, וההתקנה ממנו היא בדיוק זו
       שנחסמת. תלמיד לחץ "הוספה למסך הבית", קיבל "אפליקציה לא
       בטוחה נחסמה", ורק אחרי זה ראה את המסגרת. עכשיו היא שם מההתחלה,
       ואומרת מראש שבכרום זה לא ייחסם. */
    if (isIOS() || firefox() || edge() || standalone()) return '';
    /* כרום שהציע התקנה הוא כרום אמיתי - החלון של וואטסאפ לא מציע.
       (בסמסונג ההצעה קיימת, והיא בדיוק זו שנחסמת - שם נשארים.) */
    var other = otherBrowser();
    if (!other && BIP) return '';
    var U = window.ASK_UI || {};
    /* בסמסונג - גם למה: אחרת "רק בכרום" נקרא כטעות שלנו. */
    var sub = !other ? U.waBoxB : (samsung() ? (U.waBoxSamB || U.waBoxOB) : U.waBoxOB);
    return watchFrame({ from: other ? 'web' : 'wa', to: 'chrome',
                   t: other ? U.waBoxOT : U.waBoxT, b: sub, href: chromeUrl() }, watch);
  }
  /* ============================================================
     המסגרת גם במסך "אתם בתוך אפליקציה".
     ============================================================
     עד 8.99.80 המסך הזה חזר מוקדם, עם פסקה צהובה ובלי המסגרת -
     כלומר דווקא מי שזוהה בוודאות כתקוע קיבל את ההסבר הכי מילולי.
     עכשיו אותה מסגרת, עם היעד הנכון:
       · **אנדרואיד** - כרום, וכפתור שפותח אותו (`toBrowser`).
       · **אייפון** - ספארי. אין כפתור אמין, ולכן ההנחיה וההעתקה.
       · **כרום/פיירפוקס באייפון** - דפדפן אמיתי, לא אפליקציה.
         יעד ספארי, והנוסח שלו (`iosOth*`).
     מחזיר '' כשאין מאיפה לצאת. */
  function outBox(watch) {
    var U = window.ASK_UI || {};
    if (iosOther()) return frame({ from: 'web', to: 'safari', t: U.iosOthH, b: U.iosOthB });
    if (!inApp()) return '';
    if (isIOS()) {
      return frame({ from: 'wa', to: 'safari', t: U.inAppH,
                     b: [U.inAppB || '', U.inAppIos || ''].join(' ').trim() });
    }
    return watchFrame({ from: 'wa', to: 'chrome', t: U.inAppH,
                   b: U.inAppB, href: toBrowser() }, watch);
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-wa-copy]') : null;
    if (!b) return;
    var U = window.ASK_UI || {};
    var ok = function () { b.textContent = U.waBoxOk || '✓'; };
    var bad = function () { b.textContent = location.href; };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(ok, function () {
          legacyCopy(location.href) ? ok() : bad();
        });
      } else if (legacyCopy(location.href)) ok(); else bad();
    } catch (x) { bad(); }
  });
  function legacyCopy(txt) {
    var t = document.createElement('textarea');
    t.value = txt; t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:-999px;opacity:0';
    document.body.appendChild(t); t.select();
    var r = false;
    try { r = document.execCommand('copy'); } catch (x) {}
    document.body.removeChild(t);
    return r;
  }
  function wasAdded() {
    try { return localStorage.getItem('df:appAdded') === '1'; } catch (e) { return false; }
  }
  /* **באנדרואיד די בכך שהדפדפן דיווח שהתקין.** המנוי שייך
     לאתר ולא לחלון, ולכן אישור שניתן בדפדפן עובד גם מהאייקון.
     באייפון אין דיווח כזה ואין התראות מחוץ לאפליקציה - ולכן
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
     בלי השומר הזה כל נרשם היה נרשם פעמיים - שני מנויים לאותו
     מכשיר, ושתי התראות על כל הודעה. */
  function ask(cb) {
    var done = false;
    var after = function (p) {
      if (done) return;
      done = true;
      tel('perm', p === 'granted' ? 'granted' : (p === 'denied' ? 'denied' : 'dismissed'));
      cb(p === 'granted' ? 'granted' : (p === 'denied' ? 'denied' : 'default'));
    };
    if (!canNote()) { tel('perm', 'unsupported'); cb('none'); return; }
    try {
      var pr = Notification.requestPermission(after);
      if (pr && pr.then) pr.then(after)['catch'](function () { after('default'); });
    } catch (e) { tel('perm', 'unsupported'); cb('none'); }
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
     התראה - ואז תשאל אותו: קיבלת?"

     **מקומית, דרך ה-Service Worker, ולא דרך השרת.** דחיפה
     אמיתית נוסעת דרך GitHub Actions ומגיעה בעוד דקה ארוכה -
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
  /* שלוש שוכבות - התפריט בספארי החדש. שלוש עומדות - כרום
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

  /* `mode`: '' - האייקון בלבד · 'add' - עם "+", לפני ההתקנה: זה
     מה שיתווסף · 'tap' - עם אצבע וגלים, אחרי: לוחצים עליו. העיצוב
     של שני האחרונים ב-join.html (`.apic.add`, `.apic.tap`). */
  function icon(mode) {
    var m = mode === 'add' || mode === 'tap' ? mode : '';
    var fx = m === 'add' ? '<i class="ap-add" aria-hidden="true">+</i>'
      : m === 'tap' ? '<i class="ap-ring" aria-hidden="true"></i>' +
        '<i class="ap-tap" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26">' +
        '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l4.3.9a2 2 0 0 1 1.6 2.2l-.6 4.6a3 3 0 0 1-3 2.6h-3.6a3 3 0 0 1-2.4-1.2L5.4 15a1.4 1.4 0 0 1 2.1-1.8L9 14.6z" ' +
        'fill="#fff" stroke="#1B2A45" stroke-width="1.5" stroke-linejoin="round"/></svg></i>'
      : '';
    var img = '<img src="icon-192.png" alt="">';
    return '<div class="apic' + (m ? ' ' + m : '') + '">' +
           (m ? '<b class="ap-i">' + img + fx + '</b>' : img) +
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
         מה ללחוץ - המסלול הנכון היה קבור בהערת שוליים. וזה בדיוק
         המקום שבו ר"ם לחץ "שיתוף" ושלח את הקישור לעצמו בוואטסאפ
         במקום להוסיף למסך הבית.

         **ופיצול לפי גרסה אינו פותר את זה.** הקישור מגיע
         בוואטסאפ ונפתח בדפדפן שבתוכו, ושם הסרגל הוא של וואטסאפ
         ולא של ספארי: שלוש נקודות בצד שמאל, בכל מכשיר ובכל
         גרסה. לכן הוראה אחת שמתחילה בשלוש הנקודות, ומי שרואה
         את סמל השיתוף בסרגל מוזמן ללחוץ עליו ישירות. אותו סדר
         בדיוק במדריך המאויר - ראו `guide.js`. */
      return '<ol class="gsteps">' +
        '<li>לחצו על שלוש הנקודות ' + DOTS_H + ' שבסרגל שלמטה, ' +
          'ואז על <b>"שיתוף"</b>.<br>' +
          '<b>רואים כבר את סמל השיתוף ' + SHARE + ' בסרגל?</b> ' +
          'לחצו עליו ישירות.</li>' +
        '<li>גללו למטה ובחרו <b>"הוספה למסך הבית"</b>, ואז "הוסף".<br>' +
          '<b>אין ברשימה?</b> גללו עד הסוף, "עריכת פעולות", ' +
          'והוסיפו אותה משם.</li>' +
        '<li><b>פתחו את האייקון החדש</b> שנוסף למסך הבית - ומשם ' +
          'נמשיך.</li></ol>' + icon();
    }
    if (firefox()) {
      return '<ol class="gsteps">' +
        '<li>לחצו על שלוש הנקודות ' + DOTS_V + ' בפינת הדפדפן.</li>' +
        '<li>לחצו על החץ שליד <b>"עוד"</b>.</li>' +
        '<li>בחרו <b>"הוספת יישומון למסך הבית"</b>, ואז "הוסף".</li>' +
        '<li><b>פתחו את האייקון החדש</b> שנוסף למסך הבית.</li></ol>' + icon();
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
     שלו - הוראות אנדרואיד לאייפון הן אותה תקלה, הפוך. */
  function unblock() {
    return isIOS()
      ? 'ב<b>הגדרות ← הדף השבועי ← התראות</b>'
      : 'ב<b>הגדרות ← אפליקציות ← הדף השבועי ← התראות</b>';
  }

  /* ============================================================
     עדכון גרסה - מעצמו, בלי שיבקשו ממנו.
     ============================================================
     עד כאן העדכון היה פס ירוק שכתוב עליו "גרסה חדשה זמינה -
     לחצו לעדכון", והוא **חיכה ללחיצה**. בשטח זה אומר שהוא לא
     קורה: ראש חטיבה שפתח את האפליקציה לפני שבועיים ממשיך
     לראות את הגרסה של אז, בלי לדעת שיש חדשה ובלי לדעת שהפס
     הזה בכלל מיועד לו. תיקון שיצא לאוויר ולא הגיע לטלפון הוא
     תיקון שלא קרה.

     עכשיו זה הפוך: עובד־השירות החדש נכנס לתפקיד מיד
     (`skipWaiting` ב-sw.js), לוקח שליטה, והעמוד טוען את עצמו
     מחדש. הקפיצה נמשכת רגע, ואחריה נשארת שורה ירוקה קצרה
     שאומרת שזה קרה - ונעלמת לבד.

     שלוש הגנות, וכל אחת מהן נובעת ממשהו שנשבר:

     · **השתלטות ראשונה אינה עדכון.** בביקור הראשון אין עדיין
       עובד־שירות, הוא נרשם עכשיו ולוקח שליטה - וזה מפעיל את
       אותו אירוע בדיוק. בלי הבדיקה הזו כל כניסה ראשונה הייתה
       נטענת פעמיים, ומסך הפתיחה היה מהבהב.

     · **לא באמצע הקלדה.** מי שכותב הודעה בפינה שלו, או ממלא
       את שמו בטופס, מאבד את מה שהקליד ברענון. במקרה כזה
       הרענון ממתין עד שהוא מסיים - ולא מוותר.

     · **פעם אחת.** `refreshing` חוסם רענון שני, כי שני
       מאזינים שרצים יחד על אותו אירוע הם לולאה.
     ============================================================ */
  var upReady = false, upBusy = false, upHad = false;

  /* השורה הירוקה. היא מגיעה **אחרי** הרענון, ולכן הסימון עובר
     דרך האחסון: העמוד שמצייר אותה אינו העמוד שידע שהעדכון קרה.
     `sessionStorage` ולא `localStorage` - סימון שנשאר על
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
    var el = upEl();
    /* הנוסח מ-data.js, ככל נוסח אחר. נפילה לברירת מחדל רק אם
       data.js ישן יושב במטמון. */
    el.textContent = (window.UI && UI.updated) || 'האפליקציה עודכנה';
    el.onclick = null;
    el.style.cursor = 'default';
    el.className = 'on';
    setTimeout(function () { el.className = ''; }, 4000);
  }
  function upEl() {
    /* בעמוד הראשי כבר יש פס כזה ומעוצב. בשאר העמודים אין,
       ולכן הוא נבנה כאן - אותו מראה בדיוק בשלושתם. */
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
    return el;
  }

  /* הקלדה פתוחה? ממתינים לסופה. */
  function upTyping() {
    var a = document.activeElement;
    if (!a) return false;
    var t = (a.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' ||
           a.isContentEditable === true;
  }
  /* ============================================================
     **עדכון שקט.** (בריף 30.9)
     ============================================================
     "בכל גרסה חדשה המשתמש רואה את המסך קופץ ואת ההודעה - והמסך
     הראשי כמעט לא משתנה." מעכשיו: הגרסה החדשה נטענת ברקע, והרענון
     קורה **כשהאפליקציה ברקע** (המשתמש עבר לאפליקציה אחרת) - הוא
     אינו רואה אותו, וכשהוא חוזר הכל כבר חדש. פתיחה הבאה ממילא
     טוענת את החדש.

     **רק תיקון קריטי מודיע** - גרסה שמסומנת ב-`UPD_CRITICAL`
     ב-data.js (החדש, כפי שהוא בשרת). אז: שורה "יש עדכון חשוב -
     לחצו", והרענון בלחיצה. לא נוגעים במנוי ההתראות.
     ============================================================ */
  var upPending = false;
  /* **מעבר לעמוד אחר גם הוא "הסתתרות".** לחיצה על "פתיחת הדף"
     הסתירה את המסך בדרך אל הדף - והרענון שחיכה לרגע הזה ביטל את
     המעבר וטען מחדש את המסך הראשי. מי שלחץ ראה את המסך "מתרענן",
     ורק בלחיצה השנייה עבר. עכשיו: מי שעוזב את העמוד אינו מרוענן -
     העמוד הבא ממילא נטען בגרסה החדשה. וגם רגע של המתנה, כי בחלק
     מהדפדפנים ההסתתרות מגיעה לפני הסימן שעוזבים. */
  var upLeaving = false;
  window.addEventListener('beforeunload', function () { upLeaving = true; });
  window.addEventListener('pagehide', function () { upLeaving = true; });
  window.addEventListener('pageshow', function () { upLeaving = false; });
  function upLater() {
    if (upPending) return;
    upPending = true;
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { upLeaving = false; return; }
      if (upBusy || upLeaving) return;
      setTimeout(function () {
        if (document.hidden && !upBusy && !upLeaving) { upBusy = true; location.reload(); }
      }, 400);
    });
    /* תיקון קריטי? נקרא מה-data.js החדש. */
    try {
      fetch('data.js?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.text(); })
        .then(function (t) {
          var c = /UPD_CRITICAL\s*=\s*'([^']*)'/.exec(t), v = /DAF_REV\s*=\s*'([^']*)'/.exec(t);
          if (c && v && c[1] && c[1] === v[1]) upCrit();
        })['catch'](function () {});
    } catch (e) {}
  }
  function upCrit() {
    var el = upEl();
    el.textContent = (window.UI && UI.updCrit) || 'יש עדכון חשוב - לחצו כאן';
    el.style.cursor = 'pointer';
    el.className = 'on';
    el.onclick = function () { upGo(); };
  }
  function upGo() {
    if (upBusy) return;
    if (upTyping()) {
      /* לא מוותרים - רק ממתינים. `blur` מגיע ברגע שהוא מסיים. */
      document.activeElement.addEventListener('blur', function () {
        setTimeout(upGo, 120);
      }, { once: true });
      return;
    }
    upBusy = true;
    location.reload();
  }

  function update() {
    if (upReady || !('serviceWorker' in navigator)) return;
    upReady = true;
    upBar();                       /* אולי בדיוק חזרנו מרענון */
    upHad = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!upHad) return;          /* השתלטות ראשונה אינה עדכון */
      upLater();
    });

    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var poke = function () { try { reg.update(); } catch (e) {} };
      poke();
      setInterval(poke, 3600000);
      /* חזרה לאפליקציה אחרי שהייתה ברקע - שם רוב הזמן נשמר,
         ושם `setInterval` של אייפון פשוט אינו רץ. */
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) poke();
      });
      /* עובד שכבר ממתין מגרסה קודמת - לדחוף אותו פנימה עכשיו.
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

     מהדפדפן המוטמע אי אפשר להתקין - אין בו "הוספה למסך הבית"
     ואין בו הצעת התקנה - ולכן כל מי שמגיע משם נתקע. הבקשה
     "תפתחו בדפדפן" בעברית פשוטה עובדת, אבל היא עוד שלב שאפשר
     לטעות בו.

     **באנדרואיד יש דרך אמיתית:** כתובת `intent://` פותחת את
     כרום עצמו. `browser_fallback_url` דואג שמי שאין לו כרום
     פשוט יישאר איפה שהוא ולא ייתקל בשגיאה.

     **באייפון אין דרך כזו.** כל מה שקיים שם הן סכמות פרטיות
     שאינן מובטחות, וכפתור שלפעמים לא עושה כלום גרוע מהיעדרו.
     שם נשארת ההנחיה, והיא מדויקת: בתפריט של וואטסאפ יש
     "פתיחה בדפדפן".

     **וכרום דווקא, ולא "דפדפן ברירת המחדל".** זה נראה כמו
     הכללה מיותרת עד שרואים למה: בשני מכשירי סמסונג בשטח
     ההתקנה מדפדפן סמסונג נחסמה על ידי Play Protect ("אפליקציה
     לא בטוחה נחסמה"), ובשניהם ברירת המחדל היא דפדפן סמסונג.
     החבילה שנחסמת נוצרת על ידי הדפדפן עצמו, ולכן דפדפן אחר
     פותר את זה וכתובת אחרת אצלנו לא. לכן גם דפדפן סמסונג -
     ולא רק דפדפן של אפליקציה אחרת - מקבל את הכפתור הזה.

     מחזיר '' כשאין מה להציע - והמסך שמעליו יודע להסתדר. */
  function toBrowser() {
    if (isIOS()) return '';
    if (!inApp() && !samsung()) return '';
    var u = noIntroHref().replace(/^https?:\/\//, '');
    return 'intent://' + u + '#Intent;scheme=https;' +
           'package=com.android.chrome;' +
           'S.browser_fallback_url=' + encodeURIComponent(noIntroHref()) + ';end';
  }

  return {
    update: update, toBrowser: toBrowser,
    isIOS: isIOS, iosVer: iosVer, standalone: standalone, inApp: inApp,
    iosOther: iosOther, samsung: samsung, firefox: firefox, otherBrowser: otherBrowser, edge: edge,
    installed: installed, wasAdded: wasAdded, mark: mark,
    bip: function () { return BIP; },
    onBip: function (f) { ON_BIP.push(f); },
    stuck: stuck,
    waBox: waBox, outBox: outBox,
    onStuck: function (f) { ON_STUCK.push(f); },
    /* ============================================================
       אישור בחלון ההתקנה אינו התקנה.
       ============================================================
       "הכל סומן v, הכל עבר בשלום - ואז חיפשתי את האייקון במסך
       הבית ולא מצאתי."

       כאן נרשם "הותקן" ברגע ש-`userChoice` חזר `accepted`,
       כלומר ברגע שהאדם לחץ "התקן" בחלון של הדפדפן. מה שקורה
       *אחרי* הלחיצה לא נבדק - ובשטח דווקא שם זה נכשל: Play
       Protect חסם את ההתקנה, לא נוצר אייקון, והאשף בכל זאת
       סימן וי והמשיך הלאה. משם והלאה הכול היה שגוי: המסך אמר
       שהאפליקציה מותקנת, וההתראות לא היו יכולות להגיע.

       הראיה היחידה להתקנה היא האירוע `appinstalled`, והוא זה
       שרושם. כאן ממתינים לו, ואם הוא אינו מגיע - לא מכריזים
       על הצלחה. המסך שמעל יודע לומר מה לעשות.
       ============================================================ */
    prompt: function (after) {
      var p = BIP; if (!p) { after(false); return; }
      p.prompt();
      var done = false;
      /* `why`: 'no' - הוא סגר את החלון · 'stuck' - הוא אישר
         וההתקנה לא הגיעה. שני מצבים שונים לגמרי, ומסך שאומר
         לשניהם את אותו דבר טועה באחד מהם. */
      var finish = function (okd, why) {
        if (done) return; done = true;
        after(okd, why);
      };
      var back = function (r) {
        tel('inst', r && r.outcome === 'accepted' ? 'accepted' : 'dismissed');
        if (!(r && r.outcome === 'accepted')) { finish(false, 'no'); return; }
        BIP = null;
        /* אושר - ועכשיו ממתינים לראיה. חלון של שמונה שניות:
           די לכל התקנה שמצליחה, וקצר מכדי להיראות כתקיעה. */
        if (wasAdded()) { finish(true); return; }
        ON_BIP.push(function () { if (wasAdded()) finish(true); });
        setTimeout(function () { finish(wasAdded(), 'stuck'); }, 8000);
      };
      if (p.userChoice && p.userChoice.then) p.userChoice.then(back)['catch'](back);
      else back(null);
    },
    canNote: canNote, perm: perm, ask: ask, subscribe: subscribe, demo: demo, telFlush: telFlush,
    howList: howList, icon: icon, unblock: unblock,
    SHARE: SHARE, DOTS_H: DOTS_H, DOTS_V: DOTS_V
  };
})();
