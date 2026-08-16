#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
בניית מאגר צורות הדף שהאתר מגיש בעצמו.

למה
---
עד עכשיו מסך הלימוד משך כל דף מהדרייב דרך ה-Apps Script של הרכז.
זה נכון לסטודיו — משתמש אחד, קבצים פרטיים — ושגוי לתלמידים: הסקריפט
מוגבל בריצות מקבילות, כל בקשה קוראת PDF של מגבייט ומקודדת אותו,
והכל רץ על חשבון גוגל אחד. שיעור שבו שלושים תלמידים פותחים את הדף
באותה דקה נתקע.

תמונה סטטית מהאתר היא הפוכה בכל פרמטר: CDN, בלי מכסה, בלי צוואר,
עובדת אופליין דרך ה-Service Worker, ומהירה בהרבה — 400KB במקום PDF
של 2MB שצריך לצייר בדפדפן.

מה נוצר
-------
    daf/<מסכת>/<דף>-a.webp      צורת הדף, עמוד א׳
    daf/<מסכת>/<דף>-b.webp      צורת הדף, עמוד ב׳
    daf/index.json              מה קיים, כדי שהאתר ידע בלי לנחש

שם הדף במפתח הוא בלי גרשיים — `dafKey` שבאפליקציה — כדי שיתאים
לכל וריאציות הכתיב שבלוח השנה.

הרוחב
-----
1600px. במדידה על תענית ב׳/ה׳/י׳/כ׳ מרווח השורה הוא 33px ברוחב
2539; ב-1600 הוא 21px — מספיק לקריאה בזום, וכ-350KB לעמוד. הזיהוי
עצמו כבר נעשה בסטודיו והקואורדינטות מנורמלות, ולכן הרוחב כאן הוא
החלטה של חדות בלבד ואינו משפיע על הסימונים.

שימוש
-----
    python3 tools/build-library.py                 # הכול
    python3 tools/build-library.py taanit          # מסכת אחת
    python3 tools/build-library.py taanit ב ג ד    # דפים מסוימים

צריך `pdftoppm` (poppler) ו-Pillow. הכתובת של ה-Apps Script נלקחת
מ-`data.js`, והקישורים מ-`links.js` — אותם קבצים שהאפליקציה
משתמשת בהם, בלי רשימה נפרדת.

הקבצים נמשכים דרך הסקריפט של הרכז ולכן הכלי רץ אצלו, לא כאן.
"""
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'daf')
INDEX = os.path.join(OUT, 'index.json')

WIDTH = 1600
# בנייה מחדש של דף שכבר קיים. נחוץ כששיטת ההמרה משתנה — למשל
# כשנוסף חיתוך השוליים — ואחרת הכלי מדלג על הכל ואומר "קיים".
FORCE = False
DPI = 200
QUALITY = 82
AMUD = ['a', 'b']


def js_value(path, name):
    """שולף ערך מקובץ js בלי להריץ אותו."""
    src = open(path, encoding='utf-8').read()
    i = src.index('var ' + name)
    j = src.index('=', i) + 1
    # מחרוזת פשוטה, או אובייקט/מערך עד הסוגר המאזן
    head = src[j:j + 400].lstrip()
    if head[0] in '\'"':
        q = head[0]
        return head[1:head.index(q, 1)]
    open_c, close_c = ('{', '}') if head[0] == '{' else ('[', ']')
    k = src.index(open_c, j)
    depth, m = 0, k
    while m < len(src):
        if src[m] == open_c: depth += 1
        elif src[m] == close_c:
            depth -= 1
            if depth == 0: break
        m += 1
    return json.loads(src[k:m + 1])


def daf_key(d):
    return re.sub(r'["\'׳״\s]', '', d)


def file_id(url):
    m = re.search(r'/d/([-\w]{20,})', url or '')
    return m.group(1) if m else None


def grab(api, fid):
    """מושך קובץ מהדרייב דרך הסקריפט, ומחזיר בייטים.

    עם ניסיונות חוזרים, וזה לא מותרות: הסקריפט של הרכז מוגבל
    בריצות מקבילות ובזמן, ובריצה על מסכת שלמה חלק מהדפים נופלים
    באמצע — לא מפני שמשהו שבור אלא מעומס רגעי. בריצה הראשונה על
    תענית נבנו 15 דפים מתוך 30 בדיוק מהסיבה הזאת."""
    url = api + ('&' if '?' in api else '?') + 'file=' + fid
    last = ''
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                d = json.loads(r.read().decode('utf-8'))
            if d.get('status') == 'ok' and d.get('data'):
                return base64.b64decode(d['data']), d.get('name', '')
            last = d.get('message') or 'no data'
        except Exception as e:
            last = str(e)[:90]
        if i < 3:
            time.sleep(5 * (i + 1))
    raise RuntimeError(last)


# כמה שוליים להשאיר סביב הדיו, כשבר מרוחב הדף.
MARGIN = 0.015


def trim(im):
    """חיתוך השוליים הלבנים.

    קובצי המקור אינם ממורכזים: נמדד על כל 119 העמודים שכבר הומרו —
    כ-9.6% לבן משמאל וכ-33.4% מימין, באופן עקבי. שליש מכל תמונה היה
    ריק, והדף הוצג קטן ממה שהוא יכול בשליש.

    וזה לא רק בזבוז מקום: הסימונים נשמרים כשבר מרוחב התמונה, ולכן
    שוליים שונים בין שתי תמונות של אותו דף מזיזים כל סימון. ככל
    שהתמונה צמודה לדיו, כך היא תלויה פחות בגחמות של קובץ המקור.

    החיתוך נעשה על התמונה בגווני אפור לפני ההקטנה, כדי שההקטנה
    תנצל את כל 1600 הפיקסלים לדיו עצמו ולא לשוליים.
    """
    from PIL import Image, ImageChops
    g = im.convert('L')
    # הדף לבן על שחור לצורך getbbox — הוא מחפש את מה שאינו אפס.
    inv = ImageChops.invert(g).point(lambda v: 255 if v > 90 else 0)
    box = inv.getbbox()
    if not box:
        return im
    pad = round(im.width * MARGIN)
    return im.crop((max(0, box[0] - pad), max(0, box[1] - pad),
                    min(im.width,  box[2] + pad),
                    min(im.height, box[3] + pad)))


def to_webp(png, dst):
    from PIL import Image
    im = trim(Image.open(png))
    if im.width != WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    # גווני אפור: הדפים שחור-לבן, וצבע רק מנפח את הקובץ
    im.convert('L').save(dst, 'WEBP', quality=QUALITY, method=6)
    return os.path.getsize(dst)


def build(api, mas, daf, urls, idx):
    fid = file_id(urls[0] if urls else None)
    if not fid:
        print('  %s %-4s  אין קישור' % (mas, daf)); return False
    key = daf_key(daf)
    out = os.path.join(OUT, mas)
    os.makedirs(out, exist_ok=True)
    if not FORCE and all(os.path.exists(os.path.join(out, '%s-%s.webp' % (key, a)))
                         for a in AMUD):
        idx.setdefault(mas, {})[key] = AMUD
        print('  %s %-4s  קיים' % (mas, daf)); return True

    try:
        buf, name = grab(api, fid)
    except Exception as e:
        print('  %s %-4s  ✗ %s' % (mas, daf, e)); return False

    tmp = tempfile.mkdtemp()
    pdf = os.path.join(tmp, 'd.pdf')
    open(pdf, 'wb').write(buf)
    subprocess.run(['pdftoppm', '-r', str(DPI), '-png', pdf, os.path.join(tmp, 'p')],
                   check=True)
    pages = sorted(f for f in os.listdir(tmp) if f.endswith('.png'))
    if len(pages) != 2:
        print('  %s %-4s  אזהרה: %d עמודים בקובץ, ציפיתי לשניים'
              % (mas, daf, len(pages)))

    total, made = 0, []
    for i, f in enumerate(pages[:2]):
        dst = os.path.join(out, '%s-%s.webp' % (key, AMUD[i]))
        total += to_webp(os.path.join(tmp, f), dst)
        made.append(AMUD[i])
    idx.setdefault(mas, {})[key] = made
    print('  %s %-4s  %d עמודים · %.2fMB · «%s»'
          % (mas, daf, len(made), total / 1e6, name))
    return True


# שם המסכת בעברית עובד גם הוא. מי שמריץ את זה מהטלפון כותב
# "תענית" באופן טבעי, וקודם לכן הכלי פשוט לא עשה כלום ולא אמר למה.
ALIAS = {'תענית': 'taanit', 'מגילה': 'megila', 'מגלה': 'megila'}


if __name__ == '__main__':
    api = js_value(os.path.join(ROOT, 'data.js'), 'APPS_SCRIPT_URL').strip()
    links = js_value(os.path.join(ROOT, 'links.js'), 'DAF_LINKS')
    args = [a for a in sys.argv[1:] if a != 'force']
    FORCE = len(args) != len(sys.argv[1:])
    want_mas = args[0] if args else None
    want_daf = set(args[1:]) or None
    if want_mas:
        want_mas = ALIAS.get(want_mas.strip(), want_mas.strip())
        if want_mas not in links:
            print('אין מסכת בשם "%s".' % want_mas)
            print('הקיימות: %s (או בעברית: %s)'
                  % (', '.join(links), ', '.join(ALIAS)))
            sys.exit(1)

    idx = {}
    if os.path.exists(INDEX):
        idx = json.load(open(INDEX, encoding='utf-8'))

    bad = []
    for mas, dapim in links.items():
        if want_mas and mas != want_mas: continue
        print(mas + ':')
        for daf, urls in dapim.items():
            if want_daf and daf not in want_daf: continue
            if not build(api, mas, daf, urls, idx):
                bad.append('%s %s' % (mas, daf))

    os.makedirs(OUT, exist_ok=True)
    json.dump(idx, open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    n = sum(len(v) for v in idx.values())
    print('\n%d דפים במאגר · daf/index.json עודכן' % n)
    if bad:
        # מרוכז בסוף, כי בלוג ארוך שורת שגיאה בודדת נבלעת
        print('לא נבנו (%d): %s' % (len(bad), ' · '.join(bad)))
        print('הרצה חוזרת תנסה רק אותם.')
