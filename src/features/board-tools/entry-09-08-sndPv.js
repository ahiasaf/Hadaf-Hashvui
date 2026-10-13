
function sndPv() {
  var el = $('snd-pv'); if (!el) return;
  var t = (SND.txt || '').trim();
  el.innerHTML = t ? '<b>' + esc(kudoSig()) + '</b><br>' +
    (SND.per ? esc(SND.aud === 'parents' ? 'שם ההורה' : SND.aud === 'both' ? 'שם כל אחד' : 'שם התלמיד') + ', ' : '') + esc(t) : '';
  var g = $('snd-go'); if (g) g.disabled = SND.busy || t.length < 2;
}
function sendWire() {
  sndPv();
  var body = $('body');
  if (!body || body.getAttribute('data-sw')) return;
  body.setAttribute('data-sw', '1');
  body.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest && t.closest('[data-sel]'))) {
      var id = b.getAttribute('data-sel');
      SEL[id] = !SEL[id]; draw(); return;
    }
    if (!(b = t.closest && t.closest('[data-snd]'))) {
      if (t.id === 'snd-go') sndSend();
      return;
    }
    var a = b.getAttribute('data-snd'), k = a.split(':')[0], v = a.slice(k.length + 1);
    if (k === 'open') SND.open = true;
    else if (k === 'close') { SND.open = false; SELMODE = false; }
    else if (k === 'selmode') SELMODE = !SELMODE;
    else if (k === 'clear') SEL = {};
    else if (k === 'tm') SND.txt = kudoTmpls()[+v] || SND.txt;
    else if (k === 'aud') SND.aud = v;
    else if (k === 'seg') SND.seg = v;
    SND.msg = '';
    draw();
  });
  body.addEventListener('input', function (e) {
    if (e.target.id === 'snd-txt') { SND.txt = e.target.value; sndPv(); }
  });
  body.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'snd-way') { SND.way = e.target.value; draw(); }
    if (id === 'snd-grade') { SND.grade = e.target.value; draw(); }
    if (id === 'snd-per') { SND.per = e.target.checked; sndPv(); }
  });
}
function sndSend() {
  var txt = (SND.txt || '').trim();
  if (txt.length < 2 || SND.busy) return;
  var sel = selIds(), w = sndWeek();
  var flt = { per: SND.per ? 1 : 0 };
  var q = { fire:'say', key:acc, title:kudoSig(), who:'רכז',
            body:(SND.per ? '{name}, ' : '') + txt,
            role: SND.aud === 'kids' ? 'תלמיד' : '' };
  /* הורים - השרת מוצא אותם דרך התלמידים שבקבוצה (sayPeople_). */
  if (SND.aud === 'parents') flt.par = 'p';
  if (SND.aud === 'both') flt.par = 'pk';
  /* לפי מזהים: בחירה ידנית, או "ללא ישיבה" - שאין לו קוד אחד. */
  if (sel.length || FILT === '-') {
    var ids = [];
    sndList().forEach(function (p) {
      (p.ids && p.ids.length ? p.ids : [p.id]).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); });
    });
    if (!ids.length) { SND.msg = 'אין למי לשלוח.'; SND.ok = false; draw(); return; }
    if (ids.length > 60) {
      SND.msg = 'אפשר לשלוח עד 60 מכשירים בבת אחת לפי בחירה. צמצמו את הקבוצה.';
      SND.ok = false; draw(); return;
    }
    flt.ids = ids;
  } else {
    if (FILT) q.only = FILT;
    if (SND.grade) q.grade = SND.grade;
    if (SND.seg && w) { flt.seg = SND.seg; flt.wk = w.wk; }
    if (SND.way) flt.way = SND.way;
  }
  q.flt = JSON.stringify(flt);
  if (!confirm('לשלוח?\n' + sndToLabel() + '\n\n' + txt)) return;
  SND.busy = true; SND.msg = ''; draw();
  askScript(q).then(function (d) {
    SND.busy = false;
    if (d && d.status === 'ok') {
      /* השרת קיבל את הבקשה - זה לא "נשלח". התוצאה נרשמת ביומן. */
      SND.ok = true; SND.msg = String(UI.bdSndOk || '').replace('{who}',
        d.dads != null ? ' - ' + d.dads + ' הורים' + (d.kids ? ' ו-' + d.kids + ' תלמידים' : '') : '');
      SND.txt = ''; SEL = {}; SELMODE = false;
    } else {
      SND.ok = false; SND.msg = 'לא נשלח. ' + ((d && d.message) || 'אין תשובה מהשרת.');
    }
    draw();
  });
}

function keyHtml() {
  if (acc && roster) return '';
  if (ALL && !acc) {
    return '<div class="keyline">הלוח של כל הישיבות נפתח רק במכשיר שבו שמורה ' +
      'סיסמת הסקריפט (ניהול ← מערכת).</div>';
  }
  /* ============================================================
     **עד שהרכז מאשר - "אנא המתן", ולא "יש לי קוד".**
     ============================================================
     "אין קוד יותר. האישור דרך הרכז." ראש החטיבה שנרשם אינו
     מחזיק שום קוד שאפשר להקליד; מה שהוא צריך לדעת הוא שבודקים
     אותו ושזה יגיע. ועם זה - רענון ביד, והבדיקה העצמית כל חצי
     דקה (ראו waitTry).
     ============================================================ */
  if (!acc) {
    /* בלי כפתור רענון - הבדיקה העצמית כל חצי דקה (waitTry). */
    return '<div class="keyline">' + esc(UI.bdWait || '') +
      (rosterMsg ? '<br><b>' + esc(rosterMsg) + '</b>' : '') + '</div>';
  }
  return '<div class="keyline">' + esc(rosterMsg || 'טוען את הרשימה…') +
    '</div>';
}


/* ---------- הקישור לתלמידים ----------
   כאן, ולא רק בהודעה שנשלחה בהרשמה: הודעת וואטסאפ נקברת
   בקבוצה תוך יומיים, והלוח הוא מה שהוא שומר. */
/* בסיס הכתובת - בלי המקטע האחרון, יהיה אשר יהיה.

   `cleanUrls` ב-Vercel מגיש את העמוד הזה בכתובת `/board` ולא
   `/board.html`, ולכן הסרה של הסיומת לא תפסה כלום: הבסיס נשאר
   `…/board`, והקישור שנבנה עליו יצא `…/boardboard.html` - 404
   אצל כל מי שקיבל אותו. */
function baseUrl() {
  return location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
}

/* הקישור לעמוד הזה עצמו, נקי מכל מה שהודבק אחריו. */
function boardUrl() {
  /* עם הקוד. קישור לצוות בלי קוד הוא קישור שייפתח אצלם על מסך
     שאומר "הזינו קוד" - כלומר לא קישור. */
  var u = baseUrl() + 'board.html?inst=' + encodeURIComponent(code);
  return acc ? u + '&k=' + encodeURIComponent(acc) : u;
}

function draw() {
  if (!inst) {
    $('body').innerHTML = '<div class="card"><h2>הקישור אינו שלם</h2>' +
      '<p class="h">כתובת הלוח כוללת את קוד הישיבה, למשל ' +
      '<span dir="ltr">board.html?inst=avir</span>. בקשו מרכז התוכנית ' +
      'את הקישור של הישיבה שלכם.</p></div>';
    return;
  }
  /* נעול - רק השאלה, בלי מספרים ובלי שמות (lock.js). */
  if (boardLocked && !acc && !ALL) {
    $('sub').textContent = inst.name;
    $('body').innerHTML = LOCK.html();
    embedSize();
    return;
  }
  $('sub').textContent = inst.name;

  var wk = LWeek(), tr = TRACKS[0].id;
  try { var t = localStorage.getItem('dfHomeTrack');
        for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === t) tr = t; } catch (e) {}

  /* בכל הישיבות אין מונה ציבורי אחד - הכול נספר מהרשימה. */
  if (ALL) {
    if (!rosterAll) {
      $('body').innerHTML = '<div class="card">' + keyHtml() + '</div>';
      wire();
      return;
    }
    var jw = {};
    roster.forEach(function (p) { jw[p.way || ''] = (jw[p.way || ''] || 0) + 1; });
    joined = { n: roster.length, grades: [],
               ways: Object.keys(jw).map(function (w) { return [w, jw[w]]; }) };
  }
  var n     = joined ? joined.n : 0;
  var dads  = 0;
  if (joined) joined.ways.forEach(function (p) { if (p[0] === 'אבות ובנים') dads = p[1]; });
  var daf   = wk >= 0 ? LDafName(tr, wk) : null;
  var didWk = wk >= 0 ? LCount(tr, wk, code) : 0;

  /* ============================================================
     שני הקישורים ירדו מהמסך הזה.
     ============================================================
     הקישור לתלמידים והקישור לצוות ישבו כאן משני טעמים טובים
     שפגו: אז לא היה עמוד צוות, והמסך הזה היה הדרך היחידה
     להפיץ. היום יש עמוד צוות, והקישור לתלמידים יושב בו בתוך
     המשימה שהוא חלק ממנה.

     מה שנשאר כאן הוא דבר אחד: **מי לומד.** מסך שמציג נתונים
     ומציע שתי פעולות הפצה אינו מסך נתונים - הוא ארבע החלטות
     שמתחרות זו בזו, ומי שבא לראות מי לומד עובר דרך כולן.
     ============================================================ */

  /* לפני שהצטרף מישהו - לא אפס ושלושה גרפים ריקים, אלא מה
     לעשות עכשיו. זה גם מה שהופך את הלוח למלא מחר. */
  if (!n) {
    $('body').innerHTML =
      chipsHtml() +
      '<div class="card"><div class="empty"><div class="big">📩</div>' +
      '<p>עוד לא הצטרף אף אחד.<br>הקישור לתלמידים נמצא בעמוד הצוות, ' +
      'ומרגע שיישלח - כאן יופיע מי לומד.</p></div></div>' + soonLine();
    wire();
    return;
  }

  /* ============================================================
     **דרך לימוד אחת - מסך משלה.**
     ============================================================
     "אחרי לחיצה על 'לומד בחבורה' הפירוט נפתח, אבל 'התלמידים לפי
     כיתה' נשאר מתחתיו. כשנבחרה קטגוריה - להציג רק אותה."
     ו"אפשרות לחזור אחורה" - באייפון, באפליקציה שבמסך הבית, אין
     כפתור חזרה של הדפדפן. ולכן: חזרה בראש המסך, ומסך הבית
     בכפתור הקבוע (ראו homeFab).
     ============================================================ */
  if (!EMBED && roster && view.indexOf('way:') === 0) {
    $('body').innerHTML = chipsHtml() + delMsgHtml() + wayScreen() + soonLine();
    wire();
    return;
  }

  var weekOpen = roster && LWeek() >= 0;

  /* המספר שראש חטיבה פותח את הלוח בשבילו, ורק הוא, למעלה.
     כשיש רשימה שמית - סופרים ממנה, כי היא מדויקת יותר מהמונה. */
  /* תלמידים בלבד - הורה שנרשם כשורה ורשומת בדיקה (בלוח של כל
     הישיבות) אינם "מתוך". כמו PplCount ב-ways.js. */
  var kidsN = roster ? roster.filter(function (p) { return p.role !== 'הורה' && !(ALL && p.test); }) : null;
  var doneN = kidsN ? kidsN.filter(didWeek).length : didWk;
  var totN  = kidsN ? kidsN.length : n;

  /* ============================================================
     הסדר: מספר אחד ← דרכי הלימוד ← התלמידים לפי כיתה.
     ============================================================
     **המספר נאמר פעם אחת.** קודם הוא הופיע חמש פעמים במסך
     אחד - בכותרת, בכרטיס, בשורת המשנה, ושוב בפילוחים -
     וכל חזרה גורעת ממנו במקום להוסיף.

     "דרכי הלימוד" ו"המספרים של הישיבה שלכם" ירדו ככותרות:
     שלוש המשבצות עם המספרים והצבעים אומרות את זה בעצמן,
     וכותרת מעל דבר שמסביר את עצמו היא שורה שקוראים ולא
     לומדים ממנה.

     "לפי שכבה" ירד: שכבה היא ארבע כיתות, והרשימה שמתחת כבר
     מסודרת לפי כיתה - כלומר מדויקת יותר ומראה **מי**, לא רק
     כמה. שני פילוחים לאותו דבר הם שאלה איזה מהם נכון.

     ולר"ם שנרשם אין פילוח בכלל: הוא רואה את המספר הכולל של
     הישיבה, ואת הכיתה שלו בשמות. ============================ */
  $('body').innerHTML =
    chipsHtml() + (EMBED ? lfiltHtml() : '') + sendHtml() +
    delMsgHtml() +
    (EMBED ? '' : heroHtml(daf, doneN, totN, weekOpen)) +
    /* **המשבצות מוצגות גם לר"ם.** הן באות מהמונים ולא מהרשימה
       השמית, ולכן הן קיימות גם לפני שהתוכנית התחילה - ובלעדיהן
       ר"ם שפתח את הלוח מוקדם ראה מסך ריק. */
    /* במסך "אנשים" - שורת הסינון שלמעלה עושה את עבודת המשבצות. */
    (EMBED ? keyHtml() : '<div class="card">' + tilesHtml() + wayOpenHtml() + keyHtml() + '</div>') +
    /* בניהול (EMBED) - ההורים שלא חוברו עברו ל"התקנה", עם שליחה לכולם. */
    classesHtml() + (EMBED ? '' : parentsHtml()) + arcHtml() + hitGrpHtml() +
    soonLine();
  wire();
  embedSize();
}
/* ============================================================
   בתוך הניהול: הלוח נשאר קבוע, והעמוד שבחוץ מדבר איתו.
   ============================================================
   dfFilt - בחירת ישיבה ברשימה שבחוץ. dfReload - "רענון".
   הלוח אינו נטען מחדש לעולם; ורענון מצייר רק אם הרשימה באמת
   השתנתה, ושומר את המיקוד בחיפוש - אחרת כל רענון היה מהבהב.
   ============================================================ */
function boardSig() { return JSON.stringify(rosterAll || null) + JSON.stringify(PARENTS || null); }
function boardReload() {
  var before = boardSig();
  loadRoster().then(function (r) {
    try { window.parent.postMessage({ dfBoardN: 1, ok: !!r, msg: r ? '' : rosterMsg }, '*'); } catch (e) {}
    if (rosterAll && boardSig() === before) return;
    var a = document.activeElement, id = a && a.id, s0 = a && a.selectionStart, s1 = a && a.selectionEnd;
    draw();
    var b = id && $(id);
    if (b && b.focus && (b.tagName === 'INPUT' || b.tagName === 'TEXTAREA')) {
      b.focus();
      try { if (s0 != null) b.setSelectionRange(s0, s1); } catch (e2) {}
    }
  });
}
if (EMBED) window.addEventListener('message', function (e) {
  var d = e && e.data;
  if (!d || e.source !== window.parent) return;
  if (typeof d.dfFilt === 'string') {
    if (d.dfFilt === FILT) { embedSize(); return; }
    /* ישיבה אחרת - חיפוש, בחירה ושורה פתוחה של הקודמת אינם שלה. */
    FILT = d.dfFilt; view = ''; OPEN = ''; SRCH = ''; SEL = {}; SELMODE = false;
    applyFilt(); draw();
  }
  /* דרך לימוד - מהמשבצות שבניהול. '' = כולן. */
  if (typeof d.dfWay === 'string' && d.dfWay !== LWAY) {
    LWAY = d.dfWay; OPEN = ''; draw();
  }
  if (d.dfReload) boardReload();
});
/* בתוך הניהול: הגובה עובר לעמוד שמכיל, כדי שלא תהיה גלילה בתוך גלילה. */
function embedSize() {
  if (!EMBED || !window.parent || window.parent === window) return;
  setTimeout(function () {
    /* גובה התוכן עצמו - לא של המסמך, שאינו קטן מגובה המסגרת ולכן
       לעולם לא היה מתכווץ. */
    /* **התחתית של כל מה שבגוף, ולא רק של #body.** העטיפה שמתחת
       (וריפודה) הוסיפה ~26px שלא נמדדו - המסגרת יצאה קצרה מהתוכן,
       נעשתה גלילה קטנה בתוך גלילה, ובטלפון האצבע "נתקעה" בה:
       הגלילה הלכה למסגרת ולא לעמוד. */
    var hgt = 0, kids = document.body.children, y0 = window.pageYOffset || 0;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.tagName === 'SCRIPT' || !k.getClientRects().length) continue;
      var st = getComputedStyle(k);
      hgt = Math.max(hgt, k.getBoundingClientRect().bottom + y0 + (parseFloat(st.marginBottom) || 0));
    }
    /* וריפוד הגוף עצמו (34px בתחתית) - גם הוא חלק מהגובה. */
    hgt = Math.ceil(hgt + (parseFloat(getComputedStyle(document.body).paddingBottom) || 0)) + 4;
    try { window.parent.postMessage({ dfBoardH: hgt }, '*'); } catch (e) {}
  }, 30);
}
/* ---------- הכותרת ----------
   טבעת ולא מספר יבש. "7 מתוך 17" הוא נתון שצריך לחשב; טבעת
   שמלאה בשני שליש היא מצב שרואים. המספר עדיין שם, במרכזה,
   כי מי שרוצה את המדויק לא צריך לנחש אותו מהצורה.

   לפני שהלימוד התחיל אין מה למלא, ולכן במקום טבעת ריקה -
   שנקראת כאפס ולא כ"עוד לא" - מוצג מה שכן ידוע: מתי מתחילים. */
function ringHtml(done, tot) {
  var C = 213.6;                                  /* 2πr, r=34 */
  var pct = tot ? Math.max(0, Math.min(1, done / tot)) : 0;
  return '<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84">' +
    '<circle class="bg" cx="42" cy="42" r="34"></circle>' +
    '<circle class="fg" cx="42" cy="42" r="34" stroke-dasharray="' +
    (pct * C).toFixed(1) + ' ' + C + '"></circle></svg>' +
    '<div class="mid"><b>' + done + '</b><span>מתוך ' + tot + '</span></div></div>';
}
function heroHtml(daf, done, tot, canOpen) {
  if (!daf) {
    return '<div class="hero"><div style="flex:1">' +
      '<span class="tag">בקרוב</span>' +
      '<h3>מתחילים בפרשת בראשית</h3>' +
      '<div class="lead"><b>' + tot + '</b> כבר נרשמו מהישיבה</div>' +
      '<div class="sub">כשהשבוע הראשון ייפתח, כאן יופיע מי למד אותו.</div>' +
      '</div></div>';
  }
  var tag  = canOpen && view === 'week' ? 'סגירה ×' : 'מי ומי ←';
  /* שורת המשנה אמרה שוב את אותו מספר שכבר נאמר בשורה שמעליה
     ובטבעת שלצידה. מה שהיא באמת צריכה לומר הוא מה שעוד לא
     נאמר: שהשמות סגורים בלי קוד. */
  var body =
    '<div style="flex:1">' +
    '<span class="tag">השבוע</span>' +
    '<h3>דף ' + esc(daf) + '</h3>' +
    '<div class="lead"><b>' + done + '</b> מתוך ' + tot + ' סיימו את הדף</div>' +
    /* עד האישור - השורה שמתחת למשבצות אומרת את זה. */
    (canOpen || !acc ? '' : '<div class="sub">השמות נפתחים עם קוד הגישה</div>') +
    (canOpen ? '<i class="chev">' + tag + '</i>' : '') +
    '</div>' + ringHtml(done, tot);
  return canOpen
    ? '<button class="hero" onclick="go(\'week\')">' + body + '</button>' +
      (view === 'week' ? '<div class="card" style="margin-top:9px">' +
                         weekOpenHtml() + '</div>' : '')
    : '<div class="hero">' + body + '</div>';
}

/* `num()` ירדה יחד עם שורת שלוש המשבצות. */
/* משפט אחד עם תאריך, ולא רשימת פיצ'רים. רשימה קוראת כמו שיווק
   ומזמינה למדוד אותנו מול הבטחה; משפט אחד הוא הבטחה שאפשר
   לעמוד בה. */
/* לפני שהלימוד מתחיל - שורת הסימנייה של השבוע הראשון, לא
   תאריך לועזי. הלוח עצמו כבר מציג אותה; זו רק המשלימה לכותרת. */
function soonLine() {
  var d = new Date(PROGRAM.startDate + 'T00:00:00');
  if (isNaN(d) || Date.now() >= d.getTime()) return '';
  /* פתיחה מוקדמת - כבר לומדים, אין "מתחילים". */
  if (LWeek() >= 0) return '';
  var r0 = TRACKS[0].cal[0];
  return '<p class="soon">מתחילים · ' + esc(r0[1]) + ' · דף ' + esc(r0[2]) +
         '<br>' + esc(r0[0]) + '</p>';
}

function wire() {
  var wb = $('wback'); if (wb) wb.onclick = function () {
    if (WAY_FROM && history.length > 1) { history.back(); return; }
    go('');
  };
  var rg = document.querySelector('.rem-go');
  if (rg) rg.onclick = function () { remMark(rg.getAttribute('data-rem')); };
  var cq = $('cls-q');
  /* הקלדה מציירת רק את הרשימה, ורק כשהאצבע נחה (SRCH_T) -
     לא בכל אות. */
  if (cq) cq.oninput = function () {
    clearTimeout(SRCH_T);
    SRCH_T = setTimeout(function () {
      SRCH = cq.value; GRP_MORE = {}; SRCH_SHUT = {};
      var l = $('cls-list'); if (l) l.innerHTML = classesList();
      embedSize();
    }, 180);
  };
  var cl = $('cls-list');
  if (cl && !cl.getAttribute('data-gw')) {
    cl.setAttribute('data-gw', '1');
    cl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-grp],[data-more],[data-grp-all],[data-jump]');
      if (!b) return;
      e.stopPropagation();
      if (b.hasAttribute('data-jump')) grpJump(b.getAttribute('data-jump'));
      else if (b.hasAttribute('data-grp')) grpToggle(b.getAttribute('data-grp'));
      else if (b.hasAttribute('data-more')) {
        var mk = b.getAttribute('data-more');
        GRP_MORE[mk] = (GRP_MORE[mk] || GRP_PAGE) + GRP_PAGE; listRedraw();
      } else grpAll(b.getAttribute('data-grp-all') === '1');
    });
  }
  var bd = $('body');
  if (ALL && bd && !bd.getAttribute('data-ow')) {
    bd.setAttribute('data-ow', '1');
    bd.addEventListener('input', function (e) {
      if (e.target.id !== 'wa-txt') return;
      var id = e.target.getAttribute('data-wid'), g = $('wa-go');
      WA_TXT[id] = e.target.value;
      var p = (roster || []).filter(function (x) { return x.id === id; })[0];
      if (g && p) g.href = 'https://wa.me/' + waNum(p.phone) + '?text=' + encodeURIComponent(e.target.value);
    });
    bd.addEventListener('click', function (e) {
      var t = e.target, b;
      if (SELMODE) return;
      if ((b = t.closest && t.closest('[data-wa]'))) {
        var wid = b.getAttribute('data-wa');
        WA_OPEN = WA_OPEN === wid ? '' : wid;
        var l0 = $('cls-list'); if (l0) { l0.innerHTML = classesList(); embedSize(); }
        return;
      }
      if ((b = t.closest && t.closest('[data-del]'))) {
        delPerson(b.getAttribute('data-del'), b.getAttribute('data-nm')); return;
      }
      if ((b = t.closest && t.closest('[data-unarc]'))) {
        arcRestore(b.getAttribute('data-unarc'), b.getAttribute('data-nm')); return;
      }
      if ((b = t.closest && t.closest('[data-arc]'))) {
        ARC_OPEN = !ARC_OPEN;
        if (ARC_OPEN && !ARC) arcLoad(); else draw();
        return;
      }
      if (t.closest && t.closest('.dt a')) return;
      if ((b = t.closest && t.closest('[data-open]'))) {
        var id = b.getAttribute('data-open');
        OPEN = OPEN === id ? '' : id; DEL_MSG = '';
        var l = $('cls-list');
        /* רק הרשימה מצוירת מחדש - החיפוש והמיקום נשארים. */
        if (l && roster && roster.some(function (p) { return p.id === id; })) { l.innerHTML = classesList(); embedSize(); }
        else draw();
      }
    });
  }
  sendWire();
  kudoWire();
  if (KUDO_OPEN) kudoPv(kudoName(kudoWho()));
}
function legacy(txt, done) {
  var t = document.createElement('textarea');
  t.value = txt; t.setAttribute('readonly', '');
  t.style.cssText = 'position:fixed;top:-999px;opacity:0';
  document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); done(); } catch (e) {}
  document.body.removeChild(t);
}

$('foot-how').textContent = ALL ? '' :
  'שמרו את כתובת העמוד הזה - זה הלוח שלכם. הוא נשלח אליכם בהרשמה, ' +
  'ואפשר גם להוסיף אותו למסך הבית.';

/* מהמטמון מיד, ומהגיליון אחר כך - לוח שנפתח בלי רשת מראה את
   מה שהיה, ולא מסך ריק. */
/* מהמטמון מיד - רשימה שכבר נטענה פעם מוצגת בלי לחכות לשרת. */
if (ALL) { mineRam = null; rosterAll = roster; applyFilt(); }
if (EMBED) { document.body.className += ' embed'; document.documentElement.className += ' embed'; }
/* כל שינוי גובה - גם כזה שלא עבר דרך draw (תמונה, גופן, שורה
   שנפתחה) - נמדד מחדש. מסגרת קצרה מהתוכן היא גלילה בתוך גלילה,
   ובאייפון האצבע "נתקעת" בה: `overflow:hidden` על המסמך אינו
   עוצר שם גלילת מגע בתוך iframe. */
if (EMBED && window.ResizeObserver) {
  try { new ResizeObserver(function () { embedSize(); }).observe(document.body); } catch (e) {}
}
