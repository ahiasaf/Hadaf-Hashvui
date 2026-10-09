function $(i) {
    return document.getElementById(i);
}

$("hdr-mark").src = window.LOGO_MARK || "";

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

function base() {
    return location.href.split("#")[0].split("?")[0].replace(/kishurim(\.html)?$/, "");
}

var WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg>';

function draw() {
    var K = window.KISHURIM || {}, b = base();
    var U = window.UI || {};
    var links = [ [ "head", b + "?masa=1", K.headWa ], [ "rm", b + "tzevet.html", K.rmWa ], [ "kids", b + "join.html", fill(U.linkWa, {
        inst: K.kidsInst || "",
        url: "{קישור}"
    }) ], [ "par", b + "join.html?for=dad", fill(U.dadWa, {
        url: "{קישור}"
    }) ] ];
    $("t-h1").textContent = K.h1 || "";
    $("t-lead").textContent = K.lead || "";
    document.title = (K.h1 || "") + " · הדף השבועי של בני עקיבא";
    $("cards").innerHTML = links.map(function(l) {
        var k = l[0], url = l[1], msg = fill(l[2], {
            "קישור": url
        });
        return '<section class="card"><h2>' + esc(K[k + "H"]) + "</h2>" + '<p class="sub">' + esc(K[k + "Sub"]) + "</p>" + '<a class="go" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">' + WA + esc(K[k + "Btn"]) + "</a>" + '<button class="cp" data-url="' + esc(url) + '">' + esc(K.copy) + "</button></section>";
    }).join("");
}

$("cards").addEventListener("click", function(e) {
    var b = e.target.closest ? e.target.closest(".cp") : null;
    if (!b) return;
    var u = b.getAttribute("data-url"), K = window.KISHURIM || {};
    var ok = function() {
        b.textContent = K.copied || "✓";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function() {});
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
