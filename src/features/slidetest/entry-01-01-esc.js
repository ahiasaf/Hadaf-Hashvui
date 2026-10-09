var DEFAULT_ID = "1N8I8RnFBvH-F9Lw-YvotIj1M2w2hU7lF";

var FORMS = [ [ "תצוגה מקדימה (thumbnail)", "כל סוג קובץ", function(id) {
    return "https://drive.google.com/thumbnail?id=" + id + "&sz=w1600";
} ], [ "הקובץ עצמו (uc)", "תמונות בלבד", function(id) {
    return "https://drive.google.com/uc?export=view&id=" + id;
} ], [ "שרת התמונות (lh3)", "תמונות בלבד", function(id) {
    return "https://lh3.googleusercontent.com/d/" + id + "=w1600";
} ] ];

var results = [];

function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function settle(i, ok, why) {
    if (results[i] !== null) return;
    results[i] = ok;
    var chip = document.getElementById("chip-" + i);
    chip.className = "chip " + (ok ? "ok" : "bad");
    chip.textContent = ok ? "נטען" : why || "נכשל";
    if (!ok) {
        document.getElementById("shot-" + i).innerHTML = '<span class="empty">התמונה לא הוצגה</span>';
    }
    verdict();
}

function verdict() {
    var done = 0, i;
    for (i = 0; i < results.length; i++) if (results[i] !== null) done++;
    if (done < FORMS.length) return;
    var win = [];
    for (i = 0; i < results.length; i++) if (results[i]) win.push(FORMS[i][0]);
    var box = document.getElementById("verdict");
    var val = document.getElementById("verdict-val");
    if (win.length) {
        box.className = "verdict good";
        val.textContent = "עובד - " + win.join(" · ");
    } else {
        box.className = "verdict none";
        val.textContent = "אף אחת מהשלוש לא נטענה";
    }
}

function run(raw) {
    var id = (raw || "").trim();
    var m = id.match(/\/d\/([A-Za-z0-9_-]{20,})/) || id.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    if (m) id = m[1];
    if (!id) return;
    document.getElementById("fid").value = id;
    results = [];
    var i;
    for (i = 0; i < FORMS.length; i++) results.push(null);
    document.getElementById("verdict").className = "verdict";
    document.getElementById("verdict-val").textContent = "בודק…";
    var h = "";
    for (i = 0; i < FORMS.length; i++) {
        h += '<div class="t"><div class="t-head">' + '<span class="t-name">' + esc(FORMS[i][0]) + "</span>" + '<span class="chip" id="chip-' + i + '">בודק…</span></div>' + '<div class="t-url">' + esc(FORMS[i][2](id)) + "</div>" + '<div class="t-shot" id="shot-' + i + '">' + '<span class="empty">טוען…</span></div></div>';
    }
    document.getElementById("tests").innerHTML = h;
    FORMS.forEach(function(f, k) {
        var im = new Image;
        im.onload = function() {
            if (im.naturalWidth < 20 || im.naturalHeight < 20) {
                settle(k, false, "תמונה ריקה");
                return;
            }
            var shot = document.getElementById("shot-" + k);
            shot.innerHTML = "";
            im.alt = "התוצאה של " + f[0];
            shot.appendChild(im);
            settle(k, true);
        };
        im.onerror = function() {
            settle(k, false);
        };
        im.src = f[2](id);
        setTimeout(function() {
            settle(k, false, "לא ענה");
        }, 3e4);
    });
}

document.getElementById("go").onclick = function() {
    run(document.getElementById("fid").value);
};

document.getElementById("fid").onkeydown = function(e) {
    if (e.key === "Enter") run(this.value);
};

run(DEFAULT_ID);
