/* ============================================================
   QR — קוד סריקה, בלי ספרייה חיצונית.
   ============================================================
   למה כאן ולא מספרייה: אין בפרויקט הזה שלב בנייה ואין CDN, וכל
   מה שהדפדפן מקבל יושב בריפו. קוד QR הוא אלגוריתם סגור ומוגדר
   היטב — לא משהו שמשתנה — ולכן מאתיים שורות כאן עדיפות על תלות
   חיצונית שצריך לתחזק ושיכולה ליפול ביום שבו הכי צריך אותה.

   **מה נתמך:** מצב בייטים (כתובת היא ASCII), רמת תיקון M,
   גרסאות 1 עד 10 — עד 216 תווים, פי כמה ממה שכתובת דורשת.
   מעבר לזה מוחזר `null`, והמסך פשוט לא מציג קוד.

   **איך נבדק:** מול segno, מימוש עצמאי בפייתון. המטריצה
   שנוצרת כאן הושוותה מודול־מודול לזו שלו על עשרות מחרוזות,
   כולל גבולות המעבר בין גרסאות. ראו `scratchpad/qr-test.py`.
   ============================================================ */
var QR = (function () {

  /* ---------- שדה גלואה GF(256), פולינום 0x11D ---------- */
  var EXP = [], LOG = [];
  (function () {
    var x = 1, i;
    for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 285; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* פולינום יוצר למספר נתון של בתי תיקון: מכפלת (x + α^i) */
  function genPoly(n) {
    var g = [1], i, j;
    for (i = 0; i < n; i++) {
      var ng = [], L = g.length + 1;
      for (j = 0; j < L; j++) ng[j] = 0;
      for (j = 0; j < g.length; j++) {
        ng[j]     ^= g[j];                  /* ×x   */
        ng[j + 1] ^= mul(g[j], EXP[i]);     /* ×α^i */
      }
      g = ng;
    }
    return g;
  }

  /* שארית החלוקה — בתי התיקון של בלוק אחד */
  function ecBytes(data, n) {
    var g = genPoly(n), res = data.slice(), i, j;
    for (i = 0; i < n; i++) res.push(0);
    for (i = 0; i < data.length; i++) {
      var f = res[i];
      if (f) for (j = 1; j < g.length; j++) res[i + j] ^= mul(g[j], f);
    }
    return res.slice(data.length);
  }

  /* ---------- טבלאות רמה M, גרסאות 1..10 ----------
     כל קבוצה: [בתי תיקון לבלוק, מספר בלוקים, בתי מידע לבלוק].
     נשלפו מהתקן דרך segno ולא נכתבו מהזיכרון — טעות של בית אחד
     כאן מייצרת קוד שנראה תקין ואינו נסרק. */
  var ECC = {
    1:  [[10, 1, 16]],
    2:  [[16, 1, 28]],
    3:  [[26, 1, 44]],
    4:  [[18, 2, 32]],
    5:  [[24, 2, 43]],
    6:  [[16, 4, 27]],
    7:  [[18, 4, 31]],
    8:  [[22, 2, 38], [22, 2, 39]],
    9:  [[22, 3, 36], [22, 2, 37]],
    10: [[26, 4, 43], [26, 1, 44]]
  };
  /* מרכזי תבניות היישור, מגרסה 2 ואילך */
  var ALIGN = {
    2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34],
    7:[6,22,38], 8:[6,24,42], 9:[6,26,46], 10:[6,28,50]
  };
  function dataWords(v) {
    var n = 0, g = ECC[v];
    for (var i = 0; i < g.length; i++) n += g[i][1] * g[i][2];
    return n;
  }

  /* ---------- אריזת הביטים ---------- */
  function encode(bytes, v) {
    var bits = [], i, j;
    var push = function (val, len) {
      for (var k = len - 1; k >= 0; k--) bits.push((val >> k) & 1);
    };
    push(4, 4);                                  /* מצב בייטים */
    push(bytes.length, v < 10 ? 8 : 16);         /* אורך */
    for (i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var cap = dataWords(v) * 8;
    for (i = 0; i < 4 && bits.length < cap; i++) bits.push(0);   /* סיום */
    while (bits.length % 8) bits.push(0);
    var pad = [236, 17], p = 0;
    while (bits.length < cap) { push(pad[p], 8); p ^= 1; }

    var words = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      words.push(b);
    }
    return words;
  }

  /* ---------- בלוקים ושזירה ---------- */
  function weave(words, v) {
    var groups = ECC[v], dat = [], ecc = [], at = 0, i, j, k;
    for (i = 0; i < groups.length; i++) {
      var nEc = groups[i][0], nBlk = groups[i][1], nDat = groups[i][2];
      for (j = 0; j < nBlk; j++) {
        var blk = words.slice(at, at + nDat);
        at += nDat;
        dat.push(blk);
        ecc.push(ecBytes(blk, nEc));
      }
    }
    var out = [], max = 0;
    for (i = 0; i < dat.length; i++) if (dat[i].length > max) max = dat[i].length;
    for (i = 0; i < max; i++)
      for (j = 0; j < dat.length; j++) if (i < dat[j].length) out.push(dat[j][i]);
    max = 0;
    for (i = 0; i < ecc.length; i++) if (ecc[i].length > max) max = ecc[i].length;
    for (i = 0; i < max; i++)
      for (j = 0; j < ecc.length; j++) if (i < ecc[j].length) out.push(ecc[j][i]);
    return out;
  }

  /* ---------- תבניות הקבע ---------- */
  function frame(v) {
    var n = 17 + 4 * v, m = [], res = [], r, c;
    for (r = 0; r < n; r++) {
      m[r] = []; res[r] = [];
      for (c = 0; c < n; c++) { m[r][c] = 0; res[r][c] = 0; }
    }
    var box = function (r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var y = r0 + r, x = c0 + c;
        if (y < 0 || x < 0 || y >= n || x >= n) continue;
        var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        m[y][x] = on ? 1 : 0; res[y][x] = 1;
      }
    };
    box(0, 0); box(0, n - 7); box(n - 7, 0);

    for (c = 8; c < n - 8; c++) {                /* תזמון */
      m[6][c] = (c % 2 === 0) ? 1 : 0; res[6][c] = 1;
      m[c][6] = (c % 2 === 0) ? 1 : 0; res[c][6] = 1;
    }
    var ap = ALIGN[v] || [];
    for (var i = 0; i < ap.length; i++) for (var j = 0; j < ap.length; j++) {
      var ay = ap[i], ax = ap[j];
      /* לא על גבי תבנית איתור */
      if ((ay <= 8 && ax <= 8) || (ay <= 8 && ax >= n - 9) || (ay >= n - 9 && ax <= 8)) continue;
      for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++) {
        var on2 = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0));
        m[ay + r][ax + c] = on2 ? 1 : 0; res[ay + r][ax + c] = 1;
      }
    }
    m[n - 8][8] = 1; res[n - 8][8] = 1;          /* המודול הכהה */

    for (i = 0; i <= 8; i++) {                   /* מקום למידע הפורמט */
      if (i !== 6) { res[8][i] = 1; res[i][8] = 1; }
    }
    for (i = 0; i < 8; i++) { res[8][n - 1 - i] = 1; res[n - 1 - i][8] = 1; }

    if (v >= 7) {                                /* מידע הגרסה */
      var bch = v << 12, gp = 0x1F25;
      for (i = 5; i >= 0; i--) if (bch & (1 << (i + 12))) bch ^= gp << i;
      bch = (v << 12) | bch;
      for (i = 0; i < 18; i++) {
        var bit = (bch >> i) & 1;
        var y2 = Math.floor(i / 3), x2 = n - 11 + (i % 3);
        m[y2][x2] = bit; res[y2][x2] = 1;
        m[x2][y2] = bit; res[x2][y2] = 1;
      }
    }
    return { n:n, m:m, res:res };
  }

  /* ---------- פריסת המידע, זיגזג משמאל־למטה ---------- */
  function place(F, words) {
    var n = F.n, m = F.m, res = F.res, bit = 0, total = words.length * 8;
    var get = function () {
      if (bit >= total) return 0;
      var b = (words[bit >> 3] >> (7 - (bit & 7))) & 1;
      bit++;
      return b;
    };
    var up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;                      /* עמודת התזמון נדלגת */
      for (var i = 0; i < n; i++) {
        var row = up ? n - 1 - i : i;
        for (var k = 0; k < 2; k++) {
          var c = col - k;
          if (res[row][c]) continue;
          m[row][c] = get();
        }
      }
      up = !up;
    }
  }

  function maskAt(k, r, c) {
    switch (k) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return (r * c) % 2 + (r * c) % 3 === 0;
      case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
      default: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
    }
  }

  /* מידע הפורמט: רמה M (00) + מסכה, BCH(15,5), XOR 0x5412 */
  function fmtBits(k) {
    var d = (0 << 3) | k, bch = d << 10, i;
    for (i = 4; i >= 0; i--) if (bch & (1 << (i + 10))) bch ^= 0x537 << i;
    return ((d << 10) | bch) ^ 0x5412;
  }
  function putFmt(F, k) {
    var n = F.n, m = F.m, f = fmtBits(k), i, b;
    for (i = 0; i < 15; i++) {
      b = (f >> i) & 1;
      if (i < 6)       m[i][8] = b;
      else if (i < 8)  m[i + 1][8] = b;
      else if (i === 8) m[8][7] = b;
      else              m[8][14 - i] = b;

      if (i < 8)  m[8][n - 1 - i] = b;
      else        m[n - 15 + i][8] = b;
    }
  }

  /* ---------- ניקוד המסכות ----------
     ארבעת הכללים של התקן (ISO/IEC 18004, טבלה 11). הבחירה בין
     שמונה המסכות נעשית לפיהם, ולכן טעות כאן אינה שוברת את הקוד
     אלא בוחרת מסכה גרועה יותר — קוד שנסרק פחות טוב בתאורה
     גרועה, בלי שום סימן שמשהו לא בסדר.

     כלל 3 הוא המקום שבו קל לטעות: מחפשים את **הגרעין**
     `1011101`, ואז בודקים שיש ארבעה מודולים בהירים לפניו **או**
     אחריו — או שהוא נוגע בקצה. מימוש שמחפש את התבנית המלאה בת
     11 המודולים מפספס בדיוק את המקרים שבקצוות. */
  function n3Line(seq, n) {
    var pat = [1,0,1,1,1,0,1], count = 0, idx, off, i, j, ok;
    var find = function (from) {
      for (var a = from; a + 7 <= n; a++) {
        for (var b = 0; b < 7; b++) if (seq[a + b] !== pat[b]) break;
        if (b === 7) return a;
      }
      return -1;
    };
    var light = function (a, b) {
      if (a < 0) a = 0;
      if (b > n) b = n;
      for (var i2 = a; i2 < b; i2++) if (seq[i2]) return false;
      return true;
    };
    idx = find(0);
    while (idx !== -1) {
      off = idx + 7;
      if (idx === 0 || idx === n - 7 || light(idx - 4, idx) || light(off, off + 4)) count += 40;
      else off = idx + 4;
      idx = find(off);
    }
    return count;
  }

  function penalty(m, n) {
    var p = 0, r, c, run, last, dark = 0, col = [];

    for (r = 0; r < n; r++) {                    /* כלל 1 — שורות */
      run = 1; last = -1;
      for (c = 0; c < n; c++) {
        if (m[r][c] === last) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else { last = m[r][c]; run = 1; }
        if (m[r][c]) dark++;
      }
    }
    for (c = 0; c < n; c++) {                    /* כלל 1 — עמודות */
      run = 1; last = -1;
      for (r = 0; r < n; r++) {
        if (m[r][c] === last) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else { last = m[r][c]; run = 1; }
      }
    }
    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++)   /* כלל 2 */
      if (m[r][c] === m[r][c+1] && m[r][c] === m[r+1][c] && m[r][c] === m[r+1][c+1]) p += 3;

    for (r = 0; r < n; r++) p += n3Line(m[r], n);              /* כלל 3 */
    for (c = 0; c < n; c++) {
      for (r = 0; r < n; r++) col[r] = m[r][c];
      p += n3Line(col, n);
    }
    p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;   /* כלל 4 */
    return p;
  }

  /* ---------- הרכבה ---------- */
  function bytesOf(text) {
    var s = unescape(encodeURIComponent(String(text))), out = [], i;
    for (i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 255);
    return out;
  }

  /* `force` — מסכה קבועה במקום הבחירה. קיים כדי שאפשר יהיה
     להשוות מודול־מודול מול מימוש ייחוס, שלב אחרי שלב. */
  function make(text, force) {
    var bytes = bytesOf(text), v, need;
    for (v = 1; v <= 10; v++) {
      need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (need <= dataWords(v) * 8) break;
    }
    if (v > 10) return null;                     /* ארוך מדי — לא מציגים קוד */

    var words = weave(encode(bytes, v), v);
    var best = null, bestP = -1, k;
    for (k = (force == null ? 0 : force); k < (force == null ? 8 : force + 1); k++) {
      var F = frame(v);
      place(F, words);
      for (var r = 0; r < F.n; r++) for (var c = 0; c < F.n; c++)
        if (!F.res[r][c] && maskAt(k, r, c)) F.m[r][c] ^= 1;
      putFmt(F, k);
      var pen = penalty(F.m, F.n);
      if (bestP < 0 || pen < bestP) { bestP = pen; best = F.m; }
    }
    return best;
  }

  /* ---------- ציור ----------
     SVG מוטבע: אין בקשת רשת, אין קובץ, והוא נשאר חד בכל גודל
     ובכל צפיפות מסך. */
  function svg(text, opt) {
    var m = make(text);
    if (!m) return '';
    opt = opt || {};
    var q = opt.quiet == null ? 3 : opt.quiet;   /* שוליים שקטים */
    var n = m.length, size = n + q * 2, d = '', r, c;
    for (r = 0; r < n; r++) {
      c = 0;
      while (c < n) {
        if (!m[r][c]) { c++; continue; }
        var w = 0;
        while (c + w < n && m[r][c + w]) w++;    /* רצף אחד, מלבן אחד */
        d += 'M' + (c + q) + ' ' + (r + q) + 'h' + w + 'v1h-' + w + 'z';
        c += w;
      }
    }
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" ' +
           'xmlns="http://www.w3.org/2000/svg" role="img" ' +
           'aria-label="' + (opt.label || 'קוד סריקה') + '" ' +
           'style="display:block;width:100%;height:auto">' +
           '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' +
           '<path d="' + d + '" fill="' + (opt.color || '#1B2A45') + '"/></svg>';
  }

  return { make: make, svg: svg };
})();
