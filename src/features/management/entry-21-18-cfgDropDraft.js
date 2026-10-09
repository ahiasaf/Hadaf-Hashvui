function cfgDropDraft() {
    if (!confirm("לבטל את השינויים שלא פורסמו, במכשיר הזה בלבד? " + "המכשיר יחזור להציג את מה שפורסם.")) return;
    PUB_KEYS.forEach(function(k) {
        delete CFG[k];
    });
    Store.set("cfg", CFG);
    applyCfg();
    renderHome();
    renderAdmin();
}

function admPubBar() {
    var el = document.getElementById("adm-pub");
    if (!el) return;
    var dirty = cfgDirty();
    var never = !Object.keys(PUB_CFG || {}).length;
    if (!(admTab === "more" && admSub.more === "sys")) {
        el.innerHTML = dirty ? '<div class="publine"><span>יש שינויים שלא פורסמו</span>' + '<button onclick="publishSettings()">פרסום</button></div>' + '<div id="adm-pub-msg"></div>' : '<div id="adm-pub-msg"></div>';
        return;
    }
    if (dirty) {
        el.innerHTML = '<div class="pubbar warn"><div><b>יש שינויים שלא פורסמו</b>' + "<span>הם נראים כרגע רק במכשיר הזה. פרסום יחיל אותם על כל מי " + "שנכנס לאפליקציה.</span></div>" + '<button onclick="publishSettings()">פרסום</button>' + '<button class="alt" onclick="cfgDropDraft()">ביטול</button></div>' + '<div id="adm-pub-msg"></div>';
    } else if (never) {
        el.innerHTML = '<div class="pubbar"><div><b>עוד לא פורסמו הגדרות</b>' + "<span>כולם רואים את ברירות המחדל שבקוד. שנו משהו כאן ופרסמו, " + 'וזה יחול על כולם.</span></div></div><div id="adm-pub-msg"></div>';
    } else {
        el.innerHTML = '<div class="pubbar ok"><div><b>ההגדרות מפורסמות</b>' + "<span>מה שמוצג כאן הוא מה שכל מי שנכנס לאפליקציה רואה.</span></div>" + '<button class="alt" onclick="publishSettings()">פרסום מחדש</button></div>' + '<div id="adm-pub-msg"></div>';
    }
    el.innerHTML += '<div style="margin-top:10px">' + '<button class="btn p" style="margin:0;width:100%" onclick="admVisitorCheck()">' + "מה רואה מי שנכנס עכשיו</button>" + '<p class="h" style="margin-top:6px">הפס שלמעלה יודע מה <b>נשלח</b>. ' + "רק זה יודע מה <b>הגיע</b>: הוא קורא מהגיליון כמו זר, ומדווח " + "מה הוא רואה בפועל.</p></div>" + '<div id="adm-vis"></div>';
}

function admVisitorCheck() {
    var box = document.getElementById("adm-vis");
    if (!box) return;
    var say = function(cls, h) {
        box.innerHTML = '<div class="' + cls + '" style="margin-top:10px">' + h + "</div>";
    };
    say("cond", "קורא מהגיליון…");
    var id = CFG.sheetId || SHEET_ID;
    Promise.all([ fetchSheet(id, SET_TAB), fetchSheet(id, MARK_TAB_PUB), fetchSheet(id, "טקסטים") ]).then(function(r) {
        var setRows = r[0], markRows = r[1], txtMap = textsFromRows(r[2]);
        var empty = setRows && setRows.length === 1 && (setRows[0] || []).join("|").indexOf("מפתח") >= 0;
        if (!empty && (!setRows || setRows.length < 2)) {
            say("cond", '<b>לשונית "' + SET_TAB + '" ריקה או שלא נקראה.</b><br>' + "כלומר: מי שנכנס לאפליקציה רואה את ברירות המחדל שבקוד, " + "ולא את מה שסימנתם כאן.<br>" + 'לחצו "פרסום מחדש" למעלה - הוא יאמר אם הכתיבה הגיעה. ' + 'אם גם היא נכשלת, "בדיקת חיבור" בכרטיס שרת ההרשמות ' + "יאמר מה חסר.");
            return;
        }
        var pub = {}, seen = [], broke = [];
        setRows.slice(1).forEach(function(row) {
            var k = (row[0] || "").trim();
            if (!k) return;
            seen.push(k);
            if (PUB_KEYS.indexOf(k) < 0) return;
            var val = cfgVal(row[1]);
            if (val === undefined) {
                broke.push(k);
                return;
            }
            pub[k] = val;
        });
        if (!empty && !Object.keys(pub).length) {
            say("cond", "<b>הגיליון נקרא, אבל שום הגדרה לא חזרה ממנו.</b><br>" + 'לשונית "' + SET_TAB + '" · ' + (setRows.length - 1) + " שורות.<br>" + "מה שנמצא בעמודה הראשונה: " + esc(seen.slice(0, 8).join(" · ") || "(ריק)") + (broke.length ? "<br>ערכים שלא ניתן לקרוא: " + esc(broke.join(" · ")) : "") + '<br><br>לחצו "פרסום מחדש" למעלה - הוא כותב עכשיו בצורה ' + "שגוגל אינה משנה, והבדיקה הזו אמורה להתמלא.");
            return;
        }
        var wi = weekIndex(), first = wi < 0;
        var wk = first ? 0 : wi;
        var marks = {};
        (markRows || []).slice(1).forEach(function(row) {
            if (!row[0] || !row[1]) return;
            (marks[row[0].trim()] = marks[row[0].trim()] || {})[dafKey(row[1])] = 1;
        });
        var h = "<b>כך זה נראה למי שפותח את הקישור עכשיו:</b>" + '<div style="margin-top:8px">';
        TRACKS.forEach(function(tr) {
            var daf = (tr.cal[wk] || [])[2];
            h += '<div style="margin-top:6px"><b>מסכת ' + esc(tr.masechet) + "</b> · " + (first ? "הדף הראשון" : "הדף השבוע") + ": " + esc(daf || "-") + "</div>";
            ROW_KEYS.forEach(function(rk) {
                var k = rk[0];
                var on = pub.rows && pub.rows[k] != null ? !!pub.rows[k] : k === "inter" ? INTER_PUBLIC : ROW_DEF[k];
                var why = "";
                if (on && k === "inter") {
                    if (!daf || !(marks[tr.id] || {})[dafKey(daf)]) {
                        on = false;
                        why = " - <b>המתג דלוק, אבל הדף לא סומן בסטודיו</b>";
                    }
                }
                h += '<div class="sub" style="margin-right:10px">' + (on ? "✓ " : "✗ ") + esc(rk[1]) + (on || why ? "" : " - לא מוצג") + why + "</div>";
            });
        });
        h += "</div>";
        var diff = [];
        PUB_KEYS.forEach(function(k) {
            var mine = CV(k);
            if (mine == null) return;
            if (JSON.stringify(mine) !== JSON.stringify(pub[k])) diff.push(k);
        });
        if (diff.length) {
            h += '<div style="margin-top:10px"><b>' + diff.length + " הגדרות שונות אצלכם ממה שבגיליון.</b><br>" + "כלומר מה שאתם רואים בפאנל אינו מה שהם רואים. " + 'לחצו "פרסום מחדש" למעלה.</div>';
        }
        say(diff.length ? "cond" : "done-box", h);
        pubChangesPaint(pub, txtMap);
    }).catch(function() {
        say("cond", "לא הצלחתי לקרוא מהגיליון. בדקו חיבור לרשת.");
    });
}

var KEEP_CFG = {
    coordWa: 1,
    waGroup: 1
};

function cfgCodeVal(k, sub) {
    if (k === "rows") return sub === "inter" ? INTER_PUBLIC : ROW_DEF[sub];
    if (k === "joined") return CODE_CFG.joined[sub];
    if (k === "sugya") return CODE_CFG.sugya[sub];
    if (k === "prices") return CODE_CFG.prices[sub];
    var D = {
        roster: ROSTER_DEF,
        orderBy: ORDER_BY,
        raffle: false,
        tourOn: false,
        tourAt: "foot",
        sizeOn: false,
        netTicker: "off",
        joinLink: true,
        weekRaffle: false,
        roleAsk: true
    };
    return D[k];
}

function cfgSame(a, b) {
    if ((a == null || a === false) && (b == null || b === false)) return true;
    return jsonEq(a, b);
}

function pubChanges(pub, txt) {
    var cfg = [], tx = [];
    PUB_KEYS.forEach(function(k) {
        var v = pub[k];
        if (v == null || KEEP_CFG[k]) return;
        if (PUB_DEEP[k] && typeof v === "object") {
            for (var a in v) {
                if (!v.hasOwnProperty(a)) continue;
                var code = cfgCodeVal(k, a), now = v[a];
                if (k === "prices" && now && typeof now === "object") {
                    var diffF = {}, n = 0;
                    for (var f in now) {
                        if (now.hasOwnProperty(f) && now[f] != null && !cfgSame(now[f], (code || {})[f])) {
                            diffF[f] = now[f];
                            n++;
                        }
                    }
                    if (n) cfg.push({
                        k: k,
                        sub: a,
                        code: code,
                        now: diffF
                    });
                    continue;
                }
                if (!cfgSame(now, code)) cfg.push({
                    k: k,
                    sub: a,
                    code: code,
                    now: now
                });
            }
        } else if (!cfgSame(v, cfgCodeVal(k))) {
            cfg.push({
                k: k,
                code: cfgCodeVal(k),
                now: v
            });
        }
    });
    var lbl = {};
    TEXT_FIELDS.forEach(function(f) {
        if (f.k) lbl[f.k] = f.lbl || "";
    });
    for (var k in txt || {}) {
        if (!txt.hasOwnProperty(k) || KEEP_TEXT[k]) continue;
        var code = TX.base(k), now = txt[k];
        if (typeof now !== "string" || now === code) continue;
        tx.push({
            k: k,
            lbl: lbl[k] || "",
            code: typeof code === "string" ? code : null,
            now: now
        });
    }
    return {
        cfg: cfg,
        tx: tx
    };
}

var PUB_SEEN = null;

function pubChangesPaint(pub, txt) {
    var box = document.getElementById("adm-vis");
    if (!box) return;
    var ch = pubChanges(pub, txt || {});
    PUB_SEEN = {
        pub: pub,
        txt: txt,
        n: ch.cfg.length + ch.tx.length,
        txtOk: !!txt
    };
    var el = document.createElement("div");
    el.className = "adm-card";
    el.style.marginTop = "10px";
    var h = "<h4>מה שפורסם ושונה מהקוד</h4>";
    if (!txt) h += '<div class="cond">לשונית המלל לא נקראה - הרשימה כוללת רק הגדרות.</div>';
    if (!ch.cfg.length && !ch.tx.length) {
        h += '<p class="h">כלום. מה שכל מי שנכנס רואה הוא בדיוק מה שכתוב בקוד' + (Object.keys(pub).length || txt && Object.keys(txt).length ? " - מה שעוד יושב בגיליון זהה לקוד, או שהוא פרטי קשר שנשמרים שם." : ".") + "</p>";
    } else {
        h += '<p class="h">' + ch.cfg.length + " הגדרות ו-" + ch.tx.length + " נוסחים. " + "מעתיקים ושולחים להטמעה בקוד. אחרי שההטמעה עלתה, הרשימה הזו " + "מתרוקנת מעצמה - ואז מוחקים.</p>";
        ch.cfg.forEach(function(c) {
            h += '<div class="sub" style="margin:4px 0">⚙ <b>' + esc(c.k + (c.sub ? "." + c.sub : "")) + "</b>: " + esc(JSON.stringify(c.code)) + " ← <b>" + esc(JSON.stringify(c.now)) + "</b></div>";
        });
        ch.tx.forEach(function(t) {
            h += '<div class="sub" style="margin:6px 0">✎ <b>' + esc(t.lbl || t.k) + "</b>" + '<div style="color:var(--ink-3)">' + esc(t.code == null ? "-" : t.code) + "</div>" + "<div>" + esc(t.now) + "</div></div>";
        });
        h += '<textarea id="adm-chg-t" rows="7" dir="ltr" readonly ' + 'style="direction:ltr;text-align:left;font-size:.72rem;margin-top:8px"></textarea>' + '<button class="btn gd" onclick="admChgCopy()">העתקה</button>';
    }
    h += '<button class="btn warn" style="margin-top:10px" onclick="pubWipe()">' + 'מחיקת כל השינויים</button><div id="adm-wipe-msg"></div>';
    el.innerHTML = h;
    box.appendChild(el);
    if (ch.cfg.length || ch.tx.length) {
        var out = {
            "גרסה": APP_VERSION,
            "הגדרות": {},
            "נוסחים": {}
        };
        ch.cfg.forEach(function(c) {
            if (c.sub) (out["הגדרות"][c.k] = out["הגדרות"][c.k] || {})[c.sub] = c.now; else out["הגדרות"][c.k] = c.now;
        });
        ch.tx.forEach(function(t) {
            out["נוסחים"][t.k] = {
                lbl: t.lbl,
                code: t.code,
                now: t.now
            };
        });
        document.getElementById("adm-chg-t").value = JSON.stringify(out, null, 2);
    }
}

function admChgCopy() {
    var t = document.getElementById("adm-chg-t");
    if (!t) return;
    var b = t.nextSibling;
    var done = function(ok) {
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
}

function pubWipe() {
    var msg = function(cls, t) {
        var m = document.getElementById("adm-wipe-msg");
        if (m) m.innerHTML = '<div class="' + cls + '" style="margin-top:9px">' + t + "</div>";
    };
    if (!API) {
        msg("cond", "אין כתובת שרת במכשיר הזה.");
        return;
    }
    if (!PUB_SEEN || !PUB_SEEN.txtOk) {
        msg("cond", 'לשונית המלל לא נקראה - לחצו שוב "מה רואה מי שנכנס עכשיו" ונסו שוב.');
        return;
    }
    var n = PUB_SEEN.n;
    if (!confirm((n ? n + " שינויים עדיין אינם בקוד, והם יחזרו לנוסח שבקוד אצל כולם.\n\n" : "כל מה שברשימה כבר בקוד.\n\n") + "למחוק מהגיליון את כל השינויים? פרטי הקשר נשמרים.")) return;
    var pub = PUB_SEEN.pub, keepSet = {}, setRows = [], k;
    for (k in pub) if (pub.hasOwnProperty(k) && KEEP_CFG[k]) {
        keepSet[k] = pub[k];
        setRows.push([ k, "'" + JSON.stringify(pub[k]) ]);
    }
    var keepTxt = keepOnly(PUB_SEEN.txt || {}), txtRows = [];
    for (k in keepTxt) if (keepTxt.hasOwnProperty(k)) txtRows.push({
        key: k,
        value: keepTxt[k]
    });
    queue({
        action: "table",
        tab: SET_TAB,
        key: (CFG.readKey || "").trim(),
        cols: JSON.stringify([ "מפתח", "ערך" ]),
        rows: JSON.stringify(setRows)
    });
    queue({
        action: "texts",
        key: (CFG.readKey || "").trim(),
        rows: JSON.stringify(txtRows),
        at: (new Date).toISOString()
    });
    PUB_KEYS.forEach(function(q) {
        if (!KEEP_CFG[q]) delete CFG[q];
    });
    CFG.texts = keepOnly(CFG.texts || {});
    Store.set("cfg", CFG);
    PUB_CFG = keepSet;
    Store.set("cfgCache", keepSet);
    PUBLISHED = keepTxt;
    Store.set("textCache", keepTxt);
    msg("cond", "נשלח · מאמת מול הגיליון…");
    var id = CFG.sheetId || SHEET_ID, tries = 0;
    var check = function() {
        return new Promise(function(ok) {
            setTimeout(ok, tries ? 4e3 : 2500);
        }).then(function() {
            return Promise.all([ fetchSheet(id, SET_TAB), fetchSheet(id, "טקסטים") ]);
        }).then(function(r) {
            var s = r[0], t = textsFromRows(r[1]);
            var sk = (s || []).slice(1).map(function(x) {
                return (x[0] || "").trim();
            }).filter(function(x) {
                return x && !KEEP_CFG[x];
            });
            var tk = t ? Object.keys(t).filter(function(x) {
                return !KEEP_TEXT[x];
            }) : null;
            if (s && s.length && t && !sk.length && !tk.length) {
                msg("done-box", "נמחק ואומת. מעכשיו כל מי שנכנס רואה את מה שכתוב בקוד. " + "טוען מחדש…");
                setTimeout(function() {
                    location.reload();
                }, 1600);
                return;
            }
            if (++tries < 4) return check();
            msg("cond", "<b>המחיקה לא אומתה.</b> " + (!s || !t ? "לא הצלחתי לקרוא את הגיליון." : "בגיליון עדיין " + (sk.length + tk.length) + " שורות.") + " אפשר לנסות שוב.");
        }).catch(function() {
            msg("cond", "לא הצלחתי לקרוא את הגיליון. אפשר לנסות שוב.");
        });
    };
    check();
}
