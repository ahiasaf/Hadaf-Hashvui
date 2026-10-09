
/* סיסמת הכתיבה - הלשוניות של הדף (פירוש, מצגת, שאלות) נכתבות רק
   איתה. ראו `writeKey_` בסטודיו: אותה סיסמה, אותו אחסון. שמירה
   אוטומטית אינה שואלת - היא פשוט אינה כותבת בלעדיה. */
function writeKey_(auto) {
  var k = cfgReadKey_();
  if (k || auto) return k;
  k = String(window.prompt('סיסמת הסקריפט - פעם אחת במכשיר הזה.\n' +
      'בלעדיה אי אפשר לשמור בגיליון.') || '').trim();
  if (k) {
    try {
      var c = JSON.parse(localStorage.getItem('df:cfg') || '{}') || {};
      c.readKey = k;
      localStorage.setItem('df:cfg', JSON.stringify(c));
    } catch (e) {}
  }
  return k;
}
var NOKEY_MSG = 'לא נשמר - חסרה סיסמת הסקריפט במכשיר (ניהול ← מערכת). מה שכתבת שמור במכשיר.';
function ownPost_() {
  fetch(API, { method:'POST', mode:'no-cors', body:JSON.stringify({
    action:'table', tab:OWN_TAB, key:cfgReadKey_(),
    cols:JSON.stringify(['מסכת', 'דף', 'פירוש']),
    rows:JSON.stringify(ownRows_())
  }) }).catch(function () {});
}
/* חלק ריק לגמרי (בלי טקסט ובלי הקלטה) לא נשמר - כך מחיקת כל
   הטקסט מחלק שווה למחיקתו, בלי כפתור נפרד. */
function ownCleanPieces_(list) {
  var out = [];
  list.forEach(function (p) {
    if (!(p.text || '').trim() && !p.audio) return;
    out.push({ tag:(p.tag || 'פירוש').trim() || 'פירוש', text:p.text || '', slide:p.slide || '', audio:p.audio || '' });
  });
  return out;
}
/* סיסמת הסקריפט לפעולות מוגנות (ghput) - אותו אחסון בדיוק כמו
   ב"ניהול ← מערכת" שבמסך אחר; לא נערכת כאן, רק נקראת. */
function cfgReadKey_() {
  try { return (JSON.parse(localStorage.getItem('df:cfg') || '{}').readKey || '').trim(); }
  catch (e) { return ''; }
}
/* שמירה: קודם מעלים לגיטהאב כל הקלטה מקומית שעדיין לא הועלתה
   (ראו `ownUploadNext_`), ורק אז כותבים את מערך החלקים לגיליון -
   כדי שלא יישמר מצביע לקובץ שעוד לא באמת קיים שם. */
/* העלאת ההקלטות לגיטהאב - בדיוק אותו מנגנון שכבר משרת שקפים
   (`action:'ghput'` הכללי שב-apps-script.gs, ואימות מול
   ה-contents API כמו `dkAskUntil` שבמסך הניהול). שום שינוי
   בסקריפט: המפתח כבר פתוח לכל נתיב, וכאן רק תיקיית `audio/`
   במקום `slides/`. */
function ownAudioExt_(mime) {
  if (/mp4/.test(mime)) return 'm4a';
  if (/ogg/.test(mime)) return 'ogg';
  return 'webm';
}
/* ArrayBuffer -> base64, בפיסות של 32K כדי לא לפגוע ב-
   String.fromCharCode.apply עם הקלטה ארוכה (מעבר לזה זורק
   "Maximum call stack size exceeded" בדפדפנים ישנים). */
function ownB64FromBuf_(buf) {
  var bytes = new Uint8Array(buf), bin = '', i, CH = 0x8000;
  for (i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}
function ownUploadVerify_(path, tries, cb) {
  var slash = path.lastIndexOf('/'), dir = path.slice(0, slash), name = path.slice(slash + 1);
  fetch('https://api.github.com/repos/' + REPO + '/contents/' +
        dir.split('/').map(encodeURIComponent).join('/') + '?ref=main&t=' + Date.now())
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (j) {
      var have = (j || []).some(function (f) { return f.name === name; });
      if (have) { cb(true); return; }
      if (tries < 5) { setTimeout(function () { ownUploadVerify_(path, tries + 1, cb); }, 2200); return; }
      cb(false);
    })
    .catch(function () {
      if (tries < 5) { setTimeout(function () { ownUploadVerify_(path, tries + 1, cb); }, 2200); return; }
      cb(false);
    });
}
function ownUploadNext_(n, list, i, failed, done) {
  if (i >= list.length) { done(failed); return; }
  var item = list[i], mime = item.clip.mime || 'audio/webm';
  var path = 'audio/' + dmKey(S.mas, S.daf).replace('|', '-') + '/' + n + '-' + item.p._id +
    '.' + ownAudioExt_(mime);
  ownMsg('', 'מעלה הקלטה ' + (i + 1) + ' מתוך ' + list.length + '…');
  fetch(API, { method:'POST', mode:'no-cors', body:JSON.stringify({
    action:'ghput', key:cfgReadKey_(), path:path, b64:ownB64FromBuf_(item.clip.buf),
    msg:'הקלטה לקטע ' + n + ' · ' + dmKey(S.mas, S.daf)
  }) }).catch(function () {}).then(function () {
    ownUploadVerify_(path, 0, function (ok) {
      if (ok) item.p.audio = path; else failed.push(item.p.tag || 'פירוש');
      ownUploadNext_(n, list, i + 1, failed, done);
    });
  });
}
/* ============================================================
   "עבדתי שעות על קטע 39. אחר כך תיקנתי קטע אחר בטלפון, ששם הייתה
   גרסה ישנה - והשמירה שם העלימה לי את הגרסה החדשה."
   ============================================================
   השמירה כותבת את כל הלשונית מחדש. היא כתבה אותה **ממה שהמכשיר
   זכר** - ובטלפון שנפתח לפני שעות, זה היה הנוסח הישן של כל
   הקטעים. שמירה של קטע אחד דרסה את כל השאר.

   עכשיו, רגע לפני כל כתיבה, קוראים את הלשונית מחדש ומשנים בה רק
   את הקטע שנשמר. ואם בגיליון יש לקטע הזה עצמו גרסה שנשמרה אחרי
   שהוא נפתח כאן - שואלים לפני שדורסים (ובשמירה אוטומטית פשוט לא
   דורסים). קריאה שנכשלה - לא כותבים בכלל. */
function ownFresh_(apply) {
  return sheetCsv(OWN_TAB).then(function (rows) {
    var m = dmapFromRows(rows);
    if (!m) return false;
    var k = dmKey(S.mas, S.daf), cur = m[k];
    if (cur && cur.__bad) return false;          /* שורה פגומה - לא נוגעים */
    if (!cur || typeof cur !== 'object') cur = {};
    /* מה שבגיליון עכשיו - גם אם בסוף לא כותבים */
    OMAP = m; OWN = m[k] || null;
    if (apply(cur) === false) return null;
    var has = false, q;
    for (q in cur) if (cur.hasOwnProperty(q)) { has = true; break; }
    if (has) m[k] = cur; else delete m[k];
    OMAP = m; OWN = m[k] || null;
    ownPost_();
    return true;
  }).catch(function () { return false; });
}
function ownSaveAll(n, auto) {
  /* לפני כל ניסיון - הטקסט במכשיר. מעבר קטע בלי הקלדה נוספת לא
     כתב טיוטה, ושמירה שנכשלה השאירה אותו רק בזיכרון של הלשונית. */
  if (!OWN_EDIT || OWN_EDIT_N !== n) return;
  ownDraftPut_();
  /* הקטע נלקח עכשיו - מיד אחרי הקריאה הזו המסך כבר עובר לקטע הבא. */
  var pieces = OWN_EDIT.slice();
  ownVerCheck_().then(function () {
    if (OWN_NEWER) { ownBar_(); return; }
    ownSaveGo_(n, auto, pieces);
  });
}
function ownSaveGo_(n, auto, pieces) {
  if (!API) { ownMsg('bad', 'אין כתובת שרת במכשיר הזה.'); return; }
  if (!writeKey_(auto)) { ownMsg('bad', NOKEY_MSG); return; }
  var toUpload = [];
  pieces.forEach(function (p) {
    var clip = VOX_CACHE[n + '::' + p._id];
    if (clip && !p.audio) toUpload.push({ p:p, clip:clip });
  });
  if (toUpload.length && !cfgReadKey_()) {
    ownMsg('bad', 'צריך סיסמת סקריפט במכשיר כדי להעלות הקלטה - ניהול ← מערכת.'); return;
  }
  OWN_SAVING = true;
  ownMsg('', toUpload.length ? 'מעלה הקלטות…' : 'נשלח · מאמת מול הגיליון…');
  var others = [];
  ownUploadNext_(n, toUpload, 0, [], function (failed) {
    var clean = ownCleanPieces_(pieces);
    ownFresh_(function (cur) {
      cur.__t = cur.__t || {};
      /* שאר הקטעים של הדף שממתינים בטיוטה. קטע שנשמר ממכשיר אחר
         אחרי שנכתבה כאן הטיוטה שלו - נשאל עליו פעם אחת (ובשמירה
         אוטומטית פשוט לא נוגעים בו). */
      var clash = [];
      others = ownOtherDrafts_(n).filter(function (d) {
        if (JSON.stringify(ownPiecesIn_(cur, d.n)) === JSON.stringify(d.pieces)) {
          ownDraftDrop_(d.n); return false;
        }
        var t = sidTime_(cur, d.n);
        if (t && d.at && t > d.at) { clash.push(d); return false; }
        return true;
      });
      if (clash.length && !auto && window.confirm(
          'בגיליון יש גרסה חדשה יותר, ששמרת ממכשיר אחר, לקטע ' +
          clash.map(function (d) { return d.n; }).join(', ') + '.\n\n' +
          'לדרוס אותה במה שכתוב כאן?\nאישור - לדרוס · ביטול - להשאיר את מה שבגיליון')) {
        others = others.concat(clash);
      } else if (!auto) {
        /* בחר להשאיר את מה שבגיליון - הטיוטה כבר אינה "לא נשמר". */
        clash.forEach(function (d) { ownDraftDrop_(d.n); });
      }
      others.forEach(function (d) {
        var dk = sidPut_(cur, d.n, d.pieces.length ? d.pieces : undefined, true);
        cur.__t[dk] = Date.now();
      });
      var there = JSON.stringify(ownPiecesIn_(cur, n));
      if (there !== OWN_EDIT_BASE && there !== JSON.stringify(clean) && OWN_EDIT_N === n) {
        if (auto) return false;
        if (!window.confirm('בגיליון יש לקטע ' + n + ' גרסה שנשמרה ממכשיר אחר אחרי שפתחת אותו כאן.\n\n' +
            'לדרוס אותה במה שכתוב כאן?\nאישור - לדרוס · ביטול - לא לשמור, ולטעון את הגרסה מהגיליון')) {
          OWN_EDIT = null; OWN_EDIT_N = -1;
          ownDraftDrop_(n);
          return false;
        }
      }
      cur.__t = cur.__t || {};
      var nk = sidPut_(cur, n, clean.length ? clean : undefined, true);
      cur.__t[nk] = Date.now();
    }).then(function (ok) {
      if (ok === true) {
        /* הבסיס מתעדכן רק כשהגיליון אישר (ראו ownVerify). כששמירה
           נדחתה, בסיס שכבר עודכן גרם לניסיון הבא לחשוב ש"נשמרה
           ממכשיר אחר גרסה חדשה" - ו"ביטול" בשאלה ההיא מחק את הטקסט. */
        ownMsg('', 'נשלח · מאמת מול הגיליון…');
        ownVerify(0, n, clean, failed, others);
        return;
      }
      OWN_SAVING = false;
      if (ok === null) {
        if (auto) { ownMsg('bad', 'לקטע הזה נשמרה ממכשיר אחר גרסה חדשה יותר - לא נשמר אוטומטית. לחצו "שמירה" כדי להחליט.'); return; }
        ownMsg('', 'לא נשמר. נטענת הגרסה מהגיליון.');
        paintChavArea();
        return;
      }
      ownMsg('bad', 'לא הצלחתי לקרוא את הגיליון לפני השמירה - לא נשמר, כדי לא לדרוס. מה שכתבת שמור במכשיר.');
    });
  });
}
function ownVerify(tries, n, wantPieces, failed, others) {
  others = others || [];
  var failWarn = (failed && failed.length)
    ? ' <b>שימו לב:</b> ההקלטה של "' + failed.join('", "') + '" לא עלתה - הטקסט נשמר, אפשר לנסות להקליט ולשמור שוב.'
    : '';
  setTimeout(function () {
    sheetCsv(OWN_TAB).then(function (rows) {
      var m = dmapFromRows(rows);
      var mine = m && m[dmKey(S.mas, S.daf)];
      var got = ownPiecesIn_(mine || {}, n);
      var allOk = others.every(function (d) {
        return JSON.stringify(ownPiecesIn_(mine || {}, d.n)) === JSON.stringify(d.pieces);
      });
      if (allOk && JSON.stringify(got) === JSON.stringify(wantPieces)) {
        OMAP = m; OWN = mine;
        OWN_SAVING = false;
        if (OWN_EDIT_N === n) OWN_EDIT_BASE = JSON.stringify(wantPieces);
        others.forEach(function (d) { ownDraftDrop_(d.n); });
        /* הגיליון מחזיק בדיוק את זה - הטיוטה במכשיר כבר מיותרת,
           אלא אם הוקלד משהו נוסף בינתיים. */
        if (OWN_EDIT_N === n) ownDraftPut_(); else ownDraftDrop_(n);
        /* הוקלד עוד בזמן השמירה - עוד סבב, אחרי שקט. */
        if (OWN_EDIT_N === n && !(OWN && OWN.__pub) && ownEditDirty_()) ownTyped_();
        var left = ownPendingTxt_();
        if (!failWarn) { ownMsg('ok', ''); return; }
        ownMsg('bad',
          (others.length ? 'נשמרו ' + (others.length + 1) + ' קטעים ואומתו. '
                         : (OWN && OWN.__pub) ? 'נשמר ואומת. ' : 'נשמר כטיוטה ואומת. ') +
          ((OWN && OWN.__pub)
          ? 'הדף כבר מפורסם, אז זה כבר גלוי לתלמידים.'
          : 'עדיין רק אתה רואה - עד שתפרסם את כל הדף.') +
          (left ? ' <b>' + left + '</b>' : ' כל הדף בגיליון.') + failWarn);
        return;
      }
      if (tries < 4) { ownVerify(tries + 1, n, wantPieces, failed, others); return; }
      OWN_SAVING = false;
      ownMsg('bad', '<b>לא אומת.</b> ' + (!m
        ? 'הגיליון לא נענה, או שלשונית "' + OWN_TAB + '" לא נוצרה.'
        : 'מה שחזר מהגיליון אינו מה שנשלח.') +
        ' הטקסט שמור במכשיר הזה - אפשר לנסות שוב.');
    }).catch(function () {
      if (tries < 4) ownVerify(tries + 1, n, wantPieces, failed, others);
      else { OWN_SAVING = false; ownMsg('bad', 'לא הצלחתי לקרוא מהגיליון. מה שכתבת שמור במכשיר.'); }
    });
  }, tries ? 2500 : 1400);
}
/* מתג הפרסום - לכל הדף בבת אחת, לא לקטע. אותו מפתח שמור
   (`__pub`) באותו אובייקט שכבר נשמר לדף הזה בלשונית `פירוש`. */
function ownPublishSet(on) {
  if (!API) { ownMsg('bad', 'אין כתובת שרת במכשיר הזה.'); return; }
  if (!writeKey_()) { ownMsg('bad', NOKEY_MSG); return; }
  ownMsg('', on ? 'מפרסם לכל הדף · מאמת מול הגיליון…' : 'מחזיר לטיוטה · מאמת מול הגיליון…');
  ownFresh_(function (cur) {
    if (on) cur.__pub = '1'; else delete cur.__pub;
  }).then(function (ok) {
    if (ok) ownPublishVerify(0, on);
    else ownMsg('bad', 'לא הצלחתי לקרוא את הגיליון - לא שיניתי כלום. נסו שוב.');
  });
}
function ownPublishVerify(tries, on) {
  setTimeout(function () {
    sheetCsv(OWN_TAB).then(function (rows) {
      var m = dmapFromRows(rows);
      var mine = m && m[dmKey(S.mas, S.daf)];
      var got = !!(mine && mine.__pub);
      if (got === !!on) {
        OMAP = m; OWN = mine;
        ownMsg('ok', on ? 'פורסם! מעכשיו כל התלמידים שיפתחו את הדף הזה רואים את הפירוש לנוער.'
                        : 'הוחזר לטיוטה. התלמידים כבר לא רואים את זה.');
        paintChavArea();
        return;
      }
      if (tries < 4) { ownPublishVerify(tries + 1, on); return; }
      ownMsg('bad', 'לא אומת. אפשר לנסות שוב.');
    }).catch(function () {
      if (tries < 4) ownPublishVerify(tries + 1, on);
      else ownMsg('bad', 'לא הצלחתי לקרוא מהגיליון.');
    });
  }, tries ? 5000 : 2500);
}

/* המתג בין שתי הלשוניות יושב בכותרת הקבועה של המגירה (`#cht`),
   לא בזרם התוכן - כך שהוא תמיד באותו מקום, ולא תופס גובה מהטקסט.
   תלמיד שאין לו מה לראות בלשונית השנייה רואה שם רק תווית קבועה
   "חברותא" - "קטע בלי הקלטה, אין כפתור". אצל אחיאסף היא תמיד
   לחיצה, כי בלעדיה אי אפשר לכתוב פירוש ראשון לקטע. */
function paintChavArea() {
  ownCatch_();
  var st = FLAT[IDX];
  var canOwn  = !!(st && (SIDE_ADM || (OWN && OWN.__pub && ownPieces_(st.n).length)));
  var canQuiz = !!(st && (SIDE_ADM || qVisible_(st.n).length));
  if (CHAV_TAB === 'own' && !canOwn) CHAV_TAB = 'chav';
  if (QUIZ_OPEN && !canQuiz) QUIZ_OPEN = false;
  document.body.classList.toggle('quiz-on', !!QUIZ_OPEN);
  var cht = $('cht');
  if (cht) cht.innerHTML = QUIZ_OPEN ? quizChdHtml() : chavTabHtml(st);
  if (QUIZ_OPEN) paintQuiz();
  else if (CHAV_TAB === 'own' && canOwn) paintOwn();
  else paintChav();
  if ($('cht-chav')) $('cht-chav').onclick = function () { CHAV_TAB = 'chav'; paintChavArea(); };
  if ($('cht-own'))  $('cht-own').onclick  = function () { CHAV_TAB = 'own';  paintChavArea(); };
  if ($('cht-x'))    $('cht-x').onclick    = function () { QUIZ_OPEN = false; paintChavArea(); };
  quizFabPaint();
}

/* העיגול הצף של החידה - צף מעל הבמה, לא בזרם התוכן, כדי שיהיה
   נגיש בלי לפתוח כלום: לחיצה עליו פותחת את המגירה (אם סגורה)
   ומחליפה את תוכנה לחידה, בדיוק כמו מעבר בין חברותא לפירוש לנוער.
   נשאר על המסך תמיד כשיש חידה לקטע - גם כשהיא כבר פתוחה, כדי
   שאותה לחיצה תסגור אותה (מתג, לא כפתור-פתיחה-חד-פעמי). */
function quizFabPaint() {
  var st = FLAT[IDX], fab = $('qfab');
  if (!fab) return;
  var can = !!(st && (SIDE_ADM || qVisible_(st.n).length));
  fab.classList.toggle('on', can);
  fab.classList.toggle('lit', !!QUIZ_OPEN);
  fab.onclick = function () {
    qHintDone_();
    QUIZ_OPEN = !QUIZ_OPEN;
    if (QUIZ_OPEN && !document.body.classList.contains('chav-on')) drawer(true);
    else paintChavArea();
  };
  var hint = $('qhint');
  if (hint) hint.onclick = function () { fab.onclick(); };
  if (can && !QUIZ_OPEN) qHintShow_();
  else qHintHide_();
}

/* הכיתוב שליד העיגול - "זמן לענות על חידה". מופיע רק בפעמים
   הראשונות: פעם אחת בכל כניסה לדף, עד QHINT_MAX כניסות, ונעלם
   לבד אחרי כמה שניות. מי שכבר לחץ על העיגול - מכיר אותו, ולא
   יראה את הכיתוב שוב. בהדגמה - לא נספר, כדי שלא יבזבז את
   הפעמים של מי שמריץ אותה. */
var QHINT_KEY = 'df:qHintN', QHINT_MAX = 3, QHINT_MS = 7000;
var QHINT_SEEN = false, QHINT_T = null;
function qHintN_() {
  try { return parseInt(localStorage.getItem(QHINT_KEY), 10) || 0; } catch (e) { return QHINT_MAX; }
}
function qHintShow_() {
  var el = $('qhint');
  if (!el || QHINT_SEEN) return;
  if (!quiet() && qHintN_() >= QHINT_MAX) return;
  QHINT_SEEN = true;
  if (!quiet()) try { localStorage.setItem(QHINT_KEY, String(qHintN_() + 1)); } catch (e) {}
  el.textContent = UI.quizHint;
  el.classList.add('on');
  setTimeout(function () { el.classList.add('in'); }, 30);
  QHINT_T = setTimeout(qHintHide_, QHINT_MS);
}
function qHintHide_() {
  var el = $('qhint');
  if (!el || !el.classList.contains('on')) return;
  clearTimeout(QHINT_T);
  el.classList.remove('in');
  setTimeout(function () { el.classList.remove('on'); }, 360);
}
function qHintDone_() {
  try { localStorage.setItem(QHINT_KEY, String(QHINT_MAX)); } catch (e) {}
  qHintHide_();
}

/* מקלדת שנפתחת בטלפון גוזלת רוב הגובה, ואחיאסף כותב בעיקר
   בהדבקה או בהקלדה קולית - אין לו מקום קריא מעליה. פותרים בלי
   לנחש "איזה קלט": מסתכלים כמה השטח הנראה התכווץ בפועל, ורק
   אצל מי שהניהול פתוח אצלו ורק כשהמיקוד באמת על תיבת הפירוש. */
if (window.visualViewport) {
  (function () {
    var vvh0 = window.visualViewport.height;
    window.visualViewport.addEventListener('resize', function () {
      var el = document.activeElement;
      var open = SIDE_ADM && el && el.id && el.id.indexOf('own-txt-') === 0 &&
        (vvh0 - window.visualViewport.height) > 120;
      document.body.classList.toggle('kb-open', open);
    });
  })();
}

/* עזיבת העמוד (סגירה, ריענון, מעבר לאתר אחר) עם עריכה שלא
   נשמרה - המעבר בין קטעים כבר שומר לבד (ראו `paintOwn`), אבל
   זו לא נגיעה בזה: מי שסוגר את הכל באמצע כתיבה מקבל אזהרה
   סטנדרטית של הדפדפן במקום לגלות מחר שהטקסט נעלם. */
window.addEventListener('beforeunload', function (e) {
  if (!SIDE_ADM || !ownEditDirty_()) return;
  e.preventDefault();
  e.returnValue = '';
});

/* גודל הטקסט. חמישה שלבים, נשמר במכשיר. */
var CZ = 2, CZS = [.86, .93, 1, 1.12, 1.28];
function chavZoom(d) {
  CZ = Math.max(0, Math.min(CZS.length - 1, CZ + d));
  document.documentElement.style.setProperty('--cz', CZS[CZ]);
  $('czm').disabled = CZ === 0;
  $('czp').disabled = CZ === CZS.length - 1;
  if (d) {
    if (!quiet()) try { localStorage.setItem('df:chav-size', CZ); } catch (e) {}
    recStep('zoom', d);
  }
}

function needChav() {
  return FLAT.some(function (v) { return !(v.c && v.c.h); });
}