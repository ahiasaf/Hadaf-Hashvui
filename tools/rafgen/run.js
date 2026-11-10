// הגרלה כללית (8.99.492) — מול apps-script.gs עצמו בזיכרון.
// node tools/rafgen/run.js  → קוד 1 אם בדיקה נכשלה. מזהים ושמות מומצאים.
// הזכאים מוזנים ישירות ל-rafCalc_ (raffleElig_ רץ כמו שהוא), כדי לבדוק את
// ההגרלה הכללית עצמה: בלי מוסדות, בלי כפולים, בלי זוכי השבוע, ושההגרלה
// המוסדית (rafLast_, מועד החיתוך, rafLateCtx_) לא זזה.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
var fired = [];
c.ghFire_ = function (t, b, a1, a2, a3, a4, url, role, a5, flt, quiet, mid, lbl) { fired.push({ mid: mid, flt: JSON.parse(flt), lbl: lbl }); return { status: 'ok' }; };

var wk = c.progWeek_();
// זכאים: 12 תלמידים בשלוש ישיבות, וגם מי שבחוץ (לפיד, "אחר", הורה, בדיקה).
var ppl = {}, done = {}, ids = [];
function person(id, code, extra) {
  var p = { id: id, ids: [id, id + 'X'], name: 'פ' + id, last: 'מ', inst: code === 'givat' ? 'גבעת שמואל' : '', code: code,
            role: 'תלמיד', test: false, grade: 'ז', klass: '1' };
  for (var k in (extra || {})) p[k] = extra[k];
  ppl[id] = p; done[id] = { t: 1 + (ids.length % 3), l: 1, q: 0, f: 0 };
  ids.push(id);
  c.appendCols_('לומדים', [['מזהה', id], ['שם', p.name], ['משפחה', 'מ'], ['קוד ישיבה', code], ['תפקיד', p.role === 'הורה' ? 'הורה' : 'תלמיד']]);
}
for (var i = 1; i <= 12; i++) person('S' + i, ['givat', 'rishon', 'nertamid'][i % 3]);
person('L1', 'lapid'); person('O1', 'other'); person('PA', 'givat', { role: 'הורה' }); person('T1', 'rishon', { test: true });
var REAL_ELIG = 12;
c.rafCalc_ = function () { return { ppl: ppl, done: done, noId: {}, daf: 'ה', dafs: {}, alias: {}, target: {}, side: {} }; };

// ההגרלה המוסדית של השבוע — S1 זכה בה.
var CUT = '2026-11-08T06:00:00.000Z';
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R' + wk + '-aaaa'], ['שבוע', wk], ['מועד חיתוך', CUT], ['מוסדות', 'givat,rishon,nertamid'],
  ['קוד ישיבה', 'nertamid'], ['ישיבה', 'נר תמיד'], ['זכאים', 4], ['זוכה', 'S1'], ['מזהי הזוכה', 'S1 S1X'], ['שם הזוכה', 'פS1 מ'],
  ['סטטוס', 'פורסם'], ['פורסם', new Date().toISOString()]]);
var sig = function (d) { return d ? [d.rid, d.wk, d.cut, d.st, d.lines.length].join('|') : ''; };
var last0 = sig(c.rafLast_(c.rafRead_(), wk)), lastAll0 = sig(c.rafLast_(c.rafRead_())), ctx0 = JSON.stringify(c.rafLateCtx_());

// בלי סיסמה — נדחה.
ok(raf({ raffle: 'gdraw', n: '3' }).status === 'denied', 'gdraw w/o key denied');
ok(raf({ raffle: 'gdraw', key: 'k' }).status === 'error', 'gdraw w/o n → error');

// 3 זוכים
var D = raf({ raffle: 'gdraw', key: 'k', n: '3', who: 'בודק' });
var wins = D.rows.map(function (x) { return x.win; });
ok(D.status === 'ok' && D.gen === 1 && D.st === 'הוגרל' && D.rows.length === 3, '3 winners drawn', D);
ok(wins.filter(function (x, i) { return wins.indexOf(x) === i; }).length === 3, '3 distinct students', wins);
ok(wins.every(function (x) { return /^S\d+$/.test(x); }), 'only real eligible (no lapid/other/parent/test)', wins);
ok(wins.indexOf('S1') < 0, 'institutional winner of the week excluded', wins);
ok(D.codes === '' && D.rows.every(function (x) { return /^g\d$/.test(x.key); }), 'no institution selection; slot keys', D.rows);
ok(D.rows[0].n === REAL_ELIG - 1, 'eligible count = all minus this week winner', D.rows[0].n);
// הגרלה המוסדית לא זזה
ok(sig(c.rafLast_(c.rafRead_(), wk)) === last0, 'rafLast_(wk) unchanged');
ok(sig(c.rafLast_(c.rafRead_())) === lastAll0, 'rafLast_() unchanged');
ok(JSON.stringify(c.rafLateCtx_()) === ctx0, 'rafLateCtx_ (cut) unchanged');
var IS = raf({ raffle: 'state', key: 'k' });
ok(IS.d && IS.d.rid === 'R' + wk + '-aaaa', 'institutional state still the institutional raffle', IS.d && IS.d.rid);
ok(c.raffleDraw_({ codes: 'givat' }).again === 1, 'institutional draw: still "already drawn this week"');
// לחיצה כפולה — אותה הגרלה
var D2 = raf({ raffle: 'gdraw', key: 'k', n: '5' });
ok(D2.again === 1 && D2.rid === D.rid, 'second click while pending returns same', D2.rid);
var GS = raf({ raffle: 'state', key: 'k', gen: '1' });
ok(GS.d && GS.d.rid === D.rid, 'state gen=1 returns the general raffle');
// הקהל: זוכים בלבד, בלי הודעה כללית
var A = raf({ raffle: 'aud', key: 'k', rid: D.rid });
ok(A.gen === 1 && A.all.dev === 0 && A.gcodes.length === 0, 'audience: no general message', A);
var P = raf({ raffle: 'pub', key: 'k', rid: D.rid, exp: A.exp, wt: 'ז', wb: 'זכית', dt: 'ה', db: 'הבן זכה' });
ok(P.status === 'ok' && P.g.st === 'skip' && P.done, 'publish: general part skipped, done', P);
ok(fired.every(function (f) { return !f.flt.insts; }) && fired.some(function (f) { return /-w$/.test(f.mid); }), 'only winners/parents pushes', fired);
// פרס דרך הרכז לפי המפתח (כמה זוכים יכולים להיות מאותו מוסד)
var S = raf({ raffle: 'prizeset', key: 'k', rid: D.rid, code: D.rows[1].key, p: 'pizza' });
ok(S.status === 'ok', 'prizeset by slot key', S);
var T = c.rafRead_(), dd = c.rafById_(T, D.rid);
ok(T.c(dd.lines[1], 'פרס') === 'pizza' && !T.c(dd.lines[0], 'פרס'), 'prize written on that row only');
ok(raf({ raffle: 'redo', key: 'k', rid: D.rid, code: D.rows[0].key }).status === 'error', 'no redo on general');
// התלמיד: רשימה אחת לשבוע — המוסדית והכללית יחד
var stu = D.rows[0], R = raf({ raffle: 'res', id: stu.win, inst: stu.code });
ok(R.state === 'pub' && R.me === true && R.mine && R.mine.name === stu.name, 'student winner sees himself', R);
ok(R.others.length === 3, 'one combined list (1 institutional + 2 general others)', R.others);
var notWin = ids.filter(function (x) { return /^S/.test(x) && wins.indexOf(x) < 0 && x !== 'S1'; })[0];
var R2 = raf({ raffle: 'res', id: notWin, inst: ppl[notWin].code });
ok(R2.me === false && (R2.mine ? 1 : 0) + R2.others.length === 4, 'non-winner sees all 4 winners', R2);
var Z = JSON.parse(c.raffleRoute_({ parameter: { raffle: 'all' } }).t);
ok(Z.list.length === 1 && Z.list[0].w.length === 4 && Z.list[0].w[0].name === 'פS1 מ', '/zochim: one week entry, institutional first', Z.list);
// אחרי פרסום — עוד הגרלה כללית, בלי זוכי השבוע
var D3 = raf({ raffle: 'gdraw', key: 'k', n: '100' });
var w3 = D3.rows.map(function (x) { return x.win; });
ok(D3.rid !== D.rid && D3.rows.length === REAL_ELIG - 4 && D3.ask === 100, '100 requested → all remaining eligible only', D3.rows.length);
ok(w3.every(function (x) { return x !== 'S1' && wins.indexOf(x) < 0; }), 'second general excludes all week winners');
ok(sig(c.rafLast_(c.rafRead_(), wk)) === last0 && JSON.stringify(c.rafLateCtx_()) === ctx0, 'institutional still unchanged after 2nd');
// ביטול — ואז אין זכאים שלא זכו? (כולם זכו) → הודעה, בלי שורות
ok(raf({ raffle: 'void', key: 'k', rid: D3.rid, why: 'בדיקה' }).status === 'ok', 'void pending general');
var D4 = raf({ raffle: 'gdraw', key: 'k', n: '100' });
ok(D4.status === 'ok' && D4.rows.length === REAL_ELIG - 4, 'after void the voided winners are back in', D4.rows.length);

console.log(fails ? fails + ' / ' + n + ' נכשלו' : 'עברו ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
