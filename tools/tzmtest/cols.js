// לשונית "צמאה — רישום" עם 10 עמודות בדיוק (8.99.590): בגיליון האמיתי getRange מעבר לרוחב זורק.
// node tools/tzmtest/cols.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), n = 0, fails = 0;
function ok(c, l, x) { n++; if (!c) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
var W = M.makeWorld(), c = W.ctx;
c.TZM_CLOSED_ = false; // ההרשמה פתוחה בבדיקות האלה (הנעילה — closed.js)
c.sheet_('תלמידי הרשת').getRange(1, 1, 2, 5).setValues([['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי'], ['lapid', 'ט', '5', 'אלף', 'בית']]);
function G(P) { return JSON.parse(c.doGet({ parameter: P }).t); }
var adm = G({ tzm: 'adm', key: 'k' });
G({ tzm: 'sst', s: adm.sk, g: 'ט', cl: '5', n: 'אין' }); // יוצר את הלשונית
var sh = W.priv.getSheetByName('צמאה — רישום');
// גיליון אמיתי: רוחב מקסימלי 10, ומעבר לו — זריקה.
var max = 10, gr = sh.getRange;
sh.getMaxColumns = function () { return max; };
sh.insertColumnsAfter = function (a, k) { max += k; };
sh.getRange = function (r, col, nr, nc) {
  if (col + (nc || 1) - 1 > max) throw new Error('outside the dimensions of the sheet');
  return gr.apply(this, arguments);
};
var r = G({ tzm: 'sreq', s: adm.sk, g: 'ט', cl: '5', n: 'אלף בית' });
ok(r.status === 'ok' && r.tk, 'request ok on 10-column tab', r);
ok(max >= 11, 'column added', max);
ok(G({ tzm: 'sst', s: adm.sk, g: 'ט', cl: '5', n: 'אלף בית', tk: r.tk }).st === 'pend', 'status pend');
ok(G({ tzm: 'scan', s: adm.sk, g: 'ט', cl: '5', n: 'אלף בית', tk: r.tk }).status === 'ok', 'cancel ok');
console.log((n - fails) + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
