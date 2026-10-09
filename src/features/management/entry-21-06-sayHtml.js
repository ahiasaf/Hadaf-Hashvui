function sayHtml() {
    var n = sayReach();
    if (n === null) return "";
    var w = sayWeek(), j = bJoin(myBoard()) || {};
    var h = '<div class="mycard"><h3>' + esc(headT("sayH")) + "</h3>" + "<p>" + esc(headT("sayB")) + "</p>";
    var kids = sayOpt.aud === "kids", plain = kids && !sayOpt.way && !sayOpt.grade;
    var seg = function(on, label, cnt, act) {
        return '<button class="' + (on ? "on" : "") + '" data-say="' + act + '">' + esc(label) + (cnt != null ? "<small>" + cnt + "</small>" : "") + "</button>";
    };
    h += '<div class="say-row"><span>' + esc(headT("sayWho")) + '</span><div class="say-seg">' + seg(kids, headT("sayAudKids"), null, "aud:kids") + seg(sayOpt.aud === "parents", headT("sayAudParS"), null, "aud:parents") + seg(sayOpt.aud === "both", headT("sayAudBoth"), null, "aud:both") + "</div></div>";
    if (!kids) h += '<p class="myto">' + esc(headT("sayParNote")) + "</p>";
    if (w) {
        h += '<div class="say-row"><span>' + esc(headT("saySegH")) + '</span><div class="say-seg">' + seg(!sayOpt.seg, headT("saySegAll"), plain ? n : null, "seg:") + seg(sayOpt.seg === "done", headT("saySegDoneS"), plain ? w.did : null, "seg:done") + seg(sayOpt.seg === "todo", headT("saySegTodo"), plain ? Math.max(0, n - w.did) : null, "seg:todo") + "</div></div>";
    }
    h += '<button class="say-more" data-say="more">' + esc(headT("sayMore")) + (sayOpt.way || sayOpt.grade ? " · " + esc(headT("sayMoreOn")) : "") + (sayOpt.more ? " ▴" : " ▾") + "</button>";
    if (sayOpt.more) {
        h += '<div class="say-sel"><select id="say-way" aria-label="' + esc(headT("sayWayAll")) + '">' + SAY_WAYS.map(function(x) {
            var c = x[0] && kids ? pairN(j.ways, x[0]) : null;
            return '<option value="' + esc(x[0]) + '"' + (sayOpt.way === x[0] ? " selected" : "") + ">" + esc(headT(x[1])) + (c != null ? " (" + c + ")" : "") + "</option>";
        }).join("") + "</select>";
        if ((j.grades || []).length > 1) {
            h += '<select id="say-grade" aria-label="' + esc(headT("sayGrAll")) + '">' + '<option value="">' + esc(headT("sayGrAll")) + "</option>" + (j.grades || []).map(function(g) {
                return '<option value="' + esc(g[0]) + '"' + (sayOpt.grade === g[0] ? " selected" : "") + ">" + esc(fill(headT("sayGrOne"), {
                    g: g[0]
                })) + " (" + g[1] + ")</option>";
            }).join("") + "</select>";
        }
        h += "</div>";
    }
    var tm = sayTmpls();
    if (tm.length) {
        h += '<div class="say-h">' + esc(headT("sayTmplH")) + '</div><div class="say-tm">' + tm.map(function(t, i) {
            return '<button data-say="tm:' + i + '">' + esc(t) + "</button>";
        }).join("") + "</div>";
    }
    h += '<textarea id="say-txt" rows="3" placeholder="' + esc(headT("sayPh")) + '">' + esc(sayDraft) + "</textarea>";
    h += '<label class="say-per"><input type="checkbox" id="say-per"' + (sayOpt.per ? " checked" : "") + "> " + esc(headT("sayPer")) + "</label>";
    h += '<div class="say-sig"><span>' + esc(headT("saySigL")) + ":</span> ";
    if (sayOpt.sigEd) {
        h += '<input type="text" id="say-sig" value="' + esc(saySig()) + '">';
    } else {
        h += "<b>" + esc(saySig()) + '</b> <button data-say="sig">' + esc(headT("saySigEdit")) + "</button>";
    }
    h += "</div>" + sayPreview();
    var c = sayCount();
    h += (n ? '<div class="say-sum"><b>' + esc(headT("sayToH")) + "</b> " + esc(sayToLabel()) + (c != null ? " · <b>" + c + "</b>" : "") + "</div>" : "") + '<p class="myto">' + (n ? esc(headT("sayToInst")) : esc(headT("sayNone"))) + "</p>" + '<button class="mygo" id="say-go"' + (sayBusy || !n || sayDraft.trim().length < 2 ? " disabled" : "") + ">" + (sayBusy ? "שולח…" : esc(headT("sayGo"))) + "</button>" + (sayErr ? '<div class="myerr">' + esc(sayErr) + "</div>" : "");
    var log = Store.get("sayLog", []) || [];
    if (log.length) {
        h += '<div class="say-h">' + esc(headT("sayLogH")) + '</div><div class="say-log">' + log.slice(0, 5).map(function(l) {
            return "<div><span>" + esc(l.when) + " · " + esc(l.to) + "</span>" + esc(l.text) + "</div>";
        }).join("") + "</div>";
    }
    return h + "</div>";
}

function sayToLabel() {
    var w = sayWeek(), bits = [];
    bits.push(headT(sayOpt.aud === "parents" ? "sayAudParS" : sayOpt.aud === "both" ? "sayAudBoth" : "sayAudKids"));
    if (sayOpt.seg) {
        bits.push(headT({
            done: "saySegDone",
            todo: "saySegTodo",
            mid: "saySegMid",
            none: "saySegNone"
        }[sayOpt.seg]).split("{daf}").join(w ? w.daf : ""));
    }
    SAY_WAYS.forEach(function(x) {
        if (x[0] && x[0] === sayOpt.way) bits.push(headT(x[1]));
    });
    if (sayOpt.grade) bits.push(fill(headT("sayGrOne"), {
        g: sayOpt.grade
    }));
    return bits.join(" · ");
}

function sayWire() {
    var t = document.getElementById("say-txt");
    if (t) {
        t.oninput = function() {
            sayDraft = t.value;
            var g = document.getElementById("say-go");
            if (g) g.disabled = sayBusy || !sayReach() || sayDraft.trim().length < 2;
            var pv = document.querySelector(".say-pv");
            if (pv) pv.outerHTML = sayPreview();
        };
    }
    var sw = document.getElementById("say-way");
    if (sw) sw.onchange = function() {
        sayOpt.way = sw.value;
        sayPaint();
    };
    var sgr = document.getElementById("say-grade");
    if (sgr) sgr.onchange = function() {
        sayOpt.grade = sgr.value;
        sayPaint();
    };
    var per = document.getElementById("say-per");
    if (per) per.onchange = function() {
        sayOpt.per = per.checked;
        sayPaint();
    };
    var sg = document.getElementById("say-sig");
    if (sg) {
        sg.focus();
        sg.onchange = sg.onblur = function() {
            Store.set("saySig", sg.value.trim());
            sayOpt.sigEd = false;
            sayPaint();
        };
    }
    var box = document.getElementById("my-say");
    if (box) box.onclick = function(e) {
        var b = e.target.closest ? e.target.closest("[data-say]") : null;
        if (!b) return;
        var a = b.getAttribute("data-say"), k = a.split(":")[0], v = a.slice(k.length + 1);
        if (k === "more") sayOpt.more = !sayOpt.more; else if (k === "sig") sayOpt.sigEd = true; else if (k === "tm") sayDraft = sayTmpls()[+v] || sayDraft; else if (k === "aud") sayOpt.aud = v; else sayOpt[k] = v;
        sayPaint();
    };
    var g = document.getElementById("say-go");
    if (g) g.onclick = saySend;
}

function sayPaint() {
    var el = document.getElementById("my-say");
    if (!el) return;
    if (!instCode(myBoard())) {
        el.innerHTML = "";
        return;
    }
    var on = typeof ASK !== "undefined" && ASK.seen && ASK.seen() && ASK.noted && ASK.noted() && ASK.get && ASK.get();
    el.innerHTML = on ? sayHtml() : "";
    if (on) sayWire();
    if (on && !sayPaint.asked) {
        sayPaint.asked = true;
        tmplLoad().then(function(ok) {
            if (ok) sayPaint();
        });
    }
}

function saySend() {
    var txt = (sayDraft || "").trim();
    sayErr = "";
    if (txt.length < 2) {
        sayErr = headT("sayEmpty");
        sayPaint();
        return;
    }
    var code = myBoard(), k = instCode(code);
    if (!code || !k) {
        sayErr = headT("sayErr");
        sayPaint();
        return;
    }
    var to = sayToLabel();
    if (!confirm(headT("sayAsk") + "\n" + to + "\n\n" + txt)) return;
    var url = (CFG.api || API || "").trim();
    if (!url) {
        sayErr = headT("sayErr");
        sayPaint();
        return;
    }
    var me = typeof ASK !== "undefined" && ASK.get && ASK.get() || {};
    var who = typeof ASK !== "undefined" && ASK.name ? ASK.name(me) : "";
    var w = sayWeek();
    var flt = {
        per: sayOpt.per ? 1 : 0
    };
    if (sayOpt.seg && w) {
        flt.seg = sayOpt.seg;
        flt.wk = w.wk;
    }
    if (sayOpt.way) flt.way = sayOpt.way;
    sayBusy = true;
    sayPaint();
    var q = {
        fire: "say",
        inst: code,
        k: k,
        title: saySig(),
        body: (sayOpt.per ? "{name}, " : "") + txt,
        grade: sayOpt.grade,
        klass: "",
        who: who,
        aud: sayOpt.aud,
        flt: JSON.stringify(flt)
    };
    var qs = Object.keys(q).map(function(x) {
        return encodeURIComponent(x) + "=" + encodeURIComponent(q[x]);
    }).join("&");
    fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + qs).then(function(r) {
        return r.json();
    }).then(function(d) {
        sayBusy = false;
        if (d && d.status === "ok") {
            var log = Store.get("sayLog", []) || [];
            var now = new Date;
            log.unshift({
                when: now.getDate() + "." + (now.getMonth() + 1),
                to: to,
                text: txt
            });
            Store.set("sayLog", log.slice(0, 20));
            sayDraft = "";
            sayErr = "";
            sayPaint();
            alert(headT("saySent"));
        } else {
            sayErr = headT("sayErr") + " " + (d && d.message || "");
            sayPaint();
        }
    }).catch(function() {
        sayBusy = false;
        sayErr = headT("sayErr");
        sayPaint();
    });
}

function emph(t) {
    return esc(t).replace(/\*([^*\n]+)\*/g, "<b>$1</b>");
}

function paras(t, cls) {
    return String(t == null ? "" : t).split("\n").map(function(x) {
        return x.trim() ? "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + emph(x.trim()) + "</p>" : "";
    }).join("");
}

function thanksHtml(code, name) {
    if (!code) return "";
    var wa = fill(UI.teamWa, {
        inst: name,
        url: tzevetUrl(code)
    });
    return '<div class="thx">' + (UI.thanksH ? "<h3>" + esc(UI.thanksH) + "</h3>" : "") + paras(UI.thanksBody) + '<a class="thx-go" target="_blank" rel="noopener" ' + "onclick=\"try{localStorage.setItem('df:ramsWa','1')}catch(e){}\" " + 'href="https://wa.me/?text=' + encodeURIComponent(wa) + '">' + esc(UI.thanksGo) + "</a>" + '<p class="thx-how">' + esc(UI.thanksHow) + "</p>" + "</div>";
}

function renderBoard(hail) {
    var el = document.getElementById("coord");
    if (!el) return;
    var code = myBoard();
    var inst = INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0];
    if (!inst) return;
    var wrap = document.getElementById("c-pend");
    if (!wrap) return;
    if (!wrap.querySelector("#ask-here")) wrap.innerHTML = '<div id="ask-here"></div>';
    askSetup("ask-here");
}

function boardBack() {
    pick(UI.cbBack, INSTITUTIONS.map(function(i) {
        return {
            v: i.code,
            t: i.name
        };
    }), myBoard(), function(v) {
        Store.set("dfBoard", v);
        renderBoard();
        renderReg();
    });
}

function loadCounts() {
    var id = CFG.sheetId || SHEET_ID;
    return Promise.all([ fetchSheet(id, "מונים").then(function(rows) {
        if (!rows || !rows.length) return;
        var head = rows[0], ix = {}, m = {};
        for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
        if (ix["קוד ישיבה"] === undefined) return;
        for (var r = 1; r < rows.length; r++) {
            var c = String(rows[r][ix["קוד ישיבה"]] || "").trim();
            if (!c) continue;
            m[c] = {
                n: parseInt(rows[r][ix["מצטרפים"]], 10) || 0,
                grades: bPairs(rows[r][ix["שכבות"]]),
                ways: bPairs(rows[r][ix["מסגרות"]])
            };
        }
        Store.set("joinCount", m);
        return true;
    }).catch(function() {}), fetchSheet(id, "מוני-לימוד").then(function(rows) {
        var m = typeof LCountsFrom === "function" ? LCountsFrom(rows) : null;
        if (m) {
            Store.set("learnCount", m);
            return true;
        }
    }).catch(function() {}) ]).then(function(r) {
        return !!(r[0] || r[1]);
    });
}

function reveal() {
    var els = document.querySelectorAll("#v-home .rv");
    if (!("IntersectionObserver" in window)) {
        for (var i = 0; i < els.length; i++) els[i].className += " in";
        return;
    }
    var io = new IntersectionObserver(function(es) {
        es.forEach(function(e, k) {
            if (!e.isIntersecting) return;
            var el = e.target;
            setTimeout(function() {
                el.classList.add("in");
            }, k * 55);
            io.unobserve(el);
        });
    }, {
        rootMargin: "0px 0px -8% 0px"
    });
    for (var j = 0; j < els.length; j++) {
        els[j].classList.remove("in");
        io.observe(els[j]);
    }
    clearTimeout(reveal.t);
    reveal.t = setTimeout(function() {
        for (var k = 0; k < els.length; k++) els[k].classList.add("in");
    }, 1200);
}

function openTrack(id) {
    var tr = trackById(id);
    state.track = tr;
    var wi = weekIndex();
    var bm = document.getElementById("bm");
    bm.innerHTML = TrailHtml({
        tr: tr,
        units: TrailWeeks(tr),
        wi: wi,
        here: -1,
        attr: function(u) {
            return u.kind === "daf" ? " onclick=\"openWeek('" + id + "'," + u.wk + ')"' : "";
        }
    });
    show("track");
    if (wi > 2) {
        var cur = bm.querySelector(".trl-step.cur");
        if (cur) setTimeout(function() {
            cur.scrollIntoView({
                block: "center"
            });
        }, 70);
    }
}
