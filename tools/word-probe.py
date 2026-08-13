#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מה יש בקובצי הוורד של חברותא, ואיך הם מתייחסים למה שכבר סימנו.

למה
---
היום הביאור נקרא מ-PDF, ושני דברים שה-PDF אינו שומר משוחזרים בניחוש:
ההדגשות — מגובה האותיות — והרווחים, מהמרווח בין הרצפים. הניחוש
נכשל, וההבחנה בין לשון הגמרא לפירוש נעלמה.

בוורד שניהם כתובים במפורש. אין מה לנחש.

מה שחוסם מעבר
-------------
הסימונים שכבר נעשו בסטודיו שמורים לפי **מספר הפסקה** בביאור. אם
הוורד ייתן חלוקה אחרת לפסקאות מזו שיצאה מה-PDF, כל קטע יצביע על
הביאור הלא נכון. לכן הכלי הזה **אינו ממיר כלום** — הוא רק מודד
ומדווח, וההחלטה נעשית מול המספרים.

מה הוא מדווח
------------
    · כמה פסקאות, וכמה מהן יש בהן הדגשה
    · איפה מתחיל כל דף בתוך הקובץ (קובץ אחד לכל המסכת)
    · לדף שכבר סומן — השוואת מספר הפסקאות מול מה ששמור בגיליון

שימוש
-----
    python3 tools/word-probe.py
"""
import io
import os
import re
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'word-probe.txt')

DOCS = [
    {'mas': 'taanit', 'title': 'תענית', 'id': '1gD-7aD5Ri-jj4PDGXs1ygFYK3Lu_kbxq'},
    {'mas': 'megila', 'title': 'מגילה', 'id': '1DD_RzxyFPYzH_XdeiFSRC2E9wvuiiwfp'},
]

UA = {'User-Agent': 'Mozilla/5.0'}

# כותרת דף בתוך הקובץ: "דף ב", "דף ב עמוד א", "ב ע"א" וכדומה
DAF_HEAD = re.compile(r'^\s*(?:דף\s*)?([א-ת]{1,3})\s*(?:ע["״׳\']?([אב])|עמוד\s*([אב]))\s*[.:]?\s*$')


def fetch(fid):
    url = 'https://drive.google.com/uc?export=download&id=' + fid
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def paragraphs(buf):
    """פסקאות הקובץ, וכל אחת עם הריצות שלה ומצב ההדגשה שלהן.

    נקרא ישירות מה-XML ולא דרך ספרייה חיצונית: המבנה כאן פשוט,
    והתלות היחידה שהייתה נדרשת אינה מותקנת בשום מקום אחר בפרויקט.
    ההדגשה היא <w:b/> בתוך <w:rPr> של הריצה — תכונה מפורשת, לא
    מדידה של גובה אותיות."""
    z = zipfile.ZipFile(io.BytesIO(buf))
    xml = z.read('word/document.xml').decode('utf-8', 'replace')
    out = []
    for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S):
        runs = []
        for r in re.findall(r'<w:r[ >].*?</w:r>', p, re.S):
            pr = re.search(r'<w:rPr>.*?</w:rPr>', r, re.S)
            bold = bool(pr and re.search(r'<w:b[ />]', pr.group(0)))
            txt = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', r, re.S))
            txt = (txt.replace('&amp;', '&').replace('&lt;', '<')
                      .replace('&gt;', '>').replace('&quot;', '"'))
            if txt:
                runs.append({'t': txt, 'b': 1 if bold else 0})
        if runs:
            out.append(runs)
    return out


def text_of(runs):
    return ''.join(r['t'] for r in runs)


def main():
    log = []
    for d in DOCS:
        log.append('=' * 60)
        log.append('%s · %s' % (d['title'], d['id']))
        try:
            buf = fetch(d['id'])
        except Exception as e:
            log.append('  ✗ לא ירד: %s' % str(e)[:120])
            continue
        log.append('  %.0fKB' % (len(buf) / 1000.0))
        if buf[:2] != b'PK':
            log.append('  ✗ לא docx — התחלת הקובץ: %r' % buf[:40])
            continue

        paras = paragraphs(buf)
        bold = sum(1 for p in paras if any(r['b'] for r in p))
        runs = sum(len(p) for p in paras)
        log.append('  פסקאות: %d · ריצות: %d · פסקאות עם הדגשה: %d (%.0f%%)'
                   % (len(paras), runs, bold, 100.0 * bold / max(1, len(paras))))

        # איפה מתחיל כל דף
        heads = []
        for i, p in enumerate(paras):
            t = text_of(p).strip()
            m = DAF_HEAD.match(t)
            if m and len(t) < 22:
                heads.append((i, t))
        log.append('  כותרות דף שזוהו: %d' % len(heads))
        for i, t in heads[:40]:
            log.append('      פסקה %-5d %s' % (i, t))
        if len(heads) > 40:
            log.append('      … ועוד %d' % (len(heads) - 40))

        log.append('')
        log.append('  --- שתים-עשרה הפסקאות הראשונות ---')
        for i, p in enumerate(paras[:12]):
            t = text_of(p)
            mark = ''.join('B' if r['b'] else '.' for r in p)[:24]
            log.append('   %3d [%s] %s' % (i, mark, t[:90]))

        # דוגמה אמיתית להדגשה: הפסקה הראשונה שמערבת מודגש ורגיל
        log.append('')
        log.append('  --- הדגשה כפי שהיא כתובה בקובץ ---')
        shown = 0
        for i, p in enumerate(paras):
            if shown >= 3:
                break
            if any(r['b'] for r in p) and any(not r['b'] for r in p):
                log.append('   פסקה %d:' % i)
                for r in p[:10]:
                    log.append('      %s %s' % ('מודגש ' if r['b'] else 'רגיל  ',
                                                r['t'][:70]))
                shown += 1
        log.append('')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8').write('\n'.join(log) + '\n')
    print('\n'.join(log[:70]))
    print('\n→ docs/word-probe.txt')


if __name__ == '__main__':
    main()
