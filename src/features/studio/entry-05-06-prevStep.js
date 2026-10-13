function prevStep() {
    var pre = [ selVal("mas"), selVal("daf"), selVal("src") ].join("|") + "|";
    var pg = +selVal("pg") || 1, best = null, bestPg = 0;
    for (var k in BOOK) {
        if (k.indexOf(pre) !== 0) continue;
        var p = +k.slice(pre.length) || 1;
        if (p >= pg || p < bestPg) continue;
        var st = BOOK[k].steps || [];
        if (st.length) {
            best = st[st.length - 1];
            bestPg = p;
        }
    }
    if (!best && pg === 1) {
        var el = document.getElementById("daf");
        var it = el._items && el._items[+el.value - 1];
        if (it) {
            var pre2 = [ selVal("mas"), it[0], selVal("src") ].join("|") + "|";
            var hi = 0;
            for (var q in BOOK) {
                if (q.indexOf(pre2) !== 0) continue;
                var p2 = +q.slice(pre2.length) || 1;
                var st2 = BOOK[q].steps || [];
                if (st2.length && p2 > hi) {
                    hi = p2;
                    best = st2[st2.length - 1];
                }
            }
        }
    }
    return best;
}

function canContinue() {
    return !!(GSEL && !STEPS.length && prevStep());
}

/* ============================================================
   "↩ חיבור" - המשך שמביא איתו גם פסקה מהחברותא.
   ============================================================
   "החברותא מראה לי רק את העמוד שאני עומד בו. סימנתי את הקטע
   האחרון בגמרא ובחברותא, עברתי עמוד, סימנתי שם את הראשון בגמרא
   ובחברותא - ולא הייתה דרך לומר שזה חלק מהקודם."

   המשפט נחתך במעבר גם בחברותא, ו"↩ המשך הקטע" הרגיל לוקח רק את
   הביאור שנבחר למטה. כאן הפסקה שנבחרה בראש העמוד מצטרפת אליו:
   הקטע שבעמוד הקודם וההמשך נושאים שניהם את הביאור המחובר.

   · באותו דף (עמוד ב׳) הקובץ אחד, ולכן הקטע הקודם פשוט נמתח עד
     הפסקה שנבחרה.
   · בראש דף חדש הפסקאות בקובץ אחר. הטקסט מתחבר, והמספרים שלהן
     נשמרים בהמשך (`cj`), כדי שהקטע הבא יתחיל אחריהן.
   `cj` נשמר בשני המקרים - ממנו יודעים לבטל, ולהשלים כשפעולה
   אחרת בנתה את הביאור של הקטע הקודם מחדש.
   ============================================================ */
function crossDaf_() { return (+selVal('pg') || 1) === 1; }
function joinedC_(pv, cj) {
  if (!crossDaf_()) {
    var r = chavRange(pv.c.from, cj.to);
    return r ? { from: pv.c.from, to: cj.to, text: r.text, h: r.h } : null;
  }
  var ph = pv.c.h || (pv.c.text ? '<p>' + esc(pv.c.text) + '</p>' : '');
  return { from: pv.c.from, to: pv.c.to,
           text: (pv.c.text || '') + ' ' + cj.text, h: ph + cj.h };
}
function joinHas_(pv, cj) {
  return crossDaf_() ? String(pv.c.h || '').slice(-cj.h.length) === cj.h
                     : pv.c.to >= cj.to;
}
function setRootC_(pv, c) {
  pv.c = c;
  var k = keyOfStep_(pv);
  if (k && BOOK[k]) { BOOK[k].t = Date.now(); DIRTY[k] = 1; }
}
/* המשך שמוסר - הפסקה חוזרת להיות פנויה, והקטע הקודם מתקצר */
function unjoin_(st) {
  if (!st || !st.cont || !st.cj) return;
  var pv = prevStep(), cj = st.cj;
  if (!pv || pv === st || pv.cont || !joinHas_(pv, cj)) return;
  var c;
  if (crossDaf_()) {
    var t = String(pv.c.text || ''), tt = ' ' + cj.text;
    c = { from: pv.c.from, to: pv.c.to,
          text: t.slice(-tt.length) === tt ? t.slice(0, -tt.length) : t,
          h: String(pv.c.h || '').slice(0, -cj.h.length) };
  } else {
    if (pv.c.to !== cj.to) return;
    var r = cj.from - 1 >= pv.c.from ? chavRange(pv.c.from, cj.from - 1) : null;
    if (!r) return;
    c = { from: pv.c.from, to: cj.from - 1, text: r.text, h: r.h };
  }
  setRootC_(pv, c);
}

function addStep(cont, join) {
  if (INSP >= 0) return;
  var prev = cont ? prevStep() : null;
  if (!GSEL || (cont ? !prev : !CSEL_P)) return;
  var cj = null, jc = null;
  if (cont && join) {
    if (!CSEL_P) return;
    if (!CHV) { say('החברותא עוד לא נטענה - נסו שוב בעוד רגע.', 1); return; }
    if (prev.cont) { say('הקטע בעמוד הקודם הוא עצמו המשך - אי אפשר לצרף אליו פסקה מכאן.', 1); return; }
    if (!crossDaf_() && CSEL_P.a <= prev.c.to) {
      say('הפסקה הזו כבר שייכת לקטע בעמוד הקודם.', 1); return;
    }
    var r = chavRange(CSEL_P.a, CSEL_P.b);
    if (!r) { say('הפסקאות שנבחרו מוסתרות - אין מה לצרף.', 1); return; }
    cj = { from: CSEL_P.a, to: CSEL_P.b, text: r.text, h: r.h };
    jc = joinedC_(prev, cj);
    if (!jc) { say('לא הצלחתי לחבר את הביאור - לא נוסף.', 1); return; }
    /* קודם הקטע הקודם: `seal` מעתיק ממנו אל ההמשך */
    setRootC_(prev, jc);
  }
  var i0 = Math.min(GSEL.a.i, GSEL.b.i), i1 = Math.max(GSEL.a.i, GSEL.b.i);
  var xa = GSEL.a.i <= GSEL.b.i ? GSEL.a.x : GSEL.b.x;
  var xb = GSEL.a.i <= GSEL.b.i ? GSEL.b.x : GSEL.a.x;
  /* הקטעים רצים לפי סדר השורות, ולכן קטע חדש נכנס במקומו ולא
     בהכרח בסוף. בלי זה, תיקון של קטע אחד באמצע הדף חייב פירוק של
     כל מה שאחריו: מוחקים אותו, ומה שמוסיפים במקומו נופל בסוף. */
  var step = { g: { from: { line: i0, x: +xa.toFixed(3) },
                    to:   { line: i1, x: +xb.toFixed(3) } },
               c: cont ? { from: prev.c.from, to: prev.c.to,
                           text: prev.c.text, h: prev.c.h }
                       : { from: CSEL_P.a, to: CSEL_P.b,
                           text: chavText(), h: chavRich() } };
  if (cont) step.cont = 1;
  if (cj) step.cj = cj;
  var at = STEPS.length;
  for (var i = 0; i < STEPS.length; i++) {
    var f = STEPS[i].g.from;
    if (f.line > i0 || (f.line === i0 && f.x >= xa)) { at = i; break; }
  }
  STEPS.splice(at, 0, step);
  seal();                       /* הרצף נאטם מיד, לפני כל דבר אחר */
  if (step.id) NEW_IDS[step.id] = 1;
  touched();
  GSEL = null; CSEL_P = null;
  paintChav(1); markDraw();
  if (cj) say('✓ המשך הקטע נוסף, והפסקה צורפה לביאור שלו - גם בעמוד הקודם. ' +
              'נשמר במכשיר - "שמירה" מעלה לגיליון.');
}

function stepRows() {
    var out = [], prev = null;
    STEPS.forEach(function(st, i) {
        if (prev) {
            var g = st.g.from, p = prev.g.to;
            if (g.line > p.line + 1 || g.line === p.line && g.x > p.x + .02 || g.line === p.line + 1 && p.x < .98 && g.x > .02) out.push({
                gap: true,
                at: i,
                from: p.line + 1,
                to: g.line + 1
            });
        }
        out.push({
            i: i,
            st: st
        });
        prev = st;
    });
    return out;
}

function dafKeys() {
    var a = PKEY.split("|");
    if (a.length < 4) return [];
    var pre = a.slice(0, 3).join("|") + "|", out = [];
    for (var k in BOOK) if (k.indexOf(pre) === 0) out.push(k);
    return out;
}

function orphanKeys() {
    return dafKeys().filter(function(k) {
        var p = k.split("|")[3];
        return p !== "1" && p !== "2";
    });
}

function dropOrphans() {
    var ks = orphanKeys(), n = 0;
    ks.forEach(function(k) {
        n += ((BOOK[k] || {}).steps || []).length;
        GONE[k] = 1;
        delete BOOK[k];
    });
    if (!ks.length) return;
    DIRTY[PKEY] = 1;
    keepLocal();
    markPanel();
    say("הוסרו " + ks.length + " רשומות עודפות (" + n + " קטעים). " + "צריך לשמור בגיליון.");
    showSteps();
}

function showSteps() {
    var box = document.getElementById("splitbox");
    var html = '<div class="sh"><b>הקטעים בעמוד הזה</b>' + "<p>הקשה על קטע מציגה אותו על הדף. 🔗 מאחד אותו עם הקטע שאחריו - " + "הפירוש, ההקלטות והשאלות של שניהם נשארים. ✕ מוחק אותו: השורות " + "שלו עוברות לקטע שאחריו, ומה ששויך לו לא יוצג יותר.</p>";
    if (!STEPS.length) html += '<div class="s0">עדיין אין קטעים בעמוד הזה.</div>';
    var orph = orphanKeys();
    if (orph.length) {
        var on = 0;
        orph.forEach(function(k) {
            on += ((BOOK[k] || {}).steps || []).length;
        });
        html += '<div class="dup"><b>רשומה עודפת לדף הזה</b><div>' + (on ? "נמצאה רשומה בלי מספר עמוד ובה " + on + " קטעים. אי אפשר " + "להגיע אליה מהסטודיו, אבל מסך הלימוד קורא גם אותה - וזה מה " + "שמחזיר את התלמיד לראש הדף באמצע." : "נמצאה רשומה ריקה בלי מספר עמוד. היא אינה מזיקה, אבל אין " + "לה מה לעשות בגיליון.") + " נוצרה בגרסה שבה בורר העמוד היה ריק.</div>" + '<button class="dx">מחיקת הרשומה העודפת</button></div>';
    }
    stepRows().forEach(function(r) {
        if (r.gap) {
            html += '<div class="gap">⚠ רווח לא מסומן - שורות ' + r.from + "-" + r.to + "</div>";
            return;
        }
        var st = r.st;
        html += '<div class="row">' + '<button class="go" data-go="' + r.i + '"><b>' + (r.i + 1) + ".</b> שורות " + (st.g.from.line + 1) + "-" + (st.g.to.line + 1) + " · פסקה " + (st.c.from + 1) + (st.c.to > st.c.from ? "-" + (st.c.to + 1) : "") + "<i>" + esc((st.c.text || "").slice(0, 60)) + "</i></button>" + '<button class="mrg" data-mrg="' + r.i + '" title="איחוד עם הקטע הבא">🔗</button>' + '<button class="del" data-del="' + r.i + '" title="מחיקה">✕</button></div>';
    });
    html += "<button class=\"cl\" onclick=\"document.getElementById('splitbox').className='splitbox'\">סגירה</button></div>";
    box.innerHTML = html;
    box.className = "splitbox on";
    [].forEach.call(box.querySelectorAll(".dx"), function(b) {
        b.onclick = function() {
            dropOrphans();
        };
    });
    [].forEach.call(box.querySelectorAll("[data-mrg]"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
            mergeStep(+b.dataset.mrg);
        };
    });
    [].forEach.call(box.querySelectorAll("[data-del]"), function(b) {
        b.onclick = function() {
            box.className = "splitbox";
            deleteStep(+b.dataset.del);
        };
    });
    [].forEach.call(box.querySelectorAll("[data-go]"), function(b) {
        b.onclick = function() {
            var st = STEPS[+b.dataset.go];
            if (!st) return;
            GSEL = {
                a: {
                    i: st.g.from.line,
                    x: st.g.from.x
                },
                b: {
                    i: st.g.to.line,
                    x: st.g.to.x
                }
            };
            box.className = "splitbox";
            markDraw();
            markPanel();
            zoomToSel();
        };
    });
}


function removeStep(i) {
  unjoin_(STEPS[i]);
  STEPS.splice(i, 1);
  seal();
  touched();
  paintChav(1); markDraw();
}

var NEW_IDS = {};

function studioTaken_() {
    var mas = selVal("mas"), recs = [];
    for (var k in BOOK) if (k.indexOf(mas + "|") === 0) recs.push({
        mas: mas,
        d: BOOK[k]
    });
    return SidTaken(recs, mas);
}

function ensureIds_() {
    var need = STEPS.some(function(s) {
        return !s.cont && !s.id;
    });
    SidEnsure(STEPS, need ? studioTaken_() : {});
}

function keyOfStep_(st) {
    for (var k in BOOK) if ((BOOK[k].steps || []).indexOf(st) >= 0) return k;
    return "";
}

function nextPageKey_() {
    var a = PKEY.split("|");
    if (a.length < 4) return "";
    a[3] = String((+a[3] || 1) + 1);
    return a.join("|");
}

function studioContent_() {
  var mas = selVal('mas'), daf = selVal('daf'), rec = BOOK[PKEY] || {};
  var dafs = [SidDaf(daf)];
  if (rec.prev > 0 && rec.prevDaf) dafs.push(SidDaf(rec.prevDaf));
  var tabs = ['פירוש', 'שאלות בדף', 'מצגת'];
  return Promise.all(tabs.map(function (t) { return sheetCsv(t); })).then(function (res) {
    var out = { read: true, legacy: false, anch: null, has: {} };
    res.forEach(function (rows, ti) {
      if (!rows) { out.read = false; return; }
      rows.slice(1).forEach(function (r) {
        if (r[0] !== mas || dafs.indexOf(SidDaf(r[1])) < 0) return;
        var v;
        try { v = JSON.parse(r[2]); } catch (e) { return; }
        if (!v || typeof v !== 'object') return;
        if (ti === 2 && SidDaf(r[1]) === SidDaf(daf)) out.anch = v;
        if (v.__ids) {
          /* מה ששויך לכל מזהה - בשביל השאלה לפני מחיקה */
          for (var q in v) if (v.hasOwnProperty(q) && q.indexOf('__') !== 0 && hasVal_(v[q])) {
            out.has[q] = out.has[q] || [];
            if (out.has[q].indexOf(ti) < 0) out.has[q].push(ti);
          }
          return;
        }
        for (var k in v) if (v.hasOwnProperty(k) && /^\d+$/.test(k)) out.legacy = true;
      });
    });
    return out;
  }).catch(function () { return { read: false }; });
}
/* יש בערך משהו של ממש? רשומת פירוש ריקה נושאת עדיין תווית ("פירוש")
   וחותמת זמן - אלה לבדן אינן תוכן. */
function hasVal_(v) {
  if (v == null || v === '') return false;
  if (typeof v !== 'object') return true;
  for (var k in v) if (v.hasOwnProperty(k) && k !== 'tag' && k.charAt(0) !== '_' && hasVal_(v[k])) return true;
  return false;
}

function mergeAsk_(info, b, after) {
    var msg = "לאחד את שני הקטעים?\n\n" + "קו ההפרדה ביניהם יוסר בגמרא ובחברותא. הפירוש לנוער, ההקלטות והשאלות של שניהם יוצגו יחד, ברצף.";
    if (!info.read) msg += "\n\n(לא הצלחתי לקרוא את לשוניות הפירוש והשאלות. אם הדף עוד לא הוסב למזהים, האיחוד עלול להזיז שיוכים של הקטעים שאחריו.)"; else if (info.legacy) msg += "\n\n⚠ הדף הזה עוד לא הוסב למזהים קבועים. האיחוד יזיז את הפירוש, השאלות והשקפים של כל הקטעים שאחריו."; else if (info.anch && info.anch.__ids && b && b.id && info.anch[b.id] !== undefined) {
        if (after && after.id && info.anch[after.id] !== undefined) msg += "\n\nשימו לב: בקטע השני מתחיל שקף, ולקטע שאחריו יש שקף משלו - השקף של הקטע השני לא יוצג יותר ברצף."; else msg += "\n\nהשקף שמתחיל בקטע השני יעבור להתחיל בקטע שאחריו.";
    }
    return confirm(msg);
}

function mergeStep(i) {
    var st = STEPS[i];
    if (!st) return;
    if (SPL) splitCancel(1);
    if (!STEPS[i + 1]) {
        if (i > 0) {
            mergeStep(i - 1);
            return;
        }
        say('זה הקטע היחיד בעמוד. איחוד עם קטע מעמוד אחר - בדף האינטראקטיבי ("איחוד קטע … עם קטע …").', 1);
        return;
    }
    var nx = STEPS[i + 1], rec = BOOK[PKEY] || {}, pg = +selVal("pg") || 1;
    if (typeof rec.upto === "number" && i === rec.upto) {
        say("השבוע נגמר בין שני הקטעים האלה - כל אחד שייך לשבוע אחר. אי אפשר לאחד אותם.", 1);
        return;
    }
    if (rec.prev > 0 && i === rec.prev - 1) {
        say("הקטע הראשון שייך ללימוד של הדף הקודם, והשני לדף הזה - כל אחד על חברותא אחרת. אי אפשר לאחד אותם.", 1);
        return;
    }
    var root = st;
    if (st.cont) {
        if (pg === 1) {
            say("זה המשך של קטע מהדף הקודם, על החברותא של הדף ההוא - אי אפשר לאחד אותו עם קטע של הדף הזה.", 1);
            return;
        }
        root = prevStep();
        if (!root || root.cont) {
            say("לא מצאתי את תחילת הקטע בעמוד הקודם - לא אוחד.", 1);
            return;
        }
    }
    var after = STEPS[i + 2] || null;
    if (!after) {
        var nr = BOOK[nextPageKey_()], n0 = nr && nr.steps && nr.steps[0];
        after = n0 && !n0.cont ? n0 : null;
    }
    say("בודק את הפירוש והשקפים של הדף…");
    studioContent_().then(function(info) {
        if (!mergeAsk_(info, nx, after)) {
            say("לא אוחד.");
            return;
        }
        if (STEPS[i] !== st || STEPS[i + 1] !== nx) {
            say("הקטעים השתנו בינתיים - לא אוחד.", 1);
            return;
        }
        var from = root.c.from, to = nx.c.to;
        var r = chavRange(from, to);
        var c = r ? {
            from: from,
            to: to,
            text: r.text,
            h: r.h
        } : {
            from: from,
            to: to,
            text: (root.c.text || "") + " " + (nx.c.text || ""),
            h: (root.c.h || "") + (nx.c.h || "")
        };
        var cp = function() {
            return {
                from: c.from,
                to: c.to,
                text: c.text,
                h: c.h
            };
        };
        st.g = {
            from: st.g.from,
            to: {
                line: nx.g.to.line,
                x: nx.g.to.x
            }
        };
        st.c = cp();
        if (!root.id) root.id = SidNew(studioTaken_());
        var also = (root.also || []).slice();
        [ nx.id ].concat(nx.also || []).forEach(function(a) {
            if (a && a !== root.id && also.indexOf(a) < 0) also.push(a);
        });
        if (also.length) root.also = also;
        if (root !== st) {
            root.c = cp();
            var rk = keyOfStep_(root);
            if (rk && BOOK[rk]) {
                BOOK[rk].t = Date.now();
                DIRTY[rk] = 1;
            }
        }
        STEPS.splice(i + 1, 1);
        if (rec.prev > i + 1) rec.prev--;
        if (typeof rec.upto === "number" && rec.upto > i) rec.upto--;
        if (i === STEPS.length - 1) {
            var nk = nextPageKey_(), nb = BOOK[nk], f0 = nb && nb.steps && nb.steps[0];
            if (f0 && f0.cont) {
                f0.c = cp();
                nb.t = Date.now();
                DIRTY[nk] = 1;
            }
        }
        seal();
        touched();
        paintChav(1);
        markDraw();
        markPanel();
        say('✓ אוחד. נשמר במכשיר - "שמירה" מעלה לגיליון.');
    });
}


/* ============================================================
   מחיקת קטע - לצד האיחוד.
   ============================================================
   "אני בא למחוק קטע, ובמקום למחוק הוא שואל אותי לגבי לאחד."
   ✕ מוחק, 🔗 מאחד. במחיקה השורות של הקטע עוברות לקטע שאחריו
   (`seal` אוטם את הרצף), ומה ששויך למזהה שלו נשאר בגיליון בלי
   קטע שמציג אותו. לכן שואלים - רק כשבאמת יש לו משהו.
   ============================================================ */
function deleteStep(i) {
  var st = STEPS[i];
  if (!st) return;
  if (SPL) splitCancel(1);
  var rec = BOOK[PKEY] || {};
  if (i === STEPS.length - 1) {
    var nr = BOOK[nextPageKey_()], n0 = nr && nr.steps && nr.steps[0];
    if (n0 && n0.cont) {
      say('הקטע הזה ממשיך בראש העמוד הבא. מחקו קודם את ההמשך שם, ואז אותו.', 1);
      return;
    }
  }
  var go = function () {
    if (STEPS[i] !== st) { say('הקטעים השתנו בינתיים - לא נמחק.', 1); return; }
    if (rec.prev > i) rec.prev--;
    if (typeof rec.upto === 'number' && rec.upto >= i) {
      rec.upto--;
      if (rec.upto < 0) { delete rec.upto; delete rec.uptoDaf; }
    }
    removeStep(i);
    markPanel();
    say('✓ נמחק. נשמר במכשיר - "שמירה" מעלה לגיליון.');
  };
  /* קטע המשך אינו נושא תוכן משלו, וקטע שסומן עכשיו - עוד אין לו */
  var ids = st.cont ? [] : [st.id].concat(st.also || []).filter(Boolean);
  if (!ids.length || (NEW_IDS[st.id] && !st.also)) { go(); return; }
  say('בודק מה שויך לקטע…');
  studioContent_().then(function (info) {
    var names = ['פירוש או הקלטה', 'שאלות', 'שקף שמתחיל בו'], got = [];
    ids.forEach(function (d) {
      ((info.has || {})[d] || []).forEach(function (t) {
        if (got.indexOf(names[t]) < 0) got.push(names[t]);
      });
    });
    var msg = '';
    if (!info.read) msg = 'לא הצלחתי לבדוק אם יש לקטע פירוש, הקלטות או שאלות. ' +
      'אם יש - הם לא יוצגו יותר.\n\nלמחוק בכל זאת?';
    else if (info.legacy) msg = '⚠ הדף הזה עוד לא הוסב למזהים קבועים. המחיקה תזיז את ' +
      'הפירוש, השאלות והשקפים של כל הקטעים שאחריו.\n\nלמחוק בכל זאת?';
    else if (got.length) msg = 'למחוק את הקטע?\n\nיש לו ' + got.join(', ') +
      '. אחרי המחיקה הם לא יוצגו יותר לאף אחד.\n\n' +
      'כדי לשמור עליהם - "ביטול", ואז 🔗 לאיחוד עם הקטע שאחריו.';
    if (msg && !confirm(msg)) { say('לא נמחק.'); return; }
    go();
  });
}

function setMode(m) {
    MODE = m;
    document.body.classList.toggle("mark", m === "mark");
    document.getElementById("mode").textContent = m === "mark" ? "→ חזרה לכיול" : "סימון קטעים ←";
    if (m === "mark") {
        loadChav();
        loadFromSheet().then(afterSheet);
        markDraw();
    } else if (S) draw();
    markPanel();
}

function loadChav() {
    var c = curDaf();
    var id = fileId(c.links[1]);
    if (!id) {
        document.getElementById("chb").innerHTML = '<div class="hint">אין קובץ חברותא לדף הזה.</div>';
        return;
    }
    var box = document.getElementById("chb");
    CHV = null;
    box.innerHTML = '<div class="hint">טוען את החברותא…</div>';
    var render = function(buf) {
        pdfReady().then(function() {
            return pdfjsLib.getDocument({
                data: buf.slice(0)
            }).promise;
        }).then(function(doc) {
            var jobs = [];
            for (var i = 1; i <= doc.numPages; i++) jobs.push(doc.getPage(i).then(chavItems));
            return Promise.all(jobs);
        }).then(function(pages) {
            var all = [].concat.apply([], pages);
            var body = bodyHeight(all);
            var raw = [].concat.apply([], pages.map(function(it) {
                return chavBuild(it, body);
            }));
            chavStore(id, raw);
            CHV = buildChav(raw);
            box.innerHTML = chavHtml(CHV);
            document.getElementById("chpg").textContent = chavCount();
            chavBind();
            paintChav(1);
            backfillChav();
        }).catch(function() {
            box.innerHTML = '<div class="hint">לא הצלחתי לקרוא.</div>';
        });
    };
    var mas = selVal("mas"), dk = dafKey(selVal("daf"));
    fetch("chav/" + mas + "/" + encodeURIComponent(dk) + ".json").then(function(r) {
        return r.ok ? r.json() : null;
    }).catch(function() {
        return null;
    }).then(function(rows) {
        if (!rows || !rows.length) return fromPdf();
        var raw = rows.map(function(p) {
            return {
                runs: p.map(function(r) {
                    return {
                        t: r[0],
                        b: r[1]
                    };
                })
            };
        });
        CHV = buildChav(raw);
        box.innerHTML = chavHtml(CHV);
        document.getElementById("chpg").textContent = chavCount();
        chavBind();
        paintChav(1);
        backfillChav();
    });
    return;
    function fromPdf() {
        var mem = chavLoad(id);
        if (mem) {
            CHV = buildChav(mem);
            box.innerHTML = chavHtml(CHV);
            document.getElementById("chpg").textContent = chavCount();
            chavBind();
            paintChav(1);
            backfillChav();
            return;
        }
        if (CACHE[id]) return render(CACHE[id]);
        var url = API + (API.indexOf("?") < 0 ? "?" : "&") + "file=" + encodeURIComponent(id);
        fetch(url).then(function(r) {
            return r.json();
        }).catch(function() {
            return jsonp(url);
        }).then(function(d) {
            var bin = atob(d.data), buf = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            CACHE[id] = buf;
            render(buf);
        }).catch(function() {
            box.innerHTML = '<div class="hint">לא הצלחתי להביא.</div>';
        });
    }
}
