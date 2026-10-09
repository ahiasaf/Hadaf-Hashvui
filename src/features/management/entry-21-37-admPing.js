function admPing() {
    var box = document.getElementById("adm-ping");
    var url = (CFG.api || API || "").trim();
    var say = function(cls, html) {
        box.innerHTML = '<div class="' + cls + '" style="margin-top:10px">' + html + "</div>";
    };
    if (!url) {
        say("cond", "אין כתובת שרת. הדביקו אותה בשדה שמעל.");
        return;
    }
    say("cond", "בודק…");
    pingScript(url).then(function(d) {
        var v = d.version || 0;
        var tabs = (d.tabs || []).map(function(t) {
            return esc(t.name) + " (" + t.rows + ")";
        }).join(" · ") || "אין לשוניות";
        var ghLine = d.gh ? "<br>" + (d.gh.ok ? "" : "<b>") + "GitHub: " + esc(d.gh.message) + (d.gh.ok ? "" : "</b>") : "";
        var want = (CFG.sheetId || SHEET_ID || "").trim();
        if (d.sheetId && want && d.sheetId !== want) {
            say("cond", "<b>הסקריפט מחובר לגיליון אחר.</b><br>" + "הוא כותב אל: " + esc(d.sheet || d.sheetId) + "<br>" + "והאפליקציה קוראת מגיליון אחר לגמרי.<br>" + "לכן כל פרסום שלכם מצליח - ואף אחד לא רואה אותו.<br><br>" + "הפתרון: פתחו את הגיליון שהאפליקציה קוראת, ומשם " + "תוספים ← Apps Script, והדביקו שם את הקוד. הכתובת " + "שתתקבל היא זו שצריכה להיות כאן.");
            return;
        }
        if (v < SCRIPT_MIN) {
            say("cond", "הסקריפט מגיב, אבל הפריסה ישנה - גרסה " + v + " במקום " + SCRIPT_MIN + ".<br>ב-Apps Script: Deploy ← Manage " + "deployments ← עריכה ← New version.");
        } else if (!d.privateOn) {
            say("cond", "החיבור תקין · גרסה " + v + "<br><b>אבל הגיליון הפרטי אינו מוגדר.</b> שמות של תלמידים " + "וטלפונים של הורים ייכתבו לגיליון שמשותף לצפייה.<br>" + "ב-Apps Script, בראש הקובץ: <code>PRIVATE_ID</code>." + ghLine);
        } else {
            var srcTxt = function(src, name) {
                if (src === "props") return " · מוגן בהדבקה הבאה ✓";
                if (src === "code") return " · <b>יושב בקוד, ויימחק בהדבקה הבאה</b>";
                return "";
            };
            var inCode = d.privSrc === "code" || d.keySrc === "code";
            say(d.readKeyOn && !inCode ? "done-box" : "cond", "החיבור תקין · גרסה " + v + (d.sheet ? "<br>גיליון: " + esc(d.sheet) : "") + "<br>הגיליון הפרטי מוגדר ✓" + srcTxt(d.privSrc) + (d.readKeyOn ? "<br>סיסמת הקריאה מוגדרת ✓" + srcTxt(d.keySrc) : "<br><b>אבל אין סיסמת קריאה.</b> מסך המשתתפים " + "יישאר ריק.<br>ב-Apps Script, בראש הקובץ: " + "<code>READ_KEY</code>.") + (d.autoOn ? "<br>ספירה אוטומטית כל שעה ✓" : "<br><b>הספירה האוטומטית אינה מותקנת.</b> בעורך Apps Script " + "בחרו ברשימת הפונקציות את <code>setupTriggers</code> ולחצו Run. " + "פעם אחת, וזהו.") + (inCode ? "<br><br><b>שווה חמש דקות, פעם אחת:</b> העבירו אותם " + "למאפייני הפרויקט, ואז הדבקת קוד חדשה לא תיגע בהם לעולם." + "<br>בעורך Apps Script ← גלגל השיניים ← Script Properties ← " + "Add script property, בשמות <code>PRIVATE_ID</code> ו-" + "<code>READ_KEY</code>." : "") + "<br>לשוניות: " + tabs + ghLine);
        }
    }).catch(function() {
        say("cond", "לא קיבלתי תשובה. בדקו שהכתובת מסתיימת ב-/exec, " + "ושבפריסה נבחר Who has access: Anyone.");
    });
}

function admInstallBox() {
    var el = document.getElementById("adm-inst");
    if (!el) return;
    if (isStandalone()) {
        el.innerHTML = '<div class="done-box">הניהול כבר פתוח כאפליקציה.</div>';
        return;
    }
    var h = deferredInstall ? '<button class="btn gd" onclick="admInstall()">הוספת הניהול למסך הבית</button>' + '<div class="cond" style="margin-top:10px">לחצו מכאן ולא ממסך הבית - ' + "הדפדפן מתקין את מה שפתוח מולו.</div>" : '<div class="cond">הדפדפן אינו מציע התקנה כרגע. כך זה עובד: ברגע ' + "שהאפליקציה הרגילה מותקנת, כרום מפסיק להציע התקנה גם לאפליקציה " + "השנייה. כדי לקבל את אייקון הזהב צריך להתקין <b>אותו קודם</b>, " + "לפני האפליקציה הרגילה.<br>" + "הדרך הפשוטה יותר: להעתיק את הקישור ולשמור אותו כסימנייה.</div>";
    h += '<button class="btn g" style="margin-top:8px" onclick="admCopyLink()">' + 'העתקת הקישור לניהול</button><div id="adm-inst-msg"></div>';
    el.innerHTML = h;
}

function admRefresh() {
    var done = function() {
        location.reload();
    };
    var jobs = [];
    if (window.caches && caches.keys) {
        jobs.push(caches.keys().then(function(ks) {
            return Promise.all(ks.filter(function(k) {
                return /^hadaf-/.test(k);
            }).map(function(k) {
                return caches["delete"](k);
            }));
        }));
    }
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        jobs.push(navigator.serviceWorker.getRegistrations().then(function(rs) {
            return Promise.all(rs.map(function(r) {
                return Promise.resolve(r.update ? r.update() : 0)["catch"](function() {}).then(function() {
                    if (r.waiting) r.waiting.postMessage({
                        type: "SKIP_WAITING"
                    });
                });
            }));
        }));
    }
    Promise.all(jobs).then(done)["catch"](done);
}

function admCopyStudio() {
    var url = location.origin + "/studio";
    var m = document.getElementById("adm-studio-msg");
    var show = function(cls, txt) {
        m.innerHTML = '<div class="' + cls + '" style="margin-top:8px">' + esc(txt) + "</div>";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
            show("done-box", "הועתק · " + url);
        }).catch(function() {
            show("cond", url);
        });
    } else {
        show("cond", url);
    }
}

function admCopyLink() {
    var url = location.origin + "/#admin";
    var m = document.getElementById("adm-inst-msg");
    var ok = function() {
        m.innerHTML = '<div class="done-box" style="margin-top:8px">הועתק · ' + esc(url) + "</div>";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok).catch(function() {
            m.innerHTML = '<div class="cond" style="margin-top:8px">' + esc(url) + "</div>";
        });
    } else {
        m.innerHTML = '<div class="cond" style="margin-top:8px">' + esc(url) + "</div>";
    }
}

function admInstall() {
    var p = deferredInstall;
    if (!p) {
        admInstallBox();
        return;
    }
    deferredInstall = null;
    p.prompt();
    p.userChoice.then(function(r) {
        document.getElementById("adm-inst").innerHTML = r && r.outcome === "accepted" ? '<div class="done-box">נוסף למסך הבית - חפשו את האייקון הזהוב.</div>' : '<div class="cond">בוטל. אפשר לנסות שוב מתפריט הדפדפן.</div>';
    }).catch(function() {});
}

var SID_TABS = {
    marks: "סימוני הדף",
    own: "פירוש",
    q: "שאלות בדף",
    deck: "מצגת"
};

var SID = {
    busy: false,
    msg: "",
    cls: "",
    res: null,
    tabs: null
};

function sidCard() {
    var r = SID.res, sum = "";
    if (r) {
        var dafs = r.report.length, items = 0, orph = 0, conv = 0;
        r.report.forEach(function(d) {
            items += d.items.length;
            orph += d.orph.own.length + d.orph.q.length + d.orph.deck.length;
            if (d.was.own === "n" || d.was.q === "n" || d.was.deck === "n") conv++;
        });
        sum = '<div class="cond" style="margin-top:10px">' + "<b>" + dafs + "</b> דפים · <b>" + items + "</b> קטעים · " + "<b>" + r.changedPages + "</b> עמודים יקבלו מזהים · " + "<b>" + conv + "</b> דפים עם תוכן לפי מספרים" + (orph ? ' · <b style="color:#B3261E">' + orph + "</b> שיוכים למספר שאין לו קטע (יישמרו בצד, לא יימחקו)" : "") + "</div>" + sidTable_(r);
    }
    return '<div class="adm-card" style="margin-bottom:11px"><h4>מזהים קבועים לקטעים</h4>' + '<p class="h">כדי שפיצול ואיחוד בסטודיו לא יזיזו את הפירוש, השאלות, ההקלטות והשקפים ' + "של קטעים אחרים. <b>בדיקה</b> אינה משנה דבר. <b>הסבה</b> - רק אחרי בדיקה, " + "עם גיבוי לפני הכתיבה. <b>שחזור</b> - מחזיר את ארבע הלשוניות למצב שבגיבוי.</p>" + '<button class="btn g" onclick="sidDry()"' + (SID.busy ? " disabled" : "") + ">בדיקה - בלי לשנות</button>" + (r ? '<button class="btn g" style="margin-top:8px" onclick="sidSaveReport()">הורדת הדוח</button>' + '<button class="btn gd" style="margin-top:8px" onclick="sidRun()"' + (SID.busy ? " disabled" : "") + ">הסבה - גיבוי ואז כתיבה</button>" : "") + '<button class="btn g" style="margin-top:8px" onclick="sidRestore()"' + (SID.busy ? " disabled" : "") + ">שחזור מהגיבוי</button>" + (SID.msg ? '<div class="' + (SID.cls || "cond") + '" style="margin-top:10px">' + SID.msg + "</div>" : "") + sum + "</div>";
}

function sidTable_(r) {
    return '<details style="margin-top:8px"><summary>הדוח לפי דף</summary>' + r.report.map(function(d) {
        var o = d.orph, bad = o.own.concat(o.q, o.deck);
        return '<div style="margin:10px 0 4px;font-weight:800">' + esc(d.mas) + " · דף " + esc(d.daf) + " · " + d.groups + " קטעים" + (bad.length ? ' · <span style="color:#B3261E">מספרים בלי קטע: ' + bad.join(", ") + "</span>" : "") + '</div><div style="font-size:.78rem;line-height:1.6">' + d.items.map(function(it) {
            var tags = [];
            if (it.own) tags.push("פירוש");
            if (it.q) tags.push("שאלה");
            if (it.slide !== "") tags.push("שקף");
            return it.n + ' → <code dir="ltr">' + esc(it.id) + "</code> · " + esc(it.text) + "…" + (it.parts > 1 ? " (חוצה עמוד)" : "") + (tags.length ? " · <b>" + tags.join(", ") + "</b>" : "");
        }).join("<br>") + "</div>";
    }).join("") + "</details>";
}

function sidSay_(cls, msg) {
    SID.cls = cls;
    SID.msg = msg;
    admPane();
}

function sidRead_() {
    var key = (CFG.readKey || "").trim(), names = Object.keys(SID_TABS), out = {};
    return Promise.all(names.map(function(k) {
        return scriptGet({
            read: SID_TABS[k],
            key: key
        }).then(function(d) {
            if (!d || d.status !== "ok") throw new Error(d && d.message || SID_TABS[k]);
            out[k] = d.rows || [];
        });
    })).then(function() {
        return out;
    });
}

function sidMap_(rows) {
    var m = {}, at = {};
    (rows || []).slice(1).forEach(function(r, i) {
        var mas = String(r[0] || "").trim(), daf = String(r[1] || "").trim(), raw = String(r[2] || "").trim();
        if (!mas || !daf || !raw) return;
        var v;
        try {
            v = JSON.parse(raw);
        } catch (e) {
            v = {
                __bad: raw
            };
        }
        m[SidDm(mas, daf)] = v;
        at[SidDm(mas, daf)] = i + 1;
    });
    return {
        map: m,
        at: at
    };
}

function sidDry() {
    if (!(CFG.readKey || "").trim()) {
        sidSay_("bad", "צריך סיסמת סקריפט במכשיר (למעלה במסך הזה).");
        return;
    }
    SID.busy = true;
    SID.res = null;
    sidSay_("cond", "קורא את ארבע הלשוניות…");
    sidRead_().then(function(t) {
        var o = sidMap_(t.own), q = sidMap_(t.q), d = sidMap_(t.deck);
        SID.tabs = t;
        SID.res = SidMigrate(t.marks, o.map, q.map, d.map);
        SID.busy = false;
        sidSay_("ok", "הבדיקה הסתיימה. לא נכתב דבר.");
    }).catch(function(e) {
        SID.busy = false;
        sidSay_("bad", "לא הצלחתי לקרוא: " + esc(e && e.message || ""));
    });
}

function sidSaveReport() {
    if (!SID.res) return;
    var lines = [ "מסכת,דף,מספר,מזהה,חוצה עמוד,פירוש,שאלה,שקף,תחילת הטקסט" ];
    SID.res.report.forEach(function(d) {
        d.items.forEach(function(it) {
            lines.push([ d.mas, d.daf, it.n, it.id, it.parts > 1 ? "כן" : "", it.own ? "כן" : "", it.q ? "כן" : "", it.slide, it.text ].map(function(c) {
                return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"';
            }).join(","));
        });
        [ "own", "q", "deck" ].forEach(function(k) {
            d.orph[k].forEach(function(n) {
                lines.push([ '"' + d.mas + '"', '"' + d.daf + '"', n, '"בלי קטע - ' + SID_TABS[k] + '"' ].join(","));
            });
        });
    });
    saveFile("hadaf-stepid-report-" + stamp() + ".csv", "\ufeff" + lines.join("\r\n"));
}

function sidRows_(rows, conv) {
    var src = sidMap_(rows), seen = {}, out = [];
    (rows || []).slice(1).forEach(function(r) {
        var k = SidDm(String(r[0] || "").trim(), String(r[1] || "").trim());
        var v = conv[k];
        if (v && !seen[k] && JSON.stringify(v) !== JSON.stringify(src.map[k]) && !v.__bad) {
            seen[k] = 1;
            out.push([ r[0], r[1], JSON.stringify(v) ]);
        } else out.push(r.slice(0, 3));
        seen[k] = 1;
    });
    Object.keys(conv).forEach(function(k) {
        if (seen[k] || !conv[k] || conv[k].__bad) return;
        var a = k.split("|");
        out.push([ a[0], sidDafRaw_(k), JSON.stringify(conv[k]) ]);
    });
    return out;
}

function sidDafRaw_(k) {
    var hit = "";
    (SID.tabs.marks || []).some(function(r) {
        if (SidDm(String(r[0] || ""), String(r[1] || "")) === k) {
            hit = r[1];
            return true;
        }
        return false;
    });
    return hit || k.split("|")[1];
}

function sidPost_(tab, head, rows) {
    return fetch((CFG.api || API || "").trim(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: tab,
            key: (CFG.readKey || "").trim(),
            cols: JSON.stringify(head),
            rows: JSON.stringify(rows)
        })
    });
}

function sidCheck_(tab, rows, tries) {
    return new Promise(function(ok) {
        setTimeout(ok, tries ? 2e3 : 1500);
    }).then(function() {
        return scriptGet({
            read: tab,
            key: (CFG.readKey || "").trim()
        });
    }).then(function(d) {
        var got = d && d.status === "ok" && d.rows ? d.rows.slice(1) : null;
        var same = got && got.length === rows.length && got.every(function(r, i) {
            return rows[i].every(function(c, j) {
                return String(c == null ? "" : c) === String(r[j] == null ? "" : r[j]);
            });
        });
        if (same) return true;
        if ((tries || 0) < 4) return sidCheck_(tab, rows, (tries || 0) + 1);
        return false;
    }).catch(function() {
        return (tries || 0) < 4 ? sidCheck_(tab, rows, (tries || 0) + 1) : false;
    });
}
