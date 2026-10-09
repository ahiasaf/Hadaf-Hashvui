function chavText() {
    if (!CSEL_P || !CHV) return "";
    var out = [];
    for (var i = CSEL_P.a; i <= CSEL_P.b && i < CHV.length; i++) out.push(CHV[i].runs.map(function(r) {
        return r.t;
    }).join(""));
    return out.join(" ");
}

function chavRich() {
    if (!CSEL_P || !CHV) return "";
    var out = [];
    for (var i = CSEL_P.a; i <= CSEL_P.b && i < CHV.length; i++) out.push("<p>" + CHV[i].runs.map(function(r) {
        var t = esc(r.t);
        return r.b ? "<b>" + t + "</b>" : t;
    }).join("") + "</p>");
    return out.join("");
}

function wordEdges(li) {
    var ls = flatLines(), l = ls[li];
    if (!l) return [];
    var trim = Math.round((l.b - l.t) * .18);
    var t = l.t + trim, bt = Math.max(t + 1, l.b - trim);
    var gapMin = Math.max(3, Math.round(S.gpitch * .18)), col = [];
    for (var x = l.a; x < l.x2; x++) {
        var any = 0;
        for (var y = t; y < bt && !any; y++) if (D.m[y * D.w + x]) any = 1;
        col.push(any);
    }
    var edges = [ l.x2 ], run = 0;
    for (var i = col.length - 1; i >= 0; i--) {
        if (!col[i]) {
            run++;
        } else {
            if (run >= gapMin) edges.push(l.a + i + run);
            run = 0;
        }
    }
    edges.push(l.a);
    return edges.map(function(x) {
        return (l.x2 - x) / (l.x2 - l.a);
    }).sort(function(p, q) {
        return p - q;
    });
}

function nudge(which, dir) {
    if (!GSEL) return;
    var first = GSEL.a.i <= GSEL.b.i ? GSEL.a : GSEL.b;
    var last = GSEL.a.i <= GSEL.b.i ? GSEL.b : GSEL.a;
    var pt = which === "start" ? first : last;
    var same = first.i === last.i;
    var MIN = .02, STEP = .035;
    var lo = 0, hi = 1;
    if (same) {
        if (which === "end") lo = first.x + MIN; else hi = last.x - MIN;
    }
    if (hi <= lo) return;
    var cur = pt.x, best = null;
    wordEdges(pt.i).forEach(function(e) {
        if (e < .001 || e > .999) return;
        if (e < lo - 1e-9 || e > hi + 1e-9) return;
        if (dir > 0 && e > cur + .005 && (best === null || e < best)) best = e;
        if (dir < 0 && e < cur - .005 && (best === null || e > best)) best = e;
    });
    if (best === null) best = cur + dir * STEP;
    best = Math.max(lo, Math.min(hi, best));
    if (Math.abs(best - cur) < 1e-9) return;
    pt.x = best;
    markDraw();
}

document.getElementById("mode").onclick = function() {
    setMode(MODE === "mark" ? "cal" : "mark");
};

document.getElementById("mode2").onclick = function() {
    setMode("cal");
};

document.getElementById("addstep").onclick = function() {
    addStep();
};

document.getElementById("addstep2").onclick = function() {
    addStep(this.dataset.cont === "1");
};

function prevDafName() {
    var el = document.getElementById("daf");
    var it = el && el._items && el._items[+el.value - 1];
    return it ? it[0] : "";
}

function stopSheet() {
    var box = document.getElementById("splitbox");
    var pg = +selVal("pg") || 1;
    var pd = prevDafName();
    var rec = BOOK[PKEY] || {};
    var cur = rec.prev || 0;
    if (pg !== 1) {
        box.innerHTML = '<div class="sh"><b>רק בעמוד א׳</b>' + "<p>נקודת העצירה מסמנת היכן נגמר שיעור הדף הקודם, ולכן " + "היא נקבעת בעמוד א׳ של הדף שאליו הוא גלש.</p>" + '<button class="cl">סגירה</button></div>';
    } else if (!pd) {
        box.innerHTML = '<div class="sh"><b>זה הדף הראשון</b>' + "<p>אין לפניו דף שאליו אפשר לצרף קטעים.</p>" + '<button class="cl">סגירה</button></div>';
    } else if (!STEPS.length) {
        box.innerHTML = '<div class="sh"><b>עוד אין קטעים בעמוד</b>' + "<p>סמנו קודם את הקטעים, ואז אפשר לקבוע עד היכן נמשך " + "השיעור של דף " + esc(pd) + ".</p>" + '<button class="cl">סגירה</button></div>';
    } else {
        box.innerHTML = '<div class="sh"><b>עד היכן נמשך דף ' + esc(pd) + "?</b>" + "<p>הקטעים שתבחרו יילמדו בסוף דף " + esc(pd) + ", ולא " + "בתחילת הדף הזה.</p>" + '<button class="sp" data-n="0">' + (cur ? "ביטול - הדף נגמר בגבול הרגיל" : "◂ אין המשך (ברירת המחדל)") + "</button>" + STEPS.map(function(st, k) {
            var n = k + 1;
            return '<button class="sp" data-n="' + n + '"' + (n === cur ? ' style="border-color:var(--gold);background:#FFFBF2"' : "") + ">עד קטע " + n + (n === cur ? " · מסומן כעת" : "") + "</button>";
        }).join("") + '<button class="cl">ביטול</button></div>';
    }
    box.className = "splitbox on";
    [].forEach.call(box.querySelectorAll(".sp"), function(b) {
        b.onclick = function() {
            setStop(+b.dataset.n, pd);
        };
    });
    [].forEach.call(box.querySelectorAll(".cl"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
        };
    });
}

function setStop(n, pd) {
    document.getElementById("splitbox").className = "splitbox";
    keepPageState();
    var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
    if (n > 0) {
        rec.prev = n;
        rec.prevDaf = pd;
    } else {
        delete rec.prev;
        delete rec.prevDaf;
    }
    touched();
    markPanel();
    say(n ? n + " קטעים ראשונים שייכים לדף " + pd + "." : "נקודת העצירה בוטלה - הדף נגמר בגבול הרגיל.");
}

document.getElementById("unsaved").onclick = function() {
    saveToSheet();
};

document.getElementById("stoppt").onclick = function() {
    stopSheet();
};

document.getElementById("steplist").onclick = function() {
    showSteps();
};

document.getElementById("splitpara").onclick = function() {
    if (!CHV) {
        say("החברותא עדיין לא נטענה.", 1);
        return;
    }
    if (SPLIT_MODE) {
        splitOff();
        return;
    }
    if (FIX_MODE) fixOff(true);
    setHideMode(false);
    SPLIT_MODE = true;
    document.body.classList.add("splitting");
    say("הקישו על הפסקה שצריך לפצל.");
};

function setHideMode(on) {
    HIDE_MODE = !!on;
    document.body.classList.toggle("hiding", HIDE_MODE);
    document.getElementById("hidepara").textContent = HIDE_MODE ? "⊘ סיום הסתרת פסקאות" : "⊘ הסתרת פסקה בחברותא";
}

document.getElementById("hidepara").onclick = function() {
    if (!CHV) {
        say("החברותא עדיין לא נטענה.", 1);
        return;
    }
    if (HIDE_MODE) {
        setHideMode(false);
        say("חזרה לסימון.");
        return;
    }
    SPLIT_MODE = false;
    document.body.classList.remove("splitting");
    if (FIX_MODE) fixOff(true);
    setHideMode(true);
    say("הקישו על פסקה כדי להסתיר אותה - והקשה נוספת מחזירה.");
};

window.addEventListener("beforeunload", function(e) {
    if (dirtyCount()) {
        e.preventDefault();
        e.returnValue = "";
    }
});

(function() {
    var m = document.getElementById("menu"), b = document.getElementById("more");
    b.onclick = function(e) {
        e.stopPropagation();
        m.classList.toggle("on");
    };
    m.onclick = function() {
        m.classList.remove("on");
    };
    document.addEventListener("click", function() {
        m.classList.remove("on");
    });
})();

document.getElementById("undo").onclick = function() {
    if (!STEPS.length) return;
    var last = STEPS[STEPS.length - 1];
    if (last.id && !NEW_IDS[last.id] && !confirm("הקטע האחרון כבר שמור בגיליון, ואולי יש לו פירוש, הקלטות או שאלות.\n" + "מחיקה תשאיר את השטח לא מסומן ותנתק ממנו את מה ששויך.\n\n" + 'לאחד אותו עם הקטע שלפניו - "ביטול" כאן, ואז 🔗.\nלמחוק בכל זאת - "אישור".')) return;
    removeStep(STEPS.length - 1);
};

[].forEach.call(document.querySelectorAll("[data-inudge]"), function(b) {
    var p = b.dataset.inudge.split(",");
    b.onclick = function() {
        nudge(p[0], +p[1]);
        markPanel();
    };
});

document.getElementById("i-close").onclick = function() {
    inspEnd();
};

document.getElementById("i-save").onclick = function() {
    inspSave();
};

document.getElementById("i-split").onclick = function() {
    inspSplit();
};

document.getElementById("s-cancel").onclick = function() {
    splitCancel();
};

document.getElementById("s-ok").onclick = function() {
    var why = splitWhy();
    if (why) {
        say(why + ".", 1);
        return;
    }
    studioContent_().then(function(info) {
        if (info.read && !info.legacy) {
            splitDo();
            return;
        }
        if (confirm(info.legacy ? "⚠ הדף הזה עוד לא הוסב למזהים קבועים. פיצול יזיז את הפירוש, השאלות והשקפים של כל הקטעים שאחרי הקטע הזה.\n\nלפצל בכל זאת?" : "לא הצלחתי לקרוא את לשוניות הפירוש והשאלות. אם הדף עוד לא הוסב למזהים, הפיצול עלול להזיז שיוכים של הקטעים שאחריו.\n\nלפצל בכל זאת?")) splitDo();
    });
};

document.getElementById("i-del").onclick = function() {
    if (INSP < 0) return;
    var k = INSP;
    inspEnd();
    mergeStep(k);
};

[].forEach.call(document.querySelectorAll("[data-nudge]"), function(b) {
    b.onclick = function() {
        var a = b.dataset.nudge.split(",");
        nudge(a[0], +a[1]);
    };
});

document.getElementById("clearsel").onclick = function() {
    GSEL = null;
    markDraw();
};

function stepDaf(d, last) {
    var el = document.getElementById("daf");
    var i = +el.value + d;
    if (i < 0 || i >= el.options.length) return false;
    WANT_LAST = !!last;
    el.value = i;
    el.dispatchEvent(new Event("change"));
    return true;
}

var WANT_LAST = false;

function stepPage(d) {
    var el = document.getElementById("pg");
    var i = +el.value + d;
    if (i < 0 || i >= el.options.length) return stepDaf(d, d < 0);
    el.value = i;
    el.dispatchEvent(new Event("change"));
}

document.getElementById("pgprev").onclick = function() {
    stepPage(-1);
};

document.getElementById("pgnext").onclick = function() {
    stepPage(1);
};

document.getElementById("save2").onclick = function() {
    saveToSheet();
};

document.getElementById("swap").onclick = function() {
    if (document.body.classList.contains("solo")) document.body.classList.toggle("on-chav"); else document.body.classList.toggle("swap");
};

document.getElementById("layout").onclick = function() {
    var solo = document.body.classList.toggle("solo");
    this.textContent = solo ? "מקביל" : "מסך מלא";
    document.getElementById("swap").textContent = solo ? "⇄ הצד השני" : "⇄";
};

window.studioLoad = load;
