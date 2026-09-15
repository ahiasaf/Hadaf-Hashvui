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

  /* ---------- שלב 1, אייפון חדש: הסרגל המכווץ ---------- */
  function barNew() {
    return page(50) +
      /* הסרגל התחתון, כפי שהוא ב-iOS 26: גלולות נפרדות */
      '<rect x="24" y="288" width="34" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      '<circle cx="34" cy="301" r="2" fill="var(--ink-2)"/>' +
      '<circle cx="41" cy="301" r="2" fill="var(--ink-2)"/>' +
      '<circle cx="48" cy="301" r="2" fill="var(--ink-2)"/>' +
      '<rect x="64" y="288" width="88" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      '<rect x="76" y="298" width="64" height="6" rx="3" fill="#D9D2C4"/>' +
      '<rect x="158" y="288" width="26" height="26" rx="13" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      ring(41, 301, 22);
  }

  /* ---------- שלב 2, אייפון חדש: התפריט ---------- */
  function menuNew() {
    var rows = ['שיתוף', 'הוספה אל סימניות', 'כרטיסייה חדשה'];
    var h = page(40) +
      '<rect x="26" y="150" width="148" height="128" rx="16" fill="#fff" ' +
        'stroke="var(--rule)"/>';
    rows.forEach(function (t, i) {
      var y = 172 + i * 38;
      h += '<rect x="40" y="' + (y - 5) + '" width="' + (92 - i * 10) +
           '" height="7" rx="3.5" fill="' + (i ? '#DED7C9' : 'var(--ink-2)') + '"/>' +
           '<rect x="146" y="' + (y - 9) + '" width="14" height="14" rx="3" ' +
           'fill="none" stroke="' + (i ? '#DED7C9' : 'var(--ink-2)') +
           '" stroke-width="1.6"/>';
    });
    return h + ring(100, 168, 30);
  }

  /* ---------- שלב 1, אייפון ישן: הסמל בסרגל ---------- */
  function barOld() {
    return page(50) +
      '<rect x="20" y="286" width="160" height="30" rx="10" fill="#fff" ' +
        'stroke="var(--rule)"/>' +
      /* סמל השיתוף: ריבוע וחץ כלפי מעלה */
      '<path d="M100 294v13M95 299l5-5 5 5" fill="none" stroke="var(--ink-2)" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M92 302v7h16v-7" fill="none" stroke="var(--ink-2)" ' +
        'stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="30" y="297" width="40" height="6" rx="3" fill="#D9D2C4"/>' +
      '<rect x="134" y="297" width="34" height="6" rx="3" fill="#D9D2C4"/>' +
      ring(100, 301, 22);
  }

  /* ---------- גיליון השיתוף, גלול אל "הוספה למסך הבית" ---------- */
  function sheet() {
    var h = '<rect x="16" y="90" width="168" height="236" rx="18" fill="#fff" ' +
            'stroke="var(--rule)"/>' +
            '<rect x="70" y="100" width="60" height="5" rx="2.5" fill="#DED7C9"/>';
    /* שלוש שורות, והשלישית היא שלנו */
    var rows = 3, i;
    for (i = 0; i < rows; i++) {
      var y = 130 + i * 44, on = (i === 2);
      h += '<rect x="34" y="' + (y - 4) + '" width="' + (on ? 104 : 74) +
           '" height="7" rx="3.5" fill="' + (on ? 'var(--ink-2)' : '#DED7C9') + '"/>' +
           '<rect x="150" y="' + (y - 9) + '" width="16" height="16" rx="4" ' +
           'fill="none" stroke="' + (on ? 'var(--ink-2)' : '#DED7C9') +
           '" stroke-width="1.7"/>';
      if (on) {
        /* סימן הפלוס, כמו באייפון */
        h += '<path d="M158 213v6M155 216h6" stroke="var(--ink-2)" ' +
             'stroke-width="1.7" stroke-linecap="round"/>';
      }
    }
    /* חץ גלילה — "צריך לגלול", וזה מה שאנשים מפספסים */
    h += '<path class="gu-scroll" d="M100 262v22M92 276l8 8 8-8" fill="none" ' +
         'stroke="var(--gold)" stroke-width="2.6" stroke-linecap="round" ' +
         'stroke-linejoin="round"/>';
    return h + ring(100, 218, 32);
  }

  /* ---------- חלון האישור ---------- */
  function confirm() {
    return '<rect x="16" y="96" width="168" height="150" rx="18" fill="#fff" ' +
      'stroke="var(--rule)"/>' +
      '<rect x="32" y="112" width="44" height="7" rx="3.5" fill="#DED7C9"/>' +
      /* "הוסף" — למעלה מימין, כמו באייפון בעברית */
      '<rect x="124" y="108" width="44" height="22" rx="11" fill="var(--blue)"/>' +
      '<rect x="136" y="116" width="20" height="6" rx="3" fill="#fff"/>' +
      /* האייקון שלנו, מרומז */
      '<rect x="80" y="150" width="40" height="40" rx="10" fill="var(--blue)"/>' +
      '<path d="M90 178c6-16 14-20 22-22" fill="none" stroke="#fff" ' +
        'stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="62" y="204" width="76" height="7" rx="3.5" fill="#DED7C9"/>' +
      ring(146, 119, 24);
  }

  /* ---------- מסך הבית, והאייקון שנוסף ---------- */
  function home() {
    var h = '', r, c;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 4; c++) {
        var x = 30 + c * 36, y = 60 + r * 46;
        var mine = (r === 1 && c === 1);
        if (mine) continue;
        h += '<rect x="' + x + '" y="' + y + '" width="28" height="28" rx="8" ' +
             'fill="#E3DDD0"/>';
      }
    }
    /* שלנו — במקום קבוע, וצבוע */
    h += '<rect x="66" y="106" width="28" height="28" rx="8" fill="var(--blue)"/>' +
         '<path d="M73 128c4-11 10-14 15-15" fill="none" stroke="#fff" ' +
           'stroke-width="2.4" stroke-linecap="round"/>' +
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
