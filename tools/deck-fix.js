/* ============================================================
   עוגני המצגת — מספר שקף → שם קובץ. חד-פעמי, מ-GitHub.
   ============================================================
   עוגן ישן נשמר כ"שקף מספר 3", ועוגן חדש כשם הקובץ. מספר זז בכל
   פעם ששקף יוצא מהרשימה או נדחף לפניו, ושם לא. כאן כל עוגן לפי
   מספר מקבל את שם הקובץ שיושב היום במקום הזה, במצגת של השבוע של
   הקטע (העמוד שלו קובע: ב. או ב:) — כלומר אותו שקף שהתלמיד רואה
   היום, בדיוק.

     node tools/deck-fix.js check — קריאה בלבד: מה יומר.
     node tools/deck-fix.js nums  — ההמרה. כל דף בנפרד, דרך deckRow_
                                    עם `base`: התא נכתב רק אם לא
                                    השתנה מאז שנקרא. אחר כך קריאה
                                    חוזרת ובדיקה.

   ביומן — שמות קבצים ומספרים בלבד.
   ============================================================ */
var fs = require('fs'), vm = require('vm'), path = require('path');
var ROOT = path.join(__dirname, '..');
var mode = process.argv[2] || 'check';
var key = (process.env.READ_KEY || '').trim();
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }
if (mode !== 'check' && mode !== 'nums') { console.error('check או nums'); process.exit(1); }

var ctx = { console: console, JSON: JSON, Math: Math, Object: Object, String: String };
ctx.window = ctx;
vm.createContext(ctx);
['data.js', 'deck.js', 'stepid.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
});
var URL_ = /APPS_SCRIPT_URL\s*=\s*\n?\s*'([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'))[1];

function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function get(params, tries) {
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  tries = tries || 0;
  return fetch(URL_ + '?' + q, { redirect: 'follow' }).then(function (r) {
    return r.text().then(function (t) {
      try { return JSON.parse(t); } catch (e) { throw new Error('HTTP ' + r.status); }
    });
  }).catch(function (e) {
    if (tries >= 4) throw e;
    return sleep(3000 * (tries + 1)).then(function () { return get(params, tries + 1); });
  });
}
function read(tab) {
  return get({ read: tab, key: key }).then(function (d) {
    if (!d || d.status !== 'ok') throw new Error('קריאת "' + tab + '" נכשלה');
    return d.rows || [];
  });
}
function readAll() {
  var t = {};
  return read('מצגת').then(function (r) { t.deck = r; return read('סימוני הדף'); })
    .then(function (r) { t.marks = r; return read('מצגות'); })
    .then(function (r) { t.decks = r; return t; });
}
/* כמו LWeekOf ב-learned.js */
function weekOf(mas, daf, am) {
  var tr = null, k = ctx.SidDaf(daf), first = -1;
  ctx.TRACKS.forEach(function (x) { if (x.id === mas) tr = x; });
  if (!tr) return -1;
  for (var w = 0; w < tr.cal.length; w++) {
    var row = tr.cal[w];
    if (!row[2] || ctx.SidDaf(row[2]) !== k) continue;
    if (first < 0) first = w;
    var a = row[3] === 'א' ? 1 : row[3] === 'ב' ? 2 : 0;
    if (!am || a === am) return w;
  }
  return first;
}
/* התוכנית: לכל דף — הרשומה אחרי ההמרה, ומה הומר */
function plan(t) {
  ctx.DECKS = ctx.DeckFromRows(t.decks);
  if (!ctx.DECKS) throw new Error('הלשונית "מצגות" לא נקראה כמו שצריך');
  var recs = ctx.SidParse(t.marks.slice(1)), out = [];
  t.deck.slice(1).forEach(function (r, i) {
    var o;
    try { o = JSON.parse(r[2]); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;
    var F = ctx.SidFlat(recs, r[0], r[1]), ch = [], bad = [];
    Object.keys(o).forEach(function (k) {
      if (k.indexOf('__') === 0 || typeof o[k] !== 'number') return;
      /* הקטע, והעמוד שלו — כמו amudCut בדף האינטראקטיבי */
      var v = null;
      F.flat.forEach(function (x) {
        if (v || x.part !== 1) return;
        if (o.__ids ? (x.id === k || (x.also || []).indexOf(k) >= 0) : String(x.n) === k) v = x;
      });
      if (!v) { bad.push(k + ': אין קטע'); return; }
      var pp = F.pages[v.p] || {};
      var am = ctx.SidDaf(pp.daf) === ctx.SidDaf(r[1]) ? (pp.pg === 2 ? 2 : 1) : 2;
      var wk = weekOf(r[0], r[1], am);
      var deck = wk >= 0 ? ctx.DeckOf(r[0], wk + 1) : null;
      var f = deck && deck.files[o[k] - 1];
      if (!f) { bad.push('קטע ' + v.n + ': שקף ' + o[k] + ' אינו ברשימה של שבוע ' + (wk + 1)); return; }
      ch.push('קטע ' + v.n + ' (שבוע ' + (wk + 1) + '): שקף ' + o[k] + ' → ' + f);
      o[k] = f;
    });
    if (ch.length || bad.length) out.push({ row: i + 2, mas: r[0], daf: r[1], base: r[2],
                                             val: JSON.stringify(o), ch: ch, bad: bad });
  });
  return out;
}
function show(P) {
  if (!P.length) console.log('אין עוגנים לפי מספר.');
  P.forEach(function (p) {
    console.log(p.mas + ' ' + p.daf + ':');
    p.ch.forEach(function (c) { console.log('  ' + c); });
    p.bad.forEach(function (c) { console.log('  ✗ לא יומר — ' + c); });
  });
}

readAll().then(function (t) {
  var P = plan(t);
  console.log('--- מה יומר ---'); show(P);
  if (mode === 'check') { console.log('קריאה בלבד. לא נכתב דבר.'); return; }
  var todo = P.filter(function (p) { return p.ch.length; }), chain = Promise.resolve();
  todo.forEach(function (p) {
    chain = chain.then(function () {
      return fetch(URL_, { method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deckRow', key: key, mas: p.mas, daf: p.daf,
                               base: p.base, val: p.val }) }).catch(function () {});
    });
  });
  return chain.then(function () { return sleep(2000); }).then(readAll).then(function (t2) {
    var now = {}, fail = 0;
    t2.deck.slice(1).forEach(function (r) { now[r[0] + '|' + ctx.SidDaf(r[1])] = r[2]; });
    todo.forEach(function (p) {
      var good = now[p.mas + '|' + ctx.SidDaf(p.daf)] === p.val;
      if (!good) fail++;
      console.log((good ? '✓ ' : '✗ ') + p.mas + ' ' + p.daf + (good ? ' — הומר ונקרא שוב' : ' — לא זהה אחרי הכתיבה (אולי השתנה בינתיים)'));
    });
    var left = plan(t2).filter(function (p) { return p.ch.length; }).length;
    console.log('דפים עם עוגנים לפי מספר אחרי ההמרה: ' + left);
    if (fail) throw new Error(fail + ' דפים לא אומתו');
  });
}).catch(function (e) {
  console.error('✗ ' + (e && e.message || e));
  process.exit(1);
});
