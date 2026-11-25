// רשימת הר"מים בעמוד הצמאה (8.99.597) — הלשונית הפרטית "צמאה — ר"מים", תשובה של שם וכיתה בלבד.
// NODE_PATH=$(npm root -g) node tools/tzmtest/rams.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
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
function rows(W) { var s = W.priv.getSheetByName('צמאה — רישום'); return s ? s.d.slice(1) : []; }
(async function () {
  var s = await srv(), port = s.address().port, b = await pw.chromium.launch();
  try {
    var W = world(), c = W.ctx;
    var adm = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    // בלי מפתח — נדחה; עם מפתח — ריק והלשונית נוצרה עם כותרת, בפרטי
    ok(JSON.parse(c.doGet({ parameter: { tzm: 'rams' } }).t).status === 'denied', 'denied');
    var r0 = JSON.parse(c.doGet({ parameter: { tzm: 'rams', k: adm.k } }).t);
    ok(r0.status === 'ok' && r0.rams.length === 0, 'empty', r0);
    var sh = W.priv.getSheetByName('צמאה — ר"מים');
    ok(sh && sh.d[0][0] === 'שם' && sh.d[0][1] === 'כיתה', 'tab', sh && sh.d[0]);
    ok(!W.pub.getSheetByName('צמאה — ר"מים'), 'not public');
    // ריקה — שדה טקסט כמו קודם
    var p = await page(b, port, W, '/tzama?k=' + adm.k);
    await p.waitForSelector('#byCard:not([hidden])'); await p.waitForTimeout(300);
    ok(await p.isHidden('#byS') && await p.isVisible('#by'), 'empty → input');
    await p.close();
    var A = ['אלף', 'רב'].join(' '), B = ['בית', 'רב'].join(' ');
    sh.getRange(2, 1, 2, 3).setValues([[A, 'ז׳4', 'סוד'], [B, '', 'סוד']]);
    var r1 = JSON.parse(c.doGet({ parameter: { tzm: 'rams', k: adm.k } }).t);
    ok(r1.rams.length === 2 && r1.rams[0].n === A && r1.rams[0].c === 'ז׳4' && Object.keys(r1.rams[0]).length === 2, 'rows', r1);
    ok(JSON.stringify(r1).indexOf('סוד') < 0, 'only 2 cols');
    p = await page(b, port, W, '/tzama?k=' + adm.k);
    await p.waitForSelector('#byS:not([hidden])');
    ok(await p.isHidden('#by'), 'select only');
    await p.click('#byGo');
    ok((await p.getAttribute('#byS', 'class')) === 'need', 'need pick');
    await p.selectOption('#byS', A);
    await p.click('#byGo');
    ok(await p.isVisible('#main2'), 'continue');
    ok((await p.evaluate(function () { return localStorage.getItem('df:tzmBy'); })) === A, 'saved');
    await p.reload(); await p.waitForSelector('#byS:not([hidden])');
    ok((await p.inputValue('#byS')) === A, 'remembered');
    await p.selectOption('#byS', '\u0001');
    ok(await p.isVisible('#by'), 'none → input');
    await p.fill('#by', 'חדש'); await p.click('#byGo');
    ok(await p.isVisible('#main2'), 'manual continue');
    // הגעה — ר"ם מהרשימה רואה את השאלה ומסמן; אחיאסף מסמן במקומו; האחרון קובע
    await p.reload(); await p.waitForSelector('#byS:not([hidden])');
    await p.selectOption('#byS', A); await p.click('#byGo');
    await p.waitForSelector('#ramCard:not([hidden])');
    ok((await p.textContent('#ramQ')).indexOf('מגיע') >= 0, 'ram q');
    await p.click('#ramY'); await p.waitForFunction(function () { return document.getElementById('ramY').textContent.indexOf('✓') === 0; });
    var rs = JSON.parse(c.doGet({ parameter: { tzm: 'ramst', k: adm.k, n: A } }).t);
    ok(rs.a === 'y' && sh.d[1][2] === 'כן' && sh.d[0][2] === 'מגיע' && sh.d[1][0] === A && sh.d[1][1] === 'ז׳4', 'saved y', [rs, sh.d[0], sh.d[1]]);
    var ad = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
    ok(ad.rams.length === 2 && ad.rams[0].a === 'y' && ad.rams[1].a === '' && !ad.rams[0].r, 'adm rams', ad.rams);
    var st = JSON.parse(c.doGet({ parameter: { tzm: 'ramset', key: 'k', n: A, a: 'n' } }).t);
    ok(st.status === 'ok' && st.a === 'n', 'adm set', st);
    await p.reload(); await p.waitForSelector('#byS:not([hidden])'); await p.click('#byGo');
    await p.waitForFunction(function () { return document.getElementById('ramN').textContent.indexOf('✓') === 0; });
    ok(true, 'rav sees admin mark');
    ok(JSON.parse(c.doGet({ parameter: { tzm: 'ramset', n: A, a: 'y' } }).t).status === 'denied', 'set denied');
    ok(JSON.parse(c.doGet({ parameter: { tzm: 'ramset', k: adm.k, n: 'לא קיים', a: 'y' } }).t).status === 'none', 'unknown none');
    ok(JSON.parse(c.doGet({ parameter: { tzm: 'ramset', k: adm.k, n: A, a: 'x' } }).t).status === 'error', 'bad a');
    // שם ידני — בלי שאלה
    await p.reload(); await p.waitForSelector('#byS:not([hidden])');
    await p.selectOption('#byS', '\u0001'); await p.fill('#by', 'מישהו'); await p.click('#byGo');
    ok(await p.isHidden('#ramCard'), 'manual → no q');
    var rr = JSON.parse(c.doGet({ parameter: { tzm: 'rams', k: adm.k } }).t);
    ok(rr.rams.every(function (x) { return Object.keys(x).length === 2; }), 'rams still 2 fields');
    await p.close();
    var bd = JSON.parse(c.doGet({ parameter: { tzm: 'bdn', key: 'k' } }).t);
    ok(bd.rams && bd.rams.n === 2, 'bdn', bd.rams);
  } finally { await b.close(); s.close(); }
  console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
})();
