/* שמירת הנוכחות ברקע (8.99.480) — העמוד הראשי האמיתי מול apps-script.gs בזיכרון.
   NODE_PATH=$(npm root -g) node tools/amdatest/save.js
   א. 30 רישומים → בקשת כתיבה אחת, בלי הורדת הלשונית, "נשמר בהצלחה", התור ריק,
      ו"נרשם היום" והספירות התעדכנו במכשיר.  ב. הסרה — יורדת אחרי האימות.
   ג. שרת ישן (בלי amdaok) — שורה לכל רישום וקריאה מלאה, כמו קודם, ובסוף נשמר.
   ד. איש צוות — בזהות המכשיר, רק הישיבה שלו. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), M = require('../snaptest/mock.js');
var TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
var fails = 0;
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
function serve() {
  return new Promise(function (res0) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ROOT, p === '/' ? '/index.html' : p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { res0(srv); });
  });
}
async function world(b, legacy) {
  var W = M.makeWorld(), c = W.ctx;
  c.accGate_ = function (inst, dev) { return dev === 'DEV1' && inst === 'tapuah' ? null : { status: 'denied' }; };
  c.amdaSyncLocked_ = function () { return 0; };
  var ctx = await b.newContext({ serviceWorkers: 'block' }), L = { post: [], get: [] };
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var rq = r.request(), u = new URL(rq.url()), q = {};
    u.searchParams.forEach(function (v, k) { q[k] = v; });
    if (rq.method() === 'POST') {
      var body = rq.postData() || '';
      try { L.post.push(JSON.parse(body).action); } catch (e) {}
      if (legacy && /"amdarows"/.test(body)) return r.fulfill({ status: 200, body: '{"status":"error"}' });
      var out = c.doPost({ postData: { contents: body }, parameter: {} });
      return r.fulfill({ status: 200, contentType: 'application/json', body: out.t });
    }
    L.get.push(Object.keys(q).filter(function (k) { return k !== 'callback' && k !== 'key'; })[0]);
    if (q.read === 'עמדת לימוד') L.rd = { cols: q.cols, nosync: q.nosync };
    if (legacy && q.amdaok) delete q.amdaok;          /* שרת ישן: עונה כבדיקת חיבור */
    var o = c.doGet({ parameter: q });
    return r.fulfill({ status: 200, contentType: q.callback ? 'application/javascript' : 'application/json', body: o.t });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  return { c: c, ctx: ctx, L: L };
}
function rows(c) { return c.amdaTable_('עמדת לימוד').rows.length - 1; }
async function setup(p, staff) {
  await p.evaluate(function (staff) {
    if (!staff) CFG.readKey = 'k';
    var q = [], d = amdaDay();
    for (var i = 0; i < 30; i++) {
      q.push({ id: 'aT' + i, w: 6, day: d, slot: 'S1', kind: 'd', track: 'taanit', daf: 'ו', inst: staff ? 'tapuah' : 'givat',
               seat: '', lv: '', qz: false, oid: 'o1', dev: staff ? 'DEV1' : '', vk: 0, g: 'ז', c: '3', n: 'תלמיד ' + i,
               at: new Date().toISOString() });
    }
    Store.set('amdaQ', q);
    amdaBg('', staff ? { dev: 'DEV1', inst: 'tapuah' } : null);
  }, staff);
}
async function waitSv(p) {
  for (var i = 0; i < 60; i++) {
    var cls = await p.evaluate(function () { var e = document.getElementById('amda-sv'); return e ? e.className : ''; });
    if (/\b(ok|bad)\b/.test(cls)) return cls;
    await p.waitForTimeout(500);
  }
  return 'timeout';
}
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  // א + ב
  var A = await world(b, false), p = await A.ctx.newPage();
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  A.L.post = []; A.L.get = [];
  var t0 = Date.now();
  await setup(p, false);
  var cls = await waitSv(p);
  ok(/ok/.test(cls), 'א: נשמר בהצלחה', cls);
  ok(rows(A.c) === 30, 'א: 30 שורות בגיליון', rows(A.c));
  ok(A.L.post.filter(function (x) { return x === 'amdarows'; }).length === 1 && A.L.post.indexOf('row') < 0, 'א: בקשת כתיבה אחת', A.L.post);
  ok(A.L.get.indexOf('read') < 0, 'א: בלי הורדת הלשונית', A.L.get);
  ok(A.L.get.filter(function (k) { return k === 'amdaok'; }).length <= 3, 'א: אימות קל (כולל בקשת השיוך)', A.L.get);
  console.log('     זמן עד "נשמר": ' + ((Date.now() - t0) / 1000).toFixed(1) + ' שנ\'');
  var st = await p.evaluate(function () {
    var d = amdaDay(), had = Store.get('amdaHad2', {}), cnt = Store.get('amdaCnt', {});
    return { q: amdaQ().length, had: Object.keys(had[d + '|S1'] || {}).length, c0: (cnt[amdaKey('ז', '3', 'תלמיד 0')] || [])[0],
             ids: (had[d + '|S1'] || {})[amdaKey('ז', '3', 'תלמיד 4')] };
  });
  ok(st.q === 0 && st.had === 30 && st.c0 === 1 && st.ids && st.ids[0] === 'aT4', 'א: נרשם היום והספירות במכשיר', st);
  // ב: הסרה של תלמיד 4
  A.L.get = [];
  await p.evaluate(function () {
    var s = { slot: 'S1', kind: 'd', oid: 'o1', n: 0 }; Store.set('amdaSess', s);
    amdaUnmark('ז', '3', 'תלמיד 4'); amdaBg('', null);
  });
  cls = await waitSv(p);
  var st2 = await p.evaluate(function () {
    var d = amdaDay(); return { dq: amdaDq().length, k: !!amdaHadNow(d + '|S1')[amdaKey('ז', '3', 'תלמיד 4')] };
  });
  ok(/ok/.test(cls) && st2.dq === 0 && !st2.k && rows(A.c) === 29, 'ב: הסרה אומתה', [cls, st2, rows(A.c)]);
  ok(A.L.get.indexOf('read') < 0, 'ב: בלי הורדת הלשונית', A.L.get);
  // ו: פתיחת העמדה — קריאה מלאה רזה, והשיוך בבקשה נפרדת (29 — תלמיד 4 הוסר ב-ב)
  A.L.get = [];
  var full = await p.evaluate(function () {
    AMDA_SYNC_AT = 0;
    return amdaPull().then(function (ok) { return { ok: ok, cnt: Object.keys(Store.get('amdaCnt', {})).length }; });
  });
  ok(full.ok && full.cnt === 29 && A.L.get.indexOf('read') >= 0 && A.L.get.indexOf('amdaok') >= 0, 'ו: קריאה מלאה עם עמודות נבחרות', [full, A.L.get]);
  ok(A.L.rd && A.L.rd.nosync === '1' && /קוד עמדה/.test(A.L.rd.cols || ''), 'ו: cols + nosync נשלחו', A.L.rd);
  // ה: סימון בתוך העמדה — השליחה הרגילה (amdaFlush) מאומתת באימות הקל, בלי הורדה
  A.L.get = []; A.L.post = [];
  await p.evaluate(function () {
    Store.set('amdaQ', [{ id: 'aS1', w: 6, day: amdaDay(), slot: 'S1', kind: 'd', track: 'taanit', daf: 'ו', inst: 'givat',
      seat: '', lv: '', qz: false, oid: 'o1', dev: '', vk: 0, g: 'ז', c: '4', n: 'עוד אחד', at: new Date().toISOString() }]);
    amdaFlush();
  });
  await p.waitForTimeout(7000);
  ok(await p.evaluate(function () { return amdaQ().length; }) === 0 && A.L.get.indexOf('read') < 0 &&
     A.L.get.indexOf('amdaok') >= 0, 'ה: סימון בעמדה — אימות קל', [A.L.post, A.L.get]);
  await A.ctx.close();
  // ג: שרת ישן
  var G = await world(b, true); p = await G.ctx.newPage();
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  G.L.post = []; G.L.get = [];
  await setup(p, false);
  cls = await waitSv(p);
  ok(/ok/.test(cls) && rows(G.c) === 30, 'ג: שרת ישן — נשמר, שורה לכל רישום', [cls, rows(G.c)]);
  ok(G.L.post.filter(function (x) { return x === 'row'; }).length >= 30 && G.L.get.indexOf('read') >= 0, 'ג: המסלול הישן', [G.L.post.length, G.L.get]);
  ok(await p.evaluate(function () { return amdaQ().length; }) === 0, 'ג: התור ריק');
  await G.ctx.close();
  // ד: איש צוות
  var D = await world(b, false); p = await D.ctx.newPage();
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  D.L.post = []; D.L.get = [];
  await setup(p, true);
  cls = await waitSv(p);
  var tt = D.c.amdaTable_('עמדת לימוד');
  ok(/ok/.test(cls) && rows(D.c) === 30 && tt.c(tt.rows[1], 'קוד ישיבה') === 'tapuah', 'ד: איש צוות — נשמר בישיבה שלו', [cls, rows(D.c)]);
  ok(D.L.post.filter(function (x) { return x === 'amdarows'; }).length === 1 && D.L.get.indexOf('netmarks') < 0, 'ד: בקשה אחת, בלי הורדה', [D.L.post, D.L.get]);
  await D.ctx.close();
  await b.close(); srv.close();
  console.log(fails ? 'FAILS ' + fails : 'all ok'); process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
