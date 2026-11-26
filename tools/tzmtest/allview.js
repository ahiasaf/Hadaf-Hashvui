// "מי רשום" בניהול צמאה (8.99.607) — ?tzm=all ותצוגת הכיתות. נתונים מומצאים.
// NODE_PATH=$(npm root -g) node tools/tzmtest/allview.js
var M = require('../snaptest/mock.js'), pw = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
var W = M.makeWorld(), c = W.ctx;
c.TZM_CLOSED_ = false;
var A = ['אלף', 'בית'].join(' '), B = ['גימל', 'דלת'].join(' '), D = ['הא', 'וו'].join(' ');
c.sheet_('תלמידי הרשת').getRange(1, 1, 4, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'],
  ['lapid', 'ז', '3', 'אלף', 'בית'], ['lapid', 'ז', '3', 'גימל', 'דלת'], ['lapid', 'ח', '2', 'הא', 'וו']]);
var adm = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
var pr = JSON.parse(c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: adm.k, by: 'רכז', ch: [{ g: 'ז', c: '3', n: A, on: true }, { g: 'ז', c: '3', n: 'נוסף ביד', on: true, add: 1 }] }) } }).t);
ok(pr.status === 'ok', 'put', pr);
ok(JSON.parse(c.doGet({ parameter: { tzm: 'all' } }).t).status === 'denied', 'denied');
var d = JSON.parse(c.doGet({ parameter: { tzm: 'all', key: 'k' } }).t);
ok(d.status === 'ok' && d.cls['ז|3'].length === 2 && d.reg.length === 2, 'all', d);
var s = http.createServer(function (q, r) { var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; var f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream'); r.end(fs.readFileSync(f)); })
  .listen(0, async function () {
    var b = await pw.chromium.launch(), cx = await b.newContext({ serviceWorkers: 'block' });
    await cx.route(/script\.google\.com/, function (rt) { rt.fulfill({ status: 200, body: '{}' }); });
    var p = await cx.newPage(); p.on('pageerror', function (e) { fails++; console.log('PAGEERR', e.message); });
    await p.goto('http://localhost:' + s.address().port + '/'); await p.waitForTimeout(1200);
    var out = await p.evaluate(function (D) {
      window.scriptGet = function (o) { return Promise.resolve(o.tzm === 'all' ? D : { status: 'ok' }); };
      CFG.readKey = 'kk'; document.body.insertAdjacentHTML('beforeend', '<div id="tzm"></div>');
      TZM.d = { reg: D.reg, rams: [] }; tzmPaint();
      var btn = document.getElementById('tzm').innerHTML.indexOf('tzmAllGo()') >= 0;
      tzmAllGo();
      return new Promise(function (r) { setTimeout(function () { r({ btn: btn, h: document.getElementById('tzm').innerText }); }, 100); });
    }, d);
    ok(out.btn, 'button');
    ok(out.h.indexOf('רשומים 2 מתוך 3') >= 0, 'class count', out.h);
    ok(out.h.indexOf('✓ ' + A) >= 0 && out.h.indexOf('✓ נוסף ביד') >= 0, 'marked');
    ok(out.h.indexOf(B) >= 0 && out.h.indexOf('✓ ' + B) < 0, 'unmarked');
    ok(out.h.indexOf(D) < 0, 'other grade hidden');
    var h2 = await p.evaluate(function () { tzmAllG('ח'); return document.getElementById('tzm').innerText; });
    ok(h2.indexOf(D) >= 0 && h2.indexOf('רשומים 0 מתוך 1') >= 0, 'grade ח', h2);
    var h3 = await p.evaluate(function () { tzmAllBack(); return document.getElementById('tzm').innerHTML.indexOf('tzmAllGo()') >= 0; });
    ok(h3, 'back');
    await b.close(); s.close();
    console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
  });
