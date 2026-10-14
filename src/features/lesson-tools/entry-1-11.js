

function boot() {
    resumeHide();
    API = (window.APPS_SCRIPT_URL || "").trim();
    try {
        var cfg = JSON.parse(localStorage.getItem("df:cfg") || "{}");
        if (cfg.api) API = cfg.api;
    } catch (e) {}
    try {
        var cz = localStorage.getItem("df:chav-size");
        if (cz !== null) CZ = +cz;
    } catch (e) {}
    chavZoom(0);
    (function() {
        var u = stuHomeUrl(), b0 = $("back");
        if (b0) b0.href = u;
    })();
    if (EMB) {
        document.body.className += " emb";
        var bk = $("back");
        if (bk) bk.style.display = "none";
    }
    if (FROM === "tzevet") {
        var b2 = $("back");
        if (b2) {
            var inst = (/[?&]inst=([^&]*)/.exec(location.search) || [])[1] || "";
            b2.href = "/tzevet" + (inst ? "?inst=" + inst : "") + "#howto";

        }
    }
    if (window.PAIR_UI && !OPEN_OK) PAIR_UI.flush();
    S = pickDaf();
    if (spotJump()) return;
    headPaint();
    document.title = "דף " + S.daf + " - לימוד אינטראקטיבי";
    try {
        SIDE_ADM = localStorage.getItem("df:admOk") === "1";
    } catch (e) {}
    if (quiet()) SIDE_ADM = false;
    document.body.classList.toggle("side-adm", SIDE_ADM);
    if (!OPEN_OK && S.daf) {
        veil("פותחים את הדף", "בודקים שהדף פתוח ללימוד");
        buttons(false);
        OpenLoad().then(function() {
            OPEN_OK = true;
            if (OpenIs(S.mas, S.daf, S.am)) {
                boot();
                return;
            }
            if (SIDE_ADM || quiet()) {
                boot();
                if (SIDE_ADM) toast("הדף נעול לתלמידים - פותחים אותו בניהול ← פתיחת דפים");
                return;
            }
            lockShow();
        });
        return;
    }
    loadOwnMap().then(function() {
        if (FLAT.length) paintChavArea();
    });
    loadQuizMap().then(function() {
        if (FLAT.length) paintChavArea();
    });
    veil("פותחים את הדף", "מכינים את קטעי הלימוד והביאור");
    buttons(false);
    var lib = loadLib();
    tick("lib", lib);
    var marks = tick("marks", loadMarks());
    var gem = tick("gemara", lib.then(function() {
        return loadGemara();
    }));
    Promise.all([ marks, gem ]).then(function(res) {
        if (!res[0]) {
            veil("הדף הזה עוד לא הוכן ללימוד קטע-אחר-קטע", "אפשר ללמוד אותו כרגיל מצורת הדף ומהחברותא שבעמוד השבוע.", false);
            return;
        }
        veil("פותחים את הדף", "מציגים את צורת הדף");
        return showPage(PAGES[0].daf, PAGES[0].pg).then(function() {
            SHOWN = 0;
            unveil();
            buttons(true);
            if (!CHAV_DEFAULT_OPEN || quiet()) {
                drawer(true);
                CHAV_DEFAULT_OPEN = true;
            }
            if (!quiet()) try {
                if (localStorage.getItem("df:dim") === "0") {
                    setWhole(true);
                }
            } catch (e) {}
            if (AT_END && !quiet()) go(FLAT.length - 1); else if (AMUD_Q && !S.am && !quiet() && amudIdx(AMUD_Q) >= 0) go(amudIdx(AMUD_Q)); else {
                go(0);
                if (!quiet() && !AT_START) try {
                    if (!spotResume()) {
                        resumePos();
                        spotOffer();
                    }
                } catch (e) {}
            }
            var started = function() {
                if (REC) {
                    recPaint();
                    return;
                }
                if (DEMO) demoRun();
            };
            DeckLoad()["catch"](function() {}).then(function() {
                try {
                    return sideInit();
                } catch (e) {}
            }).then(started, started);
        });
    }).catch(function() {
        veil("לא הצלחתי להביא את הדף", '<span role="alert">צריך חיבור לרשת. נסו שוב בעוד רגע.</span>' + '<button class="lockbtn" id="lesson-retry">ניסיון נוסף</button>', false);
        $("lesson-retry").onclick = function() {
            if (window.DFNet) window.DFNet.clear();
            boot();
        };
    });
}


window.addEventListener("DOMContentLoaded", function() {
    $("next").onclick = function(event) {
        if (LEAVING || event && event.detail > 1) return;
        if (IDX === FLAT.length - 1 && DONE_SEEN) {
            if (unitSwap(nextDaf())) return;
            var u = nextDafUrl();
            if (u) {
                leave($("next"), u);
                return;
            }
        }
        go(IDX + 1);
    };
    $("prev").onclick = goBack;
    var TAP_BACK = .3;
    var DRAG = null;
    var PTS = {}, PINCH = null;
    var ptsDist = function() {
        var k = Object.keys(PTS);
        if (k.length < 2) return 0;
        var a = PTS[k[0]], b = PTS[k[1]];
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
    };
    var ptUp = function(e) {
        delete PTS[e.pointerId];
        if (PINCH && Object.keys(PTS).length < 2) PINCH = null;
    };
    $("stage").addEventListener("pointerdown", function(e) {
        if (e.target.closest && e.target.closest('button,a,[role="button"]')) return;
        if (!FLAT.length) return;
        PTS[e.pointerId] = {
            x: e.clientX,
            y: e.clientY
        };
        if (Object.keys(PTS).length >= 2) {
            PINCH = DIM ? {
                off: 1
            } : {
                d0: ptsDist() || 1,
                z0: ZM
            };
            DRAG = null;
            return;
        }
        DRAG = {
            x: e.clientX,
            y: e.clientY,
            px: PAN.x,
            py: PAN.y,
            moved: 0
        };
    });
    $("stage").addEventListener("pointermove", function(e) {
        if (PTS[e.pointerId]) PTS[e.pointerId] = {
            x: e.clientX,
            y: e.clientY
        };
        if (PINCH) {
            e.preventDefault();
            if (PINCH.off) return;
            ZM = Math.max(ZM_MIN, Math.min(ZM_MAX, PINCH.z0 * ptsDist() / PINCH.d0));
            applyView(true);
            return;
        }
        if (!DRAG) return;
        var dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y;
        DRAG.moved = Math.max(DRAG.moved, Math.abs(dx) + Math.abs(dy));
        if (DIM || DRAG.moved < 6) return;
        e.preventDefault();
        PAN.x = DRAG.px + dx;
        PAN.y = DRAG.py + dy;
        applyView(true);
    });
    var endDrag = function(e) {
        if (!DRAG) return;
        var d = DRAG;
        DRAG = null;
        if (d.moved >= 6) return;
        var r = $("stage").getBoundingClientRect();
        if (!r.height) return;
        if ((e.clientY - r.top) / r.height < TAP_BACK) {
            goBack();
            return;
        }
        go(IDX + 1);
    };
    $("stage").addEventListener("pointerup", function(e) {
        ptUp(e);
        endDrag(e);
    });
    $("stage").addEventListener("pointercancel", function(e) {
        ptUp(e);
        DRAG = null;
    });
    [ "gesturestart", "gesturechange" ].forEach(function(t) {
        document.addEventListener(t, function(e) {
            e.preventDefault();
        }, {
            passive: false
        });
    });
    document.addEventListener("touchmove", function(e) {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, {
        passive: false
    });
    $("chtog").onclick = function() {
        if (QUIZ_OPEN) {
            QUIZ_OPEN = false;
            drawer(true);
        } else drawer(!explanationVisible());
    };
    $("chclose").onclick = function() {
        drawer(false);
    };
    $("czm").onclick = function() {
        chavZoom(-1);
    };
    $("czp").onclick = function() {
        chavZoom(1);
    };
    $("whole").onclick = function() {
        setWhole(DIM);
        if (!DIM) toast("אפשר לגרור את הדף · הקשה מחזירה וממשיכה");
        try {
            localStorage.setItem("df:dim", DIM ? "1" : "0");
        } catch (e) {}
    };
    gateOpen();
    $("done-x").setAttribute("aria-label", UI.pickClose || "");
    $("done-x").onclick = function() {
        $("done").className = "sheet";
        bar();
    };
    document.addEventListener("keydown", function(e) {
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) || t.closest && t.closest('a,summary,[role="button"]'))) return;
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === "ArrowLeft" || e.key === " ") {
            go(IDX + 1);
            e.preventDefault();
        }
        if (e.key === "ArrowRight") {
            goBack();
            e.preventDefault();
        }
    });
    if (DEMO || REC) {
        document.addEventListener("pointerdown", demoStop, true);
        document.addEventListener("keydown", demoStop, true);
    }
    var db = $("dbadge");
    if (db) db.onclick = function() {
        if (db.className.indexOf("fin") >= 0) demoOut();
    };
    var t = null;
    var refocus = function() {
        var height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        if (height > 0) document.documentElement.style.setProperty("--lesson-height", height + "px");
        clearTimeout(t);
        t = setTimeout(focus, 120);
    };
    refocus();
    window.addEventListener("resize", refocus);
    window.addEventListener("orientationchange", refocus);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", refocus);
        window.visualViewport.addEventListener("scroll", refocus);
    }
    boot();
});
