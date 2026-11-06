/* ============================================================
   מאגר העלונים להורדה — הלקוח (8.99.449). בריף 3.11, חלק א׳.
   ============================================================
   משותף ל-join.html (כרטיס בבית בימי שישי), alonim.html (המאגר)
   ו-index.html (הכפתור המרחף באזור הניהול האישי, ההעלאה בניהול).
   הרשימה וההורדה עוברות דרך הסקריפט (?alon=list|get), שמזהה את
   המכשיר לפי התפקיד שלו בשרת — ראו aldlRoute_ ב-apps-script.gs.
   **מ-8.99.467 המאגר ציבורי:** הרשימה וההורדה בלי זיהוי מכשיר (גם
   בלי הרשמה). ההורדה בחלקים (`p`), כל חלק ~1.8MB. הכתיבה — רק בניהול.

   **קריאה שנכשלה אינה מאגר ריק:** כשל — הרשימה האחרונה מהמכשיר
   (`df:aldl`) נשארת; רק תשובה תקינה מרוקנת. ES5 בלבד. */
(function () {
  var CK = 'df:aldl';
  function api() {
    var a = '';
    try { a = ((JSON.parse(localStorage.getItem('df:cfg') || '{}') || {}).api) || ''; } catch (e) {}
    return String(a || window.APPS_SCRIPT_URL || '').trim();
  }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  /* המזהה של המכשיר: תלמיד/הורה (df:me), ואחרת איש צוות (df:head). */
  function dev() {
    var m = jget('df:me');
    if (m && m.id) return String(m.id);
    var h = jget('df:head');
    if (h && h.id) return String(h.id);
    return '';
  }
  function jsonp(url, ms) {
    return new Promise(function (ok, no) {
      var n = 'aldl' + Date.now() + Math.floor(Math.random() * 1e6);
      var sc = document.createElement('script');
      var t = setTimeout(function () { fin(); }, ms || 20000);
      function fin(v) {
        clearTimeout(t);
        try { delete window[n]; } catch (e) { window[n] = undefined; }
        if (sc.parentNode) sc.parentNode.removeChild(sc);
        v === undefined ? no(new Error('timeout')) : ok(v);
      }
      window[n] = function (v) { fin(v); };
      sc.onerror = function () { fin(); };
      sc.src = url + '&callback=' + n;
      document.head.appendChild(sc);
    });
  }
  function call(q, ms) {
    var u = api();
    if (!u) return Promise.reject(new Error('no api'));
    var url = u + (u.indexOf('?') < 0 ? '?' : '&') + q;
    return fetch(url).then(function (r) { return r.json(); })['catch'](function () { return jsonp(url, ms); });
  }
  function cached() { var c = jget(CK); return c && c.rows ? c.rows : null; }
  /* הרשימה מהשרת. ok → נשמרת; כשל → המטמון (או null). */
  function list(extra, devO) {
    var d = devO || dev();
    return call('alon=list&dev=' + encodeURIComponent(d) + (extra || '')).then(function (r) {
      if (r && r.status === 'ok' && r.rows) {
        try { localStorage.setItem(CK, JSON.stringify({ at: Date.now(), rows: r.rows })); } catch (e) {}
        return r.rows;
      }
      /* כל תשובה אחרת (גם "נדחה" משרת ישן) — הרשימה שכבר במכשיר נשארת. */
      return cached();
    })['catch'](function () { return cached(); });
  }
  /* החלקים של קובץ אחד, אחד אחרי השני. שרת ישן (בלי np) — הקובץ כולו בתשובה הראשונה. */
  function parts(base) {
    var out = [];
    var one = function (p, tries) {
      return call(base + '&p=' + p, 90000).then(function (r) {
        if (!r || r.status !== 'ok' || typeof r.data !== 'string') throw new Error((r && r.message) || 'no data');
        out.push(r.data);
        if (r.np && p + 1 < r.np) return one(p + 1, 0);
        return { name: r.name, data: out.join('') };
      }, function (er) {
        if (tries < 2) return one(p, tries + 1);
        throw er;
      });
    };
    return one(0, 0);
  }
  /* הורדה: base64 → Blob → שמירה בשם העלון. מחזיר הבטחה; כשל — throw. */
  function get(id, extra, devO) {
    var d = devO || dev();
    return parts('alon=get&id=' + encodeURIComponent(id) + '&dev=' + encodeURIComponent(d) + (extra || ''))
      .then(function (r) {
        if (!r || !r.data) throw new Error('no data');
        var bin = atob(r.data), buf = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        var blob = new Blob([buf], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = r.name || 'alon.pdf'; a.rel = 'noopener';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 60000);
        return true;
      });
  }
  /* יום שישי לפי תאריך המכשיר, בשעון ישראל. */
  function friday() {
    try {
      var s = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' });
      if (/^[A-Za-z]{3}/.test(s)) return s.slice(0, 3) === 'Fri';
    } catch (e) {}
    return new Date().getDay() === 5;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var DOC = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
            'stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/>' +
            '<path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/></svg>';
  function pageUrl() { return /\.html$/.test(location.pathname) ? 'alonim.html' : 'alonim'; }
  /* הכרטיס בבית (join): רק ביום שישי, ורק כשיש לפחות עלון אחד. */
  function card(el) {
    if (!el) return;
    el.innerHTML = '';
    if (!friday() || !dev()) return;
    var paint = function (rows) {
      if (!rows || !rows.length || !friday()) { el.innerHTML = ''; return; }
      var U = window.UI || {};
      el.innerHTML = '<a class="aldl-card" href="' + pageUrl() + '">' +
        '<span class="aldl-ic">' + DOC + '</span>' +
        '<span class="aldl-tx"><b>' + esc(U.aldlCardH) + '</b><small>' + esc(U.aldlCardSub) + '</small></span>' +
        '<i aria-hidden="true">‹</i></a>';
    };
    paint(cached());
    /* הבית מצייר את עצמו כמה פעמים — פנייה לשרת לכל היותר פעם בעשר דקות. */
    var c = jget(CK);
    if (c && c.at && Date.now() - c.at < 600000) return;
    list().then(paint);
  }
  window.ALDL = { api: api, dev: dev, list: list, get: get, friday: friday, card: card, cached: cached,
                  call: call, esc: esc, DOC: DOC };
})();
