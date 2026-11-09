/* בחירת דף בנוכחות (8.99.488) — העמוד הראשי האמיתי מול apps-script.gs בזיכרון.
   NODE_PATH=$(npm root -g) node tools/amdatest/dafpick.js
   הבדיקה מהבריף: תלמיד על דף השבוע, בחירת דף אחר, אותו תלמיד באותו מועד —
   שתי שורות (שבועות ודפים שונים), שתיהן משויכות; הסרה מהדף השני — הראשון נשאר.
   ועוד: ב. וב: — שורה אחת בבורר · אותו דף פעמיים — חסום · ספירה פעם אחת ·
   תיקון סוג אינו דורס דף אחר · פתיחה חדשה — דף השבוע. */
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
function tab(c) {
  var t = c.amdaTable_('עמדת לימוד');
  return t.rows.slice(1).map(function (x) {
    return { id: t.c(x, 'מזהה'), w: t.c(x, 'שבוע'), daf: t.c(x, 'דף'), day: t.c(x, 'יום'), n: t.c(x, 'שם'), k: t.c(x, 'סוג') };
  });
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
  var W = M.makeWorld(), c = W.ctx;
  c.amdaSyncLocked_ = function () { return 0; };
  /* המדמה אינו מכיר את הגיבוב של מזהה Am… (amdaId_). */
  var crypto = require('crypto'), U = c.Utilities;
  U.DigestAlgorithm = { MD5: 'md5' }; U.Charset = { UTF_8: 'utf8' };
  U.computeDigest = function (a, s) { return Array.prototype.slice.call(crypto.createHash('md5').update(String(s)).digest()); };
  U.base64EncodeWebSafe = function (b) { return Buffer.from(b.map(function (x) { return x & 255; })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); };
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 800 } });
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var rq = r.request(), u = new URL(rq.url()), q = {};
    u.searchParams.forEach(function (v, k) { q[k] = v; });
    if (rq.method() === 'POST') {
      var out = c.doPost({ postData: { contents: rq.postData() || '' }, parameter: {} });
      return r.fulfill({ status: 200, contentType: 'application/json', body: out.t });
    }
    var o = c.doGet({ parameter: q });
    return r.fulfill({ status: 200, contentType: q.callback ? 'application/javascript' : 'application/json', body: o.t });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  var p = await ctx.newPage();
  p.on('pageerror', function (e) { ok(false, 'שגיאת דף', String(e)); });
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  var info = await p.evaluate(function () {
    CFG.readKey = 'k';
    Store.set('amdaRoster', { at: Date.now(), inst: 'givat', g: { 'ז': { '3': ['אבי כהן', 'בני לוי'] } } });
    amdaSt.self = true; amdaSt.all = true; amdaSt.sel = {};
    amdaOpen('d');
    amdaSt.g = 'ז'; amdaSt.c = '3'; amdaPaint();
    return { tr: amdaTrack(), wk: Math.max(0, LWeek()), cur: LDaf(amdaTrack(), Math.max(0, LWeek())) };
  });
  console.log('     מסלול ' + info.tr + ' · שבוע ' + (info.wk + 1) + ' · דף ' + info.cur);
  // 1. סימון על דף השבוע
  await p.click('.am-nm[data-n="0"]');
  // 2. הבורר: ב פעם אחת
  await p.click('[data-df]');
  var pick = await p.evaluate(function () {
    var d = [].map.call(document.querySelectorAll('#am-ex .trl-step .trl-dot'), function (e) { return e.textContent; });
    return { n: d.length, b: d.filter(function (x) { return x === 'ב'; }).length, colon: d.filter(function (x) { return /[.:]$/.test(x); }).length,
             here: (document.querySelector('#am-ex .trl-step.here .trl-dot') || {}).textContent };
  });
  ok(pick.n > 10 && pick.b === 1 && pick.colon === 0, 'הבורר: כל דף פעם אחת, בלי עמודים', pick);
  ok(pick.here === info.cur, 'הבורר: מסומן דף השבוע', pick.here);
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'dafpick.png') });
  // בוחרים דף אחר — ג
  var other = await p.evaluate(function () {
    var el = [].filter.call(document.querySelectorAll('#am-ex .trl-step'), function (e) { return e.querySelector('.trl-dot').textContent === 'ג'; })[0];
    el.click();
    return { wk: amdaSess().wk, sub: document.querySelector('.am-sub').textContent };
  });
  ok(typeof other.wk === 'number' && /דף ג/.test(other.sub), 'אחרי הבחירה — דף ג בראש', other);
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'dafpick2.png') });
  // 3. אותו תלמיד על הדף השני — מותר; פעם שלישית — לא
  var st = await p.evaluate(function () {
    var on = document.querySelector('.am-nm[data-n="0"]').getAttribute('aria-checked');
    document.querySelector('.am-nm[data-n="0"]').click();
    var again = amdaMarkRec('ז', '3', 'אבי כהן');
    return { before: on, q: amdaQ().length, again: again, dafs: amdaQ().map(function (m) { return m.daf + '/' + m.w; }) };
  });
  ok(st.before === 'false' && st.q === 2 && st.again === false, 'אותו תלמיד: דף אחר מותר, אותו דף חסום', st);
  // שמירה
  await p.evaluate(function () { amdaBg('', null); });
  var cls = await waitSv(p);
  var T = tab(c);
  ok(/ok/.test(cls) && T.length === 2 && T[0].day === T[1].day && T[0].w !== T[1].w && T[0].daf !== T[1].daf,
     'שתי שורות: אותו יום, שבוע ודף שונים', [cls, T]);
  // ספירה: פעם אחת
  var cnt = await p.evaluate(function () {
    return amdaPull().then(function () {
      var k = amdaKey('ז', '3', 'אבי כהן');
      return { c: amdaCounts()[k], cnt: Store.get('amdaCnt', {})[k], day: Object.keys(amdaHadDay(amdaDay() + '|' + amdaSess().slot)).length,
               cur: !!amdaHadNow(amdaSessNow())[k] };
    });
  });
  ok(cnt.c && cnt.c.reduce(function (a, x) { return a + x; }, 0) === 1 && cnt.day === 1 && cnt.cur, 'נוכח פעם אחת במועד, מסומן על הדף הנבחר', cnt);
  // שיוך: שני דפים נפרדים
  var syn = 0;
  try { syn = c.amdaSync_(); } catch (e) { syn = String(e); }
  var lt = c.amdaTable_('עמדה — שיוך');
  var weeks = lt.rows.slice(1).map(function (x) { return lt.c(x, 'שבוע'); });
  ok(syn === 2 && weeks.length === 2 && weeks[0] !== weeks[1], 'השרת: שני שיוכים ושתי שורות לימוד', [syn, weeks]);
  // תיקון סוג (own) אינו דורס דף אחר
  var day = T[0].day, slot = c.amdaTable_('עמדת לימוד');
  slot = slot.c(slot.rows[1], 'קוד עמדה');
  c.amdaKind_({ day: day, slot: slot, inst: 'givat', kind: 'd', own: '1', track: info.tr, daf: 'ג', w: String(other.wk + 1), lvl: 'למד' });
  var T2 = tab(c);
  ok(T2.map(function (x) { return x.daf; }).join() === T.map(function (x) { return x.daf; }).join(), 'תיקון סוג: כל שורה שומרת את הדף שלה', T2);
  ok(c.amdaFixOk_({ day: day, slot: slot, inst: 'givat', kind: 'd', own: 1, track: info.tr, daf: 'ג', lvl: 'למד' }), 'amdaFixOk_ עם own');
  ok(!c.amdaFixOk_({ day: day, slot: slot, inst: 'givat', kind: 'd', track: info.tr, daf: 'ג', lvl: 'למד' }), 'amdaFixOk_ בלי own — כמו קודם (לא תואם)');
  // o → d: שורה בלי דף מקבלת את הדף ואת השבוע שנשלחו
  c.amdaKind_({ day: day, slot: slot, inst: 'givat', kind: 'o', own: '1' });
  c.amdaKind_({ day: day, slot: slot, inst: 'givat', kind: 'd', own: '1', track: info.tr, daf: 'ג', w: String(other.wk + 1), lvl: 'למד' });
  var T3 = tab(c);
  ok(T3.every(function (x) { return x.k === 'דף' && x.daf === 'ג' && x.w === String(other.wk + 1); }), 'שיעור → דף: הדף והשבוע שנשלחו', T3);
  // החזרה: הדפים המקוריים, להסרה
  (function () {
    var t = c.amdaTable_('עמדת לימוד'), iD = t.rows[0].indexOf('דף'), iW = t.rows[0].indexOf('שבוע');
    T.forEach(function (o, i) { t.sh.getRange(i + 2, iD + 1).setValue(o.daf); t.sh.getRange(i + 2, iW + 1).setValue(o.w); });
  })();
  ok(tab(c).map(function (x) { return x.daf; }).join() === T.map(function (x) { return x.daf; }).join(), 'הוחזר לשני הדפים');
  // 4. הסרה מהדף השני — הראשון נשאר
  var dafs = await p.evaluate(function () {
    amdaUnmark('ז', '3', 'אבי כהן');
    return amdaDq().map(function (r) { return r.ids.length; });
  });
  await p.evaluate(function () { amdaBg('', null); });
  cls = await waitSv(p);
  var T4 = tab(c);
  ok(/ok/.test(cls) && T4.length === 1, 'הסרה מהדף הנבחר — שורה אחת נמחקה', [cls, dafs, T4]);
  var left = await p.evaluate(function () {
    var k = amdaKey('ז', '3', 'אבי כהן'), s = amdaSess(); var w = s.wk; delete s.wk; Store.set('amdaSess', s);
    var cur = !!amdaHadNow(amdaSessNow())[k]; s.wk = w; Store.set('amdaSess', s);
    return { cur: cur, sel: !!amdaHadNow(amdaSessNow())[k] };
  });
  ok(left.cur && !left.sel, 'הסימון על דף השבוע נשאר', left);
  // 5. פתיחה חדשה — דף השבוע
  var fresh = await p.evaluate(function () { amdaClose(true); amdaOpen('d'); return { wk: amdaWkSel(), lw: Math.max(0, LWeek()) }; });
  ok(fresh.wk === fresh.lw, 'פתיחה חדשה — דף השבוע', fresh);
  await ctx.close(); await b.close(); srv.close();
  console.log(fails ? 'FAILS ' + fails : 'all ok'); process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
