/* ============================================================
   הגרלת רביעיות — הצד של התלמיד (8.99.328). כבוי עד שהרכז מפעיל.
   ============================================================
   כרטיס "הרביעייה שלי" בבית התלמיד (join.html, #quad), מתחת לכרטיסים
   האישיים — ואינו נוגע בהם. ארבעה חברים; שבוע שבו כל הארבעה למדו —
   כרטיס קבוצתי אחד להגרלה של הרבעון. שלושה מתוך ארבעה — כלום.

   **הכול מהשרת** (quadRoute_ ב-apps-script.gs): מי בקבוצה, מי למד,
   כמה כרטיסים. כאן רק מציירים. השרת מחזיר `on: false` כשהמתג כבוי —
   ואז אין כאן כלום (מלבד מכשיר בדיקה, `tst=1`). קריאה שנכשלה — אין
   כרטיס, ולא ממציאים מספר.

   **ההרכב ננעל לשבוע.** כל הצטרפות, יציאה והוצאה — מהשבוע הבא; זה
   מה שהשרת קובע, וכאן רק אומרים את זה.

   **הקוד** (`?quad=`) נשמר במכשיר עד שהצטרף או ויתר. באייפון קישור
   נפתח בדפדפן ולא באפליקציה — ולכן אפשר גם להקליד את הקוד בכרטיס.
   שום דבר לא נשלח מכאן: וואטסאפ נפתח עם נוסח, והתלמיד בוחר למי.
   אין כאן מזהה של אף חבר — רק שם פרטי ומספר שורה (להוצאה).

   ES5 בלבד. המלל — UI.qd* ב-data.js.
   ============================================================ */
(function () {
  function U(k) { return (window.UI && UI[k]) || ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function tp(t, v) {
    return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
  }
  function me() { var m = LMe(); return m && m.id ? m : null; }
  function student() { var m = me(); return !!(m && m.first && m.role !== 'dad'); }
  function ids() {
    var m = me(), out = [];
    if (m) out.push(m.id);
    var w = LGet('who-id', '');
    if (w && out.indexOf(w) < 0) out.push(w);
    return out.filter(function (x) { return /^[\w:.\-]{1,60}$/.test(x); });
  }
  function api(op, q) {
    var u = LApi();
    if (!u || !window.Promise) return Promise.reject(new Error('no api'));
    var s = u + (u.indexOf('?') < 0 ? '?' : '&') + 'quad=' + op + '&id=' + encodeURIComponent(ids().join(','));
    for (var k in (q || {})) if (q.hasOwnProperty(k) && q[k] !== undefined && q[k] !== '') s += '&' + k + '=' + encodeURIComponent(q[k]);
    if (LTester()) s += '&tst=1';
    return LJsonp(s + '&t=' + Date.now());
  }
  function grabRef() {
    var m = /[?&]quad=([A-Za-z0-9]{6})(?:&|$)/.exec(location.search);
    if (m) LSet('quadRef', m[1].toUpperCase());
  }
  function ref() { return LGet('quadRef', '') || ''; }
  function dropRef() { try { localStorage.removeItem('df:quadRef'); } catch (e) {} }

  var EL = null, D = null, BUSY = false, MSG = '';
  function card(el) {
    EL = el;
    if (!el) return;
    if (!student()) { el.innerHTML = ''; return; }
    api('my').then(function (d) {
      if (d && d.status === 'ok') { D = d; MSG = ''; }
      paint();
    }, function () { paint(); });
  }
  function act(op, q) {
    if (BUSY) return;
    BUSY = true; MSG = ''; paint();
    api(op, q).then(function (d) {
      BUSY = false;
      if (d && d.status === 'ok' && d.on) {
        D = d;
        if (op === 'join' || (op === 'open' && ref())) dropRef();
      } else MSG = U('qdErr_' + ((d && d.message) || '')) || U('qdErr');
      paint();
    }, function () { BUSY = false; MSG = U('qdErr'); paint(); });
  }
  /* ---- הקישור והוואטסאפ ---- */
  function base() {
    var path = location.pathname, dir = path.replace(/[^\/]*$/, '');
    return location.origin + dir + (/\.html$/.test(path) ? 'join.html' : 'join');
  }
  function linkOf(c) { return base() + '?quad=' + c; }
  function wa(t) { return 'https://wa.me/?text=' + encodeURIComponent(t); }
  function seats(g) {
    var out = [];
    g.seats.forEach(function (s) {
      out.push({ k: s.did ? 'done' : s.k ? 'you' : 'reg', n: s.k ? U('qdMe') : s.f, i: String(s.f || '').charAt(0), me: !!s.k,
                lbl: !s.now ? U('qdSeatNext') : s.did ? '' : U('qdSeatNo') });
    });
    out.sort(function (a, b) { return (b.me ? 1 : 0) - (a.me ? 1 : 0); });
    while (out.length < 4) out.push({ k: 'free' });
    return out.slice(0, 4);
  }
  function howHtml() {
    return '<details class="qd-how"><summary>' + esc(U('qdHowQ')) + '</summary><p>' +
      esc(U('qdHow')).replace(/\n/g, '<br>') + '</p></details>';
  }
  function codeBox() {
    return '<div class="qd-code"><input id="qd-in" type="text" dir="ltr" maxlength="6" autocomplete="off" placeholder="' +
      esc(U('qdCodePh')) + '"><button type="button" class="ch-btn ghost"' + (BUSY ? ' disabled' : '') +
      ' onclick="QUAD.joinTyped()">' + esc(U('qdJoin')) + '</button></div>';
  }
  function paint() {
    if (!EL) return;
    if (!D || !D.on || !D.who) { EL.innerHTML = ''; return; }
    var g = D.g, h = '<div class="ch-card qd">';
    var won = g && (D.wins || []).some(function (w) { return w.mine; });
    if (!g) {
      var r = ref();
      if (r) {
        h += '<h2>' + esc(U('qdInvH')) + '</h2><p class="ch-lead">' + esc(U('qdInvP')) + '</p>' +
          '<button type="button" class="ch-btn ch-cta"' + (BUSY ? ' disabled' : '') + ' onclick="QUAD.join(\'' + esc(r) + '\')">' +
          esc(U('qdJoin')) + '</button><button type="button" class="ch-btn ghost" onclick="QUAD.skip()">' + esc(U('qdSkip')) + '</button>';
      } else {
        h += '<h2>' + esc(U('qdH')) + '</h2><p class="ch-lead">' + esc(U('qdLead')) + '</p>' +
          '<button type="button" class="ch-btn ch-cta"' + (BUSY ? ' disabled' : '') + ' onclick="QUAD.open()">' + esc(U('qdOpen')) + '</button>' +
          '<p class="ch-sm">' + esc(U('qdHaveCode')) + '</p>' + codeBox();
      }
    } else {
      var S = seats(g), did = 0;
      g.seats.forEach(function (s) { if (s.did) did++; });
      var mid = g.n === 4 && did === 4 ? [CHAL.ic.ticket, U('qdMidYes')] : [CHAL.ic.ticket, tp(U('qdMidTk'), { n: g.tk })];
      h += '<h2>' + esc(U('qdMyH')) + '</h2>' + (won ? '<p class="ch-yay">' + esc(U('qdWon')) + '</p>' : '') +
        CHAL.table(S, mid, false);
      if (g.n === 4) h += '<p class="ch-st">' + esc(did === 4 ? U('qdAll') : tp(U('qdOf4'), { n: did })) + '</p>';
      else h += '<p class="ch-st">' + esc(tp(g.mine ? U('qdPart') : U('qdSoon'), { n: g.nn })) + '</p>';
      if (g.run > 1) h += '<p class="ch-sm">' + esc(tp(U('qdRun'), { n: g.run })) + '</p>';
      g.seats.forEach(function (s) {
        if (!s.k && !s.now) h += '<p class="ch-sm">' + esc(tp(U('qdNext'), { name: s.f })) + '</p>';
        if (!s.k && s.now && !s.next) h += '<p class="ch-sm">' + esc(tp(U('qdOutNext'), { name: s.f })) + '</p>';
      });
      if (g.leaving) h += '<p class="ch-sm">' + esc(U('qdLeaving')) + '</p>';
      /* תזכורת — רק כשיש מי שעוד לא למד. בלי מספר טלפון: התלמיד בוחר למי. */
      if (g.n === 4 && did < 4 && g.mine) {
        h += '<a class="ch-btn wa" target="_blank" rel="noopener" href="' + esc(wa(U('qdRemind'))) + '">' + CHAL.ic.wa(20) + esc(U('qdRemindBtn')) + '</a>';
      }
      if (g.nn < 4 && !g.leaving && g.code) {
        var url = linkOf(g.code);
        h += '<a class="ch-btn wa" target="_blank" rel="noopener" href="' + esc(wa(tp(U('qdShare'), { url: url, code: g.code }))) + '">' +
          CHAL.ic.wa(20) + esc(U('qdInvite')) + '</a><p class="ch-sm">' + esc(tp(U('qdCodeIs'), { code: g.code })) + '</p>';
      }
      g.seats.forEach(function (s) {
        if (s.idle && s.r && s.next) {
          h += '<button type="button" class="ch-btn ghost"' + (BUSY ? ' disabled' : '') + ' onclick="QUAD.kick(' + (+s.r) + ',\'' + esc(s.f) + '\')">' +
            esc(tp(U('qdKick'), { name: s.f })) + '</button>';
        }
      });
      if (!g.leaving) h += '<button type="button" class="qd-leave"' + (BUSY ? ' disabled' : '') + ' onclick="QUAD.leave()">' + esc(U('qdLeave')) + '</button>';
    }
    if (MSG) h += '<p class="ch-sm qd-err">' + esc(MSG) + '</p>';
    if ((D.wins || []).length) {
      h += '<div class="ch-pub"><p class="ch-sm"><b>' + esc(U('qdWinsH')) + '</b></p>' +
        D.wins.map(function (w) { return '<p class="ch-sm">' + esc(w.f) + '</p>'; }).join('') + '</div>';
    }
    EL.innerHTML = h + howHtml() + '</div>';
  }
  window.QUAD = {
    card: card, grabRef: grabRef,
    open: function () { act('open'); },
    join: function (c) { act('join', { code: c }); },
    joinTyped: function () {
      var el = document.getElementById('qd-in'), c = el ? String(el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
      if (c.length !== 6) { MSG = U('qdErr_nocode'); paint(); return; }
      act('join', { code: c });
    },
    skip: function () { dropRef(); paint(); },
    leave: function () { SureThen(function () { act('leave'); }); },
    kick: function (r, f) { SureThen(function () { act('kick', { who: String(r) }); }); }
  };
})();
