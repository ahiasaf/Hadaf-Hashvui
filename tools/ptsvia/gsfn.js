// api/gs.js — הפונקציה לבדה, עם fetch מדומה. node tools/ptsvia/gsfn.js
var h = require('../../api/gs.js'), fails = 0, n = 0, NEXT = null, SEEN = [];
var EventEmitter = require('events');
global.fetch = function (u, o) { SEEN.push({ u: u, o: o }); return NEXT(u, o); };
function res() { var r = { h: {}, statusCode: 0, body: null }; r.setHeader = function (k, v) { r.h[k] = v; }; r.end = function (b) { r.body = b; }; return r; }
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function reqOf(method, q, body) { var r = new EventEmitter(); r.method = method; r.query = q; if (body !== undefined) r.body = body; return r; }
async function run(rq, nx) { NEXT = nx || good; SEEN = []; var r = res(); await h(rq, r); return r; }
var good = function (u) { var m = /[?&](?:callback|cb)=(\w+)/.exec(u); return Promise.resolve({ status: 200, text: function () { return Promise.resolve(m ? m[1] + '({"status":"ok"})' : '{"status":"ok"}'); } }); };
(async function () {
  var r = await run(reqOf('GET', { mark: 'D1', wk: 'taanit|4', callback: 'lcb1' }));
  ok(r.statusCode === 200 && r.body === 'lcb1({"status":"ok"})', 'GET JSONP עובר', r);
  ok(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec\?mark=D1&wk=taanit%7C4&callback=lcb1&vx=1$/.test(SEEN[0].u), 'הכתובת לגוגל', SEEN[0].u);
  r = await run(reqOf('GET', { pair: 'D1', cb: 'pr1' }));
  ok(r.statusCode === 200 && r.body.indexOf('pr1(') === 0, 'cb= (pair.js)');
  r = await run(reqOf('GET', { challenge: 'adm', key: 'K', callback: 'lcb1' }));
  ok(r.statusCode === 403 && SEEN.length === 0, 'סיסמה בכתובת נדחית');
  r = await run(reqOf('GET', { amda: '1', vk: 'K', callback: 'lcb1' }));
  ok(r.statusCode === 403 && SEEN.length === 0, 'vk נדחה');
  r = await run(reqOf('GET', { mark: 'D1', callback: 'a(b)' }));
  ok(r.statusCode === 400, 'callback לא תקין');
  r = await run(reqOf('GET', { mark: 'D1', callback: 'lcb1' }), function () { return Promise.resolve({ status: 200, text: function () { return Promise.resolve('<html>'); } }); });
  ok(r.statusCode === 502, 'דף שגיאה → 502');
  r = await run(reqOf('POST', {}, JSON.stringify({ action: 'row', tab: 'לימוד', cols: [['מזהה', 'D1']] })));
  ok(r.statusCode === 200 && SEEN[0].o.method === 'POST' && /"tab":"לימוד"/.test(SEEN[0].o.body) && /vx=1$/.test(SEEN[0].u), 'POST עובר עם הגוף', SEEN[0]);
  r = await run(reqOf('POST', {}, JSON.stringify({ action: 'table', tab: 'הגדרות', key: 'SECRET' })));
  ok(r.statusCode === 403 && SEEN.length === 0, 'POST עם סיסמה נדחה');
  r = await run(reqOf('POST', {}, JSON.stringify({ action: 'row', key: '' })));
  ok(r.statusCode === 200, 'key ריק — לא סיסמה');
  r = await run(reqOf('POST', {}, 'x'.repeat(1024 * 1024 + 5)));
  ok(r.statusCode === 413 && SEEN.length === 0, 'גוף גדול נדחה');
  r = await run(reqOf('PUT', {}, ''));
  ok(r.statusCode === 405, 'רק GET/POST');
  r = await run(reqOf('GET', { mark: 'D1', callback: 'lcb1' }), function () { return Promise.reject(new Error('x')); });
  ok(r.statusCode === 504, 'רשת → 504');
  console.log('checks', n, 'fails', fails);
  process.exit(fails ? 1 : 0);
})();
