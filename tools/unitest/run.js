// רשומה אחת לתלמיד (8.99.625) — netUni_ מול apps-script.gs ב-vm. node tools/unitest/run.js
// שמות מומצאים.
var M = require('../snaptest/mock.js'); var W = M.makeWorld(), c = W.ctx;
var n = 0, fails = 0;
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; c.OVX_MEMO_ = null; }
function get(p) { exec(); var r = c.doGet({ parameter: p }); return JSON.parse(String(r.t).replace(/^cb\((.*)\)$/, '$1')); }
function post(d) { exec(); return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
c.READ_KEY = 'K';
var net = c.sheet_('תלמידי הרשת'), sch = c.sheet_('תלמידי בית הספר');
// המדמה אינו מכיר copyTo — עותק לגיבוי
Object.getPrototypeOf(net).copyTo = function (ss) { var s = ss.insertSheet('tmp' + Math.random()); s.d = JSON.parse(JSON.stringify(this.d)); return s; };
Object.getPrototypeOf(net).setName = function (nm) { delete this.ss.tabs[this.name]; this.name = nm; this.ss.tabs[nm] = this; return this; };
net.appendRow(['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי', 'טלפון', 'מקור']);
// ישיבה אחרת — לא אמורה לזוז
net.appendRow(['givat', 'ז', '1', 'אחר', 'ראשון', '0500000001', 'קובץ']);
net.appendRow(['givat', 'ח', '2', 'אחר', 'שני', '', 'קובץ']);
// לפיד: הקובץ של 23.11 (ז–יב)
var L = [['ז', '1', 'כהן', 'אבי'], ['ז', '2', 'לוי', 'משה'], ['ח', '3', 'בן דוד', 'יוסף'], ['ט', '1', 'שרון', 'דני'],
         ['י', '4', 'גל', 'רון'], ['יא', '1', 'אור', 'נתן'], ['יב', '2', 'טל', 'עמית'],
         ['ט', '2', 'זהבי', 'עידו'], ['ט', '5', 'זהבי', 'עידו'],   // שני "זהבי עידו" באותה שכבה
         ['י', '1', 'ברק', 'שי'],                                 // כיתה סותרת מול בית הספר
         ['ח', '1', 'רז', '']];                                    // בלי שם פרטי
L.forEach(function (x) { net.appendRow(['lapid', x[0], x[1], x[2], x[3], '', 'קובץ 23.11']); });
sch.appendRow(['שכבה', 'כיתה', 'שם', 'קוד ישיבה', 'פרטי']);
[['ז', '1', 'כהן אבי', 'אבי'], ['ז', '2', 'לוי  משה', 'משה'], ['ח', '3', 'בן-דוד יוסף', 'יוסף'], ['ט׳', '1', 'שרון דני', 'דני'],
 ['י', '4', 'גל רון', 'רון'], ['ט', '2', 'זהבי עידו', 'עידו'], ['י', '2', 'ברק שי', 'שי'],
 ['ח', '1', 'רז יובל', 'יובל'],  // אין התאמה (בקובץ — בלי פרטי) → עובר
 ['ז', '3', 'חדש בעמדה', 'בעמדה'] // רק בעמדה → עובר
].forEach(function (x) { sch.appendRow([x[0], x[1], x[2], 'lapid', x[4] || x[3]]); });
var givatBefore = JSON.stringify(net.d.filter(function (r) { return r[0] === 'givat'; }));

ok(get({ netuni: 'pre', inst: 'lapid' }).status === 'denied', 'בלי סיסמה — נדחה');
var pre = get({ netuni: 'pre', inst: 'lapid', key: 'K' });
ok(pre.status === 'ok' && pre.net === 11 && pre.sch === 9, 'pre — ספירות', pre);
ok(pre.dup === 5, 'pre — 5 כפולים (כהן, לוי, בן דוד, שרון, גל)', pre);
ok(pre.move === 2, 'pre — 2 עוברים (רז יובל, חדש בעמדה)', pre);
ok(pre.manual === 2, 'pre — 2 לטיפול ידני (זהבי, ברק)', pre);
ok(pre.nameDiff === 1, 'pre — שם שנכתב אחרת (מקף)', pre);
ok(pre.after === 13 && pre.schAfter === 2, 'pre — אחרי', pre);
ok(net.d.length === 14 && sch.d.length === 10, 'pre לא כותב');
var pubNames = JSON.stringify(pre);
ok(!/כהן|לוי|זהבי/.test(pubNames), 'pre — בלי שמות בתשובה');

var go = get({ netuni: 'go', inst: 'lapid', key: 'K' });
ok(go.status === 'ok', 'go', go);
var h = net.d[0], iI = h.indexOf('מזהה תלמיד');
ok(iI >= 0, 'עמודת מזהה תלמיד נוספה');
var lap = net.d.filter(function (r) { return r[0] === 'lapid'; });
ok(lap.length === 13, '13 רשומות לפיד', lap.length);
ok(lap.every(function (r) { return /^T[0-9a-z]{10}$/.test(r[iI]); }), 'לכל תלמיד לפיד — מזהה');
ok(JSON.stringify(net.d.filter(function (r) { return r[0] === 'givat'; }).map(function (r) { return r.slice(0, 7); })) === givatBefore, 'ישיבה אחרת לא זזה');
ok(net.d.filter(function (r) { return r[0] === 'givat'; }).every(function (r) { return !r[iI]; }), 'ישיבה אחרת — בלי מזהה');
var full = function (sh) { return sh.d.filter(function (r) { return r.join('') !== ''; }); };
var schL = full(sch).slice(1).map(function (r) { return r[2]; });
ok(schL.length === 2 && schL.indexOf('זהבי עידו') >= 0 && schL.indexOf('ברק שי') >= 0, 'בבית הספר נשארו רק השניים לטיפול ידני', schL);
var raz = lap.filter(function (r) { return r[3] === 'רז'; });
ok(raz.length === 2, 'רז (בלי פרטי בקובץ) ורז יובל — שתי רשומות (אין ודאות)', raz);
var nw = lap.filter(function (r) { return r[4] === 'בעמדה'; })[0];
ok(nw && nw[3] === 'חדש' && nw[6] === 'תלמידי בית הספר', 'העובר — משפחה/פרטי/מקור', nw);
var log = c.sheet_('מאגר — לטיפול ידני', 'PRIV');
ok(log.d.length === 3, 'יומן לטיפול ידני — 2 שורות', log.d.length);
ok(Object.keys(W.priv.tabs).some(function (k) { return k.indexOf('גיבוי תלמידי בית הספר · ') === 0; }) ||
   Object.keys(W.pub.tabs).some(function (k) { return k.indexOf('גיבוי תלמידי בית הספר · ') === 0; }), 'גיבוי בית הספר');
var chk = go.check;
ok(chk.net === 13 && chk.sch === 2 && chk.noId === 0, 'chk', chk);
ok(chk.dupKeys === 2, 'chk — רק שני המפתחות לטיפול ידני', chk);
ok((c.netUniInsts_() || []).indexOf('lapid') >= 0, 'לפיד ברשימת המאוחדות');

// ריצה חוזרת — בלי שינוי
var ids = lap.map(function (r) { return r[iI]; }).join();
var go2 = get({ netuni: 'go', inst: 'lapid', key: 'K' });
ok(go2.status === 'ok' && go2.dup === 0 && go2.move === 0, 'ריצה חוזרת — אין מה לאחד', go2);
ok(net.d.filter(function (r) { return r[0] === 'lapid'; }).map(function (r) { return r[iI]; }).join() === ids, 'המזהים לא השתנו');
ok(log.d.length === 3, 'היומן לא כפל');

// העמדה מעלה שוב את קובץ בית הספר הישן — עובר מיד לרשימה האחת
var rows = [['ז', '1', 'כהן אבי', 'lapid', 'אבי'], ['ז', '2', 'לוי משה', 'lapid', 'משה'], ['ז', '4', 'מצטרף טרי', 'lapid', 'טרי']];
var tr = post({ action: 'table', tab: 'תלמידי בית הספר', key: 'K', cols: JSON.stringify(['שכבה', 'כיתה', 'שם', 'קוד ישיבה', 'פרטי']), rows: JSON.stringify(rows) });
ok(tr.status === 'success', 'table לבית הספר', tr);
ok(full(sch).length === 1, 'בית הספר ריקה מלפיד אחרי העלאה', full(sch).length);
lap = net.d.filter(function (r) { return r[0] === 'lapid'; });
ok(lap.length === 14 && lap.some(function (r) { return r[4] === 'טרי' && /^T/.test(r[iI]); }), 'המצטרף נוסף פעם אחת, עם מזהה', lap.length);

// netroster — הרשימה האחת, עם שם פרטי
var nr = get({ netroster: 'lapid', key: 'K' });
ok(nr.status === 'ok' && nr.rows.length === 14, 'netroster — 14', nr.rows && nr.rows.length);
var k = {}; nr.rows.forEach(function (x) { k[c.netUK_('lapid', x[0], x[2])] = (k[c.netUK_('lapid', x[0], x[2])] || 0) + 1; });
ok(Object.keys(k).filter(function (x) { return k[x] > 1; }).length === 1, 'netroster — רק זהבי עידו כפול (שני תלמידים)');
ok(nr.rows.some(function (x) { return x[2] === 'כהן אבי' && x[3] === 'אבי'; }), 'netroster — שם פרטי');

// ייבוא: תלמיד חדש בלפיד מקבל מזהה; בגבעת שמואל — לא
var cur = c.netRows_(net);
var im = post({ action: 'netMerge', key: 'K', run: 'r1', base: c.netSig_(cur), insts: JSON.stringify(['lapid', 'givat']),
  cols: JSON.stringify(['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי', 'מקור']),
  ops: JSON.stringify([{ k: 'add', row: { 'קוד ישיבה': 'lapid', 'שכבה': 'ז', 'כיתה': '5', 'משפחה': 'נוסף', 'פרטי': 'בייבוא', 'מקור': 'x' } },
                      { k: 'add', row: { 'קוד ישיבה': 'givat', 'שכבה': 'ז', 'כיתה': '5', 'משפחה': 'נוסף', 'פרטי': 'בגבעת', 'מקור': 'x' } }]) });
ok(im.status === 'ok' && im.add === 2, 'ייבוא', im);
var a1 = net.d.filter(function (r) { return r[4] === 'בייבוא'; })[0], a2 = net.d.filter(function (r) { return r[4] === 'בגבעת'; })[0];
ok(a1 && /^T/.test(a1[iI]), 'ייבוא לפיד — מזהה');
ok(a2 && !a2[iI], 'ייבוא גבעת — בלי מזהה');

// חנוכה — רשימה אחת: סכום (בית הספר מכילה רק את שני הלא-מאוחדים — ט׳2 זהבי… כבר לא שם אחרי העלאה)
c.CacheService.getScriptCache().removeAll(['chn:c:lapid']);
console.log(n - fails + '/' + n + (fails ? ' — נכשלו ' + fails : ' — הכול עבר'));
process.exit(fails ? 1 : 0);
