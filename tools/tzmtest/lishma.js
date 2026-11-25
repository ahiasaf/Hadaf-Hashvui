// "לומד תורה לשמה" (8.99.596) — מול apps-script.gs בזיכרון. node tools/tzmtest/lishma.js → קוד 1 אם נכשל.
// שמות מומצאים (אותיות), בלי טלפונים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var seq = 0;
function mark(inst, g, k, name, day, slot, kind, id) {
  c.appendCols_('עמדת לימוד', [['מזהה', id || ('m' + (++seq))], ['שבוע', '5'], ['יום', day], ['קוד עמדה', slot || 'Pray'], ['סוג', kind || 'דף'],
    ['מסלול', kind === 'שיעור' ? '' : 'taanit'], ['דף', kind === 'שיעור' ? '' : 'ב'], ['שכבה', g], ['כיתה', k], ['שם', name], ['קוד ישיבה', inst]]);
}
c.READ_KEY = c.READ_KEY || 'rk';
var D = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-12', '2026-11-15', '2026-11-16'];
// א — כלל 1 (3 דף). ב — כלל 2 (נודד ביומיים). ג — נודד ביום אחד + 11.11 → לא. ד — נודד פעמיים באותו יום → לא.
// ה — כלל 3 (10 שיעורים). ו — 9 שיעורים + 5 שיעורי כיתה → לא. ז — ח4 עם 3 דף → בחוץ. ח — ז5 עם נודד ביומיים → בחוץ.
// ט — כלל 2 בישיבה אחרת → לא. י — 3 דף באותו מזהה → לא (סימון אחד).
D.slice(0, 3).forEach(function (d) { mark('lapid', 'ז', '2', 'אא בב', d); });
mark('lapid', 'ז', '2', 'גג דד', D[0], 'Noded', 'דף'); mark('lapid', 'ז', '2', 'גג דד', D[1], 'Noded', 'שיעור');
mark('lapid', 'ח', '1', 'הה וו', D[0], 'Noded'); mark('lapid', 'ח', '1', 'הה וו', '2026-11-11', 'Noded');
mark('lapid', 'ח', '1', 'זז חח', D[2], 'Noded'); mark('lapid', 'ח', '1', 'זז חח', D[2], 'Noded');
D.slice(0, 10).forEach(function (d) { mark('lapid', 'ט', '2', 'טט יי', d, 'B10', 'שיעור'); });
D.slice(0, 9).forEach(function (d) { mark('lapid', 'ט', '3', 'ככ לל', d, 'B1230', 'שיעור'); });
D.slice(0, 5).forEach(function (d) { mark('lapid', 'ט', '3', 'ככ לל', d, 'L9', 'שיעור'); });
D.slice(0, 3).forEach(function (d) { mark('lapid', 'ח', '4', 'ממ נן', d); });
mark('lapid', 'ז', '5', 'סס עע', D[0], 'Noded'); mark('lapid', 'ז', '5', 'סס עע', D[1], 'Noded');
mark('givat', 'ז', '1', 'פפ צצ', D[0], 'Noded'); mark('givat', 'ז', '1', 'פפ צצ', D[1], 'Noded');
D.slice(0, 3).forEach(function (d) { mark('lapid', 'י', '1', 'קק רר', d, 'Pray', 'דף', 'same'); });

var L = c.tzmLs_();
ok(JSON.stringify(L.keys.sort()) === JSON.stringify(['ז|2|אא בב', 'ז|2|גג דד', 'ט|2|טט יי'].sort()), 'the right three', L.keys);
ok(L.n1 === 1 && L.n2 === 1 && L.n3 === 1 && L.tot === 3, 'counts per rule', L);
// המתג — כבוי כברירת מחדל: אין תווית לר"ם ולא בניהול.
var k = c.tzmRoute_({ tzm: 'adm', key: c.READ_KEY });
var cls = c.tzmRoute_({ tzm: 'cls', k: k.k });
ok(!k.lsOn && k.ls.length === 0 && cls.ls.length === 0, 'off by default', [k.lsOn, k.ls, cls.ls]);
ok(c.tzmRoute_({ tzm: 'lson', on: '1' }).status === 'denied', 'toggle needs READ_KEY');
ok(c.tzmRoute_({ tzm: 'lson', key: c.READ_KEY, on: '1' }).lsOn === true, 'toggle on');
k = c.tzmRoute_({ tzm: 'adm', key: c.READ_KEY });
cls = c.tzmRoute_({ tzm: 'cls', k: k.k });
ok(k.ls.length === 3 && cls.ls.length === 3, 'shown to admin and coordinator', [k.ls, cls.ls]);
// התלמיד (קישור התלמידים) — אין תווית בתשובה.
var sc = c.tzmRoute_({ tzm: 'scls', s: k.sk });
ok(sc.status === 'ok' && sc.ls === undefined && sc.bd === undefined, 'no label for students', Object.keys(sc));
// "הדף השבועי" — לא זז.
ok(JSON.stringify(c.tzmBadge_().sort()) === JSON.stringify(['ז|2|אא בב']), 'daf badge unchanged', c.tzmBadge_());
var bdn = c.tzmRoute_({ tzm: 'bdn', key: c.READ_KEY });
ok(bdn.s.ls && bdn.s.ls.tot === 3, 'numbers in bdn', bdn.s.ls);
ok(c.tzmRoute_({ tzm: 'lson', key: c.READ_KEY, on: '0' }).lsOn === false, 'toggle off');
console.log((n - fails) + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
