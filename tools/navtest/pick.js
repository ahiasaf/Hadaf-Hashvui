/* בדיקת רגרסיה: "פתיחת הדף" במסך התלמיד ועמוד הבחירה (8.99.432).
   ============================================================
   לכל אחד מששת המסלולים הקיימים (המסכת × רגיל / השלמה / נר תמיד),
   לתלמיד ולהורה (`for=dad`, עם `show=1`):

   א. join → "פתיחת הדף" → עמוד הבחירה של אותו מסלול ושבוע, בלי העמוד הראשי.
   ב. "זכרו את הבחירה": כבוי — עמוד הבחירה · הדף האינטראקטיבי (מסומן) — ישר
      לדף, בלי העמוד הראשי · הדף לא מסומן — עמוד הבחירה · הסוגיה — חלון
      חדש לאותה כתובת של הכרטיס, ו-join נשאר · הסוגיה כבויה — עמוד הבחירה.
   ג. עמוד הבחירה → הדף → "יציאה" חוזרת לעמוד הבחירה של אותו מסלול ושבוע,
      עם ההורה; העמוד שנפתח מציג אותו מסלול (לא נופל ל-join).
   ד. מכשיר צוות — היציאה ל-`./#week=` והעמוד הראשי פותח את המסלול הזה;
      `#track=` ו-`#quiz=`/`#yomi=` עם מזהה מסלול עם מקף נקלטים.

   הרצה (Playwright מותקן בסביבה):  node tools/navtest/pick.js
   יוצא בקוד 1 אם משהו נכשל. בלי רשת: גוגל חסום, ה-SW חסום. */
var http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json',
              '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };

/* המסלולים — מ-data.js עצמו, לא רשימה ביד. */
var C = { console: console }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), C);
var TR = [];
C.TRACKS.forEach(function (t) {
  TR.push({ id:t.id, mas:t.id, hash:0 });
  C.TRACKS_HASHLAMA.forEach(function (h) {
    if (C.TrackBase(h.id) === t.id) TR.push({ id:h.id, mas:t.id, hash:h.fam === 'nertamid' ? 2 : 1 });
  });
});

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

var fail = 0;
function ok(cond, what) { if (!cond) fail++; console.log((cond ? 'ok   ' : 'FAIL ') + what); }

/* כל הדפים מסומנים, כדי שהכרטיס של הדף האינטראקטיבי יופיע */
function marked() {
  var m = {};
  C.TRACKS.forEach(function (t) {
    m[t.id] = {};
    t.cal.forEach(function (r) { if (r[2]) m[t.id][String(r[2]).replace(/["'׳״\s]/g, '')] = 1; });
  });
  return m;
}

function ctxFor(browser, ls) {
  return browser.newContext({ serviceWorkers:'block', viewport:{ width:390, height:844 } }).then(function (ctx) {
    return ctx.route(/google|gstatic|googleapis/, function (r) { return r.abort(); }).then(function () {
      return ctx.addInitScript(function (ls) {
        if (sessionStorage.getItem('nt')) return;
        sessionStorage.setItem('nt', '1');
        for (var k in ls) localStorage.setItem(k, ls[k]);
      }, ls);
    }).then(function () { return ctx; });
  });
}

/* מכשיר תלמיד/הורה במסלול tr. */
function devLs(tr, dad, cfg, keep) {
  var me = { first:'פלוני', last:'אלמוני', inst:'nertamid', role: dad ? 'dad' : 'stu', id:'devtest1', grade:'ז' };
  var ls = {
    'df:me': JSON.stringify(me), 'dfHomeTrack': tr.mas, 'df:hash': String(tr.hash),
    'df:cfgCache': JSON.stringify(cfg), 'df:markedCache': JSON.stringify(marked())
  };
  if (keep) { ls['df:wkKeep'] = '1'; ls['df:wkPick'] = JSON.stringify(keep); }
  return ls;
}

/* "פתיחת הדף" ב-join: לאן הלך, אילו עמודים נטענו, ואילו חלונות נפתחו. */
function stWeek(browser, base, tr, dad, cfg, keep) {
  return ctxFor(browser, devLs(tr, dad, cfg, keep)).then(function (ctx) {
    return ctx.newPage().then(function (p) {
      var docs = [], pops = [];
      p.on('request', function (r) { if (r.resourceType() === 'document') docs.push(r.url().replace(base, '')); });
      p.on('popup', function (w) { pops.push(w.url()); });
      return p.goto(base + '/join?inst=nertamid' + (dad ? '&for=dad&show=1' : ''))
        .then(function () { return p.waitForTimeout(1200); })
        .then(function () {
          return p.evaluate(function () {
            var o = window.open; window.__open = [];
            window.open = function (u) { window.__open.push(u); return { opener:1 }; };
            return myTrack();
          });
        })
        .then(function (mt) {
          return p.evaluate(function () { stWeek(); return window.__open.slice(); }).catch(function () { return []; })
            .then(function (opened) {
              return p.waitForTimeout(1500).then(function () {
                var r = { mt:mt, url:p.url().replace(base, ''), docs:docs.slice(1), opened:opened, page:p, ctx:ctx };
                return r;
              });
            });
        });
    });
  });
}

serve().then(function (srv) {
  var base = 'http://127.0.0.1:' + srv.address().port;
  return chromium.launch().then(function (browser) {
    var jobs = [];
    TR.forEach(function (tr) { [false, true].forEach(function (dad) { jobs.push([tr, dad]); }); });
    var MID = { rows:{ mid:true } };
    var next = function () {
      if (!jobs.length) return browser.close();
      var j = jobs.shift(), tr = j[0], dad = j[1], who = tr.id + (dad ? ' · הורה' : ' · תלמיד');
      var dq = dad ? '&for=dad&show=1' : '';
      var noIdx = function (r) { return !r.docs.some(function (u) { return /^\/(index(\.html)?)?([?#]|$)/.test(u); }); };
      var wkRe;
      /* א + ג */
      return stWeek(browser, base, tr, dad, MID, null).then(function (r) {
        ok(r.mt === tr.id, who + ' · המסלול במכשיר (' + r.mt + ')');
        wkRe = new RegExp('^/bechira(\\.html)?\\?st=1&inst=nertamid' + dq.replace(/&/g, '&') + '#week=' + tr.id + '-\\d+$');
        ok(wkRe.test(r.url) && noIdx(r), who + ' · פתיחת הדף → עמוד הבחירה (' + r.url + ')');
        var p = r.page;
        return p.evaluate(function () { var a = document.querySelector('#w-inter a'); return a && a.getAttribute('href'); })
          .then(function (href) {
            ok(!!href && href.indexOf('ret=pick-' + tr.id + '-') > 0, who + ' · הכרטיס נושא את החזרה');
            return p.goto(base + '/' + href).then(function () { return p.waitForTimeout(1500); })
              .then(function () { return p.evaluate(function () { return stuHomeUrl(); }); })
              .then(function (back) {
                var want = r.url.replace(/^\/bechira(\.html)?/, 'bechira.html');
                ok(back === want, who + ' · יציאה מהדף → ' + back);
                return p.goto(base + '/' + back).then(function () { return p.waitForTimeout(900); })
                  .then(function () { return p.evaluate(function () { return location.pathname + '|' + WK.id; }); })
                  .then(function (at) { ok(/bechira/.test(at) && at.split('|')[1] === tr.id, who + ' · עמוד הבחירה נפתח שוב על המסלול (' + at + ')'); });
              });
          })
          .then(function () { return r.ctx.close(); });
      })
      /* ב — "זכרו את הבחירה" */
      .then(function () { return stWeek(browser, base, tr, dad, MID, 'inter'); }).then(function (r) {
        ok(/^\/learn(\.html)?\?/.test(r.url) && r.url.indexOf('ret=') < 0 && noIdx(r) &&
           (!dad || /for=dad/.test(r.url)) && (!/-/.test(tr.id) || r.url.indexOf('tr=' + tr.id) > 0),
           who + ' · זכור: הדף → ישר לדף (' + r.url.slice(0, 70) + ')');
        return r.ctx.close();
      })
      .then(function () {
        var ls = devLs(tr, dad, MID, 'inter'); ls['df:markedCache'] = '{}';
        return ctxFor(browser, ls).then(function (ctx) { return ctx.close(); });
      })
      .then(function () {
        var cfg = { rows:{ mid:true } };
        return stWeek(browser, base, tr, dad, cfg, 'sugya').then(function (r) {
          var p = r.page;
          return p.goto(base + '/bechira?st=1#week=' + tr.id + '-5').then(function () { return p.waitForTimeout(700); })
            .then(function () { return p.evaluate(function () { var a = document.querySelector('a.sug'); return a && a.getAttribute('href'); }); })
            .then(function (card) {
              ok(r.opened.length === 1 && r.opened[0] === card && /\/join/.test(r.url) && noIdx(r),
                 who + ' · זכור: הסוגיה → חלון חדש לכתובת של הכרטיס, join נשאר');
              return r.ctx.close();
            });
        });
      })
      .then(function () { return stWeek(browser, base, tr, dad, { rows:{ mid:true, sugya:false } }, 'sugya'); }).then(function (r) {
        ok(wkRe.test(r.url) && !r.opened.length, who + ' · זכור: הסוגיה כבויה → עמוד הבחירה');
        return r.ctx.close();
      })
      .then(function () { return stWeek(browser, base, tr, dad, MID, 'sugya_x'); }).then(function (r) {
        ok(wkRe.test(r.url), who + ' · בחירה לא מוכרת → עמוד הבחירה');
        return r.ctx.close();
      })
      .then(next);
    };
    /* הדף לא מסומן — עמוד הבחירה (פעם אחת לכל מסלול) */
    var unmarked = function () {
      var list = TR.slice();
      var one = function () {
        if (!list.length) return Promise.resolve();
        var tr = list.shift(), ls = devLs(tr, false, { rows:{ mid:true } }, 'inter');
        ls['df:markedCache'] = '{}';
        return ctxFor(browser, ls).then(function (ctx) {
          return ctx.newPage().then(function (p) {
            return p.goto(base + '/join?inst=nertamid').then(function () { return p.waitForTimeout(1000); })
              .then(function () { return p.evaluate(function () { stWeek(); }).catch(function () {}); })
              .then(function () { return p.waitForTimeout(1300); })
              .then(function () { ok(/\/bechira/.test(p.url()), tr.id + ' · זכור: הדף לא מסומן → עמוד הבחירה'); });
          }).then(function () { return ctx.close(); });
        }).then(one);
      };
      return one();
    };
    /* ד — מכשיר צוות */
    var staff = function () {
      var list = TR.slice();
      var one = function () {
        if (!list.length) return Promise.resolve();
        var tr = list.shift();
        return ctxFor(browser, { 'df:admOk':'1' }).then(function (ctx) {
          return ctx.newPage().then(function (p) {
            return p.goto(base + '/learn.html?mas=' + C.TrackBase(tr.id) + '&ret=pick-' + tr.id + '-5')
              .then(function () { return p.waitForTimeout(1200); })
              .then(function () { return p.evaluate(function () { return stuHomeUrl(); }); })
              .then(function (u) { ok(u === './#week=' + tr.id + '-5', tr.id + ' · צוות: יציאה → ' + u); })
              .then(function () { return p.goto(base + '/index.html#week=' + tr.id + '-5'); })
              .then(function () { return p.waitForTimeout(1300); })
              .then(function () { return p.evaluate(function () { return document.querySelector('#v-week.on') && state.track.id; }); })
              .then(function (id) { ok(id === tr.id, tr.id + ' · צוות: העמוד הראשי פותח את השבוע (' + id + ')'); })
              .then(function () { return p.goto(base + '/index.html?st=1#track=' + tr.id); })
              .then(function () { return p.waitForTimeout(1300); })
              .then(function () { return p.evaluate(function () { return !!document.querySelector('#v-track.on'); }); })
              .then(function (on) { ok(on, tr.id + ' · #track= נקלט'); });
          }).then(function () { return ctx.close(); });
        }).then(one);
      };
      return one();
    };
    return next().then(function () { return chromium.launch(); }).then(function (b2) {
      browser = b2; return unmarked().then(staff).then(function () { return b2.close(); });
    });
  }).then(function () { srv.close(); console.log(fail ? 'נכשלו: ' + fail : 'הכול עבר'); process.exit(fail ? 1 : 0); });
}).catch(function (e) { console.error(e); process.exit(1); });
