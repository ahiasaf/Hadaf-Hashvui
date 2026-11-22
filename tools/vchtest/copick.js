// קישור בחירה לרכז (8.99.572): זוכה בלי אפליקציה — הרכז בוחר בקישור; בלי בחירה אוטומטית.
// node tools/vchtest/copick.js → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
c.ghFire_ = function () { return { status: 'ok' }; };
['AmWINAAA1', 'DWINBBB2'].forEach(function (id, i) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'ש' + i], ['משפחה', 'מ'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
});
['AmWINAAA1', 'DWINBBB2'].forEach(function (id, i) {
  c.appendCols_('הגרלות', [['מזהה הגרלה', 'R1'], ['שבוע', '7'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'givat'], ['מקום', 'g' + (i + 1)],
    ['זוכה', id], ['מזהי הזוכה', id], ['שם הזוכה', 'ש מ'], ['פורסם', '2026-11-22T14:00:00Z']]);
});
var L = raf({ raffle: 'wadm', key: 'k' }), xa = null, xb = null;
L.list.forEach(function (r) { r.w.forEach(function (x) { if (x.first === 'ש0') xa = x; if (x.first === 'ש1') xb = x; }); });
ok(xa && xa.na && /^c[0-9a-f]{24}$/.test(xa.ct), 'wadm: no-app winner gets ct', xa);
ok(xb && !xb.ct, 'wadm: app winner has no ct', xb);
var ct = xa.ct;
var P = raf({ raffle: 'prize', id: 'co', ct: ct, fresh: '1' });
ok(P.list.length === 1 && P.list[0].rid === 'R1' && P.list[0].st === 'pick' && P.list[0].kid, 'prize by ct: the one win', P);
ok(raf({ raffle: 'prize', id: 'co', ct: 'c' + '0'.repeat(24), fresh: '1' }).list.length === 0, 'wrong ct: nothing');
ok(raf({ raffle: 'prize', id: 'co', fresh: '1' }).list.length === 0, 'no ct: nothing');
// אחרי חמישי — אין בחירה אוטומטית
var realNow = Date.now;
Date.now = function () { return Date.parse('2026-12-04T10:00:00Z'); };
c.autoRecount();
Date.now = realNow;
ok(!raf({ raffle: 'prize', id: 'co', ct: ct, fresh: '1' }).list[0].p, 'no auto pick after Thursday');
// הרכז בוחר
post({ action: 'vchadd', key: 'k', rows: [{ t: 'פיצה', p: 'pizza', c: 'PZ-1', x: '2027-12-31' }] });
var V = raf({ raffle: 'vpick', id: 'co', ct: ct, rid: 'R1', p: 'pizza' });
ok(V.status === 'ok' && V.v && V.v.c === 'PZ-1', 'vpick by ct issues voucher', V);
var P2 = raf({ raffle: 'prize', id: 'co', ct: ct, fresh: '1' }).list[0];
ok(P2.p === 'pizza' && P2.v && P2.v.c === 'PZ-1', 'prize by ct shows voucher', P2);
ok(!raf({ raffle: 'prize', id: 'DWINBBB2', fresh: '1' }).list[0].v, 'other winner untouched');
// סימון "נשלח" לקישור
var S = raf({ raffle: 'cosent', key: 'k', rid: 'R1', code: xa.code, k: 'pk' });
ok(S.status === 'ok' && S.at, 'cosent pk', S);
var L2 = raf({ raffle: 'wadm', key: 'k' }), xa2 = null;
L2.list.forEach(function (r) { r.w.forEach(function (x) { if (x.first === 'ש0') xa2 = x; }); });
ok(xa2.cpk, 'wadm carries cpk', xa2);
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
