// קישור לצפייה בלבד ברשימת הרשומים (8.99.608). נתונים מומצאים.
// NODE_PATH=$(npm root -g) node tools/tzmtest/viewlink.js
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
    var W = world(), c = W.ctx; c.TZM_CLOSED_ = false;
    var A = ['אלף', 'בית'].join(' '), B = ['גימל', 'דלת'].join(' ');
    var adm = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    JSON.parse(c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: adm.k, by: 'רכז', ch: [{ g: 'ז', c: '3', n: A, on: true }] }) } }).t);
    c.TZM_CLOSED_ = true;
    var all = JSON.parse(c.doGet({ parameter: { tzm: 'all', key: 'k' } }).t);
    ok(all.vk && all.vk.length >= 10, 'vk', all.vk);
    ok(JSON.parse(c.doGet({ parameter: { tzm: 'view', v: 'bad' } }).t).status === 'denied', 'bad key');
    var v = JSON.parse(c.doGet({ parameter: { tzm: 'view', v: all.vk } }).t);
    ok(v.status === 'ok' && v.reg.length === 1 && v.reg[0].length === 3, 'view data', v);
    var p = await page(b, port, W, '/tzama?v=' + all.vk);
    await p.waitForSelector('#vw:not([hidden])');
    var t = await p.textContent('#vwC');
    ok(t.indexOf('רשומים 1 מתוך 2') >= 0, 'count', t);
    ok(t.indexOf('✓ ' + A) >= 0 && t.indexOf(B) >= 0 && t.indexOf('✓ ' + B) < 0, 'marks');
    ok(await p.$$eval('input,select,#bar:not([hidden])', function (l) { return l.filter(function (e) { return e.offsetParent; }).length; }) === 0, 'no inputs');
    ok(await p.isHidden('#byCard') && await p.isHidden('#f'), 'no form');
    await p.click('#vwG [data-g="יא"]');
    ok((await p.textContent('#vwC')).indexOf('הא וו') >= 0, 'grade switch');
    await p.close();
    p = await page(b, port, W, '/tzama?v=bad');
    await p.waitForSelector('#msg:not([hidden])');
    ok(await p.isHidden('#vw'), 'bad link no list');
    await p.close();
  } finally { await b.close(); s.close(); }
  console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
})();
