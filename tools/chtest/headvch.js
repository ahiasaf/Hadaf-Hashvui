// השולחן הזוכה (8.99.540): באישור — ראש השולחן מקבל שובר בורגר, וחברי השולחן מקבלים התראה.
// מול apps-script.gs בזיכרון (העולם של tables.js). **שום דבר לא יוצא:** UrlFetchApp — לוכד.
// node tools/chtest/headvch.js  → קוד 1 אם בדיקה נכשלה. מזהים וקודים מומצאים.
var T = require('./tables.js'), c = T.c, W = T.W;
var fails = 0, n = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
c.Utilities.getUuid = function () { return require('crypto').randomUUID(); };
var sent = [];
c.UrlFetchApp = { fetch: function (url, o) { sent.push(JSON.parse(o.payload)); return { getResponseCode: function () { return 204; } }; } };
var PR = c.PropertiesService.getScriptProperties();
PR.setProperty('GH_TOKEN', 'x'); PR.setProperty('GH_REPO', 'mock/mock'); PR.setProperty('READ_KEY', 'k');
var U = { test: false };
function raf(p) { T.exec(); return JSON.parse(c.raffleRoute_({ parameter: p }).t); }
function post(d) { T.exec(); return JSON.parse(c.doPost({ postData: { contents: JSON.stringify(d) } }).t); }
T.exec();
var M = c.chSync_(U), ms = null;
M.ms.forEach(function (m) { if (m.st === c.CH_M_.pend) ms = m; });
ok(!!ms, 'world has a table waiting for approval');
var G = c.chGrpRow_(U, ms.sel).g, head = G['מזמין'], mem = [G['חבר 1'], G['חבר 2'], G['חבר 3']];
ok(head && mem.every(Boolean), 'group has head + 3', G);
// ראש השולחן = מי שישב ראשון מבין הארבעה
var seat = c.chTab_(c.CH_SEAT_, c.CH_SEAT_COLS_).rows.filter(function (r) { return r['שולחן'] === G['שולחן'] && !r['יצא']; });
var first = seat.slice().sort(function (a, b) { return Date.parse(a['ישב']) - Date.parse(b['ישב']); })[0];
ok(first && M.al[first['מזהה']] ? M.al[first['מזהה']] === head : first['מזהה'] === head, 'head = earliest seated', [first, head]);
var vt = 'השולחן שלכם זכה!', vb = '{name} קיבל את השובר לארוחה עבור כל השולחן.';

// 1. אין שובר במלאי — האישור נעצר, שום דבר לא נשמר ולא נשלח
var e1 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'approve');
T.exec();
var M1 = c.chSync_(U), m1 = M1.ms.filter(function (m) { return m.k === ms.k; })[0];
ok(e1.status === 'error' && /אין שובר/.test(e1.message), 'no stock → error', e1);
ok(m1.st === c.CH_M_.pend && sent.length === 0, 'no stock → still pending, nothing sent', m1.st);

// 2. יש שובר בורגר (ושובר פיצה) — אישור
var A = post({ action: 'vchadd', key: 'k', bid: 'h1', rows: [
  { t: 'פיצה', p: 'pizza', c: 'PZ-9', x: '2026-12-31' },
  { t: 'ארוחה', p: 'meal4', c: 'BG-7', u: 'https://x.example/7', x: '2026-12-30' }] });
ok(A.status === 'ok' && A.add === 2, 'stock added', A);
T.exec();
var r2 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'approve');
ok(r2.status === 'ok' && r2.vch === 1 && r2.push === 'sent' && !r2.warn, 'approve → voucher + push', r2);
var V = c.vchTbl_(false), row = -1;
for (var i = 1; i < V.rows.length; i++) if (V.c(i, 'קוד') === 'BG-7') row = i;
ok(V.c(row, 'סטטוס') === 'שויך' && V.c(row, 'שויך לתלמיד') === head && V.c(row, 'הגרלה') === 'ch:' + G['קבוצה'] &&
   V.c(row, 'אופן') === c.CH_VCH_HOW_, 'burger voucher assigned to head', V.rows[row]);
ok(V.c(row, 'מזהי הזוכה').split(' ').indexOf(head) >= 0, 'all head ids stored');
for (i = 1; i < V.rows.length; i++) if (V.c(i, 'קוד') === 'PZ-9') ok(V.c(i, 'סטטוס') === 'זמין', 'pizza untouched');
ok(sent.length === 1, 'one dispatch', sent.length);
var cp = sent[0] && sent[0].client_payload, f = cp ? JSON.parse(cp.flt) : {};
var hf = (M.ppl[head] || {}).f || '';
ok(mem.every(function (x) { return f.ids.indexOf(x) >= 0; }), 'all 3 members notified', f.ids);
ok(f.ids.indexOf(head) < 0, 'head not notified', f.ids);
ok(cp.body === hf + ' קיבל את השובר לארוחה עבור כל השולחן.' && cp.title === vt && cp.url === 'chaver', 'text with head first name', cp);
T.exec();
var M2 = c.chSync_(U), m2 = M2.ms.filter(function (m) { return m.k === ms.k; })[0];
ok(m2.st === c.CH_M_.ok, 'draw approved');
var MR = c.chTab_(c.CH_MS_, c.CH_MS_COLS_).rows.filter(function (r) { return String(r['הגרלה']) === String(ms.k) && r['בדיקה'] !== 'כן'; })[0];
ok(MR['קוד שובר'] === 'BG-7' && JSON.parse(MR['הודעת שובר']).st === 'sent', 'code + push state saved on draw row', MR);

// 2א. השולחן אחרי הזכייה (8.99.557): "השובר אצלך" לראש, "אצל {name}" לחבר
var tb = (M2.grp.filter(function (g) { return g.id === ms.sel; })[0] || {}).tb;
if (tb) {
  var vh = c.chTblView_(M2, tb, head), vm = c.chTblView_(M2, tb, mem[0]);
  ok(vh.st === 'won' && vh.hm === 1 && vh.hd === hf, 'head view: won, voucher with me', vh);
  ok(vm.st === 'won' && vm.hm === 0 && vm.hd === hf, 'member view: voucher with head', vm);
}

// 2ב. שובר אחורה (8.99.559): כבר יש — נדחה; בלי קוד (כמו אישור ישן) — אותו שובר, בלי חדש, והתראה
ok(c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'hvch').status === 'error', 'hvch refused when code exists');
var MT = c.chTab_(c.CH_MS_, c.CH_MS_COLS_), MR2 = MT.rows.filter(function (r) { return String(r['הגרלה']) === String(ms.k) && r['בדיקה'] !== 'כן'; })[0];
MR2['קוד שובר'] = ''; c.chPut_(MT, MR2); T.exec();
var ns = sent.length, rh = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'hvch');
var MR3 = c.chTab_(c.CH_MS_, c.CH_MS_COLS_).rows.filter(function (r) { return String(r['הגרלה']) === String(ms.k) && r['בדיקה'] !== 'כן'; })[0];
ok(rh.status === 'ok' && MR3['קוד שובר'] === 'BG-7' && sent.length === ns, 'hvch: same voucher, push already sent → not again', [rh, MR3['קוד שובר']]);
var nAss = 0, V9 = c.vchTbl_(false); for (var q9 = 1; q9 < V9.rows.length; q9++) if (V9.c(q9, 'שויך לתלמיד') === head) nAss++;
ok(nAss === 1, 'no second voucher', nAss);
var AD = c.chAdm_(c.chSync_(U), U), xa = AD.ms.filter(function (x) { return String(x.k) === String(ms.k); })[0];
ok(xa && xa.code === 'BG-7' && !xa.vk, 'adm shows code after hvch (button gone)', xa && [xa.code, xa.vk]);

// 3. הבית של ראש השולחן — "לצפייה בשובר"; של חבר — כלום
var P1 = raf({ raffle: 'prize', id: head, fresh: '1' });
var it = (P1.list || []).filter(function (x) { return x.ch; })[0];
ok(it && it.v && it.v.c === 'BG-7' && it.v.st === 'in' && it.pp === 1 && it.p === 'meal4', 'head sees voucher at home', P1);
var P2 = raf({ raffle: 'prize', id: mem[0], fresh: '1' });
ok(!(P2.list || []).some(function (x) { return x.v; }), 'member has no voucher', P2);
ok(!(raf({ raffle: 'prize', id: head, role: 'dad', fresh: '1' }).list || []).some(function (x) { return x.ch; }), 'not via role=dad');
// נצפה ומימשתי — רק לראש השולחן
var sv0 = raf({ raffle: 'vseen', id: mem[0], vid: it.v.id });
ok(sv0.status === 'denied', 'member cannot mark seen', sv0);
var sv = raf({ raffle: 'vseen', id: head, vid: it.v.id });
ok(sv.status === 'ok' && sv.sn[it.v.id], 'head seen recorded', sv);
ok(raf({ raffle: 'vused', id: mem[1], vid: it.v.id }).status === 'denied', 'member cannot mark used');
var us = raf({ raffle: 'vused', id: head, vid: it.v.id });
ok(us.status === 'ok' && us.v.st === 'used', 'head marks used', us);

// 4. אישור שוב — לא אפשרי, לא נשלח שוב, לא שובר שני
T.exec();
var r4 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'approve');
ok(r4.status === 'error' && sent.length === 1, 'approve again → refused, nothing sent (1 approve only)', r4);
// 5. מסירה בלי קוד — הקוד נשמר
T.exec();
var r5 = c.chAct_(U, { ms: String(ms.k) }, 'deliver');
var MR5 = c.chTab_(c.CH_MS_, c.CH_MS_COLS_).rows.filter(function (r) { return String(r['הגרלה']) === String(ms.k) && r['בדיקה'] !== 'כן'; })[0];
ok(r5.status === 'ok' && MR5['קוד שובר'] === 'BG-7', 'deliver without code keeps voucher code', MR5['קוד שובר']);
// 6. מי שאינו זוכה בשום דבר — רשימה ריקה
ok((raf({ raffle: 'prize', id: 'DNOBODYX', fresh: '1' }).list || []).length === 0, 'non-winner: empty');
// 7. (8.99.561) שובר מסוג אחר על שולחן — מוחלף בארוחה לארבעה רק כשיש במלאי
ok(c.CH_VCH_P_ === 'meal4', 'table voucher type = meal4');
post({ action: 'vchadd', key: 'k', bid: 'h7', rows: [{ t: 'ארוחת ילדים', p: 'burger', c: 'BG-9', x: '2026-12-30' }] });
T.exec();
var V7 = c.vchTbl_(true), v7 = c.issueVoucher_('DX7', 'burger', { V: V7, rid: 'ch:X7', ws: ['DX7'], how: 'x' });
ok(v7 && v7.c === 'BG-9', 'wrong-type voucher on table (setup)', v7);
var f0 = c.chVchFix_(c.vchTbl_(true), 'ch:X7');
var V7b = c.vchTbl_(true), r7 = c.chVchRow_(V7b, 'ch:X7');
ok(f0.err && r7 > 0 && V7b.c(r7, 'קוד') === 'BG-9', 'no meal4 stock → nothing changes', f0);
// קומבינה שנטענה בלי מזהה פרס (ו"פרס" = burger בטעות) — מזוהה כארוחה לארבעה, בלי לכתוב לגיליון
post({ action: 'vchadd', key: 'k', bid: 'h8', rows: [{ t: 'ארוחת קומבינה לארבעה', p: 'burger', c: 'M4-1', x: '2026-12-30' },
  { t: 'ארוחת קומבינה לארבעה', p: 'burger', c: 'M4-2', x: '2026-12-30' }] });
T.exec();
var V8 = c.vchTbl_(true), m42 = -1;
for (var q8 = 1; q8 < V8.rows.length; q8++) if (V8.c(q8, 'קוד') === 'M4-2') m42 = q8;
V8.sh.getRange(m42 + 1, V8.ix['פרס'] + 1).setValue('');
T.exec();
var V9b = c.vchTbl_(true), kinds = {};
for (var q9b = 1; q9b < V9b.rows.length; q9b++) kinds[V9b.c(q9b, 'קוד')] = V9b.c(q9b, 'פרס');
ok(kinds['M4-1'] === 'meal4' && kinds['M4-2'] === 'meal4' && kinds['BG-9'] === 'burger' && kinds['PZ-9'] === 'pizza', 'combo recognized; kids meal / pizza untouched', kinds);
ok(String(V9b.sh.getRange(m42 + 1, V9b.ix['פרס'] + 1).getValue()) === '', 'recognition does not write the sheet');
var bgOnly = c.issueVoucher_('DX9', 'burger', { V: V9b, rid: 'w:X9', ws: ['DX9'], how: 'x' });
ok(!bgOnly, 'kids meal winner never gets a combo (no burger left → null)', bgOnly);
var V7c = c.vchTbl_(true), f1 = c.chVchFix_(V7c, 'ch:X7');
var bg9 = -1; for (var q7 = 1; q7 < V7c.rows.length; q7++) if (V7c.c(q7, 'קוד') === 'BG-9') bg9 = q7;
ok(f1.ok && V7c.c(bg9, 'סטטוס') === 'בוטל' && c.chVchRow_(V7c, 'ch:X7') < 0, 'old voucher cancelled', f1);
ok(V7c.c(bg9, 'הערה').indexOf(c.VCH_EXPOSED_) >= 0 && V7c.c(bg9, 'הערה').indexOf('ch:X7') >= 0, 'history kept on old voucher', V7c.c(bg9, 'הערה'));
var bk = c.vchBack_({ vid: V7c.c(bg9, 'מזהה') });
ok(bk.status === 'error', 'exposed voucher not returned to stock', bk);
var v8 = c.issueVoucher_('DX7', 'meal4', { V: V7c, rid: 'ch:X7', ws: ['DX7'], how: 'x' });
ok(v8 && /^M4-/.test(v8.c) && v8.p === 'meal4', 'meal4 issued after fix', v8);
ok(c.chVchFix_(c.vchTbl_(true), 'ch:X7').none, 'meal4 on table → nothing to fix');
var SK = c.vchStock_(c.vchTbl_(true));
ok(SK.by.meal4 && SK.by.meal4.s === 1 && SK.by.meal4.a === 1, 'stock lists meal4', SK.by.meal4);
console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
