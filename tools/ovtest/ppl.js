// סקירה — אנשי קשר (8.99.449): תפקידים קבועים, נוספים, ומה שבמוקד. node tools/ovtest/ppl.js
// שמות וטלפונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var crypto = require('crypto');
c.Utilities.DigestAlgorithm = { MD5: 'md5' }; c.Utilities.Charset = { UTF_8: 'utf8' };
c.Utilities.computeDigest = function (a, t) { return Array.prototype.slice.call(crypto.createHash(a).update(t, 'utf8').digest()); };
c.Utilities.base64EncodeWebSafe = function (b) { return Buffer.from(b.map(function (x) { return x & 255; })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); };
W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
var T0 = W.pub.insertSheet(c.OV_TAB_);
T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
T0.appendRow([c.OV_INST_[4][1], 'givat', 'דני כהן', '', 'יוסי לוי', '5', '']);
// המוקד: שורת ישיבה עם שני אנשים, אחד מהם הוא ראש החטיבה
var con = W.priv.insertSheet('אנשי קשר');
con.appendRow([c.OV_INST_[4][1], 'יוסי לוי', '0501111111', 'משה ר״ם', '0502222222']);
function get() { c.OVX_MEMO_ = null; c.SS_OPEN_ = {}; return c.ov_({ ov: 'get', key: 'k' }); }
function set(f, v) { c.OVX_MEMO_ = null; return c.ov_({ ov: 'set', key: 'k', code: 'givat', f: f, v: v }); }
var g = get();
ok(g.status === 'ok', 'get ok', g);
var row = (g.rows || []).filter(function (r) { return r.code === 'givat'; })[0] || {};
var P = row.ppl || [];
ok(P.filter(function (p) { return p.k === 'pc' && p.name === 'דני כהן'; }).length === 1, 'fixed coord kept', P);
ok(P.filter(function (p) { return p.m && p.name === 'משה ר״ם'; }).length === 1, 'מוקד contact shown as other', P);
ok(P.filter(function (p) { return p.m && p.name === 'יוסי לוי'; }).length === 0, 'no duplicate of head', P);
// הוספת ר״ם בסקירה
var r1 = set('pp', JSON.stringify({ id: 'pAAA1', role: 'ר״ם', name: 'אבי רמי', phone: '0503333333' }));
ok(r1.status === 'ok' && r1.row.ppl.some(function (p) { return p.x && p.role === 'ר״ם' && p.name === 'אבי רמי'; }), 'ram added', r1);
ok(JSON.stringify(con.d).indexOf('0503333333') >= 0, 'added to מוקד', con.d);
// עריכה של אותו מזהה — אותה שורה
set('pp', JSON.stringify({ id: 'pAAA1', role: 'ר״ם', name: 'אבי רמי', phone: '0504444444' }));
var xs = W.priv.getSheetByName('סקירה — אנשי קשר').d;
ok(xs.length === 2, 'same id → same row', xs);
// עריכת מוקד (משה) → שורה עם תפקיד, ואז לא מוצג פעמיים
set('pp', JSON.stringify({ id: 'pBBB2', role: 'רכז תורה לשמה', name: 'משה ר״ם', phone: '0502222222' }));
var P2 = get().rows.filter(function (r) { return r.code === 'givat'; })[0].ppl;
ok(P2.filter(function (p) { return p.name === 'משה ר״ם'; }).length === 1 && P2.some(function (p) { return p.role === 'רכז תורה לשמה'; }), 'edited מוקד contact once with role', P2);
// שם ראש ישיבה (תפקיד קבוע) נכתב לטבלה
var r3 = set('rosh', 'הרב לדוגמה');
ok(r3.status === 'ok' && T0.d[1][3] === 'הרב לדוגמה', 'rosh name to table', T0.d[1]);
// טלפון לא תקין נדחה
ok(set('pp', JSON.stringify({ id: 'pCCC3', role: '', name: 'x', phone: '123' })).status === 'error', 'bad phone rejected');
// מנהלים — בלי הנוספים
W.props.OV_KEY = 'mgr';
c.OVX_MEMO_ = null;
var gm = c.ov_({ ov: 'get', key: 'mgr' });
var Pm = gm.rows.filter(function (r) { return r.code === 'givat'; })[0].ppl;
ok(!Pm.some(function (p) { return p.x || p.m; }), 'managers do not see extras', Pm);

// ---- "לומדים" = סיים לפחות דף או סומן בנוכחות, פעם אחת לאדם ----
function join(id, nm, last, role) { c.appendCols_('לומדים', [['מזהה', id], ['שם', nm], ['משפחה', last], ['טלפון', '05' + String(Math.random()).slice(2, 10)], ['קוד ישיבה', 'givat'], ['שכבה', 'ז׳'], ['כיתה', '1'], ['תפקיד', role || 'תלמיד']]); }
join('DKIDAAAA1', 'אחד', 'א'); join('DKIDBBBB2', 'שני', 'ב'); join('DDADCCCC3', 'אבא', 'ג', 'הורה'); join('DKIDDDDD4', 'רביעי', 'ד');
c.appendCols_('לימוד', [['מזהה', 'DKIDAAAA1'], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', 'ד.']]);
c.appendCols_('לימוד', [['מזהה', 'DDADCCCC3'], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', 'ד.']]);
var AT = c.sheet_(c.AMDA_TAB_);
if (!AT.getLastRow()) AT.appendRow(['מזהה', 'קוד ישיבה', 'שכבה', 'כיתה', 'שם', 'יום']);
AT.appendRow(['a1', 'givat', 'ז', '1', 'שני ב', '2026-11-02']);       // רשום — שויך לפי שם
AT.appendRow(['a2', 'givat', 'ז', '2', 'זר לגמרי', '2026-11-02']);    // לא רשום — נוכחות בלבד
AT.appendRow(['a3', 'givat', 'ז', '1', 'אחד א', '2026-11-02']);       // גם סיים דף — פעם אחת
W.cache.m = {};
var LL = c.ovLearners_();
ok(LL && LL.givat === 3, 'learners = done ∪ attended, once each, no parent', LL);
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
var miss = Object.keys(M.missing); if (miss.length) console.log('mock missing:', miss.join(' '));
process.exit(fails ? 1 : 0);
