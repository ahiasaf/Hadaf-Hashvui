/* מודעת זוכה — המנוע (8.99.421; קובץ משותף מ-8.99.556): index.html (ההגרלה בניהול) ו-zochim.html (מסך הזוכים לרכז).
   adMake(o, file, done) — done נקרא כשהתמונה נשלחה בחלון השיתוף או נשמרה. ES5 בלבד. */
function adFillT(t, v) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
/* ============================================================
   מודעת זוכה (8.99.421) — תמונה שהרכז מפיק בלחיצה ומפיץ בעצמו.
   ============================================================
   נבנית במכשיר מתוך מה שכבר במסך (שם מלא, מוסד, פרס) — שום דבר
   לא נשלח לשרת ולתלמידים. הלוגו של המוסד: inst-logos/<קוד>.png;
   חסר — המודעה יוצאת בלעדיו. הסמל של הדף האינטראקטיבי (weekpics/phone.webp, כמו בכרטיס שלו)
   — רק כשכל הזוכים במודעה למדו באפליקציה (לא רשומים מנוכחות בלבד).
   שולחן של חבר מביא חבר — מודעה אחת לארבעה. */
var AD_W = 1080, AD_F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', AD_CUR = null;
function adImg(src) {
  return new Promise(function (ok) {
    var i = new Image();
    i.onload = function () { ok(i); };
    i.onerror = function () { ok(null); };
    i.src = src;
  });
}
function adFont(ctx, px, b) { ctx.font = (b ? 'bold ' : '') + px + 'px ' + AD_F; }
function adWrap(ctx, t, max) {
  var w = String(t || '').split(/\s+/), out = [], cur = '';
  w.forEach(function (x) {
    if (!x) return;
    var n = cur ? cur + ' ' + x : x;
    if (cur && ctx.measureText(n).width > max) { out.push(cur); cur = x; } else cur = n;
  });
  if (cur) out.push(cur);
  return out;
}
function adRound(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function adContain(ctx, img, x, y, w, h) {
  var s = Math.min(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}
function adStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
}
/* o: { ppl: [{ name, code, inst, app }], won, prize, pk } → canvas.
   כל הזוכים במודעה מאותו מוסד (החלטת אחיאסף) — לוגו אחד ושורה אחת.
   בתחתית — "הסצנה": הטלפון של הדף האינטראקטיבי לצד האיור של הפרס,
   באותה מסגרת, בלי חץ ובלי מלל שמחבר ביניהם (8.99.423). */
function adDraw(o, im) {
  var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  var W = AD_W, cx = W / 2, CW = 860, P0 = o.ppl[0];
  var logo = im.logo[P0.code] || null;
  var app = o.ppl.every(function (p) { return p.app; }) && im.app;
  var many = o.ppl.length > 1;
  /* שני מעברים: מדידה (בלי ציור) ואז ציור בגובה שנמדד. */
  var run = function (draw) {
    var y, t = function (txt, px, b, color, lh) {
      adFont(ctx, px, b);
      adWrap(ctx, txt, CW).forEach(function (ln) {
        y += lh;
        if (draw) { ctx.fillStyle = color; ctx.fillText(ln, cx, y); }
      });
    };
    if (draw) {
      ctx.textAlign = 'center';
      try { ctx.direction = 'rtl'; } catch (e) {}
      ctx.fillStyle = '#F6F1E6'; ctx.fillRect(0, 0, W, cv.height);
      var g = ctx.createLinearGradient(0, 0, 0, 440);
      g.addColorStop(0, '#2A6BD8'); g.addColorStop(1, '#0B2550');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 440);
      /* הלוגו של התוכנית: הסמל העגול בעיגול לבן, ולצידו השם והשנה. */
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W - 140, 130, 74, 0, Math.PI * 2); ctx.fill();
      if (im.mark) adContain(ctx, im.mark, W - 140 - 52, 130 - 50, 104, 100);
      ctx.textAlign = 'right';
      adFont(ctx, 56, true); ctx.fillStyle = '#fff'; ctx.fillText(UI.adBrand1, W - 240, 122);
      adFont(ctx, 36, false); ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText(UI.adBrand2 + ' · ' + PROGRAM.year, W - 240, 172);
      ctx.textAlign = 'center';
      var tt = many ? UI.adTitleN : UI.adTitle1;
      adFont(ctx, 100, true); ctx.fillStyle = '#fff'; ctx.fillText(tt, cx, 330);
      var tw = ctx.measureText(tt).width;
      ctx.fillStyle = '#F2C14E'; adStar(ctx, cx + tw / 2 + 56, 296, 34);
    }
    var top = 400;
    y = top + 60;
    if (draw) {
      ctx.save(); ctx.shadowColor = 'rgba(27,42,69,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#fff'; adRound(ctx, 60, top, W - 120, cv.height - top - 60, 36); ctx.fill(); ctx.restore();
    }
    if (logo) {
      var bs = 260;
      if (draw) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#E7E1D3'; ctx.lineWidth = 3;
        adRound(ctx, cx - bs / 2, y, bs, bs, 28); ctx.fill(); ctx.stroke();
        adContain(ctx, logo, cx - bs / 2 + bs * 0.08, y + bs * 0.08, bs * 0.84, bs * 0.84);
      }
      y += bs + 30;
    }
    t(UI.adHi, 52, false, '#1B2A45', 64);
    y += 6;
    o.ppl.forEach(function (p) { t(p.name, o.ppl.length > 2 ? 66 : 80, true, '#B07A12', o.ppl.length > 2 ? 80 : 96); });
    y += 34;
    if (draw) { ctx.fillStyle = '#D9A63A'; ctx.fillRect(cx - 70, y - 4, 140, 6); }
    y += 18;
    t(adFillT(many ? UI.adStuN : UI.adStu, { inst: P0.inst }), 42, false, '#5A6780', 56);
    t(o.won, 42, false, '#1B2A45', 58);
    /* הסצנה: הטלפון (ימין) והפרס (שמאל), במסגרת אחת. */
    var hasP = !!(o.prize || im.prz);
    if (hasP || app) {
      y += 44;
      var pad = 34, IW = CW - pad * 2, sy = y, right = cx + IW / 2;
      var phH = 290, phW = app ? Math.round(phH * im.app.width / im.app.height) : 0, gap = app ? 46 : 0;
      var pw = hasP ? (app ? IW - phW - gap : Math.min(IW, 700)) : 0;
      if (!hasP) right = cx + phW / 2;
      var pih = im.prz ? Math.round(pw * im.prz.height / im.prz.width) : 0;
      /* הפרס: השם בולט, והרשת (אחרי " · ") בשורה משלה, קטנה יותר. */
      var pl = [];
      String(o.prize || '').split(' · ').forEach(function (part, i) {
        adFont(ctx, i ? 34 : 44, !i);
        adWrap(ctx, part, pw).forEach(function (ln) { pl.push({ t: ln, f: i ? 34 : 44, b: !i, h: i ? 46 : 56 }); });
      });
      var plH = 0;
      pl.forEach(function (l) { plH += l.h; });
      var prH = pih + (pl.length ? (pih ? 22 : 0) + plH : 0);
      var apH = app ? phH : 0;
      var inner = Math.max(prH, apH), bh = inner + pad * 2;
      if (draw) {
        ctx.fillStyle = '#FFF6E0'; adRound(ctx, cx - CW / 2, sy, CW, bh, 30); ctx.fill();
        if (app) {
          var ay = sy + pad + (inner - apH) / 2;
          /* הרקע הלבן של התמונה נבלע ברקע המסגרת. */
          ctx.save(); ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(im.app, right - phW, ay, phW, phH); ctx.restore();
        }
        if (hasP) {
          var px = app ? right - phW - gap - pw / 2 : cx, py = sy + pad + (inner - prH) / 2;
          if (im.prz) {
            ctx.save(); adRound(ctx, px - pw / 2, py, pw, pih, 22); ctx.clip();
            ctx.drawImage(im.prz, px - pw / 2, py, pw, pih); ctx.restore();
          }
          var ly = py + pih + (pih ? 22 : 0);
          pl.forEach(function (l) {
            ly += l.h; adFont(ctx, l.f, l.b); ctx.fillStyle = l.b ? '#8C681F' : '#5A6780';
            ctx.fillText(l.t, px, ly - (l.h - l.f) / 2 - 4);
          });
        }
      }
      y = sy + bh;
    }
    return y + 70 + 60;
  };
  cv.width = W; cv.height = 2400;
  var h = run(false);
  cv.height = Math.max(1080, Math.ceil(h));
  run(true);
  return cv;
}
function adMake(o, file, done) {
  var c0 = o.ppl[0].code || '';
  var load = [adImg(LOGO_MARK), adImg('weekpics/phone.webp'),
              o.pk ? adImg('promo/prz-' + o.pk + '.jpg') : Promise.resolve(null),
              c0 ? adImg('inst-logos/' + encodeURIComponent(c0) + '.png') : Promise.resolve(null)];
  Promise.all(load).then(function (r) {
    var im = { mark: r[0], app: r[1], prz: r[2], logo: {} };
    if (r[3]) im.logo[c0] = r[3];
    var cv = adDraw(o, im);
    var url = cv.toDataURL('image/png');
    AD_CUR = { url: url, name: file + '.png', blob: null, done: done || null };
    if (cv.toBlob) cv.toBlob(function (b) { if (AD_CUR && AD_CUR.url === url) AD_CUR.blob = b; }, 'image/png');
    adShow();
  }).catch(function () { SayMsg(UI.adFail); });
}
function adShow() {
  var el = document.getElementById('adv');
  if (!el) { el = document.createElement('div'); el.id = 'adv'; document.body.appendChild(el); }
  el.innerHTML = '<div class="adv-in"><button class="adv-x" type="button" onclick="adClose()" aria-label="' + esc(UI.adClose) + '">✕</button>' +
    '<img alt="" src="' + AD_CUR.url + '">' +
    '<button class="btn p" type="button" onclick="adSend()">' + esc(UI.adSend) + '</button>' +
    '<button class="btn g" type="button" style="margin-top:8px" onclick="adSave()">' + esc(UI.adSave) + '</button></div>';
  el.style.display = 'flex';
}
function adClose() { var el = document.getElementById('adv'); if (el) { el.style.display = 'none'; el.innerHTML = ''; } AD_CUR = null; }
function adSave() {
  if (!AD_CUR) return;
  var a = document.createElement('a');
  a.href = AD_CUR.blob && window.URL ? URL.createObjectURL(AD_CUR.blob) : AD_CUR.url;
  a.download = AD_CUR.name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (AD_CUR.done) AD_CUR.done();
}
/* שליחה — חלון השיתוף של הטלפון (וואטסאפ וכו'); בלי תמיכה — שמירה. */
function adSend() {
  if (!AD_CUR) return;
  var f = null;
  try { if (AD_CUR.blob && window.File) f = new File([AD_CUR.blob], AD_CUR.name, { type: 'image/png' }); } catch (e) {}
  if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
    var dn = AD_CUR.done;
    navigator.share({ files: [f] }).then(function () { if (dn) dn(); }, function () {});
    return;
  }
  adSave();
}
