var WA_HOME = [ "ui.teamWa", "ui.linkWa", "ui.dadWa" ];

function textOrphans() {
    return TEXT_FIELDS.filter(function(f) {
        if (!f.k || WA_HOME.indexOf(f.k) >= 0) return false;
        return f.img || f.off || f.k.indexOf("gate.") === 0;
    });
}

function admText(el) {
    var d = CFG.texts || {};
    var dirty = TEXT_FIELDS.filter(function(f) {
        return f.k && d[f.k] != null && d[f.k] !== belowText(f.k);
    }).length;
    var PLACES = [ [ "העמוד הראשי", "הבית, ההרשמה ומסך השבוע", "tkStart()" ], [ "המדריך", "שש העצירות שראש חטיבה רואה בכניסה", "tkTour()" ], [ "מסך התלמיד", "57 נוסחים - המלל הכי חשוף בתוכנית", "location.href='join.html?tedit=1'" ], [ "הפנייה להוצאה", "המכתב שנשלח לוגשל", "location.href='rights.html?tedit=1'" ], [ "הצהרת הנגישות", "מה שהחוק מחייב אותנו לפרסם", "location.href='accessibility.html?tedit=1'" ], [ "עמוד הפרטים", "פרטיות, נגישות וזכויות - שבתחתית כל מסך", "location.href='info.html?tedit=1'" ], [ "עמוד הצוות", "מה שהר״מים מקבלים - היעד, ההנחיות והסיפור", "location.href='tzevet.html?tedit=1'" ], [ "המסע", "הרצועה שמלווה ראש חטיבה בתוך האפליקציה", "location.href='index.html?masa=1&tedit=1'" ], [ "הדגמת הפתיחה", "כבויה כרגע - תלמידים והורים אינם רואים אותה. כאן רק לצפייה", "window.open('join.html?intro=1','_blank')" ] ];
    el.innerHTML = '<div class="adm-card" style="margin-bottom:11px"><h4>עריכת המלל</h4>' + '<p class="h">כל נוסח נערך במקום שבו הוא מופיע: נכנסים למסך, ' + "מקישים על הטקסט, וכותבים. השינוי נראה מיד ונשמר במכשיר הזה " + "בלבד - עד <b>פרסום</b>, שמחיל אותו על כולם.</p>" + '<div class="row" style="padding:8px 0"><span>שינויים שטרם פורסמו</span>' + "<b" + (dirty ? "" : ' style="color:var(--ink-3)"') + ">" + dirty + "</b></div>" + PLACES.map(function(p) {
        return '<button class="btn gd" style="text-align:start" onclick="' + p[2] + '">' + esc(p[0]) + "</button>" + '<p class="h" style="margin:5px 0 12px">' + esc(p[1]) + "</p>";
    }).join("") + '<button class="btn warn" onclick="admTextReset()">שחזור כל הנוסחים שבקוד</button>' + '<div id="adm-text-msg"></div></div>' + admEmbedCard() + admA11yCard() + '<div class="adm-card"><h4>שער הדף והתמונות</h4>' + '<p class="h">השער נפתח בתוך הדף האינטראקטיבי, ולו יש סטודיו - ' + "ולכן אין שולחים אתכם לערוך שם על המסך. ותמונה אינה טקסט " + "שאפשר להקיש עליו. שניהם כאן.</p>" + textOrphans().map(textBox).join("") + "</div>";
}

var guKind = "ios";

var GU_TXT = {
    ios: [ "guide.n1", "guide.n2" ],
    droid: [ "guide.a1", "guide.a2", "guide.a3" ]
};

var GU_IOS = [ "guide.s2e", "guide.s3", "guide.s4", "guide.s5" ];

function guPick(k) {
    guKind = k;
    guAt = 0;
    admPane();
}

function guCard() {
    if (typeof GUIDE_UI === "undefined") return "";
    var keys = (GU_TXT[guKind] || []).concat(guKind === "droid" ? [] : GU_IOS);
    return '<div class="adm-card" style="margin-bottom:11px">' + "<h4>מדריך ההתקנה</h4>" + '<p class="h">מה שרואים כשמתקינים את האפליקציה. לכל מכשיר ' + "מסלול משלו - כאן שניהם, גם כשבידיים מכשיר אחד " + "והאפליקציה כבר מותקנת עליו.<br>" + 'בחרו מסלול, ועברו בו עם "הבא" עד הסוף. מסלול האייפון ' + "הוא צילומי מסך אמיתיים; אנדרואיד מצויר.</p>" + '<div class="tabs" style="margin:0 0 12px">' + GUIDE_UI.kinds().map(function(k) {
        return "<button" + (k[0] === guKind ? ' class="on"' : "") + " onclick=\"guPick('" + k[0] + "')\">" + esc(k[1]) + "</button>";
    }).join("") + "</div>" + '<div class="gu-box" id="gu-prev"></div>' + '<div class="adm-sub2"><h5>הנוסחים של המסלול הזה</h5>' + keys.map(function(k) {
        var f = null;
        TEXT_FIELDS.forEach(function(x) {
            if (x.k === k) f = x;
        });
        return f ? textBox(f) : "";
    }).join("") + '<p class="h" style="margin-top:10px">מונה השלבים והכפתורים ' + "משותפים לכל המסלולים:</p>" + [ "guide.step", "guide.next", "guide.back", "guide.fin", "guide.help", "guide.helpB" ].map(function(k) {
        var f = null;
        TEXT_FIELDS.forEach(function(x) {
            if (x.k === k) f = x;
        });
        return f ? textBox(f) : "";
    }).join("") + "</div></div>";
}

var guAt = 0;

function guPaint() {
    var box = document.getElementById("gu-prev");
    if (!box || typeof GUIDE_UI === "undefined") return;
    GUIDE_UI.force(guKind);
    GUIDE_UI.mount(box, function() {
        guAt = 0;
        guPaint();
    });
    if (guAt) GUIDE_UI.seek(guAt);
    guWatch();
}

function guWatch() {
    var b = document.getElementById("gu-next"), k = document.getElementById("gu-back");
    if (b) b.addEventListener("click", function() {
        setTimeout(function() {
            guAt = GUIDE_UI.at();
            guWatch();
        }, 0);
    });
    if (k) k.addEventListener("click", function() {
        setTimeout(function() {
            guAt = GUIDE_UI.at();
            guWatch();
        }, 0);
    });
}

function textBox(f) {
    var d = CFG.texts || {};
    var cur = textGet(f.k), changed = d[f.k] != null && d[f.k] !== belowText(f.k);
    var head = '<div class="label">' + esc(f.lbl) + (changed ? ' <span style="color:var(--gold)">•</span>' : "") + "</div>";
    if (f.img) {
        return '<div class="fld">' + head + (cur ? '<div class="imgbox"><img src="' + esc(cur) + '" alt="">' + "<button onclick=\"admTextSet('" + f.k + "','')\">הסרה</button></div>" : "") + '<input type="file" accept="image/*" ' + "onchange=\"admImgPick(this,'" + f.k + "')\">" + '<p class="h" style="margin-top:6px">אפשר גם להדביק כתובת תמונה:</p>' + '<input type="text" dir="ltr" placeholder="https://…" value="' + (cur.indexOf("data:") === 0 ? "" : esc(cur)) + '" onchange="admTextSet(\'' + f.k + "',this.value)\"></div>";
    }
    return '<div class="fld">' + head + (f.ml ? '<textarea rows="3" onchange="admTextSet(\'' + f.k + "',this.value)\">" + esc(cur) + "</textarea>" : '<input type="text" value="' + esc(cur) + '" onchange="admTextSet(\'' + f.k + "',this.value)\">") + "</div>";
}

var pushRows = null, pushMsg = "", pushBusy = false;

var pushView = {
    title: "",
    body: "",
    only: "",
    role: "",
    link: ""
};

var stuckRows = null, stuckMsg = "", stuckBusy = 0, stuckAll = false;

function stuckParse(rows) {
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
        if (!g("שם") && !g("טלפון")) continue;
        out.push({
            row: i + 1,
            name: g("שם"),
            phone: g("טלפון"),
            inst: g("ישיבה"),
            code: g("קוד ישיבה"),
            grade: g("שכבה"),
            klass: g("כיתה"),
            dev: g("מכשיר"),
            what: g("מה קרה"),
            diag: g("אבחון"),
            done: !!g("טופל"),
            at: g("תאריך")
        });
    }
    return out.filter(function(p) {
        return !p.done;
    }).reverse().concat(out.filter(function(p) {
        return p.done;
    }).reverse());
}

function stuckLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        stuckMsg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    stuckMsg = "טוען…";
    admPane();
    return scriptGet({
        read: "תקועים",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            stuckMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        stuckRows = stuckParse(d.rows);
        stuckMsg = "";
        admPane();
        return true;
    }).catch(function() {
        stuckMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function stuckInst(p) {
    if (p.code) return p.code;
    var by = (INSTITUTIONS || []).filter(function(i) {
        return i.name === p.inst;
    })[0];
    return by ? by.code : "";
}

function stuckText(p) {
    return fill(UI.stuckWa || "", {
        name: (p.name || "").split(" ")[0] || p.name || "",
        dev: p.dev || "הטלפון",
        link: joinUrl(stuckInst(p))
    });
}

function stuckDone(row) {
    var key = (CFG.readKey || "").trim();
    if (!key) return;
    stuckBusy = row;
    admPane();
    scriptGet({
        helpdone: row,
        key: key
    }).then(function(d) {
        stuckBusy = 0;
        if (d && d.status === "ok") {
            stuckLoad();
        } else {
            stuckMsg = "לא הצלחתי לסמן: " + (d && d.message || "אין תשובה.");
            admPane();
        }
    }).catch(function() {
        stuckBusy = 0;
        stuckMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function stuckShowAll() {
    stuckAll = !stuckAll;
    admPane();
}

var conflictRows = null, conflictMsg = "", conflictBusy = 0, conflictAll = false;

function conflictParse(rows) {
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
        if (!g("קוד ישיבה")) continue;
        out.push({
            row: i + 1,
            code: g("קוד ישיבה"),
            inst: g("ישיבה"),
            prevWho: g("איש קשר קודם"),
            prevPhone: g("טלפון קודם"),
            prevTotal: g('סה"כ גמרות קודם'),
            prevAt: g("נרשם קודם"),
            newWho: g("איש קשר חדש"),
            newPhone: g("טלפון חדש"),
            newTotal: g('סה"כ גמרות חדש'),
            done: !!g("טופל")
        });
    }
    return out.filter(function(p) {
        return !p.done;
    }).reverse().concat(out.filter(function(p) {
        return p.done;
    }).reverse());
}

function conflictLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        conflictMsg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    conflictMsg = "טוען…";
    admPane();
    return scriptGet({
        read: "התנגשויות הרשמה",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            conflictMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        conflictRows = conflictParse(d.rows);
        conflictMsg = "";
        admPane();
        return true;
    }).catch(function() {
        conflictMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function conflictDone(row) {
    var key = (CFG.readKey || "").trim();
    if (!key) return;
    conflictBusy = row;
    admPane();
    scriptGet({
        conflictdone: row,
        key: key
    }).then(function(d) {
        conflictBusy = 0;
        if (d && d.status === "ok") {
            conflictLoad();
        } else {
            conflictMsg = "לא הצלחתי לסמן: " + (d && d.message || "אין תשובה.");
            admPane();
        }
    }).catch(function() {
        conflictBusy = 0;
        conflictMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function conflictShowAll() {
    conflictAll = !conflictAll;
    admPane();
}

function admConflicts() {
    var h = '<div class="adm-card"><h4>התנגשויות הרשמה</h4>';
    if (!conflictRows) {
        h += '<p class="h">שני אנשי קשר שונים שנרשמו לאותו מוסד יופיעו כאן - ' + "הרשימה נקראת מהגיליון הפרטי.</p>" + '<button class="btn g" onclick="conflictLoad()">טעינה מהגיליון</button>';
        if (conflictMsg && conflictMsg !== "nokey") {
            h += '<div class="cond" style="margin-top:10px">' + esc(conflictMsg) + "</div>";
        }
        return h + "</div>";
    }
    var open = conflictRows.filter(function(p) {
        return !p.done;
    });
    if (!open.length && !conflictAll) {
        h += '<p class="h">אין התנגשות פתוחה. ' + (conflictRows.length ? "כולן טופלו." : "לא נמצאה עד כה אף אחת.") + '</p><button class="btn g" onclick="conflictLoad()">רענון</button>';
        if (conflictRows.length) {
            h += '<button class="btn g" style="margin-top:8px" ' + 'onclick="conflictShowAll()">להראות את מי שטופל (' + conflictRows.length + ")</button>";
        }
        return h + "</div>";
    }
    var list = conflictAll ? conflictRows : open;
    h += '<p class="h">' + open.length + " " + (open.length === 1 ? "התנגשות ממתינה" : "התנגשויות ממתינות") + ". שני הצדדים כפי שהם נכתבו בגיליון - ההחלטה אם זה עדכון " + 'תמים או סתירה שצריך לברר היא שלכם.</p><div class="plist">';
    h += list.map(function(p) {
        var side = function(who, phone, total, at) {
            if (!who) return '<span class="h">אין נתון</span>';
            var num = waNum(phone);
            return "<div><b>" + esc(who) + "</b>" + (phone ? "<span>" + esc(phone) + "</span>" : "") + (total ? "<span>" + esc(total) + " גמרות</span>" : "") + (at ? "<span>" + esc(String(at).slice(0, 10)) + "</span>" : "") + (num ? '<a class="btn gr" style="width:auto;padding:6px 12px;margin-top:5px" ' + 'target="_blank" rel="noopener" href="https://wa.me/' + num + '">וואטסאפ</a>' : "") + "</div>";
        };
        return '<div class="prow2 ' + (p.done ? "ok" : "warn") + '">' + '<span class="pm">' + (p.done ? "✓" : "!") + "</span>" + '<div style="flex:1"><b>' + esc(p.inst || p.code) + "</b>" + '<div style="display:flex;gap:14px;margin-top:6px;flex-wrap:wrap">' + side(p.prevWho, p.prevPhone, p.prevTotal, p.prevAt) + side(p.newWho, p.newPhone, p.newTotal, "") + "</div>" + (p.done ? "" : '<button class="btn g" style="width:auto;padding:8px 14px;margin-top:9px"' + (conflictBusy === p.row ? " disabled" : "") + ' onclick="conflictDone(' + p.row + ')">' + (conflictBusy === p.row ? "רגע…" : "טופל") + "</button>") + "</div></div>";
    }).join("");
    h += '</div><button class="btn g" style="margin-top:10px" ' + 'onclick="conflictLoad()">רענון</button>';
    if (!conflictAll && conflictRows.length > open.length) {
        h += '<button class="btn g" style="margin-top:8px" onclick="conflictShowAll()">' + "להראות גם את מי שטופל</button>";
    }
    if (conflictMsg && conflictMsg !== "nokey") {
        h += '<div class="cond" style="margin-top:10px">' + esc(conflictMsg) + "</div>";
    }
    return h + "</div>";
}
