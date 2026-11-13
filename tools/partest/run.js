// מעקב הורים וכרטיס אבא אוטומטי (8.99.512) — מול apps-script.gs עצמו בזיכרון.
// node tools/partest/run.js  → קוד 1 אם בדיקה נכשלה. מזהים, שמות וטלפונים מומצאים (קידומת 000).
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var fired = [];
c.ghFire_ = function (t, b, a1, a2, a3, a4, url, role, a5, flt) { fired.push({ t: t, b: b, url: url, flt: JSON.parse(flt) }); return { status: 'ok' }; };
var W0 = c.progWeek_(), DAF = c.rafDafOfW_('taanit', W0);
function join(id, role, first, ph, other, otherName, inst) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', first], ['משפחה', 'מ'], ['קוד ישיבה', inst || 'givat'], ['ישיבה', 'גבעת שמואל'],
    ['תפקיד', role], ['טלפון', ph], ['טלפון ההורה', other], ['שם ההורה', otherName]]);
}
function learn(id, daf, tr) {
  c.appendCols_('לימוד', [['מזהה', id], ['מסלול', tr || 'taanit'], ['שבוע', W0], ['דף', daf], ['קטע', 5], ['מתוך', 5]]);
}
function rows(tab) { var sh = c.sheet_(tab); return sh.getLastRow() > 1 ? sh.getDataRange().getDisplayValues() : []; }
function pairRows() { var v = rows('זוגות'); return v.length ? v.slice(1).map(function (r) { var o = {}; v[0].forEach(function (h, i) { o[h] = r[i]; }); return o; }) : []; }
function hist(id, k) { return c.pairHist_({ pairHist: id, k: JSON.stringify(k) }); }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
function boardOf(id) {
  exec();
  var code = c.getCode_('givat'); if (!code) { c.ensureCode_('givat', 'zz'); code = c.getCode_('givat'); }
  var b = c.boardData_('givat', code); return (b.students || []).filter(function (p) { return p.id === id; })[0]; }

// א: הורה ובן — שניהם למדו את הדף השלם. ב: רק ההורה למד. ג: רק הבן. ד: הבן בלי טלפון. ה: הורה לא מחובר.
join('KA', 'תלמיד', 'אבי', '0001000001', '0002000001', 'משה');
join('DA', 'הורה', 'משה', '0002000001', '0001000001', 'אבי');
join('KB', 'תלמיד', 'בני', '0001000002', '0002000002', 'יוסף');
join('DB', 'הורה', 'יוסף', '0002000002', '0001000002', 'בני');
join('KC', 'תלמיד', 'גדי', '0001000003', '0002000003', 'דוד');
join('DC', 'הורה', 'דוד', '0002000003', '0001000003', 'גדי');
join('KD', 'תלמיד', 'דני', '', '0002000004', 'חיים');
join('DD', 'הורה', 'חיים', '0002000004', '', '');
join('DE', 'הורה', 'אלי', '0002000005', '0001009999', 'נועם');
learn('KA', DAF + '.'); learn('KA', DAF + ':'); learn('DA', DAF + '.'); learn('DA', DAF + ':');
learn('DB', DAF + '.'); learn('DB', DAF + ':'); learn('KB', DAF + '.');          // הבן רק עמוד אחד
learn('KC', DAF + '.'); learn('KC', DAF + ':');
learn('KD', DAF + '.'); learn('KD', DAF + ':'); learn('DD', DAF + '.'); learn('DD', DAF + ':');

ok(!!DAF, 'week daf exists', DAF);
// הלוח לפני — אין "עם אבא"
ok(!(boardOf('KA') || {}).fw, 'board: no fw before', boardOf('KA'));
// הבית של ההורה א — הכרטיס ניתן לבד, וההודעה
var H = hist('DA', [['0001000001', 'אבי']]);
var pr = pairRows();
ok(pr.length === 1 && pr[0]['מזהה'] === 'DA' && pr[0]['דיווח'] === 'ההורה' && pr[0]['אושר'] === 'כן' && pr[0]['אוטומטי'] === 'כן' &&
   pr[0]['שבוע'] === String(W0) && pr[0]['בלי התראה'] === 'כן', 'auto row written for A', pr);
ok(H.kids[0].a.length === 1 && H.kids[0].a[0] === 'taanit|' + W0, 'pairHist a: auto tag', H.kids[0]);
ok(H.kids[0].g.some(function (x) { return x[0] === 'taanit|' + W0 && x[1] === 1; }), 'pairHist g: given ✓', H.kids[0].g);
// הכרטיסים של הבן — כרטיס אבא, בהגרלה על הדף הזה (rafCalcW_ — כמו כשהשבוע יעבור)
exec();
var R = c.rafCalcW_(W0);
ok(R.done.KA && R.done.KA.f === 1 && R.done.KA.l === 1, 'raffle of this daf: KA has father ticket', R.done.KA);
ok(!R.done.KB || !R.done.KB.f, 'KB (one page) no father ticket', R.done.KB);
// שוב — בלי שורה שנייה
c.CacheService.getScriptCache().remove('pau:DA');
hist('DA', [['0001000001', 'אבי']]);
ok(pairRows().length === 1, 'no duplicate on second open');
// כל השאר — הטריגר השעתי
var nAuto = c.pairAuto_();
pr = pairRows();
ok(nAuto === 0 && pr.length === 1, 'B (kid one page), C (parent did not learn), D (kid no phone), E — nothing', pr.length);
// הלוח — "עם אבא" לבן א בלבד
c.CacheService.getScriptCache().remove('pf:ok');
var bA = boardOf('KA'), bC = boardOf('KC');
ok(bA && bA.fw && bA.fw.indexOf(W0) >= 0, 'board: KA fw has week', bA && bA.fw);
ok(bC && !bC.fw, 'board: KC no fw', bC && bC.fw);
// הבן ב משלים את העמוד השני — הכרטיס ניתן בסבב הבא
learn('KB', DAF + ':');
ok(c.pairAuto_() === 1 && pairRows().length === 2 && pairRows()[1]['מזהה'] === 'DB', 'B auto after kid completes');
// בקשה ממתינה של הבן ג — ההורה למד → ניתן, והבקשה מאושרת
c.appendCols_('זוגות', [['מזהה', 'KC'], ['מסלול', 'taanit'], ['שבוע', W0], ['דף', DAF], ['דיווח', 'הבן'], ['אושר', ''],
  ['טלפון השותף', '0002000003'], ['שם השותף', 'דוד']]);
learn('DC', DAF + '.'); learn('DC', DAF + ':');
ok(c.pairAuto_() === 1, 'C auto');
pr = pairRows();
ok(pr.filter(function (r) { return r['מזהה'] === 'KC'; })[0]['אושר'] === 'כן', 'pending request of C approved', pr);
// הורה אחר כבר נתן — לא כותבים
ok(c.pairAuto_() === 0, 'idempotent');
// שבוע שההגרלה שלו נערכה — לא
// הרשימה בניהול
var L = c.parList_();
var row = function (nm) { return L.L.filter(function (x) { return x[0] === nm + ' מ'; })[0]; };
ok(L.status === 'ok' && L.w === W0 && L.L.length === 5, 'list: 5 parents', L.L.length);
ok(row('משה')[4] === 1 && row('משה')[7][0][1] === 1 && row('משה')[7][0][3] === 1 && row('משה')[6] === 1, 'list: A learned, kid got, kid learned, 1 given', row('משה'));
ok(row('חיים')[4] === 1 && row('חיים')[7].length === 0 || row('חיים')[7][0][1] === 0, 'list: D learned, kid no ticket', row('חיים'));
ok(row('אלי')[7].length === 0 && row('אלי')[8] === 'נועם', 'list: E not linked, declared name', row('אלי'));
ok(row('משה')[1] === '0002000001', 'list: phone for whatsapp');
// התראה — למי שלמד ולא נתן: רק D (אם מחובר) — וכל השאר כבר קיבלו
var r = c.parLpush_({ title: 'ט', body: 'ב', to: 'ל' });
var dd = row('חיים');
if (dd[7].length) ok(r.status === 'ok' && r.n === 1 && fired[0].flt.ids.indexOf('DD') >= 0 && fired[0].url === 'join', 'lpush: only D', r);
else ok(r.status === 'empty', 'lpush: empty when D not linked', r);
ok(c.parLpush_({ title: 'ט', body: '' }).status === 'error', 'lpush: empty body rejected');
// הנתיב — רק עם סיסמה
var Rt = JSON.parse(c.doGet({ parameter: { parstat: 'list' } }).t || c.doGet({ parameter: { parstat: 'list' } }).getContent());
ok(Rt.status === 'denied', 'list denied without key', Rt);
ok(r.status === 'ok' ? r.n === 1 : r.status === 'empty', 'lpush result', r);
// השבוע שעבר — עד ההגרלה שלו כן, אחריה לא
var DP = c.rafDafOfW_('taanit', W0 - 1);
join('KF', 'תלמיד', 'פנחס', '0001000006', '0002000006', 'פרץ');
join('DF', 'הורה', 'פרץ', '0002000006', '0001000006', 'פנחס');
learn('KF', DP + '.'); learn('KF', DP + ':'); learn('DF', DP + '.'); learn('DF', DP + ':');
c.appendCols_('הגרלות', [['מזהה הגרלה', 'R' + W0 + '-aaaa'], ['שבוע', W0], ['מועד חיתוך', new Date().toISOString()], ['מוסדות', 'givat'],
  ['קוד ישיבה', 'givat'], ['ישיבה', 'גבעת שמואל'], ['זכאים', 4], ['זוכה', 'KA'], ['מזהי הזוכה', 'KA'], ['שם הזוכה', 'אבי מ'],
  ['סטטוס', 'פורסם'], ['פורסם', new Date().toISOString()]]);
ok(c.pairAuto_() === 0, 'last week already drawn — no auto');
c.sheet_('הגרלות').d.splice(1);
ok(c.pairAuto_() === 1 && pairRows().slice(-1)[0]['שבוע'] === String(W0 - 1), 'last week not drawn yet — auto');
console.log(n + ' בדיקות, ' + fails + ' נכשלו');
process.exit(fails ? 1 : 0);
