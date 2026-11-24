// בקשה למחיקת חשבון (8.99.581) — POST action:'mechika' ו-?mechika=chk מול apps-script.gs בזיכרון.
// node tools/mktest/run.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function rows() { var s = W.priv.getSheetByName('בקשות מחיקה'); return s && s.d.length ? s.d.length - 1 : 0; }
var op = 'ab'.repeat(16), F = { n: 'בדיקה בדיקה', ph: '000-0000001', note: 'x', id: 'Dtst1', dev: 'Dtst1' };
ok(get({ mechika: 'chk', op: op }).saved === false, 'not saved before');
ok(post({ action: 'mechika', op: op, f: { n: '', ph: '0000000001' } }).status === 'error' && rows() === 0, 'name required');
ok(post({ action: 'mechika', op: op, f: { n: 'א', ph: '12' } }).status === 'error' && rows() === 0, 'phone required');
ok(post({ action: 'mechika', op: 'zz', f: F }).status === 'error', 'bad op');
var r = post({ action: 'mechika', op: op, f: F });
ok(r.saved && rows() === 1, 'saved', r);
ok(!W.pub.getSheetByName('בקשות מחיקה'), 'private sheet only');
ok(post({ action: 'mechika', op: op, f: F }).dup && rows() === 1, 'same op → no second row');
ok(get({ mechika: 'chk', op: op }).saved === true, 'chk after');
var row = W.priv.getSheetByName('בקשות מחיקה').d[1];
ok(row[3] === '0000000001' && row[7] === 'ממתין', 'row content', row);
console.log(n - fails + '/' + n);
process.exit(fails ? 1 : 0);
