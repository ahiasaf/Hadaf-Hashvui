

/* עמוד אחד מצויר פעם אחת ונשמר כתמונה. דף שבו הקטעים חוצים את
   שני העמודים מחליף ביניהם הלוך ושוב, וציור מחדש בכל מעבר היה
   עוצר את הלימוד לשנייה בכל פעם. */
function showPage(daf, n) {
  var dk = dafKey(daf), key = dk + '|' + n;
  if (IMG[key]) return setImg(IMG[key]);
  var src = libSrc(daf, n);
  if (src) { IMG[key] = src; return setImg(src); }
  return loadGemara(daf)
    .then(pdfReady)
    .then(function () {
      if (DOCS[dk]) return DOCS[dk];
      if (!BYTES[dk]) throw new Error('no bytes');
      return pdfjsLib.getDocument({ data: BYTES[dk].slice(0) }).promise
        .then(function (doc) { DOCS[dk] = doc; return doc; });
    })
    .then(function (doc) { return doc.getPage(Math.min(n, doc.numPages)); })
    .then(function (pg) {
      var base = pg.getViewport({ scale:1 });
      var vp = pg.getViewport({ scale: TARGET_W / base.width });
      var c = document.createElement('canvas');
      c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise
        .then(function () {
          IMG[key] = c.toDataURL('image/webp', 0.86);
          return setImg(IMG[key]);
        });
    });
}
function setImg(src) {
  return new Promise(function (ok) {
    var im = $('page');
    if (im.src === src) return ok();
    im.onload = function () {
      R = im.naturalHeight / im.naturalWidth;
      ok();
    };
    im.src = src;
  });
}

/* ============================================================
   חברותא.

   בכל קטע כבר שמור הטקסט שסומן לו, ולכן המגירה עובדת גם בלי
   רשת. אבל בקובץ המקורי המילים הפותחות - אלה שמצטטות את לשון
   הגמרא - מודגשות, והן בדיוק מה שמאפשר לתלמיד למצוא את עצמו.
   לכן בפתיחה הראשונה נטען הקובץ ברקע ומשוחזרת ההדגשה. נכשל,
   או שההתאמה אינה מדויקת - נשארים עם הטקסט השמור, בלי הודעה.
   ============================================================ */
var CHV = null, CHV_TRIED = false;

function chavItems(pg) {
  return pg.getTextContent().then(function (tc) {
    return tc.items.filter(function (it) { return it.str.trim() !== ''; });
  });
}
function bodyHeight(items) {
  var hist = {};
  items.forEach(function (it) {
    var h = Math.round(it.height * 20) / 20;
    hist[h] = (hist[h] || 0) + it.str.length;
  });
  var best = 0, n = -1;
  for (var h in hist) if (hist[h] > n) { n = hist[h]; best = +h; }
  return best;
}
function chavBuild(items, body) {
  var lim = body * 1.10, paras = [], cur = null, lastY = null, prev = null;
  items.forEach(function (it) {
    var y = Math.round(it.transform[5]), x = it.transform[4];
    var bold = it.height >= lim;
    if (lastY === null || lastY - y > 26 || y > lastY + 8) {
      cur = { runs: [] }; paras.push(cur); prev = null;
    }
    var gap = '';
    if (prev) {
      if (y !== prev.y) gap = ' ';
      else if (prev.x - (x + it.width) > it.height * 0.15) gap = ' ';
    }
    prev = { x:x, y:y }; lastY = y;
    var last = cur.runs[cur.runs.length - 1];
    if (last && last.b === bold) last.t += gap + it.str;
    else { if (last && gap) last.t += gap; cur.runs.push({ t:it.str, b:bold }); }
  });
  return paras.filter(function (p) {
    return p.runs.map(function (r) { return r.t; }).join('').trim().length > 1;
  });
}
function loadChav() {
  if (CHV_TRIED) return Promise.resolve();
  CHV_TRIED = true;
  var links = ((window.DAF_LINKS || {})[S.mas] || {})[dafKey(S.daf)] || [];
  var id = fileId(links[1]);
  if (!id || !API) return Promise.resolve();
  return grab(id)
    .then(function (buf) { return pdfReady().then(function () { return buf; }); })
    .then(function (buf) { return pdfjsLib.getDocument({ data: buf.slice(0) }).promise; })
    .then(function (doc) {
      var jobs = [];
      for (var i = 1; i <= doc.numPages; i++) jobs.push(doc.getPage(i).then(chavItems));
      return Promise.all(jobs);
    })
    .then(function (pages) {
      var all = [].concat.apply([], pages);
      var body = bodyHeight(all);
      CHV = [].concat.apply([], pages.map(function (it) { return chavBuild(it, body); }));
      paintChavArea();
    })
    .catch(function () {});
}
function bare(t) { return String(t || '').replace(/\s+/g, ''); }
/* מטמון ההדגשות, לפי מסכת·דף·קטע. קריאה בלי ערך, כתיבה עם. */
function chavCache(i, html) {
  var k = 'df:ch:' + S.mas + '|' + dafKey(S.daf);
  try {
    var o = JSON.parse(localStorage.getItem(k) || '{}');
    if (html == null) return o[i] || '';
    o[i] = html;
    localStorage.setItem(k, JSON.stringify(o));
  } catch (e) {}
  return html || '';
}

/* מספרי ההערות של חברותא - "(112)" - מפנים להערות שאינן כאן,
   ולכן אינם מוצגים. רק סוגריים שיש בהם ספרות בלבד; סוגריים עם
   טקסט נשארים כמו שהם. בתצוגה בלבד - הסימון והייצוא לא משתנים. */
function chavNoRefs(html) {
  return String(html || '').replace(/[ \u00a0]*\(\s*\d+\s*\)/g, '');
}
function paintChav() {
  var st = FLAT[IDX], box = $('chb');
  $('chnum').textContent = '';       /* אותו מספר, אותה סיבה */
  if (!st) { box.innerHTML = ''; return; }
  var html = '';
  /* המבנה נשמר בסימון עצמו, ולכן אין צורך בקובץ החברותא כלל -
     לא מהדרייב ולא דרך הסקריפט. סימונים ישנים שנשמרו לפני כן
     עדיין נשענים על הקובץ, וזה מה שהענף הבא מטפל בו. */
  if (st.c && st.c.h) html = st.c.h;
  /* סימונים ישנים נשמרו בלי ה-HTML, ולכן הם נשענים על קובץ
     החברותא - שתי מגהבייט דרך הסקריפט, בכל פתיחה מחדש. זה
     האיטיות, וזו גם הסיבה שההדגשות נעלמו כשהמשיכה נכשלה.
     מה שנבנה פעם אחת נשמר כאן, וכל פתיחה הבאה מיידית. */
  if (!html) html = chavCache(IDX);
  if (!html && CHV && st.c && st.c.from != null) {
    var got = [], plain = '';
    for (var i = st.c.from; i <= st.c.to && i < CHV.length; i++) {
      got.push(CHV[i]);
      plain += CHV[i].runs.map(function (r) { return r.t; }).join('') + ' ';
    }
    /* בדיקה לפני שסומכים על האינדקסים: אם הקובץ שהתקבל אינו זהה
       לזה שעליו נעשה הסימון, המספרים מצביעים על פסקאות אחרות. */
    if (got.length && bare(plain) === bare(st.c.text)) {
      html = got.map(function (p) {
        return '<p>' + p.runs.map(function (r) {
          return r.b ? '<b>' + esc(r.t) + '</b>' : esc(r.t); }).join('') + '</p>';
      }).join('');
      chavCache(IDX, html);
    }
  }
  if (!html) {
    html = st.c && st.c.text
      ? '<p>' + esc(st.c.text) + '</p>'
      : '<div class="none">לקטע הזה לא צורף ביאור.</div>';
  }
  box.innerHTML = chavNoRefs(html);
  box.scrollTop = 0;
}

/* ============================================================
   "הפירוש שלי" - לשונית שנייה בתוך אותה מגירה בדיוק.
   ============================================================
   לא קובץ נפרד ולא חלוקה מחדש: השיוך בין מילות הגמרא המודגשות
   לבין הקטע כבר קיים ב-`st.c.h` - בדיוק מה שמצייר `paintChav`
   היום. "הפירוש שלי" הוא רק ערוץ שני, ריק, **צמוד לאותו מספר
   קטע** (`st.n`) - בדיוק כמו שיוך השקף וכמו הקלטת הקול. מכאן
   שהוא תקף מאליו גם לדפים שכבר סומנו וגם לדפים שיסומנו מחר,
   בלי שום שלב הכנה.

   הכתיבה היא `action:'table'` הקיים, בדיוק כמו הלשונית `מצגת` -
   שום שינוי ב-apps-script.gs. `dmapFromRows` כללית ומשרתת גם
   כאן בדיוק כמו שם. */
var OWN_TAB = 'פירוש';
var OMAP = {};        /* כל הלשונית: 'מסכת|דף' -> {קטע: [חלקים] | טקסט ישן} */
var OWN = null;        /* הפירוש של הדף שעל המסך, או null אם אין */
var CHAV_TAB = 'chav'; /* 'chav' = חברותא · 'own' = הפירוש שלי */
/* האם החידה פתוחה כרגע במקום תוכן המגירה. עצמאי מ-CHAV_TAB בכוונה:
   סגירת החידה (X, או תשובה) חוזרת לאיזו לשונית שהייתה פתוחה קודם,
   ולא תמיד ל'chav' - ראו quizFabPaint/qAnswer. */
var QUIZ_OPEN = false;

function loadOwnMap() {
  return sheetCsv(OWN_TAB).then(function (rows) {
    var m = dmapFromRows(rows);
    if (!m) return false;
    OMAP = m;
    OWN = OMAP[dmKey(S.mas, S.daf)] || null;
    return true;
  }).catch(function () { return false; });
}

/* ============================================================
   חלקי-הפירוש.
   ------------------------------------------------------------
   קטע גמרא אחד יכול לשאת כמה חלקי-פירוש - בדרך כלל אחד ("פירוש"),
   לפעמים גם "העשרה". כל חלק נושא ביחד את הטקסט שלו, ההקלטה שלו
   (אם הוקלטה והועלתה) והשקף שלו (אם שויך) - לא שלושה מקומות
   נפרדים לתחזק אלא רשומה אחת. `tag` הוא תיוג חופשי, לא מרשימה
   קבועה: לא בכל קטע יש הקדמה או העשרה.

   תאימות לאחור: ערך ישן היה מחרוזת HTML בודדת ("הפירוש שלי").
   כאן היא הופכת לחלק יחיד בשם "פירוש", בלי שום מיגרציה בגיליון -
   מחרוזת נשארת מחרוזת שם, ורק כאן מתפרשת מחדש. */
function ownPiecesFrom_(v) {
  if (!v) return [];
  if (typeof v === 'string') return v ? [{ tag:'פירוש', text:v, slide:'', audio:'' }] : [];
  if (v.length === undefined) return [];   /* __bad וכד' - לא רשימת חלקים */
  return v;
}
function ownPieces_(n) { return ownPiecesIn_(OWN, n); }
/* אותו דבר מתוך רשומה כלשהי (גם זו שנקראה עכשיו מהגיליון). קטע
   שאוחד מציג את החלקים של שני הקטעים ברצף - הקלטה נשארת צמודה
   לחלק שלה, ולכן שתי הקלטות נשמעות זו אחר זו. */
function ownPiecesIn_(rec, n) {
  if (!rec) return [];
  var out = [];
  sidKeys_(rec, n).forEach(function (k) { out = out.concat(ownPiecesFrom_(rec[k])); });
  return out;
}

/* ============================================================
   מזהה קבוע לקטע - ראו stepid.js.
   ============================================================
   `n` נשאר המספר שבו כל הקוד כאן חושב - הוא יציב לאורך טעינה אחת
   של הדף. רק כאן הוא מתורגם למפתח שבגיליון: ברשומה שהוסבה
   (`__ids`) - המזהה של הקטע ואחריו מה שאוחד לתוכו (`also`);
   ברשומה ישנה - המספר, בדיוק כמו פעם.

   רשומה שאין בה עדיין שום מפתח מספרי, בדף שכל קטעיו נושאים מזהה,
   נכתבת מלכתחילה לפי מזהים. דף שלא הוסב נשאר במספרים. */
function vOfN_(n) {
  for (var i = 0; i < FLAT.length; i++) if (FLAT[i].n === n) return FLAT[i];
  return null;
}
function nOfId_(id) {
  for (var i = 0; i < FLAT.length; i++) {
    var v = FLAT[i];
    if (v.id === id || (v.also || []).indexOf(id) >= 0) return v.n;
  }
  return 0;
}
function flatIds_() {
  return FLAT.length > 0 && FLAT.every(function (v) { return !!v.id; });
}
function sidMode_(rec) {
  if (rec && rec.__ids) return true;
  if (rec && typeof rec === 'object') {
    for (var k in rec) if (rec.hasOwnProperty(k) && /^\d+$/.test(k)) return false;
  }
  return flatIds_();
}
function sidKeys_(rec, n) {
  var v = vOfN_(n);
  if (!v || !v.id || !sidMode_(rec)) return [String(n)];
  return [v.id].concat(v.also || []);
}
/* כתיבה לקטע. `fold` - מה שאוחד לתוכו כבר נכלל בערך החדש, ולכן
   המפתחות שלו יורדים (פירוש, שאלות). בלי `fold` הם נשארים - עוגן
   של מצגת שאוחד עובר לקטע הבא, ולא נבלע (ראו slideAt). */
function sidPut_(rec, n, val, fold) {
  var ks = sidKeys_(rec, n);
  if (ks[0] !== String(n)) rec.__ids = 1;
  if (fold) ks.slice(1).forEach(function (k) {
    delete rec[k];
    if (rec.__t) delete rec.__t[k];
  });
  if (val === undefined) delete rec[ks[0]]; else rec[ks[0]] = val;
  return ks[0];
}
function sidTime_(rec, n) {
  var t = rec && rec.__t, best = 0;
  if (!t) return 0;
  sidKeys_(rec, n).forEach(function (k) { best = Math.max(best, +t[k] || 0); });
  return best;
}

/* גרסה קודמת (קומיט 9db4d2e) ציטטה כאן את מילות הגמרא המודגשות
   של הקטע לפני תיבת הכתיבה - `boldOnly(html)` חילצה אותן מתוך
   `st.c.h`. הוסר לבקשתו: הגמרא כבר מסומנת למעלה בדף עצמו, ואין
   טעם להראות אותה פעמיים - "הפירוש לנוער" נטו, בלי ציטוט.
   הקוד לא נמחק, רק לא בשימוש - לחפש `git show 9db4d2e:learn.html`
   ולחפש בו `function boldOnly` אם ירצה לחזור לזה, כאן או בפרויקט
   אחר. */
function chavTabHtml(st) {
  if (!st) return '<span class="cht-lbl">חברותא</span>';
  /* לתלמיד: לא מספיק שיש טקסט לקטע - הדף כולו צריך להיות
     מפורסם (`OWN.__pub`). אחרת קטע שנכתב תוך כדי עבודה היה
     דולף לפני שהדף מוכן. */
  var hasOwn = !!(OWN && OWN.__pub && ownPieces_(st.n).length);
  /* החידה כבר לא לשונית כאן - היא עיגול צף משלה (qfab), שמחליף
     את התוכן של האזור הזה כשלוחצים עליו. ראו quizFabPaint(). */
  if (!SIDE_ADM && !hasOwn) return '<span class="cht-lbl">חברותא</span>';
  return '<button class="' + (CHAV_TAB === 'chav' ? 'on' : '') + '" id="cht-chav">חברותא</button>' +
    '<button class="' + (CHAV_TAB === 'own' ? 'on' : '') + '" id="cht-own">פירוש לנוער</button>';
}
/* כותרת המגירה כשהחידה פתוחה - תופסת את מקום כפתורי חברותא/פירוש
   לנוער (הם עדיין קיימים מתחת, וחוזרים כשסוגרים). רק תווית וסגירה -
   אין כאן מעבר בין כמה חידות, יש תמיד אחת לקטע. */
function quizChdHtml() {
  return '<span class="cht-lbl">חידה</span><button id="cht-x" title="סגירה">✕</button>';
}

/* ============================================================
   פס מצב השמירה.
   ============================================================
   "אני רוצה לדעת שדברים כאלה לא קורים לי יותר." עד עכשיו המצב
   התפזר בין שלוש שורות קטנות בתחתית ("נשמר במכשיר", "לא אומת",
   "נשלח · מאמת"), ושמירה שנדחתה בשקט נראתה כמו כל שורה אחרת. כאן
   פס אחד בראש העריכה, בשלושה צבעים:
     ירוק - הכל בגיליון, אפשר לעבור מכשיר.
     כתום - יש קטעים שעוד לא נשמרו (ומה הם), או שמירה בדרך.
     אדום - השמירה נכשלה. נשאר עד שמצליחה, עם הסיבה ו"נסה שוב".
   `ownMsg` נשאר השער היחיד, ולכן כל ההודעות הקיימות מגיעות לכאן. */
var OWN_FAIL = '', OWN_NOTE = '';
function ownMsg(cls, txt) {
  if (cls === 'bad') { OWN_FAIL = txt; OWN_NOTE = ''; }
  else if (cls === 'ok') { OWN_FAIL = ''; OWN_NOTE = ''; }
  else OWN_NOTE = txt;
  ownBar_();
}
function ownBar_() {
  var b = $('own-bar'); if (!b) return;
  var pend = ownPendingTxt_(), cls, txt, btn = '';
  if (OWN_NEWER) {
    cls = 'bad'; txt = 'יש גרסה חדשה של האתר. מה שכתבת שמור במחשב - רענן את הדף, ואז שמור.';
    btn = '<button onclick="ownReload_()">רענון</button>';
  } else if (OWN_FAIL) {
    cls = 'bad'; txt = '⚠ ' + OWN_FAIL;
    btn = OWN_SAVING ? '' : '<button onclick="ownSaveNow_()">נסה שוב</button>';
  } else if (OWN_SAVING || OWN_NOTE) {
    cls = 'pend'; txt = OWN_NOTE || 'שומר…';
  } else if (pend) {
    cls = 'pend'; txt = pend;
    btn = '<button onclick="ownSaveNow_()">שמירה</button>';
  } else {
    cls = ''; txt = '✓ הכל שמור בגיליון';
  }
  b.className = 'own-bar' + (cls ? ' ' + cls : '');
  b.innerHTML = '<span>' + txt + '</span>' + btn;
}
function ownSaveNow_() {
  if (!OWN_EDIT) return;
  ownEditSync_();
  ownSaveAll(OWN_EDIT_N);
}

/* ============================================================
   דף שנפתח לפני שעלתה גרסה חדשה.
   ============================================================
   כך אבדו קטעים 10-11 בדף ג': הדף היה פתוח מלפני שהשרת התחיל
   לדרוש סיסמה, וכל שמירה ממנו נדחתה. כאן בודקים ברקע (בפתיחה,
   כל חמש דקות, ובחזרה ללשונית) אם `DAF_REV` באתר שונה משלנו -
   ואם כן, השמירה נעצרת ומבקשת רענון. הטקסט כבר בטיוטה במכשיר,
   ולכן הרענון אינו מאבד דבר. בדיקה שנכשלה אינה עוצרת כלום. */
var OWN_NEWER = false, OWN_VER_AT = 0;
function ownVerCheck_() {
  if (OWN_NEWER || !window.DAF_REV || Date.now() - OWN_VER_AT < 60000) return Promise.resolve();
  OWN_VER_AT = Date.now();
  return fetch('data.js?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.text() : ''; })
    .then(function (t) {
      var m = /DAF_REV\s*=\s*'([^']+)'/.exec(t || '');
      if (m && m[1] !== window.DAF_REV) { OWN_NEWER = true; ownBar_(); }
    }).catch(function () {});
}
function ownReload_() { ownCatch_(); location.reload(); }
if (typeof window !== 'undefined') {
  setInterval(ownVerCheck_, 300000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') ownVerCheck_();
  });
  setTimeout(ownVerCheck_, 4000);
}

/* ------------------------------------------------------------
   מאגר העריכה - עותק עבודה של חלקי הקטע שעל המסך, עד שנשמר.
   נטען פעם אחת לקטע (`OWN_EDIT_N`), וכל פעולה (הוספה/מחיקה/
   שיוך שקף/הקלטה) קוראת קודם `ownEditSync_` כדי לא לאבד טקסט
   שכבר הוקלד בתיבות האחרות לפני שהיא מציירת מחדש. `_id` הוא
   מזהה מקומי בלבד (לא נשמר בגיליון) - המפתח שבאמצעותו ההקלטה
   המקומית של החלק נמצאת ב-IndexedDB, גם אם החלק עדיין נטול שם. */
var OWN_EDIT = null, OWN_EDIT_N = 0;
function ownPid_() { return Math.random().toString(36).slice(2, 9); }
/* ============================================================
   ניקוי הפירוש - רק מה שהרכז התכוון אליו.
   ============================================================
   "לפעמים חלק מהמשפטים מופיעים בכתב קטן, והבולד מחליף גופן."
   תיבת עריכה בדפדפן שומרת את מה שהודבק אליה **עם העיצוב של
   המקור**: `<span style="font-size:.82rem; font-family:…">` -
   וזה נשמר לגיליון ומוצג לכל התלמידים. וגם "בולד" של הדפדפן
   יוצא לפעמים כ-span עם עיצוב משלו.

   מה שנשאר: טקסט, מעבר שורה, בולד (<b>), ופסוק (<span
   class="psuk">). כל השאר נפתח - התוכן נשאר, העיצוב הולך. חל
   על מה שמוצג (גם על מה שכבר נשמר), ועל מה שנשמר מעכשיו. */
function ownSan(html) {
  var box = document.createElement('div');
  box.innerHTML = String(html || '');
  var out = function (node) {
    var h = '', i, c, tag, st, inner;
    for (i = 0; i < node.childNodes.length; i++) {
      c = node.childNodes[i];
      if (c.nodeType === 3) { h += esc(c.nodeValue); continue; }
      if (c.nodeType !== 1) continue;
      tag = c.nodeName.toLowerCase();
      inner = out(c);
      st = (c.getAttribute('style') || '').toLowerCase();
      if (tag === 'br') h += '<br>';
      else if (tag === 'b' || tag === 'strong') h += inner ? '<b>' + inner + '</b>' : '';
      else if (tag === 'span' && /(^|\s)psuk(\s|$)/.test(c.className || '')) {
        h += inner ? '<span class="psuk">' + inner + '</span>' : '';
      }
      else if (/font-weight:\s*(bold|[6-9]00)/.test(st)) h += inner ? '<b>' + inner + '</b>' : '';
      else if (tag === 'div' || tag === 'p') h += '<div>' + (inner || '<br>') + '</div>';
      else if (tag === 'script' || tag === 'style') continue;
      else h += inner;                      /* span, font, i, a… - רק התוכן */
    }
    return h;
  };
  return out(box).replace(/&nbsp;/g, ' ');
}
/* הדבקה - טקסט בלבד. העיצוב של המקור הוא בדיוק מה שהקטין את
   הכתב; מה שצריך מודגש מדגישים כאן, בכפתור. */
function ownPaste_(e) {
  var t = (e.clipboardData || window.clipboardData);
  if (!t) return;
  e.preventDefault();
  document.execCommand('insertText', false, t.getData('text/plain') || t.getData('text') || '');
}