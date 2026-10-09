
/* פסוק - עוטף את הבחירה בגופן של פסוקים, ואם הבחירה כבר בתוך
   פסוק - מחזיר אותה לגופן הרגיל. */
function ownPsuk_() {
  var sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  var n = sel.anchorNode, ed = null, ps = null;
  for (var x = n; x; x = x.parentNode) {
    if (x.nodeType === 1 && !ps && x.classList && x.classList.contains('psuk')) ps = x;
    if (x.nodeType === 1 && x.classList && x.classList.contains('own-edit')) { ed = x; break; }
  }
  if (!ed) return;
  if (ps) {
    while (ps.firstChild) ps.parentNode.insertBefore(ps.firstChild, ps);
    ps.parentNode.removeChild(ps);
    return;
  }
  if (sel.isCollapsed) return;
  var r = sel.getRangeAt(0), sp = document.createElement('span');
  sp.className = 'psuk';
  sp.appendChild(r.extractContents());
  r.insertNode(sp);
  sel.removeAllRanges();
  var r2 = document.createRange(); r2.selectNodeContents(sp); sel.addRange(r2);
}

/* ============================================================
   שום מילה לא הולכת לאיבוד.
   ============================================================
   "כתבתי קטע, קפצתי רגע לראות מה כתוב בחברותא, חזרתי - ומה
   שכתבתי נמחק." השמירה האוטומטית פעלה רק במעבר **לקטע אחר**;
   מעבר ללשונית חברותא באותו קטע צייר את האזור מחדש, והטקסט
   שבתיבה - שעוד לא הועתק לזיכרון - נעלם.

   שלוש שכבות, מהזולה ליקרה:
     1. **במכשיר, בכל הקשה.** טיוטה ב-localStorage לכל קטע
        (`df:ownDraft`). חינם, מיידי, שורד מעבר לשונית, ריענון
        וסגירת האפליקציה. נמחקת כשהגיליון אישר שמירה זהה.
     2. **לפני כל ציור מחדש** של האזור (חברותא, חידה, קטע אחר)
        התיבות נקראות לזיכרון - ראו `ownCatch_` ב-paintChavArea.
     3. **לגיליון, כמה שניות אחרי שהפסיק להקליד** - רק כשהדף
        בטיוטה. בדף מפורסם, שמירה אוטומטית הייתה מציגה לתלמידים
        משפט חצי כתוב; שם השמירה לגיליון נשארת בכפתור ובמעבר קטע,
        והטיוטה במכשיר שומרת בינתיים.
   ============================================================ */
var OWN_DRAFT_KEY = 'df:ownDraft', OWN_AUTO_T = null, OWN_SAVING = false;
/* טיוטה נקשרת למזהה (`#id`) בדף שהוסב, ולמספר בדף שלא. טיוטה ישנה
   לפי מספר מתורגמת פעם אחת, דרך המפה הקפואה של ההסבה - ראו
   `ownDraftIds_`. */
function ownDraftKey_(n) {
  var ks = sidKeys_(OWN, n);
  return dmKey(S.mas, S.daf) + '|' + (ks[0] === String(n) ? n : '#' + ks[0]);
}
function ownDraftN_(suffix) {
  if (suffix.charAt(0) === '#') return nOfId_(suffix.slice(1));
  return +suffix;
}
/* ============================================================
   טיוטות שנכתבו לפני ההסבה.
   ============================================================
   טיוטה במכשיר נשמרה לפי המספר שהיה אז. אחרי ההסבה המספר כבר אינו
   מפתח - ואם בינתיים פוצל קטע, הוא גם אינו אותו קטע. לכן התרגום
   הוא דרך המפה שנקפאה ברגע ההסבה (`__n2id`), ולא דרך הסדר של היום. */
function ownDraftIds_() {
  var map = OWN && OWN.__ids && OWN.__n2id;
  if (!map) return;
  var all = ownDraftAll_(), pre = dmKey(S.mas, S.daf) + '|', moved = 0, k;
  for (k in all) {
    if (!all.hasOwnProperty(k) || k.indexOf(pre) !== 0) continue;
    var suf = k.slice(pre.length);
    if (!/^\d+$/.test(suf) || !map[suf]) continue;
    var nk = pre + '#' + map[suf];
    if (!all[nk] || (all[k].at || 0) > (all[nk].at || 0)) all[nk] = all[k];
    delete all[k];
    moved++;
  }
  if (moved) try { localStorage.setItem(OWN_DRAFT_KEY, JSON.stringify(all)); } catch (e) {}
}
function ownDraftAll_() {
  try { return JSON.parse(localStorage.getItem(OWN_DRAFT_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function ownDraftPut_() {
  if (!OWN_EDIT) return;
  var all = ownDraftAll_(), k = ownDraftKey_(OWN_EDIT_N);
  var clean = ownCleanPieces_(OWN_EDIT);
  if (JSON.stringify(clean) === JSON.stringify(ownPieces_(OWN_EDIT_N))) delete all[k];
  else all[k] = { pieces: clean, at: Date.now() };
  try { localStorage.setItem(OWN_DRAFT_KEY, JSON.stringify(all)); } catch (e) {}
}
/* ============================================================
   כל הדף בלחיצה אחת.
   ============================================================
   "מה אני אמור לזכור - כל קטע שכתבתי אם העליתי אותו או לא?"
   השמירה נכתבה לקטע אחד, וקטע שלא עלה (שמירה אוטומטית שנעצרה
   בגלל גרסה ממכשיר אחר, או האחרון לפני סגירה) חיכה בטיוטה
   במכשיר בלי שום סימן. עכשיו כל שמירה לוקחת איתה את **כל**
   הטיוטות של הדף, ומתחת לעריכה כתוב אילו קטעים עוד לא עלו. */
function ownOtherDrafts_(n) {
  ownDraftIds_();
  var all = ownDraftAll_(), pre = dmKey(S.mas, S.daf) + '|', out = [], k, q;
  for (k in all) {
    if (!all.hasOwnProperty(k) || k.indexOf(pre) !== 0) continue;
    q = ownDraftN_(k.slice(pre.length));
    if (!(q > 0) || q === n || !all[k] || !all[k].pieces) continue;
    out.push({ n:q, pieces:ownCleanPieces_(all[k].pieces), at:all[k].at || 0 });
  }
  out.sort(function (a, b) { return a.n - b.n; });
  return out;
}
/* מספרי הקטעים בדף שיש להם מה שעוד לא הגיע לגיליון. */
function ownPendingNs_() {
  var out = ownOtherDrafts_(-1).filter(function (d) {
    return JSON.stringify(d.pieces) !== JSON.stringify(ownPieces_(d.n));
  }).map(function (d) { return d.n; });
  if (OWN_EDIT && out.indexOf(OWN_EDIT_N) < 0 &&
      JSON.stringify(ownCleanPieces_(OWN_EDIT)) !== JSON.stringify(ownPieces_(OWN_EDIT_N))) {
    out.push(OWN_EDIT_N);
  }
  return out.sort(function (a, b) { return a - b; });
}
function ownPendingTxt_() {
  var ns = ownPendingNs_();
  if (!ns.length) return '';
  return ns.length === 1 ? 'קטע ' + ns[0] + ' עוד לא נשמר לגיליון.'
                         : 'עוד לא נשמרו לגיליון: קטעים ' + ns.join(', ') + '.';
}
function ownDraftDrop_(n) {
  var all = ownDraftAll_(); delete all[ownDraftKey_(n)];
  try { localStorage.setItem(OWN_DRAFT_KEY, JSON.stringify(all)); } catch (e) {}
}
/* התיבות שעל המסך → הזיכרון והטיוטה. נקרא לפני כל ציור מחדש. */
function ownCatch_() {
  if (!SIDE_ADM || !OWN_EDIT || !$('own-txt-0')) return;
  ownEditSync_();
  ownDraftPut_();
}
/* הקלדה: טיוטה במכשיר מיד, ולגיליון אחרי שקט (בדף טיוטה בלבד). */
function ownTyped_() {
  ownEditSync_();
  ownDraftPut_();
  OWN_NOTE = '';
  ownBar_();
  clearTimeout(OWN_AUTO_T);
  if (OWN && OWN.__pub) return;
  var n = OWN_EDIT_N;
  OWN_AUTO_T = setTimeout(function () {
    if (OWN_SAVING || OWN_EDIT_N !== n || !ownEditDirty_()) return;
    /* הקלטה שממתינה להעלאה - רק בלחיצה, לא ברקע. */
    var pend = OWN_EDIT.some(function (p) { return VOX_CACHE[n + '::' + p._id] && !p.audio; });
    if (pend) return;
    ownSaveAll(n, true);
  }, 6000);
}

function ownEditLoad_(n) {
  if (OWN_EDIT && OWN_EDIT_N === n) return;
  ownDraftIds_();
  var src = ownPieces_(n);
  /* טיוטה שלא הגיעה לגיליון גוברת על מה ששמור שם. */
  var dr = ownDraftAll_()[ownDraftKey_(n)], restored = false;
  /* טיוטה ישנה מגרסה שכבר נשמרה אחריה (ממכשיר אחר) - אינה גוברת.
     בלי זה טלפון עם טיוטה מלפני שעות החזיר אותה על פני עבודה
     חדשה שנשמרה מהמחשב. */
  var sheetT = ownTime_(n);
  /* **לא מוחקים - רק לא משתמשים.** `__t` שבזיכרון אינו בהכרח מה
     שבגיליון: `ownFresh_` כותב אותו לזיכרון לפני שהשרת קיבל. כשהשרת
     דחה (סיסמה חסרה, דף פתוח מגרסה ישנה) - הטיוטה נמחקה כאן, והקטע
     נעלם בחזרה אליו. טיוטה נמחקת רק כשהגיליון אישר (`ownVerify`). */
  if (dr && sheetT && dr.at && dr.at < sheetT) dr = null;
  if (dr && dr.pieces && dr.pieces.length &&
      JSON.stringify(dr.pieces) !== JSON.stringify(src)) { src = dr.pieces; restored = true; }
  OWN_EDIT_BASE = JSON.stringify(ownCleanPieces_(ownPieces_(n)));
  OWN_EDIT = (src.length ? src : [{ tag:'פירוש', text:'', slide:'', audio:'' }]).map(function (p) {
    return { tag:p.tag || 'פירוש', text:p.text || '', slide:p.slide || '', audio:p.audio || '', _id:ownPid_() };
  });
  OWN_EDIT_N = n;
  OWN_RESTORED = restored;
}
var OWN_RESTORED = false;
/* מה היה בגיליון כשהקטע נפתח לעריכה - כדי לזהות שבינתיים נשמרה
   ממכשיר אחר גרסה חדשה יותר של אותו קטע. */
var OWN_EDIT_BASE = '';
/* מתי נשמר כל קטע לאחרונה (`__t` בתוך הרשומה של הדף). */
function ownTime_(n) { return sidTime_(OWN, n); }
function ownEditSync_() {
  if (!OWN_EDIT) return;
  OWN_EDIT.forEach(function (p, i) {
    var t = $('own-tag-' + i); if (t) p.tag = t.value;
    var e = $('own-txt-' + i); if (e) p.text = e.textContent.trim() ? ownSan(e.innerHTML).trim() : '';
  });
}
function ownPieceAdd() {
  ownEditSync_();
  OWN_EDIT.push({ tag:'העשרה', text:'', slide:'', audio:'', _id:ownPid_() });
  paintOwn();
}
function ownPieceDel(i) {
  ownEditSync_();
  if (OWN_EDIT.length <= 1) OWN_EDIT[0] = { tag:'פירוש', text:'', slide:'', audio:'', _id:ownPid_() };
  else OWN_EDIT.splice(i, 1);
  paintOwn();
}
/* סדר החלקים הוא סדר ההצגה - גם בלשונית הכתובה וגם בכפתורי
   ההשמעה. לפעמים חלק צריך לבוא **לפני** ה"פירוש" הראשי (הקדמה),
   לא רק אחריו - ולכן סדר חופשי, לא רק הוספה בסוף. */
function ownPieceMove_(i, d) {
  ownEditSync_();
  var j = i + d, tmp;
  if (j < 0 || j >= OWN_EDIT.length) return;
  tmp = OWN_EDIT[i]; OWN_EDIT[i] = OWN_EDIT[j]; OWN_EDIT[j] = tmp;
  paintOwn();
}
/* ברירת המחדל: חלק בלי שקף משלו משתמש בשקף שכבר משויך לקטע
   הזה במסך הניהול של המצגת - בדיוק כמו שכל תלמיד רואה היום.
   אין צורך לגעת כאן בכלל. השקף הייעודי (`p.slide`) קיים רק
   לחריג: שקף חדש שקיים רק במצב הפירוש הקולי (`ownPieceSlideUpload`
   למטה) - לא לבחירה מחדש מתוך שקפים שכבר קיימים. */
function ownPieceSlideClear(i) {
  ownEditSync_();
  OWN_EDIT[i].slide = '';
  paintOwn();
}
/* בחירת שקף שכבר קיים - רשת ממוזערים ולא רשימת מספרים, כי
   "שקף 5" כשלעצמו לא אומר כלום; רואים מה עליו ובוחרים. הרשת
   נפתחת מעל הכל (`#own-pick`, אותה מחלקת `.sheet` ששער הדף
   כבר משתמש בה) ולא תופסת מקום כשהיא סגורה. */
var OWN_PICK = null;    /* אינדקס החלק שעבורו בוחרים, או null */
function ownPieceSlidePickOpen(i) {
  ownEditSync_();
  OWN_PICK = i;
  paintOwnPick_();
}
function ownPieceSlidePickClose() {
  OWN_PICK = null;
  var el = $('own-pick');
  if (el) el.className = 'sheet own-pick';
}
function ownPieceSlidePickChoose(fi) {
  if (OWN_PICK == null || !DECK || !DECK.files[fi]) { ownPieceSlidePickClose(); return; }
  OWN_EDIT[OWN_PICK].slide = DECK.files[fi];
  ownPieceSlidePickClose();
  paintOwn();
}
function paintOwnPick_() {
  var el = $('own-pick');
  if (!el || !DECK) return;
  el.innerHTML = '<div class="own-pick-card">' +
    '<div class="own-pick-h"><span>בחירת שקף</span>' +
    '<button id="own-pick-x" aria-label="סגירה">✕</button></div>' +
    '<div class="own-pick-grid">' +
    DECK.files.map(function (f, fi) {
      return '<button class="own-pick-th" onclick="ownPieceSlidePickChoose(' + fi + ')">' +
        '<img src="' + slideSrc(fi + 1) + '" alt="" loading="lazy"><span>' + (fi + 1) + '</span></button>';
    }).join('') +
    '</div></div>';
  el.className = 'sheet own-pick on';
  $('own-pick-x').onclick = ownPieceSlidePickClose;
}

/* ============================================================
   ייצוא הפירוש לכל הדף - טקסט פשוט, מחולק לקטעים וממוספר לפי
   `st.n`, בלי שום תיוג חלק ("פירוש"/"העשרה" וכד') - רק המספר
   שהאדם רואה בדף עצמו והטקסט. להדבקה החוצה: GPT, מסמך, כל
   מקום. קטע עם כמה חלקים - הטקסטים שלהם זה מתחת לזה, באותו
   מספר. קטע בלי טקסט בכלל - מדלגים עליו, לא משאירים מספר ריק.

   הקטע שפתוח כרגע לעריכה נלקח מ-`OWN_EDIT` (מה שעל המסך, גם
   אם עוד לא נשמר) - לא מ-`OWN` (מה שכבר נשמר בגיליון) - אחרת
   ייצוא באמצע כתיבה היה מפספס בדיוק את מה שרואים הרגע. */
function ownStripHtml_(html) {
  var d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
/* ============================================================
   ייצוא גמיש - מה, ואיזה חלק.
   ============================================================
   "תן לי גמישות: רק עמוד א׳ או עמוד ב׳, וכנ"ל בחברותא. ואם אפשר
   - מאיזה קטע עד איזה קטע: אני עומד בדף על נקודה, לוחץ 'תחילת
   הקטע', ממשיך, עוצר ומסמן 'סוף'."

   שלוש שאלות, כל אחת שורת כפתורים: **מה** (פירוש לנוער / חברותא
   / שניהם), **איזה חלק** (כל הדף / עמוד א׳ / עמוד ב׳ / מקטע עד
   קטע). בטווח - שתי רשימות, ולצד כל אחת "הקטע שאני עומד עליו":
   סוגרים, מתקדמים בדף, פותחים שוב ולוחצים על "סוף". הבחירה נשמרת
   כל עוד העמוד פתוח, ומה/איזה חלק - גם לפתיחה הבאה. */
var EXP = { what: 'own', part: 'all', from: 0, to: 0 };
try {
  var expSaved = JSON.parse(localStorage.getItem('df:expPick') || 'null');
  if (expSaved) { EXP.what = expSaved.what || 'own'; EXP.part = expSaved.part === 'range' ? 'all' : (expSaved.part || 'all'); }
} catch (e) {}
function expKeep_() {
  try { localStorage.setItem('df:expPick', JSON.stringify({ what: EXP.what, part: EXP.part })); } catch (e) {}
}
/* החברותא שמורה כ-HTML בפסקאות - לטקסט, פסקה בשורה */
function expChavText_(st) {
  var h = (st.c && st.c.h) || '';
  if (!h && st.c && st.c.text) return String(st.c.text).trim();
  return h.split(/<\/p>/i).map(ownStripHtml_).filter(function (t) { return t; }).join('\n');
}
function expPg_(st) { var pp = PAGES[st.p]; return pp ? pp.pg : 1; }
function expNums_() {
  var out = [], seen = {};
  FLAT.forEach(function (st) { if (!seen[st.n]) { seen[st.n] = 1; out.push(st.n); } });
  return out;
}
function ownExportText_() {
  var seen = {}, blocks = [], lastPg = 0, pgs = {};
  var nums = expNums_();
  var lo = Math.min(EXP.from || nums[0], EXP.to || nums[nums.length - 1]);
  var hi = Math.max(EXP.from || nums[0], EXP.to || nums[nums.length - 1]);
  var pick = FLAT.filter(function (st) {
    if (seen[st.n]) return false;
    if (EXP.part === 'a' && expPg_(st) !== 1) return false;
    if (EXP.part === 'b' && expPg_(st) !== 2) return false;
    if (EXP.part === 'range' && (st.n < lo || st.n > hi)) return false;
    seen[st.n] = 1;
    pgs[expPg_(st)] = 1;
    return true;
  });
  var many = Object.keys(pgs).length > 1;
  pick.forEach(function (st) {
    var parts = [];
    if (EXP.what !== 'own') {
      var ch = expChavText_(st);
      if (ch) parts.push(EXP.what === 'both' ? '[חברותא]\n' + ch : ch);
    }
    if (EXP.what !== 'chav') {
      var pieces = (OWN_EDIT && OWN_EDIT_N === st.n) ? OWN_EDIT : ownPieces_(st.n);
      var texts = pieces.map(function (p) { return ownStripHtml_(p.text); })
        .filter(function (t) { return t; });
      if (texts.length) parts.push(EXP.what === 'both' ? '[פירוש לנוער]\n' + texts.join('\n\n') : texts.join('\n\n'));
    }
    if (!parts.length) return;
    var pg = expPg_(st);
    if (many && pg !== lastPg) blocks.push('- עמוד ' + (pg === 2 ? 'ב׳' : 'א׳') + ' -');
    lastPg = pg;
    blocks.push(st.n + '. ' + parts.join('\n\n'));
  });
  return blocks.join('\n\n');
}
function ownExportOpen() {
  if (OWN_EDIT) ownEditSync_();
  paintOwnExport_();
}
function ownExportClose() {
  var el = $('own-export');
  if (el) el.className = 'sheet own-export';
}
function paintOwnExport_() {
  var el = $('own-export');
  if (!el) return;
  var nums = expNums_();
  var here = (FLAT[IDX] && FLAT[IDX].n) || nums[0] || 1;
  if (!EXP.from) EXP.from = here;
  if (!EXP.to) EXP.to = here;
  var txt = ownExportText_();
  var chip = function (grp, v, label) {
    return '<button class="exp-chip' + (EXP[grp] === v ? ' on' : '') + '" data-g="' + grp +
      '" data-v="' + v + '">' + label + '</button>';
  };
  var opts = function (sel) {
    return nums.map(function (n) {
      return '<option value="' + n + '"' + (n === sel ? ' selected' : '') + '>' + n + '</option>';
    }).join('');
  };
  var none = EXP.what === 'chav' ? 'אין כאן טקסט חברותא לייצא.'
    : 'עדיין אין מה לייצא - לא נכתב פירוש לקטעים שנבחרו.';
  el.innerHTML = '<div class="own-pick-card own-export-card">' +
    '<div class="own-pick-h"><span>ייצוא טקסט</span>' +
    '<button id="own-export-x" aria-label="סגירה">✕</button></div>' +
    '<div class="exp-row"><b>מה</b>' + chip('what', 'own', 'פירוש לנוער') +
      chip('what', 'chav', 'חברותא') + chip('what', 'both', 'שניהם') + '</div>' +
    '<div class="exp-row"><b>איזה</b>' + chip('part', 'all', 'כל הדף') +
      chip('part', 'a', 'עמוד א׳') + chip('part', 'b', 'עמוד ב׳') +
      chip('part', 'range', 'מקטע עד קטע') + '</div>' +
    (EXP.part === 'range'
      ? '<div class="exp-rng">מקטע <select id="exp-from">' + opts(EXP.from) + '</select>' +
        '<button class="exp-here" id="exp-from-here">← הקטע שאני עומד עליו (' + here + ')</button></div>' +
        '<div class="exp-rng">עד קטע <select id="exp-to">' + opts(EXP.to) + '</select>' +
        '<button class="exp-here" id="exp-to-here">← הקטע שאני עומד עליו (' + here + ')</button></div>'
      : '') +
    (txt ? '<textarea id="own-export-ta" readonly></textarea>' +
           '<button class="own-export-copy-btn" id="own-export-copy">העתקה</button>' :
           '<p class="none">' + none + '</p>') +
    '</div>';
  el.className = 'sheet own-export on';
  $('own-export-x').onclick = ownExportClose;
  [].forEach.call(el.querySelectorAll('.exp-chip'), function (b) {
    b.onclick = function () { EXP[b.getAttribute('data-g')] = b.getAttribute('data-v'); expKeep_(); paintOwnExport_(); };
  });
  var fs = $('exp-from'), ts = $('exp-to');
  if (fs) fs.onchange = function () { EXP.from = +fs.value; paintOwnExport_(); };
  if (ts) ts.onchange = function () { EXP.to = +ts.value; paintOwnExport_(); };
  var fh = $('exp-from-here'), th = $('exp-to-here');
  if (fh) fh.onclick = function () { EXP.from = here; paintOwnExport_(); };
  if (th) th.onclick = function () { EXP.to = here; paintOwnExport_(); };
  if (!txt) return;
  var ta = $('own-export-ta');
  ta.value = txt;
  $('own-export-copy').onclick = function () {
    var btn = $('own-export-copy'), ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt);
        ok = true;
      }
    } catch (e) {}
    if (!ok) { try { ta.select(); ok = document.execCommand('copy'); } catch (e2) {} }
    btn.textContent = ok ? 'הועתק ✓' : 'לא הצלחתי - יש להעתיק ידנית מהתיבה';
  };
}