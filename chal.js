/* ============================================================
   אתגר "חבר מביא חבר" — הצד של התלמיד (8.99.318).
   ============================================================
   שני מקומות, קוד אחד:
     · הכרטיס בבית התלמיד (join.html, #chal) — קודם ההתקדמות
       האישית (הקבוצה שלי: מי השלים, מה חסר), ורק אחריה, בקטן,
       המונה הכללי — עם ההבהרה שהוא פותח הגרלה ולא מבטיח זכייה.
     · עמוד האתגר (chaver.html) — הנחיתה מקישור הזמנה, הקבוצות
       המלאות, ההזמנה והתנאים.

   **הכול מהשרת** (challengeRoute_ ב-apps-script.gs): המונה, השיבוץ,
   מצב ההגרלה. כאן רק מציירים. קריאה שנכשלה משאירה את מה שבמטמון;
   אין מטמון — הכרטיס אינו מוצג ולא ממציא מספר.

   **שום מסך לא מתקדם לבד ושום דבר לא נשלח מכאן.** כפתורי
   הוואטסאפ פותחים את בורר אנשי הקשר עם נוסח מוכן — המשתמש בוחר
   אם ולמי לשלוח. אין כאן טלפון של אף אחד.

   **הקוד שבקישור** (`?ref=`) נשמר במכשיר (`df:chRef`) מהרגע
   הראשון ועד שהשרת הכריע: ההרשמה (join.html → joinRow_) נושאת
   אותו, והשרת מייחס רק שורה חדשה. באנדרואיד הדפדפן והאפליקציה
   המותקנת חולקים אחסון; באייפון הקישור עצמו עובר להתקנה — ראו
   ראש join.html.

   ES5 בלבד. המלל — UI.ch* ב-data.js.
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
  function para(t) { return esc(t).replace(/\n/g, '<br>'); }

  /* ---- מי אני, ואיפה השרת ---- */
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
    var s = u + (u.indexOf('?') < 0 ? '?' : '&') + 'challenge=' + op;
    for (var k in (q || {})) if (q.hasOwnProperty(k) && q[k]) s += '&' + k + '=' + encodeURIComponent(q[k]);
    if (LTester()) s += '&tst=1';
    return LJsonp(s + '&t=' + Date.now());
  }

  /* ---- הקוד מהקישור ---- */
  function grabRef() {
    var m = /[?&]ref=([A-Za-z0-9]{4,10})(?:&|$)/.exec(location.search);
    if (m) LSet('chRef', m[1].toUpperCase());
    return LGet('chRef', '') || '';
  }
  function ref() { return LGet('chRef', '') || ''; }
  function dropRef() { try { localStorage.removeItem('df:chRef'); } catch (e) {} }

  /* ---- המצב שלי ---- */
  function cached() { var c = LGet('chMy', null); return c && c.d ? c.d : null; }
  var BUSY = null;
  function load() {
    if (BUSY) return BUSY;
    var q = { id: ids().join(',') };
    if (ref()) q.ref = ref();
    BUSY = api('my', q).then(function (d) {
      BUSY = null;
      if (!d || d.status !== 'ok') return cached();
      LSet('chMy', { at: Date.now(), d: d });
      /* השרת הכריע — הקוד כבר לא נחוץ. "old" נשאר עד שהתלמיד ראה
         את ההסבר ולחץ; "wait" — ההרשמה עוד בדרך. */
      if (d.ref && d.ref !== 'old' && d.ref !== 'wait') dropRef();
      return d;
    }, function () { BUSY = null; return cached(); });
    return BUSY;
  }

  /* ---- זמן ---- */
  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric',
                                         hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      var two = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getDate() + '.' + (d.getMonth() + 1) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
    }
  }

  /* ---- המונה הכללי — שני, ובקטן ---- */
  function countHtml(d) {
    if (!d || !d.on) return '';
    var h = '';
    if (d.ended) h += '<p class="ch-big">' + esc(U('chEnded')) + '</p>';
    else if (d.win) {
      h += '<p class="ch-big">' + esc(tp(d.win.k > 1 ? U('chMsN') : U('chMs1'), { n: d.win.th })) + '</p>';
      h += '<p class="ch-sm">' + esc(tp(U('chWinTill'), { t: when(new Date(d.win.close).toISOString()) })) + '</p>';
    }
    if (d.last && !d.ended) h += '<p class="ch-big">' + esc(U('chLastNext')) + '</p>';
    var line = d.next > 0 && !d.ended ? tp(U('chCount'), { n: d.n, k: d.next }) : tp(U('chCountEnd'), { n: d.n });
    h += '<p class="ch-cnt">' + esc(line) + '</p>';
    if (d.next > 0 && !d.ended) h += '<p class="ch-sm">' + esc(U('chCountNote')) + '</p>';
    var sub = [];
    if (!d.ended && d.left > 0) sub.push(d.left === 1 ? U('chLeftOne') : tp(U('chLeft'), { n: d.left }));
    if (!d.ended && !d.left && !d.win) sub.push(U('chNoMore'));
    if (d.dlv) sub.push(d.dlv === 1 ? U('chDlvOne') : tp(U('chDlv'), { n: d.dlv }));
    if (sub.length) h += '<p class="ch-sm">' + esc(sub.join(' · ')) + '</p>';
    return '<div class="ch-pub">' + h + '</div>';
  }

  /* ---- מצב הקבוצה — שורה אחת ---- */
  function stLine(g, d, mine) {
    var x = g.d || {}, by = g.by.n;
    if (x.s === 'me') return mine ? U('chStMeInv') : tp(U('chStMeFr'), { by: by });
    if (x.s === 'q') {
      var t = x.win ? U('chStWin') : x.next > 0 ? tp(U('chStQ'), { n: x.next }) : U('chStQ0');
      return x.lost ? U('chStLostMore') + ' ' + t : t;
    }
    if (x.s === 'in') return x.date ? tp(U('chStInDate'), { d: when(x.date) }) : U('chStIn');
    if (x.s === 'wait') return U('chStWait');
    if (x.s === 'won') return U('chStWon');
    if (x.s === 'out') return U('chStOut');
    if (x.s === 'lost') return U('chStLost') + ' ' + (d.ended ? U('chEnded') : U('chNoMore'));
    if (x.s === 'end') return d.ended ? U('chEnded') : U('chNoMore');
    return '';
  }
  function cls(g) {
    var s = (g.d || {}).s;
    return s === 'won' ? 'won' : s === 'wait' || s === 'in' ? 'in' : s === 'out' ? 'out' : '';
  }

  /* ---- שורה לחבר: שם, למד / עוד לא, ותזכורת למי שעוד לא ---- */
  function remindHref() { return 'https://wa.me/?text=' + encodeURIComponent(U('chRemindMsg')); }
  function who(p, tag) {
    var nm = p.me ? U('chMe') : p.n;
    var st = p.l ? '<span class="ch-ok">' + esc(U('chLearned')) + '</span>'
                 : '<span class="ch-no">' + esc(U('chNotYet')) + '</span>';
    var rm = !p.l && !p.me && p.n
      ? '<a class="ch-rm" target="_blank" rel="noopener" href="' + remindHref() + '">' + esc(U('chRemind')) + '</a>' : '';
    return '<li><b>' + esc(nm) + '</b>' + (tag ? '<i>' + esc(tag) + '</i>' : '') + st + rm + '</li>';
  }
  function grpHtml(g, d, mine, title) {
    var h = '<div class="ch-grp ' + cls(g) + '"><h3>' + esc(title) + '</h3><ul class="ch-ppl">' +
      who(g.by, U('chInviterTag')) + g.f.map(function (f) { return who(f, ''); }).join('') + '</ul>' +
      '<p class="ch-st">' + esc(stLine(g, d, mine)) + '</p>';
    /* קבוצה שהושלמה — עידוד להמשיך, לא תנאי. */
    if (['q', 'in', 'wait', 'won', 'lost'].indexOf((g.d || {}).s) >= 0) {
      h += '<a class="ch-btn wk" href="' + esc(weekUrl()) + '">' + esc(U('chWeekBtn')) + '</a>' +
           '<p class="ch-sm">' + esc(U('chWeekNote')) + '</p>';
    }
    return h + '</div>';
  }
  /* הקבוצה הפתוחה — מי השלים, מי נרשם ועוד לא, ומה חסר. */
  function openHtml(o, title, mine, d) {
    var rows = who({ n: o.by.n, me: o.by.me, l: o.by.l }, U('chInviterTag'));
    o.ok.forEach(function (p) { if (p.n) rows += who({ n: p.n, me: p.me, l: true }, ''); });
    o.no.forEach(function (p) { if (p.n) rows += who({ n: p.n, me: p.me, l: false }, ''); });
    var h = '<div class="ch-grp"><h3>' + esc(title) + '</h3><ul class="ch-ppl">' + rows + '</ul>';
    var st = [];
    if (!mine) {
      var meIn = o.ok.some(function (p) { return p.me; });
      st.push(tp(meIn ? U('chInvL') : U('chInvNotL'), { by: o.by.n }));
    }
    if (o.need > 0) st.push(o.need === 1 ? U('chNeed1') : tp(U('chNeedN'), { n: o.need }));
    if (mine && !o.by.l) st.push(U('chMeLearn'));
    /* האתגר הסתיים — גם קבוצה שלא הושלמה אומרת זאת בבירור. */
    if (d && d.ended) st = [U('chEnded')];
    h += '<p class="ch-st">' + esc(st.join(' ')) + '</p>';
    if (o.need > 0 && !(d && d.ended)) h += '<p class="ch-sm">' + esc(U('chNeedAny')) + '</p>';
    return h + '</div>';
  }
  function weekUrl() {
    try {
      var t = localStorage.getItem('dfHomeTrack'), tr = null;
      for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === t) tr = t;
      tr = tr || TRACKS[0].id;
      var wi = Math.max(0, LWeek()), dd = LDaf(tr, wi), am = LAm(tr, wi);
      if (dd) return 'learn.html?mas=' + encodeURIComponent(tr) + '&daf=' + encodeURIComponent(dd) + (am ? '&amud=' + am : '');
    } catch (e) {}
    return 'join.html';
  }

  /* הודעת הלימוד — פעם אחת. "הראשון שלך" רק כשהשרת קרא את כל
     ההיסטוריה ומצא השלמה אחת בלבד (k === 1). אחרת "כל הכבוד". */
  function yayHtml(m) {
    if (!m || !m.l || LGet('chYay', '')) return '';
    LSet('chYay', '1');
    return '<p class="ch-yay">' + esc(m.k === 1 ? U('chYayFirst') : U('chYay')) + '</p>';
  }

  /* ---- ההזמנה: הקישור, וואטסאפ, העתקה ---- */
  var CODE = '';
  /* הקישור שנשלח. בייצור הכתובות נקיות מסיומת (cleanUrls) — `chaver`;
     עמוד שנפתח עם `.html` (שרת מקומי) — `chaver.html`, אחרת 404. */
  function base() {
    var path = location.pathname, dir = path.replace(/[^\/]*$/, '');
    return location.origin + dir + (/\.html$/.test(path) ? 'chaver.html' : 'chaver');
  }
  function linkOf(c) { return base() + '?ref=' + c; }
  function shareHtml() {
    return '<div class="ch-inv" id="ch-inv"><h3>' + esc(U('chInvH')) + '</h3>' +
      '<p>' + esc(U('chInvP')) + '</p>' +
      '<div class="ch-link" id="ch-link" dir="ltr">' + esc(U('chLinkWait')) + '</div>' +
      '<a class="ch-btn wa" id="ch-wa" target="_blank" rel="noopener" aria-disabled="true">' + esc(U('chWa')) + '</a>' +
      '<button class="ch-btn ghost" id="ch-copy" type="button" disabled>' + esc(U('chCopy')) + '</button>' +
      '<p class="ch-sm">' + esc(U('chOnlyLink')) + '</p></div>';
  }
  function wireShare() {
    var put = function (c) {
      CODE = c;
      var url = linkOf(c), l = document.getElementById('ch-link');
      if (l) l.textContent = url;
      var w = document.getElementById('ch-wa');
      if (w) { w.href = 'https://wa.me/?text=' + encodeURIComponent(tp(U('chShareMsg'), { url: url })); w.removeAttribute('aria-disabled'); }
      var b = document.getElementById('ch-copy');
      if (b) {
        b.disabled = false;
        b.onclick = function () {
          var done = function () { b.textContent = U('chCopied'); };
          try { navigator.clipboard.writeText(url).then(done, function () { prompt('', url); }); }
          catch (e) { prompt('', url); }
        };
      }
    };
    var c0 = LGet('chCode', '');
    if (c0) { put(c0); return; }
    api('ref', { id: ids().join(',') }).then(function (d) {
      if (d && d.status === 'ok' && d.code) { LSet('chCode', d.code); put(d.code); return; }
      var l = document.getElementById('ch-link'); if (l) l.textContent = U('chLinkFail');
    }, function () {
      var l = document.getElementById('ch-link'); if (l) l.textContent = U('chLinkFail');
    });
  }

  /* ============================================================
     הכרטיס בבית התלמיד.
     ============================================================ */
  function cardDraw(box, d) {
    if (!d || !d.on || !student()) { box.innerHTML = ''; return; }
    var m = d.me, h = '<div class="ch-card"><h2>' + esc(U('chCardH')) + '</h2>';
    if (d.ref === 'old') {
      h += '<p class="ch-st">' + esc(U('chAlready')) + '</p>' +
           '<a class="ch-btn" href="chaver.html?own=1" onclick="try{localStorage.removeItem(\'df:chRef\')}catch(e){}">' +
           esc(U('chOwnBtn')) + '</a>';
    } else {
      h += yayHtml(m);
      var lines = [];
      if (m && m.inv) {
        var g = m.inv.g;
        lines.push('<b>' + esc(tp(U('chInvGrpH'), { by: m.inv.by })) + '</b> ' +
          esc(g ? stLine(g, d, false) : d.ended ? U('chEnded') : (m.inv.open.ok.some(function (p) { return p.me; })
            ? tp(U('chInvL'), { by: m.inv.by }) + ' ' + (m.inv.open.need === 1 ? U('chNeed1') : tp(U('chNeedN'), { n: m.inv.open.need }))
            : tp(U('chInvNotL'), { by: m.inv.by }))));
      }
      if (m && m.mine && m.mine.length) {
        m.mine.forEach(function (g2, i) {
          lines.push('<b>' + esc(m.mine.length > 1 ? tp(U('chGrpN'), { n: i + 1 }) : U('chMyGrpH')) + '</b> ' +
                     esc(stLine(g2, d, true)));
        });
      }
      if (m && m.open && (m.open.ok.length || m.open.no.length)) {
        lines.push('<b>' + esc(m.mine.length ? U('chOpenH') : U('chMyGrpH')) + '</b> ' +
          esc(d.ended ? U('chEnded') : tp(U('chOpenK'), { k: m.open.ok.length }) + ' ' +
              (m.open.need === 1 ? U('chNeed1') : m.open.need ? tp(U('chNeedN'), { n: m.open.need }) : '') +
              (m.open.by.l ? '' : ' ' + U('chMeLearn'))));
      }
      if (lines.length) h += '<div class="ch-mine">' + lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div>';
      else h += '<p class="ch-lead">' + esc(U('chCardP')) + '</p><p class="ch-sm">' + esc(U('chEmpty')) + '</p>';
      h += '<a class="ch-btn" href="chaver.html">' + esc(lines.length ? U('chOpenBtn') : U('chGo')) + '</a>';
    }
    box.innerHTML = h + countHtml(d) + '</div>';
  }
  function card(box) {
    if (!box) return;
    if (!student()) { box.innerHTML = ''; return; }
    grabRef();
    cardDraw(box, cached());
    /* הבית מצטייר כמה פעמים בטעינה אחת — פנייה לשרת פעם בחצי דקה. */
    if (Date.now() - LAST < 30000) return;
    LAST = Date.now();
    load().then(function (d) { cardDraw(box, d); });
  }
  var LAST = 0;

  /* ============================================================
     עמוד האתגר.
     ============================================================ */
  function pageDraw(box, d) {
    if (!d) { box.innerHTML = '<p class="ch-sm">' + esc(U('chErr')) + '</p>'; return; }
    if (!d.on) { box.innerHTML = '<div class="ch-card"><p class="ch-st">' + esc(U('chOff')) + '</p></div>'; return; }
    var m = d.me, h = '';
    if (d.ref === 'old' && !/[?&]own=1/.test(location.search)) {
      box.innerHTML = '<div class="ch-card"><h2>' + esc(U('chCardH')) + '</h2><p class="ch-st">' + esc(U('chAlready')) + '</p>' +
        '<button class="ch-btn big" id="ch-own" type="button">' + esc(U('chOwnBtn')) + '</button></div>';
      document.getElementById('ch-own').onclick = function () {
        dropRef();
        d.ref = '';
        pageDraw(box, d);
      };
      return;
    }
    h += yayHtml(m);
    if (m && m.inv) {
      h += m.inv.g ? grpHtml(m.inv.g, d, false, tp(U('chInvGrpH'), { by: m.inv.by }))
                   : openHtml(m.inv.open, tp(U('chInvGrpH'), { by: m.inv.by }), false, d);
      /* גם המוזמן יכול להזמין — לא תקוע בתור. */
      if (!(m.mine && m.mine.length) && !(m.open && (m.open.ok.length || m.open.no.length))) {
        h += '<div class="ch-card soft"><p class="ch-st">' + esc(U('chOwnAlso')) + '</p>' +
             '<a class="ch-btn big" href="#ch-inv">' + esc(U('chOwnBtn')) + '</a></div>';
      }
    }
    if (m && m.mine) m.mine.forEach(function (g, i) {
      h += grpHtml(g, d, true, m.mine.length > 1 ? tp(U('chGrpN'), { n: i + 1 }) : U('chMyGrpH'));
    });
    if (m && m.open && (m.open.ok.length || m.open.no.length)) {
      h += openHtml(m.open, m.mine.length ? U('chOpenH') : U('chMyGrpH'), true, d);
    }
    if (!m || (!m.inv && !(m.mine || []).length && !(m.open && (m.open.ok.length || m.open.no.length)))) {
      h += '<div class="ch-card"><h2>' + esc(U('chCardH')) + '</h2><p class="ch-lead">' + esc(U('chCardP')) + '</p>' +
           '<p class="ch-sm">' + esc(U('chEmpty')) + '</p></div>';
    }
    if (!d.ended) h += shareHtml();
    if (m && m.all && m.all.length) {
      h += '<details class="ch-all"><summary>' + esc(tp(U('chAllH'), { n: m.all.length })) + '</summary><ul class="ch-ppl">' +
           m.all.map(function (p) { return who({ n: p.n, l: p.l }, ''); }).join('') + '</ul></details>';
    }
    h += countHtml(d);
    h += '<p class="ch-stay">' + esc(U('chStay')) + '</p>';
    h += '<details class="ch-terms"><summary>' + esc(U('chTermsH')) + '</summary><p>' + para(U('chTerms')) + '</p></details>';
    box.innerHTML = h;
    if (!d.ended) wireShare();
  }
  /* הנחיתה מקישור — למי שעוד לא נרשם במכשיר הזה. */
  function landDraw(box, L) {
    var on = L && L.on, nm = L && L.name;
    box.innerHTML = '<div class="ch-card land"><h2>' + esc(nm ? tp(U('chLandH'), { name: nm }) : U('chLandHx')) + '</h2>' +
      '<p class="ch-lead">' + esc(on ? U('chLandP') : U('chLandOff')) + '</p>' +
      '<a class="ch-btn big" href="join.html?ref=' + encodeURIComponent(ref()) + '">' + esc(U('chLandBtn')) + '</a>' +
      (on ? '<p class="ch-sm">' + esc(U('chLandNote')) + '</p>' : '') + '</div>';
  }
  function page(box) {
    if (!box) return;
    var r = grabRef();
    if (!me()) {
      if (!r) { location.replace('join.html'); return; }
      landDraw(box, null);
      api('land', { ref: r }).then(function (L) { landDraw(box, L); }, function () {});
      return;
    }
    /* בלי מטמון — ריק עד שהשרת עונה, ולא הודעת שגיאה מהבהבת. */
    var c0 = cached();
    if (c0) pageDraw(box, c0);
    load().then(function (d) { pageDraw(box, d); });
  }

  window.CHAL = { card: card, page: page, grabRef: grabRef, ref: ref };
})();
