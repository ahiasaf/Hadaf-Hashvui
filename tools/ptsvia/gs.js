/* שמירות התלמיד דרך האתר שלנו אחרי כישלון (8.99.477). node tools/ptsvia/gs.js
   בעמוד אמיתי (chaver: data.js + learned.js), כשגוגל חסום:
   א. שליחת שורה (POST no-cors) — מיד דרך /api/gs, עם אותו גוף; המכשיר עובר לדרכנו.
   ב. קריאת אימות (LJsonp ?mark=) — עוברת דרכנו ומחזירה תשובה.
   ג. שליחה עם סיסמה — לא דרכנו.  ד. גוגל עובד — אין פנייה ל-/api/gs. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), H = require(path.join(ROOT, 'api', 'gs.js'));
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
var LOG = [], UP = [];
global.fetch = function (u, o) {
  UP.push({ u: u, b: o && o.body });
  var m = /[?&](?:callback|cb)=(\w+)/.exec(u);
  return Promise.resolve({ status: 200, text: function () { return Promise.resolve(m ? m[1] + '({"status":"ok","arrived":1})' : '{"status":"ok"}'); } });
};
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (p === '/api/gs') {
        var q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; });
        var b = ''; req.on('data', function (c) { b += c; });
        req.on('end', function () {
          LOG.push({ m: req.method, u: req.url, b: b });
          req.query = q; if (req.method === 'POST') req.body = b;
          H(req, res);
        });
        return;
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
async function ctxFor(b, up) {
  var ctx = await b.newContext({ serviceWorkers: 'block' });
  ctx.G = [];
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    ctx.G.push(r.request().method() + ' ' + r.request().url());
    if (!up) return r.abort();
    var m = /[?&](?:callback|cb)=(\w+)/.exec(r.request().url());
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: m ? m[1] + '({"status":"ok","arrived":1})' : '{}' });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  return ctx;
}
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var c = await ctxFor(b, false), p = await c.newPage();
  await p.goto(base + '/zochim'); await p.waitForTimeout(800);
  await p.addScriptTag({ url: base + '/learned.js' });
  LOG = [];
  // א
  await p.evaluate(function () {
    return fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'row', tab: 'לימוד', cols: [['מזהה', 'D1']] }) });
  }).catch(function () {});
  var posts = LOG.filter(function (x) { return x.m === 'POST'; });
  ok(posts.length === 1 && /"tab":"לימוד"/.test(posts[0].b), 'א. השורה עברה דרכנו עם אותו גוף', LOG);
  ok(+(await p.evaluate(function () { return localStorage.getItem('df:gsVia'); })) > Date.now() - 60000, 'א. המכשיר עבר לדרכנו');
  // ב
  LOG = [];
  var r = await p.evaluate(function () { return LJsonp(APPS_SCRIPT_URL + '?arrived=D1', 8000).then(function (v) { return v; }, function () { return null; }); });
  ok(r && r.arrived === 1 && LOG.length === 1 && /^\/api\/gs\?arrived=D1/.test(LOG[0].u), 'ב. האימות עבר דרכנו', { r: r, LOG: LOG });
  // ג
  LOG = []; c.G.length = 0;
  await p.evaluate(function () {
    return fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'table', key: 'K' }) }).catch(function () {});
  });
  ok(LOG.length === 0 && c.G.length === 1, 'ג. עם סיסמה — ישירות בלבד', { LOG: LOG, G: c.G });
  await c.close();
  // ד
  var c2 = await ctxFor(b, true), p2 = await c2.newPage();
  await p2.goto(base + '/zochim'); await p2.waitForTimeout(800);
  await p2.addScriptTag({ url: base + '/learned.js' });
  LOG = [];
  await p2.evaluate(function () {
    return fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: '{"action":"row"}' }).then(function () {
      return LJsonp(APPS_SCRIPT_URL + '?arrived=D1', 8000);
    });
  });
  ok(LOG.length === 0 && c2.G.filter(function (x) { return /^POST|arrived=/.test(x); }).length === 2, 'ד. גוגל עובד — בלי פנייה דרכנו', { LOG: LOG, G: c2.G });
  ok(!(await p2.evaluate(function () { return localStorage.getItem('df:gsVia'); })), 'ד. לא נזכר');
  await c2.close(); await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'הכל תקין');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
