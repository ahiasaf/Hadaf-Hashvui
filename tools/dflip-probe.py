#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מה ה-Flipbook של אתר הסוגיה היומית יודע לקבל מהכתובת.

למה
---
הקישור שלנו כבר פותח את החוברת בעמוד הנכון (`#flipbook-df_XXXX/N/`).
השאלה הבאה היא אם אפשר גם לפתוח אותו **במסך מלא**, כי בטלפון
התצוגה הרגילה קטנה והתלמיד לוחץ על כפתור ההגדלה בעצמו.

זה אתר של מישהו אחר. אי אפשר להריץ בו קוד, ולכן התשובה תלויה
בשאלה אחת בלבד: האם הספרייה שהם משתמשים בה (DearFlip/dFlip) קוראת
פרמטר כזה מהכתובת. הכלי הזה מוריד את קובץ הג׳אווהסקריפט שלהם ומחפש
בו את המקום שבו הוא מפרש את ה-hash ואת שמות הפעולות של מסך מלא.

מה שיוצא מכאן הוא עובדה, לא השערה: או שיש פרמטר כזה או שאין.

שימוש
-----
    python3 tools/dflip-probe.py
"""
import io
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_sx = __import__('importlib').import_module('importlib.util')
_spec = _sx.spec_from_file_location(
    'sugya', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sugya-index.py'))
sugya = _sx.module_from_spec(_spec)
_spec.loader.exec_module(sugya)

PAGE = sugya.BOOKS[0]['page']
OUT = os.path.join(sugya.ROOT, 'sugya', 'dflip-probe.txt')

# מה מעניין אותנו בקוד שלהם
WORDS = ['fullscreen', 'fullScreen', 'FULLSCREEN', 'requestFullscreen',
         'location.hash', 'window.location', 'hashchange', 'substring(1)',
         'dflip-', 'flipbook-', 'openPage', 'gotoPage', 'autoPlay',
         'singlePageMode', 'zoom']


def snippets(js, word, span=90, cap=6):
    out = []
    for m in re.finditer(re.escape(word), js):
        a = max(0, m.start() - span)
        out.append(re.sub(r'\s+', ' ', js[a:m.start() + span]))
        if len(out) >= cap:
            break
    return out


def main():
    log = ['עמוד: ' + PAGE, '']
    html = sugya.fetch(PAGE).decode('utf-8', 'replace')
    log.append('גודל העמוד: %d תווים' % len(html))

    srcs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
    srcs = [urllib.parse.urljoin(PAGE, s) for s in srcs]
    flip = [s for s in srcs if re.search(r'dflip|dearflip|flip', s, re.I)]
    log.append('קבצי סקריפט: %d · מתוכם של הפליפבוק: %d' % (len(srcs), len(flip)))
    for s in flip:
        log.append('  ' + s)

    # ההגדרות שהאתר מעביר לפליפבוק, אם הן בגוף העמוד
    log.append('')
    log.append('=== הגדרות בעמוד עצמו ===')
    for m in re.finditer(r'(?:DFLIP|dflip|option)\w*\s*[=:]\s*\{[^}]{0,400}\}', html):
        log.append('  ' + re.sub(r'\s+', ' ', m.group(0))[:300])

    for url in flip:
        log.append('')
        log.append('=== %s ===' % url.rsplit('/', 1)[-1])
        try:
            js = sugya.fetch(url, referer=PAGE).decode('utf-8', 'replace')
        except Exception as e:
            log.append('  לא ירד: %s' % str(e)[:90])
            continue
        log.append('  %d תווים' % len(js))
        for w in WORDS:
            hits = snippets(js, w)
            if not hits:
                continue
            log.append('  --- %s (%d) ---' % (w, js.count(w)))
            for h in hits:
                log.append('      ' + h[:200])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8').write('\n'.join(log) + '\n')
    print('\n'.join(log[:40]))
    print('\n→ sugya/dflip-probe.txt')


if __name__ == '__main__':
    main()
