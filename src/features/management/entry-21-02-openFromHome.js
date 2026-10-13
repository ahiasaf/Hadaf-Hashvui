function openFromHome(i) {
    var w = contentFor(homeTrack);
    openWeek(homeTrack, w.i);
    deckOpen(i);
}

var reg = {
    inst: "",
    instOther: "",
    who: "",
    phone: "",
    who2: "",
    phone2: "",
    size: 0,
    want: null,
    qty: {}
};

/* אשף ההרשמה בשלושה שלבים. השלב נשמר מחוץ ל-render,
   ולכן כל ציור מחדש (בחירת ישיבה, מסכתות, כמויות) נשאר
   באותו שלב. הפס משקף את השלב האמיתי בלבד. */
var regStage = 1;
var REG_STEP_NAMES = [ "הישיבה", "הלימוד", "גמרות ושליחה" ];

function regGo(n, focusEl) {
    if (n > regStage && regStage === 1) {
        var name = reg.inst === "other" ? String(reg.instOther || "").trim() : (INSTITUTIONS.filter(function(i) {
            return i.code === reg.inst;
        })[0] || {}).name;
        var err = document.getElementById("r-err1");
        if (!name) {
            if (err) { err.textContent = "נא לבחור ישיבה."; err.hidden = false; }
            var field = reg.inst === "other" ? document.getElementById("r-otherName") : document.querySelector("#r-step-1 .pk");
            if (field) field.focus();
            return;
        }
        if (err) err.hidden = true;
    }
    regStage = n;
    if (n === 3) {
        var review = document.querySelector(".registration-review");
        if (review) {
            var school = reg.inst === "other" ? String(reg.instOther || "").trim() : (INSTITUTIONS.filter(function(item) { return item.code === reg.inst; })[0] || {}).name;
            review.querySelector("b").textContent = school || "";
            review.querySelector("p").textContent = (reg.mas || []).map(function(id) { return trackById(id) ? "מסכת " + trackById(id).masechet : id; }).join(" · ") || "המסכת תיבחר בהמשך";
        }
    }
    for (var i = 1; i <= 3; i++) {
        var s = document.getElementById("r-step-" + i);
        if (s) s.className = "rstep" + (i === n ? " on" : "");
    }
    var l = document.getElementById("rp-lbl");
    if (l) l.textContent = "שלב " + n + " מתוך 3 · " + REG_STEP_NAMES[n - 1];
    document.querySelectorAll("[data-reg-stage]").forEach(function(item) {
        var step = Number(item.getAttribute("data-reg-stage"));
        item.className = step < n ? "is-done" : step === n ? "is-current" : "";
        if (step === n) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
    var t = focusEl || document.getElementById("r-step-" + n);
    if (t && t.focus) t.focus();
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
        top: 0,
        behavior: calm ? "auto" : "smooth"
    });
}

function regProg() {
    return '<span class="registration-status" id="rp-lbl" role="status">שלב ' + regStage + ' מתוך 3 · ' + REG_STEP_NAMES[regStage - 1] + '</span>';
}

function regStep(n, inner) {
    var titles = [ "איזו ישיבה מצטרפת?", "מה לומדים השנה?", "גמרות ללימוד שלכם" ];
    var notes = [ "בוחרים ישיבה וממלאים פרטי קשר, אם תרצו.", "אפשר לבחור מסכת אחת או ללמוד את שתיהן.", "ההזמנה לבחירתכם. אפשר להירשם גם בלי להזמין." ];
    return '<section class="rstep' + (regStage === n ? " on" : "") + '" id="r-step-' + n + '" tabindex="-1" aria-label="' + esc(REG_STEP_NAMES[n - 1]) + '">' + '<header class="registration-step-title"><h2>' + titles[n - 1] + '</h2><p>' + notes[n - 1] + '</p></header>' + inner + "</section>";
}

function regSaved() {
    try {
        return JSON.parse(localStorage.getItem("dfReg") || "null");
    } catch (e) {
        return null;
    }
}

function regReset() {
    regSending = false; regAccepted = false; regRequest = null;
    localStorage.removeItem("dfReg");
    reg = {
        inst: "",
        instOther: "",
        who: "",
        phone: "",
        who2: "",
        phone2: "",
        size: 0,
        want: null,
        qty: {}
    };
    regStage = 1;
    renderReg();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function sefTotal(sefer, q) {
    q = q || reg.qty;
    return TRACKS.reduce(function(a, t) {
        return a + (q[qk(t.id, sefer)] || 0);
    }, 0);
}

function regTotalQty(q) {
    return SFARIM.reduce(function(a, s) {
        return a + sefTotal(s.id, q);
    }, 0);
}

function regMigrate(saved) {
    var q = {};
    if (saved.qty) {
        var flat = false;
        for (var k in saved.qty) {
            if (k.indexOf("-") < 0) flat = true;
        }
        if (!flat) return saved.qty;
        SFARIM.forEach(function(s) {
            if (saved.qty[s.id]) q[qk(TRACKS[0].id, s.id)] = saved.qty[s.id];
        });
        return q;
    }
    if (saved.sefer && saved.sefer !== "later") {
        if (saved.z) q[qk("taanit", saved.sefer)] = saved.z;
        if (saved.ch) q[qk("megila", saved.sefer)] = saved.ch;
    }
    return q;
}

var regPreSkip = false;

function regPreNeeded() {
    if (regPreSkip) return false;
    return !!(window.APPX && APPX.isIOS() && !APPX.standalone());
}

function renderRegPre() {
  var el = document.getElementById('reg-body');
  if (!el) return;
  /* `mycard` ולא הכרטיס של האשף: הסגנון ההוא מוזרק על ידי
     ask.js ברגע שהוא נשתל, ומסך שמסתמך עליו לפני כן מצויר
     בלי עיצוב. */
  /* בלי כותרת ובלי פסקה שמסבירה למה - ראו `UI.preSkip` ב-data.js.
     המדריך פותח בהוראה הראשונה. */
  var h = '<div class="mycard">';

  /* מוואטסאפ אי אפשר להוסיף למסך הבית בכלל, וזו ההוראה
     היחידה שתעזור שם. */
  /* כרום או פיירפוקס באייפון - דפדפנים אמיתיים, ולכן לא
     אומרים להם "אתם בתוך וואטסאפ" אלא את האמת: באייפון רק
     ספארי מוסיף למסך הבית. */
  if (window.APPX && APPX.iosOther && APPX.iosOther()) {
    h += '<div class="cond"><b>' + esc(ASK_UI.iosOthH) + '</b><br>' +
         esc(ASK_UI.iosOthB) + '</div>' +
         '<button class="btn g" style="margin-top:12px;width:100%" ' +
         'onclick="copyAny(this, location.href)">' + esc(UI.preCopy) +
         '</button></div>';
    el.innerHTML = h;
    return;
  }
  /* `APPX.stuck()` תופס גם וואטסאפ באנדרואיד - הוא פותח
     ב-Custom Tab שמזדהה כמו כרום רגיל ב-user agent, ולכן
     inApp() לבדו לא מזהה אותו. ראו getapp.js. */
  if (window.APPX && (APPX.inApp() || (APPX.stuck && APPX.stuck()))) {
    /* הכפתור שבאמת מעביר - באנדרואיד. באייפון `toBrowser`
       מחזיר ריק, ושם נשארת ההנחיה וההעתקה. */
    var br = APPX.toBrowser ? APPX.toBrowser() : '';
    h += '<div class="cond"><b>' +
         esc(ASK_UI.inAppH) + '</b><br>' + esc(ASK_UI.inAppB) + ' ' +
         esc(APPX.isIOS() ? ASK_UI.inAppIos : ASK_UI.inAppNot) + '</div>' +
         (br ? '<a class="btn b" style="margin-top:12px;width:100%;' +
               'display:block;text-align:center;text-decoration:none;' +
               'box-sizing:border-box" href="' + esc(br) + '">' +
               esc(ASK_UI.openGo) + '</a>' : '') +
         '<button class="btn g" style="margin-top:12px;width:100%" ' +
         'onclick="copyAny(this, location.href)">' + esc(UI.preCopy) +
         '</button></div>';
    el.innerHTML = h;
    return;
  }

  /* במסע (trip.js) אין את כפתור הדילוג: המסע כולו קיים בשביל
     להוביל להתקנה, וכפתור "להירשם בלי להתקין" סותר את המטרה
     שלו. מחוץ למסע - הרשמה רגילה בדפדפן - הכפתור נשאר, כי שם
     אין "מסע" שמנחה, ומי שממש לא רוצה להתקין צריך דרך להמשיך. */
  var inTrip = (window.TRIP_UI && TRIP_UI.on()) || /[?&]masa=1(&|$)/i.test(location.search);
  h += (APPX.waBox ? APPX.waBox() : '') + '<div id="reg-gu"></div>' +
       (inTrip ? '' :
         '<button class="btn g pnl" id="reg-pre-skip" style="margin-top:14px">' +
         esc(UI.preSkip) + '<small>' + esc(UI.preSkipSub) + '</small></button>') +
       '</div>';
  el.innerHTML = h;

  if (window.GUIDE_UI) {
    GUIDE_UI.force(null);
    GUIDE_UI.mount(document.getElementById('reg-gu'), function () {
      /* סיים את המדריך ועדיין כאן - כלומר האייקון טרם נפתח.
         מציירים מחדש, וההוראה האחרונה חוזרת. */
      regGuEnd = true;
      renderRegPre();
    }, { play: true, end: regGuEnd });
  }
  var sk = document.getElementById('reg-pre-skip');
  if (sk) sk.onclick = function () {
    regPreSkip = true;
    renderReg();
  };
}

if (window.APPX && APPX.onStuck) APPX.onStuck(function() {
    renderReg();
});

function regDupWarn() {
    if (!reg.inst || reg.inst === "other") return false;
    if (instCode(reg.inst)) return false;
    var row = INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0];
    return !!(row && row.joined);
}

/* המדריך שבהרשמה הגיע עד "סיימתי" - מעכשיו עומד על השלב האחרון. */
var regGuEnd = false;

function renderReg() {
    if (regPreNeeded()) {
        renderRegPre();
        return;
    }
    var saved = regSaved();
    if (!saved && !reg.inst && urlInst) reg.inst = urlInst;
    if (saved && !reg.inst) {
        reg.inst = saved.code || "";
        reg.who = saved.who || "";
        reg.phone = saved.phone || "";
        reg.who2 = saved.who2 || "";
        reg.phone2 = saved.phone2 || "";
        reg.size = saved.size || 0;
        if (saved.mas && saved.mas.length) reg.mas = saved.mas;
        reg.qty = regMigrate(saved);
        reg.want = saved.want != null ? !!saved.want : regTotalQty(reg.qty) > 0;
        reg.instOther = saved.instOther || "";
    }
    var instName = reg.inst === "other" ? reg.instOther || "ישיבה אחרת" : (INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0] || {}).name || "";
    var whoBlock = '<div class="foldh" id="r-who-step" style="margin-top:22px">' + esc(UI.s4) + "</div>" + pkField("", instName, UI.instLabel, "pickInst()") + '<div class="fld" id="r-other" style="display:' + (reg.inst === "other" ? "block" : "none") + '">' + '<input type="text" id="r-otherName" placeholder="שם הישיבה" value="' + esc(reg.instOther) + '" onchange="regSet(\'instOther\',this.value)"></div>';
    var step1 = whoBlock + '<div class="registration-contact"><div class="fld"><label for="r-contact">איש קשר (לא חובה)</label><input id="r-contact" autocomplete="name" value="' + esc(reg.who) + '" oninput="regSet(\'who\',this.value)"></div><div class="fld"><label for="r-contact-phone">טלפון (לא חובה)</label><input id="r-contact-phone" type="tel" autocomplete="tel" dir="ltr" value="' + esc(reg.phone) + '" oninput="regSet(\'phone\',this.value)"></div></div>' + (saved ? '<p class="jump">' + esc(UI.savedNote) + " · " + '<a href="#" onclick="regGo(1, document.querySelector(\'#r-step-1 .pk\'));return false">' + esc(UI.savedGo) + "</a> · " + '<a href="#" onclick="regReset();return false">' + esc(UI.savedNew) + "</a></p>" : "") + (saved || myBoard() ? boardBlock() : '<p class="jump"><a href="#" onclick="boardBack();return false">' + esc(UI.cbBack) + "</a></p>") + '<div class="r-err" id="r-err1" role="alert" hidden></div>' + '<div class="rnav"><button class="btn gd" onclick="regGo(2)">המשך</button></div>';
    var step2 = sizeRow() + masRow() + '<div class="rnav"><button class="btn g" onclick="regGo(1)">חזרה</button>' + '<button class="btn gd" onclick="regGo(3)">המשך</button></div>';
    var review = '<div class="registration-review"><span>ההרשמה שלכם</span><b>' + esc(instName) + "</b><p>" + esc((reg.mas || []).map(function(id) {
        return trackById(id) ? "מסכת " + trackById(id).masechet : id;
    }).join(" · ") || "המסכת תיבחר בהמשך") + "</p></div>";
    var step3 = review + (UI.orderNote ? '<p class="nooblig">' + esc(UI.orderNote) + "</p>" : "") + '<div class="wantbar" id="r-wantbar" onclick="wantToggle(event)">' + "<div><b>" + esc(UI.s2) + "</b><span>" + esc(UI.wantSub) + "</span></div>" + '<button class="sw" id="r-wantsw" onclick="wantToggle(event)" ' + 'role="switch" aria-checked="false" aria-label="' + esc(UI.s2) + '"></button>' + "</div>" + '<div class="fold" id="r-fold"><div class="order-content">' + orderRows() + '<div id="r-total" aria-live="polite">' + regTotal() + '</div><details class="registration-catalog"><summary>סוגי הגמרות ודוגמאות</summary>' + recBlocks() + '<div class="order-help"><div class="foldh">' + esc(UI.s3) + "</div>" + '<p style="font-size:.85rem;color:var(--ink-2);font-weight:600;' + 'line-height:1.6">' + esc(UI.hint) + "</p>" + '<p class="two-m">' + esc(UI.twoM) + "</p>" + byLine() + "</div></details></div></div>" + (regDupWarn() ? '<div class="cond" id="r-dup" style="margin-top:16px">' + esc(UI.regDup) + "</div>" : "") + '<div class="r-err" id="r-err3" role="alert" hidden></div>' + '<div class="rnav rsubmit"><button class="btn g" onclick="regGo(2)">חזרה</button><button class="btn gr" id="r-send" ' + 'onclick="sendReg()">' + esc(saved ? UI.update : UI.send) + "</button></div>" + '<div id="r-done" role="status" aria-live="polite"></div>' + '<div id="head-next"></div>';
    var intro = '<header class="registration-intro"><p>לצוותי הישיבות</p><h1>הרשמת ישיבה</h1><span>הלימוד השבועי והזמנת גמרות</span></header>';
    var rail = '<aside class="registration-rail"><ol>' + REG_STEP_NAMES.map(function(name, i) {
        return '<li data-reg-stage="' + (i + 1) + '" class="' + (i + 1 < regStage ? "is-done" : i + 1 === regStage ? "is-current" : "") + '"' + (i + 1 === regStage ? ' aria-current="step"' : "") + "><span>" + (i + 1) + "</span><b>" + name + "</b></li>";
    }).join("") + '</ol></aside>';
    var h = intro + '<div class="registration-layout">' + rail + '<div class="registration-form">' + regProg() + regStep(1, step1) + regStep(2, step2) + regStep(3, step3) + '</div></div><details class="registration-help"><summary>למי התוכנית מתאימה?</summary>' + fitBlock() + '</details>';
    var focused = document.activeElement, focusId = focused && focused.id;
    document.getElementById("reg-body").innerHTML = h;
    if (focusId) {
        var replacement = document.getElementById(focusId);
        if (replacement) replacement.focus({
            preventScroll: true
        });
    }
    foldInit();
    if (regSending) regSendingState(true);
}


var FIT_ICONS = {
    group: '<circle cx="5" cy="8.4" r="2.2"/><circle cx="12" cy="8.4" r="2.2"/>' + '<circle cx="19" cy="8.4" r="2.2"/>' + '<path d="M1.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>' + '<path d="M8.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>' + '<path d="M15.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>',
    pair: '<circle cx="7.5" cy="6.2" r="2.6"/><circle cx="16.8" cy="10.4" r="2.1"/>' + '<path d="M3.4 19.6c0-2.9 1.8-4.8 4.1-4.8s4.1 1.9 4.1 4.8"/>' + '<path d="M13.4 19.6c0-2.2 1.5-3.6 3.4-3.6s3.4 1.4 3.4 3.6"/>',
    solo: '<circle cx="12" cy="5.6" r="2.5"/>' + '<path d="M8.4 12.4c.5-1.7 1.9-2.7 3.6-2.7s3.1 1 3.6 2.7"/>' + '<path d="M3.6 15.2h6.2c1.2 0 2.2.7 2.2 1.6 0-.9 1-1.6 2.2-1.6h6.2v4.4h-6.2' + 'c-1.2 0-2.2.7-2.2 1.6 0-.9-1-1.6-2.2-1.6H3.6z"/>'
};


function fitBlock() {
    return '<div class="registration-audience"><ul>' + FIT.items.map(function(f) {
        return '<li><svg viewBox="0 0 24 24" aria-hidden="true">' + (FIT_ICONS[f.icon] || '') + '</svg><span>' + esc(f.t) + '</span></li>';
    }).join('') + '</ul>' + (FIT.sub ? '<p>' + esc(FIT.sub) + '</p>' : '') + '</div>';
}

function recBlocks() {
    var img = function(s, pic, cls) {
        return '<img loading="lazy" class="' + cls + '" src="' + esc(pic.src) + '" alt="' + esc(s.name) + '" onclick="zoom(\'' + esc(pic.src) + "','" + esc(pic.hi || "") + "')\">";
    };
    return '<div class="order-books">' + SFARIM.map(function(s) {
        var p = priceOf(s.id), pics = s.pics || [];
        var cover = pics.filter(function(q) {
            return q.small;
        })[0];
        var open = pics.filter(function(q) {
            return !q.small;
        });
        return '<div class="rec ' + s.tone + '">' + '<div class="head"><p>' + s.rec + "</p>" + (cover ? img(s, cover, "cover") : "") + "</div>" + (open.length ? '<details class="order-preview"><summary>דוגמה מתוך הגמרא</summary><div class="pics">' + open.map(function(q) {
            return img(s, q, "");
        }).join("") + "</div></details>" : "") + '<div class="pr"><b>' + shek(p.price) + "</b> לחוברת" + (p.off ? " <s>" + shek(p.list) + "</s>" : "") + "</div>" + (p.off ? condNote(s.name, p.min) : "") + "</div>";
    }).join("") + "</div>";
}

function zoom(base, hi) {
    var o = document.getElementById("zoom"), im = o.querySelector("img");
    im.src = base;
    o.scrollTop = 0;
    o.scrollLeft = 0;
    o.classList.add("on");
    if (hi && hi !== base) {
        var pre = new Image;
        pre.onload = function() {
            if (o.classList.contains("on")) im.src = hi;
        };
        pre.src = hi;
    }
}

function zoomClose() {
    document.getElementById("zoom").classList.remove("on");
}

/* סרטון התדמית - נטען ברקע מיד עם פתיחת העמוד, כדי שהלחיצה על
   הלוגו תנגן אותו בלי המתנה. נשמר כ-blob בזיכרון: נגן הווידאו
   מבקש טווחים, וב-iOS טווח מהמטמון לא תמיד מנוגן - blob תמיד כן.
   הקובץ במטמון הדפדפן לשנה (vercel.json), כך שבפתיחה הבאה אין
   הורדה חוזרת. עובד השירות לא נוגע בו בכוונה (sw.js).
   מחליפים סרטון → שם קובץ חדש, אחרת המכשירים יחזיקו את הישן. */
var PROMO_SRC = 'promo/hadaf-promo.mp4';
var promoBlob = '';
function promoLoad() {
  var video = document.getElementById('promo-v');
  var connection = navigator.connection;
  if (!video || connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return;
  video.preload = 'metadata';
  if (!video.getAttribute('src')) video.src = PROMO_SRC;
}
function promoOpen() {
  var p = document.getElementById('promo'), v = document.getElementById('promo-v');
  if (!p || !v) return;
  var x = document.getElementById('promo-x');
  if (x) x.setAttribute('aria-label', UI.promoX || '');
  if (!v.getAttribute('src')) v.src = promoBlob || PROMO_SRC;
  p.className = 'on';
  try { v.currentTime = 0; } catch (e) {}
  var pr = v.play();
  if (pr && pr.catch) pr.catch(function () {});
}
function promoClose() {
  var p = document.getElementById('promo'), v = document.getElementById('promo-v');
  if (v) v.pause();
  if (p) p.className = '';
}
if (document.readyState === 'complete') setTimeout(promoLoad, 0);
else window.addEventListener('load', function () { setTimeout(promoLoad, 0); });

function jumpTo(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function qk(track, sefer) {
    return track + "-" + sefer;
}

function orderSummary(q) {
    return TRACKS.map(function(t) {
        var parts = SFARIM.filter(function(s) {
            return q[qk(t.id, s.id)] > 0;
        }).map(function(s) {
            return q[qk(t.id, s.id)] + " " + s.name;
        });
        return parts.length ? "מסכת " + t.masechet + ": " + parts.join(", ") : "";
    }).filter(Boolean).join(" · ");
}
