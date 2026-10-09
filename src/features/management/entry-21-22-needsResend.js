function needsResend(sid) {
    var key = (CFG.readKey || "").trim();
    if (!key || needsBusy) return;
    needsBusy = sid;
    needsMsg = "";
    admPane();
    scriptGet({
        resend: sid,
        key: key
    }).then(function(d) {
        needsBusy = "";
        if (d && d.status === "ok") {
            needsFail = (needsFail || []).filter(function(m) {
                return m.sid !== sid;
            });
            needsMsg = "✓ נשלחה שוב. אם גם הפעם לא תצא - תקבל התרעה.";
        } else needsMsg = "לא נשלחה. " + (d && d.message || "אין תשובה מהסקריפט.");
        admPane();
    }).catch(function() {
        needsBusy = "";
        needsMsg = "אין תשובה מהסקריפט.";
        admPane();
    });
}

function accGo() {
    ppl.open = "";
    ppl.q = "";
    ppl.f = "";
    ppl.mine = "";
    ADM_INST = "";
    Store.set("admInst", "");
    admIpOpen = false;
    pplFrame({
        dfFilt: ""
    });
    admGo("hot");
    admScrollTo("hot-acc");
}

function admHotList() {
    var all = (stuckRows || []).filter(function(p) {
        return !p.done && !stuckFull(p);
    });
    return {
        fail: needsFail || [],
        help: all,
        acc: accWait(null),
        calls: callsDue()
    };
}

function admBell() {
    var L = admHotList(), n = L.fail.length + L.help.length + L.acc.length + L.calls.length;
    var e = document.getElementById("adm-bell-n");
    if (!e) return;
    var t = n ? String(n) : "";
    if (pplLast["adm-bell-n"] === t) return;
    pplLast["adm-bell-n"] = t;
    e.textContent = t;
    e.style.display = n ? "" : "none";
}

function admHotHtml() {
    var L = admHotList(), h = '<div class="my-top" style="margin:0 0 12px"><b>' + esc(UI.hotH) + "</b></div>";
    if (L.acc.length) {
        h += '<div class="adm-card hot-sec" id="hot-acc" style="margin-bottom:11px"><h4>' + esc(UI.hotAcc) + "</h4>" + accHtml("", 1) + "</div>";
    }
    if (L.calls.length) {
        h += '<div class="adm-card hot-sec" id="hot-calls" style="margin-bottom:11px"><h4>' + esc(UI.hotCalls) + "</h4>" + L.calls.map(function(o) {
            var q = (yshMain({
                recs: [ o ]
            }, subsByInst()) || {}).q || {};
            return '<div class="need"><div class="need-m"><b>' + esc(o.c.name) + "</b>" + (q.name ? " · " + esc(q.name) : "") + "</div>" + (o.c.upd ? '<div class="need-t">⏭ ' + esc(o.c.upd) + "</div>" : "") + '<div class="yr-ch" style="margin-top:8px">' + (q.phone ? '<a class="yr-c" href="tel:' + digits(q.phone) + '">📞 ' + esc(UI.yrCall) + "</a>" + '<a class="yr-c" target="_blank" rel="noopener" href="https://wa.me/' + waNum(q.phone) + '">💬 ' + esc(UI.yrWa) + "</a>" : "") + '<button class="yr-c on" onclick="callDueDone(' + o.i + ')">✓ ' + esc(UI.hotCallDone) + "</button></div></div>";
        }).join("") + "</div>";
    }
    if (L.help.length) h += '<div class="hot-sec" id="hot-help">' + admSetupHelp() + "</div>";
    if (L.fail.length) {
        h += '<div class="adm-card hot-sec" id="hot-fail" style="margin-bottom:11px"><h4>' + esc(UI.hotFail) + "</h4>" + L.fail.map(function(m) {
            return '<div class="need"><div class="need-m"><b>' + esc(m.who || "צוות") + "</b>" + (m.inst ? " · " + esc(m.inst) : "") + (sheetAgo(m.at) ? " · " + esc(sheetAgo(m.at)) : "") + '</div><div class="need-t">' + (m.title ? "<b>" + esc(m.title) + "</b><br>" : "") + esc(m.body) + '</div><div class="need-w">' + esc(m.why) + "</div>" + '<button class="btn p" style="margin:8px 0 0"' + (needsBusy ? " disabled" : "") + " onclick=\"needsResend('" + esc(m.sid) + "')\">" + (needsBusy === m.sid ? "שולח…" : "שליחה חוזרת - כמו שהייתה") + "</button></div>";
        }).join("") + (needsMsg ? '<div class="cond" style="margin-top:8px">' + esc(needsMsg) + "</div>" : "") + "</div>";
    }
    if (!L.acc.length && !L.help.length && !L.fail.length && !L.calls.length) h += '<p class="st-ok">✓ ' + esc(UI.hotNone) + "</p>";
    var subbed = Store.get("rmSub", 0) && window.APPX && APPX.perm() === "granted";
    if (!subbed) h += '<button class="adm-chip" onclick="rmSubOn()">' + esc(UI.hotSub) + "</button>";
    return h;
}

function admNeeds(bare) {
    var fails = needsFail || [];
    var stuck = bare ? [] : stuckOpen();
    var h = "";
    fails.forEach(function(m) {
        h += '<div class="need"><div class="need-h">⚠ הודעה לא יצאה</div>' + '<div class="need-m"><b>' + esc(m.who || "צוות") + "</b>" + (m.inst ? " · " + esc(m.inst) : "") + (sheetAgo(m.at) ? " · " + esc(sheetAgo(m.at)) : "") + '</div><div class="need-t">' + (m.title ? "<b>" + esc(m.title) + "</b><br>" : "") + esc(m.body) + '</div><div class="need-w">' + esc(m.why) + "</div>" + '<button class="btn p" style="margin:8px 0 0"' + (needsBusy ? " disabled" : "") + " onclick=\"needsResend('" + esc(m.sid) + "')\">" + (needsBusy === m.sid ? "שולח…" : "שליחה חוזרת - כמו שהייתה") + "</button></div>";
    });
    if (stuck.length) {
        h += '<div class="need"><div class="need-h">🙋 ' + stuck.length + (stuck.length === 1 ? " ביקש" : " ביקשו") + " עזרה בהתקנה</div>" + '<div class="need-m">' + stuck.slice(0, 3).map(function(p) {
            return esc(p.name || "");
        }).join(" · ") + (stuck.length > 3 ? " ועוד" : "") + "</div>" + '<button class="btn g" style="margin:8px 0 0" onclick="var e=document.getElementById(\'st-stuck\');if(e)e.scrollIntoView({behavior:\'smooth\'})">לפרטים</button></div>';
    }
    var aw = accWait(null);
    if (aw.length) {
        h += '<div class="need"><div class="need-h">🔑 ' + aw.length + (aw.length === 1 ? " ממתין" : " ממתינים") + " לאימות - אזור הניהול האישי</div>" + '<div class="need-m">' + aw.slice(0, 3).map(function(a) {
            return esc((a.name || "") + (a.instName ? " · " + a.instName : ""));
        }).join("<br>") + (aw.length > 3 ? "<br>ועוד" : "") + "</div>" + '<button class="btn g" style="margin:8px 0 0" onclick="accGo()">לאימות</button></div>';
    }
    if (!h && !needsMsg) return "";
    var subbed = Store.get("rmSub", 0) && window.APPX && APPX.perm() === "granted";
    var inner = '<div class="needs">' + (bare ? "" : '<div class="needs-t">דורש טיפול</div>') + h + (needsMsg ? '<div class="cond" style="margin-top:8px">' + esc(needsMsg) + "</div>" : "") + (subbed ? "" : '<button style="margin-top:8px;border:0;background:none;padding:0;font:inherit;font-size:.8rem;font-weight:800;color:#9A4F0C;text-decoration:underline;cursor:pointer" onclick="rmSubOn()">' + "להתרעות על זה בטלפון הזה ←</button>") + "</div>";
    var n = fails.length + stuck.length + aw.length;
    return '<details class="adm-card nd"' + (Store.get("ndOpen", 1) ? " open" : "") + ' ontoggle="Store.set(\'ndOpen\',this.open?1:0)" style="margin-bottom:11px"><summary>⚠ ' + esc(UI.admNeedsT) + (n ? ' <i class="nd-n on">' + n + "</i>" : "") + "</summary>" + inner + "</details>";
}

var PART_COLS = {
    "מזהה": "id",
    "ישיבה": "instName",
    "קוד ישיבה": "inst",
    "שם": "first",
    "משפחה": "last",
    "שכבה": "grade",
    "כיתה": "klass",
    "טלפון": "phone",
    "מסגרת": "way",
    "תפקיד": "role",
    "שם ההורה": "dadFirst",
    "משפחת ההורה": "dadLast",
    "טלפון ההורה": "dadPhone",
    "תאריך": "at"
};

function partParse(rows) {
    if (!rows || rows.length < 2) return [];
    var head = rows[0].map(function(h) {
        return PART_COLS[String(h || "").trim()] || "";
    });
    var byId = {}, order = [];
    rows.slice(1).forEach(function(r) {
        var o = {};
        for (var i = 0; i < head.length; i++) if (head[i]) o[head[i]] = String(r[i] == null ? "" : r[i]).trim();
        if (!o.first && !o.last) return;
        var k = o.id || o.inst + "|" + o.first + "|" + o.last;
        if (!(k in byId)) order.push(k);
        byId[k] = o;
    });
    return order.map(function(k) {
        return byId[k];
    });
}

function partLoad() {
    partState.msg = "טוען…";
    admPane();
    var key = (CFG.readKey || "").trim();
    if (!key) {
        partState.msg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    return scriptGet({
        read: JOIN_TAB,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            partState.msg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        Store.set("partCache", partParse(d.rows));
        Store.set("partPairs", d.pairs || {});
        partState.at = Date.now();
        partState.msg = "";
        Store.set("partAt", partState.at);
        admPane();
        return true;
    }).catch(function() {
        partState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

var WAY_LBL = {
    "אבות ובנים": "אב ובן",
    "חבורת לימוד": "חבורה",
    "לימוד עצמי": "לבד"
};

var partView = {
    q: "",
    inst: "",
    way: "",
    msg: ""
};

var partPairs = {};

function partName(p) {
    return ((p.first || "") + " " + (p.last || "")).trim();
}

function partMatch(p) {
    if (partView.way && (p.way || "") !== partView.way) return false;
    if (partView.inst && (p.inst || p.instName || "") !== partView.inst && (p.instName || "") !== partView.inst) return false;
    var q = nameKey(partView.q);
    if (!q) return true;
    var hay = [ partName(p), p.phone, gradeOf(p), p.instName, (p.dadFirst || "") + " " + (p.dadLast || ""), p.dadPhone ].join(" ");
    return nameKey(hay).indexOf(q) >= 0;
}

function admPart(el) {
    var all = Store.get("partCache", []) || [];
    var at = Store.get("partAt", 0);
    partPairs = Store.get("partPairs", {}) || {};
    if (partState.msg === "nokey") {
        el.innerHTML = '<div class="adm-card"><h4>חסרה סיסמת הקריאה</h4>' + '<p class="h">רשימת התלמידים יושבת בגיליון סגור, והסקריפט לא ימסור ' + "אותה בלי סיסמה - אחרת כל אחד היה יכול לקרוא אותה. " + 'הדביקו בהגדרות ← "סיסמת הקריאה" את אותה מחרוזת שכתובה ' + "ב-Apps Script בשורת <code>READ_KEY</code>.</p>" + '<button class="btn p" onclick="admGo(\'sys\')">למסך ההגדרות</button></div>';
        return;
    }
    if (!all.length) {
        el.innerHTML = '<div class="adm-card"><h4>אין עדיין משתתפים</h4>' + '<p class="h">כל מי שנרשם דרך קישור ההצטרפות יופיע כאן. הרשימה ' + "נקראת מהגיליון הפרטי ואינה גלויה לאיש מלבדכם.</p>" + (partState.msg && partState.msg !== "nokey" ? '<div class="cond" style="margin-top:10px">' + esc(partState.msg) + "</div>" : "") + '<button class="btn g" style="margin-top:10px" onclick="partLoad()">' + "טעינה מהגיליון</button></div>";
        return;
    }
    var instN = {}, instName = {}, wayN = {}, allInst = 0, allWay = 0;
    var si = partView.inst, sw = partView.way;
    all.forEach(function(p) {
        var ic = p.inst || p.instName || "";
        instName[ic] = p.instName || ic;
        partView.inst = "";
        if (partMatch(p)) {
            instN[ic] = (instN[ic] || 0) + 1;
            allInst++;
        }
        partView.inst = si;
        partView.way = "";
        if (partMatch(p)) {
            wayN[p.way || ""] = (wayN[p.way || ""] || 0) + 1;
            allWay++;
        }
        partView.way = sw;
    });
    var shown = all.filter(partMatch);
    var seenInst = {}, shownInst = 0;
    shown.forEach(function(p) {
        var ic = p.inst || p.instName || "";
        if (!seenInst[ic]) {
            seenInst[ic] = 1;
            shownInst++;
        }
    });
    var insts = Object.keys(instN).sort(function(a, b) {
        return instN[b] - instN[a];
    });
    var ways = Object.keys(wayN).sort(function(a, b) {
        return wayN[b] - wayN[a];
    });
    var chip = function(on, label, n, click) {
        return '<button class="chip' + (on ? " on" : "") + '" onclick="' + click + '">' + esc(label) + (n == null ? "" : "<b>" + n + "</b>") + "</button>";
    };
    var isDad = function(p) {
        return p.role === "הורה";
    };
    var nDad = 0, allKid = 0;
    shown.forEach(function(p) {
        if (isDad(p)) nDad++;
    });
    all.forEach(function(p) {
        if (!isDad(p)) allKid++;
    });
    var nKid = shown.length - nDad;
    var h = '<div class="adm-card" style="margin-bottom:11px">' + "<h4>" + (shown.length === all.length ? nKid + " לומדים" : nKid + " מתוך " + allKid + " לומדים") + (nDad ? " · " + nDad + (nDad === 1 ? " הורה" : " הורים") : "") + " · " + (shownInst === 1 ? "ישיבה אחת" : shownInst + " ישיבות") + "</h4>" + '<input class="psearch" placeholder="חיפוש שם, טלפון או שכבה" ' + 'value="' + esc(partView.q) + '" oninput="partSet(\'q\',this.value)">' + '<div class="chips">' + chip(!partView.inst, "כל הישיבות", allInst, "partSet('inst','')") + insts.map(function(c) {
        return chip(partView.inst === c, instName[c] || "ללא ישיבה", instN[c], "partSet('inst'," + dq(c) + ")");
    }).join("") + "</div>" + '<div class="chips">' + chip(!partView.way, "כל המסגרות", allWay, "partSet('way','')") + ways.map(function(w) {
        return chip(partView.way === w, WAY_LBL[w] || w || "לא צוין", wayN[w], "partSet('way'," + dq(w) + ")");
    }).join("") + "</div>" + (partView.msg ? '<div class="cond" style="margin-top:10px">' + partView.msg + "</div>" : "") + (partState.msg && partState.msg !== "nokey" ? '<div class="cond" style="margin-top:10px">' + esc(partState.msg) + "</div>" : "") + '<button class="btn g" style="margin-top:10px" onclick="partLoad()">רענון מהגיליון</button>' + (at ? '<p class="h" style="margin-top:8px">עודכן ' + esc(whenTxt(at)) + "</p>" : "") + '<a class="btn p" style="display:block;text-align:center;text-decoration:none;' + 'margin-top:10px" href="board.html?inst=all" target="_blank" rel="noopener">' + "הלוח של כל הישיבות ←</a>" + "</div>";
    if (!shown.length) {
        el.innerHTML = h + '<div class="adm-card"><p class="h">אין מי שעונה על ' + "הסינון הזה.</p></div>";
        return;
    }
    var byInst = {}, order = [];
    shown.forEach(function(p) {
        var ic = p.inst || p.instName || "";
        if (!byInst[ic]) {
            byInst[ic] = [];
            order.push(ic);
        }
        byInst[ic].push(p);
    });
    order.sort(function(a, b) {
        return byInst[b].length - byInst[a].length;
    });
    h += order.map(function(ic) {
        var grp = {}, gord = [];
        byInst[ic].forEach(function(p) {
            var w = p.way || "";
            if (!grp[w]) {
                grp[w] = [];
                gord.push(w);
            }
            grp[w].push(p);
        });
        gord.sort(function(a, b) {
            return grp[b].length - grp[a].length;
        });
        return '<div class="adm-card" style="margin-bottom:11px"><h4>' + esc(instName[ic] || "ללא ישיבה") + " · " + byInst[ic].length + "</h4>" + gord.map(function(w) {
            return '<div class="pway">' + esc(WAY_LBL[w] || w || "לא צוין") + " · " + grp[w].length + "</div>" + grp[w].map(partRow).join("");
        }).join("") + "</div>";
    }).join("");
    el.innerHTML = h;
}
