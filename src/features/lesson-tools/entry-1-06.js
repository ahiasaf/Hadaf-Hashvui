
function drawer(on) {
  document.body.classList.toggle('chav-on', on);
  $('chtog').classList.toggle('on', on);
  if (!quiet()) try { localStorage.setItem('df:chav', on ? '1' : '0'); } catch (e) {}
  recStep('chav');
  /* הקובץ נטען רק אם יש קטע שנשמר לפני שהמבנה נשמר יחד איתו */
  if (on) { if (needChav()) loadChav(); paintChavArea(); }
  /* המגירה משנה את גודל הבמה, ולכן החלון מחושב מחדש */
  setTimeout(focus, 30);
}

/* ============================================================
   האזור הצדדי, והמצגת שבתוכו.
   ============================================================
   **מה נשמר בגיליון ומה נגזר.** המצגת עצמה כבר קיימת - היא
   תמונות ממוספרות ב-`CONTENT[<מסלול>-<שבוע>].deck`, ואותו שבוע
   הוא גם הדף שעל המסך. לכן אין מה לשמור עליה דבר. מה שנשמר הוא
   רק **מתי מתחלף השקף**.

   **והשיוך הוא דליל.** לא רשומה לכל קטע אלא נקודות מעבר בלבד:
   "משקף 3 ואילך". שקף מחזיק מהעוגן שלו ועד לעוגן הבא, וברירת
   המחדל היא שקף 1 מתחילת הדף. דף עם עשרה שקפים דורש תשע לחיצות,
   לא ארבעים.

   **העוגן הוא מספר הקטע ולא מקומו ברשימה.** `FLAT` נבנה מחדש
   בכל טעינה, ומספר סידורי ברשימה משתנה בכל שינוי סימון בסטודיו -
   שיוך שנעשה פעם היה נשבר בשקט. `n` הוא מספר הקטע שהאדם ראה
   כשסימן, וזו היחידה שבה הוא חשב.

   **הלשונית `מצגת`:** מסכת | דף | עוגנים, כשהעוגנים הם JSON
   `{"5":2,"11":3}`. הכתיבה היא `action:'table'` הקיים - הלקוח
   מחזיק את המפה השלמה וכותב אותה מחדש - ולכן אין כאן שום שינוי
   ב-apps-script.gs ושום פעולה ידנית.
   ============================================================ */
var DECK_TAB = 'מצגת';
var DECK = null;     /* {dir, n} מתוך CONTENT */
var DMAP = {};       /* כל הלשונית: 'מסכת|דף' -> עוגנים */
var ANCH = null;     /* העוגנים של הדף שעל המסך, או null אם אין */
var SLIDE = 1;
var SIDE_ADM = false;

function dmKey(mas, daf) { return mas + '|' + dafKey(daf); }

/* המצגת של הדף שעל המסך. השבוע הוא המפתח, כי הלוח הוא שקובע
   איזה דף שייך לאיזה שבוע - ואין צורך בטבלה נוספת.
   הרשימה עצמה מגיעה מ-deck.js: הקבצים בריפו, הסדר בגיליון. */
function deckOf() {
  if (S.week < 0) return null;
  return DeckOf(S.mas, S.week + 1);
}
function slideSrc(n) {
  return DeckSrc(DECK, n);
}
/* כמה שקפים יש. היה `DECK.n`, ועכשיו זה אורך הרשימה. */
function deckN() {
  return DECK ? DECK.files.length : 0;
}
/* הערך הגולמי של שקף לפי מיקום - בדיוק מה ששמור ב-`DECK.files`,
   כלומר שם קובץ בתוך `dir`, או נתיב מלא אם יש בו `/`. זה מה
   שנשמר בעוגן מעכשיו (ראו `anchPos_` למטה), ולא המיקום עצמו. */
function deckFileAt(n) {
  return (DECK && DECK.files[n - 1]) || '';
}
/* הכיוון ההפוך: איפה קובץ נתון יושב היום ברשימה, או 0 אם אינו
   בה בכלל - למשל שקף שהועלה רק בשביל חלק-פירוש קולי, ולא נכנס
   מעולם לרצף הרגיל. */
function deckPosOfFile(f) {
  if (!DECK || !f) return 0;
  for (var i = 0; i < DECK.files.length; i++) if (DECK.files[i] === f) return i + 1;
  return 0;
}

/* ---------- השקפים מובאים ברקע ----------
   שקף הוא כ-110KB, וברשת של טלפון זה נראה: לוחצים "מצגת"
   ורואים תיבה ריקה. לכן מה שיוצג עוד מעט מובא **לפני** שמבקשים
   אותו - בשקט, בזמן שאיש אינו ממתין.

   **אחד קדימה ולא הכול.** מצגת שלמה היא מעל מגה־בייט, וזו חבילת
   הגלישה של תלמיד שאולי לא יפתח מצגת בכלל. השקף של הקטע שעל
   המסך והבא אחריו מכסים כל לחיצה מציאותית ועולים עשירית מזה.
   מי שילמד את הדף כולו יביא בסוף את כולם - אחד בכל פעם, בדיוק
   כשהוא נעשה רלוונטי, ולא בפרץ אחד בכניסה.

   הדפדפן הוא שמחזיק את התמונות; המפה כאן רק זוכרת מי כבר הגיע,
   כדי שנדע אם להחליף מיד או להמתין. */
var PRE = {};
/* ============================================================
   שקף חדש שנכשל פעם אחת - לא נכשל לנצח.
   ============================================================
   "העליתי שקף 15 בניהול, ובדף האינטראקטיבי לא רואים אותו - מופיע
   במקומו 14." הרשימה בגיליון מתעדכנת מיד, אבל הקובץ עצמו עולה
   לאתר רק אחרי שהפריסה נגמרת. מי שפתח את הדף באמצע קיבל שגיאה -
   והשגיאה נזכרה: אותו אובייקט תמונה נשאר "נכשל", והמסך המשיך
   להראות את השקף הקודם בלי לנסות שוב. וייתכן שגם הדפדפן זכר את
   השגיאה עצמה.

   עכשיו: כישלון מוחק את הזיכרון, וכל ניסיון חוזר מגיע עם סימן
   ייחודי בכתובת (`?r=`), כדי לעקוף גם שגיאה שנשמרה בדפדפן. */
var PRE_BAD = {};
function slidePre(n) {
  if (!DECK || !(n >= 1) || n > deckN()) return null;
  var src = slideSrc(n);
  if (!PRE[src]) {
    var im = new Image();
    im.onerror = function () { PRE_BAD[src] = (PRE_BAD[src] || 0) + 1; };
    im.src = PRE_BAD[src] ? src + '?r=' + Date.now() : src;
    PRE[src] = im;
  }
  return PRE[src];
}
function slideReady(n) {
  if (!DECK || !(n >= 1) || n > deckN()) return false;
  var im = PRE[slideSrc(n)];
  return !!(im && im.complete && im.naturalWidth);
}

/* הלשונית כולה. `null` = הקריאה נכשלה או שחזרה לשונית אחרת;
   `{}` = אין עדיין שום שיוך, וזה מצב חוקי. */
function dmapFromRows(rows) {
  if (!rows || !rows.length) return null;
  if (rows[0].join('|').indexOf('מסכת') < 0) return null;
  var out = {};
  rows.slice(1).forEach(function (r) {
    var mas = (r[0] || '').trim(), daf = (r[1] || '').trim(), raw = (r[2] || '').trim();
    if (!mas || !daf || !raw) return;
    /* פענוח שנכשל אינו "אין שיוך" - הוא באג, ולכן הוא מסומן
       ולא נבלע בשקט. */
    try { out[dmKey(mas, daf)] = JSON.parse(raw); }
    catch (e) { out[dmKey(mas, daf)] = { __bad: raw }; }
  });
  return out;
}
function loadDeckMap() {
  return sheetCsv(DECK_TAB).then(function (rows) {
    var m = dmapFromRows(rows);
    if (!m) return false;
    DMAP = m;
    return true;
  }).catch(function () { return false; });
}

/* ערך עוגן -> מיקום ברשימה. מספר הוא שיוך ישן (נשמר כשהעוגן היה
   "שקף מספר X" עצמו) - הוא תקף כמות שהוא. מחרוזת היא שיוך חדש
   (שם קובץ) - מחפשים אותה ב-`DECK.files` היום, וזה בדיוק מה
   שעושה שיוך כזה חסין מפני שקף שנדחף באמצע: השם לא זז, גם אם
   המיקום שלו כן. `0` = לא נמצא - מתעלמים מהעוגן הזה ולא קורסים
   (קובץ שנמחק, או שיוך שהתייחס למצגת אחרת). */
function anchPos_(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return deckPosOfFile(v);
  return 0;
}
/* השקף של קטע מסוים: העוגן הגדול ביותר שאינו עולה על מספר
   הקטע. אין עוגן קודם - שקף 1. */
function slideAt(idx) {
  var st = FLAT[idx];
  if (!st || !ANCH) return 1;
  if (sidMode_(ANCH)) return slideAtIds_(st);
  var best = 1, bestAt = 0, k;
  for (k in ANCH) {
    if (!ANCH.hasOwnProperty(k)) continue;
    var at = parseInt(k, 10);
    if (!(at >= 0) || at > st.n || at < bestAt) continue;
    var pos = anchPos_(ANCH[k]);
    if (!pos) continue;
    bestAt = at; best = pos;
  }
  return Math.max(1, Math.min(deckN() || 1, best));
}

/* אותו דבר בדף שהוסב: העוגנים לפי מזהה, ולכן הולכים על הקטעים
   לפי הסדר. עוגן של קטע שאוחד (`also`) **עובר לקטע הבא** - כך
   השקפים של כל שאר הקטעים נשארים בדיוק כפי שהיו. אם לקטע הבא יש
   עוגן משלו, שלו גובר (בזה הוזהר מי שאיחד). */
function slideAtIds_(st) {
  var best = 1, carry = 0;
  for (var i = 0; i < FLAT.length && FLAT[i].n <= st.n; i++) {
    var v = FLAT[i];
    if (v.part !== 1) continue;
    var own = v.id ? anchPos_(ANCH[v.id]) : 0;
    if (own) best = own; else if (carry) best = carry;
    carry = 0;
    (v.also || []).forEach(function (a) { var p = anchPos_(ANCH[a]); if (p) carry = p; });
  }
  return Math.max(1, Math.min(deckN() || 1, best));
}

/* ---------- פתיחה, סגירה, מצבי הטלפון ---------- */
/* `auto` = נפתחה מאליה בכניסה, ולא מלחיצה של אדם. פתיחה כזו
   אינה נשמרת כהעדפה: אחרת חלון צר באותו מחשב היה נפתח אחר כך
   עם מצגת שאיש לא ביקש. */
/* ============================================================
   איור חדש - מסגרת צהובה על "איור".
   ============================================================
   כשהקטע שעל המסך מביא שקף שהלומד עוד לא ראה, והמצגת סגורה -
   הכפתור מקבל מסגרת. פתיחה (או מצגת שכבר פתוחה) מסמנת את השקף
   כנצפה, והמסגרת יורדת. מה שנצפה נשמר במכשיר לפי דף, כדי שחזרה
   לדף לא תדליק שוב את מה שכבר ראו. */
function dkSeenKey() { return 'df:dkSeen:' + S.mas + '|' + S.daf; }
function dkSeen() {
  try { return JSON.parse(localStorage.getItem(dkSeenKey()) || '{}') || {}; } catch (e) { return {}; }
}
function dkSeenAdd(n) {
  if (!n) return;
  var m = dkSeen();
  if (m[n]) return;
  m[n] = 1;
  try { localStorage.setItem(dkSeenKey(), JSON.stringify(m)); } catch (e) {}
}
function dkFresh() {
  var b = $('dktog');
  if (!b || !DECK || b.style.display === 'none') return;
  var n = 0;
  try { n = slideAt(IDX); } catch (e) { return; }
  if (document.body.classList.contains('side-on')) dkSeenAdd(n);
  b.classList.toggle('fresh', !document.body.classList.contains('side-on') && !dkSeen()[n]);
}
function sideOpen(on, auto) {
  document.body.classList.toggle('side-on', !!on);
  var b = $('dktog');
  if (b) b.classList.toggle('on', !!on);
  if (on && DECK) dkSeenAdd(slideAt(IDX));
  dkFresh();
  if (!quiet() && !auto) try {
    localStorage.setItem('df:side', on ? '1' : '0');
  } catch (e) {}
  recStep('deck');
  if (!on) sideVoxStop_();
  if (on) sideSync(true);
  /* הבמה שינתה רוחב רק אם היא לא הייתה נעולה על --col. בכל
     מקרה ציור מחדש כאן זול, ומונע מצב שבו המסגרת נשארת על
     המקום הישן. */
  if (FLAT.length) { paint(); focus(); }
}
function sidePhone() {
  return !window.matchMedia || window.matchMedia('(max-width:1199px)').matches;
}
/* ---------- ציור ---------- */
function sideSync(force) {
  if (!DECK) return;
  var st = FLAT[IDX];
  /* עברנו קטע - הקלטה של חלק-פירוש קולי ששייכת לקטע הקודם
     מפסיקה, כמו שהשקף הרגיל מפסיק להיות רלוונטי. */
  if (VOICE_PLAY && st && VOICE_PLAY.n !== st.n) sideVoxStop_();
  /* גם כשהמצגת סגורה. השקף של הקטע שעל המסך מובא ברקע, כדי
     שלחיצה על "מצגת" תראה שקף ולא תיבה ריקה - וזה נכון בדיוק
     במקרה שבו הלומד דפדף הרבה לפני שפתח אותה. */
  slidePre(slideAt(IDX));
  dkFresh();
  if (!document.body.classList.contains('side-on')) return;
  var want = slideAt(IDX);
  sideVoxPaint();
  if (want === SLIDE && !force) { sideAdmPaint(); return; }
  SLIDE = want;
  sidePaint();
}
/* המסגרת נבנית **פעם אחת**, ואחריה רק מתעדכנת.
   `null` = עוד לא נבנתה · true/false = נבנתה למצב טלפון או מחשב,
   ומעבר בין השניים (סיבוב, שינוי גודל חלון) בונה מחדש.

   קודם היא נבנתה מחדש בכל החלפת שקף, וזה מה שיצר את הריק: תיבת
   התמונה נהרסה ונולדה ריקה, ורק אז התחילה להביא. */
var SIDE_FR = null;
function sidePaint() {
  var el = $('side');
  if (!el || !DECK) return;
  var phone = sidePhone();
  if (SIDE_FR !== phone || !$('sd-img')) {
    el.innerHTML =
      '<div class="sd-h">' +
      /* מספר השקף מוצג רק למי שמשייך - הוא הכלי שלו. לתלמיד הוא
         מבטיח שליטה שאינה קיימת: המצגת נוסעת עם הדף. */
      (SIDE_ADM ? '<span class="sd-n" id="sd-cnt"></span>' : '') +
      '<span class="sp"></span>' +
      (phone ? '<button id="sd-x" title="סגירה">✕</button>' : '') +
      '</div>' +
      '<div class="sd-b"><img id="sd-img" alt=""></div>' +
      '<div class="sd-f">' +
      '<button id="sd-prev">▸ שקף קודם</button><span class="sp"></span>' +
      '<span class="sd-n" id="sd-lbl"></span><span class="sp"></span>' +
      '<button id="sd-next">שקף הבא ◂</button></div>' +
      '<div class="sd-vox" id="sd-vox"></div>' +
      (SIDE_ADM ? sideAdmHtml() : '');
    if ($('sd-x')) $('sd-x').onclick = function () { sideOpen(false); };
    /* דפדוף ידני. הוא אינו משנה את השיוך - הוא רק מסתכל, ובקטע
       הבא המצגת חוזרת למה שהשיוך אומר. */
    $('sd-prev').onclick = function () { sideStep(-1); };
    $('sd-next').onclick = function () { sideStep(1); };
    SIDE_FR = phone;
  }
  var cnt = $('sd-cnt');
  if (cnt) cnt.textContent = 'שקף ' + SLIDE + ' מתוך ' + deckN();
  sideImg(SLIDE);
  $('sd-prev').disabled = SLIDE <= 1;
  $('sd-next').disabled = SLIDE >= deckN();
  var lbl = $('sd-lbl');
  if (lbl) lbl.textContent = (SIDE_ADM && !ANCH) ? 'אין עדיין שיוך' : '';
  sideVoxPaint();
  sideAdmPaint();
}

/* השקף שעל המסך נשאר עד שהבא **מוכן**, ואז הם מתחלפים - אף פעם
   לא רואים תיבה ריקה באמצע. ראו `.sd-b.wait`. */
function sideImg(n) {
  var img = $('sd-img');
  if (!img) return;
  var src = slideSrc(n);
  var cls = function (c) {
    var e = $('sd-img');
    if (e && e.parentNode) e.parentNode.className = c;
  };
  if (img.getAttribute('src') === src) { cls('sd-b'); return; }
  var im = slidePre(n);
  slidePre(n + 1);                 /* הבא בתור, בשקט */
  var show = function () {
    /* בינתיים הוחלף השקף - מה שהגיע כבר אינו מה שמבקשים */
    var e = $('sd-img');
    if (SLIDE !== n || !e) return;
    e.src = (PRE[src] && PRE[src].src) || src;
    e.alt = 'שקף ' + n;
    cls('sd-b');
  };
  if (slideReady(n)) { show(); return; }
  /* כבר נכשל קודם: `complete` דלוק ואין רוחב. אין למה להמתין,
     ושום אירוע לא יגיע יותר - בלי זה הסימן היה מסתובב לנצח. */
  var retry = function () {
    /* נכשל - שוכחים אותו ומנסים שוב בעוד כמה שניות, עד חמש פעמים
       (הפריסה של שקף חדש לוקחת דקה-שתיים). */
    delete PRE[src];
    PRE_BAD[src] = (PRE_BAD[src] || 0) + 1;
    if (PRE_BAD[src] > 5) { cls('sd-b'); return; }
    setTimeout(function () { if (SLIDE === n) sideImg(n); }, 4000);
  };
  if (!im || (im.complete && !im.naturalWidth)) { cls('sd-b wait'); retry(); return; }
  cls('sd-b wait');
  im.onload  = show;
  im.onerror = retry;
}
function sideStep(d) {
  var n = SLIDE + d;
  if (n < 1 || n > deckN()) return;
  SLIDE = n;
  sidePaint();
}

/* ============================================================
   הפירוש הקולי - כפתורי השמעה בפאנל המצגת, לכולם (לא רק ניהול).

   מוצג רק חלק שכבר הועלה (`piece.audio` קיים) ורק כשהדף מפורסם -
   בדיוק אותו שער שכבר קובע מה נראה בלשונית הכתובה. לחיצה מנגנת,
   ואם לחלק יש שקף משלו (`piece.slide`) היא גם מציגה אותו במקום
   שקף הקטע הרגיל - זמנית, עד עצירה או מעבר קטע. השקף הרגיל של
   המצגת (השיוך הראשי) אינו נוגע בזה כלל: זו שכבה נפרדת לגמרי. */
var VOICE_PLAY = null;    /* {n, i} של החלק שמתנגן עכשיו, או null */
var VOICE_AU = null;
function sideVoxPaint() {
  var box = $('sd-vox');
  if (!box) return;
  var st = FLAT[IDX];
  var pieces = (st && OWN && OWN.__pub) ? ownPieces_(st.n).filter(function (p) { return p.audio; }) : [];
  if (!pieces.length) { box.innerHTML = ''; return; }
  box.innerHTML = pieces.map(function (p, i) {
    var playing = !!(VOICE_PLAY && VOICE_PLAY.n === st.n && VOICE_PLAY.i === i);
    return '<button class="sd-vp' + (playing ? ' on' : '') + '" onclick="sideVoxToggle(' + i + ')">' +
      (playing ? '⏸ ' : '▶ ') + esc(p.tag || 'פירוש') + ' (קול)</button>';
  }).join('');
}
function sideVoxToggle(i) {
  var st = FLAT[IDX];
  if (!st) return;
  if (VOICE_PLAY && VOICE_PLAY.n === st.n && VOICE_PLAY.i === i) { sideVoxStop_(); return; }
  var p = ownPieces_(st.n).filter(function (q) { return q.audio; })[i];
  if (!p) return;
  sideVoxStop_();
  if (!VOICE_AU) { VOICE_AU = new Audio(); VOICE_AU.addEventListener('ended', sideVoxStop_); }
  VOICE_AU.src = p.audio;
  VOICE_AU.play()['catch'](function () {});
  VOICE_PLAY = { n:st.n, i:i };
  if (p.slide) sideVoxShowSlide_(p.slide);
  sideVoxPaint();
}
function sideVoxStop_() {
  if (VOICE_AU) { try { VOICE_AU.pause(); } catch (e) {} }
  var had = VOICE_PLAY;
  VOICE_PLAY = null;
  if (had) { sideImg(SLIDE); sideVoxPaint(); }
}
function sideVoxShowSlide_(file) {
  var img = $('sd-img');
  if (!img) return;
  var src = file.indexOf('/') >= 0 ? file : ((DECK && DECK.dir ? DECK.dir + '/' : '') + file);
  img.src = src;
  img.alt = 'שקף פירוש קולי';
}

/* ============================================================
   שכבת השיוך - רק כשהניהול פתוח במכשיר.

   שתי פעולות בלבד, ושתיהן על הקטע שעל המסך עכשיו: "השקף הזה
   מתחיל כאן", ו"ביטול". זה כל מה שצריך כדי לבנות דף שלם -
   מדפדפים בדף, וכשמגיעים לקטע שבו השקף אמור להתחלף, לוחצים.
   ============================================================ */
function sideAdmHtml() {
  return '<div class="sd-a" id="sd-a"></div>';
}
function sideAdmPaint() {
  var box = $('sd-a');
  if (!box) return;
  var st = FLAT[IDX], n = st ? st.n : 0;

  /* מעבר קטע באמצע הקלטה - עוצרים ושומרים מה שכבר הוקלט, במקום
     להשאיר מיקרופון פתוח על קטע שכבר לא על המסך. ההקלטה עצמה
     יושבת עכשיו בעורך הפירוש (`paintOwn`), לא כאן. */
  if (VOX_RECORDER && VOX_FOR && VOX_FOR.n !== n) ownAudioStop();

  var here = !!ANCH && ANCH[sidKeys_(ANCH, n)[0]] !== undefined;
  var count = 0, k;
  for (k in (ANCH || {})) if (ANCH.hasOwnProperty(k) && k.indexOf('__') !== 0) count++;

  box.innerHTML =
    '<div class="t">קטע ' + n + ' · ' + count +
    (count === 1 ? ' עוגן בדף' : ' עוגנים בדף') + '</div>' +
    '<div class="r">' +
    '<button id="sa-set" class="' + (here ? 'hot' : '') + '">' +
    'שקף ' + SLIDE + ' מתחיל כאן</button>' +
    (here ? '<button id="sa-del">ביטול העוגן</button>' : '') +
    '<button id="sa-save">שמירה לכולם</button>' +
    '<button id="sa-dk">' + esc(UI.sdDecks || '') + ' ↗</button>' +
    '</div><div class="msg" id="sa-msg"></div>';

  $('sa-set').onclick = function () {
    if (!ANCH) ANCH = {};
    /* שם קובץ ולא מיקום - כדי ששיוך שנעשה היום לא יישבר אם מחר
       נדחף שקף באמצע הרשימה. ראו `anchPos_`. */
    sidPut_(ANCH, n, deckFileAt(SLIDE), false);
    sideMsg('', '');
    sidePaint();
  };
  if ($('sa-del')) $('sa-del').onclick = function () {
    sidPut_(ANCH, n, undefined, false);
    sideMsg('', '');
    sideSync(true);
    sidePaint();
  };
  $('sa-save').onclick = sideSave;
  /* אל עורך המצגות בניהול, על אותו שבוע. הניהול קורא את הבקשה
     פעם אחת (`admTakeGo` ב-index.html) ומוחק אותה. */
  $('sa-dk').onclick = function () {
    try {
      localStorage.setItem('df:admGo', JSON.stringify(
        { sub:'daf', mas:S.mas, wk:(S.week >= 0 ? S.week + 1 : 0) }));
    } catch (e) {}
    location.href = '/#admin';
  };
}

/* ============================================================
   הקלטת הקול - חלק ממאגר החלקים (ראו `paintOwn` למעלה), לא
   מסך נפרד. כל חלק־פירוש (n + `_id` מקומי) מחזיק לכל היותר
   הקלטה אחת: הקלטה מחדש מחליפה את הקודמת, בדיוק כמו טקסט.

   מה שנשמר איפה: הבלוב עצמו יושב ב-IndexedDB במכשיר הזה בלבד
   עד שנלחץ "שמירה" - או אז הוא מועלה לגיטהאב (`ownUploadNext_`)
   וה-URL שלו נכתב לגיליון עם שאר החלק. קליפ מקומי שעדיין לא
   הועלה מזוהה בכך של-`piece.audio` אין ערך. */
var VOX_CACHE = {};