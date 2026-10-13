function orderRows() {
    return '<div class="order-rows">' + TRACKS.map(function(t) {
        return '<div class="order-track"><div class="mtitle">מסכת ' + esc(t.masechet) + "</div>" + '<div style="display:grid;gap:9px">' + SFARIM.map(function(s) {
            return numRow(qk(t.id, s.id), s.name, shek(priceOf(s.id).price) + " לחוברת");
        }).join("") + "</div></div>";
    }).join("") + "</div>";
}

function regTotal() {
    var picked = SFARIM.filter(function(s) {
        return sefTotal(s.id) > 0;
    });
    if (!picked.length) return '<p class="order-empty">בחרו כמויות כדי לראות את סיכום ההזמנה.</p>';
    var sum = 0, save = 0;
    picked.forEach(function(s) {
        var n = sefTotal(s.id), p = priceOf(s.id);
        sum += n * p.price;
        save += n * (p.list - p.price);
    });
    return '<div class="total"><span>' + regTotalQty() + ' גמרות</span><div class="n">' + shek(sum) + "</div>" + (save ? '<div class="t">' + fill(UI.saving, {
        sum: shek(save)
    }) + "</div>" : "") + "</div>";
}

function sizeLive() {
    return CV("sizeOn") === true;
}

function sizeRow() {
    if (!sizeLive()) return "";
    return '<div class="sizebox"><div class="lbl">' + esc(UI.sizeLabel) + "</div>" + '<div class="side"><div class="ctl"><button onclick="sizeStep(-5)">−</button>' + '<input type="tel" id="r-size" value="' + (reg.size || 0) + '" onchange="sizeSet(this.value)">' + '<button onclick="sizeStep(5)">+</button></div>' + '<div class="unit">' + esc(UI.sizeUnit) + "</div></div>" + (UI.sizeAim ? '<p class="aim">' + esc(UI.sizeAim) + "</p>" : "") + '<p class="hint">' + esc(UI.sizeHint) + "</p></div>";
}

function masOn(id) {
    return (reg.mas || []).indexOf(id) >= 0;
}

function masTog(id) {
    regEdited();
    var l = (reg.mas || []).slice(), i = l.indexOf(id);
    if (i < 0) l.push(id); else l.splice(i, 1);
    reg.mas = l;
    renderReg();
}

function masRow() {
    return '<div class="masbox"><div class="lbl">' + esc(UI.masLabel) + "</div>" + '<div class="mascards" role="group" aria-label="' + esc(UI.masLabel) + '">' + TRACKS.map(function(t) {
        var on = masOn(t.id);
        return '<button id="r-mas-' + t.id + '" aria-pressed="' + String(on) + '" class="mascard' + (on ? " on" : "") + '" onclick="masTog(\'' + t.id + "')\">" + '<span class="v">' + (on ? "✓" : "") + "</span>" + "<b>מסכת " + esc(t.masechet) + "</b>" + "<small>" + t.dapim + " דפים</small></button>";
    }).join("") + "</div>" + '<p class="hint">' + esc(UI.masHint) + "</p></div>";
}

function byLine() {
    var d = CV("orderBy") != null ? CV("orderBy") : ORDER_BY;
    if (!d) return "";
    var t = new Date(String(d) + "T00:00:00");
    if (isNaN(t)) return "";
    return '<div class="byline">' + esc(fill(UI.orderBy, {
        date: t.getDate() + "." + (t.getMonth() + 1) + "." + t.getFullYear()
    })) + "</div>";
}

function foldEl() {
    return document.getElementById("r-fold");
}

function foldInit() {
    var f = foldEl();
    if (!f) return;
    var sw = document.getElementById("r-wantsw");
    if (sw) { sw.className = reg.want ? "sw on" : "sw"; sw.setAttribute("aria-checked", String(!!reg.want)); }
    f.inert = !reg.want;
    f.setAttribute("aria-hidden", String(!reg.want));
    f.style.transition = "none";
    f.style.maxHeight = reg.want ? "none" : "0";
    void f.offsetHeight;
    f.style.transition = "";
}

function wantToggle(e) {
    if (regSending) return;
    regEdited();
    if (e) e.stopPropagation();
    reg.want = !reg.want;
    var f = foldEl(), sw = document.getElementById("r-wantsw");
    if (sw) { sw.className = reg.want ? "sw on" : "sw"; sw.setAttribute("aria-checked", String(!!reg.want)); }
    if (!f) return;
    f.inert = !reg.want;
    f.setAttribute("aria-hidden", String(!reg.want));
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        f.style.maxHeight = reg.want ? "none" : "0";
        return;
    }
    if (reg.want) {
        f.style.maxHeight = f.scrollHeight + "px";
        setTimeout(function() {
            if (reg.want) f.style.maxHeight = "none";
        }, 320);
    } else {
        f.style.maxHeight = f.scrollHeight + "px";
        void f.offsetHeight;
        f.style.maxHeight = "0";
    }
}

function sizeSet(v) {
    regEdited();
    reg.size = Math.max(0, parseInt(v, 10) || 0);
    renderReg();
}

function sizeStep(d) {
    sizeSet((reg.size || 0) + d);
}

function numRow(id, label, sub) {
    return '<div class="num"><label class="lbl" for="r-' + id + '">' + esc(label) + "<small>" + esc(sub) + "</small></label>" + '<div class="ctl"><button aria-label="' + esc("הפחתת כמות " + label) + '" onclick="qtyStep(\'' + id + "',-5)\">−</button>" + '<input type="tel" inputmode="numeric" id="r-' + id + '" value="' + (reg.qty[id] || 0) + '" oninput="regEdited()" onchange="qtySet(\'' + id + "',this.value)\">" + "<button aria-label=\"" + esc("הגדלת כמות " + label) + "\" onclick=\"qtyStep('" + id + "',5)\">+</button></div></div>";
}

function qtySet(id, v) {
    if (regSending) return;
    regEdited();
    reg.qty[id] = Math.max(0, parseInt(v, 10) || 0);
    var input = document.getElementById("r-" + id);
    if (input) input.value = reg.qty[id];
    var total = document.getElementById("r-total");
    if (total) total.innerHTML = regTotal();
    var books = document.querySelector("#r-fold .order-books");
    if (books) {
        var holder = document.createElement("div");
        holder.innerHTML = recBlocks();
        var next = holder.firstElementChild;
        books.querySelectorAll("details").forEach(function(detail, i) {
            var previews = next.querySelectorAll("details");
            if (previews[i]) previews[i].open = detail.open;
        });
        books.replaceWith(next);
    }
    TRACKS.forEach(function(track) {
        SFARIM.forEach(function(sefer) {
            var label = document.querySelector('label[for="r-' + qk(track.id, sefer.id) + '"] small');
            if (label) label.textContent = shek(priceOf(sefer.id).price) + " לחוברת";
        });
    });
    var fold = foldEl();
    if (fold && reg.want && fold.style.maxHeight !== "none") fold.style.maxHeight = fold.scrollHeight + "px";
    var error = document.getElementById("r-err3");
    if (error) error.hidden = true;
}

function qtyStep(id, d) {
    qtySet(id, (reg.qty[id] || 0) + d);
}

function regSet(k, v) {
    regEdited();
    reg[k] = v;
    if (k === "inst") renderReg();
}

function pickInst() {
    var items = INSTITUTIONS.map(function(i) {
        return {
            v: i.code,
            t: i.name
        };
    });
    items.push({
        v: "other",
        t: "ישיבה אחרת…"
    });
    pick("הישיבה שלנו", items, reg.inst, function(v) {
        regSet("inst", v);
    });
}

var regSending = false, regAccepted = false, regRequest = null;
function regEdited() {
    if (!regAccepted) return;
    regAccepted = false;
    var button = document.getElementById("r-send"), status = document.getElementById("r-done");
    if (button) { button.disabled = false; button.className = "btn gr"; button.textContent = UI.update; }
    if (status) status.textContent = "יש שינויים שלא נשלחו.";
}
function regSendingState(pending) {
    regSending = pending;
    document.querySelectorAll("#reg-body input, #reg-body .pk, #reg-body .mascard, #reg-body .ctl button, #r-wantsw").forEach(function(control) { control.disabled = pending; });
    var button = document.getElementById("r-send");
    if (button) { button.disabled = pending; button.classList.toggle("is-busy", pending); }
}
function sendReg() {
    if (regSending) return;
    var name = reg.inst === "other" ? String(reg.instOther || "").trim() : (INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0] || {}).name;
    var e1 = document.getElementById("r-err1"), e3 = document.getElementById("r-err3");
    if (e1) e1.hidden = true;
    if (e3) e3.hidden = true;
    if (!name) {
        if (e1) {
            e1.textContent = "נא לבחור ישיבה.";
            e1.hidden = false;
        }
        regGo(1, document.querySelector("#r-step-1 .pk"));
        return;
    }
    if (!reg.want) reg.qty = {};
    var total = regTotalQty();
    if (reg.want && !total) {
        if (e3) {
            e3.textContent = "נא למלא כמה גמרות להזמין, או לכבות את המתג.";
            e3.hidden = false;
        }
        var qi = document.querySelector("#r-fold input");
        if (qi) qi.focus();
        return;
    }
    var row = INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0];
    var access = instCode(reg.inst);
    if (!access && !(row && row.joined)) {
        access = newAccess();
        setInstCode(reg.inst, access);
    }
    var payload = {
        action: "register",
        inst: name,
        code: reg.inst,
        who: reg.who,
        phone: reg.phone,
        size: reg.size || 0,
        want: reg.want,
        total: total,
        mas: (reg.mas || []).slice(),
        masText: (reg.mas || []).map(function(id) {
            return trackById(id) ? trackById(id).masechet : id;
        }).join(" · "),
        at: (new Date).toISOString()
    };
    TRACKS.forEach(function(t) {
        SFARIM.forEach(function(s) {
            payload[qk(t.id, s.id)] = reg.qty[qk(t.id, s.id)] || 0;
        });
    });
    payload.qty = reg.qty;
    payload.seferName = orderSummary(reg.qty) || "לא נבחר";
    if (access) payload.access = access;
    var identity = JSON.stringify(Object.keys(payload).filter(function(key) { return key !== "at"; }).map(function(key) { return [key, payload[key]]; }));
    if (regRequest && regRequest.identity === identity) payload = regRequest.payload;
    else {
        payload.requestId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
        regRequest = { identity: identity, payload: payload };
    }
    localStorage.setItem("dfReg", JSON.stringify(payload));
    var all = Store.get("registrations", []) || [];
    all = all.filter(function(r) {
        return r.code !== payload.code;
    });
    all.unshift(payload);
    Store.set("registrations", all);
    var txt = 'הרשמה לדף השבועי תשפ"ז\n\n' + "ישיבה: " + name + "\n" + (reg.who ? "ראש החטיבה: " + reg.who + "\n" : "") + (reg.phone ? "טלפון: " + reg.phone + "\n" : "") + (reg.size ? "תלמידים (יעד): " + reg.size + "\n" : "") + (total ? TRACKS.map(function(t) {
        return "מסכת " + t.masechet + ":\n" + SFARIM.map(function(s) {
            return "  " + s.name + ": " + (reg.qty[qk(t.id, s.id)] || 0);
        }).join("\n");
    }).join("\n") + '\nסה"כ גמרות: ' + total : "הזמנת גמרות: לא עכשיו");
    if (API) {
        var sent = {};
        for (var f in payload) sent[f] = payload[f];
        sent.cols = JSON.stringify(regCols(name, total, payload.seferName));
        regSendingState(true);
        document.getElementById("r-send").textContent = "שומרים את ההרשמה…";
        document.getElementById("r-done").textContent = "ממתינים לאישור השליחה.";
        queue(sent, function() {
            if (!regRequest || regRequest.payload.requestId !== sent.requestId) return;
            regSendingState(false);
            regAccepted = true;
            regDone(txt, false);
            setTimeout(function() { codeCheck(sent.code); }, 2500);
        }, function() {
            if (!regRequest || regRequest.payload.requestId !== sent.requestId) return;
            regSendingState(false);
            var button = document.getElementById("r-send"), status = document.getElementById("r-done");
            if (button) button.textContent = "ניסיון שליחה נוסף";
            if (status) status.textContent = "השליחה לא אושרה. ההרשמה נשמרה במכשיר וממתינה לשליחה. אפשר לנסות שוב.";
        });
    } else {
        regDone(txt, true);
    }
}

function regCols(name, total, summary) {
    var cols = [ [ "ישיבה", name ], [ "קוד", reg.inst ], [ "איש קשר", reg.who || "" ], [ "טלפון", reg.phone || "" ], [ "תלמידים (הערכה)", reg.size || "" ], [ "מסכתות", (reg.mas || []).join(",") ] ];
    TRACKS.forEach(function(t) {
        SFARIM.forEach(function(s) {
            cols.push([ t.masechet + " · " + s.name, reg.qty[qk(t.id, s.id)] || 0 ]);
        });
    });
    cols.push([ 'סה"כ גמרות', total ], [ "פירוט", total ? summary : "לא הזמינו גמרות" ]);
    return cols;
}

function joinUrl(code) {
    return location.origin + "/join.html" + (code ? "?inst=" + encodeURIComponent(code) : "");
}

function dadUrl() {
    return joinUrl("") + "?for=dad";
}

function outUrl() {
    return joinUrl("") + "?out=1";
}

function tzevetUrl(code) {
  /* בלי קוד בקישור: הלוח נפתח לפי האישור של הרכז, לא לפי הקוד. */
  return joinUrl(code).replace('join.html', 'tzevet.html');
}

function demoUrl(mode) {
  var U = window.DEMO_UNIT || { mas: 'taanit', daf: 'ב', am: 1 };
  return location.origin + '/lesson-tools' +
         '?mas=' + encodeURIComponent(U.mas) + '&daf=' + encodeURIComponent(U.daf) +
         '&amud=' + U.am + '&' + (mode || 'demo') + '=1';
}

function joinCode() {
    return reg.inst && reg.inst !== "other" ? reg.inst : "";
}

var codeBad = false;

function codeCheck(code) {
  var k = instCode(code), url = (CFG.api || API || '').trim();
  if (!code || !k || !url) return;
  /* הקוד לבד אינו פותח - השרת שואל על האישור של המכשיר. מי שעוד
     לא אושר מאבד את הקוד, ונכנס לתהליך ההמתנה (accCheck). */
  var me = (typeof ASK !== 'undefined' && ASK.get && ASK.get()) || {};
  fetch(url + (url.indexOf('?') < 0 ? '?' : '&') +
        'board=' + encodeURIComponent(code) + '&k=' + encodeURIComponent(k) +
        '&dev=' + encodeURIComponent(me.id || ''))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !/^(denied|wait|locked|unknown)$/.test(d.status)) return;   /* תקין, או שלא נענה */
      var m = Store.get('instCodes', {}) || {};
      delete m[code];
      Store.set('instCodes', m);
      codeBad = d.status === 'denied';
      renderBoard();
      accCheck(true);
    })
    .catch(function () {});           /* אין רשת - לא מסיקים דבר */
}

function boardUrl(code) {
    var u = joinUrl(code).replace("join.html?", "board-tools.html?");
    var k = instCode(code);
    return k ? u + "&k=" + encodeURIComponent(k) : u;
}

function boardBlock() {
    var code = myBoard();
    var inst = INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0];
    if (!inst) return "";
    return '<div style="margin-top:16px">' + boardHtml(code, inst.name) + "</div>";
}

function waHow(txt) {
    txt = (txt || "").trim();
    return txt ? '<p class="wahow">' + esc(txt) + "</p>" : "";
}

function linkBlock(title) {
    var code = joinCode();
    if (!code) return "";
    var name = (INSTITUTIONS.filter(function(i) {
        return i.code === code;
    })[0] || {}).name || "";
    var url = joinUrl(code);
    var wa = fill(UI.linkWa, {
        inst: name,
        url: url
    });
    return '<div class="linkbox">' + "<b>" + esc(fill(title, {
        inst: name
    })) + "</b>" + '<div class="lstep">' + esc(UI.linkStep1) + "</div>" + "<p>" + esc(UI.linkNote) + "</p>" + '<a class="registration-invite" href="' + esc(url) + '">פתיחת ההזמנה לתלמידים</a>' + '<div class="acts">' + '<a class="btn gr" href="https://wa.me/?text=' + encodeURIComponent(wa) + '" ' + 'target="_blank" rel="noopener">' + esc(UI.linkWaBtn) + "</a>" + '<button class="cp" id="lnk-cp" onclick="copyJoin(this)">' + esc(UI.linkCopy) + "</button>" + "</div>" + waHow(UI.waHowKids) + '<div class="lstep">' + esc(UI.linkStep3) + "</div>" + "<p>" + esc(UI.boardNote) + "</p>" + '<a class="btn p" style="margin-top:11px" href="' + esc(boardUrl(code)) + '">' + esc(UI.boardBtn) + "</a>" + "</div>";
}

function copyAny(btn, url) {
    var mark = function() {
        var was = btn.textContent;
        btn.textContent = UI.linkCopied;
        setTimeout(function() {
            btn.textContent = was;
        }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(mark).catch(function() {
            legacyCopy(url, mark);
        });
    } else legacyCopy(url, mark);
}

function copyJoin(btn, code) {
    code = code || joinCode();
    if (!code) return;
    var url = joinUrl(code);
    var mark = function() {
        var was = btn.textContent;
        btn.textContent = UI.linkCopied;
        setTimeout(function() {
            btn.textContent = was;
        }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(mark).catch(function() {
            legacyCopy(url, mark);
        });
    } else legacyCopy(url, mark);
}
