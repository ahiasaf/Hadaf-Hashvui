/* מזהה יתום — מחיקה שומרת קישור, סימון מחדש חוזר למזהה, שמירה שמנתקת נעצרת.
   node tools/orphtest/run.js — הלוגיקה של studio.html ו-stepid.js ב-vm. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var R = path.join(__dirname, '..', '..');
var html = fs.readFileSync(path.join(R, 'studio.html'), 'utf8');
var a = html.indexOf('var GONE_IDS = {};'), b = html.indexOf('/* יתומים מימים קודמים');
if (a < 0 || b < 0) throw new Error('לא נמצא הקטע ב-studio.html');
var pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('✗ ' + m); } }
function world() {
  var c = { console: console, JSON: JSON, Math: Math, Date: Date, Promise: Promise,
    BOOK: {}, SRV: {}, SAVE: {}, DIRTY: {}, NEW_IDS: {}, STEPS: [], PKEY: 'taanit|ה|0|1',
    UI: { ssKOwn: 'פירוש', ssKQ: 'שאלות', ssKDeck: 'שקף', ssOrphMsg: '{page} {what} {n}', ssOrphJoin: 'j',
          ssOrphDrop: 'd', ssOrphJoined: 'ok', ssOrphNoHome: 'none' },
    asked: [], said: [], kicked: 0, CONT: null };
  c.window = c;
  c.T_ = function (k) { return c.UI[k] || ''; };
  c.fill_ = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); };
  c.selVal = function (k) { return k === 'mas' ? 'taanit' : 'ה'; };
  c.saveChip_ = function () {}; c.keepLocal = function () {}; c.markDraw = function () {};
  c.markPanel = function () {}; c.stepsRefresh_ = function () {};
  c.say = function (t) { c.said.push(t); };
  c.autoKick_ = function () { c.kicked++; };
  c.failPut_ = function () { c.failed = 1; };
  c.putPage_ = function (k) { c.put = k; };
  c.keyShort_ = function (k) { return k; };
  c.hasVal_ = function (v) { return v != null && v !== ''; };
  c.sheetCsv = function (t) { return Promise.resolve(c.CONT ? c.CONT[t] : null); };
  c.document = { getElementById: function () { return null; }, createElement: function () {
    var el = { className: '', innerHTML: '', q: {} };
    el.querySelector = function (s) { return el.q[s] || (el.q[s] = { textContent: '', onclick: null }); };
    c.bar = el; return el; }, body: { appendChild: function () {} } };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(R, 'stepid.js'), 'utf8'), c);
  vm.runInContext(html.slice(a, b), c);
  c.studioTaken_ = function () { return {}; };
  return c;
}
function st(id, f, t, also) {
  var s = { id: id, g: { from: { line: f, x: 0 }, to: { line: t, x: 1 } }, c: {} };
  if (also) s.also = also;
  return s;
}
function rows(tab, map) {
  return [['מסכת', 'דף', 'ערך']].concat([['taanit', 'ה', JSON.stringify(map)]]);
}

/* --- א. מחיקה מעבירה את המזהה לקטע הבא --- */
(function () {
  var c = world();
  c.STEPS = [st('A', 0, 3), st('B', 4, 7, ['X']), st('C', 8, 10)];
  c.BOOK[c.PKEY] = { steps: c.STEPS };
  var to = c.idsMove_(1, true);
  ok(to === c.STEPS[2], 'א: הקטע הבא מקבל');
  ok(JSON.stringify(c.STEPS[2].also) === '["B","X"]', 'א: also של הבא = B,X');
  ok(c.GONE_IDS[c.PKEY].length === 1 && c.GONE_IDS[c.PKEY][0].id === 'B', 'א: נרשם במחוקים');
  /* האחרון — לקודם */
  var to2 = c.idsMove_(2, true);
  ok(to2 === c.STEPS[1], 'א: האחרון — הקודם מקבל');
  /* קטעים של הדף הקודם (prev) — לא עוברים לדף הזה */
  var c2 = world();
  c2.STEPS = [st('P', 0, 2), st('Q', 3, 9)];
  c2.BOOK[c2.PKEY] = { steps: c2.STEPS, prev: 1 };
  ok(c2.idsHome_(0) === null, 'א: אין קולט מדף אחר');
  /* קטע המשך אינו קולט */
  var c3 = world();
  c3.STEPS = [{ cont: 1, g: { from: { line: 0 }, to: { line: 1 } } }, st('A', 2, 5)];
  c3.BOOK[c3.PKEY] = { steps: c3.STEPS };
  ok(c3.idsHome_(1) === null, 'א: המשך אינו קולט');
  /* מזהה חדש בלי also — לא נרשם */
  var c4 = world();
  c4.STEPS = [st('N', 0, 3), st('A', 4, 6)];
  c4.NEW_IDS.N = 1;
  c4.BOOK[c4.PKEY] = { steps: c4.STEPS };
  c4.idsMove_(0, false);
  ok(!c4.GONE_IDS[c4.PKEY], 'א: קטע חדש — אין מה לשמור');
})();

/* --- ב. סימון מחדש מאמץ את המזהה הישן --- */
(function () {
  var c = world();
  var steps = [st('A', 0, 3), st('C', 4, 10, ['B', 'X'])];   /* B נמחק והועבר ל-C */
  var gone = [{ id: 'B', also: ['X'], g: { from: { line: 4 }, to: { line: 7 } }, to: 'C' }];
  var nw = st('Z', 5, 7); c.NEW_IDS.Z = 1;
  steps.splice(1, 0, nw); steps[2].g.from.line = 8;
  var n = c.SidAdopt(steps, [], c.NEW_IDS, gone);
  ok(n === 1, 'ב: אומץ אחד');
  ok(nw.id === 'B' && JSON.stringify(nw.also) === '["X"]', 'ב: B ו-X חזרו לקטע החדש');
  ok(!steps[2].also, 'ב: יצאו מ-also של C');
  ok(c.SidAdopt(steps, [], c.NEW_IDS, gone) === 0, 'ב: לא פעמיים');
  /* רחוק מדי — לא */
  var s2 = [st('A', 0, 3), st('Y', 9, 12)]; c.NEW_IDS.Y = 1;
  ok(c.SidAdopt(s2, [], c.NEW_IDS, [{ id: 'B', g: { from: { line: 4 }, to: { line: 7 } } }]) === 0, 'ב: שורות אחרות — לא');
  /* קטע ישן (לא חדש) — לא נדרס */
  var s3 = [st('K', 4, 7)];
  ok(c.SidAdopt(s3, [], {}, [{ id: 'B', g: { from: { line: 4 }, to: { line: 7 } } }]) === 0 && s3[0].id === 'K', 'ב: קטע ישן לא נדרס');
  /* ההתנהגות הקיימת — גיאומטריה זהה מהגיליון */
  var s4 = [st('', 4, 7)]; delete s4[0].id;
  ok(c.SidAdopt(s4, [st('OLD', 4, 7)], {}) === 1 && s4[0].id === 'OLD', 'ב: האימוץ הקיים לא נשבר');
})();

/* --- ג. שמירה שמנתקת נעצרת; יתום קיים — רק מוצג --- */
(function (done) {
  var c = world();
  var k = c.PKEY;
  c.SRV[k] = { rec: { steps: [st('A', 0, 3), st('B', 4, 7), st('C', 8, 10)] } };
  c.STEPS = [st('A', 0, 3), st('C', 4, 10)];                  /* B נמחק בלי העברה */
  c.BOOK[k] = { steps: c.STEPS, t: 5 };
  ok(JSON.stringify(c.lostIds_(k)) === '["B"]', 'ג: B אבד');
  c.CONT = { 'פירוש': rows('', { __ids: 1, B: { t: 'x' } }), 'שאלות בדף': rows('', { __ids: 1 }), 'מצגת': rows('', { __ids: 1 }) };
  c.orphCheck_(k, ['B']);
  setTimeout(function () {
    ok(c.SAVE[k].st === 'orph', 'ג: נעצר');
    ok(!c.put, 'ג: לא נשלח');
    ok(c.bar && c.bar.className === 'on', 'ג: נשאל');
    c.bar.q['.ab-y'].onclick();                                 /* חיבור */
    ok(JSON.stringify(c.STEPS[1].also) === '["B"]', 'ג: B חובר לקטע שמכסה את השורה');
    ok(c.lostIds_(k).length === 0 && c.SAVE[k].st === '' && c.kicked, 'ג: השמירה ממשיכה');
    /* בלי תוכן — לא נעצר */
    var d = world();
    d.SRV[k] = { rec: { steps: [st('A', 0, 3), st('B', 4, 7)] } };
    d.BOOK[k] = { steps: [st('A', 0, 7)], t: 1 };
    d.CONT = { 'פירוש': rows('', { __ids: 1 }), 'שאלות בדף': rows('', { __ids: 1 }), 'מצגת': rows('', { __ids: 1 }) };
    d.orphCheck_(k, ['B']);
    setTimeout(function () {
      ok(d.put === k && d.SAVE[k].st !== 'orph', 'ג: בלי תוכן — נשמר');
      /* "לשמור בלי" */
      var e = world();
      e.SRV[k] = { rec: { steps: [st('B', 0, 7)] } };
      e.BOOK[k] = { steps: [], t: 1 };
      e.CONT = { 'פירוש': rows('', { __ids: 1 }), 'שאלות בדף': rows('', { __ids: 1, B: [{ q: 'ש' }] }), 'מצגת': rows('', { __ids: 1 }) };
      e.orphCheck_(k, ['B']);
      setTimeout(function () {
        ok(e.SAVE[k].st === 'orph', 'ג: אין קטע לחבר — נעצר');
        e.bar.q['.ab-n'].onclick();
        ok(e.lostIds_(k).length === 0, 'ג: אחרי "לשמור בלי" — לא חוסם');
        /* מזהה שעבר לעמוד אחר (איחוד בין עמודים) — אינו יתום */
        var f = world();
        f.SRV[k] = { rec: { steps: [st('B', 0, 3)] } };
        f.BOOK[k] = { steps: [{ cont: 1, g: { from: { line: 0 }, to: { line: 3 } } }], t: 1 };
        f.BOOK['taanit|ד|0|2'] = { steps: [st('R', 0, 30, ['B'])] };
        ok(f.lostIds_(k).length === 0, 'ג: מזהה שבעמוד אחר — לא יתום');
        console.log((fail ? '✗ ' : '✓ ') + pass + ' עברו, ' + fail + ' נכשלו');
        process.exit(fail ? 1 : 0);
      }, 20);
    }, 20);
  }, 20);
})();
