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
   למה ציור ולא צילום מסך

   צילום של אייפון אמיתי נושא את השעה, הסוללה והאפליקציות של
   מישהו אחר — רעש שמסיח מהדבר היחיד שצריך ללחוץ עליו. הוא גם
   מתיישן: מסך של iOS 26 מבלבל את מי שעל 18. וגם מטושטש
   כשמקטינים.

   ציור מראה **רק את מה שרלוונטי**, נשאר חד בכל גודל, שוקל
   כלום, ועובד אופליין. ומשנים בו מילה בלי לצלם מחדש.

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

  /* ---------- שלב 1, אייפון ישן: הסמל בסרגל ---------- */
  function barOld() {
    return page(50) +
      '<rect x="20" y="286" width="160" height="30" rx="10" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      icShare(100, 301, 1.25) +
      '<rect x="30" y="297" width="40" height="6" rx="3" fill="#D9D2C4"/>' +
      '<rect x="134" y="297" width="34" height="6" rx="3" fill="#D9D2C4"/>' +
      ring(100, 301, 22);
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
     לזהות. כאן הם מראים את מה שבאמת על המסך: סרגל הדפדפן עם
     הכתובת ושלוש הנקודות, התפריט שנפתח מתחתיהן, וחלון ההתקנה
     עם האייקון שלנו.

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
  var TAIL  = [['s2e', sheetPart], ['s3', sheet], ['s4', confirm], ['s5', home]];
  var NEW   = [['n1', barNew], ['n2', menuNew]].concat(TAIL);
  var OLD   = [['o1', barOld]].concat(TAIL);

  /* כפייה של מסלול — למסך הניהול בלבד.
     ============================================================
     לאחיאסף יש אנדרואיד, ולכן הוא לעולם לא יראה במכשיר שלו את
     מה שראש חטיבה עם אייפון רואה. בלי הדרך לראות, הוא עורך
     נוסח בעיוורון. */
  var FORCE = null;
  function force(kind) { FORCE = kind || null; LIST = null; at = 0; }

  function kinds() {
    return [['iosNew', 'אייפון חדש'], ['iosOld', 'אייפון ישן'],
            ['droid', 'אנדרואיד']];
  }

  function steps() {
    if (FORCE === 'droid')  return DROID;
    if (FORCE === 'iosNew') return NEW;
    if (FORCE === 'iosOld') return OLD;
    if (!APPX.isIOS()) return DROID;
    /* גרסה שלא זוהתה מקבלת את החדש — שם רוב המכשירים היום. */
    var v = APPX.iosVer();
    return (v === 0 || v >= 26) ? NEW : OLD;
  }

  /* ---------- המסך ---------- */
  var at = 0, LIST = null, HOST = null, ONDONE = null;

  function draw() {
    if (!HOST) return;
    var L = LIST || (LIST = steps());
    if (at >= L.length) at = L.length - 1;
    if (at < 0) at = 0;
    var s = L[at], key = s[0], art = s[1];
    var last = (at === L.length - 1);

    HOST.innerHTML =
      '<div class="gu">' +
        '<div class="gu-kick">' +
          esc(fill(g('step'), { n: at + 1, all: L.length })) + '</div>' +
        '<h3>' + esc(g(key)) + '</h3>' +
        '<p>' + esc(g(key + 's')) + '</p>' +
        /* **בתוך מסגרת הטלפון.** כל חלק מחזיר את מה שיש על המסך
           בלבד; בלי העטיפה אלה אלמנטים של SVG מחוץ ל-`<svg>`,
           והדפדפן פשוט זורק אותם — הציור נעלם בשקט. */
        phone(art()) +
        '<div class="gu-dots">' + L.map(function (x, i) {
          return '<i class="' + (i === at ? 'on' : (i < at ? 'did' : '')) + '"></i>';
        }).join('') + '</div>' +
        '<button class="gu-go" id="gu-next">' +
          esc(last ? g('fin') : g('next')) + '</button>' +
        (at ? '<button class="gu-back" id="gu-back">' + esc(g('back')) +
              '</button>' : '') +
      '</div>';

    var b = document.getElementById('gu-next');
    if (b) b.onclick = function () {
      if (at < L.length - 1) { at++; draw(); }
      else if (ONDONE) ONDONE();
    };
    b = document.getElementById('gu-back');
    if (b) b.onclick = function () { at--; draw(); };
  }

  function mount(host, onDone) {
    HOST = host; ONDONE = onDone || null;
    LIST = steps(); at = 0;
    css();
    draw();
  }
  /* פתיחה מחדש מתחילה מההתחלה: מי שחזר הנה לא השלים, והמשך
     מאמצע הוא ניחוש. */
  function reset() { at = 0; LIST = null; }

  function css() {
    if (document.getElementById('gu-css')) return;
    var st = document.createElement('style');
    st.id = 'gu-css';
    st.textContent = [
      '.gu{text-align:center}',
      '.gu-kick{font-size:.78rem;font-weight:800;color:var(--gold);',
      '  letter-spacing:.04em;margin-bottom:7px}',
      '.gu h3{margin:0;font-size:1.1rem;font-weight:800;line-height:1.45;',
      '  letter-spacing:-.02em;color:var(--ink)}',
      '.gu > p{margin:7px 0 0;font-size:.9rem;font-weight:600;',
      '  color:var(--ink-2);line-height:1.65;min-height:2.8em}',
      /* הציור. גובה קבוע, אחרת כל מעבר מזיז את הכפתור שמתחתיו. */
      '.gu-art{display:block;width:100%;max-width:190px;height:290px;',
      '  margin:12px auto 0}',
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
      '.gu-dots{display:flex;gap:7px;justify-content:center;margin:14px 0 0}',
      '.gu-dots i{width:22px;height:4px;border-radius:2px;background:var(--rule)}',
      '.gu-dots i.did{background:var(--green-d,#2E7D52)}',
      '.gu-dots i.on{background:var(--gold)}',
      '.gu-go{display:block;width:100%;margin-top:16px;padding:15px;border:0;',
      '  border-radius:12px;background:var(--blue);color:#fff;',
      '  font-family:inherit;font-weight:800;font-size:1rem;cursor:pointer}',
      '.gu-back{display:block;width:100%;margin-top:8px;padding:10px;border:0;',
      '  background:none;color:var(--ink-3);font-family:inherit;',
      '  font-size:.86rem;font-weight:700;text-decoration:underline;cursor:pointer}',
      /* מי שמעדיף בלי תנועה — מקבל בלי תנועה. */
      '@media (prefers-reduced-motion:reduce){',
      '  .gu-ring,.gu-ring2,.gu-scroll{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* קפיצה לשלב מסוים. קיימת בשביל הניהול: שם הציור מצויר מחדש
     בכל הקלדה, ובלי זה כל מילה שנערכה בשלב 3 הייתה מחזירה את
     המסך לשלב 1 — ואחיאסף לא היה רואה את מה שכתב. */
  function seek(n) {
    var L = LIST || (LIST = steps());
    at = Math.max(0, Math.min(n | 0, L.length - 1));
    draw();
  }

  return { mount: mount, reset: reset, steps: steps, css: css,
           force: force, kinds: kinds, seek: seek,
           at: function () { return at; } };
})();
