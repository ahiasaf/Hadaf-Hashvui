// חוברות חנוכה (8.99.533 — שכבה ← כיתות עם הר"מים) — העמוד מול apps-script.gs בזיכרון (Playwright, טלפון).
// NODE_PATH=$(npm root -g) node tools/chntest/page.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
var SHOT = process.env.SHOT || '';
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function world(open) {
  var W = M.makeWorld(), c = W.ctx;
  c.sheet_('תלמידי הרשת').getRange(1, 1, 4, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'],
    ['lapid', 'ז', '3', 'א', 'ב'], ['lapid', 'ז', '3', 'ג', 'ד'], ['lapid', 'ח', '1', 'ה', 'ו']]);
  c.sheet_('תלמידי בית הספר').getRange(1, 1, 4, 4).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'שם'],
    ['lapid', 'ז׳', '3', 'א ב'], ['lapid', 'ז׳', '3', 'ג ד'], ['lapid', 'ז׳', '3', 'ה ו']]);
  c.doPost({ postData: { contents: JSON.stringify({ action: 'chnrams', key: 'k',
    t: "ז'3 – ר\"ם בדיקה\nח'1 – ר\"ם שני\nז'6\nיא'2 – ר\"ם שלישי" }) } });
  if (open) W.props.CHN_CLOSE = new Date(Date.now() + 3 * 86400000).toISOString();
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
        /\.webp$/.test(f) ? 'image/webp' : /\.png$/.test(f) ? 'image/png' : 'application/octet-stream');
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
    } else {
      if (opt.failCls && u.searchParams.get('chn') === 'cls' && u.searchParams.get('y')) return rt.abort();
      var P = {}; u.searchParams.forEach(function (v, k) { P[k] = v; }); out = W.ctx.doGet({ parameter: P }).t;
    }
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + url);
  return p;
}
function tabRows(W) { var s = W.priv.getSheetByName('חוברות חנוכה'); return s ? s.d.slice(1) : []; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    // 1. שכבה ← רשימת הכיתות עם הר"מים ← בחירה ← הזמנה
    var W = world(false), p = await page(b, port, W, '/chanuka');
    await p.waitForSelector('#grs [data-g="ז"]');
    var gl = await p.$$eval('#grs button', function (a) { return a.map(function (x) { return x.textContent; }); });
    ok(gl.join(',') === 'ז׳,ח׳,ט׳,י׳,י״א', 'grades ז–יא, no יב', gl);
    ok(await p.isHidden('#clsStep') && await p.isHidden('#more'), 'only grades at start');
    if (SHOT) await p.screenshot({ path: SHOT + '/0-grades.png', fullPage: true });
    await p.click('#grs [data-g="ז"]');
    var rows = await p.$$eval('.cr', function (a) { return a.map(function (x) { return x.textContent; }); });
    ok(rows.length === 7 && /ז׳3/.test(rows[2]) && /ר"ם בדיקה/.test(rows[2]) && !/תלמידים/.test(rows[2]), 'class row: class + ram, no count', rows);
    ok(rows[0] === 'ז׳1‹' && /ז׳6/.test(rows[5]), 'known classes listed, no duplicate label', rows);
    if (SHOT) await p.screenshot({ path: SHOT + '/1-list.png', fullPage: true });
    await p.click('.cr[data-c="ז|3"]');
    ok(await p.isHidden('#pickStep') && /ר"ם בדיקה/.test(await p.textContent('#who')), 'order screen with class + ram');
    await p.click('#qP');
    ok(await p.inputValue('#f-b') === '4', 'stepper +');
    await p.click('#qM');
    ok(await p.inputValue('#f-b') === '3', 'books prefilled (max of lists)');
    ok(await p.isHidden('#due'), 'no deadline line when open-ended');
    await p.click('#go');
    ok(!(await p.isHidden('#ynErr')), 'yes/no required');
    await p.click('#yY');
    await p.fill('#f-b', '4');
    ok(/4 ספרי לימוד · 4 חוברות תרגול/.test(await p.textContent('#sum')), 'summary');
    if (SHOT) await p.screenshot({ path: SHOT + '/2-sum.png', fullPage: true });
    await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/ז׳3: 4 ספרי לימוד · 4 חוברות תרגול/.test(await p.textContent('#okB')), 'confirmation from server', await p.textContent('#okB'));
    if (SHOT) await p.screenshot({ path: SHOT + '/3-ok.png', fullPage: true });
    var tr = tabRows(W);
    ok(tr.length === 1 && tr[0].indexOf('ר"ם בדיקה') >= 0, 'one row, ram name from list');
    // שינוי ושליחה חוזרת מאותו מכשיר — עדכון
    await p.reload(); await p.waitForSelector('#grs [data-g="ז"]');
    await p.click('#grs [data-g="ז"]'); await p.click('.cr[data-c="ז|3"]');
    await p.click('#chg');
    await p.waitForSelector('#pickStep:not([hidden])');
    ok((await p.$$('.cr')).length === 7, 'change returns to the list');
    await p.click('.cr[data-c="ז|3"]'); await p.click('#yN'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/בלי חוברות תרגול/.test(await p.textContent('#okB')) && tabRows(W).length === 1, 'update, still one row');
    await p.context().close();

    // 2. מכשיר אחר לאותה כיתה — לבירור
    p = await page(b, port, W, '/chanuka');
    await p.waitForSelector('#grs [data-g="ז"]'); await p.click('#grs [data-g="ז"]'); await p.click('.cr[data-c="ז|3"]');
    await p.click('#yY'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(!(await p.isHidden('#okA')) && tabRows(W).length === 2, 'second requester → ask');
    await p.context().close();

    // 2ב. בלי רשימת ר"מים בגיליון — י״א עדיין מראה את הכיתות 1–6
    var W0 = world(false); W0.ss = W0.ss || null;
    p = await page(b, port, W0, '/chanuka');
    await p.waitForSelector('#grs [data-g="יא"]'); await p.click('#grs [data-g="יא"]');
    ok((await p.$$('.cr')).length === 6, 'יא shows 6 classes');
    await p.context().close();

    // 3. י״א — בלי מספר תלמידים: אין שדה כמות
    p = await page(b, port, W, '/chanuka');
    await p.waitForSelector('#grs [data-g="יא"]'); await p.click('#grs [data-g="יא"]');
    await p.click('.cr[data-c="יא|2"]');
    ok(await p.isHidden('#bBox'), 'no quantity field for class without count');
    await p.click('#yY');
    ok(/יוזמנו: ספרי לימוד · חוברות תרגול/.test(await p.textContent('#sum')), 'summary without numbers');
    if (SHOT) await p.screenshot({ path: SHOT + '/4-ya.png', fullPage: true });
    await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/י״א 2: ספרי לימוד · חוברות תרגול/.test(await p.textContent('#okB')), 'saved without qty', await p.textContent('#okB'));
    await p.context().close();

    // 4. הכיתות לא נטענו — מספר כיתה וכמות ביד, בלי אפס
    p = await page(b, port, W, '/chanuka', { failCls: true });
    await p.waitForSelector('#grs [data-g="ח"]'); await p.click('#grs [data-g="ח"]');
    await p.waitForSelector('#f-k');
    ok(/לא הצלחנו לטעון/.test(await p.textContent('#clsBox')), 'list failure shown');
    ok(await p.inputValue('#f-b') === '' && !(await p.isHidden('#bBox')), 'failure → qty field, empty');
    await p.context().close();

    // 5. כשל שמירה — הפרטים נשארים, "לשלוח שוב" לא יוצר כפילות
    var W2 = world(true);
    p = await page(b, port, W2, '/chanuka', { dropPost: 2 });
    await p.waitForSelector('#grs [data-g="ח"]'); await p.click('#grs [data-g="ח"]'); await p.click('.cr[data-c="ח|1"]'); await p.click('#yY');
    ok(/ההדפסה רק למי שהזמין עד/.test(await p.textContent('#due')), 'deadline note when set');
    await p.click('#go');
    await p.waitForSelector('#st:not([hidden])', { timeout: 40000 });
    ok(/לא נשמר/.test(await p.textContent('#stT')) && tabRows(W2).length === 0, 'failure, nothing saved');
    await p.click('#re');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(tabRows(W2).length === 1, 'retry saved once');
    await p.context().close();

    // 6. אחרי הסגירה
    W2.props.CHN_CLOSE = new Date(Date.now() - 60000).toISOString();
    p = await page(b, port, W2, '/chanuka');
    await p.waitForFunction(function () { return !document.getElementById('msg').hidden && /נסגרו/.test(document.getElementById('msg').textContent); });
    ok(await p.isHidden('#f'), 'closed: no form');
    await p.context().close();

    // 7. קישור בדיקה — לא נספר
    var W3 = world(false);
    p = await page(b, port, W3, '/chanuka?tst=1');
    await p.waitForSelector('#grs [data-g="ז"]');
    ok(!(await p.isHidden('#tstTag')), 'test tag');
    await p.click('#grs [data-g="ז"]'); await p.click('.cr[data-c="ז|3"]'); await p.click('#yN'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(JSON.parse(String(W3.ctx.doGet({ parameter: { chn: 'adm', key: 'k' } }).t)).rows.length === 0, 'test not in real admin');
    await p.context().close();
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
})();
