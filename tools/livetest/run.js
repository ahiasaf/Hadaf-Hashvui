// שיעור חי (8.99.605) — השרת (liveRoute_ ב-vm) ועמוד המשתתף live.html מול אותו שרת.
// NODE_PATH=$(npm root -g) node tools/livetest/run.js → קוד 1 אם בדיקה נכשלה. נתונים מומצאים.
var M = require('../snaptest/mock.js'), http = require('http'), fs = require('fs'), path = require('path');
var pw = require('playwright');
var ROOT = path.join(__dirname, '..', '..'), n = 0, fails = 0;
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function G(W, P) { return JSON.parse(W.ctx.doGet({ parameter: P }).t); }
function srv() {
  return new Promise(function (res) {
    var s = http.createServer(function (q, r) {
      var p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      var f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); }
      r.setHeader('content-type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.js$/.test(f) ? 'application/javascript' : 'application/octet-stream');
      r.end(fs.readFileSync(f));
    }).listen(0, function () { res(s); });
  });
}
async function ctxOf(b, W, init) {
  var ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, pw.devices['iPhone 13']));
  await ctx.route(/script\.google\.com/, async function (rt) {
    var u = new URL(rt.request().url()), P = {};
    u.searchParams.forEach(function (v, k) { P[k] = v; });
    if (P.c != null || P.sid != null || P.rt != null) return rt.fulfill({ status: 200, contentType: 'text/html', body: '<html>err</html>' });
    var out = W.ctx.doGet({ parameter: P }).t;
    if (P.callback) out = P.callback + '(' + out + ')';
    rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out });
  });
  await ctx.route(/\/api\/gs/, function (rt) { rt.abort(); });
  if (init) await ctx.addInitScript(init);
  return ctx;
}
(async function () {
  var W = M.makeWorld(), c = W.ctx;
  var J = c.sheet_('לומדים');
  J.getRange(1, 1, 5, 10).setValues([
    ['מזהה', 'שם', 'משפחה', 'טלפון', 'ישיבה', 'תפקיד', 'בדיקה', 'קוד ישיבה', 'שכבה', 'כיתה'],
    ['U1', 'אלף', 'בית', '0501234567', 'ישיבה א', 'תלמיד', '', 'yesa', 'ט׳', '2'],
    ['U2', 'גימל', 'דלת', '0529999999', 'ישיבה א', 'תלמיד', '', 'yesa', 'ט׳', '3'],
    ['U3', 'הא', 'דלת', '0529999999', 'ישיבה א', 'תלמיד', '', 'yesa', 'ט׳', '3'],
    ['U4', 'זין', 'חית', '0541111111', 'ישיבה ב', 'תלמיד', 'כן', 'yesb', 'ח׳', '1']]);
  // בלי סיסמה — אין פתיחה
  ok(G(W, { live: 'start' }).status === 'denied', 'start no key');
  ok(G(W, { live: 'get', s: 'ABCDEF' }).on === 0, 'get nothing');
  var st = G(W, { live: 'start', key: 'k' });
  ok(st.status === 'ok' && /^[A-Z0-9]{6}$/.test(st.s), 'start', st);
  var S = st.s;
  ok(G(W, { live: 'start', key: 'k' }).s === S, 'start again same session');
  ok(!W.pub.getSheetByName('שיעור חי') && W.priv.getSheetByName('שיעור חי'), 'tab private');
  var g0 = G(W, { live: 'get', s: S });
  ok(g0.on === 1 && !g0.q, 'get no q', g0);
  // מזהים
  var h1 = G(W, { live: 'hi', s: S, id: 'U1' });
  ok(h1.st === 'ok' && h1.tk && h1.tk.indexOf('U1') < 0 && h1.first === 'אלף', 'hi id', h1);
  ok(G(W, { live: 'hi', s: S, id: 'NOPE' }).st === 'none', 'hi unknown id');
  ok(G(W, { live: 'hi', s: S, ph: '052-9999999' }).st === 'many', 'hi many');
  var h3 = G(W, { live: 'hi', s: S, ph: '0529999999', first: 'הא' });
  ok(h3.st === 'ok' && h3.first === 'הא', 'hi first', h3);
  ok(G(W, { live: 'hi', s: S, ph: '0541111111' }).st === 'none', 'test world not found');
  // תשובה לפני חידה
  ok(G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'x', a: 0 }).status === 'error', 'ans no q');
  // המארח פותח חידה
  var set1 = G(W, { live: 'set', key: 'k', s: S, qid: 'Q1', d: 'taanit|ו', w: 'taanit-5', q: 'שאלה ראשונה', a: JSON.stringify(['א', 'ב', 'ג']), cr: 1 });
  ok(set1.q === 'Q1', 'set1', set1);
  ok(G(W, { live: 'set', s: S, qid: 'Q1' }).status === 'denied', 'set no key');
  var g1 = G(W, { live: 'get', s: S });
  ok(g1.q && g1.q.id === 'Q1' && g1.q.a.length === 3 && g1.q.c === undefined && JSON.stringify(g1).indexOf('"cr"') < 0, 'get q no correct', g1);
  ok(G(W, { live: 'ans', s: S, tk: 'vbad', qid: 'Q1', a: 1 }).status === 'none', 'bad tk');
  ok(G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'Q1', a: 0 }).a === 0, 'ans1 wrong');
  ok(G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'Q1', a: 1 }).a === 1, 'ans1 change right');
  ok(G(W, { live: 'ans', s: S, tk: h3.tk, qid: 'Q1', a: 2 }).a === 2, 'ans3 wrong');
  var stt = G(W, { live: 'stat', key: 'k', s: S });
  ok(stt.n === 2 && stt.ans === 2 && stt.nq === 1, 'stat', stt);
  G(W, { live: 'set', key: 'k', s: S, qid: 'Q2', d: 'taanit|ו', w: 'taanit-5', q: 'שנייה', a: JSON.stringify(['כן', 'לא']), cr: 0 });
  ok(G(W, { live: 'stat', key: 'k', s: S }).ans === 0, 'stat new q 0');
  G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'Q2', a: 0 });
  // אסימון אחרי שהמטמון התרוקן — מהלשונית
  Object.keys(W.cache ? W.cache.m : {}).forEach(function () {});
  // הטלפון (דפדפן) ---------------------------------------------
  var server = await srv(), port = server.address().port, B = await pw.chromium.launch();
  // מכשיר עם האפליקציה (df:me)
  var ctxA = await ctxOf(B, W, 'try{localStorage.setItem("df:me", JSON.stringify({id:"U2",first:"גימל"}));}catch(e){}');
  var pA = await ctxA.newPage();
  await pA.goto('http://localhost:' + port + '/live.html?s=' + S);
  await pA.waitForSelector('#qc:not([hidden])', { timeout: 8000 });
  ok(await pA.textContent('#qq') === 'שנייה', 'phone sees current q');
  ok((await pA.textContent('#sub')).indexOf('גימל') >= 0, 'hello name');
  await pA.click('#opts button:nth-child(2)');
  await pA.waitForSelector('#ok:not([hidden])', { timeout: 5000 });
  ok((await pA.textContent('#ok')).indexOf('✓') >= 0, 'sent ✓');
  if (process.env.SHOT) await pA.screenshot({ path: process.env.SHOT });
  ok(await pA.$eval('#opts button:nth-child(2)', function (e) { return e.className; }) === 'on', 'chosen on');
  // המארח מחליף חידה → מופיעה בלי לגעת
  G(W, { live: 'set', key: 'k', s: S, qid: 'Q3', d: 'taanit|ו', w: 'taanit-5', q: 'שלישית', a: JSON.stringify(['1', '2', '3', '4']), cr: 3 });
  await pA.waitForFunction(function () { return document.getElementById('qq').textContent === 'שלישית'; }, null, { timeout: 8000 });
  ok(await pA.$eval('#ok', function (e) { return e.hidden; }), 'new q not answered');
  await pA.click('#opts button:nth-child(4)');
  await pA.waitForSelector('#ok:not([hidden])', { timeout: 5000 });
  // רענון — נשאר מחובר, זוכר את התשובה
  await pA.reload();
  await pA.waitForSelector('#qc:not([hidden])', { timeout: 8000 });
  ok(await pA.$eval('#opts button:nth-child(4)', function (e) { return e.className; }) === 'on', 'answer remembered');
  // אייפון בלי האפליקציה — לפי טלפון
  var ctxB = await ctxOf(B, W), pB = await ctxB.newPage();
  await pB.goto('http://localhost:' + port + '/live.html?s=' + S);
  await pB.waitForSelector('#who:not([hidden])', { timeout: 8000 });
  ok(await pB.$eval('#whoE', function (e) { return e.hidden; }), 'no error before typing');
  await pB.fill('#ph', '0500000000');
  await pB.click('#whoGo');
  await pB.waitForSelector('#joinW:not([hidden])', { timeout: 5000 });
  ok(true, 'not found → join');
  await pB.fill('#ph', '050-1234567');
  await pB.click('#whoGo');
  await pB.waitForSelector('#qc:not([hidden])', { timeout: 8000 });
  ok(await pB.textContent('#qq') === 'שלישית', 'phone path sees q');
  // U1 עונה גם על השלישית — ענה על הכול
  ok(G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'Q3', a: 3 }).a === 3, 'U1 ans Q3');
  // סיום
  ok(G(W, { live: 'end', s: S }).status === 'denied', 'end no key');
  var en = G(W, { live: 'end', key: 'k', s: S });
  ok(en.status === 'ok' && en.ppl === 3 && en.at === 1, 'end', en);
  await pA.waitForSelector('#msg:not([hidden])', { timeout: 8000 });
  ok((await pA.textContent('#msg')).indexOf('הסתיים') >= 0, 'phone sees end');
  // שורות החידון
  var Q = W.priv.getSheetByName('חידות'), qd = Q.d, ix = {};
  qd[0].forEach(function (h, i) { ix[h] = i; });
  var rows = qd.slice(1).filter(function (r) { return String(r[ix['מקור']]).indexOf('שיעור חי') === 0; });
  var by = {}; rows.forEach(function (r) { by[r[ix['מזהה']]] = r; });
  ok(rows.length === 3, 'quiz rows', rows.length);
  ok(by.U1 && by.U1[ix['ציון']] === '3/3' && by.U1[ix['קטע']] === 'החידון כולו' && by.U1[ix['ניסיון']] === 'חי', 'U1 score', by.U1);
  ok(by.U2 && by.U2[ix['ציון']] === '1/3' && by.U2[ix['נכון']] === 'לא נכון', 'U2 score', by.U2);
  ok(by.U3 && by.U3[ix['ציון']] === '0/3', 'U3 score', by.U3);
  ok(by.U1 && by.U1[ix['דף']] === 'taanit|ו' && by.U1[ix['שבוע']] === 'taanit-5', 'daf/week');
  // סיום שני — בלי כפילות
  G(W, { live: 'end', key: 'k', s: S });
  var rows2 = W.priv.getSheetByName('חידות').d.slice(1).filter(function (r) { return String(r[ix['מקור']]).indexOf('שיעור חי') === 0; });
  ok(rows2.length === 3, 'no dup on second end', rows2.length);
  ok((W.priv.getSheetByName('עמדה — שיוך') || W.pub.getSheetByName('עמדה — שיוך')).d.length === 2, 'no dup attendance on second end');
  ok(G(W, { live: 'get', s: S }).on === 0, 'get after end');
  ok(G(W, { live: 'ans', s: S, tk: h1.tk, qid: 'Q1', a: 1 }).on === 0, 'ans after end');
  // quizBest_ סופר אותן
  var qb = c.quizBest_({}, {}, null, null);
  ok(qb.best['U1|taanit|ו'] && qb.best['U1|taanit|ו'].join('/') === '3/3', 'quizBest_ counts', qb.best);
  // נוכחות — רק מי שענה על הכול (U1)
  var A = c.amdaQz_({}, {});
  ok(A.ok['U1|taanit|ו'] && !A.ok['U2|taanit|ו'] && !A.ok['U3|taanit|ו'], 'attendance only U1', A.ok);
  var LR = W.priv.getSheetByName('לימוד') || W.pub.getSheetByName('לימוד'), lh = LR.d[0];
  var lrs = LR.d.slice(1).filter(function (r) { return r[lh.indexOf('מקור')] === 'שיעור חי'; });
  ok(lrs.length === 1 && lrs[0][lh.indexOf('מזהה')] === 'U1' && String(lrs[0][lh.indexOf('שבוע')]) === '5', 'learn row U1', lrs);
  // שיוך העמדה לא מנחש שוב לפי שם
  c.amdaSync_();
  var LK = W.priv.getSheetByName('עמדה — שיוך') || W.pub.getSheetByName('עמדה — שיוך');
  ok(LK.d.length === 2, 'link rows 1', LK.d.length);
  // ניהול
  var ad = G(W, { live: 'adm', key: 'k' });
  ok(ad.status === 'ok' && ad.list.length === 1 && ad.list[0].nq === 3 && ad.list[0].ppl.length === 3, 'adm', ad);
  var a1 = ad.list[0].ppl.filter(function (p) { return p.n === 'אלף בית'; })[0];
  ok(a1 && a1.k === 3, 'adm U1 answered 3', a1);
  ok(G(W, { live: 'adm' }).status === 'denied', 'adm no key');
  // מפגש חדש — הישן נשאר סגור
  var st2 = G(W, { live: 'start', key: 'k' });
  ok(st2.s && st2.s !== S, 'new session');
  ok(G(W, { live: 'get', s: S }).on === 0, 'old still off');
  await B.close(); server.close();
  console.log(n - fails + '/' + n + ' passed');
  process.exit(fails ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
