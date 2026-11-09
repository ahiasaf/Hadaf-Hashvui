/* "לצפייה בשובר" (8.99.485) במסכים — node tools/vchtest/ui.js
   בית: פופאפ ברכה (כפתור יחיד, בלי קוד) רק לשובר פעיל שלא נצפה; הכפתור הקבוע מתחת לכרטיסים.
   מסך השובר: vseen נשלח רק אחרי שהכרטיס מוצג; טעינה שנכשלה — לא נשלח; הורה — לא נשלח.
   /zochim: ציבורי — אותה בקשה ואותו מסך; ?r=1 עם סיסמה — פרס, מצב שובר, וואטסאפ, שיוך. */
var http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var C = { console: console }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), C);
var UI = C.UI;
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      var f = path.join(ROOT, p === '/' ? '/index.html' : p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}
var fails = 0, LOG = [];
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
var V1 = { id: 'V1', p: 'pizza', t: 'פיצה', x: '2099-12-31', at: '2026-11-09T10:00:00Z', sn: '', st: 'in', c: 'CODE-123', u: 'https://x.example/1' };
var PRZ = null, PRZ_FAIL = false, WADM = null;
var PUBLIST = { status: 'ok', list: [{ day: '8.11', wk: '6', w: [{ name: 'א ב', inst: 'גבעת שמואל' }] }] };
async function ctxFor(b, me, cfg) {
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  await ctx.route(/script\.google(usercontent)?\.com/, async function (r) {
    var u = r.request().url(); LOG.push(u);
    var m = /[?&](?:callback|cb)=(\w+)/.exec(u), d = { status: 'ok' };
    if (/raffle=prize/.test(u)) { if (PRZ_FAIL) return r.abort(); d = PRZ; }
    else if (/raffle=vseen/.test(u)) d = { status: 'ok', sn: { V1: '2026-11-09T12:00:00Z' } };
    else if (/raffle=wadm/.test(u)) d = /key=k(&|$)/.test(u) ? WADM : { status: 'denied' };
    else if (/raffle=all/.test(u)) d = PUBLIST;
    else if (/raffle=vattach/.test(u)) d = { status: 'ok' };
    return r.fulfill({ status: 200, contentType: m ? 'application/javascript' : 'application/json', body: m ? m[1] + '(' + JSON.stringify(d) + ')' : JSON.stringify(d) }).catch(function () {});
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  await ctx.addInitScript(function (a) {
    if (a.me && !localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify(a.me));
    if (a.cfg) localStorage.setItem('df:cfg', JSON.stringify(a.cfg));
  }, { me: me, cfg: cfg });
  return ctx;
}
var STU = { first: 'פלוני', last: 'אלמוני', inst: 'givat', role: 'stu', id: 'devtest1', grade: 'ז' };
function seenCalls() { return LOG.filter(function (u) { return /raffle=vseen/.test(u); }); }
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch(), c, p, t;
  // ===== בית: פופאפ + כפתור =====
  PRZ = { status: 'ok', list: [{ rid: 'R1', wk: '6', wid: 'devtest1', kid: '', p: 'pizza', how: 'בחר', st: 'soon', v: V1 }] };
  c = await ctxFor(b, STU); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  t = await p.evaluate(function () { var e = document.getElementById('vch-pop'); return e ? { tx: e.innerText, n: e.querySelectorAll('a,button').length } : null; });
  ok(t && t.tx.indexOf(UI.vchPopH) >= 0 && t.tx.indexOf(UI.vchSee) >= 0, 'בית · פופאפ ברכה עם "לצפייה בשובר"', t);
  ok(t && t.n === 1 && t.tx.indexOf('CODE-123') < 0, 'בית · כפתור יחיד, בלי הקוד', t);
  var pos = await p.evaluate(function () {
    var v = document.getElementById('myvch'), k = document.getElementById('mytk'), ch = document.getElementById('chal');
    return { shown: !v.hidden, tx: v.innerText, afterTk: !!(k.compareDocumentPosition(v) & 4), afterCh: !!(ch.compareDocumentPosition(v) & 4), href: v.getAttribute('href') };
  });
  ok(pos.shown && pos.tx.indexOf(UI.vchSee) >= 0 && pos.afterTk && pos.afterCh && pos.href === 'hagrala.html?vch=1', 'בית · כפתור קבוע מתחת לכרטיסים ולמבצע', pos);
  ok(!seenCalls().length, 'בית · הצגת הפופאפ לבדה אינה רושמת צפייה');
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  ok(!(await p.$('#vch-pop')), 'בית · באותה פתיחה (רענון) — לא שוב');
  // לחיצה → מסך השובר → vseen
  await c.close(); c = await ctxFor(b, STU); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  LOG = [];
  await p.click('#vch-pop-y'); await p.waitForTimeout(2500);
  t = await p.evaluate(function () { return document.body.innerText; });
  ok(/hagrala/.test(p.url()) && t.indexOf('CODE-123') >= 0, 'לחיצה · מסך השובר עם הקוד', p.url());
  ok(seenCalls().length === 1 && /vid=V1/.test(seenCalls()[0]) && /id=devtest1/.test(seenCalls()[0]), 'לחיצה · vseen נשלח אחרי ההצגה', seenCalls());
  await c.close();
  // שובר שכבר נצפה — אין פופאפ, הכפתור נשאר; מסך השובר לא שולח
  PRZ = { status: 'ok', list: [{ rid: 'R1', p: 'pizza', st: 'soon', v: Object.assign({}, V1, { sn: '2026-11-09T12:00:00Z' }) }] };
  c = await ctxFor(b, STU); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  ok(!(await p.$('#vch-pop')) && !(await p.evaluate(function () { return document.getElementById('myvch').hidden; })), 'נצפה · בלי פופאפ, הכפתור נשאר');
  LOG = []; await p.goto(base + '/hagrala.html?vch=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  ok(!seenCalls().length, 'נצפה · פתיחה חוזרת לא שולחת שוב');
  await c.close();
  // טעינה שנכשלה — לא נרשם
  PRZ = { status: 'ok', list: [{ rid: 'R1', p: 'pizza', st: 'soon', v: V1 }] }; PRZ_FAIL = true;
  c = await ctxFor(b, STU); p = await c.newPage(); LOG = [];
  await p.goto(base + '/hagrala.html?vch=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  ok(!seenCalls().length, 'כישלון · מסך שלא נטען — לא נרשם');
  await c.close(); PRZ_FAIL = false;
  // הורה — רואה, לא רושם
  c = await ctxFor(b, { first: 'אבא', inst: 'givat', role: 'dad', id: 'devdad1' }); p = await c.newPage(); LOG = [];
  PRZ = { status: 'ok', list: [{ rid: 'R1', p: 'pizza', st: 'soon', kid: 'פלוני', v: V1 }] };
  await p.goto(base + '/hagrala.html?vch=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  ok((await p.evaluate(function () { return document.body.innerText; })).indexOf('CODE-123') >= 0 && !seenCalls().length, 'הורה · רואה את השובר, לא נרשם');
  await c.close();
  // מומש שלא נצפה — אין פופאפ
  PRZ = { status: 'ok', list: [{ rid: 'R1', p: 'pizza', st: 'soon', v: Object.assign({}, V1, { st: 'used' }) }] };
  c = await ctxFor(b, STU); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  ok(!(await p.$('#vch-pop')), 'מומש · בלי פופאפ');
  await c.close();
  // בלי שובר — בלי כפתור ובלי פופאפ
  PRZ = { status: 'ok', list: [] };
  c = await ctxFor(b, STU); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  ok(!(await p.$('#vch-pop')) && (await p.evaluate(function () { return document.getElementById('myvch').hidden; })), 'בלי שובר · אין כפתור ואין פופאפ');
  await c.close();
  // ===== /zochim =====
  c = await ctxFor(b, null, null); p = await c.newPage(); LOG = [];
  await p.goto(base + '/zochim', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  var pubHtml = await p.evaluate(function () { return document.getElementById('res').innerHTML; });
  ok(LOG.some(function (u) { return /raffle=all/.test(u); }) && !LOG.some(function (u) { return /wadm|key=/.test(u); }), 'ציבורי · אותה בקשה, בלי סיסמה');
  await p.goto(base + '/zochim?r=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  ok(pubHtml === await p.evaluate(function () { return document.getElementById('res').innerHTML; }), 'ציבורי · r=1 בלי סיסמה — אותו מסך');
  await c.close();
  WADM = { status: 'ok', vs: { book: 2, pizza: 0 }, von: 1, list: [{ day: '8.11', wk: '6', rid: 'R1', w: [
    { name: 'א ב', inst: 'גבעת שמואל', code: 'givat', p: 'pizza', how: 'בחר', st: 'soon', ph: '0500000001', first: 'א', v: Object.assign({}, V1, { sn: '2026-11-09T12:00:00Z' }) },
    { name: 'ג ד', inst: 'ראשון', code: 'rishon', p: 'book', how: 'רכז', st: 'soon', na: 1, co: { n: 'רכז א', ph: '0500000002' } },
    { name: 'ה ו', inst: 'נר תמיד', code: 'nertamid', p: '', st: 'pick', ph: '' }] }] };
  c = await ctxFor(b, null, { readKey: 'k' }); p = await c.newPage(); LOG = [];
  await p.goto(base + '/zochim?r=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  var li = await p.evaluate(function () { return Array.prototype.map.call(document.querySelectorAll('.wl li'), function (l) {
    return { tx: l.innerText, wa: Array.prototype.map.call(l.querySelectorAll('a.wa'), function (a) { return a.href; }), sel: !!l.querySelector('select'), att: !!l.querySelector('.cob button') }; }); });
  ok(li[0] && li[0].tx.indexOf('נצפה') >= 0 && li[0].wa.length === 1 && li[0].wa[0].indexOf('972500000001') >= 0, 'רכז · נצפה + וואטסאפ לזוכה', li[0]);
  ok(li[1] && li[1].tx.indexOf(UI.vchStNone) >= 0 && li[1].wa[0].indexOf('972500000002') >= 0 && li[1].att, 'רכז · בלי אפליקציה — וואטסאפ לרכז; פרס בלי שובר — "שיוך שובר"', li[1]);
  ok(li[2] && li[2].sel && !li[2].att, 'רכז · בלי פרס — סימון הבחירה', li[2]);
  LOG = []; await p.click('.wl li:nth-child(2) .cob button'); await p.waitForTimeout(5500);
  ok(LOG.some(function (u) { return /raffle=vattach/.test(u) && /rid=R1/.test(u) && /code=rishon/.test(u) && /key=k/.test(u); }), 'רכז · שיוך שובר אחרי "ביטול · 4"', LOG);
  await c.close();
  await b.close(); srv.close();
  console.log(fails ? fails + ' failed' : 'all ok');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
