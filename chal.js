/* ============================================================
   אתגר "חבר מביא חבר" — הצד של התלמיד (8.99.318; השולחן — 8.99.325).
   ============================================================
   שני מקומות, קוד אחד:
     · הכרטיס בבית התלמיד (join.html, #chal) — "אתגר חדש" עם שולחן
       ריק וכפתור הזמנה; ומשיש קבוצה — השולחן שלו, שורה אחת וכפתור.
       המונה הכללי אחריו, בקטן.
     · עמוד האתגר (chaver.html) — הנחיתה מקישור הזמנה, השולחנות,
       "הצעד הבא" (תזכורות, מקום פנוי, ההזמנה), והתנאים.

   **השולחן.** הקבוצה היא שולחן לארבעה — כמו הפרס. כל מקום הוא
   צלחת על השולחן, ואין עיגול נוסף מחוצה לו:
       פנוי  — מקווקו עם "+"
       נרשם  — צלחת ריקה עם האות הראשונה של השם
       באמצע — הצלחת מתמלאת לפי הקטע שהגיע אליו בדף (`q`, מהשרת).
               **בלי מספר**, כמו הפס בדף: מספר מזמין השוואה.
       למד   — שפה ירוקה, ארוחה בצלחת, וי
   במרכז — הפרס; ובקבוצה שהושלמה: בתור / בהגרלה / ממתין / זכיתם.
   המילוי החלקי אינו משנה דבר בזכאות — רק השלמה נספרת, בשרת.

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
  /* צבע הכרטיס לפי המצב: ערוך (בתור), בהגרלה/ממתין, זכה, כבוי. */
  function cls(s) {
    return s === 'won' ? 'won' : s === 'wait' || s === 'in' ? 'in' : s === 'q' ? 'set'
         : s === 'out' || s === 'lost' || s === 'end' ? 'out' : '';
  }

  /* ============================================================
     השולחן — ציור.
     ============================================================ */
  var IC = {
    burger: function (w, h) {
      return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 26 20" aria-hidden="true">' +
        '<path d="M2 9C2 3.5 7 1 13 1s11 2.5 11 8z" fill="#E5B854"/><circle cx="9" cy="5" r=".9" fill="#FFF3D0"/>' +
        '<circle cx="14" cy="3.6" r=".9" fill="#FFF3D0"/><circle cx="18" cy="6" r=".9" fill="#FFF3D0"/>' +
        '<path d="M1.5 10.5q2.3 2 4.6 0t4.6 0 4.6 0 4.6 0 4.6 0" stroke="#6FA83B" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<rect x="2" y="12" width="22" height="3.4" rx="1.7" fill="#7A4A23"/>' +
        '<path d="M2.5 16h21q0 3.5-4 3.5h-13q-4 0-4-3.5z" fill="#D9A048"/></svg>';
    },
    check: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.3l2.6 2.6L10 3.4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ticket: '<svg width="24" height="22" viewBox="0 0 22 20" aria-hidden="true"><path d="M2 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5z" fill="#E5B854"/><path d="M14 4v12" stroke="#FFF7E0" stroke-width="1.5" stroke-dasharray="2 2"/></svg>',
    clock: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8.5" stroke="#C08F2B" stroke-width="2.4" fill="#FFF7E0"/><path d="M11 6.5V11l3.2 2" stroke="#C08F2B" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
    star: '<svg width="26" height="24" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 1.5l3 6.4 7 .8-5.2 4.8 1.4 6.9L12 17l-6.2 3.4 1.4-6.9L2 8.7l7-.8z" fill="#E5B854" stroke="#C08F2B" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="7" r="3.2" fill="#17468F"/><path d="M2.5 17c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5z" fill="#17468F"/><path d="M15.5 5v6M12.5 8h6" stroke="#C08F2B" stroke-width="2" stroke-linecap="round"/></svg>',
    book: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 4.5c2.6-.8 5.3-.6 8 1v11c-2.7-1.6-5.4-1.8-8-1z" fill="#4E9A2A"/><path d="M18 4.5c-2.6-.8-5.3-.6-8 1v11c2.7-1.6 5.4-1.8 8-1z" fill="#2E6B12"/></svg>',
    wa: function (n) {
      return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>';
    },
    copy: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" stroke="#17468F" stroke-width="1.7" fill="none"/><path d="M11 3.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6.5A1.5 1.5 0 0 0 3 11h.5" stroke="#17468F" stroke-width="1.7" fill="none"/></svg>'
  };

  /* מקום אחד: { k: free|you|reg|part|done, n: שם, i: אות, q: 0–1, inv: מזמין } */
  function seatOf(p, inv) {
    var nm = p.me ? U('chMe') : p.n || U('chFriend');
    var k = p.l ? 'done' : p.q > 0 ? 'part' : 'reg';
    return { k: k, n: nm, i: String(p.n || '').charAt(0), q: p.q || 0, inv: !!inv, me: !!p.me };
  }
  function free() { return { k: 'free' }; }
  /* הצלחת. `you` — "אתה" לפני שהזמין: בלי מצב, רק השם. */
  function plateSvg(s) {
    var k = s.k;
    if (k === 'free') {
      return '<svg viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="34" fill="rgba(255,255,255,.12)" ' +
        'stroke="rgba(255,255,255,.85)" stroke-width="2.5" stroke-dasharray="6 5"/>' +
        '<path d="M39 28v22M28 39h22" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>';
    }
    if (k === 'done') {
      return '<svg viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="35" fill="#FFFDF8" stroke="#4E9A2A" stroke-width="4"/>' +
        '<circle cx="39" cy="39" r="26" fill="#F7E7BE"/></svg>' +
        '<span class="ch-food">' + IC.burger(34, 26) + '</span><span class="ch-tick">' + IC.check + '</span>';
    }
    var C = 2 * Math.PI * 13, ring = k === 'you' ? '#17468F' : '#3574CE';
    return '<svg viewBox="0 0 78 78" aria-hidden="true"><circle cx="39" cy="39" r="35" fill="#FFFDF8" stroke="' + ring +
      '" stroke-width="' + (k === 'you' ? 4 : 3) + '"/><circle cx="39" cy="39" r="26" fill="#F3EEE2"/>' +
      (k === 'part' && s.q > 0 ? '<circle cx="39" cy="39" r="13" fill="none" stroke="#E5B854" stroke-width="26" ' +
        'stroke-dasharray="' + (C * Math.min(1, s.q)).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 39 39)"/>' : '') +
      '<circle cx="39" cy="39" r="12" fill="#FFFDF8" opacity=".92"/>' +
      '<text x="39" y="47" text-anchor="middle" font-size="22" font-weight="900" fill="' +
      (k === 'you' ? '#17468F' : '#0B2550') + '" font-family="system-ui,sans-serif">' + esc(s.i || '') + '</text></svg>';
  }
  var STATE = { reg: 'chSeatReg', part: 'chSeatPart', done: 'chLearned' };
  function seatAria(s) {
    return s.k === 'free' ? U('chSeatFree') : s.n + (STATE[s.k] ? ' · ' + U(STATE[s.k]) : '');
  }
  /* השולחן: ארבע צלחות, השמות מחוץ לו, והפרס (או המצב) במרכז. */
  function tableHtml(seats, mid, sm) {
    var lb = '', pl = '';
    seats.forEach(function (s, x) {
      var q = ' ch-q' + (x + 1) + ' ch-' + s.k;
      lb += '<div class="ch-lb' + q + '"><b>' + esc(s.k === 'free' ? U('chSeatFree') : s.n) +
        (s.inv ? '<span class="ch-crown">' + esc(U('chInviterTag')) + '</span>' : '') + '</b>' +
        (s.lbl || STATE[s.k] ? '<i>' + esc(s.lbl || U(STATE[s.k])) + '</i>' : '') + '</div>';
      pl += '<div class="ch-pl' + q + '" role="img" aria-label="' + esc(seatAria(s)) + '">' + plateSvg(s) + '</div>';
    });
    return '<div class="ch-tbl' + (sm ? ' sm' : '') + '">' + lb + '<div class="ch-board">' +
      '<div class="ch-mid">' + mid[0] + '<span>' + para(mid[1]) + '</span></div>' + pl + '</div></div>';
  }
  function midOf(s) {
    if (s === 'q') return [IC.ticket, U('chMidQ')];
    if (s === 'in') return [IC.ticket, U('chMidIn')];
    if (s === 'wait') return [IC.clock, U('chMidWait')];
    if (s === 'won') return [IC.star, U('chMidWon')];
    return [IC.burger(26, 20), U('chTblMid')];
  }
  function leftLine(k, d) {
    if (d && d.ended) return U('chEnded');
    var n = 4 - k;
    return tp(U('chTblK'), { k: k }) + (n > 0 ? ' · ' + (n === 1 ? U('chTblLeft1') : tp(U('chTblLeft'), { n: n })) : '');
  }

  /* ---- כל השולחנות שלי, מהמבט של השרת ----
     { t: כותרת, seats, s: מצב, line, done: מושלמת, mine, open } */
  function views(m, d) {
    var out = [];
    if (!m) return out;
    var grp = function (g, mine, title) {
      var s = (g.d || {}).s;
      out.push({ t: title, s: s, mine: mine, done: s !== 'me',
                 seats: [seatOf(g.by, true)].concat(g.f.map(function (f) { return seatOf(f); })),
                 line: stLine(g, d, mine) });
    };
    var open = function (o, mine, title) {
      var fr = o.ok.map(function (p) { return { n: p.n, me: p.me, l: true }; });
      /* מי שעוד לא השלים: אני קודם, אחר כך מי שהתקדם הכי הרבה. */
      var no = o.no.slice().sort(function (a, b) {
        return (b.me ? 1 : 0) - (a.me ? 1 : 0) || (b.q || 0) - (a.q || 0);
      });
      fr = fr.concat(no.map(function (p) { return { n: p.n, me: p.me, l: false, q: p.q }; })).slice(0, 3);
      var seats = [seatOf(o.by, true)].concat(fr.map(function (p) { return seatOf(p); }));
      while (seats.length < 4) seats.push(free());
      out.push({ t: title, s: 'open', mine: mine, open: o, seats: seats,
                 line: leftLine((o.by.l ? 1 : 0) + o.ok.length, d) });
    };
    if (m.inv) {
      var t0 = tp(U('chInvGrpH'), { by: m.inv.by });
      if (m.inv.g) grp(m.inv.g, false, t0); else open(m.inv.open, false, t0);
    }
    (m.mine || []).forEach(function (g, i) {
      grp(g, true, m.mine.length > 1 ? tp(U('chGrpN'), { n: i + 1 }) : U('chMyGrpH'));
    });
    if (m.open && (m.open.ok.length || m.open.no.length)) {
      open(m.open, true, (m.mine || []).length ? U('chOpenH') : U('chMyGrpH'));
    }
    return out;
  }
  /* השולחן שבבית — החשוב מכולם: זכייה, אישור, פעולה שמחכה לי, ואז השאר. */
  var RANK = { won: 9, wait: 8, me: 7, open: 6, 'in': 5, q: 4, lost: 2, end: 2, out: 1 };
  function homeView(vs) {
    var best = null;
    vs.forEach(function (v) {
      var r = (RANK[v.s] || 0) + (v.mine ? 0.5 : 0);
      if (!best || r > best.r) best = { r: r, v: v };
    });
    return best ? best.v : null;
  }
  function startSeats() {
    var m = me();
    return [{ k: 'you', n: U('chMe'), i: String((m && m.first) || '').charAt(0) }, free(), free(), free()];
  }
  function howHtml() {
    return '<div class="ch-how"><div><i>' + IC.plus + '</i>' + para(U('chHow1')) + '</div><span>←</span>' +
      '<div><i>' + IC.book + '</i>' + para(U('chHow2')) + '</div><span>←</span>' +
      '<div><i>' + IC.ticket + '</i>' + para(U('chHow3')) + '</div></div>';
  }
  function weekUrl() {
    try {
      var t = localStorage.getItem('dfHomeTrack'), tr = null;
      for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === t) tr = t;
      tr = LTrackOf(tr || TRACKS[0].id);   /* מסלול השלמה — ראו learned.js */
      var wi = Math.max(0, LWeek()), dd = LDaf(tr, wi), am = LAm(tr, wi);
      if (dd) return 'learn.html?' + LLearnQ(tr) + '&daf=' + encodeURIComponent(dd) + (am ? '&amud=' + am : '');
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
  function waOf(c) { return 'https://wa.me/?text=' + encodeURIComponent(tp(U('chShareMsg'), { url: linkOf(c) })); }
  function shareHtml() {
    return '<div id="ch-inv"><a class="ch-btn wa ch-cta" id="ch-wa" target="_blank" rel="noopener" aria-disabled="true">' +
      IC.wa(22) + esc(U('chWa')) + '</a>' +
      '<div class="ch-lnk"><code id="ch-link" dir="ltr">' + esc(U('chLinkWait')) + '</code>' +
      '<button id="ch-copy" type="button" disabled>' + IC.copy + '<span>' + esc(U('chCopy')) + '</span></button></div></div>';
  }
  function wireShare() {
    var put = function (c) {
      CODE = c;
      var url = linkOf(c), l = document.getElementById('ch-link');
      if (l) l.textContent = url;
      var w = document.getElementById('ch-wa');
      if (w) { w.href = waOf(c); w.removeAttribute('aria-disabled'); }
      var b = document.getElementById('ch-copy');
      if (b) {
        b.disabled = false;
        b.onclick = function () {
          var done = function () { b.lastChild.textContent = U('chCopied'); };
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
    var m = d.me, h;
    if (d.ref === 'old') {
      box.innerHTML = '<div class="ch-card"><h2>' + esc(U('chCardH')) + '</h2>' +
        '<p class="ch-st">' + esc(U('chAlready')) + '</p>' +
        '<a class="ch-btn" href="chaver.html?own=1" onclick="try{localStorage.removeItem(\'df:chRef\')}catch(e){}">' +
        esc(U('chOwnBtn')) + '</a>' + countHtml(d) + '</div>';
      return;
    }
    var v = homeView(views(m, d));
    if (!v) {
      /* עוד אין שולחן. הקוד כבר במכשיר — הכפתור פותח וואטסאפ ישר;
         אחרת לעמוד האתגר, שם הקוד נוצר. בבית לא יוצרים קוד: זו
         כתיבה לגיליון לכל תלמיד שרק פתח את האפליקציה. */
      var c0 = LGet('chCode', '');
      h = '<div class="ch-tcard ch-home">' + yayHtml(m) + '<span class="ch-chip">' + esc(U('chNewChip')) + '</span>' +
        '<h2 class="ch-hh">' + esc(U('chCardH')) + '</h2><p class="ch-prize">' + esc(U('chPrize')) + '</p>' +
        tableHtml(startSeats(), midOf('')) + howHtml() +
        (d.ended ? '' : c0
          ? '<a class="ch-btn wa ch-cta" target="_blank" rel="noopener" href="' + esc(waOf(c0)) + '">' + IC.wa(22) + esc(U('chGo')) + '</a>'
          : '<a class="ch-btn wa ch-cta" href="chaver.html">' + IC.wa(22) + esc(U('chGo')) + '</a>') +
        '<a class="ch-more" href="chaver.html">' + esc(U('chMoreLink')) + '</a>';
    } else {
      var fill = v.s === 'open' && v.mine && !d.ended;
      h = '<div class="ch-tcard ch-home ' + cls(v.s) + '">' + yayHtml(m) +
        '<span class="ch-chip">' + esc(U('chCardH')) + '</span><h2 class="ch-hh sm">' + esc(v.t) + '</h2>' +
        tableHtml(v.seats, midOf(v.s), true) + '<p class="ch-tline">' + esc(v.line) + '</p>' +
        '<a class="ch-btn' + (fill ? ' ch-cta' : '') + '" href="chaver.html">' + esc(fill ? U('chFillBtn') : U('chOpenBtn')) + '</a>';
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
  function tcardHtml(v, d, first) {
    var h = '<div class="ch-tcard ' + cls(v.s) + '"><h2 class="ch-hh sm">' + esc(v.t) + '</h2>' +
      (first ? '<p class="ch-prize">' + esc(U('chFillHint')) + '</p>' : '') +
      tableHtml(v.seats, midOf(v.s)) + '<p class="ch-tline">' + esc(v.line) + '</p>';
    /* קבוצה שהושלמה — עידוד להמשיך, לא תנאי. */
    if (['q', 'in', 'wait', 'won', 'lost'].indexOf(v.s) >= 0) {
      h += '<a class="ch-btn ghost" href="' + esc(weekUrl()) + '">' + esc(U('chWeekBtn')) + '</a>' +
           '<p class="ch-sm">' + esc(U('chWeekNote')) + '</p>';
    }
    return h + '</div>';
  }
  /* שורה ב"הצעד הבא": צלחת קטנה, שם ומצב, ופעולה. */
  function rowHtml(s, t, sub, act) {
    return '<div class="ch-row"><div class="ch-pl ch-mini ch-' + s.k + '">' + plateSvg(s) + '</div>' +
      '<div class="ch-rt">' + esc(t) + '<small>' + esc(sub) + '</small></div>' + (act || '') + '</div>';
  }
  function remindHref() { return 'https://wa.me/?text=' + encodeURIComponent(U('chRemindMsg')); }
  function nextHtml(m, d, vs) {
    var rows = '', myOpen = null, mine = false, ownAlso = false;
    vs.forEach(function (v) { if (v.s === 'open' && v.mine) myOpen = v.open; if (v.mine) mine = true; });
    /* אני — אם שולחן כלשהו מחכה ללימוד שלי. */
    var meWait = null;
    vs.forEach(function (v) {
      v.seats.forEach(function (s) {
        if (!meWait && s.me && (s.k === 'reg' || s.k === 'part')) meWait = { s: s, v: v };
      });
    });
    if (meWait && !d.ended) {
      rows += rowHtml(meWait.s, U('chMe'), meWait.v.mine ? U('chMeLearn') : tp(U('chInvNotL'), { by: m.inv ? m.inv.by : '' }),
        '<a class="ch-btn sm" href="' + esc(weekUrl()) + '">' + esc(U('chWeekBtn')) + '</a>');
    }
    if (myOpen && !d.ended) {
      myOpen.no.forEach(function (p) {
        if (!p.n || p.me) return;
        var s = seatOf(p);
        rows += rowHtml(s, p.n, s.k === 'part' ? U('chSeatPart') : U('chRegSub'),
          '<a class="ch-btn wa sm" target="_blank" rel="noopener" href="' + remindHref() + '">' + IC.wa(16) + esc(U('chRemind')) + '</a>');
      });
    }
    if (!d.ended) {
      var need = myOpen ? myOpen.need : 3;
      ownAlso = !mine && !!m.inv;
      if (need > 0 || !myOpen) {
        rows += rowHtml(free(), ownAlso ? U('chOwnBtn') : need === 1 ? U('chFree1') : tp(U('chFreeN'), { n: need }),
          ownAlso ? U('chOwnAlso') : U('chFreeSub'));
      }
    }
    if (!rows && d.ended) return '';
    return '<div class="ch-next"><div class="ch-k">' + esc(U('chNextH')) + '</div>' + rows +
      (d.ended ? '' : shareHtml()) + '</div>';
  }
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
    var vs = views(m, d);
    if (!vs.length) {
      h += '<div class="ch-tcard"><h2 class="ch-hh sm">' + esc(U('chMyGrpH')) + '</h2>' +
        '<p class="ch-prize">' + esc(U('chPrize')) + '</p>' + tableHtml(startSeats(), midOf('')) + howHtml() + '</div>';
    }
    vs.forEach(function (v, i) { h += tcardHtml(v, d, i === 0); });
    h += nextHtml(m || {}, d, vs);
    if (m && m.all && m.all.length) {
      h += '<details class="ch-all"><summary>' + esc(tp(U('chAllH'), { n: m.all.length })) + '</summary>' +
        m.all.map(function (p) {
          var s = seatOf(p);
          return rowHtml(s, p.n, U(STATE[s.k]));
        }).join('') + '</details>';
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

  /* `table`/`ic` — לשולחן של הרביעייה (quad.js, 8.99.328): אותו ציור. */
  window.CHAL = { card: card, page: page, grabRef: grabRef, ref: ref, table: tableHtml, ic: IC };
})();
