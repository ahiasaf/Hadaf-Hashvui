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
   (גרסאות 4, 5 ו-6 כן דרשו פריסה נוספת, כי הן פותחות יכולת חדשה
   ואינן משנות נתונים: 4 — קריאת קבצים מהדרייב בשביל הסטודיו,
   5 — קריאת לשונית פרטית בשביל מוקד השיחות, 6 — עמוד הצוות
   (team.html): שתי פעולות חדשות, `team`/`teamlog`, ושתי הגדרות
   חדשות שממלאים פעם אחת — CONTACTS_ID ו-TEAM_KEY, ראו ליד
   prop_('CONTACTS_ID', …) למטה. הכלל נשאר בתוקף לכל מה שנוגע
   לכתיבה לגיליון.)

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
var SCRIPT_VERSION = 52;

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

   ריק = כל כתיבה או קריאה של לשונית פרטית נכשלת בשגיאה (privId_) —
   לעולם לא נופלת לגיליון הראשי, שמשותף לצפייה. */
var PRIVATE_ID_FALLBACK = '';

/* לשוניות שיש בהן פרטים אישיים. אלה נכתבות לגיליון הפרטי.

   "הרשמות" ו"חידות" נוספו כאן מאוחר, וזה היה חור: הרשמה של
   ראש חטיבה נושאת את שמו ואת הטלפון שלו, ותשובה לחידה נושאת
   שם וטלפון של תלמיד — ושתיהן נכתבו לגיליון הראשי, שמשותף
   לצפייה ושהמזהה שלו יושב בקוד של האפליקציה.

   שורות שכבר נכתבו לשם נשארות שם. כדאי להעביר אותן ידנית
   לגיליון הפרטי ולמחוק אותן מהראשי. */
/* `התראות` — המנויים לקבלת התראה. **פרטית, ובאמת:** מנוי הוא
   כתובת לדחוף למכשיר מסוים, ומי שמחזיק בו יכול להקפיץ הודעה
   לטלפון של תלמיד. זה לא "עוד טור בגיליון". */
/* `נשלחו` — מה שכבר יצא: מפתח אחד לכל שליחה מתוזמנת שהצליחה.
   הוא מה שמונע שליחה כפולה כשהרצה משלימה משבצות שנפספסו, והוא
   נושא מזהי מכשירים — ולכן פרטי כמו השאר. ראו tools/sched.js. */
var PRIVATE_TABS = ['לומדים', 'לימוד', 'הרשמות', 'חידות', 'קודים', 'התראות',
                    'הודעות', 'תקועים', 'תזכורות', 'נשלחו',
                    /* הלימוד המשותף — אבא ובן. שמות וטלפונים, ולכן פרטית. */
                    'זוגות',
                    /* שני אנשי קשר שונים נרשמו לאותו מוסד. ראו `flagRegConflict_`. */
                    'התנגשויות הרשמה',
                    /* מי ביקש התראה כשדף נעול ייפתח — מנוי למכשיר, ולכן
                       פרטית כמו `התראות`. ראו `wait` ב-ghFire_. */
                    'ממתינים לדף',
                    /* מי קיבל את אזור הניהול האישי, ומה הרכז החליט עליו.
                       שם וטלפון של איש צוות — פרטית. ראו `acc`. */
                    'גישה',
                    /* עמדת הלימוד: רשימת התלמידים של בית הספר, ומי נרשם
                       שלמד. שמות של קטינים — פרטית. ראו amda* ב-index.html. */
                    'תלמידי בית הספר', 'עמדת לימוד',
                    /* הטלפונים של תלמידי העמדה — לכפתור הוואטסאפ בניהול. */
                    'טלפוני תלמידים',
                    /* מי מהעמדה זוהה כתלמיד רשום באפליקציה, ואיזה דף
                       נרשם לו משם. ראו amdaSync_. */
                    'עמדה — שיוך',
                    /* שיעורי כיתה: השתתפות, ביטול תורה ומקומות — ורשימת השיעורים. */
                    'עמדה — סימונים', 'עמדה — שיעורים',
                    /* מי שהוסר מהרשימה — השורות שלו כפי שהיו, לשחזור.
                       ראו archivePerson_. */
                    'ארכיון',
                    /* המוקד: מצב כל ישיבה ויומן נוסף — אינסטינקט כותב,
                       האפליקציה רק קוראת. שמות אנשי קשר — פרטית.
                       ראו YSH_TABS_. */
                    'מצב ישיבות', 'הוספות יומן'];

/* ============================================================
   שתי הלשוניות של התמונה הגדולה במוקד.
   ============================================================
   אינסטינקט כותב אליהן ישירות בגיליון; האפליקציה קוראת אותן
   (עם הסיסמה) ואינה כותבת אליהן אף פעם. לכן:
   · `table` עליהן — נדחה. הוא מוחק ומחליף את כל הלשונית, ובדיוק
     כך נמחקו שורות שנכתבו ביד ב"יומן שיחות".
   · לשונית שעוד לא קיימת — נוצרת בקריאה הראשונה, עם הכותרות
     בלבד ובלי שורת נתונים, היכן שהאפליקציה קוראת אותה. */
var YSH_TABS_ = {
  'מצב ישיבות':  ['ישיבה', 'בקבוצה', 'בדף צוות', 'זום', 'דירוג', 'רכז פעיל', 'הערת מצב', 'עודכן'],
  'הוספות יומן': ['ישיבה', 'מתי', 'איש קשר', 'הערה', 'מזהה']
};

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

/* ============================================================
   עמוד הצוות — סיסמה נפרדת, וגיליון ידוע לשרת בלבד.
   ============================================================
   מוקד השיחות קורא וכותב "אנשי קשר"/"יומן שיחות" מגיליון שהמזהה
   שלו יושב על המכשיר של הרכז בלבד (CFG.contactsSheet) — בכוונה,
   כדי שהוא לא יהיה בקוד. עמוד הצוות (team.html) נפתח אצל הרב
   פלתי ואצל אלחנן, ואסור שהם ידעו את המזהה הזה — זה בדיוק מה
   שאמור להישאר חסוי אצלם. לכן יש לו עותק שרק השרת מכיר.

   READ_KEY אינה מתאימה כאן: היא פותחת את כל הלשוניות הפרטיות,
   כולל טלפונים של תלמידים והורים — הרשאת הרכז בלבד. עמוד הצוות
   חושף רק מה שסומן לחשיפה במפורש (לשונית 'תצוגת צוות' למטה),
   ולכן יש לו סיסמה נפרדת שאפשר למסור הלאה בלי לתת שום דבר מעבר
   לזה. ריק = עמוד הצוות סגור לגמרי — ברירת המחדל הבטוחה.

   למלא, פעם אחת: Apps Script ← הגדרות הפרויקט ← Script Properties
     CONTACTS_ID   מזהה גיליון אנשי הקשר (ריק = אותו גיליון כמו PRIVATE_ID)
     TEAM_KEY      סיסמה חדשה, שרק היא נמסרת לרב פלתי ולאלחנן */
var CONTACTS_ID  = prop_('CONTACTS_ID', '') || PRIVATE_ID;
var TEAM_KEY     = prop_('TEAM_KEY', '');
var TEAM_VIEW_TAB = 'תצוגת צוות';
var TEAM_LOG_TAB  = 'פעולות צוות';

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
  /* **כניסה לדף ההרשמה — לפני הנעילה, ולא אחריה.** כל שאר
     הכתיבות עומדות בתור אחת אחרי השנייה; אלפי כניסות שהיו נכנסות
     לאותו תור היו דוחקות החוצה את ההרשמות עצמן. ראו `hit_`. */
  try {
    var hd = JSON.parse(e.postData.contents);
    if (hd && hd.action === 'hit') return json_(hit_(hd));
    if (hd && hd.action === 'trail') return json_(trail_(hd));
  } catch (he) {}
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    /* פעם אחת, לפני כל כתיבה — ראו taanitShift_. */
    try {
      if (!PropertiesService.getScriptProperties().getProperty(TAANIT_SHIFT_KEY)) taanitShift_();
    } catch (se) {}
    try {
      if (!PropertiesService.getScriptProperties().getProperty(MEGILA_SHIFT_KEY)) megilaShift_();
    } catch (se2) {}
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
    /* תלמיד שנרשם מסמן את הישיבה שלו כ"בפנים".

       זו תנועה מלמטה: לא כל צוות ילחץ על "הצטרפות", ומי שקיבל
       את הקישור הכללי ובחר את הישיבה שלו מתוך הרשימה — הוכיח
       שיש שם לימוד. הצוות עדיין יכול להירשם רשמית אחר כך, ואז
       הוא ממלא גם את מספר התלמידים ואת המסכת; הסימון כאן רק
       מדליק את הלוח, ואינו גונב את מקומם. */
    /* ============================================================
       **מי רשאי לכתוב מה.**
       ============================================================
       כתובת הסקריפט גלויה בקוד הציבורי. עד עכשיו כל `row`/`table`
       עבר לכל לשונית — גם לפרטיות (קודים, התראות) — ו-`ss` מהלקוח
       גבר על הניתוב. `table` אחד היה מוחק לשונית שלמה.

       מעכשיו:
       · **בלי סיסמת הרכז** — רק `row`, רק ללשוניות של האפליקציה
         הציבורית (PUB_ROW), ורק לעמודות שלהן. עמודה אחרת נזרקת.
         `ss` מהלקוח — אסור. תפקיד "רכז" בלשונית ההתראות — אסור
         (אחרת כל אחד מקבל את ההתרעות של הרכז).
       · **עם הסיסמה** — הכול, כמו קודם.
       · **סיסמה לא הוגדרה בסקריפט** — המסלול הניהולי סגור, לא פתוח. */
    var wAdm = !!READ_KEY && String(d.key || '') === READ_KEY;
    if (d.action === 'row' || d.action === 'table') {
      if (!wAdm) {
        if (d.action !== 'row' || d.ss || !PUB_ROW[d.tab]) {
          return json_({ status: 'denied',
            message: READ_KEY ? 'כתיבה ללשונית ' + d.tab + ' דורשת את סיסמת הסקריפט'
                              : 'לא נקבעה סיסמה בסקריפט (READ_KEY) — הכתיבה חסומה' });
        }
        var pc = parse_(d.cols) || [], okc = PUB_ROW[d.tab], keep = [];
        for (var pi = 0; pi < pc.length; pi++) {
          var cn = pc[pi] && String(pc[pi][0] || '');
          if (okc.indexOf(cn) < 0) continue;
          if (d.tab === 'התראות' && cn === 'תפקיד' && String(pc[pi][1] || '').trim() === 'רכז') {
            return json_({ status: 'denied', message: 'רישום כרכז דורש את סיסמת הסקריפט' });
          }
          keep.push(pc[pi]);
        }
        d.cols = JSON.stringify(keep);
      }
    }
    if (d.action === 'row' && d.tab === JOIN_TAB) {
      markJoined_(instOf_(parse_(d.cols)), '');
      /* דורס שורה קיימת של אותו מזהה במקום להוסיף עוד אחת.
         ראו `upsertCols_` — זה מה שמפסיק את הכפילות שנוצרה
         מכל שליחה חוזרת (כשל שקט של no-cors, לחיצה כפולה,
         ניסיון-מחדש). */
      /* ואותו אדם ממכשיר אחר — נבלע בשורה שלו. ראו canonJoinCols_. */
      var jcols = parse_(d.cols);
      /* **קריאה אחת של "לומדים" לכל הרשמה, ולא שלוש.** עד עכשיו
         כל הרשמה קראה את כל הלשונית שלוש פעמים — לזיהוי כפילות,
         לחיפוש השורה, ולספירה מחדש — וכל זה בתוך הנעילה, כלומר
         כל קריאה האריכה את התור של כל מי שאחריו. ראו joinWrite_. */
      if (!d.ss) {
        try { return joinWrite_(jcols); } catch (jwe) {}
      }
      try { jcols = canonJoinCols_(jcols); } catch (cje) {}
      return upsertCols_(d.tab, jcols, 'מזהה', d.ss);
    }
    /* ---- הלשוניות של הדף האינטראקטיבי: רק עם סיסמה ----
       הסימונים, הפירוש, השקפים והחידות הם הנכס — שעות של עבודה.
       הם יושבים בגיליון הציבורי כי התלמיד קורא אותם בלי סיסמה, אבל
       **כתיבה** אליהם דרשה עד עכשיו רק את כתובת הסקריפט, שגלויה
       בקוד. פקודה אחת הייתה מוחקת הכל. מכאן: READ_KEY, כמו במחיקה.
       וכל יום, לפני הכתיבה הראשונה, נשמר עותק — ראו backupDaily_. */
    if ((d.action === 'row' || d.action === 'table') && !d.ss &&
        GUARD_TABS.indexOf(d.tab) >= 0) {
      /* כבר נבדק למעלה — הלשוניות האלה אינן ב-PUB_ROW. */
      backupDaily_();
    }
    if (d.action === 'row')   return appendCols_(d.tab, parse_(d.cols), d.ss);
    if (d.action === 'table' && YSH_TABS_.hasOwnProperty(d.tab)) {
      return json_({ status: 'denied',
        message: 'הלשונית ' + d.tab + ' נכתבת רק בגיליון — לא נדרסת מהאפליקציה' });
    }
    if (d.action === 'table') return writeTable_(d.tab, parse_(d.cols), parse_(d.rows), d.ss);

    /* ---- פעולת צוות: מי התקשר/שלח, ומתי ----
       עמוד הצוות (team.html) נפתח אצל הרב פלתי ואצל אלחנן, ואסור
       שהוא ידע את מזהה הגיליון הפרטי — בדיוק מה שהסיסמה הזו,
       הנפרדת מ-READ_KEY, קיימת כדי למנוע. הוספה בלבד, לא דריסה —
       שתי פעולות בו-זמנית לא ימחקו זו את זו, כמו כל יומן אחר כאן. */
    if (d.action === 'teamlog') {
      if (!TEAM_KEY || String(d.key || '') !== TEAM_KEY) return json_({ status:'denied' });
      return json_(appendCols_(TEAM_LOG_TAB, parse_(d.cols), CONTACTS_ID));
    }

    /* ---- העלאת שקף לריפו ----

       למה דרך הסקריפט ולא ישירות מהדפדפן: כתיבה ל-GitHub דורשת
       אסימון, ואסימון בדפדפן הוא אסימון שדלף. כאן הוא יושב
       במאפייני הסקריפט — בחשבון של הרכז, לא בקוד ולא בריפו
       (שהוא ציבורי) ולא במכשיר.

       ולמה בכלל: הממשק של GitHub להעלאת קבצים נכשל לא-אחת
       ("Something went really wrong"), ובטלפון במיוחד. זה מסלול
       שאינו תלוי בו.

       נדרשת READ_KEY בדיוק כמו במחיקה: כתובת הסקריפט יושבת בקוד
       הפומבי, וכתיבה פתוחה לריפו היא הרשאת דחיפה שנמסרה לעולם. */
    if (d.action === 'ghput') {
      if (!READ_KEY || String(d.key || '') !== READ_KEY) {
        return json_({ status: 'denied',
          message: READ_KEY ? 'סיסמה שגויה'
                            : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
      }
      return json_(ghPut_(d.path, d.b64, d.msg));
    }
    /* מחיקת קובץ לצמיתות מהריפו (ניהול ← הדף ← "מחיקה לצמיתות"),
       כדי לפנות מקום. אותה סיסמה, ורק בתיקיות של מה שהועלה —
       ראו ghDel_. */
    if (d.action === 'ghdel') {
      if (!READ_KEY || String(d.key || '') !== READ_KEY) {
        return json_({ status: 'denied',
          message: READ_KEY ? 'סיסמה שגויה'
                            : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
      }
      return json_(ghDel_(d.path, d.msg));
    }

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
    if (d.action === 'register') {
      markJoined_(d.code, (d.mas && d.mas.join) ? d.mas.join(',') : d.mas);
    }
    /* הקוד נוצר ברגע ההרשמה, ולא בבקשה נפרדת: הכתיבה יוצאת
       ב-no-cors ואין ממנה תשובה, ולכן הצד השני מייצר את הקוד
       ושולח אותו — וכך הוא כבר יודע אותו בלי לשאול. אם כבר יש
       קוד למוסד, הוא נשאר: קישור שהופץ לצוות לא נשבר. */
    if (d.action === 'register' && d.access) ensureCode_(d.code, d.access);
    /* ============================================================
       יותר מאיש קשר אחד נרשם לאותו מוסד.
       ============================================================
       "אחד או שניים ימלאו תחת אותה ישיבה — ראש הישיבה, ראש
       החטיבה, רכז תורה לשמה. אני צריך לדעת אם הנתונים תואמים
       או יש סתירה (20 גמרות מול 30)."

       לא חוסמים ולא דורסים — רק מסמנים, לצד מה שכל אחד מילא,
       כדי שאחיאסף יחליט בעצמו אם זו באמת סתירה. השוואה לפי
       "איש קשר": אותו שם ממש הוא עדכון רגיל (ראו `regDupWarn`
       בלקוח), ושם אחר הוא איש קשר שני שכדאי לבדוק. */
    if (d.action === 'register' && d.code && d.who) flagRegConflict_(d);
    if (d.action === 'register') return appendCols_('הרשמות', d.cols ? parse_(d.cols) : [
      ['ישיבה', d.inst], ['קוד', d.code], ['איש קשר', d.who], ['טלפון', d.phone],
      /* ראש החטיבה יושב ב"איש קשר" — שם העמודה הישן נשמר, כי
         שינוי שם מייצר עמודה חדשה וקוטע את מה שכבר נכתב.
         רכז הצוות הוא השני, ואינו חובה. */
      ['רכז צוות', d.who2 || ''], ['טלפון הרכז', d.phone2 || ''],
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

    if (d.action === 'texts' && !wAdm) {
      return json_({ status: 'denied', message: 'פרסום המלל דורש את סיסמת הסקריפט' });
    }
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
/* PUB_FILES:BEGIN — נוצר ע"י tools/pub-files.py מתוך links.js. לא לערוך ביד. */
var PUB_FILES = {
  '1-18OZtTIGmzlKPb2fJv8rXm4XAE_ZpM6':1,
  '1-cQnJAT1DD9zmvE1CLRV2uR79n07ZGmo':1,
  '100vQRoT_YHfoyC6oNfC_mUTZHy35s21f':1,
  '10DhhsbD2j2u73HY01-EE8RRajKUtP3w3':1,
  '10dmqoQ8Twn43CfH5aFeWAv-kMyN-IHvT':1,
  '10qUo0sAJzylaHfuDhzALuM2FFqrIMgxl':1,
  '11ciDuuX1E6O1Hq6PX3lPhvu8D7LL1K5T':1,
  '11iKHnQC_hraGLwaVPXm2MD09M-ler7P_':1,
  '121hHlNOexj9-zg1bSkVVs6dPEarnacY1':1,
  '128m2l5orxv8xceOXEf7NjiFsW1VG13BY':1,
  '128xURI4BuQKjZ1ZFm5c30sGMxv8kezSQ':1,
  '12JV4XoN5I9P5WUV4cs290cxy08AzBDyd':1,
  '131GnIwz3sED2s0QmtcLfwP2d3XyQkzVD':1,
  '132yi9Yh00oIzr1rC6rSXG-XoPYyat5fI':1,
  '13LcNESt9Efa5sodxITvKTKqnJmfi3x45':1,
  '14L6Wa3uU3aT99q_HaNtk6XDtNJEvjDPJ':1,
  '14ZB5Gu6mLSbnXwPL7TYJeZadQ6XCffB4':1,
  '17T4km4zHZjRJjhkjpKFMMlpdJubf8gl8':1,
  '1Aq_O1TKQ_GrsgNdBP-ahPbC6h6TIsPBn':1,
  '1BumonBVUFjQtoBgflCPhEu2vo9q6Kny6':1,
  '1Ci1a_icmOj6ovJbIUKVxWOrZSQz6feMV':1,
  '1D3w0z2R3W2b9w5YAJRS8xU9CnLTHSBXX':1,
  '1EElE25RV6kJG09SC7dcfl0TQZ2_zbshy':1,
  '1EIbTKQRQ6k6wMNxji_nlGy6_eiZ3uwW5':1,
  '1EmVybSpGB-K0vhDSq1AV1SSefJQoa7vi':1,
  '1FLkKW_k1jFjzf9vqxfuGW6zPNYkJGR3L':1,
  '1FTPKlaK28nfzJrWt-HdoYJsp4h4UVVOL':1,
  '1Gz-MoZW5jkhUZqvztNnnMipL0PnFkl9R':1,
  '1H2UVrWXpV-PGBdrpW6UaC3oj_OOxz8rA':1,
  '1H7fsl27Pfdg72ZqHAgM9PVa7s3i7E9UX':1,
  '1HBZO-ijDRDpqbABuPTfx5ZzpdNC-eEqi':1,
  '1HTooGUPgkL67l4lOlhYR2nigwsir9Eee':1,
  '1HaKUwTTvNDQ_5ML1fLRva7LQOf7STGiR':1,
  '1Hqz_4_QtBLVszES-llqkCeBCtC9YUrQT':1,
  '1I-sgGyjeZovIa4VC1_dARsx_TlSxRO_V':1,
  '1I0AYKrTixDW1JHdDMEYXCU_Gmmr_-zK8':1,
  '1IOHksTXJCYkzaq8kSP6oIUUnIbLmA3qH':1,
  '1IahziitJ8HB-Vm7K9FyiH_Adjjhqi26t':1,
  '1In_NeFCY9gObkAY1QO0gwLGQwJWKR76B':1,
  '1JgZG-H4uyFw0VQZBn5FTjSkExj5veihi':1,
  '1JtK2UGxuFmdLx4XvoKDHTCTnohk8wITN':1,
  '1KKf6DEq_7CiPoC0cPBjhnOIpcFfUmbpW':1,
  '1KT2rbVqTwikIbMxzNbHfHLGp-2FbTqZ0':1,
  '1KUSzqMayZ2BaLphtjcu0N0HUPEDuLJvG':1,
  '1L4lYRiMWE-rcDODtnbrDkXKSQ4ey-OO1':1,
  '1M0xYqNjgZDdKB7nFYKEDzKkRH5fCD8lB':1,
  '1M84vGWxGc7vxGPIbr3H5beSTT5cFVL1J':1,
  '1MRfAdCDEpCc9TI4DBy74CtPO2CtLK4cH':1,
  '1MmIogTUqzQBuexbyHs8ymbbag6GSuqp-':1,
  '1MofhPSCZuQvXwzMXVnvVPh3rGLjg8t-r':1,
  '1MtILOIjgSnT25t6_-oaVUSiNYXXmOh04':1,
  '1NOsIRIGSNUqJvA4xpbjRcZKfra8XsYAI':1,
  '1OQNDlosmCUmsIsBjVkcfMu_cxkF0UXkK':1,
  '1OrpTZUaKec7RJCNpYhPUbv61tRpnTBQ0':1,
  '1Q-T0Xlb8wrxVyW1Y1wVyvcI0dwZSQkhh':1,
  '1RO01oypIlVWo7oBBA7NlunI-RpDrMC4t':1,
  '1RVrySQXtbNxHwTaMo5_f8cM6BTu-DvWZ':1,
  '1RWErD6BXWpL5rQt8wfl-whpEwfrUI-HB':1,
  '1T5OCwjyW3_R6MQAwqGUTeDTiGFubDxuW':1,
  '1TMpaBVBHJ9XSclwHiK0cRoNOtoIIXYnW':1,
  '1T_uNtvzN7xCgf9BOvXJdMiIO_Jh1rgYw':1,
  '1U-zxADCMkx4Sww75OlzLjzywDngm2j7M':1,
  '1UN_-6JXwr56dZARGfAVSoNx6-AcdHD3U':1,
  '1UVCf78i95N1TqBwDmJlV8vtoAfG_zjlT':1,
  '1VF5y6h7SFqj0mJazvq0Qb7mSE6gzynyi':1,
  '1VRD_nHYPPb9JXea0CmY9uPvf3dYM2rs_':1,
  '1Xk_NR-ExpECxjQBz2kTrp307I7V_YbiR':1,
  '1YJfMCpI6esilHZLMsRRrvAMlVgJiYQbF':1,
  '1ZBZHe4DG6ZUr7ewCxW5n-7jgbTuEAJzj':1,
  '1ZPbs-wEYGWrirm_7y2ufYvuYAXTlAtgW':1,
  '1ZQlQ1e5XKSbD2CiDuFXVx_Q1ah7aTIg7':1,
  '1Z_8coYCxWKUZ11PUraX23vzxxLREjJ2D':1,
  '1_TyjorSaMwSH-_aKAUqBBLKvJuC75SiW':1,
  '1_m27z0yNNNVH6OMbxSMq5gtDEkrA4tBU':1,
  '1aWFOVeNEZMYU8ERNdOUQK1dTHnWeIuth':1,
  '1cBht14YL_AvcdK0hZCo7NX3Fhx1UACRn':1,
  '1cDm5StXXz51fY6TI4ayIS4sr4kgsyDYY':1,
  '1cN5K0sacdCX-JnZykeJMKGKvAkHQMVjl':1,
  '1ckplHsOUylWTnhFozCRvr5AnhsW_7Y3S':1,
  '1dC3JKUVUCos6VIjpHU6BJGRXAsfNdQUQ':1,
  '1dPSOuOcBSTU5g3jGIlmvOdmc_yqif-YH':1,
  '1ezDQeToHM8LA9wxyC2u7yPaVUP6xqSBK':1,
  '1fXW04Gm0r7HzKinDytv2xeY3_94wR_h6':1,
  '1g2n6dXWropWnRZMlV_Xtz8qYdIwJeyLS':1,
  '1g7pqQ6-QUYze_bJREnG9AERQBT19oa9Y':1,
  '1gEFe9thEJcu4m3AIXP_p7sms4dXUxGc9':1,
  '1gdW3-_uh1sz7zx5z4Qe_pzQ0uBeaodfL':1,
  '1gfu6m-7MkinAOPe6Iqlryd5CBuUwhC-V':1,
  '1gz8GBXH3n0vly13ocmgL0dyMS3OIvPbc':1,
  '1hFoenNL9OOryLz0zP00VkiYwsfAJakko':1,
  '1hOBzmU-VmCc7NeONBQK-EFr7Yhd80ca7':1,
  '1hVJ_1KtJD-AWAl-eqgO9gVPyXrc4slgF':1,
  '1i8-gce36esBuROkC4L5G8o3-aJnEYC0a':1,
  '1kMzNXOjy7wuNCcc9-ohZ5u9kk3C-a9Ru':1,
  '1kbnaCiTq9ChNdr1bKwsF6y49n-XXXEEv':1,
  '1lXNy317-_ehG_ZIp74Xnz0o96fE1PxdD':1,
  '1myvyZtAVqRIQh7VTmJQBFMcf5g-IRKfK':1,
  '1nUF-ycIzYfSzprzd-yfuF6t3HBL8HQUT':1,
  '1nyTRhQNTFNXl5QdgztVpqC72f9tvSvWi':1,
  '1oSF3XwfI3M3SzKZTc1Dy6YFtF7xION-C':1,
  '1oy-O9PrbTzeo87fReWFv0iP7x9E0Fauq':1,
  '1p9KN8a7Th2Oc6Kly51J66lBNnYPcsPkL':1,
  '1pKBK1wynQ8FtcHYlu8WvsNaezXHgM4FT':1,
  '1pnuIcAKisPbLW31KdcRwk3SirOAfhhpu':1,
  '1q3w59GtP-JwN78OGlipR8yeOrgWT3G4C':1,
  '1qgsnSUv6inAdCyp6OS8tZcoXAuLnrQxW':1,
  '1sQRy-r-9wgrnB7nY8a8mmZjTQ5jrffEd':1,
  '1skjXnFU2p0GfsrBzthj8_B9p8qzsaE6m':1,
  '1tEQYEhJv6SGiQddyWGCoZ4Dv2syH2a5d':1,
  '1tLNfIMLVQ4U6lPiRro0vLeHrSy1tfLz-':1,
  '1wDn8PmX-kXMpJ4KZpc-JgzcGXO-7Pd99':1,
  '1wMtGZN_TPLItGK0F7q-_3huSW-jJVJbY':1,
  '1wdpRaGj4C9ZKaeqbseVI3zBCxo09bZzR':1,
  '1xK_9dYsSqQwuH1W3roA8tEuGi1lWXMg3':1,
  '1xROb7OsUg1LZr9yVW7y9RTgvj7v5XUFr':1,
  '1xXPW1LMjeyeIkeNi-xIkkmXnvFyQunJJ':1,
  '1yizv4Ta4nWtJ1kLlKGanNFNOsm9nXBuU':1,
  '1yuBLm541fFnolPm-DMbEOcvKAwRyIWyY':1,
  '1zG8RC6GWp1PEPPUkZQEhwuCmIYeALss6':1,
  '1zUsLsEu2Vh7TvtsncWj3SVeDhq0ZEi19':1,
  '1zes_6M4E8V1EBs8SuKJuTyPgU_2sIh53':1
};
/* PUB_FILES:END */

/* הורדה ישירה של קובץ משותף-בקישור, בלי Drive API. מחזיר null
   כשמה שחזר אינו הקובץ עצמו (דף כניסה או דף אזהרה של גוגל). */
function pubFetch_(fid) {
  try {
    var r = UrlFetchApp.fetch('https://drive.google.com/uc?export=download&id=' +
                              encodeURIComponent(fid),
                              { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() !== 200) return null;
    var b = r.getBlob(), mime = String(b.getContentType() || '');
    if (/text\/html/i.test(mime)) return null;
    var cd = String(r.getHeaders()['Content-Disposition'] || ''), nm = '';
    var m = /filename\*=UTF-8''([^;]+)/i.exec(cd) || /filename="?([^";]+)"?/i.exec(cd);
    if (m) { try { nm = decodeURIComponent(m[1]); } catch (x) { nm = m[1]; } }
    return { status: 'ok', name: nm || fid, mime: mime || 'application/pdf',
             data: Utilities.base64Encode(b.getBytes()), via: 'direct' };
  } catch (err) {
    return null;
  }
}

function doGet(e) {
  /* ---- קובץ מהדרייב ----
     הסטודיו צריך את קובץ הדף כדי לצייר אותו ולזהות בו שורות,
     והדפדפן אינו מרשה לקוד שלנו למשוך בייטים מ-drive.google.com:
     גוגל אינה שולחת שם את כותרת ה-CORS. הסקריפט הזה רץ בחשבון
     שלך, ולכן הוא יכול לקרוא מהדרייב שלך ולהעביר הלאה. הקבצים
     נשארים פרטיים; רק מי שיודע את המזהה מקבל אותם. */
  /* **רק נכסי הלמידה הציבוריים** (PUB_FILES — צורת הדף ופירוש
     החברותא מ-links.js). עד עכשיו כל מזהה של כל קובץ בדרייב שלך
     הוחזר לכל מי שביקש. עם סיסמת הסקריפט — כל קובץ, כמו קודם. */
  if (e && e.parameter && e.parameter.file) {
    var res, fid = String(e.parameter.file);
    var fKey = READ_KEY && String(e.parameter.key || '') === READ_KEY;
    if (!PUB_FILES[fid] && !fKey) {
      return reply_(e, { status: 'denied', message: 'הקובץ אינו ברשימת קבצי הלמידה הציבוריים' });
    }
    try {
      var f = DriveApp.getFileById(fid);
      res = { status: 'ok', name: f.getName(), mime: f.getMimeType(),
              data: Utilities.base64Encode(f.getBlob().getBytes()) };
    } catch (err) {
      /* DriveApp נשען על Drive API בפרויקט ה-GCP של הסקריפט. כשגוגל
         אינה מצליחה להפעיל אותו שם ("Permission denied while enabling
         APIs: drive") — כל קובץ נכשל, גם ציבורי. קבצי הלמידה משותפים
         "לכל מי שיש לו הקישור", ולכן אפשר להוריד אותם ישירות בלי
         ה-API. רק לקבצים שברשימה — קובץ פרטי (עם סיסמה) אינו
         נגיש כך ממילא. */
      res = PUB_FILES[fid] ? pubFetch_(fid) : null;
      if (!res) res = { status: 'error', message: String(err) };
    }
    return reply_(e, res);
  }

  /* ============================================================
     "לא מצליח להתקין".
     ============================================================
     תלמיד שנתקע משאיר שם וטלפון, והרכז חוזר אליו. שתי החלטות
     כאן, ושתיהן נובעות מאותו דבר — הוא כבר נכשל פעם אחת:

     **בלי סיסמה.** מי שנתקע אינו מחזיק סיסמה, וקיר שני הוא
     קיר. מה שנפתח כאן הוא כתיבה של שורה אחת ללשונית פרטית,
     ואי אפשר לקרוא ממנה דבר. הסיכון הוא זבל, והוא נסבל.

     **ובלי `no-cors`.** בכל שאר האפליקציה הכתיבה אטומה ותמיד
     "מצליחה". כאן אסור: אישור שמופיע על שורה שלא נכתבה הוא
     הפעם השנייה שהוא ננטש, והפעם בלי שידע. התשובה כאן
     אמיתית — ומה שהמסך אומר נשען עליה.
     ============================================================ */
  if (e && e.parameter && e.parameter.help === '1') {
    var H = e.parameter;
    var hName  = String(H.name || '').trim();
    var hPhone = String(H.phone || '').trim();
    /* אותה בדיקה רופפת של ההרשמה: ספרות, ולפחות תשע. */
    if (!hName || hPhone.replace(/[^0-9]/g, '').length < 9) {
      return reply_(e, { status: 'error', message: 'חסר שם או טלפון' });
    }
    try {
      appendCols_('תקועים', [
        ['שם', hName], ['טלפון', hPhone],
        ['ישיבה', String(H.instName || '')],
        ['קוד ישיבה', String(H.inst || '')],
        ['שכבה', String(H.grade || '')], ['כיתה', String(H.klass || '')],
        ['מכשיר', String(H.dev || '')],
        ['מה קרה', String(H.what || '')],
        /* מה שהדפדפן כבר יודע ואין טעם לשאול אותו: מאיזה סוג
           מכשיר, מאיזו אפליקציה נפתח הקישור, והאם הכפתור
           שמתקין בכלל היה שם. זה מה שמכריע איזו הוראה לתת. */
        ['אבחון', String(H.diag || '')],
        ['טופל', '']
      ]);
    } catch (err) {
      return reply_(e, { status: 'error', message: String(err) });
    }
    /* מי שנתקע כבר מחכה — הרכז יודע מיד, ולא בכניסה הבאה לניהול. */
    coordPing_('🙋 ביקשו עזרה בהתקנה',
      hName + (H.instName ? ' · ' + String(H.instName) : '') +
      (H.what ? ' — ' + String(H.what).slice(0, 80) : ''), './#admin-help');
    return reply_(e, { status: 'ok' });
  }

  /* ============================================================
     "כמה מכיתתך הצטרפו" — הצתה של העדכון האישי.
     ============================================================
     בניגוד ל-`fire=say`, כאן אין טקסט אחד: כל ר"ם מקבל את
     המספר של הכיתה שלו, והניסוח נבנה בצד ששולח. מה שיוצא
     מכאן הוא רק ההוראה להתחיל.

     READ_KEY בלבד — זו הודעה לכל הצוות, ואין ר"ם ששולח
     אותה. ============================================== */
  /* ============================================================
     התקנת שעון השליחות — בהקשה אחת, ולא מתוך עורך הקוד.
     ============================================================
     `?setup=clock&key=<סיסמת הקריאה>` מתקין, `setup=clockoff`
     מסיר, ו-`setup=clockstate` אומר מה מותקן. הכול דורש את
     סיסמת הקריאה: מי שמתקין שעון מצית הרצות ב-GitHub.

     למה כאן ולא ב-`setupTriggers`: כדי שזה יקרה בפועל. פתיחת
     עורך Apps Script מהטלפון ובחירת פונקציה מרשימה היא בדיוק
     הסוג של צעד שנדחה ולא נעשה.
     ============================================================ */
  if (e && e.parameter && e.parameter.setup &&
      /^clock(off|state)?$/.test(String(e.parameter.setup))) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var what = String(e.parameter.setup);
    try {
      if (what === 'clockstate') {
        return reply_(e, { status:'ok', clock: hasClock_(),
          message: hasClock_() ? 'שעון השליחות פעיל · כל חצי שעה'
                               : 'שעון השליחות אינו מותקן' });
      }
      var msg = what === 'clockoff' ? removeClock() : setupClock();
      return reply_(e, { status:'ok', clock: hasClock_(), message: msg });
    } catch (errC) {
      return reply_(e, { status:'error', message: String(errC) });
    }
  }

  if (e && e.parameter && e.parameter.fire === 'digest') {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var dTok  = prop_('GH_TOKEN', '');
    var dRepo = prop_('GH_REPO', '');
    if (!dTok)  return reply_(e, { status:'denied', message:'לא הוגדר GH_TOKEN' });
    if (!dRepo) return reply_(e, { status:'denied', message:'לא הוגדר GH_REPO' });
    /* מזהה לשליחה, כמו ב-ghFire_: ההרצה מדווחת עליו בסוף, והיומן
       מקבל את התוצאה. */
    var dSid = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    try {
      var dRes = UrlFetchApp.fetch(GH_API + dRepo + '/dispatches', {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + dTok,
                   Accept: 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28' },
        payload: JSON.stringify({
          event_type: 'push-digest',
          client_payload: { mode: String(e.parameter.mode || 'joined'),
                            all: '1', sid: dSid }
        }),
        muteHttpExceptions: true
      });
      var dCode = dRes.getResponseCode();
      if (dCode !== 204) {
        return reply_(e, { status:'error', code: dCode,
          message: 'GitHub החזיר ' + dCode });
      }
      try {
        appendCols_('הודעות', [
          ['מי', 'רכז'], ['ישיבה', 'כל הצוות'], ['קהל', 'כל הצוות'],
          ['כותרת', 'כמה מכיתתך הצטרפו'],
          ['הטקסט', 'עדכון אישי — כל ר"ם והמספר שלו'],
          ['מזהה שליחה', dSid], ['תוצאה', 'ממתין']
        ]);
      } catch (e3) {}
      return reply_(e, { status: 'ok' });
    } catch (err3) {
      return reply_(e, { status: 'error', message: String(err3) });
    }
  }

  /* "טופלתי" — סימון שורה בלשונית התקועים.
     דורש READ_KEY: מי שסימן הוא מי שגם קורא את הרשימה. המספר
     הוא מספר השורה כפי שהיא חזרה בקריאה, ולשונית שרק נוספות
     לה שורות שומרת על המספר הזה. */
  if (e && e.parameter && e.parameter.helpdone) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var rn = parseInt(e.parameter.helpdone, 10);
    if (!(rn > 1)) return reply_(e, { status: 'error', message: 'שורה לא תקינה' });
    try {
      var dsh = sheet_('תקועים');
      if (rn > dsh.getLastRow()) {
        return reply_(e, { status: 'error', message: 'אין שורה כזו' });
      }
      var dHead = headers_(dsh);
      var di = idx_(dsh, dHead, 'טופל');
      dsh.getRange(rn, di + 1).setValue(new Date());
    } catch (err2) {
      return reply_(e, { status: 'error', message: String(err2) });
    }
    return reply_(e, { status: 'ok' });
  }

  /* "טופלה" — סימון שורה בלשונית ההתנגשויות. אותו דפוס בדיוק
     של helpdone למעלה, על "התנגשויות הרשמה" במקום "תקועים". */
  if (e && e.parameter && e.parameter.conflictdone) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var crn = parseInt(e.parameter.conflictdone, 10);
    if (!(crn > 1)) return reply_(e, { status: 'error', message: 'שורה לא תקינה' });
    try {
      var cdsh = sheet_('התנגשויות הרשמה');
      if (crn > cdsh.getLastRow()) {
        return reply_(e, { status: 'error', message: 'אין שורה כזו' });
      }
      var cdHead = headers_(cdsh);
      var cdi = idx_(cdsh, cdHead, 'טופל');
      cdsh.getRange(crn, cdi + 1).setValue(new Date());
    } catch (cderr) {
      return reply_(e, { status: 'error', message: String(cderr) });
    }
    return reply_(e, { status: 'ok' });
  }

  /* ============================================================
     שליחת התראה — הסקריפט מצית, GitHub חותם ושולח.
     ============================================================
     **הטלפון אינו יכול לשלוח התראה.** השליחה דורשת חתימה
     במפתח הפרטי, והוא יושב בסודות של GitHub ולא במכשיר —
     ובצדק: מפתח שמגיע לדפדפן הוא מפתח שדלף.

     ולכן המסלול הוא: מסך הניהול מבקש מכאן, כאן מפעילים את
     ה-workflow דרך אותו אסימון שכבר משמש ל-ghput, ושם רצה
     השליחה. אין סקר ואין המתנה — ההתראה יוצאת תוך פחות מדקה.

     READ_KEY נדרשת: כתובת הסקריפט יושבת בקוד הפומבי, ושליחה
     פתוחה היא ערוץ שידור לתלמידים שנמסר לעולם. */
  /* ============================================================
     "איך נגמרה השליחה" — ההרצה ב-GitHub מדווחת בסוף.
     ============================================================
     n = כמה הגיעו · bad = כמה נכשלו · why = סיבת כישלון של ההרצה.
     "אין נמענים" אינו כישלון. כישלון מעדכן את היומן ומתריע לרכז —
     פעם אחת, גם אם הדיווח מגיע פעמיים (מהקוד ומשלב ה-failure). */
  if (e && e.parameter && e.parameter.sayDone) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status:'denied', message:'אין הרשאה' });
    }
    try {
      var sr = sayRow_(String(e.parameter.sayDone));
      if (!sr) return reply_(e, { status:'ok', none: 1 });
      var why = String(e.parameter.why || '').slice(0, 200);
      var nOk = parseInt(e.parameter.n, 10) || 0;
      var nBad = parseInt(e.parameter.bad, 10) || 0;
      var nGone = parseInt(e.parameter.gone, 10) || 0;
      var was = String(sr.v[sr.ix['תוצאה']] || '');
      /* "התקבלה אצל שירות ההתראות" — ולא "הגיעה": תשובה תקינה של
         שירות ההתראות אינה ראיה שמישהו ראה אותה. */
      var tail = (nBad ? ' · נכשלה ל-' + nBad : '') + (nGone ? ' · אין מנוי פעיל ל-' + nGone : '');
      var now = e.parameter.run ? 'בשליחה'
              : why ? 'נכשלה: ' + why
              : e.parameter.none ? 'אין נמענים עם התראות' + tail
              : (nBad ? 'חלקית: ' : '') + 'התקבלה אצל שירות ההתראות ל-' + nOk + tail;
      /* "בשליחה" אינו דורס תוצאה שכבר הגיעה. */
      if (e.parameter.run && was && was !== 'ממתין') now = was;
      /* דיווח כפול (מהקוד ומשלב ה-failure) — הסיבה הראשונה נשארת. */
      if (was.indexOf('נכשלה') === 0) now = was;
      sr.sh.getRange(sr.r, sr.ix['תוצאה'] + 1).setValue(now);
      /* כישלון של התראת מערכת אינו מתריע — ההתרעה עצמה היא התראת מערכת. */
      if (why && was.indexOf('נכשלה') !== 0 && String(sr.v[sr.ix['מי']] || '') !== 'מערכת') {
        sayAlert_(String(sr.v[sr.ix['מי']] || ''), String(sr.v[sr.ix['ישיבה']] || ''),
                  String(sr.v[sr.ix['הטקסט']] || ''), why);
      }
      return reply_(e, { status:'ok' });
    } catch (errD) {
      return reply_(e, { status:'error', message: String(errD) });
    }
  }

  /* שליחה חוזרת של הודעה שנכשלה — בדיוק כמו שהייתה: אותו נוסח,
     אותה חתימה, אותו קהל ואותו פילוח. לרכז בלבד. */
  if (e && e.parameter && e.parameter.resend) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status:'denied', message:'אין הרשאה' });
    }
    try {
      var rr = sayRow_(String(e.parameter.resend));
      if (!rr) return reply_(e, { status:'error', message:'ההודעה לא נמצאה ביומן' });
      var g = function (k) { return rr.ix[k] === undefined ? '' : String(rr.v[rr.ix[k]] || ''); };
      var r2 = ghFire_(g('כותרת'), g('הטקסט'), g('יעד'), g('שכבה'), g('כיתה'),
                       g('מי'), g('קישור'), g('תפקיד'), g('ממתינים'), g('פילוח'));
      if (r2.status === 'ok') {
        rr.sh.getRange(rr.r, rr.ix['תוצאה'] + 1).setValue(g('תוצאה') + ' · נשלחה שוב');
      }
      return reply_(e, r2);
    } catch (errR) {
      return reply_(e, { status:'error', message: String(errR) });
    }
  }

  if (e && e.parameter && e.parameter.fire === 'say') {
    var P = e.parameter;
    var inst = String(P.inst || '').trim();
    var isAdm = READ_KEY && String(P.key || '') === READ_KEY;

    /* ============================================================
       **ההיקף נקבע כאן, ולא במה שהלקוח ביקש.**
       ============================================================
       ר"ם אינו מחזיק את סיסמת הרכז ואסור שיחזיק. מה שיש לו הוא
       קוד הגישה של הישיבה שלו — אותו קוד שפותח לו את הלוח —
       והוא מאשר אותו **ותוחם אותו בבת אחת**: מי שהקוד שלו שייך
       ללפיד יכול לשלוח ללפיד בלבד, גם אם יבקש אחרת.

       זה ההבדל בין הרשאה לבין בקשה. לקוח שמבקש היקף הוא לקוח
       שאפשר לערוך לו את הכתובת. */
    if (!isAdm) {
      if (!inst) return reply_(e, { status:'denied', message:'חסר קוד ישיבה' });
      var want = getCode_(inst);
      if (!want || String(P.k || '') !== want) {
        return reply_(e, { status:'denied', message:'קוד גישה שגוי' });
      }
    }
    /* **הכתובת נבדקת כאן, ולא נסמכת על השולח.** קישור חופשי
       בהתראה הוא ערוץ שמפנה תלמידים לאן שמישהו יבקש. מה
       שמותר הוא נתיב יחסי בתוך האתר בלבד. */
    var link = String(P.url || '').trim();
    if (link && !/^[A-Za-z0-9_\-\/]{0,60}(\?[A-Za-z0-9_\-=&%\u0590-\u05FF]{0,120})?(#[A-Za-z0-9_\-]{0,30})?$/.test(link)) {
      return reply_(e, { status:'denied', message:'כתובת לא מותרת' });
    }
    /* **צמצום לפי תפקיד הוא של הרכז בלבד** — "שלח לכל הצוות"
       הוא ערוץ אחר לגמרי, ואינו נתון בידי ר"ם.

       ומה שר"ם שולח מגיע **לתלמידים**, תמיד. המסך שלו מבטיח
       לו "ההודעה תגיע ל-N מתלמידיך", והמספר הזה נספר מהלוח —
       שבו יש תלמידים בלבד. בלי השורה הזו ההודעה הייתה מגיעה
       גם לר"ם עצמו ולכל איש צוות אחר באותה כיתה, כלומר ליותר
       אנשים ממה שנאמר לו. הבטחה ומסירה חייבות להיות אותו דבר. */
    /* ---- להורים, או לתלמיד ולהורה שלו יחד ----
       השרת מתרגם את הקבוצה למזהים — ראו sayPeople_. ר"ם מקבל רק
       את הישיבה שלו: הרשימה נבנית מהלוח שלה בלבד. */
    var flS = sayFlt_(P.flt), flO = flS ? JSON.parse(flS) : {};
    if (!isAdm) {
      if (P.aud === 'parents') flO.par = 'p';
      else if (P.aud === 'both') flO.par = 'pk';
    }
    if (flO.par) {
      var who0 = sayPeople_(isAdm ? String(P.only || '') : inst, isAdm,
                            isAdm || P.test === '1', flO,
                            String(P.grade || ''), String(P.klass || ''));
      if (!who0.ids.length) {
        return reply_(e, { status:'empty', message:'אין בקבוצה הזו הורים שמחוברים לתלמיד.' });
      }
      var fl2 = { ids: who0.ids };
      if (flO.per) fl2.per = 1;
      var r0 = ghFire_(String(P.title || ''), String(P.body || ''), '', '', '',
                       String(P.who || ''), link, '', '', JSON.stringify(fl2));
      if (!isAdm && r0.status !== 'ok') r0 = { status:'ok', held: 1 };
      if (r0 && r0.status === 'ok') { r0.kids = who0.kids; r0.dads = who0.dads; }
      return reply_(e, r0);
    }
    var rS = ghFire_(String(P.title || ''), String(P.body || ''),
                             isAdm ? String(P.only || '') : inst,
                             String(P.grade || ''), String(P.klass || ''),
                             String(P.who || ''), link,
                             /* ר"ם וראש חטיבה בוחרים בין תלמידים להורים —
                                ושניהם עדיין בתוך הישיבה שלהם בלבד. */
                             isAdm ? String(P.role || '')
                                   : (P.aud === 'parents' ? 'אב' : 'תלמיד'),
                             /* "הדף נפתח" — רק לרכז, ורק לממתינים של
                                אותו דף. הצורה נבדקת: 'taanit|ג', ועמוד שנפתח
                                לבד — 'taanit|ב.' או 'taanit|ב:'. */
                             isAdm && /^[a-z]+\|[\u05D0-\u05EA]{1,4}[.:]?$/.test(String(P.wait || ''))
                               ? String(P.wait) : '',
                             sayFlt_(P.flt));
    /* **איש הצוות אינו רואה כישלון** — הוא עובר לרכז (נרשם ביומן
       ו-sayAlert_), והרכז שולח שוב מהניהול. לרכז — האמת. */
    if (!isAdm && rS.status !== 'ok') rS = { status:'ok', held: 1 };
    return reply_(e, rS);
  }

  /* ---- הלוח של מוסד ----
     הקוד שבקישור הוא ההרשאה, ולכן אין כאן READ_KEY: ראש חטיבה
     אינו אמור להחזיק את המפתח של הרכז. */
  /* ============================================================
     "השורה שלי הגיעה?"
     ============================================================
     הכתיבה היא `no-cors`, כלומר התשובה אטומה וכל שליחה "מצליחה" —
     גם כשהיא נדחתה. עד עכשיו הלקוח מחק את השורה מהתור מיד אחרי
     השליחה, ולכן סימון של תלמיד שלא נכתב פשוט נעלם.

     כאן הוא יכול לשאול. לא רשימה ולא שמות: מזהה מכשיר ושבוע
     נכנסים, ומספר אחד יוצא — עד היכן הגיע, והאם סיים. אין כאן
     מה לדלוף, ולכן אין צורך בסיסמה: מי שיודע מזהה מכשיר יכול
     לדעת אם אותו מכשיר סימן, וזה כל מה שהוא יכול לדעת.
     ============================================================ */
  if (e && e.parameter && e.parameter.mark) {
    var mid = String(e.parameter.mark), mtag = String(e.parameter.wk || '');
    var mAt = 0, mDone = false;
    try {
      var mr = learnSlice_().rows;
      if (mr.length > 1) {
        var mh = mr[0], mi = {};
        for (var mq = 0; mq < mh.length; mq++) mi[String(mh[mq]).trim()] = mq;
        for (var mz = 1; mz < mr.length; mz++) {
          if (String(mr[mz][mi['מזהה']] || '').trim() !== mid) continue;
          var ttag = String(mr[mz][mi['מסלול']] || '') + '|' +
                     String(mr[mz][mi['שבוע']] || '');
          if (ttag !== mtag) continue;
          var vAt = mi['קטע']  === undefined ? '' : String(mr[mz][mi['קטע']]  || '').trim();
          var vOf = mi['מתוך'] === undefined ? '' : String(mr[mz][mi['מתוך']] || '').trim();
          var q1 = parseInt(vAt, 10), q2 = parseInt(vOf, 10);
          if (!vAt || !(q2 > 0) || q1 >= q2) { mDone = true; mAt = q2 > 0 ? q2 : 1; }
          else if (q1 > mAt) mAt = q1;
        }
      }
    } catch (me) {}
    return reply_(e, { status: 'ok', at: mAt, done: mDone });
  }

  /* ============================================================
     הלימוד המשותף — האם השורה הגיעה.
     ============================================================
     הכתיבה מהדפדפן היא `no-cors`, כלומר התשובה אטומה ואינה
     ראיה לכלום. כאן הוא שואל בחזרה, ורק אם השורה באמת בגיליון
     היא יוצאת מהתור שבמכשיר. אותו דפוס בדיוק של `?mark=`.

     כמוהו גם כאן: התשובה היא כן/לא בלבד, על מזהה שהשואל כבר
     מחזיק. אין בה שם, אין טלפון, ואין מה לדלוף ממנה — ולכן
     אין צורך בסיסמה.
     ============================================================ */
  /* ============================================================
     התור המקומי (הרשמה) — האם השורה הגיעה.
     ============================================================
     אותו דפוס בדיוק של `?mark=` ו-`?pair=` למעלה: הכתיבה
     `no-cors` ואטומה, ואי אפשר לדעת מהלקוח אם היא באמת נקלטה.
     לפני מחיקה מהתור המקומי (ראו join.html: flush/fArrived)
     הלקוח שואל כאן. תשובה כן/לא על מזהה שהוא כבר מחזיק — אין
     כאן מה לדלוף, ולכן בלי סיסמה, בדיוק כמו הקודמים. מוגבל
     ל"לומדים" — הלשונית היחידה שהתור בודק בחזרה. */
  /* משפך ההרשמה לניהול — מספרים בלבד, אבל רק עם הסיסמה. ראו `funnel_`. */
  if (e && e.parameter && e.parameter.funnel) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'error',
        message: READ_KEY ? 'סיסמת קריאה שגויה' : 'לא נקבעה סיסמת קריאה בסקריפט (READ_KEY)' });
    }
    var fo;
    try { fo = funnel_(); } catch (fe) { fo = { status: 'error', message: String(fe) }; }
    return reply_(e, fo);
  }
  /* מסלולי הכניסה — אותה סיסמה. ראו `trails_`. */
  if (e && e.parameter && e.parameter.trails) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'error',
        message: READ_KEY ? 'סיסמת קריאה שגויה' : 'לא נקבעה סיסמת קריאה בסקריפט (READ_KEY)' });
    }
    var tro;
    try { tro = trails_(+e.parameter.days || 14); } catch (te) { tro = { status: 'error', message: String(te) }; }
    return reply_(e, tro);
  }

  if (e && e.parameter && e.parameter.arrived) {
    var aid = String(e.parameter.arrived), aHas = false;
    /* **שורת ההתראות — האם הגיעה, עם מנוי.** עד עכשיו היא יצאה
       `no-cors` ובלי שום בדיקה: מי שהשורה שלו נדחתה בתור נראה
       בטלפון "מחובר", ובגיליון — בלי התראות, לתמיד. כאן נשאלת
       רק עמודת המזהה ועמודת המנוי, מהסוף להתחלה. */
    if (e.parameter.push) {
      try {
        var psh0 = sheet_('התראות'), ph0 = headers_(psh0);
        var pi0 = ph0.indexOf('מזהה'), pm0 = ph0.indexOf('מנוי');
        if (aid && pi0 >= 0 && pm0 >= 0 && psh0.getLastRow() > 1) {
          var pn0 = psh0.getLastRow() - 1;
          var pids0 = psh0.getRange(2, pi0 + 1, pn0, 1).getValues();
          var psub0 = psh0.getRange(2, pm0 + 1, pn0, 1).getValues();
          for (var pz = pn0 - 1; pz >= 0; pz--) {
            if (String(pids0[pz][0] || '').trim() === aid &&
                String(psub0[pz][0] || '').trim()) { aHas = true; break; }
          }
        }
      } catch (pe0) {}
      return reply_(e, { status: 'ok', has: aHas, push: 1 });
    }
    try {
      if (aid) {
        var ash = sheet_(JOIN_TAB);
        var ahead = headers_(ash);
        var aix = ahead.indexOf('מזהה');
        if (aix >= 0 && ash.getLastRow() > 1) {
          var avals = ash.getRange(2, aix + 1, ash.getLastRow() - 1, 1).getValues();
          for (var az = 0; az < avals.length; az++) {
            if (String(avals[az][0] || '').trim() === aid) { aHas = true; break; }
          }
          /* מכשיר שנבלע בשורה של אותו אדם — השורה שלו היא זו. */
          if (!aHas) aHas = rowOfId_(joinTable_(), aid) >= 1;
        }
      }
    } catch (ae) {}
    return reply_(e, { status: 'ok', has: aHas });
  }

  if (e && e.parameter && e.parameter.pair) {
    var pid = String(e.parameter.pair), ptag = String(e.parameter.wk || '');
    var pHas = false;
    try {
      /* `sheet_` מנתב לפי שם הלשונית — "זוגות" ברשימה הפרטית,
         ולכן הוא פותח את הגיליון הסגור בלי שהשואל יידע עליו. */
      var psh = sheet_('זוגות');
      if (psh && psh.getLastRow() > 1) {
        var pr = psh.getDataRange().getValues();
        var ph = pr[0], pix = {};
        for (var pq = 0; pq < ph.length; pq++) pix[String(ph[pq]).trim()] = pq;
        for (var pz = 1; pz < pr.length; pz++) {
          if (String(pr[pz][pix['מזהה']] || '').trim() !== pid) continue;
          var ptg = String(pr[pz][pix['מסלול']] || '') + '|' +
                    String(pr[pz][pix['שבוע']] || '');
          if (ptg === ptag) { pHas = true; break; }
        }
      }
    } catch (pe) {}
    return reply_(e, { status: 'ok', has: pHas });
  }

  /* ============================================================
     האישור של ההורה.
     ============================================================
     הבן סימן "למדנו ביחד", והוא כבר בהגרלה — זה נגמר ברגע
     שהוא לחץ. ההתראה להורה פותחת מסך אחד, והלחיצה שלו מגיעה
     לכאן ומסמנת את העמודה.

     **אינו שער.** ההגרלה אינה תלויה בו, והוא אינו מוחק דבר:
     הוא כותב "כן" או "לא" בשדה אחד בשורה שכבר קיימת. לכן גם
     אין כאן סיסמה — מי שיודע מזהה מכשיר ושבוע יכול לסמן
     שלמדו, וזה כל מה שהוא יכול.
     ============================================================ */
  if (e && e.parameter && e.parameter.pairok) {
    var oid = String(e.parameter.pairok), otag = String(e.parameter.wk || '');
    var oyes = String(e.parameter.yes || '') === '1' ? 'כן' : 'לא';
    var oHit = 0;
    try {
      var osh = sheet_('זוגות');
      if (osh && osh.getLastRow() > 1) {
        var or_ = osh.getDataRange().getValues();
        var oh = or_[0], oix = {};
        for (var oq = 0; oq < oh.length; oq++) oix[String(oh[oq]).trim()] = oq;
        /* עמודה שאינה קיימת בלשונית ישנה — נוספת פעם אחת. */
        if (oix['אושר'] === undefined) {
          osh.getRange(1, oh.length + 1).setValue('אושר');
          oix['אושר'] = oh.length;
        }
        for (var oz = 1; oz < or_.length; oz++) {
          if (String(or_[oz][oix['מזהה']] || '').trim() !== oid) continue;
          var ot = String(or_[oz][oix['מסלול']] || '') + '|' +
                   String(or_[oz][oix['שבוע']] || '');
          if (ot !== otag) continue;
          osh.getRange(oz + 1, oix['אושר'] + 1).setValue(oyes);
          oHit++;
        }
      }
    } catch (oe) {}
    return reply_(e, { status: 'ok', set: oHit });
  }

  /* ============================================================
     "הצד השני כבר סימן שלמדנו יחד?" — ברגע שמסיימים את הדף.
     ============================================================
     "אם אבא כבר סימן את הבן, אז ההודעה צריכה להשתנות בהתאם."
     לפני שנשאל "למדתם יחד?" — בודקים אם הצד השני כבר דיווח על
     אותו שבוע, ורשם את הטלפון שלי כטלפון השותף. בן שואל על דיווח
     של ההורה; הורה שואל על דיווח של הבן. מה שחוזר: מזהה המדווח
     והאם אושר — בלי שם ובלי טלפון. */
  if (e && e.parameter && e.parameter.pairSeen) {
    var psPh = phKey_(e.parameter.pairSeen);
    var psTag = String(e.parameter.wk || '');
    var psBy = e.parameter.side === 'parent' ? 'הבן' : 'ההורה';
    var ps = null;
    try {
      if (psPh && psTag) {
        var pssh = sheet_('זוגות');
        if (pssh && pssh.getLastRow() > 1) {
          var psv = pssh.getDataRange().getDisplayValues(), psix = {};
          for (var psq = 0; psq < psv[0].length; psq++) psix[String(psv[0][psq]).trim()] = psq;
          var psc = function (r, n) { return psix[n] === undefined ? '' : String(r[psix[n]] || '').trim(); };
          for (var psz = psv.length - 1; psz >= 1; psz--) {
            var psr = psv[psz];
            if (psc(psr, 'דיווח') !== psBy) continue;
            if (psc(psr, 'מסלול') + '|' + psc(psr, 'שבוע') !== psTag) continue;
            if (phKey_(psc(psr, 'טלפון השותף')) !== psPh) continue;
            ps = { id: psc(psr, 'מזהה'), ok: psc(psr, 'אושר') };
            break;
          }
        }
      }
    } catch (pse) {}
    return reply_(e, { status: 'ok', seen: ps });
  }

  /* ============================================================
     האם יש אצל ההורה דיווח שממתין לאישורו — בלי קשר להתראה.
     ============================================================
     עד עכשיו הדרך היחידה להגיע למסך האישור הייתה התראה שנלחצה
     (`?pr=`), וזו בדיוק ההבטחה שאי אפשר לעמוד בה כשההתראה
     שקטה או מתעכבת. כאן ההורה נשאל ישירות, לפי הטלפון שהוא
     עצמו מילא בהרשמה — אותו טלפון בדיוק שהבן כתב כ"טלפון
     השותף" כשדיווח. מי שיודע טלפון יכול לדעת אם יש דיווח
     ממתין לו, וזה כל מה שהוא יכול לדעת — בלי סיסמה, מאותו
     טעם של `?pair=` למעלה. */
  /* ============================================================
     "הצד השני כבר רשם אותך?" — בזמן ההרשמה.
     ============================================================
     "אם הבן כבר רשם את הטלפון של אבא, ואבא עכשיו נרשם עם הטלפון
     שלו — שמיד תופיע לו הודעה: הבן שלך כבר סימן שהוא לומד איתך."

     מחפשים שורה של **הצד השני** (הורה מול תלמיד) שבה "טלפון
     ההורה" — כלומר הטלפון שנמסר על השותף — הוא הטלפון שלי.
     **ושם המשפחה חייב להתאים** (שלו או זה שמסר עליי): טלפון לבדו
     היה מאפשר לכל אחד לגלות שם של נער לפי מספר. מה שחוזר: שם
     פרטי בלבד. */
  /* **בשני הכיוונים.** עד עכשיו נבדק רק "הצד השני מסר את הטלפון
     שלי". אבא שלא מילא בהרשמה את הטלפון של הבן — או מילא אותו
     רק בתיבת ההזמנה — ראה אצלו "אבא ובן", והבן לא ראה כלום. ולכן
     גם: הטלפון **שאני** מסרתי על הצד השני הוא הטלפון שלו, או
     שנרשמתי דרך קישור ההזמנה שלו (`wid`), או שהוא דרך שלי. אלה
     בדיוק הדרכים שהלוח של הצוות כבר מצליב בהן (`pairMap_`).

     `id` — המזהה שלי. בעזרתו השרת קורא את השורה שלי עצמה, ולכן
     גם מכשיר שנרשם מחדש או שוחזר (ואינו זוכר את הטלפון של
     השותף) מקבל תשובה נכונה. */
  if (e && e.parameter && e.parameter.pairFor) {
    var pmPh = phKey_(e.parameter.pairFor);
    var pmLast = nk_(e.parameter.last);
    var pmDad = e.parameter.role === 'dad';
    var pmOther = [], pmWid = [], pmIds = [];
    var addU = function (arr, v) { if (v && arr.indexOf(v) < 0) arr.push(v); };
    addU(pmOther, phKey_(e.parameter.other));
    addU(pmWid, String(e.parameter.wid || '').trim());
    var found = null;
    try {
      var pt = joinTable_();
      var pmId = String(e.parameter.id || '').trim();
      if (pmId && pt.rows.length > 1) {
        var mine = rowOfId_(pt, pmId);
        if (mine >= 1) {
          var mrow = pt.rows[mine];
          rowIds_(pt, mrow).forEach(function (x) { addU(pmIds, x); });
          if (!pmPh) pmPh = phKey_(pt.c(mrow, 'טלפון'));
          if (!pmLast) pmLast = nk_(pt.c(mrow, 'משפחה'));
        } else addU(pmIds, pmId);
        /* השורות שלי — כולל "בן נוסף" של אבא (`מזהה:k1`). */
        for (var mr0 = 1; mr0 < pt.rows.length; mr0++) {
          var rid = pt.c(pt.rows[mr0], 'מזהה');
          var isMine = pmIds.indexOf(rid) >= 0;
          for (var mi0 = 0; mi0 < pmIds.length && !isMine; mi0++) {
            if (rid.indexOf(pmIds[mi0] + ':k') === 0) isMine = true;
          }
          if (!isMine) continue;
          addU(pmOther, phKey_(pt.c(pt.rows[mr0], 'טלפון ההורה')));
          addU(pmWid, pt.c(pt.rows[mr0], 'מזהה המזמין'));
        }
      }
      if ((pmPh || pmOther.length) && pmLast || pmWid.length || pmIds.length) {
        for (var pr = pt.rows.length - 1; pr >= 1; pr--) {
          var row = pt.rows[pr];
          if ((pt.c(row, 'תפקיד') === 'הורה') === pmDad) continue;   /* הצד השני בלבד */
          var theirIds = rowIds_(pt, row);
          var viaLink = false;
          for (var w0 = 0; w0 < pmWid.length && !viaLink; w0++) {
            if (theirIds.indexOf(pmWid[w0]) >= 0) viaLink = true;
          }
          if (!viaLink && pmIds.indexOf(pt.c(row, 'מזהה המזמין')) >= 0) viaLink = true;
          if (!viaLink) {
            /* טלפון לבדו היה מאפשר לכל אחד לגלות שם של נער לפי
               מספר — ולכן בהצלבה לפי טלפון שם המשפחה חייב להתאים. */
            if (!pmLast) continue;
            if (nk_(pt.c(row, 'משפחה')) !== pmLast &&
                nk_(pt.c(row, 'משפחת ההורה')) !== pmLast) continue;
            var theirs = phKey_(pt.c(row, 'טלפון'));
            var ok = (pmPh && phKey_(pt.c(row, 'טלפון ההורה')) === pmPh) ||
                     (theirs && pmOther.indexOf(theirs) >= 0);
            if (!ok) continue;
          }
          found = pt.c(row, 'שם');
          break;
        }
      }
    } catch (pme) {}
    return reply_(e, { status: 'ok', 'with': found || '' });
  }

  /* ============================================================
     אותו אדם, מכשיר נוסף.
     ============================================================
     `?idFor=` — המכשיר שואל פעם אחת: האם המזהה שלי נבלע בשורה
     של מישהו (כי נרשמתי כבר ממכשיר אחר)? אם כן — מה המזהה הקבוע,
     ומה כבר סימנתי משם. מי שמחזיק מזהה אקראי יודע ממילא מי הוא;
     אין כאן מה לדלוף.

     `?whoIs=` — "כבר נרשמתי במכשיר אחר": טלפון, שם פרטי ושם
     משפחה — שלושתם, ובדיוק. מה שחוזר הוא מה שהאדם עצמו מילא,
     **בלי** הטלפון של השותף: את זה הוא לא צריך כדי להמשיך, ומי
     שמנחש פרטים של אחר לא יקבל ממנו מספר של אדם שלישי. */
  if (e && e.parameter && e.parameter.idFor) {
    var ifr = { status: 'ok', id: '', learned: [] };
    try {
      var it = joinTable_(), ir = rowOfId_(it, e.parameter.idFor);
      if (ir >= 1) {
        ifr.id = it.c(it.rows[ir], 'מזהה');
        if (ifr.id !== String(e.parameter.idFor).trim()) ifr.learned = learnedOf_(rowIds_(it, it.rows[ir]));
      }
    } catch (ife) {}
    return reply_(e, ifr);
  }
  /* `?amdaFor=` — האפליקציה של התלמיד שואלת: נרשם לי דף בעמדת
     הלימוד? קוראת רק את לשונית השיוך הקטנה, ולא את "לימוד". מי
     שמחזיק את המזהה יודע ממילא מי הוא; חוזרים רק 'מסלול|שבוע'. */
  if (e && e.parameter && e.parameter.amdaFor) {
    var afr = { status: 'ok', learned: [] };
    try { afr.learned = amdaLearnedOf_(String(e.parameter.amdaFor).trim()); } catch (afe) {}
    return reply_(e, afr);
  }
  if (e && e.parameter && e.parameter.whoIs) {
    var wres = { status: 'ok', me: null, learned: [] };
    try {
      var wt = joinTable_(), wr = -1;
      var wdad = e.parameter.role;
      var tryRole = wdad === 'dad' ? [true] : wdad === 'kid' ? [false] : [false, true];
      for (var tq = 0; tq < tryRole.length && wr < 1; tq++) {
        wr = rowOfKey_(wt, personKey_(e.parameter.whoIs, e.parameter.first,
                                      e.parameter.last, tryRole[tq]));
      }
      if (wr >= 1) {
        var w = wt.rows[wr], wc = function (n) { return wt.c(w, n); };
        var WAY_OF = { 'אבות ובנים':'dad', 'חבורת לימוד':'chav', 'לימוד עצמי':'solo' };
        var rel = wc('לומד עם');
        wres.me = {
          id: wc('מזהה'), role: wc('תפקיד') === 'הורה' ? 'dad' : 'kid',
          rel: rel === 'חבר' ? 'friend' : rel === 'בן' ? 'kid' : 'dad',
          inst: wc('קוד ישיבה'), instName: wc('ישיבה'),
          first: wc('שם'), last: wc('משפחה'), grade: wc('שכבה'), klass: wc('כיתה'),
          way: WAY_OF[wc('מסגרת')] || wc('מסגרת'),
          dadFirst: wc('שם ההורה'), dadLast: wc('משפחת ההורה'),
          from: wc('הוזמן על ידי'), withId: wc('מזהה המזמין')
        };
        wres.learned = learnedOf_(rowIds_(wt, w));
      }
    } catch (we) {}
    return reply_(e, wres);
  }

  if (e && e.parameter && e.parameter.pendingFor) {
    var pfPhone = String(e.parameter.pendingFor).replace(/[^0-9]/g, '');
    var pf = null;
    try {
      if (pfPhone) {
        var pfsh = sheet_('זוגות');
        if (pfsh && pfsh.getLastRow() > 1) {
          var pfvals = pfsh.getDataRange().getValues();
          var pfh = pfvals[0], pfix = {};
          for (var pfq = 0; pfq < pfh.length; pfq++) pfix[String(pfh[pfq]).trim()] = pfq;
          for (var pfz = pfvals.length - 1; pfz >= 1; pfz--) {
            var pfr = pfvals[pfz];
            var pfRp  = String(pfr[pfix['טלפון השותף']] || '').replace(/[^0-9]/g, '');
            var pfRep = String(pfr[pfix['דיווח']] || '').trim();
            var pfOk  = String(pfr[pfix['אושר']] || '').trim();
            if (pfRp !== pfPhone || pfRep !== 'הבן' || pfOk) continue;
            pf = { id: String(pfr[pfix['מזהה']] || ''),
                   track: String(pfr[pfix['מסלול']] || ''),
                   wk: String(pfr[pfix['שבוע']] || '') };
            break;
          }
        }
      }
    } catch (pfe) {}
    return reply_(e, { status: 'ok', pending: pf });
  }

  /* ============================================================
     אזור הניהול האישי — גישה אחרי אימות, ולא קוד בקישור.
     ============================================================
     "כל מי שקיבל את הקישור הזה — שיקבל את הניהול האישי. אני
     אאמת טלפון, ומי שאינו מהחבורה — אנעל."

     הקוד המשותף הגיע רק בקישור, ולכן השני והשלישי מאותה ישיבה —
     ובאייפון גם הראשון, אחרי ההתקנה — נשארו בלי שמות ובלי
     שליחה, בשקט. כאן המכשיר מזדהה במזהה שכבר נכתב ל"התראות"
     בתהליך האישי (שם, טלפון, ישיבה, תפקיד), והרכז מאשר או נועל
     בלשונית "גישה". רק אחרי "אושר" נמסר לו קוד הישיבה — וכל מה
     שכבר עובד עם הקוד (הלוח, השליחה) עובד כמו שהוא.

     `acc`    ציבורי: מזהה מכשיר + ישיבה → ok+קוד · wait · locked.
     `accset` לרכז: אישור / נעילה. */
  if (e && e.parameter && e.parameter.acc) {
    try { return reply_(e, accAsk_(String(e.parameter.acc), String(e.parameter.dev || ''),
                                   e.parameter.has === '1')); }
    catch (errA) { return reply_(e, { status: 'error', message: String(errA) }); }
  }
  if (e && e.parameter && e.parameter.accset) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var ast = String(e.parameter.st || '');
    if (['אושר', 'נעול', 'ממתין'].indexOf(ast) < 0) {
      return reply_(e, { status: 'error', message: 'מצב לא מוכר' });
    }
    try {
      upsertCols_(ACC_TAB, [['מזהה', String(e.parameter.accset)], ['מצב', ast],
                            ['הוחלט', new Date()]], 'מזהה');
      return reply_(e, { status: 'ok' });
    } catch (errS) { return reply_(e, { status: 'error', message: String(errS) }); }
  }

  if (e && e.parameter && e.parameter.board) {
    var bd;
    /* **סיסמת הרכז פותחת כל לוח.** היא כבר פותחת כל לשונית
       פרטית, ולכן זו אינה הרחבה של הרשאה אלא ויתור על עקיפה:
       בלי זה השולח המתוזמן היה צריך לשלוף את הקוד של כל ישיבה
       רק כדי לשאול על מה שהסיסמה ממילא מתירה. */
    var isAdm = READ_KEY && String(e.parameter.key || '') === READ_KEY;
    var bk = isAdm ? getCode_(String(e.parameter.board)) : e.parameter.k;
    /* כל הישיבות — רק בסיסמת הרכז. */
    if (String(e.parameter.board) === '*' && !isAdm) {
      return reply_(e, { status: 'denied', message: 'הלוח של כל הישיבות נפתח רק בסיסמת הרכז.' });
    }
    try { bd = boardData_(String(e.parameter.board), bk, e.parameter.test === '1'); }
    catch (err0) { bd = { status: 'error', message: String(err0) }; }
    return reply_(e, bd);
  }

  /* ---- עמוד הצוות ----
     הלשונית 'תצוגת צוות' כבר מכילה רק מה שסומן לחשיפה — מוקד
     השיחות הוא זה שכותב אותה וזה שמחליט מה יוצא. השרת כאן רק
     מגיש את מה שכבר הוחלט, בלי סינון נוסף ובלי שהקורא צריך
     לדעת את מזהה הגיליון הפרטי. */
  if (e && e.parameter && e.parameter.team) {
    if (!TEAM_KEY || String(e.parameter.key || '') !== TEAM_KEY) {
      return reply_(e, { status: 'denied',
        message: TEAM_KEY ? 'סיסמה שגויה' : 'עמוד הצוות עדיין לא הופעל' });
    }
    try {
      var tsh = sheet_(TEAM_VIEW_TAB, CONTACTS_ID);
      return reply_(e, { status: 'ok',
        rows: tsh.getLastRow() ? tsh.getDataRange().getDisplayValues() : [] });
    } catch (err4) {
      return reply_(e, { status: 'error', message: String(err4) });
    }
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
      recount_(); recountLearn_(true);
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

  /* ============================================================
     איש קשר שנוסף או נערך במוקד — חזרה ללשונית "אנשי קשר".
     ============================================================
     עד עכשיו הוא חי על המכשיר, ובעמודת "עריכה" של היומן. כאן הוא
     נכתב לגיליון שהשרת מכיר (CONTACTS_ID, ובלעדיו PRIVATE_ID) —
     **לעולם לא לגיליון הראשי**, שפתוח לקריאה. אין שם כזה — שגיאה.

     הוספה בלבד: שורה קיימת (לפי שם הישיבה) מקבלת בסופה רק מי
     שאינו בה כבר, לפי שם או לפי טלפון. שום תא קיים אינו נדרס.
     GET ולא POST: התשובה כאן אמיתית, וזו האימות. */
  if (e && e.parameter && e.parameter.contactSave) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied',
        message: READ_KEY ? 'סיסמה שגויה' : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
    }
    var cres;
    try { cres = contactSave_(parse_(e.parameter.contactSave)); }
    catch (err) { cres = { status: 'error', message: String(err) }; }
    return reply_(e, cres);
  }

  /* ---- ארכיון: הסרה הפיכה, שחזור, ורשימה (archivePerson_) ---- */
  if (e && e.parameter && (e.parameter.archive || e.parameter.unarchive || e.parameter.archived)) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: READ_KEY ? 'סיסמה שגויה' : 'לא נקבעה סיסמה בסקריפט (READ_KEY)' });
    }
    var ares;
    try {
      ares = e.parameter.archive ? archivePerson_(e.parameter.archive)
           : e.parameter.unarchive ? restorePerson_(e.parameter.unarchive)
           : archiveList_();
    } catch (aerr) { ares = { status: 'error', message: String(aerr) }; }
    return reply_(e, ares);
  }

  /* ---- ניקוי כפילויות ב"לומדים" — חד-פעמי, ראו dedupeJoin_ ----
     גם היא דרך doGet ומאותה סיבה: מחיקת שורות חייבת תשובה
     שאפשר לקרוא, לא ניחוש. */
  if (e && e.parameter && e.parameter.dedupe) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied',
        message: READ_KEY ? 'סיסמה שגויה'
                          : 'לא נקבעה סיסמה בסקריפט (READ_KEY) — מחיקה חסומה' });
    }
    var ddres;
    try {
      ddres = dedupeJoin_();
      /* ואחרי הכפילויות של אותו מכשיר — אותו אדם מכמה מכשירים. */
      ddres.merged = mergePeople_();
      if (ddres.merged) recount_();
    }
    catch (dde) { ddres = { status: 'error', message: String(dde) }; }
    return reply_(e, ddres);
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
      var pid = e.parameter.ss ? '' : privId_(want);
      var id  = e.parameter.ss || pid;
      var book = id ? SpreadsheetApp.openById(String(id))
                    : SpreadsheetApp.getActiveSpreadsheet();
      var tab = book.getSheetByName(want);
      /* כאן כבר עברנו את בדיקת הסיסמה — הלשוניות האלה פרטיות. */
      if (!tab && YSH_TABS_.hasOwnProperty(want)) {
        tab = book.insertSheet(want);
        tab.getRange(1, 1, 1, YSH_TABS_[want].length).setValues([YSH_TABS_[want]]);
      }
      rd = { status: 'ok', tab: want,
             rows: tab && tab.getLastRow() ? tab.getDataRange().getDisplayValues() : [] };
      /* ההצלבה נוסעת יחד עם השורות, ולא בבקשה שנייה.

         היא מחושבת **כאן בלבד** — אותה פונקציה שהלוח משתמש
         בה — כי שני מימושים של "מי לומד עם מי" ייפרדו זה מזה
         ביום שמישהו יתקן אחד מהם, וזה כבר קרה בפרויקט הזה
         יותר מפעם אחת. */
      if (want === JOIN_TAB) rd.pairs = pairMap_(rd.rows);
      /* העמדה קוראת את הלשונית כמה שניות אחרי כל סימון — וזה
         הרגע לשייך את מי שלמד דף לחשבון שלו באפליקציה. */
      if (want === AMDA_TAB_) amdaSyncSoon_();
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
              teamOn:  !!TEAM_KEY,
              autoOn:  hasTrigger_(), gh: ghCheck_(),
              backup:  prop_('LAST_BACKUP', ''), backupErr: prop_('BACKUP_ERR', '') };
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
  /* `cb` וגם `callback`: pair.js שלח `cb`, והתשובה חזרה כ-JSON
     רגיל — כלומר מסך "למדתם יחד?" של ההורה לא נפתח מעולם. */
  var cb = e && e.parameter && (e.parameter.callback || e.parameter.cb);
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
  if (tab === LEARN_TAB) {
    /* השורה שהרגע נכתבה מספרת באיזה שבוע אנחנו. זה כל מה שצריך
       כדי לדעת היכן השבוע התחיל — בלי שעון ובלי הגדרה. */
    var iw = idx_(sh, head, 'שבוע');
    if (iw >= 0) markBump_(row[iw], sh.getLastRow());
    recountLearn_();
  }
  return json_({ status: 'success', tab: tab, columns: row.length });
}

/* ============================================================
   כמו appendCols_, אבל דורס שורה קיימת עם אותו ערך ב-keyName
   במקום להוסיף עוד אחת.
   ============================================================
   נולד מהתקלה הזו: הכתיבה מהדפדפן `no-cors`, ולכן כל ניסיון
   חוזר — כשל שקט בשרת, לחיצה כפולה, פתיחה מחדש עם תור שלא
   התרוקן — הוסיף עוד שורה באותו "מזהה" במקום לעדכן קיימת.
   354 שורות ב"לומדים" עם 210 מזהים ייחודיים בלבד, עד 15 שורות
   זהות לאותו תלמיד. `recount_` כבר סופר מזהה ייחודי פעם אחת,
   ולכן המספר המוצג לא היה שקרי — אבל שורה שנכתבה ולא אושרה
   הייתה נמחקת מהתור מקומית ונעלמת, וזה כן שקרי. תיקון אחד
   לשתי הבעיות: מזהה קיים מתעדכן במקום, ולכן גם ניסיון חוזר
   בטוח וגם אין עוד תלות בכך שהתור המקומי "ידע" אם הצליח. */
function upsertCols_(tab, cols, keyName, ssId) {
  var sh = sheet_(tab, ssId);
  var head = headers_(sh);
  var ixKey = head.indexOf(keyName);
  var keyVal = '';
  cols.forEach(function (c) { if (c && c[0] === keyName) keyVal = String(c[1] || '').trim(); });

  if (ixKey >= 0 && keyVal && sh.getLastRow() > 1) {
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues();
    for (var r = 0; r < vals.length; r++) {
      if (String(vals[r][ixKey] || '').trim() !== keyVal) continue;
      var row = vals[r].slice();
      put_(row, idx_(sh, head, 'תאריך'), new Date());
      cols.forEach(function (c) {
        if (!c || c[0] == null || c[0] === '') return;
        put_(row, idx_(sh, head, String(c[0])), cell_(c[1]));
      });
      for (var k = 0; k < row.length; k++) if (row[k] === undefined) row[k] = '';
      sh.getRange(r + 2, 1, 1, row.length).setValues([row]);
      if (tab === JOIN_TAB) recount_();
      return json_({ status: 'success', tab: tab, columns: row.length, updated: true });
    }
  }
  return appendCols_(tab, cols, ssId);
}

/* ============================================================
   הרשמה ל"לומדים" — אותה תוצאה כמו canonJoinCols_ + upsertCols_
   + recount_, בקריאה מלאה אחת של הלשונית.
   ============================================================
   הטבלה שנקראה לזיהוי הכפילות משמשת גם לחיפוש השורה וגם
   לספירה מחדש: השורה שנכתבה מעודכנת גם בזיכרון, והמונה נספר
   ממנה. מהגיליון נקראת מעבר לזה רק השורה הבודדת שנדרסת
   (בערכים האמיתיים, לא בתצוגה — כדי שתאריך יישאר תאריך).
   לשונית ריקה — המסלול הרגיל, כמו קודם.
   ============================================================ */
function joinWrite_(cols) {
  var t = joinTable_();
  if (t.rows.length < 2) {
    try { cols = canonJoinCols_(cols, t); } catch (ce) {}
    return upsertCols_(JOIN_TAB, cols, 'מזהה');
  }
  try { cols = canonJoinCols_(cols, t); } catch (ce2) {}
  var sh = t.sh, head = t.rows[0].map(function (h) { return String(h).trim(); });
  var ixKey = head.indexOf('מזהה'), keyVal = '';
  cols.forEach(function (c) { if (c && c[0] === 'מזהה') keyVal = String(c[1] || '').trim(); });
  var found = -1;
  if (ixKey >= 0 && keyVal) {
    for (var r = 1; r < t.rows.length; r++) {
      if (String(t.rows[r][ixKey] || '').trim() === keyVal) { found = r; break; }
    }
  }
  var row = found > 0 ? sh.getRange(found + 1, 1, 1, head.length).getValues()[0] : [];
  put_(row, idx_(sh, head, 'תאריך'), new Date());
  cols.forEach(function (c) {
    if (!c || c[0] == null || c[0] === '') return;
    put_(row, idx_(sh, head, String(c[0])), cell_(c[1]));
  });
  for (var k = 0; k < row.length; k++) if (row[k] === undefined) row[k] = '';
  if (found > 0) sh.getRange(found + 1, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);

  /* אותה שורה בזיכרון, כמחרוזות — הספירה קוראת ממנה. */
  var disp = row.map(function (v) { return v instanceof Date ? v.toISOString() : String(v); });
  t.rows[0] = head.slice();
  if (found > 0) t.rows[found] = disp; else t.rows.push(disp);
  recountRows_(t.rows);
  return found > 0
    ? json_({ status: 'success', tab: JOIN_TAB, columns: row.length, updated: true })
    : json_({ status: 'success', tab: JOIN_TAB, columns: row.length });
}

/* ============================================================
   ניקוי כפילויות ב"לומדים" — פעולת ניהול חד-פעמית.
   ============================================================
   כתיבות חדשות כבר מתעדכנות במקום (ראו upsertCols_); הפעולה
   כאן מנקה את מה שכבר הצטבר לפני התיקון — משאירה לכל מזהה רק
   את השורה האחרונה שלו (העדכנית ביותר), ומוחקת את הקודמות. */
function dedupeJoin_() {
  var sh = sheet_(JOIN_TAB);
  if (!sh || sh.getLastRow() < 2) return { status: 'ok', removed: 0 };
  var head = headers_(sh);
  var ixId = head.indexOf('מזהה');
  if (ixId < 0) return { status: 'ok', removed: 0 };
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues();
  var lastRowOf = {};
  for (var i = 0; i < vals.length; i++) {
    var id = String(vals[i][ixId] || '').trim();
    if (id) lastRowOf[id] = i;
  }
  var toDelete = [];
  for (var j = 0; j < vals.length; j++) {
    var jid = String(vals[j][ixId] || '').trim();
    if (jid && lastRowOf[jid] !== j) toDelete.push(j + 2);
  }
  toDelete.sort(function (a, b) { return b - a; });
  for (var k = 0; k < toDelete.length; k++) sh.deleteRow(toDelete[k]);
  if (toDelete.length) recount_();
  return { status: 'ok', removed: toDelete.length };
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
/* קודם כותבים, ורק אחר כך מוחקים את השאריות שמתחת.

   הסדר ההפוך — מחיקה ואז כתיבה — משאיר חלון של שבריר שנייה שבו
   הלשונית באמת ריקה. כל תלמיד שטוען את המסך בדיוק אז מקבל אפס
   מצטרפים ואפס לומדים, וזה קורה בכל ספירה מחדש: בכל הרשמה, בכל
   סימון לימוד, וכל שעה מהטריגר.

   בגלל החלון הזה הצד הלקוח נאלץ להתעלם מלשונית ריקה — כלומר
   מספר שהתרוקן באמת לא היה מתעדכן לעולם. התיקון כאן הוא בשורש:
   אין יותר חלון, ולכן "ריק" יכול סוף־סוף להיקרא כריק. */
function writeCount_(tab, cols, rows) {
  var out = sheet_(tab);
  if (!out.getLastRow()) headRow_(out, cols);
  if (rows.length) out.getRange(2, 1, rows.length, cols.length).setValues(rows);
  var end = out.getLastRow(), from = rows.length + 2;
  if (end >= from) {
    out.getRange(from, 1, end - from + 1,
                 Math.max(cols.length, out.getLastColumn())).clearContent();
  }
}

/* מי סיים איזה דף, לפי מסלול · שבוע · ישיבה. שום שם ושום טלפון
   אינם יוצאים מהגיליון הסגור — רק ספירה. */
/* שורת הכותרת, ואחריה רק מי שסיים. שורה בלי עמודת "קטע" היא
   שורה מגרסה קודמת, והיא הייתה תמיד סיום. */
/* ============================================================
   משתמשי בדיקה.
   ============================================================
   מכשיר שסומן בעמוד /reset כ"מכשיר בדיקה" כותב "כן" בעמודת
   "בדיקה" — בהרשמה ובכל שורת לימוד. הם **אינם נספרים** במונים,
   ואינם מופיעים בלוח של הישיבה — אלא אם הלוח נפתח במכשיר בדיקה
   בעצמו (`test=1`), ואז הם מופיעים ומסומנים. כך הרכז בודק ראש
   חטיבה ששולח לתלמיד, בלי שהצוות האמיתי יראה תלמיד שלא קיים.
   ============================================================ */
function noTestRows_(rows) {
  if (!rows || rows.length < 2) return rows;
  var iT = -1;
  for (var i = 0; i < rows[0].length; i++) if (String(rows[0][i]).trim() === 'בדיקה') iT = i;
  if (iT < 0) return rows;
  return [rows[0]].concat(rows.slice(1).filter(function (r) {
    return String(r[iT] || '').trim() !== 'כן';
  }));
}

function doneRows_(rows) {
  rows = noTestRows_(rows);
  if (!rows || !rows.length) return rows;
  var head = rows[0], iAt = -1, iOf = -1;
  for (var i = 0; i < head.length; i++) {
    var h = String(head[i]).trim();
    if (h === 'קטע')  iAt = i;
    if (h === 'מתוך') iOf = i;
  }
  if (iAt < 0 || iOf < 0) return rows;          /* לשונית ישנה — הכל סיום */
  var out = [head];
  for (var r = 1; r < rows.length; r++) {
    var at = String(rows[r][iAt] || '').trim();
    var of = String(rows[r][iOf] || '').trim();
    var n1 = parseInt(at, 10), n2 = parseInt(of, 10);
    if (!at || !(n2 > 0) || n1 >= n2) out.push(rows[r]);
  }
  return out;
}

/* ============================================================
   הסימנייה — מאיפה מתחיל השבוע הנוכחי בלשונית "לימוד".
   ============================================================
   הבעיה: כל סימון של תלמיד גורם לספירה מחדש, והספירה קראה את
   הלשונית **כולה**. אחרי שנה זה מאות אלפי שורות שנקראות בכל
   פעם שתלמיד לוחץ "סיימתי".

   הפתרון אינו לנחש "כמה שורות שבוע מייצר" — מספר כזה נכון
   לשבוע אחד ושגוי לשאר. במקום זה **הנתונים עצמם מסמנים את
   הגבול**: כל שורה נושאת את מספר השבוע שלה, וברגע שמגיעה שורה
   של שבוע חדש יודעים בדיוק היכן הוא התחיל. אין שעון, אין אזור
   זמן, ואין הנחה על קצב.

   נשמרת ב-Script Properties, ולא בלשונית: היא מטא־נתון של
   המנגנון ולא נתון של התוכנית, ואין סיבה שמישהו יראה אותה.

   שוליים: הסימנייה נסוגה 200 שורות אחורה. שורה שנשלחה באיחור —
   תלמיד שסימן בלי רשת וההודעה יצאה למחרת — נוחתת אחרי הגבול
   ולכן ממילא נקראת; השוליים הם כנגד המקרה ההפוך, שבו סדר
   ההגעה אינו סדר השבועות.

   ובכל שעה רצה בכל מקרה ספירה **מלאה** מהטריגר. כלומר גם אם
   הסימנייה שגויה מסיבה כלשהי, המספרים מתקנים את עצמם תוך שעה
   ולא נשארים שבורים.
   ============================================================ */
/* מפתח חדש (8.99.133): הסימנייה הישנה הוצבה לפי "השורה שהרגע
   נכתבה פחות 200", ובשבוע הראשון היא חתכה את כל מי שסיים בפתיחה
   המוקדמת. מפתח אחר = הישנה פשוט אינה נקראת יותר. */
var MARK_KEY = 'learnMark2';
var MARK_PAD = 200;

/* תחילת שבוע 1 — חייב להיות זהה ל-PROGRAM.startDate ב-data.js
   (tools/preflight.py בודק). */
var PROG_START = '2026-10-04';

/* השבוע של הלוח לפי התאריך, 1 והלאה. לפני ההתחלה (פתיחה מוקדמת) —
   שבוע 1. זה השבוע שהלוח של הצוות מציג, ולא השבוע של השורה
   האחרונה שנכתבה: תלמיד שמקדים ומסמן את הדף של השבוע הבא אינו
   מתחיל שבוע חדש לכולם. */
function progWeek_() {
  var tz = 'Asia/Jerusalem';
  try { tz = Session.getScriptTimeZone() || tz; } catch (e) {}
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var days = Math.round((Date.parse(today + 'T00:00:00Z') -
                         Date.parse(PROG_START + 'T00:00:00Z')) / 864e5);
  return !(days >= 0) ? 1 : Math.floor(days / 7) + 1;
}

function markGet_() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(MARK_KEY);
    var m = raw ? JSON.parse(raw) : null;
    return (m && m.row > 1 && m.wk) ? m : null;
  } catch (e) { return null; }
}
function markSet_(wk, row) {
  try {
    PropertiesService.getScriptProperties().setProperty(MARK_KEY,
      JSON.stringify({ wk: String(wk), row: Math.max(2, row) }));
  } catch (e) {}
}

/* נקרא אחרי כל הוספה ללשונית "לימוד". `wk` הוא השבוע של השורה
   שהרגע נכתבה, ו-`row` מספרה. */
/* **השבוע נקבע לפי התאריך, והגבול — לפי השורה הראשונה שלו.**

   קודם הגבול הוצב ב"שורה שהרגע נכתבה פחות 200" בכל פעם שהגיעה
   שורה משבוע גבוה יותר, או כשלא הייתה סימנייה. שני דברים הזיזו
   אותו באמצע שבוע: תלמיד שהקדים וסימן את ב: (שבוע 2), והעברת
   מגילה שמחקה את הסימנייה. בשני המקרים כל מי שסיים לפני כן —
   ובשבוע הראשון זה כל מי שלמד בפתיחה המוקדמת — נעלם מהלוח של
   הצוות ומהמונה. עכשיו הגבול זז רק כשהלוח עובר לשבוע חדש, והוא
   יושב לפני השורה הראשונה שנושאת את השבוע הזה. */
function markBump_(wk, row) {
  var cur = progWeek_();
  var m = markGet_();
  /* קדימה בלבד, ורק עם הלוח. */
  if (m && parseInt(m.wk, 10) >= cur) return;
  markFind_(cur);
}
/* עמודת השבוע בלבד — קריאה אחת, פעם בשבוע. */
function markFind_(cur) {
  var sh = sheet_(LEARN_TAB);
  if (!sh) return;
  var last = sh.getLastRow();
  if (last < 2) return;
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0], iw = -1;
  for (var h = 0; h < head.length; h++) if (String(head[h]).trim() === 'שבוע') iw = h;
  if (iw < 0) return;
  var col = sh.getRange(2, iw + 1, last - 1, 1).getDisplayValues();
  var first = last + 1;
  for (var i = 0; i < col.length; i++) {
    if (parseInt(col[i][0], 10) >= cur) { first = i + 2; break; }
  }
  markSet_(cur, first - MARK_PAD);
}

/* שורות "לימוד" מהסימנייה ואילך, עם שורת הכותרת בראשן. בלי
   סימנייה — הכל, וזו גם התשובה הנכונה בשבוע הראשון. */
function learnSlice_() {
  var sh = sheet_(LEARN_TAB);
  if (!sh || sh.getLastRow() < 2) return { rows: [], from: 2, all: true };
  var last = sh.getLastRow(), wide = sh.getLastColumn();
  var m = markGet_();
  var from = (m && m.row > 2 && m.row <= last) ? m.row : 2;
  if (from <= 2) {
    return { rows: sh.getDataRange().getDisplayValues(), from: 2, all: true };
  }
  var head = sh.getRange(1, 1, 1, wide).getDisplayValues()[0];
  var body = sh.getRange(from, 1, last - from + 1, wide).getDisplayValues();
  return { rows: [head].concat(body), from: from, all: false, wk: m.wk };
}

/* `full` — לקרוא את הלשונית כולה ולבנות את המונים מאפס. זו
   האמת המלאה, והיא רצה כל שעה מהטריגר וגם בספירה ידנית.

   בלי `full` — תוספתי: קוראים רק מהסימנייה, מחשבים מחדש את
   השבועות שמופיעים שם, ומשאירים את שורות המונה של השבועות
   הקודמים כפי שהן. זה מה שרץ בכל סימון של תלמיד, ולכן זה מה
   שחייב להיות זול. */
function recountLearn_(full) {
  try {
    var src = sheet_(LEARN_TAB);
    if (!src) return;
    if (src.getLastRow() < 2) {
      writeCount_(LCOUNT_TAB, ['מסלול', 'שבוע', 'קוד ישיבה', 'סיימו'], []);
      return;
    }
    if (!full) return recountLearnPart_();
    /* **רק שורות סיום.**

       מאז שנוספה שמירת המקום בדף, אותה לשונית נושאת שני סוגי
       שורות: סיום (קטע = מתוך, או שורה ישנה בלי העמודות כלל),
       והתקדמות באמצע (קטע < מתוך). המונה סופר מזהים ייחודיים
       ולכן שורת התקדמות הספיקה כדי לספור את התלמיד כמי שסיים —
       כלומר "כבר 7 סיימו השבוע" כלל גם את מי שהגיע ל-10 אחוז.

       הלוח כבר ידע להבדיל; המונה הציבורי לא, וזה המספר שהתלמידים
       רואים. הסינון כאן, לפני הספירה. */
    var t = tally_(doneRows_(src.getDataRange().getDisplayValues()),
                   ['מסלול', 'שבוע', 'קוד ישיבה'], 'מזהה');
    if (!t) return;
    writeCount_(LCOUNT_TAB, ['מסלול', 'שבוע', 'קוד ישיבה', 'סיימו'],
      t.order.map(function (k) {
        var p = k.split('\u0001');
        return [p[0], p[1], p[2], t.n[k]];
      }));
  } catch (err) {}
}

/* ספירה תוספתית: רק השבועות שנמצאים אחרי הסימנייה.

   השורות של השבועות הקודמים נשארות בלשונית המונים כפי שהן —
   הן כבר חושבו, ומה שקרה לפני שבוע אינו משתנה. מה שכן משתנה
   הוא רק השבוע שרץ עכשיו, וזה בדיוק מה שנקרא.

   אם משהו כאן נכשל — הספירה המלאה שרצה כל שעה מתקנת. */
function recountLearnPart_() {
  var slice = learnSlice_();
  if (slice.all) return recountLearn_(true);          /* אין סימנייה */

  /* **רק שבועות שהפרוסה מכסה במלואם.**

     כאן ישב פגם שהבדיקה תפסה: הסימנייה נסוגה 200 שורות אחורה
     לשוליים, ולכן הפרוסה מכילה גם *זנב* של השבוע הקודם. חישוב
     מחדש של שבוע מתוך זנב שלו מחליף מספר נכון במספר חלקי —
     גרוע יותר מלא לגעת בו בכלל. במדידה: שבוע שהיו בו 305
     סיומים ירד ל-200.

     השבוע של הסימנייה ומעלה מכוסים בוודאות, כי הסימנייה יושבת
     לפני השורה הראשונה שלהם. כל מה שמתחת — נשאר כפי שהוא. */
  var base = parseInt(slice.wk, 10);
  var head = slice.rows[0], iw = -1;
  for (var h = 0; h < head.length; h++) if (String(head[h]).trim() === 'שבוע') iw = h;
  if (iw < 0 || !(base > 0)) return recountLearn_(true);

  var mine = [head];
  for (var r = 1; r < slice.rows.length; r++) {
    if (parseInt(slice.rows[r][iw], 10) >= base) mine.push(slice.rows[r]);
  }

  var t = tally_(doneRows_(mine), ['מסלול', 'שבוע', 'קוד ישיבה'], 'מזהה');
  if (!t) return;

  var touched = {};
  t.order.forEach(function (k) { touched[k.split('\u0001')[1]] = 1; });

  var out = sheet_(LCOUNT_TAB), keep = [];
  if (out && out.getLastRow() > 1) {
    var cur = out.getDataRange().getDisplayValues();
    for (var i = 1; i < cur.length; i++) {
      var wk = String(cur[i][1] || '').trim();
      if (!wk || touched[wk]) continue;                /* יחושב מחדש */
      if (String(cur[i][0] || '').trim()) keep.push(cur[i].slice(0, 4));
    }
  }
  var fresh = t.order.map(function (k) {
    var p = k.split('\u0001');
    return [p[0], p[1], p[2], t.n[k]];
  });
  writeCount_(LCOUNT_TAB, ['מסלול', 'שבוע', 'קוד ישיבה', 'סיימו'],
              keep.concat(fresh));
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
/* ---- אזור הניהול האישי: מי ביקש, ומה הוחלט ---- */
var ACC_TAB = 'גישה';
var ACC_HEAD = ['מזהה', 'שם', 'טלפון', 'ישיבה', 'קוד ישיבה', 'תפקיד', 'מצב',
                'קוד במכשיר', 'ביקש', 'נראה', 'הוחלט'];
function accAsk_(inst, dev, has) {
  inst = String(inst || '').trim(); dev = String(dev || '').trim();
  if (!inst || !dev || dev.length < 6) return { status: 'none' };
  /* מי המכשיר — השורה האחרונה שלו ב"התראות", של אותה ישיבה. */
  var ps = sheet_('התראות');
  if (ps.getLastRow() < 2) return { status: 'none' };
  var pv = ps.getDataRange().getDisplayValues(), ph = pv[0], pi = {};
  for (var i = 0; i < ph.length; i++) pi[String(ph[i]).trim()] = i;
  var me = null;
  for (var r = pv.length - 1; r >= 1; r--) {
    if (String(pv[r][pi['מזהה']] || '').trim() !== dev) continue;
    if (String(pv[r][pi['קוד ישיבה']] || '').trim() !== inst) continue;
    me = pv[r]; break;
  }
  if (!me) return { status: 'none' };
  var g = function (k) { return pi[k] === undefined ? '' : String(me[pi[k]] || '').trim(); };

  var sh = sheet_(ACC_TAB);
  if (!sh.getLastRow()) headRow_(sh, ACC_HEAD);
  var head = headers_(sh), ix = {};
  for (var h = 0; h < head.length; h++) ix[String(head[h]).trim()] = h;
  var st = '', row = -1;
  if (sh.getLastRow() > 1) {
    var av = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getDisplayValues();
    for (var a = 0; a < av.length; a++) {
      if (String(av[a][ix['מזהה']] || '').trim() !== dev) continue;
      row = a + 2; st = String(av[a][ix['מצב']] || '').trim(); break;
    }
  }
  var cols = [['מזהה', dev], ['שם', g('שם')], ['טלפון', g('טלפון')],
              ['ישיבה', g('ישיבה')], ['קוד ישיבה', inst], ['תפקיד', g('תפקיד')],
              ['קוד במכשיר', has ? 'כן' : ''], ['נראה', new Date()]];
  if (row < 0) {
    st = 'ממתין';
    cols.push(['מצב', st]); cols.push(['ביקש', new Date()]);
    upsertCols_(ACC_TAB, cols, 'מזהה');
    /* הרכז יודע מיד — זה מה שמאפשר "בשעות הקרובות". */
    coordPing_('🔑 לאימות: ' + (g('שם') || 'איש צוות'),
      (g('ישיבה') || inst) + (g('תפקיד') ? ' · ' + g('תפקיד') : '') +
      (g('טלפון') ? ' · ' + g('טלפון') : ''), './#admin-acc');
  } else {
    upsertCols_(ACC_TAB, cols, 'מזהה');
  }
  if (st === 'נעול') return { status: 'locked', phone: !!g('טלפון') };
  if (st !== 'אושר') return { status: 'wait', phone: !!g('טלפון') };
  return { status: 'ok', k: ensureCode_(inst, newCode_()) };
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
/* `inner` — לשימוש השרת בלבד (שליחה להורים, sayPeople_): כל
   מזהי התלמיד ומזהי ההורה המחובר, וההורים שאינם מחוברים. אינו
   יוצא לשום לוח. */
function boardData_(inst, k, withTest, inner) {
  inst = String(inst || '').trim();
  /* '*' — כל הישיבות יחד, וגם מי שאינו משויך לאף אחת. לרכז בלבד:
     הקורא (`?board=*`) כבר בדק את READ_KEY, ולכן אין כאן קוד מוסד. */
  var all = inst === '*';
  var code = all ? '*' : getCode_(inst);
  if (all) k = '*';
  if (!code) return { status: 'nocode',
    message: 'לא הוגדר קוד גישה למוסד הזה. בקשו מרכז התוכנית קישור אישי.' };
  if (String(k || '').trim() !== code) return { status: 'denied',
    message: 'הקוד אינו מתאים לישיבה הזו.' };

  /* מי סימן מה. הסקריפט אינו יודע מהו "השבוע" — הלוח יודע,
     ולכן כאן חוזרים כל השבועות והחישוב נשאר בצד אחד. */
  /* שתי צורות של אותה לשונית.

     שורה בלי "קטע" — או כזו שבה קטע = מתוך — היא סיום. שורה שבה
     קטע קטן ממתוך היא **התקדמות באמצע**: התלמיד פתח את הדף,
     למד חלק, ויצא. הצוות צריך לראות גם אותה — "לא סיים" ו"לא
     התחיל" הם שני מצבים שונים לגמרי, ורק אחד מהם דורש תזכורת.

     מכל שורות ההתקדמות של אותו תלמיד באותו שבוע נלקחת הגבוהה
     ביותר. הוא נשלח כמה פעמים במהלך השבוע, ומה שמעניין הוא
     כמה רחוק הוא הגיע ולא מתי. */
  var done = {}, pos = {};
  try {
    /* רק מהסימנייה ואילך. הלוח שואל שאלה אחת — מי סיים את הדף
       של השבוע — ולכן היסטוריה של חודשים אינה נדרשת לו כלל.
       `weeks` שחוזר מכאן מכסה את השבוע הנוכחי, וזה מה שהלקוח
       בודק. */
    var lr = learnSlice_().rows;
    if (lr.length > 1) {
      var lh = lr[0], li = {};
      for (var a = 0; a < lh.length; a++) li[String(lh[a]).trim()] = a;
      for (var b = 1; b < lr.length; b++) {
        if (!all && String(lr[b][li['קוד ישיבה']] || '').trim() !== inst) continue;
        var id = String(lr[b][li['מזהה']] || '').trim();
        if (!id) continue;
        var tag = String(lr[b][li['מסלול']] || '') + '|' + String(lr[b][li['שבוע']] || '');
        var at  = li['קטע']  === undefined ? '' : String(lr[b][li['קטע']]  || '').trim();
        var of  = li['מתוך'] === undefined ? '' : String(lr[b][li['מתוך']] || '').trim();
        var n1 = parseInt(at, 10), n2 = parseInt(of, 10);
        if (!at || !(n2 > 0) || n1 >= n2) {
          (done[id] = done[id] || {})[tag] = 1;
        } else {
          var f = n1 / n2;
          if (!pos[id]) pos[id] = {};
          if (!(pos[id][tag] >= f)) pos[id][tag] = f;
        }
      }
    }
  } catch (e) {}

  var out = [];
  /* מי שאישר התראות — מזהה → 1. רק בתצוגת כל הישיבות. */
  var pushSet = {}, blockSet = {}, seenSet = {}, whySet = {}, devSet = {}, goneSet = {}, lastSub = {}, brSet = {};
  if (all) {
    try {
      var psh = sheet_('התראות');
      if (psh.getLastRow() > 1) {
        var pv = psh.getDataRange().getDisplayValues(), ph = pv[0], pix = -1, psx = -1;
        for (var q0 = 0; q0 < ph.length; q0++) {
          if (String(ph[q0]).trim() === 'מזהה') pix = q0;
          if (String(ph[q0]).trim() === 'מנוי') psx = q0;
        }
        if (pix >= 0 && psx >= 0) {
          var prx = ph.indexOf('תוצאה'), pdx = ph.indexOf('מכשיר'), pbx = ph.indexOf('דפדפן');
          for (var q1 = 1; q1 < pv.length; q1++) {
            var pid0 = String(pv[q1][pix] || '').trim();
            if (!pid0) continue;
            /* המכשיר והסיבה האחרונה שדווחה — כדי שמספר "בלי התראות"
               יתפרק ל"אייפון שלא הותקן", "חסום", "טרם אושר". */
            if (pdx >= 0 && String(pv[q1][pdx] || '').trim()) devSet[pid0] = String(pv[q1][pdx]).trim();
            /* הדפדפן והגרסה שדיווח המכשיר (ריק בשורות ישנות — "לא ידוע"). */
            if (pbx >= 0 && String(pv[q1][pbx] || '').trim()) brSet[pid0] = String(pv[q1][pbx]).trim();
            if (prx >= 0 && !String(pv[q1][psx] || '').trim() && String(pv[q1][prx] || '').trim())
              whySet[pid0] = String(pv[q1][prx]).trim();
            if (String(pv[q1][psx] || '').trim()) { pushSet[pid0] = 1; lastSub[pid0] = String(pv[q1][psx]); }
            /* שורה בלי מנוי = דיווח שההתראות חסומות אצלו (או שלא הצליח). */
            else if (prx >= 0 && /חסום|נדחה|לא הצליח/.test(String(pv[q1][prx] || ''))) blockSet[pid0] = 1;
            seenSet[pid0] = 1;
          }
          /* ============================================================
             מנוי שפג (404/410) — "פג", ולא "מנוי פעיל".
             ============================================================
             השליחות (tools/sched.js · markGone) רושמות ב"נשלחו" מפתח
             `פג|<טביעה>` — 12 תווי SHA-1 של כתובת הדחיפה. כאן נבדק
             **המנוי האחרון** של כל מזהה: פג — אין לו התראות, והמצב 'gone'.
             מנוי חדש נותן טביעה אחרת, ולכן חוזר להיות פעיל מעצמו. */
          var gone = goneKeys_();
          if (gone) {
            for (var gp in lastSub) {
              var ep = '';
              try { ep = String(JSON.parse(lastSub[gp]).endpoint || ''); } catch (ge) {}
              if (ep && gone[subPrint_(ep)]) { delete pushSet[gp]; goneSet[gp] = 1; }
            }
          }
        }
      }
    } catch (pe) {}
  }
  try {
    var js = sheet_(JOIN_TAB);
    if (js.getLastRow() > 1) {
      var jr = js.getDataRange().getDisplayValues(), jh = jr[0], ji = {};
      /* ההצלבה נעשית על **כל** הנרשמים ולא על הישיבה הזו בלבד:
         אבא ובן אינם תמיד מסמנים את אותה ישיבה, ואב שסימן
         ישיבה אחרת עדיין אביו של הבן הזה. */
      var pm = pairMap_(jr);
      /* מה שסומן ממכשיר שנבלע אחר כך — נספר לאותו אדם. */
      var bam = aliasMap_(jr);
      for (var al in bam) {
        var cn = bam[al], t0;
        for (t0 in (done[al] || {})) (done[cn] = done[cn] || {})[t0] = 1;
        for (t0 in (pos[al] || {})) {
          if (!pos[cn]) pos[cn] = {};
          if (!(pos[cn][t0] >= pos[al][t0])) pos[cn][t0] = pos[al][t0];
        }
      }
      for (var c = 0; c < jh.length; c++) ji[String(jh[c]).trim()] = c;
      var cell = function (r, name) {
        return ji[name] === undefined ? '' : String(r[ji[name]] || '').trim();
      };
      /* כל המזהים של כל אדם — גם של הורה מישיבה אחרת. */
      var idsOf = {}, dads = {}, info = {};
      for (var d0 = 1; d0 < jr.length; d0++) {
        var pid0x = cell(jr[d0], 'מזהה');
        if (!pid0x) continue;
        idsOf[pid0x] = rowIdsOf_(pid0x, cell(jr[d0], ALIAS_COL));
        /* לתצוגת כל הישיבות: פרטי ההורה שבשורת הבן, והורים שלא חוברו. */
        if (all) info[pid0x] = { id: pid0x, first: cell(jr[d0], 'שם'), last: cell(jr[d0], 'משפחה'),
          phone: cell(jr[d0], 'טלפון'), inst: cell(jr[d0], 'קוד ישיבה'),
          instName: cell(jr[d0], 'ישיבה'), dad: cell(jr[d0], 'תפקיד') === 'הורה',
          test: cell(jr[d0], 'בדיקה') === 'כן' ? 1 : 0 };
        if (cell(jr[d0], 'תפקיד') === 'הורה' &&
            (withTest || cell(jr[d0], 'בדיקה') !== 'כן')) {
          dads[pid0x] = { inst: cell(jr[d0], 'קוד ישיבה'), ids: idsOf[pid0x] };
        } else delete dads[pid0x];
      }
      var byId = {}, order = [];
      for (var d = 1; d < jr.length; d++) {
        var row = jr[d];
        if (!all && cell(row, 'קוד ישיבה') !== inst) continue;
        /* משתמש בדיקה — רק כשהלוח עצמו נפתח במכשיר בדיקה. */
        var isTest = cell(row, 'בדיקה') === 'כן';
        if (isTest && !withTest) continue;
        var pid = cell(row, 'מזהה');
        if (!pid) continue;
        if (!(pid in byId)) order.push(pid);
        byId[pid] = {
          id: pid,
          /* לתצוגת כל הישיבות — לאיזו ישיבה שייך. ריק או 'other' =
             לא משויך. */
          inst:  cell(row, 'קוד ישיבה'),
          instName: cell(row, 'ישיבה'),
          /* לרכז בלבד (כל הישיבות, בסיסמה): הטלפון — לכפתור וואטסאפ
             ליד מי שאין לו התראות — וכל המזהים שלו, כדי ששליחה אישית
             תגיע גם למכשיר שנבלע. הלוח של ראש החטיבה אינו מקבל טלפון. */
          phone: all ? cell(row, 'טלפון') : undefined,
          ids:   all ? rowIdsOf_(cell(row, 'מזהה'), cell(row, ALIAS_COL)) : undefined,
          first: cell(row, 'שם'),
          /* שם משפחה יוצא עכשיו גם הוא. עד עכשיו הוגבל לשם פרטי
             בלבד, וזו הייתה הגנה נכונה כל עוד הלוח נועד למספרים;
             מרגע שהוא רשימת נוכחות שהצוות עובד לפיה, "יונתן"
             לבדו אינו מזהה אף אחד בשכבה של ארבעים. הקוד עדיין
             שומר על מי שרואה — טלפונים אינם יוצאים מכאן. */
          last:  cell(row, 'משפחה'),
          grade: cell(row, 'שכבה'),
          /* **הכיתה, ולא רק השכבה.** היא נאספה בהרשמה מהיום
             הראשון ופשוט לא נמסרה הלאה — ובלעדיה אי אפשר
             להראות לר"ם את הכיתה שלו. שכבה היא ארבע כיתות. */
          klass: cell(row, 'כיתה'),
          way:   cell(row, 'מסגרת'),
          role:  cell(row, 'תפקיד'),
          with:  cell(row, 'שם ההורה'),        /* שם פרטי בלבד */
          test:  isTest ? 1 : 0,
          weeks: [],
          pos:   {}                            /* 'מסלול|שבוע' → 0–1 */
        };
      }
      order.forEach(function (pid) {
        var p = byId[pid];
        /* הלוח הוא רשימת הנוכחות של תלמידי הישיבה. אבא אינו
           תלמיד שלה, ושמו אינו צריך להגיע לצוות — מה שהצוות
           צריך לדעת יושב על שורת הבן. */
        if (p.role === 'הורה') return;
        /* זיווג מאומת: שני הצדדים נרשמו בפועל. בלעדיו נשאר
           מה שהתלמיד **הצהיר** — וזה הבדל שהצוות צריך לראות,
           כי "מילא את השם של אבא" אינו "אבא לומד איתו". */
        if (pm[pid] && pm[pid]['with']) {
          p['with'] = pm[pid]['with'];
          p.withOk  = 1;
        }
        var parIds = [];
        ((pm[pid] && pm[pid].pids) || []).forEach(function (x) {
          (idsOf[x] || [x]).forEach(function (y) { if (parIds.indexOf(y) < 0) parIds.push(y); });
        });
        if (inner) { p._ids = idsOf[pid] || [pid]; p._par = parIds; }
        /* **כל ההורים, ולא רק הראשון.** `par` למטה הוא ההורה
           הראשון בלבד (לשורה הנפתחת); הספירה בניהול צריכה את
           כולם — תלמיד שאבא ואמא שניהם נרשמו נספר עם שניים. */
        /* בלי הורי בדיקה: הספירה (PplCount ב-ways.js) אינה כוללת
           רשומות בדיקה, וכאן אין לה דרך לדעת מי מהם בדיקה. */
        if (all) p.pars = ((pm[pid] && pm[pid].pids) || []).filter(function (x) {
          return !(info[x] && info[x].test);
        });
        if (all) p.push = pushSet[pid] || (p.ids || []).some(function (x) { return pushSet[x]; }) ? 1 : 0;
        /* מצב ההתראות: 'on' מנוי פעיל · 'blocked' דיווח חסימה · 'none'
           לא נרשם · '?' יש שורה בלי מנוי ובלי סיבה. */
        if (all) {
          var any = function (set) { return set[pid] || (p.ids || []).some(function (x) { return set[x]; }); };
          p.pstate = p.push ? 'on' : any(goneSet) ? 'gone' : any(blockSet) ? 'blocked' : any(seenSet) ? '?' : 'none';
          var one = function (set) {
            if (set[pid]) return set[pid];
            for (var z = 0; z < (p.ids || []).length; z++) if (set[p.ids[z]]) return set[p.ids[z]];
            return '';
          };
          if (!p.push) p.why = one(whySet);
          p.dev = one(devSet);
          p.br = one(brSet);
        }
        /* להורה המחובר יש התראות? — לכפתור ✉ ולמספרים בשליחה. */
        if (all) p.parPush = parIds.some(function (x) { return pushSet[x]; }) ? 1 : 0;
        /* ופרטיו — לשורה הנפתחת במסך "אנשים" של הרכז. */
        var pp0 = all && pm[pid] && pm[pid].pids ? info[pm[pid].pids[0]] : null;
        if (pp0) {
          p.par = { id: pp0.id, first: pp0.first, last: pp0.last, phone: pp0.phone,
                    push: (idsOf[pp0.id] || [pp0.id]).some(function (x) { return pushSet[x]; }) ? 1 : 0 };
        }
        for (var t in (done[pid] || {})) p.weeks.push(t);
        /* התקדמות מוחזרת רק לשבוע שלא הושלם — אחרת היא סותרת
           את הסימון ומייצרת שני מספרים לאותו דבר. */
        for (var t2 in (pos[pid] || {})) {
          if (!(done[pid] || {})[t2]) p.pos[t2] = Math.round(pos[pid][t2] * 100) / 100;
        }
        out.push(p);
      });
    }
  } catch (e2) {}

  var res = { status: 'ok', inst: inst, students: out };
  if (inner) res.dads = dads;
  /* הורים שלא חוברו לאף תלמיד — כדי שגם הם יופיעו במסך "אנשים".
     הורה מחובר מופיע בשורה של הבן. */
  if (all && !inner) {
    try {
      var pmA = pairMap_(js.getDataRange().getDisplayValues());
      res.parents = [];
      for (var q9 in info) {
        var o9 = info[q9];
        if (!o9.dad || (pmA[q9] && pmA[q9].pids && pmA[q9].pids.length)) continue;
        if (o9.test && !withTest) continue;
        res.parents.push({ id: o9.id, first: o9.first, last: o9.last, phone: o9.phone,
          inst: o9.inst, instName: o9.instName, test: o9.test,
          ids: idsOf[q9] || [q9],
          push: (idsOf[q9] || [q9]).some(function (x) { return pushSet[x]; }) ? 1 : 0 });
      }
    } catch (e9) {}
  }
  return res;
}

/* ============================================================
   שליחה להורים — מי הם.
   ============================================================
   הורה אינו נושא שכבה, ולא סיום של דף: אלה של הבן. ולכן
   הפילוח (ישיבה, שכבה, כיתה, דרך לימוד, סיימו / לא, בחירה ידנית)
   נעשה על **התלמידים**, ומהם עוברים להורה המחובר (pairMap_).
   'p' = ההורים בלבד · 'pk' = התלמיד וההורה שלו יחד.

   בלי שום צמצום מלבד הישיבה — נוספים גם הורים שנרשמו לישיבה
   ועדיין לא חוברו לבן. כך "כל ההורים" אינו מצומצם ממה שהיה.

   מחזיר את כל המזהים (כולל מכשירים שנבלעו), ומספר האנשים. */
function sayPeople_(scope, isAdm, withTest, f, grade, klass) {
  var bd = isAdm ? boardData_('*', '*', withTest, true)
                 : boardData_(scope, getCode_(scope), withTest, true);
  if (!bd || bd.status !== 'ok') return { ids: [], kids: 0, dads: 0 };
  var inScope = function (code, name) {
    return !isAdm || !scope || code === scope || name === scope;
  };
  var wk = f.wk ? '|' + f.wk : '';
  var ids = [], kidN = 0, dadSeen = {};
  var add = function (list) {
    (list || []).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); });
  };
  bd.students.forEach(function (p) {
    if (!inScope(p.inst, p.instName)) return;
    if (grade && p.grade !== grade) return;
    if (klass && p.klass !== klass) return;
    if (f.way && p.way !== f.way) return;
    if (f.ids && !p._ids.some(function (x) { return f.ids.indexOf(x) >= 0; })) return;
    if (f.seg && wk) {
      var end = function (t) { return t.slice(-wk.length) === wk; };
      var my = p.weeks.some(end) ? 'done'
             : (Object.keys(p.pos).some(end) ? 'mid' : 'none');
      if (f.seg === 'todo' ? my === 'done' : my !== f.seg) return;
    }
    if (f.par === 'pk') { add(p._ids); kidN++; }
    if (p._par.length && !dadSeen[p._par[0]]) { dadSeen[p._par[0]] = 1; add(p._par); }
  });
  var plain = !grade && !klass && !f.way && !f.ids && !f.seg;
  if (plain) {
    for (var d in bd.dads) {
      var dd = bd.dads[d];
      if (isAdm ? (scope && dd.inst !== scope) : dd.inst !== scope) continue;
      if (dadSeen[dd.ids[0]]) continue;
      dadSeen[dd.ids[0]] = 1; add(dd.ids);
    }
  }
  return { ids: ids, kids: kidN, dads: Object.keys(dadSeen).length };
}

/* ============================================================
   מי לומד עם מי — ההצלבה.
   ============================================================
   אבא ובן נרשמים בנפרד, כל אחד במכשיר שלו, ואיש מהם אינו יודע
   את המזהה של השני. מה שכן משותף להם הוא **הטלפון**: הבן מסר
   את של אביו, האב מסר את של בנו, ולפחות אחד מהשניים תמיד
   קיים. זו נקודת החיבור.

   שלושה חוטים, וכל אחד מהם לבדו מספיק:
     · הטלפון שהאב מסר על הבן = הטלפון של הבן
     · הטלפון שהבן מסר על אביו = הטלפון של האב
     · מזהה המזמין — מי שנרשם דרך קישור הזמנה נושא אותו איתו,
       וזה החוט החזק ביותר כי אין בו ניחוש בכלל.

   **מזווגים רק כשצד אחד הוא הורה והשני אינו.** שני חברים
   שרשמו זה את הטלפון של זה יתאימו גם הם — ולסמן אותם "לומד
   עם אבא" זה להציג לצוות מידע שגוי על תלמיד. תפקיד הוא מה
   שמבדיל.

   וזה רץ **כאן ולא אצל הקורא**, מסיבה אחת שאינה נתונה לוויכוח:
   ההצלבה היא לפי טלפונים, והלוח של הצוות אינו מקבל טלפונים
   ולא יקבל. מה שיוצא מכאן הוא שם פרטי וסימן, ותו לא.
   ============================================================ */
/* הצורה היחידה שאפשר להשוות בה. 050-123-4567, 0501234567
   ו-+972501234567 הם אותו מספר, ומי שמשווה מחרוזות מפספס
   את שלושתם. */
function phKey_(v) {
  var d = String(v || '').replace(/[^0-9]/g, '');
  if (d.indexOf('972') === 0) d = d.slice(3);
  if (d.indexOf('0')   === 0) d = d.slice(1);
  return d.length >= 8 ? d : '';
}

/* ============================================================
   אדם אחד, כמה מכשירים.
   ============================================================
   המזהה נולד במכשיר (`deviceId` ב-join.html), ולכן מי שנרשם
   מהטלפון ואחר כך מהמחשב היה לשני אנשים: שתי שורות, שני
   מונים, והדפים שסימן בטלפון אינם במחשב. אבא אחד נרשם כך
   פעמיים, והתווית אצלו הראתה חיבור לבן במכשיר אחד ולא בשני.

   הכלל מעכשיו: **טלפון + שם פרטי + שם משפחה + תפקיד הם אדם.**
   שורה חדשה שעונה על אותו מפתח אינה נוספת — היא נבלעת בשורה
   הקיימת, והמזהה של המכשיר החדש נרשם בעמודה "מזהים נוספים".
   המכשיר עצמו שואל אחר כך (`?idFor=`) ועובר למזהה הקבוע.

   אחים שמסרו את הטלפון של אבא כטלפון שלהם אינם מתאחדים — השם
   הפרטי שונה. והשורות של "בן נוסף" (`מזהה:k1`) הן של אבא ועם
   אותו מפתח בדיוק, ולכן אינן נכנסות לחשבון כלל. */
var ALIAS_COL = 'מזהים נוספים';

function nk_(v) { return String(v || '').replace(/["'׳״\s]/g, ''); }

function personKey_(phone, first, last, dad) {
  var p = phKey_(phone), f = nk_(first), l = nk_(last);
  if (!p || !f || !l) return '';
  return p + '|' + f + '|' + l + '|' + (dad ? 'ה' : 'ת');
}

/* "לומדים" כטבלה: שורות תצוגה, אינדקס עמודות, ו-`c(r, שם)`. */
function joinTable_() {
  var sh = sheet_(JOIN_TAB);
  var rows = sh.getLastRow() > 1 ? sh.getDataRange().getDisplayValues() : [];
  var ix = {};
  if (rows.length) for (var i = 0; i < rows[0].length; i++) ix[String(rows[0][i]).trim()] = i;
  return {
    sh: sh, rows: rows, ix: ix,
    c: function (r, n) { return ix[n] === undefined ? '' : String(r[ix[n]] || '').trim(); }
  };
}
/* כל המזהים של שורה — הקבוע ואחריו אלה שנבלעו בו. */
/* אותו דבר, מתאים ישירות. */
function rowIdsOf_(id, aliases) {
  var out = [];
  if (id) out.push(id);
  String(aliases || '').split(/\s+/).forEach(function (a) { if (a) out.push(a); });
  return out;
}
function rowIds_(t, r) {
  var out = [], id = t.c(r, 'מזהה');
  if (id) out.push(id);
  t.c(r, ALIAS_COL).split(/\s+/).forEach(function (a) { if (a) out.push(a); });
  return out;
}
function rowKey_(t, r) {
  if (t.c(r, 'מזהה').indexOf(':k') >= 0) return '';        /* בן נוסף של אבא */
  return personKey_(t.c(r, 'טלפון'), t.c(r, 'שם'), t.c(r, 'משפחה'),
                    t.c(r, 'תפקיד') === 'הורה');
}
/* השורה של מזהה — לפי המזהה עצמו או לפי אחד שנבלע בה. -1 אם אין. */
function rowOfId_(t, id) {
  id = String(id || '').trim();
  if (!id) return -1;
  for (var r = t.rows.length - 1; r >= 1; r--) {
    if (rowIds_(t, t.rows[r]).indexOf(id) >= 0) return r;
  }
  return -1;
}
function rowOfKey_(t, key) {
  if (!key) return -1;
  for (var r = t.rows.length - 1; r >= 1; r--) if (rowKey_(t, t.rows[r]) === key) return r;
  return -1;
}
/* מזהה שנבלע → המזהה הקבוע. לשימוש מי שמצליב "לימוד" מול "לומדים". */
function aliasMap_(rows) {
  var out = {};
  if (!rows || rows.length < 2) return out;
  var iId = -1, iAl = -1;
  for (var i = 0; i < rows[0].length; i++) {
    var h = String(rows[0][i]).trim();
    if (h === 'מזהה') iId = i;
    if (h === ALIAS_COL) iAl = i;
  }
  if (iId < 0 || iAl < 0) return out;
  for (var r = 1; r < rows.length; r++) {
    var id = String(rows[r][iId] || '').trim();
    if (!id) continue;
    String(rows[r][iAl] || '').split(/\s+/).forEach(function (a) { if (a) out[a] = id; });
  }
  return out;
}

/* לפני כתיבה ל"לומדים": אם המזהה כבר מוכר כנבלע — כותבים על
   הקבוע. אם אינו מוכר אבל האדם מוכר — נבלעים בו. אחרת — כמו
   תמיד, שורה משלו. */
function canonJoinCols_(cols, t0) {
  var get = function (n) {
    for (var i = 0; i < cols.length; i++) if (cols[i] && cols[i][0] === n) return String(cols[i][1] || '').trim();
    return '';
  };
  var setv = function (n, v) {
    for (var i = 0; i < cols.length; i++) if (cols[i] && cols[i][0] === n) { cols[i][1] = v; return; }
    cols.push([n, v]);
  };
  var id = get('מזהה');
  if (!id || id.indexOf(':k') >= 0) return cols;
  var t = t0 || joinTable_();
  if (t.rows.length < 2) return cols;
  var r = rowOfId_(t, id);
  if (r >= 1) {
    var canon = t.c(t.rows[r], 'מזהה');
    if (canon && canon !== id) setv('מזהה', canon);
    return cols;
  }
  r = rowOfKey_(t, personKey_(get('טלפון'), get('שם'), get('משפחה'), get('תפקיד') === 'הורה'));
  if (r < 1) return cols;
  var al = t.c(t.rows[r], ALIAS_COL);
  setv('מזהה', t.c(t.rows[r], 'מזהה'));
  setv(ALIAS_COL, (al ? al + ' ' : '') + id);
  return cols;
}

/* מה שסומן כסיום, לכל המזהים של אדם אחד — 'מסלול|שבוע'. כל
   הלשונית ולא מהסימנייה: זו שאלה על כל השנה, והיא נשאלת פעם
   אחת במכשיר. */
function learnedOf_(ids) {
  var out = [], seen = {};
  if (!ids || !ids.length) return out;
  var sh = sheet_(LEARN_TAB);
  if (!sh || sh.getLastRow() < 2) return out;
  var rows = doneRows_(sh.getDataRange().getDisplayValues());
  if (!rows || rows.length < 2) return out;
  var ix = {};
  for (var i = 0; i < rows[0].length; i++) ix[String(rows[0][i]).trim()] = i;
  if (ix['מזהה'] === undefined) return out;
  for (var r = 1; r < rows.length; r++) {
    if (ids.indexOf(String(rows[r][ix['מזהה']] || '').trim()) < 0) continue;
    var tag = String(rows[r][ix['מסלול']] || '') + '|' + String(rows[r][ix['שבוע']] || '');
    if (!seen[tag]) { seen[tag] = 1; out.push(tag); }
  }
  return out;
}

/* ============================================================
   עמדת הלימוד → האפליקציה של התלמיד.
   ============================================================
   מי שנרשם בעמדה בשיעור של הדף השבועי — למד את הדף. אם הוא
   רשום גם באפליקציה (אותו מוסד, אותו שם, אותה שכבה), נכתבת לו
   שורת סיום ב"לימוד", כאילו סימן בעצמו: הוא נספר במונים ובלוח,
   והאפליקציה שלו מסמנת את הדף (`?amdaFor=`).

   ההתאמה שמרנית: שם משפחה + שם פרטי, באותו מוסד. שכבה שמולאה
   ואינה תואמת — לא אותו אדם. שני מועמדים — מכריעה הכיתה, ואם
   עדיין שניים — לא משייכים כלל. עדיף תלמיד שלא סומן לו מאשר
   תלמיד שסומן לו דף של אחר.

   לשונית "עמדה — שיוך" זוכרת מה כבר נכתב, ולכן הרצה חוזרת
   אינה כותבת שוב. שורה כפולה ב"לימוד" לא הייתה מזיקה (הספירה
   לפי מזהה), אבל אין סיבה לייצר אותה.
   ============================================================ */
var AMDA_TAB_  = 'עמדת לימוד';
var AMDA_LINK_ = 'עמדה — שיוך';

function amdaNorm_(s) {
  return String(s || '').replace(/["'׳״`]/g, '').replace(/\s+/g, ' ').trim();
}
function amdaTable_(tab) {
  var sh = sheet_(tab);
  var rows = sh.getLastRow() > 1 ? sh.getDataRange().getDisplayValues() : [];
  var ix = {};
  if (rows.length) for (var i = 0; i < rows[0].length; i++) ix[String(rows[0][i]).trim()] = i;
  return { sh: sh, rows: rows,
           c: function (r, n) { return ix[n] === undefined ? '' : String(r[ix[n]] || '').trim(); } };
}
/* לכל היותר פעם בדקה, ורק כשהנעילה פנויה — הקריאה של העמדה
   אינה מחכה לשיוך. */
function amdaSyncSoon_() {
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get('amdaSync')) return;
    cache.put('amdaSync', '1', 60);
    amdaSyncLocked_();
  } catch (e) {}
}
function amdaSyncLocked_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return 0;
  try { return amdaSync_(); } finally { lock.releaseLock(); }
}
function amdaSync_() {
  var at = amdaTable_(AMDA_TAB_);
  if (at.rows.length < 2) return 0;
  /* מה שכבר שויך: 'מזהה|מסלול|שבוע' */
  var lt = amdaTable_(AMDA_LINK_), had = {};
  for (var l = 1; l < lt.rows.length; l++) {
    had[lt.c(lt.rows[l], 'מזהה') + '|' + lt.c(lt.rows[l], 'מסלול') + '|' + lt.c(lt.rows[l], 'שבוע')] = 1;
    had['k:' + lt.c(lt.rows[l], 'מפתח')] = 1;
  }
  /* המועמדים: שורות של שיעור בדף, עם מוסד, מסלול ושבוע. */
  var want = [], seen = {};
  for (var r = 1; r < at.rows.length; r++) {
    var x = at.rows[r], cx = function (n) { return at.c(x, n); };
    if (cx('סוג') !== 'דף' || !cx('קוד ישיבה') || !cx('מסלול') || !cx('שבוע')) continue;
    var key = [cx('קוד ישיבה'), cx('שכבה'), cx('כיתה'), amdaNorm_(cx('שם')),
               cx('מסלול'), cx('שבוע')].join('|');
    if (seen[key] || had['k:' + key]) continue;
    seen[key] = 1;
    want.push({ key: key, inst: cx('קוד ישיבה'), g: amdaNorm_(cx('שכבה')), c: cx('כיתה'),
                n: amdaNorm_(cx('שם')), track: cx('מסלול'), wk: cx('שבוע'), daf: cx('דף') });
  }
  if (!want.length) return 0;

  /* "לומדים" לפי מוסד ושם — בשני הסדרים, כי הקובץ של בית הספר
     הוא "משפחה פרטי" והטופס שואל כל אחד בנפרד. */
  var jt = joinTable_(), byName = {};
  for (var j = 1; j < jt.rows.length; j++) {
    var jr = jt.rows[j];
    if (jt.c(jr, 'תפקיד') === 'הורה' || !jt.c(jr, 'מזהה')) continue;
    var f = amdaNorm_(jt.c(jr, 'שם')), ln = amdaNorm_(jt.c(jr, 'משפחה'));
    if (!f || !ln) continue;
    [ln + ' ' + f, f + ' ' + ln].forEach(function (nm) {
      var k2 = jt.c(jr, 'קוד ישיבה') + '|' + nm;
      (byName[k2] = byName[k2] || []).push(j);
    });
  }
  var sh = sheet_(LEARN_TAB), head = headers_(sh), wrote = 0, lastWk = 0;
  var lsh = lt.sh, lhead = headers_(lsh);
  want.forEach(function (w) {
    var cand = (byName[w.inst + '|' + w.n] || []).filter(function (j, i, a) {
      if (a.indexOf(j) !== i) return false;
      var g = amdaNorm_(jt.c(jt.rows[j], 'שכבה'));
      return !g || g === w.g;
    });
    if (cand.length > 1) {
      cand = cand.filter(function (j) {
        return String(jt.c(jt.rows[j], 'כיתה')).replace(/\D/g, '') === String(w.c).replace(/\D/g, '');
      });
    }
    if (cand.length !== 1) return;
    var id = jt.c(jt.rows[cand[0]], 'מזהה');
    var tag = id + '|' + w.track + '|' + w.wk;
    if (!had[tag]) {
      var row = [];
      put_(row, idx_(sh, head, 'תאריך'), new Date());
      [['מזהה', id], ['קוד ישיבה', w.inst], ['מסלול', w.track], ['שבוע', w.wk],
       ['דף', w.daf], ['קטע', ''], ['מתוך', ''], ['בדיקה', ''], ['מקור', 'עמדת לימוד']
      ].forEach(function (p) { put_(row, idx_(sh, head, p[0]), cell_(p[1])); });
      for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
      sh.appendRow(row);
      markBump_(w.wk, sh.getLastRow());
      if (+w.wk > lastWk) lastWk = +w.wk;
      wrote++;
      had[tag] = 1;
    }
    var lr = [];
    put_(lr, idx_(lsh, lhead, 'תאריך'), new Date());
    [['מזהה', id], ['מסלול', w.track], ['שבוע', w.wk], ['דף', w.daf], ['מפתח', w.key]
    ].forEach(function (p) { put_(lr, idx_(lsh, lhead, p[0]), cell_(p[1])); });
    for (var q = 0; q < lr.length; q++) if (lr[q] === undefined) lr[q] = '';
    lsh.appendRow(lr);
  });
  if (wrote) recountLearn_();
  return wrote;
}
/* 'מסלול|שבוע' שנרשמו למזהה הזה מהעמדה. */
function amdaLearnedOf_(id) {
  var out = [], seen = {};
  if (!id) return out;
  var lt = amdaTable_(AMDA_LINK_);
  for (var r = 1; r < lt.rows.length; r++) {
    if (lt.c(lt.rows[r], 'מזהה') !== id) continue;
    var tag = lt.c(lt.rows[r], 'מסלול') + '|' + lt.c(lt.rows[r], 'שבוע');
    if (!seen[tag]) { seen[tag] = 1; out.push(tag); }
  }
  return out;
}

/* ניקוי חד-פעמי: אותו אדם בכמה שורות → שורה אחת. נשאר המזהה
   של השורה הראשונה (המכשיר שנרשם ראשון), עם הפרטים של האחרונה
   (הם העדכניים), וכל שאר המזהים עוברים ל"מזהים נוספים". */
function mergePeople_() {
  var t = joinTable_();
  if (t.rows.length < 3 || t.ix['מזהה'] === undefined) return 0;
  var groups = {}, order = [];
  for (var r = 1; r < t.rows.length; r++) {
    var k = rowKey_(t, t.rows[r]);
    if (!k) continue;
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(r);
  }
  var head = headers_(t.sh), iAl = idx_(t.sh, head, ALIAS_COL);
  var toDelete = [], merged = 0;
  order.forEach(function (k) {
    var g = groups[k];
    if (g.length < 2) return;
    var canon = t.c(t.rows[g[0]], 'מזהה'), ids = [];
    g.forEach(function (r) {
      rowIds_(t, t.rows[r]).forEach(function (x) {
        if (x !== canon && ids.indexOf(x) < 0) ids.push(x);
      });
    });
    var keep = g[g.length - 1];
    var row = t.sh.getRange(keep + 1, 1, 1, head.length).getValues()[0];
    row[t.ix['מזהה']] = canon;
    row[iAl] = ids.join(' ');
    t.sh.getRange(keep + 1, 1, 1, row.length).setValues([row]);
    for (var j = 0; j < g.length - 1; j++) toDelete.push(g[j] + 1);
    merged++;
  });
  toDelete.sort(function (a, b) { return b - a; });
  for (var d = 0; d < toDelete.length; d++) t.sh.deleteRow(toDelete[d]);
  return merged;
}

/* מזהה → { with:'שם פרטי של הצד השני', ok:1 }.
   מוחזר רק למי שיש לו זיווג **מאומת**. הצהרה בלבד ("מילאתי
   את השם של אבא") כבר מיוצגת בעמודה עצמה, והבחנה בין השתיים
   היא כל מה שהמסך הזה נועד לתת. */
function pairMap_(rows) {
  var out = {};
  if (!rows || rows.length < 2) return out;
  var head = rows[0], ix = {};
  for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
  if (ix['מזהה'] === undefined) return out;       /* אין את מי לזווג */
  var am = aliasMap_(rows);
  var cell = function (r, n) {
    return ix[n] === undefined ? '' : String(r[ix[n]] || '').trim();
  };

  /* השורה האחרונה לכל מזהה היא הנכונה — מי שתיקן פרטים שלח
     שורה נוספת עם אותו מזהה. */
  var by = {}, order = [];
  for (var r = 1; r < rows.length; r++) {
    var id = cell(rows[r], 'מזהה');
    if (!id) continue;
    if (!(id in by)) order.push(id);
    by[id] = {
      id:    id,
      first: cell(rows[r], 'שם'),
      dad:   cell(rows[r], 'תפקיד') === 'הורה',
      mine:  phKey_(cell(rows[r], 'טלפון')),
      other: phKey_(cell(rows[r], 'טלפון ההורה')),
      wid:   cell(rows[r], 'מזהה המזמין')
    };
  }

  /* שני אינדקסים ולא לולאה בתוך לולאה: אלפיים נרשמים היו
     ארבעה מיליון השוואות, וזה נגמר בפסק הזמן של הסקריפט
     באמצע ספירה — כלומר לוח שמפסיק להתעדכן בלי שום הודעה.

     יותר ממזהה אחד לטלפון קורה באמת — אחים שמסרו את אותו
     טלפון של אבא — ולכן רשימה ולא ערך יחיד. */
  var byPhone = {}, byOther = {};
  for (var a = 0; a < order.length; a++) {
    var p = by[order[a]];
    if (p.mine)  (byPhone[p.mine]  = byPhone[p.mine]  || []).push(p.id);
    if (p.other) (byOther[p.other] = byOther[p.other] || []).push(p.id);
  }

  var link = function (x, y) {
    if (!x || !y || x.id === y.id) return;
    if (x.dad === y.dad) return;                  /* הורה מול תלמיד בלבד */
    if (!out[x.id]) out[x.id] = { 'with': y.first, ok: 1, pids: [] };
    if (!out[y.id]) out[y.id] = { 'with': x.first, ok: 1, pids: [] };
    /* מי בדיוק בצד השני — לשליחה להורה של תלמיד, או לשניהם. */
    if (out[x.id].pids.indexOf(y.id) < 0) out[x.id].pids.push(y.id);
    if (out[y.id].pids.indexOf(x.id) < 0) out[y.id].pids.push(x.id);
  };

  for (var b = 0; b < order.length; b++) {
    var me = by[order[b]];
    /* הטלפון שהוא מסר על הצד השני */
    var hit = me.other ? (byPhone[me.other] || []) : [];
    for (var c = 0; c < hit.length; c++) link(me, by[hit[c]]);
    /* ומי שמסר את הטלפון שלו — הכיוון ההפוך, כשרק צד אחד מילא */
    var back = me.mine ? (byOther[me.mine] || []) : [];
    for (var d = 0; d < back.length; d++) link(me, by[back[d]]);
    /* ומי שנרשם דרך ההזמנה שלו — גם כשההזמנה נשלחה ממכשיר
       שנבלע אחר כך בשורה של אותו אדם. */
    var wid = me.wid ? (am[me.wid] || me.wid) : '';
    if (wid && by[wid]) link(me, by[wid]);
  }
  return out;
}

/* קוד הישיבה מתוך העמודות שנשלחו. `cols` הוא [כותרת, ערך],
   ולכן אין תלות בסדר. */
function instOf_(cols) {
  for (var i = 0; i < (cols || []).length; i++) {
    if (cols[i] && String(cols[i][0]).trim() === 'קוד ישיבה') {
      return String(cols[i][1] || '').trim();
    }
  }
  return '';
}

function markJoined_(code, mas) {
  try {
    code = String(code || '').trim();
    mas = String(mas || '').trim();
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
      /* המסכתות שהישיבה בחרה, בעמודה E.

         כאן ולא בלשונית ההרשמות, ובכוונה: זו לשונית ציבורית,
         והתלמיד צריך לקרוא את הבחירה הזו בלי סיסמה כדי שהבאנר
         שלו ייפתח על המסכת הנכונה. אין בה פרט אישי — שני
         מזהי מסכת. */
      if (mas) {
        if (String(sh.getRange(1, 5).getDisplayValue()).trim() !== 'מסכתות') {
          sh.getRange(1, 5).setValue('מסכתות');
        }
        sh.getRange(i + 2, 5).setValue(mas);
      }
      return;
    }
  } catch (err) {}      /* סימון שנכשל לא יפיל הרשמה */
}

/* ============================================================
   שני אנשי קשר שונים נרשמו לאותו מוסד.
   ============================================================
   "אחד או שניים ימלאו תחת אותה ישיבה — ראש הישיבה, ראש
   החטיבה, רכז תורה לשמה. אני אצטרך שבניהול תשלח אלי התראה...
   ותראה לי מה הם מילאו, ואז אני אראה אם הנתונים תואמים או
   יש סתירה (הוא הזמין 20 גמרות והוא 30)."

   לא חוסמים ולא דורסים — כל הרשמה נכתבת כרגיל. רק כשה"איש
   קשר" שונה מהאחרון שנרשם לאותו קוד מוסד, נכתבת שורת השוואה
   ללשונית נפרדת: מי מילא קודם ומה, מול מי ממלא עכשיו ומה.
   שם זהה לאחרון הוא עדכון רגיל של אותו אדם (ראו `regDupWarn`
   בלקוח) ואינו נחשב כאן.
   ============================================================ */
function flagRegConflict_(d) {
  try {
    var code = String(d.code || '').trim();
    var who = String(d.who || '').trim();
    if (!code || !who || code === 'other') return;
    var sh = sheet_('הרשמות');
    if (!sh || sh.getLastRow() < 2) return;
    var head = headers_(sh);
    var ixCode = head.indexOf('קוד'), ixWho = head.indexOf('איש קשר');
    if (ixCode < 0 || ixWho < 0) return;
    var ixInst  = head.indexOf('ישיבה');
    var ixPhone = head.indexOf('טלפון');
    var ixTotal = head.indexOf('סה"כ גמרות');
    var ixAt    = head.indexOf('תאריך');
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getDisplayValues();
    /* האחרון עם שם אחר — לא הראשון: אם כבר היו כמה עדכונים
       של אותו איש קשר שני, ההשוואה הרלוונטית היא מול מה
       שהוא מילא לאחרונה, לא מול הניסיון הראשון שלו. */
    var prev = null, i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (String(r[ixCode] || '').trim() !== code) continue;
      var w = String(r[ixWho] || '').trim();
      if (!w || w === who) continue;
      prev = r;
    }
    if (!prev) return;
    appendCols_('התנגשויות הרשמה', [
      ['קוד ישיבה', code],
      ['ישיבה', ixInst >= 0 ? prev[ixInst] : (d.inst || '')],
      ['איש קשר קודם', prev[ixWho]],
      ['טלפון קודם', ixPhone >= 0 ? prev[ixPhone] : ''],
      ['סה"כ גמרות קודם', ixTotal >= 0 ? prev[ixTotal] : ''],
      ['נרשם קודם', ixAt >= 0 ? prev[ixAt] : ''],
      ['איש קשר חדש', who],
      ['טלפון חדש', d.phone || ''],
      ['סה"כ גמרות חדש', d.total || 0]
    ]);
  } catch (err) {}      /* בדיקה שנכשלה לא תיפול על ההרשמה עצמה */
}

/* ============================================================
   התלמידים בלבד — בלי ההורים.
   ============================================================
   "מצטרפים" הוא המספר שמוצג לנער שעוד לא נרשם ("כבר 14
   בישיבה שלך"), והוא גם המספר שנמדד מול היעד השנתי. אבא
   שנרשם אינו תלמיד, ואם הוא נספר שם — המספר שהנער רואה
   מנופח, והיעד נמדד מול משהו אחר.

   ההורים לא נעלמים: הם ברשימת המשתתפים שבניהול, והם מסומנים
   על שורת הבן בלוח הצוות. הם פשוט אינם נספרים כתלמידים.

   **שורה בלי עמודת "תפקיד" היא תלמיד.** כל מה שנרשם עד היום
   נכתב לפני שהעמודה קיימת, וברירת מחדל אחרת הייתה מוחקת את
   כולם מהספירה בבת אחת.
   ============================================================ */
function studentRows_(rows) {
  rows = noTestRows_(rows);
  if (!rows || rows.length < 2) return rows;
  var head = rows[0], iR = -1;
  for (var i = 0; i < head.length; i++) {
    if (String(head[i]).trim() === 'תפקיד') iR = i;
  }
  if (iR < 0) return rows;                       /* לשונית ישנה — הכל תלמידים */
  var out = [head];
  for (var r = 1; r < rows.length; r++) {
    if (String(rows[r][iR] || '').trim() !== 'הורה') out.push(rows[r]);
  }
  return out;
}

/* השורה האחרונה של כל מזהה (שורה בלי מזהה — נשארת). */
function lastPerId_(rows) {
  if (!rows || rows.length < 2) return rows;
  var head = rows[0], iId = -1, at = {}, out = [head];
  for (var i = 0; i < head.length; i++) {
    if (String(head[i]).trim() === 'מזהה') iId = i;
  }
  if (iId < 0) return rows;
  for (var r = 1; r < rows.length; r++) {
    var id = String(rows[r][iId] || '').trim();
    if (id) at[id] = r;
  }
  for (var r2 = 1; r2 < rows.length; r2++) {
    var id2 = String(rows[r2][iId] || '').trim();
    if (!id2 || at[id2] === r2) out.push(rows[r2]);
  }
  return out;
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
    recountRows_(src.getDataRange().getDisplayValues());
  } catch (err) {}          /* מונה שנכשל לא יפיל הרשמה של תלמיד */
}

/* הספירה עצמה, על שורות שכבר נקראו — כדי שההרשמה (joinWrite_)
   לא תקרא את כל הלשונית פעם נוספת רק בשביל המונה. */
function recountRows_(all) {
  try {
    var rows = studentRows_(all);

    /* סך המצטרפים לכל ישיבה */
    var t = tally_(rows, ['קוד ישיבה'], 'מזהה');
    if (!t) return;

    /* ופילוח — לפי שכבה ולפי מסגרת. הלוח של ראש החטיבה מציג
       אותו, וזה עדיין מספרים בלבד: מי שרואה "ח׳ — 11" אינו
       יודע מי אחד עשר. */
    /* **כל תלמיד פעם אחת — לפי השורה האחרונה שלו.** תלמיד
       שנרשם "לבד" ותיקן ל"חבורה" נספר בשתיהן, והמשבצות בניהול
       הראו 113+17+97 ליד 222 תלמידים. */
    var last = lastPerId_(rows);
    var byG = tally_(last, ['קוד ישיבה', 'שכבה'],  'מזהה');
    var byW = tally_(last, ['קוד ישיבה', 'מסגרת'], 'מזהה');
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
/* ראו `contactSave` ב-doGet. אותה השוואת שמות של המוקד (nameKey
   ב-index.html): בלי גרשיים ובלי רווחים כפולים. */
var CONTACT_TAB_ = 'אנשי קשר';
function ckey_(v) {
  return String(v == null ? '' : v).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/^'/, '').replace(/["'\u05F4\u05F3]/g, '').replace(/\s+/g, ' ').trim();
}
function contactSave_(cd) {
  if (!CONTACTS_ID) throw new Error('חסר CONTACTS_ID וגם PRIVATE_ID — אנשי קשר לא נכתבים לגיליון הראשי');
  var name = String(cd && cd.name || '').trim();
  if (!name) return { status: 'error', message: 'חסר שם ישיבה' };
  var people = (cd.people || []).filter(function (q) { return q && (q.name || q.phone); });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(CONTACT_TAB_, CONTACTS_ID);
    var data = sh.getLastRow() ? sh.getDataRange().getDisplayValues() : [];
    var want = ckey_(name), at = -1;
    for (var r = 0; r < data.length; r++) {
      for (var c = 0; c < Math.min(3, data[r].length); c++) {
        if (ckey_(data[r][c]) === want) { at = r; break; }
      }
      if (at >= 0) break;
    }
    var digits = function (v) { return String(v || '').replace(/\D/g, ''); };
    if (at < 0) {
      var row = [name];
      people.forEach(function (q) {
        row.push(String(q.name || ''));
        if (q.phone) row.push(cell_(String(q.phone)));
        if (q.phone2) row.push(cell_(String(q.phone2)));
      });
      if (cd.last) row.push('TRUE');
      sh.appendRow(row);
      return { status: 'ok', saved: 1, created: 1, added: people.length };
    }
    var have = {}, phones = {}, last = 0;
    data[at].forEach(function (v, i) {
      if (String(v).trim()) last = i + 1;
      var k = ckey_(v); if (k) have[k] = 1;
      var d = digits(v); if (d.length >= 9) phones[d] = 1;
    });
    var add = [];
    people.forEach(function (q) {
      var p1 = digits(q.phone), p2 = digits(q.phone2);
      if ((q.name && have[ckey_(q.name)]) || (p1 && phones[p1]) || (p2 && phones[p2])) return;
      add.push(String(q.name || ''));
      if (q.phone) add.push(cell_(String(q.phone)));
      if (q.phone2) add.push(cell_(String(q.phone2)));
    });
    if (add.length) sh.getRange(at + 1, last + 1, 1, add.length).setValues([add]);
    return { status: 'ok', saved: 1, created: 0, added: add.length ? 1 : 0 };
  } finally { lock.releaseLock(); }
}

function clearTab_(tab, ssId) {
  var id = ssId || privId_(tab);
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

/* ============================================================
   לאיזה גיליון הולכת לשונית — ולשונית פרטית **רק** לגיליון הפרטי.
   ============================================================
   עד עכשיו PRIVATE_ID ריק פירושו "הכול לגיליון הראשי": מאפיין
   שנמחק, או קוד שהודבק בלי המאפיינים, והשמות והטלפונים נכתבו
   בשקט לגיליון שמשותף לצפייה. עכשיו זו שגיאה — הכתיבה נכשלת
   והקורא מקבל את ההודעה, ושום דבר אינו נכתב לגלוי.
   לשונית שאינה פרטית — '' (הגיליון הראשי), כמו קודם. */
function privId_(tab) {
  if (PRIVATE_TABS.indexOf(tab) < 0) return '';
  if (!PRIVATE_ID) throw new Error('חסר PRIVATE_ID — הלשונית "' + tab +
    '" פרטית, ולא תיכתב לגיליון הציבורי. יש להגדיר את מזהה הגיליון הפרטי במאפייני הסקריפט.');
  return PRIVATE_ID;
}

/* מחיקת שורות לפי ערך בעמודה — שורה אחת או כמה, בלי לגעת בשאר.
   `col` הוא שם הכותרת ולא מספר: מיקום העמודה משתנה כשנוסף שדה
   חדש באפליקציה, והשם אינו משתנה.

   המחיקה מלמטה למעלה, אחרת כל מחיקה מזיזה את מה שמתחתיה
   והאינדקסים הבאים מצביעים על השורה הלא נכונה. */
function delRows_(tab, col, vals, ssId) {
  var id = ssId || privId_(tab);
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

/* ============================================================
   הסרה הפיכה — "ארכיון" במקום מחיקה.
   ============================================================
   "מחיקה" מהלוח הייתה deleteRow אחרי confirm אחד, ובלי דרך חזרה.
   עכשיו השורות של האדם ב"לומדים" **עוברות** ללשונית "ארכיון"
   (פרטית), כמו שהן — כל עמודה בשמה — ומשם אפשר להחזיר אותן.

   מה עובר לארכיון (ונעלם מהרשימה, מהספירה ומהשליחה לפי רשימה):
     · כל השורות ב"לומדים" שהמזהה שלהן הוא המזהה הזה — כולל
       "מזהים נוספים", כלומר הכינויים של מכשירים שאוחדו לאדם הזה.
       הם חוזרים יחד איתו.
   מה נשאר במקומו, בלי שום שינוי:
     · ההתקדמות ("לימוד") — לפי מזהה מכשיר. בשחזור היא שוב שלו.
     · ההורים המקושרים — שורות משלהם. הקישור מחושב מהטלפונים
       ומקישור ההזמנה (pairMap_), ולכן בהסרה ההורה נעשה "לא
       מקושר", ובשחזור הקישור חוזר מעצמו.
     · מנוי ההתראות ("התראות") — אינו נמחק. הסרה אינה ביטול מנוי.
   שום דבר לא נמחק מהארכיון אוטומטית. שחזור מוחק מהארכיון רק
   אחרי שהשורות נכתבו בחזרה ל"לומדים" ונקראו משם.
   ============================================================ */
var ARCH_TAB = 'ארכיון';
var ARCH_HEAD = ['מתי', 'מזהה', 'שם', 'משפחה', 'ישיבה', 'תפקיד', 'לשונית', 'שורה'];

function archivePerson_(id) {
  id = String(id || '').trim();
  if (!id) return { status: 'error', message: 'חסר מזהה' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var js = sheet_(JOIN_TAB), data = js.getDataRange().getDisplayValues();
    if (data.length < 2) return { status: 'success', moved: 0 };
    var head = data[0].map(function (h) { return String(h).trim(); });
    var ci = head.indexOf('מזהה');
    if (ci < 0) return { status: 'error', message: 'אין עמודה בשם מזהה' };
    var c = function (r, n) { var i = head.indexOf(n); return i < 0 ? '' : String(data[r][i] || ''); };
    var hit = [];
    for (var r = 1; r < data.length; r++) if (String(data[r][ci]).trim() === id) hit.push(r);
    if (!hit.length) return { status: 'success', moved: 0 };

    var ash = sheet_(ARCH_TAB);
    if (!ash.getLastRow()) headRow_(ash, ARCH_HEAD);
    var before = ash.getLastRow(), at = new Date();
    hit.forEach(function (r) {
      var o = {};
      head.forEach(function (h, i) { if (h) o[h] = data[r][i]; });
      ash.appendRow([at, id, c(r, 'שם'), c(r, 'משפחה'), c(r, 'ישיבה'), c(r, 'תפקיד'),
                     JOIN_TAB, JSON.stringify(o)]);
    });
    /* נכתב? רק אז מוחקים מהמקור. */
    if (ash.getLastRow() - before !== hit.length) {
      return { status: 'error', message: 'הכתיבה לארכיון לא הושלמה — לא הוסר דבר' };
    }
    for (var i = hit.length - 1; i >= 0; i--) js.deleteRow(hit[i] + 1);
    reTally_(JOIN_TAB);
    return { status: 'success', moved: hit.length };
  } finally { lock.releaseLock(); }
}

function restorePerson_(id) {
  id = String(id || '').trim();
  if (!id) return { status: 'error', message: 'חסר מזהה' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ash = sheet_(ARCH_TAB);
    if (ash.getLastRow() < 2) return { status: 'error', message: 'אין בארכיון שורה כזו' };
    var a = ash.getDataRange().getValues(), ah = a[0].map(function (h) { return String(h).trim(); });
    var ai = ah.indexOf('מזהה'), ar = ah.indexOf('שורה'), at = ah.indexOf('לשונית');
    var hit = [];
    for (var r = 1; r < a.length; r++) {
      if (String(a[r][ai]).trim() === id && String(a[r][at]) === JOIN_TAB) hit.push(r);
    }
    if (!hit.length) return { status: 'error', message: 'אין בארכיון שורה כזו' };

    var js = sheet_(JOIN_TAB), head = headers_(js);
    hit.forEach(function (r) {
      var o = JSON.parse(String(a[r][ar] || '{}')), row = [];
      for (var k in o) put_(row, idx_(js, head, k), cell_(o[k]));
      for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
      js.appendRow(row);
    });
    /* חזר? רק אז יוצא מהארכיון. */
    var back = 0, jd = js.getDataRange().getDisplayValues(), ji = jd[0].map(function (h) {
      return String(h).trim(); }).indexOf('מזהה');
    for (var q = 1; q < jd.length; q++) if (String(jd[q][ji]).trim() === id) back++;
    if (back < hit.length) return { status: 'error', message: 'השחזור לא נקרא בחזרה — הארכיון נשאר כמו שהוא' };
    for (var j = hit.length - 1; j >= 0; j--) ash.deleteRow(hit[j] + 1);
    reTally_(JOIN_TAB);
    return { status: 'success', restored: hit.length };
  } finally { lock.releaseLock(); }
}

/* רשימת הארכיון ללוח: אדם אחד לכל מזהה, בלי טלפון. */
function archiveList_() {
  var ash = sheet_(ARCH_TAB), out = [], seen = {};
  if (ash.getLastRow() < 2) return { status: 'ok', people: [] };
  var a = ash.getDataRange().getDisplayValues(), h = a[0].map(function (x) { return String(x).trim(); });
  var c = function (r, n) { var i = h.indexOf(n); return i < 0 ? '' : String(a[r][i] || ''); };
  for (var r = a.length - 1; r >= 1; r--) {
    var id = c(r, 'מזהה');
    if (!id || seen[id]) continue;
    seen[id] = 1;
    out.push({ id: id, first: c(r, 'שם'), last: c(r, 'משפחה'), instName: c(r, 'ישיבה'),
               role: c(r, 'תפקיד'), at: c(r, 'מתי') });
  }
  return { status: 'ok', people: out };
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
  return 'הטריגר הותקן · ספירה מחדש כל שעה' + '\n' + setupClock();
}
/* כל שעה — ספירה מלאה. זו רשת הביטחון של המנגנון התוספתי. */
function autoRecount() {
  try { taanitShift_(); } catch (e) {}
  try { megilaShift_(); } catch (e) {}
  /* תלמיד שנרשם לאפליקציה אחרי שלמד בעמדה — משויך כאן. */
  try { amdaSyncLocked_(); } catch (ae) {}
  recount_(); recountLearn_(true); backupDaily_();
}

/* ============================================================
   תענית: דף ב התחלק לשני שבועות.
   ============================================================
   שבוע 1 הוא ב. ושבוע 2 הוא ב: — ולכן דפים ג–כ"ד זזו שבוע אחד
   קדימה (י, שנפל לפני חנוכה, זז שניים: חנוכה נשארה במקומה).
   מכ"ה והלאה לא זז דבר. ראו CAL_TAANIT ב-data.js.

   כל מה שנשמר בגיליון לפי מספר שבוע עובר לשבוע החדש של **אותו
   דף**:
   · "לימוד" ו"זוגות" — לפי עמודת הדף שבשורה, ולכן זה נכון גם
     לשורה שנכתבה כבר בגרסה החדשה וגם לשורה ממכשיר שעוד לא
     התעדכן. לכן זה רץ שוב בכל שעה, ואינו מזיז שורה פעמיים.
   · "מצגות" — אין בה דף, ולכן היא עוברת פעם אחת בלבד, לפי
     השבוע הישן, ונרשמת כ"בוצע".
   אחרי שינוי — ספירה מלאה, והסימנייה של הספירה התוספתית נמחקת.
   ============================================================ */
var TAANIT_SHIFT_KEY = 'taanitShiftAB';
/* הדף → השבוע בלוח החדש. 'ב.' ו-'ב:' הם שני העמודים של דף ב. */
var TAANIT_WK = { 'ב.':1, 'ב:':2, 'ג':3, 'ד':4, 'ה':5, 'ו':6, 'ז':7, 'ח':8, 'ט':9,
  'י':11, 'יא':12, 'יב':13, 'יג':14, 'יד':15, 'טו':16, 'טז':17, 'יז':18, 'יח':19,
  'יט':20, 'כ':21, 'כא':22, 'כב':23, 'כג':24, 'כד':25 };
/* השבוע הישן → החדש, לשורה שאין בה דף. */
var TAANIT_OLD = { 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:11, 11:12, 12:13, 13:14,
  14:15, 15:16, 16:17, 17:18, 18:19, 19:20, 20:21, 21:22, 22:23, 23:24, 24:25 };

/* ============================================================
   מגילה — אותו פיצול (8.99.132).
   ============================================================
   שבוע 1 = ב., שבוע 2 = ב:, וכל דף מ-ג והלאה זז שבוע (י — שניים,
   חנוכה במקומה). במגילה אין חופשה שסופגת את ההזזה, ולכן ל"ב נלמד
   בשבוע הסיום (36). אותו מנגנון בדיוק של תענית, עם מפות משלה.
   ============================================================ */
var MEGILA_SHIFT_KEY = 'megilaShiftAB';
var MEGILA_WK = { 'ב.':1, 'ב:':2, 'ג':3, 'ד':4, 'ה':5, 'ו':6, 'ז':7, 'ח':8, 'ט':9,
  'י':11, 'יא':12, 'יב':13, 'יג':14, 'יד':15, 'טו':16, 'טז':17, 'יז':18, 'יח':19,
  'יט':20, 'כ':21, 'כא':22, 'כב':23, 'כג':24, 'כד':25, 'כה':26, 'כו':27,
  'כז':31, 'כח':32, 'כט':33, 'ל':34, 'לא':35, 'לב':36, 'לב.':36 };
var MEGILA_OLD = { 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:11, 11:12, 12:13, 13:14,
  14:15, 15:16, 16:17, 17:18, 18:19, 19:20, 20:21, 21:22, 22:23, 23:24, 24:25,
  25:26, 26:27, 27:31, 31:32, 32:33, 33:34, 34:35, 35:36 };

var SHIFT_TAANIT = { names: ['taanit', 'תענית'], wk: TAANIT_WK, old: TAANIT_OLD };
var SHIFT_MEGILA = { names: ['megila', 'מגילה'], wk: MEGILA_WK, old: MEGILA_OLD };

function taanitWk_(daf, wk, once, sp) {
  sp = sp || SHIFT_TAANIT;
  var d = String(daf || '').replace(/["'׳״\s]/g, '');
  /* דף ב בלי עמוד — שורה ישנה (הדף כולו, שבוע 1) או ממכשיר שעוד
     לא התעדכן. שבוע 1 או 2 נשאר כמו שהוא. */
  if (d === 'ב') return wk === 2 ? 2 : 1;
  if (sp.wk[d]) return sp.wk[d];
  if (!d && once && sp.old[wk]) return sp.old[wk];
  return wk;
}

/* `byDaf` — יש עמודת דף. בלעדיה רק בהרצה הראשונה. */
function taanitTab_(tab, trackCol, byDaf, once, sp) {
  sp = sp || SHIFT_TAANIT;
  var id = privId_(tab);
  var ss = id ? SpreadsheetApp.openById(String(id)) : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) return 0;
  var rows = sh.getDataRange().getDisplayValues(), head = rows[0], ix = {};
  for (var h = 0; h < head.length; h++) ix[String(head[h]).trim()] = h;
  var it = ix[trackCol], iw = ix['שבוע'], idf = byDaf ? ix['דף'] : undefined;
  if (it === undefined || iw === undefined) return 0;
  if (!byDaf && !once) return 0;
  var col = [], n = 0;
  for (var r = 1; r < rows.length; r++) {
    var wk = parseInt(rows[r][iw], 10), nw = wk;
    var tr = String(rows[r][it] || '').trim();
    if (sp.names.indexOf(tr) >= 0 && wk > 0) {
      nw = taanitWk_(idf === undefined ? '' : rows[r][idf], wk, once, sp);
    }
    if (nw !== wk) n++;
    col.push([nw > 0 ? nw : rows[r][iw]]);
  }
  if (n) sh.getRange(2, iw + 1, col.length, 1).setValues(col);
  return n;
}

function taanitShift_() {
  var P = PropertiesService.getScriptProperties();
  var once = !P.getProperty(TAANIT_SHIFT_KEY);
  var n = taanitTab_(LEARN_TAB, 'מסלול', true, once) +
          taanitTab_('זוגות', 'מסלול', true, once);
  if (once) n += taanitTab_('מצגות', 'מסכת', false, true);
  if (once) P.setProperty(TAANIT_SHIFT_KEY, new Date().toISOString());
  if (n) {
    try { P.deleteProperty(MARK_KEY); } catch (e) {}
    recountLearn_(true);
  }
  return n;
}

function megilaShift_() {
  var P = PropertiesService.getScriptProperties();
  var once = !P.getProperty(MEGILA_SHIFT_KEY);
  var n = taanitTab_(LEARN_TAB, 'מסלול', true, once, SHIFT_MEGILA) +
          taanitTab_('זוגות', 'מסלול', true, once, SHIFT_MEGILA);
  if (once) n += taanitTab_('מצגות', 'מסכת', false, true, SHIFT_MEGILA);
  if (once) P.setProperty(MEGILA_SHIFT_KEY, new Date().toISOString());
  if (n) {
    try { P.deleteProperty(MARK_KEY); } catch (e) {}
    recountLearn_(true);
  }
  return n;
}

/* ============================================================
   השעון של השליחות המתוזמנות.
   ============================================================
   "רשמתי לעצמי תזכורות ולא הגיעה לי התראה."

   הסיבה הייתה בשעון. הקרון של GitHub הוא **מאמץ סביר ולא
   הבטחה**: הוא התבקש לרוץ כל חצי שעה, וביומן ההרצות נראו כשש
   הרצות ביממה במקום ארבעים ושמונה. השולחים כבר יודעים להשלים
   מה שנפספס, ולכן שום הודעה כבר לא הולכת לאיבוד — אבל היא
   מגיעה באיחור של שעות, ותזכורת שמאחרת בחמש שעות אינה שווה
   הרבה.

   הטריגר של גוגל **כן** רץ בזמן. הוא מצית כאן את אותה הרצה
   ב-GitHub, בדיוק כמו "כמה מכיתתך הצטרפו" — אותו גשר, אותו
   אסימון, ורק שם אירוע אחר.

   שני השעונים חיים זה לצד זה בכוונה: אם אחד מהם שותק, השני
   עדיין מריץ. מה שמונע כפילות אינו התזמון אלא לשונית "נשלחו",
   ולכן אין נזק בכך ששניהם יעבדו.
   ============================================================ */
function clockTick() {
  backupDaily_();
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  if (!tok || !repo) return;
  try {
    UrlFetchApp.fetch(GH_API + repo + '/dispatches', {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + tok,
                 Accept: 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2022-11-28' },
      payload: JSON.stringify({ event_type: 'push-clock', client_payload: {} }),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

/* התקנה והסרה. הרצה חוזרת אינה מכפילה — מוחקת קודם. */
function setupClock() {
  var all = ScriptApp.getProjectTriggers(), i;
  for (i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'clockTick') ScriptApp.deleteTrigger(all[i]);
  }
  /* **ואומרים מה לעשות, ולא רק מה חסר.** שם של מאפיין הוא
     אבחנה; מה שהאדם צריך הוא הצעד הבא. אותם שני ערכים משרתים
     גם את "שליחת הודעה לצוות" ממסך הניהול. */
  if (!prop_('GH_TOKEN', '') || !prop_('GH_REPO', '')) {
    return 'השעון לא הותקן. בעורך Apps Script: Project Settings ← ' +
           'Script Properties ← Add script property, פעמיים:\n' +
           'GH_TOKEN = אסימון GitHub עם הרשאת Contents: write לריפו\n' +
           'GH_REPO = ahiasaf/Hadaf-Hashvui\n' +
           'ואז ללחוץ כאן שוב. אותם שניים מפעילים גם את שליחת ' +
           'ההודעות לצוות ממסך הניהול.';
  }
  ScriptApp.newTrigger('clockTick').timeBased().everyMinutes(30).create();
  return 'שעון השליחות הותקן · כל חצי שעה';
}
function removeClock() {
  var all = ScriptApp.getProjectTriggers(), n = 0, i;
  for (i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'clockTick') {
      ScriptApp.deleteTrigger(all[i]); n++;
    }
  }
  return n ? 'שעון השליחות הוסר' : 'לא היה שעון להסיר';
}
function hasClock_() {
  try {
    var all = ScriptApp.getProjectTriggers();
    for (var i = 0; i < all.length; i++)
      if (all[i].getHandlerFunction() === 'clockTick') return true;
  } catch (e) {}
  return false;
}

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

var SS_OPEN_ = {};
function sheet_(tab, ssId) {
  /* מפורש גובר, ואחריו הניתוב לפי שם הלשונית. בלי הניתוב הזה כל
     כתיבה של פרטים אישיים הייתה תלויה בכך שהצד ששלח אותה ידע
     לאן — והתלמיד אינו יודע. */
  var id = ssId || privId_(tab);
  /* פתיחה אחת לכל גיליון בכל הרצה. הרשמה אחת פתחה את הגיליון
     הסגור שלוש-ארבע פעמים, וכל פתיחה עולה זמן בתוך הנעילה. */
  var ss = id ? (SS_OPEN_[id] || (SS_OPEN_[id] = SpreadsheetApp.openById(String(id))))
              : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(tab) || ss.insertSheet(tab);
}

/* ============================================================
   כתיבת קובץ לריפו.

   GitHub דורש את ה-sha של הקובץ הקיים כדי לדרוס אותו, ואינו
   מקבל sha כשהקובץ חדש. לכן קודם שואלים, ורק אז כותבים — ושתי
   התשובות (200 ו-404) שתיהן תקינות.
   ============================================================ */
var GH_API = 'https://api.github.com/repos/';

/* ============================================================
   הפילוח של "מילה לתלמידים" — מי מתוך הישיבה יקבל.
   ============================================================
   **כל שדה כאן רק מצמצם.** ההיקף (הישיבה, או הכיתה של הר"ם)
   נקבע למעלה לפי קוד הגישה, ו-push-send.js מסנן קודם לפיו ורק
   אחר כך לפי אלה. לכן אין כאן שום הרשאה — רק ניקוי צורה.

     seg  'done' סיימו · 'todo' עוד לא סיימו (באמצע + לא התחילו)
          · 'mid' התחילו ולא סיימו · 'none' לא התחילו
     wk   מספר השבוע (1…) שעליו מדובר ב-seg
     way  מסגרת: 'לימוד עצמי' / 'חבורת לימוד' / 'אבות ובנים'
     ids  מזהי תלמידים מסוימים — "ישר כוח" מהלוח
     per  1 = להחליף {name} בשם הפרטי של כל נמען
   ============================================================ */
function sayFlt_(raw) {
  var f;
  try { f = JSON.parse(String(raw || '')); } catch (e) { return ''; }
  if (!f || typeof f !== 'object') return '';
  var out = {};
  if (/^(done|todo|mid|none)$/.test(String(f.seg || ''))) out.seg = String(f.seg);
  var wk = parseInt(f.wk, 10);
  if (wk >= 1 && wk <= 60) out.wk = wk;
  if (out.seg && !out.wk) delete out.seg;
  var way = String(f.way || '');
  if (way === 'לימוד עצמי' || way === 'חבורת לימוד' || way === 'אבות ובנים') out.way = way;
  if (f.ids && f.ids.length) {
    out.ids = [];
    for (var i = 0; i < f.ids.length && i < 60; i++) {
      var id = String(f.ids[i] || '');
      if (/^[\w:.\-]{1,60}$/.test(id)) out.ids.push(id);
    }
    if (!out.ids.length) delete out.ids;
  }
  if (f.par === 'p' || f.par === 'pk') out.par = f.par;
  if (f.per) out.per = 1;
  for (var k in out) if (out.hasOwnProperty(k)) return JSON.stringify(out);
  return '';
}

/* מצית את ה-workflow ששולח. `repository_dispatch` הוא הדלת
   הרשמית להפעלה מבחוץ, והמטען נוסע איתו — כלומר אין צורך
   בלשונית ביניים ואין השהיה של סקר. */
function ghFire_(title, body, only, grade, klass, who, link, role, wait, flt, quiet) {
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  if (!body) return { status:'error',  message:'אין מה לשלוח' };
  /* **מזהה לכל שליחה.** הוא נוסע עם ההודעה ל-GitHub, וההרצה מדווחת
     עליו בסוף (`?sayDone=`) — "יצאה ל-N" או "נכשלה". בלעדיו "נשלח"
     במסך אמר רק שגוגל קיבל את הבקשה, ולא שמשהו הגיע למישהו. */
  var sid = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  var res0;
  if (!tok)  res0 = { status:'denied', message:'לא הוגדר GH_TOKEN במאפייני הסקריפט' };
  else if (!repo) res0 = { status:'denied', message:'לא הוגדר GH_REPO במאפייני הסקריפט' };
  else {
    try {
      var res = UrlFetchApp.fetch(GH_API + repo + '/dispatches', {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + tok,
                   Accept: 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28' },
        payload: JSON.stringify({
          event_type: 'push-say',
          /* **הכתובת נוסעת עם ההודעה.** בלעדיה כל התראה נחתה
             על המסך שבמקרה היה פתוח, ואי אפשר היה להזמין
             מישהו למקום מסוים. */
          client_payload: { title: title, body: body, only: only,
                            grade: grade || '', klass: klass || '',
                            url: link || '', role: role || '',
                            /* לא ריק = שולחים רק למי שביקש התראה על
                               הדף הזה (לשונית "ממתינים לדף"). */
                            wait: wait || '',
                            /* הפילוח — ראו sayFlt_. JSON אחד, כי
                               GitHub מקבל עד עשרה שדות במטען. זה
                               העשירי: המזהה. */
                            flt: flt || '', sid: sid }
        }),
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      /* 204 = התקבל. כל דבר אחר הוא סירוב, ואומרים אותו. */
      res0 = code === 204 ? { status:'ok', sid: sid }
        : { status:'error', code: code,
            message: 'GitHub החזיר ' + code + ' — ' +
                     'ייתכן שלאסימון אין הרשאת Contents/Actions' };
    } catch (err) {
      res0 = { status:'error', message: String(err) };
    }
  }
  /* **כל הודעה נרשמת, גם כזו שלא יצאה** — עם כל מה שצריך כדי לשלוח
     אותה שוב בדיוק כמו שהייתה (`?resend=`). ערוץ שידור לקטינים בלי
     יומן הוא ערוץ שאיש אינו יודע מה עבר בו.
     גם התראות מערכת לרכז (`quiet`) נרשמות, עם התוצאה — אבל כישלון
     שלהן אינו מתריע (אחרת התרעה על התרעה, בלי סוף). */
  try {
    appendCols_('הודעות', [
        ['מי', who || 'רכז'], ['ישיבה', only || 'כולם'],
        ['קהל', quiet ? 'מכשירי רכז' : ''],
        ['שכבה', grade || ''], ['כיתה', klass || ''],
        ['כותרת', title], ['הטקסט', body],
        ['תפקיד', role || ''], ['פילוח', String(flt || '').slice(0, 40000)],
        ['יעד', only || ''], ['קישור', link || ''], ['ממתינים', wait || ''],
        ['מזהה שליחה', sid],
        ['תוצאה', res0.status === 'ok' ? 'ממתין' : 'נכשלה: ' + (res0.message || '')]
    ]);
  } catch (e3) {}
  if (!quiet && res0.status !== 'ok') sayAlert_(who, only, body, res0.message);
  return res0;
}

/* התראה לרכז — לכל מכשיר שנרשם בתפקיד "רכז" (ניהול ← ההתראות
   במכשיר הזה). נרשמת ביומן ("מערכת" · "מכשירי רכז") עם התוצאה, אבל
   אינה מתריעה על עצמה אם נכשלה. */
/* `link` — לאן הלחיצה על ההתראה מובילה. בלעדיו — מסך הניהול. */
function coordPing_(title, body, link) {
  try { ghFire_(title, body, '', '', '', 'מערכת', link || 'admin', 'רכז', '', '', true); } catch (e) {}
}
function sayAlert_(who, only, body, why) {
  coordPing_('⚠ הודעה לא יצאה',
    (who || 'רכז') + (only ? ' · ' + only : '') + ': ' +
    String(body || '').slice(0, 80) + (why ? ' (' + String(why).slice(0, 60) + ')' : ''));
}

/* שורת היומן של שליחה, לפי המזהה שלה. null = אין (למשל התראת מערכת). */
function sayRow_(sid) {
  var sh = sheet_('הודעות');
  if (!sh.getLastRow() || sh.getLastRow() < 2) return null;
  var vals = sh.getDataRange().getValues(), h = vals[0], ix = {};
  for (var i = 0; i < h.length; i++) ix[String(h[i]).trim()] = i;
  if (ix['מזהה שליחה'] === undefined) return null;
  for (var r = vals.length - 1; r >= 1; r--) {
    if (String(vals[r][ix['מזהה שליחה']]) === sid) return { sh: sh, r: r + 1, v: vals[r], ix: ix };
  }
  return null;
}

/* בדיקת GH_TOKEN/GH_REPO בלי לכתוב שום קובץ — לשימוש "בדיקת חיבור"
   בלבד. כתיבה בפועל (`ghPut_`) יוצאת מהאפליקציה ב-`no-cors`, כלומר
   תשובתה אטומה ואי אפשר לדעת ממנה למה נכשלה — רק "לא הגיעו".
   הבדיקה כאן עוברת דרך doGet, שהתשובה שלו כן נקראת, ולכן זה
   המקום היחיד שיכול להגיד את הסיבה האמיתית. */
function ghCheck_() {
  var tok = prop_('GH_TOKEN', ''), repo = prop_('GH_REPO', '');
  if (!tok && !repo) return { ok: false, message: 'לא הוגדרו GH_TOKEN ו-GH_REPO' };
  if (!tok)  return { ok: false, message: 'לא הוגדר GH_TOKEN' };
  if (!repo) return { ok: false, message: 'לא הוגדר GH_REPO' };
  try {
    var res = UrlFetchApp.fetch(GH_API + repo, {
      headers: { Authorization: 'Bearer ' + tok,
                 Accept: 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2022-11-28' },
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200) {
      var j = {};
      try { j = JSON.parse(res.getContentText()) || {}; } catch (e2) {}
      if (j.permissions && j.permissions.push === false) {
        return { ok: false, message:
          'הטוקן מחובר לריפו ' + repo + ', אבל בלי הרשאת כתיבה — ' +
          'ב-GitHub: Contents ← Read and write.' };
      }
      return { ok: true, message: 'מחובר ל-' + repo + ' עם הרשאת כתיבה ✓' };
    }
    if (code === 401) return { ok: false, message: 'הטוקן שגוי או פג תוקף (401).' };
    if (code === 404) return { ok: false, message:
      'לא נמצא ריפו "' + repo + '", או שלטוקן אין אליו גישה (404).' };
    return { ok: false, message: 'GitHub החזיר שגיאה (קוד ' + code + ').' };
  } catch (e) {
    return { ok: false, message: 'לא הצלחתי להתחבר ל-GitHub: ' + String(e) };
  }
}

function ghPut_(path, b64, msg) {
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  if (!tok)  return { status:'denied', message:'לא הוגדר GH_TOKEN במאפייני הסקריפט' };
  if (!repo) return { status:'denied', message:'לא הוגדר GH_REPO במאפייני הסקריפט' };
  path = String(path || '').replace(/^\/+/, '');
  if (!path || !b64) return { status:'error', message:'חסר נתיב או תוכן' };
  /* נתיב שיוצא מהתיקייה הוא כתיבה למקום שלא התכוונו אליו */
  if (path.indexOf('..') >= 0) return { status:'error', message:'נתיב לא חוקי' };

  var url = GH_API + repo + '/contents/' + path;
  var head = { Authorization: 'Bearer ' + tok,
               Accept: 'application/vnd.github+json',
               'X-GitHub-Api-Version': '2022-11-28' };
  var sha = '';
  try {
    var got = UrlFetchApp.fetch(url + '?ref=main',
      { headers: head, muteHttpExceptions: true });
    if (got.getResponseCode() === 200) {
      sha = (JSON.parse(got.getContentText()) || {}).sha || '';
    }
  } catch (e) {}

  var body = { message: msg || ('הוספת ' + path), content: b64, branch: 'main' };
  if (sha) body.sha = sha;
  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'put', contentType: 'application/json',
      headers: head, payload: JSON.stringify(body), muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200 || code === 201) return { status:'ok', path:path, replaced:!!sha };
    return { status:'error', code:code,
             message: String(res.getContentText()).slice(0, 200) };
  } catch (e) {
    return { status:'error', message: String(e) };
  }
}

/* מוחק קובץ אחד מהענף הראשי. רק מתחת ל-slides/ ול-audio/ — מה
   שהרכז העלה בעצמו. קוד, נתונים ועמודי הדף אינם נמחקים מכאן. */
function ghDel_(path, msg) {
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  if (!tok)  return { status:'denied', message:'לא הוגדר GH_TOKEN במאפייני הסקריפט' };
  if (!repo) return { status:'denied', message:'לא הוגדר GH_REPO במאפייני הסקריפט' };
  path = String(path || '').replace(/^\/+/, '');
  if (!path || path.indexOf('..') >= 0 || !/^(slides|audio)\/[^\/]+\/[^\/]+$/.test(path)) {
    return { status:'error', message:'נתיב לא חוקי' };
  }
  var url = GH_API + repo + '/contents/' + path;
  var head = { Authorization: 'Bearer ' + tok,
               Accept: 'application/vnd.github+json',
               'X-GitHub-Api-Version': '2022-11-28' };
  try {
    var got = UrlFetchApp.fetch(url + '?ref=main', { headers: head, muteHttpExceptions: true });
    if (got.getResponseCode() === 404) return { status:'ok', path:path, gone:true };
    var sha = (JSON.parse(got.getContentText()) || {}).sha || '';
    if (!sha) return { status:'error', message:'הקובץ לא נמצא' };
    var res = UrlFetchApp.fetch(url, {
      method: 'delete', contentType: 'application/json', headers: head,
      payload: JSON.stringify({ message: msg || ('מחיקת ' + path), sha: sha, branch: 'main' }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200) return { status:'ok', path:path };
    return { status:'error', code:code, message: String(res.getContentText()).slice(0, 200) };
  } catch (e) {
    return { status:'error', message: String(e) };
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ============================================================
   גיבוי יומי של הדף האינטראקטיבי.
   ============================================================
   "הסימונים הם הנכס שאני רוצה לשמור."

   פעם ביום — בכתיבה הראשונה ללשוניות האלה, או בטריגר השעתי,
   מה שבא קודם — כל אחת מהן מועתקת לגיליון גיבוי **פרטי** נפרד,
   לשונית לכל יום: "2026-09-28 · סימוני הדף". העותק נלקח **לפני**
   הכתיבה, ולכן גם כתיבה הרסנית משאירה מאחוריה את המצב של אתמול.
   נשמרים BACKUP_DAYS ימים אחרונים.

   גיליון ולא עותק של קובץ בדרייב: להעתקת קבצים הסקריפט היה צריך
   הרשאת כתיבה לדרייב, ובקשת הרשאה חדשה מפילה את כל הסקריפט עד
   שמאשרים אותה. גיליון חדש והעתקת לשוניות — בהרשאה שכבר קיימת.

   הגיליון נוצר בפעם הראשונה בדרייב של בעל הסקריפט, ומזהה שלו
   נשמר ב-BACKUP_ID. לשחזור: פותחים אותו, מעתיקים את הלשונית של
   היום הרצוי, ומדביקים על הלשונית שבגיליון הציבורי.
   ============================================================ */
var GUARD_TABS = ['סימוני הדף', 'פירוש', 'שאלות בדף', 'מצגת', 'מצגות'];

/* ============================================================
   הכתיבות הציבוריות — בלי סיסמה. לשונית → העמודות שמותרות בה.
   ============================================================
   כל השאר (ניהול, הגדרות, נוסחים, שיחות, סימוני הדף…) דורש
   READ_KEY — ראו doPost. מי שמוסיף כתיבה ציבורית חדשה באפליקציה
   מוסיף כאן את הלשונית ואת העמודות שלה, ולא יותר.
   ============================================================ */
var PUB_ROW = {
  'לומדים': ['מזהה', 'שם', 'משפחה', 'טלפון', 'ישיבה', 'קוד ישיבה', 'שכבה', 'כיתה',
             'מסגרת', 'תפקיד', 'שם ההורה', 'משפחת ההורה', 'טלפון ההורה', 'לומד עם',
             'הוזמן על ידי', 'מזהה המזמין', 'בדיקה'],
  'התראות': ['מזהה', 'שם', 'טלפון', 'ישיבה', 'קוד ישיבה', 'תפקיד', 'שכבה', 'כיתה', 'מכשיר',
             'מנוי', 'תוצאה', 'מועד', 'מתי', 'דפדפן'],
  'לימוד': ['מזהה', 'קוד ישיבה', 'מסלול', 'שבוע', 'דף', 'קטע', 'מתוך', 'בדיקה'],
  'זוגות': ['מזהה', 'שם', 'ישיבה', 'קוד ישיבה', 'שכבה', 'כיתה', 'מסלול', 'שבוע', 'דף',
            'דיווח', 'מתי', 'בלי התראה'],
  'ממתינים לדף': ['מזהה', 'שם', 'ישיבה', 'דף', 'מכשיר', 'מנוי', 'מתי']
};
/* ============================================================
   משפך ההרשמה — כמה נכנסו, ואיפה נעצרו.
   ============================================================
   "נרשמו 20 מתוך תפוצה של אלפים" — בלי מספר הנכנסים אין דרך לדעת
   אם הבעיה בהודעה (מעטים פתחו) או בדרך (רבים פתחו ונעצרו).

   **שלושה דברים שמונעים ממנו להתחרות בהרשמות:**
   · נכתב **לפני** נעילת הסקריפט (ראו ראש doPost) — אינו עומד
     בתור של ההרשמות ואינו מאריך אותו.
   · נכתב **לגיליון נפרד** משלו, בדרייב של הרכז ("כניסות להרשמה"),
     ולא לגיליון הפרטי שבו נכתבות ההרשמות.
   · `appendRow` בלבד — בלי לקרוא דבר לפני הכתיבה. הוספת שורה
     אטומית בגוגל, ולכן גם בלי נעילה שתי כניסות אינן דורסות זו את זו.

   אין כאן פרט אישי: מזהה אקראי של המכשיר (לא זה של ההרשמה), שלב,
   קוד ישיבה, תלמיד/הורה, סוג מכשיר, ואיפה נפתח. הטלפון מדווח כל
   שלב פעם אחת בלבד.

   כתיבה ציבורית, ולכן העמודות כאן מוגדרות — כמו PUB_ROW — וכל ערך
   נחתך. היא אינה ב-PUB_ROW בכוונה: שם היא הייתה פותחת לשונית
   "כניסות" גם בגיליון הציבורי, דרך המסלול הכללי.
   ============================================================ */
var HIT_TAB  = 'כניסות';
var HIT_COLS = ['תאריך', 'מכשיר', 'שלב', 'קוד ישיבה', 'תפקיד', 'סוג מכשיר', 'איפה', 'פרט',
                /* למה נופלים (ניהול ← התקנה) — אנונימי, ראו uaInfo ב-join.html */
                'דפדפן', 'גרסה', 'מערכת', 'וואטסאפ', 'הוצעה התקנה', 'התראות', 'שניות',
                /* עומד = נפתח באפליקציה המותקנת; ריק = דפדפן */
                'עומד'];
var HIT_STEPS = {
  open: 'נפתח',          app:  'נפתח מהאפליקציה',
  s1:   'לחץ מצטרף · התקנה', s2:   'שלב 2 · פרטים',
  type: 'התחיל למלא',    s3:   'שלב 3 · דרך לימוד',
  err:  'שגיאה בטופס',   join: 'נרשם',
  s4:   'שלב 4 · התראות', push: 'אישר התראות',
  help: 'ביקש עזרה',
  bip:  'הוצעה התקנה',  inst: 'תשובה להתקנה',
  perm: 'תשובה להתראות', jserr: 'שגיאת קוד',
  bye:  'יצא מהעמוד'
};

function hit_(d) {
  var st = HIT_STEPS[String(d.s || '')];
  var id = String(d.h || '').replace(/[^\w-]/g, '').slice(0, 24);
  if (!st || !id) return { status: 'ignored' };
  /* ערך שמתחיל ב-= היה נקרא כנוסחה. */
  var cut = function (v, n) {
    return String(v == null ? '' : v).slice(0, n).replace(/^[=+\-@]/, "'$&");
  };
  var sh = hitSheet_();
  if (!sh) return { status: 'error', message: 'אין גיליון כניסות' };
  /* גיליון ישן — כותרות העמודות החדשות נוספות פעם אחת. */
  if (sh.getLastColumn() < HIT_COLS.length) sh.getRange(1, 1, 1, HIT_COLS.length).setValues([HIT_COLS]);
  sh.appendRow([new Date(), id, st, cut(d.i, 20), cut(d.r, 10), cut(d.d, 10),
                cut(d.w, 16), cut(d.x, 80), cut(d.b, 16), cut(d.v, 8), cut(d.o, 16),
                d.wa ? 1 : '', d.bp ? 1 : '', cut(d.pm, 12), cut(d.sec, 6),
                (d.sa && String(d.sa) !== '0') ? 1 : '']);
  return { status: 'success' };
}

/* הגיליון נוצר בכניסה הראשונה. נעילת **המסמך** ולא של הסקריפט —
   זו של ההרשמות — ורק לרגע היצירה, כדי ששתי כניסות ראשונות לא
   ייצרו שני גיליונות. */
function hitSheet_() {
  var P = PropertiesService.getScriptProperties();
  var id = P.getProperty('HITS_ID');
  if (!id) {
    var lk = LockService.getDocumentLock() || LockService.getUserLock();
    if (!lk.tryLock(10000)) return null;
    try {
      id = P.getProperty('HITS_ID');
      if (!id) {
        var nss = SpreadsheetApp.create('הדף השבועי · כניסות להרשמה');
        var s0 = nss.getSheets()[0];
        s0.setName(HIT_TAB);
        s0.appendRow(HIT_COLS);
        s0.setFrozenRows(1);
        id = nss.getId();
        P.setProperty('HITS_ID', id);
      }
    } finally { lk.releaseLock(); }
  }
  var ss = SpreadsheetApp.openById(id);
  return ss.getSheetByName(HIT_TAB) || ss.getSheets()[0];
}

/* מכשיר אחד = שורה אחת: היום שבו נכנס לראשונה, הישיבה, התפקיד,
   סוג המכשיר, איפה נפתח, והשלבים שעבר. הסינון והחלוקה נעשים
   בניהול — כך כל צירוף של סינונים אינו דורש בקשה חדשה. */
/* טביעת מנוי — זהה ל-subPrint ב-tools/sched.js. */
function subPrint_(endpoint) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, String(endpoint), Utilities.Charset.UTF_8);
  var h = '';
  for (var i = 0; i < 6; i++) { var v = (b[i] + 256) % 256; h += (v < 16 ? '0' : '') + v.toString(16); }
  return h;
}
/* הטביעות שנמצאו פג, מ"נשלחו". null = לא נקרא (ואז לא משנים דבר). */
function goneKeys_() {
  try {
    var sh = sheet_('נשלחו');
    if (!sh || sh.getLastRow() < 2) return {};
    var v = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues(), out = {};
    for (var i = 0; i < v.length; i++) {
      var k = String(v[i][0] || '');
      if (k.indexOf('פג|') === 0) out[k.slice(3)] = 1;
    }
    return out;
  } catch (e) { return null; }
}

function funnel_() {
  var id = PropertiesService.getScriptProperties().getProperty('HITS_ID');
  if (!id) return { status: 'ok', people: [], errs: {} };
  var sh = SpreadsheetApp.openById(id).getSheetByName(HIT_TAB);
  if (!sh || sh.getLastRow() < 2) return { status: 'ok', people: [], errs: {} };
  var nc = Math.min(HIT_COLS.length, sh.getLastColumn());
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, nc).getValues();
  var code = {};
  for (var k in HIT_STEPS) code[HIT_STEPS[k]] = k;
  var by = {}, order = [], errs = {}, jserrs = {};
  for (var r = 0; r < v.length; r++) {
    var hid = String(v[r][1] || ''), st = code[String(v[r][2] || '')];
    if (!hid || !st) continue;
    var p = by[hid];
    if (!p) {
      var t = v[r][0] instanceof Date ? v[r][0] : new Date();
      p = by[hid] = { t: Utilities.formatDate(t, 'Asia/Jerusalem', 'yyyy-MM-dd'),
                      i: '', r: '', d: '', w: '', s: {},
                      b: '', bv: '', o: '', wa: '', bp: '', pm: '', ins: '', last: '', sec: '', bye: '', je: '', sa: '' };
      order.push(hid);
    }
    p.s[st] = 1;
    if (v[r][3]) p.i = String(v[r][3]);
    if (v[r][4]) p.r = String(v[r][4]);
    if (v[r][5]) p.d = String(v[r][5]);
    if (v[r][6]) p.w = String(v[r][6]);
    if (st === 'err' && v[r][7]) errs[String(v[r][7])] = (errs[String(v[r][7])] || 0) + 1;
    /* העמודות החדשות — רק בשורות שנכתבו אחריהן. */
    var c = function (n) { return nc > n ? String(v[r][n] == null ? '' : v[r][n]) : ''; };
    if (c(8)) { p.b = c(8); p.bv = c(9); }
    if (c(10)) p.o = c(10);
    if (c(11)) p.wa = '1';
    if (c(12)) p.bp = '1';
    if (c(15)) p.sa = '1';
    if (st === 'bip') p.bp = '1';
    if (st === 'perm') p.pm = String(v[r][7] || '');
    if (st === 'inst') p.ins = String(v[r][7] || '');
    if (st === 'jserr' && v[r][7]) {
      p.je = String(v[r][7]);
      jserrs[p.je] = (jserrs[p.je] || 0) + 1;
    }
    /* השלב האחרון שהגיע אליו, ומתי יצא ממנו. */
    if (st === 'bye') { p.bye = String(v[r][7] || ''); p.sec = c(14); }
    else if (['bip', 'inst', 'perm', 'jserr', 'err', 'type'].indexOf(st) < 0) p.last = st;
  }
  return { status: 'ok', errs: errs, jserrs: jserrs, at: new Date().toISOString(),
    people: order.map(function (h) {
      var p = by[h];
      return [p.t, p.i, p.r, p.d, p.w, Object.keys(p.s).join(' '),
              p.b, p.bv, p.o, p.wa, p.bp, p.pm, p.ins, p.last, p.sec, p.bye, p.je, p.sa];
    }) };
}

/* ============================================================
   מסלול הכניסה — מה עבר על כל מי שנכנס, מסך אחר מסך.
   ============================================================
   המשפך למעלה סופר כל שלב פעם אחת למכשיר, ולכן אינו יודע באיזה
   סדר, כמה זמן, מה נלחץ, ולאן חזר. כאן — כל טעינה של דף
   ההרשמה היא "כניסה" עם מזהה אקראי משלה, והטלפון שולח את כל
   הרצף שלה מחדש בכל מעבר מסך וביציאה (ראו TRL ב-join.html).

   אותם כללים של `hit_`: לפני הנעילה, לגיליון הכניסות הנפרד,
   `appendRow` בלבד ובלי לקרוא. כל שליחה היא שורה חדשה, והקריאה
   (`trails_`) לוקחת לכל כניסה את השורה האחרונה שלה.

   אין כאן פרט מזהה: מזהה הכניסה ומזהה המכשיר אקראיים (לא אלה
   של ההרשמה), והרצף הוא קודי מסכים וקודי כפתורים בלבד. "נרשם"
   הוא סימן כן/לא — בלי שום קישור לשורה בלשונית "לומדים". */
var TRAIL_TAB  = 'מסלולים';
var TRAIL_COLS = ['תאריך', 'כניסה', 'מכשיר', 'נרשם', 'קוד ישיבה', 'תפקיד', 'סוג מכשיר', 'איפה',
                  'דפדפן', 'גרסה', 'מערכת', 'וואטסאפ', 'מסלול'];

function trail_(d) {
  var id = String(d.v || '').replace(/[^\w-]/g, '').slice(0, 24);
  var hid = String(d.h || '').replace(/[^\w-]/g, '').slice(0, 24);
  var tr = String(d.tr || '');
  if (!id || !tr) return { status: 'ignored' };
  /* רק קודים — כל מה שאינו אות לטינית, ספרה או סימן מבנה נזרק. */
  tr = tr.replace(/[^\w\[\],:.\-"]/g, '').slice(0, 6000);
  var cut = function (v, n) {
    return String(v == null ? '' : v).slice(0, n).replace(/^[=+\-@]/, "'$&");
  };
  var sh = hitSheet_();
  if (!sh) return { status: 'error', message: 'אין גיליון כניסות' };
  var ss = sh.getParent(), ts = ss.getSheetByName(TRAIL_TAB);
  if (!ts) {
    var lk = LockService.getDocumentLock() || LockService.getUserLock();
    if (!lk.tryLock(10000)) return { status: 'error', message: 'busy' };
    try {
      ts = ss.getSheetByName(TRAIL_TAB);
      if (!ts) { ts = ss.insertSheet(TRAIL_TAB); ts.appendRow(TRAIL_COLS); ts.setFrozenRows(1); }
    } finally { lk.releaseLock(); }
  }
  ts.appendRow([new Date(), id, hid, d.j ? 1 : '', cut(d.i, 20), cut(d.r, 10), cut(d.d, 10),
                cut(d.w, 16), cut(d.b, 16), cut(d.bv, 8), cut(d.o, 16), d.wa ? 1 : '', "'" + tr]);
  return { status: 'success' };
}

/* לכל כניסה — השורה האחרונה שלה (הרצף המלא ביותר), רק מ-`days`
   הימים האחרונים, מהחדשה לישנה. */
function trails_(days) {
  var id = PropertiesService.getScriptProperties().getProperty('HITS_ID');
  if (!id) return { status: 'ok', rows: [] };
  var sh = SpreadsheetApp.openById(id).getSheetByName(TRAIL_TAB);
  if (!sh || sh.getLastRow() < 2) return { status: 'ok', rows: [] };
  var from = Date.now() - Math.min(90, Math.max(1, days)) * 864e5;
  var n = sh.getLastRow() - 1, take = Math.min(n, 20000);
  var v = sh.getRange(n - take + 2, 1, take, TRAIL_COLS.length).getValues();
  var by = {}, order = [];
  for (var r = v.length - 1; r >= 0; r--) {
    var t = v[r][0] instanceof Date ? v[r][0].getTime() : 0;
    if (t && t < from) break;
    var k = String(v[r][1] || '');
    if (!k || by[k]) continue;
    by[k] = 1;
    order.push([t, k, String(v[r][2] || ''), v[r][3] ? 1 : 0, String(v[r][4] || ''),
                String(v[r][5] || ''), String(v[r][6] || ''), String(v[r][7] || ''),
                String(v[r][8] || ''), String(v[r][9] || ''), String(v[r][10] || ''),
                v[r][11] ? 1 : 0, String(v[r][12] || '').replace(/^'/, '')]);
    if (order.length >= 1500) break;
  }
  return { status: 'ok', rows: order, at: new Date().toISOString() };
}

var BACKUP_DAYS = 14;

function backupSS_() {
  var P = PropertiesService.getScriptProperties();
  var id = P.getProperty('BACKUP_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create('הדף השבועי · גיבוי הדף האינטראקטיבי');
  P.setProperty('BACKUP_ID', ss.getId());
  return ss;
}

function backupDaily_(force) {
  var P = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');
  /* ניסיון אחד ביום, גם אם נכשל — שלא כל כתיבה תנסה שוב ותאט. */
  if (!force && ((P.getProperty('LAST_BACKUP') || '').indexOf(today) === 0 ||
                 P.getProperty('BACKUP_TRY') === today)) return;
  P.setProperty('BACKUP_TRY', today);
  try {
    var src = SpreadsheetApp.getActiveSpreadsheet(), dst = backupSS_(), n = 0;
    GUARD_TABS.forEach(function (t) {
      var sh = src.getSheetByName(t);
      if (!sh || sh.getLastRow() < 2) return;
      var name = today + ' · ' + t;
      var old = dst.getSheetByName(name);
      if (old) dst.deleteSheet(old);
      sh.copyTo(dst).setName(name);
      n++;
    });
    /* שמירה של BACKUP_DAYS הימים האחרונים בלבד */
    var re = /^(\d{4}-\d{2}-\d{2}) · /, dates = {};
    dst.getSheets().forEach(function (x) {
      var m = re.exec(x.getName()); if (m) dates[m[1]] = 1;
    });
    var drop = Object.keys(dates).sort().reverse().slice(BACKUP_DAYS);
    dst.getSheets().forEach(function (x) {
      var m = re.exec(x.getName());
      if (m && drop.indexOf(m[1]) >= 0 && dst.getSheets().length > 1) dst.deleteSheet(x);
    });
    P.setProperty('LAST_BACKUP', today + ' · ' + n + ' לשוניות');
    P.deleteProperty('BACKUP_ERR');
    return 'גובה · ' + n + ' לשוניות · ' + dst.getUrl();
  } catch (err) {
    P.setProperty('BACKUP_ERR', today + ' · ' + String(err));
    return 'הגיבוי נכשל: ' + String(err);
  }
}
/* להרצה ידנית מהעורך — גיבוי עכשיו, גם אם כבר גובה היום. */
function backupNow() { return backupDaily_(true); }
