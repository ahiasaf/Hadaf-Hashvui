/* מצב חבר מביא חבר דרך האתר שלנו אחרי כישלון (8.99.474). node tools/ptsvia/chal.js
   עמוד האתגר (chaver) במכשיר רשום: א. גוגל עובד — אין פנייה ל-/api/chal.
   ב. חסום — הניסיון הבא דרכנו, ההודעה מתחלפת, והמכשיר זוכר; פתיחה חוזרת — ישר דרכנו.
   ג. חסום וגם דרכנו — ההודעה הקיימת, לסירוגין.
   רק `my` עובר דרכנו — api/chal.js דוחה כל פעולה אחרת (chalfn.js). */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), H = require(path.join(ROOT, 'api', 'chal.js'));
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
var MY = { status:'ok', on:false };
var API_LOG = [], VIA_DOWN = false;
global.fetch = function (u) {
  var cb = /callback=(\w+)/.exec(u)[1];
  return Promise.resolve({ status:200, text:function () { return Promise.resolve(cb + '(' + JSON.stringify(MY) + ')'); } });
};
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (/^\/api\//.test(p)) {
        API_LOG.push(req.url);
        if (p !== '/api/chal' || VIA_DOWN) { res.writeHead(504); res.end(); return; }
        var q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; });
        return H({ query:q }, res);
      }
      var f = path.join(ROOT, p === '/' ? '/index.html' : p);
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
    if (/challenge=my/.test(u)) ctx.GL.push(u);
    if (!googleUp) return r.abort();
    var m = /callback=(\w+)/.exec(u);
    return r.fulfill({ status:200, contentType:'application/javascript', body: m ? m[1] + '(' + JSON.stringify(/challenge=my/.test(u) ? MY : { status:'ok' }) + ')' : '{}' });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  await ctx.addInitScript(function (me) {
    if (!localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify(me));
  }, ME);
  return ctx;
}
function st(p) { return p.evaluate(function () { var b = document.querySelector('.ch-card, .ch-sm'); return b ? b.className + ':' + b.innerText.slice(0, 40) : ''; }); }
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var ERR = '', OFF = '';
  // א
  var c1 = await ctxFor(b, true), p1 = await c1.newPage(); API_LOG = [];
  await p1.goto(base + '/chaver'); await p1.waitForTimeout(2500);
  OFF = await st(p1);
  ok(/ch-card/.test(OFF) && API_LOG.length === 0 && c1.GL.length >= 1, 'א. גוגל עובד — בלי פנייה דרכנו', { s: OFF, api: API_LOG });
  await c1.close();
  // ב
  var c2 = await ctxFor(b, false), p2 = await c2.newPage(); API_LOG = [];
  await p2.goto(base + '/chaver'); await p2.waitForTimeout(1500);
  ERR = await st(p2);
  ok(/ch-sm/.test(ERR), 'ב. אחרי הכישלון — ההודעה הקיימת', ERR);
  await p2.waitForTimeout(6000);
  ok((await st(p2)) === OFF, 'ב. אחרי 5 שניות — המצב דרכנו', await st(p2));
  ok(API_LOG.length === 1 && /^\/api\/chal\?challenge=my&id=devtest1/.test(API_LOG[0]), 'ב. בקשה אחת דרכנו', API_LOG);
  ok(+(await p2.evaluate(function () { return localStorage.getItem('df:chVia'); })) > Date.now() - 60000, 'ב. המכשיר זוכר');
  API_LOG = []; c2.GL.length = 0;
  var p2b = await c2.newPage(); await p2b.goto(base + '/chaver'); await p2b.waitForTimeout(2500);
  ok((await st(p2b)) === OFF && c2.GL.length === 0 && API_LOG.length === 1, 'ב. פתיחה חוזרת — ישר דרכנו', { gl: c2.GL.length, api: API_LOG });
  await c2.close();
  // ג
  VIA_DOWN = true;
  var c3 = await ctxFor(b, false), p3 = await c3.newPage(); API_LOG = [];
  await p3.goto(base + '/chaver'); await p3.waitForTimeout(25000);
  ok(/ch-sm/.test(await st(p3)), 'ג. ההודעה הקיימת', await st(p3));
  ok(API_LOG.length >= 1 && API_LOG.length <= 2 && c3.GL.length <= 3, 'ג. לסירוגין, בלי הצפה', { api: API_LOG.length, gl: c3.GL.length });
  await c3.close(); await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'הכל תקין');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
