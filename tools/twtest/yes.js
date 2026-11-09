/* "זה אתה?" → "כן" מושך מיד את הנוכחות שאוחדה (8.99.481). node tools/twtest/yes.js
   1. "כן" — בקשת ?amdaFor= אחת מיד, והשבוע מסומן במכשיר (df:learned).
   2. ישירה לגוגל; כשהישירה חסומה — דרך /api/gs (אותו LJsonp).
   3. רבע השעה נשמרת: חזרה מהרקע אחרי ה"כן" — בלי בקשה נוספת.
   4. "לא" — בלי בקשת amdaFor נוספת. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
var WK = 'taanit|4', LOG = [], BLOCK = false, ASKED = 0;
function answer(u) {
  if (/twin=ask/.test(u)) return ASKED ? { status: 'ok', q: [] } : (ASKED = 1, { status: 'ok', q: [{ k: 'K1', n: 'פלוני', g: 'ז', c: '3' }] });
  if (/twin=ans/.test(u)) return { status: 'ok' };
  if (/amdaFor=/.test(u)) return { status: 'ok', learned: ASKED > 1 ? [WK] : [], par: [] };
  return { status: 'ok' };
}
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (p === '/api/gs') {
        LOG.push('via ' + req.url);
        var cb = u.searchParams.get('callback') || u.searchParams.get('cb');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(cb + '(' + JSON.stringify(answer(req.url)) + ')'); return;
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
function amda() { return LOG.filter(function (x) { return /amdaFor=/.test(x); }); }
async function run(b, base, yes, block) {
  LOG = []; BLOCK = block; ASKED = 0;
  var ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var u = r.request().url();
    LOG.push('direct ' + u.replace(/^.*\/exec/, ''));
    if (BLOCK && /amdaFor=|twin=/.test(u)) return r.abort();
    var m = /[?&](?:callback|cb)=(\w+)/.exec(u);
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: m ? m[1] + '(' + JSON.stringify(answer(u)) + ')' : '{}' });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  await ctx.addInitScript(function () {
    if (!localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify({ first: 'פלוני', last: 'אלמוני', inst: 'givat', role: 'stu', id: 'devtest1', grade: 'ז' }));
  });
  var p = await ctx.newPage();
  await p.goto(base + '/join', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('#tw-y', { timeout: 15000 }).catch(function () {});
  await p.waitForTimeout(4000);                        // הסנכרון של הפתיחה (3 שנ') כבר רץ
  var before = amda().length;
  ASKED = 2;                                           // מעכשיו השרת "מחזיר" את השבוע שאוחד
  var btn = await p.$(yes ? '#tw-y' : '#tw-n');
  if (btn) await btn.click();
  await p.waitForTimeout(2500);
  var after = amda().length;
  var learned = await p.evaluate(function () { try { return JSON.parse(localStorage.getItem('df:learned') || '{}'); } catch (e) { return {}; } });
  // חזרה מהרקע — רבע השעה צריכה לחסום
  await p.evaluate(function () { Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return false; } }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(1500);
  var again = amda().length;
  await ctx.close();
  return { btn: !!btn, before: before, after: after, again: again, learned: learned, log: amda() };
}
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var r = await run(b, base, true, false);
  ok(r.btn, '1. החלונית "זה אתה?" הופיעה');
  ok(r.before === 1 && r.after === 2, '1. "כן" — בקשת amdaFor אחת נוספת, מיד', r.log);
  ok(r.learned && r.learned[WK], '1. השבוע שאוחד מסומן במכשיר', r.learned);
  ok(r.again === r.after, '3. חזרה מהרקע אחרי "כן" — בלי בקשה נוספת (רבע השעה)', r.log);
  ok(/^direct /.test(r.log[r.log.length - 1]), '2. ישירה לגוגל כשהיא עובדת', r.log);
  r = await run(b, base, true, true);
  ok(r.after === r.before + 1 && /^via \/api\/gs\?amdaFor=/.test(r.log[r.log.length - 1]) && r.learned[WK],
     '2. חסום — אותה בקשה דרך /api/gs, והשבוע מסומן', r.log);
  r = await run(b, base, false, false);
  ok(r.btn && r.after === r.before, '4. "לא" — בלי בקשת amdaFor נוספת', r.log);
  await b.close(); srv.close();
  console.log(fails ? 'נכשל: ' + fails : 'הכל תקין');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
