// חבר מביא חבר — כללי השולחנות (8.99.442), מול apps-script.gs עצמו בזיכרון.
// node tools/chtest/tables.js   → יוצא בקוד 1 אם בדיקה נכשלה. שמות ומזהים מומצאים.
// require('./tables.js') — העולם עצמו, לגשר אליו את script.google.com מדפדפן.
var M = require('../snaptest/mock.js'), vm = require('vm');
var W = M.makeWorld(), c = W.ctx;
// שעון מדומה: new Date() ו-Date.now() לפי CLOCK.
vm.runInContext("var CLOCK={t:0};var RealDate_=Date;Date=function(a,b,cc,d,e,f,g){var n=arguments.length;" +
  "if(!(this instanceof Date))return new RealDate_(CLOCK.t).toString();if(!n)return new RealDate_(CLOCK.t);" +
  "if(n===1)return new RealDate_(a);return new RealDate_(a,b,cc||1,d||0,e||0,f||0,g||0);};" +
  "Date.prototype=RealDate_.prototype;Date.now=function(){return CLOCK.t};Date.parse=RealDate_.parse;Date.UTC=RealDate_.UTC;", c);
var H = 3600e3, T0 = Date.parse('2026-11-02T10:00:00Z');   // יום שני
function at(h) { c.CLOCK.t = T0 + h * H; }
function iso(h) { return new Date(T0 + h * H).toISOString(); }
function exec() { c.LRN_ROWS_ = null; c.SS_OPEN_ = {}; c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.RAF_D_ = null; c.RAF_DH_ = {}; W.cache.m = {}; }
var U = { test: false };
at(-200);
var set = c.chTab_(c.CH_SET_, ['שדה', 'ערך']);
[['פעיל', 'כן'], ['נפתח', iso(0)], ['ארוחות ממומנות', '5'], ['שולחנות מ', iso(0)]].forEach(function (x) { c.chPut_(set, { 'שדה': x[0], 'ערך': x[1] }); });
var N = 0;
function person(name, by, h) {
  var id = 'D' + name + 'X';
  var cols = [['מזהה', id], ['שם', name], ['משפחה', 'מ' + (N++)], ['טלפון', '050000' + (1000 + N)], ['ישיבה', 'י'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']];
  if (by) { at(h); cols.push([c.CH_BY_COL, by], [c.CH_AT_COL, "'" + iso(h)]); }
  c.appendCols_('לומדים', cols);
  return id;
}
// לימוד דף שלם (שני העמודים). o.daf — דף אחר; o.min — דקות; o.att — שורת נוכחות (בלי מכשיר וזמן).
function learn(id, h, o) {
  o = o || {}; at(h);
  var d = o.daf || 'ד', mn = String(o.min == null ? 15 : o.min);
  [d + '.', d + ':'].forEach(function (pg) {
    var cols = [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', pg]];
    if (o.att) cols.push(['מקור', 'עמדת לימוד']); else cols.push(['זמן בדף (דקות)', mn], ['מכשיר', id]);
    c.appendCols_('לימוד', cols);
  });
}
function prog(id, h) { at(h); c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '4'], ['דף', 'ה.'], ['קטע', '3'], ['מתוך', '6'], ['מכשיר', id]]); }
function code(id) { return c.chRefNew_(id, false); }
function sync(h) { at(h); exec(); return c.chSync_(U); }
function my(Mo, id, ref) { return c.chMy_(Mo, { id: id, ref: ref || '' }, U); }
var fails = 0, n = 0;
function ok(cond, label, extra) { n++; if (!cond) { fails++; console.log('FAIL', label, extra === undefined ? '' : JSON.stringify(extra)); } }
function tbl(Mo, id) { return (Mo.seat[id] || []).map(function (t) { return Mo.tb[t].map(function (x) { return x.replace(/^D|X$/g, ''); }).join(','); }); }

// ---- הכנה: מארח, ותיק שלמד מזמן, ושולחן ישן (לפני השחרור) שאיש בו לא למד ----
var host = person('host'), vet = person('vet'), legacy = person('leg'), legH = person('legh');
learn(vet, -100);
at(-50);
var ST = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_);
c.chPut_(ST, { 'שולחן': 'S1', 'מזהה': legH, 'ישב': iso(-50), 'יצא': '', 'סיבה': 'פתח', 'בדיקה': '' });
c.chPut_(ST, { 'שולחן': 'S1', 'מזהה': legacy, 'ישב': iso(-50), 'יצא': '', 'סיבה': 'הוזמן', 'בדיקה': '' });
var hc = code(host);
function choose(id, cd, h) { at(h); exec(); return c.chSit_({ id: id, ref: cd }, U); }
function newt(id, h) { at(h); exec(); return c.chNewT_({ id: id }, U); }
var D1 = 140, D2 = 308;   // ראשון 8.11 ו-15.11, 08:00 שעון ישראל (שעות מ-T0)

// ---- 1. בלי בחירה אין שיוך; עם בחירה — יושבים מיד, גם לפני סיום דף ----
var a = person('a', host, 1), b = person('b', host, 1), cc = person('c', host, 1), d = person('d', host, 1);
learn(cc, -40);                                        // c למד רק בשבוע שעבר
var M1 = sync(1.5);
ok(!M1.seat[a] && M1.pend[a] && !M1.pend[a].ch, 'registered via link, no choice → no seat');
ok(my(M1, a, hc).ref === 'old', 'single host → offered to join');
var s1 = choose(a, hc, 2);
ok(s1.ref === 'ok' && s1.me.ts.length === 1, 'choice → seated immediately (no page finished)', s1.me && s1.me.ts);
choose(b, hc, 2.1); choose(cc, hc, 2.2); choose(d, hc, 2.3);
var M2 = sync(3);
ok(JSON.stringify(tbl(M2, host)) === JSON.stringify(['host,a,b,c', 'host,d']), 'race by choice time: table 1 then 2', tbl(M2, host));

// ---- 2. ההתקדמות גלויה לחברי השולחן (לא רק למזמין) ----
prog(b, 4);
var M3 = sync(4.5), va = my(M3, a).me.ts[0];
var sb = va.seats.filter(function (x) { return x.n === 'b'; })[0];
ok(sb && (sb.s === 1 || sb.q > 0) && !sb.l, 'guest a sees b started (progress)', va.seats);
learn(d, 5);
var vd = my(sync(5.5), host).me.ts[1].seats.filter(function (x) { return x.n === 'd'; })[0];
ok(vd && vd.l, 'host sees d finished ✓', vd);

// ---- 3. "+": שולחן נוסף רק כשאין שולחן משלך עם מקום, ועד 3 בסך הכול ----
var Mp = sync(6);
ok(my(Mp, host).me.plus === 0, 'host has room (table 2) → no plus');
ok(my(Mp, a).me.plus === 1, 'guest a (1 table, none own) → plus');
var na = newt(a, 6.1);
ok(na.me.ts.length === 2 && na.me.ts.some(function (v) { return v.mine && v.seats.length === 1; }) && na.me.plus === 0, 'a opened own table; plus gone', na.me.ts);
var e = person('e', host, 7), f = person('f', host, 7), g = person('g', host, 7);
choose(e, hc, 7.1); choose(f, hc, 7.2); choose(g, hc, 7.3);   // שולחן 2 מתמלא: host,d,e,f; g — שולחן חדש
var M4 = sync(7.5);
ok(JSON.stringify(tbl(M4, host)) === JSON.stringify(['host,a,b,c', 'host,d,e,f', 'host,g']), 'auto third table when full', tbl(M4, host));
ok(my(M4, host).me.plus === 0, 'host at 3 tables → no plus');
var nh = newt(host, 7.6);
ok(nh.me.ts.length === 3, 'no 4th table by plus', nh.me.ts.length);
var h2 = person('h2', host, 8), i2 = person('i2', host, 8);
choose(h2, hc, 8.1); choose(i2, hc, 8.2);
var j2 = person('j2', host, 8.3), r4 = choose(j2, hc, 8.4);
ok(r4.ref === 'full' && !(r4.me.ts || []).length, 'joining a full host is refused at the click (no promise)', r4.ref);
var k2 = person('k2', host, 8.5);
var M5 = sync(8.6);
ok(JSON.stringify(tbl(M5, host)) === JSON.stringify(['host,a,b,c', 'host,d,e,f', 'host,g,h2,i2']) && !M5.seat[j2], 'cap 3 total', tbl(M5, host));
ok(my(M5, k2, hc).ref === 'full' && !my(M5, k2).me.pend.hs[0].t, 'host full → no promise to k2');

// ---- 4. זכאות לפי השבוע, בכל דף; התנאים הקיימים ----
learn(host, 20);                                  // דף ד
learn(a, 21, { daf: 'ה' });                       // דף אחר — נחשב
learn(b, 22);
learn(d, 23, { att: 1 });                         // נוכחות בשיעור (בלי זמן) — נחשבת
learn(e, 24, { min: 3 });                         // ✓ נראה, מתחת לעשר דקות — לא נחשב
learn(f, 25); learn(g, 26); learn(h2, 27); learn(i2, 28);
// בעל שולחן שלא ילמד, ושני חברים שילמדו
var o1 = person('o1'), oc = code(o1), p1 = person('p1', o1, 29), p2 = person('p2', o1, 29);
choose(p1, oc, 29.5); choose(p2, oc, 29.6); learn(p1, 30); learn(p2, 31);

// ---- 4א. ✓ בכיסא = סיים דף השבוע, לא לימוד ישן ----
var Mw = sync(D1 - 1), t1 = my(Mw, a).me.ts.filter(function (v) { return !v.mine; })[0];
var seen = {}; t1.seats.forEach(function (x) { seen[x.n || 'me'] = x.l; });
ok(seen.c === false && seen.b === true && seen.host === true, '✓ = this week only (c learned 6 days earlier → no ✓)', seen);

// ---- 5. אין הגרלה אוטומטית ביום ראשון ----
var Md0 = sync(D1 + 0.5);
ok(Md0.ms.length === 0 && Md0.seat[cc] && !Md0.nd, 'Sunday passed: no automatic draw, nobody left', Md0.ms.length);

// ---- 5א. "הגרלה עכשיו" — הקפאה בלי בחירה, ואיפוס אישי (גם בעל שולחן) ----
at(D1 + 1); exec();
var op = c.chAct_(U, {}, 'open');
ok(op.status === 'ok' && !op.sel, 'manual draw opened, no winner picked', op);
var Md = sync(D1 + 1.1);
var ms = Md.ms[Md.ms.length - 1], gt = {}; Md.grp.forEach(function (gg) { gt[gg.id] = gg.tb; });
var inDraw = ms ? ms.el.map(function (x) { return gt[x]; }) : [];
ok(ms && ms.st === c.CH_M_.ready && !ms.sel, 'draw waits for the admin pick (ready)', ms);
ok(inDraw.length === 1 && inDraw.indexOf(Md.seat[g][0]) >= 0 && inDraw.indexOf(Md.seat[p1][0]) < 0,
   'in draw: tables where all 4 really learned this week (table 3; table 2 out — e < 10 min)', inDraw);
ok(!Md.seat[cc] && !Md.seat[e], 'c (old learning) and e (<10 min) left', [Md.seat[cc], Md.seat[e]]);
ok(JSON.stringify(tbl(Md, host)) === JSON.stringify(['host,a,b', 'host,d,f', 'host,g,h2,i2']), 'only they left; others stay', tbl(Md, host));
ok(!Md.seat[legacy] && !Md.seat[legH], 'legacy table: owner and guest both left (did not learn)');
ok(!Md.seat[o1] && JSON.stringify(tbl(Md, p1)) === JSON.stringify(['p1,p2']), 'owner o1 left alone; p1,p2 stay', tbl(Md, p1));
ok(Md.own[Md.seat[p1][0]] === '', 'no new owner appointed', Md.own[Md.seat[p1][0]]);
var vp1 = my(Md, p1).me;
ok(vp1.ts[0].mine && vp1.plus === 0, 'remaining member treats the table as his (no plus while it has room)', vp1.ts[0]);
var mc = my(Md, cc).me;
ok(mc.ex === 1 && mc.ts.length === 0, 'c gets the gentle rejoin flag', mc);
var hist = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['מזהה'] === o1; });
ok(hist.length === 1 && hist[0]['יצא'] && hist[0]['סיבה'] === c.CH_WK_OUT_, 'history row kept (owner)', hist);
var nRows = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length;
var Md2 = sync(D1 + 3);
ok(c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length === nRows && Md2.ms.length === Md.ms.length, 'once per draw: rebuild changes nothing');
// הבחירה — בלחיצה נפרדת
at(D1 + 3.5); exec();
var dr = c.chAct_(U, { ms: String(ms.k), rq: 'test-rq-1' }, 'draw');
var Md3 = sync(D1 + 3.6), ms3 = Md3.ms[Md3.ms.length - 1];
ok(dr.status === 'ok' && ms3.st === c.CH_M_.pend && gt[ms3.sel] === Md.seat[g][0], 'admin pick → pending approval', [dr, ms3.st]);

// ---- 5ב. החברים שנשארו ממלאים את המקום שהתפנה ----
var p3 = person('p3', p1, D1 + 4), r5 = choose(p3, code(p1), D1 + 4.1);
var M5b = sync(D1 + 4.2);
ok(r5.ref === 'ok' && JSON.stringify(tbl(M5b, p3)) === JSON.stringify(['p1,p2,p3']), "p1's friend fills the freed seat", tbl(M5b, p3));

// ---- 6. חוזר בבחירה — יושב שוב; ההודעה נעלמת ----
var r6 = choose(cc, hc, D1 + 5);
ok(r6.ref === 'ok' && r6.me.ts.length === 1 && !r6.me.ex, 'c rejoins by choice', r6.me);

// ---- 7. אבא שאישר — נחשב כלימוד באמת של השבוע ----
var kid = person('kid', host, D1 + 5);
var par = 'DparX';
var PPH = 'pp' + 'parent';   // טלפון מומצא, לא מספר
c.appendCols_('לומדים', [['מזהה', par], ['שם', 'pa'], ['משפחה', 'מ999'], ['טלפון', PPH], ['ישיבה', 'י'], ['קוד ישיבה', 'givat'],
  ['תפקיד', 'הורה'], ['טלפון ההורה', '050000' + (1000 + N)], ['שם ההורה', 'kid']]);
at(D1 + 6);
c.appendCols_('זוגות', [['מזהה', par], ['שם', 'pa'], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', '5'], ['דף', 'ה'],
  ['דיווח', 'ההורה'], ['אושר', 'כן'], ['שם השותף', 'kid'], ['טלפון השותף', '050000' + (1000 + N)]]);
exec();
var RL = c.chReal_(U, function (x) { return x; }, Date.parse(iso(0)));
ok(RL[kid] && RL[kid].w.some(function (t) { return t > Date.parse(iso(D1)); }), 'father grant this week counts as real learning', RL[kid]);

// ---- 8. שבוע שני בלי לחיצה — אף אחד לא יוצא ----
var M8 = sync(D2 + 1);
ok(M8.seat[b] && M8.seat[g] && M8.ms.length === Md3.ms.length, 'week 2 without a manual draw: nobody leaves', [M8.seat[b], M8.seat[g]]);

// ---- 9. הזמנות מכמה חברים — כל אחת בחירה נפרדת, עד 3 שולחנות בסך הכול (8.99.443) ----
var X1 = person('x1'), X2 = person('x2'), X3 = person('x3'), X4 = person('x4'), X5 = person('x5');
var c1 = code(X1), c2 = code(X2), c3 = code(X3), c4 = code(X4), c5 = code(X5);
var mu = person('mu', X1, D2 + 2);                      // נרשם מהקישור של x1
at(D2 + 2.1); exec(); c.chOldAdd_(c2, mu, false);        // וגם הוזמן מ-x2
var M9 = sync(D2 + 2.2), i9 = my(M9, mu).me.inv || [];
ok(i9.length === 2 && i9.every(function (x) { return x.st === 'open' && x.c; }) && !M9.seat[mu], 'two invites, both open, no seat yet', i9);
var r9 = choose(mu, c1, D2 + 3);
var st9 = {}; (r9.me.inv || []).forEach(function (x) { st9[x.n] = x.st; });
ok(r9.ref === 'ok' && r9.me.ts.length === 1 && st9.x1 === 'in' && st9.x2 === 'open', 'chose x1 → seated; x2 still open', st9);
var r9b = choose(mu, c2, D2 + 3.1);
ok(r9b.ref === 'ok' && r9b.me.ts.length === 2, 'chose x2 too → 2 tables (no one-friend limit)', r9b.me.ts.length);
var rowsMu = function () { return c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['מזהה'] === mu && !r['יצא']; }).length; };
var n9 = rowsMu();
var r9c = choose(mu, c2, D2 + 3.2); choose(mu, c2, D2 + 3.21); sync(D2 + 3.3);
ok(r9c.ref === 'ok' && rowsMu() === n9, 'double click / reopen link / refresh — no duplicate seat', [r9c.ref, rowsMu(), n9]);
var hist9 = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['מזהה'] === mu && r['סיבה'] === 'הוזמן'; });
ok(hist9.every(function (r) { return r['מזמין']; }), 'seat rows record who invited', hist9.map(function (r) { return r['מזמין']; }));
// שתי בחירות שהגיעו יחד, כשנשאר מקום לשולחן אחד בלבד
at(D2 + 4); exec();
var OT = c.chTab_(c.CH_OLD_, c.CH_OLD_COLS_);
c.chPut_(OT, { 'מזהה': mu, 'מזמין': X3, 'נוסף': iso(D2 + 4), 'מצב': c.CH_O_.pick, 'בדיקה': '' });
c.chPut_(OT, { 'מזהה': mu, 'מזמין': X4, 'נוסף': iso(D2 + 4), 'מצב': c.CH_O_.pick, 'בדיקה': '' });
var M9c = sync(D2 + 4.1);
ok((M9c.seat[mu] || []).length === 3, 'simultaneous choices: cap 3 holds', (M9c.seat[mu] || []).length);
var st9c = {}; (my(M9c, mu, c4).me.inv || []).forEach(function (x) { st9c[x.n] = x.st; });
ok(my(M9c, mu, c4).ref === 'max' || my(M9c, mu, c4).ref === 'ok', 'at 3: link of the other → max (or already in)', my(M9c, mu, c4).ref);
var r9d = choose(mu, c5, D2 + 4.2);
ok(r9d.ref === 'max' && (r9d.me.ts || []).length === 3, 'fourth friend → refused (max), no seat', r9d.ref);
var mv = (r9d.me.inv || []).filter(function (x) { return x.st === 'max'; });
ok(mv.length >= 1, 'invite list explains the cap (max)', r9d.me.inv);
// מזמין שאין אצלו מקום
var HF = person('hf'), cf = code(HF);
for (var q9 = 0; q9 < 9; q9++) { var g9 = person('g9' + q9, HF, D2 + 4.5); choose(g9, cf, D2 + 4.6 + q9 * 0.01); }
var nb = person('nb', HF, D2 + 5);
var stF = (my(sync(D2 + 5.1), nb).me.inv || [])[0];
ok(stF && stF.st === 'full' && !stF.c, 'host without room → full, no button', stF);
// ישיבות קיימות לא זזו
ok(JSON.stringify(tbl(M9c, host)) === JSON.stringify(tbl(M8, host)), 'existing seats untouched', tbl(M9c, host));

console.log('checks', n, 'fails', fails);
var miss = Object.keys(M.missing).filter(function (k) { return !/flush|Logger/.test(k); });
if (miss.length) console.log('missing', miss.join(','));
// לגשר מ-Playwright (scratchpad): העולם אחרי כל התרחישים.
if (require.main === module) process.exit(fails ? 1 : 0);
else module.exports = { W: W, c: c, at: at, exec: exec, fails: fails };
