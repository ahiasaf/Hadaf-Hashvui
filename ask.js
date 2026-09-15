/* ============================================================
   הבקשה האישית — משותפת לר"ם ולראש החטיבה.
   ============================================================
   מסך מלא, שלושה שלבים: מי אתה · התקנה · אישור עדכונים.
   בסופו יש לנו שם, מכשיר, ומנוי להתראות — וזה מה שמאפשר
   לשלוח לו משהו אי פעם.

   **למה קובץ משותף ולא עותק שני.**
   הוא נבנה בעמוד הצוות, ואז נדרש גם בעמוד הראשי. עותק שני
   היה נפרד מהראשון בשקט ביום שמישהו מתקן אחד מהם — וזה כבר
   קרה בפרויקט הזה יותר מפעם אחת (שלוש ערימות גופן, שלוש
   הגדרות של "מה נחשב שבוע"). קובץ אחד, שני עמודים.

   **והוא נושא את עצמו.** המלל בא מהעמוד, אבל המבנה, העיצוב
   וההתנהגות יושבים כאן — כולל תגית ה-<style>. עמוד שלישי
   שירצה אותו צריך שלוש שורות, ואין מה לשכוח להעתיק.

   מה העמוד חייב לספק
   ------------------
     mount    מזהה האלמנט שאליו נשתלים השורה והמסך
     key      קידומת האחסון: 'ram' · 'head'. שני תפקידים על
              אותו מכשיר אינם דורסים זה את זה.
     role     מה שנכתב בעמודת "תפקיד" בגיליון
     t(k)     שליפת נוסח לפי מפתח
     inst()   { code, name } של הישיבה, או null
     klass    האם שלב 1 שואל שכבה וכיתה (ר"ם כן, ראש חטיבה לא)
     grades   רשימת השכבות, כשהיא נדרשת
     when()   ערך עמודת "מועד" — רשות
     onClose() מה לעשות אחרי סגירה — רשות

   תלוי ב-`getapp.js` (APPX) ובכתובת `APPS_SCRIPT_URL`.
   ES5 בלבד, כמו כל השאר.
   ============================================================ */
var ASK = (function () {
  var C = null;                    /* ההגדרות מהעמוד */
  var step = 0, busy = false, err = '', skipped = false;
  /* עורך המלל פותח את המסך על שלב מסוים כדי שאפשר יהיה להקיש
     על הנוסח שבו. במצב הזה אין לקטוע את השלב לפי מה שהמשתמש
     באמת השלים — הרי כל העניין הוא לראות נוסח שעדיין לא הגיע
     אליו. */
  var peek = false;
  /* **מה שהוקלד ולא נשמר עדיין.** בלעדיו, מי שהקליד שם ושכח
     לבחור שכבה קיבל את ההודעה "צריך שכבה" — ויחד איתה טופס
     שהשם שלו נמחק. אדם שנענש על טעות קטנה סוגר את המסך. */
  var draft = {};

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function t(k) { return (C && C.t && C.t(k)) || ''; }
  function inst() { return (C && C.inst && C.inst()) || null; }

  /* ---------- אחסון ---------- */
  function k(suffix) { return 'df:' + C.key + suffix; }

  /* המלל שאינו תלוי בתפקיד — `ASK_UI` שב-data.js, ולכן ניתן
     לעריכה בניהול ככל נוסח אחר. `{n}` וחבריו מוחלפים כאן. */
  /* נוסח המדריך המאויר. */
  function gu(k) { return (window.GUIDE && GUIDE[k]) || ''; }
  function u(key, vars) {
    var v = (window.ASK_UI && ASK_UI[key]) || '';
    if (vars) {
      for (var f in vars) {
        if (vars.hasOwnProperty(f)) v = v.split('{' + f + '}').join(vars[f]);
      }
    }
    return v;
  }
  function get() {
    try { return JSON.parse(localStorage.getItem(k('')) || 'null'); }
    catch (e) { return null; }
  }
  function set(v) {
    try { localStorage.setItem(k(''), JSON.stringify(v)); } catch (e) {}
  }
  function noted() {
    try { return localStorage.getItem(k('Note')) === '1'; } catch (e) { return false; }
  }
  function seen() {
    /* מי שאישר עדכונים עבר את התהליך מעצם העובדה — גם אם
       הסימון הנפרד חסר, למשל מפני שאישר בגרסה שקדמה לו. */
    if (noted()) return true;
    try { return localStorage.getItem(k('Seen')) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(k('Seen'), '1'); } catch (e) {}
  }
  /* מזהה אקראי: הוא מה שמופיע בגיליון לצד העדכונים, ואינו
     נגזר משום פרט אישי. */
  function id() {
    var v = '';
    try { v = localStorage.getItem(k('-id')) || ''; } catch (e) {}
    if (!v) {
      v = 'R' + Date.now().toString(36) +
          Math.random().toString(36).slice(2, 7).toUpperCase();
      try { localStorage.setItem(k('-id'), v); } catch (e) {}
    }
    return v;
  }

  /* **"הרב" מתווסף כאן ובכל מקום אחר.** הוא הקליד שם פרטי ושם
     משפחה; התואר אינו נדרש ממנו ואינו נאמר לו. */
  function name(me) {
    me = me || get() || {};
    var n = ((me.first || '') + ' ' + (me.last || '')).trim();
    return n ? u(C.fem ? 'titleF' : 'title', { name: n }) : '';
  }

  /* ---------- היכן הוא עומד ---------- */
  function where() {
    if (!get()) return 1;
    if (!APPX.installed() && !skipped) return 2;
    if (noted() && APPX.perm() === 'granted') return 4;
    return 3;
  }

  /* ---------- השורה שמזמינה ----------
     **כפתור בלי כיתוב אינו כפתור:** אם המלל עוד לא נטען, למשל
     data.js ישן שיושב במטמון, עדיף שלא יופיע כלום. */
  function bar() {
    var el = $('askrow'); if (!el) return;
    var txt = t('askBar');
    if (!txt || where() === 4) { el.hidden = true; return; }
    $('ar-t').textContent = txt;
    $('ar-go').textContent = t('askBarGo');
    el.hidden = false;
  }

  function open() {
    var mk = $('as-mark');
    if (mk && !mk.src) mk.src = window.LOGO_MARK || '';
    step = where();
    if (step === 1 && !get() && !peek) step = 0;   /* 0 = הפנייה עצמה */
    $('asksheet').hidden = false;
    document.body.style.overflow = 'hidden';
    draw();
  }
  function close() {
    $('asksheet').hidden = true;
    document.body.style.overflow = '';
    bar();
    if (C.onClose) C.onClose();
  }
  function go(n) { step = n; draw(); }

  /* ---------- חלקי המסך ---------- */
  function meter(n) {
    var h = '<div class="as-bar">', i;
    for (i = 1; i <= 3; i++) {
      h += '<i class="' + (i < n ? 'did' : (i === n ? 'on' : '')) + '"></i>';
    }
    return h + '</div>';
  }
  function row(txt) {
    return '<div class="as-done"><b>✓</b><span>' + esc(txt) + '</span></div>';
  }
  function kick(n, ttl, body) {
    return '<div class="as-kick">' + esc(u('step', { n: n })) + '</div>' +
      '<h2>' + esc(ttl) + '</h2>' + (body ? '<p>' + esc(body) + '</p>' : '');
  }

  function draw() {
    var el = $('as-body'); if (!el) return;
    var me = get(), h = '';

    /* ---- הפנייה עצמה. בלי מד ובלי שלבים: זו עדיין בקשה
            ולא תהליך, ומד מעליה הופך אותה למשימה. ---- */
    if (step === 0) {
      /* שורה ריקה במלל = פסקה. פסקה אחת ארוכה נקראת כקיר. */
      /* כוכביות מדגישות, כמו בוואטסאפ — אותו כלל בכל האפליקציה.
         מברחים קודם ורק אז מחליפים, אחרת נוסח עם סוגריים
         משולשים היה הופך לתגית פתוחה. */
      var body = String(t('askBody') || '').split('\n').map(function (x) {
        x = x.trim();
        if (!x) return '';
        return '<p>' + esc(x).replace(/\*([^*\n]+)\*/g, '<b>$1</b>') + '</p>';
      }).join('');
      el.innerHTML = '<div class="as-card"><h2>' + esc(t('askH')) + '</h2>' + body +
        '<button class="as-go" id="r-go">' + esc(t('askGo')) + '</button>' +
        '<button class="as-thin" id="r-later">' + esc(t('askLater')) + '</button></div>';
      wire(); return;
    }

    /* 4 = סיום, 5 = לא הצליח להתקין. בשניהם התהליך נגמר,
       ולכן המד מלא ואינו מצביע על שלב רביעי שאינו קיים. */
    h += meter(step >= 4 ? 3 : step);
    if (step > 1 && me) h += row(name(me));
    if (step > 2) h += row(u(skipped ? 'doneSkip' : 'doneApp'));

    var wantGuide = (step === 2 && window.GUIDE_UI && !APPX.bip() &&
                     !APPX.inApp() && !(APPX.wasAdded() && !APPX.installed()));
    if (step === 1)      h += '<div class="as-card">' + who() + '</div>';
    else if (step === 2) h += '<div class="as-card">' + install() + '</div>';
    else if (step === 3) h += '<div class="as-card">' + note() + '</div>';
    else if (step === 5) h += '<div class="as-card">' + help() + '</div>';
    else                 h += '<div class="as-card fin">' + fin() + '</div>';

    el.innerHTML = h;
    /* המדריך נשתל אחרי שהמסך צויר — הוא מנהל את הצעדים שלו
       בעצמו, ואינו מצויר מחדש בכל ציור של המסך שמסביבו. */
    if (wantGuide) {
      var box = $('gu-here');
      if (box) GUIDE_UI.mount(box, function () { draw(); });
    }
    wire();
    $('asksheet').scrollTop = 0;
  }

  /* ---------- שלב 1 ---------- */
  function who() {
    var me = get() || {}, d = draft;
    me = { first: d.first != null ? d.first : (me.first || ''),
           last:  d.last  != null ? d.last  : (me.last  || ''),
           grade: d.grade != null ? d.grade : (me.grade || ''),
           klass: d.klass != null ? d.klass : (me.klass || '') };
    var h = kick(1, t('askWhoH'), t('askWhoB')) +
      '<div class="fld"><label class="label" for="r-first">' +
        esc(t('askName')) + '</label>' +
        '<input id="r-first" type="text" autocomplete="given-name" value="' +
        esc(me.first || '') + '"></div>' +
      '<div class="fld"><label class="label" for="r-last">' +
        esc(t('askLast')) + '</label>' +
        '<input id="r-last" type="text" autocomplete="family-name" value="' +
        esc(me.last || '') + '"></div>';

    /* שכבה וכיתה נשאלות רק ממי שיש לו כיתה. ראש חטיבה אחראי
       על כולן, ושדה שאין לו תשובה נכונה הוא שדה שמעכב. */
    if (C.klass) {
      var opts = function (list, cur) {
        return '<option value="">—</option>' + list.map(function (g) {
          return '<option' + (g === cur ? ' selected' : '') + '>' + esc(g) + '</option>';
        }).join('');
      };
      var cls = [], i;
      for (i = 1; i <= 12; i++) cls.push(String(i));
      h += '<div class="fld"><label class="label">' + esc(u('clsLabel')) +
        ' <i>· ' + esc(t('askClsH')) + '</i></label>' +
        '<div class="pair">' +
        '<select id="r-grade">' + opts(C.grades || [], me.grade) + '</select>' +
        '<select id="r-klass">' + opts(cls, me.klass) + '</select></div></div>';
    }
    return h + '<button class="as-go" id="r-next">' + esc(t('askNext')) + '</button>' +
      (err ? '<div class="as-err">' + esc(err) + '</div>' : '');
  }

  /* ---------- שלב 2 ---------- */
  function install() {
    if (APPX.inApp()) {
      return kick(2, t('askInstH'), '') +
        '<div class="as-err" style="background:rgba(192,143,43,.12);' +
        'border-color:rgba(192,143,43,.35);color:var(--ink)">' +
        '<b>' + esc(u('inAppH')) + '</b><br>' + esc(u('inAppB')) + ' ' +
        esc(u(APPX.isIOS() ? 'inAppIos' : 'inAppNot')) + '</div>';
    }
    if (APPX.wasAdded() && !APPX.installed()) {
      /* **ולמצב הזה חייבת להיות יציאה.** עד שהתגיות של אייפון
         נוספו, אייקון שנוצר שם לא נפתח כאפליקציה — ולכן המסך
         הזה חזר שוב ושוב גם אחרי שהוא פתח את האייקון. */
      return kick(2, t('askInstH'), '') +
        '<p>' + u('addedH') + '</p>' + APPX.icon() +
        (APPX.isIOS() ? '<p class="as-sub">' + esc(t('askAgain')) + '</p>' : '') +
        '<button class="as-thin" id="r-skip">' + esc(t('askSkip')) + '</button>';
    }
    var h = kick(2, t('askInstH'), t('askInstB'));
    /* ============================================================
       כפתור אמיתי אם יש, ואם אין — מדריך מאויר.
       ============================================================
       באנדרואיד הדפדפן מציע להתקין בעצמו, וכפתור אחד עדיף על
       כל הסבר. באייפון אין הצעה כזו ולעולם לא תהיה, ושם
       ההוראות הן כל מה שיש — ולכן שם הן מאוירות, מסך אחד
       לכל פעולה. ראו `guide.js`. */
    if (APPX.bip()) {
      return h + '<button class="as-go" id="r-inst">' + esc(u('instBtn')) +
        '</button>' +
        '<button class="as-thin" id="r-skip">' + esc(t('askSkip')) + '</button>';
    }
    return h + '<div class="as-guide" id="gu-here"></div>' +
      '<div class="as-help"><b>' + esc(gu('help')) + '</b><br>' +
      esc(gu('helpB')) + '</div>' +
      '<button class="as-thin" id="r-skip">' + esc(t('askSkip')) + '</button>';
  }

  /* ---------- שלב 3 ---------- */
  function note() {
    if (!APPX.canNote() || APPX.perm() === 'denied') {
      return kick(3, t('askNoteH'), '') +
        '<p>' + u('noteOff', { how: APPX.unblock() }) + '</p>' +
        '<button class="as-thin" id="r-later">' + esc(t('askLater')) + '</button>';
    }
    return kick(3, t('askNoteH'), t('askNoteB')) +
      '<button class="as-go g" id="r-note"' + (busy ? ' disabled' : '') + '>' +
      esc(busy ? u('busy') : t('askNoteGo')) + '</button>' +
      (err ? '<div class="as-err">' + esc(err) + '</div>' : '') +
      '<button class="as-thin" id="r-later">' + esc(t('askLater')) + '</button>';
  }

  /* ---------- מי שלא הצליח להתקין ----------
     עד עכשיו "לא מצליח להתקין" העביר אותו לשלב ההתראות — וזה
     היה חסר טעם: בלי אפליקציה על מסך הבית אין התראות באייפון
     בכלל, ולכן הוא היה מאשר משהו שלעולם לא יגיע אליו. עכשיו
     זו דלת אמיתית: נרשם שהוא נתקע, והוא נשאר עם משפט אחד
     שאומר מי יחזור אליו. */
  function help() {
    return '<div class="as-v">✉</div><h2>' + esc(u('helpH')) + '</h2>' +
      '<p>' + esc(u('helpB')) + '</p>' +
      '<button class="as-go" id="r-done">' + esc(u('close')) + '</button>';
  }

  function fin() {
    return '<div class="as-v">✓</div><h2>' + esc(t('askFinH')) + '</h2>' +
      '<p>' + esc(t('askFinB')) + '</p>' +
      '<button class="as-go" id="r-done">' + esc(u('close')) + '</button>';
  }

  /* ---------- חיווט ---------- */
  function wire() {
    var b;
    if ((b = $('r-go')))   b.onclick = function () { err = ''; go(1); };
    if ((b = $('r-done'))) b.onclick = close;
    /* "לא עכשיו" סוגר את המסך. השורה נשארת בעמוד — היא אינה
       קופצת עליו, ולכן אין ממה להסתיר אותה.

       ומי שוויתר בשלב העדכונים עבר את התהליך בדיוק כמו מי
       שאישר, ולכן גם הוא ממשיך הלאה. */
    if ((b = $('r-later'))) b.onclick = function () {
      if (step === 3) markSeen();
      close();
    };
    if ((b = $('r-next'))) b.onclick = save;
    if ((b = $('r-inst'))) b.onclick = function () {
      APPX.prompt(function () { go(where()); });
    };
    if ((b = $('r-skip'))) b.onclick = function () {
      skipped = true;
      /* הכתיבה אטומה ואינה ראיה לכלום, ולכן המסך אינו מבטיח
         "דיווחנו" אלא "נחזור אליך" — וזה נכון בין אם השורה
         נכתבה ובין אם לא, כי אחיאסף רואה אותו ברשימת המוסדות
         ממילא. */
      post('לא הצליח להתקין', null);
      go(5);
    };
    if ((b = $('r-note'))) b.onclick = ask;
  }

  function save() {
    var first = ($('r-first').value || '').trim();
    var last  = ($('r-last').value || '').trim();
    var grade = C.klass ? $('r-grade').value : '';
    var klass = C.klass ? $('r-klass').value : '';
    /* שומרים לפני שבודקים: ציור מחדש שמוחק את מה שהוקלד הופך
       הודעת שגיאה לעונש. */
    draft = { first: first, last: last, grade: grade, klass: klass };
    if (first.length < 2) { err = u('errFirst'); draw(); return; }
    if (last.length < 2)  { err = u('errLast'); draw(); return; }
    if (C.klass && (!grade || !klass)) {
      err = u('errClass'); draw(); return;
    }
    err = '';
    var ir = inst();
    set({ id: id(), first: first, last: last, grade: grade, klass: klass,
          inst: ir ? ir.code : '', instName: ir ? ir.name : '',
          at: new Date().toISOString() });
    post('רשום', null);
    go(where());
  }

  /* הכתיבה `no-cors` ואטומה ואינה ראיה לכלום — ולכן שום מסך
     כאן אינו אומר "נרשמת". העדכון עצמו הוא האישור. */
  function post(res, sub, when) {
    var me = get() || {};
    var url = '';
    try { url = localStorage.getItem('dfApi') || ''; } catch (e) {}
    if (!url && typeof APPS_SCRIPT_URL !== 'undefined') url = APPS_SCRIPT_URL;
    if (!url) return Promise.reject(new Error('אין כתובת שרת'));
    return fetch(String(url).trim(), {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'row', tab: 'התראות',
        cols: JSON.stringify([
          ['מזהה', me.id || ''], ['שם', name(me)],
          ['ישיבה', me.instName || ''], ['קוד ישיבה', me.inst || ''],
          ['תפקיד', C.role],
          ['שכבה', me.grade || ''], ['כיתה', me.klass || ''],
          ['מכשיר', APPX.isIOS() ? 'אייפון' : 'אנדרואיד'],
          ['מנוי', sub ? JSON.stringify(sub) : ''],
          ['תוצאה', res],
          ['מועד', when || (C.when ? C.when() : '')],
          ['מתי', new Date().toISOString()]
        ])
      })
    });
  }

  function ask() {
    err = ''; busy = true; draw();
    APPX.ask(function (p) {
      if (p !== 'granted') {
        busy = false;
        err = u(p === 'denied' ? 'errDenied' : 'errNoPerm');
        draw(); return;
      }
      APPX.subscribe().then(function (sub) {
        return post('נרשם', sub);
      }).then(function () {
        try { localStorage.setItem(k('Note'), '1'); } catch (e) {}
        markSeen();
        busy = false; go(4);
      })['catch'](function (e) {
        busy = false;
        err = u('errSave', { err: (e && e.message) || e });
        draw();
      });
    });
  }

  /* ============================================================
     המבנה והעיצוב — נושאים את עצמם.
     ============================================================
     עמוד שמשתמש בזה צריך אלמנט ריק אחד ושתי שורות קוד. שום
     דבר כאן אינו צריך להיות מועתק לעמוד, ולכן אין מה לשכוח
     ביום שעמוד שלישי ירצה אותו. */
  /* ============================================================
     העיצוב — הועתק מילה במילה מעמוד הצוות.
     ============================================================
     הוא נבדק בשטח ועבד, ולכן ההוצאה לכאן אינה הזדמנות לעצב
     אותו מחדש: עמוד הצוות חייב להיראות אחריה בדיוק כפי
     שנראה לפניה. ============================================ */
  var CSS = [
    "/* שורה אחת וחץ. לא כרטיס, לא פס, ולא רוחב מלא — מה שיש",
    "   לומר נאמר במסך שנפתח. הזהב הבהיר הוא הזמנה; הכחול הכבד",
    "   של האפליקציה הוא הכרזה, וזו בקשה. */",
    ".askrow{display:flex;align-items:center;gap:12px;width:auto;",
    "  margin:0 auto;padding:15px 18px;border:1px solid rgba(192,143,43,.4);",
    "  border-radius:999px;background:linear-gradient(135deg,#FDF6E6,#FAF0DA);",
    "  color:var(--ink);font-family:inherit;font-size:1rem;font-weight:800;",
    "  letter-spacing:-.02em;cursor:pointer;",
    "  box-shadow:0 2px 10px rgba(192,143,43,.16)}",
    ".askrow .ar-go{flex:0 0 auto;display:flex;align-items:center;gap:7px;",
    "  padding:7px 8px 7px 13px;border-radius:999px;background:var(--gold);",
    "  color:#fff;font-size:.86rem;font-weight:800;line-height:1}",
    ".askrow .ar-go i{font-style:normal}",
    ".askrow .ar-go b{font-size:1.05rem;line-height:1}",
    "#ask-sec{text-align:center}",
    "",
    "/* המסך שנפתח. מסך מלא ולא חלונית: בקשה שמציצה מעל תוכן אחר",
    "   מתחרה בו, ומה שנאמר כאן אינו יכול להיקרא בחצי עין. */",
    ".asksheet{position:fixed;inset:0;z-index:70;background:var(--paper);",
    "  overflow-y:auto;-webkit-overflow-scrolling:touch;",
    "  animation:asIn .3s ease both}",
    "@keyframes asIn{from{opacity:0}to{opacity:1}}",
    ".as-in{max-width:520px;margin-inline:auto;padding:56px 18px 48px;",
    "  position:relative}",
    ".as-head{display:flex;align-items:center;gap:11px;margin:0 0 22px;",
    "  justify-content:center}",
    ".as-head .m{flex:0 0 auto;width:46px;height:46px;border-radius:50%;",
    "  background:#fff;box-shadow:var(--sh-1);display:flex;align-items:center;",
    "  justify-content:center;overflow:hidden}",
    ".as-head .m img{width:34px;height:34px;object-fit:contain;display:block}",
    ".as-head b{display:block;font-size:.98rem;font-weight:800;line-height:1.25;",
    "  letter-spacing:-.02em;color:var(--blue-d)}",
    ".as-head .yr{display:block;font-size:.72rem;font-weight:800;",
    "  color:var(--gold-t);margin-top:3px}",
    ".as-x{position:absolute;inset-inline-end:14px;top:12px;width:38px;height:38px;",
    "  border:0;border-radius:50%;background:var(--sunk);color:var(--ink-2);",
    "  font-size:1rem;font-weight:800;font-family:inherit;cursor:pointer}",
    "",
    "/* שלושת השלבים — אותן מידות בדיוק של מסך התלמיד. הן נבדקו",
    "   מול אנשים ועבדו, ואין סיבה שר\"ם יקבל משהו צפוף יותר. */",
    ".as-body{font-size:16px;line-height:1.7;color:var(--ink)}",
    ".as-bar{display:flex;align-items:center;gap:7px;justify-content:center;",
    "  margin:0 0 20px}",
    ".as-bar i{width:34px;height:5px;border-radius:3px;background:var(--rule)}",
    ".as-bar i.on{background:var(--gold)}",
    ".as-bar i.did{background:var(--green)}",
    ".as-done{display:flex;align-items:center;gap:10px;padding:13px 18px;",
    "  margin-bottom:10px;background:rgba(74,130,28,.09);",
    "  border:1px solid rgba(74,130,28,.3);border-radius:12px;",
    "  font-size:.92rem;font-weight:700;color:var(--green-2)}",
    ".as-done b{font-size:1.05rem}",
    ".as-card{background:var(--surface);border:2px solid var(--gold);",
    "  border-radius:16px;padding:24px 22px 26px;",
    "  box-shadow:0 8px 26px rgba(11,37,80,.12)}",
    ".as-card.fin{text-align:center}",
    ".as-kick{font-size:.78rem;font-weight:800;color:var(--gold);",
    "  letter-spacing:.04em;margin-bottom:7px}",
    ".as-card h2{margin:0;font-size:1.16rem;font-weight:800;",
    "  letter-spacing:-.02em;line-height:1.45}",
    ".as-card > p{margin:11px 0 0;font-size:.95rem;color:var(--ink-2);",
    "  line-height:1.75;font-weight:600}",
    ".as-card > p b{color:var(--ink);font-weight:800}",
    /* המדריך המאויר יושב בתוך הכרטיס, ולכן מקבל ממנו אוויר
       ולא מסגרת משלו. */
    ".as-guide{margin-top:18px}",
    ".as-help{margin-top:16px;padding-top:14px;",
    "  border-top:1px solid var(--rule);font-size:.84rem;font-weight:600;",
    "  color:var(--ink-3);line-height:1.65;text-align:center}",
    ".as-help b{color:var(--ink-2);font-weight:800}",
    ".as-card .fld{margin-top:18px}",
    ".as-card .label{display:block;font-size:.9rem;font-weight:800;",
    "  color:var(--ink);margin-bottom:6px}",
    ".as-card .label i{font-style:normal;font-weight:600;color:var(--ink-3)}",
    ".as-card input,.as-card select{width:100%;padding:15px;font-family:inherit;",
    "  font-size:1.02rem;font-weight:700;border:1.5px solid var(--rule);",
    "  border-radius:12px;background:#fff;color:var(--ink)}",
    ".as-card .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
    ".as-card .hint{margin-top:7px;font-size:.83rem;font-weight:600;",
    "  color:var(--ink-3);line-height:1.6}",
    ".as-go{display:block;width:100%;margin-top:20px;padding:16px;border:0;",
    "  border-radius:12px;background:var(--blue);color:#fff;font-family:inherit;",
    "  font-weight:800;font-size:1.02rem;cursor:pointer}",
    ".as-go.g{background:var(--green-d)}",
    ".as-thin{display:block;width:100%;margin-top:10px;padding:12px 6px;border:0;",
    "  background:none;color:var(--ink-2);font-family:inherit;font-size:.9rem;",
    "  font-weight:700;text-decoration:underline;cursor:pointer;line-height:1.6}",
    "/* שורת מוצא שקטה — נאמרת רק למי שבאמת נתקע, ולכן היא אינה",
    "   מתחרה בהוראה הראשית שמעליה. */",
    ".as-sub{margin-top:12px;font-size:.84rem;font-weight:600;",
    "  color:var(--ink-3);line-height:1.7}",
    ".as-err{margin-top:14px;background:#F7E4E2;border:1px solid #E2BDB8;",
    "  border-radius:12px;padding:13px 15px;font-size:.88rem;font-weight:700;",
    "  color:#7E2C23;line-height:1.7}",
    ".as-v{width:64px;height:64px;border-radius:50%;background:var(--green-d);",
    "  color:#fff;font-size:2rem;line-height:64px;margin:0 auto 16px;",
    "  font-weight:800;text-align:center}",
    "/* הסמלים וההוראות מגיעים מ-getapp.js, וצריכים את הסגנון שלהם. */",
    ".gsteps{margin:20px 0 0;padding:0;list-style:none;counter-reset:gs}",
    ".gsteps li{counter-increment:gs;position:relative;padding-inline-start:38px;",
    "  margin-bottom:16px;font-size:.97rem;font-weight:600;line-height:1.8}",
    ".gsteps li:last-child{margin-bottom:0}",
    ".gsteps li::before{content:counter(gs);position:absolute;inset-inline-start:0;",
    "  top:3px;width:26px;height:26px;border-radius:50%;background:var(--blue);",
    "  color:#fff;font-size:.82rem;font-weight:800;display:flex;",
    "  align-items:center;justify-content:center}",
    ".gl{display:inline-flex;align-items:center;justify-content:center;",
    "  width:30px;height:30px;border-radius:8px;background:var(--sunk);",
    "  border:1px solid var(--rule);vertical-align:-9px;margin:0 4px}",
    ".gl svg{width:17px;height:17px;fill:none;stroke:var(--blue);",
    "  stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}",
    ".apic{margin-top:16px;display:flex;flex-direction:column;align-items:center;",
    "  gap:7px}",
    ".apic img{width:56px;height:56px;border-radius:14px;display:block;",
    "  box-shadow:0 4px 14px rgba(11,37,80,.22)}",
    ".apic span{font-size:.72rem;font-weight:800;color:var(--ink-2)}"
  ].join('\n');

  /* המבנה — גם הוא כפי שהיה בעמוד הצוות. */
  var HTML =
    '<section id="ask-sec">' +
      '<button class="askrow" id="askrow" hidden>' +
        '<span id="ar-t"></span>' +
        '<span class="ar-go"><i id="ar-go"></i><b aria-hidden="true">\u2190</b></span>' +
      '</button>' +
    '</section>' +
    '<div class="asksheet" id="asksheet" hidden>' +
      '<div class="as-in">' +
        '<button class="as-x" id="as-x" aria-label="ASKCLOSE">\u2715</button>' +
        /* מסך מלא הוא מסך, ומסך נושא את החתימה של התוכנית:
           הסמל העגול, השם והשנה. פנייה אישית בלי זהות נראית
           כמו חלונית שקפצה, ולא כמו מכתב מהתוכנית. */
        '<div class="as-head">' +
          '<span class="m"><img id="as-mark" alt=""></span>' +
          '<div><b>הדף השבועי<br>של בני עקיבא</b>' +
          '<span class="yr">שנת תשפ״ז</span></div>' +
        '</div>' +
        '<div class="as-body" id="as-body"></div>' +
      '</div>' +
    '</div>';

  function mount(where) {
    var host = $(where);
    if (!host) return;
    /* פעם אחת. המסך שמחזיק את הבקשה מצויר מחדש (מסך ההרשמה
       נבנה כל פעם מאפס), והשתלה חוזרת הייתה מוסיפה עוד עותק
       של כל הסגנון בכל ציור. */
    if (!document.getElementById('ask-css')) {
      var st = document.createElement('style');
      st.id = 'ask-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    /* התבנית קבועה, והמלל מגיע מ-data.js — ולכן הכיתוב לקורא
       המסך מוחלף כאן ולא נכתב לתוכה. */
    host.innerHTML = HTML.replace('ASKCLOSE', esc(u('close')));
  }

  /* ============================================================ */
  function init(cfg) {
    C = cfg;
    mount(cfg.mount);
    var b = $('askrow'); if (b) b.onclick = open;
    if ($('as-x')) $('as-x').onclick = close;
    /* הפס נבדק כשמצב ההתקנה משתנה, ומצויר פעם אחת. */
    if (window.APPX && APPX.onBip) {
      APPX.onBip(function () {
        if ($('asksheet') && !$('asksheet').hidden) draw();
      });
    }
    bar();
  }

  /* ---- פתיחה על שלב מסוים, לעורך המלל בלבד ----
     `err` מקבל ערך כדי שגם הודעת השגיאה תצויר ותהיה ניתנת
     להקשה. אחרת היא נוסח שאי אפשר להגיע אליו בשום דרך חוץ
     מלטעות בכוונה. */
  function at(n, withErr) {
    peek = true;
    step = n;
    err = withErr ? (window.ASK_UI && ASK_UI[withErr]) || '' : '';
    if ($('asksheet')) $('asksheet').hidden = false;
    document.body.style.overflow = 'hidden';
    draw();
  }

  return { init:init, bar:bar, open:open, close:close, draw:draw,
           get:get, set:set, name:name, noted:noted, seen:seen,
           markSeen:markSeen, where:where, post:post, id:id, at:at };
})();
