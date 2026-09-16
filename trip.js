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
  var st = null;            /* { i:<שלב>, seen:<נשאל על חזרה> } */
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

  /* ---------- המצב ---------- */
  function load() {
    try { return JSON.parse(ls(KEY) || 'null'); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function on() { return !!st; }

  /* ============================================================
     השלבים.
     ============================================================
     `done` קיים = משימה, והוא נבדק מול מצב המכשיר. אין `done`
     = היכרות, שנגמרת ב"הבא".

     `go` הוא מה שמחזיר אותו למקום הנכון כשהוא מגיע לשלב
     בעמוד אחר — לא קפיצה בכוח, אלא קישור שהוא לוחץ.
     ============================================================ */
  var STEPS = [
    { k:'s1' },
    { k:'s2', done:function () { return !!ls('dfReg'); } },
    { k:'s3', done:function () { return ls('df:ramsWa') === '1'; } },
    { k:'s4', hail:'s4done',
      done:function () {
        return !!(window.APPX && APPX.installed && APPX.installed());
      } },
    { k:'s5' },
    { k:'s6' },
    { k:'s7', fin:1 }
  ];

  function step() { return STEPS[Math.max(0, Math.min(st.i, STEPS.length - 1))]; }

  /* ---------- העיצוב ----------
     נטען פעם אחת, ומגיע מכאן ולא מהעמוד: עמוד חדש שירצה את
     המסע צריך שורת <script> אחת, ואין מה לשכוח להעתיק. */
  function css() {
    if ($('trip-css')) return;
    var s = document.createElement('style');
    s.id = 'trip-css';
    s.textContent = [
      '#trip{position:fixed;inset-inline:0;top:0;z-index:70;',
      '  background:var(--blue-d,#0B2550);color:#fff;',
      '  box-shadow:0 4px 18px rgba(11,37,80,.28);',
      '  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
      '  padding:10px 14px calc(10px + env(safe-area-inset-top,0px));',
      '  padding-top:calc(10px + env(safe-area-inset-top,0px))}',
      '#trip .in{max-width:34rem;margin:0 auto}',
      /* מד השלבים — אותה שפה של מסך ההתקנה */
      '#trip .bars{display:flex;gap:5px;justify-content:center;margin-bottom:8px}',
      '#trip .bars i{height:4px;border-radius:2px;flex:1;max-width:38px;',
      '  background:rgba(255,255,255,.22)}',
      '#trip .bars i.did{background:var(--green,#6FA83B)}',
      '#trip .bars i.on{background:var(--gold-l,#E5B854)}',
      '#trip .row{display:flex;align-items:center;gap:10px}',
      '#trip .txt{flex:1;min-width:0}',
      '#trip .n{font-size:.66rem;font-weight:800;letter-spacing:.08em;',
      '  color:var(--gold-l,#E5B854)}',
      '#trip b{display:block;font-size:.98rem;font-weight:800;',
      '  letter-spacing:-.02em;line-height:1.3;margin-top:1px}',
      '#trip span.s{display:block;font-size:.78rem;font-weight:600;',
      '  color:rgba(255,255,255,.78);line-height:1.45;margin-top:2px}',
      '#trip .go{flex:none;border:0;border-radius:10px;background:#fff;',
      '  color:var(--blue-d,#0B2550);font:inherit;font-size:.85rem;',
      '  font-weight:800;padding:9px 15px;cursor:pointer}',
      '#trip .x{flex:none;border:0;background:none;color:rgba(255,255,255,.6);',
      '  font:inherit;font-size:1.1rem;font-weight:700;cursor:pointer;',
      '  padding:4px 6px;line-height:1}',
      /* ============================================================
         הברכה — רגע אחד, ואז ממשיכים.
         ============================================================
         **והמד נצבע מחדש עליה.** ירוק על ירוק אינו נקרא: השלבים
         שכבר נעשו נבלעו ברקע, ומה שעוד לא נעשה — לבן שקוף על
         ירוק — נראה דווקא כאילו כן. כלומר בדיוק ברגע החגיגה
         המונה שיקר. */
      '#trip.hail{background:var(--green-2,#3A6615)}',
      '#trip.hail .bars i{background:rgba(0,0,0,.28)}',
      '#trip.hail .bars i.did{background:rgba(255,255,255,.9)}',
      '#trip.hail .bars i.on{background:var(--gold-l,#E5B854)}',
      /* השאלה למי שחזר באמצע */
      '#trip-ask{position:fixed;inset:0;z-index:160;display:flex;',
      '  align-items:center;justify-content:center;padding:22px;',
      '  background:rgba(11,37,80,.55)}',
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

    el.className = st.hail ? 'hail' : '';
    var ttl = st.hail ? t(s.hail) : t(s.k);
    var sub = st.hail ? t(s.hail + 'B') : t(s.k + 'b');
    /* כפתור רק כשיש מה ללחוץ עליו: היכרות, ברכה, וסיום.
       במשימה אין כפתור — מה שמקדם אותה הוא לעשות אותה. */
    var btn = (st.hail || !s.done)
      ? '<button class="go" id="trip-go">' +
        esc(last ? t('finGo') : t('next')) + '</button>' : '';

    el.innerHTML = '<div class="in">' +
      '<div class="bars">' + bars + '</div>' +
      '<div class="row"><div class="txt">' +
      '<div class="n">' + esc(fill(t('of'), { n:st.i + 1, all:STEPS.length })) + '</div>' +
      '<b>' + esc(ttl) + '</b>' +
      (sub ? '<span class="s">' + esc(sub) + '</span>' : '') +
      '</div>' + btn +
      '<button class="x" id="trip-x" aria-label="' + esc(t('quit')) + '">✕</button>' +
      '</div></div>';

    $('trip-x').onclick = function () {
      if (confirm(t('quitAsk'))) stop();
    };
    var g = $('trip-go');
    if (g) g.onclick = function () {
      if (st.hail) { st.hail = 0; bump(); } else bump();
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
    if (!on() || st.hail) return;
    var s = step();
    if (!s.done || !s.done()) return;
    if (s.hail) { st.hail = 1; save(); paint(); return; }
    bump();
  }

  /* ---------- חזרה באמצע ---------- */
  function askBack(after) {
    css();
    var w = document.createElement('div');
    w.id = 'trip-ask';
    w.innerHTML = '<div class="box"><h3>' + esc(t('backH')) + '</h3>' +
      '<p>' + esc(fill(t('backB'), { n:st.i + 1 })) + '</p>' +
      '<button id="trip-cont">' + esc(t('backGo')) + '</button>' +
      '<button class="alt" id="trip-new">' + esc(t('backNew')) + '</button></div>';
    document.body.appendChild(w);
    var kill = function () { if (w.parentNode) w.parentNode.removeChild(w); };
    $('trip-cont').onclick = function () { kill(); after(); };
    $('trip-new').onclick = function () { st.i = 0; st.hail = 0; save(); kill(); after(); };
  }

  /* ---------- הדלקה וכיבוי ---------- */
  function start() {
    st = { i:0, hail:0 };
    save();
    run();
  }
  function stop() {
    st = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
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

  function boot() {
    if (!document.body) return;
    var wants = /[?&]masa=1\b/.test(location.search);
    st = load();
    if (wants && !st) { start(); return; }
    if (!st) return;
    /* חזר באמצע — שואלים אותו, פעם אחת לכניסה. */
    if (st.i > 0 && !asked && wants) { asked = true; askBack(run); return; }
    run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  return { start:start, stop:stop, on:on, paint:paint, check:check,
           at:function () { return st ? st.i : -1; },
           steps:function () { return STEPS.length; } };
})();
