
/* ============================================================
   הגיליון התחתון והמסגרת הנוסעת.
   ============================================================
   בטלפון מגירת הביאור היא גיליון: גובהה כגובה התוכן, עד תקרה,
   ועם ידית. גרירה למעלה פותחת למסך מלא, גרירה למטה משאירה הצצה,
   והקשה על הידית מחליפה בין השניים. בכל שינוי גובה הבמה נמדדת
   מחדש (`focus`), כדי שהקטע יישאר ממורכז במה שנשאר.

   המסגרת (`#glow`) היא מלבן אחד שחי בין הקטעים ונוסע ביניהם -
   בניגוד למסכה שמצוירת מחדש בכל קטע. ES5 בלבד.
   ============================================================ */
var SHEET = '';   /* '' = לפי התוכן, 'peek' = הצצה, 'full' = מסך מלא */

function sheetSet(mode) {
  SHEET = mode;
  document.body.classList.toggle('sheet-peek', mode === 'peek');
  document.body.classList.toggle('sheet-full', mode === 'full');
  setTimeout(function () { if (FLAT.length) focus(); }, 60);
}

function sheetInit() {
  var head = $('chd');
  if (!head) return;
  var y0 = 0, moved = 0, dragging = false;
  head.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    dragging = true; moved = 0; y0 = e.clientY;
    try { head.setPointerCapture(e.pointerId); } catch (err) {}
  });
  head.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    moved = e.clientY - y0;
  });
  function end(e) {
    if (!dragging) return;
    dragging = false;
    if (e && e.target && e.target.closest && e.target.closest('button')) return;
    if (moved < -40) sheetSet('full');
    else if (moved > 40) sheetSet(SHEET === 'full' ? '' : 'peek');
    else if (Math.abs(moved) < 8) sheetSet(SHEET === 'full' ? '' : 'full');
  }
  head.addEventListener('pointerup', end);
  head.addEventListener('pointercancel', end);
}

/* מסגרת הזהב: תיבת הגבול של הקטע, באותו מרחב של #ov. */
function glowPaint() {
  var svg = $('glow'), st = FLAT[IDX];
  if (!svg) return;
  var rect = svg.querySelector('rect');
  if (!st || !rect) { svg.style.opacity = '0'; return; }
  var d = PAGES[st.p].d;
  var VW = 1000, VH = Math.round(1000 * R);
  var x0 = 1, y0 = 1, x1 = 0, y1 = 0, any = false;
  bands(d, st.g).forEach(function (r) {
    any = true;
    x0 = Math.min(x0, r.x0); x1 = Math.max(x1, r.x1);
    y0 = Math.min(y0, r.y0); y1 = Math.max(y1, r.y1);
  });
  if (!any) { svg.style.opacity = '0'; return; }
  svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
  var pad = 6;
  rect.style.x = (x0 * VW - pad) + 'px';
  rect.style.y = (y0 * VH - pad) + 'px';
  rect.style.width = ((x1 - x0) * VW + pad * 2) + 'px';
  rect.style.height = ((y1 - y0) * VH + pad * 2) + 'px';
  svg.style.opacity = DIM ? '1' : '0';
}

document.addEventListener('DOMContentLoaded', sheetInit);

/* ============================================================
   תפריט התצוגה (#viewmenu).
   ============================================================
   בטלפון שלושת מתגי התצוגה מקופלים לתפריט details שנפתח מעל
   הסרגל: הקשה על summary פותחת (מקלדת: Enter/רווח, מובנה),
   הקשה על מתג מפעילה אותו וסוגרת, והקשה מחוץ לתפריט סוגרת.
   במחשב ה-details מוחזק פתוח ושקוף (display:contents) והקבוצה
   נראית בדיוק כשהייתה. ES5 בלבד. */
function viewMenuInit() {
  var d = document.getElementById('viewmenu');
  if (!d) return;
  var mq = window.matchMedia('(max-width:820px)');
  var zoom = document.querySelector('#chd .zoom');
  var tools = d.querySelector('.tools');
  var tc = document.querySelector('meta[name="theme-color"]');
  var tc0 = tc ? tc.getAttribute('content') : '';
  function fit() {
    var phone = mq.matches;
    d.open = !phone;
    /* כפתורי הגודל עוברים לתפריט בטלפון וחוזרים למגירה במחשב:
       אותו צומת DOM, אותם מזהים ומאזינים. */
    if (zoom && tools) {
      if (phone) {
        if (zoom.parentNode !== tools) tools.appendChild(zoom);
      } else if (zoom.parentNode !== document.getElementById('chd')) {
        var chd = document.getElementById('chd');
        if (chd) chd.insertBefore(zoom, document.getElementById('chclose'));
      }
    }
    /* שורת המצב תואמת לסרגל: קלף בטלפון, כחול במחשב. */
    if (tc) tc.setAttribute('content', phone ? '#FFFDF8' : tc0);
  }
  fit();
  if (mq.addEventListener) mq.addEventListener('change', fit);
  else if (mq.addListener) mq.addListener(fit);
  document.addEventListener('click', function (e) {
    if (!mq.matches || !d.open) return;
    var t = e.target;
    if (!d.contains(t)) { d.open = false; return; }
    if (!t.closest) return;
    if (t.closest('.zoom')) return;
    if (t.closest('.tools button')) d.open = false;
  });
  d.addEventListener('keydown', function (e) {
    /* Native menu/button activation must not advance the lesson. */
    if (mq.matches && (e.key === ' ' || e.keyCode === 32)) e.stopPropagation();
  });
  document.addEventListener('keydown', function (e) {
    if (!mq.matches || !d.open) return;
    if (e.key === 'Escape' || e.keyCode === 27) {
      d.open = false;
      var s = d.querySelector('summary');
      if (s) s.focus();
    }
  });
}
document.addEventListener('DOMContentLoaded', viewMenuInit);
