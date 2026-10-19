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
               correct: correct, st: st, note: at(r, 'הערה'), seg: at(r, 'קטע'),
               yr: QbYrOn(at(r, QB_YR)), row: k + 2 });
  });
  return out;
}
/* "הפניה לפירוש לנוער" — עמודה משלה. ריק (וכל שאלה ישנה) = כבוי.
   גוגל עלול להחזיר TRUE אם מישהו סימן תיבה בגיליון ביד — גם זה דלוק. */
var QB_YR = 'הפניה לפירוש';
function QbYrOn(v) { return /^(כן|true|1)$/i.test(String(v || '').trim()); }
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
          ['נכונה', x.correct >= 0 ? String(x.correct + 1) : ''], ['סטטוס', x.st], ['הערה', x.note || ''],
          [QB_YR, x.yr ? 'כן' : '']];
}
/* unplace — רק כשהשאלה ירדה מהדף: אז מותר להוריד "שובצה". */
function QbPost(api, key, op, id, cols, unplace) {
  if (!api) return Promise.resolve();
  return fetch(api, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'qbank', key: key, op: op, id: id, cols: JSON.stringify(cols || []), unplace: unplace ? 1 : 0
  }) }).catch(function () {});
}
/* העמודות של תוכן השאלה — מה שמסתנכרן בין המאגר לדף. */
function QbBody(v) {
  return [['שאלה', v.q], ['תשובה 1', v.a[0]], ['תשובה 2', v.a[1]], ['תשובה 3', v.a[2]], ['תשובה 4', v.a[3]],
          ['נכונה', String(v.correct + 1)], [QB_YR, v.yr ? 'כן' : '']];
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

/* ---------- "שובצה" גוברת ----------
   שאלה ששובצה היא גם מוכנה, ושום סימון מאוחר יותר של "טיוטה" או
   "מוכנה" אינו מוריד אותה. האמת היא הדף עצמו: רשומת הדף בלשונית
   "שאלות בדף". שאלה שמולאה מהמאגר נושאת שם `qb` (המזהה), ושאלה
   ישנה — מזוהה לפי הנוסח. כך גם סימון שלא נכתב, או שנדרס, אינו
   מעלים שיבוץ. */
function QbNorm(t) { return String(t || '').replace(/["'״׳“”„\s.,:;?!—–-]/g, ''); }
/* אותה שאלה, גם כשאחד הצדדים נערך: השאלה דומה (זהה, אחת מכילה את
   השנייה, או רוב המילים משותפות) — או שאחת התשובות זהה. רק בתוך אותו
   דף, ולכן הדמיון מספיק. השרת מחזיק עותק של הכלל — qbLike_ ב-apps-script.gs. */
function QbWords(t) {
  return String(t || '').replace(/["'״׳“”„.,:;?!—–()-]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1; });
}
function QbLike(v, x) {
  if (!v || !x) return false;
  var p = QbNorm(v.q), q = QbNorm(x.q), i;
  if (p && q && (p === q || (Math.min(p.length, q.length) >= 8 && (p.indexOf(q) >= 0 || q.indexOf(p) >= 0)))) return true;
  var A = QbWords(v.q), B = QbWords(x.q), n = 0;
  for (i = 0; i < A.length; i++) if (B.indexOf(A[i]) >= 0 && A.indexOf(A[i]) === i) n++;
  if (Math.min(A.length, B.length) >= 3 && n / Math.min(A.length, B.length) >= 0.6) return true;
  var b = (x.a || []).map(QbNorm);
  for (i = 0; i < (v.a || []).length; i++) {
    var t = QbNorm(v.a[i]);
    if (t.length >= 3 && b.indexOf(t) >= 0) return true;
  }
  return false;
}
/* רשומת דף אחת -> { ids:{מזהה:1}, all:[השאלות שבלי מזהה] } */
function QbRecMarks(rec) {
  var m = { ids: {}, all: [] };
  if (!rec || typeof rec !== 'object') return m;
  var add = function (v) {
    if (!v || typeof v !== 'object' || !v.q) return;
    if (v.qb) m.ids[v.qb] = 1; else m.all.push(v);
  };
  for (var k in rec) {
    if (!rec.hasOwnProperty(k) || k.indexOf('__') === 0 || !rec[k] || rec[k].length === undefined) continue;
    for (var i = 0; i < rec[k].length; i++) {
      var x = rec[k][i];
      if (x && (x.hasOwnProperty('pub') || x.hasOwnProperty('draft'))) { add(x.pub); add(x.draft); }
      else add(x);
    }
  }
  return m;
}
/* הסטטוס להצגה. marks = QbRecMarks של הדף של השאלה (או null). */
function QbSt(x, marks) {
  if (x.st === QB_ST[2]) return x.st;
  if (!marks) return x.st;
  if (marks.ids[x.id]) return QB_ST[2];
  for (var i = 0; i < marks.all.length; i++) if (QbLike(marks.all[i], x)) return QB_ST[2];
  return x.st;
}
