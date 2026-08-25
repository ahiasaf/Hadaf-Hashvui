/* ============================================================
   סימון הלימוד — משותף לאפליקציה, למסך ההצטרפות ולמסך הלימוד.
   ============================================================
   שלושת המסכים חיים באותו מקור ולכן באותו אחסון (`df:`), אבל
   הם קבצים נפרדים. הלוגיקה כאן ולא בכל אחד מהם, כי שלוש
   עותקות של "מה נחשב שבוע" נפרדות זו מזו בשקט ביום שמישהו
   מתקן אחת מהן.

   מה נשמר איפה
   ------------
   * במכשיר — `df:learned`, מפה של 'מסלול|שבוע' → תאריך. זה
     מקור האמת עבור התלמיד: מה שהוא סימן נשאר אצלו גם בלי רשת
     וגם אם השליחה נכשלה.
   * בגיליון הפרטי — שורה לכל סימון, בלשונית "לימוד".
   * בגיליון הציבורי — **מספרים בלבד**, בלשונית "מוני-לימוד".
     זה מה שמסך ההצטרפות ולוח ראש החטיבה קוראים, ולכן שם של
     תלמיד אינו יוצא מהגיליון הסגור לעולם.

   ES5 בלבד, כמו כל השאר.
   ============================================================ */

/* ---------- אחסון ---------- */
function LGet(k, d) {
  try { var v = localStorage.getItem('df:' + k);
        return v === null ? d : JSON.parse(v); }
  catch (e) { return d; }
}
function LSet(k, v) {
  try { localStorage.setItem('df:' + k, JSON.stringify(v)); } catch (e) {}
}

/* ---------- מי אני ---------- */
/* הפרופיל נכתב במסך ההצטרפות. בלעדיו אין את מי לספור, ולכן
   סימון בלי פרופיל נשמר במכשיר אבל אינו נשלח. */
function LMe() { return LGet('me', null); }

/* ---------- השבוע ---------- */
/* אותה חשבונאות שיש ב-index.html, ובכוונה כתובה כאן שוב תחת
   שם אחר: שני המסכים האחרים אינם טוענים את index.html. */
function LWeek() {
  var start = new Date(PROGRAM.startDate + 'T00:00:00');
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var days = Math.floor((now - start) / 86400000);
  if (days < 0) return -1;
  return Math.min(Math.floor(days / 7), CAL_TAANIT.length - 1);
}
/* הדף של שבוע מסוים במסלול. null = שבוע חופשה. */
function LDaf(track, wk) {
  for (var i = 0; i < TRACKS.length; i++) {
    if (TRACKS[i].id !== track) continue;
    var row = TRACKS[i].cal[wk];
    return row && row[2] && row[2] !== 'סיום' ? row[2] : null;
  }
  return null;
}

/* ---------- מה סומן ---------- */
function LKey(track, wk) { return track + '|' + (wk + 1); }
function LDone(track, wk) { return !!LGet('learned', {})[LKey(track, wk)]; }

/* רצף — כמה שבועות אחורה ברציפות, כולל השבוע.
   שבוע חופשה אינו שובר: אין בו דף, ולכן אין מה ללמוד בו. */
function LStreak(track) {
  var wk = LWeek(), all = LGet('learned', {}), n = 0;
  if (wk < 0) return 0;
  for (var i = wk; i >= 0; i--) {
    if (!LDaf(track, i)) continue;
    if (!all[LKey(track, i)]) break;
    n++;
  }
  return n;
}

/* ---------- סימון ---------- */
/* נשמר קודם, נשלח אחר כך. `no-cors` מחזיר תשובה אטומה ולכן אי
   אפשר לדעת מהשרת אם הצליח; מה שמגן על התלמיד הוא שהסימון כבר
   אצלו במכשיר, והתור מנסה שוב בפתיחה הבאה. */
function LMark(track, wk) {
  var all = LGet('learned', {});
  var k = LKey(track, wk);
  if (all[k]) return false;                 /* כבר סומן — לא שולחים שוב */
  all[k] = new Date().toISOString();
  LSet('learned', all);

  var me = LMe();
  if (me && me.id) {
    var q = LGet('learn-q', []) || [];
    q.push({ action:'row', tab:'לימוד', cols: JSON.stringify([
      ['מזהה', me.id], ['קוד ישיבה', me.inst || ''],
      ['מסלול', track], ['שבוע', wk + 1], ['דף', LDaf(track, wk) || '']
    ]) });
    LSet('learn-q', q);
    LFlush();
  }
  return true;
}
function LUnmark(track, wk) {
  /* מסירים רק במכשיר. שורה שכבר נשלחה נשארת בגיליון, והמונה
     סופר מזהה ייחודי — כלומר ביטול אינו מוריד את המספר. זו
     החלטה: תלמיד שילחץ פעמיים לא יבלבל את הספירה, ותיקון של
     סימון בטעות הוא נדיר מספיק כדי לחיות איתו. */
  var all = LGet('learned', {});
  delete all[LKey(track, wk)];
  LSet('learned', all);
}

function LApi() {
  var cfg = LGet('cfg', {}) || {};
  return (cfg.api || (typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : '') || '').trim();
}
function LFlush() {
  var q = LGet('learn-q', []) || [];
  var url = LApi();
  if (!q.length || !url || !navigator.onLine) return;
  fetch(url, { method:'POST', mode:'no-cors',
               headers:{ 'Content-Type':'text/plain;charset=utf-8' },
               body: JSON.stringify(q[0]) })
    .then(function () {
      var rest = LGet('learn-q', []) || [];
      rest.shift(); LSet('learn-q', rest);
      LFlush();
    }).catch(function () {});
}
if (typeof window !== 'undefined') window.addEventListener('online', LFlush);

/* ---------- המונים הציבוריים ----------
   'מסלול|שבוע|קוד' → מספר. נקרא מהלשונית הציבורית, ולכן אין
   בו שום פרט אישי — רק כמה. */
function LCounts() { return LGet('learnCount', {}) || {}; }
function LCount(track, wk, code) {
  var c = LCounts();
  if (code) return c[track + '|' + (wk + 1) + '|' + code] || 0;
  /* בלי קוד — סך הכל ברשת, בסכימה על כל הישיבות. */
  var pre = track + '|' + (wk + 1) + '|', n = 0;
  for (var k in c) if (k.indexOf(pre) === 0) n += c[k];
  return n;
}
/* שורות הלשונית → מפה. נקרא על ידי כל מסך שטוען אותה. */
function LCountsFrom(rows) {
  if (!rows || rows.length < 2) return null;
  var head = rows[0], ix = {};
  for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
  if (ix['מסלול'] === undefined) return null;
  var m = {};
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var k = String(row[ix['מסלול']] || '').trim() + '|' +
            String(row[ix['שבוע']] || '').trim() + '|' +
            String(row[ix['קוד ישיבה']] || '').trim();
    var v = parseInt(row[ix['סיימו']], 10);
    if (v > 0) m[k] = v;
  }
  return m;
}

/* ============================================================
   הלוח של הרכז בישיבה — מנוע אחד, שני מארחים.
   ============================================================
   העמוד הראשי מציג אותו למי שנרשם מהמכשיר הזה, ו-board.html
   מציג אותו למי שהגיע דרך קישור. אותו קוד, כדי שהם לא יתפצלו
   בשקט ביום שמישהו יתקן אחד מהם.

   **מספרים בלבד.** הנתונים מגיעים מהלשוניות הציבוריות, שיש בהן
   קוד ישיבה ומספר. שם של תלמיד אינו יוצא מהגיליון הסגור.
   ============================================================ */

/* "ח׳:11 · ט׳:7" → [['ח׳',11],['ט׳',7]] — הצורה שהסקריפט כותב,
   כדי שפילוח לא ידרוש עמודה לכל שכבה. */
function LPairs(t) {
  return String(t || '').split('·').map(function (p) {
    var i = p.lastIndexOf(':');
    return i < 0 ? null : [p.slice(0, i).trim(), parseInt(p.slice(i + 1), 10) || 0];
  }).filter(function (x) { return x && x[0] && x[1]; });
}

/* שורות לשונית "מונים" → מפה לפי קוד ישיבה. */
function LJoinFrom(rows) {
  if (!rows || rows.length < 2) return null;
  var head = rows[0], ix = {};
  for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
  if (ix['קוד ישיבה'] === undefined) return null;
  var m = {};
  for (var r = 1; r < rows.length; r++) {
    var c = String(rows[r][ix['קוד ישיבה']] || '').trim();
    if (!c) continue;
    m[c] = { n: parseInt(rows[r][ix['מצטרפים']], 10) || 0,
             grades: LPairs(rows[r][ix['שכבות']]),
             ways:   LPairs(rows[r][ix['מסגרות']]) };
  }
  return m;
}
function LJoin(code) { return (LGet('joinCount', {}) || {})[code] || null; }

function LEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
function LFill(t, v) {
  return String(t || '').replace(/\{(\w+)\}/g, function (m, k) {
    return v[k] != null ? v[k] : m;
  });
}
function LJoinUrl(code) {
  var base = location.href.split('#')[0].split('?')[0]
               .replace(/(index|board|join)\.html$/, '');
  return base + 'join.html?inst=' + encodeURIComponent(code);
}

/* opts.send — להציג את כפתור ההזמנה. כבוי כשהרכז הראשי החליט
   שעוד לא מפיצים קישור לתלמידים.
   opts.where — השורה שמזכירה איפה הלוח נמצא. */
function LBoard(code, name, opts) {
  opts = opts || {};
  var j = LJoin(code), n = j ? j.n : 0;
  var wk = LWeek(), tr = LTrack();
  var daf = wk >= 0 ? LDaf(tr, wk) : null;
  var did = wk >= 0 ? LCount(tr, wk, code) : 0;
  var dads = 0;
  if (j) j.ways.forEach(function (p) { if (p[0] === 'אבות ובנים') dads = p[1]; });

  var wa = LFill(UI.linkWa, { inst:name, url:LJoinUrl(code) });
  var send = opts.send
    ? '<a class="btn gr bsend" target="_blank" rel="noopener" href="https://wa.me/?text=' +
      encodeURIComponent(wa) + '">' + LEsc(UI.bSend) + '</a>' : '';

  /* לפני שהתוכנית התחילה אין מה למדוד, ולכן מספרים כאן היו
     שלושה אפסים. במקומם — מה יהיה, ומה כבר יש. */
  if (wk < 0) {
    return '<div class="bcard">' +
      '<b>' + LEsc(UI.bSoonT) + '</b>' +
      '<p>' + LEsc(UI.bSoonB) + '</p>' +
      '<div class="bnow">' + LEsc(n ? LFill(UI.bJoined, { n:n }) : UI.bNone) + '</div>' +
      send +
      (opts.where ? '<div class="bwhere">' + LEsc(UI.bWhere) + '</div>' : '') +
      '</div>';
  }

  var maxG = 0;
  if (j) j.grades.forEach(function (p) { if (p[1] > maxG) maxG = p[1]; });
  var num = function (v, t) {
    return '<div class="bnum"><b>' + v + '</b><span>' + LEsc(t) + '</span></div>';
  };
  return '<div class="bnums">' +
      num(n, UI.bNums[0]) + num(did, UI.bNums[1]) + num(dads, UI.bNums[2]) +
    '</div>' +
    '<div class="bcard">' +
    (maxG ? '<b>' + LEsc(UI.bGrades) + '</b><div class="bbars">' +
      j.grades.map(function (p) {
        return '<div class="bbar"><span class="k">' + LEsc(p[0]) + '</span>' +
          '<span class="t"><i style="width:' +
          Math.max(6, Math.round(p[1] / maxG * 100)) + '%"></i></span>' +
          '<span class="n">' + p[1] + '</span></div>';
      }).join('') + '</div>' : '') +
    (daf ? '<div class="bweek"><b>' + LEsc(LFill(UI.bWeek, { daf:daf })) + '</b>' +
           '<span>' + LEsc(LFill(UI.bWeekOf, { n:did, all:n })) + '</span></div>' : '') +
    send +
    (opts.where ? '<div class="bwhere">' + LEsc(UI.bWhere) + '</div>' : '') +
    '</div>';
}
function LTrack() {
  var t = null;
  try { t = localStorage.getItem('dfHomeTrack'); } catch (e) {}
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === t) return t;
  return TRACKS[0].id;
}
