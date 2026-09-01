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
/* ============================================================
   שליחה שמאמתת שהגיעה.
   ============================================================
   `no-cors` מחזיר תשובה אטומה: ה-fetch "מצליח" גם כשהשרת דחה
   את הכתיבה, גם כשהנעילה בשרת פגה, וגם כשהכתובת שגויה. עד
   עכשיו השורה נמחקה מהתור מיד אחרי השליחה — ולכן סימון של
   תלמיד שלא נכתב פשוט נעלם, ואיש לא ידע.

   עכשיו שולחים, ואז **שואלים את השרת אם השורה שם**. השאלה
   נשאלת ב-JSONP, כי היא הערוץ היחיד שמחזיר תשובה שאפשר לקרוא;
   היא מחזירה מספר אחד ולא רשימה, ואין בה שום פרט אישי.

   לא אושר — השורה נשארת בתור ותישלח שוב בפעם הבאה שהאפליקציה
   נפתחת. **הסימון עצמו כבר שמור במכשיר**, ולכן התלמיד רואה ✓
   בכל מקרה; מה שמתעכב הוא רק המספר אצל הרכז.
   ============================================================ */
var L_TRIES = 0;                 /* בטעינה הזו בלבד */

function LJsonp(url) {
  return new Promise(function (ok, no) {
    var name = 'lcb' + Date.now() + Math.floor(Math.random() * 1e6);
    var sc = document.createElement('script');
    var done = function (v) {
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      if (sc.parentNode) sc.parentNode.removeChild(sc);
      clearTimeout(t);
      v === undefined ? no(new Error('אין תשובה')) : ok(v);
    };
    var t = setTimeout(function () { done(undefined); }, 12000);
    window[name] = function (v) { done(v); };
    sc.onerror = function () { done(undefined); };
    sc.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'callback=' + name;
    document.head.appendChild(sc);
  });
}

/* האם מה שנשלח נמצא בגיליון. `item` הוא מה שיושב בתור. */
function LArrived(item) {
  var url = LApi(), me = LMe();
  if (!url || !me || !me.id) return Promise.resolve(false);
  var c = {};
  (JSON.parse(item.cols || '[]') || []).forEach(function (p) { c[p[0]] = p[1]; });
  if (!c['מסלול'] || !c['שבוע']) return Promise.resolve(false);
  var tag = c['מסלול'] + '|' + c['שבוע'];
  var at  = parseInt(c['קטע'], 10), of = parseInt(c['מתוך'], 10);
  var isDone = !c['קטע'] || !(of > 0) || at >= of;

  return LJsonp(url + '?mark=' + encodeURIComponent(me.id) +
                      '&wk=' + encodeURIComponent(tag))
    .then(function (r) {
      if (!r || r.status !== 'ok') return false;
      /* שורת סיום — צריך שהשרת יאשר סיום. שורת התקדמות — מספיק
         שהוא הגיע לפחות עד לאן שדיווחנו. */
      return isDone ? !!r.done : (r.done || r.at >= at);
    })
    .catch(function () { return false; });
}

function LFlush() {
  var q = LGet('learn-q', []) || [];
  var url = LApi();
  if (!q.length || !url || !navigator.onLine) return;
  /* התקרה סופרת **כישלונות** ולא שליחות. תלמיד שהיה בלי רשת
     שבוע שלם עשוי להחזיק כמה שורות בתור, וכולן צריכות לצאת;
     מה שאסור הוא לנסות שוב ושוב את אותה שורה שאינה עוברת. */
  if (L_TRIES >= 3) return;

  var item = q[0];
  fetch(url, { method:'POST', mode:'no-cors',
               headers:{ 'Content-Type':'text/plain;charset=utf-8' },
               body: JSON.stringify(item) })
    .then(function () {
      /* רגע לפני הבדיקה — הכתיבה בשרת עוברת דרך נעילה. */
      return new Promise(function (ok) { setTimeout(ok, 1500); });
    })
    .then(function () { return LArrived(item); })
    .then(function (ok) {
      if (!ok) { L_TRIES++; return; }         /* נשאר בתור */
      var rest = LGet('learn-q', []) || [];
      rest.shift(); LSet('learn-q', rest);
      LFlush();
    })
    .catch(function () {});
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
