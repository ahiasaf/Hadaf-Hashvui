// קישור שובר שנמסר ידנית לזכייה (8.99.486) — מול apps-script.gs בזיכרון.
// node tools/vchtest/link.js → קוד 1 אם בדיקה נכשלה. מזהים, שמות וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
var pub = '2026-11-01T10:00:00.000Z', D0 = '2026-11-02T09:00:00.000Z';
var S = { A: 'AmTESTaaaa01', B: 'AmTESTbbbb02', C: 'SmTESTcccc03', D: 'SmTESTdddd04' };
['A', 'B', 'C', 'D'].forEach(function (k, i) {
  c.appendCols_('לומדים', [['מזהה', S[k]], ['שם', k], ['משפחה', 'ב'], ['קוד ישיבה', ['givat', 'rishon', 'nertamid', 'givat2x'][i]], ['תפקיד', 'תלמיד']]);
});
function win(rid, code, id, extra) {
  c.appendCols_('הגרלות', [['מזהה הגרלה', rid], ['שבוע', '5'], ['סטטוס', 'פורסם'], ['קוד ישיבה', code],
    ['זוכה', id], ['מזהי הזוכה', id], ['שם הזוכה', 'שם'], ['פורסם', pub]].concat(extra || []));
}
win('R3', 'nertamid', S.C);
win('R4', 'givat', S.A);
win('R5', 'rishon', S.B);
win('R5', 'nertamid', S.C);
win('R5', 'givat2x', S.D, [['פרס', 'maafe'], ['פרס — איך', 'בחר'], ['פרס — מתי', D0]]);
// המלאי: חמישה שוברים, שניים זמינים ועוד חמישה שיהפכו ל"נמסרו".
post({ action: 'vchadd', key: 'k', rows: [
  { p: 'pizza', c: 'PZ-27', x: '2026-12-31' }, { p: 'pizza', c: 'PZ-28', x: '2026-12-31' },
  { p: 'pizza', c: 'PZ-29', x: '2026-12-31' }, { p: 'maafe', c: 'MF-39', x: '2026-12-31' },
  { p: 'pizza', c: 'PZ-OLD', x: '2026-12-31' }, { p: 'pizza', c: 'PZ-FREE', x: '2026-12-31' },
  { p: 'maafe', c: 'MF-FREE', x: '2026-12-31' }] });
var V = c.vchTbl_(true);
function rowOf(code) { for (var r = 1; r < V.rows.length; r++) if (V.c(r, 'קוד') === code) return r; return -1; }
function held(code, vid, who, rid) {
  var r = rowOf(code);
  c.vchPut_(V, r, 'מזהה', vid); c.vchPut_(V, r, 'סטטוס', 'שויך'); c.vchPut_(V, r, 'שויך לתלמיד', who);
  c.vchPut_(V, r, 'תאריך שיוך', D0); if (rid) c.vchPut_(V, r, 'הגרלה', rid);
}
held('PZ-27', 'VT-27', S.A); held('PZ-28', 'VT-28', S.B); held('PZ-29', 'VT-29', S.C); held('MF-39', 'VT-39', S.D);
held('PZ-OLD', 'VT-OLD', S.C, 'R3');
c.rafSet_(c.rafRead_(), { lines: [1] }, [['פרס', 'pizza'], ['פרס — איך', 'רכז'], ['פרס — מתי', D0]]);   // R3 של C
function snap() { var Vx = c.vchTbl_(false); return JSON.stringify(Vx.rows); }
function rowStr(code) { var Vx = c.vchTbl_(false); for (var r = 1; r < Vx.rows.length; r++) if (Vx.c(r, 'קוד') === code) return JSON.stringify(Vx.rows[r]); }
function winRow(rid, code) { var T = c.rafRead_(); for (var r = 1; r < T.rows.length; r++) if (T.c(r, 'מזהה הגרלה') === rid && T.c(r, 'קוד ישיבה') === code) return { p: T.c(r, 'פרס'), how: T.c(r, 'פרס — איך'), at: T.c(r, 'פרס — מתי'), pub: T.c(r, 'פורסם') }; }
var oldC = rowStr('PZ-OLD');
ok(c.vchOn_() === false, 'switch stays off');
// רשימת הרכז מציגה את השובר שנמסר
var L0 = raf({ raffle: 'wadm', key: 'k' });
var a0 = L0.list.filter(function (x) { return x.rid === 'R4'; })[0].w[0];
ok(a0.lk && a0.lk.length === 1 && a0.lk[0].id === 'VT-27' && !a0.v, 'wadm: held voucher offered', a0);
// בלי vid — עוצר, בלי issueVoucher_
var s0 = snap();
ok(raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza' }).status === 'error', 'prizeset w/o vid refused when held');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'givat2x' }).status === 'error', 'vattach w/o vid refused when held');
ok(snap() === s0 && !winRow('R4', 'givat').p, 'refusals changed nothing');
// סתירות
var bad = [
  [{ raffle: 'prizeset', rid: 'R5', code: 'nertamid', p: 'pizza', vid: 'VT-OLD' }, 'linked elsewhere'],
  [{ raffle: 'prizeset', rid: 'R5', code: 'nertamid', p: 'pizza', vid: 'VT-28' }, 'other student'],
  [{ raffle: 'prizeset', rid: 'R5', code: 'nertamid', p: 'maafe', vid: 'VT-29' }, 'type mismatch'],
  [{ raffle: 'prizeset', rid: 'R5', code: 'nertamid', p: 'pizza', vid: 'VT-NOPE' }, 'not found'],
  [{ raffle: 'vattach', rid: 'R5', code: 'givat2x', vid: 'VT-29' }, 'vattach other student'],
  [{ raffle: 'prizeset', rid: 'R5', code: 'nertamid', p: 'pizza', vid: 'VT-29' }, 'no key']];
bad.forEach(function (b, i) { var q = b[0]; if (i < bad.length - 1) q.key = 'k'; var R = raf(q); ok(R.status !== 'ok', 'refused: ' + b[1], R); });
ok(snap() === s0, 'contradictions changed nothing');
// הקישור — שלוש פיצות (prizeset) ומאפה (vattach)
var r1 = raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza', vid: 'VT-27' });
var r2 = raf({ raffle: 'prizeset', key: 'k', rid: 'R5', code: 'rishon', p: 'pizza', vid: 'VT-28' });
var r3 = raf({ raffle: 'prizeset', key: 'k', rid: 'R5', code: 'nertamid', p: 'pizza', vid: 'VT-29' });
var r4 = raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'givat2x', vid: 'VT-39' });
ok(r1.status === 'ok' && r1.v.c === 'PZ-27' && r2.v.c === 'PZ-28' && r3.v.c === 'PZ-29' && r4.v.c === 'MF-39', 'exact stored codes', [r1, r2, r3, r4]);
[['R4', 'givat'], ['R5', 'rishon'], ['R5', 'nertamid']].forEach(function (x) {
  var w = winRow(x[0], x[1]); ok(w.p === 'pizza' && w.how === 'רכז' && w.at, 'win row: pizza / רכז ' + x.join(':'), w);
});
var d = winRow('R5', 'givat2x');
ok(d.p === 'maafe' && d.how === 'בחר' && d.at === D0 && d.pub === pub, 'vattach: prize/source/dates kept', d);
['PZ-27', 'PZ-28', 'PZ-29', 'MF-39'].forEach(function (code, i) {
  var Vx = c.vchTbl_(false), r = rowOf(code);
  ok(Vx.c(r, 'הגרלה') === ['R4', 'R5', 'R5', 'R5'][i] && Vx.c(r, 'סטטוס') === 'שויך' && Vx.c(r, 'מזהה') === ['VT-27', 'VT-28', 'VT-29', 'VT-39'][i], 'linked ' + code);
});
ok(rowStr('PZ-OLD') === oldC, 'previous win voucher untouched');
var Vz = c.vchTbl_(false);
ok(Vz.c(rowOf('PZ-FREE'), 'סטטוס') === 'זמין' && Vz.c(rowOf('MF-FREE'), 'סטטוס') === 'זמין', 'no new voucher issued');
// חזרה — הצלחה בלי שינוי
var s1 = snap(), w1 = JSON.stringify([winRow('R4', 'givat'), winRow('R5', 'givat2x')]);
var q1 = raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza', vid: 'VT-27' });
var q2 = raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'givat2x', vid: 'VT-39' });
ok(q1.status === 'ok' && q1.same && q2.status === 'ok' && q2.same, 'repeat: ok, same', [q1, q2]);
ok(snap() === s1 && JSON.stringify([winRow('R4', 'givat'), winRow('R5', 'givat2x')]) === w1, 'repeat: nothing changed');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R4', code: 'givat' }).status === 'error', 'repeat w/o vid: no new voucher');
ok(c.vchTbl_(false).c(rowOf('PZ-FREE'), 'סטטוס') === 'זמין', 'still no new voucher');
// התלמיד רואה את הקוד השמור
var P = raf({ raffle: 'prize', id: S.C, fresh: '1' });
var p5 = P.list.filter(function (x) { return x.rid === 'R5'; })[0], p3 = P.list.filter(function (x) { return x.rid === 'R3'; })[0];
ok(p5.v && p5.v.c === 'PZ-29' && p3.v && p3.v.c === 'PZ-OLD', 'student sees both wins with their own codes', P.list);
ok(c.vchOn_() === false, 'switch still off');
console.log(n - fails + '/' + n + ' passed');
if (Object.keys(M.missing).length) console.log('missing mocks:', Object.keys(M.missing).join(', '));
process.exit(fails ? 1 : 0);
