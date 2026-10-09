function analyseSimple(m, w, h) {
    var rs = [], cs = [];
    for (var y = 0; y < h; y++) {
        var s = 0, o = y * w;
        for (var x = 0; x < w; x++) s += m[o + x];
        rs.push(s);
    }
    for (var x = 0; x < w; x++) cs.push(colSum(m, w, h, x));
    var y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
    while (y0 < h && rs[y0] <= w * .003) y0++;
    while (y1 > y0 && rs[y1] <= w * .003) y1--;
    while (x0 < w && cs[x0] <= h * .003) x0++;
    while (x1 > x0 && cs[x1] <= h * .003) x1--;
    if (y1 - y0 < 40) return null;
    var pit = pitchOf(m, w, x0, x1, y0, y1) || 30;
    var ln = linesIn(m, w, x0, x1, y0, y1, pit, false);
    if (!ln.length) return null;
    var zones = [], cur = null;
    ln.forEach(function(l) {
        if (cur && l[0] - cur.last <= pit * 1.55) {
            cur.y1 = l[1];
            cur.last = l[1];
        } else {
            cur = {
                y0: l[0],
                y1: l[1],
                last: l[1],
                k: 3,
                a: x0,
                b: x1,
                pitch: pit
            };
            zones.push(cur);
        }
    });
    zones.forEach(function(z) {
        delete z.last;
    });
    zones.forEach(function(z) {
        z.inA = z.inB = true;
    });
    return {
        w: w,
        h: h,
        sc: w / REF_W,
        bbox: [ x0, y0, x1, y1 ],
        outer: [ x0, x1 ],
        inner: [ x0, x1 ],
        core: [ x0, x1 ],
        spine: [ x0, x1 ],
        gpitch: pit,
        cpitch: pit,
        zones: zones,
        grid: [ x0, x1 ],
        simple: true
    };
}

function relines() {
    S.zones.forEach(function(z) {
        z.lines = linesIn(D.m, D.w, z.a, z.b, z.y0, z.y1, S.gpitch, !S.simple);
    });
}

var sel = 0;

function zoneName(z) {
    var i = z.inA, o = z.inB;
    return S.simple ? "פסקה" : i && o ? "הגמרא בלבד" : !i && !o ? "מורחב לשני הצדדים" : i ? "מורחב ימינה" : "מורחב שמאלה";
}

function applySides(z) {
    z.a = z.inA ? S.inner[0] : S.outer[0];
    z.b = z.inB ? S.inner[1] : S.outer[1];
}

function lineCount(z) {
    return (z.lines || []).length;
}

function draw() {
    var ov = document.getElementById("ov");
    ov.setAttribute("viewBox", "0 0 " + S.w + " " + S.h);
    var s = "";
    s += box(S.outer[0], S.bbox[1], S.outer[1], S.bbox[3], "#3B7D57", 3, "16 12");
    if (!S.simple) s += box(S.inner[0], S.bbox[1], S.inner[1], S.bbox[3], "#17468F", 2, "6 9");
    S.zones.forEach(function(z, i) {
        var on = i === sel;
        s += '<rect x="' + z.a + '" y="' + z.y0 + '" width="' + (z.b - z.a) + '" height="' + (z.y1 - z.y0) + '" fill="rgba(192,143,43,' + (on ? .16 : .04) + ')" stroke="' + (on ? "#C08F2B" : "#C9B79A") + '" stroke-width="' + (on ? 7 : 3) + '"/>';
        (z.lines || []).forEach(function(ln, j) {
            s += '<rect x="' + z.a + '" y="' + ln[0] + '" width="' + (z.b - z.a) + '" height="' + (ln[1] - ln[0]) + '" fill="' + (j % 2 ? "rgba(240,150,20," + (on ? .5 : .22) + ")" : "rgba(30,120,225," + (on ? .5 : .22) + ")") + '"/>';
        });
        if (on) s += '<text x="' + (z.a + z.b) / 2 + '" y="' + (z.y0 + S.gpitch * 1.4) + '" text-anchor="middle" font-size="' + S.gpitch * 1.5 + '" font-weight="700" fill="#8A5A00">' + (i + 1) + "</text>";
    });
    if (FLASH) s += '<rect x="' + S.bbox[0] + '" y="' + FLASH[0] + '" width="' + (S.bbox[2] - S.bbox[0]) + '" height="' + Math.max(4, FLASH[1] - FLASH[0]) + '" fill="' + FLASH[2] + '"/>';
    ov.innerHTML = s;
    panel();
}

var FLASH = null, FLASH_T = 0;

function flash(a, b, col) {
    FLASH = [ Math.min(a, b), Math.max(a, b), col ];
    clearTimeout(FLASH_T);
    FLASH_T = setTimeout(function() {
        FLASH = null;
        if (S) draw();
    }, 1e3);
}

function scrollToY(y) {
    var st = document.querySelector(".stage"), ov = document.getElementById("ov");
    if (!st || !ov) return;
    var r = ov.getBoundingClientRect();
    var at = y / S.h * r.height;
    if (at < st.scrollTop + 40 || at > st.scrollTop + st.clientHeight - 40) st.scrollTop = Math.max(0, at - st.clientHeight * .45);
}

function box(a, t, b, bt, col, w, dash) {
    return '<rect x="' + a + '" y="' + t + '" width="' + (b - a) + '" height="' + (bt - t) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-dasharray="' + dash + '"/>';
}

function panel() {
    var n = S.zones.reduce(function(a, z) {
        return a + lineCount(z);
    }, 0);
    document.getElementById("stats").innerHTML = (shown ? row("מוצג כעת", shown) : "") + row("שורות גמרא בסך הכול", n) + row("אזורים", S.zones.length) + (S.simple ? "" : row("מרווח שורה", Math.round(S.gpitch) + "px"));
    document.getElementById("zones").innerHTML = S.zones.map(function(z, i) {
        var on = i === sel;
        var pct = function(v) {
            return Math.round(v / S.h * 100);
        };
        return '<div class="zone' + (on ? " on" : "") + '" data-i="' + i + '">' + '<div class="t">' + (i + 1) + ". " + zoneName(z) + '<span class="n">' + lineCount(z) + " שורות</span></div>" + '<div class="d">מ-' + pct(z.y0) + "% עד " + pct(z.y1) + "% מגובה הדף</div>" + (on ? ctrls(i) : "") + "</div>";
    }).join("") || '<div class="hint">לא נמצאו אזורים.</div>';
    [].forEach.call(document.querySelectorAll(".zone"), function(el) {
        el.onclick = function(e) {
            if (e.target.closest("[data-act]")) return;
            sel = +el.dataset.i;
            draw();
            scrollToZone();
        };
    });
    [].forEach.call(document.querySelectorAll("[data-act]"), function(b) {
        b.onclick = function(e) {
            e.stopPropagation();
            act(b.dataset.act, +b.dataset.i);
        };
    });
}

function ctrls(i) {
    var z = S.zones[i];
    var t = function(a, lbl, hot) {
        return '<button class="c' + (hot ? " hot" : "") + '" data-act="' + a + '" data-i="' + i + '">' + lbl + "</button>";
    };
    var side = function(a, lbl, on) {
        return '<button class="c' + (on ? " hot" : "") + '" data-act="' + a + '" data-i="' + i + '">' + lbl + "</button>";
    };
    return '<div class="ctl">' + (S.simple ? "" : '<div class="cg"><span>טורים</span>' + side("rtog", "ימין", !z.inB) + '<button class="c hot fix" disabled>מרכז</button>' + side("ltog", "שמאל", !z.inA) + "</div>") + '<div class="cg"><span>שורות למעלה</span>' + t("down", "− הסרה") + t("up", "＋ הוספה") + "</div>" + '<div class="cg"><span>שורות למטה</span>' + t("bup", "− הסרה") + t("bdown", "＋ הוספה") + "</div>" + '<div class="cg"><span></span>' + t("split", "פיצול") + t("del", "מחיקה") + "</div>" + '<div class="cg"><span>אזור חסר</span>' + t("add", "＋ מתחת") + "</div>" + "</div>";
}

function row(k, v) {
    return '<div class="stat"><span>' + k + "</span><b>" + v + "</b></div>";
}

function stepLine(y, dir, z, edge) {
    var k = edge === "end" ? 1 : 0;
    var best = null;
    allLines(z).forEach(function(l) {
        var v = l[k];
        if (dir < 0 && v < y - 2 && (best === null || v > best)) best = v;
        if (dir > 0 && v > y + 2 && (best === null || v < best)) best = v;
    });
    return best === null ? null : best;
}

function allLines(z) {
    return linesIn(D.m, D.w, z.a, z.b, S.bbox[1], S.bbox[3], S.gpitch, !S.simple);
}

var FL_IN = "rgba(59,125,87,.42)";

var FL_OUT = "rgba(214,84,61,.42)";

function act(a, i) {
    var z = S.zones[i], prev = S.zones[i - 1], next = S.zones[i + 1];
    if (a === "rtog") {
        z.inB = !z.inB;
        applySides(z);
    }
    if (a === "ltog") {
        z.inA = !z.inA;
        applySides(z);
    }
    if (a === "up" || a === "down") {
        var y = stepLine(z.y0, a === "up" ? -1 : 1, z, "start");
        if (y === null) return;
        y = Math.max(S.bbox[1], Math.min(z.y1 - S.gpitch, y));
        flash(z.y0, y, a === "up" ? FL_IN : FL_OUT);
        z.y0 = y;
        if (prev) prev.y1 = y - 1;
        scrollToY(y);
    }
    if (a === "bup" || a === "bdown") {
        var inside = allLines(z).filter(function(l) {
            return l[1] <= z.y1 + 2;
        });
        var after = allLines(z).filter(function(l) {
            return l[1] > z.y1 + 2;
        });
        var y2 = a === "bup" ? inside.length > 1 ? inside[inside.length - 2][1] : null : after.length ? after[0][1] : null;
        if (y2 === null) return;
        y2 = Math.max(z.y0 + S.gpitch, Math.min(S.bbox[3], y2));
        flash(z.y1, y2, a === "bdown" ? FL_IN : FL_OUT);
        z.y1 = y2;
        if (next) next.y0 = y2 + 1;
        scrollToY(y2);
    }
    if (a === "split") {
        if (z.y1 - z.y0 < S.gpitch * 2) return;
        var mid = stepLine(z.y0 + z.y1 >> 1, 1, z, "start");
        if (mid === null) return;
        S.zones.splice(i + 1, 0, {
            y0: mid,
            y1: z.y1,
            inA: z.inA,
            inB: z.inB,
            a: z.a,
            b: z.b
        });
        z.y1 = mid - 1;
    }
    if (a === "add") {
        var top = z.y1 + 1;
        var bot = next ? next.y0 - 1 : S.bbox[3];
        if (bot - top < S.gpitch) return;
        S.zones.splice(i + 1, 0, {
            y0: top,
            y1: bot,
            k: z.k,
            inA: z.inA,
            inB: z.inB,
            a: z.a,
            b: z.b,
            pitch: z.pitch || S.gpitch
        });
        sel = i + 1;
    }
    if (a === "del") {
        if (S.zones.length < 2) return;
        S.zones.splice(i, 1);
        if (prev && next) prev.y1 = next.y0 - 1;
        sel = Math.max(0, i - 1);
    }
    relines();
    draw();
    touched();
}

function scrollToZone() {
    var z = S.zones[sel];
    if (!z) return;
    var st = document.querySelector(".stage"), ov = document.getElementById("ov");
    var r = ov.getBoundingClientRect();
    st.scrollTop = Math.max(0, z.y0 / S.h * r.height - st.clientHeight * .3);
}

document.getElementById("reset").onclick = function() {
    if (!D) return;
    if (BOOK[PKEY] && BOOK[PKEY].cal && !confirm("לזרוק את הכיול הידני של העמוד הזה ולזהות מחדש?")) return;
    FRESH = true;
    run();
};

document.getElementById("save").onclick = function() {
    keepPageState();
    var mas = selVal("mas") || "file", daf = selVal("daf") || "";
    var out = {
        masechet: mas,
        daf: daf,
        savedAt: (new Date).toISOString(),
        pages: BOOK
    };
    var n = 0;
    for (var k in BOOK) n += (BOOK[k].steps || []).length;
    var pages = Object.keys(BOOK).length;
    var blob = new Blob([ JSON.stringify(out, null, 1) ], {
        type: "application/json"
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ("daf-" + mas + "-" + daf).replace(/["'\u05f3\u05f4\s]/g, "") + ".json";
    a.click();
    say("נשמר · " + n + " קטעים ב-" + pages + " עמודים · " + a.download);
};

var TARGET_W = 2e3;

var PDF = null;

function pdfReady() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise(function(ok) {
        window.addEventListener("pdfjs-ready", function() {
            ok();
        }, {
            once: true
        });
    });
}

function openPdf(file) {
    say("טוען את הקובץ…");
    return pdfReady().then(function() {
        return file.arrayBuffer();
    }).then(function(buf) {
        return renderDoc(buf);
    });
}

function openPdfBytes(buf) {
    say("פותח את הקובץ…");
    return pdfReady().then(function() {
        return renderDoc(buf.slice(0));
    });
}

function renderDoc(buf) {
    return Promise.resolve().then(function() {
        return pdfjsLib.getDocument({
            data: buf
        }).promise;
    }).then(function(doc) {
        PDF = doc;
        var pages = [];
        for (var i = 1; i <= doc.numPages; i++) {
            pages.push([ i, doc.numPages === 2 ? "צורת הדף · עמוד " + (i === 1 ? "א׳" : "ב׳") : "עמוד " + i ]);
        }
        fillSel(document.getElementById("pg"), pages);
        document.getElementById("pg").style.display = "";
        var at = WANT_LAST ? pages.length : 1;
        WANT_LAST = false;
        document.getElementById("pg").value = at - 1;
        return showPdfPage(at);
    }).catch(function() {
        say("לא הצלחתי לפתוח את הקובץ.", 1);
    });
}

function showPdfPage(n) {
    if (!PDF) return Promise.resolve();
    say("מצייר עמוד " + n + "…");
    return PDF.getPage(n).then(function(pg) {
        var base = pg.getViewport({
            scale: 1
        });
        var vp = pg.getViewport({
            scale: TARGET_W / base.width
        });
        var c = document.createElement("canvas");
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        return pg.render({
            canvasContext: c.getContext("2d", {
                willReadFrequently: true
            }),
            viewport: vp
        }).promise.then(function() {
            return c;
        });
    }).then(useCanvas);
}

function chavItems(pg) {
    return pg.getTextContent().then(function(tc) {
        return tc.items.filter(function(it) {
            return it.str.trim() !== "";
        });
    });
}

function bodyHeight(items) {
    var hist = {};
    items.forEach(function(it) {
        var h = Math.round(it.height * 20) / 20;
        hist[h] = (hist[h] || 0) + it.str.length;
    });
    var best = 0, n = -1;
    for (var h in hist) if (hist[h] > n) {
        n = hist[h];
        best = +h;
    }
    return best;
}

function chavBuild(items, body) {
    var lim = body * 1.1, paras = [], cur = null, lastY = null, prev = null;
    items.forEach(function(it) {
        var y = Math.round(it.transform[5]);
        var x = it.transform[4];
        var bold = it.height >= lim;
        var newPara = lastY === null || lastY - y > 26 || y > lastY + 8;
        if (newPara) {
            cur = {
                runs: []
            };
            paras.push(cur);
            prev = null;
        }
        var gap = "";
        if (prev) {
            if (y !== prev.y) gap = " "; else if (prev.x - (x + it.width) > it.height * .15) gap = " ";
        }
        prev = {
            x: x,
            y: y
        };
        lastY = y;
        var last = cur.runs[cur.runs.length - 1];
        if (last && last.b === bold) last.t += gap + it.str; else {
            if (last && gap) last.t += gap;
            cur.runs.push({
                t: it.str,
                b: bold
            });
        }
    });
    return paras.filter(function(p) {
        return p.runs.map(function(r) {
            return r.t;
        }).join("").trim().length > 1;
    });
}
