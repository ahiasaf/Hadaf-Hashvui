function isAdminRoute() {
    return /\/admin\/?$/.test(location.pathname) || /^#admin(-acc|-help)?$/.test(location.hash);
}

function admTakeHash() {
    var m = /^#admin-(acc|help)$/.exec(location.hash);
    if (!m) return "";
    try {
        history.replaceState(null, "", location.pathname + location.search + "#admin");
    } catch (e) {}
    ADM_INST = "";
    Store.set("admInst", "");
    admIpOpen = false;
    pplFrame({
        dfFilt: ""
    });
    ppl.open = null;
    ppl.q = "";
    ppl.f = "";
    ppl.mine = "";
    admTab = "hot";
    return m[1] === "acc" ? "hot-acc" : "hot-help";
}

function admScrollTo(id) {
    if (!id) return;
    setTimeout(function() {
        var e = document.getElementById(id);
        if (e) try {
            e.scrollIntoView({
                block: "start"
            });
        } catch (x) {
            e.scrollIntoView();
        }
    }, 60);
}

function admTakeGo() {
    var g = null;
    try {
        g = JSON.parse(localStorage.getItem("df:admGo") || "null");
        localStorage.removeItem("df:admGo");
    } catch (e) {}
    if (!g || g.sub !== "daf") return;
    admTab = "daf";
    admSub.daf = "daf";
    if (g.mas && trackById(g.mas) && g.wk > 0) {
        dkSel = {
            mas: g.mas,
            wk: g.wk
        };
        dkSlPick = {};
        dkBust = Date.now();
        dkPool = null;
        dkLoadSel();
        dkAsk();
    }
}

function adminEntry() {
    if (Store.get("admOk")) {
        var to = admTakeHash();
        admTakeGo();
        renderAdmin();
        show("admin");
        admEnterOnce();
        admScrollTo(to);
        if (to === "ppl-acc") accLoad(); else if (to) stuckLoad();
    } else show("gate");
}

window.addEventListener("hashchange", function() {
    if (isAdminRoute()) adminEntry();
});

(function() {
    var h = "";
    [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ].forEach(function(n) {
        h += '<button onclick="pin(' + n + ')">' + n + "</button>";
    });
    h += '<button onclick="pinClear()">C</button><button onclick="pin(0)">0</button>' + '<button onclick="pinDel()">⌫</button>';
    document.getElementById("pad").innerHTML = h;
})();

function pin(n) {
    if (teamCode.length >= 4) return;
    teamCode += n;
    paintPins();
    if (teamCode.length === 4) setTimeout(tryCode, 140);
}

function pinDel() {
    teamCode = teamCode.slice(0, -1);
    paintPins();
}

function pinClear() {
    teamCode = "";
    paintPins();
}

function paintPins() {
    var p = document.getElementById("pins").children;
    for (var i = 0; i < 4; i++) p[i].className = i < teamCode.length ? "f" : "";
}

function tryCode() {
    if (teamCode === ADMIN_PIN) {
        teamCode = "";
        paintPins();
        Store.set("admOk", 1);
        var to = admTakeHash();
        renderAdmin();
        show("admin");
        admEnterOnce();
        admScrollTo(to);
        return;
    }
    document.getElementById("gate-msg").textContent = "קוד שגוי";
    teamCode = "";
    setTimeout(paintPins, 350);
}

var sheetCb = null;

function pick(title, items, current, cb) {
    sheetCb = cb;
    document.getElementById("sheet-t").textContent = title;
    document.getElementById("sheet-l").innerHTML = items.map(function(it) {
        return '<button class="it' + (it.v === current ? " on" : "") + '" onclick="sheetPick(\'' + it.v + "')\">" + '<span class="tick">✓</span><span>' + esc(it.t) + "</span></button>";
    }).join("");
    document.getElementById("sheet").className = "on";
}

function sheetPick(v) {
    sheetClose();
    if (sheetCb) sheetCb(v);
}

var SUG_TIP = "df:sugya-tip";

function sugIcon(on, inner) {
    return '<span class="sg-i' + (on ? " hot" : "") + '">' + inner + "</span>";
}

function sugyaTip(href) {
    var sq = '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" rx="1"/>' + '<rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/>' + '<rect x="11" y="11" width="7" height="7" rx="1"/></svg>';
    var pl = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>' + '<path d="M10 6v8M6 10h8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';
    var mn = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>' + '<path d="M6 10h8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';
    var ex = '<svg viewBox="0 0 20 20"><path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5" ' + 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var dt = '<svg viewBox="0 0 20 20"><circle cx="5" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/>' + '<circle cx="15" cy="10" r="1.6"/></svg>';
    var sh = '<svg viewBox="0 0 20 20"><circle cx="15" cy="4.5" r="2.4"/><circle cx="5" cy="10" r="2.4"/>' + '<circle cx="15" cy="15.5" r="2.4"/><path d="M7 8.8l6-3.3M7 11.2l6 3.3" stroke="currentColor" ' + 'stroke-width="1.5" fill="none"/></svg>';
    document.getElementById("sheet-t").textContent = "רגע לפני החוברת";
    document.getElementById("sheet-l").innerHTML = '<div class="sg-tip">' + "<p>החוברת נפתחת ישר בעמוד של הדף שלכם - אבל היא נפתחת קטנה, " + "וכך קשה לקרוא בטלפון.</p>" + "<p><b>בסרגל שבתחתית החוברת יש כפתור מסך מלא. הקישו עליו, " + "והדף ימלא את המסך.</b></p>" + "<p>ואם המכשיר מסובב לרוחב - הכתב גדול עוד יותר.</p>" + '<div class="sg-bar">' + sugIcon(0, sq) + sugIcon(0, pl) + sugIcon(0, mn) + sugIcon(1, ex) + sugIcon(0, sh) + sugIcon(0, dt) + "</div>" + '<button class="btn gr" id="sg-go">הבנתי - לפתוח את החוברת</button>' + "</div>";
    document.getElementById("sheet").className = "on";
    document.getElementById("sg-go").onclick = function() {
        try {
            localStorage.setItem(SUG_TIP, "1");
        } catch (e) {}
        sheetClose();
        window.open(href, "_blank", "noopener");
    };
}

function yomiGuide() {
    var h = "<div>" + (UI.yomiNote ? '<p class="ym-note">' + esc(UI.yomiNote) + "</p>" : "");
    for (var k = 1; k <= 4; k++) {
        h += '<div class="ym-step"><div class="ym-h"><b>' + k + "</b>" + esc(UI["yomi" + k + "T"]) + "</div>" + "<p>" + esc(UI["yomi" + k]) + "</p>" + '<img src="weekpics/yomi' + k + '.webp" alt="" loading="lazy">' + (k === 4 && UI.yomi4Pic ? '<p class="ym-pic">' + esc(UI.yomi4Pic) + "</p>" : "") + "</div>";
    }
    h += '<button class="btn gr" onclick="sheetClose()">' + esc(UI.yomiOk) + "</button></div>";
    document.getElementById("sheet-t").textContent = UI.yomiT;
    document.getElementById("sheet-l").innerHTML = h;
    document.getElementById("sheet").className = "on";
}

document.addEventListener("click", function(e) {
    var a = e.target && e.target.closest && e.target.closest("a.lnk.sug, a.wcard.sug");
    if (!a || !a.getAttribute("href") || a.getAttribute("href") === "#") return;
    var seen = false;
    try {
        seen = localStorage.getItem(SUG_TIP) === "1";
    } catch (x) {}
    if (seen) return;
    e.preventDefault();
    sugyaTip(a.getAttribute("href"));
}, true);

function sheetClose() {
    document.getElementById("sheet").className = "";
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && document.getElementById("sheet").className === "on") sheetClose();
});

function pkField(label, value, placeholder, onOpen) {
    return '<div class="fld">' + (label ? '<div class="label">' + label + "</div>" : "") + '<button class="pk' + (value ? "" : " empty") + '" onclick="' + onOpen + '">' + "<span>" + esc(value || placeholder) + '</span><span class="cv"></span></button></div>';
}

function queue(payload) {
    var q = JSON.parse(localStorage.getItem("dfQueue") || "[]");
    q.push(payload);
    localStorage.setItem("dfQueue", JSON.stringify(q));
    paintQueue();
    flush();
}

function flush() {
    var q = JSON.parse(localStorage.getItem("dfQueue") || "[]");
    if (!q.length || !API || !navigator.onLine) return;
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(q[0])
    }).then(function() {
        var rest = JSON.parse(localStorage.getItem("dfQueue") || "[]");
        rest.shift();
        localStorage.setItem("dfQueue", JSON.stringify(rest));
        paintQueue();
        flush();
    }).catch(function() {});
}

function paintQueue() {
    var n = JSON.parse(localStorage.getItem("dfQueue") || "[]").length;
    var el = document.getElementById("queued");
    el.className = n ? "strip on" : "strip";
    el.textContent = !n ? "" : n === 1 ? "תשובה אחת ממתינה לשליחה" : n + " תשובות ממתינות לשליחה";
}

function paintNet() {
    document.getElementById("offline").className = navigator.onLine ? "strip" : "strip on";
}

window.addEventListener("online", function() {
    paintNet();
    flush();
});

window.addEventListener("offline", paintNet);

var TOUR_KEY = "tourSeen";

var TOUR_STOPS = [ {
    k: "p0"
}, {
    k: "p1",
    sel: "#plan",
    home: 1
}, {
    k: "p2",
    sel: "#stage",
    home: 1,
    ask: "#stage .acts .go",
    wait: "deck"
}, {
    k: "p3",
    when: function() {
        return showRow("inter");
    },
    before: "week",
    sel: "#w-inter",
    soft: 1,
    try: "#w-inter a"
}, {
    k: "p4",
    before: "home",
    sel: "#mini",
    home: 1
}, {
    k: "p5",
    sel: "#cta",
    home: 1,
    last: 1
} ];

var tourI = 0, tourWatch = null, tourClick = null, tourClickEl = null;

function tourOn() {
    return document.getElementById("tour").className.indexOf("on") >= 0;
}

function tourSeen() {
    return !!Store.get(TOUR_KEY, 0);
}

function tourLive() {
    return CV("tourOn") === true;
}

function tourAt() {
    return CV("tourAt") || "foot";
}

function tourOpen(i) {
    tourInviteHide();
    tourI = i || 0;
    document.getElementById("tour").className = "on";
    document.getElementById("tour").setAttribute("aria-hidden", "false");
    tourPaint();
}

function tourClose() {
    tourDrop();
    document.body.style.paddingBottom = "";
    var el = document.getElementById("tour");
    el.className = "";
    el.setAttribute("aria-hidden", "true");
    Store.set(TOUR_KEY, 1);
}

function tourDrop() {
    if (tourClickEl && tourClick) tourClickEl.removeEventListener("click", tourClick);
    tourClickEl = null;
    tourClick = null;
    clearInterval(tourWatch);
    tourWatch = null;
}

function tourGo(d) {
    tourDrop();
    var n = tourI + d;
    if (n < 0) return;
    if (n >= TOUR_STOPS.length) {
        tourClose();
        return;
    }
    tourI = n;
    tourPaint();
}

function tourP(t) {
    return String(t || "").split(/\n\s*\n/).map(function(x) {
        return "<p>" + esc(x).replace(/\n/g, "<br>") + "</p>";
    }).join("");
}

function tourNav(what) {
    if (what === "week") {
        var wi = weekIndex();
        openWeek(homeTrack, wi < 0 ? 0 : wi);
        return 420;
    }
    if (what === "home") {
        show("home");
        return 320;
    }
    return 0;
}

function tourPlace(el) {
    var pad = 7, r = el.getBoundingClientRect();
    var x = Math.max(2, r.left - pad), y = Math.max(2, r.top - pad);
    var w = Math.min(window.innerWidth - x - 2, r.width + pad * 2);
    var h = r.height + pad * 2;
    var ring = document.getElementById("t-ring");
    ring.style.display = "block";
    ring.style.top = y + "px";
    ring.style.left = x + "px";
    ring.style.width = w + "px";
    ring.style.height = h + "px";
    var mk = document.getElementById("t-mark");
    mk.style.display = "flex";
    mk.style.top = y - 13 + "px";
    mk.style.left = x + w - 13 + "px";
}

function tourBare() {
    document.getElementById("t-ring").style.display = "none";
    document.getElementById("t-mark").style.display = "none";
}

function tourPaint() {
    var st = TOUR_STOPS[tourI];
    if (st.when && !st.when()) {
        tourGo(1);
        return;
    }
    var nav = st.before || (st.home && !viewIsHome() ? "home" : "");
    var wait = nav ? tourNav(nav) : 0;
    setTimeout(function() {
        tourShow(st);
    }, wait);
}

function viewIsHome() {
    var v = document.getElementById("v-home");
    return !!(v && v.className.indexOf("on") >= 0);
}

function tourShow(st) {
    var card = document.getElementById("t-card");
    var el = st.sel ? document.querySelector(st.sel) : null;
    if (st.sel && (!el || !el.offsetParent || !el.offsetHeight)) {
        if (!st.soft) {
            tourGo(1);
            return;
        }
        el = null;
    }
    var n = tourI, all = TOUR_STOPS.length - 1;
    var body = tourP(TOUR[st.k + "Body"]) + (st.ask ? '<div class="ask">' + esc(TOUR.p2Ask) + "</div>" : "") + (st.soft && !el ? '<div class="ask">' + esc(TOUR.p3None) + "</div>" : "");
    var acts;
    if (st.ask) {
        acts = '<div class="t-row"><span class="t-step">' + n + "/" + all + "</span>" + '<button class="cp" onclick="tourGo(1)">' + esc(TOUR.next) + "</button>" + '<button class="t-skip" onclick="tourClose()">' + esc(TOUR.skip) + "</button></div>";
    } else if (st.try && el) {
        acts = '<div class="t-row">' + '<button class="btn gd" onclick="tourTry()">' + esc(TOUR.p3Try) + "</button>" + '<button class="cp" onclick="tourGo(1)">' + esc(TOUR.next) + "</button></div>" + '<div class="t-row"><span class="t-step">' + n + "/" + all + "</span>" + '<button class="t-skip" onclick="tourClose()">' + esc(TOUR.skip) + "</button></div>";
    } else if (st.last) {
        acts = '<p class="t-step" style="margin-top:10px">' + esc(TOUR.where) + "</p>" + '<div class="t-row">' + '<button class="btn gd" onclick="tourClose();show(\'reg\')">' + esc(UI.ctaBtn) + "</button>" + '<button class="cp" onclick="tourClose()">' + esc(TOUR.done) + "</button></div>";
    } else {
        acts = '<div class="t-row"><span class="t-step">' + (n ? n + "/" + all : "") + "</span>" + '<button class="btn p" style="flex:0 1 auto;min-width:9rem" ' + 'onclick="tourGo(1)">' + esc(n ? TOUR.next : TOUR.start) + "</button>" + '<button class="t-skip" onclick="tourClose()">' + esc(TOUR.skip) + "</button></div>";
    }
    card.innerHTML = "<h3>" + esc(TOUR[st.k + "Title"]) + "</h3>" + body + acts;
    var sh = card.offsetHeight;
    document.body.style.paddingBottom = sh + 26 + "px";
    if (el) {
        el.scrollIntoView({
            block: "center",
            behavior: "auto"
        });
        var r = el.getBoundingClientRect();
        var room = window.innerHeight - sh - 16;
        if (r.bottom > room) window.scrollBy(0, r.bottom - room + 10);
        tourPlace(el);
    } else {
        tourBare();
    }
    if (st.ask) {
        var btn = document.querySelector(st.ask);
        if (!btn) return;
        tourClickEl = btn;
        tourClick = function() {
            document.getElementById("tour").className = "on hush";
            tourWatch = setInterval(function() {
                var w = st.wait ? document.getElementById(st.wait) : null;
                if (w && w.className === "on") return;
                clearInterval(tourWatch);
                tourWatch = null;
                document.getElementById("tour").className = "on";
                tourGo(1);
            }, 350);
        };
        btn.addEventListener("click", tourClick);
    }
}
