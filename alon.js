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
   ============================================================ */
var ALON_ON = (function () {
  if (!/[?&]alon=1\b/.test(location.search)) return false;
  if (/[?&](demo|rec)=1\b/.test(location.search)) return false;
  try { return localStorage.getItem('df:admOk') === '1'; } catch (e) { return false; }
})();
var ALON_TAB = 'עלון';
var AL = { items: [] };   /* הבחירה של הדף שעל המסך */
var AL_SENT = '';         /* מה שאומת בגיליון */
var AL_T = null, AL_GEN = 0, AL_ST = '';
var AL_PREF = { paper: 'A4', ink: false };
try {
  var alp = JSON.parse(localStorage.getItem('df:alonPref') || 'null');
  if (alp) { AL_PREF.paper = alp.paper === 'A5' ? 'A5' : 'A4'; AL_PREF.ink = !!alp.ink; }
} catch (e) {}

function alU_(k, o) { return fillT((window.UI && UI[k]) || '', o || {}); }
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
  var val = JSON.stringify(AL);
  try { localStorage.setItem(alLocalKey_(), JSON.stringify({ val: val, sent: false })); } catch (e) {}
  if (AL_T) clearTimeout(AL_T);
  AL_T = setTimeout(alSend_, 1200);
  AL_ST = 'saving';
  alBarPaint_();
}
function alSend_() {
  AL_T = null;
  var key = cfgReadKey_();
  var val = JSON.stringify(AL);
  if (!API || !key) { AL_ST = 'nokey'; alBarPaint_(); return; }
  var gen = ++AL_GEN;
  fetch(API, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'alonRow', key: key, mas: S.mas, daf: S.daf, val: AL.items.length ? val : '' }) })
    .catch(function () {})
    .then(function () { alVerify_(0, gen, AL.items.length ? val : ''); });
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
        var now = AL.items.length ? JSON.stringify(AL) : '';
        if (now !== val || AL_T) return;
        AL_ST = 'saved';
        try { localStorage.setItem(alLocalKey_(), JSON.stringify({ val: JSON.stringify(AL), sent: true })); } catch (e) {}
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
   והיא נשלחת שוב. אחרת — מה שבגיליון. */
function alLoad_() {
  var loc = null;
  try { loc = JSON.parse(localStorage.getItem(alLocalKey_()) || 'null'); } catch (e) {}
  return sheetCsv(ALON_TAB).then(function (rows) {
    var m = dmapFromRows(rows), got = m && m[dmKey(S.mas, S.daf)];
    if (loc && !loc.sent && loc.val) {
      try { AL = JSON.parse(loc.val); } catch (e) {}
      alKeep_();
    } else if (got && !got.__bad && got.items) {
      AL = got; AL_SENT = JSON.stringify(got); AL_ST = 'saved';
    } else if (!m && loc && loc.val) {
      try { AL = JSON.parse(loc.val); } catch (e2) {}
    }
    if (!AL.items) AL.items = [];
    alPaint_(); alBarPaint_();
  });
}

/* ---------- הפס העליון ---------- */
function alBarPaint_() {
  var b = $('al-bar');
  if (!b) return;
  var st = { saving: alU_('alSaving'), saved: alU_('alSaved'), fail: alU_('alSaveFail'),
             nokey: alU_('alNoKey') }[AL_ST] || '';
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
  var btn = function (it, data) {
    var on = alFind_(it) >= 0;
    return '<button class="al-tg' + (on ? ' on' : '') + '" ' + data + '>' +
      esc(on ? alU_('alIn') : alU_('alAdd')) + '</button>';
  };
  var h = '<div class="al-h"><b>' + esc(alSrc_(st)) + '</b></div>';
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
  order.sort(function (a, b) { return byStep[a].st.idx - byStep[b].st.idx; });
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
function alBlocksHtml_(res) {
  var out = [];
  var yr = (window.PROGRAM && PROGRAM.year) || '';
  out.push({ t: 'mast', h: '<div class="alp-mast"><span class="m"><img alt="" src="' +
    esc(window.LOGO_MARK || '') + '"></span><div class="w"><b>' + esc(alU_('alBrand1')) +
    '</b><span>' + esc(alU_('alBrand2')) + '</span>' + (yr ? '<i>' + esc(yr) + '</i>' : '') +
    '</div></div><h1 class="alp-t">' + esc(alU_('alTitle')) + '</h1><div class="alp-sub">' +
    esc(alU_('alSub', { mas: MAS_NAME[S.mas] || S.mas, daf: S.daf })) + '</div>' });
  res.blocks.forEach(function (g) {
    out.push({ t: 'h', h: '<div class="alp-src">' + esc(alSrc_(g.st)) + '</div>' });
    g.q.forEach(function (x) {
      out.push({ t: 'q', h: '<div class="alp-q"><span class="alp-ql">' + esc(alU_('alQone')) + '</span>' +
        '<div class="alp-qq">' + esc(x.q.q || '') + '</div><ol>' + (x.q.a || []).map(function (a) {
          return '<li>' + esc(a) + '</li>';
        }).join('') + '</ol></div>' });
    });
    g.own.forEach(function (x) {
      out.push({ t: 'own', h: '<div class="alp-own">' +
        (x.p.tag ? '<span class="alp-tag">' + esc(x.p.tag) + '</span>' : '') +
        '<div class="alp-txt">' + ownSan(x.p.text) + '</div></div>' });
    });
    g.sl.forEach(function (x) {
      out.push({ t: 'sl', f: x.f, h: '<figure class="alp-sl"><img alt="" src="' + esc(x.f) + '"></figure>' });
    });
  });
  return out;
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
    '<span class="sp"></span><span class="al-wait">' + esc(alU_('alBuilding')) + '</span></div>';
  $('alp-back').onclick = alPreviewClose_;
  alLogo_().then(function () { alBuild_(); });
}
function alPreviewClose_() {
  var el = $('al-prev');
  if (el) { el.className = 'al-prev'; el.innerHTML = ''; }
  document.body.classList.remove('al-viewing');
}
function alBuild_() {
  var el = $('al-prev');
  var res = alResolve_();
  var P = AL_PAPER[AL_PREF.paper] || AL_PAPER.A4;
  var css = $('al-page');
  if (!css) { css = document.createElement('style'); css.id = 'al-page'; document.head.appendChild(css); }
  css.textContent = '@page{size:' + P[0] + 'mm ' + P[1] + 'mm;margin:0}' +
    '.alp-pg{width:' + P[0] + 'mm;height:' + (P[1] - 0.6) + 'mm}' +
    /* שקף אחד לעולם אינו גבוה מעמוד — עם כותרת הקטע מעליו */
    '.alp-sl img{max-height:' + (P[1] - 50) + 'mm}';
  var tools = '<div class="al-tools"><button id="alp-back">' + esc(alU_('alBack')) + '</button>' +
    '<label>' + esc(alU_('alPaper')) + ' <select id="alp-paper"><option value="A4"' +
    (AL_PREF.paper === 'A4' ? ' selected' : '') + '>A4</option><option value="A5"' +
    (AL_PREF.paper === 'A5' ? ' selected' : '') + '>A5</option></select></label>' +
    '<label class="alp-ink"><input type="checkbox" id="alp-ink"' + (AL_PREF.ink ? ' checked' : '') + '> ' +
    esc(alU_('alInk')) + '</label><span class="sp"></span><span class="al-pages" id="alp-n"></span>' +
    '<button class="al-go" id="alp-pdf">' + esc(alU_('alPdf')) + '</button></div>';
  var warn = res.warn.length ? '<div class="al-warn"><b>' + esc(alU_('alMiss')) + '</b><ul>' +
    res.warn.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>' : '';
  var how = '<p class="al-how">' + esc(alU_('alPrintHow')) + ' ' + esc(alU_('alInkH')) + '</p>';
  el.innerHTML = tools + warn + how + '<div class="al-doc' + (AL_PREF.ink ? ' ink' : '') +
    '" id="alp-doc"></div>';
  $('alp-back').onclick = alPreviewClose_;
  $('alp-paper').onchange = function () { AL_PREF.paper = this.value; alPrefKeep_(); alBuild_(); };
  $('alp-ink').onchange = function () { AL_PREF.ink = this.checked; alPrefKeep_(); alBuild_(); };
  $('alp-pdf').onclick = function () { window.print(); };
  var doc = $('alp-doc');
  if (!res.blocks.length) {
    doc.innerHTML = '<p class="al-none">' + esc(alU_('alEmpty')) + '</p>';
    $('alp-pdf').disabled = true;
    return;
  }
  var blocks = alBlocksHtml_(res);
  /* קודם כל התמונות — בלי המידות שלהן אי אפשר לחלק לעמודים */
  var pre = document.createElement('div');
  pre.className = 'alp-pg alp-measure';
  pre.innerHTML = '<div class="alp-in">' + blocks.map(function (b) { return b.h; }).join('') + '</div>';
  doc.appendChild(pre);
  alWaitImgs_(pre).then(function () {
    var bad = {}, dim = {};
    [].forEach.call(pre.querySelectorAll('.alp-sl img'), function (im) {
      if (!im.naturalWidth) bad[im.getAttribute('src')] = 1;
      else dim[im.getAttribute('src')] = [im.naturalWidth, im.naturalHeight, alDark_(im)];
    });
    doc.removeChild(pre);
    var gone = Object.keys(bad);
    if (gone.length) {
      var w = el.querySelector('.al-warn ul');
      if (!w) {
        el.querySelector('.al-how').insertAdjacentHTML('beforebegin',
          '<div class="al-warn"><b>' + esc(alU_('alMiss')) + '</b><ul></ul></div>');
        w = el.querySelector('.al-warn ul');
      }
      gone.forEach(function (f) { w.insertAdjacentHTML('beforeend', '<li>' + esc(alU_('alMissSl', { f: f })) + '</li>'); });
    }
    alPaginate_(doc, blocks.filter(function (b) { return !(b.t === 'sl' && bad[b.f]); }), dim);
  });
}
function alPrefKeep_() {
  try { localStorage.setItem('df:alonPref', JSON.stringify(AL_PREF)); } catch (e) {}
}
/* `dim` — המידות של כל שקף. תמונה חדשה בעמוד מקבלת גובה רק אחרי
   שהיא מפוענחת, גם כשהיא במטמון; בלי המידות מראש החלוקה מודדת
   אפס, והשקף נחתך בתחתית העמוד. */
function alPaginate_(doc, blocks, dim) {
  var pages = [];
  var newPage = function () {
    var pg = document.createElement('div');
    pg.className = 'alp-pg';
    pg.innerHTML = '<div class="alp-in"></div><div class="alp-foot"></div>';
    /* שורת התחתית תופסת מקום כבר עכשיו. נכתבה רק בסוף, והעמוד שנמדד
       היה גבוה מזה שהודפס — וסוף הטקסט נחתך. */
    pg.lastChild.textContent = alU_('alFoot', { i: 99, n: 99, daf: S.daf });
    doc.appendChild(pg);
    pages.push(pg);
    return pg.firstChild;
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
    if (pg.firstChild.childNodes.length) return true;
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
