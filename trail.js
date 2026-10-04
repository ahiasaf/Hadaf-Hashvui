/* ============================================================
   המסלול כמסע — רכיב משותף.
   ============================================================
   שני מסכים מציגים את אותו דבר: עמוד המסלול באפליקציה
   (index.html, `openTrack`) והבורר "לאיזה דף?" בדף האינטראקטיבי
   (learn.html, `pickOpen`). כרטיס קרם, קו אנכי עם עיגולי דפים,
   פרשה ותאריכים, מחיצות זהב לפרקים, "השבוע", ווי ירוק למה
   שנלמד. שני עותקים של אותו עיצוב נפרדים זה מזה בשקט ביום
   שמתקנים אחד מהם — ולכן הוא כאן, פעם אחת: ה-HTML וה-CSS יחד.

   ה-CSS מוזרק לעמוד בפעם הראשונה שהרכיב מצויר, והצבעים מוגדרים
   על הכרטיס עצמו — הוא אינו נשען על משתני הצבע של העמוד שמארח.

   שני אופנים:
   · שבועות (`TrailWeeks`) — שורה לכל שבוע בלוח, כולל חופשות
     והסיום. עמוד המסלול.
   · עמודים (`TrailAmudim`) — שורה לכל עמוד: ב. ב: ג. ג: …
     דף שנלמד בשבוע אחד נותן שתי שורות לאותו שבוע, והשנייה
     מוקטנת. הבורר בדף האינטראקטיבי.

   ES5 בלבד, כמו כל השאר.
   ============================================================ */

/* ---------- מספר הדף, לגבולות הפרקים ---------- */
var TRAIL_HEBV = {'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':20,'ל':30};
function TrailNum(d) {
  var s = String(d || '').replace(/["'׳״\s]/g, ''), n = 0;
  for (var i = 0; i < s.length; i++) n += (TRAIL_HEBV[s[i]] || 0);
  return n;
}
function TrailEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
function TrailUi(k) { return (typeof UI !== 'undefined' && UI[k]) || ''; }
/* העמוד של שורת לוח: 0 = הדף כולו, 1 = ע״א, 2 = ע״ב (ראו CAL_TAANIT). */
function TrailAm(row) { var a = row && row[3]; return a === 'א' ? 1 : a === 'ב' ? 2 : 0; }
function TrailMark(am) { return am === 1 ? '.' : am === 2 ? ':' : ''; }

/* ---------- היחידות ----------
   יחידה = שורה במסלול: { wk, row, daf, am, kind, half }.
   `am` הוא העמוד שהשורה מייצגת (0 = הדף כולו), ו-`half` מסמן
   שורה שנייה של אותו שבוע (ג: אחרי ג.). */
function TrailWeeks(tr) {
  return tr.cal.map(function (row, i) {
    var d = row[2];
    /* `fin` — שבוע הסיום שיש בו גם דף (מגילה: ל"ב, ראו CAL_MEGILA).
       הוא דף לכל דבר, ומצויר כעיגול הסיום עם הדף בתוכו. */
    return { wk: i, row: row, daf: d, am: TrailAm(row),
             kind: !d ? 'off' : d === 'סיום' ? 'siyum' : 'daf', half: false,
             fin: row[4] === 'סיום' };
  });
}
function TrailAmudim(tr) {
  var out = [];
  tr.cal.forEach(function (row, i) {
    var d = row[2];
    if (!d || d === 'סיום') return;
    var am = TrailAm(row);
    var fin = row[4] === 'סיום';
    if (am) { out.push({ wk: i, row: row, daf: d, am: am, kind: 'daf', half: false, fin: fin }); return; }
    out.push({ wk: i, row: row, daf: d, am: 1, kind: 'daf', half: false, fin: fin });
    out.push({ wk: i, row: row, daf: d, am: 2, kind: 'daf', half: true, fin: fin });
  });
  return out;
}

/* ---------- הציור ----------
   o.tr     — המסלול (שורה מ-TRACKS)
   o.units  — TrailWeeks / TrailAmudim, אחרי סינון אם צריך
   o.wi     — השבוע של כולם (LWeek). "השבוע" צמוד אליו ואינו זז
              לפי מה שהלומד בחר. -1 = התוכנית עוד לא התחילה.
   o.here   — מספר היחידה שבה הלומד נמצא עכשיו, או -1
   o.attr   — function (u, k) → מחרוזת מאפיינים לשורה (onclick וכו')
   o.big    — שורה שבה העיגול הגדול (ברירת מחדל: השבוע של כולם) */
function TrailHtml(o) {
  TrailStyle();
  var tr = o.tr, chaps = (typeof CHAPTERS !== 'undefined' && CHAPTERS[tr.id]) || [];
  var shown = {}, firstOfWeek = {}, wi = o.wi;
  var h = '<div class="trl ' + (tr.id === 'taanit' ? 't-b' : 't-g') + '">' +
    '<div class="trl-head"><b>' +
    TrailEsc(String(TrailUi('trMas')).replace('{mas}', tr.masechet)) + '</b><i></i><span>' +
    TrailEsc(String(TrailUi('trSub')).replace('{n}', tr.dapim)
      .replace('{year}', (typeof PROGRAM !== 'undefined' && PROGRAM.year) || '')) +
    '</span></div><div class="trl-path">';

  o.units.forEach(function (u, k) {
    if (u.kind === 'daf') {
      var num = TrailNum(u.daf);
      chaps.forEach(function (c, ci) {
        if (!shown[ci] && num >= c.from) {
          shown[ci] = 1;
          h += '<div class="trl-chap"><b>' + TrailEsc(c.n) + '</b><i></i></div>';
        }
      });
    }
    var first = !firstOfWeek[u.wk];
    firstOfWeek[u.wk] = 1;
    var cls = 'trl-step';
    if (u.kind === 'off') cls += ' off';
    else if (u.kind === 'siyum') cls += ' siyum';
    else if (u.fin) cls += ' siyum sfin';
    if (u.half) cls += ' half';
    if (u.wk === wi) cls += first ? ' cur' : ' now';
    if (wi >= 0 && u.wk < wi) cls += ' done';
    /* מה שסומן כנלמד — מהמכשיר, ולכן זמין גם בלי רשת. */
    if (u.kind === 'daf' && typeof LDone === 'function' && LDone(tr.id, u.wk)) cls += ' learned';
    if (k === o.here) cls += ' here';
    if (k === o.units.length - 1) cls += ' last';

    var dot = u.kind === 'off' ? TrailUi('trOff')
            : u.kind === 'siyum' ? TrailUi('trSiyum')
            : u.daf + TrailMark(u.am);
    h += '<div class="' + cls + '"' + (o.attr ? o.attr(u, k) : '') + '>' +
      '<span class="trl-dot">' + TrailEsc(dot) + '</span>' +
      '<div class="trl-txt"><div class="trl-p">' + TrailEsc(u.row[1]) +
      (u.wk === wi && first ? '<span class="trl-badge">' + TrailEsc(TrailUi('trWeek')) + '</span>' : '') +
      (k === o.here ? '<span class="trl-here">' + TrailEsc(TrailUi('pickHere')) + '</span>' : '') +
      '</div>' +
      (u.half ? '' : '<div class="trl-d">' + TrailEsc(u.row[0]) + '</div>') +
      '</div></div>';
  });
  return h + '</div></div>';
}

/* ---------- העיצוב ----------
   הועבר כפי שהוא מ-index.html ("מסלול כמסע"), עם שמות שמתחילים
   ב-trl- כדי שלא יתנגשו בשום מחלקה של העמוד המארח, ועם הצבעים על
   הכרטיס. הוספות: `half` (עמוד שני באותו שבוע), `now` (העמוד השני
   של השבוע הנוכחי) ו-`here` (איפה הלומד נמצא, בבורר). */
var TRAIL_CSS =
'.trl{--t-blue:#17468F;--t-blue-d:#0B2550;--t-blue-l:#3574CE;--t-green:#6FA83B;' +
  '--t-green-d:#467B1A;--t-gold:#C08F2B;--t-gold-l:#E5B854;--t-gold-t:#8C681F;' +
  '--t-surface:#FFFDF8;--t-sunk:#EFE6D3;--t-ink:#1B2A45;--t-ink-2:#5A6780;--t-ink-3:#5C687E;' +
  '--t-rule:#E5DAC3;' +
  'border-radius:14px;overflow:hidden;background:var(--t-surface);color:var(--t-ink);' +
  'box-shadow:0 2px 4px rgba(37,29,12,.06),0 10px 26px rgba(37,29,12,.08)}' +
'.trl-head{padding:20px 16px;color:#fff;text-align:center;position:relative;overflow:hidden}' +
'.trl.t-b .trl-head{background:linear-gradient(150deg,var(--t-blue-d),var(--t-blue) 70%,var(--t-blue-l))}' +
'.trl.t-g .trl-head{background:linear-gradient(150deg,#2F5A12,var(--t-green-d) 65%,var(--t-green))}' +
'.trl-head b{display:block;font-size:1.3rem;font-weight:800;letter-spacing:-.03em}' +
'.trl-head i{display:block;width:38px;height:2px;background:var(--t-gold-l);' +
  'border-radius:2px;margin:9px auto 8px}' +
'.trl-head span{font-size:.78rem;opacity:.85;font-weight:600}' +
'.trl-path{padding:8px 16px 18px}' +
'.trl-step{position:relative;display:grid;grid-template-columns:44px 1fr;gap:14px;' +
  'align-items:center;padding:7px 0;cursor:pointer}' +
/* קו המסע — עובר מאחורי העיגולים */
'.trl-step:before{content:"";position:absolute;top:0;bottom:0;right:21px;width:2px;' +
  'background:var(--t-rule);z-index:0}' +
'.trl-step:first-of-type:before{top:50%}' +
'.trl-step.last:before{bottom:50%}' +
'.trl-dot{position:relative;z-index:1;width:44px;height:44px;border-radius:50%;' +
  'display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.98rem;' +
  'background:var(--t-surface);border:2px solid var(--t-rule);color:var(--t-ink-3);' +
  'transition:transform .2s cubic-bezier(.22,1,.36,1)}' +
'.trl-step:active .trl-dot{transform:scale(.9)}' +
'.trl-step.done .trl-dot{background:var(--t-sunk);border-color:var(--t-rule);color:var(--t-ink-3)}' +
/* ✓ על מה שהלומד סימן שלמד. */
'.trl-step.learned .trl-dot{background:var(--t-green);border-color:var(--t-green-d);color:#fff}' +
'.trl-step.learned .trl-p:after{content:"\\2713";margin-inline-start:7px;color:var(--t-green-d);' +
  'font-weight:800}' +
'.trl.t-b .trl-step.learned.cur .trl-dot,.trl.t-g .trl-step.learned.cur .trl-dot{' +
  'background:linear-gradient(150deg,var(--t-green),var(--t-green-d));border-color:transparent}' +
'.trl.t-b .trl-step.cur .trl-dot{background:linear-gradient(150deg,var(--t-blue-l),var(--t-blue));' +
  'border-color:var(--t-blue);color:#fff;box-shadow:0 0 0 5px rgba(23,70,143,.14),0 2px 4px rgba(37,29,12,.06),0 10px 26px rgba(37,29,12,.08);' +
  'width:52px;height:52px;font-size:1.15rem}' +
'.trl.t-g .trl-step.cur .trl-dot{background:linear-gradient(150deg,var(--t-green),var(--t-green-d));' +
  'border-color:var(--t-green-d);color:#fff;box-shadow:0 0 0 5px rgba(111,168,59,.18),0 2px 4px rgba(37,29,12,.06),0 10px 26px rgba(37,29,12,.08);' +
  'width:52px;height:52px;font-size:1.15rem}' +
'.trl-step.cur{grid-template-columns:52px 1fr;padding:12px 0}' +
'.trl-step.cur:before{right:25px}' +
'.trl.t-b .trl-step.now .trl-dot{border-color:var(--t-blue);color:var(--t-blue)}' +
'.trl.t-g .trl-step.now .trl-dot{border-color:var(--t-green-d);color:var(--t-green-d)}' +
'.trl-step.off{cursor:default;opacity:.6}' +
'.trl-step.off .trl-dot{border-style:dashed;font-size:.62rem;font-weight:700;' +
  'width:34px;height:34px;margin-inline-start:5px}' +
'.trl-step.siyum .trl-dot{border-color:var(--t-gold);color:var(--t-gold);font-size:.6rem;' +
  'background:rgba(192,143,43,.08)}' +
/* עיגול הסיום שבתוכו דף (ל"ב במגילה) — בגודל של דף. */
'.trl-step.siyum.sfin .trl-dot{font-size:.95rem}' +
/* עמוד שני באותו שבוע — אותו קו, עיגול קטן יותר. */
'.trl-step.half{padding:2px 0}' +
'.trl-step.half .trl-dot{width:36px;height:36px;margin-inline-start:4px;font-size:.9rem}' +
'.trl-step.half .trl-p{font-weight:700;font-size:.86rem;color:var(--t-ink-2)}' +
/* איפה הלומד נמצא — טבעת זהב. */
'.trl-step.here .trl-dot{box-shadow:0 0 0 3px var(--t-surface),0 0 0 6px var(--t-gold)}' +
'.trl-here{display:inline-block;font-size:.6rem;font-weight:800;color:var(--t-gold-t);' +
  'border:1.5px solid var(--t-gold);border-radius:20px;padding:2px 8px;margin-inline-start:7px;' +
  'vertical-align:middle}' +
'.trl-txt{min-width:0}' +
'.trl-p{font-weight:800;font-size:1rem;letter-spacing:-.01em}' +
'.trl-step.done .trl-p,.trl-step.off .trl-p{font-weight:700;color:var(--t-ink-2)}' +
'.trl-d{font-size:.75rem;color:var(--t-ink-3);font-weight:600;margin-top:1px}' +
'.trl-step.cur .trl-p{font-size:1.12rem}' +
'.trl-badge{display:inline-block;font-size:.6rem;font-weight:800;letter-spacing:.05em;' +
  'background:linear-gradient(135deg,var(--t-gold-l),var(--t-gold));color:#fff;' +
  'border-radius:20px;padding:3px 9px;margin-inline-start:7px;vertical-align:middle;' +
  'box-shadow:0 2px 6px rgba(192,143,43,.35)}' +
'.trl-chap{display:flex;align-items:center;gap:10px;margin:16px 0 8px;padding-inline-start:2px}' +
'.trl-chap b{font-size:.7rem;font-weight:800;color:var(--t-gold);letter-spacing:.12em;white-space:nowrap}' +
'.trl-chap i{flex:1;height:1px;background:linear-gradient(90deg,var(--t-rule),transparent)}' +
'.trl-chap:before{content:"\\25C6";color:var(--t-gold);font-size:.55rem;opacity:.7}';

function TrailStyle() {
  if (typeof document === 'undefined' || document.getElementById('trl-css')) return;
  var st = document.createElement('style');
  st.id = 'trl-css';
  st.textContent = TRAIL_CSS;
  (document.head || document.documentElement).appendChild(st);
}
