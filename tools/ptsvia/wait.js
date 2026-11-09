/* חוויית ההמתנה (8.99.478). node tools/ptsvia/wait.js
   בשלושת המקומות — הכרטיסים (בית), מצב השולחן (עמוד האתגר), "לשבת אצל":
   המתנה (הודעה מיד → "לוקח יותר זמן") · הצלחה (התוכן מהשרת, בלי הודעה) ·
   כישלון ("מנסים שוב" רק כשהניסיון הנוסף יוצא → הודעת הכישלון הקיימת). */
var http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var C = { console: console }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), C);
var UI = C.UI;
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
var S = {};   // תסריט לכל בקשה: { pts|my|sit: { direct: 'ok'|'abort'|ms, via: 'ok'|'fail'|ms(+fail) } }
var GOOD_PTS = { status:'ok', n:0, l:[], nx:{ t:1, l:1, q:0, f:0, nr:9 } };
var INV = { status:'ok', on:true, me:{ first:'פלוני', ts:[], inv:[{ n:'נתן', st:'open', c:'ABCD12', t:{ seats:[{ k:'host', n:'נתן' }] } }] } };
var SAT = { status:'ok', on:true, ref:'ok', me:{ first:'פלוני', ts:[], inv:[] } };
function body(kind) { return kind === 'pts' ? GOOD_PTS : kind === 'sit' ? SAT : INV; }
function kindOf(u) { return /pts=me/.test(u) ? 'pts' : /challenge=sit/.test(u) ? 'sit' : /challenge=my/.test(u) ? 'my' : ''; }
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (/^\/api\//.test(p)) {
        var k = kindOf(req.url), plan = (S[k] || {}).via || 'fail', cb = u.searchParams.get('callback') || u.searchParams.get('cb');
        var ms = typeof plan === 'number' ? plan : 0;
        setTimeout(function () {
          if (plan === 'fail' || typeof plan === 'number') { res.writeHead(504); res.end(); return; }
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(cb + '(' + JSON.stringify(body(k)) + ')');
        }, ms);
        return;
      }
      var f = path.join(ROOT, p === '/' ? '/index.html' : p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}
var fails = 0;
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
async function ctxFor(b) {
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  await ctx.route(/script\.google(usercontent)?\.com/, async function (r) {
    var u = r.request().url(), k = kindOf(u), plan = (S[k] || {}).direct || 'ok';
    var m = /[?&](?:callback|cb)=(\w+)/.exec(u);
    if (!k) return r.fulfill({ status: 200, contentType: 'application/javascript', body: m ? m[1] + '({"status":"ok"})' : '{}' });
    if (plan === 'abort') return r.abort();
    if (typeof plan === 'number') await new Promise(function (z) { setTimeout(z, plan); });
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: m[1] + '(' + JSON.stringify(body(k)) + ')' }).catch(function () {});
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  await ctx.addInitScript(function () {
    if (!localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify({ first:'פלוני', last:'אלמוני', inst:'givat', role:'stu', id:'devtest1', grade:'ז' }));
  });
  return ctx;
}
function cardTxt(p) { return p.evaluate(function () { var t = document.getElementById('mytk'); return t ? t.innerText : ''; }); }
function chTxt(p) { return p.evaluate(function () { var b = document.getElementById('chal') || document.querySelector('main') || document.body; return b.innerText; }); }
function sitTxt(p) { return p.evaluate(function () { var e = document.getElementById('ch-sit-m'); return e ? e.textContent : null; }); }
function has(t, s) { return String(t || '').indexOf(s) >= 0; }
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch(), c, p, t;

  // ===== הכרטיסים =====
  S = { pts: { direct: 7000 } };                                     // המתנה, ואז הצלחה
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500); t = await cardTxt(p);
  ok(has(t, UI.myTkLoad), 'כרטיסים · המתנה — "טוענים" מיד', t);
  await p.waitForTimeout(4500); t = await cardTxt(p);
  ok(has(t, UI.netSlow) && !has(t, UI.netRetry), 'כרטיסים · המתנה — "לוקח יותר זמן" (בלי "מנסים שוב")', t);
  await p.waitForTimeout(2500); t = await cardTxt(p);
  ok(has(t, UI.myTkRL) && !has(t, UI.netSlow), 'כרטיסים · המתנה — הכרטיסים אחרי התשובה', t);
  await c.close();
  S = { pts: { direct: 'ok' } };                                     // הצלחה מיידית
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  t = await cardTxt(p);
  ok(has(t, UI.myTkRL) && !has(t, UI.myTkLoad) && !has(t, UI.netSlow), 'כרטיסים · הצלחה — רק הכרטיסים', t);
  await c.close();
  S = { pts: { direct: 'abort', via: 3000 } };                       // כישלון: ישיר נחסם, הניסיון דרכנו נכשל
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  t = await cardTxt(p);
  ok(has(t, UI.myTkErr) && !has(t, UI.netRetry), 'כרטיסים · כישלון — ההודעה הקיימת עד שהניסיון הנוסף יוצא', t);
  await p.waitForTimeout(4500); t = await cardTxt(p);
  ok(has(t, UI.netRetry), 'כרטיסים · כישלון — "מנסים שוב" כשהניסיון הנוסף יוצא', t);
  await p.waitForTimeout(3500); t = await cardTxt(p);
  ok(has(t, UI.myTkErr) && !has(t, UI.myTkRL), 'כרטיסים · כישלון — חזרה להודעה הקיימת, בלי כרטיסים', t);
  await c.close();

  S = { pts: { direct: 7000 } };                                     // שמור במכשיר — מיד, בלי הודעת טעינה
  c = await ctxFor(b);
  await c.addInitScript(function () {
    if (!localStorage.getItem('df:ptsMe')) localStorage.setItem('df:ptsMe', JSON.stringify({ v: 2, id: 'devtest1', at: Date.now() - 3600e3, none: false, n: 0, l: [], tk: null, nx: { t: 1, l: 1, q: 0, f: 0, nr: 9 }, up: '' }));
  });
  p = await c.newPage(); await p.goto(base + '/join', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  t = await cardTxt(p);
  ok(has(t, UI.myTkRL) && !has(t, UI.myTkLoad), 'כרטיסים · שמור במכשיר — מוצג מיד, בלי הודעת טעינה', t);
  await p.waitForTimeout(5000); t = await cardTxt(p);
  ok(!has(t, UI.netSlow), 'כרטיסים · שמור במכשיר — גם בהמתנה ממושכת, בלי הודעה', t);
  await c.close();

  // ===== מצב השולחן (עמוד האתגר) =====
  S = { my: { direct: 22000 } };
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/chaver', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500); t = await chTxt(p);
  ok(has(t, UI.chLoad), 'שולחן · המתנה — "טוענים את השולחן" מיד', t.slice(0, 120));
  await p.waitForTimeout(19500); t = await chTxt(p);
  ok(has(t, UI.netSlow) && !has(t, UI.netRetry), 'שולחן · המתנה — "לוקח יותר זמן"', t.slice(0, 120));
  await p.waitForTimeout(3000); t = await chTxt(p);
  ok(has(t, 'נתן') && !has(t, UI.netSlow) && !has(t, UI.chLoad), 'שולחן · המתנה — השולחן אחרי התשובה', t.slice(0, 160));
  await c.close();
  S = { my: { direct: 'ok' } };
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/chaver', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  t = await chTxt(p);
  ok(has(t, 'נתן') && !has(t, UI.chLoad), 'שולחן · הצלחה — השולחן, בלי הודעה', t.slice(0, 120));
  await c.close();
  S = { my: { direct: 'abort', via: 2500 } };
  c = await ctxFor(b); p = await c.newPage(); await p.goto(base + '/chaver', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  t = await chTxt(p);
  ok(has(t, UI.netRetry), 'שולחן · כישלון — "מנסים שוב" כשהניסיון דרכנו יוצא', t.slice(0, 120));
  await p.waitForTimeout(2500); t = await chTxt(p);
  ok(has(t, UI.chErr) && !has(t, 'נתן'), 'שולחן · כישלון — ההודעה הקיימת', t.slice(0, 120));
  await c.close();

  // ===== "לשבת אצל" =====
  async function sitPage(plan) {
    S = { my: { direct: 'ok' }, sit: plan };
    var cx = await ctxFor(b), pg = await cx.newPage(); await pg.goto(base + '/chaver', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(2000);
    var pk = await pg.$('.ch-pk'); if (pk) await pk.click();
    return { c: cx, p: pg, pk: !!pk };
  }
  var r = await sitPage({ direct: 22000 });
  ok(r.pk, 'לשבת · הכפתור קיים');
  await r.p.waitForTimeout(500); t = await sitTxt(r.p);
  ok(t === UI.chSitWait, 'לשבת · המתנה — "שומרים לך מקום" מיד', t);
  await r.p.waitForTimeout(20000); t = await sitTxt(r.p);
  ok(t === UI.netSlow, 'לשבת · המתנה — "לוקח יותר זמן"', t);
  await r.p.waitForTimeout(2500); t = await sitTxt(r.p);
  var dn = await r.p.$('.ch-pk');
  ok(t !== UI.netSlow && t !== UI.chSitErr && !dn, 'לשבת · המתנה — אחרי התשובה: בלי הודעת המתנה ובלי הכפתור', t);
  await r.c.close();
  r = await sitPage({ direct: 'ok' });
  await r.p.waitForTimeout(1500); t = await sitTxt(r.p);
  ok(t !== UI.chSitErr && t !== UI.netSlow && !(await r.p.$('.ch-pk')), 'לשבת · הצלחה', t);
  await r.c.close();
  r = await sitPage({ direct: 'abort', via: 2500 });
  await r.p.waitForTimeout(800); t = await sitTxt(r.p);
  ok(t === UI.netRetry, 'לשבת · כישלון — "מנסים שוב" כשהניסיון דרכנו יוצא', t);
  await r.p.waitForTimeout(2800); t = await sitTxt(r.p);
  var en = await r.p.$eval('.ch-pk', function (x) { return !x.disabled; }).catch(function () { return false; });
  ok(t === UI.chSitErr && en, 'לשבת · כישלון — ההודעה הקיימת והכפתור חוזר', t);
  await r.c.close();

  await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'הכל תקין');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
