// התמונה השמורה לבית (8.99.465): רישום הגרלה, הגנת ההפעלה, קריאת לשונית ההגרלות.
// apps-script.gs עצמו ב-vm, מול גיליון מדומה. ההגרלה כאן — בגיליון המדומה בלבד.
var M = require('./mock.js'); var W = M.makeWorld(), c = W.ctx;
var ok = true;
function check(lbl, cond, info) { if (!cond) { ok = false; console.log('FAIL', lbl, info === undefined ? '' : info); } else console.log('ok  ', lbl); }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
// נעילה ומתזמן מדומים. newTrigger — נספר; אסור שייקרא.
var lockFree = true, newTrig = 0, TRIG = [];
c.LockService.getDocumentLock = function () { return { tryLock: function () { if (!lockFree) return false; return true; }, releaseLock: function () {} }; };
c.ScriptApp = { getProjectTriggers: function () { return TRIG.map(function (f) { return { getHandlerFunction: function () { return f; } }; }); },
                newTrigger: function () { newTrig++; throw new Error('אסור להתקין טריגר בבדיקה'); }, deleteTrigger: function () {} };
// נתונים מומצאים
for (var i = 0; i < 20; i++) {
  c.appendCols_('לומדים', [['מזהה', 'S' + i], ['שם', 'a' + i], ['משפחה', 'b' + i], ['טלפון', 'ph' + i], ['ישיבה', 'גבעת'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
}
var pw = c.progWeek_();
function learn(id, wk) {
  var d = c.rafDafOfW_ ? c.rafDafOfW_('taanit', wk) : '';
  ['.', ':'].forEach(function (pg) {
    c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', wk], ['דף', String(d || 'ד') + pg], ['זמן בדף (דקות)', '15'], ['מכשיר', id]]);
  });
}
for (var j = 0; j < 12; j++) { learn('S' + j, pw - 1); learn('S' + j, pw); }
// מונים
var raf = 0, origRead = c.rafRead_; c.rafRead_ = function () { raf++; return origRead.apply(this, arguments); };
var builds = 0, origMap = c.rafMeMap_; c.rafMeMap_ = function () { builds++; return origMap.apply(this, arguments); };
function me(id) { exec(); return c.ptsMe_({ id: id }); }
// `drawn` — הנתיב החי שומר את מטמון הכרטיסים גם אחרי רישום (כמו קודם); אינו מוצג בבית (8.99.357).
function nd(o) { o = typeof o === 'string' ? JSON.parse(o) : JSON.parse(JSON.stringify(o)); if (o.tk) delete o.tk.drawn; delete o.up; return JSON.stringify(o); }
function live(id) { var on = W.props.HSNAP_ON; delete W.props.HSNAP_ON; var k = W.cache.m; W.cache.m = {};
  try { return JSON.stringify(me(id)); } finally { W.cache.m = k; if (on) W.props.HSNAP_ON = on; } }

// 1. כבוי — כמו קודם.
check('1 off = live', JSON.stringify(me('S1')) === live('S1'));
// 2. בנייה והגנת הפעלה.
exec(); var m = c.hsnapBuild_('בדיקה');
check('2a build ok', /^נבנתה/.test(m), m);
var r = c.hsnapEnable();
check('2b enable refused without triggers', !W.props.HSNAP_ON && /טריגר יומי/.test(r) && /טריגר שעתי/.test(r), r);
TRIG = ['hsnapDaily'];
r = c.hsnapEnable(); check('2c refused without hourly', !W.props.HSNAP_ON && /שעתי/.test(r), r);
TRIG = ['hsnapDaily', 'hsnapHourly'];
W.props.HSNAP_SYNC = '0'; r = c.hsnapEnable(); check('2d refused when sync off', !W.props.HSNAP_ON && /הסנכרון כבוי/.test(r), r);
W.props.HSNAP_SYNC = '1';
r = c.hsnapEnable(); check('2e enabled when all fine', W.props.HSNAP_ON === '1', r);
var s1 = me('S1'); check('2f home from snapshot', !!s1.up && JSON.stringify(Object.assign({}, s1, { up: undefined })) !== 'x', JSON.stringify(s1));
var l1 = JSON.parse(live('S1')); delete s1.up;
check('2g snapshot equals live (same data)', JSON.stringify(s1) === JSON.stringify(l1), JSON.stringify(s1) + ' vs ' + JSON.stringify(l1));

// 3. קריאות חוזרות בחלון — בלי קריאת לשונית ההגרלות ובלי חישוב.
var keepT = c.hsnapWinT_; c.hsnapWinT_ = function () { return pw; };
raf = 0; builds = 0; for (var k = 0; k < 50; k++) me('S' + (k % 12));
check('3a 50 home opens in window: 0 raffle-tab reads, 0 builds', raf === 0 && builds === 0, 'raf=' + raf + ' builds=' + builds);
check('3b up=h in window before registration', me('S2').up === 'h');

// 4. רישום הגרלה (בגיליון המדומה) — הבית חוזר מיד לחישוב החי.
var before = JSON.stringify(me('S3'));
exec(); var d = c.raffleDraw_({ codes: 'givat', who: 'בדיקה' });
check('4a draw registered (mock)', d && d.status === 'ok', JSON.stringify(d).slice(0, 200));
var after = me('S3');
check('4b home after registration = live (not the old snapshot)', nd(after) === nd(live('S3')) && !after.up, JSON.stringify(after) + ' LIVE ' + live('S3'));
check('4c the answer really changed (nx moved)', JSON.stringify(after) !== before);
// 5. הטריגר השעתי בונה פעם אחת — גם מחוץ לחלון — ואז לא שוב.
c.hsnapWinT_ = function () { return 0; };
exec(); builds = 0; c.hsnapHourly(); var b1 = builds;
check('5a hourly rebuilt after registration outside window', b1 > 0 && /אחרי הגרלה/.test(W.props.HSNAP_LAST) === false && /^נבנתה/.test(W.props.HSNAP_LAST), W.props.HSNAP_LAST);
var s5 = me('S3'); check('5b home again from snapshot, matches live', !!s5.up && nd(s5) === nd(live('S3')), JSON.stringify(s5));
exec(); builds = 0; c.hsnapHourly(); check('5c next hourly: no build', builds === 0, builds);
c.hsnapWinT_ = function () { return pw; };
check('5d up=d after registration even inside window clock', me('S3').up === 'd');
// 6. ביטול ההגרלה — שוב חי.
exec(); c.raffleVoid_({ rid: d.id || d.rid, why: 'בדיקה' });
var s6 = me('S3'); check('6 after void: live', !s6.up && JSON.stringify(s6) === live('S3'), JSON.stringify(s6));
exec(); c.hsnapBuild_('בדיקה');
// 7. רישום שקורה באמצע בנייה — הבנייה לא מוגשת.
var mid = c.rafMeMap_, once = 0;
c.rafMeMap_ = function () { if (!once++) c.hsnapRafMark_(); return mid.apply(this, arguments); };
exec(); m = c.hsnapBuild_('בדיקה'); c.rafMeMap_ = mid;
check('7a mid-build mark: build completes', /^נבנתה/.test(m), m);
check('7b ...but is not served', !me('S4').up);
exec(); c.hsnapBuild_('בדיקה');
check('7c fresh build served', !!me('S4').up);
// 8. בנייה שנכשלה — המצביע לא זז, הבית ממשיך מהקודמת, ההפעלה נחסמת.
var ptr0 = W.props.HSNAP_TAB, sv = c.JSON.stringify, n8 = 0;
c.JSON.stringify = function (o) { if (o && o.v === 1 && o.tk && !n8++) throw new Error('כשל מדומה'); return sv.apply(this, arguments); };
exec(); m = c.hsnapBuild_('בדיקה'); c.JSON.stringify = sv;
check('8a failed build keeps pointer', W.props.HSNAP_TAB === ptr0 && /^נכשלה/.test(m), m);
check('8b home still served from previous', !!me('S5').up);
delete W.props.HSNAP_ON; r = c.hsnapEnable();
check('8c enable refused after failed build', !W.props.HSNAP_ON && /לא הושלמה/.test(r), r);
exec(); c.hsnapBuild_('בדיקה'); r = c.hsnapEnable(); check('8d enable ok after good build', W.props.HSNAP_ON === '1', r);
// 9. תמונה ישנה (27 שעות) — חי, וההפעלה נחסמת.
var nowR = Date.now; c.Date.now = function () { return nowR() + 27 * 3600000; };
var s9 = me('S6'); c.Date.now = nowR;
check('9a 27h-old snapshot: live', !s9.up, JSON.stringify(s9));
var pwR = c.progWeek_; c.progWeek_ = function () { return pwR() + 1; };
check('9b snapshot from another week: refused', /שבוע אחר/.test(c.hsnapCheck_().join(' ')), c.hsnapCheck_());
c.progWeek_ = pwR;
// 10. בנייה כפולה: יומי ואחריו שעתי — השני מדלג. (הבנייה הקודמת — "לפני שעה")
W.props.HSNAP_TAB = W.props.HSNAP_TAB.replace(/[^|]+$/, new Date(Date.now() - 3600000).toISOString());
exec(); builds = 0; c.hsnapDaily(); var bd = builds; builds = 0; exec(); c.hsnapHourly();
check('10 daily then hourly in window: second skipped', bd > 0 && builds === 0, bd + '/' + builds);
// 11. נעילה תפוסה — לא נבנה, המצביע לא זז.
lockFree = false; var p11 = W.props.HSNAP_TAB; m = c.hsnapBuild_('בדיקה'); lockFree = true;
check('11 busy lock: nothing built', /עסוק/.test(m) && W.props.HSNAP_TAB === p11);
// 12. אף שלב לא התקין טריגר, ובנייה לא הדליקה את המתג.
check('12 no trigger installed', newTrig === 0);
delete W.props.HSNAP_ON; exec(); c.hsnapBuild_('בדיקה'); check('12b build does not enable', !W.props.HSNAP_ON);
console.log(c.hsnapStatus());
console.log(ok ? 'ALL OK' : 'SOME FAILED');
process.exit(ok ? 0 : 1);
