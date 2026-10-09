function gradeOf(p) {
    var g = p.grade || "";
    return g && p.klass ? g + p.klass : g;
}

function partRow(p) {
    var sub = [ gradeOf(p), p.role === "הורה" ? "הורה" : "" ].filter(Boolean).join(" · ");
    var with_ = p.dadFirst ? "עם " + (p.dadFirst + " " + (p.dadLast || "")).trim() + (p.dadPhone ? " · " + p.dadPhone : "") : "";
    var pair = partPairs[p.id || ""];
    if (pair && pair["with"]) {
        with_ = "לומד עם " + pair["with"] + " ✓" + (with_ ? " · " + with_ : "");
    }
    return '<div class="row"><div>' + esc(partName(p)) + '<div class="sub">' + esc([ sub, with_ ].filter(Boolean).join(" · ")) + "</div></div>" + '<div style="display:flex;align-items:center;gap:4px">' + (p.phone ? '<a class="cp ph" style="text-decoration:none;direction:ltr" href="tel:' + esc(p.phone) + '">' + esc(p.phone) + "</a>" : "") + '<button class="xrow" title="מחיקה" onclick="partDel(' + dq(p.id || "") + "," + dq(partName(p)) + ')">✕</button></div></div>';
}

function partSet(k, v) {
    partView[k] = v;
    partView.msg = "";
    admPane();
    if (k === "q") {
        var f = document.querySelector(".psearch");
        if (f) {
            f.focus();
            f.selectionStart = f.value.length;
        }
    }
}

function partDel(id, name) {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        partView.msg = "חסרה סיסמת הקריאה - אי אפשר למחוק.";
        admPane();
        return;
    }
    if (!id) {
        partView.msg = "לשורה הזו אין מזהה בגיליון, ולכן אי אפשר למחוק " + 'אותה מכאן. אפשר לנקות את כל הלשונית בלשונית "נתונים".';
        admPane();
        return;
    }
    if (!confirm("למחוק את " + name + " מהרשימה?")) return;
    partView.msg = "מוחק…";
    admPane();
    scriptGet({
        delrow: JOIN_TAB,
        col: "מזהה",
        vals: JSON.stringify([ id ]),
        key: key
    }).then(function(d) {
        if (!d || d.status !== "success") {
            partView.msg = "<b>לא נמחק.</b> " + esc(d && d.message || "אין תשובה מהסקריפט.");
            admPane();
            return;
        }
        if (!d.removed) {
            partView.msg = "לא נמצאה שורה עם המזהה הזה בגיליון. " + 'לחצו "רענון מהגיליון".';
            admPane();
            return;
        }
        var left = (Store.get("partCache", []) || []).filter(function(x) {
            return x.id !== id;
        });
        Store.set("partCache", left);
        partView.msg = esc(name) + " נמחק מהגיליון.";
        admPane();
    }).catch(function() {
        partView.msg = "<b>לא נמחק.</b> אין תשובה מהסקריפט.";
        admPane();
    });
}

var regState = {
    msg: ""
};

function regFromRows(rows) {
    if (!rows || rows.length < 2) return [];
    var head = rows[0], ix = {};
    for (var i = 0; i < head.length; i++) ix[String(head[i]).trim()] = i;
    var cell = function(r, k) {
        return ix[k] === undefined ? "" : String(r[ix[k]] == null ? "" : r[ix[k]]).trim();
    };
    var byCode = {}, order = [];
    rows.slice(1).forEach(function(r) {
        var code = cell(r, "קוד");
        if (!code) return;
        var o = {
            code: code,
            inst: cell(r, "ישיבה"),
            who: cell(r, "איש קשר"),
            phone: cell(r, "טלפון"),
            size: parseInt(cell(r, "תלמידים (הערכה)"), 10) || 0,
            at: cell(r, "תאריך"),
            qty: {}
        };
        TRACKS.forEach(function(t) {
            SFARIM.forEach(function(sf) {
                var n = parseInt(cell(r, t.masechet + " · " + sf.name), 10) || 0;
                if (n) o.qty[qk(t.id, sf.id)] = n;
            });
        });
        o.total = regTotalQty(o.qty);
        o.seferName = cell(r, "פירוט");
        if (!(code in byCode)) order.push(code);
        byCode[code] = o;
    });
    return order.map(function(c) {
        return byCode[c];
    });
}

function pullRegs() {
    var key = (CFG.readKey || "").trim();
    if (!key) {
        regState.msg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    regState.msg = "טוען…";
    admPane();
    return scriptGet({
        read: "הרשמות",
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok") {
            regState.msg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        var list = regFromRows(d.rows);
        if (list.length) Store.set("registrations", list);
        regState.msg = "";
        Store.set("regAt", Date.now());
        admPane();
        return true;
    }).catch(function() {
        regState.msg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function admReg(el) {
    var list = Store.get("registrations", []) || [];
    var own = regSaved();
    if (own && !list.some(function(r) {
        return r.code === own.code;
    })) list = [ own ].concat(list);
    var at = Store.get("regAt", 0);
    var sync = '<button class="btn g" onclick="pullRegs()" style="margin-top:10px">' + (list.length ? "רענון מהגיליון" : "טעינה מהגיליון") + "</button>" + (at ? '<p class="h" style="margin-top:8px">עודכן ' + esc(whenTxt(at)) + "</p>" : "");
    var conf = admConflicts();
    if (regState.msg === "nokey") {
        el.innerHTML = conf + '<div class="adm-card"><h4>חסרה סיסמת הקריאה</h4>' + '<p class="h">רשימת ההרשמות יושבת בגיליון הפרטי - שם של ראש חטיבה ' + "והטלפון שלו אינם דבר שיושב בגיליון משותף לצפייה. הדביקו בהגדרות ← " + '"סיסמת הקריאה" את המחרוזת שכתובה ב-Apps Script.</p>' + '<button class="btn p" onclick="admGo(\'sys\')">למסך ההגדרות</button></div>';
        return;
    }
    if (!list.length) {
        el.innerHTML = conf + '<div class="adm-card"><h4>אין עדיין הרשמות</h4>' + '<p class="h">כל הרשמה שנשלחת מהאפליקציה נכתבת לגיליון הפרטי. ' + "לחצו כאן כדי למשוך אותן - כולל הרשמות שנשלחו ממכשירים אחרים.</p>" + (regState.msg ? '<div class="cond" style="margin-top:10px">' + esc(regState.msg) + "</div>" : "") + sync + "</div>";
        return;
    }
    var tot = list.reduce(function(a, r) {
        return a + (r.total || 0);
    }, 0);
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
    el.innerHTML = conf + '<div class="adm-card" style="margin-bottom:11px"><h4>' + list.length + " הרשמות · " + tot + " גמרות</h4>" + (regState.msg ? '<div class="cond" style="margin-bottom:9px">' + esc(regState.msg) + "</div>" : "") + SFARIM.map(function(s) {
        var p = priceOf(s.id);
        var n = TRACKS.reduce(function(a, t) {
            return a + (per[qk(t.id, s.id)] || 0);
        }, 0);
        var gap = p.min - n;
        return '<div class="row" style="padding:7px 0"><span>' + esc(s.name) + (p.min ? ' <span style="color:var(--ink-3)">· יעד ' + p.min + "</span>" : "") + '<div class="sub">' + TRACKS.map(function(t) {
            return t.masechet + " " + (per[qk(t.id, s.id)] || 0);
        }).join(" · ") + "</div></span>" + "<b" + (gap <= 0 ? ' style="color:var(--ok)"' : "") + ">" + n + (p.min && gap > 0 ? ' <span style="font-weight:600;color:var(--ink-3)">(חסרים ' + gap + ")</span>" : p.min ? " ✓" : "") + "</b></div>";
    }).join("") + '<p class="h" style="margin:9px 0 0">סה"כ להזמנה: ' + shek(sum) + "</p>" + sync + "</div>" + list.map(function(r) {
        var q = regMigrate(r);
        return '<div class="adm-card" style="margin-bottom:9px"><h4>' + esc(r.inst) + "</h4>" + '<p class="h" style="margin-bottom:8px">' + esc(r.who || "") + (r.phone ? " · " + esc(r.phone) : "") + "</p>" + TRACKS.map(function(t) {
            return SFARIM.map(function(s) {
                return '<div class="row" style="padding:7px 0"><span>' + esc(t.masechet + " · " + s.name) + "</span>" + "<b>" + (q[qk(t.id, s.id)] || 0) + "</b></div>";
            }).join("");
        }).join("") + (r.note ? '<div class="row" style="padding:7px 0"><span>הערה</span>' + '<b style="font-weight:600">' + esc(r.note) + "</b></div>" : "") + (r.phone ? '<a class="btn gr" style="margin-top:10px;text-decoration:none" href="tel:' + digits(r.phone) + '">חייג</a>' : "") + "</div>";
    }).join("");
}

function admShow(el) {
    var now = rosterMode() === "now";
    el.innerHTML = '<div class="adm-card" data-g="pub" style="margin-bottom:11px"><h4>מה מוצג בעמוד הראשי</h4>' + '<p class="h">כל עוד הישיבות לא אישרו רשמית, המספר היחיד שאפשר ' + "לעמוד מאחוריו הוא של אשתקד.</p>" + '<div class="row"><div>הישיבות שהיו בתשפ"ו' + '<div class="sub">' + INSTITUTIONS.filter(function(i) {
        return i.last;
    }).length + " ישיבות</div></div>" + '<button class="sw' + (now ? "" : " on") + "\" onclick=\"cfgSet('roster','last');" + 'renderHome();admPane()" aria-label="תשפו"></button></div>' + '<div class="row"><div>מי שאישר לתשפ"ז' + '<div class="sub">' + INSTITUTIONS.filter(function(i) {
        return i.joined;
    }).length + " ישיבות · לפי המתגים למטה</div></div>" + '<button class="sw' + (now ? " on" : "") + "\" onclick=\"cfgSet('roster','now');" + 'renderHome();admPane()" aria-label="תשפז"></button></div></div>' + '<div class="adm-card" data-g="pub" style="margin-bottom:11px"><h4>' + esc(UI.admWkH) + "</h4>" + '<p class="h">' + esc(UI.admWkP) + "</p>" + ROW_KEYS.concat([ [ "mid", UI.admMid, UI.admMidSub ], [ "yomi", UI.admYomi, UI.admYomiSub ] ]).map(function(r) {
        return '<div class="row"><div>' + esc(r[1]) + '<div class="sub" id="rk-' + r[0] + '">' + esc(r[2]) + "</div></div>" + '<button class="sw' + (showRow(r[0]) ? " on" : "") + '" onclick="rowToggle(\'' + r[0] + '\')" aria-label="' + esc(r[1]) + '"></button></div>';
    }).join("") + "</div>" + '<div class="adm-card" data-g="help" style="margin-bottom:11px"><h4>המדריך</h4>' + '<p class="h">סיור של שישה מסכים שנפתח בכניסה הראשונה. ' + "הצפייה מכאן עובדת תמיד - גם כשהוא כבוי לכולם.</p>" + '<div class="row"><div>המדריך פעיל' + '<div class="sub">' + (tourLive() ? "דלוק - נפתח בכניסה הראשונה, והכפתור מוצג" : "<b>כבוי - אף אחד אינו רואה אותו</b>") + "</div></div>" + '<button class="sw' + (tourLive() ? " on" : "") + '" onclick="cfgSet(\'tourOn\',!tourLive());admPane();renderHome()" ' + 'aria-label="המדריך פעיל"></button></div>' + '<div style="margin-top:10px"><button class="btn p" style="margin:0" ' + 'onclick="tourOpen(0)">צפייה במדריך עכשיו</button></div>' + '<div class="sec" style="margin-top:15px"><b>איפה יושב הכפתור</b><i></i></div>' + '<p class="h">כשהמדריך דלוק - מכאן פותחים אותו שוב.</p>' + [ [ "foot", "בתחתית העמוד", "שורה רחבה מתחת לכל התוכן. לא מפריע לכלום." ], [ "float", "עיגול צף בפינה", "תמיד בהישג יד, גם באמצע גלילה." ], [ "mast", "בחתימה למעלה", "עיגול קטן ליד הלוגו." ] ].map(function(o) {
        var on = tourAt() === o[0];
        return '<div class="row"><div>' + esc(o[1]) + '<div class="sub">' + esc(o[2]) + "</div></div>" + '<button class="sw' + (on ? " on" : "") + "\" onclick=\"cfgSet('tourAt','" + o[0] + "');admPane();renderHome()\" " + 'aria-label="' + esc(o[1]) + '"></button></div>';
    }).join("") + (tourSeen() ? '<div style="margin-top:10px"><button class="cp" ' + "onclick=\"Store.set('tourSeen',0);admPane()\">" + "לשכוח שראיתי - כדי לבדוק את הפתיחה האוטומטית</button></div>" : '<div class="done-box" style="margin-top:10px">המכשיר הזה טרם ראה ' + "את המדריך - כשהוא דלוק, הוא ייפתח בכניסה הבאה.</div>") + "</div>" + '<div class="adm-card" data-g="team" style="margin-bottom:11px"><h4>הפצת הקישור לתלמידים</h4>' + '<p class="h">כשדלוק - ראש חטיבה שנרשם מקבל בלוח שלו כפתור לשליחת ' + "ההזמנה לכיתות ולהורים. כשכבוי - הוא רואה את הלוח בלבד, ואתם " + "מחליטים מתי ולמי למסור את הקישור.</p>" + '<div class="row"><div>כפתור השליחה אצל ראשי החטיבות' + '<div class="sub">' + (joinLinkOn() ? "דלוק" : "כבוי - הקישור נמסר על ידכם") + "</div></div>" + '<button class="sw' + (joinLinkOn() ? " on" : "") + '" onclick="cfgSet(\'joinLink\',!joinLinkOn());admPane();renderHome()" ' + 'aria-label="הפצת הקישור"></button></div></div>' + '<div class="adm-card" data-g="kid" style="margin-bottom:11px"><h4>מסך ההרשמה</h4>' + '<p class="h">השאלה "' + esc(UI.sizeLabel) + '" - הערכה שראש חטיבה ' + "נותן לפני שהוא יודע כמה ייכנסו בפועל. המספר המדויק מגיע " + "ממילא מקישור ההצטרפות.</p>" + '<div class="row"><div>שאלת מספר התלמידים' + '<div class="sub">' + (sizeLive() ? "מוצגת בטופס ההרשמה" : "כבויה - אינה מוצגת") + "</div></div>" + '<button class="sw' + (sizeLive() ? " on" : "") + '" onclick="cfgSet(\'sizeOn\',!sizeLive());admPane()" ' + 'aria-label="שאלת מספר התלמידים"></button></div></div>' + '<div class="adm-card" data-g="kid" style="margin-bottom:11px"><h4>"בן · אבא" בקישור ההצטרפות</h4>' + '<p class="h">שתי אפשרויות בראש הטופס, "בן" מסומן מראש. הן מציגות ' + "את אפשרות הלימוד המשותף לכל מי שפותח את הקישור, ומאפשרות לאב " + "למלא את הפרטים שלו ולצרף את בנו.<br>" + "מוצגות בקישור הכללי ובקישור להורים בלבד - <b>בקישורים של " + "המוסדות הן אינן מוצגות</b>, שם הקישור נשלח לתלמידים.</p>" + '<div class="row"><div>הבחירה "בן · אבא"' + '<div class="sub">' + (roleAskOn() ? "מוצגת" : "כבויה - כולם ממלאים כתלמידים") + "</div></div>" + '<button class="sw' + (roleAskOn() ? " on" : "") + '" onclick="cfgSet(\'roleAsk\',!roleAskOn());admPane()" ' + 'aria-label="הבחירה בן ואבא"></button></div></div>' + '<div class="adm-card" data-g="kid" style="margin-bottom:11px"><h4>ההגרלה השבועית</h4>' + '<p class="h">מוצגת במסך הפתיחה של התלמיד: עונים נכון על החידה - ' + "ונכנסים להגרלה של אותו שבוע.</p>" + '<div class="row"><div>הגרלה שבועית' + '<div class="sub">' + (CV("weekRaffle") ? "דלוקה" : "כבויה - התלמיד לא רואה אותה") + "</div></div>" + '<button class="sw' + (CV("weekRaffle") ? " on" : "") + "\" onclick=\"cfgSet('weekRaffle',!CV('weekRaffle'));admPane()\" " + 'aria-label="הגרלה שבועית"></button></div></div>' + '<div class="adm-card" data-g="kid" style="margin-bottom:11px"><h4>הגרלת ההצטרפות</h4>' + '<p class="h">מוצגת במסך ההצטרפות של התלמיד. ההגרלה נערכת בכל ישיבה ' + "בנפרד. את משפט הפרס ואת תמונתו ממלאים בטקסטים ← מסך ההצטרפות; " + "כל עוד הם ריקים מוצג רק ההסבר.</p>" + '<div class="row"><div>הגרלה למצטרפים' + '<div class="sub">' + (CV("raffle") ? JOIN.rfPrize ? "דלוקה · הפרס מולא" : "דלוקה · הפרס עדיין ריק" : "כבויה - התלמיד לא רואה אותה") + "</div></div>" + '<button class="sw' + (CV("raffle") ? " on" : "") + '" onclick="cfgSet(\'raffle\',!CV(\'raffle\'));admPane()" aria-label="הגרלה"></button></div></div>' + netCard() + '<div class="adm-card" data-g="pub" style="margin-bottom:11px"><h4>מסך הבית</h4>' + '<p class="h">לכיבוי זמני כשמצלמים מסך לפרסום.</p>' + '<div class="row"><div>לוח התוכנית' + '<div class="sub">אב-אלול, תשרי, 31 שבועות, סיום</div></div>' + '<button class="sw' + (showRow("plan") ? " on" : "") + '" onclick="homeToggle(\'plan\')" aria-label="לוח"></button></div>' + '<div class="row"><div>הפס "עכשיו"' + '<div class="sub">השורה שמתחת ללוח התוכנית</div></div>' + '<button class="sw' + (showRow("here") ? " on" : "") + '" onclick="homeToggle(\'here\')" aria-label="עכשיו"></button></div>' + '<div class="row"><div>ההסבר מעל חלק התלמידים' + '<div class="sub">"המסך שנפתח אצל התלמיד…"</div></div>' + '<button class="sw' + (showRow("cap") ? " on" : "") + '" onclick="homeToggle(\'cap\')" aria-label="הסבר"></button></div></div>' + '<div class="adm-card" data-g="pub" style="margin-bottom:11px"><h4>מה שבדרך</h4>' + '<p class="h">באנר "בקרוב" בעמוד הראשי, בחלק של ראשי החטיבות.</p>' + '<div class="row"><div>לוח ההתקדמות של הישיבה' + '<div class="sub">הבטחה למה שעוד לא קיים</div></div>' + '<button class="sw' + (CFG_SOON() ? " on" : "") + '" onclick="soonToggle()" aria-label="בקרוב"></button></div></div>';
}
