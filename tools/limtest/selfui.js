/* ר"ם בלי כיתה ידועה — בחירת כיתה במסך החסימה (8.99.603): הלוח (board.html) והאזור האישי (נוכחות).
   NODE_PATH=$(npm root -g) node tools/limtest/selfui.js [תיקייה לצילומים]
   שמות ומספרים מומצאים. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), M = require('../snaptest/mock.js');
var SHOT = process.argv[2] || '';
var TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
var fails = 0;
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
function serve() {
  return new Promise(function (res0) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, p === '/' ? '/index.html' : p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { res0(srv); });
  });
}
function world() {
  var W = M.makeWorld(), c = W.ctx;
  c.READ_KEY = 'k';
  var I = c.OV_INST_, code = I[4][0], nm = I[4][1];
  [['S1', 'ט׳', '3'], ['S3', 'ט׳', '2']].forEach(function (x) {
    c.appendCols_('לומדים', [['מזהה', x[0]], ['שם', 'תלמיד'], ['משפחה', x[0]], ['ישיבה', nm], ['קוד ישיבה', code],
      ['שכבה', x[1]], ['כיתה', x[2]], ['תפקיד', 'תלמיד']]);
  });
  var net = c.sheet_('תלמידי הרשת');
  net.appendRow(['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי']);
  net.appendRow([code, 'ט', '3', 'א', 'אחד']); net.appendRow([code, 'ט', '2', 'ב', 'שני']);
  c.appendCols_('התראות', [['מזהה', 'DRAM00002'], ['שם', 'Ram Demo'], ['טלפון', '055' + '0000022'], ['ישיבה', nm],
    ['קוד ישיבה', code], ['תפקיד', 'רב ומחנך']]);
  c.accAsk_(code, 'DRAM00002', false);
  c.upsertCols_(c.ACC_TAB, [['מזהה', 'DRAM00002'], ['מצב', 'אושר']], 'מזהה');
  var k = c.ensureCode_(code, 'zz');
  return { W: W, c: c, code: code, nm: nm, k: k };
}
async function ctxFor(b, X) {
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 420, height: 900 } });
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var rq = r.request(), u = new URL(rq.url()), q = {};
    u.searchParams.forEach(function (v, k) { q[k] = v; });
    X.c.OVX_MEMO_ = null; X.c.SS_OPEN_ = {};
    if (rq.method() === 'POST') {
      var out = X.c.doPost({ postData: { contents: rq.postData() || '' }, parameter: {} });
      return r.fulfill({ status: 200, contentType: 'application/json', body: out.t });
    }
    var o = X.c.doGet({ parameter: q });
    return r.fulfill({ status: 200, contentType: q.callback ? 'application/javascript' : 'application/json', body: o.t });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  return ctx;
}
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var errs = [];

  // ---- הלוח ----
  var X = world(), ctx = await ctxFor(b, X), p = await ctx.newPage();
  p.on('pageerror', function (e) { errs.push(String(e)); });
  await p.goto(base + '/board.html?inst=' + X.code);
  await p.evaluate(function (a) {
    localStorage.setItem('df:ram', JSON.stringify({ id: 'DRAM00002', inst: a.code, first: 'Ram', last: 'Demo', role: 'ר"ם' }));
    localStorage.setItem('df:instCodes', JSON.stringify((function () { var m = {}; m[a.code] = a.k; return m; })()));
  }, { code: X.code, k: X.k });
  await p.goto(base + '/board.html?inst=' + X.code + '&k=' + X.k); await p.waitForTimeout(2500);
  ok(await p.$('#lk-g') && await p.$('#lk-c'), 'board: class picker shown instead of the message');
  ok(!/פנו לרכז/.test(await p.textContent('body')), 'board: no "contact coordinator" text');
  if (SHOT) await p.screenshot({ path: SHOT + '/board-pick.png' });
  await p.click('.lk-b');
  await p.waitForTimeout(300);
  ok(/בחרו שכבה וכיתה/.test(await p.textContent('body')), 'board: empty pick → hint');
  await p.selectOption('#lk-g', 'ט׳'); await p.selectOption('#lk-c', '2');
  await p.click('.lk-b');
  await p.waitForTimeout(2500);
  ok(!(await p.$('#lk-g')), 'board: picker gone after save');
  var lim = X.c.limRead_(true)['DRAM00002'];
  ok(lim && lim.g === 'ט׳' && lim.c === '2', 'board: saved in "הגבלת כיתה"', lim);
  var ram = await p.evaluate(function () { return JSON.parse(localStorage.getItem('df:ram')); });
  ok(ram.grade === 'ט׳' && ram.klass === '2', 'board: class saved on the device profile', ram);
  if (SHOT) await p.screenshot({ path: SHOT + '/board-after.png' });
  await ctx.close();

  // ---- האזור האישי: נוכחות בשיעור ----
  X = world(); ctx = await ctxFor(b, X); p = await ctx.newPage();
  p.on('pageerror', function (e) { errs.push(String(e)); });
  await p.goto(base + '/'); await p.waitForTimeout(800);
  await p.evaluate(function (a) {
    localStorage.setItem('df:head', JSON.stringify({ id: 'DRAM00002', inst: a.code, instName: a.nm, first: 'Ram', last: 'Demo',
      role: 'רב ומחנך', phone: '055' + '0000022' }));
    localStorage.setItem('df:headSeen', '1');
    Store.set('dfBoard', a.code);
    var m = {}; m[a.code] = a.k; Store.set('instCodes', m);
  }, { code: X.code, nm: X.nm, k: X.k });
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  await p.evaluate(function () { show('my'); });
  await p.waitForTimeout(1200);
  ok(!(await p.$('#lk-g')), 'my: no picker before anything was blocked');
  await p.evaluate(function () { attOpen('self'); });
  await p.waitForTimeout(2500);
  ok(await p.$('#lk-g'), 'my: attendance blocked → class picker');
  ok(!/פנו לרכז/.test(await p.textContent('#my-body')), 'my: no "contact coordinator" text');
  if (SHOT) await p.screenshot({ path: SHOT + '/my-pick.png' });
  await p.selectOption('#lk-g', 'ט׳'); await p.selectOption('#lk-c', '3');
  await p.click('.lk-b');
  await p.waitForTimeout(3000);
  ok(!(await p.$('#lk-g')), 'my: picker gone after save');
  var open = await p.evaluate(function () { return !!(AMDA_STAFF && AMDA_STAFF.r); });
  ok(open, 'my: attendance opened right after');
  var cls = await p.evaluate(function () { return Object.keys((AMDA_STAFF.r.g || {})).map(function (g) { return g + ':' + Object.keys(AMDA_STAFF.r.g[g]).join(','); }).join('|'); });
  ok(cls === 'ט:3', 'my: only his class in the list', cls);
  var head = await p.evaluate(function () { return JSON.parse(localStorage.getItem('df:head')); });
  ok(head.grade === 'ט׳' && head.klass === '3', 'my: class saved on the device profile', head);
  if (SHOT) await p.screenshot({ path: SHOT + '/my-after.png' });

  ok(!errs.length, 'no page errors', errs);
  await b.close(); srv.close();
  console.log(fails ? fails + ' FAILED' : 'OK');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.log(e); process.exit(1); });
