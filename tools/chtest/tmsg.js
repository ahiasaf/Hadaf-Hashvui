// הודעה לחברי השולחנות (8.99.464) — הנמענים ושני מסלולי השליחה, מול apps-script.gs בזיכרון.
// **שום דבר לא יוצא:** UrlFetchApp מוחלף בלוכד שמחזיר 204. node tools/chtest/tmsg.js
var T = require('./tables.js'), c = T.c, vm = require('vm');
var fails = 0, n = 0;
function ok(cond, label, extra) { n++; if (!cond) { fails++; console.log('FAIL', label, extra === undefined ? '' : JSON.stringify(extra)); } }
var sent = [];
c.UrlFetchApp = { fetch: function (url, o) { sent.push({ url: url, p: JSON.parse(o.payload) }); return { getResponseCode: function () { return 204; } }; } };
var PR = c.PropertiesService.getScriptProperties();
PR.setProperty('GH_TOKEN', 'x'); PR.setProperty('GH_REPO', 'mock/mock');
var U = { test: false };
T.exec();
var M = c.chModel_(U, true), tabs = Object.keys(M.tb).sort();
ok(tabs.length >= 3, 'world has tables', tabs.length);
// מזהה נוסף (מכשיר שני) לאחד היושבים — חייב להיכלל בנמענים
var t0 = tabs[0], p0 = M.tb[t0][0];
M.al['ALIAS2'] = p0;
var R1 = c.chTmTo_(M, t0);
ok(JSON.stringify(R1.ppl) === JSON.stringify(M.tb[t0]), 'one table → exactly its seated members', [R1.ppl, M.tb[t0]]);
ok(R1.ids.indexOf('ALIAS2') >= 0 && R1.ids.indexOf(p0) >= 0, 'alias device included');
var others = []; tabs.slice(1).forEach(function (t) { M.tb[t].forEach(function (x) { if (M.tb[t0].indexOf(x) < 0) others.push(x); }); });
ok(others.length && others.every(function (x) { return R1.ppl.indexOf(x) < 0; }), 'one table → nobody from other tables');
var RA = c.chTmTo_(M, 'all'), every = {};
tabs.forEach(function (t) { M.tb[t].forEach(function (x) { every[x] = 1; }); });
ok(RA.tabs.length === tabs.length && RA.ppl.length === Object.keys(every).length, 'all → every seated person once', [RA.ppl.length, Object.keys(every).length]);
ok(RA.ppl.every(function (x) { return every[x]; }), 'all → only seated people');
ok(c.chTmTo_(M, 'NOPE').ids.length === 0, 'unknown table → no recipients');

// מסלולי הנתיב: dry, שולחן, כולם, שולחן שלא קיים, בלי נוסח, עולם הבדיקה
function call(q) { T.exec(); return c.chTmsg_(q.tst ? { test: true } : U, q); }
var d1 = call({ tb: t0, dry: '1' });
ok(d1.status === 'ok' && d1.dry && d1.tables === 1 && sent.length === 0, 'dry one → count, nothing sent', d1);
var d2 = call({ tb: 'all', dry: '1' });
ok(d2.status === 'ok' && d2.tables === tabs.length && sent.length === 0, 'dry all → nothing sent', d2);
var s1 = call({ tb: t0, t: 'כותרת', b: 'שלום לשולחן' });
var M2 = c.chModel_(U, true), want1 = c.chTmTo_(M2, t0).ids;
var f1 = sent[0] && JSON.parse(sent[0].p.client_payload.flt);
ok(s1.status === 'ok' && sent.length === 1 && f1 && JSON.stringify(f1.ids) === JSON.stringify(want1), 'send one → dispatch with that table ids', [s1, f1]);
ok(sent[0].p.client_payload.url === 'chaver' && sent[0].p.client_payload.role === '' && !sent[0].p.client_payload.only, 'one: link chaver, no role/inst broadcast', sent[0].p.client_payload);
var s2 = call({ tb: 'all', t: 'כותרת', b: 'שלום לכולם' });
var f2 = sent[1] && JSON.parse(sent[1].p.client_payload.flt);
ok(s2.status === 'ok' && sent.length === 2 && f2.ids.length === c.chTmTo_(M2, 'all').ids.length && s2.tables === tabs.length, 'send all → dispatch with all tables ids', s2);
ok(f1.mid !== f2.mid, 'each send has its own message id');
var e1 = call({ tb: 'NOPE', b: 'x' }), e2 = call({ tb: t0, b: '  ' }), e3 = call({ tb: 'all', b: 'x', tst: 1 }), e4 = call({ tb: '', b: 'x' });
ok(e1.status === 'error' && e2.status === 'error' && e3.status === 'error' && e4.status === 'error' && sent.length === 2, 'bad table / empty / test world / no target → refused, nothing sent', [e1, e2, e3, e4]);
// יומן "הודעות": שתי שורות, "למי" מבחין בין שולחן לכולם
var log = c.sheet_('הודעות').getDataRange().getValues(), h = log[0].indexOf('למי');
var tos = log.slice(1).map(function (r) { return String(r[h]); });
ok(tos.length === 2 && /^שולחן /.test(tos[0]) && /^כל השולחנות/.test(tos[1]), 'log: table vs all', tos);
// הנתיב עצמו דורש סיסמה
var rr = c.challengeRoute_({ parameter: { challenge: 'tmsg', tb: 'all', b: 'x' } });
ok(/denied/.test(JSON.stringify(rr)) && sent.length === 2, 'route without key → denied');
console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
