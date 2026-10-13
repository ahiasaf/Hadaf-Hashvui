function amdaWaGrade(s) {
    var m = String(s || "").replace(/["'׳״\s]/g, "").replace(/^שכבה/, "").replace(/^כיתה/, "");
    return AMDA_GRADES.indexOf(m) >= 0 ? m : "";
}

function amdaWaFile() {
    var inp = document.getElementById("aw-file");
    if (!inp) return;
    inp.value = "";
    inp.click();
}

function amdaWaPicked(inp) {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var rd = new FileReader;
    rd.onload = function() {
        amdaNeedXlsx().then(function() {
            var rows = null;
            try {
                rows = amdaWaFromSheets(XLSX_READ(rd.result));
            } catch (e) {
                rows = null;
            }
            if (!rows || !rows.length) {
                alert(amdaT("waBad"));
                return;
            }
            var p = {
                at: Date.now(),
                rows: rows
            };
            Store.set("amdaPh", p);
            amdaWa.msg = amdaT("waSaving", {
                n: rows.length
            });
            admPane();
            amdaWaPush(p);
        }).catch(function() {
            alert(amdaT("waBad"));
        });
    };
    rd.readAsArrayBuffer(f);
}

var AMDA_PH_COLS = [ "שכבה", "שם משפחה", "שם פרטי", "טלפון" ];

function amdaWaPush(p) {
    var key = (CFG.readKey || "").trim(), url = (CFG.api || API || "").trim();
    var n = p.rows.length;
    if (!key || !url) {
        amdaWa.msg = amdaT("waNoSave", {
            n: n
        });
        admPane();
        return;
    }
    fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "table",
            tab: AMDA_PHONES,
            key: key,
            cols: JSON.stringify(AMDA_PH_COLS),
            rows: JSON.stringify(p.rows)
        })
    }).catch(function() {}).then(function() {
        return new Promise(function(ok) {
            setTimeout(ok, 2500);
        });
    }).then(function() {
        return amdaWaRead();
    }).then(function(got) {
        amdaWa.msg = amdaT(got && got.rows.length === n ? "waSaved" : "waNoSave", {
            n: n
        });
        admPane();
    });
}

function amdaWaRead() {
    var key = (CFG.readKey || "").trim();
    if (!key) return Promise.resolve(null);
    return scriptGet({
        read: AMDA_PHONES,
        key: key
    }).then(function(d) {
        if (!d || d.status !== "ok" || !d.rows) return null;
        var h = d.rows[0] || [], ix = AMDA_PH_COLS.map(function(c) {
            return h.indexOf(c);
        });
        if (d.rows.length && (ix[0] < 0 || ix[1] < 0 || ix[2] < 0 || ix[3] < 0)) return null;
        var rows = [];
        d.rows.slice(1).forEach(function(x) {
            var g = String(x[ix[0]] || ""), l = String(x[ix[1]] || ""), f = String(x[ix[2]] || "");
            if (g && l && f) rows.push([ g, l, f, amdaWaTel(x[ix[3]]) ]);
        });
        return {
            at: Date.now(),
            rows: rows
        };
    }).catch(function() {
        return null;
    });
}

function amdaWaPull(quiet) {
    amdaWaRead().then(function(p) {
        if (p && p.rows.length) {
            Store.set("amdaPh", p);
            if (!quiet) amdaWa.msg = amdaT("waPulled", {
                n: p.rows.length
            });
        } else if (!quiet) amdaWa.msg = amdaT(p ? "waNoPull" : "waNoRead");
        if (p || !quiet) admPane();
    });
}

/* ============================================================
   מאגר תלמידי הרשת - הקובץ המלא של משרד החינוך.
   ============================================================
   הקובץ נקרא כאן, במכשיר של הרכז, ו**רק** העמודות שבנוסח
   netLead יוצאות ממנו: בית ספר, שכבה, כיתה, שם, טלפון התלמיד
   וטלפון ההורה. תעודות זהות, כתובות, תאריכי לידה ופרטי ההורים
   האחרים לא נשלחים לשום מקום.

   הנתונים נכתבים ללשונית הפרטית "תלמידי הרשת" - שהשרת כבר קורא
   ממנה (amdaDir_) - ו**אינם נשמרים במכשיר**: לא ב-Store ולא בשום
   מטמון. מה שנשאר במכשיר: ההתאמה סמל מוסד ← ישיבה (אינה סוד),
   והמספרים של ההעלאה האחרונה.

   כל ישיבה במשרד מזוהה ב"סמל מוסד". בהעלאה הראשונה הרכז מתאים
   כל סמל לישיבה שבאפליקציה (עם ניחוש לפי השם); מההעלאה הבאה
   ההתאמה כבר זכורה.

   השורה נכנסת רק כשבית הספר מותאם - תלמידי בית ספר שאינו בתוכנית
   אינם נשלחים כלל.
   ============================================================ */
var NET_TAB  = 'תלמידי הרשת';
var NET_COLS = ['קוד ישיבה', 'שכבה', 'כיתה', 'משפחה', 'פרטי', 'טלפון', 'טלפון הורה', 'קרבה', 'סמל מוסד'];
var NET = null;                                   /* הקובץ שנקרא - בזיכרון בלבד */
var netMsg = '';

/* 0501234567 · ‎+972-50… → 0501234567. מה שאינו נייד ישראלי - ריק. */
function netTel(v) {
  var d = String(v || '').replace(/\D/g, '');
  if (d.indexOf('972') === 0) d = '0' + d.slice(3);
  if (d.length === 9 && d.charAt(0) === '5') d = '0' + d;
  return /^05\d{8}$/.test(d) ? d : '';
}
/* השם בלי "ישיבת", "בני עקיבא", יב"ע, ובלי ו"י וגרשיים - כך "תקות"
   ו"תקוות" הם אותו שם. */
function netNorm(s) {
  return String(s || '').replace(/ראשל"צ|ראשלצ/g, 'ראשון לציון')
    .replace(/ישיבת|ישיבה|אולפנת|אולפנה|בני עקיבא|בנ"ע|בנע|יב"ע|יבע|תיכונית|תורנית/g, '')
    .replace(/["'׳״\-\s]/g, '').replace(/[וי]/g, '');
}
var NET_KIND = /ישיב|ק\. ?חינוך|קרית חינוך|מוסדות בני עקיבא/;
/* שמות במשרד שאינם דומים לשם באפליקציה. נבדק מול השם + המיקום,
   ולפני כל ניחוש אחר: "נווה הרצוג" במשרד היא "יבנה" אצלנו, וכל
   מוסד בני עקיבא במירון הוא בר יוחאי. */
var NET_ALIAS = [['נווה הרצוג', 'yavne'], ['מירון', 'baryohai'], ['חולון', 'harel'],
                 ['רחובות', 'hadarom'], ['קרית הרצוג', 'kiryat'], ['שדה יעקב', 'tikvot'], [' עלי ', 'eli']];
function netGuess(name, place) {
  var all = ' ' + name + ' ' + (place || '') + ' ', a;
  for (a = 0; a < NET_ALIAS.length; a++) if (all.indexOf(NET_ALIAS[a][0]) >= 0) return NET_ALIAS[a][1];
  var n = netNorm(name), best = '', i;
  if (n.length < 2) return '';
  for (i = 0; i < INSTITUTIONS.length; i++) {
    var m = netNorm(INSTITUTIONS[i].name);
    /* שם קצר מדי ("עלי" → "על") נמצא בתוך כל שם אחר - אינו ניחוש. */
    if (m.length < 3) continue;
    if (m === n) return INSTITUTIONS[i].code;
    if (!best && (n.indexOf(m) >= 0 || m.indexOf(n) >= 0)) best = INSTITUTIONS[i].code;
  }
  if (best) return best;
  /* מילה משותפת אחת ("לפיד מודיעין" ↔ "לפיד תורת נחום") - רק כשהיא
     מובילה לישיבה אחת בלבד. "יעקב" של אביר יעקב ושל תקוות יעקב - לא. */
  var words = function (x) {
    return String(x || '').replace(/ישיבת|בני עקיבא|בנ"ע|יב"ע/g, ' ').replace(/["'׳״\-]/g, '')
      .split(/\s+/).map(function (w) { return w.replace(/[וי]/g, ''); }).filter(function (w) { return w.length >= 3; });
  };
  var mine = words(name), hits = [];
  INSTITUTIONS.forEach(function (x) {
    var ws = words(x.name);
    for (var k = 0; k < mine.length; k++) if (ws.indexOf(mine[k]) >= 0) { hits.push(x.code); return; }
  });
  return hits.length === 1 ? hits[0] : '';
}

/* הגיליון של משרד החינוך: שורת כותרת, ואחריה שורה לכל תלמיד - ולפעמים
   שורה לכל הורה של אותו תלמיד. העמודות מזוהות לפי הכותרת. */
function netFromSheets(sheets) {
  var out = { rows: [], insts: {}, other: {} }, seen = {};
  sheets.forEach(function (sh) {
    var rows = sh.rows, hi = -1, col = {}, i, j;
    for (i = 0; i < Math.min(rows.length, 15) && hi < 0; i++) {
      var r = rows[i], has = {};
      for (j in r) if (r.hasOwnProperty(j)) has[String(r[j]).trim()] = j;
      if (has['שכבה'] && (has['שם פרטי'] || has['שם פרטי כינוי'])) { hi = i; col = has; }
    }
    if (hi < 0 || !col['סמל מוסד']) return;
    out.hdr = true;
    var g = function (r, name) { return col[name] ? String(r[col[name]] || '').trim() : ''; };
    for (i = hi + 1; i < rows.length; i++) {
      var x = rows[i];
      if (g(x, 'סיבת עזיבה') || g(x, 'תאריך סיום שיבוץ')) continue;   /* עזב */
      var sym = g(x, 'סמל מוסד'), gr = g(x, 'שכבה').replace(/["'׳״\s]/g, '');
      var first = g(x, 'שם פרטי כינוי') || g(x, 'שם פרטי');
      var last = g(x, 'שם משפחה כינוי') || g(x, 'שם משפחה');
      if (!sym || !gr || !first) continue;
      /* רק בנים - כשבקובץ יש עמודת "מין". */
      if (col['מין'] && g(x, 'מין') !== 'זכר') continue;
      /* רק ישיבות. במשרד השם כתוב בכמה צורות: "ישיבת…", "ישיבה תיכונית
         בנ"ע עלי", "ק.חינוך בנ"ע חולון", "מוסדות בני עקיבא מירון". */
      if (!NET_KIND.test(g(x, 'שם מוסד'))) continue;
      /* רק השכבות שבתוכנית (ATT_GRADES) - בקובץ המלא יש גם ט׳-י״ב,
         ואין סיבה שיישבו בגיליון. ישיבה שאין בה ז׳-ח׳ נרשמת בצד,
         כדי שיהיה ברור למה היא לא ברשימה. */
      if (ATT_GRADES.indexOf(gr) < 0) {
        if (!out.other[sym]) out.other[sym] = netPlace(g(x, 'שם מוסד'), g(x, 'שם רשות חינוך') || g(x, 'ישוב מוסד'));
        continue;
      }
      var cls = (g(x, 'מקבילה').match(/\d+/) || [''])[0];
      var kid = netTel(g(x, 'מספר נייד 1')) || netTel(g(x, 'מספר נייד 2'));
      var par = netTel(g(x, 'נייד 1')) || netTel(g(x, 'נייד 2'));
      var rel = g(x, 'סוג קירבה תאור');
      var key = [sym, gr, cls, last, first].join('|');
      if (seen[key] !== undefined) {
        /* שורה שנייה של אותו תלמיד - הורה נוסף. האב קודם, כמו בשאר
           המערכת; ומה שחסר משלימים. */
        var o = out.rows[seen[key]];
        if (!o[5] && kid) o[5] = kid;
        if (par && (!o[6] || (rel === 'אב' && o[7] !== 'אב'))) { o[6] = par; o[7] = rel; }
        continue;
      }
      seen[key] = out.rows.length;
      out.rows.push([sym, gr, cls, last, first, kid, par, par ? rel : '']);
      /* מיקום הישיבה = "שם רשות חינוך" (ניר גלים → חבל יבנה); ישוב - כשאין. */
      if (!out.insts[sym]) out.insts[sym] = { name: g(x, 'שם מוסד'), city: g(x, 'ישוב מוסד'),
        loc: g(x, 'שם רשות חינוך') || g(x, 'ישוב מוסד'), n: 0 };
      out.insts[sym].n++;
    }
  });
  for (var k in out.insts) if (out.insts.hasOwnProperty(k)) delete out.other[k];
  return out;
}
function netFile() {
  var inp = document.getElementById('nt-file');
  if (!inp) return;
  inp.value = '';
  inp.click();
}
function netPicked(inp) {
  var f = inp.files && inp.files[0];
  if (!f) return;
  /* קובץ גדול נקרא עשרות שניות, והמסך קופא בזמן הזה - אומרים את זה
     לפני, ונותנים למסך להתעדכן לפני שהקריאה מתחילה. */
  netMsg = UI.netReading; admPane();
  var rd = new FileReader();
  rd.onload = function () {
    amdaNeedXlsx().then(function () { return new Promise(function (ok) { setTimeout(ok, 60); }); }).then(function () {
      var r = null;
      try { r = netFromSheets(XLSX_READ(rd.result)); } catch (e) { r = null; }
      netMsg = '';
      if (!r || !r.hdr) { alert(UI.netBad); return; }
      if (!r.rows.length) { alert(UI.netNoRows); return; }
      var map = Store.get('netMap', {}) || {}, k;
      r.map = {};
      for (k in r.insts) if (r.insts.hasOwnProperty(k)) {
        r.map[k] = map[k] !== undefined ? map[k] : netGuess(r.insts[k].name, r.insts[k].loc + ' ' + r.insts[k].city);
      }
      NET = r; netMsg = '';
      admPane();
    }).catch(function () { alert(UI.netBad); });
  };
  rd.readAsArrayBuffer(f);
}
function netMapSet(sym, code) { if (NET) NET.map[sym] = code; admPane(); }
function netCancel() { NET = null; netMsg = ''; admPane(); }
function netTotals() {
  var m = 0, n = 0, k;
  for (k in NET.insts) if (NET.insts.hasOwnProperty(k) && NET.map[k]) { m++; n += NET.insts[k].n; }
  return { m: m, n: n };
}
function netSave() {
  var key = (CFG.readKey || '').trim(), url = (CFG.api || API || '').trim();
  if (!NET) return;
  if (!key || !url) { netMsg = UI.netNoKey; admPane(); return; }
  var map = NET.map, rows = [], k, schools = {};
  NET.rows.forEach(function (r) {
    if (!map[r[0]]) return;
    schools[map[r[0]]] = 1;
    rows.push([map[r[0]], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[0]]);
  });
  var keep = Store.get('netMap', {}) || {};
  for (k in map) if (map.hasOwnProperty(k)) keep[k] = map[k];
  Store.set('netMap', keep);
  var n = rows.length, s = Object.keys(schools).length;
  netMsg = fill(UI.netSaving, { n: n });
  admPane();
  fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify({
    action: 'table', tab: NET_TAB, key: key,
    cols: JSON.stringify(NET_COLS), rows: JSON.stringify(rows) }) })
    .catch(function () {})
    .then(function () { return new Promise(function (ok) { setTimeout(ok, 4000); }); })
    /* no-cors תמיד "מצליח" - נשמר רק מה שנקרא חזרה מהגיליון. */
    .then(function () { return scriptGet({ read: NET_TAB, key: key }); })
    .then(function (d) {
      var got = d && d.status === 'ok' && d.rows ? d.rows.length - 1 : -1;
      if (got === n) {
        Store.set('netInfo', { n: n, s: s, at: Date.now() });
        NET = null;
        netMsg = fill(UI.netSaved, { n: n });
      } else netMsg = UI.netNoSave;
      admPane();
    })['catch'](function () { netMsg = UI.netNoSave; admPane(); });
}
function admNet(body) {
  var key = (CFG.readKey || '').trim(), info = Store.get('netInfo', null);
  var h = '<div class="adm-card"><h4>' + esc(UI.moreNet) + '</h4>' +
    '<p class="h">' + esc(UI.netLead) + '</p>' +
    '<p class="h"><b>' + esc(info ? fill(UI.netHave, { n: info.n, s: info.s,
      t: new Date(info.at).toLocaleDateString('he-IL') }) : UI.netNone) + '</b>' +
    (netMsg ? '<br>' + esc(netMsg) : '') + '</p>' +
    (key ? '' : '<p class="h" style="color:var(--stop)">' + esc(UI.netNoKey) + '</p>');
  if (NET) {
    var syms = Object.keys(NET.insts).sort(function (a, b) { return NET.insts[b].n - NET.insts[a].n; });
    var opts = function (cur) {
      return '<option value="">' + esc(UI.netSkip) + '</option>' + INSTITUTIONS.map(function (x) {
        return '<option value="' + esc(x.code) + '"' + (x.code === cur ? ' selected' : '') + '>' + esc(x.name) + '</option>';
      }).join('');
    };
    var sm = netTotals();
    h += '<p class="h">' + esc(fill(UI.netRead, { n: NET.rows.length, s: syms.length })) + '</p>';
    syms.forEach(function (k) {
      var it = NET.insts[k];
      h += '<div style="margin:8px 0"><div class="h"><b>' + esc(it.name || k) + '</b> · ' +
        esc(fill(UI.netLoc, { l: netPlace(it.loc || it.city, it.city) })) + ' · ' + it.n + '</div>' +
        '<select style="width:100%;padding:8px;font:inherit" onchange="netMapSet(\'' + esc(k) + '\', this.value)">' +
        opts(NET.map[k]) + '</select></div>';
    });
    var oth = Object.keys(NET.other || {}).map(function (k) { return NET.other[k]; });
    if (oth.length) h += '<p class="h">' + esc(fill(UI.netNoGr, { l: oth.join(' · ') })) + '</p>';
    h += '<p class="h"><b>' + esc(fill(UI.netSum, sm)) + '</b></p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (sm.n && key ? '<button class="btn" onclick="netSave()">' + esc(UI.netSave) + '</button>' : '') +
      '<button class="btn g" onclick="netCancel()">' + esc(UI.netCancel) + '</button></div>';
  } else {
    h += '<button class="btn g" onclick="netFile()">' + esc(UI.netPick) + '</button>';
  }
  h += '<input type="file" id="nt-file" style="display:none" onchange="netPicked(this)"' +
    ' accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>';
  body.innerHTML = h;
}

/* ---------- ההצלבה ----------
   כל תלמיד ברשימה מחפש שורת טלפון באותה שכבה, בשלושה סבבים:
   השם כמו שהוא ("משפחה פרטי"), בסדר ההפוך, ומשפחה + המילה הראשונה
   של השם הפרטי (בשביל "אדיר עמנואל" מול "אדיר"). כל סבב מצמיד רק
   התאמה יחידה, ושורת טלפון נצמדת לתלמיד אחד בלבד. */
function amdaWaIdx() {
    var r = amdaRoster() || {
        g: {}
    }, p = amdaPh() || {
        rows: []
    };
    var sig = (r.at || 0) + "|" + (p.at || 0) + "|" + amdaCount(r).n + "|" + p.rows.length;
    if (amdaWa.idx && amdaWa.sig === sig) return amdaWa.idx;
    var stu = [], used = {}, i;
    AMDA_GRADES.forEach(function(g) {
        var cs = r.g[g] || {};
        Object.keys(cs).sort(function(a, b) {
            return a - b;
        }).forEach(function(c) {
            cs[c].forEach(function(n) {
                stu.push({
                    g: g,
                    c: c,
                    n: n,
                    k: amdaWaNorm(n),
                    p: "",
                    f: ""
                });
            });
        });
    });
    var keys = [ function(x) {
        return [ x[1] + " " + x[2] ];
    }, function(x) {
        return [ x[2] + " " + x[1] ];
    }, function(x) {
        return [ x[1] + " " + x[2].split(" ")[0] ];
    } ];
    var sKeys = [ function(s) {
        return [ s.k ];
    }, function(s) {
        return [ s.k ];
    }, function(s) {
        var t = s.k.split(" "), out = [], j;
        for (j = 1; j < t.length; j++) out.push(t.slice(0, j).join(" ") + " " + t[j]);
        return out;
    } ];
    for (var pass = 0; pass < 3; pass++) {
        var map = {};
        p.rows.forEach(function(x, ri) {
            if (used[ri]) return;
            keys[pass]([ x[0], amdaWaNorm(x[1]), amdaWaNorm(x[2]) ]).forEach(function(k) {
                (map[x[0] + "|" + k] = map[x[0] + "|" + k] || []).push(ri);
            });
        });
        var want = {};
        stu.forEach(function(s, si) {
            if (s.r != null) return;
            sKeys[pass](s).forEach(function(k) {
                var hit = map[s.g + "|" + k];
                if (hit && hit.length === 1) (want[hit[0]] = want[hit[0]] || []).push(si);
            });
        });
        for (var ri in want) {
            if (!want.hasOwnProperty(ri) || want[ri].length !== 1 || used[ri]) continue;
            var s = stu[want[ri][0]], x = p.rows[ri];
            if (s.r != null) continue;
            s.r = +ri;
            s.p = x[3];
            s.f = x[2];
            used[ri] = 1;
        }
    }
    var odd = [];
    for (i = 0; i < p.rows.length; i++) {
        if (used[i]) continue;
        var x2 = p.rows[i], nm = x2[1] + " " + x2[2];
        odd.push({
            g: x2[0],
            c: "",
            n: nm,
            k: amdaWaNorm(nm),
            p: x2[3],
            f: x2[2]
        });
    }
    var all = stu.concat(odd);
    amdaWa.sig = sig;
    amdaWa.idx = {
        all: all,
        odd: odd,
        n: stu.length,
        have: stu.filter(function(s) {
            return s.p;
        }).length,
        none: stu.filter(function(s) {
            return s.r != null && !s.p;
        }).length
    };
    return amdaWa.idx;
}

function amdaWaRow(s, i, where) {
    return '<div class="am-cr"><span>' + esc(s.n) + (where ? " <i>" + esc(amdaG(s.g) + (s.c ? " " + s.c : " · " + amdaT("waNoCls"))) + "</i>" : "") + "</span>" + (s.p ? '<a class="aw-wa" href="#" target="_blank" rel="noopener" data-i="' + i + '" onclick="return amdaWaGo(this)">' + esc(amdaT("waBtn")) + "</a>" : "<i>" + esc(amdaT("waNoTel")) + "</i>") + "</div>";
}

function amdaWaGo(a) {
    var s = amdaWaIdx().all[+a.getAttribute("data-i")];
    if (!s || !s.p) return false;
    var msg = String(Store.get("amdaWaMsg", "") || "").split("{שם}").join(s.f || "");
    a.href = "https://wa.me/972" + s.p.slice(1) + (msg.trim() ? "?text=" + encodeURIComponent(msg) : "");
    setTimeout(function() {
        var q = document.getElementById("aw-q");
        if (q && amdaWa.q) {
            q.value = "";
            amdaWaFind("");
            try {
                q.focus();
            } catch (e) {}
        }
    }, 400);
    return true;
}

function amdaWaFind(v) {
    amdaWa.q = v;
    var el = document.getElementById("aw-res");
    if (el) el.innerHTML = amdaWaResHtml();
}

function amdaWaResHtml() {
    var t = amdaWaNorm(amdaWa.q).split(" ").filter(function(x) {
        return x;
    });
    if (!t.length) return "";
    var all = amdaWaIdx().all, h = "", n = 0;
    for (var i = 0; i < all.length && n < 40; i++) {
        var ok = true;
        for (var j = 0; j < t.length; j++) if (all[i].k.indexOf(t[j]) < 0) {
            ok = false;
            break;
        }
        if (ok) {
            h += amdaWaRow(all[i], i, 1);
            n++;
        }
    }
    return h || '<p class="h">' + esc(amdaT("waNoFind")) + "</p>";
}

function amdaWaPick(k, v) {
    if (k === "g") {
        amdaWa.g = amdaWa.g === v ? "" : v;
        amdaWa.c = "";
    } else amdaWa.c = amdaWa.c === v ? "" : v;
    admPane();
}

function amdaWaMsgSet(v) {
    Store.set("amdaWaMsg", v);
}

function admAmdaWa(body) {
    var p = amdaPh(), key = (CFG.readKey || "").trim(), ix = amdaWaIdx(), i;
    var up = '<div class="adm-card" id="aw-adm" style="margin-top:11px"><h4>' + esc(amdaT("waH")) + "</h4>" + '<p class="h">' + esc(amdaT("waLead")) + "</p>" + '<p class="h"><b>' + esc(p && p.rows.length ? amdaT("waHave", {
        p: ix.have,
        n: ix.n
    }) : amdaT("waNone")) + "</b>" + (amdaWa.msg ? "<br>" + esc(amdaWa.msg) : "") + "</p>" + (key ? "" : '<p class="h" style="color:var(--stop)">' + esc(amdaT("admNoKey")) + "</p>");
    if (p && p.rows.length) {
        if (ix.none) up += '<p class="h">' + esc(amdaT("waNoNum", {
            n: ix.none
        })) + "</p>";
        if (ix.odd.length) {
            up += '<details class="am-cl"><summary>' + esc(amdaT("waOdd", {
                n: ix.odd.length
            })) + "</summary>" + ix.odd.map(function(s) {
                return '<div class="am-cr"><span>' + esc(s.n) + "</span><i>" + esc(amdaG(s.g)) + "</i></div>";
            }).join("") + "</details>";
        }
    }
    up += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' + '<button class="btn g" onclick="amdaWaFile()">' + esc(amdaT(p && p.rows.length ? "waRe" : "waLoad")) + "</button>" + (key ? '<button class="btn g" onclick="amdaWaPull()">' + esc(amdaT("waPull")) + "</button>" : "") + '</div><p class="h" style="margin-top:8px">' + esc(amdaT("waHint")) + "</p>" + '<input type="file" id="aw-file" style="display:none" onchange="amdaWaPicked(this)"' + ' accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>';
    var h = "";
    if (ix.all.length) {
        h += '<div class="adm-card"><div class="am-q" style="margin-top:0">' + esc(amdaT("waFind")) + "</div>" + '<input type="search" class="aw-q" id="aw-q" aria-label="' + esc(amdaT("waFind")) + '" value="' + esc(amdaWa.q) + '" oninput="amdaWaFind(this.value)">' + '<div id="aw-res">' + amdaWaResHtml() + "</div>" + '<div class="am-q">' + esc(amdaT("waMsg")) + "</div>" + '<textarea class="aw-ta" rows="3" aria-label="' + esc(amdaT("waMsg")) + '" oninput="amdaWaMsgSet(this.value)">' + esc(Store.get("amdaWaMsg", "") || "") + "</textarea>" + '<div class="am-q">' + esc(amdaT("waPickG")) + '</div><div class="am-grid">';
        AMDA_GRADES.forEach(function(g) {
            h += '<button class="am-b' + (amdaWa.g === g ? " on" : "") + "\" onclick=\"amdaWaPick('g','" + g + "')\">" + esc(amdaG(g)) + "</button>";
        });
        h += "</div>";
        if (amdaWa.g) {
            var cs = [], seen = {}, list = [];
            ix.all.forEach(function(s) {
                if (s.g === amdaWa.g && !seen["c" + s.c]) {
                    seen["c" + s.c] = 1;
                    cs.push(s.c);
                }
            });
            cs.sort(function(a, b) {
                return a === "" ? 1 : b === "" ? -1 : a - b;
            });
            h += '<div class="am-q">' + esc(amdaT("waPickC")) + '</div><div class="am-grid">' + cs.map(function(c) {
                return '<button class="am-b' + (amdaWa.c === (c || "-") ? " on" : "") + (c ? "" : " aw-nc") + "\" onclick=\"amdaWaPick('c','" + esc(c || "-") + "')\">" + esc(c || amdaT("waNoCls")) + "</button>";
            }).join("") + "</div>";
            if (amdaWa.c) {
                var cv = amdaWa.c === "-" ? "" : amdaWa.c;
                for (i = 0; i < ix.all.length; i++) {
                    if (ix.all[i].g === amdaWa.g && ix.all[i].c === cv) list.push(i);
                }
                list.sort(function(a, b) {
                    return ix.all[a].n < ix.all[b].n ? -1 : 1;
                });
                h += '<div class="am-q">' + esc(amdaG(amdaWa.g) + (cv ? " " + cv : " · " + amdaT("waNoCls"))) + " · " + list.length + "</div>" + list.map(function(j) {
                    return amdaWaRow(ix.all[j], j, 0);
                }).join("");
            }
        }
        h += "</div>";
    }
    body.innerHTML = h + up;
    if (!amdaWa.q) {
        var qi = document.getElementById("aw-q");
        if (qi) try {
            qi.focus();
        } catch (e) {}
    }
    if (key && !(p && p.rows.length) && Date.now() - amdaWa.admAt > 6e4) {
        amdaWa.admAt = Date.now();
        amdaWaPull(1);
    }
}

function sugCur(track) {
    var t = track || homeTrack;
    var c = CV("sugya") || {};
    if (!c[t]) {
        var d = SUGYA[t] || {};
        c[t] = {
            base: d.base || "",
            fmt: d.fmt || "",
            books: JSON.parse(JSON.stringify(d.books || {})),
            pages: JSON.parse(JSON.stringify(d.pages || {}))
        };
    }
    return c;
}

function admSugyaSet(k, v) {
    var t = dkSel && dkSel.mas || homeTrack;
    var c = sugCur(t);
    c[t][k] = v.trim();
    cfgSet("sugya", c);
}

function admSugyaPage(daf, v) {
    var t = dkSel && dkSel.mas || homeTrack;
    var c = sugCur(t), pg = c[t].pages = c[t].pages || {};
    var was = pg[daf], book = was && was.length === 2 ? was[0] : null;
    if (!v.trim()) delete pg[daf]; else pg[daf] = book ? [ book, parseInt(v, 10) || 0 ] : parseInt(v, 10) || "";
    cfgSet("sugya", c);
}

var clockMsg = '', clockOn = null, clockLast = null, clockAsked = false;
/* ============================================================
   "מצב: טרם נבדק" אחרי כל גרסה.
   ============================================================
   המצב נשמר רק בזיכרון של העמוד, ולכן כל טעינה מחדש שכחה
   אותו - והמסך אמר "טרם נבדק" על שעון שרץ כל הזמן. עכשיו
   הכרטיס שואל בעצמו כשהוא מוצג, ומראה מתי השעון הצית לאחרונה
   ומה GitHub ענה. "מותקן" אינו "עובד"; הפעלה לפני 4 דקות כן. */
function clockAgo(iso) {
  var t = Date.parse(iso || '');
  if (!t) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}
function clockHm(iso) {
  var d = new Date(iso), z = function (n) { return (n < 10 ? '0' : '') + n; };
  return z(d.getHours()) + ':' + z(d.getMinutes());
}
var clockBackend = "";
function clockLine() {
  if (clockBackend === "neon") {
    if (!clockOn) return {t:'התזמון ב-GitHub Actions לא הוגדר',bad:true};
    if (!clockLast) return {t:'התזמון ב-GitHub Actions · טרם תועדה הרצה',bad:false};
    return {t:'הרצה אחרונה: '+clockHm(clockLast.at)+(clockLast.err?' · '+clockLast.err:''),bad:!!clockLast.err};
  }
  if (clockOn === null) return { t: clockAsked ? 'בודק…' : 'טרם נבדק', bad: false };
  if (!clockOn) return { t: 'אינו מותקן', bad: true };
  var L = clockLast, min = L ? clockAgo(L.at) : null;
  /* השעון מותקן אבל עוד לא הצית מאז שהרישום נוסף - זה קורה
     פעם אחת, בחצי השעה הראשונה אחרי העדכון. */
  if (min === null) return { t: 'פעיל · עוד לא נרשמה הפעלה (תיכף)', bad: false };
  var ago = min < 1 ? 'עכשיו' : min < 60 ? 'לפני ' + min + ' דק׳'
          : 'לפני ' + Math.floor(min / 60) + ' שע׳ ו-' + (min % 60) + ' דק׳';
  var head = 'הפעלה אחרונה: ' + clockHm(L.at) + ' (' + ago + ')';
  if (L.err) return { t: head + ' · נכשלה: ' + L.err, bad: true };
  if (L.code !== 204) return { t: head + ' · GitHub החזיר ' + L.code, bad: true };
  /* חצי שעה ועוד מרווח: הטריגר של גוגל רץ בתוך החלון, לא בדקה. */
  if (min > 65) return { t: head + ' · השעון אמור להצית כל חצי שעה - הוא נתקע', bad: true };
  return { t: 'פעיל · ' + head + ' · GitHub קיבל', bad: false };
}

function clockCard() {
  if (!clockAsked && (CFG.readKey || '').trim()) {clockAsked=true;setTimeout(function(){clockGo('clockstate',true);},0);}
  var status=clockLine();
  return '<div class="adm-card"><h4>תזמון השליחות</h4><p class="h">תזכורות ועדכונים לפי המועדים שהוגדרו.</p><p class="h">'+esc(status.t)+'</p><button class="btn g" onclick="clockGo(\'clockstate\')">בדיקת מצב</button>'+(clockBackend==='neon'?'<button class="btn p" onclick="clockGo(\'clockfire\')">הרצה עכשיו</button>':'<button class="btn p" onclick="clockGo(\'clock\')">התקנת השעון</button>')+(clockMsg?'<p class="h">'+esc(clockMsg)+'</p>':'')+'</div>';
}
function clockGo(what, quiet) {
  var k = (CFG.readKey || '').trim();
  if (!k) {
    if (quiet) return;
    clockMsg = 'חסרה סיסמת הקריאה. הכניסו אותה בכרטיס שרת ההרשמות.';
    admPane(); return;
  }
  clockAsked = true;
  if (!quiet) { clockMsg = 'רגע…'; admPane(); }
  scriptGet({ setup: what, key: k }).then(function (d) {
    /* **קריאה שנכשלה אינה "לא מותקן".** תשובה בלי `status`
       אומרת שלא הגענו לסקריפט, ולא שהשעון כבוי. */
    if (!d || !d.status) {
      if (!quiet) clockMsg = 'לא קיבלתי תשובה מהסקריפט.';
      admPane(); return;
    }
    if (d.status !== 'ok') {
      if (!quiet) clockMsg = d.message || 'הסקריפט סירב.';
      admPane(); return;
    }
    clockBackend = d.backend || "";
    clockOn = !!d.clock;
    if ('last' in d) clockLast = d.last;
    /* "פעיל · כל חצי שעה" כבר כתוב בשורת המצב - לא חוזרים עליו. */
    clockMsg = what === 'clockstate' ? '' : (d.message || '');
    admPane();
  }).catch(function () {
    if (!quiet) clockMsg = 'לא קיבלתי תשובה מהסקריפט.';
    admPane();
  });
}

var SCRIPT_MIN = 19;

function pingScript(url) {
    return fetch(url, {
        method: "GET"
    }).then(function(r) {
        return r.json();
    }).catch(function() {
        return pingJsonp(url);
    });
}

function pingJsonp(url) {
    return new Promise(function(ok, fail) {
        var name = "__ping" + Date.now();
        var s = document.createElement("script");
        var done = function(v) {
            try {
                delete window[name];
            } catch (e) {
                window[name] = undefined;
            }
            clearTimeout(t);
            s.remove();
            v ? ok(v) : fail(new Error("timeout"));
        };
        var t = setTimeout(function() {
            done(null);
        }, 12e3);
        window[name] = function(d) {
            done(d);
        };
        s.onerror = function() {
            done(null);
        };
        s.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "callback=" + name;
        document.body.appendChild(s);
    });
}

function netPlace(name, loc) { return name + (loc && name.indexOf(loc) < 0 ? ' (' + loc + ')' : ''); }
