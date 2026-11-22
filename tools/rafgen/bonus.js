// הגרלת בונוס (8.99.566) — מוסדות שנבחרו, זוכה בכל מוסד / N מכולם, בלי זוכי השבוע. מזהים מומצאים.
// node tools/rafgen/bonus.js → קוד 1 אם בדיקה נכשלה.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
var fired = [];
c.ghFire_ = function (t, b, a1, a2, a3, a4, url, role, a5, flt, quiet, mid, lbl) { fired.push({ t: t, b: b, flt: JSON.parse(flt), lbl: lbl }); return { status: 'ok' }; };
var ppl = {}, done = {};
for (var i = 1; i <= 14; i++) {
  var id = 'S' + i, code = ['givat', 'rishon', 'nertamid'][i % 3];
  ppl[id] = { id: id, ids: [id], name: 'פ' + id, last: 'מ', inst: '', code: code, role: 'תלמיד', test: false, grade: 'ז', klass: '1' };
  done[id] = { t: 1, l: 1, q: 0, f: 0 };
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'פ' + id], ['משפחה', 'מ'], ['קוד ישיבה', code], ['תפקיד', 'תלמיד']]);
}
c.rafCalc_ = function () { return { ppl: ppl, done: done, noId: {}, daf: 'ה', dafs: {}, alias: {}, target: {}, side: {} }; };
var CH = [];
c.chAct_ = function (U, P, op) { CH.push(op); return op === 'open' ? { status: 'ok', ms: 3, n: 2 } : op === 'draw' ? { status: 'ok', sel: 'G7' } : { status: 'ok', vch: 1 }; };
var props = c.PropertiesService.getScriptProperties();
var realNow = Date.now, RD = Date;
function at(iso) { var t = RD.parse(iso); Date.now = function () { return t; }; c.Date = function (x) { return arguments.length ? new RD(x) : new RD(t); }; c.Date.now = Date.now; c.Date.parse = RD.parse; c.Date.UTC = RD.UTC; }
at('2026-11-24T10:00:00Z');
function wins(d) { return d.rows.map(function (x) { return x; }); }
// זוכה בכל מוסד — givat + rishon
var d1 = raf({ raffle: 'gdraw', key: 'k', who: 'בונוס', insts: 'givat,rishon', per: '1', n: '1' });
ok(d1.status === 'ok' && d1.gen && d1.rows.length === 2, 'per-inst: 2 winners', d1);
ok(d1.rows.map(function (x) { return x.code; }).sort().join() === 'givat,rishon', 'one from each', d1.rows);
ok(d1.codes === 'givat,rishon', 'institutions recorded');
// הגרלה שלא פורסמה — האוטומטית לא מפרסמת אותה (busy)
var a0 = c.rafGenDraw_({ n: 10, who: 'אוטומטי' });
ok(a0.status === 'busy', 'auto waits while bonus is pending', a0);
// פרסום, ואז N מכולם במוסד אחד — בלי מי שכבר זכה
var T = c.rafRead_(); d1.lines = c.rafById_(T, d1.rid).lines;
c.rafSet_(T, { lines: d1.lines }, [['סטטוס', 'פורסם'], ['פורסם', new Date().toISOString()]]);
var d2 = raf({ raffle: 'gdraw', key: 'k', who: 'בונוס', insts: 'givat', n: '50' });
var w1 = d1.rows.map(function (x) { return x.win; });
ok(d2.status === 'ok' && d2.rows.every(function (x) { return x.code === 'givat' && w1.indexOf(x.win) < 0; }), 'N mode: only givat, no repeat winners', d2.rows);
ok(d2.rows.length === 3, 'all remaining givat eligible (4 minus 1 winner)', d2.rows.length);
// מוסד בלי זכאים שלא זכו
var T2 = c.rafRead_(); c.rafSet_(T2, { lines: c.rafById_(T2, d2.rid).lines }, [['סטטוס', 'פורסם']]);
var d3 = raf({ raffle: 'gdraw', key: 'k', who: 'בונוס', insts: 'givat', per: '1', n: '1' });
ok(d3.status === 'error', 'nobody left in givat → error', d3);
// מועד החיתוך (rafLast_) לא זז
ok(!c.rafLast_(c.rafRead_()), 'bonus does not move the institutional cutoff');
Date.now = realNow;
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
