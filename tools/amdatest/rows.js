// שמירת נוכחות בבקשה אחת ואימות קל (8.99.480) — מול apps-script.gs בזיכרון.
// node tools/amdatest/rows.js → קוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(v, l, x) { n++; if (!v) { fails++; console.log('FAIL', l, x === undefined ? '' : JSON.stringify(x)); } }
function post(d) { return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
function get(p) { var r = c.doGet({ parameter: p }); return JSON.parse(r.t); }
// איש צוות: DEV1 מאושר ל-tapuah בלבד.
c.accGate_ = function (inst, dev) { return dev === 'DEV1' && inst === 'tapuah' ? null : { status: 'denied' }; };
var syncs = 0, busts = 0, parts = 0;
c.amdaSyncLocked_ = function () { syncs++; return 0; };
var qb = c.amdaQzBust_; c.amdaQzBust_ = function () { busts++; return qb(); };
var ps = c.partSoon_; c.partSoon_ = function () { parts++; return ps(); };
function cols(id, nm, extra) {
  return [['מזהה', id], ['שבוע', 6], ['יום', '2026-11-09'], ['עמדה', 'בוקר'], ['קוד עמדה', 'S1'], ['סוג', 'דף'],
          ['מסלול', 'taanit'], ['דף', 'ו'], ['קוד ישיבה', 'givat'], ['מקום', ''], ['רמה', ''], ['אישור חידון', ''],
          ['שכבה', 'ז'], ['כיתה', '3'], ['שם', nm], ['מתי', '2026-11-09T08:00:00Z']].concat(extra || []);
}
function tab() { return c.amdaTable_('עמדת לימוד'); }
// 1. בסיסמה — 30 שורות בבקשה אחת
var L = []; for (var i = 0; i < 30; i++) L.push(cols('a' + i, 'תלמיד ' + i));
var r1 = post({ action: 'amdarows', tab: 'עמדת לימוד', key: 'k', rows: JSON.stringify(L) });
ok(r1.status === 'success' && r1.n === 30, 'admin batch writes 30', r1);
ok(tab().rows.length === 31, '30 rows in tab', tab().rows.length);
ok(busts === 1 && parts === 0, 'one bust, recount not under the lock', [busts, parts]);
ok(c.CacheService.getScriptCache().get('partDue') === '1', 'recount marked pending');
ok(tab().c(tab().rows[5], 'קוד ישיבה') === 'givat' && tab().c(tab().rows[5], 'תאריך') !== '', 'columns + date', tab().rows[5]);
// 2. שליחה חוזרת — אין כפילות
var r2 = post({ action: 'amdarows', tab: 'עמדת לימוד', key: 'k', rows: JSON.stringify(L.slice(0, 10).concat([cols('a99', 'חדש')])) });
ok(r2.n === 1 && r2.dup === 10, 'resend: only the new one', r2);
ok(tab().rows.length === 32, 'no duplicates', tab().rows.length);
// 3. איש צוות — ישיבה נכפית, עמודה זרה נזרקת
var r3 = post({ action: 'amdarows', tab: 'עמדת לימוד', dev: 'DEV1', inst: 'tapuah',
                rows: JSON.stringify([cols('s1', 'צוות', [['זדוני', 'x']])]) });
var t3 = tab(), last = t3.rows[t3.rows.length - 1];
ok(r3.n === 1 && t3.c(last, 'קוד ישיבה') === 'tapuah' && t3.c(last, 'זדוני') === '', 'staff: inst forced, extra col dropped', [r3, last]);
// 4. איש צוות לא מאושר / בלי זהות / לשונית אחרת — נדחה
ok(post({ action: 'amdarows', dev: 'DEV2', inst: 'tapuah', rows: JSON.stringify([cols('x1', 'א')]) }).status === 'denied', 'unapproved device denied');
ok(post({ action: 'amdarows', rows: JSON.stringify([cols('x2', 'א')]) }).status === 'denied', 'no auth denied');
ok(post({ action: 'amdarows', tab: 'לומדים', key: 'k', rows: JSON.stringify([cols('x3', 'א')]) }).status === 'denied', 'other tab denied even with key');
ok(tab().rows.length === 33, 'nothing written by denied', tab().rows.length);
// 5. האימות הקל
var s0 = syncs;
var g1 = get({ amdaok: '1', key: 'k', ids: 'a0,a29,a99,s1,nope' });
ok(g1.status === 'ok' && g1.v === 1 && g1.have.sort().join() === 'a0,a29,a99,s1', 'check by key', g1);
ok(syncs === s0, 'check does not run the sync');
var g2 = get({ amdaok: '1', dev: 'DEV1', inst: 'tapuah', ids: 'a0,s1' });
ok(g2.have.join() === 's1', 'staff sees only own institution', g2);
ok(get({ amdaok: '1', dev: 'DEV2', inst: 'tapuah', ids: 's1' }).status === 'denied', 'unapproved check denied');
ok(get({ amdaok: '1', ids: 's1' }).status === 'denied', 'anonymous check denied');
c.CacheService.getScriptCache().remove('amdaSync');
get({ amdaok: '1', key: 'k', sync: '1' });
ok(syncs === s0 + 1, 'sync ping runs the sync');
// 6. תיקון סוג — בשרת
var fx = { day: '2026-11-09', slot: 'S1', inst: 'givat', kind: 'd', track: 'taanit', daf: 'ו', lvl: '', qz: false };
ok(get({ amdaok: '1', key: 'k', fix: JSON.stringify(fx) }).fixOk === true, 'fix matches');
fx.kind = 'o';
ok(get({ amdaok: '1', key: 'k', fix: JSON.stringify(fx) }).fixOk === false, 'fix mismatch');
ok(get({ amdaok: '1', dev: 'DEV1', inst: 'tapuah', fix: JSON.stringify(fx) }).fixOk === undefined, 'fix only with key');
// 7. השורה הבודדת הישנה עדיין עובדת
var r7 = post({ action: 'row', tab: 'עמדת לימוד', key: 'k', cols: JSON.stringify(cols('old1', 'ישן')) });
ok(r7.status === 'success' && tab().rows.length === 34, 'legacy single row still works', r7);
// 8. הקריאה המלאה — רק העמודות שביקשו, ובלי שיוך כשביקשו nosync
c.CacheService.getScriptCache().remove('amdaSync');
var s8 = syncs, g8 = get({ read: 'עמדת לימוד', key: 'k', cols: 'מזהה,שם,לא קיימת', nosync: '1' });
ok(g8.rows[0].join() === 'מזהה,שם' && g8.rows.length === 34 && g8.rows[1].length === 2, 'cols projection', g8.rows[0]);
ok(syncs === s8, 'nosync skips the sync');
var g9 = get({ read: 'עמדת לימוד', key: 'k' });
ok(g9.rows[0].length > 10 && syncs === s8 + 1, 'without params: all columns + sync, as before', [g9.rows[0].length, syncs - s8]);
var g10 = get({ netmarks: 'tapuah', dev: 'DEV1', cols: 'שם,קוד ישיבה', nosync: '1' });
ok(g10.status === 'ok' && g10.rows.length === 2 && g10.rows[1][1] === 'tapuah' && g10.rows[0].length === 2, 'staff netmarks projection', g10);
// 9. ההרצה השעתית: ביום — רק השיוך והמדידה; בלילה — הכבדים, פעם אחת
var called = [];
['taanitShift_', 'megilaShift_', 'wholeB_', 'recount_', 'recountLearn_', 'backupDaily_', 'ovSync_', 'amdaSyncLocked_', 'tmFlush_']
  .forEach(function (f) { c[f] = function () { called.push(f); return 0; }; });
var H = 14, RealFmt = c.Utilities.formatDate;
c.Utilities.formatDate = function (d, tz, f) { if (f === 'H') return String(H); if (f === 'yyyy-MM-dd') return '2026-11-10'; return RealFmt(d, tz, f); };
c.autoRecount();
ok(called.join() === 'amdaSyncLocked_,tmFlush_', 'day: only student sync + timing', called);
called = []; H = 2; c.autoRecount();
ok(called.indexOf('recountLearn_') >= 0 && called.indexOf('backupDaily_') >= 0 && called.indexOf('ovSync_') >= 0 &&
   called.indexOf('taanitShift_') >= 0, 'night: heavy jobs run', called);
called = []; H = 3; c.autoRecount();
ok(called.join() === 'amdaSyncLocked_,tmFlush_', 'night: once per night', called);
c.Utilities.formatDate = RealFmt;
console.log('checks', n, 'fails', fails); process.exit(fails ? 1 : 0);
