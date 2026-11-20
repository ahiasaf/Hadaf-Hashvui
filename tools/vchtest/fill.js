// שוברים מהמלאי לממתינים · שבועיים · בלי בחירה אוטומטית · התראה · "נשלח" (8.99.546) — מול apps-script.gs בזיכרון.
// node tools/vchtest/fill.js → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
var PUSH = [];
c.ghFire_ = function (t, b, o, g, k, who, link, role, wait, flt) { PUSH.push({ t: t, b: b, link: link, flt: flt }); return { status: 'ok' }; };
var now = new Date().toISOString(), old = new Date(Date.now() - 20 * 864e5).toISOString();
['DWINAAA1', 'DWINBBB2', 'DWINCCC3', 'DWINDDD4'].forEach(function (id, i) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'ש' + i], ['משפחה', 'מ'], ['קוד ישיבה', ['givat', 'rishon', 'nertamid', 'lapid'][i]], ['תפקיד', 'תלמיד']]);
});
function win(rid, code, id, pub, extra) {
  c.appendCols_('הגרלות', [['מזהה הגרלה', rid], ['שבוע', '7'], ['סטטוס', 'פורסם'], ['קוד ישיבה', code],
    ['זוכה', id], ['מזהי הזוכה', id], ['שם הזוכה', 'ש מ'], ['פורסם', pub]].concat(extra || []));
}
win('R1', 'givat', 'DWINAAA1', now);
win('R1', 'rishon', 'DWINBBB2', now);
win('R0', 'nertamid', 'DWINCCC3', old, [['פרס', 'book'], ['פרס — איך', 'רכז']]);   // לפני השוברים, נמסר ביד
win('R0', 'lapid', 'DWINDDD4', old, [['פרס — עד', new Date(Date.parse(old) + 2 * 864e5).toISOString()]]);
function vrows() { var V = c.vchTbl_(false); var o = []; if (V) for (var r = 1; r < V.rows.length; r++) o.push({ id: V.c(r, 'מזהה'), p: V.c(r, 'פרס'), st: V.c(r, 'סטטוס'), w: V.c(r, 'שויך לתלמיד'), rid: V.c(r, 'הגרלה'), how: V.c(r, 'אופן'), push: V.c(r, 'התראה'), snt: V.c(r, 'נשלח'), ids: V.c(r, 'מזהי הזוכה') }); return o; }

// 1. בחירה בלי מלאי → נשמרת, "תטופל בקרוב"
var K = raf({ raffle: 'vpick', id: 'DWINAAA1', rid: 'R1', p: 'pizza' });
ok(K.status === 'ok' && K.p === 'pizza' && !K.v && K.wait === 1, 'no stock: pick saved, wait', K);
var P1 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P1.list[0].p === 'pizza' && !P1.list[0].v && P1.von === 1, 'prize list: chosen, no voucher, vouchers on', P1);
// 2. שבועיים: המועד ~14 יום מהפרסום
var due = Date.parse(P1.list[0].due);
ok(Math.abs(due - (Date.parse(now) + 14 * 864e5)) < 60e3, 'due = 14 days', P1.list[0].due);
// 3. עבר המועד (פורסם לפני 20 יום, "עד" ישן של יומיים) → נסגר, בלי בחירה אוטומטית
var PD = raf({ raffle: 'prize', id: 'DWINDDD4', fresh: '1' });
ok(PD.list[0].ov === 1 && !PD.list[0].p && PD.list[0].st === 'pick', 'late: closed, nothing auto-picked', PD);
ok(raf({ raffle: 'vpick', id: 'DWINDDD4', rid: 'R0', p: 'pizza' }).status === 'late', 'late: vpick refused');
// 4. מלאי נטען → הממתין מקבל, הישן (לפני השוברים) לא; בלי נוסח — בלי התראה עדיין
var A = post({ action: 'vchadd', key: 'k', rows: [
  { t: 'פיצה', p: 'pizza', c: 'PZ-1', u: 'https://x.example/1', x: '2026-12-31' },
  { t: 'פיצה', p: 'pizza', c: 'PZ-2', x: '2026-12-31' },
  { t: 'ספר', p: 'book', c: 'BK-1', x: '2026-12-31' }] });
ok(A.status === 'ok' && A.fill === 1, 'stock add → fill 1', A);
var V1 = vrows(), got = V1.filter(function (v) { return v.w === 'DWINAAA1'; });
ok(got.length === 1 && got[0].p === 'pizza' && got[0].rid === 'R1' && got[0].how === 'מהמלאי' && got[0].ids === 'DWINAAA1', 'waiting winner got pizza from stock', V1);
ok(!V1.some(function (v) { return v.w === 'DWINCCC3'; }), 'pre-voucher winner untouched');
ok(PUSH.length === 0 && !got[0].push, 'no push before wording saved');
// 5. הניהול פותח (wadm עם הנוסח) → התראה אחת לזוכה, עם {name}
var L = raf({ raffle: 'wadm', key: 'k', vt: 'הגיע!', vb: '{name}, השובר מחכה' });
ok(PUSH.length === 1 && PUSH[0].b === 'ש, השובר מחכה' && PUSH[0].link === 'hagrala?vch=1' && JSON.parse(PUSH[0].flt).ids[0] === 'DWINAAA1', 'push sent once', PUSH);
c.vchFill_();
ok(PUSH.length === 1, 'no second push');
// 6. בחירה כשיש מלאי — שובר מיד, בלי התראה
var K2 = raf({ raffle: 'vpick', id: 'DWINBBB2', rid: 'R1', p: 'pizza' });
ok(K2.status === 'ok' && K2.v && K2.v.c === 'PZ-2', 'stock: voucher at once', K2);
c.vchFill_();
ok(PUSH.length === 1, 'direct pick: no push');
// 7. שוב מלאי — אין שובר שני לאותה זכייה
post({ action: 'vchadd', key: 'k', rows: [{ t: 'פיצה', p: 'pizza', c: 'PZ-3', x: '2026-12-31' }] });
ok(vrows().filter(function (v) { return v.w === 'DWINAAA1'; }).length === 1, 'no second voucher for same win');
// 8. wadm: השובר עם snt ריק, ו"נשלח" — רק בסיסמה, פעם אחת
var L2 = raf({ raffle: 'wadm', key: 'k' });
var wa = []; L2.list.forEach(function (r) { r.w.forEach(function (x) { wa.push(x); }); });
var xa = wa.filter(function (x) { return x.first === 'ש0'; })[0];
ok(xa && xa.v && xa.v.snt === '' && !xa.vw, 'wadm: voucher, not sent', xa);
ok(raf({ raffle: 'vsent', vid: xa.v.id }).status === 'denied', 'vsent w/o key denied');
var S = raf({ raffle: 'vsent', key: 'k', vid: xa.v.id });
ok(S.status === 'ok' && S.snt, 'vsent marks', S);
var S2 = raf({ raffle: 'vsent', key: 'k', vid: xa.v.id });
ok(S2.snt === S.snt, 'vsent again: same time');
var L3 = raf({ raffle: 'wadm', key: 'k' }), xa3 = null;
L3.list.forEach(function (r) { r.w.forEach(function (x) { if (x.first === 'ש0') xa3 = x; }); });
ok(xa3.v.snt === S.snt, 'wadm shows snt');
// 9. ממתין בלי מלאי מופיע כ-vw
var K3 = raf({ raffle: 'vpick', id: 'DWINBBB2', rid: 'R1', p: 'maafe' });
ok(K3.p === 'pizza', 'second pick ignored (already chosen)');
// 10. החלפת פרס (8.99.549): השובר הקודם → בוטל, פרס חדש + שובר מהמלאי
post({ action: 'vchadd', key: 'k', rows: [{ t: 'ספר', p: 'book', c: 'BK-9', x: '2026-12-31' }] });
var before = vrows().filter(function (v) { return v.w === 'DWINAAA1'; })[0];
ok(raf({ raffle: 'vswap', rid: 'R1', code: 'givat', p: 'book' }).status === 'denied', 'swap w/o key denied');
var SW = raf({ raffle: 'vswap', key: 'k', rid: 'R1', code: 'givat', p: 'book' });
ok(SW.status === 'ok' && SW.v && SW.v.p === 'book', 'swap → new voucher', SW);
var after = vrows().filter(function (v) { return v.w === 'DWINAAA1'; });
ok(after.filter(function (v) { return v.id === before.id; })[0].st === 'בוטל', 'old voucher cancelled');
var PS = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(PS.list[0].p === 'book' && PS.list[0].v && PS.list[0].v.p === 'book', 'student sees new prize + voucher', PS.list[0]);
ok(raf({ raffle: 'vswap', key: 'k', rid: 'R1', code: 'givat', p: 'book' }).status === 'error', 'swap to same prize refused');
c.vchFill_();
ok(vrows().filter(function (v) { return v.w === 'DWINAAA1' && v.st !== 'בוטל'; }).length === 1, 'still one live voucher after fill');
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
