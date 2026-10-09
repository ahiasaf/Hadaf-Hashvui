var CHV_KEY = "df:chv";

function chavStore(id, paras) {
    var o;
    try {
        o = JSON.parse(localStorage.getItem(CHV_KEY) || "{}");
    } catch (e) {
        o = {};
    }
    o[id] = {
        at: Date.now(),
        p: paras
    };
    var ids = Object.keys(o).sort(function(a, b) {
        return o[b].at - o[a].at;
    });
    var keep = {};
    ids.slice(0, 3).forEach(function(k) {
        keep[k] = o[k];
    });
    try {
        localStorage.setItem(CHV_KEY, JSON.stringify(keep));
    } catch (e) {
        var one = {};
        one[id] = keep[id];
        try {
            localStorage.setItem(CHV_KEY, JSON.stringify(one));
        } catch (e2) {
            try {
                localStorage.removeItem(CHV_KEY);
            } catch (e3) {}
        }
    }
}

function chavLoad(id) {
    try {
        var o = JSON.parse(localStorage.getItem(CHV_KEY) || "{}");
        return o[id] && o[id].p && o[id].p.length ? o[id].p : null;
    } catch (e) {
        return null;
    }
}

function chavHtml(paras) {
    var n = 0;
    return paras.map(function(p, i) {
        var html = p.runs.map(function(r) {
            var t = esc(r.t);
            return r.b ? "<b>" + t + "</b>" : t;
        }).join("");
        return '<p class="cp' + (p.off ? " off" : "") + (p.orig ? " fixed" : "") + '" data-p="' + i + '">' + html + "</p>";
    }).join("");
}

function useCanvas(c) {
    var px = c.getContext("2d", {
        willReadFrequently: true
    }).getImageData(0, 0, c.width, c.height).data;
    D = {
        m: ink(px, c.width, c.height),
        w: c.width,
        h: c.height
    };
    document.getElementById("page").src = c.toDataURL("image/webp", .85);
    run();
}

function say(t, bad) {
    var el = document.getElementById("stat");
    el.className = bad ? "bad" : "";
    el.innerHTML = t;
    document.getElementById("msg").innerHTML = "";
    sayFull(bad);
}

var TOAST_T = null;

function sayFull(bad, force) {
    var el = document.getElementById("stat"), tb = document.getElementById("toast");
    if (!el || !tb) return;
    if (!el.textContent) {
        tb.className = "";
        return;
    }
    var marking = document.body.classList.contains("mark");
    if (!marking && !force && el.scrollWidth <= el.clientWidth + 1) {
        tb.className = "";
        return;
    }
    tb.innerHTML = el.innerHTML;
    tb.className = "on" + (bad || el.className === "bad" ? " bad" : "");
    if (marking) {
        var br = document.querySelector("body.mark.splt #sbar") || document.querySelector("body.mark.insp #ibar") || document.querySelector(".bar:not(.ibar)");
        tb.style.top = "";
        tb.style.bottom = (br ? br.getBoundingClientRect().height : 60) + 8 + "px";
    } else {
        var hd = document.querySelector("header");
        tb.style.bottom = "";
        tb.style.top = (hd ? hd.getBoundingClientRect().bottom : 60) + 6 + "px";
    }
    clearTimeout(TOAST_T);
    TOAST_T = setTimeout(function() {
        tb.className = "";
    }, bad ? 8e3 : 4500);
}

document.getElementById("file").onchange = function(e) {
    var f = e.target.files[0];
    if (!f) return;
    [ "mas", "daf", "src" ].forEach(function(id) {
        document.getElementById(id).style.display = "none";
    });
    if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) return openPdf(f);
    PDF = null;
    var img = new Image;
    img.onload = function() {
        IMG = img;
        load(img);
    };
    img.src = URL.createObjectURL(f);
};

var MAS = [ [ "taanit", "תענית" ], [ "megila", "מגילה" ] ];

var CAL = {};

var API = "";

var SCRIPT_MIN_STUDIO = 4;

function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fillSel(el, items) {
    el._items = items;
    el.innerHTML = items.map(function(v, i) {
        return '<option value="' + i + '">' + esc(v[1]) + "</option>";
    }).join("");
    el.disabled = items.length < 2;
}

function selVal(id) {
    var el = document.getElementById(id);
    var it = el._items && el._items[+el.value];
    return it ? it[0] : "";
}

function dafKey(d) {
    return String(d).replace(/["'\u05f3\u05f4\s]/g, "");
}

function fileId(url) {
    var m = /\/d\/([-\w]{20,})/.exec(url || "");
    return m ? m[1] : null;
}

function curDaf() {
    var m = selVal("mas");
    var d = selVal("daf");
    var links = (window.DAF_LINKS || {})[m] || {};
    return {
        mas: m,
        daf: d,
        links: links[dafKey(d)] || []
    };
}

function onMas() {
    var m = selVal("mas");
    var cal = CAL[m] || [];
    var links = (window.DAF_LINKS || {})[m] || {};
    var opts = [], seen = {};
    cal.forEach(function(row, i) {
        var d = row[2];
        if (!d || d === "סיום" || !links[dafKey(d)] || seen[dafKey(d)]) return;
        seen[dafKey(d)] = 1;
        opts.push([ d, "דף " + d + " · שבוע " + (i + 1) + " · " + row[1] ]);
    });
    if (!opts.length) {
        say("אין קישורי דפים למסכת הזו.", 1);
        return;
    }
    fillSel(document.getElementById("daf"), opts);
    onDaf();
}

var DAF_LIB = null;

var LIB_READY = fetch("daf/index.json").then(function(r) {
    return r.ok ? r.json() : null;
}).catch(function() {
    return null;
}).then(function(j) {
    window.DAF_LIB = j || {};
});

function onDaf() {
    var c = curDaf();
    var opts = [];
    if (fileId(c.links[0])) opts.push([ "0", "צורת הדף" ]);
    if (fileId(c.links[1])) opts.push([ "1", "חברותא" ]);
    fillSel(document.getElementById("src"), opts);
    onSrc();
    if (typeof setHideMode === "function") setHideMode(false);
    if (MODE === "mark") {
        loadChav();
        loadFromSheet().then(afterSheet);
    }
}

function backfillChav() {
    if (!STEPS.length) return 0;
    if (!CHV) return 0;
    var n = 0, miss = 0, noPar = 0, mismatch = 0;
    STEPS.forEach(function(st) {
        var c = st.c;
        if (!c || c.from == null) return;
        if (c.h) return;
        miss++;
        var got = [];
        for (var i = c.from; i <= c.to && i < CHV.length; i++) got.push(CHV[i]);
        if (!got.length) {
            noPar++;
            return;
        }
        var plain = got.map(function(p) {
            return p.runs.map(function(r) {
                return r.t;
            }).join("");
        }).join(" ");
        if (bareTxt(plain) !== bareTxt(c.text || "")) {
            mismatch++;
            return;
        }
        c.h = got.map(function(p) {
            return "<p>" + p.runs.map(function(r) {
                return r.b ? "<b>" + esc(r.t) + "</b>" : esc(r.t);
            }).join("") + "</p>";
        }).join("");
        n++;
    });
    if (n) touched();
    markPanel();
    if (!miss) return 0;
    if (n && !(noPar + mismatch)) {
        say("הושלמו הדגשות ל-" + n + " קטעים. שמרו כדי לקבע.");
        return n;
    }
    var m = [];
    if (n) m.push("הושלמו " + n);
    if (mismatch) m.push(mismatch + " לא תואמים לקובץ החברותא");
    if (noPar) m.push(noPar + " בלי פסקאות");
    say(miss + " קטעים בעמוד בלי ביאור שמור - " + m.join(" · ") + (n ? ". שמרו כדי לקבע." : "."), !n);
    return n;
}

function bareTxt(t) {
    return String(t || "").replace(/\s+/g, "");
}

function afterSheet(n) {
    if (!n) return;
    PKEY = "";
    loadPageState();
    paintChav();
    markDraw();
    backfillChav();
    say("נטענו סימונים קודמים מ-" + n + " עמודים");
}

function libImg(daf, pg) {
    var mas = selVal("mas");
    var m = window.DAF_LIB && DAF_LIB[mas];
    var a = m && m[dafKey(daf)];
    if (!a || a.indexOf(pg === 2 ? "b" : "a") < 0) return null;
    return "daf/" + mas + "/" + dafKey(daf) + "-" + (pg === 2 ? "b" : "a") + ".webp?v=" + (window.DAF_REV || "");
}

var AMUD_FOR = "";

function fillAmud() {
    var c = curDaf(), mas = selVal("mas"), key = mas + "|" + dafKey(c.daf);
    var m = window.DAF_LIB && DAF_LIB[mas];
    var a = m && m[dafKey(c.daf)];
    if (!a || !a.length) return;
    var el = document.getElementById("pg");
    if (key === AMUD_FOR && el.options.length) return;
    AMUD_FOR = key;
    var opts = [];
    if (a.indexOf("a") >= 0) opts.push([ "1", "ע״א" ]);
    if (a.indexOf("b") >= 0) opts.push([ "2", "ע״ב" ]);
    fillSel(el, opts);
    el.value = WANT_LAST ? opts.length - 1 : 0;
    WANT_LAST = false;
    el.style.display = "";
}

function loadFromLib() {
    var c = curDaf();
    if (+selVal("src") !== 0) return false;
    if (!window.DAF_LIB) return null;
    fillAmud();
    var pg = +selVal("pg") || 1;
    var src = libImg(c.daf, pg);
    if (!src) return false;
    PDF = null;
    var im = new Image;
    im.onload = function() {
        IMG = im;
        load(im);
    };
    im.onerror = function() {
        fetchDaf(fileId(c.links[0]), "צורת הדף");
    };
    im.src = src;
    say("מהמאגר · דף " + c.daf + " · " + (pg === 2 ? "ע״ב" : "ע״א"));
    return true;
}

function onSrc() {
    var r = loadFromLib();
    if (r === true) return;
    if (r === null) {
        LIB_READY.then(onSrc);
        return;
    }
    var c = curDaf();
    var si = +selVal("src");
    var id = fileId(c.links[si]);
    if (!id) {
        say("אין קובץ לדף הזה.", 1);
        return;
    }
    var mas = document.getElementById("mas");
    fetchDaf(id, mas.options[mas.selectedIndex].text + " · דף " + c.daf + " · " + (si ? "חברותא" : "צורת הדף"));
}

function onPage() {
    var r = loadFromLib();
    if (r === true) return;
    if (r === null) {
        LIB_READY.then(onPage);
        return;
    }
    if (PDF) return showPdfPage(+selVal("pg"));
}

var CACHE = {};

var NAMES = {};

var reqId = 0;

var shown = "";

var shownFile = "";

function fetchDaf(id, label) {
    var mine = ++reqId;
    var done = function(buf) {
        if (mine !== reqId) return;
        shown = label || "";
        shownFile = NAMES[id] || "";
        openPdfBytes(buf);
    };
    if (CACHE[id]) return done(CACHE[id]);
    if (!API) {
        say("אין כתובת שרת. הגדירו אותה ב-/admin ← הגדרות.", 1);
        return;
    }
    say("מביא מהדרייב: " + (label || "") + "…");
    var url = API + (API.indexOf("?") < 0 ? "?" : "&") + "file=" + encodeURIComponent(id);
    fetch(url).then(function(r) {
        return r.json();
    }).catch(function() {
        return jsonp(url);
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.data) throw new Error(d && d.message || "no data");
        var bin = atob(d.data), buf = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        CACHE[id] = buf;
        if (d.name) NAMES[id] = String(d.name).replace(/\.pdf$/i, "");
        done(buf);
    }).catch(function() {
        if (mine !== reqId) return;
        say("לא הצלחתי להביא את הקובץ. ודאו שהסקריפט פרוס בגרסה " + SCRIPT_MIN_STUDIO + " ומעלה.", 1);
    });
}

function jsonp(url) {
    return new Promise(function(ok, fail) {
        var n = "__daf" + Date.now(), sc = document.createElement("script");
        var done = function(v) {
            try {
                delete window[n];
            } catch (e) {
                window[n] = undefined;
            }
            clearTimeout(t);
            sc.remove();
            v ? ok(v) : fail(new Error("timeout"));
        };
        var t = setTimeout(function() {
            done(null);
        }, 6e4);
        window[n] = done;
        sc.onerror = function() {
            done(null);
        };
        sc.src = url + "&callback=" + n;
        document.body.appendChild(sc);
    });
}

var STUDIO_VER = "9.0.0";

window.addEventListener("DOMContentLoaded", function() {
    document.getElementById("ver").textContent = "v" + STUDIO_VER;
    loadLocal();
    CAL = {
        taanit: window.CAL_TAANIT || [],
        megila: window.CAL_MEGILA || []
    };
    API = (window.APPS_SCRIPT_URL || "").trim();
    try {
        var cfg = JSON.parse(localStorage.getItem("df:cfg") || "{}");
        if (cfg.api) API = cfg.api;
    } catch (e) {}
    if (!window.DAF_LINKS || !CAL.taanit.length) {
        [ "mas", "daf", "src", "pg" ].forEach(function(id) {
            document.getElementById(id).style.display = "none";
        });
        say("פתחו קובץ PDF של דף.");
        return;
    }
    fillSel(document.getElementById("mas"), MAS);
    [ "mas", "daf", "src", "pg" ].forEach(function(id, i) {
        document.getElementById(id).onchange = [ onMas, onDaf, onSrc, onPage ][i];
    });
    onMas();
});

function load(img) {
    var c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d", {
        willReadFrequently: true
    }).drawImage(img, 0, 0);
    useCanvas(c);
}

function run() {
    var t = performance.now();
    keepPageState();
    loadPageState();
    if (FRESH) {
        FRESH = false;
        if (BOOK[PKEY]) {
            delete BOOK[PKEY].cal;
            delete BOOK[PKEY].zones;
        }
    }
    var back = restoreCal();
    if (!back) {
        S = analyse(D.m, D.w, D.h) || analyseSimple(D.m, D.w, D.h);
        if (!S) {
            say("לא זיהיתי טקסט בעמוד הזה.", 1);
            return;
        }
        relines();
    }
    sel = 0;
    if (MODE === "mark") {
        paintChav();
        markDraw();
    } else draw();
    say((shown ? shown + " · " : "") + (shownFile ? "«" + shownFile + "» · " : "") + "זוהה ב-" + Math.round(performance.now() - t) + "ms");
}
