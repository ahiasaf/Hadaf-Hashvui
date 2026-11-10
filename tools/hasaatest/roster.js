// הצהרת התלמיד (8.99.491) — ?hasaa=roster / ?hasaa=info ושמירת המזהה, מול apps-script.gs בזיכרון.
// node tools/hasaatest/roster.js → קוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
var M = require('../snaptest/mock.js'), crypto = require('crypto');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.DigestAlgorithm = { SHA_256: 'sha256', MD5: 'md5', SHA_1: 'sha1' };
c.Utilities.Charset = { UTF_8: 'utf8' };
c.Utilities.computeDigest = function (alg, s) {
  return Array.prototype.map.call(crypto.createHash(alg).update(String(s), 'utf8').digest(), function (b) { return b > 127 ? b - 256 : b; });
};
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { return JSON.parse(c.doGet({ parameter: p }).t); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function J(id, first, last, inst, role, extra) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', first], ['משפחה', last], ['קוד ישיבה', inst], ['תפקיד', role || 'תלמיד'],
    ['טלפון', '0500000000']].concat(extra || []));
}
J('DAAA1', 'אבי', 'כהן', 'lapid');
J('DBBB2', 'בני', 'לוי', 'lapid');
J('DCCC3', 'גדי', 'רז', 'givat');
J('DPAR4', 'דן', 'כהן', 'lapid', 'הורה');
J('DTST5', 'הדר', 'טל', 'lapid', 'תלמיד', [['בדיקה', 'כן']]);
J('DOUT6', 'ורד', 'בן', 'rishon');
// לימוד: אבי סיים את כל מגילה (ב–לא שלם, לב. בלבד), ותענית חלקית
var heb = ['', '', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל', 'לא', 'לב'];
var LH = ['תאריך', 'מזהה', 'קוד ישיבה', 'מסלול', 'שבוע', 'דף', 'קטע', 'מתוך', 'בדיקה'];
var L = c.sheet_('לימוד'); L.d.push(LH);
for (var d = 2; d <= 32; d++) {
  if (d === 2) { L.d.push([new Date(), 'DAAA1', 'lapid', 'megila', 1, 'ב.', '', '', '']); L.d.push([new Date(), 'DAAA1', 'lapid', 'megila', 2, 'ב:', '', '', '']); continue; }
  L.d.push([new Date(), 'DAAA1', 'lapid', 'megila', d, d === 32 ? 'לב.' : (d === 21 ? 'כ"א' : heb[d]), '', '', '']);
}
for (var t = 2; t <= 20; t++) L.d.push([new Date(), 'DAAA1', 'lapid', 'taanit', t, heb[t], '', '', '']);
// בני: תענית כולה, אבל דף ה רק עמוד א — לא הושלמה
for (var t2 = 2; t2 <= 31; t2++) L.d.push([new Date(), 'DBBB2', 'lapid', 'taanit', t2, t2 === 5 ? 'ה.' : heb[t2], '', '', '']);
// זכאויות
var Z = W.priv.insertSheet('זכאויות');
Z.d.push(['מזהה', 'שם', 'ציון', 'מסכתות', 'מספר פרסים']);
Z.d.push(['DAAA1', '', '95', 'סוכה, מסכת ביצה', '2']);
Z.d.push(['', 'זאב גל', '90', 'ברכות', '1']);
Z.d.push(['', 'בני לוי', '80', '', '3']);       // שם שגם ב"לומדים" — פעם אחת בתפריט
Z.d.push(['DCCC3', '', '88', '', '1']);          // רשום בישיבה אחרת — מתווסף עם אסימון

var R = get({ hasaa: 'roster', y: 'lapid' });
ok(R.status === 'ok', 'roster ok', R);
var names = R.list.map(function (o) { return o.n; });
ok(names.indexOf('אבי כהן') >= 0 && names.indexOf('בני לוי') >= 0, 'lapid students', names);
ok(names.filter(function (x) { return x === 'בני לוי'; }).length === 1, 'dup name once', names);
ok(names.indexOf('זאב גל') >= 0, 'zk-only name added', names);
ok(names.indexOf('גדי רז') >= 0, 'zk id from other inst added', names);
ok(names.indexOf('דן כהן') < 0 && names.indexOf('הדר טל') < 0 && names.indexOf('ורד בן') < 0, 'no parent/test/other inst', names);
var raw = JSON.stringify(R);
ok(raw.indexOf('DAAA1') < 0 && raw.indexOf('050') < 0 && raw.indexOf('ציון') < 0, 'no ids/phones', raw);
ok(R.list.every(function (o) { return Object.keys(o).every(function (k) { return k === 'k' || k === 'n'; }); }), 'only k/n');
var zeev = R.list.filter(function (o) { return o.n === 'זאב גל'; })[0];
ok(zeev && !zeev.k, 'zk-only has no token');
var avi = R.list.filter(function (o) { return o.n === 'אבי כהן'; })[0], beni = R.list.filter(function (o) { return o.n === 'בני לוי'; })[0];

var I = get({ hasaa: 'info', id: avi.k });
ok(I.status === 'ok' && I.due === 2, 'avi due by id', I);
ok(I.mas[0] === 'מגילה' && I.mas.indexOf('תענית') < 0 && I.mas.indexOf('סוכה') >= 0 && I.mas.indexOf('ביצה') >= 0, 'avi masechtot', I.mas);
var I2 = get({ hasaa: 'info', id: beni.k });
ok(I2.status === 'ok' && I2.due === 3 && I2.mas.indexOf('תענית') < 0, 'beni: due by name, taanit incomplete', I2);
var I3 = get({ hasaa: 'info', n: 'זאב גל' });
ok(I3.status === 'ok' && I3.due === 1 && I3.mas[0] === 'ברכות', 'zeev by name', I3);
var I4 = get({ hasaa: 'info', n: 'אין כזה' });
ok(I4.status === 'ok' && I4.due === null && I4.mas.length === 0, 'unknown name → no limit', I4);
ok(get({ hasaa: 'info', id: 'tzz' }).status === 'error', 'bad token');
// הטוקן עובד גם בלי מטמון
c.CacheService.getScriptCache().remove('hst:' + avi.k);
ok(get({ hasaa: 'info', id: avi.k }).due === 2, 'token without cache');
// בלי לשונית זכאויות — בלי הגבלה
// שמירה: המזהה האמיתי נשמר
var F = { n: 'אבי כהן', y: 'לפיד', c: 'ט', ph: '0500000000', m1: 'מגילה', p1: 'x', p2: 'y', s: 'אבי', id: avi.k };
var P = post({ action: 'hasaa', sid: 'a'.repeat(48), f: F });
ok(P.saved === true, 'put saved', P);
var H = W.priv.getSheetByName('הצהרות');
ok(H.d[0][H.d[0].length - 1] === 'מזהה תלמיד' && H.d[1][H.d[0].length - 1] === 'DAAA1', 'real id stored', H.d[1]);
var F2 = JSON.parse(JSON.stringify(F)); F2.n = 'זאב גל'; F2.id = '';
post({ action: 'hasaa', sid: 'b'.repeat(48), f: F2 });
ok(H.d.length === 3 && H.d[2][H.d[0].length - 1] === '', 'zk-only saved w/o id');
F2.id = 'tbadbadbadbadbadbadbad'; F2.s = 'x';
post({ action: 'hasaa', sid: 'c'.repeat(48), f: F2 });
ok(H.d.length === 4 && H.d[3][H.d[0].length - 1] === '', 'bad token stored empty');
// לשונית ישנה בלי העמודה — הכותרת משלימה
var W2 = M.makeWorld(), c2 = W2.ctx;
var old = W2.priv.insertSheet('הצהרות');
old.d.push(['חותמת זמן', 'sid', 'שם התלמיד', 'הישיבה', 'הכתה בתשפ"ו', 'מספר הנייד', 'מסכת 1', 'מסכת 2', 'מסכת 3', 'מסכת 4', 'מסכת 5', 'מסכת 6', 'עדיפות ראשונה', 'עדיפות שניה', 'חתימת התלמיד']);
c2.doPost({ postData: { contents: JSON.stringify({ action: 'hasaa', sid: 'd'.repeat(48), f: F2 }) } });
ok(old.d[0].length === 16 && old.d[0][15] === 'מזהה תלמיד' && old.d[1][2] === 'זאב גל', 'old tab header extended', old.d[0]);
ok(JSON.parse(c2.doGet({ parameter: { hasaa: 'roster', y: 'lapid' } }).t).status === 'ok', 'roster w/o zk tab');
console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
