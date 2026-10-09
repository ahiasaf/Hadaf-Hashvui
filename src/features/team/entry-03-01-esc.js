(function() {
    var l = document.getElementById("hdr-mark");
    if (l) l.src = LOGO_MARK;
})();

function $(id) {
    return document.getElementById(id);
}

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;"
        }[c];
    });
}

function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
}

function digits(p) {
    return String(p || "").replace(/[^0-9]/g, "");
}

function waNum(p) {
    var d = digits(p);
    return d.indexOf("972") === 0 ? d : "972" + d.replace(/^0/, "");
}

var API = window.APPS_SCRIPT_URL || "";

var KEY = qs("k");

var WHO_KEY = "df:teamWho";

var WHO_OPTS = [ "אחיאסף", "הרב פלתי", "אלחנן" ];

function whoAmI() {
    try {
        return localStorage.getItem(WHO_KEY) || "";
    } catch (e) {
        return "";
    }
}

function setWho(w) {
    try {
        localStorage.setItem(WHO_KEY, w);
    } catch (e) {}
    paintWhoami();
    boot();
}

function pickWho(i) {
    setWho(WHO_OPTS[i] || "");
}

function clearWho() {
    setWho("");
}

function paintWhoami() {
    var w = whoAmI(), el = $("whoami");
    if (!w) {
        el.style.display = "none";
        return;
    }
    el.style.display = "block";
    el.innerHTML = esc(w) + ' · <button onclick="clearWho()">לא אני?</button>';
}

function veil(msg) {
    $("body").innerHTML = '<div class="empty">' + esc(msg) + "</div>";
}

function logAct(inst, action) {
    if (!API || !KEY) return;
    var who = whoAmI() || "לא ידוע";
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "teamlog",
            key: KEY,
            cols: JSON.stringify([ [ "מי", who ], [ "ישיבה", inst ], [ "פעולה", action ] ])
        })
    }).catch(function() {});
}

var CUR_ROWS = [];

function logClick(el) {
    var ri = +el.getAttribute("data-ri");
    var name = (CUR_ROWS[ri] || [])[0] || "";
    logAct(name, el.getAttribute("data-act"));
}

function render(rows) {
    CUR_ROWS = rows;
    if (!rows.length) {
        $("body").innerHTML = '<div class="empty">אין כרגע שום ישיבה שסומנה להצגה כאן.<br>' + "זה מתעדכן ממוקד השיחות.</div>";
        return;
    }
    var h = "";
    rows.forEach(function(r, ri) {
        var name = r[0] || "", upd = r[1] || "";
        var tags = [], people = [];
        try {
            tags = JSON.parse(r[2] || "[]") || [];
        } catch (e) {}
        try {
            people = JSON.parse(r[3] || "[]") || [];
        } catch (e) {}
        h += '<div class="card"><h2>' + esc(name) + "</h2>";
        if (upd) h += '<div class="upd">' + esc(upd) + "</div>";
        if (tags.length) {
            h += '<div class="tags">' + tags.map(function(t) {
                return '<span class="tag">' + esc(t) + "</span>";
            }).join("") + "</div>";
        }
        if (!people.length) {
            h += '<div class="who"><b style="color:var(--stop)">אין כאן מספר טלפון</b></div>';
        }
        people.forEach(function(q) {
            h += '<div class="who"><b>' + esc(q.name || "חייג") + "</b>" + '<div class="acts">' + '<a class="call" href="tel:' + digits(q.phone) + '" ' + 'data-ri="' + ri + '" data-act="שיחה" onclick="logClick(this)">📞 שיחה</a>' + '<a class="wa" href="https://wa.me/' + waNum(q.phone) + '" target="_blank" rel="noopener" ' + 'data-ri="' + ri + '" data-act="וואטסאפ" onclick="logClick(this)">וואטסאפ</a>' + "</div></div>";
        });
        h += "</div>";
    });
    $("body").innerHTML = h;
}

function boot() {
    if (!whoAmI()) {
        $("body").innerHTML = '<div class="gate"><div class="card">' + "<h2>מי אתה?</h2>" + '<p style="margin-top:6px;font-size:.84rem;color:var(--ink-2)">' + "כדי שאחיאסף ידע מי התקשר למי.</p>" + '<div class="pick">' + WHO_OPTS.map(function(w, i) {
            return '<button onclick="pickWho(' + i + ')">' + esc(w) + "</button>";
        }).join("") + "</div></div></div>";
        return;
    }
    paintWhoami();
    if (!API) {
        veil("חסר חיבור לשרת בקוד האתר.");
        return;
    }
    if (!KEY) {
        veil("הקישור הזה חסר את קוד הגישה.");
        return;
    }
    veil("טוען…");
    fetch(API + "?team=1&key=" + encodeURIComponent(KEY)).then(function(r) {
        return r.json();
    }).then(function(d) {
        if (!d || d.status === "denied") {
            veil(d && d.message ? d.message : "הקישור הזה אינו תקף יותר.");
            return;
        }
        if (d.status !== "ok") {
            veil("לא הצלחתי לטעון. נסו לרענן.");
            return;
        }
        var rows = (d.rows || []).slice(1);
        render(rows);
    }).catch(function() {
        veil("לא הצלחתי להתחבר. נסו לרענן.");
    });
}

boot();
