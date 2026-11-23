// ההזמנה לצמאה (8.99.578) — כרטיס הבית והתווית בעמוד, מול apps-script.gs בזיכרון.
// NODE_PATH=$(npm root -g) node tools/tzmtest/inv.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
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
  if (opt.me) await ctx.addInitScript('localStorage.setItem("df:me", ' + JSON.stringify(JSON.stringify(opt.me)) + ')');
  await p.goto('http://localhost:' + port + url);
  return p;
}

function setup(W) {
  var c = W.ctx, seq = 0;
  function join(id, role, first, last, ph, other, g, k) {
    c.appendCols_('לומדים', [['מזהה', id], ['שם', first], ['משפחה', last], ['קוד ישיבה', 'lapid'], ['ישיבה', 'לפיד'],
      ['תפקיד', role], ['טלפון', ph], ['טלפון ההורה', other], ['שכבה', g || ''], ['כיתה', k || '']]);
  }
  function mark(name, day) {
    c.appendCols_('עמדת לימוד', [['מזהה', 'm' + (++seq)], ['שבוע', '5'], ['יום', day], ['קוד עמדה', 'a'], ['סוג', 'דף'],
      ['מסלול', 'taanit'], ['דף', 'ב'], ['שכבה', 'ז'], ['כיתה', '3'], ['שם', name], ['קוד ישיבה', 'lapid']]);
  }
  join('KA', 'תלמיד', 'בית', 'אלף', '0001000001', '0002000001', 'ז', '3');
  join('DA', 'הורה', 'משה', 'אלף', '0002000001', '0001000001');
  join('KB', 'תלמיד', 'דלת', 'גימל', '0001000002', '', 'ז', '3');
  ['2026-11-01', '2026-11-02', '2026-11-03'].forEach(function (d) { mark('אלף בית', d); });
  mark('גימל דלת', '2026-11-01');
  c.appendCols_('עמדה — שיוך', [['מזהה', 'KA'], ['מסלול', 'taanit'], ['שבוע', '5'], ['מפתח', 'lapid|ז|3|אלף בית|taanit|5']]);
}
function me(id, role) { return { id: id, first: 'x', last: 'y', inst: 'lapid', instName: 'לפיד', role: role || 'kid', grade: 'ז', klass: '3', phone: '0001' }; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var W = world(); setup(W);
    W.ctx.tzmRoute_({ tzm: 'inv', key: 'k', on: '1' });
    var k = await page(b, port, W, '/join', { me: me('KA') });
    await k.waitForSelector('#tzinv:not([hidden])', { timeout: 20000 });
    ok(/כבונוס/.test(await k.textContent('#tzinv')) && await k.isVisible('#tzinv-go'), 'kid card with button');
    if (SHOT) await k.screenshot({ path: SHOT + '/inv-kid.png', fullPage: true });
    await k.click('#tzinv-go');
    await k.waitForFunction(function () { return /אישור הרב/.test(document.getElementById('tzinv').textContent); }, null, { timeout: 20000 });
    ok(!(await k.$('#tzinv-go')), 'button gone after request');
    var rq = JSON.parse(W.ctx.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    ok(rq.rq.length === 1 && rq.rq[0][2] === 'אלף בית' && rq.reg.length === 0, 'request row, not registered', rq.rq);
    var d = await page(b, port, W, '/join', { me: me('DA', 'dad') });
    await d.waitForSelector('#tzinv:not([hidden])', { timeout: 20000 });
    ok(/בנכם למד/.test(await d.textContent('#tzinv')) && !(await d.$('#tzinv-go')), 'parent card, no button');
    var x = await page(b, port, W, '/join', { me: me('KB') });
    await x.waitForTimeout(4000);
    ok(await x.isHidden('#tzinv'), 'not eligible — nothing');
    // עמוד הצמאה — התווית והבקשה
    var p = await page(b, port, W, '/tzama?k=' + rq.k);
    await p.waitForSelector('#byCard:not([hidden])');
    await p.fill('#by', 'רכז'); await p.click('#byGo');
    await p.click('#grs [data-g="ז"]'); await p.click('#clsBox [data-c="3"]');
    var rowsT = await p.$$eval('#stuBox .row', function (a) { return a.map(function (x) { return x.textContent; }); });
    ok(rowsT.length === 2 && /הדף השבועי/.test(rowsT[0]) && /ביקש להירשם/.test(rowsT[0]) && !/הדף השבועי/.test(rowsT[1]), 'badge + request on page', rowsT);
    if (SHOT) await p.screenshot({ path: SHOT + '/inv-page.png', fullPage: true });
    await p.click('#stuBox .row:nth-child(1)'); await p.click('#go');
    await p.waitForSelector('#bs.ok', { timeout: 20000 });
    var a2 = JSON.parse(W.ctx.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    ok(a2.reg.length === 1 && a2.rq.length === 0, 'approved on page', a2);
  } catch (e) { fails++; console.log('ERR', e && e.stack); }
  await b.close(); s.close();
  console.log((n - fails) + '/' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
