// בדיקת שקילות: המטמון החדש מול החישוב המלא, בסדרת פעולות אקראית.
var M = require('./mock.js');
var W = M.makeWorld(), c = W.ctx;
var seed = +(process.env.SEED || 1); function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
var INST = ['givat', 'rishon', 'nertamid'], people = [], parents = [];
function J(cols) { c.appendCols_('לומדים', cols); }
// הרשמות
for (var i = 0; i < 240; i++) {
  var inst = INST[i % 3], id = 'D' + i.toString(36) + 'X', ph = 'ph' + i;
  var cols = [['מזהה', id], ['שם', 'פ' + i], ['משפחה', 'מ' + (i % 50)], ['טלפון', ph], ['ישיבה', 'י ' + inst], ['קוד ישיבה', inst],
              ['שכבה', pick(['ז', 'ח', 'ט', 'י'])], ['כיתה', String(1 + i % 3)], ['תפקיד', 'תלמיד'], ['טלפון ההורה', 'pp' + i], ['שם ההורה', 'א' + i]];
  if (i % 7 === 0) cols.push(['מזהים נוספים', 'OLD' + i + ' Am' + i]);
  if (i % 31 === 0) cols.push(['מסלול השלמה', 'כן']);
  J(cols); people.push({ id: id, ids: [id].concat(i % 7 === 0 ? ['OLD' + i, 'Am' + i] : []), inst: inst, ph: ph, i: i });
}
// חשבון כפול (אותו טלפון ושם) — target
for (var k = 0; k < 10; k++) { var p = people[k * 11]; var nid = 'DUP' + k;
  J([['מזהה', nid], ['שם', 'פ' + p.i], ['משפחה', 'מ' + (p.i % 50)], ['טלפון', p.ph], ['ישיבה', 'י ' + p.inst], ['קוד ישיבה', p.inst], ['תפקיד', 'תלמיד']]);
  p.ids.push(nid); }
// הורים
for (var k2 = 0; k2 < 40; k2++) { var kid = people[k2 * 5], pid = 'P' + k2;
  J([['מזהה', pid], ['שם', 'א' + kid.i], ['משפחה', 'מ' + (kid.i % 50)], ['טלפון', 'pp' + kid.i], ['ישיבה', 'י ' + kid.inst], ['קוד ישיבה', kid.inst],
     ['תפקיד', 'הורה'], ['טלפון ההורה', kid.ph], ['שם ההורה', 'פ' + kid.i]]);
  parents.push({ id: pid, kid: kid }); }
var TR = ['taanit', 'megila'];
function learn(p, fin) {
  var tr = pick(TR), d = pick(['ד', 'ה', 'ג']), pg = pick(['.', ':']), id = pick(p.ids);
  var cols = [['מזהה', id], ['קוד ישיבה', p.inst], ['מסלול', tr], ['שבוע', d === 'ד' ? 4 : d === 'ה' ? 5 : 3], ['דף', d + pg],
              ['זמן בדף (דקות)', String(Math.floor(rnd() * 20))], ['מכשיר', p.ids[0]]];
  if (!fin) cols.push(['קטע', '2'], ['מתוך', '5']);
  c.appendCols_('לימוד', cols);
}
function quiz(p) {
  var tr = pick(TR), d = pick(['ד', 'ה']);
  c.appendCols_('חידות', [['מזהה', pick(p.ids)], ['דף', tr + '|' + d], ['קטע', 'החידון כולו'], ['ציון', Math.floor(rnd() * 6) + '/5'],
                          ['ניסיון', '1'], ['מכשיר', p.ids[0]], ['זמן בדף (דקות)', '3']]);
}
function grant(par) {
  c.appendCols_('זוגות', [['מזהה', par.id], ['שם', 'א'], ['קוד ישיבה', par.kid.inst], ['מסלול', pick(TR)], ['שבוע', pick([4, 5])], ['דף', 'ד'],
                          ['דיווח', 'ההורה'], ['אושר', 'כן'], ['שם השותף', 'פ' + par.kid.i], ['טלפון השותף', par.kid.ph]]);
}
for (var s0 = 0; s0 < 600; s0++) { var pp = pick(people); if (rnd() < .7) learn(pp, true); else learn(pp, false); }
for (var s1 = 0; s1 < 150; s1++) quiz(pick(people));
for (var s2 = 0; s2 < 30; s2++) grant(pick(parents));

// "הרצה" חדשה — מאפסים את הזיכרון של ההרצה
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
// האמת: חישוב מלא במטמון ריק, בלי לגעת במטמון האמיתי
var inTruth = false;
function truth(fn) { var keep = W.cache.m; W.cache.m = {}; exec(); inTruth = true; try { return JSON.stringify(fn()); } finally { inTruth = false; W.cache.m = keep; exec(); } }
var calls = { rebuild: 0 };
var origCalc = c.rafCalc_; var midHook = null;
c.rafCalc_ = function () { if (!inTruth) calls.rebuild++; var r = origCalc.apply(this, arguments); if (midHook) { var h = midHook; midHook = null; h(); } return r; };
var origPts = c.ptsBuild_; c.ptsBuild_ = function () { if (!inTruth) calls.rebuild++; var r = origPts.apply(this, arguments); if (midHook) { var h = midHook; midHook = null; h(); } return r; };
var fails = 0, checks = 0;
function readCheck(label, fn) {
  exec(); var got = JSON.stringify(fn()); var want = truth(fn); checks++;
  if (got !== want) { fails++; if (fails < 6) console.log('MISMATCH', label, '\n got ', got.slice(0, 300), '\n want', want.slice(0, 300)); }
}
function meIds(p) { return pick([p.ids[0], p.ids.join(','), pick(p.ids)]); }
function boardIds(inst) { return people.filter(function (p) { return p.inst === inst; }).map(function (p) { return p.id; }); }
var ops = { read: 0, learn: 0, prog: 0, quiz: 0, grant: 0, join: 0, alias: 0, evict: 0, mid: 0, bust: 0, board: 0, tkd: 0 };
var N = +(process.env.N || 1500);
for (var step = 0; step < N; step++) {
  var r = rnd(), p = pick(people);
  if (r < .40) { ops.read++; var ids = meIds(p); readCheck('pts ' + ids, function () { return c.ptsMe_({ id: ids }); }); }
  else if (r < .45) { ops.tkd++; var ids2 = p.ids[0], wk2 = pick([4, 5]); readCheck('tkd ' + ids2, function () { return c.tkDaf_({ id: ids2, wk: wk2 }); }); }
  else if (r < .50) { ops.board++; var inst = pick(INST), bl = boardIds(inst);
    readCheck('board ' + inst, function () { var m = c.rafMeMap_(null, bl), t = c.ptsAll_(bl);
      return bl.map(function (x) { return [x, m[x] || '', JSON.stringify(c.ptsOf_(t, x))]; }); }); }
  else if (r < .62) { ops.learn++; learn(p, true); }
  else if (r < .70) { ops.prog++; learn(p, false); }
  else if (r < .76) { ops.quiz++; quiz(p); }
  else if (r < .79) { ops.grant++; grant(pick(parents)); }
  else if (r < .81) { ops.join++; var ni = people.length, nid = 'N' + ni, inst2 = pick(INST);
    // הרשמה דרך שורה חדשה בלבד, בלי ptsBust_ — החותמת צריכה לתפוס
    J([['מזהה', nid], ['שם', 'פ' + ni], ['משפחה', 'מ' + ni], ['טלפון', 'pn' + ni], ['ישיבה', 'י'], ['קוד ישיבה', inst2], ['שכבה', 'ט'], ['תפקיד', 'תלמיד']]);
    people.push({ id: nid, ids: [nid], inst: inst2, ph: 'pn' + ni, i: ni }); }
  else if (r < .83) { ops.alias++; // איחוד: מזהה חדש נבלע בשורה קיימת (עריכה במקום) + ptsBust_ כמו בקוד
    var sh = W.priv.tabs['לומדים'], hd = sh.d[0], ai = hd.indexOf('מזהים נוספים'), ii = hd.indexOf('מזהה');
    for (var rr = 1; rr < sh.d.length; rr++) if (sh.d[rr][ii] === p.id) { var nx = 'MRG' + step; sh.d[rr][ai] = ((sh.d[rr][ai] || '') + ' ' + nx).trim(); p.ids.push(nx); }
    c.ptsBust_(); }
  else if (r < .90) { ops.evict++; var ks = Object.keys(W.cache.m); for (var e = 0; e < 3 && ks.length; e++) delete W.cache.m[pick(ks)]; }
  else if (r < .96) { ops.mid++; // כתיבה או מחיקה באמצע חישוב (חישוב שהתחיל לפני)
    var kind = pick(['learn', 'bust', 'quiz']), q = pick(people);
    midHook = function () { if (kind === 'learn') learn(q, true); else if (kind === 'quiz') quiz(q); else c.ptsBust_(); };
    W.cache.m = {}; exec(); c.ptsMe_({ id: p.ids[0] }); midHook = null;
    var qid = q.ids[0]; readCheck('after-mid ' + kind, function () { return c.ptsMe_({ id: qid }); }); }
  else { ops.bust++; c.amdaQzBust_(); }
}
console.log('checks', checks, 'fails', fails, 'rebuilds', calls.rebuild, JSON.stringify(ops));
console.log('missing', Object.keys(M.missing).join(','));
process.exit(fails ? 1 : 0);
