// צמאה — אוטובוסים (8.99.611): הרשאות, שיבוץ, הגעה, אישור הורים (ניהול גובר), איפוס ושחזור. נתונים מומצאים.
// node tools/bustest/run.js
var M = require('../snaptest/mock.js'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var A = ['אלף', 'בית'].join(' '), B = ['גימל', 'דלת'].join(' '), R1 = ['הא', 'וו'].join(' '), R2 = ['זין', 'חית'].join(' ');
var W = M.makeWorld(), c = W.ctx;
c.TZM_CLOSED_ = false;
c.sheet_('תלמידי הרשת').getRange(1, 1, 3, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'],
  ['lapid', 'ז', '3', 'אלף', 'בית'], ['lapid', 'ז', '3', 'גימל', 'דלת']]);
function g(P) { CacheServiceClear(); return JSON.parse(c.doGet({ parameter: P }).t); }
function CacheServiceClear() { try { c.CacheService.getScriptCache().remove('bus:st'); c.CacheService.getScriptCache().remove('bus:tz'); } catch (e) {} }
var tz = JSON.parse(c.doGet({ parameter: { tzm: 'adm', key: 'k' } }).t);
c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: tz.k, by: 'x', ch: [{ g: 'ז', c: '3', n: A, on: 1 }, { g: 'ז', c: '3', n: B, on: 1 }] }) } });
ok(c.tzmReg_().length === 2, 'two registered');
// לשונית האוטובוסים — צוות
var ad = g({ bus: 'adm', w: 'adm', key: 'k' });
ok(ad.status === 'ok' && ad.p && ad.a && ad.b && ad.cap === 50 && ad.cnt === 6, 'adm keys + defaults', ad);
ok(g({ bus: 'adm', w: 'adm', key: 'bad' }).status === 'denied', 'bad key');
ok(g({ bus: 'st', w: 'a', x: 'nope' }).status === 'denied', 'bad link');
ok(g({ bus: 'adm', w: 'a', x: ad.a }).status === 'denied', 'link a no admin');
var st = g({ bus: 'st', w: 'a', x: ad.a });
ok(st.status === 'ok' && st.buses.length === 6 && st.p.length === 2, 'state', st);
var bt = W.priv.getSheetByName('צמאה — אוטובוסים');
ok(bt && bt.d.length === 7, 'bus tab seeded');
bt.getRange(2, 2, 1, 2).setValues([[R1, R2]]);
st = g({ bus: 'st', w: 'a', x: ad.a });
ok(st.p.length === 4, 'staff added', st.p);
var r1 = st.p.filter(function (x) { return x[0] === 'r|' + R1; })[0];
ok(r1 && r1[5] === 1 && r1[1] === 'r', 'staff on own bus', r1);
var kA = 's|ז|3|' + A, kB = 's|ז|3|' + B;
// שיבוץ: a כן, b ו-p לא
ok(g({ bus: 'set', w: 'b', x: ad.b, k: kA, f: 'b', v: '1' }).status === 'denied', 'b cannot move');
ok(g({ bus: 'set', w: 'p', x: ad.p, k: kA, f: 'b', v: '1' }).status === 'denied', 'p cannot move');
ok(g({ bus: 'set', w: 'a', x: ad.a, k: kA, f: 'b', v: '1' }).status === 'ok', 'a moves');
ok(g({ bus: 'set', w: 'a', x: ad.a, k: kA, f: 'b', v: '9' }).status === 'error', 'bus out of range');
ok(g({ bus: 'set', w: 'adm', key: 'k', k: kB, f: 'b', v: '2' }).status === 'ok', 'adm moves');
// p: רק תלמידים, בלי אוטובוס
var sp = g({ bus: 'st', w: 'p', x: ad.p });
ok(sp.status === 'ok' && sp.p.length === 2 && !sp.buses && sp.p[0].length === 7, 'p view', sp);
// אישור: ר"ם, אחר כך ניהול גובר
ok(g({ bus: 'set', w: 'p', x: ad.p, k: kA, f: 'ap', v: 'y', by: R1 }).status === 'ok', 'rav approves');
ok(g({ bus: 'set', w: 'a', x: ad.a, k: kA, f: 'ap', v: 'y' }).status === 'denied', 'a cannot approve');
ok(g({ bus: 'set', w: 'p', x: ad.p, k: 'r|' + R1, f: 'ap', v: 'y' }).status === 'error', 'no approval for staff');
var pa = function () { return g({ bus: 'st', w: 'a', x: ad.a }).p.filter(function (x) { return x[0] === kA; })[0]; };
ok(pa()[7] === 'y', 'effective y');
ok(g({ bus: 'set', w: 'adm', key: 'k', k: kA, f: 'ap', v: 'n' }).status === 'ok', 'admin override n');
ok(pa()[7] === 'n' && pa()[8] === 1, 'override wins');
ok(g({ bus: 'set', w: 'p', x: ad.p, k: kA, f: 'ap', v: 'y', by: R1 }).status === 'ok' && pa()[7] === 'n', 'rav cannot beat admin');
ok(g({ bus: 'set', w: 'adm', key: 'k', k: kA, f: 'ap', v: '' }).status === 'ok' && pa()[7] === 'y', 'override cleared → rav');
// הגעה: b רק באוטובוס שלו
ok(g({ bus: 'set', w: 'b', x: ad.b, bn: '2', k: kA, f: 'h', v: '1' }).status === 'denied', 'b wrong bus');
ok(g({ bus: 'set', w: 'b', x: ad.b, bn: '1', k: kA, f: 'h', v: '1' }).status === 'ok', 'b marks');
ok(g({ bus: 'set', w: 'a', x: ad.a, k: 'r|' + R1, f: 'h', v: '1' }).status === 'ok', 'a marks staff');
var sb = g({ bus: 'st', w: 'b', x: ad.b, bn: '1' });
ok(sb.p.length === 3 && sb.p.every(function (x) { return x[5] === 1; }), 'b view only bus 1', sb.p);
ok(sb.p.filter(function (x) { return x[6]; }).length === 2, 'two arrived');
// איפוס
ok(g({ bus: 'rst', w: 'p', x: ad.p, bn: '1' }).status === 'denied', 'p cannot reset');
var rs = g({ bus: 'rst', w: 'b', x: ad.b, bn: '1', by: R1 });
ok(rs.status === 'ok' && rs.n === 2, 'reset', rs);
sb = g({ bus: 'st', w: 'b', x: ad.b, bn: '1' });
ok(sb.p.filter(function (x) { return x[6]; }).length === 0, 'cleared');
var a2 = sb.p.filter(function (x) { return x[0] === kA; })[0];
ok(a2[5] === 1 && a2[7] === 'y', 'assignment + approval kept');
var lg = g({ bus: 'log', w: 'b', x: ad.b, bn: '1' });
ok(lg.log.length === 1 && lg.log[0][1] === R1 && lg.log[0][2] === 2 && lg.log[0][3] === 0, 'log', lg);
ok(W.priv.getSheetByName('צמאה — איפוס').d.length === 2, 'log row');
// שחזור
var un = g({ bus: 'undo', w: 'b', x: ad.b, bn: '1', by: R1 });
ok(un.status === 'ok' && un.n === 2, 'undo', un);
ok(g({ bus: 'st', w: 'b', x: ad.b, bn: '1' }).p.filter(function (x) { return x[6]; }).length === 2, 'restored');
ok(g({ bus: 'undo', w: 'b', x: ad.b, bn: '1' }).status === 'none', 'undo once');
ok(g({ bus: 'log', w: 'b', x: ad.b, bn: '1' }).log[0][3] === 1, 'log restored');
// איפוס של אוטובוס אחר לא נוגע
g({ bus: 'set', w: 'a', x: ad.a, k: kB, f: 'h', v: '1' });
g({ bus: 'rst', w: 'b', x: ad.b, bn: '1' });
ok(g({ bus: 'st', w: 'a', x: ad.a }).p.filter(function (x) { return x[0] === kB; })[0][6] === 1, 'other bus untouched');
// הגדרות
var cf = g({ bus: 'cfg', w: 'adm', key: 'k', cap: '45', cnt: '7' });
ok(cf.cap === 45 && cf.cnt === 7, 'cfg', cf);
ok(g({ bus: 'cfg', w: 'a', x: ad.a, cap: '1' }).status === 'denied', 'a no cfg');
ok(g({ bus: 'st', w: 'a', x: ad.a }).buses.length === 7, '7 buses');
// ר"ם שמגיע — נכנס לשיבוץ
var rt = c.tzmRamSheet_(); rt.getRange(2, 1, 1, 3).setValues([[R1 + 'x', 'ז׳3', 'כן']]);
ok(g({ bus: 'st', w: 'a', x: ad.a }).p.filter(function (x) { return x[0] === 'r|' + R1 + 'x'; }).length === 1, 'arriving rav listed');
// תלמיד שבוטל — יוצא מהרשימה
c.doPost({ postData: { contents: JSON.stringify({ action: 'tzm', k: tz.k, by: 'x', ch: [{ g: 'ז', c: '3', n: B, on: 0 }] }) } });
ok(g({ bus: 'st', w: 'a', x: ad.a }).p.filter(function (x) { return x[0] === kB; }).length === 0, 'cancelled hidden');
console.log(fails ? fails + ' FAILED of ' + n : 'all ' + n + ' passed');
process.exit(fails ? 1 : 0);
