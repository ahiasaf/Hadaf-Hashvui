function openWeek(id, i) {
    var tr = trackById(id);
    state.track = tr;
    state.week = i;
    var row = tr.cal[i], key = id + "-" + (i + 1);
    var c = CONTENT[key], q = QUIZ[key];
    var tone = id === "taanit" ? "t-b" : "t-g";
    var lk = (DAF_LINKS[id] || {})[dafKey(row[2])] || [];
    var h = '<div class="' + tone + '"><div class="wtop">' + '<div><div class="k">מסכת ' + esc(tr.masechet) + " · " + esc(row[1]) + "</div>" + "<h2>" + esc(DeckTitle(id, i + 1) || "דף " + rowDaf(row)) + "</h2>" + '<div class="k" style="font-weight:600">' + esc(row[0]) + "</div></div>" + '<span class="dafbig">' + esc(rowDaf(row)) + "</span></div></div>";
    var sg = SUGYA[id] || {}, sgp = (sg.pages || {})[sugKey(row)] || (sg.pages || {})[dafKey(row[2])];
    var sgPage = "", sgHref = sg.base || "";
    if (sgp && sgp.length === 2 && (sg.books || {})[sgp[0]]) {
        sgPage = sgp[1];
        sgHref = sg.books[sgp[0]] + sgPage + "/";
    } else if (sgp && sg.base && sg.fmt) {
        sgPage = sgp;
        sgHref = sg.fmt.replace("{p}", sgPage);
    }
    var go = '<svg class="wc-go" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" ' + 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var card = function(href, cls, inner) {
        return href ? '<a class="wcard ' + cls + '" href="' + href + '" target="_blank" rel="noopener">' + inner + go + "</a>" : '<a class="wcard dim ' + cls + '" href="#" onclick="return notYet()">' + inner + "</a>";
    };
    h += '<div class="wk-cards">' + '<div id="w-inter"></div>' + (showRow("sugya") ? card(sgHref, "logo sug", '<span class="wc-logo"><img src="weekpics/sugya-logo.png" alt="' + esc(UI.wkSugAlt) + '"></span>') : "") + (id === "megila" && showRow("yomi") ? '<button class="wcard small" onclick="yomiGuide()"><span class="wc-t">' + esc(UI.wkYomi) + "<small>" + esc(UI.wkYomiSub) + "</small></span>" + go + "</button>" : "") + (showRow("daf") ? card(lk[0], "small", '<span class="wc-t">צורת הדף<small>הדף להדפסה</small></span>') : "") + (showRow("chav") ? card(lk[1], "small", '<span class="wc-t">פירוש חברותא<small>ביאור על הדף</small></span>') : "") + "</div>";
    if (q && q.length) h += '<button class="wk-quiz" onclick="openQuiz()">' + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3h3v2a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1' + 'A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V6h3V3zm10 5v2a2 2 0 0 0 1-1.7V8h-1zM6 8v.3A2 2 0 0 0 7 10V8H6z"/></svg>' + esc(UI.wkQuiz) + "</button>";
    var dk = DeckOf(id, i + 1);
    state.deck = [];
    if (dk) {
        for (var n = 1; n <= dk.files.length; n++) state.deck.push({
            img: DeckSrc(dk, n)
        });
    } else if (c) {
        state.deck = c.slides.filter(function(s) {
            return s.h || s.t;
        });
    }
    h += '<div class="wk-foot">' + (GATE.gemara ? "<div>" + esc(GATE.gemara) + "</div>" : "") + (GATE.gemUrl && GATE.gemBuy ? '<div><a href="' + esc(GATE.gemUrl) + '" target="_blank" rel="noopener">' + esc(GATE.gemBuy) + "</a></div>" : "") + (GATE.chav ? "<div>" + (GATE.chavK ? esc(GATE.chavK) + ": " : "") + esc(GATE.chav) + (GATE.chavBy ? ", " + esc(GATE.chavBy) : "") + "</div>" : "") + "</div>";
    document.getElementById("week-body").innerHTML = h;
    paintInter(id, row[2], LAmOf(row));
    show("week");
}

function notYet() {
    alert("הקישור יתווסף בקרוב.");
    return false;
}

var TOAST_T = null;

function toast(t) {
    var el = document.getElementById("toast");
    if (!el) {
        el = document.createElement("div");
        el.id = "toast";
        el.setAttribute("role", "status");
        el.setAttribute("aria-live", "polite");
        document.body.appendChild(el);
    }
    el.textContent = t;
    el.className = "on";
    clearTimeout(TOAST_T);
    TOAST_T = setTimeout(function() {
        el.className = "";
    }, 2600);
}

var INTER_PUBLIC = true;

var ROW_DEF = {
    inter: true,
    sugya: true,
    daf: false,
    chav: false,
    soon: false,
    mid: false,
    yomi: false,
    here: true,
    cap: true,
    plan: true
};

function CFG_SOON() {
    return showRow("soon");
}

var DEMO = /[?&]demo=1\b/.test(location.search);

function showRow(k) {
    if (DEMO) return true;
    var v = (CV("rows") || {})[k];
    return v == null ? k === "inter" ? INTER_PUBLIC : ROW_DEF[k] : !!v;
}

var MARKED = null;

var MARK_TAB_PUB = "סימוני הדף";

function loadMarked() {
    if (MARKED) return Promise.resolve(MARKED);
    var id = CFG.sheetId || SHEET_ID;
    if (!id || !navigator.onLine) return Promise.resolve(null);
    return fetch("https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(MARK_TAB_PUB) + "&tq=" + encodeURIComponent("select A,B") + "&t=" + Date.now()).then(function(r) {
        return r.ok ? r.text() : null;
    }).then(function(t) {
        if (!t) return null;
        var ok = {};
        TRACKS.forEach(function(tr) {
            ok[tr.id] = 1;
        });
        var m = {};
        parseCsv(t).slice(1).forEach(function(r) {
            if (!r[0] || !r[1]) return;
            var k = r[0].trim();
            if (!ok[k]) return;
            (m[k] = m[k] || {})[dafKey(r[1])] = 1;
        });
        MARKED = m;
        Store.set("markedCache", m);
        return m;
    }).catch(function() {
        return null;
    });
}

function paintInter(id, daf, am) {
    var box = document.getElementById("w-inter");
    if (!box) return;
    if (!showRow("inter")) {
        box.innerHTML = "";
        return;
    }
    var soon = function(el) {
        el.innerHTML = UI.interSoon ? '<div class="wcard dim" aria-disabled="true"><img class="wc-pic" src="weekpics/phone.webp" alt="">' + '<span class="wc-t sm">' + esc(UI.interSoon) + "</span></div>" : "";
    };
    var draw = function(m) {
        var el = document.getElementById("w-inter");
        if (!el || !m) return;
        if (!(m[id] || {})[dafKey(daf)]) {
            soon(el);
            return;
        }
        el.innerHTML = '<a class="wcard inter" href="learn.html?mas=' + encodeURIComponent(id) + "&daf=" + encodeURIComponent(daf) + (am ? "&amud=" + am : "") + fromQ() + '">' + '<img class="wc-pic" src="weekpics/phone.webp" alt="">' + '<span class="wc-t">' + esc(UI.wkInter) + "</span>" + '<svg class="wc-go" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" ' + 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    };
    var have = MARKED || Store.get("markedCache");
    if (have) draw(have); else soon(box);
    loadMarked().then(draw).catch(function() {});
}

function deckOpen(i) {
    if (!state.deck.length) return;
    state.di = i || 0;
    document.getElementById("d-where").textContent = "מסכת " + state.track.masechet + " · דף " + rowDaf(state.track.cal[state.week]);
    document.getElementById("deck").className = "on";
    deckPaint();
}

function deckClose() {
    document.getElementById("deck").className = "";
}

function deckGo(d) {
    var n = state.di + d;
    if (n < 0 || n >= state.deck.length) return;
    state.di = n;
    deckPaint();
}

function deckPaint() {
    var s = state.deck[state.di];
    var img = document.getElementById("d-img"), txt = document.getElementById("d-text");
    if (s.img) {
        img.src = s.img;
        img.style.display = "block";
        txt.style.display = "none";
        var nx = state.deck[state.di + 1];
        if (nx && nx.img) {
            var pre = new Image;
            pre.src = nx.img;
        }
    } else {
        img.style.display = "none";
        txt.style.display = "flex";
        document.getElementById("d-k").textContent = s.k || "";
        document.getElementById("d-h").textContent = s.h || "";
        document.getElementById("d-t").textContent = s.t || "";
    }
    document.getElementById("d-prev").disabled = state.di === 0;
    document.getElementById("d-next").disabled = state.di === state.deck.length - 1;
    var d = "";
    for (var i = 0; i < state.deck.length; i++) d += '<i class="' + (i === state.di ? "on" : "") + '"></i>';
    document.getElementById("d-dots").innerHTML = d;
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && document.getElementById("zoom").classList.contains("on")) {
        zoomClose();
        return;
    }
    if (document.getElementById("deck").className !== "on") return;
    if (e.key === "ArrowLeft") deckGo(1);
    if (e.key === "ArrowRight") deckGo(-1);
    if (e.key === " ") {
        deckGo(1);
        e.preventDefault();
    }
    if (e.key === "Escape") deckClose();
});

function openQuiz(idx) {
    var key = state.track.id + "-" + (state.week + 1), list = QUIZ[key];
    if (!list || !list.length) return;
    if (idx === undefined) {
        if (list.length === 1) idx = 0; else {
            openQuizList(key, list);
            return;
        }
    }
    var q = list[idx];
    if (!q) return;
    state.quizIdx = idx;
    var qInstName = (INSTITUTIONS.filter(function(i) {
        return i.code === myInst;
    })[0] || {}).name || "";
    var h = (list.length > 1 ? '<button class="btn g" style="margin-bottom:12px" onclick="openQuiz()">→ כל החידות</button>' : "") + '<div class="sec"><b>' + (list.length > 1 ? "חידה " + (idx + 1) + " · " : "החידה השבועית · ") + "דף " + esc(rowDaf(state.track.cal[state.week])) + "</b><i></i></div>" + '<div class="qq">' + esc(q.q) + '</div><div class="opts">';
    q.a.forEach(function(t, i) {
        h += '<button class="opt" id="opt' + i + '" onclick="pickAns(' + i + ')">' + '<span class="n">' + (i + 1) + "</span><span>" + esc(t) + "</span></button>";
    });
    h += '</div><div style="margin-top:18px" id="q-who"></div>' + '<button class="btn p" id="q-send" onclick="sendQuiz()" disabled>שליחה</button>' + '<p style="font-size:.76rem;color:var(--ink-3);text-align:center;margin-top:10px;font-weight:600">' + 'הפרטים נשמרים במערכת התוכנית בלבד.</p><div id="q-result"></div>';
    document.getElementById("quiz-body").innerHTML = h;
    state.ans = -1;
    state.bad = {};
    qManual = false;
    quizWho();
    if (quizOk(key, idx, q)) {
        for (var k = 0; k < q.a.length; k++) {
            var el = document.getElementById("opt" + k);
            if (el) {
                el.className = "opt" + (k === q.correct ? " right" : "");
                el.onclick = null;
            }
        }
        document.getElementById("q-who").innerHTML = "";
        document.getElementById("q-send").style.display = "none";
        document.getElementById("q-result").innerHTML = '<div class="done-box" style="margin-top:14px">' + esc(UI.qLocked || "") + "</div>";
    }
    show("quiz");
}

function quizOkKey(key, idx, q) {
    return "df:qok:" + key + ":" + idx + ":" + q.q;
}

function quizOk(key, idx, q) {
    try {
        return localStorage.getItem(quizOkKey(key, idx, q)) === "1";
    } catch (e) {
        return false;
    }
}

function openQuizList(key, list) {
    var h = '<div class="sec"><b>החידות · דף ' + esc(rowDaf(state.track.cal[state.week])) + "</b><i></i></div>";
    h += list.map(function(q, i) {
        return '<button class="btn gr" style="margin-top:8px" onclick="openQuiz(' + i + ')">' + "חידה " + (i + 1) + " - " + esc(q.q) + "</button>";
    }).join("");
    document.getElementById("quiz-body").innerHTML = h;
    show("quiz");
}

var qManual = false;

function quizMe() {
    if (qManual) return null;
    var me = typeof LMe === "function" ? LMe() : null;
    return me && me.first && me.inst ? me : null;
}
