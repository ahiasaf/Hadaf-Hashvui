function runsHtml(runs) {
    return runs.map(function(r) {
        var t = esc(r.t);
        return r.b ? "<b>" + t + "</b>" : t;
    }).join("");
}

function fixOff(quiet) {
    FIX_MODE = false;
    document.body.classList.remove("fixing");
    document.getElementById("splitbox").className = "splitbox";
    document.getElementById("fixpara").textContent = "✎ תיקון טקסט בחברותא";
    if (!quiet) say("חזרה לסימון.");
}

function fixSheet(i) {
    var p = CHV[i];
    if (!p) return;
    var box = document.getElementById("splitbox");
    box.innerHTML = '<div class="sh"><b>תיקון הפסקה</b>' + "<p>מתקנים ישר בתוך הטקסט. ההדגשה נשמרת. הקובץ בדרייב אינו משתנה.</p>" + '<div class="fx-ed" contenteditable="true" id="fx-ed">' + runsHtml(p.runs) + "</div>" + '<div class="fx-row"><button class="fx-ok" id="fx-ok">שמירת התיקון</button>' + (p.orig ? '<button id="fx-org">החזרת המקור</button>' : "") + "</div>" + '<button class="cl">ביטול</button></div>';
    box.className = "splitbox on";
    var ed = document.getElementById("fx-ed");
    ed.onkeydown = function(e) {
        if (e.key === "Enter") e.preventDefault();
    };
    ed.onpaste = function(e) {
        var t = e.clipboardData || window.clipboardData;
        t = t ? t.getData("text") : "";
        e.preventDefault();
        document.execCommand("insertText", false, t.replace(/\s+/g, " "));
    };
    document.getElementById("fx-ok").onclick = function() {
        doFix(i, edRuns(ed));
    };
    var org = document.getElementById("fx-org");
    if (org) org.onclick = function() {
        doFix(i, null);
    };
    box.querySelector(".cl").onclick = function() {
        fixOff();
    };
    setTimeout(function() {
        try {
            ed.focus();
        } catch (x) {}
    }, 50);
}

function doFix(i, runs) {
    var p = CHV[i];
    if (!p) return;
    var base = p.orig || p.runs, key = p.key || fixKey(base);
    if (runs && !runs.length) {
        say("הפסקה ריקה - לא נשמר.", 1);
        return;
    }
    hiddenKeys().forEach(function(k) {
        if (!BOOK[k].fixes) return;
        BOOK[k].fixes = BOOK[k].fixes.filter(function(f) {
            return f[0] !== key;
        });
    });
    var same = runs && runsText(runs) === runsText(base) && JSON.stringify(runs) === JSON.stringify(base);
    if (runs && !same) {
        var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
        (rec.fixes = rec.fixes || []).push([ key, runs ]);
        CHV[i] = {
            runs: runs,
            off: p.off,
            orig: base,
            key: key,
            sig0: paraSig(p)
        };
    } else {
        CHV[i] = {
            runs: base,
            off: p.off
        };
    }
    var now = Date.now();
    hiddenKeys().forEach(function(k) {
        var hit = false;
        (BOOK[k].steps || []).forEach(function(st) {
            var c = st.c;
            if (!c || c.from == null || i < c.from || i > (c.to == null ? c.from : c.to)) return;
            var got = chavRange(c.from, c.to == null ? c.from : c.to);
            if (got) {
                c.text = got.text;
                c.h = got.h;
                hit = true;
            }
        });
        if (hit && k !== PKEY) {
            DIRTY[k] = 1;
            BOOK[k].t = now;
        }
    });
    fixOff(true);
    redrawChav();
    touched();
    say(runs && !same ? 'התיקון נשמר. לחצו "שמירה" כדי לשלוח לגיליון.' : "הפסקה חזרה לנוסח המקורי.");
}

function chavCount() {
    if (!CHV) return "";
    var off = 0;
    CHV.forEach(function(p) {
        if (p.off) off++;
    });
    return CHV.length + " פסקאות" + (off ? " · " + off + " מוסתרות" : "");
}

function redrawChav() {
    document.getElementById("chb").innerHTML = chavHtml(CHV);
    document.getElementById("chpg").textContent = chavCount();
    chavBind();
    paintChav();
    markPanel();
}

function toggleHide(i) {
    if (!CHV || !CHV[i]) return;
    var sig = paraSig(CHV[i]);
    if (CHV[i].off) {
        hiddenKeys().forEach(function(k) {
            if (!BOOK[k].hidden) return;
            BOOK[k].hidden = BOOK[k].hidden.filter(function(s) {
                return s !== sig;
            });
        });
        CHV[i].off = false;
    } else {
        var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
        rec.hidden = rec.hidden || [];
        if (rec.hidden.indexOf(sig) < 0) rec.hidden.push(sig);
        CHV[i].off = true;
    }
    if (CHV[i].off) dropHiddenPara_(i); else refreshHolders_(i);
    redrawChav();
    touched();
    say(CHV[i].off ? "הפסקה הוסתרה - לא תופיע אצל התלמיד" : "הפסקה הוחזרה.");
}

function paraHtml_(p) { return '<p>' + runsHtml(p.runs || []) + '</p>'; }
/* מוציא פסקה אחת מהטקסט השמור של קטע. לפי הנוסח ולא לפי חישוב
   מחדש של הטווח - כך זה נכון גם לקטע שצירף פסקה מעמוד אחר. */
function stripPara_(c, p) {
  if (!c) return false;
  var ph = paraHtml_(p), pt = runsText(p.runs);
  var h = String(c.h || ''), at = h.indexOf(ph);
  /* יש טקסט מעוצב - הוא הקובע. אין (רשומה ישנה) - לפי הטקסט הפשוט. */
  if (h && at < 0) return false;
  if (at >= 0) c.h = h.slice(0, at) + h.slice(at + ph.length);
  var t = String(c.text || '');
  if (pt && t.indexOf(pt) >= 0) {
    if (t.indexOf(' ' + pt) >= 0) t = t.replace(' ' + pt, '');
    else if (t.indexOf(pt + ' ') >= 0) t = t.replace(pt + ' ', '');
    else t = t.replace(pt, '');
    c.text = t;
  } else if (at < 0) return false;
  return true;
}
function holds_(c, i) {
  return c && c.from != null && i >= c.from && i <= (c.to == null ? c.from : c.to);
}
function dropHiddenPara_(i) {
  var p = CHV[i], now = Date.now(), n = 0;
  if (!p) return 0;
  hiddenKeys().forEach(function (k) {
    var hit = false;
    (BOOK[k].steps || []).forEach(function (st) {
      if (holds_(st.c, i) && stripPara_(st.c, p)) hit = true;
      if (holds_(st.cj, i) && stripPara_(st.cj, p)) hit = true;
    });
    if (hit) { n++; if (k !== PKEY) { DIRTY[k] = 1; BOOK[k].t = now; } }
  });
  return n;
}
function refreshHolders_(i) {
  var now = Date.now();
  hiddenKeys().forEach(function (k) {
    var hit = false;
    (BOOK[k].steps || []).forEach(function (st) {
      var c = st.c;
      if (st.cj || !holds_(c, i)) return;
      var got = chavRange(c.from, c.to == null ? c.from : c.to);
      if (got) { c.text = got.text; c.h = got.h; hit = true; }
    });
    if (hit && k !== PKEY) { DIRTY[k] = 1; BOOK[k].t = now; }
  });
}
/* בכניסה לדף: פסקה שהוסתרה לפני התיקון הזה ועדיין יושבת בקטע
   שמור - יוצאת ממנו. רץ אחרי שגם החברותא וגם הגיליון הגיעו. */
function purgeHidden_() {
  if (!CHV) return 0;
  var n = 0;
  for (var i = 0; i < CHV.length; i++) if (CHV[i].off) n += dropHiddenPara_(i);
  if (n) touched();
  return n;
}

function paraText(i) {
    return (CHV[i].runs || []).map(function(r) {
        return r.t;
    }).join("");
}

function sentences(t) {
    var out = [], at = 0, re = /[.!?]["'\)\]]*\s+/g, m;
    while (m = re.exec(t)) {
        out.push([ at, t.slice(at, m.index + m[0].length).trim() ]);
        at = m.index + m[0].length;
    }
    if (at < t.length) out.push([ at, t.slice(at).trim() ]);
    return out;
}

function splitSheet(i) {
    var t = paraText(i), ss = sentences(t);
    var box = document.getElementById("splitbox");
    if (ss.length < 2) {
        box.innerHTML = '<div class="sh"><b>אין מה לפצל</b>' + "<p>בפסקה הזו אין יותר ממשפט אחד.</p>" + '<button class="cl">סגירה</button></div>';
    } else {
        box.innerHTML = '<div class="sh"><b>היכן מתחילה הפסקה החדשה?</b>' + "<p>הקישו על המשפט שממנו יתחיל הביאור של הקטע הבא.</p>" + ss.map(function(v, k) {
            return k === 0 ? '<div class="s0">' + esc(v[1]) + "</div>" : '<button class="sp" data-at="' + v[0] + '">' + esc(v[1]) + "</button>";
        }).join("") + '<button class="cl">ביטול</button></div>';
    }
    box.className = "splitbox on";
    [].forEach.call(box.querySelectorAll(".sp"), function(b) {
        b.onclick = function() {
            doSplit(i, +b.dataset.at);
        };
    });
    [].forEach.call(box.querySelectorAll(".cl"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
            splitOff();
        };
    });
}

function splitOff() {
    SPLIT_MODE = false;
    document.body.classList.remove("splitting");
    document.getElementById("splitbox").className = "splitbox";
    say("הפיצול בוטל.");
}

document.getElementById("toast").onclick = function() {
    this.className = "";
};

document.getElementById("fixpara").onclick = function() {
    if (!CHV) {
        say("החברותא עדיין לא נטענה.", 1);
        return;
    }
    if (FIX_MODE) {
        fixOff();
        return;
    }
    setHideMode(false);
    if (SPLIT_MODE) splitOff();
    FIX_MODE = true;
    document.body.classList.add("fixing");
    this.textContent = "✕ סיום תיקון טקסט";
    say("הקישו על הפסקה שצריך לתקן.");
};

document.getElementById("fixoff").onclick = function(e) {
    e.stopPropagation();
    fixOff();
};

document.getElementById("stat").onclick = function() {
    sayFull(null, true);
};

document.getElementById("splitoff").onclick = function(e) {
    e.stopPropagation();
    splitOff();
};

function doSplit(i, at) {
    document.getElementById("splitbox").className = "splitbox";
    SPLIT_MODE = false;
    document.body.classList.remove("splitting");
    if (!CHV || !CHV[i]) return;
    var rec = BOOK[PKEY] || (BOOK[PKEY] = {});
    (rec.splits = rec.splits || []).push([ i, at ]);
    var two = cutRuns(CHV[i].runs, at);
    CHV.splice(i, 1, two[0], two[1]);
    redrawChav();
    touched();
    say("הפסקה פוצלה · " + CHV.length + " פסקאות");
}

function chavBind() {
    [].forEach.call(document.querySelectorAll("#chb p.cp"), function(el) {
        el.onclick = function() {
            var i = +el.dataset.p;
            if (HIDE_MODE) {
                toggleHide(i);
                return;
            }
            if (FIX_MODE) {
                fixSheet(i);
                return;
            }
            if (SPLIT_MODE) {
                if (i <= USED_C) {
                    say("אפשר לפצל רק פסקה שטרם שובצה.", 1);
                    return;
                }
                splitSheet(i);
            } else pickPara(i);
        };
    });
}

function pickPara(i) {
    if (SPL) {
        splitPara(i);
        return;
    }
    var k = stepAtPara(i);
    if (k >= 0 && k !== INSP) {
        inspect(k, null);
        return;
    }
    if (INSP < 0 && k < 0 && i <= USED_C) {
        say("הפסקה הזו שייכת לקטע בעמוד הקודם.", 1);
        return;
    }
    if (CSEL_P && i >= CSEL_P.a && i <= CSEL_P.b && CSEL_P.b > CSEL_P.a) {
        CSEL_P = {
            a: CSEL_P.a,
            b: i
        };
    } else if (!CSEL_P) {
        CSEL_P = {
            a: Math.max(0, USED_C + 1),
            b: i
        };
        if (CSEL_P.a > i) CSEL_P.a = i;
    } else {
        CSEL_P = {
            a: CSEL_P.a,
            b: i
        };
        if (CSEL_P.b < CSEL_P.a) {
            CSEL_P = {
                a: i,
                b: i
            };
        }
    }
    paintChav(1);
    markPanel();
}

function seeIn(box, el) {
    if (!box || !el) return;
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top >= b.top + 6 && r.bottom <= b.bottom - 6) return;
    box.scrollTop += r.top - b.top - box.clientHeight * .35;
}

function seeChav() {
    var box = document.getElementById("chb");
    if (!box) return;
    var hot = box.querySelectorAll("p.cp.hot");
    seeIn(box, hot.length ? hot[hot.length - 1] : box.querySelector("p.cp.insp") || box.querySelector("p.cp.nextup"));
}

function seeGem() {
    var st = stage(), img = document.getElementById("page");
    if (!st || !S || !img || !img.clientHeight) return;
    var ls = flatLines();
    var i = GSEL ? Math.max(GSEL.a.i, GSEL.b.i) : nextStart().i;
    var l = ls[i];
    if (!l) return;
    var y = (l.t + l.b) / 2 / S.h * img.clientHeight;
    if (y > st.scrollTop + 40 && y < st.scrollTop + st.clientHeight - 40) return;
    st.scrollTop = y - st.clientHeight * .5;
}

function paintChav(scroll) {
    [].forEach.call(document.querySelectorAll("#chb p.cp"), function(el) {
        var i = +el.dataset.p;
        var inSel = !!CSEL_P && i >= Math.min(CSEL_P.a, CSEL_P.b) && i <= Math.max(CSEL_P.a, CSEL_P.b);
        var one = !!SPL && inSel && SPL.cEnd != null && i <= SPL.cEnd;
        el.classList.toggle("hot", inSel && (INSP < 0 || one));
        el.classList.toggle("insp", inSel && INSP >= 0 && !one);
        el.classList.toggle("used", i <= USED_C && !inSel);
        el.classList.toggle("nextup", !CSEL_P && i === USED_C + 1);
    });
    if (scroll) seeChav();
}

function pos(q) {
    return q.line + q.x;
}

function chavRange(a, b) {
    if (!CHV) return null;
    var txt = [], html = [];
    for (var i = a; i <= b && i < CHV.length; i++) {
        if (i < 0) continue;
        if (CHV[i].off) continue;
        txt.push(CHV[i].runs.map(function(r) {
            return r.t;
        }).join(""));
        html.push("<p>" + CHV[i].runs.map(function(r) {
            var t = esc(r.t);
            return r.b ? "<b>" + t + "</b>" : t;
        }).join("") + "</p>");
    }
    if (!txt.length) return null;
    return {
        text: txt.join(" "),
        h: html.join("")
    };
}

var CONT_FIXED = false;

function seal(report) {
  /* ============================================================
     עמוד שנמחקו ממנו כל הקטעים.
     ============================================================
     "ביטלתי את כל השיוך של העמוד, ואז ניסיתי לפצל פסקה - וקיבלתי
     'אפשר לפצל רק פסקה שטרם שובצה'." היציאה המוקדמת כאן דילגה
     על עדכון USED_G/USED_C שבסוף, ולכן אחרי מחיקת הקטע האחרון
     הסטודיו עוד "זכר" את הפסקאות ואת השורות שהיו משובצות. */
  if (!STEPS.length) {
    USED_G = null;
    USED_C = lastChav();
    return 0;
  }
  var fixed = 0;

  /* לפי סדר הדף. הסדר הוא המבנה - בלעדיו "הקודם" חסר משמעות. */
  STEPS.sort(function (a, b) { return pos(a.g.from) - pos(b.g.from); });

  /* ---------- נקודת האפס ----------
     החוק חל גם על הקטע הראשון, ובלעדיו הוא חסר.

     `seal` אכף רצף רק **בין** קטעים, ולכן מחיקה מתחילת העמוד
     השאירה את הראשון תלוי באוויר: הוא נשאר במקום שבו התחיל
     פעם, וכל מה שלפניו - שורות ופסקאות כאחד - נשאר בלי בעלים.
     זה בדיוק מה שקרה אחרי מחיקת שבעת הראשונים: הקטע הראשון
     נשאר בשורה 6.54 ובפסקה 2, ושורות 0-6 ופסקאות 0-1 נעלמו
     מהחשבון בלי שאיש יאמר.

     במודל נקודות החיתוך יש נקודה אפס, והיא ראש העמוד. בגמרא
     תמיד שורה 0 - מספרי השורות מתאפסים בכל עמוד. בחברותא לא:
     הפסקאות רצות ברצף על פני שני עמודי הדף, ולכן ראש העמוד הוא
     מה שנגמר בעמוד הקודם ועוד אחת. נקודת עצירה (`prev`) גוברת
     על שניהם, כי שם נקבע במפורש שהתחלת העמוד שייכת לדף שקדם. */
  var rec0 = BOOK[PKEY] || {};
  var base = { line: 0, x: 0 };
  var baseC = 0;
  if (rec0.prev > 0 && STEPS[rec0.prev - 1]) {
    /* הקטעים הראשונים שייכים לדף הקודם - נקודת האפס היא סופם. */
    var cut = STEPS[rec0.prev - 1];
    base = { line: cut.g.to.line, x: cut.g.to.x };
    baseC = (cut.cont && cut.cj ? cut.cj.to : cut.c.to) + 1;
  } else {
    var pageStart = STEPS.length ? null : null;
    baseC = 0;
    /* עמוד שאינו הראשון בדף: הפסקאות ממשיכות מהעמוד שלפניו. */
    var pre = [selVal('mas'), selVal('daf'), selVal('src')].join('|') + '|';
    var pgn = +selVal('pg') || 1, best = -1;
    for (var k0 in BOOK) {
      if (k0.indexOf(pre) !== 0 || k0 === PKEY) continue;
      if ((+k0.slice(pre.length) || 1) >= pgn) continue;
      var pst = BOOK[k0].steps || [];
      for (var j0 = 0; j0 < pst.length; j0++) {
        if (!pst[j0].cont) best = Math.max(best, pst[j0].c.to);
        else if (pst[j0].cj) best = Math.max(best, pst[j0].cj.to);
      }
    }
    baseC = best + 1;
  }

  var out = [];
  STEPS.forEach(function (st, si) {
    var prev = out[out.length - 1];
    if (!prev && si === 0) {
      /* הראשון נמתח עד ראש העמוד. */
      if (Math.abs(pos(st.g.from) - pos(base)) > 1e-6) {
        st.g.from = { line: base.line, x: base.x };
        fixed++;
      }
      /* ============================================================
         "לחצתי 'המשך הקטע', והמערכת סימנה לי בחברותא קטע חדש שלא
         ביקשתי."
         ============================================================
         קטע המשך נושא את הביאור של הקטע שלפני המעבר - זה כל עניינו.
         אבל כאן הוא נאטם כמו כל קטע ראשון: הפסקה שלו "תוקנה" לזו
         שאחרי העמוד הקודם, ובמקום הביאור של המשפט שהתחיל למטה הוא
         קיבל את הפסקה הבאה ("תמהה הגמרא: וכי מאחר…").

         עכשיו הוא פטור מאטימת החברותא, ומקבל תמיד את הביאור של
         הקטע שהוא ממשיך. זה גם מתקן את מה שכבר נשמר שבור - בכניסה
         לעמוד. */
      if (st.cont) {
        var pv = prevStep();
        /* המשך שצירף פסקה (`cj`): הקטע שבעמוד הקודם חייב לשאת אותה.
           פעולה שבנתה את הביאור שלו מחדש (פיצול, איחוד) השמיטה
           אותה - מחזירים, לפני שההמשך מעתיק ממנו. */
        if (pv && pv !== st && st.cj && !pv.cont && !joinHas_(pv, st.cj)) {
          var jc0 = joinedC_(pv, st.cj);
          if (jc0) { setRootC_(pv, jc0); fixed++; CONT_FIXED = true; }
        }
        if (pv && pv !== st && (st.c.from !== pv.c.from || st.c.to !== pv.c.to ||
                                st.c.h !== pv.c.h)) {
          st.c = { from: pv.c.from, to: pv.c.to, text: pv.c.text, h: pv.c.h };
          fixed++;
          CONT_FIXED = true;
        }
      } else if (st.c.from !== baseC) {
        st.c.from = baseC;
        if (st.c.to < st.c.from) st.c.to = st.c.from;
        fixed++;
        var g0 = chavRange(st.c.from, st.c.to);
        if (g0) { st.c.text = g0.text; st.c.h = g0.h; }
      }
    }
    if (prev) {
      /* קטע שנבלע כולו בקודמו - כפילות. יורד. */
      if (pos(st.g.to) <= pos(prev.g.to) + 1e-6) { fixed++; return; }
      /* ההתחלה **היא** הסוף של הקודם. כאן נסגר חור וכאן מתבטלת
         חפיפה, ושניהם באותה שורה אחת. */
      if (Math.abs(pos(st.g.from) - pos(prev.g.to)) > 1e-6) {
        st.g.from = { line: prev.g.to.line, x: prev.g.to.x };
        fixed++;
      }
      /* אותו כלל בחברותא: הפסקה הראשונה היא זו שאחרי הקודמת.
         פסקאות שנשארו יתומות בין השניים נכנסות לקטע הזה. */
      /* אחרי קטע המשך - ממשיכים מנקודת האפס של העמוד, לא ממנו:
         הפסקאות שלו שייכות לעמוד הקודם (או לקובץ של הדף הקודם). */
      var nextC = prev.cont ? (prev.cj ? prev.cj.to + 1 : baseC) : prev.c.to + 1;
      if (st.c.from !== nextC) {
        st.c.from = nextC;
        if (st.c.to < st.c.from) st.c.to = st.c.from;
        fixed++;
        var got = chavRange(st.c.from, st.c.to);
        if (got) { st.c.text = got.text; st.c.h = got.h; }
      }
    }
    out.push(st);
  });

  STEPS = out;
  /* מזהה קבוע לכל קטע (stepid.js). קטע המשך - בלי. */
  ensureIds_();
  /* `BOOK` מחזיק את אותה רשומה, ולכן היא מתעדכנת יחד. */
  if (BOOK[PKEY]) BOOK[PKEY].steps = STEPS;
  var last = STEPS[STEPS.length - 1];
  USED_G = last ? { line: last.g.to.line, x: last.g.to.x } : null;
  USED_C = lastChav();
  if (fixed && report) say(fixed + ' רצפים נסגרו אוטומטית.');
  return fixed;
}
