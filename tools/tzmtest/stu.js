// קישור התלמידים לצמאה (8.99.582) — בקשה → אישור כיתה בניהול → מופיעה לר"ם. מול apps-script.gs בזיכרון.
// NODE_PATH=$(npm root -g) node tools/tzmtest/stu.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
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

function G(W, P) { return JSON.parse(W.ctx.doGet({ parameter: P }).t); }
function rows(W) { var s = W.priv.getSheetByName('צמאה — רישום'); return s ? s.d.slice(1) : []; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var W = world();
    var adm = G(W, { tzm: 'adm', key: 'k' });
    ok(adm.status === 'ok' && adm.sk && adm.sk !== adm.k && adm.pq.length === 0, 'admin has student key', adm);
    ok(G(W, { tzm: 'scls', s: 'bad' }).status === 'denied' && G(W, { tzm: 'scls', s: adm.k }).status === 'denied', 'wrong key denied');
    ok(G(W, { tzm: 'cls', k: adm.sk }).status === 'denied', 'student key is not coordinator key');
    ok(G(W, { tzm: 'sok', g: 'ז', c: '3' }).status === 'denied', 'approve needs READ_KEY');
    var p = await page(b, port, W, '/tzama?s=' + adm.sk);
    await p.waitForSelector('#grs [data-g="ז"]', { timeout: 20000 });
    ok(await p.isHidden('#byCard') && await p.isVisible('#info'), 'no name step, event info shown');
    await p.click('#grs [data-g="ז"]'); await p.click('#clsBox [data-c="3"]');
    if (SHOT) await p.screenshot({ path: SHOT + '/stu1.png', fullPage: false });
    await p.click('#stuBox [data-n="אלף בית"]');
    await p.waitForSelector('#gok.on', { timeout: 20000 });
    ok(/אלף בית/.test(await p.textContent('#gokN')), 'green screen with the name');
    if (SHOT) await p.screenshot({ path: SHOT + '/stu-green.png', fullPage: false });
    await p.waitForSelector('#gok:not(.on)', { state: 'attached', timeout: 5000 });
    await p.waitForSelector('.sok', { timeout: 20000 });
    ok(rows(W).length === 1, 'tap = one request', rows(W));
    ok(/אלף בית/.test(await p.textContent('.sok')), 'sent confirmation');
    ok(await p.isHidden('#grs'), 'grade choice hidden after sending');
    // אותו טלפון — כניסה חוזרת: רק ה-✓
    await p.reload();
    await p.waitForSelector('.sok', { timeout: 20000 });
    ok(/אלף בית/.test(await p.textContent('.sok')) && await p.isHidden('#grs') && !(await p.$('[data-n]')), 'same phone — only the ✓');
    // אחר — לא יכול לבטל בלי האסימון
    ok(G(W, { tzm: 'scan', s: adm.sk, g: 'ז', c: '3', n: 'אלף בית', tk: 'zzz' }).status === 'denied', 'cancel needs the token');
    // "שינוי" → ביטול · 4 → בוטל, ואפשר לבחור מחדש
    
    await p.click('#schg');
    await p.waitForTimeout(5500);
    await p.waitForSelector('#grs [data-g="ז"]', { timeout: 20000 });
    ok(rows(W).filter(function (x) { return x[5] === 'אלף בית'; })[0][1] === 'בוטל', 'own cancel → בוטל', rows(W));
    ok(await p.isVisible('#grs') && !(await p.$('.sok')), 'choice open again');
    await p.click('#clsBox [data-c="3"]').catch(function () {});
    await p.click('#stuBox [data-n="גימל דלת"]');
    await p.waitForSelector('.sok', { timeout: 20000 });
    ok(/גימל דלת/.test(await p.textContent('.sok')), 'new pick after change');
    ok(/מחכה לאישור של הרב/.test(await p.textContent('.sok')) && /תלויה באישור/.test(await p.textContent('.sok')), 'pending status shown', await p.textContent('.sok'));
    ok(rows(W).filter(function (x) { return x[5] === 'גימל דלת'; })[0][1] === 'בקשה ממתינה', 'new pending');
    // ביטול חזרה של אלף בית לפני שעוברים הלאה — שהבדיקות שאחר כך יעבדו על אותה כיתה
    G(W, { tzm: 'sreq', s: adm.sk, g: 'ז', c: '3', n: 'אלף בית' });
    // שם שלא ברשימה
    var p2 = await page(b, port, W, '/tzama?s=' + adm.sk);
    await p2.waitForSelector('#grs [data-g="ח"]');
    await p2.click('#grs [data-g="ח"]'); await p2.click('#clsBox [data-c="2"]');
    await p2.fill('#addN', 'תלמיד חדש'); await p2.click('#addB');
    await p2.waitForSelector('.sok', { timeout: 20000 });
    var r = rows(W);
    ok(r.length === 3 && r.every(function (x) { return x[1] === 'בקשה ממתינה' && x[7] === 'קישור תלמידים'; }), 'pending rows', r);
    var cls = G(W, { tzm: 'cls', k: adm.k });
    ok(cls.rq.length === 0 && cls.reg.length === 0, 'coordinator does not see pending', cls.rq);
    var a2 = G(W, { tzm: 'adm', key: 'k' });
    ok(a2.pq.length === 3, 'admin sees pending', a2.pq);
    // שליחה חוזרת — אותה שורה
    ok(G(W, { tzm: 'sreq', s: adm.sk, g: 'ז', c: '3', n: 'אלף בית' }).st === 'q' && rows(W).length === 3, 'repeat request — no new row');
    // אישור כיתה ז3 בלבד
    var ap = G(W, { tzm: 'sok', key: 'k', g: 'ז', c: '3' });
    ok(ap.status === 'ok' && ap.n === 2 && ap.pq.length === 1 && ap.rq.length === 2, 'approve class', ap);
    var cls2 = G(W, { tzm: 'cls', k: adm.k });
    ok(cls2.rq.length === 2, 'coordinator sees approved class only', cls2.rq);
    var c = await page(b, port, W, '/tzama?k=' + adm.k);
    await c.waitForSelector('#byCard:not([hidden])');
    await c.fill('#by', 'רכז'); await c.click('#byGo');
    await c.click('#grs [data-g="ז"]'); await c.click('#clsBox [data-c="3"]');
    var t = await c.textContent('#stuBox');
    ok(/ביקש להירשם/.test(t), 'coordinator page shows request', t);
    await p.reload(); await p.waitForSelector('.sok .sst', { timeout: 20000 });
    ok(/מחכה לאישור/.test(await p.textContent('.sok')), 'after class approval — still waiting for the rav');
    await c.click('#stuBox .row:nth-child(1)'); await c.click('#stuBox .row:nth-child(2)'); await c.click('#go');
    await c.waitForSelector('#bs.ok', { timeout: 20000 });
    ok(G(W, { tzm: 'adm', key: 'k' }).reg.length === 2, 'coordinator registered');
    await p.reload(); await p.waitForFunction(function () { var e = document.querySelector('.sok'); return e && /רשום לצמאה/.test(e.textContent); }, null, { timeout: 20000 });
    ok(!/מחכה/.test(await p.textContent('.sok')), 'student sees registered', await p.textContent('.sok'));
    if (SHOT) await p.screenshot({ path: SHOT + '/stu-reg.png' });
    ok(G(W, { tzm: 'sst', s: adm.sk, g: 'ז', c: '3', n: 'גימל דלת', tk: 'zzz' }).status === 'denied', 'status needs the token');
    ok(G(W, { tzm: 'sst', s: 'bad', g: 'ז', c: '3', n: 'גימל דלת' }).status === 'denied', 'status needs the student key');
    ok(G(W, { tzm: 'sst', s: adm.sk, g: 'ז', c: '4', n: 'אין כזה' }).st === 'off', 'unknown → off');
  } catch (e) { fails++; console.log('ERR', e && e.stack); }
  await b.close(); s.close();
  console.log((n - fails) + '/' + n + ' passed');
  process.exit(fails ? 1 : 0);
})();
