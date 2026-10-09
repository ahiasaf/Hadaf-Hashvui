function $(i) {
    return document.getElementById(i);
}

document.getElementById("hdr-mark").src = window.LOGO_MARK || "";

function fill(t, m) {
    return String(t == null ? "" : t).replace(/\{([^}]+)\}/g, function(_, k) {
        return m[k] == null ? "" : m[k];
    });
}

function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;"
        }[c];
    });
}

function qs(n) {
    var m = new RegExp("[?&]" + n + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
}

var INST = (qs("inst") || "lapid").replace(/[^a-z0-9_-]/gi, "");

function instName() {
    var r = (window.INSTITUTIONS || []).filter(function(i) {
        return i.code === INST;
    })[0];
    return r ? r.name : "";
}

function base() {
    return location.href.split("#")[0].split("?")[0].replace(/shlach(\.html)?$/, "");
}

function joinUrl() {
    return base() + "join.html?inst=" + encodeURIComponent(INST);
}

function dadUrl() {
    return base() + "join.html?for=dad";
}

var GKEY = "df:shlachG";

function grades() {
    return String((window.SEND || {}).grades || "").split(/\s+/).filter(function(g) {
        return !!g;
    });
}

function grade() {
    try {
        var g = localStorage.getItem(GKEY);
        return grades().indexOf(g) >= 0 ? g : "";
    } catch (e) {
        return "";
    }
}

function setGrade(g) {
    try {
        localStorage.setItem(GKEY, g);
    } catch (e) {}
    draw();
}

function young(g) {
    return String((window.SEND || {}).young || "").split(/\s+/).indexOf(g) >= 0;
}

function msg(who) {
    var S = window.SEND || {}, g = grade();
    var t = who === "par" ? S.mPar : young(g) ? S.mSonsA : S.mSonsB;
    return fill(t, {
        "קישור": who === "par" ? dadUrl() : joinUrl(),
        "שכבה": g
    });
}

var FILES = {}, PIC = {
    sons: "flyer/sons.jpg",
    par: "flyer/parents.jpg"
};

function preload(who) {
    fetch(PIC[who]).then(function(r) {
        return r.ok ? r.blob() : null;
    }).then(function(b) {
        if (!b) return;
        try {
            FILES[who] = new File([ b ], who + ".jpg", {
                type: "image/jpeg"
            });
        } catch (e) {}
    }).catch(function() {});
}

function canFiles(who) {
    var f = FILES[who];
    if (!f || !navigator.canShare || !navigator.share) return false;
    try {
        return navigator.canShare({
            files: [ f ]
        });
    } catch (e) {
        return false;
    }
}

function go(who) {
    if (!grade()) return;
    var text = msg(who);
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function() {});
        }
    } catch (e) {}
    if (canFiles(who)) {
        navigator.share({
            files: [ FILES[who] ],
            text: text
        }).then(function() {
            after(who, 1);
        }).catch(function() {});
        return;
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    after(who, 0);
}

function after(who, withPic) {
    var S = window.SEND || {}, el = $("a-" + who);
    el.textContent = withPic ? S.okShare : S.okWa;
    el.hidden = false;
    if (!withPic) show(who, true);
}

function show(who, on) {
    var v = $("v-" + who);
    v.hidden = on == null ? !v.hidden : !on;
    $("p-" + who).textContent = v.hidden ? (window.SEND || {}).peek : (window.SEND || {}).peekOff;
}

function draw() {
    var S = window.SEND || {}, g = grade();
    $("t-h1").textContent = S.h1 || "";
    $("t-g1").textContent = S.g1 || "";
    $("t-g1b").textContent = S.g1b || "";
    $("t-g2").textContent = S.g2 || "";
    $("t-open").textContent = S.open || "";
    document.title = (S.h1 || "") + " · הדף השבועי של בני עקיבא";
    $("t-sons").textContent = S.sons || "";
    $("t-sonsB").textContent = g ? fill(S.sonsB, {
        g: g
    }) : S.sonsAny || "";
    $("t-par").textContent = S.par || "";
    $("t-parB").textContent = S.parB || "";
    var box = $("grades"), html = "";
    grades().forEach(function(x) {
        html += '<button class="gr' + (x === g ? " on" : "") + '" data-g="' + esc(x) + '">' + esc(x) + "</button>";
    });
    box.innerHTML = html;
    [ "sons", "par" ].forEach(function(w) {
        $("b-" + w).disabled = !g;
        $("m-" + w).textContent = g ? msg(w) : "";
        $("s-" + w).textContent = S.save || "";
        if ($("v-" + w).hidden) $("p-" + w).textContent = S.peek || "";
        $("p-" + w).hidden = !g;
        if (!g) {
            $("v-" + w).hidden = true;
            $("a-" + w).hidden = true;
        }
    });
    $("pick").textContent = g ? "" : S.pick || "";
    $("pick").hidden = !!g;
    var nm = instName();
    $("inst-name").textContent = nm;
    $("t-inst").textContent = nm ? fill(S.inst, {
        inst: nm
    }) : "";
}

$("grades").addEventListener("click", function(e) {
    var b = e.target.closest ? e.target.closest(".gr") : null;
    if (b && b.getAttribute("data-g")) setGrade(b.getAttribute("data-g"));
});

[ "sons", "par" ].forEach(function(w) {
    $("b-" + w).addEventListener("click", function() {
        go(w);
    });
    $("p-" + w).addEventListener("click", function() {
        show(w);
    });
    $("f-" + w).src = PIC[w];
    preload(w);
});

function relayer() {
    TX.layer(TX.published(), TX.draft());
    draw();
}

relayer();

TX.init({
    repaint: draw,
    onStop: function() {
        location.href = "./#admin";
    }
});

(function() {
    var id = window.SHEET_ID;
    try {
        var c = JSON.parse(localStorage.getItem("df:cfg") || "{}");
        if (c.sheetId) id = c.sheetId;
    } catch (e) {}
    if (!id || !navigator.onLine) return;
    fetch("https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent("טקסטים") + "&t=" + Date.now()).then(function(r) {
        return r.ok ? r.text() : null;
    }).then(function(t) {
        if (!t) return;
        var map = {}, rows = [], row = [], f = "", q = false;
        for (var i = 0; i < t.length; i++) {
            var ch = t[i];
            if (q) {
                if (ch === '"' && t[i + 1] === '"') {
                    f += '"';
                    i++;
                } else if (ch === '"') q = false; else f += ch;
            } else if (ch === '"') q = true; else if (ch === ",") {
                row.push(f);
                f = "";
            } else if (ch === "\n") {
                row.push(f);
                rows.push(row);
                row = [];
                f = "";
            } else if (ch !== "\r") f += ch;
        }
        if (f || row.length) {
            row.push(f);
            rows.push(row);
        }
        if (!rows.length || rows[0].join("|").indexOf("מפתח") < 0) return;
        rows.slice(1).forEach(function(r2) {
            var k = (r2[0] || "").trim(), v = (r2[1] || "").trim();
            if (k && v) map[k] = v;
        });
        try {
            localStorage.setItem("df:textCache", JSON.stringify(map));
        } catch (e) {}
        relayer();
    }).catch(function() {});
})();
