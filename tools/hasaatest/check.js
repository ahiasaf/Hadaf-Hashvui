// הצהרת התלמיד (8.99.490) — ?hasaa=check&hs= ו-POST action:'hasaa' מול apps-script.gs בזיכרון.
// node tools/hasaatest/check.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function rows() { var s = W.priv.getSheetByName('הצהרות'); return s ? s.d.length - 1 : 0; }
var A = 'a'.repeat(48), B = 'b'.repeat(48), C = 'c'.repeat(48), D = 'd'.repeat(48);
var F = { n: 'תלמיד א', y: 'ישיבה', c: 'ט', ph: '0500000000', m1: 'תענית', p1: 'x', p2: 'y', s: 'חתימה' };
ok(get({ hasaa: 'check', hs: A }).saved === false, 'before: no tab → false');
ok(get({ hasaa: 'check', hs: A, callback: 'cb' }).saved === false, 'jsonp works');
ok(get({ hasaa: 'check', hs: 'zz' }).status === 'error', 'bad sid → error');
var r = post({ action: 'hasaa', sid: A, f: F });
ok(r.status === 'ok' && r.saved === true, 'put saved', r);
ok(rows() === 1, 'one row');
var g = get({ hasaa: 'check', hs: A });
ok(g.status === 'ok' && g.saved === true, 'check existing → true', g);
ok(get({ hasaa: 'check', hs: B }).saved === false, 'check new → false');
ok(JSON.stringify(g) === '{"status":"ok","saved":true}', 'no content leaked', g);
ok(post({ action: 'hasaa', sid: A, f: F }).dup === true && rows() === 1, 'same sid → no 2nd row');
// עמוד חדש (sid חדש), אותו תוכן — לא שורה שנייה, והבדיקה של ה-sid החדש "נשמר"
ok(post({ action: 'hasaa', sid: B, f: F }).saved === true && rows() === 1, 'same content new sid → no 2nd row', rows());
ok(get({ hasaa: 'check', hs: B }).saved === true, 'new sid check → true');
// אח באותו טלפון — שורה משלו
var F2 = JSON.parse(JSON.stringify(F)); F2.n = 'תלמיד ב'; F2.s = 'ב';
ok(post({ action: 'hasaa', sid: C, f: F2 }).saved === true && rows() === 2, 'sibling → own row');
ok(get({ hasaa: 'check', hs: D }).saved === false, 'still false for unknown');
console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
