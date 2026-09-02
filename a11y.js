/* ============================================================
   נגישות — שלוש התאמות שאין להן מקום טבעי בשום עמוד בודד.

   1. הפעלה במקלדת של פקד שאינו כפתור.
      כרטיס שהוא `div` עם `onclick` נלחץ בעכבר ובאצבע, אבל
      מקלדת אינה מגיעה אליו כלל. מי שמסומן `role="button"`
      מקבל כאן את מה שכפתור אמיתי מקבל מהדפדפן: Enter ורווח.
      רווח גם מגלגל את העמוד כברירת מחדל, ולכן הוא נבלם.

   2. טבעת מיקוד שנראית גם על הבאנר הכחול.

   3. דילוג אל התוכן.
      מי שמנווט במקלדת עובר בכל תחנה שבראש העמוד לפני שהוא
      מגיע למה שבא בשבילו. הקישור הראשון מדלג ישר לתוכן, והוא
      נראה רק כשהמיקוד עליו — כלומר רק למי שצריך אותו.

   הקובץ אינו מגדיר שום פונקציה גלובלית, ואין לו תלות בעמוד
   שטוען אותו.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Enter ורווח ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var el = e.target;
    if (!el || !el.getAttribute) return;
    if (el.getAttribute('role') !== 'button') return;
    /* כפתור אמיתי, קישור או שדה — הדפדפן כבר מטפל בהם */
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' ||
        tag === 'SELECT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    el.click();
  });

  /* ---------- 2. טבעת מיקוד שנראית על שני הרקעים ----------
     טבעת המיקוד של הדפדפן היא קו כהה, והיא נבלעת בכפתור שיושב
     על הבאנר הכחול. צבע אחד אינו יכול לעמוד מול נייר בהיר ומול
     כחול כהה גם יחד — אין גוון שעומד בשלוש מול שניהם — ולכן
     הטבעת דו-גונית: לבן פנימי שנראה על הכהה, וכחול חיצוני
     שנראה על הבהיר.

     `:focus-visible` ולא `:focus`: הטבעת שייכת למי שמנווט
     במקלדת. מי שנוגע או לוחץ בעכבר לא יראה אותה כלל, וזו
     בדיוק ההתנהגות של כפתור רגיל בדפדפן.

     דפדפן ישן שאינו מכיר `:focus-visible` פשוט מתעלם מהכלל
     ונשאר עם הטבעת שלו — פחות טובה, אבל קיימת. */
  function ring() {
    var st = document.createElement('style');
    st.textContent =
      ':focus-visible{outline:3px solid #fff;outline-offset:0;' +
      'box-shadow:0 0 0 6px #0B2550 !important}';
    document.head.appendChild(st);
  }

  /* ---------- 3. דילוג אל התוכן ---------- */
  function skip() {
    if (document.querySelector('.a11y-skip')) return;
    /* יעד: `main` אם יש, ואחרת האזור הראשי של העמוד. בלי יעד
       אין טעם בקישור, והוא פשוט אינו נוצר. */
    var t = document.querySelector('main') ||
            document.getElementById('app') ||
            document.getElementById('page-main');
    if (!t) return;
    if (!t.id) t.id = 'a11y-main';
    /* יעד הדילוג חייב לקבל מיקוד, אחרת ההקשה מזיזה את הגלילה
       אבל לא את נקודת ההמשך — והתחנה הבאה תהיה שוב הכותרת. */
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');

    var st = document.createElement('style');
    st.textContent =
      '.a11y-skip{position:fixed;z-index:9999;top:8px;inset-inline-start:8px;' +
      'background:#0B2550;color:#fff;font:800 .9rem/1 inherit;' +
      'padding:12px 16px;border-radius:10px;text-decoration:none;' +
      'transform:translateY(-160%);transition:transform .16s}' +
      '.a11y-skip:focus{transform:none;outline:3px solid #E5B854;outline-offset:2px}';
    document.head.appendChild(st);

    var a = document.createElement('a');
    a.className = 'a11y-skip';
    a.href = '#' + t.id;
    a.textContent = 'דילוג לתוכן';
    a.addEventListener('click', function () {
      setTimeout(function () { try { t.focus(); } catch (e) {} }, 0);
    });
    document.body.insertBefore(a, document.body.firstChild);
  }

  ring();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', skip);
  } else {
    skip();
  }
})();
