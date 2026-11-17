// סימון רכז בשטח מתוך אנשי הקשר (8.99.527). node tools/ovtest/mark.js
// שמות וטלפונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
var T0 = W.pub.insertSheet(c.OV_TAB_);
T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
T0.appendRow([c.OV_INST_[4][1], 'givat', 'דני כהן', '', '', '5', '']);
var con = W.priv.insertSheet('אנשי קשר');
con.appendRow([c.OV_INST_[4][1], 'משה מוקד', '0502222222']);
function get() { c.OVX_MEMO_ = null; c.SS_OPEN_ = {}; return c.ov_({ ov: 'get', key: 'k' }); }
function set(f, v) { c.OVX_MEMO_ = null; return c.ov_({ ov: 'set', key: 'k', code: 'givat', f: f, v: v }); }
function ppl() { return get().rows.filter(function (r) { return r.code === 'givat'; })[0].ppl; }
function pc(P) { return P.filter(function (p) { return p.k === 'pc'; })[0] || {}; }
function own() { var O = c.ovOwn_(); return O.m.givat || {}; }
// איש קשר נוסף: ר״ם
set('pp', JSON.stringify({ id: 'pR1', role: 'ר״ם', name: 'אבי רמי', phone: '0503333333' }));
// סימון כשכבר יש רכז (דני, בעמודות הקבועות) — בלי swap: שאלה, ושום דבר לא נכתב
var r0 = set('mark', JSON.stringify({ id: 'pR1' }));
ok(r0.status === 'swap' && r0.old === 'דני כהן', 'asks before replacing', r0);
ok(T0.d[1][2] === 'דני כהן', 'nothing written without swap', T0.d[1]);
// עם swap
var r1 = set('mark', JSON.stringify({ id: 'pR1', swap: 1 }));
ok(r1.status === 'ok', 'mark ok', r1);
var P1 = ppl(), pc1 = pc(P1);
ok(pc1.name === 'אבי רמי' && pc1.phone === '0503333333' && pc1.lk === 1 && pc1.role === 'ר״ם', 'coord = contact', pc1);
ok(P1.filter(function (p) { return p.name === 'אבי רמי'; }).length === 1, 'contact shown once (as coord)', P1);
ok(P1.some(function (p) { return p.x && p.name === 'דני כהן'; }), 'old coord kept as regular contact', P1);
ok(T0.d[1][2] === 'אבי רמי' && String(own().pc).replace(/^'/, '') === '0503333333', 'fixed columns mirror', [T0.d[1], own()]);
// שינוי טלפון באיש הקשר — הרכז מתעדכן
set('pp', JSON.stringify({ id: 'pR1', role: 'ר״ם', name: 'אבי רמי', phone: '0509999999' }));
ok(pc(ppl()).phone === '0509999999' && String(own().pc).replace(/^'/, '') === '0509999999', 'phone change follows', own());
// מנהלים רואים את אותו רכז
W.props.OV_KEY = 'mgr'; c.OVX_MEMO_ = null;
var gm = c.ov_({ ov: 'get', key: 'mgr' }).rows.filter(function (r) { return r.code === 'givat'; })[0];
ok(gm.coord === 'אבי רמי' && pc(gm.ppl).phone === '0509999999' && !pc(gm.ppl).lk, 'managers see same coord', gm);
// החלפה לאיש קשר מהמוקד (בלי מזהה) — אבי נשאר איש קשר רגיל
var mo = ppl().filter(function (p) { return p.m && p.name === 'משה מוקד'; })[0];
ok(!!mo, 'moked contact listed', ppl());
var r2 = set('mark', JSON.stringify({ id: '', nid: 'pN9', name: 'משה מוקד', phone: '0502222222', swap: 1 }));
ok(r2.status === 'ok', 'mark moked ok', r2);
var P2 = ppl();
ok(pc(P2).name === 'משה מוקד' && pc(P2).lk === 1, 'moked contact is coord', P2);
ok(P2.some(function (p) { return p.x && p.name === 'אבי רמי' && p.role === 'ר״ם'; }), 'previous coord back as ר״ם', P2);
ok(P2.filter(function (p) { return p.name === 'משה מוקד'; }).length === 1, 'no duplicate of moked', P2);
// ביטול סימון — איש קשר רגיל, הרכז ריק, אף אחד לא נמחק
var r3 = set('unmark', '{}');
ok(r3.status === 'ok', 'unmark ok', r3);
var P3 = ppl();
ok(!pc(P3).name && !pc(P3).phone, 'no coord after unmark', pc(P3));
['דני כהן', 'אבי רמי', 'משה מוקד'].forEach(function (nm) {
  ok(P3.filter(function (p) { return p.name === nm; }).length === 1, 'still a contact: ' + nm, P3);
});
ok(T0.d[1][2] === '' && !own().pcx, 'columns cleared', [T0.d[1], own()]);
// ביטול של רכז ישן (לא מסומן) — הופך לאיש קשר
set('coord', 'יוסי ישן'); set('pc', '0507777777');
set('unmark', '{}');
var P4 = ppl();
ok(!pc(P4).name && P4.some(function (p) { return p.x && p.name === 'יוסי ישן' && p.phone === '0507777777'; }), 'old fixed coord becomes contact', P4);
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
var miss = Object.keys(M.missing); if (miss.length) console.log('mock missing:', miss.join(' '));
process.exit(fails ? 1 : 0);
