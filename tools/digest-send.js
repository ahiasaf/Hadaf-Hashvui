/* ============================================================
   העדכון המתוזמן — כל ר"ם, במועד שהוא בחר.
   ============================================================
   בפינה שבעמוד הצוות הוא בחר מתי נוח לו לקבל: בימי שישי, כל
   יום, במוצאי שבת, או בכלל לא. הבחירה נשמרה בגיליון. הקובץ
   הזה הוא מה שהופך אותה להבטחה שמתקיימת.

   רץ ב-GitHub Actions בלבד, מאותה סיבה של `push-send.js`:
   חתימת VAPID דורשת מפתח פרטי, והוא יושב בסודות הריפו.

   --- מה מכריע שעכשיו הזמן ---
   הקרון של GitHub רץ ב-UTC ואינו יודע על שעון קיץ, והתוכנית
   חיה בישראל. לכן השעון כאן מחושב לפי `Asia/Jerusalem` דרך
   `Intl`, והמשמרת נבחרת לפי **שעה מדויקת** ולא לפי חלון:
   חלון שמתפרש על שעתיים היה שולח פעמיים ביום שבו שתי כניסות
   הקרון (של שעון חורף ושל שעון קיץ) נופלות בתוכו. הרצה
   שאיחרה מפספסת את היום — וזה עדיף בהרבה על כפילות.

   --- ומתי לא שולחים בכלל ---
     · **בשבת.** לא במשמרת היומית ולא בשום משמרת אחרת.
     · **בשבוע חופשה.** שבוע שאין בו דף אין עליו מה לעדכן,
       והחופשות בלוח הן גם חנוכה ופסח.
     · **לפני תחילת התוכנית.**
     · למי שבחר "לא לעדכן אותי".

   --- ומה נשלח ---
   המספרים של הכיתה שלו בלבד. בלי השוואה לכיתה אחרת ובלי
   ממוצע ישיבתי — ר"ם של כיתה קטנה שרואה כיתה גדולה לצידו
   מקבל בעיקר את המסר שהוא נכשל.
   ============================================================ */
var webpush = require('web-push');
var fs = require('fs');
var vm = require('vm');
var path = require('path');

var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var priv = process.env.VAPID_PRIVATE || '';
var key  = process.env.READ_KEY || '';
/* הרצה יבשה: מחשבת ומדפיסה הכול, ואינה שולחת דבר. */
var DRY  = /^(1|true|yes)$/i.test(String(process.env.DRY_RUN || ''));
/* לבדיקה בלבד — כופה שעה ויום במקום השעון האמיתי. */
var FORCE = String(process.env.FORCE_SLOT || '').trim();

if (!priv && !DRY) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key) { console.error('חסר READ_KEY בסודות הריפו.'); process.exit(1); }

var ROOT = path.join(__dirname, '..');

/* ============================================================
   הלוח — נטען מ-`data.js` עצמו, ולא משוכפל.
   ============================================================
   "מהו השבוע" ו"מהו הדף" מוגדרים פעם אחת ב-`data.js` וב-
   `learned.js`, וכל המסכים חיים מהם. עותק שני כאן היה נפרד
   מהם בשקט ביום שהלוח ישתנה — ואז העדכון היה מדבר על דף
   אחר מזה שעל המסך. */
function loadProgram() {
  var noop = function () {};
  var ctx = {
    console: { log: noop, warn: noop, error: noop },
    setTimeout: noop, clearTimeout: noop,
    setInterval: noop, clearInterval: noop
  };
  ctx.window = {
    addEventListener: noop, removeEventListener: noop,
    location: { search: '', href: '', hash: '' },
    matchMedia: function () { return { matches: false, addListener: noop }; }
  };
  ctx.document = {
    addEventListener: noop, removeEventListener: noop,
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { style: {}, classList: { add: noop } }; },
    documentElement: { style: { setProperty: noop } },
    write: noop
  };
  ctx.navigator = { userAgent: 'node', onLine: true };
  ctx.localStorage = { getItem: function () { return null; }, setItem: noop };
  ctx.screen = { width: 0, height: 0 };
  ctx.addEventListener = noop;
  ctx.location = ctx.window.location;
  ctx.self = ctx;
  vm.createContext(ctx);
  ['data.js', 'learned.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  });
  if (!ctx.PROGRAM || !ctx.TRACKS || typeof ctx.LWeek !== 'function') {
    throw new Error('לא הצלחתי לקרוא את הלוח מ-data.js');
  }
  return ctx;
}

/* ---------- השעון הישראלי ---------- */
/* `Intl` יודע על שעון קיץ; הקרון של GitHub אינו יודע. */
function israelNow() {
  var f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem', weekday: 'short',
    hour: '2-digit', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  var g = {};
  f.forEach(function (p) { g[p.type] = p.value; });
  var DAYS = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return {
    day:  DAYS[g.weekday],
    hour: parseInt(g.hour, 10),
    date: g.year + '-' + g.month + '-' + g.day
  };
}

/* המשמרות, בדיוק כפי שהן מוצגות בפינה שבעמוד הצוות.
   `week` = העדכון מדבר על השבוע הבא, לא על זה שנגמר. */
var SLOTS = [
  { id:'day', hour:7,  days:[0,1,2,3,4,5], next:false },  /* כל יום, לא בשבת */
  { id:'fri', hour:9,  days:[5],           next:false },  /* שישי בבוקר */
  { id:'sat', hour:21, days:[6],           next:true  }   /* מוצאי שבת */
];

function slotNow(now) {
  if (FORCE) {
    for (var f = 0; f < SLOTS.length; f++) if (SLOTS[f].id === FORCE) return SLOTS[f];
    return null;
  }
  /* בשבת אין שליחה, נקודה. המשמרת של מוצאי שבת היא בשעה 21
     ביום שבת לפי התאריך, ולכן היא עוברת את התנאי הזה במפורש. */
  for (var i = 0; i < SLOTS.length; i++) {
    var s = SLOTS[i];
    if (s.hour !== now.hour) continue;
    if (s.days.indexOf(now.day) < 0) continue;
    return s;
  }
  return null;
}

/* ---------- הגיליון ---------- */
function scriptUrl() {
  var src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

function ask(params) {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  var q = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + q + '&t=' + Date.now())
    .then(function (r) { return r.json(); });
}

/* מי ביקש לקבל, ומתי. */
function loadWants() {
  return ask({ read: 'התראות', key: key }).then(function (j) {
    if (!j || j.status !== 'ok') {
      throw new Error('הגיליון לא נענה: ' + ((j && j.message) || 'לא ידוע'));
    }
    /* **תשובה בלי `rows` אינה לשונית ריקה — היא קריאה שנכשלה.**
       כלל הברזל של הפרויקט. בלעדיו כל תקלת רשת הייתה נראית
       כמו "אף אחד לא ביקש עדכון", והשקט היה נראה תקין. */
    if (!j.rows) throw new Error('התשובה מהגיליון אינה מכילה שורות כלל.');
    var rows = j.rows;
    if (rows.length < 2) return [];
    var head = rows[0].map(function (x) { return String(x).trim(); });
    var ix = {};
    head.forEach(function (h, i) { ix[h] = i; });
    var need = ['מנוי', 'קוד ישיבה', 'שכבה', 'כיתה', 'מועד', 'תפקיד'];
    var miss = need.filter(function (n) { return ix[n] === undefined; });
    /* **עמודה חסרה — נכשל סגור.** בלי "כיתה" אי אפשר לדעת על
       מי העדכון מדבר, ולשלוח מספרים של מישהו אחר גרוע מלא
       לשלוח כלום. */
    if (miss.length) {
      throw new Error('חסרות עמודות בלשונית התראות: ' + miss.join(', ') +
                      '. לא נשלח דבר.');
    }
    var g = function (r, k2) {
      return ix[k2] === undefined ? '' : String(r[ix[k2]] == null ? '' : r[ix[k2]]).trim();
    };
    var out = [], seen = {};
    /* מהסוף להתחלה: מי שנרשם שוב מאותו מכשיר — האחרון קובע,
       והישן עלול כבר להיות פג. */
    for (var i = rows.length - 1; i >= 1; i--) {
      var r = rows[i];
      var raw = g(r, 'מנוי');
      if (!raw) continue;                      /* התראות חסומות אצלו */
      var sub;
      try { sub = JSON.parse(raw); } catch (e) { continue; }
      if (!sub || !sub.endpoint || seen[sub.endpoint]) continue;
      /* ============================================================
         **לצוות בלבד.**
         ============================================================
         העדכון מדבר על "תלמידיך" — לתלמיד אין תלמידים. ובלי
         הסינון הזה הוא היה מגיע אליו בכל זאת: שורה של תלמיד
         אינה נושאת "מועד" כלל, וברירת המחדל היא שישי. כלומר
         כל תלמיד היה מקבל בשישי בבוקר דוח על הכיתה שלו. */
      var role = g(r, 'תפקיד');
      if (!role || role === 'תלמיד' || role === 'הורה' || role === 'אב') continue;
      seen[sub.endpoint] = 1;
      out.push({
        sub:   sub,
        who:   g(r, 'שם') || 'בלי שם',
        inst:  g(r, 'קוד ישיבה'),
        grade: g(r, 'שכבה'),
        klass: g(r, 'כיתה'),
        role:  role,
        /* ברירת המחדל זהה לזו שבמסך: מי שלא נגע בבורר מקבל
           בימי שישי, וזה מה שכתוב לו שם. */
        when:  g(r, 'מועד') || 'fri'
      });
    }
    return out;
  });
}

/* הלוח של ישיבה אחת. סיסמת הרכז פותחת כל לוח. */
var boards = {};
function loadBoard(inst) {
  if (boards[inst]) return boards[inst];
  boards[inst] = ask({ board: inst, key: key }).then(function (j) {
    if (!j || j.status !== 'ok' || !j.students) {
      throw new Error('הלוח של ' + inst + ' לא נקרא: ' +
                      ((j && j.message) || 'אין תשובה'));
    }
    return j.students;
  });
  return boards[inst];
}

/* ---------- הנוסח ---------- */
function fill(t, v) {
  return String(t).replace(/\{(\w+)\}/g, function (m, k2) {
    return v[k2] != null ? v[k2] : m;
  });
}

/* מה יקרה אצל ר"ם אחד: כמה מתלמידיו באפליקציה, וכמה מהם
   סימנו את הדף של השבוע. */
function forOne(P, w, students, wk) {
  var mine = students.filter(function (p) {
    if (w.grade && String(p.grade || '') !== w.grade) return false;
    if (w.klass && String(p.klass || '') !== w.klass) return false;
    return true;
  });
  var cls = (w.grade || '') + (w.klass ? '‎' + w.klass : '');
  var D = P.DIGEST;
  if (!mine.length) {
    return { title: fill(D.title, { cls: cls }),
             body: fill(D.empty, { cls: cls }) };
  }
  /* הדף של השבוע לכל מסלול. תלמיד נספר כלמד אם סימן את הדף
     של השבוע באחד המסלולים שהוא לומד בהם. */
  var keys = P.TRACKS.map(function (t) {
    return P.LDaf(t.id, wk) ? t.id + '|' + (wk + 1) : null;
  }).filter(Boolean);
  var done = mine.filter(function (p) {
    var ws = p.weeks || [];
    for (var i = 0; i < keys.length; i++) if (ws.indexOf(keys[i]) >= 0) return true;
    return false;
  }).length;

  /* שם הדף והפרשה — מהמסלול הראשון שיש בו דף השבוע. */
  var daf = '', parasha = '';
  for (var t2 = 0; t2 < P.TRACKS.length; t2++) {
    var row = P.TRACKS[t2].cal[wk];
    if (row && row[2] && row[2] !== 'סיום') { daf = row[2]; parasha = row[1]; break; }
  }
  var v = { cls: cls, n: mine.length, done: done, daf: daf, parasha: parasha };
  var body = w.slot.next ? D.fresh
           : (done === 0 ? D.none : (done >= mine.length ? D.all : D.some));
  return { title: fill(D.title, v), body: fill(body, v) };
}

/* ============================================================ */
var P;
try { P = loadProgram(); }
catch (e) { console.error('נכשל: ' + e.message); process.exit(1); }

var now = israelNow();
var slot = slotNow(now);
console.log('שעון ישראל: ' + now.date + ' · יום ' + now.day + ' · ' + now.hour + ':00');

if (!slot) {
  console.log('אין משמרת בשעה הזו — לא נשלח דבר.');
  process.exit(0);
}
console.log('משמרת: ' + slot.id);

/* השבוע שעליו מדובר. במוצאי שבת השבוע כבר התחלף. */
var wk = P.LWeek() + (slot.next ? 1 : 0);
if (wk < 0) {
  console.log('התוכנית עוד לא התחילה (מתחילה ' + P.PROGRAM.startDate +
              ') — לא נשלח דבר.');
  process.exit(0);
}
if (wk >= P.CAL_TAANIT.length) {
  console.log('התוכנית הסתיימה — לא נשלח דבר.');
  process.exit(0);
}
/* שבוע חופשה: אין דף באף מסלול, ולכן אין על מה לעדכן.
   כך גם חנוכה ופסח יוצאים מהמשחק בלי רשימת חגים נפרדת. */
var anyDaf = P.TRACKS.some(function (t) { return !!P.LDaf(t.id, wk); });
if (!anyDaf) {
  console.log('שבוע ' + (wk + 1) + ' הוא שבוע חופשה — לא נשלח דבר.');
  process.exit(0);
}
console.log('שבוע ' + (wk + 1) + ' · ' + P.CAL_TAANIT[wk][1]);

loadWants().then(function (all) {
  var due = all.filter(function (w) { return w.when === slot.id; });
  console.log('רשומים: ' + all.length + ' · במשמרת הזו: ' + due.length);
  if (!due.length) {
    console.log('אין למי לשלוח במשמרת הזו.');
    return [];
  }
  due.forEach(function (w) { w.slot = slot; });

  var insts = {};
  due.forEach(function (w) { if (w.inst) insts[w.inst] = 1; });
  var codes = Object.keys(insts);
  if (!codes.length) {
    console.log('אף שורה אינה נושאת קוד ישיבה — לא נשלח דבר.');
    return [];
  }

  return Promise.all(codes.map(function (c) {
    return loadBoard(c).then(function (s) { return { c: c, s: s }; })
      .catch(function (e) { console.log('  ! ' + e.message); return { c: c, s: null }; });
  })).then(function (bs) {
    var by = {};
    bs.forEach(function (b) { by[b.c] = b.s; });

    if (!DRY) webpush.setVapidDetails(SUBJECT, PUBLIC, priv);
    console.log('');
    return Promise.all(due.map(function (w) {
      var students = by[w.inst];
      /* לוח שלא נקרא אינו ישיבה ריקה. עדכון שאומר "אף אחד לא
         למד" על סמך קריאה שנכשלה הוא בדיוק סוג השקר שהפרויקט
         הזה נלחם בו. מדלגים. */
      if (!students) {
        console.log('  · ' + w.who + ' — הלוח לא נקרא, מדלג');
        return 0;
      }
      var msg = forOne(P, w, students, wk);
      if (DRY) {
        console.log('  · ' + w.who + ' → ' + msg.title + ' | ' + msg.body);
        return 1;
      }
      var host = '—';
      try { host = new URL(w.sub.endpoint).host; } catch (e) {}
      /* לחיצה על העדכון פותחת את הפינה שלו — שם הלוח, ושם
         גם מה שאפשר לעשות עם המספר שהרגע קרא. */
      var link = w.inst ? 'tzevet?inst=' + encodeURIComponent(w.inst) + '#my' : './';
      return webpush.sendNotification(w.sub,
        JSON.stringify({ title: msg.title, body: msg.body, url: link }),
        { TTL: 3600 })
        .then(function (r) {
          console.log('  ✓ ' + w.who + ' · ' + host + ' → ' + r.statusCode +
                      ' | ' + msg.body);
          return 1;
        })
        .catch(function (e) {
          console.log('  ✗ ' + w.who + ' · ' + host + ' → ' +
                      (e.statusCode || '') + ' ' +
                      String(e.body || e.message || '').slice(0, 120));
          return 0;
        });
    }));
  });
}).then(function (res) {
  if (!res.length) return;
  var ok = res.reduce(function (a, b) { return a + b; }, 0);
  console.log('\nיצאו: ' + ok + ' · נכשלו: ' + (res.length - ok));
  /* מנוי שפג אינו תקלה של הקוד. כולם נכשלו — כן. */
  if (!ok) process.exit(1);
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
