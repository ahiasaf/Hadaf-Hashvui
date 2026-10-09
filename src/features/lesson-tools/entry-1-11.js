

function boot() {
  API = (window.APPS_SCRIPT_URL || '').trim();
  try {
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    if (cfg.api) API = cfg.api;
  } catch (e) {}

  try {
    var cz = localStorage.getItem('df:chav-size');
    if (cz !== null) CZ = +cz;
  } catch (e) {}
  chavZoom(0);

  /* בחלון אין "יציאה": אין לאן. הנגיעה שייכת לעמוד המארח,
     שפותח את הדף האמיתי במסך מלא. */
  /* ברירת המחדל - המסך של התלמיד. ראו stuHomeUrl. */
  (function () {
    var u = stuHomeUrl(), b0 = $('back'), h0 = $('to-home');
    if (b0) b0.href = u;
    if (h0) h0.href = u;
  })();
  if (EMB) {
    document.body.className += ' emb';
    var bk = $('back'); if (bk) bk.style.display = 'none';
  }
  /* מי שהגיע מעמוד הצוות חוזר לשם, ולא למסך של תלמיד. הקוד
     אינו נוסע בכתובת - הוא נשמר במכשיר, והלוח שם ייפתח בלעדיו. */
  if (FROM === 'tzevet') {
    var b2 = $('back');
    if (b2) {
      var inst = (/[?&]inst=([^&]*)/.exec(location.search) || [])[1] || '';
      b2.href = location.href.split('#')[0].split('?')[0]
        .replace(/\/learn(\.html)?\/?$/, '/') +
        'tzevet.html' + (inst ? '?inst=' + inst : '') + '#howto';
      var h2 = $('to-home'); if (h2) h2.href = b2.href;
    }
  }

  /* דיווח לימוד משותף שלא אומת עדיין - מנסה שוב בכל פתיחה, בדיוק
     כמו ב-join.html. בלי זה מכשיר שהגיע לכאן ישר מקישור (ולא דרך
     מסך הבית) לא היה מקבל אף הזדמנות נוספת לאמת דיווח שנתקע. */
  if (window.PAIR_UI && !OPEN_OK) PAIR_UI.flush();

  S = pickDaf();
  if (spotJump()) return;
  /* ב. / ב: - היחידה, ולא רק הדף. הקטע האחרון של ב. גולש לראש
     ע״ב, ובלי הסימן "דף ב ע״ב" נראה כאילו כבר עברנו ל-ב:. */
  HEAD = 'מסכת ' + (MAS_NAME[S.mas] || '') + ' · דף ' + S.daf + LAmMark(S.am);
  $('t-daf').textContent = HEAD;
  $('t-sub').textContent = S.week >= 0 ? 'שבוע ' + (S.week + 1) + ' · ' +
    ((calOf(S.mas)[S.week] || [])[1] || '') : '';
  document.title = 'דף ' + S.daf + ' - לימוד אינטראקטיבי';

  /* מי שמשייך יודע לכתוב פירוש גם בדף שעוד אין לו מצגת - "הפירוש
     שלי" יושב במגירת החברותא ולא במגירת המצגת, ולכן הדגל נקבע
     כאן ולא רק בתוך sideInit (שיוצא מיד כשאין DECK). sideInit
     קובע אותו שוב, לאותו ערך בדיוק, כשיש מצגת - בלי סתירה. */
  try { SIDE_ADM = localStorage.getItem('df:admOk') === '1'; } catch (e) {}
  if (quiet()) SIDE_ADM = false;
  document.body.classList.toggle('side-adm', SIDE_ADM);

  /* דף שהרכז עוד לא פתח - ראו "פתיחת דפים" ב-deck.js. הרכז עצמו
     (ומי שמריץ הדגמה) נכנס תמיד: הוא זה שמכין את הדף. */
  if (!OPEN_OK && S.daf) {
    veil('מביא את הדף…', '');
    buttons(false);
    OpenLoad().then(function () {
      OPEN_OK = true;
      if (OpenIs(S.mas, S.daf, S.am)) { boot(); return; }
      if (SIDE_ADM || quiet()) {
        boot();
        if (SIDE_ADM) toast('הדף נעול לתלמידים - פותחים אותו בניהול ← פתיחת דפים');
        return;
      }
      lockShow();
    });
    return;
  }

  /* לא חוסם שום דבר - רק כשהיא מוכנה, אם הדף כבר מצויר, מציירים
     שוב כדי שהלשונית השנייה תופיע למי שצריך לראות אותה. */
  loadOwnMap().then(function () { if (FLAT.length) paintChavArea(); });
  /* אותו דבר לחידות - אחרי ש-SIDE_ADM כבר ידוע, כי paintChavArea
     מחליט לפיו מה להראות (ואם בכלל להראות את הלשונית). */
  loadQuizMap().then(function () { if (FLAT.length) paintChavArea(); });

  veil('מביא את הדף…', 'צורת הדף והסימונים');
  buttons(false);
  /* שלוש המשיכות רצות **במקביל**, ולא בטור.
     קודם `loadLib()` חסם את השאר, ורק כשסיים יצאו הסימונים
     והתמונה לדרך. אבל הסימונים אינם צריכים את המאגר כלל - רק
     `loadGemara` צריך אותו, כדי לדעת אם יש תמונה מוכנה או שצריך
     ללכת לדרייב. ההמתנה המיותרת הזו נוספה לכל פתיחה, והיא דווקא
     הכי כבדה בחיבור איטי: `daf/index.json` נטען "מהרשת קודם" עם
     פסק זמן של 2.5 שניות. */
  var lib = loadLib();
  tick('lib', lib);
  var marks = tick('marks', loadMarks().catch(function () { return 0; }));
  var gem = tick('gemara', lib.then(function () { return loadGemara(); }));
  Promise.all([marks, gem])
    .then(function (res) {
      if (!res[0]) {
        veil('הדף הזה עוד לא הוכן ללימוד קטע-אחר-קטע',
             'אפשר ללמוד אותו כרגיל מצורת הדף ומהחברותא שבעמוד השבוע.', false);
        return;
      }
      return showPage(PAGES[0].daf, PAGES[0].pg).then(function () {
        SHOWN = 0;
        unveil(); buttons(true);
        /* בהדגמה המסך נפתח תמיד באותה צורה - חברותא פתוחה
           ומיקוד דלוק - ולא כפי שהמכשיר הזה מכוון. הדגמה שנראית
           אחרת בכל טלפון אינה הדגמה. */
        if (quiet()) drawer(true);
        else try {
          /* פתוחה כברירת מחדל. מי שנכנס בפעם הראשונה לא ידע
             שיש כאן ביאור - הוא ראה כפתור בשם "חברותא" ולא
             לחץ עליו. מי שסגר אותה נשאר סגור, כי הבחירה
             נשמרת; רק היעדר בחירה נקרא עכשיו כ"פתוחה". */
          if (localStorage.getItem('df:chav') !== '0') drawer(true);
          if (localStorage.getItem('df:dim') === '0') {
            DIM = false; setWhole(true);
            $('whole').classList.add('on');
            $('whole').textContent = 'עם עמעום';
          }
        } catch (e) {}
        if (AT_END && !quiet()) go(FLAT.length - 1);
        /* `amud` שהוא חלק מהיחידה (ב:) אינו קפיצה - הוא כבר מה שעל
           המסך, והחזרה למקום השמור חלה עליו כמו על כל דף. */
        else if (AMUD_Q && !S.am && !quiet() && amudIdx(AMUD_Q) >= 0) go(amudIdx(AMUD_Q));
        else {
          go(0);
          /* קודם המקום המדויק שבמכשיר; אחריו ההתקדמות של השבוע;
             ואם לא חזרנו לשום מקום - הצעה לדף שבו עצר. */
          if (!quiet()) try { if (!spotResume()) { resumePos(); spotOffer(); } } catch (e) {}
        }
        /* אחרי `go(0)`: השיוך נשען על מספרי הקטעים, והם קיימים
           רק אחרי ש-FLAT נבנה. נכשל - הדף ממשיך בדיוק כרגיל.

           ו**אחרי** DeckLoad: הרשימה קובעת כמה שקפים יש ומה
           סדרם, ו-sideInit נשען עליה. בלי ההמתנה המצגת נבנית
           מהקוד ומתחלפת רגע אחר כך מול עיני התלמיד. */
        /* ההדגמה מתחילה **אחרי** sideInit: התסריט פותח את המצגת,
           והכפתור שלה קיים רק משסיים. נכשל משהו בדרך - ההדגמה
           עדיין רצה, בלי המצגת. */
        /* ההדגמה מתחילה ברגע שהדף מוכן - גם בחלון. קודם היא
           המתינה שם ל"צא" מהעמוד המארח, שהחזיק את החלון מוסתר
           עד שהיא תהיה מוכנה; אבל המתנה מוסתרת היא מסך ריק,
           והפגישה הראשונה עם העמוד הייתה שטח לבן. עכשיו החלון
           פתוח מההתחלה, ומי שמסתכל רואה את הדף נטען. */
        var started = function () {
          if (REC) { recPaint(); return; }
          if (DEMO) demoRun();
        };
        DeckLoad()['catch'](function () {}).then(function () {
          try { return sideInit(); } catch (e) {}
        }).then(started, started);
      });
    })
    .catch(function () {
      veil('לא הצלחתי להביא את הדף',
           'צריך חיבור לרשת. נסו שוב בעוד רגע.', false);
    });
}

window.addEventListener('DOMContentLoaded', function () {
  $('next').onclick  = function () {
    /* בסוף הדף, ואחרי שמסך הסיום כבר הוצג פעם אחת, "הבא" ממשיך
       אל הדף הבא ממש - כמו שדפדוף בגמרא ממשיך. דף שטרם סומן יענה
       שם בעצמו שהוא עוד לא מוכן, וזו תשובה ולא מבוי סתום. */
    if (IDX === FLAT.length - 1 && DONE_SEEN) {
      var u = nextDafUrl();
      if (u) { location.href = u; return; }
    }
    go(IDX + 1);
  };
  $('prev').onclick  = goBack;
  /* הקשה על הדף מקדמת - זו התנועה הטבעית, והכפתור נשאר למי
     שמעדיף אותו. */
  /* ---------- הקשה על הדף ----------
     במצב הרגיל היא מקדמת לקטע הבא, כמו תמיד.

     **בלי עמעום** היא עושה משהו אחר: קופצת אל הקטע שנמצא במקום
     שהוקש. שם ממילא רואים את הדף כולו והתלמיד מסתכל סביב, ולכן
     "קדימה" אינו מה שמתבקש - אלא "מה זה שם".

     וזה גם מה שמאפשר לבדוק חלוקה: מקישים על מילה, ואם אין שם
     קטע - נאמר בפירוש. רווח בין קטעים היה עד עכשיו בלתי נראה
     לגמרי: הלימוד פשוט דילג עליו, ואי אפשר היה לדעת אם כך סומן
     או שמשהו אבד בדרך. */
  /* ============================================================
     ההקשה על הדף.

     למטה - הקטע הבא. למעלה - הקטע הקודם. זה לא שרירותי: המיקוד
     יושב במרכז המסך, ומה שנמצא מעליו בדף הוא מה שכבר נלמד. מי
     שרוצה לחזור מקיש שם, במקום שבו הדבר עצמו נמצא.

     גרירה אינה הקשה. בדף המלא אפשר למשוך את הדף, ולכן אצבע שזזה
     יותר מכמה פיקסלים אינה מבקשת להתקדם - היא מזיזה. הסף נמדד
     בפיקסלים ולא בזמן, כי אצבע על מסך זזה תמיד קצת.
     ============================================================ */
  var TAP_BACK = 0.30;              /* החלק העליון של המסך = אחורה */
  var DRAG = null;

  /* ---------- צביטה ----------
     במצב "כל הדף" שתי אצבעות על הבמה מגדילות את הגמרא בלבד
     (ZM, 100%-200%). במיקוד - אין זום: הצביטה פשוט לא עושה כלום.
     צביטה אינה הקשה ואינה גרירה: היא מבטלת את שתיהן, עד שכל
     האצבעות עוזבות. */
  var PTS = {}, PINCH = null;
  var ptsDist = function () {
    var k = Object.keys(PTS);
    if (k.length < 2) return 0;
    var a = PTS[k[0]], b = PTS[k[1]];
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  };
  var ptUp = function (e) {
    delete PTS[e.pointerId];
    if (PINCH && Object.keys(PTS).length < 2) PINCH = null;
  };
  $('stage').addEventListener('pointerdown', function (e) {
    if (!FLAT.length) return;
    PTS[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(PTS).length >= 2) {
      /* במיקוד: לא זום, וגם לא הקשה - שתי אצבעות אינן "הבא". */
      PINCH = DIM ? { off: 1 } : { d0: ptsDist() || 1, z0: ZM };
      DRAG = null;
      return;
    }
    DRAG = { x: e.clientX, y: e.clientY, px: PAN.x, py: PAN.y, moved: 0 };
  });
  $('stage').addEventListener('pointermove', function (e) {
    if (PTS[e.pointerId]) PTS[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (PINCH) {
      e.preventDefault();
      if (PINCH.off) return;
      ZM = Math.max(ZM_MIN, Math.min(ZM_MAX, PINCH.z0 * ptsDist() / PINCH.d0));
      applyView(true);
      return;
    }
    if (!DRAG) return;
    var dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y;
    DRAG.moved = Math.max(DRAG.moved, Math.abs(dx) + Math.abs(dy));
    if (DIM || DRAG.moved < 6) return;      /* במיקוד הדף נעול */
    e.preventDefault();
    PAN.x = DRAG.px + dx; PAN.y = DRAG.py + dy;
    applyView(true);
  });
  var endDrag = function (e) {
    if (!DRAG) return;
    var d = DRAG; DRAG = null;
    if (d.moved >= 6) return;               /* זו הייתה גרירה */
    var r = $('stage').getBoundingClientRect();
    if (!r.height) return;
    if ((e.clientY - r.top) / r.height < TAP_BACK) {
      goBack();
      return;
    }
    go(IDX + 1);
  };
  $('stage').addEventListener('pointerup', function (e) { ptUp(e); endDrag(e); });
  $('stage').addEventListener('pointercancel', function (e) { ptUp(e); DRAG = null; });
  /* אייפון אינו מכבד את user-scalable=no; את הצביטה של הדפדפן
     עוצרים כאן. הבמה מטפלת בצביטה בעצמה, באירועי pointer. */
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  $('chtog').onclick = function () { drawer(!document.body.classList.contains('chav-on')); };
  $('chclose').onclick = function () { drawer(false); };
  $('czm').onclick = function () { chavZoom(-1); };
  $('czp').onclick = function () { chavZoom(1); };
  $('whole').onclick = function () {
    setWhole(DIM);
    if (!DIM) toast('אפשר לגרור את הדף · הקשה מחזירה וממשיכה');
    try { localStorage.setItem('df:dim', DIM ? '1' : '0'); } catch (e) {}
  };
  /* ---------- שער הדף ----------
     נפתח לפני הכל. בכניסה הראשונה הוא ממתין ללחיצה כדי
     שייקרא באמת; אחר כך הוא מתפוגג לבד, ולחיצה מדלגת. */
  gateOpen();

  $('again').onclick = function () { $('done').className = 'sheet'; go(0); };
  /* סוגר בלבד. נשארים על הקטע האחרון, והפס כבר מציע את הדף הבא. */
  $('stay').onclick  = function () { $('done').className = 'sheet'; bar(); };
  document.addEventListener('keydown', function (e) {
    /* מי שכותב - המקלדת שלו. רווח וחיצים בתוך שדה עריכה
       (הפירוש לנוער, תגיות, כל קלט) אינם מזיזים את הדף. */
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' || e.key === ' ') { go(IDX + 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { goBack(); e.preventDefault(); }
  });
  /* חלון ההתמקדות מחושב פעם אחת, מגובה הבמה. בדפדפן נייד הגובה
     הזה **משתנה תוך כדי**: שורת הכתובת נעלמת בגלילה וחוזרת, וגם
     המקלדת והסרגל התחתון מזיזים אותו. `resize` לבדו אינו מספיק -
     שינוי של ה-visual viewport (בדיוק המקרה של שורת הכתובת) אינו
     יורה אותו באייפון, ולעיתים גם לא באנדרואיד.

     `visualViewport` הוא ה-API שנועד למקרה הזה. בלעדיו הבמה
     משתנה והחלון נשאר במידה הישנה - הקטע יוצא ממרכזו ונראה כאילו
     הסימון לא במקום. באפליקציה המותקנת אין שורות כאלה, הגובה
     קבוע, ולכן שם זה מעולם לא נראה. */
  /* ---------- קטיעת ההדגמה ----------
     בשלב הלכידה, כדי שזה יקרה לפני כל שאר המאזינים - אבל בלי
     לבלוע את הנגיעה: מי שהקיש על הדף כדי להתקדם, מתקדם, וגם
     ההדגמה נעצרת באותה תנועה. */
  /* גם במקליט: שם הניגון נקטע באותה נגיעה, והלוח חוזר. */
  if (DEMO || REC) {
    document.addEventListener('pointerdown', demoStop, true);
    document.addEventListener('keydown', demoStop, true);
  }

  /* היציאה. רק במצב 'fin' יש לבועה אצבע, ולכן אין כאן סכנה
     שנגיעה בדף תיפול לכאן. */
  var db = $('dbadge');
  if (db) db.onclick = function () {
    if (db.className.indexOf('fin') >= 0) demoOut();
  };

  var t = null;
  var refocus = function () { clearTimeout(t); t = setTimeout(focus, 120); };
  window.addEventListener('resize', refocus);
  window.addEventListener('orientationchange', refocus);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', refocus);
    window.visualViewport.addEventListener('scroll', refocus);
  }
  boot();
});
