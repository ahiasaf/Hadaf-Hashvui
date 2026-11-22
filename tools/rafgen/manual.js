// הפעלה ידנית של הגרלות השבוע (8.99.565) — ביום ראשון האוטומטית לא חוזרת. מזהים מומצאים.
// node tools/rafgen/manual.js → קוד 1 אם בדיקה נכשלה.
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
props.setProperty('RAF_AUTO_TX', JSON.stringify({ wt: 'זכית!', wb: 'לבחור עד חמישי', dt: '', db: '' }));
// רביעי — לחיצה ידנית: כללית + שולחנות
at('2026-11-25T10:00:00Z');
var g1 = raf({ raffle: 'autogo', key: 'k' });
ok(g1.status === 'ok' && /^פורסם/.test(g1.raf) && /אושר/.test(g1.ch) && g1.sun === '2026-11-29', 'manual: both ran', g1);
ok(CH.join() === 'open,draw,approve', 'tables once', CH);
var nR = c.rafRead_().rows.length, nF = fired.length;
// לחיצה נוספת באותו שבוע — כלום חדש
at('2026-11-26T10:00:00Z');
var g2 = raf({ raffle: 'autogo', key: 'k' });
ok(g2.status === 'ok' && g2.done === 1 && c.rafRead_().rows.length === nR && CH.length === 3 && fired.length === nF, 'second press same week → nothing', g2);
// ראשון 16:10 — האוטומטית מדלגת
at('2026-11-29T14:10:00Z');
var s = c.rafAutoSun_();
ok(/^ידני/.test(s.raf) && /^ידני/.test(s.ch) && c.rafRead_().rows.length === nR && CH.length === 3 && fired.length === nF, 'Sunday auto skipped', s);
// ראשון של השבוע שאחריו — האוטומטית רצה כרגיל
at('2026-12-06T14:10:00Z');
var s4 = c.rafAutoSun_();
ok(/^פורסם/.test(s4.raf) && CH.length === 6, 'next week auto runs', s4);
// שלב שלא הושלם ידנית — רץ ביום ראשון
props.deleteProperty('RAF_AUTO_ST'); props.deleteProperty('RAF_MANUAL'); CH = [];
var chBusy = true;
c.chAct_ = function (U, P, op) { CH.push(op); if (chBusy) return { status: 'busy' }; return op === 'open' ? { status: 'ok', ms: 5 } : op === 'draw' ? { status: 'ok', sel: 'G9' } : { status: 'ok', vch: 1 }; };
at('2026-12-09T10:00:00Z');
var g3 = raf({ raffle: 'autogo', key: 'k' });
ok(/^פורסם/.test(g3.raf) && !g3.ch, 'manual: tables busy, weekly done', g3);
chBusy = false; var nR2 = c.rafRead_().rows.length;
at('2026-12-13T14:10:00Z');
var s5 = c.rafAutoSun_();
ok(/^ידני/.test(s5.raf) && /אושר/.test(s5.ch) && c.rafRead_().rows.length === nR2, 'Sunday: only the missing tables step ran', s5);
ok(raf({ raffle: 'autogo' }).status === 'denied', 'no key → denied');
Date.now = realNow;
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
