function tkStart() {
    TX.start();
    show("home");
    TX.scan();
}

function netPreview(mode) {
    var items = netItemsIn(mode);
    if (!items.length) return "";
    return '<div class="netbar" style="margin-top:9px"><div class="nb-track" ' + 'style="animation:none"><div class="nb-set">' + items.map(function(it) {
        return '<span class="nb-i"><b>' + it[0] + "</b>" + it[1] + "</span>";
    }).join("") + "</div></div></div>";
}

function netCard() {
    var mode = netMode(), has = netItemsIn("nums").length > 0;
    var MODES = [ [ "off", "כבויה" ], [ "nums", "מספרים" ], [ "names", "שם ומספר" ] ];
    return '<div class="adm-card" style="margin-bottom:11px"><h4>השורה הנעה</h4>' + '<p class="h">שורה אחת בעמוד הראשי, מעל כפתור ההרשמה, שאומרת שהתוכנית ' + "רצה ברשת שלמה. <b>מספרים</b> - כמה ישיבות, כמה לומדים ואיך הם לומדים, " + "בלי אף שם. <b>שם ומספר</b> - כל ישיבה והמספר שלה, לפי סדר אלפביתי ולא " + "לפי גודל.</p>" + '<div class="tabs">' + MODES.map(function(o) {
        return '<button class="' + (mode === o[0] ? "on" : "") + "\" onclick=\"cfgSet('netTicker','" + o[0] + "');renderHome();admPane()\">" + o[1] + "</button>";
    }).join("") + "</div>" + (!has ? '<div class="cond" style="margin-top:10px">אין עדיין נתונים ברשת. ' + "השורה לא תוצג בעמוד גם אם תדליקו אותה - היא נדלקת מעצמה " + "ברגע שיהיו מספרים אמיתיים.</div>" : '<p class="h" style="margin:12px 0 0">כך זה ייראה - בנתונים של עכשיו:</p>' + '<div class="label" style="margin-top:8px">מספרים</div>' + netPreview("nums") + '<div class="label" style="margin-top:11px">שם ומספר</div>' + netPreview("names")) + "</div>";
}

function textPubRows() {
    var t = CFG.texts || {}, pub = PUBLISHED || {}, rows = [];
    TEXT_FIELDS.forEach(function(f) {
        if (!f.k) return;
        var v = t[f.k] != null ? t[f.k] : pub[f.k];
        if (typeof v === "string" && v !== "") rows.push({
            key: f.k,
            value: v
        });
    });
    return rows;
}

var dkSel = null;

var dkDir = "";

var dkList = [];

var dkPool = null;

var dkBusy = false;

var dkTitle = "";

var dkPdf = null;

function dkKey() {
    return dkSel.mas + "-" + dkSel.wk;
}

function dkDefDir() {
    return "slides/" + dkSel.mas + "-" + dkSel.wk;
}

function dkLoadSel() {
    var full = function(d) {
        var dir = (String(d.dir || "").split(/\s+/)[0] || dkDefDir()).replace(/^\/+|\/+$/g, "");
        return d.files.map(function(f) {
            return f.indexOf("/") >= 0 ? f : dir + "/" + f;
        });
    };
    var draft = (CV("decks") || {})[dkKey()];
    dkDir = dkDefDir();
    if (draft) {
        dkList = full(draft);
        dkTitle = draft.title || "";
        return;
    }
    dkTitle = DeckTitle(dkSel.mas, dkSel.wk);
    var d = DeckOf(dkSel.mas, dkSel.wk);
    if (d) {
        dkList = full(d);
        return;
    }
    dkDir = dkDefDir();
    dkList = [];
}

function dkStash() {
    var c = CV("decks") || {};
    c[dkKey()] = {
        dir: dkDir,
        files: dkList.slice(),
        title: dkTitle
    };
    cfgSet("decks", c);
}

function dkSetTitle(v) {
    dkTitle = String(v || "").trim();
    dkStash();
    dkAutoSave_();
}

function dkGo(mas, wk) {
    dkSel = {
        mas: mas,
        wk: wk
    };
    dkSlPick = {};
    dkBust = Date.now();
    dkPool = null;
    dkLoadSel();
    admPane();
    dkAsk();
}

function dkUp(i) {
    if (i > 0) {
        var t = dkList[i - 1];
        dkList[i - 1] = dkList[i];
        dkList[i] = t;
        dkStash();
        admPane();
        dkAutoSave_();
    }
}

function dkDown(i) {
    if (i < dkList.length - 1) {
        var t = dkList[i + 1];
        dkList[i + 1] = dkList[i];
        dkList[i] = t;
        dkStash();
        admPane();
        dkAutoSave_();
    }
}

var dkDrag_ = null;

function dkDragStart(ev, i) {
    if (ev.button > 0) return;
    var row = ev.target.closest ? ev.target.closest(".dk-drow") : null;
    if (!row) return;
    ev.preventDefault();
    var rows = [].slice.call(row.parentNode.querySelectorAll(".dk-drow"));
    var cs = rows.map(function(r) {
        var b = r.getBoundingClientRect();
        return b.top + b.height / 2 + window.pageYOffset;
    });
    dkDrag_ = {
        from: i,
        to: i,
        y0: ev.clientY + window.pageYOffset,
        row: row,
        rows: rows,
        cs: cs,
        h: row.getBoundingClientRect().height,
        id: ev.pointerId
    };
    row.classList.add("dk-drag");
    try {
        ev.target.setPointerCapture(ev.pointerId);
    } catch (e) {}
    document.addEventListener("pointermove", dkDragMove);
    document.addEventListener("pointerup", dkDragEnd);
    document.addEventListener("pointercancel", dkDragEnd);
}

function dkDragMove(ev) {
    var d = dkDrag_;
    if (!d || ev.pointerId !== d.id) return;
    ev.preventDefault();
    var dy = ev.clientY + window.pageYOffset - d.y0;
    d.row.style.transform = "translateY(" + dy + "px)";
    var mid = d.cs[d.from] + dy, to = d.from;
    d.cs.forEach(function(c, k) {
        if (k < d.from && mid < c) to = Math.min(to, k);
        if (k > d.from && mid > c) to = Math.max(to, k);
    });
    d.to = to;
    d.rows.forEach(function(r, k) {
        if (k === d.from) return;
        var sh = k > d.from && k <= to ? -d.h : k < d.from && k >= to ? d.h : 0;
        r.style.transform = sh ? "translateY(" + sh + "px)" : "";
    });
    if (ev.clientY < 60) window.scrollBy(0, -12); else if (ev.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
}

function dkDragEnd(ev) {
    var d = dkDrag_;
    if (!d || ev && ev.pointerId !== d.id) return;
    dkDrag_ = null;
    document.removeEventListener("pointermove", dkDragMove);
    document.removeEventListener("pointerup", dkDragEnd);
    document.removeEventListener("pointercancel", dkDragEnd);
    d.rows.forEach(function(r) {
        r.style.transform = "";
    });
    d.row.classList.remove("dk-drag");
    if (ev && ev.type === "pointercancel") return;
    if (d.to === d.from) return;
    var f = dkList.splice(d.from, 1)[0];
    dkList.splice(d.to, 0, f);
    dkStash();
    admPane();
    dkAutoSave_();
}

function dkDel(i) {
    dkList.splice(i, 1);
    dkStash();
    admPane();
    dkAutoSave_();
}

function dkRmWhere(path) {
    var out = [];
    var add = function(key) {
        var p = String(key).split("-"), wk = p.pop(), t = trackById(p.join("-"));
        var w = fill(UI.dkRmWk, {
            mas: t ? t.masechet : p.join("-"),
            wk: wk
        });
        if (out.indexOf(w) < 0) out.push(w);
    };
    var k;
    for (k in DECKS || {}) {
        if (!DECKS.hasOwnProperty(k) || !DECKS[k]) continue;
        (DECKS[k].files || []).forEach(function(f) {
            if ((f.indexOf("/") >= 0 ? f : DECKS[k].dir + "/" + f) === path) add(k);
        });
    }
    for (k in typeof CONTENT !== "undefined" ? CONTENT : {}) {
        var d = CONTENT[k] && CONTENT[k].deck;
        if (!d || DECKS && DECKS[k]) continue;
        var m = /\/(\d+)\.jpg$/.exec(path);
        if (m && path.indexOf(d.dir + "/") === 0 && +m[1] >= 1 && +m[1] <= d.n) add(k);
    }
    return out;
}

function dkRmMsg(cls, t) {
    var el = document.getElementById("dk-rm-msg");
    if (!el) {
        dkPdfMsg(cls, t);
        return;
    }
    el.innerHTML = t ? '<p class="h" style="margin-top:8px' + (cls === "ok" ? ";color:var(--ok)" : cls === "bad" ? ";color:var(--stop)" : "") + '">' + esc(t) + "</p>" : "";
}

function dkRm(f) {
    if (!API) return;
    if (!(CFG.readKey || "").trim()) {
        dkRmMsg("bad", UI.dkmNoKey);
        return;
    }
    var path = f.indexOf("/") >= 0 ? f : dkDir + "/" + f;
    var where = dkRmWhere(path);
    var q = fill(UI.dkRmQ, {
        f: f
    }) + (where.length ? "\n\n" + fill(UI.dkRmUsed, {
        where: where.join(", ")
    }) : "");
    if (!window.confirm(q)) return;
    dkRmMsg("", UI.dkRmBusy);
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "ghdel",
            key: (CFG.readKey || "").trim(),
            path: path,
            msg: "מחיקת " + path
        })
    }).catch(function() {}).then(function() {
        dkRmCheck(path, f, 0);
    });
}

function dkRmCheck(path, f, tries) {
    fetch("https://api.github.com/repos/" + REPO + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=main&t=" + Date.now()).then(function(r) {
        if (r.status === 404) {
            dkPool = (dkPool || []).filter(function(x) {
                return x !== f;
            });
            admPane();
            dkRmMsg("ok", UI.dkRmOk);
            return;
        }
        if (tries < 5) {
            setTimeout(function() {
                dkRmCheck(path, f, tries + 1);
            }, 2200);
            return;
        }
        dkRmMsg("bad", UI.dkRmBad);
    }).catch(function() {
        if (tries < 5) {
            setTimeout(function() {
                dkRmCheck(path, f, tries + 1);
            }, 2200);
            return;
        }
        dkRmMsg("bad", UI.dkRmBad);
    });
}

function dkAdd(f) {
    dkAddSilent_(f);
    dkStash();
    admPane();
    dkAutoSave_();
}

function dkAddSilent_(f) {
    var p = f.indexOf("/") >= 0 ? f : dkDir + "/" + f;
    if (dkList.indexOf(p) < 0) dkList.push(p);
}

var dkAutoT_ = null;

function dkAutoSave_() {
    clearTimeout(dkAutoT_);
    dkAutoT_ = setTimeout(dkSave, 900);
}

function dkPath(f) {
    return f.indexOf("/") >= 0 ? f : dkDir + "/" + f;
}

function dkShort(f) {
    var p = dkPath(f).split("/");
    return p.length > 1 ? p[p.length - 2] + "/" + p[p.length - 1] : p[0];
}

function dkSetDir(v) {
    dkDir = (String(v || "").trim().split(/\s+/)[0] || "").replace(/^\/+|\/+$/g, "") || dkDefDir();
    dkPool = null;
    dkStash();
    admPane();
    dkAsk();
}

function dkAsk() {
    if (!dkSel || dkBusy) return;
    dkBusy = true;
    var want = dkDir;
    fetch("https://api.github.com/repos/" + REPO + "/contents/" + want.split("/").map(encodeURIComponent).join("/") + "?ref=main").then(function(r) {
        return r.status === 404 ? [] : r.ok ? r.json() : null;
    }).then(function(j) {
        dkBusy = false;
        if (want !== dkDir) return;
        if (!j || !j.length && !Array.isArray(j)) {
            dkPool = null;
            admPane();
            return;
        }
        var out = [];
        j.forEach(function(f) {
            if (f.type === "file" && /\.(jpe?g|png|webp)$/i.test(f.name)) out.push(f.name);
        });
        out.sort();
        dkPool = out;
        admPane();
    }).catch(function() {
        dkBusy = false;
        dkPool = null;
        admPane();
    });
}

function dkSave() {
    if (!API) {
        dkMsg("bad", "אין כתובת שרת במכשיר הזה.");
        return;
    }
    var key = dkKey();
    dkMsg("", UI.dkmBusy);
    DeckLoad().then(function(ok) {
        if (!ok || !DECKS) {
            dkMsg("bad", UI.dkmNoRead);
            return;
        }
        var mine = (CV("decks") || {})[key], map = dkmClone(DECKS);
        if (!mine) {
            dkMsg("ok", "פורסם. התלמידים יראו את זה בפתיחה הבאה.");
            return;
        }
        map[key] = {
            dir: mine.dir,
            files: mine.files.slice(),
            title: mine.title || ""
        };
        dkWriteMap(map, function(good) {
            if (!good) {
                dkMsg("bad", "לא הצלחתי לאמת שהשמירה הגיעה לגיליון. נסו שוב.");
                return;
            }
            var c = CV("decks") || {}, now = c[key];
            if (now && now.files.join(",") === mine.files.join(",") && (now.title || "") === (mine.title || "")) {
                delete c[key];
                cfgSet("decks", c);
            }
            dkMsg("ok", "פורסם. התלמידים יראו את זה בפתיחה הבאה.");
        });
    });
}

(function() {
    try {
        if (Store.get("dkDraftReset", null)) return;
        if (CFG.decks) {
            Store.set("decksDraftOld", CFG.decks);
            CFG.decks = null;
            Store.set("cfg", CFG);
        }
        Store.set("dkDraftReset", (new Date).toISOString());
    } catch (e) {}
})();

function dkMsg(cls, t) {
    var el = document.getElementById("dk-msg");
    if (el) el.innerHTML = '<p class="h" style="margin-top:9px' + (cls === "ok" ? ";color:var(--ok)" : cls === "bad" ? ";color:var(--stop)" : "") + '">' + esc(t) + "</p>";
}

var DK_W = 1376;

function dkPdfLib() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise(function(ok, fail) {
        var sc = document.createElement("script");
        sc.type = "module";
        sc.textContent = "import * as p from './vendor/pdfjs/pdf.min.mjs';" + "p.GlobalWorkerOptions.workerSrc='./vendor/pdfjs/pdf.worker.min.mjs';" + "window.pdfjsLib=p;window.dispatchEvent(new Event('pdfjs-ready'));";
        var t = setTimeout(function() {
            fail(new Error("timeout"));
        }, 2e4);
        window.addEventListener("pdfjs-ready", function() {
            clearTimeout(t);
            ok();
        }, {
            once: true
        });
        sc.onerror = function() {
            clearTimeout(t);
            fail(new Error("load"));
        };
        document.head.appendChild(sc);
    });
}

function dkNextStart() {
    var max = 0;
    (dkPool || []).forEach(function(f) {
        var m = /^(\d+)\.jpg$/i.exec(f);
        if (m) {
            var v = parseInt(m[1], 10);
            if (v > max) max = v;
        }
    });
    return max + 1;
}

function dkPdfPick(inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) {
        dkPdfMsg("bad", "צריך קובץ PDF.");
        return;
    }
    dkPdf = null;
    dkPdfMsg("", "טוען את הממיר…");
    var buf;
    dkPdfLib().then(function() {
        return f.arrayBuffer();
    }).then(function(b) {
        buf = b;
        dkPdfMsg("", "קורא את הקובץ…");
        return pdfjsLib.getDocument({
            data: buf
        }).promise;
    }).then(function(doc) {
        var out = [], pg = 1, startN = dkNextStart(), fn = startN;
        function cut() {
            if (pg > doc.numPages) {
                dkPdf = out;
                admPane();
                dkPdfMsg("ok", "נחתכו " + out.length + " שקפים" + (startN > 1 ? " · ממוספרים " + startN + " עד " + (fn - 1) + " כדי לא לדרוס שקפים קיימים" : "") + '. בחרו אילו להוסיף, ולחצו "הוספה למצגת".');
                return;
            }
            dkPdfMsg("", "חותך שקף " + pg + " מתוך " + doc.numPages + "…");
            return doc.getPage(pg).then(function(p) {
                var v1 = p.getViewport({
                    scale: 1
                });
                var vp = p.getViewport({
                    scale: DK_W / v1.width
                });
                var cv = document.createElement("canvas");
                cv.width = Math.round(vp.width);
                cv.height = Math.round(vp.height);
                return p.render({
                    canvasContext: cv.getContext("2d"),
                    viewport: vp
                }).promise.then(function() {
                    var nm = (fn < 10 ? "0" : "") + fn + ".jpg";
                    out.push({
                        name: nm,
                        url: cv.toDataURL("image/jpeg", .82),
                        sel: true
                    });
                    pg++;
                    fn++;
                    return cut();
                });
            });
        }
        return cut();
    }).catch(function(e) {
        dkPdfMsg("bad", "ההמרה נכשלה: " + (e && e.message ? e.message : "שגיאה"));
    });
}
