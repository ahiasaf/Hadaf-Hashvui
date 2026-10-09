var DKM_BAK = "deckBak";

var dkmOp = null;

var DKM_OLD_DIR = {
    "slides/taanit-1": "ב",
    "slides/taanit-2": "ג"
};

function dkmClone(m) {
    return JSON.parse(JSON.stringify(m || {}));
}

function dkmWk(key) {
    return parseInt(String(key).split("-").pop(), 10);
}

function dkmMas(key) {
    var p = String(key).split("-");
    p.pop();
    return p.join("-");
}

function dkmRow(mas, wk) {
    var t = trackById(mas);
    return t && t.cal[wk - 1] || null;
}

function dkmDafTxt(mas, wk) {
    var r = dkmRow(mas, wk);
    return fill(UI.dkmDaf, {
        daf: r && r[2] || ""
    });
}

function dkmAmTxt(mas, wk) {
    var am = LAmOf(dkmRow(mas, wk));
    return am === 1 ? UI.dkmAmA : am === 2 ? UI.dkmAmB : UI.dkmWhole;
}

function dkmDeck(mas, wk) {
    var d = DeckOf(mas, wk);
    if (!d) return null;
    var files = [];
    for (var i = 1; i <= d.files.length; i++) files.push(DeckSrc(d, i));
    return {
        files: files,
        title: DeckTitle(mas, wk) || ""
    };
}

function dkmList(mas) {
    var t = trackById(mas), out = [];
    if (!t) return out;
    t.cal.forEach(function(r, k) {
        if (!r[2] || r[2] === "סיום") return;
        var d = dkmDeck(mas, k + 1);
        if (d) out.push({
            key: mas + "-" + (k + 1),
            wk: k + 1,
            deck: d
        });
    });
    return out;
}

function dkmDafs(mas) {
    var t = trackById(mas), out = [], at = {};
    if (!t) return out;
    t.cal.forEach(function(r, k) {
        if (!r[2] || r[2] === "סיום") return;
        var d = String(r[2]);
        if (at[d] == null) {
            at[d] = out.length;
            out.push({
                daf: d,
                wks: []
            });
        }
        out[at[d]].wks.push(k + 1);
    });
    return out;
}

function dkmDirDaf(mas, f) {
    var m = /^(slides\/[a-z]+-(\d+))\//.exec(f);
    if (!m || m[1].indexOf("slides/" + mas + "-") !== 0) return "";
    if (DKM_OLD_DIR[m[1]]) return DKM_OLD_DIR[m[1]];
    var r = dkmRow(mas, parseInt(m[2], 10));
    return r && r[2] ? rowDaf(r) : "";
}

function dkmAudit(mas) {
    var out = [], dafs = dkmDafs(mas), has = {};
    dkmList(mas).forEach(function(it) {
        has[it.wk] = it;
        var fd = "", one = true;
        it.deck.files.forEach(function(f) {
            var d = dkmDirDaf(mas, f);
            if (!d) {
                one = false;
                return;
            }
            if (fd && fd !== d) one = false;
            fd = fd || d;
        });
        var here = rowDaf(dkmRow(mas, it.wk)), base = dkmRow(mas, it.wk)[2];
        if (one && fd && fd !== here && fd !== base) {
            out.push({
                key: it.key,
                wk: it.wk,
                deck: it.deck,
                why: fill(UI.dkmWhyFold, {
                    daf: fill(UI.dkmDaf, {
                        daf: fd
                    })
                })
            });
        }
    });
    dafs.forEach(function(d) {
        if (d.wks.length !== 2) return;
        var a = has[d.wks[0]], b = has[d.wks[1]];
        if (!!a === !!b) return;
        var it = a || b, me = dkmAmTxt(mas, it.wk);
        var other = dkmAmTxt(mas, a ? d.wks[1] : d.wks[0]);
        for (var i = 0; i < out.length; i++) if (out[i].key === it.key) return;
        out.push({
            key: it.key,
            wk: it.wk,
            deck: it.deck,
            why: fill(UI.dkmWhyHalf, {
                am: me,
                other: other
            })
        });
    });
    return out.sort(function(x, y) {
        return x.wk - y.wk;
    });
}

function dkmThumb(deck) {
    return deck.files.length ? '<img class="dkm-th" loading="lazy" alt="" src="' + esc(deck.files[0]) + '">' : '<span class="dkm-th"></span>';
}

var dkSlPick = {};

var dkBust = Date.now();

function dkSlSel() {
    return dkList.filter(function(f) {
        return !!dkSlPick[dkPath(f)];
    }).map(dkPath);
}

function dkSlTap(i) {
    var p = dkPath(dkList[i]);
    if (dkSlPick[p]) delete dkSlPick[p]; else dkSlPick[p] = 1;
    dkSlPaint();
}

function dkSlAll() {
    var all = dkSlSel().length === dkList.length;
    dkSlPick = {};
    if (!all) dkList.forEach(function(f) {
        dkSlPick[dkPath(f)] = 1;
    });
    dkSlPaint();
}

function dkSlClear() {
    dkSlPick = {};
    dkSlPaint();
}

function dkSlPaint() {
    var bs = document.querySelectorAll(".dkm-sl"), i;
    for (i = 0; i < bs.length; i++) {
        var b = bs[i], f = dkList[+b.getAttribute("data-i")];
        var on = !!(f && dkSlPick[dkPath(f)]), ck = b.querySelector("i");
        b.setAttribute("aria-pressed", String(on));
        if (b.parentNode) b.parentNode.classList[on ? "add" : "remove"]("dkm-on");
        if (on && !ck) {
            ck = document.createElement("i");
            ck.textContent = "✓";
            b.appendChild(ck);
        }
        if (!on && ck) ck.parentNode.removeChild(ck);
    }
    var bar = document.getElementById("dk-slbar");
    if (bar) bar.innerHTML = dkSlBar();
    var al = document.getElementById("dk-slall");
    if (al) al.textContent = dkSlSel().length === dkList.length ? UI.dkmClear : UI.dkmPickAll;
}

function dkSlBar() {
    var n = dkSlSel().length;
    if (!n) return "";
    return '<div class="dkm-bar"><b>' + esc(fill(UI.dkmSelN, {
        n: n
    })) + "</b>" + '<button class="btn p" onclick="dkmOpen(\'mv\')">⇄ ' + esc(UI.dkmMv) + "</button>" + '<button class="btn p" onclick="dkmOpen(\'cp\')">⧉ ' + esc(UI.dkmCp) + "</button>" + '<button class="btn g" onclick="dkSlClear()">' + esc(UI.dkmClear) + "</button>" + "</div>";
}

function dkmWhy(mas) {
    var out = {};
    dkmAudit(mas).forEach(function(it) {
        out[it.wk] = it.why;
    });
    return out;
}

function dkmOpen(mode) {
    var sel = dkSlSel();
    if (!sel.length || !dkSel) return;
    dkmOp = {
        mode: mode,
        mas: dkSel.mas,
        wk: dkSel.wk,
        files: sel,
        daf: null,
        to: 0,
        st: "daf"
    };
    dkmPaint();
}

function dkmClose() {
    var b = document.getElementById("dkm");
    if (b) b.className = "";
    dkmOp = null;
}

function dkmAmGo(wk) {
    dkmOp.to = wk;
    dkmOp.st = "ok";
    dkmPaint();
}

function dkmStep(st) {
    dkmOp.st = st;
    dkmPaint();
}

function dkmBox(mas, wk, deck) {
    return '<div class="dkm-box">' + (deck ? dkmThumb(deck) : '<span class="dkm-th"></span>') + "<b>" + esc(dkmDafTxt(mas, wk)) + "</b><small>" + esc(dkmAmTxt(mas, wk)) + "</small>" + (deck ? "<small>" + esc(fill(UI.dkmSlides, {
        n: deck.files.length
    })) + "</small>" : "") + "</div>";
}

function dkmPaint() {
    var b = document.getElementById("dkm");
    if (!b) {
        b = document.createElement("div");
        b.id = "dkm";
        b.setAttribute("role", "dialog");
        b.setAttribute("aria-modal", "true");
        b.onclick = function(e) {
            if (e.target === b && dkmOp && dkmOp.st !== "busy") dkmClose();
        };
        document.body.appendChild(b);
    }
    var o = dkmOp, mas = o.mas, h = "";
    var ttl = o.mode === "mv" ? UI.dkmMvT : UI.dkmCpT;
    h += '<div class="sh"><div class="hd"><b>' + (o.mode === "mv" ? "⇄ " : "⧉ ") + esc(ttl) + "</b>" + (o.st === "busy" ? "" : '<button onclick="dkmClose()" aria-label="' + esc(UI.dkmCancel) + '">✕</button>') + "</div>";
    h += '<div class="dkm-src">' + o.files.slice(0, 6).map(function(f) {
        return dkmThumb({
            files: [ f ]
        });
    }).join("") + (o.files.length > 6 ? "<b>+" + (o.files.length - 6) + "</b>" : "") + '<span class="dkm-chip">' + esc(rowDaf(dkmRow(mas, o.wk))) + "</span></div>";
    if (o.st === "daf") {
        var tr = trackById(mas), here = -1;
        var units = TrailWeeks(tr).filter(function(u) {
            return u.kind === "daf";
        });
        units.forEach(function(u, k) {
            if (u.wk + 1 === o.wk) here = k;
        });
        h += '<div class="label">' + esc(UI.dkmPickDaf) + "</div>" + TrailHtml({
            tr: tr,
            units: units,
            here: here,
            wi: typeof LWeek === "function" ? LWeek() : -1,
            attr: function(u) {
                return ' role="button" tabindex="0" onclick="dkmAmGo(' + (u.wk + 1) + ')"';
            }
        });
    } else if (o.st === "ok") {
        var same = o.to === o.wk;
        var tgt = dkmDeck(mas, o.to);
        h += '<div class="dkm-ft">' + dkmBox(mas, o.wk, {
            files: o.files
        }) + '<span class="dkm-ar">←</span>' + dkmBox(mas, o.to, tgt) + "</div>" + '<p class="dkm-note ' + o.mode + '">' + (o.mode === "mv" ? "✕ " + esc(UI.dkmWillMv) : "✓ " + esc(UI.dkmWillCp)) + "</p>" + (tgt ? '<p class="dkm-note">＋ ' + esc(fill(UI.dkmHas, {
            n: tgt.files.length
        })) + "</p>" : "") + '<div class="dkm-two">' + '<button class="btn g" onclick="dkmStep(\'daf\')">' + esc(UI.dkmBack) + "</button>" + '<button class="btn gd"' + (same ? " disabled" : ' onclick="dkmRun()"') + ">" + esc(UI.dkmOk) + "</button></div>";
    } else {
        h += '<p class="dkm-note">' + esc(o.msg || "") + "</p>" + (o.st === "done" && o.undo ? '<div class="dkm-two">' + '<button class="btn warn" onclick="dkmUndo()">' + esc(UI.dkmUndo) + "</button>" + '<button class="btn gd" onclick="dkmClose()">' + esc(UI.dkmOk) + "</button></div>" : o.st === "busy" ? "" : '<button class="btn gd" onclick="dkmClose()">' + esc(UI.dkmOk) + "</button>");
    }
    b.innerHTML = h + "</div>";
    b.className = "on";
    if (o.st === "daf") setTimeout(function() {
        var c = b.querySelector(".trl-step.here");
        if (c && c.scrollIntoView) c.scrollIntoView({
            block: "center"
        });
    }, 30);
}

function dkWriteMap(map, done) {
    var rows = [], k;
    for (k in map) {
        if (!map.hasOwnProperty(k)) continue;
        rows.push([ dkmMas(k), String(dkmWk(k)), map[k].dir || "", (map[k].files || []).join(","), map[k].title || "" ]);
    }
    rows.sort(function(a, b) {
        return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1];
    });
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: DECK_SHEET,
            key: (CFG.readKey || "").trim(),
            cols: JSON.stringify([ "מסכת", "שבוע", "תיקייה", "קבצים", "כותרת" ]),
            rows: JSON.stringify(rows)
        })
    }).catch(function() {});
    var tries = 0;
    (function chk() {
        setTimeout(function() {
            DeckLoad().then(function() {
                if (dkmSame(map, DECKS)) {
                    done(true);
                    return;
                }
                if (++tries < 5) chk(); else done(false);
            });
        }, tries ? 2500 : 1400);
    })();
}

function dkmSame(a, b) {
    if (!b) return false;
    var k;
    for (k in a) {
        if (!a.hasOwnProperty(k)) continue;
        if (!b[k] || (b[k].files || []).join(",") !== (a[k].files || []).join(",") || String(b[k].title || "") !== String(a[k].title || "")) return false;
    }
    for (k in b) if (b.hasOwnProperty(k) && !a[k]) return false;
    return true;
}

function dkmBakPush(map) {
    var st = Store.get(DKM_BAK, []) || [];
    st.push({
        at: (new Date).toISOString(),
        map: map
    });
    Store.set(DKM_BAK, st.slice(-10));
}

function dkmRun() {
    var o = dkmOp;
    if (!API || !(CFG.readKey || "").trim()) {
        o.st = "end";
        o.msg = UI.dkmNoKey;
        dkmPaint();
        return;
    }
    clearTimeout(dkAutoT_);
    var srcKey = o.mas + "-" + o.wk;
    var src = {
        dir: dkDir,
        files: dkList.map(dkPath),
        title: dkTitle
    };
    o.st = "busy";
    o.msg = UI.dkmBusy;
    dkmPaint();
    DeckLoad().then(function(ok) {
        if (!ok || !DECKS) {
            o.st = "end";
            o.msg = UI.dkmNoRead;
            dkmPaint();
            return;
        }
        var before = dkmClone(DECKS), map = dkmClone(DECKS), mas = o.mas;
        var tk = mas + "-" + o.to, tgt = dkmDeck(mas, o.to) || {
            files: [],
            title: ""
        };
        var files = tgt.files.slice();
        o.files.forEach(function(f) {
            if (files.indexOf(f) < 0) files.push(f);
        });
        map[srcKey] = {
            dir: src.dir,
            title: src.title,
            files: o.mode === "mv" ? src.files.filter(function(f) {
                return o.files.indexOf(f) < 0;
            }) : src.files
        };
        map[tk] = {
            dir: "slides/" + tk,
            files: files,
            title: tgt.title || (o.files.length === src.files.length ? src.title : "")
        };
        dkmBakPush(before);
        dkWriteMap(map, function(good) {
            o.st = good ? "done" : "end";
            o.msg = good ? UI.dkmDone : UI.dkmFail;
            o.undo = good;
            if (good) {
                dkSlPick = {};
                dkmDropDrafts();
            }
            dkmPaint();
            admPane();
        });
    });
}

function dkmUndo() {
    var st = Store.get(DKM_BAK, []) || [], last = st[st.length - 1];
    if (!last) return;
    dkmOp.st = "busy";
    dkmOp.msg = UI.dkmBusy;
    dkmPaint();
    dkWriteMap(last.map, function(good) {
        if (good) {
            st.pop();
            Store.set(DKM_BAK, st);
            dkmDropDrafts();
        }
        dkmOp.st = "end";
        dkmOp.undo = false;
        dkmOp.msg = good ? UI.dkmUndone : UI.dkmFail;
        dkmPaint();
        admPane();
    });
}

function dkmDropDrafts() {
    if (CFG.decks) cfgSet("decks", null);
    if (dkSel) dkLoadSel();
}

var opAsked = false, opBusy = false, opMsg = "", opCls = "";

function admOpen(el) {
    if (!opAsked) {
        opAsked = true;
        OpenLoad().then(function() {
            admPane();
        });
    }
    var map = OpenMap(), h = "";
    h += '<div class="adm-card" style="margin-bottom:11px"><h4>פתיחת דפים</h4>' + '<p class="h">דף שנפתח זמין מיד לכל התלמידים - גם לפני השבוע שלו. ' + 'דף נעול מציג לתלמיד "' + esc(UI.lockT) + '", ומי שביקש שם התראה ' + "יקבל אותה ברגע שתפתחו את הדף.</p>" + (OPENS ? "" : '<p class="h">עדיין לא נפתח דבר מכאן - לכן רק הדף ' + "הראשון בכל מסכת פתוח.</p>") + (opMsg ? '<p class="h" style="margin-top:9px;color:var(--' + (opCls === "ok" ? "ok" : opCls === "bad" ? "stop" : "ink-2") + ')">' + esc(opMsg) + "</p>" : "") + "</div>";
    TRACKS.forEach(function(t, ti) {
        h += '<div class="adm-card" style="margin-bottom:11px"><h4>מסכת ' + esc(t.masechet) + "</h4>";
        t.cal.forEach(function(r, wi) {
            if (!r[2] || r[2] === "סיום") return;
            var on = OpenIs(t.id, r[2], OpenAm(r));
            h += '<div class="row" style="align-items:center;gap:9px">' + '<span style="flex:1;min-width:0"><b>דף ' + esc(r[2] + LAmMark(OpenAm(r))) + "</b>" + '<span class="h" style="display:block;margin:0">שבוע ' + (wi + 1) + " · " + esc(r[1]) + "</span></span>" + (on ? '<span style="font-weight:800;color:var(--ok)">פתוח ✓</span>' + '<button class="btn g" style="width:auto;flex:none;padding:9px 14px" ' + (opBusy ? "disabled " : "") + 'onclick="opToggle(' + ti + "," + wi + ')">סגירה</button>' : '<button class="btn gd" style="width:auto;flex:none;padding:9px 16px" ' + (opBusy ? "disabled " : "") + 'onclick="opToggle(' + ti + "," + wi + ')">🔒 פתיחה</button>') + "</div>";
        });
        h += "</div>";
    });
    el.innerHTML = h;
}
