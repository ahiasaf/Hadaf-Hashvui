#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מאגר הביאור, מקובצי הוורד המקוריים.

למה
---
עד עכשיו הסטודיו בנה את הביאור מקובץ PDF, ושני דברים שה-PDF אינו
שומר שוחזרו בניחוש: **ההדגשות**, מגובה האותיות, ו**הרווחים**,
מהמרווח בין הרצפים.

הניחוש נכשל. בתענית דף ג ע"א הוא יצא ריק לגמרי — חמישה-עשר קטעים
בלי הדגשה אחת, כלומר תלמיד שרואה גוש טקסט אחד ואינו יודע מה לשון
הגמרא ומה הפירוש.

בקובץ הוורד שניהם כתובים במפורש. `<w:b/>` הוא הדגשה, ורווח הוא
רווח. אין מה לנחש.

מה נוצר
-------
    chav/<מסכת>/<דף>.json      הפסקאות של הדף, עם ההדגשות

קובץ לדף ולא למסכת: הסטודיו פותח דף אחד בכל פעם, וקובץ של מסכת
שלמה היה שני מגה־בייט לכל פתיחה.

המבנה דחוס בכוונה — `[[טקסט, מודגש], …]` לכל פסקה ולא אובייקטים
עם שמות שדות, כי השמות חוזרים עשרים אלף פעם ומכפילים את הקובץ.

שימוש
-----
    python3 tools/build-chavruta.py                # שתי המסכתות
    python3 tools/build-chavruta.py taanit         # אחת

הקבצים משותפים לצפייה בדרייב, ולכן אין צורך בסקריפט ובהרשאות.
"""
import io
import json
import os
import re
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'chav')

DOCS = {
    'taanit': {'title': 'תענית', 'id': '1gD-7aD5Ri-jj4PDGXs1ygFYK3Lu_kbxq'},
    'megila': {'title': 'מגילה', 'id': '1DD_RzxyFPYzH_XdeiFSRC2E9wvuiiwfp'},
}

UA = {'User-Agent': 'Mozilla/5.0'}

# הכותרת כפי שהיא כתובה בקובץ בפועל: "דף ב - א"
DAF_HEAD = re.compile(r'^\s*דף\s*([א-ת]{1,3})\s*[-–—]\s*([אב])\s*$')


def fetch(fid):
    url = 'https://drive.google.com/uc?export=download&id=' + fid
    with urllib.request.urlopen(
            urllib.request.Request(url, headers=UA), timeout=240) as r:
        return r.read()


def paragraphs(buf):
    """פסקאות, וכל אחת רשימת ריצות עם דגל הדגשה מפורש.

    נקרא ישירות מה-XML: המבנה פשוט, והתלות היחידה שהייתה נדרשת
    אינה מותקנת בשום מקום אחר בפרויקט."""
    xml = zipfile.ZipFile(io.BytesIO(buf)).read(
        'word/document.xml').decode('utf-8', 'replace')
    out = []
    for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S):
        runs = []
        for r in re.findall(r'<w:r[ >].*?</w:r>', p, re.S):
            pr = re.search(r'<w:rPr>.*?</w:rPr>', r, re.S)
            bold = bool(pr and re.search(r'<w:b[ />]', pr.group(0)))
            t = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', r, re.S))
            t = (t.replace('&amp;', '&').replace('&lt;', '<')
                  .replace('&gt;', '>').replace('&quot;', '"'))
            if t:
                # ריצות סמוכות באותו מצב מתאחדות: הוורד מפצל אותן
                # לפי עיצוב פנימי שאינו מעניין אותנו, וזה מנפח
                if runs and runs[-1][1] == (1 if bold else 0):
                    runs[-1][0] += t
                else:
                    runs.append([t, 1 if bold else 0])
        if runs:
            out.append(runs)
    return out


def daf_key(d):
    return re.sub(r'["\'׳״\s]', '', d)


def by_daf(paras):
    """{דף: פסקאות הדף כולו}.

    שני העמודים יחד ובלי שורות הכותרת: הסטודיו טוען ביאור לדף
    שלם, והסימונים ממוספרים ברצף על פניו."""
    heads = []
    for i, p in enumerate(paras):
        m = DAF_HEAD.match(''.join(r[0] for r in p).strip())
        if m:
            heads.append((i, m.group(1)))
    out = {}
    for n, (i, daf) in enumerate(heads):
        end = heads[n + 1][0] if n + 1 < len(heads) else len(paras)
        k = daf_key(daf)
        out.setdefault(k, [])
        # הכותרת עצמה נשמרת: הסימונים הקיימים כוללים אותה בפסקה
        # הראשונה של הדף, והשמטתה הייתה מזיזה כל אינדקס באחד.
        out[k] += paras[i:end]
    return out


def main():
    want = sys.argv[1] if len(sys.argv) > 1 else None
    if want and want not in DOCS:
        print('אין מסכת בשם "%s". הקיימות: %s' % (want, ', '.join(DOCS)))
        return 1

    total = 0
    for mas, d in DOCS.items():
        if want and mas != want:
            continue
        print('%s:' % d['title'])
        try:
            buf = fetch(d['id'])
        except Exception as e:
            print('  ✗ לא ירד: %s' % str(e)[:120])
            return 1
        if buf[:2] != b'PK':
            print('  ✗ לא docx · %d בתים' % len(buf))
            return 1

        dapim = by_daf(paragraphs(buf))
        out = os.path.join(OUT, mas)
        os.makedirs(out, exist_ok=True)
        for k in sorted(dapim, key=lambda x: (len(x), x)):
            paras = dapim[k]
            path = os.path.join(out, k + '.json')
            io.open(path, 'w', encoding='utf-8').write(
                json.dumps(paras, ensure_ascii=False, separators=(',', ':')))
            total += 1
        bold = sum(1 for ps in dapim.values() for p in ps
                   if any(r[1] for r in p))
        n = sum(len(ps) for ps in dapim.values())
        print('  %d דפים · %d פסקאות · %d מהן עם הדגשה (%.0f%%)'
              % (len(dapim), n, bold, 100.0 * bold / max(1, n)))

    print('\n%d קבצים ב-chav/' % total)
    return 0


if __name__ == '__main__':
    sys.exit(main())
