var SID_BAK = "גיבוי מזהים · ";

var SID_HEAD = {
    marks: [ "מסכת", "דף", "עמוד", "נתונים" ],
    own: [ "מסכת", "דף", "פירוש" ],
    q: [ "מסכת", "דף", "שאלות" ],
    deck: [ "מסכת", "דף", "עוגנים" ]
};

function sidHead_(k, rows) {
    var h = rows && rows[0];
    return h && String(h[0] || "").indexOf("מסכת") >= 0 ? h : SID_HEAD[k];
}
/* ============================================================
   ההסבה בחלקים - לשונית אחת בכל לחיצה.
   ============================================================
   הגרסה הקודמת עשתה הכול בלחיצה אחת, וגיבתה מהמכשיר: שלחה כל
   לשונית כטבלה וקראה בחזרה. גוגל ממיר בדרך מלל שנראה כמו מספר,
   ולכן הגיבוי לא אומת - "הגיבוי לא אומת - לא נכתב דבר".

   עכשיו כל לחיצה: קוראים מחדש את ארבע הלשוניות, מחשבים את
   ההסבה, ושולחים לסקריפט **לשונית אחת** - הראשונה שעוד לא
   הוסבה. הסקריפט מגבה אותה בעצמו (העתק של הלשונית), בודק את
   הגיבוי, כותב בפעולה אחת, מאמת, ואם לא - מחזיר את מה שהיה
   (sidStep_ ב-apps-script.gs). אחר כך המכשיר קורא שוב ובודק בעצמו.
   הסדר: "סימוני הדף" קודם - בלי המזהים שם, לפירוש אין למה להיקשר.
   לחיצה שנקטעה באמצע - הלחיצה הבאה רואה מה כבר בגיליון וממשיכה.
   ============================================================ */
var SID_VER = 56;
/* שורות הלשונית בלי הכותרת, כמחרוזות ברוחב קבוע - להשוואה */
function sidFlat_(rows, w) {
  return JSON.stringify((rows || []).map(function (r) {
    var o = [];
    for (var j = 0; j < w; j++) o.push(String(r && r[j] != null ? r[j] : ''));
    return o;
  }));
}
function sidWidth_(rows) {
  var w = 0;
  (rows || []).forEach(function (r) { if (r && r.length > w) w = r.length; });
  return w;
}
/* סימוני הדף אחרי ההסבה - באותו סדר ובאותו מספר שורות כמו בגיליון.
   SidParse מדלג על שורה בלי מסכת; כאן היא נשארת במקומה. */
function sidMarksPlan_(rows, r) {
  var data = rows.slice(1), plan = data.map(function (x) { return x.slice(); });
  var recs = SidParse(data), conv = r.marks.slice(1);
  recs.forEach(function (R, j) { if (conv[j]) plan[R.i] = conv[j].slice(); });
  return plan;
}
function sidState_(t) {
  var o = sidMap_(t.own), q = sidMap_(t.q), d = sidMap_(t.deck);
  SID.tabs = t;
  SID.res = SidMigrate(t.marks, o.map, q.map, d.map);
  var plan = {}, todo = {}, next = '', bad = '';
  Object.keys(SID_TABS).forEach(function (k) {
    var rows = t[k] || [];
    if (rows.length && String((rows[0] || [])[0] || '').indexOf('מסכת') < 0) bad = bad || SID_TABS[k];
    plan[k] = k === 'marks' ? sidMarksPlan_(rows, SID.res) : sidRows_(rows, SID.res[k]);
    var w = Math.max(sidWidth_(rows), sidWidth_(plan[k]));
    todo[k] = sidFlat_(rows.slice(1), w) !== sidFlat_(plan[k], w);
    if (todo[k] && !next) next = k;
  });
  SID.plan = plan; SID.todo = todo; SID.next = bad ? '' : next; SID.bad = bad;
  return SID;
}
function sidProg_() {
  if (!SID.todo) return '';
  if (SID.bad) return '<div class="bad" style="margin-top:10px">ללשונית "' + esc(SID.bad) +
    '" אין שורת כותרת - ההסבה לא תרוץ עליה.</div>';
  return '<div class="cond" style="margin-top:10px">' + Object.keys(SID_TABS).map(function (k) {
    return (SID.todo[k] ? '◻ ' : '✓ ') + esc(SID_TABS[k]) + (SID.todo[k] ? ' - ממתינה' : ' - מוסבת');
  }).join('<br>') + '</div>';
}
/* התשובה של הסקריפט לצעד שנשלח (rid), בקריאה חוזרת עד שהיא מגיעה */
function sidWait_(rid, tries) {
  return new Promise(function (ok) { setTimeout(ok, 3000); }).then(function () {
    return scriptGet({ sidStep: 1, key: (CFG.readKey || '').trim() }).catch(function () { return null; });
  }).then(function (d) {
    if (d && d.sid && d.sid.rid === rid) return d.sid;
    if ((tries || 0) < 40) return sidWait_(rid, (tries || 0) + 1);
    throw new Error('לא התקבלה תשובה מהסקריפט. ייתכן שהוא עוד עובד - לחצו "בדיקה" בעוד דקה: ' +
                    'היא תראה מה כבר נכתב, וההסבה תמשיך משם.');
  });
}
function sidSend_(body) {
  var rid = 'r' + Date.now() + Math.floor(Math.random() * 1000);
  body.action = 'sidStep'; body.rid = rid; body.key = (CFG.readKey || '').trim();
  /* no-cors: גם "כישלון" ברשת אינו אומר שלא נכתב - שואלים את הסקריפט */
  return fetch((CFG.api || API || '').trim(), { method:'POST', mode:'no-cors', body: JSON.stringify(body) })
    .catch(function () {}).then(function () { return sidWait_(rid, 0); });
}
/* הסקריפט בגרסה שמכירה את הצעד? בלי זה הבקשה הייתה נבלעת בשקט. */
function sidServer_() {
  return scriptGet({ sidStep: 1, key: (CFG.readKey || '').trim() }).then(function (d) {
    if (!d || !(+d.version >= SID_VER)) throw new Error('הסקריפט בגוגל עוד לא עודכן לגרסה ' + SID_VER +
      ' (עכשיו: ' + esc(String(d && d.version || '?')) + '). נסו שוב בעוד כמה דקות. לא נכתב דבר.');
    if (d.status === 'denied') throw new Error('הסקריפט דחה את הסיסמה. לא נכתב דבר.');
  });
}



function sidRestore() {
    if (SID.busy) return;
    if (!(CFG.readKey || "").trim()) {
        sidSay_("bad", "צריך סיסמת סקריפט במכשיר (למעלה במסך הזה).");
        return;
    }
    if (!confirm("להחזיר למצב שבגיבוי כל לשונית שהוסבה?\n\n" + "מה שנכתב בהן אחרי הגיבוי יוחלף. מה שיש בהן עכשיו יישמר בגיליון בשם צדדי, ויירד גם למכשיר.")) return;
    var names = Object.keys(SID_TABS), done = [], skip = [];
    SID.busy = true;
    sidSay_("cond", "קורא את המצב הנוכחי…");
    sidServer_().then(function() {
        return sidRead_();
    }).then(function(cur) {
        saveFile("hadaf-before-restore-" + stamp() + ".json", JSON.stringify(cur));
        var w = Promise.resolve();
        names.forEach(function(k) {
            w = w.then(function() {
                sidSay_("cond", 'משחזר את "' + SID_TABS[k] + '"…');
                return sidSend_({
                    tab: SID_TABS[k],
                    mode: "restore"
                }).then(function(res) {
                    if (res.status === "nobak") {
                        skip.push(SID_TABS[k]);
                        return;
                    }
                    if (res.status !== "ok") throw new Error('"' + SID_TABS[k] + '": ' + esc(res.message || res.status || "") + (done.length ? ". כבר שוחזרו: " + done.join(", ") : ""));
                    done.push(SID_TABS[k]);
                });
            });
        });
        return w;
    }).then(function() {
        SID.busy = false;
        SID.res = null;
        SID.tabs = null;
        SID.todo = null;
        SID.next = "";
        sidSay_("ok", (done.length ? "✓ שוחזרו ואומתו: " + done.join(", ") + "." : "לא שוחזר דבר.") + (skip.length ? " בלי גיבוי מאומת (לא נגעו בהן): " + skip.join(", ") + "." : ""));
    }).catch(function(e) {
        SID.busy = false;
        sidSay_("bad", e && e.message || "השחזור נעצר.");
    });
}


/* ============================================================
   עוגנים לשקף שאיננו.
   ============================================================
   "כאשר אני מוחק שקף, צריך להימחק גם העוגן שלו, כדי שלא יהיה עוגן
   יתום." עוגן ששקף שלו אינו ברשימה לא עושה כלום (`anchPos_` בדף
   האינטראקטיבי מדלג עליו), ולכן הסרתו אינה משנה דבר לתלמיד - היא
   רק מנקה. שלושה מקומות:
   · 🗑 מחיקה לצמיתות - השאלה מונה את העוגנים, והם יוצאים אחרי
     שהקובץ נמחק.
   · ✕ הוצאה מהמצגת - אחרי השמירה, אם השקף אינו עוד באף מצגת,
     שואלים אם להסיר את העוגנים שלו.
   · כרטיס "עוגנים יתומים" במערכת - בדיקה של הכול, והסרה באישור.
   ההסרה עצמה בסקריפט (deckDrop_), ואחריה קריאה חוזרת שמוודאת.
   ============================================================ */
var ANCH_TAB = 'מצגת', ANCHC = { busy:false, msg:'', cls:'', list:null, nums:0 };
function anchRead_() {
  var key = (CFG.readKey || '').trim();
  return Promise.all([scriptGet({ read: ANCH_TAB, key: key }),
                      scriptGet({ read: 'סימוני הדף', key: key })]).then(function (r) {
    if (!r[0] || r[0].status !== 'ok' || !r[1] || r[1].status !== 'ok') throw new Error('read');
    return { deck: r[0].rows || [], marks: r[1].rows || [] };
  });
}
/* כל העוגנים שהערך שלהם עונה על `test`, עם מספר הקטע לתצוגה */
function anchFind_(t, test) {
  var out = [], recs = SidParse((t.marks || []).slice(1)), flat = {};
  (t.deck || []).slice(1).forEach(function (r) {
    var o;
    try { o = JSON.parse(r[2]); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;
    for (var k in o) {
      if (!o.hasOwnProperty(k) || k.indexOf('__') === 0 || !test(o[k])) continue;
      var n = /^\d+$/.test(k) ? +k : 0;
      if (!n) {
        var fk = r[0] + '|' + SidDaf(r[1]);
        if (!flat[fk]) flat[fk] = SidFlat(recs, r[0], r[1]).flat;
        flat[fk].some(function (v) {
          if (v.part === 1 && (v.id === k || (v.also || []).indexOf(k) >= 0)) { n = v.n; return true; }
          return false;
        });
      }
      out.push({ mas: r[0], daf: r[1], key: k, val: o[k], n: n });
    }
  });
  return out;
}
function anchDesc_(list) {
  return list.map(function (a) {
    var t = trackById(a.mas);
    return (t ? t.masechet : a.mas) + ' ' + a.daf + (a.n ? ' · ' + fill(UI.anchSeg, { n: a.n }) : '');
  }).join(', ');
}
/* כל השקפים שבמצגות, כנתיב מלא - כמו dkRmWhere */
function anchInDecks_(map) {
  var all = {}, k;
  for (k in (map || {})) {
    if (!map.hasOwnProperty(k) || !map[k]) continue;
    (map[k].files || []).forEach(function (f) { all[f.indexOf('/') >= 0 ? f : map[k].dir + '/' + f] = 1; });
  }
  for (k in (typeof CONTENT !== 'undefined' ? CONTENT : {})) {
    var d = CONTENT[k] && CONTENT[k].deck;
    if (!d || !d.dir || (map && map[k])) continue;
    for (var i = 1; i <= d.n; i++) all[d.dir + '/' + (i < 10 ? '0' : '') + i + '.jpg'] = 1;
  }
  return all;
}
function anchShown_(all, v) {
  if (typeof v !== 'string') return true;
  if (v.indexOf('/') >= 0) return !!all[v];
  for (var p in all) if (all.hasOwnProperty(p) && p.slice(-(v.length + 1)) === '/' + v) return true;
  return false;
}
/* הסרה, ואחריה קריאה חוזרת עד שאין עוד עוגן לנתיבים האלה */
function anchDrop_(paths) {
  var want = {};
  paths.forEach(function (p) { want[p] = 1; });
  return fetch((CFG.api || API || '').trim(), { method:'POST', mode:'no-cors', body: JSON.stringify({
    action:'deckDrop', key:(CFG.readKey || '').trim(), paths: JSON.stringify(paths) }) })
    .catch(function () {}).then(function () { return anchGone_(want, 0); });
}
function anchGone_(want, tries) {
  return new Promise(function (ok) { setTimeout(ok, tries ? 2500 : 1500); }).then(function () {
    return anchRead_();
  }).then(function (t) {
    if (!anchFind_(t, function (v) { return typeof v === 'string' && !!want[v]; }).length) return true;
    return tries < 4 ? anchGone_(want, tries + 1) : false;
  }, function () { return tries < 4 ? anchGone_(want, tries + 1) : false; });
}
/* ✕ - שקפים שהוצאו מהמצגת מאז השמירה האחרונה. אחרי שהשמירה אומתה
   (`dkSave`), מי שאינו עוד באף מצגת - העוגנים שלו מוצעים להסרה. */
var ANCH_OUT = [];
function anchAfterOut_(map) {
  var out = ANCH_OUT.slice(), all = anchInDecks_(map);
  ANCH_OUT = [];
  out = out.filter(function (p, i) { return out.indexOf(p) === i && !all[p]; });
  if (!out.length || !(CFG.readKey || '').trim()) return;
  anchRead_().then(function (t) {
    var list = anchFind_(t, function (v) { return out.indexOf(v) >= 0; });
    if (!list.length) return;
    if (!window.confirm(fill(UI.anchOutQ, { list: anchDesc_(list) }))) return;
    dkMsg('', UI.anchBusy);
    anchDrop_(out).then(function (good) { dkMsg(good ? 'ok' : 'bad', good ? UI.anchDone : UI.anchBad); });
  }).catch(function () {});
}
function anchCard() {
  var L = ANCHC.list;
  return '<div class="adm-card" style="margin-bottom:11px"><h4>' + esc(UI.anchTitle) + '</h4>' +
    '<p class="h">' + esc(UI.anchIntro) + '</p>' +
    '<button class="btn g" onclick="anchCheck()"' + (ANCHC.busy ? ' disabled' : '') + '>' + esc(UI.anchChk) + '</button>' +
    (L && L.length ? '<div class="cond" style="margin-top:10px">' + esc(UI.anchFound) + '<br>' +
       L.map(function (a) { return esc(anchDesc_([a])) + ' → <code dir="ltr">' + esc(a.val) + '</code>'; }).join('<br>') +
       '</div><button class="btn gd" style="margin-top:8px" onclick="anchClean()"' +
       (ANCHC.busy ? ' disabled' : '') + '>' + esc(UI.anchDelAll) + '</button>' : '') +
    (ANCHC.msg ? '<div class="' + (ANCHC.cls || 'cond') + '" style="margin-top:10px">' + esc(ANCHC.msg) + '</div>' : '') +
    '</div>';
}
function anchSay_(cls, msg) { ANCHC.cls = cls; ANCHC.msg = msg; admPane(); }
function anchCheck() {
  if (!(CFG.readKey || '').trim()) { anchSay_('bad', UI.dkmNoKey); return; }
  ANCHC.busy = true; ANCHC.list = null; anchSay_('cond', UI.anchBusy);
  DeckLoad().then(function (ok) {
    if (!ok || !DECKS) throw new Error('decks');
    return anchRead_();
  }).then(function (t) {
    var all = anchInDecks_(DECKS);
    ANCHC.list = anchFind_(t, function (v) { return !anchShown_(all, v); });
    ANCHC.nums = anchFind_(t, function (v) { return typeof v === 'number'; }).length;
    ANCHC.busy = false;
    anchSay_(ANCHC.list.length ? 'cond' : 'ok', (ANCHC.list.length ? '' : UI.anchNone + ' ') +
      (ANCHC.nums ? fill(UI.anchNums, { n: ANCHC.nums }) : ''));
  }).catch(function () { ANCHC.busy = false; anchSay_('bad', UI.anchNoRead); });
}
function anchClean() {
  var L = ANCHC.list;
  if (!L || !L.length || ANCHC.busy) return;
  if (!window.confirm(fill(UI.anchDelQ, { n: L.length, list: anchDesc_(L) }))) return;
  var paths = [];
  L.forEach(function (a) { if (paths.indexOf(a.val) < 0) paths.push(a.val); });
  ANCHC.busy = true; anchSay_('cond', UI.anchBusy);
  anchDrop_(paths).then(function (good) {
    ANCHC.busy = false; if (good) ANCHC.list = [];
    anchSay_(good ? 'ok' : 'bad', good ? UI.anchDone : UI.anchBad);
  });
}

function sidRun() {
    if (!SID.res || SID.busy) return;
    if (!(CFG.readKey || "").trim()) {
        sidSay_("bad", "צריך סיסמת סקריפט במכשיר (למעלה במסך הזה).");
        return;
    }
    var k = "", name = "";
    SID.busy = true;
    sidSay_("cond", "קורא שוב את ארבע הלשוניות…");
    sidServer_().then(function() {
        return sidRead_();
    }).then(function(t) {
        sidState_(t);
        if (SID.bad) throw new Error('ללשונית "' + SID.bad + '" אין שורת כותרת. לא נכתב דבר.');
        k = SID.next;
        if (!k) {
            SID.busy = false;
            sidSay_("ok", "✓ ארבע הלשוניות כבר מוסבות. לא נכתב דבר.");
            return null;
        }
        name = SID_TABS[k];
        var left = Object.keys(SID_TABS).filter(function(x) {
            return SID.todo[x];
        }).length;
        if (!confirm('להסב את "' + name + '"?\n\nנותרו ' + left + " מתוך 4 לשוניות. " + 'הסקריפט יעתיק קודם את הלשונית ל"' + SID_BAK + name + '" ויבדוק את ההעתק, ' + "ורק אז יכתוב ויאמת. לא מאומת - הוא מחזיר את מה שהיה.\n" + "גם למכשיר יירד קובץ של הלשונית כפי שהיא עכשיו.")) {
            SID.busy = false;
            sidSay_("cond", "בוטל. לא נכתב דבר.");
            return null;
        }
        saveFile("hadaf-stepid-" + k + "-" + stamp() + ".json", JSON.stringify(t[k]));
        sidSay_("cond", 'מגבה, כותב ומאמת את "' + name + '"…');
        return sidSend_({
            tab: name,
            head: JSON.stringify(sidHead_(k, t[k])),
            base: JSON.stringify(t[k]),
            plan: JSON.stringify(SID.plan[k])
        }).then(function(res) {
            if (res.status === "rolledback") throw new Error('"' + name + '": ' + esc(res.message || "") + " - " + esc(res.back || "") + '. הגיבוי: "' + esc(res.backup || "") + '".');
            if (res.status === "changed") throw new Error('"' + name + '" השתנתה בגיליון בזמן הלחיצה. לא נכתב דבר - לחצו שוב.');
            if (res.status !== "ok") throw new Error('"' + name + '": ' + esc(res.message || res.status || "") + ". לא נכתב דבר.");
            return sidRead_().then(function(t2) {
                var want = SID.plan[k];
                sidState_(t2);
                var w = Math.max(sidWidth_(want), sidWidth_(t2[k]));
                if (sidFlat_(t2[k].slice(1), w) !== sidFlat_(want, w)) throw new Error('הסקריפט דיווח שנכתב, אבל "' + name + '" אינה זהה לתוכנית. הגיבוי: "' + esc(res.backup || "") + '".');
                var rest = Object.keys(SID_TABS).filter(function(x) {
                    return SID.todo[x];
                });
                SID.busy = false;
                sidSay_("ok", '✓ "' + esc(name) + '" ' + (res.already ? "כבר הייתה מוסבת" : "הוסבה ואומתה: " + res.cells + " תאים, " + res.added + " שורות נוספו") + '. גיבוי: "' + esc(res.backup || "") + '".' + (res.aside ? ' גיבוי ישן באותו שם הועבר ל"' + esc(res.aside) + '".' : "") + (rest.length ? " נותרו: " + rest.map(function(x) {
                    return esc(SID_TABS[x]);
                }).join(", ") + "." : " ארבע הלשוניות מוסבות."));
            });
        });
    }).catch(function(e) {
        SID.busy = false;
        sidSay_("bad", e && e.message || "ההסבה נעצרה.");
    });
}


function admSet(el) {
    el.innerHTML = '<div class="adm-card" style="margin-bottom:11px">' + "<h4>בדיקת שקפים מדרייב</h4>" + '<p class="h">בדיקה חד־פעמית: האם תמונה מדרייב נטענת אצל תלמיד. ' + "לפתוח <b>בגלישה בסתר</b>, ולבדוק על קובץ <b>JPG</b>.</p>" + '<a class="btn gd" style="text-align:center;display:block;' + 'text-decoration:none" href="/slidetest">לעמוד הבדיקה ←</a></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>יעדי שליחה</h4>' + '<p class="h">כל עוד אין כתובת שרת, הרשמות נשלחות כהודעת וואטסאפ לרכז.</p>' + '<div class="fld"><div class="label">וואטסאפ של הרכז (972…)</div>' + '<input type="tel" dir="ltr" value="' + esc(CV("coordWa") || COORD_WA) + "\" onchange=\"cfgSet('coordWa',this.value.replace(/[^0-9]/g,''))\"></div>" + '<div class="fld"><div class="label">כתובת שרת (Apps Script / Firebase)</div>' + '<input type="text" dir="ltr" placeholder="https://script.google.com/…/exec" value="' + esc(CFG.api || API) + '" onchange="cfgSet(\'api\',this.value.trim())"></div>' + (apiOld() ? '<div class="cond" style="margin:6px 0">במכשיר הזה שמורה כתובת שרת ' + "ששונה מהכתובת הקבועה שבקוד. שליחת התראות ממנו חסומה עד שחוזרים לקבועה.</div>" + '<button class="btn p" style="margin-bottom:8px" onclick="apiReset()">חזרה לכתובת הקבועה</button>' : "") + '<button class="btn g" onclick="admPing()">בדיקת חיבור</button>' + '<div id="adm-ping"></div></div>' + clockCard() + '<div class="adm-card" style="margin-bottom:11px">' + "<h4>קבוצת הוואטסאפ</h4>" + '<p class="h">מוצעת לתלמיד ולהורה אחרי ההרשמה, כהצעה שקטה ולא כחובה. ' + "ריק = לא מוצע לאיש.<br>" + "<b>לא נשמר בקוד ולכן חייב פרסום</b> כדי שיגיע לתלמידים.</p>" + '<div class="fld"><div class="label">קישור ההצטרפות</div>' + '<input type="text" dir="ltr" placeholder="https://chat.whatsapp.com/…" value="' + esc(CV("waGroup") || "") + '" onchange="cfgSet(\'waGroup\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סטודיו הסימון</h4>' + '<p class="h">חלוקת הדף לקטעים וקישורם לביאור חברותא. ' + "נפתח כאפליקציה נפרדת, עם אייקון משלה.</p>" + '<a class="btn gd" style="display:block;text-align:center;text-decoration:none" ' + 'href="/studio">פתיחת הסטודיו</a>' + '<button class="btn g" style="margin-top:8px" onclick="admCopyStudio()">' + "העתקת הקישור - לעוזרי עריכה</button>" + '<div id="adm-studio-msg"></div>' + '<p class="h" style="margin-top:12px">מעבדה - ניסוי שיטת זיהוי ' + "חדשה על דפים אקראיים, בלי לגעת בסטודיו ובלי לשמור דבר.</p>" + '<a class="btn g" style="display:block;text-align:center;text-decoration:none" ' + 'href="lab.html">פתיחת המעבדה</a></div>' + sidCard() + anchCard() + '<div class="adm-card" style="margin-bottom:11px"><h4>הניהול כאפליקציה</h4>' + '<p class="h">אייקון זהב נפרד במסך הבית, שנפתח ישר כאן. הוא חי לצד ' + "האפליקציה הרגילה ואינו מחליף אותה.</p>" + '<div id="adm-inst"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>גרסה</h4>' + '<p class="h">אם משהו נראה ישן - כאן מרעננים בכוח: מוחק את המטמון ' + "וטוען מחדש מהשרת. ההגדרות וההרשמות אינן נמחקות.</p>" + '<div class="row" style="padding:8px 0"><span>גרסת האפליקציה</span>' + "<b>" + esc(APP_VERSION) + "</b></div>" + '<button class="btn g" onclick="admRefresh()">רענון מלא מהשרת</button></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>גוגל־שיטס</h4>' + '<p class="h">הגיליון צריך להיות משותף כ"כל מי שיש לו הקישור - מציג". ' + "גיליון אנשי הקשר נשמר על המכשיר הזה בלבד ואינו בקוד.</p>" + '<div class="fld"><div class="label">מזהה גיליון המוסדות (ציבורי)</div>' + '<input type="text" dir="ltr" value="' + esc(CFG.sheetId || SHEET_ID) + '" onchange="cfgSet(\'sheetId\',this.value.trim())"></div>' + '<div class="fld"><div class="label">שם הלשונית</div>' + '<input type="text" value="' + esc(CFG.sheetTab || SHEET_TAB) + '" onchange="cfgSet(\'sheetTab\',this.value.trim())"></div>' + '<button class="btn g" onclick="loadInstitutions().then(function(ok){' + "alert(ok?'המוסדות עודכנו מהגיליון.':'לא הצלחתי לקרוא מהגיליון.');renderHome();admPane();})\">" + "טעינת רשימת המוסדות</button>" + '<div class="fld" style="margin-top:13px"><div class="label">' + "מזהה גיליון אנשי הקשר (פרטי)</div>" + '<input type="text" dir="ltr" placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.contactsSheet || "") + '" onchange="cfgSet(\'contactsSheet\',this.value.trim())"></div>' + '<div class="fld"><div class="label">שם הלשונית</div>' + '<input type="text" value="' + esc(CFG.contactsTab || "גיליון1") + '" onchange="cfgSet(\'contactsTab\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סיסמת הקריאה</h4>' + '<p class="h">אותה מחרוזת שכתובה ב-Apps Script בשורת ' + "<code>READ_KEY</code>. בלעדיה מסך המשתתפים יישאר ריק - ובלעדיה " + "גם אף אחד אחר אינו יכול לקרוא את רשימת התלמידים. נשמרת על " + "המכשיר הזה בלבד ואינה מתפרסמת.</p>" + '<div class="fld"><input type="text" dir="ltr" ' + 'placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.readKey || "") + '" onchange="cfgSet(\'readKey\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>סיסמת עמוד הצוות</h4>' + '<p class="h">מחרוזת חדשה ונפרדת - אינה סיסמת הקריאה. הדביקו אותה גם ' + "ב-Apps Script בשורת <code>TEAM_KEY</code>, וגם כאן. זו הסיסמה שמותר " + 'למסור הלאה: היא פותחת רק את "עמוד הצוות" (מוקד שיחות ← קישור לעמוד ' + "הצוות), ובו רק מה שסימנתם להציג - לא את רשימת אנשי הקשר המלאה.</p>" + '<div class="fld"><input type="text" dir="ltr" ' + 'placeholder="נשמר על המכשיר בלבד" value="' + esc(CFG.teamKey || "") + '" onchange="cfgSet(\'teamKey\',this.value.trim())"></div></div>' + '<div class="adm-card" style="margin-bottom:11px"><h4>קוד הכניסה לניהול</h4>' + '<p class="h">ארבע ספרות. שמור אותו - בלעדיו אין כניסה למסך הזה.</p>' + '<div class="fld"><input type="tel" dir="ltr" maxlength="4" value="' + esc(CFG.pin || ADMIN_PIN) + '" onchange="admPin(this.value)"></div></div>' + '<div class="adm-card"><h4>גיבוי</h4>' + '<p class="h">כל ההגדרות וההרשמות שמורות על המכשיר הזה. שמור גיבוי לפני מחיקת היסטוריה.</p>' + '<button class="btn g" onclick="admExport()">העתקת גיבוי</button>' + '<button class="btn g" style="margin-top:8px" onclick="admImport()">שחזור מגיבוי</button></div>';
}


function admPin(v) {
    v = String(v).replace(/[^0-9]/g, "").slice(0, 4);
    if (v.length !== 4) {
        alert("הקוד חייב להיות בן ארבע ספרות.");
        admPane();
        return;
    }
    cfgSet("pin", v);
    alert("הקוד עודכן.");
}

function admExport() {
    var dump = {
        cfg: CFG,
        contacts: contacts(),
        reg: regSaved(),
        registrations: Store.get("registrations", [])
    };
    var t = JSON.stringify(dump);
    if (navigator.clipboard) navigator.clipboard.writeText(t);
    alert("הגיבוי הועתק. שמור אותו במקום בטוח.");
}

function admImport() {
    var t = prompt("הדביקו את הגיבוי:");
    if (!t) return;
    try {
        var d = JSON.parse(t);
        if (d.cfg) {
            CFG = d.cfg;
            Store.set("cfg", CFG);
            applyCfg();
        }
        if (d.contacts) saveContacts(d.contacts);
        if (d.reg) localStorage.setItem("dfReg", JSON.stringify(d.reg));
        if (d.registrations) Store.set("registrations", d.registrations);
        alert("שוחזר.");
        renderAdmin();
    } catch (e) {
        alert("הגיבוי אינו תקין.");
    }
}
