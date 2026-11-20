// "נמסר ידנית" (8.99.560): פרס שנמסר מחוץ למערכת — בלי שובר, בלי בחירה אוטומטית, בלי באנר. מזהים מומצאים.
// node tools/vchtest/dlv.js → קוד 1 אם בדיקה נכשלה.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
['DOLDAAA1', 'DNEWBBB2'].forEach(function (id, i) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'ש' + i], ['משפחה', 'מ'], ['קוד ישיבה', ['givat', 'lapid'][i]], ['תפקיד', 'תלמיד']]);
});
var old = '2026-10-19T12:00:00Z', now = new Date().toISOString();
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R0'], ['שבוע', '3'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'givat'], ['זוכה', 'DOLDAAA1'], ['מזהי הזוכה', 'DOLDAAA1'], ['שם הזוכה', 'ש מ'], ['פורסם', old]]);
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R1'], ['שבוע', '7'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'lapid'], ['זוכה', 'DNEWBBB2'], ['מזהי הזוכה', 'DNEWBBB2'], ['שם הזוכה', 'ש מ'], ['פורסם', now]]);
post({ action: 'vchadd', key: 'k', rows: [{ t: 'פיצה', p: 'pizza', c: 'PZ-1', x: '2027-12-31' }] });
ok(raf({ raffle: 'pdlv', rid: 'R0', code: 'givat', p: 'pizza' }).status === 'denied', 'pdlv w/o key denied');
ok(raf({ raffle: 'pdlv', key: 'k', rid: 'R0', code: 'givat', p: 'xx' }).status === 'error', 'bad prize refused');
var D = raf({ raffle: 'pdlv', key: 'k', rid: 'R0', code: 'givat', p: 'pizza' });
ok(D.status === 'ok', 'marked delivered', D);
var P0 = raf({ raffle: 'prize', id: 'DOLDAAA1', fresh: '1' }).list[0];
ok(P0.st === 'dlv' && P0.p === 'pizza' && !P0.v, 'student: delivered, no voucher', P0);
c.vchFill_();
var V = c.vchTbl_(false), used = 0;
for (var i = 1; i < V.rows.length; i++) if (V.c(i, 'סטטוס') !== 'זמין') used++;
ok(used === 0, 'stock untouched by fill');
// זכייה עם שובר — אין סימון ידני
raf({ raffle: 'vpick', id: 'DNEWBBB2', rid: 'R1', p: 'pizza' });
ok(raf({ raffle: 'pdlv', key: 'k', rid: 'R1', code: 'lapid', p: 'pizza' }).status === 'error', 'win with voucher refused');
var L = raf({ raffle: 'wadm', key: 'k' }), x0 = null;
L.list.forEach(function (r) { r.w.forEach(function (x) { if (x.first === 'ש0') x0 = x; }); });
ok(x0 && x0.st === 'dlv' && !x0.vw, 'wadm: dlv, not waiting', x0);
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
