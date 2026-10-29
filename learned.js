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
/* מכשיר בדיקה — סומן בעמוד /reset. ההרשמה והלימוד ממנו נושאים
   "בדיקה: כן", ואינם נספרים במונים ואינם בלוח של הצוות. ראו
   `noTestRows_` ב-apps-script.gs. */
function LTester() {
  /* "המסך שלי כתלמיד" (asStuOn, data.js) — תלמיד אמיתי בעולם האמיתי, גם במכשיר
     שמסומן כמכשיר בדיקה: הלימוד, ההרשמה וחבר מביא חבר — בלי "בדיקה: כן" (8.99.370). */
  if (typeof asStuOn === 'function' && asStuOn()) return false;
  try { return localStorage.getItem('df:tester') === '1'; } catch (e) { return false; }
}

/* ---------- השבוע ---------- */
/* "עכשיו" — עם דלת בדיקה בלבד. לפני `PROGRAM.startDate` (ראו
   data.js) `LWeek()` מחזיר -1 בכל מכשיר, וזה מכבה בשקט גם
   סימון-דף, גם "למדנו ביחד", וגם שמירת מיקום — כולן תלויות בו.
   מי שבודק את האפליקציה לפני תחילת התוכנית נתקל בזה כל פעם,
   וזה לא באג — זה בדיוק המצב שיהיה לתלמיד אמיתי גם כן, עד
   שהתוכנית תתחיל. `?asof=YYYY-MM-DD` מאפשר לדמות תאריך אחר —
   **רק במצב ניהול** (`df:admOk`), כדי שתלמיד לא יוכל "לדלג"
   שבועות דרך שורת הכתובת. נשמר במכשיר, אז מספיק להוסיף אותו
   פעם אחת; `?asof=` ריק מבטל את הדימוי וחוזר לתאריך האמיתי. */
function LNow_() {
  try {
    if (!isAdminView()) return new Date();
    var q = /[?&]asof=([^&]*)/.exec(location.search);
    if (q) {
      var v = decodeURIComponent(q[1]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) localStorage.setItem('df:asof', v);
      else localStorage.removeItem('df:asof');
    }
    var saved = localStorage.getItem('df:asof');
    return saved ? new Date(saved + 'T00:00:00') : new Date();
  } catch (e) { return new Date(); }
}
function LWeek() {
  var start = new Date(PROGRAM.startDate + 'T00:00:00');
  var now = LNow_(); now.setHours(0, 0, 0, 0);
  var days = Math.floor((now - start) / 86400000);
  if (days < 0) {
    /* פתיחה מוקדמת: לפני ההתחלה הרשמית, שבוע 1 כבר פעיל. */
    var early = PROGRAM.earlyFrom ? new Date(PROGRAM.earlyFrom + 'T00:00:00') : null;
    return (early && now >= early) ? 0 : -1;
  }
  return Math.min(Math.floor(days / 7), CAL_TAANIT.length - 1);
}
/* הדף של שבוע מסוים במסלול. null = שבוע חופשה.
   שם הדף בלבד — בלי העמוד. הוא המפתח לכל מה שנשמר לפי דף (הקישורים,
   הסימונים, תמונות הדף), ולכן ב. וב: מחזירים שניהם 'ב'. העמוד —
   ב-`LAm`, והשם להצגה — ב-`LDafName`. */
function LRow(track, wk) {
  /* גם מסלול השלמה (TrackById ב-data.js) — לו לוח משלו. */
  var t = TrackById(track);
  return t ? (t.cal[wk] || null) : null;
}
function LDaf(track, wk) {
  var row = LRow(track, wk);
  return row && row[2] && row[2] !== 'סיום' ? row[2] : null;
}
/* העמוד שנלמד בשבוע: 0 = הדף כולו, 1 = ע״א, 2 = ע״ב.
   האיבר הרביעי בשורת הלוח (ראו CAL_TAANIT). */
function LAmOf(row) {
  var a = row && row[3];
  return a === 'א' ? 1 : a === 'ב' ? 2 : 0;
}
function LAm(track, wk) { return LAmOf(LRow(track, wk)); }
/* ב. ב: — הכתיב המקובל לעמוד. דף שלם — בלי סימן. */
function LAmMark(am) { return am === 1 ? '.' : am === 2 ? ':' : ''; }
function LDafName(track, wk) {
  var d = LDaf(track, wk);
  return d ? d + LAmMark(LAm(track, wk)) : null;
}
/* הפרמטרים לכתובת הדף האינטראקטיבי — `daf=ב&amud=2`. בלי העמוד
   ב: היה נפתח כ-ב., כי שניהם אותו דף. */
function LDafQ(track, wk) {
  var d = LDaf(track, wk), am = LAm(track, wk);
  return d ? 'daf=' + encodeURIComponent(d) + (am ? '&amud=' + am : '') : '';
}
/* השבוע של דף ועמוד במסלול. עמוד 0, או דף שאינו מתחלק — השבוע
   הראשון של הדף. -1 = הדף אינו בלוח. */
function LWeekOf(track, daf, am) {
  var t = TrackById(track), k = String(daf || '').replace(/["'׳״\s]/g, ''), first = -1;
  if (!t || !k) return -1;
  for (var w = 0; w < t.cal.length; w++) {
    var row = t.cal[w];
    if (!row[2] || String(row[2]).replace(/["'׳״\s]/g, '') !== k) continue;
    if (first < 0) first = w;
    if (!am || LAmOf(row) === am) return w;
  }
  return first;
}

/* ---------- מסלול השלמה ----------
   המכשיר במסלול השלמה (TRACKS_HASHLAMA ב-data.js) כש-`df:hash` = 1:
   נרשם חדש מישיבה שבמסלול דרך הקישור שלה (join.html), או העברה
   ידנית מהניהול — השרת מחזיר `hs` עם הכרטיסים (?pts=me, ptsMe_).
   המסכת נשארת כפי שנבחרה; משתנה רק הלוח. */
function LHash() { return LGet('hash', 0) === 1; }
/* המסלול שהמכשיר לומד בו במסכת `mas`. */
function LTrackOf(mas) {
  var b = TrackBase(mas);
  return (LHash() && TrackHash(b)) || b;
}
/* הכתובת לדף האינטראקטיבי: `mas` — המסכת, ו-`tr` — המסלול כשהוא אחר. */
function LLearnQ(track) {
  var b = TrackBase(track);
  return 'mas=' + encodeURIComponent(b) + (b !== track ? '&tr=' + encodeURIComponent(track) : '');
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
/* `mins` — דקות הלימוד המצטברות במכשיר הזה לדף (tmMin_ ב-learn.html),
   לכרטיס הלימוד בהגרלה (rafTmAdd_ ב-apps-script.gs). בלי — לא נשלח. */
function LMark(track, wk, mins) {
  var all = LGet('learned', {});
  var k = LKey(track, wk);
  if (all[k]) return false;                 /* כבר סומן — לא שולחים שוב */
  all[k] = new Date().toISOString();
  LSet('learned', all);

  LDoneRow(track, wk, mins);
  return true;
}
/* שורת הסיום ללשונית "לימוד". שורת סיום נושאת קטע = מתוך — כך השרת
   מבדיל בינה לבין שורת התקדמות באמצע, בלי לנחש לפי מה שחסר. */
function LDoneRow(track, wk, mins) {
  var me = LMe();
  if (me && me.id) {
    var q = LGet('learn-q', []) || [];
    var pz = LPos(track, wk);
    q.push({ action:'row', tab:'לימוד', cols: JSON.stringify([
      ['מזהה', me.id], ['קוד ישיבה', me.inst || ''],
      ['מסלול', track], ['שבוע', wk + 1], ['דף', LDafName(track, wk) || ''],
      ['קטע', pz ? pz.n : ''], ['מתוך', pz ? pz.n : ''],
      ['בדיקה', LTester() ? 'כן' : ''],
      ['זמן בדף (דקות)', mins >= 0 ? mins : ''], ['מכשיר', mins >= 0 ? LDev() : '']
    ]) });
    LSet('learn-q', q);
    if (mins >= 0) { var ts = LGet('tm-sent', {}) || {}; ts[LKey(track, wk)] = mins; LSet('tm-sent', ts); }
    LFlush();
  }
}
/* מי שסומן כבר (למשל ב-80% של הדף, quietMark) והמשיך ללמוד — בסיום
   נשלחת שוב שורת הסיום עם הזמן המעודכן, כשגדל לפחות בדקה מאז הפעם
   הקודמת. השרת לוקח לכל מכשיר את הערך הגבוה, ולכן שורה נוספת אינה
   מזיקה; בלעדיה הזמן נעצר במקום שבו הסימון קרה. */
function LMarkTime(track, wk, mins) {
  if (!(mins >= 0) || !LDone(track, wk)) return;
  var ts = LGet('tm-sent', {}) || {}, was = ts[LKey(track, wk)];
  if (was >= 0 && mins < was + 1) return;
  LDoneRow(track, wk, mins);
}
/* מזהה המכשיר עצמו — לא מזהה האדם (`me.id` מתחלף במזהה הקבוע כשאותו
   אדם נרשם בכמה מכשירים, LAdopt). הזמן נצבר בכל מכשיר לחוד, ולכן השרת
   צריך לדעת מאיזה מכשיר הגיע כל ערך: הגבוה לכל מכשיר, וסכום ביניהם. */
function LDev() {
  var d = LGet('dev-id', '');
  if (!d) {
    d = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7).toUpperCase();
    LSet('dev-id', d);
  }
  return d;
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
/* `id` — המזהה הקבוע של הקטע (stepid.js), כשיש. בזכותו החזרה
   למקום שורדת פיצול או איחוד שקרו בינתיים. */
function LPosSet(track, wk, i, n, id) {
  if (!(n > 1)) return;
  var all = LGet('pos', {}) || {}, k = LKey(track, wk);
  var cur = all[k];
  /* אחורה לא נשמר. תלמיד שחוזר לעיין בקטע קודם אינו "מתקדם
     פחות", ולוח שקופץ אחורה בכל דפדוף אינו אומר דבר. */
  if (cur && cur.n === n && cur.i >= i) return;
  /* הדף שונה בינתיים (פיצול או איחוד קטעים) — משווים לפי החלק
     היחסי, ולא מאפסים. קודם כל שינוי באורך החזיר את ההתקדמות
     לנקודת היציאה, גם כשהיא מוקדמת מהרחוקה ביותר. */
  if (cur && cur.n > 1 && cur.n !== n && cur.i / (cur.n - 1) > i / (n - 1)) return;
  all[k] = { i:i, n:n, at:new Date().toISOString() };
  if (id) all[k].id = id;
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
   ומה שהצוות צריך לראות הוא איפה הוא הפסיק.
   **ובאמצע — בציוני דרך** (8.99.371, LPosMile): בכניסה לדף, ברבע, בחצי
   ובשלושה רבעים — לכל היותר ארבע שורות לדף. כך הצלחת בשולחן של חבר
   מביא חבר מתמלאת בזמן שהחבר לומד, ולא רק אחרי שיצא. */
function LPosMile(track, wk) {
  var p = LPos(track, wk);
  if (!p || !(p.n > 1) || LDone(track, wk)) return;
  var b = Math.min(3, Math.floor(4 * p.i / (p.n - 1)));
  var all = LGet('pos-mile', {}) || {}, k = LKey(track, wk);
  if (all[k] != null && all[k] >= b) return;
  all[k] = b; LSet('pos-mile', all);
  LPosSend(track, wk);
}
function LPosSend(track, wk) {
  var p = LPos(track, wk);
  /* גם בקטע הראשון (8.99.371): "התחיל" בשולחן של חבר מביא חבר מגיע מכאן. */
  if (!p || !(p.n > 1) || p.i < 0) return;
  if (LDone(track, wk)) return;              /* סיים — נשלח כבר כסיום */
  var sent = LGet('pos-sent', {}) || {}, k = LKey(track, wk);
  if (sent[k] === p.i) return;               /* אותו מקום, כבר דווח */
  var me = LMe();
  if (!me || !me.id) return;
  sent[k] = p.i; LSet('pos-sent', sent);
  var q = LGet('learn-q', []) || [];
  q.push({ action:'row', tab:'לימוד', cols: JSON.stringify([
    ['מזהה', me.id], ['קוד ישיבה', me.inst || ''],
    ['מסלול', track], ['שבוע', wk + 1], ['דף', LDafName(track, wk) || ''],
    ['קטע', p.i + 1], ['מתוך', p.n],
    ['בדיקה', LTester() ? 'כן' : '']
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

/* ============================================================
   חידון ששלח ועוד לא אומת — מכל דף ומהבית (8.99.357).
   ============================================================
   learn.html שומר כל שליחה בתור `df:qq:<דף>` ומוציא אותה רק כשהשרת מצא
   את השורה ב"חידות" (qzSync_). עד עכשיו התור חודש רק בדף הלימוד של אותו
   דף. כאן — כל התורים שבמכשיר, בכל פתיחה של הבית או של דף: **קודם בודקים**
   (?tkd, `nt` — בלי חישוב כרטיסים), ורק מה שלא נמצא נשלח ונבדק שוב. השרת
   אינו סופר את אותה שליחה פעמיים (quizBest_), ובכל זאת אין שליחה בלי בדיקה.
   `skip` — התור של הדף הפתוח, שמסך הסיום שלו מטפל בו בעצמו. תור שהתרוקן —
   `df:qsv:<דף>` = '1', כמו ב-qzSync_. */
var L_QZ_BUSY = false;
function LQzFlush(skip) {
  var url = LApi(), me = LMe();
  if (L_QZ_BUSY || !url || !me || !me.id) return;
  var keys = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('df:qq:') === 0 && k !== skip) keys.push(k);
    }
  } catch (e) { return; }
  if (!keys.length) return;
  L_QZ_BUSY = true;
  var read = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null') || []; } catch (e) { return []; } };
  var check = function (daf, it) {
    return LJsonp(url + (url.indexOf('?') < 0 ? '?' : '&') + 'tkd=1&nt=1&id=' + encodeURIComponent(me.id) +
                  '&daf=' + encodeURIComponent(daf) + '&n=' + it.n + (it.sc ? '&sc=' + encodeURIComponent(it.sc) : ''))
      .then(function (r) { return !!(r && r.status === 'ok' && r.saved); }, function () { return false; });
  };
  var p = Promise.resolve();
  keys.forEach(function (k) {
    var daf = k.slice('df:qq:'.length), got = {};
    p = p.then(function () {
      var v = Promise.resolve();
      read(k).forEach(function (it) {
        v = v.then(function () { return check(daf, it); }).then(function (ok) {
          if (ok) { got[it.n + '|' + it.sc] = 1; return; }
          return fetch(url, { method: 'POST', mode: 'no-cors', body: it.b })['catch'](function () {})
            .then(function () { return check(daf, it); })
            .then(function (ok2) { if (ok2) got[it.n + '|' + it.sc] = 1; });
        });
      });
      return v;
    }).then(function () {
      /* קריאה מחדש: שליחה חדשה שנכנסה בינתיים (לשונית אחרת) לא נמחקת. */
      var left = read(k).filter(function (it) { return !got[it.n + '|' + it.sc]; });
      try {
        if (left.length) localStorage.setItem(k, JSON.stringify(left));
        else {
          localStorage.removeItem(k);
          if (localStorage.getItem('df:qsent:' + daf)) localStorage.setItem('df:qsv:' + daf, '1');
        }
      } catch (e) {}
    });
  });
  p.then(function () { L_QZ_BUSY = false; }, function () { L_QZ_BUSY = false; });
}

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

/* ============================================================
   אותו אדם במכשיר נוסף.
   ============================================================
   המזהה נולד במכשיר, ולכן מי שנרשם גם מהטלפון וגם מהמחשב היה
   לשני אנשים. השרת מזהה עכשיו אדם לפי טלפון ושם (ראו
   `canonJoinCols_` ב-apps-script.gs), ובולע את השורה של המכשיר
   החדש בשורה הקיימת. כאן המכשיר שואל: "המזהה שלי נבלע?" — ואם
   כן, עובר למזהה הקבוע ומקבל את הדפים שכבר סימן במכשיר האחר.

   נשאל שוב פעם בשבוע גם אחרי אישור: הניקוי החד-פעמי בניהול
   (`mergePeople_`) יכול להפוך מזהה קבוע לנבלע. */
function LMergeLearned(list) {
  if (!list || !list.length) return;
  var all = LGet('learned', {}) || {}, now = new Date().toISOString();
  list.forEach(function (tag) { if (tag && !all[tag]) all[tag] = now; });
  LSet('learned', all);
}
function LAdopt(id, learned) {
  var me = LMe();
  if (!me || !id) return;
  var old = me.id;
  if (old && old !== id) {
    me.id = id;
    LSet('me', me);
    LSet('who-id', id);
    /* מה שעוד ממתין בתור נושא את המזהה הישן. בלי ההחלפה הבדיקה
       החוזרת (`?mark=` לפי המזהה הנוכחי) לא הייתה מוצאת אותו
       לעולם, והוא היה נשלח שוב ושוב. */
    ['learn-q', 'join-q'].forEach(function (k) {
      var q = LGet(k, []) || [];
      q.forEach(function (it) {
        if (!it || !it.cols) return;
        try {
          var c = JSON.parse(it.cols);
          c.forEach(function (p) { if (p && p[0] === 'מזהה' && p[1] === old) p[1] = id; });
          it.cols = JSON.stringify(c);
        } catch (e) {}
      });
      LSet(k, q);
    });
  }
  LMergeLearned(learned);
  LSet('id-ok', { id: id, at: Date.now() });
}
function LSyncId(force, after) {
  var me = LMe(), url = LApi();
  if (!me || !me.id || !url) return;
  var ok = LGet('id-ok', null);
  if (!force && ok && ok.id === me.id && Date.now() - (ok.at || 0) < 7 * 86400000) return;
  /* ההרשמה עוד לא הגיעה לגיליון — אין עדיין את מי לשאול. */
  if ((LGet('join-q', []) || []).length) return;
  LJsonp(url + '?idFor=' + encodeURIComponent(me.id)).then(function (r) {
    /* לא נמצא — אולי השורה עוד בדרך. שואלים בפתיחה הבאה. */
    if (!r || r.status !== 'ok' || !r.id) return;
    var was = me.id;
    LAdopt(r.id, r.learned);
    if (after && (was !== r.id || (r.learned && r.learned.length))) after();
  }).catch(function () {});
}
if (typeof window !== 'undefined') setTimeout(function () { LSyncId(); }, 2500);

/* ============================================================
   נרשמתי בעמדת הלימוד.
   ============================================================
   תלמיד שנרשם בעמדה בשיעור של הדף השבועי — למד את הדף, גם אם
   לא נגע באפליקציה. השרת משייך אותו לחשבון שלו (`amdaSync_`
   ב-apps-script.gs), וכאן המכשיר שואל מה נרשם לו ומסמן.

   לכל היותר פעם ברבע שעה: השאלה קלה (לשונית קטנה), אבל היא
   נשאלת מכל תלמיד בכל פתיחה. `after` — לצייר מחדש כשנוסף דף.
   ============================================================ */
function LAmdaSync(after) {
  var me = LMe(), url = LApi();
  if (!me || !me.id || !url) return;
  if (Date.now() - (LGet('amda-ask', 0) || 0) < 15 * 60000) return;
  LSet('amda-ask', Date.now());
  LJsonp(url + '?amdaFor=' + encodeURIComponent(me.id)).then(function (r) {
    if (!r || r.status !== 'ok' || !r.learned || !r.learned.length) return;
    var all = LGet('learned', {}) || {}, fresh = LAmdaWhole(r.learned).filter(function (t) { return t && !all[t]; });
    if (!fresh.length) return;
    LMergeLearned(fresh);
    if (after) after();
  }).catch(function () {});
}

/* נוכחות בשיעור על דף — הדף כולו נלמד (8.99.292), ולכן גם העמוד
   השני שלו בלוח: נרשם ב-ב: ← גם ב. מסומן. 'מסלול|שבוע' → כל השבועות
   של אותו דף באותו מסלול. */
function LAmdaWhole(tags) {
  var out = [];
  (tags || []).forEach(function (t) {
    if (!t) return;
    if (out.indexOf(t) < 0) out.push(t);
    var p = String(t).split('|'), tr = p[0], wk = parseInt(p[1], 10) - 1;
    var d = wk >= 0 ? LDaf(tr, wk) : null, row, w;
    if (!d) return;
    row = (TrackById(tr) || {}).cal;
    for (w = 0; row && w < row.length; w++) {
      if (row[w][2] === d && out.indexOf(LKey(tr, w)) < 0) out.push(LKey(tr, w));
    }
  });
  return out;
}

/* ============================================================
   תענית: דף ב התחלק לשני שבועות — העברה חד-פעמית במכשיר.
   ============================================================
   שבוע 1 הוא ב. ושבוע 2 הוא ב:, ולכן דפים ג–כ"ד זזו שבוע אחד
   קדימה (י זז שניים — חנוכה נשארה במקומה). כל מה שהמכשיר שמר
   לפי 'taanit|שבוע' עובר לשבוע החדש של **אותו דף**: "נלמד",
   המקום בדף, מה שכבר דווח, המונים שבמטמון, התורים שעוד לא
   נשלחו, והמצגות שבמטמון. הגיליון עובר בצד השרת — ראו
   `taanitShift_` ב-apps-script.gs.

   הדגל נשמר אחרי ההעברה, ולכן היא רצה פעם אחת בכל מכשיר. */
/* כל העברה: מסלול, דגל משלה, ומפה. מגילה (8.99.132) — אותו פיצול
   של דף ב, וכל השאר זז שבוע (י שניים — חנוכה), עד ל"ב שנכנס לשבוע
   הסיום. ראו CAL_MEGILA ו-`megilaShift_` ב-apps-script.gs. */
var L_SHIFTS = [
  { flag: 'shift-taanit-ab', tr: 'taanit',
    map: { 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:11, 11:12, 12:13, 13:14,
      14:15, 15:16, 16:17, 17:18, 18:19, 19:20, 20:21, 21:22, 22:23, 23:24, 24:25 } },
  { flag: 'shift-megila-ab', tr: 'megila',
    map: { 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:11, 11:12, 12:13, 13:14,
      14:15, 15:16, 16:17, 17:18, 18:19, 19:20, 20:21, 21:22, 22:23, 23:24, 24:25,
      25:26, 26:27, 27:31, 31:32, 32:33, 33:34, 34:35, 35:36 } }
];

function LShiftKey(k, sep, sh) {
  var p = String(k).split(sep);
  if (p[0] !== sh.tr) return k;
  var nw = sh.map[parseInt(p[1], 10)];
  if (!nw) return k;
  p[1] = String(nw);
  return p.join(sep);
}
function LShiftObj(o, sep, sh) {
  if (!o || typeof o !== 'object') return o;
  var out = {};
  for (var k in o) if (o.hasOwnProperty(k)) out[LShiftKey(k, sep, sh)] = o[k];
  return out;
}
/* שורה בתור: [['מסלול','taanit'],['שבוע',N],…] בתוך cols. */
function LShiftQ(q, sh) {
  (q || []).forEach(function (it) {
    if (!it || !it.cols) return;
    try {
      var c = JSON.parse(it.cols), tr = '';
      c.forEach(function (p) { if (p && p[0] === 'מסלול') tr = p[1]; });
      if (tr !== sh.tr) return;
      c.forEach(function (p) {
        if (p && p[0] === 'שבוע' && sh.map[parseInt(p[1], 10)]) p[1] = sh.map[parseInt(p[1], 10)];
      });
      it.cols = JSON.stringify(c);
    } catch (e) {}
  });
  return q;
}
function LShiftOne(sh) {
  try {
    if (LGet(sh.flag, null)) return;
    /* מכשיר שעוד לא שמר כלום — אין מה להעביר. */
    ['learned', 'pos', 'pos-sent', 'pairs'].forEach(function (k) {
      var v = LGet(k, null);
      if (v) LSet(k, LShiftObj(v, '|', sh));
    });
    var lc = LGet('learnCount', null);
    if (lc) LSet('learnCount', LShiftObj(lc, '|', sh));
    ['learn-q', 'pair-q'].forEach(function (k) {
      var q = LGet(k, null);
      if (q && q.length) LSet(k, LShiftQ(q, sh));
    });
    var dk = LGet('deckCache', null);
    if (dk) {
      LSet('deckCache', LShiftObj(dk, '-', sh));
      /* deck.js כבר קרא את המטמון לזיכרון, בחלק מהעמודים לפנינו. */
      if (typeof DECKS !== 'undefined' && DECKS) DECKS = LGet('deckCache', null);
    }
    LSet(sh.flag, new Date().toISOString());
  } catch (e) {}
}
function LShift() { L_SHIFTS.forEach(LShiftOne); }
LShift();
