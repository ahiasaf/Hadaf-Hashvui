// api/pts.js — הפונקציה לבדה, עם fetch מדומה. node tools/ptsvia/fn.js
var h = require('../../api/pts.js'), fails = 0, n = 0, NEXT = null, SEEN = [];
global.fetch = function (u, o) { SEEN.push(u); return NEXT(u, o); };
function res() { var r = { h: {}, statusCode: 0, body: null }; r.setHeader = function (k, v) { r.h[k] = v; }; r.end = function (b) { r.body = b; }; return r; }
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
async function run(q, nx) { NEXT = nx; SEEN = []; var r = res(); await h({ query: q }, r); return r; }
var good = function (u) { var cb = /callback=(\w+)/.exec(u)[1]; return Promise.resolve({ status: 200, text: function () { return Promise.resolve(cb + '({"status":"ok","n":1})'); } }); };
(async function () {
  var r = await run({ pts: 'me', id: 'D1abc', callback: 'pm123', fe: 'e1k1', fd: 'and-oth-a' }, good);
  ok(r.statusCode === 200 && r.body === 'pm123({"status":"ok","n":1})', 'תשובה תקינה עוברת', r);
  ok(/javascript/.test(r.h['Content-Type']) && r.h['Cache-Control'] === 'no-store', 'כותרות');
  ok(SEEN[0].indexOf('https://script.google.com/macros/s/') === 0 && /[?&]vx=1/.test(SEEN[0]) && /fe=e1k1/.test(SEEN[0]) && /fd=and-oth-a/.test(SEEN[0]), 'הכתובת לגוגל', SEEN);
  r = await run({ pts: 'all', id: 'D1', callback: 'pm1' }, good);
  ok(r.statusCode === 400 && SEEN.length === 0, 'רק pts=me');
  r = await run({ pts: 'me', id: 'D1', callback: 'alert(1);x' }, good);
  ok(r.statusCode === 400 && SEEN.length === 0, 'callback לא תקין');
  r = await run({ pts: 'me', id: 'D1&key=x', callback: 'pm1' }, good);
  ok(r.statusCode === 400 && SEEN.length === 0, 'מזהה עם תווים זרים');
  r = await run({ pts: 'me', id: 'D1', callback: 'pm1', key: 'SECRET', clear: '1' }, good);
  ok(r.statusCode === 200 && !/SECRET|clear/.test(SEEN[0]), 'פרמטרים אחרים לא עוברים', SEEN);
  r = await run({ pts: 'me', id: 'D1', callback: 'pm1' }, function () { return Promise.resolve({ status: 200, text: function () { return Promise.resolve('<html>error</html>'); } }); });
  ok(r.statusCode === 502 && r.body === '', 'דף שגיאה של גוגל → 502');
  r = await run({ pts: 'me', id: 'D1', callback: 'pm1' }, function () { return Promise.resolve({ status: 500, text: function () { return Promise.resolve('pm1({})'); } }); });
  ok(r.statusCode === 502, '500 מגוגל → 502');
  r = await run({ pts: 'me', id: 'D1', callback: 'pm1' }, function () { return Promise.reject(new Error('net')); });
  ok(r.statusCode === 504, 'כישלון רשת → 504');
  console.log('checks', n, 'fails', fails);
  process.exit(fails ? 1 : 0);
})();
