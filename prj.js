/* ============================================================
   הדגמה במקרן — עולם מבודד בתוך הלשונית (בריף 17.11.2026).
   ============================================================
   הכניסה: /hatzaga (או `?prj=1`). מרגע זה, **בלשונית הזו בלבד**
   (sessionStorage `prj:on`), כל עמוד שהקובץ נטען בו ראשון — join,
   learn, bechira, zochim, hagrala — רץ על:

   · **אחסון בזיכרון** במקום localStorage/sessionStorage. התוכן נשמר
     ב-sessionStorage האמיתי תחת `prj:ls`/`prj:ss` — שורד מעבר בין
     עמודים (הבית ← הדף ← יציאה), ונמחק ב"התחלה מחדש" ובסגירת הלשונית.
     החשבון האמיתי במכשיר אינו נקרא ואינו משתנה.
   · **תלמיד לדוגמה** (`PRJ_ID`) שנוצר מעצמו, בלי הרשמה. השם — מ-UI
     (data.js), כשהוא נקרא לראשונה.
   · **בלי כתיבה לשרת.** כל POST / sendBeacon לסקריפט — נבלע ומסומן
     כאן בלבד. JSONP/fetch לסקריפט — רק קריאות ציבוריות עוברות (`PASS`);
     הכרטיסים (`pts=me`) נבנים כאן; מצב חבר מביא חבר (`challenge=my`)
     — מהשרת, עם המזהה לדוגמה, וגלוי תמיד; כל השאר — תשובה ריקה.
   · **הכרטיסים:** לימוד — מהשורה הראשונה שנשלחת ל"לימוד" (גם לימוד
     קצר, בהדגמה בלבד); חידון — כשהאימות (`tkd`) נושא ציון שעובר.
     כרטיס אבא — תמיד ריק. מועד ההגרלה — כמו אצל תלמיד אמיתי.
   · **וואטסאפ** — במקום לפתוח, תצוגה מקדימה של ההודעה.
   · **בלי חלונות מערכת:** בקשת ההתראות עונה "default" בלי לשאול.

   מחוץ להדגמה — הקובץ חוזר מיד ואינו נוגע בדבר.
   ============================================================ */
(function () {
  'use strict';
  var RS = null;
  try { RS = window.sessionStorage; } catch (e) { RS = null; }
  var MEM = {}, DEAD = false;
  function rg(k) { try { return RS ? RS.getItem(k) : (MEM[k] == null ? null : MEM[k]); } catch (e) { return MEM[k] == null ? null : MEM[k]; } }
  function rp(k, v) { if (DEAD) return; MEM[k] = v; try { if (RS) RS.setItem(k, v); } catch (e) {} }
  function rd(k) { delete MEM[k]; try { if (RS) RS.removeItem(k); } catch (e) {} }

  var ON = /[?&]prj=1(&|$)/.test(location.search) || rg('prj:on') === '1';
  window.PrjOn = ON;
  if (!ON) return;
  rp('prj:on', '1');

  var PRJ_ID = 'prjdemo';
  window.PrjId = PRJ_ID;

  /* ---------- אחסון בזיכרון ---------- */
  function store(key, seed) {
    var m = null;
    try { m = JSON.parse(rg(key) || 'null'); } catch (e) { m = null; }
    if (!m || typeof m !== 'object') { m = {}; if (seed) seed(m); }
    var has = function (k) { return Object.prototype.hasOwnProperty.call(m, k); };
    var save = function () { rp(key, JSON.stringify(m)); };
    var s = {
      getItem: function (k) { k = String(k); if (key === 'prj:ls' && k === 'df:me' && !has(k)) meSeed(m); return has(k) ? m[k] : null; },
      setItem: function (k, v) { m[String(k)] = String(v); save(); },
      removeItem: function (k) { delete m[String(k)]; save(); },
      clear: function () { m = {}; save(); },
      key: function (i) { var ks = Object.keys(m); return i >= 0 && i < ks.length ? ks[i] : null; }
    };
    try { Object.defineProperty(s, 'length', { get: function () { return Object.keys(m).length; } }); } catch (e) {}
    save();
    return s;
  }
  /* הפרופיל — בקריאה הראשונה, כשהנוסח (data.js) כבר נטען. */
  function meSeed(m) {
    var U = window.UI || {};
    m['df:me'] = JSON.stringify({ id: PRJ_ID, first: U.prjFirst || '', last: U.prjLast || '', role: 'kid',
                                  inst: '', instName: '', way: 'solo' });
    rp('prj:ls', JSON.stringify(m));
  }
  var LS = store('prj:ls', function (m) {
    var j = function (v) { return JSON.stringify(v); };
    /* האשף הסתיים, האפליקציה "מותקנת", חלון ההשקה של המבצע כבר נראה. */
    m['df:wz-fin'] = j(PRJ_ID);
    m['df:appAdded'] = '1';
    m['df:noteOn'] = PRJ_ID;
    m['df:chPromo'] = j('999999');
    m['df:chCodeR'] = j('DEMO');
    m['df:chCodeT'] = j('DEMO');
  });
  var SS = store('prj:ss', null);
  function put(name, obj) {
    try { Object.defineProperty(window, name, { configurable: true, get: function () { return obj; } }); } catch (e) {}
  }
  put('localStorage', LS);
  put('sessionStorage', SS);

  /* ---------- מצב ההדגמה (לימוד / חידון) ---------- */
  function st() { try { return JSON.parse(rg('prj:st') || 'null') || { l: 0, q: 0 }; } catch (e) { return { l: 0, q: 0 }; } }
  function stSet(k) {
    var s = st();
    if (s[k]) return;
    s[k] = 1;
    rp('prj:st', JSON.stringify(s));
    refresh();
  }
  function refresh() {
    /* הכרטיסים שבמכשיר (join.html — `df:ptsMe`) מתעדכנים מיד. */
    try {
      var c = JSON.parse(LS.getItem('df:ptsMe') || 'null');
      if (c && c.nx) { c.nx = tk(); LS.setItem('df:ptsMe', JSON.stringify(c)); }
    } catch (e) {}
    if (typeof window.drawPts === 'function') { try { window.drawPts(); } catch (e2) {} }
  }

  /* ---------- מועד ההגרלה — כמו אצל תלמיד אמיתי (rafNext_) ---------- */
  function ilDay() {
    try {
      var s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) {}
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function progWeek() {
    var P = window.PROGRAM || {}, t = Date.parse(ilDay() + 'T00:00:00Z'), s = Date.parse((P.startDate || '') + 'T00:00:00Z');
    var d = Math.round((t - s) / 864e5);
    return d >= 0 ? Math.floor(d / 7) + 1 : 1;
  }
  /* בשבוע n מגרילים על הדף של שבוע n-1. */
  function has(n) {
    return (window.TRACKS || []).some(function (T) { var r = T.cal && T.cal[n - 2]; return !!(r && r[2]); });
  }
  function nr() {
    var p = progWeek(), last = +(rg('prj:lw') || 0);
    if (has(p) && !(last >= p)) return p;
    for (var n = p + 1; n < p + 14; n++) if (has(n)) return n;
    return 0;
  }
  window.__prjPts = function () { return { status: 'ok', n: 0, l: [], nx: tk() }; };
  function tk() { var s = st(); return { l: s.l ? 1 : 0, q: s.q ? 1 : 0, f: 0, t: (s.l ? 1 : 0) + (s.q ? 1 : 0), nr: nr() }; }
  /* השבוע של ההגרלה האחרונה שפורסמה — מהרשימה הציבורית (raffle=all). */
  var LW_GO = false;
  function lwLoad(F, api) {
    if (LW_GO || !api) return;
    LW_GO = true;
    F.call(window, api + (api.indexOf('?') < 0 ? '?' : '&') + 'raffle=all&t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var w = d && d.list && d.list[0] ? parseInt(d.list[0].wk, 10) || 0 : 0;
        if (String(w) === rg('prj:lw')) return;
        rp('prj:lw', String(w));
        refresh();
      })['catch'](function () {});
  }

  /* ---------- הרשת ---------- */
  function isApi(u) {
    u = String(u || '');
    return /script\.google(usercontent)?\.com\/macros\//.test(u) || /^(https?:\/\/[^\/]+)?\/api\//.test(u) ||
           (!!window.APPS_SCRIPT_URL && u.indexOf(window.APPS_SCRIPT_URL) === 0);
  }
  function qp(u) {
    var o = {}, q = String(u).split('#')[0].split('?')[1] || '';
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
      try { o[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { o[k] = v; }
    });
    return o;
  }
  /* קריאות ציבוריות שעוברות כמו שהן: עמודי הדף, ההגרלות והזוכים, העלון. */
  var RAF_PUB = { all: 1, state: 1, przs: 1, prz: 1, list: 1, wins: 1 };
  function pass(p) {
    if (p.file != null) return true;
    if (p.raffle != null && RAF_PUB[p.raffle] && !p.id && !p.key) return true;
    if (p.alon === 'list' || p.alon === 'get') return true;
    return false;
  }
  /* התשובה המקומית. undefined — עוברת לשרת. */
  function answer(p) {
    if (pass(p)) return undefined;
    if (p.pts === 'me') return { status: 'ok', n: 0, l: [], nx: tk() };
    if (p.challenge === 'my') return undefined;
    if (p.challenge === 'ref') return { status: 'ok', code: 'DEMO' };
    if (p.tkd != null) {
      var m = String(p.sc || '').match(/^(\d+)\/(\d+)$/), r = m ? +m[1] : 0, n = m ? +m[2] : 0;
      if (n > 0 && (r * 5 >= n * 4 || (n >= 3 && r >= n - 1))) stSet('q');
      return { status: 'ok', saved: 1 };
    }
    return { status: 'error', message: 'demo' };
  }
  /* חבר מביא חבר — מהשרת, במזהה לדוגמה (אין לו שולחן): השולחן הריק.
     גלוי תמיד, גם בחשיפה "מוזמנים". */
  function patch(p, r) {
    if (p.challenge === 'my' && r && r.status === 'ok') {
      r.pub = true;
      try { LS.setItem('df:chPromo', JSON.stringify(String(r.pv || 1))); } catch (e) {}
    }
    return r;
  }
  /* כתיבה שנבלעה — רק מסמנים את ההדגמה. */
  var LRN = '"tab":"לימוד"';
  function note(body) {
    if (typeof body !== 'string') return;
    if (body.indexOf(LRN) >= 0) stSet('l');
  }

  var CBN = 0;
  function jsUrl(cb, obj) {
    return 'data:text/javascript,' + encodeURIComponent(cb ? 'try{window[' + JSON.stringify(cb) + '](' + JSON.stringify(obj) + ')}catch(e){}' : '');
  }
  function routeSrc(u) {
    if (!isApi(u)) return u;
    var p = qp(u), cb = p.callback || p.cb || '';
    /* הכרטיסים — ברגע שהתשובה רצה, לא כשהבקשה נבנתה (מועד ההגרלה עשוי להגיע בינתיים). */
    if (p.pts === 'me' && cb) {
      return 'data:text/javascript,' + encodeURIComponent('try{window[' + JSON.stringify(cb) + '](window.__prjPts())}catch(e){}');
    }
    var a = answer(p);
    if (a !== undefined) return jsUrl(cb, a);
    if (!cb || p.challenge !== 'my') return u;
    var w = '__prj' + (++CBN) + '_' + Date.now();
    window[w] = function (r) {
      try { delete window[w]; } catch (e) { window[w] = undefined; }
      var f = window[cb];
      if (typeof f === 'function') f(patch(p, r));
    };
    return u.replace(/([?&])(callback|cb)=[^&#]*/, '$1$2=' + w);
  }
  try {
    var SD = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (SD && SD.set) Object.defineProperty(HTMLScriptElement.prototype, 'src', {
      configurable: true, enumerable: SD.enumerable,
      get: function () { return SD.get.call(this); },
      set: function (v) { SD.set.call(this, routeSrc(String(v))); }
    });
    var SA = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (k, v) {
      if (this.tagName === 'SCRIPT' && String(k).toLowerCase() === 'src') v = routeSrc(String(v));
      return SA.call(this, k, v);
    };
  } catch (e) {}

  var F = window.fetch;
  function resp(obj) {
    return new Response(obj == null ? '' : JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (F) window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    var m = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (m !== 'GET' && m !== 'HEAD') {
      if (isApi(u)) { note(init && init.body); return Promise.resolve(resp(null)); }
      /* כתיבה לכל מקום אחר (גיטהאב — כלי הצוות) — לא בהדגמה. */
      return Promise.reject(new Error('demo'));
    }
    if (isApi(u)) {
      var p = qp(u), a = answer(p);
      if (a !== undefined) return Promise.resolve(resp(a));
      return F.apply(this, arguments);
    }
    return F.apply(this, arguments);
  };
  try {
    if (navigator.sendBeacon) {
      var SB = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (u, d) {
        if (isApi(u)) { note(d); return true; }
        /* שאר האתר (מדידת הביקורים של וורסל) — כרגיל. */
        return SB(u, d);
      };
    }
  } catch (e) {}

  /* ---------- בלי חלונות מערכת ---------- */
  try {
    if (window.Notification && Notification.requestPermission) {
      Notification.requestPermission = function (cb) {
        if (typeof cb === 'function') { try { cb('default'); } catch (e) {} }
        return Promise.resolve('default');
      };
    }
  } catch (e) {}

  /* ---------- וואטסאפ — תצוגה מקדימה ---------- */
  function isWa(u) { return /^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//.test(String(u || '')) || /^whatsapp:/.test(String(u || '')); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function waShow(u) {
    var U = window.UI || {}, t = qp(u).text || '';
    if (!t) return;
    var old = document.getElementById('prj-wa');
    if (old) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.id = 'prj-wa';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<div class="prj-wa-in"><b>' + esc(U.prjWaH) + '</b>' +
      '<div class="prj-wa-b">' + esc(t).replace(/\n/g, '<br>') + '</div>' +
      (U.prjWaNote ? '<p>' + esc(U.prjWaNote) + '</p>' : '') +
      '<button type="button" id="prj-wa-x">' + esc(U.prjWaX) + '</button></div>';
    document.body.appendChild(el);
    var x = document.getElementById('prj-wa-x'), close = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    x.onclick = close;
    el.onclick = function (e) { if (e.target === el) close(); };
    try { x.focus(); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !isWa(a.href)) return;
    e.preventDefault();
    e.stopPropagation();
    waShow(a.href);
  }, true);
  var WO = window.open;
  window.open = function (u) {
    if (isWa(u)) { waShow(u); return null; }
    return WO.apply(window, arguments);
  };

  /* ---------- התווית הקבועה ---------- */
  function css() {
    if (document.getElementById('prj-css')) return;
    var s = document.createElement('style');
    s.id = 'prj-css';
    s.textContent =
      '#prj-tag{position:fixed;top:8px;left:8px;z-index:2147483000;pointer-events:none;' +
      'background:rgba(23,70,143,.86);color:#fff;font:700 .78rem/1.2 inherit;font-family:inherit;' +
      'padding:5px 11px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.18)}' +
      '#prj-wa{position:fixed;inset:0;z-index:2147483001;background:rgba(10,25,50,.55);display:flex;' +
      'align-items:center;justify-content:center;padding:16px}' +
      '#prj-wa .prj-wa-in{background:#fff;border-radius:18px;max-width:30rem;width:100%;padding:20px 18px;' +
      'box-shadow:0 18px 50px rgba(0,0,0,.3);text-align:right}' +
      '#prj-wa b{display:block;font-size:1.15rem;color:#0B2550}' +
      '#prj-wa .prj-wa-b{margin-top:12px;background:#DCF8C6;border-radius:12px 12px 2px 12px;padding:12px 14px;' +
      'font-size:1.05rem;line-height:1.5;color:#111;word-break:break-word}' +
      '#prj-wa p{margin-top:12px;font-size:.98rem;font-weight:600;color:#4A5568}' +
      '#prj-wa button{display:block;width:100%;margin-top:16px;padding:14px;border:0;border-radius:12px;' +
      'background:#17468F;color:#fff;font:inherit;font-size:1.08rem;font-weight:800;cursor:pointer}';
    (document.head || document.documentElement).appendChild(s);
  }
  function tag() {
    var U = window.UI || {};
    css();
    if (!U.prjTag || document.getElementById('prj-tag')) return;
    var t = document.createElement('div');
    t.id = 'prj-tag';
    t.textContent = U.prjTag;
    document.body.appendChild(t);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tag);
  else tag();

  /* מועד ההגרלה האחרונה — פעם בעמוד, אחרי ש-data.js נטען. */
  function lwGo() { lwLoad(F, window.APPS_SCRIPT_URL || ''); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lwGo);
  else setTimeout(lwGo, 0);

  /* "התחלה מחדש" — רק ההדגמה: האחסון שלה והמצב שלה. */
  window.PrjReset = function () {
    ['prj:ls', 'prj:ss', 'prj:st'].forEach(rd);
    rp('prj:on', '1');
    /* מה שהעמוד עוד כותב בדרך החוצה (pagehide) — לא חוזר לאחסון. */
    DEAD = true;
  };
})();
