// עד חמישי 19:00 · בחירה אוטומטית (8.99.568 — רק לזוכה בלי אפליקציה) בלי הודעת "לא בחרת" · התראה "זכית {p}" · "ראה שזכה" (8.99.551).
// node tools/vchtest/thu.js → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
var PUSH = [];
c.ghFire_ = function (t, b, o, g, k, who, link, role, wait, flt) { PUSH.push({ t: t, b: b, link: link, flt: flt }); return { status: 'ok' }; };
// 1. חמישי 19:00 שעון ישראל
var iso = function (ms) { return new Date(ms).toISOString(); };
ok(iso(c.rafThu_(Date.parse('2026-11-29T08:00:00Z'))) === '2026-12-03T17:00:00.000Z', 'Sunday → Thu 19:00 (winter +2)', iso(c.rafThu_(Date.parse('2026-11-29T08:00:00Z'))));
ok(iso(c.rafThu_(Date.parse('2026-12-02T10:00:00Z'))) === '2026-12-03T17:00:00.000Z', 'Wednesday mid-week → next day');
ok(iso(c.rafThu_(Date.parse('2026-12-03T16:59:00Z'))) === '2026-12-03T17:00:00.000Z', 'Thursday 18:59 → same evening');
ok(iso(c.rafThu_(Date.parse('2026-12-03T17:30:00Z'))) === '2026-12-10T17:00:00.000Z', 'Thursday after 19:00 → next week');
ok(iso(c.rafThu_(Date.parse('2027-05-02T08:00:00Z'))) === '2027-05-06T16:00:00.000Z', 'summer +3');
// 2. זוכים
['AmWINAAA1', 'AmWINBBB2', 'DWINCCC3', 'DWINEEE5'].forEach(function (id, i) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'ש' + i], ['משפחה', 'מ'], ['קוד ישיבה', ['givat', 'rishon', 'lapid', 'givat'][i]], ['תפקיד', 'תלמיד']]);
});
var old = new Date(Date.now() - 40 * 864e5).toISOString(), pub0 = '2026-11-15T08:00:00Z';
function win(rid, code, id, pub) {
  c.appendCols_('הגרלות', [['מזהה הגרלה', rid], ['שבוע', '7'], ['סטטוס', 'פורסם'], ['קוד ישיבה', code],
    ['זוכה', id], ['מזהי הזוכה', id], ['שם הזוכה', 'ש מ'], ['פורסם', pub]]);
}
win('R1', 'givat', 'AmWINAAA1', pub0);       // פורסם 15.11 → רצפה 26.11
win('R1', 'rishon', 'AmWINBBB2', pub0);
win('R0', 'lapid', 'DWINCCC3', old);
win('R1', 'givat', 'DWINEEE5', pub0);       // עם אפליקציה — אין מועד, לא נבחר בשבילו        // לפני השוברים — לא נוגעים
var P1 = raf({ raffle: 'prize', id: 'AmWINAAA1', fresh: '1' });
ok(P1.list[0].due === '2026-11-26T17:00:00.000Z', 'existing raffle: floor Thu 26.11 19:00', P1.list[0].due);
// 3. ראה שזכה
ok(raf({ raffle: 'wseen', id: 'AmWINBBB2', rid: 'R1', role: 'dad' }).status === 'denied', 'wseen: parent denied');
ok(raf({ raffle: 'wseen', id: 'DWINCCC3', rid: 'R1' }).status === 'denied', 'wseen: not the winner denied');
var S = raf({ raffle: 'wseen', id: 'AmWINAAA1', rid: 'R1' });
ok(S.status === 'ok' && S.ws.R1, 'wseen ok', S);
var S2 = raf({ raffle: 'wseen', id: 'AmWINAAA1', rid: 'R1' });
ok(S2.ws.R1 === S.ws.R1, 'wseen once (time kept)');
ok(raf({ raffle: 'prize', id: 'AmWINAAA1', fresh: '1' }).list[0].ws === 1, 'prize list carries ws');
var L = raf({ raffle: 'wadm', key: 'k', vat: 'זכית {p}! 🎉', vab: '{name}, השובר שלך מחכה באפליקציה', vt: 'השובר הגיע', vb: '{name} הגיע',
              vpn: JSON.stringify({ pizza: 'פיצה', book: 'ספר', burger: 'בורגר', maafe: 'מאפה', pretzel: 'בייגלה' }) }), xa = null, xb = null;
L.list.forEach(function (r) { r.w.forEach(function (x) { if (x.first === 'ש0') xa = x; if (x.first === 'ש1') xb = x; }); });
ok(xa.ws === S.ws.R1 && !xb.ws, 'wadm: seen / not seen', [xa.ws, xb.ws]);
// 4. לפני המועד — אין בחירה אוטומטית
c.rafPrzAutoAll_();
ok(!raf({ raffle: 'prize', id: 'AmWINAAA1', fresh: '1' }).list[0].p, 'before deadline: nothing picked');
// 5. אחרי המועד: מלאי פיצה אחד → אחד מקבל פיצה עם שובר, השני — פרס בלי שובר, ממתין
post({ action: 'vchadd', key: 'k', rows: [{ t: 'פיצה', p: 'pizza', c: 'PZ-1', x: '2027-12-31' }] });
var realNow = Date.now;
Date.now = function () { return Date.parse('2026-11-26T17:30:00Z'); };
c.autoRecount();
// 8.99.572 — אין בחירה אוטומטית לאף זוכה (גם בלי אפליקציה: הרכז בוחר בקישור).
var A = raf({ raffle: 'prize', id: 'AmWINAAA1', fresh: '1' }).list[0], B = raf({ raffle: 'prize', id: 'AmWINBBB2', fresh: '1' }).list[0];
ok(!A.p && !B.p && !A.v && !B.v, 'after deadline: nothing picked automatically (no-app too)', [A, B]);
ok(!raf({ raffle: 'prize', id: 'DWINCCC3', fresh: '1' }).list[0].p, 'pre-voucher raffle untouched');
var E = raf({ raffle: 'prize', id: 'DWINEEE5', fresh: '1' }).list[0];
ok(!E.p && !E.ov && E.st === 'pick', 'app winner: no auto pick, still open', E);
ok(raf({ raffle: 'vpick', id: 'DWINEEE5', rid: 'R1', p: 'book' }).status !== 'late', 'app winner can pick after Thursday');
ok(PUSH.length === 0, 'no "זכית" push without a pick', PUSH);
Date.now = realNow;
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
