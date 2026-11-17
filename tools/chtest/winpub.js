// עמוד הזוכים (rafAll_) — השולחן שזכה בחבר מביא חבר (17.11.2026), מול apps-script.gs בזיכרון.
// node tools/chtest/winpub.js → קוד 1 בכישלון. משתמש בעולם של tables.js (שמות ומזהים מומצאים).
var T = require('./tables.js'), c = T.c;
var n = 0, fails = 0;
function ok(v, what, x) { n++; if (!v) { fails++; console.log('FAIL', what, x === undefined ? '' : JSON.stringify(x)); } }
T.exec();
var M0 = c.chModel_({ test: false }, true);
var pend = (M0.ms || []).filter(function (m) { return m.st === c.CH_M_.pend; });
ok(pend.length >= 1, 'a pending draw exists from tables.js', (M0.ms || []).map(function (m) { return m.st; }));
// לפני אישור — אין שולחן ברשימה
T.exec();
var L0 = c.rafAll_();
ok(L0.status === 'ok' && !L0.list.some(function (x) { return x.ch; }), 'pending draw is not published', L0);
// אישור
var k = String(pend[pend.length - 1].k);
var ap = c.chAct_({ test: false }, { ms: k }, 'approve');
ok(ap && ap.status === 'ok', 'approve ok', ap);
T.exec();
c.chModel_({ test: false }, true);
T.exec();
var L1 = c.rafAll_(), it = null;
L1.list.forEach(function (x) { if (x.ch) it = x; });
ok(!!it, 'approved table appears in the winners list', L1);
ok(it && it.ch.length === 1 && it.ch[0].w.length === 4, 'four names', it);
ok(it && it.ch[0].w.every(function (w) { return w.name && w.name.indexOf(' ') > 0; }), 'full names (first + last)', it && it.ch[0].w);
ok(it && it.wk >= 1 && it.w && it.w.length === 0, 'week entry, no weekly winners mixed in', it);
console.log('checks', n, 'fails', fails);
process.exit(fails ? 1 : 0);
