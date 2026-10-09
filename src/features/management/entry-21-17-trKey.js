var TR_KEY = [ [ "c-land", "trs_land" ], [ "c-intro", "trs_intro" ], [ "c-inst", "trs_w1" ], [ "c-form", "trs_form" ], [ "c-note", "trs_w4" ], [ "c-help", "trs_w9" ], [ "c-done", "trs_done" ] ];

function trKey() {
    return '<div class="trk">' + TR_KEY.map(function(k) {
        return '<span><i class="' + k[0] + '"></i>' + esc(UI[k[1]] || "") + "</span>";
    }).join("") + '<span><i class="end"></i>' + esc(UI.trLast) + "</span>" + '<span><i class="k"></i>' + esc(UI.trc_hero_go) + "</span></div>";
}

function admTrail() {
    var all = trRows();
    if (!all) return stFold("trail", "🧭", UI.trT, '<p class="h">' + esc(trMsg || UI.trNone) + "</p>");
    var today = trDay(Date.now());
    var L = all.filter(function(x) {
        if (ADM_INST && (x.inst || "-") !== ADM_INST) return false;
        return trv.t !== "today" || trDay(x.t) === today;
    });
    var per = {};
    L.forEach(function(x) {
        if (x.dev) per[x.dev] = (per[x.dev] || 0) + 1;
    });
    var h = '<div class="trf">' + '<button class="' + (trv.t === "today" ? "on" : "") + "\" onclick=\"trSet('t','today')\">" + esc(UI.trToday) + "</button>" + '<button class="' + (trv.t !== "today" ? "on" : "") + "\" onclick=\"trSet('t','all')\">" + esc(UI.trAll) + "</button></div>";
    h += trKey();
    if (!L.length) h += '<p class="h">' + esc(UI.whyNone) + "</p>";
    h += '<div class="trl">' + L.slice(0, trv.n).map(function(x) {
        var sid = String(x.id).replace(/[^\w-]/g, ""), op = trv.open === sid;
        return '<button class="trr' + (op ? " op" : "") + "\" onclick=\"trSet('open','" + sid + '\')" aria-expanded="' + op + '">' + "<time>" + trHm(x.t) + '</time><span class="ic">' + trWhere(x) + (per[x.dev] > 1 ? " <small>×" + per[x.dev] + "</small>" : "") + "</span>" + '<span class="trp">' + trPath(x) + "</span><b>" + (x.j ? "✔ " : "") + trDur(x.tot) + "</b></button>" + (op ? trOne(x) : "");
    }).join("") + "</div>";
    if (L.length > trv.n) h += '<button class="btn g" style="margin-top:8px" onclick="trv.n+=20;pplSet(\'st-trail\',admTrail())">' + esc(UI.trMore) + " (" + (L.length - trv.n) + ")</button>";
    var T = Store.get("trails", null);
    h += '<p class="h" style="margin-top:8px">' + esc(whenTxt(T.at)) + (trMsg ? " · " + esc(trMsg) : "") + "</p>";
    return stFold("trail", "🧭", UI.trT, h);
}

function trShow() {
    pplSet("st-scr", admScr());
    pplSet("st-trail", admTrail());
}

var SC_MAIN = [ "land", "w1", "w2", "w3", "w4" ];

var SC_PIC = {
    land: 1,
    w1: 1,
    w2: 1,
    w3: 1,
    w4: 1,
    w8: 1,
    w9: 1
};

var scv = {
    t: "all"
};

function scSet(t) {
    scv.t = t;
    pplSet("st-scr", admScr());
}

function scMed(a) {
    if (!a.length) return null;
    a = a.slice().sort(function(x, y) {
        return x - y;
    });
    var m = a.length >> 1;
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

function admScr() {
    var all = trRows();
    if (!all) return stFold("scr", "⏱", UI.scT, '<p class="h">' + esc(trMsg || UI.trNone) + "</p>");
    var today = trDay(Date.now());
    var L = all.filter(function(x) {
        if (ADM_INST && (x.inst || "-") !== ADM_INST) return false;
        return scv.t !== "today" || trDay(x.t) === today;
    });
    var S = {}, order = [];
    L.forEach(function(x) {
        var mine = {};
        x.ev.forEach(function(e) {
            var k = e[0];
            if (!(k in mine)) mine[k] = 0;
            mine[k] += +e[2] || 0;
        });
        var last = x.ev[x.ev.length - 1][0];
        Object.keys(mine).forEach(function(k) {
            if (!S[k]) {
                S[k] = {
                    got: 0,
                    t: [],
                    lost: []
                };
                order.push(k);
            }
            S[k].got++;
            S[k].t.push(mine[k]);
            if (!x.j && k === last && k !== "done") S[k].lost.push(mine[k]);
        });
    });
    var worst = "", wn = 0;
    order.forEach(function(k) {
        if (S[k].lost.length > wn) {
            wn = S[k].lost.length;
            worst = k;
        }
    });
    var card = function(k, i) {
        var d = S[k] || {
            got: 0,
            t: [],
            lost: []
        }, med = scMed(d.t), lm = scMed(d.lost);
        var pc = L.length ? Math.round(d.got * 100 / L.length) : 0;
        return '<div class="sc' + (k === worst ? " bad" : "") + (d.got ? "" : " none") + '">' + (i ? '<span class="sc-i">' + i + "</span>" : "") + (SC_PIC[k] ? '<img src="joinpics/' + k + '.webp" alt="" loading="lazy">' : '<div class="sc-p">' + esc(trName("trs_", k)) + "</div>") + '<div class="sc-b"><b class="sc-h">' + esc(trName("trs_", k)) + "</b>" + '<div class="sc-t"><b>' + (med == null ? "-" : trDur(med)) + "</b><small>" + esc(UI.scTyp) + "</small></div>" + '<div class="sc-r">' + esc(fill(UI.scGot, {
            n: d.got
        })) + (L.length ? " · " + pc + "%" : "") + "</div>" + '<div class="sc-x' + (d.lost.length ? "" : " z") + '">' + (d.lost.length ? esc(fill(UI.scLost, {
            n: d.lost.length
        })) + " · " + esc(fill(UI.scAfter, {
            t: trDur(lm)
        })) : esc(UI.scNoLost)) + "</div></div></div>";
    };
    var h = '<div class="trf">' + '<button class="' + (scv.t === "today" ? "on" : "") + '" onclick="scSet(\'today\')">' + esc(UI.trToday) + "</button>" + '<button class="' + (scv.t !== "today" ? "on" : "") + '" onclick="scSet(\'all\')">' + esc(UI.trAll) + "</button></div>";
    if (!L.length) return stFold("scr", "⏱", UI.scT, h + '<p class="h">' + esc(UI.whyNone) + "</p>");
    h += '<p class="h">' + esc(fill(UI.scN, {
        n: L.length
    })) + "</p>";
    h += '<div class="sc-g">' + SC_MAIN.map(function(k, i) {
        return card(k, i + 1);
    }).join("") + "</div>";
    var side = order.filter(function(k) {
        return SC_MAIN.indexOf(k) < 0;
    });
    if (side.length) h += '<h5 class="sc-s">' + esc(UI.scSide) + '</h5><div class="sc-g">' + side.map(function(k) {
        return card(k, 0);
    }).join("") + "</div>";
    h += '<p class="h sc-f">' + esc(UI.scFoot) + "</p>";
    return stFold("scr", "⏱", UI.scT, h);
}

var admLiveT = null;

function admPushTab(el) {
    el.innerHTML = '<div id="pu-viz"></div><div id="adm-send"></div><div class="sec" style="margin-top:16px"><b>' + esc(UI.sendTmpl) + '</b><i></i></div><div id="adm-tmpl"></div>';
    pplLast = {};
    admLive();
    admPush(document.getElementById("adm-send"));
    admTmpl(document.getElementById("adm-tmpl"));
    if (!admLiveT) admLiveT = setInterval(function() {
        if (admTab !== "push" || document.hidden || !document.getElementById("pu-viz")) {
            clearInterval(admLiveT);
            admLiveT = null;
            return;
        }
        needsLoad();
        pplFrame({
            dfReload: 1
        });
    }, 3e4);
}

function sayNums(res) {
    var g = function(re) {
        var m = re.exec(res || "");
        return m ? +m[1] : 0;
    };
    var o = {
        ok: g(/התקבלה[^·]*?ל-(\d+)/),
        bad: g(/נכשלה ל-(\d+)/),
        gone: g(/(?:פג|אין מנוי פעיל) ל-(\d+)/),
        open: g(/נפתחה ל-(\d+)/)
    };
    o.sent = o.ok + o.bad + o.gone;
    return o;
}

function admPushViz() {
    var src = (Store.get("rosterCache:all", null) || []).filter(function(p) {
        return !p.test && p.role !== "הורה" && (!ADM_INST || pplCode(p.inst) === ADM_INST);
    });
    var st = {
        on: 0,
        gone: 0,
        blocked: 0,
        none: 0,
        unk: 0
    }, br = {};
    src.forEach(function(p) {
        var s = p.pstate === "gone" ? "gone" : p.push ? "on" : p.pstate || "none";
        if (s === "on") st.on++; else if (s === "gone") st.gone++; else if (s === "blocked") st.blocked++; else if (s === "?") st.unk++; else st.none++;
        if (p.push || s === "gone") {
            var k = s === "gone" ? "⌛ " + UI.pGone : p.br || UI.unknown;
            br[k] = (br[k] || 0) + 1;
        }
    });
    var h = vCard("📶", UI.pStateT, src.length ? vStack([ {
        n: st.on,
        t: UI.pOn,
        c: "g"
    }, {
        n: st.gone,
        t: UI.pGone,
        c: "o"
    }, {
        n: st.blocked,
        t: UI.pBlocked,
        c: "r"
    }, {
        n: st.none,
        t: UI.pNone,
        c: "n"
    }, {
        n: st.unk,
        t: UI.unknown,
        c: "u"
    } ]) + '<h5 style="margin-top:12px">' + esc(UI.pBrT) + "</h5>" + vBars(br) : '<p class="h">' + esc(UI.whyNone) + "</p>");
    var log = (sayLog || []).slice(0, 8);
    var tot = {
        ok: 0,
        bad: 0,
        gone: 0,
        sent: 0,
        open: 0
    };
    var rows = log.map(function(m) {
        var n = sayNums(m.res), all = n.sent;
        tot.ok += n.ok;
        tot.bad += n.bad;
        tot.gone += n.gone;
        tot.sent += n.sent;
        tot.open += n.open;
        var w = function(v) {
            return all ? (v * 100 / all).toFixed(1) : 0;
        };
        return '<div class="pl"><div class="pl-h"><b>' + esc(m.title || m.body.slice(0, 40)) + "</b><span>" + esc(sheetAgo(m.at)) + "</span></div>" + '<div class="pl-s">' + esc(m.who || "") + (m.aud ? " · " + esc(m.aud) : "") + "</div>" + (all ? '<div class="vs sm"><i class="g" style="width:' + w(n.ok) + '%"></i><i class="r" style="width:' + w(n.bad) + '%"></i>' + '<i class="o" style="width:' + w(n.gone) + '%"></i></div>' + '<div class="pl-n">' + esc(UI.pRowSent.replace("{n}", n.sent)) + " · " + esc(UI.pRowRecv.replace("{n}", n.ok)) + (n.open ? " · " + esc(UI.pRowOpen.replace("{n}", n.open)) : "") + (n.bad ? " · ✗ " + n.bad : "") + (n.gone ? " · ⌛ " + n.gone : "") + "</div>" : '<div class="pl-n">' + esc(m.res || "") + "</div>") + "</div>";
    }).join("");
    var tl = [ {
        n: tot.sent,
        t: UI.pSent,
        c: ""
    }, {
        n: tot.ok,
        t: UI.pRecv,
        c: "g"
    } ];
    if (tot.open) tl.push({
        n: tot.open,
        t: UI.pOpen,
        c: "g"
    });
    tl.push({
        n: tot.bad,
        t: UI.pBad,
        c: tot.bad ? "r" : ""
    }, {
        n: tot.gone,
        t: UI.pGone,
        c: "o"
    });
    h += vCard("📤", UI.pLastT, (log.length ? vTiles(tl) + '<p class="h">' + esc(UI.pRecvH) + "</p>" + rows : '<p class="h">' + esc(UI.whyNone) + "</p>") + '<p class="h live">● ' + esc(UI.pLive) + "</p>");
    return h;
}

function admInstList() {
    var d = pplData();
    var rows = d.rows.filter(function(x) {
        return !ADM_INST || x.c === ADM_INST;
    });
    return '<div class="adm-card" style="margin-bottom:11px">' + (ADM_INST ? "" : '<div id="ppl-acc"></div>') + '<div id="ppl-list2">' + rows.map(function(x) {
        return '<button class="pr" data-c2="' + esc(x.c) + '">' + pplRowHtml(x) + "</button>";
    }).join("") + "</div>" + (ADM_INST ? '<div class="ppl-oi" id="ppl-oi"></div><div id="ppl-acc"></div>' : "") + "</div>";
}

document.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest("[data-c2]");
    if (!b) return;
    admInstPick(b.getAttribute("data-c2"));
    admGo("stu");
});

function admLive() {
    admRefreshBtn();
    admBell();
    if (admTab === "hot") pplSet("hot-body", admHotHtml());
    if (admTab === "stu") {
        pplSet("stu-brd", boardHtml(ADM_INST, admInstName(ADM_INST), false, "admDet()"));
        pplSet("stu-head", admStuHead());
        var conf = (conflictRows || []).filter(function(p) {
            return !p.done;
        }).length;
        pplSet("ppl-conf", conf ? '<div style="margin-bottom:11px">' + admConflicts() + "</div>" : "");
    }
    if (admTab === "setup") {
        pplSet("st-tiles", admSetupTiles());
        pplSet("st-help", admSetupHelp());
        pplSet("st-alert", "");
        pplSet("ppl-fun", pplFun());
        pplSet("st-why", admWhy());
        trShow();
        pplSet("st-err", funErrs());
        pplSet("st-inst", funByInst());
        pplSet("st-day", funByDay());
        pplSet("st-foot", funFoot());
    }
    if (admTab === "push") pplSet("pu-viz", admPushViz());
    if (admTab === "inst" && document.getElementById("in-list")) {
        var inWas = pplLast["in-list"];
        pplSet("in-list", admInstList());
        if (pplLast["in-list"] !== inWas) {
            delete pplLast["ppl-oi"];
            delete pplLast["ppl-acc"];
        }
        if (ADM_INST) {
            ppl.open = ADM_INST;
            pplOneHead(pplData());
        } else pplSet("ppl-acc", accHtml("", 1));
    }
}

function renderAdmin() {
    var grp = admTab === "setup" || admTab === "push" ? "stu" : admTab;
    var NAV = [ [ "stu", UI.admTStu, "👥" ], [ "daf", UI.admTDaf, "📖" ], [ "inst", UI.navInst, "🏫" ], [ "amda", amdaT("quick"), "🧭" ], [ "more", UI.admTTools, "☰" ] ];
    var h = '<div class="adm-nav adm-bar">' + '<button class="adm-ic" onclick="admExit()" aria-label="' + esc(UI.admToApp) + '">→</button>' + "<b>" + esc(UI.admTitle) + "</b>" + '<button class="adm-ic adm-bell' + (admTab === "hot" ? " on" : "") + '" onclick="admGo(\'hot\')" aria-label="' + esc(UI.hotH) + '">🔔<em id="adm-bell-n"></em></button>' + '<button id="adm-rf" class="adm-ic adm-rf" onclick="admRefreshAll()" aria-label="' + esc(UI.admRefresh) + '">⟳</button></div>' + (ADM_INST ? '<button class="adm-chip" onclick="admInstPick(\'\');renderAdmin()" aria-label="' + esc(UI.instChipX) + '">🏫 ' + esc(admInstName(ADM_INST)) + ' <span aria-hidden="true">✕</span></button>' : "") + (grp === "stu" ? '<div class="tabs sub" style="margin-top:10px">' + [ [ "stu", UI.stuSubBoard ], [ "push", UI.stuSubSend ], [ "setup", UI.stuSubSetup ] ].map(function(t) {
        return '<button class="' + (admTab === t[0] ? "on" : "") + '" onclick="admGo(\'' + t[0] + "')\">" + esc(t[1]) + "</button>";
    }).join("") + "</div>" : "") + '<div id="adm-pub" style="margin-top:12px"></div>' + '<div id="adm-pane" style="margin-top:14px"></div>' + '<p class="adm-ver">' + esc(UI.admVer) + " " + APP_VERSION + "</p>" + '<nav class="adm-bn" aria-label="' + esc(UI.admTitle) + '">' + NAV.map(function(t) {
        var on = t[0] === "amda" ? admTab === "more" && admSub.more === "amda" : grp === t[0] && !(t[0] === "more" && admSub.more === "amda");
        return '<button class="' + (on ? "on" : "") + '" onclick="' + (t[0] === "amda" ? "amdaQuick()" : "admGo('" + t[0] + "')") + '"' + (on ? ' aria-current="page"' : "") + '><i aria-hidden="true">' + t[2] + "</i><span>" + esc(t[1]) + "</span></button>";
    }).join("") + "</nav>";
    document.getElementById("admin-body").innerHTML = h;
    delete pplLast["adm-bell-n"];
    admBell();
    admPubBar();
    admPane();
    if (!admAutoAt.all) {
        admAutoAt.all = Date.now();
        setTimeout(admRefreshAll, 0);
    }
    if (Store.get("amdaOn", 0) && !document.querySelector("#amda.on")) {
        if (!amdaCount(amdaRoster()).n) {
            Store.set("amdaOn", 0);
            return;
        }
        amdaOpen();
        admTab = "more";
        admSub.more = "amda";
        renderAdmin();
    }
}
