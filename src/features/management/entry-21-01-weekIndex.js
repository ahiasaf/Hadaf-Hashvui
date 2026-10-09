var APP_VERSION = "9.0.0";

var API = localStorage.getItem("dfApi") || APPS_SCRIPT_URL || "";

var myInst = localStorage.getItem("dfInst") || "";

var myName = localStorage.getItem("dfName") || "";

var teamCode = "";

(function() {
    var h = document.getElementById("hdr-mark");
    if (h) h.src = LOGO_MARK;
    var l = document.getElementById("splash-logo");
    if (l) l.src = LOGO_FULL;
})();

var state = {
    track: null,
    week: null,
    deck: [],
    di: 0,
    ans: -1,
    filter: "all",
    quizIdx: 0
};

var urlInst = "", urlKey = "";

(function() {
    var q = String(location.search || "");
    var grab = function(n) {
        var m = q.match(new RegExp("[?&]" + n + "=([^&#]*)"));
        return m ? decodeURIComponent(m[1].replace(/\+/g, " ")).trim() : "";
    };
    var v = grab("m");
    if (!v) return;
    var known = false, i;
    for (i = 0; i < INSTITUTIONS.length; i++) {
        if (INSTITUTIONS[i].code === v) {
            known = true;
            break;
        }
    }
    if (!known) return;
    urlInst = v;
    myInst = v;
    try {
        localStorage.setItem("dfInst", v);
    } catch (e) {}
    urlKey = grab("k");
})();

function weekIndex() {
    return LWeek();
}

function trackById(id) {
    for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i];
    return null;
}

function dafDone(tr) {
    var wi = weekIndex(), n = 0;
    if (wi < 0) return 0;
    for (var i = 0; i <= wi && i < tr.cal.length; i++) if (tr.cal[i][2] && tr.cal[i][2] !== "סיום" && tr.cal[i][3] !== "ב") n++;
    return n;
}

function dafKey(d) {
    return String(d).replace(/["'׳״\s]/g, "");
}

function rowDaf(row) {
    return row && row[2] ? row[2] + LAmMark(LAmOf(row)) : "";
}

function sugKey(row) {
    return dafKey(row && row[2] || "") + (LAmOf(row) === 2 ? ":" : "");
}

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function show(v) {
    var all = document.querySelectorAll(".view");
    for (var i = 0; i < all.length; i++) all[i].className = "view";
    var el = document.getElementById("v-" + v);
    if (el) el.className = "view on";
    window.scrollTo(0, 0);
    if (v === "home") {
        var stu = stuDevice();
        if (stu) {
            stuHomeGo(stu);
            return;
        }
        if (stuMode) {
            trackBack();
            return;
        }
        renderHome();
    }
    if (v === "insts") renderInsts();
    if (v === "calls") {
        renderCalls();
        pullTagDefs().then(function(ok) {
            if (ok) renderCalls();
        });
        pullTeamLog().then(function(ok) {
            if (ok) renderCalls();
        });
    }
    if (v === "reg") renderReg();
    if (v === "my") renderMy();
    if (v === "gate") {
        teamCode = "";
        paintPins();
        document.getElementById("gate-msg").textContent = "";
    }
    paintAdmChip();
}

function backToTrack() {
    openTrack(state.track.id);
}

function backToWeek() {
    openWeek(state.track.id, state.week);
}

var stuMode = /[?&]st=1/.test(location.search);

function stuQ() {
    if (!stuMode) return "";
    var m = /[?&]inst=([^&#]*)/.exec(location.search);
    return m && m[1] ? "&inst=" + m[1] : "";
}

function fromQ() {
    return stuMode ? stuQ() : "&from=home";
}

function staffSign() {
    try {
        var L = localStorage;
        return L.getItem("df:admOk") === "1" || !!L.getItem("df:head") || L.getItem("df:headSeen") === "1" || !!L.getItem("df:ram") || !!L.getItem("dfReg") || !!L.getItem("df:dfBoard");
    } catch (e) {
        return false;
    }
}

function stuHint() {
    if (staffSign() || !UI.stuHint) return "";
    var m = /[?&]inst=([^&#]*)/.exec(location.search);
    return '<p class="stuhint">' + esc(UI.stuHint) + ' <a href="join.html' + (m && m[1] ? "?inst=" + m[1] : "") + '">' + esc(UI.stuHintGo) + "</a></p>";
}

function trackBack() {
    if (!stuMode) {
        show("home");
        return;
    }
    var m = /[?&]inst=([^&]*)/.exec(location.search);
    if (/[?&]from=tzevet\b/.test(location.search)) {
        location.href = "tzevet.html" + (m ? "?inst=" + m[1] : "");
        return;
    }
    location.href = "join.html" + (m ? "?inst=" + m[1] : "");
}

var homeTrack = localStorage.getItem("dfHomeTrack") || "taanit";

function weekOf(tr) {
    var wi = weekIndex();
    return wi < 0 ? 0 : wi;
}

function contentFor(id) {
    var tr = trackById(id), i = weekOf(tr);
    return {
        tr: tr,
        i: i,
        row: tr.cal[i],
        c: CONTENT[id + "-" + (i + 1)]
    };
}

function openWeekNow() {
    var wk = typeof LWeek === "function" ? LWeek() : -1;
    var d = typeof LDaf === "function" ? LDaf(homeTrack, wk < 0 ? 0 : wk) : "";
    if (d && showRow("mid")) {
        openWeek(homeTrack, wk < 0 ? 0 : wk);
        return;
    }
    if (!d) {
        openWeek(homeTrack, weekOf(trackById(homeTrack)));
        return;
    }
    location.href = "learn.html?mas=" + encodeURIComponent(homeTrack) + "&" + LDafQ(homeTrack, wk < 0 ? 0 : wk) + fromQ();
}

function openTrackNow() {
    openTrack(homeTrack);
}

function pickTrack(id) {
    homeTrack = id;
    localStorage.setItem("dfHomeTrack", id);
    renderHome();
}

DeckLoad().then(function(ok) {
    if (ok && typeof renderHome === "function") {
        try {
            renderHome();
        } catch (e) {}
    }
});

function homeAmda() {
    if (typeof LAmdaSync !== "function") return;
    LAmdaSync(function() {
        try {
            renderHome();
        } catch (e) {}
    });
}

setTimeout(homeAmda, 3e3);

document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible") homeAmda();
});

function renderHome() {
    tourLauncher();
    var w = contentFor(homeTrack), tr = w.tr, row = w.row, c = w.c;
    var wi = weekIndex();
    var when = wi < 0 ? "נפתח בפרשת בראשית" : "שבוע " + (wi + 1) + " מתוך " + tr.cal.length;
    var s = StageHtml({
        track: homeTrack,
        pick: "pickTrack",
        deck: "openFromHome",
        week: "openWeekNow",
        trail: "openTrackNow"
    });
    document.getElementById("stage").innerHTML = s;
    document.getElementById("mini").innerHTML = RailHtml({
        track: homeTrack,
        go: "openTrack"
    });
    var today = new Date;
    today.setHours(0, 0, 0, 0);
    var nowIdx = 0;
    PHASES.forEach(function(ph, i) {
        if (today >= new Date(ph.from + "T00:00:00")) nowIdx = i;
    });
    document.getElementById("plan").innerHTML = '<div class="steps">' + PHASES.map(function(ph, i) {
        var cls = i < nowIdx ? "done" : i === nowIdx ? "now" : "";
        return '<div class="st ' + cls + '"><i></i><b>' + esc(ph.t) + "</b>" + "<small>" + esc(ph.sub) + "</small></div>";
    }).join("") + "</div>" + (!showRow("here") ? "" : '<div class="here"><em>עכשיו</em><span>' + (nowIdx === 0 ? "נרשמים, מעריכים כמה תלמידים, ומזמינים גמרות במחיר מוזל." : esc(PHASES[nowIdx].t) + " · " + esc(PHASES[nowIdx].sub)) + "</span></div>");
    var cap = document.getElementById("stagecap");
    if (cap) {
        cap.textContent = UI.stageSub;
        cap.style.display = showRow("cap") ? "" : "none";
    }
    var sp = document.getElementById("sec-plan");
    if (sp) sp.style.display = showRow("plan") ? "" : "none";
    var SOON_G = [ [ "#8C681F", 18, "אבות ובנים", '<circle cx="5.6" cy="5" r="3"/>' + '<path d="M1 17.5c0-3 2-4.8 4.6-4.8s4.6 1.8 4.6 4.8z"/>' + '<circle cx="15" cy="8.4" r="2.2"/>' + '<path d="M11.4 17.5c0-2.1 1.6-3.5 3.6-3.5s3.6 1.4 3.6 3.5z"/>' ], [ "#3B7D57", 14, "חבורות לימוד", '<circle cx="4.4" cy="6.4" r="2.3"/><circle cx="10" cy="5.6" r="2.6"/>' + '<circle cx="15.6" cy="6.4" r="2.3"/>' + '<path d="M.8 17.2c0-3 4.1-4.9 9.2-4.9s9.2 1.9 9.2 4.9z"/>' ], [ "#17468F", 9, "לומדים לבד", '<path d="M2.4 4.6c2.5-1.1 5.1-1.1 7.6 0v11.2c-2.5-1.1-5.1-1.1-7.6 0z"/>' + '<path d="M17.6 4.6c-2.5-1.1-5.1-1.1-7.6 0v11.2c2.5-1.1 5.1-1.1 7.6 0z"/>' ] ];
    document.getElementById("soon").innerHTML = !CFG_SOON() ? "" : '<div class="soon" role="button" tabindex="0" ' + "onclick=\"toast('הלוח בפיתוח - יגיע לפני תחילת התוכנית.')\">" + '<div class="sn-h"><span class="sn-tag">בקרוב</span>' + "<b>לוח ההתקדמות של הישיבה</b></div>" + '<div class="sn-g">' + SOON_G.map(function(g) {
        return '<div class="sn-t" style="--c:' + g[0] + '">' + '<svg viewBox="0 0 20 20">' + g[3] + "</svg>" + "<b>" + g[1] + "</b><span>" + g[2] + "</span></div>";
    }).join("") + "</div>" + '<div class="sn-f"><em>41 לומדים השבוע</em>' + '<i class="sn-share"><svg viewBox="0 0 20 20"><circle cx="15" cy="4.5" r="2.3"/>' + '<circle cx="5" cy="10" r="2.3"/><circle cx="15" cy="15.5" r="2.3"/>' + '<path d="M7 8.8l6-3.3M7 11.2l6 3.3" stroke="currentColor" stroke-width="1.5" ' + 'fill="none"/></svg>שיתוף</i></div></div>';
    renderNet();
    var mine = regSaved();
    var showNow = rosterMode() === "now";
    var inList = INSTITUTIONS.filter(function(i) {
        return showNow ? i.joined : i.last;
    });
    var openN = INSTITUTIONS.length - inList.length;
    document.getElementById("rings").innerHTML = '<div class="rings">' + '<div class="ring"><div class="in"><div class="n">' + PROGRAM.lastYear.students + '</div><div class="t">' + UI.ringStudents.replace("{mas}", esc(PROGRAM.lastYear.masechet)) + "</div></div></div>" + '<div class="ring b"><div class="in"><div class="n">' + inList.length + "</div>" + '<div class="t">' + (showNow ? UI.ringInstNow : UI.ringInstLast) + "</div></div></div>" + "</div>";
    document.getElementById("inbox").innerHTML = '<div class="inbox"><div class="hd"><b>' + esc(showNow ? UI.inTitleNow : UI.inTitleLast) + "</b>" + "<span>" + inList.length + " מתוך " + INSTITUTIONS.length + '</span></div><div class="joined">' + inList.map(function(i) {
        return '<span class="jp">' + esc(i.name) + "</span>";
    }).join("") + (openN ? '<span class="jp open">' + esc(UI.inOpen.replace("{n}", openN)) + "</span>" : "") + '</div><div class="note">' + esc(UI.inNote) + "</div></div>";
    var u = uniformPrice();
    var disc = SFARIM.filter(function(s) {
        return priceOf(s.id).off;
    });
    var offer;
    if (u) offer = fill(UI.offerAll, {
        p: shek(u.price),
        list: shek(u.list)
    }); else if (disc.length > 1) offer = fill(UI.offerFrom, {
        p: shek(priceRange().min),
        list: shek(priceOf(disc[0].id).list)
    }); else if (disc.length === 1) offer = fill(UI.offerOne, {
        name: esc(disc[0].name),
        p: shek(priceOf(disc[0].id).price),
        list: shek(priceOf(disc[0].id).list)
    }); else offer = esc(UI.offerNone);
    document.getElementById("cta").innerHTML = '<button class="btn gd" onclick="show(\'reg\')">' + esc(UI.ctaBtn) + "</button>" + stuHint() + '<p style="font-size:.8rem;color:var(--ink-3);font-weight:700;text-align:center;' + 'margin-top:9px;line-height:1.5">' + (mine ? esc(UI.ctaSubAgain) : fill(UI.ctaSub, {
        offer: offer
    })) + "</p>";
    var top = document.getElementById("cta-top");
    if (top) {
        top.innerHTML = myInstRow() ? '<button class="btn p pnl" onclick="show(\'my\')">' + esc(PANEL.btn) + " ←<small>" + esc(PANEL.btnSub) + "</small></button>" : '<button class="btn gd" onclick="show(\'reg\')">' + esc(UI.ctaBtn) + "</button>" + stuHint();
    }
    var st = document.getElementById("stagetag");
    if (st) st.textContent = UI.stageTag;
    var zt = document.getElementById("z-tag"), zs = document.getElementById("z-sub");
    if (zt) zt.textContent = UI.zoneTag;
    if (zs) zs.textContent = UI.zoneSub;
    renderBoard();
    reveal();
}
