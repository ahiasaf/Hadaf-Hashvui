// ר"ם שהכיתה שלו לא ידועה מסמן אותה בעצמו (8.99.603, limMe_) — מול apps-script.gs ב-vm. node tools/limtest/self.js
// שמות ומזהים מומצאים.
var M = require('../snaptest/mock.js'); var W = M.makeWorld(), c = W.ctx;
var n = 0, fails = 0;
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; c.OVX_MEMO_ = null; }
function get(p) { exec(); var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
c.READ_KEY = 'K';
function reg(id, f, g, k) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', f], ['משפחה', 'בדיקה'], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
    ['קוד ישיבה', 'tapuah'], ['שכבה', g], ['כיתה', k], ['תפקיד', 'תלמיד']]);
}
reg('S1', 'אחד', 'ט׳', '3'); reg('S3', 'שלישי', 'ט׳', '2'); reg('S4', 'רביעי', 'י״א', '3');
function staff(dev, role, ph, g, k) {
  c.appendCols_('התראות', [['מזהה', dev], ['שם', 'Staff ' + dev], ['טלפון', ph], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
    ['קוד ישיבה', 'tapuah'], ['תפקיד', role], ['שכבה', g || ''], ['כיתה', k || '']]);
}
staff('DRAM00002', 'רב ומחנך', '055' + '0000022');            // בלי כיתה
staff('DRAM00001', 'רב ומחנך', '055' + '0000011', 'ט׳', '3'); // עם כיתה
staff('DHEAD0001', 'ראש חטיבה', '055' + '0000044');
staff('DRAM00007', 'רב ומחנך', '055' + '0000077');            // בלי כיתה, לא אושר
['DRAM00002', 'DRAM00001', 'DHEAD0001', 'DRAM00007'].forEach(function (d) {
  c.accAsk_('tapuah', d, false);
  if (d !== 'DRAM00007') c.upsertCols_(c.ACC_TAB, [['מזהה', d], ['מצב', 'אושר']], 'מזהה');
});
c.ensureCode_('tapuah', 'zz');
W.cache.m = {};
function ids(b) { return (b.students || []).map(function (p) { return p.id; }).sort().join(','); }

var d0 = get({ board: 'tapuah', dev: 'DRAM00002' });
ok(d0.status === 'denied' && d0.lim === 1, 'no class → denied with lim', d0);
var d1 = get({ netroster: 'tapuah', dev: 'DRAM00002' });
ok(d1.status === 'denied' && d1.lim === 1, 'roster denied with lim', d1);
ok(!get({ board: 'tapuah', dev: 'DHEAD0001' }).lim, 'head — no lim');

ok(get({ limme: 'tapuah', dev: 'DRAM00002', g: 'ט׳' }).status === 'error', 'missing class → error');
ok(get({ limme: 'tapuah', dev: 'DRAM00007', g: 'ט׳', cl: '2' }).status === 'denied', 'not approved → denied');
ok(get({ limme: 'other', dev: 'DRAM00002', g: 'ט׳', cl: '2' }).status === 'denied', 'other yeshiva → denied');
ok(get({ limme: 'tapuah', dev: 'DHEAD0001', g: 'ט׳', cl: '2' }).status === 'denied', 'not a ram → denied');
ok(get({ limme: 'tapuah', dev: 'NOPE00001', g: 'ט׳', cl: '2' }).status === 'denied', 'unknown device → denied');

var s = get({ limme: 'tapuah', dev: 'DRAM00002', g: 'ט׳', cl: '2' });
ok(s.status === 'ok' && s.set === 1 && s.g === 'ט׳' && s.c === '2', 'self set', s);
var b = get({ board: 'tapuah', dev: 'DRAM00002' });
ok(b.status === 'ok' && ids(b) === 'S3', 'board opens on his class at once', ids(b));
var nr = get({ netroster: 'tapuah', dev: 'DRAM00002' });
ok(nr.status === 'ok', 'roster opens', nr.status);

// כיתה ידועה — לא משתנה מכאן
var s2 = get({ limme: 'tapuah', dev: 'DRAM00002', g: 'י״א', cl: '3' });
ok(s2.status === 'ok' && !s2.set && s2.g === 'ט׳' && s2.c === '2', 'known class unchanged', s2);
ok(ids(get({ board: 'tapuah', dev: 'DRAM00002' })) === 'S3', 'still his class');
var s3 = get({ limme: 'tapuah', dev: 'DRAM00001', g: 'י״א', cl: '3' });
ok(s3.status === 'ok' && !s3.set && s3.c === '3', 'registered class unchanged', s3);
ok(ids(get({ board: 'tapuah', dev: 'DRAM00001' })) === 'S1', 'registered ram still his class');

// הבעלים רואה את מה שנבחר
var L = get({ acclim: '1', key: 'K' });
var me = (L.rows || []).filter(function (x) { return x.id === 'DRAM00002'; })[0];
ok(me && me.g === 'ט׳' && me.c === '2', 'owner list shows chosen class', me);

console.log(fails ? fails + ' FAILED of ' + n : 'OK · ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
