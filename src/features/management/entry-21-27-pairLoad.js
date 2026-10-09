var pairRows = null, pairMsg = "", pairWk = 0;

function pairLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        pairMsg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    pairMsg = "טוען…";
    admPane();
    return scriptGet({
        read: "זוגות",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            pairMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        var r = d.rows;
        if (r.length < 2) {
            pairRows = [];
            pairMsg = "";
            admPane();
            return true;
        }
        var head = r[0].map(function(x) {
            return String(x || "").trim();
        });
        var ix = {};
        head.forEach(function(x, i) {
            ix[x] = i;
        });
        var out = [];
        for (var i = 1; i < r.length; i++) {
            var row = r[i], g = function(k) {
                return ix[k] === undefined ? "" : String(row[ix[k]] == null ? "" : row[ix[k]]).trim();
            };
            if (!g("שם")) continue;
            out.push({
                at: g("מתי"),
                id: g("מזהה"),
                ic: g("קוד ישיבה"),
                name: g("שם"),
                inst: g("ישיבה"),
                grade: g("שכבה"),
                klass: g("כיתה"),
                track: g("מסלול"),
                wk: parseInt(g("שבוע"), 10) || 0,
                daf: g("דף"),
                rel: g("קרבה"),
                by: g("דיווח"),
                okd: g("אושר"),
                pName: g("שם השותף"),
                pPhone: g("טלפון השותף")
            });
        }
        pairRows = out.reverse();
        pairMsg = "";
        admPane();
        return true;
    })["catch"](function() {
        pairMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function pairPick(n) {
    pairWk = n | 0;
    admPane();
}

function admPairs() {
    var h = '<div class="adm-card"><h4>לימוד משותף - אבא ובן</h4>';
    if (!pairRows) {
        h += '<p class="h">כל שורה היא לימוד משותף שהבן דיווח עליו. ' + "מכאן נעשית ההגרלה. הרשימה נקראת מהגיליון הפרטי.</p>" + '<button class="btn g" onclick="pairLoad()">טעינה מהגיליון</button>';
        if (pairMsg && pairMsg !== "nokey") {
            h += '<div class="cond" style="margin-top:10px">' + esc(pairMsg) + "</div>";
        }
        return h + "</div>";
    }
    if (!pairRows.length) {
        return h + '<p class="h">עוד לא דיווח אף אחד על לימוד משותף.</p>' + '<button class="btn g" onclick="pairLoad()">רענון</button></div>';
    }
    var weeks = [];
    pairRows.forEach(function(o) {
        if (o.wk && weeks.indexOf(o.wk) < 0) weeks.push(o.wk);
    });
    weeks.sort(function(a2, b2) {
        return b2 - a2;
    });
    var list0 = pairWk ? pairRows.filter(function(o) {
        return o.wk === pairWk;
    }) : pairRows;
    var seenP = {}, list = [];
    list0.forEach(function(o) {
        var k = (o.id || o.name) + "|" + o.track + "|" + o.wk;
        if (seenP[k]) {
            seenP[k].n++;
            return;
        }
        seenP[k] = {
            o: o,
            n: 1
        };
        list.push(o);
        o._k = k;
    });
    list.forEach(function(o) {
        o._n = seenP[o._k].n;
    });
    if (pairWk === 0) h += pairPicture(pairRows);
    h += '<p class="h"><b>' + list.length + "</b> " + (list.length === 1 ? "זוג" : "זוגות") + (pairWk ? " בשבוע " + pairWk : " בסך הכול") + ".</p>";
    if (weeks.length > 1) {
        h += '<div class="tabs" style="margin:0 0 12px">' + "<button" + (pairWk ? "" : ' class="on"') + ' onclick="pairPick(0)">הכול</button>' + weeks.map(function(w) {
            return "<button" + (pairWk === w ? ' class="on"' : "") + ' onclick="pairPick(' + w + ')">שבוע ' + w + "</button>";
        }).join("") + "</div>";
    }
    h += '<div class="plist">' + list.map(function(o) {
        var bits = [ o.inst, o.grade && o.klass ? o.grade + o.klass : o.grade, o.daf ? "דף " + o.daf : "" ].filter(Boolean);
        var cls = o.okd === "כן" ? "ok" : o.okd === "לא" ? "no" : "warn";
        var sig = o.okd === "כן" ? "✓" : o.okd === "לא" ? "✕" : "…";
        return '<div class="prow2 ' + cls + '"><span class="pm">' + sig + "</span>" + '<div style="flex:1"><b>' + esc(o.name) + "</b>" + "<span>" + esc(bits.join(" · ")) + "</span>" + '<span style="color:var(--ink)">עם ' + esc(o.rel || "הורה") + (o.by === "ההורה" ? " · דיווח ההורה" : o.okd === "כן" ? " · ההורה אישר" : o.okd === "לא" ? " · ההורה אמר שלא למדו" : " · ממתין לאישור ההורה") + (o.pName ? " - " + esc(o.pName) : "") + (o.pPhone ? " · " + esc(o.pPhone) : "") + "</span>" + (o._n > 1 ? '<span style="color:var(--ink-3)">' + esc(fill(UI.pairDup, {
            n: o._n
        })) + "</span>" : "") + "</div></div>";
    }).join("") + "</div>" + '<button class="btn g" style="margin-top:10px" ' + 'onclick="pairLoad()">רענון</button></div>';
    return h;
}

function pairPicture(rows) {
    var uniq = {}, by = {
        kid: 0,
        par: 0
    }, ok = {
        y: 0,
        n: 0,
        w: 0
    }, kids = {};
    rows.forEach(function(o) {
        var k = (o.id || o.name) + "|" + o.track + "|" + o.wk;
        if (uniq[k]) return;
        uniq[k] = o;
        kids[o.id || o.name] = 1;
        if (o.by === "ההורה") by.par++; else by.kid++;
        if (o.okd === "כן") ok.y++; else if (o.okd === "לא") ok.n++; else ok.w++;
    });
    var nU = Object.keys(uniq).length;
    var ros = (Store.get("rosterCache:all", null) || []).filter(function(p) {
        return !p.test && p.role !== "הורה";
    });
    var withPar = ros.filter(function(p) {
        return p.pars && p.pars.length;
    });
    var withParLearned = withPar.filter(function(p) {
        return p.weeks && p.weeks.length;
    }).length;
    var notRep = withPar.filter(function(p) {
        return p.weeks && p.weeks.length && !kids[p.id];
    }).length;
    var sukkot = {};
    rows.forEach(function(o) {
        var t = Date.parse(o.at || "");
        if ((o.ic === "lapid" || /לפיד/.test(o.inst)) && t >= Date.UTC(2026, 8, 20, 21) && t < Date.UTC(2026, 9, 4, 21)) {
            sukkot[o.id || o.name] = o.name;
        }
    });
    var sk = Object.keys(sukkot).map(function(k) {
        return sukkot[k];
    });
    var li = function(b, t) {
        return '<div class="pp-r"><b>' + b + "</b><span>" + esc(t) + "</span></div>";
    };
    return '<div class="pp">' + '<div class="pp-h">' + esc(UI.ppRep) + "</div>" + li(rows.length + " → " + nU, UI.ppRows) + li(Object.keys(kids).length, UI.ppKids) + li(ok.y + " · " + ok.w + " · " + ok.n, UI.ppOk) + li(by.kid + " · " + by.par, UI.ppBy) + '<div class="pp-h">' + esc(UI.ppBoard) + "</div>" + (ros.length ? li(withPar.length, UI.ppWithPar) + li(withParLearned, UI.ppWithParL) + li(notRep, UI.ppNotRep) : '<p class="h">' + esc(UI.ppNoRos) + "</p>") + '<div class="pp-h">' + esc(UI.ppSus) + "</div>" + li(by.par, UI.ppSusPar) + '<div class="pp-h">' + esc(UI.ppSuk) + "</div>" + li(sk.length, UI.ppSukN) + (sk.length ? '<p class="h">' + sk.map(esc).join(" · ") + "</p>" : "") + "</div>";
}

function admStuck() {
    var h = '<div class="adm-card"><h4>מי ביקש עזרה בהתקנה</h4>';
    if (!stuckRows) {
        h += '<p class="h">תלמיד שנתקע משאיר כאן שם וטלפון. הרשימה ' + "נקראת מהגיליון הפרטי.</p>" + '<button class="btn g" onclick="stuckLoad()">טעינה מהגיליון</button>';
        if (stuckMsg && stuckMsg !== "nokey") {
            h += '<div class="cond" style="margin-top:10px">' + esc(stuckMsg) + "</div>";
        }
        return h + "</div>";
    }
    var open = stuckOpen();
    if (!open.length && !stuckAll) {
        h += '<p class="h">אף אחד לא ממתין. ' + (stuckRows.length ? "כולם טופלו." : "עוד לא ביקש אף אחד עזרה.") + '</p><button class="btn g" onclick="stuckLoad()">רענון</button>';
        if (stuckRows.length) {
            h += '<button class="btn g" style="margin-top:8px" ' + 'onclick="stuckShowAll()">להראות את מי שטופל (' + stuckRows.length + ")</button>";
        }
        return h + "</div>";
    }
    var list = stuckAll ? stuckRows : open;
    h += '<p class="h">' + open.length + " ממתינים. הכפתור פותח וואטסאפ " + "עם הודעה מוכנה - בשמו, ועם השאלות שאי אפשר לענות עליהן " + 'מכאן.</p><div class="plist">';
    h += list.map(function(p) {
        var bits = [];
        if (p.inst) bits.push(p.inst);
        if (p.grade) bits.push(p.grade + (p.klass ? "‎" + p.klass : ""));
        if (p.dev) bits.push(p.dev);
        if (p.at) bits.push(String(p.at).slice(0, 10));
        var num = waNum(p.phone);
        return '<div class="prow2 ' + (p.done ? "ok" : "warn") + '">' + '<span class="pm">' + (p.done ? "✓" : "!") + "</span>" + '<div style="flex:1"><b>' + esc(p.name || "-") + "</b>" + (bits.length ? "<span>" + esc(bits.join(" · ")) + "</span>" : "") + (p.what ? '<span style="color:var(--ink)">„' + esc(p.what) + '"</span>' : "") + (p.diag ? '<span style="font-size:.68rem;opacity:.7;word-break:break-word">' + esc(p.diag) + "</span>" : "") + '<div style="display:flex;gap:6px;margin-top:7px;flex-wrap:wrap">' + (num ? '<a class="btn gr" style="width:auto;padding:8px 14px" target="_blank" ' + 'rel="noopener" href="https://wa.me/' + num + "?text=" + encodeURIComponent(stuckText(p)) + '">וואטסאפ</a>' : '<span class="h">בלי מספר תקין</span>') + (p.done ? "" : '<button class="btn g" style="width:auto;padding:8px 14px"' + (stuckBusy === p.row ? " disabled" : "") + ' onclick="stuckDone(' + p.row + ')">' + (stuckBusy === p.row ? "רגע…" : "טופל") + "</button>") + "</div></div></div>";
    }).join("");
    h += '</div><button class="btn g" style="margin-top:10px" ' + 'onclick="stuckLoad()">רענון</button>';
    if (!stuckAll && stuckRows.length > open.length) {
        h += '<button class="btn g" style="margin-top:8px" onclick="stuckShowAll()">' + "להראות גם את מי שטופל</button>";
    }
    if (stuckMsg && stuckMsg !== "nokey") {
        h += '<div class="cond" style="margin-top:10px">' + esc(stuckMsg) + "</div>";
    }
    return h + "</div>";
}

function pushParse(rows) {
    if (!rows || rows.length < 2) return [];
    var head = rows[0].map(function(x) {
        return String(x || "").trim();
    });
    var ix = {};
    head.forEach(function(h, i) {
        ix[h] = i;
    });
    var out = [];
    for (var i = 1; i < rows.length; i++) {
        var r = rows[i], g = function(k) {
            return ix[k] === undefined ? "" : String(r[ix[k]] == null ? "" : r[ix[k]]).trim();
        };
        if (!g("שם") && !g("מנוי")) continue;
        out.push({
            id: g("מזהה"),
            name: g("שם"),
            inst: g("ישיבה"),
            code: g("קוד ישיבה"),
            role: g("תפקיד"),
            grade: g("שכבה"),
            klass: g("כיתה"),
            dev: g("מכשיר"),
            sub: !!g("מנוי"),
            res: g("תוצאה"),
            at: g("מתי") || g("תאריך")
        });
    }
    var byId = {}, ord = [];
    out.forEach(function(p) {
        var k = p.id || p.name + "|" + p.dev;
        if (!(k in byId)) ord.push(k);
        byId[k] = p;
    });
    return ord.map(function(k) {
        return byId[k];
    });
}

function pushLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        pushMsg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    pushMsg = "טוען…";
    admPane();
    return scriptGet({
        read: "התראות",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            pushMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        pushRows = pushParse(d.rows);
        Store.set("pushCache", pushRows);
        pushMsg = "";
        admPane();
        return true;
    }).catch(function() {
        pushMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function pushSend() {
    var body = (pushView.body || "").trim();
    if (!body) {
        pushMsg = "אין מה לשלוח.";
        admPane();
        return;
    }
    var c2 = pushCount();
    var who = [];
    who.push(pushView.role === "צוות" ? "לצוות" : pushView.role === "תלמיד" ? "לתלמידים" : "לכולם");
    if (pushView.only) who.push("בישיבה אחת");
    if (!pushView.role && !pushView.only) who = [ "לכל מי שנרשם (" + c2.ok + " מכשירים)" ];
    if (!confirm("לשלוח " + who.join(" ") + "?\n\n" + body)) return;
    pushBusy = true;
    pushMsg = "שולח…";
    admPane();
    scriptGet({
        fire: "say",
        key: (CFG.readKey || "").trim(),
        title: (pushView.title || "").trim() || PROGRAM.short,
        body: body,
        only: pushView.only,
        role: pushView.role,
        url: pushView.link
    }).then(function(d) {
        pushBusy = false;
        pushMsg = d && d.status === "ok" ? "התקבל לשליחה" + (d.sid ? " (מזהה " + d.sid + ")" : "") + '. התוצאה תופיע ב"ההודעות האחרונות" שלמעלה.' : "לא יצא: " + (d && d.message || "אין תשובה מהסקריפט.");
        if (d && d.status === "ok") {
            setTimeout(function() {
                needsLoad();
            }, 45e3);
            setTimeout(function() {
                needsLoad();
            }, 12e4);
        }
        admPane();
    })["catch"](function() {
        pushBusy = false;
        pushMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function pushCount() {
    var c = {
        ok: 0,
        blocked: 0,
        noInst: 0,
        all: 0
    };
    (pushRows || []).forEach(function(p) {
        c.all++;
        if (p.sub) c.ok++; else if (/חסום/.test(p.res)) c.blocked++; else c.noInst++;
    });
    return c;
}

function pushSet(k, v) {
    pushView[k] = v;
}

function pushJoined() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        pushMsg = "nokey";
        admPane();
        return;
    }
    if (!confirm('לשלוח לכל ר"ם שנרשם התראה עם מספר התלמידים ' + "שהצטרפו מכיתתו?\n\nלכל אחד יוצא המספר שלו.")) return;
    pushBusy = true;
    pushMsg = "שולח…";
    admPane();
    scriptGet({
        fire: "digest",
        key: key,
        mode: "joined"
    }).then(function(d) {
        pushBusy = false;
        pushMsg = d && d.status === "ok" ? "התקבל לשליחה. הפירוט ב-Actions ב-GitHub." : "לא יצא: " + (d && d.message || "אין תשובה מהסקריפט.");
        admPane();
    })["catch"](function() {
        pushBusy = false;
        pushMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}
