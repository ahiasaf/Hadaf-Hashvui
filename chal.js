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

   **8.99.350:** ותיק אחד לשולחן (כבר רשום — "לשבת בשולחן", ?challenge=sit),
   מצבי הקישור כהודעה (noteHtml), פס בהרשמה (strip), וחלון השקה אחד (promo).
   בניסוי החי — אותו נוסח.
   **8.99.351:** השיבוץ לשולחנות מהשרת ויציב (`tbl`) — בלי מרוץ ובלי מעבר
   בשקט; תוצאות הגרלה מההתראה (?ms=k, msrHtml); קישור לחבר רשום בניסוי
   (`&old=1`, `chRefLater`).

   **8.99.436 — עיצוב מחודש (הבריף של אחיאסף):** כפתור וואטסאפ ירוק הוא הפעולה
   הראשית, בבית ובמסך השולחן, תמיד. הכיסא נתפס בסיום דף; עד אז החבר "בדרך
   אליך" (`me.way` מהשרת, ו"הוזמן" — החבר מההרשמה שנשלח לו, `df:chFrSent`).
   עד 3 שולחנות (`me.ts`) — מסך "השולחנות שלך". הוזמן מכמה חברים — מסך בחירה
   (`me.pend.hs`, ?challenge=sit עם הקוד של המארח). אין מקום — `me.nr`.
   בלי העתקת קישור: השיתוף רק בוואטסאפ.
   **8.99.441:** יושבים ברגע הבחירה (גם לפני סיום דף). שולחן אחד בתצוגה ו"+" מתחתיו
   (plusHtml, ?challenge=newt) — "השולחנות שלך" ירד. יצא בהגרלה (`me.ex`) — הזמנה עדינה.
   **8.99.440 — הצטרפות רק מבחירה:** גם מזמין יחיד — כרטיס "לשבת בשולחן של…" (sitHtml);
   בלי לחיצה אין שיוך ואין כיסא. כפתור הוואטסאפ גלוי גם בכרטיס הבחירה. 8.99.448 (הערות אחיאסף):
   `chMax3` ירד; איור השולחן בכל מקום; הזמנה נוספת — כרטיס נפרד מתחת לשולחן ("{שם} גם הזמין אותך").

   ES5 בלבד. המלל — UI.ch* ב-data.js.
   ============================================================ */
(function () {
  /* גם בניסוי החי (testmode.js, ההרצה של הבעלים) — אותו נוסח בדיוק,
     עם הפרס: רואים מה שהתלמיד יראה (8.99.350). */
  function U(k) { var u = window.UI || {}; return u[k] || ''; }
  /* 8.99.367: אין כלל הרכב לפי מוסד — מזמינים את מי שרוצים, נוסח אחד לכולם. */
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
  /* הקוד האישי במכשיר — לכל עולם לחוד (8.99.370): קוד שנשמר בזמן מצב בדיקה אינו
     יוצא בעולם האמיתי. `chCode` הישן אינו נקרא — קריאה אחת לשרת (?challenge=ref). */
  function codeKey() { return LTester() ? 'chCodeT' : 'chCodeR'; }
  function api(op, q) {
    var u = LApi();
    if (!u || !window.Promise) return Promise.reject(new Error('no api'));
    var s = u + (u.indexOf('?') < 0 ? '?' : '&') + 'challenge=' + op;
    for (var k in (q || {})) if (q.hasOwnProperty(k) && q[k]) s += '&' + k + '=' + encodeURIComponent(q[k]);
    if (LTester()) s += '&tst=1';
    /* השרת עשוי לחכות לנעילה ולבנות את המצב מחדש — 12 שניות לא הספיקו (8.99.405). */
    return LJsonp(s + '&t=' + Date.now(), 40000);
  }

  /* ---- הקוד מהקישור ---- */
  function grabRef() {
    var m = /[?&]ref=([A-Za-z0-9]{4,10})(?:&|$)/.exec(location.search);
    if (m) LSet('chRef', m[1].toUpperCase());
    return LGet('chRef', '') || '';
  }
  function ref() { return LGet('chRef', '') || ''; }
  /* `chRefLater` — קישור לחבר שכבר רשום בניסוי (`&old=1`): נשמר בצד בזמן
     ההרשמה (שאינה נושאת אותו), ומשמש רק אחריה — כמו ותיק שקיבל קישור. */
  function refAny() { return ref() || (me() ? LGet('chRefLater', '') || '' : ''); }
  function dropRef() {
    try { localStorage.removeItem('df:chRef'); localStorage.removeItem('df:chRefLater'); } catch (e) {}
  }

  /* ---- המצב שלי ---- */
  function cached() { var c = LGet('chMy', null); return c && c.d ? c.d : null; }
  var BUSY = null;
  function load() {
    if (BUSY) return BUSY;
    var q = { id: ids().join(',') };
    if (refAny()) q.ref = refAny();
    /* מההתראה על תוצאות הגרלה — ?ms=k (chPush_ בשרת). */
    var mk = /[?&]ms=(\d{1,3})(?:&|$)/.exec(location.search);
    if (mk) q.ms = mk[1];
    BUSY = api('my', q).then(function (d) {
      BUSY = null;
      FRESH = !!(d && d.status === 'ok');
      if (!FRESH) return cached();
      LSet('chMy', { at: Date.now(), d: d });
      /* השרת הכריע — הקוד כבר לא נחוץ. "old" נשאר עד שהתלמיד בחר
         (לשבת בשולחן או לפתוח משלו); "wait" — ההרשמה עוד בדרך. שאר
         המצבים (bad/self/other/full) — הודעה אחת, מהתשובה הזו. */
      if (d.ref && d.ref !== 'old' && d.ref !== 'wait') dropRef();
      return d;
    }, function () { BUSY = null; FRESH = false; return cached(); });
    return BUSY;
  }
  var FRESH = false;

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

  function daysTo() {
    var n = new Date();
    try { n = new Date(n.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })); } catch (e) {}
    var k = (7 - n.getDay()) % 7;
    return k === 0 ? U('chDraw0') : k === 1 ? U('chDraw1') : tp(U('chDrawN'), { n: k });
  }
  /* ---- המונה הכללי — שני, ובקטן ---- */
  function countHtml(d) {
    if (!d || !d.on) return '';
    var h = '';
    /* **בלי ספירה לאחור ובלי רמז להגרלות הבאות** (8.99.357, החלטת הבעלים
       28.10): אין הגרלה כל 50. הגרלה נפתחת רק בלחיצה שלו, ובלי חלון זמן.
       השורה "השבוע יש הגרלה…" — נוסח שהוא עורך (chWeekRaf), ריק = אין. */
    if (d.ended) h += '<p class="ch-big">' + esc(U('chEnded')) + '</p>';
    /* 8.99.451 (אחיאסף): "ההגרלה בעוד N ימים" — עד יום ראשון הקרוב, שעון ישראל (ההגרלה עצמה — בלחיצה שלו). */
    else h += '<p class="ch-big">' + esc(daysTo()) + '</p>';
    if (d.last && !d.ended) h += '<p class="ch-big">' + esc(U('chLastNext')) + '</p>';
    var sub = [];
    if (d.dlv) sub.push(d.dlv === 1 ? U('chDlvOne') : tp(U('chDlv'), { n: d.dlv }));
    if (sub.length) h += '<p class="ch-sm">' + esc(sub.join(' · ')) + '</p>';
    return '<div class="ch-pub">' + h + '</div>';
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
  function seatOf(p) {
    var nm = p.me ? U('chMe') : p.n || U('chFriend');
    /* "התחיל" — מהשורה הראשונה של התקדמות (`s`), והצלחת מתמלאת לפי `q`. */
    var k = p.l ? 'done' : p.q > 0 || p.s ? 'part' : 'reg';
    return { k: k, n: nm, i: String(p.n || '').charAt(0), q: p.q || 0, me: !!p.me,
             lbl: p.me && k === 'reg' ? U('chSeatRegMe') : '' };
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
    return s.k === 'free' ? U('chSeatFree') : s.n + (s.lbl || STATE[s.k] ? ' · ' + (s.lbl || U(STATE[s.k])) : '');
  }
  /* השולחן: ארבע צלחות, השמות מחוץ לו, והפרס (או המצב) במרכז. `chairs` —
     במסך השולחן: כל שם על כיסא (8.99.385). */
  function tableHtml(seats, mid, sm, chairs) {
    var lb = '', pl = '';
    seats.forEach(function (s, x) {
      var q = ' ch-q' + (x + 1) + ' ch-' + s.k;
      lb += '<div class="ch-lb' + q + '"><b>' + esc(s.k === 'free' ? U('chSeatFree') : s.n) +
        (s.inv ? '<span class="ch-crown">' + esc(U('chInviterTag')) + '</span>' : '') +
        (s.o ? '<span class="ch-crown o">' + esc(U('chOldTag')) + '</span>' : '') + '</b>' +
        (s.lbl || STATE[s.k] ? '<i>' + esc(s.lbl || U(STATE[s.k])) + '</i>' :
         /* כיסא בלי מצב ("אתה" לפני שהזמין, מקום פנוי) — שורה ריקה, שלא יבלוט מעל השאר (8.99.392). */
         chairs ? '<i aria-hidden="true">&nbsp;</i>' : '') + '</div>';
      pl += '<div class="ch-pl' + q + '" role="img" aria-label="' + esc(seatAria(s)) + '">' + plateSvg(s) + '</div>';
    });
    return '<div class="ch-tbl' + (sm ? ' sm' : '') + (chairs ? ' ch-chairs' : '') + '">' + lb + '<div class="ch-board">' +
      '<div class="ch-mid">' + mid[0] + '<span>' + para(mid[1]) + '</span></div>' + pl + '</div></div>';
  }
  function midOf(s) {
    if (s === 'q') return [IC.ticket, U('chMidQ')];
    if (s === 'in') return [IC.ticket, U('chMidIn')];
    if (s === 'wait') return [IC.clock, U('chMidWait')];
    if (s === 'won') return [IC.star, U('chMidWon')];
    return [IC.burger(26, 20), U('chTblMid')];
  }


  /* ---- השולחן שלי — אחד (8.99.385) ----
     יושב — השולחן (`me.t`); הוזמן ועוד לא התחיל ללמוד — השולחן שהוזמן
     אליו (`me.pend.t`, המקום עוד לא שמור); אחרת — השולחן הריק שלי. */
  /* השולחן שבחר במעבר הקטן (8.99.442) — לפי המזהה שלו; לא קיים עוד — הראשי. */
  var CURT = '';
  function tv(d) {
    var m = d && d.me;
    if (!m) return null;
    if (CURT && m.ts) for (var i = 0; i < m.ts.length; i++) if (m.ts[i].id === CURT) return { t: m.ts[i], pend: false };
    if (m.t) return { t: m.t, pend: false };
    if (m.pend && m.pend.t) return { t: m.pend.t, pend: true };
    return null;
  }
  /* כל השולחנות שלי (8.99.436) — `ts`; שרת ישן — רק `t`. */
  function tabs(d) {
    var m = d && d.me;
    if (!m) return [];
    return m.ts && m.ts.length ? m.ts : m.t ? [m.t] : [];
  }
  /* הוזמן ועוד לא בחר (גם מזמין יחיד, 8.99.440) — מסך הבחירה. מזמין שאין אצלו
     מקום (`t` ריק) אינו מוצע: לא מבטיחים מקום כשאין. */
  /* **ההזמנות שלי** (8.99.443): כל מי שהזמין אותי, ולכל אחד מצב מהשרת — in (כבר יושבים יחד) ·
     open (אפשר להצטרף) · full (אין אצלו מקום) · max (כבר יש לי 3). כל הזמנה — בחירה נפרדת.
     בעל קישור שפתחתי ואינו ברשימה — נוסף לפי מצב הקישור. */
  function pickList(d) {
    var m = d && d.me, out = ((m && m.inv) || []).slice();
    if (d && refAny() && d.ref && !out.some(function (h) { return h.ref; })) {
      var st = { old: 'open', full: 'full', max: 'max', ok: 'in' }[d.ref];
      if (st && (st !== 'open' || d.refT)) out.push({ n: d.refBy || U('chFriend'), st: st, c: st === 'open' ? refAny() : '', t: st === 'open' ? d.refT : null });
    }
    /* 8.99.448: אין מקום — האפשרות פשוט לא מוצגת; כבר יושבים יחד — אין מה לבחור. */
    return out.filter(function (h) { return h.st === 'open' || h.st === 'max'; });
  }
  function seatsOf(v) {
    var out = v && v.t ? v.t.seats.map(function (p) { return seatOf(p); }) : startSeats();
    while (out.length < 4) out.push(free());
    return num(out);
  }
  /* בעיגול — מספר הכיסא (1–4), לא האות הראשונה של השם (8.99.387, אחיאסף). */
  function num(seats) {
    seats.forEach(function (s, x) { if (s.k !== 'free') s.i = String(x + 1); });
    return seats;
  }
  function titleOf(v) { return !v || v.t.mine ? U('chMyGrpH') : tp(U('chInvGrpH'), { by: v.t.name }); }
  function lineOf(v, d) {
    if (d.ended) return U('chEnded');
    if (!v) return '';
    if (v.pend) return '';
    return { q: U('chStQ0'), wait: U('chStWait'), won: U('chStWon') }[v.t.st] || '';
  }
  function stOf(v) { return v && !v.pend ? v.t.st : ''; }
  function startSeats() {
    var m = me();
    return [{ k: 'you', n: U('chMe'), i: String((m && m.first) || '').charAt(0) }, free(), free(), free()];
  }
  /* שאלות ותשובות — נוסח אחד שאחיאסף עורך: שורה ראשונה שאלה, אחריה התשובה,
     שורה ריקה בין שאלה לשאלה. סגור עד שלוחצים. */
  function faqHtml() {
    var qs = String(U('chFaq') || '').replace(/\r/g, '').split(/\n\s*\n/).map(function (b) {
      var l = b.replace(/^\s+|\s+$/g, '').split('\n');
      /* כל שורה בתשובה — פסקה; *כך* — מודגש (8.99.443, "איך זה עובד?"). */
      return l[0] ? '<div class="ch-qa"><b>' + esc(l[0]) + '</b>' + l.slice(1).map(function (x) {
        return '<p>' + esc(x).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>') + '</p>';
      }).join('') + '</div>' : '';
    }).join('');
    return qs ? '<details class="ch-terms ch-faq"><summary>' + esc(U('chFaqH')) + '</summary>' + qs + '</details>' : '';
  }
  function howHtml() {
    return '<div class="ch-how"><div><i>' + IC.plus + '</i>' + para(U('chHow1')) + '</div><span>←</span>' +
      '<div><i>' + IC.book + '</i>' + para(U('chHow2')) + '</div><span>←</span>' +
      '<div><i>' + IC.ticket + '</i>' + para(U('chHow3')) + '</div></div>' +
      '<p class="ch-rule">' + esc(U('chRule')) + '</p>';
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

  /* ---- ההזמנה: הקישור ווואטסאפ ---- */
  /* הקישור שנשלח. בייצור הכתובות נקיות מסיומת (cleanUrls) — `chaver`;
     עמוד שנפתח עם `.html` (שרת מקומי) — `chaver.html`, אחרת 404. */
  function base() {
    var path = location.pathname, dir = path.replace(/[^\/]*$/, '');
    return location.origin + dir + (/\.html$/.test(path) ? 'chaver.html' : 'chaver');
  }
  function linkOf(c) { return base() + '?ref=' + c; }
  function waOf(c, ph) {
    var n = String(ph || '').replace(/[^0-9]/g, '');
    if (n.indexOf('0') === 0) n = '972' + n.slice(1);
    return 'https://wa.me/' + (n.length >= 11 ? n : '') + '?text=' + encodeURIComponent(tp(U('chShareMsg'), { url: linkOf(c) }));
  }
  /* **החבר שבחר בהרשמה** (8.99.367, "בחבורה"): הכפתור הראשי בבית הוא להזמין
     אותו — בשמו, לטלפון שמסר (אם מסר). אותו קישור הזמנה עם הקוד: חבר חדש
     נרשם דרכו ומשויך למזמין; חבר רשום מקבל הצעה לשבת ומחליט בעצמו
     (?challenge=sit). אין כאן בדיקה אם הוא רשום — אין התאמת זהויות. אחרי
     לחיצה אחת — הכרטיס הרגיל (`df:chFrSent`). */
  function frOf() {
    var m = me();
    if (!m || m.way !== 'chav' || m.rel !== 'friend' || !m.dadFirst || LGet('chFrSent', '')) return null;
    return { n: m.dadFirst, p: m.dadPhone || '' };
  }
  function frHtml(f) { return waBtn(tp(U('chFrBtn'), { name: f.n }), f.p, 'ch-fr', 'ch-fr2'); }
  /* כפתור הוואטסאפ: הקוד כבר במכשיר — קישור ישיר; אחרת — בלחיצה מבקשים את
     הקוד מהשרת (?challenge=ref) ופותחים את וואטסאפ. **השיתוף רק כאן** — נוסח
     ההזמנה הקיים (chShareMsg), ובחירת איש הקשר — בטלפון (8.99.436). */
  function waBtn(label, ph, id, k) {
    var c = LGet(codeKey(), ''), t = esc(label), cl = 'ch-btn wa ' + (k || 'ch-cta');
    return c ? '<a class="' + cl + '" id="' + id + '" data-p="' + esc(ph) + '" target="_blank" rel="noopener" href="' + esc(waOf(c, ph)) + '">' + IC.wa(22) + t + '</a>'
             : '<button class="' + cl + '" id="' + id + '" data-p="' + esc(ph) + '" type="button">' + IC.wa(22) + t + '</button>';
  }
  /* `f` — החבר מההרשמה: אחרי לחיצה הוא "הוזמן" ב"בדרך אליך" (השם נשמר במכשיר). */
  function waWire(id, f, redraw) {
    var b = document.getElementById(id);
    if (!b) return;
    var ph = b.getAttribute('data-p') || '';
    b.onclick = function () {
      if (f) LSet('chFrSent', f.n || '1');
      if (b.tagName === 'A') { if (f && redraw) setTimeout(redraw, 300); return; }
      b.disabled = true;
      var undo = function () { if (f) { try { localStorage.removeItem('df:chFrSent'); } catch (e) {} } b.disabled = false; };
      api('ref', { id: ids().join(',') }).then(function (r) {
        if (r && r.status === 'ok' && r.code) { LSet(codeKey(), r.code); location.href = waOf(r.code, ph); return; }
        undo();
      }, undo);
    };
  }
  /* הקוד מראש, בשקט — שהכפתור יהיה קישור ישיר (בלי המתנה בלחיצה). */
  function codeWarm() {
    if (LGet(codeKey(), '') || codeWarm.on) return;
    codeWarm.on = 1;
    api('ref', { id: ids().join(',') }).then(function (d) {
      if (d && d.status === 'ok' && d.code) LSet(codeKey(), d.code);
    }, function () {});
  }

  /* אין מקום / סיים דף אצל חבר ואין לו שולחן משלו — הצעה חיובית לפתוח. */
  function offerHtml(d) {
    var m = d && d.me;
    if (!m || d.ended) return '';
    /* יצא בהגרלה כי לא למד השבוע — הזמנה עדינה להצטרף מחדש, בלי לומר "יצאת" (8.99.441). */
    if (m.ex && !tabs(d).length) return '<p class="ch-yay">' + esc(U('chExitP')) + '</p>';
    if (m.nr) return '<p class="ch-yay">' + esc(U('chNoRoom')) + '</p>';
    var T = tabs(d);
    /* כשיש "+" (פתיחת שולחן נוסף) — הכפתור הוא ההצעה; בלי פס כפול (8.99.449). */
    if (m.l && !m.plus && T.length && !T.some(function (v) { return v.mine; })) return '<p class="ch-yay">' + esc(U('chOwnOffer')) + '</p>';
    return '';
  }

  /* ---- הקישור, כפי שהשרת הכריע — הודעה אחת, בעדינות ---- */
  function noteHtml(d) {
    if (!d) return '';
    var by = { by: d.refBy || U('chFriend') }, m = d.me || {};
    /* 8.99.385: ישיבה מהקישור = הזמנה; המקום נשמר כשמתחילים ללמוד. */
    /* 8.99.441: הבחירה מושיבה מיד — "הצטרפת לשולחן של…". */
    if (d.sat) return '<p class="ch-yay">' + esc(tp(U('chSitOk'), { by: by.by })) + '</p>';
    /* 8.99.443: "כבר יושב אצל חבר" / "כבר בחרת" / "מלא" — כבר לא הודעה: המצב ליד כל הזמנה. */
    var k = { bad: 'chRefBad', self: 'chRefSelf' }[d.ref];
    return k ? '<p class="ch-note">' + esc(tp(U(k), by)) + '</p>' : '';
  }
  /* רשום (ותיק) עם קישור, ויש מקום: הצעה לשבת — השולחן שישב בו (`refT`). "הצטרפת" —
     רק מתשובת השרת (?challenge=sit), לא מהלחיצה. */
  /* כפתור הוואטסאפ נשאר גלוי גם כשיש הזמנה שממתינה לבחירה — פותחים שולחן משלך. */
  function waOwn(d) { return d.ended ? '' : waBtn(U('chGoWa'), '', 'ch-wa'); }
  /* הזמנה אחת: של מי, לאיזה שולחן, ומה אפשר — כפתור, או שורת מצב ברורה. */
  /* הזמנה אחת לבחירה — השולחן של המזמין (האיור, 8.99.448) והכפתור. */
  function invItem(h) {
    var n = h.n || U('chFriend');
    return '<div class="ch-pick"><b>' + esc(tp(U('chInvGrpH'), { by: n })) + '</b>' +
      (h.t ? tableHtml(seatsOf({ t: h.t }), midOf(''), false, true) : '') +
      ynHtml(h, n) + '</div>';
  }
  /* כן / לא (8.99.453, אחיאסף): "לא" — ההזמנה נמחקת (?challenge=decl). */
  function ynHtml(h, n) {
    return '<div class="ch-yn"><button class="ch-btn ch-cta ch-pk" data-c="' + esc(h.c) + '" type="button">' + esc(tp(U('chPickBtn'), { by: n })) + '</button>' +
      '<button class="ch-btn ch-no" data-c="' + esc(h.c) + '" type="button">' + esc(U('chNoBtn')) + '</button></div>';
  }
  /* **מי שעוד לא יושב** — כרטיס ההזמנות: חבר אחד — "חבר הזמין אותך!", כמה — "{שמות} מזמינים אותך!". */
  function pickHtml(d, L) {
    var nm = L.map(function (h) { return h.n || U('chFriend'); });
    var all = nm.length > 1 ? nm.slice(0, -1).join(', ') + U('chPickAnd') + nm[nm.length - 1] : nm[0];
    var one = L.length === 1;
    return '<div class="ch-tcard ch-home ch-special"><span class="ch-chip">' + esc(U('chCardH')) + '</span>' +
      '<h2 class="ch-hh sm">' + esc(one ? U('chOldH') : tp(U('chPickH'), { names: all })) + '</h2>' +
      '<p class="ch-prize">' + esc(U('chPrize')) + '</p>' +
      '<p class="ch-lead">' + esc(one ? tp(U('chOldP'), { by: nm[0] }) : U('chPickP')) + '</p>' + L.map(invItem).join('') +
      '<p class="ch-sm" id="ch-sit-m" role="status"></p>' + plusBox(d, true) + '</div>';
  }
  /* **מי שכבר יושב והוזמן גם מחבר נוסף** (8.99.448, אחיאסף): כרטיס נפרד מתחת לכרטיס השולחן,
     "{שם} גם הזמין אותך — רוצה לשבת אצלו?" וכפתור. כבר 3 שולחנות — אותה שאלה, והתשובה שאי אפשר. */
  function invHtml(d) {
    /* 8.99.449: כבר 3 שולחנות — ההזמנה לא מוצגת (אין מה לעשות איתה), כמו הזמנה שאין בה מקום. */
    var L = tabs(d).length ? pickList(d).filter(function (h) { return h.st === 'open'; }) : [];
    if (!L.length) return '';
    return L.map(function (h) {
      var n = h.n || U('chFriend');
      return '<div class="ch-tcard ch-home"><p class="ch-lead">' + esc(tp(U('chAlsoInv'), { by: n })) + '</p>' +
        (h.t ? tableHtml(seatsOf({ t: h.t }), midOf(''), false, true) : '') + ynHtml(h, n) + '</div>';
    }).join('') + '<p class="ch-sm" id="ch-sit-m" role="status"></p>';
  }
  function decl(c, redraw) {
    if (window.SureLater && !SureLater(decl, this, arguments)) return;
    var msg = document.getElementById('ch-sit-m');
    api('decl', { id: ids().join(','), ref: c }).then(function (d) {
      if (!d || d.status !== 'ok' || !d.on) { if (msg) msg.textContent = U('chSitErr'); return; }
      if (refAny() === c) dropRef();
      d.ref = '';
      LSet('chMy', { at: Date.now(), d: d });
      redraw(d);
    }, function () { if (msg) msg.textContent = U('chSitErr'); });
  }
  function wireSit(redraw) {
    var nb = document.querySelectorAll('.ch-no');
    for (var q = 0; q < nb.length; q++) nb[q].onclick = function () { decl(this.getAttribute('data-c'), redraw); };
    var own = document.getElementById('ch-own'), msg = document.getElementById('ch-sit-m');
    if (own) own.onclick = function () { dropRef(); };
    var bs = document.querySelectorAll('.ch-pk');
    for (var i = 0; i < bs.length; i++) bs[i].onclick = function () {
      var b = this, all = document.querySelectorAll('.ch-pk');
      var dis = function (v) { for (var j = 0; j < all.length; j++) all[j].disabled = v; };
      var fail = function () { dis(false); if (msg) msg.textContent = U('chSitErr'); };
      dis(true);
      if (msg) msg.textContent = U('chSitWait');
      api('sit', { id: ids().join(','), ref: b.getAttribute('data-c') }).then(function (d) {
        if (!d || d.status !== 'ok' || !d.on || !d.ref || d.ref === 'old' || d.ref === 'wait') { fail(); return; }
        LSet('chMy', { at: Date.now(), d: d });
        /* הצטרף — "הצטרפת לשולחן של…". אין מקום / כבר 3 — המצב מופיע ליד ההזמנה. */
        if (d.ref === 'ok') { dropRef(); d.sat = 1; }
        /* נתפס רגע לפני (8.99.448) — "מצטערים, הכיסא כבר היה תפוס…". */
        if (d.ref === 'full' && d.me) d.me.nr = 1;
        redraw(d);
      }, fail);
    };
  }
  /* כרטיס הבחירה/הישיבה, אם צריך — אחרת ''. */
  function choiceHtml(d) {
    var L = pickList(d).filter(function (h) { return h.st === 'open'; });
    return !tabs(d).length && L.length ? pickHtml(d, L) : '';
  }

  /* ---- בהרשמה (join.html): "מצטרף לשולחן של יוסי" — מהנחיתה ועד
     שהפרטים נשלחו. השם — מהנחיתה, ואם אין (באייפון האפליקציה
     המותקנת לא רואה את הדפדפן) — מהשרת. ---- */
  function strip(box) {
    if (!box) return;
    var r = ref();
    if (!r || me()) { box.innerHTML = ''; return; }
    var put = function (nm) {
      box.innerHTML = nm ? '<div class="ch-strip">' + IC.plus + '<span>' + esc(tp(U('chStrip'), { name: nm })) + '</span></div>' : '';
    };
    var nm = LGet('chRefBy', '');
    put(nm);
    if (!nm) api('land', { ref: r }).then(function (L) {
      if (L && L.on && L.name) { LSet('chRefBy', L.name); put(L.name); }
    }, function () {});
  }

  /* ---- ההשקה: פעם אחת בכל מכשיר, למי שעוד אין לו שולחן ולא הגיע
     מקישור. "למבצע" — גלילה לכרטיס המבצע בבית (#chal). ---- */
  function promo(d) {
    /* סבב (8.99.453): "להציג שוב לכולם" בניהול מעלה את `pv` — כל מכשיר רואה פעם אחת לכל סבב. */
    var pv = String(d && d.pv || 1);
    if (!d || !d.on || d.ended || !student() || !shown(d) || refAny() || String(LGet('chPromo', '')) === pv) return;
    LSet('chPromo', pv);
    if (tv(d)) return;
    promoShow(num(startSeats()), null);
  }
  /* החלון עצמו. `done` — נקרא כשנסגר (ההודעה מההתראה, inbox.js). */
  function promoShow(seats, done) {
    var el = document.createElement('div'), back = document.activeElement;
    el.className = 'ch-promo';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'ch-promo-h');
    el.innerHTML = '<div class="ch-promo-in"><span class="ch-chip">' + esc(U('chNewChip')) + '</span>' +
      '<h2 class="ch-hh" id="ch-promo-h">' + esc(U('chCardH')) + '</h2>' +
      '<p class="ch-prize">' + esc(U('chPrize')) + '</p>' + tableHtml(seats, midOf(''), true) +
      '<p class="ch-lead">' + esc(U('chPromoP')) + '</p>' +
      '<button class="ch-btn ch-cta" id="ch-promo-go" type="button">' + esc(U('chPromoGo')) + '</button>' +
      '<button class="ch-promo-x" id="ch-promo-x" type="button">' + esc(U('chPromoLater')) + '</button></div>';
    document.body.appendChild(el);
    var close = function (stay) {
      document.removeEventListener('keydown', key);
      if (el.parentNode) el.parentNode.removeChild(el);
      try { if (!stay && back && back !== document.body && back.focus) back.focus(); } catch (e) {}
      if (done) { var f = done; done = null; f(); }
    };
    var key = function (e) { if (e.key === 'Escape' || e.keyCode === 27) close(); };
    document.addEventListener('keydown', key);
    el.onclick = function (e) { if (e.target === el) close(); };
    document.getElementById('ch-promo-x').onclick = function () { close(); };
    var go = document.getElementById('ch-promo-go');
    go.onclick = function () {
      close(true);
      var c = document.getElementById('chal');
      if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    try { go.focus(); } catch (e) {}
  }
  /* **ההתראה על השקת המבצע, כשהיא נפתחת באפליקציה** (8.99.399, אחיאסף): במקום
     החלונית הכללית של ההודעות (inbox.js) — חלון המבצע עם השולחן. מי שכבר יושב
     בשולחן רואה את השולחן שלו. false — לא תלמיד: החלונית הרגילה. */
  function promoMsg(done) {
    if (!student()) return false;
    var c0 = cached();
    LSet('chPromo', String(c0 && c0.pv || 1));
    promoShow(seatsOf(tv(cached())), done);
    return true;
  }

  /* ---- מההתראה על תוצאות הגרלה (?ms=k): מה קרה לשולחן שלי — רק כשהשרת
     אישר שההגרלה הזו הוכרעה (`msr`), ורק כשהקישור עצמו ביקש אותה. ---- */
  function msrHtml(d) {
    var r = d && d.msr;
    if (!r || !new RegExp('[?&]ms=' + r.k + '(?:&|$)').test(location.search)) return '';
    var k = r.r === 'won' ? 'chMsrWon' : r.r === 'lost' ? 'chMsrLost' : 'chMsrNone';
    return '<div class="ch-tcard' + (r.r === 'won' ? ' won' : '') + '"><span class="ch-chip">' + esc(U('chMsrChip')) + '</span>' +
      '<h2 class="ch-hh sm">' + esc(U(k + 'H')) + '</h2><p class="ch-lead">' + esc(U(k)) + '</p></div>';
  }

  /* ============================================================
     הכרטיס בבית התלמיד.
     ============================================================ */
  function sync() {}
  /* **חשיפה** (8.99.352): ב"מוזמנים" השרת מחזיר `pub:false` למי שאינו משתתף
     — אין כרטיס בבית ואין חלון השקה. מכשיר הניהול (df:admOk) רואה תמיד.
     הנחיתה מקישור ועמוד האתגר — פתוחים לכל מי שיש לו קישור.
     "המסך שלי כתלמיד" (asStuOn) — גם הוא רואה: זה השלב שבו אחיאסף בודק
     כתלמיד אמיתי, גם כשהופעל ממכשיר אחר. */
  function shown(d) {
    if (d && d.pub !== false) return true;
    return isAdminView() || asStuOn();
  }
  function cardDraw(box, d) {
    if (!d || !d.on || !student() || !shown(d)) { box.innerHTML = ''; return; }
    /* מוזמן מכמה חברים, או רשום שהגיע מקישור — הבחירה היא הכרטיס. */
    var ch = choiceHtml(d);
    if (ch) {
      box.innerHTML = noteHtml(d) + ch;
      wireSit(function (x) { cardDraw(box, x); });
      plusWire(function (x) { cardDraw(box, x); });
      waWire('ch-wa', null);
      if (!d.ended) codeWarm();
      return;
    }
    /* **הכול בבית** (8.99.451, אחיאסף): בלי מסך שולחן נפרד — אותו שולחן, הכיסאות, המעבר, וואטסאפ
       והשאלות. "שולחן נוסף" — כרטיס משלו מתחת. */
    box.innerHTML = oneHtml(d, true) + faqHtml();
    plusWire(function (x) { cardDraw(box, x); });
    swWire(function () { cardDraw(box, cached() || d); });
    wireSit(function (x) { cardDraw(box, x); });
    waWire('ch-wa', null);
    if (!d.ended) codeWarm();
  }
  function card(box) {
    if (!box) return;
    if (!student()) { box.innerHTML = ''; return; }
    grabRef();
    cardDraw(box, cached());
    /* הבית מצטייר כמה פעמים בטעינה אחת — פנייה לשרת פעם בחצי דקה. */
    if (Date.now() - LAST < 30000) return;
    LAST = Date.now();
    pull(box, 0);
    watch(function () { pull(box, 3); });
  }
  /* **השולחן מתעדכן לבד** (8.99.373; כל דקה מ-8.99.374): כשחוזרים למסך (מהדף, מוואטסאפ) — מיד, ועוד
     כל דקה כל עוד המסך פתוח, עד עשר דקות. רק למי שיש שולחן או שהוזמן —
     לכל השאר אין מה להתעדכן. השרת מחזיק את המודל במטמון, והלימוד של משתתף
     מנקה אותו (chBustFor_), ולכן קריאה כזו זולה. */
  var WATCH = null;
  function watch(fn) {
    if (WATCH) { WATCH.fn = fn; return; }
    WATCH = { fn: fn, n: 0 };
    var live = function () {
      var d = cached(), m = d && d.me;
      return !!(m && (m.t || m.pend || (m.ts && m.ts.length) || (m.way && m.way.length)));
    };
    var go = function (gap) {
      if (document.visibilityState === 'hidden' || !live() || Date.now() - LAST < gap) return;
      LAST = Date.now();
      WATCH.fn();
    };
    document.addEventListener('visibilitychange', function () { go(5000); });
    var t = setInterval(function () { if (++WATCH.n > 10) { clearInterval(t); return; } go(55000); }, 60000);
  }
  /* **ניסיון חוזר** (8.99.372): רגע אחרי ההרשמה השרת עוד כותב את השורה (עסוק,
     או "wait"), ותשובה שלא הגיעה השאירה את הבית בלי הכרטיס עד הפתיחה הבאה. עכשיו —
     עוד שלושה ניסיונות, אחרי 5, 12 ו-30 שניות, רק כשהתשובה לא הגיעה או "wait". */
  function pull(box, n) {
    load().then(function (d) {
      cardDraw(box, d);
      if (FRESH) promo(d);
      if ((!FRESH || (d && d.ref === 'wait')) && n < 3) setTimeout(function () { pull(box, n + 1); }, [5000, 12000, 30000][n]);
    });
  }
  var LAST = 0;
  /* עמוד האתגר — אותו ניסיון חוזר (8.99.405). קודם: תשובה אחת שלא הגיעה השאירה את
     "לא הצלחנו לטעון" עד שהתלמיד רענן בעצמו. */
  function pageGet(box, n) {
    load().then(function (d) {
      if (FRESH || !d || n === 0) pageDraw(box, d);
      if ((!FRESH || (d && d.ref === 'wait')) && n < 3) setTimeout(function () { pageGet(box, n + 1); }, [5000, 12000, 30000][n]);
    });
  }

  /* ============================================================
     עמוד האתגר.
     ============================================================ */
  /* ============================================================
     מסך השולחן (8.99.385) — אותו תוכן בשני מקומות: מעל הבית (pgOpen)
     ובעמוד האתגר (chaver.html, למי שנחת מקישור או מההתראה).
     ============================================================ */
  function fullHtml(d) {
    var m = d.me || {};
    var h = msrHtml(d) + (d.sat ? '' : yayHtml(m)) + noteHtml(d);
    var ch = choiceHtml(d);
    if (ch) return h + ch + faqHtml();
    /* **שולחן אחד בתצוגה, ופלוס מתחתיו** (8.99.441, אחיאסף) — לא שלושה יחד. */
    h += offerHtml(d) + oneHtml(d);
    /* "התנאים" ירדו ממסך השולחן (8.99.388, אחיאסף). */
    return h + faqHtml();
  }
  /* הכפתורים שבתחתית כל מסך שולחן: וואטסאפ (תמיד), החבר מההרשמה, הדף של
     השבוע (מי שעוד לא למד), "בדרך אליך" ומשפט העידוד. */
  /* **מבנה קבוע** (8.99.453, אחיאסף): כותרת · שולחן · כפתור אחד. השולחן שלך — להזמין חברים;
     שולחן של חבר — בלי כפתור, ומתחתיו "רוצה לפתוח שולחן משלך?". */
  function tailHtml(d) {
    var v = tv(d);
    return d.ended || (v && !v.t.mine) ? '' : waBtn(U('chWaMore'), '', 'ch-wa');
  }
  /* **שולחן אחד** (מסך 2 בבריף). */
  function oneHtml(d, home) {
    var v = tv(d), seats = seatsOf(v), st = stOf(v);
    var line = lineOf(v, d);
    /* 8.99.449: בלי "N מקומות פנויים" — האיור מראה אותם. */
    return '<div class="ch-tcard ch-special' + (home ? ' ch-home' : '') + ' ' + cls(st) + '">' +
      (home ? yayHtml(d.me) + noteHtml(d) + offerHtml(d) : '') + '<span class="ch-chip">' + esc(U('chSpecialChip')) + '</span>' +
      '<h2 class="ch-hh sm">' + esc(titleOf(v)) + '</h2><p class="ch-prize">' + esc(U('chPrize')) + '</p>' +
      tableHtml(seats, midOf(st), false, true) + (line ? '<p class="ch-tline">' + esc(line) + '</p>' : '') + swHtml(d) +
      tailHtml(d) + (v || home ? '' : howHtml()) + countHtml(d) + '</div>' + plusHtml(d) + invHtml(d);
  }
  /* "+" — שולחן נוסף (?challenge=newt). מופיע רק כשהשרת אומר שאפשר (`me.plus`): יש שולחן, פחות
     מ-3 בסך הכול, ואין שולחן משלך שיש בו מקום. התשובה — המבט האישי, והשולחן החדש מוצג. */
  /* מתחת לשולחן (8.99.442, אחיאסף): מעבר קטן לשולחנות האחרים — מספר לכל שולחן, השם בתיאור —
     ו"+" לפתיחת נוסף. שום שולחן אינו נעלם. */
  function swHtml(d) {
    var T = tabs(d), v = tv(d), cur = v && v.t ? v.t.id : '';
    if (T.length < 2) return '';
    return '<div class="ch-tsw" role="group">' + T.map(function (t, i) {
      var nm = t.mine ? U('chMyGrpH') : tp(U('chInvGrpH'), { by: t.name });
      return '<button type="button" class="ch-tsb" data-t="' + esc(t.id) + '" aria-label="' + esc(nm) + '" title="' + esc(nm) + '"' +
        (t.id === cur ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + (i + 1) + '</button>';
    }).join('') + '</div>';
  }
  function swWire(redraw) {
    var bs = document.querySelectorAll('.ch-tsb');
    for (var i = 0; i < bs.length; i++) bs[i].onclick = function () { CURT = this.getAttribute('data-t') || ''; redraw(); };
  }
  /* 8.99.451 (אחיאסף): כרטיס נפרד לשולחן נוסף, עם ההסבר. */
  function plusHtml(d) { return tabs(d).length ? plusBox(d, false) : ''; }
  /* "רוצה לפתוח שולחן משלך?" — כותרת, השולחן הריק, כפתור (8.99.453). `inner` — בתוך כרטיס ההזמנות. */
  function plusBox(d, inner) {
    var m = d && d.me;
    if (!m || !m.plus || d.ended) return '';
    return '<div class="' + (inner ? 'ch-pick' : 'ch-tcard ch-home') + '"><b class="ch-plus-h">' + esc(U(tabs(d).some(function (t) { return t.mine; }) ? 'chPlusQ2' : 'chPlusQ')) + '</b>' +
      (inner ? '' : '<p class="ch-sm">' + para(U('chPlusP')) + '</p>') +
      tableHtml(num(startSeats()), midOf(''), false, true) +
      '<button type="button" class="ch-btn ch-cta" id="ch-plus">' + esc(U('chPlusT')) + '</button>' +
      '<p class="ch-sm" id="ch-plus-m" role="status"></p></div>';
  }
  function plusWire(redraw) {
    var b = document.getElementById('ch-plus'), msg = document.getElementById('ch-plus-m');
    if (!b) return;
    b.onclick = function () {
      var fail = function () { b.disabled = false; if (msg) msg.textContent = U('chSitErr'); };
      b.disabled = true;
      api('newt', { id: ids().join(',') }).then(function (d) {
        if (!d || d.status !== 'ok' || !d.on) { fail(); return; }
        LSet('chMy', { at: Date.now(), d: d });
        CURT = '';
        redraw(d);
      }, fail);
    };
  }
  function fullWire(box, d, redraw) {
    if (choiceHtml(d)) { wireSit(redraw); plusWire(redraw); if (!d.ended) codeWarm(); return; }
    plusWire(redraw);
    swWire(function () { redraw(); });
    wireSit(redraw);
    waWire('ch-wa', null);
    waWire('ch-fr', d.ended ? null : frOf(), redraw);
    if (!d.ended) codeWarm();
  }
  function pageDraw(box, d) {
    if (!d) { box.innerHTML = '<p class="ch-sm">' + esc(U('chErr')) + '</p>'; return; }
    if (!d.on) { box.innerHTML = '<div class="ch-card"><p class="ch-st">' + esc(U('chOff')) + '</p></div>'; return; }
    box.innerHTML = fullHtml(d);
    fullWire(box, d, function (x) { pageDraw(box, x || cached() || d); });
    var own = document.getElementById('ch-own');
    if (own) own.onclick = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      dropRef();
      d.ref = '';
      pageDraw(box, d);
    };
  }

  /* הנחיתה מקישור — למי שעוד לא נרשם במכשיר הזה. השם נשמר במכשיר,
     ל"מצטרף לשולחן של…" לאורך ההרשמה (strip). קוד שאינו קיים —
     אומרים, ובכל זאת אפשר להירשם. */
  function landDraw(box, L) {
    var on = L && L.on, nm = L && L.name, bad = L && L.bad, full = !!(L && L.full);
    if (nm) LSet('chRefBy', nm);
    var v = { name: nm || U('chFriend') };
    /* השולחן של המזמין מלא (8.99.385) — "הזמין אותך להצטרף למבצע!", והשולחן
       שלך ריק: כשתתחיל ללמוד, הוא שלך. */
    box.innerHTML = '<div class="ch-card land">' +
      (bad ? '<h2>' + esc(U('chLandBadH')) + '</h2><p class="ch-note">' + esc(U('chRefBad')) + '</p>'
           : '<h2>' + esc(nm ? tp(U(full ? 'chLandFull' : 'chLandH'), v) : U('chLandHx')) + '</h2>' +
             (on ? '<p class="ch-prize">' + esc(U('chPrize')) + '</p>' + tableHtml(num(full ? landSeats('').slice(1).concat([free()]) : landSeats(nm)), midOf(''), false, true) : '') +
             /* אין מקום אצל המזמין — מה עושים עכשיו (8.99.448, אחיאסף). */
             /* 8.99.451: בלי "בוא תצטרף לאתגר…" (chLandP) ובלי "כבר רשום…" (chLandNote), אחיאסף. */
             (on && !full ? '' : '<p class="ch-lead">' + esc(on ? tp(U('chLandFullP'), v) : U('chLandOff')) + '</p>')) +
      (on && !bad && ios() ? '<div id="ch-app"><button class="ch-btn big" id="ch-app-go" type="button">' + esc(U('chLandBtn')) + '</button></div>'
        : '<a class="ch-btn big" href="join.html' + (bad ? '' : '?ref=' + encodeURIComponent(ref())) + '">' +
        esc(bad ? U('chLandReg') : U('chLandBtn')) + '</a>') + '</div>';
    appWire(nm || U('chFriend'));
  }
  function ios() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  /* **אייפון: "יש לך אפליקציה?"** (8.99.454, אחיאסף). הקישור נפתח בספארי, שאינו מכיר את האפליקציה
     המותקנת. כן — מוסרים טלפון, וההזמנה מחכה באפליקציה (?challenge=byph). לא — ההרשמה וההתקנה, כרגיל. */
  function appWire(by) {
    var box = document.getElementById('ch-app'), go = document.getElementById('ch-app-go');
    if (!box || !go) return;
    var reg = 'join.html?ref=' + encodeURIComponent(ref());
    go.onclick = function () {
      box.innerHTML = '<p class="ch-lead">' + esc(U('chAppQ')) + '</p><div class="ch-yn">' +
        '<button class="ch-btn ch-cta" id="ch-app-y" type="button">' + esc(U('chAppYes')) + '</button>' +
        '<a class="ch-btn ch-no" href="' + esc(reg) + '">' + esc(U('chAppNo')) + '</a></div>';
      document.getElementById('ch-app-y').onclick = function () { form(false); };
    };
    var form = function (many) {
      box.innerHTML = '<label class="ch-lead" for="ch-app-ph">' + esc(U('chAppPh')) + '</label>' +
        '<input class="ch-in" id="ch-app-ph" type="tel" inputmode="tel" autocomplete="tel" dir="ltr">' +
        (many ? '<label class="ch-lead" for="ch-app-f">' + esc(U('chAppFirst')) + '</label><input class="ch-in" id="ch-app-f" type="text" autocomplete="given-name">' : '') +
        '<button class="ch-btn big" id="ch-app-s" type="button">' + esc(U('chAppSend')) + '</button><p class="ch-sm" id="ch-app-m" role="status"></p>';
      var ph = document.getElementById('ch-app-ph'), f = document.getElementById('ch-app-f');
      if (form.ph) ph.value = form.ph;
      try { (many && f ? f : ph).focus(); } catch (e) {}
      document.getElementById('ch-app-s').onclick = function () {
        var b = this, m = document.getElementById('ch-app-m'), v = String(ph.value || '').replace(/[^0-9+]/g, '');
        if (v.replace(/\D/g, '').length < 9) { m.textContent = U('chAppPhBad'); return; }
        form.ph = ph.value;
        b.disabled = true; m.textContent = U('chSitWait');
        api('byph', { ref: ref(), ph: v, first: f ? String(f.value || '').trim() : '' }).then(function (d) {
          b.disabled = false; m.textContent = '';
          var st = d && d.status === 'ok' ? d.st : '';
          if (st === 'ok') { box.innerHTML = '<p class="ch-yay">' + esc(tp(U('chAppOk'), { by: by })) + '</p>'; return; }
          if (st === 'many') { form(true); return; }
          if (st === 'none') {
            box.innerHTML = '<p class="ch-lead">' + esc(U('chAppNone')) + '</p><a class="ch-btn big" href="' + esc(reg) + '">' + esc(U('chAppReg')) + '</a>';
            return;
          }
          m.textContent = U('chSitErr');
        }, function () { b.disabled = false; m.textContent = U('chSitErr'); });
      };
    };
  }
  /* השולחן בנחיתה: המזמין, "אתה" (פנוי עם השם), ושני מקומות. */
  function landSeats(nm) {
    return [{ k: 'host', n: nm || U('chFriend'), i: String(nm || '').charAt(0), inv: true },
            { k: 'you', n: U('chMe'), i: '?' }, free(), free()];
  }
  function page(box) {
    if (!box) return;
    /* `&old=1` — חבר שכבר רשום (בניסוי): נרשמים קודם בלי הקוד, וההזמנה
       מחכה בצד (`chRefLater`) עד אחרי ההרשמה. */
    var old1 = /[?&]old=1(?:&|$)/.test(location.search), m1 = /[?&]ref=([A-Za-z0-9]{4,10})(?:&|$)/.exec(location.search);
    if (old1 && m1) {
      try { localStorage.removeItem('df:chRef'); } catch (e) {}
      LSet('chRefLater', m1[1].toUpperCase());
      if (!me()) {
        box.innerHTML = '<div class="ch-card land"><h2>' + esc(U('chOldLandH')) + '</h2><p class="ch-lead">' +
          esc(U('chOldLandP')) + '</p><a class="ch-btn big" href="join.html">' + esc(U('chOldLandBtn')) + '</a></div>';
        return;
      }
    }
    var r = old1 ? '' : grabRef();
    if (!me()) {
      if (!r) { location.replace('join.html'); return; }
      landDraw(box, null);
      api('land', { ref: r }).then(function (L) { landDraw(box, L); }, function () {});
      return;
    }
    /* בלי מטמון — ריק עד שהשרת עונה, ולא הודעת שגיאה מהבהבת. */
    var c0 = cached();
    if (c0) pageDraw(box, c0);
    LAST = Date.now();
    pageGet(box, 0);
    watch(function () { load().then(function (d) { if (FRESH) pageDraw(box, d); }); });
  }

  /* `table`/`ic` — לשולחן של הרביעייה (quad.js, 8.99.328): אותו ציור. */
  window.CHAL = { card: card, page: page, grabRef: grabRef, ref: ref, strip: strip, table: tableHtml, ic: IC, promoMsg: promoMsg };
})();
