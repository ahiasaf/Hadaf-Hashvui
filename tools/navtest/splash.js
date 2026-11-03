/* בדיקת רגרסיה (8.99.449): מסך הפתיחה הכחול בעמוד הראשי — רק בפתיחה "קרה".
   מעבר מעמוד אחר של האפליקציה (המפנה מאותו אתר) — הכיסוי בצבע העמוד ("quiet").
   וגם: join → "פתיחת הדף" (תלמיד/הורה, עמוד ביניים דלוק/כבוי) אינו טוען את העמוד הראשי.
   הרצה: node tools/navtest/splash.js — קוד 1 אם נכשל. בלי רשת: גוגל חסום, ה-SW חסום. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var TY = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png',
           '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mjs': 'application/javascript' };
var srv = http.createServer(function (q, s) {
  var u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  var f = path.join(ROOT, u);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';   /* cleanUrls כמו ב-Vercel */
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(0);
var B = 'http://localhost:' + srv.address().port + '/', fails = 0;
function ok(c, l) { console.log((c ? 'ok   ' : 'FAIL ') + l); if (!c) fails++; }
async function page(br, ls) {
  var ctx = await br.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block', timezoneId: 'Asia/Jerusalem' });
  await ctx.route('**/script.google.com/**', function (r) {
    var cb = (/[?&](?:callback|cb)=([^&]+)/.exec(r.request().url()) || [])[1], b = '{"status":"ok","rows":[]}';
    r.fulfill({ status: 200, contentType: 'application/javascript', body: cb ? cb + '(' + b + ')' : b });
  });
  await ctx.route('**/docs.google.com/**', function (r) { r.abort(); });
  await ctx.addInitScript(function (a) {
    if (location.origin.indexOf('localhost') < 0) return;
    try { if (!sessionStorage.getItem('_s')) { for (var k in a) localStorage.setItem(k, a[k]); sessionStorage.setItem('_s', '1'); } } catch (e) {}
  }, ls || {});
  return ctx.newPage();
}
function cls(p) { return p.evaluate(function () { var s = document.getElementById('splash'); return s ? s.className : ''; }); }
(async function () {
  var br = await chromium.launch();
  var me = JSON.stringify({ id: 'DTESTKID01', first: 'א', inst: 'lapid', role: 'kid', way: 'self' });
  var dad = JSON.stringify({ id: 'DTESTDAD01', first: 'ב', inst: 'lapid', role: 'dad', way: 'dad' });
  var p = await page(br);
  await p.goto(B, { waitUntil: 'domcontentloaded' });
  ok(!/quiet/.test(await cls(p)), 'פתיחה קרה — מסך הפתיחה הרגיל');
  await p.goto(B + 'accessibility.html'); await p.goto(B + 'index.html#track=taanit', { referer: B + 'bechira.html', waitUntil: 'domcontentloaded' });
  ok(/quiet/.test(await cls(p)), 'מעבר מתוך האפליקציה — בלי הכחול');
  await p.context().close();
  var cases = [['תלמיד, ביניים דלוק', me, '{"rows":{"mid":true}}', 'join'], ['תלמיד, ביניים כבוי', me, '{}', 'join'],
               ['הורה, ביניים דלוק', dad, '{"rows":{"mid":true}}', 'join?for=dad']];
  for (var i = 0; i < cases.length; i++) {
    var C = cases[i], q = await page(br, { 'df:me': C[1], 'df:cfgCache': C[2] }), nav = [];
    q.on('framenavigated', function (f) { if (f === q.mainFrame()) nav.push(f.url().replace(B, '')); });
    await q.goto(B + C[3]); await q.waitForTimeout(2000);
    nav.length = 0;
    await q.click('#wk button.go'); await q.waitForTimeout(2000);
    ok(nav.length && !nav.some(function (u) { return /^(index(\.html)?)?([?#]|$)/.test(u); }), C[0] + ' → ' + (nav[0] || '—'));
    await q.context().close();
  }
  await br.close(); srv.close();
  console.log(fails ? 'נכשלו ' + fails : 'הכול עבר');
  process.exit(fails ? 1 : 0);
})();
