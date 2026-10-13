
var rosterMsg = '';

/* Apps Script מפנה את /exec לדומיין אחר, ויש דפדפנים שחוסמים
   את הקריאה בגלל CORS. תגית script אינה כפופה לו כלל. */
function jsonp(url) {
  return new Promise(function (ok) {
    var name = '__brd' + Date.now(), t, sc = document.createElement('script');
    var done = function (v) {
      try { delete window[name]; } catch (e) { window[name] = undefined; }
      clearTimeout(t); if (sc.parentNode) sc.remove(); ok(v);
    };
    t = setTimeout(function () { done(null); }, 12000);
    window[name] = function (d) { done(d); };
    sc.onerror = function () { done(null); };
    sc.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'callback=' + name;
    document.body.appendChild(sc);
  });
}
function askScript(params) {
  if (!API_URL) return Promise.resolve(null);
  /* כתובת שרת ישנה במכשיר - שליחה דרכה יוצאת בלי הסינונים. */
  if (params && params.fire && APPS_SCRIPT_URL &&
      String(API_URL).trim() !== String(APPS_SCRIPT_URL).trim()) {
    return Promise.resolve({ status:'denied', message: (window.UI && UI.apiOld) || '' });
  }
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var url = API_URL + (API_URL.indexOf('?') < 0 ? '?' : '&') + q;
  return fetch(url).then(function (r) { return r.json(); })
    .catch(function () { return jsonp(url); });
}

function loadRoster() {
  if (!acc) return Promise.resolve(null);
  /* מכשיר בדיקה רואה גם את משתמשי הבדיקה - ראו /reset. */
  var q = ALL ? { board:'*', key:acc } : { board:code, k:acc, dev:devId() };
  /* בכל הישיבות - גם משתמשי בדיקה, עם התגית שלהם. הרכז הוא מי
     שבודק; תלמיד בדיקה שנוצר ממכשיר בדיקה נעלם מהלוח שלו, והוא
     מופיע במשתתפים - ולכן "לא מוצא את עצמי". */
  if (LTester() || ALL) q.test = '1';
  return askScript(q).then(function (d) {
    if (!d) { rosterMsg = 'לא קיבלתי תשובה מהשרת.'; return null; }
    if (d.status !== 'ok') {
      /* קוד שגוי אינו נשמר - אחרת הוא היה נדבק למכשיר ומונע
         מהקישור הנכון לעבוד בפעם הבאה. */
      if (/^(denied|wait|locked|unknown)$/.test(d.status) && !ALL) {
        acc = ''; try { localStorage.removeItem(accKey()); } catch (e) {}
      }
      if (d.status === 'locked' && !ALL) { lockNow(); return null; }
      rosterMsg = d.message || 'לא הצלחתי לפתוח את הרשימה.';
      return null;
    }
    roster = d.students || [];
    rosterMsg = '';
    LSet('rosterCache:' + code, roster);
    if (ALL) { rosterAll = roster; PARENTS = d.parents || null; applyFilt(); selPrune(); }
    /* ההורים שלא חוברו - לספירה שבראש "התלמידים שלי" בניהול.
       רק כשהשרת שלח רשימה: בלעדיה המטמון הקודם נשאר. */
    if (ALL && d.parents && d.parents.length != null) LSet('parentsCache:all', d.parents);
    return roster;
  }).catch(function () { rosterMsg = 'לא קיבלתי תשובה מהשרת.'; return null; });
}

/* ============================================================
   מחכים לאישור - והמסך מתעדכן לבד.
   ============================================================
   "אחרי שהרכז אישר, מסך ההמתנה לא התעדכן." שני מקורות לקוד:
   האפליקציה שבמכשיר כבר קיבלה אותו (instCodes), או שאלה ישירה
   של השרת בשם המכשיר - אותה שאלה שהאפליקציה שואלת (`acc`).
   כל חצי דקה כשהמסך מול העיניים, ומיד כשחוזרים אליו.
   ============================================================ */
/* מי המכשיר - ראש חטיבה (df:head) או ר"ם (df:ram), של הישיבה
   הזו. הלוח נפתח לפי האישור שלו, לא לפי הקוד - ראו accGate_. */
function waitMe() {
  var keys = ['df:head', 'df:ram'];
  for (var i = 0; i < keys.length; i++) {
    try {
      var m = JSON.parse(localStorage.getItem(keys[i]) || 'null');
      if (m && m.id && m.inst === code) return m;
    } catch (e) {}
  }
  return null;
}
function devId() { var m = waitMe(); return m ? m.id : ''; }
function waitTry() {
  if (ALL || acc || !inst) return Promise.resolve(false);
  var k = appCode();
  var ask = k ? Promise.resolve(k) : (function () {
    var me = waitMe();
    if (!me) return Promise.resolve('');
    return askScript({ acc: code, dev: me.id, has: '0' }).then(function (d) {
      if (d && d.status === 'locked') { lockNow(); return ''; }
      if (d && d.status === 'wait' && boardLocked) { boardLocked = false; draw(); }
      if (!d || d.status !== 'ok' || !d.k) return '';
      /* גם לאפליקציה - כדי שאזור הניהול ייפתח בלי לשאול שוב. */
      var m = LGet('instCodes', {}) || {};
      m[code] = d.k; LSet('instCodes', m);
      return d.k;
    });
  })();
  return ask.then(function (k2) {
    if (!k2 || acc) return false;
    acc = k2;
    try { localStorage.setItem(accKey(), k2); } catch (e) {}
    return loadRoster().then(function () { draw(); return true; });
  });
}
/* ============================================================
   נעול - "אתה איש צוות או תלמיד?" במקום "אנא המתן" (lock.js).
   ============================================================
   וכל רשימת שמות יורדת מהמכשיר ומהזיכרון, ומצויר מחדש. */
var boardLocked = false;
function lockNow() {
  if (!boardLocked) LOCK.reset();
  boardLocked = true;
  LOCK.wipe();
  acc = ''; roster = null;
  draw();
}
LOCK.init({
  get: function (q) { return askScript(q); },
  me: function () { return waitMe() || {}; },
  savePhone: function (v) {
    var keys = ['df:head', 'df:ram'];
    for (var i = 0; i < keys.length; i++) {
      try {
        var m = JSON.parse(localStorage.getItem(keys[i]) || 'null');
        if (m && m.id && m.inst === code) { m.phone = v; localStorage.setItem(keys[i], JSON.stringify(m)); }
      } catch (e) {}
    }
  },
  paint: function () { draw(); },
  /* "איש צוות" - חזרה ל"אנא המתן" הרגיל, שבודק את עצמו. */
  onWait: function () { boardLocked = false; draw(); }
});
if (!ALL) {
  setInterval(function () {
    if (!acc && document.visibilityState !== 'hidden') waitTry();
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!acc && document.visibilityState !== 'hidden') waitTry();
  });
  /* וגם מיד בפתיחה - מי שננעל רואה את השאלה בלי לחכות חצי דקה. */
  setTimeout(function () { if (!acc) waitTry(); }, 0);
}


/* ============================================================
   לוח שליטה, לא רשימה.

   הרשימה השמית הייתה נכונה לארבעה תלמידים ושגויה לעשרים. מה
   שראש חטיבה מסתכל עליו כל יום הוא **כמה**, ומה שהוא מחפש פעם
   בשבוע הוא **מי** - ושתי השאלות אינן צריכות לחלוק מסך.

   לכן המסך הראשון הוא שלוש משבצות עם מספר, והשמות נמצאים
   לחיצה אחת מכאן. משבצת בלי מספר היא תווית; משבצת עם מספר היא
   משפט - "שלושה אבות ובנים" הוא מה שמתחילים ממנו שיחה.

   האיורים אינם קישוט. הם מה שמבדיל בין שלוש קטגוריות בסריקה
   של חצי שנייה, והם משאירים את המסך צעיר בלי לרדת לאמוג'י.
   ============================================================ */
/* WAYS, `WayLbl` ו-`WaysTiles` - ב-ways.js, משותף עם העמוד
   הראשי. הכיתוב ב-`WAYS_T` שב-data.js, ולכן נערך בניהול. */
function wayLbl(w) { return WayLbl(w); }

var view = WAY_IN ? 'way:' + WAY_IN : '';   /* '' · 'way:<מסגרת>' · 'week' */
/* לחיצה שנייה על אותו דבר סוגרת. הלוח נשאר במקומו, ולכן אין
   לאן "לחזור" - וכפתור חזרה שמוביל למקום שאף פעם לא עזבת הוא
   בדיוק מה שהופך שתי רמות של אותה שאלה לשני מסכים. */
function go(v) {
  var was = view;
  WAY_FROM = false;            /* מכאן - חזרה היא ללוח עצמו */
  view = (view === v) ? '' : v;
  draw();
  /* פירוט של דרך לימוד הוא מסך משלו (ראו wayScreen) - נכנסים
     אליו ויוצאים ממנו מראש העמוד. */
  if (!EMBED && (view.indexOf('way:') === 0 || was.indexOf('way:') === 0)) {
    window.scrollTo(0, 0);
    return;
  }
  if (view) setTimeout(function () {
    var el = document.querySelector('.open');
    if (el && el.scrollIntoView) el.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }, 40);
}

function didWeek(p) {
  var wk = LWeek();
  if (wk < 0) return false;
  for (var i = 0; i < (p.weeks || []).length; i++)
    if (String(p.weeks[i]).split('|')[1] === String(wk + 1)) return true;
  return false;
}

/* המספרים למשבצות. כשיש רשימה שמית סופרים ממנה, ואחרת מלשונית
   "מונים" - כדי שמי שאין לו קוד עדיין יראה מספרים ולא ריק. */
function wayCount(w) {
  if (roster) {
    var n = 0;
    roster.forEach(function (p) { if (!p.test && p.role !== 'הורה' && (p.way || '') === w) n++; });
    return n;
  }
  var hit = 0;
  ((joined && joined.ways) || []).forEach(function (p) { if (p[0] === w) hit = p[1]; });
  return hit;
}

function goWay(k) { go('way:' + k); }
function tilesHtml() {
  return WaysTiles(wayCount, {
    go:   roster ? 'goWay' : '',
    sel:  view.indexOf('way:') === 0 ? view.slice(4) : ''
  });
}

/* פירוט: שמות של מסגרת אחת, או של מי שלמד השבוע. */
/* הפירוט נפתח בתוך הכרטיס שנלחץ. אין כותרת חוזרת ואין כפתור
   חזרה - מה שמעליו עדיין על המסך ואומר את שניהם. */
function weekOpenHtml() {
  if (!roster) return '';
  /* שלוש קבוצות ולא שתיים. "לא סיים" ו"לא התחיל" הם שני מצבים
     שונים לגמרי, ורק אחד מהם הוא מי שכדאי להזכיר לו. */
  var did = roster.filter(didWeek);
  var mid = roster.filter(function (p) { return !didWeek(p) && frac(p) > 0; });
  var non = roster.filter(function (p) { return !didWeek(p) && !frac(p); });
  return '<div class="open">' +
    (did.length ? '<div class="wgrp">סיימו · ' + did.length + '</div>' +
                  did.map(function (q) { return pRow(q); }).join('') : '') +
    (mid.length ? '<div class="wgrp">באמצע הדף · ' + mid.length + '</div>' +
                  mid.map(function (q) { return pRow(q); }).join('') : '') +
    (non.length ? '<div class="wgrp">עדיין לא פתחו · ' + non.length + '</div>' +
                  non.map(function (q) { return pRow(q); }).join('') : '') +
    '<p class="h" style="margin-top:10px">"סיים" = הגיע לסוף הדף האינטראקטיבי, ' +
    'ענה על החידה השבועית, או סימן בעצמו.</p></div>';
}
function wayScreen() {
  var w = view.slice(4);
  return '<div class="card">' +
    '<button class="wback" id="wback">→ ' + esc(UI.bdBack || '') + '</button>' +
    '<h2 class="wtitle">' + esc(wayLbl(w)) + ' · ' + wayCount(w) + '</h2>' +
    wayOpenHtml(true) + '</div>';
}
