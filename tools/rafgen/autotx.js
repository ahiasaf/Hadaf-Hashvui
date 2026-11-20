// הנוסחים של ההגרלות האוטומטיות בלי כניסה לניהול (8.99.555): "טקסטים" גובר, אחרת data.js מהאתר.
// node tools/rafgen/autotx.js → קוד 1 אם בדיקה נכשלה.
var fs = require('fs'), M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
var vm = require('vm'), dc = {}; vm.createContext(dc);
vm.runInContext(fs.readFileSync(__dirname + '/../../data.js', 'utf8') + ';this.U=UI', dc);
var SRC = fs.readFileSync(__dirname + '/../../data.js', 'utf8'), calls = 0;
c.UrlFetchApp = { fetch: function () { calls++; return { getResponseCode: function () { return 200; }, getContentText: function () { return SRC; } }; } };
c.appendCols_('טקסטים', [['מפתח', 'ui.rafWinT'], ['נוסח', 'כותרת שנערכה']]);
var r = JSON.parse(c.raffleRoute_({ parameter: { raffle: 'autost', key: 'k', fill: '1' } }).t);
var pr = c.PropertiesService.getScriptProperties(), tx = JSON.parse(pr.getProperty('RAF_AUTO_TX'));
ok(tx.wt === 'כותרת שנערכה', 'edited text wins', tx);
ok(tx.wb === dc.U.rafWinB && tx.db === dc.U.rafDadB, 'defaults from data.js', tx);
ok(JSON.parse(pr.getProperty('CH_AUTO_TX')).vb === dc.U.chHeadVchB, 'table text');
ok(pr.getProperty('VCH_PUSH_AT') === dc.U.vchAutoT && pr.getProperty('VCH_PUSH_B') === dc.U.vchGotB, 'voucher texts');
var pn = JSON.parse(pr.getProperty('VCH_PRZ_N'));
ok(pn.pizza === dc.U.przN_pizza && pn.burger === dc.U.przN_burger, 'prize names', pn);
ok(r.raf.wb > 0 && r.ch.vb > 0 && r.vch.names === 5, 'autost shows saved', r);
c.raffleRoute_({ parameter: { raffle: 'wadm', key: 'k', vb: 'x', rwb: 'מהניהול' } });
c.autoTxFill_(); var k0 = calls; c.autoTxFill_();
ok(JSON.parse(pr.getProperty('RAF_AUTO_TX')).wb === 'מהניהול' && calls === k0, 'admin value kept; nothing fetched when complete');
console.log(n - fails + '/' + n + ' passed');
process.exit(fails ? 1 : 0);
