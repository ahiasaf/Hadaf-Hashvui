function opToggle(ti, wi) {
    var t = TRACKS[ti], am = OpenAm(t.cal[wi]), daf = t.cal[wi][2], key = OpenKey(t.id, daf, am);
    var was = OpenIs(t.id, daf, am), nm = daf + LAmMark(am);
    if (!API) {
        opMsg = "אין כתובת שרת במכשיר הזה.";
        opCls = "bad";
        admPane();
        return;
    }
    if (!confirm(was ? "לסגור את דף " + nm + " במסכת " + t.masechet + "? תלמידים לא יוכלו להיכנס אליו." : "לפתוח את דף " + nm + " במסכת " + t.masechet + "? הוא ייפתח מיד לכל " + "התלמידים, ומי שביקש התראה יקבל אותה עכשיו.")) return;
    var next = {}, k;
    var cur = OpenMap();
    for (k in cur) if (cur.hasOwnProperty(k)) next[k] = cur[k];
    if (was) {
        delete next[key];
        if (am === 1) delete next[OpenKey(t.id, daf)];
    } else next[key] = (new Date).toISOString().slice(0, 10);
    var rows = [];
    for (k in next) {
        if (!next.hasOwnProperty(k)) continue;
        var p = k.split("|");
        rows.push([ p[0], p[1], "'" + (next[k] === "1" ? "" : next[k]) ]);
    }
    opBusy = true;
    opMsg = "נשלח · מאמת מול הגיליון…";
    opCls = "";
    admPane();
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: OPEN_SHEET,
            key: (CFG.readKey || "").trim(),
            cols: JSON.stringify([ "מסכת", "דף", "נפתח" ]),
            rows: JSON.stringify(rows)
        })
    }).catch(function() {});
    opVerify(t, daf, am, !was, 0);
}

function opVerify(t, daf, am, want, tries) {
    setTimeout(function() {
        OpenLoad().then(function(got) {
            if (got && OpenIs(t.id, daf, am) === want) {
                if (!want) {
                    opBusy = false;
                    opCls = "ok";
                    opMsg = "דף " + daf + LAmMark(am) + " נסגר.";
                    admPane();
                    return;
                }
                opNotify(t, daf, am);
                return;
            }
            if (tries < 4) {
                opVerify(t, daf, am, want, tries + 1);
                return;
            }
            opBusy = false;
            opCls = "bad";
            opMsg = "לא הצלחתי לאמת שהשינוי הגיע לגיליון. נסו שוב.";
            admPane();
        });
    }, tries ? 2500 : 1600);
}

var opAud = "wait";

function opNotify(t, daf, am) {
    var key = (CFG.readKey || "").trim();
    var v = {
        mas: t.masechet,
        daf: daf + LAmMark(am)
    };
    var done = function(txt, cls) {
        opBusy = false;
        opCls = cls;
        opMsg = "דף " + v.daf + " נפתח לכל התלמידים. " + txt;
        admPane();
    };
    if (!key) {
        done("ההתראה לא יצאה: חסרה סיסמת הקריאה בהגדרות.", "bad");
        return;
    }
    var all = opAud === "all";
    if (!confirm(all ? UI.openPushAskAll : UI.openPushAsk)) {
        done(UI.openPushNo, "ok");
        return;
    }
    scriptGet({
        fire: "say",
        key: key,
        title: fill(UI.openPushT, v),
        body: fill(UI.openPushB, v),
        wait: all ? "" : OpenKey(t.id, daf, am),
        url: "learn?mas=" + t.id + "&daf=" + OpenKey(t.id, daf).split("|")[1] + (am ? "&amud=" + am : "")
    }).then(function(d) {
        if (d && d.status === "ok") done('התקבל לשליחה. התוצאה - ב"מה קורה ← שליחה".', "ok"); else done("ההתראה לא יצאה: " + (d && d.message || "אין תשובה מהסקריפט."), "bad");
    })["catch"](function() {
        done("ההתראה לא יצאה: אין תשובה מהסקריפט.", "bad");
    });
}

var tmAsked = false, tmMsg = "", tmCls = "", tmBusy = false, tmCat = "any";

function admTmpl(el) {
    if (!tmAsked) {
        tmAsked = true;
        tmplLoad().then(function() {
            admPane();
        });
    }
    var list = tmplNow();
    var h = '<div class="adm-card" style="margin-bottom:11px"><h4>נוסח חדש</h4>' + '<p class="h">ראשי החטיבה והרכזים יראו אותו כהצעה בכרטיס "מילה לתלמידים", ' + "כשבחרו בקבוצה שאליה שייכתם אותו. לחיצה מעתיקה אותו לתיבה, ושם אפשר לשנות. " + '<span dir="ltr">{daf}</span> - הדף של השבוע. אין צורך לכתוב את שם התלמיד: ' + "הפנייה בשם נוספת לבד.</p>" + '<div class="fld"><label class="label" for="tm-cat">לאיזו קבוצה</label>' + '<select id="tm-cat" onchange="tmCat=this.value">' + TMPL_CATS.map(function(c) {
        return '<option value="' + c[0] + '"' + (c[0] === tmCat ? " selected" : "") + ">" + esc(tmplCatLabel(c[0])) + "</option>";
    }).join("") + "</select></div>" + '<div class="fld"><label class="label" for="tm-txt">הנוסח</label>' + '<textarea id="tm-txt" rows="3"></textarea></div>' + '<button class="btn gd"' + (tmBusy ? " disabled" : "") + ' onclick="tmAdd()">הוספה</button>' + (tmMsg ? '<p class="h" style="margin-top:9px;color:var(--' + (tmCls === "ok" ? "ok" : tmCls === "bad" ? "stop" : "ink-2") + ')">' + esc(tmMsg) + "</p>" : "") + "</div>";
    TMPL_CATS.forEach(function(c) {
        var mine = [];
        list.forEach(function(t, i) {
            if (t.cat === c[0]) mine.push(i);
        });
        if (!mine.length) return;
        h += '<div class="adm-card" style="margin-bottom:11px"><h4>' + esc(tmplCatLabel(c[0])) + " · " + mine.length + "</h4>" + mine.map(function(i) {
            return '<div class="row" style="align-items:center;gap:9px">' + '<span style="flex:1;min-width:0">' + esc(list[i].text) + "</span>" + '<button class="dk-ic warn"' + (tmBusy ? " disabled" : "") + ' onclick="tmDel(' + i + ')" aria-label="מחיקה">✕</button></div>';
        }).join("") + "</div>";
    });
    if (TMPL && !list.length) {
        h += '<p class="h">עוד אין נוסחים. מה שתוסיפו כאן יופיע אצלם.</p>';
    }
    el.innerHTML = h;
}

function tmAdd() {
    var t = (document.getElementById("tm-txt").value || "").trim();
    if (t.length < 2) return;
    var list = tmplNow().slice();
    list.push({
        cat: tmCat,
        text: t
    });
    tmSave(list);
}

function tmDel(i) {
    var list = tmplNow().slice();
    if (!list[i] || !confirm("למחוק את הנוסח?\n\n" + list[i].text)) return;
    list.splice(i, 1);
    tmSave(list);
}

function tmSave(list) {
    if (!API) {
        tmMsg = "אין כתובת שרת במכשיר הזה.";
        tmCls = "bad";
        admPane();
        return;
    }
    tmBusy = true;
    tmMsg = "נשמר · מאמת מול הגיליון…";
    tmCls = "";
    admPane();
    fetch(API, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: TMPL_TAB,
            key: (CFG.readKey || "").trim(),
            cols: JSON.stringify([ "קטגוריה", "נוסח" ]),
            rows: JSON.stringify(list.map(function(x) {
                return [ x.cat, "'" + x.text ];
            }))
        })
    }).catch(function() {});
    var want = JSON.stringify(list);
    var check = function(tries) {
        setTimeout(function() {
            tmplLoad().then(function(ok) {
                if (ok && JSON.stringify(TMPL) === want) {
                    tmBusy = false;
                    tmCls = "ok";
                    tmMsg = "נשמר. זה כבר מופיע אצלם.";
                    admPane();
                    return;
                }
                if (tries < 4) {
                    check(tries + 1);
                    return;
                }
                tmBusy = false;
                tmCls = "bad";
                tmMsg = "לא הצלחתי לאמת שהשמירה הגיעה לגיליון. נסו שוב.";
                admPane();
            });
        }, tries ? 2500 : 1600);
    };
    check(0);
}

function admPrice(el) {
    el.innerHTML = '<div class="adm-card"><h4>מחיר לחוברת</h4>' + '<p class="h">משפיע על מסך הבית, מסך ההרשמה, מסך הספרים וסיכום ההרשמות. ' + "מחיר מוזל השווה למחיר המלא - לא תוצג הנחה. " + '"כמות מינימלית" היא התנאי של ההוצאה, והיא מוצגת לראשי החטיבות ' + "ליד כל מחיר מוזל. אפס - ההערה לא תופיע.</p>" + SFARIM.map(function(s) {
        var p = priceOf(s.id);
        return '<div class="fld"><div class="label">' + esc(s.name) + " - מחיר מוזל</div>" + '<input type="tel" value="' + p.price + '" onchange="admPriceSet(\'' + s.id + "','price',this.value)\"></div>" + '<div class="fld"><div class="label">' + esc(s.name) + " - מחיר מלא</div>" + '<input type="tel" value="' + p.list + '" onchange="admPriceSet(\'' + s.id + "','list',this.value)\"></div>" + '<div class="fld"><div class="label">' + esc(s.name) + " - כמות מינימלית להנחה</div>" + '<input type="tel" value="' + p.min + '" onchange="admPriceSet(\'' + s.id + "','min',this.value)\"></div>";
    }).join("") + "</div>";
}

function admPriceSet(id, k, v) {
    v = parseInt(v, 10);
    if (k === "min") {
        if (!(v >= 0)) v = 0;
    } else if (!(v > 0)) {
        alert("המחיר חייב להיות מספר גדול מאפס.");
        admPane();
        return;
    }
    var cur = priceOf(id), c = CV("prices") || {};
    c[id] = {
        price: cur.price,
        list: cur.list,
        min: cur.min
    };
    c[id][k] = v;
    if (c[id].price > c[id].list) c[id].list = c[id].price;
    cfgSet("prices", c);
    admPane();
}

var AMDA_ROSTER = "תלמידי בית הספר";

var AMDA_TAB = "עמדת לימוד";

var AMDA_GRADES = [ "ז", "ח", "ט", "י" ];

var AMDA_SLOTS = [ "Pray", "B10", "B1230", "B1430", "Noded" ];

var AMDA_NODED = "Noded";

var amdaSt = {
    g: "",
    c: "",
    pick: "",
    idle: null,
    ok: null,
    pullT: null,
    flushT: null,
    slot: "",
    track: ""
};

var amdaMsg = "";

function amdaT(k, v) {
    var s = String(window.AMDA && AMDA[k] || "");
    return v ? s.replace(/\{(\w+)\}/g, function(m, x) {
        return v[x] != null ? v[x] : m;
    }) : s;
}

function amdaG(g) {
    return g + "׳";
}

function amdaWeek() {
    return Math.max(0, LWeek()) + 1;
}

function amdaKey(g, c, n) {
    return g + "|" + c + "|" + n;
}

function amdaDay() {
    var d = new Date, p = function(x) {
        return (x < 10 ? "0" : "") + x;
    };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function amdaSlotName(id) {
    var l = amdaLesson(id);
    return l ? amdaLessonName(l) : amdaT("slot" + id);
}

function amdaSlotWin(id) {
    var m = /(\d{1,2}):(\d{2})\s*[--]\s*(\d{1,2}):(\d{2})/.exec(amdaT("slot" + id + "T"));
    return m ? [ +m[1] * 60 + +m[2], +m[3] * 60 + +m[4] ] : null;
}

function amdaSlotNow() {
    var d = new Date, t = d.getHours() * 60 + d.getMinutes(), i, w, last = AMDA_SLOTS[0];
    for (i = 0; i < AMDA_SLOTS.length; i++) {
        w = amdaSlotWin(AMDA_SLOTS[i]);
        if (!w) continue;
        if (t < w[1]) return AMDA_SLOTS[i];
        last = AMDA_SLOTS[i];
    }
    return last;
}

function amdaSlotSel() {
    if (AMDA_SLOTS.indexOf(amdaSt.slot) < 0 && !amdaLesson(amdaSt.slot)) amdaSt.slot = amdaSlotNow();
    return amdaSt.slot;
}

function amdaSess() {
    return Store.get("amdaSess", null) || {
        slot: amdaSlotSel(),
        kind: amdaKindEff(),
        lv: amdaLv()
    };
}

var AMDA_DOW = {
    "א": 0,
    "ב": 1,
    "ג": 2,
    "ד": 3,
    "ה": 4,
    "ו": 5,
    "ש": 6
};

function amdaDafWins() {
    return amdaT("dafTimes").split(/[,;\n]/).map(function(x) {
        var m = /^\s*([א-ש])['׳]?\s+(\d{1,2}):(\d{2})\s*[--]\s*(\d{1,2}):(\d{2})\s*$/.exec(x);
        return m && AMDA_DOW[m[1]] != null ? [ AMDA_DOW[m[1]], +m[2] * 60 + +m[3], +m[4] * 60 + +m[5] ] : null;
    }).filter(Boolean);
}

function amdaKindAuto() {
    var d = new Date, dow = d.getDay(), t = d.getHours() * 60 + d.getMinutes();
    return amdaDafWins().some(function(w) {
        return w[0] === dow && t >= w[1] && t < w[2];
    }) ? "d" : "o";
}

function amdaKindEff() {
    return amdaSt.kind || amdaKindAuto();
}

var AMDA_LV = [ "למד וחידון", "למד", "השתתף" ];

function amdaLv() {
    var v = Store.get("amdaLv", "");
    return AMDA_LV.indexOf(v) >= 0 ? v : AMDA_LV[0];
}

function amdaLvSet(v) {
    Store.set("amdaLv", v);
    admPane();
}

function amdaKindPick(k) {
    amdaSt.kind = amdaSt.kind === k ? "" : k;
    admPane();
}

function amdaQuick() {
    var r = amdaRoster();
    if (!r || !amdaCount(r).n) {
        admSubGo("amda");
        return;
    }
    amdaSt.slot = "";
    amdaSt.kind = "";
    amdaOpen(amdaKindAuto());
}

function amdaBucket(slot, kind) {
    return String(slot || "").charAt(0) === "L" ? 3 : slot === AMDA_NODED ? 2 : kind === "o" ? 1 : 0;
}

function amdaC4(a) {
    a = a || [];
    return [ a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0 ];
}

function amdaRoster() {
    return Store.get("amdaRoster", null);
}

function amdaCount(r) {
    var n = 0, c = 0, g, k;
    if (!r || !r.g) return {
        n: 0,
        c: 0
    };
    for (g in r.g) {
        if (!r.g.hasOwnProperty(g)) continue;
        for (k in r.g[g]) {
            if (r.g[g].hasOwnProperty(k)) {
                c++;
                n += r.g[g][k].length;
            }
        }
    }
    return {
        n: n,
        c: c
    };
}

function amdaClasses(g) {
    var r = amdaRoster(), out = [], k;
    if (!r || !r.g || !r.g[g]) return out;
    for (k in r.g[g]) {
        if (r.g[g].hasOwnProperty(k)) out.push(k);
    }
    return out.sort(function(a, b) {
        return a - b;
    });
}

function amdaInst() {
    return (amdaRoster() || {}).inst || "";
}

function amdaInstRow(code) {
    return INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0] || null;
}

function amdaTracks() {
    var i = amdaInstRow(amdaInst());
    return i && i.mas && i.mas.length ? i.mas : [ TRACKS[0].id ];
}

function amdaTrack() {
    var l = amdaTracks();
    return l.indexOf(amdaSt.track) >= 0 ? amdaSt.track : l[0];
}

function amdaSetInst(v) {
    var r = amdaRoster();
    if (!r) return;
    r.inst = v;
    Store.set("amdaRoster", r);
    amdaMsg = amdaT("admSaving", {
        n: amdaCount(r).n
    });
    admPane();
    amdaPushRoster(r);
}

function amdaQ() {
    return Store.get("amdaQ", []) || [];
}

function amdaSessOf(m) {
    return m.day && m.slot ? m.day + "|" + m.slot : "w" + m.w;
}

function amdaHadNow(sess) {
    var all = Store.get("amdaHad2", {}) || {}, out = {}, k, src = all[sess] || {};
    for (k in src) {
        if (src.hasOwnProperty(k)) out[k] = 1;
    }
    amdaQ().forEach(function(m) {
        if (amdaSessOf(m) === sess) out[amdaKey(m.g, m.c, m.n)] = 1;
    });
    return out;
}

function amdaCounts() {
    var base = Store.get("amdaCnt", {}) || {}, out = {}, k;
    for (k in base) {
        if (base.hasOwnProperty(k)) out[k] = amdaC4(base[k]);
    }
    amdaQ().forEach(function(m) {
        var sk = amdaKey(m.g, m.c, m.n);
        (out[sk] = out[sk] || amdaC4())[amdaBucket(m.slot, m.kind)]++;
    });
    return out;
}

function amdaFile() {
    var inp = document.getElementById("amda-file");
    if (!inp) return;
    inp.value = "";
    inp.click();
}

function amdaNeedXlsx() {
    if (window.XLSX_READ) return Promise.resolve();
    return new Promise(function(ok, fail) {
        var s = document.createElement("script");
        s.src = "xlsx.js?v=" + APP_VERSION;
        s.onload = function() {
            ok();
        };
        s.onerror = function() {
            fail(new Error("xlsx"));
        };
        document.body.appendChild(s);
    });
}

function amdaPicked(inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var rd = new FileReader;
    rd.onload = function() {
        amdaNeedXlsx().then(function() {
            var r = null;
            try {
                r = amdaFromSheets(XLSX_READ(rd.result));
            } catch (e) {
                r = null;
            }
            if (!r || !amdaCount(r).n) {
                alert(amdaT("admBad"));
                return;
            }
            r.inst = amdaInst() || ADM_INST || "";
            Store.set("amdaRoster", r);
            amdaMsg = amdaT("admSaving", {
                n: amdaCount(r).n
            });
            admPane();
            amdaPushRoster(r);
        }).catch(function() {
            alert(amdaT("admBad"));
        });
    };
    rd.readAsArrayBuffer(f);
}
