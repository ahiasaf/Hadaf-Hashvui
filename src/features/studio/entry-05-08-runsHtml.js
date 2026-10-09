function runsHtml(runs) {
    return runs.map(function(r) {
        var t = esc(r.t);
        return r.b ? "<b>" + t + "</b>" : t;
    }).join("");
}

function fixOff(quiet) {
    FIX_MODE = false;
    document.body.classList.remove("fixing");
    document.getElementById("splitbox").className = "splitbox";
    document.getElementById("fixpara").textContent = "✎ תיקון טקסט בחברותא";
    if (!quiet) say("חזרה לסימון.");
}

function fixSheet(i) {
    var p = CHV[i];
    if (!p) return;
    var box = document.getElementById("splitbox");
    box.innerHTML = '<div class="sh"><b>תיקון הפסקה</b>' + "<p>מתקנים ישר בתוך הטקסט. ההדגשה נשמרת. הקובץ בדרייב אינו משתנה.</p>" + '<div class="fx-ed" contenteditable="true" id="fx-ed">' + runsHtml(p.runs) + "</div>" + '<div class="fx-row"><button class="fx-ok" id="fx-ok">שמירת התיקון</button>' + (p.orig ? '<button id="fx-org">החזרת המקור</button>' : "") + "</div>" + '<button class="cl">ביטול</button></div>';
    box.className = "splitbox on";
    var ed = document.getElementById("fx-ed");
    ed.onkeydown = function(e) {
        if (e.key === "Enter") e.preventDefault();
    };
    ed.onpaste = function(e) {
        var t = e.clipboardData || window.clipboardData;
        t = t ? t.getData("text") : "";
        e.preventDefault();
        document.execCommand("insertText", false, t.replace(/\s+/g, " "));
    };
    document.getElementById("fx-ok").onclick = function() {
        doFix(i, edRuns(ed));
    };
    var org = document.getElementById("fx-org");
    if (org) org.onclick = function() {
        doFix(i, null);
    };
    box.querySelector(".cl").onclick = function() {
        fixOff();
    };
    setTimeout(function() {
        try {
            ed.focus();
        } catch (x) {}
    }, 50);
}

function doFix(i, runs) {
    var p = CHV[i];
    if (!p) return;
    var base = p.orig || p.runs, key = p.key || fixKey(base);
    if (runs && !runs.length) {
        say("הפסקה ריקה - לא נשמר.", 1);
        return;
    }
    hiddenKeys().forEach(function(k) {
        if (!BOOK[k].fixes) return;
        BOOK[k].fixes = BOOK[k].fixes.filter(function(f) {
            return f[0] !== key;
        });
    });
    var same = runs && runsText(runs) === runsText(base) && JSON.stringify(runs) === JSON.stringify(base);
    if (runs && !same) {
        var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
        (rec.fixes = rec.fixes || []).push([ key, runs ]);
        CHV[i] = {
            runs: runs,
            off: p.off,
            orig: base,
            key: key,
            sig0: paraSig(p)
        };
    } else {
        CHV[i] = {
            runs: base,
            off: p.off
        };
    }
    var now = Date.now();
    hiddenKeys().forEach(function(k) {
        var hit = false;
        (BOOK[k].steps || []).forEach(function(st) {
            var c = st.c;
            if (!c || c.from == null || i < c.from || i > (c.to == null ? c.from : c.to)) return;
            var got = chavRange(c.from, c.to == null ? c.from : c.to);
            if (got) {
                c.text = got.text;
                c.h = got.h;
                hit = true;
            }
        });
        if (hit && k !== PKEY) {
            DIRTY[k] = 1;
            BOOK[k].t = now;
        }
    });
    fixOff(true);
    redrawChav();
    touched();
    say(runs && !same ? 'התיקון נשמר. לחצו "שמירה" כדי לשלוח לגיליון.' : "הפסקה חזרה לנוסח המקורי.");
}

function chavCount() {
    if (!CHV) return "";
    var off = 0;
    CHV.forEach(function(p) {
        if (p.off) off++;
    });
    return CHV.length + " פסקאות" + (off ? " · " + off + " מוסתרות" : "");
}

function redrawChav() {
    document.getElementById("chb").innerHTML = chavHtml(CHV);
    document.getElementById("chpg").textContent = chavCount();
    chavBind();
    paintChav();
    markPanel();
}

function toggleHide(i) {
    if (!CHV || !CHV[i]) return;
    var sig = paraSig(CHV[i]);
    if (CHV[i].off) {
        hiddenKeys().forEach(function(k) {
            if (!BOOK[k].hidden) return;
            BOOK[k].hidden = BOOK[k].hidden.filter(function(s) {
                return s !== sig;
            });
        });
        CHV[i].off = false;
    } else {
        var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
        rec.hidden = rec.hidden || [];
        if (rec.hidden.indexOf(sig) < 0) rec.hidden.push(sig);
        CHV[i].off = true;
    }
    redrawChav();
    touched();
    say(CHV[i].off ? "הפסקה הוסתרה - לא תופיע אצל התלמיד" : "הפסקה הוחזרה.");
}

function paraText(i) {
    return (CHV[i].runs || []).map(function(r) {
        return r.t;
    }).join("");
}

function sentences(t) {
    var out = [], at = 0, re = /[.!?]["'\)\]]*\s+/g, m;
    while (m = re.exec(t)) {
        out.push([ at, t.slice(at, m.index + m[0].length).trim() ]);
        at = m.index + m[0].length;
    }
    if (at < t.length) out.push([ at, t.slice(at).trim() ]);
    return out;
}

function splitSheet(i) {
    var t = paraText(i), ss = sentences(t);
    var box = document.getElementById("splitbox");
    if (ss.length < 2) {
        box.innerHTML = '<div class="sh"><b>אין מה לפצל</b>' + "<p>בפסקה הזו אין יותר ממשפט אחד.</p>" + '<button class="cl">סגירה</button></div>';
    } else {
        box.innerHTML = '<div class="sh"><b>היכן מתחילה הפסקה החדשה?</b>' + "<p>הקישו על המשפט שממנו יתחיל הביאור של הקטע הבא.</p>" + ss.map(function(v, k) {
            return k === 0 ? '<div class="s0">' + esc(v[1]) + "</div>" : '<button class="sp" data-at="' + v[0] + '">' + esc(v[1]) + "</button>";
        }).join("") + '<button class="cl">ביטול</button></div>';
    }
    box.className = "splitbox on";
    [].forEach.call(box.querySelectorAll(".sp"), function(b) {
        b.onclick = function() {
            doSplit(i, +b.dataset.at);
        };
    });
    [].forEach.call(box.querySelectorAll(".cl"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
            splitOff();
        };
    });
}

function splitOff() {
    SPLIT_MODE = false;
    document.body.classList.remove("splitting");
    document.getElementById("splitbox").className = "splitbox";
    say("הפיצול בוטל.");
}

document.getElementById("toast").onclick = function() {
    this.className = "";
};

document.getElementById("fixpara").onclick = function() {
    if (!CHV) {
        say("החברותא עדיין לא נטענה.", 1);
        return;
    }
    if (FIX_MODE) {
        fixOff();
        return;
    }
    setHideMode(false);
    if (SPLIT_MODE) splitOff();
    FIX_MODE = true;
    document.body.classList.add("fixing");
    this.textContent = "✕ סיום תיקון טקסט";
    say("הקישו על הפסקה שצריך לתקן.");
};

document.getElementById("fixoff").onclick = function(e) {
    e.stopPropagation();
    fixOff();
};

document.getElementById("stat").onclick = function() {
    sayFull(null, true);
};

document.getElementById("splitoff").onclick = function(e) {
    e.stopPropagation();
    splitOff();
};

function doSplit(i, at) {
    document.getElementById("splitbox").className = "splitbox";
    SPLIT_MODE = false;
    document.body.classList.remove("splitting");
    if (!CHV || !CHV[i]) return;
    var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
    (rec.splits = rec.splits || []).push([ i, at ]);
    var two = cutRuns(CHV[i].runs, at);
    CHV.splice(i, 1, two[0], two[1]);
    redrawChav();
    touched();
    say("הפסקה פוצלה · " + CHV.length + " פסקאות");
}

function chavBind() {
    [].forEach.call(document.querySelectorAll("#chb p.cp"), function(el) {
        el.onclick = function() {
            var i = +el.dataset.p;
            if (HIDE_MODE) {
                toggleHide(i);
                return;
            }
            if (FIX_MODE) {
                fixSheet(i);
                return;
            }
            if (SPLIT_MODE) {
                if (i <= USED_C) {
                    say("אפשר לפצל רק פסקה שטרם שובצה.", 1);
                    return;
                }
                splitSheet(i);
            } else pickPara(i);
        };
    });
}

function pickPara(i) {
    if (SPL) {
        splitPara(i);
        return;
    }
    var k = stepAtPara(i);
    if (k >= 0 && k !== INSP) {
        inspect(k, null);
        return;
    }
    if (INSP < 0 && k < 0 && i <= USED_C) {
        say("הפסקה הזו שייכת לקטע בעמוד הקודם.", 1);
        return;
    }
    if (CSEL_P && i >= CSEL_P.a && i <= CSEL_P.b && CSEL_P.b > CSEL_P.a) {
        CSEL_P = {
            a: CSEL_P.a,
            b: i
        };
    } else if (!CSEL_P) {
        CSEL_P = {
            a: Math.max(0, USED_C + 1),
            b: i
        };
        if (CSEL_P.a > i) CSEL_P.a = i;
    } else {
        CSEL_P = {
            a: CSEL_P.a,
            b: i
        };
        if (CSEL_P.b < CSEL_P.a) {
            CSEL_P = {
                a: i,
                b: i
            };
        }
    }
    paintChav(1);
    markPanel();
}

function seeIn(box, el) {
    if (!box || !el) return;
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top >= b.top + 6 && r.bottom <= b.bottom - 6) return;
    box.scrollTop += r.top - b.top - box.clientHeight * .35;
}

function seeChav() {
    var box = document.getElementById("chb");
    if (!box) return;
    var hot = box.querySelectorAll("p.cp.hot");
    seeIn(box, hot.length ? hot[hot.length - 1] : box.querySelector("p.cp.insp") || box.querySelector("p.cp.nextup"));
}

function seeGem() {
    var st = stage(), img = document.getElementById("page");
    if (!st || !S || !img || !img.clientHeight) return;
    var ls = flatLines();
    var i = GSEL ? Math.max(GSEL.a.i, GSEL.b.i) : nextStart().i;
    var l = ls[i];
    if (!l) return;
    var y = (l.t + l.b) / 2 / S.h * img.clientHeight;
    if (y > st.scrollTop + 40 && y < st.scrollTop + st.clientHeight - 40) return;
    st.scrollTop = y - st.clientHeight * .5;
}

function paintChav(scroll) {
    [].forEach.call(document.querySelectorAll("#chb p.cp"), function(el) {
        var i = +el.dataset.p;
        var inSel = !!CSEL_P && i >= Math.min(CSEL_P.a, CSEL_P.b) && i <= Math.max(CSEL_P.a, CSEL_P.b);
        var one = !!SPL && inSel && SPL.cEnd != null && i <= SPL.cEnd;
        el.classList.toggle("hot", inSel && (INSP < 0 || one));
        el.classList.toggle("insp", inSel && INSP >= 0 && !one);
        el.classList.toggle("used", i <= USED_C && !inSel);
        el.classList.toggle("nextup", !CSEL_P && i === USED_C + 1);
    });
    if (scroll) seeChav();
}

function pos(q) {
    return q.line + q.x;
}

function chavRange(a, b) {
    if (!CHV) return null;
    var txt = [], html = [];
    for (var i = a; i <= b && i < CHV.length; i++) {
        if (i < 0) continue;
        if (CHV[i].off) continue;
        txt.push(CHV[i].runs.map(function(r) {
            return r.t;
        }).join(""));
        html.push("<p>" + CHV[i].runs.map(function(r) {
            var t = esc(r.t);
            return r.b ? "<b>" + t + "</b>" : t;
        }).join("") + "</p>");
    }
    if (!txt.length) return null;
    return {
        text: txt.join(" "),
        h: html.join("")
    };
}

var CONT_FIXED = false;

function seal(report) {
    if (!STEPS.length) {
        USED_G = null;
        USED_C = lastChav();
        return 0;
    }
    var fixed = 0;
    STEPS.sort(function(a, b) {
        return pos(a.g.from) - pos(b.g.from);
    });
    var rec0 = BOOK[PKEY] || {};
    var base = {
        line: 0,
        x: 0
    };
    var baseC = 0;
    if (rec0.prev > 0 && STEPS[rec0.prev - 1]) {
        var cut = STEPS[rec0.prev - 1];
        base = {
            line: cut.g.to.line,
            x: cut.g.to.x
        };
        baseC = cut.c.to + 1;
    } else {
        var pageStart = STEPS.length ? null : null;
        baseC = 0;
        var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
        var pgn = +selVal("pg") || 1, best = -1;
        for (var k0 in BOOK) {
            if (k0.indexOf(pre) !== 0 || k0 === PKEY) continue;
            if ((+k0.slice(pre.length) || 1) >= pgn) continue;
            var pst = BOOK[k0].steps || [];
            for (var j0 = 0; j0 < pst.length; j0++) if (!pst[j0].cont) best = Math.max(best, pst[j0].c.to);
        }
        baseC = best + 1;
    }
    var out = [];
    STEPS.forEach(function(st, si) {
        var prev = out[out.length - 1];
        if (!prev && si === 0) {
            if (Math.abs(pos(st.g.from) - pos(base)) > 1e-6) {
                st.g.from = {
                    line: base.line,
                    x: base.x
                };
                fixed++;
            }
            if (st.cont) {
                var pv = prevStep();
                if (pv && pv !== st && (st.c.from !== pv.c.from || st.c.to !== pv.c.to || st.c.h !== pv.c.h)) {
                    st.c = {
                        from: pv.c.from,
                        to: pv.c.to,
                        text: pv.c.text,
                        h: pv.c.h
                    };
                    fixed++;
                    CONT_FIXED = true;
                }
            } else if (st.c.from !== baseC) {
                st.c.from = baseC;
                if (st.c.to < st.c.from) st.c.to = st.c.from;
                fixed++;
                var g0 = chavRange(st.c.from, st.c.to);
                if (g0) {
                    st.c.text = g0.text;
                    st.c.h = g0.h;
                }
            }
        }
        if (prev) {
            if (pos(st.g.to) <= pos(prev.g.to) + 1e-6) {
                fixed++;
                return;
            }
            if (Math.abs(pos(st.g.from) - pos(prev.g.to)) > 1e-6) {
                st.g.from = {
                    line: prev.g.to.line,
                    x: prev.g.to.x
                };
                fixed++;
            }
            var nextC = prev.cont ? baseC : prev.c.to + 1;
            if (st.c.from !== nextC) {
                st.c.from = nextC;
                if (st.c.to < st.c.from) st.c.to = st.c.from;
                fixed++;
                var got = chavRange(st.c.from, st.c.to);
                if (got) {
                    st.c.text = got.text;
                    st.c.h = got.h;
                }
            }
        }
        out.push(st);
    });
    STEPS = out;
    ensureIds_();
    if (BOOK[PKEY]) BOOK[PKEY].steps = STEPS;
    var last = STEPS[STEPS.length - 1];
    USED_G = last ? {
        line: last.g.to.line,
        x: last.g.to.x
    } : null;
    USED_C = lastChav();
    if (fixed && report) say(fixed + " רצפים נסגרו אוטומטית.");
    return fixed;
}
