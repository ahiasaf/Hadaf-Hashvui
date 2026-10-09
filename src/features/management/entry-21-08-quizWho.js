function quizWho() {
    var el = document.getElementById("q-who");
    if (!el) return;
    var me = quizMe();
    if (me) {
        var nm = (me.first + " " + (me.last || "")).trim();
        el.innerHTML = '<div class="qas">' + "<div><b>" + esc(fill(UI.qAs, {
            name: nm
        })) + "</b>" + "<span>" + esc(fill(UI.qAsSub, {
            inst: me.instName || ""
        })) + "</span></div>" + '<button onclick="qManual=true;quizWho()">' + esc(UI.qNotYou) + "</button>" + "</div>";
        return;
    }
    var qInstName = (INSTITUTIONS.filter(function(i) {
        return i.code === myInst;
    })[0] || {}).name || "";
    el.innerHTML = (typeof LMe === "function" && LMe() ? '<div class="qback"><button onclick="qManual=false;quizWho()">→ חזרה</button>' + esc(UI.qManual) + "</div>" : "") + pkField("הישיבה שלי", qInstName, "בחרו ישיבה", "pickQuizInst()") + '<div class="fld"><div class="label">השם שלי</div>' + '<input type="text" id="q-name" placeholder="שם מלא" value="' + esc(myName) + '"></div>' + '<div class="fld"><div class="label">טלפון - לשליחת הפרס</div>' + '<input type="tel" id="q-phone" placeholder="05X-XXXXXXX" value="' + esc(myPhone()) + '"></div>';
}

function myPhone() {
    var me = typeof LMe === "function" ? LMe() : null;
    return me && me.phone || "";
}

function pickQuizInst() {
    pick("הישיבה שלי", INSTITUTIONS.map(function(i) {
        return {
            v: i.code,
            t: i.name
        };
    }), myInst, function(v) {
        myInst = v;
        localStorage.setItem("dfInst", v);
        openQuiz();
    });
}

function pickAns(i) {
    state.ans = i;
    var q = QUIZ[state.track.id + "-" + (state.week + 1)][state.quizIdx];
    for (var k = 0; k < q.a.length; k++) {
        var el = document.getElementById("opt" + k);
        if (el) el.className = "opt" + (k === i ? " sel" : state.bad && state.bad[k] ? " wrong" : "");
    }
    document.getElementById("q-send").disabled = false;
}

function sendQuiz() {
    var key = state.track.id + "-" + (state.week + 1), q = QUIZ[key][state.quizIdx];
    if (state.ans < 0 || quizOk(key, state.quizIdx, q)) return;
    var me = quizMe(), inst, name, phone, id = "";
    if (me) {
        inst = me.inst;
        name = (me.first + " " + (me.last || "")).trim();
        phone = me.phone || "";
        id = me.id || "";
    } else {
        inst = myInst;
        name = document.getElementById("q-name").value.trim();
        phone = document.getElementById("q-phone").value.trim();
        if (!inst || !name) {
            alert("נא לבחור ישיבה ולמלא שם.");
            return;
        }
        myInst = inst;
        myName = name;
        localStorage.setItem("dfInst", inst);
        localStorage.setItem("dfName", name);
    }
    var right = state.ans === q.correct, tried = state.ans;
    if (!right) (state.bad = state.bad || {})[tried] = 1; else try {
        localStorage.setItem(quizOkKey(key, state.quizIdx, q), "1");
    } catch (e) {}
    for (var k = 0; k < q.a.length; k++) {
        var el = document.getElementById("opt" + k);
        if (!el) continue;
        if (right) {
            el.className = "opt" + (k === q.correct ? " right" : "");
            el.onclick = null;
        } else {
            el.className = "opt" + (state.bad[k] ? " wrong" : "");
            if (state.bad[k]) el.onclick = null;
        }
    }
    state.ans = -1;
    document.getElementById("q-send").disabled = true;
    queue({
        action: "quiz",
        week: key,
        inst: inst,
        name: name,
        phone: phone,
        answer: tried,
        correct: right,
        at: (new Date).toISOString(),
        cols: JSON.stringify([ [ "שבוע", key ], [ "ישיבה", inst ], [ "שם", name ], [ "טלפון", phone ], [ "תשובה", tried + 1 ], [ "נכון", right ? "נכון" : "לא נכון" ], [ "מזהה", id ], [ "חידה", state.quizIdx + 1 ] ])
    });
    if (typeof LMark === "function" && state.week >= 0) {
        try {
            LMark(state.track.id, state.week);
        } catch (e) {}
    }
    document.getElementById("q-result").innerHTML = '<div class="done-box" style="margin-top:14px">' + esc((right ? UI.qRight : UI.qWrong) || "") + "</div>";
}

function renderInsts() {
    var h = "";
    INSTITUTIONS.forEach(function(i) {
        h += '<div class="inst"><span class="v ' + (i.joined ? "y" : "n") + '">' + (i.joined ? "✓" : "") + '</span><span class="nm">' + esc(i.name) + "</span>" + (i.last ? '<span class="tg">תשפ"ו</span>' : "") + "</div>";
    });
    document.getElementById("inst-list").innerHTML = h;
}

var STAGES = [ {
    k: "new",
    t: "לא דיברתי",
    c: ""
}, {
    k: "talked",
    t: "דיברתי",
    c: ""
}, {
    k: "warm",
    t: "מתעניין",
    c: "w"
}, {
    k: "joined",
    t: "הצטרף",
    c: "j"
}, {
    k: "no",
    t: "לא השנה",
    c: "x"
} ];

var TAG_DEFS_DEFAULT = [ {
    k: "called",
    t: "התקשרתי בסבב הזה",
    team: false
}, {
    k: "zoom",
    t: "היה בזום",
    team: true
}, {
    k: "me",
    t: "אחיאסף",
    team: false
}, {
    k: "palti",
    t: "הרב פלתי",
    team: false
}, {
    k: "elchanan",
    t: "אלחנן",
    team: false
}, {
    k: "status_good",
    t: "מצב: טוב",
    team: true
}, {
    k: "status_mid",
    t: "מצב: בינוני",
    team: true
}, {
    k: "status_low",
    t: "מצב: פחות טוב",
    team: true
} ];

function tagDefs() {
    return Store.get("callTagDefs", null) || TAG_DEFS_DEFAULT;
}

function saveTagDefsLocal(d) {
    Store.set("callTagDefs", d);
}

function contacts() {
    var l;
    try {
        l = JSON.parse(localStorage.getItem("dfContacts") || "[]");
    } catch (e) {
        l = [];
    }
    var moved = false;
    l.forEach(function(c) {
        if (!c.tags) c.tags = {};
        if (c.round && !c.tags.called) {
            c.tags.called = true;
            moved = true;
        }
    });
    if (moved) localStorage.setItem("dfContacts", JSON.stringify(l));
    return l;
}

function saveContacts(c) {
    localStorage.setItem("dfContacts", JSON.stringify(c));
}

function jnl(c) {
    var anyTag = c && c.tags && Object.keys(c.tags).some(function(k) {
        return c.tags[k];
    });
    if (!c || !c.note && !c.upd && !anyTag && c.stage === "new") return;
    try {
        var j = Store.get("callJournal", []) || [];
        var k = nameKey(c.key || c.name), last = null;
        for (var i = j.length - 1; i >= 0; i--) if (j[i].k === k) {
            last = j[i];
            break;
        }
        var ppl = c.edited ? JSON.stringify(peopleOf(c)) : "";
        var tagsJ = JSON.stringify(c.tags || {});
        if (last && last.note === (c.note || "") && last.stage === c.stage && (last.upd || "") === (c.upd || "") && JSON.stringify(last.tags || {}) === tagsJ && JSON.stringify(last.people || (last.people === null ? null : "")) === (c.edited ? ppl : JSON.stringify(null))) return;
        j.push({
            k: k,
            name: c.name,
            stage: c.stage,
            note: c.note || "",
            upd: c.upd || "",
            tags: c.tags || {},
            who: (mainOf(c) || {}).name || "",
            people: c.edited ? peopleOf(c) : null,
            last: !!c.last,
            at: c.at || (new Date).toISOString()
        });
        if (j.length > 3e3) j = j.slice(-3e3);
        Store.set("callJournal", j);
    } catch (e) {}
}

function jnlRestore(list) {
    var j = Store.get("callJournal", []) || [];
    if (!j.length) return 0;
    var best = {};
    j.forEach(function(e) {
        var b = best[e.k];
        if (!b || (e.at || "") >= (b.at || "")) best[e.k] = e;
    });
    var back = 0;
    list.forEach(function(c) {
        var e = best[nameKey(c.key || c.name)];
        if (!e) return;
        if (!c.note && e.note) {
            c.note = e.note;
            c.at = c.at || e.at;
            back++;
        }
        if (!c.upd && e.upd) {
            c.upd = e.upd;
            c.at = c.at || e.at;
            back++;
        }
        if ((!c.tags || !Object.keys(c.tags).length) && e.tags && Object.keys(e.tags).length) {
            c.tags = e.tags;
            back++;
        }
        if ((c.stage === "new" || !c.stage) && e.stage && e.stage !== "new") {
            c.stage = e.stage;
            back++;
        }
        if (e.people && e.people.length && (!c.edited || e.people.length > (peopleOf(c) || []).length)) {
            c.people = e.people;
            c.edited = 1;
            c.last = !!e.last;
            back++;
        }
    });
    return back;
}

var CONTACT_TAB = "אנשי קשר";

var CALL_TAB = "יומן שיחות";

var YSH_TAB = "מצב ישיבות";

var YADD_TAB = "הוספות יומן";

var callSync = {
    state: "",
    at: 0
};

var legacyReadsPending = {};

function scriptGet(params) {
    if (params && (params.fire === "say" || params.fire === "digest") && apiOld()) {
        return Promise.resolve({
            status: "denied",
            message: UI.apiOld || ""
        });
    }
    var url = (CFG.api || API || "").trim();
    if (!url) return Promise.reject(new Error("אין כתובת שרת"));
    var readKeys = [ "board", "key", "k", "test", "read", "whoIs", "first", "last", "role", "idFor", "amdaFor", "codes", "team" ];
    var names = Object.keys(params).sort();
    if (url === APPS_SCRIPT_URL && (!params.team || params.key) && names.every(function(k) { return readKeys.indexOf(k) >= 0; }) &&
        [ "board", "read", "whoIs", "idFor", "amdaFor", "codes", "team" ].some(function(k) { return params[k]; })) {
        var payload = {};
        names.forEach(function(k) { payload[k] = String(params[k]); });
        var token = JSON.stringify(payload);
        if (!legacyReadsPending[token]) {
            legacyReadsPending[token] = fetch("/api/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
                body: JSON.stringify({ operation: "read", payload: payload })
            }).then(function(response) {
                if (!response.ok) throw new Error("Private read failed");
                return response.json();
            }).then(function(result) {
                delete legacyReadsPending[token];
                return result;
            }, function(error) {
                delete legacyReadsPending[token];
                throw error;
            });
        }
        return legacyReadsPending[token].then(function(result) { return JSON.parse(JSON.stringify(result)); });
    }
    var q = Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    return pingScript(url + (url.indexOf("?") < 0 ? "?" : "&") + q);
}

function callSay(s) {
    callSync.state = s;
    callSync.at = Date.now();
    var el = document.getElementById("call-sync");
    if (el) el.textContent = s;
}

function nameKey(s) {
    return String(s || "").replace(/["'״׳]/g, "").replace(/\s+/g, " ").trim();
}

function subsByInst() {
    var m = {}, l = Store.get("pushCache", []) || [];
    l.forEach(function(p) {
        if (!p.sub) return;
        var key = p.code;
        if (!key && p.inst) {
            var i = instByName(p.inst);
            key = i ? i.code : "";
        }
        if (!key) return;
        (m[key] = m[key] || []).push(p);
    });
    return m;
}

function subsOf(c, map) {
    var i = instByName(c.key || c.name);
    return i && map[i.code] || [];
}

function regByInst() {
    var m = {}, l = Store.get("registrations", []) || [];
    l.forEach(function(r) {
        if (r.code) m[r.code] = r;
    });
    return m;
}

function regOf(c, map) {
    var i = instByName(c.key || c.name);
    return i ? map[i.code] || null : null;
}

function pullCalls() {
    callSay("טוען מהגיליון…");
    var ss = (CFG.contactsSheet || "").trim();
    var key = (CFG.readKey || "").trim();
    var ask = function(tab) {
        var p = {
            read: tab
        };
        if (ss) p.ss = ss;
        if (key) p.key = key;
        return scriptGet(p).then(function(d) {
            return d && d.status === "ok" && d.rows ? d.rows : null;
        }).catch(function() {
            return null;
        });
    };
    return Promise.all([ ask(CONTACT_TAB), ask(CALL_TAB), ask(YSH_TAB), ask(YADD_TAB) ]).then(function(r) {
        var people = r[0], log = r[1];
        yshStore(r[2], r[3]);
        if (!people || people.length < 2) {
            callSay('לא נמצאה לשונית "' + CONTACT_TAB + '".');
            return false;
        }
        var hasPhone = people[0].some(function(v) {
            return isPhone(String(v || "").trim());
        });
        var head = hasPhone ? [] : people[0];
        var body = hasPhone ? people : people.slice(1);
        var out = [];
        body.forEach(function(row) {
            var c = rowToContact(row, head);
            if (c) out.push(c);
        });
        if (!out.length) {
            callSay("הלשונית ריקה.");
            return false;
        }
        var was = {};
        (log || []).slice(1).forEach(function(r2) {
            if (!r2[0]) return;
            var tg = {};
            try {
                tg = JSON.parse(r2[7] || "") || {};
            } catch (e0) {
                tg = {};
            }
            if (!Object.keys(tg).length && YES.test(String(r2[6] || "").trim())) tg = {
                called: true
            };
            var tm = null;
            try {
                tm = JSON.parse(r2[9] || "") || null;
            } catch (e1) {
                tm = null;
            }
            was[nameKey(r2[0])] = {
                stage: r2[1] || "new",
                note: r2[2] || "",
                at: r2[3] || "",
                who: r2[4] || "",
                ed: r2[5] || "",
                tags: tg,
                upd: r2[8] || "",
                teamShow: !!(tm && tm.show),
                teamPeople: tm && tm.people || null
            };
        });
        var mine = {};
        contacts().forEach(function(c) {
            mine[nameKey(c.key || c.name)] = c;
        });
        out.forEach(function(c) {
            var k = nameKey(c.key || c.name), s = was[k], m = mine[k];
            if (s) {
                c.stage = s.stage;
                c.note = s.note;
                c.at = s.at;
                c.tags = s.tags;
                c.upd = s.upd;
                c.teamShow = s.teamShow;
                if (s.teamPeople) c.teamPeople = s.teamPeople;
                if (s.ed) {
                    try {
                        var e = JSON.parse(s.ed);
                        if (e.name) c.name = e.name;
                        if (e.people && e.people.length) c.people = e.people;
                        c.last = !!e.last;
                        c.edited = 1;
                    } catch (err) {}
                }
                if (s.who) {
                    var at = peopleOf(c).map(function(q) {
                        return nameKey(q.name);
                    }).indexOf(nameKey(s.who));
                    if (at >= 0) c.primary = at;
                }
            }
            if (m && m.at && (!c.at || m.at > c.at)) {
                c.stage = m.stage;
                c.note = m.note;
                c.at = m.at;
                c.tags = m.tags || {};
                c.upd = m.upd || "";
                if (m.teamShow != null) c.teamShow = m.teamShow;
                if (m.teamPeople) c.teamPeople = m.teamPeople;
                if (m.primary != null) c.primary = m.primary;
            }
            if (m && m.edited && !(s && s.ed)) {
                c.people = peopleOf(m);
                c.name = m.name || c.name;
                c.last = !!m.last;
                c.edited = 1;
                if (m.primary != null) c.primary = m.primary;
            }
            if (!c.tags) c.tags = {};
        });
        var inSheet = {};
        out.forEach(function(c) {
            inSheet[nameKey(c.key || c.name)] = 1;
        });
        contacts().forEach(function(c) {
            if (!inSheet[nameKey(c.key || c.name)]) out.push(c);
        });
        var back = jnlRestore(out);
        saveContacts(out);
        var withP = out.filter(function(c) {
            return peopleOf(c).some(function(q) {
                return q.phone;
            });
        }).length;
        callSay(out.length + " ישיבות · " + withP + " עם טלפון · מסונכרן" + (back ? " · " + back + " שוחזרו מהיומן" : ""));
        return true;
    });
}
