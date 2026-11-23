/* בדיקה: קטע שהגמרא שלו בסוף עמוד והחברותא בראש העמוד הבא (8.99.574).
   מריץ את הפונקציות האמיתיות של studio.html ב-vm, מול BOOK בזיכרון.
   node tools/studiotest/revjoin.js */
var fs = require('fs'), vm = require('vm'), path = require('path');
var ROOT = path.join(__dirname, '..', '..');
var html = fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8');
var NAMES = ['prevStep', 'canContinue', 'dafItemAt_', 'pageNext_', 'pagePrev_', 'ownTo_', 'cnHead_',
  'cnPend_', 'cnEmpty_', 'cnMark_', 'cnSync_', 'cnSyncDaf_', 'addWait_', 'cnJoinFirst_', 'crossDaf_',
  'joinedC_', 'joinHas_', 'setRootC_', 'unjoin_', 'addStep', 'lastChav', 'seal', 'pos', 'chavRange',
  'keyOfStep_', 'hiddenKeys', 'removeStep', 'revCont_', 'revRebuild_', 'stepParaTxt_', 'stepAtPara',
  'ensureIds_', 'studioTaken_', 'chavText', 'chavRich', 'runsText', 'runsHtml', 'mergeStep',
  'deleteStep', 'nextPageKey_', 'refreshHolders_', 'holds_', 'paraHtml_'];
function grab(name) {
  var re = new RegExp('\\nfunction ' + name.replace(/\$/g, '\\$') + '\\s*\\(');
  var m = re.exec(html);
  if (!m) throw new Error('missing ' + name);
  var i = m.index + 1, end = html.indexOf('\n}\n', i);
  return html.slice(i, end + 2);
}
var src = NAMES.map(grab).join('\n');
src = fs.readFileSync(path.join(ROOT, 'stepid.js'), 'utf8') + '\n' + src;

var ctx = { console: console, JSON: JSON, Math: Math, Date: Date, String: String, Object: Object };
ctx.window = ctx;
var SEL = { mas: 'taanit', daf: 1, src: '0', pg: 2 };
var DAFS = [['ו', 'ו'], ['ז', 'ז'], ['ח', 'ח'], ['ט', 'ט']];
var ELS = { daf: { _items: DAFS, get value() { return SEL.daf; } } };
ctx.document = { getElementById: function (id) { return ELS[id] || null; } };
ctx.selVal = function (id) {
  if (id === 'daf') return DAFS[SEL.daf][0];
  if (id === 'pg') return String(SEL.pg);
  return SEL[id];
};
var SAID = [];
ctx.say = function (t) { SAID.push(String(t)); };
ctx.esc = function (t) { return String(t); };
ctx.paintChav = ctx.markDraw = ctx.markPanel = ctx.stepsRefresh_ = ctx.splitCancel = function () {};
ctx.SureThen = function (go) { go(); };
ctx.studioContent_ = function () { return { then: function (f) { f({ read: true }); } }; };
vm.createContext(ctx);
vm.runInContext(src + '\nvar BOOK={},STEPS=[],PKEY="",DIRTY={},NEW_IDS={},CHV=null,GSEL=null,CSEL_P=null,' +
  'INSP=-1,USED_C=-1,USED_G=null,CONT_FIXED=false,SPL=null;' +
  'function touched(){ try{cnSyncDaf_();}catch(e){} DIRTY[PKEY]=1; BOOK[PKEY]=BOOK[PKEY]||{}; BOOK[PKEY].steps=STEPS; BOOK[PKEY].t=Date.now(); }', ctx);
function R(js) { return vm.runInContext(js, ctx); }

/* החברותא: פסקה לכל דף, עם טקסט מזהה */
function chv(daf, n) {
  var out = [];
  for (var i = 0; i < n; i++) out.push({ runs: [{ t: daf + '-p' + i, b: false }] });
  return out;
}
var FILES = { 'ו': chv('ו', 10), 'ז': chv('ז', 12), 'ח': chv('ח', 12), 'ט': chv('ט', 8) };
function go(daf, pg) {
  SEL.daf = DAFS.map(function (d) { return d[0]; }).indexOf(daf); SEL.pg = pg;
  ctx.__f = FILES[daf];
  R('PKEY = "taanit|' + daf + '|0|' + pg + '"; if (!BOOK[PKEY]) BOOK[PKEY] = { steps: [] };' +
    'STEPS = BOOK[PKEY].steps; CHV = __f; GSEL = null; CSEL_P = null; INSP = -1; CONT_FIXED = false; seal();');
}
function g(a, b) { R('GSEL = { a: { i: ' + a + ', x: 0 }, b: { i: ' + b + ', x: 1 } };'); }
function c(a, b) { R('CSEL_P = { a: ' + a + ', b: ' + b + ' };'); }
function steps(k) { return R('(BOOK["' + k + '"] || {}).steps || []'); }
var pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.log('✗ ' + msg); } }
function reload() {
  /* שמירה לגיליון וטעינה מחדש: JSON הלוך וחזור, BOOK חדש */
  var raw = JSON.stringify(R('BOOK'));
  R('BOOK = ' + raw + '; DIRTY = {};');
}
function flat(daf) {
  var recs = [];
  var B = R('BOOK');
  for (var k in B) {
    var a = k.split('|');
    recs.push({ mas: a[0], daf: a[1], src: a[2], pg: +a[3], key: k, d: JSON.parse(JSON.stringify(B[k])) });
  }
  return R('SidFlat')(recs, 'taanit', daf).flat;
}

/* ---------- א→ב: סוף ז׳ ע״א, החברותא בז׳ ע״ב (אותו קובץ) ---------- */
go('ז', 1);
g(0, 4); c(0, 2); R('addStep()');
g(5, 9); R('addWait_()');
var A = steps('taanit|ז|0|1');
ok(A.length === 2 && A[1].cn === 1 && A[1].c.from === null && !A[1].c.h, 'א→ב: הקטע נשמר כממתין, בלי פסקה');
ok(R('lastChav()') === 2, 'א→ב: הממתין אינו צורך פסקה בעמוד שלו');
ok(R('cnPend_(STEPS[1], PKEY)') === true, 'א→ב: מזוהה כממתין');
ok(R('stepParaTxt_(STEPS[1])').indexOf('ממתין') >= 0, 'א→ב: הרשימה אומרת ממתין');
var rootId = A[1].id;
ok(!!rootId, 'א→ב: לשורש יש מזהה');
/* הוספה רגילה אחריו נחסמת */
g(10, 11); c(3, 3); R('addStep()');
ok(steps('taanit|ז|0|1').length === 2, 'א→ב: אין קטע נוסף אחרי הממתין');
/* ראש ע״ב: "המשך הקטע" בלי חברותא — נחסם */
go('ז', 2);
ok(R('USED_C') === 2, 'א→ב: בראש ע״ב ממשיכים מפסקה 3');
g(0, 3); R('addStep(true)');
ok(steps('taanit|ז|0|2').length === 0, 'א→ב: המשך בלי חברותא לא נוסף');
/* חיבור מפורש */
c(3, 4); R('addStep(true, true)');
var B2 = steps('taanit|ז|0|2'), A2 = steps('taanit|ז|0|1');
ok(B2.length === 1 && B2[0].cont === 1 && B2[0].cj.from === 3 && B2[0].cj.to === 4, 'א→ב: ההמשך נושא את פסקאות 4–5');
ok(A2[1].c.h === B2[0].cj.h && B2[0].c.h === B2[0].cj.h && A2[1].c.from === null, 'א→ב: אותו ביאור בשני החלקים');
ok(R('DIRTY["taanit|ז|0|1"]') === 1, 'א→ב: גם ע״א מסומן לשמירה');
ok(!B2[0].id && A2[1].id === rootId, 'א→ב: המזהה נשאר על השורש');
ok(R('lastChav()') === 4, 'א→ב: פסקאות 4–5 תפוסות');
ok(R('cnPend_(BOOK["taanit|ז|0|1"].steps[1], "taanit|ז|0|1")') === false, 'א→ב: כבר לא ממתין');
/* הקטע הבא בע״ב — מפסקה 6 */
g(4, 8); c(5, 6); R('addStep()');
ok(steps('taanit|ז|0|2')[1].c.from === 5, 'א→ב: הקטע הבא ממשיך מפסקה 6');
/* לומד */
var F = flat('ז');
var parts = F.filter(function (v) { return v.id === rootId; });
ok(parts.length === 2 && parts[0].c.h === parts[1].c.h && parts[0].n === parts[1].n, 'א→ב: הלומד — שני חלקים, אותו מספר ואותו ביאור');
ok(F.map(function (v) { return v.c.h; }).filter(function (h) { return h === parts[0].c.h; }).length === 2, 'א→ב: הביאור אינו מופיע פעם שלישית');
/* טעינה מחדש */
reload(); go('ז', 1); go('ז', 2);
ok(R('CONT_FIXED') === false && R('DIRTY["taanit|ז|0|1"]') === undefined, 'א→ב: אחרי טעינה — אין תיקון ואין שמירה מיותרת');
ok(steps('taanit|ז|0|2')[1].c.from === 5, 'א→ב: אחרי טעינה — הקטע הבא לא זז');
/* פסקה שתוקנה — השורש מתיישר */
FILES['ז'][3] = { runs: [{ t: 'ז-p3-תוקן', b: false }] };
go('ז', 2); R('refreshHolders_(3); touched()');
ok(steps('taanit|ז|0|1')[1].c.text.indexOf('תוקן') >= 0, 'א→ב: תיקון פסקה מגיע גם לשורש');
ok(R('DIRTY["taanit|ז|0|1"]') === 1, 'א→ב: ע״א מסומן לשמירה אחרי התיקון');
/* ביטול החיבור: מחיקת ההמשך (קודם הקטע שאחריו) */
R('removeStep(1)'); R('removeStep(0)');
ok(steps('taanit|ז|0|2').length === 0, 'א→ב: ההמשך נמחק');
var A3 = steps('taanit|ז|0|1');
ok(A3[1].cn === 1 && !A3[1].c.h && A3[1].id === rootId, 'א→ב: ביטול — השורש חוזר להיות ממתין, עם אותו מזהה');
ok(R('USED_C') === 2, 'א→ב: ביטול — פסקאות 4–5 שוב פנויות');
/* מחיקת השורש כשההמשך קיים — נחסמת */
c(3, 4); g(0, 3); R('addStep(true, true)');
go('ז', 1); R('deleteStep(1)');
ok(steps('taanit|ז|0|1').length === 2, 'א→ב: אי אפשר למחוק את השורש לפני ההמשך');

/* ---------- ב→א: סוף ז׳ ע״ב, החברותא בח׳ ע״א (קובץ אחר) ---------- */
go('ז', 2);
var nB = steps('taanit|ז|0|2').length;
g(9, 12); R('addWait_()');
var Z = steps('taanit|ז|0|2');
ok(Z.length === nB + 1 && Z[Z.length - 1].cn === 1, 'ב→א: ממתין בסוף ע״ב');
var used7 = R('lastChav()');
var root2 = Z[Z.length - 1].id;
go('ח', 1);
ok(R('USED_C') === -1, 'ב→א: בראש ח׳ — החברותא של ח׳ מתחילה מ-0');
g(0, 2); c(0, 1); R('addStep(true, true)');
var H = steps('taanit|ח|0|1'), Z2 = steps('taanit|ז|0|2');
ok(H.length === 1 && H[0].cont && H[0].cj.from === 0 && H[0].cj.to === 1, 'ב→א: ההמשך בח׳ ע״א נושא את פסקאות 1–2 של ח׳');
ok(Z2[Z2.length - 1].c.h === H[0].cj.h && Z2[Z2.length - 1].c.h.indexOf('ח-p0') >= 0, 'ב→א: הביאור של השורש — מח׳');
ok(R('DIRTY["taanit|ז|0|2"]') === 1, 'ב→א: ז׳ ע״ב מסומן לשמירה');
go('ז', 2);
ok(R('lastChav()') === used7, 'ב→א: פסקאות ח׳ לא נספרות בקובץ של ז׳');
reload(); go('ח', 1);
g(3, 6); c(2, 3); R('addStep()');
ok(steps('taanit|ח|0|1')[1].c.from === 2, 'ב→א: אחרי טעינה — הקטע הבא בח׳ ממשיך מפסקה 3');
ok(R('DIRTY["taanit|ז|0|2"]') === undefined, 'ב→א: אחרי טעינה — ז׳ לא נכתב שוב');
/* לומד: בלי upto — השורש בשבוע של ז׳, ההמשך פותח את ח׳; אותו ביאור */
var F7 = flat('ז'), F8 = flat('ח');
var r7 = F7.filter(function (v) { return v.id === root2; });
ok(r7.length === 1 && r7[0].c.h.indexOf('ח-p0') >= 0, 'ב→א: הלומד בז׳ — הקטע עם הביאור מח׳');
ok(F8[0].st.cont && F8[0].c.h === r7[0].c.h, 'ב→א: הלומד בח׳ — אותו ביאור בהמשך');
ok(F7.every(function (v) { return v.id !== root2 || v.c.h; }), 'ב→א: אין קטע ריק');
/* עם upto שהבעלים קבע — שני החלקים ברצף בשבוע של ח׳, אותו מזהה */
R('BOOK["taanit|ז|0|2"].upto = BOOK["taanit|ז|0|2"].steps.length - 2; BOOK["taanit|ז|0|2"].uptoDaf = "ח";');
F8 = flat('ח');
ok(F8[0].id === root2 && F8[1].id === root2 && F8[0].n === F8[1].n && F8[0].c.h === F8[1].c.h,
   'ב→א: עם upto — הזנב של ז׳ וראש ח׳ הם קטע אחד, אותו מזהה וביאור');
R('delete BOOK["taanit|ז|0|2"].upto; delete BOOK["taanit|ז|0|2"].uptoDaf;');
/* ביטול החיבור בח׳ */
go('ח', 1); R('removeStep(1)'); R('removeStep(0)');
Z2 = steps('taanit|ז|0|2');
ok(Z2[Z2.length - 1].cn === 1 && !Z2[Z2.length - 1].c.h, 'ב→א: ביטול — השורש בז׳ חוזר להיות ממתין');

/* ---------- חיבור קטע ראשון שכבר סומן בעמוד הבא ---------- */
go('ח', 1);
g(0, 2); c(0, 1); R('addStep()');
var first = steps('taanit|ח|0|1')[0], fid = first.id;
ok(!first.cont && fid, 'ראשון קיים: קטע רגיל בראש ח׳');
R('cnJoinFirst_()');
var H2 = steps('taanit|ח|0|1')[0], Z3 = steps('taanit|ז|0|2'), rt = Z3[Z3.length - 1];
ok(H2.cont && !H2.id && H2.cj.from === 0, 'ראשון קיים: נעשה המשך');
ok(rt.also && rt.also.indexOf(fid) >= 0 && rt.c.h === H2.cj.h, 'ראשון קיים: המזהה שלו ב-also של השורש, אותו ביאור');

/* ---------- מעבר בין עמודים לא משנה דבר ---------- */
var snap = JSON.stringify(R('BOOK'));
go('ז', 1); go('ז', 2); go('ח', 1); go('ז', 2);
ok(JSON.stringify(R('BOOK')).replace(/"t":\d+/g, '') === snap.replace(/"t":\d+/g, ''), 'מעבר עמודים: שום סימון לא זז');

/* ---------- הכיוון הקיים לא השתנה ---------- */
go('ו', 1); g(0, 5); c(0, 3); R('addStep()');
go('ו', 2); g(0, 2); c(4, 4); R('addStep(true, true)');
var V1 = steps('taanit|ו|0|1')[0], V2 = steps('taanit|ו|0|2')[0];
ok(V1.c.from === 0 && V1.c.to === 4 && V2.cont && V2.cj.to === 4 && V2.c.to === 4, 'קדימה באותו דף: הקטע הקודם נמתח, ההמשך נושא cj');
ok(R('lastChav()') === 4, 'קדימה באותו דף: פסקה 5 תפוסה');
go('ח', 2); g(0, 6); c(R('USED_C') + 1, 11); R('addStep()');
var nh = steps('taanit|ח|0|2'); var lastH = nh[nh.length - 1];
go('ט', 1); g(0, 2); c(0, 0); R('addStep(true, true)');
var T1 = steps('taanit|ט|0|1')[0];
ok(T1.cont && T1.cj.from === 0 && lastH.c.from === 2 && lastH.c.to === 11 && lastH.c.h.indexOf('ט-p0') > 0 && lastH.c.h.indexOf('ח-p11') >= 0,
   'קדימה בין דפים: הביאור מתחבר, המספרים של ח׳ נשארים');
reload(); go('ח', 2); go('ט', 1);
ok(R('DIRTY["taanit|ח|0|2"]') === undefined && R('CONT_FIXED') === false, 'קדימה בין דפים: אחרי טעינה — אין תיקון');
go('ט', 1); R('removeStep(0)');
var lh = steps('taanit|ח|0|2'); lh = lh[lh.length - 1];
ok(lh.c.h.indexOf('ט-p0') < 0 && !lh.cn, 'קדימה בין דפים: ביטול החיבור מקצר את הביאור');

console.log(fail ? '✗ ' + fail + ' נכשלו, ' + pass + ' עברו' : '✓ כל ' + pass + ' הבדיקות עברו');
process.exit(fail ? 1 : 0);
