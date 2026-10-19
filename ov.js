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

  function css() {
    if (document.getElementById('ov-css')) return;
    var st = document.createElement('style');
    st.id = 'ov-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* מצב השורה — לפי מה שיש בה, לא לפי סף: דווח / יש נרשמים
     ועוד לא דווח / אין עדיין כלום. */
  function status(r) {
    if (has(r.act)) return 'ok';
    if (num(r.reg) || num(r.att)) return 'wait';
    return 'none';
  }
  function sorted(rows) {
    return rows.slice().sort(function (a, b) {
      var sa = has(a.act) ? 1 : 0, sb = has(b.act) ? 1 : 0;
      return (sb - sa) || (num(b.act) - num(a.act)) || ((num(b.reg) + num(b.att)) - (num(a.reg) + num(a.att))) ||
             String(a.name).localeCompare(String(b.name), 'he');
    });
  }

  function totals(rows, other) {
    var reg = 0, att = 0, act = 0, k = 0;
    rows.forEach(function (r) {
      reg += num(r.reg); att += num(r.att);
      if (has(r.act)) { act += num(r.act); k++; }
    });
    (other || []).forEach(function (o) { reg += num(o.n); });
    return '<div class="ov-tot"><div class="ov-tb"><b>' + reg + '</b><span>' + esc(U('ovTotReg')) + '</span>' +
      (att ? '<i>' + esc(fill(U('ovTotRegSub'), { n:att })) + '</i>' : '') + '</div>' +
      '<div class="ov-tb act"><b>' + (k ? act : '—') + '</b><span>' + esc(U('ovTotAct')) + '</span>' +
      '<i>' + esc(fill(U('ovTotActSub'), { k:k, n:rows.length })) + '</i></div></div>';
  }

  function formHtml(r, i, owner) {
    return '<div class="ov-f">' +
      '<label for="ov-a-' + i + '">' + esc(U('ovAct')) + '</label>' +
      '<input id="ov-a-' + i + '" inputmode="numeric" pattern="[0-9]*" value="' + esc(r.act) +
        '" placeholder="' + esc(U('ovActPh')) + '">' +
      (owner ? '<label for="ov-c-' + i + '">' + esc(U('ovCoord')) + '</label>' +
        '<input id="ov-c-' + i + '" value="' + esc(r.coord) + '" placeholder="' + esc(U('ovCoordPh')) + '">' : '') +
      '<label for="ov-n-' + i + '">' + esc(U('ovOpen')) + '</label>' +
      '<textarea id="ov-n-' + i + '" placeholder="' + esc(U('ovNotePh')) + '">' + esc(r.note) + '</textarea>' +
      '<div class="ov-fb"><button class="p" data-ov="save" data-i="' + i + '">' + esc(U('ovSave')) + '</button>' +
      '<button data-ov="cancel" data-i="' + i + '">' + esc(U('ovCancel')) + '</button></div></div>';
  }

  function rowHtml(st, r, i) {
    var s = status(r), open = st.solo || st.open[r.k], ed = st.edit[r.k];
    var actV = has(r.act)
      ? '<div class="ov-v a"><b>' + esc(r.act) + '</b><small>' + esc(U('ovAct')) + '</small></div>'
      : '<div class="ov-v u"><b>' + esc(U('ovActNone')) + '</b><small>' + esc(U('ovAct')) + '</small></div>';
    var regV = '<div class="ov-v"><b>' + num(r.reg) + '</b><small>' + esc(U('ovReg')) + '</small>' +
      (num(r.att) ? '<em>' + esc(fill(U('ovAttSmall'), { n:num(r.att) })) + '</em>' : '') + '</div>';
    var nm = st.go
      ? '<button class="ov-n go" data-ov="go" data-i="' + i + '">' + esc(r.name) + '</button>'
      : '<span class="ov-n">' + esc(r.name) + '</span>';
    var h = '<div class="ov-r s-' + s + '" title="' + esc(U('ovSt_' + s)) + '"><div class="ov-h"><div class="ov-m">' + nm +
      (has(r.coord) ? '<span class="ov-c">' + esc(U('ovCoord')) + ': ' + esc(r.coord) + '</span>'
                    : '<span class="ov-c no">' + esc(U('ovCoordNone')) + '</span>') + '</div>' +
      '<div class="ov-k">' + regV + actV + '</div>' +
      (st.solo ? '' : '<button class="ov-x' + (open ? ' on' : '') + '" data-ov="tog" data-i="' + i +
        '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-label="' + esc(U('ovOpen')) + ' · ' +
        esc(r.name) + '">▾</button>') + '</div>';
    if (open) {
      h += '<div class="ov-b">';
      if (ed) h += formHtml(r, i, st.owner);
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
    var h = st.solo ? '' : totals(st.rows, st.other);
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
    var todo = [];
    if (String(av) !== String(r.act || '')) todo.push(['act', av]);
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
        if (back) { r.act = back.act; r.note = back.note; r.coord = back.coord; r.reg = back.reg; r.att = back.att; }
        step(j + 1);
      }, function (err) {
        st.msg[r.k] = { t:fill(U('ovSaveFail'), { t:(err && err.message) || err || '' }), bad:1 };
        paint(st);
      });
    };
    step(0);
  }

  /* st: { el, rows, other, owner, save, go, extra, solo, changed } */
  function mount(el, o) {
    css();
    var st = el._ov || { open:{}, edit:{}, msg:{} };
    for (var k in o) if (o.hasOwnProperty(k)) st[k] = o[k];
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
        if (act === 'tog') { S.open[r.k] = !S.open[r.k]; if (!S.open[r.k]) S.edit[r.k] = 0; paint(S); }
        else if (act === 'edit') { S.edit[r.k] = 1; S.msg[r.k] = null; paint(S); }
        else if (act === 'cancel') { S.edit[r.k] = 0; S.msg[r.k] = null; paint(S); }
        else if (act === 'save') saveRow(S, r, +b.getAttribute('data-i'));
        else if (act === 'go' && S.go) S.go(r);
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
          (has(r.act) ? '<b>' + esc(r.act) + '</b>' : '<b class="u">?</b>') + '</button>';
      }).join('') + '</div></details>';
  }

  /* תוספות שהעמוד מוסיף מתחת למשפט הסיכום (`extra`). המחלקות
     כאן, ולא אצל העמוד, כדי שהעיצוב שלהן יגיע איתן. */
  function sugHtml(k, n, label, btn) {
    return '<div class="ov-sug">' + esc(label) + ' <button data-ov="sug" data-k="' + esc(k) + '" data-n="' +
      esc(n) + '">' + esc(btn) + '</button></div>';
  }
  function smallHtml(t) { return '<div class="ov-x2">' + esc(t) + '</div>'; }

  window.OV = { mount:mount, status:status, sorted:sorted, navHtml:navHtml, css:css,
                sugHtml:sugHtml, smallHtml:smallHtml };
})();
