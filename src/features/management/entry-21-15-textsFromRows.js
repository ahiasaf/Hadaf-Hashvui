function textsFromRows(rows) {
    if (!rows || !rows.length) return null;
    if ((rows[0] || []).join("|").indexOf("מפתח") < 0) return null;
    var map = {};
    rows.slice(1).forEach(function(r) {
        var k = (r[0] || "").trim(), v = (r[1] || "").trim();
        if (k && v) map[k] = v;
    });
    return map;
}

function loadTexts() {
    return fetchSheet(CFG.sheetId || SHEET_ID, "טקסטים").then(function(rows) {
        var map = textsFromRows(rows);
        if (!map) return false;
        Store.set("textCache", map);
        PUBLISHED = map;
        relayerTexts();
        return true;
    });
}

var SET_TAB = "הגדרות";

function cfgVal(v) {
    v = (v == null ? "" : String(v)).trim();
    if (!v) return undefined;
    try {
        return JSON.parse(v);
    } catch (e) {}
    if (/^true$/i.test(v)) return true;
    if (/^false$/i.test(v)) return false;
    return v;
}

function loadSettings() {
    return fetchSheet(CFG.sheetId || SHEET_ID, SET_TAB).then(function(rows) {
        if (!rows || !rows.length) return false;
        if ((rows[0] || []).join("|").indexOf("מפתח") < 0) return false;
        var map = {};
        rows.slice(1).forEach(function(r) {
            var k = (r[0] || "").trim(), v = (r[1] || "").trim();
            if (!k || PUB_KEYS.indexOf(k) < 0 || !v) return;
            var val = cfgVal(v);
            if (val !== undefined) map[k] = val;
        });
        if (!Object.keys(map).length && rows.length > 1) return false;
        PUB_CFG = map;
        Store.set("cfgCache", map);
        cfgPrune();
        applyCfg();
        return true;
    });
}

function publishSettings() {
    var say = function(cls, t) {
        var msg = document.getElementById("adm-pub-msg");
        if (msg) msg.innerHTML = '<div class="' + cls + '" style="margin-top:9px">' + t + "</div>";
    };
    if (!API) {
        say("cond", "אין כתובת שרת. מלאו אותה בהגדרות ← כתובת שרת, " + "אחרת אפשר לשנות רק במכשיר הזה.");
        return;
    }
    say("cond", "קורא מהגיליון מה פורסם עד עכשיו…");
    var sid = CFG.sheetId || SHEET_ID;
    return Promise.all([ fetchSheet(sid, SET_TAB), fetchSheet(sid, "טקסטים") ]).then(function(fresh) {
        var fs = fresh[0], ft = textsFromRows(fresh[1]);
        var okSet = fs && fs.length && (fs[0] || []).join("|").indexOf("מפתח") >= 0;
        var never = !Object.keys(PUB_CFG || {}).length;
        if (!okSet && !(fs && never) || !ft && fresh[1] == null) {
            say("cond", "<b>לא פרסמתי.</b> לא הצלחתי לקרוא מהגיליון מה כבר " + "פורסם - וכתיבה בלי קריאה עלולה לדרוס פרסום ממכשיר אחר. " + "מה שסימנתם שמור במכשיר הזה; נסו שוב בעוד רגע.");
            return;
        }
        if (okSet) {
            var map = {};
            fs.slice(1).forEach(function(r) {
                var k = (r[0] || "").trim();
                if (!k || PUB_KEYS.indexOf(k) < 0) return;
                var val = cfgVal(r[1]);
                if (val !== undefined) map[k] = val;
            });
            PUB_CFG = map;
            Store.set("cfgCache", map);
        }
        if (ft) {
            PUBLISHED = ft;
            Store.set("textCache", ft);
            relayerTexts();
        }
        cfgPrune();
        applyCfg();
        return writeSettings_(say);
    }).catch(function() {
        say("cond", "<b>לא פרסמתי.</b> לא הצלחתי לקרוא מהגיליון. " + "מה שסימנתם שמור במכשיר הזה.");
    });
}

function writeSettings_(say) {
    var rows = [];
    PUB_KEYS.forEach(function(k) {
        var v = CV(k);
        if (v != null) rows.push([ k, "'" + JSON.stringify(v) ]);
    });
    queue({
        action: "table",
        tab: SET_TAB,
        key: (CFG.readKey || "").trim(),
        cols: JSON.stringify([ "מפתח", "ערך" ]),
        rows: JSON.stringify(rows)
    });
    var now = {};
    rows.forEach(function(r) {
        try {
            now[r[0]] = JSON.parse(r[1].replace(/^'/, ""));
        } catch (e) {}
    });
    say("cond", "נשלח · בודק בגיליון…");
    var sent = {};
    rows.forEach(function(r) {
        sent[r[0]] = r[1].replace(/^'/, "");
    });
    return new Promise(function(ok) {
        setTimeout(ok, 1800);
    }).then(function() {
        return fetchSheet(CFG.sheetId || SHEET_ID, SET_TAB);
    }).then(function(back) {
        if (!back || !back.length) {
            say("cond", '<b>הפרסום לא אושר.</b> לא הצלחתי לקרוא את לשונית "' + SET_TAB + '" בגיליון.<br>מה שסימנתם נשמר במכשיר הזה בלבד - ' + "מי שנכנס לאפליקציה עדיין רואה את הקודם.<br>" + 'לחצו "בדיקת חיבור" בכרטיס שרת ההרשמות: הוא יאמר מה חסר.');
            return;
        }
        var got = {};
        back.slice(1).forEach(function(r) {
            var k = (r[0] || "").trim();
            if (k) got[k] = cfgVal(r[1]);
        });
        var bad = [];
        for (var k in sent) {
            if (!jsonEq(got[k], cfgVal(sent[k]))) bad.push(k);
        }
        if (bad.length) {
            say("cond", "<b>הפרסום לא אושר.</b> " + bad.length + " מתוך " + rows.length + " ההגדרות לא חזרו מהגיליון.<br>" + "מה שסימנתם נשמר במכשיר הזה בלבד - מי שנכנס לאפליקציה " + "עדיין רואה את הקודם.<br>" + 'לחצו "בדיקת חיבור" בכרטיס שרת ההרשמות: הוא יאמר מה חסר.');
            return;
        }
        PUB_CFG = now;
        Store.set("cfgCache", now);
        cfgPrune();
        applyCfg();
        admPubBar();
        return publishTexts(say, rows.length);
    }).catch(function() {
        say("cond", "<b>הפרסום לא אושר.</b> לא הצלחתי לקרוא חזרה מהגיליון. " + "מה שסימנתם נשמר במכשיר הזה בלבד.");
    });
}

function publishTexts(say, nCfg) {
    var rows = textPubRows();
    queue({
        action: "texts",
        key: (CFG.readKey || "").trim(),
        rows: JSON.stringify(rows),
        at: (new Date).toISOString()
    });
    say("cond", nCfg + " הגדרות אושרו · שולח " + rows.length + " נוסחים…");
    var tries = 0;
    var check = function() {
        return new Promise(function(ok) {
            setTimeout(ok, tries ? 4e3 : 2200);
        }).then(function() {
            return fetchSheet(CFG.sheetId || SHEET_ID, "טקסטים");
        }).then(function(back) {
            var map = textsFromRows(back);
            var miss = !map ? rows : rows.filter(function(x) {
                return map[x.key] !== String(x.value).trim();
            });
            if (map && !miss.length) {
                Store.set("textCache", map);
                PUBLISHED = map;
                var t = CFG.texts || {}, k;
                for (k in t) if (t.hasOwnProperty(k) && map[k] === t[k]) delete t[k];
                cfgSet("texts", t);
                relayerTexts();
                repaintTexts();
                say("done-box", "פורסם ואומת · " + nCfg + " הגדרות ו-" + rows.length + " נוסחים. מעכשיו זה מה שכל מי שנכנס לאפליקציה רואה.");
                return;
            }
            if (++tries < 4) return check();
            say("cond", "<b>ההגדרות פורסמו, המלל לא אושר.</b> " + (!map ? 'לא הצלחתי לקרוא את לשונית "טקסטים".' : miss.length + " מתוך " + rows.length + " הנוסחים לא חזרו מהגיליון.") + "<br>הנוסחים שמורים במכשיר הזה - אפשר לנסות שוב.");
        });
    };
    return check();
}

function loadContactsFromSheet() {
    var id = CFG.contactsSheet;
    if (!id) {
        alert("קודם הזינו את מזהה גיליון אנשי הקשר בהגדרות.");
        return;
    }
    fetchSheet(id, CFG.contactsTab || "גיליון1").then(function(rows) {
        if (!rows || rows.length < 2) {
            alert('לא הצלחתי לקרוא מהגיליון. ודאו שהוא משותף כ"כל מי שיש לו הקישור - מציג".');
            return;
        }
        var out = [];
        rows.slice(1).forEach(function(r) {
            var c = rowToContact(r, rows[0]);
            if (c) out.push(c);
        });
        var old = {};
        contacts().forEach(function(c) {
            old[nameKey(c.name)] = c;
        });
        out.forEach(function(c) {
            var o = old[nameKey(c.name)];
            if (o) {
                c.stage = o.stage;
                c.note = o.note;
                c.at = o.at;
                if (o.primary != null) c.primary = o.primary;
            }
        });
        saveContacts(out);
        renderCalls();
        alert(out.length + " מוסדות נטענו מהגיליון.");
    });
}

var admTab = "stu";

var ADM_INST = "";

var admIpOpen = false, admIpQ = "", admBusyAt = 0;

function admInstName(c) {
    return c ? pplName(c, null) : UI.admAll;
}

function admIpList() {
    var d = pplData(), cnt = {};
    d.rows.forEach(function(x) {
        cnt[x.c] = x.got;
    });
    var q = nameKey(admIpQ);
    var items = [ [ "", UI.admAll, d.tot ] ].concat(INSTITUTIONS.slice().sort(function(a, b) {
        return String(a.name).localeCompare(String(b.name), "he");
    }).map(function(i) {
        return [ i.code, i.name, cnt[i.code] || 0 ];
    }));
    if (cnt["-"]) items.push([ "-", UI.admNoInst, cnt["-"] ]);
    return items.filter(function(it) {
        return !q || it[0] === "" || nameKey(it[1]).indexOf(q) >= 0;
    }).map(function(it) {
        return '<button class="ip-o' + (it[0] === ADM_INST ? " on" : "") + '" data-ip="' + esc(it[0]) + '">' + "<span>" + esc(it[1]) + "</span><i>" + it[2] + "</i></button>";
    }).join("");
}

function admIpHtml() {
    return '<div class="ip" id="ip">' + '<button class="ip-b" onclick="admIpToggle()" aria-expanded="' + admIpOpen + '">' + "<b>" + esc(admInstName(ADM_INST)) + '</b><i aria-hidden="true">▾</i></button>' + '<div class="ip-p"' + (admIpOpen ? "" : " hidden") + ">" + '<input id="ip-q" type="search" placeholder="⌕ ' + esc(UI.admInstQ) + '" aria-label="' + esc(UI.admInstQ) + '" value="' + esc(admIpQ) + '">' + '<div class="ip-l" id="ip-l">' + admIpList() + "</div></div></div>";
}

function admIpWire() {
    var q = document.getElementById("ip-q"), l = document.getElementById("ip-l");
    if (q) q.oninput = function() {
        admIpQ = q.value;
        l.innerHTML = admIpList();
    };
    if (l) l.onclick = function(e) {
        var b = e.target.closest && e.target.closest("[data-ip]");
        if (b) admInstPick(b.getAttribute("data-ip"));
    };
}

function admIpToggle() {
    admIpOpen = !admIpOpen;
    admIpQ = "";
    var w = document.getElementById("ip-w");
    if (w) {
        w.innerHTML = admIpHtml();
        admIpWire();
    }
    var q = document.getElementById("ip-q");
    if (admIpOpen && q) try {
        q.focus();
    } catch (e) {}
}

document.addEventListener("click", function(e) {
    if (!admIpOpen) return;
    var ip = document.getElementById("ip");
    if (ip && document.documentElement.contains(e.target) && !ip.contains(e.target)) admIpToggle();
});

var ADM_WAY = "";

function admWay(k) {
    ADM_WAY = ADM_WAY === k ? "" : k || "";
    pplFrame({
        dfWay: ADM_WAY
    });
    admLive();
    if (ADM_WAY) admDet();
}

function admInstPick(c) {
    ADM_INST = c || "";
    Store.set("admInst", ADM_INST);
    ppl.mine = ADM_INST;
    admIpOpen = false;
    var w = document.getElementById("ip-w");
    if (w) {
        w.innerHTML = admIpHtml();
        admIpWire();
    }
    pplFrame({
        dfFilt: ADM_INST
    });
    admPane();
}

function admRefreshAll() {
    var key = (CFG.readKey || "").trim();
    admBusyAt = Date.now();
    admRefreshBtn();
    if (key) {
        pullRegs();
        conflictLoad();
        funLoad();
        trLoad();
        needsLoad();
        accLoad();
        stuckLoad();
        pushLoad();
        admRosterLoad();
        try {
            pullCalls().then(function() {
                if (admTab === "inst") admPane();
            })["catch"](function() {});
        } catch (e) {}
    }
    pplFrame({
        dfReload: 1
    });
    loadCounts().then(function() {
        if (admTab === "stu") admLive();
    })["catch"](function() {});
    setTimeout(admRefreshBtn, 1600);
}

function admRosterLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) return;
    scriptGet({
        board: "*",
        key: key,
        test: "1"
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.students || d.students.length == null) return;
        Store.set("rosterCache:all", d.students);
        if (d.parents && d.parents.length != null) Store.set("parentsCache:all", d.parents);
        admLive();
    })["catch"](function() {});
}

var admEntered = false;

function admEnterOnce() {
    if (admEntered) return;
    admEntered = true;
    setTimeout(admRefreshAll, 0);
}
