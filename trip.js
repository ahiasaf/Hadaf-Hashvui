/* ============================================================
   המסע — מלווה בתוך האפליקציה האמיתית.
   ============================================================
   "להעביר אותם מסע בתוך האפליקציה האמיתית... מדריך שמסיע
   אותך ואומר לך למה ללחוץ ברחל בתך הקטנה."

   ------------------------------------------------------------
   למה רצועה ולא באנר מרחף

   "יש פה מכשול אחד שיכול לקרות: בגלל שאתה שם מעל באנר מרחף
   של הסבר, הוא עלול לכסות דברים."

   נכון, וזו הסיבה שהרצועה כאן **תופסת מקום משלה**: היא קבועה
   בראש החלון, והעמוד מקבל ריפוד בגובהה. מה שמתחתיה מתחיל
   מתחתיה — ולכן אין שום מצב שבו היא מסתירה את הכפתור שעליו
   היא מדברת. זה גם מה שנותן את התחושה שביקשת: "אזור של
   השלבים, ומתחת לזה האפליקציה".

   ------------------------------------------------------------
   שני סוגי שלבים

   **משימה** נגמרת כשהיא באמת נעשתה — `done()` בודק את מצב
   המכשיר, ולא לחיצה על כפתור מסוים. כפתור שיזוז מחר, או מסך
   שייבנה מחדש, לא ישברו את המסע.

   **היכרות** נגמרת כשהוא לוחץ "הבא". אלה השלבים שבהם הוא
   מקבל ולא עושה.

   ------------------------------------------------------------
   והוא נוסע בין העמודים

   המסע עובר דרך index, join, tzevet ו-learn — קבצים נפרדים.
   המצב נשמר במכשיר, וכל עמוד שטוען את הקובץ הזה מצייר את
   אותה רצועה עם אותו שלב. מי שנוסע למסך אחר אינו "יוצא
   מהמדריך" בלי לשים לב.

   נדלק רק דרך `?masa=1` — הקישור שאחיאסף שולח. מי שנכנס
   לאפליקציה כרגיל אינו רואה דבר. ES5 בלבד.
   ============================================================ */
var TRIP_UI = (function () {

  var KEY = 'df:trip';
  var st = null;            /* { i:<שלב>, hail:<בברכה> } */
  var aimed = '';           /* השלב שכבר הצבענו עליו */
  var watch = null, asked = false;

  function $(id) { return document.getElementById(id); }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function t(k) { return (window.TRIP && TRIP[k]) || ''; }
  function fill(s, v) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return v[k] != null ? v[k] : m;
    });
  }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  /* שורש האפליקציה. `cleanUrls` מגיש בלי סיומת, ולכן שתי
     הצורות נחתכות — ראו את האזהרה ב-CLAUDE.md. */
  function home() {
    return location.href.split('#')[0].split('?')[0]
      .replace(/\/(index|join|tzevet|board|learn)(\.html)?\/?$/, '/');
  }

  /* ---------- המצב ---------- */
  function load() {
    try { return JSON.parse(ls(KEY) || 'null'); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function on() { return !!st; }

  /* ============================================================
     אזור הניהול — פותחים אותו אם אנחנו בעמוד שיש בו כזה.
     ============================================================
     ובלי לנווט: מי שעומד בעמוד הצוות או בלוח נמצא שם בכוונה,
     ורצועה שחוטפת אותו משם בחזרה לעמוד הראשי גרועה מרצועה
     שאומרת את ההוראה ואינה מסמנת. היחיד שכן מנווט הוא שלב
     ההתקנה — שם אין מה לעשות בעמוד אחר.
     ============================================================ */
  function toPanel() {
    if (typeof show === 'function' && typeof myInstRow === 'function' &&
        myInstRow()) show('my');
  }

  /* ============================================================
     השלבים.
     ============================================================
     `done` קיים = משימה, והוא נבדק מול מצב המכשיר. אין `done`
     = היכרות, שנגמרת ב"הבא".

     `go` הוא מה שמחזיר אותו למקום הנכון כשהוא מגיע לשלב
     בעמוד אחר — לא קפיצה בכוח, אלא קישור שהוא לוחץ.
     ============================================================ */
  var STEPS = [
    /* ============================================================
       מתחילים בהוראה, לא בהיכרות.
       ============================================================
       "מדריך מתחיל במין אמירה כללית — בוא תסתכל על העמוד
       הראשי? לא, ממש לא. המדריך פרקטי."

       ולכן אין כאן שלב פתיחה. השלב הראשון הוא כפתור שצריך
       ללחוץ עליו, והמסך נוסע אליו.
       ============================================================ */
    { k:'s1', sel:'#cta-top .btn, #cta .btn',
      /* ============================================================
         נגמר כשהטופס נפתח, לא כשההרשמה נשלחה.
         ============================================================
         קודם השלב הזה החזיק עד סוף ההרשמה, ולכן מילוי הטופס —
         ישיבה, מסכת, וכמה גמרות — קרה בלי מילה אחת של הדרכה.
         מי שהגיע לשם ראה רצועה שעדיין אומרת "לחצו כדי להצטרף",
         והכפתור שהיא מדברת עליו כבר היה מאחוריו.
         ============================================================ */
      done:function () {
        return !!ls('dfReg') || !!document.querySelector('#v-reg.on');
      } },
    /* ---- והטופס עצמו, עם הכפתור שמסיים אותו ---- */
    { k:'s1f', sel:'#r-send',
      enter:function () {
        if (typeof show === 'function' && !document.querySelector('#v-reg.on')) {
          show('reg');
        }
      },
      done:function () { return !!ls('dfReg'); } },
    { k:'s2', sel:'.thx-go',
      done:function () { return ls('df:ramsWa') === '1'; } },
    /* ============================================================
       ולא "לחצו על אזור הניהול" — ישר אל הכפתור עצמו.
       ============================================================
       "בוא נדלג על הכל ונשים אותו ישר במסך שבו רשום 'אנחנו
       רוצים לאפשר לך להיות מעודכן', ותכוון אותו לכפתור 'אני
       רוצה לקבל עדכונים'."

       `enter` הוא מה שפותח את המסך הזה בעצמנו. מדריך שמבקש
       לפתוח שלוש דלתות כדי להגיע להוראה הוא שלושה מקומות
       לאבד בהם אנשים.
       ============================================================ */
    { k:'s3', sel:'#r-go, #r-note, #r-next', hail:'s3done',
      /* ============================================================
         בזמן שהאשף פתוח הרצועה מפנה אליו, ולא מצביעה בעצמה.
         ============================================================
         "כשהוא לוחץ על 'אני רוצה לקבל עדכונים' הוא מתקדם לשלבים
         הבאים, אבל למעלה עדיין נשאר אותו כפתור. רק לכתוב למעלה
         'עקבו אחרי ההוראות למטה'."

         מד השלבים של האשף הוא הסימן שהוא בפנים: הוא מצויר רק
         משלב 1 והלאה, ולא במסך שמציע להתחיל.
         ============================================================ */
      busy:function () { return !!document.querySelector('#as-body .as-bar'); },
      enter:function () {
        /* המסך הזה חי בעמוד הראשי בלבד. מי שעומד בעמוד אחר
           כשהשלב מתחיל מקבל הוראה שמצביעה על כפתור שאינו
           שם — ולכן מחזירים אותו, ולא משאירים אותו תוהה. */
        if (typeof show === 'function' && typeof myInstRow === 'function') {
          if (myInstRow()) show('my');
          return;
        }
        location.href = home() + '?masa=1';
      },
      done:function () {
        return !!(window.APPX && APPX.installed && APPX.installed());
      } },
    /* ---- ומכאן המתנות. בכל אחת יש מה לנסות. ----
       גם להן `enter`: שתיים מהן חיות באזור הניהול והשלישית
       בעמוד הראשי, ומי שמגיע אליהן ממסך אחר — בסיור, או אחרי
       שנדד בעצמו — היה מקבל הוראה שמצביעה על כלום. */
    { k:'s4', sel:'#my-brd .brd',  enter:toPanel },
    { k:'s5', sel:'#my-say .mycard', enter:toPanel },
    { k:'s6', sel:'#stage .acts .go, #stage',
      enter:function () { if (typeof show === 'function') show('home'); } },
    { k:'s7', fin:1 }
  ];

  function step() { return STEPS[Math.max(0, Math.min(st.i, STEPS.length - 1))]; }
  /* מה שמצויר עכשיו: שלב, ברכה, ומסירת ההוראות לאשף. הרצועה
     מצוירת מחדש כשזה משתנה, ולא בכל פעימה. */
  function mode() {
    var s = step();
    return st.i + ':' + (st.hail ? 'h' : '') +
           ':' + (!st.hail && s.busy && s.busy() ? 'b' : '');
  }

  /* ---------- העיצוב ----------
     נטען פעם אחת, ומגיע מכאן ולא מהעמוד: עמוד חדש שירצה את
     המסע צריך שורת <script> אחת, ואין מה לשכוח להעתיק. */
  /* ============================================================
     העיצוב — בהיר, כמו המדריך המאויר.
     ============================================================
     "במדריך שתלמיד מקבל התצוגה בהירה. עכשיו יצרת רקע כחול —
     וגם ככה האפליקציה כחולה, אז זה רק מוסיף עומס. זה אמור
     לייצר מסגרת בהירה שתפספס אותך ותגיד: הנה, ההתרחשות
     קורית למטה. זה רק מדריך."

     ולכן אותה שפה בדיוק של `as-card` שבמסך ההתקנה: נייר,
     מסגרת זהב, פינות עגולות. המדריך אינו התוכן — הוא המסגרת
     סביבו, והעין צריכה לעבור דרכו אל האפליקציה.
     ============================================================ */
  function css() {
    if ($('trip-css')) return;
    var s = document.createElement('style');
    s.id = 'trip-css';
    s.textContent = [
      '#trip{position:fixed;inset-inline:0;top:0;z-index:70;',
      '  background:var(--surface,#FFFDF8);color:var(--ink,#1B2A45);',
      '  border-bottom:2px solid var(--gold,#C08F2B);',
      '  box-shadow:0 4px 16px rgba(37,29,12,.10);',
      '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
      '  padding:calc(9px + env(safe-area-inset-top,0px)) 14px 10px}',
      '#trip .in{max-width:34rem;margin:0 auto}',
      /* מד השלבים — אותה שפה של מסך ההתקנה */
      '#trip .bars{display:flex;gap:5px;justify-content:center;margin-bottom:7px}',
      '#trip .bars i{height:4px;border-radius:2px;flex:1;max-width:38px;',
      '  background:var(--rule,#E5DAC3)}',
      '#trip .bars i.did{background:var(--green,#6FA83B)}',
      '#trip .bars i.on{background:var(--gold,#C08F2B)}',
      '#trip .row{display:flex;align-items:center;gap:10px}',
      '#trip .txt{flex:1;min-width:0}',
      '#trip .n{font-size:.65rem;font-weight:800;letter-spacing:.08em;',
      '  color:var(--gold-t,#8C681F)}',
      '#trip b{display:block;font-size:.97rem;font-weight:800;',
      '  letter-spacing:-.02em;line-height:1.3;margin-top:1px;',
      '  color:var(--blue-d,#0B2550)}',
      '#trip span.s{display:block;font-size:.77rem;font-weight:600;',
      '  color:var(--ink-3,#5C687E);line-height:1.45;margin-top:2px}',
      '#trip .go{flex:none;border:0;border-radius:10px;',
      '  background:var(--blue,#17468F);color:#fff;font:inherit;font-size:.85rem;',
      '  font-weight:800;padding:10px 16px;cursor:pointer}',
      '#trip .x{flex:none;border:0;background:none;color:var(--ink-3,#5C687E);',
      '  font:inherit;font-size:1.05rem;font-weight:700;cursor:pointer;',
      '  padding:4px 6px;line-height:1}',
      /* הברכה — רגע אחד. ירוק רך על נייר, ולא מסך שמתהפך. */
      '#trip.hail{border-bottom-color:var(--green-d,#467B1A)}',
      '#trip.hail b{color:var(--green-2,#3A6615)}',
      '#trip.hail .n{color:var(--green-d,#467B1A)}',
      /* ============================================================
         הסימון — מסגרת שנדלקת ונעלמת.
         ============================================================
         "בדיוק כמו במסך של הר"מים: ברגע שזה יורד להנחיות מופיע
         פס שמיד אחרי זה נעלם. מסגרת שנעלמת די מהר."

         זה `#howto.lit` שבעמוד הצוות, אות באות. לא טבעת זוהרת
         שנשארת ולא החשכה — "אנשים רוצים מראה מלא". */
      '@keyframes tripPulse{0%,100%{box-shadow:0 0 0 4px rgba(229,184,84,.55)}',
      '  50%{box-shadow:0 0 0 8px rgba(229,184,84,.16)}}',
      '.trip-lit{border-radius:var(--r,16px);',
      '  animation:tripPulse 1.9s ease-in-out infinite}',
      '@media (prefers-reduced-motion:reduce){',
      '  .trip-lit{animation:none;box-shadow:0 0 0 4px rgba(229,184,84,.55)}}',
      /* המזערה של הכפתור, בתוך הרצועה */
      '#trip .mini{display:inline-flex;align-items:center;gap:5px;',
      '  margin-top:5px;padding:5px 11px;border-radius:9px;',
      '  font-size:.8rem;font-weight:800;max-width:100%;',
      '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#trip .mini{box-shadow:0 1px 3px rgba(37,29,12,.18)}',
      '.trip-aim{scroll-margin-top:var(--trip-h,120px)}',
      /* השאלה למי שחזר באמצע */
      '#trip-ask{position:fixed;inset:0;z-index:160;display:flex;',
      '  align-items:center;justify-content:center;padding:22px;',
      '  background:rgba(11,37,80,.45)}',
      '#trip-ask .box{background:var(--surface,#FFFDF8);color:var(--ink,#1B2A45);',
      '  border-radius:16px;padding:22px 20px;max-width:21rem;width:100%;',
      '  text-align:center;box-shadow:0 12px 40px rgba(11,37,80,.3)}',
      '#trip-ask h3{margin:0;font-size:1.1rem;font-weight:800}',
      '#trip-ask p{margin:8px 0 16px;font-size:.9rem;font-weight:600;',
      '  color:var(--ink-2,#5A6780);line-height:1.55}',
      '#trip-ask button{width:100%;border:0;border-radius:11px;font:inherit;',
      '  font-size:.95rem;font-weight:800;padding:13px;cursor:pointer;',
      '  background:var(--blue,#17468F);color:#fff}',
      '#trip-ask button.alt{background:none;color:var(--ink-3,#5C687E);',
      '  margin-top:6px;font-size:.85rem}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
     ההצבעה — מניעים את המסך אל ההוראה.
     ============================================================
     "אם הוא נותן הוראה הוא שם אותך על ההוראה."

     מדריך שאומר "לחצו על כפתור ההצטרפות" ומשאיר אותך לחפש
     אותו הוא מדריך שקוראים ולא מבצעים. כאן המסך נוסע אל
     הכפתור, והמסגרת נדלקת עליו לשתי שניות ונעלמת.

     יעד שאינו על המסך פשוט אינו מסומן — ההוראה לבדה עדיין
     נכונה, ומדריך שנתקע על אלמנט חסר גרוע ממדריך ששותק.
     ============================================================ */
  /* העתק מוקטן של היעד. `''` כשאין יעד על המסך — ורצועה בלי
     מזערה עדיין נכונה, כי ההוראה נאמרת גם במילים. */
  function miniOf(sel) {
    var el = document.querySelector(sel);
    if (!el || !el.offsetParent) return '';
    var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || txt.length > 34) return '';
    var c = getComputedStyle(el);
    var bg = c.backgroundColor, fg = c.color;
    /* ============================================================
       **גם המילוי, לא רק הצבע.**
       ============================================================
       כפתור ההצטרפות צבוע בגרדיאנט זהב, ולכן `backgroundColor`
       שלו שקוף — והמזערה יצאה כחולה. העתק שנראה אחרת מהמקור
       אינו עוזר למצוא אותו; הוא שולח לחפש כפתור שאינו קיים.
       ============================================================ */
    var img = c.backgroundImage;
    var clear = !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
    var fill = (img && img !== 'none') ? img : (clear ? '' : bg);
    if (!fill) { fill = 'var(--blue,#17468F)'; fg = '#fff'; }
    return '<span class="mini" style="background:' + fill + ';color:' + fg +
           '">' + esc(txt) + '</span>';
  }

  var litEl = null, litT = null;
  function aim(sel) {
    if (litT) { clearTimeout(litT); litT = null; }
    if (litEl) {
      litEl.classList.remove('trip-lit');
      litEl.classList.remove('trip-aim');
      litEl = null;
    }
    if (!sel) return;
    var el = document.querySelector(sel);
    if (!el || !el.offsetParent || !el.offsetHeight) return;
    var bar = $('trip');
    var h = bar ? bar.offsetHeight : 0;
    try { document.documentElement.style.setProperty('--trip-h', (h + 16) + 'px'); }
    catch (e) {}
    el.classList.add('trip-aim');
    try { el.scrollIntoView({ behavior:'smooth', block:'start' }); }
    catch (e) { el.scrollIntoView(); }
    litEl = el;
    /* ============================================================
       **ומהבהב עד שלוחצים.**
       ============================================================
       "אני מתחרט שאמרתי הבהוב קצר. שפשוט יהבהב עד שהוא ילחץ —
       עדין, אבל מהבהב, וככה ברור לו על מה העין שלו צריכה
       ליפול."

       מסגרת שנדלקת לשתי שניות מניחה שהעין נמצאת שם באותו רגע.
       היא לא: היא נודדת בעמוד. ההבהוב ממתין לה.
       ============================================================ */
    litT = setTimeout(function () {
      el.classList.add('trip-lit'); litT = null;
    }, 420);
    return el;
  }

  /* ---------- הרצועה ---------- */
  function paint() {
    if (!on()) { drop(); return; }
    css();
    var el = $('trip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'trip';
      document.body.appendChild(el);
    }
    var s = step(), last = s.fin;
    var bars = STEPS.map(function (x, i) {
      return '<i class="' + (i < st.i ? 'did' : (i === st.i ? 'on' : '')) + '"></i>';
    }).join('');

    /* ============================================================
       שלב שההוראות שלו עברו לידיים אחרות.
       ============================================================
       כל עוד האשף פתוח הרצועה אינה מצביעה ואינה מציירת מזערה:
       הכפתור שהיא הראתה כבר נלחץ, וההוראה הנכונה עכשיו היא
       להסתכל למטה.
       ============================================================ */
    var busy = !st.hail && s.busy && s.busy();

    el.className = st.hail ? 'hail' : '';
    var ttl = st.hail ? t(s.hail) : t(busy ? s.k + 'busy' : s.k);
    var sub = st.hail ? t(s.hail + 'B') : t(busy ? s.k + 'busyB' : s.k + 'b');
    /* כפתור רק כשיש מה ללחוץ עליו: היכרות, ברכה, וסיום.
       במשימה אין כפתור — מה שמקדם אותה הוא לעשות אותה.

       ובסיור ובחזרה מההתחלה יש: שם המשימות כבר עשויות, ובלי
       כפתור הרצועה הייתה נתקעת על משימה שאין דרך לעשות שוב. */
    var btn = (st.hail || !s.done || st.see || (st.re && st.re[s.k]))
      ? '<button class="go" id="trip-go">' +
        esc(last ? t('finGo') : t('next')) + '</button>' : '';

    /* ============================================================
       הכפתור עצמו, בזעיר אנפין.
       ============================================================
       "העין של האנשים קודם כל הולכת לתוך האפליקציה — הם לא שמו
       לב למעלה שהגיע השלב הבא. תצייר לו ממש את הכפתור בקטן
       בתוך המדריך."

       ולכן זו אינה מילה אלא **העתק של מה שמחפשים**: אותו כיתוב
       ואותו צבע. מי שעינו נפלה על הרצועה יודע מה לחפש למטה,
       ומי שעינו נפלה על האפליקציה מזהה את מה שראה למעלה.
       הוא נקרא מהאלמנט האמיתי, ולכן אינו יכול להתיישן.
       ============================================================ */
    var mini = (!st.hail && !busy && s.sel) ? miniOf(s.sel) : '';

    el.innerHTML = '<div class="in">' +
      '<div class="bars">' + bars + '</div>' +
      '<div class="row"><div class="txt">' +
      '<div class="n">' + esc(fill(t('of'), { n:st.i + 1, all:STEPS.length })) + '</div>' +
      '<b>' + esc(ttl) + '</b>' +
      (sub ? '<span class="s">' + esc(sub) + '</span>' : '') +
      mini +
      '</div>' + btn +
      '<button class="x" id="trip-x" aria-label="' + esc(t('quit')) + '">✕</button>' +
      '</div></div>';

    $('trip-x').onclick = function () {
      if (confirm(t('quitAsk'))) stop();
    };
    /* המסך נוסע אל ההוראה — פעם אחת לכל שלב, ולא בכל ציור.
       ציור חוזר קורה גם מפעימת הבדיקה, וגלילה בכל פעימה הייתה
       חוטפת את המסך מתחת לאצבע. */
    if (aimed !== mode()) {
      var first = aimed.split(':')[0] !== String(st.i);
      aimed = mode();
      if (first && s.enter && !st.hail) { try { s.enter(); } catch (e) {} }
      setTimeout(function () {
        aim((st.hail || busy) ? '' : s.sel);
        /* המזערה נקראת מהאלמנט, ולכן היא מצוירת אחרי שהוא
           הגיע למסך — ולא לפניו. */
        var m = $('trip');
        if (m && !st.hail && !busy && s.sel) {
          var box = m.querySelector('.mini');
          var now = miniOf(s.sel);
          if (now && !box) { m.querySelector('.txt').innerHTML += now; }
        }
      }, 260);
    }
    var g = $('trip-go');
    if (g) g.onclick = function () {
      /* ברכה שאין משימה שתפעיל אותה — בסיור, ואצל מי שהתחיל
         מההתחלה אחרי שכבר עשה הכול. בלי זה היא הייתה נעלמת
         מהמסע בדיוק אצל מי שבא לראות אותו. */
      if (!st.hail && s.hail && (st.see || (st.re && st.re[s.k]))) {
        st.hail = 1; save(); paint(); return;
      }
      bump();
    };
    offset();
  }

  /* **הדחיפה למטה.** זה מה שמונע מהרצועה לכסות משהו, ולכן
     היא נמדדת אחרי הציור ולא מוערכת מראש. */
  function offset() {
    var el = $('trip');
    if (!el) return;
    var h = el.offsetHeight;
    document.body.style.paddingTop = h + 'px';
    document.body.setAttribute('data-trip', '1');
  }
  function drop() {
    var el = $('trip');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    document.body.style.paddingTop = '';
    document.body.removeAttribute('data-trip');
    if (watch) { clearInterval(watch); watch = null; }
  }

  /* ---------- התקדמות ---------- */
  function bump() {
    if (st.i >= STEPS.length - 1) { stop(); return; }
    st.i++; st.hail = 0; save(); paint();
  }
  /* משימה שנעשתה. שלב שיש לו ברכה עוצר עליה רגע לפני שהוא
     ממשיך — זה הרגע שבו המסע מתהפך ממשימות למתנות. */
  function check() {
    if (!on()) return;
    /* פתיחת האשף וסגירתו אינן משנות שלב, ולכן אין מי שיצייר
       מחדש חוץ מהפעימה הזו. */
    if (mode() !== aimed) { paint(); return; }
    if (st.hail) return;
    var s = step();
    if (!s.done || !s.done()) return;
    /* בסיור ובמשימה שכבר הייתה עשויה לפני שהתחיל מחדש —
       מתקדמים בכפתור, אחרת כל המשימות היו נבלעות בשנייה. */
    if (st.see || (st.re && st.re[s.k])) return;
    if (s.hail) { st.hail = 1; save(); paint(); return; }
    bump();
  }

  /* ---------- חזרה באמצע ---------- */
  function askBack(after) {
    css();
    var w = document.createElement('div');
    w.id = 'trip-ask';
    w.innerHTML = '<div class="box"><h3>' + esc(t('backH')) + '</h3>' +
      '<p>' + esc(t('backB')) + '</p>' +
      '<button id="trip-cont">' + esc(t('backGo')) + '</button>' +
      '<button class="alt" id="trip-new">' + esc(t('backNew')) + '</button>' +
      '<button class="alt" id="trip-end">' + esc(t('backEnd')) + '</button></div>';
    document.body.appendChild(w);
    var kill = function () { if (w.parentNode) w.parentNode.removeChild(w); };
    $('trip-cont').onclick = function () { kill(); after(); };
    $('trip-new').onclick = function () { kill(); restart(); };
    $('trip-end').onclick = function () { kill(); stop(); };
  }

  /* ---------- הדלקה וכיבוי ---------- */
  function start() {
    st = { i:0, hail:0 };
    save();
    run();
  }
  /* ============================================================
     מההתחלה — בלי שהמסע ייבלע בשנייה.
     ============================================================
     המשימות נבדקות מול מצב המכשיר, ולכן מי שכבר נרשם והתקין
     היה נזרק דרך כולן ברגע. לכן מסמנים כאן מה כבר עשוי, וכל
     משימה כזו ממתינה ל"הבא" במקום לקפוץ מעצמה. מי שבאמת עוד
     לא עשה אותה מקבל אותה כרגיל.
     ============================================================ */
  function restart() {
    var re = {}, i, x;
    for (i = 0; i < STEPS.length; i++) {
      x = STEPS[i];
      if (!x.done) continue;
      try { if (x.done()) re[x.k] = 1; } catch (e) {}
    }
    st = { i:0, hail:0, re:re };
    aimed = '';
    save();
    run();
  }
  /* ============================================================
     סיור — כל השלבים, גם אלה שכבר נעשו.
     ============================================================
     "בגלל שאצלי זה כבר מותקן אין לי אפשרות לראות מה בנית אחרי
     ההתקנה. תייצר לי אפשרות."

     כאן שום משימה אינה מקדמת מעצמה: המסע כולו עובר ב"הבא",
     והכפתורים האמיתיים עדיין מסומנים ועובדים.
     ============================================================ */
  function tour() {
    st = { i:0, hail:0, see:1 };
    aimed = '';
    save();
    run();
  }
  function stop() {
    st = null; aimed = '';
    aim('');
    /* ============================================================
       ומי שסיים — סיים.
       ============================================================
       האייקון של ראש חטיבה שהתקין מתוך המסע נפתח על `?masa=go`,
       וזה קבוע: אותו `start_url` בכל פתיחה. בלי הסימן הזה המסע
       היה מתחיל לו מחדש בכל פעם שהוא פותח את האפליקציה.
       ============================================================ */
    try {
      localStorage.removeItem(KEY);
      localStorage.setItem('df:tripDone', '1');
    } catch (e) {}
    drop();
  }
  function run() {
    paint();
    if (watch) clearInterval(watch);
    /* פעימה שקטה. מה שנבדק הוא מצב המכשיר, ולכן היא זולה —
       ואין דרך אחרת לדעת שהתקנה הסתיימה בלשונית אחרת. */
    watch = setInterval(check, 900);
    check();
  }

  /* ============================================================
     באייפון שטרם התקין — אין מסע, יש התקנה.
     ============================================================
     "כשהגיעה לשלב של האייקון ולחצה עליו, כל השלבים שעשתה
     מקודם לא היו רלוונטיים."

     באייפון לאפליקציה שנוספה למסך הבית יש אחסון נפרד מספארי.
     כל מה שהמסע מספר לעצמו בדפדפן — איפה הוא עומד, מה כבר
     נעשה — נמחק ברגע שהאייקון נפתח. רצועה שסופרת כאן שמונה
     שלבים מבטיחה התקדמות שלא תשרוד.

     ולכן בדפדפן עושים דבר אחד: מתקינים. המסע עצמו מתחיל בפנים,
     כשיש לו על מה להישען. באנדרואיד זה אותו אחסון, ושם שום דבר
     מזה אינו חל.
     ============================================================ */
  function iosBefore() {
    return !!(window.APPX && APPX.isIOS() && !APPX.standalone());
  }

  function boot() {
    if (!document.body) return;
    var m = /[?&]masa=([a-z0-9]+)/i.exec(location.search);
    var wants = !!m;
    var how = m ? m[1].toLowerCase() : '';
    /* `?masa=see` פותח סיור, תמיד מההתחלה — הוא נשלח בכוונה
       כדי לראות, ולא כדי להמשיך ממקום כלשהו. */
    if (how === 'see') { tour(); return; }
    /* `?masa=go` הוא ה-start_url של האייקון: מתחיל את המסע
       בפתיחה הראשונה בתוך האפליקציה, ולא בכל פתיחה. */
    var done = ls('df:tripDone') === '1';
    if (how === 'go' && done) return;
    /* ואין רצועה בכלל — גם לא כזו ששרדה מגרסה קודמת במכשיר.
       מי שהגיע לכאן מקישור מסע מוצא במקומה את ההתקנה. */
    if (iosBefore()) {
      if (wants && typeof show === 'function') show('reg');
      return;
    }
    st = load();
    if (wants && !st) { start(); return; }
    if (!st) return;
    /* חזר באמצע — שואלים אותו, פעם אחת לכניסה. בסיור לא: שם
       אין "מקום שעצרת", והשאלה הייתה חוסמת את מה שבא לראות. */
    if (st.i > 0 && !asked && wants && !st.see) { asked = true; askBack(run); return; }
    run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  return { start:start, stop:stop, on:on, paint:paint, check:check,
           tour:tour, restart:restart,
           at:function () { return st ? st.i : -1; },
           steps:function () { return STEPS.length; } };
})();
