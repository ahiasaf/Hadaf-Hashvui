function ctPaint(el, h) {
    var wasOpen = {};
    Array.prototype.forEach.call(el.querySelectorAll(".ct[data-ci] details[open]"), function(d) {
        wasOpen[d.parentNode.getAttribute("data-ci") + "|" + d.getAttribute("data-k")] = 1;
    });
    el.innerHTML = h;
    Array.prototype.forEach.call(el.querySelectorAll(".ct[data-ci] details"), function(d) {
        if (wasOpen[d.parentNode.getAttribute("data-ci") + "|" + d.getAttribute("data-k")]) d.open = true;
    });
    var ta = el.querySelectorAll(".ct textarea");
    for (var z = 0; z < ta.length; z++) noteGrow(ta[z]);
}

function ctCard(c, i, ctx) {
    var h = "", regs = ctx.regs, subs = ctx.subs, jLast = ctx.jLast;
    var ps = peopleOf(c), me = mainOf(c), pi = Math.min(c.primary || 0, ps.length - 1);
    var reg = regOf(c, regs), who = subsOf(c, subs);
    var stg = STAGES.filter(function(x) {
        return x.k === c.stage;
    })[0] || STAGES[0];
    var la = jLast[nameKey(c.key || c.name)];
    var laT = la ? Date.parse(la) : 0;
    h += '<div class="ct s-' + c.stage + (tagOn(c, "called") ? " done" : "") + '" data-ci="' + i + '"><div class="h"><div style="min-width:0">' + '<div class="nm">' + esc(c.name) + "</div>" + (me && me.name ? '<div class="ct-who">' + esc(me.name) + (me.role ? " · " + esc(me.role) : "") + "</div>" : "") + '</div><div style="display:flex;gap:6px;align-items:center">' + (c.last ? '<span class="last">תשפ"ו</span>' : "") + (reg ? '<span class="signed" title="נרשם דרך האפליקציה">⚑ נרשם</span>' : "") + (who.length ? '<span class="signed inst" title="התקינו את האפליקציה">◉ ' + who.length + "</span>" : "") + '<button class="edit" onclick="editContact(' + i + ')" title="עריכה">✎</button>' + "</div></div>";
    h += '<div class="ct-st"><b class="ct-sb ' + stg.c + '">' + esc(stg.t) + "</b>" + " · " + esc(laT ? UI.callLast.replace("{t}", whenTxt(laT)) : UI.callNever) + (reg && reg.total ? " · " + esc(UI.callOrd.replace("{n}", reg.total)) : "") + "</div>";
    var blOn = blastOn(), blKey = blastKey(c, me);
    var blDone = !!blastLog()[blKey];
    var blTxt = blOn && me ? "?text=" + encodeURIComponent(blastText(c, me)) : "";
    var dial = function(name, ph, faint) {
        var live = blOn && !faint;
        return '<div class="acts"' + (faint ? ' style="margin-top:8px"' : "") + ">" + '<a class="call"' + (faint ? ' style="opacity:.82"' : "") + ' href="tel:' + digits(ph) + '">📞 ' + esc(name) + "</a>" + '<a class="wa"' + (faint ? ' style="opacity:.82"' : "") + ' href="https://wa.me/' + waNum(ph) + (live ? blTxt : "") + '" target="_blank" rel="noopener"' + (live ? ' onclick="blastMark(this.getAttribute(\'data-bk\'))" data-bk="' + esc(blKey) + '"' : "") + ">" + (live ? blDone ? "✓ נשלחה" : "שליחת ההודעה" : "וואטסאפ") + "</a></div>";
    };
    h += '<div class="ct-nx"><label>' + esc(UI.callNext) + '<input class="updline" type="text" maxlength="160" ' + 'placeholder="' + esc(UI.callNextPh) + '" value="' + esc(c.upd || "") + '" onchange="setUpd(' + i + ',this.value)"></label>' + "<label>" + esc(UI.callDue) + '<input type="date" value="' + esc(c.tags && c.tags.__due || "") + '" onchange="callDue(' + i + ',this.value)"></label></div>';
    if (me && me.phone) {
        h += dial(me.name || "חייג", me.phone, false);
        if (me.phone2) h += dial((me.name || "") + " · נוסף", me.phone2, true);
    } else {
        h += '<div style="font-size:.83rem;color:var(--stop);font-weight:800;margin-top:10px">' + "אין מספר טלפון</div>";
    }
    h += '<div class="ct-row"><label class="ct-rd"><input type="checkbox"' + (tagOn(c, "called") ? " checked" : "") + ' onchange="tagTick(' + i + ",'called')\"> " + esc(UI.callRound) + "</label>" + '<select class="ct-sel" aria-label="סטטוס" onchange="setStage(' + i + ',this.value)">' + STAGES.map(function(x) {
        return '<option value="' + x.k + '"' + (x.k === c.stage ? " selected" : "") + ">" + esc(x.t) + "</option>";
    }).join("") + "</select></div>";
    var team = "";
    if (ps.length) {
        team += '<div class="whos">';
        ps.forEach(function(q, k) {
            team += '<div class="wprow"><button class="wp' + (k === pi ? " on" : "") + '" onclick="setMain(' + i + "," + k + ')">' + "<b>" + esc(q.name || "ללא שם") + "</b>" + (q.role ? "<i>" + esc(q.role) + "</i>" : "") + (q.phone ? "" : '<i style="color:var(--stop)">אין מספר</i>') + "</button>" + (q.phone ? '<label class="teamp"><input type="checkbox"' + (personTeamOn(c, k) ? " checked" : "") + ' onchange="setPersonTeam(' + i + "," + k + ',this.checked)">לצוות</label>' : "") + "</div>";
        });
        team += "</div>";
    }
    if (who.length) {
        team += '<div class="instd">התקינו: ' + who.map(function(q) {
            return esc(q.name || "ללא שם") + (q.role ? " <i>" + esc(q.role) + "</i>" : "");
        }).join(" · ") + "</div>";
    }
    if (team) h += '<div class="ct-d ct-o"><div class="ct-dh">' + esc(UI.callTeam) + "</div>" + team + "</div>";
    var tags = tagDefs().filter(function(t) {
        return t.k !== "called";
    });
    if (tags.length) {
        var tOn = tags.filter(function(t) {
            return tagOn(c, t.k);
        }).length;
        h += '<div class="ct-d ct-o"><div class="ct-dh">' + esc(UI.callTags) + (tOn ? " · " + tOn : "") + '</div><div class="chips">';
        tags.forEach(function(t) {
            h += '<button class="chip w tg' + (tagOn(c, t.k) ? " on" : "") + '" onclick="tagTick(' + i + ",'" + t.k + "')\">" + esc(t.t) + "</button>";
        });
        h += "</div></div>";
    }
    h += '<div class="ct-d ct-o"><div class="ct-dh">' + esc(UI.callNote) + "</div>" + '<label class="teamshow"><input type="checkbox"' + (c.teamShow ? " checked" : "") + ' onchange="setTeamShow(' + i + ',this.checked)">להציג את המוסד הזה בעמוד הצוות</label>' + '<div class="notelbl">הערה לעצמך - פרטי, לא נראה לאיש</div>' + '<textarea rows="3" placeholder="הערה מהשיחה…" ' + 'oninput="noteGrow(this)" ' + 'onchange="setNote(' + i + ',this.value)">' + esc(c.note) + "</textarea></div></div>";
    return h;
}

function callFilter(f) {
    state.filter = f;
    renderCalls();
}

function callFind(v) {
    state.find = v;
    renderCalls();
    var el = document.getElementById("call-find");
    if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
    }
}

function noteGrow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 260) + "px";
}

function importContacts() {
    var t = document.getElementById("paste").value;
    var parsed = parseContacts(t);
    if (!parsed.length) {
        alert("לא זוהו שורות. ודאו שהעתקתם מהגיליון.");
        return;
    }
    saveContacts(parsed);
    renderCalls();
    pushCalls(1);
}

function setStage(i, k) {
    var l = contacts();
    if (!l[i]) return;
    l[i].stage = k;
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    joinedFromStage(l[i]);
    renderCalls();
    pushCalls();
}

function joinedFromStage(c) {
    var inst = instByName(c.key || c.name);
    if (!inst) return;
    var j = CV("joined") || {}, want = c.stage === "joined";
    if (!!inst.joined === want) return;
    j[inst.code] = want;
    cfgSet("joined", j);
    renderHome();
}

var EDIT_AT = -1;

function editContact(i) {
    var l = contacts(), c = l[i];
    if (!c) return;
    EDIT_AT = i;
    var ps = peopleOf(c);
    var box = document.getElementById("cedit") || document.body.appendChild(Object.assign(document.createElement("div"), {
        id: "cedit"
    }));
    box.innerHTML = '<div class="sh"><div class="hd"><b>עריכת כרטיס</b>' + '<button onclick="editClose()">סגירה</button></div>' + '<div class="fld"><div class="label">שם הישיבה</div>' + '<input id="ce-name" type="text" value="' + esc(c.name) + '"></div>' + '<label class="ce-last"><input id="ce-last" type="checkbox"' + (c.last ? " checked" : "") + '> הייתה בתוכנית תשפ"ו</label>' + '<div class="label" style="margin-top:12px">אנשי קשר</div>' + '<div id="ce-people">' + ps.map(function(q, k) {
        return cePerson(q, k);
    }).join("") + "</div>" + '<button class="btn g" style="margin-top:6px" onclick="ceAdd()">＋ איש קשר</button>' + '<button class="btn p" style="margin-top:10px" onclick="editSave()">שמירה</button>' + "</div>";
    box.className = "on";
}

function cePerson(q, k) {
    return '<div class="ce-row" data-k="' + k + '">' + '<input class="ce-n" type="text" placeholder="שם" value="' + esc(q.name || "") + '">' + '<input class="ce-r" type="text" placeholder="תפקיד" value="' + esc(q.role || "") + '">' + '<input class="ce-p" type="tel" dir="ltr" placeholder="טלפון" value="' + esc(q.phone || "") + '">' + '<button class="ce-x" onclick="this.parentNode.remove()" title="הסרה">✕</button></div>';
}

function ceAdd() {
    var w = document.getElementById("ce-people");
    w.insertAdjacentHTML("beforeend", cePerson({}, w.children.length));
}

function editClose() {
    EDIT_AT = -1;
    var b = document.getElementById("cedit");
    if (b) b.className = "";
}

function editSave() {
    var l = contacts(), c = l[EDIT_AT];
    if (!c) {
        editClose();
        return;
    }
    var people = [];
    [].forEach.call(document.querySelectorAll("#ce-people .ce-row"), function(r) {
        var n = r.querySelector(".ce-n").value.trim();
        var ro = r.querySelector(".ce-r").value.trim();
        var ph = r.querySelector(".ce-p").value.trim();
        if (n || ph) people.push({
            name: n,
            role: ro,
            phone: ph,
            phone2: ""
        });
    });
    c.name = document.getElementById("ce-name").value.trim() || c.name;
    c.last = document.getElementById("ce-last").checked;
    c.people = people;
    c.primary = Math.min(c.primary || 0, Math.max(0, people.length - 1));
    c.edited = 1;
    c.at = (new Date).toISOString();
    jnl(c);
    saveContacts(l);
    editClose();
    renderCalls();
    pushCalls(1);
    contactBack(c);
}

function contactBack(c) {
    var key = (CFG.readKey || "").trim();
    if (!c || !key) return Promise.resolve(false);
    var ppl = peopleOf(c).map(function(q) {
        return {
            name: q.name || "",
            phone: q.phone || "",
            phone2: q.phone2 || ""
        };
    });
    return scriptGet({
        contactSave: JSON.stringify({
            name: c.key || c.name,
            people: ppl,
            last: !!c.last
        }),
        key: key
    }).then(function(d) {
        if (d && d.saved) {
            callSay(UI.callCSaved);
            return true;
        }
        callSay(d && d.status && d.status !== "ok" ? fill(UI.callCFail, {
            t: d.message || d.status
        }) : UI.callCOld);
        return false;
    }).catch(function(e) {
        callSay(fill(UI.callCFail, {
            t: String(e && e.message || e)
        }));
        return false;
    });
}

function tagEditOpen() {
    var box = document.getElementById("tagedit") || document.body.appendChild(Object.assign(document.createElement("div"), {
        id: "tagedit"
    }));
    box.innerHTML = '<div class="sh"><div class="hd"><b>ניהול תגיות</b>' + '<button onclick="tagEditClose()">סגירה</button></div>' + '<div class="sub">"לצוות" - התגית הזו תופיע גם בעמוד הצוות, לכל מוסד ' + "שמסומן להצגה שם. מחיקת תגית כאן לא מוחקת מה שכבר סומן בכרטיסים.</div>" + '<div id="tg-rows" style="margin-top:12px">' + tagDefs().map(tgRow).join("") + "</div>" + '<button class="btn g" style="margin-top:6px" onclick="tagAddRow()">＋ תגית חדשה</button>' + '<button class="btn p" style="margin-top:10px" onclick="tagEditSave()">שמירה</button>' + "</div>";
    box.className = "on";
}

function tgRow(t, k) {
    return '<div class="ce-row tg-row" data-k="' + esc(t.k) + '"' + (t.tmp ? ' data-tmp="1"' : "") + (t.opts ? ' data-opts="' + esc(JSON.stringify(t.opts)) + '"' : "") + ">" + '<input class="tg-t" type="text" value="' + esc(t.t) + '">' + '<label class="tg-team"><input type="checkbox" class="tg-team-c"' + (t.team ? " checked" : "") + ">לצוות</label>" + '<button class="ce-x" onclick="this.parentNode.remove()" title="מחיקה">✕</button></div>';
}

function tagAddRow() {
    var name = prompt("שם התגית החדשה:");
    if (!name || !name.trim()) return;
    document.getElementById("tg-rows").insertAdjacentHTML("beforeend", tgRow({
        k: "",
        t: name.trim(),
        team: false
    }));
}

function tagKeyOf_(t) {
    return "tag_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function tagEditSave() {
    var defs = [];
    [].forEach.call(document.querySelectorAll("#tg-rows .tg-row"), function(row) {
        var t = row.querySelector(".tg-t").value.trim();
        if (!t) return;
        var k = row.getAttribute("data-k") || tagKeyOf_();
        var op = null;
        try {
            op = row.getAttribute("data-opts") ? JSON.parse(row.getAttribute("data-opts")) : null;
        } catch (oe) {
            op = null;
        }
        defs.push({
            k: k,
            t: t,
            team: row.querySelector(".tg-team-c").checked,
            tmp: row.getAttribute("data-tmp") === "1",
            opts: op || undefined
        });
    });
    saveTagDefs(defs);
    tagEditClose();
}

function tagEditClose() {
    var b = document.getElementById("tagedit");
    if (b) b.className = "";
}

function bulkImportOpen() {
    var box = document.getElementById("bimport") || document.body.appendChild(Object.assign(document.createElement("div"), {
        id: "bimport"
    }));
    box.innerHTML = '<div class="sh"><div class="hd"><b>ייבוא מרשימה</b>' + '<button onclick="bulkImportClose()">סגירה</button></div>' + '<div class="sub">מדביקים כאן טקסט מוכן (JSON) ולוחצים "ייבוא". מוסד קיים ' + "מתעדכן - אנשי קשר, תגיות ועדכון קצר; השלב וההערה הפרטית שלכם לא נמחקים.</div>" + '<textarea id="bimport-txt" placeholder="{&quot;contacts&quot;:[...]}"></textarea>' + '<button class="btn p" style="margin-top:10px" onclick="bulkImportRun()">ייבוא</button>' + '<div class="msg" id="bimport-msg"></div></div>';
    box.className = "on";
}
