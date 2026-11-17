// הגבלת ר"ם לכיתה שלו (8.99.527) — מול apps-script.gs ב-vm. node tools/limtest/run.js
// שמות ומזהים מומצאים.
var M = require('../snaptest/mock.js'); var W = M.makeWorld(), c = W.ctx;
var n = 0, fails = 0;
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; c.OVX_MEMO_ = null; }
function get(p) { exec(); var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
function post(d) { exec(); return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
c.READ_KEY = 'K';
function reg(id, f, g, k) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', f], ['משפחה', 'בדיקה'], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
    ['קוד ישיבה', 'tapuah'], ['שכבה', g], ['כיתה', k], ['תפקיד', 'תלמיד']]);
}
reg('S1', 'אחד', 'ט׳', '3'); reg('S2', 'שני', 'ט', 'ט׳3'); reg('S3', 'שלישי', 'ט׳', '2'); reg('S4', 'רביעי', 'י׳', '3'); reg('S5', 'חמישי', 'ט׳', '');
// אנשי צוות: ר"ם (DRAM00001), ראש חטיבה (DHEAD0001) עם אותו טלפון במכשיר אחר, ר"ם בלי כיתה (DRAM00002), ר"ם שלא ביקש גישה (DRAM00003)
function staff(dev, nm, role, ph, g, k) {
  c.appendCols_('התראות', [['מזהה', dev], ['שם', nm], ['טלפון', ph], ['ישיבה', 'ישיבת תפוח / מערב השומרון'],
    ['קוד ישיבה', 'tapuah'], ['תפקיד', role], ['שכבה', g || ''], ['כיתה', k || '']]);
}
staff('DRAM00001', 'הר"ם', 'רב ומחנך', '0550000011', 'ט׳', '3');
staff('DHEAD0001', 'הר"ם', 'ראש חטיבה', '0550000011');
staff('DRAM00002', 'ר"ם ב', 'רב ומחנך', '0550000022');
staff('DRAM00003', 'ר"ם ג', 'רב ומחנך', '0550000033', 'י׳', '3');
['DRAM00001', 'DHEAD0001', 'DRAM00002'].forEach(function (d) {
  var a = c.accAsk_('tapuah', d, false);
  c.upsertCols_(c.ACC_TAB, [['מזהה', d], ['מצב', 'אושר']], 'מזהה');
});
c.ensureCode_('tapuah', 'zz');
var net = c.sheet_('תלמידי הרשת');
net.appendRow(['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי']);
net.appendRow(['tapuah', 'ט', '3', 'א', 'אחד']); net.appendRow(['tapuah', 'ט', '2', 'ב', 'שני']); net.appendRow(['tapuah', 'י', '3', 'ג', 'שלישי']);
var AT = c.sheet_(c.AMDA_TAB_);
AT.appendRow(['מזהה', 'קוד ישיבה', 'שכבה', 'כיתה', 'שם', 'יום', 'סוג']);
AT.appendRow(['m1', 'tapuah', 'ט', '3', 'אחד א', '2026-11-02', 'שיעור']);
AT.appendRow(['m2', 'tapuah', 'ט', '2', 'שני ב', '2026-11-02', 'שיעור']);
W.cache.m = {};
function ids(b) { return (b.students || []).map(function (p) { return p.id; }).sort().join(','); }
// בלי הגבלה — הכול כמו היום
var b0 = get({ board: 'tapuah', dev: 'DRAM00001' });
ok(b0.status === 'ok' && ids(b0) === 'S1,S2,S3,S4,S5', 'no limit → whole yeshiva', ids(b0));
// הרשימה לבעלים
var L = get({ acclim: '1', key: 'K' });
var me = function (id) { return (L.rows || []).filter(function (x) { return x.id === id; })[0]; };
ok(L.status === 'ok' && me('DRAM00001') && me('DRAM00001').g === 'ט׳' && me('DRAM00001').c === '3', 'list grade/class from registration', L);
ok(me('DRAM00001').oth.indexOf('ראש חטיבה') >= 0, 'other role shown', me('DRAM00001'));
ok(me('DRAM00003') && me('DRAM00003').acc === 0, 'ram without access row listed', me('DRAM00003'));
ok(!me('DHEAD0001'), 'non-ram not listed');
ok(get({ acclim: '1' }).status === 'denied', 'list needs key');
// ר"ם בלי כיתה — אי אפשר להדליק; השלמה ידנית — אפשר
ok(get({ acclim: 'set', id: 'DRAM00002', on: '1', key: 'K' }).status === 'error', 'no class → cannot enable');
var s2 = get({ acclim: 'set', id: 'DRAM00002', on: '1', g: 'ט', c: '2', key: 'K' });
ok(s2.status === 'ok' && s2.rows.filter(function (x) { return x.id === 'DRAM00002'; })[0].on, 'manual class + enable', s2);
var b2 = get({ board: 'tapuah', dev: 'DRAM00002' });
ok(ids(b2) === 'S3', 'manual class board', ids(b2));
// הדלקה
var s1 = get({ acclim: 'set', id: 'DRAM00001', on: '1', key: 'K' });
ok(s1.status === 'ok', 'enable ok', s1);
var b1 = get({ board: 'tapuah', dev: 'DRAM00001' });
ok(b1.status === 'ok' && ids(b1) === 'S1,S2', 'board: only ט׳3 (normalized), no empty class', ids(b1));
// תפקיד אחר של אותו אדם — לא נפגע
var bh = get({ board: 'tapuah', dev: 'DHEAD0001' });
ok(ids(bh) === 'S1,S2,S3,S4,S5', 'other-role device unaffected', ids(bh));
// רשימת הכיתה והנוכחות
var nr = get({ netroster: 'tapuah', dev: 'DRAM00001' });
ok(nr.status === 'ok' && nr.rows.length === 1 && nr.rows[0][1] === '3', 'roster only his class', nr);
var nm = get({ netmarks: 'tapuah', dev: 'DRAM00001' });
ok(nm.status === 'ok' && nm.rows.length === 2 && nm.rows[1][0] === 'm1', 'marks only his class', nm);
// כתיבה לכיתה אחרת — נדחית; לכיתה שלו — עוברת
var w1 = post({ action: 'amdarows', tab: c.AMDA_TAB_, dev: 'DRAM00001', inst: 'tapuah',
  rows: [[['מזהה', 'x1'], ['שכבה', 'ט'], ['כיתה', '2'], ['שם', 'זר'], ['סוג', 'שיעור']]] });
ok(w1.status === 'denied', 'write other class denied', w1);
var w2 = post({ action: 'amdarows', tab: c.AMDA_TAB_, dev: 'DRAM00001', inst: 'tapuah',
  rows: [[['מזהה', 'x2'], ['שכבה', 'ט'], ['כיתה', '3'], ['שם', 'שלו'], ['סוג', 'שיעור']]] });
ok(w2.status !== 'denied', 'write own class ok', w2);
var w3 = post({ action: 'row', tab: c.AMDA_TAB_, dev: 'DRAM00001', inst: 'tapuah',
  cols: [['מזהה', 'x3'], ['שכבה', 'י'], ['כיתה', '3'], ['שם', 'זר']] });
ok(w3.status === 'denied', 'single row other class denied', w3);
var d1 = post({ action: 'amdadel', dev: 'DRAM00001', inst: 'tapuah', ids: ['m2'] });
ok(d1.n === 0 && JSON.stringify(AT.d).indexOf('m2') >= 0, 'cannot delete other class', d1);
// שליחה לתלמידים — רק הכיתה שלו
var fired = [];
c.ghFire_ = function (t, b, only, g, k, who, link, role, wait, flt) { fired.push(JSON.parse(flt || '{}')); return { status: 'ok' }; };
c.appendCols_('התראות', [['מזהה', 'S1'], ['קוד ישיבה', 'tapuah'], ['תפקיד', 'תלמיד']]);
var sy = c.saySay_({ parameter: { inst: 'tapuah', dev: 'DRAM00001', body: 'שלום', grade: '', klass: '' } });
var syR = JSON.parse(String(sy.t).replace(/^cb\((.*)\)$/, '$1'));
ok(syR.status === 'ok' && fired.length === 1 && (fired[0].ids || []).sort().join(',') === 'S1,S2', 'say → only his class ids', [syR, fired]);
fired = [];
c.saySay_({ parameter: { inst: 'tapuah', dev: 'DRAM00001', body: 'שלום', flt: JSON.stringify({ ids: ['S4'] }) } });
ok(fired.length === 0, 'say to other-class id → nothing sent', fired);
// כיתה שנמחקה מהשורה — נכשל סגור
var LT = c.sheet_(c.LIM_TAB_), hh = LT.d[0], ci = hh.indexOf('כיתה');
LT.d.forEach(function (r, i) { if (i && r[0] === 'DRAM00001') r[ci] = ''; });
W.cache.m = {};
ok(get({ board: 'tapuah', dev: 'DRAM00001' }).status === 'denied', 'missing class → closed');
ok(get({ netroster: 'tapuah', dev: 'DRAM00001' }).status === 'denied', 'missing class → roster closed');
// כיבוי — חוזר להכול
get({ acclim: 'set', id: 'DRAM00001', on: '0', g: 'ט׳', c: '3', key: 'K' });
ok(ids(get({ board: 'tapuah', dev: 'DRAM00001' })) === 'S1,S2,S3,S4,S5', 'disable → whole yeshiva');
// "גישה" לא נגעה
ok(c.accRow_('DRAM00001').st === 'אושר', 'access row untouched');
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
var miss = Object.keys(M.missing); if (miss.length) console.log('mock missing:', miss.join(' '));
process.exit(fails ? 1 : 0);
