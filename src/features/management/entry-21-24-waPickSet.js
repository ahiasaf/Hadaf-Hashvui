var waPick = "";

function waPickSet(v) {
    waPick = v;
    admPane();
}

function waMsgs() {
    return [ {
        k: "ui.teamWa",
        lbl: "לר״מים ולראשי חטיבות",
        sub: "הקישור לעמוד הצוות - לא לשלוח לקבוצת כיתה",
        url: function(c) {
            return tzevetUrl(c);
        }
    }, {
        k: "ui.linkWa",
        lbl: "לתלמידים",
        sub: "לקבוצות הכיתה",
        url: function(c) {
            return joinUrl(c);
        }
    }, {
        k: "ui.dadWa",
        lbl: "להורים",
        sub: "לקבוצות ההורים, לצד הפלייר. בלי קוד ישיבה - ההורה בוחר",
        url: function() {
            return dadUrl();
        }
    } ];
}

function admWaCard() {
    var list = INSTITUTIONS;
    if (!waPick && list.length) waPick = list[0].code;
    var row = null, i;
    for (i = 0; i < list.length; i++) if (list[i].code === waPick) row = list[i];
    var name = row ? row.name : "רשת בני עקיבא";
    var d = CFG.texts || {};
    return '<div class="adm-card" style="margin-bottom:11px">' + "<h4>ההודעות שאני שולח</h4>" + '<p class="h">כל מה שיוצא בוואטסאפ, במקום אחד. עריכה נשמרת ' + "במכשיר עד <b>פרסום</b>, והכפתור שולח את מה שכתוב עכשיו.</p>" + '<div class="fld"><div class="label">לאיזו ישיבה</div>' + '<select onchange="waPickSet(this.value)">' + list.map(function(o) {
        return '<option value="' + esc(o.code) + '"' + (o.code === waPick ? " selected" : "") + ">" + esc(o.name) + "</option>";
    }).join("") + "</select></div>" + waMsgs().map(function(m) {
        var raw = textGet(m.k);
        var out = fill(raw, {
            inst: name,
            url: m.url(waPick)
        });
        var changed = d[m.k] != null && d[m.k] !== belowText(m.k);
        return '<div class="wamsg">' + '<div class="label">' + esc(m.lbl) + (changed ? ' <span style="color:var(--gold)">•</span>' : "") + "</div>" + '<p class="h" style="margin:2px 0 7px">' + esc(m.sub) + "</p>" + '<textarea rows="5" onchange="admTextSet(\'' + m.k + "',this.value)\">" + esc(raw) + "</textarea>" + '<a class="btn gr" target="_blank" rel="noopener" ' + 'href="https://wa.me/?text=' + encodeURIComponent(out) + '">שליחה בוואטסאפ</a>' + "</div>";
    }).join("") + "</div>";
}

function tripUrl() {
    return joinUrl("").replace("join.html", "") + "?masa=1";
}

function tourUrl() {
    return tripUrl().replace("?masa=1", "?masa=see");
}

function admShowCard() {
    return '<div class="adm-card" style="margin-bottom:11px">' + "<h4>המסע - לראשי החטיבות</h4>" + '<p class="h">לא מצגת: <b>האפליקציה עצמה</b>, עם רצועה בראש ' + "המסך שאומרת בכל שלב מה לעשות. שמונה שלבים - הצטרפות, " + 'מילוי הטופס, שליחה לר"מים, התקנה, ואז מה שקיבלו: הלוח, ' + "מילה לתלמידים, והדף עצמו.<br>" + "המשימות מתקדמות מעצמן כשהן נעשות, וכל כפתור אמיתי ועובד.<br>" + 'הנוסח נערך ב"מה מוצג" ← "מלל" ← "המסע".</p>' + '<a class="btn p" style="margin:10px 0 0;width:100%;box-sizing:border-box;' + 'text-decoration:none;display:block;text-align:center" target="_blank" ' + 'rel="noopener" href="' + esc(tripUrl()) + '">פתיחת המסע</a>' + '<button class="btn g" style="margin:8px 0 0;width:100%" ' + 'onclick="copyAny(this, tripUrl())">העתקת הקישור לשליחה</button>' + '<p class="h" style="margin:14px 0 0;padding-top:12px;' + 'border-top:1px solid var(--rule)"><b>כבר רשום ומותקן אצלך?</b><br>' + "אז המסע הרגיל ידלג לך על ההתחלה - המשימות כבר עשויות. " + "הסיור מראה את כל שמונת השלבים לפי הסדר, אחד־אחד בכפתור " + '"הבא", בלי לשנות כלום במכשיר.</p>' + '<a class="btn g" style="margin:8px 0 0;width:100%;box-sizing:border-box;' + 'text-decoration:none;display:block;text-align:center" target="_blank" ' + 'rel="noopener" href="' + esc(tourUrl()) + '">סיור בכל השלבים</a>' + "</div>";
}

function admLinks(el) {
    var src = INST_SRC === "sheet" ? '<div class="done-box" style="margin-bottom:11px">' + INSTITUTIONS.length + ' מוסדות · נטענו מלשונית "' + esc(CFG.sheetTab || SHEET_TAB) + '"</div>' : '<div class="cond" style="margin-bottom:11px"><b>' + INSTITUTIONS.length + " מוסדות · מהרשימה שבקוד.</b><br>" + esc(INST_SRC.indexOf(":") > 0 ? INST_SRC.split(":").slice(1).join(":") : "הגיליון טרם נקרא") + " - הרשימה שבקוד מוצגת, ושום דבר לא אבד." + '<div style="margin-top:8px"><button class="btn g" style="margin:0" ' + 'onclick="loadInstitutions().then(function(){renderHome();admPane();})">' + "ניסיון טעינה מחדש</button></div></div>";
    el.innerHTML = admWaCard() + admShowCard() + '<div class="adm-card" style="margin-bottom:11px"><h4>הדגמה</h4>' + '<p class="h">הדף האינטראקטיבי מנגן את עצמו: תענית ב׳ - קטע ' + "עם החברותא, המצגת נפתחת, ועוד שני קטעים. ואז הוא עוצר " + "ומזמין לגעת. כעשרים שניות.<br>" + "<b>כל נגיעה עוצרת אותו ומעבירה את השליטה.</b> על מקרן " + "בכיתה, או מגישים את הטלפון.</p>" + '<a class="btn p" style="margin:10px 0 0;width:100%;box-sizing:border-box;' + 'text-decoration:none;display:block;text-align:center" target="_blank" ' + 'rel="noopener" href="' + esc(demoUrl()) + '">פתיחת ההדגמה</a>' + '<p class="h" style="margin-top:12px">הקצב וסדר הלחיצות נקבעים ' + "<b>בהקלטה</b>: עושים את ההדגמה ביד, וכל לחיצה נשמרת עם הזמן " + "שלה. מה שהוקלט נשמר <b>במכשיר הזה</b> ומתנגן במקום ברירת " + "המחדל - אפשר לנגן, לתקן ולהקליט שוב.</p>" + '<a class="btn g" style="margin:8px 0 0;width:100%;box-sizing:border-box;' + 'text-decoration:none;display:block;text-align:center" target="_blank" ' + 'rel="noopener" href="' + esc(demoUrl("rec")) + '">הקלטת הדגמה</a></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>קישור כללי לתלמידים</h4>' + '<p class="h">אפשר לשלוח לכל מקום - התלמיד בוחר את הישיבה שלו ' + 'מתוך הרשימה. ישיבה שנרשם אליה תלמיד מסומנת כ"בפנים" מעצמה, ' + "והצוות עדיין יכול להירשם רשמית אחר כך.</p>" + '<div class="url" style="direction:ltr;text-align:start">' + esc(joinUrl("")) + "</div>" + '<div style="display:flex;gap:7px;margin-top:10px">' + '<a class="btn gr" style="margin:0;flex:1;text-decoration:none" target="_blank" ' + 'rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(fill(UI.linkWa, {
        inst: "רשת בני עקיבא",
        url: joinUrl("")
    })) + '">' + esc(UI.linkWaBtn) + "</a>" + '<button class="cp" onclick="copyAny(this,\'' + esc(joinUrl("")) + "')\">" + esc(UI.linkCopy) + "</button></div></div>" + '<div class="adm-card" style="margin-bottom:11px"><h4>קישור לתלמידים מחוץ לרשת</h4>' + '<p class="h">לאנשים שאינם קשורים למוסדות בני עקיבא. אותו מסך בדיוק, ' + '<b>בלי בחירת ישיבה</b> - הם נרשמים כ"אחר", ואינם צריכים לסמן זאת.</p>' + '<div class="url" style="direction:ltr;text-align:start">' + esc(outUrl()) + "</div>" + '<div style="display:flex;gap:7px;margin-top:10px">' + '<a class="btn gr" style="margin:0;flex:1;text-decoration:none" target="_blank" ' + 'rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(fill(UI.linkWa, {
        inst: "הדף השבועי",
        url: outUrl()
    })) + '">' + esc(UI.linkWaBtn) + "</a>" + '<button class="cp" onclick="copyAny(this,\'' + esc(outUrl()) + "')\">" + esc(UI.linkCopy) + "</button></div></div>" + '<div class="adm-card" style="margin-bottom:11px"><h4>קישור להורים</h4>' + '<p class="h">אותו מסך, נפתח על "אבא": הפרטים שלו, ואז צירוף הבן ' + "בשם פרטי וטלפון. <b>הבן נרשם בעצמו</b> - הוא מקבל קישור משלו " + 'ולוחץ "מצטרף", והמערכת מצליבה ביניהם לפי הטלפון.<br>' + "זה הקישור שנשלח לקבוצות ההורים, לצד הפלייר.</p>" + '<div class="url" style="direction:ltr;text-align:start">' + esc(dadUrl()) + "</div>" + '<div style="display:flex;gap:7px;margin-top:10px">' + '<a class="btn gr" style="margin:0;flex:1;text-decoration:none" target="_blank" ' + 'rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(fill(UI.dadWa, {
        url: dadUrl()
    })) + '">שליחה להורים</a>' + '<button class="cp" onclick="copyAny(this,\'' + esc(dadUrl()) + "')\">" + esc(UI.linkCopy) + "</button></div></div>" + '<div class="adm-card" style="margin-bottom:11px"><h4>הקישורים של כל מוסד</h4>' + '<p class="h"><b>תלמידים</b> - פתוח, ומי שנכנס דרכו נספר לישיבה. ' + "שלחו לקבוצות הכיתה ולהורים.<br>" + '<b>צוות</b> - שולח לר"מים את <b>עמוד הצוות</b>: מה התוכנית, ' + "מה כדאי לעשות איתה, הדף של השבוע לפתיחה בכיתה, והלוח שלהם " + "בתוכו. <b>לא לשלוח לתלמידים</b> - הוא נושא את קוד הלוח.<br>" + "<b>עמוד</b> - פותח אותו אצלכם, לראות לפני ששולחים.</p>" + (linkState.msg ? '<div class="cond" style="margin-top:9px">' + linkState.msg + "</div>" : "") + '<div style="margin-top:9px;display:flex;gap:7px;flex-wrap:wrap">' + '<button class="btn g" style="margin:0;flex:1" ' + 'onclick="codesLoad()">משיכת הקודים מהגיליון</button>' + '<button class="btn g" style="margin:0;flex:1" ' + 'onclick="codesFill()">קוד לכל מי שאין לו</button></div>' + INSTITUTIONS.map(function(i) {
        var wa = fill(UI.linkWa, {
            inst: i.name,
            url: joinUrl(i.code)
        });
        var k = instCode(i.code);
        var tw = fill(UI.teamWa, {
            inst: i.name,
            url: tzevetUrl(i.code)
        });
        return '<div class="row"><div>' + esc(i.name) + '<div class="sub" style="direction:ltr;text-align:start">' + (k ? "?inst=" + esc(i.code) + "&k=" + esc(k) : "?inst=" + esc(i.code) + ' · <span dir="rtl">אין קוד</span>') + "</div></div>" + '<div style="display:flex;gap:6px;flex:0 0 auto">' + '<a class="cp ph" style="display:flex;align-items:center;text-decoration:none;' + 'color:var(--green-d)" href="https://wa.me/?text=' + encodeURIComponent(wa) + '" target="_blank" rel="noopener">תלמידים</a>' + '<a class="cp ph" style="display:flex;align-items:center;' + 'text-decoration:none;color:var(--gold-t)" href="' + esc(tzevetUrl(i.code)) + '" target="_blank" rel="noopener">עמוד</a>' + '<a class="cp ph" style="display:flex;align-items:center;' + 'text-decoration:none" href="https://wa.me/?text=' + encodeURIComponent(tw) + '" target="_blank" rel="noopener">צוות</a>' + '<button class="cp" onclick="codeNew(' + dq(i.code) + "," + dq(i.name) + ')">' + (k ? "↻" : "קוד") + "</button>" + "</div></div>";
    }).join("") + "</div>" + '<div class="adm-card"><h4>מי מופיע כ"בפנים"</h4>' + '<p class="h">המתג קובע מה נראה בעמוד הראשי ובעיגול המונה, ' + 'כשהתצוגה למעלה היא של תשפ"ז.</p>' + INSTITUTIONS.map(function(i) {
        return '<div class="row"><div>' + esc(i.name) + (i.last ? '<div class="sub">למדו בתשפ"ו</div>' : "") + "</div>" + '<button class="sw' + (i.joined ? " on" : "") + '" onclick="admToggle(\'' + i.code + '\')" aria-label="שיוך"></button></div>';
    }).join("") + "</div>";
}

var linkState = {
    msg: ""
};

function codesLoad() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        linkState.msg = "חסרה סיסמת הקריאה. הגדרות ← שרת ההרשמות.";
        admPane();
        return;
    }
    linkState.msg = "קורא…";
    admPane();
    scriptGet({
        codes: 1,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            linkState.msg = esc(d && d.message || "לא קיבלתי תשובה מהסקריפט.");
            admPane();
            return;
        }
        var m = Store.get("instCodes", {}) || {}, n = 0;
        for (var c in d.codes || {}) {
            m[c] = d.codes[c];
            n++;
        }
        Store.set("instCodes", m);
        linkState.msg = n ? n + " קודים נטענו מהגיליון." : 'אין עדיין קודים בגיליון. לחצו "קוד" ליד מוסד כדי לייצר.';
        admPane();
    }).catch(function() {
        linkState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}

function codesFill() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        linkState.msg = "חסרה סיסמת הקריאה. הגדרות ← שרת ההרשמות.";
        admPane();
        return;
    }
    linkState.msg = "קורא מה כבר קיים…";
    admPane();
    scriptGet({
        codes: 1,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            linkState.msg = esc(d && d.message || "לא הצלחתי לקרוא את הקודים. " + "לא נגעתי בכלום.");
            admPane();
            return null;
        }
        var m = Store.get("instCodes", {}) || {};
        for (var c in d.codes || {}) m[c] = d.codes[c];
        Store.set("instCodes", m);
        var need = INSTITUTIONS.filter(function(i) {
            return i.code && i.code !== "other" && !(m[i.code] || "").trim();
        });
        if (!need.length) {
            linkState.msg = "לכל המוסדות כבר יש קוד.";
            admPane();
            return null;
        }
        if (!confirm("לייצר קוד ל־" + need.length + " מוסדות שאין להם?\n\n" + "מי שכבר יש לו קוד - לא ייגע, והקישור שבידיו ימשיך לעבוד.")) {
            linkState.msg = "";
            admPane();
            return null;
        }
        var done = 0, failed = 0;
        var step = function(i) {
            if (i >= need.length) {
                linkState.msg = done + " קודים נוצרו" + (failed ? " · " + failed + " נכשלו" : "") + ".";
                admPane();
                return null;
            }
            linkState.msg = "מייצר… " + (i + 1) + " מתוך " + need.length;
            admPane();
            return scriptGet({
                newcode: need[i].code,
                key: key
            }).then(function(r) {
                if (r && r.status === "ok" && r.code) {
                    setInstCode(need[i].code, r.code);
                    done++;
                } else failed++;
                return step(i + 1);
            }).catch(function() {
                failed++;
                return step(i + 1);
            });
        };
        return step(0);
    }).catch(function() {
        linkState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
    });
}
