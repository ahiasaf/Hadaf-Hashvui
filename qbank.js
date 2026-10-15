/* ============================================================
   "שאלות לשיבוץ" — מאגר ההכנה של השאלות לדף האינטראקטיבי.
   ============================================================
   אינסטינקט כותב שאלות ישירות בגיליון, אחיאסף עורך אותן בכרטיסים
   (ניהול ← הדף ← שאלות), ומשם "שיבוץ בדף" פותח את הדף, והעורך
   הקיים שבו ממלא את השאלה בלחיצה — בלי העתקה והדבקה.

   משותף לשני העמודים: index.html (הכרטיסים) ו-learn.html (המילוי).

   **הכתיבה היא שורה לפי מזהה** (`action:'qbank'` ב-apps-script.gs),
   ולא כתיבת טבלה מלאה: אינסטינקט כותב במקביל, וטבלה מלאה הייתה
   מוחקת שורה שהוא הוסיף בין הקריאה לשמירה. וכמו כל כתיבה כאן —
   no-cors אטום, ולכן אחרי כל שליחה קוראים שוב ומאמתים.

   הלשונית נקראת כמו כל לשונית ציבורית. היא אינה מכילה קטעים, ולכן
   אינה חלק מההסבה למזהי קטע. אותיות עבריות כאן הן שמות עמודות
   וערכים בגיליון — לא נוסח על המסך; הנוסח ב-UI שב-data.js.
   ============================================================ */
var QB_TAB = 'שאלות לשיבוץ';
/* הערכים שבעמודת "סטטוס", לפי הסדר. ריק = טיוטה. */
var QB_ST = ['טיוטה', 'מוכנה', 'שובצה'];

/* "taanit" או "תענית" — שתיהן. אינסטינקט כותב בגיליון ביד. */
function QbMas(v) {
  v = String(v || '').trim();
  for (var i = 0; i < TRACKS.length; i++) {
    if (TRACKS[i].id === v || TRACKS[i].masechet === v) return TRACKS[i].id;
  }
  return v;
}
function QbMasName(id) {
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i].masechet;
  return id;
}
function QbDafKey(d) { return String(d || '').replace(/["'׳״\s.:]/g, ''); }

/* שורות הגיליון -> רשימה. null = הקריאה נכשלה, או שחזרה לשונית אחרת
   (gviz מגיש את הלשונית הראשונה כשהמבוקשת אינה קיימת). רשימה ריקה
   = הלשונית קיימת ואין בה שאלות. **כישלון אינו ריק.** */
function QbFromRows(rows) {
  if (!rows || !rows.length) return null;
  var head = rows[0].map(function (h) { return String(h || '').trim(); });
  var ix = function (n) { return head.indexOf(n); };
  if (ix('מזהה') < 0 || ix('שאלה') < 0) return null;
  var at = function (r, n) { var i = ix(n); return i < 0 ? '' : String(r[i] == null ? '' : r[i]).trim(); };
  var out = [];
  rows.slice(1).forEach(function (r, k) {
    var q = at(r, 'שאלה');
    if (!q) return;
    var c = at(r, 'נכונה'), ci = 'אבגד'.indexOf(c);
    var correct = /^[1-4]$/.test(c) ? +c - 1 : (c && ci >= 0 ? ci : -1);
    var st = at(r, 'סטטוס');
    if (QB_ST.indexOf(st) < 0) st = QB_ST[0];
    out.push({ id: at(r, 'מזהה'), mas: QbMas(at(r, 'מסכת')), daf: at(r, 'דף'), q: q,
               a: [at(r, 'תשובה 1'), at(r, 'תשובה 2'), at(r, 'תשובה 3'), at(r, 'תשובה 4')],
               correct: correct, st: st, note: at(r, 'הערה'), seg: at(r, 'קטע'), row: k + 2 });
  });
  return out;
}
/* שאלה שלמה — נוסח, ארבע תשובות ותשובה נכונה. רק כזו אפשר לשבץ. */
function QbFull(x) {
  return !!(x && x.q && x.a.every(function (t) { return !!t; }) && x.correct >= 0);
}
function QbNewId(mas) {
  return (mas === 'megila' ? 'm' : 't') + '-' + Date.now().toString(36);
}
/* העמודות לשליחה. רק מה שנשלח מתעדכן בשורה. */
function QbCols(x) {
  return [['מסכת', x.mas], ['דף', x.daf], ['שאלה', x.q],
          ['תשובה 1', x.a[0]], ['תשובה 2', x.a[1]], ['תשובה 3', x.a[2]], ['תשובה 4', x.a[3]],
          ['נכונה', x.correct >= 0 ? String(x.correct + 1) : ''], ['סטטוס', x.st], ['הערה', x.note || '']];
}
function QbPost(api, key, op, id, cols) {
  if (!api) return Promise.resolve();
  return fetch(api, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'qbank', key: key, op: op, id: id, cols: JSON.stringify(cols || [])
  }) }).catch(function () {});
}
function QbFind(list, id) {
  for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i];
  return null;
}
/* מה שנשלח אכן נמצא בגיליון? רק השדות שנשלחו נבדקים. */
function QbSame(got, want) {
  if (!got) return false;
  for (var k in want) {
    if (!want.hasOwnProperty(k)) continue;
    if (JSON.stringify(got[k]) !== JSON.stringify(want[k])) return false;
  }
  return true;
}
