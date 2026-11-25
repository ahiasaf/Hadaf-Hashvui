// חלוקת פרסים (8.99.602) — השרת (prsRoute_ ב-vm), עמוד התלמיד ומסך הניהול מול אותו שרת.
// NODE_PATH=$(npm root -g) node tools/prstest/run.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function G(W, P) { return JSON.parse(W.ctx.doGet({ parameter: P }).t); }
function srv() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); }
      r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' :
        /\.png$/.test(f) ? 'image/png' : 'application/octet-stream');
      r.end(fs.readFileSync(f));
    }).listen(0, function () { res(s); });
  });
}
async function ctxOf(b, W, opt) {
  opt = opt || {};
  var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
  await ctx.route(/script\.google\.com/, async function (rt) {
    var u = new URL(rt.request().url()), P = {};
    u.searchParams.forEach(function (v, k) { P[k] = v; });
    // כמו גוגל: c / sid שמורים — דף שגיאה לפני doGet
    if (P.c != null || P.sid != null) return rt.fulfill({ status: 200, contentType: 'text/html', body: '<html>err</html>' });
    if (opt.fail && P.prs === 'set') { opt.fail--; return rt.abort(); }
    var out = W.ctx.doGet({ parameter: P }).t;
    if (P.callback) out = P.callback + '(' + out + ')';
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  return ctx;
}
function tab(W) { return W.priv.getSheetByName('חלוקת פרסים'); }
function sums(p) { return p.$$eval('.prs-sum b', function (x) { return x.map(function (e) { return e.textContent; }).join(','); }); }
(async function () {
  var W = M.makeWorld(), c = W.ctx;
  // זריעה מ"זכאויות" כשהלשונית ריקה
  c.sheet_('זכאויות').getRange(1, 1, 3, 2).setValues([['שם מלא', 'מספר פרסים'], ['אלף בית', '1'], ['גימל דלת', '2']]);
  ok(G(W, { prs: 'list' }).status === 'denied', 'no key denied');
  var adm = G(W, { prs: 'adm', key: 'k' });
  ok(adm.status === 'ok' && adm.k && adm.list.length === 2, 'adm seeded', adm);
  ok(!W.pub.getSheetByName('חלוקת פרסים'), 'not public');
  var sh = tab(W);
  ok(sh && sh.d[0].join('|') === 'שם|כיתה|מגיע|הגיע בפועל', 'header', sh && sh.d[0]);
  ok(G(W, { prs: 'list', k: 'bad' }).status === 'denied', 'bad key');
  // אחיאסף ממלא — אותו שם בכיתה אחרת
  sh.getRange(4, 1, 1, 4).setValues([['אלף בית', 'ט׳2', '', '']]);
  var L = G(W, { prs: 'list', k: adm.k });
  ok(L.list.length === 3 && Object.keys(L.list[0]).length === 2, 'list only n,c', L);
  // הזריעה לא חוזרת כשיש שמות
  c.sheet_('זכאויות').getRange(4, 1, 1, 2).setValues([['הא וו', '1']]);
  ok(G(W, { prs: 'list', k: adm.k }).list.length === 3, 'no reseed');
  // תלמיד עונה; אותו שם בכיתה אחרת — לא נוגע
  var s1 = G(W, { prs: 'set', k: adm.k, n: 'אלף בית', cl: 'ט׳2', a: 'y' });
  ok(s1.status === 'ok' && s1.a === 'y', 'set y', s1);
  ok(sh.d[3][2] === 'כן' && !sh.d[1][2], 'right row', sh.d);
  ok(G(W, { prs: 'me', k: adm.k, n: 'אלף בית', cl: 'ט׳2' }).a === 'y', 'me');
  ok(G(W, { prs: 'set', k: adm.k, n: 'לא קיים', a: 'y' }).status === 'none', 'unknown');
  ok(G(W, { prs: 'set', k: adm.k, n: 'אלף בית', cl: 'ט׳2', a: '-' }).status === 'error', 'student cannot clear');
  ok(G(W, { prs: 'here', k: adm.k, n: 'אלף בית', cl: 'ט׳2', h: '1' }).status === 'denied', 'student cannot mark here');
  ok(G(W, { prs: 'adm', k: adm.k }).status === 'denied', 'student no adm');
  // אחיאסף: משנה, מנקה, מסמן הגיע
  ok(G(W, { prs: 'set', key: 'k', n: 'אלף בית', cl: 'ט׳2', a: 'n' }).a === 'n', 'adm n');
  ok(G(W, { prs: 'set', key: 'k', n: 'אלף בית', cl: 'ט׳2', a: '-' }).a === '' && sh.d[3][2] === '', 'adm clear');
  var h1 = G(W, { prs: 'here', key: 'k', n: 'גימל דלת', cl: '', h: '1' });
  ok(h1.status === 'ok' && h1.h === 1 && sh.d[2][3] === 'כן', 'here', h1);
  ok(G(W, { prs: 'here', key: 'k', n: 'גימל דלת', h: '0' }).h === 0 && sh.d[2][3] === '', 'unhere');
  ok(G(W, { prs: 'bdn', key: 'k' }).n === 3, 'bdn');
  ok(G(W, { prs: 'bdn' }).status === 'denied', 'bdn needs key');

  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var ctx = await ctxOf(b, W), p = await ctx.newPage();
    p.on('pageerror', function (e) { fails++; console.log('PAGEERR', e.message); });
    await p.goto('http://localhost:' + port + '/prasim?k=' + adm.k);
    await p.waitForSelector('#f:not([hidden])');
    ok(await p.isHidden('#qCard'), 'no q before name');
    var opts = await p.$$eval('#byS option', function (o) { return o.map(function (x) { return x.textContent; }); });
    ok(opts.length === 4 && opts.indexOf('אלף בית · ט׳2') >= 0, 'options', opts);
    await p.selectOption('#byS', { label: 'גימל דלת' });
    await p.waitForSelector('#qCard:not([hidden])');
    ok((await p.textContent('#q')).indexOf('1.12') >= 0, 'question');
    await p.click('#bY');
    await p.waitForFunction(function () { return document.getElementById('bY').textContent.indexOf('✓') === 0; });
    ok(sh.d[2][2] === 'כן', 'saved from page', sh.d[2]);
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/stu.png' });
    await p.reload();
    await p.waitForSelector('#qCard:not([hidden])');
    await p.waitForFunction(function () { return document.getElementById('bY').textContent.indexOf('✓') === 0; });
    ok((await p.inputValue('#byS')) !== '', 'remembered name');
    await p.click('#bN');
    await p.waitForFunction(function () { return document.getElementById('bN').textContent.indexOf('✓') === 0; });
    ok(sh.d[2][2] === 'לא' && (await p.textContent('#bY')).indexOf('✓') < 0, 'changed');
    await ctx.close();
    // כישלון — הודעה, בלי ✓
    var ctx2 = await ctxOf(b, W, { fail: 2 }), p2 = await ctx2.newPage();
    await p2.goto('http://localhost:' + port + '/prasim?k=' + adm.k);
    await p2.waitForSelector('#f:not([hidden])');
    await p2.selectOption('#byS', { label: 'אלף בית' });
    await p2.click('#bY');
    await p2.waitForSelector('#qE:not([hidden])');
    ok((await p2.textContent('#bY')).indexOf('✓') < 0 && sh.d[1][2] === '', 'fail no check');
    await ctx2.close();
    // בלי מפתח
    var ctx3 = await ctxOf(b, W), p3 = await ctx3.newPage();
    await p3.goto('http://localhost:' + port + '/prasim');
    await p3.waitForSelector('#msg:not([hidden])');
    ok((await p3.textContent('#msg')).length > 5, 'denied msg');
    await ctx3.close();
    // מסך הניהול
    var ctx4 = await ctxOf(b, W), p4 = await ctx4.newPage();
    p4.on('pageerror', function (e) { fails++; console.log('PAGEERR adm', e.message); });
    await p4.goto('http://localhost:' + port + '/index.html');
    await p4.waitForTimeout(800);
    await p4.evaluate(function () { CFG.readKey = 'k'; var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#fff;padding:12px'; document.body.appendChild(d); admPrs(d); });
    await p4.waitForSelector('.prs-row');
    ok((await sums(p4)) === '0,1,2,0', 'summary', await sums(p4));
    await p4.fill('.prs-q', 'גימל');
    ok((await p4.$$('.prs-row')).length === 1, 'search');
    await p4.click('.prs-row .hr');
    await p4.waitForFunction(function () { return document.querySelector('.prs-row .hr').textContent.indexOf('✓') === 0; });
    ok(sh.d[2][3] === 'כן', 'adm here saved');
    await p4.click('.prs-row .prs-bt button:nth-child(1)');
    await p4.waitForFunction(function () { return document.querySelector('.prs-row .prs-bt button').textContent.indexOf('✓') === 0; });
    ok(sh.d[2][2] === 'כן', 'adm y saved');
    ok((await sums(p4)) === '1,0,2,1', 'summary after', await sums(p4));
    ok((await p4.inputValue('.prs-q')) === 'גימל', 'search kept');
    await p4.fill('.prs-q', '');
    if (process.env.SHOT) await p4.screenshot({ path: process.env.SHOT + '/adm.png', fullPage: true });
    await ctx4.close();
  } finally { await b.close(); s.close(); }
  console.log(n + ' checks, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.log(e); process.exit(1); });
