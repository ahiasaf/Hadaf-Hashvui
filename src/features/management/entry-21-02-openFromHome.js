function openFromHome(i) {
    var w = contentFor(homeTrack);
    openWeek(homeTrack, w.i);
    deckOpen(i);
}

var reg = {
    inst: "",
    instOther: "",
    who: "",
    phone: "",
    who2: "",
    phone2: "",
    size: 0,
    want: null,
    qty: {}
};

function regSaved() {
    try {
        return JSON.parse(localStorage.getItem("dfReg") || "null");
    } catch (e) {
        return null;
    }
}

function regReset() {
    localStorage.removeItem("dfReg");
    reg = {
        inst: "",
        instOther: "",
        who: "",
        phone: "",
        who2: "",
        phone2: "",
        size: 0,
        want: null,
        qty: {}
    };
    renderReg();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function sefTotal(sefer, q) {
    q = q || reg.qty;
    return TRACKS.reduce(function(a, t) {
        return a + (q[qk(t.id, sefer)] || 0);
    }, 0);
}

function regTotalQty(q) {
    return SFARIM.reduce(function(a, s) {
        return a + sefTotal(s.id, q);
    }, 0);
}

function regMigrate(saved) {
    var q = {};
    if (saved.qty) {
        var flat = false;
        for (var k in saved.qty) {
            if (k.indexOf("-") < 0) flat = true;
        }
        if (!flat) return saved.qty;
        SFARIM.forEach(function(s) {
            if (saved.qty[s.id]) q[qk(TRACKS[0].id, s.id)] = saved.qty[s.id];
        });
        return q;
    }
    if (saved.sefer && saved.sefer !== "later") {
        if (saved.z) q[qk("taanit", saved.sefer)] = saved.z;
        if (saved.ch) q[qk("megila", saved.sefer)] = saved.ch;
    }
    return q;
}

var regPreSkip = false;

function regPreNeeded() {
    if (regPreSkip) return false;
    return !!(window.APPX && APPX.isIOS() && !APPX.standalone());
}

function renderRegPre() {
    var el = document.getElementById("reg-body");
    if (!el) return;
    var h = '<div class="mycard">';
    if (window.APPX && APPX.iosOther && APPX.iosOther()) {
        h += '<div class="cond"><b>' + esc(ASK_UI.iosOthH) + "</b><br>" + esc(ASK_UI.iosOthB) + "</div>" + '<button class="btn g" style="margin-top:12px;width:100%" ' + 'onclick="copyAny(this, location.href)">' + esc(UI.preCopy) + "</button></div>";
        el.innerHTML = h;
        return;
    }
    if (window.APPX && (APPX.inApp() || APPX.stuck && APPX.stuck())) {
        var br = APPX.toBrowser ? APPX.toBrowser() : "";
        h += '<div class="cond"><b>' + esc(ASK_UI.inAppH) + "</b><br>" + esc(ASK_UI.inAppB) + " " + esc(APPX.isIOS() ? ASK_UI.inAppIos : ASK_UI.inAppNot) + "</div>" + (br ? '<a class="btn b" style="margin-top:12px;width:100%;' + "display:block;text-align:center;text-decoration:none;" + 'box-sizing:border-box" href="' + esc(br) + '">' + esc(ASK_UI.openGo) + "</a>" : "") + '<button class="btn g" style="margin-top:12px;width:100%" ' + 'onclick="copyAny(this, location.href)">' + esc(UI.preCopy) + "</button></div>";
        el.innerHTML = h;
        return;
    }
    var inTrip = window.TRIP_UI && TRIP_UI.on() || /[?&]masa=1(&|$)/i.test(location.search);
    h += (APPX.waBox ? APPX.waBox() : "") + '<div id="reg-gu"></div>' + (inTrip ? "" : '<button class="btn g pnl" id="reg-pre-skip" style="margin-top:14px">' + esc(UI.preSkip) + "<small>" + esc(UI.preSkipSub) + "</small></button>") + "</div>";
    el.innerHTML = h;
    if (window.GUIDE_UI) {
        GUIDE_UI.force(null);
        GUIDE_UI.mount(document.getElementById("reg-gu"), function() {
            renderRegPre();
        });
    }
    var sk = document.getElementById("reg-pre-skip");
    if (sk) sk.onclick = function() {
        regPreSkip = true;
        renderReg();
    };
}

if (window.APPX && APPX.onStuck) APPX.onStuck(function() {
    renderReg();
});

function regDupWarn() {
    if (!reg.inst || reg.inst === "other") return false;
    if (instCode(reg.inst)) return false;
    var row = INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0];
    return !!(row && row.joined);
}

function renderReg() {
    if (regPreNeeded()) {
        renderRegPre();
        return;
    }
    var saved = regSaved();
    if (!saved && !reg.inst && urlInst) reg.inst = urlInst;
    if (saved && !reg.inst) {
        reg.inst = saved.code || "";
        reg.who = saved.who || "";
        reg.phone = saved.phone || "";
        reg.who2 = saved.who2 || "";
        reg.phone2 = saved.phone2 || "";
        reg.size = saved.size || 0;
        if (saved.mas && saved.mas.length) reg.mas = saved.mas;
        reg.qty = regMigrate(saved);
        reg.want = saved.want != null ? !!saved.want : regTotalQty(reg.qty) > 0;
        reg.instOther = saved.instOther || "";
    }
    var instName = reg.inst === "other" ? "ישיבה אחרת" : (INSTITUTIONS.filter(function(i) {
        return i.code === reg.inst;
    })[0] || {}).name || "";
    var whoBlock = '<div class="foldh" id="r-who-step" style="margin-top:22px">' + esc(UI.s4) + "</div>" + pkField("", instName, UI.instLabel, "pickInst()") + '<div class="fld" id="r-other" style="display:' + (reg.inst === "other" ? "block" : "none") + '">' + '<input type="text" id="r-otherName" placeholder="שם הישיבה" value="' + esc(reg.instOther) + '" onchange="regSet(\'instOther\',this.value)"></div>';
    var h = (saved ? "" : stuHint()) + fitBlock() + whoBlock + sizeRow() + masRow() + (saved ? '<p class="jump">' + esc(UI.savedNote) + " · " + '<a href="#" onclick="jumpTo(\'r-who-step\');return false">' + esc(UI.savedGo) + "</a> · " + '<a href="#" onclick="regReset();return false">' + esc(UI.savedNew) + "</a></p>" : "") + (saved || myBoard() ? boardBlock() : '<p class="jump"><a href="#" onclick="boardBack();return false">' + esc(UI.cbBack) + "</a></p>") + (UI.orderNote ? '<p class="nooblig">' + esc(UI.orderNote) + "</p>" : "") + '<div class="wantbar" id="r-wantbar" onclick="wantToggle(event)">' + "<div><b>" + esc(UI.s2) + "</b><span>" + esc(UI.wantSub) + "</span></div>" + '<button class="sw" id="r-wantsw" onclick="wantToggle(event)" ' + 'aria-label="' + esc(UI.s2) + '"></button>' + "</div>" + '<div class="fold" id="r-fold"><div>' + recBlocks() + '<div class="foldh">' + esc(UI.s3) + "</div>" + '<p style="font-size:.85rem;color:var(--ink-2);font-weight:600;margin-bottom:11px;' + 'line-height:1.6">' + esc(UI.hint) + "</p>" + '<p class="two-m">' + esc(UI.twoM) + "</p>" + byLine() + orderRows() + regTotal() + "</div></div>" + (regDupWarn() ? '<div class="cond" id="r-dup" style="margin-top:16px">' + esc(UI.regDup) + "</div>" : "") + '<button class="btn gr" id="r-send" style="margin-top:20px" ' + 'onclick="sendReg()">' + esc(saved ? UI.update : UI.send) + "</button>" + '<div id="r-done"></div>' + '<div id="head-next"></div>';
    document.getElementById("reg-body").innerHTML = h;
    foldInit();
}

var FIT_ICONS = {
    group: '<circle cx="5" cy="8.4" r="2.2"/><circle cx="12" cy="8.4" r="2.2"/>' + '<circle cx="19" cy="8.4" r="2.2"/>' + '<path d="M1.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>' + '<path d="M8.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>' + '<path d="M15.7 19.2c0-2.4 1.5-4 3.3-4s3.3 1.6 3.3 4"/>',
    pair: '<circle cx="7.5" cy="6.2" r="2.6"/><circle cx="16.8" cy="10.4" r="2.1"/>' + '<path d="M3.4 19.6c0-2.9 1.8-4.8 4.1-4.8s4.1 1.9 4.1 4.8"/>' + '<path d="M13.4 19.6c0-2.2 1.5-3.6 3.4-3.6s3.4 1.4 3.4 3.6"/>',
    solo: '<circle cx="12" cy="5.6" r="2.5"/>' + '<path d="M8.4 12.4c.5-1.7 1.9-2.7 3.6-2.7s3.1 1 3.6 2.7"/>' + '<path d="M3.6 15.2h6.2c1.2 0 2.2.7 2.2 1.6 0-.9 1-1.6 2.2-1.6h6.2v4.4h-6.2' + 'c-1.2 0-2.2.7-2.2 1.6 0-.9-1-1.6-2.2-1.6H3.6z"/>'
};

var fitRan = false;

function fitBlock() {
    var rise = fitRan ? "" : " rise";
    fitRan = true;
    return '<div class="fit' + rise + '"><b>' + esc(FIT.title) + "</b>" + "<ul>" + FIT.items.map(function(f) {
        return '<li><i><svg viewBox="0 0 24 24" aria-hidden="true">' + (FIT_ICONS[f.icon] || "") + "</svg></i><span>" + esc(f.t) + "</span></li>";
    }).join("") + "</ul>" + (FIT.sub ? "<p>" + esc(FIT.sub) + "</p>" : "") + "</div>";
}

function recBlocks() {
    var img = function(s, pic, cls) {
        return '<img loading="lazy" class="' + cls + '" src="' + esc(pic.src) + '" alt="' + esc(s.name) + '" onclick="zoom(\'' + esc(pic.src) + "','" + esc(pic.hi || "") + "')\">";
    };
    return '<div style="display:grid;gap:13px">' + SFARIM.map(function(s) {
        var p = priceOf(s.id), pics = s.pics || [];
        var cover = pics.filter(function(q) {
            return q.small;
        })[0];
        var open = pics.filter(function(q) {
            return !q.small;
        });
        return '<div class="rec ' + s.tone + '">' + '<div class="head"><p>' + s.rec + "</p>" + (cover ? img(s, cover, "cover") : "") + "</div>" + (open.length ? '<div class="pics">' + open.map(function(q) {
            return img(s, q, "");
        }).join("") + "</div>" : "") + '<div class="pr"><b>' + shek(p.price) + "</b> לחוברת" + (p.off ? " <s>" + shek(p.list) + "</s>" : "") + "</div>" + (p.off ? condNote(s.name, p.min) : "") + "</div>";
    }).join("") + "</div>";
}

function zoom(base, hi) {
    var o = document.getElementById("zoom"), im = o.querySelector("img");
    im.src = base;
    o.scrollTop = 0;
    o.scrollLeft = 0;
    o.classList.add("on");
    if (hi && hi !== base) {
        var pre = new Image;
        pre.onload = function() {
            if (o.classList.contains("on")) im.src = hi;
        };
        pre.src = hi;
    }
}

function zoomClose() {
    document.getElementById("zoom").classList.remove("on");
}

function jumpTo(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function qk(track, sefer) {
    return track + "-" + sefer;
}

function orderSummary(q) {
    return TRACKS.map(function(t) {
        var parts = SFARIM.filter(function(s) {
            return q[qk(t.id, s.id)] > 0;
        }).map(function(s) {
            return q[qk(t.id, s.id)] + " " + s.name;
        });
        return parts.length ? "מסכת " + t.masechet + ": " + parts.join(", ") : "";
    }).filter(Boolean).join(" · ");
}
