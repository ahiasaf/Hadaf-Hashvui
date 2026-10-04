/* ============================================================
   צילום מסכי ההצטרפות — לניהול ← התקנה ← מחקר ← "זמן בכל מסך".
   ============================================================
   הניהול מציג כל מסך של join.html בתמונה, ועליה כמה זמן שהו בו.
   התמונות ב-joinpics/ צולמו מהקוד האמיתי, בטלפון אנדרואיד בגודל
   390×844. **שיניתם מסך בהצטרפות — מריצים שוב:**

       node tools/joinpics.js

   הסקריפט מרים שרת מקומי משורש הריפו (כמו Vercel, בלי `.html`),
   חוסם כל בקשה החוצה — כך שאף צילום לא נספר ככניסה אמיתית ולא
   נכתב לגיליון — ומצלם כל מסך דרך הפונקציות של הדף עצמו.

   שני דברים שאינם כמו בשטח, בכוונה:
   · ההדגמה במסך הפתיחה: הסימונים שלה באים מהגיליון, שחסום כאן,
     ולכן בתוך החלון מוצג עמוד הגמרא עצמו.
   · בקשת ההתראות מוצגת במצב "עוד לא נשאלו" — מה שרוב התלמידים
     רואים — ולא "חסומות", שהוא ברירת המחדל של דפדפן אוטומטי.

   צריך Playwright (מותקן בסביבת הפיתוח). הפלט: webp ברוחב 360.
   ============================================================ */
var http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');

var ROOT = path.dirname(__dirname), OUT = path.join(ROOT, 'joinpics'), PORT = 8897;
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
              '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
              '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
/* מה מצלמים: קוד המסך (כמו ב-trlScr) ← שלב במסע. */
var STEPS = [2, 3, 4, 9, 8];

function serve() {
  return http.createServer(function (q, r) {
    var u = decodeURIComponent(q.url.split('?')[0]);
    if (/\/$/.test(u)) u += 'index.html';
    var f = path.join(ROOT, u);
    if (f.indexOf(ROOT) !== 0) { r.writeHead(403); return r.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    fs.readFile(f, function (e, d) {
      if (e) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      r.end(d);
    });
  }).listen(PORT);
}

function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

/* צילום מלא (פי 2) ← webp ברוחב 360, דרך הדפדפן עצמו — בלי ספריות נוספות. */
function save(page, shot, name) {
  var src = 'data:image/png;base64,' + shot.toString('base64');
  return page.evaluate(function (src) {
    var i = new Image();
    i.src = src;
    return i.decode().then(function () {
      var W = 360, H = Math.round(i.height * W / i.width), c = document.createElement('canvas');
      c.width = W; c.height = H;
      var x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(i, 0, 0, W, H);
      return c.toDataURL('image/webp', 0.72);
    });
  }, src).then(function (d) {
    fs.writeFileSync(path.join(OUT, name + '.webp'), Buffer.from(d.split(',')[1], 'base64'));
    console.log('  ✓ joinpics/' + name + '.webp');
  });
}

(async function () {
  var srv = serve(), b = await pw.chromium.launch();
  try {
    fs.mkdirSync(OUT, { recursive: true });
    var c = await b.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      locale: 'he-IL',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
                 'Chrome/120.0 Mobile Safari/537.36' });
    /* שום דבר לא יוצא מהמחשב: לא הגיליון, לא הסקריפט, לא הספירה. */
    await c.route(new RegExp('^(?!http://localhost:' + PORT + ')'), function (r) { r.abort(); });
    await c.addInitScript(function () {
      try { Object.defineProperty(Notification, 'permission', { get: function () { return 'default'; } }); } catch (e) {}
    });
    var p = await c.newPage();
    p.on('pageerror', function (e) { console.log('  ! ' + e.message); });
    await p.goto('http://localhost:' + PORT + '/join', { waitUntil: 'load' });
    await wait(1500);

    await p.evaluate(function () {
      var f = document.getElementById('demo-frame');
      if (!f) return;
      f.removeAttribute('src');
      f.srcdoc = '<body style="margin:0;background:#f5f0e6">' +
        '<img src="/daf/taanit/%D7%91-a.webp" style="width:100%;display:block"></body>';
    });
    await wait(800);
    await save(p, await p.screenshot(), 'land');

    await p.evaluate(function () { wzStart(); });
    await wait(900);
    await save(p, await p.screenshot(), 'w1');

    /* מכאן — כאילו האפליקציה כבר מותקנת, כמו אצל מי שהמשיך. */
    await p.evaluate(function () { APPX.installed = function () { return true; }; });
    for (var i = 0; i < STEPS.length; i++) {
      await p.evaluate(function (n) { wzGo(n); window.scrollTo(0, 0); }, STEPS[i]);
      await wait(900);
      await save(p, await p.screenshot(), 'w' + STEPS[i]);
    }
  } finally {
    await b.close();
    srv.close();
  }
})().catch(function (e) { console.error(e); process.exit(1); });
