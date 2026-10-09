function admGo(t) {
    var m = ADM_OLD[t];
    if (m) {
        admTab = m[0];
        if (m[1]) admSub[m[0]] = m[1];
    } else {
        admTab = t;
        if (t === "more") admSub.more = "";
    }
    renderAdmin();
}

var launchedAsAdmin = false;

try {
    launchedAsAdmin = sessionStorage.getItem("df:admLaunch") === "1";
} catch (e) {}

function admExit() {
    location.hash = "";
    show("home");
    paintAdmChip();
}

function admBack() {
    if (document.querySelector("#v-admin .adm-nav")) show("admin"); else adminEntry();
    paintAdmChip();
}

function paintAdmChip() {
    var el = document.getElementById("adm-chip");
    if (!el) return;
    var away = launchedAsAdmin && isStandalone() && !document.querySelector("#v-admin.on") && !document.querySelector("#v-gate.on");
    el.className = away ? "on" : "";
}

var SUB = {
    daf: [ [ "daf", "moreDaf" ] ]
};

var MORE = [ {
    g: "moreGSet",
    items: [ [ "links", "moreLinks" ], [ "amdawa", "moreAmdaWa" ], [ "lottery", "moreLottery" ] ]
}, {
    g: "moreGAdv",
    adv: 1,
    items: [ [ "amda", "admTabAmda" ], [ "open", "moreOpen" ], [ "orders", "moreOrders" ], [ "price", "morePrice" ], [ "guide", "moreGuide" ], [ "text", "moreText" ], [ "screens", "moreScreens" ], [ "data", "moreData" ], [ "sys", "moreSys" ] ]
} ];

function admHome(leaf) {
    if (leaf === "people") return "stu";
    if (leaf === "push" || leaf === "tmpl") return "push";
    if (leaf === "setup") return "setup";
    if (leaf === "calls" || leaf === "inst") return "inst";
    if (leaf === "daf") return "daf";
    if (leaf === "hot") return "hot";
    for (var i = 0; i < MORE.length; i++) {
        for (var j = 0; j < MORE[i].items.length; j++) if (MORE[i].items[j][0] === leaf) return "more";
    }
    return "";
}

var ADM_OLD = {
    what: [ "stu", "" ],
    mine: [ "stu", "" ],
    amda: [ "more", "amda" ],
    show: [ "more", "screens" ],
    links: [ "more", "links" ],
    sys: [ "more", "sys" ],
    set: [ "more", "sys" ]
};

var admSub = {
    more: ""
};

function admSubGo(t) {
    if (t === "tmpl") t = "push";
    var home = admHome(t);
    if (home && home !== admTab) {
        admTab = home;
        if (home === "more" || home === "daf") admSub[home] = t;
        return renderAdmin();
    }
    admSub[admTab] = t;
    if (admTab === "more") return renderAdmin();
    admPane();
}

function admSubNow() {
    if (admTab === "more") return admSub.more || "";
    var list = SUB[admTab];
    if (!list) return {
        stu: "people",
        inst: "calls"
    }[admTab] || admTab;
    if (!admSub[admTab]) admSub[admTab] = list[0][0];
    return admSub[admTab];
}

function admSubBar() {
    var list = SUB[admTab];
    if (!list) return "";
    var now = admSubNow();
    return '<div class="tabs sub" style="margin-bottom:12px">' + list.map(function(t) {
        return '<button class="' + (now === t[0] ? "on" : "") + '" onclick="admSubGo(\'' + t[0] + "')\">" + esc(UI[t[1]]) + "</button>";
    }).join("") + "</div>";
}

function admMoreMenu() {
    return MORE.map(function(g) {
        var items = g.items.map(function(it) {
            return '<button class="mo-i" onclick="admSubGo(\'' + it[0] + "')\">" + "<span>" + esc(UI[it[1]]) + '</span><i aria-hidden="true">‹</i></button>';
        }).join("");
        return g.adv ? '<details class="adm-card mo-g"><summary>' + esc(UI[g.g]) + "</summary>" + items + "</details>" : '<div class="adm-card mo-g"><h4>' + esc(UI[g.g]) + "</h4>" + items + "</div>";
    }).join("");
}

function admMoreTitle(leaf) {
    for (var i = 0; i < MORE.length; i++) {
        for (var j = 0; j < MORE[i].items.length; j++) {
            if (MORE[i].items[j][0] === leaf) return UI[MORE[i].items[j][1]];
        }
    }
    return "";
}

function admPane() {
    var el = document.getElementById("adm-pane");
    if (!el) return;
    if (admTab === "stu" && document.getElementById("stu")) return admLive();
    if (admTab === "hot" && document.getElementById("hot-body")) return admLive();
    if (admTab === "setup" && document.getElementById("st-why")) return admLive();
    if (admTab === "inst" && document.querySelector("#adm-pane #calls-body")) {
        admLive();
        return renderCalls();
    }
    if (admTab === "push" && document.getElementById("pu-viz") && document.getElementById("adm-send")) {
        admLive();
        return admPush(document.getElementById("adm-send"));
    }
    var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    requestAnimationFrame(function() {
        window.scrollTo(0, scrollY);
    });
    var sub = admSubNow();
    var top = "";
    if (admTab === "more" && sub) {
        top = '<div class="mo-top"><button class="ppl-back" onclick="admSubGo(\'\')">' + esc(UI.moreBack) + "</button><b>" + esc(admMoreTitle(sub)) + "</b></div>";
    }
    el.innerHTML = top + '<div id="adm-body"></div>';
    var body = document.getElementById("adm-body");
    if (admTab === "setup" && (CFG.readKey || "").trim() && Date.now() - (admAutoAt.needs || 0) > 12e4) {
        admAutoAt.needs = Date.now();
        setTimeout(function() {
            needsLoad();
            accLoad();
            if (stuckRows === null) stuckLoad();
        }, 0);
    }
    if (admTab === "more" && !sub) {
        body.innerHTML = admMoreMenu();
        return;
    }
    if (admTab === "hot") {
        body.innerHTML = '<div id="hot-body"></div>';
        pplLast["hot-body"] = "";
        admLive();
        return;
    }
    if (admTab === "daf") {
        body.innerHTML = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">' + '<div style="flex:1;min-width:0">' + admSubBar().replace("margin-bottom:12px", "margin:0") + "</div>" + '<a class="back" style="text-decoration:none;margin:0;flex:none" href="studio.html">' + esc(UI.admStudio) + " ↗</a></div>" + '<div id="daf-body"></div>';
        body = document.getElementById("daf-body");
    }
    if (sub === "people") return admStudents(body);
    if (sub === "setup") return admSetup(body);
    if (sub === "amda") return admAmda(body);
    if (sub === "amdawa") return admAmdaWa(body);
    if (sub === "lottery") {
        body.innerHTML = admPairs();
        return;
    }
    if (sub === "push" && (CFG.readKey || "").trim()) {
        var now = Date.now(), last = admAutoAt[sub] || 0;
        var fresh = pushRows ? admAutoAt.pushOk || 0 : 0;
        if (now - last > 12e4 && now - fresh > 12e4) {
            admAutoAt[sub] = now;
            setTimeout(function() {
                pushLoad().then(function(ok) {
                    if (ok) admAutoAt.pushOk = Date.now();
                });
            }, 0);
        }
    }
    if (sub === "push") return admPushTab(body);
    if (sub === "data") return admData(body);
    if (sub === "calls") {
        body.innerHTML = '<div id="calls-body"></div>' + admInstHead();
        admLive();
        renderCalls();
        return pullCalls().then(renderCalls).catch(function() {});
    }
    if (sub === "links") {
        admLinks(body);
        return admMarkHint();
    }
    if (sub === "sys") {
        admSet(body);
        return admInstallBox();
    }
    if (sub === "guide") {
        body.innerHTML = guCard();
        return setTimeout(guPaint, 0);
    }
    if (sub === "daf") return admDecks(body);
    if (sub === "open") return admOpen(body);
    if (sub === "price") return admPrice(body);
    if (sub === "text") return admText(body);
    if (sub === "orders") return admOrders(body);
    if (sub === "screens") {
        admShow(body);
        admShowGroup(body);
        return admMarkHint();
    }
}

function admInstHead() {
    var n = INSTITUTIONS.filter(function(i) {
        return i.joined;
    }).length;
    return '<div class="adm-card" style="margin-bottom:11px"><div class="row" style="padding:0">' + "<b>" + esc(UI.instJoined.replace("{n}", n)) + "</b>" + '<button class="ppl-back" onclick="admSubGo(\'links\')">' + esc(UI.instEdit) + "</button></div></div>";
}

function orderByCard() {
    return '<div class="adm-card" style="margin-bottom:11px"><h4>מועד אחרון להזמנת גמרות</h4>' + '<p class="h">מופיע בטופס ההרשמה, ליד הכמויות. ריק = לא מוצג. ' + "את נוסח המשפט משנים בטקסטים ← הזמנת גמרות.</p>" + '<div class="fld"><input type="date" dir="ltr" value="' + esc(CV("orderBy") != null ? CV("orderBy") : ORDER_BY) + '" onchange="cfgSet(\'orderBy\',this.value);admPane()"></div></div>';
}

function admOrders(el) {
    var list = pplOrderList().slice().sort(function(a, b) {
        return (b.total || 0) - (a.total || 0);
    });
    el.innerHTML = orderByCard() + '<div class="adm-card" style="margin-bottom:11px"><h4 id="ppl-ords"></h4>' + '<div id="ppl-ordb"></div></div>' + '<div class="adm-card"><h4>' + esc(UI.ordBy) + "</h4>" + (list.length ? list.map(function(r) {
        var io = INSTITUTIONS.filter(function(x) {
            return x.code === r.code;
        })[0];
        return '<div class="row" style="padding:7px 0"><span>' + esc(io && io.name || r.inst || r.code || "-") + (r.who ? '<div class="sub">' + esc(r.who) + "</div>" : "") + "</span>" + '<b style="white-space:nowrap">' + esc(UI.ordN.replace("{n}", r.total || 0)) + "</b></div>";
    }).join("") : '<p class="h">' + esc(UI.ordNone) + "</p>") + "</div>";
    delete pplLast["ppl-ords"];
    delete pplLast["ppl-ordb"];
    pplOrder();
    if (Date.now() - (admAutoAt.ord || 0) > 12e4) {
        admAutoAt.ord = Date.now();
        setTimeout(function() {
            pullRegs();
        }, 0);
    }
}

var SHOW_G = [ [ "pub", "showGPub" ], [ "kid", "showGKid" ], [ "team", "showGTeam" ], [ "help", "showGHelp" ] ];

function admShowGroup(el) {
    var cards = Array.prototype.slice.call(el.querySelectorAll(".adm-card[data-g]"));
    if (!cards.length) return;
    cards.forEach(function(c) {
        var p = c.querySelector("p.h");
        if (!p || p.parentNode !== c) return;
        var d = document.createElement("details");
        d.className = "hx";
        d.innerHTML = "<summary>" + esc(UI.showWhy) + "</summary>";
        c.insertBefore(d, p);
        d.appendChild(p);
    });
    var anchor = cards[0];
    SHOW_G.forEach(function(g) {
        var mine = cards.filter(function(c) {
            return c.getAttribute("data-g") === g[0];
        });
        if (!mine.length) return;
        var hd = document.createElement("div");
        hd.className = "sec";
        hd.innerHTML = "<b>" + esc(UI[g[1]]) + "</b><i></i>";
        el.insertBefore(hd, anchor);
        mine.forEach(function(c) {
            el.insertBefore(c, anchor);
        });
    });
}

var JOIN_TAB = "לומדים";

function whenTxt(t) {
    var m = Math.round((Date.now() - t) / 6e4);
    if (m < 2) return "עכשיו";
    if (m < 60) return "לפני " + m + " דקות";
    var h = Math.round(m / 60);
    if (h < 24) return "לפני " + h + (h === 1 ? " שעה" : " שעות");
    var d = Math.round(h / 24);
    return "לפני " + d + (d === 1 ? " יום" : " ימים");
}

var partState = {
    at: 0,
    msg: ""
};

var admAutoAt = {};

var needsFail = null, needsBusy = "", needsMsg = "", sayLog = null;

var peopleH = 900;

window.addEventListener("message", function(e) {
    var d = e && e.data, f = document.getElementById("people-f");
    if (!d || !f || e.source !== f.contentWindow) return;
    if (d.dfBoardN) {
        ppl.boardMsg = d.ok ? "" : d.msg || "";
        if (d.ok) ppl.boardAt = Date.now();
        pplPaint();
    }
    if (typeof d.dfBoardH !== "number") return;
    if (f.style.display === "none") return;
    peopleH = Math.max(300, d.dfBoardH);
    f.style.height = peopleH + "px";
});

var ppl = {
    q: "",
    f: "",
    open: null,
    y: 0,
    boardMsg: "",
    boardAt: 0,
    mine: ""
};

var pplLast = {};

function pplSet(id, html) {
    var e = document.getElementById(id);
    if (!e || pplLast[id] === html) return;
    pplLast[id] = html;
    e.innerHTML = html;
}

function pplCode(c) {
    c = c || "";
    for (var i = 0; i < INSTITUTIONS.length; i++) if (INSTITUTIONS[i].code === c) return c;
    return "-";
}

function pplName(c, r) {
    if (c === "") return "כל הישיבות";
    if (c === "-") return "ללא ישיבה";
    for (var i = 0; i < INSTITUTIONS.length; i++) if (INSTITUTIONS[i].code === c) return INSTITUTIONS[i].name;
    return r && r.inst || c;
}

function pplData() {
    var src = Store.get("rosterCache:all", null);
    if (!src) src = (Store.get("partCache", []) || []).filter(function(p) {
        return p.role !== "הורה";
    });
    var n = {}, tot = 0;
    src.forEach(function(p) {
        if (p.test) return;
        var c = pplCode(p.inst);
        n[c] = (n[c] || 0) + 1;
        tot++;
    });
    var regs = (Store.get("registrations", []) || []).slice(), own = regSaved(), reg = {};
    if (own && own.code && !regs.some(function(r) {
        return r.code === own.code;
    })) regs.unshift(own);
    regs.forEach(function(r) {
        if (r.code) reg[r.code] = r;
    });
    var seen = {}, rows = [], repTot = 0;
    var accC = accList().map(function(a) {
        return pplCode(a.inst);
    });
    Object.keys(n).concat(Object.keys(reg), accC).forEach(function(c) {
        if (seen[c]) return;
        seen[c] = 1;
        var r = reg[c] || null, got = n[c] || 0;
        var rep = r ? r.size || r.total || 0 : null;
        if (rep) repTot += rep;
        rows.push({
            c: c,
            name: pplName(c, r),
            got: got,
            rep: rep,
            reg: r,
            gap: rep ? Math.abs(rep - got) : 0
        });
    });
    rows.sort(function(a, b) {
        return b.got - a.got || String(a.name).localeCompare(String(b.name), "he");
    });
    return {
        rows: rows,
        tot: tot,
        repTot: repTot,
        gaps: rows.filter(function(x) {
            return x.gap;
        }).length
    };
}
