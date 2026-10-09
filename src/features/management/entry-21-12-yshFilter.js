var yshShown = [];

function yshFilter(f) {
    state.yf = !f || state.yf === f ? "" : f;
    renderCalls();
}

function yshSort(v) {
    state.ysort = v;
    renderCalls();
}

function yshOpen(n) {
    var e = yshShown[n];
    if (!e) return;
    state.yshY = window.pageYOffset || 0;
    state.yshOpen = e.k;
    renderCalls();
    window.scrollTo(0, 0);
}

function yshClose() {
    state.yshOpen = "";
    renderCalls();
    window.scrollTo(0, state.yshY || 0);
}

function yshLogHtml(e) {
    var items = [], keys = {}, prev = {};
    e.recs.forEach(function(o) {
        keys[nameKey(o.c.key || o.c.name)] = 1;
    });
    (Store.get("callJournal", []) || []).forEach(function(j) {
        if (!j || !keys[j.k]) return;
        var p = prev[j.k] || {
            note: "",
            stage: "new"
        }, note = j.note || "", add = note;
        if (note === p.note) add = ""; else if (p.note && note.indexOf(p.note) === 0) add = note.slice(p.note.length).trim();
        var stCh = !!j.stage && j.stage !== p.stage;
        prev[j.k] = {
            note: note,
            stage: j.stage
        };
        if (!add && !stCh) return;
        items.push({
            t: tsOf(j.at),
            at: j.at,
            who: j.who || "",
            note: add,
            stg: stCh ? j.stage : ""
        });
    });
    e.recs.forEach(function(o) {
        var c = o.c;
        if (prev[nameKey(c.key || c.name)] || !c.note && c.stage === "new") return;
        items.push({
            t: tsOf(c.at),
            at: c.at,
            who: (mainOf(c) || {}).name || "",
            note: c.note || "",
            stg: c.stage !== "new" ? c.stage : ""
        });
    });
    (Store.get("yshAdds", []) || []).forEach(function(a) {
        if (yshGk(a.n) === e.k) items.push({
            t: tsOf(a.at),
            at: a.at,
            who: a.who,
            note: a.note,
            stg: ""
        });
    });
    if (!items.length) return '<div class="ysh-empty">' + esc(UI.yshLogNone) + "</div>";
    items.sort(function(a, b) {
        return b.t - a.t;
    });
    return '<div class="ysh-log">' + items.map(function(it) {
        var sg = it.stg ? STAGES.filter(function(x) {
            return x.k === it.stg;
        })[0] : null;
        return '<div class="ysh-li"><div class="ysh-lh"><b>' + esc(yshWhen(it.at)) + "</b>" + (it.who ? "<span>" + esc(it.who) + "</span>" : "") + (sg ? '<span class="ct-sb ' + sg.c + '">' + esc(sg.t) + "</span>" : "") + "</div>" + (it.note ? '<div class="ysh-ln">' + esc(it.note) + "</div>" : "") + "</div>";
    }).join("") + "</div>";
}

function yshDetail(e, ctx) {
    var inst = null;
    e.recs.some(function(o) {
        inst = instByName(o.c.key || o.c.name);
        return !!inst;
    });
    if (!inst) inst = instByName(e.name);
    var r = yshOf(e, "rate"), act = yshOf(e, "act");
    var h = '<button class="back" onclick="yshClose()">' + esc(UI.yshBack) + "</button>" + '<div class="ysh-hd"><h2>' + esc(e.name) + "</h2>" + (inst ? '<a class="ysh-board" href="' + esc(tzevetUrl(inst.code)) + '" target="_blank" rel="noopener">' + esc(UI.yshBoard) + "</a>" : '<span class="ysh-board off" aria-disabled="true">' + esc(UI.yshBoard) + "<small>" + esc(UI.yshNoBoard) + "</small></span>") + (!e.st ? "" : '<div class="ysh-ind">' + YSH_IND.map(function(d) {
        var v = yshOf(e, d[0]);
        return '<span class="ysh-pill" title="' + esc(UI["yshV_" + v]) + '"><i class="ysh-dot ' + "v-" + v + '"></i>' + esc(UI[d[1]]) + "</span>";
    }).join("") + '</div><div class="ysh-ind">' + '<span class="ysh-tag ' + "r-" + r + '">' + esc(UI.yshRate) + ": " + esc(UI["yshR_" + r]) + "</span>" + '<span class="ysh-pill"><i class="ysh-dot ' + "v-" + act + '"></i>' + esc(UI.yshActive) + ": " + esc(UI["yshV_" + act]) + "</span></div>") + (e.st && e.st.note ? '<div class="ysh-snote">' + esc(e.st.note) + "</div>" : "") + (e.st && e.st.upd ? '<div class="ysh-upd">' + esc(fill(UI.yshUpd, {
        t: yshWhen(e.st.upd)
    })) + "</div>" : "") + "</div>";
    var nIx = -1;
    for (var yi = 0; yi < yshShown.length; yi++) if (yshShown[yi].k === e.k) nIx = yi;
    if (nIx < 0) {
        yshShown.push(e);
        nIx = yshShown.length - 1;
    } else yshShown[nIx] = e;
    e.t = yshLastAt(e, ctx.jLast || {});
    h += '<div class="yr-list" style="margin:0 0 12px">' + yshRow(e, nIx) + "</div>";
    if (e.recs.length) {
        h += '<h3 class="ysh-h">' + esc(UI.yshPeople) + "</h3>";
        if (e.recs.length > 1) h += '<div class="ysh-empty">' + esc(fill(UI.yshDup, {
            n: e.recs.length
        })) + "</div>";
        e.recs.forEach(function(o) {
            h += ctCard(o.c, o.i, ctx);
        });
    }
    return h + '<h3 class="ysh-h">' + esc(UI.yshLog) + "</h3>" + yshLogHtml(e);
}

function renderCalls() {
    var list = contacts();
    var el = document.getElementById("calls-body");
    if (!list.length) {
        el.innerHTML = '<div class="hero" style="padding:22px 20px"><span class="glow g1"></span>' + '<span class="glow g3"></span><h2 style="font-size:1.35rem">מוקד שיחות</h2>' + '<div class="rule"></div><div class="sub">הרשימה נטענת מלשונית "' + CONTACT_TAB + '" שבגיליון הפרטי. היא אינה בקוד ואינה בגיליון המשותף.</div></div>' + '<button class="btn p" onclick="pullCalls().then(renderCalls)">טעינה מהגיליון</button>' + '<div id="call-sync" class="msg" style="margin-top:10px">' + esc(callSync.state) + "</div>" + '<div class="card"><h3>אם הלשונית עוד לא קיימת</h3>' + "<p>בגיליון הפרטי, לשונית בשם <b>" + CONTACT_TAB + "</b>. שורה ראשונה כותרות, " + 'ואחריה שורה לכל ישיבה: שם, אנשי קשר, טלפון, וטור TRUE למי שהיה בתשפ"ו. ' + "סדר העמודות אינו חשוב.</p>" + '<p style="margin-top:8px">אפשר גם להדביק ישירות, אבל אז התיעוד חי על ' + "המכשיר הזה בלבד - וזה מה שנמחק בפעם הקודמת.</p></div>" + '<textarea id="paste" rows="5" placeholder="או הדביקו כאן מהגיליון…"></textarea>' + '<button class="btn g" onclick="importContacts()">ייבוא בהדבקה</button>' + '<button class="btn g" style="margin-top:8px" onclick="bulkImportOpen()">' + "⇩ ייבוא מרשימה (JSON)</button>";
        return;
    }
    var regs = regByInst(), subs = subsByInst();
    var jLast = {};
    (Store.get("callJournal", []) || []).forEach(function(e) {
        if (e && e.k && (!jLast[e.k] || (e.at || "") > jLast[e.k])) jLast[e.k] = e.at || "";
    });
    var ctx = {
        regs: regs,
        subs: subs,
        jLast: jLast
    };
    var ents = yshEntries(list);
    if (state.yshOpen) {
        var open = ents.filter(function(e) {
            return e.k === state.yshOpen;
        })[0];
        if (open) {
            ctPaint(el, yshDetail(open, ctx));
            return;
        }
        state.yshOpen = "";
    }
    var counts = {
        all: list.length
    };
    STAGES.forEach(function(s) {
        counts[s.k] = list.filter(function(c) {
            return c.stage === s.k;
        }).length;
    });
    counts.last = list.filter(function(c) {
        return c.last;
    }).length;
    counts.signed = list.filter(function(c) {
        return !!regOf(c, regs);
    }).length;
    yshCtx = ctx;
    var h = '<div class="my-top" style="margin:0"><b>מוקד שיחות</b><span>' + counts.joined + " מתוך " + list.length + " ישיבות הצטרפו · " + (list.length - counts.new) + " שיחות בוצעו</span></div>" + '<a class="btn p" style="margin:10px 0 0;text-decoration:none;display:block;text-align:center" target="_blank" ' + 'rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(fill(UI.kishWa, {
        url: joinUrl("").replace("join.html", "kishurim.html")
    })) + '">📨 ' + esc(UI.kishBtn) + "</a>" + '<button class="back" style="margin:6px 0 0" onclick="admSubGo(\'links\')">✎ ' + esc(UI.kishTexts) + "</button>" + '<div id="call-sync" class="msg" style="margin:10px 0 0">' + esc(callSync.state || "נשמר על המכשיר") + (list.filter(function(c) {
        return !peopleOf(c).some(function(q) {
            return q.phone;
        });
    }).length ? " · " + list.filter(function(c) {
        return !peopleOf(c).some(function(q) {
            return q.phone;
        });
    }).length + " בלי טלפון" : "") + "</div>";
    h += '<details class="adm-card" style="margin:10px 0 0"' + (Store.get("yshBrdOpen", 0) ? " open" : "") + " ontoggle=\"Store.set('yshBrdOpen',this.open?1:0)\"><summary>" + esc(UI.yshBigH) + "</summary>" + yshBoard(ents) + "</details>";
    h += '<div class="fld" style="margin:14px 0 0">' + '<input type="text" id="call-find" placeholder="חיפוש ישיבה או שם…" ' + 'oninput="callFind(this.value)" value="' + esc(state.find || "") + '"></div>';
    var opt = function(v, cur, t) {
        return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + esc(t) + "</option>";
    };
    var fl = state.filter || "all", so = state.ysort || "need";
    h += '<div class="ysh-bar">' + '<select class="ct-sel" aria-label="' + esc(UI.yshShow) + '" onchange="callFilter(this.value)">' + opt("all", fl, UI.yshFAll + " (" + counts.all + ")") + opt("last", fl, UI.yshFLast + " (" + counts.last + ")") + opt("new", fl, UI.yshFNew + " (" + counts.new + ")") + opt("warm", fl, UI.yshFWarm + " (" + counts.warm + ")") + opt("joined", fl, UI.yshFJoined + " (" + counts.joined + ")") + opt("signed", fl, UI.yshFSigned + " (" + counts.signed + ")") + "</select>" + '<select class="ct-sel" aria-label="' + esc(UI.yshSortBy) + '" onchange="yshSort(this.value)">' + opt("need", so, UI.yshSortNeed) + opt("name", so, UI.yshSortName) + opt("recent", so, UI.yshSortRecent) + "</select></div>";
    var words = String(state.find || "").trim().split(/\s+/).filter(Boolean);
    var hits = function(e) {
        if (!words.length) return true;
        var hay = (e.name || "") + " " + e.recs.map(function(o) {
            return (o.c.name || "") + " " + peopleOf(o.c).map(function(q) {
                return (q.name || "") + " " + (q.role || "");
            }).join(" ");
        }).join(" ");
        for (var w = 0; w < words.length; w++) {
            if (hay.indexOf(words[w]) < 0) return false;
        }
        return true;
    };
    var stageOk = function(c) {
        if (fl === "last") return !!c.last;
        if (fl === "signed") return !!regOf(c, regs);
        return c.stage === fl;
    };
    var yf = state.yf || "";
    var shown = ents.filter(function(e) {
        if (!hits(e)) return false;
        if (fl !== "all" && !e.recs.some(function(o) {
            return stageOk(o.c);
        })) return false;
        if (yf.indexOf("r:") === 0) return yshOf(e, "rate") === yf.slice(2);
        if (yf) return yshOf(e, yf) !== "y";
        return true;
    });
    var nameCmp = function(a, b) {
        return String(a.name).localeCompare(String(b.name), "he");
    };
    var lastOf = function(e) {
        return e.recs.some(function(o) {
            return o.c.last;
        }) ? 1 : 0;
    };
    shown.forEach(function(e) {
        e.need = yshNeed(e);
        e.t = yshLastAt(e, jLast);
    });
    shown.sort(so === "name" ? nameCmp : so === "recent" ? function(a, b) {
        return b.t - a.t || nameCmp(a, b);
    } : function(a, b) {
        return b.need - a.need || lastOf(b) - lastOf(a) || nameCmp(a, b);
    });
    yshShown = shown;
    if (yf || fl !== "all") {
        h += '<div class="ysh-cnt">' + esc(fill(UI.yshShown, {
            n: shown.length
        })) + " · <button class=\"back\" onclick=\"state.filter='all';yshFilter('')\">" + esc(UI.yshClear) + "</button></div>";
    }
    if (!shown.length && words.length) {
        h += '<div class="msg">לא נמצאה ישיבה או שם שמתאים ל“' + esc(state.find) + "”.</div>";
    } else if (!shown.length) h += '<div class="msg">' + (fl === "last" ? 'אף שם ברשימה לא זוהה כישיבה שהייתה בתשפ"ו. בדקו ששמות ' + 'הישיבות בגיליון זהים לאלה שבמסך "מוסדות".' : fl === "signed" ? "עוד לא נרשמה אף ישיבה דרך הכפתור - או שרשימת ההרשמות " + 'עוד לא נטענה. היא נטענת ב"מה קורה ← אנשים".' : "אין מוסדות בקטגוריה הזו.") + "</div>"; else {
        h += tmpBar() + tmpEdHtml() + '<div class="yr-list">' + shown.map(function(e, n) {
            return yshRow(e, n);
        }).join("") + "</div>";
    }
    h += rmCard();
    h += teamLogCard();
    var did = list.filter(function(c) {
        return tagOn(c, "called");
    }).length;
    h += '<div class="card" style="margin:10px 0 0;padding:14px 15px">' + '<div class="row" style="padding:0">' + '<div><b>הסבב הנוכחי</b><div class="sub">' + (did ? did + " מתוך " + list.length + " · סמנו ✓ אחרי כל שיחה" : "סמנו ✓ על כל מי שדיברתם איתו") + "</div></div>" + (did ? '<button class="back" onclick="roundReset()">סבב חדש</button>' : "") + "</div></div>";
    h += blastCard(list);
    h += '<button class="btn g" style="margin-top:8px" onclick="bulkImportOpen()">' + "⇩ ייבוא מרשימה</button>" + '<button class="btn g" onclick="tagEditOpen()">⚙ ניהול תגיות</button>' + '<button class="btn g" onclick="teamLinkCopy()">קישור לעמוד הצוות</button>' + '<button class="btn g" onclick="pushCalls(1)">שמירה לגיליון עכשיו</button>' + '<button class="btn g" onclick="pullCalls().then(renderCalls)">' + "רענון מהגיליון</button>" + '<button class="btn g" onclick="jnlShow()">יומן התיעוד (' + (Store.get("callJournal", []) || []).length + ")</button>" + '<button class="btn g" onclick="wipeContacts()">מחיקת הרשימה מהמכשיר</button>';
    ctPaint(el, h);
}
