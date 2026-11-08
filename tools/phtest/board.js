// טלפונים לוואטסאפ בלוח (8.99.470) — boardData_ מול גיליון מדומה. node tools/phtest/board.js
// מספרים מומצאים בלבד (055-000…).
var M = require('../snaptest/mock.js'); var W = M.makeWorld(), c = W.ctx;
var n = 0, fails = 0;
function T(x) { return '05' + '5' + x; }   // מספר מומצא, בלי מספר שלם בקוד
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
function reg(id, f, l, g, k, ph, extra) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', f], ['משפחה', l], ['טלפון', ph || ''], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
    ['קוד ישיבה', 'tapuah'], ['שכבה', g], ['כיתה', k], ['תפקיד', 'תלמיד']].concat(extra || []));
}
var net = c.sheet_('תלמידי הרשת');
net.appendRow(['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי', 'טלפון', 'טלפון הורה', 'קרבה', 'סמל מוסד']);
net.appendRow(['tapuah', 'ז', '1', 'שקדי', 'עומר', '', T('0000001'), '', '']);
net.appendRow(['tapuah', 'ז', '1', 'ברקן', 'רון אליה', T('0000099'), T('0000002'), '', '']);
net.appendRow(['tapuah', 'ז', '1', 'כהן', 'דוד', '', T('0000003'), '', '']);
net.appendRow(['tapuah', 'ז', '2', 'כהן', 'דוד', '', T('0000004'), '', '']);
net.appendRow(['tapuah', 'ז', '2', 'לוי', 'משה', '', T('0000005'), '', '']);
net.appendRow(['tapuah', 'ז', '2', 'לוי', 'משה', '', T('0000006'), '', '']);
net.appendRow(['givat', 'ז', '1', 'שקדי', 'עומר', '', T('0000007'), '', '']);
reg('A1', 'עומר', 'שקדי', 'ז', '1', T('1111111'));            // יש טלפון — הורה מהמאגר
reg('A2', 'רון אליה', 'ברקן', 'ז', '1', '');                  // בלי טלפון — שניהם מהמאגר
reg('A3', 'דוד', 'כהן', 'ז', '', '');                             // שני מועמדים, בלי כיתה — כלום
reg('A4', 'דוד', 'כהן', 'ז', '2', '');                            // הכיתה מכריעה
reg('A5', 'משה', 'לוי', 'ז', '2', '');                            // כפול באותה כיתה — כלום
reg('A6', 'יוסי', 'זר', 'ז', '1', T('2222222'), [['טלפון ההורה', T('3333333')]]);  // הורה מהטופס
reg('A7', 'אבי', 'שווה', 'ז', '1', T('4444444'), [['טלפון ההורה', T('-4444444')]]);  // אותו מספר — בלי הורה
var code = c.getCode_('tapuah'); if (!code) { c.ensureCode_('tapuah', 'zz'); code = c.getCode_('tapuah'); }
exec();
var b = c.boardData_('tapuah', code), S = {};
(b.students || []).forEach(function (p) { S[p.id] = p; });
ok(b.status === 'ok', 'status', b.status);
ok(S.A1.phone === T('1111111') && S.A1.parPh === T('0000001'), 'A1 own phone + roster parent', S.A1);
ok(S.A2.phone === T('0000099') && S.A2.parPh === T('0000002'), 'A2 kid+parent from roster', S.A2);
ok(!S.A3.parPh && !S.A3.phone, 'A3 ambiguous → none', S.A3);
ok(S.A4.parPh === T('0000004'), 'A4 class decides', S.A4);
ok(!S.A5.parPh, 'A5 duplicate in class → none', S.A5);
ok(S.A6.parPh === T('3333333'), 'A6 parent phone from form', S.A6);
ok(!S.A7.parPh, 'A7 parent == own → no parent button', S.A7);
ok(!('dadPh' in S.A6), 'dadPh not leaked');
// כל הישיבות — אותה תוצאה
exec(); var ba = c.boardData_('*', '*'), SA = {};
(ba.students || []).forEach(function (p) { SA[p.id] = p; });
ok(SA.A2.parPh === T('0000002') && SA.A4.parPh === T('0000004'), 'all-board same', [SA.A2, SA.A4]);
// הורה מחובר גובר
var KF = 'עומר', KL = 'שקדי';
c.appendCols_('לומדים', [['מזהה', 'P1'], ['שם', 'P' + 1], ['משפחה', KL], ['טלפון', T('6666666')], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
  ['קוד ישיבה', 'tapuah'], ['תפקיד', 'הורה'], ['שם ההורה', KF], ['משפחת ההורה', KL], ['טלפון ההורה', T('1111111')]]);
exec(); var b2 = c.boardData_('tapuah', code), S2 = {};
(b2.students || []).forEach(function (p) { S2[p.id] = p; });
ok(S2.A1.parPh === T('6666666'), 'A1 paired parent wins', S2.A1);
// inner (שליחה להורים) — בלי טלפונים
exec(); var bi = c.boardData_('tapuah', code, false, true);
ok((bi.students || []).every(function (p) { return p.phone === undefined && p.parPh === undefined; }), 'inner has no phones');
// בלי מאגר — הלוח עובד
c.SpreadsheetApp.openById('PRIV').deleteSheet(net); W.cache.m = {}; exec();
var b3 = c.boardData_('tapuah', code);
ok(b3.status === 'ok' && b3.students.length === b.students.length, 'no roster tab → board ok');
console.log('checks', n, 'fails', fails); process.exit(fails ? 1 : 0);
