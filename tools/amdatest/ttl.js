/* כותרת משלי בנוכחות (8.99.513) — העמוד הראשי האמיתי מול apps-script.gs בזיכרון.
   NODE_PATH=$(npm root -g) node tools/amdatest/ttl.js
   הניהול: מתג שלישי, שדה כותרת, פתיחה בלי כותרת חסומה, כותרות קודמות ומחיקה.
   העמדה: הכותרת בראש, בלי מתג הדף. הגיליון: סוג = שיעור + עמודת כותרת.
   רשימת הנוכחים: קטגוריה לכל כותרת, לימוד רגיל נפרד. אותו תלמיד — מותר גם
   בלימוד רגיל באותו מועד. איש צוות — הכותרת עוברת. לימוד רגיל — בלי כותרת. */
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
    return { n: t.c(x, 'שם'), k: t.c(x, 'סוג'), t: t.c(x, 'כותרת'), daf: t.c(x, 'דף') };
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
  /* מסך הנוכחות בניהול — לתוך אלמנט משלו (admPane מצייר אותו מחדש). */
  await p.evaluate(function () {
    CFG.readKey = 'k';
    Store.set('amdaRoster', { at: Date.now(), inst: 'givat', g: { 'ז': { '3': ['אבי כהן', 'בני לוי', 'גדי מור'] } } });
    Store.set('amdaTtls', []);
    var d = document.createElement('div'); d.id = 'tp'; d.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#fff;z-index:50;padding:10px';
    document.body.appendChild(d);
    window.admPane = function () { admAmda(document.getElementById('tp')); };
    admPane();
  });
  var btn = function (t) {
    return p.evaluate(function (t) {
      var b = [].filter.call(document.querySelectorAll('#tp button'), function (e) { return e.textContent.trim() === t; })[0];
      if (b) b.click();
      return !!b;
    }, t);
  };
  var T = await p.evaluate(function () { return { f: amdaT('admDafTtl'), o: amdaT('admDafOff'), one: amdaT('admOne'), self: amdaT('admSelf') }; });
  ok(T.o === 'לא — לימוד רגיל', 'השם החדש: לימוד רגיל', T.o);
  ok(await btn(T.f), 'מתג שלישי: כותרת משלי');
  var st = await p.evaluate(function () {
    return { inp: !!document.getElementById('am-ttl'), on: (document.querySelector('#tp .am-sl button.on') || {}).textContent };
  });
  ok(st.inp && st.on === T.f, 'כותרת משלי דלוק, ושדה הכותרת מופיע', st);
  // פתיחה בלי כותרת — חסומה
  await btn(T.one);
  ok(!(await p.evaluate(function () { return !!document.querySelector('#amda.on'); })), 'בלי כותרת — העמדה לא נפתחת');
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'ttl-adm.png') });
  // כותרת ופתיחה ("אני מסמן בעצמי")
  await p.fill('#am-ttl', '  הכנה   לחנוכה ');
  await btn(T.self);
  var op = await p.evaluate(function () {
    amdaSt.g = 'ז'; amdaSt.c = '3'; amdaPaint();
    return { on: !!document.querySelector('#amda.on'), sub: document.querySelector('.am-sub').textContent, h: document.querySelector('.am-h').textContent,
             kd: !!document.querySelector('[data-k]'), s: amdaSess(), tl: amdaTtls() };
  });
  ok(op.on && op.s.kind === 'o' && op.s.ttl === 'הכנה לחנוכה', 'נפתח: לימוד בלי הדף, עם הכותרת (רווחים נוקו)', op.s);
  ok(op.h === 'הכנה לחנוכה' && !/^ ·/.test(op.sub) && !op.kd, 'הכותרת היא הכותרת הגדולה, בלי מתג הדף', op);
  ok(op.tl.length === 1 && op.tl[0] === 'הכנה לחנוכה', 'נשמרה בכותרות הקודמות', op.tl);
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'ttl-station.png') });
  await p.click('.am-nm[data-n="0"]');
  await p.click('.am-nm[data-n="1"]');
  await p.evaluate(function () { amdaClose(true); amdaBg('', null); });
  var cls = await waitSv(p);
  var R = tab(c);
  ok(/ok/.test(cls) && R.length === 2 && R.every(function (x) { return x.k === 'שיעור' && x.t === 'הכנה לחנוכה' && !x.daf; }),
     'בגיליון: סוג שיעור, הכותרת, בלי דף', [cls, R]);
  // לימוד רגיל באותו מועד — אבי שוב (מפגש נפרד), גדי
  await p.evaluate(function () { amdaKindPick('o'); });
  var reg = await p.evaluate(function () {
    return { flex: !!amdaSt.flex, kind: amdaSt.kind, inp: !!document.getElementById('am-ttl') };
  });
  ok(!reg.flex && reg.kind === 'o' && !reg.inp, 'מעבר ללימוד רגיל — בלי שדה כותרת', reg);
  await btn(T.self);
  var r2 = await p.evaluate(function () {
    amdaSt.g = 'ז'; amdaSt.c = '3'; amdaPaint();
    var a = amdaMarkRec('ז', '3', 'אבי כהן'), g = amdaMarkRec('ז', '3', 'גדי מור');
    return { a: a, g: g, s: amdaSess(), sub: document.querySelector('.am-sub').textContent, kd: !!document.querySelector('[data-k]') };
  });
  ok(r2.a && r2.g && !r2.s.ttl, 'לימוד רגיל: אותו תלמיד מותר (מפגש נפרד), בלי כותרת', r2);
  ok(/לימוד רגיל/.test(r2.sub) && r2.kd, 'לימוד רגיל: "📖 לימוד רגיל" והמתג כמו קודם', r2.sub);
  await p.evaluate(function () { amdaClose(true); amdaBg('', null); });
  cls = await waitSv(p);
  R = tab(c);
  ok(/ok/.test(cls) && R.length === 4 && R.slice(2).every(function (x) { return x.k === 'שיעור' && !x.t; }), 'לימוד רגיל — בלי כותרת בגיליון', R);
  // רשימת הנוכחים
  var rp = await p.evaluate(function () {
    amdaSt.flex = true; amdaSt.ttl = 'הכנה לחנוכה';
    return amdaRepLoad().then(function () {
      amdaRepOpen();
      return new Promise(function (r) { setTimeout(r, 1500); });
    }).then(function () {
      var cats = [].map.call(document.querySelectorAll('#tp .am-rp-c button'), function (e) { return [e.textContent, e.className]; });
      var a = amdaRepData().n;
      amdaRepSet('cat', 1);
      var o = amdaRepData().n, tt = amdaRepTitle();
      return { cats: cats, a: a, o: o, t1: tt };
    });
  });
  ok(rp.cats.length === 4 && rp.cats[3][0] === 'הכנה לחנוכה' && /on/.test(rp.cats[3][1]), 'רשימה: קטגוריה לכותרת, נבחרת בפתיחה', rp.cats);
  ok(rp.a === 2 && rp.o === 2, 'רשימה: שניים בכותרת, שניים בלימוד רגיל', rp);
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'ttl-rep.png') });
  var msg = await p.evaluate(function () { amdaRepTtlGo(0); return amdaRepText(amdaRepData()).join('\n'); });
  ok(/הכנה לחנוכה/.test(msg) && /אבי כהן/.test(msg) && !/גדי מור/.test(msg), 'הודעת הוואטסאפ — עם הכותרת', msg);
  // כותרות קודמות: בחירה ומחיקה
  await p.evaluate(function () {
    amdaRepClose(); amdaTtlAdd('טיול'); amdaSt.flex = true; amdaSt.ttl = ''; amdaSt.kind = 'o'; admPane();
    var e = document.getElementById('am-ttl'); e.scrollIntoView({ block: 'center' });
  });
  await p.screenshot({ path: path.join(process.env.SHOT || '/tmp', 'ttl-chips.png') });
  var tl = await p.evaluate(function () {
    var chips = [].map.call(document.querySelectorAll('#tp .am-tl'), function (e) { return e.firstChild.textContent; });
    document.querySelectorAll('#tp .am-tl button')[2].click();               /* "הכנה לחנוכה" */
    var picked = document.getElementById('am-ttl').value;
    document.querySelectorAll('#tp .am-tl button.x')[0].click();             /* מחיקת "טיול" */
    return { chips: chips, picked: picked, left: amdaTtls(), dom: document.querySelectorAll('#tp .am-tl').length };
  });
  ok(tl.chips.join() === 'טיול,הכנה לחנוכה' && tl.picked === 'הכנה לחנוכה', 'כותרות קודמות: האחרונה ראשונה, לחיצה ממלאת', tl);
  ok(tl.left.join() === 'הכנה לחנוכה' && tl.dom === 1, 'מחיקה — רק מהרשימה', tl);
  ok(tab(c).length === 4, 'המחיקה אינה נוגעת בגיליון');
  // איש צוות: הכותרת עוברת דרך הרשימה המותרת
  var row = c.amdaRows_('עמדת לימוד', [[['מזהה', 'zz1'], ['שם', 'תלמיד בדיקה'], ['סוג', 'שיעור'], ['כותרת', 'ערב'], ['קוד ישיבה', 'other']]], 'givat');
  var last = c.amdaTable_('עמדת לימוד'); last = last.rows[last.rows.length - 1];
  var lt = c.amdaTable_('עמדת לימוד');
  ok(row.n === 1 && lt.c(last, 'כותרת') === 'ערב' && lt.c(last, 'קוד ישיבה') === 'givat', 'איש צוות: הכותרת נשמרת, הישיבה נכפית', row);
  ok(c.SCRIPT_VERSION === 219, 'SCRIPT_VERSION 219');
  await ctx.close(); await b.close(); srv.close();
  console.log(fails ? 'FAILS ' + fails : 'all ok'); process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
