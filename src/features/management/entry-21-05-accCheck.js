var accSt = "", accPh = true, accBusy = false, accPhSent = false, accPosted = false;

function accCheck(force) {
    var code = myBoard();
    var me = typeof ASK !== "undefined" && ASK.get ? ASK.get() : null;
    if (!code || !me || !me.id || me.inst !== code) return;
    if (!(ASK.seen && ASK.seen())) return;
    var url = (CFG.api || API || "").trim();
    if (!url || accBusy) return;
    var has = !!instCode(code), last = Store.get("accAt", 0);
    if (!force && Date.now() - last < (has ? 36e5 : 6e4)) return;
    accBusy = true;
    Store.set("accAt", Date.now());
    scriptGet({
        acc: code,
        dev: me.id,
        has: has ? "1" : "0"
    }).then(function(d) {
        accBusy = false;
        if (!d || !d.status) return;
        var was = accSt;
        if (d.status === "ok" && d.k) {
            accSt = "ok";
            if (d.k !== instCode(code)) {
                setInstCode(code, d.k);
                codeBad = false;
                renderBoard();
                accRe();
            }
            return;
        }
        if (d.status === "locked") {
            accSt = "locked";
            if (has) {
                var m = Store.get("instCodes", {}) || {};
                delete m[code];
                Store.set("instCodes", m);
                renderBoard();
            }
        } else {
            accSt = "wait";
            if (d.status === "none" && !accPosted && ASK.post) {
                accPosted = true;
                ASK.post("רשום", null);
            }
        }
        accPh = d.phone !== false;
        if (!has && (was !== accSt || !accPh)) accRe();
    }).catch(function() {
        accBusy = false;
    });
}

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

function renderMy() {
    var el = document.getElementById("my-body");
    if (!el) return;
    var inst = myInstRow();
    if (!inst) {
        show("home");
        return;
    }
    var code = inst.code;
    renderBoard();
    if (!(typeof ASK !== "undefined" && ASK.seen && ASK.seen())) {
        el.innerHTML = '<div class="my-top"><b>' + esc(PANEL.title) + "</b>" + "<span>" + esc(inst.name) + "</span></div>" + '<div id="my-flow"></div>';
        askSetup("my-flow");
        var bar = document.getElementById("askrow");
        if (bar) bar.hidden = true;
        if (ASK.open) ASK.open();
        return;
    }
    el.innerHTML = '<div class="my-top"><b>' + esc(PANEL.title) + "</b>" + "<span>" + esc(inst.name) + "</span></div>" + (instCode(code) ? "" : '<div class="my-sec">' + accWaitHtml() + "</div>") + '<div class="my-sec"><h3>' + esc(PANEL.brdH) + "</h3>" + "<p>" + esc(PANEL.brdSub) + "</p>" + '<div id="my-brd"></div></div>' + '<div class="my-sec bare"><div id="my-say"></div></div>' + '<div class="my-sec"><h3>' + esc(PANEL.noteH) + "</h3>" + '<div id="my-note"></div></div>';
    document.getElementById("my-brd").innerHTML = boardHtml(code, inst.name);
    sayPaint();
    myNote();
    accCheck();
}

function myNote() {
    var el = document.getElementById("my-note");
    if (!el) return;
    var on = window.APPX && APPX.perm && APPX.perm() === "granted";
    el.innerHTML = '<div class="my-note' + (on ? " on" : "") + '"><b>' + esc(on ? PANEL.noteOn : PANEL.noteOff) + "</b>" + "<span>" + esc(PANEL.noteSub) + "</span>" + (on ? "" : '<button class="btn g" id="my-note-go">' + esc(PANEL.noteGo) + "</button>" + (window.APPX && APPX.perm && APPX.perm() === "denied" ? '<a href="hitraot.html" style="display:block;margin-top:8px;font-weight:800;' + 'font-size:.86rem;color:var(--blue)">' + esc(UI.hitLink) + "</a>" : "")) + "</div>";
    var b = document.getElementById("my-note-go");
    if (b) b.onclick = function() {
        if (typeof ASK !== "undefined" && ASK.at) ASK.at(3);
    };
}

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
    var host = document.getElementById(where || "ask-here");
    if (!host) return;
    if (host.getAttribute("data-on") && host.querySelector("#asksheet")) return;
    var code = myBoard();
    if (!code || typeof ASK === "undefined") return;
    host.setAttribute("data-on", "1");
    ASK.init({
        mount: host.id,
        key: "head",
        role: headT("roleYeshiva"),
        roleOptions: [ headT("roleYeshiva"), headT("roleChativa"), headT("roleRachez") ],
        whoFirst: true,
        phone: true,
        phoneReq: true,
        t: headT,
        klass: false,
        fem: headFem(),
        inst: function() {
            var c = myBoard();
            var i = INSTITUTIONS.filter(function(x) {
                return x.code === c;
            })[0];
            return i ? {
                code: i.code,
                name: i.name
            } : null;
        },
        onClose: function() {
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

var sayOpt = {
    seg: "",
    aud: "kids",
    way: "",
    grade: "",
    per: true,
    more: false,
    sigEd: false
};

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
