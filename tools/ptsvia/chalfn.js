// api/chal.js — הפונקציה לבדה, עם fetch מדומה. node tools/ptsvia/chalfn.js
var h = require('../../api/chal.js'), fails = 0, n = 0, NEXT = null, SEEN = [];
global.fetch = function (u, o) { SEEN.push(u); return NEXT(u, o); };
function res() { var r = { h: {}, statusCode: 0, body: null }; r.setHeader = function (k, v) { r.h[k] = v; }; r.end = function (b) { r.body = b; }; return r; }
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
async function run(q, nx) { NEXT = nx || good; SEEN = []; var r = res(); await h({ query: q }, r); return r; }
var good = function (u) { var cb = /callback=(\w+)/.exec(u)[1]; return Promise.resolve({ status: 200, text: function () { return Promise.resolve(cb + '({"status":"ok","on":true})'); } }); };
(async function () {
  var r = await run({ challenge: 'my', id: 'D1abc,D2', ref: 'AB12CD', ms: '3', tst: '1', callback: 'lcb123' });
  ok(r.statusCode === 200 && r.body === 'lcb123({"status":"ok","on":true})', 'תשובה תקינה', r);
  ok(/challenge=my&vx=1&id=D1abc%2CD2&ref=AB12CD&ms=3&tst=1&t=\d+&callback=lcb123$/.test(SEEN[0]), 'הכתובת לגוגל', SEEN);
  for (var op of ['adm', 'tout', 'push', 'tmsg', 'activate', 'open', 'draw', 'approve', 'dmend', 'tclear', 'due', 'state']) {
    r = await run({ challenge: op, id: 'D1', callback: 'lcb1', key: 'K' });
    ok(r.statusCode === 400 && SEEN.length === 0, 'פעולת ניהול נדחית: ' + op);
  }
  for (var op2 of ['sit', 'decl', 'newt', 'ref', 'land', 'byph']) {
    r = await run({ challenge: op2, id: 'D1', ref: 'AB12CD', callback: 'lcb1', key: 'K' });
    ok(r.statusCode === 200 && SEEN[0].indexOf('challenge=' + op2 + '&vx=1') > 0 && !/key=/.test(SEEN[0]), 'פעולת תלמיד עוברת בלי סיסמה: ' + op2, SEEN);
  }
  r = await run({ challenge: 'byph', ref: 'AB12CD', ph: '050-1234567', first: 'א', callback: 'lcb1' });
  ok(r.statusCode === 200 && /ph=050-1234567/.test(SEEN[0]) && /first=%D7%90/.test(SEEN[0]), 'byph — טלפון ושם', SEEN);
  r = await run({ challenge: 'byph', ref: 'AB12CD', ph: '<x>', callback: 'lcb1' });
  ok(r.statusCode === 400, 'טלפון לא תקין');
  r = await run({ challenge: 'my', id: 'D1', callback: 'lcb1', key: 'SECRET', t: 'x' });
  ok(r.statusCode === 200 && !/SECRET|key=/.test(SEEN[0]), 'סיסמה לא עוברת', SEEN);
  r = await run({ challenge: 'my', id: 'D1', ref: 'x&y', callback: 'lcb1' });
  ok(r.statusCode === 400, 'קוד לא תקין');
  r = await run({ challenge: 'my', id: 'D1', tst: '2', callback: 'lcb1' });
  ok(r.statusCode === 400, 'tst רק 1');
  r = await run({ challenge: 'my', id: 'D1', callback: 'lcb1' }, function () { return Promise.resolve({ status: 200, text: function () { return Promise.resolve('<html>'); } }); });
  ok(r.statusCode === 502, 'דף שגיאה → 502');
  r = await run({ challenge: 'my', id: 'D1', callback: 'lcb1' }, function () { return Promise.reject(new Error('x')); });
  ok(r.statusCode === 504, 'רשת → 504');
  console.log('checks', n, 'fails', fails);
  process.exit(fails ? 1 : 0);
})();
