var M = require('./mock.js'); var W = M.makeWorld(), c = W.ctx;
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
for (var i = 0; i < 12; i++) c.appendCols_('לומדים', [['מזהה', 'S' + i], ['שם', 'a' + i], ['משפחה', 'b' + i], ['טלפון', 'ph' + i], ['ישיבה', 'ישיבת גבעת שמואל'], ['קוד ישיבה', 'givat'], ['שכבה', 'ז'], ['כיתה', '1'], ['תפקיד', 'תלמיד']]);
function learn(id, p) { c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', 4], ['דף', 'ד' + p], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]); }
learn('S1', '.'); learn('S1', ':');
var code = c.getCode_('givat'); if (!code && c.ensureCode_) { c.ensureCode_('givat', 'zz'); code = c.getCode_('givat'); }
exec(); var b = c.boardData_('givat', code);
console.log('code', code, 'status', b.status, 'keys', Object.keys(b).join(','));
var arr = b.students || [];
console.log('n', arr.length, JSON.stringify(arr[0] || b).slice(0, 300));
var tkOf = function (bb, id) { var a = bb.students || []; var x = a.filter(function (p) { return p.id === id || p.pid === id; })[0]; return x ? JSON.stringify(x.tk) : 'missing'; };
console.log('S2 tk before', tkOf(b, 'S2'));
learn('S2', '.'); learn('S2', ':'); exec();
var b2 = c.boardData_('givat', code); console.log('S2 tk after (cache path)', tkOf(b2, 'S2'));
var k = W.cache.m; W.cache.m = {}; exec(); var b3 = c.boardData_('givat', code); W.cache.m = k;
console.log('S2 tk full calc        ', tkOf(b3, 'S2'), JSON.stringify(b2) === JSON.stringify(b3) ? 'IDENTICAL' : 'DIFF');
