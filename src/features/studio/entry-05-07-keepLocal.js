var MARK_TAB = "סימוני הדף";

var DIRTY = {};

var SEEN = {};

var LOCAL_AT = 0;

var LKEY = "df:studio";

function keepLocal() {
    try {
        localStorage.setItem(LKEY, JSON.stringify({
            at: Date.now(),
            book: BOOK,
            dirty: DIRTY
        }));
    } catch (e) {}
}

function loadLocal() {
    try {
        var v = JSON.parse(localStorage.getItem(LKEY) || "null");
        if (!v || !v.book) return 0;
        LOCAL_AT = v.at || 0;
        for (var k in v.book) if (!BOOK[k]) BOOK[k] = v.book[k];
        var n = 0;
        for (var d in v.dirty || {}) if (BOOK[d]) {
            DIRTY[d] = 1;
            n++;
        }
        return n;
    } catch (e) {
        return 0;
    }
}

function dirtyCount() {
    var n = 0;
    for (var k in DIRTY) {
        var r = BOOK[k] || {};
        if (r.steps && r.steps.length || r.cal) n++;
    }
    return n;
}

function touched() {
    DIRTY[PKEY] = 1;
    keepPageState();
    if (BOOK[PKEY]) BOOK[PKEY].t = Date.now();
    keepLocal();
}

function sheetCsv(tab) {
    var id = window.CFG && CFG.sheetId || window.SHEET_ID;
    if (!id) return Promise.resolve(null);
    return fetch("https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab) + "&t=" + Date.now()).then(function(r) {
        return r.ok ? r.text() : null;
    }).then(function(t) {
        return t ? csvRows(t) : null;
    }).catch(function() {
        return null;
    });
}

function csvRows(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') {
                f += '"';
                i++;
            } else if (c === '"') q = false; else f += c;
        } else if (c === '"') q = true; else if (c === ",") {
            row.push(f);
            f = "";
        } else if (c === "\n") {
            row.push(f);
            rows.push(row);
            row = [];
            f = "";
        } else if (c !== "\r") f += c;
    }
    if (f !== "" || row.length) {
        row.push(f);
        rows.push(row);
    }
    return rows.filter(function(r) {
        return r.join("").trim() !== "";
    });
}

var COLS = [ "מסכת", "דף", "עמוד", "נתונים" ];

function writeKey_() {
    var c = {};
    try {
        c = JSON.parse(localStorage.getItem("df:cfg") || "{}") || {};
    } catch (e) {}
    var k = String(c.readKey || "").trim();
    if (k) return k;
    k = String(window.prompt("סיסמת הסקריפט - פעם אחת במכשיר הזה.\n" + "בלעדיה אי אפשר לשמור בגיליון.") || "").trim();
    if (k) {
        c.readKey = k;
        try {
            localStorage.setItem("df:cfg", JSON.stringify(c));
        } catch (e) {}
    }
    return k;
}

function saveToSheet() {
    if (!API) {
        say("אין כתובת שרת.", 1);
        return Promise.resolve(false);
    }
    var wkey = writeKey_();
    if (!wkey) {
        say("לא נשמר - חסרה סיסמת הסקריפט. העבודה שמורה במכשיר.", 1);
        return Promise.resolve(false);
    }
    keepPageState();
    say("שומר בגיליון…");
    return sheetCsv(MARK_TAB).then(function(rows) {
        if (!rows || rows.length < 1) {
            say("לא הצלחתי לקרוא את הגיליון. לא שמרתי, כדי לא למחוק " + "דפים אחרים. נסו שוב.", 1);
            return false;
        }
        var keep = [], inSheet = {}, mine = {}, there = {};
        (rows || []).slice(1).forEach(function(r) {
            var rk0 = r[0] + "|" + r[1] + "|" + r[2];
            inSheet[rk0] = 1;
            try {
                there[rk0] = JSON.parse(r[3]);
            } catch (e) {}
        });
        for (var k0 in BOOK) {
            var sr = there[k0];
            if (!DIRTY[k0] && sr && (sr.t || 0) > ((BOOK[k0] || {}).t || 0)) {
                BOOK[k0] = sr;
                if (k0 === PKEY) {
                    STEPS = sr.steps || [];
                    seal();
                }
                continue;
            }
            if (SEEN[k0] || DIRTY[k0] || !inSheet[k0]) mine[k0] = 1;
        }
        (rows || []).slice(1).forEach(function(r) {
            var rk = r[0] + "|" + r[1] + "|" + r[2];
            if (!mine[rk] && !GONE[rk]) keep.push(r.slice(0, 4));
        });
        for (var k in mine) {
            var a = k.split("|");
            keep.push([ a[0] || "", a[1] || "", a.slice(2).join("|"), JSON.stringify(BOOK[k]) ]);
        }
        return fetch(API, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "table",
                tab: MARK_TAB,
                key: wkey,
                cols: JSON.stringify(COLS),
                rows: JSON.stringify(keep)
            })
        }).then(function() {
            return new Promise(function(ok) {
                setTimeout(ok, 1200);
            });
        }).then(function() {
            return sheetCsv(MARK_TAB);
        }).then(function(back) {
            var have = {};
            (back || []).slice(1).forEach(function(r2) {
                have[r2[0] + "|" + r2[1] + "|" + r2[2]] = r2[3] || "";
            });
            var same = function(a, b) {
                if (a === b) return true;
                try {
                    return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b));
                } catch (e) {
                    return false;
                }
            };
            var missing = [];
            for (var q2 in mine) {
                if (!have.hasOwnProperty(q2) || !same(have[q2], JSON.stringify(BOOK[q2]))) missing.push(q2);
            }
            if (missing.length) {
                keepLocal();
                say("הגיליון לא אישר " + missing.length + " עמודים - " + "העבודה שמורה במכשיר. נסו שוב. אם זה חוזר, ייתכן שסיסמת " + "הסקריפט במכשיר שגויה (ניהול ← מערכת).", 1);
                markPanel();
                return false;
            }
            var n = 0;
            for (var q in BOOK) n += (BOOK[q].steps || []).length;
            DIRTY = {};
            keepLocal();
            markPanel();
            say("נשמר בגיליון · " + n + ' קטעים · לשונית "' + MARK_TAB + '"');
            return true;
        });
    }).catch(function() {
        say("השמירה נכשלה.", 1);
        return false;
    });
}

function loadFromSheet() {
    return sheetCsv(MARK_TAB).then(function(rows) {
        if (!rows || rows.length < 2) return 0;
        var mas = selVal("mas"), daf = selVal("daf"), n = 0, ask = [], took = 0;
        var take = function(k, rec) {
            var was = BOOK[k];
            if (was) {
                if (!rec.cal && was.cal) {
                    rec.cal = was.cal;
                    rec.zones = was.zones;
                }
                if (!rec.splits && was.splits) rec.splits = was.splits;
                if (!rec.hidden && was.hidden) rec.hidden = was.hidden;
                if (!rec.fixes && was.fixes) rec.fixes = was.fixes;
                if (!rec.prev && was.prev) {
                    rec.prev = was.prev;
                    rec.prevDaf = was.prevDaf;
                }
            }
            BOOK[k] = rec;
            SEEN[k] = 1;
            n++;
        };
        rows.slice(1).forEach(function(r) {
            if (r[0] !== mas || r[1] !== daf) return;
            var k = r[0] + "|" + r[1] + "|" + r[2];
            if (GONE[k]) return;
            var rec;
            try {
                rec = JSON.parse(r[3]);
            } catch (e) {
                return;
            }
            if (DIRTY[k]) {
                var mine = BOOK[k];
                if (!mine) {
                    delete DIRTY[k];
                    take(k, rec);
                    return;
                }
                if (JSON.stringify(mine.steps || []) === JSON.stringify(rec.steps || []) && JSON.stringify(mine.cal || null) === JSON.stringify(rec.cal || null)) return;
                var lt = mine.t || 0, rt = rec.t || 0;
                if (lt && rt) {
                    if (rt > lt) {
                        delete DIRTY[k];
                        take(k, rec);
                        took++;
                    }
                    return;
                }
                ask.push([ k, rec ]);
                return;
            }
            take(k, rec);
        });
        if (ask.length) {
            var when = LOCAL_AT ? new Date(LOCAL_AT).toLocaleDateString("he-IL") : "";
            if (confirm("במכשיר הזה יש שינויים שלא נשמרו ב-" + ask.length + " עמודים" + (when ? " (מ-" + when + ")" : "") + ", ובגיליון יש להם גרסה אחרת.\n\n" + "לטעון את הגרסה שבגיליון?\n" + "אישור - הגיליון (מה שנעשה במכשירים אחרים)\n" + "ביטול - להשאיר את מה שבמכשיר הזה")) {
                ask.forEach(function(p) {
                    delete DIRTY[p[0]];
                    take(p[0], p[1]);
                });
                took += ask.length;
            }
        }
        if (took) {
            keepLocal();
            markPanel();
        }
        return n;
    }).catch(function() {
        return 0;
    });
}

var ZOOM = 1;

function stage() {
    return document.querySelector(".stage");
}

function setZoom(z, cx, cy) {
    var st = stage(), h = document.getElementById("holder");
    var r = st.getBoundingClientRect();
    cx = cx === undefined ? r.width / 2 : cx;
    cy = cy === undefined ? r.height / 2 : cy;
    var old = ZOOM;
    ZOOM = Math.max(1, Math.min(6, z));
    var fx = (st.scrollLeft + cx) / old, fy = (st.scrollTop + cy) / old;
    h.style.width = ZOOM * 100 + "%";
    st.scrollLeft = fx * ZOOM - cx;
    st.scrollTop = fy * ZOOM - cy;
}

function zoomToSel() {
    var sh = selShapes(GSEL);
    if (!sh.length) return;
    var st = stage();
    var top = sh[0][1], bot = sh[sh.length - 1][1] + sh[sh.length - 1][3];
    var img = document.getElementById("page");
    var base = img.clientWidth / ZOOM / S.w;
    var want = Math.min(4, st.clientHeight / ((bot - top) * base * 2.2));
    setZoom(Math.max(1, want));
    st.scrollTop = (top + bot) / 2 / S.h * document.getElementById("holder").offsetHeight - st.clientHeight / 2;
}

document.getElementById("zin").onclick = function() {
    setZoom(ZOOM * 1.5);
};

document.getElementById("zout").onclick = function() {
    setZoom(ZOOM / 1.5);
};

document.getElementById("zfit").onclick = function() {
    setZoom(1);
};

(function pinch() {
    var st = stage(), pts = {}, base = null;
    st.addEventListener("pointerdown", function(e) {
        if (e.pointerType === "mouse") return;
        pts[e.pointerId] = e;
        var k = Object.keys(pts);
        if (k.length === 2) {
            var a = pts[k[0]], b = pts[k[1]];
            base = {
                d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                z: ZOOM
            };
        }
    });
    st.addEventListener("pointermove", function(e) {
        if (!pts[e.pointerId]) return;
        pts[e.pointerId] = e;
        var k = Object.keys(pts);
        if (k.length === 2 && base) {
            var a = pts[k[0]], b = pts[k[1]];
            var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            var r = st.getBoundingClientRect();
            setZoom(base.z * d / base.d, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
        }
    });
    var drop = function(e) {
        delete pts[e.pointerId];
        if (Object.keys(pts).length < 2) base = null;
    };
    st.addEventListener("pointerup", drop);
    st.addEventListener("pointercancel", drop);
})();

var CSEL_P = null;

var USED_C = -1;

var USED_G = null;

function nextStart() {
    if (!USED_G) return {
        i: 0,
        x: 0
    };
    if (USED_G.x >= .98) return {
        i: USED_G.line + 1,
        x: 0
    };
    return {
        i: USED_G.line,
        x: USED_G.x
    };
}

var SPLIT_MODE = false;

var HIDE_MODE = false;

function allSplits() {
    var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
    var out = [];
    for (var k in BOOK) if (k.indexOf(pre) === 0) out = out.concat(BOOK[k].splits || []);
    return out.sort(function(a, b) {
        return b[0] - a[0] || b[1] - a[1];
    });
}

function cutRuns(runs, at) {
    var a = [], b = [], n = 0;
    runs.forEach(function(r) {
        var len = r.t.length;
        if (n + len <= at) a.push(r); else if (n >= at) b.push(r); else {
            a.push({
                t: r.t.slice(0, at - n),
                b: r.b
            });
            b.push({
                t: r.t.slice(at - n),
                b: r.b
            });
        }
        n += len;
    });
    return [ {
        runs: a
    }, {
        runs: b
    } ];
}

function applySplits(list) {
    allSplits().forEach(function(sp) {
        var i = sp[0];
        if (!list[i]) return;
        var two = cutRuns(list[i].runs, sp[1]);
        if (!two[0].runs.length || !two[1].runs.length) return;
        list.splice(i, 1, two[0], two[1]);
    });
    return list;
}

function paraSig(p) {
    if (p.sig0) return p.sig0;
    return (p.runs || []).map(function(r) {
        return r.t;
    }).join("").replace(/\s+/g, "").slice(0, 24);
}

function hiddenKeys() {
    var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
    var out = [];
    for (var k in BOOK) if (k.indexOf(pre) === 0) out.push(k);
    return out;
}

function applyHidden(list) {
    var h = {};
    hiddenKeys().forEach(function(k) {
        (BOOK[k].hidden || []).forEach(function(s) {
            h[s] = 1;
        });
    });
    list.forEach(function(p) {
        p.off = !!h[paraSig(p)];
    });
    return list;
}

function buildChav(raw) {
    return applyFixes(applyHidden(applySplits(raw.slice())));
}

var FIX_MODE = false;

function runsText(runs) {
    return (runs || []).map(function(r) {
        return r.t;
    }).join("");
}

function fixKey(runs) {
    return runsText(runs).replace(/\s+/g, "");
}

function allFixes() {
    var out = {};
    hiddenKeys().forEach(function(k) {
        (BOOK[k].fixes || []).forEach(function(f) {
            out[f[0]] = f[1];
        });
    });
    return out;
}

function applyFixes(list) {
    var fx = allFixes();
    list.forEach(function(p, i) {
        var key = fixKey(p.runs), to = fx[key];
        if (!to) return;
        var q = {
            runs: to,
            off: p.off,
            orig: p.runs,
            key: key,
            sig0: paraSig(p)
        };
        list[i] = q;
    });
    return list;
}

function edRuns(el) {
    var out = [];
    var walk = function(n, b) {
        if (n.nodeType === 3) {
            var t = n.nodeValue.replace(/[\u00a0\n\r\t]/g, " ");
            if (!t) return;
            var last = out[out.length - 1];
            if (last && last.b === b) last.t += t; else out.push({
                t: t,
                b: b
            });
            return;
        }
        if (n.nodeType !== 1) return;
        if (n.tagName === "BR") {
            walk(document.createTextNode(" "), b);
            return;
        }
        var bb = b || n.tagName === "B" || n.tagName === "STRONG";
        for (var c = n.firstChild; c; c = c.nextSibling) walk(c, bb);
    };
    walk(el, false);
    out.forEach(function(r) {
        r.t = r.t.replace(/ {2,}/g, " ");
    });
    if (out.length) {
        out[0].t = out[0].t.replace(/^ +/, "");
        out[out.length - 1].t = out[out.length - 1].t.replace(/ +$/, "");
    }
    return out.filter(function(r) {
        return r.t;
    });
}
