// מי סימן בעמדה · כרטיס "לימוד בחבורה" מנוכחות (8.99.567) — מול apps-script.gs בזיכרון.
// node tools/amdatest/byfg.js → קוד 1 אם בדיקה נכשלה. שמות, מזהים וטלפונים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } else console.log('ok  ', l); }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; c.CacheService.getScriptCache().removeAll([]); }
/* ---------- חלק 1: מי סימן ---------- */
c.accGate_ = function (inst, dev) { return dev === 'DEV1' && inst === 'givat' ? null : { status: 'denied' }; };
c.amdaSyncLocked_ = function () { return 0; };
c.appendCols_('גישה', [['מזהה', 'DEV1'], ['שם', 'ישראל ישראלי'], ['תפקיד', 'רכז'], ['קוד ישיבה', 'givat'], ['מצב', 'אושר']]);
function cols(id, nm, by) {
  return [['מזהה', id], ['שבוע', 6], ['יום', '2026-11-22'], ['עמדה', 'בוקר'], ['קוד עמדה', 'S1'], ['סוג', 'דף'],
          ['מסלול', 'taanit'], ['דף', 'ו'], ['קוד ישיבה', 'givat'], ['שכבה', 'ז'], ['כיתה', '3'], ['שם', nm],
          ['מתי', '2026-11-22T12:32:00Z']].concat(by === undefined ? [] : [['מי סימן', by]]);
}
function tab() { return c.amdaTable_('עמדת לימוד'); }
function byOf(id) { var t = tab(), r = t.rows.filter(function (x) { return t.c(x, 'מזהה') === id; })[0]; return r ? t.c(r, 'מי סימן') : null; }
// שורה ישנה (לפני השינוי) — נכתבת ישירות, בלי העמודה
c.appendCols_('עמדת לימוד', [['מזהה', 'old1'], ['שם', 'ישן']]);
post({ action: 'amdarows', tab: 'עמדת לימוד', dev: 'DEV1', inst: 'givat', rows: JSON.stringify([cols('s1', 'א', 's|'), cols('s2', 'ב', 'u|'), cols('s3', 'ג', 's|שקר כלשהו')]) });
console.log('   s1 →', byOf('s1')); console.log('   s2 →', byOf('s2'));
ok(byOf('s1') === 'ישראל ישראלי · רכז · 22.11.2026 14:32', 'staff device: name+role+Israel time', byOf('s1'));
ok(byOf('s2') === 'ישראל ישראלי · רכז · 22.11.2026 14:32 · התלמיד סימן בעצמו', 'student self-mark on staff phone', byOf('s2'));
ok(byOf('s3').indexOf('שקר') < 0, 'client name ignored when device known', byOf('s3'));
post({ action: 'amdarows', tab: 'עמדת לימוד', key: 'k', rows: JSON.stringify([cols('k1', 'ד', 's|אחיאסף פנש'), cols('k2', 'ה', 's|')]) });
ok(byOf('k1') === 'אחיאסף פנש · ניהול · 22.11.2026 14:32', 'owner by key with name', byOf('k1'));
ok(byOf('k2') === 'ניהול התוכנית · 22.11.2026 14:32', 'owner by key without name', byOf('k2'));
// מכשיר ישן — בלי העמודה בכלל
post({ action: 'amdarows', tab: 'עמדת לימוד', dev: 'DEV1', inst: 'givat', rows: JSON.stringify([cols('o2', 'ו')]) });
ok(byOf('o2') === 'ישראל ישראלי · רכז · 22.11.2026 14:32', 'old app (no column) still named by server', byOf('o2'));
// מכשיר מאושר בלי שורה ב"גישה" → לא ידוע
c.accGate_ = function () { return null; };
post({ action: 'amdarows', tab: 'עמדת לימוד', dev: 'DEVX', inst: 'givat', rows: JSON.stringify([cols('x1', 'ז', 's|')]) });
ok(byOf('x1') === 'לא ידוע · 22.11.2026 14:32', 'unknown marker', byOf('x1'));
// השורה הבודדת (שרת ישן מהצד של המכשיר)
post({ action: 'row', tab: 'עמדת לימוד', dev: 'DEV1', inst: 'givat', cols: JSON.stringify(cols('r1', 'ח', 'u|')) });
ok(/^ישראל ישראלי · רכז · .* · התלמיד סימן בעצמו$/.test(byOf('r1')), 'single-row path', byOf('r1'));
ok(byOf('old1') === '', 'existing row untouched', byOf('old1'));

/* ---------- חלק 2: לימוד בחבורה מול אבא ---------- */
var W0 = c.progWeek_() - 1, DAF = c.rafDafOfW_('taanit', W0);
function join(id, role, first, ph, other) {
  c.appendCols_('לומדים', [['מזהה', id], ['שם', first], ['משפחה', 'מ'], ['קוד ישיבה', 'givat'], ['ישיבה', 'גבעת שמואל'],
    ['תפקיד', role], ['טלפון', ph], ['טלפון ההורה', other]]);
}
join('KA', 'תלמיד', 'אבי', '0001000001', '0002000001');   // נוכחות בלבד
join('KB', 'תלמיד', 'בני', '0001000002', '0002000002');   // נוכחות + אבא נתן
join('DB', 'הורה', 'יוסף', '0002000002', '0001000002');
join('KC', 'תלמיד', 'גדי', '0001000003', '0002000003');   // אבא בלבד
join('DC', 'הורה', 'דוד', '0002000003', '0001000003');
c.amdaQzRaw_ = function () { return [['KA', 'taanit', DAF, 0, ''], ['KB', 'taanit', DAF, 0, '']]; };
[['DB', '0001000002'], ['DC', '0001000003']].forEach(function (p) {
  c.appendCols_('זוגות', [['מזהה', p[0]], ['מסלול', 'taanit'], ['שבוע', W0 + 1], ['דף', DAF], ['דיווח', 'ההורה'], ['אושר', 'כן'],
    ['טלפון השותף', p[1]]]);
});
exec();
var C = c.rafCalc_();
ok(C.done.KA && C.done.KA.t === 3 && C.done.KB.t === 3 && C.done.KC.t === 3, 'counts unchanged (3 each)', [C.done.KA, C.done.KB, C.done.KC]);
function me(id) { exec(); return JSON.parse(c.doGet({ parameter: { pts: 'me', id: id } }).t); }
var lbl = function (tk) { return tk.fg && tk.fg >= tk.f ? 'לימוד בחבורה' : 'לימוד עם אבא'; };   // כמו join.html
['KA', 'KB', 'KC'].forEach(function (id) {
  var r = me(id), tk = r.nx || r.tk;
  console.log('   ' + id + ' בית התלמיד:', JSON.stringify({ l: tk.l, q: tk.q, f: tk.f, fg: tk.fg }), '→', lbl(tk));
  ok(tk.f === 1 && lbl(tk) === (id === 'KA' ? 'לימוד בחבורה' : 'לימוד עם אבא'), id + ' home label', tk);
});
// לוח הצוות — כמו tkBox ב-board.html
var code = c.getCode_('givat'); if (!code) { c.ensureCode_('givat', 'zz'); code = c.getCode_('givat'); }
exec();
var B = c.boardData_('givat', code), byId = {};
(B.students || []).forEach(function (p) { byId[p.id] = p; });
['KA', 'KB', 'KC'].forEach(function (id) {
  var k = (byId[id] || {}).tk || {}, L = [];
  if (k.f - (k.fg || 0) > 0) L.push('הענקה מאבא: ' + (k.f - (k.fg || 0)));
  if (k.fg) L.push('לימוד בחבורה: ' + k.fg);
  console.log('   ' + id + ' לוח הצוות:', L.join(' · '));
  ok(L.join() === (id === 'KA' ? 'לימוד בחבורה: 1' : 'הענקה מאבא: 1'), id + ' board label', k);
});
console.log(fails ? 'FAILED ' + fails + '/' + n : 'all ' + n + ' passed');
process.exit(fails ? 1 : 0);
