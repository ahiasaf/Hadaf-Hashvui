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

var priv  = process.env.VAPID_PRIVATE || '';
var key   = process.env.READ_KEY || '';
var title = process.env.TITLE || 'הדף השבועי';
var body  = process.env.BODY  || 'דף חדש מחכה לך.';
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

/* לשונית פרטית כלשהי, כשורות. אותה קריאה ואותם כללים של
   loadSubs — תשובה בלי `rows` היא כישלון, לא לשונית ריקה. */
function readTab(name) {
  var url = scriptUrl();
  if (!url) return Promise.reject(new Error('לא נמצאה כתובת הסקריפט ב-data.js'));
  var q = url + '?read=' + encodeURIComponent(name) +
          '&key=' + encodeURIComponent(key) + '&t=' + Date.now();
  return fetch(q).then(function (r) { return r.json(); }).then(function (j) {
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
  return fetch(q).then(function (r) { return r.json(); }).then(function (j) {
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

webpush.setVapidDetails(SUBJECT, PUBLIC, priv);

loadSubs().then(applyFlt).then(function (list) {
  /* אף אחד לא ביקש התראה על הדף הזה — מצב רגיל, לא תקלה. */
  if (WAIT && !list.length) {
    console.log('איש לא ביקש התראה על ' + WAIT + ' — לא נשלח דבר.');
    process.exit(0);
  }
  /* פילוח שאין בו איש — גם זה מצב רגיל ("כולם כבר סיימו"). */
  if ((FLT.seg || FLT.way || FLT.ids) && !list.length) {
    console.log('אין מנויים שעונים על הפילוח — לא נשלח דבר.');
    process.exit(0);
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
    process.exit(1);
  }
  if (list.blocked) {
    console.log(list.blocked + ' מכשירים דיווחו שההתראות בהם חסומות — ' +
                'מדלגים עליהם.');
  }
  console.log('שולח ל-' + list.length + ' מכשירים.\n');
  /* **בלי שמות בלוג.** הריפו ציבורי, ולכן גם יומני ההרצה —
     ושמות של תלמידים אינם שייכים לשם. מספר סידורי ומארח. */
  return Promise.all(list.map(function (it, n) {
    var host = '—';
    try { host = new URL(it.sub.endpoint).host; } catch (e) {}
    var first = FLT.per ? (it.first || '') : '';
    var payload = JSON.stringify({ title: personal(title, first),
                                   body: personal(body, first), url: link || './' });
    return webpush.sendNotification(it.sub, payload, { TTL: 3600 })
      .then(function (r) {
        console.log('  ✓ #' + (n + 1) + ' · ' + host + ' → ' + r.statusCode);
        return 1;
      })
      .catch(function (e) {
        console.log('  ✗ #' + (n + 1) + ' · ' + host + ' → ' +
                    (e.statusCode || '') + ' ' +
                    String(e.body || e.message || '').slice(0, 120));
        return 0;
      });
  }));
}).then(function (res) {
  var done = res.reduce(function (a, b) { return a + b; }, 0);
  console.log('\nהגיעו: ' + done + ' · נכשלו: ' + (res.length - done));
  /* מנוי שפג (410/404) אינו תקלה של הקוד — המכשיר הסיר את
     ההרשאה. נכשלו כולם = כן תקלה. */
  if (!done) process.exit(1);
})['catch'](function (e) {
  console.error('נכשל: ' + (e && e.message || e));
  process.exit(1);
});
