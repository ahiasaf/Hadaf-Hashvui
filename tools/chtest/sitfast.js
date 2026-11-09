// חבר מביא חבר — ישיבה בחישוב אחד, והמטמון מתעדכן אחרי שינוי (SCRIPT 206).
// node tools/chtest/sitfast.js → קוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
// "במקביל": הנעילה מסדרת את הבקשות בתור, ולכן המקרה הגרוע הוא בקשה שנייה שקוראת מטמון
// ישן (מלפני הראשונה). כאן מחזירים בכוונה את המטמון הישן לפני הבקשה השנייה.
var Mk = require('../snaptest/mock.js'), vm = require('vm');
var W = Mk.makeWorld(), c = W.ctx;
vm.runInContext("var CLOCK={t:0};var RealDate_=Date;Date=function(a,b,cc,d,e,f,g){var n=arguments.length;" +
  "if(!(this instanceof Date))return new RealDate_(CLOCK.t).toString();if(!n)return new RealDate_(CLOCK.t);" +
  "if(n===1)return new RealDate_(a);return new RealDate_(a,b,cc||1,d||0,e||0,f||0,g||0);};" +
  "Date.prototype=RealDate_.prototype;Date.now=function(){return CLOCK.t};Date.parse=RealDate_.parse;Date.UTC=RealDate_.UTC;", c);
var H = 3600e3, T0 = Date.parse('2026-11-02T10:00:00Z');
function at(h) { c.CLOCK.t = T0 + h * H; }
function iso(h) { return new Date(T0 + h * H).toISOString(); }
// בקשה חדשה — מאפסים את הזיכרון של הבקשה, **לא** את המטמון.
function req() { c.LRN_ROWS_ = null; c.SS_OPEN_ = {}; c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.RAF_D_ = null; c.RAF_DH_ = {}; }
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
var fails = 0, n = 0;
function ok(cond, label, extra) { n++; if (!cond) { fails++; console.log('FAIL', label, extra === undefined ? '' : JSON.stringify(extra)); } }
// כמה פעמים נבנה המודל
var SY = 0, sync0 = c.chSync_;
c.chSync_ = function (u) { SY++; return sync0(u); };
function sit(id, cd, h) { at(h); req(); return c.chSit_({ id: id, ref: cd }, U); }
function model(h) { at(h); req(); return c.chModel_(U, false); }
function snap() { return JSON.parse(JSON.stringify(W.cache.m)); }
function restore(s) { W.cache.m = JSON.parse(JSON.stringify(s)); }
function seatsOf(Mo, id) { return Mo.seat[id] || []; }
function check4(Mo, label) {
  var bad = Object.keys(Mo.tb).filter(function (t) {
    var L = Mo.tb[t], u = {};
    L.forEach(function (x) { u[x] = 1; });
    return L.length > 4 || Object.keys(u).length !== L.length;
  });
  ok(!bad.length, label + ': אין שולחן מעל 4 ואין כפילות', bad.map(function (t) { return [t, Mo.tb[t]]; }));
}

// ---- הכנה: מארח עם שלושה שולחנות; בשלישי מקום אחד ----
var host = person('host'), hc = c.chRefNew_(host, false);
var g = [];
for (var i = 0; i < 8; i++) g.push(person('g' + i, host, 1 + i * 0.01));
var x = person('x', host, 1.5), y = person('y', host, 1.5);
g.forEach(function (id, k) { sit(id, hc, 2 + k * 0.01); });
SY = 0;
var M0 = model(3);
ok(SY === 0, 'אחרי ישיבה — המודל כבר במטמון, בלי בנייה', SY);
ok(seatsOf(M0, host).length === 3, 'מארח בשלושה שולחנות', seatsOf(M0, host));
var t3 = seatsOf(M0, host)[2];
ok(M0.tb[t3].length === 3, 'בשולחן השלישי מקום אחד', M0.tb[t3]);
var stale = snap();

// ---- 1. ישיבה: חישוב אחד, והמטמון מחזיק את התוצאה ----
SY = 0;
var rx = sit(x, hc, 4);
ok(SY === 1, 'ישיבה עם מטמון טרי — בנייה אחת (היה 2)', SY);
ok(rx.ref === 'ok' && seatsOf(c.chModelHit_(c.chCache_(), 'chal:r'), x).length === 1, 'x יושב, והמטמון כבר כולל אותו', rx.ref);
SY = 0;
var M1 = model(4.01);
ok(SY === 0 && M1.tb[t3].length === 4, 'הבקשה הבאה — מהמטמון, בלי בנייה, עם x', [SY, M1.tb[t3]]);

// ---- 2. בקשה שנייה "במקביל" עם המטמון הישן (מלפני x): אותו כיסא לא נתפס פעמיים ----
restore(stale);
SY = 0;
var ry = sit(y, hc, 4.02);
ok(SY === 1, 'y עבר במסלול המהיר (המטמון הישן אמר "מוזמן לשבת")', SY);
var M2 = c.chSync_(U); SY--;
ok(seatsOf(M2, y).length === 0, 'y לא קיבל את הכיסא של x (השולחנות של המארח מלאים, כבר 3)', M2.tb);
ok(M2.tb[t3].length === 4 && M2.tb[t3].indexOf(x) >= 0, 'x נשאר בכיסא', M2.tb[t3]);
ok(ry.me && ry.me.nr, 'y רואה "אין מקום" — כמו כשנתפס רגע לפני', ry.me);
check4(M2, 'אחרי שתי הבחירות');
var hd = c.chModelHit_(c.chCache_(), 'chal:r');
ok(hd && hd.tb[t3].length === 4 && !seatsOf(hd, y).length, 'המטמון אחרי y — המצב העדכני, לא הישן', hd && hd.tb[t3]);

// ---- 3. לחיצה כפולה עם מטמון ישן: בלי שורה נוספת ----
restore(stale);
var nOld = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length;
var rx2 = sit(x, hc, 4.03);
var nNew = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length;
ok(rx2.ref === 'ok' && nNew === nOld, 'x לוחץ שוב — יושב כמו קודם, בלי שורה בשולחנות', [rx2.ref, nOld, nNew]);
check4(c.chSync_(U), 'אחרי לחיצה כפולה'); SY--;

// ---- 4. תקרת 3 לאורח, עם מטמון ישן ----
var h2 = person('hb'), h3 = person('hc'), h4 = person('hd');
var z = person('z');
var codes = [h2, h3, h4].map(function (h) { return c.chRefNew_(h, false); });
// z מוזמן על ידי שלושתם (ותיק רשום) — יושב אצל שניים
sit(z, codes[0], 6); sit(z, codes[1], 6.1);
var stale2 = snap();
sit(z, codes[2], 6.2);   // שלישי — עכשיו 3
var hosts4 = person('he'), c4 = c.chRefNew_(hosts4, false);
restore(stale2);         // מטמון שבו ל-z רק 2
SY = 0;
var rz = sit(z, c4, 6.3);
ok(SY === 1, 'z עבר במסלול המהיר עם מטמון ישן', SY);
var Mz = c.chSync_(U); SY--;
ok(seatsOf(Mz, z).length === 3, 'תקרת 3 נשמרת גם כשהמטמון ישן', seatsOf(Mz, z));
check4(Mz, 'אחרי תקרה');

// ---- 5. "+" ו"לא, תודה" — בנייה אחת עם מטמון, והמטמון מתעדכן ----
model(7);
SY = 0;
var rn = (at(7.1), req(), c.chNewT_({ id: hosts4 }, U));
ok(SY === 1, '"+" עם מטמון טרי — בנייה אחת', SY);
var hn = c.chModelHit_(c.chCache_(), 'chal:r');
ok(hn && seatsOf(hn, hosts4).length === 1, 'אחרי "+" — השולחן החדש במטמון', hn && seatsOf(hn, hosts4));
var w = person('w', host, 7.2), wc = c.chRefNew_(hosts4, false);
W.cache.m = {}; model(7.3);
SY = 0;
at(7.4); req(); var rd = c.chDecl_({ id: w, ref: hc }, U);
ok(SY === 1, '"לא, תודה" עם מטמון טרי — בנייה אחת', SY);

// ---- 6. נחיתה: מהמטמון, גם כשהנעילה תפוסה ----
model(8);
var hold = W.busy; W.busy = { script: true, doc: false, user: false };
SY = 0;
at(8.1); req(); var ld = c.chLand_({ ref: hc });
ok(SY === 0 && ld.on && ld.full === 1, 'נחיתה — מהמטמון, בלי בנייה ובלי לחכות לנעילה; "מלא" נכון', [SY, ld]);
W.busy = hold;

// ---- 7. בלי מטמון — כמו קודם (שתי בניות) ----
var v = person('v', h2, 9), h2c = c.chRefNew_(h2, false);
W.cache.m = {};
SY = 0;
var rv = sit(v, h2c, 9.1);
ok(SY === 2 && rv.ref === 'ok', 'בלי מטמון — ההכרעה על בנייה עדכנית, ואז הבחירה', [SY, rv.ref]);

console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
