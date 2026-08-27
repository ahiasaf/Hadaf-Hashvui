/* ============================================================
   הדף השבועי של בני עקיבא — הגשר בין האפליקציה לגיליון
   ============================================================

   הרעיון: הסקריפט הזה טיפש בכוונה.
   -------------------------------
   בגרסאות הקודמות הוא ידע דברים על האפליקציה — אילו עמודות יש
   בהרשמה, אילו לשוניות קיימות — ולכן כל שינוי קטן באפליקציה חייב
   הדבקה ופריסה מחדש ביד.

   כאן זה נגמר. הסקריפט לא יודע דבר על התוכן: הוא מקבל רשימת
   עמודות מסודרת מהאפליקציה, וכותב אותה. עמודה חדשה? הוא יוסיף
   אותה לבד. לשונית חדשה? הוא ייצור אותה לבד. כל שינוי עתידי קורה
   בקוד האפליקציה בלבד.

   *** לגבי הגיליון — זו הפריסה האחרונה שנדרשת ממך. ***
   (גרסאות 4 ו-5 כן דרשו פריסה נוספת, כי הן פותחות יכולת חדשה
   ואינן משנות נתונים: 4 — קריאת קבצים מהדרייב בשביל הסטודיו,
   5 — קריאת לשונית פרטית בשביל מוקד השיחות. הכלל נשאר בתוקף
   לכל מה שנוגע לכתיבה לגיליון.)

   מה זה עושה
   ----------
   1. הרשמות  — ראש חטיבה לוחץ "שליחת ההרשמה", והשורה מופיעה
                בלשונית "הרשמות". שום וואטסאפ לא נפתח לו.
   2. חידות   — תשובות התלמידים ללשונית "חידות".
   3. טקסטים  — עריכת המלל מ-/admin ← טקסטים נכתבת ללשונית
                "טקסטים", וכל מי שפותח את האפליקציה רואה אותה.

   התקנה — 4 שלבים, בערך שלוש דקות
   --------------------------------
   1. פתח את גיליון המוסדות:
      https://docs.google.com/spreadsheets/d/1OdC-qFaX3sK6nZMgmWWXb8LDUvQSir2ItZKt-f1yop0

   2. תפריט  Extensions ← Apps Script.
      מחק את מה שיש שם, הדבק את כל הקובץ הזה, ושמור.

   3. כפתור  Deploy ← New deployment  (או Manage deployments ←
      עריכה ← New version, אם כבר פרסמת פעם).
      גלגל השיניים ← Web app.
        Execute as:      Me
        Who has access:  Anyone            ← חייב "Anyone", אחרת ייחסם
      Deploy, ואשר את ההרשאות.

   פריסה מחדש — לקרוא לפני שמדביקים
   ---------------------------------
   **אם הגדרת מאפייני פרויקט (ראו למטה) — אין כאן מה לעשות.**
   הדבק, פרוס, וזהו. זו הדרך המומלצת, וכל השאר כאן מיותר.

   בלי מאפיינים: הדבקה של הקובץ **מוחקת את שני הערכים שמילאת
   בו** — PRIVATE_ID ו-READ_KEY. הקובץ שבריפו מגיע איתם ריקים.

   ריק אינו נראה כתקלה. הכתיבה ממשיכה להצליח — רק שהיא נוחתת
   בגיליון הראשי, זה שמשותף לצפייה ושהמזהה שלו יושב בקוד
   האפליקציה. כלומר שמות וטלפונים של תלמידים והורים, בגלוי.
   ו-READ_KEY ריק סוגר את מסך המשתתפים בלי לומר למה.

   **התיקון הוא חד־פעמי, וכדאי לעשות אותו עכשיו:** העבירו את
   שני הערכים למאפייני הפרויקט (ההסבר המלא בהמשך הקובץ, ליד
   prop_). מאותו רגע ההדבקה אינה נוגעת בהם, והפריסה מחדש היא
   שלושה צעדים בלבד:

   1. הדביקו את הקובץ החדש ושמרו.
   2. Deploy ← Manage deployments ← עריכה ← **New version**.
      "New deployment" ייתן כתובת חדשה שהאפליקציה אינה מכירה,
      וכל פרסום ימשיך ללכת לשום מקום.
   3. ניהול ← הגדרות ← "בדיקת חיבור". הוא אומר את הכל: את מספר
      הגרסה, אם הגיליון הפרטי מוגדר, אם יש סיסמה, ואם שניהם
      מוגנים מפני ההדבקה הבאה.

   *** גרסה 4 מוסיפה קריאת קבצים מהדרייב, בשביל הסטודיו. ***
   בפריסה הזו גוגל תבקש הרשאה נוספת לדרייב — זה מה שמאפשר
   לסטודיו לקבל את קובץ הדף. הקבצים נשארים פרטיים.

   4. בדיקה. מסך הניהול אינו כתובת נפרדת: לוקחים את הקישור שבו
      פותחים את האפליקציה ומוסיפים לו /admin בסוף. למשל
      https://<הכתובת-שלך>/admin  — ואז קוד בן 4 ספרות.
      שם: הגדרות ← "בדיקת חיבור". אמור להופיע SCRIPT_VERSION
      שלמטה. הופיע — סיימת.

      השדה "כתובת שרת" שבאותו מסך אמור להיות מלא כבר, כי הכתובת
      יושבת ב-APPS_SCRIPT_URL שב-data.js. אין צורך להדביק אותה
      ביד. הוא קיים רק כדי לדרוס אותה זמנית על מכשיר אחד לצורך
      ניסוי — הגדרה שם אינה מגיעה לראשי החטיבות.

      "הפריסה ישנה — גרסה 1 במקום 3" פירושו ששמרת אבל לא פרסת:
      חזור לשלב 3 והקפד על Version: New version.

   חשוב לטקסטים
   ------------
   לשונית "טקסטים" נוצרת לבד בפרסום הראשון. כדי שהאפליקציה תוכל
   לקרוא ממנה, הגיליון חייב להיות משותף כ:
      "כל מי שיש לו הקישור — מציג".
   אפשר גם לערוך אותה ישירות בגיליון: עמודה A מפתח, עמודה B נוסח.
   מחיקת שורה מחזירה את הנוסח שבקוד.
   ============================================================ */

/* מספר שמוצג ב"בדיקת חיבור". אם מה שרואים במסך הניהול נמוך מזה —
   הפריסה בגוגל ישנה, ויש ללחוץ Deploy ← Manage deployments ←
   עריכה ← New version. */
var SCRIPT_VERSION = 17;

/* ============================================================
   הגיליון הפרטי — מלאו כאן פעם אחת.
   ============================================================
   הגיליון שהסקריפט מחובר אליו חייב להיות משותף כ"כל מי שיש לו
   הקישור — מציג", אחרת האפליקציה אינה יכולה לקרוא ממנו כלל.
   והמזהה שלו יושב ב-data.js, כלומר בקוד שמוגש לכל דפדפן. מכאן
   מסקנה שקל לפספס: **כל מה שנכתב לגיליון הזה גלוי לכל מי שפותח
   את קוד המקור של האפליקציה.**

   זה בסדר גמור לסימוני הדף ולמלל. זה אינו בסדר לשם של תלמיד או
   לטלפון של הורה.

   הכתובת הזו חייבת לשבת **כאן ולא באפליקציה**: את הגדרות
   האפליקציה ממלא הרכז על המכשיר שלו, והטלפון של התלמיד אינו
   יודע עליהן דבר. הסקריפט רץ בחשבון שלך ולכן הוא המקום היחיד
   שיכול להכיר גיליון סגור.

   1. פתחו גיליון חדש ריק ואל תשתפו אותו עם איש.
   2. העתיקו מהכתובת שלו את המזהה — החלק שבין /d/ לבין /edit.
   3. הדביקו כאן, בין הגרשיים.

   **ואפשר לא למלא כאן כלום.** ראו PROP_ הסבר למטה: הערך יכול
   לשבת במאפייני הפרויקט, ואז הדבקה של קוד חדש אינה נוגעת בו.

   ריק = הכל נכתב לגיליון הראשי, כלומר בגלוי. */
var PRIVATE_ID_FALLBACK = '';

/* לשוניות שיש בהן פרטים אישיים. אלה נכתבות לגיליון הפרטי.

   "הרשמות" ו"חידות" נוספו כאן מאוחר, וזה היה חור: הרשמה של
   ראש חטיבה נושאת את שמו ואת הטלפון שלו, ותשובה לחידה נושאת
   שם וטלפון של תלמיד — ושתיהן נכתבו לגיליון הראשי, שמשותף
   לצפייה ושהמזהה שלו יושב בקוד של האפליקציה.

   שורות שכבר נכתבו לשם נשארות שם. כדאי להעביר אותן ידנית
   לגיליון הפרטי ולמחוק אותן מהראשי. */
var PRIVATE_TABS = ['לומדים', 'לימוד', 'הרשמות', 'חידות', 'קודים'];

/* לשונית המוסדות בגיליון הראשי. עמודה A קוד, B שם, C אשתקד,
   D "בפנים". היא ציבורית בכוונה — היא רשימת המוסדות שהאפליקציה
   מציגה, ואין בה פרט אישי אחד. */
var INST_TAB = 'מוסדות';

/* ============================================================
   סיסמת הקריאה — מלאו כאן פעם אחת, ואותו דבר בניהול ← הגדרות.
   ============================================================
   בלי זה הגיליון הפרטי אינו שווה דבר. כתובת הסקריפט יושבת
   בקוד של האפליקציה, כלומר כל אחד יכול לפתוח אותה; אם קריאה
   של לשונית פרטית תעבוד בלי סיסמה, רשימת השמות והטלפונים
   רחוקה כתובת אחת מכל אדם בעולם — בדיוק מה שהגיליון הפרטי בא
   למנוע.

   כתבו כאן כל מחרוזת שתרצו, ארוכה ואקראית ככל האפשר, והדביקו
   את אותה מחרוזת בניהול ← הגדרות ← "סיסמת הקריאה". היא נשמרת
   על המכשיר שלכם בלבד ואינה מתפרסמת לאיש.

   **ואפשר לא למלא כאן כלום.** ראו PROP_ הסבר למטה.

   ריק = קריאה של לשונית פרטית נדחית תמיד. זו ברירת המחדל
   הבטוחה: עדיף שמסך המשתתפים יהיה ריק מאשר שהרשימה תהיה
   פתוחה. כתיבה אינה מושפעת — תלמיד ממשיך להירשם כרגיל. */
var READ_KEY_FALLBACK = '';

/* ============================================================
   מאפייני הפרויקט — ההגדרה שנשארת כשהקוד מתחלף.
   ============================================================
   הקובץ הזה מתעדכן מדי פעם, וכל עדכון נעשה בהדבקה שמוחקת את מה
   שכתוב בו. שני הערכים שלמעלה נמחקו כך בכל פעם, בשקט: הכתיבה
   המשיכה להצליח, רק שהיא נחתה בגיליון שמשותף לצפייה. מלכודת
   שאין ממנה סימן.

   מאפייני הפרויקט יושבים **מחוץ לקוד**, ולכן הדבקה אינה נוגעת
   בהם. מגדירים אותם פעם אחת ולא חוזרים לזה:

     בעורך Apps Script ← גלגל השיניים (Project Settings) ←
     גוללים ל-Script Properties ← Add script property.
       שם: PRIVATE_ID   ערך: מזהה הגיליון הפרטי
       שם: READ_KEY     ערך: הסיסמה שבחרתם

   מכאן והלאה: הדביקו קוד חדש מתי שתרצו, ואל תגעו בשום דבר.

   השורות שלמעלה נשארות כגיבוי בלבד — למי שלא הגדיר מאפיינים.
   מה שבמאפיינים גובר עליהן תמיד.
   ============================================================ */
function prop_(name, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(name);
    if (v != null && String(v).trim() !== '') return String(v).trim();
  } catch (e) {}
  return fallback;
}
var PRIVATE_ID = prop_('PRIVATE_ID', PRIVATE_ID_FALLBACK);
var READ_KEY   = prop_('READ_KEY',   READ_KEY_FALLBACK);

/* מאיפה הערכים באו — כדי ש"בדיקת חיבור" תוכל לומר אם הם
   מוגנים מפני ההדבקה הבאה או שהם עומדים להימחק בה. */
function propSrc_(name, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(name);
    if (v != null && String(v).trim() !== '') return 'props';
  } catch (e) {}
  return fallback ? 'code' : 'none';
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);

    /* ---- הצורה הכללית: האפליקציה נוקבת בלשונית ובעמודות ----

       `ss` הוא מזהה גיליון אחר, והוא הדבר שמאפשר לכתוב פרטים
       אישיים בלי לפרסם אותם.

       הגיליון שהסקריפט מחובר אליו חייב להיות משותף כ"כל מי שיש
       לו הקישור — מציג", אחרת האפליקציה אינה יכולה לקרוא ממנו
       כלל. והמזהה שלו יושב ב-data.js, כלומר בקוד שמוגש לכל
       דפדפן. מכאן מסקנה שקל לפספס: **כל מה שנכתב לגיליון הזה
       גלוי לכל מי שפותח את קוד המקור של האפליקציה.**

       זה בסדר גמור עבור סימוני הדף ועבור המלל. זה אינו בסדר
       עבור שם של תלמיד או מספר טלפון של הורה. אלה נכתבים עם
       `ss` — ונוחתים בגיליון סגור שאיש אינו רואה.

       הקריאה כבר תמכה ב-`ss` (ראו doGet); עכשיו גם הכתיבה. */
    if (d.action === 'row')   return appendCols_(d.tab, parse_(d.cols), d.ss);
    if (d.action === 'table') return writeTable_(d.tab, parse_(d.cols), parse_(d.rows), d.ss);

    /* ---- מחיקה ----

       כתובת הסקריפט יושבת בקוד של האפליקציה, כלומר כל אחד יכול
       לפתוח אותה. כתיבה פתוחה היא שורה מיותרת בגיליון; מחיקה
       פתוחה היא כפתור "למחוק הכל" שנמסר לעולם. לכן ורק כאן
       נדרשת הסיסמה — אותה READ_KEY, שיושבת על המכשיר של הרכז
       ואינה מתפרסמת לאיש.

       ריק = מחיקה חסומה תמיד. זו ברירת המחדל הבטוחה. */
    if (d.action === 'clear' || d.action === 'delrow') {
      if (!READ_KEY || String(d.key || '') !== READ_KEY) {
        return json_({ status: 'denied',
          message: READ_KEY ? 'סיסמה שגויה'
                            : 'לא נקבעה סיסמה בסקריפט (READ_KEY) — מחיקה חסומה' });
      }
      if (d.action === 'clear')  return json_(clearTab_(d.tab, d.ss));
      return json_(delRows_(d.tab, d.col, parse_(d.vals), d.ss));
    }

    /* ---- הצורות הישנות. נשארות כדי שמכשיר שמחזיק גרסה ישנה
            של האפליקציה במטמון לא יאבד הרשמה. ---- */
    /* מוסד שנרשם מסומן מיד כ"בפנים" ברשימת המוסדות, וכך הוא
       מופיע בעמוד הראשי אצל כולם בלי שאיש יגע במתג. */
    if (d.action === 'register') markJoined_(d.code);
    /* הקוד נוצר ברגע ההרשמה, ולא בבקשה נפרדת: הכתיבה יוצאת
       ב-no-cors ואין ממנה תשובה, ולכן הצד השני מייצר את הקוד
       ושולח אותו — וכך הוא כבר יודע אותו בלי לשאול. אם כבר יש
       קוד למוסד, הוא נשאר: קישור שהופץ לצוות לא נשבר. */
    if (d.action === 'register' && d.access) ensureCode_(d.code, d.access);
    if (d.action === 'register') return appendCols_('הרשמות', d.cols ? parse_(d.cols) : [
      ['ישיבה', d.inst], ['קוד', d.code], ['איש קשר', d.who], ['טלפון', d.phone],
      ['תענית · ושננתם', d['taanit-veshinantam'] || 0],
      ['תענית · הסוגיה היומית', d['taanit-sugya'] || 0],
      ['מגילה · ושננתם', d['megila-veshinantam'] || 0],
      ['מגילה · הסוגיה היומית', d['megila-sugya'] || 0],
      ['סה"כ גמרות', d.total || 0], ['פירוט', d.seferName || '']
    ]);

    if (d.action === 'quiz') return appendCols_('חידות', d.cols ? parse_(d.cols) : [
      ['שבוע', d.week], ['ישיבה', d.inst], ['שם', d.name], ['טלפון', d.phone],
      ['תשובה', d.answer + 1], ['נכון', d.correct ? 'נכון' : 'לא נכון']
    ]);

    if (d.action === 'texts') {
      var rows = parse_(d.rows).map(function (r) {
        return r.key !== undefined ? [r.key, r.value] : r;   /* שתי הצורות */
      });
      return writeTable_('טקסטים', ['מפתח', 'נוסח'], rows);
    }

    return json_({ status: 'ignored', action: d.action || '' });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* בדיקת חיבור. פתיחת ה-URL בדפדפן, או כפתור "בדיקת חיבור" בניהול,
   מחזירה את הגרסה הפרוסה ואת הלשוניות שהסקריפט רואה — כך שאין
   צורך לנחש אם הפריסה עלתה ואם היא מעודכנת.

   ?callback=foo מחזיר JavaScript במקום JSON. הסיבה: Apps Script
   מפנה את /exec לדומיין אחר, ודפדפנים חוסמים לעיתים את הקריאה
   הרגילה בגלל CORS. טעינה כתגית <script> עוקפת את זה תמיד. */
function doGet(e) {
  /* ---- קובץ מהדרייב ----
     הסטודיו צריך את קובץ הדף כדי לצייר אותו ולזהות בו שורות,
     והדפדפן אינו מרשה לקוד שלנו למשוך בייטים מ-drive.google.com:
     גוגל אינה שולחת שם את כותרת ה-CORS. הסקריפט הזה רץ בחשבון
     שלך, ולכן הוא יכול לקרוא מהדרייב שלך ולהעביר הלאה. הקבצים
     נשארים פרטיים; רק מי שיודע את המזהה מקבל אותם. */
  if (e && e.parameter && e.parameter.file) {
    var res;
    try {
      var f = DriveApp.getFileById(String(e.parameter.file));
      res = { status: 'ok', name: f.getName(), mime: f.getMimeType(),
              data: Utilities.base64Encode(f.getBlob().getBytes()) };
    } catch (err) {
      res = { status: 'error', message: String(err) };
    }
    return reply_(e, res);
  }

  /* ---- הלוח של מוסד ----
     הקוד שבקישור הוא ההרשאה, ולכן אין כאן READ_KEY: ראש חטיבה
     אינו אמור להחזיק את המפתח של הרכז. */
  if (e && e.parameter && e.parameter.board) {
    var bd;
    try { bd = boardData_(String(e.parameter.board), e.parameter.k); }
    catch (err0) { bd = { status: 'error', message: String(err0) }; }
    return reply_(e, bd);
  }

  /* ---- הקודים · לרכז בלבד ----
     `codes` מחזיר את כולם, `newcode` מייצר חדש למוסד אחד —
     למקרה שקישור דלף לקבוצה שלא היה אמור להגיע אליה. */
  if (e && e.parameter && (e.parameter.codes || e.parameter.newcode)) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied',
        message: READ_KEY ? 'סיסמה שגויה'
                          : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
    }
    try {
      if (e.parameter.newcode) {
        var nc = setCode_(String(e.parameter.newcode), newCode_());
        return reply_(e, { status: 'ok', inst: String(e.parameter.newcode), code: nc });
      }
      var csh = codeRows_(), cmap = {};
      if (csh.getLastRow() >= 2) {
        var cv = csh.getRange(2, 1, csh.getLastRow() - 1, 2).getDisplayValues();
        for (var q = 0; q < cv.length; q++) {
          var kk = String(cv[q][0]).trim();
          if (kk) cmap[kk] = String(cv[q][1]).trim();
        }
      }
      return reply_(e, { status: 'ok', codes: cmap });
    } catch (err2) {
      return reply_(e, { status: 'error', message: String(err2) });
    }
  }

  /* ---- ספירה מחדש ביד ----
     המונים נגזרים אוטומטית מכל כתיבה ומכל מחיקה, אבל גיליון
     שנערך ביד — או שורות שנמחקו בגרסה ישנה של הסקריפט — משאירים
     מספר שאיש אינו יודע לתקן. כפתור אחד בניהול פותר את זה. */
  if (e && e.parameter && e.parameter.recount) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied',
        message: READ_KEY ? 'סיסמה שגויה'
                          : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
    }
    try {
      recount_(); recountLearn_();
      return reply_(e, { status: 'ok' });
    } catch (err3) {
      return reply_(e, { status: 'error', message: String(err3) });
    }
  }

  /* ---- מחיקה ----
     דרך doGet ולא doPost, ובכוונה. כתיבה מהאפליקציה יוצאת
     ב-no-cors ומחזירה תשובה אטומה: אי אפשר לדעת ממנה אם היא
     הצליחה. לכתיבה רגילה זה נסבל, כי הקריאה הבאה מאמתת.
     למחיקה זה אינו נסבל — "כנראה נמחק" הוא בדיוק מה שהפך
     "פורסם" לחודש של מתגים שאיש לא ראה. doGet עונה תשובה
     שאפשר לקרוא, ולכן המסך יודע כמה שורות באמת נמחקו.

     הסיסמה נבדקת כאן שוב, ולא רק ב-doPost. */
  if (e && e.parameter && (e.parameter.clear || e.parameter.delrow)) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied',
        message: READ_KEY ? 'סיסמה שגויה'
                          : 'לא נקבעה סיסמה בסקריפט (READ_KEY) — מחיקה חסומה' });
    }
    var dres;
    try {
      dres = e.parameter.clear
        ? clearTab_(String(e.parameter.clear), e.parameter.ss)
        : delRows_(String(e.parameter.delrow), String(e.parameter.col || ''),
                   parse_(e.parameter.vals), e.parameter.ss);
    } catch (err) { dres = { status: 'error', message: String(err) }; }
    return reply_(e, dres);
  }

  /* ---- קריאת לשונית ----
     אנשי הקשר של הישיבות הם טלפונים של אנשים אחרים, ולכן הם לא
     יושבים בקוד ולא בגיליון שמשותף "לכל מי שיש לו הקישור".
     הסקריפט הזה רץ בחשבון שלך, ולכן הוא יכול לקרוא לשונית פרטית
     לגמרי. ss אופציונלי — בלעדיו קוראים מהגיליון שאליו הסקריפט
     מחובר.

     getDisplayValues ולא getValues: מספר טלפון שמתחיל באפס הוא
     מספר בעיני הגיליון, ו-getValues היה מחזיר 527997944. */
  if (e && e.parameter && e.parameter.read) {
    var want = String(e.parameter.read), rd;

    /* לשונית פרטית — רק עם הסיסמה, ורק אם נקבעה סיסמה בכלל.
       הבדיקה כאן ולא אצל הקורא: מה שמגן על הרשימה חייב לרוץ
       בצד שאיש אינו יכול לשנות. */
    /* `ss` מפורש דורש סיסמה גם ללשונית שאינה ברשימה הפרטית.
       בלעדיו היה אפשר לבקש לשונית "רגילה" מתוך הגיליון הפרטי
       ולעקוף את השמירה כולה — די היה בכך שהיא לא נקראת בשם
       שברשימה. */
    if ((PRIVATE_TABS.indexOf(want) >= 0 || e.parameter.ss) &&
        (!READ_KEY || String((e.parameter.key || '')) !== READ_KEY)) {
      return reply_(e, { status: 'error', tab: want,
        message: READ_KEY ? 'סיסמת קריאה שגויה'
                          : 'לא נקבעה סיסמת קריאה בסקריפט (READ_KEY)' });
    }

    try {
      /* אותו ניתוב של הכתיבה: לשונית פרטית נקראת מהגיליון
         הפרטי, בלי שהקורא יידע את המזהה שלו. */
      var pid = PRIVATE_TABS.indexOf(want) >= 0 ? PRIVATE_ID : '';
      var id  = e.parameter.ss || pid;
      var book = id ? SpreadsheetApp.openById(String(id))
                    : SpreadsheetApp.getActiveSpreadsheet();
      var tab = book.getSheetByName(want);
      rd = { status: 'ok', tab: want,
             rows: tab && tab.getLastRow() ? tab.getDataRange().getDisplayValues() : [] };
    } catch (err) {
      rd = { status: 'error', message: String(err) };
    }
    return reply_(e, rd);
  }

  /* `private` הוא התשובה לשאלה היחידה שאי אפשר לראות מבחוץ:
     האם יש לאן לכתוב פרטים אישיים. כשהוא כבוי, שם של תלמיד
     ייכתב לגיליון שמשותף לצפייה — ובלי הדיווח הזה איש לא היה
     יודע, כי הכתיבה מצליחה בשני המקרים. */
  var out = { status: 'ok', version: SCRIPT_VERSION, tabs: [],
              privateOn: !!PRIVATE_ID, readKeyOn: !!READ_KEY,
              privSrc: propSrc_('PRIVATE_ID', PRIVATE_ID_FALLBACK),
              keySrc:  propSrc_('READ_KEY',   READ_KEY_FALLBACK),
              autoOn:  hasTrigger_() };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    out.sheet = ss.getName();
    /* המזהה, ולא רק השם. זו התקלה שאי אפשר לראות בעין: הסקריפט
       מחובר לגיליון אחד, האפליקציה קוראת מגיליון אחר, וכל
       "פרסום" מצליח — אל הגיליון הלא נכון. השם לבדו אינו מספיק,
       כי לשני גיליונות יכול להיות אותו שם. */
    out.sheetId = ss.getId();
    /* גם הגיליון הפרטי — אבל רק למי שיש לו הסיסמה. בלעדיה זו
       הייתה דרך לגלות מבחוץ כמה תלמידים רשומים ומה שמות
       הלשוניות שבהן הם יושבים. */
    if (READ_KEY && e && e.parameter && String(e.parameter.key || '') === READ_KEY) {
      out.privId = PRIVATE_ID;
      if (PRIVATE_ID) {
        var ps = SpreadsheetApp.openById(String(PRIVATE_ID));
        out.privSheet = ps.getName();
        out.privTabs = ps.getSheets().map(function (t) {
          return { name: t.getName(), rows: Math.max(0, t.getLastRow() - 1) };
        });
      }
    }
    out.tabs = ss.getSheets().map(function (s) {
      return { name: s.getName(), rows: Math.max(0, s.getLastRow() - 1) };
    });
  } catch (err) { out.status = 'no-sheet'; out.message = String(err); }

  return reply_(e, out);
}

/* JSON רגיל, או JavaScript כשהתבקש callback. הסיבה: Apps Script
   מפנה את /exec לדומיין אחר, ודפדפנים חוסמים לעיתים את הקריאה
   הרגילה בגלל CORS. טעינה כתגית <script> עוקפת את זה תמיד. */
function reply_(e, out) {
  var cb = e && e.parameter && e.parameter.callback;
  if (cb && /^[A-Za-z_$][\w$]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(out);
}

/* ---------- הליבה ----------
   `cols` הוא מערך מסודר של [כותרת, ערך]. הכותרות הן מקור האמת:
   כותרת שכבר קיימת בשורה 1 מקבלת את הערך בעמודה שלה, וכותרת
   חדשה נוספת בסוף. כך שדה חדש באפליקציה מייצר עמודה חדשה לבדו,
   בלי לגעת כאן ובלי לשבש שורות שכבר נכתבו. */
function appendCols_(tab, cols, ssId) {
  var sh = sheet_(tab, ssId);
  var head = headers_(sh);
  var row = [];

  /* "תאריך" תמיד ראשונה — שעון השרת ולא שעון המכשיר */
  put_(row, idx_(sh, head, 'תאריך'), new Date());
  cols.forEach(function (c) {
    if (!c || c[0] == null || c[0] === '') return;
    put_(row, idx_(sh, head, String(c[0])), cell_(c[1]));
  });

  for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
  sh.appendRow(row);
  if (tab === JOIN_TAB)  recount_();
  if (tab === LEARN_TAB) recountLearn_();
  return json_({ status: 'success', tab: tab, columns: row.length });
}

/* ============================================================
   מונה המצטרפים.
   ============================================================
   תלמיד ששוקל להצטרף רוצה לדעת דבר אחד: מי כבר בפנים אצלו
   בישיבה. אבל רשימת המצטרפים יושבת בגיליון סגור מאחורי סיסמה,
   ואי אפשר למסור אותה לטלפון של תלמיד בשביל מספר.

   לכן נשמר כאן **מספר בלבד**: לשונית ציבורית עם קוד ישיבה
   ומספר, בלי שם אחד ובלי טלפון אחד. הטלפון של התלמיד קורא רק
   אותה, ומעולם אינו נוגע בגיליון הסגור.

   ספירה מחדש בכל הרשמה, ולא הגדלה באחד: תלמיד שתיקן את פרטיו
   שולח שורה נוספת עם אותו מזהה, ומונה שרק גדל היה סופר אותו
   פעמיים — ולנצח, כי אין דרך לתקן מספר שכבר טיפס. */
var JOIN_TAB   = 'לומדים';
var COUNT_TAB  = 'מונים';
var LEARN_TAB  = 'לימוד';        /* פרטי — שורה לכל סימון לימוד */
var LCOUNT_TAB = 'מוני-לימוד';   /* ציבורי — מספרים בלבד */

/* ערכים ייחודיים בעמודה, מקובצים לפי עמודות מפתח. משמש את שני
   המונים, ולכן הכלל של "אותו מזהה נספר פעם אחת" נכתב פעם אחת. */
function tally_(rows, keyNames, idName) {
  var head = rows[0], ix = {}, iId = -1;
  for (var i = 0; i < head.length; i++) {
    var h = String(head[i]).trim();
    if (keyNames.indexOf(h) >= 0) ix[h] = i;
    if (h === idName) iId = i;
  }
  for (var k = 0; k < keyNames.length; k++) if (ix[keyNames[k]] === undefined) return null;

  var seen = {}, n = {}, order = [];
  for (var r = 1; r < rows.length; r++) {
    var parts = [], ok = true;
    for (var j = 0; j < keyNames.length; j++) {
      var v = String(rows[r][ix[keyNames[j]]] || '').trim();
      if (!v) { ok = false; break; }
      parts.push(v);
    }
    if (!ok) continue;
    var key = parts.join('\u0001');
    /* אותו אדם באותו מפתח נספר פעם אחת: תלמיד שתיקן פרטים או
       פתח את הדף פעמיים שלח שורה נוספת, ומונה שרק גדל היה
       סופר אותו שוב — ולתמיד, כי אין דרך להוריד מספר שטיפס. */
    if (iId >= 0) {
      var who = String(rows[r][iId] || '').trim();
      if (who) {
        var u = key + '\u0001' + who;
        if (seen[u]) continue;
        seen[u] = 1;
      }
    }
    if (!(key in n)) { n[key] = 0; order.push(key); }
    n[key]++;
  }
  return { order: order, n: n };
}

/* כותב לשונית ציבורית מחדש בשלמותה. מספרים בלבד. */
function writeCount_(tab, cols, rows) {
  var out = sheet_(tab);
  var last = out.getLastRow();
  if (!last) headRow_(out, cols);
  else if (last > 1) out.getRange(2, 1, last - 1, Math.max(cols.length, out.getLastColumn())).clearContent();
  if (rows.length) out.getRange(2, 1, rows.length, cols.length).setValues(rows);
}

/* מי סיים איזה דף, לפי מסלול · שבוע · ישיבה. שום שם ושום טלפון
   אינם יוצאים מהגיליון הסגור — רק ספירה. */
function recountLearn_() {
  try {
    var src = sheet_(LEARN_TAB);
    if (!src) return;
    if (src.getLastRow() < 2) {
      writeCount_(LCOUNT_TAB, ['מסלול', 'שבוע', 'קוד ישיבה', 'סיימו'], []);
      return;
    }
    var t = tally_(src.getDataRange().getDisplayValues(),
                   ['מסלול', 'שבוע', 'קוד ישיבה'], 'מזהה');
    if (!t) return;
    writeCount_(LCOUNT_TAB, ['מסלול', 'שבוע', 'קוד ישיבה', 'סיימו'],
      t.order.map(function (k) {
        var p = k.split('\u0001');
        return [p[0], p[1], p[2], t.n[k]];
      }));
  } catch (err) {}
}

/* מסמן מוסד כמשתתף בתשפ"ז — עמודה D בלשונית המוסדות.

   הלשונית הזו היא מקור האמת של הרשימה, ולכן סימון כאן נראה
   אצל **כל** מי שפותח את האפליקציה, ולא רק אצל מי שנרשם.
   הרכז יכול עדיין לכבות ידנית: המתג בניהול ← מוסדות מתפרסם
   כשכבה מעל הגיליון וגובר עליו. */
/* ============================================================
   קוד הגישה של המוסד.
   ============================================================
   ראש חטיבה צריך לראות מי מהתלמידים שלו לומד. זה אומר שמות של
   קטינים, ולכן `board.html?inst=avir` אינו יכול להספיק: שם
   הישיבה הוא מחרוזת שאפשר לנחש, והלוח נשלח בוואטסאפ ומועבר
   הלאה.

   **הקוד עצמו הוא ההרשאה.** הוא נוצר פעם אחת למוסד, מוטמע
   בקישור האישי שלו, ומצורף לכל בקשה. הסקריפט מוודא שהוא תואם
   למוסד המבוקש — ומחזיר את התלמידים של אותו מוסד בלבד.

   שלוש החלטות:

   1. **הרשאה לפי מוסד ולא לפי אדם.** בישיבה יש יותר מאיש צוות
      אחד, ומי שנרשם אינו בהכרח מי שינהל בפועל. קוד שאפשר
      להעביר הלאה פותר את זה בלי הרשמה שנייה ובלי סיסמאות.

   2. **READ_KEY אינו מעורב.** הוא של הרכז, והוא פותח את הכל.
      קוד המוסד פותח מוסד אחד.

   3. **שמות פרטיים בלבד יוצאים מכאן.** בלי משפחה ובלי טלפון.
      קישור שדלף חושף "יונתן, ז׳, לומד לבד" — לא רשימת קטינים
      שאפשר ליצור איתם קשר.
   ============================================================ */
var CODE_TAB = 'קודים';

/* בלי 0/O/1/l — הקוד מוקלד ביד כשהקישור אבד. */
var CODE_ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
function newCode_() {
  var s = '';
  for (var i = 0; i < 6; i++)
    s += CODE_ABC.charAt(Math.floor(Math.random() * CODE_ABC.length));
  return s;
}

function codeRows_() {
  var sh = sheet_(CODE_TAB);
  if (!sh.getLastRow()) headRow_(sh, ['קוד ישיבה', 'קוד גישה', 'נוצר']);
  return sh;
}
function getCode_(inst) {
  var sh = codeRows_();
  if (sh.getLastRow() < 2) return '';
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues();
  for (var i = 0; i < v.length; i++)
    if (String(v[i][0]).trim() === String(inst).trim()) return String(v[i][1]).trim();
  return '';
}
function setCode_(inst, code) {
  var sh = codeRows_();
  inst = String(inst || '').trim();
  if (!inst) return '';
  code = String(code || '').trim() || newCode_();
  var last = sh.getLastRow();
  if (last >= 2) {
    var v = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (var i = 0; i < v.length; i++) {
      if (String(v[i][0]).trim() !== inst) continue;
      sh.getRange(i + 2, 2).setValue(code);
      sh.getRange(i + 2, 3).setValue(new Date());
      return code;
    }
  }
  sh.appendRow([inst, code, new Date()]);
  return code;
}
/* בהרשמה: יוצרים אם אין, ולא דורסים אם יש. ראש חטיבה שנרשם שוב
   לא אמור לשבור קישור שכבר הופץ לצוות שלו. */
function ensureCode_(inst, want) {
  var have = getCode_(inst);
  if (have) return have;
  return setCode_(inst, want);
}

/* הלוח של מוסד אחד. שמות פרטיים, שכבה, מסגרת, ואילו שבועות
   סומנו — ולא יותר מזה. */
function boardData_(inst, k) {
  inst = String(inst || '').trim();
  var code = getCode_(inst);
  if (!code) return { status: 'nocode',
    message: 'לא הוגדר קוד גישה למוסד הזה. בקשו מרכז התוכנית קישור אישי.' };
  if (String(k || '').trim() !== code) return { status: 'denied',
    message: 'הקוד אינו מתאים לישיבה הזו.' };

  /* מי סימן מה. הסקריפט אינו יודע מהו "השבוע" — הלוח יודע,
     ולכן כאן חוזרים כל השבועות והחישוב נשאר בצד אחד. */
  var done = {};
  try {
    var ls = sheet_(LEARN_TAB);
    if (ls.getLastRow() > 1) {
      var lr = ls.getDataRange().getDisplayValues(), lh = lr[0], li = {};
      for (var a = 0; a < lh.length; a++) li[String(lh[a]).trim()] = a;
      for (var b = 1; b < lr.length; b++) {
        if (String(lr[b][li['קוד ישיבה']] || '').trim() !== inst) continue;
        var id = String(lr[b][li['מזהה']] || '').trim();
        if (!id) continue;
        var tag = String(lr[b][li['מסלול']] || '') + '|' + String(lr[b][li['שבוע']] || '');
        (done[id] = done[id] || {})[tag] = 1;
      }
    }
  } catch (e) {}

  var out = [];
  try {
    var js = sheet_(JOIN_TAB);
    if (js.getLastRow() > 1) {
      var jr = js.getDataRange().getDisplayValues(), jh = jr[0], ji = {};
      for (var c = 0; c < jh.length; c++) ji[String(jh[c]).trim()] = c;
      var cell = function (r, name) {
        return ji[name] === undefined ? '' : String(r[ji[name]] || '').trim();
      };
      var byId = {}, order = [];
      for (var d = 1; d < jr.length; d++) {
        var row = jr[d];
        if (cell(row, 'קוד ישיבה') !== inst) continue;
        var pid = cell(row, 'מזהה');
        if (!pid) continue;
        if (!(pid in byId)) order.push(pid);
        byId[pid] = {
          id: pid,
          first: cell(row, 'שם'),
          grade: cell(row, 'שכבה'),
          way:   cell(row, 'מסגרת'),
          role:  cell(row, 'תפקיד'),
          with:  cell(row, 'שם ההורה'),        /* שם פרטי בלבד */
          weeks: []
        };
      }
      order.forEach(function (pid) {
        var p = byId[pid];
        for (var t in (done[pid] || {})) p.weeks.push(t);
        out.push(p);
      });
    }
  } catch (e2) {}

  return { status: 'ok', inst: inst, students: out };
}

function markJoined_(code) {
  try {
    code = String(code || '').trim();
    if (!code || code === 'other') return;
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INST_TAB);
    if (!sh || sh.getLastRow() < 2) return;
    var col = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]).trim() !== code) continue;
      /* כבר מסומן — לא כותבים שוב, כדי לא לגעת בגיליון על כל
         עדכון של הרשמה קיימת. */
      var cur = String(sh.getRange(i + 2, 4).getDisplayValue()).trim().toUpperCase();
      if (cur !== 'TRUE' && cur !== 'כן') sh.getRange(i + 2, 4).setValue('TRUE');
      return;
    }
  } catch (err) {}      /* סימון שנכשל לא יפיל הרשמה */
}

function recount_() {
  try {
    var src = sheet_(JOIN_TAB);
    /* לשונית ריקה אינה "אין מה לעשות" אלא **אפס**. יציאה מוקדמת
       כאן השאירה את המונים הישנים בגיליון לנצח: שבעה תלמידים
       נמחקו, מסך המשתתפים התרוקן, והלוח המשיך להראות שבעה. */
    if (!src) return;
    if (src.getLastRow() < 2) {
      writeCount_(COUNT_TAB, ['קוד ישיבה', 'מצטרפים', 'שכבות', 'מסגרות'], []);
      return;
    }
    var rows = src.getDataRange().getDisplayValues();

    /* סך המצטרפים לכל ישיבה */
    var t = tally_(rows, ['קוד ישיבה'], 'מזהה');
    if (!t) return;

    /* ופילוח — לפי שכבה ולפי מסגרת. הלוח של ראש החטיבה מציג
       אותו, וזה עדיין מספרים בלבד: מי שרואה "ח׳ — 11" אינו
       יודע מי אחד עשר. */
    var byG = tally_(rows, ['קוד ישיבה', 'שכבה'],  'מזהה');
    var byW = tally_(rows, ['קוד ישיבה', 'מסגרת'], 'מזהה');
    var pack = function (t2) {
      var out = {};
      if (!t2) return out;
      t2.order.forEach(function (k) {
        var p = k.split('\u0001');
        if (!out[p[0]]) out[p[0]] = [];
        out[p[0]].push(p[1] + ':' + t2.n[k]);
      });
      return out;
    };
    var g = pack(byG), w = pack(byW);

    writeCount_(COUNT_TAB, ['קוד ישיבה', 'מצטרפים', 'שכבות', 'מסגרות'],
      t.order.map(function (c) {
        return [c, t.n[c], (g[c] || []).join(' · '), (w[c] || []).join(' · ')];
      }));
  } catch (err) {}          /* מונה שנכשל לא יפיל הרשמה של תלמיד */
}

/* טבלת הגדרות (כרגע: המלל) — נכתבת מחדש בשלמותה בכל פרסום,
   אחרת נוסח שנמחק היה נשאר בגיליון וממשיך לדרוס את הקוד. */
function writeTable_(tab, cols, rows, ssId) {
  var sh = sheet_(tab, ssId);
  if (!sh.getLastRow()) headRow_(sh, cols);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  if (rows.length) {
    var w = cols.length;
    sh.getRange(2, 1, rows.length, w).setValues(rows.map(function (r) {
      var out = [];
      for (var i = 0; i < w; i++) out.push(r[i] === undefined ? '' : cell_(r[i]));
      return out;
    }));
  }
  return json_({ status: 'success', tab: tab, count: rows.length });
}

/* ============================================================
   ניקוי לשונית: שורת הכותרת נשארת, כל השאר נמחק.

   הכותרת נשארת בכוונה. לשונית בלי כותרת נראית לאפליקציה כמו
   לשונית שלא נוצרה מעולם, וגם מאבדת את הצורה שאליה נכתבות
   שורות חדשות — כלומר "ניקוי" היה הופך בשקט להרס.

   מחזיר את מספר השורות שנמחקו, כדי שהצד השני יוכל לאמת. אחרי
   הפרסום שדיווח על הצלחה שלא קרתה, שום פעולה הרסנית כאן אינה
   מסתמכת על "כנראה הצליח".
   ============================================================ */
function clearTab_(tab, ssId) {
  var id = ssId || (PRIVATE_TABS.indexOf(tab) >= 0 ? PRIVATE_ID : '');
  var ss = id ? SpreadsheetApp.openById(String(id))
              : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh) return { status: 'error', message: 'אין לשונית בשם ' + tab };
  var last = sh.getLastRow();
  if (last < 2) return { status: 'success', tab: tab, removed: 0, left: 0 };
  sh.deleteRows(2, last - 1);
  reTally_(tab);
  return { status: 'success', tab: tab,
           removed: last - 1, left: Math.max(0, sh.getLastRow() - 1) };
}

/* מחיקת שורות לפי ערך בעמודה — שורה אחת או כמה, בלי לגעת בשאר.
   `col` הוא שם הכותרת ולא מספר: מיקום העמודה משתנה כשנוסף שדה
   חדש באפליקציה, והשם אינו משתנה.

   המחיקה מלמטה למעלה, אחרת כל מחיקה מזיזה את מה שמתחתיה
   והאינדקסים הבאים מצביעים על השורה הלא נכונה. */
function delRows_(tab, col, vals, ssId) {
  var id = ssId || (PRIVATE_TABS.indexOf(tab) >= 0 ? PRIVATE_ID : '');
  var ss = id ? SpreadsheetApp.openById(String(id))
              : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh) return { status: 'error', message: 'אין לשונית בשם ' + tab };
  var last = sh.getLastRow();
  if (last < 2) return { status: 'success', tab: tab, removed: 0 };

  var data = sh.getDataRange().getDisplayValues();
  var head = data[0].map(function (h) { return String(h).trim(); });
  var ci = head.indexOf(String(col));
  if (ci < 0) return { status: 'error', message: 'אין עמודה בשם ' + col };

  var want = {};
  (vals || []).forEach(function (v) { want[String(v).trim()] = 1; });
  var hit = [];
  for (var r = 1; r < data.length; r++) {
    if (want[String(data[r][ci]).trim()]) hit.push(r + 1);
  }
  for (var i = hit.length - 1; i >= 0; i--) sh.deleteRow(hit[i]);
  reTally_(tab);
  return { status: 'success', tab: tab, removed: hit.length,
           left: Math.max(0, sh.getLastRow() - 1) };
}

/* המונים הציבוריים נגזרים מהלשוניות הפרטיות, ולכן מחיקה חייבת
   לספור מחדש.

   בלי זה תלמיד שנמחק נעלם ממסך המשתתפים ונשאר בלוח — המספר
   בלשונית "מונים" נכתב בהרשמה ואיש לא נגע בו מאז. זה בדיוק
   קרה: שבעה נמחקו, ובלוח הם המשיכו להופיע. */
/* ============================================================
   הרצה אוטומטית — כדי שאף אחד לא יצטרך ללחוץ על כלום.

   המונים נספרים מחדש בכל כתיבה ובכל מחיקה, וזה מכסה את מה
   שעובר דרך האפליקציה. מה שאינו עובר דרכה — שורה שנמחקה ביד
   בגיליון, עמודה שתוקנה, ייבוא — משאיר מספר תלוי באוויר.

   טריגר שעתי סוגר את זה. **מריצים את הפונקציה הזו פעם אחת**
   מתוך עורך Apps Script (בוחרים אותה ברשימה ולוחצים Run), והיא
   מתקינה את עצמה. הרצה חוזרת אינה מכפילה — היא מוחקת קודם.
   ============================================================ */
function setupTriggers() {
  var all = ScriptApp.getProjectTriggers();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'autoRecount') ScriptApp.deleteTrigger(all[i]);
  }
  ScriptApp.newTrigger('autoRecount').timeBased().everyHours(1).create();
  return 'הטריגר הותקן · ספירה מחדש כל שעה';
}
function autoRecount() { recount_(); recountLearn_(); }

/* האם הטריגר מותקן — כדי ש"בדיקת חיבור" תוכל לומר את זה, ולא
   נצטרך לנחש אם ההתקנה עברה. */
function hasTrigger_() {
  try {
    var all = ScriptApp.getProjectTriggers();
    for (var i = 0; i < all.length; i++)
      if (all[i].getHandlerFunction() === 'autoRecount') return true;
  } catch (e) {}
  return false;
}

function reTally_(tab) {
  try {
    if (tab === JOIN_TAB)  recount_();
    if (tab === LEARN_TAB) recountLearn_();
  } catch (e) {}
}

/* ---------- עזר ---------- */
function parse_(v) {
  if (v == null || v === '') return [];
  return typeof v === 'string' ? JSON.parse(v) : v;
}

/* מספר טלפון שמתחיל באפס — גוגל מוחקת לו את האפס. גרש מוביל
   מכריח אותה להתייחס אליו כטקסט. */
function cell_(v) {
  if (v == null) return '';
  if (typeof v === 'string' && /^0\d{7,}$/.test(v.replace(/[-\s]/g, ''))) return "'" + v;
  return v;
}

function headers_(sh) {
  if (!sh.getLastRow() || !sh.getLastColumn()) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
           .map(function (h) { return String(h).trim(); });
}

/* מאתר עמודה לפי הכותרת, ויוצר אותה אם אינה קיימת */
function idx_(sh, head, name) {
  for (var i = 0; i < head.length; i++) if (head[i] === name) return i;
  head.push(name);
  var col = head.length;
  sh.getRange(1, col).setValue(name)
    .setFontWeight('bold').setBackground('#17468F').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  return col - 1;
}

function put_(row, i, v) {
  while (row.length <= i) row.push('');
  row[i] = v;
}

function headRow_(sh, cols) {
  sh.getRange(1, 1, 1, cols.length).setValues([cols])
    .setFontWeight('bold').setBackground('#17468F').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
}

function sheet_(tab, ssId) {
  /* מפורש גובר, ואחריו הניתוב לפי שם הלשונית. בלי הניתוב הזה כל
     כתיבה של פרטים אישיים הייתה תלויה בכך שהצד ששלח אותה ידע
     לאן — והתלמיד אינו יודע. */
  var id = ssId || (PRIVATE_TABS.indexOf(tab) >= 0 ? PRIVATE_ID : '');
  var ss = id ? SpreadsheetApp.openById(String(id))
              : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(tab) || ss.insertSheet(tab);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
