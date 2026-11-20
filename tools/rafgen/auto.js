// ההגרלה האוטומטית של יום ראשון (8.99.552) — מול apps-script.gs בזיכרון. מזהים מומצאים.
// node tools/rafgen/auto.js → קוד 1 אם בדיקה נכשלה.
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
// שבת — כלום
at('2026-11-21T15:00:00Z'); c.rafAutoSun_();
ok(!props.getProperty('RAF_AUTO_ST'), 'not Sunday → nothing');
// ראשון 15:30 שעון ישראל — כלום
at('2026-11-22T13:30:00Z'); c.rafAutoSun_();
ok(!props.getProperty('RAF_AUTO_ST'), 'Sunday before 16:00 → nothing');
// 16:20 בלי נוסח — לא מגרילים בשבועית, השולחנות כן
at('2026-11-22T14:20:00Z'); var s1 = c.rafAutoSun_();
ok(s1 && !s1.raf && s1.rafWhy && /אושר/.test(s1.ch), 'no text → weekly waits; tables done', s1);
ok(CH.join() === 'open,draw,approve', 'tables: open → draw → approve', CH);
// הניהול נטען — הנוסח נשמר; בשעה הבאה — 10 זוכים, פורסם, הודעה
raf({ raffle: 'wadm', key: 'k', vt: 'a', vb: 'b', rwt: 'זכית בהגרלה!', rwb: 'לבחור עד חמישי', rdt: 'הבן זכה', rdb: 'לבחור', hvt: 'x', hvb: 'y' });
at('2026-11-22T15:05:00Z'); var s2 = c.rafAutoSun_();
ok(/^פורסם/.test(s2.raf), 'weekly published', s2);
var T = c.rafRead_(), rid = s2.raf.split(' · ')[1], d = c.rafById_(T, rid);
ok(d && d.gen && d.rows.length === 10 && d.st === 'פורסם', '10 winners, general, published', d && d.rows.length);
ok(fired.some(function (f) { return f.t === 'זכית בהגרלה!' && f.flt.ids.length === 10; }), 'winners notified', fired);
ok(CH.length === 3, 'tables not repeated');
var nRows = T.rows.length; c.rafAutoSun_();
ok(c.rafRead_().rows.length === nRows, 'same Sunday again → no second raffle');
// השולחנות: אין שובר — נשאר לאישור, לא נפתח שוב
props.deleteProperty('RAF_AUTO_ST'); CH = [];
c.chAct_ = function (U, P, op) { CH.push(op); return op === 'open' ? { status: 'ok', ms: 4 } : op === 'draw' ? { status: 'ok', sel: 'G8' } : { status: 'error', message: 'אין שובר בורגר זמין' }; };
at('2026-11-29T14:10:00Z'); var s3 = c.rafAutoSun_();
ok(/ממתין לאישור/.test(s3.ch) && CH.join() === 'open,draw,approve', 'no burger voucher → left for admin', s3);
Date.now = realNow;
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
