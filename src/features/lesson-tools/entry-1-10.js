

/* ---------- הכתיבה על המסך ---------- */
function recLabel(a, v) {
  if (a === 'go')     return 'קטע ' + ((v | 0) + 1);
  if (a === 'next')   return 'הקטע הבא';
  if (a === 'prev')   return 'הקטע הקודם';
  if (a === 'chav')   return 'חברותא';
  if (a === 'deck')   return 'איור';
  if (a === 'whole')  return 'כל הדף';
  if (a === 'zoom')   return v > 0 ? 'הגדלת הביאור' : 'הקטנת הביאור';
  if (a === 'invite') return 'ההזמנה - עכשיו אתם';
  return a;
}
function recSecs(ms) { return (Math.round(ms / 100) / 10).toFixed(1); }

function recPaint() {
  var box = $('rec');
  if (!box) return;
  if (DEMO) { box.className = 'rec'; return; }   /* בזמן ניגון - מהדרך */
  box.className = 'rec on';

  var have = RECS.steps || scriptSaved();
  var b = '', act = '';

  if (RECS.on) {
    b = '<b>מקליט…</b> ' + RECS.steps.length + ' צעדים. ' +
        'עשו את ההדגמה בקצב שלכם, ובסוף לחצו "כאן ההזמנה".';
    act = '<button class="pri" onclick="recEnd()">■ כאן ההזמנה</button>';
  } else {
    if (have && have.length) {
      b = '<ol class="rec-l">' + have.map(function (st) {
            return '<li><i>' + recSecs(st[0]) + ' שנ׳</i>' +
                   esc(recLabel(st[1], st[2])) + '</li>';
          }).join('') + '</ol>' +
          '<p class="rec-t">סה״כ ' + recSecs(have.reduce(function (n, st) {
            return n + st[0]; }, 0)) + ' שניות. זה מה שיתנגן בהדגמה.</p>' +
          '<textarea class="rec-x" readonly rows="2" ' +
          'onclick="this.select()">' + esc(JSON.stringify(have)) + '</textarea>';
      act = '<button class="pri" onclick="recPlay()">▶ ניגון</button>' +
            '<button onclick="recStart()">● הקלטה מחדש</button>' +
            '<button onclick="recWipe()">מחיקה</button>';
    } else {
      b = 'לחצו <b>התחלה</b>, ואז עשו את ההדגמה ביד - לדפדף, לפתוח ' +
          'חברותא, לפתוח מצגת, לחכות. כל לחיצה נשמרת עם הזמן שעבר ' +
          'מקודמתה, וזה יהיה הקצב של ההדגמה.';
      act = '<button class="pri" onclick="recStart()">● התחלה</button>';
    }
  }
  $('rec-b').innerHTML = b;
  $('rec-a').innerHTML = act;
}

/* ============================================================
   שער הדף.
   ============================================================ */
/* המלל שנערך בניהול. learn.html אינו טוען את index.html, ולכן
   הוא לא ידע על שום עריכה - שדה שנערך בפאנל פשוט לא הגיע לכאן,
   והלוגו שנבחר לא הופיע. שתי שכבות, כמו בכל השאר: מה שפורסם
   לגיליון, ומעליו טיוטה מקומית של הרכז. */
(function applyLearnTexts() {
  /* שני אוסָפים באותו מנגנון. קודם היה כאן `gate` בלבד, ומלל
     שנוסף לעמוד הזה היה צריך העתק של אותו לולאה. */
  var into = { gate: window.GATE, play: window.PLAY, ui: window.UI };
  var take = function (map) {
    if (!map) return;
    for (var k in map) {
      var p2 = k.split('.');
      if (p2.length !== 2) continue;
      var o = into[p2[0]];
      if (!o) continue;
      if (typeof map[k] === 'string' && map[k] !== '') o[p2[1]] = map[k];
    }
  };
  try {
    take(JSON.parse(localStorage.getItem('df:textCache') || 'null'));
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    take(cfg.texts);
  } catch (e) {}
})();
function gateFill() {
  /* הלוגו קודם. כשאין - מוצג השם בלבד, ולא ריבוע ריק. */
  var wrap = $('g-logo'), img = $('g-logoimg');
  if (GATE.logo) {
    img.onerror = function () { wrap.style.display = 'none'; };
    img.src = GATE.logo;
    wrap.style.display = '';
  } else { wrap.style.display = 'none'; img.removeAttribute('src'); }
  if (GATE.gemUrl) wrap.href = GATE.gemUrl; else wrap.removeAttribute('href');

  $('g-gem').textContent = GATE.gemara;
  var buy = $('g-gembuy');
  /* כתובת ריקה - אין קישור. עדיף בלי מקישור שהומצא. */
  if (GATE.gemUrl) { buy.href = GATE.gemUrl; buy.textContent = GATE.gemBuy; buy.style.display = ''; }
  else buy.style.display = 'none';

  $('g-k2').textContent = GATE.chavK;
  $('g-chav').textContent = GATE.chav;
  $('g-chavby').textContent = GATE.chavBy || '';
  $('gate-go').textContent = GATE.go + ' ←';
}

function gateClose() {
  var g = $('gate');
  if (!g || g.className.indexOf('on') < 0) return;
  g.className = 'sheet gate on fade';
  setTimeout(function () { g.className = 'sheet gate'; }, 460);
}
function gateOpen() {
  if (quiet()) return;            /* ולא נרשם כ"נראה" - תלמיד אמיתי עוד יראה אותו */
  var g = $('gate'); if (!g) return;

  /* פעם אחת בלבד. שער שמופיע בכל כניסה ומתפוגג אחרי שנייה
     וחצי אינו קרדיט אלא הבהוב: הוא מטריד, ואיש אינו קורא אותו
     בפעם השנייה. פעם אחת, בלי מגבלת זמן, נקראת באמת. */
  var seen = false;
  try { seen = localStorage.getItem('df:gate') === '1'; } catch (e) {}
  if (seen) return;

  gateFill();
  g.className = 'sheet gate on';
  g.onclick = gateClose;
  try { localStorage.setItem('df:gate', '1'); } catch (e) {}
}

/* ============================================================
   הרכבה.
   ============================================================ */
/* מקור אחד - ראו learned.js. */
function weekIndex() {
  return (typeof LWeek === 'function') ? LWeek() : -1;
}
function calOf(mas) { return mas === 'megila' ? (window.CAL_MEGILA || []) : (window.CAL_TAANIT || []); }

function pickDaf() {
  var p = new URLSearchParams(location.search);
  var mas = p.get('mas') || 'taanit';
  if (!MAS_NAME[mas]) mas = 'taanit';
  var daf = p.get('daf') || '';
  var cal = calOf(mas), wk = -1;
  if (daf) {
    /* ב. וב: הם אותו דף בשני שבועות - `amud` בכתובת בוחר ביניהם.
       דף שאינו מתחלק - השבוע שלו, ו-`amud` רק מקפיץ לעמוד. */
    wk = LWeekOf(mas, daf, AMUD_Q);
  } else {
    wk = Math.max(0, weekIndex());
    daf = (cal[wk] || [])[2] || '';
  }
  return { mas:mas, daf:daf, week:wk, am: wk >= 0 ? LAmOf(cal[wk]) : 0 };
}

/* ============================================================
   סדר הלימוד - יחידה לכל שבוע שיש בו דף.
   ============================================================
   יחידה היא הדף כולו, או עמוד אחד ממנו כשהלוח אומר כך (ב. ואז
   ב:). "הבא" ו"הקודם" הולכים לפי היחידות, ולכן מ-ב. ממשיכים
   ל-ב: ולא נתקעים על אותו דף. שבועות בלי דף (חנוכה, פסח) וה"סיום"
   מדולגים. הלוח הוא סדר הדפים של התוכנית - כולל ההבדל בין תענית
   למגילה - ולכן אין צורך בטבלה נוספת. */
function units() {
  var cal = calOf(S.mas), out = [];
  for (var i = 0; i < cal.length; i++) {
    var d = cal[i][2];
    if (!d || d === 'סיום') continue;
    out.push({ daf: d, am: LAmOf(cal[i]), wk: i });
  }
  return out;
}
function unitAt(list) {
  for (var i = 0; i < list.length; i++)
    if (dafKey(list[i].daf) === dafKey(S.daf) && list[i].am === S.am) return i;
  return -1;
}
function unitName(u) { return u.daf + LAmMark(u.am); }
function unitQ(u) { return 'daf=' + encodeURIComponent(u.daf) + (u.am ? '&amud=' + u.am : ''); }
/* היחידה שלפני זו שעל המסך, ושאחריה. null = אין. */
function prevDaf() {
  var u = units(), i = unitAt(u);
  return i > 0 ? u[i - 1] : null;
}
function nextDaf() {
  var u = units(), i = unitAt(u);
  return i >= 0 && i + 1 < u.length ? u[i + 1] : null;
}
/* הדף **האחר** הבא - לזנב שגולש מסוף הדף. אחרי ב. בא ב:, שהוא
   אותו דף, והזנב יושב בתחילת ג. */
function nextOtherDaf() { return otherAfter(S.daf); }
function otherBefore(daf) {
  var u = units(), i = -1;
  for (var k = 0; k < u.length; k++) if (dafKey(u[k].daf) === dafKey(daf)) { i = k; break; }
  for (var j = i - 1; j >= 0; j--)
    if (dafKey(u[j].daf) !== dafKey(daf)) return u[j].daf;
  return null;
}
/* במצב עריכה - גם מה שמחוץ לשבוע (`peek`): שאר הדף אחרי נקודת
   סיום מוקדמת, והעמוד הראשון של הדף הבא. כך "כאן נגמר השבוע"
   יכול להיקבע בכל קטע, גם כשהשבוע גולש. התלמיד אינו רואה אותם. */
function flatOpt() {
  return SIDE_ADM ? { peek: 1, next: otherAfter(S.daf) } : null;
}
function otherAfter(daf) {
  var u = units(), i = -1;
  for (var k = 0; k < u.length; k++) if (dafKey(u[k].daf) === dafKey(daf)) { i = k; break; }
  for (var j = i + 1; i >= 0 && j < u.length; j++)
    if (dafKey(u[j].daf) !== dafKey(daf)) return u[j].daf;
  return null;
}
/* מחרוזת לשאילתת הגיליון. שמות הדפים מכילים גרש וגרשיים - `כ'`
   מצד אחד, `י"ט` מצד שני - ולשפת השאילתה אין תו בריחה. לכן כל ערך
   עוטף את עצמו בסימן שאינו מופיע בתוכו. ערך שמכיל את שניהם היה
   בלתי ניתן לביטוי, ולכן הוא פשוט יורד ומטופל בנפילה לאחור. */
function qLit(v) {
  if (v.indexOf("'") < 0) return "'" + v + "'";
  if (v.indexOf('"') < 0) return '"' + v + '"';
  return null;
}
function marksQuery(daf) {
  daf = daf || S.daf;
  var forms = {}, list = [];
  /* והדף שלפני - כשהשבוע שלו נגמר לפני סופו, מה שאחרי נקודת
     הסיום פותח את השבוע שלנו (ראו `upto` ב-SidFlat). */
  [daf, otherAfter(daf), otherBefore(daf)].forEach(function (d) {
    if (!d) return;
    /* גם הצורה עם הגרשיים וגם בלעדיה: הסטודיו כותב את השם כפי
       שהוא בבורר, ואיננו רוצים לתלות את הכל בניחוש איזו צורה. */
    forms[d] = 1; forms[dafKey(d)] = 1;
  });
  for (var k in forms) {
    var lit = qLit(k);
    if (lit) list.push('B = ' + lit);
  }
  if (!list.length) return null;
  return 'A, B, C, D where A = ' + qLit(S.mas) + ' and (' + list.join(' or ') + ')';
}

/* ---------- שליפת הסימונים ----------
   קודם נשלפה **כל הלשונית** - כל הדפים בשתי המסכתות - והסינון נעשה
   כאן. זה עבד, אבל הוא גדל עם ההצלחה: 17 עמודים מסומנים הם כ-220KB
   בכל פתיחה, ותוכנית מלאה של 120 עמודים היא כמיליון וחצי בייט -
   בכל פתיחה, אצל כל תלמיד, בלי מטמון (הבקשה נושאת חותמת זמן בכוונה,
   כדי שסימון חדש יגיע מיד). שיעור עם שלושים תלמידים על אותה רשת
   הכפיל את זה שוב.

   עכשיו נשלפים **שני דפים בלבד**: זה שעל המסך, והבא אחריו. הבא נחוץ
   כי קטע יכול להתחיל בסוף הדף הזה ולהיגמר בתחילת הבא, והזנב נשמר
   שם - בלעדיו התלמיד לא יראה את החצי השני. הנפח נעשה קבוע ואינו
   גדל עם מספר הדפים שסומנו.

   ואם השאילתה לא החזירה דבר - שפת השאילתה נדחתה, או ששם הדף נשמר
   בצורה שלא ניחשנו - חוזרים לשליפה המלאה. איטי, אבל נכון: תקלה כאן
   אינה נראית כשגיאה אלא כ"הדף הזה עוד לא הוכן ללימוד". */
/* יש כאן שורה של המסכת שלנו? זו גם הבדיקה אם השליפה החזירה משהו
   וגם מה שמבדיל שורת כותרת משורת נתונים - כותרת אינה נושאת שם
   מסכת. ספירת שורות גולמית לא הבחינה בין השתיים. */
/* עמוד שנלמד לבד (ב. או ב:) - רק הקטעים שלו.

   קטע שייך לעמוד שבו הוא **מתחיל**: קטע שחוצה את מעבר העמוד נשאר
   שלם בשבוע של ע״א, וב-ע״ב הוא אינו נפתח באמצע משפט. הזנב שגולש
   אל הדף הבא שייך ל-ע״ב - כמו בסוף כל דף. מספרי הקטעים והמזהים
   נשארים כמו שהם, ולכן החברותא, החידות והמקום השמור אינם זזים. */
function amudCut(built, am) {
  if (am === undefined) am = S.am;
  if (!am) return built;
  var keep = {};
  built.flat.forEach(function (v) {
    if (v.part !== 1) return;
    var pp = built.pages[v.p] || {};
    /* הראש מהדף הקודם (שבוע שנגמר שם מוקדם) פותח את ע״א. */
    var am2 = pp.head ? 1 : dafKey(pp.daf) === dafKey(S.daf) ? (pp.pg === 2 ? 2 : 1) : 2;
    if (am2 === am) keep[v.n] = 1;
  });
  return { pages: built.pages, groups: built.groups,
           flat: built.flat.filter(function (v) { return keep[v.n]; }) };
}
/* ---------- הדף הבא מובא מראש ----------
   בקטע האחרון של הדף, ברקע: הסימונים של הדף הבא (השליפה האיטית
   ביותר בפתיחה) ותמונת העמוד הראשון שלו. הסימונים נשמרים ללשונית
   הזו בלבד (sessionStorage) לשתי דקות, והדף הבא לוקח אותם במקום
   לחכות לגיליון. שליפה שנכשלה או שלא החזירה את המסכת - לא נשמרת,
   והדף הבא שולף כרגיל. */
var MARK_PRE = 'df:markPre', MARK_PRE_MS = 120000, PRE_DONE = '';
function markPreTake(q) {
  if (!q || quiet()) return null;
  try {
    var o = JSON.parse(sessionStorage.getItem(MARK_PRE) || 'null');
    sessionStorage.removeItem(MARK_PRE);
    if (!o || o.q !== q || !(Date.now() - o.at < MARK_PRE_MS)) return null;
    var rows = csvRows(o.t || '');
    return hasMine(rows) ? rows : null;
  } catch (e) { return null; }
}
function preNext() {
  var u = nextDaf();
  if (!u || dafKey(u.daf) === dafKey(S.daf) || quiet()) return;
  var q = marksQuery(u.daf);
  if (!q || PRE_DONE === q) return;
  PRE_DONE = q;
  var src = libSrc(u.daf, 1);
  if (src) { var im = new Image(); im.src = src; }
  var id = window.SHEET_ID;
  try {
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    if (cfg.sheetId) id = cfg.sheetId;
  } catch (e) {}
  if (!id) return;
  fetch('https://docs.google.com/spreadsheets/d/' + id +
        '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(MARK_TAB) +
        '&tq=' + encodeURIComponent('select ' + q) + '&t=' + Date.now())
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) {
      if (!t || !hasMine(csvRows(t))) return;
      try { sessionStorage.setItem(MARK_PRE, JSON.stringify({ q: q, at: Date.now(), t: t })); } catch (e) {}
    })['catch'](function () {});
}
function hasMine(rows) {
  if (!rows) return false;
  for (var i = 0; i < rows.length; i++) if (rows[i][0] === S.mas) return true;
  return false;
}
function loadMarks() {
    var q = marksQuery();
    var pre = markPreTake(q);
    return (pre ? Promise.resolve(pre) : sheetCsv(MARK_TAB, q)).then(function(rows) {
        MARKS_FILTERED = !!(q && rows && rows.length >= 2);
        if (q && !hasMine(rows)) return sheetCsv(MARK_TAB);
        return rows;
    }).then(function(rows) {
        if (!rows) throw new Error("Lesson marks unavailable");
        if (!hasMine(rows)) return 0;
        BUILT = SidFlat(SidParse(rows), S.mas, S.daf, flatOpt());
        var built = amudCut(BUILT);
        PAGES = built.pages;
        FLAT = built.flat;
        GROUPS = built.groups;
        return FLAT.length;
    });
}


/* ============================================================
   דף נעול.
   ============================================================
   התלמיד רואה שהדף עוד לא נפתח, ויכול לבקש התראה. הבקשה נרשמת
   בלשונית הפרטית "ממתינים לדף" עם המנוי של המכשיר, וכשהרכז
   פותח את הדף - ההתראה יוצאת רק למי שביקש (ראו opNotify
   ב-index.html). */
var OPEN_OK = false;
function lockKey() { return OpenKey(S.mas, S.daf, S.am); }

function lockShow() {
    var h = esc(String(UI.lockS).replace(/\{daf\}/g, S.daf + LAmMark(S.am)));
    h += '<div id="lock-nt"></div>';
    var wk = Math.max(0, weekIndex());
    var crow = calOf(S.mas)[wk] || [], cur = crow[2], cam = LAmOf(crow);
    if (cur && cur !== "סיום" && wk !== S.week && OpenIs(S.mas, cur, cam)) {
        h += '<br><a class="lockback" href="/lesson-tools?mas=' + encodeURIComponent(S.mas) + "&" + unitQ({
            daf: cur,
            am: cam
        }) + '">' + esc(UI.lockBack) + "</a>";
    }
    h += '<span id="lock-message"></span>';
    veil(UI.lockT, h, false);
    ntBox($("lock-nt"), lockKey(), UI.lockAsk, UI.lockOk);
}


/* ============================================================
   "רוצה לקבל התראה?" - אחד, לדף הנעול ולחידון שעוד לא עלה.
   ============================================================
   שלושה מצבים, לפי המכשיר:
   · ההתראות כבר פועלות - כפתור אחד, והבקשה נרשמת בלשונית
     "ממתינים לדף" עם המנוי. ההתראה יוצאת רק למי שביקש - `wait`
     ב-fire:'say' (ראו opNotify ב-index.html).
   · עוד לא חוברו - הכפתור מוביל למדריך החיבור, אותו מסע שבמסך
     התלמיד (`join?notes=1`). "זו הזדמנות לגרום לו לרצות."
   · חסומות - לעמוד שמסביר איך פותחים אותן.
   `key` - הערך בעמודה "דף": דף (OpenKey) או `חידון|<מסכת>-<שבוע>`. */
function ntAsked(key) {
  try { return localStorage.getItem('df:wait:' + key) === '1'; } catch (e) { return false; }
}
function ntSetupUrl() {
  var u = stuHomeUrl();
  if (!/join/.test(u)) u = 'join.html';
  return u + (u.indexOf('?') < 0 ? '?' : '&') + 'notes=1';
}
function ntBox(box, key, ask, ok) {
  if (!box) return;
  if (ntAsked(key)) { box.innerHTML = '<b class="nt-ok">✓ ' + esc(ok) + '</b>'; return; }
  var p = (window.APPX && APPX.canNote && APPX.canNote()) ? APPX.perm() : 'none';
  var h = '<div class="nt-q">' + esc(ask) + '</div>';
  if (p === 'granted') h += '<button class="lockbtn">' + esc(UI.ntYes) + '</button>';
  else if (p === 'denied') h += '<a class="lockback" href="hitraot.html">' + esc(UI.hitLink) + '</a>';
  else h += '<a class="lockbtn" href="' + esc(ntSetupUrl()) + '">' + esc(UI.ntSetup) + '</a>';
  box.innerHTML = h;
  var b = box.querySelector('button.lockbtn');
  if (b) b.onclick = function () { ntAsk(box, key, ok, b); };
}
function ntAsk(box, key, ok, b) {
  b.disabled = true;
  var no = function () {
    b.disabled = false;
    var message = box.querySelector('[role="alert"]');
    if (!message) { message = document.createElement('p'); message.setAttribute('role', 'alert'); box.appendChild(message); }
    message.textContent = 'לא הצלחנו לשמור את הבקשה. בדקו את החיבור ונסו שוב.';
  };
  if (!window.APPX || !API) { no(); return; }
  APPX.subscribe().then(function (sub) {
    var me = (typeof LMe === 'function') ? LMe() : null;
    return fetch('/api/wait', { method:'POST', headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(20000), body: JSON.stringify({
      action:'row', tab:'ממתינים לדף', cols: JSON.stringify([
        ['דף', key], ['מזהה', (me && me.id) || ''],
        ['שם', me ? ((me.first || '') + ' ' + (me.last || '')).trim() : ''],
        ['ישיבה', (me && me.instName) || ''],
        ['מכשיר', APPX.isIOS() ? 'אייפון' : 'אנדרואיד'],
        ['מנוי', JSON.stringify(sub)], ['מתי', new Date().toISOString()]
      ])
    }) }).then(function (response) {
      if (!response.ok) throw new Error('Reminder unavailable');
      return response.json();
    }).then(function (result) {
      if (result.status !== 'ok') throw new Error('Reminder not acknowledged');
      try { localStorage.setItem('df:wait:' + key, '1'); } catch (e) {}
      box.innerHTML = '<b class="nt-ok" role="status">✓ ' + esc(ok) + '</b>';
    });
  })['catch'](no);
}
