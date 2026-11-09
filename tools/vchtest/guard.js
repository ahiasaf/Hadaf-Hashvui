// שוברים שנשלחו בוואטסאפ (8.99.487): בלי פופאפ לזכיות הישנות, הגנה משותפת מפני הנפקה כפולה
// בכל ארבעת הנתיבים, וזכייה חדשה של אותו תלמיד אינה נחסמת. node tools/vchtest/guard.js
// מזהים, שמות וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
c.VCH_HELD_MAP_ = { 'VT-27': 'R4', 'VT-28': 'R5', 'VT-29': 'R5', 'VT-39': 'R5' };
c.VCH_POP_FROM_ = '2026-11-09T18:00:00Z';
var OLD = '2026-11-01T10:00:00.000Z', NEW = '2026-11-15T10:00:00.000Z', PAST = '2020-01-01T00:00:00Z', D0 = '2026-11-02T09:00:00.000Z';
var S = { A: 'AmTESTaaaa01', B: 'AmTESTbbbb02', C: 'SmTESTcccc03', D: 'SmTESTdddd04' };
['A', 'B', 'C', 'D'].forEach(function (k, i) {
  c.appendCols_('לומדים', [['מזהה', S[k]], ['שם', k], ['משפחה', 'ב'], ['קוד ישיבה', ['givat', 'rishon', 'nertamid', 'oz'][i]], ['תפקיד', 'תלמיד']]);
});
function win(rid, code, id, pub, extra) {
  c.appendCols_('הגרלות', [['מזהה הגרלה', rid], ['שבוע', '5'], ['סטטוס', 'פורסם'], ['קוד ישיבה', code],
    ['זוכה', id], ['מזהי הזוכה', id], ['שם הזוכה', 'שם'], ['פורסם', pub]].concat(extra || []));
}
win('R3', 'nertamid', S.C, OLD, [['פרס', 'pizza'], ['פרס — איך', 'רכז'], ['פרס — מתי', D0]]);
win('R4', 'givat', S.A, OLD, [['פרס — עד', PAST]]);           // המועד עבר — הגרלת פרס אוטומטית הייתה רצה
win('R5', 'rishon', S.B, OLD, [['פרס — עד', PAST]]);
win('R5', 'nertamid', S.C, OLD, [['פרס — עד', PAST]]);
win('R5', 'oz', S.D, OLD, [['פרס', 'maafe'], ['פרס — איך', 'בחר'], ['פרס — מתי', D0]]);
post({ action: 'vchadd', key: 'k', rows: [
  { p: 'pizza', c: 'PZ-27', x: '2026-12-31' }, { p: 'pizza', c: 'PZ-28', x: '2026-12-31' },
  { p: 'pizza', c: 'PZ-29', x: '2026-12-31' }, { p: 'maafe', c: 'MF-39', x: '2026-12-31' },
  { p: 'pizza', c: 'PZ-OLD', x: '2026-12-31' }, { p: 'pizza', c: 'PZ-F1', x: '2026-12-31' },
  { p: 'pizza', c: 'PZ-F2', x: '2026-12-31' }, { p: 'burger', c: 'BG-F1', x: '2026-12-31' }] });
var V = c.vchTbl_(true);
function rowOf(code) { var Vx = c.vchTbl_(false); for (var r = 1; r < Vx.rows.length; r++) if (Vx.c(r, 'קוד') === code) return r; return -1; }
function cell(code, k) { var Vx = c.vchTbl_(false); return Vx.c(rowOf(code), k); }
function held(code, vid, who, rid) {
  var r = rowOf(code);
  c.vchPut_(V, r, 'מזהה', vid); c.vchPut_(V, r, 'סטטוס', 'שויך'); c.vchPut_(V, r, 'שויך לתלמיד', who);
  c.vchPut_(V, r, 'תאריך שיוך', D0); if (rid) c.vchPut_(V, r, 'הגרלה', rid);
}
held('PZ-27', 'VT-27', S.A); held('PZ-28', 'VT-28', S.B); held('PZ-29', 'VT-29', S.C); held('MF-39', 'VT-39', S.D);
held('PZ-OLD', 'VT-OLD', S.C, 'R3');
function winRow(rid, code) { var T = c.rafRead_(); for (var r = 1; r < T.rows.length; r++) if (T.c(r, 'מזהה הגרלה') === rid && T.c(r, 'קוד ישיבה') === code) return { p: T.c(r, 'פרס'), how: T.c(r, 'פרס — איך'), at: T.c(r, 'פרס — מתי') }; }
function free() { return ['PZ-F1', 'PZ-F2', 'BG-F1'].filter(function (k) { return cell(k, 'סטטוס') === 'זמין'; }).length; }
var oldC = JSON.stringify(c.vchTbl_(false).rows[rowOf('PZ-OLD')]);

// ===== מתג כבוי: התלמיד רואה את השובר השמור, בלי פופאפ, בלי הגרלת פרס =====
var PA = raf({ raffle: 'prize', id: S.A, fresh: '1' }).list[0];
ok(PA.v && PA.v.c === 'PZ-27' && PA.p === 'pizza' && PA.st !== 'pick' && !PA.pp, 'old win: stored voucher via button, no popup flag', PA);
var w4 = winRow('R4', 'givat');
ok(!w4.p && !w4.how, 'old win: no automatic prize draw', w4);
ok(raf({ raffle: 'prize', id: S.B, fresh: '1' }).list[0].v.c === 'PZ-28' && !winRow('R5', 'rishon').p, 'B same');
ok(free() === 3, 'off: stock untouched');
// צפייה אמיתית נרשמת, בלי לקשר ובלי לשנות קוד
var SN = raf({ raffle: 'vseen', id: S.A, vid: 'VT-27' });
ok(SN.status === 'ok' && cell('PZ-27', 'נצפה') && !cell('PZ-27', 'הגרלה') && cell('PZ-27', 'קוד') === 'PZ-27', 'seen on stored voucher: no link, same code', SN);

// ===== מתג דלוק: ארבעת הנתיבים =====
raf({ raffle: 'von', key: 'k', v: '1' });
var K = raf({ raffle: 'vpick', id: S.A, rid: 'R4', p: 'burger' });
ok(K.status === 'ok' && K.v && K.v.c === 'PZ-27' && free() === 3, 'vpick on stored win: same voucher, nothing issued', K);
ok(raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza' }).status === 'error' && free() === 3, 'prizeset w/o vid: refused, nothing issued');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R4', code: 'givat' }).status === 'error' && free() === 3, 'vattach w/o vid: refused, nothing issued');
var TT = c.rafRead_(), rr = -1;
for (var i = 1; i < TT.rows.length; i++) if (TT.c(i, 'מזהה הגרלה') === 'R5' && TT.c(i, 'קוד ישיבה') === 'rishon') rr = i;
c.rafPrzAuto_(TT, [rr]);
ok(!winRow('R5', 'rishon').p && free() === 3, 'auto-draw on stored win: skipped', winRow('R5', 'rishon'));
// issueVoucher_ ישירות — ההגנה בתוכו
var cx = { rid: 'R5', ws: [S.C], how: 'בדיקה' };
ok(c.issueVoucher_(S.C, 'pizza', cx) === null && cx.have > 0 && free() === 3, 'issueVoucher_ guard: stored win → no stock touched');
// רשימת הרכז מציעה את הקישור
var L = raf({ raffle: 'wadm', key: 'k' });
var a4 = L.list.filter(function (x) { return x.rid === 'R4'; })[0].w[0];
ok(a4.lk && a4.lk[0].id === 'VT-27' && !a4.v, 'wadm: link offered', a4);
// הקישור: A ב-prizeset, C ב-vattach (בלי פרס בשורה → pizza/רכז), D ב-vattach (נשמר)
var r1 = raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza', vid: 'VT-27' });
var r3 = raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'nertamid', vid: 'VT-29' });
var r4 = raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'oz', vid: 'VT-39' });
ok(r1.v.c === 'PZ-27' && r3.v.c === 'PZ-29' && r4.v.c === 'MF-39', 'linked with stored codes', [r1, r3, r4]);
var wa = winRow('R4', 'givat'), wc = winRow('R5', 'nertamid'), wd = winRow('R5', 'oz');
ok(wa.p === 'pizza' && wa.how === 'רכז' && wc.p === 'pizza' && wc.how === 'רכז', 'A, C: pizza / רכז', [wa, wc]);
ok(wd.p === 'maafe' && wd.how === 'בחר' && wd.at === D0, 'D: prize, source, dates kept', wd);
var s1 = JSON.stringify(c.vchTbl_(false).rows);
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'nertamid', vid: 'VT-29' }).same === 1 &&
   raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza', vid: 'VT-27' }).same === 1 &&
   JSON.stringify(c.vchTbl_(false).rows) === s1, 'repeat link: same, nothing changed');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R5', code: 'rishon', vid: 'VT-29' }).status === 'error', 'wrong voucher for win: refused');
ok(raf({ raffle: 'prizeset', key: 'k', rid: 'R4', code: 'givat', p: 'pizza', vid: 'VT-28' }).status === 'error', 'voucher mapped to other win: refused');
ok(JSON.stringify(c.vchTbl_(false).rows[rowOf('PZ-OLD')]) === oldC, 'C previous-win voucher untouched');
ok(free() === 3, 'still nothing issued from stock');

// ===== זכייה חדשה של אותו תלמיד — ההתנהגות החדשה =====
win('R6', 'nertamid', S.C, NEW);
var P6 = raf({ raffle: 'prize', id: S.C, fresh: '1' }).list;
var x6 = P6.filter(function (x) { return x.rid === 'R6'; })[0], x5 = P6.filter(function (x) { return x.rid === 'R5'; })[0];
ok(x6 && x6.pp === 1 && x6.st === 'pick' && x5 && !x5.pp, 'new win: popup flag only on new raffle', P6);
var N1 = raf({ raffle: 'vpick', id: S.C, rid: 'R6', p: 'pizza' });
ok(N1.status === 'ok' && N1.v && /^PZ-F/.test(N1.v.c) && free() === 2, 'new win: not blocked, new voucher', N1);
var N2 = raf({ raffle: 'vpick', id: S.C, rid: 'R6', p: 'burger' });
ok(N2.v.c === N1.v.c && free() === 2, 'new win repeat: same voucher');
// הגרלת פרס אוטומטית בזכייה חדשה — עובדת
win('R6', 'rishon', S.B, NEW, [['פרס — עד', PAST]]);
var PB = raf({ raffle: 'prize', id: S.B, fresh: '1' }).list.filter(function (x) { return x.rid === 'R6'; })[0];
ok(PB && PB.p && PB.how === 'הוגרל' && PB.v && free() === 1, 'new win auto-draw: issues once', PB);
var PB2 = raf({ raffle: 'prize', id: S.B, fresh: '1' }).list.filter(function (x) { return x.rid === 'R6'; })[0];
ok(PB2.v.c === PB.v.c && free() === 1, 'auto-draw repeat: nothing more');
// B עדיין עם השובר השמור שלו ב-R5, שלא קושר
ok(cell('PZ-28', 'הגרלה') === '' && cell('PZ-28', 'סטטוס') === 'שויך', 'B stored voucher untouched');
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
