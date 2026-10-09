
/* ============================================================
   מאיפה מגיעים הנתונים.

   הסימונים נעשו בסטודיו ונשמרו בגיליון, בלשונית "סימוני הדף":
   מסכת | דף | עמוד | נתונים, כשהנתונים הם JSON של עמוד אחד -
   האזורים, השורות והקטעים, הכל ביחס לרוחב ולגובה התמונה (0-1).
   בזכות הנרמול הזה אפשר לצייר כאן את הדף בכל רוחב שנוח, והסימון
   ייפול במקומו.

   צורת הדף עצמה מגיעה מהדרייב של הרכז דרך אותו Apps Script -
   דפדפן אינו יכול למשוך אותה ישירות, כי גוגל אינה שולחת CORS.
   ============================================================ */
var MARK_TAB = 'סימוני הדף';
var MAS_NAME = { taanit:'תענית', megila:'מגילה' };
var TARGET_W = 1600;         /* רוחב הציור. הקואורדינטות מנורמלות
                                ולכן זו החלטה של חדות בלבד. */
var API = '';

/* `am` - עמוד שנלמד לבד בשבוע שלו (ב. = 1, ב: = 2), ואז על המסך
   רק הקטעים שלו. 0 = הדף כולו, כמו בכל שאר השבועות. */
var S = { mas:'', daf:'', week:-1, am:0 };
var PAGES = [];   /* [{pg, d}] - נתוני עמוד, לפי סדר העמודים */
var FLAT  = [];   /* [{p, g, c}] - כל הקטעים של הדף ברצף */
/* DIM=false - הדף מוצג בלי הצללה. ההתמקדות, המסגרת, ההתקדמות
   והחברותא ממשיכות בדיוק כפי שהן; רק השכבה שמכהה את שאר הדף
   יורדת. תלמיד שרוצה לראות מה כתוב בתוספות שליד, או שפשוט
   נוח לו כך, מקבל את זה בלי לוותר על שום דבר אחר. */
var IDX = 0, DIM = true, R = 1.4, SHOWN = -1, HEAD = '', GROUPS = 0;
/* האם מסך הסיום כבר נראה. אחריו "הבא" מוביל לדף הבא ולא חוזר
   אליו - מי שסגר אותו כדי להסתכל שוב לא רוצה לפגוש אותו בכל
   הקשה על "הבא". */
var DONE_SEEN = false;

function $(id) { return document.getElementById(id); }
function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; });
}
function dafKey(d) { return String(d).replace(/["'׳״\s]/g, ''); }
function fileId(url) { var m = /\/d\/([-\w]{20,})/.exec(url || ''); return m ? m[1] : null; }

function veil(title, sub, spin) {
  $('veil').className = 'veil';
  $('veil-t').textContent = title;
  $('veil-s').innerHTML = sub || '';
  $('veil').querySelector('.spin').style.display = spin === false ? 'none' : '';
}
function unveil() { $('veil').className = 'veil off'; }

/* ============================================================
   הגיליון.
   ============================================================ */
function sheetCsv(tab, cols) {
  var id = window.SHEET_ID;
  try {
    var cfg = JSON.parse(localStorage.getItem('df:cfg') || '{}');
    if (cfg.sheetId) id = cfg.sheetId;
  } catch (e) {}
  if (!id) return Promise.resolve(null);
  var u = 'https://docs.google.com/spreadsheets/d/' + id +
          '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab) +
          (cols ? '&tq=' + encodeURIComponent('select ' + cols) : '') +
          '&t=' + Date.now();
  return fetch(u).then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) { return t ? csvRows(t) : null; })
    .catch(function () { return null; });
}
function csvRows(text) {
  var rows = [], row = [], f = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) {
      if (c === '"' && text[i+1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false; else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(function (r) { return r.join('').trim() !== ''; });
}

/* ============================================================
   גיאומטריה - אותו חשבון שבסטודיו, במידות מנורמלות.

   שורה היא מלבן על פני האזור שלה; קטע נפתח בנקודה בתוך שורה
   ונסגר בנקודה בתוך שורה, ולכן ההדגשה נראית כמו בחירת טקסט:
   מהנקודה עד קצה השורה, שורות מלאות באמצע, ובאחרונה עד הנקודה.
   x=0 הוא הקצה הימני - שם מתחילה הקריאה.
   ============================================================ */
function flatLines(d) {
  var out = [];
  (d.zones || []).forEach(function (z) {
    (z.lines || []).forEach(function (l) {
      out.push({ t:l[0], b:l[1], a:z.a, x2:z.b });
    });
  });
  return out.sort(function (p, q) { return p.t - q.t; });
}
function shapes(d, g) {
  var ls = flatLines(d), out = [];
  if (!g) return out;
  var i0 = Math.min(g.from.line, g.to.line), i1 = Math.max(g.from.line, g.to.line);
  var xa = g.from.line <= g.to.line ? g.from.x : g.to.x;
  var xb = g.from.line <= g.to.line ? g.to.x : g.from.x;
  /* הזזה קטנה שמאלה בשני הגבולות שנופלים בתוך שורה.

     אותה נקודה משמשת פעמיים: היא הסוף של קטע אחד וההתחלה של
     הבא, והיא יושבת בגבול שבין המילה שלנו לשכנה - נוטה מעט אל
     צד השכנה. לכן שני הגבולות זזים לאותו כיוון, שמאלה:
     בהתחלה זה מוריד את זנב המילה הקודמת, ובסוף זה נותן אוויר
     לאות האחרונה במקום לחתוך אותה. הזזה לכיוון ההפוך בסוף היא
     שחנקה את האות. שישית מגובה השורה קטנה מרווח בין מילים,
     ולכן הקצה נוחת בתוך הרווח ולא על השכנה.

     ומכיוון ששני הקטעים זזים יחד, הם נשארים צמודים זה לזה. */
  var nip = lineH(d) * R * 0.16;

  /* אוויר בצדי הטור. המסגרת ישבה בדיוק על גבול הטור, כלומר על
     האות הראשונה ועל האחרונה, ובלי מרווח היא נראית כאילו היא
     לוחצת על הטקסט.

     האוויר נוסף רק בקצה שהוא גבול הטור. קצה שנופל באמצע שורה
     הוא נקודת התפר בין שני קטעים - הסוף של אחד וההתחלה של הבא -
     ומרווח שם היה גורם לשניהם לחפוף. */
  var air = lineH(d) * R * 0.22;   /* כמו האוויר שמעל ומתחת */
  for (var i = i0; i <= i1 && i < ls.length; i++) {
    var l = ls[i], w = l.x2 - l.a;
    var cutA = (i === i0) && xa > 0.001;      /* ההתחלה באמצע שורה */
    var cutB = (i === i1) && xb < 0.999;      /* הסוף באמצע שורה */
    var from = cutA ? l.x2 - w * xa - nip : (i === i0 ? l.x2 : l.x2) + air;
    var to   = cutB ? l.x2 - w * xb - nip : (i === i1 ? l.a : l.a) - air;
    from = Math.min(1, from); to = Math.max(0, to);
    if (to > from) to = from;
    out.push([Math.min(from, to), l.t, Math.abs(to - from), l.b - l.t]);
  }
  return out;
}

/* רצועות רציפות: הגבול בין שתי שורות עובר באמצע הרווח שביניהן.
   בלי זה נשארים פסי עמימות בין שורות הקטע, והמסגרת מתפרקת
   למסגרת קטנה סביב כל שורה - וזה מה שמעמיס על העין. מסגרת אחת
   חיצונית אומרת את אותו דבר בשקט. */
/* הודעה קצרה שנעלמת מעצמה. לא כרטיס ולא יריעה - התשובה כאן היא
   מילה אחת, ומסך שצריך לסגור בשבילה גרוע מהשאלה. */
var TOAST = null;
function toast(t) {
  var el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = t;
  el.className = 'on';
  clearTimeout(TOAST);
  TOAST = setTimeout(function () { el.className = ''; }, 1900);
}

function bands(d, g) {
  var rs = shapes(d, g);
  if (!rs.length) return [];
  var b = rs.map(function (r) {
    return { x0:r[0], x1:r[0] + r[2], y0:r[1], y1:r[1] + r[3] };
  });
  for (var i = 0; i < b.length - 1; i++) {
    var mid = (b[i].y1 + b[i+1].y0) / 2;
    b[i].y1 = mid; b[i+1].y0 = mid;
  }
  /* אוויר קטן מעל הראשונה ומתחת לאחרונה, כדי שהמסגרת לא תשב על
     קוצי האותיות. */
  b[0].y0 -= rs[0][3] * 0.22;
  b[b.length - 1].y1 += rs[rs.length - 1][3] * 0.22;
  return b;
}

/* קו המתאר של איחוד הרצועות - מדרגה מימין למטה, מדרגה משמאל
   למעלה. פוליגון פשוט, ולכן הוא משמש גם כחור במסכה וגם כמסגרת. */
function outline(b) {
  var n = b.length, i, p = ['M' + b[0].x1 + ',' + b[0].y0];
  for (i = 0; i < n; i++) {
    p.push('L' + b[i].x1 + ',' + b[i].y1);
    if (i < n - 1) p.push('L' + b[i+1].x1 + ',' + b[i].y1);
  }
  p.push('L' + b[n-1].x0 + ',' + b[n-1].y1);
  for (i = n - 1; i >= 0; i--) {
    p.push('L' + b[i].x0 + ',' + b[i].y0);
    if (i > 0) p.push('L' + b[i-1].x0 + ',' + b[i].y0);
  }
  return p.join('') + 'Z';
}
function lineH(d) {
  var ls = flatLines(d);
  if (!ls.length) return .02;
  var v = ls.map(function (l) { return l.b - l.t; }).sort(function (a, b) { return a - b; });
  return v[v.length >> 1] || .02;
}

/* ============================================================
   הציור.

   העמימות נעשית במסכה ולא בהדגשה: מלבן על כל הדף בצבע הנייר,
   ובתוכו חורים בצורת הקטע. כך הדיו של הקטע נשאר הדיו המקורי
   ולא נצבע - מה שחשוב במיוחד בגמרא, שכל האותיות בה שחורות.
   ============================================================ */
function paint() {
  var st = FLAT[IDX], ov = $('ov');
  if (!st) { ov.innerHTML = ''; return; }
  var d = PAGES[st.p].d;
  var VW = 1000, VH = Math.round(1000 * R);
  var b = bands(d, st.g).map(function (r) {
    return { x0: +(r.x0 * VW).toFixed(1), x1: +(r.x1 * VW).toFixed(1),
             y0: +(r.y0 * VH).toFixed(1), y1: +(r.y1 * VH).toFixed(1) };
  });
  ov.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
  if (!b.length) { ov.innerHTML = ''; return; }
  var path = outline(b);

  /* שני מצבים, שתי שפות.

     במיקוד - מסכה בצבע הנייר על כל השאר, ומסגרת דקה סביב הקטע.
     בדף המלא - אין את מי להסתיר, והמסגרת מיותרת: היא אומרת "עד
     כאן ולא הלאה", וזה בדיוק ההפך ממה שהמצב הזה נועד לו. במקומה
     הדגשה על השורות עצמן, כמו מרקר על נייר - `multiply` משאיר
     את האותיות שחורות מתחת לצבע במקום לצבוע אותן. */
  ov.innerHTML = DIM
    ? '<defs><mask id="hole">' +
        '<rect width="' + VW + '" height="' + VH + '" fill="#fff"/>' +
        '<path d="' + path + '" fill="#000"/>' +
      '</mask></defs>' +
      '<rect width="' + VW + '" height="' + VH + '" fill="#F6F1E6" ' +
        'opacity=".80" mask="url(#hole)"/>' +
      '<path d="' + path + '" fill="none" stroke="#C08F2B" stroke-width="1.5" ' +
        'stroke-linejoin="round" opacity=".5"/>'
    : '<path d="' + path + '" fill="#E3B44A" opacity=".42" ' +
        'style="mix-blend-mode:multiply"/>';
}

/* ההתמקדות: חלון נע על הדף.

   רוחב החלון הוא הטור שבו הקטע יושב - לא הדף ולא הגוש המרכזי.
   זו הנקודה שבה נופל או עומד המסך בטלפון: השדרה תופסת כשליש
   מרוחב הדף, וחלון ברוחב הגוש כולו מותיר את הגמרא זעירה. ברוחב
   הטור היא ממלאת את המסך, ושולי הטורים השכנים עדיין מציצים
   מהצדדים - מספיק כדי לזכור שזה דף.

   גובה החלון הוא הקטע ועוד כשתי שורות מכל צד, כדי שהעין תראה
   מאיפה באנו ולאן ממשיכים. */
function focus() {
  var st = FLAT[IDX];
  var stage = $('stage'), sw = stage.clientWidth, sh = stage.clientHeight;
  if (!sw || !sh) return;
  var fx, fy, fw, fh;

  if (!st) {
    fx = 0; fy = 0; fw = 1; fh = 1;
  } else {
    var d = PAGES[st.p].d;
    var rs = shapes(d, st.g);
    var lh = lineH(d);
    var top = 1, bot = 0;
    rs.forEach(function (r) { top = Math.min(top, r[1]); bot = Math.max(bot, r[1] + r[3]); });
    if (!rs.length) { top = 0; bot = 1; }
    var padY = lh * 2.2;
    fy = Math.max(0, top - padY);
    fh = Math.min(1 - fy, (bot - top) + padY * 2);
    /* קטע של שורה אחת לא יימתח על כל המסך: מינימום של שבע שורות
       שומר על יחס קריא ועל תחושת מקום בדף. */
    var minH = lh * 7;
    if (fh < minH) { fy = Math.max(0, top - (minH - (bot - top)) / 2); fh = Math.min(1 - fy, minH); }

    /* הרוחב נלקח מהשורות עצמן ולא מהצורות: הצורה נחתכת בתוך
       השורה, והחלון צריך את הטור השלם. קטע שחוצה את המקום שבו
       הגמרא מתרחבת מקבל את איחוד השניים. */
    var ls = flatLines(d), x0 = 1, x1 = 0;
    for (var i = Math.min(st.g.from.line, st.g.to.line);
         i <= Math.max(st.g.from.line, st.g.to.line) && i < ls.length; i++) {
      x0 = Math.min(x0, ls[i].a); x1 = Math.max(x1, ls[i].x2);
    }
    if (x1 <= x0) {
      x0 = (d.core && d.core[0] != null) ? d.core[0] : 0;
      x1 = (d.core && d.core[1] != null) ? d.core[1] : 1;
    }
    var m = (x1 - x0) * .06;
    fx = Math.max(0, x0 - m); fw = Math.min(1 - fx, (x1 - x0) + m * 2);
  }

  /* הדף ממלא לפחות את רוחב המסך - חלון שקטן ממנו רק מבזבז מקום. */
  var disp = Math.min(sw / fw, sh / (fh * R));
  disp = Math.max(sw, Math.min(disp, sw * 4.5));
  var dh = disp * R;
  var tx = sw / 2 - (fx + fw / 2) * disp;
  var ty = sh / 2 - (fy + fh / 2) * dh;
  VIEW = { tx: tx, ty: ty, disp: disp, dh: dh, sw: sw, sh: sh };
  PAN.x = 0; PAN.y = 0;          /* כל מיקוד מחזיר את הדף למקומו */
  applyView();
}

/* ============================================================
   ההזזה הידנית.

   במיקוד הדף נעול, וזה נכון: הקטע הוא מה שלומדים עכשיו.
   בדף המלא הנעילה סותרת את עצם המצב - מי שביקש לראות את כל הדף
   רוצה להגיע לרש"י, לתוספות, למה שמעל ומתחת. לכן שם אפשר לגרור.

   ההזזה חיה עד ההקשה הבאה בלבד. כל מעבר לקטע - בהקשה, בכפתור,
   במקש - מחזיר את הדף למקומו וממקד מחדש, בדיוק כמו קודם. אין
   כאן מצב שצריך לצאת ממנו.

   הגבולות הם גבולות הדף עצמו: אפשר להגיע לכל פינה בו, ואי אפשר
   לאבד אותו מחוץ למסך. */
var VIEW = null, PAN = { x: 0, y: 0 };
/* הגדלת הגמרא בצביטה: 1 = הגודל הרגיל, עד פי 2 - **רק במצב "כל
   הדף"**. במיקוד אין זום בכלל, והיציאה מ"כל הדף" מחזירה ל-1.
   מוחלת סביב מרכז הבמה. */
var ZM = 1, ZM_MIN = 1, ZM_MAX = 2;
function applyView(instant) {
  if (!VIEW) return;
  var v = VIEW, z = ZM, disp = v.disp * z, dh = v.dh * z;
  var cx = v.sw / 2, cy = v.sh / 2;
  var tx = cx - (cx - v.tx) * z + PAN.x, ty = cy - (cy - v.ty) * z + PAN.y;
  tx = disp > v.sw ? Math.max(v.sw - disp, Math.min(0, tx)) : (v.sw - disp) / 2;
  ty = dh > v.sh ? Math.max(v.sh - dh, Math.min(0, ty)) : (v.sh - dh) / 2;
  var h = $('holder');
  h.style.transition = instant ? 'none' : '';
  h.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' +
                      (disp / v.sw).toFixed(4) + ')';
}

/* ============================================================
   צורת הדף - משיכה מהדרייב וציור.
   ============================================================ */
/* מפתחות לפי דף ולא רק לפי עמוד: שיעור יכול לגלוש אל הדף הבא,
   ואז שני דפים שונים מוצגים באותו מסך. */
var BYTES = {}, DOCS = {}, IMG = {};

function pdfReady() {
  if (window.pdfjsLib) return Promise.resolve();
  return new Promise(function (ok) {
    window.addEventListener('pdfjs-ready', function () { ok(); }, { once:true });
  });
}
function jsonp(url) {
  return new Promise(function (ok, fail) {
    var n = '__lrn' + Date.now(), sc = document.createElement('script');
    var done = function (v) {
      try { delete window[n]; } catch (e) { window[n] = undefined; }
      clearTimeout(t); sc.remove(); v ? ok(v) : fail(new Error('timeout'));
    };
    var t = setTimeout(function () { done(null); }, 60000);
    window[n] = done;
    sc.onerror = function () { done(null); };
    sc.src = url + '&callback=' + n;
    document.body.appendChild(sc);
  });
}
function grab(id) {
  var url = API + (API.indexOf('?') < 0 ? '?' : '&') + 'file=' + encodeURIComponent(id);
  return fetch(url).then(function (r) { return r.json(); })
    .catch(function () { return jsonp(url); })
    .then(function (d) {
      if (!d || d.status !== 'ok' || !d.data) throw new Error('no data');
      var bin = atob(d.data), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return buf;
    });
}

/* ============================================================
   צורת הדף: מהאתר קודם, ומהדרייב רק אם אינה שם.

   מסך התלמידים אינו יכול להישען על ה-Apps Script של הרכז: הוא
   מוגבל בריצות מקבילות, כל בקשה קוראת PDF של מגבייט ומקודדת
   אותו, והכל רץ על חשבון גוגל אחד. שיעור שבו שלושים תלמידים
   פותחים את הדף באותה דקה נתקע.

   `tools/build-library.py` ממיר את הדפים פעם אחת לתמונות תחת
   `daf/`, והן מוגשות מה-CDN של האתר: בלי מכסה, בלי צוואר, עובדות
   אופליין דרך ה-Service Worker, ומהירות בהרבה - 350KB במקום PDF
   של 2MB שצריך לצייר בדפדפן.

   הנפילה לדרייב נשארת כדי שדף שטרם הומר ימשיך לעבוד.
   ============================================================ */
var LIB = null;

function libSrc(daf, pg) {
  var m = LIB && LIB[S.mas];
  var a = m && m[dafKey(daf)];
  if (!a || a.indexOf(pg === 2 ? 'b' : 'a') < 0) return null;
  return 'daf/' + S.mas + '/' + dafKey(daf) + '-' + (pg === 2 ? 'b' : 'a') +
         '.webp?v=' + (window.DAF_REV || '');
}
/* רשימת המאגר. חובה שתהיה נכונה: בלעדיה הלימוד מסיק שאין תמונה
   לדף ופונה לדרייב - איטי בהרבה, **וגם** מצייר מ-PDF בקנה מידה
   שאינו זה שהסימונים מכוילים אליו, כך שהסימון נראה סוטה.

   לכן שתי הגנות: בודקים שמה שחזר באמת נראה כמו הרשימה ולא כמו
   משהו אחר, ואם לא - מושכים שוב תוך עקיפת המטמון. */
function looksLikeLib(j) {
  if (!j || typeof j !== 'object') return false;
  for (var k in j) if (j[k] && typeof j[k] === 'object') return true;
  return false;
}
function loadLib() {
  return fetch('daf/index.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (j) {
      if (looksLikeLib(j)) { LIB = j; return; }
      return fetch('daf/index.json', { cache: 'reload' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (j2) { LIB = looksLikeLib(j2) ? j2 : {}; });
    });
}

function loadGemara(daf) {
  daf = daf || S.daf;
  var k = dafKey(daf);
  /* יש תמונות לדף הזה - אין צורך ב-PDF כלל */
  if (libSrc(daf, 1)) return Promise.resolve();
  if (BYTES[k]) return Promise.resolve();
  var links = ((window.DAF_LINKS || {})[S.mas] || {})[k] || [];
  var id = fileId(links[0]);
  if (!id) return Promise.reject(new Error('no file'));
  if (!API) return Promise.reject(new Error('no api'));
  return grab(id).then(function (buf) { BYTES[k] = buf; });
}