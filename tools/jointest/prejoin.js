/* בדיקה: חידון ו"נלמד" מלפני ההרשמה נספרים אחריה (8.99.470, LPreJoin).
   ============================================================
   מכשיר חדש בלי פרופיל: בתור `df:qq:` חידון שעבר — בדיוק התוכן ש-qsSend_
   (learn.html) בונה כשאין `me` (מזהה, שם וטלפון ריקים) — ו-`df:learned`
   עם הדף. join.html האמיתי בדפדפן, מול apps-script.gs שרץ ב-vm (גיליון
   בזיכרון). הרשמה ← בודקים בגיליון:
   א. ב"חידות" — שורת החידון עם המזהה החדש, השם והטלפון.
   ב. quizBest_ סופר אותה לאדם (הציון על הדף).
   ג. ב"לימוד" — שורת סיום של הדף עם המזהה, והזמן שנצבר בדף.
   ד. התורים במכשיר התרוקנו.
   הרצה:  node tools/jointest/prejoin.js   (קוד 1 בכישלון) */
var http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var W = require('../snaptest/mock.js').makeWorld();
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json',
              '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };

var C = { console: console }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), C);
var TR = 'taanit', WK = 0, DAF;
for (WK = 0; WK < 10; WK++) { var r = C.TRACKS[0].cal[WK]; if (r && r[2] && r[2] !== 'סיום') { DAF = r[2]; break; } }
TR = C.TRACKS[0].id;
var DK = TR + '|' + String(DAF).replace(/["'׳״\s]/g, '');

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
function rows(name) {
  var sh = W.priv.getSheetByName(name) || W.pub.getSheetByName(name);
  if (!sh || !sh.d.length) return [];
  var h = sh.d[0];
  return sh.d.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[String(k).trim()] = r[i] === undefined ? '' : String(r[i]); }); return o; });
}

/* script.google.com → apps-script.gs ב-vm. JSONP: בלי `callback` בפנים, עוטפים כאן. */
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

/* מה ש-qsSend_ בונה כשאין `me` (learn.html). */
function quizBody(tries, sc) {
  return JSON.stringify({ action:'quiz', cols: JSON.stringify([
    ['דף', DK], ['קטע', 'החידון כולו'], ['שבוע', TR + '-' + (WK + 1)],
    ['ישיבה', ''], ['שם', ''], ['טלפון', ''],
    ['תשובה', sc], ['ציון', sc], ['נכון', 'נכון'], ['זמן בדף (דקות)', 14.2],
    ['מכשיר', 'Dtestdev1'], ['ניסיון', tries], ['מזהה', ''], ['מקור', 'שליחת החידון']
  ]) });
}

serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port;
  return chromium.launch().then(function (b) {
    return b.newContext({ serviceWorkers:'block', viewport:{ width:390, height:844 } }).then(function (ctx) {
      return ctx.route(/script\.google(usercontent)?\.com/, bridge)
        .then(function () { return ctx.route(/docs\.google|gstatic|googleapis|fonts\./, function (r) { return r.abort(); }); })
        .then(function () {
          var ls = {
            'df:dev-id': JSON.stringify('Dtestdev1'),
            'df:learned': JSON.stringify((function () { var o = {}; o[TR + '|' + (WK + 1)] = new Date().toISOString(); return o; })()),
            'df:pos': JSON.stringify((function () { var o = {}; o[TR + '|' + (WK + 1)] = { i: 39, n: 40 }; return o; })())
          };
          ls['df:qq:' + DK] = JSON.stringify([{ n: 1, sc: '5/5', b: quizBody(1, '5/5') }]);
          ls['df:qsent:' + DK] = '1'; ls['df:qsv:' + DK] = '0';
          ls['df:qtime:' + DK] = String(14.2 * 60000);
          return ctx.addInitScript(function (ls) {
            if (sessionStorage.getItem('seed')) return;
            sessionStorage.setItem('seed', '1');
            for (var k in ls) localStorage.setItem(k, ls[k]);
          }, ls);
        })
        .then(function () { return ctx.newPage(); })
        .then(function (p) {
          p.on('pageerror', function (e) { console.log('pageerror', e.message); });
          return p.goto(base + '/join.html', { waitUntil: 'load' }).then(function () { return p.waitForTimeout(800); })
            .then(function () {
              /* הטופס עצמו — אותו handler של "go", בלי לעבור את מסכי ההתקנה. */
              return p.evaluate(function () {
                var set = function (id, v) { var el = document.getElementById(id); if (el) el.value = v; };
                set('first', 'בדיקה'); set('last', 'מקדימה');
                var sel = document.getElementById('inst'), code = INSTITUTIONS[0].code;
                if (sel && ![].some.call(sel.options, function (o) { return o.value === code; })) {
                  var o = document.createElement('option'); o.value = code; sel.appendChild(o);
                }
                set('inst', code); set('grade', 'ז׳'); set('klass', '1'); set('phone', '0000000000');
                way = 'solo';
                document.getElementById('go').onclick();
                return JSON.parse(localStorage.getItem('df:me') || 'null');
              });
            })
            .then(function (me) {
              ok(me && me.id, 'נרשם — יש מזהה במכשיר');
              return p.waitForTimeout(9000).then(function () { return p.evaluate(function () {
                var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o;
              }); }).then(function (L) {
                var Q = rows('חידות').filter(function (r) { return r['קטע'] === 'החידון כולו'; });
                ok(Q.length >= 1, 'שורת החידון הגיעה לגיליון (' + Q.length + ')');
                ok(Q.every(function (r) { return r['מזהה'] === me.id; }), 'כל שורות החידון עם המזהה החדש');
                ok(Q.length && Q[0]['שם'] === 'בדיקה מקדימה' && Q[0]['טלפון'].replace(/\D/g, '') === '0000000000', 'השם והטלפון בשורת החידון');
                ok(Q.length && Q[0]['ניסיון'] === '1', 'מספר הניסיון לא זז');
                var best = W.ctx.quizBest_({}, {}, null, null).best, key = me.id + '|' + TR + '|' + String(DAF).replace(/["'׳״\s]/g, '');
                ok(best[key] && best[key][0] === 5, 'quizBest_ סופר את החידון לאדם (' + JSON.stringify(best[key]) + ')');
                var D = rows('לימוד').filter(function (r) { return r['מזהה'] === me.id && r['מסלול'] === TR && r['שבוע'] === String(WK + 1); });
                ok(D.length >= 1, 'שורת סיום ב"לימוד" עם המזהה (' + D.length + ')');
                ok(D.length && D[0]['קטע'] === D[0]['מתוך'] && D[0]['קטע'] !== '', 'שורת סיום (קטע = מתוך)');
                ok(D.length && +D[0]['זמן בדף (דקות)'] === 14.2, 'הזמן שנצבר בדף (' + (D[0] && D[0]['זמן בדף (דקות)']) + ')');
                ok(!L['df:qq:' + DK], 'תור החידון התרוקן');
                ok(!JSON.parse(L['df:learn-q'] || '[]').length, 'תור הלימוד התרוקן');
                ok(rows('לומדים').some(function (r) { return r['מזהה'] === me.id; }), 'ההרשמה ב"לומדים"');
              });
            });
        });
    }).then(function () { return b.close(); }, function (e) { console.log(e); fail++; return b.close(); });
  }).then(function () { srv.close(); console.log(fail ? '\n' + fail + ' נכשלו' : '\nהכל עבר'); process.exit(fail ? 1 : 0); });
});
