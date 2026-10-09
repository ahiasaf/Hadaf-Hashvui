
/* שקף חדש שלא היה קיים בתיקייה כלל - ייעודי לחלק הזה בלבד.
   מעלים אותו בדיוק כמו הקלטה (`ghput` + אימות מול גיטהאב), בשם
   קובץ שלא מתנגש בשום מספר סידורי ("piece-<קטע>-<חלק>"), ולכן
   הוא **לא נכנס לרשימת הסדר של המצגת הרגילה** במסך הניהול -
   שקף שמשרת רק את הפירוש הקולי, בלי לגעת ברצף הקיים. */
function ownSlideExt_(mime) {
  if (/png/.test(mime)) return 'png';
  if (/webp/.test(mime)) return 'webp';
  return 'jpg';
}
function ownPieceSlideUpload(i, file) {
  ownEditSync_();
  if (!DECK || !file) return;
  var n = OWN_EDIT_N, pid = OWN_EDIT[i]._id;
  if (!cfgReadKey_()) {
    ownMsg('bad', 'צריך סיסמת סקריפט במכשיר כדי להעלות שקף - ניהול ← מערכת.');
    paintOwnEdit_(n); return;
  }
  /* WebP ‏75, עד 1800 רוחב (ImgShrink ב-deck.js); לא הצליח - המקור. */
  ImgShrink(file, function (sm) {
    if (sm) { ownPieceSlidePut_(n, pid, sm.ext, sm.url.split(',')[1]); return; }
    var fr = new FileReader();
    fr.onload = function () {
      ownPieceSlidePut_(n, pid, ownSlideExt_(file.type), ownB64FromBuf_(fr.result));
    };
    fr.readAsArrayBuffer(file);
  });
}
function ownPieceSlidePut_(n, pid, ext, b64) {
  var fname = 'piece-' + n + '-' + pid + '.' + ext;
  var path = (DECK.dir ? DECK.dir + '/' : '') + fname;
  ownMsg('', 'מעלה שקף…'); paintOwnEdit_(n);
  fetch(API, { method:'POST', mode:'no-cors', body:JSON.stringify({
    action:'ghput', key:cfgReadKey_(), path:path, b64:b64,
    msg:'שקף לחלק בקטע ' + n
  }) }).catch(function () {}).then(function () {
    ownUploadVerify_(path, 0, function (ok) {
      if (ok && OWN_EDIT && OWN_EDIT_N === n) {
        OWN_EDIT.forEach(function (p) { if (p._id === pid) p.slide = fname; });
        ownMsg('ok', 'השקף עלה. הוא ישויך לחלק בלחיצה על שמירה.');
      } else {
        ownMsg('bad', 'העלאת השקף נכשלה - אפשר לנסות שוב.');
      }
      if (OWN_EDIT_N === n) paintOwnEdit_(n);
    });
  });
}

/* פירוש - טקסט חופשי נטו, ולכל חלק גם הקלטה ושקף אפשריים (ראו
   `ownAudioGo`/`ownPieceSlideUpload` למעלה). אזור עריכה חי (לא
   textarea) כדי שיהיה אפשר להדגיש מילה בודדת בבולד; מעבר לזה
   זו עריכה רגילה לגמרי של הדפדפן.

   שער הפרסום: `OWN.__pub` הוא מפתח שמור אחד לכל הדף (לא קטע),
   באותו אובייקט בדיוק שכבר נשמר לכל דף - בלי לשונית נוספת ובלי
   שינוי ב-apps-script.gs. בלי הדגל - כותבים כמה שרוצים, רק
   אחיאסף רואה. עם הדגל - תלמידים רואים מיד, כולל כל עריכה הבאה. */
/* יש עריכה בזיכרון שעדיין לא נשמרה בגיליון? השוואה למה שכבר
   ידוע כשמור (`ownPieces_`) - לא הצהרה, בדיקה אמיתית. */
function ownEditDirty_() {
  if (!OWN_EDIT) return false;
  ownEditSync_();
  return JSON.stringify(ownCleanPieces_(OWN_EDIT)) !== JSON.stringify(ownPieces_(OWN_EDIT_N));
}
function paintOwn() {
  var st = FLAT[IDX], box = $('chb');
  if (!st) { box.innerHTML = ''; return; }
  var n = st.n;
  if (!SIDE_ADM) { paintOwnRead_(n); return; }
  /* עברו לקטע אחר בזמן שנשאר טקסט לא שמור - שומרים אותו ברקע
     לפני שהוא נעלם. זה בדיוק מה שקרה בפועל: כתיבה בקטע אחד,
     מעבר לקטע הבא בלי ללחוץ "שמירה", והכתיבה אבדה. */
  if (OWN_EDIT && OWN_EDIT_N !== n && ownEditDirty_()) ownSaveAll(OWN_EDIT_N, true);
  ownEditLoad_(n);
  paintOwnEdit_(n);
  var need = OWN_EDIT.filter(function (p) { return !VOX_CACHE.hasOwnProperty(n + '::' + p._id); });
  if (need.length) Promise.all(need.map(function (p) { return voxLoad(n, p._id); }))
    .then(function () {
      if (FLAT[IDX] && FLAT[IDX].n === n && OWN_EDIT_N === n) { ownEditSync_(); paintOwnEdit_(n); }
    });
}
function paintOwnRead_(n) {
  var box = $('chb'), pieces = ownPieces_(n);
  if (!pieces.length) { box.innerHTML = '<div class="none">טרם נכתב כאן פירוש.</div>'; box.scrollTop = 0; return; }
  /* אחרי איחוד באים שני חלקים באותו תיוג ("פירוש") ברצף - הם נקראים
     כהמשך אחד, עם רווח פסקה, בלי כותרת: בדיוק כמו קטע עם חלק אחד. */
  var mixed = pieces.some(function (p) { return p.tag !== pieces[0].tag; });
  box.innerHTML = pieces.map(function (p, i) {
    var same = i > 0 && pieces[i - 1].tag === p.tag;
    var lbl = (mixed && p.tag && !same) ? '<div class="own-plbl">' + esc(p.tag) + '</div>' : '';
    return lbl + '<div class="own-read">' + ownSan(p.text) + '</div>';
  }).join('');
  box.scrollTop = 0;
}
function paintOwnEdit_(n) {
  var box = $('chb'), pubOn = !!(OWN && OWN.__pub);
  var html = '<div class="own-bar" id="own-bar"></div>';

  html += OWN_EDIT.map(function (p, i) {
    var key = n + '::' + p._id, loaded = VOX_CACHE.hasOwnProperty(key), clip = VOX_CACHE[key];
    var recording = !!(VOX_RECORDER && VOX_FOR && VOX_FOR.n === n && VOX_FOR.pid === p._id);
    var audioRow;
    if (recording) {
      audioRow = '<button class="stop" onclick="ownAudioStop()">⏹ עצירה</button>';
    } else if (clip) {
      audioRow = '<audio controls preload="none" src="' + voxClipUrl_(clip) + '"></audio>' +
        '<button class="back" onclick="ownAudioDel(' + i + ')" aria-label="מחיקת ההקלטה">✕</button>' +
        '<button onclick="ownAudioGo(' + i + ')">מחדש</button>';
    } else if (p.audio && loaded) {
      audioRow = '<audio controls preload="none" src="' + esc(p.audio) + '"></audio>' +
        '<button onclick="ownAudioGo(' + i + ')">מחדש</button>';
    } else if (!loaded) {
      audioRow = '<span class="vox-empty">טוען…</span>';
    } else {
      audioRow = '<button class="hot" onclick="ownAudioGo(' + i + ')">⏺ הקלטה</button>';
    }
    /* בלי שקף ייעודי - שתי דרכים לקבוע אחד: לבחור שקף שכבר קיים
       בתיקייה (רשת ממוזערים, לא תופסת מקום כשהיא סגורה), או
       להעלות שקף חדש. עם שקף ייעודי - רק תווית קצרה והסרה. */
    var slideStatus = !DECK ? '<span class="sp"></span>' :
      p.slide ? '<span class="sp"></span><span class="own-slide-txt">שקף ייעודי</span>' +
        '<button onclick="ownPieceSlideClear(' + i + ')">הסרה</button>' :
      '<span class="sp"></span>' +
      '<button onclick="ownPieceSlidePickOpen(' + i + ')">קיים</button>' +
      '<label class="own-slide-up">חדש' +
      '<input type="file" accept="image/*" onchange="ownPieceSlideUpload(' + i + ',this.files[0])"></label>';

    /* בולד/ביטול/חזרה - ליד תיבת הטקסט של כל חלק, לא רחוק ממנה.
       פועלים על תיבת הטקסט שהייתה בפוקוס אחרון: ה-
       mousedown+preventDefault שומר על הבחירה שם, גם כשהכפתור
       יושב בחלק אחר של המסך. ביטול/חזרה נשענים על ההיסטוריה
       המובנית של הדפדפן (execCommand) - לכן הם "לסשן הנוכחי
       בלבד" מאליהם, בלי שום שמירה נוספת. */
    var toolsRow = '<div class="own-tools">' +
      '<button type="button" class="icon" onmousedown="event.preventDefault();' +
      'document.execCommand(\'styleWithCSS\',false,false);document.execCommand(\'bold\')" ' +
      'title="הדגשה (בולד)">B</button>' +
      '<button type="button" class="icon own-psuk-btn" onmousedown="event.preventDefault();ownPsuk_()" ' +
      'title="גופן של פסוק - סמנו את הפסוק ולחצו">פסוק</button>' +
      '<button type="button" class="icon" onmousedown="event.preventDefault();document.execCommand(\'undo\')" ' +
      'title="ביטול">↶</button>' +
      '<button type="button" class="icon" onmousedown="event.preventDefault();document.execCommand(\'redo\')" ' +
      'title="חזרה">↷</button>' +
      slideStatus + '</div>';

    var moveBtns = OWN_EDIT.length > 1 ?
      '<button class="own-mv" onclick="ownPieceMove_(' + i + ',-1)"' +
      (i === 0 ? ' disabled' : '') + ' aria-label="הזזה למעלה">▲</button>' +
      '<button class="own-mv" onclick="ownPieceMove_(' + i + ',1)"' +
      (i === OWN_EDIT.length - 1 ? ' disabled' : '') + ' aria-label="הזזה למטה">▼</button>' : '';

    /* השמירה יושבת בשורת ההקלטה של החלק האחרון - לא שורה נפרדת
       משלה. כפתור ההקלטה במקומו (ימין), השמירה נדחפת לצד השני
       (שמאל) על ידי מרווח אוטומטי, ראו CSS. */
    var saveBtn = i === OWN_EDIT.length - 1 ?
      '<button class="own-save" id="own-save">' + (pubOn ? 'שמירת כל הדף' : 'שמירת טיוטה - כל הדף') + '</button>' : '';

    return '<div class="own-piece">' +
      '<div class="own-piece-h">' +
      '<input class="own-tag" id="own-tag-' + i + '" type="text" value="' + esc(p.tag) + '" aria-label="תיוג החלק">' +
      moveBtns + '<span class="sp"></span>' +
      (OWN_EDIT.length > 1 ? '<button class="back" onclick="ownPieceDel(' + i + ')" aria-label="מחיקת החלק">✕</button>' : '') +
      '</div>' +
      '<div class="vox-txt own-edit" id="own-txt-' + i + '" contenteditable="true" ' +
      'data-ph="כתוב כאן את הפירוש שלך לקטע הזה…">' + ownSan(p.text) + '</div>' +
      toolsRow + '<div class="own-audio">' + audioRow + saveBtn + '</div></div>';
  }).join('');

  html += '<button class="own-add" id="own-add">+ הוספת חלק (למשל: העשרה)</button>' +
    /* פעולות על כל הדף - למטה, אחרי העריכה עצמה: לא צריכות
       לתפוס את המקום הראשון שרואים בכל פתיחה של המסך. */
    '<button class="own-export-btn" id="own-export-open">ייצוא טקסט - פירוש לנוער / חברותא</button>' +
    (vOfN_(n + 1) ? '<button class="own-export-btn" id="own-merge">איחוד קטע ' + n + ' עם קטע ' + (n + 1) + '</button>' : '') +
    '<div class="own-pub' + (pubOn ? ' on' : '') + '"><span>' +
    (pubOn ? 'מפורסם - כל התלמידים רואים את הדף הזה' : 'טיוטה - רק אתה רואה') +
    '</span><button id="own-pub-btn">' + (pubOn ? 'החזרה לטיוטה' : 'פרסום לכל הדף') + '</button></div>';

  box.innerHTML = html;
  box.scrollTop = 0;
  if (OWN_RESTORED && !OWN_FAIL) OWN_NOTE = 'שוחזר מה שכתבת בקטע הזה ועוד לא נשמר לגיליון.';
  ownBar_();
  if (OWN_RESTORED) OWN_NOTE = '';
  OWN_RESTORED = false;
  $('own-pub-btn').onclick = function () {
    var goingOn = !pubOn;
    if (goingOn && !window.confirm(
      'לפרסם את "הפירוש" לכל הדף הזה? כל התלמידים שיפתחו אותו יראו אותו החל מעכשיו.'
    )) return;
    ownEditSync_();
    ownPublishSet(goingOn);
  };
  $('own-add').onclick = ownPieceAdd;
  $('own-save').onclick = function () { ownEditSync_(); ownSaveAll(n); };
  $('own-export-open').onclick = ownExportOpen;
  if ($('own-merge')) $('own-merge').onclick = function () { ownEditSync_(); mergeNext_(); };
  OWN_EDIT.forEach(function (p, i) {
    var e = $('own-txt-' + i);
    if (e) e.addEventListener('blur', function () { document.body.classList.remove('kb-open'); });
    if (e) e.addEventListener('paste', ownPaste_);
    if (e) e.addEventListener('input', ownTyped_);
    var tg = $('own-tag-' + i);
    if (tg) tg.addEventListener('input', ownTyped_);
  });
}

/* ============================================================
   איחוד עם הקטע הבא (מנהל בלבד).
   ============================================================
   "איחוד יהיה גם בסטודיו וגם בדף האינטראקטיבי: מסירים את קו
   ההפרדה בגמרא ובחברותא, והפירוש לנוער של שני הקטעים מחובר."

   מה שמשתנה הוא **רק** "סימוני הדף": הקטע הראשון נמתח עד סוף
   השני, הביאור של שניהם מתחבר, והשני יורד (או נעשה המשך, כשהוא
   בעמוד הבא). המזהה של הראשון נשאר, והמזהה של השני נרשם אצלו
   ב-`also` - ולכן הפירוש, ההקלטות והשאלות של שניהם מוצגים ברצף
   בלי שום כתיבה ללשוניות האחרות, ושום קטע אחר לא זז.

   הכתיבה: קוראים את הלשונית כולה מחדש, מוודאים שהעמודים שנוגעים
   בהם לא השתנו מאז שהדף נפתח (אחרת - מבקשים רענון, כדי לא לדרוס
   עבודה מהסטודיו), כותבים, וקוראים שוב לאמת. no-cors אינו הוכחה.
   ============================================================ */
function mergeWhy_(n) {
  var A = FLAT.filter(function (v) { return v.n === n; });
  var B = FLAT.filter(function (v) { return v.n === n + 1; });
  if (!A.length || !B.length) return 'אין קטע אחרי הקטע הזה בדף.';
  var aLast = A[A.length - 1], b = B[0];
  /* קובץ חברותא אחד לכל דף: ביאור אחד אינו יכול לחצות שני קבצים. */
  if (SidDaf(aLast.rec.daf) !== SidDaf(b.rec.daf) ||
      (A[0].st.cont && A[0].rec.pg === 1))
    return 'שני הקטעים שייכים לשני דפים שונים, וכל אחד מבוסס על חברותא אחרת - אי אפשר לאחד אותם.';
  if (aLast.rec !== b.rec && b.si !== 0)
    return 'הקטעים אינם צמודים זה לזה בסימון - צריך לאחד אותם בסטודיו.';
  return '';
}
function mergeLegacy_() {
  return [OWN, QOWN, ANCH].some(function (r) {
    if (!r || r.__bad || r.__ids) return false;
    for (var k in r) if (r.hasOwnProperty(k) && /^\d+$/.test(k)) return true;
    return false;
  });
}
function mergeNext_() {
  var st = FLAT[IDX];
  if (!SIDE_ADM || !st) return;
  var n = st.n, why = mergeWhy_(n);
  if (why) { toast(why); return; }
  if (OWN_EDIT && ownEditDirty_()) { toast('יש בקטע הזה פירוש שעוד לא נשמר - שמרו קודם, ואז אחדו.'); return; }
  if (!API || !writeKey_()) { toast(NOKEY_MSG); return; }
  var msg = 'לאחד את קטע ' + n + ' עם קטע ' + (n + 1) + '?\n\n' +
    'קו ההפרדה ביניהם יוסר בגמרא ובחברותא. הפירוש לנוער, ההקלטות והשאלות של שניהם יוצגו יחד, ברצף.';
  if (mergeLegacy_()) msg += '\n\n⚠ הדף הזה עוד לא הוסב למזהים קבועים. האיחוד יזיז את הפירוש, השאלות והשקפים של כל הקטעים שאחרי קטע ' + (n + 1) + '.';
  else if (ANCH && sidMode_(ANCH)) {
    var B = vOfN_(n + 1), C = vOfN_(n + 2);
    var bs = B && B.id ? anchPos_(ANCH[B.id]) : 0;
    var cs = C && C.id ? anchPos_(ANCH[C.id]) : 0;
    if (bs && C && cs) msg += '\n\nשימו לב: שקף ' + bs + ' מתחיל בקטע ' + (n + 1) +
      ', ולקטע ' + (n + 2) + ' יש שקף משלו - שקף ' + bs + ' לא יוצג יותר ברצף.';
    else if (bs) msg += '\n\nשקף ' + bs + ' יעבור להתחיל בקטע הבא.';
  }
  if (!window.confirm(msg)) return;
  toast('מאחד…');
  var want = {};
  PAGES.forEach(function (p) { if (p.rec) want[p.rec.key] = p.rec.raw[3]; });
  sheetCsv(MARK_TAB).then(function (rows) {
    if (!rows || !hasMine(rows)) throw new Error('read');
    var head = String((rows[0] || [])[0] || '').indexOf('מסכת') >= 0;
    var body = head ? rows.slice(1) : rows;
    var recs = SidParse(body);
    /* מה שבגיליון עכשיו הוא מה שנפתח כאן? */
    var stale = recs.some(function (R) { return want[R.key] !== undefined && R.raw[3] !== want[R.key]; });
    if (stale) { toast('הסימונים של הדף השתנו מאז שנפתח (כנראה בסטודיו). רעננו את הדף ונסו שוב.'); return; }
    var F = SidFlat(recs, S.mas, S.daf).flat;
    var A = F.filter(function (v) { return v.n === n; });
    var B = F.filter(function (v) { return v.n === n + 1; });
    if (!A.length || !B.length) throw new Error('shape');
    var root = A[0].st, aLast = A[A.length - 1], b = B[0], bs = b.st;
    var taken = SidTaken(recs, S.mas), changed = {};
    if (!root.id) root.id = SidNew(taken);
    var c = { from: root.c.from, to: bs.c.to,
              text: (root.c.text || '') + ' ' + (bs.c.text || ''),
              h: (root.c.h || '') + (bs.c.h || '') };
    var also = (root.also || []).slice();
    [bs.id].concat(bs.also || []).forEach(function (a) { if (a && also.indexOf(a) < 0 && a !== root.id) also.push(a); });
    if (also.length) root.also = also;
    if (aLast.rec === b.rec) {
      /* אותו עמוד: הראשון נמתח עד סוף השני, והשני יורד. */
      aLast.st.g = { from: aLast.st.g.from, to: { line: bs.g.to.line, x: bs.g.to.x } };
      b.rec.d.steps.splice(b.si, 1);
      if (b.rec.d.prev > b.si) b.rec.d.prev--;
    } else {
      /* השני בעמוד הבא: הוא נשאר במקומו, ונעשה המשך של הראשון. */
      bs.cont = 1;
      delete bs.id; delete bs.also;
    }
    A.concat(B).forEach(function (v) {
      if (v.st === bs && aLast.rec === b.rec) return;
      v.st.c = { from: c.from, to: c.to, text: c.text, h: c.h };
      changed[v.rec.key] = v.rec;
    });
    changed[b.rec.key] = b.rec;
    var now = Date.now(), out = [];
    Object.keys(changed).forEach(function (k) { changed[k].d.t = now; });
    recs.forEach(function (R) {
      var r = R.raw.slice(0, 4);
      if (changed[R.key]) r[3] = JSON.stringify(R.d);
      out.push(r);
    });
    fetch(API, { method:'POST', mode:'no-cors', body: JSON.stringify({
      action:'table', tab:MARK_TAB, key:cfgReadKey_(),
      cols: JSON.stringify(['מסכת', 'דף', 'עמוד', 'נתונים']),
      rows: JSON.stringify(out) }) }).catch(function () {});
    var sent = {};
    Object.keys(changed).forEach(function (k) { sent[k] = JSON.stringify(changed[k].d); });
    mergeVerify_(0, sent, root.id, n);
  }).catch(function () {
    toast('לא הצלחתי לקרוא את הגיליון - לא אוחד דבר.');
  });
}
function mergeVerify_(tries, sent, id, n) {
  setTimeout(function () {
    sheetCsv(MARK_TAB).then(function (rows) {
      var recs = SidParse(rows || []), ok = !!rows, left = Object.keys(sent).length;
      recs.forEach(function (R) {
        if (sent[R.key] === undefined) return;
        left--;
        if (JSON.stringify(R.d) !== sent[R.key]) ok = false;
      });
      if (ok && !left) {
        var built = amudCut(SidFlat(recs, S.mas, S.daf));
        PAGES = built.pages; FLAT = built.flat; GROUPS = built.groups;
        OWN_EDIT = null; OWN_EDIT_N = -1; Q_AT = { n: 0, i: 0 };
        var at = 0;
        for (var j = 0; j < FLAT.length; j++) if (FLAT[j].id === id || FLAT[j].n === n) { at = j; break; }
        toast('✓ אוחד ואומת. קטע ' + n + ' כולל עכשיו את שני הקטעים.');
        go(at);
        return;
      }
      if (tries < 4) { mergeVerify_(tries + 1, sent, id, n); return; }
      toast('⚠ האיחוד לא אומת מול הגיליון (אולי הסיסמה שגויה). רעננו את הדף ובדקו.');
    });
  }, tries ? 1500 : 1200);
}

/* הכתיבה היא no-cors ולכן תמיד "מצליחה" - ראו ההערה המקבילה
   ליד sideSave. ההודעה "נשמר" נאמרת רק אחרי קריאה חוזרת. */
/* הרשימה המלאה, לכתיבה - משותפת לשמירת קטע ולמתג הפרסום, כי
   שתיהן כותבות את אותה לשונית שלמה מחדש. */
function ownRows_() {
  var rows = [], k;
  for (k in OMAP) {
    if (!OMAP.hasOwnProperty(k)) continue;
    var v = OMAP[k], parts = k.split('|');
    if (v && v.__bad) { rows.push([parts[0], parts[1], v.__bad]); continue; }
    var has = false, q;
    for (q in v) if (v.hasOwnProperty(q)) { has = true; break; }
    if (has) rows.push([parts[0], parts[1], JSON.stringify(v)]);
  }
  return rows;
}