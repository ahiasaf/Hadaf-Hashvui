// צמאה — אוטובוסים: מסך ההסבר לרב האוטובוס. בכניסה הראשונה בלבד, "הבנתי, מתחילים" סוגר ונזכר,
// "איך זה עובד?" פותח שוב. לא במנהל ולא בר"מים. NODE_PATH=$(npm root -g) node tools/bustest/intro.js — נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var W = M.makeWorld(), c = W.ctx;
var ad = JSON.parse(c.doGet({ parameter: { bus: 'adm', w: 'adm', key: 'k' } }).t);
c.doGet({ parameter: { bus: 'st', w: 'adm', key: 'k' } });
W.priv.getSheetByName('צמאה — אוטובוסים').getRange(2, 2).setValue('רב א');
c.busBust_();
var s = http.createServer(function (q, r) {
  var p = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : /\.jpg$/.test(f) ? 'image/jpeg' : 'application/octet-stream');
  r.end(fs.readFileSync(f));
}).listen(0, async function () {
  var port = s.address().port, b = await pw.chromium.launch();
  try {
    var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
    await ctx.route(/script\.google\.com/, function (rt) {
      var u = new URL(rt.request().url()), P = {};
      u.searchParams.forEach(function (v, k) { P[k] = v; });
      rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: c.doGet({ parameter: P }).t });
    });
    var p = await ctx.newPage();
    p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
    await p.goto('http://localhost:' + port + '/bus?w=b&x=' + ad.b);
    await p.waitForSelector('#intro:not([hidden])');
    ok((await p.textContent('#inT')) === 'אתה עומד בכניסה לאוטובוס', 'title');
    ok((await p.$$eval('#intro li', function (x) { return x.length; })) === 4, '4 lines');
    ok(await p.evaluate(function () { var i = document.querySelector('#intro img'); return i.complete && i.naturalWidth > 0; }), 'image loaded');
    if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT, fullPage: false });
    await p.click('#inGo');
    ok(await p.isHidden('#intro'), 'closed');
    await p.waitForSelector('[data-me]');
    await p.reload();
    await p.waitForSelector('[data-me]');
    ok(await p.isHidden('#intro'), 'not again after reload');
    ok((await p.textContent('#inAgain')) === 'איך זה עובד?', 'again link');
    await p.click('#inAgain');
    ok(await p.isVisible('#intro'), 'reopens');
    await p.click('#inGo');
    var pa = await ctx.newPage();
    await pa.goto('http://localhost:' + port + '/bus?w=a&x=' + ad.a);
    await pa.waitForSelector('[data-tab]');
    ok(await pa.isHidden('#intro') && await pa.isHidden('#inAgain'), 'not for manager');
    var pp = await ctx.newPage();
    await pp.goto('http://localhost:' + port + '/bus?w=p&x=' + ad.p);
    await pp.waitForTimeout(800);
    ok(await pp.isHidden('#intro') && await pp.isHidden('#inAgain'), 'not for rav approvals');
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
  process.exit(fails ? 1 : 0);
});
