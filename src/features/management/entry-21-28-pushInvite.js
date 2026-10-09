function pushInvite(code) {
    if (!code) return;
    var row = null, i;
    for (i = 0; i < INSTITUTIONS.length; i++) {
        if (INSTITUTIONS[i].code === code) row = INSTITUTIONS[i];
    }
    pushView.only = row ? row.name : "";
    pushView.role = "צוות";
    pushView.link = "tzevet?inst=" + code + "#my";
    pushView.title = PUSH_INVITE.title;
    pushView.body = PUSH_INVITE.body;
    pushMsg = "ההודעה מוכנה למעלה. בדקו, ושלחו.";
    admPane();
}

function admPush(el) {
    if (pushMsg === "nokey") {
        el.innerHTML = '<div class="adm-card"><h4>חסרה סיסמת הקריאה</h4>' + '<p class="h">רשימת ההתראות יושבת בגיליון סגור. הדביקו בהגדרות ← ' + '"סיסמת הקריאה" את אותה מחרוזת שב-Apps Script.</p>' + '<button class="btn p" onclick="admGo(\'sys\')">להגדרות</button></div>';
        return;
    }
    var c = pushCount();
    var ROLES = [ [ "", "כולם" ], [ "צוות", "הצוות בלבד" ], [ "תלמיד", "התלמידים בלבד" ] ];
    var roleL = ROLES.filter(function(o) {
        return o[0] === (pushView.role || "");
    })[0] || ROLES[0];
    var h = '<div class="adm-card"><h4>שליחת התראה</h4>' + '<p class="h">ההתראה נחתמת ונשלחת ב-GitHub - המפתח הפרטי אינו ' + "בדפדפן ואינו יכול להיות. כאן כותבים, ומשם זה יוצא.</p>" + '<div class="fld"><div class="label">למי</div><select ' + "onchange=\"pushSet('only',this.value);admPane()\">" + '<option value="">כל מי שנרשם</option>' + INSTITUTIONS.map(function(o) {
        return '<option value="' + esc(o.name) + '"' + (pushView.only === o.name ? " selected" : "") + ">" + esc(o.name) + "</option>";
    }).join("") + "</select></div>" + '<div class="fld"><div class="label">איזה קהל</div><select ' + "onchange=\"pushSet('role',this.value);admPane()\">" + ROLES.map(function(o) {
        return '<option value="' + esc(o[0]) + '"' + (pushView.role === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select></div>" + '<div class="fld"><div class="label">כותרת <i>· רשות</i></div>' + '<input type="text" value="' + esc(pushView.title) + '" placeholder="' + esc(PROGRAM.short) + '" onchange="pushSet(\'title\',this.value)"></div>' + '<div class="fld"><div class="label">הטקסט</div>' + '<textarea rows="3" onchange="pushSet(\'body\',this.value)">' + esc(pushView.body) + "</textarea></div>" + '<div class="send-to">' + esc(UI.sendTo.replace("{w}", roleL[1] + (pushView.only ? " · " + pushView.only : ""))) + "</div>" + '<button class="btn p"' + (pushBusy ? " disabled" : "") + ' onclick="pushSend()">' + (pushBusy ? "שולח…" : "שליחה") + "</button>" + (pushMsg ? '<div class="cond" style="margin-top:10px">' + esc(pushMsg) + "</div>" : "") + '<details class="hx"' + (pushView.link ? " open" : "") + "><summary>" + esc(UI.sendAdv) + "</summary>" + '<div class="fld"><div class="label">לאן ההתראה פותחת ' + "<i>· נתיב יחסי, ריק = האפליקציה</i></div>" + '<input type="text" value="' + esc(pushView.link) + '" placeholder="tzevet?inst=lapid#my" ' + "onchange=\"pushSet('link',this.value)\"></div></details>" + "</div>" + sayLogCard();
    h += '<div class="adm-card"><h4>כמה מכיתתך הצטרפו</h4>' + '<p class="h">עדכון אישי לכל ר"ם שנרשם - כל אחד מקבל את המספר ' + "של הכיתה שלו. למי שעוד לא קבע מתי נוח לו לקבל עדכונים, " + "מתווספת לסוף ההודעה השאלה, ולחיצה פותחת אותה.</p>" + '<button class="btn p"' + (pushBusy ? " disabled" : "") + ' onclick="pushJoined()">' + (pushBusy ? "שולח…" : 'שליחה לכל הר"מים') + "</button></div>";
    h += '<div class="adm-card"><h4>הזמנה לפינה האישית</h4>' + '<p class="h">ממלא את ההודעה שלמעלה: לצוות בלבד, ופותחת ' + "ישר בפינה שבעמוד הצוות. צריך לבחור ישיבה - הקישור נושא " + "את הקוד שלה.</p>" + '<div class="fld"><div class="label">הישיבה</div><select ' + 'onchange="pushInvite(this.value)">' + '<option value="">בחרו ישיבה…</option>' + INSTITUTIONS.map(function(o) {
        return '<option value="' + esc(o.code) + '">' + esc(o.name) + "</option>";
    }).join("") + "</select></div></div>";
    h += '<div class="adm-card"><h4>מי נרשם</h4>';
    if (!pushRows) {
        h += '<p class="h">הרשימה נקראת מהגיליון הפרטי.</p>' + '<button class="btn g" onclick="pushLoad()">טעינה מהגיליון</button>';
    } else if (!pushRows.length) {
        h += '<p class="h">עוד לא נרשם אף אחד.</p>' + '<button class="btn g" onclick="pushLoad()">רענון</button>';
    } else {
        h += '<div class="row" style="padding:8px 0"><span>מקבלים התראות</span>' + "<b>" + c.ok + "</b></div>" + '<div class="row" style="padding:8px 0"><span>ההתראות חסומות אצלם</span>' + "<b" + (c.blocked ? "" : ' style="color:var(--ink-3)"') + ">" + c.blocked + "</b></div>" + '<div class="row" style="padding:8px 0"><span>לא הצליחו להתקין</span>' + "<b" + (c.noInst ? "" : ' style="color:var(--ink-3)"') + ">" + c.noInst + "</b></div>" + '<div class="plist">' + pushRows.map(function(p) {
            var mark = p.sub ? "✓" : /חסום/.test(p.res) ? "✕" : "!";
            var cls = p.sub ? "ok" : /חסום/.test(p.res) ? "no" : "warn";
            var bits = [];
            if (p.role) bits.push(p.role);
            if (p.grade) bits.push(p.grade + (p.klass ? "‎" + p.klass : ""));
            if (p.inst) bits.push(p.inst);
            if (p.dev) bits.push(p.dev);
            return '<div class="prow2 ' + cls + '">' + '<span class="pm">' + mark + "</span>" + "<div><b>" + esc(p.name || "-") + "</b>" + (bits.length ? "<span>" + esc(bits.join(" · ")) + "</span>" : "") + "</div></div>";
        }).join("") + "</div>" + '<button class="btn g" style="margin-top:10px" onclick="pushLoad()">' + "רענון</button>";
    }
    if (pushMsg && pushMsg !== "nokey" && !pushRows) {
        h += '<div class="cond" style="margin-top:10px">' + esc(pushMsg) + "</div>";
    }
    el.innerHTML = h + "</div>";
}

function textDrift() {
    var out = [];
    TEXT_FIELDS.forEach(function(f) {
        if (!f.k) return;
        var code = TX.base(f.k), now = textGet(f.k);
        if (typeof now !== "string" || typeof code !== "string") return;
        if (now === code) return;
        out.push({
            k: f.k,
            lbl: f.lbl || "",
            code: code,
            now: now
        });
    });
    return out;
}

function cfgDrift() {
    var out = [];
    PUB_KEYS.forEach(function(k) {
        var v = CV(k);
        if (v == null) return;
        out.push({
            k: k,
            v: v
        });
    });
    return out;
}

function admEmbedCard() {
    var n = textDrift().length, c = cfgDrift().length;
    return '<div class="adm-card"><h4>הטמעה בקוד</h4>' + '<p class="h">כל מה שערכתם - הנוסחים <b>וגם המתגים של "מה ' + 'מוצג"</b> - יושב בשכבה שמעל הקוד, והיא נמשכת מהגיליון אצל ' + "כל תלמיד בכל כניסה. מי שהשכבה לא הגיעה אליו רואה את מה " + "שכתוב בקוד. הטמעה בקוד היא מה שהופך את ברירת המחדל לנכונה, " + "ואחריה אפשר למחוק את השכבה.</p>" + '<div class="row" style="padding:8px 0"><span>הגדרות שפורסמו</span>' + "<b" + (c ? "" : ' style="color:var(--ink-3)"') + ">" + c + "</b></div>" + '<div class="row" style="padding:8px 0"><span>נוסחים שנפרדו מהקוד</span>' + "<b" + (n ? "" : ' style="color:var(--ink-3)"') + ">" + n + "</b></div>" + (n + c ? '<button class="btn p" onclick="admEmbedMake()">הפקת הרשימה</button>' : '<p class="h">אין מה להפיק - מה שמוצג הוא בדיוק מה שבקוד.</p>') + '<div id="adm-embed"></div></div>';
}

function admEmbedMake() {
    var list = textDrift(), cfg = cfgDrift();
    var box = document.getElementById("adm-embed");
    if (!box) return;
    var map = {};
    list.forEach(function(f) {
        map[f.k] = {
            lbl: f.lbl,
            code: f.code,
            now: f.now
        };
    });
    var out = {
        "גרסה": APP_VERSION,
        "הגדרות": {},
        "נוסחים": map
    };
    cfg.forEach(function(f) {
        out["הגדרות"][f.k] = f.v;
    });
    var txt = JSON.stringify(out, null, 2);
    box.innerHTML = '<p class="h" style="margin-top:12px">' + cfg.length + " הגדרות ו-" + list.length + " נוסחים. להעתיק את הכל ולשלוח להטמעה:</p>" + '<textarea id="adm-embed-t" rows="9" dir="ltr" readonly ' + 'style="direction:ltr;text-align:left;font-size:.72rem"></textarea>' + '<button class="btn gd" onclick="admEmbedCopy()">העתקה</button>' + '<p class="h" style="margin-top:10px"><b>אחרי שההטמעה בקוד ' + 'נדחפה ופורסמה</b> - "שחזור כל הנוסחים שבקוד" למעלה, ואז ' + "<b>פרסום</b>. בלי הפרסום השכבה נמחקת רק במכשיר הזה " + "וממשיכה לרוץ אצל כולם.</p>";
    var t = document.getElementById("adm-embed-t");
    if (t) t.value = txt;
}

function admEmbedCopy() {
    var t = document.getElementById("adm-embed-t");
    if (!t) return;
    var done = function(ok) {
        var b = t.parentNode.querySelector("button");
        if (b) b.textContent = ok ? "הועתק ✓" : "לא הצלחתי - סמנו ידנית";
    };
    t.readOnly = false;
    t.focus();
    t.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t.value).then(function() {
            done(true);
        })["catch"](function() {
            done(false);
        });
    } else {
        var ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (e) {}
        done(ok);
    }
    t.readOnly = true;
}

function admA11yCard() {
    var d = CFG.texts || {};
    var F = [ [ "a11y.coordName", "שם", 0 ], [ "a11y.coordRole", "תפקיד", 0 ], [ "a11y.coordWay", 'טלפון, דוא"ל, או שניהם', 1 ] ];
    var filled = textGet("a11y.coordName") || textGet("a11y.coordWay");
    return '<div class="adm-card" style="margin-bottom:11px">' + "<h4>הצהרת הנגישות - אל מי פונים</h4>" + '<p class="h">' + (filled ? "הפרטים מופיעים בתחתית <b>הצהרת הנגישות</b>, שאליה מקשר " + "כל עמוד באתר." : '<b style="color:var(--warn)">טרם מולא.</b> עד שימולא, ' + "ההצהרה אומרת שאין עדיין איש קשר - וזה בדיוק מה שהתקנה " + "מבקשת שיהיה שם.") + "</p>" + F.map(function(f) {
        var cur = textGet(f[0]), changed = d[f[0]] != null && d[f[0]] !== belowText(f[0]);
        return '<div class="fld"><div class="label">' + esc(f[1]) + (changed ? ' <span style="color:var(--gold)">•</span>' : "") + "</div>" + (f[2] ? '<textarea rows="2" onchange="admTextSet(\'' + f[0] + "',this.value)\">" + esc(cur) + "</textarea>" : '<input type="text" value="' + esc(cur) + '" onchange="admTextSet(\'' + f[0] + "',this.value)\">") + "</div>";
    }).join("") + "</div>";
}

function tkTour() {
    tkStart();
    setTimeout(function() {
        tourOpen(0);
        setTimeout(TX.scan, 260);
    }, 260);
}

function admImgPick(inp, key) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
        alert("צריך קובץ תמונה.");
        return;
    }
    var r = new FileReader;
    r.onload = function() {
        var im = new Image;
        im.onload = function() {
            var w = im.width, h = im.height, max = 360;
            if (w > max) {
                h = Math.round(h * max / w);
                w = max;
            }
            var cv = document.createElement("canvas");
            cv.width = w;
            cv.height = h;
            cv.getContext("2d").drawImage(im, 0, 0, w, h);
            var out;
            try {
                out = cv.toDataURL("image/png");
            } catch (e) {
                out = r.result;
            }
            if (out.length > 26e4) out = cv.toDataURL("image/jpeg", .85);
            admTextSet(key, out);
            alert("הלוגו נטען (" + Math.round(out.length / 1024) + "KB). " + "צריך ללחוץ פרסום כדי שכולם יראו אותו.");
        };
        im.onerror = function() {
            alert("לא הצלחתי לקרוא את התמונה.");
        };
        im.src = r.result;
    };
    r.readAsDataURL(f);
}

function admTextSet(k, v) {
    var t = CFG.texts || {};
    v = String(v).trim();
    if (v === "" || v === belowText(k)) delete t[k]; else t[k] = v;
    cfgSet("texts", t);
    relayerTexts();
    repaintTexts();
    admPane();
}

var KEEP_TEXT = {
    "a11y.coordName": 1,
    "a11y.coordWay": 1,
    "a11y.coordRole": 1
};

function keepOnly(map) {
    var out = {};
    for (var k in map) if (map.hasOwnProperty(k) && KEEP_TEXT[k]) out[k] = map[k];
    return out;
}

function admTextReset() {
    if (!confirm("להחזיר את כל הנוסחים לערך שבקוד? " + "הפרסום הבא ימחק גם את מה שפורסם.\n\n" + "פרטי איש הקשר לנגישות יישמרו.")) return;
    PUBLISHED = keepOnly(PUBLISHED);
    Store.set("textCache", PUBLISHED);
    cfgSet("texts", keepOnly(CFG.texts || {}));
    relayerTexts();
    repaintTexts();
    admPane();
}

function repaintTexts() {
    renderHome();
    if (document.getElementById("reg-body").innerHTML) renderReg();
    TX.scan();
}

TX.init({
    repaint: repaintTexts,
    root: function() {
        return document.querySelector(".view.on");
    },
    places: [ [ "בית", function() {
        show("home");
    } ], [ "הרשמה", function() {
        show("reg");
    } ], [ "שבוע", function() {
        var w = contentFor(homeTrack);
        openWeek(homeTrack, w.i < 0 ? 0 : w.i);
    } ] ],
    onStop: function() {
        show("admin");
        admTab = "more";
        renderAdmin();
    }
});
