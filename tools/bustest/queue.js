// צמאה — אוטובוסים, התור במכשיר (8.99.617): שישה רבנים מסמנים יחד, שרת עסוק, נפילות רשת, אין קליטה,
// רענון באמצע, סימון-ביטול מהיר. שום סימון לא אובד, ולחיצות רצופות יוצאות בבקשות מעטות. נתונים מומצאים.
// NODE_PATH=$(npm root -g) node tools/bustest/queue.js
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var AB = 'אבגדהוזחטיכלמנסעפצקרשת';
function nm(i) { return 'תלמיד ' + AB.charAt(i % 22) + AB.charAt(Math.floor(i / 22) % 22); }
function rav(b) { return 'רב ' + AB.charAt(b); }
var BUSES = 6, PER = 10;
function world() {
  var W = M.makeWorld(), c = W.ctx;
  c.TZM_CLOSED_ = false;
  var tz = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t), ch = [];
  for (var i = 0; i < BUSES * PER; i++) ch.push({ g: 'ח', c: '2', n: nm(i), on: 1 });
  c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: tz.k, by: 'x', ch: ch }) } });
  var ad = JSON.parse(c.doGet({ parameter: { bus: 'adm', w: 'adm', key: 'k' } }).t);
  c.doGet({ parameter: { bus: 'st', w: 'adm', key: 'k' } });
  var bt = W.priv.getSheetByName('צמאה — אוטובוסים');
  for (var b = 1; b <= BUSES; b++) bt.getRange(b + 1, 2).setValue(rav(b));
  c.busBust_();
  for (i = 0; i < BUSES * PER; i++) c.doGet({ parameter: { bus: 'set', w: 'adm', key: 'k', k: 's|ח|2|' + nm(i), f: 'b', v: String(1 + Math.floor(i / PER)) } });
  W.ad = ad;
  return W;
}
function srv() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var p = decodeURIComponent(q.url.split('?')[0]);
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
      r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream');
      r.end(fs.readFileSync(f));
    }).listen(0, function () { res(s); });
  });
}
/* NET.mode: 'ok' · 'off' (אין קליטה) · 'flaky' (כל שלישית נופלת, כל רביעית "עסוק") */
var NET = { mode: 'ok', cnt: 0, batch: 0 };
async function page(b, port, W, url) {
  var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
  /* מסך ההסבר של רב האוטובוס נבדק ב-intro.js — כאן מדלגים עליו. */
  await ctx.addInitScript(function () { try { localStorage.setItem('df:busIntro:' + new URLSearchParams(location.search).get('x'), '1'); } catch (e) {} });
  await ctx.route(/script\.google\.com/, async function (rt) {
    var u = new URL(rt.request().url()), P = {};
    u.searchParams.forEach(function (v, k) { P[k] = v; });
    if (NET.mode === 'off') return rt.abort();
    NET.cnt++;
    if (NET.mode === 'flaky' && NET.cnt % 3 === 0) return rt.abort();
    if (P.bus === 'batch') NET.batch++;
    var out = NET.mode === 'flaky' && P.bus === 'batch' && NET.cnt % 4 === 0 ? '{"status":"busy"}' : W.ctx.doGet({ parameter: P }).t;
    await new Promise(function (r) { setTimeout(r, 150); });
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + url);
  return p;
}
function qLen(p) {
  return p.evaluate(function () {
    var t = 0;
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('df:busQ:') === 0) t += JSON.parse(localStorage.getItem(k) || '[]').length; }
    return t;
  });
}
async function qEmpty(p, ms) {
  var t0 = Date.now();
  while (Date.now() - t0 < (ms || 60000)) { if (!(await qLen(p))) return true; await p.waitForTimeout(250); }
  return false;
}
function arrived(W) {
  var d = W.priv.getSheetByName('צמאה — שיבוץ').d, m = {};
  d.slice(1).forEach(function (r) { if (r[6]) m[r[0]] = 1; });
  return m;
}
(async function () {
  var s = await srv(), port = s.address().port, br = await pw.chromium.launch();
  try {
    var W = world(), ad = W.ad, P = [];
    for (var b = 1; b <= BUSES; b++) {
      var p = await page(br, port, W, '/bus?w=b&x=' + ad.b);
      await p.waitForSelector('[data-me]');
      await p.click('[data-me="' + (b - 1) + '"]');
      await p.waitForSelector('[data-h]');
      P.push(p);
    }
    ok((await P[2].textContent('#app')).indexOf(nm(2 * PER)) >= 0, 'bus 3 rav sees own list');
    // 1) רשת לא יציבה + שרת עסוק: שישה רבנים מסמנים יחד
    NET.mode = 'flaky'; NET.batch = 0;
    await Promise.all(P.map(async function (p, bi) {
      for (var i = 0; i < PER; i++) await p.click('[data-h="s|ח|2|' + nm(bi * PER + i) + '"]');
    }));
    var shown = await Promise.all(P.map(function (p) { return p.$$eval('.hb.on', function (x) { return x.length; }); }));
    ok(shown.every(function (x) { return x === PER; }), 'all marks shown at once', shown);

    var allE = await Promise.all(P.map(function (p) { return qEmpty(p); }));
    ok(allE.every(Boolean), 'queues drained', allE);

    var A = arrived(W);
    ok(Object.keys(A).length === BUSES * PER, 'every mark written', Object.keys(A).length);
    ok(NET.batch < BUSES * PER, 'batched (fewer requests than taps)', NET.batch);
    // 2) אין קליטה: סימון וביטול, רענון — עדיין על המסך; הקליטה חוזרת — נכתב
    NET.mode = 'off';
    var p1 = P[0];
    await p1.click('[data-h="s|ח|2|' + nm(0) + '"]');   // ביטול
    await p1.click('[data-h="s|ח|2|' + nm(1) + '"]');   // ביטול
    await p1.click('[data-h="s|ח|2|' + nm(1) + '"]');   // שוב מסומן
    ok(await qLen(p1) === 2, 'offline: queue holds latest per person', await qLen(p1));
    ok(!(await p1.$('#say')) || !(await p1.textContent('#say')), 'offline: no error message');
    await p1.reload();
    await p1.waitForSelector('[data-h]', { timeout: 20000 }).catch(function () {});
    ok(await qLen(p1) === 2, 'queue survives reload');
    NET.mode = 'ok';
    await p1.reload();
    await p1.waitForSelector('[data-h]');
    ok(await qEmpty(p1), 'drained after network back');
    A = arrived(W);
    ok(!A['s|ח|2|' + nm(0)] && A['s|ח|2|' + nm(1)], 'final state = last tap', [A['s|ח|2|' + nm(0)], A['s|ח|2|' + nm(1)]]);
    ok(!(await p1.$('[data-h="s|ח|2|' + nm(0) + '"].on')) && !!(await p1.$('[data-h="s|ח|2|' + nm(1) + '"].on')), 'screen matches');
    // 3) שעת העלייה לא נדרסת בשליחה חוזרת
    var d = W.priv.getSheetByName('צמאה — שיבוץ').d, r5 = d.filter(function (r) { return r[0] === 's|ח|2|' + nm(5); })[0], t5 = r5[6];
    var rr = JSON.parse(W.ctx.doGet({ parameter: { bus: 'batch', w: 'b', x: ad.b, ops: JSON.stringify([['s|ח|2|' + nm(5), 'h', '1', 0, 1]]) } }).t);
    ok(rr.status === 'ok' && rr.res[0] === 'ok' && r5[6] === t5, 'resend keeps arrival time', rr);
    // 4) הרשאות בשליחה המרוכזת
    rr = JSON.parse(W.ctx.doGet({ parameter: { bus: 'batch', w: 'b', x: ad.b, ops: JSON.stringify([['s|ח|2|' + nm(5), 'h', '0', 0, 2], ['s|ח|2|' + nm(5), 'b', '3', 0, 1], ['', 'full', '1', 0, 1], ['x', 'h', '1', 0, 1]]) } }).t);
    ok(rr.res.join() === 'denied,denied,ok,none', 'batch roles', rr);
    rr = JSON.parse(W.ctx.doGet({ parameter: { bus: 'batch', w: 'p', x: ad.p, ops: JSON.stringify([['', 'full', '1', 0, 1]]) } }).t);
    ok(rr.res[0] === 'denied', 'p cannot full');
    ok(JSON.parse(W.ctx.doGet({ parameter: { bus: 'batch', w: 'a', x: 'bad', ops: '[]' } }).t).status === 'denied', 'bad link');
    // 5) המנהל רואה בזמן אמת את כל השישה
    var pa = await page(br, port, W, '/bus?w=a&x=' + ad.a);
    await pa.waitForSelector('[data-tab]');
    ok((await pa.textContent('[data-tab="3"]')).indexOf('עלו ' + PER + '/') >= 0, 'manager live count', await pa.textContent('[data-tab="3"]'));
  } catch (e) { fails++; console.log('ERR', e.message); }
  await br.close(); s.close();
  console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
