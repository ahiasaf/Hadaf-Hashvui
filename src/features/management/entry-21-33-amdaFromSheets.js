function amdaFromSheets(sheets) {
    var r = {
        at: Date.now(),
        g: {}
    }, i, j;
    for (i = 0; i < sheets.length; i++) {
        for (j = 0; j < sheets[i].rows.length; j++) {
            var v = sheets[i].rows[j];
            var g = String(v.C || "").replace(/["'׳״\s]/g, "");
            var p = String(v.D || "").match(/^\d+/);
            var n = (String(v.A || "") + " " + String(v.B || "")).replace(/\s+/g, " ").trim();
            if (!p || !n || AMDA_GRADES.indexOf(g) < 0) continue;
            p = String(+p[0]);
            if (!r.g[g]) r.g[g] = {};
            if (!r.g[g][p]) r.g[g][p] = [];
            r.g[g][p].push(n);
        }
    }
    return r;
}

function amdaRows(r) {
    var rows = [], i, j, g, cs, inst = r.inst || "";
    for (i = 0; i < AMDA_GRADES.length; i++) {
        g = AMDA_GRADES[i];
        if (!r.g[g]) continue;
        cs = Object.keys(r.g[g]).sort(function(a, b) {
            return a - b;
        });
        for (j = 0; j < cs.length; j++) {
            r.g[g][cs[j]].forEach(function(n) {
                rows.push([ g, cs[j], n, inst ]);
            });
        }
    }
    return rows;
}

function amdaPushRoster(r) {
    var key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    var n = amdaCount(r).n;
    if (!key || !url) {
        amdaMsg = amdaT("admNoSave", {
            n: n
        });
        admPane();
        return;
    }
    fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: AMDA_ROSTER,
            key: key,
            cols: JSON.stringify([ "שכבה", "כיתה", "שם", "קוד ישיבה" ]),
            rows: JSON.stringify(amdaRows(r))
        })
    }).catch(function() {}).then(function() {
        return new Promise(function(ok) {
            setTimeout(ok, 2500);
        });
    }).then(function() {
        return amdaReadRoster();
    }).then(function(got) {
        var ok = got && amdaCount(got).n === n && (got.inst || "") === (r.inst || "");
        amdaMsg = amdaT(ok ? "admSaved" : "admNoSave", {
            n: n
        });
        admPane();
    });
}

function amdaReadRoster() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(null);
    return scriptGet({
        read: AMDA_ROSTER,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows || d.rows.length < 2) return null;
        var h = d.rows[0], ig = h.indexOf("שכבה"), ic = h.indexOf("כיתה"), inn = h.indexOf("שם"), ii = h.indexOf("קוד ישיבה");
        if (ig < 0 || ic < 0 || inn < 0) return null;
        var r = {
            at: Date.now(),
            inst: "",
            g: {}
        };
        d.rows.slice(1).forEach(function(x) {
            var g = String(x[ig] || ""), c = String(x[ic] || ""), n = String(x[inn] || "");
            if (!g || !c || !n) return;
            if (ii >= 0 && !r.inst) r.inst = String(x[ii] || "");
            if (!r.g[g]) r.g[g] = {};
            if (!r.g[g][c]) r.g[g][c] = [];
            r.g[g][c].push(n);
        });
        return amdaCount(r).n ? r : null;
    }).catch(function() {
        return null;
    });
}

function amdaPullRoster() {
    amdaReadRoster().then(function(r) {
        if (r) {
            Store.set("amdaRoster", r);
            amdaMsg = amdaT("admHave", amdaCount(r));
        } else amdaMsg = amdaT("admNoPull");
        admPane();
    });
}

function amdaFlush() {
    var key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    var q = amdaQ(), now = Date.now(), sent = 0;
    if (!key || !url) return;
    sent += amdaFlushMarks(key, url);
    q.forEach(function(m) {
        if (m.sent && now - m.sent < 45e3) return;
        m.sent = now;
        sent++;
        var daf = m.kind !== "o" && m.track;
        fetch(url, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "row",
                tab: AMDA_TAB,
                key: key,
                cols: JSON.stringify([ [ "מזהה", m.id ], [ "שבוע", m.w ], [ "יום", m.day || "" ], [ "עמדה", m.slot ? amdaSlotName(m.slot) : "" ], [ "קוד עמדה", m.slot || "" ], [ "סוג", m.kind === "o" ? "שיעור" : "דף" ], [ "מסלול", daf ? m.track : "" ], [ "דף", daf ? m.daf || "" : "" ], [ "קוד ישיבה", m.inst || "" ], [ "מקום", m.seat || "" ], [ "רמה", daf ? m.lv || "" : "" ], [ "שכבה", m.g ], [ "כיתה", m.c ], [ "שם", m.n ], [ "מתי", m.at ] ])
            })
        }).catch(function() {});
    });
    Store.set("amdaQ", q);
    if (sent) {
        clearTimeout(amdaSt.pullT);
        amdaSt.pullT = setTimeout(amdaPull, 6e3);
    }
}

function amdaPull() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(false);
    return scriptGet({
        read: AMDA_TAB,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return false;
        var h = d.rows[0] || [], seen = {}, had = {}, cnt = {}, once = {}, today = amdaDay(), seatEv = [], lesAtt = {};
        var col = function(x, n) {
            var i = h.indexOf(n);
            return i < 0 ? "" : String(x[i] || "");
        };
        d.rows.slice(1).forEach(function(x) {
            var id = col(x, "מזהה"), g = col(x, "שכבה"), c = col(x, "כיתה"), n = col(x, "שם");
            if (id) seen[id] = 1;
            if (!g || !c || !n) return;
            var m = {
                day: col(x, "יום"),
                slot: col(x, "קוד עמדה"),
                w: col(x, "שבוע"),
                kind: col(x, "סוג") === "שיעור" ? "o" : "d"
            };
            var sess = amdaSessOf(m), sk = amdaKey(g, c, n);
            if (col(x, "מקום")) seatEv.push({
                at: col(x, "מתי"),
                slot: m.slot,
                sk: sk,
                seat: col(x, "מקום")
            });
            if (once[sess + "#" + sk]) return;
            if (m.slot.charAt(0) === "L") lesAtt[sk] = (lesAtt[sk] || 0) + 1;
            once[sess + "#" + sk] = 1;
            (cnt[sk] = cnt[sk] || amdaC4())[amdaBucket(m.slot, m.kind)]++;
            if (m.day === today) (had[sess] = had[sess] || {})[sk] = 1;
        });
        Store.set("amdaHad2", had);
        Store.set("amdaCnt", cnt);
        Store.set("amdaLesAtt", lesAtt);
        Store.set("amdaQ", amdaQ().filter(function(m) {
            return !seen[m.id];
        }));
        return amdaPullMarks(key, seatEv);
    }).catch(function() {
        return false;
    }).then(function(ok) {
        if (document.getElementById("amda-adm")) admPane();
        return ok;
    });
}

function amdaOpen(kind) {
    var r = amdaRoster();
    if (!r || !amdaCount(r).n) {
        alert(amdaT("admNone"));
        return;
    }
    if (kind) Store.set("amdaSess", {
        slot: amdaSlotSel(),
        kind: kind,
        track: amdaTrack(),
        lv: amdaLv()
    });
    var el = document.getElementById("amda");
    if (!el) {
        el = document.createElement("div");
        el.id = "amda";
        el.className = "amda";
        el.innerHTML = '<div class="am-in" id="am-in"></div>' + '<div class="am-ok" id="am-ok"><div class="am-tick">✓</div><b id="am-okn"></b>' + '<span id="am-okt"></span></div>';
        document.body.appendChild(el);
        el.addEventListener("click", amdaTap);
    }
    amdaSt.g = "";
    amdaSt.c = "";
    amdaSt.pick = "";
    el.className = "amda on";
    Store.set("amdaOn", 1);
    try {
        var de = document.documentElement;
        if (de.requestFullscreen) de.requestFullscreen().catch(function() {});
    } catch (e) {}
    amdaPaint();
    amdaFlush();
    amdaPull().then(function() {
        amdaPaint();
    });
    clearInterval(amdaSt.flushT);
    amdaSt.flushT = setInterval(function() {
        amdaFlush();
        if (!amdaSt.g) amdaPull().then(function() {
            if (!amdaSt.g) amdaPaint();
        });
    }, 6e4);
}

function amdaExitAsk() {
    var s = amdaSess(), box = document.getElementById("amda");
    if (!box || document.getElementById("am-ex")) return;
    var les = amdaLesson(s.slot), d = document.createElement("div");
    d.className = "am-ex";
    d.id = "am-ex";
    var was = s.kind === "o" ? "o" : "d", now = was;
    d.innerHTML = '<div class="am-ex-in"><b>' + esc(amdaT("exitQ")) + "</b>" + '<div class="wantbar" data-ek="t"><div><b>' + esc(amdaT("exitD")) + "</b><span>" + esc(amdaT("exitSwSub")) + '</span></div><button class="sw' + (now === "d" ? " on" : "") + '" data-ek="t" aria-label="' + esc(amdaT("exitD")) + '"></button></div>' + '<button class="on" data-ek="x">' + esc(amdaT("exitGo")) + "</button>" + '<button class="bk" data-ek="-">' + esc(amdaT("exitStay")) + "</button></div>";
    box.appendChild(d);
    d.onclick = function(e) {
        var b = e.target.closest && e.target.closest("[data-ek]");
        if (!b) return;
        var k = b.getAttribute("data-ek");
        if (k === "t") {
            now = now === "d" ? "o" : "d";
            var sw = d.querySelector(".sw");
            if (sw) sw.className = "sw" + (now === "d" ? " on" : "");
            return;
        }
        d.parentNode.removeChild(d);
        if (k === "-") return;
        if (now !== was) amdaKindSet(now);
        amdaClose(true);
    };
}

function amdaKindSet(k) {
    var s = amdaSess(), day = amdaDay(), key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    s.kind = k;
    Store.set("amdaSess", s);
    var q = amdaQ();
    q.forEach(function(m) {
        if (m.day === day && m.slot === s.slot) {
            m.kind = k;
            m.lv = s.lv || amdaLv();
        }
    });
    Store.set("amdaQ", q);
    amdaFlush();
    if (!key || !url) return;
    var track = s.track || amdaTrack(), wk = Math.max(0, LWeek());
    var body = {
        action: "amdakind",
        key: key,
        day: day,
        slot: s.slot,
        kind: k,
        track: track,
        daf: LDafName(track, wk) || "",
        lvl: k === "d" ? s.lv || amdaLv() : ""
    };
    var tries = 0;
    var send = function() {
        fetch(url, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(body)
        }).catch(function() {});
        setTimeout(function() {
            scriptGet({
                read: AMDA_TAB,
                key: key
            }).then(function(d) {
                if (!d || d.status !== "ok" || !d.rows) throw 0;
                var h = d.rows[0] || [], iD = h.indexOf("יום"), iS = h.indexOf("קוד עמדה"), iK = h.indexOf("סוג");
                var bad = d.rows.slice(1).some(function(x) {
                    return x[iD] === day && x[iS] === s.slot && x[iK] !== (k === "o" ? "שיעור" : "דף");
                });
                if (bad) throw 0;
                amdaMsg = amdaT("kindOk", {
                    k: amdaT(k === "o" ? "exitO" : "exitD")
                });
                amdaPull();
            })["catch"](function() {
                if (++tries < 2) return send();
                amdaMsg = amdaT("kindFail");
                if (document.getElementById("amda-adm")) admPane();
            });
        }, 7e3);
    };
    setTimeout(send, 2500);
}

function amdaClose(sure) {
    if (sure !== true) {
        amdaExitAsk();
        return;
    }
    var el = document.getElementById("amda");
    if (el) el.className = "amda";
    Store.set("amdaOn", 0);
    clearInterval(amdaSt.flushT);
    clearTimeout(amdaSt.idle);
    try {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}
    admPane();
}

function amdaPaint() {
    var box = document.getElementById("am-in");
    if (!box) return;
    var s = amdaSess(), daf = s.kind !== "o", les = amdaLesson(s.slot);
    if (les) {
        amdaSt.g = les.g;
        amdaSt.c = les.c;
    }
    var h = '<div class="am-top"><span class="am-logo"><img alt="" src="' + LOGO_MARK + '"></span>' + '<div class="am-brand"><b>' + esc(amdaT("brand1")) + "</b><span>" + esc(amdaT("brand2")) + " · " + esc(PROGRAM.year) + "</span></div>" + (les ? "" : '<button class="am-kd' + (daf ? "" : " o") + '" data-k="1">' + esc(amdaT(daf ? "chipD" : "chipO")) + "</button>") + '<button class="am-x" data-x="1">' + esc(amdaT("exit")) + "</button></div>" + '<div class="am-h">' + esc(amdaT(daf ? "title" : "titleO")) + "</div>" + '<div class="am-sub">' + esc(amdaT(daf ? "chipD" : "chipO")) + (daf && LDafName(s.track || amdaTrack(), Math.max(0, LWeek())) ? " · " + esc(fill(amdaT("dafName"), {
        d: LDafName(s.track || amdaTrack(), Math.max(0, LWeek()))
    })) : "") + " · " + esc(amdaSlotName(s.slot)) + (daf ? " · " + esc(amdaT("week", {
        w: amdaWeek()
    })) : "") + "</div>";
    if (les && amdaSt.pick) {
        var sess = amdaDay() + "|" + s.slot, me = amdaKey(les.g, les.c, amdaSt.pick);
        h += '<div class="am-q">' + esc(amdaSt.pick) + " - " + esc(amdaT("pickSeat")) + "</div>" + amdaMapHtml(les, amdaOcc(les, sess), {
            mine: amdaSeats(les.id)[me] || "",
            me: me
        }) + '<button class="am-x am-skip" data-s="-">' + esc(amdaT("seatSkip")) + "</button>";
        box.innerHTML = h;
        return;
    }
    if (!les) {
        h += '<div class="am-q">' + esc(amdaT("pickG")) + '</div><div class="am-grid">';
        AMDA_GRADES.forEach(function(g) {
            h += '<button class="am-b' + (amdaSt.g === g ? " on" : "") + '" data-g="' + g + '">' + esc(amdaG(g)) + "</button>";
        });
        h += "</div>";
        if (amdaSt.g) {
            h += '<div class="am-q">' + esc(amdaT("pickC")) + '</div><div class="am-grid">';
            amdaClasses(amdaSt.g).forEach(function(c) {
                h += '<button class="am-b' + (amdaSt.c === c ? " on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + "</button>";
            });
            h += "</div>";
        }
    }
    if (amdaSt.g && amdaSt.c) {
        var had = amdaHadNow(amdaDay() + "|" + s.slot), list = amdaList(amdaSt.g, amdaSt.c);
        h += '<div class="am-q" id="am-nq">' + esc(amdaT("pickN")) + '</div><div class="am-names">';
        list.forEach(function(n, i) {
            var was = had[amdaKey(amdaSt.g, amdaSt.c, n)];
            h += '<button class="am-nm' + (was ? " had" : "") + '" data-n="' + i + '"><span>' + esc(n) + "</span>" + (was ? "<i>✓ " + esc(amdaT("had")) + "</i>" : "") + "</button>";
        });
        h += "</div>";
    }
    box.innerHTML = h;
}

function amdaList(g, c) {
    return ((amdaRoster() || {}).g || {})[g] ? amdaRoster().g[g][c] || [] : [];
}

function amdaIdle() {
    clearTimeout(amdaSt.idle);
    amdaSt.idle = setTimeout(function() {
        if (!amdaSt.g && !amdaSt.pick) return;
        amdaSt.g = "";
        amdaSt.c = "";
        amdaSt.pick = "";
        amdaPaint();
        document.getElementById("amda").scrollTop = 0;
    }, 3e4);
}

function amdaTap(e) {
    var el = e.target;
    while (el && el.id !== "amda" && !(el.getAttribute && (el.getAttribute("data-g") || el.getAttribute("data-c") || el.getAttribute("data-s") || el.getAttribute("data-n") || el.getAttribute("data-x") || el.getAttribute("data-k")))) el = el.parentNode;
    if (!el || el.id === "amda") return;
    if (document.getElementById("am-ok").className === "am-ok on") return;
    if (el.getAttribute("data-x")) {
        amdaClose();
        return;
    }
    if (el.getAttribute("data-k")) {
        amdaKindSet(amdaSess().kind === "o" ? "d" : "o");
        amdaPaint();
        return;
    }
    var box = document.getElementById("amda");
    if (el.getAttribute("data-g")) {
        amdaSt.g = el.getAttribute("data-g");
        amdaSt.c = "";
        amdaPaint();
        amdaIdle();
        return;
    }
    if (el.getAttribute("data-c")) {
        amdaSt.c = el.getAttribute("data-c");
        amdaPaint();
        amdaIdle();
        var q = document.getElementById("am-nq");
        if (q) box.scrollTop = Math.max(0, q.offsetTop - 12);
        return;
    }
    if (el.getAttribute("data-s")) {
        if (el.disabled || !amdaSt.pick) return;
        var seat = el.getAttribute("data-s"), who = amdaSt.pick;
        amdaSt.pick = "";
        if (seat === "-") {
            amdaReset();
            return;
        }
        amdaMarkAdd(amdaSess().slot, amdaSt.g, amdaSt.c, who, "seat", 0, seat);
        amdaOk(who, amdaT("seatDone"), amdaReset);
        return;
    }
    var n = amdaList(amdaSt.g, amdaSt.c)[+el.getAttribute("data-n")];
    if (!n) return;
    amdaMark(amdaSt.g, amdaSt.c, n);
}
