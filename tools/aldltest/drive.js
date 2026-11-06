// עלונים מהדרייב (8.99.463) — aldlDrvSync_ מול apps-script.gs עצמו, עם דרייב מדומה.
// node tools/aldltest/drive.js  → קוד 1 אם בדיקה נכשלה. מזהים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
var files = null;
c.SpreadsheetApp.create = function () { var S = Object.create(Object.getPrototypeOf(W.pub)); S.id = 'FILES'; S.tabs = {}; files = S; return S; };
var realOpen = c.SpreadsheetApp.openById;
c.SpreadsheetApp.openById = function (id) { return id === 'FILES' ? files : realOpen(id); };
c.Utilities.base64Encode = function (b) { return Buffer.from(b.map(function (x) { return x & 255; })).toString('base64'); };
c.Utilities.base64EncodeWebSafe = function (b) { return Buffer.from(b.map(function (x) { return x & 255; })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); };
c.Utilities.computeDigest = function (a, s) { return Array.prototype.slice.call(require('crypto').createHash('md5').update(String(s)).digest()); };
c.Utilities.DigestAlgorithm = { MD5: 'md5' };
c.Utilities.base64Decode = function (s) { return Array.prototype.slice.call(Buffer.from(s, 'base64')).map(function (b) { return b > 127 ? b - 256 : b; }); };
c.Utilities.newBlob = function (b) { return { getDataAsString: function () { return Buffer.from(b.map(function (x) { return x & 255; })).toString('latin1'); } }; };
var trig = [];
c.ScriptApp.getProjectTriggers = function () { return trig; };
c.ScriptApp.newTrigger = function (fn) {
  var t = { getHandlerFunction: function () { return fn; } };
  var b = { timeBased: function () { return b; }, everyMinutes: function (m) { t.min = m; return b; }, create: function () { trig.push(t); return t; } };
  return b;
};
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { return c.aldlRoute_({ parameter: p }); }
function pdf(tag, kb) {
  return Buffer.concat([Buffer.from('%PDF-1.4\n1 0 obj << /Type /Page >> ' + tag + '\n'), Buffer.alloc((kb || 60) * 1024, 66)]);
}
// הדרייב המדומה: תיקייה ← תת-תיקייה "תענית" ← קבצים.
var blocked = false, dlFail = false;
function F(id, name, buf, t) { return { id: id, name: name, buf: buf, t: t, mime: 'application/pdf' }; }
var root = { name: 'לפרסום', files: [], dirs: [{ name: 'תענית', files: [], dirs: [] }] };
function file(o) {
  return { getId: function () { return o.id; }, getName: function () { return o.name; }, getMimeType: function () { return o.mime; },
    isTrashed: function () { return false; }, getSize: function () { return o.buf.length; },
    getLastUpdated: function () { return new Date(o.t); },
    getBlob: function () { if (dlFail) throw new Error('download failed'); return { getBytes: function () { return Array.prototype.slice.call(o.buf).map(function (b) { return b > 127 ? b - 256 : b; }); } }; } };
}
function it(a) { var i = 0; return { hasNext: function () { return i < a.length; }, next: function () { return a[i++]; } }; }
function folder(d) {
  return { getName: function () { return d.name; }, isTrashed: function () { return false; },
    getFiles: function () { return it(d.files.map(file)); }, getFolders: function () { return it(d.dirs.map(folder)); } };
}
c.DriveApp.getFolderById = function (id) { if (blocked) throw new Error('Permission denied while enabling APIs: drive'); return folder(root); };
c.appendCols_('לומדים', [['מזהה', 'DKIDAAA1'], ['שם', 'א'], ['משפחה', 'ב'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
function list() { return get({ alon: 'list', dev: 'DKIDAAA1' }).rows; }
function sync() { W.cache.m = {}; return c.aldlDrvSync_(); }

// 1. לפני כל דבר: עלון שהועלה ידנית — לא נוגעים בו לעולם.
var man = pdf('manual');
ok(c.aldlPut_({ id: 'Aman111', mas: 'מגילה', daf: 'ב', title: 'עלון ידני', data: man.toString('base64') }).status === 'ok', 'manual put');

// 2. אין גישה לתיקייה — סטטוס כשל, המאגר לא זז, הטריגר הותקן.
blocked = true;
var A = get({ alon: 'adm', key: 'k' });
ok(trig.length === 1 && trig[0].getHandlerFunction() === 'aldlDrvTick' && trig[0].min === 15, 'trigger installed once', trig.length);
ok(A.drv && A.drv.ok === false && /אין גישה/.test(A.drv.why), 'adm sees access failure', A.drv);
ok(list().length === 1, 'manual leaflet survives blocked drive');
get({ alon: 'adm', key: 'k' });
ok(trig.length === 1, 'no second trigger');
var D = get({ alon: 'dstat' });
ok(D.status === 'ok' && D.ok === false && D.code === 'access' && !D.why, 'dstat: state only, no details', D);
blocked = false;

// 3. עלון חדש בתת-התיקייה.
var f1 = F('fid1', 'עלון למסכת תענית דף ה.pdf', pdf('v1'), 1000);
root.dirs[0].files.push(f1);
var s = sync();
ok(s.ok && s.add === 1 && s.rep === 0, 'new leaflet added', s);
var L = list();
var d1 = L.filter(function (r) { return r.mas === 'תענית'; })[0];
ok(L.length === 2 && d1 && d1.daf === 'ה' && d1.t === 'עלון למסכת תענית דף ה', 'parsed mas/daf/title', L);
var G = get({ alon: 'get', id: d1.id, dev: 'DKIDAAA1' });
ok(G.status === 'ok' && G.data === f1.buf.toString('base64'), 'download identical to drive file');

// 4. בלי שינוי — כלום לא נכתב.
var rowsBefore = get({ alon: 'adm', key: 'k' }).rows.length;
s = sync();
ok(s.ok && s.add === 0 && s.rep === 0 && get({ alon: 'adm', key: 'k' }).rows.length === rowsBefore, 'unchanged = no rows', s);

// 5. גרסה מעודכנת (אותו קובץ בדרייב) — החדשה פורסמה, הקודמת "הוחלף".
f1.buf = pdf('v2', 70); f1.t = 2000;
s = sync();
ok(s.ok && s.rep === 1 && s.add === 0, 'new version replaces', s);
L = list();
var d2 = L.filter(function (r) { return r.mas === 'תענית'; });
ok(d2.length === 1 && d2[0].id !== d1.id, 'only the new version is listed', L);
ok(get({ alon: 'get', id: d2[0].id, dev: 'DKIDAAA1' }).data === f1.buf.toString('base64'), 'download = new version');
ok(get({ alon: 'adm', key: 'k' }).rows.some(function (r) { return r.id === d1.id && r.rep; }), 'old row marked replaced');

// 6. הורדה שנכשלה בגרסה חדשה — הגרסה הקיימת נשארת, ואין שורת שגיאה.
f1.buf = pdf('v3', 80); f1.t = 3000; dlFail = true;
rowsBefore = get({ alon: 'adm', key: 'k' }).rows.length;
s = sync();
L = list();
ok(s.err === 1 && L.filter(function (r) { return r.mas === 'תענית'; })[0].id === d2[0].id, 'failed download keeps current', s);
ok(get({ alon: 'adm', key: 'k' }).rows.length === rowsBefore, 'no row on transient failure');
dlFail = false;
s = sync();
ok(s.rep === 1 && list().filter(function (r) { return r.mas === 'תענית'; }).length === 1, 'retried next run', s);

// 7. אין גישה אחרי שיש עלונים — כלום לא נמחק.
var before = JSON.stringify(list());
blocked = true; s = sync(); blocked = false;
ok(!s.ok && JSON.stringify(list()) === before, 'blocked after publish: nothing removed', s);

// 8. הקובץ נמחק מהדרייב — העלון נשאר.
var saved = root.dirs[0].files; root.dirs[0].files = [];
s = sync();
ok(s.ok && JSON.stringify(list()) === before, 'file gone from drive: leaflet stays', s);

// 9. קובץ חדש באותו שם במקום הקודם (מזהה אחר) — מחליף.
var f2 = F('fid2', 'עלון למסכת תענית דף ה.pdf', pdf('v4', 50), 4000);
root.dirs[0].files = [f2];
s = sync();
L = list().filter(function (r) { return r.mas === 'תענית'; });
ok(s.rep === 1 && L.length === 1 && get({ alon: 'get', id: L[0].id, dev: 'DKIDAAA1' }).data === f2.buf.toString('base64'), 'same-name re-upload replaces', s);

// 10. שם שלא מזוהה — שורת שגיאה אחת, לא מתפרסם, לא חוזר כל הרצה.
root.files.push(F('fid3', 'משהו בלי פרטים.pdf', pdf('x'), 5000));
s = sync(); var s2 = sync();
ok(s.err === 1 && s2.err === 0, 'unparsed name: one error row only', [s, s2]);
ok(!list().some(function (r) { return r.t === 'משהו בלי פרטים'; }), 'unparsed not public');
// "מסכת X" בשם, בלי תת-תיקייה.
root.files.push(F('fid4', 'עלון למסכת מגילה דף ג.pdf', pdf('m'), 6000));
s = sync();
ok(s.add === 1 && list().some(function (r) { return r.mas === 'מגילה' && r.daf === 'ג'; }), 'mas from file name at root', s);

// 11. הידני מ-1 עדיין שם.
ok(list().some(function (r) { return r.id === 'Aman111'; }), 'manual leaflet untouched');
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
