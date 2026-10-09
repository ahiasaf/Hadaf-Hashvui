/* ============================================================
   המצגות - מקור אחד לכל המסכים.

   למה הקובץ הזה קיים
   ------------------
   עד עכשיו מצגת הוגדרה בקוד: `deck:{dir,n}` ב-data.js, והאפליקציה
   הסיקה מ-`n` שהקבצים הם 01.jpg עד NN.jpg לפי הסדר. זה עבד כל עוד
   רק מי שנוגע בקוד מוסיף מצגות - כלומר לא הרכז.

   מרגע שהרכז מעלה שקפים בעצמו, הסדר הוא נתון ולא מוסכמה: אפשר
   לדחוף שקף באמצע, למחוק אחד, ולהעלות מצגת שנייה לאותו שבוע.
   שם קובץ אינו יכול לשאת את זה - `03.jpg` שאמור לבוא לפני
   `02.jpg` דורש לשנות שם לקובץ, כלומר להעלות מחדש.

   לכן הפרדנו: **הקבצים בריפו, הסדר בגיליון.**
   הרכז גורר קבצים ל-GitHub (הם עולים ל-CDN וזה מה שהתלמיד מקבל),
   והסדר נערך במסך הניהול ונשמר בלשונית `מצגות`. שינוי סדר אינו
   נוגע בקבצים כלל.

   הנפילה לאחור
   ------------
   שבוע שאין לו שורה בגיליון ממשיך לעבוד בדיוק כמו קודם - לפי
   `deck:{dir,n}` שבקוד. לכן אין "יום מעבר": מה שעבד ממשיך לעבוד,
   ומה שנערך בניהול דורס.

   מדיניות הקריאה
   --------------
   כישלון רשת אינו לשונית ריקה. `null` = לא נגענו במטמון · כותרת
   שאינה מוכרת = הלשונית שחזרה אינה זו שביקשנו, ולכן נדחית · רק
   כותרת בלי שורות = באמת אין מצגות, והמטמון מתרוקן.
   ============================================================ */

var DECK_SHEET = 'מצגות';
var DECK_CACHE = 'df:deckCache';
var DECKS = null;          /* 'mas-week' -> {dir:'…', files:['01.jpg',…]} */

/* ---------- המטמון ---------- */
function DeckCached() {
  try {
    var raw = localStorage.getItem(DECK_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function DeckCacheSet(map) {
  try { localStorage.setItem(DECK_CACHE, JSON.stringify(map)); } catch (e) {}
}

/* ---------- פענוח הלשונית ----------
   מחזיר `null` כשמה שהתקבל אינו הלשונית שביקשנו. */
function DeckFromRows(rows) {
  if (!rows || !rows.length) return null;
  var head = rows[0].join('|');
  if (head.indexOf('מסכת') < 0 || head.indexOf('קבצים') < 0) return null;
  var out = {};
  rows.slice(1).forEach(function (r) {
    var mas = String(r[0] || '').trim();
    var wk  = parseInt(r[1], 10);
    /* תיקייה היא נתיב בריפו - אותיות לטיניות, ספרות, מקף וקו נטוי.
       מילה שנוספה לתא בטעות ("slides/taanit-1 לא") שברה את כל
       השקפים של השבוע, חוץ מאלה שנשמרו עם נתיב מלא. לכן נלקח רק
       הנתיב שבראש התא, ושאר התא נזנח. */
    var dir = (String(r[2] || '').trim().split(/\s+/)[0] || '').replace(/^\/+|\/+$/g, '');
    var fs  = String(r[3] || '').split(',');
    var ttl = String(r[4] || '').trim();
    if (!mas || !(wk > 0)) return;
    var files = [];
    fs.forEach(function (f) {
      f = f.trim();
      if (f) files.push(f);
    });
    /* שורה בלי קבצים אינה שגיאה - היא "לשבוע הזה אין מצגת",
       וזו הדרך לבטל מצגת בלי למחוק שורה. */
    out[mas + '-' + wk] = { dir: dir, files: files, title: ttl };
  });
  return out;
}

/* ---------- הבאה מהגיליון ----------
   מוחזר Promise שנפתר תמיד; כישלון פשוט משאיר את מה שהיה. */
function DeckLoad() {
  DECKS = DeckCached();
  var id = window.SHEET_ID;
  try {
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    if (cfg.sheetId) id = cfg.sheetId;
  } catch (e) {}
  if (!id || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return Promise.resolve(false);
  }
  var u = 'https://docs.google.com/spreadsheets/d/' + id +
          '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(DECK_SHEET) +
          '&t=' + (new Date()).getTime();
  return fetch(u)
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) {
      if (t === null) return false;
      var rows = DeckCsv(t);
      var map = DeckFromRows(rows);
      if (!map) return false;            /* לשונית זרה - לא נוגעים */
      DECKS = map;
      DeckCacheSet(map);
      return true;
    })
    .catch(function () { return false; });
}

/* CSV קטן ועצמאי. אותו פענוח שיושב בעמודים האחרים, וכאן הוא
   נדרש כי הקובץ נטען גם בעמודים שאין בהם `csvRows`. */
function DeckCsv(t) {
  var rows = [], row = [], f = '', q = false, i, ch;
  for (i = 0; i < t.length; i++) {
    ch = t.charAt(i);
    if (q) {
      if (ch === '"' && t.charAt(i + 1) === '"') { f += '"'; i++; }
      else if (ch === '"') q = false;
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (ch !== '\r') f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  /* BOM בתחילת התא הראשון שובר את השוואת הכותרת */
  if (rows.length && rows[0].length) {
    rows[0][0] = String(rows[0][0]).replace(/^﻿/, '');
  }
  return rows;
}

/* ---------- המצגת של שבוע ----------
   מחזיר {dir, files} או null. `week` הוא מספר השבוע החל מ-1,
   כלומר אותו מפתח שבו משתמש CONTENT. */
function DeckOf(mas, week) {
  var key = mas + '-' + week;
  var d = DECKS && DECKS[key];
  /* שורה קיימת = היא הקובעת, גם כשהיא ריקה (כך מבטלים מצגת).
     `dir` אינו נדרש: מצגת משולבת נושאת נתיבים מלאים. */
  if (d) return d.files.length ? d : null;

  /* אין שורה בגיליון - מה שבקוד */
  var c = (typeof CONTENT !== 'undefined') ? CONTENT[key] : null;
  if (!c || !c.deck || !c.deck.dir || !c.deck.n) return null;
  var existing = window.DF_DECK_FILES && DF_DECK_FILES[key];
  if (existing) return existing.length ? { dir:c.deck.dir, files:existing } : null;
  var files = [], i;
  for (i = 1; i <= c.deck.n; i++) files.push((i < 10 ? '0' : '') + i + '.jpg');
  return { dir: c.deck.dir, files: files };
}

/* הכותרת שבבאנר. שורה בגיליון גוברת על מה שבקוד, וכשאין -
   נופלים ל-CONTENT, ואם גם שם אין, המסך מציג "דף כך וכך". */
function DeckTitle(mas, week) {
  var key = mas + '-' + week;
  var d = DECKS && DECKS[key];
  if (d && d.title) return d.title;
  var c = (typeof CONTENT !== 'undefined') ? CONTENT[key] : null;
  return (c && c.title) || '';
}

/* כתובת שקף. `i` מתחיל ב-1, כמו שהמשתמש סופר.

   רשומה שיש בה `/` היא נתיב מלא מתוך הריפו, וכך שבוע יכול לשלב
   שקפים משתי מצגות ויותר - ראשון מכאן, שני משם, ושלישי בחזרה.
   רשומה בלי `/` היא שם בתוך `dir`, וזו הצורה הישנה: מצגת אחת
   בתיקייה אחת. שתיהן חיות זו לצד זו בלי המרה. */
function DeckSrc(deck, i) {
  if (!deck || i < 1 || i > deck.files.length) return '';
  var f = deck.files[i - 1];
  /* וגם כאן - המטמון במכשיר עוד נושא את התא כפי שנקרא לפני התיקון. */
  var dir = (String(deck.dir || '').split(/\s+/)[0] || '');
  var src = f.indexOf('/') >= 0 ? f : dir + '/' + f;
  return window.DF_MEDIA && DF_MEDIA[src] || src;
}

/* המטמון נטען מיד עם הקובץ, לפני כל ציור - אחרת הציור הראשון
   נופל לקוד גם כשיש מצגת ערוכה, והיא "קופצת" רגע אחר כך. */
DECKS = DeckCached();

/* ============================================================
   פתיחת דפים - איזה דף כבר פתוח ללימוד בדף האינטראקטיבי.
   ============================================================
   הרכז פותח דף ברגע שהוא מוכן, ולא לפי הלוח: דף שנפתח זמין
   מיד, גם לפני השבוע שלו - מי שמקדים מבורך. דף סגור מציג
   לתלמיד "עוד לא נפתח", עם בקשת התראה.

   **הלשונית `דפים פתוחים`** בגיליון הראשי: מסכת | דף | נפתח.
   שורה = הדף פתוח. אין שורה = נעול. היא ציבורית בכוונה: אין
   בה פרט אישי, והדף האינטראקטיבי קורא אותה בלי סיסמה.

   **לפני שהלשונית נכתבה פעם ראשונה** - רק הדף הראשון בכל מסכת
   פתוח. זו ברירת המחדל, והיא גם הנפילה לאחור כשאין רשת ואין
   מטמון.

   מדיניות הקריאה - כמו המצגות: כישלון לא נוגע במטמון · לשונית
   זרה נדחית · כותרת בלי שורות = הכול נעול, וזה מצב חוקי.
   ============================================================ */
var OPEN_SHEET = 'דפים פתוחים';
var OPEN_CACHE = 'df:openCache';
var OPENS = null;          /* 'taanit|ג' -> 1, או null = טרם נקרא */

/* `am` - עמוד שנפתח לבד (ראו האיבר הרביעי ב-CAL_TAANIT): 1 = ב.,
   2 = ב:. בלעדיו - הדף כולו. כך בלשונית: 'ב.' ו-'ב:' הן שתי שורות. */
function OpenKey(mas, daf, am) {
  return mas + '|' + String(daf || '').replace(/["'׳״\s]/g, '') +
         (am === 1 ? '.' : am === 2 ? ':' : '');
}
function OpenCached() {
  try {
    var raw = localStorage.getItem(OPEN_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function OpenFromRows(rows) {
  if (!rows || !rows.length) return null;
  var head = rows[0].join('|');
  if (head.indexOf('מסכת') < 0 || head.indexOf('דף') < 0 ||
      head.indexOf('נפתח') < 0) return null;
  var out = {};
  rows.slice(1).forEach(function (r) {
    var mas = String(r[0] || '').trim(), daf = String(r[1] || '').trim();
    /* הערך הוא תאריך הפתיחה, כדי שכתיבה חוזרת של הרשימה לא
       תמחק אותו. ריק = '1' - מספיק שיהיה אמת. */
    if (mas && daf) out[OpenKey(mas, daf)] = String(r[2] || '').trim() || '1';
  });
  return out;
}
/* הדף הראשון בכל מסכת - ברירת המחדל לפני שהרכז פתח משהו. */
function OpenDefault() {
  var out = {};
  (typeof TRACKS !== 'undefined' ? TRACKS : []).forEach(function (t) {
    for (var i = 0; i < t.cal.length; i++) {
      if (t.cal[i][2] && t.cal[i][2] !== 'סיום') {
        out[OpenKey(t.id, t.cal[i][2], OpenAm(t.cal[i]))] = '1'; break;
      }
    }
  });
  return out;
}
function OpenMap() { return OPENS || OpenDefault(); }
/* העמוד של שורת לוח - כמו LAmOf ב-learned.js, שאינו נטען בכל עמוד. */
function OpenAm(row) { var a = row && row[3]; return a === 'א' ? 1 : a === 'ב' ? 2 : 0; }
/* שם הדף של שורת לוח להצגה - ב. ב: כשנלמד עמוד אחד. כאן ולא
   ב-learned.js, כי מסך המסע (masa.html) אינו טוען אותו. */
function CalDaf(row) {
  var am = OpenAm(row);
  return row && row[2] ? row[2] + (am === 1 ? '.' : am === 2 ? ':' : '') : '';
}
/* ב: נפתח רק בשורה משלו. ב. נפתח גם בשורה הישנה של הדף כולו
   ('ב'), שנכתבה לפני שהדף התחלק - אחרת השבוע הראשון היה ננעל. */
function OpenIs(mas, daf, am) {
  var m = OpenMap();
  if (am === 2) return !!m[OpenKey(mas, daf, 2)];
  if (am === 1) return !!(m[OpenKey(mas, daf, 1)] || m[OpenKey(mas, daf)]);
  return !!m[OpenKey(mas, daf)];
}

/* Promise שנפתר תמיד: true = נקרא מהגיליון, false = נשאר מה שהיה. */
function OpenLoad() {
  OPENS = OpenCached();
  var id = window.SHEET_ID;
  try {
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    if (cfg.sheetId) id = cfg.sheetId;
  } catch (e) {}
  if (!id || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return Promise.resolve(false);
  }
  var u = 'https://docs.google.com/spreadsheets/d/' + id +
          '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(OPEN_SHEET) +
          /* כל העמודות טקסט, ואז gviz נוטה "לנחש" כמה שורות הן
             כותרת ולבלוע את השורה הראשונה לתוכה - כלומר את דף ב.
             שורת כותרת אחת, במפורש. */
          '&headers=1&t=' + (new Date()).getTime();
  return fetch(u)
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) {
      if (t === null) return false;
      var map = OpenFromRows(DeckCsv(t));
      if (!map) return false;            /* לשונית זרה או חסרה - לא נוגעים */
      OPENS = map;
      try { localStorage.setItem(OPEN_CACHE, JSON.stringify(map)); } catch (e) {}
      return true;
    })
    .catch(function () { return false; });
}
OPENS = OpenCached();

/* ============================================================
   כיווץ תמונה לפני העלאה.
   ============================================================
   כל תמונה שעולה לריפו (שקף בניהול, שקף לחלק בפירוש) עוברת כאן:
   WebP באיכות 75, ורוחב עד 1800 פיקסלים. האיכות אינה יורדת
   מ-70 - זה הרף. PDF ווידאו אינם עוברים כאן (ה-PDF נחתך לשקפים
   במסלול משלו). GIF ו-SVG - כמו שהם: אנימציה ווקטור לא שורדים
   קנבס.

   `done(r)` - r = { url: data:… , ext: 'webp' }, או null = להעלות
   את המקור כמו שהוא: דפדפן שאינו יודע לכתוב WebP (אייפון ישן מחזיר
   PNG בשקט), תמונה שלא נטענה, או כיווץ שיצא כבד מהמקור כשלא היה
   צריך להקטין. */
var IMG_MAX_W = 1800, IMG_Q = 0.75, IMG_Q_MIN = 0.70;
function ImgShrink(file, done) {
  if (!file || !/^image\//.test(file.type || '') || /gif|svg/i.test(file.type)) { done(null); return; }
  var fr = new FileReader();
  fr.onerror = function () { done(null); };
  fr.onload = function () {
    var im = new Image();
    im.onerror = function () { done(null); };
    im.onload = function () {
      try {
        var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
        if (!w || !h) { done(null); return; }
        var k = w > IMG_MAX_W ? IMG_MAX_W / w : 1;
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        var url = cv.toDataURL('image/webp', Math.max(IMG_Q_MIN, IMG_Q));
        if (url.indexOf('data:image/webp') !== 0) { done(null); return; }
        /* ‎3/4 מאורך ה-base64 הוא גודל הקובץ */
        if (k === 1 && url.length * 0.75 > file.size) { done(null); return; }
        done({ url: url, ext: 'webp' });
      } catch (e) { done(null); }
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
