
draw();
/* ============================================================
   **מסך הבית - כפתור קבוע.**
   ============================================================
   "בלי להשאיר אותו תקוע. לא למשוך אותו החוצה מאזור הצוות."
   ראש החטיבה חוזר לאזור הניהול האישי שלו (`#phone` בעמוד
   הראשי), והר"ם - לעמוד הצוות של הישיבה. לא לעמוד הבית של
   התלמידים.
   ============================================================ */
function homeHref() {
  var head = !!waitMe();
  /* אותו סדר של myBoard() בעמוד הראשי: ההרשמה, ואז הלוח הנבחר. */
  if (!head) {
    try {
      var rg = JSON.parse(localStorage.getItem('dfReg') || 'null');
      head = (rg && rg.code ? rg.code
                            : JSON.parse(localStorage.getItem('df:dfBoard') || '""')) === code;
    } catch (e) {}
  }
  return head ? baseUrl() + '#phone'
              : baseUrl() + '/tzevet?inst=' + encodeURIComponent(code);
}
function homeBack() {
  try {
    var r = String(document.referrer || ''), o = location.protocol + '//' + location.host + '/';
    if (history.length < 2 || r.indexOf(o) !== 0) return false;
    /* הלוח עצמו (רענון) אינו "המסך הקודם". */
    return !/^[^?#]*\/board(\.html)?([?#]|$)/.test(r);
  } catch (e) { return false; }
}
function homeFab() {
  if (EMBED || ALL || !inst || $('homefab')) return;
  var a = document.createElement('a');
  a.id = 'homefab'; a.className = 'homefab'; a.href = homeHref();
  /* **חזרה, לא טעינה.** מי שהגיע לכאן מתוך האפליקציה (אזור הניהול
     האישי, עמוד הצוות) - חוזר למסך שממנו בא, במצבו. אין לאן לחזור
     (נפתח מהתראה או מקישור) - הקישור, כמו קודם. */
  a.onclick = function (ev) {
    if (!homeBack()) return;
    if (ev && ev.preventDefault) ev.preventDefault();
    history.back();
  };
  a.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 9.5L10 3.5l7 6V17h-4.6v-4.4H7.6V17H3z" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' +
    '<span>' + esc(UI.bdHome || '') + '</span>';
  document.body.appendChild(a);
  document.body.className += ' has-fab';
}
homeFab();

if (!ALL) loadBoard().then(draw);
if (EMBED) boardReload(); else loadRoster().then(draw);
kudoLoadTmpl();
