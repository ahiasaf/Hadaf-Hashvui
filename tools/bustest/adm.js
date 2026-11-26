// ניהול צמאה (8.99.612): כרטיס האוטובוסים תמיד מוצג (טעינה/כישלון/הצלחה) · רשימת הר"מים מקופלת. נתונים מומצאים.
// NODE_PATH=$(npm root -g) node tools/bustest/adm.js
var pw = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
var s = http.createServer(function (q, r) { var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; var f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream'); r.end(fs.readFileSync(f)); })
  .listen(0, async function () {
    var b = await pw.chromium.launch(), cx = await b.newContext({ serviceWorkers: 'block' });
    await cx.route(/script\.google\.com/, function (rt) { rt.fulfill({ status: 200, body: '{}' }); });
    var p = await cx.newPage(); p.on('pageerror', function (e) { fails++; console.log('PAGEERR', e.message); });
    await p.goto('http://localhost:' + s.address().port + '/'); await p.waitForTimeout(1200);
    var out = await p.evaluate(function () {
      var R = ['אלף', 'בית'].join(' '), fail = true;
      window.scriptGet = function (o) {
        if (o.bus === 'adm') return fail ? Promise.reject(new Error('x')) : Promise.resolve({ status: 'ok', p: 'P1', a: 'A1', b: 'B1', cap: 50, cnt: 6 });
        if (o.tzm === 'adm') return Promise.resolve({ status: 'ok', reg: [], rams: [{ n: R, c: '', a: 'y' }], k: 'K' });
        return Promise.resolve({ status: 'ok' });
      };
      CFG.readKey = 'kk';
      var body = document.createElement('div'); document.body.appendChild(body);
      admTzm(body);
      var o = { load: document.getElementById('tzm').innerText };
      return new Promise(function (res) {
        setTimeout(function () {
          var el = document.getElementById('tzm');
          o.err = el.innerText; o.retry = !!el.querySelector('[onclick="busAdmRetry()"]');
          var dt = el.querySelector('details');
          o.closed = !!dt && !dt.open && dt.querySelector('summary') !== null;
          fail = false; busAdmRetry();
          setTimeout(function () {
            o.ok = el.innerText; o.links = el.querySelectorAll('input[readonly]').length;
            o.busFirst = el.innerHTML.indexOf('/bus?w=adm') < el.innerHTML.indexOf('tzmAllGo()');
            var d2 = el.querySelector('details'); d2.open = true; d2.dispatchEvent(new Event('toggle'));
            tzmPaint(); o.keep = el.querySelector('details').open;
            res(o);
          }, 100);
        }, 100);
      });
    });
    ok(out.err.indexOf('אוטובוסים') >= 0 && out.retry, 'shown on failure with retry');
    ok(out.closed, 'rams collapsed');
    ok(out.ok.indexOf('מסך האוטובוסים') >= 0 && out.links >= 4, 'loaded', out.links);
    ok(out.busFirst, 'buses above "who is registered"');
    ok(out.keep, 'rams stays open after repaint');
    await b.close(); s.close();
    console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
  });
