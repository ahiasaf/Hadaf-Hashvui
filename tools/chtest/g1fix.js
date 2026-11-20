// החלפה שקטה של שובר שגוי על שולחן שכבר אושר (8.99.562).
// שולחן אושר עם ארוחת ילדים (burger) והתראה נשלחה → hvch: הקומבינה לראש השולחן, בלי התראה נוספת,
// היסטוריה על הישן, הישן לא חוזר למלאי. ניסיון חוזר — לא מקצה ולא שולח.
// node tools/chtest/g1fix.js — מזהים וקודים מומצאים.
var T = require('./tables.js'), c = T.c;
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
function msRow(k) { return c.chTab_(c.CH_MS_, c.CH_MS_COLS_).rows.filter(function (r) { return String(r['הגרלה']) === String(k) && r['בדיקה'] !== 'כן'; })[0]; }
T.exec();
var M = c.chSync_(U), ms = null;
M.ms.forEach(function (m) { if (m.st === c.CH_M_.pend) ms = m; });
var G = c.chGrpRow_(U, ms.sel).g, head = G['מזמין'], rid = 'ch:' + G['קבוצה'];
var vt = 'השולחן שלכם זכה!', vb = '{name} קיבל את השובר.';
// המצב הישן: אישור עם ארוחת ילדים
post({ action: 'vchadd', key: 'k', bid: 'a', rows: [{ t: 'ארוחת ילדים', p: 'burger', c: 'KID-1', x: '2026-12-30' }] });
c.CH_VCH_P_ = 'burger';
T.exec();
var a = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'approve');
c.CH_VCH_P_ = 'meal4';
ok(a.status === 'ok' && sent.length === 1 && msRow(ms.k)['קוד שובר'] === 'KID-1', 'old state: kids meal + push sent', a);
// בלי קומבינה במלאי — הודעה ברורה, שום דבר לא זז
T.exec();
var h0 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'hvch');
ok(h0.status === 'error' && /ארוחה לארבעה/.test(h0.message) && msRow(ms.k)['קוד שובר'] === 'KID-1' && sent.length === 1, 'no combo → clear error, unchanged', h0);
// הניהול מציע את ההחלפה
T.exec();
var AD = c.chAdm_(c.chSync_(U), U), xa = AD.ms.filter(function (x) { return String(x.k) === String(ms.k); })[0];
ok(xa.vk === 1, 'admin sees replace offer (vk)', xa.vk);
// קומבינות בלי מזהה פרס
post({ action: 'vchadd', key: 'k', bid: 'b', rows: [{ t: 'ארוחת קומבינה לארבעה', p: 'burger', c: 'CMB-1', x: '2026-12-30' },
  { t: 'ארוחת קומבינה לארבעה', p: 'burger', c: 'CMB-2', x: '2026-12-30' }] });
var V = c.vchTbl_(true);
for (var q = 1; q < V.rows.length; q++) if (/^CMB/.test(V.c(q, 'קוד'))) V.sh.getRange(q + 1, V.ix['פרס'] + 1).setValue('');
T.exec();
var h1 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'hvch');
var R1 = msRow(ms.k);
ok(h1.status === 'ok' && h1.fixed === 1 && /^CMB-/.test(R1['קוד שובר']), 'replaced with combo', [h1, R1['קוד שובר']]);
ok(sent.length === 1, 'silent: no new push', sent.length);
ok(JSON.parse(R1['הודעת שובר']).st === 'sent', 'push state unchanged');
V = c.vchTbl_(false);
var kid = -1, nAss = 0;
for (q = 1; q < V.rows.length; q++) {
  if (V.c(q, 'קוד') === 'KID-1') kid = q;
  if (V.c(q, 'הגרלה') === rid && V.c(q, 'סטטוס') === 'שויך') nAss++;
}
ok(V.c(kid, 'סטטוס') === 'בוטל' && V.c(kid, 'הערה').indexOf(c.VCH_EXPOSED_) >= 0 && V.c(kid, 'שויך לתלמיד') === head, 'old voucher cancelled, history kept', V.rows[kid]);
ok(nAss === 1, 'exactly one active voucher on the table', nAss);
ok(c.vchBack_({ vid: V.c(kid, 'מזהה') }).status === 'error', 'old voucher not returned to stock');
// הבית של ראש השולחן — הקומבינה
var P1 = raf({ raffle: 'prize', id: head, fresh: '1' });
var it = (P1.list || []).filter(function (x) { return x.ch; })[0];
ok(it && it.v && /^CMB-/.test(it.v.c) && it.v.st === 'in' && it.p === 'meal4', 'head sees combo at home', it);
// ניסיון חוזר — לא מקצה ולא שולח
T.exec();
var h2 = c.chAct_(U, { ms: String(ms.k), vt: vt, vb: vb }, 'hvch');
ok(h2.status === 'error' && sent.length === 1, 'retry → refused, nothing sent', h2);
var nAss2 = 0; V = c.vchTbl_(false);
for (q = 1; q < V.rows.length; q++) if (V.c(q, 'הגרלה') === rid && V.c(q, 'סטטוס') === 'שויך') nAss2++;
ok(nAss2 === 1, 'still one voucher', nAss2);
var AD2 = c.chAdm_(c.chSync_(U), U), xb = AD2.ms.filter(function (x) { return String(x.k) === String(ms.k); })[0];
ok(!xb.vk && /^CMB-/.test(xb.code), 'admin: no more offer', xb);
console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
