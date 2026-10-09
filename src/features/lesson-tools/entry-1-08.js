
function pickOpen() {
  if (quiet() || EMB) return;
  pickDraw();
  $('pick').className = 'pick on';
  setTimeout(function () {
    var c = document.querySelector('#pick .trl-step.here') ||
            document.querySelector('#pick .trl-step.cur');
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
  }, 30);
}
function pickClose() { $('pick').className = 'pick'; }
function pickDraw() {
  var tr = null;
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === S.mas) tr = TRACKS[i];
  PICK_U = pickDafs();
  $('pick').innerHTML = '<div class="pk-box" role="dialog" aria-modal="true">' +
    '<div class="pk-h"><b>' + esc(UI.pickT) + '</b>' +
    '<button class="pk-x" onclick="pickClose()" aria-label="' + esc(UI.pickClose) + '">✕</button></div>' +
    '<div class="pk-tr">' + (tr ? TrailHtml({ tr: tr, units: PICK_U, wi: weekIndex(),
      here: pickHere(PICK_U),
      attr: function (u, k) {
        return ' role="button" tabindex="0" onclick="pickGo(' + k + ')"';
      } }) : '') + '</div></div>';
}
function amudIdx(pg) {
  for (var j = 0; j < FLAT.length; j++) {
    var pp = PAGES[FLAT[j].p];
    if (pp && pp.pg === pg && dafKey(pp.daf) === dafKey(S.daf)) return j;
  }
  return -1;
}
/* `k` - מספר השורה בחלון. אותה יחידה שעל המסך: בדף שלם - קפיצה
   לעמוד שנבחר; בעמוד שנלמד לבד - כבר כאן. אחרת - הדף שנבחר.
   ב-ב: (עמוד שנלמד לבד) `amud` הוא חלק מהיחידה; בדף שלם ע״א אינו
   נשלח, כדי שהחזרה למקום השמור תעבוד כרגיל, וע״ב - קפיצה. */
function pickGo(k) {
  var u = PICK_U[k];
  pickClose();
  if (!u) return;
  var rowAm = LAmOf(u.row);
  if (dafKey(u.daf) === dafKey(S.daf) && rowAm === S.am && FLAT.length) {
    if (S.am) return;
    var j = amudIdx(u.am);
    if (j >= 0) go(j); else toast(fillT(UI.pickNoAm, { amud: amud(u.am) }));
    return;
  }
  location.href = 'learn.html?mas=' + encodeURIComponent(S.mas) + '&daf=' + encodeURIComponent(u.daf) +
    (rowAm || u.am === 2 ? '&amud=' + u.am : '') + keepQ();
}
var AMUD_Q = +((/[?&]amud=([12])\b/.exec(location.search) || [])[1] || 0);

/* ============================================================
   ניווט.
   ============================================================ */
function go(i) {
  if (i < 0) return;
  if (i >= FLAT.length) { finish(); return; }
  IDX = i;
  var st = FLAT[IDX];
  var render = (SHOWN === st.p) ? Promise.resolve()
             : showPage(PAGES[st.p].daf, PAGES[st.p].pg);
  render.then(function () {
    SHOWN = st.p;
    paint(); focus(); paintChavArea(); bar(); sideSync(); savePos(); spotSave();
    recStep('go', IDX);
  }).catch(function () { veil('לא הצלחתי לצייר את העמוד', '', false); });
}
/* מצב התצוגה במקום אחד: הכפתור, המחלקה על הגוף, והציור.
   קודם הוא היה משוכפל בין ההקשה על הכפתור לבין העלייה, והשניים
   נפרדו - העלייה שינתה את הדגל ולא את הכיתוב. */
function setWhole(on) {
  DIM = !on;
  recStep('whole');
  var el = $('whole');
  el.classList.toggle('on', on);
  if (!on) ZM = 1;                /* במיקוד אין זום */
  el.textContent = on ? 'מיקוד' : 'כל הדף';
  el.title = on ? 'חזרה למיקוד בקטע' : 'הצגת הדף כולו, עם אפשרות לגרור';
  document.body.classList.toggle('whole', on);
  if (FLAT.length) paint();
}

function buttons(on) {
  ['next', 'prev', 'chtog', 'whole', 'dktog'].forEach(function (b) {
    if ($(b)) $(b).disabled = !on;
  });
}
/* איזה עמוד מוצג - ולא רק איזה דף. עמוד שגוי הוא התקלה הכי קלה
   לפספס וגם הכי קלה לראות, אם רק כתוב מה אמור להיות על המסך. */
function amud(pg) { return pg === 1 ? 'ע״א' : pg === 2 ? 'ע״ב' : 'עמוד ' + pg; }

function bar() {
  var st = FLAT[IDX];
  /* כשהשיעור גולש אל הדף הבא, הכותרת אומרת את הדף האמיתי
     שעל המסך. תלמיד שרואה "דף ג׳ ע״א" יודע איפה לפתוח. */
  if (st) {
    var pp = PAGES[st.p];
    var same = dafKey(pp.daf) === dafKey(S.daf);
    /* ביחידה של עמוד אחד (ב. / ב:) העמוד כבר בכותרת. קטע שגולש לעמוד
       האחר - "דף ב.-ב:". */
    $('t-daf').textContent = same && S.am
      ? HEAD + (pp.pg === S.am ? '' : '-' + S.daf + LAmMark(pp.pg))
      : (same ? HEAD : 'מסכת ' + (MAS_NAME[S.mas] || '') + ' · דף ' + pp.daf) + ' ' + amud(pp.pg);
  }
  /* מספר הקטע ירד. לתלמיד לא אכפת שהוא בקטע 17 מתוך 41 - זו
     חשבונאות של מי שחילק את הדף, לא של מי שלומד אותו. פס
     ההתקדמות שמתחת כבר אומר איפה הוא, בעין ובלי מספר.

     המקום נשאר: הוא קטן, הוא בכותרת, והוא בדיוק הגודל של שורה
     אחת שקטה. */
  $('count').textContent = '';
  $('bar').style.width = ((IDX + 1) / FLAT.length * 100) + '%';
  $('prev').disabled = IDX === 0 && !prevDaf();
  var last = IDX === FLAT.length - 1;
  $('next').textContent = last
    ? (DONE_SEEN && nextDaf() ? 'דף ' + unitName(nextDaf()) + ' ◂' : 'סיום ◂')
    : (st && st.part < st.parts ? 'המשך ◂' : 'הבא ◂');
}
/* ---------- מדידת זמנים ----------
   "לוקח שש שניות" היא תלונה שאי אפשר לתקן בלי לדעת לאן הזמן הלך,
   ובטלפון אין קונסולה להסתכל בה. `learn.html?debug=1` מציג את
   הפירוק על המסך - כמה לקח המאגר, כמה הסימונים, כמה התמונה, והאם
   שאילתת שני-הדפים תפסה או שהיא נפלה חזרה לשליפה המלאה.

   בלי הפרמטר לא נוצר כלום ולא מוצג כלום, ולכן זה אינו עולה דבר
   לתלמיד. */
var T0 = Date.now(), TLOG = [];
var DEBUG = /(?:^|[?&])debug=1/.test(location.search);
function tick(name, p) {
  if (!DEBUG) return p;
  var t = Date.now();
  p.then(function () { TLOG.push([name, Date.now() - t]); showTimes(); },
         function () { TLOG.push([name + ' (נכשל)', Date.now() - t]); showTimes(); });
  return p;
}
function showTimes() {
  if (!DEBUG) return;
  var el = document.getElementById('dbg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dbg';
    el.style.cssText = 'position:fixed;inset-inline:8px;bottom:8px;z-index:99;' +
      'background:rgba(11,37,80,.93);color:#fff;font:700 12px/1.7 system-ui;' +
      'padding:10px 12px;border-radius:10px;white-space:pre;direction:rtl';
    document.body.appendChild(el);
  }
  el.textContent = TLOG.map(function (r) { return r[0] + ': ' + r[1] + 'ms'; })
    .concat('סה״כ: ' + (Date.now() - T0) + 'ms',
            'שאילתה: ' + (MARKS_FILTERED === null ? '-'
              : MARKS_FILTERED ? 'שני דפים ✓' : 'נפלה לשליפה מלאה ✗')).join('\n');
}
var MARKS_FILTERED = null;

/* הדף הבא, כתובת מלאה. אין כאן בדיקה אם הוא כבר סומן - בכוונה:
   `learn.html` יודע לומר בעצמו "הדף הזה עוד לא הוכן ללימוד", וזו
   תשובה טובה יותר מכפתור שנעלם בלי הסבר. */
function prevDafUrl() {
  var u = prevDaf();
  return u ? 'learn.html?mas=' + encodeURIComponent(S.mas) +
             '&' + unitQ(u) + '&at=end' + keepQ() : null;
}
/* "הקודם" בקטע הראשון ממשיך אל הקטע האחרון של הדף שלפניו - כמו
   ש"הבא" בסוף הדף ממשיך אל הדף הבא. `at=end` אומר לדף שנפתח
   להתחיל מסופו. */
function goBack() {
  if (IDX > 0) { go(IDX - 1); return; }
  var u = prevDafUrl();
  if (u) { location.href = u; return; }
  toast('זה הקטע הראשון');
}
var AT_END = /[?&]at=end\b/.test(location.search);
function nextDafUrl() {
  var u = nextDaf();
  return u ? 'learn.html?mas=' + encodeURIComponent(S.mas) +
             '&' + unitQ(u) + keepQ() : null;
}
function finish() {
  var key = S.mas + '-' + (S.week + 1);
  var q = window.QUIZ && QUIZ[key];
  $('done-sub').textContent = 'סיימתם את דף ' + S.daf + LAmMark(S.am) +
    ', מתחילת הדף ועד סופו.';
  var a = $('to-quiz');
  if (q) { a.style.display = ''; a.href = stuQuizUrl(key); }
  else a.style.display = 'none';

  var nd = nextDaf(), n = $('to-next');
  if (nd) { n.style.display = ''; n.href = nextDafUrl();
            n.textContent = 'לדף הבא - דף ' + unitName(nd) + ' ◂'; }
  else n.style.display = 'none';

  /* ---- סימון הלימוד ----
     אוטומטי, ורק לדף של השבוע הנוכחי. מי שחוזר בפברואר לדף
     ישן כדי לחזור עליו אינו מסמן בכך את השבוע ההוא. */
  markThisDaf();

  DONE_SEEN = true;      /* מכאן "הבא" כבר אינו מחזיר לכאן - ראו paint() */
  $('done').className = 'sheet on';
  bar();
}

/* ============================================================
   חידות בקטע - לשונית שלישית, ליד חברותא ופירוש לנוער.
   ============================================================
   גרסה קודמת הייתה חלון מרחף שנפתח מעיגול צף - "לא את הצורה
   הנקייה שיש לאפליקציה, חלק עליון גמרא וחלק תחתון פירוש". עכשיו
   זו בדיוק אותה מגירה: לשונית "שאלה" עם אייקון המיתוג, נדלקת
   רק כשלקטע הנוכחי יש שאלה (או תמיד, במצב ניהול), ומציירת לתוך
   `#chb` בדיוק כמו paintChav/paintOwn.

   הנתונים יושבים בלשונית ציבורית "שאלות בדף" (Q_TAB) - אותו
   דפוס בדיוק כמו "פירוש" (OWN_TAB): מפה דף->קטע->תוכן, נטענת
   עם `dmapFromRows`, ונשמרת בכתיבה מלאה (`action:'table'`) עם
   קריאה חוזרת לאימות.

   בכוונה נפרד לגמרי מהחידה השבועית הישנה (`QUIZ` שב-data.js,
   הנפתחת מ"סיימתי" ומ-openWeek באפליקציה של ראש החטיבה) - היא
   ממשיכה לעבוד בדיוק כמו שהייתה, כי אין דרך אוטומטית לדעת לאיזה
   קטע לשייך אותה. השאלות הקיימות אפשר עכשיו לשייך ידנית לקטע
   הנכון דרך הכלי הזה, ואז להסיר אותן מ-data.js - זו החלטת תוכן,
   לא קוד. */
var Q_TAB = 'שאלות בדף';
var QMAP = {}, QOWN = null;
function loadQuizMap() {
  return sheetCsv(Q_TAB).then(function (rows) {
    var m = dmapFromRows(rows);
    if (!m) return false;
    QMAP = m;
    QOWN = QMAP[dmKey(S.mas, S.daf)] || null;
    return true;
  }).catch(function () { return false; });
}
function qPiecesFrom_(v) { return (v && v.length !== undefined) ? v : []; }
function qPieces_(n) { return qPiecesIn_(QOWN, n); }
/* קטע שאוחד נושא את השאלות של שני הקטעים, ברצף - ראו sidKeys_. */
function qPiecesIn_(rec, n) {
  if (!rec) return [];
  var out = [];
  sidKeys_(rec, n).forEach(function (k) { out = out.concat(qPiecesFrom_(rec[k])); });
  return out;
}
/* איזו שאלה מבין שאלות הקטע מוצגת. כמעט תמיד יש אחת; אחרי איחוד
   שני קטעים שלכל אחד שאלה - שתיים, והשנייה באה אחרי התשובה. */
var Q_AT = { n: 0, i: 0 };
function qIdx_(n, len) {
  if (Q_AT.n !== n) Q_AT = { n: n, i: 0 };
  if (Q_AT.i >= len) Q_AT.i = 0;
  return Q_AT.i;
}
/* מה שבאמת מוצג: לתלמיד רק קטע עם שאלה ורק אחרי שהדף פורסם;
   לאחיאסף תמיד, כדי שיוכל להוסיף שאלה גם לקטע שעדיין ריק. */
function qVisible_(n) {
  var list = qPieces_(n);
  if (SIDE_ADM) return list;
  return (list.length && QOWN && QOWN.__pub) ? list : [];
}

/* הלשונית עצמה מצוירת בתוך chavTabHtml (ליד חברותא/פירוש
   לנוער); כאן רק התוכן שבפנים, בדיוק כמו paintChav/paintOwn. */
function paintQuiz() {
  var st = FLAT[IDX], box = $('chb');
  $('chnum').textContent = '';
  if (!st) { box.innerHTML = ''; return; }
  var n = st.n, list = qPieces_(n);
  if (!list.length) {
    if (!SIDE_ADM) { box.innerHTML = ''; return; }
    qEditOpen_(n);
    return;
  }
  var qi = qIdx_(n, list.length), q = list[qi];
  /* שאלה שכבר נענתה נכון - מדלגים לבאה שעוד לא נענתה, אם יש */
  if (!SIDE_ADM && qOk_(n, q)) for (var j = qi + 1; j < list.length; j++) {
    if (!qOk_(n, list[j])) { Q_AT.i = qi = j; q = list[j]; break; }
  }
  var done = qOk_(n, q), tried = (Q_AT.bad && Q_AT.bad[qi]) || {};
  box.innerHTML =
    (list.length > 1 ? '<div class="qz-of">' + esc(String(UI.quizOf || '')
      .replace('{i}', qi + 1).replace('{n}', list.length)) + '</div>' : '') +
    '<div class="qz-q">' + esc(q.q) + '</div>' +
    q.a.map(function (t, k) {
      var c = done ? (k === q.correct ? ' right' : '') : (tried[k] ? ' wrong' : '');
      return '<button class="qz-opt' + c + '" id="qz-opt' + k + '"' +
        (done || tried[k] ? ' disabled' : '') + '>' + esc(t) + '</button>';
    }).join('') +
    (done ? '<div class="qz-res">' + esc(UI.qLocked || '') + '</div>' : '') +
    (SIDE_ADM ? '<button class="qz-opt" id="qz-edit" style="margin-top:14px;' +
      'color:var(--blue,#17468F)">עריכת השאלה</button>' : '');
  if (!done) q.a.forEach(function (t, k) {
    if (!tried[k]) $('qz-opt' + k).onclick = function () { qAnswer(n, q, k); };
  });
  var ed = $('qz-edit');
  if (ed) ed.onclick = function () { qEditOpen_(n); };
}
/* התשובה נשלחת, וחוזרים ללשונית הרגילה - אין יותר "לסגור",
   כי אין חלון: יש רק מעבר בין לשוניות, וזה בדיוק מה שקורה כאן
   לבד. התשובה הנכונה נאמרת בהודעה חולפת (toast). */
/* תשובה נכונה נועלת את השאלה במכשיר - לפי הדף, הקטע והשאלה עצמה,
   כך ששאלה שנערכה נפתחת מחדש. */
function qOkKey_(n, q) { return 'df:qok:' + dmKey(S.mas, S.daf) + ':' + n + ':' + q.q; }
function qOk_(n, q) {
  try { return localStorage.getItem(qOkKey_(n, q)) === '1'; } catch (e) { return false; }
}
function qAnswer(n, q, k) {
  if (qOk_(n, q)) return;
  var right = k === q.correct;
  qSend(n, k, right);
  /* טעות - נשארים על אותה שאלה, התשובה שנבחרה מסומנת, ומנסים שוב. */
  if (!right) {
    toast(UI.qWrong || '');
    if (Q_AT.n !== n) Q_AT = { n: n, i: 0 };
    Q_AT.bad = Q_AT.bad || {};
    (Q_AT.bad[Q_AT.i] = Q_AT.bad[Q_AT.i] || {})[k] = 1;
    paintChavArea();
    return;
  }
  try { localStorage.setItem(qOkKey_(n, q), '1'); } catch (e) {}
  toast(UI.qRight || '');
  /* יש עוד שאלה בקטע (אחרי איחוד) - היא הבאה, והחידה נשארת פתוחה */
  var len = qVisible_(n).length;
  if (Q_AT.n === n && Q_AT.i + 1 < len) { Q_AT.i++; Q_AT.bad = null; paintChavArea(); return; }
  Q_AT = { n: n, i: 0 };
  QUIZ_OPEN = false;
  paintChavArea();
}
function qSend(n, k, right) {
  if (!API) return;
  var me = (typeof LMe === 'function') ? LMe() : null;
  fetch(API, { method:'POST', mode:'no-cors', body: JSON.stringify({
    action:'quiz', cols: JSON.stringify([
      ['דף', dmKey(S.mas, S.daf)], ['קטע', n],
      ['ישיבה', (me && me.instName) || ''],
      ['שם', me ? ((me.first || '') + ' ' + (me.last || '')).trim() : ''],
      ['טלפון', (me && me.phone) || ''],
      ['תשובה', k + 1], ['נכון', right ? 'נכון' : 'לא נכון'],
      ['מזהה', (me && me.id) || '']
    ])
  }) }).catch(function () {});
}

/* ---------- עריכה (אחיאסף בלבד) ----------
   אותו דפוס בדיוק של ownSaveAll/ownVerify: שינוי בזיכרון, כתיבה
   מלאה של הלשונית, ואז קריאה חוזרת שמאמתת - כי no-cors לעולם
   אינה הוכחה לכלום. מצוירת גם היא לתוך `#chb`, לא בחלון. */
var Q_EDIT = null;
function qEditOpen_(n) {
  var all = qPieces_(n), cur = all[qIdx_(n, all.length)];
  Q_EDIT = cur ? { q:cur.q, a:cur.a.slice(), correct:cur.correct }
               : { q:'', a:['', '', '', ''], correct:0 };
  qPaintEdit_(n);
}
function qPaintEdit_(n) {
  var pub = !!(QOWN && QOWN.__pub);
  var box = $('chb');
  box.innerHTML =
    '<div style="font-weight:800;margin-bottom:10px">עריכת שאלה לקטע ' + n + '</div>' +
    '<textarea class="qz-in" id="qe-q" placeholder="נוסח השאלה">' + esc(Q_EDIT.q) + '</textarea>' +
    Q_EDIT.a.map(function (t, k) {
      return '<div class="qz-arow">' +
        '<input type="radio" name="qe-c" id="qe-c' + k + '"' +
        (Q_EDIT.correct === k ? ' checked' : '') + '>' +
        '<input type="text" class="qz-in" id="qe-a' + k + '" value="' + esc(t) +
        '" placeholder="תשובה ' + (k + 1) + '"></div>';
    }).join('') +
    '<label class="qz-pub"><input type="checkbox" id="qe-pub"' + (pub ? ' checked' : '') + '> ' +
    'לפרסם את כל החידות של הדף הזה לתלמידים</label>' +
    '<button class="qz-opt gold" id="qe-save" style="margin-top:14px">שמירה</button>' +
    (qPieces_(n).length
      ? '<button class="qz-opt" id="qe-del" style="color:#B3261E">מחיקת השאלה מהקטע הזה</button>'
      : '') +
    '<div id="qz-res"></div>';
  Q_EDIT.a.forEach(function (t, k) {
    $('qe-a' + k).oninput = function (e) { Q_EDIT.a[k] = e.target.value; };
    $('qe-c' + k).onclick = function () { Q_EDIT.correct = k; };
  });
  $('qe-q').oninput = function (e) { Q_EDIT.q = e.target.value; };
  $('qe-save').onclick = function () { qEditSave_(n); };
  var del = $('qe-del');
  if (del) del.onclick = function () { qEditDelete_(n); };
}
/* הרשימה המלאה, לכתיבה - כמו ownRows_ בדיוק. */
function qRows_() {
  var rows = [], k;
  for (k in QMAP) {
    if (!QMAP.hasOwnProperty(k)) continue;
    var v = QMAP[k], parts = k.split('|');
    if (v && v.__bad) { rows.push([parts[0], parts[1], v.__bad]); continue; }
    var has = false, q;
    for (q in v) if (v.hasOwnProperty(q)) { has = true; break; }
    if (has) rows.push([parts[0], parts[1], JSON.stringify(v)]);
  }
  return rows;
}
function qPost_() {
  fetch(API, { method:'POST', mode:'no-cors', body: JSON.stringify({
    action:'table', tab:Q_TAB, key:cfgReadKey_(),
    cols: JSON.stringify(['מסכת', 'דף', 'שאלות']),
    rows: JSON.stringify(qRows_())
  }) }).catch(function () {});
}
function qEditSave_(n) {
  var text = (Q_EDIT.q || '').trim();
  var answers = Q_EDIT.a.map(function (t) { return (t || '').trim(); });
  if (!text || answers.some(function (t) { return !t; })) {
    var bad = $('qz-res');
    if (bad) bad.innerHTML = '<div class="qz-res" style="background:rgba(179,38,30,.1)">' +
      'צריך למלא את השאלה וגם את ארבע התשובות.</div>';
    return;
  }
  if (!writeKey_()) {
    var nk = $('qz-res');
    if (nk) nk.innerHTML = '<div class="qz-res" style="background:rgba(179,38,30,.1)">' + NOKEY_MSG + '</div>';
    return;
  }
  if (!QOWN) QOWN = {};
  /* רק השאלה שעל המסך מתחלפת. אחרי איחוד יש לקטע יותר משאלה אחת,
     וכתיבה של שאלה בודדת הייתה מוחקת את האחרת. */
  var list = qPieces_(n).slice(), qi = qIdx_(n, list.length + 1);
  list[qi] = { q:text, a:answers, correct:Q_EDIT.correct };
  sidPut_(QOWN, n, list, true);
  if ($('qe-pub').checked) QOWN.__pub = '1'; else delete QOWN.__pub;
  QMAP[dmKey(S.mas, S.daf)] = QOWN;
  qPost_();
  qVerify_(0, n, list);
}
function qEditDelete_(n) {
  if (!QOWN) return;
  if (!writeKey_()) return;
  var list = qPieces_(n).slice();
  list.splice(qIdx_(n, list.length), 1);
  sidPut_(QOWN, n, list.length ? list : undefined, true);
  Q_AT = { n: n, i: 0 };
  QMAP[dmKey(S.mas, S.daf)] = QOWN;
  qPost_();
  qVerify_(0, n, list);
}