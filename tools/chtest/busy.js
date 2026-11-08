// הנעילה תפוסה — "my" מקבל את המצב האחרון מהמטמון ולא "עסוק" (8.99.472).
// node tools/chtest/busy.js
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, U = { test: false }, fails = 0;
function ok(x, l) { if (!x) { fails++; console.log('FAIL', l); } }
var set = c.chTab_(c.CH_SET_, ['שדה', 'ערך']);
[['פעיל', 'כן'], ['נפתח', new Date(Date.now() - 864e5).toISOString()], ['ארוחות ממומנות', '5']].forEach(function (x) { c.chPut_(set, { 'שדה': x[0], 'ערך': x[1] }); });
c.appendCols_('לומדים', [['מזהה', 'DAX'], ['שם', 'א'], ['משפחה', 'ב'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
var free = true;
c.LockService = { getScriptLock: function () { return { tryLock: function () { return free; }, waitLock: function () {}, releaseLock: function () {}, hasLock: function () { return true; } }; } };
var M1 = c.chModel_(U, false);
ok(M1 && M1.on, 'נבנה');
free = false;
ok(c.chModel_(U, false), 'במטמון — בלי נעילה');
var rc0 = c.chCache_(); rc0.put('chal:r:ids', ',DAX,', 600); c.chBustFor_('DAX', false);
var rc = c.chCache_(), hd = rc.get('chal:r');
ok(hd && rc.get('chal:r:stale'), 'סימון ישן, הכותרת נשארת');
// מעבר 20 שניות: מזייפים את זמן הבנייה בכותרת
rc.put('chal:r', hd.split('|')[0] + '|' + ((Date.now() % 1e8 - 30000 + 1e8) % 1e8), 600);
var parts = hd.split('|'), st2 = rc.get('chal:r').split('|')[1];
for (var i = 0; i < +parts[0]; i++) rc.put('chal:r:' + st2 + ':' + i, rc.get('chal:r:' + parts[1] + ':' + i), 600);
ok(c.chModelHit_(rc, 'chal:r') === null, 'ישן — בנייה נדרשת');
var M2 = c.chModel_(U, false);
ok(M2 && M2.on, 'נעילה תפוסה — המצב האחרון');
ok(c.chModel_(U, true) === null, 'ניהול (force) — לא מקבל ישן');
W.cache.m = {};
ok(c.chModel_(U, false) === null, 'אין מטמון — עסוק כמו קודם');
free = true;
ok(c.chModel_(U, false), 'נעילה פנויה — נבנה');
console.log('fails', fails);
process.exit(fails ? 1 : 0);
