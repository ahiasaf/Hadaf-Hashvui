/* ============================================================
   כל פנייה ציבורית לשרת דרך האתר שלנו (8.99.477) — רק כשהפנייה הישירה נכשלה.
   ============================================================
   הכרטיסים (api/pts.js) והאתגר (api/chal.js) כבר עוברים כך. כאן — כל השאר
   שהטלפון של תלמיד/הורה שולח: שמירת לימוד וחידון, "עם אבא", הרשמה, והקריאות
   שמאמתות שהשמירה הגיעה. מסננים שחוסמים את script.google.com (VPN בטלפון)
   הפילו אותם בשקט.

   **בלי סיסמה:** בקשה עם `key`/`vk` (בכתובת או בגוף) נדחית — פעולות ניהול
   ממשיכות ישירות לגוגל ולא עוברות כאן. הכתובת קבועה (preflight בודק שהיא =
   APPS_SCRIPT_URL). גוף עד 1MB. GET — רק תשובת JSONP (`callback`/`cb`) או JSON.
   `vx=1` — "זמני שרת": gs:via.
   ============================================================ */
var GS = 'https://script.google.com/macros/s/AKfycbyaLr78iFMbHYVvNOVKbAjiQsy3Hk2FeL5vUaKo5euf_m4MinMqVIScFCvkjFBnpyNt/exec';
var MAX = 1024 * 1024;

function one(v) { return Array.isArray(v) ? v[0] : v; }
function bodyOf(req) {
  if (typeof req.body === 'string') return Promise.resolve(req.body);
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(JSON.stringify(req.body));
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString('utf8'));
  return new Promise(function (ok, no) {
    var chunks = [], n = 0;
    req.on('data', function (c) { n += c.length; if (n > MAX) { no(new Error('big')); req.destroy(); } else chunks.push(c); });
    req.on('end', function () { ok(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', no);
  });
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  var q = req.query || {}, qs = '', cb = '';
  for (var k in q) {
    var v = one(q[k]);
    if (v == null) continue;
    if (k === 'key' || k === 'vk') { if (String(v)) { res.statusCode = 403; res.end(''); return; } continue; }
    if (k === 'vx') continue;
    if (k === 'callback' || k === 'cb') cb = String(v);
    qs += (qs ? '&' : '?') + encodeURIComponent(k) + '=' + encodeURIComponent(String(v));
  }
  if (cb && !/^[A-Za-z_$][\w$]{0,40}$/.test(cb)) { res.statusCode = 400; res.end(''); return; }
  var u = GS + (qs ? qs + '&' : '?') + 'vx=1';
  var opt = { redirect: 'follow' }, post = req.method === 'POST';
  if (post) {
    var b;
    try { b = await bodyOf(req); } catch (e) { res.statusCode = 413; res.end(''); return; }
    if (b.length > MAX) { res.statusCode = 413; res.end(''); return; }
    if (/"(key|vk)"\s*:\s*"[^"]/.test(b)) { res.statusCode = 403; res.end(''); return; }
    opt.method = 'POST';
    opt.body = b;
    opt.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
  } else if (req.method !== 'GET') { res.statusCode = 405; res.end(''); return; }
  var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, 27000);
  opt.signal = ac.signal;
  try {
    var r = await fetch(u, opt);
    var body = await r.text();
    if (r.status !== 200) { res.statusCode = 502; res.end(''); return; }
    if (!post && cb && body.indexOf(cb + '(') !== 0) { res.statusCode = 502; res.end(''); return; }
    if (!post && !cb && !/^\s*[\[{]/.test(body)) { res.statusCode = 502; res.end(''); return; }
    res.setHeader('Content-Type', cb ? 'application/javascript; charset=utf-8' : 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(body);
  } catch (e) {
    res.statusCode = 504; res.end('');
  } finally { clearTimeout(t); }
};
