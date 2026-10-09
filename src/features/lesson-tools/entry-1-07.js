        /* 'n::pid' -> {buf,mime} | null, שכבר נטען */
var VOX_STREAM = null, VOX_RECORDER = null, VOX_CHUNKS = [], VOX_FOR = null, VOX_MSG = '', VOX_DB = null;

function voxDbOpen() {
  if (VOX_DB) return Promise.resolve(VOX_DB);
  if (!window.indexedDB) return Promise.reject(new Error('no idb'));
  return new Promise(function (ok, fail) {
    var req = indexedDB.open('df-voice', 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains('segs')) req.result.createObjectStore('segs');
    };
    req.onsuccess = function () { VOX_DB = req.result; ok(VOX_DB); };
    req.onerror = function () { fail(req.error); };
  });
}
function voxKey_(n, pid) { return S.mas + '|' + dafKey(S.daf) + '|' + n + '|' + pid; }
function voxLoad(n, pid) {
  var key = n + '::' + pid;
  if (VOX_CACHE.hasOwnProperty(key)) return Promise.resolve(VOX_CACHE[key]);
  return voxDbOpen().then(function (db) {
    return new Promise(function (ok) {
      var rq = db.transaction('segs', 'readonly').objectStore('segs').get(voxKey_(n, pid));
      rq.onsuccess = function () { VOX_CACHE[key] = rq.result || null; ok(VOX_CACHE[key]); };
      rq.onerror   = function () { VOX_CACHE[key] = null; ok(null); };
    });
  }).catch(function () { VOX_CACHE[key] = null; return null; });
}
function voxSaveLocal_(n, pid, clip) {
  VOX_CACHE[n + '::' + pid] = clip;
  voxDbOpen().then(function (db) {
    var store = db.transaction('segs', 'readwrite').objectStore('segs');
    if (clip) store.put(clip, voxKey_(n, pid)); else store['delete'](voxKey_(n, pid));
  }).catch(function () {});
}
function voxClipUrl_(c) {
  if (!c._url) {
    try { c._url = URL.createObjectURL(new Blob([c.buf], { type: c.mime || 'audio/webm' })); }
    catch (e) { c._url = ''; }
  }
  return c._url;
}
function voxMimeType() {
  if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  return '';
}
function ownAudioGo(i) {
  ownEditSync_();
  var n = OWN_EDIT_N, pid = OWN_EDIT[i]._id;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    VOX_MSG = 'הדפדפן הזה אינו תומך בהקלטה.'; paintOwnEdit_(n); return;
  }
  VOX_MSG = 'מבקש הרשאת מיקרופון…'; paintOwnEdit_(n);
  navigator.mediaDevices.getUserMedia({ audio:true }).then(function (stream) {
    if (!OWN_EDIT || OWN_EDIT_N !== n || !OWN_EDIT[i] || OWN_EDIT[i]._id !== pid) {
      stream.getTracks().forEach(function (t) { t.stop(); });      /* עברו קטע/חלק בזמן שחיכינו להרשאה */
      return;
    }
    VOX_STREAM = stream; VOX_FOR = { n:n, pid:pid };
    var mt = voxMimeType(), opts = { audioBitsPerSecond: 64000 };
    if (mt) opts.mimeType = mt;
    try { VOX_RECORDER = new MediaRecorder(stream, opts); }
    catch (e) {
      try { VOX_RECORDER = new MediaRecorder(stream); }
      catch (e2) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        VOX_STREAM = null; VOX_FOR = null;
        VOX_MSG = 'לא הצלחתי להפעיל הקלטה במכשיר הזה.'; paintOwnEdit_(n); return;
      }
    }
    VOX_CHUNKS = [];
    VOX_RECORDER.ondataavailable = function (e) { if (e.data && e.data.size) VOX_CHUNKS.push(e.data); };
    VOX_RECORDER.onstop = function () {
      if (VOX_STREAM) VOX_STREAM.getTracks().forEach(function (t) { t.stop(); });
      VOX_STREAM = null;
      var blob = new Blob(VOX_CHUNKS, { type: (VOX_RECORDER && VOX_RECORDER.mimeType) || mt || 'audio/webm' });
      var was = VOX_FOR;
      VOX_RECORDER = null; VOX_FOR = null;
      if (!blob.size) {
        VOX_MSG = 'ההקלטה יצאה ריקה - נסו שוב.';
        if (OWN_EDIT_N === was.n) paintOwnEdit_(was.n);
        return;
      }
      VOX_MSG = 'שומר…';
      if (OWN_EDIT_N === was.n) paintOwnEdit_(was.n);
      var fr = new FileReader();
      fr.onload = function () {
        voxSaveLocal_(was.n, was.pid, { buf:fr.result, mime:blob.type });
        /* הקלטה מקומית חדשה מבטלת את המצביע להעלאה הקודמת - היא
           תועלה מחדש רק בלחיצה הבאה על שמירה. */
        if (OWN_EDIT && OWN_EDIT_N === was.n) OWN_EDIT.forEach(function (p) { if (p._id === was.pid) p.audio = ''; });
        VOX_MSG = '';
        if (OWN_EDIT_N === was.n) paintOwnEdit_(was.n);
      };
      fr.onerror = function () {
        VOX_MSG = 'ההקלטה נכשלה להישמר.';
        if (OWN_EDIT_N === was.n) paintOwnEdit_(was.n);
      };
      fr.readAsArrayBuffer(blob);
    };
    VOX_MSG = '';
    VOX_RECORDER.start();
    paintOwnEdit_(n);
  }).catch(function () {
    VOX_MSG = 'אי אפשר לגשת למיקרופון - בדקו הרשאה בדפדפן.';
    if (OWN_EDIT_N === n) paintOwnEdit_(n);
  });
}
function ownAudioStop() {
  if (VOX_RECORDER && VOX_RECORDER.state !== 'inactive') VOX_RECORDER.stop();
}
function ownAudioDel(i) {
  ownEditSync_();
  var n = OWN_EDIT_N, pid = OWN_EDIT[i]._id;
  voxSaveLocal_(n, pid, null);
  OWN_EDIT[i].audio = '';
  paintOwn();
}
function sideMsg(cls, txt) {
  var m = $('sa-msg');
  if (m) { m.className = 'msg ' + cls; m.innerHTML = txt; }
}

/* הכתיבה היא no-cors ולכן תמיד "מצליחה". ההודעה שנשמר נאמרת
   רק אחרי קריאה חוזרת שמצאה בגיליון בדיוק את מה שנשלח. */
function sideSave() {
  if (!API) { sideMsg('bad', 'אין כתובת שרת במכשיר הזה.'); return; }
  if (!writeKey_()) { sideMsg('bad', NOKEY_MSG); return; }
  DMAP[dmKey(S.mas, S.daf)] = ANCH || {};
  var rows = [], k;
  for (k in DMAP) {
    if (!DMAP.hasOwnProperty(k)) continue;
    var v = DMAP[k], parts = k.split('|');
    if (v && v.__bad) { rows.push([parts[0], parts[1], v.__bad]); continue; }
    var has = false, q;
    for (q in v) if (v.hasOwnProperty(q)) { has = true; break; }
    if (has) rows.push([parts[0], parts[1], JSON.stringify(v)]);
  }
  sideMsg('', 'נשלח · מאמת מול הגיליון…');
  fetch(API, { method:'POST', mode:'no-cors', body:JSON.stringify({
    action:'table', tab:DECK_TAB, key:cfgReadKey_(),
    cols:JSON.stringify(['מסכת', 'דף', 'עוגנים']),
    rows:JSON.stringify(rows)
  }) }).catch(function () {});
  sideVerify(0);
}
function sideVerify(tries) {
  setTimeout(function () {
    sheetCsv(DECK_TAB).then(function (rows) {
      var m = dmapFromRows(rows);
      var mine = m && m[dmKey(S.mas, S.daf)];
      var want = JSON.stringify(ANCH || {});
      if (mine && JSON.stringify(mine) === want) {
        DMAP = m;
        sideMsg('ok', 'נשמר ואומת. מעכשיו המצגת זורמת כך אצל כל מי שפותח את הדף.');
        return;
      }
      if (tries < 4) { sideVerify(tries + 1); return; }
      sideMsg('bad', '<b>לא אומת.</b> ' + (!m
        ? 'הגיליון לא נענה, או שלשונית "מצגת" לא נוצרה.'
        : 'מה שחזר מהגיליון אינו מה שנשלח.') +
        ' השיוך קיים במסך הזה בלבד - אפשר לנסות שוב.');
    }).catch(function () {
      if (tries < 4) sideVerify(tries + 1);
      else sideMsg('bad', 'לא הצלחתי לקרוא מהגיליון.');
    });
  }, tries ? 5000 : 2500);
}

/* ============================================================
   ההדלקה.

   הכפתור מופיע לתלמיד רק כשיש לדף הזה שיוך אמיתי - דף בלי שיוך
   אינו מציע מצגת שלא תזוז. אצל מי שהניהול פתוח אצלו הכפתור מופיע
   תמיד, כי בלעדיו אי אפשר ליצור את השיוך הראשון.
   ============================================================ */
function sideInit() {
  DECK = deckOf();
  if (!DECK) return;
  try { SIDE_ADM = localStorage.getItem('df:admOk') === '1'; } catch (e) {}
  /* בהדגמה - לא. "שקף 3 מתוך 12" הוא הכלי של מי שמשייך, והרכז
     שמריץ את ההדגמה הוא בדיוק מי שהדגל הזה דלוק אצלו. */
  if (quiet()) SIDE_ADM = false;
  /* גם ב-CSS: הכותרת והחצים שייכים לשיוך, ולכן הם מופיעים רק
     אצל מי שמשייך. */
  document.body.classList.toggle('side-adm', SIDE_ADM);

  return Promise.resolve(loadDeckMap()).then(function () {
    /* שורה שלא נפענחה אינה שיוך. היא נשמרת ב-DMAP כפי שהיא
       כדי שהשמירה לא תמחק אותה, אבל היא אינה מפעילה מצגת. */
    var got = DMAP[dmKey(S.mas, S.daf)];
    ANCH = (got && !got.__bad) ? got : null;

    var has = false, q;
    for (q in (ANCH || {})) if (ANCH.hasOwnProperty(q) && q.indexOf('__') !== 0) { has = true; break; }
    var show = SIDE_ADM || has;
    var b = $('dktog');
    if (!b || !show) return;
    b.style.display = '';
    b.onclick = function () {
      sideOpen(!document.body.classList.contains('side-on'));
    };
    dkFresh();
    /* השקף הראשון מובא כבר עכשיו, לפני שאיש לחץ. */
    slidePre(slideAt(IDX));
    slidePre(slideAt(IDX) + 1);

    /* ---------- מה פתוח בכניסה ----------
       **במסך רחב - שתיהן.** מחנך שפותח את הדף בפעם הראשונה מול
       כיתה, על מקרן, אינו יודע שיש כאן מצגת ואינו מחפש כפתור.
       הוא ילמד עם הביאור בלבד, והכיתה לא תראה את מה שהוכן לה -
       והוא אפילו לא ידע מה החסיר. במסך רחב יש מקום לשלושתם זה
       לצד זה, ולכן אין שום דבר להרוויח מהסתרה.

       **בטלפון - רק הביאור**, כמו היום: שם המצגת תופסת את מקומו,
       וזו בחירה שצריכה להיות של מי שלחץ.

       ומי שסגר נשאר סגור, בשני המקרים: '0' נכתב רק מלחיצה של
       אדם, והפתיחה מאליה אינה נשמרת כהעדפה.

       בהדגמה כלום לא נפתח מאליו: התסריט פותח בזמן שלו, וכך היא
       נראית נפתחת ולא נמצאת. */
    if (!quiet()) try {
      var pref = localStorage.getItem('df:side');
      var want = sidePhone() ? (pref === '1') : (pref !== '0');
      if (want) sideOpen(true, true);
    } catch (e) {}
  });
}

/* ============================================================
   המקום שבו הוא עצר.
   ============================================================
   דף שלם הוא בין שלושים לחמישים קטעים. תלמיד שלמד רבע ממנו
   וסגר חזר למחרת אל הקטע הראשון - כלומר עמד לפני הבחירה לעבור
   שוב על מה שכבר למד, או לוותר. שתיהן מוציאות אותו.

   נשמר רק כשהדף שעל המסך הוא הדף של השבוע: הלוח מכיר שבועות,
   ותלמיד שפתח דף ישן לעיון אינו "באמצע" שום דבר.
   ============================================================ */
function posWeek() {
  var wk = LWeek();
  if (wk < 0 || typeof LDaf !== 'function') return -1;
  /* השבוע של מה שעל המסך - דף ועמוד. ב. וב: הם אותו דף ושני שבועות. */
  return wk === S.week ? wk : -1;
}
function savePos() {
  if (quiet()) return;            /* הדגמה אינה "מקום שעצרתי בו" */
  var wk = posWeek();
  if (wk < 0 || !FLAT.length) return;
  try { LPosSet(S.mas, wk, IDX, FLAT.length, FLAT[IDX] && FLAT[IDX].id); } catch (e) {}
  quietMark(wk);
}
/* ============================================================
   "למד" גם בלי ללחוץ "הבא" בסוף.
   ============================================================
   הסימון היה רק ב-finish(), כלומר רק למי שעבר את הקטע האחרון
   בלחיצה. תלמיד שהגיע לסוף הדף וסגר - לא סומן. עכשיו מי שהגיע
   לקטע האחרון, או לרוב הדף (לפי הנקודה הרחוקה, לא לפי מקום
   היציאה), מסומן בשקט: אותו LMark, רק לדף של השבוע, ובלי חלון
   הסיום ובלי "עם מי למדת" - אלה נשארים למי שעבר דרך finish(). */
var LEARN_MOST = 0.8;
function quietMark(wk) {
  if (quiet() || typeof LMark !== 'function' || FLAT.length < 2) return;
  try {
    if (LDone(S.mas, wk)) return;
    var p = LPos(S.mas, wk);
    var far = Math.max(IDX, (p && p.n === FLAT.length) ? p.i : 0);
    if (far >= FLAT.length - 1 || far / (FLAT.length - 1) >= LEARN_MOST) LMark(S.mas, wk);
  } catch (e) {}
}
/* נשלח ביציאה. `visibilitychange` הוא האירוע היחיד שנורה באמת
   כשסוגרים לשונית בטלפון - `beforeunload` אינו אמין שם. */
function sendPos() {
  var wk = posWeek();
  if (wk < 0) return;
  try { LPosSend(S.mas, wk); } catch (e) {}
}
document.addEventListener('visibilitychange', function () {
  /* גם המקום המדויק נשמר כאן - מי שסגר בזמן שהעמוד עוד נטען
     (go ממתין לציור) לא איבד את הקטע שעליו עמד. */
  if (document.visibilityState === 'hidden') { try { if (FLAT.length) { savePos(); spotSave(); } } catch (e) {} sendPos(); }
});
window.addEventListener('pagehide', sendPos);

/* חזרה למקום. לא בשקט: מסך שנפתח באמצע בלי לומר למה נראה
   כמו תקלה, ולכן יש שורה - ובה גם הדרך לפתוח מההתחלה. */
function resumePos() {
  var wk = posWeek();
  if (wk < 0 || !FLAT.length) return;
  if (LDone(S.mas, wk)) return;              /* סיים - אין למה לחזור */
  var p = LPos(S.mas, wk);
  if (!p) return;
  /* לפי המזהה, כשיש: פיצול או איחוד משנים את האורך ואת המיקום,
     ובלי זה התלמיד חזר לראש הדף בשקט. אותו קטע - גם אם זז. */
  var at = -1;
  if (p.id) for (var j = 0; j < FLAT.length; j++) if (FLAT[j].id === p.id) { at = j; break; }
  if (at < 0) {
    if (!(p.i > 0) || p.n !== FLAT.length) return;
    at = p.i;
  }
  if (!(at > 0) || at >= FLAT.length - 1) return;
  go(at);
  var el = $('resume');
  if (!el) return;
  el.innerHTML = 'המשכנו מהמקום שעצרת · ' +
    '<button onclick="resumeTop()">מתחילת הדף</button>';
  el.className = 'resume on';
  setTimeout(function () { el.className = 'resume on fade'; }, 4200);
}
function resumeTop() {
  var el = $('resume'); if (el) el.className = 'resume';
  go(0);
}

/* ============================================================
   המקום האחרון במכשיר - דף, עמוד וקטע.
   ============================================================
   `savePos` למעלה שומר רק את הדף של השבוע, רק קדימה, ולא אחרי
   סיום - כי הוא משרת את הלוח של הצוות. תלמיד שחזר לדף ישן, דפדף
   אחורה לעיין, או פתח את הדף הבא - חזר לקטע הראשון. כאן נשמר
   **בדיוק** איפה הוא עמד, בכל דף ובכל כיוון, במכשיר בלבד (לא נשלח
   לשום מקום). מזהה הקטע קודם - פיצול או איחוד לא מזיזים אותו. */
var SPOT_KEY = 'df:spot';
function spotGet() {
  try { return JSON.parse(localStorage.getItem(SPOT_KEY) || 'null'); } catch (e) { return null; }
}
function spotSave() {
  if (quiet() || EMB || !FLAT.length || !FLAT[IDX]) return;
  var pp = PAGES[FLAT[IDX].p] || {};
  try {
    /* `am` - היחידה (ב. או ב:), `pg` - העמוד שעל המסך בתוכה. */
    localStorage.setItem(SPOT_KEY, JSON.stringify({ mas: S.mas, daf: S.daf, am: S.am, i: IDX,
      n: FLAT.length, id: FLAT[IDX].id || '', pg: pp.pg || 1, at: Date.now() }));
  } catch (e) {}
}
function spotIdx(p) {
  if (p.id) for (var j = 0; j < FLAT.length; j++) if (FLAT[j].id === p.id) return j;
  return (p.n === FLAT.length && p.i >= 0 && p.i < FLAT.length) ? p.i : -1;
}
function resumeBar(html) {
  var el = $('resume');
  if (!el) return;
  el.innerHTML = html;
  el.className = 'resume on';
  setTimeout(function () { el.className = 'resume on fade'; }, 6000);
}
/* אותו דף - חוזרים לקטע. true = חזר. */
function spotResume() {
  var p = spotGet();
  /* רשומה מלפני שדף ב התחלק אין בה `am` - היא של הדף כולו, ואם
     הקטע שלה נמצא כאן, חוזרים אליו. */
  if (!p || p.mas !== S.mas || dafKey(p.daf) !== dafKey(S.daf) ||
      (p.am != null && p.am !== S.am)) return false;
  var at = spotIdx(p);
  if (!(at > 0)) return false;
  go(at);
  resumeBar('המשכנו מהמקום שעצרת · <button onclick="resumeTop()">מתחילת הדף</button>');
  return true;
}
/* דף אחר באותה מסכת, בשבוע האחרון - לא קופצים אליו בלי לשאול
   (אולי הוא בא בכוונה לדף של השבוע), אלא מציעים בשורה אחת. */
function spotOffer() {
  var p = spotGet();
  if (!p || p.mas !== S.mas ||
      (dafKey(p.daf) === dafKey(S.daf) && (p.am == null || p.am === S.am))) return;
  if (!(Date.now() - (p.at || 0) < 7 * 864e5)) return;
  var u = 'learn.html?mas=' + encodeURIComponent(S.mas) + '&' + unitQ({ daf: p.daf, am: p.am || 0 }) + keepQ();
  resumeBar(esc(fillT(UI.spotOther, { daf: p.daf, amud: amud(p.pg || 1) })) +
    ' <button onclick="location.href=\'' + u.replace(/'/g, '%27') + '\'">' + esc(UI.spotGo) + '</button>');
}
/* **קופצים, לא שואלים - כשהתקדם מעבר לדף של השבוע.** מי שנכנס
   מהבית נוחת על הדף של השבוע, וכשכבר המשיך קדימה (ב. ← ג.)
   השורה "עצרת בדף ג" הייתה עוד לחיצה בדרך למקום שממילא רצה בו.
   רק בכניסה מבחוץ: מעבר בתוך הדף (הבא, הקודם, המסלול) נושא
   `hop=1` - אחרת "הקודם" מ-ג היה מחזיר אותו מיד ל-ג. ורק קדימה:
   מי שחזר לעיין בדף של שבוע שעבר לא נשלח לשם ביום ראשון.
   true = יוצאים. */
function spotJump() {
  if (quiet() || EMB || AT_END || /[?&]hop=1\b/.test(location.search)) return false;
  if (posWeek() < 0) return false;
  var p = spotGet();
  if (!p || p.mas !== S.mas || !(Date.now() - (p.at || 0) < 7 * 864e5)) return false;
  var u = units(), here = unitAt(u), to = -1;
  for (var i = 0; i < u.length; i++)
    if (dafKey(u[i].daf) === dafKey(p.daf) && (p.am == null || u[i].am === p.am)) { to = i; break; }
  if (here < 0 || to <= here) return false;
  location.replace('learn.html?mas=' + encodeURIComponent(S.mas) + '&' +
    unitQ({ daf: u[to].daf, am: p.am || 0 }) + keepQ());
  return true;
}
function fillT(t, v) {
  return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
}

/* ============================================================
   "לאיזה דף?" - המסלול, בחלון על אותו דף.
   ============================================================
   הקשה על הכותרת פותחת את המסלול כמסע - אותו רכיב בדיוק כמו
   עמוד המסלול באפליקציה (trail.js): קו אנכי עם עיגולי עמודים,
   פרשה ותאריכים, מחיצות זהב לפרקים, "השבוע", ווי ירוק למה
   שנלמד. חלון ולא מעבר לעמוד אחר - מי שקופץ קדימה רואה איפה
   הוא ביחס למסלול, ולא רק מספר.

   · שורה לכל עמוד (ב. ב: ג. ג: …), ורק מה שכבר נפתח. דף שנלמד
     בשבוע אחד נותן שתי שורות לאותו שבוע.
   · נפתח במקום שבו הלומד נמצא, ומסמן אותו. "השבוע" הוא של כולם
     (LWeek) ואינו זז לפי הבחירה.
   · הקשה פותחת מיד. */
var PICK_U = [];
/* העמודים שנפתחו, לפי סדר המסלול. הרכז רואה הכול - הוא נכנס גם
   לדף נעול (ראו boot). */
function pickDafs() {
  var tr = null;
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === S.mas) tr = TRACKS[i];
  if (!tr) return [];
  return TrailAmudim(tr).filter(function (u) {
    return SIDE_ADM || OpenIs(S.mas, u.daf, LAmOf(u.row));
  });
}
/* איפה הלומד נמצא: היחידה שעל המסך, והעמוד שבו הוא עומד בה. */
function pickHere(list) {
  var am = S.am;
  if (!am) {
    var st = FLAT[IDX], pp = st && PAGES[st.p];
    am = pp && dafKey(pp.daf) === dafKey(S.daf) && pp.pg === 2 ? 2 : 1;
  }
  for (var i = 0; i < list.length; i++)
    if (dafKey(list[i].daf) === dafKey(S.daf) && list[i].am === am) return i;
  return -1;
}