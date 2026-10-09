function tourTry() {
    var a = document.querySelector("#w-inter a");
    tourClose();
    if (a) location.href = a.getAttribute("href");
}

document.addEventListener("keydown", function(e) {
    if (!tourOn()) return;
    if (e.key === "Escape") tourClose();
    if (e.key === "ArrowLeft") tourGo(1);
    if (e.key === "ArrowRight") tourGo(-1);
});

function tourReflow() {
    if (!tourOn()) return;
    var st = TOUR_STOPS[tourI];
    var el = st.sel ? document.querySelector(st.sel) : null;
    if (el && el.offsetParent && el.offsetHeight) tourPlace(el);
}

window.addEventListener("resize", tourReflow);

window.addEventListener("scroll", tourReflow, true);

var TOUR_INV_IN = 2e3, TOUR_INV_OUT = 14e3, tourInvT = null;

function tourInviteShow() {
    var el = document.getElementById("t-invite");
    if (!el) return;
    el.innerHTML = "<div><b>" + esc(TOUR.invite) + "</b>" + '<button class="go" onclick="tourOpen(0)">' + esc(TOUR.inviteGo) + "</button>" + '<button class="x" onclick="tourInviteHide(1)" aria-label="סגירה">✕</button></div>';
    el.className = "t-invite on";
    clearTimeout(tourInvT);
    tourInvT = setTimeout(function() {
        tourInviteHide();
    }, TOUR_INV_OUT);
}

function tourInviteHide(byHand) {
    clearTimeout(tourInvT);
    var el = document.getElementById("t-invite");
    if (el) el.className = "t-invite";
    if (byHand) Store.set(TOUR_KEY, 1);
}

var tourFirst = {
    ok: false,
    done: false
};

function tourMaybe() {
    if (!tourFirst.ok || tourFirst.done) return;
    if (!tourLive() || tourSeen() || tourOn()) return;
    tourFirst.done = true;
    setTimeout(function() {
        if (!tourOn() && !tourSeen()) tourInviteShow();
    }, TOUR_INV_IN);
}

function tourLauncher() {
    var foot = document.getElementById("t-foot-wrap");
    var flo = document.getElementById("t-float");
    var mast = document.getElementById("t-mast");
    var at = tourLive() ? tourAt() : "";
    if (foot) foot.innerHTML = at !== "foot" ? "" : '<button class="t-foot" onclick="tourOpen(0)">◷ ' + esc(TOUR.open) + " <span>" + esc(TOUR.openSub) + "</span></button>";
    if (flo) flo.style.display = at === "float" ? "block" : "none";
    if (mast) mast.style.display = at === "mast" ? "block" : "none";
}

var deferredInstall = null;

function isStandalone() {
    return window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function isIOS() {
    return /iP(hone|ad|od)/.test(navigator.platform || "") || /Mac/.test(navigator.platform || "") && navigator.maxTouchPoints > 1;
}

function instHide() {
    document.getElementById("inst").className = "";
}

function instLater() {
    Store.set("instSnooze", Date.now());
    instHide();
}

function instGo() {
    if (!deferredInstall) {
        instHide();
        return;
    }
    var p = deferredInstall;
    deferredInstall = null;
    instHide();
    p.prompt();
    p.userChoice.then(function(r) {
        if (!r || r.outcome !== "accepted") Store.set("instSnooze", Date.now()); else Store.set("instDone", 1);
    }).catch(function() {});
}

function instShow(ios) {
    var txt = document.getElementById("inst-txt");
    var row = document.getElementById("inst-row");
    if (ios) {
        txt.innerHTML = 'פותחים את תפריט השיתוף <span class="ios"><svg viewBox="0 0 24 24">' + '<path d="M12 15.5V3.4"/><path d="M8.4 6.9 12 3.3l3.6 3.6"/>' + '<path d="M6.6 10.6H5.2v9.6h13.6v-9.6h-1.4"/></svg></span> ' + "בתחתית המסך, ובוחרים <b>הוספה למסך הבית</b>.";
        row.innerHTML = '<button class="yes" onclick="instLater()">הבנתי</button>';
    } else {
        txt.textContent = "כך היא תישאר אצלכם עם אייקון, ותיפתח בלחיצה אחת " + "בלי לחפש את הקישור.";
        row.innerHTML = '<button class="yes" onclick="instGo()">הוספה למסך הבית</button>' + '<button class="no" onclick="instLater()">לא עכשיו</button>';
    }
    document.getElementById("inst").className = "on";
}

function initInstall() {
    window.addEventListener("beforeinstallprompt", function(e) {
        e.preventDefault();
        deferredInstall = e;
        if (admTab === "more" && admSub.more === "sys") admInstallBox();
    });
    window.addEventListener("appinstalled", function() {
        Store.set(isAdminRoute() ? "instDoneAdmin" : "instDone", 1);
        instHide();
        if (admTab === "more" && admSub.more === "sys") admInstallBox();
    });
}

function registerSW() {
    if (window.APPX && APPX.update) APPX.update();
}

(function boot() {
    if (urlInst && urlKey) setInstCode(urlInst, urlKey);
    setTimeout(function() {
        accCheck();
    }, 2500);
    var cached = Store.get("instCache");
    if (cached && cached.length) {
        var head = [ [ "code", "name", "last", "joined", "mas" ] ].concat(cached.map(function(i) {
            return [ i.code, i.name, i.last ? "TRUE" : "", i.joined ? "TRUE" : "", (i.mas || []).join(",") ];
        }));
        if (instFromRows(head).ok) {
            INSTITUTIONS.length = 0;
            cached.forEach(function(i) {
                INSTITUTIONS.push(i);
            });
            applyCfg();
        } else {
            Store.set("instCache", null);
        }
    }
    renderHome();
    paintQueue();
    paintNet();
    flush();
    registerSW();
    initInstall();
    loadInstitutions().then(function(ok) {
        if (ok) renderHome();
    }).catch(function() {});
    loadTexts().then(function(ok) {
        if (ok) repaintTexts();
    }).catch(function() {});
    loadSettings().then(function(ok) {
        if (ok) {
            renderHome();
            if (document.getElementById("adm-pane")) admPane();
        }
        tourMaybe();
    }).catch(function() {});
    loadCounts().then(function(ok) {
        if (ok) renderBoard();
    }).catch(function() {});
    var hash = location.hash || "";
    var qm = /^#quiz=([a-z]+)-(\d+)$/.exec(hash);
    var wm = /^#week=([a-z]+)-(\d+)$/.exec(hash);
    var tm = /^#track[=-]([a-z]+)$/.exec(hash);
    if (qm && trackById(qm[1])) {
        openWeek(qm[1], +qm[2] - 1);
        openQuiz();
    } else if (wm && trackById(wm[1])) {
        pickTrack(wm[1]);
        openWeek(wm[1], +wm[2] - 1);
    } else if (tm && trackById(tm[1])) {
        pickTrack(tm[1]);
        openTrack(tm[1]);
    } else if (hash === "#phone" && myInstRow()) {
        show("my");
        accCheck(true);
    } else if (isAdminRoute()) {
        launchedAsAdmin = true;
        try {
            sessionStorage.setItem("df:admLaunch", "1");
        } catch (e) {}
        adminEntry();
    } else show("home");
    setTimeout(function() {
        document.getElementById("splash").className = "off";
    }, 340);
    tourFirst.ok = !isAdminRoute() && !qm && !location.search;
    setTimeout(tourMaybe, 950);
})();
