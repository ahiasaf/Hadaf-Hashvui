// הגרלת בונוס על שולחנות (8.99.566): הקפאה + הגרלה בלחיצה אחת, **בלי יציאות**. מזהים מומצאים.
// node tools/chtest/bonus.js → קוד 1 אם בדיקה נכשלה.
var T = require('./tables.js'), c = T.c, fails = 0, n = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var U = { test: false };
// סוגרים את ההגרלה הפתוחה מהעולם של tables.js (אישור/סגירה לא חשובים כאן — רק שלא תחסום)
var M0 = T.sync(T.D1 + 9);
var open = M0.ms.filter(function (m) { return [c.CH_M_.open, c.CH_M_.zero, c.CH_M_.ready, c.CH_M_.pend].indexOf(m.st) >= 0; });
open.forEach(function (m) {
  var MT = c.chTab_(c.CH_MS_, c.CH_MS_COLS_);
  MT.rows.forEach(function (r) { if (String(r['הגרלה']) === String(m.k) && r['בדיקה'] !== 'כן') { r['מצב'] = c.CH_M_.none; c.chPut_(MT, r); } });
});
// שולחן אחד שכל הארבעה בו לומדים השבוע; כל השאר — לא
var M1 = T.sync(T.D1 + 10);
var full = Object.keys(M1.tb).filter(function (t) { return M1.tb[t].length === 4; });
ok(full.length >= 1, 'world has a full table', full);
var tb = full[0];
M1.tb[tb].forEach(function (id, i) { T.learn(id, T.D1 + 10 + i * 0.01); });
var seats0 = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return !r['יצא']; }).length;
var outs0 = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['סיבה'] === c.CH_WK_OUT_; }).length;
var nonLearners = Object.keys(M1.seat).filter(function (id) { return M1.tb[tb].indexOf(id) < 0; }).length;
ok(nonLearners > 0, 'others seated who did not learn this week', nonLearners);
T.at(T.D1 + 10.2); T.exec();
var r = c.chBonus_(U);
ok(r.status === 'ok' && r.sel && r.names.length === 4, 'bonus: drawn, 4 names', r);
var seats1 = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (x) { return !x['יצא']; }).length;
var outs1 = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (x) { return x['סיבה'] === c.CH_WK_OUT_; }).length;
ok(seats1 === seats0 && outs1 === outs0, 'nobody left a table', [seats0, seats1, outs0, outs1]);
var M2 = T.sync(T.D1 + 10.3), ms = M2.ms[M2.ms.length - 1];
ok(ms && ms.st === c.CH_M_.pend && ms.sel === r.sel, 'waits for approval', ms && ms.st);
ok(c.chBonus_(U).status === 'error', 'second bonus while undecided → refused');
console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
