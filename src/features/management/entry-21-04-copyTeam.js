function copyTeam(btn) {
    var code = joinCode();
    if (!code) return;
    var url = tzevetUrl(code);
    var mark = function() {
        var was = btn.textContent;
        btn.textContent = UI.linkCopied;
        setTimeout(function() {
            btn.textContent = was;
        }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(mark).catch(function() {
            legacyCopy(url, mark);
        });
    } else legacyCopy(url, mark);
}

function legacyCopy(txt, done) {
    var t = document.createElement("textarea");
    t.value = txt;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;top:-999px;opacity:0";
    document.body.appendChild(t);
    t.select();
    t.setSelectionRange(0, txt.length);
    try {
        document.execCommand("copy");
        done();
    } catch (e) {}
    document.body.removeChild(t);
}

function regDone(txt, viaWa) {
    var sb = document.getElementById("r-send");
    if (sb) {
        sb.textContent = UI.sent;
        sb.className = "btn gr sent";
        sb.disabled = true;
    }
    document.getElementById("r-done").innerHTML = (viaWa && COORD_WA ? '<div style="text-align:center;margin-top:11px">' + '<a style="font-size:.79rem;color:var(--ink-3);font-weight:700" ' + 'href="https://wa.me/' + COORD_WA + "?text=" + encodeURIComponent(txt) + '" target="_blank" rel="noopener">לא קיבלתם אישור? שלחו לנו הודעה</a></div>' : "") + "";
    renderHome();
    var code = myBoard();
    var inst = code && INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0];
    if (inst) {
        document.getElementById("head-next").innerHTML = thanksHtml(code, inst.name);
    }
    document.getElementById("r-done").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

var ACC_ABC = "abcdefghjkmnpqrstuvwxyz23456789";

function newAccess() {
    var s = "";
    for (var i = 0; i < 6; i++) s += ACC_ABC.charAt(Math.floor(Math.random() * ACC_ABC.length));
    return s;
}

function instCode(code) {
    return (Store.get("instCodes", {}) || {})[code] || "";
}

function setInstCode(code, k) {
    var m = Store.get("instCodes", {}) || {};
    m[code] = k;
    Store.set("instCodes", m);
}

function myBoard() {
    var saved = regSaved();
    if (saved && saved.code && saved.code !== "other") return saved.code;
    return Store.get("dfBoard", "") || "";
}

function rosterMode() {
    var v = CV("roster");
    return v != null ? v : ROSTER_DEF;
}

function joinLinkOn() {
    return CV("joinLink") !== false;
}

function roleAskOn() {
    return CV("roleAsk") !== false;
}

function bPairs(t) {
    return String(t || "").split("·").map(function(p) {
        var i = p.lastIndexOf(":");
        return i < 0 ? null : [ p.slice(0, i).trim(), parseInt(p.slice(i + 1), 10) || 0 ];
    }).filter(function(x) {
        return x && x[0] && x[1];
    });
}

function bJoin(code) {
    return (Store.get("joinCount", {}) || {})[code] || null;
}

function netMode() {
    var v = CV("netTicker");
    return v === "nums" || v === "names" ? v : "off";
}

function netItemsIn(mode) {
    var was = CFG.netTicker, out;
    CFG.netTicker = mode;
    out = netItems();
    if (was === undefined) delete CFG.netTicker; else CFG.netTicker = was;
    return out;
}

function netSum(field) {
    var m = Store.get("joinCount", {}) || {}, out = {}, order = [];
    for (var c in m) {
        if (!m.hasOwnProperty(c)) continue;
        (m[c][field] || []).forEach(function(pair) {
            if (out[pair[0]] === undefined) {
                out[pair[0]] = 0;
                order.push(pair[0]);
            }
            out[pair[0]] += pair[1];
        });
    }
    return order.map(function(k) {
        return [ k, out[k] ];
    });
}

function netItems() {
    var mode = netMode();
    if (mode === "off") return [];
    var m = Store.get("joinCount", {}) || {}, items = [], total = 0, live = 0;
    INSTITUTIONS.forEach(function(inst) {
        var j = m[inst.code];
        if (!j || !j.n) return;
        live++;
        total += j.n;
        if (mode === "names") items.push([ String(j.n), esc(inst.name) ]);
    });
    if (!live) return [];
    var oth = m.other;
    if (oth && oth.n) total += oth.n;
    if (mode === "nums") {
        items.push([ String(live), live === 1 ? "ישיבה ברשת" : "ישיבות ברשת" ]);
        items.push([ String(total), "לומדים בסך הכול" ]);
        netSum("ways").forEach(function(w) {
            items.push([ String(w[1]), esc(w[0]) ]);
        });
        netSum("grades").forEach(function(g) {
            items.push([ String(g[1]), "שכבה " + esc(g[0]) ]);
        });
    } else {
        items.unshift([ String(total), "לומדים ברשת" ]);
    }
    return items;
}

function renderNet() {
    var el = document.getElementById("netbar");
    if (!el) return;
    var items = netItems();
    if (!items.length) {
        el.className = "";
        el.innerHTML = "";
        return;
    }
    var one = items;
    while (one.length < 6) one = one.concat(items);
    var set = '<div class="nb-set">' + one.map(function(it) {
        return '<span class="nb-i"><b>' + it[0] + "</b>" + it[1] + "</span>";
    }).join("") + "</div>";
    el.className = "netbar";
    el.innerHTML = '<div class="nb-track">' + set + set + "</div>";
}

function bJoinAll() {
    var m = Store.get("joinCount", {}) || {}, n = 0, w = {}, any = false;
    Object.keys(m).forEach(function(c) {
        var x = m[c];
        if (!x) return;
        any = true;
        n += x.n || 0;
        (x.ways || []).forEach(function(p) {
            w[p[0]] = (w[p[0]] || 0) + (p[1] || 0);
        });
    });
    return any ? {
        n: n,
        ways: Object.keys(w).map(function(k) {
            return [ k, w[k] ];
        })
    } : null;
}

var ADM_MAS = null;

function admMas(k) {
    ADM_MAS = k || "all";
    Store.set("admMas", ADM_MAS);
    admLive();
}

function brdTracks(go) {
    if (!go) return [ homeTrack ];
    if (ADM_MAS === null) ADM_MAS = Store.get("admMas", "all");
    if (ADM_MAS !== "all" && trackById(ADM_MAS)) return [ ADM_MAS ];
    return TRACKS.map(function(t) {
        return t.id;
    });
}

function boardHtml(code, name, hail, go) {
    var j = code ? bJoin(code) : bJoinAll(), n = j ? j.n : 0;
    var wk = weekIndex(), trs = brdTracks(go), tr = trs[0];
    var row = wk >= 0 ? trackById(tr).cal[wk] : null;
    var row0 = trackById(tr).cal[0];
    var cnt = function(t) {
        return wk >= 0 && typeof LCount === "function" ? LCount(t, wk, code) : 0;
    };
    var dafs = [], did = 0;
    trs.forEach(function(t) {
        var r = wk >= 0 ? trackById(t).cal[wk] : null;
        var d = r && r[2] && r[2] !== "סיום" ? rowDaf(r) : null;
        if (d && dafs.indexOf(d) < 0) dafs.push(d);
        did += cnt(t);
    });
    var daf = dafs.length ? dafs.join(" / ") : null;
    var masBar = !go || TRACKS.length < 2 ? "" : '<div class="chips brd-mas">' + [ [ "all", UI.admMasAll, TRACKS.reduce(function(a, t) {
        return a + cnt(t.id);
    }, 0) ] ].concat(TRACKS.map(function(t) {
        return [ t.id, t.masechet, cnt(t.id) ];
    })).map(function(o) {
        var on = ADM_MAS === o[0] || o[0] === "all" && !trackById(ADM_MAS);
        return '<button class="chip' + (on ? " on" : "") + '" onclick="admMas(\'' + o[0] + "')\">" + esc(o[1]) + (wk >= 0 ? "<b>" + o[2] + "</b>" : "") + "</button>";
    }).join("") + "</div>";
    var wa = fill(UI.linkWa, {
        inst: name,
        url: joinUrl(code)
    });
    var hero = n ? "<b>" + n + "<small>" + esc(fill(UI.cbHero, {
        n: ""
    }).replace(/^\s*/, "")) + "</small></b><span>" + esc(code ? UI.cbHeroSub : UI.admHeroAll) + "</span>" : '<b style="font-size:1.15rem;color:var(--ink)">' + esc(UI.cbEmpty) + "</b>" + "<p>" + esc(UI.cbEmptySub) + "</p>";
    var bar = "";
    if (n && daf) {
        bar = '<div class="brd-bar"><div class="t"><i style="width:' + Math.max(3, Math.round(did / n * 100)) + '%"></i></div>' + "<span>" + esc(fill(UI.cbBar, {
            n: did,
            all: n,
            daf: daf
        })) + "</span></div>" + masBar;
    } else if (n && row0) {
        bar = '<div class="brd-bar"><div class="brd-first">' + '<span class="dot">' + esc(row0[2]) + "</span>" + "<div><b>" + esc(UI.cbSoon) + " · " + esc(row0[1]) + "</b>" + "<span>" + esc(row0[0]) + "</span></div></div></div>";
    }
    var chips = "";
    if (j && typeof WaysTiles === "function") {
        var wmap = {};
        (j.ways || []).forEach(function(p2) {
            wmap[p2[0]] = p2[1];
        });
        chips = WaysTiles(function(kk) {
            return wmap[kk] || 0;
        }, go ? {
            go: "admWay",
            sel: ADM_WAY
        } : {});
    }
    var hi = hail ? '<div class="hail"><b>' + esc(fill(UI.hailTitle, {
        inst: name
    })) + "</b>" + "<span>" + esc(UI.hailSub) + "</span></div>" : "";
    var full = go ? '<button class="btn p" style="margin-top:10px" onclick="' + go + '">' + esc(UI.cbBoard) + " ←</button>" : '<a class="btn p" style="text-decoration:none;margin-top:10px" ' + 'href="' + esc(boardUrl(code)) + '">' + esc(UI.cbBoard) + " ←</a>";
    return '<div class="brd' + (hail ? " hail" : "") + '">' + hi + '<div class="brd-hero">' + hero + "</div>" + chips + bar + full + '<div class="brd-note">' + esc(UI.cbNote) + "</div></div>";
}

function myInstRow() {
    var code = myBoard();
    return code && INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0] || null;
}
