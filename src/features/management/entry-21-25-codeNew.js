function codeNew(code, name) {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        linkState.msg = "חסרה סיסמת הקריאה. הגדרות ← שרת ההרשמות.";
        admPane();
        return;
    }
    var had = instCode(code);
    if (had && !confirm("קוד חדש ל" + name + " יבטל את הקישור שכבר בידי הצוות, " + "ותצטרכו לשלוח להם את החדש.\n\nלהמשיך?")) return;
    linkState.msg = "מייצר…";
    admPane();
    scriptGet({
        newcode: code,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.code) {
            linkState.msg = esc(d && d.message || "לא קיבלתי תשובה מהסקריפט.");
            admPane();
            return;
        }
        setInstCode(code, d.code);
        linkState.msg = "קוד חדש ל" + esc(name) + ' · <b dir="ltr">' + esc(d.code) + "</b> · שלחו להם את הקישור הכחול מחדש.";
        admPane();
    }).catch(function() {
        linkState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

var ROW_KEYS = [ [ "inter", "דף אינטראקטיבי", "ללמוד את הדף שלב אחר שלב · מוצג רק לדף שסומן" ], [ "daf", "צורת הדף", "קובץ הדף להדפסה" ], [ "chav", "פירוש חברותא", "קובץ הביאור על הדף" ], [ "sugya", "הסוגיה היומית", "החוברת הדיגיטלית" ] ];

function soonToggle() {
    var r = CV("rows") || {};
    r.soon = !CFG_SOON();
    cfgSet("rows", r);
    renderHome();
    admPane();
}

function admMarkHint() {
    var el = document.getElementById("rk-inter");
    if (!el || !showRow("inter")) return;
    loadMarked().then(function(m) {
        var el2 = document.getElementById("rk-inter");
        if (!el2 || !m) return;
        var wi = weekIndex(), first = wi < 0, wk = first ? 0 : wi;
        var miss = [], have = [];
        TRACKS.forEach(function(tr) {
            var daf = (tr.cal[wk] || [])[2];
            if (!daf || daf === "סיום") return;
            ((m[tr.id] || {})[dafKey(daf)] ? have : miss).push(tr.masechet + " " + daf);
        });
        if (!miss.length) {
            el2.innerHTML = (first ? "הדף הראשון" : "הדף השבוע") + " מסומן ✓ · " + esc(have.join(" · "));
            return;
        }
        el2.innerHTML = "<b>המתג דלוק, אבל " + esc(miss.join(" · ")) + " עדיין לא סומן בסטודיו - ולכן השורה לא מופיעה לאיש.</b>";
    }).catch(function() {});
}

function homeToggle(k) {
    var r = CV("rows") || {};
    r[k] = !showRow(k);
    cfgSet("rows", r);
    renderHome();
    admPane();
}

function rowToggle(k) {
    var r = CV("rows") || {};
    r[k] = !showRow(k);
    cfgSet("rows", r);
    admPane();
    admMarkHint();
}

function admToggle(code) {
    var j = CV("joined") || {};
    var cur = INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0];
    var want = !(cur && cur.joined);
    j[code] = want;
    cfgSet("joined", j);
    stageFromJoined(code, want);
    admPane();
    renderHome();
}

function stageFromJoined(code, want) {
    var inst = INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0];
    if (!inst) return;
    var l = contacts(), hit = -1;
    for (var i = 0; i < l.length; i++) {
        var m = instByName(l[i].key || l[i].name);
        if (m && m.code === code) {
            hit = i;
            break;
        }
    }
    if (hit < 0) return;
    var c = l[hit];
    if (want && c.stage === "joined") return;
    if (!want && c.stage !== "joined") return;
    c.stage = want ? "joined" : "talked";
    c.at = (new Date).toISOString();
    jnl(c);
    saveContacts(l);
    pushCalls();
}

var dataState = {
    d: null,
    msg: "",
    done: "",
    open: "",
    got: {}
};

var TAB_WARN = {
    "סימוני הדף": "כאן יושבת כל עבודת הסטודיו - גבולות עמודים וחלוקה לקטעים. " + "ניקוי מוחק אותה, והדף האינטראקטיבי ייעלם לכל התלמידים.",
    "טקסטים": "כאן יושב כל המלל שערכתם. ניקוי מחזיר את הנוסח שבקוד.",
    "הגדרות": "כאן יושבים המתגים שפרסמתם. ניקוי מחזיר את כולם לברירת המחדל " + "אצל כל מי שנכנס.",
    "מוסדות": "רשימת המוסדות. ניקוי מחזיר את הרשימה שבקוד."
};

function admData(el) {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        el.innerHTML = '<div class="adm-card"><h4>נתונים</h4>' + '<p class="h">כאן רואים מה יש בגיליונות, מורידים עותק ומנקים. ' + "צריך קודם סיסמת קריאה - היא גם מה שמונע ממישהו אחר למחוק " + "לכם את הגיליון.</p>" + '<div class="cond" style="margin-top:10px">מלאו את "סיסמת הקריאה" ' + "בכרטיס שרת ההרשמות שבהגדרות, ואת אותה מחרוזת ב-Apps Script " + "בשורת <code>READ_KEY</code>.</div></div>";
        return;
    }
    var d = dataState.d;
    var h = '<div class="adm-card" style="margin-bottom:11px"><h4>נתונים</h4>' + '<p class="h">מה יש בגיליונות ברגע זה. "הורדה" שומרת עותק אצלכם ' + "כקובץ אקסל - שימושי לפני ניקוי, כי מחיקה כאן אינה הפיכה.</p>" + '<div style="margin-top:10px;display:flex;gap:7px">' + '<button class="btn g" style="margin:0;flex:1" ' + 'onclick="dataLoad()">' + (d ? "רענון" : "קריאת המצב") + "</button>" + '<button class="btn g" style="margin:0;flex:1" ' + 'onclick="dataRecount()">ספירה מחדש</button></div>' + '<div style="display:flex;gap:8px;margin-top:8px">' + '<button class="btn" style="margin:0;flex:1;background:#B3261E;color:#fff" ' + 'onclick="dataDedupe()">נקה כפילויות ב"לומדים"</button></div>' + (dataState.done ? '<div class="done-box" style="margin-top:10px">' + dataState.done + "</div>" : "") + (dataState.msg ? '<div class="cond" style="margin-top:10px">' + dataState.msg + "</div>" : "") + "</div>";
    if (d) {
        h += dataGroup("הגיליון הציבורי", d.sheet, d.tabs || [], "") + (d.privId ? dataGroup("הגיליון הפרטי", d.privSheet, d.privTabs || [], d.privId) : '<div class="adm-card"><h4>הגיליון הפרטי</h4>' + (d.privateOn ? '<div class="cond">מוגדר בסקריפט, אבל הסיסמה שבמכשיר הזה ' + "אינה תואמת לזו שבו - ולכן אי אפשר לראות אותו מכאן.<br>" + 'הגדרות ← שרת ההרשמות ← "סיסמת הקריאה".</div>' : '<div class="cond"><b>אינו מוגדר.</b> שמות וטלפונים נכתבים ' + "לגיליון שמשותף לצפייה.<br>ב-Apps Script, בראש הקובץ: " + "<code>PRIVATE_ID</code>.</div>") + "</div>");
    }
    el.innerHTML = h;
}

function dataGroup(title, name, tabs, ss) {
    var h = '<div class="adm-card" style="margin-bottom:11px"><h4>' + esc(title) + "</h4>" + '<p class="h">' + esc(name || "") + "</p>";
    if (!tabs.length) h += '<div class="cond" style="margin-top:10px">אין לשוניות.</div>';
    tabs.forEach(function(t) {
        var open = dataState.open === ss + "|" + t.name;
        h += '<div class="row"><div>' + esc(t.name) + '<div class="sub">' + t.rows + " שורות</div></div>" + '<div style="display:flex;gap:6px">' + '<button class="cp" onclick="dataGrab(' + dq(t.name) + "," + dq(ss) + ')">הורדה</button>' + '<button class="cp' + (open ? "" : " kill") + '" onclick="dataAsk(' + dq(t.name) + "," + dq(ss) + ')">' + (open ? "ביטול" : "ניקוי") + "</button></div></div>";
        if (open) h += dataConfirm(t, ss);
    });
    return h + "</div>";
}

function dq(v) {
    return "'" + String(v || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function dataConfirm(t, ss) {
    var warn = TAB_WARN[t.name];
    return '<div class="cond" style="margin-top:9px">' + "<b>" + t.rows + ' שורות יימחקו מ"' + esc(t.name) + '" - לצמיתות.</b>' + (warn ? "<br>" + esc(warn) : "") + (dataState.got[ss + "|" + t.name] ? "<br>עותק ירד למכשיר ✓" : "") + '<button class="btn" style="margin-top:9px;background:#B3261E;color:#fff" ' + 'onclick="dataWipe(' + dq(t.name) + "," + dq(ss) + "," + t.rows + ')">' + "מחיקה</button></div>";
}

function dataLoad(keep) {
    if (!keep) dataState.done = "";
    dataState.msg = "קורא…";
    admPane();
    return scriptGet({
        key: (CFG.readKey || "").trim()
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            dataState.msg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
        } else if (!d.privId && d.privTabs === undefined && !d.tabs) {
            dataState.msg = "הסקריפט ענה, אבל לא החזיר לשוניות.";
        } else {
            dataState.d = d;
            dataState.msg = "";
            if (d.version < 13) dataState.msg = "הפריסה ישנה - גרסה " + d.version + ". מחיקה נוספה בגרסה 13, " + "ולכן כפתורי הניקוי לא יעבדו עד פריסה מחדש.";
        }
        admPane();
    }).catch(function() {
        dataState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function dataRecount() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        dataState.msg = "חסרה סיסמת הקריאה.";
        admPane();
        return;
    }
    dataState.done = "";
    dataState.msg = "סופר…";
    admPane();
    scriptGet({
        recount: 1,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            dataState.msg = esc(d && d.message || "לא קיבלתי תשובה מהסקריפט.");
            admPane();
            return;
        }
        dataState.done = "המונים נספרו מחדש. הלוח של ראשי החטיבות יתעדכן " + "בפתיחה הבאה שלהם.";
        dataLoad(1);
    }).catch(function() {
        dataState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function dataAsk(tab, ss) {
    var k = ss + "|" + tab;
    dataState.open = dataState.open === k ? "" : k;
    admPane();
}

function dataGrab(tab, ss) {
    dataState.done = "";
    dataState.msg = 'מוריד את "' + esc(tab) + '"…';
    admPane();
    var p = {
        read: tab,
        key: (CFG.readKey || "").trim()
    };
    if (ss) p.ss = ss;
    return scriptGet(p).then(function(d) {
        if (!d || d.status !== "ok") {
            dataState.msg = d && d.message || "לא הצלחתי לקרוא את הלשונית.";
            admPane();
            return false;
        }
        var rows = d.rows || [];
        var csv = "\ufeff" + rows.map(function(r) {
            return r.map(function(c) {
                return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"';
            }).join(",");
        }).join("\r\n");
        saveFile("hadaf-" + asciiName(tab) + "-" + stamp() + ".csv", csv);
        dataState.got[ss + "|" + tab] = 1;
        dataState.msg = '"' + esc(tab) + '" ירדה · ' + Math.max(0, rows.length - 1) + " שורות.";
        admPane();
        return true;
    }).catch(function() {
        dataState.msg = "לא הצלחתי לקרוא את הלשונית.";
        admPane();
        return false;
    });
}

var TAB_EN = {
    "הרשמות": "registrations",
    "לומדים": "students",
    "לימוד": "learning",
    "חידות": "quiz",
    "מונים": "counters",
    "מוני-לימוד": "learn-counters",
    "הגדרות": "settings",
    "טקסטים": "texts",
    "מוסדות": "institutions",
    "סימוני הדף": "daf-marks",
    "יומן שיחות": "call-log",
    "אנשי קשר": "contacts"
};

function asciiName(tab) {
    if (TAB_EN[tab]) return TAB_EN[tab];
    var s = String(tab || "").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-_]/g, "");
    return s || "sheet";
}

function stamp() {
    var d = new Date, p = function(n) {
        return (n < 10 ? "0" : "") + n;
    };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
}

function saveFile(name, text) {
    try {
        var b = new Blob([ text ], {
            type: "text/csv;charset=utf-8"
        });
        var u = URL.createObjectURL(b);
        var a = document.createElement("a");
        a.href = u;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function() {
            URL.revokeObjectURL(u);
        }, 4e3);
        return true;
    } catch (e) {
        return false;
    }
}

function dataWipe(tab, ss, rows) {
    if (!confirm(rows + ' שורות יימחקו מ"' + tab + '" ולא יהיה מהיכן ' + "להחזיר אותן.\n\nלמחוק?")) {
        dataState.msg = "בוטל. לא נמחק דבר.";
        admPane();
        return;
    }
    dataState.done = "";
    dataState.msg = "מוחק…";
    admPane();
    var p = {
        clear: tab,
        key: (CFG.readKey || "").trim()
    };
    if (ss) p.ss = ss;
    scriptGet(p).then(function(d) {
        if (!d || d.status !== "success") {
            dataState.msg = "<b>לא נמחק.</b> " + esc(d && d.message || "אין תשובה מהסקריפט.");
            admPane();
            return;
        }
        dataState.open = "";
        dataState.done = !d.removed ? '"' + esc(tab) + '" כבר הייתה ריקה - לא נמחק דבר.' : "נמחקו " + d.removed + ' שורות מ"' + esc(tab) + '".' + (d.left ? " נשארו " + d.left + "." : " הלשונית ריקה.");
        dataLoad(1);
    }).catch(function() {
        dataState.msg = "<b>לא נמחק.</b> אין תשובה מהסקריפט.";
        admPane();
    });
}

function dataDedupe() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        dataState.msg = "חסרה סיסמת הקריאה.";
        admPane();
        return;
    }
    if (!confirm('שורות כפולות של אותו תלמיד ב"לומדים" יימחקו - ' + "יישאר רק האחרון שלו. וגם מי שנרשם מכמה מכשירים " + "(אותו טלפון, שם ותפקיד) יאוחד לשורה אחת. אין דרך " + "חוזרת מלבד היסטוריית הגרסאות של הגיליון עצמו.\n\nלנקות?")) {
        dataState.msg = "בוטל. לא נמחק דבר.";
        admPane();
        return;
    }
    dataState.done = "";
    dataState.msg = "מנקה…";
    admPane();
    scriptGet({
        dedupe: 1,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            dataState.msg = "<b>לא נוקה.</b> " + esc(d && d.message || "אין תשובה מהסקריפט.");
            admPane();
            return;
        }
        dataState.done = !d.removed && !d.merged ? '"לומדים" כבר הייתה נקייה - לא נמחק דבר.' : [ d.removed ? "נמחקו " + d.removed + ' שורות כפולות מ"לומדים".' : "", d.merged ? "אוחדו " + d.merged + " שנרשמו מכמה מכשירים." : "" ].filter(Boolean).join(" ");
        dataLoad(1);
    }).catch(function() {
        dataState.msg = "<b>לא נוקה.</b> אין תשובה מהסקריפט.";
        admPane();
    });
}
