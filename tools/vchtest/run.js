// שוברי זכייה (8.99.471) — מול apps-script.gs עצמו בזיכרון.
// node tools/vchtest/run.js  → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
var pub = new Date().toISOString();
c.appendCols_('לומדים', [['מזהה', 'DWINAAA1'], ['שם', 'א'], ['משפחה', 'ב'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'DWINBBB2'], ['שם', 'ג'], ['משפחה', 'ד'], ['קוד ישיבה', 'rishon'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'DWINCCC3'], ['שם', 'ה'], ['משפחה', 'ו'], ['קוד ישיבה', 'nertamid'], ['תפקיד', 'תלמיד']]);
['givat|DWINAAA1|א ב', 'rishon|DWINBBB2|ג ד', 'nertamid|DWINCCC3|ה ו'].forEach(function (x) {
  var a = x.split('|');
  c.appendCols_('הגרלות', [['מזהה הגרלה', 'R1'], ['שבוע', '5'], ['סטטוס', 'פורסם'], ['קוד ישיבה', a[0]],
    ['זוכה', a[1]], ['מזהי הזוכה', a[1]], ['שם הזוכה', a[2]], ['פורסם', pub]]);
});
// כבוי: כמו קודם — אין von, vpick מסרב.
var P0 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P0.list.length === 1 && P0.list[0].st === 'pick' && !P0.von, 'off: prize list as before', P0);
ok(raf({ raffle: 'vpick', id: 'DWINAAA1', rid: 'R1', p: 'pizza' }).status === 'off', 'off: vpick refused');
// הזנה: בלי סיסמה — נדחית.
ok(post({ action: 'vchadd', key: 'bad', rows: [{ c: 'X', p: 'pizza', x: '2026-12-31' }] }).status === 'denied', 'add w/o key denied');
var A1 = post({ action: 'vchadd', key: 'k', bid: 'b1', rows: [
  { t: 'פיצה משפחתית', p: 'pizza', c: 'PZ-1', u: 'https://x.example/1', x: '31.12.2026', cost: '₪45' },
  { t: 'פיצה משפחתית', p: 'pizza', c: 'PZ-2', u: 'https://x.example/2', x: '46387' },
  { t: 'ארוחת ילדים', p: 'burger', c: 'BG-1', u: 'javascript:alert(1)', x: '2026-12-30' },
  { t: 'ישן', p: 'burger', c: 'BG-OLD', x: '2020-01-01' },
  { t: 'בלי תפוגה', p: 'burger', c: 'BG-NOX', x: '' },
  { t: 'כפול', p: 'pizza', c: 'PZ-1', x: '2026-12-31' }] });
ok(A1.status === 'ok' && A1.add === 4 && A1.dup === 1 && A1.bad === 1, 'add: 4 added, 1 dup, 1 bad', A1);
var AD = raf({ raffle: 'vadm', key: 'k', bid: 'b1' });
ok(AD.bres && AD.bres.add === 4, 'bid result readable', AD.bres);
ok(AD.by.pizza.a === 2 && AD.by.burger.a === 1 && AD.by.burger.x === 1, 'stock counts (expired apart)', AD.by);
ok(AD.low.indexOf('pizza') >= 0, 'low stock flagged');
var V = W.priv.getSheetByName('שוברים');
ok(V && !W.pub.getSheetByName('שוברים'), 'tab in private sheet only');
ok(V.d.some(function (r) { return r.indexOf('פג תוקף') >= 0; }), 'expired available written as פג תוקף');
ok(!V.d.some(function (r) { return String(r.join('|')).indexOf('javascript:') >= 0; }), 'non-http link dropped');
// הדלקה
ok(raf({ raffle: 'von', key: 'k', v: '1' }).on === 1, 'switch on');
ok(raf({ raffle: 'von', v: '1' }).status === 'denied', 'switch w/o key denied');
var P1 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P1.von === 1 && P1.vs.pizza === 2 && P1.vs.book === 0, 'on: stock in prize list', P1);
// זר — נדחה
ok(raf({ raffle: 'vpick', id: 'DSTRANGE9', rid: 'R1', p: 'pizza' }).status === 'denied', 'stranger denied');
// בחירה
var K1 = raf({ raffle: 'vpick', id: 'DWINAAA1', rid: 'R1', p: 'pizza' });
ok(K1.status === 'ok' && K1.v && K1.v.c === 'PZ-1' && K1.v.st === 'in' && K1.v.x === '2026-12-31', 'pick → voucher (earliest expiry)', K1);
// לחיצה חוזרת / רענון — אותו שובר, גם אם ביקש פרס אחר
var K2 = raf({ raffle: 'vpick', id: 'DWINAAA1', rid: 'R1', p: 'burger' });
ok(K2.status === 'ok' && K2.v.c === 'PZ-1', 'repeat = same voucher, no 2nd', K2);
ok(raf({ raffle: 'vadm', key: 'k' }).by.pizza.a === 1, 'stock decremented once');
var P2 = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
ok(P2.list[0].p === 'pizza' && P2.list[0].how === 'בחר' && P2.list[0].v && P2.list[0].v.c === 'PZ-1', 'prize list carries voucher', P2.list[0]);
// השני לוקח את הפיצה האחרונה; השלישי — אזל
var K3 = raf({ raffle: 'vpick', id: 'DWINBBB2', rid: 'R1', p: 'pizza' });
ok(K3.v && K3.v.c === 'PZ-2', 'second winner gets the other');
var K4 = raf({ raffle: 'vpick', id: 'DWINCCC3', rid: 'R1', p: 'pizza' });
ok(K4.status === 'out' && K4.vs.pizza === 0 && K4.vs.burger === 1, 'out of stock → out + stock', K4);
var P3 = raf({ raffle: 'prize', id: 'DWINCCC3', fresh: '1' });
ok(P3.list[0].st === 'pick' && !P3.list[0].p, 'out: nothing taken, still pick');
// אף שובר לא חולק פעמיים
var codes = {}; var dupl = false;
V.d.slice(1).forEach(function (r) { var st = r[V.d[0].indexOf('סטטוס')], cd = r[V.d[0].indexOf('קוד')]; if (st === 'שויך') { if (codes[cd]) dupl = true; codes[cd] = 1; } });
ok(!dupl, 'no code assigned twice');
// מימשתי — רק שלי
ok(raf({ raffle: 'vused', id: 'DWINBBB2', vid: K1.v.id }).status === 'denied', 'used: not mine denied');
var U = raf({ raffle: 'vused', id: 'DWINAAA1', vid: K1.v.id });
ok(U.status === 'ok' && U.v.st === 'used' && !U.v.c, 'used → מומש, code hidden', U);
// הרכז (זוכה בלי אפליקציה): prizeset משייך שובר
var S = raf({ raffle: 'prizeset', key: 'k', rid: 'R1', code: 'nertamid', p: 'burger' });
ok(S.status === 'ok' && S.v && S.v.c === 'BG-1', 'coordinator path assigns voucher', S);
var TT = c.rafRead_(), DD = c.rafById_(TT, 'R1'); c.rafPrzAdm_(TT, DD);
var nt = (DD.rows || []).filter(function (x) { return x.code === 'nertamid'; })[0];
ok(nt && nt.v && nt.v.c === 'BG-1' && nt.v.how === 'רכז', 'admin state shows voucher', nt);
// פרסים ותקציב — השובר רשום, העלות מהקובץ
var PZ = JSON.parse(c.przRoute_({ parameter: { prz: 'state', key: 'k' } }).t);
var g = PZ.list.filter(function (x) { return x.code === 'givat'; })[0];
ok(g && g.vch && g.vch.how === 'בחר' && g.cost === 45, 'budget: voucher noted + cost filled', g);
ok(PZ.sum.comN === 3, 'budget: all 3 committed', PZ.sum);
// הגרלה אוטומטית אחרי המועד: רק בין הפרסים שיש להם שובר, והשובר משויך.
post({ action: 'vchadd', key: 'k', rows: [{ t: 'מאפה', p: 'maafe', c: 'MF-1', x: '2027-01-15' }] });
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R2'], ['שבוע', '6'], ['סטטוס', 'פורסם'], ['קוד ישיבה', 'givat'],
  ['זוכה', 'DWINAAA1'], ['מזהי הזוכה', 'DWINAAA1'], ['שם הזוכה', 'א ב'], ['פורסם', pub], ['פרס — עד', '2020-01-01T00:00:00Z']]);
var PA = raf({ raffle: 'prize', id: 'DWINAAA1', fresh: '1' });
var r2 = PA.list.filter(function (x) { return x.rid === 'R2'; })[0];
ok(r2 && r2.p === 'maafe' && r2.how === 'הוגרל' && r2.v && r2.v.c === 'MF-1', 'auto-draw picks stocked prize + voucher', r2);
// כבוי שוב — השוברים שכבר שויכו נשארים אצל התלמיד
raf({ raffle: 'von', key: 'k', v: '0' });
var P4 = raf({ raffle: 'prize', id: 'DWINBBB2', fresh: '1' });
ok(!P4.von && P4.list[0].v && P4.list[0].v.c === 'PZ-2', 'off again: issued voucher still shown');
console.log(n - fails + '/' + n + ' passed');
if (Object.keys(M.missing).length) console.log('missing mocks:', Object.keys(M.missing).join(', '));
process.exit(fails ? 1 : 0);
