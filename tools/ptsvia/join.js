/* הכרטיסים בבית דרך האתר שלנו אחרי כישלון (8.99.473). node tools/ptsvia/join.js
   א. גוגל עובד — אין פנייה ל-/api/pts.  ב. גוגל חסום — הניסיון הבא דרך /api/pts,
   הכרטיס מוצג, והמכשיר זוכר; פתיחה חוזרת — ישר דרכנו.  ג. חסום וגם דרכנו נכשל —
   ההודעה הקיימת, לסירוגין, בלי הצפה. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), H = require(path.join(ROOT, 'api', 'pts.js'));
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
var GOOD = { status:'ok', n:0, l:[], nx:{ t:2, l:1, q:1, f:0, nr:9 } };
var API_LOG = [], VIA_DOWN = false;
global.fetch = function (u) {
  var cb = /callback=(\w+)/.exec(u)[1];
  return Promise.resolve({ status:200, text:function () { return Promise.resolve(cb + '(' + JSON.stringify(GOOD) + ')'); } });
};
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (p === '/api/pts') {
        API_LOG.push(req.url);
        if (VIA_DOWN) { res.writeHead(504); res.end(); return; }
        var q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; });
        return H({ query:q }, res);
      }
      if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}
var fails = 0;
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
var ME = { first:'פלוני', last:'אלמוני', inst:'givat', role:'stu', id:'devtest1', grade:'ז' };
async function ctxFor(b, googleUp) {
  var ctx = await b.newContext({ serviceWorkers:'block', viewport:{ width:390, height:844 } });
  ctx.GL = [];
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var u = r.request().url();
    if (/pts=me/.test(u)) ctx.GL.push(u);
    if (!googleUp) return r.abort();
    var m = /callback=(\w+)/.exec(u);
    var body = m ? m[1] + '(' + JSON.stringify(/pts=me/.test(u) ? GOOD : { status:'ok' }) + ')' : '{"status":"ok"}';
    return r.fulfill({ status:200, contentType:'application/javascript', body:body });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  await ctx.addInitScript(function (me) {
    if (sessionStorage.getItem('nt')) return;
    sessionStorage.setItem('nt', '1');
    if (!localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify(me));
  }, ME);
  return ctx;
}
function card(p) { return p.evaluate(function () { var t = document.getElementById('mytk'); return t ? { h: t.hidden, s: t.innerText, ss: !!t.querySelector('.tk-ss'), err: !!t.querySelector('.tk-err') } : null; }); }
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  // א. גוגל עובד
  var c1 = await ctxFor(b, true), p1 = await c1.newPage();
  API_LOG = [];
  await p1.goto(base + '/join'); await p1.waitForTimeout(3000);
  var k = await card(p1);
  ok(k && k.ss && !k.err, 'א. גוגל עובד — הכרטיסים מוצגים', k);
  ok(API_LOG.length === 0 && c1.GL.length >= 1, 'א. בלי פנייה דרכנו', API_LOG);
  ok(!(await p1.evaluate(function () { return localStorage.getItem('df:ptsVia'); })), 'א. לא נזכר דבר');
  await c1.close();
  // ב. גוגל חסום
  var c2 = await ctxFor(b, false), p2 = await c2.newPage();
  API_LOG = [];
  await p2.goto(base + '/join'); await p2.waitForTimeout(1500);
  k = await card(p2);
  ok(k && k.err, 'ב. אחרי הכישלון הראשון — ההודעה הקיימת', k);
  await p2.waitForTimeout(6000);
  k = await card(p2);
  ok(k && k.ss && !k.err, 'ב. אחרי 5 שניות — הכרטיסים דרכנו', k);
  ok(API_LOG.length === 1 && /pts=me&id=devtest1/.test(API_LOG[0]) && /fe=e1/.test(API_LOG[0]), 'ב. בקשה אחת דרכנו, עם סיבת הכישלון', API_LOG);
  var via = await p2.evaluate(function () { return +JSON.parse(localStorage.getItem('df:ptsVia') || '0'); });
  ok(via > Date.now() - 60000, 'ב. המכשיר זוכר');
  API_LOG = []; c2.GL.length = 0;
  var p2b = await c2.newPage();
  await p2b.goto(base + '/join'); await p2b.waitForTimeout(2500);
  k = await card(p2b);
  ok(k && k.ss && c2.GL.length === 0 && API_LOG.length === 1, 'ב. פתיחה חוזרת — ישר דרכנו', { k:k, gl:c2.GL.length, api:API_LOG.length });
  await c2.close();
  // ג. חסום וגם דרכנו נכשל
  VIA_DOWN = true;
  var c3 = await ctxFor(b, false), p3 = await c3.newPage();
  API_LOG = [];
  await p3.goto(base + '/join'); await p3.waitForTimeout(30000);
  k = await card(p3);
  ok(k && k.err, 'ג. ההודעה הקיימת', k);
  ok(API_LOG.length >= 1 && API_LOG.length <= 2 && c3.GL.length <= 3, 'ג. לסירוגין, בלי הצפה (30 שניות)', { api:API_LOG.length, gl:c3.GL.length });
  ok(!(await p3.evaluate(function () { return localStorage.getItem('df:ptsVia'); })) || (await p3.evaluate(function () { return localStorage.getItem('df:ptsVia'); })) === '0', 'ג. לא נזכר');
  await c3.close();
  await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'הכל תקין');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
