
/* `titled` - במסך משלו הכותרת כבר אומרת את השם והמספר. */
function wayOpenHtml(titled) {
  if (!roster || view.indexOf('way:') !== 0) return '';
  var w = view.slice(4);
  var list = roster.filter(function (p) { return (p.way || '') === w; });
  var byGrade = {}, gord = [];
  list.forEach(function (p) {
    var g = p.grade || 'ללא שכבה';
    if (!byGrade[g]) { byGrade[g] = []; gord.push(g); }
    byGrade[g].push(p);
  });
  gord.sort();
  return '<div class="open">' +
    (titled ? '' : '<div class="wgrp">' + esc(wayLbl(w)) + ' · ' + list.length + '</div>') +
    gord.map(function (g) {
      return (gord.length > 1
                ? '<div class="wgrp">' + esc(g) + ' · ' + byGrade[g].length + '</div>'
                : '') +
        byGrade[g].map(function (q) { return pRow(q, true); }).join('');
    }).join('') +
    '<p class="h" style="margin-top:10px">✓ מסמן את מי שסיים את הדף השבוע.</p></div>';
}

/* ============================================================
   מי מסתכל - וזה מה שקובע מה מוצג.
   ============================================================
   **הגנה, ולא רק התאמה.** ר"ם של כיתה שבה שלושה לומדים,
   שרואה לצידה כיתה עם עשרים, מקבל בעיקר את המסר שהוא נכשל -
   וזה מרפה את הידיים דווקא במקום שהכי צריך חיזוק. מי שאישר
   עדכונים מקבל את הכיתה שלו, ואת מספר הישיבה **בלי פילוח**.

   ומי שלא עבר את התהליך רואה הכול, ובכוונה: שם ההשוואה
   עובדת לטובה - היא מראה לו שהוא חריג, ודוחפת אותו לרשום
   את תלמידיו. ההרשמה אינה רק "קבל עדכונים"; היא גם הכניסה
   למרחב השקט.

   הרשומה נכתבת בעמוד הצוות ונקראת כאן - אותו מקור, אותו
   מכשיר. אין לה קשר לסיסמת הגישה: היא אינה מרחיבה הרשאה,
   רק מצמצמת תצוגה. */
/* ============================================================
   ר"ם - אבל לא כשהמכשיר הוא של ראש החטיבה.
   ============================================================
   מי שנרשם גם כראש חטיבה וגם כר"ם - וזה בדיוק מה שקורה לכל
   מי שבודק את שני המסלולים על אותו טלפון - קיבל את המסך של
   הר"ם: בלי פילוח דרכי הלימוד, ועם "הכיתה שלך" בלבד. וכשאין
   רשימה שמית, כלומר לפני תחילת התוכנית, המסך יצא ריק לגמרי.

   ראש חטיבה רואה את הישיבה. הוא הגדול מבין השניים.
   ============================================================ */
function ramCard() {
  try {
    if (localStorage.getItem('df:headSeen') === '1' ||
        localStorage.getItem('df:headNote') === '1') return null;
    var r = JSON.parse(localStorage.getItem('df:ram') || 'null');
    if (!r || !r.grade || !r.klass) return null;
    if (localStorage.getItem('df:ramNote') !== '1') return null;
    return r;
  } catch (e) { return null; }
}
var mineRam = ramCard();
function isMine(p) {
  if (!mineRam) return true;
  return String(p.grade || '') === mineRam.grade &&
         String(p.klass || '') === mineRam.klass;
}
/* הרשימה שמוצגת בפועל. ראש חטיבה וכל מי שלא נרשם - הכול. */
function shown() {
  if (!roster) return [];
  if (ALL) return roster.filter(function (p) {
    if (LWAY && (p.way || '') !== LWAY) return false;
    if (LPUSH === 'on' && !p.push) return false;
    if (LPUSH === 'off' && p.push) return false;
    if (LPUSH === 'nodev' && !p.nodev) return false;
    return true;
  });
  return mineRam ? roster.filter(isMine) : roster;
}
function setL(k, v) { if (k === 'w') LWAY = v; else LPUSH = v; draw(); }
/* שורת הסינון של הרשימה, ומתחתיה הסיכום - כמה תלמידים, הורים
   וכמה מהם עם התראות. */
function lfiltHtml() {
  if (!ALL || !rosterAll) return '';
  var base = roster || [];
  /* בלי רשומות בדיקה - כמו הסיכום שמעליהן, אחרת שני מספרים
     סמוכים לא מסתדרים. */
  var n = function (f) { return base.filter(function (p) { return !p.test && f(p); }).length; };
  /* ============================================================
     **דרכי הלימוד אינן כאן.** שורת "כל הדרכים · לבד · חבורה ·
     אב ובן" ישבה מתחת לשלוש המשבצות הצבעוניות של הניהול, עם
     אותם שלושה דברים במספרים קצת אחרים - ונקראה כנתון שני ולא
     כסינון. עכשיו המשבצות עצמן מסננות (dfWay, admWay ב-index).
     ההתראות - מתג אחד ברוחב מלא, עם כותרת שאומרת מה הוא.
     ============================================================ */
  var seg = function (v, t, cnt) {
    return '<button class="lseg-b' + (LPUSH === v ? ' on' : '') + '" onclick="setL(\'p\',\'' + v + '\')"' +
      ' aria-pressed="' + (LPUSH === v) + '">' + esc(t) + (cnt != null ? ' <i>' + cnt + '</i>' : '') + '</button>';
  };
  /* הסיכום - לפי מזהה הורה ייחודי ובלי רשומות בדיקה (PplCount,
     ways.js). הורים לא מקושרים - לפי הישיבה בלבד, כמו התלמידים. */
  var sum = PplCount(base, PARENTS || [], null, function (q) {
    return !FILT || (FILT === '-' ? instOfP(q) === '-' : instOfP(q) === FILT);
  });
  var pushK = n(function (p) { return p.push; });
  /* למדו בעמדה ועוד לא התקינו - רשימה משלהם, עם הודעת התקנה. */
  var noDevK = n(function (p) { return p.nodev; });
  return '<div class="lsum"><b>' + sum.kids + '</b> תלמידים · <b>' + sum.par + '</b> הורים · ' +
    '<b>' + sum.push + '</b> תלמידים עם התראות' +
    (sum.testN ? ' · ' + esc(String(UI.bdTestN || '').replace('{n}', sum.testN)) : '') + '</div>' +
    '<div class="lseg"><span class="lseg-h">' + esc(UI.bdPushH || '') + '</span><div class="lseg-g">' +
    seg('', UI.bdPushAll || '', null) +
    seg('on', '✉ ' + (UI.bdPushOn || ''), pushK) +
    seg('off', '🔕 ' + (UI.bdPushOff || ''), n(function (p) { return !p.push; })) +
    (noDevK || LPUSH === 'nodev' ? seg('nodev', '📵 ' + kt('noDevF'), noDevK) : '') + '</div></div>' +
    (LPUSH === 'off' ? whyHtml(base) + remHtml() : LPUSH === 'nodev' ? remHtml() : '');
}
function parInFilt(q) {
  if (FILT && (FILT === '-' ? instOfP(q) !== '-' : instOfP(q) !== FILT)) return false;
  if (LPUSH === 'on' && !q.push) return false;
  if (LPUSH === 'off' && q.push) return false;
  if (LPUSH === 'nodev') return false;
  if (LWAY && LWAY !== 'אבות ובנים') return false;
  return !SRCH || srchHit(q);
}
/* ---- הפרטים שנפתחים בלחיצה על שם ---- */
function telA(ph) {
  if (!ph) return '';
  var wa = waNum(ph);
  return '<a class="dt-ph" href="tel:' + esc(ph) + '">' + esc(ph) + '</a>' +
    (wa ? '<a class="dt-wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">וואטסאפ</a>' : '');
}
function pushTag(on) {
  return on ? '<span class="dt-on">✉ עם התראות</span>' : '<span class="dt-off">🔕 בלי התראות</span>';
}
function detHtml(p, isPar) {
  if (!ALL || OPEN !== p.id) return '';
  var nm = ((p.first || '') + ' ' + (p.last || '')).trim();
  var h = '<div class="dt">';
  h += '<div class="dt-r"><span>' + (isPar ? 'ההורה' : 'התלמיד') + '</span>' +
    (isPar || !p.pstate ? pushTag(p.push) : '<span class="' + (p.push ? 'dt-on' : 'dt-off') + '">' + esc(pstateTxt(p)) + '</span>') + '</div>';
  h += '<div class="dt-r"><span>טלפון</span><div>' + (telA(p.phone) || '-') + '</div></div>';
  if (!isPar) {
    h += '<div class="dt-r"><span>ישיבה</span><div>' + esc(instLbl(p)) +
      (p.grade ? ' · ' + esc(p.grade + (p.klass || '')) : '') + (p.way ? ' · ' + esc(WayLbl(p.way)) : '') + '</div></div>';
    if (p.par) {
      h += '<div class="dt-r"><span>ההורה</span><div><b>' +
        esc(((p.par.first || '') + ' ' + (p.par.last || '')).trim()) + '</b> ✓ ' + pushTag(p.par.push) +
        '<br>' + (telA(p.par.phone) || '') + '</div></div>';
    } else if (p['with']) {
      h += '<div class="dt-r"><span>ההורה</span><div>' + esc(p['with']) +
        ' <span class="dt-off">מילא בטופס - ההורה עוד לא נרשם</span></div></div>';
    }
  } else {
    h += '<div class="dt-r"><span>ישיבה</span><div>' + esc(instLbl(p)) +
      ' <span class="dt-off">לא חובר לבן</span></div></div>';
  }
  if ((p.ids || []).length > 1) {
    h += '<div class="dt-r"><span>מכשירים</span><div>' + p.ids.length + ' (אוחדו לאדם אחד)</div></div>';
  }
  /* הסרה לארכיון - גלויה וברורה, כפתור ברוחב מלא. אינה מחיקה:
     השורה עוברת ללשונית "ארכיון" ואפשר לשחזר (archivePerson_). */
  h += '<button class="dt-del" data-del="' + esc(p.id) + '" data-nm="' + esc(nm) + '">🗄 ' +
    esc(isPar ? UI.bdArcPar : UI.bdArcKid) + '</button>';
  return h + '</div>';
}
function parentsHtml() {
  if (!ALL || !PARENTS) return '';
  var list = PARENTS.filter(parInFilt);
  if (!list.length) return '';
  return '<div class="card"><h2>הורים שלא חוברו לבן · ' + list.length + '</h2>' +
    '<p class="h" style="margin:-4px 0 8px">נרשמו כהורים, ועדיין לא נמצא תלמיד שמתאים להם ' +
    '(טלפון או קישור הזמנה).</p>' +
    list.map(function (q) {
      var nm = ((q.first || '') + ' ' + (q.last || '')).trim() || '-';
      return '<div class="prow"><span class="tick"></span><div style="flex:1" class="nm" data-open="' + esc(q.id) + '">' +
        '<b>' + esc(nm) + '</b><div class="s">' + esc(instLbl(q)) + (q.test ? ' · ' + UI.rstTag : '') + '</div></div>' +
        (q.push ? '<span class="kudo" style="cursor:default">✉</span>' : '<span class="kudo off">🔕</span>') +
        '</div>' + detHtml(q, true);
    }).join('') + '</div>';
}
/* ============================================================
   הסרה לארכיון ושחזור - לא מחיקה.
   ============================================================
   מה עובר ומה נשאר - בהערה שליד archivePerson_ ב-apps-script.gs.
   הרשימה מתעדכנת רק אחרי שהשרת אישר. אחרי הסרה - כפתור "ביטול"
   מיד בהודעה; ובתחתית הלוח - כרטיס "ארכיון" עם כל מי שהוסר. */
var DEL_UNDO = null;           /* { id, nm } - האחרון שהוסר, לכפתור הביטול */
var ARC = null, ARC_OPEN = false, ARC_MSG = '';
function delPerson(id, nm) {
  if (!id || !confirm(String(UI.bdArcAsk || '').replace('{name}', nm))) return;
  DEL_MSG = UI.bdArcBusy; DEL_UNDO = null; draw();
  askScript({ archive:id, key:acc }).then(function (d) {
    if (d && d.status === 'success' && d.moved) {
      rosterAll = (rosterAll || []).filter(function (p) { return p.id !== id; });
      PARENTS = (PARENTS || []).filter(function (p) { return p.id !== id; });
      applyFilt(); selPrune(); OPEN = ''; ARC = null;
      DEL_MSG = String(UI.bdArcDone || '').replace('{name}', nm); DEL_UNDO = { id: id, nm: nm };
    } else DEL_MSG = String(UI.bdArcFail || '').replace('{m}', (d && d.message) ||
      (d && d.status === 'success' ? UI.bdArcNone : UI.bdArcNoAns));
    draw();
  });
}
function arcRestore(id, nm) {
  DEL_MSG = UI.bdArcBusy; DEL_UNDO = null; draw();
  askScript({ unarchive:id, key:acc }).then(function (d) {
    if (d && d.status === 'success' && d.restored) {
      DEL_MSG = String(UI.bdArcBack || '').replace('{name}', nm); ARC = null;
      if (ARC_OPEN) arcLoad();
      loadRoster().then(draw);
    } else DEL_MSG = String(UI.bdArcFail || '').replace('{m}', (d && d.message) || UI.bdArcNoAns);
    draw();
  });
}
function arcLoad() {
  ARC_MSG = UI.bdArcBusy;
  askScript({ archived:1, key:acc }).then(function (d) {
    if (d && d.status === 'ok') { ARC = d.people || []; ARC_MSG = ''; }
    else ARC_MSG = String(UI.bdArcFail || '').replace('{m}', (d && d.message) || UI.bdArcNoAns);
    draw();
  });
}
function delMsgHtml() {
  if (!DEL_MSG) return '';
  return '<div class="card" style="padding:10px 14px">' + esc(DEL_MSG) +
    (DEL_UNDO ? ' <button class="klink" data-unarc="' + esc(DEL_UNDO.id) + '" data-nm="' + esc(DEL_UNDO.nm) + '">' +
      esc(UI.bdArcUndo) + '</button>' : '') + '</div>';
}
function arcHtml() {
  if (!ALL || !rosterAll) return '';
  var h = '<div class="card"><button class="clsgrp' + (ARC_OPEN ? ' on' : '') + '" data-arc="1" aria-expanded="' +
    (ARC_OPEN ? 'true' : 'false') + '"><b><i class="chev">' + (ARC_OPEN ? '▾' : '◂') + '</i>' + esc(UI.bdArcT) + '</b>' +
    '<span>' + (ARC ? ARC.length : '') + '</span></button>';
  if (ARC_OPEN) {
    h += '<p class="h" style="margin:6px 0 8px">' + esc(UI.bdArcH) + '</p>';
    if (ARC_MSG) h += '<p class="h">' + esc(ARC_MSG) + '</p>';
    else if (ARC && !ARC.length) h += '<p class="h">' + esc(UI.bdArcEmpty) + '</p>';
    else (ARC || []).forEach(function (q) {
      var nm = ((q.first || '') + ' ' + (q.last || '')).trim() || '-';
      h += '<div class="prow"><span class="tick"></span><div style="flex:1"><b>' + esc(nm) + '</b>' +
        '<div class="s">' + esc([q.instName, q.role, q.at].filter(Boolean).join(' · ')) + '</div></div>' +
        '<button class="kudo" data-unarc="' + esc(q.id) + '" data-nm="' + esc(nm) + '">' + esc(UI.bdArcRestore) + '</button></div>';
    });
  }
  return h + '</div>';
}

/* ============================================================
   התלמידים לפי כיתה - הגוף של הלוח, לא נספח.
   ============================================================
   הצורך של ר"ם אינו "כמה אבות ובנים" אלא **מי**, מסודר לפי
   כיתה. דרך הלימוד נשארת - אבל כנקודה קטנה לצד השם, באותם
   שלושה צבעים של הבאנר שלמעלה, ולא כפילוח שמתחרה ברשימה.
   ============================================================ */
var WAY_C = { 'לימוד עצמי':'#17468F', 'חבורת לימוד':'#4A821C',
              'אבות ובנים':'#C08F2B' };
