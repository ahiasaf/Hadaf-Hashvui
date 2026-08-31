/* ============================================================
   סימון הלימוד — משותף לאפליקציה, למסך ההצטרפות ולמסך הלימוד.
   ============================================================
   שלושת המסכים חיים באותו מקור ולכן באותו אחסון (`df:`), אבל
   הם קבצים נפרדים. הלוגיקה כאן ולא בכל אחד מהם, כי שלוש
   עותקות של "מה נחשב שבוע" נפרדות זו מזו בשקט ביום שמישהו
   מתקן אחת מהן.

   מה נשמר איפה
   ------------
   * במכשיר — `df:learned`, מפה של 'מסלול|שבוע' → תאריך. זה
     מקור האמת עבור התלמיד: מה שהוא סימן נשאר אצלו גם בלי רשת
     וגם אם השליחה נכשלה.
   * בגיליון הפרטי — שורה לכל סימון, בלשונית "לימוד".
   * בגיליון הציבורי — **מספרים בלבד**, בלשונית "מוני-לימוד".
     זה מה שמסך ההצטרפות ולוח ראש החטיבה קוראים, ולכן שם של
     תלמיד אינו יוצא מהגיליון הסגור לעולם.

   ES5 בלבד, כמו כל השאר.
   ============================================================ */

/* ---------- אחסון ---------- */
function LGet(k, d) {
  try { var v = localStorage.getItem('df:' + k);
        return v === null ? d : JSON.parse(v); }
  catch (e) { return d; }
}
function LSet(k, v) {
  try { localStorage.setItem('df:' + k, JSON.stringify(v)); } catch (e) {}
}

/* ---------- מי אני ---------- */
/* הפרופיל נכתב במסך ההצטרפות. בלעדיו אין את מי לספור, ולכן
   סימון בלי פרופיל נשמר במכשיר אבל אינו נשלח. */
function LMe() { return LGet('me', null); }

/* ---------- השבוע ---------- */
/* אותה חשבונאות שיש ב-index.html, ובכוונה כתובה כאן שוב תחת
   שם אחר: שני המסכים האחרים אינם טוענים את index.html. */
function LWeek() {
  var start = new Date(PROGRAM.startDate + 'T00:00:00');
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var days = Math.floor((now - start) / 86400000);
  if (days < 0) return -1;
  return Math.min(Math.floor(days / 7), CAL_TAANIT.length - 1);
}
/* הדף של שבוע מסוים במסלול. null = שבוע חופשה. */
function LDaf(track, wk) {
  for (var i = 0; i < TRACKS.length; i++) {
    if (TRACKS[i].id !== track) continue;
    var row = TRACKS[i].cal[wk];
    return row && row[2] && row[2] !== 'סיום' ? row[2] : null;
  }
  return null;
}

/* ---------- מה סומן ---------- */
function LKey(track, wk) { return track + '|' + (wk + 1); }
function LDone(track, wk) { return !!LGet('learned', {})[LKey(track, wk)]; }

/* רצף — כמה שבועות אחורה ברציפות, כולל השבוע.
   שבוע חופשה אינו שובר: אין בו דף, ולכן אין מה ללמוד בו. */
function LStreak(track) {
  var wk = LWeek(), all = LGet('learned', {}), n = 0;
  if (wk < 0) return 0;
  for (var i = wk; i >= 0; i--) {
    if (!LDaf(track, i)) continue;
    if (!all[LKey(track, i)]) break;
    n++;
  }
  return n;
}

/* ---------- סימון ---------- */
/* נשמר קודם, נשלח אחר כך. `no-cors` מחזיר תשובה אטומה ולכן אי
   אפשר לדעת מהשרת אם הצליח; מה שמגן על התלמיד הוא שהסימון כבר
   אצלו במכשיר, והתור מנסה שוב בפתיחה הבאה. */
function LMark(track, wk) {
  var all = LGet('learned', {});
  var k = LKey(track, wk);
  if (all[k]) return false;                 /* כבר סומן — לא שולחים שוב */
  all[k] = new Date().toISOString();
  LSet('learned', all);

  var me = LMe();
  if (me && me.id) {
    var q = LGet('learn-q', []) || [];
    /* שורת סיום נושאת קטע = מתוך. כך השרת מבדיל בינה לבין שורת
       התקדמות באמצע, בלי לנחש לפי מה שחסר. */
    var pz = LPos(track, wk);
    q.push({ action:'row', tab:'לימוד', cols: JSON.stringify([
      ['מזהה', me.id], ['קוד ישיבה', me.inst || ''],
      ['מסלול', track], ['שבוע', wk + 1], ['דף', LDaf(track, wk) || ''],
      ['קטע', pz ? pz.n : ''], ['מתוך', pz ? pz.n : '']
    ]) });
    LSet('learn-q', q);
    LFlush();
  }
  return true;
}
/* ============================================================
   איפה הוא עצר בדף.
   ============================================================
   תלמיד שפתח דף, למד רבע ממנו וסגר — חזר למחרת אל ההתחלה. דף
   שלם הוא בין 30 ל-50 קטעים, ולכן "לחזור להתחלה" פירושו לעבור
   שוב על מה שכבר למד או לוותר. שניהם מוציאים אותו.

   נשמר במכשיר, ובנוסף נשלח ללשונית "לימוד" — כדי שהצוות יראה
   לא רק "סיים / לא סיים" אלא גם את מי שבאמצע. **פס ולא אחוזים:**
   מספר מדויק מזמין השוואה בין תלמידים, והוא גם מדויק יותר ממה
   שהוא באמת — קטע 12 מתוך 41 אינו "29 אחוז מהלימוד".

   `i` הוא הקטע האחרון שנצפה, `n` כמה יש בדף.
   ============================================================ */
function LPos(track, wk) { return (LGet('pos', {}) || {})[LKey(track, wk)] || null; }
function LPosSet(track, wk, i, n) {
  if (!(n > 1)) return;
  var all = LGet('pos', {}) || {}, k = LKey(track, wk);
  var cur = all[k];
  /* אחורה לא נשמר. תלמיד שחוזר לעיין בקטע קודם אינו "מתקדם
     פחות", ולוח שקופץ אחורה בכל דפדוף אינו אומר דבר. */
  if (cur && cur.n === n && cur.i >= i) return;
  all[k] = { i:i, n:n, at:new Date().toISOString() };
  LSet('pos', all);
}
/* 0–1. הקטע האחרון מתוך האחרון, ולכן סיום הוא 1 מלא. */
function LPosFrac(track, wk) {
  if (LDone(track, wk)) return 1;
  var p = LPos(track, wk);
  if (!p || !(p.n > 1)) return 0;
  return Math.max(0, Math.min(1, p.i / (p.n - 1)));
}

/* שליחה ללשונית "לימוד" — שורה עם קטע ומתוך. נשלחת ביציאה
   מהדף ולא בכל צעד: שורה לכל הקשה הייתה מציפה את הגיליון,
   ומה שהצוות צריך לראות הוא איפה הוא הפסיק. */
function LPosSend(track, wk) {
  var p = LPos(track, wk);
  if (!p || !(p.n > 1) || p.i <= 0) return;
  if (LDone(track, wk)) return;              /* סיים — נשלח כבר כסיום */
  var sent = LGet('pos-sent', {}) || {}, k = LKey(track, wk);
  if (sent[k] === p.i) return;               /* אותו מקום, כבר דווח */
  var me = LMe();
  if (!me || !me.id) return;
  sent[k] = p.i; LSet('pos-sent', sent);
  var q = LGet('learn-q', []) || [];
  q.push({ action:'row', tab:'לימוד', cols: JSON.stringify([
    ['מזהה', me.id], ['קוד ישיבה', me.inst || ''],
    ['מסלול', track], ['שבוע', wk + 1], ['דף', LDaf(track, wk) || ''],
    ['קטע', p.i + 1], ['מתוך', p.n]
  ]) });
  LSet('learn-q', q);
  LFlush();
}

function LUnmark(track, wk) {
  /* מסירים רק במכשיר. שורה שכבר נשלחה נשארת בגיליון, והמונה
     סופר מזהה ייחודי — כלומר ביטול אינו מוריד את המספר. זו
     החלטה: תלמיד שילחץ פעמיים לא יבלבל את הספירה, ותיקון של
     סימון בטעות הוא נדיר מספיק כדי לחיות איתו. */
  var all = LGet('learned', {});
  delete all[LKey(track, wk)];
  LSet('learned', all);
}

function LApi() {
  var cfg = LGet('cfg', {}) || {};
  return (cfg.api || (typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : '') || '').trim();
}
function LFlush() {
  var q = LGet('learn-q', []) || [];
  var url = LApi();
  if (!q.length || !url || !navigator.onLine) return;
  fetch(url, { method:'POST', mode:'no-cors',
               headers:{ 'Content-Type':'text/plain;charset=utf-8' },
               body: JSON.stringify(q[0]) })
    .then(function () {
      var rest = LGet('learn-q', []) || [];
      rest.shift(); LSet('learn-q', rest);
      LFlush();
    }).catch(function () {});
}
if (typeof window !== 'undefined') window.addEventListener('online', LFlush);

/* ---------- המונים הציבוריים ----------
   'מסלול|שבוע|קוד' → מספר. נקרא מהלשונית הציבורית, ולכן אין
   בו שום פרט אישי — רק כמה. */
function LCounts() { return LGet('learnCount', {}) || {}; }
function LCount(track, wk, code) {
  var c = LCounts();
  if (code) return c[track + '|' + (wk + 1) + '|' + code] || 0;
  /* בלי קוד — סך הכל ברשת, בסכימה על כל הישיבות. */
  var pre = track + '|' + (wk + 1) + '|', n = 0;
  for (var k in c) if (k.indexOf(pre) === 0) n += c[k];
  return n;
}
/* שורות הלשונית → מפה. נקרא על ידי כל מסך שטוען אותה. */
/* `null` = לא הצלחתי לקרוא. `{}` = קראתי, ואין אף אחד.
   שני מצבים שונים לגמרי: הראשון חייב להשאיר את המטמון, השני
   חייב לרוקן אותו. מיזוגם לתנאי אחד הוא מה ששמר מספרים של
   תלמידים שנמחקו. */
function LCountsFrom(rows) {
  if (!rows || !rows.length) return null;
  var head = rows[0], ix = {};
  for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
  if (ix['מסלול'] === undefined) return null;
  var m = {};
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var k = String(row[ix['מסלול']] || '').trim() + '|' +
            String(row[ix['שבוע']] || '').trim() + '|' +
            String(row[ix['קוד ישיבה']] || '').trim();
    var v = parseInt(row[ix['סיימו']], 10);
    if (v > 0) m[k] = v;
  }
  return m;
}
