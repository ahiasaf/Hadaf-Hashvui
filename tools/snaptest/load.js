// עומס ערב: 70% פתיחות בית, 22% סיום דף, 8% חידון. כמה חישובים מלאים?
var M = require('./mock.js'); var W = M.makeWorld(), c = W.ctx;
var seed = 7; function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
function exec() { c.SNAP_CUR_ = null; c.SNAP_TAIL_ = {}; c.SS_OPEN_ = {}; }
var P = []; for (var i = 0; i < 400; i++) { P.push('S' + i); c.appendCols_('לומדים', [['מזהה', 'S' + i], ['שם', 'a' + i], ['משפחה', 'b' + i], ['טלפון', 'ph' + i], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]); }
var b = 0, o1 = c.rafCalc_; c.rafCalc_ = function () { b++; return o1.apply(this, arguments); };
var bp = 0, o2 = c.ptsAll_ && c.quizBest_; var oq = c.quizBest_; c.quizBest_ = function () { bp++; return oq.apply(this, arguments); };
var opens = 0, t0 = Date.now();
for (var s = 0; s < 1000; s++) {
  var id = P[Math.floor(rnd() * P.length)], r = rnd(); exec();
  if (r < .70) { opens++; c.ptsMe_({ id: id }); }
  else if (r < .92) { c.appendCols_('לימוד', [['מזהה', id], ['קוד ישיבה', 'givat'], ['מסלול', 'taanit'], ['שבוע', 4], ['דף', rnd() < .5 ? 'ד.' : 'ד:'], ['זמן בדף (דקות)', '12'], ['מכשיר', id]]); }
  else c.appendCols_('חידות', [['מזהה', id], ['דף', 'taanit|ד'], ['קטע', 'החידון כולו'], ['ציון', '4/5'], ['ניסיון', '1'], ['מכשיר', id]]);
}
console.log((process.env.GS || 'apps-script.gs').split('/').pop(), '— home opens:', opens, '· full raffle calculations:', b, '· quiz-tab full reads:', bp, '· ms', Date.now() - t0);
