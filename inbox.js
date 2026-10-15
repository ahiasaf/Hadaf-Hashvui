/* ============================================================
   ההודעה המלאה — בתוך האפליקציה.
   ============================================================
   "קפצה לי התראה, היא קטנה מדי, לחצתי עליה ונכנסתי לאפליקציה —
   וכבר לא ראיתי אותה." התראה מראה שורה או שתיים, ולחיצה עליה
   מעלימה אותה. ורבים בכלל לא רואים התראות: חסמו, לא אישרו, או
   שהטלפון מושתק.

   לכן כל הודעה שנשלחת נשמרת גם ב"תיבה" (ראו inboxRow ב-
   tools/push-send.js), עם המזהים של כל מי שהיא נועדה לו — אותו
   פילוח בדיוק של ההתראה, כולל מי שההתראות אצלו חסומות. כאן,
   בכל פתיחה של האפליקציה, שואלים את השרת (`?inbox=`) אם יש
   הודעה שעוד לא הוצגה במכשיר הזה, ומציגים אותה בחלונית: הכותרת,
   הנוסח המלא, וכפתור אחד.

   מה שכבר הוצג נזכר במכשיר (`df:inboxSeen`) ואינו חוזר. הודעה
   ותיקה מ-INBOX_DAYS ימים (בשרת) אינה מוצגת כלל.

   נטען בכל עמוד שאליו מגיעים מהתראה או מהאייקון: הבית
   (שמעביר תלמיד והורה למסך ההצטרפות), ההצטרפות, הדף והצוות.

   הקובץ אינו נשען על דבר שקיים בעמוד אחד בלבד: המזהה מגיע
   מ-learned.js (תלמיד, הורה) או מ-ask.js (איש צוות), אם נטענו.
   ============================================================ */

var INBOX = (function () {

  var SEEN_KEY = 'df:inboxSeen', LAST = 0, OPEN = false, QUEUE = [];

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  /* כוכביות מדגישות, כמו בוואטסאפ — אותו כלל של emph ב-index.html. */
  function emph(t) {
    return esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>');
  }

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') || []; }
    catch (e) { return []; }
  }
  function markSeen(mid) {
    var s = seen();
    if (s.indexOf(mid) >= 0) return;
    s.push(mid);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(s.slice(-60))); } catch (e) {}
  }

  /* מי אני — כל המזהים שהמכשיר מחזיק. תלמיד או הורה (learned.js),
     ואיש צוות (ask.js). */
  function me() {
    var ids = [], first = '';
    try {
      var m = typeof LMe === 'function' ? LMe() : null;
      if (m && m.id) { ids.push(String(m.id)); first = m.first || ''; }
    } catch (e) {}
    try {
      var a = (typeof ASK !== 'undefined' && ASK.get) ? ASK.get() : null;
      if (a && a.id && ids.indexOf(String(a.id)) < 0) ids.push(String(a.id));
    } catch (e2) {}
    return { ids: ids, first: first };
  }

  /* הפנייה בשם — {name} הופך לשם הפרטי; אין שם — הפנייה יורדת
     כולה. אותו כלל של `personal` ב-tools/push-send.js. */
  function personal(t, first) {
    if (first) return String(t || '').replace(/\{name\}/g, first);
    return String(t || '').replace(/\{name\}[,،]?\s*/g, '');
  }

  function api() {
    var u = '';
    try { u = localStorage.getItem('dfApi') || ''; } catch (e) {}
    if (!u && typeof APPS_SCRIPT_URL !== 'undefined') u = APPS_SCRIPT_URL;
    return String(u || '').trim();
  }

  function when(ms) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getDate() + '.' + (d.getMonth() + 1) + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------- העיצוב ---------- */
  var CSS =
    '.ibx-bg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;' +
      'justify-content:center;background:rgba(11,37,80,.42);padding:0;' +
      'animation:ibxFade .2s ease-out}' +
    '.ibx{direction:rtl;width:100%;max-width:460px;max-height:88vh;display:flex;flex-direction:column;' +
      'background:#FFFDF8;border-radius:24px 24px 0 0;overflow:hidden;' +
      'box-shadow:0 -10px 40px rgba(11,37,80,.25);animation:ibxUp .28s cubic-bezier(.2,.8,.2,1);' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1B2A45}' +
    '.ibx-h{display:flex;align-items:center;gap:12px;padding:18px 20px 16px;color:#fff;' +
      'background:linear-gradient(135deg,#0B2550 0%,#17468F 70%,#3574CE 100%)}' +
    '.ibx-m{flex:0 0 auto;width:46px;height:46px;border-radius:50%;background:#fff;' +
      'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18)}' +
    '.ibx-m img{width:36px;height:36px;object-fit:contain}' +
    '.ibx-ht{min-width:0}' +
    '.ibx-t{font-size:18px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}' +
    '.ibx-d{font-size:13px;opacity:.82;margin-top:2px;direction:ltr;text-align:right}' +
    '.ibx-b{padding:20px 22px 6px;overflow-y:auto;-webkit-overflow-scrolling:touch;' +
      'font-size:17px;line-height:1.7;overflow-wrap:anywhere}' +
    '.ibx-b p{margin:0 0 10px}' +
    '.ibx-b p:last-child{margin-bottom:4px}' +
    '.ibx-f{padding:12px 20px calc(18px + env(safe-area-inset-bottom,0px))}' +
    '.ibx-ok{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;' +
      'border:0;border-radius:16px;cursor:pointer;font:inherit;font-size:18px;font-weight:800;color:#fff;' +
      'background:linear-gradient(180deg,#6FA83B 0%,#467B1A 100%);' +
      'box-shadow:0 4px 14px rgba(70,123,26,.35);-webkit-tap-highlight-color:transparent}' +
    '.ibx-ok:active{transform:scale(.98)}' +
    '.ibx-ok:focus-visible{outline:3px solid #29ABE2;outline-offset:3px}' +
    '@media (min-width:560px){.ibx-bg{align-items:center;padding:24px}' +
      '.ibx{border-radius:24px;box-shadow:0 18px 60px rgba(11,37,80,.3)}' +
      '.ibx-f{padding-bottom:20px}}' +
    '@keyframes ibxFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes ibxUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.ibx-bg,.ibx{animation:none}}';

  function style() {
    if (document.getElementById('ibx-css')) return;
    var s = document.createElement('style');
    s.id = 'ibx-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function okText() {
    return (typeof UI !== 'undefined' && UI.inboxOk) || '✓';
  }

  function show(m, first) {
    style();
    OPEN = true;
    var paras = personal(m.body, first).split('\n').map(function (x) {
      return x.trim() ? '<p>' + emph(x.trim()) + '</p>' : '';
    }).join('');
    /* הסמל העגול. בעמוד שלא טען את logo.js — אותו סמל מהקובץ. */
    var logo = '<span class="ibx-m"><img src="' +
      (typeof LOGO_MARK !== 'undefined' ? LOGO_MARK : 'logo-mark.png') + '" alt=""></span>';
    var bg = document.createElement('div');
    bg.className = 'ibx-bg';
    bg.innerHTML =
      '<div class="ibx" role="dialog" aria-modal="true" aria-labelledby="ibx-t">' +
        '<div class="ibx-h">' + logo +
          '<div class="ibx-ht"><div class="ibx-t" id="ibx-t">' + esc(personal(m.title, first)) + '</div>' +
          (when(m.at) ? '<div class="ibx-d">' + esc(when(m.at)) + '</div>' : '') + '</div>' +
        '</div>' +
        '<div class="ibx-b">' + paras + '</div>' +
        '<div class="ibx-f"><button type="button" class="ibx-ok">' + esc(okText()) + '</button></div>' +
      '</div>';
    document.body.appendChild(bg);
    var btn = bg.querySelector('.ibx-ok');
    btn.onclick = function () {
      markSeen(m.mid);
      if (bg.parentNode) bg.parentNode.removeChild(bg);
      OPEN = false;
      next(first);
    };
  }

  function next(first) {
    if (OPEN || !QUEUE.length) return;
    show(QUEUE.shift(), first);
  }

  /* `force` — בלי ההמתנה בין שאילתה לשאילתה (חזרה לאפליקציה
     אחרי שהתראה הגיעה). */
  function check(force) {
    if (OPEN) return;
    if (!force && Date.now() - LAST < 120000) return;
    var who = me(), url = api();
    if (!who.ids.length || !url) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    LAST = Date.now();
    var q = url + (url.indexOf('?') < 0 ? '?' : '&') + 'inbox=' +
            encodeURIComponent(who.ids.join(',')) + '&t=' + Date.now();
    fetch(q).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.status !== 'ok' || !d.items || !d.items.length) return;
      var s = seen();
      /* מהישנה לחדשה — כך הן נקראות לפי הסדר שבו נשלחו. */
      QUEUE = d.items.filter(function (m) { return m && m.mid && s.indexOf(m.mid) < 0; })
                     .sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
      next(who.first);
    })['catch'](function () {});
  }

  function init() {
    /* בתוך מסגרת (הלוח בתוך הניהול) — לא. רק בעמוד עצמו. */
    try { if (window.top !== window.self) return; } catch (e) { return; }
    setTimeout(function () { check(true); }, 1500);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') check(false);
    });
    /* התראה הגיעה בזמן שהאפליקציה פתוחה — ראו sw.js. */
    if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
      navigator.serviceWorker.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'INBOX') setTimeout(function () { check(true); }, 4000);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { check: check };
})();
