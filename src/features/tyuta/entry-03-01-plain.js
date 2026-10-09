function $(id) {
    return document.getElementById(id);
}

(function() {
    var l = $("hdr-mark");
    if (l) l.src = window.LOGO_MARK || "";
})();

$("brand").textContent = "הדף השבועי · של בני עקיבא";

$("yr").textContent = window.PROGRAM && PROGRAM.year || "";

function plain(h) {
    h = String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p)>/gi, "\n");
    var d = (new DOMParser).parseFromString("<body>" + h + "</body>", "text/html");
    return (d.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function copy(t, b) {
    var done = function() {
        b.textContent = "הועתק ✓";
    };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function() {
        fallback();
    }); else fallback();
    function fallback() {
        var ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            done();
        } catch (e) {}
        document.body.removeChild(ta);
    }
}

var all = {};

try {
    all = JSON.parse(localStorage.getItem("df:ownDraft") || "{}") || {};
} catch (e) {}

var keys = Object.keys(all).sort(function(a, b) {
    var pa = a.split("|"), pb = b.split("|");
    return pa[0] === pb[0] && pa[1] === pb[1] ? +pa[2] - +pb[2] : a < b ? -1 : 1;
});

var box = $("box");

if (!keys.length) {
    box.innerHTML = '<div class="card"><h2>אין במכשיר הזה פירוש שלא נשמר.</h2></div>';
}

keys.forEach(function(k) {
    var d = all[k] || {}, p = k.split("|");
    var txt = (d.pieces || []).map(function(x) {
        return (d.pieces.length > 1 && x.tag ? "[" + x.tag + "]\n" : "") + plain(x.text);
    }).join("\n\n");
    var c = document.createElement("div");
    c.className = "card";
    var h = document.createElement("h2");
    h.textContent = "דף " + p[1] + " · קטע " + p[2] + " (" + p[0] + ")";
    var w = document.createElement("div");
    w.className = "when";
    w.textContent = d.at ? "נכתב: " + new Date(d.at).toLocaleString("he-IL") : "";
    var pre = document.createElement("pre");
    pre.textContent = txt || "(ריק)";
    var b = document.createElement("button");
    b.textContent = "העתקה";
    b.onclick = function() {
        copy(txt, b);
    };
    c.appendChild(h);
    c.appendChild(w);
    c.appendChild(pre);
    c.appendChild(b);
    box.appendChild(c);
});
