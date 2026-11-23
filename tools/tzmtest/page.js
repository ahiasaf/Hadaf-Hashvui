// רישום לאירוע צמאה (8.99.575) — העמוד מול apps-script.gs בזיכרון (Playwright, טלפון).
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
  var H = ['מזהה', 'שבוע', 'יום', 'סוג', 'קוד ישיבה', 'שכבה', 'כיתה', 'שם'], A = [H];
  [[1, 'דף'], [2, 'דף'], [2, 'דף'], [3, 'שיעור']].forEach(function (x, i) { A.push(['a' + i, String(x[0]), 'd' + i, x[1], 'lapid', 'ז', '3', 'גימל דלת']); });
  [1, 2, 3].forEach(function (w, i) { A.push(['b' + i, String(w), 'e' + i, 'דף', 'lapid', 'ז׳', 'ז3', 'אלף  בית']); });
  c.sheet_('עמדת לימוד').getRange(1, 1, A.length, H.length).setValues(A);
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
    var W = world();
    var adm = JSON.parse(W.ctx.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    ok(adm.status === 'ok' && /^[0-9a-zA-Z]{6,}$/.test(adm.k), 'admin creates key', adm);
    ok(JSON.parse(W.ctx.doGet({ parameter: { tzm: 'adm' } }).t).status === 'denied', 'admin needs READ_KEY');
    ok(JSON.parse(W.ctx.doGet({ parameter: { tzm: 'cls', k: 'nope' } }).t).status === 'denied', 'cls needs key');
    var bad = await page(b, port, W, '/tzama');
    await bad.waitForSelector('#msg:not([hidden])');
    ok(/אינו פעיל/.test(await bad.textContent('#msg')), 'no key → denied text');

    var p = await page(b, port, W, '/tzama?k=' + adm.k);
    await p.waitForSelector('#byCard:not([hidden])');
    ok(await p.isHidden('#main2') && /כדי שנדע/.test(await p.textContent('#byCard')) && /המשך/.test(await p.textContent('#byGo')), 'name first with explanation');
    await p.click('#byGo');
    ok(await p.isHidden('#main2'), 'no name → stays');
    await p.fill('#by', 'רכז בדיקה'); await p.click('#byGo');
    await p.waitForSelector('#grs [data-g="ז"]');
    var gl = await p.$$eval('#grs button', function (a) { return a.map(function (x) { return x.textContent; }); });
    ok(gl.join(',') === 'ז׳,ח׳,ט׳,י׳,י״א,י״ב', 'grades ז–יב', gl);
    await p.click('#grs [data-g="ז"]');
    await p.click('#clsBox [data-c="3"]');
    var nm = await p.$$eval('#stuBox .row b', function (a) { return a.map(function (x) { return x.firstChild.nodeValue; }); });
    ok(nm.join(',') === 'אלף בית,גימל דלת', 'roster names, deduped, other inst excluded', nm);
    var bds = await p.$$eval('#stuBox .row', function (a) { return a.map(function (x) { return !!x.querySelector('.bd'); }); });
    ok(bds[0] === true && bds[1] === false, 'badge: 3 weeks yes, 2 weeks + lesson no', bds);
    await p.click('#stuBox .row:nth-child(1)');
    await p.fill('#addN', 'תלמיד חדש'); await p.click('#addB');
    ok(/\(2\)/.test(await p.textContent('#go')), 'save shows 2 changes');
    if (SHOT) await p.screenshot({ path: SHOT + '/1.png', fullPage: true });
    await p.click('#go');
    await p.waitForSelector('#bs.ok', { timeout: 20000 });
    ok(rows(W).length === 2 && rows(W).every(function (r) { return r[1] === 'רשום' && r[7] === 'רכז בדיקה'; }), 'rows saved', rows(W));
    ok(rows(W).some(function (r) { return r[5] === 'תלמיד חדש' && r[6] === 'כן'; }), 'manual flagged');
    ok(await p.isHidden('#go'), 'no pending after save');
    // יב — אין כיתות: מספר ביד
    await p.click('#grs [data-g="יב"]');
    ok(!!(await p.$('#cn')), 'יב: class number input');
    await p.fill('#cn', '4'); await p.click('#cnGo');
    ok(/אין לנו רשימת/.test(await p.textContent('#stuBox')), 'no-list note');
    // יא2 — מהמאגר
    await p.click('#grs [data-g="יא"]');
    await p.click('#clsBox [data-c="2"]');
    ok(/הא וו/.test(await p.textContent('#stuBox')), 'יא from school roster');
    // ביטול
    var p2 = await page(b, port, W, '/tzama?k=' + adm.k);
    await p2.fill('#by', 'רכז שני'); await p2.click('#byGo');
    await p2.waitForSelector('#grs [data-g="ז"]');
    await p2.click('#grs [data-g="ז"]');
    ok(/· 2/.test(await p2.textContent('#clsBox [data-c="3"]')), 'class chip shows registered count');
    await p2.click('#clsBox [data-c="3"]');
    ok(/נרשם ע״י רכז בדיקה/.test(await p2.textContent('#stuBox')), 'who registered shown');
    await p2.click('#stuBox .row:nth-child(1)');
    await p2.click('#go');
    await p2.waitForSelector('#bs.ok', { timeout: 20000 });
    ok(rows(W).filter(function (r) { return r[1] === 'רשום'; }).length === 1, 'unregister → בוטל', rows(W));
    // כשל רשת — הסימונים נשארים
    var p3 = await page(b, port, W, '/tzama?k=' + adm.k, { dropPost: 9 });
    await p3.fill('#by', 'רכז'); await p3.click('#byGo');
    await p3.waitForSelector('#grs [data-g="ז"]'); await p3.click('#grs [data-g="ז"]'); await p3.click('#clsBox [data-c="3"]');
    await p3.click('#stuBox .row:nth-child(1)'); await p3.click('#go');
    await p3.waitForSelector('#bs.bad', { timeout: 30000 });
    ok(!(await p3.isHidden('#go')), 'failure keeps pending');
    var a2 = JSON.parse(W.ctx.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    ok(a2.k === adm.k && a2.reg.length === 1, 'admin list + same key', a2);
  } catch (e) { console.log('ERR', e); fails++; }
  await b.close(); s.close();
  console.log(n + ' checks, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})();
