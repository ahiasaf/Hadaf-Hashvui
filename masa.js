/* ============================================================
   המסע — אב־טיפוס.
   האפליקציה שואלת ארבע שאלות ובונה תוכנית לימוד אישית.

   מבודד לגמרי מהאפליקציה הראשית: קורא את data.js / links.js
   בלבד, וכותב רק ל-masa:profile. שום מפתח של האפליקציה הראשית
   (dfReg, df:cfg, dfHomeTrack) לא נקרא ולא נכתב.
   ============================================================ */
var MASA_VERSION = '0.1.0';

/* ---------- הפרופיל ---------- */
var BLANK = { mode:'', track:'', pace:'', source:'', sefer:'',
              n:0, inst:'', who:'', phone:'', seen:false, sent:false };
var profile = load();

function load() {
  try {
    var v = JSON.parse(localStorage.getItem('masa:profile') || 'null');
    if (!v) return copy(BLANK);
    for (var k in BLANK) if (!(k in v)) v[k] = BLANK[k];
    return v;
  } catch (e) { return copy(BLANK); }
}
function save() {
  try { localStorage.setItem('masa:profile', JSON.stringify(profile)); } catch (e) {}
}
function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

/* ---------- עזר, מועתק כלשונו מ-index.html ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
function weekIndex() {
  var start = new Date(PROGRAM.startDate + 'T00:00:00');
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var days = Math.floor((now - start) / 86400000);
  if (days < 0) return -1;
  return Math.min(Math.floor(days / 7), CAL_TAANIT.length - 1);
}
function trackById(id) {
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i];
  return null;
}
function dafKey(d) { return String(d).replace(/["'׳״\s]/g, ''); }
function contentFor(id) {
  var tr = trackById(id), wi = weekIndex(), i = wi < 0 ? 0 : wi;
  return { tr:tr, i:i, row:tr.cal[i], c:CONTENT[id + '-' + (i + 1)] };
}
/* אותה חתימה כמו ב-index.html, כדי שהאיחוד יהיה מחיקת הכפילות בלבד */
function priceOf(id) {
  var p = (typeof PRICES !== 'undefined' && PRICES[id]) ||
          { price:SFARIM_PRICE.group, list:SFARIM_PRICE.normal };
  return { price:p.price, list:p.list, off:p.list > p.price };
}
function shek(n) { return n.toLocaleString('he-IL') + ' ₪'; }
function sefName(id) {
  var s = SFARIM.filter(function (x) { return x.id === id; })[0];
  return s ? s.name : '';
}
function sefById(id) {
  return SFARIM.filter(function (x) { return x.id === id; })[0] || null;
}

/* ---------- ניווט ---------- */
function masaShow(v) {
  var all = document.querySelectorAll('.view');
  for (var i = 0; i < all.length; i++) all[i].className = 'view';
  var el = document.getElementById('v-' + v);
  if (el) el.className = 'view on';
  window.scrollTo(0, 0);
}

/* ============================================================
   השאלות.
   שאלה 1 קובעת את הניסוח של כל השאר — אותה לוגיקה, שפה אחרת
   לכל מתכונת. לכן הרשימה נבנית מחדש בכל רינדור.
   ============================================================ */
var step = 1;

function questions() {
  var m = profile.mode, staff = m === 'staff', fam = m === 'family';
  var qs = [];

  qs.push({
    k:'mode', h:'איך אתם לומדים?',
    p:'התשובה הזו מעצבת את כל מה שתראו בהמשך.',
    opts:[
      { v:'staff',  ic:'🏫', b:'בישיבה, עם הכיתה', s:'איש צוות שמעביר את הדף לתלמידים' },
      { v:'family', ic:'🏠', b:'אבא ובן',          s:'לומדים יחד בבית' },
      { v:'group',  ic:'👥', b:'חברותא או קבוצה',  s:'קבוצת לימוד קבועה' },
      { v:'solo',   ic:'📖', b:'לבד',              s:'לומד עצמאי, בקצב שלי' }
    ]
  });

  qs.push(staff ? {
    k:'track', h:'איזו כיתה תלמדו?',
    p:'לכל שכבה מסכת משלה השנה.',
    opts:[
      { v:'taanit', ic:'ז׳', b:'כיתות ז׳', s:'מסכת תענית · 30 דפים' },
      { v:'megila', ic:'ח׳', b:'כיתות ח׳', s:'מסכת מגילה · 31 דפים' },
      { v:'both',   ic:'✦',  b:'שתי השכבות', s:'נציג לכם את שתיהן' }
    ]
  } : {
    k:'track', h:'באיזו מסכת תלמדו?',
    p:fam ? 'בדרך כלל לפי הכיתה של הבן.' : 'שתי המסכתות רצות במקביל השנה.',
    opts:[
      { v:'taanit', ic:'ז׳', b:'מסכת תענית', s:'המסכת של כיתות ז׳' },
      { v:'megila', ic:'ח׳', b:'מסכת מגילה', s:'המסכת של כיתות ח׳' }
    ]
  });

  qs.push({
    k:'pace',
    h: staff ? 'באיזה קצב תלמדו עם הכיתה?'
     : fam   ? 'מתי נוח לכם ללמוד?'
     :         'באיזה קצב תלמדו?',
    p:'זו השאלה שקובעת איזו גמרא מתאימה לכם.',
    opts:[
      { v:'twice',  ic:'📚', b:'פעמיים בשבוע', s:'עמוד שלם בכל מפגש' },
      { v:'daily',  ic:'☕', b:'קצת בכל יום',  s:'סוגיה קצרה, כמה דקות' },
      { v:'unsure', ic:'🤔', b:'עוד לא יודעים', s:'נראה את שתי האפשרויות זו לצד זו' }
    ]
  });

  qs.push({
    k:'source', h:'מאיפה תלמדו?',
    p:'אפשר גם וגם — הרבה לומדים מהספר ונעזרים במסך.',
    opts:[
      { v:'book',   ic:'📕', b:'מספר מודפס',
        s: staff ? 'נזמין גמרות לכיתה במחיר מוזל' : 'נזמין גמרות דרך הישיבה במחיר מוזל' },
      { v:'screen', ic:'📱', b:'מהמסך', s:'קישורים דיגיטליים לכל דף, בחינם' },
      { v:'both',   ic:'✦',  b:'משניהם', s:'ספר ביד, והקישורים כגיבוי' }
    ]
  });

  return qs;
}

function ask(n) {
  step = n;
  var qs = questions(), q = qs[n - 1];
  masaShow('q');

  var d = '';
  for (var i = 0; i < qs.length; i++)
    d += '<i class="' + (i + 1 === n ? 'on' : (i + 1 < n ? 'done' : '')) + '"></i>';
  document.getElementById('q-dots').innerHTML = d;
  document.getElementById('q-cnt').textContent = n + '/' + qs.length;
  document.getElementById('q-back').disabled = n === 1;

  var h = '<div class="qh"><span class="kick">שאלה ' + n + '</span>' +
          '<h2>' + esc(q.h) + '</h2><p>' + esc(q.p) + '</p></div><div class="opts">';
  q.opts.forEach(function (o) {
    h += '<button class="opt' + (profile[q.k] === o.v ? ' sel' : '') +
         '" onclick="answer(\'' + q.k + '\',\'' + o.v + '\')">' +
         '<span class="ic">' + o.ic + '</span>' +
         '<span class="tx"><b>' + esc(o.b) + '</b><small>' + esc(o.s) + '</small></span>' +
         '<span class="tick">✓</span></button>';
  });
  h += '</div><div class="saved">נשמר במכשיר שלכם</div>';
  document.getElementById('q-body').innerHTML = h;
}

function answer(k, v) {
  var was = profile[k];
  profile[k] = v;

  // שינוי המתכונת מאפס את מה שתלוי בה — "שתי השכבות" קיים רק לצוות
  if (k === 'mode' && was !== v && profile.track === 'both' && v !== 'staff')
    profile.track = '';

  save();
  var qs = questions();
  if (step < qs.length) { setTimeout(function () { ask(step + 1); }, 190); }
  else { setTimeout(function () { openPlan(); }, 190); }
}

function masaGo(n) { ask(n); }
function masaBack() { if (step > 1) ask(step - 1); else masaShow('start'); }

function skipAll() {
  profile.mode = profile.mode || 'staff';
  profile.track = profile.track || 'taanit';
  profile.pace = profile.pace || 'unsure';
  profile.source = profile.source || 'both';
  save();
  openPlan();
}

/* ============================================================
   ההמלצה — הלב של המסע.
   הקצב קובע את המהדורה, והנימוק נאמר בקול, כדי שההמלצה
   תרגיש כמו תשובה ולא כמו ברירת מחדל.
   ============================================================ */
function recommend() {
  if (profile.pace === 'twice')
    return { id:'veshinantam',
             why:'בחרתם ללמוד פעמיים בשבוע, עמוד שלם בכל מפגש — וזה בדיוק המבנה של ושננתם.' };
  if (profile.pace === 'daily')
    return { id:'sugya',
             why:'בחרתם ללמוד קצת בכל יום — והסוגיה היומית פורסת את הדף בדיוק ככה.' };
  return null;
}

/* המסכת שמוצגת בפועל. "שתי השכבות" ← בורר קטן במסך האישי. */
var viewTrack = '';
function curTrack() {
  if (viewTrack) return viewTrack;
  return profile.track === 'both' || !profile.track ? 'taanit' : profile.track;
}
function setTrack(t) { viewTrack = t; renderMine(); }

/* ---------- ערכת הקישורים לדף של השבוע ---------- */
function kitFor(trackId) {
  var w = contentFor(trackId), daf = w.row[2];
  if (!daf || daf === 'סיום') return [];
  var lk = (DAF_LINKS[trackId] || {})[dafKey(daf)] || [];
  var sg = SUGYA[trackId] || {}, page = (sg.pages || {})[dafKey(daf)];
  var sgHref = (sg.base && sg.fmt && page) ? sg.fmt.replace('{p}', page) : (sg.base || '');
  return [
    { href:lk[0], ic:'⤓', t:'צורת הדף',      s:'הדף להדפסה' },
    { href:lk[1], ic:'פ', t:'פירוש חברותא',  s:'ביאור על הדף' },
    { href:sgHref, ic:'◆', t:'הסוגיה היומית',
      s:page ? 'עמוד ' + page + ' בחוברת' : 'החוברת הדיגיטלית', cls:'gr' }
  ];
}
function kitHtml(trackId) {
  var k = kitFor(trackId);
  if (!k.length) return '<div class="card"><p>בשבוע הזה אין דף — חופשה.</p></div>';
  return '<div class="kit">' + k.map(function (l) {
    return l.href
      ? '<a class="lnk ' + (l.cls || '') + '" href="' + l.href + '" target="_blank" rel="noopener">' +
        '<span class="ic">' + l.ic + '</span><span><b>' + esc(l.t) + '</b>' +
        '<small>' + esc(l.s) + '</small></span></a>'
      : '<a class="lnk dim" href="#" onclick="return notYet()">' +
        '<span class="ic">' + l.ic + '</span><span><b>' + esc(l.t) + '</b>' +
        '<small>בקרוב</small></span></a>';
  }).join('') + '</div>';
}
function notYet() { alert('הקישור יתווסף בקרוב.'); return false; }

/* ============================================================
   מסך "התוכנית שלכם"
   ============================================================ */
function openPlan() {
  if (!profile.sefer) {
    var r = recommend();
    profile.sefer = r ? r.id : '';
    save();
  }
  renderPlan();
}

function planTitle() {
  if (profile.mode === 'staff') {
    if (profile.track === 'both') return 'התוכנית של כיתות ז׳ וח׳';
    return 'התוכנית של כיתות ' + (profile.track === 'megila' ? 'ח׳' : 'ז׳');
  }
  if (profile.mode === 'family') return 'התוכנית שלכם — אבא ובן';
  if (profile.mode === 'group')  return 'התוכנית של הקבוצה';
  return 'התוכנית שלך';
}

function renderPlan() {
  var r = recommend(), wantsBook = profile.source !== 'screen';
  var h =
    '<div class="crown"><div class="seal">✦</div>' +
    '<span class="kick">הכול מוכן</span>' +
    '<h2>' + esc(planTitle()) + '</h2>' +
    '<p>בנינו אותה מהתשובות שלכם. אפשר לשנות כל דבר, בכל רגע.</p></div>';

  /* 1 · המהדורה */
  h += '<div class="sec"><b>הגמרא שמתאימה לכם</b><i></i></div>' + seferCard(r);

  /* 2 · המחיר */
  if (wantsBook) h += '<div class="sec"><b>ההזמנה</b><i></i></div>' + orderBlock();

  /* 3 · הערכה הדיגיטלית */
  if (profile.source !== 'book') {
    var t = curTrack(), w = contentFor(t);
    h += '<div class="sec"><b>מה שיהיה לכם בכל שבוע</b><i></i></div>' +
         '<div class="card" style="margin-bottom:10px"><h3>דף ' + esc(w.row[2]) +
         ' · ' + esc(w.tr.masechet) + '</h3>' +
         '<p>אלה הקישורים לדף של השבוע. בכל שבוע הם מתחלפים לבד.</p></div>' +
         kitHtml(t);
  }

  /* מי שבחר מסך בלבד עדיין ראוי לשמוע על ההזמנה המרוכזת — פעם אחת,
     בלי לחץ, ועם דרך להיכנס פנימה בלחיצה. */
  if (profile.source === 'screen') h += offerBook();

  /* 4 · איך זה עובד */
  h += '<div class="sec"><b>ככה זה עובד</b><i></i></div>' + howBlock();

  /* 5 · שמירה */
  h += '<div class="sec"><b>הבחירות שלכם</b><i></i></div>' +
       '<div class="keep"><b>נשמר במכשיר הזה</b>' +
       '<p>הבחירות שלכם נשמרות במכשיר שלכם בלבד, ולא נשלחות לשום מקום. ' +
       'אפשר לשנות אותן בכל רגע — הכול ייבנה מחדש.</p></div>' +
       '<button class="btn g" style="margin-top:10px" onclick="ask(1)">שינוי ההעדפות</button>' +
       '<button class="btn p" style="margin-top:10px" onclick="finish()">' +
       'קדימה, לדף של השבוע</button>';

  document.getElementById('plan-body').innerHTML = h;
  masaShow('plan');
}

/* כרטיס המהדורה. תמיד עם דרך להחליף — ההמלצה מציעה, לא כופה. */
function seferCard(r) {
  if (!profile.sefer) return bothCards();

  var s = sefById(profile.sefer), p = priceOf(profile.sefer);
  var other = SFARIM.filter(function (x) { return x.id !== profile.sefer; })[0];
  var op = priceOf(other.id);
  var isRec = r && r.id === profile.sefer;
  var why = isRec ? r.why
          : 'בחרתם את ' + s.name + ' בעצמכם — וזו הבחירה ששמורה.';

  return '<div class="pickd' + (s.id === 'sugya' ? ' alt' : '') + '">' +
    '<div class="top"><span><span class="nm">' + esc(s.name) + '</span>' +
    '<span class="sub">' + esc(s.tag) + '</span></span>' +
    '<span class="pr"><b>' + shek(p.price) + '</b>' +
    (p.off ? '<s>' + shek(p.list) + '</s>' : '<s>לחוברת</s>') + '</span></div>' +
    '<div class="why">' + esc(why) + '</div>' +
    '<div class="bd"><p>' + esc(s.desc) + '</p>' +
    '<p style="color:var(--ink-3)"><b>למי מתאים:</b> ' + esc(s.who) + '</p></div>' +
    '<div class="swapbar"><span class="t">אפשר גם ' + esc(other.name) +
    ' — ' + shek(op.price) + ' לחוברת</span>' +
    '<button onclick="swapSefer(\'' + other.id + '\')">להחליף</button></div></div>';
}

/* "עוד לא יודעים" — שתיהן זו לצד זו, בלי המלצה ובלי הטיה */
function bothCards() {
  return '<div class="card" style="margin-bottom:11px">' +
    '<h3>עוד לא החלטתם — וזה בסדר</h3>' +
    '<p>אלה שתי המהדורות. אפשר לבחור עכשיו, ואפשר להירשם ולבחור בהמשך.</p></div>' +
    SFARIM.map(function (s) {
      var p = priceOf(s.id);
      return '<div class="pickd' + (s.id === 'sugya' ? ' alt' : '') +
        '" style="margin-bottom:10px"><div class="top">' +
        '<span><span class="nm">' + esc(s.name) + '</span>' +
        '<span class="sub">' + esc(s.rhythm) + '</span></span>' +
        '<span class="pr"><b>' + shek(p.price) + '</b>' +
        (p.off ? '<s>' + shek(p.list) + '</s>' : '<s>לחוברת</s>') + '</span></div>' +
        '<div class="bd"><p>' + esc(s.desc) + '</p></div>' +
        '<div class="swapbar"><span class="t">' + esc(s.who) + '</span>' +
        '<button onclick="swapSefer(\'' + s.id + '\')">בחירה</button></div></div>';
    }).join('');
}

function swapSefer(id) { profile.sefer = id; save(); renderPlan(); }

/* ---------- ההזמנה ---------- */
function orderBlock() {
  var staff = profile.mode === 'staff';
  var label = staff ? 'כמה תלמידים?' : 'כמה עותקים?';
  var sub   = staff ? 'הערכה בלבד — אפשר לעדכן תמיד' : 'אפשר גם עותק אחד';

  var h = '<div class="num"><div class="lbl">' + label + '<small>' + sub + '</small></div>' +
    '<div class="ctl"><button onclick="stepN(-1)">−</button>' +
    '<input type="tel" id="m-n" value="' + (profile.n || 0) +
    '" onchange="setN(this.value)"><button onclick="stepN(1)">+</button></div></div>';

  if (!staff) {
    var nm = (INSTITUTIONS.filter(function (i) { return i.code === profile.inst; })[0] || {}).name;
    h += '<div class="card" style="margin-top:10px"><h3>דרך איזו ישיבה?</h3>' +
      '<p>ההזמנה שלכם מצטרפת להזמנה המרוכזת של הישיבה — ומשם מגיע המחיר המוזל.</p>' +
      '<div style="margin-top:12px"><button class="pk' + (nm ? '' : ' empty') +
      '" onclick="pickInst()">' + esc(nm || 'בחרו את הישיבה') + '</button></div></div>';
  }

  h += totalBox();
  return h;
}

function totalBox() {
  var n = profile.n || 0;
  if (!n) return '<div class="card" style="margin-top:10px;text-align:center">' +
                 '<p>הזינו כמות כדי לראות את הסכום.</p></div>';
  if (!profile.sefer) {
    var a = SFARIM.map(function (s) { return priceOf(s.id).price; });
    var lo = Math.min.apply(null, a), hi = Math.max.apply(null, a);
    return '<div class="total" style="margin-top:10px"><div class="n">' +
      (lo === hi ? shek(n * lo) : 'בין ' + shek(n * lo) + ' ל־' + shek(n * hi)) +
      '</div><div class="t">' + n + ' גמרות · הסכום ייקבע לפי המהדורה שתבחרו</div></div>';
  }
  var p = priceOf(profile.sefer);
  return '<div class="total" style="margin-top:10px"><div class="n">' + shek(n * p.price) +
    '</div><div class="t">' + n + ' × ' + shek(p.price) + ' · ' + esc(sefName(profile.sefer)) +
    (p.off ? ' · חסכון של ' + shek(n * (p.list - p.price)) : '') + '</div></div>';
}

function setN(v) { profile.n = Math.max(0, parseInt(v, 10) || 0); save(); renderPlan(); }
function stepN(d) {
  var s = profile.mode === 'staff' ? 5 : 1;
  setN((profile.n || 0) + d * s);
}
function pickInst() {
  var items = INSTITUTIONS.map(function (i) { return { v:i.code, t:i.name }; });
  sheet('הישיבה שלנו', items, profile.inst, function (v) {
    profile.inst = v; save(); renderPlan();
  });
}

/* הצעה עדינה למי שבחר ללמוד מהמסך בלבד */
function offerBook() {
  var ve = priceOf('veshinantam');
  if (!ve.off) return '';
  return '<div class="sec"><b>אגב</b><i></i></div>' +
    '<div class="card"><h3>רוצים גם ספר ביד?</h3>' +
    '<p>הישיבות מזמינות את הגמרות במרוכז, ולכן המחיר ' + shek(ve.price) +
    ' לחוברת במקום ' + shek(ve.list) + '. אפשר להצטרף להזמנה של הישיבה.</p>' +
    '<button class="btn g" style="margin-top:13px" onclick="wantBook()">' +
    'להצטרף להזמנה</button></div>';
}
function wantBook() { profile.source = 'both'; save(); renderPlan(); }

/* ---------- ככה זה עובד ---------- */
function howBlock() {
  var staff = profile.mode === 'staff';
  var rows = [
    ['דף חדש בכל שבוע',
     'לא צריך לחפש — האפליקציה יודעת באיזה שבוע אנחנו ופותחת את הדף הנכון.'],
    ['מצגת מלווה',
     staff ? 'מצגת מוכנה להצגה על המסך בכיתה, שקף אחרי שקף.'
           : 'מצגת קצרה שעוברת על הדף — אפשר לעבור עליה יחד לפני הלימוד.'],
    ['חידה שבועית',
     staff ? 'התלמידים עונים על חידה קצרה ונכנסים להגרלה השבועית.'
           : 'חידה קצרה בסוף כל דף — ונכנסים להגרלה השבועית.']
  ];
  return '<div class="how">' + rows.map(function (r, i) {
    return '<div class="st"><i>' + (i + 1) + '</i><div><b>' + esc(r[0]) + '</b>' +
           '<p>' + esc(r[1]) + '</p></div></div>';
  }).join('') + '</div>';
}

function finish() { profile.seen = true; save(); renderMine(); }

/* ============================================================
   הבית האישי — מה שרואים בכניסה חוזרת
   ============================================================ */
function greet() {
  if (profile.mode === 'staff')  return ['השיעור שלך השבוע', 'איש צוות'];
  if (profile.mode === 'family') return ['הלימוד שלכם השבוע', 'אבא ובן'];
  if (profile.mode === 'group')  return ['הלימוד שלנו השבוע', 'חברותא'];
  return ['הלימוד שלך השבוע', 'לומד עצמאי'];
}

function renderMine() {
  var g = greet(), t = curTrack(), w = contentFor(t), c = w.c;
  var wi = weekIndex();
  var when = wi < 0 ? 'נפתח בפרשת בראשית' : 'שבוע ' + (wi + 1) + ' מתוך ' + w.tr.cal.length;

  var h = '<div class="hi"><span class="m"><img id="mine-mark" alt=""></span>' +
    '<span class="who"><b>' + esc(g[0]) + '</b><small>' + esc(g[1]) + ' · ' +
    esc(w.tr.masechet) + '</small></span>' +
    '<button class="edit" onclick="ask(1)">שינוי</button></div>';

  if (profile.track === 'both')
    h += '<div class="opts" style="grid-template-columns:1fr 1fr;display:grid;gap:8px;' +
         'margin-top:4px">' + TRACKS.map(function (x) {
      return '<button class="opt" style="padding:11px 13px;' +
        (x.id === t ? 'border-color:var(--blue);background:#fff' : '') +
        '" onclick="setTrack(\'' + x.id + '\')"><span class="tx"><b>' +
        esc(x.masechet) + '</b><small>' + esc(x.gradeFull) + '</small></span></button>';
    }).join('') + '</div>';

  /* הדף של השבוע */
  h += '<div class="stage" style="margin-top:12px">' +
    '<div class="eyebrow">' + esc(when) + '<s></s>' +
    (w.row[2] && w.row[2] !== 'סיום' ? 'דף ' + esc(w.row[2]) : '') + '</div>' +
    '<h2>' + esc(c ? c.title : (w.row[2] ? 'דף ' + w.row[2] : w.row[1])) + '</h2>' +
    '<div class="meta">' + esc(w.row[1]) + ' · ' + esc(w.row[0]) + '</div>';
  if (c && c.deck) {
    h += '<div class="frame" onclick="deckOpen(0)"><img src="' +
      c.deck.dir + '/01.jpg" alt="השקף הראשון"></div>' +
      '<div class="acts"><button class="go" onclick="deckOpen(0)">▶ הצגה על המסך</button>' +
      '<button class="alt" onclick="scrollKit()">הדף</button></div>';
  } else {
    h += '<div class="frame"><div class="empty">המצגת לשבוע זה בהכנה</div></div>';
  }
  h += '</div>';

  /* הערכה */
  if (profile.source !== 'book') {
    h += '<div class="sec" id="kit-anchor"><b>הדף עצמו</b><i></i></div>' + kitHtml(t);
  }

  /* המהדורה וההזמנה */
  h += '<div class="sec"><b>הגמרא שלכם</b><i></i></div>';
  if (profile.sefer) {
    var p = priceOf(profile.sefer);
    h += '<div class="card"><h3>' + esc(sefName(profile.sefer)) + '</h3>' +
      '<p>' + shek(p.price) + ' לחוברת' + (p.off ? ' · במקום ' + shek(p.list) : '') +
      (profile.n ? ' · ' + profile.n + ' עותקים · סה"כ ' + shek(profile.n * p.price) : '') +
      '</p></div>';
  } else {
    h += '<div class="card"><h3>עוד לא נבחרה מהדורה</h3>' +
      '<p>אפשר לבחור בכל רגע — או להמשיך ללמוד מהקישורים הדיגיטליים.</p></div>';
  }

  h += '<button class="btn g" style="margin-top:14px" onclick="renderPlan()">' +
    'התוכנית המלאה שלי</button>' +
    '<div class="saved">הבחירות שלכם שמורות במכשיר הזה</div>';

  document.getElementById('mine-body').innerHTML = h;
  masaShow('mine');
  var mk = document.getElementById('mine-mark');
  if (mk) mk.src = LOGO_MARK;
}
function scrollKit() {
  var a = document.getElementById('kit-anchor');
  if (a) a.scrollIntoView({ behavior:'smooth', block:'start' });
  else alert('בחרתם ללמוד מספר מודפס. אפשר לשנות ב"שינוי ההעדפות".');
}

/* ============================================================
   גיליון בחירה + מצגת — מועתקים בקטן מהאפליקציה הראשית
   ============================================================ */
var sheetCb = null;
function sheet(title, items, value, cb) {
  sheetCb = cb;
  document.getElementById('sheet-t').textContent = title;
  document.getElementById('sheet-l').innerHTML = items.map(function (it) {
    return '<div class="it' + (it.v === value ? ' on' : '') +
      '" onclick="sheetPick(\'' + it.v + '\')"><span class="tick">✓</span>' +
      esc(it.t) + '</div>';
  }).join('');
  document.getElementById('sheet').className = 'on';
}
function sheetPick(v) { sheetClose(); if (sheetCb) sheetCb(v); }
function sheetClose() { document.getElementById('sheet').className = ''; }

var deck = { imgs:[], i:0 };
function deckOpen(i) {
  var t = curTrack(), c = contentFor(t).c;
  if (!c || !c.deck) return;
  deck.imgs = [];
  for (var n = 1; n <= c.deck.n; n++)
    deck.imgs.push(c.deck.dir + '/' + (n < 10 ? '0' + n : n) + '.jpg');
  deck.i = i || 0;
  document.getElementById('d-where').textContent =
    'מסכת ' + trackById(t).masechet + ' · דף ' + contentFor(t).row[2];
  document.getElementById('deck').className = 'on';
  deckPaint();
}
function deckClose() { document.getElementById('deck').className = ''; }
function deckGo(d) {
  var n = deck.i + d;
  if (n < 0 || n >= deck.imgs.length) return;
  deck.i = n; deckPaint();
}
function deckPaint() {
  document.getElementById('d-img').src = deck.imgs[deck.i];
  var nx = deck.imgs[deck.i + 1];
  if (nx) { var pre = new Image(); pre.src = nx; }
  document.getElementById('d-prev').disabled = deck.i === 0;
  document.getElementById('d-next').disabled = deck.i === deck.imgs.length - 1;
}
document.addEventListener('keydown', function (e) {
  if (document.getElementById('deck').className !== 'on') return;
  if (e.key === 'Escape') deckClose();
  if (e.key === 'ArrowLeft')  deckGo(1);
  if (e.key === 'ArrowRight') deckGo(-1);
});

/* ---------- הפעלה ---------- */
(function () {
  var hm = document.getElementById('hero-mark');
  if (hm) hm.src = LOGO_MARK;
  document.getElementById('ver').textContent = 'גרסת ניסוי ' + MASA_VERSION;

  if (profile.seen && profile.mode) renderMine();
  else if (profile.mode) openPlan();
  else masaShow('start');
})();
