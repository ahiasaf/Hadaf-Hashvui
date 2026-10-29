/* ============================================================
   העלון השבועי — שכבת בחירה על הדף האינטראקטיבי.
   ============================================================
   "העיקר בעלון הוא שאלות החידות. בנוסף אני רוצה לבחור קטעים
   מעניינים מהפירוש לנוער ואת המצגות המתאימות. לא את כל הפירוש
   ולא בהכרח את כל המצגות. מי שרוצה להדפיס, ידפיס; התוצר הוא PDF."

   נטען רק ב-learn.html, ופועל רק כשבכתובת `alon=1` **וגם** המכשיר
   הוא של הרכז (`df:admOk`). לתלמיד — ולרכז במצב רגיל — אין כאן
   כלום: לא סימון, לא כפתור, לא רשימה. הכניסה: ניהול ← הדף ←
   "העלון השבועי".

   · עוברים בדף כרגיל (הבא / הקודם). במקום הביאור — חלונית של הקטע:
     החידות שפורסמו, חלקי הפירוש לנוער, והשקפים שלו — בתמונה.
     הקשה מוסיפה לעלון או מוציאה ממנו.
   · **הבחירה נפרדת מהתוכן.** לשונית "עלון" (מסכת · דף · JSON), שורה
     לדף. לא נוגעת בפירוש, בשקף, במזהה קטע או בחידה. בחירה אינה
     מפרסמת שאלה. טיוטה של שאלה אינה מוצעת בכלל.
   · **זהות ולא מיקום.** קטע — לפי המזהה הקבוע; חלק פירוש — לפי
     `pid`; שקף — לפי נתיב הקובץ, לעולם לא לפי מספר שזז. מה שנמחק או
     השתנה במקור נאמר בתצוגה המקדימה בשמו, ואינו מוחלף בדבר אחר.
   · **אין השפעה על הלימוד.** במצב הזה המקום בדף אינו נשמר, השבוע
     אינו מסומן כנלמד, והמצגת אינה נפתחת לבד.
   · התצוגה המקדימה מחולקת לעמודים אמיתיים בגודל הנייר שנבחר, וההדפסה
     ("שמירה כ-PDF") מדפיסה בדיוק אותם עמודים.

   **ארכיון והפקה חוזרת (בריף 16.10).** "עבודת העלון המאושרת תהיה
   מגובה בצד השרת, ואפשר להפיק ממנה את העלון שוב — בלי הידבקה ידנית."
   · מה שבטיוטה (`AL`, לשונית "עלון") הוא עכשיו כל העבודה: הבחירה,
     הערה כללית והערה לפריט (`notes`, לפי מפתח הפריט — לא מודפסות),
     והחלטות העריכה (`ed`): כותרת לכל יחידה, ציטוט גמרא שהחידה
     ממוסגרת לצידו, סדר יחידות, כותרת עליונה, ותיקוני טקסט לעלון
     בלבד. התיקונים חלים רק בייצוא — המקור אינו משתנה.
   · "אישור" שומר תמונת מצב בלשונית "ארכיון עלון" כגרסה חדשה (alonArch_
     בסקריפט). גרסה מאושרת לא נדרסת. אליה מצורף ה-PDF ב-Drive.
   · בכניסה: טיוטה → ואם אין — הגרסה המאושרת האחרונה. מכל מכשיר רכז.
   · בתצוגה המקדימה: מה ששונה מהגרסה המאושרת האחרונה מוצג ברשימה
     לפני ההדפסה, לא בשקט.
   ============================================================ */
var ALON_ON = (function () {
  if (!/[?&]alon=1\b/.test(location.search)) return false;
  if (/[?&](demo|rec)=1\b/.test(location.search)) return false;
  return isAdminView();
})();
var ALON_TAB = 'עלון';
var ALON_ARCH = 'ארכיון עלון';
/* גרסת התבנית — עולה בכל שינוי בפריסה של העלון, ונשמרת בכל אישור.
   גרסה מאושרת מתבנית אחרת מסומנת בתצוגה המקדימה. */
var AL_TPL = 2;
var AL = { items: [] };   /* הבחירה של הדף שעל המסך */
var AL_SENT = '';         /* מה שאומת בגיליון */
var AL_T = null, AL_GEN = 0, AL_ST = '';
var AL_PREF = { paper: 'A4', ink: false };
try {
  var alp = JSON.parse(localStorage.getItem('df:alonPref') || 'null');
  if (alp) { AL_PREF.paper = alp.paper === 'A5' ? 'A5' : 'A4'; AL_PREF.ink = !!alp.ink; }
} catch (e) {}
/* הגרסאות המאושרות של הדף. null = עוד לא נקרא, או שהקריאה נכשלה —
   ואז לא מציגים "אין גרסאות". */
var AL_ARCH = null;
var AL_FROM = 0;          /* הטיוטה נטענה מגרסה מאושרת */
var AL_OPEN = {};         /* אילו חלוניות עריכה פתוחות בחלונית הקטע */
var AL_LAST = null;       /* מה שנבנה בתצוגה המקדימה: טביעה ומספר עמודים */
var AL_BGEN = 0, AL_BT = null;

function alU_(k, o) { return fillT((window.UI && UI[k]) || '', o || {}); }
/* השדות שנוספו — גם בטיוטה ישנה שאין בה אותם */
function alNorm_() {
  if (!AL || typeof AL !== 'object') AL = {};
  if (!AL.items) AL.items = [];
  if (!AL.notes || typeof AL.notes !== 'object') AL.notes = {};
  if (typeof AL.note !== 'string') AL.note = '';
  var ed = AL.ed || (AL.ed = {});
  if (!ed.order) ed.order = [];
  if (!ed.titles) ed.titles = {};
  if (!ed.quotes) ed.quotes = {};
  if (!ed.fix) ed.fix = [];
  if (typeof ed.head !== 'string') ed.head = '';
  if (AL.pf) { AL_PREF.paper = AL.pf.paper === 'A5' ? 'A5' : 'A4'; AL_PREF.ink = !!AL.pf.ink; }
}
/* הטיוטה כפי שהיא נשמרת: בלי שדות ריקים. אין בה כלום = '' (אין שורה). */
function alVal_() {
  var o = {}, has = false, k;
  o.items = AL.items || [];
  if (o.items.length) has = true;
  if (AL.note && AL.note.trim()) { o.note = AL.note; has = true; }
  var nn = {};
  for (k in (AL.notes || {})) if (AL.notes[k] && String(AL.notes[k]).trim()) { nn[k] = AL.notes[k]; has = true; }
  o.notes = nn;
  var ed = AL.ed || {}, e2 = { order: ed.order || [], titles: {}, quotes: {}, fix: [], head: ed.head || '' };
  for (k in (ed.titles || {})) if (String(ed.titles[k] || '').trim()) e2.titles[k] = ed.titles[k];
  for (k in (ed.quotes || {})) if (String(ed.quotes[k] || '').trim()) e2.quotes[k] = ed.quotes[k];
  (ed.fix || []).forEach(function (f) { if (f && String(f.a || '')) e2.fix.push({ a: f.a, b: f.b || '' }); });
  if (e2.order.length || e2.head.trim() || e2.fix.length ||
      Object.keys(e2.titles).length || Object.keys(e2.quotes).length) has = true;
  o.ed = e2;
  o.pf = { paper: AL_PREF.paper, ink: !!AL_PREF.ink };
  o.t = AL.t || 0;
  return has ? JSON.stringify(o) : '';
}
/* מפתח קבוע לפריט — להערה עליו */
function alIK_(it) {
  return it.k + '|' + it.s + '|' + (it.k === 'q' ? it.i : it.k === 'own' ? it.pid : it.f);
}
function alHash_(s) {
  var h = 0x811c9dc5;
  s = String(s || '');
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}
function alLocalKey_() { return 'df:alon:' + dmKey(S.mas, S.daf); }

/* ---------- הקטעים: מפתח קבוע, סדר הלימוד ---------- */
function alStepKey_(v) { return v.id ? v.id : 'n' + v.n; }
function alSteps_() {
  var out = [], seen = {};
  FLAT.forEach(function (v, i) {
    if (seen[v.n]) return;
    seen[v.n] = 1;
    out.push({ v: v, idx: i, key: alStepKey_(v) });
  });
  return out;
}
function alStepOf_(key) {
  var ss = alSteps_();
  for (var i = 0; i < ss.length; i++) {
    var v = ss[i].v;
    if (ss[i].key === key || (v.also || []).indexOf(key) >= 0) return ss[i];
  }
  return null;
}
function alSrc_(st) {
  var pp = PAGES[st.v.p] || {};
  return alU_('alSrc', { daf: pp.daf || S.daf, am: amud(pp.pg || 1), n: st.v.n });
}

/* ---------- מה יש לבחור בקטע ----------
   חידות — רק מה שפורסם (`pub`), בנוסח שפורסם. פירוש — מה שנשמר
   בגיליון. שקפים — השקף שהתלמיד רואה בקטע הזה, ושקף שצמוד לחלק
   פירוש. */
function alOffer_(st) {
  var n = st.v.n, out = { q: [], own: [], sl: [], drafts: 0 };
  qPieces_(n).forEach(function (it, i) {
    if (it.pub) out.q.push({ i: i, q: it.pub, h: alHash_(JSON.stringify(it.pub)) });
    else out.drafts++;
  });
  var seenF = {};
  var addSl = function (f, why) {
    if (!f || seenF[f]) return;
    seenF[f] = 1;
    out.sl.push({ f: f, why: why });
  };
  if (DECK && ANCH) addSl(slideSrc(slideAt(st.idx)), 'deck');
  ownPieces_(n).forEach(function (p, i) {
    var txt = ownStripHtml_(p.text);
    if (txt) out.own.push({ pid: p.pid || 'i' + i, p: p, h: alHash_(p.text || '') });
    if (p.slide) addSl(p.slide, 'own');
  });
  return out;
}

/* ---------- הבחירה ---------- */
function alFind_(it) {
  for (var i = 0; i < AL.items.length; i++) {
    var x = AL.items[i];
    if (x.k !== it.k || x.s !== it.s) continue;
    if ((it.k === 'q' && x.i === it.i) || (it.k === 'own' && x.pid === it.pid) ||
        (it.k === 'sl' && x.f === it.f)) return i;
  }
  return -1;
}
/* אותו שקף שכבר נבחר בקטע אחר */
function alSlElsewhere_(f, s) {
  for (var i = 0; i < AL.items.length; i++) {
    if (AL.items[i].k === 'sl' && AL.items[i].f === f && AL.items[i].s !== s) return AL.items[i].s;
  }
  return '';
}
function alToggle_(it) {
  var at = alFind_(it);
  if (at >= 0) AL.items.splice(at, 1); else AL.items.push(it);
  AL.t = Date.now();
  alKeep_();
  alPaint_();
}

/* ---------- שמירה: במכשיר מיד, בגיליון אחרי רגע, עם אימות ---------- */
function alKeep_() {
  AL.t = Date.now();
  AL_FROM = 0;
  try { localStorage.setItem(alLocalKey_(), JSON.stringify({ val: alVal_(), sent: false })); } catch (e) {}
  if (AL_T) clearTimeout(AL_T);
  AL_T = setTimeout(alSend_, 1200);
  AL_ST = 'saving';
  alBarPaint_();
}
function alSend_() {
  AL_T = null;
  var key = cfgReadKey_();
  var val = alVal_();
  if (!API || !key) { AL_ST = 'nokey'; alBarPaint_(); return; }
  var gen = ++AL_GEN;
  fetch(API, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'alonRow', key: key, mas: S.mas, daf: S.daf, val: val }) })
    .catch(function () {})
    .then(function () { alVerify_(0, gen, val); });
}
function alVerify_(tries, gen, val) {
  setTimeout(function () {
    if (gen !== AL_GEN) return;
    sheetCsv(ALON_TAB).then(function (rows) {
      if (gen !== AL_GEN) return;
      var m = dmapFromRows(rows), got = m ? m[dmKey(S.mas, S.daf)] : undefined;
      var have = got === undefined ? '' : JSON.stringify(got);
      if (m && (have === val || (!val && !got))) {
        AL_SENT = val;
        /* בינתיים נבחר עוד משהו — זה עוד לא נשמר, והשליחה שלו בדרך */
        if (alVal_() !== val || AL_T) return;
        AL_ST = 'saved';
        try { localStorage.setItem(alLocalKey_(), JSON.stringify({ val: val, sent: true })); } catch (e) {}
        alBarPaint_();
        return;
      }
      if (tries < 4) { alVerify_(tries + 1, gen, val); return; }
      AL_ST = 'fail'; alBarPaint_();
      AL_T = setTimeout(alSend_, 60000);
    }).catch(function () {
      if (tries < 4) { alVerify_(tries + 1, gen, val); return; }
      AL_ST = 'fail'; alBarPaint_();
      AL_T = setTimeout(alSend_, 60000);
    });
  }, 1200 + tries * 1200);
}
/* בחירה שלא אומתה במכשיר הזה גוברת — היא העבודה האחרונה כאן,
   והיא נשלחת שוב. אחרת — מה שבגיליון. אין טיוטה בגיליון (והקריאה
   הצליחה) — הגרסה המאושרת האחרונה, מכל מכשיר רכז. */
function alLoad_() {
  var loc = null;
  try { loc = JSON.parse(localStorage.getItem(alLocalKey_()) || 'null'); } catch (e) {}
  return Promise.all([sheetCsv(ALON_TAB), alArchLoad_()]).then(function (res) {
    var m = dmapFromRows(res[0]), got = m && m[dmKey(S.mas, S.daf)];
    var lastV = alArchLast_();
    if (loc && !loc.sent && loc.val) {
      try { AL = JSON.parse(loc.val); } catch (e) {}
      alNorm_();
      alKeep_();
    } else if (got && !got.__bad && got.items) {
      AL = got; alNorm_(); AL_SENT = JSON.stringify(got); AL_ST = 'saved';
    } else if (m && lastV && lastV.snap && lastV.snap.al) {
      AL = JSON.parse(JSON.stringify(lastV.snap.al)); alNorm_();
      AL_FROM = lastV.ver; AL_ST = 'arch';
    } else if (!m && loc && loc.val) {
      try { AL = JSON.parse(loc.val); } catch (e2) {}
    }
    alNorm_();
    alPaint_(); alBarPaint_();
  });
}

/* ---------- הארכיון: הגרסאות המאושרות של הדף ----------
   לשונית חסרה — gviz מגיש את הראשונה, בלי הכותרות שלנו: אין
   ארכיון ([]). קריאה שנכשלה — null, והרשימה הקודמת נשארת. */
function alArchLoad_() {
  return sheetCsv(ALON_ARCH).then(function (rows) {
    if (!rows) return AL_ARCH;
    var h = (rows[0] || []).join('|');
    if (h.indexOf('גרסה') < 0 || h.indexOf('מזהה') < 0) { AL_ARCH = []; return AL_ARCH; }
    var me = dmKey(S.mas, S.daf), out = [];
    rows.slice(1).forEach(function (r) {
      if (dmKey((r[0] || '').trim(), (r[1] || '').trim()) !== me) return;
      var snap = null;
      try { snap = JSON.parse(r[4] || ''); } catch (e) { snap = null; }
      out.push({ ver: +r[2] || 0, at: r[3] || '', snap: snap, pdf: (r[5] || '').trim(),
                 id: (r[6] || '').trim(), pst: (r[7] || '').trim() });
    });
    out.sort(function (a, b) { return a.ver - b.ver; });
    AL_ARCH = out;
    return out;
  }).catch(function () { return AL_ARCH; });
}
function alArchLast_() {
  if (!AL_ARCH || !AL_ARCH.length) return null;
  for (var i = AL_ARCH.length - 1; i >= 0; i--) if (AL_ARCH[i].snap) return AL_ARCH[i];
  return null;
}

/* ---------- הפס העליון ---------- */
function alBarPaint_() {
  var b = $('al-bar');
  if (!b) return;
  var st = { saving: alU_('alSaving'), saved: alU_('alSaved'), fail: alU_('alSaveFail'),
             nokey: alU_('alNoKey'), arch: alU_('alFromArch', { v: AL_FROM }) }[AL_ST] || '';
  b.innerHTML = '<b>' + esc(alU_('alBar')) + '</b>' +
    '<span class="al-n">' + esc(alU_('alCount', { n: AL.items.length })) + '</span>' +
    '<span class="al-st' + (AL_ST === 'fail' || AL_ST === 'nokey' ? ' bad' : '') + '">' + esc(st) + '</span>' +
    '<span class="sp"></span>' +
    '<button class="al-go" id="al-open">' + esc(alU_('alPrev')) + '</button>' +
    '<a class="al-x" id="al-exit">' + esc(alU_('alExit')) + '</a>';
  $('al-open').onclick = alPreview_;
  $('al-exit').href = location.href.replace(/([?&])alon=1(&|$)/, function (m, a, b2) { return b2 ? a : ''; });
}

/* ---------- החלונית של הקטע ---------- */
function alPaint_() {
  var box = $('al-pane');
  if (!box || !FLAT.length) return;
  var v = FLAT[IDX];
  if (!v) return;
  var st = alStepOf_(alStepKey_(v)) || { v: v, idx: IDX, key: alStepKey_(v) };
  var off = alOffer_(st), s = st.key;
  var notes = AL.notes || {}, ed = AL.ed || {};
  /* הערה לפריט — נפתחת בהקשה, ופתוחה תמיד כשיש בה משהו */
  var noteH = function (it) {
    var k = alIK_(it), v = notes[k] || '';
    if (!v && !AL_OPEN['n:' + k]) {
      return '<button class="al-nb" data-nk="' + esc(k) + '">' + esc(alU_('alNoteB')) + '</button>';
    }
    return '<textarea class="al-ni" rows="2" data-nk="' + esc(k) + '" placeholder="' +
      esc(alU_('alNoteL')) + '">' + esc(v) + '</textarea>';
  };
  var btn = function (it, data) {
    var on = alFind_(it) >= 0;
    return '<div class="al-row"><button class="al-tg' + (on ? ' on' : '') + '" ' + data + '>' +
      esc(on ? alU_('alIn') : alU_('alAdd')) + '</button>' + noteH(it) + '</div>';
  };
  var ttl = (ed.titles || {})[s] || '', quo = (ed.quotes || {})[s] || '';
  var h = '<div class="al-h"><b>' + esc(alSrc_(st)) + '</b>' +
    '<button class="al-eb' + (ttl || quo ? ' on' : '') + '" id="al-eb">' + esc(alU_('alEdit')) + '</button></div>';
  if (AL_OPEN['e:' + s] || ttl || quo) {
    h += '<div class="al-ed"><label>' + esc(alU_('alTitleL')) +
      '<input type="text" id="al-ttl" placeholder="' + esc(alSrc_(st)) + '" value="' + esc(ttl) + '"></label>' +
      '<label>' + esc(alU_('alQuoteL')) + '<textarea id="al-quo" rows="3">' + esc(quo) + '</textarea></label></div>';
  }
  if (off.q.length || off.drafts) {
    h += '<div class="al-sec">' + esc(alU_('alQ')) + '</div>';
    off.q.forEach(function (x) {
      var it = { k: 'q', s: s, i: x.i };
      h += '<div class="al-card al-qc' + (alFind_(it) >= 0 ? ' on' : '') + '"><div class="al-qq">' +
        esc(x.q.q || '') + '</div><ol class="al-qa">' + (x.q.a || []).map(function (a) {
          return '<li>' + esc(a) + '</li>';
        }).join('') + '</ol>' + btn(it, 'data-q="' + x.i + '"') + '</div>';
    });
    if (off.drafts) h += '<p class="al-note">' + esc(alU_('alDraftQ', { n: off.drafts })) + '</p>';
  }
  if (off.own.length) {
    h += '<div class="al-sec">' + esc(alU_('alOwn')) + '</div>';
    off.own.forEach(function (x) {
      var it = { k: 'own', s: s, pid: x.pid };
      h += '<div class="al-card' + (alFind_(it) >= 0 ? ' on' : '') + '">' +
        (x.p.tag ? '<span class="al-tag">' + esc(x.p.tag) + '</span>' : '') +
        '<div class="al-txt">' + ownSan(x.p.text) + '</div>' +
        btn(it, 'data-own="' + esc(x.pid) + '"') + '</div>';
    });
  }
  if (off.sl.length) {
    h += '<div class="al-sec">' + esc(alU_('alSl')) + '</div>';
    off.sl.forEach(function (x, i) {
      var it = { k: 'sl', s: s, f: x.f }, other = alSlElsewhere_(x.f, s), os = other && alStepOf_(other);
      h += '<div class="al-card al-slc' + (alFind_(it) >= 0 ? ' on' : '') + '">' +
        '<img src="' + esc(x.f) + '" alt="" loading="lazy">' +
        (os ? '<p class="al-note">' + esc(alU_('alSlTwice', { src: alSrc_(os) })) + '</p>' : '') +
        btn(it, 'data-sl="' + i + '"') + '</div>';
    });
  }
  if (!off.q.length && !off.own.length && !off.sl.length) {
    h += '<p class="al-none">' + esc(alU_('alNone')) + '</p>';
  }
  box.innerHTML = h;
  $('al-eb').onclick = function () { AL_OPEN['e:' + s] = !AL_OPEN['e:' + s]; alPaint_(); };
  var edSet = function (id, field) {
    var el = $(id);
    if (!el) return;
    el.oninput = function () { AL.ed[field][s] = el.value; alKeep_(); };
  };
  edSet('al-ttl', 'titles');
  edSet('al-quo', 'quotes');
  [].forEach.call(box.querySelectorAll('button[data-nk]'), function (b) {
    b.onclick = function () {
      AL_OPEN['n:' + b.getAttribute('data-nk')] = 1;
      alPaint_();
      [].forEach.call(box.querySelectorAll('textarea[data-nk]'), function (t) {
        if (t.getAttribute('data-nk') === b.getAttribute('data-nk')) t.focus();
      });
    };
  });
  [].forEach.call(box.querySelectorAll('textarea[data-nk]'), function (t) {
    t.oninput = function () { AL.notes[t.getAttribute('data-nk')] = t.value; alKeep_(); };
  });
  [].forEach.call(box.querySelectorAll('[data-q]'), function (b) {
    b.onclick = function () {
      var x = off.q.filter(function (y) { return String(y.i) === b.getAttribute('data-q'); })[0];
      if (x) alToggle_({ k: 'q', s: s, i: x.i, h: x.h });
    };
  });
  [].forEach.call(box.querySelectorAll('[data-own]'), function (b) {
    b.onclick = function () {
      var x = off.own.filter(function (y) { return y.pid === b.getAttribute('data-own'); })[0];
      if (x) alToggle_({ k: 'own', s: s, pid: x.pid, h: x.h });
    };
  });
  [].forEach.call(box.querySelectorAll('[data-sl]'), function (b) {
    b.onclick = function () {
      var x = off.sl[+b.getAttribute('data-sl')];
      if (x) alToggle_({ k: 'sl', s: s, f: x.f });
    };
  });
}

/* ============================================================
   מה ייכנס לעלון — לפי סדר הלימוד, ומה לא נמצא.
   ============================================================ */
function alResolve_() {
  var blocks = [], warn = [], byStep = {}, order = [], usedF = {};
  AL.items.forEach(function (it) {
    var st = alStepOf_(it.s);
    if (!st) { warn.push(alU_('alMissStep')); return; }
    if (!byStep[st.key]) { byStep[st.key] = { st: st, q: [], own: [], sl: [] }; order.push(st.key); }
    var off = alOffer_(st), g = byStep[st.key];
    if (it.k === 'q') {
      var all = qPieces_(st.v.n), cur = all[it.i];
      var hit = (cur && cur.pub && (!it.h || alHash_(JSON.stringify(cur.pub)) === it.h)) ? cur.pub : null;
      /* השאלה זזה ברשימה (נוספה שאלה לפניה) — אותו נוסח בדיוק */
      if (!hit) all.forEach(function (x) { if (!hit && x.pub && alHash_(JSON.stringify(x.pub)) === it.h) hit = x.pub; });
      if (hit) { g.q.push({ i: it.i, q: hit }); return; }
      if (cur && cur.pub) { g.q.push({ i: it.i, q: cur.pub }); warn.push(alU_('alChgQ', { n: st.v.n })); return; }
      warn.push(alU_('alMissQ', { n: st.v.n }));
      return;
    }
    if (it.k === 'own') {
      var p = off.own.filter(function (x) { return x.pid === it.pid; })[0];
      if (!p) { warn.push(alU_('alMissOwn', { n: st.v.n })); return; }
      if (it.h && p.h !== it.h) warn.push(alU_('alChgOwn', { n: st.v.n }));
      g.own.push(p);
      return;
    }
    if (it.k === 'sl') {
      if (usedF[it.f]) return;
      usedF[it.f] = 1;
      g.sl.push({ f: it.f });
    }
  });
  /* סדר מותאם (ed.order) גובר; יחידה שאינה בו — אחריו, בסדר הלימוד */
  var cust = (AL.ed && AL.ed.order) || [];
  var pos = function (k) { var i = cust.indexOf(k); return i < 0 ? 100000 + byStep[k].st.idx : i; };
  order.sort(function (a, b) { return pos(a) - pos(b); });
  order.forEach(function (k) {
    var g = byStep[k];
    g.q.sort(function (a, b) { return a.i - b.i; });
    var own = alOffer_(g.st).own.map(function (x) { return x.pid; });
    g.own.sort(function (a, b) { return own.indexOf(a.pid) - own.indexOf(b.pid); });
    blocks.push(g);
  });
  return { blocks: blocks, warn: warn };
}

/* ============================================================
   התצוגה המקדימה — עמודים אמיתיים, וה-PDF.
   ============================================================
   כל עמוד הוא קופסה במידות הנייר (מ"מ), והתוכן נשפך אליה גוש אחר
   גוש: גוש שלא נכנס עובר לעמוד הבא, וכותרת קטע אינה נשארת לבדה
   בתחתית עמוד — היא עוברת עם מה שאחריה. שקף לעולם אינו מוקטן מתחת
   לרוחב הטור; שקף גבוה מהעמוד מוגבל לגובה העמוד. ההדפסה מדפיסה את
   אותן קופסאות בדיוק (`@page` באותן מידות, בלי שוליים של הדפדפן).
   ============================================================ */
var AL_PAPER = { A4: [210, 297], A5: [148, 210] };
function alLogo_() {
  if (window.LOGO_MARK) return Promise.resolve();
  return new Promise(function (ok) {
    var s = document.createElement('script');
    s.src = 'logo.js';
    s.onload = s.onerror = function () { ok(); };
    document.head.appendChild(s);
  });
}
/* תיקוני טקסט לעלון בלבד (ed.fix) — בייצוא, לא במקור. `AL_FIXHIT`
   סופר כמה פעמים כל תיקון חל; תיקון שלא נמצא נאמר בתצוגה המקדימה. */
var AL_FIXHIT = [], AL_HEADTXT = '';
function alFixList_() {
  return ((AL.ed && AL.ed.fix) || []).filter(function (f) { return f && String(f.a || ''); });
}
function alFix_(s) {
  s = String(s == null ? '' : s);
  alFixList_().forEach(function (f, i) {
    var n = s.split(f.a).length - 1;
    if (n) { AL_FIXHIT[i] = (AL_FIXHIT[i] || 0) + n; s = s.split(f.a).join(f.b || ''); }
  });
  return s;
}
/* ב-HTML — רק בטקסט, לא בתגיות */
function alFixHtml_(html) {
  return String(html || '').split(/(<[^>]*>)/).map(function (p) {
    if (p.charAt(0) === '<') return p;
    var out = p;
    alFixList_().forEach(function (f, i) {
      [f.a, esc(f.a)].forEach(function (a, j) {
        if (j && a === f.a) return;
        var n = out.split(a).length - 1;
        if (n) { AL_FIXHIT[i] = (AL_FIXHIT[i] || 0) + n; out = out.split(a).join(j ? esc(f.b || '') : (f.b || '')); }
      });
    });
    return out;
  }).join('');
}
/* תווית קצרה לגוש — לרשימת ההבדלים מהגרסה המאושרת */
function alShort_(t) {
  t = String(t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > 48 ? t.slice(0, 48) + '…' : t;
}
function alQHtml_(x) {
  return '<div class="alp-q"><span class="alp-ql">' + esc(alU_('alQone')) + '</span>' +
    '<div class="alp-qq">' + esc(alFix_(x.q.q || '')) + '</div><ol>' + (x.q.a || []).map(function (a) {
      return '<li>' + esc(alFix_(a)) + '</li>';
    }).join('') + '</ol></div>';
}
function alBlocksHtml_(res) {
  var out = [];
  AL_FIXHIT = [];
  AL_HEADTXT = alHeadTxt_();
  var ed = AL.ed || {};
  var yr = (window.PROGRAM && PROGRAM.year) || '';
  out.push({ t: 'mast', h: '<div class="alp-mast"><span class="m"><img alt="" src="' +
    esc(window.LOGO_MARK || '') + '"></span><div class="w"><b>' + esc(alU_('alBrand1')) +
    '</b><span>' + esc(alU_('alBrand2')) + '</span>' + (yr ? '<i>' + esc(yr) + '</i>' : '') +
    '</div></div><h1 class="alp-t">' + esc(alU_('alTitle')) + '</h1><div class="alp-sub">' +
    esc(alU_('alSub', { mas: MAS_NAME[S.mas] || S.mas, daf: S.daf })) + '</div>', l: alU_('alLbMast') });
  res.blocks.forEach(function (g) {
    var k = g.st.key, ttl = String((ed.titles || {})[k] || '').trim() || alSrc_(g.st);
    out.push({ t: 'h', h: '<div class="alp-src">' + esc(alFix_(ttl)) + '</div>', l: alU_('alLbH', { x: alShort_(ttl) }) });
    var qs = g.q.slice();
    /* ציטוט מהגמרא — במסגרת, והחידה הראשונה של היחידה לצידו */
    var quo = String((ed.quotes || {})[k] || '').trim();
    if (quo) {
      var q0 = qs.shift();
      out.push({ t: 'gq', h: '<div class="alp-gq"><blockquote class="alp-gm"><span class="alp-gml">' +
        esc(alU_('alGemara')) + '</span>' + esc(alFix_(quo)).replace(/\n/g, '<br>') + '</blockquote>' +
        (q0 ? alQHtml_(q0) : '') + '</div>',
        l: alU_('alLbGq', { x: alShort_(quo) }) });
    }
    qs.forEach(function (x) {
      out.push({ t: 'q', h: alQHtml_(x), l: alU_('alLbQ', { x: alShort_(x.q.q) }) });
    });
    g.own.forEach(function (x) {
      out.push({ t: 'own', h: '<div class="alp-own">' +
        (x.p.tag ? '<span class="alp-tag">' + esc(alFix_(x.p.tag)) + '</span>' : '') +
        '<div class="alp-txt">' + alFixHtml_(ownSan(x.p.text)) + '</div></div>',
        l: alU_('alLbOwn', { x: alShort_(ownStripHtml_(x.p.text)) }) });
    });
    g.sl.forEach(function (x) {
      out.push({ t: 'sl', f: x.f, h: '<figure class="alp-sl"><img alt="" src="' + esc(x.f) + '"></figure>',
                 l: alU_('alLbSl', { x: String(x.f).split('/').pop() }) });
    });
  });
  alFixList_().forEach(function (f, i) {
    if (!AL_FIXHIT[i]) res.warn.push(alU_('alFixNone', { a: f.a }));
  });
  return out;
}
/* טביעה של העלון: גוש-גוש, עם תווית קריאה. נשמרת בכל אישור,
   ומולה נבדק מה שעל המסך. */
function alFp_(blocks) {
  return blocks.map(function (b) { return { l: b.l || b.t, h: alHash_(b.h) }; });
}
function alHeadTxt_() {
  var hd = String((AL.ed && AL.ed.head) || '').trim();
  return hd ? alU_('alHead', { head: alFix_(hd), mas: MAS_NAME[S.mas] || S.mas, daf: S.daf }) : '';
}
/* שקף כהה — ממוצע הבהירות מתחת לשליש. התמונות מאותו מקור, ולכן
   הקנבס קריא. נמדד על התמונות שכבר נטענו (במדידה שלפני החלוקה) —
   תמונה שעוד לא פוענחה נמדדת שחורה. */
function alDark_(img) {
  try {
    var c = document.createElement('canvas'), w = 48, h = 27;
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, sum = 0;
    for (var i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4) / 255 < 0.36;
  } catch (e) { return false; }
}
function alWaitImgs_(root) {
  var imgs = [].slice.call(root.querySelectorAll('img'));
  return Promise.all(imgs.map(function (im) {
    return new Promise(function (ok) {
      var done = function () { ok(); };
      if (im.complete && im.naturalWidth) return ok();
      im.addEventListener('load', done);
      im.addEventListener('error', done);
      setTimeout(done, 8000);
    });
  }));
}
function alPreview_() {
  var el = $('al-prev');
  if (!el) return;
  document.body.classList.add('al-viewing');
  el.className = 'al-prev on';
  el.innerHTML = '<div class="al-tools"><button id="alp-back">' + esc(alU_('alBack')) + '</button>' +
    '<label>' + esc(alU_('alPaper')) + ' <select id="alp-paper"><option value="A4">A4</option>' +
    '<option value="A5">A5</option></select></label>' +
    '<label class="alp-ink"><input type="checkbox" id="alp-ink"> ' + esc(alU_('alInk')) + '</label>' +
    '<button id="alp-setb">' + esc(alU_('alSetB')) + '</button>' +
    '<button id="alp-archb"></button>' +
    '<span class="sp"></span><span class="al-pages" id="alp-n">' + esc(alU_('alBuilding')) + '</span>' +
    '<button class="al-go" id="alp-pdf">' + esc(alU_('alPdf')) + '</button></div>' +
    '<div class="al-set" id="alp-set"></div><div class="al-arch" id="alp-arch"></div>' +
    '<div id="alp-body"></div>';
  $('alp-back').onclick = alPreviewClose_;
  $('alp-paper').value = AL_PREF.paper;
  $('alp-ink').checked = !!AL_PREF.ink;
  $('alp-paper').onchange = function () { AL_PREF.paper = this.value; alPrefKeep_(); alBuild_(); };
  $('alp-ink').onchange = function () { AL_PREF.ink = this.checked; alPrefKeep_(); alBuild_(); };
  $('alp-pdf').onclick = function () { window.print(); };
  $('alp-setb').onclick = function () {
    var s = $('alp-set');
    s.className = s.className.indexOf(' on') < 0 ? 'al-set on' : 'al-set';
    alSetPaint_();
  };
  $('alp-archb').onclick = function () {
    var a = $('alp-arch');
    a.className = a.className.indexOf(' on') < 0 ? 'al-arch on' : 'al-arch';
    alArchPaint_();
    if (a.className.indexOf(' on') >= 0) alArchLoad_().then(function () { alArchPaint_(); alDiffPaint_(); });
  };
  alArchBtn_();
  alLogo_().then(function () { alBuild_(); });
}
function alArchBtn_() {
  var b = $('alp-archb');
  if (b) b.textContent = alU_('alArchB', { n: AL_ARCH ? AL_ARCH.length : '…' });
}
function alPreviewClose_() {
  var el = $('al-prev');
  if (el) { el.className = 'al-prev'; el.innerHTML = ''; }
  document.body.classList.remove('al-viewing');
  alPaint_();
}
/* בנייה מחדש אחרי הקלדה — אחרי רגע של שקט, לא בכל אות */
function alBuildSoon_() {
  if (AL_BT) clearTimeout(AL_BT);
  AL_BT = setTimeout(function () { AL_BT = null; alBuild_(); }, 700);
}
function alBuild_() {
  var el = $('al-prev'), body = $('alp-body');
  if (!el || !body) return;
  var gen = ++AL_BGEN;
  AL_LAST = null;
  var res = alResolve_();
  var P = AL_PAPER[AL_PREF.paper] || AL_PAPER.A4;
  var css = $('al-page');
  if (!css) { css = document.createElement('style'); css.id = 'al-page'; document.head.appendChild(css); }
  css.textContent = '@page{size:' + P[0] + 'mm ' + P[1] + 'mm;margin:0}' +
    '.alp-pg{width:' + P[0] + 'mm;height:' + (P[1] - 0.6) + 'mm}' +
    /* שקף אחד לעולם אינו גבוה מעמוד — עם כותרת הקטע מעליו */
    '.alp-sl img{max-height:' + (P[1] - 50) + 'mm}';
  var blocks = res.blocks.length ? alBlocksHtml_(res) : [];
  var warn = res.warn.length ? '<div class="al-warn"><b>' + esc(alU_('alMiss')) + '</b><ul>' +
    res.warn.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>' : '';
  var how = '<p class="al-how">' + esc(alU_('alPrintHow')) + ' ' + esc(alU_('alInkH')) + '</p>';
  body.innerHTML = warn + '<div id="alp-diff"></div>' + how + '<div class="al-doc' + (AL_PREF.ink ? ' ink' : '') +
    '" id="alp-doc"></div>';
  $('alp-n').textContent = alU_('alBuilding');
  var doc = $('alp-doc');
  if (!res.blocks.length) {
    doc.innerHTML = '<p class="al-none">' + esc(alU_('alEmpty')) + '</p>';
    $('alp-pdf').disabled = true;
    $('alp-n').textContent = '';
    alArchPaint_();
    return;
  }
  $('alp-pdf').disabled = false;
  /* קודם כל התמונות — בלי המידות שלהן אי אפשר לחלק לעמודים */
  var pre = document.createElement('div');
  pre.className = 'alp-pg alp-measure';
  pre.innerHTML = '<div class="alp-in">' + blocks.map(function (b) { return b.h; }).join('') + '</div>';
  doc.appendChild(pre);
  alWaitImgs_(pre).then(function () {
    if (gen !== AL_BGEN) return;
    var bad = {}, dim = {};
    [].forEach.call(pre.querySelectorAll('.alp-sl img'), function (im) {
      if (!im.naturalWidth) bad[im.getAttribute('src')] = 1;
      else dim[im.getAttribute('src')] = [im.naturalWidth, im.naturalHeight, alDark_(im)];
    });
    doc.removeChild(pre);
    var gone = Object.keys(bad);
    if (gone.length) {
      var w = body.querySelector('.al-warn ul');
      if (!w) {
        body.insertAdjacentHTML('afterbegin', '<div class="al-warn"><b>' + esc(alU_('alMiss')) + '</b><ul></ul></div>');
        w = body.querySelector('.al-warn ul');
      }
      gone.forEach(function (f) { w.insertAdjacentHTML('beforeend', '<li>' + esc(alU_('alMissSl', { f: f })) + '</li>'); });
    }
    var use = blocks.filter(function (b) { return !(b.t === 'sl' && bad[b.f]); });
    var n = alPaginate_(doc, use, dim);
    AL_LAST = { fp: alFp_(use), pages: n, head: AL_HEADTXT };
    alDiffPaint_();
    alArchPaint_();
  });
}
function alPrefKeep_() {
  try { localStorage.setItem('df:alonPref', JSON.stringify(AL_PREF)); } catch (e) {}
  /* גודל הדף וחיסכון הדיו הם חלק מהעלון — נשמרים גם בטיוטה */
  alKeep_();
}

/* ============================================================
   הגדרות העלון — מה שהיה ידני: כותרת עליונה, סדר יחידות, תיקונים
   לעלון בלבד, הערה כללית. הכול נשמר בטיוטה (ed / note).
   ============================================================ */
function alSetPaint_() {
  var box = $('alp-set');
  if (!box || box.className.indexOf(' on') < 0) { if (box) box.innerHTML = ''; return; }
  var ed = AL.ed, res = alResolve_();
  var h = '<label class="al-fl">' + esc(alU_('alHeadL')) +
    '<input type="text" id="als-head" value="' + esc(ed.head || '') + '"></label>';
  if (res.blocks.length > 1) {
    h += '<div class="al-fl">' + esc(alU_('alOrderL')) + '<ol class="al-ord">' +
      res.blocks.map(function (g, i) {
        var t = String((ed.titles || {})[g.st.key] || '').trim() || alSrc_(g.st);
        return '<li><span>' + esc(t) + '</span>' +
          '<button data-mv="' + i + '" data-d="-1"' + (i ? '' : ' disabled') + '>▲</button>' +
          '<button data-mv="' + i + '" data-d="1"' + (i < res.blocks.length - 1 ? '' : ' disabled') + '>▼</button></li>';
      }).join('') + '</ol></div>';
  }
  h += '<div class="al-fl">' + esc(alU_('alFixL')) + '<div id="als-fix">' +
    (ed.fix || []).map(function (f, i) {
      return '<div class="al-fix"><input type="text" data-fa="' + i + '" placeholder="' + esc(alU_('alFixA')) +
        '" value="' + esc(f.a || '') + '"><span>←</span><input type="text" data-fb="' + i + '" placeholder="' +
        esc(alU_('alFixB')) + '" value="' + esc(f.b || '') + '"><button data-fd="' + i + '">' +
        esc(alU_('alFixDel')) + '</button></div>';
    }).join('') + '</div><button id="als-fadd">' + esc(alU_('alFixAdd')) + '</button></div>';
  h += '<label class="al-fl">' + esc(alU_('alNoteG')) + '<textarea id="als-note" rows="3">' +
    esc(AL.note || '') + '</textarea></label>';
  box.innerHTML = h;
  $('als-head').oninput = function () { ed.head = this.value; alKeep_(); alBuildSoon_(); };
  $('als-note').oninput = function () { AL.note = this.value; alKeep_(); };
  $('als-fadd').onclick = function () { ed.fix.push({ a: '', b: '' }); alSetPaint_(); };
  [].forEach.call(box.querySelectorAll('[data-mv]'), function (b) {
    b.onclick = function () {
      var keys = res.blocks.map(function (g) { return g.st.key; });
      var i = +b.getAttribute('data-mv'), j = i + (+b.getAttribute('data-d'));
      if (j < 0 || j >= keys.length) return;
      var t = keys[i]; keys[i] = keys[j]; keys[j] = t;
      ed.order = keys;
      alKeep_(); alSetPaint_(); alBuild_();
    };
  });
  [].forEach.call(box.querySelectorAll('[data-fa],[data-fb]'), function (inp) {
    inp.oninput = function () {
      var a = inp.getAttribute('data-fa'), i = +(a !== null ? a : inp.getAttribute('data-fb'));
      if (!ed.fix[i]) return;
      ed.fix[i][a !== null ? 'a' : 'b'] = inp.value;
      alKeep_(); alBuildSoon_();
    };
  });
  [].forEach.call(box.querySelectorAll('[data-fd]'), function (b) {
    b.onclick = function () {
      ed.fix.splice(+b.getAttribute('data-fd'), 1);
      alKeep_(); alSetPaint_(); alBuild_();
    };
  });
}

/* ============================================================
   מול הגרסה המאושרת — מה שונה. מוצג לפני ההדפסה, ואינו מודפס.
   ============================================================ */
function alDiff_(cur, snap) {
  var out = [];
  if (!cur || !snap) return out;
  if ((snap.tpl || 0) !== AL_TPL) out.push(alU_('alDiffTpl'));
  var pf = (snap.al && snap.al.pf) || {};
  if ((pf.paper || 'A4') !== AL_PREF.paper || !!pf.ink !== !!AL_PREF.ink) out.push(alU_('alDiffPaper'));
  if ((snap.head || '') !== (cur.head || '')) out.push(alU_('alDiffHead'));
  var a = snap.fp || [], b = cur.fp || [];
  var cnt = function (list) { var m = {}; list.forEach(function (x) { m[x.h] = (m[x.h] || 0) + 1; }); return m; };
  var ma = cnt(a), mb = cnt(b);
  b.forEach(function (x) { if (ma[x.h]) ma[x.h]--; else out.push(alU_('alDiffAdd', { x: x.l })); });
  a.forEach(function (x) { if (mb[x.h]) mb[x.h]--; else out.push(alU_('alDiffDel', { x: x.l })); });
  if (out.length === 0 && a.map(function (x) { return x.h; }).join() !== b.map(function (x) { return x.h; }).join()) {
    out.push(alU_('alDiffOrd'));
  }
  if (snap.pages && cur.pages && snap.pages !== cur.pages) out.push(alU_('alDiffPages', { n: cur.pages, m: snap.pages }));
  return out;
}
function alDiffPaint_() {
  var box = $('alp-diff'), last = alArchLast_();
  if (!box) return;
  if (!last || !AL_LAST) { box.innerHTML = ''; return; }
  var d = alDiff_(AL_LAST, last.snap);
  box.innerHTML = d.length
    ? '<div class="al-warn"><b>' + esc(alU_('alDiffH', { v: last.ver })) + '</b><ul>' +
      d.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'
    : '<p class="al-same">' + esc(alU_('alSame', { v: last.ver })) + '</p>';
}

/* ============================================================
   הארכיון — אישור גרסה, ה-PDF שלה, וטעינה לעריכה.
   ============================================================ */
var AL_AMSG = '', AL_ABUSY = false;
function alArchPaint_() {
  alArchBtn_();
  var box = $('alp-arch');
  if (!box || box.className.indexOf(' on') < 0) { if (box) box.innerHTML = ''; return; }
  var last = alArchLast_();
  var same = last && AL_LAST && !alDiff_(AL_LAST, last.snap).length && alVal_() === alSnapVal_(last.snap);
  var h = '<div class="al-ah"><b>' + esc(alU_('alArchH')) + '</b></div>' +
    '<p class="al-note">' + esc(alU_('alApproveH')) + '</p>' +
    '<button class="al-go" id="ala-ok"' + (!AL_LAST || same || AL_ABUSY ? ' disabled' : '') + '>' +
    esc(alU_('alApprove')) + '</button>' +
    (AL_AMSG ? '<p class="al-amsg">' + esc(AL_AMSG) + '</p>' : '');
  if (AL_ARCH === null) h += '<p class="al-note">' + esc(alU_('alArchBad')) + '</p>';
  else if (!AL_ARCH.length) h += '<p class="al-note">' + esc(alU_('alArchNone')) + '</p>';
  else {
    h += '<ul class="al-vers">' + AL_ARCH.slice().reverse().map(function (v) {
      var s = v.snap || {}, pf = (s.al && s.al.pf) || {};
      var pdf = v.pdf
        ? '<a href="' + esc(v.pdf) + '" target="_blank" rel="noopener">' + esc(alU_('alPdfLink')) + '</a>'
        : '<label class="al-up"><input type="file" accept="application/pdf" data-up="' + esc(v.id) + '"' +
          (AL_ABUSY ? ' disabled' : '') + '>' + esc(alU_('alPdfUp')) + '</label>' +
          (v.pst ? '<span class="al-pst">' + esc(v.pst) + '</span>' : '');
      return '<li><span>' + esc(alU_('alVer', { v: v.ver, at: v.at, n: s.pages || '?', paper: pf.paper || 'A4' })) +
        '</span>' + pdf + (s.al ? '<button data-ld="' + v.ver + '"' + (AL_ABUSY ? ' disabled' : '') + '>' +
        esc(alU_('alLoadV')) + '</button>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  box.innerHTML = h;
  $('ala-ok').onclick = alApprove_;
  [].forEach.call(box.querySelectorAll('[data-up]'), function (inp) {
    inp.onchange = function () { if (inp.files && inp.files[0]) alPdfUp_(inp.getAttribute('data-up'), inp.files[0]); };
  });
  [].forEach.call(box.querySelectorAll('[data-ld]'), function (b) {
    b.onclick = function () {
      var v = +b.getAttribute('data-ld');
      var row = AL_ARCH.filter(function (x) { return x.ver === v; })[0];
      if (!row || !row.snap || !row.snap.al) return;
      if (!confirm(alU_('alLoadQ', { v: v }))) return;
      AL = JSON.parse(JSON.stringify(row.snap.al));
      alNorm_();
      alKeep_();
      $('alp-paper').value = AL_PREF.paper;
      $('alp-ink').checked = !!AL_PREF.ink;
      AL_AMSG = '';
      alSetPaint_();
      alBuild_();
    };
  });
}
/* הטיוטה כפי שנשמרה בתוך גרסה — להשוואה עם מה שעל המסך */
function alSnapVal_(snap) {
  if (!snap || !snap.al) return '';
  var keep = AL, kp = { paper: AL_PREF.paper, ink: AL_PREF.ink }, v;
  AL = JSON.parse(JSON.stringify(snap.al));
  alNorm_();
  AL.t = keep.t;
  v = alVal_();
  AL = keep; AL_PREF.paper = kp.paper; AL_PREF.ink = kp.ink;
  return v;
}
function alRid_() {
  var s = 'v', c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 14; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}
function alApprove_() {
  var key = cfgReadKey_();
  if (!AL_LAST || AL_ABUSY) return;
  if (!API || !key) { AL_AMSG = alU_('alNoKey'); alArchPaint_(); return; }
  var nextV = (AL_ARCH && AL_ARCH.length ? AL_ARCH[AL_ARCH.length - 1].ver : 0) + 1;
  if (!confirm(alU_('alApproveQ', { v: nextV }))) return;
  var cur = alVal_();
  var snap = { id: alRid_(), tpl: AL_TPL, at: new Date().toISOString(), pages: AL_LAST.pages,
               head: AL_LAST.head || '', fp: AL_LAST.fp, al: cur ? JSON.parse(cur) : { items: [] } };
  AL_ABUSY = true; AL_AMSG = alU_('alApproving'); alArchPaint_();
  /* הטיוטה נשמרת גם היא — שלא יישאר אישור על משהו שאינו בטיוטה */
  if (AL_T) { clearTimeout(AL_T); alSend_(); }
  fetch(API, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'alonArch', key: key, mas: S.mas, daf: S.daf, val: JSON.stringify(snap) }) })
    .catch(function () {})
    .then(function () { alArchWait_(0, function (rows) {
      return rows.filter(function (r) { return r.id === snap.id; })[0];
    }, function (row) {
      AL_ABUSY = false;
      AL_AMSG = row ? alU_('alApproved', { v: row.ver }) : alU_('alApproveFail');
      alArchPaint_(); alDiffPaint_();
    }); });
}
/* קריאה חוזרת של הארכיון עד שהתנאי מתקיים — no-cors אינו מספר דבר */
function alArchWait_(tries, test, done, max) {
  max = max || 5;
  setTimeout(function () {
    alArchLoad_().then(function (rows) {
      var hit = rows && test(rows);
      if (hit) return done(hit);
      if (tries + 1 < max) return alArchWait_(tries + 1, test, done, max);
      done(null);
    });
  }, 1500 + tries * 1500);
}
var AL_PDF_MAX = 30;   /* MB */
function alPdfUp_(id, file) {
  var key = cfgReadKey_();
  if (AL_ABUSY) return;
  if (!API || !key) { AL_AMSG = alU_('alNoKey'); alArchPaint_(); return; }
  var mb = file.size / 1048576;
  if (mb > AL_PDF_MAX) { AL_AMSG = alU_('alPdfBig', { mb: mb.toFixed(1), max: AL_PDF_MAX }); alArchPaint_(); return; }
  var row0 = (AL_ARCH || []).filter(function (r) { return r.id === id; })[0];
  var pst0 = row0 ? row0.pst : '';
  AL_ABUSY = true; AL_AMSG = alU_('alPdfUping'); alArchPaint_();
  var fr = new FileReader();
  fr.onerror = function () { AL_ABUSY = false; AL_AMSG = alU_('alPdfNot'); alArchPaint_(); };
  fr.onload = function () {
    var data = String(fr.result || '').replace(/^data:[^,]*,/, '');
    if (!/^JVBER/.test(data)) { AL_ABUSY = false; AL_AMSG = alU_('alPdfNot'); alArchPaint_(); return; }
    fetch(API, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
      action: 'alonPdf', key: key, mas: S.mas, daf: S.daf, id: id, name: file.name, data: data }) })
      .catch(function () {})
      .then(function () { alArchWait_(0, function (rows) {
        var r = rows.filter(function (x) { return x.id === id; })[0];
        return r && (r.pdf || (r.pst && r.pst !== pst0)) ? r : null;
      }, function (r) {
        AL_ABUSY = false;
        AL_AMSG = !r ? alU_('alPdfNoAns') : r.pdf ? alU_('alPdfOk') : alU_('alPdfFail', { why: r.pst });
        alArchPaint_();
      }, 8); });
  };
  fr.readAsDataURL(file);
}
/* `dim` — המידות של כל שקף. תמונה חדשה בעמוד מקבלת גובה רק אחרי
   שהיא מפוענחת, גם כשהיא במטמון; בלי המידות מראש החלוקה מודדת
   אפס, והשקף נחתך בתחתית העמוד. */
function alPaginate_(doc, blocks, dim) {
  var pages = [];
  var newPage = function () {
    var pg = document.createElement('div');
    pg.className = 'alp-pg';
    /* כותרת עליונה (פרשה · דף) — רק אם נקבעה, בכל עמוד */
    pg.innerHTML = (AL_HEADTXT ? '<div class="alp-head">' + esc(AL_HEADTXT) + '</div>' : '') +
      '<div class="alp-in"></div><div class="alp-foot"></div>';
    /* שורת התחתית תופסת מקום כבר עכשיו. נכתבה רק בסוף, והעמוד שנמדד
       היה גבוה מזה שהודפס — וסוף הטקסט נחתך. */
    pg.lastChild.textContent = alU_('alFoot', { i: 99, n: 99, daf: S.daf });
    doc.appendChild(pg);
    pages.push(pg);
    return pg.querySelector('.alp-in');
  };
  var inn = newPage();
  var full = function () { return inn.scrollHeight > inn.clientHeight + 1; };
  var fits = function () { return !full(); };
  /* יש בעמוד משהו מלבד כותרת קטע שהועברה אליו? */
  var hasBody = function (except) {
    for (var c = inn.firstChild; c; c = c.nextSibling) {
      if (except.indexOf(c) < 0 && c.className !== 'alp-src') return true;
    }
    return false;
  };
  blocks.forEach(function (b) {
    var tmp = document.createElement('div');
    tmp.innerHTML = b.h;
    [].forEach.call(tmp.querySelectorAll('.alp-sl img'), function (im) {
      var d = (dim || {})[im.getAttribute('src')];
      if (d) { im.setAttribute('width', d[0]); im.setAttribute('height', d[1]); if (d[2]) im.className = 'dark'; }
    });
    var nodes = [].slice.call(tmp.childNodes);
    nodes.forEach(function (n) { inn.appendChild(n); });
    if (!full()) return;
    /* לא נכנס, ויש לפניו תוכן — עובר לעמוד חדש. כותרת קטע לא נשארת
       יתומה בתחתית: עוברת איתו. עמוד שיש בו רק כותרת — לא נפתח
       עמוד חדש בשבילו (זה מה שיצר עמוד ריק). */
    /* גוש שגבוה מעמוד שלם ימשיך ממילא לעמוד הבא — אם נשאר כאן מקום
       של כמה שורות, הוא מתחיל כאן ולא משאיר עמוד חצי ריק. */
    var blockH = 0, usedH = 0;
    nodes.forEach(function (n) { if (n.nodeType === 1) blockH += n.offsetHeight; });
    for (var c0 = inn.firstChild; c0; c0 = c0.nextSibling) {
      if (nodes.indexOf(c0) < 0 && c0.nodeType === 1) usedH += c0.offsetHeight;
    }
    var stay = blockH > inn.clientHeight && inn.clientHeight - usedH > 110;
    if (hasBody(nodes) && !stay) {
      nodes.forEach(function (n) { inn.removeChild(n); });
      var carry = [];
      var last = inn.lastChild;
      if (last && last.className === 'alp-src') { inn.removeChild(last); carry.push(last); }
      inn = newPage();
      carry.concat(nodes).forEach(function (n) { inn.appendChild(n); });
      if (!full()) return;
    }
    /* גבוה מעמוד שלם — פירוש ארוך, שאלה עם תשובות ארוכות. ממשיכים
       לעמוד הבא: מה שלא נכנס עובר, פסקה אחר פסקה ואם צריך מילה אחר
       מילה. לא חותכים בשקט ולא מקטינים. */
    var node = nodes[nodes.length - 1], guard = 0;
    while (node && node.nodeType === 1 && full() && guard++ < 60) {
      var rest = node.cloneNode(false);
      alSplit_(node, rest, fits);
      if (!alHasText_(rest)) break;              /* אין מה לפצל (שקף) */
      if (!alHasText_(node)) {                   /* לא נכנס כלום — הכל עובר */
        inn.removeChild(node);
        rest = node;
        if (!hasBody([])) { inn.appendChild(node); break; }
      } else {
        alContMark_(node, rest);
      }
      inn = newPage();
      inn.appendChild(rest);
      node = rest;
    }
  });
  /* עמוד שנשאר ריק — יורד */
  pages = pages.filter(function (pg) {
    if (pg.querySelector('.alp-in').childNodes.length) return true;
    doc.removeChild(pg);
    return false;
  });
  var N = pages.length;
  pages.forEach(function (pg, i) {
    pg.lastChild.textContent = alU_('alFoot', { i: i + 1, n: N, daf: S.daf });
  });
  var pn = $('alp-n');
  if (pn) pn.textContent = alU_('alPages', { n: N });
  alFit_();
  return N;
}
/* החלק שעבר לעמוד הבא: תווית "המשך", ומספור התשובות ממשיך (ד׳ ולא א׳) */
function alContMark_(node, rest) {
  rest.className += ' alp-cont';
  var a = node.querySelectorAll('ol'), b = rest.querySelectorAll('ol');
  if (a.length && b.length) {
    var o = a[a.length - 1], r = b[0], n = 0;
    for (var c = o.firstChild; c; c = c.nextSibling) if (c.nodeName === 'LI') n++;
    var first = r.firstChild;
    var split = first && first.nodeName === 'LI' && first.getAttribute('data-cont') === '1';
    r.setAttribute('start', String((+o.getAttribute('start') || 1) + n - (split ? 1 : 0)));
  }
  var l = document.createElement('span');
  l.className = 'alp-contl';
  l.textContent = alU_('alCont');
  rest.insertBefore(l, rest.firstChild);
}
function alHasText_(el) { return !!(el && String(el.textContent || '').replace(/\s+/g, '')); }
/* מעביר את סוף התוכן של `el` אל `rest` (שעוד אינו בעמוד) עד שהעמוד
   מכיל את `el`. יורד לתוך האלמנט האחרון, ובטקסט — מילה אחר מילה.
   תוויות (חידה, פירוש) נשארות בחלק הראשון. */
function alSplit_(el, rest, fits) {
  while (!fits() && el.lastChild) {
    var c = el.lastChild;
    el.removeChild(c);
    if (!fits()) { rest.insertBefore(c, rest.firstChild); continue; }
    /* בלעדיו נכנס — מחזירים ומפצלים אותו עצמו */
    el.appendChild(c);
    if (c.nodeType === 3) {
      var words = c.nodeValue.split(' '), lo = 0, hi = words.length;
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        c.nodeValue = words.slice(0, mid).join(' ');
        if (fits()) lo = mid; else hi = mid - 1;
      }
      c.nodeValue = words.slice(0, lo).join(' ');
      var tail = words.slice(lo).join(' ');
      if (tail) rest.insertBefore(document.createTextNode(tail), rest.firstChild);
      if (!lo) el.removeChild(c);
    } else if (c.nodeType === 1 && c.childNodes.length && !/^(IMG|svg)$/i.test(c.nodeName)) {
      var cr = c.cloneNode(false);
      alSplit_(c, cr, fits);
      if (cr.childNodes.length) { cr.setAttribute('data-cont', '1'); rest.insertBefore(cr, rest.firstChild); }
      if (!alHasText_(c)) { el.removeChild(c); if (!cr.childNodes.length) rest.insertBefore(c, rest.firstChild); }
    } else {
      el.removeChild(c);
      rest.insertBefore(c, rest.firstChild);
    }
    return;
  }
}
/* בטלפון העמוד רחב מהמסך — התצוגה מוקטנת לרוחב, אחרי החלוקה
   ובלי לשנות אותה. בהדפסה — תמיד בגודל אמיתי (ב-CSS). */
function alFit_() {
  var doc = $('alp-doc');
  if (!doc) return;
  var pg = doc.querySelector('.alp-pg');
  if (!pg) return;
  pg.style.zoom = '';
  var z = Math.min(1, (doc.clientWidth - 16) / pg.offsetWidth);
  [].forEach.call(doc.querySelectorAll('.alp-pg'), function (x) { x.style.zoom = z < 1 ? String(z) : ''; });
}
window.addEventListener('resize', function () { if (document.body.classList.contains('al-viewing')) alFit_(); });

/* ---------- כניסה למצב ---------- */
function alonInit_() {
  /* הפתיחה רצה פעמיים כשהדף בודק קודם אם הוא פתוח — פעם אחת מספיקה */
  if (!ALON_ON || $('al-bar')) return;
  document.body.classList.add('alon');
  document.body.classList.add('chav-on');
  var main = document.querySelector('main'), chav = $('chav');
  var bar = document.createElement('div');
  bar.className = 'al-bar'; bar.id = 'al-bar';
  document.body.insertBefore(bar, main);
  var pane = document.createElement('div');
  pane.className = 'al-pane'; pane.id = 'al-pane';
  chav.appendChild(pane);
  var prev = document.createElement('div');
  prev.className = 'al-prev'; prev.id = 'al-prev';
  document.body.appendChild(prev);
  alBarPaint_();
}
