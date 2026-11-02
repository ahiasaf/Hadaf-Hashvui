/* בדיקת רגרסיה: לולאת המסע במכשיר תלמיד (8.99.431).
   ============================================================
   מסע ראש חטיבה (`df:trip`) שנשאר שמור במכשיר שרשום כתלמיד בלבד,
   על שלב שחי בעמוד הראשי (העדכונים — שלב 2, הסיום — s5): join
   שלח ל-`/?masa=1`, העמוד הראשי החזיר תלמיד ל-join, וחוזר חלילה.

   מה נבדק — בכל אחד משני השלבים:
   · תלמיד-בלבד: נשאר ב-join, לא יותר מטעינה אחת, והמצב נמחק.
   · אותו טלפון עם דגל צוות (`df:head`): ההפניה לעמוד הראשי נשארת.

   הרצה (Playwright מותקן בסביבה):  node tools/triptest/loop.js
   יוצא בקוד 1 אם משהו נכשל. שרת קטן משורש הריפו, שמגיש גם בלי
   סיומת (כמו cleanUrls ב-Vercel). בלי רשת: גוגל חסום, ה-SW חסום. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json',
              '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };

function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}

var ME = JSON.stringify({ first:'פלוני', last:'אלמוני', inst:'nertamid', role:'stu', id:'devtest1' });

function run(browser, base, step, staff) {
  return browser.newContext({ serviceWorkers:'block', viewport:{ width:390, height:844 } }).then(function (ctx) {
    var loads = 0, urls = [];
    return ctx.route(/google|gstatic|googleapis/, function (r) { return r.abort(); })
      .then(function () {
        return ctx.addInitScript(function (a) {
          if (sessionStorage.getItem('tt')) return;
          sessionStorage.setItem('tt', '1');
          localStorage.setItem('df:me', a.me);
          localStorage.setItem('df:trip', JSON.stringify({ i:a.step, hail:0, v:2, t:Date.now() }));
          if (a.staff) localStorage.setItem('df:head', '"x"');
        }, { me:ME, step:step, staff:staff });
      })
      .then(function () { return ctx.newPage(); })
      .then(function (p) {
        p.on('framenavigated', function (f) { if (f === p.mainFrame()) { loads++; urls.push(f.url()); } });
        return p.goto(base + '/join?inst=nertamid', { waitUntil:'commit' }).catch(function () {})
          .then(function () { return p.waitForTimeout(6000); })
          .then(function () { return p.evaluate(function () { return localStorage.getItem('df:trip'); }).catch(function () { return '?'; }); })
          .then(function (trip) { return ctx.close().then(function () { return { loads:loads, urls:urls, trip:trip }; }); });
      });
  });
}

serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port, fail = 0;
  return chromium.launch().then(function (browser) {
    var cases = [[2, false], [4, false], [2, true], [4, true]], i = 0;
    var next = function () {
      if (i >= cases.length) return browser.close();
      var c = cases[i++];
      return run(browser, base, c[0], c[1]).then(function (r) {
        var last = r.urls[r.urls.length - 1] || '', ok;
        if (!c[1]) ok = r.loads <= 2 && /\/join/.test(last) && r.trip === null;
        else ok = r.urls.some(function (u) { return /[?&]masa=1/.test(u); });
        if (!ok) fail++;
        console.log((ok ? 'ok   ' : 'FAIL ') + (c[1] ? 'צוות ' : 'תלמיד') + ' · שלב ' + c[0] +
                    ' · טעינות ' + r.loads + ' · אחרונה ' + last.replace(base, '') +
                    ' · df:trip ' + (r.trip === null ? 'נמחק' : 'נשאר'));
        return next();
      });
    };
    return next();
  }).then(function () { srv.close(); process.exit(fail ? 1 : 0); });
}).catch(function (e) { console.error(e); process.exit(1); });
