/* ============================================================
   חבר מביא חבר דרך האתר שלנו (8.99.474–475) — רק כשהפנייה הישירה נכשלה.
   ============================================================
   כמו api/pts.js: chal.js פונה ישירות לגוגל, ורק אחרי כישלון (נחסם / אין
   תשובה) שולח את **אותה** קריאה לכאן. רק פעולות התלמיד הציבוריות של האתגר
   (OPS — מצב, ישיבה, סירוב, שולחן חדש, קוד, נחיתה, "יש לך אפליקציה"), בלי
   סיסמה ובלי פעולות ניהול. הכתובת קבועה (preflight בודק שהיא = APPS_SCRIPT_URL),
   הפרמטרים מרשימה סגורה לכל פעולה. `vx=1` — "זמני שרת": chal:via:<פעולה>.
   ============================================================ */
var GS = 'https://script.google.com/macros/s/AKfycbyaLr78iFMbHYVvNOVKbAjiQsy3Hk2FeL5vUaKo5euf_m4MinMqVIScFCvkjFBnpyNt/exec';

function one(v) { return Array.isArray(v) ? v[0] : v; }

var OPS = { my: 1, sit: 1, decl: 1, newt: 1, ref: 1, land: 1, byph: 1 };
var OK = {
  id: /^[\w:.,\-]{1,300}$/, ref: /^[A-Za-z0-9]{4,10}$/, ms: /^\d{1,3}$/, tst: /^1$/,
  ph: /^[0-9+\-\s]{6,20}$/, first: /^[^<>&"'\\\u0000-\u001f]{1,40}$/
};

module.exports = async function (req, res) {
  var q = req.query || {}, op = String(one(q.challenge) || ''), cb = String(one(q.callback) || '');
  res.setHeader('Cache-Control', 'no-store');
  if (!OPS[op] || !/^[A-Za-z_$][\w$]{0,40}$/.test(cb)) { res.statusCode = 400; res.end(''); return; }
  var u = GS + '?challenge=' + op + '&vx=1';
  for (var k in OK) {
    var v = one(q[k]);
    if (v == null || v === '') continue;
    v = String(v);
    if (!OK[k].test(v)) { res.statusCode = 400; res.end(''); return; }
    u += '&' + k + '=' + encodeURIComponent(v);
  }
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
