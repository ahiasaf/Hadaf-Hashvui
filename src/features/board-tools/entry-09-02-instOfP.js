
function instOfP(p) {
  var c = p.inst || '';
  for (var q = 0; q < INSTITUTIONS.length; q++) if (INSTITUTIONS[q].code === c) return c;
  return '-';
}
function applyFilt() {
  if (!ALL) return;
  roster = rosterAll ? rosterAll.filter(function (p) {
    return !FILT || instOfP(p) === FILT;
  }) : null;
}
/* אותו שם שבשורת הבחירה - מ-INSTITUTIONS, ולא מה שנכתב בגיליון. */
function instLbl(p) {
  var c = instOfP(p);
  if (c === '-') return 'ללא ישיבה';
  for (var q = 0; q < INSTITUTIONS.length; q++) if (INSTITUTIONS[q].code === c) return INSTITUTIONS[q].name;
  return c;
}
function setFilt(v) { FILT = v; view = ''; applyFilt(); draw(); }
function chipsHtml() {
  if (!ALL || !rosterAll || EMBED) return '';
  /* תלמידים בלבד, בלי רשומות בדיקה - כמו הסיכום (PplCount). קודם
     ספר כל שורה, ולכן הורה שנרשם כשורה נספר כתלמיד נוסף. */
  var n = {}, tot = 0;
  rosterAll.forEach(function (p) {
    if (p.test || p.role === 'הורה') return;
    var c = instOfP(p); n[c] = (n[c] || 0) + 1; tot++;
  });
  var chip = function (v, t, k) {
    return '<button class="ichip' + (FILT === v ? ' on' : '') +
      '" onclick="setFilt(\'' + v + '\')">' + esc(t) + ' · ' + k + '</button>';
  };
  return '<div class="ichips">' + chip('', 'כל הישיבות', tot) +
    INSTITUTIONS.filter(function (x) { return n[x.code]; }).map(function (x) {
      return chip(x.code, x.name, n[x.code]);
    }).join('') +
    (n['-'] ? chip('-', 'ללא ישיבה', n['-']) : '') + '</div>';
}

/* ============================================================
   קוד הגישה.

   `?inst=avir` לבדו אינו סוד - הוא שם הישיבה, ואפשר לנחש אותו.
   כל עוד הלוח היה מספרים בלבד זה הספיק. ברגע שיש בו שמות של
   תלמידים זה כבר לא, ולכן הקישור האישי נושא `&k=`.

   שלוש דקויות שנקבעו כאן:

   1. **הקוד נשמר במכשיר בפתיחה הראשונה ומנוקה מהכתובת.** הלוח
      הוא מסך שמצלמים ומראים, ו-URL עם קוד בתוכו הוא קוד שדולף
      בצילום מסך. אחרי הביקור הראשון הכתובת נקייה והלוח ממשיך
      לעבוד.

   2. **הקוד שייך למוסד ולא לאדם.** אין הרשמה, אין סיסמה אישית,
      ובישיבה שיש בה כמה אנשי צוות פשוט מעבירים את הקישור הלאה.

   3. **הזנה ידנית כגיבוי.** אפליקציה שנוספה למסך הבית מחזיקה
      אחסון נפרד מהדפדפן, ולכן מי שפתח את הקישור בספארי ואז פתח
      את האפליקציה - לא ימצא שם את הקוד. שש אותיות פותרות את זה
      בלי לחזור לרכז.
   ============================================================ */
function accKey() { return 'boardKey:' + code; }
/* מכשיר שננעל ובחר "תלמיד" - לא כאן (lock.js). */
if (!ALL && !EMBED) LOCK.kidGo();
var acc = '';
try { acc = localStorage.getItem(accKey()) || ''; } catch (e) {}
if (ALL) acc = String((LGet('cfg', {}) || {}).readKey || '').trim();

/* הקוד כבר הגיע לאפליקציה במכשיר הזה (אחרי שהרכז אישר - ראו
   accCheck ב-/management), והלוח נפתח בקישור שנבנה לפני כן, בלי
   הקוד. אותו אדם, אותו מכשיר - לוקחים אותו משם. */
function appCode() {
  if (ALL) return '';
  return String((LGet('instCodes', {}) || {})[code] || '');
}
if (!acc && appCode()) {
  acc = appCode();
  try { localStorage.setItem(accKey(), acc); } catch (e) {}
}

(function () {
  var k = qs('k');
  if (!k) return;
  acc = k;
  try { localStorage.setItem(accKey(), k); } catch (e) {}
  /* מנקים את הכתובת בלי לטעון מחדש. replaceState ולא assign -
     כפתור "אחורה" לא אמור להחזיר לגרסה שיש בה קוד. */
  try {
    if (history.replaceState) {
      history.replaceState(null, '',
        location.pathname + '?inst=' + encodeURIComponent(code));
    }
  } catch (e2) {}
})();

/* ---------- קריאה מהגיליון הציבורי ----------
   אותן שתי לשוניות שמסך ההצטרפות קורא, ומאותה סיבה: מספרים
   בלבד. */
function sheetCsv(tab) {
  var id = (LGet('cfg', {}) || {}).sheetId || SHEET_ID;
  if (!id || !navigator.onLine) return Promise.resolve(null);
  return fetch('https://docs.google.com/spreadsheets/d/' + id +
               '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab) +
               '&t=' + Date.now())
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) { return t ? csv(t) : null; })
    .catch(function () { return null; });
}
function csv(text) {
  var rows = [], row = [], f = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/* "ח׳:11 · ט׳:7" → [['ח׳',11],['ט׳',7]] - הצורה שהסקריפט כותב,
   כדי שפילוח לא ידרוש עמודה לכל שכבה. */
function pairs(t) {
  return String(t || '').split('·').map(function (p) {
    var i = p.lastIndexOf(':');
    return i < 0 ? null : [p.slice(0, i).trim(), parseInt(p.slice(i + 1), 10) || 0];
  }).filter(function (x) { return x && x[0] && x[1]; });
}

var joined = LGet('boardCache', null);
function loadBoard() {
  return Promise.all([
    sheetCsv('מונים').then(function (rows) {
      /* `!rows` = הקריאה נכשלה, ואז לא נוגעים במטמון. לשונית עם
         כותרת בלבד היא קריאה שהצליחה ותשובתה אפס - וזה בדיוק
         המצב אחרי מחיקת כל הרשומות של ישיבה. התנאי הקודם
         (`< 2`) בלע את שניהם, ולכן המספר הישן שרד את המחיקה. */
      if (!rows || !rows.length) return;
      var head = rows[0], ix = {};
      for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
      if (ix['קוד ישיבה'] === undefined) return;      /* לא הלשונית שביקשנו */
      /* אפס ולא "להשאיר כמו שהיה". כשכל הרשומות של ישיבה נמחקות
         היא נעלמת מהלשונית לגמרי, ולולא זה הלוח היה ממשיך להראות
         את המספר הישן לנצח - וזה בדיוק מה שקרה. */
      var hit = null;
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][ix['קוד ישיבה']] || '').trim() !== code) continue;
        hit = { n: parseInt(rows[r][ix['מצטרפים']], 10) || 0,
                grades: pairs(rows[r][ix['שכבות']]),
                ways:   pairs(rows[r][ix['מסגרות']]) };
      }
      joined = hit || { n:0, grades:[], ways:[] };
      LSet('boardCache', joined);
    }),
    sheetCsv('מוני-לימוד').then(function (rows) {
      var m = LCountsFrom(rows);
      if (m) LSet('learnCount', m);        /* `{}` הוא תשובה, לא כישלון */
    })
  ]).catch(function () {});
}

/* ============================================================
   הרשימה השמית - רק עם הקוד.

   המספרים באים מהלשוניות הציבוריות ואינם דורשים דבר. השמות
   באים מהגיליון הסגור, דרך הסקריפט, והקוד הוא מה שפותח אותם.
   מה שחוזר משם הוא שם פרטי, שכבה, מסגרת, ואילו שבועות סומנו -
   בלי משפחה ובלי טלפון. קישור שדלף חושף "יונתן, ז׳, לומד לבד",
   ולא רשימת קטינים שאפשר ליצור איתם קשר.
   ============================================================ */
var API_URL = (LGet('cfg', {}) || {}).api || APPS_SCRIPT_URL || '';
var roster = LGet('rosterCache:' + code, null);
