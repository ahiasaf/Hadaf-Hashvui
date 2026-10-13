
function wayDot(p) {
  var c = WAY_C[p.way || ''] || 'var(--rule)';
  return '<i class="wdot" style="background:' + c + '" title="' +
         esc(p.way || '') + '"></i>';
}
/* בכל הישיבות יחד - מקובצים לפי ישיבה ולא לפי כיתה: "ט1" של
   ישיבה אחת ו"ט1" של אחרת אינם אותה כיתה. */
var BY_INST = false;
function clsKey(p) {
  if (BY_INST) return instLbl(p);
  var g = p.grade || 'ללא שכבה';
  return p.klass ? g + '‎' + p.klass : g;
}
/* ============================================================
   חיפוש ברשימה.
   ============================================================
   "חסר לי מנגנון חיפוש" - בלוח של כל הישיבות, וגם בלוח של הצוות.
   מסנן את רשימת התלמידים בלבד (המספרים שלמעלה נשארים של הכול),
   ומתעדכן בכל הקלדה בלי לצייר מחדש את התיבה - אחרת הסמן נעלם.
   בשם פרטי ומשפחה; בכל הישיבות - גם בשם הישיבה ובטלפון. */
var SRCH = '', SRCH_T = null, SRCH_N = 0;
function srchKey(v) { return String(v || '').replace(/["'׳״\s\-]/g, '').toLowerCase(); }
function srchHit(p) {
  var q = srchKey(SRCH);
  if (!q) return true;
  var hay = [p.first, p.last, (p.first || '') + (p.last || ''), (p.last || '') + (p.first || '')];
  if (ALL) hay.push(instLbl(p), p.instName, p.phone);
  for (var i = 0; i < hay.length; i++) if (srchKey(hay[i]).indexOf(q) >= 0) return true;
  return false;
}
function classesHtml() {
  var list = shown();
  if (!list.length) return '';
  return '<div class="card"><h2>' +
    (mineRam ? 'הכיתה שלך' : ALL && !FILT ? 'התלמידים לפי ישיבה' : 'התלמידים לפי כיתה') + '</h2>' +
    '<input class="srch" id="cls-q" type="search" value="' + esc(SRCH) + '" placeholder="' +
    (ALL ? 'חיפוש - שם, ישיבה או טלפון' : 'חיפוש לפי שם') + '">' +
    '<div id="cls-list">' + classesList() + '</div>' +
    /* מקרא אחד, בתחתית, פעם אחת. */
    '<div class="legend">' +
      '<span><i class="wdot" style="background:#17468F"></i>לבד</span>' +
      '<span><i class="wdot" style="background:#4A821C"></i>חבורה</span>' +
      '<span><i class="wdot" style="background:#C08F2B"></i>אב ובן</span>' +
    '</div></div>';
}
/* ============================================================
   קבוצות מתקפלות, ושורות במנות.
   ============================================================
   נמדד: 2,000 תלמידים בכל הישיבות, מעבד מואט פי 6 (טלפון
   בינוני) - ציור הרשימה 2.6 שניות, וכל הקלדה בחיפוש עוד 0.85.
   הכול נבנה, גם מה שאיש לא גולל אליו.

   עכשיו: ישיבה ← כיתה, כל אחת כותרת שנפתחת ונסגרת. ברשימה
   גדולה (יותר מ-GRP_AUTO שורות) הכול סגור עד שפותחים; בחיפוש
   - כל קבוצה שיש בה תוצאה נפתחת. בתוך קבוצה פתוחה - GRP_PAGE
   שורות, ואז "עוד". מה שנפתח נשמר במכשיר, ונשאר אחרי רענון.
   ============================================================ */
var GRP_AUTO = 40, GRP_PAGE = 60;
var GRP_OPEN = LGet('bdGrp', {}) || {}, GRP_MORE = {};
/* `big` - הרשימה (אחרי החיפוש) ארוכה מ-GRP_AUTO. חיפוש שמצא
   מעט (עד SRCH_OPEN) פותח את כל הקבוצות שיש בהן תוצאה; חיפוש של
   אות אחת שמוצא את כולם - נשאר מקופל, עם המספרים. */
var SRCH_OPEN = 120, SRCH_SHUT = {};
function srchOpen() { return !!SRCH && SRCH_N <= SRCH_OPEN; }
function grpIsOpen(k, big) {
  /* בחיפוש - מה שנסגר אתמול אינו מסתיר תוצאה של היום. */
  if (srchOpen()) return !SRCH_SHUT[k];
  if (GRP_OPEN[k] != null) return !!GRP_OPEN[k];
  return !big;
}
function grpHead(k, lbl, n, open, sub) {
  return '<button class="clsgrp' + (sub ? ' sub' : '') + (open ? ' on' : '') + '" data-grp="' + esc(k) + '"' +
    ' aria-expanded="' + (open ? 'true' : 'false') + '"><b><i class="chev">' + (open ? '▾' : '◂') + '</i>' +
    esc(lbl) + '</b><span>' + n + '</span></button>';
}
function grpRows(k, rows, noGrade) {
  var lim = GRP_MORE[k] || GRP_PAGE, h = '';
  for (var i = 0; i < rows.length && i < lim; i++) h += pRow(rows[i], noGrade);
  if (rows.length > lim) {
    h += '<button class="klink grp-more" data-more="' + esc(k) + '">' +
      esc(String(UI.bdMore || '').replace('{n}', Math.min(GRP_PAGE, rows.length - lim))
        .replace('{left}', rows.length - lim)) + '</button>';
  }
  return h;
}
function grpBy(list, keyOf) {
  var by = {}, ord = [];
  list.forEach(function (p) {
    var k = keyOf(p);
    if (!by[k]) { by[k] = []; ord.push(k); }
    by[k].push(p);
  });
  ord.sort();
  return { by: by, ord: ord };
}
function clsOnly(p) {
  var g = p.grade || 'ללא שכבה';
  return p.klass ? g + '‎' + p.klass : g;
}
function classesList() {
  BY_INST = ALL && !FILT;
  /* ============================================================
     בניהול, כשנבחרו "כל הישיבות" - אין רשימה לפי ישיבה.
     ============================================================
     "הנתונים האלה חוזרים על עצמם כמה פעמים בניהול שלי": הבורר
     שמתחת לכותרת כבר מראה כל ישיבה ומספר, ולשונית "ישיבות
     וצוות" היא המקום של הפירוט. כאן נשאר החיפוש - שם או טלפון
     בכל הישיבות - וסינון (דרך, התראות) שמראה את מי שעונה עליו. */
  if (EMBED && BY_INST && !SRCH && !LWAY && !LPUSH) {
    BY_INST = false;
    return '<p class="h" style="margin:10px 0">' + esc(UI.bdPickInst || '') + '</p>';
  }
  var list = shown().filter(srchHit);
  if (!list.length) return '<p class="h" style="margin:10px 0">לא נמצא אף אחד.</p>';
  /* קיפול אוטומטי - רק בלוח של כל הישיבות. ראש ישיבה עם חמישים
     תלמידים ראה שש כותרות סגורות ואף שם, ובלי "ישר כוח". בלוח
     של ישיבה אחת הכיתות פתוחות; אפשר עדיין לסגור כיתה ביד. */
  var big = ALL && list.length > GRP_AUTO;
  SRCH_N = list.length;
  var top = grpBy(list, clsKey), html = '';
  if (big) {
    html += '<div class="grp-all"><button class="klink" data-grp-all="1">' + esc(UI.bdOpenAll || '') +
      '</button><button class="klink" data-grp-all="0">' + esc(UI.bdCloseAll || '') + '</button></div>';
  }
  /* דילוג מהיר לישיבה - שורת שבבים עם שם ומספר. הקשה פותחת את
     הקבוצה וגוללת אליה, בלי לעבור על כל מה שלפניה. */
  if (BY_INST && top.ord.length > 2) {
    html += '<div class="grp-jump"><span>' + esc(UI.bdJump || '') + '</span>' + top.ord.map(function (k) {
      return '<button class="chip" data-jump="' + esc('i:' + k) + '">' + esc(k) + ' · ' + top.by[k].length + '</button>';
    }).join('') + '</div>';
  }
  top.ord.forEach(function (k) {
    var rows = top.by[k], gk = (BY_INST ? 'i:' : 'c:' + (FILT || '') + ':') + k;
    var open = grpIsOpen(gk, big);
    html += grpHead(gk, k, rows.length, open, false);
    if (!open) return;
    if (!BY_INST) { html += grpRows(gk, rows, true); return; }
    /* בתוך ישיבה - לפי כיתה, גם היא מתקפלת. */
    var sub = grpBy(rows, clsOnly), subBig = rows.length > GRP_AUTO;
    sub.ord.forEach(function (c) {
      var sk = gk + '|' + c, so = grpIsOpen(sk, subBig);
      html += '<div class="grp-in">' + grpHead(sk, c, sub.by[c].length, so, true) +
        (so ? grpRows(sk, sub.by[c], true) : '') + '</div>';
    });
  });
  BY_INST = false;
  return html;
}
/* פתיחה וסגירה - רק הרשימה מצוירת מחדש. */
function grpToggle(k) {
  var big = ALL && shown().filter(srchHit).length > GRP_AUTO;
  if (srchOpen()) SRCH_SHUT[k] = !SRCH_SHUT[k];
  else { GRP_OPEN[k] = grpIsOpen(k, big) ? 0 : 1; LSet('bdGrp', GRP_OPEN); }
  listRedraw();
}
function grpAll(on) {
  var list = shown().filter(srchHit);
  BY_INST = ALL && !FILT;
  var top = grpBy(list, clsKey), so = srchOpen();
  var set = function (k, v) { if (so) SRCH_SHUT[k] = !v; else GRP_OPEN[k] = v ? 1 : 0; };
  top.ord.forEach(function (k) {
    var gk = (BY_INST ? 'i:' : 'c:' + (FILT || '') + ':') + k;
    set(gk, on);
    if (BY_INST && on) grpBy(top.by[k], clsOnly).ord.forEach(function (c) { set(gk + '|' + c, 1); });
  });
  BY_INST = false;
  LSet('bdGrp', GRP_OPEN);
  listRedraw();
}
function grpJump(k) {
  if (srchOpen()) SRCH_SHUT[k] = false;
  else { GRP_OPEN[k] = 1; LSet('bdGrp', GRP_OPEN); }
  listRedraw();
  var hs = document.querySelectorAll('[data-grp]');
  for (var i = 0; i < hs.length; i++) {
    if (hs[i].getAttribute('data-grp') !== k) continue;
    /* בתוך הניהול - הגלילה עוברת לעמוד שמכיל (אותו מקור). */
    try { hs[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { hs[i].scrollIntoView(); }
    break;
  }
}
