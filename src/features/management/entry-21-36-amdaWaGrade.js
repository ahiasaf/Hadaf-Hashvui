function amdaWaGrade(s) {
    var m = String(s || "").replace(/["'׳״\s]/g, "").replace(/^שכבה/, "").replace(/^כיתה/, "");
    return AMDA_GRADES.indexOf(m) >= 0 ? m : "";
}

function amdaWaFile() {
    var inp = document.getElementById("aw-file");
    if (!inp) return;
    inp.value = "";
    inp.click();
}

function amdaWaPicked(inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var rd = new FileReader;
    rd.onload = function() {
        amdaNeedXlsx().then(function() {
            var rows = null;
            try {
                rows = amdaWaFromSheets(XLSX_READ(rd.result));
            } catch (e) {
                rows = null;
            }
            if (!rows || !rows.length) {
                alert(amdaT("waBad"));
                return;
            }
            var p = {
                at: Date.now(),
                rows: rows
            };
            Store.set("amdaPh", p);
            amdaWa.msg = amdaT("waSaving", {
                n: rows.length
            });
            admPane();
            amdaWaPush(p);
        }).catch(function() {
            alert(amdaT("waBad"));
        });
    };
    rd.readAsArrayBuffer(f);
}

var AMDA_PH_COLS = [ "שכבה", "שם משפחה", "שם פרטי", "טלפון" ];

function amdaWaPush(p) {
    var key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    var n = p.rows.length;
    if (!key || !url) {
        amdaWa.msg = amdaT("waNoSave", {
            n: n
        });
        admPane();
        return;
    }
    fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: AMDA_PHONES,
            key: key,
            cols: JSON.stringify(AMDA_PH_COLS),
            rows: JSON.stringify(p.rows)
        })
    }).catch(function() {}).then(function() {
        return new Promise(function(ok) {
            setTimeout(ok, 2500);
        });
    }).then(function() {
        return amdaWaRead();
    }).then(function(got) {
        amdaWa.msg = amdaT(got && got.rows.length === n ? "waSaved" : "waNoSave", {
            n: n
        });
        admPane();
    });
}

function amdaWaRead() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(null);
    return scriptGet({
        read: AMDA_PHONES,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return null;
        var h = d.rows[0] || [], ix = AMDA_PH_COLS.map(function(c) {
            return h.indexOf(c);
        });
        if (d.rows.length && (ix[0] < 0 || ix[1] < 0 || ix[2] < 0 || ix[3] < 0)) return null;
        var rows = [];
        d.rows.slice(1).forEach(function(x) {
            var g = String(x[ix[0]] || ""), l = String(x[ix[1]] || ""), f = String(x[ix[2]] || "");
            if (g && l && f) rows.push([ g, l, f, amdaWaTel(x[ix[3]]) ]);
        });
        return {
            at: Date.now(),
            rows: rows
        };
    }).catch(function() {
        return null;
    });
}

function amdaWaPull(quiet) {
    amdaWaRead().then(function(p) {
        if (p && p.rows.length) {
            Store.set("amdaPh", p);
            if (!quiet) amdaWa.msg = amdaT("waPulled", {
                n: p.rows.length
            });
        } else if (!quiet) amdaWa.msg = amdaT(p ? "waNoPull" : "waNoRead");
        if (p || !quiet) admPane();
    });
}

function amdaWaIdx() {
    var r = amdaRoster() || {
        g: {}
    }, p = amdaPh() || {
        rows: []
    };
    var sig = (r.at || 0) + "|" + (p.at || 0) + "|" + amdaCount(r).n + "|" + p.rows.length;
    if (amdaWa.idx && amdaWa.sig === sig) return amdaWa.idx;
    var stu = [], used = {}, i;
    AMDA_GRADES.forEach(function(g) {
        var cs = r.g[g] || {};
        Object.keys(cs).sort(function(a, b) {
            return a - b;
        }).forEach(function(c) {
            cs[c].forEach(function(n) {
                stu.push({
                    g: g,
                    c: c,
                    n: n,
                    k: amdaWaNorm(n),
                    p: "",
                    f: ""
                });
            });
        });
    });
    var keys = [ function(x) {
        return [ x[1] + " " + x[2] ];
    }, function(x) {
        return [ x[2] + " " + x[1] ];
    }, function(x) {
        return [ x[1] + " " + x[2].split(" ")[0] ];
    } ];
    var sKeys = [ function(s) {
        return [ s.k ];
    }, function(s) {
        return [ s.k ];
    }, function(s) {
        var t = s.k.split(" "), out = [], j;
        for (j = 1; j < t.length; j++) out.push(t.slice(0, j).join(" ") + " " + t[j]);
        return out;
    } ];
    for (var pass = 0; pass < 3; pass++) {
        var map = {};
        p.rows.forEach(function(x, ri) {
            if (used[ri]) return;
            keys[pass]([ x[0], amdaWaNorm(x[1]), amdaWaNorm(x[2]) ]).forEach(function(k) {
                (map[x[0] + "|" + k] = map[x[0] + "|" + k] || []).push(ri);
            });
        });
        var want = {};
        stu.forEach(function(s, si) {
            if (s.r != null) return;
            sKeys[pass](s).forEach(function(k) {
                var hit = map[s.g + "|" + k];
                if (hit && hit.length === 1) (want[hit[0]] = want[hit[0]] || []).push(si);
            });
        });
        for (var ri in want) {
            if (!want.hasOwnProperty(ri) || want[ri].length !== 1 || used[ri]) continue;
            var s = stu[want[ri][0]], x = p.rows[ri];
            if (s.r != null) continue;
            s.r = +ri;
            s.p = x[3];
            s.f = x[2];
            used[ri] = 1;
        }
    }
    var odd = [];
    for (i = 0; i < p.rows.length; i++) {
        if (used[i]) continue;
        var x2 = p.rows[i], nm = x2[1] + " " + x2[2];
        odd.push({
            g: x2[0],
            c: "",
            n: nm,
            k: amdaWaNorm(nm),
            p: x2[3],
            f: x2[2]
        });
    }
    var all = stu.concat(odd);
    amdaWa.sig = sig;
    amdaWa.idx = {
        all: all,
        odd: odd,
        n: stu.length,
        have: stu.filter(function(s) {
            return s.p;
        }).length,
        none: stu.filter(function(s) {
            return s.r != null && !s.p;
        }).length
    };
    return amdaWa.idx;
}

function amdaWaRow(s, i, where) {
    return '<div class="am-cr"><span>' + esc(s.n) + (where ? " <i>" + esc(amdaG(s.g) + (s.c ? " " + s.c : " · " + amdaT("waNoCls"))) + "</i>" : "") + "</span>" + (s.p ? '<a class="aw-wa" href="#" target="_blank" rel="noopener" data-i="' + i + '" onclick="return amdaWaGo(this)">' + esc(amdaT("waBtn")) + "</a>" : "<i>" + esc(amdaT("waNoTel")) + "</i>") + "</div>";
}

function amdaWaGo(a) {
    var s = amdaWaIdx().all[+a.getAttribute("data-i")];
    if (!s || !s.p) return false;
    var msg = String(Store.get("amdaWaMsg", "") || "").split("{שם}").join(s.f || "");
    a.href = "https://wa.me/972" + s.p.slice(1) + (msg.trim() ? "?text=" + encodeURIComponent(msg) : "");
    setTimeout(function() {
        var q = document.getElementById("aw-q");
        if (q && amdaWa.q) {
            q.value = "";
            amdaWaFind("");
            try {
                q.focus();
            } catch (e) {}
        }
    }, 400);
    return true;
}

function amdaWaFind(v) {
    amdaWa.q = v;
    var el = document.getElementById("aw-res");
    if (el) el.innerHTML = amdaWaResHtml();
}

function amdaWaResHtml() {
    var t = amdaWaNorm(amdaWa.q).split(" ").filter(function(x) {
        return x;
    });
    if (!t.length) return "";
    var all = amdaWaIdx().all, h = "", n = 0;
    for (var i = 0; i < all.length && n < 40; i++) {
        var ok = true;
        for (var j = 0; j < t.length; j++) if (all[i].k.indexOf(t[j]) < 0) {
            ok = false;
            break;
        }
        if (ok) {
            h += amdaWaRow(all[i], i, 1);
            n++;
        }
    }
    return h || '<p class="h">' + esc(amdaT("waNoFind")) + "</p>";
}

function amdaWaPick(k, v) {
    if (k === "g") {
        amdaWa.g = amdaWa.g === v ? "" : v;
        amdaWa.c = "";
    } else amdaWa.c = amdaWa.c === v ? "" : v;
    admPane();
}

function amdaWaMsgSet(v) {
    Store.set("amdaWaMsg", v);
}

function admAmdaWa(body) {
    var p = amdaPh(), key = (CFG.readKey || "").trim(), ix = amdaWaIdx(), i;
    var up = '<div class="adm-card" id="aw-adm" style="margin-top:11px"><h4>' + esc(amdaT("waH")) + "</h4>" + '<p class="h">' + esc(amdaT("waLead")) + "</p>" + '<p class="h"><b>' + esc(p && p.rows.length ? amdaT("waHave", {
        p: ix.have,
        n: ix.n
    }) : amdaT("waNone")) + "</b>" + (amdaWa.msg ? "<br>" + esc(amdaWa.msg) : "") + "</p>" + (key ? "" : '<p class="h" style="color:var(--stop)">' + esc(amdaT("admNoKey")) + "</p>");
    if (p && p.rows.length) {
        if (ix.none) up += '<p class="h">' + esc(amdaT("waNoNum", {
            n: ix.none
        })) + "</p>";
        if (ix.odd.length) {
            up += '<details class="am-cl"><summary>' + esc(amdaT("waOdd", {
                n: ix.odd.length
            })) + "</summary>" + ix.odd.map(function(s) {
                return '<div class="am-cr"><span>' + esc(s.n) + "</span><i>" + esc(amdaG(s.g)) + "</i></div>";
            }).join("") + "</details>";
        }
    }
    up += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' + '<button class="btn g" onclick="amdaWaFile()">' + esc(amdaT(p && p.rows.length ? "waRe" : "waLoad")) + "</button>" + (key ? '<button class="btn g" onclick="amdaWaPull()">' + esc(amdaT("waPull")) + "</button>" : "") + '</div><p class="h" style="margin-top:8px">' + esc(amdaT("waHint")) + "</p>" + '<input type="file" id="aw-file" style="display:none" onchange="amdaWaPicked(this)"' + ' accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>';
    var h = "";
    if (ix.all.length) {
        h += '<div class="adm-card"><div class="am-q" style="margin-top:0">' + esc(amdaT("waFind")) + "</div>" + '<input type="search" class="aw-q" id="aw-q" aria-label="' + esc(amdaT("waFind")) + '" value="' + esc(amdaWa.q) + '" oninput="amdaWaFind(this.value)">' + '<div id="aw-res">' + amdaWaResHtml() + "</div>" + '<div class="am-q">' + esc(amdaT("waMsg")) + "</div>" + '<textarea class="aw-ta" rows="3" aria-label="' + esc(amdaT("waMsg")) + '" oninput="amdaWaMsgSet(this.value)">' + esc(Store.get("amdaWaMsg", "") || "") + "</textarea>" + '<div class="am-q">' + esc(amdaT("waPickG")) + '</div><div class="am-grid">';
        AMDA_GRADES.forEach(function(g) {
            h += '<button class="am-b' + (amdaWa.g === g ? " on" : "") + "\" onclick=\"amdaWaPick('g','" + g + "')\">" + esc(amdaG(g)) + "</button>";
        });
        h += "</div>";
        if (amdaWa.g) {
            var cs = [], seen = {}, list = [];
            ix.all.forEach(function(s) {
                if (s.g === amdaWa.g && !seen["c" + s.c]) {
                    seen["c" + s.c] = 1;
                    cs.push(s.c);
                }
            });
            cs.sort(function(a, b) {
                return a === "" ? 1 : b === "" ? -1 : a - b;
            });
            h += '<div class="am-q">' + esc(amdaT("waPickC")) + '</div><div class="am-grid">' + cs.map(function(c) {
                return '<button class="am-b' + (amdaWa.c === (c || "-") ? " on" : "") + (c ? "" : " aw-nc") + "\" onclick=\"amdaWaPick('c','" + esc(c || "-") + "')\">" + esc(c || amdaT("waNoCls")) + "</button>";
            }).join("") + "</div>";
            if (amdaWa.c) {
                var cv = amdaWa.c === "-" ? "" : amdaWa.c;
                for (i = 0; i < ix.all.length; i++) {
                    if (ix.all[i].g === amdaWa.g && ix.all[i].c === cv) list.push(i);
                }
                list.sort(function(a, b) {
                    return ix.all[a].n < ix.all[b].n ? -1 : 1;
                });
                h += '<div class="am-q">' + esc(amdaG(amdaWa.g) + (cv ? " " + cv : " · " + amdaT("waNoCls"))) + " · " + list.length + "</div>" + list.map(function(j) {
                    return amdaWaRow(ix.all[j], j, 0);
                }).join("");
            }
        }
        h += "</div>";
    }
    body.innerHTML = h + up;
    if (!amdaWa.q) {
        var qi = document.getElementById("aw-q");
        if (qi) try {
            qi.focus();
        } catch (e) {}
    }
    if (key && !(p && p.rows.length) && Date.now() - amdaWa.admAt > 6e4) {
        amdaWa.admAt = Date.now();
        amdaWaPull(1);
    }
}

function sugCur(track) {
    var t = track || homeTrack;
    var c = CV("sugya") || {};
    if (!c[t]) {
        var d = SUGYA[t] || {};
        c[t] = {
            base: d.base || "",
            fmt: d.fmt || "",
            books: JSON.parse(JSON.stringify(d.books || {})),
            pages: JSON.parse(JSON.stringify(d.pages || {}))
        };
    }
    return c;
}

function admSugyaSet(k, v) {
    var t = dkSel && dkSel.mas || homeTrack;
    var c = sugCur(t);
    c[t][k] = v.trim();
    cfgSet("sugya", c);
}

function admSugyaPage(daf, v) {
    var t = dkSel && dkSel.mas || homeTrack;
    var c = sugCur(t), pg = c[t].pages = c[t].pages || {};
    var was = pg[daf], book = was && was.length === 2 ? was[0] : null;
    if (!v.trim()) delete pg[daf]; else pg[daf] = book ? [ book, parseInt(v, 10) || 0 ] : parseInt(v, 10) || "";
    cfgSet("sugya", c);
}

var clockMsg = "", clockOn = null;

function clockCard() {
    var state = clockOn === null ? "טרם נבדק" : clockOn ? "פעיל · מצית הרצה כל חצי שעה" : "אינו מותקן";
    return '<div class="adm-card" style="margin-bottom:11px">' + "<h4>שעון השליחות</h4>" + '<p class="h">מה שמקפיץ את התזכורות שלך ואת העדכון לר"מים ' + "במועד. הקרון של גיטהאב מאחר ומדלג - הטריגר של גוגל לא.<br>" + "<b>מצב: " + esc(state) + "</b></p>" + '<button class="btn p" style="margin:0 0 8px" ' + "onclick=\"clockGo('clock')\">התקנת השעון</button>" + '<button class="btn g" style="margin:0" ' + "onclick=\"clockGo('clockstate')\">בדיקה</button>" + (clockMsg ? '<div class="msg" style="white-space:pre-line;' + 'text-align:start;padding:14px 4px">' + esc(clockMsg) + "</div>" : "") + "</div>";
}

function clockGo(what) {
    var k = (CFG.readKey || "").trim();
    if (!k) {
        clockMsg = "חסרה סיסמת הקריאה. הכניסו אותה בכרטיס שרת ההרשמות.";
        admPane();
        return;
    }
    clockMsg = "רגע…";
    admPane();
    scriptGet({
        setup: what,
        key: k
    }).then(function(d) {
        if (!d || !d.status) {
            clockMsg = "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return;
        }
        if (d.status !== "ok") {
            clockMsg = d.message || "הסקריפט סירב.";
            admPane();
            return;
        }
        clockOn = !!d.clock;
        clockMsg = d.message || "";
        admPane();
    }).catch(function() {
        clockMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

var SCRIPT_MIN = 19;

function pingScript(url) {
    return fetch(url, {
        method: "GET"
    }).then(function(r) {
        return r.json();
    }).catch(function() {
        return pingJsonp(url);
    });
}

function pingJsonp(url) {
    return new Promise(function(ok, fail) {
        var name = "__ping" + Date.now();
        var s = document.createElement("script");
        var done = function(v) {
            try {
                delete window[name];
            } catch (e) {
                window[name] = undefined;
            }
            clearTimeout(t);
            s.remove();
            v ? ok(v) : fail(new Error("timeout"));
        };
        var t = setTimeout(function() {
            done(null);
        }, 12e3);
        window[name] = function(d) {
            done(d);
        };
        s.onerror = function() {
            done(null);
        };
        s.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "callback=" + name;
        document.body.appendChild(s);
    });
}
