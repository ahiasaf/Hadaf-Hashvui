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
/* לבדיקה בלבד — כופה שעה (HH:MM) ויום (0-6) במקום השעון. */
var FORCE = String(process.env.FORCE_SLOT || '').trim();
/* ============================================================
   שני מצבים.
   ============================================================
   `learn` — העדכון המתוזמן: מי למד את הדף השבוע. יוצא לפי
   התזכורות שכל ר"ם קבע לעצמו.

   `joined` — "כמה מכיתתך הצטרפו": יוצא **על פי בקשה** ממסך
   הניהול, לכל ר"ם בבת אחת, בלי קשר לתזכורות שלו. זו הודעה
   שהרכז מחליט לשלוח, ולא שעון. ============================ */
var MODE = String(process.env.MODE || 'learn').trim() || 'learn';
/* מתעלם מהתזכורות ושולח לכל הצוות — מלווה את `joined`. */
var ALL = /^(1|true|yes)$/i.test(String(process.env.SEND_ALL || ''));

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

/* ---------- השעון, הקריאה, והרישום ----------
   משותפים לשתי השליחות המתוזמנות. ההסבר המלא ב-sched.js. */
var S = require('./sched.js');
function israelNow() { return S.israelNow(); }

/* ============================================================
   המשבצת — חצי השעה שבה אנחנו עומדים.
   ============================================================
   הקרון רץ בכל חצי שעה, והשעה מעוגלת **כלפי מטה** לחצי שעה.
   הרצה שאיחרה בעשר דקות עדיין מטפלת במשבצת שלה; הרצה שאיחרה
   מעבר לחצי שעה מפספסת את המשבצת — וזה עדיף בהרבה על כפילות,
   כי כל משבצת מטופלת על ידי הרצה אחת בדיוק.

   `next` — אחרי שעה 20:00 ביום שבת השבוע כבר התחלף מבחינת
   הר"ם: מה שהוא רוצה לקרוא במוצאי שבת הוא מה שמתחיל, ולא
   מה שנגמר. ============================================ */
/* ============================================================
   **וכל המשבצות שנפספסו, לא רק זו שאנחנו עומדים בה.**
   ============================================================
   הקרון של GitHub הוא מאמץ סביר ולא הבטחה: ביומן ההרצות
   נראות כשש הרצות ביממה במקום ארבעים ושמונה. מודל של משבצת
   אחת להרצה פירושו שרוב הר"מים לא יקבלו את העדכון שביקשו —
   לא בגלל תקלה בהתראות, אלא בגלל שעון שלא צלצל.

   מה שמחליף את ההימור הוא רישום: כל עדכון שיצא נרשם בלשונית
   "נשלחו", וכל הרצה מדלגת על מה שכבר שם. ראו tools/sched.js.

   **ושבת יורדת מהחלון ולא מהסוף.** משבצת של שבת לפני 20:00
   אינה נשלחת גם באיחור — ולכן היא מסוננת כאן, ולא נבדקת
   פעם אחת על המשבצת האחרונה.
   ============================================================ */
function slotsNow(now) {
  if (FORCE) {
    var m = /^([0-6]):([0-2]?\d:[0-5]\d)$/.exec(FORCE);
    if (!m) return [];
    var t0 = m[2].length === 4 ? '0' + m[2] : m[2];
    return [{ day: +m[1], t: t0, date: now.date,
              next: (+m[1] === 6 && t0 >= '20:00') }];
  }
  return S.slotsDue(now).filter(function (sl) {
    /* ובשבת לא שולחים, בשום מצב ובשום מצב-שליחה. */
    return !(sl.day === 6 && sl.t < '20:00');
  }).map(function (sl) {
    return { day: sl.day, t: sl.t, date: sl.date,
             next: (sl.day === 6 && sl.t >= '20:00') };
  });
}

/* ---------- הגיליון ---------- */
function scriptUrl() {
  var src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

/* כולל ניסיון חוזר: הסקריפט של גוגל מחזיר מדי פעם דף HTML
   במקום JSON, וזה הפיל הרצה שלמה ב-16.9. */
function ask(params) { return S.ask(params); }

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
        /* המזהה של המכשיר — הוא מה שנרשם ב"נשלחו" כדי שעדכון
           לא יצא פעמיים לאותו אדם. שורה ישנה בלי מזהה נופלת
           חזרה לכתובת הדחיפה, שהיא ייחודית גם היא. */
        id:    g(r, 'מזהה') || String(sub.endpoint).slice(-24),
        who:   g(r, 'שם') || 'בלי שם',
        inst:  g(r, 'קוד ישיבה'),
        grade: g(r, 'שכבה'),
        klass: g(r, 'כיתה'),
        role:  role,
        /* מי שעדיין לא נשאל אינו מקבל תזכורות. **ברירת מחדל
           היא לא תשובה**: לשלוח למי שלא ביקש זה בדיוק מה
           שגורם לאנשים לכבות התראות לתמיד. */
        when:  parseWhen(g(r, 'מועד'))
      });
    }
    return out;
  });
}

/* ============================================================
   התזכורות שר"ם קבע לעצמו.
   ============================================================
   `0123456@07:00;5@09:00` — ספרות הימים (0=ראשון), שעה,
   ונקודה-פסיק בין תזכורות. הנוסח הישן (`fri` · `day` · `sat`
   · `off`) עדיין מובן, כי הוא יושב בגיליון אצל מי שכבר בחר.

   ריק = לא נשאל ולא ענה, וגם זה אינו מקבל. ============== */
var OLD_WHEN = {
  fri: [{ d:'5', t:'09:00' }],
  day: [{ d:'012345', t:'07:00' }],
  sat: [{ d:'6', t:'21:00' }],
  off: []
};
function parseWhen(raw) {
  raw = String(raw || '').trim();
  if (!raw) return [];
  if (OLD_WHEN[raw]) return OLD_WHEN[raw].slice();
  var out = [];
  raw.split(';').forEach(function (part) {
    var m = /^([0-6]{1,7})@([0-2]?\d:[0-5]\d)$/.exec(part.trim());
    if (!m) return;
    var t = m[2];
    if (t.length === 4) t = '0' + t;
    out.push({ d: m[1], t: t });
  });
  return out;
}
function wantsNow(list, slot) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].t !== slot.t) continue;
    if (list[i].d.indexOf(String(slot.day)) >= 0) return true;
  }
  return false;
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

  /* ============================================================
     "כמה מכיתתך הצטרפו" — ההודעה שהרכז שולח ביד.
     ============================================================
     היא אינה מדברת על הדף אלא על ההצטרפות, והיא **נושאת את
     השאלה על המועד**: זה הרגע שבו לר"ם יש כבר תלמידים, ולכן
     זה הרגע שבו "מתי נוח לך" הופכת לשאלה אמיתית. לחיצה על
     ההתראה פותחת בדיוק שם. */
  if (MODE === 'joined') {
    /* **מי שאין לו תלמידים אינו מקבל "אפס הצטרפו".** ההודעה
       הזו נשלחת כדי לבשר, ו-"0 מתלמידיך" אינה בשורה — היא
       נזיפה בשבע בבוקר על משהו שהוא ממילא יודע. מדלגים.
       ומאותה סיבה גם השאלה על המועד לא נשאלת כאן: אין לו
       עדיין על מי לקבל עדכון, בדיוק כמו במסך עצמו. */
    if (!mine.length) return null;
    var vj = { cls: cls, n: mine.length };
    /* מי שכבר קבע מועד אינו נשאל שוב. */
    var tail = (w.when && w.when.length) ? '' : ' ' + D.joinedAsk;
    return { title: fill(D.joinedT, vj),
             body:  fill(D.joined, vj) + tail };
  }

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
var slots = slotsNow(now);
console.log('שעון ישראל: ' + now.date + ' · יום ' + now.day + ' · ' +
            (now.hour < 10 ? '0' : '') + now.hour + ':' +
            (now.min < 10 ? '0' : '') + now.min +
            '  ·  מצב: ' + MODE + (ALL ? ' (לכולם)' : ''));

if (!slots.length) {
  console.log('אין משבצת לשלוח בה — לא נשלח דבר.');
  process.exit(0);
}
var slot = slots[slots.length - 1];      /* הנוכחית */
console.log('משבצות: ' + slots.length + ' · יום ' + slot.day + ' · ' +
            slots[0].t + '–' + slot.t + (slot.next ? '  (השבוע הבא)' : ''));

/* ============================================================
   השבוע שעליו מדובר. במוצאי שבת השבוע כבר התחלף.
   ============================================================
   `next` זהה בכל המשבצות שבחלון: היחידות שבהן הוא אמת הן
   שבת מ-20:00, וכל מה שלפניהן באותה שבת כבר סונן. ולכן די
   בבדיקה אחת, והיא נכונה גם כשמשלימים אחורה.
   ============================================================ */
var wk = P.LWeek() + (slot.next ? 1 : 0);

/* ============================================================
   שלושת השערים האלה שייכים לעדכון על הלימוד בלבד.
   ============================================================
   "כמה מכיתתך הצטרפו" מדבר על הרשמה ולא על דף, ולכן הוא
   נכון דווקא **לפני** שהתוכנית מתחילה — זה הזמן שבו תלמידים
   נרשמים, וזה מה שהרכז ירצה להראות לר"ם. שער שסוגר אותו אז
   סוגר אותו בדיוק כשהוא נחוץ. */
if (MODE === 'learn') {
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
}

/* **ובשבת לא שולחים, בשום מצב ובשום מצב-שליחה.** גם הודעה
   שהרכז יזם ביד אינה מצלצלת בטלפון של ר"ם בשבת. המשבצות של
   שבת כבר סוננו ב-`slotsNow`, וזו הרשת האחרונה. */
if (slot.day === 6 && slot.t < '20:00') {
  console.log('שבת — לא נשלח דבר.');
  process.exit(0);
}

/* מפתח אחד לכל עדכון בכל ההיסטוריה: למי, באיזה יום, ובאיזו
   משבצת. הוא מה שמונע שליחה כפולה כשהרצה משלימה אחורה. */
function keyOf(w, sl) {
  return 'dg|' + MODE + '|' + w.id + '|' + sl.date + '|' + sl.t;
}

/* הרישום נקרא לפני הכול: קריאה שנכשלה אינה "עוד לא נשלח
   כלום". עדכון שיוצא פעמיים לכל הצוות גרוע מהרצה שדילגה. */
Promise.all([loadWants(), S.sentLoad(key)]).then(function (both) {
  var all = both[0], sent = both[1];
  /* `ALL` — הודעה שהרכז החליט לשלוח, ולכן היא אינה נשענת על
     התזכורות של איש. בלעדיו: רק מי שביקש, ורק במשבצות שעדיין
     לא טופלו. */
  var due = [];
  if (ALL) {
    /* שליחה יזומה מתייחסת למשבצת הנוכחית בלבד — היא אינה
       "השלמה", והרכז לחץ עכשיו. */
    all.forEach(function (w) { w.slot = slot; due.push(w); });
  } else {
    all.forEach(function (w) {
      /* המשבצת האחרונה שהוא ביקש ושעדיין לא יצאה. אחת בלבד:
         שלוש השלמות ברצף הן שלוש התראות זהות. */
      for (var i = slots.length - 1; i >= 0; i--) {
        if (!wantsNow(w.when, slots[i])) continue;
        if (sent[keyOf(w, slots[i])]) continue;
        w.slot = slots[i];
        due.push(w);
        return;
      }
    });
  }
  console.log('רשומים: ' + all.length +
              (ALL ? ' · שולחים לכולם: ' : ' · ממתינים: ') + due.length);
  if (!due.length) {
    console.log('אין למי לשלוח.');
    return [];
  }

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
    /* המפתחות שיֵצאו בפועל, לרישום ב"נשלחו" בסוף. */
    var done = [];
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
      if (!msg) {
        console.log('  · ' + w.who + ' — אין לו עדיין תלמידים, מדלג');
        return 0;
      }
      if (DRY) {
        console.log('  · ' + w.who + ' · ' + w.slot.t + ' → ' + msg.title +
                    ' | ' + msg.body);
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
          /* רק מה שבאמת יצא נרשם. שליחה שנכשלה תנסה שוב. */
          if (!ALL) done.push(keyOf(w, w.slot));
          return 1;
        })
        .catch(function (e) {
          console.log('  ✗ ' + w.who + ' · ' + host + ' → ' +
                      (e.statusCode || '') + ' ' +
                      String(e.body || e.message || '').slice(0, 120));
          return 0;
        });
    })).then(function (res) {
      return S.sentMark(done).then(function () { return res; });
    });
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
