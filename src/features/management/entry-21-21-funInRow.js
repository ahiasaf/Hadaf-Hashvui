function funInRow(x) {
    return esc(fill(UI.resRow, {
        o: x.o,
        j: x.j
    }));
}

function funByInst() {
    var per = funPer(function(p) {
        return p[1] || "-";
    });
    var pk = Object.keys(per).sort(function(a, b) {
        return per[b].o - per[a].o;
    });
    return stFold("inst", "🏫", UI.resInst, pk.length ? pk.map(function(c) {
        return funRow(esc(pplName(c, null)), funInRow(per[c]));
    }).join("") : '<p class="h">' + esc(UI.whyNone) + "</p>");
}

function funByDay() {
    var per = funPer(function(p) {
        return p[0];
    });
    var dk = Object.keys(per).sort().reverse();
    return stFold("day", "📅", UI.resDay, dk.length ? dk.slice(0, 14).map(function(k) {
        return funRow(k.split("-").reverse().join("."), funInRow(per[k]));
    }).join("") : '<p class="h">' + esc(UI.whyNone) + "</p>");
}

function funFoot() {
    var F = Store.get("funnel", null);
    if (!F || !F.people) return "";
    var first = F.people.length ? F.people.reduce(function(a, p) {
        return p[0] < a ? p[0] : a;
    }, F.people[0][0]) : "";
    return '<p class="h st-ft">' + esc(fill(UI.resFoot, {
        d: first ? first.split("-").reverse().join(".") : "-",
        t: whenTxt(F.at)
    })) + "</p>";
}

function pplOrderList() {
    var list = (Store.get("registrations", []) || []).slice(), own = regSaved();
    if (own && !list.some(function(r) {
        return r.code === own.code;
    })) list = [ own ].concat(list);
    return list;
}

function pplOrder() {
    var list = Store.get("registrations", []) || [], own = regSaved();
    if (own && !list.some(function(r) {
        return r.code === own.code;
    })) list = [ own ].concat(list);
    var tot = list.reduce(function(a, r) {
        return a + (r.total || 0);
    }, 0);
    pplSet("ppl-ords", "הזמנת הגמרות · " + list.length + " הרשמות · " + tot + " גמרות");
    if (!list.length) {
        pplSet("ppl-ordb", '<p class="h">עוד לא נקראה אף הרשמה מהגיליון.</p>');
        return;
    }
    var per = {}, sum = 0;
    list.forEach(function(r) {
        var q = regMigrate(r);
        TRACKS.forEach(function(t) {
            SFARIM.forEach(function(s) {
                var n = q[qk(t.id, s.id)] || 0;
                per[qk(t.id, s.id)] = (per[qk(t.id, s.id)] || 0) + n;
                sum += n * priceOf(s.id).price;
            });
        });
    });
    pplSet("ppl-ordb", SFARIM.map(function(s) {
        var p = priceOf(s.id);
        var n = TRACKS.reduce(function(a, t) {
            return a + (per[qk(t.id, s.id)] || 0);
        }, 0);
        var gap = p.min - n;
        return '<div class="row" style="padding:7px 0"><span>' + esc(s.name) + (p.min ? ' <span style="color:var(--ink-3)">· יעד ' + p.min + "</span>" : "") + '<div class="sub">' + TRACKS.map(function(t) {
            return t.masechet + " " + (per[qk(t.id, s.id)] || 0);
        }).join(" · ") + "</div></span>" + "<b" + (gap <= 0 ? ' style="color:var(--ok)"' : "") + ">" + n + (p.min && gap > 0 ? ' <span style="font-weight:600;color:var(--ink-3)">(חסרים ' + gap + ")</span>" : p.min ? " ✓" : "") + "</b></div>";
    }).join("") + '<p class="h" style="margin:9px 0 0">סה"כ להזמנה: ' + shek(sum) + "</p>" + '<div class="foldh" style="margin-top:12px">לפי ישיבה</div>' + list.filter(function(r) {
        return r.total;
    }).sort(function(a, b) {
        return (b.total || 0) - (a.total || 0);
    }).map(function(r) {
        return '<div class="row" style="padding:6px 0"><span>' + esc(pplName(r.code, r)) + (r.who ? '<div class="sub">' + esc(r.who) + "</div>" : "") + "</span><b>" + r.total + "</b></div>";
    }).join("") + (list.some(function(r) {
        return !r.total;
    }) ? '<p class="h" style="margin:8px 0 0">נרשמו בלי הזמנה: ' + list.filter(function(r) {
        return !r.total;
    }).map(function(r) {
        return esc(pplName(r.code, r));
    }).join(" · ") + "</p>" : ""));
}

function pplOneHead(d) {
    var c = ppl.open, x = null;
    if (c === "") x = {
        c: "",
        got: d.tot,
        rep: d.repTot || null,
        gap: 0
    };
    d.rows.forEach(function(y) {
        if (y.c === c) x = y;
    });
    if (!x) x = {
        c: c,
        got: 0,
        rep: null,
        gap: 0
    };
    pplSet("ppl-on", esc(pplName(c, x.reg)));
    var r = x.reg, h = '<div class="pr-t">' + pplTags(x) + "</div>";
    if (r) {
        var q = regMigrate(r), bits = [];
        TRACKS.forEach(function(t) {
            SFARIM.forEach(function(s) {
                var n = q[qk(t.id, s.id)] || 0;
                if (n) bits.push(esc(t.masechet + " · " + s.name) + " " + n);
            });
        });
        h += '<div style="margin-top:6px">' + (r.who ? esc(r.who) : "ראש החטיבה") + (r.phone ? ' · <a href="tel:' + digits(r.phone) + '">' + esc(r.phone) + "</a>" : "") + "</div>" + (bits.length ? "<div>" + bits.join(" · ") + "</div>" : "") + (r.note ? "<div>הערה: " + esc(r.note) + "</div>" : "");
    } else if (c !== "" && c !== "-") {
        h += '<div style="margin-top:6px">ראש החטיבה עוד לא נרשם.</div>';
    }
    pplSet("ppl-oi", h);
    pplSet("ppl-acc", accHtml(c));
}

function pplFrame(msg) {
    var f = document.getElementById("people-f");
    if (f && f.contentWindow) try {
        f.contentWindow.postMessage(msg, "*");
    } catch (e) {}
}

function pplOpen(c) {
    if (!document.getElementById("ppl-list")) {
        admInstPick(c);
        if (admTab !== "stu") admGo("stu");
        return;
    }
    ppl.y = window.pageYOffset || document.documentElement.scrollTop || 0;
    ppl.open = c;
    pplPaint();
    pplFrame({
        dfFilt: c
    });
    var t = document.getElementById("ppl");
    if (t) window.scrollTo(0, Math.max(0, t.getBoundingClientRect().top + (window.pageYOffset || 0) - 10));
    var k = document.querySelector(".ppl-back");
    if (k) try {
        k.focus({
            preventScroll: true
        });
    } catch (e) {}
}

function pplBack() {
    var c = ppl.open;
    ppl.open = null;
    pplPaint();
    window.scrollTo(0, ppl.y || 0);
    var b = document.querySelector('#ppl-list .pr[data-c="' + String(c).replace(/["\\]/g, "") + '"]');
    if (b) try {
        b.focus({
            preventScroll: true
        });
    } catch (e) {}
}

function pplRefresh() {
    pplFrame({
        dfReload: 1
    });
    pullRegs();
    conflictLoad();
    accLoad();
}

var accRows = null, accMsg = "";

function accLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(false);
    return scriptGet({
        read: "גישה",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return false;
        var rows = d.rows, h = (rows[0] || []).map(function(x) {
            return String(x).trim();
        });
        var c = function(r, k) {
            var i = h.indexOf(k);
            return i < 0 ? "" : String(r[i] == null ? "" : r[i]).trim();
        };
        accRows = rows.slice(1).filter(function(r) {
            return c(r, "מזהה");
        }).map(function(r) {
            return {
                id: c(r, "מזהה"),
                name: c(r, "שם"),
                phone: c(r, "טלפון"),
                instName: c(r, "ישיבה"),
                inst: c(r, "קוד ישיבה"),
                role: c(r, "תפקיד"),
                st: c(r, "מצב") || "ממתין",
                has: c(r, "קוד במכשיר") === "כן",
                at: c(r, "ביקש")
            };
        });
        Store.set("accCache", accRows);
        admPane();
        return true;
    }).catch(function() {
        return false;
    });
}

function accList() {
    if (accRows === null) accRows = Store.get("accCache", null);
    return accRows || [];
}

function accWait(inst) {
    return accList().filter(function(a) {
        return a.st === "ממתין" && (inst == null || pplCode(a.inst) === inst);
    });
}

function accSet(id, st) {
    var key = (CFG.readKey || "").trim();
    var a = accList().filter(function(x) {
        return x.id === id;
    })[0];
    if (!key || !a) return;
    if (st === "נעול" && !confirm("לנעול את " + (a.name || "איש הצוות") + "?\n" + "הוא יחזור לראות מספרים בלבד, בלי שמות ובלי שליחה לתלמידים.")) return;
    accMsg = "שומר…";
    admPane();
    scriptGet({
        accset: id,
        st: st,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            accMsg = "לא נשמר. " + (d && d.message || "אין תשובה מהסקריפט.");
            admPane();
            return;
        }
        accMsg = "";
        a.st = st;
        Store.set("accCache", accRows);
        admPane();
        accLoad();
    }).catch(function() {
        accMsg = "לא נשמר. אין תשובה מהסקריפט.";
        admPane();
    });
}

function accWaUrl(a) {
    var first = String(a.name || "").replace(/^הרב\s+/, "").split(" ")[0];
    var txt = fill(textGet("ui.accWa"), {
        name: first,
        inst: a.instName || pplName(pplCode(a.inst))
    });
    return "https://wa.me/" + waNum(a.phone) + "?text=" + encodeURIComponent(txt);
}

function accIdUrl(a) {
    var first = String(a.name || "").replace(/^הרב\s+/, "").split(" ")[0];
    var txt = fill(textGet("ui.accIdWa"), {
        name: first,
        inst: a.instName || pplName(pplCode(a.inst))
    });
    return "https://wa.me/" + waNum(a.phone) + "?text=" + encodeURIComponent(txt);
}

function accPhUrl(a) {
    var base = location.href.split("#")[0].split("?")[0].replace(/\/index(\.html)?$/, "/").replace(/[^\/]*$/, "");
    var txt = fill(textGet("ui.accPhWa"), {
        inst: a.instName || pplName(pplCode(a.inst)),
        url: base + "#phone"
    });
    return "https://wa.me/?text=" + encodeURIComponent(txt);
}

function accHtml(c, waitOnly) {
    var list = accList().filter(function(a) {
        return (c === "" || pplCode(a.inst) === c) && (!waitOnly || a.st === "ממתין");
    });
    if (!list.length) return "";
    list.sort(function(x, y) {
        return (x.st === "ממתין" ? 0 : 1) - (y.st === "ממתין" ? 0 : 1);
    });
    return '<div class="acc"><div class="acc-h">בניהול האישי</div>' + (accMsg ? '<div class="cond" style="margin:6px 0">' + esc(accMsg) + "</div>" : "") + list.map(function(a) {
        var tag = a.st === "אושר" ? '<i class="pt g">אושר</i>' : a.st === "נעול" ? '<i class="pt r">נעול</i>' : '<i class="pt w">ממתין לאימות</i>';
        return '<div class="acc-r"><div class="acc-n"><b>' + esc(a.name || "-") + "</b> " + tag + '<div class="sub">' + esc([ a.role, c === "" ? a.instName || "" : "" ].filter(Boolean).join(" · ")) + (a.phone ? ' · <a href="tel:' + digits(a.phone) + '" dir="ltr">' + esc(a.phone) + "</a>" : ' · <b style="color:var(--bad, #B3261E)">חסר טלפון</b>') + (a.has && a.st === "ממתין" ? " · כבר נכנס בקישור עם קוד" : "") + '</div></div><div class="acc-b">' + (a.st !== "אושר" ? '<button class="btn p" onclick="accSet(' + dq(a.id) + ",'אושר')\">אישור</button>" : "") + (a.st === "אושר" && a.phone ? '<a class="btn gr" target="_blank" rel="noopener" href="' + esc(accWaUrl(a)) + '">וואטסאפ</a>' : "") + (a.st === "ממתין" && a.phone ? '<a class="btn gr" target="_blank" rel="noopener" href="' + esc(accIdUrl(a)) + '">וואטסאפ לזיהוי</a>' : "") + (a.st === "ממתין" && !a.phone ? '<a class="btn g" target="_blank" rel="noopener" href="' + esc(accPhUrl(a)) + '">בקשת טלפון</a>' : "") + (a.st !== "נעול" ? '<button class="btn g" onclick="accSet(' + dq(a.id) + ",'נעול')\">נעילה</button>" : "") + "</div></div>";
    }).join("") + "</div>";
}

function sheetTime(v) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(String(v || "").trim());
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
    return Date.parse(v) || 0;
}

function sheetAgo(v) {
    var t = sheetTime(v);
    return t ? whenTxt(t) : "";
}

function sayAud(r) {
    if (r.aud) return r.aud;
    var out = [], f = {};
    try {
        f = JSON.parse(r.flt || "{}") || {};
    } catch (e) {
        f = {};
    }
    if (r.wait) out.push("מי שביקש התראה על הדף");
    if (f.ids && f.ids.length) out.push(f.ids.length === 1 ? "אדם אחד נבחר" : f.ids.length + " אנשים נבחרו");
    if (f.par === "p") out.push("הורים"); else if (f.par === "pk") out.push("תלמידים והורים");
    if (r.role) out.push(r.role === "אב" ? "הורים" : r.role === "תלמיד" ? "תלמידים" : r.role);
    if (r.inst && r.inst !== "כולם") out.push(r.inst);
    if (r.grade) out.push("שכבה " + r.grade);
    if (r.klass) out.push("כיתה " + r.klass);
    if (f.way) out.push(f.way);
    if (f.seg) out.push({
        done: "סיימו",
        todo: "עוד לא סיימו",
        mid: "התחילו ולא סיימו",
        none: "לא התחילו"
    }[f.seg] + (f.wk ? " (שבוע " + f.wk + ")" : ""));
    return out.length ? out.join(" · ") : "כל המנויים";
}

function sayLogCard() {
    if (!sayLog) return "";
    if (!sayLog.length) return "";
    var groups = [], byKey = {};
    sayLog.forEach(function(m) {
        var k = (m.who || "") + "" + (m.aud || "") + "" + (m.title || "") + "" + (m.body || "");
        if (!byKey[k]) {
            byKey[k] = {
                last: m,
                all: []
            };
            groups.push(byKey[k]);
        }
        byKey[k].all.push(m);
    });
    var cls = function(m) {
        var bad = m.res.indexOf("נכשלה") === 0 && m.res.indexOf("נשלחה שוב") < 0;
        var part = m.res.indexOf("חלקית") === 0;
        return bad ? " bad" : part ? " part" : "";
    };
    return '<div class="adm-card"><h4>ההודעות האחרונות</h4>' + groups.slice(0, 15).map(function(g) {
        var m = g.last, n = g.all.length;
        return '<div class="slog' + cls(m) + '"><div class="slog-h"><b>' + esc(m.who || "-") + "</b>" + " · " + esc(m.aud) + "<span>" + esc(sheetAgo(m.at)) + "</span></div>" + '<div class="slog-t">' + esc((m.title ? m.title + " - " : "") + m.body) + "</div>" + (m.res ? '<div class="slog-r">' + esc(m.res) + "</div>" : "") + (n > 1 ? '<details class="slog-x"><summary>' + esc(UI.logTries.replace("{n}", n)) + " · " + esc(UI.logHist) + "</summary>" + g.all.map(function(x) {
            return "<div>" + esc(sheetAgo(x.at) || x.at || "") + " - " + esc(x.res || "") + "</div>";
        }).join("") + "</details>" : "") + "</div>";
    }).join("") + "</div>";
}

function needsLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(false);
    return scriptGet({
        read: "הודעות",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return false;
        var rows = d.rows, h = (rows[0] || []).map(function(x) {
            return String(x).trim();
        });
        var c = function(r, k) {
            var i = h.indexOf(k);
            return i < 0 ? "" : String(r[i] == null ? "" : r[i]);
        };
        sayLog = rows.slice(1).map(function(r) {
            var ic = c(r, "ישיבה"), io = (INSTITUTIONS || []).filter(function(x) {
                return x.code === ic;
            })[0];
            return {
                who: c(r, "מי"),
                inst: io ? io.name : ic,
                title: c(r, "כותרת"),
                body: c(r, "הטקסט").replace(/\{name\}/g, "[שם]"),
                res: c(r, "תוצאה"),
                at: c(r, "תאריך"),
                aud: sayAud({
                    inst: io ? io.name : ic,
                    grade: c(r, "שכבה"),
                    klass: c(r, "כיתה"),
                    role: c(r, "תפקיד"),
                    flt: c(r, "פילוח"),
                    wait: c(r, "ממתינים"),
                    aud: c(r, "קהל")
                })
            };
        }).reverse().slice(0, 40);
        needsFail = rows.slice(1).filter(function(r) {
            var t = c(r, "תוצאה");
            return t.indexOf("נכשלה") === 0 && t.indexOf("נשלחה שוב") < 0 && c(r, "מזהה שליחה");
        }).map(function(r) {
            var ic = c(r, "ישיבה"), io = (INSTITUTIONS || []).filter(function(x) {
                return x.code === ic;
            })[0];
            return {
                sid: c(r, "מזהה שליחה"),
                who: c(r, "מי"),
                inst: io ? io.name : ic,
                title: c(r, "כותרת"),
                body: c(r, "הטקסט").replace(/\{name\}/g, "[שם]"),
                why: c(r, "תוצאה").replace(/^נכשלה:\s*/, ""),
                at: c(r, "תאריך")
            };
        }).reverse();
        admPane();
        return true;
    }).catch(function() {
        return false;
    });
}
