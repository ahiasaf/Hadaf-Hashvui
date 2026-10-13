
function listRedraw() {
  var l = $('cls-list'); if (l) { l.innerHTML = classesList(); embedSize(); } else draw();
}

/* כמה מהדף הוא עבר, 0-1. השרת מחזיר `pos` רק לשבוע שלא הושלם,
   ולכן אין כאן סתירה בין הפס לבין הסימון. */
function frac(p) {
  var wk = LWeek();
  if (wk < 0 || didWeek(p)) return 0;
  var m = p.pos || {};
  for (var k in m) if (String(k).split('|')[1] === String(wk + 1)) return m[k];
  return 0;
}
/* `noGrade` - ברשימה שכבר מקובצת לפי שכבה, חזרה על השכבה בכל
   שורה היא רעש.

   ולעולם לא `list.map(pRow)`: `map` מעביר את האינדקס כארגומנט
   שני, ולכן כל שורה מלבד הראשונה קיבלה noGrade אמיתי ואיבדה
   את השכבה שלה. עוטפים. */
function pRow(p, noGrade) {
  var did = didWeek(p), f = did ? 0 : frac(p);
  /* שם מלא ושכבה. "יונתן" לבדו אינו מזהה אף אחד בשכבה של ארבעים,
     והרשימה הזו נועדה לצוות שצריך לדעת למי לפנות. */
  var nm = ((p.first || '') + ' ' + (p.last || '')).trim() || '-';
  var bits = [];
  /* שם הישיבה - ברשימות שאינן מקובצות לפי ישיבה. */
  if (ALL && !FILT && !BY_INST) bits.push(instLbl(p));
  if (p.grade && !noGrade) bits.push(p.grade);
  /* "עם אבא" ו"עם אבא ✓" הם שני דברים שונים, ולכן הם נראים
     שונה: בלי הסימן זה מה שהתלמיד **מילא** בטופס, ועם הסימן
     שני הצדדים נרשמו בפועל והמערכת הצליבה ביניהם. לצוות זו
     בדיוק ההבחנה שמעניינת - מי באמת לומד עם אביו. */
  if (p.with)  bits.push('עם ' + p.with + (p.withOk ? ' ✓' : ''));
  if (p.test)  bits.push(UI.rstTag);
  /* למד בעמדת הלימוד ונספר - אבל עוד לא נכנס מטלפון משלו. */
  if (p.nodev) bits.push('📵 ' + kt('noDevTag'));
  var sub = bits.join(' · ');
  /* פס ולא אחוז. "29%" מזמין השוואה בין תלמידים, והוא גם מדויק
     יותר ממה שהוא באמת - קטע 12 מתוך 41 אינו 29 אחוז מהלימוד.
     פס אומר את הדבר היחיד שהצוות צריך: הוא התחיל, והוא בדרך. */
  if (ALL && SELMODE) {
    return '<div class="prow sel' + (SEL[p.id] ? ' on' : '') + '" data-sel="' + esc(p.id) + '">' +
      '<span class="tick">' + (SEL[p.id] ? '☑' : '☐') + '</span>' +
      '<div style="flex:1"><b>' + wayDot(p) + esc(nm) + '</b>' +
      (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</div>' +
      (p.push ? '<span class="kudo" style="cursor:default">✉</span>' : '') + '</div>';
  }
  return '<div class="prow' + (did ? ' did' : (f ? ' mid' : '')) + (OPEN === p.id ? ' open' : '') + '">' +
    '<span class="tick">' + (did ? '✓' : '') + '</span>' +
    '<div style="flex:1"' + (ALL ? ' class="nm" data-open="' + esc(p.id) + '"' : '') + '>' +
    '<b>' + wayDot(p) + esc(nm) + '</b>' +
    (sub ? '<div class="s">' + esc(sub) + '</div>' : '') +
    (f ? '<div class="pbar"><i style="width:' +
         Math.max(5, Math.round(f * 100)) + '%"></i></div>' : '') +
    '</div>' + kudoBtn(p, did) + '</div>' + detHtml(p, false) + waBoxHtml(p) + kudoBox(p);
}
/* ============================================================
   וואטסאפ למי שאין לו התראות - לרכז בלבד.
   ============================================================
   שם, מספר, מצב ההתראות, ונוסח מוכן עם הקישור לעמוד "איך מחזירים
   את ההתראות". הנוסח נערך כאן, ואותו נוסח עובר לוואטסאפ. */
var WA_OPEN = '', WA_TXT = {};
function pstateTxt(p) {
  /* הסיבה שהמכשיר עצמו דיווח גוברת על הניחוש - ראו noteWhy ב-join.html. */
  if (p.pstate !== 'on' && p.why) return '🔕 ' + p.why;
  return { on: '✉ מנוי פעיל', gone: '⌛ פג', blocked: '🔕 חסם התראות', none: 'לא נרשם להתראות',
           '?': 'מצב ההתראות לא ידוע' }[p.pstate || 'none'] || '';
}
/* ============================================================
   תזכורת לבא בתור - בסינון 🔕 בלוח של הרכז.
   ============================================================
   וואטסאפ אינו שולח לרבים, ולכן הכפתור עובר על הרשימה: כל
   לחיצה פותחת שיחה עם התלמיד הבא שעוד לא קיבל תזכורת השבוע,
   עם הנוסח המוכן (waDefault), ומסמנת אותו במכשיר הזה. */
var REM_DAYS = 7;
function remList() {
  var at = LGet('remAt', {}) || {}, now = Date.now();
  return (roster || []).filter(function (p) {
    if (p.push || !p.id || !waNum(p.phone)) return false;
    if (LPUSH === 'nodev' && !p.nodev) return false;
    if (FILT && (FILT === '-' ? instOfP(p) !== '-' : instOfP(p) !== FILT)) return false;
    return !(at[p.id] && now - at[p.id] < REM_DAYS * 86400000);
  });
}
function remHtml() {
  if (!ALL || (LPUSH !== 'off' && LPUSH !== 'nodev')) return '';
  var l = remList();
  if (!l.length) return '<div class="lsum">' + esc(kt('remDone')) + '</div>';
  var p = l[0];
  return '<a class="go wa-go rem-go" target="_blank" rel="noopener" data-rem="' + esc(p.id) +
    '" href="https://wa.me/' + waNum(p.phone) + '?text=' + encodeURIComponent(waDefault(p)) + '">' +
    esc(tp(kt('remNext'), { name: ((p.first || '') + ' ' + (p.last || '')).trim(), n: l.length })) + '</a>';
}
/* בלוח של הצוות אין טלפונים, ולכן ההודעה הולכת לקבוצת הכיתה - בלי
   שמות, עם הקישור לעמוד "איך מפעילים עדכונים". */
function hitGrpHtml() {
  if (ALL || EMBED || !kt('hitGrpBtn')) return '';
  var txt = tp(kt('hitGrpMsg'), { link: baseUrl() + 'hitraot' });
  return '<div class="card"><h3 style="font-size:.95rem">' + esc(kt('hitGrpH')) + '</h3>' +
    '<a class="go wa-go" target="_blank" rel="noopener" href="https://wa.me/?text=' +
    encodeURIComponent(txt) + '">' + esc(kt('hitGrpBtn')) + '</a></div>';
}
function remMark(id) {
  var at = LGet('remAt', {}) || {};
  at[id] = Date.now(); LSet('remAt', at);
  setTimeout(draw, 400);
}
/* פירוק "בלי התראות" לפי הסיבה שדווחה. */
function whyHtml(list) {
  var m = {}, k;
  list.forEach(function (p) {
    if (p.push) return;
    k = p.why || (p.pstate === 'blocked' ? 'חסום' : 'לא דיווח');
    m[k] = (m[k] || 0) + 1;
  });
  var ks = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
  return ks.length ? '<div class="lsum">' + ks.map(function (x) {
    return esc(x) + ' <b>' + m[x] + '</b>';
  }).join(' · ') + '</div>' : '';
}
function waDefault(p) {
  /* מי שעוד לא התקין - קישור ההצטרפות של הישיבה שלו, לא "איך
     מחזירים התראות". הדף שלמד בעמדה כבר מחכה לו שם. */
  if (p.nodev) {
    return tp(kt('waInstall') || '{name}, שלום! {link}', { name: p.first || '', sig: kudoSig(),
      link: baseUrl() + '/join?inst=' + encodeURIComponent(p.inst || '') });
  }
  var link = baseUrl() + 'hitraot';
  return tp(kt('waMsg') || '{name}, שלום! {link}', { name: p.first || '', sig: kudoSig(), link: link });
}
function waBoxHtml(p) {
  if (!ALL || WA_OPEN !== p.id) return '';
  var wa = waNum(p.phone), txt = WA_TXT[p.id] != null ? WA_TXT[p.id] : waDefault(p);
  return '<div class="kudo-box"><div class="dt-r"><span>למי</span><div><b>' +
    esc(((p.first || '') + ' ' + (p.last || '')).trim()) + '</b> · <span class="dt-ph">' +
    esc(p.phone || '') + '</span></div></div>' +
    '<div class="dt-r"><span>התראות</span><div>' + esc(pstateTxt(p)) + '</div></div>' +
    '<textarea id="wa-txt" data-wid="' + esc(p.id) + '">' + esc(txt) + '</textarea>' +
    '<a class="go wa-go" id="wa-go" target="_blank" rel="noopener" href="https://wa.me/' + wa +
    '?text=' + encodeURIComponent(txt) + '">פתיחה בוואטסאפ</a>' +
    '<div class="s">נפתח בוואטסאפ עם הנוסח - השליחה עצמה שם.</div></div>';
}

/* ============================================================
   "ישר כוח" - מילה אישית לתלמיד אחד שסיים.
   ============================================================
   ליד כל מי שסיים את הדף השבוע. לחיצה פותחת תיבה קטנה מתחת
   לשורה: הנוסחים המוכנים של "סיימו" (שהרכז הכין בניהול), תיבה,
   ותצוגה של איך זה נפתח - בשמו. השליחה עוברת באותו `fire=say`
   של "מילה לתלמידים", עם `ids` של התלמיד הזה בלבד; השרת תוחם
   לישיבה לפי הקוד, והמזהה רק מצמצם בתוכה.
   ============================================================ */
var KUDO_OPEN = '', KUDO_TXT = '', KUDO_BUSY = false, KUDO_SENT = {}, KUDO_ERR = '';
/* למי - 'k' התלמיד · 'p' ההורה המחובר · 'pk' שניהם. */
var KUDO_TO = 'k';
function kt(k) { return (window.HEAD_ASK && HEAD_ASK[k]) || ''; }
function kudoBtn(p, did) {
  /* ============================================================
     בכל הישיבות - לכל תלמיד, ולא רק למי שסיים.
     ============================================================
     "רק מי שנרשם להתראות מופיע לידו סימן של המכתב, ומי שלא -
     כפתור של וואטסאפ שפותח את הוואטסאפ האישי שלו." המכתב פותח את
     אותה תיבה של "ישר כוח"; הוואטסאפ פותח שיחה עם הטלפון שלו.
     הטלפון מגיע רק לתצוגה הזו (בסיסמת הרכז). */
  if (ALL) {
    if (SELMODE) return '';
    if (!p.id) return '';
    if (KUDO_SENT[p.id]) return '<span class="kudo sent">' + esc(kt('kudoQueued')) + '</span>';
    if (p.push || p.parPush) return '<button class="kudo" data-kudo="' + esc(p.id) + '" title="התראה אישית">✉</button>';
    /* **בלי טלפון - "אין מספר", לא כפתור שבור.** עם טלפון - תיבה עם
       נוסח מוכן וקישור להחזרת ההתראות (waBoxHtml). פתיחת וואטסאפ
       אינה שליחה, ולכן אינה מסומנת "נשלח". */
    return waNum(p.phone) ? '<button class="kudo wa" data-wa="' + esc(p.id) + '">וואטסאפ</button>'
                          : '<span class="kudo off" title="אין מספר טלפון">אין מספר</span>';
  }
  if (!did || !acc || !p.id) return '';
  if (KUDO_SENT[p.id]) return '<span class="kudo sent">' + esc(kt('kudoQueued')) + '</span>';
  return '<button class="kudo" data-kudo="' + esc(p.id) + '">' + esc(kt('kudoBtn')) + '</button>';
}
function kudoSig() {
  if (ALL) return LGet('saySig', '') || PROGRAM.short || 'הדף השבועי';
  return LGet('saySig', '') || tp(kt('kudoSig'), { inst: inst ? inst.name : '' });
}
/* 050-1234567 → 972501234567. ריק כשאין מספר. */
function waNum(v) {
  var d = String(v || '').replace(/[^0-9]/g, '');
  if (!d) return '';
  if (d.indexOf('972') === 0) return d;
  if (d.indexOf('0') === 0) d = d.slice(1);
  return d.length >= 8 ? '972' + d : '';
}
function kudoTmpls() {
  var wk = LWeek(), row = wk >= 0 ? TRACKS[0].cal[wk] : null;
  var daf = row && row[2] ? row[2] + LAmMark(LAmOf(row)) : '';
  return (LGet('tmplCache', []) || []).filter(function (t) {
    return ALL || t.cat === 'done' || t.cat === 'any';
  }).map(function (t) { return tp(t.text, { daf: daf }); });
}
