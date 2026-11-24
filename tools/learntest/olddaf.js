/* בדיקה: השלמה של דף ישן נספרת ונשמרת (8.99.579).
   ============================================================
   learn.html האמיתי בדפדפן, מול apps-script.gs שרץ ב-vm (גיליון בזיכרון).
   תלמיד רשום (שורה ב"לומדים" דרך השרת עצמו) פותח דף של שבוע שעבר, מתקדם
   בלחיצות "הבא" עד הסוף, ויוצא. בודקים:
   א. במכשיר — `df:learned` עם השבוע של הדף, ו-`df:pos` נשמר.
   ב. בשרת — שורות התקדמות ושורת סיום ב"לימוד" עם השבוע והדף של הדף עצמו.
   ג. התור במכשיר התרוקן (השורה אומתה).
   ד. לא נשאלה שאלת "עם מי למדת" בדף ישן.
   ה. אותו דבר בדף של השבוע (שלא נשבר).
   ו. דף של שבוע שעוד לא הגיע — לא מסומן ולא נשלח.
   הרצה:  node tools/learntest/olddaf.js   (קוד 1 בכישלון) */
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
function dafName(w) { var r = rowOf(w); return r[2] + (r[3] === 'א' ? '.' : r[3] === 'ב' ? ':' : ''); }

function run(ctx, base, w, label, expectMark) {
  return ctx.newPage().then(function (p) {
    var errs = [];
    p.on('pageerror', function (e) { errs.push(e.message); });
    var url = base + '/learn.html?mas=' + encodeURIComponent(C.TrackBase(TR)) + '&' + unitQ(w) + '&hop=1';
    return p.goto(url, { waitUntil: 'load' })
      .then(function () { return p.waitForFunction(function () { return typeof FLAT !== 'undefined' && FLAT.length > 1 && READY_AT > 0; }, null, { timeout: 30000 })
        .catch(function (e) { return p.evaluate(function () { return document.body.innerText.slice(0, 400); }).then(function (t) { console.log('page:', t, errs); throw e; }); }); })
      .then(function () { return p.waitForTimeout(600); })
      .then(function () { return p.evaluate(function () { return { n: FLAT.length, wk: S.week, lw: LWeek() }; }); })
      .then(function (info) {
        console.log('\n— ' + label + ': שבוע ' + (w + 1) + ' (דף ' + dafName(w) + '), ' + info.n + ' קטעים; השבוע הנוכחי במכשיר ' + (info.lw + 1));
        ok(info.wk === w, label + ': הדף שנפתח הוא של שבוע ' + (w + 1));
        /* לוחצים "הבא" כמו תלמיד, עד שמסך הסיום נפתח (או שאין עוד קטעים). */
        I = 0;
        function step() {
          return p.evaluate(function () { return { idx: IDX, n: FLAT.length, done: DONE_SEEN }; }).then(function (s) {
            if (s.done || I > s.n + 5) return s;
            I++;
            return p.waitForTimeout(470).then(function () { return p.click('#next', { force: true }); })
              .then(function () { return p.waitForTimeout(60); }).then(step);
          });
        }
        return step();
      })
      .then(function (s) {
        ok(s.done, label + ': הגיע לסוף הדף בלחיצות "הבא" (' + I + ' לחיצות)');
        return p.evaluate(function () { return { pair: (document.getElementById('done-pair') || {}).style ? document.getElementById('done-pair').style.display : '', html: (document.getElementById('done-pair') || {}).innerHTML || '' }; });
      })
      .then(function (pr) {
        if (expectMark && w !== NOWWK) ok(pr.pair === 'none' && !pr.html, label + ': בלי "עם מי למדת" בדף ישן');
        /* יציאה מהדף — כמו סגירת הלשונית. */
        return p.evaluate(function () {
          Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
      })
      .then(function () { return p.waitForTimeout(9000); })
      .then(function () {
        return p.evaluate(function () {
          var g = function (k) { try { return JSON.parse(localStorage.getItem('df:' + k) || 'null'); } catch (e) { return null; } };
          return { learned: g('learned') || {}, pos: g('pos') || {}, q: g('learn-q') || [] };
        });
      })
      .then(function (L) {
        var k = TR + '|' + (w + 1);
        var D = rows('לימוד').filter(function (r) { return r['מזהה'] === ME.id && r['שבוע'] === String(w + 1); });
        var fin = D.filter(function (r) { return r['קטע'] !== '' && r['קטע'] === r['מתוך']; });
        var prog = D.filter(function (r) { return r['קטע'] !== r['מתוך']; });
        if (expectMark) {
          ok(!!L.learned[k], label + ': במכשיר — מסומן "נלמד" (df:learned[' + k + '])');
          ok(!!L.pos[k], label + ': במכשיר — המקום נשמר (df:pos[' + k + '])');
          ok(fin.length >= 1, label + ': בשרת — שורת סיום ב"לימוד" (' + fin.length + ')');
          ok(prog.length >= 1, label + ': בשרת — שורות התקדמות (' + prog.length + ')');
          ok(D.length && D.every(function (r) { return r['דף'] === dafName(w) && r['מסלול'] === TR; }),
             label + ': השבוע והדף בשורות — של הדף עצמו (שבוע ' + (w + 1) + ', ' + dafName(w) + ')');
          ok(!rows('לימוד').some(function (r) { return r['מזהה'] === ME.id && r['שבוע'] === String(NOWWK + 1) && w !== NOWWK && r['דף'] === dafName(w); }),
             label + ': אין שורה שנרשמה לשבוע הנוכחי');
          ok(!L.q.length, label + ': התור במכשיר התרוקן (' + L.q.length + ')');
          if (fin.length) console.log('     שורת הסיום: ' + JSON.stringify({ שבוע: fin[0]['שבוע'], דף: fin[0]['דף'], קטע: fin[0]['קטע'], מתוך: fin[0]['מתוך'], 'זמן בדף (דקות)': fin[0]['זמן בדף (דקות)'] }));
        } else {
          ok(!L.learned[k], label + ': לא מסומן במכשיר');
          ok(!D.length, label + ': אין שורה בשרת (' + D.length + ')');
        }
        ok(!errs.length, label + ': בלי שגיאות בדף' + (errs.length ? ' — ' + errs.join(' | ') : ''));
        return p.close();
      });
  });
}

serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port;
  console.log('מסלול ' + TR + ' · "היום" = ' + ASOF + ' · דף ישן: שבוע ' + (OLD + 1) + ' · עתידי: שבוע ' + (FUT + 1));
  return chromium.launch().then(function (b) {
    return b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } }).then(function (ctx) {
      return ctx.route(/script\.google(usercontent)?\.com/, bridge)
        .then(function () { return ctx.route(/gstatic|googleapis|fonts\.g|github/, function (r) { return r.abort(); }); })
        .then(function () { return ctx.route(/docs\.google\.com/, sheetRoute); })
        .then(function () {
          return ctx.addInitScript(function (me) {
            if (sessionStorage.getItem('seed')) return;
            sessionStorage.setItem('seed', '1');
            localStorage.setItem('df:me', JSON.stringify(me));
            localStorage.setItem('df:dev-id', JSON.stringify('Dtstolddev'));
            localStorage.setItem('df:gate', '1');
          }, ME);
        })
        .then(function () { return run(ctx, base, OLD, 'דף ישן', true); })
        .then(function () { return run(ctx, base, NOWWK, 'דף השבוע', true); })
        .then(function () { return FUT < 0 ? null : run(ctx, base, FUT, 'דף עתידי', false); });
    }).then(function () { return b.close(); }, function (e) { console.log(e); fail++; return b.close(); });
  }).then(function () { srv.close(); console.log(fail ? '\n' + fail + ' נכשלו' : '\nהכל עבר'); process.exit(fail ? 1 : 0); });
});
