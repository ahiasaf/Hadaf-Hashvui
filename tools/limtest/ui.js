/* הגבלת ר"ם לכיתה · סימון רכז מאנשי הקשר (8.99.527) — העמוד הראשי האמיתי מול apps-script.gs בזיכרון.
   NODE_PATH=$(npm root -g) node tools/limtest/ui.js [תיקייה לצילומים]
   שמות ומספרים מומצאים. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), M = require('../snaptest/mock.js');
var PH9 = '050' + '9876543';
var SHOT = process.argv[2] || '';
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
(async function () {
  var W = M.makeWorld(), c = W.ctx;
  c.READ_KEY = 'k';
  W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
  var I = c.OV_INST_;
  var T0 = W.pub.insertSheet(c.OV_TAB_);
  T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
  T0.appendRow([I[4][1], I[4][0], 'רכז ישן', '', '', '', '']);
  var K = W.priv.insertSheet('אנשי קשר');
  K.appendRow(['ישיבה', 'איש קשר', 'טלפון']);
  K.appendRow([I[4][1], 'הרב פלוני', '0501234567']);
  var code = I[4][0];
  c.appendCols_('התראות', [['מזהה', 'DRAM00001'], ['שם', 'Ram Demo'], ['טלפון', '055' + '0000011'], ['ישיבה', I[4][1]],
    ['קוד ישיבה', code], ['תפקיד', 'רב ומחנך'], ['שכבה', 'ט׳'], ['כיתה', '3']]);
  c.accAsk_(code, 'DRAM00001', false);
  c.upsertCols_(c.ACC_TAB, [['מזהה', 'DRAM00001'], ['מצב', 'אושר']], 'מזהה');
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 420, height: 900 } });
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var rq = r.request(), u = new URL(rq.url()), q = {};
    u.searchParams.forEach(function (v, k) { q[k] = v; });
    c.OVX_MEMO_ = null; c.SS_OPEN_ = {};
    if (rq.method() === 'POST') {
      var out = c.doPost({ postData: { contents: rq.postData() || '' }, parameter: {} });
      return r.fulfill({ status: 200, contentType: 'application/json', body: out.t });
    }
    var o = c.doGet({ parameter: q });
    return r.fulfill({ status: 200, contentType: q.callback ? 'application/javascript' : 'application/json', body: o.t });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  var p = await ctx.newPage(), errs = [];
  p.on('pageerror', function (e) { errs.push(String(e)); });
  await p.goto(base + '/'); await p.waitForTimeout(1200);

  // ---- חלק 1: סימון רכז בעדכון של ישיבה ----
  await p.evaluate(function () { CFG.readKey = 'k'; show('admin'); admGo('inst'); admSubGo('calls'); });
  await p.waitForTimeout(2500);
  var row = '#ov-adm .ov-r';
  var idx = await p.$$eval(row, function (L, nm) {
    for (var i = 0; i < L.length; i++) if (L[i].querySelector('.ov-n').textContent === nm) return i; return -1;
  }, I[4][1]);
  async function card() { return (await p.$$(row))[idx]; }
  await (await (await card()).$('.ov-x')).click(); await p.waitForTimeout(200);
  await (await (await card()).$('[data-ov="edit"]')).click(); await p.waitForTimeout(200);
  var btns = await (await card()).$$eval('[data-ov="pmark"],[data-ov="punmark"]', function (L) {
    return L.map(function (x) { return x.getAttribute('data-ov') + ':' + x.closest('.ov-pc').querySelector('input[id^="ov-pn-"]').value; });
  });
  ok(btns.indexOf('pmark:הרב פלוני') >= 0 && btns.indexOf('punmark:רכז ישן') >= 0, '1: "סמן כרכז" ליד איש קשר, "ביטול סימון" ברכז', btns);
  await (await (await card()).$('[data-ov="pmark"]')).click(); await p.waitForTimeout(300);
  var q1 = await (await card()).$eval('.ov-pq', function (e) { return e.textContent; }).catch(function () { return ''; });
  ok(/רכז ישן/.test(q1) && /הרב פלוני/.test(q1), '1: שאלת החלפה כשיש רכז', q1);
  ok(T0.d[1][2] === 'רכז ישן', '1: לפני אישור — לא נכתב דבר', T0.d[1]);
  if (SHOT) await p.screenshot({ path: SHOT + '/1-swap.png', fullPage: true });
  await (await (await card()).$('[data-ov="pswap"][data-v="1"]')).click(); await p.waitForTimeout(1500);
  ok(T0.d[1][2] === 'הרב פלוני', '1: אחרי "החלפה" — הרכז בשטח הוא איש הקשר', T0.d[1]);
  var after = await (await card()).$$eval('.ov-pc', function (L) {
    return L.map(function (x) { return (x.querySelector('.ov-pch') ? x.querySelector('.ov-pch').textContent : '') + ':' + x.querySelector('input[id^="ov-pn-"]').value; });
  });
  ok(after.some(function (t) { return t === 'רכז בשטח:הרב פלוני'; }) && after.some(function (t) { return /:רכז ישן$/.test(t); }), '1: הרכז הקודם נשאר איש קשר', after);
  if (SHOT) await p.screenshot({ path: SHOT + '/2-marked.png', fullPage: true });
  var j = await (await card()).$$eval('.ov-pc', function (L) {
    for (var i = 0; i < L.length; i++) if (L[i].querySelector('.ov-pch') && /^רכז בשטח/.test(L[i].querySelector('.ov-pch').textContent)) return i; return -1;
  });
  await p.fill('#ov-pp-' + idx + '-' + j, PH9);
  await (await (await card()).$('[data-ov="save"]')).click(); await p.waitForTimeout(1500);
  var X = W.priv.getSheetByName('סקירה — אנשי קשר').d, O = W.priv.getSheetByName('סקירה — בעלים').d;
  ok(JSON.stringify(X).indexOf(PH9) >= 0 && JSON.stringify(O).indexOf(PH9) >= 0, '1: טלפון חדש — באיש הקשר ובטלפון הרכז', [X, O]);

  // ---- חלק 2: ההגבלה בבניהול האישי (אוטומטית מ-8.99.541) ----
  await p.evaluate(function (cd) { admGo('stu'); admInstPick(cd); }, code);
  await p.waitForTimeout(2500);
  var acc = await p.$eval('#stu-acc', function (e) { return e.textContent; }).catch(function () { return ''; });
  ok(/רואה רק את הכיתה שלו: שכבה ט׳ · כיתה 3/.test(acc), '2: ר"ם מאושר — הכיתה שלו, בלי מתג', acc.slice(0, 300));
  ok(!/הגבלה לכיתה שלו|מוגבל לכיתה שלו/.test(acc), '2: אין מתג', acc.slice(0, 300));
  if (SHOT) await p.screenshot({ path: SHOT + '/3-acc.png', fullPage: true });

  // ---- חלק 3: ר"ם ממתין בלי כיתה — אין "אישור" עד השלמה ----
  c.appendCols_('התראות', [['מזהה', 'DRAM00009'], ['שם', 'Ram Nine'], ['טלפון', '055' + '0000099'], ['ישיבה', I[4][1]],
    ['קוד ישיבה', code], ['תפקיד', 'רב ומחנך']]);
  c.accAsk_(code, 'DRAM00009', false);
  await p.evaluate(function (cd) { limAt = 0; return Promise.all([accLoad(), limLoad(true)]).then(function () { admGo('stu'); admInstPick(cd); }); }, code).catch(function () {});
  await p.evaluate(function () { return limLoad(true); }); await p.waitForTimeout(2500);
  var rowOf = function () {
    return p.$$eval('#stu-acc .acc-r', function (L) {
      for (var i = 0; i < L.length; i++) if (/Ram Nine/.test(L[i].textContent)) return { t: L[i].textContent, ap: /אישור/.test(L[i].querySelector('.acc-b') ? L[i].querySelector('.acc-b').textContent : '') };
      return null;
    });
  };
  var r9 = await rowOf();
  ok(r9 && !r9.ap && /חסרות שכבה וכיתה/.test(r9.t), '3: חסרה כיתה — בלי כפתור אישור, עם בקשת השלמה', r9);
  if (SHOT) await p.screenshot({ path: SHOT + '/4-need.png', fullPage: true });
  await p.fill('#lim-g-DRAM00009', 'ט'); await p.fill('#lim-c-DRAM00009', '2');
  await p.click('#stu-acc .acc-lim .btn'); await p.waitForTimeout(1500);
  r9 = await rowOf();
  ok(r9 && r9.ap && /שכבה ט · כיתה 2/.test(r9.t), '3: אחרי השלמה — כפתור אישור והכיתה', r9);

  // ---- חלק 4: טופס הצוות — ר"ם בלי שכבה וכיתה נחסם ----
  var f = await p.evaluate(function () {
    var d = document.createElement('div'); d.id = 'ask-test'; document.body.appendChild(d);
    ASK.init({ mount: 'ask-test', key: 'limtest', role: headT('roleYeshiva'),
      roleOptions: [headT('roleYeshiva'), headT('roleRam')], klassRole: headT('roleRam'),
      grades: AMDA_GRADES.map(amdaG), phone: true, phoneReq: true, t: headT, klass: false });
    ASK.open();
    document.getElementById('r-go').click();
    var sel = document.getElementById('r-role'); sel.value = headT('roleRam'); sel.onchange();
    document.getElementById('r-first').value = 'אבג'; document.getElementById('r-last').value = 'דהו';
    document.getElementById('r-phone').value = '050' + '1112223';
    document.getElementById('r-next').click();
    var e1 = (document.querySelector('#asksheet .as-err') || {}).textContent || '';
    var still = !!document.getElementById('r-next');
    document.getElementById('r-grade').value = document.getElementById('r-grade').options[1].value;
    document.getElementById('r-klass').value = '2';
    document.getElementById('r-next').click();
    var e2 = (document.querySelector('#asksheet .as-err') || {}).textContent || '';
    return { e1: e1, still: still, e2: e2, saved: localStorage.getItem('df:limtest') };
  });
  ok(f.still && /שכבה וכיתה/.test(f.e1), '4: בלי כיתה — לא מתקדם, הודעה', f);
  ok(!/שכבה וכיתה/.test(f.e2), '4: עם כיתה — עובר', f);
  ok(!errs.length, 'בלי שגיאות JS', errs);
  await b.close(); srv.close();
  console.log(fails ? 'FAILED ' + fails : 'OK');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.log('ERR', e); process.exit(1); });
