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
    el.innerHTML = (typeof LMe === "function" && LMe() ? '<div class="qback"><button onclick="qManual=false;quizWho()">→ חזרה</button>' + esc(UI.qManual) + "</div>" : "") + pkField("הישיבה שלי", qInstName, "בחרו ישיבה", "pickQuizInst()") + '<div class="fld"><label class="label" for="q-name">השם שלי</label>' + '<input type="text" id="q-name" placeholder="שם מלא" value="' + esc(myName) + '"></div>' + '<div class="fld"><label class="label" for="q-phone">טלפון - לשליחת הפרס</label>' + '<input type="tel" id="q-phone" placeholder="05X-XXXXXXX" value="' + esc(myPhone()) + '"></div>';
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
        /* רק השדות מצוירים מחדש: התשובה שנבחרה ומה שהוקלד נשמרים. */
        myInst = v;
        localStorage.setItem("dfInst", v);
        var n = document.getElementById("q-name"), ph = document.getElementById("q-phone");
        var nv = n ? n.value : null, pv = ph ? ph.value : null;
        quizWho();
        n = document.getElementById("q-name");
        ph = document.getElementById("q-phone");
        if (n && nv !== null) n.value = nv;
        if (ph && pv !== null) ph.value = pv;
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
    var r = document.getElementById("q-result");
    if (r) r.innerHTML = "";
    if (typeof quizStep === "function") setTimeout(function() {
        if (state.ans === i) quizStep(2);
    }, 240);
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
            var er = document.getElementById("q-err");
            if (er) {
                er.textContent = "נא לבחור ישיבה ולמלא שם.";
                er.hidden = false;
            }
            var miss = !inst ? document.querySelector("#q-who .pk") : document.getElementById("q-name");
            if (miss) miss.focus();
            return;
        }
        var er2 = document.getElementById("q-err");
        if (er2) er2.hidden = true;
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
    if (right) {
        /* הזרימה הושלמה: השאלה נשארת עם התשובה הנכונה גלויה,
           ומתחתיה חותמת הצלחה והצעד הבא. הניסוח נשאר כשהיה:
           הרישום ממתין בתור ואינו מוצג כמאושר בשרת. */
        var fl = document.getElementById("qflow");
        if (fl) fl.className = "qflow locked";
        var sa = document.getElementById("q-step-a");
        if (sa) sa.className = "qstep on";
        document.getElementById("q-result").innerHTML = '<div class="q-done">' + '<div class="q-seal" aria-hidden="true"><svg viewBox="0 0 32 32" width="30" height="30"><path d="M7 16.5l6 6L25 10" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' + '<div class="done-box">' + esc(UI.qRight || "") + "</div>" + '<button class="btn gd" onclick="backToWeek()">→ חזרה לדף</button>' + (QUIZ[key].length > 1 ? '<button class="btn g" onclick="openQuiz()">→ כל החידות</button>' : "") + "</div>";
    } else {
        document.getElementById("q-result").innerHTML = '<div class="q-miss">' + esc(UI.qWrong || "") + "</div>";
        if (typeof quizStep === "function") quizStep(1);
        var te = document.getElementById("opt" + tried);
        if (te) {
            te.classList.add("jolt");
            te.focus();
        }
    }
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

/* ============================================================
   אנשי הצוות שנרשמו בעצמם - ומכתב אישי לכל אחד.
   ============================================================
   "ברגע שאיש צוות נרשם - הוא איש צוות בישיבה, גם אם אני לא
   הוספתי אותו." המקור הוא לשונית ההתראות (pushCache): מי שמילא
   את הבקשה האישית (ask.js) כתב שם שם, טלפון, ישיבה ותפקיד.

   **נגזר, לא נכתב.** שום דבר אינו נוסף לגיליון אנשי הקשר: כך
   הרשימה אינה מתיישנת, אינה דורסת עריכה ידנית, ואינה מזיזה את
   האינדקסים של "מחייגים אליו" ו"לצוות". מי שכבר רשום כאיש קשר
   (אותו טלפון, או אותו שם) אינו מוצג פעמיים - הוא מקבל ✉
   בשורה שלו בכרטיס.

   "צוות" - כמו ב-push-send.js: כל מי שאינו תלמיד, הורה או רכז. */
function stfOf(code) {
  var by = {}, out = [];
  if (!code) return out;
  (Store.get('pushCache', []) || []).forEach(function (p) {
    var rv = p.role || '';
    if (!rv || rv === 'תלמיד' || rv === 'הורה' || rv === 'אב' || rv === 'רכז' || !p.name) return;
    var c = p.code;
    if (!c && p.inst) { var ii = instByName(p.inst); c = ii ? ii.code : ''; }
    if (c !== code) return;
    var k = nameKey(p.name), o = by[k];
    if (!o) { o = by[k] = { name:p.name, role:rv, ph:'', ids:[], sub:false, hit:false }; out.push(o); }
    if (p.id && o.ids.indexOf(p.id) < 0) o.ids.push(p.id);
    if (!o.ph && p.ph) o.ph = p.ph;
    if (p.ever || p.sub) o.sub = true;
  });
  return out;
}
/* אותו אדם? תשע הספרות האחרונות של הטלפון, או השם. */
function stfSame(q, s) {
  var a = digits(q.phone).slice(-9), b = digits(s.ph).slice(-9);
  if (a.length === 9 && a === b) return true;
  return !!q.name && nameKey(q.name) === nameKey(s.name);
}

/* המכתב. נפתח במקום, מתחת לשם - לא מסך נוסף. */
var STF = { open:'', txt:'', busy:false, msg:'', msgAt:'', ok:false }, stfShown = [];
function stfK(s) { return nameKey(s.name) + '|' + (s.ids[0] || ''); }
function stfIx(s) {
  var ix = stfShown.indexOf(s);
  if (ix < 0) { stfShown.push(s); ix = stfShown.length - 1; }
  return ix;
}
function stfBtn(s) {
  if (!s || !s.sub || !s.ids.length) return '';
  return '<button class="stf-m' + (STF.open === stfK(s) ? ' on' : '') + '" onclick="stfOpen(' + stfIx(s) +
         ')" aria-label="' + esc(fill(UI.stfAria, { name:s.name })) + '">✉</button>';
}
function stfBox(s) {
  var k = stfK(s), h = '';
  if (STF.open === k) {
    h += '<div class="stf-box"><textarea id="stf-txt" rows="3" maxlength="400" placeholder="' +
         esc(fill(UI.stfPh, { name:s.name })) + '" oninput="STF.txt=this.value">' + esc(STF.txt) + '</textarea>' +
         '<div class="stf-go"><button class="btn p"' + (STF.busy ? ' disabled' : '') +
         ' onclick="stfSend(' + stfIx(s) + ')">' + esc(STF.busy ? UI.stfBusy : UI.stfGo) + '</button>' +
         '<button class="btn g" onclick="stfClose()">' + esc(UI.stfCancel) + '</button></div></div>';
  }
  if (STF.msg && STF.msgAt === k) {
    h += '<div class="stf-msg ' + (STF.ok ? 'ok' : 'bad') + '">' + esc(STF.msg) +
         (STF.ok ? '<small>' + esc(UI.sayLate) + '</small>' : '') + '</div>';
  }
  return h;
}
function stfOpen(ix) {
  var s = stfShown[ix]; if (!s) return;
  var k = stfK(s);
  if (STF.open === k) { stfClose(); return; }
  STF.open = k; STF.txt = ''; STF.msg = '';
  renderCalls();
  var el = document.getElementById('stf-txt');
  if (el) el.focus();
}
function stfClose() { STF.open = ''; STF.txt = ''; renderCalls(); }
function stfSend(ix) {
  var s = stfShown[ix], txt = (STF.txt || '').trim();
  if (!s || STF.busy || txt.length < 2) return;
  var k = stfK(s), key = (CFG.readKey || '').trim();
  var done = function (ok, m) {
    STF.busy = false; STF.ok = ok; STF.msg = m; STF.msgAt = k;
    if (ok) { STF.open = ''; STF.txt = ''; }
    renderCalls();
  };
  if (!key) { done(false, UI.stfNoKey); return; }
  if (!confirm(fill(UI.stfAsk, { name:s.name }) + '\n\n' + txt)) return;
  STF.busy = true; renderCalls();
  var inst = '';
  (Store.get('pushCache', []) || []).some(function (p) {
    if (s.ids.indexOf(p.id) >= 0 && p.code) { inst = p.code; return true; }
    return false;
  });
  /* לפי מזהים בלבד, בלי תפקיד: השרת מסנן את לשונית ההתראות
     למזהים האלה, ולכן זה מגיע לו - לכל המכשירים שלו - ולא לאיש
     אחר. לחיצה על ההתראה פותחת לו את הפינה שלו. */
  scriptGet({ fire:'say', key:key, title:PROGRAM.short, who:'רכז', body:txt,
              url: /^[A-Za-z0-9_\-]{1,40}$/.test(inst) ? 'tzevet?inst=' + inst + '#my' : '',
              flt: JSON.stringify({ ids: s.ids.slice(0, 60) }) })
    .then(function (d) {
      if (d && d.status === 'ok') done(true, fill(UI.stfOk, { name:s.name }));
      else done(false, fill(UI.stfBad, { m: (d && d.message) || UI.parNoAns }));
    })['catch'](function () { done(false, fill(UI.stfBad, { m: UI.parNoAns })); });
}
/* הכרטיס של מי שנרשם ואינו ברשימת אנשי הקשר - באותו מבנה של
   ctCard: מי, ושני כפתורי השיחה. */
function stfCard(s) {
  return '<div class="ct stf-r"><div class="h"><div style="min-width:0">' +
    '<div class="nm">' + esc(s.name) + '</div>' +
    '<div class="ct-who">' + esc(s.role) + ' · ' + esc(UI.stfSelf) + '</div></div>' +
    stfBtn(s) + '</div>' +
    (s.ph ? '<div class="acts"><a class="call" href="tel:' + digits(s.ph) + '">📞 ' + esc(s.name) + '</a>' +
            '<a class="wa" href="https://wa.me/' + waNum(s.ph) + '" target="_blank" rel="noopener">' +
            esc(UI.stfWa) + '</a></div>' : '') +
    (s.sub ? '' : '<div class="stf-no">' + esc(UI.stfNoSub) + '</div>') +
    stfBox(s) + '</div>';
}

/* פינת ההתראות במסך השיחות - טעינה שקטה, פעם בשתי דקות לכל
   היותר. בלי זה מי שנרשם הבוקר לא היה מופיע עד ביקור במסך
   "שליחה". **קריאה שנכשלה אינה לשונית ריקה** - המטמון נשאר. */
var stfLoadAt = 0;
function stfLoad() {
  var key = (CFG.readKey || '').trim();
  if (!key || Date.now() - stfLoadAt < 120000) return;
  stfLoadAt = Date.now();
  scriptGet({ read:'התראות', key:key }).then(function (d) {
    if (!d || d.status !== 'ok' || !d.rows) return;
    pushRows = pushParse(d.rows);
    Store.set('pushCache', pushRows);
    if (document.getElementById('calls-body')) renderCalls();
  })['catch'](function () {});
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
