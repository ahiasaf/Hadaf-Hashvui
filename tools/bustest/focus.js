// שדה שבפוקוס שורד ציור מחדש (8.99.615): מקלידים במספר המקומות כשהנתונים מגיעים ברקע — הפוקוס והערך נשמרים, והשמירה עובדת.
// NODE_PATH=$(npm root -g) node tools/bustest/focus.js
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
    await p.evaluate(function () {
      window.SAVED = null; window.MSGS = [];
      window.SayMsg = function (t) { MSGS.push(t); };
      window.scriptGet = function (o) {
        if (o.bus === 'adm') return Promise.resolve({ status: 'ok', p: 'P', a: 'A', b: 'B', cap: 50, cnt: 6 });
        if (o.bus === 'cfg') { SAVED = o; return Promise.resolve({ status: 'ok', cap: +o.cap, cnt: +o.cnt }); }
        if (o.tzm === 'adm') return new Promise(function (r) { setTimeout(function () { r({ status: 'ok', reg: [], rams: [], k: 'K' }); }, 50); });
        return Promise.resolve({ status: 'ok' });
      };
      CFG.readKey = 'kk';
      var body = document.createElement('div'); body.id = 'tzhost'; document.body.prepend(body);
      admTzm(body);
    });
    await p.waitForSelector('#bus-cap');
    await p.click('#bus-cap', { clickCount: 3 });
    await p.keyboard.type('4');
    // ציור מחדש באמצע ההקלדה — כמו נתונים שמגיעים ברקע
    await p.evaluate(function () { tzmPaint(); tzmPaint(); });
    await p.keyboard.type('5');
    var st = await p.evaluate(function () { var a = document.activeElement; return { id: a && a.id, v: document.getElementById('bus-cap').value }; });
    ok(st.id === 'bus-cap', 'focus kept after repaint', st);
    ok(st.v === '45', 'typed value kept', st);
    await p.click('#bus-cnt', { clickCount: 3 }); await p.keyboard.type('7');
    await p.evaluate(function () { tzmPaint(); });
    ok(await p.evaluate(function () { return document.getElementById('bus-cnt').value; }) === '7', 'cnt kept');
    await p.evaluate(function () { busAdmSave(); });
    await p.waitForTimeout(100);
    var sv = await p.evaluate(function () { return { s: SAVED, m: MSGS, cap: document.getElementById('bus-cap').value, cnt: document.getElementById('bus-cnt').value }; });
    ok(sv.s && sv.s.cap === '45' && sv.s.cnt === '7', 'save sent', sv);
    ok(sv.cap === '45' && sv.cnt === '7' && sv.m.length === 1, 'saved + message', sv);
    // שדה שלא הוקלד בו — הערך החדש מהשרת נשאר
    await p.click('#bus-cap');
    await p.evaluate(function () { BUSA.d.cap = 33; tzmPaint(); });
    ok(await p.evaluate(function () { return document.getElementById('bus-cap').value; }) === '33', 'untouched field takes new value');
    await b.close(); s.close();
    console.log(n + ' בדיקות, ' + fails + ' נכשלו'); process.exit(fails ? 1 : 0);
  });
