/* ============================================================
   מי שננעל — "אתה איש צוות או תלמיד?"
   ============================================================
   משותף לעמוד הראשי, ללוח ולעמוד הצוות. במקום "אנא המתן" —
   מסך אחד ושני כפתורים גדולים:

     · איש צוות — חוזר לרשימת הממתינים אצל הרכז, והרכז מקבל
       התראה אחת (בשרת: `acc` + `pick=staff`, coordPing_ בלבד).
       בלי טלפון — קודם שדה טלפון, עם "דילוג".
     · תלמיד — אחרי אישור אחד. התפקיד בשרת הופך ל"תלמיד", בלי
       שום התראה, והמכשיר עובר למסך התלמיד — ונשאר שם.

   ובכל נעילה: רשימות השמות יורדות מהמכשיר (`LOCK.wipe`).

   העמוד מספק:
     get(q)    שאלה לסקריפט → Promise של התשובה
     me()      { id, inst, first, last, phone }
     paint()   ציור מחדש של המקום שבו יושב `LOCK.html()`
     onWait(d) אחרי "איש צוות" — רשות. בלעדיו: מסך ההמתנה כאן.
   המלל — PANEL.lock* ב-data.js. ES5 בלבד.
   ============================================================ */
var LOCK = (function () {
  var C = null, st = 'q', err = '';

  function P(k) { return (window.PANEL && PANEL[k]) || ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function digits(v) { return String(v || '').replace(/[^0-9]/g, ''); }

  /* העיצוב נוסע עם הקובץ, כמו ב-ask.js. */
  function css() {
    if (document.getElementById('lock-css')) return;
    var s = document.createElement('style');
    s.id = 'lock-css';
    s.textContent =
      ".lk{background:#fff;border:2px solid #17468F;border-radius:18px;padding:26px 18px 20px;" +
      "text-align:center;max-width:420px;margin:12px auto}" +
      ".lk svg{width:64px;height:40px;display:block;margin:0 auto 12px}" +
      ".lk h3{margin:0 0 18px;font-size:1.3rem;font-weight:900;color:#0B2550}" +
      ".lk-b{display:block;width:100%;border:0;border-radius:12px;padding:15px 10px;margin-top:10px;" +
      "font:inherit;font-size:1.1rem;font-weight:800;color:#fff;cursor:pointer}" +
      ".lk-s{background:#17468F}.lk-k{background:#C08F2B}" +
      ".lk-b[disabled]{opacity:.55}" +
      ".lk input{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:12px;" +
      "border:1.5px solid #c9d3e3;border-radius:10px;font:inherit;font-size:1.05rem;text-align:center}" +
      ".lk label{display:block;font-weight:800;font-size:.95rem;color:#0B2550}" +
      ".lk-x{background:none;border:0;margin-top:12px;font:inherit;font-size:.9rem;color:#5a6577;" +
      "text-decoration:underline;cursor:pointer}" +
      ".lk-e{margin-top:10px;color:#B3261E;font-weight:700;font-size:.9rem}" +
      ".lk p{margin:6px 0 0;color:#3d4757}";
    (document.head || document.body).appendChild(s);
  }
  /* אייקון המפתח — אותו מפתח של "ממתינים לאימות". */
  var KEY = '<svg viewBox="0 0 64 40" aria-hidden="true"><circle cx="16" cy="20" r="11" fill="none" ' +
    'stroke="#C08F2B" stroke-width="6"/><path d="M27 20h30M47 20v9M56 20v7" fill="none" ' +
    'stroke="#C08F2B" stroke-width="6" stroke-linecap="round"/></svg>';

  function html() {
    css();
    var e = err ? '<div class="lk-e">' + esc(err) + '</div>' : '';
    if (st === 'wait') {
      return '<div class="lk">' + KEY + '<h3>' + esc(P('waitH')) + '</h3><p>' +
        esc(P('waitB')) + '</p></div>';
    }
    var busy = st === 'busy' ? ' disabled' : '';
    if (st === 'ph' || (st === 'busy' && document.getElementById('lk-ph'))) {
      var v = document.getElementById('lk-ph');
      return '<div class="lk">' + KEY +
        '<label for="lk-ph">' + esc(P('waitPh')) + '</label>' +
        '<input id="lk-ph" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" value="' +
        esc(v ? v.value : '') + '">' +
        '<button class="lk-b lk-s"' + busy + ' onclick="LOCK.phone()">' + esc(P('waitGo')) + '</button>' +
        '<button class="lk-x"' + busy + ' onclick="LOCK.skip()">' + esc(P('lockSkip')) + '</button>' + e + '</div>';
    }
    return '<div class="lk">' + KEY + '<h3>' + esc(P('lockQ')) + '</h3>' +
      '<button class="lk-b lk-s"' + busy + ' onclick="LOCK.staff()">' + esc(P('lockStaff')) + '</button>' +
      '<button class="lk-b lk-k"' + busy + ' onclick="LOCK.kid()">' + esc(P('lockKid')) + '</button>' + e + '</div>';
  }
  function paint() { if (C && C.paint) C.paint(); }

  /* ============================================================
     ניקוי — מי שננעל אינו רואה אף שם, גם לא אחרי רענון.
     ============================================================
     קודי הישיבות, רשימת הנוכחות, וכל `rosterCache:*` (הלוח,
     עמוד הצוות, הניהול) — ומפתחות הלוח שבקישור (`boardKey:*`). */
  function wipe() {
    try {
      var L = localStorage, gone = [];
      for (var i = 0; i < L.length; i++) {
        var k = L.key(i) || '';
        if (/^df:(rosterCache:|instCodes$|attR$)/.test(k) || /^boardKey:/.test(k)) gone.push(k);
      }
      for (var j = 0; j < gone.length; j++) L.removeItem(gone[j]);
    } catch (e) {}
  }

  function q(pick, ph) {
    var me = (C && C.me && C.me()) || {};
    if (!me.id || !me.inst) return null;
    var o = { acc: me.inst, dev: me.id, pick: pick };
    if (ph) o.ph = ph;
    return o;
  }
  function fail() { err = P('lockFail'); if (st === 'busy') st = 'q'; paint(); }

  /* "איש צוות". עם טלפון — ישר לשרת. בלי — קודם השדה. */
  function staff() {
    var me = (C && C.me && C.me()) || {};
    err = '';
    if (digits(me.phone).length < 9) { st = 'ph'; paint(); return; }
    send('');
  }
  function phone() {
    var el = document.getElementById('lk-ph'), v = el ? (el.value || '').trim() : '';
    if (digits(v).length < 9) { err = (window.ASK_UI && ASK_UI.errPhone) || P('waitPh'); paint(); return; }
    if (C && C.savePhone) { try { C.savePhone(v); } catch (e) {} }
    send(v);
  }
  function skip() { send(''); }
  function send(ph) {
    var o = q('staff', ph);
    if (!o) { fail(); return; }
    var back = st;
    st = 'busy'; err = ''; paint();
    C.get(o).then(function (d) {
      if (!d || d.status !== 'wait') { st = back === 'ph' ? 'ph' : 'q'; err = P('lockFail'); paint(); return; }
      st = 'wait';
      if (C.onWait) C.onWait(d); else paint();
    }, function () { st = back === 'ph' ? 'ph' : 'q'; err = P('lockFail'); paint(); });
  }

  /* "תלמיד" — אחרי "האם אתה בטוח". הפרטים כאן, ולא על המסך. */
  function kid() {
    if (!SureLater(kid, this, arguments)) return;
    var o = q('kid');
    if (!o) { fail(); return; }
    var me = C.me() || {};
    st = 'busy'; err = ''; paint();
    C.get(o).then(function (d) {
      if (!d || d.status !== 'kid') { st = 'q'; err = P('lockFail'); paint(); return; }
      becomeKid(me);
    }, function () { st = 'q'; err = P('lockFail'); paint(); });
  }
  /* מכאן — מסך התלמיד בלבד. השם, הטלפון והישיבה ממתינים לטופס
     ההרשמה של התלמיד (join.html קורא את `df:lockPre` פעם אחת),
     כך שנשאר לו רק מה שחסר. */
  function becomeKid(me) {
    wipe();
    try {
      localStorage.setItem('df:stuLock', JSON.stringify(me.inst));
      localStorage.setItem('df:lockPre', JSON.stringify({
        first: me.first || '', last: me.last || '', phone: me.phone || '', inst: me.inst }));
    } catch (e) {}
    location.replace('join.html?inst=' + encodeURIComponent(me.inst));
  }

  /* מכשיר שבחר "תלמיד" — לא נכנס יותר ללוח או לאזור הצוות. */
  function kidCode() {
    try { return JSON.parse(localStorage.getItem('df:stuLock') || '""') || ''; } catch (e) { return ''; }
  }
  function kidGo() {
    var c = kidCode();
    if (!c) return false;
    location.replace('join.html?inst=' + encodeURIComponent(c));
    return true;
  }

  return {
    init: function (cfg) { C = cfg; },
    html: html, wipe: wipe, staff: staff, kid: kid, phone: phone, skip: skip,
    kidCode: kidCode, kidGo: kidGo,
    /* חזרה למסך השאלה — כשהשרת אומר שוב "נעול". */
    reset: function () { if (st !== 'busy') { st = 'q'; err = ''; } },
    waiting: function () { return st === 'wait' || st === 'ph' || st === 'busy'; }
  };
})();
