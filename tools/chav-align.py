#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
התאמת הסימונים שכבר נעשו אל קובץ הוורד המקורי של חברותא.

למה
---
הביאור נקרא היום מ-PDF, ושני דברים משוחזרים בו בניחוש: ההדגשות,
מגובה האותיות, והרווחים, מהמרווח בין הרצפים. הניחוש נכשל — וההבחנה
בין לשון הגמרא לבין הפירוש נעלמה מהמסך של התלמיד.

בוורד שניהם כתובים במפורש.

מה שחוסם החלפה פשוטה
--------------------
כל סימון שמור לפי **מספר פסקה**, ומספרי הפסקאות אינם זהים בין
שני המקורות: המרת ה-PDF מפצלת ומאחדת אחרת, ובנוסף הרכז פיצל
פסקאות ביד בתוך הסטודיו. בדף אחד מתוך ארבעה שנבדקו המספרים כבר
לא תואמים.

לכן ההתאמה כאן נעשית **לפי הטקסט**: לכל קטע נשמר גם הטקסט של
הביאור, ואותו מחפשים בוורד. הבדל של פסקה אחת פה או שם אינו משנה
דבר, כי שום דבר אינו נשען על ספירה.

מה הוא עושה — ומה לא
---------------------
הוא **אינו כותב לגיליון**. הוא קורא, מתאים, ומדווח: לכל קטע —
הטקסט, המספר הישן, מה נמצא בוורד, וכמה ההתאמה טובה. כל קטע שלא
נמצאה לו התאמה טובה מסומן במפורש.

התוצר השני הוא `docs/marks-word.json`: אותם סימונים בדיוק, עם
ה-HTML של הביאור **מהוורד** — כלומר עם ההדגשות האמיתיות. זה מה
שיוחלף בגיליון אחרי שהדוח ייבדק.

שימוש
-----
    python3 tools/chav-align.py
"""
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT = os.path.join(ROOT, 'docs', 'chav-align.txt')
FIXED = os.path.join(ROOT, 'docs', 'marks-word.json')

SHEET = '1OdC-qFaX3sK6nZMgmWWXb8LDUvQSir2ItZKt-f1yop0'
TAB = 'סימוני הדף'

WORD = {'taanit': '1gD-7aD5Ri-jj4PDGXs1ygFYK3Lu_kbxq',
        'megila': '1DD_RzxyFPYzH_XdeiFSRC2E9wvuiiwfp'}

UA = {'User-Agent': 'Mozilla/5.0'}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
        return r.read()


# ============================================================
# הגיליון
# ============================================================
def marks():
    """שורות לשונית הסימונים, דרך gviz — בלי מפתח ובלי סקריפט.

    הגיליון משותף לצפייה, וזו אותה דרך שהאפליקציה עצמה קוראת בה."""
    url = ('https://docs.google.com/spreadsheets/d/%s/gviz/tq?tqx=out:csv&sheet=%s'
           % (SHEET, urllib.parse.quote(TAB)))
    txt = get(url).decode('utf-8', 'replace')
    import csv
    rows = list(csv.reader(io.StringIO(txt)))
    return rows[0], rows[1:]


# ============================================================
# הוורד
# ============================================================
def docx_paragraphs(buf):
    """פסקאות, וכל אחת רשימת ריצות עם דגל הדגשה מפורש."""
    z = zipfile.ZipFile(io.BytesIO(buf))
    xml = z.read('word/document.xml').decode('utf-8', 'replace')
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
                runs.append({'t': t, 'b': 1 if bold else 0})
        if runs:
            out.append(runs)
    return out


DAF_HEAD = re.compile(r'^\s*דף\s*([א-ת]{1,3})\s*[-–—]\s*([אב])\s*$')


def by_daf(paras):
    """{דף: [פסקאות של הדף כולו]} — שני העמודים יחד.

    הביאור בסטודיו נטען לדף שלם, והסימונים ממוספרים ברצף על פניו,
    ולכן החלוקה כאן היא לדף ולא לחצי דף."""
    text = [''.join(r['t'] for r in p) for p in paras]
    starts = []
    for i, t in enumerate(text):
        m = DAF_HEAD.match(t.strip())
        if m:
            starts.append((i, m.group(1)))
    out = {}
    for n, (i, daf) in enumerate(starts):
        end = len(paras)
        for j in range(n + 1, len(starts)):
            if starts[j][1] != daf:
                end = starts[j][0]
                break
        out.setdefault(daf, (i, end))
        out[daf] = (out[daf][0], max(out[daf][1], end))
    return {d: paras[a:b] for d, (a, b) in out.items()}


# ============================================================
# ההתאמה
# ============================================================
NOISE = re.compile(r'[\s֑-ׇ"\'׳״.,;:()\[\]־\-–—?!]+')


def norm(s):
    """טקסט להשוואה: בלי רווחים, פיסוק, ניקוד וטעמים.

    הכרחי — ה-PDF מוסיף ומוריד רווחים במקומות שרירותיים, וזו
    בדיוק הסיבה שהוא אינו מקור אמין."""
    return NOISE.sub('', s)


def para_text(p):
    return ''.join(r['t'] for r in p)


def find_span(chunks, want):
    """הרצף הרציף של פסקאות שהטקסט שלו מתאים ל-want.

    שתי החלטות שנקנו בכישלון אמיתי:

    · אין תקרה על מספר הפסקאות ברצף. הייתה כזו, והיא פסלה בדיוק
      את הקטעים הארוכים — סוגיה שנמשכת על חמישים פסקאות, שהיא
      בדיוק המקרה שבו טעות עולה ביוקר.

    · החיפוש הוא על **כל הדף** ולא קדימה בלבד. קטע `cont` הוא
      המשך של סוגיה שהתחילה בעמוד הקודם, והטקסט שלו יושב לפני
      הקטע שנבדק לפניו. חיפוש קדימה בלבד פשוט לא הגיע אליו.

    הגבול היחיד הוא האורך: מפסיקים להרחיב כשהצטבר יותר מהמבוקש."""
    w = norm(want)
    if not w:
        return None
    n = [norm(para_text(p)) for p in chunks]
    best = None
    for i in range(len(chunks)):
        acc = ''
        for j in range(i, len(chunks)):
            acc += n[j]
            if len(acc) > len(w) * 1.4:
                break
            if acc == w:
                return (i, j, 1.0)
            if w.startswith(acc) or acc.startswith(w):
                sc = min(len(acc), len(w)) / float(max(len(acc), len(w)))
                if not best or sc > best[2]:
                    best = (i, j, sc)
    return best


def html_of(chunks, a, b):
    """ה-HTML של הביאור מהוורד — עם ההדגשות האמיתיות."""
    out = []
    for p in chunks[a:b + 1]:
        s = ''
        for r in p:
            t = (r['t'].replace('&', '&amp;').replace('<', '&lt;')
                       .replace('>', '&gt;'))
            s += ('<b>' + t + '</b>') if r['b'] else t
        out.append('<p>' + s + '</p>')
    return ''.join(out)


def main():
    hdr, rows = marks()
    log = ['לשונית: %s · שורות: %d' % (TAB, len(rows)), '']
    docs, fixed = {}, []
    tot = good = weak = miss = 0

    for row in rows:
        if len(row) < 4 or not row[0]:
            continue
        mas, daf, page = row[0], row[1], row[2]
        blob = next((c for c in row if c.strip().startswith('{')), '')
        if not blob:
            continue
        try:
            rec = json.loads(blob)
        except Exception:
            log.append('%s %s %s — JSON שבור' % (mas, daf, page))
            continue
        steps = rec.get('steps') or []
        if not steps:
            fixed.append(row)
            continue

        if mas not in docs:
            if mas not in WORD:
                log.append('אין וורד ל-%s' % mas)
                continue
            docs[mas] = by_daf(docx_paragraphs(get(
                'https://drive.google.com/uc?export=download&id=' + WORD[mas])))
        key = re.sub(r'["\'׳״\s]', '', daf)
        chunks = docs[mas].get(key)
        if not chunks:
            log.append('%s דף %s — לא נמצא בוורד' % (mas, daf))
            continue

        log.append('=' * 58)
        log.append('%s · דף %s · עמוד %s · %d קטעים · %d פסקאות בוורד'
                   % (mas, daf, page, len(steps), len(chunks)))
        last = -1
        for n, st in enumerate(steps):
            c = st.get('c') or {}
            want = c.get('text') or ''
            tot += 1
            sp = find_span(chunks, want)
            if not sp:
                miss += 1
                log.append('  %2d  ✗ לא נמצא · «%s»' % (n, want[:60]))
                # מה יושב בוורד במקום שבו הקטע היה אמור להיות. בלי
                # זה "לא נמצא" הוא מבוי סתום; איתו רואים אם הנוסח
                # שונה, אם הקטע חסר, או אם זו תקלת התאמה.
                at = last + 1
                log.append('        בוורד סביב פסקה %d:' % at)
                for k in range(at, min(at + 4, len(chunks))):
                    log.append('          %d· %s' % (k, para_text(chunks[k])[:100]))
                continue
            a, b, sc = sp
            last = b
            tag = '✓' if sc >= 0.995 else ('~' if sc >= 0.9 else '✗')
            if sc >= 0.995:
                good += 1
            elif sc >= 0.9:
                weak += 1
            else:
                miss += 1
            log.append('  %2d  %s %s→%s  ישן %s-%s  %.0f%%  «%s»'
                       % (n, tag, a, b, c.get('from'), c.get('to'),
                          sc * 100, want[:46]))
            if sc >= 0.9:
                c['h'] = html_of(chunks, a, b)
                c['from'], c['to'] = a, b
        new = list(row)
        for i, cell in enumerate(new):
            if cell.strip().startswith('{'):
                new[i] = json.dumps(rec, ensure_ascii=False)
                break
        fixed.append(new)

    log.insert(1, 'קטעים: %d · מדויק: %d · קרוב: %d · נכשל: %d'
               % (tot, good, weak, miss))
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    io.open(REPORT, 'w', encoding='utf-8').write('\n'.join(log) + '\n')
    io.open(FIXED, 'w', encoding='utf-8').write(
        json.dumps({'cols': hdr, 'rows': fixed}, ensure_ascii=False) + '\n')
    print('\n'.join(log[:60]))
    print('\n→ docs/chav-align.txt · docs/marks-word.json')


if __name__ == '__main__':
    main()
