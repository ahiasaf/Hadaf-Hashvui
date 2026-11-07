// ניקוי הבדיקה (chTestClean1106Check) — קריאה בלבד, מול apps-script.gs עצמו בזיכרון.
// node tools/chtest/tcclean.js   → יוצא בקוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
// כל עולם "קפוא": כל כתיבה (גיליון, לשונית, כותרת, מאפיין, מטמון) זורקת ונספרת,
// והמצב כולו מושווה לפני ואחרי. בסוף — Go בעולם נפרד, רק כדי לוודא שהתוכנית שבדוח זהה.
var MK = require('../snaptest/mock.js');
var fails = 0, n = 0;
function ok(cond, label, extra) { n++; if (!cond) { fails++; console.log('FAIL', label, extra === undefined ? '' : extra); } }

var JH = ['מזהה', 'מזהים נוספים', 'שם', 'משפחה', 'טלפון', 'תפקיד', 'בדיקה', 'קוד ישיבה', 'ישיבה', 'שכבה', 'כיתה', 'מזמין באתגר'];
function build(opt) {
  opt = opt || {};
  var W = MK.makeWorld(), c = W.ctx;
  var put = function (tab, rows) {
    var ss = c.privId_(tab) ? W.priv : W.pub, sh = ss.insertSheet(tab);
    rows.forEach(function (r) { sh.d.push(r.slice()); });
    return sh;
  };
  var jr = [JH,
    ['DA1', 'DA2', 'רכז', 'בדיקה', '0501110000', 'תלמיד', '', 'givat', 'י', '', '', ''],
    ['DP1', '', 'פיטר', 'אחד', '0501110000', 'תלמיד', '', 'givat', 'י', 'יב', '8', ''],
    ['DP2', '', 'פיטר', 'אחר', '0502220000', 'תלמיד', '', 'other', 'א', 'ט', '1', ''],
    ['DY1', '', 'כיתה', 'שמונה', '0503330000', 'תלמיד', '', 'givat', 'י', 'י״ב', '8', 'DA1'],
    ['DY2', '', 'כיתה', 'אחרת', '0504440000', 'תלמיד', '', 'other', 'א', 'יב', '8', ''],
    ['DO1', '', 'חבר', 'אמיתי', '0505550000', 'תלמיד', '', 'givat', 'י', 'ח', '2', ''],
    ['DPAR', '', 'פיטר', 'הורה', '0506660000', 'הורה', '', 'givat', 'י', 'יב', '8', '']];
  if (!opt.noJoinCol) put('לומדים', jr);
  else put('לומדים', jr.map(function (r) { return r.filter(function (x, i) { return JH[i] !== opt.noJoinCol; }); }));
  put(c.CH_SET_, [['שדה', 'ערך'], ['פעיל', 'כן'], ['מפעיל', 'DA2'], [c.CH_TP_ + 'מפעיל', 'DX9']]);
  var seatH = ['שולחן', 'מזהה', 'ישב', 'יצא', 'סיבה', 'בדיקה', 'מזמין'];
  var seats = [seatH,
    ['T1', 'DA1', '2026-11-02T10:00:00.000Z', '', 'פתח', '', ''],
    ['T1', 'DP1', '2026-11-02T11:00:00.000Z', '', 'הוזמן', '', 'DA1'],
    ['T2', 'DA1', '2026-11-03T10:00:00.000Z', '', 'פתח', '', ''],
    ['T2', 'DO1', '2026-11-03T11:00:00.000Z', '', 'הוזמן', '', 'DA1'],
    ['T9', 'DP2', '2026-11-03T11:00:00.000Z', '', 'פתח', '', '']];
  if (opt.noSeatCol) seats = seats.map(function (r) { return r.filter(function (x, i) { return seatH[i] !== opt.noSeatCol; }); });
  if (opt.unmoved) {
    W.pub.insertSheet(c.CH_SEAT_).d = seats.map(function (r) { return r.slice(); });
  } else {
    put(c.CH_SEAT_, seats);
    W.props[c.CH_SEAT_MV_] = '2026-11-01T00:00:00.000Z · 5 שורות';
  }
  put(c.CH_OLD_, [['מזהה', 'מזמין', 'נוסף', 'מצב', 'בדיקה', 'כלל'], ['DY1', 'DA1', '2026-11-02', 'בחר', '', '0']]);
  put(c.CH_REF_, [['קוד', 'מזהה', 'נוצר', 'בדיקה'], ['k1', 'DA1', '2026-11-01', ''], ['k2', 'DP1', '2026-11-01', '']]);
  put(c.CH_GRP_, [c.CH_GRP_COLS_.slice()]);
  var lh = ['מזהה', 'קוד ישיבה', 'מסלול', 'שבוע', 'דף'];
  put('לימוד', [lh, ['DP1', 'givat', 'taanit', '4', 'ד.'], ['DY1', 'givat', 'taanit', '4', 'ד.'], ['DY1', 'givat', 'taanit', '4', 'ד:'], ['DO1', 'givat', 'taanit', '4', 'ד.']]);
  if (opt.noTab !== 'חידות') put('חידות', [['מזהה', 'דף', 'ציון'], ['DP1', 'ד', '80']]);
  put('זוגות', [['מזהה', 'בן']]);
  put('הגרלות', [['דף', 'זוכה'], ['ג', 'DO1']]);
  return W;
}

// כל כתיבה — חריגה, ונספרת. מה שאינו מוגדר במדמה ומוחזר כשרשור (setFontColor וכו') — גם.
function freeze(W) {
  var c = W.ctx, hits = [], deny = function (what) { return function () { hits.push(what); throw new Error('כתיבה נחסמה: ' + what); }; };
  var sh0 = W.pub.insertSheet('__probe'), rg0 = sh0.getRange(1, 1);
  delete W.pub.tabs.__probe;
  var SP = Object.getPrototypeOf(sh0);
  ['appendRow', 'deleteRow', 'deleteRows', 'insertRowsAfter', 'insertColumnsAfter', 'clear', 'clearContents',
   'setFrozenRows', 'hideSheet', 'showSheet', 'setName'].forEach(function (k) { SP[k] = deny('Sheet.' + k); });
  // getRange מחזיר Proxy; הטווח עצמו — בתוך getRange. מכסים דרך getRange.
  var gr = SP.getRange, dr = SP.getDataRange;
  var wrapR = function (r) {
    return new Proxy(r, { get: function (t, k) {
      if (typeof k === 'string' && /^(set|clear|insert|delete|merge|copy|move|sort|protect|remove|apply)/.test(k)) return deny('Range.' + k);
      return t[k];
    } });
  };
  SP.getRange = function () { return wrapR(gr.apply(this, arguments)); };
  SP.getDataRange = function () { return wrapR(dr.apply(this, arguments)); };
  [W.pub, W.priv].forEach(function (ss) { ss.insertSheet = deny('insertSheet'); ss.deleteSheet = deny('deleteSheet'); });
  var P = c.PropertiesService.getScriptProperties();
  ['setProperty', 'deleteProperty', 'setProperties', 'deleteAllProperties'].forEach(function (k) { P[k] = deny('Props.' + k); });
  ['put', 'putAll', 'remove', 'removeAll'].forEach(function (k) { W.CacheObj[k] = deny('Cache.' + k); });
  c.SpreadsheetApp.flush = deny('flush');
  return hits;
}
function snap(W) {
  var t = function (ss) { var o = {}; Object.keys(ss.tabs).sort().forEach(function (k) { o[k] = ss.tabs[k].d; }); return o; };
  return JSON.stringify({ pub: t(W.pub), priv: t(W.priv), props: W.props, cache: W.cache.m });
}
function check(opt) {
  var W = build(opt), before = snap(W), hits = freeze(W);
  W.ctx.SS_OPEN_ = {};
  var rep = W.ctx.chTestClean1106Check();
  return { rep: rep, hits: hits, same: snap(W) === before, W: W };
}

// ---- Go (עולם נפרד, לא קפוא) — מורץ ראשון; ההשוואה לדוח בסוף ----
var G = build(); G.ctx.SS_OPEN_ = {};
var lines = function (s) { return s.split('\n').filter(function (l) { return /^(יימחק|יימחקו|כיסאות שייסגרו|שולחן )/.test(l); }).join('\n'); };
var gr = G.ctx.chTestClean1106Go();   // לפני ההקפאות: freeze משנה את אב-הטיפוס המשותף של המדמה


// ---- 1. מבנה תקין: דוח מלא, בלי אף ניסיון כתיבה ----
var A = check();
ok(A.hits.length === 0, 'full: no write attempted', A.hits.join(','));
ok(A.same, 'full: world unchanged');
ok(/אחיאסף: DA1/.test(A.rep), 'full: owner resolved via alias in מפעיל', A.rep);
ok(/פיטר הקשורים לאחיאסף: DP1 /.test(A.rep), 'full: linked peter = DP1 only', A.rep);
ok(/פיטר שאינו קשור .*DP2/.test(A.rep), 'full: unrelated peter reported, untouched');
ok(/יב8 בישיבה אחרת — לא נוגעים: DY2/.test(A.rep), 'full: yb8 in other inst untouched');
ok(/יימחק כמשתמש בדיקה: DP1/.test(A.rep) && /יימחק כמשתמש בדיקה: DY1/.test(A.rep), 'full: delete list DP1, DY1');
ok(!/יימחק כמשתמש בדיקה: (DA1|DO1|DP2|DY2|DPAR)/.test(A.rep), 'full: protected/others not on delete list');
ok(/מזהים: DP1/.test(A.rep), 'full: ids listed per account');
ok(/שולחן T2: .*יושבים אחרים נשארים: DO1.*לכן גם אחיאסף נשאר/.test(A.rep), 'full: T2 keeps owner + other');
ok(/שולחן T1: .*השולחן מתרוקן/.test(A.rep), 'full: T1 empties');
ok(/כיסאות שייסגרו: 2/.test(A.rep), 'full: 2 seats to close', A.rep);
ok(/יימחקו ב"לימוד": 3 שורות/.test(A.rep) && /יימחקו ב"לומדים": 2 שורות/.test(A.rep), 'full: scope per tab');
ok(/בדיקה בלבד, לא נעשה דבר/.test(A.rep), 'full: ends as check-only');
ok(/"בחירת פרס" לא נמצאה/.test(A.rep), 'full: missing prize tab reported, not created');

// ---- 2. לשונית חסרה ----
var B = check({ noTab: 'חידות' });
ok(B.hits.length === 0 && B.same, 'missing tab: nothing written / created', B.hits.join(','));
ok(/לא נעשה דבר — הלשונית "חידות" חסרה/.test(B.rep) && !/בדיקה בלבד/.test(B.rep), 'missing tab: reported and stopped', B.rep);

// ---- 3. כותרת חסרה — בשולחנות ובלומדים ----
var C = check({ noSeatCol: 'מזמין' });
ok(C.hits.length === 0 && C.same, 'missing header (seats): no header written', C.hits.join(','));
ok(/חסרה כותרת: מזמין/.test(C.rep), 'missing header (seats): reported and stopped', C.rep);
var C2 = check({ noJoinCol: 'מזהים נוספים' });
ok(C2.hits.length === 0 && C2.same && /חסרה כותרת: מזהים נוספים/.test(C2.rep), 'missing header (join): reported and stopped', C2.rep);

// ---- 4. העברה שעוד לא בוצעה ----
var D = check({ unmoved: true });
ok(D.hits.length === 0 && D.same, 'unmoved: no move/delete/property', D.hits.join(','));
ok(/עדיין בגיליון הציבורי/.test(D.rep), 'unmoved: reported and stopped', D.rep);
ok(!!D.W.pub.tabs[D.W.ctx.CH_SEAT_] && !D.W.priv.tabs[D.W.ctx.CH_SEAT_], 'unmoved: seats still public, none created in private');

// ---- 5. ביקורת: הקריאות הישנות היו נתפסות כאן (המדמה באמת חוסם) ----
var E = build(); var eh = freeze(E);
try { E.ctx.SS_OPEN_ = {}; E.ctx.chTab_('לשונית חדשה', ['א']); } catch (e) {}
ok(eh.length > 0, 'control: chTab_ on a missing tab is blocked by the frozen world', eh.join(','));
var E2 = build({ unmoved: true }); var eh2 = freeze(E2);
try { E2.ctx.chSeatMove_(); } catch (e) {}
ok(eh2.length > 0, 'control: chSeatMove_ attempts writes', eh2.join(','));

// ---- 6. Go — אותה תוכנית כמו בדוח, והקוד שלו לא השתנה ----
ok(lines(gr) === lines(A.rep), 'go plan == check plan', '\n' + lines(gr) + '\n---\n' + lines(A.rep));
ok(/קריאה חוזרת: הכול כמתוכנן/.test(gr), 'go: re-read as planned', gr);

console.log(fails ? fails + '/' + n + ' FAILED' : 'OK ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
