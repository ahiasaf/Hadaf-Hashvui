/* בדיקה: שיעור חי — המארח בדף האינטראקטיבי (8.99.605).
   learn.html האמיתי מול apps-script.gs ב-vm. מכשיר עם סיסמת הסקריפט, לא בניהול:
   כפתור "שיעור חי" → ברקוד; פתיחת החידה בקטע → היא בשרת (?live=get); מעבר לקטע
   הבא עם חידה אחרת → מתחלפת; "סיום" (ביטול · 4) → המפגש נסגר. ומכשיר בלי סיסמה — בלי כפתור.
   הרצה: node tools/livetest/host.js */
var http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var W = require('../snaptest/mock.js').makeWorld();
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json',
              '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.jpg':'image/jpeg',
              '.woff2':'font/woff2', '.css':'text/css' };

var C = { console: console }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), C);
var T = C.TRACKS[0], TR = T.id;
/* השבוע הנוכחי — לפי התאריך האמיתי (`asof` עובד רק במצב ניהול). */
var NOWWK = Math.floor((Date.now() - Date.parse(C.PROGRAM.startDate + 'T00:00:00+02:00')) / 864e5 / 7);
var ASOF = new Date().toISOString().slice(0, 10);
function rowOf(w) { return T.cal[w]; }
function dafOk(w) { var r = rowOf(w); return r && r[2] && r[2] !== 'סיום'; }
var OLD = -1, FUT = -1, I = 0;
for (var w = 1; w < NOWWK; w++) if (dafOk(w)) { OLD = w; break; }
for (var w2 = NOWWK + 1; w2 < T.cal.length; w2++) if (dafOk(w2)) { FUT = w2; break; }

function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}
var fail = 0;
function ok(c, what) { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + what); }
/* הגיליון של הדף (docs.google — חסום מכאן): סימוני הדף מדומים — 10 קטעים
   לכל עמוד, שורה לכל קטע — וכל הדפים פתוחים. הקוד שבונה מהם את הלימוד
   (SidFlat, amudCut) הוא האמיתי. */
function csv(rows) {
  return rows.map(function (r) { return r.map(function (f) { return '"' + String(f).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
}
var MARKS = (function () {
  var out = [['מסכת', 'דף', 'מקור', 'נתונים']], seen = {};
  T.cal.forEach(function (r) {
    if (!r || !r[2] || r[2] === 'סיום' || seen[r[2]]) return;
    seen[r[2]] = 1;
    [1, 2].forEach(function (pg) {
      var lines = [], steps = [];
      for (var i = 0; i < 10; i++) {
        lines.push([0.08 + i * 0.08, 0.08 + i * 0.08 + 0.05]);
        steps.push({ id: 'S' + pg + i, g: { from: { line: i, x: 0 }, to: { line: i, x: 1 } }, c: { from: null } });
      }
      out.push([TR, r[2], '0|' + pg, JSON.stringify({ zones: [{ a: 0.1, b: 0.9, lines: lines }], steps: steps })]);
    });
  });
  return csv(out);
})();
var OPENS = (function () {
  var out = [['מסכת', 'דף', 'נפתח']];
  T.cal.forEach(function (r) {
    if (r && r[2] && r[2] !== 'סיום') out.push([TR, r[2] + (r[3] === 'א' ? '.' : r[3] === 'ב' ? ':' : ''), '2026-10-01']);
  });
  return csv(out);
})();
function sheetRoute(route) {
  var u = new URL(route.request().url()), tab = u.searchParams.get('sheet') || '';
  var body = tab === 'סימוני הדף' ? MARKS : tab === 'דפים פתוחים' ? OPENS : tab === 'שאלות בדף' ? QS : '';
  return body ? route.fulfill({ status: 200, contentType: 'text/csv', body: body }) : route.fulfill({ status: 404, body: '' });
}
function rows(name) {
  var sh = W.priv.getSheetByName(name) || W.pub.getSheetByName(name);
  if (!sh || !sh.d.length) return [];
  var h = sh.d[0];
  return sh.d.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[String(k).trim()] = r[i] === undefined ? '' : String(r[i]); }); return o; });
}
function bridge(route) {
  var req = route.request(), u = new URL(req.url()), out;
  try {
    if (req.method() === 'POST') {
      out = W.ctx.doPost({ postData: { contents: req.postData() || '' }, parameter: {} });
      return route.fulfill({ status: 200, contentType: 'text/plain', body: (out && out.t) || '' });
    }
    var P = {}, cb = '';
    u.searchParams.forEach(function (v, k) { if (k === 'callback') cb = v; else P[k] = v; });
    var Ps = {}; for (var k in P) Ps[k] = [P[k]];
    out = W.ctx.doGet({ parameter: P, parameters: Ps });
    var t = (out && out.t) || '{}';
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: cb ? cb + '(' + t + ');' : t });
  } catch (e) {
    console.log('server error', e && e.stack);
    return route.fulfill({ status: 500, body: '' });
  }
}

var ME = { id: 'Dtstold1', first: 'בדיקה', last: 'Tst', inst: (C.INSTITUTIONS[0] || {}).code || 'x',
           grade: 'ח׳', klass: '2', phone: '0000000001', role: 'stu' };

/* ההרשמה — דרך השרת עצמו, כמו ש-join.html שולח. */
W.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'row', tab: 'לומדים', cols: JSON.stringify([
  ['מזהה', ME.id], ['שם פרטי', ME.first], ['שם משפחה', ME.last], ['קוד ישיבה', ME.inst],
  ['שכבה', ME.grade], ['כיתה', ME.klass], ['טלפון', ME.phone], ['תפקיד', 'תלמיד']
]) }) }, parameter: {} });

function unitQ(w) {
  var r = rowOf(w), am = r[3] === 'א' ? 1 : r[3] === 'ב' ? 2 : 0;
  return 'daf=' + encodeURIComponent(r[2]) + (am ? '&amud=' + am : '');
}
function dafName(w) { var r = rowOf(w); return r[2] + (r[3] === 'א' ? '.' : r[3] === 'ב' ? ':' : ''); }


var NOWD = rowOf(NOWWK)[2];
var QS = csv([['מסכת', 'דף', 'שאלות'], [TR, NOWD + (rowOf(NOWWK)[3] === 'א' ? '.' : rowOf(NOWWK)[3] === 'ב' ? ':' : ''), JSON.stringify({
  S10: [{ pub: { q: 'חידה ראשונה?', a: ['כן', 'לא', 'אולי'], correct: 0 }, draft: null }],
  S11: [{ pub: { q: 'חידה שנייה?', a: ['אחת', 'שתיים'], correct: 1 }, draft: null }]
})]]);
function G(P) { return JSON.parse(W.ctx.doGet({ parameter: P }).t); }
function open(ctx, base) {
  return ctx.newPage().then(function (p) {
    var errs = []; p.on('pageerror', function (e) { errs.push(e.message); });
    p._errs = errs;
    return p.goto(base + '/learn.html?mas=' + encodeURIComponent(C.TrackBase(TR)) + '&' + unitQ(NOWWK) + '&hop=1')
      .then(function () { return p.waitForFunction(function () { return typeof FLAT !== 'undefined' && FLAT.length > 1 && READY_AT > 0 && Q_READY; }, null, { timeout: 30000 }); })
      .then(function () { return p.waitForTimeout(500); }).then(function () { return p; });
  });
}
serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port;
  return chromium.launch().then(function (b) {
    function mk(key) {
      return b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } }).then(function (ctx) {
        return ctx.route(/script\.google(usercontent)?\.com/, bridge)
          .then(function () { return ctx.route(/gstatic|googleapis|fonts\.g|github/, function (r) { return r.abort(); }); })
          .then(function () { return ctx.route(/docs\.google\.com/, sheetRoute); })
          .then(function () { return ctx.addInitScript(function (a) {
            if (sessionStorage.getItem('seed')) return;
            sessionStorage.setItem('seed', '1');
            localStorage.setItem('df:me', JSON.stringify(a.me));
            localStorage.setItem('df:gate', '1');
            if (a.key) localStorage.setItem('df:cfg', JSON.stringify({ readKey: a.key }));
          }, { me: ME, key: key }); }).then(function () { return ctx; });
      });
    }
    var p;
    return mk('').then(function (ctx) { return open(ctx, base); }).then(function (p0) {
      return p0.$eval('#lvb', function (e) { return e.hidden; }).then(function (h) { ok(h, 'בלי סיסמה — אין כפתור'); });
    }).then(function () { return mk('k'); }).then(function (ctx) { return open(ctx, base); }).then(function (pp) {
      p = pp;
      return p.$eval('#lvb', function (e) { return !e.hidden && e.textContent; });
    }).then(function (t) {
      ok(t === 'שיעור חי', 'עם סיסמה — הכפתור מוצג');
      return p.click('#lvb').then(function () { return p.waitForSelector('#lvov:not([hidden]) #lvqr svg', { timeout: 8000 }); });
    }).then(function () {
      return p.evaluate(function () { return { s: LV.s, code: document.getElementById('lvqn').textContent }; });
    }).then(function (r) {
      ok(/^[A-Z0-9]{6}$/.test(r.s) && r.code === r.s, 'ברקוד וקוד ' + r.s);
      p._s = r.s;
      ok(G({ live: 'get', s: r.s }).on === 1, 'המפגש פתוח בשרת');
      return p.screenshot({ path: process.env.SHOT || '/tmp/lv-qr.png' }).then(function () { return p.click('#lvqx'); });
    }).then(function () {
      return p.evaluate(function () { IDX = 0; QUIZ_OPEN = true; paintChavArea(); });
    }).then(function () { return p.waitForTimeout(1500); }).then(function () {
      var g = G({ live: 'get', s: p._s });
      ok(g.q && g.q.q === 'חידה ראשונה?' && g.q.a.length === 3, 'החידה הראשונה בטלפונים: ' + JSON.stringify(g.q));
      return p.evaluate(function () { go(1); QUIZ_OPEN = true; paintChavArea(); });
    }).then(function () { return p.waitForTimeout(1500); }).then(function () {
      var g = G({ live: 'get', s: p._s });
      ok(g.q && g.q.q === 'חידה שנייה?', 'החידה השנייה מחליפה: ' + JSON.stringify(g.q && g.q.q));
      return p.waitForTimeout(5500);
    }).then(function () {
      return p.$eval('#lvbar', function (e) { return !e.hidden && e.textContent; });
    }).then(function (t) {
      ok(t && t.indexOf('מחוברים') >= 0, 'הפס של המארח: ' + t);
      return p.screenshot({ path: process.env.SHOT2 || '/tmp/lv-bar.png' }).then(function () { return p.click('#lvbe'); });
    }).then(function () { return p.waitForTimeout(6500); }).then(function () {
      ok(G({ live: 'get', s: p._s }).on === 0, 'סיום — המפגש נסגר');
      return p.$eval('#lvbar', function (e) { return e.hidden; });
    }).then(function (h) {
      ok(h, 'הפס נעלם');
      ok(!p._errs.length, 'בלי שגיאות בדף ' + p._errs.join(' | '));
      return b.close();
    }, function (e) { console.log(e); fail++; return b.close(); });
  }).then(function () { srv.close(); console.log(fail ? '\n' + fail + ' נכשלו' : '\nהכל עבר'); process.exit(fail ? 1 : 0); });
});
