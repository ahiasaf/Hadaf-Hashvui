/* מקליט את promo.html לסרטון: 1080x1920, 30fps, mp4 בלי שמע.

     NODE_PATH=<תיקיית node_modules שבה playwright> node tools/promo/render.js

   כל פריים: seek(t) בעמוד, צילום מסך, ומשם ישר ל-ffmpeg.
   הפלט: tools/promo/hadaf-promo.mp4                                   */
var path = require('path');
var spawn = require('child_process').spawn;
var chromium = require('playwright').chromium;

var FPS = 30, W = 1080, H = 1920;
var DIR = __dirname;
var OUT = path.join(DIR, 'hadaf-promo.mp4');

(async function () {
  var browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  var page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(DIR, 'promo.html') + '?render');
  await page.waitForFunction(function () { return window.ready && window.ready(); });
  await page.evaluate(function () { return document.fonts.ready; });
  var total = await page.evaluate(function () { return window.TOTAL; });
  var frames = Math.round(total * FPS);

  var ff = spawn('ffmpeg', ['-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.1', '-r', String(FPS), '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  var done = new Promise(function (ok, no) {
    ff.on('close', function (c) { c ? no(new Error('ffmpeg ' + c)) : ok(); });
  });

  for (var f = 0; f < frames; f++) {
    await page.evaluate(function (t) { window.seek(t); }, f / FPS);
    var buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(function (r) { ff.stdin.once('drain', r); });
    if (f % 60 === 0) process.stdout.write('\r' + f + '/' + frames);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log('\r' + frames + ' פריימים, ' + total + ' שניות → ' + OUT);
})().catch(function (e) { console.error(e); process.exit(1); });
