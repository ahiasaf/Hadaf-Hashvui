/* ============================================================
   הלימוד המשותף — השאלה, ההגרלה, והרישום.
   ============================================================
   "למדו יחד עם אבא/אמא את הדף הראשון ותיכנסו להגרלה.
   האפליקציה תזהה ששניכם למדתם."

   **האירוע הוא לימוד אחד משותף.** לא שתי השלמות נפרדות
   שבמקרה שתיהן קיימות. ההבדל אינו סמנטי: מדידה של "כל אחד
   סימן אצלו" מחייבת שני מכשירים ושתי זהויות, והיא נשברת
   בדיוק במקרה הרצוי ביותר — אבא ובן מול מסך אחד, שזה מה
   שאנחנו רוצים לעודד. מה שקרה באמת נרשם בשורה אחת: אחד מהם
   מסמן, ואומר עם מי.

   התוצאה: עובד מכל מכשיר, ממחשב, מטאבלט, בלי חשבונות ובלי
   הגירה של מי שכבר רשום.

   ------------------------------------------------------------
   למי זה מופיע

   רק לתלמיד שסימן שהוא לומד עם הורה — בהרשמה או בעדכון
   מאוחר יותר; `me.way` נקרא ברגע הסימון ולא נשמר בנפרד,
   ולכן אין כאן שני מקורות שיכולים להיפרד.

   ------------------------------------------------------------
   שלושה מסכים, קובץ אחד

   הסימון קורה בשלושה מקומות — מסך התלמיד, הדף האינטראקטיבי
   והמסך הראשי — ולכן השאלה יושבת כאן ולא בכל אחד מהם. שלושה
   עותקים של אותו דיאלוג נפרדים זה מזה בשקט ביום שמישהו מתקן
   אחד מהם.

   הנוסח כולו ב-`PAIR` שב-data.js, ולכן הוא נערך מהניהול.
   ES5 בלבד. ============================================ */
var PAIR_UI = (function () {

  function t(k) { return (window.PAIR && PAIR[k]) || ''; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function fill(x, v) {
    return String(x == null ? '' : x).replace(/\{([^}]+)\}/g, function (m, k) {
      return v[k] == null ? m : v[k];
    });
  }
  function me() { return (typeof LMe === 'function') ? LMe() : null; }

  /* ---------- "אבא" או "אמא" ----------
     מילה אחת שמתחלפת, ולא תכונה. כל השאר בתוכנית אינו יודע
     על ההבדל, וזה בכוונה. */
  function word(m) {
    m = m || me() || {};
    return t(m.parent === 'mom' ? 'mom' : 'dad');
  }

  /* ============================================================
     מי נשאל — ומאיזה צד.
     ============================================================
     'kid'    — המכשיר של הבן, שבחר ללמוד עם הורה.
     'parent' — המכשיר של ההורה, שצירף את בנו.

     אותו תהליך בדיוק בשני הכיוונים: מי שמסמן הוא מי שמדווח,
     וההודעה יוצאת לצד השני. ההבדל היחיד הוא המילה.

     `way` ו-`role` נקראים **עכשיו** ולא נשמרים בנפרד, ולכן
     עדכון מאוחר של דרך הלימוד תופס מיד — בדיוק כמו סימון
     בהרשמה.
     ============================================================ */
  function side() {
    var m = me();
    if (!m || !m.id) return '';
    if (m.role === 'dad') return m.rel === 'kid' ? 'parent' : '';
    return m.way === 'dad' ? 'kid' : '';
  }
  function wanted() { return !!side(); }

  /* שם הצד השני כפי שמי שמסמן מכיר אותו: הבן בשמו, וההורה
     במילה. שם פרטי תמיד חם יותר ממילה — אבל "אבא" חם יותר
     משמו הפרטי של אבא. */
  function other(m) {
    m = m || me() || {};
    if (side() === 'parent') return (m.dadFirst || '').trim() || t('kid');
    return word(m);
  }

  /* ---------- מה כבר דווח ---------- */
  function key(track, wk) { return track + '|' + (wk + 1); }
  function got() {
    try { return JSON.parse(localStorage.getItem('df:pairs') || '{}') || {}; }
    catch (e) { return {}; }
  }
  function keep(k) {
    var all = got(); all[k] = new Date().toISOString();
    try { localStorage.setItem('df:pairs', JSON.stringify(all)); } catch (e) {}
  }
  function done(track, wk) { return !!got()[key(track, wk)]; }

  /* ============================================================
     הרישום — ולשונית משלו.
     ============================================================
     לא שדה נוסף בשורת הלימוד: שורת לימוד נכתבת גם באמצע הדף
     ולא רק בסיומו, והיא נכתבת גם למי שלומד לבד. לשונית
     נפרדת היא בדיוק רשימת הזוגות שממנה ההגרלה נעשית, בלי
     סינון ובלי פרשנות.

     הכתיבה `no-cors` ואטומה — ולכן היא נבדקת בקריאה חוזרת
     (`?pair=`), בדיוק כמו שורת הלימוד. הכלל של הפרויקט:
     כתיבה שלא אומתה אינה כתיבה שהצליחה.
     ============================================================ */
  function api() {
    var cfg = {};
    try { cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}') || {}; } catch (e) {}
    return (cfg.api ||
      (typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : '') || '').trim();
  }
  function send(track, wk) {
    var m = me(); if (!m || !m.id) return;
    var url = api(); if (!url) return;
    var daf = (typeof LDaf === 'function') ? (LDaf(track, wk) || '') : '';
    var row = { action:'row', tab:'זוגות', cols: JSON.stringify([
      ['מתי', new Date().toISOString()],
      ['מזהה', m.id], ['שם', ((m.first || '') + ' ' + (m.last || '')).trim()],
      ['קוד ישיבה', m.inst || ''], ['ישיבה', m.instName || ''],
      ['שכבה', m.grade || ''], ['כיתה', m.klass || ''],
      ['מסלול', track], ['שבוע', wk + 1], ['דף', daf],
      /* ============================================================
         "שותף" ולא "הורה" — כי הכיוון מתחלף.
         ============================================================
         השורה נכתבת גם מהמכשיר של הבן וגם מזה של ההורה, ומי
         שכתב אותה הוא "המדווח". הטלפון הוא מה שמחבר בין
         השניים, והוא גם מה שמאתר את הצד השני בלשונית המנויים
         כדי לשלוח לו את ההתראה — בשני הכיוונים.
         ============================================================ */
      ['דיווח', side() === 'parent' ? 'ההורה' : 'הבן'],
      /* ============================================================
         מי שדיווח בעצמו — אישר בעצמו.
         ============================================================
         הורה שסימן במכשיר שלו אינו צריך שיבקשו ממנו לאשר את
         מה שהוא עצמה כתב. כשהבן דיווח, העמודה נשארת ריקה עד
         שההורה מאשר — וההתראה אליו היא מה שפותח את המסך.
         ============================================================ */
      ['אושר', side() === 'parent' ? 'כן' : ''],
      ['קרבה', side() === 'parent' ? 'בן'
                                   : (m.parent === 'mom' ? 'אמא' : 'אבא')],
      ['שם השותף', m.dadFirst || ''],
      ['טלפון השותף', m.dadPhone || '']
    ]) };
    var q = [];
    try { q = JSON.parse(localStorage.getItem('df:pair-q') || '[]') || []; }
    catch (e) {}
    q.push(row);
    try { localStorage.setItem('df:pair-q', JSON.stringify(q)); } catch (e) {}
    flush();
  }

  var TRIES = 0;
  function flush() {
    var q = [];
    try { q = JSON.parse(localStorage.getItem('df:pair-q') || '[]') || []; }
    catch (e) { return; }
    var url = api();
    if (!q.length || !url || !navigator.onLine || TRIES >= 3) return;
    var item = q[0], c = {};
    (JSON.parse(item.cols || '[]') || []).forEach(function (p) { c[p[0]] = p[1]; });
    var m = me(); if (!m || !m.id) return;
    var tag = c['מסלול'] + '|' + c['שבוע'];

    fetch(url, { method:'POST', mode:'no-cors',
                 headers:{ 'Content-Type':'text/plain;charset=utf-8' },
                 body: JSON.stringify(item) })
      /* רגע לפני הבדיקה — הכתיבה בשרת עוברת דרך נעילה. */
      .then(function () {
        return new Promise(function (ok) { setTimeout(ok, 1500); });
      })
      .then(function () { return arrived(m.id, tag); })
      .then(function (ok) {
        if (!ok) { TRIES++; return; }
        var rest = [];
        try { rest = JSON.parse(localStorage.getItem('df:pair-q') || '[]') || []; }
        catch (e) { return; }
        rest.shift();
        try { localStorage.setItem('df:pair-q', JSON.stringify(rest)); } catch (e) {}
        flush();
      })
      .catch(function () {});
  }
  /* JSONP, כמו ב-learned.js: הסקריפט של גוגל אינו מחזיר
     כותרות CORS לקריאה רגילה מהדפדפן. */
  function arrived(id, tag) {
    return new Promise(function (ok) {
      var cb = 'pr' + Date.now() + Math.floor(Math.random() * 1000);
      var sc = document.createElement('script');
      var t0 = setTimeout(function () { clean(); ok(false); }, 8000);
      function clean() {
        clearTimeout(t0);
        try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        if (sc.parentNode) sc.parentNode.removeChild(sc);
      }
      window[cb] = function (r) { clean(); ok(!!(r && r.status === 'ok' && r.has)); };
      sc.onerror = function () { clean(); ok(false); };
      sc.src = api() + '?pair=' + encodeURIComponent(id) +
               '&wk=' + encodeURIComponent(tag) + '&cb=' + cb;
      document.body.appendChild(sc);
    });
  }

  /* ============================================================
     המסך.
     ============================================================
     שכבה מעל התוכן ולא ניווט: הוא סיים ללמוד, והשאלה היא
     המשך של הרגע ולא מסך חדש. סגירה מחזירה אותו בדיוק לאן
     שהיה.
     ============================================================ */
  function css() {
    if (document.getElementById('pr-css')) return;
    var st = document.createElement('style');
    st.id = 'pr-css';
    st.textContent = [
      '.pr-wrap{position:fixed;inset:0;z-index:9000;display:flex;',
      '  align-items:center;justify-content:center;padding:20px;',
      '  background:rgba(11,37,80,.55);backdrop-filter:blur(2px)}',
      '.pr-card{background:var(--surface,#FFFDF8);border-radius:18px;',
      '  padding:26px 22px 22px;max-width:23rem;width:100%;text-align:center;',
      '  box-shadow:0 18px 60px rgba(11,37,80,.4);',
      '  border-top:4px solid var(--gold,#C08F2B)}',
      /* המסך היזום אצל ההורה — לא נלחץ מתוך התראה, ולכן צריך
         לבלוט מעצמו. אדום ולא זהב, בכוונה. */
      '.pr-card.red{border-top-color:#B3261E}',
      '.pr-card h3{margin:0;font-size:1.25rem;font-weight:800;',
      '  letter-spacing:-.03em;line-height:1.35;color:var(--blue-d,#0B2550)}',
      '.pr-card p{margin:10px 0 0;font-size:.95rem;font-weight:600;',
      '  line-height:1.7;color:var(--ink-2,#5A6780);white-space:pre-line}',
      '.pr-go{display:block;width:100%;margin-top:18px;padding:15px;border:0;',
      '  border-radius:12px;background:var(--green-d,#467B1A);color:#fff;',
      '  font-family:inherit;font-weight:800;font-size:1rem;cursor:pointer}',
      '.pr-go.b{background:var(--blue,#17468F)}',
      '.pr-thin{display:block;width:100%;margin-top:9px;padding:11px;border:0;',
      '  background:none;color:var(--ink-3,#5C687E);font-family:inherit;',
      '  font-size:.88rem;font-weight:700;text-decoration:underline;cursor:pointer}',
      /* הרגע עצמו. עיגול זהב עם וי — לא אימוג׳, שנראה אחרת
         בכל מכשיר ובחלקם אינו נטען כלל. */
      '.pr-seal{width:66px;height:66px;border-radius:50%;margin:0 auto 14px;',
      '  display:flex;align-items:center;justify-content:center;',
      '  background:linear-gradient(150deg,#E5B854,#C08F2B);',
      '  box-shadow:0 0 0 7px rgba(192,143,43,.16)}',
      '.pr-seal svg{width:32px;height:32px;fill:none;stroke:#fff;',
      '  stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function shut() {
    var el = document.getElementById('pr-wrap');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function show(html) {
    css(); shut();
    var d = document.createElement('div');
    d.className = 'pr-wrap'; d.id = 'pr-wrap';
    d.innerHTML = '<div class="pr-card">' + html + '</div>';
    document.body.appendChild(d);
    return d;
  }
  var SEAL = '<div class="pr-seal"><svg viewBox="0 0 24 24">' +
             '<path d="M4 12.5l5.2 5.2L20 7"/></svg></div>';

  /* **ההורה אינו בהגרלה — הבן הוא שבהגרלה.** הפרס נועד לעודד
     את הילד להמשיך, ולכן גם הבשורה להורה מדברת על בנו. */
  function win(m, sd) {
    var who = other(m);
    var head = sd === 'parent' ? t('okKidH') : t('okH');
    var body = sd === 'parent' ? fill(t('okKidB'), { 'בן': who })
                               : fill(t('okB'), { 'הורה': who });
    show(SEAL + '<h3>' + esc(head) + '</h3>' +
      '<p>' + esc(body) + '</p>' +
      '<button class="pr-go" id="pr-x">' + esc(t('okGo')) + '</button>');
    var b = document.getElementById('pr-x');
    if (b) b.onclick = shut;
  }

  /* ---------- מה שנקרא מבחוץ ---------- */
  function ask(track, wk) {
    var sd = side();
    if (!sd) return false;
    var m = me();
    if (done(track, wk)) return false;
    var who = other(m);
    var head = sd === 'parent' ? fill(t('askKidH'), { 'בן': who })
                               : fill(t('askH'), { 'הורה': who });
    /* להורה נאמר "בוא נכניס אותו" ולא "תיכנס" — הוא עושה את
       זה בשביל בנו, וזה בדיוק מה שהוא רוצה לעשות. */
    var sub = sd === 'parent' ? t('askKidB') : t('askB');
    var camp = t('campH');
    show((camp ? '<p style="margin:0 0 10px;font-size:.82rem;font-weight:700;' +
                 'color:var(--gold-d,#8A6416)">' + esc(camp) + '</p>' : '') +
      '<h3>' + esc(head) + '</h3>' +
      '<p>' + esc(sub) + '</p>' +
      '<button class="pr-go" id="pr-y">' + esc(t('yes')) + '</button>' +
      '<button class="pr-thin" id="pr-n">' + esc(t('no')) + '</button>');
    var b = document.getElementById('pr-y');
    if (b) b.onclick = function () {
      keep(key(track, wk));
      send(track, wk);
      win(m, sd);
    };
    b = document.getElementById('pr-n');
    if (b) b.onclick = shut;
    return true;
  }

  /* ============================================================
     האישור של ההורה.
     ============================================================
     הבן סימן, והוא כבר בהגרלה — זה נגמר ברגע שהוא לחץ. מה
     שההתראה להורה עושה הוא לפתוח כאן מסך אחד: "למדתם יחד?".
     היא אינה שער ואינה תנאי; היא האדם השני שראה.

     הכתובת שבהתראה נושאת את מי דיווח ועל איזה שבוע:
     `?pr=<מזהה>|<מסלול>|<שבוע>`. היא מגיעה רק למכשיר שההורה
     נרשם בו, כי היא נוסעת בתוך ההתראה שלו.
     ============================================================ */
  function param() {
    var m = /[?&]pr=([^&#]+)/.exec(location.search);
    if (!m) return null;
    var p = decodeURIComponent(m[1]).split('|');
    return p.length === 3 ? { id:p[0], track:p[1], wk:p[2] } : null;
  }
  /* הכתובת מנוקה אחרי שנקראה: רענון של הדף לא אמור לשאול שוב. */
  function clearParam() {
    try {
      var u = location.href.replace(/[?&]pr=[^&#]*/, '');
      history.replaceState(null, '', u);
    } catch (e) {}
  }
  function mark(p, yes) {
    var url = api(); if (!url) return;
    /* JSONP, כמו כל קריאה אחרת לסקריפט של גוגל. */
    var cb = 'pk' + Date.now();
    var sc = document.createElement('script');
    window[cb] = function () {
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (sc.parentNode) sc.parentNode.removeChild(sc);
    };
    sc.onerror = window[cb];
    sc.src = url + '?pairok=' + encodeURIComponent(p.id) +
             '&wk=' + encodeURIComponent(p.track + '|' + p.wk) +
             '&yes=' + (yes ? '1' : '0') + '&cb=' + cb;
    document.body.appendChild(sc);
  }
  /* `urgent` — האם המסך נפתח **יזום**, לא בעקבות התראה שנלחצה.
     אז יש גם אדום: זו בדיוק הנקודה — לא להישען על שההתראה
     תגיע. ראו `pending()` למטה. */
  function confirmShow(p, urgent) {
    var m = me() || {};
    var who = (m.dadFirst || '').trim() || t('kid');
    var daf = (typeof LDaf === 'function')
      ? (LDaf(p.track, (parseInt(p.wk, 10) || 1) - 1) || '') : '';
    var wrap = show('<h3>' + esc(fill(t('okAskH'), { daf: daf ? 'דף ' + daf : '' })) +
      '</h3><p>' + esc(fill(t('okAskB'), { name: who })) + '</p>' +
      '<button class="pr-go" id="pr-ok">' + esc(t('okYes')) + '</button>' +
      '<button class="pr-thin" id="pr-nope">' + esc(t('okNo')) + '</button>');
    if (urgent) {
      var card = wrap.querySelector('.pr-card');
      if (card) card.className += ' red';
    }
    var end = function (yes) {
      mark(p, yes);
      show((yes ? SEAL : '') +
        '<h3>' + esc(t(yes ? 'thanksH' : 'nopeH')) + '</h3>' +
        '<p>' + esc(t(yes ? 'thanksB' : 'nopeB')) + '</p>' +
        '<button class="pr-go" id="pr-x">' + esc(t('okGo')) + '</button>');
      var x = document.getElementById('pr-x');
      if (x) x.onclick = shut;
    };
    var b = document.getElementById('pr-ok');
    if (b) b.onclick = function () { end(true); };
    b = document.getElementById('pr-nope');
    if (b) b.onclick = function () { end(false); };
    return true;
  }
  function confirm_() {
    var p = param(); if (!p) return false;
    clearParam();
    return confirmShow(p, false);
  }

  /* ============================================================
     בדיקה יזומה — לא תלויה בהתראה שהגיעה.
     ============================================================
     ההתראה הייתה עד עכשיו הדרך היחידה שבה הורה מגיע למסך
     האישור, וזו בדיוק ההבטחה שאי אפשר לעמוד בה. כאן, בכל
     פתיחה רגילה של האפליקציה אצל מי שנרשם כהורה, נשאל השרת
     לפי הטלפון שהוא עצמו מילא — אותו טלפון בדיוק שהבן רשם
     כ"טלפון השותף" כשדיווח. אם יש דיווח שממתין לאישורו,
     המסך נפתח מעצמו — באדום, כדי שזה יבלוט בלי קשר להתראה. */
  function pending() {
    var m = me();
    if (!m || m.role !== 'dad' || !m.phone) return;
    var url = api(); if (!url) return;
    var cb = 'pp' + Date.now() + Math.floor(Math.random() * 1000);
    var sc = document.createElement('script');
    var t0 = setTimeout(function () { clean(); }, 8000);
    function clean() {
      clearTimeout(t0);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (sc.parentNode) sc.parentNode.removeChild(sc);
    }
    window[cb] = function (r) {
      clean();
      if (r && r.status === 'ok' && r.pending && r.pending.id) confirmShow(r.pending, true);
    };
    sc.onerror = clean;
    sc.src = url + '?pendingFor=' + encodeURIComponent(m.phone) + '&cb=' + cb;
    document.body.appendChild(sc);
  }

  /* התור מנסה שוב בכל פתיחה — אותו דפוס של `learn-q`. */
  function boot() {
    TRIES = 0; flush();
    /* מי שהגיע מההתראה — מקבל את מסך האישור מיד. מי שלא, ואצלו
       יש דיווח ממתין, מקבל אותו בכל זאת — רגע אחרי, כדי לא
       להתחרות עם קריאות הרשת שכבר יצאו בעליית האפליקציה. */
    if (!confirm_()) setTimeout(pending, 600);
  }

  return { ask: ask, word: word, other: other, side: side,
           wanted: wanted, done: done, confirm: confirm_,
           flush: boot, close: shut };
})();
