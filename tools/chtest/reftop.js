/* מצב ההזמנה מהקישור בראש המסך (8.99.538). NODE_PATH=$(npm root -g) node tools/chtest/reftop.js
   עמוד האתגר (chaver?ref=) ובית התלמיד (join), מכשיר רשום, תשובות השרת מדומות לכל מצב:
   in (עם tb ובלי — שרת ישן) · open (עם שולחנות ובלי) · full · max · bad · self · wait · "כן" → sat ·
   ולא רשום — הנחיתה, והקוד נשמר להרשמה. בטלפון 390×844: ההודעה והכפתור גלויים בלי גלילה. */
var http = require('http'), fs = require('fs'), path = require('path');
var chromium = require('playwright').chromium;
var ROOT = path.resolve(__dirname, '..', '..');
var TYPES = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
function serve() {
  return new Promise(function (ok) {
    var srv = http.createServer(function (req, res) {
      var u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
      if (/^\/api\//.test(p)) { res.writeHead(504); res.end(); return; }
      var f = path.join(ROOT, p === '/' ? '/index.html' : p);
      if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { ok(srv); });
  });
}
var fails = 0;
function ok(c, w, x) { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + w + (c || x === undefined ? '' : ' ' + JSON.stringify(x))); }
var ME = { first:'פלוני', last:'אלמוני', inst:'givat', role:'stu', id:'devtest1', grade:'ז' };
var S = function (n, me, l) { return { n:n, me:!!me, l:!!l, q:0, s:0 }; };
var MINE = { id:'T1', mine:true, name:'פלוני', st:'open', seats:[S('פלוני', 1), S('דני')] };
var HOST = { id:'T2', mine:false, name:'נתן', st:'open', seats:[S('נתן'), S('פלוני', 1), S('יוסי', 0, 1)] };
var HOSTV = { name:'נתן', seats:[S('נתן'), S('אבי')] };
function me(x) { var o = { first:'פלוני', l:false, ts:[], t:null, way:[], plus:1 }; for (var k in x) o[k] = x[k]; return o; }
var CASES = {
  in:     { status:'ok', on:true, pub:true, ref:'ok', refBy:'נתן', me: me({ ts:[MINE, HOST], t:MINE, plus:0, inv:[{ n:'נתן', st:'in', c:'', ref:1, t:null, tb:'T2' }] }) },
  inOld:  { status:'ok', on:true, pub:true, ref:'ok', refBy:'נתן', me: me({ ts:[MINE, HOST], t:MINE, plus:0, inv:[{ n:'נתן', st:'in', c:'', ref:1, t:null }] }) },
  open:   { status:'ok', on:true, pub:true, ref:'old', refBy:'נתן', refT:HOSTV, me: me({ ts:[MINE], t:MINE, plus:0,
            inv:[{ n:'נתן', st:'open', c:'ABCD12', ref:1, t:HOSTV }, { n:'משה', st:'open', c:'MOSHE1', ref:0, t:{ name:'משה', seats:[S('משה')] } }] }) },
  open0:  { status:'ok', on:true, pub:true, ref:'old', refBy:'נתן', refT:HOSTV, me: me({ inv:[{ n:'נתן', st:'open', c:'ABCD12', ref:1, t:HOSTV }] }) },
  full:   { status:'ok', on:true, pub:true, ref:'full', refBy:'נתן', me: me({ ts:[MINE], t:MINE, plus:0, inv:[{ n:'נתן', st:'full', c:'', ref:1, t:null }] }) },
  full0:  { status:'ok', on:true, pub:true, ref:'full', refBy:'נתן', me: me({ inv:[{ n:'נתן', st:'full', c:'', ref:1, t:null }] }) },
  max:    { status:'ok', on:true, pub:true, ref:'max', refBy:'נתן', me: me({ ts:[MINE, HOST, { id:'T3', mine:false, name:'רון', st:'open', seats:[S('רון'), S('פלוני', 1)] }], t:MINE, plus:0,
            inv:[{ n:'נתן', st:'max', c:'', ref:1, t:null }] }) },
  bad:    { status:'ok', on:true, pub:true, ref:'bad', me: me({ ts:[MINE], t:MINE }) },
  self:   { status:'ok', on:true, pub:true, ref:'self', refBy:'פלוני', me: me({ ts:[MINE], t:MINE }) },
  wait:   { status:'ok', on:true, pub:true, ref:'wait', refBy:'נתן', me: me({ ts:[MINE], t:MINE }) }
};
var SIT = { status:'ok', on:true, pub:true, ref:'ok', refBy:'נתן', me: me({ ts:[MINE, HOST], t:MINE, plus:0, inv:[{ n:'נתן', st:'in', c:'', ref:1, t:null, tb:'T2' }] }) };
async function ctxFor(b, my, reg) {
  var ctx = await b.newContext({ serviceWorkers:'block', viewport:{ width:390, height:844 } });
  ctx.LOG = [];
  await ctx.route(/script\.google(usercontent)?\.com/, function (r) {
    var u = r.request().url(), m = /callback=(\w+)/.exec(u);
    ctx.LOG.push(u);
    var body = /challenge=my/.test(u) ? my : /challenge=sit/.test(u) ? SIT : /challenge=land/.test(u) ? { status:'ok', on:true, name:'נתן' } : { status:'ok' };
    return r.fulfill({ status:200, contentType:'application/javascript', body: m ? m[1] + '(' + JSON.stringify(body) + ')' : JSON.stringify(body) });
  });
  await ctx.route(/fonts\.googleapis|gstatic|docs\.google/, function (r) { return r.abort(); });
  if (reg) await ctx.addInitScript(function (me) { if (!localStorage.getItem('df:me')) localStorage.setItem('df:me', JSON.stringify(me)); }, ME);
  return ctx;
}
/* מה בראש #ch: הטקסט הראשון, ומיקום הכפתור/הכרטיס ביחס למסך. */
function top(p, sel) {
  return p.evaluate(function (sel) {
    var box = document.querySelector(sel), r = {};
    if (!box) return null;
    r.text = box.innerText.replace(/\s+/g, ' ').slice(0, 120);
    var one = box.querySelector('#ch-one'), b = document.getElementById('ch-refin');
    var oneTop = one ? one.getBoundingClientRect().top : 1e9;
    r.btn = b ? { t: b.getBoundingClientRect().top, bt: b.getBoundingClientRect().bottom, tb: b.getAttribute('data-t'), txt: b.innerText } : null;
    r.vh = innerHeight;
    var lead = box.querySelector('.ch-lead, .ch-note');
    r.lead = lead ? lead.innerText : '';
    r.leadTop = lead ? lead.getBoundingClientRect().top : 0;
    r.leadBeforeOne = lead ? lead.getBoundingClientRect().top < oneTop : false;
    r.pk = Array.prototype.map.call(box.querySelectorAll('.ch-pk'), function (x) { return { c: x.getAttribute('data-c'), t: x.getBoundingClientRect().top < oneTop }; });
    r.sitM = box.querySelectorAll('#ch-sit-m').length;
    r.title = one ? (one.querySelector('.ch-hh') || {}).innerText : '';
    r.scrollY = scrollY;
    return r;
  }, sel);
}
(async function () {
  var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port, b = await chromium.launch();
  var go = async function (my, url, reg) {
    var c = await ctxFor(b, my, reg === undefined ? true : reg), p = await c.newPage();
    var errs = []; p.on('pageerror', function (e) { errs.push(String(e)); });
    await p.goto(base + url); await p.waitForTimeout(1800);
    p.errs = errs; p.ctx = c;
    return p;
  };
  var R;
  /* 1. כבר יושב אצל המזמין — בראש המסך, כפתור גלוי בלי גלילה, לחיצה פותחת את השולחן שלו */
  var p = await go(CASES.in, '/chaver?ref=ABCD12');
  R = await top(p, '#ch');
  ok(R.lead === 'אתה כבר בשולחן של נתן' && R.leadBeforeOne, '1. in — "אתה כבר בשולחן של נתן" לפני השולחנות', R);
  ok(R.btn && R.btn.bt <= R.vh && R.btn.t >= 0 && R.scrollY === 0, '1. in — הכפתור במסך בלי גלילה', R.btn);
  ok(R.btn && R.btn.tb === 'T2', '1. in — הכפתור מכוון לשולחן המשותף (tb)', R.btn);
  ok(R.title === 'השולחן שלי' || !/נתן/.test(R.title), '1. in — אין מעבר אוטומטי: מוצג השולחן הראשי', R.title);
  await p.click('#ch-refin'); await p.waitForTimeout(800);
  R = await top(p, '#ch');
  ok(/נתן/.test(R.title), '1. in — לחיצה פותחת את השולחן של נתן', R.title);
  var sits = p.ctx.LOG.filter(function (u) { return /challenge=(sit|decl|newt)/.test(u); });
  ok(!sits.length, '1. in — בלי פעולה בשרת (אין sit/decl/newt)', sits);
  /* פתיחה חוזרת של אותו קישור */
  await p.goto(base + '/chaver?ref=ABCD12'); await p.waitForTimeout(1800);
  R = await top(p, '#ch');
  ok(R.lead === 'אתה כבר בשולחן של נתן' && R.btn && R.btn.bt <= R.vh, '1. in — פתיחה חוזרת של הקישור: שוב בראש, בלי גלילה', R);
  ok(!p.errs.length, '1. בלי שגיאות JS', p.errs);
  await p.ctx.close();
  /* 2. שרת ישן בלי tb — לפי השם */
  p = await go(CASES.inOld, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(R.btn && R.btn.tb === 'T2', '2. in בלי tb — השולחן לפי המזמין שיושב בו', R.btn);
  await p.ctx.close();
  /* 3. הזמנה פתוחה, יש שולחנות — בראש, עם כן/לא; הזמנה אחרת נשארת למטה, בלי כפילות */
  p = await go(CASES.open, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(/נתן גם הזמין אותך/.test(R.lead) && R.leadBeforeOne, '3. open — ההזמנה לפני השולחנות', R.lead);
  var nat = R.pk.filter(function (x) { return x.c === 'ABCD12'; }), mo = R.pk.filter(function (x) { return x.c === 'MOSHE1'; });
  ok(nat.length === 1 && nat[0].t, '3. open — כפתור "לשבת" אחד, למעלה', R.pk);
  ok(mo.length === 1 && !mo[0].t, '3. open — הזמנה אחרת נשארת מתחת לשולחן', R.pk);
  ok(R.sitM === 1, '3. open — שורת מצב אחת', R.sitM);
  ok((await p.$$('.ch-no')).length === 2, '3. open — "לא, תודה" לכל הזמנה');
  /* "כן" → הצטרף: "הצטרפת…", ולא "אתה כבר" כפול */
  await p.click('.ch-pk[data-c="ABCD12"]'); await p.waitForTimeout(1200);
  R = await top(p, '#ch');
  ok(/הצטרפת לשולחן של נתן/.test(R.text) && !/אתה כבר בשולחן/.test(R.text), '3. אחרי "כן" — "הצטרפת", בלי הודעה כפולה', R.text);
  await p.ctx.close();
  /* 4. הזמנה פתוחה בלי שולחנות — כרטיס ההזמנות כמו קודם */
  p = await go(CASES.open0, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(R.pk.length === 1 && !/אתה כבר|מלא/.test(R.text), '4. open בלי שולחן — כרטיס ההזמנות הרגיל, כפתור אחד', R);
  await p.ctx.close();
  /* 5–6. מלא / שלושה שולחנות */
  p = await go(CASES.full, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(/השולחן של נתן מלא/.test(R.lead) && R.leadBeforeOne, '5. full — הסבר בראש המסך', R.lead); await p.ctx.close();
  p = await go(CASES.full0, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(/השולחן של נתן מלא/.test(R.text.slice(0, 60)), '5. full בלי שולחן — הסבר בראש', R.text); await p.ctx.close();
  p = await go(CASES.max, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(/כבר יש לך 3 שולחנות/.test(R.lead) && R.leadBeforeOne, '6. max — הסבר בראש המסך', R.lead); await p.ctx.close();
  /* 7. bad / self / wait — כמו קודם */
  p = await go(CASES.bad, '/chaver?ref=ZZZZ99'); R = await top(p, '#ch');
  ok(/לא מצאנו את ההזמנה/.test(R.text) && !R.btn, '7. bad — ההודעה הקיימת', R.text); await p.ctx.close();
  p = await go(CASES.self, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(/זה הקישור שלך/.test(R.text), '7. self — ההודעה הקיימת', R.text); await p.ctx.close();
  p = await go(CASES.wait, '/chaver?ref=ABCD12'); R = await top(p, '#ch');
  ok(!R.btn && !/אתה כבר|מלא|3 שולחנות/.test(R.text), '7. wait — בלי הודעה חדשה', R.text);
  ok((await p.evaluate(function () { return localStorage.getItem('df:chRef'); })) === '"ABCD12"', '7. wait — הקוד נשמר להמשך');
  await p.ctx.close();
  /* 8. לא רשום — הנחיתה, והקוד נשמר לאורך ההרשמה */
  p = await go(CASES.in, '/chaver?ref=ABCD12', false);
  var land = await p.evaluate(function () { var c = document.querySelector('.ch-card.land'), a = c && c.querySelector('a.ch-btn'); return { c: !!c, h: a ? a.getAttribute('href') : '', ref: localStorage.getItem('df:chRef'), refin: !!document.getElementById('ch-refin') }; });
  ok(land.c && /join\.html\?ref=ABCD12/.test(land.h) && land.ref === '"ABCD12"' && !land.refin, '8. לא רשום — הנחיתה, הקישור להרשמה עם הקוד', land);
  await p.ctx.close();
  /* 9. בית התלמיד — אותה הודעה בראש כרטיס האתגר */
  p = await go(CASES.in, '/join.html?ref=ABCD12'); await p.waitForTimeout(1500);
  R = await top(p, '#chal');
  ok(R && R.lead === 'אתה כבר בשולחן של נתן' && R.leadBeforeOne && R.btn, '9. בית — "אתה כבר בשולחן של נתן" בראש הכרטיס', R);
  if (R && R.btn) { await p.click('#ch-refin'); await p.waitForTimeout(800); R = await top(p, '#chal'); ok(/נתן/.test(R.title), '9. בית — לחיצה פותחת את השולחן', R.title); }
  ok(!p.errs.length, '9. בלי שגיאות JS', p.errs);
  await p.ctx.close();
  await b.close(); srv.close();
  console.log(fails ? fails + ' נכשלו' : 'הכול עבר');
  process.exit(fails ? 1 : 0);
})();
