// סקירה מתעדכנת בכניסה (8.99.483): fresh — ספירה וסנכרון עכשיו, פעם ב-15 שנ'; force — בלי המתנה.
// node tools/ovtest/fresh.js. שמות מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
W.props.OV_ID = 'PUB'; W.props.OV_SHAPE = '1';
var T0 = W.pub.insertSheet(c.OV_TAB_);
T0.appendRow(['מוסד', 'קוד', 'רכז בשטח', 'ראש ישיבה', 'ראש חטיבה', 'נרשמו באפליקציה', 'הערות']);
T0.appendRow([c.OV_INST_[4][1], 'givat', '', '', '', '', '']);
var rc = 0, sy = [];
var R = c.recount_; c.recount_ = function () { rc++; return R(); };
var S = c.ovSync_; c.ovSync_ = function (f) { sy.push(!!f); return S(f); };
var cache = c.CacheService.getScriptCache();
function get(p) { c.OVX_MEMO_ = null; c.SS_OPEN_ = {}; var q = { ov: 'get', key: 'k' }; for (var k in p) q[k] = p[k]; return c.ov_(q); }
// 1. בלי fresh — כמו קודם: סנכרון רגיל (עם ההמתנה של 2 דק'), בלי ספירה
var g0 = get({});
ok(g0.status === 'ok' && rc === 0 && sy.join() === 'false', 'plain get unchanged', [g0.status, rc, sy]);
// 2. כניסה — ספירה + סנכרון מלא, גם אם סונכרן לפני רגע
sy = [];
var g1 = get({ fresh: '1' });
ok(g1.status === 'ok' && rc === 1 && sy[0] === true, 'enter → recount + full sync', [rc, sy]);
// 3. נכנס עוד מישהו באותן 15 שנ' — בלי ספירה נוספת
sy = [];
get({ fresh: '1' });
ok(rc === 1 && sy.join() === 'false', 'second entry within 15s → no extra work', [rc, sy]);
// 4. כפתור הרענון של הבעלים — מיד, גם בתוך ה-15
sy = [];
get({ force: '1' });
ok(rc === 2 && sy[0] === true, 'owner refresh → immediately', [rc, sy]);
// 5. אחרי 15 שנ' — שוב
cache.remove('ovFresh'); sy = [];
get({ fresh: '1' });
ok(rc === 3 && sy[0] === true, 'after the window → again', [rc, sy]);
// 6. הקישור למנהלים (בלי סיסמה, עם מפתח הסקירה) — גם הוא מתעדכן בכניסה; force ממנו = fresh
W.props.OV_KEY = 'mgr1'; cache.remove('ovFresh'); sy = [];
var g6 = c.ov_({ ov: 'get', key: 'mgr1', fresh: '1' });
ok(g6.status === 'ok' && rc === 4 && sy[0] === true, 'managers link entry syncs', [g6.status, rc, sy]);
sy = [];
c.ov_({ ov: 'get', key: 'mgr1', force: '1' });
ok(rc === 4, 'force from a non-owner link waits like fresh', [rc, sy]);
console.log('checks', n, 'fails', fails); process.exit(fails ? 1 : 0);
