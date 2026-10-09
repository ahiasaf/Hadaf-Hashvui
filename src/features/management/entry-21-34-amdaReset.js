function amdaReset() {
    amdaSt.g = "";
    amdaSt.c = "";
    amdaSt.pick = "";
    amdaPaint();
    document.getElementById("amda").scrollTop = 0;
}

function amdaOk(n, txt, after) {
    clearTimeout(amdaSt.idle);
    document.getElementById("am-okn").textContent = n;
    document.getElementById("am-okt").textContent = txt;
    document.getElementById("am-ok").className = "am-ok on";
    setTimeout(function() {
        document.getElementById("am-ok").className = "am-ok";
        after();
    }, 1300);
}

function amdaMark(g, c, n) {
    var s = amdaSess(), day = amdaDay(), key = amdaKey(g, c, n), les = amdaLesson(s.slot);
    if (!amdaHadNow(day + "|" + s.slot)[key]) {
        var q = amdaQ(), track = s.track || amdaTrack(), wk = Math.max(0, LWeek());
        q.push({
            id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            w: wk + 1,
            day: day,
            slot: s.slot,
            kind: s.kind === "o" ? "o" : "d",
            track: track,
            daf: LDafName(track, wk) || "",
            inst: amdaInst(),
            seat: "",
            lv: s.lv || amdaLv(),
            g: g,
            c: c,
            n: n,
            at: (new Date).toISOString()
        });
        Store.set("amdaQ", q);
        amdaFlush();
    }
    amdaOk(n, amdaT(s.kind === "o" ? "doneO" : "done"), function() {
        if (les && amdaSeatAsk(les.id)) {
            amdaSt.pick = n;
            amdaPaint();
            amdaIdle();
            document.getElementById("amda").scrollTop = 0;
        } else amdaReset();
    });
}

var AMDA_MARKS = "עמדה - סימונים";

var AMDA_LESSONS = "עמדה - שיעורים";

var AMDA_MK = {
    p: "השתתפות יפה",
    d: "ביטול תורה",
    seat: "מקום"
};

var AMDA_LES_DEF = [ {
    id: "ט5-0",
    g: "ט",
    c: "5",
    day: 0,
    cols: "3,3,3,4,4"
} ];

function amdaSeatAsk(lid) {
    return !!(Store.get("amdaSeatAsk", {}) || {})[lid];
}

function amdaSeatAskSet(lid, on) {
    var m = Store.get("amdaSeatAsk", {}) || {};
    m[lid] = on ? 1 : 0;
    Store.set("amdaSeatAsk", m);
    admPane();
}

function amdaLessons() {
    var l = Store.get("amdaLessons", null);
    return l || AMDA_LES_DEF;
}

function amdaLesson(slot) {
    if (!slot || slot.charAt(0) !== "L") return null;
    var id = slot.slice(1);
    return amdaLessons().filter(function(l) {
        return l.id === id;
    })[0] || null;
}

function amdaLessonName(l) {
    var days = amdaT("days").split(",");
    return amdaT("lessonName", {
        cls: amdaG(l.g) + l.c,
        day: (days[l.day] || "").trim()
    });
}

function amdaCols(l) {
    return String(l.cols || "").split(",").map(function(x) {
        return parseInt(x, 10) || 0;
    }).filter(function(x) {
        return x > 0;
    });
}

function amdaMq() {
    return Store.get("amdaMq", []) || [];
}

function amdaMarkAdd(slot, g, c, n, mark, delta, seat) {
    var q = amdaMq();
    q.push({
        id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        day: amdaDay(),
        slot: slot,
        g: g,
        c: c,
        n: n,
        mark: mark,
        delta: delta || 0,
        seat: seat || "",
        at: (new Date).toISOString()
    });
    Store.set("amdaMq", q);
    amdaFlush();
}

function amdaFlushMarks(key, url) {
    var q = amdaMq(), now = Date.now(), sent = 0;
    q.forEach(function(m) {
        if (m.sent && now - m.sent < 45e3) return;
        m.sent = now;
        sent++;
        fetch(url, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "row",
                tab: AMDA_MARKS,
                key: key,
                cols: JSON.stringify([ [ "מזהה", m.id ], [ "יום", m.day ], [ "עמדה", amdaSlotName(m.slot) ], [ "קוד עמדה", m.slot ], [ "שכבה", m.g ], [ "כיתה", m.c ], [ "שם", m.n ], [ "סימון", AMDA_MK[m.mark] || "" ], [ "שינוי", m.delta ], [ "מקום", m.seat ], [ "מתי", m.at ] ])
            })
        }).catch(function() {});
    });
    Store.set("amdaMq", q);
    return sent;
}

function amdaPullMarks(key, seatEv) {
    return scriptGet({
        read: AMDA_MARKS,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return false;
        var h = d.rows[0] || [], seen = {}, tot = {}, day = {}, today = amdaDay();
        var col = function(x, n) {
            var i = h.indexOf(n);
            return i < 0 ? "" : String(x[i] || "");
        };
        d.rows.slice(1).forEach(function(x) {
            var id = col(x, "מזהה"), sk = amdaKey(col(x, "שכבה"), col(x, "כיתה"), col(x, "שם"));
            if (id) seen[id] = 1;
            var mk = col(x, "סימון"), slot = col(x, "קוד עמדה");
            if (mk === AMDA_MK.seat) {
                seatEv.push({
                    at: col(x, "מתי"),
                    slot: slot,
                    sk: sk,
                    seat: col(x, "מקום")
                });
                return;
            }
            var b = mk === AMDA_MK.p ? 0 : mk === AMDA_MK.d ? 1 : -1, dl = parseInt(col(x, "שינוי"), 10) || 0;
            if (b < 0 || !dl) return;
            (tot[sk] = tot[sk] || [ 0, 0 ])[b] += dl;
            if (col(x, "יום") === today) {
                var ss = today + "|" + slot;
                ((day[ss] = day[ss] || {})[sk] = day[ss][sk] || [ 0, 0 ])[b] += dl;
            }
        });
        Store.set("amdaMk", tot);
        Store.set("amdaMkDay", day);
        Store.set("amdaMq", amdaMq().filter(function(m) {
            return !seen[m.id];
        }));
        return true;
    }).catch(function() {
        return false;
    }).then(function(ok) {
        if (!ok) return false;
        var seats = {};
        seatEv.sort(function(a, b) {
            return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
        });
        seatEv.forEach(function(e) {
            if (!e.slot || e.slot.charAt(0) !== "L") return;
            var lid = e.slot.slice(1);
            seats[lid] = seats[lid] || {};
            if (e.seat) {
                for (var k in seats[lid]) {
                    if (seats[lid][k] === e.seat) delete seats[lid][k];
                }
                seats[lid][e.sk] = e.seat;
            }
        });
        Store.set("amdaSeat", seats);
        return true;
    });
}

function amdaSeats(lid) {
    var all = (Store.get("amdaSeat", {}) || {})[lid] || {}, out = {}, k, ev = [];
    for (k in all) {
        if (all.hasOwnProperty(k)) out[k] = all[k];
    }
    amdaQ().forEach(function(m) {
        if (m.seat && m.slot === "L" + lid) ev.push(m);
    });
    amdaMq().forEach(function(m) {
        if (m.mark === "seat" && m.seat && m.slot === "L" + lid) ev.push(m);
    });
    ev.sort(function(a, b) {
        return a.at < b.at ? -1 : 1;
    });
    ev.forEach(function(m) {
        for (var x in out) {
            if (out[x] === m.seat) delete out[x];
        }
        out[amdaKey(m.g, m.c, m.n)] = m.seat;
    });
    return out;
}

function amdaOcc(les, sess) {
    var had = amdaHadNow(sess), seats = amdaSeats(les.id), occ = {}, k;
    for (k in seats) {
        if (seats.hasOwnProperty(k) && had[k]) occ[seats[k]] = k;
    }
    return occ;
}

function amdaMkOf(sk, sess) {
    var base = sess ? ((Store.get("amdaMkDay", {}) || {})[sess] || {})[sk] : (Store.get("amdaMk", {}) || {})[sk];
    var out = base ? base.slice() : [ 0, 0 ];
    amdaMq().forEach(function(m) {
        if (amdaKey(m.g, m.c, m.n) !== sk || m.mark === "seat") return;
        if (sess && m.day + "|" + m.slot !== sess) return;
        out[m.mark === "p" ? 0 : 1] += m.delta;
    });
    return out;
}

var AMDA_CHAIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="9" rx="3"/>' + '<rect x="3" y="12" width="18" height="5" rx="2"/><rect x="5" y="17" width="2.4" height="5" rx="1"/>' + '<rect x="16.6" y="17" width="2.4" height="5" rx="1"/></svg>';

function amdaFirst(sk) {
    var p = amdaNm(sk).split(" ");
    return p[p.length - 1];
}

function amdaMapHtml(les, occ, o) {
    var cols = amdaCols(les), h = '<div class="am-room"><div class="am-cols">';
    cols.forEach(function(n, i) {
        h += '<div class="am-col">';
        for (var r = 1; r <= n; r++) {
            h += '<div class="am-desk"><div class="am-pair">';
            for (var sd = 1; sd <= 2; sd++) {
                var id = i + 1 + "-" + r + "-" + sd, who = occ[id], cls = "am-seat";
                var lbl = "", dis = false;
                if (who) {
                    cls += " taken";
                    lbl = "<b>" + esc(amdaFirst(who)) + "</b>";
                    if (o.me && who !== o.me) dis = true;
                    if (o.board) {
                        var mk = amdaMkOf(who, o.sess);
                        if (mk[0] > 0) lbl += '<i class="p">' + mk[0] + "</i>";
                        if (mk[1] > 0) {
                            lbl += '<i class="d">' + mk[1] + "</i>";
                            cls += " bad";
                        }
                    }
                }
                if (o.me && id === o.mine) cls += " mine";
                if (o.board && o.sel && !who) cls += " free";
                h += '<button class="' + cls + '" data-s="' + id + '"' + (dis ? " disabled" : "") + ' aria-label="' + esc(who ? amdaNm(who) : amdaT("seatFree")) + '">' + AMDA_CHAIR + lbl + "</button>";
            }
            h += '</div><div class="am-tbl"></div></div>';
        }
        h += "</div>";
    });
    return h + '</div><div class="am-tdesk">' + esc(amdaT("teacher")) + "</div></div>";
}

function amdaBoard(slot) {
    var les = amdaLesson(slot);
    if (!les) return;
    amdaSt.bSlot = slot;
    amdaSt.bSel = "";
    amdaSt.bWho = "";
    var el = document.getElementById("amcb");
    if (!el) {
        el = document.createElement("div");
        el.id = "amcb";
        el.className = "amda";
        document.body.appendChild(el);
        el.addEventListener("click", amdaBoardTap);
    }
    el.className = "amda on";
    amdaBoardPaint();
    amdaFlush();
    amdaPull().then(amdaBoardPaint);
    clearInterval(amdaSt.bT);
    amdaSt.bT = setInterval(function() {
        amdaFlush();
        if (!amdaSt.bWho) amdaPull().then(amdaBoardPaint);
    }, 2e4);
}

function amdaBoardPaint() {
    var el = document.getElementById("amcb"), les = amdaLesson(amdaSt.bSlot);
    if (!el || el.className !== "amda on" || !les) return;
    var sess = amdaDay() + "|" + amdaSt.bSlot, had = amdaHadNow(sess), occ = amdaOcc(les, sess);
    var seated = {}, k;
    for (k in occ) {
        if (occ.hasOwnProperty(k)) seated[occ[k]] = 1;
    }
    var list = amdaList(les.g, les.c), noSeat = [], away = [];
    list.forEach(function(n) {
        var sk = amdaKey(les.g, les.c, n);
        if (!had[sk]) away.push(sk); else if (!seated[sk]) noSeat.push(sk);
    });
    var chip = function(sk, cls) {
        return '<button class="am-chip' + cls + (amdaSt.bSel === sk ? " on" : "") + '" data-k="' + esc(sk) + '">' + esc(amdaNm(sk)) + "</button>";
    };
    var h = '<div class="am-in"><div class="am-top"><span class="am-logo"><img alt="" src="' + LOGO_MARK + '"></span>' + '<div class="am-brand"><b>' + esc(amdaT("brand1")) + "</b><span>" + esc(amdaT("brand2")) + " · " + esc(PROGRAM.year) + '</span></div><button class="am-x" data-bx="1">' + esc(amdaT("bClose")) + "</button></div>" + '<div class="am-h">' + esc(amdaLessonName(les)) + "</div>" + '<div class="am-sub">' + esc(amdaT("bHere", {
        n: Object.keys(had).length,
        of: list.length
    })) + "</div>" + '<p class="am-lead">' + esc(amdaSt.bSel ? amdaT("bPlace", {
        n: amdaNm(amdaSt.bSel)
    }) : amdaT("bLead")) + "</p>" + amdaMapHtml(les, occ, {
        board: 1,
        sess: sess,
        sel: amdaSt.bSel
    });
    if (noSeat.length) h += '<div class="am-q">' + esc(amdaT("bNoSeat")) + '</div><div class="am-chips">' + noSeat.map(function(sk) {
        return chip(sk, "");
    }).join("") + "</div>";
    if (away.length) h += '<div class="am-q">' + esc(amdaT("bAbsent")) + '</div><div class="am-chips">' + away.map(function(sk) {
        return chip(sk, " away");
    }).join("") + "</div>";
    h += "</div>";
    if (amdaSt.bWho) {
        var w = amdaSt.bWho, td = amdaMkOf(w, sess), tt = amdaMkOf(w);
        h += '<div class="am-sheet" data-m="x"><div class="am-sh-in" data-m="in"><b>' + esc(amdaNm(w)) + "</b>" + "<span>" + esc(amdaT("bToday", {
            p: td[0],
            d: td[1]
        })) + "<br>" + esc(amdaT("bTotal", {
            a: amdaLesAtt()[w] || 0,
            p: tt[0],
            d: tt[1]
        })) + "</span>" + '<div class="am-mk"><button class="am-mp" data-m="p"><span class="am-sym">✓</span>' + esc(amdaT("mkP")) + "</button>" + '<button class="am-md" data-m="d"><span class="am-sym">✗</span>' + esc(amdaT("mkD")) + "</button></div>" + '<div class="am-mk"><button class="am-minus" data-m="p-">' + esc(amdaT("mkUndoP")) + "</button>" + '<button class="am-minus" data-m="d-">' + esc(amdaT("mkUndoD")) + "</button></div>" + '<div class="am-mk"><button class="am-x" data-m="move">' + esc(amdaT("bMove")) + "</button>" + '<button class="am-x" data-m="x">' + esc(amdaT("bClose")) + "</button></div></div></div>";
    }
    var y = el.firstChild ? el.scrollTop : 0;
    el.innerHTML = h;
    el.scrollTop = y;
}

function amdaBoardTap(e) {
    var el = e.target;
    while (el && el.id !== "amcb" && !(el.getAttribute && (el.getAttribute("data-s") || el.getAttribute("data-k") || el.getAttribute("data-m") || el.getAttribute("data-bx")))) el = el.parentNode;
    if (!el || el.id === "amcb") return;
    var les = amdaLesson(amdaSt.bSlot), sess = amdaDay() + "|" + amdaSt.bSlot;
    if (!les) return;
    if (el.getAttribute("data-bx")) {
        clearInterval(amdaSt.bT);
        document.getElementById("amcb").className = "amda";
        admPane();
        return;
    }
    var m = el.getAttribute("data-m");
    if (m) {
        var p = amdaNm(amdaSt.bWho);
        if (m === "in") return;
        if (m === "x") amdaSt.bWho = ""; else if (m === "move") {
            amdaSt.bSel = amdaSt.bWho;
            amdaSt.bWho = "";
        } else amdaMarkAdd(amdaSt.bSlot, les.g, les.c, p, m.charAt(0), m.length > 1 ? -1 : 1, "");
        amdaBoardPaint();
        return;
    }
    var k = el.getAttribute("data-k");
    if (k) {
        var had = amdaHadNow(sess);
        if (!had[k]) {
            if (!confirm(amdaT("bAskHere", {
                n: amdaNm(k)
            }))) return;
            amdaHereBy(les, k);
        }
        amdaSt.bSel = amdaSt.bSel === k ? "" : k;
        amdaBoardPaint();
        return;
    }
    var id = el.getAttribute("data-s"), occ = amdaOcc(les, sess);
    if (occ[id]) {
        amdaSt.bWho = occ[id];
        amdaSt.bSel = "";
        amdaBoardPaint();
        return;
    }
    if (amdaSt.bSel) {
        amdaMarkAdd(amdaSt.bSlot, les.g, les.c, amdaNm(amdaSt.bSel), "seat", 0, id);
        amdaSt.bSel = "";
        amdaBoardPaint();
    }
}

function amdaHereBy(les, sk) {
    var s = amdaSess(), q = amdaQ(), wk = Math.max(0, LWeek()), track = amdaTrack();
    var kind = s.slot === amdaSt.bSlot ? s.kind : "o";
    q.push({
        id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        w: wk + 1,
        day: amdaDay(),
        slot: amdaSt.bSlot,
        kind: kind === "d" ? "d" : "o",
        track: track,
        daf: LDafName(track, wk) || "",
        inst: amdaInst(),
        seat: "",
        g: les.g,
        c: les.c,
        n: amdaNm(sk),
        at: (new Date).toISOString()
    });
    Store.set("amdaQ", q);
    amdaFlush();
}

function amdaLesAtt() {
    var base = Store.get("amdaLesAtt", {}) || {}, out = {}, k;
    for (k in base) {
        if (base.hasOwnProperty(k)) out[k] = base[k];
    }
    amdaQ().forEach(function(m) {
        if (amdaLesson(m.slot)) {
            var sk = amdaKey(m.g, m.c, m.n);
            out[sk] = (out[sk] || 0) + 1;
        }
    });
    return out;
}
