/* ============================================================
   מדריך ההתקנה המאויר.
   ============================================================
   "אני חושש שאנשים נבהלים כשהם רואים את כל ההנחיות. המון מלל.
   במקום להגיד תלחץ על זה ואז על זה ואז על זה — מדריך של כל
   שלב."

   שלושה סעיפים במסך אחד הם רשימה שסורקים. ר"ם שסרק אותה קלט
   את המילה "שיתוף", עשה צעד אחד, ושלח את הקישור לעצמו
   בוואטסאפ. **מסך אחד = פעולה אחת = ציור אחד**, וכפתור אחד
   שממשיך.

   ------------------------------------------------------------
   צילום היכן שאפשר, ציור היכן שצריך

   כאן עמד פעם נימוק למה ציור עדיף על צילום. הוא היה שגוי:
   "אתה לא יכול לשבץ את התמונות האמיתיות? זה הכי מדויק." נכון.
   ציור הוא תמיד פרשנות של מסך, וצילום הוא המסך.

   ולכן מסלול האייפון בנוי מצילומים — והם קלים ממה שחששנו:
   שישה קבצים, 34KB בסך הכול, ושמורים במטמון עוד לפני
   שההתקנה התחילה.

   מה שנשאר מצויר, ולמה:
     · **אייפון ישן** — אין לנו צילום ממכשיר כזה, וציור נכון
       עדיף על צילום מכשיר אחר.
     · **אנדרואיד** — אותו דבר, ושם גם רוב המכשירים מקבלים
       כפתור התקנה אמיתי ואינם רואים את המדריך כלל.
     · **גיליון השיתוף המלא** — הצילום שלו נושא אנשי קשר
       ותצלומי משפחה, והריפו ציבורי. במקומו הצילום החתוך של
       אותו שלב, שאין בו איש.

   ------------------------------------------------------------
   שלושה מסלולים, ולא "אם אתה באייפון אז"

   אפל הזיזה את כפתור השיתוף: עד iOS 18 הוא בסרגל, ומ-26 הוא
   מאחורי שלוש הנקודות. לכן יש שני מסלולי אייפון ומסלול
   אנדרואיד, וכל מכשיר רואה רק את שלו. הסתעפות בתוך הוראה היא
   בדיוק המקום שבו אנשים בוחרים לא נכון.

   הנוסח כולו ב-`GUIDE` שב-data.js, ולכן נערך מהניהול.
   תלוי ב-`getapp.js` (APPX). ES5 בלבד.
   ============================================================ */
var GUIDE_UI = (function () {

  function g(k) { return (window.GUIDE && GUIDE[k]) || ''; }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function fill(t, v) {
    return String(t).replace(/\{(\w+)\}/g, function (m, k) {
      return v[k] != null ? v[k] : m;
    });
  }

  /* ---------- אבני הציור ----------
     מסגרת טלפון אחת, ובתוכה מה שהשלב מראה. הכול ב-viewBox
     קבוע כדי שכל הציורים יישבו באותו גודל ולא יקפצו במעבר. */
  var W = 200, H = 340;

  function phone(inner, opt) {
    opt = opt || {};
    return '<svg class="gu-art" viewBox="0 0 ' + W + ' ' + H + '" ' +
      'role="img" aria-hidden="true">' +
      /* גוף הטלפון */
      '<rect x="10" y="8" width="180" height="324" rx="26" ' +
        'fill="#fff" stroke="var(--rule)" stroke-width="2"/>' +
      '<rect x="16" y="14" width="168" height="312" rx="21" fill="' +
        (opt.screen || '#F7F4EC') + '"/>' +
      /* המגרעת */
      '<rect x="78" y="14" width="44" height="9" rx="5" fill="#fff"/>' +
      inner + '</svg>';
  }

  /* ============================================================
     הצילומים האמיתיים.
     ============================================================
     "אתה לא יכול לשבץ את התמונות האמיתיות ששמתי? זה הכי מדויק."

     נכון, ולכן שבעה מהשלבים הם צילום מסך ולא ציור — ששת אלה
     שבמסלול אייפון, ועכשיו גם `a2` באנדרואיד (התפריט שנפתח
     משלוש הנקודות, עם טבעת סביב "התקנה ויצירת קיצור דרך").
     ציור, טוב ככל שיהיה, הוא תמיד פרשנות; צילום הוא בדיוק מה
     שהם יראו — אותו גופן, אותו סידור, אותה מילה.

     **מה שאינו כאן ולמה.** הצילום של גיליון השיתוף המלא נושא
     את אנשי הקשר בוואטסאפ — שמות ותצלומי משפחה. הריפו ציבורי,
     ו"אין שמות בריפו" אינו כלל שמותר לעקוף בשביל נוחות. במקומו
     הצילום החתוך של אותו שלב, שאין בו איש. וגם מסך הבית חתוך
     עד לאייקון שלנו בלבד.
     ============================================================ */
  /* ============================================================
     הסימון — בפיקסלים של התמונה עצמה, ולא באחוזים.
     ============================================================
     "העיגולים הזהובים הם לא במקום."

     היו שתי תקלות, ושתיהן נבעו מאותו דבר: הסימון היה אלעמנט
     HTML שמונח *מעל* התמונה, וממורכז על הנקודה בעזרת
     `transform: translate(-50%,-50%)`.

       · **עיגול שאינו עגול.** הגודל נקבע ב-`width` באחוזים
         וב-`padding` באחוזים, ואחוזי `padding` נמדדים תמיד
         על **הרוחב**. בצילום רחב ונמוך — סרגל הדפדפן, 540
         על 131 — יצא מזה אליפסה בגובה שני שלישים מהתמונה.
       · **וטרנספורם שאפשר לאבד.** כל דבר שדורס את ה-
         `transform` (אנימציה, דפדפן מוטמע שאינו מחיל אותו)
         מזיז את הסימון בחצי רוחב למטה ולצד — כלומר בדיוק על
         הכפתור השכן. זה כבר תוקן פעם אחת, וחזר.

     כאן אין מעל ואין טרנספורם: `<svg>` עם `viewBox` שהוא
     **המידות האמיתיות של הצילום**, ובתוכו עיגול בקואורדינטות
     של הצילום. הדפדפן מותח את שניהם יחד, ולכן העיגול נשאר
     עגול ונשאר במקומו בכל רוחב מסך ובכל דפדפן.

     `w`/`h` — מידות הקובץ · `x`/`y`/`r` — פיקסלים בתוכו.
     ============================================================ */
  var PICS = {
    /* שלוש הנקודות בסרגל שלמטה */
    n1:  { src:'guidepics/n1.webp',  w:540, h:131, x:78,  y:52,  r:33 },
    /* "שיתוף" — השורה הראשונה בתפריט */
    n2:  { src:'guidepics/n2.webp',  w:440, h:546, x:360, y:55,  r:30 },
    /* "הצגת עוד" — החץ שפורס את הגיליון */
    s2e: { src:'guidepics/s2e.webp', w:540, h:207, x:89,  y:78,  r:46 },
    /* "הוספה למסך הבית" — השורה האחרונה */
    s3:  { src:'guidepics/s3.webp',  w:480, h:432, x:425, y:388, r:30 },
    /* "הוספה" הכחול, בפינה השמאלית העליונה */
    s4:  { src:'guidepics/s4.webp',  w:480, h:407, x:68,  y:60,  r:40 },
    /* התמונה חתוכה עד לאייקון עצמו, ולכן הטבעת מקיפה אותו. */
    s5:  { src:'guidepics/s5.webp',  w:380, h:476, x:201, y:207, r:150 },
    /* תפריט שלוש-הנקודות באנדרואיד, צילום אמיתי — "התקנה
       ויצירת קיצור דרך". מחליף את droidMenu המצויר בשלב a2. */
    a2:  { src:'guidepics/a2.webp',  w:480, h:421, x:453, y:283, r:34 },
    /* ---- פיירפוקס באנדרואיד — צילומים אמיתיים ----
       שלוש הנקודות (הצילום חתוך לפני שורת הכתובת), "עוד" עם
       החץ שפורס את ההמשך, "הוספת יישומון למסך הבית", ו"הוסף". */
    f1:  { src:'guidepics/f1.webp',  w:400, h:170, x:68,  y:82,  r:40 },
    f2:  { src:'guidepics/f2.webp',  w:480, h:237, x:45,  y:201, r:28 },
    f3:  { src:'guidepics/f3.webp',  w:480, h:338, x:435, y:234, r:28 },
    f4:  { src:'guidepics/f4.webp',  w:480, h:466, x:132, y:420, r:38 }
  };

  function pic(p) {
    /* עובי הקו נגזר מרוחב הקובץ ולא מהרדיוס. כל הצילומים
       מוצגים בערך באותו רוחב על המסך, ולכן חלק קבוע מרוחב
       הקובץ הוא עובי אחיד לעין — בעוד שגזירה מהרדיוס הייתה
       נותנת לטבעת הגדולה קו פי חמישה מזה של הקטנה. */
    var sw = Math.max(3, Math.round(p.w * 0.014));
    return '<div class="gu-pic"><span><img src="' + p.src + '" alt="" loading="lazy">' +
      '<svg class="gu-mk" viewBox="0 0 ' + p.w + ' ' + p.h + '" ' +
      'aria-hidden="true"><circle class="gu-ring" cx="' + p.x + '" cy="' + p.y +
      '" r="' + p.r + '" fill="none" stroke="var(--gold)" stroke-width="' + sw +
      '"/></svg></span></div>';
  }

  /* טבעת הזהב והיד — מה שאומר "כאן". */
  function ring(cx, cy, r) {
    return '<circle class="gu-ring" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
      'fill="none" stroke="var(--gold)" stroke-width="3"/>' +
      '<circle class="gu-ring2" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
      'fill="none" stroke="var(--gold)" stroke-width="2" opacity=".45"/>';
  }

  /* שורות תוכן מרומזות — "יש כאן עמוד", בלי להעמיד פנים שזה
     העמוד שלנו. אפור בלבד, כדי שהעין תלך לזהב. */
  function page(y) {
    var h = '', i;
    for (i = 0; i < 7; i++) {
      h += '<rect x="30" y="' + (y + i * 15) + '" width="' +
        (140 - (i % 3) * 28) + '" height="6" rx="3" fill="#E3DDD0"/>';
    }
    return h;
  }

  /* ============================================================
     הסמלים האמיתיים של אייפון.
     ============================================================
     "אנחנו מנסים להעביר את ההסבר מהמלל לחזותי — שבן אדם יראה
     את התמונה, יראה את המסך שלו, ויגיד: אה, הנה זה. בחלקיק
     שנייה."

     פס אפור במקום סמל אינו מקצר שום דבר — הוא רק מעביר את
     העבודה בחזרה למילים. הסמלים כאן מצוירים בצורתם האמיתית
     ובמקום שבו הם באמת יושבים על המסך, ומה שאינו רלוונטי
     לשלב פשוט אינו מצויר.
     ============================================================ */
  var INK = 'var(--ink-2)';

  /* סמל השיתוף — ריבוע פתוח למעלה וחץ שיוצא ממנו. */
  function icShare(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M0 -6V5"/><path d="M-4 -2l4-4 4 4"/>' +
      '<path d="M-6 0v7h12V0"/></g>';
  }
  /* הוספה למסך הבית — ריבוע עם פלוס בתוכו. */
  function icAddHome(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.7" ' +
      'stroke-linecap="round">' +
      '<rect x="-7" y="-7" width="14" height="14" rx="3.5"/>' +
      '<path d="M0 -3.5v7M-3.5 0h7"/></g>';
  }
  function icBookmark(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.7" ' +
      'stroke-linejoin="round"><path d="M-5 -7h10v14l-5-4-5 4z"/></g>';
  }
  function icBook(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.7" ' +
      'stroke-linejoin="round"><path d="M-7 -5h5a2 2 0 012 2v9a2 2 0 00-2-2h-5z"/>' +
      '<path d="M7 -5H2a2 2 0 00-2 2v9a2 2 0 012-2h5z"/></g>';
  }
  function icPlus(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'stroke="' + col + '" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M0 -6v12M-6 0h12"/></g>';
  }
  /* שלוש הנקודות, אופקיות. */
  function icDots(x, y, gap, col) {
    col = col || INK; gap = gap || 7;
    return '<circle cx="' + (x - gap) + '" cy="' + y + '" r="2" fill="' + col + '"/>' +
           '<circle cx="' + x + '" cy="' + y + '" r="2" fill="' + col + '"/>' +
           '<circle cx="' + (x + gap) + '" cy="' + y + '" r="2" fill="' + col + '"/>';
  }

  /* ============================================================
     האייקון שלנו — הדבר עצמו, ולא רמז אליו.
     ============================================================
     זה מה שהם מחפשים בסוף התהליך, ולכן זה חייב להיראות בדיוק
     כמו מה שיופיע להם: ריבוע כחול כהה, ובתוכו הסמל העגול על
     עיגול לבן. `LOGO_MARK` נטען בכל עמוד שטוען את הקובץ הזה;
     בלעדיו נשאר ריבוע כחול, ולא ציור אחר של הלוגו. */
  function appIcon(x, y, size) {
    var r = size * 0.23, cx = x + size / 2, cy = y + size / 2;
    var m = size * 0.82, mk = window.LOGO_MARK || '';
    return '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' +
      size + '" rx="' + r + '" fill="#0B2550"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (m / 2) + '" fill="#fff"/>' +
      (mk ? '<image href="' + mk + '" x="' + (cx - m * 0.33) + '" y="' +
            (cy - m * 0.33) + '" width="' + (m * 0.66) + '" height="' +
            (m * 0.66) + '" preserveAspectRatio="xMidYMid meet"/>' : '');
  }

  /* השורה שמקישים עליה — רקע זהב עדין מתחתיה. הטבעת אומרת
     "הסמל הזה", והרקע אומר "כל השורה לחיצה", ושניהם ביחד הם
     בדיוק מה שקורה באמת. */
  function rowLit(x, y, w) {
    return '<rect x="' + x + '" y="' + (y - 14) + '" width="' + w +
      '" height="28" rx="8" fill="var(--gold)" opacity=".13"/>';
  }

  /* ============================================================
     שלב 1, אייפון חדש — הסרגל של iOS 26.
     ============================================================
     שלושה גופים נפרדים: עיגול בהיר עם שלוש נקודות בשמאל,
     גלולה **כהה** עם הכתובת באמצע, ועיגול עם חץ בימין.
     הגלולה הכהה היא מה שמזהים ראשון, ולכן היא כהה גם כאן.
     ============================================================ */
  function barNew() {
    return page(50) +
      /* העיגול השמאלי — שלוש הנקודות */
      '<circle cx="32" cy="301" r="14" fill="#F4F0E6"/>' + icDots(32, 301, 6) +
      /* הגלולה הכהה */
      '<rect x="52" y="288" width="96" height="26" rx="13" fill="#6E665A"/>' +
      '<path d="M66 296a5 5 0 1 0 2-4" fill="none" stroke="#fff" ' +
        'stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M65 291v4h4" fill="none" stroke="#fff" stroke-width="1.6" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="80" y="298" width="42" height="6" rx="3" fill="rgba(255,255,255,.8)"/>' +
      '<rect x="128" y="295" width="12" height="10" rx="2" fill="none" ' +
        'stroke="#fff" stroke-width="1.5"/>' +
      /* העיגול הימני — החץ */
      '<circle cx="168" cy="301" r="14" fill="#F4F0E6"/>' +
      '<path d="M165 295l6 6-6 6" fill="none" stroke="' + INK + '" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      ring(32, 301, 22);
  }

  /* ============================================================
     שלב 2, אייפון חדש — התפריט שנפתח.
     ============================================================
     **הסמל מימין לכיתוב**, כמו בכל תפריט עברי — וכך הוא
     בצילום. "שיתוף" היא השורה הראשונה, וזו בדיוק הנקודה.
     ============================================================ */
  function menuNew() {
    var rows = [
      { w:32, ic:icShare, on:1 },
      { w:74, ic:icBookmark },
      { w:78, ic:icBook },
      { w:56, ic:icPlus },
      { w:88, ic:icHand }
    ];
    var h = page(30) +
      '<rect x="26" y="120" width="152" height="184" rx="18" fill="#fff" ' +
        'stroke="var(--rule)"/>';
    rows.forEach(function (r, i) {
      var y = 142 + i * 30, col = r.on ? INK : '#CFC7B6';
      if (r.on) h += rowLit(34, y, 136);
      /* הסמל בקצה הימני, והכיתוב לשמאלו. */
      h += r.ic(158, y, 1, col) +
           '<rect x="' + (142 - r.w) + '" y="' + (y - 4) + '" width="' + r.w +
           '" height="7" rx="3.5" fill="' + col + '"/>';
      if (i === 2) h += '<rect x="34" y="' + (y + 15) + '" width="136" height="1" ' +
                        'fill="#EFEADF"/>';
    });
    /* השורה התחתונה — סימניות וכל הכרטיסיות */
    h += '<rect x="34" y="292" width="136" height="1" fill="#EFEADF"/>';
    return h + ring(158, 142, 15);
  }

  /* כף יד — כרטיסייה פרטית. */
  function icHand(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M-5 1v-5M-1.7 1v-7M1.7 1v-6M5 1v-3"/>' +
      '<path d="M-5 1c0 4 2 6 5 6s5-2 5-6"/></g>';
  }

  /* ============================================================
     גיליון השיתוף, גלול אל "הוספה למסך הבית".
     ============================================================
     בראשו האייקון שלנו והכתובת — כך הוא באמת נראה, וזה מה
     שמאשר למי שמסתכל שהוא בגיליון הנכון. שורות האנשים
     והאפליקציות מרומזות בלבד: הן קיימות על המסך, אבל הן לא
     מה שמחפשים כאן, ולכן הן אפורות.
     ============================================================ */
  /* ============================================================
     הגיליון כפי שהוא נפתח — חלקית.
     ============================================================
     זה השלב שדילגנו עליו: הגיליון עולה עד אמצע המסך, ורשימת
     הפעולות מתחתיו חתוכה. החץ בצד הוא מה שפורס אותו, ובלעדיו
     "הוספה למסך הבית" פשוט אינה קיימת על המסך.
     ============================================================ */
  function sheetPart() {
    var h = '<rect x="16" y="140" width="168" height="190" rx="18" fill="#fff" ' +
            'stroke="var(--rule)"/>' +
            appIcon(148, 152, 26) +
            '<rect x="62" y="156" width="78" height="6" rx="3" fill="#CFC7B6"/>' +
            '<rect x="84" y="168" width="56" height="5" rx="2.5" fill="#E3DDD0"/>' +
            /* "אפשרויות ›" */
            '<rect x="112" y="182" width="40" height="13" rx="6.5" fill="#F4F0E6"/>' +
            '<rect x="122" y="186" width="22" height="5" rx="2.5" fill="#CFC7B6"/>' +
            '<rect x="30" y="204" width="140" height="1" fill="#EFEADF"/>';
    var i;
    for (i = 0; i < 4; i++)
      h += '<circle cx="' + (156 - i * 36) + '" cy="226" r="12" fill="#EFEADF"/>';
    for (i = 0; i < 4; i++)
      h += '<rect x="' + (144 - i * 36) + '" y="250" width="24" height="24" ' +
           'rx="6" fill="#EFEADF"/>';
    h += '<rect x="30" y="286" width="140" height="1" fill="#EFEADF"/>';
    /* ============================================================
       שורת הפעולות — ו"הצגת עוד" בקצה השמאלי.
       ============================================================
       העתקה · הוספה אל סימניות · רשימת הקריאה · הצגת עוד.
       החץ כלפי מטה הוא מה שפורס את הגיליון, והוא האחרון —
       כלומר השמאלי ביותר.
       ============================================================ */
    for (i = 0; i < 3; i++)
      h += '<circle cx="' + (156 - i * 36) + '" cy="308" r="13" fill="#F1EDE4"/>';
    h += '<circle cx="48" cy="308" r="13" fill="#F1EDE4"/>' +
         '<path class="gu-scroll" d="M42 305l6 6 6-6" fill="none" ' +
         'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" ' +
         'stroke-linejoin="round"/>';
    return h + ring(48, 308, 17);
  }

  function sheet() {
    var h = '<rect x="16" y="86" width="168" height="240" rx="18" fill="#fff" ' +
            'stroke="var(--rule)"/>' +
            appIcon(148, 96, 24) +
            '<rect x="66" y="100" width="74" height="6" rx="3" fill="#CFC7B6"/>' +
            '<rect x="90" y="112" width="50" height="5" rx="2.5" fill="#E3DDD0"/>';
    var i;
    for (i = 0; i < 4; i++)
      h += '<rect x="' + (144 - i * 36) + '" y="130" width="24" height="24" ' +
           'rx="6" fill="#EFEADF"/>';
    for (i = 0; i < 3; i++)
      h += '<circle cx="' + (156 - i * 36) + '" cy="180" r="12" fill="#F1EDE4"/>';
    h += '<circle cx="48" cy="180" r="12" fill="#F1EDE4"/>' +
         '<path d="M43 182l5-5 5 5" fill="none" stroke="' + INK + '" ' +
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    /* ============================================================
       הרשימה — והשורה שלנו בתחתיתה.
       ============================================================
       הוספת סימניה אל... · הוספה למועדפים · חיפוש בעמוד זה ·
       **הוספה למסך הבית**. הסמלים מימין לכיתוב, כמו בצילום.
       ============================================================ */
    h += '<rect x="26" y="204" width="148" height="112" rx="14" fill="#F4F1EA"/>';
    var rows = [{ w:76, ic:icBook }, { w:66, ic:icStar },
                { w:60, ic:icFind }, { w:84, ic:icAddHome, on:1 }];
    rows.forEach(function (r, k) {
      var y = 222 + k * 26, col = r.on ? INK : '#CFC7B6';
      if (r.on) h += rowLit(34, y, 132);
      h += r.ic(156, y, .92, col) +
           '<rect x="' + (140 - r.w) + '" y="' + (y - 3.5) + '" width="' + r.w +
           '" height="7" rx="3.5" fill="' + col + '"/>';
      if (k < 3) h += '<rect x="36" y="' + (y + 13) + '" width="120" height="1" ' +
                      'fill="#E7E1D4"/>';
    });
    return h + ring(156, 300, 15);
  }

  function icStar(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linejoin="round">' +
      '<path d="M0 -7l2.1 4.3 4.7.7-3.4 3.3.8 4.7L0 4.8l-4.2 2.2.8-4.7-3.4-3.3 ' +
      '4.7-.7z"/></g>';
  }
  function icFind(x, y, k, col) {
    k = k || 1; col = col || INK;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" ' +
      'fill="none" stroke="' + col + '" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="-6" y="-7" width="12" height="14" rx="2"/>' +
      '<circle cx="0" cy="0" r="2.6"/><path d="M2 2l2.4 2.4"/></g>';
  }

  /* ============================================================
     חלון האישור — בדיוק כפי שהוא.
     ============================================================
     **ה-X מימין ו"הוספה" הכחול משמאל.** ציירתי אותם הפוך,
     ושלחתי אנשים לחפש בפינה הלא נכונה. בצילום: X לבן בעיגול
     בפינה הימנית, הכותרת באמצע, ו"הוספה" בכחול בפינה
     השמאלית — כולם בקצה העליון של המסך, לא באמצע חלון.

     מתחת: האייקון מימין, השם לשמאלו, הכתובת באפור, ומתג
     "פתיחה ביישום רשת" הדלוק.
     ============================================================ */
  function confirm() {
    return '<rect x="16" y="70" width="168" height="150" rx="16" fill="#fff" ' +
      'stroke="var(--rule)"/>' +
      /* "הוספה" — כחול, בפינה השמאלית */
      '<rect x="26" y="80" width="42" height="24" rx="12" fill="#0A84FF"/>' +
      '<rect x="36" y="89" width="22" height="6" rx="3" fill="#fff"/>' +
      /* הכותרת באמצע */
      '<rect x="80" y="89" width="56" height="7" rx="3.5" fill="' + INK + '"/>' +
      /* ה-X בפינה הימנית */
      '<circle cx="163" cy="92" r="13" fill="#F4F0E6"/>' +
      '<path d="M159 88l8 8M167 88l-8 8" stroke="#6E665A" stroke-width="2" ' +
        'stroke-linecap="round"/>' +
      '<rect x="16" y="114" width="168" height="1" fill="#EFEADF"/>' +
      /* האייקון מימין, השם לשמאלו */
      appIcon(146, 124, 30) +
      '<rect x="78" y="132" width="58" height="7" rx="3.5" fill="' + INK + '"/>' +
      '<circle cx="34" cy="136" r="7" fill="#E3DDD0"/>' +
      '<rect x="46" y="152" width="90" height="5" rx="2.5" fill="#DED7C9"/>' +
      '<rect x="16" y="168" width="168" height="1" fill="#EFEADF"/>' +
      /* המתג */
      '<rect x="78" y="186" width="58" height="6" rx="3" fill="' + INK + '"/>' +
      '<rect x="26" y="180" width="36" height="20" rx="10" fill="#34C759"/>' +
      '<circle cx="52" cy="190" r="8" fill="#fff"/>' +
      ring(47, 92, 24);
  }

  /* ============================================================
     מסך הבית, והאייקון שנוסף.
     ============================================================
     זה הרגע שבו הם צריכים לזהות משהו בשנייה, ולכן האייקון
     כאן הוא האייקון — ולא ריבוע שמייצג אותו.
     ============================================================ */
  function home() {
    var h = '', r, c;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 4; c++) {
        if (r === 1 && c === 1) continue;
        h += '<rect x="' + (30 + c * 36) + '" y="' + (60 + r * 46) +
             '" width="28" height="28" rx="8" fill="#E7E1D4"/>';
      }
    }
    h += appIcon(66, 106, 28) +
         '<rect x="62" y="140" width="36" height="5" rx="2.5" fill="#CFC7B6"/>';
    return h + ring(80, 120, 26);
  }

  /* ============================================================
     אנדרואיד.
     ============================================================
     "במדריך הנוכחי באנדרואיד עצמו הכל נראה לא ברור."

     צדק. שלושת הציורים היו מלבנים אפורים בלי שום דבר שאפשר
     לזהות. שני השלבים הראשון והשלישי (סרגל הדפדפן עם שלוש
     הנקודות, וחלון ההתקנה) מצוירים, אבל מראים בדיוק את מה
     שבאמת על המסך. השלב האמצעי — התפריט שנפתח מתחת לנקודות —
     הוא עכשיו צילום מסך אמיתי (ראו `PICS.a2`), כי כאן בדיוק
     היה קשה לדעת לאיזו שורה מתוך רשימה ארוכה להסתכל.

     **וברוב המכשירים לא רואים את זה בכלל.** כשלכרום יש כפתור
     התקנה אמיתי, הוא מחליף את כל המסלול — ראו `APPX.bip()`.
     המדריך כאן הוא למי שאין לו אותו.
     ============================================================ */

  /* סרגל הדפדפן: גלולת כתובת, ושלוש נקודות אנכיות בקצה. */
  function droidBar(lit) {
    return '<rect x="16" y="20" width="168" height="30" rx="8" fill="#fff"/>' +
      '<rect x="30" y="28" width="120" height="14" rx="7" fill="#F1EDE4"/>' +
      '<rect x="40" y="32" width="70" height="6" rx="3" fill="#CFC7B6"/>' +
      '<circle cx="166" cy="29" r="2" fill="' + INK + '"/>' +
      '<circle cx="166" cy="35" r="2" fill="' + INK + '"/>' +
      '<circle cx="166" cy="41" r="2" fill="' + INK + '"/>' +
      (lit ? ring(166, 35, 15) : '');
  }

  /* ---------- שלב 1: שלוש הנקודות ---------- */
  function droidDots() {
    return page(72) + droidBar(1);
  }

  /* ---------- שלב 2: התפריט שנפתח מתחתיהן ----------
     נצמד לפינה שממנה הוא נפתח, ולא מרחף באמצע. השורה שלנו
     נושאת את סמל ההתקנה — טלפון עם חץ שנכנס אליו. */
  function droidMenu() {
    var h = page(72) + droidBar(0) +
      '<rect x="74" y="56" width="104" height="150" rx="12" fill="#fff" ' +
        'stroke="var(--rule)"/>';
    var i, rows = [64, 36, 80, 52];
    for (i = 0; i < 4; i++) {
      var y = 78 + i * 34, on = (i === 2);
      if (on) h += rowLit(80, y, 92);
      h += '<rect x="' + (168 - rows[i]) + '" y="' + (y - 4) + '" width="' + rows[i] +
           '" height="7" rx="3.5" fill="' + (on ? INK : '#CFC7B6') + '"/>';
      if (on) {
        /* סמל ההתקנה: טלפון וחץ שיורד לתוכו. */
        h += '<g transform="translate(90,' + y + ')" fill="none" stroke="' + INK +
             '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
             '<rect x="-5" y="-7" width="10" height="14" rx="2"/>' +
             '<path d="M0 -4v6M-2.5 -0.5L0 2l2.5-2.5"/></g>';
      }
    }
    return h + ring(90, 146, 15);
  }

  /* ---------- שלב 3: חלון ההתקנה ---------- */
  function droidOk() {
    return page(72) + droidBar(0) +
      '<rect x="22" y="112" width="156" height="118" rx="16" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      appIcon(134, 130, 34) +
      '<rect x="56" y="138" width="66" height="8" rx="4" fill="#CFC7B6"/>' +
      '<rect x="44" y="156" width="78" height="6" rx="3" fill="#E3DDD0"/>' +
      /* "התקן" — כחול, בפינה התחתונה */
      '<rect x="40" y="188" width="52" height="24" rx="12" fill="var(--blue)"/>' +
      '<rect x="54" y="197" width="24" height="6" rx="3" fill="#fff"/>' +
      '<rect x="104" y="197" width="38" height="6" rx="3" fill="#CFC7B6"/>' +
      ring(66, 200, 22);
  }

  /* ---------- שלושת המסלולים ----------
     כל שלב: הכיתוב, ההסבר, והציור. */
  var DROID = [['a1', droidDots], ['a2', droidMenu], ['a3', droidOk]];
  /* פיירפוקס: אין בו הצעת התקנה, ו"הוספה למסך הבית" חבויה
     מתחת ל"עוד". ארבעה שלבים, כולם צילום (PICS) — הציור שבצד
     הוא רק רשת ביטחון אם תמונה לא נטענה. */
  var FX    = [['f1', droidDots], ['f2', droidMenu], ['f3', droidMenu], ['f4', droidOk]];
  var TAIL  = [['s2e', sheetPart], ['s3', sheet], ['s4', confirm], ['s5', home]];
  /* ============================================================
     מסלול אייפון אחד, ולא שניים.
     ============================================================
     "בכל האייפונים כרגע אנחנו קודם כל מתחילים משלוש הנקודות
     ואז עוברים לסמל שיתוף."

     היה כאן פיצול לפי גרסת iOS: עד 18 הסמל בסרגל, ומ-26
     מאחורי שלוש הנקודות. בשטח זה נשבר — הקישור מגיע בוואטסאפ
     ונפתח בדפדפן שבתוכו, ושם הסרגל הוא של וואטסאפ ולא של
     ספארי: שלוש נקודות בצד שמאל, בכל מכשיר ובכל גרסה. אשתו
     קיבלה את המסלול של האייפון הישן על אייפון 17, וההוראה
     הראשונה הצביעה על סמל שלא היה על המסך.

     זיהוי גרסה לא יפתור את זה, כי הבעיה אינה הגרסה אלא איזה
     דפדפן פתח. מסלול אחד שמתחיל בשלוש הנקודות נכון בשניהם.
     ============================================================ */
  var IOS   = [['n1', barNew], ['n2', menuNew]].concat(TAIL);

  /* כפייה של מסלול — למסך הניהול בלבד.
     ============================================================
     לאחיאסף יש אנדרואיד, ולכן הוא לעולם לא יראה במכשיר שלו את
     מה שראש חטיבה עם אייפון רואה. בלי הדרך לראות, הוא עורך
     נוסח בעיוורון. */
  var FORCE = null;
  function force(kind) { FORCE = kind || null; LIST = null; at = 0; }

  function kinds() {
    return [['ios', 'אייפון'], ['droid', 'אנדרואיד'], ['fx', 'פיירפוקס']];
  }

  function steps() {
    if (FORCE === 'droid') return DROID;
    if (FORCE === 'ios')   return IOS;
    if (FORCE === 'fx')    return FX;
    if (APPX.isIOS()) return IOS;
    return (APPX.firefox && APPX.firefox()) ? FX : DROID;
  }

  /* ---------- המסך ---------- */
  var at = 0, LIST = null, HOST = null, ONDONE = null;

  /* ============================================================
     **כל השלבים בעמוד אחד, ולא "הבא".**
     ============================================================
     "יש כמה שמסתבכים בזה כי הם ישר לוחצים על שלוש הנקודות, ולא
     מבינים שהם צריכים לצאת בחזרה ולהסתכל על המשך ההוראות. אני
     לוחץ על שלוש הנקודות, מופיע מולי מסך — ואני לא יכול לקרוא
     באותו רגע את המשך ההוראות."

     מסך אחד לכל שלב הניח שהאדם חוזר אלינו בין שלב לשלב. הוא לא
     חוזר: הלחיצה הראשונה פותחת חלון של הדפדפן שמכסה אותנו. לכן
     כל השלבים זה מתחת לזה, עם חץ ביניהם, ובראש שורה שמבקשת לקרוא
     עד הסוף לפני שמתחילים. */
  function draw() {
    if (!HOST) return;
    var L = LIST || (LIST = steps());
    if (PLAY) { drawPlay(L); return; }
    HOST.innerHTML =
      '<div class="gu">' +
        '<div class="gu-intro">' + esc(g('intro')) + '</div>' +
        L.map(function (s, i) {
          var key = s[0], art = s[1];
          return (i ? '<div class="gu-arrow" aria-hidden="true">↓</div>' : '') +
            '<div class="gu-step" id="gu-s' + i + '">' +
            /* המספר בעיגול — ולא "שלב 3 מתוך 6": מספר נקלט במבט,
               ומשפט מדלגים עליו. */
            '<div class="gu-num">' + (i + 1) + '</div>' +
            '<h3>' + esc(g(key)) + '</h3>' +
            /* **בתוך מסגרת הטלפון.** כל חלק מחזיר את מה שיש על המסך
               בלבד; בלי העטיפה אלה אלמנטים של SVG מחוץ ל-`<svg>`,
               והדפדפן פשוט זורק אותם — הציור נעלם בשקט. */
            (PICS[key] ? pic(PICS[key]) : phone(art())) +
            '</div>';
        }).join('') +
        '<button class="gu-go" id="gu-next">' + esc(g('fin')) + '</button>' +
      '</div>';

    var b = document.getElementById('gu-next');
    if (b) b.onclick = function () { if (ONDONE) ONDONE(); };
  }

  /* ============================================================
     **מצב הדגמה: שלב אחד בכל פעם, מעצמו.**
     ============================================================
     "רשימת שלבים ארוכה עם מספרים 1-2-3 מעייפת את המשתמשים."

     אותם שלבים, אותו נוסח ואותם צילומים — אבל במקום רשימה
     שגוללים, הם מתחלפים מעצמם: מופיע שלב, נעלם, מופיע הבא.
     בסוף נשאר האחרון, ומתחתיו "הצג שוב" ו"סיימתי".

     הבעיה שבגללה הכל עבר לעמוד אחד (ראו draw) עדיין נכונה:
     מי שלוחץ על שלוש הנקודות כבר לא רואה אותנו. ולכן ההדגמה
     רצה **עד הסוף לפני** שהוא צריך לעשות משהו, והשורה שמעליה
     ("קראו עד הסוף") נשארת.

     **כל השלבים באותו תא של רשת**, זה על זה. התא מקבל את גובה
     הגבוה שבהם, ולכן המעבר בין צילום נמוך לגבוה אינו מזיז את
     מה שמתחת — בלי למדוד ובלי גובה קבוע, בכל גודל מסך.

     רק join.html מבקש את זה (`{ play: true }`). הניהול, עמוד
     הצוות והבקשה האישית ממשיכים לראות את הרשימה. */
  var PLAY = false, PT = null, PAT = 0;

  /* AUTO — ההדגמה רצה מעצמה. ברגע שהיא נגמרת, או שנגעו במד,
     היא עוצרת: מכאן הולכים אחורה וקדימה ביד. */
  var AUTO = false;
  /* GO — הגיעו לכאן מהכפתור "צפו בתהליך ההתקנה": השורה היא "צפו:" בלבד. */
  var GO = false;

  /* חץ מצויר ולא תו: ‹ ו-› מתהפכים לבד בטקסט מימין לשמאל, ושני
     החצים יצאו פונים לאותו צד. 1 — ימינה, ‎-1 — שמאלה. */
  function chev(dir) {
    return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" ' +
      'style="display:block;margin:auto"><path d="' +
      (dir > 0 ? 'M6 3l5 5-5 5' : 'M10 3l-5 5 5 5') + '" fill="none" ' +
      'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round"/></svg>';
  }

  function drawPlay(L) {
    HOST.innerHTML =
      '<div class="gu gu-play">' +
        '<div class="gu-intro">' + esc((GO && g('playGo')) || g('playIntro') || g('intro')) + '</div>' +
        '<div class="gu-stage" id="gu-stage" aria-live="polite">' +
        L.map(function (s, i) {
          var key = s[0], art = s[1];
          return '<div class="gu-step gu-slide" id="gu-s' + i + '">' +
            '<h3>' + esc(g(key)) + '</h3>' +
            (PICS[key] ? pic(PICS[key]).replace(' loading="lazy"', '') : phone(art())) +
            '</div>';
        }).join('') +
        '</div>' +
        /* ============================================================
           המד: עיגול ממוספר לכל שלב, והנוכחי מסומן.
           ============================================================
           "ככה הוא יודע — יש פה שלושה שלבים, הנה אני רואה אותם."
           המספרים לחיצים תמיד; החצים מופיעים כשההדגמה נגמרת. */
        '<div class="gu-meter" id="gu-meter">' +
          '<button class="gu-arw" id="gu-prev" aria-label="' + esc(g('back')) + '">' + chev(1) + '</button>' +
          L.map(function (s, i) {
            return '<button class="gu-n" id="gu-d' + i + '">' + (i + 1) + '</button>';
          }).join('') +
          '<button class="gu-arw" id="gu-fwd" aria-label="' + esc(g('fwd')) + '">' + chev(-1) + '</button>' +
        '</div>' +
        '<div class="gu-end" id="gu-end">' +
          '<button class="gu-go" id="gu-next">' + esc(g('fin')) + '</button>' +
          '<button class="gu-again" id="gu-again">' + esc(g('again')) + '</button>' +
        '</div>' +
      '</div>';

    var by = function (id) { return document.getElementById(id); };
    by('gu-next').onclick = function () { playStop(); if (ONDONE) ONDONE(); };
    by('gu-again').onclick = function () { AUTO = true; playAt(0); };
    by('gu-prev').onclick = function () { AUTO = false; playAt(Math.max(0, PAT - 1)); };
    by('gu-fwd').onclick  = function () { AUTO = false; playAt(Math.min(L.length - 1, PAT + 1)); };
    L.forEach(function (s, i) {
      by('gu-d' + i).onclick = function () { AUTO = false; playAt(i); };
    });
    /* לחיצה על הציור — הבא. */
    by('gu-stage').onclick = function () {
      if (PAT < L.length - 1) { AUTO = false; playAt(PAT + 1); }
    };
    AUTO = true;
    playAt(0);
  }

  /* "זה צריך להיות יותר מהיר — אפשר להירדם באמצע."
     פחות משתי שניות וחצי לשלב: מספיק לקרוא שורה ולראות את הטבעת. */
  function dwell(i) {
    var L = LIST || [];
    var n = L[i] ? g(L[i][0]).length : 0;
    return Math.max(1700, Math.min(2500, 1200 + n * 30));
  }

  function playStop() { if (PT) { clearTimeout(PT); PT = null; } }

  function playAt(i) {
    playStop();
    var L = LIST || [];
    /* המסך הוחלף מאז (שלב אחר במסע) — אין למי להציג. */
    if (!HOST || !document.getElementById('gu-stage')) return;
    PAT = i;
    var k, s, d, last = (i === L.length - 1);
    for (k = 0; k < L.length; k++) {
      s = document.getElementById('gu-s' + k);
      d = document.getElementById('gu-d' + k);
      if (s) s.className = 'gu-step gu-slide' + (k === i ? ' on' : '');
      if (d) d.className = 'gu-n' + (k === i ? ' on' : (k < i ? ' did' : ''));
    }
    var hand = function () {
      var m = document.getElementById('gu-meter'), e = document.getElementById('gu-end');
      if (m) m.className = 'gu-meter hand';
      if (e) e.className = 'gu-end on';
      var p = document.getElementById('gu-prev'), f = document.getElementById('gu-fwd');
      if (p) p.disabled = (PAT === 0);
      if (f) f.disabled = (PAT === L.length - 1);
    };
    if (!AUTO) { hand(); return; }
    var m0 = document.getElementById('gu-meter'), e0 = document.getElementById('gu-end');
    if (m0) m0.className = 'gu-meter';
    if (e0) e0.className = 'gu-end';
    if (last) {
      /* הסוף: רגע לקרוא את השלב האחרון, ואז הניווט והכפתורים. */
      PT = setTimeout(function () { AUTO = false; hand(); }, 900);
      return;
    }
    PT = setTimeout(function () { playAt(i + 1); }, dwell(i));
  }

  function mount(host, onDone, opt) {
    playStop();
    HOST = host; ONDONE = onDone || null;
    PLAY = !!(opt && opt.play);
    GO = !!(opt && opt.go);
    LIST = steps(); at = 0;
    css();
    draw();
  }
  /* פתיחה מחדש מתחילה מההתחלה: מי שחזר הנה לא השלים, והמשך
     מאמצע הוא ניחוש. */
  function reset() { playStop(); at = 0; LIST = null; }

  function css() {
    if (document.getElementById('gu-css')) return;
    var st = document.createElement('style');
    st.id = 'gu-css';
    st.textContent = [
      /* ============================================================
         הפרדה מהמסך שמסביב.
         ============================================================
         המדריך יושב בתוך כרטיס שיש לו כותרת ושורה קבועה משלו,
         והשורה שמשתנה היא היחידה שצריך לקרוא מחדש בכל צעד.
         הקו על המעטפת ולא על הכותרת הפנימית — כי יש מסכים
         שמסתירים בה את מונה השלבים, ואז קו שיושב עליו נעלם
         איתו. מסך שאין מעליו דבר מבטל את הקו אצלו (`#reg-gu`).
         ============================================================ */
      '.gu{text-align:center;padding-top:16px;',
      '  border-top:1px solid var(--rule)}',
      '.gu-kick{font-size:.78rem;font-weight:800;color:var(--gold);',
      '  letter-spacing:.04em;margin-bottom:7px}',
      /* ההוראה של השלב — וזו היחידה על המסך שמשתנה.
         קו מפריד מעליה וצבע משלה: העין חוזרת אליה בכל צעד
         בלי לקרוא מחדש את הכותרת ואת השורה שמעליה. */
      '.gu h3{margin:0;font-size:1.12rem;font-weight:800;line-height:1.45;',
      '  letter-spacing:-.02em;color:var(--blue,#17468F)}',

      /* הציור. גובה קבוע, אחרת כל מעבר מזיז את הכפתור שמתחתיו. */
      '.gu-art{display:block;width:100%;max-width:190px;height:290px;',
      '  margin:12px auto 0}',
      /* הצילום — באותה מסגרת ובאותו גובה שיש לציור, כדי
         שהמעבר בין שלב מצויר לשלב מצולם לא יזיז את הכפתור. */
      /* גובה לפי התמונה: כשהשלבים זה מתחת לזה אין כפתור שקופץ, וגובה
         קבוע רק השאיר רווחים ריקים סביב צילום נמוך. */
      '.gu-pic{width:100%;max-width:230px;height:auto;',
      '  margin:12px auto 0;display:flex;align-items:center;',
      '  justify-content:center}',
      '.gu-pic span{position:relative;display:block;line-height:0}',
      '.gu-pic img{max-width:100%;max-height:290px;display:block;',
      '  border-radius:14px;border:1px solid var(--rule);',
      '  box-shadow:0 2px 10px rgba(37,29,12,.10)}',
      /* הסימון על הצילום — שכבת SVG בדיוק בגודל התמונה.
         בלי מיקום באחוזים ובלי טרנספורם שממרכז, ולכן העיגול
         אינו יכול לזוז ואינו יכול להימתח לאליפסה. */
      '.gu-mk{position:absolute;inset:0;width:100%;height:100%;',
      '  overflow:visible;pointer-events:none}',
      '@keyframes guPulse{0%,100%{opacity:1;transform:scale(1)}',
      '  50%{opacity:.55;transform:scale(1.08)}}',
      '.gu-ring{transform-origin:center;transform-box:fill-box;',
      '  animation:guPulse 1.9s ease-in-out infinite}',
      '.gu-ring2{transform-origin:center;transform-box:fill-box;',
      '  animation:guPulse 1.9s ease-in-out infinite .5s}',
      '@keyframes guDrop{0%,100%{transform:translateY(0);opacity:.5}',
      '  50%{transform:translateY(5px);opacity:1}}',
      '.gu-scroll{transform-origin:center;transform-box:fill-box;',
      '  animation:guDrop 1.5s ease-in-out infinite}',
      /* הפתיח — "אלו שלבי ההתקנה:". שורה אחת, בלי מסגרת. */
      '.gu-intro{margin:0 0 14px;color:var(--ink,#1B2A45);',
      '  font-size:1rem;font-weight:800;line-height:1.5}',
      '.gu-step{padding-top:4px}',
      '.gu-num{width:34px;height:34px;margin:0 auto 8px;border-radius:50%;',
      '  background:var(--gold);color:#fff;font-size:1.05rem;font-weight:800;',
      '  display:flex;align-items:center;justify-content:center}',
      '.gu-arrow{font-size:1.6rem;font-weight:800;line-height:1;',
      '  color:var(--gold);margin:12px 0 10px}',
      '.gu-go{display:block;width:100%;margin-top:16px;padding:15px;border:0;',
      '  border-radius:12px;background:var(--blue);color:#fff;',
      '  font-family:inherit;font-weight:800;font-size:1rem;cursor:pointer}',
      '.gu-back{display:block;width:100%;margin-top:8px;padding:10px;border:0;',
      '  background:none;color:var(--ink-3);font-family:inherit;',
      '  font-size:.86rem;font-weight:700;text-decoration:underline;cursor:pointer}',
      /* ---- מצב הדגמה (ראו drawPlay) ----
         כל השלבים באותו תא; הגבוה שבהם קובע את הגובה, והמוצג
         הוא היחיד שנראה. הצילום מוגבל גם לפי גובה המסך — בטלפון
         נמוך הוא קטן, כדי שהשלב והכפתורים ייכנסו יחד. */
      '.gu-stage{display:grid;cursor:pointer}',
      '.gu-slide{grid-area:1/1;align-self:start;opacity:0;visibility:hidden;',
      '  transform:translateY(8px);',
      '  transition:opacity .22s ease,transform .22s ease,visibility 0s linear .22s}',
      '.gu-slide.on{opacity:1;visibility:visible;transform:none;',
      '  transition:opacity .22s ease .08s,transform .22s ease .08s,visibility 0s}',
      '.gu-play .gu-pic img{max-height:290px;max-height:min(290px,32vh)}',
      '.gu-play .gu-art{height:290px;height:min(290px,32vh)}',
      /* המד: עיגולים ממוספרים, והנוכחי בזהב. החצים תופסים מקום
         תמיד — כשהם מופיעים בסוף, שום דבר לא זז. */
      '.gu-meter{display:flex;justify-content:center;align-items:center;',
      '  gap:6px;margin:14px 0 0}',
      '.gu-n{width:30px;height:30px;flex:none;border-radius:50%;padding:0;',
      '  border:1.5px solid var(--rule);background:#fff;color:var(--ink-3);',
      '  font-family:inherit;font-size:.86rem;font-weight:800;cursor:pointer;',
      '  transition:background .2s,color .2s,border-color .2s}',
      '.gu-n.did{border-color:var(--gold);color:var(--gold)}',
      '.gu-n.on{background:var(--gold);border-color:var(--gold);color:#fff}',
      '.gu-arw{width:34px;height:34px;flex:none;border:0;border-radius:50%;padding:0;',
      '  background:var(--sunk);color:var(--blue,#17468F);font-family:inherit;',
      '  font-size:1.5rem;font-weight:800;line-height:1;cursor:pointer;',
      '  visibility:hidden}',
      '.gu-meter.hand .gu-arw{visibility:visible}',
      '.gu-arw:disabled{opacity:.3;cursor:default}',
      '.gu-play .gu-slide h3{min-height:2.9em;display:flex;align-items:center;',
      '  justify-content:center}',
      /* הכפתורים תופסים את מקומם גם כשאינם נראים — כך שום דבר
         אינו קופץ כשהם מופיעים. */
      /* שניהם בשורה אחת: בטלפון רגיל (390×844) שורה שנייה ירדה
         אל מתחת לקצה המסך בשלב האחרון של האייפון. */
      '.gu-end{display:flex;gap:10px;align-items:stretch;',
      '  visibility:hidden;opacity:0;transition:opacity .3s}',
      '.gu-end.on{visibility:visible;opacity:1}',
      '.gu-end .gu-go{flex:1.5;width:auto}',
      '.gu-again{flex:1;display:block;margin-top:16px;padding:12px;',
      '  border:1.5px solid var(--rule);border-radius:12px;background:#fff;',
      '  color:var(--blue,#17468F);font-family:inherit;font-size:.95rem;',
      '  font-weight:800;cursor:pointer}',
      /* מי שמעדיף בלי תנועה — מקבל בלי תנועה. */
      '@media (prefers-reduced-motion:reduce){',
      '  .gu-ring,.gu-ring2,.gu-scroll{animation:none}',
      '  .gu-slide,.gu-slide.on,.gu-end{transition:none;transform:none}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* קפיצה לשלב מסוים. קיימת בשביל הניהול: שם הציור מצויר מחדש
     בכל הקלדה, ובלי זה כל מילה שנערכה בשלב 3 הייתה מחזירה את
     המסך לשלב 1 — ואחיאסף לא היה רואה את מה שכתב. */
  function seek(n) {
    var L = LIST || (LIST = steps());
    at = Math.max(0, Math.min(n | 0, L.length - 1));
  }

  return { mount: mount, reset: reset, steps: steps, css: css,
           force: force, kinds: kinds, seek: seek,
           at: function () { return at; } };
})();
