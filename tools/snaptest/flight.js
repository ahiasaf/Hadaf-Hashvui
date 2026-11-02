// "חישוב אחד בכל פעם": מי שמחכה לחישוב של אחר — מקבל אותו רק אם הוא מכסה את מה שראה.
var M = require('./mock.js'); var W = M.makeWorld(), c = W.ctx;
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
function J(cols) { c.appendCols_('לומדים', cols); }
for (var i = 0; i < 30; i++) J([['מזהה', 'S' + i], ['שם', 'a' + i], ['משפחה', 'b' + i], ['טלפון', 'ph' + i], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
function learn(id) { c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', 4], ['דף', 'ד.'], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]);
                     c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', 4], ['דף', 'ד:'], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]); }
function truth(id) { var k = W.cache.m; W.cache.m = {}; exec(); try { return JSON.stringify(c.ptsMe_({ id: id })); } finally { W.cache.m = k; exec(); } }
var builds = 0, orig = c.rafCalc_; c.rafCalc_ = function () { builds++; return orig.apply(this, arguments); };
var ok = true;
function check(lbl, got, want) { var g = JSON.stringify(got); if (g !== want) { ok = false; console.log('FAIL', lbl, g, want); } else console.log('ok  ', lbl); }

// א. חישוב אחר שהתחיל אחרי השינוי שלי — מחכים לו ולא מחשבים פעמיים.
exec(); c.ptsMe_({ id: 'S1' });            // מטמון קיים
learn('S2');                               // S2 השתנה
exec(); c.snapStamp_();                    // S2 רואה את החותמת החדשה
W.cache.m['bld:raf:me5'] = String(Date.now());
var other = function () { var keep = [c.SNAP_CUR_, c.SNAP_TAIL_]; exec(); c.rafMeBuild_ && c.snapGet_('raf:me5', null, function () { return c.rafMeBuild_(); });
                          c.SNAP_CUR_ = keep[0]; c.SNAP_TAIL_ = keep[1]; };
var slept = 0; W.sleepHook = function () { if (slept++ === 0) { var f = W.cache.m['bld:raf:me5']; other(); W.cache.m['bld:raf:me5'] = f; } };
builds = 0; var gotA = c.rafMeMap_(null, ['S2']); var bA = builds;
W.sleepHook = null; delete W.cache.m['bld:raf:me5'];
console.log('   builds by waiter+other:', bA, '(1 = the waiter did not compute again)');
check('A: waiter gets the other build', gotA['S2'] || '', JSON.stringify((function () { var k = W.cache.m; W.cache.m = {}; exec(); try { return c.rafMeMap_()['S2'] || ''; } finally { W.cache.m = k; exec(); } })()));
if (bA !== 1) { ok = false; console.log('FAIL A builds', bA); }

// ב. חישוב אחר שהתחיל **לפני** השינוי שלי — לא מקבלים אותו; מחשבים בעצמנו.
exec(); var oldStamp = JSON.parse(JSON.stringify(c.snapStamp_()));
learn('S3');
exec(); c.snapStamp_();
W.cache.m['bld:raf:me5'] = String(Date.now());
var other2 = function () { var keep = [c.SNAP_CUR_, c.SNAP_TAIL_]; exec(); c.SNAP_CUR_ = oldStamp;   // התחיל לפני הלימוד של S3
  // הנתונים נקראו לפני הכתיבה: מדמים בכך שמסירים את שתי השורות האחרונות בזמן החישוב
  var sh = W.priv.tabs['לימוד'], tail = sh.d.splice(sh.d.length - 2, 2);
  c.snapGet_('raf:me5', null, function () { return c.rafMeBuild_(); }); sh.d = sh.d.concat(tail);
  c.SNAP_CUR_ = keep[0]; c.SNAP_TAIL_ = keep[1]; };
slept = 0; W.sleepHook = function () { if (slept++ === 0) other2(); else delete W.cache.m['bld:raf:me5']; };
builds = 0; var gotB = c.rafMeMap_(null, ['S3']);
W.sleepHook = null;
check('B: stale other build is rejected', gotB['S3'] || '', JSON.stringify((function () { var k = W.cache.m; W.cache.m = {}; exec(); try { return c.rafMeMap_()['S3'] || ''; } finally { W.cache.m = k; exec(); } })()));

// ג. מי שלא השתנה — מהמטמון, בלי חישוב, גם כשאחרים לומדים.
exec(); c.ptsMe_({ id: 'S5' }); learn('S6'); learn('S7');
exec(); builds = 0; var gotC = c.ptsMe_({ id: 'S5' }); var bC = builds;
check('C: unchanged student served from cache', gotC, truth('S5'));
console.log('   builds for unchanged student after others learned:', bC);
if (bC !== 0) { ok = false; console.log('FAIL C builds', builds); }
exec(); builds = 0; var gotD = c.ptsMe_({ id: 'S6' }); var bD = builds;
check('D: changed student recomputed', gotD, truth('S6'));
console.log('   builds for the student who learned:', bD);

// ה. שמירת לימוד אינה מחשבת ואינה קוראת את הלשונית כולה.
M.STATS.reads = 0; M.STATS.readCells = 0; builds = 0; exec(); learn('S8');
console.log('   learn write: builds', builds, 'range reads', M.STATS.reads, 'cells read', M.STATS.readCells);
if (builds) { ok = false; console.log('FAIL write computed'); }

// ו. הלוח האמיתי (boardData_) — אחרי לימוד של תלמיד בלוח.
var code = c.getCode_('givat') || (c.ensureCode_ && (c.ensureCode_('givat', 'zz'), c.getCode_('givat')));
exec(); var b0 = c.boardData_('givat', code); learn('S9'); exec();
var b1 = JSON.stringify(c.boardData_('givat', code));
var kk = W.cache.m; W.cache.m = {}; exec(); var bt = JSON.stringify(c.boardData_('givat', code)); W.cache.m = kk;
check('F: board after a student on it learned', JSON.parse(b1), bt);
console.log('   board status', JSON.parse(b1).status, 'rows', (JSON.parse(b1).students || []).length);
console.log(ok ? 'ALL OK' : 'SOME FAILED', 'missing:', Object.keys(M.missing).join(','));
process.exit(ok ? 0 : 1);
