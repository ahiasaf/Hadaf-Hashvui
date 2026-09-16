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

  /* ---------- שלב 1, אייפון חדש: הסרגל המכווץ ---------- */
  function barNew() {
    return page(50) +
      /* הסרגל התחתון של iOS 26: שלוש גלולות נפרדות, ושלוש
         הנקודות בגלולה השמאלית. */
      '<rect x="24" y="288" width="34" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' + icDots(41, 301, 7) +
      '<rect x="64" y="288" width="88" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      '<rect x="76" y="298" width="64" height="6" rx="3" fill="#D9D2C4"/>' +
      '<rect x="158" y="288" width="26" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      ring(41, 301, 22);
  }

  /* ---------- שלב 2, אייפון חדש: התפריט שנפתח ----------
     חמש השורות שבצילום, בסדר שלהן, עם הסמלים שלהן. "שיתוף"
     היא הראשונה — וזו בדיוק הנקודה. */
  function menuNew() {
    var rows = [
      { w:34, ic:icShare },
      { w:76, ic:icBookmark },
      { w:68, ic:icBook },
      { w:52, ic:icPlus }
    ];
    var h = page(36) +
      '<rect x="22" y="150" width="156" height="152" rx="16" fill="#fff" ' +
        'stroke="var(--rule)"/>' + rowLit(30, 174, 140);
    rows.forEach(function (r, i) {
      var y = 174 + i * 36, on = (i === 0), col = on ? INK : '#CFC7B6';
      /* הכיתוב נצמד לימין, והסמל משמאלו — כמו בתפריט עברי. */
      h += '<rect x="' + (162 - r.w) + '" y="' + (y - 4) + '" width="' + r.w +
           '" height="7" rx="3.5" fill="' + col + '"/>' +
           r.ic(44, y, 1, col);
      if (i < rows.length - 1)
        h += '<rect x="34" y="' + (y + 14) + '" width="132" height="1" fill="#EFEADF"/>';
    });
    return h + ring(44, 174, 15);
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
  function sheet() {
    var h = '<rect x="16" y="76" width="168" height="250" rx="18" fill="#fff" ' +
            'stroke="var(--rule)"/>' +
            /* הכותרת: האייקון, השם, והכתובת */
            appIcon(146, 88, 26) +
            '<rect x="66" y="92" width="72" height="6" rx="3" fill="#CFC7B6"/>' +
            '<rect x="88" y="104" width="50" height="5" rx="2.5" fill="#E3DDD0"/>';
    /* שורת אנשים ושורת אפליקציות — מרומזות */
    var i;
    for (i = 0; i < 4; i++)
      h += '<circle cx="' + (158 - i * 34) + '" cy="136" r="11" fill="#EFEADF"/>';
    for (i = 0; i < 4; i++)
      h += '<rect x="' + (147 - i * 34) + '" y="160" width="22" height="22" ' +
           'rx="6" fill="#EFEADF"/>';
    h += '<rect x="30" y="194" width="140" height="1" fill="#EFEADF"/>';
    /* הרשימה. השורה שלנו אחרונה, והיא היחידה בצבע. */
    var rows = [{ w:70, ic:icBookmark }, { w:56, ic:icPlus },
                { w:96, ic:icAddHome, on:1 }];
    rows.forEach(function (r, k) {
      var y = 216 + k * 34, col = r.on ? INK : '#CFC7B6';
      if (r.on) h += rowLit(28, y, 144);
      h += '<rect x="' + (160 - r.w) + '" y="' + (y - 4) + '" width="' + r.w +
           '" height="7" rx="3.5" fill="' + col + '"/>' +
           r.ic(44, y, 1, col);
    });
    /* ============================================================
       "צריך לגלול" — מצויר, ולא רק כתוב.
       ============================================================
       זה הדבר שהכי מפספסים: השורה אינה נראית עד שגוללים. החץ
       יושב **מעל** הרשימה ומצביע פנימה — כלומר "היא נמצאת
       למטה, תמשיכו". חץ מתחת לשורה המודגשת היה אומר את ההפך:
       שצריך להמשיך *אחריה*. */
    h += '<path class="gu-scroll" d="M100 198v9M95 203l5 5 5-5" fill="none" ' +
         'stroke="var(--gold)" stroke-width="2.4" stroke-linecap="round" ' +
         'stroke-linejoin="round"/>';
    return h + ring(44, 284, 15);
  }

  /* ============================================================
     חלון האישור.
     ============================================================
     ה-X משמאל, הכותרת באמצע, ו"הוספה" בכחול למעלה מימין —
     בדיוק כמו בצילום. האייקון והשם מתחת, כי זה מה שמאשר
     שמוסיפים את הדבר הנכון.
     ============================================================ */
  function confirm() {
    return '<rect x="16" y="86" width="168" height="168" rx="18" fill="#fff" ' +
      'stroke="var(--rule)"/>' +
      /* X שמאלה */
      '<circle cx="38" cy="106" r="11" fill="#F1EDE4"/>' +
      '<path d="M34 102l8 8M42 102l-8 8" stroke="#8A8272" stroke-width="1.8" ' +
        'stroke-linecap="round"/>' +
      /* הכותרת */
      '<rect x="72" y="103" width="56" height="7" rx="3.5" fill="#CFC7B6"/>' +
      /* "הוספה" — כחול, למעלה מימין */
      '<rect x="140" y="95" width="34" height="22" rx="11" fill="#0A84FF"/>' +
      '<rect x="148" y="103" width="18" height="6" rx="3" fill="#fff"/>' +
      '<rect x="30" y="132" width="140" height="1" fill="#EFEADF"/>' +
      /* האייקון, השם, והכתובת */
      appIcon(140, 142, 32) +
      '<rect x="62" y="150" width="68" height="7" rx="3.5" fill="#CFC7B6"/>' +
      '<rect x="46" y="168" width="84" height="5" rx="2.5" fill="#E3DDD0"/>' +
      '<rect x="30" y="188" width="140" height="1" fill="#EFEADF"/>' +
      /* המתג */
      '<rect x="84" y="206" width="86" height="6" rx="3" fill="#E3DDD0"/>' +
      '<rect x="32" y="200" width="34" height="19" rx="9.5" fill="#34C759"/>' +
      '<circle cx="56" cy="209.5" r="7.5" fill="#fff"/>' +
      ring(157, 106, 24);
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

  /* ---------- אנדרואיד ---------- */
  function droidDots() {
    return page(60) +
      '<rect x="16" y="26" width="168" height="26" rx="8" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      '<rect x="34" y="36" width="76" height="6" rx="3" fill="#D9D2C4"/>' +
      '<circle cx="166" cy="33" r="2" fill="var(--ink-2)"/>' +
      '<circle cx="166" cy="39" r="2" fill="var(--ink-2)"/>' +
      '<circle cx="166" cy="45" r="2" fill="var(--ink-2)"/>' +
      ring(166, 39, 20);
  }
  function droidMenu() {
    var h = page(40) +
      '<rect x="74" y="52" width="102" height="136" rx="12" fill="#fff" ' +
        'stroke="var(--rule)"/>';
    var i;
    for (i = 0; i < 4; i++) {
      var y = 74 + i * 32, on = (i === 2);
      h += '<rect x="88" y="' + (y - 4) + '" width="' + (on ? 74 : 52) +
           '" height="7" rx="3.5" fill="' + (on ? 'var(--ink-2)' : '#DED7C9') + '"/>';
    }
    return h + ring(125, 138, 28);
  }
  function droidOk() {
    return '<rect x="24" y="110" width="152" height="120" rx="16" fill="#fff" ' +
      'stroke="var(--rule)"/>' +
      '<rect x="46" y="132" width="40" height="40" rx="10" fill="var(--blue)"/>' +
      '<path d="M55 160c5-13 12-16 18-17" fill="none" stroke="#fff" ' +
        'stroke-width="2.8" stroke-linecap="round"/>' +
      '<rect x="96" y="140" width="60" height="7" rx="3.5" fill="#DED7C9"/>' +
      '<rect x="96" y="156" width="40" height="6" rx="3" fill="#E3DDD0"/>' +
      '<rect x="112" y="192" width="50" height="24" rx="12" fill="var(--blue)"/>' +
      '<rect x="126" y="201" width="22" height="6" rx="3" fill="#fff"/>' +
      ring(137, 204, 26);
  }

  /* ---------- שלושת המסלולים ----------
     כל שלב: הכיתוב, ההסבר, והציור. */
  var DROID = [['a1', droidDots], ['a2', droidMenu], ['a3', droidOk]];
  var TAIL  = [['s3', sheet], ['s4', confirm], ['s5', home]];
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
