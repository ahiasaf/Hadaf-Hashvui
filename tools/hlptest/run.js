// "ביקשת עזרה בהתקנה — הסתדרת?" (8.99.514) — helpAskRoute_ מול apps-script.gs בזיכרון.
// node tools/hlptest/run.js → קוד 1 אם בדיקה נכשלה. מזהים וטלפונים מומצאים (קידומת 000).
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function rows() { var v = c.sheet_('תקועים').getDataRange().getDisplayValues(); return v.slice(1).map(function (r) { var o = {}; v[0].forEach(function (h, i) { o[h] = r[i]; }); return o; }); }
function help(name, ph, sid, hoursAgo) {
  c.appendCols_('תקועים', [['שם', name], ['טלפון', ph], ['מזהה', sid || ''], ['טופל', '']]);
  if (hoursAgo) { var sh = c.sheet_('תקועים'), h = c.headers_(sh); sh.getRange(sh.getLastRow(), h.indexOf('תאריך') + 1).setValue(new Date(Date.now() - hoursAgo * 3600000)); }
}
c.appendCols_('לומדים', [['מזהה', 'SA'], ['שם', 'א'], ['משפחה', 'מ'], ['טלפון', '0001000001'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'SB'], ['שם', 'ב'], ['משפחה', 'מ'], ['טלפון', '0001000002'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'SC'], ['שם', 'ג'], ['משפחה', 'מ'], ['טלפון', '0001000003'], ['תפקיד', 'תלמיד']]);
help('א', '000-1000001', '', 3);        // לפי טלפון, ישנה
help('ב', '0001000002', 'SB', 3);       // לפי מזהה
help('ג', '0001000003', '', 0.5);       // חדשה — לא שואלים עדיין
var R = c.helpAskRoute_;
ok(R({ hlpq: 'me', id: 'SX', ph: '0001000001' }).ask === 0, 'foreign id with someone else phone — no');
ok(R({ hlpq: 'me', id: 'SA', ph: '0001000001' }).ask === 1, 'A asked by phone');
ok(R({ hlpq: 'me', id: 'SB', ph: '' }).ask === 1, 'B asked by id');
ok(R({ hlpq: 'me', id: 'SC', ph: '0001000003' }).ask === 0, 'C too recent');
ok(R({ hlpq: 'me', id: 'SZ', ph: '' }).ask === 0, 'unknown — no');
// נפתח מהאפליקציה — הותקן
R({ hlpq: 'me', id: 'SC', ph: '0001000003', sa: '1' });
ok(!!rows()[2]['הותקן'] && !rows()[2]['טופל'], 'C marked installed, not done', rows()[2]);
ok(!rows()[0]['הותקן'], 'A not installed');
// כן
ok(R({ hlpq: 'ans', id: 'SA', ph: '0001000001', a: '1' }).status === 'ok', 'A yes ok');
ok(rows()[0]['תשובת התלמיד'] === 'הסתדר' && !!rows()[0]['טופל'], 'A done', rows()[0]);
ok(R({ hlpq: 'me', id: 'SA', ph: '0001000001' }).ask === 0, 'A not asked again');
// לא
ok(R({ hlpq: 'ans', id: 'SB', ph: '', a: '0' }).status === 'ok', 'B no ok');
ok(rows()[1]['תשובת התלמיד'] === 'עדיין צריך עזרה' && !rows()[1]['טופל'], 'B still open', rows()[1]);
ok(R({ hlpq: 'me', id: 'SB', ph: '' }).ask === 0, 'B not asked again');
ok(rows().length === 3, 'no new rows');
ok(R({ hlpq: 'me', id: 'a b' }).status === 'error', 'bad id rejected');
console.log(fails ? fails + '/' + n + ' נכשלו' : 'הכל עבר (' + n + ')');
process.exit(fails ? 1 : 0);
