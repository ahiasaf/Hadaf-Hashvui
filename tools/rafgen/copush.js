// הרכז יודע שמישהו מהישיבה שלו זכה · "נשלח" למודעה ולוואטסאפ לרכז (8.99.556). מזהים מומצאים.
// node tools/rafgen/copush.js → קוד 1 אם בדיקה נכשלה.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function raf(p) { return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
var fired = [];
c.ghFire_ = function (t, b, a1, a2, a3, a4, url, role, a5, flt, quiet, mid, lbl) { fired.push({ t: t, b: b, ids: JSON.parse(flt).ids, url: url, mid: mid }); return { status: 'ok' }; };
var ppl = {}, done = {};
for (var i = 1; i <= 4; i++) {
  var id = 'S' + i, code = i <= 2 ? 'givat' : 'rishon';
  ppl[id] = { id: id, ids: [id], name: 'פ' + id, last: 'מ', inst: '', code: code, role: 'תלמיד', test: false, grade: 'ז', klass: '1' };
  done[id] = { t: 1, l: 1, q: 0, f: 0 };
  c.appendCols_('לומדים', [['מזהה', id], ['שם', 'פ' + id], ['משפחה', 'מ'], ['קוד ישיבה', code], ['תפקיד', 'תלמיד']]);
}
c.rafCalc_ = function () { return { ppl: ppl, done: done, noId: {}, daf: 'ה', dafs: {}, alias: {}, target: {}, side: {} }; };
c.appendCols_('גישה', [['מזהה', 'DCOGIV1'], ['קוד ישיבה', 'givat'], ['תפקיד', 'רכז התוכנית'], ['מצב', 'אושר']]);
c.appendCols_('גישה', [['מזהה', 'DCOGIV2'], ['קוד ישיבה', 'givat'], ['תפקיד', 'רכז'], ['מצב', 'ממתין']]);
c.appendCols_('גישה', [['מזהה', 'DRAMGIV'], ['קוד ישיבה', 'givat'], ['תפקיד', 'ר"ם'], ['מצב', 'אושר']]);
raf({ raffle: 'wadm', key: 'k', vb: 'x', rct: 'זוכה מהישיבה שלך!', rcb: '{name} מ{inst} זכה' });
var D = raf({ raffle: 'gdraw', key: 'k', n: '4' });
var T = c.rafRead_(), d2 = c.rafById_(T, D.rid);
var P = c.rafflePub_({ rid: D.rid, exp: c.rafExp_(c.rafAud_(d2)), wt: 'זכית', wb: 'זכית!', at: '', ab: '', dt: '', db: '' });
ok(P.status === 'ok', 'published', P);
var co = fired.filter(function (f) { return f.t === 'זוכה מהישיבה שלך!'; });
ok(co.length === 2 && co.every(function (f) { return f.ids.join() === 'DCOGIV1'; }), 'push only to approved coordinator, per givat winner', co);
ok(co.every(function (f) { return /^פS[12] מ.* זכה$/.test(f.b); }), 'name in body', co);
var T2 = c.rafRead_(), marks = c.rafById_(T2, D.rid).lines.map(function (r) { return T2.c(r, 'הודעה לרכז'); });
ok(marks.filter(function (m) { return /^נשלח/.test(m); }).length === 2 && marks.filter(function (m) { return /^אין רכז/.test(m); }).length === 2, 'marks per row', marks);
var nf = fired.length;
c.rafflePub_({ rid: D.rid, exp: c.rafExp_(c.rafAud_(c.rafById_(c.rafRead_(), D.rid))), more: '1' });
ok(fired.filter(function (f) { return f.t === 'זוכה מהישיבה שלך!'; }).length === 2, 'not sent twice');
// cosent
var key = c.rafById_(c.rafRead_(), D.rid).rows[0].key;
ok(raf({ raffle: 'cosent', rid: D.rid, code: key, k: 'ad' }).status === 'denied', 'cosent w/o key denied');
var S = raf({ raffle: 'cosent', key: 'k', rid: D.rid, code: key, k: 'ad' });
ok(S.status === 'ok' && S.at, 'cosent ad', S);
ok(raf({ raffle: 'cosent', key: 'k', rid: D.rid, code: key, k: 'ad' }).at === S.at, 'cosent once');
raf({ raffle: 'cosent', key: 'k', rid: D.rid, code: key, k: 'wa' });
var L = raf({ raffle: 'wadm', key: 'k' }), w0 = null;
L.list.forEach(function (r) { r.w.forEach(function (x) { if (x.code === key) w0 = x; }); });
ok(w0 && w0.cad === S.at && w0.cwa && w0.co && w0.ic, 'wadm carries marks + coordinator + inst code', w0);
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
