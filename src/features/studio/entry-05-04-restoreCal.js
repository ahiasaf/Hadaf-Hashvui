function restoreCal() {
    var rec = BOOK[PKEY];
    if (!rec || !rec.cal || !rec.zones || !rec.zones.length) return false;
    var w = D.w, h = D.h, c = rec.cal;
    S = {
        w: w,
        h: h,
        sc: w / REF_W,
        simple: !!c.simple,
        bbox: (c.bbox || [ 0, 0, 1, 1 ]).map(function(v, i) {
            return v * (i % 2 ? h : w);
        }),
        gpitch: (c.gpitch || 0) * h,
        cpitch: (c.cpitch || 0) * h,
        core: [ rec.core[0] * w, rec.core[1] * w ],
        spine: (c.spine || []).map(function(v) {
            return v * w;
        }),
        grid: (c.grid || []).map(function(v) {
            return v * w;
        }),
        zones: rec.zones.map(function(z) {
            return {
                y0: z.y0 * h,
                y1: z.y1 * h,
                a: z.a * w,
                b: z.b * w,
                inA: !!z.inA,
                inB: !!z.inB,
                pitch: (c.gpitch || 0) * h,
                lines: (z.lines || []).map(function(l) {
                    return [ l[0] * h, l[1] * h ];
                })
            };
        })
    };
    S.outer = S.inner = S.core;
    return true;
}

var MODE = "cal";

var FRESH = false;

var CHV = null;

var STEPS = [];

var BOOK = {};

var PKEY = "";

var GONE = {};

function pageKey() {
    if (PDF && !LIB_OK()) return "file|" + (selVal("pg") || 1);
    return [ selVal("mas"), selVal("daf"), selVal("src"), selVal("pg") || 1 ].join("|");
}

function LIB_OK() {
    return !!(window.DAF_LINKS && document.getElementById("mas").options.length);
}

function lastChav() {
    for (var j = STEPS.length - 1; j >= 0; j--) if (!STEPS[j].cont) return STEPS[j].c.to;
    var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
    var pg = +selVal("pg") || 1, best = -1;
    for (var k in BOOK) {
        if (k.indexOf(pre) !== 0) continue;
        if ((+k.slice(pre.length) || 1) >= pg) continue;
        var st = BOOK[k].steps || [];
        for (var i = 0; i < st.length; i++) if (!st[i].cont) best = Math.max(best, st[i].c.to);
    }
    return best;
}

function loadPageState() {
    var k = pageKey();
    if (k === PKEY) return;
    PKEY = k;
    var rec = BOOK[k];
    STEPS = rec ? rec.steps : [];
    CONT_FIXED = false;
    seal();
    if (CONT_FIXED && rec) {
        touched();
        say("קטע ההמשך בראש העמוד תוקן - צריך לשמור בגיליון.");
    }
    GSEL = null;
    CSEL_P = null;
    INSP = -1;
    INSP_LINE = -1;
    SPL = null;
    document.body.classList.remove("insp");
    document.body.classList.remove("splt");
}

function keyLabel(k) {
    var a = String(k).split("|");
    var mas = (MAS.filter(function(m) {
        return m[0] === a[0];
    })[0] || [])[1] || a[0];
    var pg = +a[3] || 1;
    if (a.length < 4) return k;
    return mas + " · דף " + a[1] + " · " + (a[2] === "1" ? "חברותא" : "צורת הדף") + " · " + (pg === 1 ? "ע״א" : pg === 2 ? "ע״ב" : "עמוד " + pg);
}

function keepPageState() {
    if (!PKEY || !S) return;
    var was = BOOK[PKEY] || {};
    BOOK[PKEY] = {
        w: S.w,
        h: S.h,
        label: keyLabel(PKEY),
        core: [ S.core[0] / S.w, S.core[1] / S.w ],
        zones: S.zones.map(function(z) {
            return {
                y0: z.y0 / S.h,
                y1: z.y1 / S.h,
                a: z.a / S.w,
                b: z.b / S.w,
                inA: !!z.inA,
                inB: !!z.inB,
                lines: (z.lines || []).map(function(l) {
                    return [ l[0] / S.h, l[1] / S.h ];
                })
            };
        }),
        cal: {
            bbox: S.bbox.map(function(v, i) {
                return v / (i % 2 ? S.h : S.w);
            }),
            gpitch: S.gpitch / S.h,
            cpitch: S.cpitch / S.h,
            spine: (S.spine || []).map(function(v) {
                return v / S.w;
            }),
            grid: (S.grid || []).map(function(v) {
                return v / S.w;
            }),
            simple: !!S.simple
        },
        steps: STEPS
    };
    if (!STEPS.length && was.steps && was.steps.length) {
        BOOK[PKEY].steps = was.steps;
        STEPS = was.steps;
    }
    if (was.splits && was.splits.length) BOOK[PKEY].splits = was.splits;
    if (was.hidden && was.hidden.length) BOOK[PKEY].hidden = was.hidden;
    if (was.fixes && was.fixes.length) BOOK[PKEY].fixes = was.fixes;
    if (was.prev) {
        BOOK[PKEY].prev = was.prev;
        BOOK[PKEY].prevDaf = was.prevDaf;
    }
    if (was.t) BOOK[PKEY].t = was.t;
    SEEN[PKEY] = 1;
}

var GSEL = null;

function flatLines() {
    var out = [];
    (S ? S.zones : []).forEach(function(z) {
        (z.lines || []).forEach(function(l) {
            out.push({
                t: l[0],
                b: l[1],
                a: z.a,
                x2: z.b
            });
        });
    });
    return out.sort(function(p, q) {
        return p.t - q.t;
    });
}

function selShapes(sel) {
    var ls = flatLines(), out = [];
    if (!sel) return out;
    var i0 = Math.min(sel.a.i, sel.b.i), i1 = Math.max(sel.a.i, sel.b.i);
    var xa = sel.a.i <= sel.b.i ? sel.a.x : sel.b.x;
    var xb = sel.a.i <= sel.b.i ? sel.b.x : sel.a.x;
    for (var i = i0; i <= i1 && i < ls.length; i++) {
        var l = ls[i], w = l.x2 - l.a;
        var from = i === i0 ? l.x2 - w * xa : l.x2;
        var to = i === i1 ? l.x2 - w * xb : l.a;
        out.push([ Math.min(from, to), l.t, Math.abs(to - from), l.b - l.t ]);
    }
    return out;
}

function markDraw() {
    if (!S) {
        markPanel();
        return;
    }
    var ov = document.getElementById("ov");
    ov.setAttribute("viewBox", "0 0 " + S.w + " " + S.h);
    var s = "";
    var ls = flatLines();
    ls.forEach(function(l, i) {
        s += '<rect class="ml" data-i="' + i + '" x="' + l.a + '" y="' + l.t + '" width="' + (l.x2 - l.a) + '" height="' + (l.b - l.t) + '" fill="rgba(30,120,225,.07)" style="cursor:pointer"/>';
    });
    STEPS.forEach(function(st, k) {
        var sh = selShapes({
            a: {
                i: st.g.from.line,
                x: st.g.from.x
            },
            b: {
                i: st.g.to.line,
                x: st.g.to.x
            }
        });
        if (!sh.length) return;
        var top = sh[0][1], bot = sh[sh.length - 1][1] + sh[sh.length - 1][3];
        var li = ls[Math.min(st.g.from.line, st.g.to.line)];
        var x = li ? li.x2 : sh[0][0] + sh[0][2];
        var w = Math.max(6, Math.round(S.w * .006));
        s += '<rect x="' + (x + w * .7) + '" y="' + top + '" width="' + w + '" height="' + (bot - top) + '" rx="' + w / 2 + '" fill="' + (k % 2 ? "#7FA6D9" : "#17468F") + '" opacity=".85" pointer-events="none"/>';
    });
    var selFill = INSP >= 0 && !SPL ? "rgba(30,120,225,.34)" : "rgba(240,150,20,.45)";
    var selLine = INSP >= 0 && !SPL ? "#17468F" : "#C08F2B";
    if (SPL) selShapes({
        a: {
            i: SPL.st.g.from.line,
            x: SPL.st.g.from.x
        },
        b: {
            i: SPL.st.g.to.line,
            x: SPL.st.g.to.x
        }
    }).forEach(function(r) {
        s += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" fill="rgba(30,120,225,.22)" stroke="#17468F" stroke-width="1.5"' + ' pointer-events="none"/>';
    });
    selShapes(GSEL).forEach(function(r) {
        s += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" fill="' + selFill + '" stroke="' + selLine + '" stroke-width="2"' + ' pointer-events="none"/>';
    });
    if (GSEL) {
        var sh = selShapes(GSEL);
        if (sh.length) {
            if (!SPL) s += hand(sh[0][0] + sh[0][2], sh[0][1], sh[0][3], "a");
            var last = sh[sh.length - 1];
            s += hand(last[0], last[1], last[3], "b");
        }
    }
    var ls2 = flatLines();
    if (!GSEL && USED_G) {
        var st2 = nextStart(), nx = ls2[st2.i];
        if (nx) {
            var w2 = nx.x2 - nx.a, from = nx.x2 - w2 * st2.x;
            s += '<rect x="' + nx.a + '" y="' + nx.t + '" width="' + (from - nx.a) + '" height="' + (nx.b - nx.t) + '" fill="rgba(59,125,87,.30)"' + ' stroke="#3B7D57" stroke-width="1.5" pointer-events="none"/>';
        }
    }
    ov.innerHTML = s;
    [].forEach.call(ov.querySelectorAll(".ml"), function(el) {
        var t = null;
        el.onpointerdown = function() {
            t = setTimeout(function() {
                t = null;
                pickLine(+el.dataset.i, true);
            }, 550);
        };
        el.onpointerup = function(ev) {
            if (t) {
                clearTimeout(t);
                t = null;
                pickLine(+el.dataset.i, false, tapFrac(ev, +el.dataset.i));
            }
        };
        el.onpointercancel = function() {
            if (t) clearTimeout(t);
            t = null;
        };
    });
    bindMarkHandles();
    markPanel();
    seeGem();
}

function hand(x, y, h, which) {
    return '<g class="mh" data-e="' + which + '" style="cursor:ew-resize">' + '<rect x="' + (x - 26) + '" y="' + (y - 6) + '" width="52" height="' + (h + 12) + '" fill="rgba(0,0,0,0)"/>' + '<rect x="' + (x - 3) + '" y="' + (y - 4) + '" width="6" height="' + (h + 8) + '" fill="#C08F2B" rx="3"/></g>';
}

var INSP = -1;

var INSP_LINE = -1;

function stepAt(i) {
    var found = -1;
    for (var k = 0; k < STEPS.length; k++) {
        var g = STEPS[k].g;
        var a = Math.min(g.from.line, g.to.line), z = Math.max(g.from.line, g.to.line);
        if (i >= a && i <= z) found = k;
    }
    return found;
}

function stepAtPara(i) {
    var pg1 = (+selVal("pg") || 1) === 1;
    for (var k = 0; k < STEPS.length; k++) {
        var c = STEPS[k].c;
        if (!c || c.from == null) continue;
        if (STEPS[k].cont && pg1) continue;
        if (i >= c.from && i <= (c.to == null ? c.from : c.to)) return k;
    }
    return -1;
}

function inspect(k, line) {
    var st = STEPS[k];
    if (!st) return;
    INSP = k;
    INSP_LINE = line == null ? st.g.from.line : line;
    GSEL = {
        a: {
            i: st.g.from.line,
            x: st.g.from.x
        },
        b: {
            i: st.g.to.line,
            x: st.g.to.x
        }
    };
    CSEL_P = st.c && st.c.from != null && !(st.cont && (+selVal("pg") || 1) === 1) ? {
        a: st.c.from,
        b: st.c.to == null ? st.c.from : st.c.to
    } : null;
    document.body.classList.add("insp");
    markDraw();
    paintChav(1);
    markPanel();
}

function inspEnd() {
    INSP = -1;
    INSP_LINE = -1;
    GSEL = null;
    CSEL_P = null;
    SPL = null;
    document.body.classList.remove("insp");
    document.body.classList.remove("splt");
    markDraw();
    paintChav();
    markPanel();
}

function inspSave() {
    if (INSP < 0 || !STEPS[INSP] || !GSEL) return;
    var st = STEPS[INSP];
    var f = GSEL.a.i <= GSEL.b.i ? GSEL.a : GSEL.b;
    var t = GSEL.a.i <= GSEL.b.i ? GSEL.b : GSEL.a;
    var prev = STEPS[INSP - 1];
    if (prev && (prev.g.to.line !== f.i || Math.abs(prev.g.to.x - f.x) > 1e-6)) prev.g.to = {
        line: f.i,
        x: f.x
    };
    st.g = {
        from: {
            line: f.i,
            x: f.x
        },
        to: {
            line: t.i,
            x: t.x
        }
    };
    if (CSEL_P) {
        st.c = st.c || {};
        st.c.from = Math.min(CSEL_P.a, CSEL_P.b);
        st.c.to = Math.max(CSEL_P.a, CSEL_P.b);
        var r = chavRange(st.c.from, st.c.to);
        if (r) {
            st.c.text = r.text;
            st.c.h = r.h;
        }
    }
    seal();
    touched();
    say("הקטע עודכן.");
    inspEnd();
}
