// "לצפייה בשובר" (8.99.485) — נצפה, שיוך רכז, רשימת הזוכים לרכז — מול apps-script.gs בזיכרון.
// node tools/vchtest/seen.js → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
var pub = new Date().toISOString();
c.appendCols_('לומדים', [['מזהה', 'DWINAAA1'], ['שם', 'א'], ['משפחה', 'ב'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד'], ['טלפון', '0500000001']]);
c.appendCols_('לומדים', [['מזהה', 'DWINBBB2'], ['שם', 'ג'], ['משפחה', 'ד'], ['קוד ישיבה', 'rishon'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'DWINCCC3'], ['שם', 'ה'], ['משפחה', 'ו'], ['קוד ישיבה', 'nertamid'], ['תפקיד', 'תלמיד']]);
// הגרלה ישנה (R0) — לפני השוברים: לזוכה פרס בלי שובר, לשני אין פרס.
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R0'], ['שבוע', '4'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'rishon'],
  ['זוכה', 'DWINBBB2'], ['מזהי הזוכה', 'DWINBBB2'], ['שם הזוכה', 'ג ד'], ['פורסם', pub], ['פרס', 'pizza'], ['פרס — איך', 'בחר']]);
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R0'], ['שבוע', '4'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'nertamid'],
  ['זוכה', 'DWINCCC3'], ['מזהי הזוכה', 'DWINCCC3'], ['שם הזוכה', 'ה ו'], ['פורסם', pub], ['פרס — עד', '2020-01-01T00:00:00Z']]);
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R1'], ['שבוע', '5'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'givat'],
  ['זוכה', 'DWINAAA1'], ['מזהי הזוכה', 'DWINAAA1'], ['שם הזוכה', 'א ב'], ['פורסם', pub]]);
// הרשימה הציבורית לפני הכול
c.CacheService.getScriptCache().removeAll(['raf:all']);
var PUB0 = JSON.stringify(raf({ raffle: 'all' }));
post({ action: 'vchadd', key: 'k', rows: [
  { t: 'פיצה', p: 'pizza', c: 'PZ-1', u: 'https://x.example/1', x: '2026-12-31' },
  { t: 'פיצה', p: 'pizza', c: 'PZ-2', x: '2026-12-31' },
  { t: 'ספר', p: 'book', c: 'BK-1', x: '2026-12-31' }] });
raf({ raffle: 'von', key: 'k', v: '1' });
// בחירה → שובר, עוד לא נצפה
var K = raf({ raffle: 'vpick', id: 'DWINAAA1', rid: 'R1', p: 'pizza' });
ok(K.status === 'ok' && K.v && K.v.sn === '', 'new voucher: not seen', K);
var P1 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P1.list[0].v && P1.list[0].v.sn === '', 'prize list carries sn empty');
// vseen — זר נדחה, בלי מזהה נדחה
ok(raf({ raffle: 'vseen', id: 'DWINBBB2', vid: K.v.id }).status === 'denied', 'seen: not mine denied');
ok(raf({ raffle: 'vseen', id: 'DWINAAA1', vid: '' }).status === 'denied', 'seen: no vid denied');
var S1 = raf({ raffle: 'vseen', id: 'DWINAAA1', vid: K.v.id });
ok(S1.status === 'ok' && S1.sn[K.v.id], 'seen: written', S1);
var V = W.priv.getSheetByName('שוברים'), H = V.d[0];
var row = V.d.filter(function (r) { return r[H.indexOf('מזהה')] === K.v.id || String(r[H.indexOf('מזהה')]).replace(/^'/, '') === K.v.id; })[0];
ok(row && String(row[H.indexOf('סטטוס')]).replace(/^'/, '') === 'שויך' && !row[H.indexOf('מומש')], 'seen: status/used untouched', row);
var t1 = S1.sn[K.v.id];
var S2 = raf({ raffle: 'vseen', id: 'DWINAAA1', vid: K.v.id });
ok(S2.status === 'ok' && S2.sn[K.v.id] === t1, 'seen again: same record', S2);
var P2 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P2.list.filter(function (x) { return x.rid === 'R1'; })[0].v.sn === t1, 'prize list shows sn');
var U = raf({ raffle: 'vused', id: 'DWINAAA1', vid: K.v.id });
ok(U.v.st === 'used' && U.v.sn === t1, 'used keeps seen');
// vattach — בלי סיסמה נדחה
ok(raf({ raffle: 'vattach', rid: 'R0', code: 'rishon' }).status === 'denied', 'attach w/o key denied');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R0', code: 'nertamid' }).status === 'error', 'attach: no prize → error');
var A = raf({ raffle: 'vattach', key: 'k', rid: 'R0', code: 'rishon' });
ok(A.status === 'ok' && A.v && A.v.c === 'PZ-2' && A.v.sn === '', 'attach: voucher of same type', A);
var T = c.rafRead_(), rr = -1;
for (var i = 1; i < T.rows.length; i++) if (T.c(i, 'מזהה הגרלה') === 'R0' && T.c(i, 'קוד ישיבה') === 'rishon') rr = i;
ok(T.c(rr, 'פרס') === 'pizza' && T.c(rr, 'פרס — איך') === 'בחר' && !T.c(rr, 'פרס — מתי'), 'attach: prize columns untouched');
ok(raf({ raffle: 'vattach', key: 'k', rid: 'R0', code: 'rishon' }).message === 'לזוכה הזה כבר שויך שובר', 'attach twice refused');
// רשימת הרכז — בלי הגרלה אוטומטית לזוכה הישן שלא בחר
var L = raf({ raffle: 'wadm', key: 'k' });
ok(raf({ raffle: 'wadm' }).status === 'denied', 'wadm w/o key denied');
var r0 = L.list.filter(function (x) { return x.rid === 'R0'; })[0];
var nt = r0 && r0.w.filter(function (x) { return x.code === 'nertamid'; })[0];
ok(nt && !nt.p && !nt.v, 'wadm: old winner without prize stays without (no auto)', nt);
var rs = r0 && r0.w.filter(function (x) { return x.code === 'rishon'; })[0];
ok(rs && rs.p === 'pizza' && rs.v && rs.v.how === 'רכז' && rs.v.sn === '', 'wadm: attached voucher, not seen', rs);
var r1 = L.list.filter(function (x) { return x.rid === 'R1'; })[0].w[0];
ok(r1.v && r1.v.st === 'used' && r1.v.sn === t1 && r1.ph === '0500000001', 'wadm: used + seen + phone', r1);
ok(L.list[0].rid === 'R1', 'wadm: newest first');
// "קבע פרס" להגרלה ישנה — rafPrzSet_ הקיים
var PS = raf({ raffle: 'prizeset', key: 'k', rid: 'R0', code: 'nertamid', p: 'book' });
ok(PS.status === 'ok' && PS.v && PS.v.c === 'BK-1', 'prizeset on old raffle', PS);
// הרשימה הציבורית — זהה לחלוטין
c.CacheService.getScriptCache().removeAll(['raf:all']);
var PUB1 = JSON.stringify(raf({ raffle: 'all' }));
ok(PUB0 === PUB1, 'public list identical', [PUB0, PUB1]);
ok(PUB1.indexOf('PZ-') < 0 && PUB1.indexOf('DWIN') < 0 && PUB1.indexOf('050') < 0, 'public: no codes/ids/phones');
console.log(n - fails + '/' + n + ' passed');
if (Object.keys(M.missing).length) console.log('missing mocks:', Object.keys(M.missing).join(', '));
process.exit(fails ? 1 : 0);
