/* ============================================================
   עריכת המלל על המסך — משותפת לכל העמודים.
   ============================================================
   עד עכשיו העורך ישב בתוך index.html, ולכן הוא הגיע לשלושה
   מסכים בלבד: בית, הרשמה ושבוע. מתוך 189 שדות המלל שבתוכנית
   הוא נגע ב-91. מסך ההצטרפות של התלמיד — 57 שדות, המלל הכי
   חשוף בתוכנית כולה — לא היה נגיש כלל, וגם לא עמוד הזכויות
   ולא המדריך. הרשימה השטוחה בניהול הייתה הדרך היחידה אליהם.

   כאן הוא הופך לקובץ אחד שכל עמוד טוען. `index.html` ו-`join.html`
   מפעילים אותו על עצמם, `rights.html` על עצמו, וכל אחד מספק את
   מה שרק הוא יודע: מה לצייר מחדש, מה לסרוק, ולאן אפשר לנווט.

   **הדף האינטראקטיבי אינו כאן בכוונה.** לו יש סטודיו.

   ------------------------------------------------------------
   מקור אחד לכל מפתח.

   הכלל שנשבר קודם: הבאנר הכחול הוא רכיב אחד (`stage.js`) והופיע
   בשני מסכים, אבל כל מסך החיל את המלל בדרכו — ולכן עריכה שינתה
   אותו במקום אחד בלבד. כאן יש פונקציה אחת שמחילה, וכל עמוד קורא
   לה. מפתח אחד = נוסח אחד, בכל מסך שהוא מופיע בו.
   ------------------------------------------------------------ */
var TX = (function () {

  var ROOTS = null, BASE = {}, OPEN = '', ON = false, READY = false;
  var HOOK = {
    repaint: function () {},
    root:    function () { return document.body; },
    places:  [],                 /* [[כיתוב, פונקציה]] — ניווט בין מסכים */
    onStop:  null
  };

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- השורשים והנוסח שבקוד ---------- */
  function roots() {
    if (ROOTS) return ROOTS;
    ROOTS = { fit:window.FIT, ui:window.UI, sfarim:window.SFARIM,
              rights:window.RIGHTS, join:window.JOIN, gate:window.GATE,
              tour:window.TOUR, a11y:window.A11Y, info:window.INFO,
              tzevet:window.TZEVET, play:window.PLAY,
              /* הבקשה האישית לראש החטיבה — אותו מנגנון של
                 `tzevet`, ולכן גם היא ניתנת לעריכה ולפרסום. */
              head:window.HEAD_ASK,
              /* המסגרת המשותפת לשני התפקידים — ראו `ASK_UI`. */
              askui:window.ASK_UI,
              /* רק מה ששונה בלשון נקבה — ראו `HEAD_ASK_F`. */
              headf:window.HEAD_ASK_F,
              /* מדריך ההתקנה המאויר. */
              guide:window.GUIDE,
              /* ההצגה לראשי החטיבות — /matana. */
              show:window.SHOW,
              /* אזור הניהול האישי — בעמוד הראשי ובעמוד הצוות. */
              panel:window.PANEL };
    return ROOTS;
  }
  function ref(k) {
    var p = k.split('.'), o = roots()[p[0]];
    for (var i = 1; i < p.length - 1 && o; i++) o = o[p[i]];
    return o ? { o:o, f:p[p.length - 1] } : null;
  }
  function get(k) { var r = ref(k); return r ? r.o[r.f] : ''; }
  function set(k, v) { var r = ref(k); if (r) r.o[r.f] = v; }

  /* ---------- רשת הביטחון: שום נוסח אינו נעלם ----------
     `TEXT_FIELDS` נכתב ביד, והוא מה שמסך הניהול מציג. לכן כל
     נוסח שנוסף ל-data.js ולא נוספה לו שורה ברשימה פשוט לא
     היה קיים בניהול — לא לעריכה, לא לפרסום, ולא לסימון על
     המסך. אחיאסף גילה את זה אחד־אחד, מסך אחרי מסך, וכל תיקון
     ניסוח קטן היה חייב לעבור דרך מתכנת.

     כאן זה נסגר מהשורש: לפני הצילום סורקים את כל השורשים,
     וכל מפתח שאין לו שורה מקבל שורה. תיאור ידני עדיף ותמיד
     יגבר — אבל היעדרו כבר אינו מסתיר את הנוסח, אלא רק שולח
     אותו לקבוצה האחרונה. נוסח שנוסף בעמוד חדש מופיע בניהול
     מעצמו, בלי שאיש יזכור.

     `tools/preflight.py` סופר כמה נוספו כך ומתריע, כדי שגם
     התיאור הידני יגיע בסוף. */
  var AUTO = [];
  function fill() {
    if (!window.TEXT_FIELDS) return;
    var seen = {}, i;
    for (i = 0; i < TEXT_FIELDS.length; i++) {
      if (TEXT_FIELDS[i].k) seen[TEXT_FIELDS[i].k] = 1;
    }
    var R = roots();
    var add = [];
    /* מזהה וגוון אינם מלל אלא ברגים, ושורה לעריכה עליהם היא
       הזמנה לשבור מסך. הם היחידים שאינם עולים לניהול. */
    var NOTTEXT = /\.(id|tone|key|code|src|hi)$/;
    var walk = function (pre, o, depth) {
      if (!o || depth > 4) return;
      for (var kk in o) {
        if (!o.hasOwnProperty(kk)) continue;
        var v = o[kk], key = pre + '.' + kk;
        if (typeof v === 'string') {
          if (!seen[key] && !NOTTEXT.test(key)) { seen[key] = 1; add.push(key); }
        } else if (v && typeof v === 'object') {
          /* גם מערכים — `fit.items.0.t` הוא מפתח חוקי, ו-`ref()`
             כבר יודע ללכת בו. מערך שנשאר בחוץ הוא בדיוק הסוג
             של נוסח שנעלם בשקט. */
          walk(key, v, depth + 1);
        }
      }
    };
    for (var r in R) if (R.hasOwnProperty(r)) walk(r, R[r], 1);
    if (!add.length) return;
    AUTO = add;
    TEXT_FIELDS.push({ g:'נוסחים שעדיין אין להם תיאור \u2014 הם עובדים, ' +
                          'רק שמם הוא שם המפתח שבקוד' });
    for (i = 0; i < add.length; i++) {
      var val = get(add[i]);
      TEXT_FIELDS.push({ k:add[i], lbl:add[i], auto:1,
                         ml:(typeof val === 'string' && val.length > 70) ? 1 : 0 });
    }
  }

  /* הנוסח שבקוד, מצולם לפני שמישהו דרס אותו. חייב לרוץ לפני
     כל החלה — לכן `snap()` נקרא מיד בטעינת הקובץ, וקובץ זה
     נטען מיד אחרי data.js. */
  function snap() {
    if (READY || !window.TEXT_FIELDS) return;
    fill();
    TEXT_FIELDS.forEach(function (f) { if (f.k) BASE[f.k] = get(f.k); });
    READY = true;
  }

  /* ---------- שלוש השכבות ----------
     קוד → מה שפורסם → טיוטה מקומית. תמיד בסדר הזה, ותמיד
     מהתחלה: החלה מצטברת אינה יכולה להחזיר לאחור, ונוסח שנמחק
     היה נשאר על המסך עד רענון. */
  function retired(k, v) {
    var dead = (window.TEXT_RETIRED || {})[k];
    return !!(dead && dead.indexOf(v) >= 0);
  }
  function over(map) {
    if (!map) return;
    for (var k in map) {
      if (!map.hasOwnProperty(k)) continue;
      if (typeof map[k] !== 'string' || map[k] === '') continue;
      if (retired(k, map[k])) continue;
      set(k, map[k]);
    }
  }
  function layer(published, draft) {
    snap();
    for (var k in BASE) if (BASE.hasOwnProperty(k)) set(k, BASE[k]);
    over(published);
    over(draft);
  }

  /* השכבה שמתחת לטיוטה — היא ולא הקוד קובעת אם עריכה היא שינוי.
     כשהגיליון מפרסם נוסח אחר, הקלדת הנוסח שבקוד *היא* שינוי. */
  function below(published, k) {
    var p = published && published[k];
    return (typeof p === 'string' && p !== '' && !retired(k, p)) ? p : BASE[k];
  }

  /* ---------- טיוטה ---------- */
  function draft() {
    try { return (JSON.parse(localStorage.getItem('df:cfg') || '{}')).texts || {}; }
    catch (e) { return {}; }
  }
  function draftSave(t) {
    try {
      var c = JSON.parse(localStorage.getItem('df:cfg') || '{}');
      c.texts = t;
      localStorage.setItem('df:cfg', JSON.stringify(c));
    } catch (e) {}
  }
  function published() {
    try { return JSON.parse(localStorage.getItem('df:textCache') || 'null') || {}; }
    catch (e) { return {}; }
  }

  /* ---------- התאמת נוסח לאיבר על המסך ----------
     התגיות נמחקות ולא מוחלפות ברווח, כי כך גם הדפדפן: textContent
     של <br> אינו רווח. שני הצדדים של ההשוואה חייבים להתנהג אותו
     דבר. ו-{n}, {inst} וחבריהם מוחלפים בזמן אמת, ולכן הם חורים
     בביטוי ולא טקסט. */
  function norm(s) {
    return String(s == null ? '' : s).replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  function rex(v) {
    var parts = norm(v).split(/\{\w+\}/).map(function (x) {
      return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    return new RegExp('^' + parts.join('[\\s\\S]*?') + '$');
  }

  function mine(k, roots) {
    for (var i = 0; i < roots.length; i++)
      if (k.indexOf(roots[i] + '.') === 0) return true;
    return false;
  }
  function scan() {
    var was = document.querySelectorAll('[data-tk]');
    for (var i = 0; i < was.length; i++) {
      was[i].removeAttribute('data-tk');
      was[i].classList.remove('tk-hot', 'tk-on');
    }
    if (!ON) return;
    var host = HOOK.root();
    if (!host) return;
    var els = host.getElementsByTagName('*');

    /* ============================================================
       **המסך שלפנינו קודם.**
       ============================================================
       שני מפתחות יכולים לשאת בדיוק אותו נוסח — "הבא" הוא גם
       הכפתור של מדריך ההתקנה וגם הכפתור של ההצגה. הסריקה עוברת
       על `TEXT_FIELDS` לפי סדר, והראשון שתאם חוטף את האלמנט:
       בהצגה זה היה `guide.next`, והקשה עליו הייתה משנה את
       המדריך במקום את המצגת — בלי שום סימן.

       עמוד שמצהיר על השורשים שלו (`roots` ב-`TX.init`) מקבל
       אותם ראשונים, ורק אחריהם כל השאר. עמוד שאינו מצהיר
       מתנהג בדיוק כמו קודם. */
    var own = HOOK.roots || [];
    var order = own.length
      ? TEXT_FIELDS.filter(function (f) { return f.k && mine(f.k, own); })
          .concat(TEXT_FIELDS.filter(function (f) { return !f.k || !mine(f.k, own); }))
      : TEXT_FIELDS;

    order.forEach(function (f) {
      if (!f.k || f.img) return;
      var v = norm(get(f.k));
      if (!v) return;
      /* ============================================================
         **נוסח שכולו תבנית אינו מזהה דבר.**
         ============================================================
         `{name}` לבדו נעשה הביטוי `^[\s\S]*?$`, שמתאים לכל טקסט
         שהוא — ולכן הוא חטף אלמנט שרירותי בכל עמוד וסימן אותו
         כניתן לעריכה. הקשה עליו פתחה מפתח שאין לו שום קשר למה
         שנגעו בו.

         אין דרך לזהות נוסח כזה על המסך, כי אין בו אות אחת קבועה
         להיאחז בה. הוא נערך מהרשימה שבניהול, שם הוא מופיע בשמו. */
      if (!v.split(/\{\w+\}/).join('')) return;
      var re = rex(v), best = null, bestN = 1e9;
      for (var j = 0; j < els.length; j++) {
        var el = els[j];
        if (el.getAttribute('data-tk')) continue;
        /* ============================================================
           **מה שאינו על המסך אינו נתפס.**
           ============================================================
           `textContent` של אלמנט מוסתר נקרא בדיוק כמו של גלוי, ולכן
           מפתח יכול היה לתפוס דווקא את העותק שאי אפשר להקיש עליו —
           ואז המפתח האמיתי, זה שכן מוצג, נשאר בלי כלום.

           זה קרה בהצגה: מדריך ההתקנה מוצג שם בלי הכפתורים שלו
           (`display:none`), ו"הבא" של המדריך חטף את כפתור הניווט
           של המצגת. הקשה עליו הייתה משנה את המדריך — בשקט.

           `getClientRects` ריק רק למי שאינו מצויר כלל, ולכן אלמנט
           קבוע (`position:fixed`) או שקוף עדיין נספרים. */
        if (!el.getClientRects().length) continue;
        /* **ואלמנט בלי מלל אינו מלל.** נוסח שכולו תבנית — `{name}`
           לבדו — נעשה ביטוי שמתאים גם למחרוזת ריקה, ולכן חטף את
           ה-`<img>` או ה-`<br>` הראשון בעמוד וסימן אותו כניתן
           לעריכה. אי אפשר להקיש על מילה שאינה שם. */
        var txt = norm(el.textContent);
        if (!txt) continue;
        if (!re.test(txt)) continue;
        var n = el.getElementsByTagName('*').length;   /* הקטן ביותר שתואם */
        if (n < bestN) { best = el; bestN = n; }
      }
      if (best) {
        best.setAttribute('data-tk', f.k);
        best.classList.add('tk-hot');
        if (f.k === OPEN) best.classList.add('tk-on');
      }
    });
  }

  /* ---------- הסרגל והיריעה ---------- */
  function styles() {
    if ($('tk-css')) return;
    var s = document.createElement('style');
    s.id = 'tk-css';
    s.textContent =
      'body.tediting{padding-bottom:74px}' +
      /* מסגרת ולא רקע: רקע צבעוני משנה את מה שבאים לשפוט, וכל
         העניין כאן הוא לראות את הנוסח כפי שהוא ייראה באמת. */
      '.tk-hot{outline:1.5px dashed rgba(192,143,43,.75);outline-offset:3px;' +
      'border-radius:5px;cursor:text}' +
      '.tk-on{outline:2px solid #C08F2B;outline-offset:3px;' +
      'background:rgba(227,180,74,.14)}' +
      '#tk-bar{position:fixed;left:0;right:0;bottom:0;z-index:1300;display:flex;' +
      'align-items:center;gap:7px;flex-wrap:wrap;' +
      'padding:10px 12px calc(10px + env(safe-area-inset-bottom));' +
      'background:#0B2550;box-shadow:0 -6px 22px rgba(11,37,80,.3);' +
      'font-family:inherit}' +
      '#tk-bar button{border:none;border-radius:10px;padding:9px 12px;' +
      'font:inherit;font-size:.83rem;font-weight:800;' +
      'background:rgba(255,255,255,.14);color:#fff;cursor:pointer}' +
      '#tk-bar button.done{background:#C08F2B;margin-inline-start:auto}' +
      '#tk-bar span{font-size:.72rem;color:rgba(255,255,255,.6);font-weight:700}' +
      '#tk-sheet{position:fixed;left:0;right:0;bottom:0;z-index:1400;display:none;' +
      'background:#FBF8F2;border-radius:18px 18px 0 0;padding:14px 16px ' +
      'calc(14px + env(safe-area-inset-bottom));' +
      'box-shadow:0 -10px 34px rgba(11,37,80,.28);font-family:inherit}' +
      '#tk-sheet.on{display:block;animation:tkup .18s ease}' +
      /* היריעה והסרגל חולקים את תחתית המסך. פתוחה — היא מכסה,
         ולכן הסרגל יורד; יש בה כפתור סגירה משלה, אז אין מבוי סתום. */
      'body.tk-sheeting #tk-bar{display:none}' +
      '@keyframes tkup{from{transform:translateY(16px);opacity:.4}' +
      'to{transform:none;opacity:1}}' +
      '#tk-sheet .hd{display:flex;align-items:center;justify-content:space-between;' +
      'gap:10px;margin-bottom:9px}' +
      '#tk-sheet .hd b{font-size:.9rem;font-weight:800}' +
      '#tk-sheet .hd button,#tk-sheet .ft button{border:1px solid #E7E0D3;' +
      'background:#F2EDE2;border-radius:9px;padding:6px 11px;font:inherit;' +
      'font-size:.78rem;font-weight:800;color:#5A5344;cursor:pointer}' +
      '#tk-sheet textarea{width:100%;font:inherit;font-size:.95rem;font-weight:600;' +
      'line-height:1.6;padding:11px;border-radius:11px;border:1px solid #E7E0D3;' +
      'background:#fff;resize:vertical}' +
      '#tk-sheet .ft{display:flex;align-items:center;justify-content:space-between;' +
      'margin-top:9px}' +
      '#tk-sheet .ft span{font-size:.74rem;color:#8A8272;font-weight:700}';
    document.head.appendChild(s);
  }

  function bar() {
    if ($('tk-bar')) return;
    var b = document.createElement('div');
    b.id = 'tk-bar';
    HOOK.places.forEach(function (p, i) {
      var btn = document.createElement('button');
      btn.textContent = p[0];
      btn.onclick = function () { p[1](); setTimeout(scan, 40); };
      b.appendChild(btn);
      if (i === HOOK.places.length - 1) {
        var sp = document.createElement('span');
        sp.textContent = 'הקישו על טקסט כדי לערוך';
        b.appendChild(sp);
      }
    });
    if (!HOOK.places.length) {
      var sp2 = document.createElement('span');
      sp2.textContent = 'הקישו על טקסט כדי לערוך';
      b.appendChild(sp2);
    }
    var done = document.createElement('button');
    done.className = 'done';
    done.textContent = 'סיום';
    done.onclick = stop;
    b.appendChild(done);
    document.body.appendChild(b);
  }

  function open(k) {
    var f = null;
    TEXT_FIELDS.forEach(function (x) { if (x.k === k) f = x; });
    if (!f) return;
    OPEN = k;
    var s = $('tk-sheet');
    if (!s) { s = document.createElement('div'); s.id = 'tk-sheet';
              document.body.appendChild(s); }
    var t = draft(), b = below(published(), k);
    var changed = t[k] != null && t[k] !== b;
    s.innerHTML =
      '<div class="hd"><b>' + esc(f.lbl) + '</b>' +
      '<button id="tk-x">סגירה</button></div>' +
      '<textarea id="tk-in" rows="' + (f.ml ? 4 : 2) + '">' +
      esc(get(k)) + '</textarea>' +
      '<div class="ft"><span>' +
      (changed ? 'שונה — טרם פורסם' : 'כפי שהוא מפורסם') +
      '</span><button id="tk-rst">שחזור</button></div>';
    s.classList.add('on');
    document.body.classList.add('tk-sheeting');
    $('tk-x').onclick = close;
    $('tk-rst').onclick = function () { reset(k); };
    var ta = $('tk-in');
    ta.oninput = function () { type(ta.value); };
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    scan();
    var host = document.querySelector('[data-tk="' + k + '"]');
    if (host && host.scrollIntoView) host.scrollIntoView({ block:'center' });
  }
  function close() {
    OPEN = '';
    var s = $('tk-sheet');
    if (s) s.classList.remove('on');
    document.body.classList.remove('tk-sheeting');
    scan();
  }

  /* כל הקלדה נשמרת ומצטיירת. הגיליון אינו מעורב — פרסום נשאר
     פעולה נפרדת ומכוונת. */
  function type(v) {
    if (!OPEN) return;
    var t = draft(), k = OPEN, b = below(published(), k);
    if (String(v).trim() === '' || v === b) delete t[k]; else t[k] = v;
    draftSave(t);
    layer(published(), t);
    HOOK.repaint();
    scan();
  }
  function reset(k) {
    var t = draft();
    delete t[k];
    draftSave(t);
    layer(published(), t);
    HOOK.repaint();
    open(k);
  }

  function start() {
    snap();
    styles();
    ON = true;
    document.body.classList.add('tediting');
    bar();
    scan();
  }
  function stop() {
    ON = false; OPEN = '';
    document.body.classList.remove('tediting', 'tk-sheeting');
    var b = $('tk-bar'); if (b) b.parentNode.removeChild(b);
    close();
    scan();
    if (HOOK.onStop) HOOK.onStop();
  }

  /* בשלב לכידה, כדי שהקשה על כפתור תפתח אותו לעריכה במקום
     להפעיל אותו. הסרגל והיריעה פטורים, אחרת אין יציאה. */
  document.addEventListener('click', function (e) {
    if (!ON) return;
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#tk-bar') || t.closest('#tk-sheet')) return;
    e.preventDefault(); e.stopPropagation();
    var host = t.closest('[data-tk]');
    if (host) open(host.getAttribute('data-tk')); else close();
  }, true);

  /* רק מי שהניהול פתוח אצלו במכשיר. */
  function allowed() {
    try { return localStorage.getItem('df:admOk') === '1'; } catch (e) { return false; }
  }

  return {
    init: function (hook) {
      for (var k in hook) if (hook.hasOwnProperty(k)) HOOK[k] = hook[k];
      snap();
      /* `?tedit=1` — כך הניהול שולח לערוך מסך אחר. */
      if (allowed() && /[?&]tedit=1/.test(location.search)) {
        if (document.readyState === 'loading')
          document.addEventListener('DOMContentLoaded', function () {
            setTimeout(start, 300);
          });
        else setTimeout(start, 300);
      }
    },
    layer: layer, below: below, base: function (k) { return BASE[k]; },
    get: get, set: set, draft: draft, draftSave: draftSave,
    auto: function () { return AUTO; },
    published: published, snap: snap,
    start: start, stop: stop, scan: scan, open: open,
    allowed: allowed,
    on: function () { return ON; }
  };
})();
