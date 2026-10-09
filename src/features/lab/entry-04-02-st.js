function st(k, v) {
    return '<div class="stat"><span>' + k + "</span><b>" + v + "</b></div>";
}

function tallyKey() {
    return "df:lab";
}

function tally() {
    try {
        return JSON.parse(localStorage.getItem(tallyKey()) || "{}");
    } catch (e) {
        return {};
    }
}

function mark(good) {
    var t = tally();
    t[selVal("mas") + "|" + dafKey(selVal("daf")) + "|" + selVal("pg")] = good ? 1 : 0;
    localStorage.setItem(tallyKey(), JSON.stringify(t));
    paintTally();
    step(1);
}

function paintTally() {
    var t = tally(), n = 0, y = 0;
    for (var k in t) {
        n++;
        if (t[k]) y++;
    }
    var me = t[selVal("mas") + "|" + dafKey(selVal("daf")) + "|" + selVal("pg")];
    $("tally").innerHTML = n ? "<b>" + y + "</b> מתוך <b>" + n + "</b> נתפסו · " + Math.round(y / n * 100) + "%" + (me === undefined ? "" : " · הדף הזה סומן כ" + (me ? "תקין" : "שגוי")) : "עוד לא נוקד אף דף.";
}

function step(d) {
    var pg = $("pg"), df = $("daf");
    var i = +pg.value + d;
    if (pg._items && i >= 0 && i < pg._items.length) {
        pg.value = i;
        showPage(+selVal("pg"));
        return;
    }
    var j = +df.value + d;
    if (df._items && j >= 0 && j < df._items.length) {
        df.value = j;
        openDaf();
    }
}

function onMas() {
    var m = selVal("mas");
    var links = (window.DAF_LINKS || {})[m] || {};
    var cal = (m === "megila" ? CAL_MEGILA : CAL_TAANIT) || [];
    var opts = [], seen = {};
    cal.forEach(function(row) {
        var d = row[2];
        if (!d || d === "סיום" || seen[dafKey(d)] || !links[dafKey(d)]) return;
        seen[dafKey(d)] = 1;
        opts.push([ d, "דף " + d ]);
    });
    if (!opts.length) {
        say("אין קישורים למסכת הזו.", 1);
        return;
    }
    fillSel($("daf"), opts);
    openDaf();
}

window.addEventListener("DOMContentLoaded", function() {
    fillSel($("mas"), [ [ "taanit", "תענית" ], [ "megila", "מגילה" ] ]);
    fillSel($("pg"), [ [ 1, "ע״א" ] ]);
    $("mas").onchange = onMas;
    $("daf").onchange = openDaf;
    $("pg").onchange = function() {
        showPage(+selVal("pg"));
    };
    $("next").onclick = function() {
        step(1);
    };
    $("prev").onclick = function() {
        step(-1);
    };
    $("hit").onclick = function() {
        mark(true);
    };
    $("miss").onclick = function() {
        mark(false);
    };
    paintTally();
    onMas();
});
