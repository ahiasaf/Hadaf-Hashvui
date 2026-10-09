function dkPdfMsg(cls, t) {
    var h = '<p class="h" style="margin-top:8px' + (cls === "ok" ? ";color:var(--ok)" : cls === "bad" ? ";color:var(--stop)" : "") + '">' + esc(t) + "</p>";
    var all = document.querySelectorAll(".dk-msg");
    for (var i = 0; i < all.length; i++) all[i].innerHTML = h;
}

function dkPdfToggle(i) {
    if (!dkPdf || !dkPdf[i]) return;
    dkPdf[i].sel = dkPdf[i].sel === false ? true : false;
    admPane();
}

function dkPdfSelected() {
    return (dkPdf || []).filter(function(s) {
        return s.sel !== false;
    });
}

function dkPdfAll() {
    var sel = dkPdfSelected();
    sel.forEach(function(s, i) {
        setTimeout(function() {
            var a = document.createElement("a");
            a.href = s.url;
            a.download = s.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }, i * 350);
    });
}

function dkPutAll(items, done) {
    var i = 0, sent = [];
    function one() {
        if (i >= items.length) {
            dkAskUntil(sent, 0, done);
            return;
        }
        var it = items[i++];
        dkPdfMsg("", "שולח " + i + " מתוך " + items.length + "…");
        fetch(API, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "ghput",
                key: CFG.readKey || "",
                path: dkDir + "/" + it.name,
                b64: it.url.split(",")[1],
                msg: "שקף " + it.name + " · " + dkDir
            })
        }).catch(function() {}).then(function() {
            sent.push(it.name);
            setTimeout(one, 400);
        });
    }
    one();
}

function dkAskUntil(want, tries, done) {
    dkPdfMsg("", "מעלה את השקפים…");
    fetch("https://api.github.com/repos/" + REPO + "/contents/" + dkDir.split("/").map(encodeURIComponent).join("/") + "?ref=main&t=" + Date.now()).then(function(r) {
        return r.ok ? r.json() : [];
    }).then(function(j) {
        var have = {};
        (j || []).forEach(function(f) {
            have[f.name] = 1;
        });
        var miss = want.filter(function(n) {
            return !have[n];
        });
        if (!miss.length) {
            done(null);
            return;
        }
        if (tries < 5) {
            setTimeout(function() {
                dkAskUntil(want, tries + 1, done);
            }, 2200);
            return;
        }
        done(miss);
    }).catch(function() {
        if (tries < 5) {
            setTimeout(function() {
                dkAskUntil(want, tries + 1, done);
            }, 2200);
            return;
        }
        done(want);
    });
}

function dkUpload(items) {
    if (!API) {
        dkPdfMsg("bad", "אין כתובת שרת במכשיר הזה.");
        return;
    }
    if (!CFG.readKey) {
        dkPdfMsg("bad", "צריך סיסמת סקריפט במכשיר - ניהול ← מערכת.");
        return;
    }
    if (dkPool) {
        var clash = items.filter(function(it) {
            return dkPool.indexOf(it.name) >= 0;
        }).map(function(it) {
            return it.name;
        });
        if (clash.length) {
            var live = clash.filter(function(nm) {
                return dkList.indexOf(dkDir + "/" + nm) >= 0 || dkList.indexOf(nm) >= 0;
            });
            var warn = "שקפים בשמות האלה כבר קיימים לשבוע הזה ויוחלפו: " + clash.join(", ") + "." + (live.length ? " חלקם במצגת החיה עכשיו - תלמיד שכבר פתח את הדף הזה עלול " + "להמשיך לראות אצלו את הגרסה הישנה גם אחרי הדריסה, כי המכשיר " + "שלו לא בודק אם השקף השתנה." : "") + " אם אתם מחליפים שקף בכוונה - עדיף להעלות בשם קובץ חדש ולהחליף " + "ברשימת הסדר, כדי שזה יגיע לכולם מיד. להמשיך ולדרוס בכל זאת?";
            if (!window.confirm(warn)) {
                dkPdfMsg("", "בוטל - שום דבר לא נשלח.");
                return;
            }
        }
    }
    dkPutAll(items, function(miss) {
        if (!miss) {
            dkPdf = null;
            var names = items.map(function(it) {
                return it.name;
            });
            dkPool = (dkPool || []).concat(names.filter(function(n) {
                return (dkPool || []).indexOf(n) < 0;
            })).sort();
            names.forEach(function(n) {
                dkAddSilent_(n);
            });
            dkBust = Date.now();
            dkStash();
            admPane();
            dkPdfMsg("ok", "הועלו " + items.length + " שקפים ונוספו למצגת · שבוע " + dkSel.wk + ". אפשר לסדר אותם ברשימה שלמעלה.");
            dkAsk();
            dkAutoSave_();
            return;
        }
        dkPdfMsg("bad", "לא הגיעו: " + miss.join(", ") + " - צריך GH_TOKEN " + "ו-GH_REPO במאפייני הסקריפט, וגרסת סקריפט 26 ומעלה " + "(מערכת ← בדיקת חיבור).");
    });
}

function dkImgPick(inp) {
    var fs = inp.files;
    if (!fs || !fs.length) return;
    var items = [], n = 0;
    function next() {
        if (n >= fs.length) {
            dkUpload(items);
            return;
        }
        var f = fs[n++];
        var nm = f.name.replace(/[^\w.\-]/g, "_");
        ImgShrink(f, function(sm) {
            if (sm) {
                items.push({
                    name: nm.replace(/\.[^.]*$/, "") + "." + sm.ext,
                    url: sm.url
                });
                next();
                return;
            }
            var r = new FileReader;
            r.onload = function() {
                items.push({
                    name: nm,
                    url: r.result
                });
                next();
            };
            r.onerror = function() {
                next();
            };
            r.readAsDataURL(f);
        });
    }
    dkPdfMsg("", "קורא " + fs.length + " קבצים…");
    next();
}

function admDecks(el) {
    if (!dkSel) {
        dkSel = {
            mas: homeTrack,
            wk: Math.max(1, weekOf(trackById(homeTrack)) + 1)
        };
        dkLoadSel();
        dkAsk();
    }
    var tr = trackById(dkSel.mas);
    var row = tr.cal[dkSel.wk - 1] || [ "", "", "" ];
    var why = dkmWhy(dkSel.mas);
    var h = '<div class="adm-card" style="margin-bottom:11px"><h4>המצגת של השבוע</h4>' + '<p class="h">אילו שקפים, ובאיזה סדר. כל שינוי נשמר ומתפרסם לבד.</p>' + '<div class="tabs" style="margin-bottom:10px">' + TRACKS.map(function(x) {
        return '<button class="' + (x.id === dkSel.mas ? "on" : "") + '" onclick="dkGo(\'' + x.id + "'," + dkSel.wk + ')">' + esc(x.masechet) + "</button>";
    }).join("") + "</div>" + '<div class="fld"><div class="label">שבוע</div>' + "<select onchange=\"dkGo('" + dkSel.mas + "',+this.value)\">" + tr.cal.map(function(r, k) {
        if (!r[2] || r[2] === "סיום") return "";
        return '<option value="' + (k + 1) + '"' + (k + 1 === dkSel.wk ? " selected" : "") + ">" + (why[k + 1] ? "⚠ " : "") + "שבוע " + (k + 1) + " · " + esc(r[1]) + " · דף " + esc(rowDaf(r)) + "</option>";
    }).join("") + "</select></div>" + (why[dkSel.wk] ? '<p class="dkm-why">⚠ ' + esc(why[dkSel.wk]) + "</p>" : "") + '<div class="dk-top">' + '<button class="btn p" onclick="document.getElementById(\'dk-img\').click()">🖼 ' + esc(UI.dkUpImg) + "</button>" + '<button class="btn p" onclick="document.getElementById(\'dk-pdf\').click()">📄 ' + esc(UI.dkUpPdf) + "</button>" + '<a class="btn g" href="learn.html?mas=' + dkSel.mas + "&" + LDafQ(dkSel.mas, dkSel.wk - 1) + '&from=home">↗ ' + esc(UI.dkmLearn) + "</a></div>" + '<input type="file" id="dk-img" accept="image/*" multiple hidden onchange="dkImgPick(this)">' + '<input type="file" id="dk-pdf" accept="application/pdf,.pdf" hidden onchange="dkPdfPick(this)">' + '<div class="dk-msg"></div>' + '<div id="dk-msg"></div></div>';
    var nSel = dkSlSel().length;
    h += '<div class="adm-card" style="margin-bottom:11px">' + '<h4 class="dkm-hd">הסדר · ' + dkList.length + " שקפים" + (dkList.length ? '<button class="dkm-lnk" id="dk-slall" onclick="dkSlAll()">' + esc(nSel === dkList.length ? UI.dkmClear : UI.dkmPickAll) + "</button>" : "") + "</h4>" + (dkList.length ? '<p class="h">' + esc(UI.dkmTapH) + "</p>" : "");
    if (!dkList.length) {
        h += '<p class="h">אין עדיין שקפים במצגת של שבוע זה. הוסיפו מהרשימה שלמטה.</p>';
    } else {
        h += dkList.map(function(f, i) {
            var on = !!dkSlPick[dkPath(f)];
            return '<div class="row dk-drow' + (on ? " dkm-on" : "") + '" data-i="' + i + '" style="align-items:center;gap:9px">' + '<span class="dk-grip" onpointerdown="dkDragStart(event,' + i + ')" aria-label="' + esc(UI.dkmDrag) + '" role="button">⋮⋮</span>' + '<span style="font-weight:800;width:1.6em;text-align:center">' + (i + 1) + "</span>" + '<button class="dkm-sl" data-i="' + i + '" aria-pressed="' + on + '" aria-label="' + (i + 1) + '" onclick="dkSlTap(' + i + ')">' + '<img loading="lazy" src="' + esc(dkPath(f)) + "?adm=" + dkBust + '" alt="">' + (on ? "<i>✓</i>" : "") + "</button>" + '<span style="flex:1"></span>' + '<button class="dk-ic" onclick="dkUp(' + i + ')"' + (i === 0 ? " disabled" : "") + ' aria-label="העלאה">↑</button>' + '<button class="dk-ic" onclick="dkDown(' + i + ')"' + (i === dkList.length - 1 ? " disabled" : "") + ' aria-label="הורדה">↓</button>' + '<a class="dk-ic" href="' + esc(dkPath(f)) + '" download="' + esc(dkShort(f).split("/").pop()) + '" aria-label="הורדה למכשיר לעריכה">⇩</a>' + '<button class="dk-ic warn" onclick="dkDel(' + i + ')" aria-label="הסרה">✕</button>' + "</div>";
        }).join("");
    }
    h += '<div id="dk-slbar">' + dkSlBar() + "</div>";
    h += "</div>";
    var rest = (dkPool || []).filter(function(f) {
        return dkList.indexOf(dkDir + "/" + f) < 0 && dkList.indexOf(f) < 0;
    });
    if (rest.length) {
        h += '<div class="adm-card" style="margin-bottom:11px"><h4>שקפים שהוסרו מהמצגת</h4>' + '<p class="h">הועלו לשבוע הזה ואינם במצגת. "הוספה" מחזירה שקף לסוף הרשימה.</p>' + rest.map(function(f) {
            return '<div class="row" style="align-items:center;gap:9px">' + '<img loading="lazy" src="' + esc(dkDir + "/" + f) + "?adm=" + dkBust + '" alt="" ' + 'style="width:88px;height:50px;object-fit:cover;border-radius:6px;' + 'border:1px solid var(--rule);background:var(--sunk)">' + '<span style="flex:1"></span>' + '<button class="btn g" style="width:auto;flex:none;padding:9px 16px" ' + "onclick=\"dkAdd('" + esc(f) + "')\">הוספה +</button>" + '<button class="dk-ic warn" onclick="dkRm(\'' + esc(f) + "')\" " + 'title="' + esc(UI.dkRm) + '" aria-label="' + esc(UI.dkRm) + '">🗑</button>' + "</div>";
        }).join("") + '<div id="dk-rm-msg"></div></div>';
    }
    if (dkPdf && dkPdf.length) h += '<div class="adm-card" style="margin-bottom:11px">' + "<h4>" + esc(UI.dkPdfH) + "</h4>";
    if (dkPdf && dkPdf.length) {
        var dkSelN = dkPdfSelected().length;
        h += '<button class="btn gd" style="margin-top:8px" ' + (dkSelN ? 'onclick="dkUpload(dkPdfSelected())"' : "disabled") + ">" + "הוספת " + dkSelN + " השקפים למצגת ←</button>" + '<p class="h" style="margin:6px 0 10px">או לשמור אותם במכשיר:</p>' + '<button class="btn g" ' + (dkSelN ? 'onclick="dkPdfAll()"' : "disabled") + ">" + "הורדת " + dkSelN + " השקפים למכשיר</button>" + '<p class="h" style="margin-top:10px">לחצו על שקף כדי לכלול או ' + "להוציא אותו - לא כל עמוד ב-PDF הוא שקף שרוצים.</p>" + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;' + 'margin-top:6px">' + dkPdf.map(function(sl, i) {
            var on = sl.sel !== false;
            return '<div onclick="dkPdfToggle(' + i + ')" role="button" tabindex="0" ' + "onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();" + "dkPdfToggle(" + i + ')}" aria-pressed="' + (on ? "true" : "false") + '" style="cursor:pointer;text-align:center;opacity:' + (on ? "1" : ".35") + '">' + '<div style="position:relative">' + '<img src="' + sl.url + '" alt="" style="width:100%;border-radius:6px;' + 'border:1px solid var(--rule)">' + (on ? '<span style="position:absolute;top:4px;left:4px;background:' + "var(--gold, #C08F2B);color:#fff;border-radius:50%;width:20px;height:20px;" + "display:flex;align-items:center;justify-content:center;font-size:.7rem;" + 'font-weight:800">✓</span>' : "") + "</div>" + '<span dir="ltr" style="display:block;font-size:.68rem;' + 'color:var(--ink-3);font-weight:800">' + esc(sl.name) + "</span></div>";
        }).join("") + "</div>";
    }
    if (dkPdf && dkPdf.length) h += "</div>";
    h += '<div class="adm-card" style="margin-bottom:11px"><div class="fld"><label class="label" for="dk-ttl">הכותרת בבאנר הכחול' + ' <span style="font-weight:700;color:var(--ink-3)">· ריק = "דף ' + esc(rowDaf(row)) + '"</span></label>' + '<input type="text" id="dk-ttl" value="' + esc(dkTitle) + '" placeholder="למשל: מאימתי מזכירין גבורות גשמים" ' + 'onchange="dkSetTitle(this.value)"></div></div>';
    if (!opAsked) {
        opAsked = true;
        OpenLoad().then(function() {
            admPane();
        });
    }
    var ti = TRACKS.indexOf(tr), wi = dkSel.wk - 1, am = OpenAm(row), isOpen = row[2] && OpenIs(tr.id, row[2], am);
    h += '<div class="adm-card dk-open" style="margin-bottom:11px"><h4>' + esc(UI.dkOpenH) + "</h4>";
    if (row[2]) {
        h += '<div class="wantbar"' + (opBusy ? "" : ' onclick="opToggle(' + ti + "," + wi + ')"') + "><div><b>" + esc(fill(UI.dkOpenGo, {
            daf: row[2] + LAmMark(am)
        })) + "</b><span>" + esc(isOpen ? fill(UI.dkIsOpen, {
            daf: row[2] + LAmMark(am)
        }) : UI.dkLocked) + "</span></div>" + '<button class="sw' + (isOpen ? " on" : "") + '" aria-pressed="' + !!isOpen + '" aria-label="' + esc(UI.dkOpenH) + '"' + (opBusy ? " disabled" : "") + "></button></div>";
        if (!isOpen) {
            h += "<div class=\"wantbar\" style=\"margin-top:8px\" onclick=\"opAud=opAud==='all'?'wait':'all';admPane()\"><div><b>" + esc(UI.dkNotifyA) + "</b><span>" + esc(UI.dkNotifyW2) + "</span></div>" + '<button class="sw' + (opAud === "all" ? " on" : "") + '" aria-pressed="' + (opAud === "all") + '" aria-label="' + esc(UI.dkNotifyA) + '"></button></div>';
        }
    }
    if (opMsg) h += '<p class="h" style="margin-top:9px;color:var(--' + (opCls === "ok" ? "ok" : opCls === "bad" ? "stop" : "ink-2") + ')">' + esc(opMsg) + "</p>";
    h += "</div>";
    el.innerHTML = h;
}
