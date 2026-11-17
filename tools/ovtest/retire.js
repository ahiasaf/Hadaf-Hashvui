// פרישת מוקד השיחות (8.99.526): תיעוד שיחה ב"יומן שיחות", מצב השתתפות, סבבים,
// ו-`table` של המוקד הישן אינו מוחק את התיעוד. node tools/ovtest/retire.js. שמות מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
var T0 = W.pub.insertSheet(c.OV_TAB_);
T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
T0.appendRow([c.OV_INST_[4][1], 'givat', '', '', '', '', '']);
T0.appendRow([c.OV_INST_[0][1], c.OV_INST_[0][0], '', '', '', '', '']);
var NM = c.OV_INST_[4][1];
// "יומן שיחות" כפי שהמוקד כתב: שורה לישיבה (שם המוקד שונה מהטבלה), ועוד ישיבה
var J = W.priv.insertSheet('יומן שיחות');
J.appendRow(['ישיבה', 'סטטוס', 'הערה', 'מתי', 'איש קשר', 'עריכה', 'סבב', 'תגיות', 'עדכון', 'צוות']);
J.appendRow(['ישיבת בדיקה גבעה', 'warm', 'הערה ישנה', '2026-10-01T10:00:00.000Z', 'פלוני', '', '', '{}', '', '']);
J.appendRow(['ישיבה אחרת', 'joined', 'x', '2026-10-02T10:00:00.000Z', '', '', '', '{}', '', '']);
var before = JSON.stringify(J.d);
function ov(p) { c.OVX_MEMO_ = null; c.SS_OPEN_ = {}; p.key = 'k'; return c.ov_(p); }

// 1. תיעוד שיחה — שורה חדשה, השורות הקיימות לא זזות
var a = ov({ ov: 'jnl', code: 'givat', v: 'דיברנו על הכנס' });
ok(a.status === 'ok' && a.jn.length === 1 && a.jn[0].x === 'דיברנו על הכנס' && a.jn[0].n === NM, 'jnl add', a);
ok(J.d.length === 4 && J.d[3][1] === 'תיעוד' && JSON.stringify(J.d.slice(0, 3)) === JSON.stringify(JSON.parse(before)), 'existing rows untouched', J.d);
var a2 = ov({ ov: 'jnl', code: 'givat', v: '   ' });
ok(a2.status === 'error' && J.d.length === 4, 'empty entry not written', a2);
ov({ ov: 'jnl', code: 'givat', v: 'שיחה שנייה' });

// 2. get — התיעוד והמצב (לפי שם), התיעוד אינו "מצב"
var g = ov({ ov: 'get' });
ok(g.jn && g.jn.length === 2, 'get returns entries', g.jn);
ok(g.stg && g.stg[c.ckey_('ישיבת בדיקה גבעה')] === 'warm' && g.stg[c.ckey_('ישיבה אחרת')] === 'joined' &&
   !g.stg[c.ckey_(NM)], 'stage map ignores entries', g.stg);

// 3. מצב השתתפות — בשורה של המוקד (לפי השם במכשיר), לא בשורת תיעוד
var s1 = ov({ ov: 'set', f: 'stg', code: 'givat', v: 'joined', cn: JSON.stringify(['ישיבת בדיקה גבעה']) });
ok(s1.status === 'ok' && J.d[1][1] === 'joined' && J.d[1][2] === 'הערה ישנה' && J.d[1][3] !== '2026-10-01T10:00:00.000Z', 'stage on the existing row', [s1, J.d[1]]);
ok(J.d.filter(function (r) { return r[1] === 'תיעוד'; }).length === 2, 'entries kept', J.d);
var s2 = ov({ ov: 'set', f: 'stg', code: 'givat', v: 'bogus', cn: '[]' });
ok(s2.status === 'error', 'unknown stage refused', s2);
// ישיבה בלי שורה במוקד — שורה חדשה בשם שבטבלה
var L0 = J.d.length;
var s3 = ov({ ov: 'set', f: 'stg', code: c.OV_INST_[0][0], v: 'talked', cn: '[]' });
ok(s3.status === 'ok' && J.d.length === L0 + 1 && J.d[L0][0] === c.OV_INST_[0][1] && J.d[L0][1] === 'talked', 'new row when none', J.d[L0]);

// 4. המוקד הישן כותב את הלשונית מחדש (table) בלי שורות התיעוד — הן נשמרות
var rows = [['ישיבת בדיקה גבעה', 'joined', 'הערה ישנה', '2026-11-17T10:00:00.000Z', '', '', '', '{}', '', '']];
var keep = c.ovJnlKeep_(rows);
c.writeTable_('יומן שיחות', ['ישיבה', 'סטטוס', 'הערה', 'מתי', 'איש קשר', 'עריכה', 'סבב', 'תגיות', 'עדכון', 'צוות'], keep);
var ents = J.d.filter(function (r) { return r[1] === 'תיעוד'; });
ok(ents.length === 2 && ents.some(function (r) { return r[2] === 'שיחה שנייה'; }), 'table keeps entries', J.d);
// ושוב, כשהמכשיר כבר שלח אותן — בלי כפילות
c.writeTable_('יומן שיחות', ['ישיבה', 'סטטוס', 'הערה', 'מתי', 'איש קשר', 'עריכה', 'סבב', 'תגיות', 'עדכון', 'צוות'],
  c.ovJnlKeep_(J.d.slice(1).map(function (r) { return r.slice(); })));
ok(J.d.filter(function (r) { return r[1] === 'תיעוד'; }).length === 2, 'no duplicates', J.d);

// 5. סבבים
var r1 = ov({ ov: 'rnd', op: 'add', n: 'סבב חנוכה', cl: 'r' });
ok(r1.status === 'ok' && r1.rounds.length === 1 && r1.rounds[0].c === 'r', 'round add', r1);
var id = r1.rounds[0].id;
var r2 = ov({ ov: 'rnd', op: 'add', n: 'זום', cl: 'zz' });
ok(r2.status === 'ok' && r2.rounds[1].c === 'n', 'bad color → neutral', r2);
ov({ ov: 'rnd', op: 'tog', id: id, code: 'givat', on: '1' });
var r3 = ov({ ov: 'rnd', op: 'tog', id: id, code: c.OV_INST_[0][0], on: '1' });
ok(r3.rounds[0].y.length === 2, 'two marked', r3.rounds[0]);
var r4 = ov({ ov: 'rnd', op: 'tog', id: id, code: 'givat', on: '0' });
ok(r4.rounds[0].y.join() === c.OV_INST_[0][0], 'unmark', r4.rounds[0]);
var jBefore = JSON.stringify(J.d);
var r5 = ov({ ov: 'rnd', op: 'del', id: id });
ok(r5.status === 'ok' && r5.rounds.length === 1 && r5.rounds[0].n === 'זום', 'round removed', r5);
ok(JSON.stringify(J.d) === jBefore, 'removing a round leaves the call log', '');
var g2 = ov({ ov: 'get' });
ok(g2.rounds && g2.rounds.length === 1 && g2.jn.length === 2, 'get returns rounds', g2.rounds);
ok(W.priv.getSheetByName('סבבים') && !W.pub.getSheetByName('סבבים'), 'rounds tab is private', '');

// 6. בלי סיסמה — לא
W.props.OV_KEY = 'mgr1';
var d1 = c.ov_({ ov: 'jnl', key: 'mgr1', code: 'givat', v: 'x' });
var d2 = c.ov_({ ov: 'rnd', key: 'mgr1', op: 'add', n: 'x' });
var d3 = c.ov_({ ov: 'set', key: 'mgr1', f: 'stg', code: 'givat', v: 'no' });
ok(d1.status === 'denied' && d2.status === 'denied' && d3.status === 'denied', 'managers link cannot write', [d1, d2, d3]);
console.log('checks', n, 'fails', fails); process.exit(fails ? 1 : 0);
