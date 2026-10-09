(function() {
    "use strict";
    var KEY = "tiul.v1";
    var S = null;
    var goneOpen = false;
    var openNote = null;
    var focusNote = false;
    function blank() {
        return {
            v: 2,
            title: "",
            seq: 0,
            kids: [],
            ok: {},
            note: {},
            phase: 1,
            out: {},
            here: {},
            round: 1,
            roundAt: 0
        };
    }
    function load() {
        var raw = null;
        try {
            raw = localStorage.getItem(KEY);
        } catch (e) {
            raw = null;
        }
        if (raw) {
            try {
                S = JSON.parse(raw);
            } catch (e2) {
                S = null;
            }
        }
        if (!S || !S.kids || !S.kids.length) {
            S = blank();
            return false;
        }
        if (!S.v || S.v < 2) {
            S.v = 2;
            S.phase = 1;
            S.out = {};
            S.roundAt = 0;
        }
        if (!S.here) S.here = {};
        if (!S.ok) S.ok = {};
        if (!S.out) S.out = {};
        if (!S.note) S.note = {};
        if (!S.round) S.round = 1;
        if (!S.phase) S.phase = 1;
        if (!S.seq) S.seq = S.kids.length;
        return true;
    }
    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(S));
        } catch (e) {}
    }
    function $(id) {
        return document.getElementById(id);
    }
    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function count(o) {
        var n = 0, k;
        for (k in o) {
            if (o.hasOwnProperty(k)) n++;
        }
        return n;
    }
    function hhmm(ts) {
        var d = ts ? new Date(ts) : new Date;
        var h = d.getHours(), m = d.getMinutes();
        return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
    }
    function onTrip() {
        var out = [], i;
        for (i = 0; i < S.kids.length; i++) {
            if (!S.out[S.kids[i].id]) out.push(S.kids[i]);
        }
        return out;
    }
    function offTrip() {
        var out = [], i;
        for (i = 0; i < S.kids.length; i++) {
            if (S.out[S.kids[i].id]) out.push(S.kids[i]);
        }
        return out;
    }
    function show(which) {
        $("vSetup").className = "view" + (which === "setup" ? " on" : "");
        $("vList").className = "view" + (which === "list" ? " on" : "");
        $("bar").style.display = which === "list" ? "" : "none";
        $("bEdit").style.display = which === "list" ? "" : "none";
        window.scrollTo(0, 0);
    }
    function parseNames(text) {
        var ls = String(text || "").split(/\r?\n/);
        var out = [], i, s;
        for (i = 0; i < ls.length; i++) {
            s = ls[i].replace(/^[\s‏‎]*\d+[\s.)\--]*/, "");
            s = s.replace(/^\s+|\s+$/g, "");
            if (s) out.push(s);
        }
        return out;
    }
    function applyNames(names) {
        var old = S.kids, taken = {}, out = [], i, j, id;
        for (i = 0; i < names.length; i++) {
            id = null;
            for (j = 0; j < old.length; j++) {
                if (!taken[j] && old[j].n === names[i]) {
                    id = old[j].id;
                    taken[j] = 1;
                    break;
                }
            }
            if (!id) {
                S.seq++;
                id = "k" + S.seq;
            }
            out.push({
                id: id,
                n: names[i]
            });
        }
        S.kids = out;
        var live = {};
        for (i = 0; i < out.length; i++) live[out[i].id] = 1;
        var maps = [ S.here, S.ok, S.out, S.note ], m, k;
        for (i = 0; i < maps.length; i++) {
            m = maps[i];
            for (k in m) {
                if (m.hasOwnProperty(k) && !live[k]) delete m[k];
            }
        }
    }
    function render() {
        var trip = onTrip(), off = offTrip();
        var h = "", i, k, on, ok, here = 0, noSlip = 0;
        var p1 = S.phase === 1;
        for (i = 0; i < trip.length; i++) {
            k = trip[i];
            on = !!S.here[k.id];
            ok = !!S.ok[k.id];
            if (on) here++;
            if (!ok) noSlip++;
            var txt = S.note[k.id] || "";
            var open = openNote === k.id;
            h += '<div class="item">' + '<button class="row' + (on ? " on" : "") + '" data-k="' + k.id + '">' + '<span class="num">' + (i + 1) + "</span>" + '<span class="tick">✓</span>' + '<span class="nm">' + esc(k.n) + "</span>" + (p1 ? '<span class="chip' + (ok ? " yes" : "") + '" data-p="' + k.id + '">' + (ok ? "הורים ✓" : "הורים") + "</span>" : "") + '<span class="pen' + (txt ? " has" : "") + '" data-n="' + k.id + '">✎</span>' + "</button>" + (open ? '<div class="note"><textarea class="ntxt" data-t="' + k.id + '"' + ' placeholder="משהו שכדאי לזכור">' + esc(txt) + "</textarea>" + '<button class="nclose" data-c="' + k.id + '">סגור</button></div>' : "") + "</div>";
        }
        if (off.length) {
            h += '<div class="gone">' + '<button class="goneh" id="bGoneT">לא הגיעו לטיול (' + off.length + ") " + (goneOpen ? "▴" : "▾") + "</button>" + '<div class="gonel' + (goneOpen ? " open" : "") + '">';
            for (i = 0; i < off.length; i++) {
                h += '<div class="grow"><span class="nm">' + esc(off[i].n) + "</span>" + '<button class="back" data-b="' + off[i].id + '">החזר לטיול</button></div>';
            }
            h += "</div></div>";
        }
        $("list").innerHTML = h || '<p class="empty">הרשימה ריקה.</p>';
        $("ttl").textContent = S.title || "מפקד טיול";
        $("rnd").textContent = p1 ? "עלייה לאוטובוס" : "סבב " + S.round + " · " + hhmm(S.roundAt);
        $("cnt").textContent = here;
        $("of").textContent = "מתוך " + trip.length + (p1 ? " עלו" : " נמצאים");
        $("miss").textContent = p1 ? noSlip ? noSlip + " ללא אישור הורים" : "" : trip.length - here ? trip.length - here + " חסרים" : "";
        $("bMain").textContent = p1 ? "סיום עלייה לאוטובוס" : "סבב חדש";
        if (focusNote && openNote) {
            var ta = $("list").querySelector(".ntxt");
            if (ta) {
                ta.focus();
                ta.setSelectionRange(ta.value.length, ta.value.length);
            }
        }
        focusNote = false;
    }
    function listOf(arr) {
        var t = "", i;
        for (i = 0; i < arr.length; i++) t += i + 1 + ". " + arr[i].n + "\n";
        return t;
    }
    function report() {
        var trip = onTrip(), off = offTrip();
        var yes = [], no = [], i;
        for (i = 0; i < trip.length; i++) {
            (S.here[trip[i].id] ? yes : no).push(trip[i]);
        }
        var t = (S.title || "מפקד טיול") + "\n";
        if (S.phase === 1) {
            t += "עלייה לאוטובוס · " + hhmm(0) + "\n";
            t += "עלו " + yes.length + " מתוך " + trip.length + "\n";
            t += "\nעלו (" + yes.length + "):\n" + (yes.length ? listOf(yes) : "- אף אחד\n");
            t += "\nלא עלו (" + no.length + "):\n" + (no.length ? listOf(no) : "- כולם עלו\n");
            return t;
        }
        t += "סבב " + S.round + " · " + hhmm(0) + "\n";
        t += "נמצאים " + yes.length + " מתוך " + trip.length + "\n";
        t += "\nחסרים עכשיו (" + no.length + "):\n" + (no.length ? listOf(no) : "- כולם נמצאים\n");
        t += "\nנמצאים (" + yes.length + "):\n" + (yes.length ? listOf(yes) : "- אף אחד\n");
        if (off.length) {
            t += "\nלא הגיעו לטיול (" + off.length + "):\n" + listOf(off);
        }
        return t;
    }
    function toWhatsApp(txt) {
        window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
    }
    function closeBoarding() {
        var trip = onTrip(), no = [], i;
        for (i = 0; i < trip.length; i++) {
            if (!S.here[trip[i].id]) no.push(trip[i]);
        }
        if (!count(S.here)) {
            window.alert("לא סימנת אף תלמיד שעלה לאוטובוס.");
            return;
        }
        var names = "", shown = Math.min(no.length, 12);
        for (i = 0; i < shown; i++) names += "· " + no[i].n + "\n";
        if (no.length > shown) names += "· ועוד " + (no.length - shown) + "\n";
        var q = no.length ? no.length + " תלמידים לא עלו לאוטובוס:\n" + names + "\nהם יצאו מהרשימה לשאר הטיול, ורשימתם תישלח לוואטסאפ.\nלהמשיך לסבבים?" : "כל הכיתה עלתה לאוטובוס.\nלסגור את מפקד העלייה ולעבור לסבבים?";
        if (!window.confirm(q)) return;
        var txt = report();
        for (i = 0; i < no.length; i++) S.out[no[i].id] = 1;
        S.phase = 2;
        S.round = 1;
        S.roundAt = (new Date).getTime();
        goneOpen = false;
        openNote = null;
        save();
        render();
        toWhatsApp(txt);
    }
    function newRound() {
        var n = count(S.here);
        if (n && !window.confirm("למחוק את הסימונים של " + n + " תלמידים ולפתוח סבב חדש?")) return;
        S.here = {};
        S.round++;
        S.roundAt = (new Date).getTime();
        save();
        render();
        window.scrollTo(0, 0);
    }
    $("list").addEventListener("click", function(e) {
        var el = e.target, id = null, kind = null;
        while (el && el !== this) {
            if (el.getAttribute) {
                if (el.getAttribute("data-p")) {
                    id = el.getAttribute("data-p");
                    kind = "ok";
                    break;
                }
                if (el.getAttribute("data-n")) {
                    id = el.getAttribute("data-n");
                    kind = "note";
                    break;
                }
                if (el.getAttribute("data-c")) {
                    id = el.getAttribute("data-c");
                    kind = "shut";
                    break;
                }
                if (el.getAttribute("data-b")) {
                    id = el.getAttribute("data-b");
                    kind = "back";
                    break;
                }
                if (el.getAttribute("data-k")) {
                    id = el.getAttribute("data-k");
                    kind = "here";
                    break;
                }
                if (el.id === "bGoneT") {
                    kind = "toggle";
                    break;
                }
            }
            el = el.parentNode;
        }
        if (!kind) return;
        if (kind === "toggle") {
            goneOpen = !goneOpen;
            render();
            return;
        }
        if (kind === "note") {
            focusNote = openNote !== id;
            openNote = openNote === id ? null : id;
            render();
            return;
        }
        if (kind === "shut") {
            openNote = null;
            render();
            return;
        }
        if (kind === "ok") {
            if (S.ok[id]) delete S.ok[id]; else S.ok[id] = 1;
        }
        if (kind === "here") {
            if (S.here[id]) delete S.here[id]; else S.here[id] = 1;
        }
        if (kind === "back") {
            delete S.out[id];
            S.here[id] = 1;
        }
        save();
        render();
    });
    $("list").addEventListener("input", function(e) {
        var el = e.target;
        if (!el || !el.getAttribute) return;
        var id = el.getAttribute("data-t");
        if (!id) return;
        var v = el.value.replace(/^\s+|\s+$/g, "");
        if (v) S.note[id] = el.value; else delete S.note[id];
        save();
    });
    $("bMain").addEventListener("click", function() {
        if (S.phase === 1) closeBoarding(); else newRound();
    });
    $("bWa").addEventListener("click", function() {
        toWhatsApp(report());
    });
    $("bEdit").addEventListener("click", function() {
        var names = [], i;
        for (i = 0; i < S.kids.length; i++) names.push(S.kids[i].n);
        $("iTtl").value = S.title || "";
        $("iNames").value = names.join("\n");
        $("bRestart").style.display = S.phase === 2 ? "" : "none";
        $("bNotes").style.display = count(S.note) ? "" : "none";
        show("setup");
    });
    $("bCancel").addEventListener("click", function() {
        if (!S.kids.length) return;
        render();
        show("list");
    });
    $("bSave").addEventListener("click", function() {
        var names = parseNames($("iNames").value);
        if (!names.length) {
            window.alert("לא נמצא אף שם ברשימה.");
            return;
        }
        S.title = $("iTtl").value.replace(/^\s+|\s+$/g, "");
        applyNames(names);
        save();
        render();
        show("list");
    });
    $("bNotes").addEventListener("click", function() {
        var t = (S.title || "מפקד טיול") + " - הערות\n", n = 0, i, k;
        for (i = 0; i < S.kids.length; i++) {
            k = S.kids[i];
            if (S.note[k.id]) {
                n++;
                t += "\n· " + k.n + "\n" + S.note[k.id] + "\n";
            }
        }
        if (!n) {
            window.alert("עוד לא כתבת הערות.");
            return;
        }
        toWhatsApp(t);
    });
    $("bRestart").addEventListener("click", function() {
        if (!window.confirm("להחזיר את כל התלמידים לרשימה ולפתוח מחדש את מפקד העלייה?")) return;
        S.phase = 1;
        S.out = {};
        S.here = {};
        S.round = 1;
        S.roundAt = 0;
        goneOpen = false;
        openNote = null;
        save();
        render();
        show("list");
    });
    function fromLink() {
        var h = String(window.location.hash || "");
        var m = h.match(/[#&]list=([^&]*)/);
        if (!m) return false;
        var raw = "";
        try {
            raw = decodeURIComponent(m[1].replace(/\+/g, " "));
        } catch (e) {
            return false;
        }
        var ls = raw.split(/\r?\n/);
        var title = (ls.shift() || "").replace(/^\s+|\s+$/g, "");
        var names = parseNames(ls.join("\n"));
        if (!names.length) return false;
        if (S.kids.length && !window.confirm("הקישור נושא רשימה של " + names.length + " תלמידים.\n" + "להחליף את הרשימה הקיימת (" + S.kids.length + ")?")) {
            clearHash();
            return false;
        }
        if (title) S.title = title;
        applyNames(names);
        S.phase = 1;
        S.out = {};
        S.here = {};
        S.round = 1;
        S.roundAt = 0;
        goneOpen = false;
        openNote = null;
        save();
        clearHash();
        return true;
    }
    function clearHash() {
        try {
            if (window.history && window.history.replaceState) {
                window.history.replaceState("", document.title, window.location.pathname + window.location.search);
            } else {
                window.location.hash = "";
            }
        } catch (e) {}
    }
    var had = load();
    if (fromLink()) had = true;
    render();
    show(had ? "list" : "setup");
    if (!had) {
        $("bCancel").style.display = "none";
        $("bRestart").style.display = "none";
        $("bNotes").style.display = "none";
    }
    window.addEventListener("hashchange", function() {
        if (fromLink()) {
            render();
            show("list");
        }
    });
    if ("serviceWorker" in navigator) {
        var warm = function() {
            try {
                fetch("./tiul.html", {
                    cache: "reload"
                });
            } catch (e) {}
        };
        navigator.serviceWorker.addEventListener("controllerchange", warm);
        window.addEventListener("load", function() {
            navigator.serviceWorker.register("./sw.js").then(function() {
                if (navigator.serviceWorker.controller) warm();
            }).catch(function() {});
        });
    }
})();
