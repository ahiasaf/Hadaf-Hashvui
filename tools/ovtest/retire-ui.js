/* פרישת מוקד השיחות (8.99.526) — העמוד הראשי האמיתי מול apps-script.gs בזיכרון.
   NODE_PATH=$(npm root -g) node tools/ovtest/retire-ui.js [תיקייה לצילומים]
   ניווט בלי "מוקד שיחות" · מסר לישיבות עם ממלאי מקום · תיעוד שיחה עם פרשה, אחרי רענון ·
   סבב (יצירה, שתי ישיבות, ביטול, הסרה — והתיעוד נשאר) · מצב השתתפות מ"עדכון" וספירת "הצטרפו" ·
   הכלים מ"כלים ←". שמות ומספרים מומצאים. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..'), M = require('../snaptest/mock.js');
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
  W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
  var I = c.OV_INST_;
  var T0 = W.pub.insertSheet(c.OV_TAB_);
  T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
  T0.appendRow([I[4][1], I[4][0], '', '', '', '', '']);
  T0.appendRow([I[0][1], I[0][0], '', '', '', '', '']);
  var K = W.priv.insertSheet('אנשי קשר');
  K.appendRow(['ישיבה', 'איש קשר', 'טלפון']);
  K.appendRow([I[4][1], 'הרב פלוני', '0501234567']);
  K.appendRow([I[0][1], 'הרב אלמוני', '0521234567']);
  var J = W.priv.insertSheet('יומן שיחות');
  J.appendRow(['ישיבה', 'סטטוס', 'הערה', 'מתי', 'איש קשר', 'עריכה', 'סבב', 'תגיות', 'עדכון', 'צוות']);
  J.appendRow([I[4][1], 'joined', 'הערה ישנה', '2026-10-01T10:00:00.000Z', 'הרב פלוני', '', '', '{}', '', '']);
  var other = W.pub.getSheets().map(function (s) { return s.getName ? s.getName() : ''; });
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
  async function open() {
    await p.evaluate(function () { CFG.readKey = 'k'; show('admin'); admGo('inst'); admSubGo('calls'); });
    await p.waitForTimeout(2500);
  }
  await p.goto(base + '/'); await p.waitForTimeout(1200);
  await open();
  var tabs = await p.$$eval('#calls-body .tabs.sub button', function (L) { return L.map(function (x) { return x.textContent; }); });
  ok(tabs.join('|') === 'סקירת הישיבות|רכזים|מסר לישיבות', '1: הניווט — בלי "מוקד שיחות"', tabs);
  ok(await p.$('#ov-adm .ov-r') !== null, '1: הסקירה מוצגת');
  if (SHOT) await p.screenshot({ path: SHOT + '/1-ov.png', fullPage: true });

  // מסר לישיבות
  await p.evaluate(function () { yshTabGo('msg'); }); await p.waitForTimeout(300);
  var msg = await p.evaluate(function () {
    var el = document.getElementById('calls-body');
    var a = el.querySelector('a[href*="wa.me/972"]');
    return { txt: el.textContent, ta: !!el.querySelector('textarea'), wa: a ? decodeURIComponent(a.getAttribute('href')) : '',
             kish: !!el.querySelector('a[href*="kishurim"]') };
  });
  ok(msg.ta && msg.kish && /הודעה לכולם/.test(msg.txt), '2: מסר לישיבות — הנוסח, הקישורים לראש ישיבה', msg.txt.slice(0, 120));
  ok(msg.wa && !/\{name\}|\{greet\}|\{inst\}|\{url\}/.test(msg.wa) && /פלוני|אלמוני/.test(msg.wa) && /\?m=/.test(msg.wa), '2: ממלאי המקום הוחלפו בתצוגה ובשליחה', msg.wa.slice(0, 200));
  if (SHOT) await p.screenshot({ path: SHOT + '/2-msg.png', fullPage: true });

  // תיעוד שיחה
  await p.evaluate(function () { yshTabGo('ov'); }); await p.waitForTimeout(400);
  var row = '#ov-adm .ov-r';
  var idx = await p.$$eval(row, function (L, nm) {
    for (var i = 0; i < L.length; i++) if (L[i].querySelector('.ov-n').textContent === nm) return i; return -1;
  }, I[4][1]);
  async function card() { return (await p.$$(row))[idx]; }
  await (await (await card()).$('.ov-x')).click(); await p.waitForTimeout(200);
  await (await (await card()).$('[data-ov="jopen"]')).click();
  await p.fill('#ov-jt-' + idx, 'דיברנו על פתיחת הסבב');
  await (await (await card()).$('[data-ov="jsave"]')).click();
  await p.waitForTimeout(1500);
  var ents = J.d.filter(function (r) { return r[1] === 'תיעוד'; });
  ok(ents.length === 1 && ents[0][2] === 'דיברנו על פתיחת הסבב' && ents[0][0] === I[4][1], '3: נכתב בלשונית "יומן שיחות"', J.d);
  var t0 = Date.parse(ents[0][3]), d0 = new Date(t0);
  var dStr = d0.getDate() + '.' + (d0.getMonth() + 1) + '.' + d0.getFullYear();
  var par = await p.evaluate(function (t) { return ovParasha(t); }, t0);
  ok(!!par, '3: יש פרשה לשבוע הזה', par);
  // רענון
  await p.reload(); await p.waitForTimeout(1200); await open();
  idx = await p.$$eval(row, function (L, nm) {
    for (var i = 0; i < L.length; i++) if (L[i].querySelector('.ov-n').textContent === nm) return i; return -1;
  }, I[4][1]);
  var jl = await (await card()).$eval('.ov-c.jl', function (e) { return e.textContent; }).catch(function () { return ''; });
  ok(jl.indexOf(dStr) === 0 && jl.indexOf(par) > 0 && /דיברנו/.test(jl), '3: אחרי רענון — שורה בכרטיס הסגור (תאריך · פרשה · תחילת המשפט)', jl);
  await (await (await card()).$('.ov-x')).click(); await p.waitForTimeout(200);
  var hist = await (await card()).$eval('.ov-jh', function (e) { return e.textContent; }).catch(function () { return ''; });
  ok(/היסטוריית תיעוד \(1\)/.test(hist) && /דיברנו על פתיחת הסבב/.test(hist), '3: ההיסטוריה המלאה נפתחת מהכרטיס', hist);
  if (SHOT) await p.screenshot({ path: SHOT + '/3-jnl.png', fullPage: true });

  // סבבים
  await p.click('.ov-rbar .ov-rd'); await p.waitForTimeout(150);
  await p.fill('#rnd-n', 'סבב חנוכה');
  await p.click('.ov-rnew .ov-rk-b'); await p.waitForTimeout(100);
  await p.click('.ov-rnew .ov-fb .p'); await p.waitForTimeout(1200);
  var R = W.priv.getSheetByName('סבבים');
  ok(R && R.d.length === 2 && R.d[1][1] === 'סבב חנוכה' && R.d[1][2] === 'b', '4: סבב נוצר עם שם וצבע', R && R.d);
  // סימון שתי ישיבות
  async function tog(nm) {
    var i = await p.$$eval(row, function (L, nm) {
      for (var k = 0; k < L.length; k++) if (L[k].querySelector('.ov-n').textContent === nm) return k; return -1;
    }, nm);
    var cd = (await p.$$(row))[i];
    if (!(await cd.$('.ov-rd'))) { await (await cd.$('.ov-x')).click(); await p.waitForTimeout(150); cd = (await p.$$(row))[i]; }
    await (await cd.$('.ov-rd')).click(); await p.waitForTimeout(1200);
  }
  await tog(I[4][1]); await tog(I[0][1]);
  ok(R.d[1][3].split(',').sort().join() === [I[4][0], I[0][0]].sort().join(), '4: שתי ישיבות מסומנות', R.d[1]);
  var pills = await p.$$eval('#ov-adm .ov-rps .ov-rp', function (L) { return L.length; });
  ok(pills === 2, '4: התווית בכרטיסים', pills);
  if (SHOT) await p.screenshot({ path: SHOT + '/4-rnd.png', fullPage: true });
  await tog(I[0][1]);
  ok(R.d[1][3] === I[4][0], '4: ביטול סימון', R.d[1]);
  var jBefore = JSON.stringify(J.d);
  await p.click('.ov-rbar .ov-rp button'); await p.waitForTimeout(5200);
  ok(R.d.length === 1, '4: הסבב הוסר (אחרי "ביטול · 4")', R.d);
  ok(JSON.stringify(J.d) === jBefore, '4: התיעוד נשאר', '');

  // מצב השתתפות מ"עדכון"
  var cnt0 = await p.evaluate(function () { return contacts().filter(function (c) { return c.stage === 'joined'; }).length; });
  idx = await p.$$eval(row, function (L, nm) {
    for (var i = 0; i < L.length; i++) if (L[i].querySelector('.ov-n').textContent === nm) return i; return -1;
  }, I[0][1]);
  var cd = (await p.$$(row))[idx];
  if (!(await cd.$('[data-ov="edit"]'))) { await (await cd.$('.ov-x')).click(); await p.waitForTimeout(150); }
  await (await (await card()).$('[data-ov="edit"]')).click(); await p.waitForTimeout(200);
  await p.selectOption('#ov-sg-' + idx, 'warm');
  await (await (await card()).$('[data-ov="save"]')).click(); await p.waitForTimeout(1500);
  var jr = J.d.filter(function (r) { return r[0] === I[0][1] && r[1] !== 'תיעוד'; })[0];
  ok(jr && jr[1] === 'warm', '5: נשמר ב"יומן שיחות"', J.d);
  var shown = await (await card()).$eval('.ov-b', function (e) { return e.textContent; });
  ok(/מצב השתתפות: מתעניין/.test(shown), '5: מוצג בכרטיס', shown.slice(0, 200));
  var cnt1 = await p.evaluate(function () { return contacts().filter(function (c) { return c.stage === 'joined'; }).length; });
  ok(cnt0 === cnt1 && cnt1 === 1, '5: ספירת "הצטרפו" לא השתנתה', [cnt0, cnt1]);
  // אחרי רענון מהגיליון — עדיין
  await p.reload(); await p.waitForTimeout(1200); await open();
  var st2 = await p.evaluate(function (code) {
    var r = ovRows().filter(function (x) { return x.code === code; })[0]; return ovStgOf(r);
  }, I[0][0]);
  ok(st2 === 'warm', '5: אחרי רענון', st2);

  // הכלים
  await p.click('#calls-body > button.back'); await p.waitForTimeout(600);
  var tools = await p.$eval('#calls-body', function (e) { return e.textContent; });
  ok(/ניהול תגיות/.test(tools) && /ייבוא מרשימה/.test(tools) && /יומן התיעוד/.test(tools) && /מחיקת הרשימה מהמכשיר/.test(tools) &&
     /הסבב הנוכחי/.test(tools) && /הצטרפו/.test(tools), '6: הכלים נגישים מ"כלים ←"', tools.slice(0, 200));
  ok(!/הודעה לכולם/.test(tools), '6: ההודעה המרוכזת עברה (לא כפולה)');
  ok(/1 מתוך 2 ישיבות הצטרפו/.test(tools), '6: "הצטרפו" בכלים', (tools.match(/\d+ מתוך \d+ ישיבות הצטרפו/) || [''])[0]);
  if (SHOT) await p.screenshot({ path: SHOT + '/6-tools.png', fullPage: true });
  await p.click('#calls-body > button.back'); await p.waitForTimeout(400);
  ok(await p.$('#ov-adm') !== null, '6: חזרה לסקירה');
  // המוקד הישן שומר — התיעוד לא נמחק
  await p.evaluate(function () { pushCalls(1); }); await p.waitForTimeout(2000);
  ok(J.d.filter(function (r) { return r[1] === 'תיעוד'; }).length === 1, '7: שמירה מהכלים — התיעוד נשאר', J.d);
  var pubNow = W.pub.getSheets().map(function (s) { return s.getName ? s.getName() : ''; });
  ok(pubNow.indexOf('סבבים') < 0 && pubNow.indexOf('יומן שיחות') < 0, '8: הסבבים והתיעוד לא בגיליון הציבורי', pubNow.filter(function (x) { return other.indexOf(x) < 0; }));
  ok(!errs.length, 'בלי שגיאות JS', errs);
  await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'OK'); process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
