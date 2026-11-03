// מאגר העלונים להורדה (8.99.449) — מול apps-script.gs עצמו בזיכרון.
// node tools/aldltest/run.js  → קוד 1 אם בדיקה נכשלה. מזהים מומצאים.
var M = require('../snaptest/mock.js');
var W = M.makeWorld(), c = W.ctx, n = 0, fails = 0;
var files = null;
c.SpreadsheetApp.create = function () { var S = Object.create(Object.getPrototypeOf(W.pub)); S.id = 'FILES'; S.tabs = {}; files = S; return S; };
var realOpen = c.SpreadsheetApp.openById;
c.SpreadsheetApp.openById = function (id) { return id === 'FILES' ? files : realOpen(id); };
c.Utilities.base64Decode = function (s) { return Array.prototype.slice.call(Buffer.from(s, 'base64')).map(function (b) { return b > 127 ? b - 256 : b; }); };
c.Utilities.newBlob = function (b) { return { getDataAsString: function () { return Buffer.from(b.map(function (x) { return x & 255; })).toString('latin1'); } }; };
function ok(cond, label, x) { n++; if (!cond) { fails++; console.log('FAIL', label, x === undefined ? '' : JSON.stringify(x)); } }
function get(p) { return c.aldlRoute_({ parameter: p }); }
// קובץ PDF מומצא, גדול משלוש חתיכות.
var pdf = Buffer.concat([Buffer.from('%PDF-1.4\n1 0 obj << /Type /Page >>\n2 0 obj << /Type /Pages >>\n3 0 obj << /Type /Page >>\n'), Buffer.alloc(120000, 65)]);
var b64 = pdf.toString('base64');
c.appendCols_('לומדים', [['מזהה', 'DKIDAAA1'], ['שם', 'א'], ['משפחה', 'ב'], ['קוד ישיבה', 'givat'], ['תפקיד', 'תלמיד']]);
c.appendCols_('לומדים', [['מזהה', 'DDADAAA1'], ['שם', 'ג'], ['משפחה', 'ד'], ['קוד ישיבה', 'givat'], ['תפקיד', 'הורה']]);

ok(get({ alon: 'list', dev: 'DKIDAAA1' }).rows.length === 0, 'empty list');
ok(get({ alon: 'list', dev: 'DNOBODYA1' }).status === 'denied', 'unknown device denied');
ok(get({ alon: 'adm' }).status === 'denied', 'adm without key denied');

var r1 = c.aldlPut_({ id: 'Aone111', mas: 'תענית', daf: 'ד', title: 'עלון ד', name: 'x.pdf', data: b64 });
ok(r1.status === 'ok' && r1.pages === 2, 'put ok + pages counted', r1);
ok(files.getSheetByName('f_Aone111').getLastRow() === Math.ceil(b64.length / 45000), 'chunked');
var L = get({ alon: 'list', dev: 'DKIDAAA1' });
ok(L.status === 'ok' && L.rows.length === 1 && L.rows[0].pg === 2, 'kid sees it', L);
ok(get({ alon: 'list', dev: 'DDADAAA1' }).rows.length === 1, 'dad sees it');
var G = get({ alon: 'get', id: 'Aone111', dev: 'DDADAAA1' });
ok(G.status === 'ok' && G.data === b64 && /\.pdf$/.test(G.name), 'download identical');
ok(get({ alon: 'get', id: 'Aone111', dev: 'DNOBODYB2' }).status === 'denied', 'download denied for unknown');
ok(c.aldlPut_({ id: 'Aone111', mas: 'תענית', daf: 'ד', title: 'עלון ד', data: b64 }).dup, 'resend = dup, no 2nd row');

var r2 = c.aldlPut_({ id: 'Abad222', mas: 'תענית', daf: 'ה', title: 'עלון ה', data: Buffer.from('hello world, not a pdf at all ' + 'x'.repeat(200)).toString('base64') });
ok(r2.status === 'error', 'non-pdf rejected');
ok(!files.getSheetByName('f_Abad222'), 'no file sheet for rejected');
var A = get({ alon: 'adm', key: 'k' });
ok(A.rows.length === 2 && A.rows[1].bad && !A.rows[1].pub && A.rows[1].why, 'adm sees error row', A.rows);
ok(get({ alon: 'list', dev: 'DKIDAAA1' }).rows.length === 1, 'error not in public list');
ok(get({ alon: 'get', id: 'Abad222', dev: 'DKIDAAA1' }).status === 'none', 'error not downloadable');
// כשל בשמירה — הקובץ החלקי נמחק, שורת שגיאה
var origIns = files.insertSheet;
files.insertSheet = function (nm) { var s = origIns.call(files, nm); s.getRange = function () { throw new Error('quota'); }; return s; };
var r3 = c.aldlPut_({ id: 'Afail33', mas: 'מגילה', daf: 'ב', title: 'עלון מגילה', data: b64 });
files.insertSheet = origIns;
ok(r3.status === 'error' && !files.getSheetByName('f_Afail33'), 'write failure cleans up', r3);
ok(get({ alon: 'list', dev: 'DKIDAAA1' }).rows.length === 1, 'list unchanged after failure');
// איש צוות מאושר
c.appendCols_(c.ACC_TAB, [['מזהה', 'DSTAFFAA1'], ['מצב', 'אושר'], ['קוד ישיבה', 'givat']]);
ok(get({ alon: 'list', dev: 'DSTAFFAA1' }).rows.length === 1, 'approved staff sees it');
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
