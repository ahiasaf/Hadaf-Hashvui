/* שליחת התראה למכשירים שנרשמו — רץ ב-GitHub Actions בלבד.
   ============================================================
   למה לא מכאן ולא מהסקריפט של גוגל:
     · שירות ההתראות של אפל אינו נגיש מסביבת הפיתוח, ולכן
       שליחה משם מגיעה לאנדרואיד ולא לאייפון — כלומר בדיוק
       חצי מהתשובה.
     · חתימת VAPID דורשת ECDSA, ו-Apps Script אינו יודע לחתום
       כך. GitHub Actions כבר רץ כאן על כל דחיפה, יש לו רשת
       פתוחה, והוא חינם.

   **המפתח הפרטי והמנויים הם סודות של הריפו ולא קבצים.**
   הריפו ציבורי: מפתח פרטי שנדחף אליו מאפשר לכל אחד לשלוח
   התראות בשם התוכנית, ומנוי הוא כתובת לדחוף למכשיר מסוים.

   מה שנכתב ללוג: מארח השירות וקוד התשובה בלבד. לא הכתובת
   המלאה, כי לוגים של ריפו ציבורי הם ציבוריים. */
var webpush = require('web-push');

var PUBLIC = 'BJ7oHIPuCdvARkdolXpxYXtnm43UNUOgiUNrf2FBA-QD8L_utJaYPKc5hr1NEYnbbdNVYqY5UxdX7lg-i_wIELw';
/* נושא ה-VAPID חייב להיות mailto או כתובת. כתובת האתר, ולא
   דוא"ל — אין לשים פרט אישי בריפו ציבורי. */
var SUBJECT = 'https://hadaf-hashvui.vercel.app';

var fs = require('fs');
/* הדיווח לסקריפט בסוף ההרצה — ראו push-report.js. */
var report = require('./push-report.js').report;
var D = require('./push-deliver.js');
var S = require('./sched.js'), GONE_ST = {};
function endWith(f, code) {
  return report(f).then(function () { process.exit(code); });
}

var priv  = process.env.VAPID_PRIVATE || '';
var key   = process.env.READ_KEY || '';
/* בהצתה מהניהול — מהאירוע עצמו ולא מ-env, כדי שלא יודפסו ביומן
   הציבורי של ההרצה. ראו push-send.yml. */
var EV = {};
try {
  EV = (JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH || '', 'utf8')) || {})
    .client_payload || {};
} catch (e) { EV = {}; }
var title = process.env.TITLE || EV.title || 'הדף השבועי';
var body  = process.env.BODY  || EV.body  || 'דף חדש מחכה לך.';
/* לאן ההתראה פותחת. ריק = שורש האפליקציה, כמו תמיד.
   נתיב יחסי בלבד — כתובת מלאה מכאן היא ערוץ הפניה. */
var link  = String(process.env.LINK || '').trim();
/* "הדף נפתח" — 'taanit|ג'. לא ריק = הנמענים הם רק מי שביקש
   בדף הנעול התראה על הדף הזה, מהלשונית "ממתינים לדף", ולא כל
   המנויים. */
var WAIT  = String(process.env.WAIT || '').trim();
/* הפילוח של "מילה לתלמידים" — ראו sayFlt_ ב-apps-script.gs.
   הוא רק מצמצם: הסינון לפי ישיבה/כיתה/תפקיד שלמטה חל קודם. */
var FLT = {};
try { FLT = JSON.parse(process.env.FLT || '{}') || {}; } catch (e) { FLT = {}; }
if (link && /^[a-zA-Z][a-zA-Z0-9+.\-]*:|^\/\//.test(link)) {
  console.error('כתובת ההתראה חייבת להיות יחסית. התקבל: ' + link);
  process.exit(1);
}

if (!priv) { console.error('חסר VAPID_PRIVATE בסודות הריפו.'); process.exit(1); }
if (!key)  { console.error('חסר READ_KEY בסודות הריפו.');      process.exit(1); }

/* כתובת הסקריפט יושבת ב-data.js ממילא — אין סיבה לשכפל אותה
   לסוד נוסף שיישכח ביום שהיא תתחלף. */
function scriptUrl() {
  var src = fs.readFileSync(__dirname + '/../data.js', 'utf8');
  var m = /APPS_SCRIPT_URL\s*=\s*'([^']+)'/.exec(src) ||
          /APPS_SCRIPT_URL\s*=\s*\n?\s*'([^']+)'/.exec(src);
  return m ? m[1] : '';
}

/* ============================================================
   קריאה מהגיליון — ניסיונות חוזרים עם המתנה הולכת וגדלה.
   ============================================================
   גוגל מחזיר לפעמים דף שגיאה (HTML, ולרוב 404 "unable to open the
   file at this time") במקום JSON. ב-6.10 וב-10.10 זה נמשך יותר
   משלושה ניסיונות של 20 שניות, וההודעה לא יצאה כלל.

   עכשיו: עד TRIES ניסיונות, ההמתנה מוכפלת בכל פעם (15ש', 30ש',
   דקה, 2, 4, ואז 5 דקות) עם רעש אקראי — כ-23 דקות בסך הכול. זמן
   קצוב של 45 שניות לכל ניסיון, כדי שבקשה תקועה לא תתקע הכול.
   כשנכשל סופית, ההודעה אומרת כמה ניסיונות, כמה זמן, ומה גוגל
   החזיר — זה מה שמגיע להתרעה לרכז. */
var TRIES = 9, ASK_MS = 45000;
function backoff(n) {
  return Math.min(300000, 15000 * Math.pow(2, n - 1)) + Math.floor(Math.random() * 3000);
}
function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
/* מה שכתוב בדף השגיאה של גוגל — הכותרת ושורת השגיאה, לא הקוד שבו. */
function googleWhy(t) {
  var tt = /<title>([^<]*)<\/title>/i.exec(t);
  var vis = String(t).replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  var er = /(unable to open[^<]{0,80}|Exceeded[^<]{0,80}|Service invoked[^<]{0,80}|Authorization[^<]{0,60}|Too many[^<]{0,60})/i.exec(vis);
  return [(tt ? tt[1].trim() : ''), (er ? er[0].replace(/\s+/g, ' ').trim() : '')]
    .filter(Boolean).join(' · ');
}
function getJson(q, n, t0) {
  n = n || 1; t0 = t0 || Date.now();
  /* הסטטוס ותחילת התשובה נכנסים להודעה — כדי שביומן ייראה מה
     בדיוק חזר (התחברות, פריסה שנמחקה, עומס), ולא רק "לא JSON". */
  var st = '';
  var ac = typeof AbortController === 'function' ? new AbortController() : null;
  var tm = ac ? setTimeout(function () { ac.abort(); }, ASK_MS) : null;
  return fetch(q, ac ? { signal: ac.signal } : {})
    .then(function (r) { st = r.status; return r.text(); }).then(function (t) {
    if (tm) clearTimeout(tm);
    try { return JSON.parse(t); }
    catch (e) {
      /* דף ההתחברות של גוגל עלול להחזיר את הכתובת המלאה, והמפתח
         בתוכה. היומן ציבורי — מוחקים אותו בשתי הצורות. */
      var snip = String(t).split(key).join('***')
                 .split(encodeURIComponent(key)).join('***');
      var gw = /<html/i.test(snip) ? googleWhy(snip) : '';
      throw new Error('גוגל החזיר שגיאה ' + st + ' במקום נתונים' +
                      (gw ? ' (' + gw + ')' : ' (' + snip.replace(/\s+/g, ' ').slice(0, 120) + ')'));
    }
  }, function (e) {
    if (tm) clearTimeout(tm);
    throw new Error(e && e.name === 'AbortError'
      ? 'גוגל לא ענה תוך ' + (ASK_MS / 1000) + ' שניות'
      : 'תקלת רשת מול גוגל: ' + (e && e.message || e));
  })['catch'](function (e) {
    if (n >= TRIES) {
      var min = Math.round((Date.now() - t0) / 60000);
      throw new Error(e.message + ' — ' + TRIES + ' ניסיונות במשך ' + min + ' דקות');
    }
    var ms = backoff(n);
    console.log('ניסיון ' + n + '/' + TRIES + ' נכשל (' + e.message + ') — מנסה שוב בעוד ' +
                Math.round(ms / 1000) + ' שניות.');
    return sleep(ms).then(function () { return getJson(q, n + 1, t0); });
  });
}

/* לשונית פרטית כלשהי, כשורות. אותה קריאה ואותם כללים של
   loadSubs — תשובה בלי `rows` היא כישלון, לא לשונית ריקה. */
function readTab(name) {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  var q = url + '?read=' + encodeURIComponent(name) +
          '&key=' + encodeURIComponent(key) + '&t=' + Date.now();
  return getJson(q)['catch'](function (e) {
    throw new Error('הלשונית "' + name + '" לא נקראה מהגיליון — ' + e.message);
  }).then(function (j) {
    if (!j || j.status !== 'ok' || !j.rows) {
      throw new Error('לא הצלחתי לקרוא את "' + name + '": ' + ((j && j.message) || 'לא ידוע'));
    }
    return j.rows;
  });
}
function colIx(rows) {
  var ix = {};
  (rows[0] || []).forEach(function (h, i) { ix[String(h).trim()] = i; });
  return ix;
}

/* ============================================================
   הפילוח — מי מהמנויים נשאר, ומה שמו הפרטי.
   ============================================================
   `לומדים` נותנת שם פרטי ומסגרת לפי מזהה. `לימוד` נותנת מה
   למד בשבוע `FLT.wk`: שורה שלמה = סיים, שורת התקדמות = באמצע,
   כלום = לא התחיל. אותו כלל בדיוק של הלוח (apps-script.gs,
   `done`/`pos`).

   **מנוי שאין עליו מידע אינו נכלל בפילוח.** מי שביקש "רק מי
   שסיים" לא אמור לשלוח למי שאיננו יודעים עליו דבר. */
function applyFlt(list) {
  var needPeople = FLT.per || FLT.way;
  var needLearn  = !!FLT.seg;
  if (!needPeople && !needLearn && !FLT.ids) return Promise.resolve(list);
  return Promise.all([
    needPeople ? readTab('לומדים') : Promise.resolve(null),
    needLearn  ? readTab('לימוד')  : Promise.resolve(null)
  ]).then(function (res) {
    var ppl = {}, st = {};
    if (res[0] && res[0].length > 1) {
      var a = colIx(res[0]);
      res[0].slice(1).forEach(function (r) {
        var id = String(r[a['מזהה']] || '').trim();
        if (id) ppl[id] = { first: String(r[a['שם']] || '').trim(),
                            way:   String(r[a['מסגרת']] || '').trim() };
      });
    }
    if (res[1] && res[1].length > 1) {
      var b = colIx(res[1]);
      res[1].slice(1).forEach(function (r) {
        var id = String(r[b['מזהה']] || '').trim();
        if (!id || String(r[b['שבוע']] || '').trim() !== String(FLT.wk)) return;
        var at = b['קטע']  === undefined ? '' : String(r[b['קטע']]  || '').trim();
        var of = b['מתוך'] === undefined ? '' : String(r[b['מתוך']] || '').trim();
        var n1 = parseInt(at, 10), n2 = parseInt(of, 10);
        if (!at || !(n2 > 0) || n1 >= n2) st[id] = 'done';
        else if (st[id] !== 'done') st[id] = 'mid';
      });
    }
    var out = list.filter(function (it) {
      if (FLT.ids && FLT.ids.indexOf(it.id) < 0) return false;
      if (FLT.way && (!ppl[it.id] || ppl[it.id].way !== FLT.way)) return false;
      var my = st[it.id] || 'none';
      if (FLT.seg === 'todo' ? my === 'done' : (FLT.seg && my !== FLT.seg)) return false;
      return true;
    });
    out.forEach(function (it) {
      var p = ppl[it.id];
      it.first = (p && p.first) || String(it.who || '').split(' ')[0] || '';
    });
    out.blocked = list.blocked;
    return out;
  });
}

/* הפנייה האישית. {name} מוחלף בשם הפרטי; אין שם — הפנייה
   יורדת כולה, ולא נשאר "{name}," או פסיק יתום. */
function personal(text, first) {
  if (first) return String(text).replace(/\{name\}/g, first);
  return String(text).replace(/\{name\}[,،]?\s*/g, '');
}

/* המנויים מגיעים מהלשונית הפרטית ולא מסוד שצריך לעדכן ביד.
   כך בודק חדש פשוט נרשם מהעמוד, ואיש אינו נוגע בהגדרות. */
function loadSubs() {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  /* **`read` ולא `tab`.** הפרמטר לקריאה נקרא `read`; `tab` הוא
     של הכתיבה. עם השם הלא נכון הסקריפט אינו נכנס לענף הקריאה
     כלל, ומחזיר תשובה תקינה בלי שורות — וזה נקרא כאן בטעות
     "הלשונית ריקה". שלוש שליחות אבדו על זה. */
  var q = url + '?read=' + encodeURIComponent(WAIT ? 'ממתינים לדף' : 'התראות') +
          '&key=' + encodeURIComponent(key) + '&t=' + Date.now();
  return getJson(q)['catch'](function (e) {
    throw new Error('רשימת המנויים לא נקראה מהגיליון — ' + e.message);
  }).then(function (j) {
    if (!j || j.status !== 'ok') {
      throw new Error('הגיליון לא נענה: ' + ((j && j.message) || 'לא ידוע'));
    }
    /* **תשובה בלי שדה `rows` אינה לשונית ריקה — היא קריאה
       שנכשלה.** זה כלל הברזל של הפרויקט, והבלבול בין השניים
       הוא בדיוק מה שהסתיר את הבאג למעלה. */
    if (!j.rows) {
      throw new Error('התשובה מהגיליון אינה מכילה שורות כלל — ' +
                      'כנראה לא נקראה הלשונית הנכונה.');
    }
    var rows = j.rows;
    if (rows.length < 2) return [];
    /* מיפוי לפי שם העמודה ולא לפי מספרה: סדר עמודות משתנה
       ביום שמישהו גורר אחת, וקריאה לפי מספר נשברת בשקט. */
    var head = rows[0].map(function (x) { return String(x).trim(); });
    var iSub = head.indexOf('מנוי'), iWho = head.indexOf('שם');
    var iId  = head.indexOf('מזהה');
    /* סינון. ריק = בלי הגבלה.
       **הישיבה נבדקת בשני שמות**: בקוד ובשם המלא. מסך הניהול
       שולח שם, והר"ם שולח קוד — והשורה בגיליון נושאת את
       שניהם. השוואה לאחד בלבד הייתה שולחת לאיש. */
    var only  = String(process.env.ONLY  || '').trim();
    var grade = String(process.env.GRADE || '').trim();
    var klass = String(process.env.KLASS || '').trim();
    /* לצוות בלבד, או לתלמידים בלבד. ריק = לכולם. */
    var role  = String(process.env.ROLE  || '').trim();
    var iIns  = head.indexOf('ישיבה'), iCode = head.indexOf('קוד ישיבה');
    var iGr   = head.indexOf('שכבה'),  iKl   = head.indexOf('כיתה');
    var iRole = head.indexOf('תפקיד');

    /* **צמצום שאי אפשר לבצע — נכשל סגור.** ר"ם ביקש לשלוח
       לכיתה שלו; אם העמודה שלפיה מצמצמים חסרה בלשונית, הסינון
       פשוט לא יחול — וההודעה האישית שלו תצא לכל הישיבה. עדיף
       שלא תצא כלל, ושהיומן יאמר למה. */
    if (grade && iGr < 0) {
      throw new Error('התבקש צמצום לשכבה, ואין עמודת "שכבה" בלשונית ' +
                      'התראות. לא נשלח דבר.');
    }
    if (klass && iKl < 0) {
      throw new Error('התבקש צמצום לכיתה, ואין עמודת "כיתה" בלשונית ' +
                      'התראות. לא נשלח דבר.');
    }
    if (only && iIns < 0 && iCode < 0) {
      throw new Error('התבקש צמצום לישיבה, ואין עמודת "ישיבה" או ' +
                      '"קוד ישיבה" בלשונית התראות. לא נשלח דבר.');
    }
    if (role && iRole < 0) {
      throw new Error('התבקש צמצום לפי תפקיד, ואין עמודת "תפקיד" ' +
                      'בלשונית התראות. לא נשלח דבר.');
    }

    var iDaf = head.indexOf('דף');
    if (WAIT && iDaf < 0) {
      throw new Error('אין עמודת "דף" בלשונית ממתינים לדף. לא נשלח דבר.');
    }
    var hit = function (row) {
      if (WAIT && String(row[iDaf] || '').trim() !== WAIT) return false;
      if (only) {
        var a = iIns  >= 0 ? String(row[iIns]  || '').trim() : '';
        var b = iCode >= 0 ? String(row[iCode] || '').trim() : '';
        if (a !== only && b !== only) return false;
      }
      if (grade && String(row[iGr] || '').trim() !== grade) return false;
      if (klass && String(row[iKl] || '').trim() !== klass) return false;
      if (role) {
        var rv = String(row[iRole] || '').trim();
        /* "צוות" הוא כל מי שאינו תלמיד ואינו הורה — כך ר"ם,
           ראש חטיבה ורכז נכנסים בלי לתחזק רשימה. */
        if (role === 'צוות') {
          if (rv === 'תלמיד' || rv === 'הורה' || rv === 'אב' || !rv) return false;
        } else if (rv !== role) return false;
      }
      return true;
    };
    if (iSub < 0) throw new Error('אין עמודת "מנוי" בלשונית התראות');
    var seen = {}, out = [], blocked = 0;
    /* מהסוף להתחלה: מי שנרשם שוב מאותו מכשיר — הרישום האחרון
       הוא הנכון, והישן עלול כבר להיות פג. */
    for (var i = rows.length - 1; i >= 1; i--) {
      if (!hit(rows[i])) continue;
      var raw = rows[i][iSub];
      /* שורה בלי מנוי היא דיווח שההתראות חסומות במכשיר — נתון
         על ציבור המשתמשים, לא נמען. סופרים ולא שולחים. */
      if (!raw) { blocked++; continue; }
      var s;
      try { s = JSON.parse(raw); } catch (e) { continue; }
      if (!s || !s.endpoint || seen[s.endpoint]) continue;
      seen[s.endpoint] = 1;
      out.push({ sub: s, who: (iWho >= 0 ? rows[i][iWho] : '') || '',
                 id: iId >= 0 ? String(rows[i][iId] || '').trim() : '' });
    }
    out.blocked = blocked;
    return out;
  });
}

/* ============================================================
   מניעת כפילות — כל הודעה מגיעה לכל מכשיר פעם אחת בלבד.
   ============================================================
   לכל הודעה מזהה (`FLT.mid` — נקבע בסקריפט בשליחה הראשונה, ונשמר
   גם בשליחה חוזרת). הלשונית הפרטית "מסירות" מחזיקה, לכל הודעה,
   אילו מכשירים (טביעה של המנוי, לא המנוי עצמו) כבר קיבלו אותה.

   1. **לפני** כל קבוצה של מכשירים נרשם "ממתין". לא נרשם — לא
      שולחים: עדיף שהודעה תחכה לשליחה חוזרת מאשר שתגיע פעמיים.
   2. **אחרי** — "נשלח" / "נכשל" / "פג" לכל מכשיר.
   3. שליחה חוזרת (מהניהול, או הרצה חוזרת ב-GitHub) מדלגת על כל
      מכשיר שרשום "נשלח" או "ממתין" (אולי יצא ולא נרשם — לא
      מסתכנים), ושולחת רק למי שנכשל או שלא הגיעו אליו.
   קריאה שנכשלה של "מסירות" אינה "עוד לא נשלח לאיש" — היא סיבה
   לא לשלוח כלל. */
var MID = String(FLT.mid || '').trim();
var SID = String(process.env.SID || '').trim();
var DLV_TAB = 'מסירות', BATCH = 40;
/* המונים של ההרצה — גם כשהיא נופלת באמצע, הדיווח אומר כמה כבר יצאו. */
var CNT = { ok: 0, bad: 0, gone: 0, prev: 0, codes: {} };

function loadDone() {
  if (!MID) return Promise.resolve({});
  return readTab(DLV_TAB).then(function (rows) {
    var st = {};
    /* הלשונית עוד לא נוצרה — `rows` ריק ותקין. זה המקרה היחיד שבו
       ריק הוא אמת. */
    if (rows.length < 2) return st;
    var a = colIx(rows);
    if (a['מזהה הודעה'] === undefined || a['מכשירים'] === undefined) {
      throw new Error('בלשונית "' + DLV_TAB + '" חסרות העמודות "מזהה הודעה"/"מכשירים"');
    }
    rows.slice(1).forEach(function (r) {
      if (String(r[a['מזהה הודעה']] || '').trim() !== MID) return;
      var s = String(r[a['מצב']] || '').trim();
      String(r[a['מכשירים']] || '').split(',').forEach(function (p) {
        p = p.trim(); if (p) st[p] = s;
      });
    });
    return st;
  });
}

/* שורה אחת ב"מסירות". true = נרשמה בוודאות (הסקריפט ענה ok). */
function markRows(state, prints) {
  if (!MID || !prints.length) return Promise.resolve(true);
  var url = scriptUrl();
  var body = JSON.stringify({ action: 'row', tab: DLV_TAB, key: key,
    cols: JSON.stringify([['מזהה הודעה', MID], ['מזהה שליחה', SID], ['מצב', state],
                          ['מכשירים', prints.join(',')], ['כמה', prints.length]]) });
  var once = function () {
    var ac = typeof AbortController === 'function' ? new AbortController() : null;
    var tm = ac ? setTimeout(function () { ac.abort(); }, ASK_MS) : null;
    var o = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body };
    if (ac) o.signal = ac.signal;
    return fetch(url, o).then(function (r) { return r.text(); }).then(function (t) {
      if (tm) clearTimeout(tm);
      if (!/"status"\s*:\s*"(success|ok)"/.test(String(t))) throw new Error('הסקריפט לא אישר');
      return true;
    }, function (e) { if (tm) clearTimeout(tm); throw e; });
  };
  var go = function (n) {
    return once()['catch'](function (e) {
      if (n >= 6) {
        console.log('  ! לא נרשם ב"' + DLV_TAB + '" (' + state + ', ' + prints.length + ' מכשירים)');
        return false;
      }
      return sleep(Math.min(80000, 5000 * Math.pow(2, n - 1))).then(function () { return go(n + 1); });
    });
  };
  return go(1);
}

/* "שגיאה 500 ×2 · תקלת רשת ×1" — הסיבה המדויקת לכישלון מכשירים. */
function codesTxt() {
  return Object.keys(CNT.codes).map(function (c) {
    return (c === 'רשת' ? 'תקלת רשת' : 'שגיאה ' + c) + (CNT.codes[c] > 1 ? ' ×' + CNT.codes[c] : '');
  }).join(' · ');
}

webpush.setVapidDetails(SUBJECT, PUBLIC, priv);

/* "בשליחה" — שהיומן לא יישאר על "ממתין" כשההרצה כבר רצה. */
report({ run: 1 });
var STOP = '', LEFT = 0;
loadSubs().then(applyFlt).then(function (list) {
  /* אף אחד לא ביקש התראה על הדף הזה — מצב רגיל, לא תקלה. */
  if (WAIT && !list.length) {
    console.log('איש לא ביקש התראה על ' + WAIT + ' — לא נשלח דבר.');
    return endWith({ none: 1 }, 0);
  }
  /* פילוח שאין בו איש — גם זה מצב רגיל ("כולם כבר סיימו"). */
  if ((FLT.seg || FLT.way || FLT.ids) && !list.length) {
    console.log('אין מנויים שעונים על הפילוח — לא נשלח דבר.');
    return endWith({ none: 1 }, 0);
  }
  if (!list.length) {
    /* חשוב להפריד בין "לא הגענו לגיליון" ל"הגענו ואין בו איש":
       אם הגענו — הסודות תקינים, והחסר הוא רק שמישהו יירשם.
       בלי ההבחנה הזו מחפשים תקלה במקום שאין בה. */
    console.error('הגיליון נקרא בהצלחה — כלומר הסודות תקינים.');
    console.error(list.blocked
      ? 'אבל אין בו אף מנוי פעיל — רק ' + list.blocked +
        ' דיווחים על מכשירים שההתראות בהם חסומות.'
      : 'אבל אין בו אף מנוי: הלשונית "התראות" ריקה.');
    console.error('צריך שמישהו ייכנס ל-/pushtest, יתקין, וילחץ');
    console.error('"הרשמה לקבלת התראות". רק אז יש למי לשלוח.');
    /* אין אף מנוי — אינו כישלון של ההרצה, ואינו מתריע. */
    return endWith({ none: 1 }, 0);
  }
  if (list.blocked) {
    console.log(list.blocked + ' מכשירים דיווחו שההתראות בהם חסומות — ' +
                'מדלגים עליהם.');
  }
  return loadDone().then(function (done) {
    var todo = [];
    list.forEach(function (it) {
      it.p = S.subPrint(it.sub);
      var was = done[it.p];
      if (was === 'נשלח' || was === 'ממתין') { CNT.prev++; return; }
      if (was === 'פג') { CNT.gone++; return; }
      todo.push(it);
    });
    if (CNT.prev) console.log(CNT.prev + ' מכשירים כבר קיבלו את ההודעה הזו — מדלגים עליהם.');
    console.log('שולח ל-' + todo.length + ' מכשירים.\n');
    var parts = [];
    for (var b = 0; b < todo.length; b += BATCH) parts.push(todo.slice(b, b + BATCH));
    LEFT = todo.length;
    /* **בלי שמות בלוג.** הריפו ציבורי, ולכן גם יומני ההרצה —
       ושמות של תלמידים אינם שייכים לשם. מספר סידורי ומארח. */
    var sendOne = function (it, n) {
      var host = '—';
      try { host = new URL(it.sub.endpoint).host; } catch (e) {}
      var first = FLT.per ? (it.first || '') : '';
      var payload = JSON.stringify({ title: personal(title, first),
                                     body: personal(body, first), url: link || './' });
      /* זמן קצוב, ניסיון חוזר ומקביליות מוגבלת — ראו push-deliver.js. */
      return D.deliver(webpush, it.sub, payload).then(function (r) {
        if (r.ok) {
          CNT.ok++;
          console.log('  ✓ ' + host + ' → ' + r.code + (r.tries > 1 ? ' (ניסיון ' + r.tries + ')' : ''));
          return 'נשלח';
        }
        console.log('  ✗ ' + host + ' → ' + (r.code || '') + ' ' +
                    (r.gone ? 'המנוי פג' : (r.err || '')));
        /* 404/410 = המנוי פג (המכשיר הסיר את ההרשאה) — לא תקלה. */
        if (r.gone) {
          CNT.gone++;
          /* נרשם "פג" למנוי הזה — הניהול מציג אותו כך, והעדכון לר"מים
             והתזכורות לא ינסו אותו שוב. ראו markGone ב-sched.js. */
          return S.markGone(GONE_ST, it.sub).then(function () { return 'פג'; }, function () { return 'פג'; });
        }
        CNT.bad++;
        var c = r.code ? String(r.code) : 'רשת';
        CNT.codes[c] = (CNT.codes[c] || 0) + 1;
        return 'נכשל';
      });
    };
    return parts.reduce(function (chain, part) {
      return chain.then(function () {
        if (STOP) return;
        return markRows('ממתין', part.map(function (it) { return it.p; })).then(function (ok) {
          if (!ok) {
            STOP = 'הגיליון לא אישר רישום לפני השליחה — כדי לא לשלוח פעמיים, ' +
                   LEFT + ' מכשירים לא קיבלו (אפשר לשלוח שוב מהניהול)';
            return;
          }
          return D.mapLimit(part, 8, sendOne).then(function (res) {
            LEFT -= part.length;
            var g = { 'נשלח': [], 'נכשל': [], 'פג': [] };
            res.forEach(function (s, k) { g[s].push(part[k].p); });
            return markRows('נשלח', g['נשלח'])
              .then(function () { return markRows('נכשל', g['נכשל']); })
              .then(function () { return markRows('פג', g['פג']); });
          });
        });
      });
    }, Promise.resolve()).then(function () { return true; });
  });
}).then(function (res) {
  if (res !== true) return;              /* יצאנו כבר למעלה */
  var bad = CNT.bad + (STOP ? LEFT : 0);
  console.log('\nהגיעו: ' + CNT.ok + ' · נכשלו: ' + bad + ' · פג: ' + CNT.gone +
              (CNT.prev ? ' · קיבלו כבר קודם: ' + CNT.prev : ''));
  var f = { n: CNT.ok, bad: bad, gone: CNT.gone, prev: CNT.prev, det: codesTxt() };
  if (STOP) { f.why = STOP; return endWith(f, 1); }
  /* מנוי שפג (410/404) אינו תקלה של הקוד — המכשיר הסיר את
     ההרשאה. נכשלו כולם = כן תקלה. */
  if (!CNT.ok && !CNT.prev && !bad) { f.none = 1; return endWith(f, 0); }
  if (!CNT.ok && !CNT.prev) {
    f.why = 'כל ' + bad + ' המכשירים דחו את ההודעה' + (f.det ? ' (' + f.det + ')' : '');
    return endWith(f, 1);
  }
  /* הצלחה חלקית נאמרת כמו שהיא — ואינה נשלחת שוב בגורף. */
  return endWith(f, 0);
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  return endWith({ why: String(e && e.message || e), n: CNT.ok, bad: CNT.bad + LEFT,
                   gone: CNT.gone, prev: CNT.prev, det: codesTxt() }, 1);
});
