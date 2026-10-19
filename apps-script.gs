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
var SCRIPT_VERSION = 87;

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
                    /* ההגרלה השבועית — זכאים, זוכים ומזהים. ראו raffleRoute_. */
                    'הגרלות',
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
                    /* כל תלמידי הרשת (קוד ישיבה, שכבה, כיתה, משפחה, פרטי,
                       טלפון) — מודבק ידנית. העמדה לוקחת ממנו שם וטלפון. */
                    'תלמידי הרשת',
                    /* מי שלף את רשימת התלמידים של ישיבה, ומתי — ראו netRoster_. */
                    'יומן מאגר',
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
                    'מצב ישיבות', 'הוספות יומן',
                    /* שאר המוקד — ראו CALL_TABS_ למטה. */
                    'אנשי קשר', 'יומן שיחות', 'תצוגת צוות', 'הגדרות תגיות',
                    'פעולות צוות',
                    /* לכל הודעה — אילו מכשירים כבר קיבלו אותה (טביעת מנוי).
                       מה שמונע שליחה כפולה בשליחה חוזרת. ראו push-send.js. */
                    'מסירות',
                    /* ההודעות שמוצגות באפליקציה — לכל הודעה, מזהי האנשים
                       שהיא נועדה להם. ראו `inbox` ו-inboxRow ב-push-send.js. */
                    'תיבה'];

/* ============================================================
   הלשוניות של מוקד השיחות — תמיד לגיליון אנשי הקשר.
   ============================================================
   עד עכשיו הן הלכו לגיליון שהמכשיר נקב בו (`ss`, השדה "מזהה
   גיליון אנשי הקשר" בניהול), ובלעדיו — לגיליון הראשי, שפתוח
   לצפייה לכל מי שיש לו את הקישור. השדה היה ריק, ולכן הטלפונים
   של אנשי הצוות בישיבות, היומן וההערות ישבו בגלוי. וגם נשברו:
   עמוד הצוות קרא את "תצוגת צוות" מ-CONTACTS_ID, והאפליקציה כתבה
   אותה לראשי.

   מכאן: בלי `ss` הן הולכות ל-CONTACTS_ID (ובלעדיו PRIVATE_ID),
   ונקראות רק עם הסיסמה. מה שכבר נכתב לראשי עובר לשם פעם אחת —
   ראו moveOutOfPublic_. */
var CALL_TABS_ = ['אנשי קשר', 'יומן שיחות', 'תצוגת צוות', 'הגדרות תגיות', 'פעולות צוות'];

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
    /* פעם אחת, כדי שהפס יתעדכן מיד ולא בהרצה השעתית — ראו wholeB_. */
    try {
      var WP = PropertiesService.getScriptProperties();
      if (!WP.getProperty(WHOLE_B_KEY)) {
        WP.setProperty(WHOLE_B_KEY, new Date().toISOString());
        if (wholeB_()) recountLearn_(true);
      }
    } catch (se4) {}
    try { moveOutOfPublic_(); } catch (se3) {}
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
    /* "תלמידי הרשת" והגיבויים שלה נכתבים רק דרך netMerge_/netRestore_
       (גיבוי, יומן, כתיבה אחת ואימות). `table` ישן היה מחליף את כל
       הלשונית, ו-`clear`/`delrow` מרוקנים אותה — חסומים, גם עם סיסמה. */
    if ((d.tab === NET_TAB_ || String(d.tab || '').indexOf(NET_BAK_) === 0) &&
        ['row', 'table', 'clear', 'delrow'].indexOf(d.action) >= 0) {
      return json_({ status: 'denied',
        message: 'הלשונית ' + d.tab + ' נכתבת רק דרך הייבוא שבניהול — עם גיבוי ואימות' });
    }
    /* ---- נוכחות בשיעור — מאיש צוות שהרכז אישר ----
       בלי סיסמת הרכז: שורה אחת ללשונית העמדה, רק כשהמכשיר מאושר
       לאותה ישיבה (accGate_), ורק בעמודות של העמדה. קוד הישיבה
       בשורה נכפה להיות זה שהמכשיר אושר אליו — איש צוות אינו יכול
       לרשום נוכחות בשם ישיבה אחרת. */
    if (!wAdm && d.action === 'row' && d.tab === AMDA_TAB_ && d.dev && d.inst) {
      var aInst = String(d.inst);
      if (accGate_(aInst, String(d.dev), true)) {
        return json_({ status: 'denied', message: 'המכשיר אינו מאושר לישיבה הזו' });
      }
      var aOk = ['מזהה', 'שבוע', 'יום', 'עמדה', 'קוד עמדה', 'סוג', 'מסלול', 'דף', 'מקום',
                 'רמה', 'אישור חידון', 'שכבה', 'כיתה', 'שם', 'מתי'];
      var aCols = (parse_(d.cols) || []).filter(function (p) {
        return p && aOk.indexOf(String(p[0] || '')) >= 0;
      });
      aCols.push(['קוד ישיבה', aInst]);
      return appendCols_(AMDA_TAB_, aCols);
    }
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
    /* עוגני המצגת: שורה של דף אחד, או הסרת עוגנים לשקף שנמחק.
       ראו deckRow_ ו-deckDrop_. */
    if (d.action === 'deckRow' || d.action === 'deckDrop') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (dbe) {}
      return json_(d.action === 'deckRow' ? deckRow_(d) : deckDrop_(d));
    }
    /* העלון השבועי: הבחירה של דף אחד. ראו alonRow_. */
    if (d.action === 'alonRow') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      return json_(alonRow_(d));
    }
    /* ארכיון העלון: גרסה מאושרת חדשה, וה-PDF שלה. ראו alonArch_. */
    if (d.action === 'alonArch' || d.action === 'alonPdf') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      return json_(d.action === 'alonArch' ? alonArch_(d) : alonPdf_(d));
    }
    /* שמירה אוטומטית מהסטודיו: עמוד אחד, עם גרסת בסיס. ראו markPut_. */
    if (d.action === 'markPut') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (mbe) {}
      return json_(markPut_(d));
    }
    /* "תלמידי הרשת" — ייבוא שמתמזג, ושחזור מגיבוי. ראו netMerge_. */
    if (d.action === 'netMerge' || d.action === 'netRestore') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      return json_(netRunDo_(d));
    }
    /* מאגר "שאלות לשיבוץ": שורה אחת לפי מזהה — ראו qbank_. */
    if (d.action === 'qbank') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (qbe) {}
      return json_(qbank_(d));
    }
    /* שאלה משובצת שנערכה בניהול — מתעדכנת גם בדף. ראו qbDaf_. */
    if (d.action === 'qbDaf') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (qde) {}
      return json_(qbDaf_(d));
    }
    /* איחוד חד-פעמי של המאגר והדף — ראו qbLink_. */
    if (d.action === 'qbLink') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (qle) {}
      return json_(qbLink_());
    }
    /* ההסבה למזהים קבועים — לשונית אחת בכל קריאה. ראו sidStep_. */
    if (d.action === 'sidStep') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      try { backupDaily_(); } catch (sbe) {}
      return json_(sidStepRun_(d));
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
      /* הרשמה יכולה לאחד זהויות — הנקודות של האדם המאוחד מתעדכנות. */
      if (!d.ss) ptsBust_();
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

    /* העמדה: "מה למדתם עכשיו?" — אחרי מעשה. ראו amdaKind_. */
    if (d.action === 'amdakind') {
      if (!wAdm) return json_({ status: 'denied', message: 'דורש את סיסמת הסקריפט' });
      return json_(amdaKind_(d));
    }
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
  /* פעם אחת — ראו moveOutOfPublic_. כאן ולא רק ב-doPost, כי
     המוקד קורא ב-GET, ואחרי הפריסה הקריאה הראשונה שלו כבר
     הולכת לגיליון הפרטי. */
  try {
    if (!PropertiesService.getScriptProperties().getProperty(PUB_MOVE_KEY)) {
      var mvLock = LockService.getScriptLock();
      if (mvLock.tryLock(15000)) {
        try { moveOutOfPublic_(); } finally { mvLock.releaseLock(); }
      }
    }
  } catch (mve) {}
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
  /* ============================================================
     `help=2` — תלמיד אנדרואיד שנתקע וממשיך בדפדפן.
     ============================================================
     אותה כתיבה בדיוק ללשונית הפרטית, ועוד שלושה דברים:
       · **בלי `coordPing_`.** ההתראה יוצאת לכל מכשיר שנרשם
         בתפקיד "רכז", ואין שם מזהה של אדם מסוים. עד שיוכח
         שהיא מגיעה רק לרכז התוכנית — פרטי תלמיד אינם יוצאים
         מהגיליון. הפנייה נמצאת ברשימת התקועים בניהול.
       · **מזהה פנייה** (`rid`) — לחיצה חוזרת, רענון, או ניסיון
         חוזר אחרי תשובה שאבדה אינם כותבים שורה שנייה.
       · **מזהה התלמיד** (`sid`) — מזהה המכשיר, שהוא גם מזהה
         ההרשמה, ולכן השורה מתחברת לתלמיד גם אם יירשם רק אחריה.
     התשובה נושאת `help:2`. שרת ישן אינו מכיר את הערך, אינו
     עונה כך — והמסך אינו מציג אישור על כתיבה שלא נעשתה. */
  if (e && e.parameter && e.parameter.help === '2') {
    var H2 = e.parameter;
    var h2Name  = String(H2.name || '').trim();
    var h2Phone = String(H2.phone || '').trim();
    var h2Rid   = String(H2.rid || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 40);
    if (!h2Name || h2Phone.replace(/[^0-9]/g, '').length < 9) {
      return reply_(e, { status: 'error', help: 2, message: 'חסר שם או טלפון' });
    }
    var h2Lock = LockService.getScriptLock();
    if (!h2Lock.tryLock(15000)) {
      return reply_(e, { status: 'error', help: 2, message: 'עומס — נסו שוב' });
    }
    try {
      var h2Sh = sheet_('תקועים');
      if (h2Rid && h2Sh.getLastRow() > 1) {
        var h2Hd = headers_(h2Sh), h2Ri = h2Hd.indexOf('מזהה פנייה');
        if (h2Ri >= 0) {
          var h2V = h2Sh.getRange(2, h2Ri + 1, h2Sh.getLastRow() - 1, 1).getDisplayValues();
          for (var h2i = 0; h2i < h2V.length; h2i++) {
            if (String(h2V[h2i][0] || '').trim() === h2Rid) {
              return reply_(e, { status: 'ok', help: 2, dup: 1 });
            }
          }
        }
      }
      appendCols_('תקועים', [
        ['שם', h2Name], ['טלפון', h2Phone],
        ['ישיבה', String(H2.instName || '')],
        ['קוד ישיבה', String(H2.inst || '')],
        ['שכבה', String(H2.grade || '')], ['כיתה', String(H2.klass || '')],
        ['מכשיר', String(H2.dev || '')],
        ['מה קרה', String(H2.what || '')],
        ['אבחון', String(H2.diag || '')],
        ['מסלול', 'אנדרואיד — המשך בדפדפן'],
        ['מזהה', String(H2.sid || '').slice(0, 40)],
        ['מזהה פנייה', h2Rid],
        ['טופל', '']
      ]);
    } catch (err2) {
      return reply_(e, { status: 'error', help: 2, message: String(err2) });
    } finally {
      h2Lock.releaseLock();
    }
    return reply_(e, { status: 'ok', help: 2 });
  }

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
     מסיר, `setup=clockstate` אומר מה מותקן ומתי השעון הצית
     לאחרונה, ו-`setup=clockfire` מצית עכשיו. הכול דורש את
     סיסמת הקריאה: מי שמתקין שעון מצית הרצות ב-GitHub.

     למה כאן ולא ב-`setupTriggers`: כדי שזה יקרה בפועל. פתיחת
     עורך Apps Script מהטלפון ובחירת פונקציה מרשימה היא בדיוק
     הסוג של צעד שנדחה ולא נעשה.
     ============================================================ */
  if (e && e.parameter && e.parameter.setup &&
      /^clock(off|state|fire)?$/.test(String(e.parameter.setup))) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    }
    var what = String(e.parameter.setup);
    try {
      if (what === 'clockstate') {
        return reply_(e, { status:'ok', clock: hasClock_(), last: clockLast_(),
          message: hasClock_() ? 'שעון השליחות פעיל · כל חצי שעה'
                               : 'שעון השליחות אינו מותקן' });
      }
      /* "שליחת בדיקה" — מצית עכשיו את אותה הרצה שהשעון מצית,
         בלי לחכות לחצי השעה הבאה. */
      if (what === 'clockfire') {
        var f = clockFire_('CLOCK_TEST');
        return reply_(e, { status:'ok', clock: hasClock_(), last: clockLast_(),
                           fired: f, message: '' });
      }
      var msg = what === 'clockoff' ? removeClock() : setupClock();
      return reply_(e, { status:'ok', clock: hasClock_(), last: clockLast_(), message: msg });
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
      var why = String(e.parameter.why || '').slice(0, 300);
      var nOk = parseInt(e.parameter.n, 10) || 0;
      var nBad = parseInt(e.parameter.bad, 10) || 0;
      var nGone = parseInt(e.parameter.gone, 10) || 0;
      /* prev = מכשירים שכבר קיבלו את ההודעה בשליחה קודמת, ודולגו
         (מניעת כפילות). det = הסיבה המדויקת לכישלון מכשירים. */
      var nPrev = parseInt(e.parameter.prev, 10) || 0;
      var det = String(e.parameter.det || '').slice(0, 120);
      var was = String(sr.v[sr.ix['תוצאה']] || '');
      var final0 = was && was !== 'ממתין' && was !== 'בשליחה';
      /* "בשליחה" אינו דורס תוצאה שכבר הגיעה. */
      if (e.parameter.run) {
        if (!final0) sr.sh.getRange(sr.r, sr.ix['תוצאה'] + 1).setValue('בשליחה');
        return reply_(e, { status:'ok' });
      }
      /* דיווח כפול (מהקוד ומשלב ה-failure) — הדיווח הראשון קובע,
         וההתרעה יוצאת פעם אחת. */
      if (final0) return reply_(e, { status:'ok', dup: 1 });
      var got = nOk + nPrev;
      /* "התקבלה אצל שירות ההתראות" — ולא "הגיעה": תשובה תקינה של
         שירות ההתראות אינה ראיה שמישהו ראה אותה. */
      var tail = (nPrev ? ' · כבר קיבלו קודם ' + nPrev : '') +
                 (nBad ? ' · נכשלה ל-' + nBad : '') + (nGone ? ' · אין מנוי פעיל ל-' + nGone : '') +
                 (det ? ' (' + det + ')' : '');
      /* הסטטוס — שלושה מצבים ברורים, ועוד "אין נמענים" שאינו תקלה. */
      var stt = why ? (got ? 'חלקי' : 'נכשל')
              : e.parameter.none ? 'אין נמענים'
              : nBad ? (got ? 'חלקי' : 'נכשל')
              : got ? 'נשלח' : 'אין נמענים';
      var now = stt === 'נכשל' ? 'נכשלה: ' + (why || 'כל ' + nBad + ' המכשירים דחו') + tail
              : stt === 'אין נמענים' ? 'אין נמענים עם התראות' + tail
              : (stt === 'חלקי' ? 'חלקית: ' : '') + 'התקבלה אצל שירות ההתראות ל-' + nOk + tail +
                (why ? ' · נעצרה: ' + why : '');
      var sHead = headers_(sr.sh);
      sr.sh.getRange(sr.r, sr.ix['תוצאה'] + 1).setValue(now);
      sr.sh.getRange(sr.r, idx_(sr.sh, sHead, 'סטטוס שליחה') + 1).setValue(stt);
      sr.sh.getRange(sr.r, idx_(sr.sh, sHead, 'קיבלו') + 1).setValue(got);
      var g0 = function (k) { return sr.ix[k] === undefined ? '' : String(sr.v[sr.ix[k]] || ''); };
      /* **יצאה באיחור** — מהבקשה ועד הדיווח. מעל 3 דקות זה כבר לא "מיד",
         והשולח (והרכז) צריכים לדעת: הודעה על שיעור בשמונה שיצאה ב-20:15
         אינה אותה הודעה. */
      var at0 = sr.ix['תאריך'] === undefined ? null : sr.v[sr.ix['תאריך']];
      var late = at0 instanceof Date ? Math.round((Date.now() - at0.getTime()) / 60000) : 0;
      if (late >= 3 && (stt === 'נשלח' || stt === 'חלקי')) {
        now += ' · יצאה באיחור של ' + late + ' דקות';
        sr.sh.getRange(sr.r, sr.ix['תוצאה'] + 1).setValue(now);
      } else late = 0;
      try { dlvPrune_(); } catch (eP) {}
      /* התראת מערכת לרכז אינה מתריעה על עצמה — אחרת התרעה על התרעה. */
      if (g0('מי') !== 'מערכת' && g0('קהל') !== 'מכשירי רכז') {
        var nm = { ok: [], gone: [], bad: [], inst: {} };
        try { nm = sayNames_(g0('מזהה הודעה') || String(e.parameter.sayDone), !!g0('ממתינים')); } catch (eN) {}
        var full = sayNamesTxt_(nm, 0);
        if (full) {
          try { sr.sh.getRange(sr.r, idx_(sr.sh, sHead, 'נמענים') + 1).setValue(full.slice(0, 45000)); } catch (eW) {}
        }
        /* "למי" — במילים שנבחרו בשליחה. בלעדיו (שליחה ממכשיר ישן) —
           הישיבה, כמו קודם. */
        sayReport_(stt, g0('מי'), g0('למי') || nm.inst[g0('ישיבה')] || g0('ישיבה'), g0('הטקסט'),
                   stt === 'נשלח' || stt === 'אין נמענים' ? '' : (why || det),
                   { ok: nOk, prev: nPrev, bad: nBad, gone: nGone, late: late }, nm);
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
      /* **שליחה שעדיין רצה אינה נשלחת שוב.** שתי הרצות במקביל לאותה
         הודעה עלולות שתיהן לעבור את בדיקת הכפילות לפני שהראשונה רשמה
         משהו. אחרי חצי שעה בלי דיווח — ההרצה מתה, ומותר. */
      var rAt = rr.ix['תאריך'] === undefined ? null : rr.v[rr.ix['תאריך']];
      var rAge = rAt instanceof Date ? (Date.now() - rAt.getTime()) : 1e9;
      if ((g('תוצאה') === 'ממתין' || g('תוצאה') === 'בשליחה') && rAge < 30 * 60000) {
        return reply_(e, { status:'error', message:'ההודעה עדיין בשליחה — אפשר לנסות שוב בעוד כמה דקות' });
      }
      /* אותו מזהה הודעה — כך push-send.js יודע מי כבר קיבל אותה,
         ושולח רק למי שלא. */
      var r2 = ghFire_(g('כותרת'), g('הטקסט'), g('יעד'), g('שכבה'), g('כיתה'),
                       g('מי'), g('קישור'), g('תפקיד'), g('ממתינים'), g('פילוח'), false,
                       g('מזהה הודעה') || g('מזהה שליחה'), g('למי'));
      if (r2.status === 'ok') {
        rr.sh.getRange(rr.r, rr.ix['תוצאה'] + 1).setValue(g('תוצאה') + ' · נשלחה שוב');
      }
      return reply_(e, r2);
    } catch (errR) {
      return reply_(e, { status:'error', message: String(errR) });
    }
  }

  /* החידון של מסכת ושבוע: מצב (quizReady), ו"פרסם הכול" — ואחריו, רק אם
     אושרה, התראה למי שביקש (quizPubAll). לרכז בלבד. ראו quizPubAll_. */
  if (e && e.parameter && (e.parameter.quizReady || e.parameter.quizPubAll)) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status:'denied', message:'אין הרשאה' });
    }
    try {
      return reply_(e, e.parameter.quizPubAll ? quizPubAll_(e.parameter) : quizReady_(e.parameter));
    } catch (errQ) { return reply_(e, { status:'error', quiz: 1, message: String(errQ) }); }
  }

  /* רישומי נוכחות שלא שויכו — שם שמתאים ליותר מנרשם אחד. לרכז בלבד.
     ראו amdaSync_. */
  if (e && e.parameter && e.parameter.amdaAmb) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status:'denied', message:'אין הרשאה' });
    }
    try { amdaSyncLocked_(); } catch (eA) {}
    var amb = [];
    try { amb = JSON.parse(PropertiesService.getScriptProperties().getProperty('amdaAmb') || '[]'); } catch (eA2) {}
    return reply_(e, { status: 'ok', rows: amb });
  }

  /* סיכום מענה על החידונים — לרכז בלבד, מספרים בלבד. ראו quizSum_. */
  if (e && e.parameter && e.parameter.quizSum) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status:'denied', message:'אין הרשאה' });
    }
    try { return reply_(e, quizSum_()); }
    catch (errS) { return reply_(e, { status:'error', message: String(errS) }); }
  }

  if (e && e.parameter && e.parameter.fire === 'say') return sayOnce_(e);
  /* ?pts=me&id= — הנקודות של התלמיד עצמו (ptsMe_). */
  if (e && e.parameter && e.parameter.pts === 'me') {
    try { return reply_(e, ptsMe_(e.parameter)); }
    catch (errP) { return reply_(e, { status:'error', message: String(errP) }); }
  }
  if (e && e.parameter && e.parameter.raffle) return raffleRoute_(e);
  if (e && e.parameter && e.parameter.test) return testRoute_(e);
  if (e && e.parameter && e.parameter.sayCount) return sayCount_(e);

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
  /* ============================================================
     "יש לי הודעה?" — ההודעה המלאה, בתוך האפליקציה.
     ============================================================
     התראה בחלונית מראה שורה או שתיים, ולחיצה עליה מעלימה אותה.
     ורבים בכלל לא רואים התראות: חסמו, לא אישרו, או שהטלפון
     השתיק. לכן כל הודעה נשמרת גם ב"תיבה", עם מזהי האנשים
     שהיא נועדה להם — **אותו פילוח בדיוק של ההתראה**, כי
     push-send.js הוא שכותב את השורה, אחרי שסינן (ראו inboxRow).

     המכשיר שולח את המזהים שלו, ומקבל את ההודעות שנועדו לו
     מ-INBOX_DAYS הימים האחרונים. בלי סיסמה, כמו `mark`: מי שיודע
     מזהה יכול לראות את ההודעות שנשלחו לבעליו, ותו לא — לא
     רשימה, לא שמות, ולא מי עוד קיבל. */
  if (e && e.parameter && e.parameter.inbox) {
    try { return reply_(e, { status:'ok', items: inbox_(String(e.parameter.inbox)) }); }
    catch (errI) { return reply_(e, { status:'error', message: String(errI) }); }
  }

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
            var theirs = phKey_(pt.c(row, 'טלפון'));
            var toMe = pmPh && phKey_(pt.c(row, 'טלפון ההורה')) === pmPh;
            var toThem = theirs && pmOther.indexOf(theirs) >= 0;
            /* **הדדי** — הוא מסר את הטלפון שלי ואני את שלו. את זה
               אי אפשר לזייף מבחוץ (צריך שהצד השני ימסור את המספר
               שלך), ולכן בלי תנאי שם משפחה: אמא בשם משפחה אחר,
               "בן-דוד" מול "בן דוד" ושגיאת הקלדה ראו כאן "לא מחובר"
               בזמן שהלוח של הצוות הראה אותם מחוברים. */
            if (!(toMe && toThem)) {
              /* חד-צדדי: טלפון לבדו היה מאפשר לכל אחד לגלות שם של
                 נער לפי מספר — ולכן שם המשפחה חייב להתאים. */
              if (!pmLast || !(toMe || toThem)) continue;
              if (lastKey_(pt.c(row, 'משפחה')) !== lastKey_(pmLast) &&
                  lastKey_(pt.c(row, 'משפחת ההורה')) !== lastKey_(pmLast)) continue;
            }
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
          way: (function (v) { return WAY_OF[v] || v; })(
                 amdaWay_(amdaGroupIds_(), wc('מזהה'), wc('מסגרת'))),
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
              עם `pick=staff|kid` — מי שננעל בוחר (accPick_).
     `accset` לרכז: אישור / נעילה. */
  if (e && e.parameter && e.parameter.acc) {
    if (e.parameter.pick) {
      try { return reply_(e, accPick_(String(e.parameter.acc), String(e.parameter.dev || ''),
                                      String(e.parameter.pick), String(e.parameter.ph || ''))); }
      catch (errP) { return reply_(e, { status: 'error', message: String(errP) }); }
    }
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
      var aid = String(e.parameter.accset), was = accRow_(aid);
      upsertCols_(ACC_TAB, [['מזהה', aid], ['מצב', ast],
                            ['הוחלט', new Date()]], 'מזהה');
      /* **אושר — הוא יודע מיד.** התראה למכשיר שלו בלבד, רק במעבר
         לאישור (לא כשמאשרים שוב), והלחיצה פותחת לו את האזור האישי
         ובודקת שם. הנוסח מגיע מהניהול (ui.accOkT / ui.accOkB),
         כדי שייערך ב"מלל" ולא כאן. */
      var pushed = false;
      if (ast === 'אושר' && was && was.st !== 'אושר' && was.inst &&
          e.parameter.t && e.parameter.b) {
        var rP = ghFire_(String(e.parameter.t).slice(0, 120), String(e.parameter.b).slice(0, 400),
                         was.inst, '', '', 'מערכת', './#phone', '', '',
                         JSON.stringify({ ids: [aid] }));
        pushed = !!(rP && rP.status === 'ok');
      }
      return reply_(e, { status: 'ok', pushed: pushed });
    } catch (errS) { return reply_(e, { status: 'error', message: String(errS) }); }
  }

  /* ---- נוכחות בשיעור: הרשימה והרישומים של ישיבה אחת ----
     לאיש צוות שהרכז אישר לאותה ישיבה (accGate_), או בסיסמת הרכז.
     `netroster` — שכבה, כיתה ושם בלבד: בלי טלפונים, לעולם.
     `netmarks`  — מה שנרשם בעמדה, רק של הישיבה הזו. */
  /* ---- ייבוא "תלמידי הרשת": תוצאת ריצה, ורשימת הגיבויים ----
     no-cors אטום, ולכן התשובה של netMerge נשמרת לפי מזהה הריצה
     ונשאלת כאן. רק בסיסמת הרכז. */
  if (e && e.parameter && (e.parameter.netrun || e.parameter.netbaks)) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied' });
    }
    try {
      /* בתוך הנעילה: היומן מכריע קודם מה קרה לריצה שנקטעה. */
      if (e.parameter.netrun) {
        return reply_(e, netRunGet_(String(e.parameter.netrun).replace(/[^\w-]/g, ''), !!e.parameter.seal));
      }
      return reply_(e, netBaksGet_());
    } catch (eR) {
      return reply_(e, { status: 'error', message: String(eR) });
    }
  }

  if (e && e.parameter && (e.parameter.netroster || e.parameter.netmarks)) {
    var nInst = String(e.parameter.netroster || e.parameter.netmarks);
    var nAdm = !!READ_KEY && String(e.parameter.key || '') === READ_KEY;
    if (!nAdm) {
      var gN = accGate_(nInst, e.parameter.dev, true);
      if (gN) return reply_(e, gN);
    }
    try {
      return reply_(e, e.parameter.netroster ? netRoster_(nInst, String(e.parameter.dev || (nAdm ? 'רכז' : '')))
                                             : netMarks_(nInst));
    } catch (eN) {
      return reply_(e, { status: 'error', message: String(eN) });
    }
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
    if (isAdm && String(e.parameter.board) === '*') { try { accSeed_(); } catch (eS) {} }
    /* **הלוח נפתח לפי האישור, לא לפי הקוד** — ראו accGate_. */
    if (!isAdm && ACC_ONLY) {
      var bInst = String(e.parameter.board);
      var gB = accGate_(bInst, e.parameter.dev, !!e.parameter.k);
      if (gB) return reply_(e, gB);
      bk = ensureCode_(bInst, newCode_());
    }
    try { bd = boardData_(String(e.parameter.board), bk, e.parameter.test === '1'); }
    catch (err0) { bd = { status: 'error', message: String(err0) }; }
    /* **המשתתפים — מחושבים עכשיו**, באותה פונקציה של "מונים", והלשונית
       נכתבת מחדש באותה הזדמנות. כך המספר בניהול, באפליקציה ובמפה
       אחד, מאותו רגע. נכשל — אין `part`, והמסך אומר שהנתון ישן. */
    if (isAdm && String(e.parameter.board) === '*' && bd && bd.status === 'ok') {
      try {
        var pjs = sheet_(JOIN_TAB);
        var pp = recountRows_(pjs.getLastRow() ? pjs.getDataRange().getDisplayValues() : [[]]);
        if (pp) {
          var pb = {};
          pp.order.forEach(function (pc) {
            var x = pp.by[pc];
            pb[pc] = { n: x.n, reg: x.reg, rep: x.rep, amb: x.amb };
          });
          bd.part = { at: new Date().toISOString(), by: pb };
        }
      } catch (eP) {}
    }
    return reply_(e, bd);
  }

  /* ---- סקירת הישיבות (ממשק ניהול התוכנית) ----
     שתי סיסמאות: READ_KEY (הבעלים) ו-OV_KEY (קישור המנהלים).
     מה שיוצא כאן הוא רק מה שבטבלת הסקירה: שם, מספרים, רכז
     בשטח ומשפט סיכום. אנשי קשר, טלפונים והיסטוריה אינם נקראים
     כאן בכלל — הם בגיליון אחר, ונשארים מאחורי READ_KEY. ראו ov_. */
  if (e && e.parameter && e.parameter.ov) {
    var ovRes;
    try { ovRes = ov_(e.parameter); }
    catch (ovErr) { ovRes = { status: 'error', message: String(ovErr) }; }
    ovRes.ov = 1;
    return reply_(e, ovRes);
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
  /* התוצאה של הצעד האחרון בהסבה למזהים — POST ב-no-cors אטום,
     ולכן הצד השני שואל כאן. ראו sidStep_. */
  /* הסטודיו: כל מה שקיים לעמוד אחד, לפני החלפת גרסה. ראו studioInv_. */
  if (e && e.parameter && e.parameter.studioInv) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', version: SCRIPT_VERSION });
    }
    try { return reply_(e, studioInv_(String(e.parameter.k || ''))); }
    catch (sie) { return reply_(e, { status: 'error', version: SCRIPT_VERSION, message: String(sie) }); }
  }
  if (e && e.parameter && e.parameter.sidStep) {
    if (!READ_KEY || String(e.parameter.key || '') !== READ_KEY) {
      return reply_(e, { status: 'denied', version: SCRIPT_VERSION });
    }
    var sr = prop_('SID_STEP', '');
    var so = null;
    try { so = sr ? JSON.parse(sr) : null; } catch (sre) { so = null; }
    return reply_(e, { status: 'ok', version: SCRIPT_VERSION, sid: so });
  }
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
              backup:  prop_('LAST_BACKUP', ''), backupErr: prop_('BACKUP_ERR', ''),
              pubMove: prop_('PUB_MOVE_LOG', '') };
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
  /* נוכחות חדשה — אישור חידון אפשרי, והנקודות והזכאות במטמון. */
  if (tab === AMDA_TAB_) amdaQzBust_();
  /* דיווח נוכחות הוא ראיה להשתתפות (partCalc_) — גם "השתתף" ושיעור. */
  if (tab === AMDA_TAB_) partSoon_();
  /* סיום עמוד, או חידון שלם — הנקודות מתעדכנות מיד, לא אחרי 5 דקות.
     סימון של קטע באמצע (קטע < מתוך) אינו משנה נקודות. */
  if (tab === LEARN_TAB || tab === 'חידות') {
    var gv = function (n) {
      for (var g = 0; g < cols.length; g++) if (cols[g] && cols[g][0] === n) return String(cols[g][1] == null ? '' : cols[g][1]).trim();
      return '';
    };
    var at0 = parseInt(gv('קטע'), 10), of0 = parseInt(gv('מתוך'), 10);
    if (tab === 'חידות' ? gv('קטע') === 'החידון כולו' : !gv('קטע') || !(of0 > 0) || at0 >= of0) ptsBust_();
  }
  /* הודעה חדשה בתיבה — שהאפליקציה תראה אותה מיד, ולא אחרי דקה. */
  if (tab === 'תיבה') { try { CacheService.getScriptCache().remove('inbox:rows'); } catch (eI) {} }
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
  /* עמודה שנוספה (8.99.264: "נרשמו", "דווחו בלבד", "לא הוכרעו") —
     הכותרת נכתבת גם בלשונית שכבר קיימת, אחרת הקורא לא ימצא אותה. */
  else if (out.getRange(1, 1, 1, cols.length).getDisplayValues()[0].join('\u0001') !== cols.join('\u0001')) {
    headRow_(out, cols);
  }
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
  var st = '', row = -1, was = '', oldPh = '';
  if (sh.getLastRow() > 1) {
    var av = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getDisplayValues();
    for (var a = 0; a < av.length; a++) {
      if (String(av[a][ix['מזהה']] || '').trim() !== dev) continue;
      row = a + 2; st = String(av[a][ix['מצב']] || '').trim();
      was = String(av[a][ix['קוד ישיבה']] || '').trim();
      oldPh = ix['טלפון'] === undefined ? '' : String(av[a][ix['טלפון']] || '').trim(); break;
    }
  }
  /* אישור הוא לישיבה אחת. מכשיר שעבר לישיבה אחרת — מאושר מחדש. */
  var moved = row >= 0 && st === 'אושר' && was && was !== inst;
  /* טלפון שנמסר במסך הנעילה (accPick_) נשאר, עד שיגיע אחד מ"התראות". */
  var phNow = g('טלפון') || oldPh;
  var cols = [['מזהה', dev], ['שם', g('שם')], ['טלפון', phNow],
              ['ישיבה', g('ישיבה')], ['קוד ישיבה', inst], ['תפקיד', g('תפקיד')],
              ['קוד במכשיר', has ? 'כן' : ''], ['נראה', new Date()]];
  if (row < 0 || moved) {
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
  if (st === 'נעול') return { status: 'locked', phone: !!phNow };
  if (st !== 'אושר') return { status: 'wait', phone: !!phNow };
  return { status: 'ok', k: ensureCode_(inst, newCode_()) };
}

/* ============================================================
   מי שננעל בוחר: "איש צוות" או "תלמיד".
   ============================================================
   רק ממצב "נעול" — מאושר וממתין אינם נוגעים כאן בדבר.

   staff — חוזר ל"ממתין", והרכז מקבל את ההתראה הקיימת
           (coordPing_ בלבד, לאף אחד אחר). לכל היותר פעם בשעה
           לאותו מכשיר. `ph` — הטלפון שהוקלד במסך, כשחסר.
   kid   — התפקיד הופך ל"תלמיד" ב"גישה" וב"התראות", והוא יוצא
           מ"ממתינים לאימות" (בלקוח) ומ"צריכים עזרה" (כאן,
           "טופל"). בלי שום התראה. המצב נשאר "נעול": תלמיד אינו
           מקבל לעולם את קוד הישיבה. */
function accPick_(inst, dev, pick, ph) {
  inst = String(inst || '').trim(); dev = String(dev || '').trim();
  if (pick !== 'staff' && pick !== 'kid') return { status: 'error', message: 'בחירה לא מוכרת' };
  var a = accAsk_(inst, dev, false);
  if (a.status !== 'locked') return a;
  var r = accRow_(dev) || {};
  if (pick === 'staff') {
    var digits = String(ph || '').replace(/[^0-9+]/g, '').slice(0, 16);
    var phone = r.phone || (digits.replace(/[^0-9]/g, '').length >= 9 ? digits : '');
    var cols = [['מזהה', dev], ['מצב', 'ממתין'], ['ביקש', new Date()]];
    if (phone && !r.phone) cols.push(['טלפון', phone]);
    upsertCols_(ACC_TAB, cols, 'מזהה');
    var cache = null, seen = false;
    try { cache = CacheService.getScriptCache(); seen = !!cache.get('accRe:' + dev); } catch (eC) {}
    if (!seen) {
      try { if (cache) cache.put('accRe:' + dev, '1', 3600); } catch (eP) {}
      coordPing_('🔑 ביקש שוב אימות',
        (r.name || 'איש צוות') + ' · ' + (r.instName || inst) +
        (r.role ? ' · ' + r.role : '') + ' · ' + (phone || 'חסר טלפון'), './#admin-acc');
    }
    return { status: 'wait', phone: !!phone };
  }
  upsertCols_(ACC_TAB, [['מזהה', dev], ['תפקיד', 'תלמיד']], 'מזהה');
  /* "התראות" — כל השורות של המכשיר בישיבה הזו. */
  var ps = sheet_('התראות');
  if (ps.getLastRow() > 1) {
    var ph2 = headers_(ps), iD = ph2.indexOf('מזהה'), iI = ph2.indexOf('קוד ישיבה'),
        iR = ph2.indexOf('תפקיד');
    if (iD >= 0 && iR >= 0) {
      var pv = ps.getRange(2, 1, ps.getLastRow() - 1, ph2.length).getDisplayValues();
      for (var i = 0; i < pv.length; i++) {
        if (String(pv[i][iD] || '').trim() !== dev) continue;
        if (iI >= 0 && String(pv[i][iI] || '').trim() !== inst) continue;
        ps.getRange(i + 2, iR + 1).setValue('תלמיד');
      }
    }
  }
  /* "צריכים עזרה" — לפי הטלפון, ובלעדיו לפי שם + ישיבה. */
  try {
    var ts = sheet_('תקועים');
    if (ts.getLastRow() > 1) {
      var th = headers_(ts), tN = th.indexOf('שם'), tP = th.indexOf('טלפון'),
          tC = th.indexOf('קוד ישיבה'), tD = idx_(ts, th, 'טופל');
      var tv = ts.getRange(2, 1, ts.getLastRow() - 1, th.length).getDisplayValues();
      var myPh = String(r.phone || '').replace(/[^0-9]/g, '').slice(-9);
      for (var t = 0; t < tv.length; t++) {
        if (String(tv[t][tD] || '').trim()) continue;
        var hp = tP < 0 ? '' : String(tv[t][tP] || '').replace(/[^0-9]/g, '').slice(-9);
        var same = myPh ? hp === myPh
          : (r.name && tN >= 0 && String(tv[t][tN] || '').trim() === r.name &&
             (tC < 0 || String(tv[t][tC] || '').trim() === inst));
        if (same) ts.getRange(t + 2, tD + 1).setValue(new Date());
      }
    }
  } catch (eT) {}
  return { status: 'kid' };
}

/* השורה של מכשיר אחד ב"גישה" — המצב והישיבה, לפני שמשנים. */
function accRow_(dev) {
  var sh = sheet_(ACC_TAB);
  if (sh.getLastRow() < 2) return null;
  var head = headers_(sh), ix = {};
  for (var h = 0; h < head.length; h++) ix[String(head[h]).trim()] = h;
  var av = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getDisplayValues();
  for (var a = 0; a < av.length; a++) {
    if (String(av[a][ix['מזהה']] || '').trim() !== dev) continue;
    var cv = function (k) { return ix[k] === undefined ? '' : String(av[a][ix[k]] || '').trim(); };
    return { st: cv('מצב'), inst: cv('קוד ישיבה'),
             name: cv('שם'), phone: cv('טלפון'), instName: cv('ישיבה'), role: cv('תפקיד') };
  }
  return null;
}

/* ============================================================
   הגישה לצוות — לפי האישור של הרכז, ולא לפי הקוד.
   ============================================================
   "אני רוצה שאיש צוות יוכל להיכנס רק אם אישרתי אותו ספציפית."
   הקוד של הישיבה הגיע בקישורים, והועבר הלאה — ולכן הוא אינו
   פותח יותר כלום. הלוח והשליחה לתלמידים נפתחים רק למכשיר שיש
   לו "אושר" בלשונית "גישה", ורק לישיבה שלו.

   מכשיר שעוד לא אושר (גם אם יש לו קוד מפעם) — נרשם כממתין,
   והרכז מקבל התראה מיד (accAsk_). מכשיר שאינו מוכר — מתבקש
   להירשם כאיש צוות באפליקציה.

   `ACC_ONLY = false` מחזיר את הגישה לפי הקוד, כמו שהייתה. */
var ACC_ONLY = true;
/* null = מותר. אחרת — התשובה ללקוח. */
function accGate_(inst, dev, hadCode) {
  inst = String(inst || '').trim(); dev = String(dev || '').trim();
  /* הדרך הקצרה — מאושר לישיבה הזו, בלי לקרוא את "התראות". */
  var mine = dev ? accRow_(dev) : null;
  if (mine && mine.st === 'אושר' && mine.inst === inst) return null;
  var a = dev ? accAsk_(inst, dev, hadCode) : { status: 'none' };
  if (a.status === 'ok') return null;
  if (a.status === 'locked') return { status: 'locked',
    message: 'הגישה ללוח של הישיבה נעולה. לפרטים — פנו לרכז התוכנית.' };
  if (a.status === 'wait') return { status: 'wait', phone: a.phone,
    message: 'הבקשה שלך אצל רכז התוכנית. ברגע שיאשר — הלוח ייפתח כאן.' };
  return { status: 'unknown',
    message: 'כדי לראות את הלוח — הירשמו כאיש צוות באפליקציה. רכז התוכנית יאשר.' };
}

/* פעם אחת: כל מכשיר של איש צוות שכבר רשום ב"התראות" ואין לו
   שורה ב"גישה" — נכנס כממתין, בלי לחכות שיפתח את הלוח. התראה
   אחת לרכז עם המספר, ולא אחת לכל אחד. */
function accSeed_() {
  var pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('accSeed1')) return;
  pr.setProperty('accSeed1', String(new Date()));
  var ps = sheet_('התראות');
  if (ps.getLastRow() < 2) return;
  var pv = ps.getDataRange().getDisplayValues(), ph = pv[0], pi = {};
  for (var i = 0; i < ph.length; i++) pi[String(ph[i]).trim()] = i;
  if (pi['מזהה'] === undefined || pi['קוד ישיבה'] === undefined || pi['תפקיד'] === undefined) return;
  var g = function (row, k) { return pi[k] === undefined ? '' : String(row[pi[k]] || '').trim(); };
  var NOT_STAFF = { '': 1, 'תלמיד': 1, 'הורה': 1, 'אב': 1, 'רכז': 1 };
  var last = {};
  for (var r = 1; r < pv.length; r++) {
    var dev = g(pv[r], 'מזהה'), inst = g(pv[r], 'קוד ישיבה');
    if (!dev || dev.length < 6 || !inst || NOT_STAFF[g(pv[r], 'תפקיד')]) continue;
    last[dev] = pv[r];
  }
  var sh = sheet_(ACC_TAB);
  if (!sh.getLastRow()) headRow_(sh, ACC_HEAD);
  var head = headers_(sh), ix = {}, have = {};
  for (var h = 0; h < head.length; h++) ix[String(head[h]).trim()] = h;
  if (sh.getLastRow() > 1) {
    var av = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getDisplayValues();
    for (var a = 0; a < av.length; a++) have[String(av[a][ix['מזהה']] || '').trim()] = 1;
  }
  var add = [], now = new Date();
  for (var d in last) {
    if (!last.hasOwnProperty(d) || have[d]) continue;
    var row = [], v = { 'מזהה': d, 'שם': g(last[d], 'שם'), 'טלפון': g(last[d], 'טלפון'),
      'ישיבה': g(last[d], 'ישיבה'), 'קוד ישיבה': g(last[d], 'קוד ישיבה'),
      'תפקיד': g(last[d], 'תפקיד'), 'מצב': 'ממתין', 'ביקש': now };
    for (var c = 0; c < head.length; c++) {
      var hk = String(head[c]).trim();
      row.push(v[hk] === undefined ? '' : v[hk]);
    }
    add.push(row);
  }
  if (!add.length) return;
  sh.getRange(sh.getLastRow() + 1, 1, add.length, head.length).setValues(add);
  coordPing_('🔑 ' + add.length + ' אנשי צוות ממתינים לאימות',
    'הלוח נפתח עכשיו רק למי שאישרת. הם ברשימת הממתינים.', './#admin-acc');
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
      var byId = {}, order = [], grp = amdaGroupIds_();
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
          way:   amdaWay_(grp, pid, cell(row, 'מסגרת')),
          role:  cell(row, 'תפקיד'),
          with:  cell(row, 'שם ההורה'),        /* שם פרטי בלבד */
          test:  isTest ? 1 : 0,
          /* נוצר מהעמדה ועוד לא נכנס מאף מכשיר — "לא התקין". */
          nodev: /^Am/.test(pid) && !cell(row, ALIAS_COL) ? 1 : 0,
          weeks: [],
          pos:   {}                            /* 'מסלול|שבוע' → 0–1 */
        };
      }
      /* נקודות — לכל תלמיד, בכל מוסד (ptsAll_). הלוח כבר מוגבל לתלמידי
         המוסד שלו. כישלון — בלי `pts` בכלל, והלוח אינו מציג 0. */
      var ptsT = null;
      try { ptsT = ptsAll_(); } catch (eP) { ptsT = null; }
      order.forEach(function (pid) {
        var p = byId[pid];
        /* הלוח הוא רשימת הנוכחות של תלמידי הישיבה. אבא אינו
           תלמיד שלה, ושמו אינו צריך להגיע לצוות — מה שהצוות
           צריך לדעת יושב על שורת הבן. */
        if (p.role === 'הורה') return;
        var pv = ptsOf_(ptsT, pid);
        if (pv) p.pts = pv;
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
/* שם משפחה להשוואה בלבד (`pairFor`): גם בלי מקפים. לא בתוך
   `nk_` — הוא בונה את מפתח האדם, ושינוי בו היה מאחד שורות. */
function lastKey_(v) { return nk_(v).replace(/[-־–—]/g, ''); }

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
  /* תלמיד שלמד בעמדה לפני שהתקין — יש לו כבר שורה (מזהה Am…).
     ההרשמה האמיתית נבלעת בה, וכל מה שנספר לו בעמדה נשאר שלו. */
  if (r < 1 && get('תפקיד') !== 'הורה') {
    r = rowOfAmda_(t, get('קוד ישיבה'), get('שם'), get('משפחה'), get('שכבה'));
  }
  if (r < 1) return cols;
  var al = t.c(t.rows[r], ALIAS_COL);
  setv('מזהה', t.c(t.rows[r], 'מזהה'));
  setv(ALIAS_COL, (al ? al + ' ' : '') + id);
  return cols;
}

/* שורה שהעמדה יצרה (מזהה Am…) לאותו תלמיד: אותו מוסד, אותו שם
   (בכל סדר — בשורה שלא פוצלה השם המלא יושב כולו ב"שם"), ושכבה
   שאינה סותרת. רק אחת — שתיים זה לא בטוח, ואז לא נבלעים. */
function rowOfAmda_(t, inst, first, last, grade) {
  inst = String(inst || '').trim();
  var f = nk_(first), l = nk_(last), g = amdaNorm_(grade).replace(/["'׳״]/g, '');
  if (!inst || !f || !l) return -1;
  var hit = -1;
  for (var r = 1; r < t.rows.length; r++) {
    var row = t.rows[r];
    if (!/^Am/.test(t.c(row, 'מזהה')) || t.c(row, 'קוד ישיבה') !== inst) continue;
    var sf = nk_(t.c(row, 'שם')), sl = nk_(t.c(row, 'משפחה'));
    if (!(sf + sl === f + l || sl + sf === f + l || sf + sl === l + f)) continue;
    var sg = amdaNorm_(t.c(row, 'שכבה')).replace(/["'׳״]/g, '');
    if (g && sg && g !== sg) continue;
    if (hit > 0) return -1;
    hit = r;
  }
  return hit;
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

/* ============================================================
   **מי שאיש צוות סימן בעמדה — לומד בחבורה.**
   ============================================================
   "תלמיד שאיש צוות סימן בעמדת הלימוד עובר אוטומטית ל'לומד
   בחבורה', גם אם סימן לעצמו 'לומד לבד'. סימון הצוות הוא הקובע."

   **נקבע בקריאה, ולא נכתב לשורה.** שורת "לומדים" שייכת למכשיר
   של התלמיד, והרשמה חוזרת ממנו הייתה מחזירה "לבד" ודורסת. כאן
   — בכל מקום שמציג או סופר דרך לימוד (הלוח, המונים, המכשיר) —
   מי שיש לו שורה ב"עמדה — שיוך" נספר בחבורה. "אבות ובנים" נשאר:
   הוא לומד עם אביו, והעמדה אינה סותרת את זה.
   ============================================================ */
var AMDA_WAY_ = 'חבורת לימוד';
function amdaGroupIds_() {
  var out = {};
  try {
    var lt = amdaTable_(AMDA_LINK_);
    for (var i = 1; i < lt.rows.length; i++) {
      var id = lt.c(lt.rows[i], 'מזהה');
      if (id) out[id] = 1;
    }
  } catch (e) { Logger.log('amdaGroupIds_: ' + e); }
  return out;
}
function amdaWay_(grp, id, way) {
  return (grp && grp[id] && (!way || way === 'לימוד עצמי')) ? AMDA_WAY_ : way;
}

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
    /* דיווח שנדחה ב-partSoon_ — נספר עכשיו. */
    if (cache.get('partDue') && !cache.get('partRc')) {
      cache.remove('partDue'); cache.put('partRc', '1', 30);
      recount_();
    }
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
    /* "השתתף" בלבד — נספר בעמדה, אבל לא כמי שלמד את הדף. */
    if (cx('רמה') === AMDA_LV_P_) continue;
    var key = [cx('קוד ישיבה'), cx('שכבה'), cx('כיתה'), amdaNorm_(cx('שם')),
               cx('מסלול'), cx('שבוע')].join('|');
    if (seen[key] || had['k:' + key]) continue;
    seen[key] = 1;
    want.push({ key: key, inst: cx('קוד ישיבה'), g: amdaNorm_(cx('שכבה')), c: cx('כיתה'),
                n: amdaNorm_(cx('שם')), track: cx('מסלול'), wk: cx('שבוע'), daf: cx('דף'),
                /* רק אישור מפורש (8.99.256) — "למד וחידון" ישן היה ברירת מחדל. */
                quiz: cx('אישור חידון') === 'כן' });
  }
  if (!want.length) { amdaAmbSave_([]); return 0; }

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
  var sh = sheet_(LEARN_TAB), head = headers_(sh), wrote = 0, lastWk = 0, made = 0, linked = 0, amb = [];
  var lsh = lt.sh, lhead = headers_(lsh), dir = null, jhead = null, instNm = {};
  want.forEach(function (w) {
    var cand = (byName[w.inst + '|' + w.n] || []).filter(function (j, i, a) {
      if (a.indexOf(j) !== i) return false;
      var g = amdaNorm_(jt.c(jt.rows[j], 'שכבה'));
      return !g || g === w.g;
    });
    if (cand.length > 1) {
      var byCl = cand.filter(function (j) {
        return String(jt.c(jt.rows[j], 'כיתה')).replace(/\D/g, '') === String(w.c).replace(/\D/g, '');
      });
      /* הכיתה לא הכריעה (אף אחד מהם, או אין כיתה) — עדיין לא הוכרע.
         עד 8.99.264 זה נפל ל"אין מועמד" ונוצרה שורת Am… — אדם נוסף. */
      cand = byCl.length ? byCl : cand;
    }
    var id = '';
    if (cand.length === 1) id = jt.c(jt.rows[cand[0]], 'מזהה');
    /* **שם שמתאים ליותר מנרשם אחד — לא מנחשים, וגם לא שותקים.**
       הרישום נשאר בנוכחות, לא שויך, ומוצג לרכז במסך הנוכחות
       (`?amdaAmb=`) עם מספר ההתאמות — להכרעה ביד. */
    else if (cand.length > 1) amb.push([w.inst, w.g, w.c, w.n, w.track, w.wk, cand.length]);
    else if (!cand.length) {
      /* **למד בעמדה ועוד לא התקין.** בלי שורה ב"לומדים" הוא לא
         נספר בשום מקום — לא בלוח, לא במונה השבועי ולא בניהול.
         נוצרת לו שורה (מזהה Am… קבוע לפי מוסד·שכבה·כיתה·שם, כך
         שהרצה חוזרת מוצאת אותה), עם הטלפון מרשימת התלמידים אם
         יש. כשיירשם באמת — ההרשמה נבלעת בה (rowOfAmda_). */
      if (dir === null) dir = amdaDir_();
      if (!jhead) {
        jhead = headers_(jt.sh);
        for (var q = 1; q < jt.rows.length; q++) {
          var qc = jt.c(jt.rows[q], 'קוד ישיבה');
          if (qc && !instNm[qc]) instNm[qc] = jt.c(jt.rows[q], 'ישיבה');
        }
      }
      id = amdaLearner_(jt, jhead, w, dir, instNm);
      if (id === '+') { made++; id = amdaId_(w); }
    }
    if (!id) return;
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
    /* "ענה על החידון" — שורה ב"חידות" עם המקור, לסיכום החידונים
       בניהול. אינה ציון ואינה נספרת בנקודות או בהגרלה: שם קובע
       האישור המפורש בשורת הנוכחות (amdaQz_). */
    if (w.quiz) {
      try {
        var qsh = sheet_('חידות'), qh = headers_(qsh), qr = [];
        put_(qr, idx_(qsh, qh, 'תאריך'), new Date());
        [['דף', w.track + '|' + w.daf], ['קטע', 'עמדת לימוד'], ['שבוע', w.track + '-' + w.wk],
         ['ישיבה', w.inst], ['שם', w.n], ['נכון', 'נכון'], ['מזהה', id], ['מקור', 'עמדת לימוד']
        ].forEach(function (p) { put_(qr, idx_(qsh, qh, p[0]), cell_(p[1])); });
        for (var qi = 0; qi < qr.length; qi++) if (qr[qi] === undefined) qr[qi] = '';
        qsh.appendRow(qr);
      } catch (qe) {}
    }
    var lr = [];
    put_(lr, idx_(lsh, lhead, 'תאריך'), new Date());
    [['מזהה', id], ['מסלול', w.track], ['שבוע', w.wk], ['דף', w.daf], ['מפתח', w.key]
    ].forEach(function (p) { put_(lr, idx_(lsh, lhead, p[0]), cell_(p[1])); });
    for (var q = 0; q < lr.length; q++) if (lr[q] === undefined) lr[q] = '';
    lsh.appendRow(lr);
    linked++;
  });
  /* שיוך חדש יכול להעביר תלמיד ל"לומד בחבורה" — המשבצות נספרות מחדש. */
  if (made || linked) recount_();
  if (wrote) recountLearn_();
  /* שיוך חדש — אישור חידון שחיכה לו נכנס לנקודות ולזכאות. */
  if (linked) amdaQzBust_();
  amdaAmbSave_(amb);
  return wrote;
}
function amdaAmbSave_(amb) {
  try { PropertiesService.getScriptProperties().setProperty('amdaAmb', JSON.stringify(amb.slice(0, 200))); } catch (e) {}
}

var AMDA_LV_P_ = 'השתתף';

/* ============================================================
   "מה למדתם עכשיו?" — שינוי של פתיחה שלמה, אחרי מעשה.
   ============================================================
   כל השורות של אותו יום ומועד מקבלות את הסוג (דף/שיעור), את
   הדף ואת הרמה. מי שהפסיק להיחשב כמי שלמד (נושא אחר, או
   "השתתף" בלבד) — שורת הסיום שהעמדה כתבה לו יורדת, אלא אם
   למד את אותו דף בעמדה בפתיחה אחרת. מי שהתחיל להיחשב — השיוך
   הרגיל (amdaSync_) כותב לו. */
function amdaKind_(d) {
  var day = String(d.day || '').trim(), slot = String(d.slot || '').trim();
  var dafK = d.kind === 'd', lvl = String(d.lvl || '').trim();
  if (!day || !slot) return { status: 'error', message: 'חסר יום או מועד' };
  var at = amdaTable_(AMDA_TAB_), sh = at.sh, head = headers_(sh), n = 0, drop = {};
  var iK = idx_(sh, head, 'סוג'), iT = idx_(sh, head, 'מסלול'), iD = idx_(sh, head, 'דף'), iL = idx_(sh, head, 'רמה');
  /* אישור החידון הולך עם הרמה: רק "למד וחידון" שנבחר במפורש בפתיחה
     (`qz`) — תיקון לסוג אחר או לרמה אחרת מוריד אותו. */
  var iQ = idx_(sh, head, 'אישור חידון'), qz = dafK && lvl === 'למד וחידון' && String(d.qz || '') === '1';
  var key = function (x) {
    return [at.c(x, 'קוד ישיבה'), at.c(x, 'שכבה'), at.c(x, 'כיתה'), amdaNorm_(at.c(x, 'שם')),
            at.c(x, 'מסלול'), at.c(x, 'שבוע')].join('|');
  };
  var learned = function (x) { return at.c(x, 'סוג') === 'דף' && at.c(x, 'רמה') !== AMDA_LV_P_; };
  for (var r = 1; r < at.rows.length; r++) {
    var x = at.rows[r];
    if (at.c(x, 'יום') !== day || at.c(x, 'קוד עמדה') !== slot) continue;
    var was = learned(x), oldKey = key(x);
    var trk = dafK ? String(d.track || at.c(x, 'מסלול') || '') : '';
    var daf = dafK ? String(d.daf || at.c(x, 'דף') || '') : '';
    sh.getRange(r + 1, iK + 1).setValue(dafK ? 'דף' : 'שיעור');
    sh.getRange(r + 1, iT + 1).setValue(trk);
    sh.getRange(r + 1, iD + 1).setValue(daf);
    sh.getRange(r + 1, iL + 1).setValue(lvl);
    sh.getRange(r + 1, iQ + 1).setValue(qz ? 'כן' : '');
    if (was && !(dafK && lvl !== AMDA_LV_P_)) drop[oldKey] = 1;
    n++;
  }
  /* מי שעדיין לומד את אותו דף בפתיחה אחרת — נשאר. */
  if (Object.keys(drop).length) {
    var at2 = amdaTable_(AMDA_TAB_);
    for (var r2 = 1; r2 < at2.rows.length; r2++) {
      var y = at2.rows[r2];
      if (at2.c(y, 'סוג') === 'דף' && at2.c(y, 'רמה') !== AMDA_LV_P_) {
        delete drop[[at2.c(y, 'קוד ישיבה'), at2.c(y, 'שכבה'), at2.c(y, 'כיתה'), amdaNorm_(at2.c(y, 'שם')),
                     at2.c(y, 'מסלול'), at2.c(y, 'שבוע')].join('|')];
      }
    }
    amdaUnlink_(drop);
  }
  amdaSync_();
  recount_();
  recountLearn_(true);
  amdaQzBust_();
  return { status: 'ok', rows: n };
}
/* מוריד את השיוך ואת שורת הסיום שהעמדה כתבה, לכל מפתח ב-`keys`. */
function amdaUnlink_(keys) {
  var lt = amdaTable_(AMDA_LINK_), gone = {}, del = [];
  for (var l = 1; l < lt.rows.length; l++) {
    if (!keys[lt.c(lt.rows[l], 'מפתח')]) continue;
    gone[lt.c(lt.rows[l], 'מזהה') + '|' + lt.c(lt.rows[l], 'מסלול') + '|' + lt.c(lt.rows[l], 'שבוע')] = 1;
    del.push(l + 1);
  }
  del.sort(function (a, b) { return b - a; }).forEach(function (r) { lt.sh.deleteRow(r); });
  if (!del.length) return;
  var sh = sheet_(LEARN_TAB);
  if (sh.getLastRow() < 2) return;
  var v = sh.getDataRange().getDisplayValues(), h = v[0], ix = {}, dl = [];
  for (var i = 0; i < h.length; i++) ix[String(h[i]).trim()] = i;
  for (var r = v.length - 1; r >= 1; r--) {
    if (String(v[r][ix['מקור']] || '') !== 'עמדת לימוד') continue;
    if (gone[v[r][ix['מזהה']] + '|' + v[r][ix['מסלול']] + '|' + v[r][ix['שבוע']]]) dl.push(r + 1);
  }
  dl.forEach(function (r) { sh.deleteRow(r); });
}

/* ============================================================
   נוכחות בשיעור — הרשימה של ישיבה אחת, מתוך "תלמידי הרשת".
   ============================================================
   הלשונית מחזיקה גם טלפונים (של התלמיד ושל ההורה). מכאן יוצאים
   **רק** שכבה, כיתה ושם — רק של ז׳ וח׳, ורק של הישיבה שהמכשיר אושר אליה. כל
   שליפה נרשמת ב"יומן מאגר": מי, איזו ישיבה, כמה, ומתי. */
var NET_TAB_ = 'תלמידי הרשת';
/* **זיכרון לכל ישיבה.** הלשונית גדולה (עשרות אלפי שורות), וקריאה
   מלאה בכל פתיחה היא שניות של המתנה — ובבוקר כולם פותחים יחד. הרשימה
   של ישיבה נשמרת במטמון של הסקריפט לשש שעות, תחת "גרסת מאגר" שמתחלפת
   בכל העלאה (ראו `table` ב-doPost) — מאגר חדש אינו מחכה למטמון ישן. */
function netRoster_(inst, dev) {
  var out = null, ck = '';
  try {
    var ver = PropertiesService.getScriptProperties().getProperty('netVer') || '0';
    ck = 'nr' + ver + '_' + inst;
    var hit = CacheService.getScriptCache().get(ck);
    if (hit) out = JSON.parse(hit);
  } catch (eC) { out = null; }
  if (!out) {
    out = netRosterRead_(inst);
    try { if (ck) CacheService.getScriptCache().put(ck, JSON.stringify(out), 21600); } catch (eP) {}
  }
  try {
    appendCols_('יומן מאגר', [['מתי', new Date()], ['מזהה', dev || ''], ['קוד ישיבה', inst],
                              ['תלמידים', out.length]]);
  } catch (eL) {}
  return { status: 'ok', inst: inst, rows: out };
}
function netRosterRead_(inst) {
  var t = amdaTable_(NET_TAB_), out = [];
  for (var r = 1; r < t.rows.length; r++) {
    if (t.c(t.rows[r], 'קוד ישיבה') !== inst) continue;
    var g = t.c(t.rows[r], 'שכבה').replace(/["'׳״\s]/g, ''), c = t.c(t.rows[r], 'כיתה');
    var n = (t.c(t.rows[r], 'משפחה') + ' ' + t.c(t.rows[r], 'פרטי')).replace(/\s+/g, ' ').trim();
    /* השכבות שבתוכנית בלבד — ז׳ וח׳. מה שאין בו צורך אינו יוצא. */
    if (g && c && n && (g === 'ז' || g === 'ח')) out.push([g, c, n]);
  }
  return out;
}
/* ============================================================
   ייבוא חכם ל"תלמידי הרשת" — מיזוג, לא דריסה.
   ============================================================
   עד 8.99.236 כל העלאה כתבה את הלשונית מחדש (`table`): מה שלא היה
   בקובץ נמחק. קובץ של ישיבה אחת היה מוחק את כל השאר. כאן:

   · המכשיר קורא את הלשונית, בונה תצוגה, והרכז מכריע. מה שנשלח הוא
     רשימת פעולות — `add` (שורה חדשה) ו-`set` (שדות בשורה קיימת) —
     ולא הלשונית כולה.
   · `base` — חתימת הלשונית כפי שהמכשיר קרא אותה. השתנתה מאז
     (כתיבה מקבילה) — לא נוגעים בכלום, והתשובה `stale`. גם בשחזור.
   · כל `set` נושא את ערכי השורה כפי שנקראו (`was`); שורה שזזה או
     השתנתה — הכול נעצר. כל הבדיקות לפני הכתיבה הראשונה.
   · `insts` — הישיבות של הייבוא הזה. שורה של ישיבה אחרת — לא נוגעים.

   **כתיבה אחת, יומן, והחזרה מאומתת (8.99.238).** עד עכשיו המיזוג
   כתב תא אחרי תא, וכשל באמצע השאיר חצי שינוי. השחזור ניקה את הלשונית
   ואז העתיק — כשל בהעתקה השאיר אותה ריקה. עכשיו:
   1. הלשונית החדשה נבנית בזיכרון, במלואה.
   2. גיבוי מאומת (netBackup_), בשם שאינו מתנגש באף גיבוי קיים.
   3. יומן (`NETJ`): חתימת הלפני, חתימת האחרי, ושם הגיבוי.
   4. **קריאה אחת** של setValues על כל המלבן — כל ערך עם גרש מוביל,
      כך שאפס של טלפון נשמר ושום טקסט אינו רץ כנוסחה.
   5. קריאה חוזרת: זהה לאחרי — הצלחה. אחרת — חזרה לגיבוי, ואימות
      שהלשונית זהה ללפני.
   ריצה שנקטעה (זמן קצוב, הפסקה) משאירה את היומן; כל פנייה הבאה
   לייבוא (netHeal_) מכריעה לפיו: אחרי — הושלם; לפני — לא נכתב; אחר —
   חוזרים לגיבוי ומאמתים. אי אפשר לאמת — `broken`, וכל ייבוא ושחזור
   חסומים עד שמישהו יבדוק בגיליון.

   **אותה פעולה לא רצה פעמיים.** כל פעולה נושאת מזהה (`run`), והשרת
   רושם אותו עם חתימת התוכן לפני שהוא מתחיל. אותו מזהה ואותו תוכן —
   מקבלים את התוצאה שנרשמה, בלי לבצע שוב. אותו מזהה ותוכן אחר — נדחה.
   מכשיר שלא קיבל תשובה "חותם" את המזהה (`seal` ב-doGet): פעולה שעוד
   לא הגיעה לא תתבצע לעולם, וכך יש תשובה ודאית מה נשמר.

   הכתיבה הכללית (`table`, `row`, `clear`, `delrow`) ללשונית הזו
   ולגיבויים שלה חסומה ב-doPost — רק המסלול הזה כותב בה.
   ============================================================ */
var NET_BAK_ = 'גיבוי תלמידי הרשת · ';
var NET_BAK_KEEP_ = 6;
/* אותה פונקציה בדיוק ב-index.html (netSig) — על ערכי התצוגה. */
function netSig_(rows) {
  var s = JSON.stringify(rows), h = 5381;
  for (var i = 0; i < s.length; i++) h = (((h * 33) >>> 0) ^ s.charCodeAt(i)) >>> 0;
  return rows.length + ':' + h.toString(36);
}
function netRows_(sh) {
  return sh.getLastRow() ? sh.getDataRange().getDisplayValues() : [];
}
/* הטבלה כפי שהיא נראית: טקסט, בלי רווחי קצה, בלי שורות ועמודות
   ריקות בסוף. היומן משווה בזה — לא בצורת הכתיבה. */
function netTrim_(rows) {
  var t = (rows || []).map(function (r) {
    return (r || []).map(function (v) { return String(v == null ? '' : v).trim(); });
  });
  var w = 0, h = 0;
  t.forEach(function (r, i) {
    for (var j = r.length - 1; j >= 0; j--) if (r[j] !== '') { if (j + 1 > w) w = j + 1; h = i + 1; break; }
  });
  return t.slice(0, h).map(function (r) {
    var o = r.slice(0, w);
    while (o.length < w) o.push('');
    return o;
  });
}
function netSigN_(rows) { return netSig_(netTrim_(rows)); }
function netW_(rows) {
  var w = 0;
  (rows || []).forEach(function (r) { if (r && r.length > w) w = r.length; });
  return w;
}
/* כל הטבלה בקריאה אחת. מה שמעבר לחדשה (שורות או עמודות שהיו) —
   מתרוקן באותה קריאה. גרש מוביל: הטקסט נשמר כמו שהוא. */
function netWrite_(sh, tgt, h0, w0) {
  var h = Math.max(tgt.length, h0, 1), w = Math.max(netW_(tgt), w0, 1), out = [];
  for (var i = 0; i < h; i++) {
    var row = [], src = tgt[i] || [];
    for (var j = 0; j < w; j++) {
      var v = src[j] == null ? '' : String(src[j]);
      row.push(v === '' ? '' : "'" + v);
    }
    out.push(row);
  }
  if (sh.getMaxRows() < h) sh.insertRowsAfter(sh.getMaxRows(), h - sh.getMaxRows());
  if (sh.getMaxColumns() < w) sh.insertColumnsAfter(sh.getMaxColumns(), w - sh.getMaxColumns());
  sh.getRange(1, 1, h, w).setValues(out);
  SpreadsheetApp.flush();
}
function netJ_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('NETJ') || 'null'); }
  catch (e) { return null; }
}
function netRec_(run) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('NETRUN_' + run) || 'null'); }
  catch (e) { return null; }
}
function netRecSet_(run, o) {
  if (run) PropertiesService.getScriptProperties().setProperty('NETRUN_' + run, JSON.stringify(o));
}
function netBumpVer_() {
  try { PropertiesService.getScriptProperties().setProperty('netVer', String(Date.now())); } catch (eV) {}
}
/* היומן מכריע מה קרה לריצה שלא הסתיימה. רץ בתוך הנעילה, לפני כל
   פעולת ייבוא, שחזור או שאלה על תוצאה. מחזיר null כשאין יומן. */
function netHeal_() {
  var j = netJ_();
  if (!j) return null;
  var P = PropertiesService.getScriptProperties();
  var sh = sheet_(NET_TAB_), cur = netRows_(sh), now = netSigN_(cur), res;
  if (now === j.want) {
    res = j.done || { status: 'ok' };
    netBumpVer_();
  } else if (now === j.base) {
    res = { status: 'error', none: 1, message: 'הריצה נקטעה לפני שנכתב דבר — המאגר כפי שהיה' };
  } else {
    var b = j.bak ? sh.getParent().getSheetByName(j.bak) : null, src = b ? netRows_(b) : null;
    var ok = false;
    if (src && netSigN_(src) === j.base) {
      try { netWrite_(sh, src, cur.length, netW_(cur)); ok = netSigN_(netRows_(sh)) === j.base; } catch (eW) { ok = false; }
    }
    if (!ok) {
      j.broken = 1;
      P.setProperty('NETJ', JSON.stringify(j));
      return { status: 'broken', backup: j.bak || '' };
    }
    netBumpVer_();
    res = { status: 'rolledback', none: 1, backup: j.bak,
            message: 'הכתיבה לא הושלמה, והמאגר הוחזר לגיבוי ונבדק — לא נשמר דבר' };
  }
  var rec = netRec_(j.run) || {};
  res.h = rec.h || j.h || '';
  res.at = Date.now();
  netRecSet_(j.run, res);
  P.deleteProperty('NETJ');
  return res;
}
/* כתיבה של טבלה שלמה ליומן — המשותף למיזוג ולשחזור. `base` ו-`want`
   כבר מחושבים; `bak` — גיבוי מאומת של המצב הנוכחי. */
function netCommit_(sh, cur, tgt, j) {
  var P = PropertiesService.getScriptProperties();
  j.base = netSigN_(cur);
  j.want = netSigN_(tgt);
  j.at = Date.now();
  P.setProperty('NETJ', JSON.stringify(j));
  try {
    netWrite_(sh, tgt, cur.length, netW_(cur));
    if (netSigN_(netRows_(sh)) !== j.want) throw new Error('verify');
  } catch (err) {
    /* כשל — היומן מחזיר לגיבוי, מאמת, ורושם את התוצאה. */
    return netHeal_() || { status: 'error', message: String(err) };
  }
  netRecSet_(j.run, j.done);
  P.deleteProperty('NETJ');
  netBumpVer_();
  return null;
}
function netRunDo_(d) {
  var run = String(d.run || '').replace(/[^\w-]/g, '');
  if (!run) return { status: 'error', message: 'חסר מזהה פעולה — לא נעשה שינוי' };
  /* קודם — מה שנשאר מריצה קודמת שנקטעה. */
  var healed = netHeal_();
  var h = netSig_([String(d.action || ''), String(d.base || ''), String(d.cols || ''),
                   String(d.ops || ''), String(d.backup || ''), String(d.insts || '')]);
  var rec = netRunPend_(run);
  if (rec) {
    if (rec.status === 'cancelled') return rec;
    /* אותו מזהה, תוכן אחר — נדחה, ואינו נרשם על התוצאה המקורית. */
    if (rec.h !== h) return { status: 'conflict', message: 'אותו מזהה פעולה עם תוכן אחר — נדחה' };
    /* אותה פעולה בדיוק — התוצאה שכבר נרשמה, בלי לבצע שוב. */
    return rec;
  }
  var out;
  if ((healed && healed.status === 'broken') || netJ_()) {
    out = { status: 'broken', backup: (netJ_() || {}).bak || '' };
  } else {
    netRecSet_(run, { status: 'pending', h: h, at: Date.now() });
    try { out = d.action === 'netRestore' ? netRestore_(d, run, h) : netMerge_(d, run, h); }
    catch (err) { out = netHeal_() || { status: 'error', message: String(err) }; }
  }
  out.h = h;
  out.at = Date.now();
  netRecSet_(run, out);
  netRunGc_();
  return out;
}
/* תוצאות ישנות — לא נצברות. "ממתין" אינו נמחק כאן: netHeal_
   ו-netRunPend_ מכריעים בו. */
function netRunGc_() {
  try {
    var P = PropertiesService.getScriptProperties(), all = P.getProperties(), old = Date.now() - 14 * 864e5;
    for (var k in all) if (k.indexOf('NETRUN_') === 0) {
      var o = null; try { o = JSON.parse(all[k]); } catch (eJ) {}
      if (!o || ((o.at || 0) < old && o.status !== 'pending')) P.deleteProperty(k);
    }
  } catch (eC) {}
}
/* "ממתין" בלי יומן, בזמן שאיש אינו רץ (אנחנו בתוך הנעילה) — ריצה
   שנקטעה לפני שנגעה בלשונית. היומן נכתב לפני הכתיבה הראשונה. */
function netRunPend_(run) {
  var rec = netRec_(run);
  if (rec && rec.status === 'pending' && !netJ_()) {
    rec = { status: 'error', none: 1, h: rec.h, at: Date.now(),
            message: 'הריצה נקטעה לפני שנכתב דבר — המאגר כפי שהיה' };
    netRecSet_(run, rec);
  }
  return rec;
}
/* doGet: מה קרה לפעולה. `seal` — פעולה שעוד לא הגיעה לא תתבצע
   לעולם (נרשמת כמבוטלת), כך שלמכשיר יש תשובה ודאית. */
function netRunGet_(run, seal) {
  var lk = LockService.getScriptLock();
  if (!lk.tryLock(15000)) return { status: 'busy' };
  try {
    var healed = netHeal_();
    if (healed && healed.status === 'broken') return healed;
    var rec = netRunPend_(run);
    if (!rec && seal) {
      rec = { status: 'cancelled', none: 1, at: Date.now() };
      netRecSet_(run, rec);
    }
    return rec || { status: 'none' };
  } finally { lk.releaseLock(); }
}
/* doGet: הגיבויים, החתימה הנוכחית (בסיס לשחזור), ומצב היומן. */
function netBaksGet_() {
  var lk = LockService.getScriptLock();
  if (!lk.tryLock(15000)) return { status: 'busy' };
  try {
    var healed = netHeal_();
    if (healed && healed.status === 'broken') return { status: 'broken', backup: healed.backup, safe: 2 };
    /* `del` — השרת מכיר את מצב ההחלפה (הסרת מי שלא בקובץ, בישיבה אחת). */
    return { status: 'ok', safe: 2, del: 1, baks: netBaks_(), cur: netSig_(netRows_(sheet_(NET_TAB_))) };
  } finally { lk.releaseLock(); }
}
function netMerge_(d, run, h) {
  var sh = sheet_(NET_TAB_);
  var cur = netRows_(sh);
  if (!d.base || netSig_(cur) !== String(d.base)) return { status: 'stale' };
  var cols = parse_(d.cols) || [], ops = parse_(d.ops) || [], insts = parse_(d.insts) || [];
  if (!cols.length) return { status: 'error', message: 'חסרות עמודות' };
  if (!insts.length) return { status: 'error', message: 'חסרות הישיבות של הייבוא — לא נעשה שינוי' };
  var head = cur.length ? cur[0].map(function (x) { return String(x).trim(); }) : [];
  var at = function (row, name) {
    var i = head.indexOf(name);
    return i < 0 ? '' : String(row[i] == null ? '' : row[i]).trim();
  };
  /* כל הבדיקות קודם. שורה שאינה כפי שנקראה — שום דבר לא נכתב. */
  var sets = [], adds = [], dels = [], seen = {};
  for (var i = 0; i < ops.length; i++) {
    var o = ops[i], row = o.row || {}, c;
    for (c in row) if (row.hasOwnProperty(c) && cols.indexOf(c) < 0) {
      return { status: 'error', message: 'עמודה לא מוכרת — לא נעשה שינוי' };
    }
    if (o.k === 'add') {
      if (insts.indexOf(String(row['קוד ישיבה'] || '')) < 0) {
        return { status: 'error', message: 'שורה חדשה מחוץ לישיבות של הייבוא — לא נעשה שינוי' };
      }
      adds.push(row);
      continue;
    }
    if (o.k !== 'set' && o.k !== 'del') return { status: 'error', message: 'פעולה לא מוכרת' };
    var r = +o.r;
    if (!(r >= 2 && r <= cur.length) || seen[r]) return { status: 'stale', why: 'row ' + o.r };
    seen[r] = 1;
    if (!o.was) return { status: 'error', message: 'עדכון בלי הערכים הקודמים — לא נעשה שינוי' };
    for (var w in o.was) {
      if (o.was.hasOwnProperty(w) && at(cur[r - 1], w) !== String(o.was[w] == null ? '' : o.was[w]).trim()) {
        return { status: 'stale', why: 'row ' + r + ' · ' + w };
      }
    }
    if (insts.indexOf(at(cur[r - 1], 'קוד ישיבה')) < 0 || row.hasOwnProperty('קוד ישיבה')) {
      return { status: 'error', message: 'עדכון של תלמיד מישיבה אחרת — לא נעשה שינוי' };
    }
    /* הסרה (מצב החלפה) — רק מהלשונית הזו. לימוד, נוכחות, עמדה וחידות
       אינם נוגעים כאן, ולכן תלמיד שיחזור באותו שם — ההיסטוריה מתחברת. */
    if (o.k === 'del') { dels.push(r); continue; }
    sets.push({ r: r, row: row });
  }
  if (!sets.length && !adds.length && !dels.length) return { status: 'ok', set: 0, add: 0, del: 0, backup: '' };
  /* הטבלה החדשה — בזיכרון. כותרות: לשונית ריקה מקבלת את כולן;
     עמודה חסרה — נוספת בסוף. */
  var tgt = cur.map(function (x) { return x.slice(); });
  var hd = head.join('') ? head.slice() : [];
  if (!tgt.length) tgt.push([]);
  cols.forEach(function (x) { if (hd.indexOf(x) < 0) hd.push(x); });
  var W = hd.length;
  tgt[0] = hd.slice();
  tgt.forEach(function (x) { while (x.length < W) x.push(''); });
  sets.forEach(function (x) {
    for (var c2 in x.row) if (x.row.hasOwnProperty(c2)) tgt[x.r - 1][hd.indexOf(c2)] = String(x.row[c2] == null ? '' : x.row[c2]).trim();
  });
  var gone = [];
  if (dels.length) {
    var dm = {};
    dels.forEach(function (r2) { dm[r2] = 1; gone.push(cur[r2 - 1]); });
    tgt = tgt.filter(function (x, i2) { return !dm[i2 + 1]; });
  }
  adds.forEach(function (a) {
    var nr = [];
    for (var j2 = 0; j2 < W; j2++) nr.push(a.hasOwnProperty(hd[j2]) ? String(a[hd[j2]] == null ? '' : a[hd[j2]]).trim() : '');
    tgt.push(nr);
  });
  /* הגיבוי — לפני השינוי הראשון, ומאומת. נכשל — לא משנים. */
  var bak = netBackup_(sh, cur);
  var done = { status: 'ok', set: sets.length, add: adds.length, del: dels.length, backup: bak, h: h };
  var bad = netCommit_(sh, cur, tgt, { run: run, h: h, kind: 'merge', bak: bak, done: done });
  if (bad) return bad;
  if (gone.length) done.arch = netArchive_(head, gone);
  if (W > netW_(cur) && cur.length) {
    try {
      sh.getRange(1, 1, 1, W).setFontWeight('bold').setBackground('#17468F').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    } catch (eF) {}
  }
  netBakGc_([bak]);
  done.sig = netSig_(netRows_(sh));
  return done;
}
/* שורות שהוסרו במצב החלפה — לארכיון (פרטי), כפי שהיו. בלי מזהה,
   ולכן אינן ברשימת הארכיון של הלוח (archiveList_) ואינן "משוחזרות"
   ל"לומדים". הגיבוי של הלשונית כבר נעשה; זה רק תיעוד נוסף. */
function netArchive_(head, gone) {
  try {
    var ash = sheet_(ARCH_TAB);
    if (!ash.getLastRow()) headRow_(ash, ARCH_HEAD);
    var at = new Date(), out = gone.map(function (row) {
      var o = {}, c = function (n) { var i = head.indexOf(n); return i < 0 ? '' : String(row[i] == null ? '' : row[i]); };
      head.forEach(function (hh, i) { if (hh) o[hh] = row[i]; });
      return [at, '', c('פרטי'), c('משפחה'), c('קוד ישיבה'), 'תלמיד', NET_TAB_, JSON.stringify(o)];
    });
    var before = ash.getLastRow();
    ash.getRange(before + 1, 1, out.length, out[0].length).setValues(out);
    return ash.getLastRow() - before;
  } catch (eA) { return 0; }
}
/* שם פנוי לגיבוי — לעולם לא מוחקים גיבוי קיים באותו שם. */
function netBakName_(ss) {
  var base = NET_BAK_ + Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
  var name = base, k = 2;
  while (ss.getSheetByName(name)) name = base + ' #' + (k++);
  return name;
}
/* עותק של הלשונית, באותו גיליון פרטי, מוסתר. החתימה והגודל נרשמים —
   לאימות הגיבוי לפני שחזור. הניקוי נעשה רק אחרי שהפעולה הצליחה
   (netBakGc_), ולעולם לא נוגע בגיבוי שנבחר או שנוצר עכשיו. */
function netBackup_(sh, rows) {
  var ss = sh.getParent();
  var name = netBakName_(ss);
  var c = sh.copyTo(ss).setName(name);
  try { c.hideSheet(); } catch (eH) {}
  SpreadsheetApp.flush();
  var got = netRows_(c);
  if (netSig_(got) !== netSig_(rows)) {
    try { ss.deleteSheet(c); } catch (eD) {}
    throw new Error('הגיבוי לא הושלם — לא נעשה שינוי');
  }
  var P = PropertiesService.getScriptProperties(), meta = {};
  try { meta = JSON.parse(P.getProperty('NETBAK') || '{}') || {}; } catch (eM) { meta = {}; }
  meta[name] = { n: Math.max(0, rows.length - 1), sig: netSig_(rows) };
  P.setProperty('NETBAK', JSON.stringify(meta));
  return name;
}
/* נשמרים NET_BAK_KEEP_ האחרונים, ותמיד גם `keep`. */
function netBakGc_(keep) {
  try {
    var ss = sheet_(NET_TAB_).getParent(), P = PropertiesService.getScriptProperties(), meta = {};
    try { meta = JSON.parse(P.getProperty('NETBAK') || '{}') || {}; } catch (eM) { meta = {}; }
    var j = netJ_();
    if (j && j.bak) keep = (keep || []).concat([j.bak]);
    var names = ss.getSheets().map(function (x) { return x.getName(); })
      .filter(function (x) { return x.indexOf(NET_BAK_) === 0; }).sort().reverse();
    names.slice(NET_BAK_KEEP_).forEach(function (x) {
      if ((keep || []).indexOf(x) >= 0) return;
      try { ss.deleteSheet(ss.getSheetByName(x)); delete meta[x]; } catch (eX) {}
    });
    var left = ss.getSheets().map(function (x) { return x.getName(); });
    for (var k in meta) if (meta.hasOwnProperty(k) && left.indexOf(k) < 0) delete meta[k];
    P.setProperty('NETBAK', JSON.stringify(meta));
  } catch (eG) {}
}
function netBaks_() {
  var meta = {};
  try { meta = JSON.parse(prop_('NETBAK', '{}')) || {}; } catch (eM) { meta = {}; }
  var ss = sheet_(NET_TAB_).getParent();
  return ss.getSheets().map(function (x) { return x.getName(); })
    .filter(function (x) { return x.indexOf(NET_BAK_) === 0 && meta[x]; }).sort().reverse()
    .map(function (x) { return { name: x, n: meta[x].n, sig: meta[x].sig }; });
}
/* שחזור. הגיבוי שנבחר נבדק קודם (קיים, רשום, וזהה לחתימה שנרשמה
   כשנוצר); המצב הנוכחי חייב להיות זה שהמכשיר ראה; המצב הנוכחי
   מגובה; והגיבוי נכתב בקריאה אחת דרך היומן — כשל מחזיר את מה שהיה. */
function netRestore_(d, run, h) {
  var name = String(d.backup || '');
  if (name.indexOf(NET_BAK_) !== 0) return { status: 'error', message: 'גיבוי לא מוכר' };
  var sh = sheet_(NET_TAB_), ss = sh.getParent(), b = ss.getSheetByName(name);
  var meta = {};
  try { meta = JSON.parse(prop_('NETBAK', '{}')) || {}; } catch (eM) { meta = {}; }
  if (!b || !meta[name]) return { status: 'error', message: 'הגיבוי לא נמצא — לא נעשה שינוי' };
  var src = netRows_(b);
  var hok = src.length && src[0].map(function (x) { return String(x).trim(); }).indexOf('קוד ישיבה') >= 0;
  if (!hok || netSig_(src) !== meta[name].sig) {
    return { status: 'error', message: 'הגיבוי שנבחר אינו זהה למה שנשמר בו — לא נעשה שינוי' };
  }
  var cur = netRows_(sh);
  if (!d.base) return { status: 'error', message: 'חסר המצב הנוכחי כפי שנקרא — לא נעשה שינוי' };
  if (netSig_(cur) !== String(d.base)) return { status: 'stale' };
  var bak = netBackup_(sh, cur);
  var done = { status: 'ok', backup: bak, restored: name, sig: meta[name].sig, h: h };
  var bad = netCommit_(sh, cur, src, { run: run, h: h, kind: 'restore', bak: bak, done: done });
  if (bad) return bad;
  netBakGc_([name, bak]);
  return done;
}

/* הרישומים של ישיבה אחת — לאימות התור במכשיר (no-cors תמיד "מצליח"). */
function netMarks_(inst) {
  var t = amdaTable_(AMDA_TAB_);
  if (!t.rows.length) return { status: 'ok', rows: [] };
  var out = [t.rows[0]];
  for (var r = 1; r < t.rows.length; r++) if (t.c(t.rows[r], 'קוד ישיבה') === inst) out.push(t.rows[r]);
  try { amdaSyncSoon_(); } catch (eS) {}
  return { status: 'ok', rows: out };
}

/* מזהה קבוע לתלמיד מהעמדה: אותו תלמיד → אותו מזהה בכל הרצה. */
function amdaId_(w) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
    [w.inst, w.g, String(w.c).replace(/\D/g, ''), w.n].join('|'), Utilities.Charset.UTF_8);
  return 'Am' + Utilities.base64EncodeWebSafe(raw).replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
}
/* רשימות התלמידים בגיליון הפרטי — לפיצול השם ולטלפון.
   "תלמידי הרשת" (עם קוד ישיבה) ו"טלפוני תלמידים" (קובץ של בית
   ספר אחד, בלי קוד — תקף לכל מוסד). מפתח: מוסד|שכבה|"משפחה פרטי". */
function amdaDir_() {
  var out = {};
  var add = function (inst, g, last, first, ph) {
    last = String(last || '').replace(/\s+/g, ' ').trim();
    first = String(first || '').replace(/\s+/g, ' ').trim();
    if (!last || !first) return;
    var k = inst + '|' + amdaNorm_(g).replace(/["'׳״]/g, '') + '|' + amdaNorm_(last + ' ' + first);
    out[k] = out[k] === undefined ? { l: last, f: first, p: String(ph || '').trim() } : null;  /* כפול — לא בטוח */
  };
  [['תלמידי הרשת', 1], ['טלפוני תלמידים', 0]].forEach(function (d) {
    try {
      var ss = SpreadsheetApp.openById(PRIVATE_ID).getSheetByName(d[0]);
      if (!ss || ss.getLastRow() < 2) return;
      var v = ss.getDataRange().getDisplayValues(), h = v[0].map(function (x) { return String(x).trim(); });
      var c = function (re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
      var iI = c(/^קוד ישיבה$/), iG = c(/שכבה/), iL = c(/משפחה/), iF = c(/פרטי/), iP = c(/טלפון|נייד/);
      if (iG < 0 || iL < 0 || iF < 0 || (d[1] && iI < 0)) return;
      for (var r = 1; r < v.length; r++) {
        add(d[1] ? String(v[r][iI] || '').trim() : '*', v[r][iG], v[r][iL], v[r][iF], iP >= 0 ? v[r][iP] : '');
      }
    } catch (e) {}
  });
  return out;
}
/* שורה ב"לומדים" לתלמיד מהעמדה. מחזיר את המזהה אם כבר קיימת,
   '+' אם נוצרה עכשיו, '' אם אין מספיק פרטים. */
function amdaLearner_(jt, head, w, dir, instNm) {
  var id = amdaId_(w);
  if (rowOfId_(jt, id) >= 1) return id;
  if (!w.inst || !w.n) return '';
  var hit = dir[w.inst + '|' + w.g + '|' + w.n] || dir['*|' + w.g + '|' + w.n] || null;
  var first = hit ? hit.f : w.n, last = hit ? hit.l : '';
  var row = [], sh = jt.sh;
  put_(row, idx_(sh, head, 'תאריך'), new Date());
  [['מזהה', id], ['ישיבה', instNm[w.inst] || ''], ['קוד ישיבה', w.inst], ['שם', first],
   ['משפחה', last], ['שכבה', w.g], ['כיתה', w.c], ['טלפון', hit ? hit.p : ''],
   ['מקור', 'עמדת לימוד']
  ].forEach(function (p) { put_(row, idx_(sh, head, p[0]), cell_(p[1])); });
  for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
  sh.appendRow(row);
  /* גם בזיכרון — תלמיד שלמד בשני שבועות לא ייווצר פעמיים. */
  var mem = [];
  for (var j = 0; j < head.length; j++) mem.push(row[j] === undefined ? '' : String(row[j]).replace(/^'/, ''));
  jt.rows.push(mem);
  return '+';
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

/* דרך הלימוד אחרי סימון העמדה (ראו amdaWay_) — על עותק, כדי לא
   לשנות את השורות שהקורא עוד משתמש בהן. */
function amdaWayRows_(rows) {
  if (!rows || rows.length < 2) return rows;
  var head = rows[0], iId = -1, iW = -1;
  for (var i = 0; i < head.length; i++) {
    var h = String(head[i]).trim();
    if (h === 'מזהה') iId = i;
    if (h === 'מסגרת') iW = i;
  }
  if (iId < 0 || iW < 0) return rows;
  var grp = amdaGroupIds_(), out = [head];
  for (var r = 1; r < rows.length; r++) {
    var id = String(rows[r][iId] || '').trim();
    var w = String(rows[r][iW] || '').trim(), w2 = amdaWay_(grp, id, w);
    if (w2 === w) { out.push(rows[r]); continue; }
    var c = rows[r].slice(); c[iW] = w2; out.push(c);
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

/* ============================================================
   משתתפים — הגדרה אחת לכל המונים (8.99.264).
   ============================================================
   "כל תלמיד חדש שהצטרף בפועל, בהרשמה או בדיווח נוכחות תקף,
   מגדיל את מניין המשתתפים באחד. אותו אדם נספר פעם אחת, גם אם
   דווח שוב, נרשם אחר כך או עבר חשבון. ייבוא רשימת בית ספר לבדו
   אינו הצטרפות."

   **מחושב מחדש מהראיות בכל פעם** — לא מונה שגדל:
   * **נרשם** — שורה ב"לומדים" עם מזהה של מכשיר (לא Am…). נשאר
     משתתף גם בלי דף, בלי חידון ובלי נקודות.
   * **דווח בנוכחות** — כל שורה תקפה ב"עמדת לימוד": דף, שיעור,
     "השתתף". שורת Am… ב"לומדים" נספרת רק כל עוד יש לה דיווח —
     דיווח שתוקן לשם אחר או נמחק מוריד אותה, בלי לגעת בשורה.
   * **אותו אדם** — המזהה הקבוע, "מזהים נוספים" (aliasMap_), ושני
     חשבונות באותו טלפון ושם מלא (rafPpl_ — אותו איחוד של ההגרלה
     והנקודות). דיווח בלי שורה ב"לומדים" — למי ששמו תואם נרשם אחד
     בדיוק במוסד (שכבה שאינה סותרת, ובשניים — הכיתה מכריעה).
   * **שני מועמדים ומעלה — לא ממזגים ולא מוסיפים.** הדיווח נספר
     בנפרד כ"לא הוכרע" (`amb`), ומוצג בניהול לבדיקה.
   * **בחוץ:** הורים, משתמשי בדיקה, ומי שרק יובא מרשימת בית ספר.
     החרגות ההגרלה, מסכת ודף — אינן נוגעות כאן.
   מחזיר לכל קוד ישיבה { n, reg, rep, amb, g:{שכבה:n}, w:{מסגרת:n} }:
   n — המשתתפים; reg — מתוכם נרשמו בעצמם; rep — n פחות reg (דווחו
   בנוכחות בלבד). `order` — סדר ההופעה.
   ============================================================ */
function partCalc_(all) {
  var head = (all && all[0]) || [], ix = {};
  for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
  var c = function (r, n) { return ix[n] === undefined ? '' : String(r[ix[n]] || '').trim(); };
  var t = { rows: all && all.length ? all : [head], c: c };
  var alias = aliasMap_(t.rows);

  /* האנשים: שורה לכל מזהה, והאחרונה קובעת את הפרטים. שורה שהמזהה
     שלה כבר נבלע בשורה אחרת — מצטרפת לאותו אדם ולא נספרת שוב. */
  var ppl = {}, order = [];
  for (var r = 1; r < t.rows.length; r++) {
    var row = t.rows[r], id = c(row, 'מזהה');
    if (!id) continue;
    var own = alias[id] && alias[id] !== id ? alias[id] : id;
    var p = ppl[own];
    if (!p) { p = ppl[own] = { id: own, reg: r, ids: [own] }; order.push(own); }
    rowIds_(t, row).forEach(function (x) { if (p.ids.indexOf(x) < 0) p.ids.push(x); });
    if (own !== id && p.code !== undefined) continue;   /* הפרטים — מהשורה של המזהה הקבוע */
    p.code = c(row, 'קוד ישיבה'); p.role = c(row, 'תפקיד'); p.test = c(row, 'בדיקה') === 'כן';
    p.name = c(row, 'שם'); p.last = c(row, 'משפחה'); p.grade = c(row, 'שכבה');
    p.klass = c(row, 'כיתה'); p.way = c(row, 'מסגרת'); p.key = rowKey_(t, row);
  }
  /* שני חשבונות באותו טלפון ושם מלא — היעד הוא האחרון שנרשם. */
  var byKey = {}, target = {};
  order.forEach(function (id) { var q = ppl[id]; if (q.key) (byKey[q.key] = byKey[q.key] || []).push(q); });
  Object.keys(byKey).forEach(function (k) {
    var g = byKey[k];
    if (g.length < 2) return;
    g.sort(function (x, y) { return x.reg - y.reg; });
    var to = g[g.length - 1];
    g.forEach(function (q) {
      if (q === to) return;
      target[q.id] = to.id;
      q.ids.forEach(function (x) { if (to.ids.indexOf(x) < 0) to.ids.push(x); });
    });
  });
  var whoOf = {};
  order.forEach(function (id) {
    if (target[id]) return;
    ppl[id].ids.forEach(function (x) { whoOf[x] = id; });
  });
  var P = {}, porder = [];
  order.forEach(function (id) {
    var q = ppl[id];
    if (target[id] || q.role === 'הורה' || q.test || !q.code) return;
    P[id] = { q: q, reg: q.ids.some(function (x) { return !/^Am/.test(x); }) ? 1 : 0, rep: 0 };
    porder.push(id);
  });

  /* השיוך שהעמדה כבר עשתה: מפתח (מוסד|שכבה|כיתה|שם) → מזהה. */
  var lt = amdaTable_(AMDA_LINK_), keyId = {}, grp = {};
  for (var l = 1; l < lt.rows.length; l++) {
    var lid = lt.c(lt.rows[l], 'מזהה');
    if (!lid) continue;
    grp[lid] = 1;
    keyId[lt.c(lt.rows[l], 'מפתח').split('|').slice(0, 4).join('|')] = lid;
  }
  var byName = {};
  porder.forEach(function (id) {
    var q = P[id].q, f = amdaNorm_(q.name), ln = amdaNorm_(q.last);
    if (!f) return;
    (ln ? [ln + ' ' + f, f + ' ' + ln] : [f]).forEach(function (nm) {
      var k = q.code + '|' + nm;
      if ((byName[k] = byName[k] || []).indexOf(id) < 0) byName[k].push(id);
    });
  });
  var at = amdaTable_(AMDA_TAB_), only = {}, oorder = [], amb = {}, done = {};
  for (var a = 1; a < at.rows.length; a++) {
    var x = at.rows[a], inst = at.c(x, 'קוד ישיבה'), n = amdaNorm_(at.c(x, 'שם'));
    if (!inst || !n) continue;
    var g0 = at.c(x, 'שכבה'), g = amdaNorm_(g0), cl = at.c(x, 'כיתה');
    var k = [inst, g, cl, n].join('|');
    if (done[k]) continue;
    done[k] = 1;
    var hit = whoOf[amdaId_({ inst: inst, g: g, c: cl, n: n })] ||
              whoOf[keyId[k] || ''] || whoOf[keyId[[inst, g0, cl, n].join('|')] || ''] || '';
    if (!hit || !P[hit]) {
      var cand = (byName[inst + '|' + n] || []).filter(function (id) {
        var g2 = amdaNorm_(P[id].q.grade);
        return !g2 || g2 === g;
      });
      /* שניים ומעלה — הכיתה מכריעה. לא הכריעה (גם: אין כיתה) — לא הוכרע. */
      if (cand.length > 1) {
        var byCl = cand.filter(function (id) {
          return String(P[id].q.klass).replace(/\D/g, '') === String(cl).replace(/\D/g, '');
        });
        if (byCl.length !== 1) { amb[k] = inst; continue; }
        cand = byCl;
      }
      if (cand.length === 1) hit = cand[0];
    }
    if (hit && P[hit]) { P[hit].rep = 1; continue; }
    if (hit) continue;                       /* הורה, בדיקה או חשבון שהתאחד — לא תלמיד נוסף */
    only[k] = { code: inst, grade: g0, way: AMDA_WAY_ };
    oorder.push(k);
  }

  var out = { by: {}, order: [] };
  var bump = function (code, grade, way, reg) {
    var b = out.by[code];
    if (!b) { b = out.by[code] = { n: 0, reg: 0, rep: 0, amb: 0, g: {}, w: {}, go: [], wo: [] }; out.order.push(code); }
    b.n++;
    if (reg) b.reg++; else b.rep++;
    if (grade) { if (!(grade in b.g)) { b.g[grade] = 0; b.go.push(grade); } b.g[grade]++; }
    if (way) { if (!(way in b.w)) { b.w[way] = 0; b.wo.push(way); } b.w[way]++; }
  };
  porder.forEach(function (id) {
    var o = P[id], q = o.q;
    /* שורת Am… בלי הרשמה ובלי דיווח שעדיין קיים — הדיווח תוקן או נמחק. */
    if (!o.reg && !o.rep) return;
    bump(q.code, q.grade, amdaWay_(grp, id, q.way), o.reg);
  });
  oorder.forEach(function (k) { bump(only[k].code, only[k].grade, only[k].way, 0); });
  Object.keys(amb).forEach(function (k) {
    var code = amb[k];
    if (!out.by[code]) { out.by[code] = { n: 0, reg: 0, rep: 0, amb: 0, g: {}, w: {}, go: [], wo: [] }; out.order.push(code); }
    out.by[code].amb++;
  });
  return out;
}

/* העמודות של "מונים". הארבע הראשונות — כמו תמיד; השלוש שאחריהן
   מפרקות את "מצטרפים" לניהול (מספרים בלבד). */
var COUNT_COLS_ = ['קוד ישיבה', 'מצטרפים', 'שכבות', 'מסגרות', 'נרשמו', 'דווחו בלבד', 'לא הוכרעו'];

function recount_() {
  try {
    var src = sheet_(JOIN_TAB);
    /* לשונית ריקה אינה "אין מה לעשות" אלא **אפס**. יציאה מוקדמת
       כאן השאירה את המונים הישנים בגיליון לנצח: שבעה תלמידים
       נמחקו, מסך המשתתפים התרוקן, והלוח המשיך להראות שבעה.
       (ומאז 8.99.264 גם "לומדים" ריקה אינה אפס בהכרח — מי שדווח
       בנוכחות נספר גם בלי שורה שם.) */
    if (!src) return;
    recountRows_(src.getLastRow() ? src.getDataRange().getDisplayValues() : [[]]);
  } catch (err) {}          /* מונה שנכשל לא יפיל הרשמה של תלמיד */
}

/* הספירה עצמה, על שורות שכבר נקראו — כדי שההרשמה (joinWrite_)
   לא תקרא את כל הלשונית פעם נוספת רק בשביל המונה. מחזירה את
   החישוב (partCalc_), או null בכישלון — ואז **לא נכתב כלום**:
   קריאה שנכשלה אינה אפס. */
function recountRows_(all) {
  try {
    var P = partCalc_(all);
    /* הפילוח — שכבה ומסגרת, כל משתתף פעם אחת (השורה האחרונה שלו).
       מספרים בלבד: מי שרואה "ח׳ — 11" אינו יודע מי אחד עשר. */
    var pairs = function (m, o) {
      return o.map(function (k) { return k + ':' + m[k]; }).join(' · ');
    };
    writeCount_(COUNT_TAB, COUNT_COLS_, P.order.map(function (code) {
      var b = P.by[code];
      return [code, b.n, pairs(b.g, b.go), pairs(b.w, b.wo), b.reg, b.rep, b.amb];
    }));
    return P;
  } catch (err) { return null; }   /* מונה שנכשל לא יפיל הרשמה של תלמיד */
}

/* דיווח נוכחות — המונים מתעדכנים מיד, אבל לא יותר מפעם ב-30 שניות:
   איש צוות מסמן כיתה שלמה ברצף, וכל סימון הוא בקשה נפרדת. מה
   שנדחה כאן נספר בקריאה הבאה של העמדה (amdaSyncSoon_), ובכל מקרה
   בספירה של כל שעה. */
function partSoon_() {
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get('partRc')) { cache.put('partDue', '1', 21600); return; }
    cache.put('partRc', '1', 30);
    cache.remove('partDue');
  } catch (e) {}
  recount_();
}

/* טבלת הגדרות (כרגע: המלל) — נכתבת מחדש בשלמותה בכל פרסום,
   אחרת נוסח שנמחק היה נשאר בגיליון וממשיך לדרוס את הקוד. */
/* ============================================================
   ההסבה למזהים קבועים — צעד אחד: לשונית אחת, מתחילתה ועד סופה,
   בתוך הרצה אחת של הסקריפט.
   ============================================================
   "אני חושש שההסבה מהכפתור ארוכה מדי ושהסקריפט ייגמר לו הזמן
   באמצע." הגרסה הקודמת גיבתה מהמכשיר: קראה כל לשונית כמלל,
   שלחה אותה חזרה כטבלה, והשוותה — וגוגל ממיר בדרך מלל שנראה
   כמו מספר או תאריך, ולכן הגיבוי לא אומת אף פעם.

   כאן הכול בצד של גוגל, לשונית אחת בכל לחיצה:
   1. הלשונית חייבת להיות בדיוק מה שהמכשיר קרא בבדיקה (`base`).
      השתנתה מאז — לא נוגעים, ומבקשים בדיקה חדשה.
   2. **גיבוי:** העתק מלא של הלשונית (copyTo) בשם "גיבוי מזהים ·
      …", ונבדק תא בתא מול המקור. גיבוי ישן באותו שם שאינו זהה
      למצב הנוכחי — מקבל שם צדדי, לא נמחק.
   3. **כתיבה בפעולה אחת** (setValues על כל השורות): תא שלא
      השתנה נכתב מ-getValues, כלומר בדיוק בסוג שהיה. מותר לשנות
      רק את עמודת הנתונים, ומותר רק להוסיף שורות — לא למחוק.
   4. **אימות** מול התוכנית. לא זהה — מחזירים את מה שהיה, באותה
      הרצה, ובודקים שחזר. כך כשל אינו משאיר לשונית חצי מוסבת.
   התוצאה נשמרת ב-SID_STEP, והמכשיר קורא אותה ב-GET (?sidStep).
   ============================================================ */
var SID_TABS_ = { 'סימוני הדף': 3, 'פירוש': 2, 'שאלות בדף': 2, 'מצגת': 2 };
var SID_BAK_ = 'גיבוי מזהים · ';
function sidStepRun_(d) {
  var out;
  try { out = sidStep_(d); }
  catch (err) { out = { status: 'error', message: String(err) }; }
  out.rid = String(d.rid || ''); out.tab = String(d.tab || ''); out.mode = String(d.mode || 'write');
  out.t = new Date().toISOString();
  try { PropertiesService.getScriptProperties().setProperty('SID_STEP', JSON.stringify(out)); } catch (pe) {}
  return out;
}
function sidStr_(rows, w) {
  return (rows || []).map(function (r) {
    var o = [];
    for (var j = 0; j < w; j++) o.push(String(r && r[j] != null ? r[j] : ''));
    return o;
  });
}
function sidSame_(a, b, w) {
  if (a.length !== b.length) return false;
  return JSON.stringify(sidStr_(a, w)) === JSON.stringify(sidStr_(b, w));
}
function sidDiff_(a, b, w) {
  var A = sidStr_(a, w), B = sidStr_(b, w), n = Math.max(A.length, B.length);
  for (var i = 0; i < n; i++) {
    if (!A[i] || !B[i]) return 'שורה ' + (i + 1) + ' חסרה';
    for (var j = 0; j < w; j++) if (A[i][j] !== B[i][j]) {
      return 'שורה ' + (i + 1) + ', עמודה ' + (j + 1) + ': ' + A[i][j].length + ' תווים מול ' + B[i][j].length;
    }
  }
  return '';
}
/* אילו גיבויים נלקחו ואומתו בצד של גוגל */
function sidBakOk_(tab, set) {
  var P = PropertiesService.getScriptProperties(), m = {};
  try { m = JSON.parse(P.getProperty('SID_BAK_OK') || '{}') || {}; } catch (e) { m = {}; }
  if (!set) return !!m[tab];
  m[tab] = sidStamp_();
  P.setProperty('SID_BAK_OK', JSON.stringify(m));
  return true;
}
function sidShow_(sh) {
  return sh && sh.getLastRow() ? sh.getDataRange().getDisplayValues() : [];
}
function sidStamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
}
function sidStep_(d) {
  var tab = String(d.tab || '');
  if (!SID_TABS_.hasOwnProperty(tab)) return { status: 'error', message: 'לשונית לא מוכרת' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab), bakName = SID_BAK_ + tab, bak = ss.getSheetByName(bakName);
  if (String(d.mode || '') === 'restore') return sidRestore_(ss, sh, bak, tab);

  var base = parse_(d.base) || [], plan = parse_(d.plan) || [], head = parse_(d.head) || [];
  if (!sh) {
    if (base.length) return { status: 'changed', message: 'הלשונית חסרה' };
    sh = ss.insertSheet(tab);
    headRow_(sh, head);
    base = [head];
  }
  var cur = sidShow_(sh), W = Math.max(sh.getLastColumn(), head.length, 1);
  if (!sidSame_(cur, base, W)) {
    /* כבר הוסבה (לחיצה קודמת שהסתיימה בלי שהמכשיר שמע)? */
    if (sidSame_(cur, [cur[0] || head].concat(plan), W) && bak) {
      return { status: 'ok', already: true, cells: 0, added: 0, backup: bakName };
    }
    return { status: 'changed', message: 'הלשונית השתנתה מאז הבדיקה' };
  }
  var data = cur.length - 1;
  if (plan.length < data) return { status: 'error', message: 'התוכנית מוחקת שורות — לא נכתב דבר' };

  /* --- 2 · גיבוי --- */
  var bakNote = '';
  if (bak && !sidSame_(sidShow_(bak), cur, W)) {
    bak.setName(bakName + ' · קודם ' + sidStamp_());
    bakNote = bak.getName();
    bak = null;
  }
  if (!bak) {
    bak = sh.copyTo(ss).setName(bakName);
    SpreadsheetApp.flush();
  }
  var bakCheck = sidDiff_(sidShow_(bak), cur, W);
  if (bakCheck) return { status: 'backup', message: 'הגיבוי לא זהה למקור (' + bakCheck + ') — לא נכתב דבר', backup: bakName };
  sidBakOk_(tab, true);

  /* --- 3 · כתיבה --- */
  var col = SID_TABS_[tab], cells = 0, n = plan.length;
  if (!n) return { status: 'ok', cells: 0, added: 0, backup: bakName, aside: bakNote };
  var rng = sh.getRange(2, 1, n, W);
  var old = data ? sh.getRange(2, 1, data, W).getValues() : [];
  var fx = data ? sh.getRange(2, 1, data, W).getFormulas() : [];
  var next = [], blank = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < W; j++) {
      var want = String(plan[i][j] != null ? plan[i][j] : '');
      if (i < data) {
        var had = cur[i + 1][j] != null ? String(cur[i + 1][j]) : '';
        if (want === had) { row.push(old[i][j]); continue; }
        if (j !== col) return { status: 'error', message: 'שינוי מחוץ לעמודת הנתונים (שורה ' + (i + 2) + ') — לא נכתב דבר' };
        if (fx[i][j]) return { status: 'error', message: 'נוסחה בשורה ' + (i + 2) + ' — לא נכתב דבר' };
        if (want.length > 50000) return { status: 'error', message: 'תא ארוך מדי בשורה ' + (i + 2) + ' — לא נכתב דבר' };
        cells++;
      }
      row.push(want);
    }
    next.push(row);
  }
  for (var b = 0; b < n; b++) {
    blank.push(b < data ? old[b] : (function () { var z = []; for (var q = 0; q < W; q++) z.push(''); return z; })());
  }
  if (!cells && n === data) return { status: 'ok', cells: 0, added: 0, backup: bakName, aside: bakNote };
  rng.setValues(next);
  SpreadsheetApp.flush();

  /* --- 4 · אימות, ואם לא — חזרה למה שהיה --- */
  var miss = sidDiff_(sidShow_(sh).slice(1), plan, W);
  if (!miss) return { status: 'ok', cells: cells, added: n - data, backup: bakName, aside: bakNote };
  rng.setValues(blank);
  SpreadsheetApp.flush();
  var back = sidDiff_(sidShow_(sh), cur, W);
  return { status: 'rolledback', message: 'הכתיבה לא אומתה (' + miss + ')',
           back: back ? 'לא חזרה במלואה: ' + back : 'הוחזרה ואומתה', backup: bakName };
}
/* שחזור לשונית אחת מהגיבוי שלה. מה שיש בה עכשיו נשמר קודם בשם
   צדדי — גם השחזור הפיך. */
function sidRestore_(ss, sh, bak, tab) {
  /* רק גיבוי שנלקח ואומת כאן. "גיבוי מזהים · …" מהגרסה הקודמת
     (מהמכשיר, שלא אומת) אינו משמש לשחזור. */
  if (!bak || !sidBakOk_(tab)) return { status: 'nobak', message: 'אין גיבוי מאומת ל"' + tab + '"' };
  var want = sidShow_(bak);
  if (!sh) sh = ss.insertSheet(tab);
  var aside = '';
  if (sh.getLastRow()) {
    aside = tab + ' · לפני שחזור ' + sidStamp_();
    sh.copyTo(ss).setName(aside);
  }
  var W = Math.max(sh.getLastColumn(), bak.getLastColumn(), 1);
  if (sh.getLastRow()) sh.getRange(1, 1, sh.getLastRow(), W).clearContent();
  if (bak.getLastRow()) bak.getRange(1, 1, bak.getLastRow(), W).copyTo(sh.getRange(1, 1));
  SpreadsheetApp.flush();
  var miss = sidDiff_(sidShow_(sh), want, W);
  return miss ? { status: 'error', message: 'השחזור לא אומת (' + miss + '). מה שהיה לפניו: "' + aside + '"', aside: aside }
              : { status: 'ok', restored: true, aside: aside };
}

/* ============================================================
   עוגני המצגת — כתיבה של דף אחד, לא של הלשונית כולה.
   ============================================================
   עד עכשיו כל שמירת עוגן בדף האינטראקטיבי כתבה את כל הלשונית
   "מצגת" ממה שהדף זכר מרגע שנפתח. דף שנשאר פתוח מהבוקר דרס כך
   עוגן שנשמר בצהריים ממכשיר אחר — גם בדפים אחרים לגמרי.
   כאן משתנה רק התא של הדף המבוקש. `base` (לא חובה): לכתוב רק אם
   התא עדיין בדיוק כך — לתיקון חד-פעמי שאסור לו לדרוס עבודה. */
var DECK_TAB_ = 'מצגת';
function deckSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DECK_TAB_);
  if (!sh) { sh = ss.insertSheet(DECK_TAB_); headRow_(sh, ['מסכת', 'דף', 'עוגנים']); }
  return sh;
}
function deckDafKey_(v) { return String(v == null ? '' : v).replace(/["'׳״\s]/g, ''); }
function deckRow_(d) {
  var mas = String(d.mas || '').trim(), dk = deckDafKey_(d.daf);
  var val = String(d.val == null ? '' : d.val);
  if (!mas || !dk) return { status: 'error', message: 'חסרים מסכת או דף' };
  var sh = deckSheet_(), last = sh.getLastRow();
  var rows = last ? sh.getRange(1, 1, last, 3).getDisplayValues() : [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== mas || deckDafKey_(rows[i][1]) !== dk) continue;
    if (d.base != null && rows[i][2] !== String(d.base)) return { status: 'changed', row: i + 1 };
    if (rows[i][2] !== val) sh.getRange(i + 1, 3).setValue(val);
    return { status: 'ok', row: i + 1 };
  }
  if (d.base != null && String(d.base) !== '') return { status: 'changed' };
  if (val) sh.getRange(Math.max(last, 1) + 1, 1, 1, 3).setValues([[mas, String(d.daf), val]]);
  return { status: 'ok', added: !!val };
}
/* שקף שנמחק (או שאינו עוד באף מצגת) — העוגנים אליו יוצאים מכל
   הדפים. רק ערך שהוא בדיוק אחד מהנתיבים; עוגן לפי מספר לא נוגע. */
function deckDrop_(d) {
  var want = {}, out = [];
  (parse_(d.paths) || []).forEach(function (p) { if (p) want[String(p)] = 1; });
  var sh = deckSheet_(), last = sh.getLastRow();
  var rows = last ? sh.getRange(1, 1, last, 3).getDisplayValues() : [];
  for (var i = 1; i < rows.length; i++) {
    var o;
    try { o = JSON.parse(rows[i][2]); } catch (e) { continue; }
    if (!o || typeof o !== 'object') continue;
    var ch = false;
    for (var k in o) {
      if (!o.hasOwnProperty(k) || k.indexOf('__') === 0) continue;
      if (typeof o[k] === 'string' && want[o[k]]) {
        out.push({ mas: rows[i][0], daf: rows[i][1], key: k, val: o[k] });
        delete o[k]; ch = true;
      }
    }
    if (ch) sh.getRange(i + 1, 3).setValue(JSON.stringify(o));
  }
  return { status: 'ok', removed: out };
}

/* ============================================================
   העלון השבועי — מה שהרכז בחר לעלון, שורה לדף.
   ============================================================
   לשונית נפרדת מהתוכן: מסכת · דף · עלון (JSON). הבחירה מפנה לחידה,
   לחלק פירוש ולשקף לפי מזהה — ואינה משנה אף אחד מהם. אותה כתיבה
   של תא אחד כמו deckRow_, בלי לגעת בשאר הדפים. ריק = אין בחירה. */
var ALON_TAB_ = 'עלון';
function alonRow_(d) {
  var mas = String(d.mas || '').trim(), dk = deckDafKey_(d.daf);
  var val = String(d.val == null ? '' : d.val);
  if (!mas || !dk) return { status: 'error', message: 'חסרים מסכת או דף' };
  if (val) { try { JSON.parse(val); } catch (e) { return { status: 'error', message: 'נתונים פגומים' }; } }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ALON_TAB_);
  if (!sh) { sh = ss.insertSheet(ALON_TAB_); headRow_(sh, ['מסכת', 'דף', 'עלון']); }
  var last = sh.getLastRow();
  var rows = last ? sh.getRange(1, 1, last, 3).getDisplayValues() : [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== mas || deckDafKey_(rows[i][1]) !== dk) continue;
    if (rows[i][2] !== val) sh.getRange(i + 1, 3).setValue(val);
    return { status: 'ok', row: i + 1 };
  }
  if (val) sh.getRange(Math.max(last, 1) + 1, 1, 1, 3).setValues([[mas, String(d.daf), val]]);
  return { status: 'ok', added: !!val };
}

/* ============================================================
   ארכיון העלון — גרסאות מאושרות, שורה לכל אישור.
   ============================================================
   "עבודת העלון המאושרת תהיה מגובה בצד השרת, ותשרוד איבוד מכשיר."

   "עלון" למעלה הוא הטיוטה של הדף — מתעדכנת בכל הקשה. כאן נשמר רק
   מה שאושר: הבחירה, ההערות, החלטות העריכה, גרסת התבנית ותאריך
   האישור — וקישור ל-PDF שהועלה ל-Drive.

   **הוספה בלבד.** אישור חדש הוא שורה חדשה עם מספר הגרסה הבא, ושורה
   קיימת אינה נדרסת לעולם. אותו מזהה (`id`) שנשלח שוב — שליחה חוזרת
   של no-cors — אינו פותח גרסה שנייה. ה-PDF נכתב פעם אחת לשורה;
   PDF אחר = אישור חדש.

   הנעילה של doPost כבר מוחזקת כאן, ולכן מספר הגרסה אינו מתנגש. */
var ALON_ARCH_TAB_ = 'ארכיון עלון';
var ALON_ARCH_HEAD_ = ['מסכת', 'דף', 'גרסה', 'אושר', 'עלון', 'PDF', 'מזהה', 'מצב PDF'];
var ALON_DIR_KEY_ = 'ALON_DIR';
function alonArchSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ALON_ARCH_TAB_);
  if (!sh) {
    sh = ss.insertSheet(ALON_ARCH_TAB_);
    headRow_(sh, ALON_ARCH_HEAD_);
    /* הכול טקסט — gviz מנחש טיפוס לעמודה, ותאריך שהפך לתאריך
       היה חוזר ריק או בצורה אחרת. */
    sh.getRange(1, 1, sh.getMaxRows(), ALON_ARCH_HEAD_.length).setNumberFormat('@');
  }
  return sh;
}
function alonArchId_(v) { return String(v || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 40); }
function alonArchFind_(sh, mas, dk, id) {
  var last = sh.getLastRow();
  var rows = last > 1 ? sh.getRange(1, 1, last, ALON_ARCH_HEAD_.length).getDisplayValues() : [];
  var out = { row: 0, ver: 0, vals: null };
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== mas || deckDafKey_(rows[i][1]) !== dk) continue;
    out.ver = Math.max(out.ver, +rows[i][2] || 0);
    if (id && rows[i][6] === id) { out.row = i + 1; out.vals = rows[i]; }
  }
  return out;
}
function alonArch_(d) {
  var mas = String(d.mas || '').trim(), dk = deckDafKey_(d.daf);
  var val = String(d.val == null ? '' : d.val), o = null;
  if (!mas || !dk || !val) return { status: 'error', message: 'חסרים מסכת, דף או תוכן' };
  try { o = JSON.parse(val); } catch (e) { return { status: 'error', message: 'נתונים פגומים' }; }
  var id = alonArchId_(o && o.id);
  if (!id) return { status: 'error', message: 'חסר מזהה גרסה' };
  /* תא בגיליון מחזיק עד 50,000 תווים */
  if (val.length > 49000) return { status: 'error', message: 'הארכיון גדול מתא אחד בגיליון' };
  var sh = alonArchSheet_();
  var f = alonArchFind_(sh, mas, dk, id);
  if (f.row) return { status: 'ok', ver: +f.vals[2], dup: true };
  var ver = f.ver + 1;
  var at = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm');
  var r = Math.max(sh.getLastRow(), 1) + 1;
  var rg = sh.getRange(r, 1, 1, ALON_ARCH_HEAD_.length);
  rg.setNumberFormat('@');
  rg.setValues([[mas, String(d.daf), String(ver), at, val, '', id, '']]);
  return { status: 'ok', ver: ver, row: r };
}
/* התיקייה ב-Drive. נוצרת בפעם הראשונה, והמזהה שלה נשמר. */
function alonDir_() {
  var P = PropertiesService.getScriptProperties(), fid = P.getProperty(ALON_DIR_KEY_);
  if (fid) { try { return DriveApp.getFolderById(fid); } catch (e) {} }
  var dir = DriveApp.createFolder('הדף השבועי — ארכיון עלון');
  P.setProperty(ALON_DIR_KEY_, dir.getId());
  return dir;
}
/* **הרשאה.** הפריסה מבקשת היום `drive.readonly` בלבד
   (.github/workflows/apps-script.yml), ולכן יצירת קובץ נכשלת —
   והסיבה נכתבת ל"מצב PDF" ומוצגת באפליקציה. להפעלה: להחליף שם
   ל-`auth/drive`, ומיד אחרי הפריסה להריץ את הפונקציה הזו בעורך
   ולאשר את מסך ההרשאה של גוגל. הרשאה חדשה שלא אושרה עוצרת את כל
   הסקריפט — לכן שני הצעדים ברצף אחד. */
function alonDriveAuth() {
  var dir = alonDir_();
  Logger.log('תיקיית ארכיון העלון: ' + dir.getUrl());
  return dir.getUrl();
}
/* ה-PDF של גרסה מאושרת → Drive, והקישור לשורה שלה. התשובה של
   no-cors אטומה, ולכן גם הכישלון נכתב לשורה ("מצב PDF") — שם
   האפליקציה קוראת אותו ומציגה את הסיבה. */
function alonPdf_(d) {
  var mas = String(d.mas || '').trim(), dk = deckDafKey_(d.daf), id = alonArchId_(d.id);
  if (!mas || !dk || !id) return { status: 'error', message: 'חסרים מסכת, דף או מזהה גרסה' };
  var sh = alonArchSheet_();
  var f = alonArchFind_(sh, mas, dk, id);
  if (!f.row) return { status: 'error', message: 'הגרסה לא נמצאה בארכיון' };
  if (f.vals[5]) return { status: 'ok', url: f.vals[5], exists: true };
  var mark = function (t) { sh.getRange(f.row, 8).setNumberFormat('@').setValue(t); };
  var data = String(d.data || '');
  if (!/^JVBER/.test(data)) { mark('שגיאה: הקובץ אינו PDF'); return { status: 'error', message: 'הקובץ אינו PDF' }; }
  try {
    var name = 'עלון ' + mas + ' דף ' + String(d.daf) + ' — גרסה ' + f.vals[2] + '.pdf';
    var blob = Utilities.newBlob(Utilities.base64Decode(data), 'application/pdf', name);
    var file = alonDir_().createFile(blob);
    sh.getRange(f.row, 6).setNumberFormat('@').setValue(file.getUrl());
    mark('נשמר ' + Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm'));
    return { status: 'ok', url: file.getUrl() };
  } catch (err) {
    mark('שגיאה: ' + String(err && err.message || err).slice(0, 300));
    return { status: 'error', message: String(err) };
  }
}

/* ============================================================
   הסטודיו — כתיבה של עמוד אחד, עם בדיקת בסיס.
   ============================================================
   "כל שינוי יישמר בלי שאצטרך לחשוב על שלושה עותקים."

   עד עכשיו השמירה מהסטודיו קראה את כל "סימוני הדף" וכתבה אותה
   מחדש מהזיכרון. כאן משתנה רק התא של העמוד, ורק אם מה שבגיליון
   הוא בדיוק הגרסה שהעריכה במכשיר יצאה ממנה (`base`). זמן במכשיר
   אינו ראיה מי חדש יותר — מזהה הגרסה הוא.

   מזהה גרסה = `rv` שבתוך הרשומה + `t`. שורה ישנה בלי `rv` — לפי
   `t` בלבד. הדף האינטראקטיבי משנה את `t` כשהוא מאחד קטעים, ולכן
   גם שינוי משם נחשב גרסה אחרת.

   גרסה אחרת בגיליון → לא כותבים. מה שנשלח נשמר בצד, ב"טיוטות
   סטודיו" עם סיבה "התנגשות" — שתי העבודות קיימות, ואיש אינו
   דורס. אותה גרסה בדיוק כבר בגיליון (ניסיון חוזר) → "ok" בלי
   כתיבה נוספת. התשובה אטומה ללקוח (no-cors); הוא קורא את התא
   חזרה ומשווה את מזהה הגרסה.
   ============================================================ */
var MARK_TAB_ = 'סימוני הדף';
var DRAFT_TAB_ = 'טיוטות סטודיו';
var ASIDE_TAB_ = 'גרסאות בצד';

/* ============================================================
   מלאי הגרסאות של עמוד — לפני שמחליפים.
   ============================================================
   "התאוששות חייבת לעצור כשלא נקראו כל הגרסאות."

   gviz אינה יודעת לומר "אין לשונית כזו" — היא מגישה את הראשונה —
   וקריאה שנכשלה נראתה בסטודיו כמו "אין טיוטות". כאן הקריאה ישירה:
   לכל לשונית `exists` (נוצרה או לא), והשורות של העמוד **כפי שהן
   בתא** — גם שורה שאינה JSON תקין. כותרת שאין בה "מפתח"/"נתונים" —
   `bad`, ואז הסטודיו עוצר. רק קריאה. */
function studioInv_(k) {
  var a = String(k).split('|');
  if (a.length < 4 || !a[0] || !a[1]) return { status: 'error', version: SCRIPT_VERSION, message: 'מפתח עמוד לא תקין' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = { status: 'ok', version: SCRIPT_VERSION, k: k };
  var mk = ss.getSheetByName(MARK_TAB_), pg = a.slice(2).join('|');
  out.mark = { exists: !!mk, found: false, raw: '' };
  if (mk && mk.getLastRow() > 1) {
    var mv = mk.getRange(2, 1, mk.getLastRow() - 1, 4).getDisplayValues();
    for (var i = 0; i < mv.length; i++) {
      if (String(mv[i][0]).trim() === a[0] && String(mv[i][1]).trim() === a[1] &&
          String(mv[i][2]).trim() === pg) { out.mark.found = true; out.mark.raw = mv[i][3]; break; }
    }
  }
  var rowsOf = function (name, extra) {
    var sh = ss.getSheetByName(name);
    if (!sh) return { exists: false, rows: [] };
    var v = sh.getLastRow() ? sh.getDataRange().getDisplayValues() : [];
    if (!v.length) return { exists: true, rows: [] };
    var h = v[0].map(function (x) { return String(x).trim(); });
    var iK = h.indexOf('מפתח'), iD = h.indexOf('נתונים');
    if (iK < 0 || iD < 0) return { exists: true, bad: 'header', rows: [] };
    var idx = {};
    extra.forEach(function (c) { idx[c] = h.indexOf(c); });
    var rows = [];
    for (var r = 1; r < v.length; r++) {
      if (String(v[r][iK]).trim() !== k) continue;
      var o = { raw: v[r][iD], row: r + 1 };
      extra.forEach(function (c) { o[c] = idx[c] >= 0 ? String(v[r][idx[c]]) : ''; });
      rows.push(o);
    }
    return { exists: true, rows: rows };
  };
  out.drafts = rowsOf(DRAFT_TAB_, ['מכשיר', 'סיבה', 'תאריך']);
  out.aside = rowsOf(ASIDE_TAB_, ['מקור', 'מזהה', 'מועד']);
  return out;
}
function markRv_(s) {
  if (!s) return '';
  var o = null;
  try { o = JSON.parse(s); } catch (e) {}
  if (!o || typeof o !== 'object') return 'x:' + String(s).length;
  return String(o.rv || '') + ':' + (o.t || 0);
}
function markPut_(d) {
  var mas = String(d.mas || '').trim(), daf = String(d.daf || '').trim(),
      pg = String(d.pg || '').trim(), val = String(d.val || ''),
      base = String(d.base == null ? '' : d.base);
  if (!mas || !daf || !pg) return { status: 'error', message: 'חסר מפתח עמוד' };
  if (!d.del) {
    try { if (!JSON.parse(val)) throw 0; }
    catch (e) { return { status: 'error', message: 'נתונים פגומים' }; }
  }
  var mine = d.del ? '' : markRv_(val);
  var sh = sheet_(MARK_TAB_);
  if (!sh.getLastRow()) headRow_(sh, ['מסכת', 'דף', 'עמוד', 'נתונים']);
  var last = sh.getLastRow();
  var rows = last > 1 ? sh.getRange(2, 1, last - 1, 4).getDisplayValues() : [];
  var at = -1, cur = '';
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === mas && String(rows[i][1]).trim() === daf &&
        String(rows[i][2]).trim() === pg) { at = i; cur = markRv_(rows[i][3]); break; }
  }
  if (cur === mine) return { status: 'ok', same: 1 };
  if (cur !== base) {
    if (!d.del) {
      appendCols_(DRAFT_TAB_, [['מפתח', [mas, daf, pg].join('|')],
        ['עמוד', String(d.label || '')], ['מכשיר', String(d.dev || '')],
        ['נתונים', val], ['סיבה', 'התנגשות · בגיליון ' + cur + ' · בסיס ' + base]]);
    }
    return { status: 'conflict', cur: cur };
  }
  if (d.del) {
    if (at >= 0) sh.deleteRow(at + 2);
    return { status: 'ok', deleted: at >= 0 };
  }
  if (at >= 0) sh.getRange(at + 2, 4).setValue(val);
  else sh.getRange(last + 1, 1, 1, 4).setValues([[mas, daf, pg, val]]);
  return { status: 'ok' };
}

function writeTable_(tab, cols, rows, ssId) {
  var sh = sheet_(tab, ssId);
  if (!sh.getLastRow()) headRow_(sh, cols);
  /* עמודה שנוספה לכתיבה (למשל "שער" במצגות) — הכותרת שלה נוספת
     ללשונית קיימת, בלי לגעת בכותרות שכבר שם. */
  else if (sh.getLastColumn() < cols.length) {
    var hc = sh.getLastColumn();
    sh.getRange(1, hc + 1, 1, cols.length - hc).setValues([cols.slice(hc)])
      .setFontWeight('bold').setBackground('#17468F').setFontColor('#FFFFFF');
  }
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
  if (CALL_TABS_.indexOf(tab) >= 0 && CONTACTS_ID) return CONTACTS_ID;
  if (!PRIVATE_ID) throw new Error('חסר PRIVATE_ID — הלשונית "' + tab +
    '" פרטית, ולא תיכתב לגיליון הציבורי. יש להגדיר את מזהה הגיליון הפרטי במאפייני הסקריפט.');
  return PRIVATE_ID;
}

/* ============================================================
   מה שנשאר בגיליון הראשי ושייך לפרטי — עובר לשם, פעם אחת.
   ============================================================
   הראשי פתוח לצפייה, והמזהה שלו יושב בקוד הציבורי. נמצאו בו:
   אנשי הקשר בישיבות עם הטלפונים, יומן השיחות, תצוגת הצוות —
   וגם עותקים ישנים של "הרשמות", "תלמידי בית הספר" ו"עמדת לימוד"
   מלפני שהן עברו לפרטי.

   כל לשונית מ-PRIVATE_TABS שנמצאת בראשי מועתקת ליעד שלה
   (privId_), ורק אחרי שההעתק נקרא חזרה ונמצא זהה תא בתא — היא
   נמחקת מהראשי. לשונית מוקד שאין לה עדיין נתונים ביעד נכנסת
   בשמה, כדי שהמוקד ימשיך לעבוד מאותו רגע. כל השאר — בשם צדדי
   ("· מהגיליון הציבורי"), כי ביעד כבר יש לשונית חיה בשם הזה,
   ואסור לערבב לתוכה שורות במבנה ישן.

   מועתק כמו שהוא מוצג (getDisplayValues) ובתבנית טקסט: אחרת
   גוגל הופך טלפון למספר ומוחק את האפס שבראשו, ו-TRUE לבוליאני.
   כישלון בלשונית אחת — היא נשארת במקומה, והניסיון חוזר בקריאה
   הבאה. הדגל נקבע רק כשהכל עבר. */
var PUB_MOVE_KEY = 'publicMovedV1';
function moveOutOfPublic_() {
  var P = PropertiesService.getScriptProperties();
  if (P.getProperty(PUB_MOVE_KEY)) return;
  /* חסר יעד, למשל — לא לנסות בכל בקשה לנצח. "בדיקת חיבור" מראה
     את PUB_MOVE_LOG. */
  var tries = +(P.getProperty('PUB_MOVE_TRY') || 0);
  if (tries >= 5) return;
  var pub = SpreadsheetApp.getActiveSpreadsheet();
  if (!pub) return;
  var log = [], bad = 0;
  PRIVATE_TABS.forEach(function (tab) {
    var src = pub.getSheetByName(tab);
    if (!src) return;
    try {
      var id = privId_(tab);
      if (!id || String(id) === pub.getId()) { bad++; log.push(tab + ': אין יעד'); return; }
      var dst = SS_OPEN_[id] || (SS_OPEN_[id] = SpreadsheetApp.openById(String(id)));
      var vals = src.getLastRow() ? src.getDataRange().getDisplayValues() : [];
      if (vals.length) {
        var live = dst.getSheetByName(tab);
        var name = tab;
        if (CALL_TABS_.indexOf(tab) < 0 || (live && live.getLastRow() > 1)) {
          name = tab + ' · מהגיליון הציבורי';
          for (var k = 2; dst.getSheetByName(name); k++) name = tab + ' · מהגיליון הציבורי ' + k;
        }
        var sh = dst.getSheetByName(name) || dst.insertSheet(name);
        if (sh.getLastRow()) sh.clear();
        var rg = sh.getRange(1, 1, vals.length, vals[0].length);
        rg.setNumberFormat('@');
        rg.setValues(vals);
        SpreadsheetApp.flush();
        var back = rg.getDisplayValues();
        for (var r = 0; r < vals.length; r++) {
          for (var c = 0; c < vals[r].length; c++) {
            if (String(back[r][c]) !== String(vals[r][c])) {
              throw new Error('ההעתק אינו זהה בשורה ' + (r + 1));
            }
          }
        }
        log.push(tab + ' → ' + name + ' (' + vals.length + ')');
      } else {
        log.push(tab + ': ריקה');
      }
      pub.deleteSheet(src);
    } catch (err) {
      bad++;
      log.push(tab + ': ' + (err && err.message || err));
    }
  });
  P.setProperty('PUB_MOVE_LOG', new Date().toISOString() + ' · ' + log.join(' · '));
  if (!bad) P.setProperty(PUB_MOVE_KEY, new Date().toISOString());
  else P.setProperty('PUB_MOVE_TRY', String(tries + 1));
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
  try { wholeB_(); } catch (e) {}
  /* תלמיד שנרשם לאפליקציה אחרי שלמד בעמדה — משויך כאן. */
  try { amdaSyncLocked_(); } catch (ae) {}
  recount_(); recountLearn_(true); backupDaily_();
  try { ovSync_(true); } catch (oe) {}
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

/* ============================================================
   מי שלמד את דף ב כולו בהרצה — סיים גם את ב:.
   ============================================================
   בשבועות ההרצה דף ב היה יחידה אחת, ומי שסיים אותו נרשם
   בשבוע 1 עם הדף 'ב' (בלי עמוד). אחרי הפיצול השורה הזו נשארה
   בשבוע 1 (ראו `taanitWk_`), ולכן הפס "סיימו את דף ב:" לא ספר
   אותו — למרות שלמד את עמוד ב.

   לכל מזהה כזה שאין לו עדיין סיום בשבוע 2 — נוספת שורת סיום
   של ב: בשבוע 2, עם המקור. שורה אמיתית ולא חישוב בצד: כך היא
   נספרת גם בספירה התוספתית, בלוח הצוות ובפילוח ההתראות.
   רץ כל שעה (שורה ישנה ממכשיר שהתעדכן באיחור), ואינו מוסיף
   פעמיים: אחרי ההוספה כבר יש למזהה שורה בשבוע 2. */
var WHOLE_B_KEY = 'wholeBDone';
function wholeB_() {
  var sh = sheet_(LEARN_TAB);
  if (!sh || sh.getLastRow() < 2) return 0;
  var rows = doneRows_(sh.getDataRange().getDisplayValues());
  if (!rows || rows.length < 2) return 0;
  var ix = {};
  for (var h = 0; h < rows[0].length; h++) ix[String(rows[0][h]).trim()] = h;
  if (ix['מזהה'] === undefined || ix['מסלול'] === undefined || ix['שבוע'] === undefined) return 0;
  var c = function (r, k) { return ix[k] === undefined ? '' : String(r[ix[k]] || '').trim(); };
  var canon = function (tr) {
    if (SHIFT_TAANIT.names.indexOf(tr) >= 0) return 'taanit';
    if (SHIFT_MEGILA.names.indexOf(tr) >= 0) return 'megila';
    return '';
  };
  var has = {}, want = [], seen = {};
  for (var r = 1; r < rows.length; r++) {
    var id = c(rows[r], 'מזהה'), tr = canon(c(rows[r], 'מסלול'));
    if (!id || !tr) continue;
    var wk = parseInt(c(rows[r], 'שבוע'), 10);
    if (wk === 2) { has[id + '|' + tr] = 1; continue; }
    if (wk !== 1) continue;
    if (c(rows[r], 'דף').replace(/["'׳״\s]/g, '') !== 'ב') continue;   /* ב. — עמוד א בלבד */
    var k = id + '|' + tr;
    if (seen[k]) continue;
    seen[k] = 1;
    want.push({ k: k, id: id, tr: c(rows[r], 'מסלול'), inst: c(rows[r], 'קוד ישיבה') });
  }
  want = want.filter(function (w) { return !has[w.k]; });
  if (!want.length) return 0;

  var head = headers_(sh), now = new Date(), out = [];
  var cols = ['תאריך', 'מזהה', 'קוד ישיבה', 'מסלול', 'שבוע', 'דף', 'קטע', 'מתוך', 'בדיקה', 'מקור'];
  var at = cols.map(function (n) { return idx_(sh, head, n); });
  want.forEach(function (w) {
    var row = [];
    var v = [now, w.id, w.inst, w.tr, 2, 'ב:', '', '', '', 'דף ב שלם בהרצה'];
    for (var i = 0; i < cols.length; i++) put_(row, at[i], cell_(v[i]));
    while (row.length < head.length) row.push('');
    out.push(row);
  });
  var first = sh.getLastRow() + 1;
  sh.getRange(first, 1, out.length, head.length).setValues(out);
  markBump_(2, first);
  return out.length;
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
  clockFire_('CLOCK_LAST');
}

/* ============================================================
   ההצתה עצמה — ורישום של מה שקרה.
   ============================================================
   "מה שחשוב לי לדעת זה שהשעון בפועל עובד."

   "מותקן" אומר רק שהטריגר קיים. עכשיו כל הצתה נרשמת: מתי,
   ומה GitHub ענה (204 = קיבל). כך מסך הניהול מראה "הפעלה
   אחרונה לפני 4 דקות", ושעון שנתקע נראה מיד.

   `CLOCK_LAST` — ההצתות של הטריגר. `CLOCK_TEST` — "שליחת
   בדיקה" ממסך התזכורות, בנפרד, כדי שבדיקה לא תסתיר שעון
   שהפסיק לרוץ. */
function clockFire_(slot) {
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  var rec = { at: new Date().toISOString(), code: 0, err: '' };
  if (!tok || !repo) {
    rec.err = 'חסרים GH_TOKEN או GH_REPO';
  } else {
    try {
      var r = UrlFetchApp.fetch(GH_API + repo + '/dispatches', {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + tok,
                   Accept: 'application/vnd.github+json',
                   'X-GitHub-Api-Version': '2022-11-28' },
        payload: JSON.stringify({ event_type: 'push-clock', client_payload: {} }),
        muteHttpExceptions: true
      });
      rec.code = r.getResponseCode();
    } catch (e) { rec.err = String(e).slice(0, 200); }
  }
  try {
    PropertiesService.getScriptProperties().setProperty(slot, JSON.stringify(rec));
  } catch (e2) {}
  return rec;
}
function clockLast_() {
  try { return JSON.parse(prop_('CLOCK_LAST', '') || 'null'); } catch (e) { return null; }
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
    if (tab === JOIN_TAB || tab === AMDA_TAB_) recount_();
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
  /* מקום בכיתה ("2-1-1") — אחרת הגיליון הופך אותו לתאריך. */
  if (typeof v === 'string' && /^\d{1,2}-\d{1,2}-\d{1,2}$/.test(v)) return "'" + v;
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
  /* כמה מוסדות לפי קוד — העורך. לפיד ו"אחר" אינם נבחרים כאן בטעות:
     הם נכנסים רק כשנבחרו במפורש. */
  if (f.insts && f.insts.length) {
    out.insts = [];
    for (var j = 0; j < f.insts.length && j < 60; j++) {
      var cd = String(f.insts[j] || '');
      if (/^[a-z]{2,20}$/.test(cd) && out.insts.indexOf(cd) < 0) out.insts.push(cd);
    }
    if (!out.insts.length) out.insts = ['-'];   /* ביקשו צמצום שאינו תקין — לאיש, לא לכולם */
  }
  if (f.par === 'p' || f.par === 'pk') out.par = f.par;
  if (f.per) out.per = 1;
  for (var k in out) if (out.hasOwnProperty(k)) return JSON.stringify(out);
  return '';
}

/* ההודעות שמוצגות באפליקציה — ראו `inbox` ב-doGet. */
var INBOX_DAYS = 3;
function inbox_(raw) {
  var mine = String(raw).split(',').map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[\w:.\-]{1,60}$/.test(x); }).slice(0, 4);
  if (!mine.length) return [];
  var rows = inboxRows_();
  var out = [], seen = {};
  for (var i = rows.length - 1; i >= 0 && out.length < 5; i--) {
    var r = rows[i];
    if (seen[r.mid]) continue;
    var ids = ',' + r.ids + ',';
    var hit = mine.some(function (m) { return ids.indexOf(',' + m + ',') >= 0; });
    if (!hit) continue;
    seen[r.mid] = 1;
    out.push({ mid: r.mid, at: r.at, title: r.title, body: r.body, url: r.url });
  }
  return out;
}
/* השורות של INBOX_DAYS הימים האחרונים. כל פתיחה של האפליקציה
   שואלת — ולכן דקה במטמון, ולא קריאה של הגיליון בכל פעם. */
function inboxRows_() {
  var rc = CacheService.getScriptCache(), hit = rc.get('inbox:rows');
  if (hit) { try { return JSON.parse(hit); } catch (x) {} }
  var sh = sheet_('תיבה'), out = [];
  var n = sh.getLastRow();
  if (n >= 2) {
    var from = Math.max(2, n - 199);
    var v = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], h = {};
    for (var j = 0; j < v.length; j++) h[String(v[j]).trim()] = j;
    var d = sh.getRange(from, 1, n - from + 1, sh.getLastColumn()).getValues();
    var edge = Date.now() - INBOX_DAYS * 864e5;
    var g = function (row, k) { return h[k] === undefined ? '' : String(row[h[k]] == null ? '' : row[h[k]]); };
    d.forEach(function (row) {
      var at = h['תאריך'] === undefined ? null : row[h['תאריך']];
      if (!(at instanceof Date) || at.getTime() < edge) return;
      var mid = g(row, 'מזהה הודעה');
      if (!mid) return;
      out.push({ mid: mid, at: at.getTime(), title: g(row, 'כותרת'), body: g(row, 'הטקסט'),
                 url: g(row, 'קישור'), ids: g(row, 'מזהים') });
    });
  }
  try { rc.put('inbox:rows', JSON.stringify(out), 60); } catch (x2) {}
  return out;
}

/* ============================================================
   לחיצה אחת על "שלח" — שליחה אחת.
   ============================================================
   ב-15.10 יצאה הודעה לתלמידים פעמיים, בהפרש של 11 שניות. גוגל
   ביצע את הבקשה הראשונה, אבל התשובה לא חזרה למכשיר ("unable to
   open the file"), והמכשיר ניסה שוב בדרך השנייה (JSONP) — עם
   אותה בקשה בדיוק. השרת ראה שתי בקשות ושלח שתיים, כל אחת עם
   מזהה הודעה משלה, ולכן גם מניעת הכפילות של push-send.js לא
   תפסה אותן.

   מעכשיו המכשיר מצרף `rq` — מזהה אחד ללחיצה, שנוסע גם בניסיון
   החוזר. בקשה שה-`rq` שלה כבר נראה אינה נשלחת שוב: היא מקבלת
   את התשובה של הראשונה (או "התקבל" אם הראשונה עדיין רצה).
   בלי `rq` (מכשיר בגרסה ישנה) — כמו קודם. */
function sayOnce_(e) {
  var rq = String(e.parameter.rq || '');
  if (!/^[A-Za-z0-9_\-]{6,40}$/.test(rq)) return saySay_(e);
  var rc = CacheService.getScriptCache(), rk = 'sayrq:' + rq, had = rc.get(rk);
  if (had) {
    var o = { status:'ok' };
    try { o = JSON.parse(had); } catch (x) {}
    o.dup = 1;
    return reply_(e, o);
  }
  rc.put(rk, '{"status":"ok"}', 1800);
  var out = saySay_(e);
  /* התשובה האמיתית — כדי שהניסיון החוזר יקבל אותה ולא "התקבל". */
  try {
    var c = String(out.getContent());
    var m = /^[A-Za-z_$][\w$]*\(([\s\S]*)\)\s*$/.exec(c);
    rc.put(rk, m ? m[1] : c, 1800);
  } catch (x2) {}
  return out;
}

/* למי ההודעה — **במילים של המסך שממנו נשלחה** ("תלמידים · לא
   סיימו את שבוע 2", "הורים"). השרת אינו מנסח את זה מחדש: אחיאסף
   בחר קהל במילים מסוימות, ובדיווח וברשימה הוא צריך לקרוא בדיוק
   אותן. מכשיר ישן שלא שולח `to` — ריק, ונשאר הנוסח הקודם. */
function sayTo_(P) {
  return String(P.to || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

/* השליחה עצמה — `fire=say`. ראו sayOnce_ למעלה. */
function saySay_(e) {
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
    if (ACC_ONLY) {
      var gS = accGate_(inst, P.dev, !!P.k);
      if (gS) return reply_(e, gS);
    } else {
      var want = getCode_(inst);
      if (!want || String(P.k || '') !== want) {
        return reply_(e, { status:'denied', message:'קוד גישה שגוי' });
      }
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
                     String(P.who || ''), link, '', '', JSON.stringify(fl2),
                     false, '', sayTo_(P));
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
                           sayFlt_(P.flt), false, '', sayTo_(P));
  /* **איש הצוות אינו רואה כישלון** — הוא עובר לרכז (נרשם ביומן
     ו-sayAlert_), והרכז שולח שוב מהניהול. לרכז — האמת. */
  if (!isAdm && rS.status !== 'ok') rS = { status:'ok', held: 1 };
  return reply_(e, rS);
}

/* מצית את ה-workflow ששולח. `repository_dispatch` הוא הדלת
   הרשמית להפעלה מבחוץ, והמטען נוסע איתו — כלומר אין צורך
   בלשונית ביניים ואין השהיה של סקר. */
function ghFire_(title, body, only, grade, klass, who, link, role, wait, flt, quiet, mid, to) {
  var tok  = prop_('GH_TOKEN', '');
  var repo = prop_('GH_REPO', '');
  if (!body) return { status:'error',  message:'אין מה לשלוח' };
  /* **מזהה לכל שליחה.** הוא נוסע עם ההודעה ל-GitHub, וההרצה מדווחת
     עליו בסוף (`?sayDone=`) — "יצאה ל-N" או "נכשלה". בלעדיו "נשלח"
     במסך אמר רק שגוגל קיבל את הבקשה, ולא שמשהו הגיע למישהו. */
  var sid = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  /* **מזהה הודעה** — קבוע לאורך כל השליחות החוזרות של אותה הודעה,
     בשונה מ-sid שחדש בכל הרצה. push-send.js בודק לפיו בלשונית
     "מסירות" מי כבר קיבל, ולא שולח לו שוב. נוסע בתוך הפילוח, כי
     המטען כבר מלא (עשרה שדות). התראות מערכת לרכז — בלי: הן קצרות,
     ואין טעם להוסיף להן קריאה נוספת מגוגל. */
  mid = quiet ? '' : String(mid || sid);
  var fltOut = flt || '';
  if (mid) {
    var fo = {};
    try { fo = JSON.parse(String(flt || '{}')) || {}; } catch (eF) { fo = {}; }
    fo.mid = mid;
    fltOut = JSON.stringify(fo);
  }
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
                            flt: fltOut, sid: sid }
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
        ['מי', who || 'רכז'], ['ישיבה', only || 'כולם'], ['למי', to || ''],
        ['קהל', quiet ? 'מכשירי רכז' : ''],
        ['שכבה', grade || ''], ['כיתה', klass || ''],
        ['כותרת', title], ['הטקסט', body],
        ['תפקיד', role || ''], ['פילוח', String(flt || '').slice(0, 40000)],
        ['יעד', only || ''], ['קישור', link || ''], ['ממתינים', wait || ''],
        ['מזהה שליחה', sid], ['מזהה הודעה', mid],
        ['תוצאה', res0.status === 'ok' ? 'ממתין' : 'נכשלה: ' + (res0.message || '')],
        ['סטטוס שליחה', res0.status === 'ok' ? '' : 'נכשל']
    ]);
  } catch (e3) {}
  if (!quiet && res0.status !== 'ok') sayAlert_(who, to || only, body, res0.message);
  return res0;
}

/* התראה לרכז — לכל מכשיר שנרשם בתפקיד "רכז" (ניהול ← ההתראות
   במכשיר הזה). נרשמת ביומן ("מערכת" · "מכשירי רכז") עם התוצאה, אבל
   אינה מתריעה על עצמה אם נכשלה. */
/* `link` — לאן הלחיצה על ההתראה מובילה. בלעדיו — מסך הניהול. */
function coordPing_(title, body, link) {
  try { ghFire_(title, body, '', '', '', 'מערכת', link || 'admin', 'רכז', '', '', true); } catch (e) {}
}
/* ההודעה לא הגיעה בכלל ל-GitHub — כלומר לא נשלחה לאף אחד. */
function sayAlert_(who, only, body, why) {
  sayReport_('נכשל', who, only, body, why, { ok: 0, prev: 0, bad: 0, gone: 0 }, null);
}

/* ============================================================
   הדיווח לרכז על כל שליחה — גם כשהצליחה.
   ============================================================
   כותרת עם סטטוס ברור ("לא נשלחה כלל" / "נשלחה חלקית" / "נשלחה"),
   ובגוף: השולח, הישיבה, ההודעה, הסיבה המדויקת כשנכשל, והנמענים —
   מי קיבל ומי לא (מנוי פג), לפי ישיבה וכיתה.

   **השמות נשארים פרטיים:** הם נוסעים רק בהתראה למכשירי הרכז,
   ונשמרים בגיליון הפרטי ("הודעות" · "נמענים"). לא בקוד, לא ביומן
   ההרצה של GitHub (push-send.js אינו מדפיס תוכן), ולא בריפו. */
function sayReport_(stt, who, inst, body, why, c, nm) {
  var head = { 'נשלח': '✓ נשלחה', 'חלקי': '⚠ נשלחה חלקית', 'נכשל': '⚠ לא נשלחה כלל',
               'אין נמענים': 'ℹ לא נשלחה — אין נמענים' }[stt] || stt;
  var cnt = [];
  if (c.ok) cnt.push('קיבלו עכשיו ' + c.ok);
  if (c.prev) cnt.push('קיבלו כבר קודם ' + c.prev);
  if (c.bad) cnt.push('נכשלו ' + c.bad);
  if (c.gone) cnt.push('מנוי פג ' + c.gone);
  var txt = (who || 'רכז') + (inst ? ' · ' + inst : '') + '\n' +
    '«' + String(body || '').replace(/\{name\}[,،]?\s*/g, '').slice(0, 110) + '»' +
    (why ? '\nסיבה: ' + String(why).slice(0, 200) : '') +
    (cnt.length ? '\n' + cnt.join(' · ') + ' (מכשירים)' : '') +
    (c.late ? '\n⏱ יצאה באיחור של ' + c.late + ' דקות' : '');
  var names = nm ? sayNamesTxt_(nm, 1300 - txt.length) : '';
  coordPing_(head + ' · ' + (who || 'רכז'), txt + (names ? '\n' + names : ''));
}

/* מי קיבל את ההודעה ומי לא — לפי "מסירות" (המצב האחרון של כל
   מכשיר בהודעה הזו) מול "התראות" (שם, ישיבה, כיתה של כל מנוי).
   הטביעה זהה לזו של push-send.js: sha1 של כתובת המנוי, 12 תווים. */
function sayNames_(mid, wait) {
  var out = { ok: [], gone: [], bad: [], inst: {} };
  var dsh = sheet_('מסירות');
  var st = {};
  if (dsh.getLastRow() >= 2) {
    var dv = dsh.getDataRange().getValues(), dh = {};
    for (var i = 0; i < dv[0].length; i++) dh[String(dv[0][i]).trim()] = i;
    for (var r = 1; r < dv.length; r++) {
      if (String(dv[r][dh['מזהה הודעה']] || '') !== mid) continue;
      var s0 = String(dv[r][dh['מצב']] || '');
      String(dv[r][dh['מכשירים']] || '').split(',').forEach(function (p) { if (p) st[p] = s0; });
    }
  }
  var tabs = wait ? ['ממתינים לדף', 'התראות'] : ['התראות'];
  var who = {};
  tabs.forEach(function (tn) {
    var sh = sheet_(tn);
    if (sh.getLastRow() < 2) return;
    var v = sh.getDataRange().getValues(), h = {};
    for (var j = 0; j < v[0].length; j++) h[String(v[0][j]).trim()] = j;
    if (h['מנוי'] === undefined) return;
    var g = function (row, k) { return h[k] === undefined ? '' : String(row[h[k]] || '').trim(); };
    for (var q = 1; q < v.length; q++) {
      var ins = g(v[q], 'ישיבה'), code = g(v[q], 'קוד ישיבה');
      if (code && ins) out.inst[code] = ins;
      var raw = g(v[q], 'מנוי');
      if (!raw) continue;
      var ep = '';
      try { ep = (JSON.parse(raw) || {}).endpoint || ''; } catch (eJ) { continue; }
      if (!ep) continue;
      var p = subPrint_(ep);
      if (!st[p] || who[p]) continue;
      who[p] = { n: g(v[q], 'שם') || '—', at: [ins || code, g(v[q], 'כיתה')].filter(String).join(' ') };
    }
  });
  var seen = {};
  for (var pk in st) {
    if (!st.hasOwnProperty(pk)) continue;
    var w = who[pk] || { n: '?', at: '' };
    var bin = st[pk] === 'נשלח' || st[pk] === 'ממתין' ? 'ok' : st[pk] === 'פג' ? 'gone' : 'bad';
    var key = bin + '|' + w.n + '|' + w.at;
    if (seen[key]) continue;           /* אדם עם שני מכשירים — פעם אחת */
    seen[key] = 1;
    out[bin].push(w);
  }
  return out;
}
/* "מסירות" נקראת במלואה בכל שליחה — ולכן אסור לה לגדול בלי סוף.
   פעם ביום: שורות בנות יותר מ-30 יום נמחקות. אחרי חודש איש אינו שולח
   שוב את אותה הודעה. השורות נכתבות לפי סדר הזמן, ולכן הישנות בראש. */
function dlvPrune_() {
  pruneTab_('מסירות', 30, 'DLV_PRUNE');
  /* "תיבה" — הודעה מוצגת באפליקציה עד INBOX_DAYS ימים. שבועיים
     נשמרות, למקרה שצריך לבדוק מה הוצג למי. */
  pruneTab_('תיבה', 14, 'INBOX_PRUNE');
}
function pruneTab_(tab, days, prop) {
  var P = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');
  if (P.getProperty(prop) === today) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var sh = sheet_(tab);
    if (sh.getLastRow() >= 2) {
      var h = headers_(sh), it = h.indexOf('תאריך');
      if (it < 0) return;
      var v = sh.getRange(2, it + 1, sh.getLastRow() - 1, 1).getValues();
      var edge = Date.now() - days * 864e5, k = 0;
      while (k < v.length && v[k][0] instanceof Date && v[k][0].getTime() < edge) k++;
      /* גוגל אינו מוחק את כל השורות שמתחת לכותרת הקפואה — שורה אחת נשארת. */
      if (k >= v.length) k = v.length - 1;
      if (k > 0) sh.deleteRows(2, k);
    }
    P.setProperty(prop, today);
  } finally { lock.releaseLock(); }
}
function subPrint_(ep) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, String(ep), Utilities.Charset.UTF_8);
  var hx = '';
  for (var i = 0; i < 6; i++) hx += ('0' + ((b[i] + 256) % 256).toString(16)).slice(-2);
  return hx;
}
/* "✓ קיבלו (12): ישיבת X ט1 — דני, יוסי · …". max>0 — קיצור להתראה. */
function sayNamesTxt_(nm, max) {
  var part = function (list, lbl) {
    if (!list.length) return '';
    var by = {}, order = [];
    list.forEach(function (w) {
      if (!by[w.at]) { by[w.at] = []; order.push(w.at); }
      by[w.at].push(w.n);
    });
    order.sort();
    return lbl + ' (' + list.length + '): ' + order.map(function (k) {
      return (k ? k + ' — ' : '') + by[k].join(', ');
    }).join(' · ');
  };
  var lines = [part(nm.ok, '✓ קיבלו'), part(nm.gone, '⌛ לא קיבלו — מנוי פג'),
               part(nm.bad, '✗ לא קיבלו — תקלה')].filter(String);
  var t = lines.join('\n');
  if (max > 0 && t.length > max) t = t.slice(0, Math.max(0, max - 30)) + '… (הרשימה המלאה בגיליון)';
  return t;
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

/* ============================================================
   "פרסם הכול" לחידון של מסכת ושבוע — ואחריו, רק אם נבחר ואושר,
   התראה למי שביקש. (8.99.240 — במקום הכפתור הנפרד "החידון מוכן".)
   ============================================================
   התלמיד מבקש בסוף הלימוד (learn.html, ntBox) — שורה ב"ממתינים
   לדף" עם `דף` = 'חידון|taanit-3'.

   ?quizReady=taanit-3&daf=ב&amud=1           — מצב בלבד (מספרים). אינו שולח.
   ?quizPubAll=taanit-3&daf=&amud=&keys=&pexp=  — פרסום הקטעים של השבוע
     ...&notify=1&exp=&title=&body=           — ואחריו התראה, רק אם אושרה

   · **זו הדרך היחידה להתראת חידון.** פרסום של שאלה בודדת (learn.html)
     אינו מגיע לכאן כלל, ו-`wait` ב-fire=say עדיין מקבל רק מפתח של דף.
   · **הפרסום**: רק הקטעים שנשלחו (`keys` — של השבוע, ובדף מחולק — של
     העמוד), ורק בשורה של המסכת והדף. טיוטה (`draft`) נעשית הגרסה
     החיה. `pexp` — כמה שאלות הרכז ראה; השתנה — לא מפרסמים. אחרי
     הכתיבה קוראים שוב ומאמתים.
   · **ההתראה — רק אחרי פרסום שאומת**, בתוך אותה נעילה. מזהה הודעה
     קבוע לחידון (`qz-taanit-3`): push-send.js מדלג על מי שכבר קיבל
     ("מסירות"), ולכן לחיצה כפולה וניסיון חוזר אחרי ניתוק אינם מגיעים
     פעמיים. "כבר בשליחה" (יומן "הודעות", עד 30 דק') — לא מציתים שוב.
     `exp` — המספר שאושר; השתנה — לא שולחים (הפרסום כבר נעשה).
   ============================================================ */
var QZ_WAIT_ = 'חידון|';
/* שדות הבקשה. null = לא תקינה. */
function quizArgs_(q, P) {
  var m = /^([a-z]+)-(\d{1,2})$/.exec(String(q || ''));
  var dafRaw = String(P.daf || '').trim(), am = String(P.amud || '0');
  var dk = dafRaw.replace(/["'׳״\s]/g, '');
  if (!m || !/^[\u05D0-\u05EA]{1,4}$/.test(dk) || !/^["'׳״\u05D0-\u05EA]{1,7}$/.test(dafRaw) ||
      !/^[012]$/.test(am)) return null;
  return { q: String(q), mas: m[1], dafRaw: dafRaw, dk: dk, am: am,
           wait: QZ_WAIT_ + q, mid: 'qz-' + q };
}
function quizReady_(P) {
  var a = quizArgs_(P.quizReady, P);
  if (!a) return { status:'error', quiz: 1, message:'בקשה לא תקינה' };
  return quizState_(a.wait, a.mid, a.mas, a.dk);
}
function quizPubAll_(P) {
  var a = quizArgs_(P.quizPubAll, P);
  if (!a) return { status:'error', quiz: 1, message:'בקשה לא תקינה' };
  var keys = [], seen = {};
  String(P.keys || '').split(',').forEach(function (k) {
    k = k.trim();
    if (/^[A-Za-z0-9]{1,16}$/.test(k) && !seen[k]) { seen[k] = 1; keys.push(k); }
  });
  var pexp = parseInt(P.pexp, 10);
  if (!keys.length || !(pexp >= 0)) return { status:'error', quiz: 1, message:'בקשה לא תקינה' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { status:'error', quiz: 1, message:'השרת עסוק — נסו שוב בעוד רגע' };
  /* אותה פעולה שחזרה (ניסיון חוזר אחרי ניתוק) — אותה תשובה, בלי לרוץ שוב.
     בתוך הנעילה: שתי הבקשות אינן יכולות לעבור את הבדיקה יחד. */
  var op = /^[A-Za-z0-9]{6,40}$/.test(String(P.op || '')) ? 'qzop:' + P.op : '';
  var cache = null;
  try { cache = op ? CacheService.getScriptCache() : null; } catch (eC) { cache = null; }
  var keep = function (o) {
    try { if (cache) cache.put(op, JSON.stringify(o), 6 * 3600); } catch (eP) {}
    return o;
  };
  try {
    if (cache) {
      var hit = cache.get(op);
      if (hit) { var o0 = JSON.parse(hit); o0.again = 1; return o0; }
    }
    var sh = sheet_('שאלות בדף'), at = -1, rec = null;
    var v = sh.getLastRow() >= 2 ? sh.getDataRange().getValues() : [];
    for (var r = 1; r < v.length; r++) {
      if (String(v[r][0]).trim() === a.mas && String(v[r][1]).replace(/["'׳״\s]/g, '') === a.dk) { at = r; break; }
    }
    if (at >= 0) {
      try { rec = JSON.parse(String(v[at][2] || '')); } catch (eJ) { rec = null; }
      if (!rec || typeof rec !== 'object') return { status:'error', quiz: 1, message:'רשומת השאלות של הדף פגומה' };
    }
    /* מה יפורסם — אותו כלל של qItem_ בדף האינטראקטיבי. */
    var todo = 0;
    if (rec) keys.forEach(function (k) {
      var arr = rec[k];
      if (!arr || arr.length === undefined) return;
      for (var i = 0; i < arr.length; i++) {
        var x = arr[i];
        if (!x || typeof x !== 'object') continue;
        if (x.hasOwnProperty('pub') || x.hasOwnProperty('draft')) { if (x.draft) todo++; }
        else if (!rec.__pub) todo++;
      }
    });
    if (todo !== pexp) return keep({ status:'refused', quiz: 1, why:'pchanged', todo: todo });
    if (todo) {
      keys.forEach(function (k) {
        var arr = rec[k];
        if (!arr || arr.length === undefined) return;
        rec[k] = arr.map(function (x) {
          if (!x || typeof x !== 'object') return x;
          if (x.hasOwnProperty('pub') || x.hasOwnProperty('draft')) {
            return x.draft ? { pub: x.draft, draft: null } : x;
          }
          return rec.__pub ? x : { pub: { q: x.q, a: x.a, correct: x.correct }, draft: null };
        });
      });
      var txt = JSON.stringify(rec);
      sh.getRange(at + 1, 3).setValue(txt);
      SpreadsheetApp.flush();
      /* אימות: מה שבגיליון הוא מה שנכתב. לא — לא ממשיכים להתראה. */
      if (String(sh.getRange(at + 1, 3).getValues()[0][0]) !== txt) {
        return { status:'error', quiz: 1, message:'הפרסום לא אומת מול הגיליון' };
      }
    }
    var out = { status:'ok', quiz: 1, published: todo };
    if (String(P.notify || '') === '1') out.notify = quizSend_(P, a);
    out.st = quizState_(a.wait, a.mid, a.mas, a.dk);
    return keep(out);
  } finally { lock.releaseLock(); }
}
/* ההתראה עצמה. נקרא רק מתוך quizPubAll_, אחרי פרסום שאומת, בתוך הנעילה. */
function quizSend_(P, a) {
  var st = quizState_(a.wait, a.mid, a.mas, a.dk);
  var no = function (why) { return { status:'refused', why: why, fresh: st.fresh, n: st.n }; };
  if (!st.pub) return no('nopub');
  if (!st.n) return no('nowait');
  if (st.busy) return no('busy');
  if (!st.fresh) return no('allgot');
  if (String(P.exp || '') !== String(st.fresh)) return no('changed');
  var title = String(P.title || '').trim().slice(0, 120);
  var body = String(P.body || '').trim().slice(0, 400);
  if (!title || !body) return { status:'error', message:'חסר נוסח' };
  /* הקישור נבנה כאן, מהשדות שנבדקו — לא מכתובת שהלקוח שלח. */
  var link = 'learn?mas=' + a.mas + '&daf=' + encodeURIComponent(a.dafRaw) +
             (a.am !== '0' ? '&amud=' + a.am : '') + '&quiz=1';
  var r = ghFire_(title, body, '', '', '', 'רכז · החידון מוכן', link, '', a.wait, '', false, a.mid);
  if (r.status !== 'ok') return { status:'error', message: r.message || 'השליחה לא הוצתה' };
  return { status:'ok', sent: 1, sid: r.sid, fresh: st.fresh };
}
/* המספרים: פורסם? כמה ביקשו (מכשירים ייחודיים), כמה כבר קיבלו,
   ומה קרה בשליחה האחרונה. אותם כללים של loadSubs/loadDone ב-push-send.js. */
function quizState_(wait, mid, mas, dk) {
  var out = { status:'ok', quiz: 1, pub: quizPub_(mas, dk), rows: 0, n: 0, bad: 0, dup: 0,
              prev: 0, gone: 0, fresh: 0, busy: 0, last: null };
  var seen = {}, prints = [];
  var sh = sheet_('ממתינים לדף');
  if (sh.getLastRow() >= 2) {
    var v = sh.getDataRange().getValues(), h = {};
    for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
    if (h['דף'] === undefined || h['מנוי'] === undefined) throw new Error('חסרות עמודות בלשונית ממתינים לדף');
    for (var r = v.length - 1; r >= 1; r--) {
      if (String(v[r][h['דף']] || '').trim() !== wait) continue;
      out.rows++;
      var ep = '';
      try { ep = (JSON.parse(String(v[r][h['מנוי']] || '')) || {}).endpoint || ''; } catch (eJ) { ep = ''; }
      if (!ep) { out.bad++; continue; }
      if (seen[ep]) { out.dup++; continue; }
      seen[ep] = 1; out.n++; prints.push(subPrint_(ep));
    }
  }
  var done = {}, dsh = sheet_('מסירות');
  if (dsh.getLastRow() >= 2) {
    var dv = dsh.getDataRange().getValues(), dh = {};
    for (var j = 0; j < dv[0].length; j++) dh[String(dv[0][j]).trim()] = j;
    if (dh['מזהה הודעה'] !== undefined && dh['מכשירים'] !== undefined) {
      for (var k = 1; k < dv.length; k++) {
        if (String(dv[k][dh['מזהה הודעה']] || '').trim() !== mid) continue;
        var s0 = String(dv[k][dh['מצב']] || '').trim();
        String(dv[k][dh['מכשירים']] || '').split(',').forEach(function (p) { p = p.trim(); if (p) done[p] = s0; });
      }
    }
  }
  prints.forEach(function (p) {
    if (done[p] === 'נשלח' || done[p] === 'ממתין') out.prev++;
    else if (done[p] === 'פג') out.gone++;
    else out.fresh++;
  });
  var ls = sheet_('הודעות');
  if (ls.getLastRow() >= 2) {
    var lv = ls.getDataRange().getValues(), lh = {};
    for (var a = 0; a < lv[0].length; a++) lh[String(lv[0][a]).trim()] = a;
    if (lh['מזהה הודעה'] !== undefined) {
      for (var b = lv.length - 1; b >= 1; b--) {
        if (String(lv[b][lh['מזהה הודעה']] || '') !== mid) continue;
        var g = function (c) { return lh[c] === undefined ? '' : lv[b][lh[c]]; };
        var at = g('תאריך'), res = String(g('תוצאה') || '');
        var age = at instanceof Date ? Date.now() - at.getTime() : 1e9;
        out.last = { res: res, st: String(g('סטטוס שליחה') || ''), got: String(g('קיבלו') || ''),
                     at: at instanceof Date ? at.toISOString() : '', sid: String(g('מזהה שליחה') || '') };
        if ((res === 'ממתין' || res === 'בשליחה') && age < 30 * 60000) out.busy = 1;
        break;
      }
    }
  }
  return out;
}
/* כמה שאלות פורסמו בדף (בכל העמודים). אותם כללים של qItem_ בדף
   האינטראקטיבי: { pub, draft } — רק `pub`; צורה ישנה — לפי `__pub`. */
function quizPub_(mas, dk) {
  var sh = sheet_('שאלות בדף'), n = 0;
  if (sh.getLastRow() < 2) return 0;
  var v = sh.getDataRange().getDisplayValues();
  for (var r = 1; r < v.length; r++) {
    if (String(v[r][0]).trim() !== mas || String(v[r][1]).replace(/["'׳״\s]/g, '') !== dk) continue;
    var rec = null;
    try { rec = JSON.parse(String(v[r][2] || '')); } catch (eP) { rec = null; }
    if (!rec || typeof rec !== 'object') continue;
    for (var k in rec) {
      if (!rec.hasOwnProperty(k) || k.indexOf('__') === 0) continue;
      var arr = rec[k];
      if (!arr || arr.length === undefined) continue;
      for (var i = 0; i < arr.length; i++) {
        var x = arr[i];
        if (!x || typeof x !== 'object') continue;
        if (x.hasOwnProperty('pub') || x.hasOwnProperty('draft')) { if (x.pub) n++; }
        else if (rec.__pub) n++;
      }
    }
  }
  return n;
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
var GUARD_TABS = ['סימוני הדף', 'פירוש', 'שאלות בדף', 'מצגת', 'מצגות', 'שאלות לשיבוץ'];

/* ============================================================
   "שאלות לשיבוץ" — מאגר ההכנה של השאלות לדף האינטראקטיבי.
   ============================================================
   שני כותבים במקביל: אינסטינקט כותב ישירות בגיליון, והאפליקציה
   כותבת מהכרטיסים בניהול. כתיבת טבלה מלאה (`table`) הייתה מוחקת
   שורה שאינסטינקט הוסיף בין הקריאה לשמירה. לכן כאן נוגעים רק
   בשורה של המזהה, בתוך הנעילה של doPost:
   · put — מעדכן רק את העמודות שנשלחו; מזהה שאינו קיים — שורה חדשה.
   · del — מוחק את השורה. שאלה ב"שובצה" אינה נמחקת: היא ההיסטוריה.
   · ids — רק נותן מזהה לשורות שנכתבו בגיליון בלי מזהה.
   בכל קריאה, לפני הכל, שורה עם שאלה ובלי מזהה מקבלת מזהה — אחרת
   אין דרך לערוך אותה בלי ליצור כפילות.
   ============================================================ */
var QB_TAB_  = 'שאלות לשיבוץ';
var QB_COLS_ = ['מזהה', 'מסכת', 'דף', 'שאלה', 'תשובה 1', 'תשובה 2', 'תשובה 3', 'תשובה 4',
                'נכונה', 'סטטוס', 'הערה', 'קטע', 'הפניה לפירוש'];
/* ---------- המאגר והדף — שאלה אחת, שני מקומות ----------
   שאלה שבדף נושאת `qb` — מזהה השורה שלה במאגר. qbDaf_ כותב עריכה
   מהניהול לתוך רשומת הדף (שאלה אחת, לא הלשונית כולה — כך עריכה
   במקביל בדף אינה נדרסת). שאלה שפורסמה מתעדכנת אצל התלמידים מיד;
   שלא פורסמה — נשארת טיוטה. qbLink_ מאחד פעם אחת את מה שכבר קיים:
   שאלה בדף בלי `qb` מקבלת את השאלה הדומה לה במאגר, ושורת המאגר
   מתעדכנת מהדף (מה שהתלמידים רואים הוא הקובע).
   הדמיון — אותו כלל כמו QbLike ב-qbank.js. */
function qbNorm_(t) { return String(t || '').replace(/["'״׳“”„\s.,:;?!—–-]/g, ''); }
function qbWords_(t) {
  return String(t || '').replace(/["'״׳“”„.,:;?!—–()-]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1; });
}
function qbLike_(v, x) {
  if (!v || !x) return false;
  var p = qbNorm_(v.q), q = qbNorm_(x.q), i;
  if (p && q && (p === q || (Math.min(p.length, q.length) >= 8 && (p.indexOf(q) >= 0 || q.indexOf(p) >= 0)))) return true;
  var A = qbWords_(v.q), B = qbWords_(x.q), n = 0;
  for (i = 0; i < A.length; i++) if (B.indexOf(A[i]) >= 0 && A.indexOf(A[i]) === i) n++;
  if (Math.min(A.length, B.length) >= 3 && n / Math.min(A.length, B.length) >= 0.6) return true;
  var b = (x.a || []).map(qbNorm_);
  for (i = 0; i < (v.a || []).length; i++) {
    var t = qbNorm_(v.a[i]);
    if (t.length >= 3 && b.indexOf(t) >= 0) return true;
  }
  return false;
}
function qbDk_(v) { return String(v || '').replace(/["'׳״\s.:]/g, ''); }
function qbMasId_(v) {
  v = String(v || '').trim();
  return v === 'תענית' ? 'taanit' : v === 'מגילה' ? 'megila' : v;
}
/* הצורה הישנה ({q,a} + __pub) -> { pub, draft }, כמו qNormRec_ בדף. */
function qbRecNorm_(rec) {
  var was = !!rec.__pub;
  qbEach_(rec, function (list, k) {
    rec[k] = list.map(function (x) {
      if (!x || typeof x !== 'object' || x.hasOwnProperty('pub') || x.hasOwnProperty('draft')) return x;
      return was ? { pub: x, draft: null } : { pub: null, draft: x };
    });
  });
  delete rec.__pub;
  return rec;
}
function qbEach_(rec, fn) {
  for (var k in rec) {
    if (rec.hasOwnProperty(k) && k.indexOf('__') !== 0 && rec[k] && rec[k].length !== undefined) fn(rec[k], k);
  }
}
function qbCur_(x) { return x && (x.draft || x.pub); }
function qbDaf_(d) {
  var id = String(d.id || '').trim(), val = parse_(d.val), like = parse_(d.like);
  if (!id || !val || !val.q) return { status: 'error', message: 'חסרה שאלה' };
  var sh = sheet_('שאלות בדף'), last = sh.getLastRow();
  if (last < 2) return { status: 'success', found: 0 };
  var data = sh.getRange(2, 1, last - 1, 3).getDisplayValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][0] || '').trim() !== String(d.mas || '').trim() || qbDk_(data[r][1]) !== qbDk_(d.daf)) continue;
    var rec, hit = null;
    try { rec = JSON.parse(String(data[r][2] || '')); } catch (e) { return { status: 'error', message: 'רשומת הדף פגומה' }; }
    qbRecNorm_(rec);
    qbEach_(rec, function (list) {
      for (var i = 0; i < list.length && !hit; i++) if ((qbCur_(list[i]) || {}).qb === id) hit = list[i];
    });
    if (like) qbEach_(rec, function (list) {
      for (var i = 0; i < list.length && !hit; i++) {
        var c = qbCur_(list[i]);
        if (c && !c.qb && qbLike_(c, like)) hit = list[i];
      }
    });
    if (!hit) return { status: 'success', found: 0 };
    val.qb = id;
    /* פורסמה — התלמידים רואים את השינוי מיד. לא פורסמה — טיוטה. */
    if (hit.pub) { hit.pub = val; hit.draft = null; } else hit.draft = val;
    sh.getRange(r + 2, 3).setValue(JSON.stringify(rec));
    return { status: 'success', found: 1 };
  }
  return { status: 'success', found: 0 };
}
function qbLink_() {
  var bs = sheet_(QB_TAB_), head = headers_(bs), bl = bs.getLastRow();
  var qs = sheet_('שאלות בדף'), ql = qs.getLastRow();
  if (!head.join('') || bl < 2 || ql < 2) return { status: 'success', linked: 0, synced: 0 };
  var c = {};
  QB_COLS_.forEach(function (n) { c[n] = idx_(bs, head, n); });
  var bank = bs.getRange(2, 1, bl - 1, head.length).getDisplayValues();
  var B = bank.map(function (b) {
    return { id: String(b[c['מזהה']] || '').trim(), mas: qbMasId_(b[c['מסכת']]), daf: qbDk_(b[c['דף']]),
             q: b[c['שאלה']], a: [b[c['תשובה 1']], b[c['תשובה 2']], b[c['תשובה 3']], b[c['תשובה 4']]] };
  });
  var data = qs.getRange(2, 1, ql - 1, 3).getDisplayValues(), recs = [], used = {}, linked = 0, synced = 0;
  data.forEach(function (row, r) {
    var rec = null;
    try { rec = JSON.parse(String(row[2] || '')); } catch (e) {}
    if (!rec || typeof rec !== 'object') return;
    recs.push({ r: r, mas: String(row[0] || '').trim(), daf: qbDk_(row[1]), rec: qbRecNorm_(rec), raw: String(row[2] || '') });
    qbEach_(rec, function (list) { list.forEach(function (x) { var v = qbCur_(x); if (v && v.qb) used[v.qb] = 1; }); });
  });
  recs.forEach(function (R) {
    qbEach_(R.rec, function (list, k) {
      list.forEach(function (x) {
        var v = qbCur_(x), j, best = -1;
        if (!v || !v.q) return;
        if (!v.qb) {
          for (j = 0; j < B.length; j++) {
            if (!B[j].id || used[B[j].id] || B[j].mas !== R.mas || B[j].daf !== R.daf || !qbLike_(v, B[j])) continue;
            if (best < 0 || qbNorm_(B[j].q) === qbNorm_(v.q)) best = j;
          }
          if (best < 0) return;
          used[B[best].id] = 1; linked++;
          if (x.pub) x.pub.qb = B[best].id;
          if (x.draft) x.draft.qb = B[best].id;
        }
        /* שורת המאגר — לפי הדף: הנוסח, "שובצה" והקטע. */
        for (j = 0; j < B.length; j++) if (B[j].id === v.qb) break;
        if (j >= B.length) return;
        var row = bank[j].slice(), was = JSON.stringify(row);
        var set = function (n, val) { put_(row, c[n], val); };
        set('שאלה', v.q);
        for (var t = 0; t < 4; t++) set('תשובה ' + (t + 1), (v.a || [])[t] || '');
        set('נכונה', String((+v.correct || 0) + 1));
        set('הפניה לפירוש', v.yr ? 'כן' : '');
        set('סטטוס', 'שובצה');
        if (!String(row[c['קטע']] || '').trim() && /^\d+$/.test(k)) set('קטע', k);
        if (JSON.stringify(row) === was) return;
        for (var z = 0; z < row.length; z++) {
          if (typeof row[z] === 'string' && /^[=+\-@]/.test(row[z])) row[z] = "'" + row[z];
        }
        bank[j] = row;
        bs.getRange(j + 2, 1, 1, row.length).setValues([row]);
        synced++;
      });
    });
    var out = JSON.stringify(R.rec);
    if (out !== R.raw) qs.getRange(R.r + 2, 3).setValue(out);
  });
  return { status: 'success', linked: linked, synced: synced };
}
function qbank_(d) {
  var sh = sheet_(QB_TAB_);
  var head = headers_(sh);
  if (!head.join('')) { headRow_(sh, QB_COLS_); head = QB_COLS_.slice(); }
  var ixId = idx_(sh, head, 'מזהה'), ixQ = idx_(sh, head, 'שאלה'), ixSt = idx_(sh, head, 'סטטוס');
  var last = sh.getLastRow();
  var data = last > 1 ? sh.getRange(2, 1, last - 1, head.length).getDisplayValues() : [];
  var seq = Date.now(), filled = 0;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][ixId] || '').trim() || !String(data[i][ixQ] || '').trim()) continue;
    data[i][ixId] = 'r-' + (seq++).toString(36);
    sh.getRange(i + 2, ixId + 1).setValue(data[i][ixId]);
    filled++;
  }
  if (d.op === 'ids') return { status: 'success', filled: filled };
  var id = String(d.id || '').trim();
  if (!id) return { status: 'error', message: 'חסר מזהה' };
  var at = -1;
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][ixId] || '').trim() === id) { at = r; break; }
  }
  if (d.op === 'del') {
    if (at < 0) return { status: 'success', removed: 0 };
    if (String(data[at][ixSt] || '').trim() === 'שובצה') {
      return { status: 'denied', message: 'שאלה ששובצה נשארת בלשונית' };
    }
    sh.deleteRow(at + 2);
    return { status: 'success', removed: 1 };
  }
  if (d.op !== 'put') return { status: 'error', message: 'פעולה לא מוכרת' };
  var row = at >= 0 ? data[at].slice() : [];
  /* "שובצה" גוברת: שאלה ששובצה נשארת כזו, גם כשנשלח אליה "טיוטה" או "מוכנה". */
  var wasPlaced = at >= 0 && String(data[at][ixSt] || '').trim() === 'שובצה' && !d.unplace;
  put_(row, ixId, id);
  (parse_(d.cols) || []).forEach(function (c) {
    var name = c && String(c[0] || '');
    if (QB_COLS_.indexOf(name) < 0 || name === 'מזהה') return;
    var v = c[1] == null ? '' : String(c[1]);
    if (name === 'סטטוס' && wasPlaced) v = 'שובצה';
    put_(row, idx_(sh, head, name), name === 'נכונה' && /^[1-4]$/.test(v) ? +v : v);
  });
  /* השורה נכתבת מחדש כולה, מערכי התצוגה. נוסח שנראה כמו נוסחה
     נשמר כטקסט — "=" בראש תשובה אינו פקודה. */
  for (var k = 0; k < head.length; k++) {
    if (row[k] === undefined) row[k] = '';
    if (typeof row[k] === 'string' && /^[=+\-@]/.test(row[k])) row[k] = "'" + row[k];
  }
  var rn = at >= 0 ? at + 2 : Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(rn, 1, 1, row.length).setValues([row]);
  return { status: 'success', id: id, updated: at >= 0 };
}

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

/* ============================================================
   ההגרלה השבועית — זכאים, הגרלה, פרסום ותוצאות.
   ============================================================
   ?raffle=elig&codes=a,b        — רשימת הזכאים לפי מוסד, וחריגים. לרכז.
   ?raffle=state                  — ההגרלה של השבוע (אם בוצעה). לרכז.
   ?raffle=draw&codes=&rq=        — הגרלה. לרכז, ורק פעם אחת בשבוע.
   ?raffle=void&rid=&why=         — ביטול תוצאה שטרם פורסמה, עם סיבה.
   ?raffle=aud&rid=               — הקהל המדויק של שתי ההודעות.
   ?raffle=pub&rid=&exp=          — אישור סופי: פרסום + שתי השליחות.
   ?raffle=res&id=&inst=          — התוצאה המפורסמת, לתלמיד מאומת.
   ?raffle=self&rid=&k=&code=&t=&b=&ep= — בדיקה אליך בלבד (המכשיר שלוחץ), בלי פרסום.
   ?raffle=selfv&stk=             — מה שהלחיצה על הבדיקה פותחת (אסימון).
   ?raffle=demo&k=&dc=&dw=&codes=&t=&b=&ep= — לפני הגרלה: אליך בלבד, תוצאה לדוגמה.
     (**לא `c`** — שם שמור ב-Apps Script כמו `rt` ו-`sid`: 400 מגוגל.)
   ?raffle=demov&stk=             — מה שהלחיצה על הדוגמה פותחת (אסימון).

   **הכלל השבוע:** סיום עמוד א וגם עמוד ב של דף ב, באותה מסכת.
   מגילה ותענית יחד — אדם נכנס פעם אחת. בלי תנאי חידון. הסיום
   הוא הסיום המוכר (doneRows_), כולל שורות "דף ב שלם בהרצה"
   ש-wholeB_ כבר כותב. אין כאן מדידה חדשה של התקדמות.

   **מי בפנים:** תלמידים (לא הורה, לא בדיקה) שהמוסד שלהם נבחר
   מהתפריט — לפי הקוד, ולא לפי שם. "אחר", ריק ולפיד בחוץ תמיד,
   גם אם הרכז שלח אותם ברשימה.

   **כפילות:** שני חשבונות של אותו אדם (אותו טלפון ואותו שם מלא)
   — הלימוד של שניהם נספר, והיעד הוא החשבון שנרשם אחרון. מוצג
   לרכז כחריג. שמות דומים בלבד אינם מאחדים.

   **התוצאה פרטית** — לשונית "הגרלות" בגיליון הפרטי. לתלמידים
   יוצא רק מה שפורסם, ורק למי שזוהה כתלמיד של מוסד שהשתתף.
   ============================================================ */
var RAF_TAB = 'הגרלות';
var RAF_NEVER = ['lapid', 'other', ''];
var RAF_DAF = 'ב';
/* ‼ חריגה חד-פעמית — הגרלת דף ב (18.10). להסיר אחרי שהגרלת דף ב בוצעה
   ופורסמה, יחד עם RAF_NOQUIZ_DAF ב-learned.js (הנוסח לתלמיד).
   הוראת הבעלים: כל מי שסיים את דף ב בתוך ההגרלה, גם בלי חידון. הכלל
   קשור למחזור של דף ב (RAF_DAF) ולא לשבוע שעל השעון — מי שסיים את
   דף ב אינו מאבד זכאות כשנפתח דף ג לפני ההגרלה. שאר התנאים (הורים,
   בדיקה, לפיד, "אחר", מוסדות שלא נבחרו) — בלי שינוי.
   תנאי החידון של המדיניות הרגילה (80% ומעלה) בנוי ב-rafCalc_ (8.99.255)
   וחל מעצמו על כל RAF_DAF שאינו RAF_NOQUIZ_DAF — כשהמחזור עובר לדף ג
   מספיק להחליף את RAF_DAF. */
var RAF_NOQUIZ_DAF = 'ב';

function rafCodes_(raw) {
  var out = [];
  String(raw || '').split(',').forEach(function (c) {
    c = c.trim();
    if (/^[a-z]{2,20}$/.test(c) && RAF_NEVER.indexOf(c) < 0 && out.indexOf(c) < 0) out.push(c);
  });
  return out;
}
/* "ב." → א, "ב:" → ב, "ב" (דף שלם מההרצה) → שניהם. */
function rafSide_(daf) {
  var d = String(daf || '').replace(/["'׳״\s]/g, '');
  if (d === RAF_DAF + '.') return 'a';
  if (d === RAF_DAF + ':') return 'b';
  if (d === RAF_DAF) return 'ab';
  return '';
}
function rafTrack_(tr) {
  if (SHIFT_TAANIT.names.indexOf(tr) >= 0) return 'taanit';
  if (SHIFT_MEGILA.names.indexOf(tr) >= 0) return 'megila';
  return '';
}

/* החישוב המשותף לזכאים בניהול (raffleElig_) ולתלמיד עצמו (rafMe_) —
   אותה לוגיקה בדיוק: אנשים, איחוד חשבונות, ומי סיים איזה עמוד.
   **תנאי החידון:** מחוץ לחריגת RAF_NOQUIZ_DAF, סיום נספר רק עם חידון
   בציון 80% ומעלה על דף ההגרלה באותה מסכת (quizBest_/quizDaf_). */
function rafCalc_() {
  var P = rafPpl_(), ppl = P.ppl, alias = P.alias, target = P.target;
  var noId = {}, side = {};
  var lr = sheet_(LEARN_TAB);
  var rows = lr.getLastRow() > 1 ? doneRows_(lr.getDataRange().getDisplayValues()) : [];
  if (rows && rows.length > 1) {
    var ix = {};
    for (var h = 0; h < rows[0].length; h++) ix[String(rows[0][h]).trim()] = h;
    var c = function (rw, k) { return ix[k] === undefined ? '' : String(rw[ix[k]] || '').trim(); };
    for (var i = 1; i < rows.length; i++) {
      var s = rafSide_(c(rows[i], 'דף')), tr = rafTrack_(c(rows[i], 'מסלול'));
      if (!s || !tr) continue;
      var lid = c(rows[i], 'מזהה'), canon = alias[lid] || lid;
      if (!canon) continue;
      if (!ppl[canon]) { noId[canon] = c(rows[i], 'קוד ישיבה') || '?'; continue; }
      canon = target[canon] || canon;
      var k = canon + '|' + tr;
      side[k] = side[k] || {};
      if (s !== 'b') side[k].a = 1;
      if (s !== 'a') side[k].b = 1;
    }
  }
  var Q = RAF_DAF !== RAF_NOQUIZ_DAF ? quizBest_(alias, target) : null;
  var A = Q ? amdaQz_(alias, target) : null;
  /* מי סיים את שני העמודים, באחת המסכתות (ומחוץ לחריגה — גם עבר חידון). */
  var done = {};
  Object.keys(side).forEach(function (k) {
    if (!side[k].a || !side[k].b) return;
    var pr = k.split('|');
    if (Q && !quizOk_(Q, A, pr[0], pr[1], RAF_DAF)) return;
    done[pr[0]] = 1;
  });
  return { ppl: ppl, alias: alias, target: target, side: side, done: done, noId: noId };
}
/* האנשים מ"לומדים", ואיחוד החשבונות — המשותף להגרלה ולנקודות. */
function rafPpl_() {
  var t = joinTable_();
  var ppl = {}, alias = aliasMap_(t.rows);
  for (var r = 1; r < t.rows.length; r++) {
    var row = t.rows[r], id = t.c(row, 'מזהה');
    if (!id) continue;
    var p = ppl[id];
    if (!p) p = ppl[id] = { id: id, reg: r, ids: rowIds_(t, row) };
    /* השורה האחרונה של המזהה קובעת: שם, מוסד, תפקיד. */
    p.name = t.c(row, 'שם'); p.last = t.c(row, 'משפחה');
    p.code = t.c(row, 'קוד ישיבה'); p.inst = t.c(row, 'ישיבה');
    p.role = t.c(row, 'תפקיד'); p.grade = t.c(row, 'שכבה'); p.klass = t.c(row, 'כיתה');
    p.test = t.c(row, 'בדיקה') === 'כן';
    p.key = rowKey_(t, row);
    rowIds_(t, row).forEach(function (x) { if (p.ids.indexOf(x) < 0) p.ids.push(x); });
  }
  /* שני חשבונות לאותו אדם (אותו טלפון ושם מלא) — היעד הוא האחרון
     שנרשם, והלימוד של כולם נספר לו. **לפני** שבודקים מי סיים: עמוד
     א בחשבון הישן ועמוד ב בחדש הם סיום אחד. */
  var byKey = {}, target = {};
  Object.keys(ppl).forEach(function (id) {
    var p = ppl[id];
    if (p.key) (byKey[p.key] = byKey[p.key] || []).push(p);
  });
  Object.keys(byKey).forEach(function (k) {
    var g = byKey[k];
    if (g.length < 2) return;
    g.sort(function (x, y) { return x.reg - y.reg; });
    var to = g[g.length - 1];
    to.dup = g.length;
    g.forEach(function (p) {
      target[p.id] = to.id;
      if (p !== to) p.ids.forEach(function (x) { if (to.ids.indexOf(x) < 0) to.ids.push(x); });
    });
  });
  return { ppl: ppl, alias: alias, target: target };
}

/* ============================================================
   ציוני החידון — מהלשונית "חידות" (8.99.255).
   ============================================================
   הציון נשמר כבר היום: learn.html (qsSend_) כותב בסוף הדף שורה
   "החידון כולו" עם "ציון" = נכונות/שאלות ועם המזהה. רק השורות האלה
   נספרות — לא תשובה לשאלה בודדת, ולא "עמדת לימוד" (אין בה ציון).
   לכל אדם (אחרי איחוד), מסכת ודף — הציון הטוב ביותר. `seen` — למי
   יש ציון כלשהו; מי שאין לו, ההיסטוריה שלו "לא ידוע" ולא 0. */
function quizBest_(alias, target) {
  var sh = sheet_('חידות'), v = sh.getLastRow() > 1 ? sh.getDataRange().getDisplayValues() : [];
  var ix = {}, best = {}, seen = {};
  if (v.length) for (var h = 0; h < v[0].length; h++) ix[String(v[0][h]).trim()] = h;
  var c = function (rw, k) { return ix[k] === undefined ? '' : String(rw[ix[k]] || '').trim(); };
  for (var i = 1; i < v.length; i++) {
    if (c(v[i], 'קטע') !== 'החידון כולו') continue;
    var sc = c(v[i], 'ציון').match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!sc || !(+sc[2] > 0)) continue;
    var pr = c(v[i], 'דף').split('|'), tr = rafTrack_(pr[0]);
    var d = String(pr[1] || '').replace(/["'׳״\s]/g, '');
    var mid = c(v[i], 'מזהה'), canon = alias[mid] || mid;
    if (!tr || !d || !canon) continue;
    canon = target[canon] || canon;
    seen[canon] = 1;
    var k = canon + '|' + tr + '|' + d, x = [+sc[1], +sc[2]], o = best[k];
    if (!o || x[0] * o[1] > o[0] * x[1] || (x[0] * o[1] === o[0] * x[1] && x[1] > o[1])) best[k] = x;
  }
  return { best: best, seen: seen };
}
/* הציון של דף שלם: חידון על הדף כולו, או — בדף שמחולק לעמודים
   (ב. / ב:) — שני העמודים יחד. עמוד שאין לו בן זוג בלוח (מגילה לב.)
   הוא הדף כולו. [נכונות, שאלות] או null. */
function quizDaf_(Q, who, tr, base) {
  var sp = tr === 'taanit' ? SHIFT_TAANIT : SHIFT_MEGILA, pre = who + '|' + tr + '|' + base;
  var w = Q.best[pre], a = Q.best[pre + '.'], b = Q.best[pre + ':'], cand = [];
  if (w) cand.push(w);
  if (a && b) cand.push([a[0] + b[0], a[1] + b[1]]);
  else if (a && !sp.wk[base + ':']) cand.push(a);
  else if (b && !sp.wk[base + '.']) cand.push(b);
  var out = null;
  cand.forEach(function (x) { if (!out || x[0] * out[1] > out[0] * x[1]) out = x; });
  return out;
}
function quizPass_(x) { return !!(x && x[0] * 5 >= x[1] * 4); }   /* 80% */

/* ============================================================
   אישור חידון בנוכחות — נתיב נוסף, לא ציון (8.99.256).
   ============================================================
   איש צוות שבחר בפתיחת הנוכחות "לסמן גם שענו על החידון" מאשר
   שהתלמיד ביצע את החידון במלואו. האישור נשמר כעמודה מפורשת
   ("אישור חידון" = כן) בשורת הנוכחות עצמה — לא ציון, ולא שורה
   ב"חידות". שורת נוכחות נכתבת רק בסיסמת הרכז או ממכשיר צוות שאושר
   לאותה ישיבה (קוד הישיבה נכפה בשרת), ולכן זה המקור המאומת.
   **רישומים ישנים** — "למד וחידון" היה ברירת מחדל, ואין בהם את
   העמודה; הם נשארים לימוד, ולא אישור חידון.
   השיוך לתלמיד — דרך "עמדה — שיוך" (המפתח מוסד·שכבה·כיתה·שם·מסלול·
   שבוע ← מזהה), אותו שיוך שכותב את הלימוד. "השתתף" ושיעור שאינו
   הדף — לא. מחזיר { 'מזהה|מסלול|דף': 1 } אחרי איחוד, `seen` כמו
   quizBest_. במטמון 5 דקות; נמחק בכל כתיבת נוכחות ובתיקון פתיחה. */
function amdaQzBust_() {
  try { CacheService.getScriptCache().removeAll(['amda:qz', 'pts:all', 'raf:me']); } catch (e) {}
}
function amdaQzRaw_() {
  var rc = CacheService.getScriptCache(), hit = rc.get('amda:qz');
  if (hit) { try { return JSON.parse(hit); } catch (x0) {} }
  var out = [];
  var at = amdaTable_(AMDA_TAB_), want = {};
  for (var r = 1; r < at.rows.length; r++) {
    var x = at.rows[r];
    if (at.c(x, 'אישור חידון') !== 'כן' || at.c(x, 'סוג') !== 'דף' || at.c(x, 'רמה') === AMDA_LV_P_) continue;
    var key = [at.c(x, 'קוד ישיבה'), at.c(x, 'שכבה'), at.c(x, 'כיתה'), amdaNorm_(at.c(x, 'שם')),
               at.c(x, 'מסלול'), at.c(x, 'שבוע')].join('|');
    want[key] = [at.c(x, 'מסלול'), at.c(x, 'דף')];
  }
  if (Object.keys(want).length) {
    var lt = amdaTable_(AMDA_LINK_);
    for (var l = 1; l < lt.rows.length; l++) {
      var w = want[lt.c(lt.rows[l], 'מפתח')], id = lt.c(lt.rows[l], 'מזהה');
      if (w && id) out.push([id, w[0], w[1]]);
    }
  }
  try { rc.put('amda:qz', JSON.stringify(out), 300); } catch (x2) {}
  return out;
}
function amdaQz_(alias, target) {
  var ok = {}, seen = {};
  amdaQzRaw_().forEach(function (q) {
    var canon = alias[q[0]] || q[0], tr = rafTrack_(q[1]), d = String(q[2] || '').replace(/["'׳״\s]/g, '');
    if (!canon || !tr || !d) return;
    canon = target[canon] || canon;
    ok[canon + '|' + tr + '|' + d] = 1;
    seen[canon] = 1;
  });
  return { ok: ok, seen: seen };
}
/* תנאי החידון לדף שלם: ציון 80%+ (quizDaf_, כמו קודם), או אישור
   בנוכחות. עמוד בדף מחולק — מאושר, או שהציון שלו לבדו עובר; אישור
   של עמוד אחד אינו מאשר את השני. { x: ציון או null, conf: bool } או
   null כשהתנאי לא מתקיים. */
function quizOk_(Q, A, who, tr, base) {
  var x = quizDaf_(Q, who, tr, base);
  if (quizPass_(x)) return { x: x, conf: false };
  if (!A) return null;
  var sp = tr === 'taanit' ? SHIFT_TAANIT : SHIFT_MEGILA, pre = who + '|' + tr + '|' + base;
  if (A.ok[pre]) return { x: null, conf: true };
  var hasA = !!sp.wk[base + '.'], hasB = !!sp.wk[base + ':'];
  if (!hasA && !hasB) return null;
  var pg = function (sfx) { return !!A.ok[pre + sfx] || quizPass_(Q.best[pre + sfx]); };
  var okA = !hasA || pg('.'), okB = !hasB || pg(':');
  /* לפחות עמוד אחד באישור — אחרת זה מסלול הציון של quizDaf_. */
  return okA && okB && (A.ok[pre + '.'] || A.ok[pre + ':']) ? { x: null, conf: true } : null;
}

/* ============================================================
   נקודות — לכל התלמידים, בכל המוסדות (8.99.263; עד אז אור עציון בלבד).
   ============================================================
   10 נקודות לכל דף שלם (שני העמודים, כמו rafSide_; עמוד שאין לו בן
   זוג בלוח — כמו סוף מסכת — הוא הדף כולו), עם חידון: ציון 80% ומעלה
   או אישור מפורש בנוכחות (quizOk_). **פעם אחת לאדם, מסכת ודף** — שני
   המסלולים יחד, השלמה חוזרת, מכשיר אחר או חידון חוזר אינם מוסיפים.
   הזהות — האנשים והאיחוד של ההגרלה (rafPpl_), ולכן חשבון שאוחד או
   תלמיד שדווח בנוכחות ונרשם אחר כך — יתרה אחת. הורים ובדיקה — בלי
   נקודות. לפיד — כן: ההחרגה שלו היא מההגרלה בלבד. כל העבר נכלל, ולא
   נשמר כאן דבר: הכול מחושב מחדש מהלימוד, מהחידונים ומהנוכחות.
   { v: { מזהה יעד → { n: נקודות או null ("לא ידוע"), l: [[מסכת, דף,
   ציון או 'conf']] } }, m: { מזהה שאוחד → מזהה יעד } }. ptsOf_ לקריאה.
   במטמון 5 דקות, בחלקים (כל המוסדות חורגים מגודל ערך אחד); נמחק
   בכל כתיבה שיכולה לשנות נקודות — ptsBust_. */
function ptsBust_() {
  try { CacheService.getScriptCache().removeAll(['pts:all', 'raf:me']); } catch (e) {}
}
function ptsOf_(T, id) {
  if (!T || !id) return null;
  return T.v[T.m[id] || id] || null;
}
function ptsAll_() {
  var rc = CacheService.getScriptCache(), hd = rc.get('pts:all');
  if (hd) {
    try {
      var hp = hd.split('|'), keys = [];
      for (var q = 0; q < +hp[0]; q++) keys.push('pts:all:' + hp[1] + ':' + q);
      var got = rc.getAll(keys), js0 = '';
      for (var q2 = 0; q2 < keys.length; q2++) {
        if (got[keys[q2]] == null) { js0 = null; break; }
        js0 += got[keys[q2]];
      }
      if (js0) return JSON.parse(js0);
    } catch (x0) {}
  }
  var P = rafPpl_(), ppl = P.ppl, alias = P.alias, target = P.target, who = {};
  Object.keys(ppl).forEach(function (id) {
    var to = target[id] || id, q = ppl[to];
    if (q && q.role !== 'הורה' && !q.test) who[to] = {};
  });
  var lr = sheet_(LEARN_TAB);
  var rows = lr.getLastRow() > 1 ? doneRows_(lr.getDataRange().getDisplayValues()) : [];
  if (rows && rows.length > 1) {
    var ix = {};
    for (var h = 0; h < rows[0].length; h++) ix[String(rows[0][h]).trim()] = h;
    var c = function (rw, k) { return ix[k] === undefined ? '' : String(rw[ix[k]] || '').trim(); };
    for (var i = 1; i < rows.length; i++) {
      var lid = c(rows[i], 'מזהה'), canon = alias[lid] || lid;
      canon = target[canon] || canon;
      if (!canon || !who[canon]) continue;
      var tr = rafTrack_(c(rows[i], 'מסלול')), d = c(rows[i], 'דף').replace(/["'׳״\s]/g, '');
      if (!tr || !d) continue;
      var base = d.replace(/[.:]$/, ''), k = tr + '|' + base, s = who[canon][k] = who[canon][k] || {};
      if (!/:$/.test(d)) s.a = 1;
      if (!/\.$/.test(d)) s.b = 1;
    }
  }
  var Q = quizBest_(alias, target), A = amdaQz_(alias, target), out = { v: {}, m: {} };
  Object.keys(who).forEach(function (to) {
    var l = [];
    Object.keys(who[to]).forEach(function (k) {
      var pr = k.split('|'), s = who[to][k], sp = pr[0] === 'taanit' ? SHIFT_TAANIT : SHIFT_MEGILA;
      var whole = (s.a && s.b) || (s.a && !sp.wk[pr[1] + ':']) || (s.b && !sp.wk[pr[1] + '.']);
      /* ציון ואישור — אותו דף, פעם אחת. "conf" — אושר בנוכחות, בלי ציון. */
      var ok = whole ? quizOk_(Q, A, to, pr[0], pr[1]) : null;
      if (ok) l.push([pr[0], pr[1], ok.x ? ok.x[0] + '/' + ok.x[1] : 'conf', sp.wk[pr[1]] || sp.wk[pr[1] + '.'] || 99]);
    });
    l.sort(function (x, y) { return x[3] - y[3] || (x[0] < y[0] ? -1 : 1); });
    out.v[to] = { n: Q.seen[to] || A.seen[to] ? l.length * 10 : null,
                  l: l.map(function (x) { return [x[0], x[1], x[2]]; }) };
  });
  /* כל מזהה של אותו אדם — גם חשבון שאוחד ומזהה שנבלע. */
  Object.keys(ppl).forEach(function (id) {
    var to = target[id] || id;
    if (!out.v[to]) return;
    ppl[id].ids.concat([id]).forEach(function (x) { if (x !== to) out.m[x] = to; });
  });
  try {
    var js = JSON.stringify(out), st = String(Date.now() % 1e8), put = {}, n = 0;
    for (var o = 0; o < js.length; o += 90000) put['pts:all:' + st + ':' + (n++)] = js.substr(o, 90000);
    if (n <= 40) { rc.putAll(put, 300); rc.put('pts:all', n + '|' + st, 300); }
  } catch (x2) {}
  return out;
}
/* לתלמיד עצמו, במסך הבית: עד ארבעה מזהים של המכשיר (כמו rafMe_).
   אין לו נקודות כאן (הורה, בדיקה, לא מוכר) — `none`, והמסך אינו מציג
   דבר. n: null — אין עדיין חידון או אישור שמור; לא 0 ולא כישלון. */
function ptsMe_(P) {
  var mine = String(P.id || '').split(',').map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[\w:.\-]{1,60}$/.test(x); }).slice(0, 4);
  if (!mine.length) return { status: 'ok', none: 1 };
  var T = ptsAll_();
  for (var i = 0; i < mine.length; i++) {
    var v = ptsOf_(T, mine[i]);
    if (v) return { status: 'ok', n: v.n, l: v.l };
  }
  return { status: 'ok', none: 1 };
}
/* למה אדם שסיים אינו בהגרלה — '' = בפנים (לפני בחירת המוסדות). */
function rafWhy_(p) {
  if (p.test) return 'test';
  if (p.role === 'הורה') return 'par';
  if (p.code === 'lapid') return 'lapid';
  if (!p.code || p.code === 'other') return 'other';
  return '';
}
/* הזכאים, מחושבים עכשיו מהגיליון (או מחישוב שכבר נעשה — rafPic_). */
function raffleElig_(codes, C0) {
  var C = C0 || rafCalc_(), ppl = C.ppl, done = C.done, noId = C.noId, ex = [];
  Object.keys(done).forEach(function (id) {
    var p = ppl[id];
    if (p.dup) ex.push({ kind: 'dup', text: (p.name + ' ' + p.last).trim() + ' · ' + p.dup +
                         ' חשבונות — היעד הוא האחרון שנרשם' });
  });
  var by = {}, skip = { other: 0, lapid: 0, out: 0, par: 0, test: 0 };
  codes.forEach(function (cd) { by[cd] = []; });
  Object.keys(done).forEach(function (id) {
    var p = ppl[id], why = rafWhy_(p);
    if (why) { skip[why]++; return; }
    if (!by[p.code]) { skip.out++; return; }
    by[p.code].push({ id: p.id, ids: p.ids, name: p.name, last: p.last,
                      inst: p.inst, grade: p.grade, klass: p.klass });
  });
  var nNo = Object.keys(noId).length;
  if (nNo) ex.push({ kind: 'noid', text: nNo + ' שורות סיום בלי זהות מוכרת ב"לומדים" — לא נכללו' });
  if (skip.other) ex.push({ kind: 'other', text: skip.other + ' סיימו ומוסד "אחר" או ריק — בחוץ' });
  if (skip.lapid) ex.push({ kind: 'lapid', text: skip.lapid + ' מלפיד — מסלול נפרד, בחוץ' });
  if (skip.out) ex.push({ kind: 'out', text: skip.out + ' ממוסד שלא נבחר להגרלה' });
  if (skip.par) ex.push({ kind: 'par', text: skip.par + ' הורים שסיימו — ההגרלה לתלמידים' });
  return { status: 'ok', wk: progWeek_(), cut: new Date().toISOString(), by: by, ex: ex };
}

/* ============================================================
   התמונה לפני ההגרלה — לכל מוסד: מי משתתף, מי למד, מי זכאי.
   ============================================================
   "משתתף" — תלמיד שנרשם בעצמו, או שאיש צוות דיווח עליו בנוכחות
   (גם בלי הרשמה). ייבוא רשימת תלמידים לבדו אינו השתתפות. אותו
   אדם בכמה חשבונות, או שדווח ואחר כך נרשם — אחד (rafCalc_).
   "למד" — סיים את שני העמודים של RAF_DAF באחת המסכתות. עמוד אחד
   הוא "חצי", ואינו נספר. "זכאי" — by של raffleElig_ על אותו
   חישוב, כלומר בדיוק מי שההגרלה הייתה מגרילה עכשיו.
   **קריאה בלבד:** לא שומר את בחירת המוסדות (rafSelSave_) — הבחירה
   נעשית אחרי שרואים, ונשמרת רק בהגרלה עצמה. */
function rafPic_() {
  var C = rafCalc_(), ppl = C.ppl, target = C.target, P = {};
  var lt = amdaTable_(AMDA_LINK_), rep = {}, keyId = {};
  for (var l = 1; l < lt.rows.length; l++) {
    var lid = lt.c(lt.rows[l], 'מזהה');
    if (!lid) continue;
    rep[lid] = 1;
    keyId[lt.c(lt.rows[l], 'מפתח').split('|').slice(0, 4).join('|')] = lid;
  }
  /* מזהה שנבלע בשורה אחרת ("מזהים נוספים") — אותו אדם, גם כשנשארה לו שורה משלו. */
  var add = function (id) {
    var a = C.alias[id] && ppl[C.alias[id]] ? C.alias[id] : id, to = target[a] || a, q = ppl[to];
    if (!q || q.role === 'הורה' || q.test || RAF_NEVER.indexOf(q.code) >= 0) return null;
    return P[to] = P[to] || { q: q, reg: 0, rep: 0 };
  };
  Object.keys(ppl).forEach(function (id) {
    var o = add(id);
    if (o) ppl[id].ids.forEach(function (x) {
      if (/^Am/.test(x)) o.rep = 1; else { o.reg = 1; if (rep[x]) o.rep = 1; }
    });
  });
  /* דווח בנוכחות בלי לימוד של דף (שיעור, "השתתף") — אין לו שורה
     ב"לומדים". אם השם מתאים לנרשם אחד בדיוק — זה הוא; אחרת משתתף
     שדווח בלבד. אותו מפתח כמו העמדה: מוסד|שכבה|כיתה|שם. */
  var byName = {};
  Object.keys(P).forEach(function (to) {
    var q = P[to].q, f = amdaNorm_(q.name), ln = amdaNorm_(q.last);
    if (!f || !ln) return;
    [ln + ' ' + f, f + ' ' + ln].forEach(function (nm) {
      var k = q.code + '|' + nm;
      if ((byName[k] = byName[k] || []).indexOf(to) < 0) byName[k].push(to);
    });
  });
  var at = amdaTable_(AMDA_TAB_), only = {};
  for (var r = 1; r < at.rows.length; r++) {
    var x = at.rows[r], inst = at.c(x, 'קוד ישיבה'), n = amdaNorm_(at.c(x, 'שם'));
    if (!inst || !n || RAF_NEVER.indexOf(inst) >= 0) continue;
    var g = amdaNorm_(at.c(x, 'שכבה')), k = [inst, g, at.c(x, 'כיתה'), n].join('|');
    if (keyId[k]) { var o0 = add(keyId[k]); if (o0) o0.rep = 1; continue; }
    var cand = (byName[inst + '|' + n] || []).filter(function (to) {
      var g2 = amdaNorm_(P[to].q.grade);
      return !g2 || g2 === g;
    });
    if (cand.length === 1) { P[cand[0]].rep = 1; continue; }
    if (!only[k]) only[k] = { q: { code: inst, inst: '', name: n, last: '', grade: at.c(x, 'שכבה'), klass: at.c(x, 'כיתה') },
                              reg: 0, rep: 1, id: '' };
  }
  var codes = [];
  Object.keys(P).concat(Object.keys(only)).forEach(function (k) {
    var c = (P[k] || only[k]).q.code;
    if (codes.indexOf(c) < 0) codes.push(c);
  });
  var E = raffleElig_(codes, C), inn = {}, by = {};
  codes.forEach(function (c) { (E.by[c] || []).forEach(function (p) { inn[p.id] = 1; }); });
  var put = function (to, o) {
    var q = o.q, c = q.code, ln = '', full = 0, half = 0;
    ['taanit', 'megila'].forEach(function (tr) {
      var s = to && C.side[to + '|' + tr];
      if (!s || (!s.a && !s.b)) return;
      ln += (ln ? ',' : '') + tr + ':' + (s.a ? 'a' : '') + (s.b ? 'b' : '');
      if (s.a && s.b) full = 1; else half = 1;
    });
    var b = by[c] = by[c] || { inst: '', n: 0, full: 0, half: 0, e: 0, L: [] };
    if (!b.inst && q.inst) b.inst = q.inst;
    var e = to && inn[to] ? 1 : 0;
    b.n++; b.full += full; b.half += full ? 0 : half; b.e += e;
    b.L.push([(q.name + ' ' + q.last).trim(), (q.grade || '') + (q.klass || ''),
              (o.reg ? 'r' : '') + (o.rep ? 'd' : ''), ln, e]);
  };
  Object.keys(P).forEach(function (to) { put(to, P[to]); });
  Object.keys(only).forEach(function (k) { put('', only[k]); });
  var rank = function (z) { return z[4] ? 0 : /ab/.test(z[3]) ? 1 : z[3] ? 2 : 3; };
  Object.keys(by).forEach(function (c) {
    by[c].L.sort(function (a, b2) { return rank(a) - rank(b2) || (a[0] < b2[0] ? -1 : a[0] > b2[0] ? 1 : 0); });
  });
  return { status: 'ok', wk: progWeek_(), cut: E.cut, daf: RAF_DAF,
           quiz: RAF_DAF !== RAF_NOQUIZ_DAF, by: by, ex: E.ex };
}

/* הלשונית כטבלה: כל השורות של הגרלה אחת יחד. */
function rafRead_() {
  var sh = sheet_(RAF_TAB);
  if (sh.getLastRow() < 2) return { sh: sh, ix: {}, rows: [] };
  var v = sh.getDataRange().getValues(), ix = {};
  for (var i = 0; i < v[0].length; i++) ix[String(v[0][i]).trim()] = i;
  return { sh: sh, ix: ix, rows: v, c: function (r, k) {
    return ix[k] === undefined ? '' : String(v[r][ix[k]] == null ? '' : v[r][ix[k]]);
  } };
}
/* ההגרלה האחרונה שלא בוטלה בשבוע `wk` (או של כל שבוע, בלי wk). */
function rafLast_(T, wk) {
  if (!T.rows.length) return null;
  var rid = '';
  for (var r = T.rows.length - 1; r >= 1; r--) {
    if (T.c(r, 'סטטוס') === 'בוטל') continue;
    if (wk && T.c(r, 'שבוע') !== String(wk)) continue;
    rid = T.c(r, 'מזהה הגרלה'); break;
  }
  return rid ? rafById_(T, rid) : null;
}
function rafById_(T, rid) {
  var out = null;
  for (var r = 1; r < T.rows.length; r++) {
    if (T.c(r, 'מזהה הגרלה') !== rid) continue;
    if (!out) out = { rid: rid, wk: T.c(r, 'שבוע'), cut: T.c(r, 'מועד חיתוך'),
                      by: T.c(r, 'מבצע'), st: T.c(r, 'סטטוס'), codes: T.c(r, 'מוסדות'),
                      pubAt: T.c(r, 'פורסם'), rows: [], lines: [],
                      w: rafPartGet_(T.c(r, RAF_PART_W)), g: rafPartGet_(T.c(r, RAF_PART_G)) };
    out.lines.push(r);
    out.rows.push({ code: T.c(r, 'קוד ישיבה'), inst: T.c(r, 'ישיבה'),
                    n: parseInt(T.c(r, 'זכאים'), 10) || 0,
                    win: T.c(r, 'זוכה'), wins: T.c(r, 'מזהי הזוכה'),
                    name: T.c(r, 'שם הזוכה') });
  }
  return out;
}
function rafSet_(T, d, cols) {
  d.lines.forEach(function (r) {
    cols.forEach(function (cv) {
      var i = T.ix[cv[0]];
      if (i === undefined) {
        i = T.sh.getLastColumn();
        T.sh.getRange(1, i + 1).setValue(cv[0]);
        T.ix[cv[0]] = i;
      }
      T.sh.getRange(r + 1, i + 1).setValue(cv[1]);
    });
  });
}
function rafPick_(n) {
  /* מספר אקראי מ-UUID של גוגל, ולא מ-Math.random. */
  var h = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  return parseInt(h, 16) % n;
}

/* בחירת המוסדות האחרונה של הרכז (זכאים או הגרלה) — כדי ש"אתה בתוך
   ההגרלה" (rafMe_) יסנן כמו ההגרלה עצמה. לא נבחרה מעולם — null, ואז
   כל מוסד שאינו לפיד/"אחר" נחשב בפנים, כמו קודם. */
var RAF_SEL_KEY = 'rafSel';
function rafSelSave_(codes) {
  if (!codes.length) return;
  try { PropertiesService.getScriptProperties().setProperty(RAF_SEL_KEY, codes.join(',')); } catch (x) {}
}
function rafSelGet_() {
  var v = '';
  try { v = PropertiesService.getScriptProperties().getProperty(RAF_SEL_KEY) || ''; } catch (x) { return null; }
  return v ? rafCodes_(v) : null;
}

function raffleDraw_(P) {
  var codes = rafCodes_(P.codes);
  if (!codes.length) return { status: 'error', message: 'לא נבחרו מוסדות' };
  rafSelSave_(codes);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { status: 'error', message: 'הגרלה אחרת רצה כרגע — נסו שוב בעוד דקה' };
  try {
    var T = rafRead_(), wk = progWeek_();
    /* **רענון ולחיצה כפולה אינם הגרלה נוספת.** יש הגרלה לשבוע — מחזירים אותה. */
    var had = rafLast_(T, wk);
    if (had) { had.status = 'ok'; had.again = 1; return had; }
    var E = raffleElig_(codes);
    var rid = 'R' + wk + '-' + Utilities.getUuid().slice(0, 8);
    var who = String(P.who || 'רכז').slice(0, 40);
    codes.forEach(function (cd) {
      var L = E.by[cd] || [];
      var w = L.length ? L[rafPick_(L.length)] : null;
      appendCols_(RAF_TAB, [
        ['מזהה הגרלה', rid], ['שבוע', wk], ['מועד חיתוך', E.cut], ['מבצע', who],
        ['מוסדות', codes.join(',')], ['קוד ישיבה', cd],
        ['ישיבה', L.length ? L[0].inst : ''], ['זכאים', L.length],
        ['תמונת זכאות', JSON.stringify(L.map(function (p) { return p.id; })).slice(0, 40000)],
        ['זוכה', w ? w.id : ''], ['מזהי הזוכה', w ? w.ids.join(' ') : ''],
        ['שם הזוכה', w ? (w.name + ' ' + w.last).trim() : ''],
        ['חריגים', E.ex.map(function (x) { return x.text; }).join(' | ').slice(0, 4000)],
        ['סטטוס', 'הוגרל']
      ]);
    });
    var d = rafById_(rafRead_(), rid);
    d.status = 'ok';
    return d;
  } finally { lock.releaseLock(); }
}

function raffleVoid_(P) {
  var why = String(P.why || '').trim().slice(0, 300);
  if (!why) return { status: 'error', message: 'חסרה סיבה לביטול' };
  var T = rafRead_(), d = rafById_(T, String(P.rid || ''));
  if (!d) return { status: 'error', message: 'ההגרלה לא נמצאה' };
  if (d.st === 'פורסם') return { status: 'error', message: 'התוצאה כבר פורסמה — אין ביטול מכאן' };
  rafSet_(T, d, [['סטטוס', 'בוטל'], ['סיבת ביטול', why],
                 ['בוטל', new Date().toISOString() + ' · ' + String(P.who || 'רכז').slice(0, 40)]]);
  return { status: 'ok' };
}

/* ============================================================
   כמה מכשירים יקבלו — **אותו סינון בדיוק של push-send.js**.
   ============================================================
   loadSubs: מהסוף להתחלה, `hit` (תפקיד), שורה בלי מנוי אינה נמען,
   ומכשיר (endpoint) נספר פעם אחת לפי השורה האחרונה שלו. אחריו
   applyFlt: מוסדות (`insts`, לפי קוד), מזהים (`ids`), והחרגות
   (`xids`). שינוי כאן — שינוי גם שם. */
function audCount_(o) {
  var sh = sheet_('התראות');
  if (sh.getLastRow() < 2) return { dev: 0, ppl: 0 };
  var v = sh.getDataRange().getValues(), h = {};
  for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
  if (h['מנוי'] === undefined) throw new Error('אין עמודת "מנוי" בלשונית התראות');
  if (o.role && h['תפקיד'] === undefined) throw new Error('אין עמודת "תפקיד" בלשונית התראות');
  if (o.insts && h['קוד ישיבה'] === undefined) throw new Error('אין עמודת "קוד ישיבה" בלשונית התראות');
  var g = function (r, k) { return h[k] === undefined ? '' : String(v[r][h[k]] == null ? '' : v[r][h[k]]).trim(); };
  var seen = {}, dev = 0, ppl = {};
  for (var r = v.length - 1; r >= 1; r--) {
    if (o.role) {
      var rv = g(r, 'תפקיד');
      if (o.role === 'צוות') { if (rv === 'תלמיד' || rv === 'הורה' || rv === 'אב' || !rv) continue; }
      else if (rv !== o.role) continue;
    }
    var raw = g(r, 'מנוי');
    if (!raw) continue;
    var s;
    try { s = JSON.parse(raw); } catch (e) { continue; }
    if (!s || !s.endpoint || seen[s.endpoint]) continue;
    seen[s.endpoint] = 1;
    var id = g(r, 'מזהה'), cd = g(r, 'קוד ישיבה');
    if (o.ids && o.ids.indexOf(id) < 0) continue;
    if (o.xids && o.xids.indexOf(id) >= 0) continue;
    if (o.insts && o.insts.indexOf(cd) < 0) continue;
    dev++;
    if (id) ppl[id] = 1;
  }
  return { dev: dev, ppl: Object.keys(ppl).length };
}

/* שתי הקבוצות של הפרסום: הזוכים, ושאר תלמידי המוסדות שאושרו.
   **זהויות בדיקה אינן בקהל האמיתי** — שורה ב"לומדים" עם "בדיקה: כן"
   (כל המזהים שלה) ומזהי סשן הבדיקה הפעיל מוחרגים משתי השליחות
   (`tx`). זהות בדיקה נרשמת להתראות כתלמיד של מוסד אמיתי, ובלי זה
   ההודעה הכללית הייתה מגיעה גם אליה. */
function rafAud_(d) {
  var codes = rafCodes_(d.codes), wids = [];
  d.rows.forEach(function (x) {
    String(x.wins || x.win).split(/\s+/).forEach(function (id) { if (id && wids.indexOf(id) < 0) wids.push(id); });
  });
  var t = joinTable_(), stu = {}, tx = testIds_(testSess_());
  for (var r = 1; r < t.rows.length; r++) {
    var row = t.rows[r], id = t.c(row, 'מזהה');
    if (!id) continue;
    if (t.c(row, 'בדיקה') === 'כן') {
      rowIds_(t, row).forEach(function (x) { if (tx.indexOf(x) < 0) tx.push(x); });
    }
    stu[id] = t.c(row, 'תפקיד') !== 'הורה' && t.c(row, 'בדיקה') !== 'כן' &&
              codes.indexOf(t.c(row, 'קוד ישיבה')) >= 0 && wids.indexOf(id) < 0;
  }
  var xg = wids.concat(tx.filter(function (x) { return wids.indexOf(x) < 0; }));
  var w = audCount_({ ids: wids, xids: tx });
  var g = audCount_({ insts: codes, role: 'תלמיד', xids: xg });
  var t0 = tx.length ? audCount_({ ids: tx }) : { dev: 0 };
  return { codes: codes, wids: wids, tx: tx, xg: xg,
           /* מוסדות שנבחרו ולא היה בהם זכאי — אין להם זוכה, ותלמידיהם
              מקבלים את ההודעה הכללית כמו כולם. */
           none: d.rows.filter(function (x) { return !x.win; }).map(function (x) { return x.code; }),
           test: t0.dev,
           win: { n: d.rows.filter(function (x) { return x.win; }).length, dev: w.dev, ppl: w.ppl },
           all: { n: Object.keys(stu).filter(function (k) { return stu[k]; }).length,
                  dev: g.dev, ppl: g.ppl } };
}
function rafExp_(a) { return [a.win.dev, a.all.dev, a.all.ppl].join('.'); }

/* ============================================================
   פרסום ושליחה — מצב לכל אחת משתי השליחות (8.99.266).
   ============================================================
   שלושה דברים נפרדים, ונשמרים בנפרד בשורות ההגרלה:
     · "סטטוס" = פורסם — התוצאות גלויות בעמוד ההגרלה (raffleRes_).
     · "שליחה לזוכים" / "שליחה כללית" — מצב כל הודעה, כמו בהגרלת
       הבדיקה (testPub_): none · pend (נשמר לפני הקריאה) · sent (GitHub
       קיבל לשיגור — **לא מסירה**) · fail (לא יצאה) · unk (לא ידוע) ·
       skip (אין למי — בלי זוכים).
   הנוסח שאושר נשמר עם ההגרלה, וכל ניסיון חוזר שולח **אותו נוסח, באותו
   מזהה הודעה** (`rf-<rid>-w/g`), כך שמניעת הכפל של push-send.js חלה:
   מכשיר שכבר קיבל — לא מקבל שוב.
   **ניסיון חוזר** — רק למה שלא יצא, ורק אחרי בדיקת מצב והקהל מחדש
   (`exp` — קהל שגדל מאז האישור דורש אישור חוזר). pend/unk מיושבים קודם
   מול היומן ("הודעות") והמסירות; עדיין לא ידוע — רק עם `force`. */
var RAF_PART_W = 'שליחה לזוכים', RAF_PART_G = 'שליחה כללית', RAF_TXT = 'נוסח שאושר';
function rafPartGet_(v) {
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}
function rafMid_(d, k) { return 'rf-' + d.rid + '-' + k; }
/* pend/unk — מה היומן והמסירות אומרים. הגרלה שפורסמה לפני שהיו מצבים
   (אין עמודה) — כמו "לא ידוע", ומיושבת באותה דרך. */
function rafPartFix_(d, k) {
  var o = d[k] || (d.st === 'פורסם' ? { st: 'unk' } : { st: 'none' });
  if (o.st === 'pend' || o.st === 'unk') {
    var L = testLog_(rafMid_(d, k)), D = testDlv_(rafMid_(d, k));
    if (L && L.acc !== null) o.st = L.acc ? 'sent' : 'fail';
    else if (Object.keys(D.dev).length) o.st = 'sent';
    else o.st = 'unk';
  }
  d[k] = o;
  return o;
}
function rafPartSave_(T, d) {
  rafSet_(T, d, [[RAF_PART_W, JSON.stringify(d.w || { st: 'none' })],
                 [RAF_PART_G, JSON.stringify(d.g || { st: 'none' })]]);
}
function rafPartsOut_(d) {
  return { st: d.st, pubAt: d.pubAt, w: d.w, g: d.g,
           done: !!(d.w && d.g && /^(sent|skip)$/.test(d.w.st) && d.g.st === 'sent') };
}

function rafflePub_(P) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { status: 'error', message: 'פעולה אחרת רצה כרגע — נסו שוב בעוד דקה' };
  try {
    var T = rafRead_(), d = rafById_(T, String(P.rid || ''));
    if (!d) return { status: 'error', message: 'ההגרלה לא נמצאה' };
    if (d.st === 'בוטל') return { status: 'error', message: 'ההגרלה בוטלה' };
    var first = d.st !== 'פורסם';
    if (!first) {
      ['w', 'g'].forEach(function (k) { rafPartFix_(d, k); });
      rafPartSave_(T, d);
      var o0 = rafPartsOut_(d);
      /* הכול כבר יצא — לא מציתים שוב (לחיצה כפולה, רענון). */
      if (o0.done) { o0.status = 'ok'; o0.again = 1; return o0; }
    }
    var a = rafAud_(d);
    /* **הקהל השתנה מאז שהרכז ראה אותו — אישור מחדש.** גם בניסיון חוזר. */
    if (String(P.exp || '') !== rafExp_(a)) return { status: 'changed', aud: a };
    var tx = first ? { wt: String(P.wt || '').trim(), wb: String(P.wb || '').trim(),
                       at: String(P.at || '').trim(), ab: String(P.ab || '').trim() }
                   : rafPartGet_(T.c(d.lines[0], RAF_TXT));
    if (!tx || !tx.wb || !tx.ab) return { status: 'error', message: 'חסר נוסח לאחת ההודעות' };
    if (first) {
      d.w = { st: a.wids.length ? 'none' : 'skip' }; d.g = { st: 'none' };
      d.st = 'פורסם'; d.pubAt = new Date().toISOString();
      rafSet_(T, d, [['סטטוס', 'פורסם'], ['פורסם', d.pubAt],
                     ['אישר', String(P.who || 'רכז').slice(0, 40)], [RAF_TXT, JSON.stringify(tx)]]);
      rafPartSave_(T, d);
      try { CacheService.getScriptCache().remove('raf:pub'); } catch (xc) {}
    }
    var force = String(P.force || '') === '1';
    var parts = [
      { k: 'w', go: function () {
          return ghFire_(tx.wt, tx.wb, '', '', '', 'הגרלה', 'hagrala', '', '',
                         JSON.stringify({ ids: a.wids, xids: a.tx }), false, rafMid_(d, 'w'), 'הזוכים בהגרלה'); } },
      { k: 'g', go: function () {
          return ghFire_(tx.at, tx.ab, '', '', '', 'הגרלה', 'hagrala', 'תלמיד', '',
                         JSON.stringify({ insts: a.codes, xids: a.xg }), false,
                         rafMid_(d, 'g'), 'תלמידי המוסדות שבהגרלה'); } }
    ];
    parts.forEach(function (x) {
      var o = d[x.k];
      /* בלי זוכים אין שליחה לזוכים — לעולם לא פילוח ריק (= כולם). */
      if (x.k === 'w' && !a.wids.length) { o.st = 'skip'; return; }
      if (o.st === 'sent' || o.st === 'skip') return;
      if (o.st === 'unk' && !force) return;
      o.st = 'pend'; o.at = new Date().toISOString(); o.msg = '';
      rafPartSave_(T, d);
      try {
        var r = x.go();
        /* ghFire_: 'ok' — התקבלה; דחייה עם קוד HTTP או הגדרה חסרה — לא
           יצאה; שגיאה בלי קוד (חריגה, פסק זמן) — אולי יצאה: לא ידוע. */
        o.st = r && r.status === 'ok' ? 'sent' : r && (r.code || r.status === 'denied') ? 'fail' : 'unk';
        o.msg = r && r.status !== 'ok' ? String(r.message || '') : '';
      } catch (err) { o.st = 'unk'; o.msg = String(err); }
      rafPartSave_(T, d);
    });
    var out = rafPartsOut_(d);
    out.status = 'ok';
    return out;
  } finally { lock.releaseLock(); }
}

/* בדיקת מצב — בלי שליחה: מיישב pend/unk מול היומן, מחזיר את המסירה
   בפועל לכל הודעה, ואת הקהל כפי שהוא עכשיו (לאישור ניסיון חוזר). */
function rafPst_(P) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { status: 'error', message: 'פעולה אחרת רצה כרגע — נסו שוב בעוד דקה' };
  try {
    var T = rafRead_(), d = rafById_(T, String(P.rid || ''));
    if (!d) return { status: 'error', message: 'ההגרלה לא נמצאה' };
    if (d.st !== 'פורסם') return { status: 'error', message: 'ההגרלה עוד לא פורסמה' };
    ['w', 'g'].forEach(function (k) { rafPartFix_(d, k); });
    rafPartSave_(T, d);
    var out = rafPartsOut_(d);
    out.dlv = { w: testDlv_(rafMid_(d, 'w')), g: testDlv_(rafMid_(d, 'g')) };
    if (!out.done) { out.aud = rafAud_(d); out.aud.exp = rafExp_(out.aud); }
    out.status = 'ok';
    return out;
  } finally { lock.releaseLock(); }
}

/* ============================================================
   בדיקה אליך בלבד — לפני האישור הסופי (8.99.268).
   ============================================================
   ההודעה האמיתית (כותרת ונוסח כפי שנערכו במסך), **רק למכשיר שלוחץ**:
   מסך הניהול שולח את המנוי של הדפדפן שלו (`ep`, נקרא מה-Service Worker
   שלו — רק המכשיר עצמו מחזיק אותו), השרת בודק שהמנוי רשום ב"התראות",
   והשליחה מסוננת לטביעה שלו (`subs`, כמו בהגרלת הבדיקה). לא "כל מכשירי
   הרכז" — תפקיד אינו הוכחה. לא זוהה — לא שולחים.
   בלי פרסום, בלי לגעת במצב ההגרלה, ובלי מזהה הודעה
   (`quiet`): מניעת הכפל של `rf-<rid>-w/g` לא מושפעת, ושום דבר לא נכנס
   ל"תיבה" או ל"מסירות". אין מכשיר — לא שולחים.
   הלחיצה פותחת את hagrala עם אסימון (`stk`, 6 שעות במטמון; **לא `rt`** —
   שם שמור ב-Apps Script: כל בקשה איתו מקבלת 400 מגוגל) —
   אותו עמוד ואותו מבט (זוכה / תלמיד אחר, במוסד שנבחר בתצוגה המקדימה).
   האסימון מחזיק רק מזהה הגרלה, סוג ומוסד; הנתונים נבנים מהגיליון. */
function rafSelfOut_(d, k, c) {
  var out = { status: 'ok', state: 'pub', self: 1, mine: null, me: false, others: [] };
  d.rows.forEach(function (x) {
    if (!x.win) return;
    var p = String(x.name || '').split(/\s+/);
    var o = { name: p[0] + (p.length > 1 ? ' ' + p[p.length - 1].charAt(0) + "'" : ''), inst: x.inst };
    if (x.code === c) { out.mine = o; out.me = k === 'w'; } else out.others.push(o);
  });
  return out;
}
/* המנוי הזה רשום ב"התראות" (שורה עם אותה כתובת) — כמו loadSubs ב-push-send.js. */
function rafEpOk_(ep) {
  ep = String(ep || '');
  if (!/^https:\/\/[^\s]{10,900}$/.test(ep)) return false;
  var sh = sheet_('התראות');
  if (sh.getLastRow() < 2) return false;
  var v = sh.getDataRange().getValues(), c = -1;
  for (var i = 0; i < v[0].length; i++) if (String(v[0][i]).trim() === 'מנוי') c = i;
  if (c < 0) throw new Error('אין עמודת "מנוי" בלשונית התראות');
  for (var r = v.length - 1; r >= 1; r--) {
    var raw = String(v[r][c] == null ? '' : v[r][c]).trim(), s;
    if (!raw) continue;
    try { s = JSON.parse(raw); } catch (e) { continue; }
    if (s && s.endpoint === ep) return true;
  }
  return false;
}
function rafSelf_(P) {
  var d = rafById_(rafRead_(), String(P.rid || ''));
  if (!d) return { status: 'error', message: 'ההגרלה לא נמצאה' };
  if (d.st !== 'הוגרל') return { status: 'error', message: 'הבדיקה אליך היא רק לפני הפרסום' };
  var k = String(P.k || '');
  if (k !== 'w' && k !== 'g') return { status: 'error', message: 'סוג הודעה לא מוכר' };
  var L = d.rows.filter(function (x) { return k === 'g' || x.win; }).map(function (x) { return x.code; });
  var c = String(P.code || '');
  if (L.indexOf(c) < 0) c = L[0] || '';
  if (!c) return { status: 'error', message: 'אין זוכה להציג' };
  var t = String(P.t || '').trim().slice(0, 80), b = String(P.b || '').trim().slice(0, 300);
  if (!b) return { status: 'error', message: 'חסר נוסח להודעה' };
  if (!rafEpOk_(P.ep)) return { status: 'ok', dev: 0 };
  var tok = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('raf:self:' + tok, JSON.stringify({ rid: d.rid, k: k, code: c }), 21600);
  var r = ghFire_(t, b, '', '', '', 'בדיקת הגרלה', 'hagrala?stk=' + tok, '', '',
                  JSON.stringify({ subs: [subPrint_(P.ep)] }), true, '', 'בדיקה — המכשיר שלחץ בלבד');
  if (!r || r.status !== 'ok') return { status: 'error', message: (r && r.message) || 'השליחה לא יצאה' };
  return { status: 'ok', dev: 1 };
}
/* ?raffle=selfv&stk= — מה שהלחיצה על הבדיקה פותחת. בלי אסימון תקף — כלום. */
function rafSelfView_(P) {
  var none = { status: 'ok', state: 'none' };
  var tok = String(P.stk || '');
  if (!/^[0-9a-f]{32}$/.test(tok)) return none;
  var raw = CacheService.getScriptCache().get('raf:self:' + tok), s = null;
  try { s = raw ? JSON.parse(raw) : null; } catch (x) { s = null; }
  if (!s) return none;
  var d = rafById_(rafRead_(), String(s.rid || ''));
  if (!d || d.st === 'בוטל') return none;
  return rafSelfOut_(d, s.k, s.code);
}

/* ============================================================
   בדיקה אליך בלבד — לפני הגרלה אמיתית, עם תוצאה לדוגמה (8.99.270).
   ============================================================
   ממסך בחירת המוסדות, לפני "הגרלה": אותה שליחה של rafSelf_ — רק
   למכשיר שלוחץ (`ep` רשום ב"התראות", `subs` לטביעה שלו), `quiet` בלי
   מזהה הודעה. לא זוהה — לא שולחים.
   **אין כאן הגרלה ואין נתוני אמת:** לא נקראת ולא נכתבת לשונית
   ההגרלות, ולא נשמרת בחירת המוסדות (rafSelSave_). האסימון (`stk`, שעה
   במטמון, מרחב `raf:demo:` — נפרד מ-`raf:self:`) מחזיק רק סוג הודעה,
   המוסד שבמבט (`dc`), ומוסדות שנבחרו ויש בהם זכאים (`dw`). אין בו תלמיד.
   **אין להשתמש ב-`c`, `sid` או `rt` כשם פרמטר** — שמורים, 400 מגוגל.
   העמוד (hagrala?stk=&dm=1) בונה ממנו "תלמיד לדוגמה" לכל מוסד, תחת
   התווית "דוגמה". אסימון של בדיקה אמיתית אינו נפתח כאן, ולהפך. */
function rafDemo_(P) {
  var k = String(P.k || '');
  if (k !== 'w' && k !== 'g') return { status: 'error', message: 'סוג הודעה לא מוכר' };
  var w = rafCodes_(P.dw), all = rafCodes_(P.codes);
  w.forEach(function (x) { if (all.indexOf(x) < 0) all.push(x); });
  if (!all.length) return { status: 'error', message: 'לא נבחרו מוסדות' };
  var L = k === 'w' ? w : all, c = String(P.dc || '');
  if (L.indexOf(c) < 0) c = L[0] || '';
  if (!c) return { status: 'error', message: 'אין מוסד עם זכאים להציג' };
  var t = String(P.t || '').trim().slice(0, 80), b = String(P.b || '').trim().slice(0, 300);
  if (!b) return { status: 'error', message: 'חסר נוסח להודעה' };
  if (!rafEpOk_(P.ep)) return { status: 'ok', dev: 0 };
  var tok = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('raf:demo:' + tok, JSON.stringify({ k: k, c: c, w: w }), 3600);
  var r = ghFire_(t, b, '', '', '', 'בדיקת הגרלה', 'hagrala?stk=' + tok + '&dm=1', '', '',
                  JSON.stringify({ subs: [subPrint_(P.ep)] }), true, '', 'דוגמה לפני הגרלה — המכשיר שלחץ בלבד');
  if (!r || r.status !== 'ok') return { status: 'error', message: (r && r.message) || 'השליחה לא יצאה' };
  return { status: 'ok', dev: 1 };
}
/* ?raffle=demov&stk= — מה שהלחיצה על הדוגמה פותחת. בלי אסימון תקף — כלום. */
function rafDemoView_(P) {
  var none = { status: 'ok', state: 'none' };
  var tok = String(P.stk || '');
  if (!/^[0-9a-f]{32}$/.test(tok)) return none;
  var raw = CacheService.getScriptCache().get('raf:demo:' + tok), s = null;
  try { s = raw ? JSON.parse(raw) : null; } catch (x) { s = null; }
  if (!s || (s.k !== 'w' && s.k !== 'g')) return none;
  var w = rafCodes_((s.w || []).join(','));
  return { status: 'ok', state: 'demo', k: s.k, c: rafCodes_(s.c)[0] || '', w: w };
}

/* התוצאה לתלמיד. רק מה שפורסם, ורק למי שזוהה כתלמיד של מוסד
   שהשתתף. כל דבר אחר — "none", בלי לומר למה. */
function raffleRes_(P) {
  var none = { status: 'ok', state: 'none' };
  /* סשן בדיקה מאומת (מזהה + אסימון שהשרת הנפיק) — התוצאה של הגרלת
     הבדיקה, רק למזהה מהסשן. מזהה בכתובת לבדו אינו פותח דבר. */
  if (P.tsid || P.ttok) return testOk_(P) ? testRes_(P) : none;
  var inst = String(P.inst || '').trim();
  if (!inst || RAF_NEVER.indexOf(inst) >= 0) return none;
  var mine = String(P.id || '').split(',').map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[\w:.\-]{1,60}$/.test(x); }).slice(0, 4);
  if (!mine.length) return none;
  var rc = CacheService.getScriptCache(), T = null, d = null, hit = rc.get('raf:pub');
  if (hit) { try { d = JSON.parse(hit); } catch (x) { d = null; } }
  if (!d) {
    T = rafRead_();
    var p = null;
    for (var r = T.rows.length - 1; r >= 1; r--) {
      if (T.c(r, 'סטטוס') === 'פורסם') { p = rafById_(T, T.c(r, 'מזהה הגרלה')); break; }
    }
    d = p ? { codes: p.codes, rows: p.rows } : { codes: '', rows: [] };
    try { rc.put('raf:pub', JSON.stringify(d), 60); } catch (x2) {}
  }
  if (!d.rows.length || rafCodes_(d.codes).indexOf(inst) < 0) return none;
  var ck = 'raf:r:' + inst + ':' + mine.join(','), c0 = rc.get(ck);
  if (c0) { try { return JSON.parse(c0); } catch (x3) {} }
  /* הזהות: אחד המזהים שייך לתלמיד של המוסד הזה. */
  var t = joinTable_(), ok = false, myIds = [];
  for (var i = 0; i < mine.length && !ok; i++) {
    var rr = rowOfId_(t, mine[i]);
    if (rr < 1) continue;
    var row = t.rows[rr];
    if (t.c(row, 'קוד ישיבה') === inst && t.c(row, 'תפקיד') !== 'הורה') { ok = true; myIds = rowIds_(t, row); }
  }
  if (!ok) { try { rc.put(ck, JSON.stringify(none), 120); } catch (x4) {} return none; }
  var show = function (x) {
    var p = String(x.name || '').split(/\s+/);
    return { name: p[0] + (p.length > 1 ? ' ' + p[p.length - 1].charAt(0) + "'" : ''), inst: x.inst };
  };
  var out = { status: 'ok', state: 'pub', mine: null, me: false, others: [] };
  d.rows.forEach(function (x) {
    if (!x.win) return;
    if (x.code === inst) {
      out.mine = show(x);
      out.me = String(x.wins || x.win).split(/\s+/).some(function (w) { return myIds.indexOf(w) >= 0; });
    } else out.others.push(show(x));
  });
  try { rc.put(ck, JSON.stringify(out), 120); } catch (x5) {}
  return out;
}

/* ============================================================
   ?quizSum=1&key= — כמה ענו על החידון של השבוע, לכל מסכת (8.99.254).
   ============================================================
   מהלשונית "חידות". שורה שייכת לשבוע לפי "שבוע" (taanit-2); שורה
   בלי שבוע (תשובה לשאלה בדף) — לפי "דף", כשהוא הדף של השבוע.
   · תלמידים ייחודיים — מזהים שונים שהגיבו (לא שורות).
   · הגשות מלאות — שלחו את החידון בסוף הדף ("החידון כולו") עם תשובה
     לכל השאלות (תשובה = n/n).
   הספירה: תלמידים בלבד. הורים, חשבונות בדיקה ולפיד — בחוץ, ונספרים
   בנפרד; מזהה שאינו ב"לומדים" — בחוץ. בלי שמות: מספרים לפי מוסד. */
function quizSum_() {
  var wk = progWeek_(), t = joinTable_(), alias = aliasMap_(t.rows), who = {};
  for (var r = 1; r < t.rows.length; r++) {
    var row = t.rows[r], id = t.c(row, 'מזהה');
    if (!id) continue;
    who[id] = { code: t.c(row, 'קוד ישיבה'), inst: t.c(row, 'ישיבה'), role: t.c(row, 'תפקיד'),
                test: t.c(row, 'בדיקה') === 'כן' };
  }
  var M = [['taanit', SHIFT_TAANIT], ['megila', SHIFT_MEGILA]].map(function (x) {
    var base = '';
    for (var k in x[1].wk) if (x[1].wk.hasOwnProperty(k) && x[1].wk[k] === wk) { base = k.replace(/[.:]$/, ''); break; }
    return { mas: x[0], sp: x[1], wk: wk, base: base, ids: {}, full: {}, by: {}, par: {}, test: {}, lapid: {}, unk: {} };
  });
  var sh = sheet_('חידות'), v = sh.getLastRow() > 1 ? sh.getDataRange().getDisplayValues() : [], ix = {};
  if (v.length) for (var h = 0; h < v[0].length; h++) ix[String(v[0][h]).trim()] = h;
  var c = function (rw, k) { return ix[k] === undefined ? '' : String(rw[ix[k]] || '').trim(); };
  for (var i = 1; i < v.length; i++) {
    var w = c(v[i], 'שבוע'), d = c(v[i], 'דף'), tr = '', inWk = false, m;
    if (w && (m = w.match(/^(.+)-(\d+)$/))) { tr = rafTrack_(m[1]); inWk = +m[2] === wk; }
    else if (d) {
      var pr = d.split('|'), dk = String(pr[1] || '').replace(/["'׳״\s]/g, '');
      tr = rafTrack_(pr[0]);
      var U0 = tr ? M[tr === 'taanit' ? 0 : 1] : null;
      inWk = !!(U0 && U0.base && dk.replace(/[.:]$/, '') === U0.base && (!/[.:]$/.test(dk) || U0.sp.wk[dk] === wk));
    }
    if (!tr || !inWk) continue;
    var U = M[tr === 'taanit' ? 0 : 1], mid = c(v[i], 'מזהה'), cid = alias[mid] || mid, p = who[cid];
    if (!cid) continue;
    if (!p) { U.unk[cid] = 1; continue; }
    if (p.test) { U.test[cid] = 1; continue; }
    if (p.role === 'הורה') { U.par[cid] = 1; continue; }
    if (p.code === 'lapid') { U.lapid[cid] = 1; continue; }
    var b = U.by[p.code || '-'] = U.by[p.code || '-'] || { code: p.code, inst: p.inst, ids: {}, full: {} };
    U.ids[cid] = 1; b.ids[cid] = 1;
    var an = c(v[i], 'תשובה').match(/^(\d+)\s*\/\s*(\d+)$/);
    if (c(v[i], 'קטע') === 'החידון כולו' && an && +an[2] > 0 && +an[1] === +an[2]) { U.full[cid] = 1; b.full[cid] = 1; }
  }
  var n = function (o) { return Object.keys(o).length; };
  return { status: 'ok', wk: wk, mas: M.map(function (U) {
    return { mas: U.mas, wk: U.wk, n: n(U.ids), full: n(U.full),
             out: { par: n(U.par), test: n(U.test), lapid: n(U.lapid), unk: n(U.unk) },
             by: Object.keys(U.by).map(function (k) { var b = U.by[k]; return { code: b.code, inst: b.inst, n: n(b.ids), full: n(b.full) }; })
                   .sort(function (a, b2) { return b2.n - a.n; }) };
  }) };
}

/* ?raffle=me&id=&inst= — לתלמיד עצמו, לכרטיס "המסלול שלך": כמה מדף
   ההגרלה (RAF_DAF) סיים, והאם הוא בתוך ההגרלה — מ-rafCalc_ ו-rafWhy_,
   כמו בניהול. "בפנים" = סיים את שני העמודים, תלמיד של מוסד שבתוכנית,
   ומוסד שבבחירה האחרונה של הרכז (rafSelGet_), אם הייתה.
   החישוב לכולם נשמר במטמון 5 דקות; מזהה ממוסד אחר — כמו שאינו קיים. */
function rafMe_(P) {
  var inst = String(P.inst || '').trim(), none = { status: 'ok', daf: RAF_DAF, a: false, b: false, inn: false };
  var mine = String(P.id || '').split(',').map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[\w:.\-]{1,60}$/.test(x); }).slice(0, 4);
  if (!inst || !mine.length) return none;
  var rc = CacheService.getScriptCache(), M = null, hit = rc.get('raf:me');
  if (hit) { try { M = JSON.parse(hit); } catch (x) { M = null; } }
  if (!M) {
    var C = rafCalc_();
    M = {};
    Object.keys(C.ppl).forEach(function (id) {
      var p = C.ppl[id], to = C.target[id] || id, q = C.ppl[to] || p, a = false, b = false;
      ['taanit', 'megila'].forEach(function (tr) {
        var sd = C.side[to + '|' + tr];
        /* המסכת שבה התקדם יותר — זו שמוצגת. */
        if (sd && ((sd.a ? 1 : 0) + (sd.b ? 1 : 0)) > ((a ? 1 : 0) + (b ? 1 : 0))) { a = !!sd.a; b = !!sd.b; }
      });
      if (!a && !b) return;
      /* '~' — סיים, אבל חשבון בדיקה. נספר כ"בפנים" רק לבקשה מסשן
         בדיקה מאומת (testOk_), ולעולם לא בהגרלה האמיתית. */
      var v = q.code + '|' + (a ? 'a' : '') + (b ? 'b' : '') +
              (C.done[to] && !rafWhy_(q) ? '+' : C.done[to] && rafWhy_(q) === 'test' ? '~' : '');
      p.ids.concat([id]).forEach(function (x) { M[x] = v; });
    });
    try { var js = JSON.stringify(M); if (js.length < 95000) rc.put('raf:me', js, 300); } catch (x2) {}
  }
  /* המוסדות שהרכז בחר — אותו סינון כמו raffleElig_ (`by[p.code]`). */
  var sel = rafSelGet_();
  var tst = testOk_(P) ? testSess_() : null;
  for (var i = 0; i < mine.length; i++) {
    var v2 = M[mine[i]];
    if (!v2) continue;
    var pr = v2.split('|');
    if (pr[0] !== inst) continue;
    var plus = pr[1].indexOf('+') >= 0 || (pr[1].indexOf('~') >= 0 && tst && testIds_(tst).indexOf(mine[i]) >= 0);
    return { status: 'ok', daf: RAF_DAF, a: pr[1].indexOf('a') >= 0, b: pr[1].indexOf('b') >= 0,
             inn: plus && (!sel || sel.indexOf(pr[0]) >= 0) };
  }
  return none;
}

function raffleRoute_(e) {
  var P = e.parameter, op = String(P.raffle);
  /* **אין להבריח קהל בדיקה להגרלה האמיתית.** פרמטרי סשן בדיקה,
     מכשירים או מזהי נמענים — סירוב בכל נתיב שאינו תוצאה/מצב תלמיד.
     הבדיקה עוברת רק ב-testRoute_. */
  if (op !== 'res' && op !== 'me' && (P.tsid || P.ttok || P.subs || P.ids || P.devs)) {
    return reply_(e, { status: 'denied', message: 'פרמטרי בדיקה אינם מתקבלים בהגרלה האמיתית' });
  }
  try {
    if (op === 'res') return reply_(e, raffleRes_(P));
    if (op === 'me') return reply_(e, rafMe_(P));
    if (op === 'selfv') return reply_(e, rafSelfView_(P));
    if (op === 'demov') return reply_(e, rafDemoView_(P));
    if (!READ_KEY || String(P.key || '') !== READ_KEY) return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    if (op === 'pic') {
      var pc = rafPic_();
      /* "בדיקה אליך בלבד" לפני ההגרלה — 1 רק כשהמנוי של הדפדפן שלוחץ רשום. */
      pc.me = 0;
      try { pc.me = rafEpOk_(P.ep) ? 1 : 0; } catch (eP) {}
      return reply_(e, pc);
    }
    if (op === 'elig') { rafSelSave_(rafCodes_(P.codes)); return reply_(e, raffleElig_(rafCodes_(P.codes))); }
    if (op === 'state') {
      var T = rafRead_(), d = rafLast_(T, progWeek_());
      if (d) d.ex = T.c(d.lines[0], 'חריגים');
      return reply_(e, { status: 'ok', wk: progWeek_(), d: d });
    }
    if (op === 'draw') return reply_(e, raffleDraw_(P));
    if (op === 'void') return reply_(e, raffleVoid_(P));
    if (op === 'aud') {
      var d2 = rafById_(rafRead_(), String(P.rid || ''));
      if (!d2) return reply_(e, { status: 'error', message: 'ההגרלה לא נמצאה' });
      var a = rafAud_(d2);
      a.exp = rafExp_(a); a.status = 'ok';
      /* "בדיקה אליך בלבד" — 1 רק כשהמנוי של הדפדפן שלוחץ רשום. כישלון — לא זוהה. */
      a.me = 0;
      try { a.me = rafEpOk_(P.ep) ? 1 : 0; } catch (eM) {}
      return reply_(e, a);
    }
    if (op === 'pub') return reply_(e, rafflePub_(P));
    if (op === 'pst') return reply_(e, rafPst_(P));
    if (op === 'self') return reply_(e, rafSelf_(P));
    if (op === 'demo') return reply_(e, rafDemo_(P));
    return reply_(e, { status: 'error', message: 'פעולה לא מוכרת' });
  } catch (err) {
    return reply_(e, { status: 'error', message: String(err) });
  }
}

/* "כמה זה יגיע" לעורך ההודעות — אותו audCount_ שהפרסום משתמש בו.
   ?sayCount=1&insts=a,b&role=תלמיד&key= */
function sayCount_(e) {
  var P = e.parameter;
  if (!READ_KEY || String(P.key || '') !== READ_KEY) return reply_(e, { status: 'denied', message: 'אין הרשאה' });
  try {
    var o = {};
    var ins = String(P.insts || '').split(',').map(function (x) { return x.trim(); })
      .filter(function (x) { return /^[a-z]{2,20}$/.test(x); });
    if (ins.length) o.insts = ins;
    if (P.role) o.role = String(P.role);
    var c = audCount_(o);
    return reply_(e, { status: 'ok', dev: c.dev, ppl: c.ppl });
  } catch (err) {
    return reply_(e, { status: 'error', message: String(err) });
  }
}

/* ============================================================
   מצב בדיקה לבעלים — סשן מבודד (8.99.256).
   ============================================================
   הבעלים עובר בעצמו, מהטלפון שלו, את מסלול התלמיד ואת מסלול
   ההורה, ובודק את צינור ההגרלה עד ההתראה — בלי לגעת בנתוני אמת.

   **ההרשאה כאן, בשרת.** כל פעולה ניהולית (יצירה, אישור מכשירים,
   הגרלת בדיקה, פרסום, מחיקה) דורשת READ_KEY — הסיסמה שאצל הבעלים
   בלבד. `df:tester` במכשיר הוא דגל תצוגה ונתונים בלבד, והשרת אינו
   מתחשב בו לאישור דבר.

   **הסשן** (Script Properties `testSess`, אחד בכל רגע): מזהה, אסימון
   סודי שהשרת הנפיק, שלוש זהויות דמה — שני תלמידים (א — הזוכה, ב —
   הלא־זוכה) והורה — עם שם וטלפון פיקטיביים שהשרת יצר (קידומת 000,
   שאינה מספר אמיתי, ולכן איחוד החשבונות לפי טלפון+שם לא ימזג אותן
   עם אדם אמיתי), המזהים שנרשמו בפועל, המכשירים שאושרו, והגרלת
   הבדיקה. לא כל שורה עם "בדיקה: כן" שייכת לסשן — רק המזהים שבו.

   **הגרלת הבדיקה** אינה נוגעת בלשונית "הגרלות": מזהה וסטטוס משלה
   בתוך הסשן, בלי rafLast_, בלי חסימת ההגרלה השבועית. הפרסום עובר
   באותו ghFire_ ובאותו צינור התראות — אבל רק למזהי הסשן, ורק
   למכשירים שאושרו (`subs` בפילוח; push-send.js מסנן לפיו). אם
   נמצא מכשיר של מזהה מהסשן שלא אושר — סירוב, לא שליחה חלקית.

   **מחיקה** — רק לפי מזהי הסשן שהשרת מחזיק: שורות שלהם ב"לומדים"
   (עם "בדיקה: כן"), "לימוד", "חידות", "התראות", "זוגות", "תיבה"
   (רק כשכל הנמענים בשורה מהסשן), "ממתינים לדף", והיומן והמסירות
   של הגרלת הבדיקה. לא בודקים אחרים, לא כל שורות הבדיקה, ולא שום
   רשומת אמת. מחזירה את מצב ההגרלה האמיתית לפני ואחרי. */
var TEST_SLOTS_ = [
  { k: 'a', role: 'תלמיד', first: 'בדיקה', last: 'תלמיד' },
  { k: 'b', role: 'תלמיד', first: 'דוגמה', last: 'תלמיד' },
  { k: 'p', role: 'הורה',  first: 'בדיקה', last: 'הורה' }
];
function testSess_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('testSess') || 'null'); }
  catch (e) { return null; }
}
function testSave_(S) {
  var pp = PropertiesService.getScriptProperties();
  if (S) pp.setProperty('testSess', JSON.stringify(S)); else pp.deleteProperty('testSess');
}
/* מזהה + אסימון תואמים לסשן הפעיל. */
function testOk_(P) {
  var S = testSess_();
  return !!(S && P && String(P.tsid || '') === S.sid && String(P.ttok || '') === S.tok);
}
function testIds_(S) {
  var out = [];
  (S && S.slots || []).forEach(function (x) { if (x.id) out.push(x.id); });
  return out;
}
function testSlot_(S, k) {
  var o = null;
  (S && S.slots || []).forEach(function (x) { if (x.k === k) o = x; });
  return o;
}
function testDigits_(v) { return String(v || '').replace(/\D/g, ''); }
/* מה שהמסך צריך — בלי האסימון. */
function testView_(S) {
  if (!S) return { status: 'ok', on: false };
  return { status: 'ok', on: true, sid: S.sid, inst: S.inst, at: S.at,
           slots: S.slots.map(function (x) {
             return { k: x.k, role: x.role, first: x.first, last: x.last, phone: x.phone,
                      id: x.id || '', dev: (S.devBy && S.devBy[x.k]) || 0 };
           }),
           devs: (S.devs || []).length, raf: S.raf || null };
}
/* המכשירים של מזהים — בדיוק כמו push-send.js: מהשורה האחרונה
   לראשונה, מנוי אחד לכל endpoint, ורק אז הסינון. */
function testSubs_(ids, role) {
  var sh = sheet_('התראות');
  if (sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = {};
  for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
  if (h['מנוי'] === undefined) throw new Error('אין עמודת "מנוי" בלשונית התראות');
  var g = function (r, k) { return h[k] === undefined ? '' : String(v[r][h[k]] == null ? '' : v[r][h[k]]).trim(); };
  var seen = {}, out = [];
  for (var r = v.length - 1; r >= 1; r--) {
    var raw = g(r, 'מנוי');
    if (!raw) continue;
    var s;
    try { s = JSON.parse(raw); } catch (e) { continue; }
    if (!s || !s.endpoint || seen[s.endpoint]) continue;
    seen[s.endpoint] = 1;
    if (ids.indexOf(g(r, 'מזהה')) < 0) continue;
    if (role && g(r, 'תפקיד') !== role) continue;
    out.push(subPrint_(s.endpoint));
  }
  return out;
}
/* קהל הבדיקה, ובדיקת "כשל סגור": כל מכשיר — מאושר בסשן. */
function testAud_(S) {
  var R = S.raf;
  var w = testSubs_([R.win], ''), g = testSubs_([R.lose], 'תלמיד');
  var bad = w.concat(g).filter(function (p) { return (S.devs || []).indexOf(p) < 0; });
  return { w: w, g: g, bad: bad.length };
}
function testRes_(P) {
  var S = testSess_(), none = { status: 'ok', state: 'none' };
  var mine = String(P.id || '').split(',').map(function (x) { return x.trim(); });
  var ids = testIds_(S);
  if (!S || !S.raf || S.raf.st !== 'פורסם' || !mine.some(function (x) { return ids.indexOf(x) >= 0; })) return none;
  var win = testSlot_(S, 'a');
  return { status: 'ok', state: 'pub', test: 1,
           mine: { name: win.first + ' ' + win.last.charAt(0) + "'", inst: S.instName || S.inst },
           me: mine.indexOf(S.raf.win) >= 0, others: [] };
}
/* מחיקת שורות לפי תנאי — מהסוף להתחלה, כדי שמספרי השורות לא יזוזו. */
function testDel_(tab, keep) {
  var sh;
  try { sh = sheet_(tab); } catch (e) { return 0; }
  if (!sh || sh.getLastRow() < 2) return 0;
  var v = sh.getDataRange().getDisplayValues(), h = {}, n = 0;
  for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
  var g = function (r, k) { return h[k] === undefined ? '' : String(v[r][h[k]] || '').trim(); };
  for (var r = v.length - 1; r >= 1; r--) {
    if (keep(function (k) { return g(r, k); })) continue;
    sh.deleteRow(r + 1); n++;
  }
  return n;
}
function testEnd_(S) {
  var ids = testIds_(S), out = {}, mids = S.raf ? ['trf-' + S.raf.rid + '-w', 'trf-' + S.raf.rid + '-g'] : [];
  var real0 = rafLast_(rafRead_(), progWeek_());
  var mineId = function (g) { return ids.indexOf(g('מזהה')) >= 0; };
  if (ids.length) {
    /* "לומדים" — רק שורה של מזהה מהסשן, ורק אם היא מסומנת כבדיקה. */
    out['לומדים'] = testDel_(JOIN_TAB, function (g) { return !(mineId(g) && g('בדיקה') === 'כן'); });
    ['לימוד', 'חידות', 'התראות', 'זוגות', 'ממתינים לדף'].forEach(function (t) {
      out[t] = testDel_(t, function (g) { return !mineId(g); });
    });
    out['תיבה'] = testDel_('תיבה', function (g) {
      var to = g('מזהים').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      return !(to.length && to.every(function (x) { return ids.indexOf(x) >= 0; }));
    });
  }
  if (mids.length) {
    ['הודעות', 'מסירות'].forEach(function (t) {
      out[t] = testDel_(t, function (g) { return mids.indexOf(g('מזהה הודעה')) < 0; });
    });
  }
  testSave_(null);
  try {
    CacheService.getScriptCache().removeAll(['raf:me', 'pts:all', 'amda:qz', 'inbox:rows', 'raf:pub']);
  } catch (e) {}
  try { recount_(); } catch (e2) {}
  try { recountLearn_(true); } catch (e3) {}
  var real1 = rafLast_(rafRead_(), progWeek_());
  var sig = function (d) { return d ? d.rid + '|' + d.st + '|' + d.lines.length : ''; };
  return { status: 'ok', del: out, realSame: sig(real0) === sig(real1), real: sig(real1) };
}

/* ============================================================
   פרסום הגרלת הבדיקה — מצב לכל אחת משתי השליחות (8.99.257).
   ============================================================
   לכל שליחה (w — הזוכה, g — הלא־זוכה) מצב משלה:
     none — לא התחילה · pend — בדרך (נשמר לפני הקריאה) · sent — GitHub
     קיבל את בקשת השיגור · fail — נדחתה · unk — לא ידוע.
   "sent" **אינו מסירה**: המסירה בפועל — ב"מסירות" וביומן (testDlv_).
   "פורסם" רק כששתיהן sent; אחרת "חלקי"/"נכשל"/"לא ידוע" — והלקוח
   מקבל את שני המצבים.

   **ניסיון חוזר** — רק למה שלא יצא, באותו סשן, לאותם מזהי דמה ולמכשירים
   שאושרו (הקהל נבדק שוב — מכשיר שלא אושר עוצר הכול), ובאותו מזהה
   הודעה קבוע (`trf-<rid>-w/g`), כך שמניעת הכפל של push-send.js חלה.
   שליחה במצב pend/unk מיושבת קודם מול היומן ("הודעות") והמסירות:
   נמצאה — sent/fail לפיהן; לא נמצאה — נשארת "לא ידוע", ונשלחת שוב רק
   בבקשה מפורשת (`force`), עדיין באותו מזהה. */
function testMid_(S, k) { return 'trf-' + S.raf.rid + '-' + k; }
function testTouched_(R) {
  return ['w', 'g'].some(function (k) { return R[k] && R[k].st && R[k].st !== 'none' && R[k].st !== 'fail'; });
}
/* השורה האחרונה ביומן לאותו מזהה הודעה. */
function testLog_(mid) {
  var sh = sheet_('הודעות');
  if (sh.getLastRow() < 2) return null;
  var v = sh.getDataRange().getDisplayValues(), h = {};
  for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
  var g = function (r, k) { return h[k] === undefined ? '' : String(v[r][h[k]] || '').trim(); };
  for (var r = v.length - 1; r >= 1; r--) {
    if (g(r, 'מזהה הודעה') !== mid) continue;
    var res = g(r, 'תוצאה'), st = g(r, 'סטטוס שליחה'), got = g(r, 'קיבלו');
    /* נכשלה כבר בכתיבה, ואין דיווח ריצה (קיבלו ריק): דחייה מפורשת של
       GitHub או הגדרה חסרה — לא יצאה (false); חריגה/פסק זמן — אולי
       יצאה, לא ידוע (null). */
    var acc = true;
    if (st === 'נכשל' && got === '' && /^נכשלה/.test(res)) {
      acc = /^נכשלה: (GitHub החזיר|לא הוגדר)/.test(res) ? false : null;
    }
    return { acc: acc, res: res, st: st, got: got };
  }
  return null;
}
/* המסירה בפועל — המצב האחרון של כל מכשיר ב"מסירות". */
function testDlv_(mid) {
  var out = { log: testLog_(mid), dev: {} };
  try {
    var sh = sheet_('מסירות');
    if (sh.getLastRow() > 1) {
      var v = sh.getDataRange().getDisplayValues(), h = {}, last = {};
      for (var i = 0; i < v[0].length; i++) h[String(v[0][i]).trim()] = i;
      for (var r = 1; r < v.length; r++) {
        if (String(v[r][h['מזהה הודעה']] || '').trim() !== mid) continue;
        var stt = String(v[r][h['מצב']] || '').trim();
        String(v[r][h['מכשירים']] || '').split(',').forEach(function (p) { if (p) last[p.trim()] = stt; });
      }
      Object.keys(last).forEach(function (p) { out.dev[last[p]] = (out.dev[last[p]] || 0) + 1; });
    }
  } catch (e) {}
  return out;
}
function testPub_(S, P) {
  if (!S.raf) return { status: 'error', message: 'אין הגרלת בדיקה' };
  var R = S.raf;
  R.w = R.w || { st: 'none' }; R.g = R.g || { st: 'none' };
  if (R.st === 'פורסם') return { status: 'ok', again: 1, done: true, w: R.w, g: R.g, raf: R };
  /* כשל סגור — לפני כל שליחה, גם בניסיון חוזר. */
  var A2 = testAud_(S);
  if (A2.bad) return { status: 'denied', message: 'יש מכשיר של זהות בדיקה שלא אושר — אשרו את המכשירים שוב' };
  if (!A2.w.length || !A2.g.length) return { status: 'denied', message: 'לאחד מתלמידי הבדיקה אין מכשיר מאושר עם התראות' };
  var tW = String(P.wt || '').trim(), bW = String(P.wb || '').trim();
  var tA = String(P.at || '').trim(), bA = String(P.ab || '').trim();
  if (!bW || !bA) return { status: 'error', message: 'חסר נוסח לאחת ההודעות' };
  var force = String(P.force || '') === '1';
  var parts = [
    { k: 'w', go: function () { return ghFire_(tW, bW, '', '', '', 'הגרלת בדיקה', 'hagrala', '', '',
        JSON.stringify({ ids: [R.win], subs: A2.w }), false, testMid_(S, 'w'), 'בדיקה — זוכה'); } },
    { k: 'g', go: function () { return ghFire_(tA, bA, '', '', '', 'הגרלת בדיקה', 'hagrala', 'תלמיד', '',
        JSON.stringify({ ids: [R.lose], subs: A2.g }), false, testMid_(S, 'g'), 'בדיקה — לא זוכה'); } }
  ];
  parts.forEach(function (x) {
    var o = R[x.k];
    /* מיישבים מה שלא ידוע — מול היומן והמסירות. */
    if (o.st === 'pend' || o.st === 'unk') {
      var L = testLog_(testMid_(S, x.k)), D = testDlv_(testMid_(S, x.k));
      if (L && L.acc !== null) o.st = L.acc ? 'sent' : 'fail';
      else if (Object.keys(D.dev).length) o.st = 'sent';
      else o.st = 'unk';
    }
    if (o.st === 'sent') return;
    if (o.st === 'unk' && !force) return;
    o.st = 'pend'; o.at = new Date().toISOString(); o.msg = '';
    testSave_(S);
    try {
      var r = x.go();
      /* ghFire_: 'ok' — התקבלה; דחייה עם קוד HTTP או הגדרה חסרה — לא
         יצאה; שגיאה בלי קוד (חריגה, פסק זמן) — אולי יצאה: לא ידוע. */
      o.st = r && r.status === 'ok' ? 'sent' : r && (r.code || r.status === 'denied') ? 'fail' : 'unk';
      o.msg = r && r.status !== 'ok' ? String(r.message || '') : '';
    } catch (err) { o.st = 'unk'; o.msg = String(err); }
    testSave_(S);
  });
  var n = function (st) { return (R.w.st === st ? 1 : 0) + (R.g.st === st ? 1 : 0); };
  R.st = n('sent') === 2 ? 'פורסם' : n('unk') || n('pend') ? 'לא ידוע' : n('sent') ? 'חלקי' : 'נכשל';
  if (R.st === 'פורסם') R.pubAt = new Date().toISOString();
  testSave_(S);
  try { CacheService.getScriptCache().remove('raf:me'); } catch (xc) {}
  return { status: 'ok', done: R.st === 'פורסם', w: R.w, g: R.g, raf: R };
}

function testRoute_(e) {
  var P = e.parameter, op = String(P.test);
  try {
    /* ---- בלי סיסמה: רק עם האסימון של הסשן ---- */
    if (op === 'who') {
      if (!testOk_(P)) return reply_(e, { status: 'denied', message: 'הסשן אינו פעיל' });
      var S0 = testSess_(), x0 = testSlot_(S0, String(P.slot || ''));
      if (!x0) return reply_(e, { status: 'error', message: 'אין זהות כזו בסשן' });
      return reply_(e, { status: 'ok', slot: { k: x0.k, role: x0.role, first: x0.first, last: x0.last,
                                               phone: x0.phone, inst: S0.inst, id: x0.id || '' } });
    }
    if (op === 'add') {
      if (!testOk_(P)) return reply_(e, { status: 'denied', message: 'הסשן אינו פעיל' });
      var lk = LockService.getScriptLock();
      if (!lk.tryLock(15000)) return reply_(e, { status: 'error', message: 'נסו שוב בעוד רגע' });
      try {
        var S1 = testSess_(), x1 = testSlot_(S1, String(P.slot || '')), id1 = String(P.id || '').trim();
        if (!x1 || !/^[\w:.\-]{1,60}$/.test(id1)) return reply_(e, { status: 'error', message: 'חסר מזהה' });
        /* השורה ב"לומדים" — בדיקה, ובדיוק הטלפון והשם הפיקטיביים של
           הזהות. כך אף זהות אמיתית לא נכנסת לסשן. */
        var t1 = joinTable_(), r1 = rowOfId_(t1, id1);
        if (r1 < 1) return reply_(e, { status: 'wait' });
        var row1 = t1.rows[r1];
        if (t1.c(row1, 'בדיקה') !== 'כן' || testDigits_(t1.c(row1, 'טלפון')) !== testDigits_(x1.phone) ||
            t1.c(row1, 'שם') !== x1.first || t1.c(row1, 'משפחה') !== x1.last) {
          return reply_(e, { status: 'denied', message: 'השורה אינה של זהות הבדיקה' });
        }
        x1.id = id1;
        if (!S1.instName) S1.instName = t1.c(row1, 'ישיבה');
        testSave_(S1);
        return reply_(e, { status: 'ok' });
      } finally { lk.releaseLock(); }
    }

    /* ---- כל השאר: הבעלים בלבד ---- */
    if (!READ_KEY || String(P.key || '') !== READ_KEY) return reply_(e, { status: 'denied', message: 'אין הרשאה' });
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return reply_(e, { status: 'error', message: 'פעולה אחרת רצה כרגע — נסו שוב בעוד דקה' });
    try {
      var S = testSess_();
      if (op === 'state') return reply_(e, testView_(S));
      if (op === 'new') {
        if (S) { var v0 = testView_(S); v0.tok = S.tok; return reply_(e, v0); }
        var inst = String(P.inst || '').trim();
        if (!/^[a-z]{2,20}$/.test(inst) || RAF_NEVER.indexOf(inst) >= 0) {
          return reply_(e, { status: 'error', message: 'צריך לבחור מוסד' });
        }
        S = { sid: 'T' + Date.now().toString(36), tok: Utilities.getUuid().replace(/-/g, ''),
              at: new Date().toISOString(), inst: inst, devs: [], devBy: {}, raf: null,
              slots: TEST_SLOTS_.map(function (x) {
                /* טלפון פיקטיבי: 000 ועוד שבע ספרות אקראיות — אינו מספר אמיתי. */
                var ph = '000';
                for (var d = 0; d < 7; d++) ph += Math.floor(Math.random() * 10);
                return { k: x.k, role: x.role, first: x.first, last: x.last, phone: ph, id: '' };
              }) };
        testSave_(S);
        var v1 = testView_(S); v1.tok = S.tok;
        return reply_(e, v1);
      }
      /* טעינת המצב בלי סשן — מצב כבוי תקין, לא שגיאה: המסך מציג את
         בחירת המוסד וההפעלה. שום סשן לא נוצר כאן. */
      if (op === 'tok' && !S) return reply_(e, testView_(null));
      if (!S) return reply_(e, { status: 'error', message: 'אין סשן בדיקה פעיל' });
      if (op === 'tok') { var v2 = testView_(S); v2.tok = S.tok; return reply_(e, v2); }
      if (op === 'devs') {
        /* המכשירים שנרשמו להתראות בזהויות הסשן — עכשיו, כפי שהבעלים
           רואה אותם. רק אלה יקבלו את הגרלת הבדיקה. */
        S.devs = []; S.devBy = {};
        S.slots.forEach(function (x) {
          if (!x.id) return;
          var p = testSubs_([x.id], '');
          S.devBy[x.k] = p.length;
          p.forEach(function (q) { if (S.devs.indexOf(q) < 0) S.devs.push(q); });
        });
        testSave_(S);
        return reply_(e, testView_(S));
      }
      if (op === 'raf') {
        var a = testSlot_(S, 'a'), b = testSlot_(S, 'b');
        if (!a.id || !b.id) return reply_(e, { status: 'error', message: 'שני תלמידי הבדיקה צריכים להירשם קודם' });
        /* הגרלה חדשה רק כשאף שליחה לא יצאה ולא ממתינה — אחרת מזהה הודעה
           חדש היה עוקף את מניעת הכפל. */
        if (S.raf && (S.raf.st === 'פורסם' || testTouched_(S.raf))) {
          return reply_(e, { status: 'error', message: 'כבר יצאה שליחה בהגרלת הבדיקה הזו' });
        }
        S.raf = { rid: 'TR' + Date.now().toString(36), win: a.id, lose: b.id, st: 'הוגרל',
                  at: new Date().toISOString() };
        testSave_(S);
        return reply_(e, testView_(S));
      }
      if (op === 'aud') {
        if (!S.raf) return reply_(e, { status: 'error', message: 'אין הגרלת בדיקה' });
        var A = testAud_(S);
        return reply_(e, { status: 'ok', w: A.w.length, g: A.g.length, bad: A.bad });
      }
      if (op === 'pub') return reply_(e, testPub_(S, P));
      if (op === 'dlv') {
        if (!S.raf) return reply_(e, { status: 'error', message: 'אין הגרלת בדיקה' });
        return reply_(e, { status: 'ok', w: testDlv_(testMid_(S, 'w')), g: testDlv_(testMid_(S, 'g')), raf: S.raf });
      }
      if (op === 'end') return reply_(e, testEnd_(S));
      return reply_(e, { status: 'error', message: 'פעולה לא מוכרת' });
    } finally { lock.releaseLock(); }
  } catch (err) {
    return reply_(e, { status: 'error', message: String(err) });
  }
}

/* ============================================================
   ממשק ניהול התוכנית — טבלת הסקירה (19.10.2026).
   ============================================================
   טבלת גוגל נפרדת ("ממשק ניהול תוכנית הדף השבועי", לשונית
   "סקירה"), שאחיאסף מעביר בין המנהלים. **היא המקור** לשלושה
   שדות שאדם ממלא: לומדים בפועל, רכז בשטח, משפט סיכום. הממשק
   באפליקציה קורא וכותב אותם דרך כאן, ומי שעורך ישירות בטבלה
   — רואה את זה בממשק בקריאה הבאה. מקור אחד, ולכן אין "מי גובר".

   הכיוון השני: "נרשמו באפליקציה" ו"דווחו בנוכחות בלבד" נכתבים
   לטבלה מהמונים (ovSync_), בכל שעה ובכל פתיחה של הסקירה.
   **"לומדים בפועל" אינו נגזר משום מספר** — תא ריק נשאר ריק.

   המזהה של הטבלה אינו בקוד (הריפו ציבורי, והטבלה פתוחה לעריכה
   למי שיש לו הקישור): הוא נמצא פעם אחת לפי השם בדרייב ונשמר
   ב-OV_ID, או מודבק בניהול (ov=sheet).
   ============================================================ */
var OV_NAME_ = 'ממשק ניהול תוכנית הדף השבועי';
var OV_TAB_  = 'סקירה';
var OV_HEAD_ = { name: 'מוסד', coord: 'רכז בשטח', reg: 'נרשמו באפליקציה', act: 'לומדים בפועל',
                 note: 'הערות', joined: 'הצטרף לתוכנית', att: 'דווחו בנוכחות בלבד',
                 sys: 'סה"כ לפי המערכת', head: 'ראש חטיבה', rosh: 'ראש ישיבה',
                 src: 'הערת מקור', code: 'קוד' };

function ovNameKey_(s) {
  return String(s || '').replace(/["'״׳]/g, '').replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function ovKey_() { return prop_('OV_KEY', ''); }
function ovSheet_() {
  var P = PropertiesService.getScriptProperties(), id = P.getProperty('OV_ID') || '', ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  /* החיפוש לפי שם נשען על Drive API, ובפרויקט הזה גוגל אינה
     מצליחה להפעיל אותו ("Permission denied while enabling APIs:
     drive"). כישלון = לא נמצא — והממשק מבקש להדביק את הקישור
     לטבלה (ov=sheet), שנפתחת בלי Drive API. */
  if (!ss) {
    try {
      var it = DriveApp.getFilesByName(OV_NAME_);
      while (it.hasNext()) {
        var f = it.next();
        if (f.getMimeType() !== MimeType.GOOGLE_SHEETS || f.isTrashed()) continue;
        ss = SpreadsheetApp.openById(f.getId());
        P.setProperty('OV_ID', f.getId());
        break;
      }
    } catch (e) { ss = null; }
  }
  if (!ss) return null;
  return ss.getSheetByName(OV_TAB_) || ss.getSheets()[0];
}
/* הטבלה נערכת ביד: הכותרת נמצאת לפי "מוסד" ולא לפי מספר שורה,
   והעמודות לפי הכותרת. השורות נגמרות בשורה ריקה או בשורת סה"כ. */
function ovTable_(sh) {
  var all = sh.getLastRow() ? sh.getDataRange().getValues() : [];
  var hr = -1, cols = {};
  for (var r = 0; r < Math.min(all.length, 12) && hr < 0; r++) {
    for (var c = 0; c < all[r].length; c++) {
      if (String(all[r][c]).trim() === OV_HEAD_.name) { hr = r; break; }
    }
  }
  if (hr < 0) return null;
  var head = all[hr].map(function (h) { return String(h).trim(); });
  Object.keys(OV_HEAD_).forEach(function (k) {
    var want = OV_HEAD_[k];
    for (var i = 0; i < head.length; i++) {
      if (head[i] === want || (k === 'note' && head[i].indexOf(want) === 0)) { cols[k] = i; return; }
    }
  });
  var rows = [];
  for (var j = hr + 1; j < all.length; j++) {
    var nm = String(all[j][cols.name] || '').trim();
    if (!nm || /^סה["״]כ/.test(nm)) break;
    rows.push({ r: j + 1, v: all[j] });
  }
  return { sh: sh, hr: hr + 1, cols: cols, rows: rows, w: head.length };
}
function ovCell_(T, row, k) {
  var i = T.cols[k];
  if (i === undefined) return '';
  var v = row.v[i];
  if (v === true) return 'TRUE';
  if (v === false) return 'FALSE';
  return v == null ? '' : String(v).trim();
}
/* עמודת "קוד" — נוספת פעם אחת, מוסתרת, ליד העמודות המקופלות. */
function ovCodeCol_(T) {
  if (T.cols.code !== undefined) return T.cols.code;
  var col = T.w + 1;
  T.sh.getRange(T.hr, col).setValue(OV_HEAD_.code);
  try { T.sh.hideColumns(col); } catch (e) {}
  T.cols.code = col - 1; T.w = col;
  return T.cols.code;
}
/* המונים (לשונית "מונים") לפי קוד: נרשמו, דווחו בנוכחות בלבד.
   null = לא נקרא — ואז לא נכתב כלום (קריאה שנכשלה אינה אפס). */
function ovCounts_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(COUNT_TAB);
  if (!sh) return null;
  var a = sh.getLastRow() ? sh.getDataRange().getDisplayValues() : [];
  if (!a.length) return null;
  var h = a[0].map(function (x) { return String(x).trim(); });
  var ic = h.indexOf('קוד ישיבה'), iN = h.indexOf('מצטרפים'), iR = h.indexOf('נרשמו'), iA = h.indexOf('דווחו בלבד');
  if (ic < 0 || iN < 0) return null;
  var m = {};
  for (var i = 1; i < a.length; i++) {
    var code = String(a[i][ic] || '').trim();
    if (!code) continue;
    var n = +a[i][iN] || 0;
    m[code] = { n: n, reg: iR >= 0 ? (+a[i][iR] || 0) : n, att: iA >= 0 ? (+a[i][iA] || 0) : 0 };
  }
  return m;
}
/* האפליקציה ← הטבלה: שני המספרים שהמערכת יודעת. רק תא שהשתנה
   נכתב, כדי לא לדרוס עריכה שקורית באותו רגע בעמודה אחרת. */
function ovSync_(force) {
  var cache = CacheService.getScriptCache();
  if (!force && cache.get('ovSyncAt')) return null;
  var sh = ovSheet_();
  if (!sh) return null;
  var T = ovTable_(sh), C = ovCounts_();
  if (!T || !C) return T;
  T.rows.forEach(function (row) {
    var code = ovCell_(T, row, 'code');
    if (!code) return;
    var x = C[code] || { reg: 0, att: 0 };
    [['reg', x.reg], ['att', x.att]].forEach(function (p) {
      var i = T.cols[p[0]];
      if (i === undefined) return;
      if (String(row.v[i]) === String(p[1])) return;
      sh.getRange(row.r, i + 1).setValue(p[1]);
      row.v[i] = p[1];
    });
  });
  cache.put('ovSyncAt', '1', 120);
  return T;
}
function ovRow_(T, row, owner) {
  var act = ovCell_(T, row, 'act');
  var o = { name: ovCell_(T, row, 'name'), code: ovCell_(T, row, 'code'),
            coord: ovCell_(T, row, 'coord'), reg: ovCell_(T, row, 'reg'),
            att: ovCell_(T, row, 'att'), act: act, note: ovCell_(T, row, 'note') };
  if (owner) {
    o.joined = ovCell_(T, row, 'joined'); o.head = ovCell_(T, row, 'head');
    o.rosh = ovCell_(T, row, 'rosh'); o.src = ovCell_(T, row, 'src');
  }
  return o;
}
/* תא שמתחיל ב-= + - @ היה הופך לנוסחה בגיליון. */
function ovSafe_(v) {
  v = String(v == null ? '' : v).replace(/\s+$/, '');
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function ov_(p) {
  var key = String(p.key || ''), op = String(p.ov || '');
  var owner = !!READ_KEY && key === READ_KEY;
  var ovk = ovKey_(), mgr = !!ovk && key === ovk;
  if (!owner && !mgr) {
    return { status: 'denied', message: ovk || READ_KEY ? 'הקישור אינו תקף' : 'הסקירה עדיין לא הופעלה' };
  }

  /* --- הבעלים בלבד: קישור המנהלים ומיקום הטבלה --- */
  if (op === 'key' || op === 'sheet') {
    if (!owner) return { status: 'denied', message: 'רק לבעלים' };
    var P = PropertiesService.getScriptProperties();
    if (op === 'sheet') {
      var m = /[-\w]{25,}/.exec(String(p.id || ''));
      if (!m) return { status: 'error', message: 'לא זוהה מזהה גיליון' };
      SpreadsheetApp.openById(m[0]);
      P.setProperty('OV_ID', m[0]);
      return { status: 'ok' };
    }
    if (!ovk || p.rot === '1') {
      ovk = Utilities.getUuid().replace(/-/g, '').slice(0, 14);
      P.setProperty('OV_KEY', ovk);
    }
    return { status: 'ok', k: ovk };
  }

  var lock = null;
  if (op !== 'get') {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return { status: 'error', message: 'עומס — נסו שוב' };
  }
  try {
    var T = op === 'get' ? ovSync_(false) : null;
    if (!T) { var sh0 = ovSheet_(); T = sh0 ? ovTable_(sh0) : null; }
    if (!T) return { status: 'nosheet', message: 'טבלת הסקירה לא נמצאה' };

    /* --- הבעלים: קוד לכל שורה ששמה זהה לשם ברשימת המוסדות,
           והוספת מוסד שאינו בטבלה. **רק שם זהה** — שם דומה
           אינו משויך כאן; הוא מוצג לבעלים כהצעה. --- */
    if (op === 'codes' || op === 'add') {
      if (!owner) return { status: 'denied', message: 'רק לבעלים' };
      var list = parse_(p.m) || [], ci = ovCodeCol_(T), done = 0;
      if (op === 'codes') {
        list.forEach(function (it) {
          T.rows.forEach(function (row) {
            if (ovCell_(T, row, 'code') || ovNameKey_(ovCell_(T, row, 'name')) !== ovNameKey_(it.name)) return;
            T.sh.getRange(row.r, ci + 1).setValue(String(it.code));
            row.v[ci] = String(it.code); done++;
          });
        });
        if (done) { CacheService.getScriptCache().remove('ovSyncAt'); T = ovSync_(true) || T; }
      } else {
        var it0 = list[0] || {};
        if (!it0.name || !it0.code) return { status: 'error', message: 'חסר שם או קוד' };
        if (T.rows.some(function (row) { return ovNameKey_(ovCell_(T, row, 'name')) === ovNameKey_(it0.name); })) {
          return { status: 'error', message: 'המוסד כבר בטבלה' };
        }
        /* שורה חדשה **בתוך** טווח השורות, כדי שנוסחת הסה"כ תתרחב
           אליה; הנוסחה של השורה (סה"כ לפי המערכת) מועתקת מהשכנה. */
        var at = T.rows.length ? T.rows[T.rows.length - 1].r : T.hr + 1;
        T.sh.insertRowBefore(at);
        var nr = at;
        T.sh.getRange(nr, T.cols.name + 1).setValue(ovSafe_(it0.name));
        T.sh.getRange(nr, ci + 1).setValue(String(it0.code));
        if (T.cols.sys !== undefined) {
          T.sh.getRange(nr + 1, T.cols.sys + 1).copyTo(T.sh.getRange(nr, T.cols.sys + 1));
        }
        T = ovTable_(T.sh); ovSync_(true);
        T = ovTable_(T.sh);
      }
    }

    /* --- עדכון שדה: לומדים בפועל / משפט סיכום (בעלים ומנהלים),
           רכז בשטח (בעלים בלבד — רק אחיאסף מסמן רכז פעיל). --- */
    if (op === 'set') {
      var f = String(p.f || ''), v = String(p.v == null ? '' : p.v).trim();
      if (['act', 'note', 'coord'].indexOf(f) < 0) return { status: 'error', message: 'שדה לא מוכר' };
      if (f === 'coord' && !owner) return { status: 'denied', message: 'רכז בשטח — רק לבעלים' };
      if (f === 'act' && v && !/^\d{1,5}$/.test(v)) return { status: 'error', message: 'מספר בלבד, או ריק' };
      if (v.length > (f === 'note' ? 600 : 80)) v = v.slice(0, f === 'note' ? 600 : 80);
      var hit = null;
      T.rows.forEach(function (row) {
        if (hit) return;
        if ((p.code && ovCell_(T, row, 'code') === String(p.code)) ||
            ovNameKey_(ovCell_(T, row, 'name')) === ovNameKey_(p.name)) hit = row;
      });
      if (!hit) return { status: 'error', message: 'הישיבה לא נמצאה בטבלה' };
      var col = T.cols[f];
      if (col === undefined) return { status: 'error', message: 'העמודה לא נמצאה בטבלה' };
      var cell = T.sh.getRange(hit.r, col + 1);
      if (f === 'act') cell.setValue(v === '' ? '' : +v); else cell.setValue(ovSafe_(v));
      SpreadsheetApp.flush();
      /* הקריאה החוזרת היא האישור — מה שהטבלה מחזיקה עכשיו. */
      hit.v[col] = cell.getValue();
      return { status: 'ok', row: ovRow_(T, hit, owner) };
    }

    var C = ovCounts_() || {}, inT = {}, other = [];
    T.rows.forEach(function (row) { var c = ovCell_(T, row, 'code'); if (c) inT[c] = 1; });
    Object.keys(C).forEach(function (c) { if (!inT[c] && C[c].n) other.push({ code: c, n: C[c].n }); });
    var out = { status: 'ok', rows: T.rows.map(function (row) { return ovRow_(T, row, owner); }),
                other: other, owner: owner, at: new Date().toISOString() };
    if (owner) { out.sheet = T.sh.getParent().getUrl(); out.hasKey = !!ovk; }
    return out;
  } finally {
    if (lock) lock.releaseLock();
  }
}
