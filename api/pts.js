/* ============================================================
   הכרטיסים דרך האתר שלנו (8.99.473) — רק כשהפנייה הישירה נכשלה.
   ============================================================
   תלמידים ראו "לא הצלחנו לטעון את הכרטיסים" בזמן שהשרת ענה לכל
   הבקשות שהגיעו אליו תוך פחות משנייה — כלומר הבקשה מהטלפון לא הגיעה
   לגוגל (חשד: סינון שחוסם את script.google.com / googleusercontent).
   join.html פונה ישירות כמו קודם, ורק אחרי כישלון שולח את **אותה**
   בקשה לכאן. הפונקציה מביאה את התשובה מגוגל (כולל ההפניה של גוגל,
   בצד השרת) ומחזירה אותה כמו שהיא.

   **רק ?pts=me** — לא שרת מתווך כללי: הכתובת של הסקריפט קבועה כאן
   (preflight בודק שהיא זהה ל-APPS_SCRIPT_URL ב-data.js), והפרמטרים
   מסוננים לרשימה סגורה. `vx=1` — השרת סופר ב"זמני שרת" (pts:via).
   ============================================================ */
var GS = 'https://script.google.com/macros/s/AKfycbyaLr78iFMbHYVvNOVKbAjiQsy3Hk2FeL5vUaKo5euf_m4MinMqVIScFCvkjFBnpyNt/exec';

function one(v) { return Array.isArray(v) ? v[0] : v; }

module.exports = async function (req, res) {
  var q = req.query || {};
  var id = String(one(q.id) || ''), cb = String(one(q.callback) || ''),
      fe = String(one(q.fe) || ''), fd = String(one(q.fd) || '');
  res.setHeader('Cache-Control', 'no-store');
  if (String(one(q.pts) || '') !== 'me' || !/^[\w:.,\-]{1,250}$/.test(id) || !/^[A-Za-z_$][\w$]{0,40}$/.test(cb)) {
    res.statusCode = 400; res.end(''); return;
  }
  var u = GS + '?pts=me&id=' + encodeURIComponent(id) + '&vx=1';
  if (/^[a-z0-9]{1,40}$/.test(fe)) u += '&fe=' + fe;
  if (/^[a-z]{2,4}-[a-z]{2,4}-[at]$/.test(fd)) u += '&fd=' + fd;
  u += '&callback=' + cb;
  var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, 25000);
  try {
    var r = await fetch(u, { redirect: 'follow', signal: ac.signal });
    var body = await r.text();
    /* רק תשובה של הסקריפט עצמו (cb(...)). דף שגיאה של גוגל — כישלון,
       כדי שהטלפון ינסה שוב ולא יריץ HTML כסקריפט. */
    if (r.status !== 200 || body.indexOf(cb + '(') !== 0) { res.statusCode = 502; res.end(''); return; }
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.statusCode = 200;
    res.end(body);
  } catch (e) {
    res.statusCode = 504; res.end('');
  } finally { clearTimeout(t); }
};
