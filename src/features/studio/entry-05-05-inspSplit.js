var SPL = null;

var SPL_UNDO = null;

function inspSplit() {
    if (INSP < 0 || !STEPS[INSP]) return;
    var st = STEPS[INSP];
    if (st.cont) {
        say("זה קטע המשך מהעמוד הקודם - מפצלים אותו בעמוד שבו הוא מתחיל.", 1);
        return;
    }
    if (!CHV) {
        say("החברותא עוד לא נטענה - נסו שוב בעוד רגע.", 1);
        return;
    }
    if (!st.c || st.c.from == null || !(st.c.to > st.c.from)) {
        say("לקטע הזה פסקה אחת בלבד בחברותא - אין מה לחלק בין שני קטעים.", 1);
        return;
    }
    SPL = {
        k: INSP,
        st: st,
        cEnd: null
    };
    var f = st.g.from, z = st.g.to, line = INSP_LINE;
    if (line < f.line || line > z.line) line = f.line;
    var end = {
        i: line,
        x: 1
    };
    if (pos({
        line: end.i,
        x: end.x
    }) >= pos(z) - 1e-6 && line - 1 >= f.line) end = {
        i: line - 1,
        x: 1
    };
    GSEL = {
        a: {
            i: f.line,
            x: f.x
        },
        b: end
    };
    CSEL_P = {
        a: st.c.from,
        b: st.c.to
    };
    document.body.classList.add("splt");
    markDraw();
    paintChav(1);
    markPanel();
    say("✂ בחרו בחברותא את הפסקה האחרונה של החלק הראשון, ובגמרא את השורה שבה הוא נגמר.");
}

function splitEnd() {
    if (!GSEL) return null;
    return GSEL.a.i <= GSEL.b.i ? GSEL.b : GSEL.a;
}

function splitWhy() {
    if (!SPL) return "-";
    var st = SPL.st, e = splitEnd();
    if (!e) return "בחרו שורה בגמרא";
    var p = pos({
        line: e.i,
        x: e.x
    });
    if (p <= pos(st.g.from) + 1e-6) return "הסוף לפני תחילת הקטע";
    if (p >= pos(st.g.to) - 1e-6) return "בגמרא לא נשאר דבר לחלק השני";
    if (SPL.cEnd == null) return "בחרו פסקה בחברותא";
    return "";
}

function splitCancel(quiet) {
    if (!SPL) return;
    var k = SPL.k, line = INSP_LINE;
    SPL = null;
    document.body.classList.remove("splt");
    inspect(k, line);
    if (!quiet) say("הפיצול בוטל - הקטע נשאר כמו שהיה.");
}

function splitLine(i, frac) {
    var st = SPL.st, f = st.g.from, z = st.g.to;
    if (i < f.line || i > z.line) {
        say("השורה הזו אינה בקטע שמפצלים. בחרו שורה מהמסומנות בכחול.", 1);
        return;
    }
    var x = 1;
    if (i === z.line) x = Math.max(.02, Math.min(z.x - .02, frac == null ? z.x / 2 : frac));
    GSEL = {
        a: {
            i: f.line,
            x: f.x
        },
        b: {
            i: i,
            x: x
        }
    };
    markDraw();
}

function splitPara(i) {
    var c = SPL.st.c;
    if (i < c.from || i > c.to) {
        say("הפסקה הזו אינה בקטע שמפצלים. בחרו פסקה מהמסומנות בכחול.", 1);
        return;
    }
    if (i === c.to) {
        say("הפסקה האחרונה נשארת לחלק השני - בחרו פסקה שלפניה.", 1);
        return;
    }
    SPL.cEnd = i;
    paintChav(1);
    markPanel();
}

function splitDo() {
    if (!SPL) return;
    var why = splitWhy();
    if (why) {
        say(why + ".", 1);
        return;
    }
    var k = STEPS.indexOf(SPL.st);
    if (k < 0) {
        say("הקטע השתנה בינתיים - הפיצול לא בוצע.", 1);
        splitCancel(1);
        return;
    }
    var st = SPL.st, c = st.c, e = splitEnd(), cEnd = SPL.cEnd;
    var r1 = chavRange(c.from, cEnd), r2 = chavRange(cEnd + 1, c.to);
    if (!r1 || !r2) {
        say("אחד החלקים יוצא בלי ביאור - כל הפסקאות שלו מוסתרות. בחרו פסקה אחרת.", 1);
        return;
    }
    var cut = {
        line: e.i,
        x: +(+e.x).toFixed(3)
    };
    var orig = JSON.parse(JSON.stringify(st));
    var one = JSON.parse(JSON.stringify(st));
    one.g = {
        from: {
            line: st.g.from.line,
            x: st.g.from.x
        },
        to: {
            line: cut.line,
            x: cut.x
        }
    };
    one.c = {
        from: c.from,
        to: cEnd,
        text: r1.text,
        h: r1.h
    };
    var from2 = cut.x >= .98 ? {
        line: cut.line + 1,
        x: 0
    } : {
        line: cut.line,
        x: cut.x
    };
    var two = {
        g: {
            from: from2,
            to: {
                line: st.g.to.line,
                x: st.g.to.x
            }
        },
        c: {
            from: cEnd + 1,
            to: c.to,
            text: r2.text,
            h: r2.h
        }
    };
    var rec = BOOK[PKEY] || {};
    var prevWas = rec.prev;
    if (rec.prev > 0 && k < rec.prev) rec.prev++;
    var contKey = null, contWas = null;
    if (k === STEPS.length - 1) {
        var ka = PKEY.split("|");
        if (ka.length >= 4) {
            ka[3] = String((+ka[3] || 1) + 1);
            var nk = ka.join("|"), nr = BOOK[nk], n0 = nr && nr.steps && nr.steps[0];
            if (n0 && n0.cont && n0.c && n0.c.from === c.from && n0.c.to === c.to) {
                contKey = nk;
                contWas = n0.c;
                n0.c = {
                    from: two.c.from,
                    to: two.c.to,
                    text: two.c.text,
                    h: two.c.h
                };
                if (nr) nr.t = Date.now();
                DIRTY[nk] = 1;
            }
        }
    }
    STEPS.splice(k, 1, one, two);
    seal();
    if (two.id) NEW_IDS[two.id] = 1;
    touched();
    SPL_UNDO = {
        key: PKEY,
        orig: orig,
        one: one,
        two: two,
        prev: prevWas,
        contKey: contKey,
        contWas: contWas
    };
    SPL = null;
    document.body.classList.remove("splt");
    inspEnd();
    var a = STEPS.indexOf(one);
    var rng = function(s) {
        var g0 = Math.min(s.g.from.line, s.g.to.line) + 1, g1 = Math.max(s.g.from.line, s.g.to.line) + 1;
        return "שורות " + g0 + (g1 > g0 ? "-" + g1 : "") + ", פסקה " + (s.c.from + 1) + (s.c.to > s.c.from ? "-" + (s.c.to + 1) : "");
    };
    say("✓ הקטע פוצל: קטע " + (a + 1) + " (" + rng(one) + ") וקטע " + (a + 2) + " (" + rng(two) + "). הפירוש, ההקלטות, השקף והשאלה נשארו בראשון; השני מתחיל ריק." + ' נשמר במכשיר - "שמירה" מעלה לגיליון.' + '<button class="unsplit" data-unsplit="1">↶ ביטול</button>');
    clearTimeout(TOAST_T);
    TOAST_T = setTimeout(function() {
        document.getElementById("toast").className = "";
    }, 12e3);
}

function splitUndo() {
    var u = SPL_UNDO;
    var a = u && u.key === PKEY ? STEPS.indexOf(u.one) : -1;
    if (a < 0 || STEPS[a + 1] !== u.two) {
        SPL_UNDO = null;
        say("אי אפשר לבטל את הפיצול - הקטעים השתנו מאז. אפשר למחוק את החלק השני (🗑), והוא יתאחד עם הראשון.", 1);
        return;
    }
    if (INSP >= 0) inspEnd();
    STEPS.splice(a, 2, u.orig);
    var rec = BOOK[PKEY] || {};
    if (u.prev !== undefined) rec.prev = u.prev;
    if (u.contKey) {
        var nr = BOOK[u.contKey], n0 = nr && nr.steps && nr.steps[0];
        if (n0 && n0.cont) {
            n0.c = u.contWas;
            nr.t = Date.now();
            DIRTY[u.contKey] = 1;
        }
    }
    SPL_UNDO = null;
    seal();
    touched();
    paintChav(1);
    markDraw();
    say("↶ הפיצול בוטל - הקטע חזר להיות אחד.");
}

document.addEventListener("click", function(ev) {
    var t = ev.target;
    if (t && t.closest && t.closest("[data-unsplit]")) splitUndo();
});

function startBefore(i) {
    var best = null;
    STEPS.forEach(function(st) {
        var t = st.g.to;
        if (t.line > i) return;
        if (!best || t.line > best.line || t.line === best.line && t.x > best.x) best = t;
    });
    if (!best) return {
        i: 0,
        x: 0
    };
    if (best.x >= .98) return {
        i: best.line + 1,
        x: 0
    };
    return {
        i: best.line,
        x: best.x
    };
}

function tapFrac(ev, i) {
    var ov = document.getElementById("ov"), l = flatLines()[i];
    if (!ov || !l || !S || ev == null || ev.clientX == null) return null;
    var r = ov.getBoundingClientRect();
    if (!r.width) return null;
    var px = (ev.clientX - r.left) / r.width * S.w;
    return Math.max(0, Math.min(1, (l.x2 - px) / (l.x2 - l.a)));
}

function pickLine(i, longPress, frac) {
    if (SPL) {
        splitLine(i, frac);
        return;
    }
    var st = startBefore(i);
    if (!longPress) {
        var k = stepAt(i);
        var free = false;
        if (k >= 0 && frac != null) {
            var gz = STEPS[k].g, end = gz.from.line > gz.to.line ? gz.from : gz.to;
            free = end.line === i && end.x < .98 && frac > end.x;
        }
        if (k >= 0 && !free) {
            inspect(k, i);
            return;
        }
    }
    if (INSP >= 0) inspEnd();
    if (longPress || st.i > i) {
        GSEL = {
            a: {
                i: i,
                x: 0
            },
            b: {
                i: i,
                x: 1
            }
        };
    } else {
        GSEL = {
            a: {
                i: st.i,
                x: st.x
            },
            b: {
                i: i,
                x: 1
            }
        };
    }
    markDraw();
}

(function() {
    var st = document.querySelector(".stage");
    if (st) st.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });
})();

function bindMarkHandles() {
    var ov = document.getElementById("ov");
    [].forEach.call(ov.querySelectorAll(".mh"), function(g) {
        g.style.touchAction = "none";
        g.onpointerdown = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var which = g.dataset.e;
            var move = function(m) {
                var r = ov.getBoundingClientRect();
                var px = (m.clientX - r.left) / r.width * S.w;
                var sh = selShapes(GSEL);
                var idx = which === "a" ? 0 : sh.length - 1;
                var ls = flatLines();
                var li = which === "a" ? Math.min(GSEL.a.i, GSEL.b.i) : Math.max(GSEL.a.i, GSEL.b.i);
                var l = ls[li];
                if (!l) return;
                var f = (l.x2 - px) / (l.x2 - l.a);
                f = Math.max(0, Math.min(1, f));
                if (which === "a") (GSEL.a.i <= GSEL.b.i ? GSEL.a : GSEL.b).x = f; else (GSEL.a.i <= GSEL.b.i ? GSEL.b : GSEL.a).x = f;
                markDraw();
            };
            var up = function() {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
        };
    });
}

function markPanel() {
    var ih = document.getElementById("ihint");
    if (ih && INSP >= 0 && STEPS[INSP]) {
        var ist = STEPS[INSP], ic = ist.c || {};
        ih.textContent = "קטע " + (INSP + 1) + " · שורות " + (Math.min(ist.g.from.line, ist.g.to.line) + 1) + "-" + (Math.max(ist.g.from.line, ist.g.to.line) + 1) + (ic.from != null ? " · פסקה " + (ic.from + 1) + (ic.to > ic.from ? "-" + (ic.to + 1) : "") : "");
    }
    var sh = document.getElementById("shint"), so = document.getElementById("s-ok");
    if (SPL && sh) {
        var why = splitWhy(), se = splitEnd();
        sh.textContent = why || "חלק א׳: שורות " + (SPL.st.g.from.line + 1) + "-" + (se.i + 1) + " · פסקה " + (SPL.st.c.from + 1) + (SPL.cEnd > SPL.st.c.from ? "-" + (SPL.cEnd + 1) : "");
        if (so) so.disabled = !!why;
    }
    var g = GSEL ? Math.min(GSEL.a.i, GSEL.b.i) + 1 + "-" + (Math.max(GSEL.a.i, GSEL.b.i) + 1) : null;
    var c = CSEL_P ? CSEL_P.a + 1 + (CSEL_P.b > CSEL_P.a ? "-" + (CSEL_P.b + 1) : "") : null;
    var ready = !!(GSEL && CSEL_P);
    document.body.classList.toggle("gsel", !!GSEL);
    var cont = !CSEL_P && canContinue();
    var hint = document.getElementById("ghint");
    var done = STEPS.length && nextStart().i >= flatLines().length;
    var pv = (BOOK[PKEY] || {}).prev;
    if (hint) hint.textContent = pv ? "⌁ " + pv + " קטעים ראשונים → דף " + ((BOOK[PKEY] || {}).prevDaf || "") : done ? "✓ העמוד כולו מסומן · " + STEPS.length + " קטעים" : cont || ready ? "" : g ? "עכשיו בחברותא" : STEPS.length ? STEPS.length + " קטעים · המשך בגמרא" : "סמנו בגמרא";
    var noExp = 0;
    for (var ni = 0; ni < STEPS.length; ni++) {
        var nc = STEPS[ni].c;
        if (nc && nc.from != null && !nc.h) noExp++;
    }
    if (hint && noExp) hint.textContent = "⚠ " + noExp + " בלי ביאור שמור" + (hint.textContent ? " · " + hint.textContent : "");
    var b2 = document.getElementById("addstep2");
    if (b2) {
        b2.textContent = cont ? "↩ המשך הקטע" : "הוספת הקטע";
        b2.disabled = !(ready || cont);
        b2.dataset.cont = cont ? "1" : "";
    }
    var b1 = document.getElementById("addstep");
    if (b1) b1.disabled = !ready || INSP >= 0;
    var state = "עמוד " + (+selVal("pg") === 1 ? "א׳" : +selVal("pg") === 2 ? "ב׳" : selVal("pg")) + " · ממשיכים משורה " + (nextStart().i + 1) + " ומפסקה " + (USED_C + 2);
    var mc = document.getElementById("mcur");
    if (mc) mc.innerHTML = '<div class="' + (g ? "ok" : "no") + '">גמרא: ' + (g ? "שורות " + g : "טרם נבחר") + "</div>" + '<div class="' + (c ? "ok" : "no") + '">חברותא: ' + (c ? "פסקה " + c : "טרם נבחר") + "</div>" + '<div class="no">' + state + "</div>";
    var sb = document.getElementById("gstate");
    if (sb) sb.textContent = state;
    var d = dirtyCount();
    var db = document.getElementById("unsaved");
    if (db) {
        db.style.display = d ? "" : "none";
        db.innerHTML = "שמירה" + (d > 1 ? '<span class="n"> (' + d + ")</span>" : "");
        db.title = d + " עמודים טרם נשמרו בגיליון - לחצו לשמירה";
    }
    var sv = document.getElementById("save2");
    if (sv) sv.textContent = d ? "שמירה בגיליון (" + d + ")" : "שמירה בגיליון";
    var mh = document.getElementById("mhelp");
    if (mh) mh.innerHTML = "הקשה על שורה בגמרא ועל פסקה בחברותא - הקטע ממשיך " + "מהמקום שהקודם נגמר. <b>הקשה על שורה אחרת מזיזה את הסוף</b>, ולכן " + "סימנתם שורה אחת יותר מדי - הקישו על הקודמת. הקשה ארוכה מתחילה מחדש.";
    var el = document.getElementById("pg"), df = document.getElementById("daf");
    document.getElementById("pgprev").disabled = +el.value <= 0 && +df.value <= 0;
    document.getElementById("pgnext").disabled = +el.value >= el.options.length - 1 && +df.value >= df.options.length - 1;
    var cnt = document.getElementById("mcount");
    if (cnt) cnt.textContent = STEPS.length ? "· " + STEPS.length : "";
    var box = document.getElementById("steps");
    if (box) {
        box.innerHTML = STEPS.map(function(st, i) {
            return '<div class="step"><span class="x" data-x="' + i + '">✕</span>' + "<b>" + (i + 1) + ".</b> שורות " + (st.g.from.line + 1) + "-" + (st.g.to.line + 1) + " · פסקה " + (st.c.from + 1) + (st.c.to > st.c.from ? "-" + (st.c.to + 1) : "") + '<span class="q">' + esc((st.c.text || "").slice(0, 55)) + "…</span></div>";
        }).join("") || '<div class="hint">עדיין אין קטעים.</div>';
        [].forEach.call(document.querySelectorAll("[data-x]"), function(b) {
            b.onclick = function() {
                mergeStep(+b.dataset.x);
            };
        });
    }
    var u = document.getElementById("undo");
    if (u) u.disabled = !STEPS.length;
}
