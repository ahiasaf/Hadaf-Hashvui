// צמאה — אוטובוסים (8.99.619): קישור אחד לרבנים עם שתי לשוניות · "אין אישור הורים" בדלת (לא עולה עדיין / ההורים אישרו
// עכשיו — מאשר ומעלה) · שורת "N תלמידים בלי אישור הורים". NODE_PATH=$(npm root -g) node tools/bustest/unify.js — נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var A = ['אלף', 'בית'].join(' '), B = ['גימל', 'דלת'].join(' '), R1 = ['הא', 'וו'].join(' ');
var kA = 's|ז|3|' + A, kB = 's|ז|3|' + B;
var W = M.makeWorld(), c = W.ctx;
c.TZM_CLOSED_ = false;
var tz = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: tz.k, by: 'x', ch: [{ g: 'ז', c: '3', n: A, on: 1 }, { g: 'ז', c: '3', n: B, on: 1 }] }) } });
var ad = JSON.parse(c.doGet({ parameter: { bus: 'adm', w: 'adm', key: 'k' } }).t);
c.doGet({ parameter: { bus: 'st', w: 'adm', key: 'k' } });
W.priv.getSheetByName('צמאה — אוטובוסים').getRange(2, 2).setValue(R1);
c.busBust_();
[kA, kB].forEach(function (k) { c.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: k, f: 'b', v: '1' } }); });
c.doGet({ parameter: { bus: 'set', w: 'p', x: ad.p, k: kB, f: 'ap', v: 'y', by: 'x' } });
function row(k) { return W.priv.getSheetByName('צמאה — שיבוץ').d.filter(function (r) { return r[0] === k; })[0]; }
function qEmpty(p) {
  return p.waitForFunction(function () {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('df:busQ:') === 0 && localStorage.getItem(k) !== '[]') return false; }
    return true;
  }, null, { timeout: 15000 });
}
var s = http.createServer(function (q, r) {
  var p = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : /\.jpg$/.test(f) ? 'image/jpeg' : 'application/octet-stream');
  r.end(fs.readFileSync(f));
}).listen(0, async function () {
  var port = s.address().port, b = await pw.chromium.launch();
  async function page(url, skipIntro) {
    var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
    if (skipIntro) await ctx.addInitScript(function () { try { localStorage.setItem('df:busIntro:' + new URLSearchParams(location.search).get('x'), '1'); } catch (e) {} });
    await ctx.route(/script\.google\.com/, function (rt) {
      var u = new URL(rt.request().url()), P = {};
      u.searchParams.forEach(function (v, k) { P[k] = v; });
      rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: c.doGet({ parameter: P }).t });
    });
    await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
    var p = await ctx.newPage();
    p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
    await p.goto('http://localhost:' + port + url);
    return p;
  }
  try {
    // קישור רבני האוטובוס — נפתח על "עלייה לאוטובוס"
    var pb = await page('/bus?w=b&x=' + ad.b, true);
    await pb.waitForSelector('[data-me]');
    ok((await pb.$$eval('#tabs2 button', function (x) { return x.map(function (y) { return y.textContent + (y.className ? '*' : ''); }); })).join('|') === 'אישור הורים|עלייה לאוטובוס*', 'tabs, bus on');
    await pb.click('[data-me="0"]');
    await pb.waitForSelector('#noap');
    ok((await pb.textContent('#noap summary')) === '1 תלמידים בלי אישור הורים', 'no-approval line');
    ok((await pb.textContent('.fl.n')) === 'אין אישור הורים', 'flag text');
    ok((await pb.textContent('.fl.y')) === 'יש אישור הורים', 'flag y text');
    // לא עולה עדיין
    await pb.click('[data-h="' + kA + '"]');
    ok(await pb.isVisible('#apm'), 'modal opens');
    ok((await pb.textContent('#apQ')) === 'ל' + A + ' אין אישור הורים', 'modal text');
    ok((await pb.textContent('#apNo')) === 'לא עולה עדיין', 'not yet btn');
    await pb.click('#apNo');
    ok(await pb.isHidden('#apm') && !(await pb.$('[data-h="' + kA + '"].on')), 'not boarded');
    ok((await pb.evaluate(function () { return Q.length; })) === 0, 'nothing queued');
    // מאושר — ישר בלי חלון
    await pb.click('[data-h="' + kB + '"]');
    ok(await pb.isHidden('#apm') && !!(await pb.$('[data-h="' + kB + '"].on')), 'approved boards directly');
    // ההורים אישרו עכשיו
    await pb.click('[data-h="' + kA + '"]');
    await pb.click('#apYes');
    ok(!!(await pb.$('[data-h="' + kA + '"].on')) && !(await pb.$('#noap')), 'boarded + line gone');
    await qEmpty(pb);
    var ra = row(kA);
    ok(ra[7] === 'כן' && ra[8] === 'בעלייה לאוטובוס · ' + R1 && !!ra[6], 'sheet: approval at bus + arrived', ra);
    ok(!!row(kB)[6], 'sheet: B arrived');
    if (process.env.SHOT) await pb.screenshot({ path: process.env.SHOT });
    // מעבר ללשונית אישור הורים
    await pb.click('#tabs2 [data-mode="p"]');
    await pb.waitForSelector('[data-g]');
    ok(!(await pb.$('.fbar')) && !(await pb.evaluate(function () { return document.body.classList.contains('hasbar'); })), 'no bus bar on approvals');
    ok((await pb.textContent('#ttl')) === 'אישור הורים — צמא"ה', 'title follows tab');
    await pb.click('[data-g="ז"]'); await pb.click('[data-c="3"]');
    await pb.waitForSelector('button.y.on[data-ap="' + kA + '"]');
    ok(true, 'approval from bus shows in approvals tab');
    await pb.click('button.n[data-ap="' + kB + '"]');
    await qEmpty(pb);
    ok(row(kB)[7] === 'לא' && row(kB)[8] === 'ר"ם ז׳3', 'approval from tab', row(kB));
    await pb.reload();
    await pb.waitForSelector('[data-g]');
    ok((await pb.getAttribute('#tabs2 [data-mode="p"]', 'class')) === 'on', 'tab remembered');
    await pb.click('#tabs2 [data-mode="b"]');
    await pb.waitForSelector('[data-h]');
    ok(await pb.isHidden('#apm'), 'back to bus, name remembered');
    // קישור הר"מים — נפתח על אישור הורים; מעבר לעלייה — מסך ההסבר בפעם הראשונה
    var pp = await page('/bus?w=p&x=' + ad.p);
    await pp.waitForSelector('[data-g]');
    ok(await pp.isHidden('#intro'), 'no intro on approvals');
    await pp.click('#tabs2 [data-mode="b"]');
    await pp.waitForSelector('#intro:not([hidden])');
    ok(true, 'intro on first bus tab');
    await pp.click('#inGo');
    await pp.waitForSelector('[data-me]');
    ok(true, 'name pick in p link');
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
  process.exit(fails ? 1 : 0);
});
