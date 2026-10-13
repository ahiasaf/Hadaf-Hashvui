/* ============================================================
   מזהה קבוע לכל קטע - משותף לדף האינטראקטיבי, לסטודיו ולניהול.
   ============================================================
   "פיצול או איחוד של קטע משנים את המספרים, והתוכן ששויך אחריו
   נודד לקטע הלא נכון."

   מספר הקטע (`n`) נגזר מהסדר בכל טעינה, ולכן כל שינוי במבנה
   מזיז את כל מה שאחריו. מעכשיו לכל קטע יש `id` שנשמר איתו
   בלשונית "סימוני הדף", והפירוש, השאלות, העוגנים של המצגת
   והטיוטות נקשרים אליו. המספר נשאר - רק לתצוגה.

   שלושה כללים:
   · **קטע המשך (`cont`) אינו נושא מזהה.** הוא יורש את המזהה של
     החלק שהוא ממשיך, בדיוק כמו שהוא יורש את המספר. כך פיצול
     בעמוד אחד אף פעם אינו צריך לתקן עמוד אחר.
   · **איחוד משאיר את המזהה המוקדם**, והמזהה של השני נרשם אצלו
     ב-`also`. התוכן של השני לא זז בגיליון - הוא מוצג יחד.
   · **רשומת תוכן שעברה הסבה נושאת `__ids:1`.** בלעדיו המפתחות
     הם עדיין מספרים, והקוד קורא אותם כמו פעם. כך אפשר להעלות
     את הקוד לפני ההסבה, ודף שלא הוסב מתנהג בדיוק כמו היום.

   ES5 בלבד.
   ============================================================ */

/* אותה נרמול כמו `dafKey` בדף האינטראקטיבי */
function SidDaf(d) { return String(d == null ? '' : d).replace(/["'׳״\s]/g, ''); }
function SidDm(mas, daf) { return mas + '|' + SidDaf(daf); }

/* מזהה חדש: אות ואחריה ארבעה תווים. תמיד מתחיל באות, ולכן אינו
   יכול להתבלבל עם מספר קטע ישן שנשמר כמפתח. */
function SidNew(taken) {
  var abc = 'abcdefghjkmnpqrstuvwxyz', all = abc + '23456789', id, i;
  for (var tries = 0; tries < 200; tries++) {
    id = abc.charAt(Math.floor(Math.random() * abc.length));
    for (i = 0; i < 4; i++) id += all.charAt(Math.floor(Math.random() * all.length));
    if (!taken || !taken[id]) break;
  }
  if (taken) taken[id] = 1;
  return id;
}

/* שורות הלשונית → רשומות. רק צורת הדף (מקור 0) - זה מה שהתלמיד
   לומד. השורה המקורית נשמרת (`raw`) כדי שמה שלא השתנה ייכתב
   בחזרה אות באות. */
function SidParse(rows) {
  var out = [];
  (rows || []).forEach(function (r, i) {
    if (!r || !r[0]) return;
    var a = String(r[2] || '').split('|');
    var d = null;
    try { d = JSON.parse(r[3]); } catch (e) { d = null; }
    out.push({ i: i, mas: r[0], daf: r[1], src: a[0], pg: +a[1] || 1,
               key: r[0] + '|' + r[1] + '|' + r[2], d: d, raw: r });
  });
  return out;
}

/* ============================================================
   סדר הלימוד של דף אחד - בדיוק כמו שהתלמיד רואה אותו.
   ============================================================
   הקוד הזה ישב בתוך `loadMarks` בדף האינטראקטיבי, ועבר לכאן כדי
   שהסבה, ניהול וסטודיו יחשבו את אותו הסדר ממש. ההערות המקוריות
   שם, ליד הקריאה.

   מחזיר { pages, flat, groups }. כל איבר ב-`flat` נושא גם את
   הקטע עצמו (`st`), את הרשומה (`rec`) ואת מיקומו בה (`si`) -
   כך איחוד יודע מה לשנות. */
function SidFlat(recs, mas, daf, opt) {
  opt = opt || {};
  var me = SidDaf(daf), nx = opt.next ? SidDaf(opt.next) : '';
  var mine = [], tail = null, hcut = null;
  (recs || []).forEach(function (R) {
    if (R.mas !== mas || R.src !== '0') return;
    var d = R.d;
    if (!d || !d.steps || !d.steps.length) return;
    if (SidDaf(R.daf) === me) { mine.push({ daf: daf, pg: R.pg, d: d, rec: R }); return; }
    if (R.pg === 1 && d.prev > 0 && SidDaf(d.prevDaf || '') === me)
      tail = { daf: R.daf, pg: 1, d: d, take: d.prev, rec: R };
    /* `peek` (רק במצב עריכה): העמוד הראשון של הדף הבא נטען כולו,
       גם בלי נקודת עצירה - כדי שאפשר יהיה לסמן שהשבוע גולש אליו. */
    else if (opt.peek && !tail && R.pg === 1 && nx && SidDaf(R.daf) === nx)
      tail = { daf: R.daf, pg: 1, d: d, take: 0, rec: R };
    /* דף קודם שהשבוע שלו נגמר לפני סופו - מה שאחרי נקודת הסיום
       שלו פותח את השבוע שלנו. */
    if (typeof d.upto === 'number' && d.upto >= 0 && SidDaf(d.uptoDaf || '') === me)
      hcut = { daf: SidDaf(R.daf), pg: R.pg, si: d.upto };
  });
  mine.sort(function (p, q) { return p.pg - q.pg; });

  /* ---- הראש: הזנב של הדף הקודם, כשהשבוע שלו נגמר מוקדם ---- */
  var head = [];
  if (hcut) (recs || []).forEach(function (R) {
    if (R.mas !== mas || R.src !== '0' || !R.d || !R.d.steps) return;
    if (SidDaf(R.daf) !== hcut.daf || R.pg < hcut.pg) return;
    head.push({ daf: R.daf, pg: R.pg, d: R.d, rec: R, head: 1,
                from: R.pg === hcut.pg ? hcut.si + 1 : 0 });
  });
  head.sort(function (p, q) { return p.pg - q.pg; });

  var skip = 0;
  if (mine.length && mine[0].pg === 1 && mine[0].d.prev > 0) skip = mine[0].d.prev;

  /* ---- נקודת סיום מוקדמת בדף שלנו (`upto` + `uptoDaf`) ----
     השבוע נגמר אחרי קטע `upto` בעמוד הזה. מה שאחריו שייך לשבוע
     הבא, ואז אין גם זנב מהדף הבא - השניים אינם יכולים לדור יחד. */
  var cut = null;
  mine.forEach(function (p) {
    var u = p.d.upto;
    if (typeof u === 'number' && u >= 0 && (!cut || p.pg < cut.pg)) cut = { pg: p.pg, si: u };
  });

  var all = head.concat(mine);
  if (tail) all.push(tail);

  /* מה שמחוץ לשבוע נשמר רק במצב עריכה, ומסומן `peek`. */
  var flat = [], pages = [];
  all.forEach(function (p) {
    var st = p.d.steps, from = 0, to = st.length, lim = st.length;
    if (p.head) from = p.from;
    else if (p === tail) lim = cut ? 0 : tail.take;
    else {
      if (p === mine[0] && skip) from = skip;
      if (cut && p.pg === cut.pg) lim = cut.si + 1;
      if (cut && p.pg > cut.pg) lim = 0;
    }
    if (!opt.peek) to = Math.min(to, lim);
    var pi = -1;
    for (var si = from; si < to && si < st.length; si++) {
      if (pi < 0) pi = pages.push(p) - 1;
      var s = st[si];
      flat.push({ p: pi, g: s.g, c: s.c, cont: !!s.cont, st: s, rec: p.rec, si: si,
                  peek: si >= lim ? 1 : 0 });
    }
  });
  if (flat.length) flat[0].cont = false;
  var num = 0;
  flat.forEach(function (v, i) {
    if (v.cont && i) { v.n = flat[i - 1].n; v.id = flat[i - 1].id; v.also = flat[i - 1].also; }
    else { v.n = ++num; v.id = v.st.id || ''; v.also = v.st.also || []; }
  });
  flat.forEach(function (v) {
    var same = flat.filter(function (q) { return q.n === v.n; });
    v.parts = same.length;
    v.part = same.indexOf(v) + 1;
  });
  return { pages: pages, flat: flat, groups: num, cut: cut,
           over: !!(tail && tail.take > 0 && !cut) };
}

/* כל המזהים שכבר בשימוש במסכת - כדי שמזהה חדש לא יתנגש. */
function SidTaken(recs, mas) {
  var t = {};
  (recs || []).forEach(function (R) {
    if (mas && R.mas !== mas) return;
    ((R.d && R.d.steps) || []).forEach(function (s) {
      if (s.id) t[s.id] = 1;
      (s.also || []).forEach(function (a) { t[a] = 1; });
    });
  });
  return t;
}

/* קטע המשך אינו נושא מזהה; כל קטע אחר - כן. מחזיר כמה נוספו. */
function SidEnsure(steps, taken) {
  var n = 0;
  (steps || []).forEach(function (s) {
    if (s.cont) { if (s.id) delete s.id; if (s.also) delete s.also; return; }
    if (!s.id) { s.id = SidNew(taken); n++; }
  });
  return n;
}

/* ============================================================
   עותק מהמכשיר מול העמוד שבגיליון - המזהים של הגיליון נשמרים.
   ============================================================
   "כל המצגות של דף ב' עמוד א' איבדו את הקשר שלהם." (11.10.2026)
   עותק במכשיר מלפני ההסבה אינו נושא מזהים, והסטודיו נתן לקטעים
   שלו מזהים חדשים ושמר אותם על גבי הגיליון. הפירוש והשקפים
   נשארו קשורים למזהים שנמחקו.

   לפני שעמוד נכתב: קטע שמתחיל באותה נקודה בגמרא כמו קטע בעמוד
   שבגיליון - מקבל את המזהה שלו. לא נוגעים בקטע שהמזהה שלו כבר
   בגיליון, ולא בקטע שנולד בכניסה הזו (`fresh`, פיצול או סימון
   חדש). מחזיר כמה קטעים קיבלו מזהה. */
function SidAdopt(steps, there, fresh) {
  var at = {}, have = {}, used = {}, n = 0;
  (there || []).forEach(function (s) {
    if (!s || s.cont || !s.id || !s.g) return;
    at[JSON.stringify(s.g.from)] = s;
    have[s.id] = 1;
    (s.also || []).forEach(function (a) { have[a] = 1; });
  });
  (steps || []).forEach(function (s) { if (s && s.id && have[s.id]) used[s.id] = 1; });
  (steps || []).forEach(function (s) {
    if (!s || s.cont || !s.g) return;
    if (s.id && (have[s.id] || (fresh && fresh[s.id]))) return;
    var o = at[JSON.stringify(s.g.from)];
    if (!o || used[o.id]) return;
    s.id = o.id;
    if (o.also && o.also.length) s.also = o.also.slice(); else delete s.also;
    used[o.id] = 1; n++;
  });
  return n;
}

/* ============================================================
   ההסבה החד-פעמית: מספרים → מזהים.
   ============================================================
   פונקציה טהורה - מקבלת את ארבע הלשוניות ומחזירה אותן אחרי
   ההסבה, ולצידן דוח. **אינה כותבת דבר.** הכתיבה (אחרי גיבוי,
   ורק באישור) היא עניין של מי שקורא לה.

   · כל קטע שאין לו מזהה מקבל אחד. מה שכבר נושא מזהה נשאר.
   · לכל דף נבנה סדר הלימוד (כולל המשכי עמוד ודף), ומתוכו המפה
     הקפואה n → id. היא נשמרת ברשומת הפירוש (`__n2id`) - ממנה
     מתורגמות אחר כך טיוטות ישנות שנשארו במכשיר.
   · תוכן שמשויך למספר שאין לו קטע אינו נמחק: הוא עובר ל-`__orph`
     ומופיע בדוח.
   · רשומה שכבר הוסבה (`__ids`) אינה נוגעת. אפשר להריץ שוב.
   ============================================================ */
function SidMigrate(markRows, own, q, deck) {
  var head = markRows && markRows[0] && String(markRows[0][0] || '').indexOf('מסכת') >= 0
    ? markRows[0] : null;
  var recs = SidParse(head ? markRows.slice(1) : markRows);
  var takenBy = {}, touched = {};
  recs.forEach(function (R) {
    if (R.src !== '0' || !R.d || !R.d.steps) return;
    var t = takenBy[R.mas] || (takenBy[R.mas] = SidTaken(recs, R.mas));
    var had = JSON.stringify(R.d.steps);
    SidEnsure(R.d.steps, t);
    if (JSON.stringify(R.d.steps) !== had) touched[R.key] = 1;
  });

  var dafs = {}, order = [];
  recs.forEach(function (R) {
    if (R.src !== '0' || !R.d || !R.d.steps || !R.d.steps.length) return;
    var k = SidDm(R.mas, R.daf);
    if (!dafs[k]) { dafs[k] = { mas: R.mas, daf: R.daf }; order.push(k); }
  });

  var out = { own: SidCopy_(own), q: SidCopy_(q), deck: SidCopy_(deck), report: [] };
  order.forEach(function (k) {
    var D = dafs[k], F = SidFlat(recs, D.mas, D.daf), n2id = {};
    F.flat.forEach(function (v) { if (!v.cont || v.part === 1) n2id[String(v.n)] = v.id; });
    var rep = { mas: D.mas, daf: D.daf, key: k, groups: F.groups, items: [],
                orph: { own: [], q: [], deck: [] }, was: {} };
    var o0 = out.own[k], q0 = out.q[k], d0 = out.deck[k];
    rep.was.own = o0 ? (o0.__ids ? 'ids' : 'n') : '';
    rep.was.q = q0 ? (q0.__ids ? 'ids' : 'n') : '';
    rep.was.deck = d0 ? (d0.__ids ? 'ids' : 'n') : '';
    F.flat.forEach(function (v) {
      if (v.part !== 1) return;
      var ks = String(v.n);
      rep.items.push({ n: v.n, id: v.id, parts: v.parts,
        text: String((v.c && v.c.text) || '').slice(0, 60),
        own: !!(o0 && !o0.__ids && o0[ks]),
        q: !!(q0 && !q0.__ids && q0[ks]),
        slide: (d0 && !d0.__ids && d0[ks] !== undefined) ? d0[ks] : '' });
    });
    out.own[k] = SidConv_(o0 || {}, n2id, rep.orph.own, true);
    if (q0) out.q[k] = SidConv_(q0, n2id, rep.orph.q, false);
    if (d0) out.deck[k] = SidConv_(d0, n2id, rep.orph.deck, false);
    out.report.push(rep);
  });

  out.marks = (head ? [head] : []).concat(recs.map(function (R) {
    if (!touched[R.key]) return R.raw;
    var r = R.raw.slice();
    r[3] = JSON.stringify(R.d);
    return r;
  }));
  out.changedPages = Object.keys(touched).length;
  return out;
}
function SidCopy_(m) { return JSON.parse(JSON.stringify(m || {})); }
function SidConv_(rec, n2id, orph, keepMap) {
  if (!rec || rec.__bad || rec.__ids) return rec;
  var out = {}, k;
  for (k in rec) {
    if (!rec.hasOwnProperty(k)) continue;
    if (/^\d+$/.test(k)) {
      if (n2id[k]) out[n2id[k]] = rec[k];
      else { (out.__orph = out.__orph || {})[k] = rec[k]; orph.push(+k); }
    } else if (k === '__t' && rec.__t && typeof rec.__t === 'object') {
      out.__t = {};
      for (var t in rec.__t) {
        if (!rec.__t.hasOwnProperty(t)) continue;
        if (/^\d+$/.test(t) && n2id[t]) out.__t[n2id[t]] = rec.__t[t];
        else if (!/^\d+$/.test(t)) out.__t[t] = rec.__t[t];
      }
    } else out[k] = rec[k];
  }
  out.__ids = 1;
  if (keepMap) out.__n2id = n2id;
  return out;
}
