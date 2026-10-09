var callTimer = null, callSeq = 0;

function anyTag_(c) {
    return !!(c.tags && Object.keys(c.tags).some(function(k) {
        return c.tags[k];
    }));
}

function pushCalls(now) {
    clearTimeout(callTimer);
    var go = function() {
        if (!API && !CFG.api) {
            callSay("נשמר על המכשיר · אין כתובת שרת");
            return;
        }
        var list = contacts();
        var rows = list.filter(function(c) {
            return c.stage !== "new" || c.note || c.primary || c.edited || anyTag_(c) || c.upd;
        }).map(function(c) {
            var me = mainOf(c);
            var ed = c.edited ? JSON.stringify({
                name: c.name,
                last: !!c.last,
                people: peopleOf(c)
            }) : "";
            return [ c.key || c.name, c.stage, c.note || "", c.at || "", me ? me.name : "", ed, tagOn(c, "called") ? "TRUE" : "", JSON.stringify(c.tags || {}), c.upd || "", JSON.stringify({
                show: !!c.teamShow,
                people: c.teamPeople || []
            }) ];
        });
        if (rows.length) {
            callSay("שולח…");
            var my = ++callSeq;
            callLogRead().then(function(sheet) {
                if (my === callSeq) callSend(callMergeRows(rows, list, sheet));
            });
        } else {
            callSay("אין מה לשמור - הגיליון לא נגע");
        }
        pushTeamView(list);
    };
    var callSend = function(rows) {
        fetch((CFG.api || API).trim(), {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "table",
                tab: CALL_TAB,
                key: (CFG.readKey || "").trim(),
                cols: JSON.stringify([ "ישיבה", "סטטוס", "הערה", "מתי", "איש קשר", "עריכה", "סבב", "תגיות", "עדכון", "צוות" ]),
                rows: JSON.stringify(rows)
            })
        }).then(function() {
            callSay(rows.length + " שיחות נשלחו · שמור גם במכשיר");
        }).catch(function() {
            callSay("נשמר על המכשיר · הגיליון לא נענה");
        });
    };
    now ? go() : callTimer = setTimeout(go, 1500);
}

function callLogRead() {
    var p = {
        read: CALL_TAB
    }, key = (CFG.readKey || "").trim();
    if (key) p.key = key;
    return scriptGet(p).then(function(d) {
        return d && d.status === "ok" && d.rows ? d.rows : null;
    }).catch(function() {
        return null;
    });
}

function tsOf(v) {
    var s = String(v || "").trim(), m;
    if (!s) return 0;
    if (/^\d{4}-\d\d-\d\d/.test(s)) {
        var t = Date.parse(s.length > 10 ? s.replace(" ", "T") : s);
        return isNaN(t) ? 0 : t;
    }
    m = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})(?:[ ,]+(\d{1,2}):(\d\d)(?::(\d\d))?)?/.exec(s);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
    return 0;
}

function callMergeRows(rows, list, sheet) {
    if (!sheet || sheet.length < 2) return rows;
    var W = 10, out = rows.slice(), at = {}, mine = {};
    out.forEach(function(r, n) {
        at[nameKey(r[0])] = n;
    });
    list.forEach(function(c) {
        mine[nameKey(c.key || c.name)] = c;
    });
    sheet.slice(1).forEach(function(r) {
        if (!r || !String(r[0] || "").trim()) return;
        var k = nameKey(r[0]), row = [];
        for (var x = 0; x < W; x++) row.push(r[x] == null ? "" : r[x]);
        var c = mine[k];
        if (!c) {
            if (at[k] == null) {
                at[k] = out.length;
                out.push(row);
            }
            return;
        }
        if (tsOf(r[3]) > tsOf(c.at)) {
            if (at[k] == null) {
                at[k] = out.length;
                out.push(row);
            } else out[at[k]] = row;
        }
    });
    return out;
}

function pushTeamView(list) {
    if (!API && !CFG.api) return;
    var defs = tagDefs().filter(function(t) {
        return t.team;
    });
    var rows = list.filter(function(c) {
        return c.teamShow;
    }).map(function(c) {
        var ps = peopleOf(c);
        var idx = c.teamPeople || [ c.primary || 0 ];
        var people = idx.map(function(k) {
            return ps[k];
        }).filter(function(q) {
            return q && q.phone;
        }).map(function(q) {
            return {
                name: q.name,
                phone: q.phone
            };
        });
        var tg = defs.filter(function(t) {
            return tagOn(c, t.k);
        }).map(function(t) {
            return t.t;
        });
        return [ c.name, c.upd || "", JSON.stringify(tg), JSON.stringify(people) ];
    });
    fetch((CFG.api || API).trim(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: "תצוגת צוות",
            key: (CFG.readKey || "").trim(),
            ss: (CFG.contactsSheet || "").trim() || undefined,
            cols: JSON.stringify([ "ישיבה", "עדכון", "תגיות", "אנשי קשר" ]),
            rows: JSON.stringify(rows)
        })
    }).catch(function() {});
}

function pushTagDefs() {
    if (!API && !CFG.api) return;
    var rows = tagDefs().map(function(t) {
        return [ t.k, t.t, t.team ? "TRUE" : "", t.tmp ? "TRUE" : "", t.opts && t.opts.length ? JSON.stringify(t.opts) : "" ];
    });
    fetch((CFG.api || API).trim(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: "הגדרות תגיות",
            key: (CFG.readKey || "").trim(),
            ss: (CFG.contactsSheet || "").trim() || undefined,
            cols: JSON.stringify([ "מפתח", "תווית", "לצוות", "זמני", "אפשרויות" ]),
            rows: JSON.stringify(rows)
        })
    }).catch(function() {});
}

function pullTagDefs() {
    var ss = (CFG.contactsSheet || "").trim();
    var p = {
        read: "הגדרות תגיות"
    };
    if (ss) p.ss = ss;
    var key = (CFG.readKey || "").trim();
    if (key) p.key = key;
    return scriptGet(p).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows || d.rows.length < 2) return false;
        var out = [];
        d.rows.slice(1).forEach(function(r) {
            if (!r[0]) return;
            var op = null;
            try {
                op = r[4] ? JSON.parse(r[4]) : null;
            } catch (oe) {
                op = null;
            }
            out.push({
                k: r[0],
                t: r[1] || r[0],
                team: YES.test(String(r[2] || "").trim()),
                tmp: YES.test(String(r[3] || "").trim()),
                opts: op && op.length ? op : undefined
            });
        });
        if (out.length) saveTagDefsLocal(out);
        return true;
    }).catch(function() {
        return false;
    });
}

function saveTagDefs(d) {
    saveTagDefsLocal(d);
    pushTagDefs();
    renderCalls();
}

function teamUrl() {
    var base = location.href.split("#")[0].split("?")[0].replace(/(index\.html)?$/, "").replace(/\/admin\/?$/, "/");
    return base + "team.html" + (CFG.teamKey ? "?k=" + encodeURIComponent(CFG.teamKey) : "");
}

function pullTeamLog() {
    var ss = (CFG.contactsSheet || "").trim();
    var p = {
        read: "פעולות צוות"
    };
    if (ss) p.ss = ss;
    var key = (CFG.readKey || "").trim();
    if (key) p.key = key;
    return scriptGet(p).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows || d.rows.length < 2) return false;
        Store.set("teamLogCache", d.rows.slice(1).slice(-12).reverse());
        return true;
    }).catch(function() {
        return false;
    });
}

function teamLogCard() {
    var rows = Store.get("teamLogCache", []) || [];
    if (!rows.length) return "";
    var lines = rows.map(function(r) {
        return '<div class="tlog-row"><b>' + esc(r[1] || "") + "</b> " + esc(r[3] || "פעל") + " → " + esc(r[2] || "") + '<span class="tlog-at">' + esc(String(r[0] || "").slice(0, 16)) + "</span></div>";
    }).join("");
    return '<div class="card" style="margin:10px 0 0;padding:14px 15px">' + '<b>מה הצוות עשה</b><div class="sub" style="margin-top:6px">' + lines + "</div></div>";
}

function teamLinkCopy() {
    if (!CFG.teamKey) {
        alert('קודם למלא "סיסמת עמוד הצוות" בהגדרות המערכת - ואת אותה מחרוזת ' + "גם ב-Apps Script, בשורת TEAM_KEY. ניהול ← הגדרות ← מערכת.");
        return;
    }
    copyText(teamUrl(), "הקישור הועתק. שולחים אותו פעם אחת לרב פלתי ולאלחנן.");
}

var MARK = /^(TRUE|כן|כ|יש|V|✓|✔|✅|√|●|•|\+)$/i;

function isPhone(c) {
    return /^[+(]?[\d][\d\-\+\(\)\s./]{7,}$/.test(c) && String(c).replace(/\D/g, "").length >= 9;
}

var INST_SKIP = /^(יב|יבע|ישיבת|ישיבה|בני|עקיבא|תיכונית|חטיבת|חטיבה|ע|ה)$/;

function instWords(s) {
    return String(s || "").replace(/[^א-ת\s]/g, " ").split(/\s+/).filter(function(w) {
        return w && !INST_SKIP.test(w);
    });
}

var PERSON = /^(הרב|רב|הרה"ג|הרה״ג|ר'|ר׳|מר|הגאון)\s/;

function instByName(s) {
    var k = nameKey(s);
    if (!k || PERSON.test(String(s).trim())) return null;
    var hit = INSTITUTIONS.filter(function(i) {
        return nameKey(i.name) === k;
    })[0];
    if (hit) return hit;
    var mine = instWords(s);
    if (!mine.length) return null;
    var best = null, bestN = 0, tie = 0;
    INSTITUTIONS.forEach(function(i) {
        var his = instWords(i.name);
        var n = mine.filter(function(w) {
            return his.indexOf(w) >= 0;
        }).length;
        if (!n) return;
        if (n > bestN) {
            bestN = n;
            best = i;
            tie = 1;
        } else if (n === bestN) tie++;
    });
    return bestN && tie === 1 ? best : null;
}

function rowToContact(row, head) {
    head = head || [];
    var inst = null, name = "", people = [], phones = [], flag = false, cur = null;
    (row || []).forEach(function(v, i) {
        var c = String(v == null ? "" : v).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").replace(/^'/, "").trim();
        if (MARK.test(c)) {
            flag = true;
            return;
        }
        if (/^(FALSE|לא|-|-|X)$/i.test(c) || !c) return;
        if (isPhone(c)) {
            phones.push({
                v: c,
                at: cur
            });
            return;
        }
        if (!inst) {
            var hit = instByName(c);
            if (hit) {
                inst = hit;
                name = c;
                cur = null;
                return;
            }
        }
        cur = {
            name: c,
            role: String(head[i] || "").trim(),
            phone: "",
            phone2: ""
        };
        people.push(cur);
    });
    if (!inst && !people.length) return null;
    if (!inst && people.length) {
        name = people[0].name;
        people = people.slice(1);
    }
    if (!people.length) people.push({
        name: name,
        role: "",
        phone: "",
        phone2: ""
    });
    if (phones.length === people.length) {
        people.forEach(function(q, k) {
            q.phone = phones[k].v;
        });
    } else {
        phones.forEach(function(ph) {
            var t = ph.at || people.filter(function(q) {
                return !q.phone;
            })[0] || people[0];
            if (!t.phone) t.phone = ph.v; else if (!t.phone2) t.phone2 = ph.v; else {
                var free = people.filter(function(q) {
                    return !q.phone;
                })[0];
                if (free) free.phone = ph.v;
            }
        });
    }
    var pri = 0;
    for (var j = 0; j < people.length; j++) if (people[j].phone) {
        pri = j;
        break;
    }
    return {
        name: name,
        key: name,
        code: inst ? inst.code : "",
        people: people,
        primary: pri,
        last: inst ? !!inst.last : flag,
        stage: "new",
        note: "",
        at: ""
    };
}

function peopleOf(c) {
    if (c.people && c.people.length) return c.people;
    var out = [];
    String(c.who || "").split(" · ").filter(Boolean).forEach(function(n) {
        out.push({
            name: n,
            role: "",
            phone: "",
            phone2: ""
        });
    });
    if (!out.length) out.push({
        name: c.name,
        role: "",
        phone: "",
        phone2: ""
    });
    out[0].phone = c.phone || "";
    out[0].phone2 = c.phone2 || "";
    return out;
}

function mainOf(c) {
    var ps = peopleOf(c);
    return ps[Math.min(c.primary || 0, ps.length - 1)] || ps[0];
}

function digits(p) {
    return String(p || "").replace(/[^0-9]/g, "");
}

function waNum(p) {
    var d = digits(p);
    if (d.indexOf("972") === 0) return d;
    return "972" + d.replace(/^0/, "");
}

function parseContacts(text) {
    var out = [], head = null;
    String(text).split(/\r?\n/).forEach(function(line) {
        if (!line.trim()) return;
        var cells = line.split("\t");
        if (cells.length < 2) cells = line.split(/\s{2,}|,/);
        if (!head && !cells.some(function(c) {
            return /^[0-9\-\+\(\)\s]{9,}$/.test(c.trim());
        })) {
            head = cells;
            return;
        }
        var c = rowToContact(cells, head);
        if (c) out.push(c);
    });
    return out;
}

function blastOn() {
    return Store.get("blastOn", false) === true;
}

function blastSetOn(v) {
    Store.set("blastOn", !!v);
    renderCalls();
}

function blastLog() {
    return Store.get("blastLog", {}) || {};
}

function blastKey(c, q) {
    return (c.name || "") + "|" + (q && q.name || "");
}

function blastMark(key) {
    var l = blastLog();
    if (l[key]) delete l[key]; else l[key] = (new Date).toISOString();
    Store.set("blastLog", l);
    setTimeout(renderCalls, 0);
}
