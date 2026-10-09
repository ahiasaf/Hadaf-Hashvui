function prevStep() {
    var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
    var pg = +selVal("pg") || 1, best = null, bestPg = 0;
    for (var k in BOOK) {
        if (k.indexOf(pre) !== 0) continue;
        var p = +k.slice(pre.length) || 1;
        if (p >= pg || p < bestPg) continue;
        var st = BOOK[k].steps || [];
        if (st.length) {
            best = st[st.length - 1];
            bestPg = p;
        }
    }
    if (!best && pg === 1) {
        var el = document.getElementById("daf");
        var it = el._items && el._items[+el.value - 1];
        if (it) {
            var pre2 = [ selVal("mas"), it[0], selVal("src") ].join("|") + "|";
            var hi = 0;
            for (var q in BOOK) {
                if (q.indexOf(pre2) !== 0) continue;
                var p2 = +q.slice(pre2.length) || 1;
                var st2 = BOOK[q].steps || [];
                if (st2.length && p2 > hi) {
                    hi = p2;
                    best = st2[st2.length - 1];
                }
            }
        }
    }
    return best;
}

function canContinue() {
    return !!(GSEL && !STEPS.length && prevStep());
}

function addStep(cont) {
    if (INSP >= 0) return;
    var prev = cont ? prevStep() : null;
    if (!GSEL || (cont ? !prev : !CSEL_P)) return;
    var i0 = Math.min(GSEL.a.i, GSEL.b.i), i1 = Math.max(GSEL.a.i, GSEL.b.i);
    var xa = GSEL.a.i <= GSEL.b.i ? GSEL.a.x : GSEL.b.x;
    var xb = GSEL.a.i <= GSEL.b.i ? GSEL.b.x : GSEL.a.x;
    var step = {
        g: {
            from: {
                line: i0,
                x: +xa.toFixed(3)
            },
            to: {
                line: i1,
                x: +xb.toFixed(3)
            }
        },
        c: cont ? {
            from: prev.c.from,
            to: prev.c.to,
            text: prev.c.text,
            h: prev.c.h
        } : {
            from: CSEL_P.a,
            to: CSEL_P.b,
            text: chavText(),
            h: chavRich()
        }
    };
    if (cont) step.cont = 1;
    var at = STEPS.length;
    for (var i = 0; i < STEPS.length; i++) {
        var f = STEPS[i].g.from;
        if (f.line > i0 || f.line === i0 && f.x >= xa) {
            at = i;
            break;
        }
    }
    STEPS.splice(at, 0, step);
    seal();
    if (step.id) NEW_IDS[step.id] = 1;
    touched();
    GSEL = null;
    CSEL_P = null;
    paintChav(1);
    markDraw();
}

function stepRows() {
    var out = [], prev = null;
    STEPS.forEach(function(st, i) {
        if (prev) {
            var g = st.g.from, p = prev.g.to;
            if (g.line > p.line + 1 || g.line === p.line && g.x > p.x + .02 || g.line === p.line + 1 && p.x < .98 && g.x > .02) out.push({
                gap: true,
                at: i,
                from: p.line + 1,
                to: g.line + 1
            });
        }
        out.push({
            i: i,
            st: st
        });
        prev = st;
    });
    return out;
}

function dafKeys() {
    var a = PKEY.split("|");
    if (a.length < 4) return [];
    var pre = a.slice(0, 3).join("|") + "|", out = [];
    for (var k in BOOK) if (k.indexOf(pre) === 0) out.push(k);
    return out;
}

function orphanKeys() {
    return dafKeys().filter(function(k) {
        var p = k.split("|")[3];
        return p !== "1" && p !== "2";
    });
}

function dropOrphans() {
    var ks = orphanKeys(), n = 0;
    ks.forEach(function(k) {
        n += ((BOOK[k] || {}).steps || []).length;
        GONE[k] = 1;
        delete BOOK[k];
    });
    if (!ks.length) return;
    DIRTY[PKEY] = 1;
    keepLocal();
    markPanel();
    say("הוסרו " + ks.length + " רשומות עודפות (" + n + " קטעים). " + "צריך לשמור בגיליון.");
    showSteps();
}

function showSteps() {
    var box = document.getElementById("splitbox");
    var html = '<div class="sh"><b>הקטעים בעמוד הזה</b>' + "<p>הקשה על קטע מציגה אותו על הדף. ✕ מוחק אותו בלבד - " + "השאר נשארים, ואפשר להוסיף חדש במקומו.</p>";
    if (!STEPS.length) html += '<div class="s0">עדיין אין קטעים בעמוד הזה.</div>';
    var orph = orphanKeys();
    if (orph.length) {
        var on = 0;
        orph.forEach(function(k) {
            on += ((BOOK[k] || {}).steps || []).length;
        });
        html += '<div class="dup"><b>רשומה עודפת לדף הזה</b><div>' + (on ? "נמצאה רשומה בלי מספר עמוד ובה " + on + " קטעים. אי אפשר " + "להגיע אליה מהסטודיו, אבל מסך הלימוד קורא גם אותה - וזה מה " + "שמחזיר את התלמיד לראש הדף באמצע." : "נמצאה רשומה ריקה בלי מספר עמוד. היא אינה מזיקה, אבל אין " + "לה מה לעשות בגיליון.") + " נוצרה בגרסה שבה בורר העמוד היה ריק.</div>" + '<button class="dx">מחיקת הרשומה העודפת</button></div>';
    }
    stepRows().forEach(function(r) {
        if (r.gap) {
            html += '<div class="gap">⚠ רווח לא מסומן - שורות ' + r.from + "-" + r.to + "</div>";
            return;
        }
        var st = r.st;
        html += '<div class="row">' + '<button class="go" data-go="' + r.i + '"><b>' + (r.i + 1) + ".</b> שורות " + (st.g.from.line + 1) + "-" + (st.g.to.line + 1) + " · פסקה " + (st.c.from + 1) + (st.c.to > st.c.from ? "-" + (st.c.to + 1) : "") + "<i>" + esc((st.c.text || "").slice(0, 60)) + "</i></button>" + '<button class="del" data-del="' + r.i + '">✕</button></div>';
    });
    html += "<button class=\"cl\" onclick=\"document.getElementById('splitbox').className='splitbox'\">סגירה</button></div>";
    box.innerHTML = html;
    box.className = "splitbox on";
    [].forEach.call(box.querySelectorAll(".dx"), function(b) {
        b.onclick = function() {
            dropOrphans();
        };
    });
    [].forEach.call(box.querySelectorAll("[data-del]"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
            mergeStep(+b.dataset.del);
        };
    });
    [].forEach.call(box.querySelectorAll("[data-go]"), function(b) {
        b.onclick = function() {
            var st = STEPS[+b.dataset.go];
            if (!st) return;
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
            box.className = "splitbox";
            markDraw();
            markPanel();
            zoomToSel();
        };
    });
}

function removeStep(i) {
    STEPS.splice(i, 1);
    seal();
    touched();
    paintChav(1);
    markDraw();
}

var NEW_IDS = {};

function studioTaken_() {
    var mas = selVal("mas"), recs = [];
    for (var k in BOOK) if (k.indexOf(mas + "|") === 0) recs.push({
        mas: mas,
        d: BOOK[k]
    });
    return SidTaken(recs, mas);
}

function ensureIds_() {
    var need = STEPS.some(function(s) {
        return !s.cont && !s.id;
    });
    SidEnsure(STEPS, need ? studioTaken_() : {});
}

function keyOfStep_(st) {
    for (var k in BOOK) if ((BOOK[k].steps || []).indexOf(st) >= 0) return k;
    return "";
}

function nextPageKey_() {
    var a = PKEY.split("|");
    if (a.length < 4) return "";
    a[3] = String((+a[3] || 1) + 1);
    return a.join("|");
}

function studioContent_() {
    var mas = selVal("mas"), daf = selVal("daf"), rec = BOOK[PKEY] || {};
    var dafs = [ SidDaf(daf) ];
    if (rec.prev > 0 && rec.prevDaf) dafs.push(SidDaf(rec.prevDaf));
    var tabs = [ "פירוש", "שאלות בדף", "מצגת" ];
    return Promise.all(tabs.map(function(t) {
        return sheetCsv(t);
    })).then(function(res) {
        var out = {
            read: true,
            legacy: false,
            anch: null
        };
        res.forEach(function(rows, ti) {
            if (!rows) {
                out.read = false;
                return;
            }
            rows.slice(1).forEach(function(r) {
                if (r[0] !== mas || dafs.indexOf(SidDaf(r[1])) < 0) return;
                var v;
                try {
                    v = JSON.parse(r[2]);
                } catch (e) {
                    return;
                }
                if (!v || typeof v !== "object") return;
                if (ti === 2 && SidDaf(r[1]) === SidDaf(daf)) out.anch = v;
                if (v.__ids) return;
                for (var k in v) if (v.hasOwnProperty(k) && /^\d+$/.test(k)) out.legacy = true;
            });
        });
        return out;
    }).catch(function() {
        return {
            read: false
        };
    });
}

function mergeAsk_(info, b, after) {
    var msg = "לאחד את שני הקטעים?\n\n" + "קו ההפרדה ביניהם יוסר בגמרא ובחברותא. הפירוש לנוער, ההקלטות והשאלות של שניהם יוצגו יחד, ברצף.";
    if (!info.read) msg += "\n\n(לא הצלחתי לקרוא את לשוניות הפירוש והשאלות. אם הדף עוד לא הוסב למזהים, האיחוד עלול להזיז שיוכים של הקטעים שאחריו.)"; else if (info.legacy) msg += "\n\n⚠ הדף הזה עוד לא הוסב למזהים קבועים. האיחוד יזיז את הפירוש, השאלות והשקפים של כל הקטעים שאחריו."; else if (info.anch && info.anch.__ids && b && b.id && info.anch[b.id] !== undefined) {
        if (after && after.id && info.anch[after.id] !== undefined) msg += "\n\nשימו לב: בקטע השני מתחיל שקף, ולקטע שאחריו יש שקף משלו - השקף של הקטע השני לא יוצג יותר ברצף."; else msg += "\n\nהשקף שמתחיל בקטע השני יעבור להתחיל בקטע שאחריו.";
    }
    return confirm(msg);
}

function mergeStep(i) {
    var st = STEPS[i];
    if (!st) return;
    if (SPL) splitCancel(1);
    if (!STEPS[i + 1]) {
        if (i > 0) {
            mergeStep(i - 1);
            return;
        }
        say('זה הקטע היחיד בעמוד. איחוד עם קטע מעמוד אחר - בדף האינטראקטיבי ("איחוד קטע … עם קטע …").', 1);
        return;
    }
    var nx = STEPS[i + 1], rec = BOOK[PKEY] || {}, pg = +selVal("pg") || 1;
    if (rec.prev > 0 && i === rec.prev - 1) {
        say("הקטע הראשון שייך ללימוד של הדף הקודם, והשני לדף הזה - כל אחד על חברותא אחרת. אי אפשר לאחד אותם.", 1);
        return;
    }
    var root = st;
    if (st.cont) {
        if (pg === 1) {
            say("זה המשך של קטע מהדף הקודם, על החברותא של הדף ההוא - אי אפשר לאחד אותו עם קטע של הדף הזה.", 1);
            return;
        }
        root = prevStep();
        if (!root || root.cont) {
            say("לא מצאתי את תחילת הקטע בעמוד הקודם - לא אוחד.", 1);
            return;
        }
    }
    var after = STEPS[i + 2] || null;
    if (!after) {
        var nr = BOOK[nextPageKey_()], n0 = nr && nr.steps && nr.steps[0];
        after = n0 && !n0.cont ? n0 : null;
    }
    say("בודק את הפירוש והשקפים של הדף…");
    studioContent_().then(function(info) {
        if (!mergeAsk_(info, nx, after)) {
            say("לא אוחד.");
            return;
        }
        if (STEPS[i] !== st || STEPS[i + 1] !== nx) {
            say("הקטעים השתנו בינתיים - לא אוחד.", 1);
            return;
        }
        var from = root.c.from, to = nx.c.to;
        var r = chavRange(from, to);
        var c = r ? {
            from: from,
            to: to,
            text: r.text,
            h: r.h
        } : {
            from: from,
            to: to,
            text: (root.c.text || "") + " " + (nx.c.text || ""),
            h: (root.c.h || "") + (nx.c.h || "")
        };
        var cp = function() {
            return {
                from: c.from,
                to: c.to,
                text: c.text,
                h: c.h
            };
        };
        st.g = {
            from: st.g.from,
            to: {
                line: nx.g.to.line,
                x: nx.g.to.x
            }
        };
        st.c = cp();
        if (!root.id) root.id = SidNew(studioTaken_());
        var also = (root.also || []).slice();
        [ nx.id ].concat(nx.also || []).forEach(function(a) {
            if (a && a !== root.id && also.indexOf(a) < 0) also.push(a);
        });
        if (also.length) root.also = also;
        if (root !== st) {
            root.c = cp();
            var rk = keyOfStep_(root);
            if (rk && BOOK[rk]) {
                BOOK[rk].t = Date.now();
                DIRTY[rk] = 1;
            }
        }
        STEPS.splice(i + 1, 1);
        if (rec.prev > i + 1) rec.prev--;
        if (i === STEPS.length - 1) {
            var nk = nextPageKey_(), nb = BOOK[nk], f0 = nb && nb.steps && nb.steps[0];
            if (f0 && f0.cont) {
                f0.c = cp();
                nb.t = Date.now();
                DIRTY[nk] = 1;
            }
        }
        seal();
        touched();
        paintChav(1);
        markDraw();
        markPanel();
        say('✓ אוחד. נשמר במכשיר - "שמירה" מעלה לגיליון.');
    });
}

function setMode(m) {
    MODE = m;
    document.body.classList.toggle("mark", m === "mark");
    document.getElementById("mode").textContent = m === "mark" ? "→ חזרה לכיול" : "סימון קטעים ←";
    if (m === "mark") {
        loadChav();
        loadFromSheet().then(afterSheet);
        markDraw();
    } else if (S) draw();
    markPanel();
}

function loadChav() {
    var c = curDaf();
    var id = fileId(c.links[1]);
    if (!id) {
        document.getElementById("chb").innerHTML = '<div class="hint">אין קובץ חברותא לדף הזה.</div>';
        return;
    }
    var box = document.getElementById("chb");
    CHV = null;
    box.innerHTML = '<div class="hint">טוען את החברותא…</div>';
    var render = function(buf) {
        pdfReady().then(function() {
            return pdfjsLib.getDocument({
                data: buf.slice(0)
            }).promise;
        }).then(function(doc) {
            var jobs = [];
            for (var i = 1; i <= doc.numPages; i++) jobs.push(doc.getPage(i).then(chavItems));
            return Promise.all(jobs);
        }).then(function(pages) {
            var all = [].concat.apply([], pages);
            var body = bodyHeight(all);
            var raw = [].concat.apply([], pages.map(function(it) {
                return chavBuild(it, body);
            }));
            chavStore(id, raw);
            CHV = buildChav(raw);
            box.innerHTML = chavHtml(CHV);
            document.getElementById("chpg").textContent = chavCount();
            chavBind();
            paintChav(1);
            backfillChav();
        }).catch(function() {
            box.innerHTML = '<div class="hint">לא הצלחתי לקרוא.</div>';
        });
    };
    var mas = selVal("mas"), dk = dafKey(selVal("daf"));
    fetch("chav/" + mas + "/" + encodeURIComponent(dk) + ".json").then(function(r) {
        return r.ok ? r.json() : null;
    }).catch(function() {
        return null;
    }).then(function(rows) {
        if (!rows || !rows.length) return fromPdf();
        var raw = rows.map(function(p) {
            return {
                runs: p.map(function(r) {
                    return {
                        t: r[0],
                        b: r[1]
                    };
                })
            };
        });
        CHV = buildChav(raw);
        box.innerHTML = chavHtml(CHV);
        document.getElementById("chpg").textContent = chavCount();
        chavBind();
        paintChav(1);
        backfillChav();
    });
    return;
    function fromPdf() {
        var mem = chavLoad(id);
        if (mem) {
            CHV = buildChav(mem);
            box.innerHTML = chavHtml(CHV);
            document.getElementById("chpg").textContent = chavCount();
            chavBind();
            paintChav(1);
            backfillChav();
            return;
        }
        if (CACHE[id]) return render(CACHE[id]);
        var url = API + (API.indexOf("?") < 0 ? "?" : "&") + "file=" + encodeURIComponent(id);
        fetch(url).then(function(r) {
            return r.json();
        }).catch(function() {
            return jsonp(url);
        }).then(function(d) {
            var bin = atob(d.data), buf = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            CACHE[id] = buf;
            render(buf);
        }).catch(function() {
            box.innerHTML = '<div class="hint">לא הצלחתי להביא.</div>';
        });
    }
}
