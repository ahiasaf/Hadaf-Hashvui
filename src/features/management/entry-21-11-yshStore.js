function yshStore(st, ad) {
    if (st) {
        var m = {}, ci = yshCols(st[0], YSH_COLS);
        st.slice(1).forEach(function(r) {
            var nm = String(r[ci[0]] || "").trim();
            if (!nm) return;
            var k = yshKey(nm), upd = String(r[ci[7]] || "").trim();
            if (m[k] && tsOf(m[k].upd) > tsOf(upd)) return;
            m[k] = {
                name: nm,
                grp: yshVal(r[ci[1]]),
                team: yshVal(r[ci[2]]),
                zoom: yshVal(r[ci[3]]),
                rate: yshRate(r[ci[4]]),
                act: yshVal(r[ci[5]]),
                note: String(r[ci[6]] || "").trim(),
                upd: upd
            };
        });
        Store.set("yshState", m);
    }
    if (ad) {
        var l = [], seen = {}, cj = yshCols(ad[0], YADD_COLS);
        ad.slice(1).forEach(function(r) {
            var nm = String(r[cj[0]] || "").trim();
            if (!nm) return;
            var at = String(r[cj[1]] || "").trim(), note = String(r[cj[3]] || "").trim();
            var sig = String(r[cj[4]] || "").trim() || yshKey(nm) + "|" + at + "|" + note;
            if (seen[sig]) return;
            seen[sig] = 1;
            l.push({
                n: nm,
                at: at,
                who: String(r[cj[2]] || "").trim(),
                note: note
            });
        });
        Store.set("yshAdds", l);
    }
}

function yshEntries(list) {
    var st = Store.get("yshState", {}) || {}, by = {}, out = [];
    list.forEach(function(c, i) {
        var nm = c.key || c.name, k = yshGk(nm);
        if (!k) return;
        if (!by[k]) {
            by[k] = {
                k: k,
                name: yshNm(nm),
                recs: [],
                st: null
            };
            out.push(by[k]);
        }
        by[k].recs.push({
            c: c,
            i: i
        });
    });
    Object.keys(st).forEach(function(sk) {
        var k = yshGk(st[sk].name);
        if (!by[k]) {
            by[k] = {
                k: k,
                name: yshNm(st[sk].name),
                recs: [],
                st: null
            };
            out.push(by[k]);
        }
        if (!by[k].st || tsOf(st[sk].upd) > tsOf(by[k].st.upd)) by[k].st = st[sk];
    });
    return out;
}

function yshOf(e, f) {
    return e.st ? e.st[f] : f === "rate" ? "unclear" : "u";
}

var YSH_IND = [ [ "grp", "yshGrp" ], [ "team", "yshTeam" ], [ "zoom", "yshZoom" ] ];

function yshNeed(e) {
    var g = yshOf(e, "grp"), r = yshOf(e, "rate");
    return (g === "n" ? 8 : g === "y" ? 0 : 6) + (r === "unclear" ? 4 : r === "weak" ? 3 : r === "warm" ? 1 : 0) + (yshOf(e, "zoom") === "y" ? 0 : 1) + (yshOf(e, "team") === "y" ? 0 : 1);
}

function yshLastAt(e, jLast) {
    var t = e.st ? tsOf(e.st.upd) : 0;
    e.recs.forEach(function(o) {
        t = Math.max(t, tsOf(o.c.at), tsOf(jLast[nameKey(o.c.key || o.c.name)]));
    });
    return t;
}

function yshWhen(v) {
    var t = tsOf(v);
    if (!t) return String(v || "");
    var d = new Date(t), z = function(x) {
        return (x < 10 ? "0" : "") + x;
    };
    return z(d.getDate()) + "/" + z(d.getMonth() + 1) + "/" + String(d.getFullYear()).slice(2) + " " + z(d.getHours()) + ":" + z(d.getMinutes());
}

function yshCard(f, n, of, lbl, sub) {
    return '<button class="ysh-c' + (f ? " k-" + f : "") + (f && state.yf === f ? " on" : "") + '" onclick="yshFilter(\'' + f + "')\"><b>" + n + (of ? "<small>" + of + "</small>" : "") + "</b>" + "<span>" + esc(lbl) + "</span>" + (sub ? "<i>" + esc(sub) + "</i>" : "") + "</button>";
}

function yshBoard(ents) {
    var N = ents.length, h = '<div class="ysh-sum">' + yshCard("", N, "", UI.yshTotal, "");
    YSH_IND.forEach(function(d) {
        var n = {
            y: 0,
            n: 0,
            m: 0,
            u: 0
        };
        ents.forEach(function(e) {
            n[yshOf(e, d[0])]++;
        });
        var gray = [];
        if (n.m) gray.push(fill(UI.yshMaybeN, {
            n: n.m
        }));
        if (n.u) gray.push(fill(UI.yshUnkN, {
            n: n.u
        }));
        h += yshCard(d[0], n.y, "/" + N, UI[d[1]], gray.join(" · "));
    });
    h += '</div><div class="ysh-rates">';
    YSH_RATE.forEach(function(r) {
        var n = ents.filter(function(e) {
            return yshOf(e, "rate") === r;
        }).length;
        h += '<button class="ysh-rt ' + "r-" + r + (state.yf === "r:" + r ? " on" : "") + '" onclick="yshFilter(\'r:' + r + "')\"><b>" + n + "</b><span>" + esc(UI["yshR_" + r]) + "</span></button>";
    });
    h += "</div>";
    if (!ents.some(function(e) {
        return e.st;
    })) h += '<div class="ysh-empty">' + esc(UI.yshNoSheet) + "</div>";
    return h;
}

var CALL_TASKS = [ [ "task_coord", "taskCoord" ], [ "task_rm", "taskRm" ], [ "task_kids", "taskKids" ] ];

function yshInst(e) {
    var inst = null;
    e.recs.some(function(o) {
        inst = instByName(o.c.key || o.c.name);
        return !!inst;
    });
    return inst || instByName(e.name);
}

function yshMain(e, subs) {
    var best = null, bs = -1;
    e.recs.forEach(function(o) {
        var who = subsOf(o.c, subs).map(function(q) {
            return nameKey(q.name);
        });
        peopleOf(o.c).forEach(function(q) {
            if (!q.phone) return;
            var r = String(q.role || ""), sc = /רכז/.test(r) ? 2 : /ראש/.test(r) ? 1 : 0;
            var nk = nameKey(q.name);
            if (nk && who.some(function(w) {
                return w && (w.indexOf(nk) >= 0 || nk.indexOf(w) >= 0);
            })) sc += 4;
            if (sc > bs) {
                bs = sc;
                best = {
                    q: q,
                    c: o.c,
                    i: o.i
                };
            }
        });
    });
    if (!best && e.recs.length) best = {
        q: mainOf(e.recs[0].c),
        c: e.recs[0].c,
        i: e.recs[0].i
    };
    return best;
}

function yshTagOn(e, k) {
    return e.recs.some(function(o) {
        return tagOn(o.c, k);
    });
}

function yshTagVal(e, k) {
    var v = 0;
    e.recs.forEach(function(o) {
        var x = o.c.tags && o.c.tags[k];
        if (x && !v) v = x === true ? 1 : +x || 1;
    });
    return v;
}

function yshTick(n, k) {
    var e = yshShown[n];
    if (!e || !e.recs.length) return;
    var def = tagDefs().filter(function(t) {
        return t.k === k;
    })[0];
    var nOpt = def && def.opts ? def.opts.length : 0;
    var cur = yshTagVal(e, k), next = nOpt ? cur >= nOpt ? 0 : cur + 1 : cur ? 0 : true;
    var l = contacts(), now = (new Date).toISOString();
    e.recs.forEach(function(o) {
        if (!l[o.i]) return;
        if (!l[o.i].tags) l[o.i].tags = {};
        if (!next) delete l[o.i].tags[k]; else if (o === e.recs[0]) l[o.i].tags[k] = next; else delete l[o.i].tags[k];
        l[o.i].at = now;
        jnl(l[o.i]);
    });
    saveContacts(l);
    renderCalls();
    pushCalls();
}

function yshStage(n) {
    var e = yshShown[n];
    if (!e || !e.recs.length) return;
    var i = e.recs[0].i, c = contacts()[i];
    if (!c) return;
    var at = 0;
    STAGES.forEach(function(x, j) {
        if (x.k === c.stage) at = j;
    });
    setStage(i, STAGES[(at + 1) % STAGES.length].k);
}

function tmpDefs() {
    return tagDefs().filter(function(t) {
        return t.tmp;
    });
}

function yshRow(e, n) {
    var cx = yshCtx || {}, inst = yshInst(e), m = yshMain(e, cx.subs || {});
    var got = 0;
    if (inst) pplData().rows.forEach(function(x) {
        if (x.c === inst.code) got = x.got;
    });
    var acc = inst ? accList().filter(function(a) {
        return pplCode(a.inst) === inst.code;
    }) : [];
    var accT = acc.some(function(a) {
        return a.st === "אושר";
    }) ? UI.yrAccOk : acc.some(function(a) {
        return a.st === "ממתין";
    }) ? UI.yrAccWait : "";
    var c0 = e.recs.length ? e.recs[0].c : null, upd = "";
    e.recs.forEach(function(o) {
        if (!upd && o.c.upd) upd = o.c.upd;
    });
    var due = "";
    e.recs.forEach(function(o) {
        var d = o.c.tags && o.c.tags.__due;
        if (d && (!due || d < due)) due = d;
    });
    var reg = e.recs.some(function(o) {
        return !!regOf(o.c, cx.regs || {});
    });
    var chip = function(k, t, def) {
        var v = yshTagVal(e, k);
        if (def && def.opts && def.opts.length) {
            var o = v > 0 ? def.opts[v - 1] : null;
            var kc = o ? " k-" + (o.c || "n") : "";
            return '<button class="yr-c' + kc + '" onclick="yshTick(' + n + ",'" + k + "')\">" + esc(t) + (o ? ": " + esc(o.t) : "") + "</button>";
        }
        return '<button class="yr-c' + (v ? " on" : "") + '" aria-pressed="' + !!v + '" onclick="yshTick(' + n + ",'" + k + "')\">" + (v ? "✓ " : "") + esc(t) + "</button>";
    };
    var stg = c0 ? STAGES.filter(function(x) {
        return x.k === c0.stage;
    })[0] || STAGES[0] : STAGES[0];
    var done = CALL_TASKS.filter(function(t) {
        return yshTagOn(e, t[0]);
    }).length;
    var sc = "st-" + stg.k;
    var h = '<div class="yr ' + sc + '"><div class="yr-h"><button class="yr-nm" onclick="yshOpen(' + n + ')">' + esc(e.name) + (yshOf(e, "act") === "y" ? ' <span class="ysh-act">★</span>' : "") + ' <i aria-hidden="true">‹</i></button>' + (c0 ? '<button class="yr-st ' + sc + '" onclick="yshStage(' + n + ')">' + esc(stg.t) + "</button>" : "") + '<span class="yr-n' + (got ? "" : " z") + '">' + esc(fill(UI.yrGot, {
        n: got
    })) + "</span></div>" + '<div class="yr-pr" aria-label="' + esc(fill(UI.yrTasks, {
        n: done,
        of: CALL_TASKS.length
    })) + '">' + CALL_TASKS.map(function(t) {
        return '<i class="' + (yshTagOn(e, t[0]) ? "on" : "") + '"></i>';
    }).join("") + "</div>";
    if (m && m.q) {
        h += '<div class="yr-who"><span>' + esc(m.q.name || "") + (m.q.role ? " · " + esc(m.q.role) : "") + "</span>" + (m.q.phone ? '<a class="yr-b" href="tel:' + digits(m.q.phone) + '" aria-label="' + esc(UI.yrCall) + '">📞</a>' + '<a class="yr-b" target="_blank" rel="noopener" href="https://wa.me/' + waNum(m.q.phone) + '" aria-label="' + esc(UI.yrWa) + '">💬</a>' : "") + "</div>";
    }
    h += '<div class="yr-nx">' + (upd ? "⏭ " + esc(upd) : '<span class="yr-no">' + esc(UI.yrNoNext) + "</span>") + '<span class="yr-t">' + esc(e.t ? whenTxt(e.t) : UI.callNever) + (due ? " · ⏰ " + esc(due.split("-").reverse().slice(0, 2).join("/")) : "") + '</span></div><div class="yr-ch">' + CALL_TASKS.map(function(t) {
        return chip(t[0], UI[t[1]]);
    }).join("") + (reg ? '<span class="yr-c auto">⚑ ' + esc(UI.yrReg) + "</span>" : "") + (accT ? '<span class="yr-c auto">' + esc(accT) + "</span>" : "") + (inst ? '<button class="yr-c auto" onclick="admInstPick(\'' + esc(inst.code) + "');admGo('stu')\">👁 " + esc(UI.yrBoard) + "</button>" : "") + "</div>";
    var tm = tmpDefs();
    if (tm.length || yshTagOn(e, "called")) {
        h += '<div class="yr-ch yr-tmp">' + chip("called", UI.yrRound) + tm.map(function(t) {
            return chip(t.k, t.t, t);
        }).join("") + "</div>";
    }
    return h + "</div>";
}

var yshCtx = null;

var TMP_COLORS = [ "g", "y", "r", "b", "n" ];

var tmpEd = null;

function tmpAdd() {
    tmpEd = {
        t: "",
        opt: false,
        opts: [ {
            t: "",
            c: "g"
        }, {
            t: "",
            c: "r"
        } ]
    };
    renderCalls();
}

function tmpEdSet(k, v) {
    if (tmpEd) tmpEd[k] = v;
    if (k === "opt") renderCalls();
}

function tmpOptSet(i, k, v) {
    if (tmpEd && tmpEd.opts[i]) {
        tmpEd.opts[i][k] = v;
        if (k === "c") renderCalls();
    }
}

function tmpOptAdd() {
    if (tmpEd) {
        tmpEd.opts.push({
            t: "",
            c: TMP_COLORS[tmpEd.opts.length % TMP_COLORS.length]
        });
        renderCalls();
    }
}

function tmpOptDel(i) {
    if (tmpEd) {
        tmpEd.opts.splice(i, 1);
        renderCalls();
    }
}

function tmpSave() {
    if (!tmpEd || !String(tmpEd.t).trim()) {
        tmpEd = null;
        renderCalls();
        return;
    }
    var opts = tmpEd.opt ? tmpEd.opts.filter(function(o) {
        return String(o.t).trim();
    }).map(function(o) {
        return {
            t: String(o.t).trim(),
            c: o.c
        };
    }) : [];
    var d = tagDefs().slice();
    d.push({
        k: tagKeyOf_(),
        t: String(tmpEd.t).trim(),
        team: false,
        tmp: true,
        opts: opts.length ? opts : undefined
    });
    tmpEd = null;
    saveTagDefs(d);
}

function tmpEdHtml() {
    if (!tmpEd) return "";
    return '<div class="adm-card tmp-ed"><div class="fld"><label class="label" for="tmp-t">' + esc(UI.tmpAsk) + "</label>" + '<input id="tmp-t" type="text" value="' + esc(tmpEd.t) + '" oninput="tmpEdSet(\'t\',this.value)"></div>' + '<div class="wantbar" onclick="tmpEdSet(\'opt\',' + !tmpEd.opt + ')"><div><b>' + esc(UI.tmpOptQ) + "</b><span>" + esc(UI.tmpOptSub) + '</span></div><button class="sw' + (tmpEd.opt ? " on" : "") + '" aria-label="' + esc(UI.tmpOptQ) + '"></button></div>' + (tmpEd.opt ? tmpEd.opts.map(function(o, i) {
        return '<div class="tmp-o"><input type="text" value="' + esc(o.t) + '" placeholder="' + esc(UI.tmpOptPh) + '" oninput="tmpOptSet(' + i + ",'t',this.value)\">" + TMP_COLORS.map(function(c) {
            var dc = "k-" + c + (o.c === c ? " on" : "");
            return '<button class="tmp-dot ' + dc + '" aria-label="' + c + '" onclick="tmpOptSet(' + i + ",'c','" + c + "')\"></button>";
        }).join("") + '<button class="ce-x" onclick="tmpOptDel(' + i + ')" aria-label="✕">✕</button></div>';
    }).join("") + '<button class="yr-c" onclick="tmpOptAdd()">' + esc(UI.tmpOptAdd) + "</button>" : "") + '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn p" style="margin:0" onclick="tmpSave()">' + esc(UI.tmpSave) + '</button><button class="btn g" style="margin:0" onclick="tmpEd=null;renderCalls()">' + esc(UI.tmpCancel) + "</button></div></div>";
}

function tmpDrop(k) {
    var t = tagDefs().filter(function(x) {
        return x.k === k;
    })[0];
    if (!t || !confirm(fill(UI.tmpDropAsk, {
        t: t.t
    }))) return;
    var l = contacts();
    l.forEach(function(c) {
        if (c.tags) delete c.tags[k];
    });
    saveContacts(l);
    saveTagDefs(tagDefs().filter(function(x) {
        return x.k !== k;
    }));
    pushCalls(1);
}

function tmpBar() {
    var tm = tmpDefs();
    return '<div class="yr-bar"><b>' + esc(UI.tmpH) + "</b>" + tm.map(function(t) {
        var n = contacts().filter(function(c) {
            return tagOn(c, t.k);
        }).length;
        return '<span class="yr-c on">' + esc(t.t) + " · " + n + " <button onclick=\"tmpDrop('" + esc(t.k) + '\')" aria-label="' + esc(fill(UI.tmpDropAsk, {
            t: t.t
        })) + '">✕</button></span>';
    }).join("") + '<button class="yr-c" onclick="tmpAdd()">' + esc(UI.tmpAdd) + "</button></div>";
}

function callDue(i, v) {
    var l = contacts();
    if (!l[i]) return;
    if (!l[i].tags) l[i].tags = {};
    if (v) l[i].tags.__due = v; else delete l[i].tags.__due;
    l[i].at = (new Date).toISOString();
    jnl(l[i]);
    saveContacts(l);
    pushCalls();
    if (v) {
        rmNew = {
            date: v,
            time: "09:00",
            text: l[i].name + " - " + (l[i].upd || UI.callDueTxt)
        };
        rmAdd();
    }
    if (document.querySelector("#adm-pane #calls-body")) renderCalls();
}

function callDueDone(i) {
    callDue(i, "");
    admPane();
}

function callsDue() {
    var today = rmToday();
    return contacts().map(function(c, i) {
        return {
            c: c,
            i: i
        };
    }).filter(function(o) {
        var d = o.c.tags && o.c.tags.__due;
        return d && d <= today;
    });
}
