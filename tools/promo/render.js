/* מקליט את promo.html לסרטון: 1080x1920, 60fps, H.264 + AAC.

     NODE_PATH=<node_modules שבה playwright> node tools/promo/render.js

   הבמה בנויה ב-478x850 ומצולמת בצפיפות 1080/478, כך שהטקסט
   והתמונות מצוירים בחדות מלאה ולא מוגדלים מפריים קטן.
   כל פריים: seekAsync(t), המתנה לפענוח התמונות, צילום, ל-ffmpeg.

   מוזיקה: music.m4a בתיקייה הזו (לא בריפו). MUSIC_SS — שנייה בקובץ
   שממנה מתחילים (ברירת מחדל 0). כניסה 0.25 ש', יציאה בשנייה האחרונה,
   והאורך נחתך בדיוק לאורך הווידאו.
   הפלט: tools/promo/hadaf-promo.mp4                                   */
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var chromium = require('playwright').chromium;

var FPS = 60, W = 478, H = 850, DPR = 1080 / 478;
var DIR = __dirname;
var SILENT = path.join(DIR, 'video-only.mp4');
var OUT = path.join(DIR, 'hadaf-promo.mp4');
var MUSIC = path.join(DIR, 'music.m4a');

function run(args) {
  return new Promise(function (ok, no) {
    var p = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', function (c) { c ? no(new Error('ffmpeg ' + c)) : ok(); });
  });
}

(async function () {
  var browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  var page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  await page.goto('file://' + path.join(DIR, 'promo.html') + '?render');
  await page.evaluate(function () { return document.fonts.ready; });
  var total = await page.evaluate(function () { return window.TOTAL; });
  var frames = Math.round(total * FPS);
  var from = +(process.env.FROM || 0), to = +(process.env.TO || frames);

  var ff = spawn('ffmpeg', ['-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=1080:1920:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2', '-r', String(FPS),
    '-movflags', '+faststart', SILENT], { stdio: ['pipe', 'inherit', 'inherit'] });
  var done = new Promise(function (ok, no) {
    ff.on('close', function (c) { c ? no(new Error('ffmpeg ' + c)) : ok(); });
  });

  for (var f = from; f < to; f++) {
    await page.evaluate(function (t) { return window.seekAsync(t); }, f / FPS);
    var buf = await page.screenshot({ type: 'jpeg', quality: 97 });
    if (!ff.stdin.write(buf)) await new Promise(function (r) { ff.stdin.once('drain', r); });
    if (f % 120 === 0) process.stdout.write('\r' + f + '/' + frames + '   ');
  }
  ff.stdin.end();
  await done;
  await browser.close();

  if (process.env.FROM) {                      // קטע בלבד — לשתילה, בלי שמע
    console.log('\nקטע ' + from + '–' + to + ' → ' + SILENT);
  } else if (fs.existsSync(MUSIC)) {
    var dur = (to - from) / FPS;
    await run(['-loglevel', 'error', '-y', '-i', SILENT, '-ss', String(process.env.MUSIC_SS || 0), '-i', MUSIC,
      '-filter_complex', '[1:a]apad,atrim=0:' + dur + ',afade=t=in:d=0.25,afade=t=out:st=' + (dur - 1) + ':d=1,' +
      'aformat=sample_rates=48000:channel_layouts=stereo[a]',
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(dur),
      '-movflags', '+faststart', OUT]);
    fs.unlinkSync(SILENT);
  } else {
    fs.renameSync(SILENT, OUT);
    console.log('\nאין music.m4a — הסרטון יצא בלי שמע');
  }
  console.log('\r' + (to - from) + ' פריימים → ' + OUT);
})().catch(function (e) { console.error(e); process.exit(1); });
