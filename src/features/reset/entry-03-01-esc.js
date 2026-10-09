function $(id) {
    return document.getElementById(id);
}

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function tp(t, v) {
    return String(t || "").replace(/\{(\w+)\}/g, function(m, k) {
        return v[k] != null ? v[k] : m;
    });
}

function ls(k) {
    try {
        return localStorage.getItem(k);
    } catch (e) {
        return null;
    }
}

(function() {
    var take = function(map) {
        for (var k in map || {}) {
            var p = k.split(".");
            if (p.length === 2 && p[0] === "ui" && typeof map[k] === "string" && map[k]) UI[p[1]] = map[k];
        }
    };
    try {
        take(JSON.parse(ls("df:textCache") || "null"));
        take(JSON.parse(ls("df:cfg") || "{}").texts);
    } catch (e) {}
})();

(function() {
    var l = $("hdr-mark");
    if (l) l.src = LOGO_MARK;
})();

$("brand").innerHTML = esc(PROGRAM.short) + "<br>" + esc(PROGRAM.name.slice(PROGRAM.short.length).trim());

$("yr").textContent = tp(UI.rstYear, {
    y: PROGRAM.year
});

function nowTxt() {
    var bits = [];
    if (ls("df:admOk") === "1") bits.push(UI.rstAdm);
    var me = null;
    try {
        me = JSON.parse(ls("df:me") || "null");
    } catch (e) {}
    if (me && me.first) bits.push(tp(UI.rstMe, {
        name: ((me.first || "") + " " + (me.last || "")).trim()
    }));
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k === "df:head" || k === "df:headSeen") {
            bits.push(UI.rstHead);
            break;
        }
    }
    if (ls("df:tester") === "1") bits.push(UI.rstTestOn);
    return bits.length ? bits.join(" · ") : UI.rstNone;
}

var DONE = false, BUSY = false;

function paint() {
    var adm = ls("df:admOk") === "1", test = ls("df:tester") === "1";
    var h = "<h2>" + esc(UI.rstT) + "</h2><p>" + esc(UI.rstB) + "</p>" + '<div class="now">' + esc(UI.rstNow) + " " + esc(nowTxt()) + "</div>";
    if (DONE) {
        h += '<div class="ok">' + esc(UI.rstDone) + "</div><p>" + esc(UI.rstNext) + "</p>";
    } else {
        if (adm) h += '<div class="warn">' + esc(UI.rstAdmWarn) + "</div>";
        h += '<label class="chk"><input type="checkbox" id="test"' + (adm && !test ? "" : " checked") + "> <span>" + esc(UI.rstTest) + "</span></label>" + '<button class="go" id="go"' + (BUSY ? " disabled" : "") + ">" + esc(BUSY ? UI.rstBusy : UI.rstGo) + "</button>";
    }
    h += '<button class="lnk" id="mark">' + esc(test ? UI.rstUnmark : UI.rstMark) + "</button>";
    $("box").innerHTML = h;
    if ($("go")) $("go").onclick = wipe;
    $("mark").onclick = function() {
        try {
            if (ls("df:tester") === "1") localStorage.removeItem("df:tester"); else localStorage.setItem("df:tester", "1");
        } catch (e) {}
        paint();
    };
}

function wipe() {
    if (!confirm(UI.rstAsk)) return;
    var test = $("test") && $("test").checked;
    BUSY = true;
    paint();
    var soft = function(p) {
        return Promise.resolve(p)["catch"](function() {});
    };
    var sw = "serviceWorker" in navigator ? navigator.serviceWorker : null;
    soft(sw ? sw.getRegistrations() : []).then(function(rs) {
        return Promise.all((rs || []).map(function(r) {
            return soft(r.pushManager && r.pushManager.getSubscription().then(function(s) {
                return s ? s.unsubscribe() : null;
            })).then(function() {
                return soft(r.unregister());
            });
        }));
    }).then(function() {
        if (!window.caches) return;
        return soft(caches.keys().then(function(ks) {
            return Promise.all(ks.map(function(k) {
                return caches["delete"](k);
            }));
        }));
    }).then(function() {
        if (!window.indexedDB || !indexedDB.databases) return;
        return soft(indexedDB.databases().then(function(ds) {
            (ds || []).forEach(function(d) {
                if (d.name) indexedDB.deleteDatabase(d.name);
            });
        }));
    }).then(function() {
        try {
            localStorage.clear();
        } catch (e) {}
        try {
            sessionStorage.clear();
        } catch (e) {}
        try {
            if (test) localStorage.setItem("df:tester", "1");
        } catch (e) {}
        BUSY = false;
        DONE = true;
        paint();
    });
}

paint();
