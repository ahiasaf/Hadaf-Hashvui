function amdaLesSave(list) {
    Store.set("amdaLessons", list);
    var key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    if (!key || !url) {
        amdaMsg = amdaT("lesNoSave");
        admPane();
        return;
    }
    amdaMsg = amdaT("lesSaving");
    admPane();
    fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: AMDA_LESSONS,
            key: key,
            cols: JSON.stringify([ "מזהה", "שכבה", "כיתה", "יום", "טורים" ]),
            rows: JSON.stringify(list.map(function(l) {
                return [ l.id, l.g, l.c, l.day, l.cols ];
            }))
        })
    }).catch(function() {}).then(function() {
        return new Promise(function(ok) {
            setTimeout(ok, 2500);
        });
    }).then(amdaLesRead).then(function(got) {
        amdaMsg = amdaT(got && got.length === list.length ? "lesSaved" : "lesNoSave");
        admPane();
    });
}

function amdaLesRead() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(null);
    return scriptGet({
        read: AMDA_LESSONS,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows || !d.rows.length) return null;
        var h = d.rows[0], col = function(x, n) {
            var i = h.indexOf(n);
            return i < 0 ? "" : String(x[i] || "");
        };
        if (h.indexOf("מזהה") < 0) return null;
        return d.rows.slice(1).map(function(x) {
            return {
                id: col(x, "מזהה"),
                g: col(x, "שכבה"),
                c: col(x, "כיתה"),
                day: parseInt(col(x, "יום"), 10) || 0,
                cols: col(x, "טורים")
            };
        }).filter(function(l) {
            return l.id && l.g && l.c;
        });
    }).catch(function() {
        return null;
    });
}

function amdaLesAdd() {
    var g = document.getElementById("les-g").value, c = String(document.getElementById("les-c").value).replace(/\D/g, "");
    var day = parseInt(document.getElementById("les-d").value, 10) || 0;
    var cols = String(document.getElementById("les-cols").value).replace(/\s/g, "");
    if (!g || !c || !/^\d+(,\d+)*$/.test(cols)) {
        alert(amdaT("lesBad"));
        return;
    }
    var id = g + c + "-" + day, list = amdaLessons().filter(function(l) {
        return l.id !== id;
    });
    list.push({
        id: id,
        g: g,
        c: c,
        day: day,
        cols: cols
    });
    amdaLesSave(list);
}

function amdaLesDel(id) {
    if (!confirm(amdaT("lesDel"))) return;
    amdaLesSave(amdaLessons().filter(function(l) {
        return l.id !== id;
    }));
}

function amdaLesCard() {
    var days = amdaT("days").split(",");
    return '<div class="adm-card"><h4>' + esc(amdaT("lessonsH")) + "</h4>" + '<p class="h">' + esc(amdaT("lessonsLead")) + "</p>" + amdaLessons().map(function(l) {
        return '<div class="am-cr"><span>' + esc(amdaLessonName(l)) + "</span><i>" + esc(l.cols) + ' <button class="am-x" onclick="amdaLesDel(\'' + esc(l.id) + "')\">✕</button></i></div>";
    }).join("") + '<div class="am-q">' + esc(amdaT("lessonAdd")) + "</div>" + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + '<select id="les-g" aria-label="' + esc(amdaT("lessonG")) + '">' + AMDA_GRADES.map(function(g) {
        return '<option value="' + g + '">' + esc(amdaG(g)) + "</option>";
    }).join("") + "</select>" + '<input id="les-c" type="tel" style="width:90px" aria-label="' + esc(amdaT("lessonC")) + '" placeholder="' + esc(amdaT("lessonC")) + '">' + '<select id="les-d" aria-label="' + esc(amdaT("lessonDay")) + '">' + days.map(function(d, i) {
        return '<option value="' + i + '">' + esc(d.trim()) + "</option>";
    }).join("") + "</select></div>" + '<p class="h" style="margin-top:8px">' + esc(amdaT("lessonCols")) + "</p>" + '<input id="les-cols" type="text" style="width:100%" value="3,3,3,4,4" aria-label="' + esc(amdaT("lessonCols")) + '">' + '<button class="btn g" style="width:100%;margin-top:8px" onclick="amdaLesAdd()">' + esc(amdaT("lessonAdd")) + "</button></div>";
}

function amdaPickSlot(id) {
    amdaSt.slot = id;
    admPane();
}

var AMDA_ICON = {
    Pray: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 21a9 9 0 0 1 18 0z"/>' + '<rect x="3" y="23" width="26" height="2.4" rx="1.2"/><rect x="15" y="4" width="2.4" height="5" rx="1.2"/>' + '<rect x="5.2" y="8.4" width="2.4" height="5" rx="1.2" transform="rotate(-45 6.4 10.9)"/>' + '<rect x="24.4" y="8.4" width="2.4" height="5" rx="1.2" transform="rotate(45 25.6 10.9)"/></svg>',
    Noded: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20.5 4.5A11.5 11.5 0 1 0 27.5 22 9.5 9.5 0 0 1 20.5 4.5z"/>' + '<path d="M25 6l.9 2.1 2.1.9-2.1.9L25 12l-.9-2.1-2.1-.9 2.1-.9z"/></svg>',
    L: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="26" height="16" rx="2"/>' + '<rect x="8" y="23" width="2.4" height="6" rx="1.2"/><rect x="21.6" y="23" width="2.4" height="6" rx="1.2"/></svg>'
};

function amdaTiles(slot) {
    var d = new Date, dow = d.getDay(), t = d.getHours() * 60 + d.getMinutes();
    return '<div class="am-tiles">' + AMDA_SLOTS.concat(amdaLessons().map(function(l) {
        return "L" + l.id;
    })).map(function(id) {
        var les = amdaLesson(id), big = les ? "" : amdaT("slot" + id + "Big");
        var face = les ? '<span class="am-ic">' + AMDA_ICON.L + "<b>" + esc(amdaG(les.g) + les.c) + "</b></span>" : big ? '<span class="am-dig">' + esc(big) + "</span>" : '<span class="am-ic">' + (AMDA_ICON[id] || "") + "</span>";
        var sub = les ? (amdaT("days").split(",")[les.day] || "").trim() : amdaT("slot" + id + "T");
        var w = les ? null : amdaSlotWin(id);
        var isNow = les ? les.day === dow : !!(w && t >= w[0] && t < w[1]);
        return '<button class="am-tile' + (id === slot ? " on" : "") + '" onclick="amdaPickSlot(\'' + esc(id) + "')\">" + (isNow ? "<em>" + esc(amdaT("slotNow")) + "</em>" : "") + face + "<b>" + esc(les ? amdaT("lessonTag") : amdaSlotName(id)) + "</b><small>" + esc(sub) + "</small></button>";
    }).join("") + "</div>";
}

function amdaPickTrack(id) {
    amdaSt.track = id;
    admPane();
}

function amdaByClass(keys) {
    var by = {}, order = [];
    keys.forEach(function(k) {
        var p = k.split("|"), cl = p[0] + "|" + p[1];
        if (!by[cl]) {
            by[cl] = [];
            order.push(cl);
        }
        by[cl].push(k);
    });
    order.sort(function(a, b) {
        var x = a.split("|"), y = b.split("|");
        return AMDA_GRADES.indexOf(x[0]) - AMDA_GRADES.indexOf(y[0]) || x[1] - y[1];
    });
    return order.map(function(cl) {
        var p = cl.split("|");
        return {
            name: amdaG(p[0]) + p[1],
            keys: by[cl]
        };
    });
}

function amdaNm(k) {
    return k.split("|").slice(2).join("|");
}

function admAmda(body) {
    var r = amdaRoster(), cnt = amdaCount(r), key = (CFG.readKey || "").trim();
    var q = amdaQ(), slot = amdaSlotSel(), inst = amdaInst(), tracks = amdaTracks();
    var h = '<div class="adm-card" id="amda-adm"><h4>' + esc(amdaT("admH")) + "</h4>" + '<p class="h">' + esc(amdaT("admLead")) + "</p>" + '<p class="h"><b>' + esc(cnt.n ? amdaT("admHave", cnt) : amdaT("admNone")) + "</b>" + (amdaMsg ? "<br>" + esc(amdaMsg) : "") + "</p>" + (key ? "" : '<p class="h" style="color:var(--stop)">' + esc(amdaT("admNoKey")) + "</p>");
    if (cnt.n) {
        h += '<div class="am-q">' + esc(amdaT("admWhen")) + "</div>" + amdaTiles(slot);
        if (tracks.length > 1) {
            h += '<div class="am-q">' + esc(amdaT("admTrack")) + '</div><div class="am-sl">' + tracks.map(function(id) {
                var t = trackById(id);
                return '<button class="' + (id === amdaTrack() ? "on" : "") + '" onclick="amdaPickTrack(\'' + id + "')\">" + esc(t ? t.masechet : id) + "</button>";
            }).join("") + "</div>";
        }
        var les = amdaLesson(slot);
        if (les) {
            var ask = amdaSeatAsk(les.id);
            h += '<div class="am-q">' + esc(amdaT("seatAskQ")) + '</div><div class="am-sl">' + '<button class="' + (ask ? "" : "on") + '" onclick="amdaSeatAskSet(\'' + esc(les.id) + "',0)\">" + esc(amdaT("seatAskOff")) + "</button>" + '<button class="' + (ask ? "on" : "") + '" onclick="amdaSeatAskSet(\'' + esc(les.id) + "',1)\">" + esc(amdaT("seatAskOn")) + "</button></div>" + '<button class="btn p" style="width:100%;margin:6px 0 8px" onclick="amdaOpen(\'o\')">' + esc(amdaT("admOpenL")) + "</button>" + '<button class="btn p" style="width:100%;margin:0 0 8px" onclick="amdaBoard(\'' + esc(slot) + "')\">" + esc(amdaT("admBoard")) + "</button>" + '<button class="btn g" style="width:100%;margin:0 0 12px" onclick="amdaOpen(\'d\')">' + esc(amdaT("admOpenLD")) + "</button>";
        } else {
            var kd = amdaKindEff(), lv = amdaLv();
            h += '<div class="am-q">' + esc(amdaT("admDaf")) + '</div><div class="am-sl">' + '<button class="' + (kd === "d" ? "on" : "") + '" onclick="amdaKindPick(\'d\')">' + esc(amdaT("admDafOn")) + "</button>" + '<button class="' + (kd === "o" ? "on" : "") + '" onclick="amdaKindPick(\'o\')">' + esc(amdaT("admDafOff")) + "</button></div>" + '<p class="h" style="margin:-4px 2px 8px">' + esc(amdaT(amdaSt.kind ? "admDafHand" : "admDafAuto", {
                t: amdaT("dafTimes") || "-"
            })) + "</p>";
            if (kd === "d") {
                h += '<div class="am-q">' + esc(amdaT("admLv")) + '</div><div class="am-sl">' + AMDA_LV.map(function(v, i) {
                    return '<button class="' + (lv === v ? "on" : "") + '" onclick="amdaLvSet(\'' + v + "')\">" + esc(amdaT("lv" + i)) + "</button>";
                }).join("") + "</div>";
            }
            h += '<button class="btn p" style="width:100%;margin:6px 0 12px" onclick="amdaOpen(amdaKindEff())">' + esc(amdaT("admOne")) + "</button>";
        }
    }
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap">' + '<button class="btn g" onclick="amdaFile()">' + esc(cnt.n ? amdaT("admRe") : amdaT("admLoad")) + "</button>" + (key ? '<button class="btn g" onclick="amdaPullRoster()">' + esc(amdaT("admPull")) + "</button>" : "") + '</div><p class="h" style="margin-top:8px">' + esc(amdaT("admHint")) + "</p>";
    if (cnt.n) {
        h += '<div class="am-q">' + esc(amdaT("admInst")) + "</div>" + '<select style="width:100%" aria-label="' + esc(amdaT("admInst")) + '" onchange="amdaSetInst(this.value)"><option value="">' + esc(amdaT("admInstNone")) + "</option>" + INSTITUTIONS.map(function(i) {
            return '<option value="' + esc(i.code) + '"' + (i.code === inst ? " selected" : "") + ">" + esc(i.name) + "</option>";
        }).join("") + "</select>" + (inst ? "" : '<p class="h" style="color:var(--stop);margin-top:6px">' + esc(amdaT("admNoInst")) + "</p>");
    }
    h += '<input type="file" id="amda-file" style="display:none" onchange="amdaPicked(this)"' + ' accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>';
    var had = Object.keys(amdaHadNow(amdaDay() + "|" + slot));
    h += '<div class="adm-card"><h4>' + esc(amdaT("admSess", {
        slot: amdaSlotName(slot),
        n: had.length
    })) + "</h4>" + (q.length ? '<p class="h">' + esc(amdaT("admWait", {
        n: q.length
    })) + "</p>" : "") + amdaByClass(had).map(function(cl) {
        return '<p class="h"><b>' + esc(cl.name) + " · " + cl.keys.length + "</b><br>" + cl.keys.map(function(k) {
            return esc(amdaNm(k));
        }).join(" · ") + "</p>";
    }).join("") + "</div>";
    var all = amdaCounts(), ks = Object.keys(all), tot = amdaC4();
    ks.forEach(function(k) {
        for (var b = 0; b < 4; b++) tot[b] += all[k][b];
    });
    h += '<div class="adm-card"><h4>' + esc(amdaT("admCntH")) + "</h4>" + '<p class="h">' + esc(ks.length ? amdaT("admCntTot", {
        d: tot[0],
        o: tot[1],
        n: tot[2]
    }) : amdaT("admCntNone")) + (tot[3] ? "<br>" + esc(amdaT("admCntLTot", {
        l: tot[3]
    })) : "") + "</p>" + amdaByClass(ks).map(function(cl) {
        cl.keys.sort(function(a, b) {
            return amdaNm(a) < amdaNm(b) ? -1 : 1;
        });
        return '<details class="am-cl"><summary>' + esc(cl.name) + " · " + cl.keys.length + "</summary>" + cl.keys.map(function(k) {
            var mk = amdaMkOf(k);
            return '<div class="am-cr"><span>' + esc(amdaNm(k)) + "</span><i>" + esc(amdaT("admCntRow", {
                d: all[k][0],
                o: all[k][1],
                n: all[k][2]
            })) + (all[k][3] ? "<br>" + esc(amdaT("admCntL", {
                l: all[k][3]
            })) : "") + (mk[0] || mk[1] ? "<br>" + esc(amdaT("admCntP", {
                p: mk[0]
            })) + (mk[1] ? ' · <em class="am-red">' + esc(amdaT("admCntD", {
                d: mk[1]
            })) + "</em>" : "") : "") + "</i></div>";
        }).join("") + "</details>";
    }).join("") + "</div>" + (cnt.n ? amdaLesCard() : "");
    body.innerHTML = h;
    if (key && Date.now() - (amdaSt.admAt || 0) > 6e4) {
        amdaSt.admAt = Date.now();
        amdaFlush();
        amdaPull();
        amdaLesRead().then(function(l) {
            if (!l || JSON.stringify(l) === JSON.stringify(amdaLessons())) return;
            Store.set("amdaLessons", l);
            admPane();
        });
    }
}

var AMDA_PHONES = "טלפוני תלמידים";

var amdaWa = {
    g: "",
    c: "",
    q: "",
    msg: "",
    admAt: 0
};

function amdaPh() {
    return Store.get("amdaPh", null);
}

function amdaWaNorm(s) {
    return String(s || "").replace(/["'׳״`.\-־]/g, " ").replace(/\s+/g, " ").trim();
}

function amdaWaTel(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (/^972\d{8,9}$/.test(d)) d = "0" + d.slice(3);
    if (/^[2-9]\d{7,8}$/.test(d)) d = "0" + d;
    return /^0\d{8,9}$/.test(d) ? d : "";
}

function amdaWaFromSheets(sheets) {
    var out = [], i, j;
    for (i = 0; i < sheets.length; i++) {
        var rows = sheets[i].rows, col = null;
        var sg = amdaWaGrade(sheets[i].name);
        for (j = 0; j < rows.length; j++) {
            var v = rows[j], k;
            if (!col) {
                var c = {};
                for (k in v) {
                    if (!v.hasOwnProperty(k)) continue;
                    var t = String(v[k] || "");
                    if (/משפחה/.test(t)) c.l = k; else if (/פרטי/.test(t)) c.f = k; else if (/טלפון|נייד/.test(t)) c.p = k; else if (/שכבה/.test(t)) c.g = k;
                }
                if (c.l && c.f && c.p) {
                    col = c;
                    continue;
                }
            }
            var cc = col || {
                l: "B",
                f: "C",
                p: "D"
            };
            var g = cc.g ? amdaWaGrade(v[cc.g]) : sg;
            var l = String(v[cc.l] || "").replace(/\s+/g, " ").trim(), f = String(v[cc.f] || "").replace(/\s+/g, " ").trim();
            if (!g || !l || !f || !col && /משפחה|פרטי/.test(l + f)) continue;
            out.push([ g, l, f, amdaWaTel(v[cc.p]) ]);
        }
    }
    return out;
}
