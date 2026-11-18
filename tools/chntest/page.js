// חוברות חנוכה (8.99.530) — העמוד מול apps-script.gs בזיכרון (Playwright, טלפון).
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
  if (opt.staff) await ctx.addInitScript(function (m) { localStorage.setItem('df:ram', JSON.stringify(m)); }, opt.staff);
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + url);
  return p;
}
function tabRows(W) { var s = W.priv.getSheetByName('חוברות חנוכה'); return s ? s.d.slice(1) : []; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    // 1. לפני שנקבע מועד — סגור
    var W = world(false), p = await page(b, port, W, '/chanuka?inst=lapid');
    await p.waitForFunction(function () { return !document.getElementById('msg').hidden && !/טוען/.test(document.getElementById('msg').textContent); });
    ok(/עוד לא נפתחו/.test(await p.textContent('#msg')), 'not yet open');
    ok(await p.isHidden('#f'), 'no form before deadline');
    await p.context().close();

    // 2. פתוח, ישיבה בקישור, ר"ם לא מוכר — המסלול המלא
    W = world(true); p = await page(b, port, W, '/chanuka?inst=lapid');
    await p.waitForSelector('#f-c');
    ok(/ישיבת לפיד/.test(await p.textContent('#instBox')), 'inst fixed from link');
    var opts = await p.$$eval('#f-c option', function (a) { return a.map(function (o) { return o.textContent; }); });
    ok(opts.some(function (t) { return /ז׳3 · 3 תלמידים/.test(t); }), 'overlap shown as max 3', opts);
    ok(await p.isHidden('#more'), 'rest hidden until class');
    await p.selectOption('#f-c', 'ז|3');
    ok(await p.inputValue('#f-b') === '3', 'books prefilled from list');
    await p.fill('#f-n', 'ר"ם בדיקה');
    if (SHOT) await p.screenshot({ path: SHOT + '/1-form.png', fullPage: true });
    await p.click('#go');
    ok(!(await p.isHidden('#ynErr')), 'yes/no required');
    ok(tabRows(W).length === 0, 'nothing sent without yes/no');
    await p.click('#yY');
    ok(/3 ספרי לימוד · 3 חוברות תרגול/.test(await p.textContent('#sum')), 'summary both numbers');
    ok(/ההדפסה רק למי שהזמין עד/.test(await p.textContent('#due')), 'deadline note');
    await p.fill('#f-b', '4');
    ok(/4 ספרי לימוד · 4 חוברות תרגול/.test(await p.textContent('#sum')), 'correction updates summary');
    if (SHOT) await p.screenshot({ path: SHOT + '/2-sum.png', fullPage: true });
    await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/נקלטה/.test(await p.textContent('#okH')), 'confirmation');
    ok(/ז׳3: 4 ספרי לימוד · 4 חוברות תרגול/.test(await p.textContent('#okB')), 'confirmation from server', await p.textContent('#okB'));
    ok(tabRows(W).length === 1, 'one row');
    if (SHOT) await p.screenshot({ path: SHOT + '/3-ok.png', fullPage: true });
    // רענון ושליחה חוזרת מאותו מכשיר — עדכון, לא שורה נוספת
    await p.reload(); await p.waitForSelector('#f-c');
    await p.selectOption('#f-c', 'ז|3'); await p.fill('#f-n', 'ר"ם בדיקה'); await p.click('#yN'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/בלי חוברות תרגול/.test(await p.textContent('#okB')), 'update without practice');
    ok(tabRows(W).length === 1, 'still one row after resend');
    await p.context().close();

    // 3. מכשיר אחר לאותה כיתה — לבירור
    p = await page(b, port, W, '/chanuka?inst=lapid');
    await p.waitForSelector('#f-c'); await p.selectOption('#f-c', 'ז|3'); await p.fill('#f-n', 'ר"ם אחר');
    await p.click('#yY'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(!(await p.isHidden('#okA')), 'second requester sees "לבירור" note');
    ok(tabRows(W).length === 2, 'separate ask row');
    await p.context().close();

    // 4. ר"ם מוכר במכשיר — שם וכיתה מתמלאים, בלי בחירת ישיבה
    p = await page(b, port, W, '/chanuka', { staff: { id: 'Dram1', first: 'שם', last: 'משפחה', inst: 'lapid', grade: 'ח׳', klass: '1' } });
    await p.waitForSelector('#f-c');
    ok(await p.inputValue('#f-c') === 'ח|1', 'staff class preselected');
    ok(await p.inputValue('#f-n') === 'שם משפחה', 'staff name prefilled');
    ok(await p.inputValue('#f-b') === '1', 'books for staff class');
    await p.context().close();

    // 5. בלי ישיבה בקישור — בחירת ישיבה, ישיבה בלי רשימה → ידני, בלי אפס
    p = await page(b, port, W, '/chanuka');
    await p.waitForSelector('#f-y');
    await p.selectOption('#f-y', 'givat');
    await p.waitForSelector('#f-g');
    ok(await p.inputValue('#f-b') === '', 'no list → empty, not zero');
    ok(/אין לנו רשימה/.test(await p.textContent('#booksH')), 'no list hint');
    await p.selectOption('#f-g', 'יא'); await p.fill('#f-k', '2'); await p.fill('#f-n', 'ר"ם ג');
    await p.click('#go');
    ok(tabRows(W).length === 2, 'no send without count');
    await p.fill('#f-b', '30'); await p.click('#yN'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(/י״א 2: 30 ספרי לימוד/.test(await p.textContent('#okB')), 'manual class saved', await p.textContent('#okB'));
    await p.context().close();

    // 6. קריאת הכיתות נכשלה — הודעה והזנה ידנית
    p = await page(b, port, W, '/chanuka?inst=lapid', { failCls: true });
    await p.waitForSelector('#f-g');
    ok(/לא הצלחנו לטעון/.test(await p.textContent('#clsBox')), 'list failure shown');
    ok(await p.inputValue('#f-b') === '', 'failure → no number invented');
    await p.context().close();

    // 7. כשל שמירה — הפרטים נשארים, "לשלוח שוב" לא יוצר כפילות
    var W2 = world(true);
    p = await page(b, port, W2, '/chanuka?inst=lapid', { dropPost: 2 });
    await p.waitForSelector('#f-c'); await p.selectOption('#f-c', 'ח|1'); await p.fill('#f-n', 'ר"ם ד'); await p.click('#yY');
    await p.click('#go');
    await p.waitForSelector('#st:not([hidden])', { timeout: 40000 });
    ok(/לא נשמר/.test(await p.textContent('#stT')), 'failure message');
    ok(await p.inputValue('#f-n') === 'ר"ם ד', 'fields kept');
    ok(tabRows(W2).length === 0, 'nothing saved');
    await p.click('#re');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(tabRows(W2).length === 1, 'retry saved once');
    await p.context().close();

    // 8. אחרי הסגירה
    W2.props.CHN_CLOSE = new Date(Date.now() - 60000).toISOString();
    p = await page(b, port, W2, '/chanuka?inst=lapid');
    await p.waitForFunction(function () { return !document.getElementById('msg').hidden && /נסגרו/.test(document.getElementById('msg').textContent); });
    ok(await p.isHidden('#f'), 'closed: no form');
    await p.context().close();

    // 9. קישור בדיקה לפני מועד — פתוח, מסומן, ולא נספר
    var W3 = world(false);
    p = await page(b, port, W3, '/chanuka?inst=lapid&tst=1');
    await p.waitForSelector('#f-c');
    ok(!(await p.isHidden('#tstTag')), 'test tag');
    await p.selectOption('#f-c', 'ז|3'); await p.fill('#f-n', 'בדיקה'); await p.click('#yN'); await p.click('#go');
    await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
    ok(JSON.parse(String(W3.ctx.doGet({ parameter: { chn: 'adm', key: 'k' } }).t)).rows.length === 0, 'test not in real admin');
    await p.context().close();
  } catch (e) { fails++; console.log('ERR', e.message); }
  await b.close(); s.close();
  console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
})();
