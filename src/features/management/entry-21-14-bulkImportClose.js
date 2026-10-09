function bulkImportClose() {
    var b = document.getElementById("bimport");
    if (b) b.className = "";
}

function bulkImportRun() {
    var msg = document.getElementById("bimport-msg");
    var data;
    try {
        data = JSON.parse(document.getElementById("bimport-txt").value);
    } catch (e) {
        msg.textContent = "JSON לא תקין: " + e.message;
        return;
    }
    var items = Array.isArray(data) ? data : data.contacts;
    if (!items || !items.length) {
        msg.textContent = "לא נמצאו מוסדות בטקסט שהודבק.";
        return;
    }
    var defs = tagDefs().slice(), have = {};
    defs.forEach(function(d) {
        have[d.k] = 1;
    });
    (data.tags || []).forEach(function(t) {
        if (!have[t.k]) {
            defs.push({
                k: t.k,
                t: t.t || t.k,
                team: !!t.team
            });
            have[t.k] = 1;
        }
    });
    items.forEach(function(it) {
        Object.keys(it.tags || {}).forEach(function(k) {
            if (!have[k]) {
                defs.push({
                    k: k,
                    t: k,
                    team: true
                });
                have[k] = 1;
            }
        });
    });
    saveTagDefsLocal(defs);
    var list = contacts(), byKey = {};
    list.forEach(function(c, i) {
        byKey[nameKey(c.key || c.name)] = i;
    });
    var created = 0, updated = 0;
    items.forEach(function(it) {
        var name = (it.name || it.key || "").trim();
        if (!name) return;
        var k = nameKey(it.key || name), at = byKey[k];
        var c = at != null ? list[at] : null;
        if (!c) {
            c = {
                name: name,
                key: it.key || name,
                stage: "new",
                note: "",
                tags: {}
            };
            list.push(c);
            byKey[k] = list.length - 1;
            created++;
        } else updated++;
        if (it.people && it.people.length) {
            var have = peopleOf(c).map(function(q) {
                return q;
            });
            var byName = {};
            have.forEach(function(q) {
                byName[nameKey(q.name)] = q;
            });
            c.people = it.people.map(function(p) {
                var old = byName[nameKey(p.name)];
                return old ? {
                    name: p.name,
                    role: p.role || old.role,
                    phone: old.phone || "",
                    phone2: old.phone2 || ""
                } : {
                    name: p.name,
                    role: p.role || "",
                    phone: "",
                    phone2: ""
                };
            });
            c.edited = 1;
        }
        if (it.primary != null) c.primary = it.primary;
        if (!c.tags) c.tags = {};
        Object.keys(it.tags || {}).forEach(function(tk) {
            c.tags[tk] = it.tags[tk];
        });
        if (it.upd) c.upd = it.upd;
        c.at = (new Date).toISOString();
        jnl(c);
    });
    saveContacts(list);
    bulkImportClose();
    renderCalls();
    pushCalls(1);
    pushTagDefs();
    alert("יובאו " + items.length + " מוסדות (" + created + " חדשים, " + updated + " עודכנו). שולח לגיליון…");
}

function setMain(i, k) {
    var l = contacts();
    if (!l[i]) return;
    l[i].primary = k;
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    renderCalls();
    pushCalls();
}

function tagOn(c, k) {
    return !!(c.tags && c.tags[k]);
}

function tagTick(i, k) {
    var l = contacts();
    if (!l[i]) return;
    if (!l[i].tags) l[i].tags = {};
    l[i].tags[k] = !l[i].tags[k];
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    renderCalls();
    pushCalls();
}

function roundReset() {
    var l = contacts();
    var n = l.filter(function(c) {
        return tagOn(c, "called");
    }).length;
    if (!n) return;
    if (!confirm("להתחיל סבב חדש? " + n + " הסימונים יימחקו.\n" + "השלבים, ההערות והתיעוד נשארים.")) return;
    l.forEach(function(c) {
        if (c.tags) delete c.tags.called;
    });
    saveContacts(l);
    renderCalls();
    pushCalls(1);
}

function personTeamOn(c, k) {
    if (c.teamPeople) return c.teamPeople.indexOf(k) >= 0;
    return k === (c.primary || 0);
}

function setPersonTeam(i, k, v) {
    var l = contacts(), c = l[i];
    if (!c) return;
    var arr = (c.teamPeople || [ c.primary || 0 ]).slice(), at = arr.indexOf(k);
    if (v && at < 0) arr.push(k);
    if (!v && at >= 0) arr.splice(at, 1);
    c.teamPeople = arr;
    c.at = (new Date).toISOString();
    saveContacts(l);
    pushCalls();
}

function setTeamShow(i, v) {
    var l = contacts();
    if (!l[i]) return;
    l[i].teamShow = !!v;
    l[i].at = (new Date).toISOString();
    saveContacts(l);
    renderCalls();
    pushCalls();
}

function setUpd(i, v) {
    var l = contacts();
    if (!l[i]) return;
    l[i].upd = v;
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    pushCalls();
}

function setNote(i, v) {
    var l = contacts();
    if (!l[i]) return;
    l[i].note = v;
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    pushCalls();
}

function jnlShow() {
    var j = Store.get("callJournal", []) || [];
    if (!j.length) {
        alert("היומן ריק.");
        return;
    }
    var best = {};
    j.forEach(function(e) {
        var b = best[e.k];
        if (!b || (e.at || "") >= (b.at || "")) best[e.k] = e;
    });
    var lines = [];
    for (var k in best) {
        var e = best[k];
        if (!e.note && e.stage === "new") continue;
        lines.push("• " + (e.name || e.k) + (e.stage && e.stage !== "new" ? " [" + e.stage + "]" : "") + (e.note ? " - " + e.note : "") + (e.at ? "  (" + e.at.slice(0, 10) + ")" : ""));
    }
    var txt = "יומן התיעוד · " + lines.length + " רשומות\n\n" + lines.join("\n");
    copyText(txt, "היומן הועתק. הוא נשמר גם במכשיר ואינו נמחק.");
}

function copyText(txt, okMsg) {
    var done = function() {
        alert(okMsg);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(function() {
            legacyCopy(txt, done);
        });
    } else legacyCopy(txt, done);
}

function wipeContacts() {
    if (!confirm('למחוק את הרשימה מהמכשיר הזה?\n\nהגיליון אינו נמחק - לשונית "' + CALL_TAB + '" נשארת, ורענון מהגיליון יחזיר הכל.\n\n' + "יומן התיעוד אינו נמחק.")) return;
    localStorage.removeItem("dfContacts");
    callSay("");
    renderCalls();
}

var Store = {
    engine: "local",
    get: function(k, d) {
        try {
            var v = localStorage.getItem("df:" + k);
            return v === null ? d === undefined ? null : d : JSON.parse(v);
        } catch (e) {
            return d === undefined ? null : d;
        }
    },
    set: function(k, v) {
        try {
            localStorage.setItem("df:" + k, JSON.stringify(v));
        } catch (e) {}
        if (this.push) this.push(k, v);
    },
    del: function(k) {
        try {
            localStorage.removeItem("df:" + k);
        } catch (e) {}
    }
};

var CFG = Store.get("cfg", {}) || {};

var PUB_CFG = Store.get("cfgCache", {}) || {};

var PUB_KEYS = [ "rows", "joined", "roster", "sugya", "prices", "coordWa", "raffle", "tourOn", "tourAt", "sizeOn", "netTicker", "orderBy", "joinLink", "weekRaffle", "roleAsk", "waGroup" ];

var PUB_DEEP = {
    rows: 1,
    joined: 1,
    sugya: 1,
    prices: 1
};

var CODE_CFG = {
    sugya: JSON.parse(JSON.stringify(SUGYA)),
    prices: JSON.parse(JSON.stringify(PRICES)),
    coordWa: COORD_WA,
    joined: function() {
        var o = {};
        INSTITUTIONS.forEach(function(i) {
            o[i.code] = !!i.joined;
        });
        return o;
    }()
};

function jsonEq(a, b) {
    var norm = function(v) {
        if (v === undefined) return null;
        if (!v || typeof v !== "object") return v;
        if (v.length !== undefined) return v.map(norm);
        var o = {}, ks = Object.keys(v).sort();
        ks.forEach(function(k) {
            if (v[k] !== undefined) o[k] = norm(v[k]);
        });
        return o;
    };
    return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

function cfgPrune() {
    var ch = false;
    PUB_KEYS.forEach(function(k) {
        if (CFG[k] == null) return;
        var pub = PUB_CFG[k], loc = CFG[k];
        if (PUB_DEEP[k] && pub && typeof loc === "object" && typeof pub === "object") {
            var left = 0, a;
            for (a in loc) {
                if (!loc.hasOwnProperty(a)) continue;
                if (jsonEq(loc[a], pub[a])) {
                    delete loc[a];
                    ch = true;
                } else left++;
            }
            if (!left) {
                delete CFG[k];
                ch = true;
            }
        } else if (jsonEq(loc, pub)) {
            delete CFG[k];
            ch = true;
        }
    });
    if (ch) Store.set("cfg", CFG);
    return ch;
}

function CV(k) {
    var pub = PUB_CFG[k], loc = CFG[k];
    if (!PUB_DEEP[k]) return loc != null ? loc : pub;
    if (pub == null && loc == null) return null;
    var out = {}, a;
    if (pub) for (a in pub) out[a] = pub[a];
    if (loc) for (a in loc) out[a] = loc[a];
    return out;
}

function cfgDirty() {
    for (var i = 0; i < PUB_KEYS.length; i++) {
        var k = PUB_KEYS[i];
        if (CFG[k] == null) continue;
        if (!jsonEq(CV(k), PUB_CFG[k] == null ? null : PUB_CFG[k])) return true;
    }
    return false;
}

function apiOld() {
    var a = String(CFG.api || "").trim(), c = String(APPS_SCRIPT_URL || "").trim();
    return !!(a && c && a !== c);
}

function apiReset() {
    CFG.api = "";
    Store.set("cfg", CFG);
    try {
        localStorage.removeItem("dfApi");
    } catch (e) {}
    API = APPS_SCRIPT_URL || "";
    admPane();
}

function cfgSet(k, v) {
    CFG[k] = v;
    Store.set("cfg", CFG);
    applyCfg();
    if (typeof admPubBar === "function") admPubBar();
}

function applyCfg() {
    if (CFG.api) {
        API = CFG.api;
        localStorage.setItem("dfApi", CFG.api);
    }
    if (CFG.pin) ADMIN_PIN = CFG.pin;
    var wa = CV("coordWa"), sg = CV("sugya"), jn = CV("joined"), pr = CV("prices");
    if (wa) COORD_WA = wa;
    if (sg) {
        for (var t in sg) {
            var dp = SUGYA[t] && SUGYA[t].pages || {}, sp = sg[t] && sg[t].pages;
            if (sp) for (var pk in dp) if (/:$/.test(pk) && sp[pk] == null) sp[pk] = dp[pk];
            SUGYA[t] = sg[t];
        }
    }
    if (jn) INSTITUTIONS.forEach(function(i) {
        if (jn[i.code] != null) i.joined = !!jn[i.code];
    });
    if (pr) for (var p in pr) {
        PRICES[p] = PRICES[p] || {};
        for (var f in pr[p]) if (pr[p][f] != null) PRICES[p][f] = pr[p][f];
    }
    relayerTexts();
}

function textGet(k) {
    return TX.get(k);
}

function textSet(k, v) {
    TX.set(k, v);
}

var PUBLISHED = Store.get("textCache", null) || {};

function belowText(k) {
    return TX.below(PUBLISHED, k);
}

function relayerTexts() {
    TX.layer(PUBLISHED, CFG.texts);
}

function fill(tpl, vars) {
    return String(tpl).replace(/\{(\w+)\}/g, function(m, k) {
        return vars[k] != null ? vars[k] : m;
    });
}

applyCfg();

function priceOf(id) {
    var p = PRICES[id] || {
        price: SFARIM_PRICE.group,
        list: SFARIM_PRICE.normal
    };
    return {
        price: p.price,
        list: p.list,
        off: p.list > p.price,
        min: p.min || 0
    };
}

function condNote(name, min) {
    if (!min) return "";
    return '<div class="cond">' + fill(UI.cond, {
        n: min,
        name: esc(name)
    }) + "</div>";
}

function uniformPrice() {
    var a = SFARIM.map(function(s) {
        return priceOf(s.id);
    });
    return a.every(function(p) {
        return p.off && p.price === a[0].price;
    }) ? a[0] : null;
}

function priceRange() {
    var a = SFARIM.map(function(s) {
        return priceOf(s.id).price;
    });
    return {
        min: Math.min.apply(null, a),
        max: Math.max.apply(null, a)
    };
}

function shek(n) {
    return n.toLocaleString("he-IL") + " ₪";
}

function sheetUrl(id, tab) {
    return "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab) + "&t=" + Date.now();
}

function parseCsv(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') {
                f += '"';
                i++;
            } else if (c === '"') q = false; else f += c;
        } else if (c === '"') q = true; else if (c === ",") {
            row.push(f);
            f = "";
        } else if (c === "\n") {
            row.push(f);
            rows.push(row);
            row = [];
            f = "";
        } else if (c !== "\r") f += c;
    }
    if (f !== "" || row.length) {
        row.push(f);
        rows.push(row);
    }
    return rows.filter(function(r) {
        return r.join("").trim() !== "";
    });
}

function fetchSheet(id, tab) {
    if (!id || !navigator.onLine) return Promise.resolve(null);
    return fetch(sheetUrl(id, tab)).then(function(r) {
        return r.ok ? r.text() : null;
    }).then(function(t) {
        return t ? parseCsv(t) : null;
    }).catch(function() {
        return null;
    });
}

var YES = /^(TRUE|כן|V|✓|1)$/i;

var INST_BUILTIN = INSTITUTIONS.slice();

var INST_SRC = "code";

function instFromRows(rows) {
    if (!rows || rows.length < 2) return {
        ok: false,
        why: "הגיליון ריק"
    };
    var out = [], seen = {}, odd = 0;
    rows.slice(1).forEach(function(r) {
        var code = (r[0] || "").trim(), name = (r[1] || "").trim();
        if (!code || !name) return;
        if (seen[code]) {
            odd++;
            return;
        }
        seen[code] = 1;
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(code)) {
            odd++;
            return;
        }
        var mas = (r[4] || "").split(",").map(function(x) {
            return x.trim();
        }).filter(function(x) {
            return !!trackById(x);
        });
        var head = (r[5] || "").trim();
        out.push({
            code: code,
            name: name,
            last: YES.test((r[2] || "").trim()),
            joined: YES.test((r[3] || "").trim()),
            head: head || null,
            mas: mas.length ? mas : null
        });
    });
    if (!out.length) return {
        ok: false,
        why: "לא נמצאו מוסדות בלשונית"
    };
    if (odd > out.length) return {
        ok: false,
        why: "הלשונית אינה נראית כרשימת מוסדות"
    };
    return {
        ok: true,
        list: out
    };
}

function loadInstitutions() {
    return fetchSheet(CFG.sheetId || SHEET_ID, CFG.sheetTab || SHEET_TAB).then(function(rows) {
        var r = instFromRows(rows);
        if (!r.ok) {
            INST_SRC = "code:" + r.why;
            return false;
        }
        var was = {};
        INSTITUTIONS.forEach(function(i) {
            was[i.code] = i.head || null;
        });
        INSTITUTIONS.length = 0;
        r.list.forEach(function(i) {
            if (!i.head && was[i.code]) i.head = was[i.code];
            INSTITUTIONS.push(i);
        });
        INST_SRC = "sheet";
        applyCfg();
        Store.set("instCache", INSTITUTIONS);
        return true;
    }).catch(function() {
        INST_SRC = "code:הגיליון לא נענה";
        return false;
    });
}
