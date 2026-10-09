
function qVerify_(tries, n, want) {
  var res = $('qz-res');
  if (res) res.innerHTML = '<div class="qz-res">נשלח · מאמת מול הגיליון…</div>';
  setTimeout(function () {
    sheetCsv(Q_TAB).then(function (rows) {
      var m = dmapFromRows(rows);
      var mine = m && m[dmKey(S.mas, S.daf)];
      var got = qPiecesIn_(mine || {}, n);
      var r2 = $('qz-res');
      if (JSON.stringify(got) === JSON.stringify(want)) {
        QMAP = m; QOWN = mine;
        toast('נשמר ואומת.');
        /* חוזרים לתצוגת השאלה השמורה - זו ההוכחה שהיא נכתבה,
           ברורה יותר מהודעת טקסט שנעלמת עם הציור הבא. */
        paintChavArea();
        return;
      }
      if (tries < 4) { qVerify_(tries + 1, n, want); return; }
      if (r2) r2.innerHTML = '<div class="qz-res" style="background:rgba(179,38,30,.1)">' +
        '<b>לא אומת.</b> ' + (!m ? 'הגיליון לא נענה, או שלשונית "' + Q_TAB + '" לא נוצרה.'
                                   : 'מה שחזר מהגיליון אינו מה שנשלח.') +
        ' אפשר לנסות שוב.</div>';
    }).catch(function () {
      if (tries < 4) { qVerify_(tries + 1, n, want); return; }
      var r3 = $('qz-res');
      if (r3) r3.innerHTML = '<div class="qz-res" style="background:rgba(179,38,30,.1)">' +
        'לא הצלחתי לקרוא מהגיליון.</div>';
    });
  }, tries ? 2500 : 1400);
}

function markThisDaf() {
  var m = $('done-mark');
  m.style.display = 'none';
  if (typeof LWeek !== 'function') return;

  var wk = LWeek();
  /* הדף שנלמד הוא הדף של השבוע? רק אז זה סימון. ב. וב: - לפי העמוד. */
  if (wk < 0 || wk !== S.week) return;

  var fresh = !LDone(S.mas, wk);
  if (fresh) LMark(S.mas, wk);
  m.textContent = JOIN.markedOk;
  m.style.display = '';
  /* הגיע לסוף הדף - וזה הרגע לשאול עם מי למד.

     **לא רק בפעם ה"טרייה".** `fresh` מסמן רק אם המכשיר הזה
     מסמן קריאה בפעם הראשונה, וזה תקף לנצח ברגע שסומן פעם אחת -
     גם שנה הבאה. מי שהגדיר את הזיווג רק *אחרי* שכבר קרא את הדף
     פעם קודמת (למשל בבדיקה, או תלמיד שחזר וקרא שוב) לא היה
     נשאל לעולם, למרות שהוא ממש עכשיו סיים ללמוד עם ההורה. ask()
     כבר שומר בעצמו על "לא לשאול פעמיים על אותו שבוע" (ראו
     done()/df:pairs ב-pair.js) - אין צורך בעוד שער כאן. */
  if (window.PAIR_UI) PAIR_UI.ask(S.mas, wk);
}

/* תפריט ההקשה הארוכה. `contextmenu` הוא מה שנפתח בלחיצה ארוכה
   באנדרואיד ובלחיצה ימנית במחשב, ובתוכו "הורדת תמונה". נחסם
   על הבמה בלבד - בשאר המסך הוא מועיל ואין סיבה לגעת בו. */
(function () {
  var st = document.getElementById('stage');
  if (!st) return;
  st.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  st.addEventListener('dragstart',   function (e) { e.preventDefault(); });
})();

/* ============================================================
   מצב הדגמה - `?demo=1`, והמקליט - `?rec=1`.
   ============================================================
   הדף מנגן את עצמו לפי תסריט, ואז עוצר ומזמין את מי שמסתכל
   לגעת - כי דף שרץ לבד מראה, ורק אצבע שנוגעת נותנת להרגיש.

   **כל נגיעה מפסיקה אותו.** מיד, ובלי לבלוע את הנגיעה עצמה:
   מי שהקיש כדי להתקדם - התקדם. הדגמה שאי אפשר לקטוע היא מטרד,
   ובכיתה זה בדיוק הרגע שבו רוצים לקחת את השליטה.

   **התסריט אינו כתוב בקוד אלא מוקלט.** קצב נכון הוא דבר שמרגישים
   ולא מחשבים, ואי אפשר להכתיב אותו במילים - לכן `?rec=1` פותח
   מקליט: לוחצים "התחלה", עושים את ההדגמה ביד ובקצב שרוצים, וכל
   לחיצה נשמרת עם הזמן שעבר מקודמתה. מה שהוקלט נשמר על המכשיר
   וגובר על תסריט ברירת המחדל, כך שאפשר לנגן, לתקן ולהקליט שוב
   עד שזה יוצא נכון.

   **ואינם משאירים עקבות.** ההדגמה - וגם ההקלטה - פותחות חברותא,
   פותחות מצגת ומדפדפות, ואת כל אלה המכשיר זוכר בדרך כלל. אצל
   הרכז, שמריץ אותן על הטלפון שלו, זה היה משנה לו את ההגדרות
   ומסמן לו מקום שמור בדף. לכן כל כתיבה נבלמת, וגם השער וההסבר
   של כניסה ראשונה מדולגים - הם היו הופכים את ההדגמה למסך שממתין.
   ============================================================ */
var DEMO = /[?&]demo=1\b/.test(location.search);
var REC  = /[?&]rec=1\b/.test(location.search);
/* מי פתח את ההדגמה. `tzevet` = ר"ם מעמוד הצוות, וזה משנה את
   סופה: לר"ם אין למה להצטרף - הוא זה שיפעיל את זה בכיתה. */
var FROM = (/[?&]from=([\w-]+)/.exec(location.search) || [])[1] || '';
/* ההדגמה רצה בתוך חלון בעמוד אחר - ראו `tzevet.html`. שם היא
   ראווה ולא כלי: אין ממנה לאן לצאת, ואין בה "להצטרפות" - הנגיעה
   בחלון פותחת את הדף האמיתי במסך מלא, וזה מטופל בעמוד המארח. */
var EMB = /[?&]embed=1\b/.test(location.search);

/* ============================================================
   לאן יוצאים - תלמיד חוזר למסך שלו, ולא לעמוד הראשי.
   ============================================================
   "יציאה", "חזרה לתוכנית" ו"לשאלה השבועית" הובילו לשורש האתר,
   בלי `st=1` ובלי הישיבה. משם "להצטרפות לחצו" פתח את הרשמת
   הצוות, ותלמיד נרשם כאיש צוות בטעות - ונחת בתור האימות.
   ההגנה שבראש index.html תופסת רק מכשיר שכבר שמור בו תלמיד,
   ולכן תלמיד בדפדפן נקי עבר דרכה.

   עכשיו: מכשיר שאין בו סימן של צוות (ניהול, ראש מוסד, ר"ם)
   יוצא אל join.html עם הישיבה, והשאלה השבועית נפתחת עם `st=1`
   - כך שגם "חזרה" משם מחזירה אותו למסך שלו. מכשיר צוות ממשיך
   כמו קודם. הישיבה: מהכתובת, ואם אין - מההרשמה שבמכשיר. */
function staffDev() {
  try {
    if (localStorage.getItem('df:admOk') === '1') return true;
    if (localStorage.getItem('df:head') || localStorage.getItem('df:headSeen') === '1') return true;
    if (localStorage.getItem('df:ram')) return true;
    /* אותם סימנים כמו `staffSign` ב-index.html - ישיבה רשומה ולוח
       הם של צוות. בלעדיהם רכז נחשב כאן לתלמיד או להורה. */
    if (localStorage.getItem('dfReg') || localStorage.getItem('df:dfBoard')) return true;
  } catch (e) {}
  return false;
}
function stuInst() {
  var m = /[?&]inst=([^&#]*)/.exec(location.search);
  if (m && m[1]) return m[1];
  try {
    var me = JSON.parse(localStorage.getItem('df:me') || 'null');
    if (me && me.inst) return encodeURIComponent(me.inst);
  } catch (e) {}
  return '';
}
/* **הורה חוזר כהורה.** "יציאה" החזירה ל-`join.html?inst=…` בלי
   `for=dad`, ו-memo() ב-join מוחק את סימון ההורה בכל כתובת עם
   פרמטרים - ואבא נחת במסך של בן. עכשיו הסימון נוסע איתו: מהכתובת,
   מההרשמה שבמכשיר (role), או מהזיכרון של קישור ההורים. */
function stuDad() {
  if (/[?&]for=dad\b/.test(location.search)) return true;
  try {
    var me = JSON.parse(localStorage.getItem('df:me') || 'null');
    if (me && me.role) return me.role === 'dad';
    return localStorage.getItem('df:forDad') === '1';
  } catch (e) { return false; }
}
function stuHomeUrl() {
  /* מי שנכנס מהמסך הראשי חוזר אליו - הכתובת יודעת, המכשיר מנחש. */
  if (FROM === 'home' || staffDev()) return './';
  var i = stuInst(), q = [];
  if (i) q.push('inst=' + i);
  if (stuDad()) q.push('for=dad');
  return 'join.html' + (q.length ? '?' + q.join('&') : '');
}
function stuQuizUrl(key) {
  if (FROM === 'home' || staffDev()) return './#quiz=' + key;
  var i = stuInst();
  return 'index.html?st=1' + (i ? '&inst=' + i : '') + '#quiz=' + key;
}
/* מה שעובר מדף לדף - הישיבה ומי פתח - כדי שהיציאה מהדף הבא
   תדע לאן לחזור גם בדפדפן שאין בו הרשמה. */
function keepQ() {
  var i = (/[?&]inst=([^&#]*)/.exec(location.search) || [])[1] || '';
  return (i ? '&inst=' + i : '') + (FROM ? '&from=' + FROM : '') +
         (/[?&]for=dad\b/.test(location.search) ? '&for=dad' : '') + '&hop=1';
}
var DEMO_T = null;

/* "בלי עקבות ובלי מסכים שממתינים" - נכון לניגון ולהקלטה כאחד,
   ומפסיק לחול ברגע שההדגמה נמסרה לידיים. */
function quiet() { return DEMO || REC; }

/* ---------- התסריט ----------
   כל צעד: [כמה להמתין לפני שהוא קורה, מה לעשות, ערך].

   זה אינו תסריט שנכתב אלא **תסריט שהוקלט** - אחיאסף עשה את
   ההדגמה ביד ב-`?rec=1`, וזה מה שיצא. לכן יש בו דברים ששום
   כותב לא היה מכניס וטוב שהם שם: הוא מתקדם ארבעה קטעים, ואז
   מדפדף אחורה במהירות עד להתחלה - וזה מראה בשנייה אחת שאפשר
   לחזור - ורק אז פותח את המצגת ומתקדם איתה.

   מה שמוקלט על המכשיר גובר על זה, וכך אפשר לשנות בלי לגעת בקוד. */
/* התסריט של אחיאסף (29.9): נפתח על המצגת, מתקדם שלושה קטעים
   כשהשקף לצד הפירוש, סוגר אותה וממשיך עוד שניים בפירוש בלבד.
   איטי מהקודם בכוונה - "הרגשתי שזה מהיר מדי". הקודם:
   [2119,'go',1],[1034,'go',2],[1154,'go',3],[825,'go',2],[136,'go',1],
   [154,'go',0],[1087,'deck'],[1436,'go',1],[1275,'go',2],[1293,'go',3],
   [1516,'invite'] */
var DEMO_DEF = [
  [143,'deck'],
  [1645,'go',1], [1733,'go',2], [1795,'go',3],
  [1892,'deck'],
  [127,'go',4], [1707,'go',5],
  [1489,'invite']
];
var SCRIPT_KEY = 'df:demoScript';

function scriptSaved() {
  try {
    var raw = localStorage.getItem(SCRIPT_KEY);
    var a = raw ? JSON.parse(raw) : null;
    return (a && a.length) ? a : null;
  } catch (e) { return null; }
}
/* ההקלטה נשמרת גם במצב שבו כל שאר הכתיבות חסומות: היא אינה
   "הגדרה שנדבקה" אלא בדיוק מה שביקשו לשמור. */
function scriptSave(a) {
  try { localStorage.setItem(SCRIPT_KEY, JSON.stringify(a)); } catch (e) {}
}
function scriptClear() {
  try { localStorage.removeItem(SCRIPT_KEY); } catch (e) {}
}

/* ---------- ניגון ---------- */
function demoRun(script) {
  var steps = script || scriptSaved() || DEMO_DEF;
  var i = 0;
  var step = function () {
    if (!DEMO) return;
    var b = steps[i++];
    if (!b) return;
    /* הצעד מודיע מתי הוא נגמר, ולא מניחים שהוא מיידי: פתיחת
       המצגת ממתינה לשקף, והתסריט ממתין איתה. */
    DEMO_T = setTimeout(function () { demoAct(b[1], b[2], step); }, b[0]);
  };
  var begin = function () {
    bubble('run');
    /* בחלון - העמוד המארח שומע שההדגמה באמת התחילה. לפי זה מסך
       הפתיחה של ההצטרפות מחליט אם להציג אותה או לוותר (ראו
       intro ב-join.html). */
    if (EMB) { try { parent.postMessage('daf-demo-start', '*'); } catch (e) {} }
    step();
  };
  /* **תסריט שנפתח על המצגת - היא פתוחה כבר כשההדגמה מתחילה.**
     אחרת רואים לרגע את הדף בלי המצגת, ואז היא "קופצת" - "יש דיליי
     של חלקיק שנייה שבו המצגת עולה". כאן הצעד הראשון נעשה לפני
     האות להתחלה, ומסך הפתיחה (join.html) חושף את החלון רק אחריו. */
  if (steps[0] && steps[0][1] === 'deck' && steps[0][0] < 500) {
    i = 1;
    demoDeck(begin);
    return;
  }
  begin();
}
/* פעולה אחת מהתסריט. אותם שמות שהמקליט רושם, ולכן אין כאן
   טבלת תרגום שאפשר לשכוח לעדכן. */
function demoAct(a, v, done) {
  done = done || function () {};
  if (a === 'deck') { demoDeck(done); return; }   /* הוא מודיע בעצמו */
  if (a === 'go')          go(v);
  else if (a === 'next')   go(IDX + 1);
  else if (a === 'prev')   go(IDX - 1);
  else if (a === 'chav')   drawer(!document.body.classList.contains('chav-on'));
  else if (a === 'whole')  setWhole(DIM);
  else if (a === 'zoom')   chavZoom(v);
  else if (a === 'invite') demoInvite();
  done();
}
/* המצגת נפתחת רק אם באמת יש אחת לדף הזה. הכפתור מוסתר עד
   ש-sideInit יודע שיש שיוך, וזו הבדיקה הזולה והנכונה.

   **וכאן, בשונה מהדף עצמו, היא ממתינה לשקף.** בהדגמה אין אדם
   שלחץ ומחכה לעצמו - יש צופה, והוא רואה מעבר אחד חלק במקום
   תיבה שנפתחת ריקה ומתמלאת. בדף האמיתי זה הפוך בדיוק: מי שלחץ
   חייב לראות תגובה מיד, אחרת הוא חושב שהכפתור לא עבד ולוחץ שוב.

   תקרה של שתי שניות: אחריה זה נפתח בלי השקף. הדגמה שנתקעת
   גרועה משקף שמאחר. בפועל זה כמעט לעולם לא יקרה - המצגת
   נפתחת בתסריט אחרי כתשע שניות, והשקפים מובאים מהרגע הראשון. */
function demoDeck(done) {
  done = done || function () {};
  var b = $('dktog');
  if (!b || b.style.display === 'none') { done(); return; }
  if (document.body.classList.contains('side-on')) {
    sideOpen(false); done(); return;             /* סגירה - אין למה להמתין */
  }
  var n = slideAt(IDX), im = slidePre(n), fired = false, t = 0;
  var open = function () {
    if (fired || !DEMO) return;
    fired = true;
    clearTimeout(t);
    sideOpen(true);
    done();
  };
  if (slideReady(n)) { open(); return; }
  t = setTimeout(open, 2000);
  if (im) im.onload = function () { slidePre(n + 1); open(); };
}
/* ---------- הבועה ----------
   'run' - רצה לבד · 'ask' - נגמרה ומזמינה לנסות · 'fin' - ההזמנה
   להצטרף · '' - אין הדגמה.

   מצב אחד בכל רגע ובאותו מקום, והמעבר ביניהם רך: הבועה נדעכת
   לרגע, מתחלפת, וחוזרת - במקום להחליף תוכן מול העין. */
var BUB = null;
function bubble(mode) {
  var el = $('dbadge');
  if (!el) return;
  /* ============================================================
     בחלון ההדגמה - התגית בלבד.
     ============================================================
     היא הורדה משם לגמרי, בהנחה שהעמוד סביבה כבר אומר שזו
     הדגמה. אבל מי שמסתכל על הדף עצמו אינו מסתכל על העמוד, וצריך
     לדעת שמה שרץ מולו אינו הדף האמיתי שלו. היא חזרה, **קטנה
     יותר** - בחלון של 350 פיקסלים הגודל המלא כיסה שליש מהרוחב.

     ורק היא: "נסו בעצמכם" ועיגול הסיום מובילים למקום אחר, ובתוך
     חלון קטן הם הבטחה מבלבלת. */
  if (EMB && mode !== 'run') { el.className = 'dbadge'; return; }
  var t = window.PLAY || {};
  var end = FROM === 'tzevet' ? (t.finTeam || 'איך עושים זאת? ←')
                              : (t.fin || 'להצטרפות!');
  /* בחלון אין שלב שלישי: כל החלון הוא הכפתור, ועיגול שמוביל
     למקום אחר בתוך חלון של 350 פיקסלים הוא הבטחה מבלבלת. */
  if (EMB && mode === 'fin') return;
  var fill = function () {
    if (mode === 'run')      { el.textContent = t.tag || 'הדגמה';       el.className = 'dbadge on'; }
    else if (mode === 'ask') { el.textContent = t.ask || 'נסו בעצמכם!'; el.className = 'dbadge on ask'; }
    else if (mode === 'fin') { el.textContent = end;                    el.className = 'dbadge on fin'; }
    else                     { el.textContent = '';                     el.className = 'dbadge'; }
  };
  clearTimeout(BUB);
  /* אין ממה לדעוך כשהיא כבויה - אז פשוט נדלקת */
  if (el.className.indexOf('on') < 0) { fill(); return; }
  el.className += ' swap';
  BUB = setTimeout(function () {
    fill();
    /* פריים אחרי ההחלפה. באותו פריים הדפדפן מאחד את שתי השורות
       ולא מצייר את הדעיכה בכלל. */
    setTimeout(function () {
      el.className = el.className.replace(/\s*swap/, '');
    }, 20);
  }, 260);
}

/* לאן יוצאים - ושתי תשובות, לפי מי צופה.

   **תלמיד** מגיע למסך ההצטרפות, ו-`go=1` נוחת ישר בתוך הטופס
   ולא במסך הפתיחה: מי שראה את הדף עובד וסיים לשחק הוא בדיוק
   מי שכדאי לשאול עכשיו אם הוא בפנים.

   **ר"ם שפתח מעמוד הצוות** אינו מצטרף לשום דבר - הוא זה
   שיפעיל את זה בכיתה. הוא חוזר לעמוד שממנו בא, אל ההנחיות,
   כי זו בדיוק השאלה שנשאלת אחרי שרואים את הדף עובד.

   הקוד אינו נוסע בכתובת - הוא נשמר במכשיר. כתובת עם קוד גלוי
   על מקרן בכיתה היא בדיוק הדרך שבה קישור הלוח דולף.

   `learn.html` יושב לצד שניהם, ולכן הכתובת נבנית מאותו בסיס -
   בייצור אין סיומות, וקוד שחותך `.html` מהכתובת נשבר שם. */
function demoOut() {
  if (REC) return;              /* במקליט אין לאן ללכת - עוד מכוונים */
  var base = location.href.split('#')[0].split('?')[0]
    .replace(/\/learn(\.html)?\/?$/, '/');
  var inst = (/[?&]inst=([^&]*)/.exec(location.search) || [])[1] || '';
  var u = FROM === 'tzevet'
    ? base + 'tzevet.html' + (inst ? '?inst=' + inst : '') + '#howto'
    : base + 'join.html?go=1';
  /* דעיכה ואז מעבר. קפיצה חדה בין שני עמודים היא הרגע שבו
     נאבד מי שכבר החליט, ושליש שנייה קונה את הרצף. */
  document.body.className += ' leaving';
  setTimeout(function () { location.href = u; }, 320);
}

/* ---------- הסוף ----------
   נקודה אחת לשתי הדרכים שבהן הדגמה נגמרת: התסריט הגיע לסופו,
   או שמישהו נגע באמצע. משם והלאה הרצף זהה, ולכן גם הקוד.

   ומרגע זה `DEMO` כבוי: הדף חזר להיות דף רגיל - נשמר בו מקום,
   נשמרות בו הגדרות - והבועה היא כל מה שנשאר מההדגמה.

   ההזמנה להצטרף באה מעצמה אחרי שלוש שניות ואינה ממתינה לנגיעה:
   מי שראה את הדף עובד הוא בדיוק מי שכדאי לשאול עכשיו. */
var JOIN_AFTER = 3000;
function demoEnd() {
  clearTimeout(DEMO_T);
  DEMO = false;
  /* בחלון ההדגמה זה פשוט נעצר. "נסו בעצמכם" ו"להצטרפות" שייכים
     למסך מלא, שבו אפשר באמת לנסות ובאמת להצטרף; בחלון של 350
     פיקסלים הם מזמינים למשהו שלא קורה שם. במקומם - העמוד
     המארח לוקח את הפוקוס אל ההנחיות. */
  if (EMB) {
    bubble('');
    try { parent.postMessage('daf-demo-done', '*'); } catch (e) {}
    return;
  }
  bubble('ask');
  DEMO_T = setTimeout(function () {
    bubble('fin');
    /* במקליט הלוח חוזר ברגע שהרצף נגמר - הוא כבר ראה את הסוף
       כמו שהוא, וממשיך לתקן. הבועה עצמה נשארת, ובמקליט לחיצה
       עליה אינה מוציאה מהעמוד. */
    if (REC) recPaint();
  }, JOIN_AFTER);
}
function demoInvite() { demoEnd(); }              /* הצעד האחרון בתסריט */
function demoStop()   { if (DEMO) demoEnd(); }    /* נגיעה באמצע */

/* ============================================================
   המקליט.
   ============================================================
   הוא אינו מקליט נגיעות אלא **תוצאות**: `go`, `drawer`, `sideOpen`
   ו-setWhole מדווחים כאן בעצמם. לכן אין חשיבות לשאלה אם הקטע
   התחלף מהקשה על הדף, מהכפתור או מהמקלדת - ומה שהוקלט הוא מה
   שהעין ראתה, לא איך שהאצבע הגיעה לשם.

   ההזמנה אינה "מה שקורה כשמפסיקים להקליט" אלא כפתור משלה. זמן
   החיפוש של כפתור העצירה אינו חלק מההדגמה, ולכן הוא אינו נכנס
   לתסריט.
   ============================================================ */
var RECS = { on:false, t:0, steps:null };

function recStep(a, v) {
  if (!RECS.on) return;
  var now = Date.now();
  RECS.steps.push([now - RECS.t, a, v]);
  RECS.t = now;
  recPaint();
}
function recStart() {
  RECS.on = true; RECS.t = Date.now(); RECS.steps = [];
  recPaint();
}
/* סיום = ההזמנה. הלחיצה הזו היא הצעד האחרון בתסריט, ובאותו
   רגע ההשהיה שלפניה כבר נמדדה. */
function recEnd() {
  if (!RECS.on) return;
  recStep('invite');
  RECS.on = false;
  scriptSave(RECS.steps);
  recPaint();
}
function recPlay() {
  var a = RECS.steps || scriptSaved();
  if (!a || !a.length) return;
  /* ניגון מתחיל תמיד מאותה נקודה שממנה הוקלט */
  DEMO = true;
  drawer(true);
  if (document.body.classList.contains('side-on')) sideOpen(false);
  bubble('');
  go(0);
  recPaint();
  demoRun(a);
}
function recWipe() {
  scriptClear();
  RECS = { on:false, t:0, steps:null };
  recPaint();
}