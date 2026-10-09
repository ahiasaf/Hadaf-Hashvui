var SID_BAK = "גיבוי מזהים · ";

var SID_HEAD = {
    marks: [ "מסכת", "דף", "עמוד", "נתונים" ],
    own: [ "מסכת", "דף", "פירוש" ],
    q: [ "מסכת", "דף", "שאלות" ],
    deck: [ "מסכת", "דף", "עוגנים" ]
};

function sidHead_(k, rows) {
    var h = rows && rows[0];
    return h && String(h[0] || "").indexOf("מסכת") >= 0 ? h : SID_HEAD[k];
}

function sidTodo_(r) {
    return r.changedPages > 0 || r.report.some(function(d) {
        return d.was.own !== "ids" || d.was.q === "n" || d.was.deck === "n";
    });
}

function sidRestore() {
    if (SID.busy) return;
    if (!(CFG.readKey || "").trim()) {
        sidSay_("bad", "צריך סיסמת סקריפט במכשיר (למעלה במסך הזה).");
        return;
    }
    var key = (CFG.readKey || "").trim(), names = Object.keys(SID_TABS), bak = {}, cur = {};
    SID.busy = true;
    sidSay_("cond", "קורא את לשוניות הגיבוי…");
    Promise.all(names.map(function(k) {
        return Promise.all([ scriptGet({
            read: SID_BAK + SID_TABS[k],
            key: key
        }), scriptGet({
            read: SID_TABS[k],
            key: key
        }) ]).then(function(res) {
            var b = res[0], c = res[1];
            if (!b || b.status !== "ok" || !b.rows || !b.rows.length) throw new Error('אין לשונית גיבוי "' + SID_BAK + SID_TABS[k] + '" - לא שוחזר דבר.');
            if (!c || c.status !== "ok") throw new Error('לא הצלחתי לקרוא את "' + SID_TABS[k] + '" - לא שוחזר דבר.');
            bak[k] = b.rows;
            cur[k] = c.rows || [];
        });
    })).then(function() {
        SID.busy = false;
        var lines = names.map(function(k) {
            return SID_TABS[k] + ": עכשיו " + Math.max(0, cur[k].length - 1) + " שורות · בגיבוי " + (bak[k].length - 1);
        }).join("\n");
        if (!confirm("להחזיר את ארבע הלשוניות למצב שבגיבוי?\n\n" + lines + "\n\nמה שנכתב בהן אחרי הגיבוי יוחלף. קודם יירד למכשיר קובץ של המצב הנוכחי.")) {
            sidSay_("cond", "השחזור בוטל. לא נכתב דבר.");
            return null;
        }
        SID.busy = true;
        saveFile("hadaf-before-restore-" + stamp() + ".json", JSON.stringify(cur));
        var w = Promise.resolve(true);
        names.forEach(function(k) {
            w = w.then(function() {
                sidSay_("cond", 'משחזר את "' + SID_TABS[k] + '"…');
                var head = sidHead_(k, bak[k]);
                var rows = bak[k].slice(1).map(function(x) {
                    return x.slice(0, head.length);
                });
                return sidPost_(SID_TABS[k], head, rows).then(function() {
                    return sidCheck_(SID_TABS[k], rows);
                }).then(function(good) {
                    if (!good) throw new Error('"' + SID_TABS[k] + '" לא אומתה אחרי השחזור. הגיבוי עדיין בלשוניות "' + SID_BAK + '…", ומה שהיה לפני השחזור - בקובץ שירד.');
                });
            });
        });
        return w.then(function() {
            SID.busy = false;
            SID.res = null;
            SID.tabs = null;
            sidSay_("ok", "✓ שוחזר ואומת: ארבע הלשוניות זהות לגיבוי.");
        });
    }).catch(function(e) {
        SID.busy = false;
        sidSay_("bad", esc(e && e.message || "השחזור נעצר."));
    });
}

function sidRun() {
    if (!SID.res || !SID.tabs || SID.busy) return;
    var r = SID.res;
    if (!sidTodo_(r)) {
        sidSay_("ok", "אין מה להסב - הגיליון כבר לפי מזהים. לא נכתב דבר.");
        return;
    }
    if (!confirm("להסב את הגיליון למזהים קבועים?\n\n" + 'קודם יירד למכשיר קובץ גיבוי, וכל לשונית תועתק ללשונית "גיבוי מזהים · …" ותיבדק.\n' + "רק אחר כך ייכתבו: " + r.changedPages + " עמודים בסימוני הדף, והפירוש, השאלות והשקפים של " + r.report.length + " דפים.")) return;
    var t = SID.tabs, names = Object.keys(SID_TABS);
    SID.busy = true;
    saveFile("hadaf-stepid-backup-" + stamp() + ".json", JSON.stringify(t));
    sidSay_("cond", "מגבה לגיליון…");
    var chain = Promise.resolve(true);
    names.forEach(function(k) {
        chain = chain.then(function(ok) {
            if (!ok) return false;
            var head = sidHead_(k, t[k]);
            var rows = t[k].slice(1).map(function(x) {
                return x.slice(0, head.length);
            });
            var tab = SID_BAK + SID_TABS[k];
            return sidPost_(tab, head, rows).then(function() {
                return sidCheck_(tab, rows);
            });
        });
    });
    chain.then(function(ok) {
        if (!ok) throw new Error("הגיבוי לא אומת - לא נכתב דבר בלשוניות עצמן.");
        var plan = {
            marks: r.marks.slice(1).map(function(x) {
                return x.slice(0, 4);
            }),
            own: sidRows_(t.own, r.own),
            q: sidRows_(t.q, r.q),
            deck: sidRows_(t.deck, r.deck)
        };
        var heads = {
            marks: sidHead_("marks", t.marks),
            own: sidHead_("own", t.own),
            q: sidHead_("q", t.q),
            deck: sidHead_("deck", t.deck)
        };
        var w = Promise.resolve(true);
        names.forEach(function(k) {
            w = w.then(function(ok2) {
                if (!ok2) return false;
                sidSay_("cond", 'כותב את "' + SID_TABS[k] + '"…');
                return sidPost_(SID_TABS[k], heads[k], plan[k]).then(function() {
                    return sidCheck_(SID_TABS[k], plan[k]);
                }).then(function(good) {
                    if (!good) throw new Error('"' + SID_TABS[k] + '" לא אומתה אחרי הכתיבה. הגיבוי בלשוניות "גיבוי מזהים · …" ובקובץ שירד.');
                    return true;
                });
            });
        });
        return w;
    }).then(function() {
        SID.busy = false;
        SID.res = null;
        SID.tabs = null;
        sidSay_("ok", '✓ ההסבה נכתבה ואומתה בארבע הלשוניות. הגיבוי נשאר בלשוניות "גיבוי מזהים · …".');
    }).catch(function(e) {
        SID.busy = false;
        sidSay_("bad", esc(e && e.message || "ההסבה נעצרה."));
    });
}

function admSet(el) {
    el.innerHTML = '<div class="adm-card" style="margin-bottom:11px">' + "<h4>בדיקת שקפים מדרייב</h4>" + '<p class="h">בדיקה חד־פעמית: האם תמונה מדרייב נטענת אצל תלמיד. ' + "לפתוח <b>בגלישה בסתר</b>, ולבדוק על קובץ <b>JPG</b>.</p>" + '<a class="btn gd" style="text-align:center;display:block;' + 'text-decoration:none" href="slidetest.html">לעמוד הבדיקה ←</a></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>יעדי שליחה</h4>' + '<p class="h">כל עוד אין כתובת שרת, הרשמות נשלחות כהודעת וואטסאפ לרכז.</p>' + '<div class="fld"><div class="label">וואטסאפ של הרכז (972…)</div>' + '<input type="tel" dir="ltr" value="' + esc(CV("coordWa") || COORD_WA) + "\" onchange=\"cfgSet('coordWa',this.value.replace(/[^0-9]/g,''))\"></div>" + '<div class="fld"><div class="label">כתובת שרת (Apps Script / Firebase)</div>' + '<input type="text" dir="ltr" placeholder="https://script.google.com/…/exec" value="' + esc(CFG.api || API) + '" onchange="cfgSet(\'api\',this.value.trim())"></div>' + (apiOld() ? '<div class="cond" style="margin:6px 0">במכשיר הזה שמורה כתובת שרת ' + "ששונה מהכתובת הקבועה שבקוד. שליחת התראות ממנו חסומה עד שחוזרים לקבועה.</div>" + '<button class="btn p" style="margin-bottom:8px" onclick="apiReset()">חזרה לכתובת הקבועה</button>' : "") + '<button class="btn g" onclick="admPing()">בדיקת חיבור</button>' + '<div id="adm-ping"></div></div>' + clockCard() + '<div class="adm-card" style="margin-bottom:11px">' + "<h4>קבוצת הוואטסאפ</h4>" + '<p class="h">מוצעת לתלמיד ולהורה אחרי ההרשמה, כהצעה שקטה ולא כחובה. ' + "ריק = לא מוצע לאיש.<br>" + "<b>לא נשמר בקוד ולכן חייב פרסום</b> כדי שיגיע לתלמידים.</p>" + '<div class="fld"><div class="label">קישור ההצטרפות</div>' + '<input type="text" dir="ltr" placeholder="https://chat.whatsapp.com/…" value="' + esc(CV("waGroup") || "") + '" onchange="cfgSet(\'waGroup\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סטודיו הסימון</h4>' + '<p class="h">חלוקת הדף לקטעים וקישורם לביאור חברותא. ' + "נפתח כאפליקציה נפרדת, עם אייקון משלה.</p>" + '<a class="btn gd" style="display:block;text-align:center;text-decoration:none" ' + 'href="studio.html">פתיחת הסטודיו</a>' + '<button class="btn g" style="margin-top:8px" onclick="admCopyStudio()">' + "העתקת הקישור - לעוזרי עריכה</button>" + '<div id="adm-studio-msg"></div>' + '<p class="h" style="margin-top:12px">מעבדה - ניסוי שיטת זיהוי ' + "חדשה על דפים אקראיים, בלי לגעת בסטודיו ובלי לשמור דבר.</p>" + '<a class="btn g" style="display:block;text-align:center;text-decoration:none" ' + 'href="lab.html">פתיחת המעבדה</a></div>' + sidCard() + '<div class="adm-card" style="margin-bottom:11px"><h4>הניהול כאפליקציה</h4>' + '<p class="h">אייקון זהב נפרד במסך הבית, שנפתח ישר כאן. הוא חי לצד ' + "האפליקציה הרגילה ואינו מחליף אותה.</p>" + '<div id="adm-inst"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>גרסה</h4>' + '<p class="h">אם משהו נראה ישן - כאן מרעננים בכוח: מוחק את המטמון ' + "וטוען מחדש מהשרת. ההגדרות וההרשמות אינן נמחקות.</p>" + '<div class="row" style="padding:8px 0"><span>גרסת האפליקציה</span>' + "<b>" + esc(APP_VERSION) + "</b></div>" + '<button class="btn g" onclick="admRefresh()">רענון מלא מהשרת</button></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>גוגל־שיטס</h4>' + '<p class="h">הגיליון צריך להיות משותף כ"כל מי שיש לו הקישור - מציג". ' + "גיליון אנשי הקשר נשמר על המכשיר הזה בלבד ואינו בקוד.</p>" + '<div class="fld"><div class="label">מזהה גיליון המוסדות (ציבורי)</div>' + '<input type="text" dir="ltr" value="' + esc(CFG.sheetId || SHEET_ID) + '" onchange="cfgSet(\'sheetId\',this.value.trim())"></div>' + '<div class="fld"><div class="label">שם הלשונית</div>' + '<input type="text" value="' + esc(CFG.sheetTab || SHEET_TAB) + '" onchange="cfgSet(\'sheetTab\',this.value.trim())"></div>' + '<button class="btn g" onclick="loadInstitutions().then(function(ok){' + "alert(ok?'המוסדות עודכנו מהגיליון.':'לא הצלחתי לקרוא מהגיליון.');renderHome();admPane();})\">" + "טעינת רשימת המוסדות</button>" + '<div class="fld" style="margin-top:13px"><div class="label">' + "מזהה גיליון אנשי הקשר (פרטי)</div>" + '<input type="text" dir="ltr" placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.contactsSheet || "") + '" onchange="cfgSet(\'contactsSheet\',this.value.trim())"></div>' + '<div class="fld"><div class="label">שם הלשונית</div>' + '<input type="text" value="' + esc(CFG.contactsTab || "גיליון1") + '" onchange="cfgSet(\'contactsTab\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סיסמת הקריאה</h4>' + '<p class="h">אותה מחרוזת שכתובה ב-Apps Script בשורת ' + "<code>READ_KEY</code>. בלעדיה מסך המשתתפים יישאר ריק - ובלעדיה " + "גם אף אחד אחר אינו יכול לקרוא את רשימת התלמידים. נשמרת על " + "המכשיר הזה בלבד ואינה מתפרסמת.</p>" + '<div class="fld"><input type="text" dir="ltr" ' + 'placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.readKey || "") + '" onchange="cfgSet(\'readKey\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סיסמת עמוד הצוות</h4>' + '<p class="h">מחרוזת חדשה ונפרדת - אינה סיסמת הקריאה. הדביקו אותה גם ' + "ב-Apps Script בשורת <code>TEAM_KEY</code>, וגם כאן. זו הסיסמה שמותר " + 'למסור הלאה: היא פותחת רק את "עמוד הצוות" (מוקד שיחות ← קישור לעמוד ' + "הצוות), ובו רק מה שסימנתם להציג - לא את רשימת אנשי הקשר המלאה.</p>" + '<div class="fld"><input type="text" dir="ltr" ' + 'placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.teamKey || "") + '" onchange="cfgSet(\'teamKey\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>קוד הכניסה לניהול</h4>' + '<p class="h">ארבע ספרות. שמור אותו - בלעדיו אין כניסה למסך הזה.</p>' + '<div class="fld"><input type="tel" dir="ltr" maxlength="4" value="' + esc(CFG.pin || ADMIN_PIN) + '" onchange="admPin(this.value)"></div></div>' + '<div class="adm-card"><h4>גיבוי</h4>' + '<p class="h">כל ההגדרות וההרשמות שמורות על המכשיר הזה. שמור גיבוי לפני מחיקת היסטוריה.</p>' + '<button class="btn g" onclick="admExport()">העתקת גיבוי</button>' + '<button class="btn g" style="margin-top:8px" onclick="admImport()">שחזור מגיבוי</button></div>';
}

function admPin(v) {
    v = String(v).replace(/[^0-9]/g, "").slice(0, 4);
    if (v.length !== 4) {
        alert("הקוד חייב להיות בן ארבע ספרות.");
        admPane();
        return;
    }
    cfgSet("pin", v);
    alert("הקוד עודכן.");
}

function admExport() {
    var dump = {
        cfg: CFG,
        contacts: contacts(),
        reg: regSaved(),
        registrations: Store.get("registrations", [])
    };
    var t = JSON.stringify(dump);
    if (navigator.clipboard) navigator.clipboard.writeText(t);
    alert("הגיבוי הועתק. שמור אותו במקום בטוח.");
}

function admImport() {
    var t = prompt("הדביקו את הגיבוי:");
    if (!t) return;
    try {
        var d = JSON.parse(t);
        if (d.cfg) {
            CFG = d.cfg;
            Store.set("cfg", CFG);
            applyCfg();
        }
        if (d.contacts) saveContacts(d.contacts);
        if (d.reg) localStorage.setItem("dfReg", JSON.stringify(d.reg));
        if (d.registrations) Store.set("registrations", d.registrations);
        alert("שוחזר.");
        renderAdmin();
    } catch (e) {
        alert("הגיבוי אינו תקין.");
    }
}
