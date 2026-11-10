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
    c.appendCols_('לומדים', [['מזהה', x[0]], ['שם', x[1]], ['משפחה', x[2]], ['קוד ישיבה', 'lapid'], ['תפקיד', 'תלמיד'],
      ['שכבה', 'ט'], ['כיתה', x[0] === 'DAAA1' ? '3' : ''], ['טלפון', x[0] === 'DAAA1' ? 'TESTPHONE1' : '']]);
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
  await ctx.route(/script\.google\.com/, async function (rt) {
    if (/hasaa=info/.test(rt.request().url())) await new Promise(function (r) { setTimeout(r, 600); });   // השרת האמיתי — כמה שניות
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
  // 8.99.501 — שני מקומות בטופס, הבחירה במסך נפרד
  var tap = function (pg, n) { return pg.click('#prz .it[data-n="' + n + '"] span'); };
  var cls = function (pg, n) { return pg.$eval('#prz .it[data-n="' + n + '"]', function (e) { return e.className; }); };
  var offN = function (pg) { return pg.$$eval('#prz .it[hidden]', function (a) { return a.map(function (e) { return +e.getAttribute('data-n'); }); }); };
  var hdOff = function (pg) { return pg.$$eval('#prz .hd[data-g][hidden]', function (a) { return a.map(function (e) { return e.getAttribute('data-g'); }).join(''); }); };
  var pk = function (pg) { return pg.$eval('#pk', function (e) { return e.textContent; }); };
  var open = function (pg, k) { return pg.click('#sl-' + k + ' button'); };
  var pkrOpen = function (pg) { return pg.$eval('#pkr', function (e) { return !e.hidden; }); };
  var slot = function (pg, k) { return pg.$eval('#sl-' + k, function (e) { return e.textContent; }); };
  ok(await p.$$eval('select#f-p1a, details.prz', function (a) { return a.length; }) === 0, 'no dropdowns, no collapsible list');
  ok(!(await pkrOpen(p)), 'picker closed at start');
  // 8.99.502 — קודם רק השם; השאר נפתח אחרי שהפרטים הגיעו
  ok(await p.$eval('#rest', function (e) { return e.hidden; }), 'only name before pick');
  // בלי זכאות (בני) — כל הפרסים
  await p.selectOption('#f-nsel', { label: 'בני לוי' });
  ok(await p.$eval('#rest', function (e) { return e.hidden; }) && await p.$eval('#due', function (e) { return !e.hidden && e.textContent === 'טוען...'; }), 'loading, rest still closed');
  await p.waitForFunction(function () { return !document.getElementById('rest').hidden; });
  ok(/בחר פרס/.test(await slot(p, 'p1')) && await p.$eval('#sl-p2 button', function (e) { return e.disabled; }), 'two slots; second locked');
  await open(p, 'p1');
  ok(await pkrOpen(p) && (await offN(p)).length === 0, 'unlimited: picker shows all');
  await p.click('#pkBack');
  ok(!(await pkrOpen(p)), 'back closes picker');
  ok(await p.$eval('#due', function (e) { return e.hidden; }), 'no due line');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'בני לוי', 'signature autofill');
  ok(await p.$eval('#mas', function (e) { return !e.hidden; }) && await p.$eval('#masTx', function (e) { return e.hidden; }), 'no known masechtot → fields');
  // אבי — שני פרסים
  await p.selectOption('#f-nsel', { label: 'אבי כהן' });
  await p.waitForFunction(function () { return !document.getElementById('due').hidden; });
  ok(await p.$eval('#due', function (e) { return e.textContent; }) === 'מגיע לך: שני פרסים', 'due 2');
  ok(await p.$eval('#f-m1', function (e) { return e.value; }) === 'תענית', 'masechet filled');
  ok(await p.$eval('#masTx', function (e) { return !e.hidden && e.textContent === 'תענית'; }) &&
     await p.$eval('#mas', function (e) { return e.hidden; }), 'masechtot as text, no fields');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'אבי כהן', 'signature follows name');
  ok(await p.$eval('#f-y', function (e) { return e.value; }) === 'ישיבת לפיד', 'yeshiva filled');
  ok(await p.$eval('#f-c', function (e) { return e.value; }) === 'ט׳3' && await p.$eval('#f-ph', function (e) { return e.value; }) === 'TESTPHONE1', 'class + phone filled');
  await open(p, 'p1');
  ok(await p.$eval('#pkT', function (e) { return e.textContent; }) === 'עדיפות ראשונה' && await pk(p) === 'מגיע לך: שני פרסים', 'picker header');
  var off = await offN(p);
  ok(off.length === 16 && off.indexOf(1) >= 0 && off.indexOf(29) >= 0 && off.indexOf(8) < 0, 'due 2: א/ד/ה hidden', off);
  ok(await hdOff(p) === 'אדה', 'due 2: list headers א,ד,ה hidden', await hdOff(p));
  ok(await p.$eval('#prz', function (e) { return e.textContent.indexOf('לבחירה אחד מהרשימה:') < 0; }), 'list א: misleading line gone');
  await tap(p, 8);
  ok(/ on/.test(await cls(p, 8)) && await pkrOpen(p), 'item 8 selected, picker stays');
  ok(/בחרת: 8\..*נשאר לך לבחור עוד פרס אחד מרשימה ב/.test(await pk(p)), 'status: what is left', await pk(p));
  off = await offN(p);
  ok(off.indexOf(9) < 0 && off.indexOf(23) >= 0 && await hdOff(p) === 'אגדה', 'only list ב shown', await hdOff(p));
  await tap(p, 8);
  ok(!/on/.test(await cls(p, 8)) && await pk(p) === 'מגיע לך: שני פרסים', 'second tap cancels');
  // "על הספר" — לא מסמן
  await p.$eval('#prz .it[data-n="9"] a.bkl', function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
  await p.click('#prz .it[data-n="9"] a.bkl');
  ok(!/on/.test(await cls(p, 9)), 'book link does not select');
  await tap(p, 8); await tap(p, 10);
  ok(!(await pkrOpen(p)), 'complete → back to form');
  ok(/8\./.test(await slot(p, 'p1')) && /10\./.test(await slot(p, 'p1')) && /שינוי/.test(await slot(p, 'p1')), 'slot 1 shows the pair');
  ok(await p.$eval('#sl-p1 img', function (e) { return /hasaa-books\/08\.jpg/.test(e.src); }), 'slot shows cover');
  ok(await p.$eval('#sl-p2', function (e) { return / next/.test(e.className) && !e.querySelector('button').disabled; }), 'slot 2 unlocked + highlighted');
  await open(p, 'p2');
  off = await offN(p);
  ok(off.indexOf(8) >= 0 && off.indexOf(10) >= 0, 'p2 picker: items of p1 not offered');
  await tap(p, 23);
  ok(!(await pkrOpen(p)) && /23\./.test(await slot(p, 'p2')), 'p2 chosen');
  // שינוי — נפתח מחדש וריק; חזרה בלי השלמה — העדיפות מתרוקנת
  await p.click('#sl-p2 .slx');
  ok(await pkrOpen(p) && !(await p.$$eval('#prz .it.on', function (a) { return a.length; })), 'change reopens empty');
  await tap(p, 9);
  await p.goBack();
  await p.waitForTimeout(200);
  ok(!(await pkrOpen(p)) && /בחר פרס/.test(await slot(p, 'p2')), 'phone back closes; partial dropped');
  await open(p, 'p2'); await tap(p, 23);
  await p.fill('#f-y', 'לפיד'); await p.fill('#f-c', 'ט'); await p.fill('#f-ph', '0500000000');
  // זאב — לפי שם, פרס אחד: הבחירות של שני פרסים מתרוקנות
  await p.selectOption('#f-nsel', { label: 'זאב גל' });
  await p.waitForFunction(function () { return document.getElementById('due').textContent === 'מגיע לך: פרס אחד'; });
  ok(await p.$eval('#f-m1', function (e) { return e.value; }) === 'ברכות', 'zeev masechet from zk (replaces auto)');
  ok(await p.$eval('#masTx', function (e) { return e.textContent; }) === 'ברכות' && await p.$eval('#f-m2', function (e) { return e.value; }) === '', 'zeev text replaces');
  ok(await p.$eval('#f-s', function (e) { return e.value; }) === 'זאב גל', 'signature follows again');
  ok(await p.$eval('#f-ph', function (e) { return e.value; }) === '0500000000' && await p.$eval('#f-y', function (e) { return e.value; }) === 'לפיד', 'typed fields kept');
  ok(/בחר פרס/.test(await slot(p, 'p1')) && /בחר פרס/.test(await slot(p, 'p2')), 'selections cleared on due change');
  // שליחה לפני שתי עדיפויות — לא נשלח, המקום הריק מסומן
  await p.click('#go');
  await p.waitForTimeout(300);
  ok(await p.$eval('#ok', function (e) { return e.hidden; }) && await p.$eval('#sl-p1', function (e) { return / need/.test(e.className); }), 'blocked; empty slot marked');
  await open(p, 'p1');
  off = await offN(p);
  ok(off.length === 15 && off.indexOf(1) < 0 && off.indexOf(8) < 0 && off.indexOf(23) >= 0 && await hdOff(p) === 'גדה', 'due 1: only א+ב', off.length);
  await tap(p, 1);
  off = await offN(p);
  ok(off.length === 30 && off.indexOf(2) < 0 && /נשאר לך לבחור עוד חצי פרס מרשימה א/.test(await pk(p)), 'half → only א, says half left', await pk(p));
  await tap(p, 2);
  ok(await p.$eval('#sl-p1', function (e) { return !/ need/.test(e.className); }), 'mark clears when filled');
  await open(p, 'p2'); await tap(p, 9);
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
  await p3.click('#sl-p1 button'); await p3.click('#prz .it[data-n="24"] span');
  await p3.click('#sl-p2 button'); await p3.click('#prz .it[data-n="25"] span');
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
  ok(await p2.$eval('#rest', function (e) { return !e.hidden; }), 'fallback: whole form open');
  await p2.fill('#f-n', 'שם חופשי');
  await p2.click('#sl-p1 button'); await p2.click('#prz .it[data-n="8"] span');
  await p2.click('#sl-p2 button'); await p2.click('#prz .it[data-n="9"] span');
  await p2.fill('#f-y', 'לפיד'); await p2.fill('#f-c', 'ט'); await p2.fill('#f-ph', '0500000000');
  await p2.fill('#f-m1', 'סוכה'); await p2.fill('#f-s', 'שם');
  await p2.click('#go');
  await p2.waitForSelector('#ok:not([hidden])', { timeout: 20000 });
  var H2 = W2.priv.getSheetByName('הצהרות');
  ok(H2.d[1][H2.d[0].indexOf('שם התלמיד')] === 'שם חופשי', 'fallback saved', H2.d[1]);
  await b.close(); s.close();
  console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
})();
