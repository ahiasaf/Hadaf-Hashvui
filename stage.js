/* ============================================================
   הבמה — הבאנר הכחול של הדף השבועי.
   ============================================================
   הוא נבנה למסך הראשי, ומאז הובטח לתלמיד שזה בדיוק מה שייפתח
   אצלו. הבטחה כזו אי אפשר לקיים בהעתקה: שני עותקים נפרדים
   נפרדים גם בהתנהגות, ותוך חודש הם כבר שני מסכים שונים.

   לכן הוא יושב כאן, וגם `index.html` וגם `join.html` בונים
   ממנו את אותו הדבר. מה שמשתנה ביניהם הוא רק מה קורה בלחיצה,
   ולכן שמות הפונקציות מועברים כטקסט — הקובץ הזה אינו מכיר
   אף אחד מהם.

   ES5 בלבד, כמו כל השאר.
   ============================================================ */

/* השבוע המוצג: לפני שהשנה מתחילה — הראשון. */
/* ============================================================
   איזה שבוע עכשיו — מקור אחד.
   ============================================================
   כאן ישבה תלות ב-`weekIndex`, שקיימת **רק ב-index.html**. הבאנר
   הזה נבנה מאותו קובץ גם במסך התלמיד, ושם הפונקציה אינה קיימת —
   ולכן הנפילה לאחור החזירה שבוע 1 בכל שבוע בשנה.

   כלומר: מרגע שהתוכנית מתחילה, התלמיד היה רואה לנצח את הדף של
   השבוע הראשון, בעוד שכפתור הסימון, פס ההתקדמות והמונים שלצידו
   מדברים על השבוע האמיתי. שני מספרים על אותו מסך, ואף אחד לא
   היה מודיע.

   `LWeek` ב-learned.js נטענת בכל ארבעת העמודים, ולכן היא המקור.
   ============================================================ */
function StWeekRaw() {
  /* בלי נפילה שנייה. `learned.js` נטענת בכל ארבעת העמודים, ולכן
     אם `LWeek` חסרה — משהו שבור, ו-1- הוא התשובה הכנה. נפילה
     לאחור על פונקציה אחרת היא בדיוק מה שהסתיר את התקלה הזו. */
  return (typeof LWeek === 'function') ? LWeek() : -1;
}
function StWeek() {
  var wi = StWeekRaw();
  return wi < 0 ? 0 : wi;
}
function StTrack(id) {
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i];
  return TRACKS[0];
}
function StEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
/* המצגת מגיעה מ-deck.js — הסדר שם, לא בשמות הקבצים. */
function StDeck(tr, i) {
  return (typeof DeckOf === 'function') ? DeckOf(tr.id, i + 1) : null;
}
function StSlide(dk, n) {
  return (typeof DeckSrc === 'function') ? DeckSrc(dk, n) : '';
}
/* השער שבחר הרכז, ואם לא בחר — השקף הראשון. */
function StCover(dk) {
  return (typeof DeckCover === 'function') ? DeckCover(dk) : StSlide(dk, 1);
}

/* o.track  — מזהה המסכת המוצגת
   o.pick   — שם פונקציה שמקבלת מזהה מסכת, או ריק = בלי בורר
   o.deck   — שם פונקציה שפותחת את המצגת
   o.week   — שם פונקציה שפותחת את מסך השבוע
   o.trail  — שם פונקציה שפותחת את המסלול
   o.noDeckAlt — בלי הכפתור הקטן (מצגת / מסלול); "פתיחת הדף" לבדו,
                  ברוחב מלא
   o.goLbl  — כיתוב אחר לכפתור הלבן; ריק = UI.deckGo / UI.weekGo */
function StageHtml(o) {
  var tr = StTrack(o.track), i = StWeek(), row = tr.cal[i];
  var c  = (typeof CONTENT !== 'undefined') ? CONTENT[tr.id + '-' + (i + 1)] : null;
  var wi = StWeekRaw();
  var when = wi < 0 ? UI.stageSoon : 'שבוע ' + (wi + 1) + ' מתוך ' + tr.cal.length;
  var call = function (fn, arg) {
    return fn ? fn + '(' + (arg === undefined ? '' : "'" + arg + "'") + ')' : '';
  };

  var s = '<div class="stage"><span class="g g1"></span><span class="g g2"></span>';

  if (o.pick && TRACKS.length > 1) {
    s += '<div class="picker">';
    for (var k = 0; k < TRACKS.length; k++) {
      var t = TRACKS[k];
      s += '<button class="pick' + (t.id === tr.id ? ' on' : '') +
           '" onclick="' + o.pick + '(\'' + t.id + '\')">מסכת ' +
           StEsc(t.masechet) + '</button>';
    }
    s += '</div>';
  }

  s += '<div class="eyebrow">' + StEsc(when) + '<s></s>' +
       (row[2] && row[2] !== 'סיום' ? 'דף ' + StEsc(CalDaf(row)) : '') + '</div>' +
       '<h2>' + StEsc(DeckTitle(tr.id, i + 1) ||
                       (row[2] ? 'דף ' + CalDaf(row) : row[1])) + '</h2>' +
       '<div class="meta">' + StEsc(row[1]) + ' · ' + StEsc(row[0]) + '</div>';

  var dk = StDeck(tr, i);
  if (dk) {
    /* הכפתור הלבן מוביל לדף, והקטן למצגת — ולא להפך.

       נבדק על אנשים: היד הולכת לכפתור הגדול והבולט, ולכן הוא
       חייב להוביל לעיקר. המצגת לא איבדה מקום — השקף שמעליהם
       הוא בעצמו לחיצה שפותחת אותה, וזה יעד גדול מכל כפתור. */
    s += '<div class="showcase"><div class="frame" onclick="' + call(o.deck) + '">' +
         '<img src="' + StCover(dk) + '" alt="השקף הראשון" onerror="this.style.visibility=\'hidden\'"></div></div>' +
         '<div class="acts' + (o.noDeckAlt ? ' solo' : '') + '">' +
         '<button class="go" onclick="' + call(o.week) + '">' + StEsc(o.goLbl || UI.deckGo) + '</button>' +
         (o.noDeckAlt ? '' :
         '<button class="alt" onclick="' + call(o.deck) + '">' + StEsc(UI.deckAlt) + '</button>') +
         '</div>';
  } else {
    s += '<div class="showcase"><div class="frame"><div class="empty">' +
         '<span>' + StEsc(UI.deckSoon) + '</span></div></div></div>' +
         '<div class="acts' + (o.noDeckAlt ? ' solo' : '') + '"><button class="go" onclick="' + call(o.week) + '">' +
         StEsc(o.goLbl || UI.weekGo) + '</button>' +
         (o.noDeckAlt ? '' : '<button class="alt" onclick="' + call(o.trail) + '">' +
         StEsc(UI.trackBtn) + '</button>') + '</div>';
  }
  return s + '</div>';
}

/* פס המסלול השנתי — אותו אחד שמתחת לבמה במסך הראשי.
   o.go — שם פונקציה, או כתובת כשמדובר בקישור בין עמודים.
   o.mine — "המסלול שלך" (8.99.254): { d: הדף, f: 0–1 כמה למד, done,
   raf: בתוך ההגרלה לפי השרת }. בלעדיו — הפס כמו שהיה. */
function RailHtml(o) {
  var tr = StTrack(o.track), wi = StWeekRaw();
  var mark = wi < 0 ? 0 : wi, rail = '', done = 0;
  for (var i = 0; i < tr.cal.length; i++) {
    var r = tr.cal[i];
    /* עמוד ב שנלמד בשבוע משלו (ב:) אינו דף נוסף במונה. */
    if (r[2] && r[2] !== 'סיום' && r[3] !== 'ב' && wi >= 0 && i <= wi) done++;
    var cls = !r[2] ? 'off' : (r[2] === 'סיום' || r[4] === 'סיום') ? 'fin'
            : i === mark ? 'now' : (wi >= 0 && i < wi) ? 'done' : '';
    rail += '<i class="' + cls + '"></i>';
  }
  var pct = Math.round(done / tr.dapim * 100);
  var open = o.href ? ' onclick="location.href=\'' + o.href + '\'"'
                    : (o.go ? ' onclick="' + o.go + '(\'' + tr.id + '\')"' : '');
  var me = o.mine, mine = '', raf = '';
  if (me) {
    var w = me.done ? 100 : Math.max(4, Math.round(me.f * 100));
    mine = '<div style="font-size:.86rem;font-weight:800;margin:-4px 0 8px;color:' +
      (me.done ? 'var(--green-d)' : 'var(--ink)') + '">' + (me.done ? '✓ ' : '') +
      StEsc(String(UI.myWeek || '').replace('{d}', me.d)) + '</div>' +
      '<div style="height:8px;border-radius:5px;background:var(--sunk);overflow:hidden;margin-bottom:13px">' +
      '<div style="height:100%;width:' + w + '%;border-radius:5px;background:' + (me.done ? 'var(--green)' : 'var(--blue)') + '"></div></div>';
    if (me.raf) raf = '<div style="margin-top:11px;padding:7px 11px;border-radius:var(--r-s);background:rgba(111,168,59,.15);' +
      'color:var(--green-d);font-weight:800;font-size:.84rem">✓ ' + StEsc(UI.myRaf) + '</div>';
  }
  return '<div class="mini"' + open +
    (open ? ' role="button" tabindex="0" style="cursor:pointer"' : '') + '>' +
    '<div class="cap"><b>' +
    String(me ? UI.myCap : UI.trackCap).replace('{mas}', StEsc(tr.masechet)) + '</b>' +
    '<span>' + done + '/' + tr.dapim + ' · ' + pct + '%</span></div>' + mine +
    '<div class="rail">' + rail + '</div>' + raf +
    '<div style="font-size:.79rem;color:var(--ink-3);font-weight:700;margin-top:10px">' +
    StEsc(UI.trackNote) + '</div></div>';
}
