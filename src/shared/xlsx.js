/* ============================================================
   קריאת קובץ אקסל (xlsx) בדפדפן - בלי ספרייה ובלי CDN.
   ============================================================
   xlsx הוא zip של קובצי XML. כאן: קריאת ה-zip, פענוח deflate
   (RFC 1951), והחזרת כל גיליון כרשימת שורות - בכל שורה אובייקט
   עמודה→ערך ({A:..., B:...}), כולל המחרוזות המשותפות.

   נטען רק כשבוחרים קובץ (עמדת הלימוד בניהול), ולא בכל פתיחה.
   ES5 בלבד.
   ============================================================ */
var XLSX_READ = (function () {
'use strict';

var LBASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
var LEXT  = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
var DBASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
var DEXT  = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
var CLORD = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];

function inflate(src, size) {
  var out = new Uint8Array(size), op = 0;
  var pos = 0, tag = 0, bc = 0;

  function bit() {
    if (!bc) { if (pos >= src.length) throw new Error('eof'); tag = src[pos++]; bc = 8; }
    var b = tag & 1; tag >>>= 1; bc--; return b;
  }
  function bits(n) {
    var v = 0, i;
    for (i = 0; i < n; i++) v |= bit() << i;
    return v;
  }
  function tree(lens, off, num) {
    var t = { c: [], s: [] }, offs = [], i, sum = 0;
    for (i = 0; i < 16; i++) t.c[i] = 0;
    for (i = 0; i < num; i++) t.c[lens[off + i]]++;
    t.c[0] = 0;
    for (i = 0; i < 16; i++) { offs[i] = sum; sum += t.c[i]; }
    for (i = 0; i < num; i++) { if (lens[off + i]) t.s[offs[lens[off + i]]++] = i; }
    return t;
  }
  function sym(t) {
    var sum = 0, cur = 0, len = 0;
    do {
      cur = 2 * cur + bit();
      len++;
      if (len > 15) throw new Error('code');
      sum += t.c[len];
      cur -= t.c[len];
    } while (cur >= 0);
    return t.s[sum + cur];
  }
  function put(b) {
    if (op >= out.length) throw new Error('size');
    out[op++] = b;
  }

  var fixL = null, fixD = null, last, type, i, n;
  do {
    last = bit();
    type = bits(2);
    if (type === 0) {
      bc = 0;                                /* יישור לבית */
      n = src[pos] | (src[pos + 1] << 8);
      pos += 4;
      for (i = 0; i < n; i++) put(src[pos++]);
      continue;
    }
    var lt, dt;
    if (type === 1) {
      if (!fixL) {
        var fl = [];
        for (i = 0; i < 144; i++) fl[i] = 8;
        for (; i < 256; i++) fl[i] = 9;
        for (; i < 280; i++) fl[i] = 7;
        for (; i < 288; i++) fl[i] = 8;
        fixL = tree(fl, 0, 288);
        var fd = [];
        for (i = 0; i < 30; i++) fd[i] = 5;
        fixD = tree(fd, 0, 30);
      }
      lt = fixL; dt = fixD;
    } else if (type === 2) {
      var hlit = bits(5) + 257, hdist = bits(5) + 1, hclen = bits(4) + 4;
      var cl = [];
      for (i = 0; i < 19; i++) cl[i] = 0;
      for (i = 0; i < hclen; i++) cl[CLORD[i]] = bits(3);
      var ct = tree(cl, 0, 19), lens = [], s, prev, rep;
      n = 0;
      while (n < hlit + hdist) {
        s = sym(ct);
        if (s < 16) { lens[n++] = s; continue; }
        if (s === 16) { prev = lens[n - 1]; rep = 3 + bits(2); }
        else if (s === 17) { prev = 0; rep = 3 + bits(3); }
        else { prev = 0; rep = 11 + bits(7); }
        while (rep--) lens[n++] = prev;
      }
      lt = tree(lens, 0, hlit);
      dt = tree(lens, hlit, hdist);
    } else {
      throw new Error('type');
    }
    for (;;) {
      var c = sym(lt);
      if (c < 256) { put(c); continue; }
      if (c === 256) break;
      c -= 257;
      var len = LBASE[c] + bits(LEXT[c]);
      var d = sym(dt);
      var from = op - (DBASE[d] + bits(DEXT[d]));
      if (from < 0) throw new Error('dist');
      for (i = 0; i < len; i++) put(out[from + i]);
    }
  } while (!last);
  return op === out.length ? out : out.subarray(0, op);
}

function utf8(u) {
  if (window.TextDecoder) return new TextDecoder('utf-8').decode(u);
  var s = '', i;
  for (i = 0; i < u.length; i += 8192) {
    s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  }
  return decodeURIComponent(escape(s));
}

/* zip: קוראים את הספרייה המרכזית מהסוף, ומשם כל קובץ לפי שמו. */
function unzip(buf) {
  var u = new Uint8Array(buf), files = {}, i, e = -1;
  function u16(p) { return u[p] | (u[p + 1] << 8); }
  function u32(p) { return (u16(p) + u16(p + 2) * 65536); }
  for (i = u.length - 22; i >= 0 && i >= u.length - 65557; i--) {
    if (u32(i) === 0x06054b50) { e = i; break; }
  }
  if (e < 0) throw new Error('zip');
  var cnt = u16(e + 10), p = u32(e + 16);
  for (i = 0; i < cnt; i++) {
    if (u32(p) !== 0x02014b50) throw new Error('cd');
    var meth = u16(p + 10), csz = u32(p + 20), usz = u32(p + 24);
    var nl = u16(p + 28), xl = u16(p + 30), cl = u16(p + 32), lo = u32(p + 42);
    var name = utf8(u.subarray(p + 46, p + 46 + nl));
    files[name] = { m: meth, c: csz, n: usz, o: lo };
    p += 46 + nl + xl + cl;
  }
  return {
    names: function () { var a = [], k; for (k in files) { if (files.hasOwnProperty(k)) a.push(k); } return a; },
    text: function (name) {
      var f = files[name];
      if (!f) return null;
      var d = f.o + 30 + u16(f.o + 26) + u16(f.o + 28);
      var raw = u.subarray(d, d + f.c);
      if (f.m === 0) return utf8(raw);
      if (f.m !== 8) throw new Error('method');
      return utf8(inflate(raw, f.n));
    }
  };
}

function xml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
function tx(el) {
  var ts = el.getElementsByTagName('t'), s = '', i;
  for (i = 0; i < ts.length; i++) s += ts[i].textContent;
  return s;
}
function trim(s) { return String(s == null ? '' : s).replace(/^[\s‎‏]+|[\s‎‏]+$/g, ''); }


function xml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
function tx(el) {
  var ts = el.getElementsByTagName('t'), s = '', i;
  for (i = 0; i < ts.length; i++) s += ts[i].textContent;
  return s;
}

/* [{ name:'<שם הגיליון>', rows:[{A:'..',B:'..'}, ...] }, ...] לפי סדר הגיליונות */
return function (buf) {
  var z = unzip(buf), ss = [], i, j, k;
  var sst = z.text('xl/sharedStrings.xml');
  if (sst) {
    var si = xml(sst).getElementsByTagName('si');
    for (i = 0; i < si.length; i++) ss.push(tx(si[i]));
  }
  var names = {}, wb = z.text('xl/workbook.xml');
  if (wb) {
    var sh = xml(wb).getElementsByTagName('sheet');
    for (i = 0; i < sh.length; i++) names[i + 1] = sh[i].getAttribute('name') || '';
  }
  var files = [], all = z.names();
  for (i = 0; i < all.length; i++) {
    var m = all[i].match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
    if (m) files.push({ n: +m[1], f: all[i] });
  }
  files.sort(function (a, b) { return a.n - b.n; });

  var out = [];
  for (i = 0; i < files.length; i++) {
    var rows = xml(z.text(files[i].f)).getElementsByTagName('row'), list = [];
    for (j = 0; j < rows.length; j++) {
      var cs = rows[j].getElementsByTagName('c'), v = {};
      for (k = 0; k < cs.length; k++) {
        var c = cs[k], col = (c.getAttribute('r') || '').replace(/\d+/g, '');
        var t = c.getAttribute('t'), ve = c.getElementsByTagName('v')[0];
        var val = ve ? ve.textContent : '';
        if (t === 's') val = ss[+val] || '';
        else if (t === 'inlineStr') val = tx(c);
        v[col] = String(val).replace(/^[\s\u200e\u200f]+|[\s\u200e\u200f]+$/g, '');
      }
      list.push(v);
    }
    out.push({ name: names[files[i].n] || '', rows: list });
  }
  return out;
};
}());
