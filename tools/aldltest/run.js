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
ok(get({ alon: 'list', dev: 'DNOBODYA1' }).status === 'ok', 'public: unknown device sees list (8.99.468)');
ok(get({ alon: 'list' }).status === 'ok', 'public: no device at all');
ok(get({ alon: 'adm' }).status === 'denied', 'adm without key denied');

var r1 = c.aldlPut_({ id: 'Aone111', mas: 'תענית', daf: 'ד', title: 'עלון ד', name: 'x.pdf', data: b64 });
ok(r1.status === 'ok' && r1.pages === 2, 'put ok + pages counted', r1);
ok(files.getSheetByName('f_Aone111').getLastRow() === Math.ceil(b64.length / 45000), 'chunked');
var L = get({ alon: 'list', dev: 'DKIDAAA1' });
ok(L.status === 'ok' && L.rows.length === 1 && L.rows[0].pg === 2, 'kid sees it', L);
ok(get({ alon: 'list', dev: 'DDADAAA1' }).rows.length === 1, 'dad sees it');
var G = get({ alon: 'get', id: 'Aone111', dev: 'DDADAAA1' });
ok(G.status === 'ok' && G.data === b64 && /\.pdf$/.test(G.name), 'download identical');
ok(get({ alon: 'get', id: 'Aone111' }).data === b64, 'public: download without device');
// הורדה בחלקים (p): כל החלקים יחד = הקובץ.
var P0 = get({ alon: 'get', id: 'Aone111', p: '0' }), all = P0.data;
for (var pi = 1; pi < P0.np; pi++) all += get({ alon: 'get', id: 'Aone111', p: String(pi) }).data;
ok(P0.np === Math.ceil(Math.ceil(b64.length / 45000) / 40) && all === b64, 'parts join to file', P0.np);
ok(get({ alon: 'get', id: 'Aone111', p: '99' }).status === 'error', 'bad part');
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
// כתיבה בלי סיסמה — נדחית בשרת.
ok(get({ alon: 'dadd', fid: 'x'.repeat(30) }).status === 'denied', 'dadd without key denied');
ok(get({ alon: 'dadd', fid: 'x'.repeat(30), key: 'bad' }).status === 'denied', 'dadd wrong key denied');
ok(get({ alon: 'adm', key: 'bad' }).status === 'denied', 'adm wrong key denied');
var dp = c.doPost({ postData: { contents: JSON.stringify({ action: 'aldlput', key: 'bad', id: 'Ahack99', mas: 'x', daf: 'x', title: 'x', data: b64 }) } });
ok(/denied/.test(dp.getContent ? dp.getContent() : JSON.stringify(dp)) && !files.getSheetByName('f_Ahack99'), 'aldlput wrong key denied');
// עדכון: החדש פורסם, הקודם "הוחלף", ברשימה הציבורית רק החדש.
var pdf2 = Buffer.concat([pdf, Buffer.from('v2')]).toString('base64');
var u = c.aldlPut_({ id: 'Atwo222', mas: 'תענית', daf: 'ד', title: 'עלון ד', data: pdf2, rep: 'Aone111' });
var PL = get({ alon: 'list' }).rows;
ok(u.status === 'ok' && PL.length === 1 && PL[0].id === 'Atwo222', 'update replaces in public list', PL);
ok(get({ alon: 'adm', key: 'k' }).rows.some(function (r) { return r.id === 'Aone111' && r.rep; }), 'old row = replaced');
ok(get({ alon: 'get', id: 'Aone111' }).status === 'none', 'replaced not downloadable');
// עדכון שנכשל — הקודם נשאר.
var u2 = c.aldlPut_({ id: 'Athree3', mas: 'תענית', daf: 'ד', title: 'עלון ד', data: Buffer.from('nope '.repeat(50)).toString('base64'), rep: 'Atwo222' });
ok(u2.status === 'error' && get({ alon: 'list' }).rows[0].id === 'Atwo222', 'failed update keeps current');
// הוספה מקישור דרייב (dadd) — DriveApp נכשל → הורדה ישירה (קובץ משותף בקישור).
c.Utilities.base64Encode = function (b) { return Buffer.from(b.map(function (x) { return x & 255; })).toString('base64'); };
c.Utilities.base64EncodeWebSafe = function (b) { return c.Utilities.base64Encode(b).replace(/\+/g, '-').replace(/\//g, '_'); };
c.Utilities.computeDigest = function (a, x) { return Array.prototype.slice.call(require('crypto').createHash('md5').update(String(x)).digest()); };
c.Utilities.DigestAlgorithm = { MD5: 'md5' };
var FID = '1tojnn8rV6fQL1sTxCFChXdS2hcqE4TvP', pdf3 = Buffer.concat([pdf, Buffer.from('drive')]);
c.DriveApp.getFileById = function () { throw new Error('Permission denied while enabling APIs: drive'); };
c.pubFetch_ = function (fid) { return fid === FID ? { status: 'ok', name: 'עלון לשבת, תענית דף ב.pdf', data: pdf3.toString('base64') } : null; };
var da = get({ alon: 'dadd', key: 'k', fid: 'https://drive.google.com/file/d/' + FID + '/view?usp=drivesdk', id: 'Adrv111' });
var dr = get({ alon: 'list' }).rows.filter(function (r) { return r.id === 'Adrv111'; })[0];
ok(da.status === 'ok' && da.via === 'direct' && dr && dr.mas === 'תענית' && dr.daf === 'ב' && dr.t === 'עלון לשבת, תענית דף ב', 'dadd from link (fallback), mas/daf from name', [da, dr]);
ok(get({ alon: 'get', id: 'Adrv111' }).data === pdf3.toString('base64'), 'dadd file identical');
var da2 = get({ alon: 'dadd', key: 'k', fid: FID, id: 'Adrv222' });
ok(da2.dup && get({ alon: 'list' }).rows.filter(function (r) { return r.daf === 'ב'; }).length === 1, 'same file again = no duplicate', da2);
var da3 = get({ alon: 'dadd', key: 'k', fid: 'Z'.repeat(33), id: 'Adrv333' });
ok(da3.status === 'error' && da3.code === 'access' && /enabling APIs/.test(da3.message), 'unshared file: exact error, nothing added', da3);
console.log((fails ? 'FAILED ' + fails : 'OK') + ' · ' + n + ' בדיקות');
process.exit(fails ? 1 : 0);
