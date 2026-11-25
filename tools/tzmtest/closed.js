// ההרשמה לצמאה נעולה (8.99.601) — אין רישום/בקשה/ביטול; סימון ההגעה של הר"ם פתוח. נתונים מומצאים.
// NODE_PATH=$(npm root -g) node tools/tzmtest/closed.js
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
    ok(c.TZM_CLOSED_ === true, 'closed by default');
    var adm = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    var g = function (P) { return JSON.parse(c.doGet({ parameter: P }).t); };
    ok(g({ tzm: 'sreq', s: adm.sk, g: 'ז', cl: '3', n: 'אלף בית' }).status === 'closed', 'sreq closed');
    ok(g({ tzm: 'scan', s: adm.sk, g: 'ז', cl: '3', n: 'אלף בית', tk: 'x' }).status === 'closed', 'scan closed');
    var cl = g({ tzm: 'cls', k: adm.k });
    ok(cl.status === 'ok' && cl.closed === 1 && !Object.keys(cl.cls).length, 'cls closed, no names', cl);
    var sc = g({ tzm: 'scls', s: adm.sk });
    ok(sc.status === 'ok' && sc.closed === 1 && !Object.keys(sc.cls).length, 'scls closed', sc);
    var pr = JSON.parse(c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: adm.k, by: 'רכז', ch: [{ g: 'ז', c: '3', n: 'אלף בית', on: true }] }) } }).t);
    ok(pr.status === 'closed', 'put closed', pr);
    ok(!W.priv.getSheetByName('צמאה — רישום') || W.priv.getSheetByName('צמאה — רישום').d.length <= 1, 'no rows');
    // ר"ם — סימון ההגעה עדיין עובד
    var A = ['אלף', 'רב'].join(' ');
    g({ tzm: 'rams', k: adm.k });
    W.priv.getSheetByName('צמאה — ר"מים').getRange(2, 1, 1, 2).setValues([[A, 'ז׳4']]);
    ok(g({ tzm: 'ramset', k: adm.k, n: A, a: 'y' }).a === 'y', 'ramset ok');
    // עמוד הר"ם: שאלת ההגעה + הודעה, בלי שכבות
    var p = await page(b, port, W, '/tzama?k=' + adm.k);
    await p.waitForSelector('#byS:not([hidden])');
    await p.selectOption('#byS', A); await p.click('#byGo');
    await p.waitForSelector('#clsd:not([hidden])');
    ok(await p.isVisible('#ramCard'), 'ram q');
    ok(await p.isHidden('#grs'), 'no grades');
    ok(await p.isHidden('#bar'), 'no save bar');
    ok((await p.textContent('#clsdT')).indexOf('נסגרה') >= 0, 'closed note');
    await p.waitForFunction(function () { return document.getElementById('ramY').textContent.indexOf('✓') === 0; });
    await p.click('#ramN');
    await p.waitForFunction(function () { return document.getElementById('ramN').textContent.indexOf('✓') === 0; });
    ok(g({ tzm: 'ramst', k: adm.k, n: A }).a === 'n', 'rav marks n');
    await p.close();
    // תלמיד בלי רישום בטלפון — הודעה
    p = await page(b, port, W, '/tzama?s=' + adm.sk);
    await p.waitForSelector('#msg:not([hidden])');
    ok((await p.textContent('#msg')).indexOf('נסגרה') >= 0, 'student closed msg');
    ok(await p.isHidden('#f'), 'student no form');
    await p.close();
    // תלמיד שנרשם קודם מהטלפון — רואה את המצב, בלי ביטול
    p = await page(b, port, W, '/tzama?s=' + adm.sk);
    await p.evaluate(function (k) { localStorage.setItem('df:tzmMine:' + k, JSON.stringify({ g: 'ז', c: '3', n: 'אלף בית', tk: 'tx' })); }, adm.sk);
    await p.reload(); await p.waitForSelector('#stuCard:not([hidden])');
    ok(await p.$('#schg') === null, 'no cancel');
    ok((await p.textContent('#stuBox')).indexOf('אלף בית') >= 0, 'status shown');
    await p.close();
  } finally { await b.close(); s.close(); }
  console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
})();
