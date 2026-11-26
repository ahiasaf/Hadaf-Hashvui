// צמאה — אוטובוסים, העמוד (8.99.611): אישור הורים → הדגל מתעדכן לבד אצל רב האוטובוס; העברה; איפוס בחלון והקלדה; שחזור.
// NODE_PATH=$(npm root -g) node tools/bustest/page.js — נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var A = ['אלף', 'בית'].join(' '), B = ['גימל', 'דלת'].join(' '), R1 = ['הא', 'וו'].join(' ');
function world() {
  var W = M.makeWorld(), c = W.ctx;
  c.TZM_CLOSED_ = false;
  var tz = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
  c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: tz.k, by: 'x', ch: [{ g: 'ז', c: '3', n: A, on: 1 }, { g: 'ז', c: '3', n: B, on: 1 }] }) } });
  var ad = JSON.parse(c.doGet({ parameter: { bus: 'adm', w: 'adm', key: 'k' } }).t);
  c.doGet({ parameter: { bus: 'st', w: 'adm', key: 'k' } });
  W.priv.getSheetByName('צמאה — אוטובוסים').getRange(2, 2).setValue(R1);
  c.busBust_();
  JSON.parse(c.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 's|ז|3|' + A, f: 'b', v: '1' } }).t);
  W.ad = ad;
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
async function page(b, port, W, url, init) {
  var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
  if (init) await ctx.addInitScript(init);
  await ctx.route(/script\.google\.com/, async function (rt) {
    var rq = rt.request(), u = new URL(rq.url()), P = {};
    u.searchParams.forEach(function (v, k) { P[k] = v; });
    var out = W.ctx.doGet({ parameter: P }).t;
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + url);
  return p;
}
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var W = world(), ad = W.ad;
    // רב אוטובוס
    var pb = await page(b, port, W, '/bus?w=b&x=' + ad.b);
    await pb.waitForSelector('[data-me]');
    ok((await pb.textContent('#app')).indexOf(R1) >= 0, 'staff name listed');
    await pb.click('[data-me="0"]');
    await pb.waitForSelector('.fl');
    var t = await pb.textContent('#app');
    ok(t.indexOf(A) >= 0 && t.indexOf(B) < 0, 'only own bus', t);
    ok((await pb.textContent('.fl.n')) === 'אין אישור', 'red flag');
    // ר"ם מאשר
    var pp = await page(b, port, W, '/bus?w=p&x=' + ad.p);
    await pp.waitForSelector('[data-g]');
    ok(await pp.isHidden('#tools'), 'no search for rav');
    await pp.click('[data-g="ז"]'); await pp.click('[data-c="3"]');
    await pp.waitForSelector('[data-ap]');
    ok((await pp.textContent('#app')).indexOf(B) >= 0, 'rav sees class students');
    await pp.click('button.y[data-ap="s|ז|3|' + A + '"]');
    await pp.waitForFunction(function () { return document.querySelectorAll('.fl.y').length === 1 && !document.querySelector('#say').textContent; });
    var row = W.priv.getSheetByName('צמאה — שיבוץ').d.filter(function (r) { return r[0] === 's|ז|3|' + A; })[0];
    ok(row[7] === 'כן' && row[8] === 'ר"ם ז׳3', 'sheet approval + by', row);
    // הדגל אצל רב האוטובוס — בלי רענון
    await pb.waitForSelector('.fl.y', { timeout: 15000 });
    ok(true, 'live flag');
    // הגעה
    await pb.click('[data-h="s|ז|3|' + A + '"]');
    await pb.waitForFunction(function () { var x = document.querySelector('.hb.on'); return x && !document.querySelector('#say').textContent; });
    ok(!!row && W.priv.getSheetByName('צמאה — שיבוץ').d.filter(function (r) { return r[0] === 's|ז|3|' + A; })[0][6], 'arrived written');
    // איפוס: חלון, "כן" נעול עד הקלדה
    await pb.click('.rst');
    ok(await pb.isVisible('#mdl'), 'modal');
    ok((await pb.textContent('#mQ')).indexOf('אוטובוס 1') >= 0, 'modal text');
    ok(await pb.isDisabled('#mYes'), 'yes locked');
    await pb.fill('#mI', 'לא');
    ok(await pb.isDisabled('#mYes'), 'still locked');
    await pb.click('#mNo');
    ok(await pb.isHidden('#mdl') && await pb.$('.hb.on'), 'cancel keeps');
    await pb.click('.rst'); await pb.fill('#mI', 'אפס');
    ok(!(await pb.isDisabled('#mYes')), 'unlocked');
    await pb.click('#mYes');
    await pb.waitForFunction(function () { return !document.querySelector('.hb.on') && document.querySelector('.undo'); });
    ok((await pb.textContent('#say')).indexOf('אופסו') >= 0, 'reset msg');
    ok(W.priv.getSheetByName('צמאה — איפוס').d.length === 2, 'logged');
    await pb.click('.undo');
    await pb.waitForSelector('.hb.on');
    ok((await pb.textContent('#say')).indexOf('שוחזרו') >= 0, 'undo msg');
    // מנהל: העברה, פנויים, חיפוש
    var pa = await page(b, port, W, '/bus?w=a&x=' + ad.a);
    await pa.waitForSelector('[data-tab]');
    ok((await pa.textContent('[data-tab="1"]')).indexOf('פנויים 48') >= 0, 'free seats', await pa.textContent('[data-tab="1"]'));
    await pa.click('[data-tab="0"]');
    await pa.waitForSelector('[data-mv="s|ז|3|' + B + '"]');
    await pa.click('[data-mv="s|ז|3|' + B + '"][data-v="3"]');
    await pa.waitForFunction(function () { return /פנויים 49/.test(document.querySelector('[data-tab="3"]').textContent); });
    ok(true, 'moved');
    await pa.fill('#q', 'גימל');
    var tq = await pa.textContent('#app');
    ok(tq.indexOf(B) >= 0 && tq.indexOf(A) < 0, 'search');
    ok(await pa.$('.ap') === null, 'manager: no approval override');
    // ניהול: קביעה שגוברת
    var pd = await page(b, port, W, '/bus?w=adm', 'localStorage.setItem("df:cfg", JSON.stringify({ readKey: "k" }))');
    await pd.waitForSelector('[data-tab]');
    await pd.click('button.n[data-ap="s|ז|3|' + A + '"]');
    await pd.waitForFunction(function () { return document.querySelector('.fl.n') && !document.querySelector('#say').textContent; });
    await pb.waitForSelector('.fl.n', { timeout: 15000 });
    ok(true, 'admin override live at bus');
    var bad = await page(b, port, W, '/bus?w=a&x=nope');
    await bad.waitForFunction(function () { return /אינו תקין/.test(document.querySelector('#msg').textContent); });
    ok(true, 'bad link');
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
