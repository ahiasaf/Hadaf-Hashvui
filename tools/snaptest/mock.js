// מדמה Apps Script בזיכרון: גיליונות, מטמון, מאפיינים.
var vm = require('vm'), fs = require('fs');
var missing = {};
function fallback(name, obj) {
  return new Proxy(obj, { get: function (t, k) {
    if (k in t) return t[k];
    if (typeof k === 'symbol') return undefined;
    missing[name + '.' + String(k)] = 1;
    return function () { return undefined; };
  }});
}
function fmt(d, tz, p) {
  d = d instanceof Date || (d && d.getTime) ? d : new Date(d);
  var parts = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date(d.getTime()))
    .forEach(function (x) { parts[x.type] = x.value; });
  var off = (function () { var u = new Date(d.getTime()); var l = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    var m = Math.round((l - u.getTime()) / 60000); var s = m >= 0 ? '+' : '-'; m = Math.abs(m);
    return s + String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0'); })();
  return p.replace(/yyyy|MM|dd|HH|mm|ss|Z|EEE|u/g, function (t) {
    return { yyyy: parts.year, MM: parts.month, dd: parts.day, HH: String(+parts.hour % 24).padStart(2, '0'), mm: parts.minute, ss: parts.second,
             Z: off, EEE: parts.weekday, u: String(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(parts.weekday) + 1) }[t];
  });
}
function disp(v) { if (v == null) return ''; if (v instanceof Date || (v && typeof v.getTime === 'function' && typeof v.getFullYear === 'function')) return fmt(v, '', 'dd/MM/yyyy HH:mm:ss'); return String(v); }
var STATS = { reads: 0, readCells: 0 };
// כמו בגיליון: גרש בראש מחרוזת = "טקסט", ואינו נשמר בתא.
function tx(v) { return typeof v === 'string' && v.charAt(0) === "'" ? v.slice(1) : v; }
function Sheet(name, ss) { this.name = name; this.ss = ss; this.d = []; }
Sheet.prototype = {
  getName: function () { return this.name; },
  getLastRow: function () { return this.d.length; },
  getLastColumn: function () { var m = 0; this.d.forEach(function (r) { if (r.length > m) m = r.length; }); return m; },
  getMaxRows: function () { return Math.max(1000, this.d.length); },
  getMaxColumns: function () { return Math.max(26, this.getLastColumn()); },
  getRange: function (r, c, nr, nc) {
    if (typeof r === 'string') throw new Error('A1 notation not mocked: ' + r);
    return chain(new Range(this, r, c, nr == null ? 1 : nr, nc == null ? 1 : nc));
  },
  getDataRange: function () { return chain(new Range(this, 1, 1, Math.max(1, this.d.length), Math.max(1, this.getLastColumn()))); },
  appendRow: function (a) { this.d.push(a.map(tx)); return this; },
  deleteRow: function (r) { this.d.splice(r - 1, 1); },
  deleteRows: function (r, n) { this.d.splice(r - 1, n); },
  insertRowsAfter: function () {}, insertColumnsAfter: function () {},
  clear: function () { this.d = []; return this; }, clearContents: function () { this.d = []; return this; },
  setFrozenRows: function () {}, hideSheet: function () {}, showSheet: function () {}, isSheetHidden: function () { return false; },
  getSheetId: function () { return 1; }, getParent: function () { return this.ss; }, setName: function (n) { this.name = n; }
};
function chain(o) { var px = new Proxy(o, { get: function (t, k) { if (k in t) { var v = t[k]; return typeof v === 'function' ? function () { var x = v.apply(t, arguments); return x === t ? px : x; } : v; }
  if (typeof k === 'symbol') return undefined; return function () { return px; }; } }); return px; }
function Range(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
Range.prototype = {
  _get: function (f) { STATS.reads++; var out = []; for (var i = 0; i < this.nr; i++) { var row = this.sh.d[this.r - 1 + i] || [], o = [];
    for (var j = 0; j < this.nc; j++) { var v = row[this.c - 1 + j]; o.push(f(v === undefined ? '' : v)); STATS.readCells++; } out.push(o); } return out; },
  getValues: function () { return this._get(function (v) { return v; }); },
  getDisplayValues: function () { return this._get(disp); },
  getValue: function () { return this.getValues()[0][0]; }, getDisplayValue: function () { return this.getDisplayValues()[0][0]; },
  setValues: function (v) { for (var i = 0; i < v.length; i++) { var ri = this.r - 1 + i; while (this.sh.d.length <= ri) this.sh.d.push([]);
    for (var j = 0; j < v[i].length; j++) { var row = this.sh.d[ri]; while (row.length < this.c - 1 + j) row.push(''); row[this.c - 1 + j] = tx(v[i][j]); } } return this; },
  setValue: function (x) { return this.setValues([[x]]); },
  clearContent: function () { var b = []; for (var i = 0; i < this.nr; i++) { b.push(new Array(this.nc).fill('')); } return this.setValues(b); },
  getRow: function () { return this.r; }, getNumRows: function () { return this.nr; }, getColumn: function () { return this.c; },
  setNumberFormat: function () { return this; }, setFontWeight: function () { return this; }, setBackground: function () { return this; }
};
function SS(id) { this.id = id; this.tabs = {}; }
SS.prototype = {
  getId: function () { return this.id; },
  getSheetByName: function (n) { return this.tabs[n] || null; },
  insertSheet: function (n) { return (this.tabs[n] = new Sheet(n, this)); },
  getSheets: function () { var t = this.tabs; return Object.keys(t).map(function (k) { return t[k]; }); },
  deleteSheet: function (s) { delete this.tabs[s.name]; }, getUrl: function () { return 'x'; }
};
function makeWorld() {
  var pub = new SS('PUB'), priv = new SS('PRIV'), props = { PRIVATE_ID: 'PRIV', READ_KEY: 'k' }, cache = { m: {} };
  var CacheObj = {
    get: function (k) { return k in cache.m ? cache.m[k] : null; },
    put: function (k, v) { if (String(v).length > 100000) throw new Error('cache value too big ' + k); cache.m[k] = String(v); },
    putAll: function (o) { for (var k in o) this.put(k, o[k]); },
    getAll: function (ks) { var o = {}; ks.forEach(function (k) { if (k in cache.m) o[k] = cache.m[k]; }); return o; },
    remove: function (k) { delete cache.m[k]; }, removeAll: function (ks) { ks.forEach(function (k) { delete cache.m[k]; }); }
  };
  var PropObj = { getProperty: function (k) { return k in props ? props[k] : null; }, setProperty: function (k, v) { props[k] = String(v); return PropObj; },
    deleteProperty: function (k) { delete props[k]; }, getProperties: function () { return Object.assign({}, props); }, setProperties: function (o) { Object.assign(props, o); } };
  var W = { pub: pub, priv: priv, props: props, cache: cache, sleepHook: null };
  var ctx = {
    console: console, JSON: JSON, Math: Math, Date: Date, Intl: Intl,
    SpreadsheetApp: fallback('SpreadsheetApp', { getActiveSpreadsheet: function () { return pub; },
      openById: function (id) { if (id === 'PRIV') return priv; return pub; }, flush: function () {} }),
    CacheService: fallback('CacheService', { getScriptCache: function () { return CacheObj; } }),
    PropertiesService: fallback('PropertiesService', { getScriptProperties: function () { return PropObj; } }),
    LockService: fallback('LockService', (function () {
      /* שלוש נעילות נפרדות (סקריפט / מסמך / משתמש). `W.busy[kind]` = תפוסה — tryLock נכשל. */
      var mk = function (kind) { return function () { return { waitLock: function () {}, tryLock: function () { return !(W.busy && W.busy[kind]); },
        releaseLock: function () {}, hasLock: function () { return true; } }; }; };
      return { getScriptLock: mk('script'), getDocumentLock: mk('doc'), getUserLock: mk('user') };
    })()),
    Utilities: fallback('Utilities', { formatDate: fmt, sleep: function (ms) { if (W.sleepHook) W.sleepHook(ms); },
      getUuid: function () { return 'u' + Math.random().toString(36).slice(2); } }),
    Session: fallback('Session', { getScriptTimeZone: function () { return 'Asia/Jerusalem'; } }),
    Logger: { log: function () {} },
    ContentService: fallback('ContentService', { createTextOutput: function (t) { return { t: t, setMimeType: function () { return this; } }; }, MimeType: { JSON: 1, JAVASCRIPT: 2 } }),
    UrlFetchApp: fallback('UrlFetchApp', {}), ScriptApp: fallback('ScriptApp', { getProjectTriggers: function () { return []; } }),
    DriveApp: fallback('DriveApp', {}), MailApp: fallback('MailApp', {}), HtmlService: fallback('HtmlService', {})
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(process.env.GS || require('path').join(__dirname, '..', '..', 'apps-script.gs'), 'utf8'), ctx, { filename: 'apps-script.gs' });
  W.ctx = ctx; W.CacheObj = CacheObj;
  return W;
}
module.exports = { makeWorld: makeWorld, missing: missing, STATS: STATS };
