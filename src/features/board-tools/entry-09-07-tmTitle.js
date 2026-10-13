
/* כותרת קצרה לנוסח - השורה הראשונה, או כמה מילים ראשונות.
   הנוסח המלא מוצג רק אחרי שבוחרים בו (בתיבה ובתצוגה המקדימה),
   ולא עשרה גופים מלאים זה מעל זה. */
function tmTitle(t) {
  var s = String(t || '').split('\n')[0].replace(/\s+/g, ' ').trim();
  if (s.length <= 26) return s;
  var cut = s.slice(0, 24), sp = cut.lastIndexOf(' ');
  return (sp > 10 ? cut.slice(0, sp) : cut) + '…';
}
function tmChip(t, attr, on) {
  return '<button class="tm' + (on ? ' on' : '') + '" ' + attr + ' title="' + esc(t) + '">' + esc(tmTitle(t)) + '</button>';
}
function kudoBox(p) {
  if (KUDO_OPEN !== p.id) return '';
  var first = kudoName(p);
  var h = '<div class="kudo-box">';
  if (p.withOk) {
    var to = function (v, k) {
      return '<button class="' + (KUDO_TO === v ? 'on' : '') + '" data-kudo-to="' + v + '">' +
        esc(kt(k)) + '</button>';
    };
    h += '<div class="snd-seg kudo-to">' + to('k', 'kudoToK') + to('p', 'kudoToP') +
      to('pk', 'kudoToB') + '</div>';
  }
  var ktm = kudoTmpls();
  if (ktm.length) h += '<div class="tms">' + ktm.map(function (t, i) {
    return tmChip(t, 'data-kudo-tm="' + i + '"', KUDO_TXT === t);
  }).join('') + '</div>';
  h += '<textarea id="kudo-txt" placeholder="' + esc(kt('kudoPh')) + '">' +
    esc(KUDO_TXT) + '</textarea>' +
    '<div class="pv" id="kudo-pv"></div>' +
    '<button class="go" id="kudo-go"' + (KUDO_BUSY ? ' disabled' : '') + '>' +
    esc(tp(kt('kudoGo'), { first: first })) + '</button>' +
    '<div class="s">' + esc(KUDO_ERR || kt('kudoNote')) + '</div></div>';
  return h;
}
/* השם בפנייה - של התלמיד, של ההורה, או של שניהם. */
function kudoName(p) {
  if (!p.withOk || KUDO_TO === 'k') return p.first || '';
  if (KUDO_TO === 'p') return p['with'] || '';
  return (p.first || '') + ' ו' + (p['with'] || '');
}
function kudoPv(first) {
  var el = $('kudo-pv'); if (!el) return;
  var t = (KUDO_TXT || '').trim();
  el.innerHTML = t ? '<b>' + esc(kudoSig()) + '</b><br>' + esc(first) + ', ' + esc(t) : '';
  var g = $('kudo-go'); if (g) g.disabled = KUDO_BUSY || t.length < 2;
}
function kudoWire() {
  var body = $('body');
  if (!body || body.getAttribute('data-kw')) return;
  body.setAttribute('data-kw', '1');
  body.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest && t.closest('[data-kudo]'))) {
      var id = b.getAttribute('data-kudo');
      KUDO_OPEN = KUDO_OPEN === id ? '' : id; KUDO_TXT = ''; KUDO_ERR = '';
      var kp = kudoWho();
      KUDO_TO = ALL && !kp.push && kp.parPush ? 'p' : 'k';
      draw(); return;
    }
    if ((b = t.closest && t.closest('[data-kudo-to]'))) {
      KUDO_TO = b.getAttribute('data-kudo-to'); draw(); return;
    }
    if ((b = t.closest && t.closest('[data-kudo-tm]'))) {
      KUDO_TXT = kudoTmpls()[+b.getAttribute('data-kudo-tm')] || KUDO_TXT;
      var ta = $('kudo-txt'); if (ta) ta.value = KUDO_TXT;
      [].forEach.call(document.querySelectorAll('[data-kudo-tm]'), function (x) { x.classList.toggle('on', x === b); });
      kudoPv(kudoName(kudoWho())); return;
    }
    if (t.id === 'kudo-go') kudoSend();
  });
  body.addEventListener('input', function (e) {
    if (e.target.id !== 'kudo-txt') return;
    KUDO_TXT = e.target.value; kudoPv(kudoName(kudoWho()));
  });
}
function kudoWho() {
  var r = (roster || []).filter(function (p) { return p.id === KUDO_OPEN; })[0];
  return r || {};
}
function kudoSend() {
  var p = kudoWho(), txt = (KUDO_TXT || '').trim();
  if (!p.id || txt.length < 2 || KUDO_BUSY) return;
  if (!confirm(kt('kudoAsk').replace('{name}', kudoName(p)))) return;
  KUDO_BUSY = true; KUDO_ERR = ''; draw();
  var par = p.withOk && KUDO_TO !== 'k' ? KUDO_TO : '';
  var ids = (p.ids && p.ids.length ? p.ids : [p.id]).slice(0, 60);
  askScript(ALL
    ? { fire:'say', key:acc, title:kudoSig(), body:'{name}, ' + txt, who:'רכז',
        role: par ? '' : 'תלמיד',
        flt: JSON.stringify(par ? { ids:ids, per:1, par:par } : { ids:ids, per:1 }) }
    : { fire:'say', inst:code, k:acc, dev:devId(), title:kudoSig(), body:'{name}, ' + txt,
        grade:'', klass:'', who:kudoSig(),
        aud: par === 'p' ? 'parents' : par === 'pk' ? 'both' : 'kids',
        flt: JSON.stringify({ ids:[p.id], per:1 }) })
    .then(function (d) {
      KUDO_BUSY = false;
      if (d && d.status === 'ok') { KUDO_SENT[p.id] = 1; KUDO_OPEN = ''; KUDO_TXT = ''; }
      else KUDO_ERR = kt('kudoErr') + ' ' + ((d && d.message) || '');
      draw();
    });
}
/* הנוסחים המוכנים - מהמטמון מיד (אם המכשיר ביקר במסך הבית),
   ומהגיליון ברקע. `headers=1` - ראו tmplLoad ב-/management. */
function kudoLoadTmpl() {
  var id = (LGet('cfg', {}) || {}).sheetId || SHEET_ID;
  if (!id || !navigator.onLine) return;
  fetch('https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv&sheet=' +
        encodeURIComponent('נוסחים') + '&headers=1&t=' + Date.now())
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) {
      if (!t) return;
      var rows = csv(t);
      if (!rows.length || rows[0].join('|').indexOf('קטגוריה') < 0) return;
      var out = [];
      rows.slice(1).forEach(function (r) {
        var c = String(r[0] || '').trim(), x = String(r[1] || '').trim();
        if (c && x) out.push({ cat: c, text: x });
      });
      try { localStorage.setItem('df:tmplCache', JSON.stringify(out)); } catch (e) {}
    }).catch(function () {});
}

/* ============================================================
   השער: בלי קוד אין שמות.
   ============================================================
   נאמר פעם אחת, בשקט, ובמקום אחד - כאן. קודם אותו דבר נאמר
   גם בכרטיס התקציר שבאפליקציה, ושם הוא אף החליף את הכפתור
   שמוביל לכאן: אזהרה על מסך שהאדם עוד לא ראה.

   ובלי להסביר מנגנון. "הקוד מוטמע בקישור האישי שנשלח אליכם"
   הוא משפט נכון שאינו אומר לאיש מה לעשות - ומי שקורא אותו הוא
   בדרך כלל האדם שהלוח שייך לו.
   ============================================================ */

/* ============================================================
   שליחת הודעה - בכל הישיבות, לרכז בלבד.
   ============================================================
   "תן לי את אותו יתרון בדיוק" של "מילה לתלמידים" אצל ראש
   החטיבה: תלמידים או הורים · כולם / סיימו / עוד לא סיימו את הדף
   של השבוע · דרך לימוד · שכבה · פנייה בשם · חתימה · תצוגה.
   **הקהל הוא מה שנבחר בשורה העליונה של הלוח** - כל הישיבות,
   ישיבה אחת, או "ללא ישיבה". ובנוסף - סימון של תלמידים מסוימים
   מהרשימה.

   המספר ליד הכפתור נספר מהרשימה עצמה: כמה נרשמו בקבוצה, וכמה
   מהם אישרו התראות (רק הם יקבלו). "ללא ישיבה" ובחירה ידנית
   נשלחים לפי מזהים - עד 60 בבת אחת, כמו שהשרת מקבל.
   ============================================================ */
var SELMODE = false, SEL = {};
var SND = { open:false, aud:'kids', seg:'', way:'', grade:'', per:true, txt:'', busy:false, msg:'', ok:false };
var SND_WAYS = [['', 'כל דרכי הלימוד'], ['לימוד עצמי', 'לבד'],
                ['חבורת לימוד', 'בחבורה'], ['אבות ובנים', 'אב ובן']];
function sndWeek() {
  var wk = LWeek();
  if (wk < 0) return null;
  var tr = TRACKS[0].id;
  try { var t = localStorage.getItem('dfHomeTrack');
        for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === t) tr = t; } catch (e) {}
  var d = LDafName(tr, wk);
  return d ? { wk: wk + 1, daf: d } : null;
}
/* אחרי עדכון: הבחירה נשארת, חוץ ממי שכבר אינו ברשימה (נמחק,
   הועבר לארכיון) - אחרת "נבחרו 5" סופר גם אותו. */
function selPrune() {
  var have = {};
  (rosterAll || []).forEach(function (p) { have[p.id] = 1; });
  for (var k in SEL) if (SEL[k] && !have[k]) delete SEL[k];
}
function selIds() { var o = []; for (var k in SEL) if (SEL[k]) o.push(k); return o; }
/* התלמידים שיקבלו - לפי כל מה שנבחר. */
function sndList() {
  var base = rosterAll || [];
  var sel = selIds();
  if (sel.length) return base.filter(function (p) { return SEL[p.id]; });
  return base.filter(function (p) {
    if (FILT && instOfP(p) !== FILT) return false;
    if (SND.way && (p.way || '') !== SND.way) return false;
    if (SND.grade && (p.grade || '') !== SND.grade) return false;
    if (SND.seg === 'done' && !didWeek(p)) return false;
    if (SND.seg === 'todo' && didWeek(p)) return false;
    return true;
  });
}
/* בלי שום צמצום מלבד הישיבה - השרת מוסיף גם הורים שלא חוברו. */
function sndPlain() {
  return !selIds().length && FILT !== '-' && !SND.seg && !SND.way && !SND.grade;
}
function sndGrades() {
  var g = {};
  (rosterAll || []).forEach(function (p) {
    if (FILT && FILT !== '-' && instOfP(p) === FILT && p.grade) g[p.grade] = 1;
  });
  return Object.keys(g).sort();
}
function sndToLabel() {
  var sel = selIds().length, bits = [];
  bits.push(kt(SND.aud === 'parents' ? 'sayAudParS' : SND.aud === 'both' ? 'sayAudBoth' : 'sayAudKids'));
  if (sel) { bits.push(sel + ' שנבחרו'); return bits.join(' · '); }
  bits.push(!FILT ? 'כל הישיבות' : FILT === '-' ? 'ללא ישיבה' : instLbl({ inst: FILT }));
  var w = sndWeek();
  if (SND.seg === 'done') bits.push('סיימו את דף ' + (w ? w.daf : ''));
  if (SND.seg === 'todo') bits.push('עוד לא סיימו את דף ' + (w ? w.daf : ''));
  SND_WAYS.forEach(function (x) { if (x[0] && x[0] === SND.way) bits.push(x[1]); });
  if (SND.grade) bits.push('שכבה ' + SND.grade);
  return bits.join(' · ');
}
function sendHtml() {
  if (!ALL || !rosterAll) return '';
  var sel = selIds().length;
  if (!SND.open) {
    return '<button class="snd-open" data-snd="open">✉ שליחת הודעה' +
      (sel ? ' · ' + sel + ' נבחרו' : '') + '</button>';
  }
  var kids = SND.aud === 'kids', w = sndWeek();
  var seg = function (on, label, act) {
    return '<button class="' + (on ? 'on' : '') + '" data-snd="' + act + '">' + esc(label) + '</button>';
  };
  var list = sndList(), pushN = list.filter(function (p) { return p.push; }).length;
  var parL = list.filter(function (p) { return p.withOk; });
  var parPushN = parL.filter(function (p) { return p.parPush; }).length;
  var h = '<div class="card snd"><div class="snd-h"><b>שליחת הודעה</b>' +
    '<button class="snd-x" data-snd="close" aria-label="סגירה">✕</button></div>';
  h += '<div class="snd-row"><span>למי</span><div class="snd-seg">' +
    seg(kids, kt('sayAudKids'), 'aud:kids') + seg(SND.aud === 'parents', kt('sayAudParS'), 'aud:parents') +
    seg(SND.aud === 'both', kt('sayAudBoth'), 'aud:both') + '</div></div>';
  if (sel) {
    h += '<div class="snd-note">נבחרו ' + sel + ' מהרשימה. ' +
      '<button class="klink" data-snd="clear">ניקוי הבחירה</button></div>';
  } else {
    if (w) {
      h += '<div class="snd-row"><span>מי מהם</span><div class="snd-seg">' +
        seg(!SND.seg, 'כולם', 'seg:') + seg(SND.seg === 'done', 'סיימו', 'seg:done') +
        seg(SND.seg === 'todo', 'עוד לא', 'seg:todo') + '</div></div>';
    }
    h += '<div class="snd-sel"><select id="snd-way">' + SND_WAYS.map(function (x) {
      return '<option value="' + esc(x[0]) + '"' + (SND.way === x[0] ? ' selected' : '') + '>' +
        esc(x[1]) + '</option>';
    }).join('') + '</select>';
    var gr = sndGrades();
    if (gr.length > 1) {
      h += '<select id="snd-grade"><option value="">כל השכבות</option>' + gr.map(function (g) {
        return '<option value="' + esc(g) + '"' + (SND.grade === g ? ' selected' : '') + '>שכבה ' +
          esc(g) + '</option>';
      }).join('') + '</select>';
    }
    h += '</div>';
  }
  h += '<button class="klink" data-snd="selmode" style="margin:2px 0 8px">' +
    (SELMODE ? 'סיום הבחירה' : 'בחירת תלמידים מסוימים מהרשימה') + '</button>';
  var tm = kudoTmpls();
  if (tm.length) {
    h += '<div class="snd-tm tms">' + tm.map(function (t, i) {
      return tmChip(t, 'data-snd="tm:' + i + '"', SND.txt === t);
    }).join('') + '</div>';
  }
  h += '<textarea id="snd-txt" rows="3" placeholder="מה תרצו לומר?">' + esc(SND.txt) + '</textarea>' +
    '<label class="snd-per"><input type="checkbox" id="snd-per"' + (SND.per ? ' checked' : '') +
    '> לפנות לכל אחד בשמו</label>' +
    '<div class="snd-pv" id="snd-pv"></div>';
  h += '<div class="snd-sum"><b>יישלח ל:</b> ' + esc(sndToLabel()) +
    (kids ? '<br><b>' + list.length + '</b> תלמידים · <b>' + pushN + '</b> מהם עם התראות - רק הם יקבלו' :
     SND.aud === 'parents' ? '<br><b>' + parL.length + '</b> הורים מחוברים · <b>' + parPushN +
       '</b> מהם עם התראות' + (sndPlain() ? ' · ועוד הורים שנרשמו בלי חיבור לבן' : '') :
     '<br><b>' + list.length + '</b> תלמידים (<b>' + pushN + '</b> עם התראות) · <b>' + parL.length +
       '</b> הורים מחוברים (<b>' + parPushN + '</b> עם התראות)') +
    '</div>' +
    '<button class="snd-go" id="snd-go"' + (SND.busy || SND.txt.trim().length < 2 ? ' disabled' : '') + '>' +
    (SND.busy ? 'שולח…' : 'שליחה') + '</button>' +
    (SND.msg ? '<div class="snd-msg' + (SND.ok ? ' ok' : '') + '">' + esc(SND.msg) + '</div>' : '') +
    '</div>';
  return h;
}
