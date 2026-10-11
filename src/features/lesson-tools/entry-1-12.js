
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
