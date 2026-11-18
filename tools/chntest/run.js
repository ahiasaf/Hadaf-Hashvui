// חוברות חנוכה (8.99.530) — ?chn= ו-POST action:'chn' מול apps-script.gs בזיכרון.
// node tools/chntest/run.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function tab() { return W.priv.getSheetByName('חוברות חנוכה') || W.pub.getSheetByName('חוברות חנוכה'); }
function rows() { var s = tab(); return s ? s.d.length - 1 : 0; }
function hex(ch) { return ch.repeat(48); }
// רשימות: תלמידי הרשת — ז3: 3, ח1: 2; תלמידי בית הספר — ז׳3: 2 (חופף), ט2: 4; ישיבה אחרת — לא נספרת
var net = c.sheet_('תלמידי הרשת');
net.getRange(1, 1, 7, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'],
  ['tst', 'ז', '3', 'א', 'ב'], ['tst', 'ז׳', 'ז3', 'ג', 'ד'], ['tst', 'ז', '3', 'ה', 'ו'],
  ['tst', 'ח', '1', 'ז', 'ח'], ['tst', 'ח', '1', 'ט', 'י'], ['other', 'ז', '3', 'כ', 'ל']]);
var sch = c.sheet_('תלמידי בית הספר');
sch.getRange(1, 1, 7, 4).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'שם'],
  ['tst', 'ז׳', '3', 'א ב'], ['tst', 'ז', '3', 'ג ד'], ['tst', 'ט', '2', 'מ'], ['tst', 'ט', '2', 'נ'], ['tst', 'ט', '2', 'ס'], ['tst', 'ט', '2', 'ע']]);
var acc = c.sheet_('גישה');
acc.getRange(1, 1, 2, 4).setValues([['מזהה', 'מצב', 'קוד ישיבה', 'תפקיד'], ['Dstaff1', 'אושר', 'tst', 'ר"ם']]);

var L = get({ chn: 'cls', y: 'tst' });
ok(L.status === 'ok' && L.open === 'none', 'no deadline → none', L);
var m = {}; (L.cls || []).forEach(function (x) { m[x[0] + x[1]] = x[2]; });
ok(m['ז3'] === 3, 'overlap → max, not sum (3)', L.cls);
ok(m['ח1'] === 2 && m['ט2'] === 4, 'single sources counted', L.cls);
ok(!('other' in m) && JSON.stringify(L).indexOf('א ב') < 0, 'no names leaked');
ok(L.cls[0][0] === 'ז' && L.cls[2][0] === 'ט', 'sorted by grade', L.cls);
ok(get({ chn: 'cls', y: 'nolist' }).cls.length === 0, 'inst without list → empty, not zero rows');

var F = { y: 'tst', yn: 'ישיבת בדיקה', g: 'ז', c: '3', n: 'ר"ם א', b: 3, p: '1' };
// לפני שנקבע מועד — סגור לאמיתי, פתוח לבדיקה
ok(post({ action: 'chn', op: hex('a'), rq: hex('1'), f: F }).status === 'closed' && rows() === 0, 'real closed before deadline');
var Ft = JSON.parse(JSON.stringify(F)); Ft.tst = '1';
var rt = post({ action: 'chn', op: hex('b'), rq: hex('1'), f: Ft });
ok(rt.saved && rows() === 1, 'test row allowed before deadline', rt);
// ניהול
ok(get({ chn: 'adm' }).status === 'denied', 'adm needs key');
ok(get({ chn: 'close', at: '2099-01-01T10:00:00Z' }).status === 'denied', 'close needs key');
var cl = get({ chn: 'close', key: 'k', at: new Date(Date.now() + 86400000).toISOString() });
ok(cl.open === 'open', 'deadline set → open', cl);
var A = get({ chn: 'adm', key: 'k' });
ok(A.rows.length === 0, 'test rows hidden from real admin', A);
ok(get({ chn: 'adm', key: 'k', tst: '1' }).rows.length === 1, 'test rows with tst=1');

// הזמנה אמיתית
var r1 = post({ action: 'chn', op: hex('c'), rq: hex('1'), f: F });
ok(r1.saved && r1.o.b === 3 && r1.o.p === 1 && r1.o.pn === 3 && r1.o.st === 'ok', 'saved real', r1);
ok(rows() === 2, 'one real row');
var k1 = get({ chn: 'chk', op: hex('c') });
ok(k1.saved && k1.o.b === 3 && k1.o.g === 'ז' && k1.o.c === '3', 'check returns saved', k1);
ok(JSON.stringify(k1).indexOf('ר"ם') < 0, 'check without name');
ok(get({ chn: 'chk', op: hex('9') }).saved === false, 'unknown op → not saved');
// לחיצה כפולה / רענון — אותו op
ok(post({ action: 'chn', op: hex('c'), rq: hex('1'), f: F }).dup && rows() === 2, 'same op → no row');
// אותו מבקש, op חדש, כמות אחרת, בלי תרגול — עדכון
var F2 = JSON.parse(JSON.stringify(F)); F2.b = 5; F2.p = '0';
var r2 = post({ action: 'chn', op: hex('d'), rq: hex('1'), f: F2 });
ok(r2.saved && r2.o.b === 5 && r2.o.p === 0 && r2.o.pn === 0 && rows() === 2, 'same requester → update', r2);
A = get({ chn: 'adm', key: 'k' });
ok(A.rows.length === 1 && /3\/3 → 5\/0/.test(A.rows[0].h), 'history kept', A.rows[0]);
ok(A.rows[0].n0 === '3', 'repo count stored server-side', A.rows[0]);
ok(get({ chn: 'chk', op: hex('c') }).saved, 'older op still recognised');
// מבקש אחר לאותה כיתה (גם "ז׳ 3") — לבירור
var F3 = JSON.parse(JSON.stringify(F)); F3.n = 'ר"ם ב'; F3.g = 'ז׳'; F3.c = 'ז 3'; F3.b = 9;
var r3 = post({ action: 'chn', op: hex('e'), rq: hex('2'), f: F3 });
ok(r3.saved && r3.o.st === 'ask', 'other requester → ask', r3);
A = get({ chn: 'adm', key: 'k' });
var act = A.rows.filter(function (x) { return x.st === 'פעיל'; });
ok(act.length === 1 && act[0].b === 5, 'active unchanged', A.rows);
// אותו מבקש שני שוב — מעדכן את הבירור שלו, לא שורה נוספת
var F4 = JSON.parse(JSON.stringify(F3)); F4.b = 8;
ok(post({ action: 'chn', op: hex('f'), rq: hex('2'), f: F4 }).o.b === 8 && rows() === 3, 'ask updated in place', rows());
// מקור זיהוי — צוות מאושר
var F5 = { y: 'tst', yn: 'x', g: 'ח', c: '1', n: 'ר"ם ג', b: 2, p: '1', dev: 'Dstaff1' };
post({ action: 'chn', op: hex('0'), rq: hex('3'), f: F5 });
A = get({ chn: 'adm', key: 'k' });
ok(A.rows.filter(function (x) { return x.src === 'צוות מאושר'; }).length === 1, 'approved staff source', A.rows);
// ערכים לא תקינים
ok(post({ action: 'chn', op: hex('7'), rq: hex('4'), f: { y: 'tst', g: 'ז', c: '3', n: 'x y', b: 0, p: '0' } }).status === 'error', 'zero books rejected');
ok(post({ action: 'chn', op: hex('7'), rq: hex('4'), f: { y: 'tst', g: 'ז', c: '3', n: 'x y', b: 500, p: '0' } }).status === 'error', 'too many rejected');
ok(post({ action: 'chn', op: 'zz', rq: hex('4'), f: F }).status === 'error', 'bad op rejected');
// הכרעה: הבירור הופך לפעיל
var ask = A.rows.filter(function (x) { return x.st === 'לבירור'; })[0];
var R = get({ chn: 'res', key: 'k', id: ask.id, 'do': 'act' });
act = R.rows.filter(function (x) { return x.st === 'פעיל' && x.g === 'ז'; });
ok(act.length === 1 && act[0].b === 8, 'resolved: ask → active, old replaced', R.rows);
ok(R.rows.filter(function (x) { return x.st === 'הוחלף'; }).length === 1, 'old marked replaced');
// סך הכול להדפסה = פעילים בלבד
var B = 0, P = 0; R.rows.forEach(function (x) { if (x.st === 'פעיל') { B += x.b; P += x.pn; } });
ok(B === 10 && P === 10, 'totals from active only', [B, P]);
// אחרי הסגירה
get({ chn: 'close', key: 'k', at: new Date(Date.now() - 60000).toISOString() });
ok(get({ chn: 'cls', y: 'tst' }).open === 'closed', 'closed state');
var rc = rows();
ok(post({ action: 'chn', op: hex('5'), rq: hex('1'), f: F }).status === 'closed' && rows() === rc, 'no write after close');
ok(post({ action: 'chn', op: hex('6'), rq: hex('1'), f: Ft }).status === 'closed', 'test also closed after deadline');
ok(get({ chn: 'close', key: 'k', at: '' }).open === 'none', 'clear deadline');
ok(c.PRIVATE_TABS.indexOf('חוברות חנוכה') >= 0 && W.priv.getSheetByName('חוברות חנוכה'), 'tab is private');
console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
