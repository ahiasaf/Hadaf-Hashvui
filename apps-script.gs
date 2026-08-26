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
   הדבקה של הקובץ הזה **מוחקת את שני הערכים שמילאת בו**:
   PRIVATE_ID ו-READ_KEY. הקובץ שבריפו מגיע איתם ריקים, תמיד.

   ריק אינו נראה כתקלה. הכתיבה ממשיכה להצליח — רק שהיא נוחתת
   בגיליון הראשי, זה שמשותף לצפייה ושהמזהה שלו יושב בקוד
   האפליקציה. כלומר שמות וטלפונים של תלמידים והורים, בגלוי.
   ו-READ_KEY ריק סוגר את מסך המשתתפים בלי לומר למה.

   לכן, לפני שמוחקים את מה שבעורך:
   1. גללו לשתי השורות  var PRIVATE_ID = '...';
                        var READ_KEY   = '...';
      והעתיקו לצד את מה שבין הגרשיים.
   2. הדביקו את הקובץ החדש.
   3. החזירו את שני הערכים לאותן שתי שורות, ושמרו.
   4. Deploy ← Manage deployments ← עריכה ← **New version**.
      "New deployment" ייתן כתובת חדשה שהאפליקציה אינה מכירה,
      וכל פרסום ימשיך ללכת לשום מקום.
   5. ניהול ← הגדרות ← "בדיקת חיבור". הוא אומר את שלושתם:
      את מספר הגרסה, אם הגיליון הפרטי מוגדר, ואם יש סיסמת
      קריאה. שלושתם ✓ — סיימת.

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
var SCRIPT_VERSION = 12;

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

   ריק = הכל נכתב לגיליון הראשי, כלומר בגלוי. */
var PRIVATE_ID = '';

/* לשוניות שיש בהן פרטים אישיים. אלה נכתבות לגיליון הפרטי.

   "הרשמות" ו"חידות" נוספו כאן מאוחר, וזה היה חור: הרשמה של
   ראש חטיבה נושאת את שמו ואת הטלפון שלו, ותשובה לחידה נושאת
   שם וטלפון של תלמיד — ושתיהן נכתבו לגיליון הראשי, שמשותף
   לצפייה ושהמזהה שלו יושב בקוד של האפליקציה.

   שורות שכבר נכתבו לשם נשארות שם. כדאי להעביר אותן ידנית
   לגיליון הפרטי ולמחוק אותן מהראשי. */
var PRIVATE_TABS = ['לומדים', 'לימוד', 'הרשמות', 'חידות'];

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

   ריק = קריאה של לשונית פרטית נדחית תמיד. זו ברירת המחדל
   הבטוחה: עדיף שמסך המשתתפים יהיה ריק מאשר שהרשימה תהיה
   פתוחה. כתיבה אינה מושפעת — תלמיד ממשיך להירשם כרגיל. */
var READ_KEY = '';

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

    /* ---- הצורות הישנות. נשארות כדי שמכשיר שמחזיק גרסה ישנה
            של האפליקציה במטמון לא יאבד הרשמה. ---- */
    /* מוסד שנרשם מסומן מיד כ"בפנים" ברשימת המוסדות, וכך הוא
       מופיע בעמוד הראשי אצל כולם בלי שאיש יגע במתג. */
    if (d.action === 'register') markJoined_(d.code);
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
    if (PRIVATE_TABS.indexOf(want) >= 0 &&
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
              privateOn: !!PRIVATE_ID, readKeyOn: !!READ_KEY };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    out.sheet = ss.getName();
    /* המזהה, ולא רק השם. זו התקלה שאי אפשר לראות בעין: הסקריפט
       מחובר לגיליון אחד, האפליקציה קוראת מגיליון אחר, וכל
       "פרסום" מצליח — אל הגיליון הלא נכון. השם לבדו אינו מספיק,
       כי לשני גיליונות יכול להיות אותו שם. */
    out.sheetId = ss.getId();
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
    if (!src || src.getLastRow() < 2) return;
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
    if (!src || src.getLastRow() < 2) return;
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
