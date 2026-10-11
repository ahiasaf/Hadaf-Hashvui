/* ============================================================
   תיקון אחרי ההסבה — עמודים שהוחזרו מעותק ישן במכשיר.
   ============================================================
   "כל המצגות של דף ב' עמוד א' איבדו את הקשר שלהם."

   מה קרה (11.10.2026): ההסבה נתנה מזהים לקטעים בלי לשנות את
   חותמת הזמן (`t`) של העמוד. בבוקר הסטודיו הציע "יש עריכה שלא
   נשמרה — לשמור?" על עותקים מהמכשיר מ-28–30 בספטמבר, ושמר אותם.
   מבחינתו הם לא היו ישנים יותר — אותה חותמת או חדשה ממנה. כך חזרו
   לגיליון עמודים בלי המזהים (או עם מזהים חדשים), והפירוש, השקפים
   והשאלות שנקשרו למזהים של ההסבה לא מצאו את הקטע שלהם. בתענית ג'
   ו-ה' העותקים גם היו שבורים (קטעים חסרים, חברותא מוזזת).

   כאן, לפי החלטת הרכז: העמודים שברשימה חוזרים למה שהיה בגיליון
   ערב ההסבה (הלשונית "גיבוי מזהים · סימוני הדף"), עם המזהים
   שההסבה נתנה להם — אותם מזהים בדיוק, מתוך המפה הקפואה `__n2id`
   שברשומת הפירוש. חותמת הזמן מתעדכנת לעכשיו, כדי שעותק ישן במכשיר
   ייראה ישן ולא יוצע שוב.

   עוגן או פירוש שנקשרו בינתיים למזהה החדש (הרכז שייך מחדש את
   השקפים של תענית ב' ע״א) עוברים למזהה המקורי של אותו קטע. כשיש
   לשניהם ערך — החדש גובר, כי הוא העבודה האחרונה.

     node tools/sid-repair.js check — קריאה בלבד: מה ישתנה.
     node tools/sid-repair.js fix   — לשוניות התוכן (שורה לדף, עם
                                      `base`), ואחר כך "סימוני הדף"
                                      דרך sidStep_ (גיבוי, כתיבה,
                                      אימות, ואם לא — חזרה). בסוף
                                      קריאה חוזרת ובדיקה.

   ביומן — מפתחות, מספרים ומזהים בלבד, לא תוכן.
   ============================================================ */
var fs = require('fs'), vm = require('vm'), path = require('path');
var ROOT = path.join(__dirname, '..');
var mode = process.argv[2] || 'check';
var BAK = process.argv[3] || 'גיבוי מזהים · סימוני הדף';
/* העמודים שהוחזרו מהמכשיר, ושהרכז ביקש להחזיר מהגיבוי */
var PAGES = ['taanit|ב|0|1', 'taanit|ב|0|2', 'taanit|ג|0|1', 'taanit|ג|0|2',
             'taanit|ה|0|1', 'taanit|ה|0|2'];
var MARKS = 'סימוני הדף', OWN = 'פירוש', QS = 'שאלות בדף', DECK = 'מצגת';

var ctx = { console: console, JSON: JSON, Math: Math, Object: Object, String: String };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'stepid.js'), 'utf8'), ctx);

/* ---------- התוכנית — פונקציה טהורה, לא כותבת דבר ---------- */
function plan(t, now) {
  var out = { marks: null, rows: {}, log: [], bad: [], map: {} };
  var bak = ctx.SidParse(t.bak.slice(1)), cur = ctx.SidParse(t.marks.slice(1));
  var B = {}, C = {};
  bak.forEach(function (R) { B[R.key] = R; });
  cur.forEach(function (R) { C[R.key] = R; });

  /* הגיבוי חייב להיות מלפני ההסבה — בלי אף מזהה */
  bak.forEach(function (R) {
    ((R.d && R.d.steps) || []).forEach(function (s) {
      if (s.id) out.bad.push('בגיבוי "' + BAK + '" כבר יש מזהים (' + R.key + ') — זה לא הגיבוי מלפני ההסבה');
    });
  });
  PAGES.forEach(function (k) {
    if (!B[k]) out.bad.push('אין בגיבוי את ' + k);
    if (!C[k]) out.bad.push('אין בגיליון את ' + k);
  });
  if (out.bad.length) return out;

  /* המפה הקפואה n → id של כל דף, מרשומת הפירוש */
  var n2id = {};
  t.own.slice(1).forEach(function (r) {
    var o;
    try { o = JSON.parse(r[2]); } catch (e) { return; }
    if (o && o.__n2id) n2id[ctx.SidDm(String(r[0]).trim(), r[1])] = o.__n2id;
  });

  /* המזהים של ההסבה על עמודי הגיבוי — אותו סדר לימוד שההסבה חישבה */
  var dafs = {};
  PAGES.forEach(function (k) { var a = k.split('|'); dafs[a[0] + '|' + a[1]] = a; });
  var got = {};
  Object.keys(dafs).forEach(function (dk) {
    var a = dafs[dk], m = n2id[ctx.SidDm(a[0], a[1])];
    if (!m) { out.bad.push('אין __n2id לדף ' + dk); return; }
    var F = ctx.SidFlat(bak, a[0], a[1]);
    F.flat.forEach(function (v) {
      if (v.part !== 1 || v.st.cont) return;
      var id = m[String(v.n)];
      if (!id) { out.bad.push(dk + ' קטע ' + v.n + ': אין מזהה במפה'); return; }
      if (got[id] && got[id] !== v.st) { out.bad.push('המזהה ' + id + ' הוקצה פעמיים'); return; }
      if (v.st.id && v.st.id !== id) { out.bad.push(dk + ' קטע ' + v.n + ': שני מזהים'); return; }
      v.st.id = id; got[id] = v.st;
    });
    if (F.groups !== Object.keys(m).length)
      out.log.push(dk + ': ' + F.groups + ' קטעים בגיבוי, ' + Object.keys(m).length + ' במפה');
  });
  if (out.bad.length) return out;

  /* כל קטע בעמוד שחוזר חייב לצאת עם מזהה (חוץ מהמשך) */
  PAGES.forEach(function (k) {
    B[k].d.steps.forEach(function (s, i) {
      if (!s.cont && !s.id) out.bad.push(k + ' צעד ' + i + ': נשאר בלי מזהה');
    });
    /* סוף שבוע / המשך מהדף הקודם שנקבעו אחרי הגיבוי — לא לבטל בשקט */
    ['prev', 'prevDaf', 'upto', 'uptoDaf'].forEach(function (f) {
      if (JSON.stringify(B[k].d[f]) !== JSON.stringify(C[k].d[f]))
        out.bad.push(k + ': "' + f + '" שונה בין הגיבוי לגיליון — לבדוק ידנית');
    });
  });
  if (out.bad.length) return out;

  /* מזהה נוכחי → מזהה ההסבה, לפי אותה נקודת התחלה בגמרא באותו עמוד */
  var keep = {};
  Object.keys(got).forEach(function (id) { keep[id] = 1; });
  PAGES.forEach(function (k) {
    var old = {};
    B[k].d.steps.forEach(function (s) { if (s.id && s.g) old[JSON.stringify(s.g.from)] = s.id; });
    C[k].d.steps.forEach(function (s) {
      (s.id ? [s.id] : []).concat(s.also || []).forEach(function (id) {
        if (keep[id]) return;
        var to = s.g && old[JSON.stringify(s.g.from)];
        if (to) out.map[id] = to;
      });
    });
  });

  /* "סימוני הדף": אותן שורות בדיוק, רק תא הנתונים של העמודים שברשימה */
  out.marks = t.marks.slice(1).map(function (r) {
    var k = r[0] + '|' + r[1] + '|' + r[2], nr = r.slice();
    if (PAGES.indexOf(k) >= 0) {
      var d = JSON.parse(JSON.stringify(B[k].d));
      d.t = now;
      nr[3] = JSON.stringify(d);
      out.log.push(k + ': ' + C[k].d.steps.length + ' → ' + d.steps.length + ' צעדים, ' +
                   d.steps.filter(function (s) { return s.id; }).length + ' מזהים');
    }
    return nr;
  });

  /* לשוניות התוכן: מפתח שהוא מזהה נוכחי → מזהה ההסבה */
  [DECK, OWN, QS].forEach(function (tab) {
    (t[tab] || []).slice(1).forEach(function (r, i) {
      var o;
      try { o = JSON.parse(r[2]); } catch (e) { return; }
      if (!o || typeof o !== 'object') return;
      var ch = [], k;
      for (k in o) {
        if (!o.hasOwnProperty(k) || !out.map[k]) continue;
        var to = out.map[k];
        if (o[to] !== undefined && JSON.stringify(o[to]) !== JSON.stringify(o[k]))
          ch.push(k + '→' + to + ' (החדש גובר)');
        else ch.push(k + '→' + to);
        o[to] = o[k]; delete o[k];
        if (o.__t && o.__t[k] !== undefined) { o.__t[to] = o.__t[k]; delete o.__t[k]; }
      }
      if (!ch.length) return;
      o.__ids = 1;
      (out.rows[tab] = out.rows[tab] || []).push({ i: i, mas: r[0], daf: r[1], base: r[2],
                                                   val: JSON.stringify(o), ch: ch });
    });
  });
  return out;
}

/* כמה מפתחות בכל רשומת תוכן לא מוצאים קטע — לפני ואחרי */
function orphans(t, marksRows) {
  var recs = ctx.SidParse(marksRows), res = [];
  [DECK, OWN, QS].forEach(function (tab) {
    (t[tab] || []).slice(1).forEach(function (r) {
      var o;
      try { o = JSON.parse(r[2]); } catch (e) { return; }
      if (!o || typeof o !== 'object') return;
      var F = ctx.SidFlat(recs, r[0], r[1]), ids = {}, ok = 0, bad = 0;
      F.flat.forEach(function (v) { ids[v.id] = 1; (v.also || []).forEach(function (a) { ids[a] = 1; }); });
      Object.keys(o).forEach(function (k) {
        if (k.indexOf('__') === 0 || /^\d+$/.test(k)) return;
        if (ids[k]) ok++; else bad++;
      });
      if (ok || bad) res.push(tab + ' · ' + r[0] + ' ' + r[1] + ': ' + ok + ' מחוברים' + (bad ? ', ' + bad + ' בלי קטע' : ''));
    });
  });
  return res;
}
function show(P) {
  P.log.forEach(function (l) { console.log('  ' + l); });
  Object.keys(P.rows).forEach(function (tab) {
    P.rows[tab].forEach(function (x) {
      console.log('  ' + tab + ' · ' + x.mas + ' ' + x.daf + ': ' + x.ch.join(', '));
    });
  });
}
module.exports = { plan: plan, orphans: orphans, PAGES: PAGES };
if (require.main !== module) return;
if (mode !== 'check' && mode !== 'fix') { console.error('check או fix'); process.exit(1); }

/* ---------- רשת ---------- */
var key = (process.env.READ_KEY || '').trim();
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }
var URL_ = /APPS_SCRIPT_URL\s*=\s*\n?\s*'([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'))[1];
function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function get(params, tries) {
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  tries = tries || 0;
  return fetch(URL_ + '?' + q, { redirect: 'follow' }).then(function (r) {
    return r.text().then(function (x) {
      try { return JSON.parse(x); } catch (e) { throw new Error('HTTP ' + r.status); }
    });
  }).catch(function (e) {
    if (tries >= 4) throw e;
    return sleep(3000 * (tries + 1)).then(function () { return get(params, tries + 1); });
  });
}
function post(body) {
  return fetch(URL_, { method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
    .then(function (r) { return r.text(); })
    .then(function (x) { try { return JSON.parse(x); } catch (e) { return null; } })
    .catch(function () { return null; });
}
/* אחת אחרי השנייה */
function readAll() {
  var t = {}, names = { marks: MARKS, bak: BAK, own: OWN };
  names[DECK] = DECK; names[QS] = QS;
  var chain = Promise.resolve();
  Object.keys(names).forEach(function (k) {
    chain = chain.then(function () {
      return get({ read: names[k], key: key }).then(function (d) {
        if (!d || d.status !== 'ok') throw new Error('קריאת "' + names[k] + '" נכשלה');
        if (!d.rows || !d.rows.length) throw new Error('הלשונית "' + names[k] + '" ריקה או חסרה');
        t[k] = d.rows;
      });
    });
  });
  /* הפירוש משמש גם למפה (`own`) וגם כלשונית תוכן */
  return chain.then(function () { t[OWN] = t.own; return t; });
}
function waitStep(rid, tries) {
  return sleep(4000).then(function () {
    return get({ sidStep: 1, key: key }).catch(function () { return null; });
  }).then(function (d) {
    if (d && d.sid && d.sid.rid === rid) return d.sid;
    if (tries < 60) return waitStep(rid, tries + 1);
    throw new Error('לא התקבלה תשובה מהסקריפט תוך 4 דקות. להריץ check.');
  });
}
function sidFlat(rows, w) {
  return JSON.stringify((rows || []).map(function (r) {
    var o = [];
    for (var j = 0; j < w; j++) o.push(String(r && r[j] != null ? r[j] : ''));
    return o;
  }));
}

var P;
get({ sidStep: 1, key: key }).then(function (v) {
  if (!v || v.status === 'denied') throw new Error('הסקריפט דחה את הסיסמה.');
  return readAll();
}).then(function (t) {
  console.log('--- לפני ---');
  orphans(t, t.marks.slice(1)).forEach(function (l) { console.log('  ' + l); });
  P = plan(t, Date.now());
  if (P.bad.length) {
    P.bad.forEach(function (b) { console.log('✗ ' + b); });
    throw new Error('לא נכתב דבר.');
  }
  console.log('--- מה ישתנה ---'); show(P);
  console.log('--- אחרי (צפוי) ---');
  var t2 = JSON.parse(JSON.stringify(t));
  Object.keys(P.rows).forEach(function (tab) {
    P.rows[tab].forEach(function (x) { t2[tab][x.i + 1][2] = x.val; });
  });
  orphans(t2, P.marks).forEach(function (l) { console.log('  ' + l); });
  if (mode === 'check') { console.log('קריאה בלבד. לא נכתב דבר.'); return; }

  /* 1 · לשוניות התוכן. "מצגת" — שורה לדף, רק אם לא השתנתה מאז הקריאה */
  var chain = Promise.resolve();
  (P.rows[DECK] || []).forEach(function (x) {
    chain = chain.then(function () {
      return post({ action: 'deckRow', key: key, mas: x.mas, daf: x.daf, base: x.base, val: x.val })
        .then(function (res) {
          console.log('מצגת · ' + x.mas + ' ' + x.daf + ': ' + (res ? res.status : 'אין תשובה'));
        });
    });
  });
  [OWN, QS].forEach(function (tab) {
    if (!(P.rows[tab] || []).length) return;
    chain = chain.then(function () {
      var rows = t[tab].slice(1).map(function (r) { return r.slice(); });
      P.rows[tab].forEach(function (x) { rows[x.i][2] = x.val; });
      return step(tab, t[tab], rows);
    });
  });
  /* 2 · "סימוני הדף" — גיבוי, כתיבה ואימות בתוך הסקריפט */
  return chain.then(function () { return step(MARKS, t.marks, P.marks); }).then(function () {
    return sleep(2000).then(readAll);
  }).then(function (t3) {
    var bad = 0, back = {};
    t3.marks.slice(1).forEach(function (r) { back[r[0] + '|' + r[1] + '|' + r[2]] = r[3]; });
    P.marks.forEach(function (r) {
      var k = r[0] + '|' + r[1] + '|' + r[2];
      if (PAGES.indexOf(k) >= 0 && back[k] !== r[3]) { bad++; console.log('✗ ' + k + ' לא זהה אחרי הכתיבה'); }
    });
    (P.rows[DECK] || []).forEach(function (x) {
      var now = '';
      t3[DECK].slice(1).forEach(function (r) {
        if (r[0] === x.mas && ctx.SidDaf(r[1]) === ctx.SidDaf(x.daf)) now = r[2];
      });
      if (now !== x.val) { bad++; console.log('✗ מצגת · ' + x.mas + ' ' + x.daf + ' לא זהה אחרי הכתיבה'); }
    });
    console.log('--- אחרי (נקרא מהגיליון) ---');
    orphans(t3, t3.marks.slice(1)).forEach(function (l) { console.log('  ' + l); });
    if (bad) throw new Error(bad + ' לא אומתו');
    console.log('✓ הכול נכתב ונקרא שוב.');
  });
}).catch(function (e) {
  console.error('✗ ' + (e && e.message || e));
  process.exit(1);
});

function step(tab, rows, planRows) {
  var w = 0;
  rows.concat(planRows).forEach(function (r) { if (r.length > w) w = r.length; });
  if (sidFlat(rows.slice(1), w) === sidFlat(planRows, w)) {
    console.log('"' + tab + '": אין מה לכתוב');
    return Promise.resolve();
  }
  var rid = 'fx' + Date.now() + Math.floor(Math.random() * 1000);
  console.log('--- כותב את "' + tab + '" ---');
  return post({ action: 'sidStep', rid: rid, key: key, tab: tab, head: JSON.stringify(rows[0]),
                base: JSON.stringify(rows), plan: JSON.stringify(planRows) })
    .then(function () { return waitStep(rid, 0); })
    .then(function (res) {
      console.log('תשובת הסקריפט: ' + res.status + (res.message ? ' · ' + res.message : '') +
                  (res.back ? ' · ' + res.back : ''));
      if (res.status !== 'ok') throw new Error('"' + tab + '" לא נכתבה.');
      console.log('גיבוי: "' + res.backup + '"' + (res.aside ? ' · הגיבוי הקודם הועבר ל"' + res.aside + '"' : '') +
                  ' · תאים: ' + res.cells);
    });
}
