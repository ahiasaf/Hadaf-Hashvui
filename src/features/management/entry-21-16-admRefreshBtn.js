function admRefreshBtn() {
    var b = document.getElementById("adm-rf");
    if (!b) return;
    var busy = Date.now() - admBusyAt < 1500;
    b.className = "adm-ic adm-rf" + (busy ? " busy" : "");
    b.setAttribute("aria-label", busy ? UI.admRefreshing : UI.admRefresh);
}

function vTiles(list) {
    return '<div class="vt">' + list.map(function(x) {
        return '<div class="vt-i ' + (x.c || "") + '"><b>' + (x.n == null ? "-" : x.n) + "</b><span>" + esc(x.t) + "</span></div>";
    }).join("") + "</div>";
}

function vStack(parts) {
    var tot = parts.reduce(function(a, p) {
        return a + (p.n || 0);
    }, 0);
    if (!tot) return "";
    return '<div class="vs">' + parts.map(function(p) {
        return p.n ? '<i class="' + p.c + '" style="width:' + (p.n * 100 / tot).toFixed(1) + '%"></i>' : "";
    }).join("") + '</div><div class="vs-k">' + parts.map(function(p) {
        return p.n ? '<span><i class="' + p.c + '"></i>' + esc(p.t) + " <b>" + p.n + "</b></span>" : "";
    }).join("") + "</div>";
}

function vBars(map, max0, cls) {
    var ks = Object.keys(map).sort(function(a, b) {
        return map[b] - map[a];
    });
    if (!ks.length) return '<p class="h">' + esc(UI.whyNone) + "</p>";
    var max = max0 || map[ks[0]] || 1;
    return ks.slice(0, 8).map(function(k) {
        return '<div class="vb"><span>' + esc(k) + '</span><i><s class="' + (cls || "") + '" style="width:' + Math.max(3, map[k] * 100 / max).toFixed(1) + '%"></s></i><b>' + map[k] + "</b></div>";
    }).join("");
}

function vCard(icon, title, body, id) {
    return '<div class="adm-card vc"' + (id ? ' id="' + id + '"' : "") + '><h4><span aria-hidden="true">' + icon + "</span> " + esc(title) + "</h4>" + body + "</div>";
}

function admStudents(el) {
    if (!(CFG.readKey || "").trim()) return admPeople(el);
    el.innerHTML = '<div id="stu">' + '<div class="my-sec"><h3>' + esc(PANEL.brdH) + "</h3><p>" + esc(PANEL.brdSub) + "</p>" + '<div id="stu-brd"></div></div>' + '<div class="my-sec" id="stu-det"><div id="stu-head"></div><div id="ppl-conf"></div>' + '<iframe id="people-f" src="board.html?inst=all&embed=1' + (ADM_INST ? "&filt=" + encodeURIComponent(ADM_INST) : "") + (ADM_WAY ? "&way=" + encodeURIComponent(ADM_WAY) : "") + '" title="' + esc(UI.admTStu) + '" ' + 'scrolling="no" style="width:100%;border:0;display:block;height:' + peopleH + 'px"></iframe></div></div>';
    pplLast = {};
    admLive();
}

function admDet() {
    var d = document.getElementById("stu-det");
    if (d && d.scrollIntoView) d.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function admStuHead() {
    var d = pplData(), x = null;
    if (!ADM_INST) x = {
        c: "",
        got: d.tot,
        rep: d.repTot || null,
        gap: 0
    };
    d.rows.forEach(function(y) {
        if (y.c === ADM_INST) x = y;
    });
    if (!x) x = {
        c: ADM_INST,
        got: 0,
        rep: null,
        gap: 0
    };
    var m = [];
    if (ppl.boardMsg) m.push(esc(ppl.boardMsg)); else if (ppl.boardAt) m.push(esc(UI.admUpd) + " " + esc(whenTxt(ppl.boardAt)));
    return '<div class="stu-h"><span class="pr-t">' + pplTags(x) + "</span>" + (m.length ? '<span class="stu-m">' + m.join(" · ") + "</span>" : "") + "</div>";
}

var stOpen = {};

function admSetup(el) {
    el.innerHTML = '<div id="st-tiles"></div><div id="st-help"></div><div id="st-par"></div><div id="st-alert"></div><div id="ppl-fun"></div>' + '<details class="adm-card st-res"' + (stOpen.res ? " open" : "") + ' ontoggle="stOpen.res=this.open">' + '<summary><span aria-hidden="true">🔬</span> ' + esc(UI.stResT) + "</summary>" + '<div id="st-why"></div><div id="st-scr"></div><div id="st-trail"></div><div id="st-err"></div><div id="st-inst"></div>' + '<div id="st-day"></div><div id="st-foot"></div></details>';
    pplLast = {};
    admLive();
}

function stFold(k, icon, title, body) {
    return '<details class="st-f"' + (stOpen[k] ? " open" : "") + " ontoggle=\"stOpen['" + k + "']=this.open\">" + '<summary><span aria-hidden="true">' + icon + "</span> " + esc(title) + '</summary><div class="st-fb">' + body + "</div></details>";
}

function admSetupTiles() {
    var F = Store.get("funnel", null), has = F && F.people;
    var fAll = has ? funCount(funPeople(F, "")) : null;
    var j = ADM_INST ? bJoin(ADM_INST) : bJoinAll();
    var src = Store.get("rosterCache:all", null);
    var ros = src ? src.filter(function(p) {
        return !p.test && p.role !== "הורה" && (!ADM_INST || pplCode(p.inst) === ADM_INST);
    }) : null;
    var reg = j ? j.n : ros ? ros.length : fAll ? fAll.join : null;
    var push = ros ? ros.filter(function(p) {
        return p.push && p.pstate !== "gone";
    }).length : fAll ? fAll.push : null;
    var today = has ? funCount(funPeople(F, "today")).join : null;
    var stuck = stuckRows ? stuckOpen().length : null;
    var t = function(v, s) {
        return "<b>" + (v == null ? "-" : v) + "</b><span>" + esc(s) + "</span>";
    };
    return '<div class="st-n"><div>' + t(reg, UI.stReg) + "</div><div>" + t(push, UI.stPush) + "</div>" + '<button class="' + (stuck ? "r" : "") + '" onclick="stGoHelp()">' + t(stuck, UI.stStuck) + "</button>" + "<div>" + t(today, UI.stToday) + "</div></div>";
}

function stGoHelp() {
    var e = document.getElementById("st-help");
    if (e && e.scrollIntoView) e.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* Parents not yet linked to a student: one message to all, push or WhatsApp. */
var parSend = {
    busy: false,
    msg: ""
};

function admParList() {
    return (Store.get("parentsCache:all", null) || []).filter(function(q) {
        return !q.test;
    });
}

function admParCard() {
    var L = admParList();
    if (!L.length) return "";
    var push = L.filter(function(q) {
        return q.push;
    });
    var txt = Store.get("parLinkMsg", null);
    if (txt == null) txt = UI.parLinkMsg || "";
    return '<div class="adm-card vc"><h4><span aria-hidden="true">👨‍👦</span> ' + esc(fill(UI.parH, {
        n: L.length
    })) + '</h4><p class="h">' + esc(UI.parSub) + "</p>" + '<textarea id="par-txt" rows="4" oninput="Store.set(\'parLinkMsg\',this.value)">' + esc(txt) + "</textarea>" + '<p class="h" style="margin:6px 0">' + esc(UI.parName) + "</p>" + '<button class="btn p" style="margin:0"' + (parSend.busy || !push.length ? " disabled" : "") + ' onclick="admParSend()">' + esc(parSend.busy ? UI.parBusy : fill(UI.parGo, {
        n: push.length
    })) + "</button>" + (L.length > push.length ? '<p class="h" style="margin-top:6px">' + esc(fill(UI.parNoPush, {
        n: L.length - push.length
    })) + "</p>" : "") + (parSend.msg ? '<div class="cond" style="margin-top:8px">' + esc(parSend.msg) + "</div>" : "") + '<div style="margin-top:10px">' + L.map(function(q) {
        var nm = ((q.first || "") + " " + (q.last || "")).trim() || "-";
        var wa = !q.push && q.phone ? waNum(q.phone) : "";
        var msg = txt.split("{name}").join(q.first || "") + "\n" + joinUrl("") + "#invite";
        return '<div class="row" style="padding:7px 0;align-items:center;gap:8px"><span style="flex:1;min-width:0"><b>' + esc(nm) + '</b><span class="h" style="display:block;margin:0">' + esc(q.instName || pplName(pplCode(q.inst), null)) + "</span></span>" + (q.push ? '<span title="' + esc(UI.parHasPush) + '">✉</span>' : wa ? '<a class="yr-c" target="_blank" rel="noopener" href="https://wa.me/' + wa + "?text=" + encodeURIComponent(msg) + '">💬</a>' : '<span class="h" style="margin:0">🔕</span>') + "</div>";
    }).join("") + "</div></div>";
}

/* Up to 60 devices per request, so large groups go out in sequential chunks. */
function admParSend() {
    var key = (CFG.readKey || "").trim();
    var el = document.getElementById("par-txt");
    var txt = String(el ? el.value : "").trim();
    if (!key || txt.length < 2 || parSend.busy) return;
    var ids = [];
    admParList().forEach(function(q) {
        if (!q.push) return;
        (q.ids && q.ids.length ? q.ids : [ q.id ]).forEach(function(x) {
            if (ids.indexOf(x) < 0) ids.push(x);
        });
    });
    if (!ids.length) return;
    if (!confirm(fill(UI.parAsk, {
        n: ids.length
    }) + "\n\n" + txt)) return;
    var per = txt.indexOf("{name}") >= 0 ? 1 : 0, chunks = [];
    for (var i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));
    parSend.busy = true;
    parSend.msg = "";
    delete pplLast["st-par"];
    admLive();
    var ok = 0, bad = "";
    var next = function(j) {
        if (j >= chunks.length) {
            parSend.busy = false;
            parSend.msg = bad ? fill(UI.parBad, {
                m: bad
            }) : fill(UI.parOk, {
                n: ok
            });
            delete pplLast["st-par"];
            admLive();
            return;
        }
        scriptGet({
            fire: "say",
            key: key,
            title: PROGRAM.short,
            who: "רכז",
            body: txt,
            url: "join#invite",
            flt: JSON.stringify({
                ids: chunks[j],
                per: per
            })
        }).then(function(d) {
            if (d && d.status === "ok") ok += chunks[j].length; else bad = d && d.message || UI.parNoAns;
            next(j + 1);
        })["catch"](function() {
            bad = UI.parNoAns;
            next(j + 1);
        });
    };
    next(0);
}

function admSetupHelp() {
    var open = stuckRows ? stuckOpen() : [];
    var h = '<div class="adm-card vc st-hp"><h4><span aria-hidden="true">🙋</span> ' + esc(UI.stHelpT) + (open.length ? ' <i class="nd-n on">' + open.length + "</i>" : "") + "</h4>";
    var msg = stuckMsg && stuckMsg !== "nokey" && stuckMsg !== "טוען…" ? stuckMsg : "";
    if (!stuckRows) {
        return h + (msg ? '<div class="cond">' + esc(msg) + "</div>" : '<p class="h">' + esc(UI.stWait) + "</p>") + "</div>";
    }
    var list = stuckAll ? stuckRows : open;
    if (!list.length) h += '<p class="st-ok">✓ ' + esc(UI.stNone) + "</p>";
    h += list.map(function(p) {
        var num = waNum(p.phone);
        return '<div class="st-r' + (p.done ? " ok" : "") + '"><div class="st-w"><b>' + esc(p.name || "-") + "</b>" + "<span>" + esc([ p.inst, p.dev ].filter(Boolean).join(" · ")) + "</span></div>" + (num ? '<a class="btn gr st-b" target="_blank" rel="noopener" href="https://wa.me/' + num + "?text=" + encodeURIComponent(stuckText(p)) + '">' + esc(UI.stWa) + "</a>" : '<span class="h">' + esc(UI.stNoNum) + "</span>") + (p.done ? '<span class="st-d" aria-hidden="true">✓</span>' : '<button class="btn g st-b"' + (stuckBusy === p.row ? " disabled" : "") + ' onclick="stuckDone(' + p.row + ')">' + esc(stuckBusy === p.row ? UI.stBusy : UI.stDone) + "</button>") + "</div>";
    }).join("");
    if (stuckRows.length > open.length) {
        h += '<button class="st-more" onclick="stuckShowAll()">' + esc(stuckAll ? UI.stHideDone : fill(UI.stShowDone, {
            n: stuckRows.length - open.length
        })) + "</button>";
    }
    if (msg) h += '<div class="cond" style="margin-top:10px">' + esc(msg) + "</div>";
    return h + "</div>";
}

function stuckFull(p) {
    var src = Store.get("rosterCache:all", null);
    if (!src) return false;
    var ph = digits(p.phone).slice(-9), nm = nameKey(p.name || "");
    var hit = src.filter(function(s) {
        if (s.test || s.role === "הורה") return false;
        if (ph.length >= 9 && digits(s.phone).slice(-9) === ph) return true;
        return nm && nameKey(((s.first || "") + " " + (s.last || "")).trim()) === nm && (!stuckInst(p) || pplCode(s.inst) === stuckInst(p));
    })[0];
    if (!hit) return false;
    if (hit.way === "אבות ובנים" && !hit.par) return false;
    return !!hit.push && hit.pstate !== "gone";
}

function stuckOpen() {
    return (stuckRows || []).filter(function(p) {
        if (p.done || stuckFull(p)) return false;
        return !ADM_INST || stuckInst(p) === ADM_INST;
    });
}

var STEP_K = [ "open", "app", "s1", "s2", "s3", "join", "s4", "push", "help" ];

function stepName(s) {
    return UI["st_" + s] || s;
}

function permName(s) {
    return {
        granted: UI.permOk,
        denied: UI.permNo,
        dismissed: UI.permX,
        unsupported: UI.permUns,
        default: UI.permNot
    }[s] || UI.permNot;
}

function admWhy() {
    var F = Store.get("funnel", null);
    if (!F || !F.people) return "";
    var P = F.people.filter(function(p) {
        if (ADM_INST && (p[1] || "-") !== ADM_INST) return false;
        var s = " " + p[5] + " ";
        return !(s.indexOf(" join ") >= 0 && s.indexOf(" push ") >= 0);
    });
    var rich = P.filter(function(p) {
        return p.length > 6 && (p[6] || p[8] || p[11] || p[13]);
    });
    if (!rich.length) return stFold("why", "🔍", UI.whyT, '<p class="h">' + esc(UI.whyNone) + "</p>");
    var by = function(f) {
        var m = {};
        rich.forEach(function(p) {
            var k = f(p);
            if (k) m[k] = (m[k] || 0) + 1;
        });
        return m;
    };
    var unk = UI.unknown;
    var last = by(function(p) {
        return stepName(p[13] || "open");
    });
    var br = by(function(p) {
        return p[6] ? p[6] + (p[7] ? " " + p[7] : "") : unk;
    });
    var os = by(function(p) {
        return p[8] || unk;
    });
    var pm = by(function(p) {
        return p[11] ? permName(p[11]) : null;
    });
    var wa = rich.filter(function(p) {
        return p[9] === "1";
    }).length;
    var bp = rich.filter(function(p) {
        return p[10] === "1";
    }).length;
    var ins = by(function(p) {
        return p[12] === "accepted" ? UI.instOk : p[12] === "dismissed" ? UI.instNo : null;
    });
    var secs = rich.map(function(p) {
        return +p[14] || 0;
    }).filter(function(x) {
        return x > 0;
    }).sort(function(a, b) {
        return a - b;
    });
    var med = secs.length ? secs[secs.length >> 1] : null;
    var je = F.jserrs || {};
    var h = vTiles([ {
        n: rich.length,
        t: UI.whyN,
        c: "r"
    }, {
        n: Math.round(wa * 100 / rich.length) + "%",
        t: UI.whyWa
    }, {
        n: Math.round(bp * 100 / rich.length) + "%",
        t: UI.whyBip
    }, {
        n: med == null ? null : med < 60 ? med + "″" : Math.round(med / 60) + "′",
        t: UI.whySec
    } ]);
    h += '<div class="vg"><div><h5>' + esc(UI.whyLast) + "</h5>" + vBars(last, 0, "r") + "</div>" + "<div><h5>" + esc(UI.whyBr) + "</h5>" + vBars(br) + "</div>" + "<div><h5>" + esc(UI.whyOs) + "</h5>" + vBars(os) + "</div>" + "<div><h5>" + esc(UI.whyPerm) + "</h5>" + vBars(pm, 0, "a") + (Object.keys(ins).length ? "<h5>" + esc(UI.whyInst) + "</h5>" + vBars(ins, 0, "a") : "") + "</div></div>";
    if (Object.keys(je).length) h += "<details><summary>" + esc(UI.whyErr) + " (" + Object.keys(je).length + ")</summary>" + vBars(je, 0, "r") + "</details>";
    return stFold("why", "🔍", UI.whyT, h);
}

var trv = {
    t: "today",
    open: "",
    n: 10
}, trMsg = "";

function trLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) return;
    scriptGet({
        trails: 1,
        days: 14,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            trMsg = d && d.message || UI.trFail;
        } else {
            Store.set("trails", {
                rows: d.rows,
                at: Date.now()
            });
            trMsg = "";
        }
        if (admTab === "setup") trShow();
    }).catch(function() {
        trMsg = UI.trFail;
        if (admTab === "setup") trShow();
    });
}

function trSet(k, v) {
    trv[k] = k === "open" && trv.open === v ? "" : v;
    if (k === "t") trv.n = 10;
    pplSet("st-trail", admTrail());
}

var TR_GRP = {
    land: "c-land",
    intro: "c-intro",
    form: "c-form",
    pre: "c-inst",
    w0: "c-land",
    w1: "c-inst",
    w2: "c-form",
    w3: "c-form",
    w4: "c-note",
    w8: "c-form",
    w9: "c-help",
    done: "c-done"
};

var TR_IC = {
    "hero-go": "👆",
    wa: "💬",
    chrome: "🌐",
    "wz-skip": "🆘",
    "wz-hlp-go": "🆘",
    "wz-inst": "📥",
    bip: "📥",
    "inst.accepted": "✅",
    "inst.dismissed": "✖",
    "perm.granted": "🔔",
    "perm.denied": "🔕",
    "perm.dismissed": "🔕",
    "perm.unsupported": "🔕",
    "wz-note": "🔔",
    go: "✍",
    join: "✔",
    err: "⚠",
    jserr: "🐞",
    out: "↗",
    back: "↩",
    tel: "📞"
};

function trName(p, c) {
    return UI[p + String(c).replace(/[.-]/g, "_")] || c;
}

function trDur(s) {
    s = Math.max(0, Math.round(s || 0));
    return s < 60 ? s + "″" : s < 3600 ? Math.floor(s / 60) + "′" + (s % 60 ? s % 60 + "″" : "") : Math.round(s / 360) / 10 + "h";
}

function trRows() {
    var T = Store.get("trails", null);
    if (!T || !T.rows) return null;
    var out = [];
    T.rows.forEach(function(r) {
        var tr;
        try {
            tr = JSON.parse(r[12]);
        } catch (e) {
            return;
        }
        if (!tr || !tr[2] || !tr[2].length) return;
        var ev = tr[2], tot = 0;
        ev.forEach(function(x) {
            tot += +x[2] || 0;
        });
        var clk = [];
        ev.forEach(function(x) {
            clk = clk.concat(x[3] || []);
        });
        out.push({
            id: r[1],
            dev: r[2],
            j: !!r[3],
            inst: r[4],
            role: r[5],
            d: r[6],
            w: r[7],
            b: r[8],
            bv: r[9],
            o: r[10],
            wa: !!r[11],
            t: (+tr[0] || 0) * 1e3 || +r[0],
            ev: ev,
            tot: tot,
            clk: clk,
            join: clk.indexOf("hero-go") >= 0
        });
    });
    out.sort(function(a, b) {
        return b.t - a.t;
    });
    return out;
}

function trDay(t) {
    var d = new Date(t);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function trHm(t) {
    var d = new Date(t), p = function(n) {
        return (n < 10 ? "0" : "") + n;
    };
    return (trDay(t) === trDay(Date.now()) ? "" : d.getDate() + "." + (d.getMonth() + 1) + " ") + p(d.getHours()) + ":" + p(d.getMinutes());
}

function trWhere(x) {
    return (x.w === "app" ? "📲" : x.w === "inapp" || x.wa ? "💬" : "🌐") + " " + "<small>" + esc((x.b || UI.unknown) + (x.bv ? " " + x.bv : "")) + "</small>";
}

function trPath(x) {
    return x.ev.map(function(e, i) {
        var last = i === x.ev.length - 1 && !x.j;
        return '<i class="' + (TR_GRP[e[0]] || "c-land") + (last ? " end" : "") + ((e[3] || []).indexOf("hero-go") >= 0 ? " k" : "") + '" title="' + esc(trName("trs_", e[0])) + '"></i>';
    }).join("");
}

function trOne(x) {
    var max = 1;
    x.ev.forEach(function(e) {
        if (+e[2] > max) max = +e[2];
    });
    var meta = [ trName("trd_", x.d), x.o, trName("trw_", x.w), x.role === "dad" ? UI.trDad : "", x.inst ? pplName(x.inst, null) : "" ].filter(Boolean).join(" · ");
    return '<div class="trd"><div class="trm">' + esc(meta) + "</div>" + x.ev.map(function(e, i) {
        var g = TR_GRP[e[0]] || "c-land", end = i === x.ev.length - 1 && !x.j;
        var cs = (e[3] || []).map(function(c) {
            var q = c === "out" || c === "back" || c === "btn" || c === "link";
            return '<em class="' + (c === "hero-go" ? "k" : q ? "q" : "") + '">' + (TR_IC[c] ? TR_IC[c] + " " : "") + esc(trName("trc_", c)) + "</em>";
        }).join("");
        return (i ? '<div class="tra" aria-hidden="true">↓</div>' : "") + '<div class="trs ' + g + (end ? " end" : "") + '"><div class="trs-h"><b>' + esc(trName("trs_", e[0])) + (end ? " · " + esc(UI.trLast) : "") + "</b><span>" + trDur(e[2]) + "</span></div>" + '<div class="trs-t"><s style="width:' + Math.max(2, e[2] * 100 / max).toFixed(1) + '%"></s></div>' + (cs ? '<div class="trs-c">' + cs + "</div>" : "") + "</div>";
    }).join("") + "</div>";
}
