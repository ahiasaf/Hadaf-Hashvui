#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
בדיקה לפני פרסום — הדברים שנשברים בשקט.

למה זה קיים
-----------
לפרויקט הזה אין שלב בנייה ואין רץ בדיקות, וזו החלטה נכונה: קובץ
HTML אחד לכל אפליקציה, `git push` הוא הפריסה. המחיר הוא שאין שום
דבר שעוצר טעות לפני שהיא מגיעה לטלפון של תלמיד.

הבדיקות כאן אינן מכסות לוגיקה. הן מכסות בדיוק את סוג התקלה
שאי־אפשר לראות בעין מהקוד: הפניה לקובץ שאינו קיים, ומספר גרסה
שנשכח. שתיהן נראות תקינות לגמרי בקריאה, ושתיהן שוברות מסך שלם.

שימוש
-----
    python3 tools/preflight.py

יוצא בקוד 1 אם משהו נכשל, ולכן אפשר לתלות בו CI.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OK, BAD, WARN = [], [], []


def read(*p):
    return io.open(os.path.join(ROOT, *p), encoding='utf-8').read()


def check_version():
    """גרסת האפליקציה וגרסת המטמון חייבות להיות זהות.

    זו התקלה היקרה ביותר כאן, והיא שקטה לחלוטין: `CACHE_NAME` הוא
    מה שמוחק את המטמון הישן. אם הוא נשאר מאחור, מכשיר שכבר ביקר
    באתר ימשיך להגיש את הקוד הישן מהמטמון — ובחיבור איטי זה קורה
    תמיד, כי ל"מהרשת קודם" יש פסק זמן של 2.5 שניות.
    """
    app = re.search(r"APP_VERSION\s*=\s*'([^']+)'", read('index.html'))
    cache = re.search(r"CACHE_NAME\s*=\s*'hadaf-v([^']+)'", read('sw.js'))
    if not app or not cache:
        BAD.append('לא מצאתי את מספרי הגרסה')
        return
    if app.group(1) != cache.group(1):
        BAD.append('גרסה לא מסונכרנת: index.html=%s אבל sw.js=%s — '
                   'מכשירים יישארו על הקוד הישן'
                   % (app.group(1), cache.group(1)))
    else:
        OK.append('גרסה מסונכרנת (%s)' % app.group(1))


def check_decks():
    """כל מצגת שמוגדרת ב-data.js — הקבצים שלה באמת שם.

    `deck:{dir,n}` אומר לאפליקציה לבקש 01.jpg עד n. שקף חסר אינו
    שגיאה בקוד — הוא ריבוע שבור על המסך, באמצע שיעור.
    """
    src = read('data.js')
    decks = re.findall(r"deck:\s*\{\s*dir:\s*'([^']+)'\s*,\s*n:\s*(\d+)", src)
    if not decks:
        WARN.append('לא נמצאה אף מצגת ב-data.js')
        return
    for d, n in decks:
        n = int(n)
        miss = [i for i in range(1, n + 1)
                if not os.path.exists(os.path.join(ROOT, d, '%02d.jpg' % i))]
        if miss:
            BAD.append('%s — חסרים שקפים: %s'
                       % (d, ', '.join('%02d.jpg' % i for i in miss)))
        else:
            OK.append('%s — %d שקפים' % (d, n))


def check_daf_index():
    """daf/index.json הוא מה ש-learn.html שואל לפני שהוא מבקש תמונה.

    ערך שאין מאחוריו קובץ שולח את התלמיד למסלול הדרייב האיטי, או
    למסך ריק. וקובץ שקיים בלי ערך באינדקס פשוט לא ייראה לעולם.
    """
    p = os.path.join(ROOT, 'daf', 'index.json')
    if not os.path.exists(p):
        WARN.append('אין daf/index.json')
        return
    idx = json.loads(io.open(p, encoding='utf-8').read())
    miss, orphan = [], []
    for mas, dapim in idx.items():
        for daf, amudim in dapim.items():
            for a in amudim:
                f = os.path.join(ROOT, 'daf', mas, '%s-%s.webp' % (daf, a))
                if not os.path.exists(f):
                    miss.append('%s/%s-%s' % (mas, daf, a))
        d = os.path.join(ROOT, 'daf', mas)
        if os.path.isdir(d):
            for f in os.listdir(d):
                m = re.match(r'^(.+)-([ab])\.webp$', f)
                if m and m.group(2) not in dapim.get(m.group(1), []):
                    orphan.append('%s/%s' % (mas, f))
    if miss:
        BAD.append('באינדקס אבל אין קובץ: ' + ', '.join(miss[:8]))
    if orphan:
        WARN.append('קובץ קיים אבל אינו באינדקס (לא ייראה): '
                    + ', '.join(orphan[:8]))
    # דף הוא תמיד שני עמודים. אחד בלבד הוא המרה שנקטעה באמצע,
    # והיא נראית תקינה כאן — הדף מופיע ברשימה, ורק מי שיגיע
    # לעמוד השני ימצא אותו חסר.
    half =['%s · דף %s (רק ע״%s)' % (mas, daf, 'א' if a == ['a'] else 'ב')
            for mas, dapim in idx.items()
            for daf, a in dapim.items() if len(a) < 2]
    if half:
        WARN.append('דף עם עמוד אחד בלבד: ' + ' · '.join(half[:8]))
    if not miss and not orphan:
        n = sum(len(a) for d in idx.values() for a in d.values())
        OK.append('מאגר הדף — %d עמודים, כולם קיימים' % n)


def check_calendar():
    """דף שהלוח מפנה אליו וחסר במאגר — התלמיד מגיע אליו בשבוע שלו.

    זו אזהרה ולא כישלון: המאגר נבנה בהדרגה בכוונה, ודף שטרם הומר
    עדיין עובד דרך הדרייב. אבל כדאי לדעת מראש על איזה שבוע מדובר.
    """
    src = read('data.js')
    p = os.path.join(ROOT, 'daf', 'index.json')
    if not os.path.exists(p):
        return
    idx = json.loads(io.open(p, encoding='utf-8').read())
    for name, mas in (('CAL_TAANIT', 'taanit'), ('CAL_MEGILA', 'megila')):
        m = re.search(name + r'\s*=\s*\[(.*?)\n\];', src, re.S)
        if not m:
            continue
        gone = []
        for wk, row in enumerate(re.findall(r'\[(.*?)\]', m.group(1), re.S), 1):
            cells = re.findall(r"'((?:[^'\\]|\\.)*)'", row)
            if len(cells) < 3:
                continue                      # שבוע בלי דף (חג) — null
            daf = cells[2].replace('\\', '').replace('"', '').replace("'", '')
            if daf in ('סיום',) or not daf:
                continue
            if daf not in idx.get(mas, {}):
                gone.append('שבוע %d · דף %s' % (wk, daf))
        if gone:
            WARN.append('%s — דפים שאינם במאגר: %s' % (mas, ' · '.join(gone)))


def main():
    for fn in (check_version, check_decks, check_daf_index, check_calendar):
        try:
            fn()
        except Exception as e:                # noqa: BLE001
            BAD.append('%s נפל: %s' % (fn.__name__, e))

    for x in OK:
        print('  \u2713 ' + x)
    for x in WARN:
        print('  ! ' + x)
    for x in BAD:
        print('  \u2717 ' + x)

    print()
    if BAD:
        print('נכשל: %d · אזהרות: %d' % (len(BAD), len(WARN)))
        return 1
    print('הכל תקין. אזהרות: %d' % len(WARN))
    return 0


if __name__ == '__main__':
    sys.exit(main())
