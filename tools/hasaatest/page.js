// הצהרת התלמיד (8.99.491) — העמוד מול apps-script.gs בזיכרון (Playwright).
// NODE_PATH=$(npm root -g) node tools/hasaatest/page.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), crypto = require('crypto'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function world(withZk) {
  var W = M.makeWorld(), c = W.ctx;
  c.Utilities.DigestAlgorithm = { SHA_256: 'sha256', MD5: 'md5', SHA_1: 'sha1' };
  c.Utilities.Charset = { UTF_8: 'utf8' };
  c.Utilities.computeDigest = function (alg, s) {
    return Array.prototype.map.call(crypto.createHash(alg).update(String(s), 'utf8').digest(), function (b) { return b > 127 ? b - 256 : b; });
  };
  [['DAAA1', 'אבי', 'כהן'], ['DBBB2', 'בני', 'לוי']].forEach(function (x) {
    c.appendCols_('לומדים', [['מזהה', x[0]], ['שם', x[1]], ['משפחה', x[2]], ['קוד ישיבה', 'lapid'], ['תפקיד', 'תלמיד']]);
  });
  var L = c.sheet_('לימוד'); L.d.push(['תאריך', 'מזהה', 'קוד ישיבה', 'מסלול', 'שבוע', 'דף', 'קטע', 'מתוך']);
  var heb = ['', '', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל', 'לא'];
  for (var d = 2; d <= 31; d++) L.d.push([new Date(), 'DAAA1', 'lapid', 'taanit', d, heb[d], '', '']);
  if (withZk) {
    var Z = W.priv.insertSheet('זכאויות');
    Z.d.push(['מזהה', 'שם מלא', 'ציון', 'מסכתות', 'מספר פרסים']);
    Z.d.push(['DAAA1', '', '95', '', '2']);
    Z.d.push(['', 'זאב גל', '90', 'ברכות', '1']);
    Z.d.push(['', 'בני לוי', '', '', '']);
  }
  return W;
}
function srv() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
      r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream');
      r.end(fs.readFileSync(f));
    }).listen(0, function () { res(s); });
  });
}
async function page(b, port, W, fail) {
  var ctx = await b.newContext({ serviceWorkers: 'block' });
  await ctx.route(/script\.google\.com/, function (rt) {
    var rq = rt.request(), u = new URL(rq.url());
    if (fail && u.searchParams.get('hasaa') === 'roster') return rt.abort();
    var out;
    if (rq.method() === 'POST') out = W.ctx.doPost({ postData: { contents: rq.postData() } }).t;
    else { var P = {}; u.searchParams.forEach(function (v, k) { P[k] = v; }); out = W.ctx.doGet({ parameter: P }).t; }
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { console.log('PAGEERR', e.message); fails++; });
  await p.goto('http://localhost:' + port + '/hasaa.html?y=lapid');
  return p;
}
function optTexts(p, sel) {
  return p.$$eval(sel + ' option', function (os) { return os.filter(function (o) { return o.value !== ''; }).map(function (o) { return o.textContent; }); });
}
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  var W = world(true), p = await page(b, port, W);
  await p.waitForFunction(function () { return document.querySelectorAll('#f-nsel option').length > 1; });
  var nm = await optTexts(p, '#f-nsel');
  ok(nm.join('|') === 'אבי כהן|בני לוי|זאב גל', 'names', nm);
  // בלי זכאות (בני) — כל הפרסים, צירוף לא חובה
  await p.selectOption('#f-nsel', { label: 'בני לוי' });
  await p.waitForTimeout(400);
  ok((await optTexts(p, '#f-p1a')).length === 37, 'unlimited: all 37');
  ok(await p.$eval('#f-p1b', function (e) { return !e.hidden && !e.required; }), 'unlimited: second optional');
  ok(await p.$eval('#due', function (e) { return e.hidden; }), 'no due line');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'בני לוי', 'signature autofill');
  // אבי — שני פרסים, תענית הושלמה
  await p.selectOption('#f-nsel', { label: 'אבי כהן' });
  await p.waitForFunction(function () { return !document.getElementById('due').hidden; });
  ok(await p.$eval('#due', function (e) { return e.textContent; }) === 'מגיע לך: שני פרסים', 'due 2');
  ok(await p.$eval('#f-m1', function (e) { return e.value; }) === 'תענית', 'masechet filled');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'אבי כהן', 'signature follows name');
  var o = await optTexts(p, '#f-p1a');
  ok(o.length === 21 && o.some(function (t) { return /^23\./.test(t); }) && o.some(function (t) { return /^8\./.test(t); }) &&
     !o.some(function (t) { return /^1\./.test(t) || /^29\./.test(t); }), 'due 2: lists ב+ג only', o.length);
  ok(await p.$eval('#f-p1b', function (e) { return e.hidden; }), 'second hidden before pick');
  await p.selectOption('#f-p1a', { label: o.filter(function (t) { return /^8\./.test(t); })[0] });
  ok(await p.$eval('#f-p1b', function (e) { return !e.hidden && e.required; }), 'list ב pick → second required');
  var o2 = await optTexts(p, '#f-p1b');
  ok(o2.length === 15 && /^8\./.test(o2[0]), 'second = list ב', o2.length);
  await p.selectOption('#f-p1b', { label: o2[2] });
  var g = o.filter(function (t) { return /^23\./.test(t); })[0];
  await p.selectOption('#f-p2a', { label: g });
  ok(await p.$eval('#f-p2b', function (e) { return e.hidden; }), 'list ג pick → no second');
  await p.fill('#f-y', 'לפיד'); await p.fill('#f-c', 'ט'); await p.fill('#f-ph', '0500000000');
  // זאב — לפי שם, פרס אחד: א + ב
  await p.selectOption('#f-nsel', { label: 'זאב גל' });
  await p.waitForFunction(function () { return document.getElementById('due').textContent === 'מגיע לך: פרס אחד'; });
  ok(await p.$eval('#f-m1', function (e) { return e.value; }) === 'ברכות', 'zeev masechet from zk (replaces auto)');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'זאב גל', 'signature follows again');
  var z = await optTexts(p, '#f-p1a');
  ok(z.length === 22 && z.some(function (t) { return /^1\./.test(t); }) && !z.some(function (t) { return /^23\./.test(t); }), 'due 1: א+ב', z.length);
  ok(await p.$eval('#f-p2a', function (e) { return e.value; }) === '', 'p2 (ג) dropped when not allowed');
  await p.selectOption('#f-p1a', { label: z.filter(function (t) { return /^1\./.test(t); })[0] });
  var z2 = await optTexts(p, '#f-p1b');
  ok(z2.length === 7, 'half → second from א', z2.length);
  await p.selectOption('#f-p1b', { label: z2[1] });
  await p.selectOption('#f-p2a', { label: z.filter(function (t) { return /^9\./.test(t); })[0] });
  // הקלדה ידנית בחתימה — לא נדרסת
  await p.fill('#f-s', 'ז. גל');
  await p.click('#go');
  await p.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
  var H = W.priv.getSheetByName('הצהרות'), hd = H.d[0], row = H.d[1];
  var col = function (k) { return row[hd.indexOf(k)]; };
  ok(col('שם התלמיד') === 'זאב גל' && col('מזהה תלמיד') === '' && col('חתימת התלמיד') === 'ז. גל', 'saved name/sig', row);
  ok(/^1\. .* \+ 2\. /.test(col('עדיפות ראשונה')) && /^9\./.test(col('עדיפות שניה')), 'saved prizes', [col('עדיפות ראשונה'), col('עדיפות שניה')]);
  await p.context().close();

  // שליחה עם תלמיד מ"לומדים" — המזהה האמיתי נשמר
  var W3 = world(true), p3 = await page(b, port, W3);
  await p3.waitForFunction(function () { return document.querySelectorAll('#f-nsel option').length > 1; });
  await p3.selectOption('#f-nsel', { label: 'אבי כהן' });
  await p3.waitForFunction(function () { return !document.getElementById('due').hidden; });
  var a = await optTexts(p3, '#f-p1a');
  await p3.selectOption('#f-p1a', { label: a.filter(function (t) { return /^24\./.test(t); })[0] });
  await p3.selectOption('#f-p2a', { label: a.filter(function (t) { return /^25\./.test(t); })[0] });
  await p3.fill('#f-y', 'לפיד'); await p3.fill('#f-c', 'ט'); await p3.fill('#f-ph', '0500000000');
  await p3.click('#go');
  await p3.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
  var H3 = W3.priv.getSheetByName('הצהרות');
  ok(H3.d[1][H3.d[0].indexOf('מזהה תלמיד')] === 'DAAA1', 'real id saved', H3.d[1]);
  await p3.context().close();

  // הרשימה לא נטענה — שדה טקסט, והשליחה עובדת
  var W2 = world(false), p2 = await page(b, port, W2, true);
  await p2.waitForSelector('input#f-n:not([type=hidden])');
  ok(await p2.$$eval('#f-n', function (e) { return e.length; }) === 1, 'single f-n after fallback');
  await p2.fill('#f-n', 'שם חופשי');
  var all = await optTexts(p2, '#f-p1a');
  await p2.selectOption('#f-p1a', { label: all[0] });
  await p2.selectOption('#f-p2a', { label: all[1] });
  await p2.fill('#f-y', 'לפיד'); await p2.fill('#f-c', 'ט'); await p2.fill('#f-ph', '0500000000');
  await p2.fill('#f-m1', 'סוכה'); await p2.fill('#f-s', 'שם');
  await p2.click('#go');
  await p2.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
  var H2 = W2.priv.getSheetByName('הצהרות');
  ok(H2.d[1][H2.d[0].indexOf('שם התלמיד')] === 'שם חופשי', 'fallback saved', H2.d[1]);
  await b.close(); s.close();
  console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
})();
