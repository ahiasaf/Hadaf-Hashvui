/* ============================================================
   המצגות — מקור אחד לכל המסכים.

   למה הקובץ הזה קיים
   ------------------
   עד עכשיו מצגת הוגדרה בקוד: `deck:{dir,n}` ב-data.js, והאפליקציה
   הסיקה מ-`n` שהקבצים הם 01.jpg עד NN.jpg לפי הסדר. זה עבד כל עוד
   רק מי שנוגע בקוד מוסיף מצגות — כלומר לא הרכז.

   מרגע שהרכז מעלה שקפים בעצמו, הסדר הוא נתון ולא מוסכמה: אפשר
   לדחוף שקף באמצע, למחוק אחד, ולהעלות מצגת שנייה לאותו שבוע.
   שם קובץ אינו יכול לשאת את זה — `03.jpg` שאמור לבוא לפני
   `02.jpg` דורש לשנות שם לקובץ, כלומר להעלות מחדש.

   לכן הפרדנו: **הקבצים בריפו, הסדר בגיליון.**
   הרכז גורר קבצים ל-GitHub (הם עולים ל-CDN וזה מה שהתלמיד מקבל),
   והסדר נערך במסך הניהול ונשמר בלשונית `מצגות`. שינוי סדר אינו
   נוגע בקבצים כלל.

   הנפילה לאחור
   ------------
   שבוע שאין לו שורה בגיליון ממשיך לעבוד בדיוק כמו קודם — לפי
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
    var dir = String(r[2] || '').trim().replace(/^\/+|\/+$/g, '');
    var fs  = String(r[3] || '').split(',');
    var ttl = String(r[4] || '').trim();
    if (!mas || !(wk > 0)) return;
    var files = [];
    fs.forEach(function (f) {
      f = f.trim();
      if (f) files.push(f);
    });
    /* שורה בלי קבצים אינה שגיאה — היא "לשבוע הזה אין מצגת",
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
      if (!map) return false;            /* לשונית זרה — לא נוגעים */
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

  /* אין שורה בגיליון — מה שבקוד */
  var c = (typeof CONTENT !== 'undefined') ? CONTENT[key] : null;
  if (!c || !c.deck || !c.deck.dir || !c.deck.n) return null;
  var files = [], i;
  for (i = 1; i <= c.deck.n; i++) files.push((i < 10 ? '0' : '') + i + '.jpg');
  return { dir: c.deck.dir, files: files };
}

/* הכותרת שבבאנר. שורה בגיליון גוברת על מה שבקוד, וכשאין —
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
   שקפים משתי מצגות ויותר — ראשון מכאן, שני משם, ושלישי בחזרה.
   רשומה בלי `/` היא שם בתוך `dir`, וזו הצורה הישנה: מצגת אחת
   בתיקייה אחת. שתיהן חיות זו לצד זו בלי המרה. */
function DeckSrc(deck, i) {
  if (!deck || i < 1 || i > deck.files.length) return '';
  var f = deck.files[i - 1];
  return f.indexOf('/') >= 0 ? f : deck.dir + '/' + f;
}

/* המטמון נטען מיד עם הקובץ, לפני כל ציור — אחרת הציור הראשון
   נופל לקוד גם כשיש מצגת ערוכה, והיא "קופצת" רגע אחר כך. */
DECKS = DeckCached();
