/* ============================================================
   מצב בדיקה לבעלים — המכשיר (8.99.256).
   ============================================================
   הבעלים עובר מהטלפון שלו את מסלול התלמיד ואת מסלול ההורה, בזהויות
   דמה שהשרת יצר (testRoute_ ב-apps-script.gs), בלי לאבד את החשבון
   האמיתי שלו.

   **כניסה** (`TM.enter`): עותק מלא של כל האחסון של הדפדפן נשמר
   (`df:testSnap`), ורק אחר כך מנוקים מפתחות הזהות — אחרת ההרשמה
   של הדמה הייתה יוצאת במזהה האמיתי של המכשיר ודורסת את השורה שלו.
   נשארים: הגדרות הניהול (`df:cfg`, `df:admOk`), ופרטי הסשן. עותק
   שלא נשמר — אין כניסה.

   **חזרה** (`TM.restore`): האחסון חוזר בדיוק כפי שהיה — כל מפתח,
   וכלום מעבר להם. חוץ מדבר אחד: אישור "שורת ההתראות בגיליון"
   (`df:noteOk`) יורד, כדי שהמכשיר ישלח שוב את השורה האמיתית שלו
   ותהיה החדשה ביותר לאותו מנוי.

   `df:tester` הוא דגל תצוגה ונתונים בלבד (שורות "בדיקה: כן"). השרת
   אינו מאשר לפיו דבר; הסשן מאומת במזהה ובאסימון שהשרת הנפיק.

   הבאנר — בראש כל מסך שהקובץ נטען בו, כל עוד המצב פעיל. כל המלל
   ב-UI (data.js), `tm*`.
   ============================================================ */
var TM = (function () {
  'use strict';
  var SNAP = 'df:testSnap', SESS = 'df:testSess', FLAG = 'df:tester';
  var KEEP = [SNAP, SESS, FLAG, 'df:cfg', 'df:admOk'];
  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  function get(k) { var L = ls(); try { return L ? L.getItem(k) : null; } catch (e) { return null; } }
  function T(k) { return (window.UI && UI[k]) || ''; }
  function sess() {
    try { return JSON.parse(get(SESS) || 'null'); } catch (e) { return null; }
  }
  function on() { return get(FLAG) === '1' && !!sess(); }
  function api() {
    var u = get('dfApi') || (typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : '');
    try { var c = JSON.parse(get('df:cfg') || '{}'); if (c && c.api) u = c.api; } catch (e) {}
    return String(u || '').trim();
  }
  function call(p) {
    var u = api();
    if (!u || !window.fetch) return Promise.reject(new Error('api'));
    var q = Object.keys(p).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
    return fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + q + '&t=' + Date.now())
      .then(function (r) { return r.json(); });
  }
  /* הפרמטרים שמזהים את הסשן מול השרת — לתוצאת ההגרלה ול"המסלול שלך".
     בהדגמה אין סשן בדיקה — ואין מה לשלוח. */
  function q() {
    var s = sess();
    return on() && s && !s.demo ? { tsid: s.sid, ttok: s.tok } : null;
  }
  /* ============================================================
     הדגמה משפחתית (בריף 25.10, חלק 3) — אותו מנגנון של מצב הבדיקה.
     ============================================================
     הסשן כאן הוא ההרצה (`demo: 1`, `sid` = מזהה ההרצה), בלי אסימון:
     השרת אינו מאשר לפיו דבר. הכניסה — עותק של האחסון ומזהה חדש (enter),
     ולכן ההרשמה בהדגמה אינה נוגעת בחשבון האמיתי שבמכשיר; היציאה —
     הכול חוזר כפי שהיה (restore). נכנסים מקישור של המזמין (chLand_
     מחזיר `dm`), או מהניהול — הבעלים, כמזמין (`me` מהשרת). */
  function demo() { var s = sess(); return on() && s && s.demo ? s.sid : ''; }
  function enterDemo(run, me) {
    if (!enter({ sid: run, tok: '', demo: 1, slot: null })) return false;
    var L = ls();
    if (me && L) {
      try { L.setItem('df:me', JSON.stringify(me)); L.setItem('df:who-id', JSON.stringify(me.id)); } catch (e) {}
    }
    return true;
  }

  /* כל המפתחות של האחסון, כעותק. */
  function dump() {
    var L = ls(), out = {}, i, k;
    if (!L) return null;
    for (i = 0; i < L.length; i++) { k = L.key(i); if (k !== null) out[k] = L.getItem(k); }
    return out;
  }
  /* s: { sid, tok, slot:{k,role,first,last,phone,inst} } */
  function enter(s) {
    var L = ls();
    if (!L || !s || !s.sid || (!s.tok && !s.demo)) return false;
    /* כבר במצב בדיקה — רק מחליפים זהות דמה, והעותק המקורי נשאר. */
    if (!get(SNAP)) {
      var d = dump();
      if (!d) return false;
      try { L.setItem(SNAP, JSON.stringify(d)); } catch (e) { return false; }
      if (get(SNAP) === null) return false;
    }
    var all = dump(), k;
    for (k in all) {
      if (!all.hasOwnProperty(k)) continue;
      if (KEEP.indexOf(k) >= 0) continue;
      if (k.indexOf('df') === 0 && k !== 'dfApi') L.removeItem(k);
    }
    try {
      L.setItem(SESS, JSON.stringify(s));
      L.setItem(FLAG, '1');
    } catch (e2) { restore(); return false; }
    return true;
  }
  function restore() {
    var L = ls(), raw = get(SNAP), d = null;
    if (!L) return false;
    try { d = JSON.parse(raw || 'null'); } catch (e) { d = null; }
    if (!d) {
      /* אין עותק — רק יוצאים ממצב הבדיקה, בלי לגעת בשאר. */
      L.removeItem(SESS); L.removeItem(FLAG);
      return false;
    }
    var all = dump(), k;
    for (k in all) { if (all.hasOwnProperty(k) && !d.hasOwnProperty(k)) L.removeItem(k); }
    for (k in d) {
      if (!d.hasOwnProperty(k) || k === SNAP) continue;
      try { L.setItem(k, d[k]); } catch (e2) {}
    }
    L.removeItem(SNAP);
    if (!d.hasOwnProperty(SESS)) L.removeItem(SESS);
    L.removeItem('df:noteOk');
    return true;
  }

  /* אחרי ההרשמה בטופס — השרת מוודא שהשורה היא של זהות הבדיקה
     (טלפון ושם פיקטיביים, "בדיקה: כן") ורק אז משייך אותה לסשן.
     השורה יוצאת בתור, ולכן כמה ניסיונות. */
  function add(id) {
    var s = sess();
    if (!on() || !s || !s.slot || !id) return;
    var n = 0;
    var go = function () {
      call({ test: 'add', tsid: s.sid, ttok: s.tok, slot: s.slot.k, id: id }).then(function (d) {
        if (d && d.status === 'ok') { s.slot.id = id; try { ls().setItem(SESS, JSON.stringify(s)); } catch (e) {} return; }
        if (d && d.status === 'wait' && ++n < 8) setTimeout(go, 6000);
      })['catch'](function () { if (++n < 8) setTimeout(go, 6000); });
    };
    setTimeout(go, 4000);
  }

  /* קישור מהניהול לדפדפן אחר: ?tm=<sid>.<tok>.<slot> */
  function fromLink() {
    var m = /[?&]tm=([A-Za-z0-9]+)\.([a-f0-9]+)\.([abp])\b/.exec(location.search);
    if (!m) return Promise.resolve(false);
    return call({ test: 'who', tsid: m[1], ttok: m[2], slot: m[3] }).then(function (d) {
      if (!d || d.status !== 'ok' || !d.slot) return false;
      var cur = sess();
      if (cur && cur.sid === m[1] && cur.slot && cur.slot.k === m[3]) return true;
      return enter({ sid: m[1], tok: m[2], slot: d.slot });
    })['catch'](function () { return false; });
  }

  function demoBoot() {
    var s = sess();
    if (on() && s && s.demo) {
      /* ההרצה הסתיימה — חוזרים לחשבון, בלי לשאול. */
      return call({ challenge: 'dmst', run: s.sid }).then(function (d) {
        if (!d || d.status !== 'ok' || d.on) return false;
        restore();
        try { alert(T('dmEnded')); } catch (e) {}
        location.href = location.pathname.replace(/[^\/]*$/, '') + './';
        return true;
      })['catch'](function () { return false; });
    }
    var m = /[?&]ref=([A-Za-z0-9]{4,10})(?:&|$)/.exec(location.search);
    if (on() || !m) return Promise.resolve(false);
    return call({ challenge: 'land', ref: m[1].toUpperCase() }).then(function (d) {
      if (!d || !d.dm || !enterDemo(d.dm, null)) return false;
      location.reload();
      return true;
    })['catch'](function () { return false; });
  }

  function label() {
    var s = sess(), k = s && s.slot && s.slot.k;
    return k ? T('tmSlot' + k.toUpperCase()) : T('tmNoSlot');
  }
  function banner() {
    if (!on() || !document.body || document.getElementById('tm-bar')) return;
    var b = document.createElement('div');
    b.id = 'tm-bar';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:sticky;top:0;z-index:99999;display:flex;align-items:center;gap:10px;' +
      'justify-content:space-between;padding:8px 12px;background:#B4231B;color:#fff;' +
      'font:700 .86rem/1.35 system-ui,sans-serif;direction:rtl;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    var t = document.createElement('span'), dm = !!demo();
    t.textContent = dm ? T('dmBar') : T('tmBar') + (label() ? ' · ' + label() : '');
    if (dm) b.style.background = '#6B3FA0';
    var btn = document.createElement('button');
    btn.textContent = dm ? T('dmBack') : T('tmBack');
    if (dm) btn.style.color = '#6B3FA0';
    btn.style.cssText = 'flex:none;border:1px solid #fff;background:#fff;color:#B4231B;border-radius:9px;' +
      'padding:6px 10px;font:800 .82rem system-ui,sans-serif;cursor:pointer';
    btn.onclick = function () {
      if (!confirm(dm ? T('dmBackQ') : T('tmBackQ'))) return;
      restore();
      location.href = location.pathname.replace(/[^\/]*$/, '') + './';
    };
    b.appendChild(t); b.appendChild(btn);
    document.body.insertBefore(b, document.body.firstChild);
  }
  function boot() {
    fromLink().then(function (did) {
      if (did) {
        /* הקישור נצרך — מורידים אותו מהכתובת, שלא ייכנס שוב ברענון. */
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        location.reload();
        return;
      }
      banner();
      demoBoot();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* המזהה האמיתי של המכשיר — מהעותק שנשמר בכניסה. בניסוי החי הוא נוסע
     עם ההרשמה ("מכשיר אמיתי"), כדי שהתראת הניסוי תגיע לטלפון (8.99.351). */
  function realId() {
    try {
      var d = JSON.parse(get(SNAP) || 'null'), me = d && JSON.parse(d['df:me'] || 'null');
      return (me && me.id) || '';
    } catch (e) { return ''; }
  }
  return { on: on, sess: sess, q: q, enter: enter, restore: restore, add: add, call: call, banner: banner,
           demo: demo, enterDemo: enterDemo, realId: realId };
})();
