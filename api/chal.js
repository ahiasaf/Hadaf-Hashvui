/* ============================================================
   מצב חבר מביא חבר דרך האתר שלנו (8.99.474) — רק כשהפנייה הישירה נכשלה.
   ============================================================
   כמו api/pts.js: chal.js פונה ישירות לגוגל, ורק אחרי כישלון (נחסם / אין
   תשובה) שולח את **אותה** קריאה לכאן. **רק ?challenge=my** — קריאה בלבד,
   בלי ישיבה, הזמנה, פתיחת שולחן או כל פעולה אחרת. הכתובת קבועה (preflight
   בודק שהיא = APPS_SCRIPT_URL), הפרמטרים מרשימה סגורה. `vx=1` — "זמני שרת":
   chal:via.
   ============================================================ */
var GS = 'https://script.google.com/macros/s/AKfycbyaLr78iFMbHYVvNOVKbAjiQsy3Hk2FeL5vUaKo5euf_m4MinMqVIScFCvkjFBnpyNt/exec';

function one(v) { return Array.isArray(v) ? v[0] : v; }

module.exports = async function (req, res) {
  var q = req.query || {};
  var id = String(one(q.id) || ''), cb = String(one(q.callback) || ''),
      ref = String(one(q.ref) || ''), ms = String(one(q.ms) || ''), tst = String(one(q.tst) || '');
  res.setHeader('Cache-Control', 'no-store');
  if (String(one(q.challenge) || '') !== 'my' || !/^[\w:.,\-]{1,300}$/.test(id) ||
      !/^[A-Za-z_$][\w$]{0,40}$/.test(cb) || (ref && !/^[A-Za-z0-9]{4,10}$/.test(ref)) ||
      (ms && !/^\d{1,3}$/.test(ms)) || (tst && tst !== '1')) {
    res.statusCode = 400; res.end(''); return;
  }
  var u = GS + '?challenge=my&id=' + encodeURIComponent(id) + '&vx=1';
  if (ref) u += '&ref=' + ref;
  if (ms) u += '&ms=' + ms;
  if (tst) u += '&tst=1';
  u += '&t=' + Date.now() + '&callback=' + cb;
  var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, 27000);
  try {
    var r = await fetch(u, { redirect: 'follow', signal: ac.signal });
    var body = await r.text();
    if (r.status !== 200 || body.indexOf(cb + '(') !== 0) { res.statusCode = 502; res.end(''); return; }
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.statusCode = 200;
    res.end(body);
  } catch (e) {
    res.statusCode = 504; res.end('');
  } finally { clearTimeout(t); }
};
