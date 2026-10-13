var accSt = "", accPh = true, accBusy = false, accPhSent = false, accPosted = false;

function accCheck(force, after) {
  var fin = function () { if (after) after(); };
  var code = myBoard();
  var me = typeof ASK !== 'undefined' && ASK.get ? ASK.get() : null;
  if (!code || !me || !me.id || me.inst !== code) return fin();
  if (!(ASK.seen && ASK.seen())) return fin();
  var url = (CFG.api || API || '').trim();
  if (!url || accBusy) return fin();
  /* `accAt2` - מפתח חדש, כדי שכל מכשיר יישאל מיד אחרי העדכון
     שבו הגישה עברה לאישור בלבד. */
  var has = !!instCode(code), last = Store.get('accAt2', 0);
  /* מי שכבר יש לו קוד - נבדק לעיתים רחוקות, רק כדי שנעילה תתפוס. */
  if (!force && Date.now() - last < (has ? 3600000 : 60000)) return fin();
  accBusy = true;
  Store.set('accAt2', Date.now());
  scriptGet({ acc: code, dev: me.id, has: has ? '1' : '0' }).then(function (d) {
    accBusy = false;
    if (!d || !d.status) return fin();
    var was = accSt;
    if (d.status === 'ok' && d.k) {
      accSt = 'ok';
      if (d.k !== instCode(code)) { setInstCode(code, d.k); codeBad = false; renderBoard(); accRe(); }
      return fin();
    }
    /* קוד בלי אישור אינו שווה דבר - יורד מהמכשיר, והמסך עובר
       להמתנה. ההתראה לרכז יוצאת מהשרת ברגע השאלה. */
    if (has) { var m = Store.get('instCodes', {}) || {}; delete m[code]; Store.set('instCodes', m); renderBoard(); has = false; }
    if (d.status === 'locked') {
      /* נעול - שום שם לא נשאר במכשיר, גם לא אחרי רענון. */
      if (was !== 'locked') LOCK.reset();
      accSt = 'locked';
      LOCK.wipe(); renderBoard();
    } else {
      accSt = 'wait';
      /* השורה ב"התראות" עוד לא נכתבה (או נכתבה בלי טלפון) -
         כותבים אותה שוב, פעם אחת לביקור. */
      if (d.status === 'none' && !accPosted && ASK.post) { accPosted = true; ASK.post('רשום', null); }
    }
    accPh = d.phone !== false;
    if (!has && (was !== accSt || !accPh || accSt === 'locked')) accRe();
    fin();
  }).catch(function () { accBusy = false; fin(); });
}
/* **מי שממתין מול המסך - רואה את האישור בלי לפתוח מחדש.** כל חצי
   דקה, רק כשהאזור האישי פתוח ובחזית, ורק עד שמגיע הקוד. וכשחוזרים
   לאפליקציה (מההתראה, או סתם) - בודקים מיד. */
function accWaiting() {
  return accSt === 'wait' && document.visibilityState !== 'hidden' &&
    !!document.querySelector('#v-my.on') && !instCode(myBoard());
}
setInterval(function () { if (accWaiting()) accCheck(true); }, 30000);
document.addEventListener('visibilitychange', function () { if (accWaiting()) accCheck(true); });

function accRe() {
    if (document.querySelector("#v-my.on")) renderMy();
}

function accWaitHtml() {
    var h = '<div class="my-note my-wait"><b>' + esc(PANEL.waitH) + "</b>" + "<span>" + esc(PANEL.waitB) + "</span>";
    if (accSt === "wait" && !accPh) {
        h += accPhSent ? '<span style="margin-top:10px;color:var(--ok)">' + esc(PANEL.waitOk) + "</span>" : '<label for="acc-ph" style="display:block;margin-top:12px;font-size:.82rem;font-weight:800">' + esc(PANEL.waitPh) + "</label>" + '<input id="acc-ph" type="tel" inputmode="tel" autocomplete="tel" style="margin-top:6px">' + '<button class="btn p" onclick="accPhone()">' + esc(PANEL.waitGo) + "</button>";
    }
    return h + "</div>";
}

function accPhone() {
    var el = document.getElementById("acc-ph");
    var v = el ? (el.value || "").trim() : "";
    if (v.replace(/[^0-9]/g, "").length < 9) {
        alert(ASK_UI.errPhone);
        return;
    }
    var me = ASK.get() || {};
    me.phone = v;
    ASK.set(me);
    ASK.post("רשום", null);
    accPhSent = true;
    accRe();
    setTimeout(function() {
        accCheck(true);
    }, 4e3);
}
/* מי שננעל - המסך המשותף (lock.js). "איש צוות" מחזיר אותו למסך
   ההמתנה הרגיל, שבודק את עצמו כל חצי דקה. */
LOCK.init({
  get: function (q) { return scriptGet(q); },
  me: function () { return (typeof ASK !== 'undefined' && ASK.get && ASK.get()) || {}; },
  savePhone: function (v) {
    var me = ASK.get() || {};
    me.phone = v; ASK.set(me);
    ASK.post('רשום', null);
  },
  paint: function () { accRe(); },
  onWait: function (d) {
    accSt = 'wait'; accPh = d.phone !== false; accPhSent = false;
    Store.set('attR', null);
    accRe();
  }
});

/* ============================================================
   נוכחות בשיעור - אצל איש הצוות.
   ============================================================
   אותה עמדה שהרכז פותח בניהול, עם שני הבדלים: הרשימה מגיעה
   מהשרת - רק תלמידי הישיבה שהמכשיר אושר אליה, ורק שם, שכבה
   וכיתה (netroster) - והרישום עובר בזהות המכשיר ולא בסיסמה.
   בפעם הראשונה: הסבר קצר, עם ההמלצה לתת לתלמידים לסמן את עצמם.
   הרשימה נשמרת במכשיר רק כגיבוי לשיעור בלי רשת. */
var attIntroOn = false, attMsg = '';
/* איש צוות אחראי על כל הישיבה - כל הכיתות של השכבות שבתוכנית. */
var ATT_GRADES = ['ז', 'ח'];
function attHtml() {
  if (attIntroOn) {
    return '<div class="my-sec"><h3>' + esc(PANEL.attIntroH) + '</h3>' +
      String(PANEL.attIntro).split('\n').map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn p" onclick="attOpen(true)">' + esc(PANEL.attGo) + '</button>' +
      '<button class="btn g" onclick="attIntroOn=false;renderMy()">' + esc(PANEL.attLater) + '</button></div></div>';
  }
  return '<div class="my-sec"><button class="btn p" style="width:100%;font-size:1.08rem" onclick="attOpen()">' +
    esc(PANEL.attBtn) + '</button><p>' + esc(attMsg || PANEL.attSub) + '</p>' +
    '<button class="btn g" onclick="attIntroOn=true;renderMy()">' + esc(PANEL.attHow) + '</button></div>';
}
function attOpen(fromIntro) {
  var code = myBoard(), me = typeof ASK !== 'undefined' && ASK.get ? ASK.get() : null;
  if (!code || !me || !me.id || !instCode(code)) return;
  if (!fromIntro && !Store.get('attIntro', 0)) { attIntroOn = true; renderMy(); return; }
  Store.set('attIntro', 1);
  attIntroOn = false; attMsg = PANEL.attLoad; renderMy();
  var go = function (r) {
    attMsg = '';
    AMDA_STAFF = { inst: code, dev: me.id, r: r };
    amdaSt.slot = ''; amdaSt.kind = '';
    amdaOpen('d');
  };
  scriptGet({ netroster: code, dev: me.id }).then(function (d) {
    if (!d || d.status !== 'ok') {
      /* האישור בוטל - גם הגיבוי במכשיר יורד. */
      if (d && (d.status === 'locked' || d.status === 'wait' || d.status === 'unknown')) Store.set('attR', null);
      attMsg = (d && d.message) || PANEL.attFail; renderMy(); return;
    }
    var r = { at: Date.now(), inst: code, g: {} };
    (d.rows || []).forEach(function (x) {
      var g = String(x[0] || ''), c = String(x[1] || ''), n = String(x[2] || '');
      if (!n || !c || ATT_GRADES.indexOf(g) < 0) return;
      if (!r.g[g]) r.g[g] = {};
      (r.g[g][c] = r.g[g][c] || []).push(n);
    });
    Object.keys(r.g).forEach(function (g) {
      Object.keys(r.g[g]).forEach(function (c) { r.g[g][c].sort(function (a, b) { return a.localeCompare(b, 'he'); }); });
    });
    if (!amdaCount(r).n) { attMsg = PANEL.attNone; renderMy(); return; }
    Store.set('attR', r);
    go(r);
  })['catch'](function () {
    var r = Store.get('attR', null);
    if (r && r.inst === code && amdaCount(r).n) go(r);
    else { attMsg = PANEL.attFail; renderMy(); }
  });
}

function renderMy() {
  var el = document.getElementById('my-body');
  if (!el) return;
  var inst = myInstRow();
  /* בלי ישיבה אין מה לנהל. מי שהגיע לכאן בטעות חוזר הביתה. */
  if (!inst) { show('home'); return; }
  var code = inst.code;

  /* ============================================================
     **קודם התהליך, ואז האזור.**
     ============================================================
     "עד שנכנסים לשם פשוט יופיע כל התהליך שראש החטיבה עובר -
     ההודעה הראשית ואז שלבי ההתקנה - ורק בסוף התהליך הזה הוא
     יקבל את האזור האישי."

     ולכן אין יותר "בקשה אישית" שמרחפת במסך אחר. הכפתור הזה
     הוא הדלת היחידה, ומה שמאחוריה משתנה לפי מי שנכנס: מי
     שעדיין לא עבר - עובר; מי שעבר - מנהל.

     `ASK` עצמו הוא התהליך. הוא יודע באיזה שלב הוא, והוא זה
     שמסמן שהסתיים. ============================================ */
  renderBoard();                       /* מאתחל את ASK - ראו שם */
  if (!(typeof ASK !== 'undefined' && ASK.seen && ASK.seen())) {
    el.innerHTML =
      '<div class="my-top"><b>' + esc(PANEL.title) + '</b>' +
      '<span>' + esc(inst.name) + '</span></div>' +
      '<div id="my-flow"></div>';
    askSetup('my-flow');
    /* ============================================================
       **נפתח ישר, בלי "ועוד - בקשה אישית אליך".**
       ============================================================
       "ביקשתי שהכפתור של הבקשה האישית לא יופיע אצל ראש חטיבה,
       ואני רואה שהוא עדיין מופיע כשלב מסוים. למחוק את השלב."

       הפס הזה הוא הזמנה - והוא נכון לר"ם, שפוגש אותו באמצע
       עמוד שהוא קורא. ראש חטיבה שלחץ "אזור הניהול האישי" כבר
       אמר מה הוא רוצה, ושאלה נוספת באמצע היא עוד דלת לפתוח.
       ============================================================ */
    var bar = document.getElementById('askrow');
    if (bar) bar.hidden = true;
    if (ASK.open) ASK.open();
    return;
  }

  /* נעול - רק "אתה איש צוות או תלמיד?". בלי לוח, בלי שליחה. */
  if (accSt === 'locked' && !instCode(code)) {
    el.innerHTML =
      '<div class="my-top"><b>' + esc(PANEL.title) + '</b>' +
      '<span>' + esc(inst.name) + '</span></div>' +
      '<div class="my-sec bare">' + LOCK.html() + '</div>';
    accCheck();
    return;
  }

  el.innerHTML =
    '<div class="my-top"><b>' + esc(PANEL.title) + '</b>' +
    '<span>' + esc(inst.name) + '</span></div>' +

    /* נוכחות בשיעור - ראשונה: זה מה שעושים בכל שיעור. רק אחרי האישור. */
    (instCode(code) ? attHtml() : '') +

    /* עד האימות - ההודעה במקום השמות וההודעה לתלמידים. */
    (instCode(code) ? '' : '<div class="my-sec">' + accWaitHtml() + '</div>') +

    /* ============================================================
       **אין עדיין אף תלמיד - אין לוח.**
       ============================================================
       "כל הבאנר הזה מהלוח ומטה מיותר בשלב שאין אפילו תלמיד אחד."
       לוח של אפסים ו"לראות פירוט" שמוביל לרשימה ריקה הם שני
       דברים לקרוא בלי שום דבר לעשות איתם. מה שיש לעשות עכשיו
       הוא לשלוח - ולכן כרטיס השליחה, והלוח מופיע עם הראשון.
       ============================================================ */
    (myKids(code) ? '<div class="my-sec"><h3>' + esc(PANEL.brdH) + '</h3>' +
      '<p>' + esc(PANEL.brdSub) + '</p>' +
      '<div id="my-brd"></div></div>' : '') +

    /* לכרטיס ההודעה יש כותרת משלו - `sayHtml()` - ולכן אין
       לו כותרת שנייה כאן. שתי כותרות זו מעל זו על אותו
       כרטיס נקראות כמו תקלה. */
    '<div class="my-sec bare"><div id="my-say"></div></div>' +

    /* שליחת הקישור - תמיד כאן, והשלב האחרון של המסע מצביע עליה. */
    '<div class="my-sec">' + shareHtml(code, inst.name) + '</div>' +

    /* העדכונים - רק כשיש מה לעשות איתם. פעילים = אין כרטיס. */
    (myNoteOn() ? '' : '<div class="my-sec"><h3>' + esc(PANEL.noteH) + '</h3>' +
      '<div id="my-note"></div></div>');

  /* ============================================================
     **הלוח של הבית מצויר קודם, גם כשלא רואים אותו.**
     ============================================================
     `renderBoard` הוא מה שמאתחל את `ASK` - ובלי זה `sayPaint`
     שואל על משתמש שאין לו מפתח, מקבל "לא השלים", ומסתיר את
     הכרטיס דווקא ממי שכן. האלמנטים שלו יושבים במסמך גם כשהמסך
     שלהם אינו המסך הפעיל, ולכן זה בטוח וזול.

     מי שנכנס לכאן ישירות מקישור - ולא דרך מסך הבית - הוא
     בדיוק המקרה שנשבר בלעדיו. */
  var brd = document.getElementById('my-brd');
  if (brd) brd.innerHTML = boardHtml(code, inst.name);
  sayPaint();
  myNote();
  accCheck();
}

/* ============================================================
   העדכונים - הצנוע מבין השלושה.
   ============================================================
   מה שיש כאן הוא מצב ומתג, ולא לוח זמנים: בחירת ימים ושעות
   קיימת היום לר"ם בלבד, בעמוד הצוות. להעתיק אותה לכאן בלי
   שנשב על זה זה להבטיח מסך שלא נבדק בשטח.
   ============================================================ */
/* ============================================================
   **"העדכונים פעילים" - לפי האדם, לא לפי הלשונית.**
   ============================================================
   "אדם שהפעיל עדכונים ועדיין יש לו את ההודעה למטה." באנדרואיד
   האפליקציה המותקנת ולשונית הכרום חולקות את האחסון אבל לא את
   ההרשאה: מי שאישר באפליקציה ופתח בכרום ראה "כבויים", וכפתור
   שבלשונית הזו אינו יכול לעשות דבר. הרישום (ASK.noted) הוא
   העדות - המנוי נשמר בשרת מהאפליקציה. אותו מבחן של המסע.
   ============================================================ */
function myNoteOn() {
  return !!((window.APPX && APPX.perm && APPX.perm() === 'granted') ||
            (typeof ASK !== 'undefined' && ASK.noted && ASK.noted()));
}
/* כמה תלמידים הצטרפו מהישיבה - מהמונה הציבורי. */
function myKids(code) {
  var j = code ? bJoin(code) : null;
  return j ? (j.n || 0) : 0;
}
/* ============================================================
   **שליחת הקישור - לתלמידים, להורים ולר"מים.**
   ============================================================
   "שלראש צוות יהיה תמיד זמין כפתור של שליחה להורים או
   לתלמידים... בצורה של וואטסאפ." ובהמשך - גם הר"מים, שירדו
   לכאן מאמצע ההתקנה. ההודעות הן אותן הודעות שבכל מקום אחר
   (UI.linkWa, UI.dadWa, UI.teamWa), כדי שיהיה נוסח אחד.
   ============================================================ */
var WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.7l4.9-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.5z"/></svg>';
function shareHtml(code, name) {
  var row = function (ttl, sub, msg) {
    return '<a class="shr-b" target="_blank" rel="noopener" href="https://wa.me/?text=' +
      encodeURIComponent(msg) + '"><i>' + WA_SVG + '</i><span><b>' + esc(ttl) + '</b>' +
      '<small>' + esc(sub) + '</small></span></a>';
  };
  return '<div class="shr" id="my-share"><h3>' + esc(PANEL.shrH) + '</h3>' +
    '<p>' + esc(PANEL.shrB) + '</p>' +
    row(PANEL.shrKids, PANEL.shrKidsSub, fill(UI.linkWa, { inst:name, url:joinUrl(code) })) +
    row(PANEL.shrPar, PANEL.shrParSub, fill(UI.dadWa, { inst:name, url:joinUrl(code) + '&for=dad' })) +
    row(PANEL.shrRam, PANEL.shrRamSub, fill(UI.teamWa, { inst:name, url:tzevetUrl(code) })) +
    '</div>';
}
/* ההרשאה כפי שהייתה כשהכרטיס צויר - ראו `myNotePermWatch`. */
var myNotePerm = '';

function myNote() {
  var el = document.getElementById('my-note');
  if (!el) return;
  var on = myNoteOn();
  myNotePerm = (window.APPX && APPX.perm) ? APPX.perm() : '';
  el.innerHTML =
    '<div class="my-note' + (on ? ' on' : '') + '"><b>' +
    esc(on ? PANEL.noteOn : PANEL.noteOff) + '</b>' +
    '<span>' + esc(PANEL.noteSub) + '</span>' +
    (on ? '' : '<button class="btn g" id="my-note-go">' +
               esc(PANEL.noteGo) + '</button>' +
               /* חסום בדפדפן - הכפתור לא ישאל שוב. הדרך היא בהגדרות. */
               (window.APPX && APPX.perm && APPX.perm() === 'denied'
                 ? '<a href="hitraot.html" style="display:block;margin-top:8px;font-weight:800;' +
                   'font-size:.86rem;color:var(--blue)">' + esc(UI.hitLink) + '</a>' : '')) +
    '<div id="my-ask"></div></div>';
  var b = document.getElementById('my-note-go');
  /* ההפעלה היא שלב 3 של הבקשה האישית - אותו קוד, ולא עותק
     שני שיצא ממנו מסונכרן בחצי שנה. */
  /* ============================================================
     **הכפתור שלא הגיב.**
     ============================================================
     "הבחור לוחץ על הפעלת עדכונים וזה לא עובד." המסך של הבקשה
     יושב במסך הבית (`#ask-here`), ומסך הבית מוסתר כשאזור
     הניהול פתוח - ולכן הוא נפתח, אבל במקום שאי אפשר לראות.
     גם מי שחסום להתראות לא ראה את ההוראות לשחרור, וגם מי
     ששחרר לא ראה את כפתור האישור. משתילים אותו כאן, ליד
     הכפתור, לפני שפותחים. ============================================ */
  if (b) b.onclick = function () {
    if (typeof ASK === 'undefined' || !ASK.at) return;
    askSetup('my-ask');
    ASK.at(3);
  };
}

/* ============================================================
   **מי ששחרר את החסימה - רואה את זה בלי לרענן.**
   ============================================================
   "בנינו מנגנון שכל חצי דקה האפליקציה בודקת אם השתחררו
   העדכונים." הבדיקה של חצי הדקה שהייתה כאן בדקה רק את אישור
   הרכז (`accWaiting`), ולא את ההתראות: מי שהלך להגדרות, שחרר
   וחזר - מצא את אותו מסך בדיוק. עכשיו ההרשאה נבדקת כל חצי דקה
   וברגע שחוזרים לאפליקציה (משם חוזרים מההגדרות), ואם השתנתה -
   הכרטיס והמסך הפתוח מצוירים מחדש. הבדיקה מקומית, בלי רשת.
   ============================================================ */
function myNotePermWatch() {
  if (!document.querySelector('#v-my.on') || !document.getElementById('my-note')) return;
  if (!window.APPX || !APPX.perm) return;
  var p = APPX.perm();
  if (p === myNotePerm) return;
  var sh = document.getElementById('asksheet');
  /* המסך פתוח - מציירים רק אותו. האזור מצויר בסגירה (onClose). */
  if (sh && !sh.hidden && sh.getClientRects().length) {
    myNotePerm = p;
    if (typeof ASK !== 'undefined' && ASK.draw) ASK.draw();
    return;
  }
  if (myNoteOn()) accRe(); else myNote();
}
setInterval(myNotePermWatch, 30000);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') myNotePermWatch();
});

function countUp(el, to) {
    if (!el || to < 2) return;
    var t0 = 0, dur = 750;
    var step = function(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        el.firstChild.nodeValue = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
    };
    el.firstChild.nodeValue = "0";
    requestAnimationFrame(step);
}

function hailBoard() {
    show("my");
    var el = document.getElementById("my-body");
    if (!el) return;
    setTimeout(function() {
        el.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        var b = el.querySelector(".brd-hero b");
        if (b && b.firstChild) countUp(b, parseInt(b.firstChild.nodeValue, 10) || 0);
    }, 60);
}

function headName() {
    var me = typeof ASK !== "undefined" && ASK.get && ASK.get() || null;
    return me && me.first || "";
}

function headInst() {
    var c = myBoard();
    if (!c && typeof reg !== "undefined" && reg.inst && reg.inst !== "other") c = reg.inst;
    if (!c) c = urlInst;
    if (!c) return null;
    return INSTITUTIONS.filter(function(x) {
        return x.code === c;
    })[0] || null;
}

function headFem() {
    var i = headInst();
    return !!(i && i.fem);
}

function headT(k) {
    var v = "";
    if (headFem() && window.HEAD_ASK_F && HEAD_ASK_F[k]) v = HEAD_ASK_F[k]; else v = window.HEAD_ASK && HEAD_ASK[k] || "";
    if (v.indexOf("{name}") < 0) return v;
    var n = headName();
    return n ? v.split("{name}").join(n) : v.split(" {name}").join("").split("{name}").join("");
}

function askSetup(where) {
  var host = document.getElementById(where || 'ask-here');
  if (!host) return;
  if (host.getAttribute('data-on') && host.querySelector('#asksheet')) return;
  var code = myBoard();
  if (!code || typeof ASK === 'undefined') return;
  host.setAttribute('data-on', '1');
  ASK.init({
    mount: host.id,
    key:   'head',
    role:  headT('roleYeshiva'),
    /* לא רק ראש חטיבה - גם ראש הישיבה וגם רכז תורה לשמה עשויים
       למלא את המסך הזה. הבורר פותח מעצמו, וברירת המחדל היא
       הראשונה ברשימה. ראו `roleInit`/`roleNow` ב-ask.js. */
    roleOptions: [headT('roleYeshiva'), headT('roleChativa'), headT('roleRachez')],
    /* "איך לפנות אליך?" לפני הפנייה, ושדה טלפון (רשות). */
    whoFirst: true,
    phone: true,
    /* הטלפון הוא מה שהרכז מאמת לפני שנפתחים השמות - ראו accCheck. */
    phoneReq: true,
    t:     headT,
    klass: false,
    fem:   headFem(),
    inst:  function () {
      var c = myBoard();
      var i = INSTITUTIONS.filter(function (x) { return x.code === c; })[0];
      return i ? { code:i.code, name:i.name } : null;
    },
    /* **וכאן, ורק כאן, מותר לזוז.** התהליך האישי הסתיים,
       ומה שמחכה לו עכשיו הוא הלוח - בעמוד הראשי, מעל הבאנר
       של התלמידים. זו אינה קפיצה באמצע קריאה אלא המשך. */
    onClose: function () {
      /* נפתח מכרטיס העדכונים - מציירים את האזור מחדש, כדי
         שהכרטיס ייעלם אם העדכונים הופעלו. הבקשה חוזרת למסך
         הבית מעצמה (`renderBoard`). */
      if (document.getElementById('my-ask')) { renderMy(); return; }
      if (ASK.seen && ASK.seen()) setTimeout(hailBoard, 250);
      sayPaint();
    }
  });
}

var sayDraft = "", sayErr = "", sayBusy = false;

var TMPL = null;

function tmplNow() {
    if (TMPL === null) TMPL = Store.get("tmplCache", null);
    return TMPL || [];
}

var TMPL_TAB = "נוסחים";

var TMPL_CATS = [ [ "any", "כל קבוצה" ], [ "all", "saySegAll" ], [ "done", "saySegDone" ], [ "todo", "saySegTodo" ], [ "parents", "sayAudPar" ] ];

function tmplCatLabel(c) {
    for (var i = 0; i < TMPL_CATS.length; i++) {
        if (TMPL_CATS[i][0] !== c) continue;
        var l = TMPL_CATS[i][1];
        return (HEAD_ASK[l] || l).split(" {daf}").join("").split("{daf}").join("");
    }
    return c;
}

function tmplLoad() {
    var id = CFG.sheetId || SHEET_ID;
    if (!id || !navigator.onLine) return Promise.resolve(false);
    return fetch(sheetUrl(id, TMPL_TAB) + "&headers=1").then(function(r) {
        return r.ok ? r.text() : null;
    }).then(function(t) {
        return t ? parseCsv(t) : null;
    }).then(function(rows) {
        if (!rows || !rows.length) return false;
        var head = rows[0].join("|");
        if (head.indexOf("קטגוריה") < 0 || head.indexOf("נוסח") < 0) return false;
        var out = [];
        rows.slice(1).forEach(function(r) {
            var c = String(r[0] || "").trim(), t = String(r[1] || "").trim();
            if (c && t) out.push({
                cat: c,
                text: t
            });
        });
        TMPL = out;
        Store.set("tmplCache", out);
        return true;
    }).catch(function() {
        return false;
    });
}

var sayOpt = { seg:'', aud:'kids', way:'', grade:'', per:true, more:false };

var SAY_WAYS = [ [ "", "sayWayAll" ], [ "לימוד עצמי", "sayWaySelf" ], [ "חבורת לימוד", "sayWayChav" ], [ "אבות ובנים", "sayWayDad" ] ];

function sayReach() {
    var code = myBoard();
    if (!code) return null;
    var j = bJoin(code);
    return j ? j.n || 0 : null;
}

function sayWeek() {
    var wk = weekIndex(), tr = trackById(homeTrack);
    if (wk < 0 || !tr) return null;
    var row = tr.cal[wk], daf = row && row[2] && row[2] !== "סיום" ? rowDaf(row) : null;
    if (!daf) return null;
    var did = typeof LCount === "function" ? LCount(homeTrack, wk, myBoard()) : 0;
    return {
        wk: wk + 1,
        daf: daf,
        did: did || 0
    };
}

function sayCount() {
    var j = bJoin(myBoard()) || {}, n = j.n || 0, w = sayWeek();
    if (sayOpt.aud !== "kids") return null;
    var narrowed = sayOpt.way || sayOpt.grade;
    if (sayOpt.seg === "mid" || sayOpt.seg === "none") return null;
    if (narrowed && sayOpt.seg) return null;
    if (sayOpt.way) return pairN(j.ways, sayOpt.way);
    if (sayOpt.grade) return pairN(j.grades, sayOpt.grade);
    if (sayOpt.seg === "done") return w ? w.did : null;
    if (sayOpt.seg === "todo") return w ? Math.max(0, n - w.did) : null;
    return n;
}

function pairN(list, k) {
    var v = null;
    (list || []).forEach(function(p) {
        if (p[0] === k) v = p[1];
    });
    return v;
}

function sayChip(on, label, n, act) {
    return '<button class="chip' + (on ? " on" : "") + '" data-say="' + act + '">' + esc(label) + (n != null ? "<b>" + n + "</b>" : "") + "</button>";
}

function saySig() {
    var own = Store.get("saySig", "");
    if (own) return own;
    var me = typeof ASK !== "undefined" && ASK.get && ASK.get() || {};
    var who = typeof ASK !== "undefined" && ASK.name ? ASK.name(me) : "";
    return [ who, me.role || "" ].filter(function(x) {
        return x;
    }).join(", ") || PROGRAM.short;
}

function sayCat() {
    if (sayOpt.aud === "parents") return "parents";
    return sayOpt.seg || "all";
}

function sayTmpls() {
    var cat = sayCat(), w = sayWeek();
    return tmplNow().filter(function(t) {
        return t.cat === cat || t.cat === "any";
    }).map(function(t) {
        return fill(t.text, {
            daf: w ? w.daf : ""
        });
    });
}

function sayPreview() {
    var name = sayOpt.aud === "parents" ? headT("sayPvNameP") : headT("sayPvName");
    if (sayOpt.aud === "both") name = headT("sayPvName") + " / " + headT("sayPvNameP");
    var txt = (sayDraft || "").trim();
    var body = txt ? (sayOpt.per ? '<b class="pv-nm">' + esc(name) + "</b>, " : "") + esc(txt) : '<span class="pv-ph">' + esc(headT("sayPvEmpty")) + "</span>";
    return '<div class="say-pv"><div class="say-pv-h">' + esc(headT("sayPvH")) + "</div>" + '<div class="say-pv-n"><img src="icon-192.png" alt="">' + "<div><b>" + esc(saySig()) + '</b><span id="say-pv-b">' + body + "</span></div></div></div>";
}
