function pplTags(x) {
    var w = accWait(x.c === "" ? null : x.c).length;
    return '<i class="pt g">' + x.got + " נרשמו</i>" + (x.rep ? '<i class="pt a">' + x.rep + " דווחו</i>" : "") + (x.gap ? '<i class="pt r">פער ' + x.gap + "</i>" : "") + (w ? '<i class="pt w">' + w + " לאימות</i>" : "");
}

function pplRowHtml(x) {
    return '<span class="pr-m"><span class="pr-n">' + esc(x.name) + "</span>" + '<span class="pr-t">' + pplTags(x) + '</span></span><span class="pr-ch" aria-hidden="true">‹</span>';
}

function admPeople(el) {
    if (!(CFG.readKey || "").trim()) {
        el.innerHTML = '<div class="adm-card"><h4>חסרה סיסמת הקריאה</h4>' + '<p class="h">רשימת האנשים יושבת בגיליון הפרטי. הדביקו בהגדרות ← ' + '"סיסמת הקריאה".</p><button class="btn p" onclick="admGo(\'sys\')">להגדרות</button></div>';
        return;
    }
    if (Date.now() - (admAutoAt.ppl || 0) > 12e4) {
        admAutoAt.ppl = Date.now();
        setTimeout(function() {
            pullRegs();
            conflictLoad();
            funLoad();
        }, 0);
    }
    var o = ppl.open;
    el.innerHTML = '<div id="ppl">' + '<div id="ppl-stuck"></div><div id="ppl-conf"></div>' + '<div id="ppl-lv">' + '<div id="ppl-snap"></div><div id="ppl-fun"></div>' + '<div class="adm-card" style="margin-bottom:11px">' + '<div class="ppl-bar">' + '<input id="ppl-q" type="search" placeholder="⌕ חיפוש ישיבה" aria-label="חיפוש ישיבה" value="' + esc(ppl.q) + '">' + '<div class="ppl-r2"><span>ישיבות</span>' + '<select id="ppl-f" aria-label="סינון"><option value="">הכול</option>' + '<option value="gap"' + (ppl.f ? " selected" : "") + ">רק פערים</option></select></div>" + "</div>" + '<div class="ppl-msg" id="ppl-msg"></div>' + '<div id="ppl-list"></div>' + '<p class="h" id="ppl-none" style="display:none;margin:12px 0 4px">אין ישיבה שעונה על החיפוש.</p>' + '<button class="btn g" style="margin-top:10px" onclick="pplRefresh()">רענון מהגיליון</button>' + "</div>" + "</div>" + '<div id="ppl-ov" style="display:none">' + '<div class="adm-card" style="margin-bottom:11px"><div class="ppl-oh"><b id="ppl-on"></b>' + '<button class="ppl-back" onclick="pplBack()">חזרה לישיבות ←</button></div>' + '<div class="ppl-oi" id="ppl-oi"></div><div id="ppl-acc"></div></div>' + "</div>" + '<iframe id="people-f" src="board.html?inst=all&embed=1' + (o ? "&filt=" + encodeURIComponent(o) : "") + '" title="אנשים" scrolling="no" ' + 'style="width:100%;border:0;display:none;height:' + peopleH + 'px"></iframe>' + "</div>";
    pplLast = {
        "adm-needs": admNeeds()
    };
    var q = document.getElementById("ppl-q");
    q.oninput = function() {
        ppl.q = q.value;
        pplPaint();
    };
    document.getElementById("ppl-f").onchange = function() {
        ppl.f = this.value;
        pplPaint();
    };
    document.getElementById("ppl-list").onclick = function(e) {
        var b = e.target.closest && e.target.closest("[data-c]");
        if (b) pplOpen(b.getAttribute("data-c"));
    };
    pplPaint();
}

function pplPaint() {
    var list = document.getElementById("ppl-list");
    if (!list) return admLive();
    var d = pplData(), open = ppl.open !== null;
    var stuck = (stuckRows || []).filter(function(p) {
        return !p.done;
    }).length;
    pplSet("ppl-stuck", stuck ? '<div style="margin-bottom:11px">' + admStuck() + "</div>" : "");
    var conf = (conflictRows || []).filter(function(p) {
        return !p.done;
    }).length;
    pplSet("ppl-conf", conf ? '<div style="margin-bottom:11px">' + admConflicts() + "</div>" : "");
    document.getElementById("ppl-lv").style.display = open ? "none" : "";
    document.getElementById("ppl-ov").style.display = open ? "" : "none";
    document.getElementById("people-f").style.display = open ? "block" : "none";
    var m = [];
    if (ppl.boardMsg) m.push(esc(ppl.boardMsg));
    if (regState.msg && regState.msg !== "nokey") m.push("הרשמות: " + esc(regState.msg));
    if (!m.length && ppl.boardAt) m.push("עודכן " + esc(whenTxt(ppl.boardAt)));
    pplSet("ppl-msg", m.join(" · "));
    var fo = document.querySelector('#ppl-f option[value="gap"]');
    var ft = "רק פערים (" + d.gaps + ")";
    if (fo && fo.textContent !== ft) fo.textContent = ft;
    var q = nameKey(ppl.q), all = {
        c: "",
        name: "כל הישיבות",
        got: d.tot,
        rep: d.repTot || null,
        gap: 0
    };
    var rows = [ all ].concat(d.rows), have = {}, want = [], any = false;
    Array.prototype.forEach.call(list.children, function(b) {
        have[b.getAttribute("data-c")] = b;
    });
    rows.forEach(function(x) {
        var b = have[x.c];
        if (!b) {
            b = document.createElement("button");
            b.className = "pr" + (x.c === "" ? " all" : "");
            b.setAttribute("data-c", x.c);
        }
        delete have[x.c];
        var h = pplRowHtml(x);
        if (b._h !== h) {
            b._h = h;
            b.innerHTML = h;
        }
        var vis = x.c === "" ? !q && !ppl.f && !ppl.mine : (!ppl.f || x.gap) && (!q || nameKey(x.name).indexOf(q) >= 0) && (!ppl.mine || x.c === ppl.mine);
        if (vis && x.c !== "") any = true;
        var dsp = vis ? "" : "none";
        if (b.style.display !== dsp) b.style.display = dsp;
        want.push(b);
    });
    for (var k in have) list.removeChild(have[k]);
    for (var i = 0; i < want.length; i++) {
        if (list.children[i] !== want[i]) list.insertBefore(want[i], list.children[i] || null);
    }
    document.getElementById("ppl-none").style.display = any || !q && !ppl.f && !d.rows.length ? "none" : "";
    pplOrder();
    pplSet("ppl-snap", pplSnap(d));
    pplSet("ppl-fun", pplFun());
    if (open) pplOneHead(d);
}

function pplMineN(c) {
    var src = Store.get("rosterCache:all", null);
    if (!src) return null;
    var par = Store.get("parentsCache:all", null);
    var o = {
        kids: 0,
        con: 0,
        loose: 0,
        parKnown: !!par,
        push: 0,
        known: false,
        why: {},
        inst: {}
    };
    src.forEach(function(p) {
        if (p.test || p.role === "הורה") return;
        var pc = pplCode(p.inst);
        if (c && pc !== c) return;
        o.inst[pc] = 1;
        if (p.push != null) o.known = true;
        if (!p.push) {
            var k = p.why || (p.pstate === "blocked" ? "חסום" : "לא דיווח");
            o.why[k] = (o.why[k] || 0) + 1;
        }
    });
    var inC = function(p) {
        return !c || pplCode(p.inst) === c;
    };
    var n = PplCount(src, par || [], inC, inC);
    o.kids = n.kids;
    o.push = n.push;
    o.con = n.con;
    o.loose = n.loose;
    return o;
}

function pplMinePick(c) {
    ppl.mine = c;
    pplPaint();
}

function pplSnap(d) {
    var c = ppl.mine, n = pplMineN(c);
    var all = pplMineN("") || {
        inst: {}
    };
    var cnt = {};
    d.rows.forEach(function(x) {
        cnt[x.c] = x.got;
    });
    var insts = INSTITUTIONS.slice().sort(function(a, b) {
        return String(a.name).localeCompare(String(b.name), "he");
    });
    var opt = function(v, t) {
        return '<option value="' + esc(v) + '"' + (v === c ? " selected" : "") + ">" + esc(t) + (v && cnt[v] ? " (" + cnt[v] + ")" : "") + "</option>";
    };
    var sel = '<select class="mine-pick" aria-label="' + esc(UI.mineAll) + '" ' + 'onchange="pplMinePick(this.value)">' + opt("", UI.mineAll) + insts.map(function(i) {
        return opt(i.code, i.name);
    }).join("") + (all.inst["-"] || c === "-" ? opt("-", UI.mineNoInst) : "") + "</select>";
    var st;
    if (ppl.boardMsg) st = UI.mineFail.replace("{m}", ppl.boardMsg) + (n ? " · " + UI.mineOld : ""); else if (ppl.boardAt) st = UI.mineAt.replace("{t}", whenTxt(ppl.boardAt)); else st = UI.mineLoad + (n ? " · " + UI.mineOld : "");
    var parN = n ? n.con + (n.parKnown ? n.loose : 0) : null;
    var tile = function(v, t, sub) {
        return "<div><b>" + (v === null ? "-" : v) + "</b><span>" + esc(t) + "</span>" + (sub ? "<i>" + esc(sub) + "</i>" : "") + "</div>";
    };
    var instN = n ? Object.keys(n.inst).filter(function(k) {
        return k !== "-";
    }).length : 0;
    var row = function(t, v, sub) {
        return '<div class="row" style="padding:7px 0"><span>' + t + (sub ? '<div class="sub">' + sub + "</div>" : "") + '</span><b style="white-space:nowrap">' + v + "</b></div>";
    };
    var ords = pplOrderList().filter(function(r) {
        return !c || r.code === c;
    });
    var ordN = ords.filter(function(r) {
        return r.total;
    }).length;
    var ordT = ords.reduce(function(a, r) {
        return a + (r.total || 0);
    }, 0);
    return '<div class="adm-card" style="margin-bottom:11px">' + '<div class="mine-h"><h4>' + esc(UI.mineTab) + "</h4>" + sel + "</div>" + '<div class="mine-n">' + tile(n ? n.kids : null, UI.mineKids, n && !c ? UI.mineFrom.replace("{n}", instN) : "") + tile(parN, UI.minePars, n && n.parKnown ? UI.mineParSub.replace("{c}", n.con).replace("{l}", n.loose) : "") + "</div>" + '<div class="mine-st">' + esc(n || ppl.boardMsg || ppl.boardAt ? st : UI.mineNone) + "</div>" + (n && n.known ? row("עם התראות", n.push + " מתוך " + n.kids, Object.keys(n.why).sort(function(a, b) {
        return n.why[b] - n.why[a];
    }).map(function(k) {
        return esc(k) + " " + n.why[k];
    }).join(" · ")) : "") + row("הזמנת גמרות", ordN + " ישיבות · " + ordT + " גמרות", '<a href="#" onclick="admSubGo(\'orders\');return false">לפירוט ←</a>') + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + (c ? '<button class="btn p" style="flex:1 1 12rem" onclick="pplOpen(\'' + esc(c) + "')\">" + esc(UI.mineOpen) + "</button>" : '<button class="btn p" style="flex:1 1 12rem" onclick="pplOpen(\'\')">כל התלמידים · שליחה אישית ←</button>') + '<button class="btn g" style="flex:1 1 12rem" onclick="admSubGo(\'push\')">שליחת התראה ←</button>' + "</div>" + '<p class="mine-note">' + esc(UI.mineTest) + "</p></div>";
}

var fun = {
    t: ""
}, funMsg = "";

function funLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) return;
    funMsg = "טוען…";
    pplPaint();
    scriptGet({
        funnel: 1,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.people) {
            funMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
        } else {
            Store.set("funnel", {
                people: d.people,
                errs: d.errs || {},
                jserrs: d.jserrs || {},
                at: Date.now()
            });
            funMsg = "";
        }
        pplPaint();
    }).catch(function() {
        funMsg = "לא קיבלתי תשובה מהסקריפט.";
        pplPaint();
    });
}

function funSet(k, v) {
    fun[k] = v;
    pplPaint();
}

function funDay(n) {
    var t = new Date(Date.now() - n * 864e5 + 3 * 36e5);
    return t.toISOString().slice(0, 10);
}

function funPeople(F, t) {
    var t0 = t === "today" ? funDay(0) : "";
    return F.people.filter(function(p) {
        if (ADM_INST && (p[1] || "-") !== ADM_INST) return false;
        return !t0 || p[0] >= t0;
    });
}

function funHas(p, s) {
    return (" " + p[5] + " ").indexOf(" " + s + " ") >= 0;
}

function funAny(p, l) {
    for (var i = 0; i < l.length; i++) if (funHas(p, l[i])) return true;
    return false;
}

var FUN_FORM = [ "app", "s2", "s3", "join" ];

function funForm(p) {
    return funAny(p, FUN_FORM) || funHas(p, "type") && !funHas(p, "help");
}

function funCount(P) {
    var cnt = function(f) {
        return P.filter(f).length;
    };
    return {
        open: cnt(function(p) {
            return funAny(p, [ "open", "s1" ]);
        }),
        s1: cnt(function(p) {
            return funHas(p, "s1");
        }),
        s2: cnt(funForm),
        join: cnt(function(p) {
            return funHas(p, "join");
        }),
        push: cnt(function(p) {
            return funHas(p, "push") && funHas(p, "join");
        })
    };
}

function pplFun() {
    var F = Store.get("funnel", null);
    var h = '<div class="adm-card vc"><h4><span aria-hidden="true">⏬</span> ' + esc(UI.funT) + "</h4>";
    if (!F || !F.people) return h + '<p class="h">' + esc(funMsg || UI.funNone) + "</p></div>";
    var all = funPeople(F, fun.t);
    var brw = all.filter(function(p) {
        return p[17] !== "1";
    });
    var n = funCount(brw), top = n.open;
    var st = [ [ UI.funOpen, n.open ], [ UI.funGo, n.s1 ], [ UI.funForm, n.s2 ], [ UI.funJoin, n.join ], [ UI.funPush, n.push ] ];
    h += '<div class="trf">' + '<button class="' + (fun.t === "today" ? "on" : "") + "\" onclick=\"funSet('t','today')\">" + esc(UI.trToday) + "</button>" + '<button class="' + (fun.t !== "today" ? "on" : "") + "\" onclick=\"funSet('t','')\">" + esc(UI.funAll) + "</button></div>";
    h += '<div class="fn">' + st.map(function(s, i) {
        var w = top ? Math.min(100, s[1] * 100 / top) : s[1] ? 100 : 0;
        return '<div class="fn-r"><div class="fn-l">' + esc(s[0]) + (i && top ? " <i>" + Math.min(100, Math.round(s[1] * 100 / top)) + "%</i>" : "") + "</div>" + '<div class="fn-b" style="width:' + Math.max(16, w).toFixed(1) + '%"><b>' + s[1] + "</b></div></div>";
    }).join("") + "</div>";
    if (all.length > brw.length) h += '<p class="h" style="margin-top:8px">' + esc(fill(UI.funSa, {
        n: all.length - brw.length
    })) + "</p>";
    if (funMsg) h += '<p class="h" style="margin-top:8px">' + esc(funMsg) + "</p>";
    return h + "</div>";
}

function funRow(t, v) {
    return '<div class="row" style="padding:7px 0"><span>' + t + '</span><b style="white-space:nowrap">' + v + "</b></div>";
}

function funErrs() {
    var F = Store.get("funnel", null);
    var errs = F && F.errs || {}, ek = Object.keys(errs).sort(function(a, b) {
        return errs[b] - errs[a];
    });
    return stFold("err", "⚠", UI.resErr, ek.length ? ek.slice(0, 10).map(function(k) {
        return funRow(esc(k), errs[k]);
    }).join("") : '<p class="h">' + esc(UI.whyNone) + "</p>");
}

function funPer(key) {
    var F = Store.get("funnel", null), per = {};
    if (!F || !F.people) return per;
    funPeople(F, "").forEach(function(p) {
        var c = key(p);
        var x = per[c] || (per[c] = {
            o: 0,
            j: 0
        });
        if (funAny(p, [ "open", "s1", "type" ].concat(FUN_FORM))) x.o++;
        if (funHas(p, "join")) x.j++;
    });
    return per;
}
