/* הבדיקות של סעיף 9 בבריף, על הסרטון המוכן:
     node tools/promo/check.js [hadaf-promo.mp4]

   1. קפיצות: הפרש ממוצע בין פריימים עוקבים (239x425 אפור) שעולה על
      פי 2.5 מהחציון של 3 שכנים מכל צד, ועוד 1.0.
   2. שכפול פריימים: בקטעי זום איטי — אסור דפוס 0.1/1.7/0.1/1.7.
   3. הכותרת: אזור הלוגו זהה בכל הפריימים.
   4. אורך: 2420 פריימים, ושמע באותו אורך.                              */
var spawn = require('child_process').spawnSync;
var path = require('path');
var FILE = process.argv[2] || path.join(__dirname, 'hadaf-promo.mp4');
var FPS = 60, W = 239, H = 425;

function frames(vf, w, h) {
  var r = spawn('ffmpeg', ['-loglevel', 'error', '-i', FILE, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
    { maxBuffer: 1 << 30 });
  var buf = r.stdout, n = buf.length / (w * h), out = [];
  for (var i = 0; i < n; i++) out.push(buf.subarray(i * w * h, (i + 1) * w * h));
  return out;
}
function mad(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
function median(xs) { xs = xs.slice().sort(function (a, b) { return a - b; }); return xs[xs.length >> 1]; }

var F = frames('fps=' + FPS + ',scale=' + W + ':' + H, W, H), D = [], bad = 0;
for (var i = 1; i < F.length; i++) D.push(mad(F[i - 1], F[i]));
console.log('פריימים: ' + F.length + (F.length === 2420 ? ' ✓' : ' ✗ (צריך 2420)'));

console.log('\n1. קפיצות:');
for (i = 3; i < D.length - 3; i++) {
  var nb = D.slice(i - 3, i).concat(D.slice(i + 1, i + 4));
  if (D[i] > 2.5 * median(nb) + 1) { bad++; console.log('   ' + ((i + 1) / FPS).toFixed(2) + ' ש׳  הפרש ' + D[i].toFixed(2) + '  שכנים ~' + median(nb).toFixed(2)); }
}
if (!bad) console.log('   אין ✓');

console.log('\n2. שכפול פריימים בקטעים האיטיים:');
[[12.4, 15.6], [19.5, 23.0], [24.0, 26.0], [27.1, 29.7], [30.5, 33.2]].forEach(function (r) {
  // פריים משוכפל = "עמק": הפרש זעיר בין שני הפרשים גדולים, שוב ושוב
  var a = Math.round(r[0] * FPS), b = Math.round(r[1] * FPS), alt = 0, n = 0;
  for (var j = a + 1; j < b - 1; j++) {
    var hi = Math.min(D[j - 1], D[j + 1]);
    if (hi > .03) { n++; if (D[j] < .25 * hi) alt++; }
  }
  console.log('   ' + r[0] + '–' + r[1] + ' ש׳: ' + (n ? Math.round(100 * alt / n) + '% זוגות מתחלפים' : 'כמעט ללא תנועה') +
    (n && alt / n > .3 ? '  ✗' : '  ✓'));
});

console.log('\n3. הכותרת (אזור הלוגו, ברזולוציה מלאה):');
var HW = 158, HH = 126;
var Hd = frames('crop=' + HW + ':' + HH + ':644:93', HW, HH), worst = 0, at = 0;
for (i = 1; i < Hd.length; i++) { var d = mad(Hd[0], Hd[i]); if (d > worst) { worst = d; at = i; } }
console.log('   סטייה מרבית מהפריים הראשון: ' + worst.toFixed(2) + ' (ב-' + (at / FPS).toFixed(2) + ' ש׳)' +
  (worst < 1.5 ? ' ✓ (רעש דחיסה בלבד)' : ' ✗'));

console.log('\n4. אורכים:');
var pr = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,duration', '-of', 'csv=p=0', FILE]).stdout.toString();
console.log('   ' + pr.trim().split('\n').join('   '));
