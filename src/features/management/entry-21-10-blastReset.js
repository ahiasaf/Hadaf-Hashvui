function blastReset() {
    if (!confirm("לאפס את הסימון של מי שכבר קיבל?")) return;
    Store.set("blastLog", {});
    renderCalls();
}

function firstName(n) {
    n = String(n == null ? "" : n).replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
    n = n.replace(/^(?:הרב|הרה[\u05f4"]ג|הר[\u05f4"]ר|הרה[\u05f4"]ח|רב|ר['\u05f3])\s+/, "");
    return n.split(/\s+/)[0] || "";
}

function waGreet() {
    var h = (new Date).getHours();
    if (h < 11) return "בוקר טוב";
    if (h < 17) return "צהריים טובים";
    return "ערב טוב";
}

function blastUrl(c) {
  var inst = instByName(c.key || c.name);
  var base = joinUrl('').replace('join.html', '');
  if (!inst) return base;
  var u = base + '?m=' + encodeURIComponent(inst.code);
  /* בלי קוד גישה: מי שמצטרף נרשם, והרכז מאשר אותו. */
  return u;
}

function blastText(c, q) {
    var inst = instByName(c.key || c.name);
    return fill(textGet("ui.blastWa"), {
        name: firstName(q && q.name || c.name),
        greet: waGreet(),
        inst: inst && inst.name || c.name || "",
        url: blastUrl(c)
    });
}

function blastCard(list) {
    var raw = textGet("ui.blastWa"), on = blastOn();
    var d = CFG.texts || {};
    var changed = d["ui.blastWa"] != null && d["ui.blastWa"] !== belowText("ui.blastWa");
    var log = blastLog(), sent = 0, total = 0, noName = [];
    list.forEach(function(c) {
        var q = mainOf(c);
        if (!q || !q.phone) return;
        total++;
        if (log[blastKey(c, q)]) sent++;
        if (!firstName(q.name)) noName.push(c.name);
    });
    var first = null;
    for (var i = 0; i < list.length; i++) {
        var q0 = mainOf(list[i]);
        if (q0 && q0.phone) {
            first = {
                c: list[i],
                q: q0
            };
            break;
        }
    }
    var peek = first ? String(blastText(first.c, first.q)).split("\n").slice(0, 3).join("\n") : "";
    return '<div class="card" style="margin-bottom:11px">' + '<div class="row" style="padding:0 0 8px"><div><b>הודעה לכולם</b>' + (changed ? ' <span style="color:var(--gold)">•</span>' : "") + '<div class="sub">כל כפתור וואטסאפ למטה ישלח אותה, בשמו של מי שמחייגים אליו</div>' + '</div><button class="sw' + (on ? " on" : "") + '" onclick="blastSetOn(' + (on ? "false" : "true") + ')" ' + 'aria-label="הודעה לכולם"></button></div>' + (on ? '<div class="done-box" style="margin:0 0 10px">נשלחו ' + sent + " מתוך " + total + (sent ? ' · <a href="#" onclick="blastReset();return false">איפוס הסימון</a>' : "") + "</div>" : "") + '<textarea rows="8" onchange="admTextSet(\'ui.blastWa\',this.value);renderCalls()">' + esc(raw) + "</textarea>" + '<p class="h" style="margin:6px 0 0">' + "<b>{name}</b> השם הפרטי · <b>{greet}</b> בוקר טוב לפי השעה · " + "<b>{inst}</b> שם הישיבה · <b>{url}</b> הקישור, פתוח כבר על הישיבה שלו. " + "העריכה נשמרת במכשיר עד <b>פרסום</b>.</p>" + (peek ? '<div class="cond" style="margin-top:10px"><b>כך זה ייפתח אצל ' + esc(first.c.name) + ":</b><br>" + esc(peek).replace(/\n/g, "<br>") + "</div>" : "") + (noName.length ? '<div class="msg" style="margin-top:8px;color:var(--stop)">' + "<b>בלי שם פרטי:</b> " + esc(noName.slice(0, 4).join(" · ")) + (noName.length > 4 ? " ועוד " + (noName.length - 4) : "") + " - הפתיחה תצא חסרה. אפשר לתקן בכרטיס שלהם.</div>" : "") + "</div>";
}

var RM_TAB = "תזכורות";

var rmRows = null, rmMsg = "", rmBusy = false;

var rmNew = null;

function rmId() {
    var v = Store.get("rmId", "");
    if (!v) {
        v = "rm" + Math.random().toString(36).slice(2, 10);
        Store.set("rmId", v);
    }
    return v;
}

function rmToday() {
    var d = new Date, z = function(n) {
        return (n < 10 ? "0" : "") + n;
    };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}

function rmTimes() {
    var out = [], h, m;
    for (h = 5; h < 24; h++) {
        for (m = 0; m < 60; m += 30) {
            out.push((h < 10 ? "0" : "") + h + ":" + (m ? "30" : "00"));
        }
    }
    return out;
}

function rmNearest() {
    var d = new Date;
    var h = d.getHours(), m = d.getMinutes() < 30 ? 30 : 0;
    if (!m) h += 1;
    if (h > 23) h = 23;
    if (h < 5) h = 5;
    return (h < 10 ? "0" : "") + h + ":" + (m ? "30" : "00");
}

function rmLoad() {
    var k = (CFG.readKey || "").trim();
    if (!k) {
        rmMsg = "nokey";
        admPane();
        return Promise.resolve(false);
    }
    rmMsg = "טוען…";
    admPane();
    return scriptGet({
        read: RM_TAB,
        key: k
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) {
            rmMsg = d && d.message || "לא קיבלתי תשובה מהסקריפט.";
            admPane();
            return false;
        }
        rmRows = rmParse(d.rows);
        rmMsg = "";
        admPane();
        return true;
    }).catch(function() {
        rmMsg = "לא קיבלתי תשובה מהסקריפט.";
        admPane();
        return false;
    });
}

function rmParse(rows) {
    if (!rows || rows.length < 2) return [];
    var h = rows[0], ix = {}, i;
    for (i = 0; i < h.length; i++) ix[String(h[i]).trim()] = i;
    var out = [];
    rows.slice(1).forEach(function(r) {
        var o = {
            id: String(r[ix["מזהה"]] || "").trim(),
            date: String(r[ix["תאריך"]] || "").trim(),
            time: String(r[ix["שעה"]] || "").trim(),
            text: String(r[ix["נוסח"]] || "").trim()
        };
        if (o.id === rmId() && o.date && o.time && o.text) out.push(o);
    });
    out.sort(function(a, b) {
        return a.date + a.time < b.date + b.time ? -1 : 1;
    });
    return out;
}

function rmSave(list, after) {
  var url = (CFG.api || API || '').trim();
  if (!url) { rmMsg = 'אין כתובת שרת.'; admPane(); return; }
  rmBusy = true; rmMsg = 'שומר…'; admPane();
  var rows = list.map(function (o) {
    return [o.id, o.date, o.time, o.text];
  });
  fetch(url, { method:'POST', mode:'no-cors',
    body: JSON.stringify({ action:'table', tab: RM_TAB, key:(CFG.readKey || '').trim(),
      cols: JSON.stringify(['מזהה', 'תאריך', 'שעה', 'נוסח']),
      rows: JSON.stringify(rows) }) })
    /* הכתיבה אטומה ואינה ראיה. קוראים חזרה, ורק מה שחזר הוא
       מה שמוצג. */
    .then(function () { return new Promise(function (r) { setTimeout(r, 1200); }); })
    .then(function () { rmBusy = false; return rmLoad(); })
    .then(function (ok) { if (ok && after) after(); })
    .catch(function () { rmBusy = false; rmMsg = 'השמירה לא אושרה.'; admPane(); });
}

/* ============================================================
   שליחת בדיקה אליי.
   ============================================================
   "איך אני יכול לשלוח לעצמי? כדאי שיהיה אופציה כזאת בשביל
   בדיקות."

   לא קיצור דרך - **המסלול האמיתי כולו.** נכתבת תזכורת לדקה
   הזו, ומיד מוצתת אותה הרצה שהשעון מצית כל חצי שעה. כשההתראה
   מגיעה, נבדקו הגיליון, הגשר של גוגל, GitHub והמנוי שבמכשיר.

   הדקה המדויקת (ולא חצי השעה) היא מה שמאפשר בדיקה שנייה
   באותה חצי שעה - ראו `slotOf` ב-tools/remind-send.js.
   בדיקה קודמת שנשארה ברשימה מוסרת, כדי שהרשימה לא תתמלא. */
var RM_TEST = 'בדיקה · ';
var rmTestMsg = '';
function rmIsTest(o) { return String(o.text || '').indexOf(RM_TEST) === 0; }
function rmTest() {
  if (rmBusy) return;
  if (!(CFG.readKey || '').trim()) { rmMsg = 'nokey'; admPane(); return; }
  if (rmRows === null) {
    rmLoad().then(function (ok) { if (ok) rmTest(); });
    return;
  }
  var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
  var hm = z(d.getHours()) + ':' + z(d.getMinutes());
  var me = { id: rmId(), date: rmToday(), time: hm,
             text: RM_TEST + 'אם זה הגיע - התזכורות עובדות (נשלח ב-' + hm + ')' };
  var list = rmRows.filter(function (o) { return !rmIsTest(o); });
  list.push(me);
  rmTestMsg = 'שומר את הבדיקה…'; admPane();
  rmSave(list, function () {
    /* מה שלא חזר בקריאה - לא נשמר, ואין טעם להצית. */
    var there = (rmRows || []).some(function (o) {
      return o.date === me.date && o.time === me.time && rmIsTest(o);
    });
    if (!there) { rmTestMsg = 'הבדיקה לא נשמרה בגיליון. נסה שוב.'; admPane(); return; }
    rmTestMsg = 'מצית את השליחה…'; admPane();
    scriptGet({ setup: 'clockfire', key: (CFG.readKey || '').trim() }).then(function (r) {
      var f = r && r.fired;
      if (!r || r.status !== 'ok' || !f) {
        rmTestMsg = (r && r.message) || 'לא קיבלתי תשובה מהסקריפט.';
      } else if (f.err || f.code !== 204) {
        rmTestMsg = 'GitHub לא קיבל את ההצתה (' + (f.err || f.code) + '). ' +
                    'הבדיקה תצא בכל זאת בהפעלה הבאה של השעון.';
      } else {
        rmTestMsg = 'נשלח. ההתראה אמורה להגיע לטלפון הזה תוך דקה-שתיים.';
      }
      admPane();
    }).catch(function () {
      rmTestMsg = 'לא קיבלתי תשובה מהסקריפט. הבדיקה תצא בהפעלה הבאה של השעון.';
      admPane();
    });
  });
}

function rmAdd() {
    if (!rmNew) return;
    var txt = String(rmNew.text || "").trim();
    if (txt.length < 2) {
        rmMsg = "אין מה להזכיר.";
        admPane();
        return;
    }
    if (rmRows === null) {
        rmLoad().then(function(ok) {
            if (ok) rmAdd();
        });
        return;
    }
    var list = rmRows.slice();
    list.push({
        id: rmId(),
        date: rmNew.date,
        time: rmNew.time,
        text: txt
    });
    rmNew = null;
    rmSave(list);
}

function rmDrop(i) {
    var list = (rmRows || []).slice();
    if (!list[i]) return;
    if (!confirm("להסיר את התזכורת?")) return;
    list.splice(i, 1);
    rmSave(list);
}

function rmOpen() {
    rmNew = {
        date: rmToday(),
        time: rmNearest(),
        text: ""
    };
    rmMsg = "";
    admPane();
}

function rmCancel() {
    rmNew = null;
    rmMsg = "";
    admPane();
}

function rmSet(k, v) {
    if (rmNew) rmNew[k] = v;
}

var rmSubMsg = "";

function rmSubOn() {
    if (!window.APPX || !APPX.canNote()) {
        rmSubMsg = "הדפדפן הזה אינו תומך בהתראות.";
        admPane();
        return;
    }
    rmSubMsg = "מבקש אישור…";
    admPane();
    APPX.ask(function(p) {
        if (p !== "granted") {
            rmSubMsg = "בלי אישור אי אפשר להקפיץ תזכורת.";
            admPane();
            return;
        }
        APPX.subscribe().then(function(sub) {
            var url = (CFG.api || API || "").trim();
            if (!url) {
                rmSubMsg = "אין כתובת שרת.";
                admPane();
                return;
            }
            return fetch(url, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    action: "row",
                    tab: "התראות",
                    key: (CFG.readKey || "").trim(),
                    cols: JSON.stringify([ [ "מזהה", rmId() ], [ "שם", "רכז התוכנית" ], [ "ישיבה", "" ], [ "קוד ישיבה", "" ], [ "תפקיד", "רכז" ], [ "שכבה", "" ], [ "כיתה", "" ], [ "מכשיר", APPX.isIOS() ? "אייפון" : "אנדרואיד" ], [ "מנוי", JSON.stringify(sub) ], [ "תוצאה", "נרשם" ], [ "מועד", "" ], [ "מתי", (new Date).toISOString() ] ])
                })
            }).then(function() {
                Store.set("rmSub", 1);
                rmSubMsg = "";
                admPane();
            });
        }).catch(function(e) {
            rmSubMsg = "לא הצלחתי להשלים: " + (e && e.message || e);
            admPane();
        });
    });
}

function rmCard() {
  var subbed = Store.get('rmSub', 0) &&
               window.APPX && APPX.perm() === 'granted';
  var h = '<div class="card" style="margin-bottom:11px">' +
    '<div class="row" style="padding:0 0 8px"><div><b>תזכורות לעצמי</b>' +
    '<div class="sub">נדחפות למכשיר הזה בשעה שתבחר</div></div></div>';

  /* ============================================================
     **האישור אינו שער.**
     ============================================================
     קודם הכרטיס הראה **רק** את כפתור האישור, וכל השאר היה
     מאחוריו - כלומר מי שלא אישר עדיין לא ראה בכלל איפה כותבים
     תזכורת, ולא ידע שיש כאן דבר כזה. "לא ראיתי איפה אני כותב
     תזכורת חדשה."

     עכשיו הטופס תמיד כאן, והחוסר נאמר בשורה אחת מעליו. */
  if (!subbed) {
    h += '<div class="cond" style="margin:0 0 10px">' +
         'התזכורות יישמרו, אבל לא יקפצו עד שההתראות מאושרות במכשיר הזה.' +
         '<div style="margin-top:8px"><button class="btn p" style="margin:0" ' +
         'onclick="rmSubOn()">אישור התראות</button></div>' +
         (rmSubMsg ? '<div class="msg">' + esc(rmSubMsg) + '</div>' : '') +
         '</div>';
  }

  if (rmRows === null) {
    h += '<p class="h">הרשימה נשמרת בגיליון, בלשונית "' + RM_TAB + '".</p>' +
         '<button class="btn g" onclick="rmLoad()">טעינה מהגיליון</button>';
    if (rmMsg === 'nokey') {
      h += '<div class="msg">צריך להזין את סיסמת הקריאה בהגדרות ' +
           'כדי לקרוא את התזכורות שכבר נשמרו.</div>';
    } else if (rmMsg) {
      h += '<div class="msg">' + esc(rmMsg) + '</div>';
    }
  }

  /* **וגם בלי הרשימה אפשר לכתוב.** קריאה שנכשלה אינה סיבה
     לחסום כתיבה - היא רק אומרת שאיננו יודעים מה כבר יש. משתנה
     מקומי ולא דריסה של `rmRows`: ציור אינו אמור לשנות מצב, ואם
     היה דורס - הכפתור "טעינה מהגיליון" לא היה חוזר לעולם. */
  var list = rmRows || [];

  if (list.length) {
    h += '<div class="whens">' + list.map(function (o, i) {
      return '<div class="whenrow"><span class="wt">' + esc(o.time) + '</span>' +
        '<span class="wd">' + esc(rmDay(o.date)) + ' · ' + esc(o.text) + '</span>' +
        '<button onclick="rmDrop(' + i + ')">הסרה</button></div>';
    }).join('') + '</div>';
  } else if (rmRows) {
    h += '<p class="h">אין תזכורות ממתינות.</p>';
  }

  if (rmNew) {
    h += '<div class="fld" style="margin-top:12px">' +
      '<div class="label">מתי</div><div class="pair">' +
      '<input type="date" value="' + esc(rmNew.date) +
      '" onchange="rmSet(\'date\',this.value)">' +
      '<select onchange="rmSet(\'time\',this.value)">' +
      rmTimes().map(function (t) {
        return '<option' + (t === rmNew.time ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select></div></div>' +
      '<div class="fld"><textarea rows="2" placeholder="מה להזכיר לך?" ' +
      'oninput="rmSet(\'text\',this.value)">' + esc(rmNew.text) + '</textarea></div>' +
      '<button class="btn p" onclick="rmAdd()"' + (rmBusy ? ' disabled' : '') + '>' +
      (rmBusy ? 'שומר…' : 'שמירת התזכורת') + '</button>' +
      '<button class="btn g" onclick="rmCancel()">ביטול</button>';
  } else {
    h += '<button class="btn p" style="margin-top:10px" onclick="rmOpen()">' +
         (list.length ? 'תזכורת נוספת' : 'תזכורת חדשה') + '</button>' +
         '<button class="btn g" onclick="rmTest()"' + (rmBusy ? ' disabled' : '') +
         '>שליחת בדיקה אליי</button>';
    if (rmTestMsg) h += '<div class="msg">' + esc(rmTestMsg) + '</div>';
  }
  if (rmMsg && rmMsg !== 'nokey') h += '<div class="msg">' + esc(rmMsg) + '</div>';
  return h + '</div>';
}

function rmDay(d) {
    var t = rmToday();
    if (d === t) return "היום";
    var n = new Date;
    n.setDate(n.getDate() + 1);
    var z = function(x) {
        return (x < 10 ? "0" : "") + x;
    };
    var tm = n.getFullYear() + "-" + z(n.getMonth() + 1) + "-" + z(n.getDate());
    if (d === tm) return "מחר";
    var p = d.split("-");
    return p.length === 3 ? p[2] + "/" + p[1] : d;
}

function yshKey(s) {
    return nameKey(s).replace(/[()\[\]{}\---־_.,:]/g, "").replace(/\s+/g, "");
}

function yshGk(s) {
    var i = instByName(s);
    return i ? "@" + i.code : yshKey(s);
}

function yshNm(s) {
    var i = instByName(s);
    return i ? i.name : String(s || "").trim();
}

function yshVal(v) {
    var t = String(v == null ? "" : v).trim().toLowerCase();
    if (!t) return "u";
    if (/^(כן|v|✓|✔|true|yes|1)$/.test(t)) return "y";
    if (/^(לא|x|✗|✘|false|no|0)$/.test(t)) return "n";
    if (/^(ספק|\?|אולי)$/.test(t)) return "m";
    return "u";
}

var YSH_RATE = [ "strong", "warm", "weak", "unclear" ];

function yshRate(v) {
    var t = String(v || "");
    if (t.indexOf("חזק") >= 0) return "strong";
    if (t.indexOf("חלש") >= 0) return "weak";
    if (t.indexOf("חם") >= 0) return "warm";
    return "unclear";
}

var YSH_COLS = [ "ישיבה", "בקבוצה", "בדף צוות", "זום", "דירוג", "רכז פעיל", "הערת מצב", "עודכן" ];

var YADD_COLS = [ "ישיבה", "מתי", "איש קשר", "הערה", "מזהה" ];

function yshCols(head, names) {
    var h = (head || []).map(function(x) {
        return String(x || "").trim();
    });
    return names.map(function(n, i) {
        var at = h.indexOf(n);
        return at >= 0 ? at : i;
    });
}
