// "לומד תורה לשמה" (8.99.596) — עמוד הר"ם מול apps-script.gs בזיכרון (Playwright, טלפון).
// NODE_PATH=$(npm root -g) node tools/tzmtest/page.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0, SHOT = process.env.SHOT || '';
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function world() {
  var W = M.makeWorld(), c = W.ctx;
  c.sheet_('תלמידי הרשת').getRange(1, 1, 4, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'],
    ['lapid', 'ז', '3', 'אלף', 'בית'], ['lapid', 'ז', '3', 'גימל', 'דלת'], ['other', 'ז', '3', 'זר', 'זר']]);
  c.sheet_('תלמידי בית הספר').getRange(1, 1, 3, 4).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'שם'],
    ['lapid', 'י״א', '2', 'הא וו'], ['lapid', 'ז׳', '3', 'אלף בית']]);
  return W;
}
function srv() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
      r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' :
        /\.jpg$/.test(f) ? 'image/jpeg' : /\.png$/.test(f) ? 'image/png' : 'application/octet-stream');
      r.end(fs.readFileSync(f));
    }).listen(0, function () { res(s); });
  });
}
async function page(b, port, W, url, opt) {
  opt = opt || {};
  var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
  var posts = 0;
  await ctx.route(/script\.google\.com/, async function (rt) {
    var rq = rt.request(), u = new URL(rq.url()), out;
    if (rq.method() === 'POST') {
      posts++;
      if (opt.dropPost && posts <= opt.dropPost) return rt.abort();
      out = W.ctx.doPost({ postData: { contents: rq.postData() } }).t;
    } else { var P = {}; u.searchParams.forEach(function (v, k) { P[k] = v; }); out = W.ctx.doGet({ parameter: P }).t; }
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + url);
  return p;
}
function rows(W) { var s = W.priv.getSheetByName('צמאה — רישום'); return s ? s.d.slice(1) : []; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var W = world(), c = W.ctx;
    ['2026-11-01','2026-11-02'].forEach(function (d, i) {
      c.appendCols_('עמדת לימוד', [['מזהה', 'x' + i], ['שבוע', '5'], ['יום', d], ['קוד עמדה', 'Noded'], ['סוג', 'שיעור'],
        ['שכבה', 'ז'], ['כיתה', '3'], ['שם', 'גימל דלת'], ['קוד ישיבה', 'lapid']]);
    });
    var adm = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    JSON.parse(c.doGet({ parameter: { tzm: 'lson', key: 'k', on: '1' } }).t);
    var p = await page(b, port, W, '/tzama?k=' + adm.k);
    await p.waitForSelector('#byCard:not([hidden])');
    await p.fill('#by', 'רכז'); await p.click('#byGo');
    await p.click('#grs [data-g="ז"]'); await p.click('#clsBox [data-c="3"]');
    await p.waitForTimeout(300);
    var t = await p.textContent('#stuBox');
    ok(/גימל דלת\s*לומד תורה לשמה/.test(t) && (t.match(/לומד תורה לשמה/g) || []).length === 1, 'tag on the right row only', t);
    await p.screenshot({ path: process.env.SHOT + '/ls.png' });
  } catch (e) { fails++; console.log('ERR', e && e.stack); }
  await b.close(); s.close();
  console.log((n - fails) + '/' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
