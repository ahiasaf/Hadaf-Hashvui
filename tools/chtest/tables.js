// חבר מביא חבר — כללי השולחנות (8.99.436), מול apps-script.gs עצמו בזיכרון.
// node tools/chtest/tables.js   → יוצא בקוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
// require('./tables.js') — העולם עצמו, לגשר אליו את script.google.com מדפדפן.
var M = require('../snaptest/mock.js'), vm = require('vm');
var W = M.makeWorld(), c = W.ctx;
// שעון מדומה: new Date() ו-Date.now() לפי CLOCK.
vm.runInContext("var CLOCK={t:0};var RealDate_=Date;Date=function(a,b,cc,d,e,f,g){var n=arguments.length;" +
  "if(!(this instanceof Date))return new RealDate_(CLOCK.t).toString();if(!n)return new RealDate_(CLOCK.t);" +
  "if(n===1)return new RealDate_(a);return new RealDate_(a,b,cc||1,d||0,e||0,f||0,g||0);};" +
  "Date.prototype=RealDate_.prototype;Date.now=function(){return CLOCK.t};Date.parse=RealDate_.parse;Date.UTC=RealDate_.UTC;", c);
var H = 3600e3, T0 = Date.parse('2026-11-02T10:00:00Z');   // יום שני
function at(h) { c.CLOCK.t = T0 + h * H; }
function iso(h) { return new Date(T0 + h * H).toISOString(); }
function exec() { c.LRN_ROWS_ = null; c.SS_OPEN_ = {}; c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.RAF_D_ = null; c.RAF_DH_ = {}; W.cache.m = {}; }
var U = { test: false };
at(-200);
var set = c.chTab_(c.CH_SET_, ['שדה', 'ערך']);
[['פעיל', 'כן'], ['נפתח', iso(0)], ['ארוחות ממומנות', '5'], ['שולחנות מ', iso(0)]].forEach(function (x) { c.chPut_(set, { 'שדה': x[0], 'ערך': x[1] }); });
var N = 0;
function person(name, by, h) {
  var id = 'D' + name + 'X';
  var cols = [['מזהה', id], ['שם', name], ['משפחה', 'מ' + (N++)], ['טלפון', '050000' + (1000 + N)], ['ישיבה', 'י'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']];
  if (by) { at(h); cols.push([c.CH_BY_COL, by], [c.CH_AT_COL, "'" + iso(h)]); }
  c.appendCols_('לומדים', cols);
  return id;
}
function learn(id, h) {
  at(h);
  c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', 'ד.'], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]);
  c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', 'ד:'], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]);
}
function code(id) { return c.chRefNew_(id, false); }
function sync(h) { at(h); exec(); return c.chSync_(U); }
function my(Mo, id, ref) { return c.chMy_(Mo, { id: id, ref: ref || '' }, U); }
var fails = 0, n = 0;
function ok(cond, label, extra) { n++; if (!cond) { fails++; console.log('FAIL', label, extra === undefined ? '' : JSON.stringify(extra)); } }
function tbl(Mo, id) { return (Mo.seat[id] || []).map(function (t) { return Mo.tb[t].map(function (x) { return x.replace(/^D|X$/g, ''); }).join(','); }); }

// ---- הכנה: מארח, ותיק שלמד מזמן, ושורת ישיבה ישנה (לפני השחרור) ----
var host = person('host'), vet = person('vet'), legacy = person('leg'), legH = person('legh');
learn(vet, -100);
at(-50);
var ST = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_);
c.chPut_(ST, { 'שולחן': 'S1', 'מזהה': legH, 'ישב': iso(-50), 'יצא': '', 'סיבה': 'פתח', 'בדיקה': '' });
c.chPut_(ST, { 'שולחן': 'S1', 'מזהה': legacy, 'ישב': iso(-50), 'יצא': '', 'סיבה': 'הוזמן', 'בדיקה': '' });
var hc = code(host);

// ---- 1. הצטרפו מהקישור — "בדרך אליך", בלי כיסא ----
var a = person('a', host, 1), b = person('b', host, 1.1), cc = person('c', host, 1.2), d = person('d', host, 1.3), e = person('e', host, 1.4);
var M1 = sync(2);
ok(!M1.seat[a] && !M1.seat[host], 'no seat before finishing', M1.seat);
var mh = my(M1, host).me;
ok(mh && mh.way.length === 5 && mh.ts.length === 0, 'host sees 5 on the way, no tables', mh);
var ma = my(M1, a).me;
ok(ma.pend && ma.pend.by === 'host' && ma.pend.t && ma.pend.t.seats.length === 1, 'invitee pending at host', ma.pend);

// ---- 2. מירוץ: 3 המסיימים הראשונים בשולחן 1 ----
learn(b, 3); learn(d, 3.5); learn(a, 4); learn(e, 4.5);
var M2 = sync(5);
ok(JSON.stringify(tbl(M2, host)) === JSON.stringify(['host,b,d,a', 'host,e']), 'race fills table 1 then 2', tbl(M2, host));
mh = my(M2, host).me;
ok(mh.ts.length === 2 && mh.ts[0].mine && mh.way.length === 1 && mh.way[0].n === 'c', 'host: 2 tables, c on the way', mh);
ok(mh.t && mh.t.id === mh.ts[1].id, 'main table = the one still filling', mh.t);
ok(M2.own[M2.seat[host][0]] === host, 'host owns table', M2.own);

// ---- 3. סביב השעון: חישוב חוזר אינו מזיז איש ----
var M3 = sync(5.5);
ok(JSON.stringify(tbl(M3, host)) === JSON.stringify(tbl(M2, host)), 'stable on rebuild');

// ---- 4. תקרה: 3 שולחנות למארח, אחר כך "אין מקום" ----
var more = [];
for (var i = 0; i < 7; i++) more.push(person('m' + i, host, 6 + i * 0.01));
learn(cc, 7);                                         // שולחן 2: host,e,c
more.forEach(function (x, k) { learn(x, 8 + k * 0.1); });
var M4 = sync(10);
var t4 = tbl(M4, host);
ok(t4.length === 3 && t4[1] === 'host,e,c,m0' && t4[2] === 'host,m1,m2,m3', 'cap 3 tables', t4);
['m4', 'm5', 'm6'].forEach(function (nm) {
  var id = 'D' + nm + 'X', mm = my(M4, id).me;
  ok(!M4.seat[id] && mm.nr === 1 && !mm.pend, 'no room → nr for ' + nm, mm);
});
var y = person('y'), yc = code(y);
ok(my(M4, host, hc).ref === 'self', 'own link = self');
ok(c.chFull_(M4, host) === true, 'host full');

// ---- 5. אורח שפותח שולחנות משלו: התקרה כוללת את השולחן אצל החבר ----
var bc = code(b);
var b1 = person('b1', b, 11), b2 = person('b2', b, 11), b3 = person('b3', b, 11), b4 = person('b4', b, 11), b5 = person('b5', b, 11);
var b6 = person('b6', b, 11), b7 = person('b7', b, 11);
[b1, b2, b3, b4, b5, b6, b7].forEach(function (x, k) { learn(x, 12 + k * 0.1); });
var M5 = sync(14);
var t5 = tbl(M5, b);
ok(t5.length === 3 && t5[0] === 'host,b,d,a' && t5[1] === 'b,b1,b2,b3' && t5[2] === 'b,b4,b5,b6', 'guest + 2 own tables', t5);
ok(my(M5, b7).me.nr === 1, 'b7 no room (b has 3)');

// ---- 6. הוזמן מכמה חברים: בחירה — הראשונה קובעת ----
var z = person('z', y, 15);                            // נרשם דרך y
var M6 = sync(15.2);
ok(my(M6, z, hc).ref === 'full', 'host full → full state for z');
var w2 = person('w2'), wc = code(w2);
var M6b = sync(15.3);
var r6 = my(M6b, z, wc);
ok(r6.ref === 'old' && r6.refT && r6.refT.name === 'w2', 'z offered to sit at w2 (another host)', r6);
at(15.4); exec();
var s6 = c.chSit_({ id: z, ref: wc }, U);
ok(s6.ref === 'ok' && s6.me.pend && s6.me.pend.by === 'w2' && s6.me.pend.ch === 1, 'choice w2 recorded', s6.me && s6.me.pend);
at(15.5); exec();
var s6b = c.chSit_({ id: z, ref: yc }, U);
ok(s6b.ref === 'pend', 'second click → already chose', s6b.ref);
learn(z, 16);
var M7 = sync(16.5);
ok(JSON.stringify(tbl(M7, z)) === JSON.stringify(['w2,z']), 'z seated at chosen host', tbl(M7, z));
ok((my(M7, y).me.way || []).length === 0, 'y no longer sees z on the way');

// ---- 7. שני מארחים בלי בחירה — מסך הבחירה, והקודים ----
var q = person('q', y, 17);
at(17.1); exec(); c.chOldAdd_(wc, q, false);
var M8 = sync(17.2);
var mq = my(M8, q).me;
ok(mq.pend && mq.pend.hs.length === 2 && !mq.pend.ch && mq.pend.hs.every(function (h) { return h.c; }), 'two hosts, codes for chooser', mq.pend);
ok(my(M8, y).me.way.some(function (x) { return x.n === 'q'; }) && my(M8, w2).me.way.some(function (x) { return x.n === 'q'; }), 'both hosts see q on the way');

// ---- 8. ותיק שלמד מזמן — יושב מיד כשמבקש לשבת ----
var M9 = sync(18); at(18.1); exec();
var s8 = c.chSit_({ id: vet, ref: yc }, U);
ok(s8.ref === 'ok', 'vet sit ok', s8.ref);
var M10 = sync(18.2);
ok(JSON.stringify(tbl(M10, vet)) === JSON.stringify(['y,vet']), 'vet seated immediately (learned before)', tbl(M10, vet));

// ---- 9. יום ראשון: הגרלה, ואין יציאות ----
learn(host, 19);
var before = JSON.stringify([tbl(M10, legacy), tbl(M10, a)]);
var M11 = sync(6 * 24);                                // אחרי יום ראשון 08:00
ok(JSON.stringify([tbl(M11, legacy), tbl(M11, a)]) === before, 'no exits on Sunday (legacy unlearned stays)', [tbl(M11, legacy), tbl(M11, a)]);
var wk = M11.ms.filter(function (m) { return m.date; });
ok(wk.length === 1 && wk[0].el.length >= 2, 'weekly draw with locked tables', wk);
// כל קבוצה — כל אחד פעם אחת, ולכל היותר 3 קבוצות לאדם בהגרלה
var per = {};
M11.grp.forEach(function (g) { var s = {}; [g.by].concat(g.f).forEach(function (x) { ok(!s[x], 'once per group'); s[x] = 1; per[x] = (per[x] || 0) + 1; }); });
ok(Object.keys(per).every(function (x) { return per[x] <= 3; }), 'max 3 groups per person', per);

// ---- 10. דף שני (שתי שורות) אינו תופס כיסא שני ----
ok((M11.seat[a] || []).length === 1, 'a still one table');

console.log('checks', n, 'fails', fails);
var miss = Object.keys(M.missing).filter(function (k) { return !/flush|Logger/.test(k); });
if (miss.length) console.log('missing', miss.join(','));
// לגשר מ-Playwright (scratchpad): העולם אחרי כל התרחישים.
if (require.main === module) process.exit(fails ? 1 : 0);
else module.exports = { W: W, c: c, at: at, exec: exec, fails: fails };
