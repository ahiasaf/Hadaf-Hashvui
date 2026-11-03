/* ============================================================
   סקירת הישיבות — רכיב אחד, בשני מקומות (19.10.2026).
   ============================================================
   "ממשק מאוחד אחד": אותה רשימה בדיוק נפתחת בניהול ← ישיבות
   ובקישור שאחיאסף מעביר למנהלים (skira.html). בחוץ — תוצאות:
   כמה נרשמו, כמה לומדים בפועל, ומי הרכז בשטח. החץ פותח את
   משפט הסיכום; לחיצה נוספת סוגרת; בברירת מחדל הכול סגור.

   הנתונים באים מטבלת הסקירה דרך הסקריפט (ov_ ב-apps-script.gs)
   — ושם גם נכתב כל עדכון. כאן אין שום מספר שנגזר: "לומדים
   בפועל" ריק הוא "לא ידוע", לא אפס.

   הרכיב אינו יודע מאיפה באו השורות ולאן הולכת השמירה: העמוד
   מוסר לו `save(row, field, value)` שמחזירה Promise של השורה
   כפי שהטבלה מחזיקה אותה אחרי הכתיבה.

   ES5 בלבד. המלל — ב-UI שב-data.js (המפתחות ov*). העיצוב —
   כאן, כדי ששני העמודים ייראו אותו דבר בלי שני עותקים.
   ============================================================ */
(function () {
  var CSS =
    '.ov-tot{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 12px}' +
    '.ov-tb{background:#FFFDF8;border:1px solid #E5DAC3;border-radius:14px;padding:12px 13px;' +
      'box-shadow:0 1px 2px rgba(37,29,12,.05),0 2px 8px rgba(37,29,12,.05)}' +
    '.ov-tb b{display:block;font-size:1.7rem;font-weight:800;letter-spacing:-.03em;line-height:1.15;color:#0B2550}' +
    '.ov-tb span{display:block;font-size:.8rem;font-weight:800;color:#1B2A45}' +
    '.ov-tb i{display:block;font-style:normal;font-size:.72rem;font-weight:700;color:#5C687E;margin-top:2px}' +
    '.ov-tb.act b{color:#2E6B12}' +
    '.ov-list{display:grid;gap:8px}' +
    '.ov-r{background:#FFFDF8;border:1px solid #E5DAC3;border-radius:14px;overflow:hidden;' +
      'border-inline-start:6px solid #C9C2B2}' +
    '.ov-r.s-ok{border-inline-start-color:#4E9A2A}' +
    '.ov-r.s-wait{border-inline-start-color:#D9A43A}' +
    '.ov-h{display:flex;align-items:center;gap:10px;padding:11px 12px}' +
    '.ov-m{flex:1;min-width:0}' +
    '.ov-n{display:block;font-size:.98rem;font-weight:800;color:#0B2550;line-height:1.3;' +
      'background:none;border:0;padding:0;text-align:start;font-family:inherit;cursor:default}' +
    'button.ov-n.go{cursor:pointer;text-decoration:underline;text-decoration-color:rgba(23,70,143,.35);' +
      'text-underline-offset:3px}' +
    '.ov-c{display:block;font-size:.78rem;font-weight:700;color:#5A6780;margin-top:2px}' +
    '.ov-c.no{color:#8A8F99;font-weight:600}' +
    '.ov-k{display:flex;gap:6px;flex:none}' +
    '.ov-v{min-width:58px;text-align:center;border-radius:10px;padding:5px 6px;background:#F3EEE2}' +
    '.ov-v b{display:block;font-size:1.15rem;font-weight:800;line-height:1.1;color:#1B2A45}' +
    '.ov-v small{display:block;font-size:.64rem;font-weight:800;color:#5C687E;line-height:1.3}' +
    '.ov-v em{display:block;font-style:normal;font-size:.6rem;font-weight:700;color:#5C687E}' +
    '.ov-v.a{background:#E7F2DD}.ov-v.a b{color:#2E6B12}' +
    '.ov-v.big{min-width:74px;background:#E8EEF8}.ov-v.big b{font-size:1.55rem;color:#0B2550}' +
    '.ov-v.big.u b{font-size:.78rem;color:#8C681F}' +
    '.ov-split{font-size:.82rem;font-weight:700;color:#5A6780;margin:0 0 8px}' +
    '.ov-ppl{display:grid;gap:6px;margin:0 0 10px}' +
    '.ov-p{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #EFE7D7;border-radius:12px;' +
      'padding:7px 8px 7px 12px}' +
    '.ov-p .w{flex:1;min-width:0;line-height:1.3}' +
    '.ov-p .w small{display:block;font-size:.68rem;font-weight:800;color:#8C681F;letter-spacing:.02em}' +
    '.ov-p .w b{display:block;font-size:.88rem;font-weight:800;color:#1B2A45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ov-ic{flex:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'text-decoration:none;box-shadow:0 1px 3px rgba(37,29,12,.12)}' +
    '.ov-ic svg{width:18px;height:18px;fill:#fff}' +
    '.ov-ic.tel{background:linear-gradient(140deg,#3574CE,#17468F)}' +
    '.ov-ic.wa{background:linear-gradient(140deg,#3FC152,#1FA637)}' +
    '.ov-ic:active{transform:scale(.94)}' +
    '.ov-f .sug{font-size:.7rem;font-weight:700;color:#4E9A2A;margin-inline-start:6px}' +
    '.ov-e.ov-go{margin:0 0 8px;background:#17468F;border-color:#17468F;color:#fff}' +
    '.ov-v.u b{font-size:.78rem;color:#8C681F;padding:3px 0}.ov-v.u{background:#FBF1DB}' +
    '.ov-x{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid #E5DAC3;background:#fff;' +
      'color:#17468F;font-size:1rem;font-weight:800;cursor:pointer;transition:transform .15s}' +
    '.ov-x.on{transform:rotate(180deg)}' +
    '.ov-b{padding:0 12px 12px;font-size:.9rem;font-weight:600;color:#1B2A45;line-height:1.65}' +
    '.ov-t{background:rgba(192,143,43,.08);border-radius:10px;padding:9px 11px;white-space:pre-wrap;' +
      'overflow-wrap:anywhere}' +
    '.ov-t.no{color:#5C687E}' +
    '.ov-e{display:inline-block;margin-top:8px;border:1px solid #E5DAC3;background:#fff;border-radius:10px;' +
      'padding:6px 13px;font:inherit;font-size:.82rem;font-weight:800;color:#17468F;cursor:pointer}' +
    '.ov-f label{display:block;font-size:.76rem;font-weight:800;color:#5A6780;margin:9px 0 3px}' +
    '.ov-f input,.ov-f textarea{width:100%;box-sizing:border-box;font:inherit;font-size:.95rem;' +
      'border:1.5px solid #E5DAC3;border-radius:10px;padding:8px 10px;background:#fff;color:#1B2A45}' +
    '.ov-f textarea{min-height:70px;resize:vertical}' +
    '.ov-fb{display:flex;gap:8px;margin-top:10px}' +
    '.ov-fb button{flex:1;font:inherit;font-size:.9rem;font-weight:800;border-radius:11px;padding:10px;' +
      'cursor:pointer;border:1px solid #E5DAC3;background:#fff;color:#1B2A45}' +
    '.ov-fb button.p{background:#17468F;border-color:#17468F;color:#fff}' +
    '.ov-try{font-weight:900;color:#A4421F}' +
    '.ov-ans{margin:-2px 0 6px;padding:8px 10px;background:#F3EEE2;border-radius:12px}' +
    '.ov-ans .ov-fb{margin-top:0}.ov-ans label{margin-top:0}.ov-ans .ov-fb + .ov-msg{margin-top:6px}' +
    '.ov-msg{font-size:.78rem;font-weight:700;color:#5C687E;margin-top:7px}' +
    '.ov-msg.bad{color:#B23B3B}' +
    '.ov-x2{font-size:.78rem;font-weight:700;color:#5A6780;margin-top:8px}' +
    '.ov-sug{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.8rem;' +
      'font-weight:700;color:#8C681F}' +
    '.ov-sug button{font:inherit;font-size:.78rem;font-weight:800;border:1px solid #D9A43A;background:#fff;' +
      'color:#8C681F;border-radius:30px;padding:3px 11px;cursor:pointer}' +
    '.ov-note{font-size:.8rem;font-weight:700;color:#5C687E;margin:10px 2px 0;line-height:1.6}' +
    '.ov-nav{margin:0 0 12px}' +
    '.ov-nav summary{cursor:pointer;font-size:.86rem;font-weight:800;color:#17468F;padding:6px 0;list-style:none}' +
    '.ov-nav summary::-webkit-details-marker{display:none}' +
    '.ov-nav summary:after{content:" ▾"}' +
    '.ov-nav[open] summary:after{content:" ▴"}' +
    '.ov-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}' +
    '.ov-tab{border:1px solid #E5DAC3;background:#fff;border-radius:11px;padding:6px 10px;font:inherit;' +
      'font-size:.8rem;font-weight:800;color:#1B2A45;cursor:pointer;display:flex;gap:6px;align-items:center}' +
    '.ov-tab b{font-size:.8rem;color:#2E6B12}' +
    '.ov-tab b.u{color:#8C681F;font-weight:700}' +
    '.ov-tab.on{background:#17468F;border-color:#17468F;color:#fff}' +
    '.ov-tab.on b,.ov-tab.on b.u{color:#fff}';

  function U(k) { return (window.UI || {})[k] || ''; }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function fill(t, m) {
    return String(t == null ? '' : t).replace(/\{([^}]+)\}/g, function (_, k) { return m[k] == null ? '' : m[k]; });
  }
  function num(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function has(v) { return String(v == null ? '' : v).trim() !== ''; }
  function digits(p) { return String(p || '').replace(/[^0-9]/g, ''); }
  function waNum(p) { var d = digits(p); return d.indexOf('972') === 0 ? d : '972' + d.replace(/^0/, ''); }
  var IC_TEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>';
  var IC_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg>';
  /* אנשי הקשר של הישיבה — רכז, ראש ישיבה, ראש חטיבה — עם שני כפתורים
     קטנים: שיחה ווואטסאפ. רק מי שיש לו טלפון שהבעלים שמר. */
  function pplHtml(r, i, st) {
    var L = (r.ppl || []).filter(function (p) { return has(p.phone) && has(p.name); });
    if (!L.length) return '';
    /* יומן הקשר (3.11.2026) — רק כשהעמוד מוסר `call`: כל לחיצה על חיוג
       או וואטסאפ נרשמת, ובחזרה — "ענה" / "לא ענה" מתחת לאיש הקשר. */
    var on = !!st.call, pd = on ? pendGet() : null;
    return '<div class="ov-ppl">' + L.map(function (p) {
      var dc = on ? ' data-ov="call" data-i="' + i + '" data-pk="' + esc(p.k) + '"' : '';
      var h = '<div class="ov-p"><div class="w"><small>' + esc(U('ovRole_' + p.k)) + '</small><b>' + esc(p.name) + '</b></div>' +
        '<a class="ov-ic tel"' + dc + ' data-kind="tel" href="tel:' + digits(p.phone) + '" aria-label="' + esc(fill(U('ovCall'), { name:p.name })) + '">' + IC_TEL + '</a>' +
        '<a class="ov-ic wa"' + dc + ' data-kind="wa" target="_blank" rel="noopener" href="https://wa.me/' + waNum(p.phone) + '" aria-label="' +
          esc(fill(U('ovWa'), { name:p.name })) + '">' + IC_WA + '</a></div>';
      if (pd && pd.code === r.code && pd.pk === p.k) h += pendHtml(pd, i);
      return h;
    }).join('') + '</div>';
  }
  /* השיחה שממתינה לתוצאה — אחת בכל פעם, במכשיר (שורדת יציאה לחייגן). */
  var PEND_K = 'df:ovPend';
  function pendGet() {
    try { var o = JSON.parse(localStorage.getItem(PEND_K) || 'null'); return o && o.id ? o : null; } catch (e) { return null; }
  }
  function pendSet(o) {
    try { if (o) localStorage.setItem(PEND_K, JSON.stringify(o)); else localStorage.removeItem(PEND_K); } catch (e) {}
  }
  function pendHtml(pd, i) {
    if (pd.step === 'note') {
      return '<div class="ov-ans ov-f"><label for="ov-nt">' + esc(U('ovNoteL')) + '</label>' +
        '<textarea id="ov-nt" maxlength="600">' + esc(pd.tx || '') + '</textarea>' +
        '<div class="ov-fb"><button class="p" data-ov="ntsave" data-i="' + i + '">' + esc(U('ovNoteSave')) + '</button>' +
        '<button data-ov="ntskip" data-i="' + i + '">' + esc(U('ovNoteSkip')) + '</button></div>' +
        (pd.err ? '<div class="ov-msg bad">' + esc(U('ovCallFail')) + '</div>' : '') + '</div>';
    }
    return '<div class="ov-ans"><div class="ov-fb">' +
      '<button class="p" data-ov="ans" data-v="yes" data-i="' + i + '">' + esc(U('ovAnsY')) + '</button>' +
      '<button data-ov="ans" data-v="no" data-i="' + i + '">' + esc(U('ovAnsN')) + '</button></div>' +
      (pd.err ? '<div class="ov-msg bad">' + esc(U('ovCallFail')) + '</div>' : '') + '</div>';
  }
  function agoTxt(ms) {
    var d0 = new Date(); d0.setHours(0, 0, 0, 0);
    var d1 = new Date(ms); d1.setHours(0, 0, 0, 0);
    var n = Math.round((d0 - d1) / 864e5);
    return n <= 0 ? U('ovAgo0') : n === 1 ? U('ovAgo1') : fill(U('ovAgoN'), { n:n });
  }
  function lastHtml(r) {
    var L = r.last;
    if (!L || !L.t) return '<span class="ov-c no">' + esc(U('ovLastNone')) + '</span>';
    /* לא ענה — "ניסיון ליצור קשר", והמילה "ניסיון" מודגשת (אחיאסף, 3.11). */
    if (L.kind !== 'wa' && L.res === 'no') {
      var tb = [agoTxt(L.t)];
      if (L.name) tb.push(L.name);
      return '<span class="ov-c">' + esc(fill(U('ovTry'), { t:tb.join(' · '), b:'\u0001' }))
        .replace('\u0001', '<b class="ov-try">' + esc(U('ovTryB')) + '</b>') + '</span>';
    }
    /* וואטסאפ — "נשלחה הודעת וואטסאפ: לפני 3 ימים · שם" (אחיאסף, 3.11). */
    if (L.kind === 'wa') {
      var wb = [agoTxt(L.t)];
      if (L.name) wb.push(L.name);
      return '<span class="ov-c">' + esc(fill(U('ovWaSent'), { t:wb.join(' · ') })) + '</span>';
    }
    var bits = [agoTxt(L.t)];
    if (L.res) bits.push(U(L.res === 'yes' ? 'ovLastYes' : 'ovLastNo'));
    if (L.name) bits.push(L.name);
    return '<span class="ov-c">' + esc(fill(U('ovLast'), { t:bits.join(' · ') })) + '</span>';
  }
  /* הכתיבה ליומן — שולחת, וכישלון נשאר ממתין במכשיר עם הודעה. */
  function callSend(S, r, o, done) {
    S.call(o).then(function (last) {
      if (last) r.last = last;
      done(true); paint(S);
    }, function () { done(false); paint(S); });
  }

  function css() {
    if (document.getElementById('ov-css')) return;
    var st = document.createElement('style');
    st.id = 'ov-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* מצב השורה — לפי מה שיש בה, לא לפי סף: דווח / יש נרשמים
     ועוד לא דווח / אין עדיין כלום. */
  /* המספר של הישיבה — כל הלומדים: נרשמו באפליקציה ודווחו בנוכחות.
     "המנהלים אוהבים לראות את המספרים הגדולים" — מספר אחד שלם, והפירוק
     (באפליקציה / בנוכחות) רק אחרי החץ. null = אין שום נתון. */
  /* מהשרת (ovTotal_): נרשמו באפליקציה + לומדים בישיבה − חופפים.
     שרת ישן שעוד לא שולח `tot` — נרשמו + נוכחות, כמו קודם. */
  function total(r) {
    if (r.tot !== undefined) return has(r.tot) ? num(r.tot) : null;
    if (!has(r.reg) && !has(r.att)) return null;
    return num(r.reg) + num(r.att);
  }
  function inYesh(r) { return r.yn !== undefined ? num(r.yn) : num(r.att); }
  /* מצב השורה — לפי מה שיש בה, לא לפי סף: יש לומדים / אין עדיין. */
  function status(r) { return total(r) ? 'ok' : 'none'; }
  function sorted(rows) {
    return rows.slice().sort(function (a, b) {
      return ((total(b) || 0) - (total(a) || 0)) || (num(b.learn) - num(a.learn)) ||
             String(a.name).localeCompare(String(b.name), 'he');
    });
  }

  /* אריח ראשון — סך הלומדים (כולל מי שבחר "מוסד אחר"). אריח שני —
     לבעלים: לומדים בפועל (סיימו לפחות דף); למנהלים: כמה ישיבות
     כבר עם לומדים. */
  function totals(rows, other, owner) {
    var all = 0, ysh = 0, learn = 0, lk = 0;
    rows.forEach(function (r) {
      var t = total(r);
      if (t) { all += t; ysh++; }
      if (has(r.learn)) { learn += num(r.learn); lk++; }
    });
    (other || []).forEach(function (o) { all += num(o.n); });
    var second = owner
      ? '<div class="ov-tb act"><b>' + (lk ? learn : '—') + '</b><span>' + esc(U('ovLearn')) + '</span>' +
        '<i>' + esc(U('ovLearnSub')) + '</i></div>'
      : '<div class="ov-tb"><b>' + ysh + '</b><span>' + esc(U('ovTotYsh')) + '</span>' +
        '<i>' + esc(fill(U('ovTotYshSub'), { n:rows.length })) + '</i></div>';
    return '<div class="ov-tot"><div class="ov-tb"><b>' + all + '</b><span>' + esc(U('ovTotAll')) + '</span>' +
      '<i>' + esc(U('ovTotAllSub')) + '</i></div>' + second + '</div>';
  }

  var SUG = null;
  function formHtml(r, i, owner) {
    var num0 = function (id, lbl, v, ph) {
      return '<label for="' + id + '">' + esc(lbl) + '</label>' +
        '<input id="' + id + '" inputmode="numeric" pattern="[0-9]*" value="' + esc(v) + '" placeholder="' + esc(ph) + '">';
    };
    return '<div class="ov-f">' +
      /* שני המספרים של הבעלים — לומדים בישיבה וחופפים. ריק = ברירת המחדל. */
      (owner && r.yesh !== undefined
        ? num0('ov-y-' + i, U('ovYesh'), r.yset, fill(U('ovYeshPh'), { n:num(r.yesh) })) +
          num0('ov-o-' + i, U('ovOver'), r.over, U('ovOverPh')) : '') +
      /* הטלפונים שיוצאים בקישור למנהלים. ריק — מוצע מאנשי הקשר (st.sug), ונשמר רק בלחיצה. */
      (owner && r.ppl ? r.ppl.map(function (p) {
        var cur = p.phone || '', sug = !cur && SUG ? (SUG[p.k] || '') : '';
        return '<label for="ov-p' + p.k + '-' + i + '">' + esc(fill(U('ovPhoneL'), { role:U('ovRole_' + p.k), name:p.name || '—' })) +
          (sug ? '<span class="sug">' + esc(U('ovPhoneSug')) + '</span>' : '') + '</label>' +
          '<input id="ov-p' + p.k + '-' + i + '" type="tel" dir="ltr" value="' + esc(cur || sug) + '">';
      }).join('') : '') +
      (owner ? '<label for="ov-c-' + i + '">' + esc(U('ovCoord')) + '</label>' +
        '<input id="ov-c-' + i + '" value="' + esc(r.coord) + '" placeholder="' + esc(U('ovCoordPh')) + '">' : '') +
      '<label for="ov-n-' + i + '">' + esc(U('ovOpen')) + '</label>' +
      '<textarea id="ov-n-' + i + '" placeholder="' + esc(U('ovNotePh')) + '">' + esc(r.note) + '</textarea>' +
      '<div class="ov-fb"><button class="p" data-ov="save" data-i="' + i + '">' + esc(U('ovSave')) + '</button>' +
      '<button data-ov="cancel" data-i="' + i + '">' + esc(U('ovCancel')) + '</button></div></div>';
  }

  function rowHtml(st, r, i) {
    var pdr = st.call ? pendGet() : null;
    var s = status(r), open = st.solo || st.open[r.k] || !!(pdr && pdr.code === r.code), ed = st.edit[r.k];
    var t = total(r);
    var bigV = t == null
      ? '<div class="ov-v u big"><b>' + esc(U('ovActNone')) + '</b><small>' + esc(U('ovRowN')) + '</small></div>'
      : '<div class="ov-v big"><b>' + t + '</b><small>' + esc(U('ovRowN')) + '</small></div>';
    var learnV = !st.owner ? '' : has(r.learn)
      ? '<div class="ov-v a"><b>' + num(r.learn) + '</b><small>' + esc(U('ovLearn')) + '</small></div>'
      : '<div class="ov-v u"><b>' + esc(U('ovActNone')) + '</b><small>' + esc(U('ovLearn')) + '</small></div>';
    var nm = st.go
      ? '<button class="ov-n go" data-ov="go" data-i="' + i + '">' + esc(r.name) + '</button>'
      : '<span class="ov-n">' + esc(r.name) + '</span>';
    var h = '<div class="ov-r s-' + s + '" title="' + esc(U('ovSt_' + s)) + '"><div class="ov-h"><div class="ov-m">' + nm +
      (has(r.coord) ? '<span class="ov-c">' + esc(U('ovCoord')) + ': ' + esc(r.coord) + '</span>'
                    : '<span class="ov-c no">' + esc(U('ovCoordNone')) + '</span>') +
      (st.call ? lastHtml(r) : '') + '</div>' +
      '<div class="ov-k">' + bigV + learnV + '</div>' +
      (st.solo ? '' : '<button class="ov-x' + (open ? ' on' : '') + '" data-ov="tog" data-i="' + i +
        '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-label="' + esc(U('ovOpen')) + ' · ' +
        esc(r.name) + '">▾</button>') + '</div>';
    if (open) {
      h += '<div class="ov-b">';
      /* הפירוק — רק כאן, אחרי החץ. */
      if (t != null) h += '<div class="ov-split">' + esc(fill(U('ovSplit'), { a:num(r.reg), b:inYesh(r) })) +
        (st.owner && num(r.over) ? ' · ' + esc(fill(U('ovOverShow'), { n:num(r.over) })) : '') + '</div>';
      /* הכניסה למסך הישיבה (אנשי קשר, היסטוריה, עדכון) — כפתור ברור,
         ולא רק השם עם קו. */
      if (st.go && !st.solo) h += '<button class="ov-e ov-go" data-ov="go" data-i="' + i + '">' + esc(U('ovGoIn')) + '</button> ';
      if (!ed) h += pplHtml(r, i, st);
      if (!ed && st.call && r.last && r.last.note) h += '<div class="ov-x2" style="margin:0 0 10px">' +
        esc(fill(U('ovLastNote'), { t:r.last.note })) + '</div>';
      if (ed) { SUG = st.sug ? st.sug(r) : null; h += formHtml(r, i, st.owner); SUG = null; }
      else {
        h += '<div class="ov-t' + (has(r.note) ? '' : ' no') + '">' +
          esc(has(r.note) ? r.note : U('ovNoteNone')) + '</div>' +
          (st.save ? '<button class="ov-e" data-ov="edit" data-i="' + i + '">' + esc(U('ovEdit')) + '</button>' : '');
      }
      if (st.extra) h += st.extra(r) || '';
      if (st.msg[r.k]) h += '<div class="ov-msg' + (st.msg[r.k].bad ? ' bad' : '') + '">' + esc(st.msg[r.k].t) + '</div>';
      h += '</div>';
    }
    return h + '</div>';
  }

  function paint(st) {
    var rows = st.solo ? st.rows : sorted(st.rows);
    st.shown = rows;
    var h = st.solo ? '' : totals(st.rows, st.other, st.owner);
    h += '<div class="ov-list">' + rows.map(function (r, i) { return rowHtml(st, r, i); }).join('') + '</div>';
    var oth = 0;
    (st.other || []).forEach(function (o) { oth += num(o.n); });
    if (!st.solo && oth) h += '<div class="ov-note">' + esc(fill(U('ovOther'), { n:oth })) + '</div>';
    st.el.innerHTML = h;
  }

  function saveRow(st, r, i) {
    var a = document.getElementById('ov-a-' + i), n = document.getElementById('ov-n-' + i),
        c = document.getElementById('ov-c-' + i);
    var av = a ? a.value.replace(/[^\d]/g, '') : r.act, nv = n ? n.value.trim() : r.note,
        cv = c ? c.value.trim() : r.coord;
    var y = document.getElementById('ov-y-' + i), o = document.getElementById('ov-o-' + i);
    var todo = [];
    (r.ppl || []).forEach(function (p) {
      var el = document.getElementById('ov-p' + p.k + '-' + i);
      if (el && el.value.replace(/[^\d+]/g, '') !== String(p.phone || '').replace(/[^\d+]/g, '')) {
        todo.push([p.k, el.value.replace(/[^\d+]/g, '')]);
      }
    });
    if (y && y.value.replace(/[^\d]/g, '') !== String(r.yset || '')) todo.push(['yesh', y.value.replace(/[^\d]/g, '')]);
    if (o && o.value.replace(/[^\d]/g, '') !== String(r.over || '')) todo.push(['over', o.value.replace(/[^\d]/g, '')]);
    if (a && String(av) !== String(r.act || '')) todo.push(['act', av]);
    if (nv !== String(r.note || '')) todo.push(['note', nv]);
    if (c && cv !== String(r.coord || '')) todo.push(['coord', cv]);
    if (!todo.length) { st.edit[r.k] = 0; paint(st); return; }
    st.msg[r.k] = { t:U('ovSaving') }; paint(st);
    var step = function (j) {
      if (j >= todo.length) {
        st.edit[r.k] = 0; st.msg[r.k] = { t:U('ovSaved') }; paint(st);
        if (st.changed) st.changed(r);
        return;
      }
      st.save(r, todo[j][0], todo[j][1]).then(function (back) {
        /* מה שחזר מהטבלה — ולא מה שהוקלד. */
        if (back) for (var bk in back) if (back.hasOwnProperty(bk) && bk !== 'k') r[bk] = back[bk];
        step(j + 1);
      }, function (err) {
        st.msg[r.k] = { t:fill(U('ovSaveFail'), { t:(err && err.message) || err || '' }), bad:1 };
        paint(st);
      });
    };
    step(0);
  }

  /* st: { el, rows, other, owner, save, go, extra, solo, changed, sug, mem }
     `mem` — מצב (פתוח/בעריכה) ששורד ציור מחדש של העמוד, שמחליף את `el`. */
  function mount(el, o) {
    css();
    var st = el._ov || o.mem || { open:{}, edit:{}, msg:{} };
    for (var k in o) if (o.hasOwnProperty(k) && k !== 'mem') st[k] = o[k];
    st.el = el;
    if (st.solo && st.rows[0] && !st.edit[st.rows[0].k] && st.startEdit) st.edit[st.rows[0].k] = 1;
    if (!el._ov) {
      el._ov = st;
      el.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-ov]') : null;
        if (!b) return;
        var S = el._ov, r = S.shown[+b.getAttribute('data-i')], act = b.getAttribute('data-ov');
        if (act === 'sug') {
          var rr = S.rows.filter(function (x) { return x.k === b.getAttribute('data-k'); })[0];
          if (rr) { S.edit[rr.k] = 1; paint(S);
            var inp = el.querySelector('[id^="ov-a-"]');
            for (var q = 0; q < S.shown.length; q++) if (S.shown[q].k === rr.k) inp = document.getElementById('ov-a-' + q);
            if (inp) { inp.value = b.getAttribute('data-n'); inp.focus(); } }
          return;
        }
        if (!r) return;
        if (act === 'call' && S.call) {
          /* הקישור (tel:/wa.me) ממשיך כרגיל — לא עוצרים אותו. */
          var pp = (r.ppl || []).filter(function (x) { return x.k === b.getAttribute('data-pk'); })[0];
          if (!pp || !r.code) return;
          var kind = b.getAttribute('data-kind') === 'wa' ? 'wa' : 'tel';
          var o = { id:'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                    code:r.code, pk:pp.k, name:pp.name, kind:kind };
          /* וואטסאפ אינו "ענה/לא ענה" — נרשם כקשר, בלי שאלה. */
          if (kind === 'tel') { o.step = 'ask'; pendSet(o); }
          callSend(S, r, { id:o.id, code:o.code, who:o.pk, name:o.name, kind:kind }, function () {});
          return;
        }
        if (act === 'ans' || act === 'ntsave' || act === 'ntskip') {
          var pd = pendGet();
          if (!pd || pd.code !== r.code) return;
          if (act === 'ntskip') { pendSet(null); paint(S); return; }
          var q = { id:pd.id, code:pd.code, who:pd.pk, name:pd.name, kind:pd.kind };
          if (act === 'ans') q.res = b.getAttribute('data-v') === 'yes' ? 'yes' : 'no';
          else { var ta = document.getElementById('ov-nt'); q.note = ta ? ta.value.trim() : ''; if (!q.note) { pendSet(null); paint(S); return; } }
          b.disabled = true;
          callSend(S, r, q, function (ok) {
            if (!ok) { pd.err = 1; if (q.note) pd.tx = q.note; pendSet(pd); return; }
            pd.err = 0;
            if (act === 'ans' && q.res === 'yes') { pd.step = 'note'; pendSet(pd); }
            else pendSet(null);
          });
          return;
        }
        if (act === 'tog') { S.open[r.k] = !S.open[r.k]; if (!S.open[r.k]) S.edit[r.k] = 0; paint(S); }
        else if (act === 'edit') { S.edit[r.k] = 1; S.msg[r.k] = null; paint(S); }
        else if (act === 'cancel') { S.edit[r.k] = 0; S.msg[r.k] = null; paint(S); }
        else if (act === 'save') saveRow(S, r, +b.getAttribute('data-i'));
        else if (act === 'go' && S.go) S.go(r);
      });
    }
    if (st.call && !el._ovVis) {
      el._ovVis = 1;
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && el._ov && pendGet()) paint(el._ov);
      });
    }
    paint(st);
    return st;
  }

  /* הכרטיסיות שבראש מסך הישיבה — שם ומספר הלומדים בפועל בלבד. */
  function navHtml(rows, cur, fn) {
    return '<details class="ov-nav"><summary>' + esc(U('ovNav')) + '</summary><div class="ov-tabs">' +
      sorted(rows).map(function (r) {
        return '<button class="ov-tab' + (r.k === cur ? ' on' : '') + '" onclick="' + fn + '(\'' +
          esc(String(r.k).replace(/[\\']/g, '')) + '\')">' + esc(r.name) +
          (has(r.learn) ? '<b>' + num(r.learn) + '</b>' : total(r) != null ? '<b>' + total(r) + '</b>' : '<b class="u">?</b>') +
          '</button>';
      }).join('') + '</div></details>';
  }

  /* תוספות שהעמוד מוסיף מתחת למשפט הסיכום (`extra`). המחלקות
     כאן, ולא אצל העמוד, כדי שהעיצוב שלהן יגיע איתן. */
  function sugHtml(k, n, label, btn) {
    return '<div class="ov-sug">' + esc(label) + ' <button data-ov="sug" data-k="' + esc(k) + '" data-n="' +
      esc(n) + '">' + esc(btn) + '</button></div>';
  }
  function smallHtml(t) { return '<div class="ov-x2">' + esc(t) + '</div>'; }

  /* שאלת השם בקישור המלא (skira.html) — כאן, כדי שהעיצוב יהיה מהרכיב. */
  function byHtml(fn) {
    css();
    return '<div class="ov-r" style="padding:14px"><div class="ov-f"><label for="ov-by">' + esc(U('ovByH')) +
      '</label><input id="ov-by" type="text" maxlength="40" autocomplete="name"><div class="ov-msg">' + esc(U('ovBySub')) +
      '</div><div class="ov-fb"><button class="p" onclick="' + fn + '()">' + esc(U('ovByGo')) + '</button></div></div></div>';
  }
  window.OV = { mount:mount, status:status, sorted:sorted, navHtml:navHtml, css:css,
                sugHtml:sugHtml, smallHtml:smallHtml, byHtml:byHtml };
})();
