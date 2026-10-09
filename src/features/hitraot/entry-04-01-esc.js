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

var IOS = window.APPX && APPX.isIOS && APPX.isIOS();

function pic(os, n) {
    var mark = '<img src="' + esc(LOGO_MARK) + '" alt="">';
    if (os === "a") {
        if (n === 1) return '<div class="pic" style="text-align:center"><div class="ic">' + mark + '</div><div style="margin-top:6px">' + esc(PROGRAM.short) + '</div><div style="margin-top:4px;color:var(--gold)">👆 ···</div></div>';
        if (n === 2) return '<div class="pic"><div class="pop"><span>' + esc(PROGRAM.short) + '</span><span class="info">i</span></div><div class="ic">' + mark + "</div></div>";
        if (n === 3) return '<div class="pic"><div class="row hi"><span>התראות<small>חסום</small></span></div>' + '<div class="row"><span>הרשאות</span></div><div class="row"><span>אחסון</span></div></div>';
        return '<div class="pic"><div class="row hi"><span>אפשר התראות</span><span class="tg on"></span></div></div>';
    }
    if (n === 1) return '<div class="pic" style="text-align:center"><div class="ic" style="background:#8e8e93;font-size:1.5rem">⚙</div>' + '<div style="margin-top:6px">הגדרות</div></div>';
    if (n === 2) return '<div class="pic"><div class="row"><span>ספארי</span></div><div class="row hi"><span>' + esc(PROGRAM.short) + '</span></div><div class="row"><span>שעון</span></div></div>';
    if (n === 3) return '<div class="pic"><div class="row hi"><span>התראות</span><span>›</span></div></div>';
    return '<div class="pic"><div class="row hi"><span>אפשר התראות</span><span class="tg on"></span></div></div>';
}

function drawSteps() {
    var os = IOS ? "i" : "a";
    var h = "<h2>" + esc(UI.hitT) + "</h2><p>" + esc(UI.hitB) + "</p>" + '<div class="seg"><button data-os="a" class="' + (os === "a" ? "on" : "") + '">' + esc(UI.hitDroid) + '</button><button data-os="i" class="' + (os === "i" ? "on" : "") + '">' + esc(UI.hitIos) + "</button></div>";
    for (var n = 1; n <= 4; n++) {
        h += '<div class="st"><span class="num">' + n + "</span><b>" + esc(UI[(os === "a" ? "hitA" : "hitI") + n]) + "</b>" + pic(os, n) + "</div>" + (n < 4 ? '<span class="arw">↓</span>' : "");
    }
    $("steps").innerHTML = h;
    var bs = $("steps").querySelectorAll("[data-os]");
    for (var i = 0; i < bs.length; i++) bs[i].onclick = function() {
        IOS = this.getAttribute("data-os") === "i";
        drawSteps();
    };
}

var TEST = "";

function drawTest() {
    $("test").innerHTML = "<h2>" + esc(UI.hitTestH) + "</h2><p>" + esc(UI.hitTestB) + "</p>" + '<button class="go" id="t-go">' + esc(UI.hitTestGo) + "</button>" + (TEST ? '<div class="msg ' + (TEST === "ok" ? "ok" : "no") + '">' + esc(TEST === "ok" ? UI.hitTestOk : UI.hitTestNo) + "</div>" : "");
    $("t-go").onclick = function() {
        if (!window.APPX || !APPX.demo || APPX.perm() !== "granted") {
            TEST = "no";
            drawTest();
            return;
        }
        APPX.demo(PROGRAM.short, UI.hitTestOk).then(function() {
            TEST = "ok";
            drawTest();
        }, function() {
            TEST = "no";
            drawTest();
        });
    };
}

drawSteps();

drawTest();
