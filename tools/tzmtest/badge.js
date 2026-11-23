// תווית "הדף השבועי" והזמנה לצמאה (8.99.578) — מול apps-script.gs בזיכרון.
// node tools/tzmtest/badge.js → קוד 1 אם בדיקה נכשלה. שמות וטלפונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var fired = [];
c.ghFire_ = function (t, b, a1, a2, a3, a4, url, role, a5, flt) { fired.push({ t: t, b: b, url: url, flt: JSON.parse(flt) }); return { status: 'ok', sid: 's' + fired.length }; };
c.autoTxMap_ = function () { return { tzmPushKB: 'K', tzmPushPB: 'P' }; };
function join(id, role, first, last, ph, other, inst, g, k) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', first], ['משפחה', last], ['קוד ישיבה', inst || 'lapid'], ['ישיבה', 'לפיד'],
    ['תפקיד', role], ['טלפון', ph], ['טלפון ההורה', other], ['שכבה', g || ''], ['כיתה', k || '']]);
}
var seq = 0;
function mark(inst, g, k, name, day, slot, kind, wk) {
  c.appendCols_('עמדת לימוד', [['מזהה', 'm' + (++seq)], ['שבוע', wk || '5'], ['יום', day], ['קוד עמדה', slot || 'a'], ['סוג', kind || 'דף'],
    ['מסלול', 'taanit'], ['דף', 'ב'], ['שכבה', g], ['כיתה', k], ['שם', name], ['קוד ישיבה', inst]]);
}
function link(id, inst, g, k, name) {
  c.appendCols_('עמדה — שיוך', [['מזהה', id], ['מסלול', 'taanit'], ['שבוע', '5'], ['דף', 'ב'], ['מפתח', [inst, g, k, name, 'taanit', '5'].join('|')]]);
}
// א — 3 מועדים שונים, רשום עם מכשיר, הורה מחובר. ב — 3 שורות באותו מועד (=1). ג — 2 דף + 2 שיעור.
// ד — 3 מועדים אבל מישיבה אחרת. ה — 3 מועדים בלפיד, לא התקין (בלי שיוך).
join('KA', 'תלמיד', 'אבי', 'כהן', '0001000001', '0002000001', 'lapid', 'ז׳', '2');
join('DA', 'הורה', 'משה', 'כהן', '0002000001', '0001000001', 'lapid');
join('KB', 'תלמיד', 'בני', 'לוי', '0001000002', '', 'lapid', 'ז׳', '2');
['2026-11-01', '2026-11-02', '2026-11-03'].forEach(function (d) { mark('lapid', 'ז׳', '2', 'אבי כהן', d); });
mark('lapid', 'ז׳', '2', 'אבי כהן', '2026-11-03');                 // כפול — אותו מועד
[1, 2, 3].forEach(function () { mark('lapid', 'ז׳', '2', 'בני לוי', '2026-11-04'); });
mark('lapid', 'ח', '1', 'גדי ישראל', '2026-11-01'); mark('lapid', 'ח', '1', 'גדי ישראל', '2026-11-02');
mark('lapid', 'ח', '1', 'גדי ישראל', '2026-11-03', 'a', 'שיעור'); mark('lapid', 'ח', '1', 'גדי ישראל', '2026-11-05', 'a', 'שיעור');
['2026-11-01', '2026-11-02', '2026-11-03'].forEach(function (d) { mark('givat', 'ז', '1', 'דני דן', d); });
['2026-11-01', '2026-11-02', '2026-11-03'].forEach(function (d, i) { mark('lapid', 'ח', '3', 'הלל הר', d, i ? 'b' : 'a'); });
link('KA', 'lapid', 'ז׳', '2', 'אבי כהן'); link('KB', 'lapid', 'ז׳', '2', 'בני לוי');

c.READ_KEY = c.READ_KEY || 'rk';
ok(c.tzmMe_('KA').on === false, 'off by default');
c.tzmRoute_({ tzm: 'inv', key: c.READ_KEY, on: '1' });
var B = c.tzmBadge_().sort();
ok(B.length === 2 && B.indexOf('ז|2|אבי כהן') >= 0 && B.indexOf('ח|3|הלל הר') >= 0, 'badge: A and E only', B);
var S = c.tzmBdStat_();
ok(S.v.s.tot === 3 && S.v.s.totL === 2 && S.v.s.zh === 3, 'stat all/lapid', S.v.s);
ok(S.aud.badge === 2 && S.aud.linked === 1 && S.aud.noId === 1 && S.aud.parents === 1 && S.aud.kidsDev === 1, 'audience', S.aud);
ok(c.tzmMe_('KA').r === 'k' && c.tzmMe_('KA').st === '', 'me kid', c.tzmMe_('KA'));
ok(c.tzmMe_('DA').r === 'p', 'me parent', c.tzmMe_('DA'));
ok(c.tzmMe_('KB').r === '' && c.tzmMe_('KB').on, 'me not eligible', c.tzmMe_('KB'));
ok(c.tzmReq_('KB').status === 'denied', 'req not eligible denied');
ok(c.tzmReq_('DA').status === 'denied', 'req parent denied');
var R1 = c.tzmReq_('KA');
ok(R1.status === 'ok' && R1.st === 'q', 'req ok', R1);
ok(c.tzmReq_('KA').st === 'q' && c.tzmRq_().length === 1, 'req twice — one row', c.tzmRq_());
ok(c.tzmMe_('KA').st === 'q', 'me after req');
ok(c.tzmReg_().length === 0, 'request is not registration');
// הרב מאשר בעמוד — tzmPut_
var k = c.tzmKeyOf_(true);
var P = c.tzmPut_({ k: k, by: 'רכז', ch: [{ g: 'ז', c: '2', n: 'אבי כהן', on: true }] });
ok(P.status === 'ok' && c.tzmReg_().length === 1 && c.tzmRq_().length === 0, 'approve via page', [P, c.tzmReg_(), c.tzmRq_()]);
ok(c.tzmMe_('KA').st === 'y', 'me after approve');
var cls = c.tzmRoute_({ tzm: 'cls', k: k });
ok(cls.bd && cls.bd.length === 2 && cls.rq, 'cls returns bd/rq', cls.bd);
// push — מניין, ואז פעם אחת
var D = c.tzmPush_(false);
ok(D.linked === 1 && D.parents === 1 && !fired.length, 'push dry', D);
c.tzmPush_(true);
ok(fired.length === 2 && fired[0].flt.ids.join() === 'KA' && fired[1].flt.ids.join() === 'DA' && fired[0].b === 'K' && fired[1].b === 'P', 'push once each', fired);
c.tzmPush_(true);
ok(fired.length === 2, 'no second push');
// כיבוי
c.READ_KEY = c.READ_KEY || 'rk';
c.tzmRoute_({ tzm: 'inv', key: c.READ_KEY, on: '0' });
ok(c.tzmMe_('KA').on === false && c.tzmReq_('KA').status === 'off', 'switch off');
c.tzmRoute_({ tzm: 'inv', key: c.READ_KEY, on: '1' });
ok(c.tzmMe_('KA').on === true, 'switch on');
ok(c.tzmRoute_({ tzm: 'bdn' }).status === 'denied' && c.tzmRoute_({ tzm: 'push', go: '1' }).status === 'denied', 'admin ops need key');
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
