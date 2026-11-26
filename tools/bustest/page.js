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
    await pp.waitForFunction(function () { return document.querySelectorAll('button.y.on').length === 1 && !document.querySelector('#say').textContent; });
    ok(await pp.$('.fl') === null, 'p mode: no flag beside name');
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
    ok((await pa.textContent('[data-tab="1"]')).indexOf('עלו 1/50') >= 0, 'live tab', await pa.textContent('[data-tab="1"]'));
    await pa.click('[data-tab="0"]');
    await pa.waitForSelector('[data-mv="s|ז|3|' + B + '"]');
    await pa.click('[data-mv="s|ז|3|' + B + '"][data-v="3"]');
    await pa.waitForFunction(function () { return !document.querySelector('[data-mv]') || document.querySelectorAll('[data-tab]').length; });
    await pa.waitForTimeout(800);
    await pa.click('[data-tab="3"]');
    await pa.waitForSelector('[data-mv="s|ז|3|' + B + '"]');
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
    // בריף v4: "עולה אחרון", מונה חי, אוטובוס מלא, העברה, אפור אצל הרב
    var st = W.priv.getSheetByName('צמאה — שיבוץ'), hd = st.d[0], ri = -1;
    st.d.forEach(function (r, i) { if (r[0] === 's|ז|3|' + A) ri = i; });
    ok(hd.indexOf('עולה אחרון') === 11 && hd.indexOf('הועבר מ') === 12, 'new headers', hd);
    W.ctx.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 's|ז|3|' + B, f: 'b', v: '1' } });
    st.getRange(ri + 1, 12).setValue('כן');
    W.ctx.doGet({ parameter: { bus: 'cfg', w: 'adm', key: 'k', cap: '2' } });
    W.ctx.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 'r|' + R1, f: 'h', v: '1' } });
    W.ctx.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 's|ז|3|' + A, f: 'h', v: '0' } });
    W.ctx.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 's|ז|3|' + B, f: 'h', v: '1' } });
    W.ctx.busBust_();
    var pa2 = await page(b, port, W, '/bus?w=a&x=' + ad.a);
    await pa2.waitForSelector('.full');
    ok((await pa2.textContent('.full .fh')) === 'אוטובוס 1 מלא', 'full banner');
    ok((await pa2.textContent('[data-tab="1"]')).indexOf('עלו 2/2') >= 0, 'live tab counter');
    ok((await pa2.textContent('.cnt')).indexOf('עלו 2 · מתוכנן 3 · פנויים 0') >= 0, 'live line', await pa2.textContent('.cnt'));
    ok((await pa2.textContent('.lh')) === 'משבצים רק אם נשאר מקום באוטובוס' && (await pa2.textContent('.lt')).indexOf('עולה אחרון') >= 0, 'last group in A');
    var ovb = await pa2.$('[data-ov="s|ז|3|' + A + '"]');
    ok(ovb && (await ovb.textContent()) === 'העברה לאוטובוס 2', 'move to first free bus');
    var pb2 = await page(b, port, W, '/bus?w=b&x=' + ad.b);
    await pb2.waitForSelector('[data-me]'); await pb2.click('[data-me="0"]');
    await pb2.waitForSelector('.lh');
    ok((await pb2.textContent('.lh')).indexOf('רק אם נשאר מקום') >= 0, 'last group in B');
    await ovb.click();
    await pa2.waitForFunction(function () { return !document.querySelector('[data-ov]') && !document.querySelector('#say').textContent; });
    ok(!!(await pa2.$('.full')), 'still full (boarded count unchanged)');
    var rw = st.d[ri];
    ok(rw[5] === '2' && rw[12] === '1', 'moved with from', rw);
    await pb2.waitForSelector('.row.gone', { timeout: 15000 });
    ok((await pb2.textContent('.row.gone')).indexOf('הועבר לאוטובוס 2') >= 0, 'grey at original rav');
    ok(await pb2.$('.row.gone .hb') === null, 'not markable');
    await pa2.click('[data-tab="2"]');
    await pa2.click('[data-mv="s|ז|3|' + A + '"][data-v="1"]');
    await pa2.waitForFunction(function () { return !document.querySelector('#say').textContent || true; });
    await pa2.waitForTimeout(600);
    ok(st.d[ri][12] === '', 'regular move clears from', st.d[ri]);
    // בריף v5: "מילאתי את האוטובוס" אצל הרב → מלא אצל המנהל, גם מתחת לקיבולת; איפוס מנקה, שחזור מחזיר
    W.ctx.doGet({ parameter: { bus: 'cfg', w: 'adm', key: 'k', cap: '50' } });
    await pa2.waitForFunction(function () { return !document.querySelector('.full'); }, null, { timeout: 15000 });
    await pb2.waitForSelector('.fbar .fullb:not(.on)', { timeout: 15000 });
    ok((await pb2.textContent('.fullb')) === 'מילאתי את האוטובוס', 'rav button');
    ok(await pb2.evaluate(function () { return getComputedStyle(document.querySelector('.fbar')).position === 'fixed'; }), 'button fixed');
    await pb2.click('.fullb');
    await pb2.waitForSelector('.fullb.on');
    await pa2.waitForSelector('.full', { timeout: 15000 });
    ok((await pa2.textContent('.full .fh')) === 'אוטובוס 1 מלא', 'manager sees full from rav');
    var bt = W.priv.getSheetByName('צמאה — אוטובוסים');
    ok(bt.d[0][3] === 'מלא' && String(bt.d[1][3]).indexOf(R1) >= 0, 'sheet full flag', bt.d[1]);
    await pb2.click('.rst'); await pb2.fill('#mI', 'אפס'); await pb2.click('#mYes');
    await pb2.waitForSelector('.fullb:not(.on)', { timeout: 15000 });
    ok(!bt.d[1][3], 'reset clears full');
    await pb2.waitForSelector('.undo'); await pb2.click('.undo');
    await pb2.waitForSelector('.fullb.on', { timeout: 15000 });
    ok(String(bt.d[1][3]).indexOf(R1) >= 0, 'undo restores full');
    await pb2.click('.fullb');
    await pb2.waitForSelector('.fullb:not(.on)', { timeout: 15000 });
    ok(!bt.d[1][3], 'second tap unmarks');
    ok(await pb2.$('[data-mv]') === null, 'rav cannot move');
    var bad = await page(b, port, W, '/bus?w=a&x=nope');
    await bad.waitForFunction(function () { return /אינו תקין/.test(document.querySelector('#msg').textContent); });
    ok(true, 'bad link');
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
