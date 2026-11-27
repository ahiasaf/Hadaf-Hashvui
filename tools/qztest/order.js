/* בדיקה: החידה בדף — תוויות א׳–ד׳, ערבוב התשובות לכל מכשיר, והבחירה מסומנת
   גם אחרי שליחה ורענון (8.99.624). learn.html האמיתי מול apps-script.gs ב-vm;
   השאלות מוזרקות לדף (qPieces_).  הרצה:  SHOT=<תיקייה> node tools/qztest/order.js */
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
  var body = tab === 'סימוני הדף' ? MARKS : tab === 'דפים פתוחים' ? OPENS : '';
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
var QA = ['כי הוא חייב', 'כי הוא פטור', 'כי הוא אנוס', 'כי הוא שליח'];
var QREF = ['רק א׳', 'רק ב׳', 'א׳ וב׳ נכונות', 'אף תשובה'];
function inject(p, ref) {
  return p.evaluate(function (a) {
    var n0 = FLAT[IDX].n;
    window.qPieces_ = function (n) {
      if (n !== n0) return [];
      return a.ref ? [{ pub: { q: 'שאלה עם הפניה', a: a.qr, correct: 2 }, draft: null }]
                   : [{ pub: { q: 'למה לא קשה?', a: a.qa, correct: 1 }, draft: null }];
    };
    QUIZ_OPEN = true; CHAV_TAB = 'quiz';
    if (!document.body.classList.contains('chav-on')) drawer(true); else paintChavArea();
  }, { qa: QA, qr: QREF, ref: !!ref }).then(function () { return p.waitForTimeout(300); });
}
function state(p) {
  return p.evaluate(function () {
    var bs = [].slice.call(document.querySelectorAll('#chb .qz-ab'));
    return {
      q: (document.querySelector('#chb .qz-q') || {}).textContent || '',
      opts: bs.map(function (b) {
        var cs = getComputedStyle(b);
        return { id: b.id, l: b.querySelector('.qz-l').textContent, t: b.querySelector('.qz-t').textContent,
                 ch: b.classList.contains('chosen'), dis: b.disabled, op: cs.opacity, bc: cs.borderTopColor,
                 lb: getComputedStyle(b.querySelector('.qz-l')).backgroundColor };
      }),
      res: (document.querySelector('#chb .qz-res') || {}).textContent || ''
    };
  });
}
function openPage(ctx, base, w) {
  return ctx.newPage().then(function (p) {
    p.__errs = [];
    p.on('pageerror', function (e) { p.__errs.push(e.message); });
    var url = base + '/learn.html?mas=' + encodeURIComponent(C.TrackBase(TR)) + '&' + unitQ(w) + '&hop=1';
    return p.goto(url, { waitUntil: 'load' })
      .then(function () { return p.waitForFunction(function () { return typeof FLAT !== 'undefined' && FLAT.length > 1 && READY_AT > 0; }, null, { timeout: 30000 }); })
      .then(function () { return p.waitForTimeout(500); })
      .then(function () { return inject(p); })
      .then(function () { return p; });
  });
}
serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port, W0 = NOWWK, first, p, b;
  while (!dafOk(W0) && W0 > 0) W0--;
  return chromium.launch().then(function (bb) { b = bb;
    return b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } }).then(function (ctx) {
      return ctx.route(/script\.google(usercontent)?\.com/, bridge)
        .then(function () { return ctx.route(/gstatic|googleapis|fonts\.g|github/, function (r) { return r.abort(); }); })
        .then(function () { return ctx.route(/docs\.google\.com/, sheetRoute); })
        .then(function () {
          return ctx.addInitScript(function (me) {
            if (sessionStorage.getItem('seed')) return;
            sessionStorage.setItem('seed', '1');
            localStorage.setItem('df:me', JSON.stringify(me));
            localStorage.setItem('df:dev-id', JSON.stringify('Dtstqz'));
            localStorage.setItem('df:gate', '1');
          }, ME);
        })
        .then(function () { return openPage(ctx, base, W0); })
        .then(function (pp) { p = pp; return p.evaluate(function () { Q_AT = { n: FLAT[IDX].n, i: 0 }; paintChavArea(); }); })
        .then(function () { return state(p); })
        .then(function (s) {
          first = s;
          console.log('סדר: ' + s.opts.map(function (o) { return o.l + ' ' + o.t; }).join(' | '));
          ok(s.opts.length === 4, 'ארבע אפשרויות');
          ok(s.opts.map(function (o) { return o.l; }).join() === 'א׳,ב׳,ג׳,ד׳', 'תוויות א׳–ד׳ לפי הסדר');
          ok(s.opts.every(function (o) { return !o.ch; }), 'לפני מענה — אין סימון');
          return p.screenshot({ path: process.env.SHOT + '/qz-0.png' });
        })
        .then(function () { return p.click('#qz-opt1'); })
        .then(function () { return p.waitForTimeout(300); })
        .then(function () { return p.evaluate(function () { return localStorage.getItem('df:qans:' + dmKey(S.mas, S.daf) + ':' + FLAT[IDX].n + ':למה לא קשה?'); }); })
        .then(function (v) { ok(v === '1', 'נשמר האינדקס המקורי (1) של התשובה שנבחרה — ' + v); })
        .then(function () { return p.evaluate(function () { Q_AT = { n: FLAT[IDX].n, i: 0 }; QUIZ_OPEN = true; paintChavArea(); }); })
        .then(function () { return state(p); })
        .then(function (s) {
          console.log('     השאלה על המסך: ' + s.q);
          var c = s.opts.filter(function (o) { return o.ch; });
          ok(c.length === 1 && c[0].id === 'qz-opt1', 'אחרי מענה — התשובה שנבחרה מסומנת');
          ok(c[0] && c[0].lb === 'rgb(23, 70, 143)', 'העיגול של הנבחרת — כחול מלא');
          return p.screenshot({ path: process.env.SHOT + '/qz-1.png' });
        })
        .then(function () { return p.evaluate(function () { localStorage.setItem('df:qsent:' + dmKey(S.mas, S.daf), '1'); }); })
        .then(function () { return p.reload({ waitUntil: 'load' }); })
        .then(function () { return p.waitForFunction(function () { return typeof FLAT !== 'undefined' && FLAT.length > 1 && READY_AT > 0; }, null, { timeout: 30000 }); })
        .then(function () { return p.waitForTimeout(500); })
        .then(function () { return inject(p); })
        .then(function () { return p.evaluate(function () { Q_AT = { n: FLAT[IDX].n, i: 0 }; paintChavArea(); }); })
        .then(function () { return state(p); })
        .then(function (s) {
          ok(s.opts.map(function (o) { return o.t; }).join() === first.opts.map(function (o) { return o.t; }).join(), 'אחרי רענון — אותו סדר');
          var c = s.opts.filter(function (o) { return o.ch; });
          ok(c.length === 1 && c[0].id === 'qz-opt1' && c[0].dis, 'אחרי שליחה ורענון — נעול, והנבחרת מסומנת');
          ok(c[0] && c[0].op === '1', 'הנבחרת הנעולה אינה דוהה (opacity ' + (c[0] && c[0].op) + ')');
          ok(s.opts.filter(function (o) { return !o.ch; }).every(function (o) { return +o.op < 1; }), 'האחרות — דהויות');
          console.log('     ' + s.res);
          return p.screenshot({ path: process.env.SHOT + '/qz-2.png' });
        })
        .then(function () { return inject(p, true); })
        .then(function () { return state(p); })
        .then(function (s) { ok(s.opts.map(function (o) { return o.t; }).join() === QREF.join(), 'שאלה שמפנה לתשובות אחרות — לא מעורבבת'); })
        .then(function () { return inject(p); })
        .then(function () { return p.evaluate(function () { SIDE_ADM = true; Q_AT = { n: FLAT[IDX].n, i: 0 }; paintChavArea(); }); })
        .then(function () { return state(p); })
        .then(function (s) { ok(s.opts.map(function (o) { return o.t; }).join() === QA.join(), 'אצל הרכז — סדר המקור'); })
        .then(function () {
          /* שני מכשירים: הרבה פתיחות נקיות — לפחות סדר אחד שונה */
          var seen = {}, i = 0;
          function one() {
            if (i++ >= 6) return null;
            return b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } }).then(function (c2) {
              return c2.route(/script\.google(usercontent)?\.com/, bridge)
                .then(function () { return c2.route(/gstatic|googleapis|fonts\.g|github/, function (r) { return r.abort(); }); })
                .then(function () { return c2.route(/docs\.google\.com/, sheetRoute); })
                .then(function () { return c2.addInitScript(function (me) { localStorage.setItem('df:me', JSON.stringify(me)); localStorage.setItem('df:gate', '1'); }, ME); })
                .then(function () { return openPage(c2, base, W0); })
                .then(function (p2) { return p2.evaluate(function () { Q_AT = { n: FLAT[IDX].n, i: 0 }; paintChavArea(); }).then(function () { return state(p2); }); })
                .then(function (s) { seen[s.opts.map(function (o) { return o.t; }).join()] = 1; return c2.close(); })
                .then(one);
            });
          }
          return one().then(function () { ok(Object.keys(seen).length > 1, 'מכשירים שונים — סדר שונה (' + Object.keys(seen).length + ' סדרים ב-6)'); });
        })
        .then(function () { ok(!p.__errs.length, 'בלי שגיאות בדף ' + p.__errs.join(' | ')); });
    }).then(function () { return b.close(); }, function (e) { console.log(e); fail++; return b.close(); });
  }).then(function () { srv.close(); console.log(fail ? '\n' + fail + ' נכשלו' : '\nהכל עבר'); process.exit(fail ? 1 : 0); });
});
