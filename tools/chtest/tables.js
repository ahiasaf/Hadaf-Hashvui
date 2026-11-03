// חבר מביא חבר — כללי השולחנות (8.99.441), מול apps-script.gs עצמו בזיכרון.
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
var Mpre = sync(D1 - 1);
ok(Mpre.ms.length === 0, 'no draw before Sunday');

// ---- 5. ההגרלה ביום ראשון, והאיפוס האישי ----
var Md = sync(D1 + 0.5);
var wk = Md.ms.filter(function (m) { return m.date; });
var gt = {}; Md.grp.forEach(function (gg) { gt[gg.id] = gg.tb; });
var inDraw = wk.length ? wk[0].el.map(function (x) { return gt[x]; }) : [];
ok(wk.length === 1, 'one weekly draw', wk.length);
ok(inDraw.length === 2 && inDraw.indexOf(Md.seat[g][0]) >= 0 && inDraw.indexOf(Md.seat[d] ? Md.seat[d][0] : '') >= 0,
   'in draw: tables where all 4 show ✓ this week (table 1 out — c only last week)', inDraw);
var sel = wk[0] && Md.grp.filter(function (gg) { return gg.id === wk[0].sel; })[0];
ok(sel && sel.tb === Md.seat[g][0], 'auto-pick only the table where all really learned (e < 10 min excluded)', sel);
ok(!Md.seat[cc] && !Md.seat[e], 'c (last week only) and e (<10 min) left', [Md.seat[cc], Md.seat[e]]);
ok(JSON.stringify(tbl(Md, host)) === JSON.stringify(['host,a,b', 'host,d,f', 'host,g,h2,i2']), 'only they left; others stay', tbl(Md, host));
ok(JSON.stringify(tbl(Md, a)) === JSON.stringify(['host,a,b', 'a']), 'a keeps both tables');
ok(!Md.seat[legacy] && JSON.stringify(tbl(Md, legH)) === JSON.stringify(['legh']), 'legacy guest left; owner stays (pending decision)', tbl(Md, legH));
var mc = my(Md, cc).me;
ok(mc.ex === 1 && mc.ts.length === 0, 'c gets the gentle rejoin flag', mc);
var hist = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['מזהה'] === cc; });
ok(hist.length === 1 && hist[0]['יצא'] && hist[0]['סיבה'] === c.CH_WK_OUT_ && hist[0]['שולחן'], 'history row kept with exit + reason', hist);
var nRows = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length;
var Md2 = sync(D1 + 3);
ok(c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.length === nRows && Md2.ms.length === Md.ms.length, 'once per draw: rebuild changes nothing');

// ---- 6. חוזר בבחירה — יושב שוב; ההודעה נעלמת ----
var r6 = choose(cc, hc, D1 + 4);
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

// ---- 8. שבוע שני: מי שלא למד יוצא — בעלים נשארים ----
var M8 = sync(D2 + 1);
ok(!M8.seat[b] && !M8.seat[g], 'week 2: guests who did not learn left', [M8.seat[b], M8.seat[g]]);
ok((M8.seat[host] || []).length === 3, 'host (owner) keeps all tables', tbl(M8, host));

console.log('checks', n, 'fails', fails);
var miss = Object.keys(M.missing).filter(function (k) { return !/flush|Logger/.test(k); });
if (miss.length) console.log('missing', miss.join(','));
// לגשר מ-Playwright (scratchpad): העולם אחרי כל התרחישים.
if (require.main === module) process.exit(fails ? 1 : 0);
else module.exports = { W: W, c: c, at: at, exec: exec, fails: fails };
