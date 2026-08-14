#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
כתיבת הסימונים המותאמים לוורד חזרה לגיליון.

זה השלב היחיד בכל השרשרת שכותב. כל השאר קוראים ומדווחים.

סדר הפעולות, ולא במקרה
----------------------
1. קוראים את הלשונית **כפי שהיא עכשיו** ושומרים אותה כקובץ גיבוי
   בריפו. רק אחרי שהגיבוי נשמר ממשיכים.
2. משווים: אותו מספר שורות, אותם מפתחות (מסכת·דף·עמוד), ואותו
   מספר קטעים בכל שורה. שינוי במספרים = משהו לא בסדר, ועוצרים.
3. רק אז כותבים.

הזהירות אינה מוגזמת: `writeTable_` שבסקריפט **מוחק את הלשונית
וכותב אותה מחדש**. שגיאה כאן אינה מקלקלת שורה אחת אלא את הכל,
וזה כבר קרה פעם.

מה משתנה בפועל
--------------
רק `c.h` — ה-HTML של הביאור — ו-`c.from`/`c.to`. הטקסט, הסימון
על הדף (`g`), ונקודות העצירה — נשארים בדיוק כפי שהיו.

שימוש
-----
    python3 tools/chav-apply.py            # יבש: משווה ולא כותב
    python3 tools/chav-apply.py write      # כותב
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXED = os.path.join(ROOT, 'docs', 'marks-word.json')
BACKUP = os.path.join(ROOT, 'docs', 'marks-backup.json')

TAB = 'סימוני הדף'
UA = {'User-Agent': 'Mozilla/5.0'}


def js_value(path, name):
    src = io.open(path, encoding='utf-8').read()
    i = src.index('var ' + name)
    j = src.index('=', i) + 1
    head = src[j:j + 400].lstrip()
    q = head[0]
    return head[1:head.index(q, 1)]


def sheet_id():
    return js_value(os.path.join(ROOT, 'data.js'), 'SHEET_ID')


def read_now():
    # מונע מטמון: gviz מחזיק תשובה, ובדיקה אחרי כתיבה שקוראת עותק
    # ישן הייתה מדווחת "לא נכתב" על כתיבה שהצליחה — או גרוע מזה,
    # "נכתב" על כתיבה שנכשלה.
    url = ('https://docs.google.com/spreadsheets/d/%s/gviz/tq?tqx=out:csv&sheet=%s&_=%d'
           % (sheet_id(), urllib.parse.quote(TAB), int(time.time() * 1000)))
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        txt = r.read().decode('utf-8', 'replace')
    import csv
    rows = list(csv.reader(io.StringIO(txt)))
    return rows[0], rows[1:]


def key_of(r):
    return '|'.join(r[:3])


def steps_of(r):
    blob = next((c for c in r if c.strip().startswith('{')), '')
    if not blob:
        return -1
    try:
        return len((json.loads(blob).get('steps') or []))
    except Exception:
        return -2


def main():
    write = len(sys.argv) > 1 and sys.argv[1] == 'write'
    new = json.load(io.open(FIXED, encoding='utf-8'))
    cols, rows = new['cols'], new['rows']

    hdr, cur = read_now()
    io.open(BACKUP, 'w', encoding='utf-8').write(
        json.dumps({'cols': hdr, 'rows': cur}, ensure_ascii=False) + '\n')
    print('גיבוי: docs/marks-backup.json · %d שורות' % len(cur))

    # ההשוואה. כל אי-התאמה עוצרת — אין תיקון אוטומטי כאן בכוונה.
    bad = []
    if len(cur) != len(rows):
        bad.append('מספר שורות: בגיליון %d, בקובץ %d' % (len(cur), len(rows)))
    if hdr != cols:
        bad.append('כותרות שונות: %s מול %s' % (hdr, cols))
    for a, b in zip(cur, rows):
        if key_of(a) != key_of(b):
            bad.append('מפתח שונה: %s מול %s' % (key_of(a), key_of(b)))
        elif steps_of(a) != steps_of(b):
            bad.append('%s — קטעים: %d בגיליון, %d בקובץ'
                       % (key_of(a), steps_of(a), steps_of(b)))
    if bad:
        print('\nעצירה — הנתונים אינם תואמים:')
        for x in bad[:20]:
            print('  · ' + x)
        return 1

    same = sum(1 for a, b in zip(cur, rows) if a == b)
    print('%d שורות תואמות במפתח ובמספר הקטעים · %d ללא שינוי · %d משתנות'
          % (len(rows), same, len(rows) - same))

    if not write:
        print('\nריצה יבשה. להרצה אמיתית: chav-apply.py write')
        return 0

    api = js_value(os.path.join(ROOT, 'data.js'), 'APPS_SCRIPT_URL').strip()
    # גוף JSON, ובדיוק באותה צורה שבה האפליקציה שולחת: `doPost`
    # עושה JSON.parse על גוף הבקשה, ו-`cols`/`rows` הם מחרוזות
    # מקוננות. טופס urlencode נפל שם בשקט ולא נכתב דבר.
    body = json.dumps({'action': 'table', 'tab': TAB,
                       'cols': json.dumps(cols, ensure_ascii=False),
                       'rows': json.dumps(rows, ensure_ascii=False)},
                      ensure_ascii=False).encode('utf-8')
    head = dict(UA)
    head['Content-Type'] = 'text/plain;charset=utf-8'
    req = urllib.request.Request(api, data=body, headers=head)
    with urllib.request.urlopen(req, timeout=300) as r:
        print('תשובת הסקריפט:', r.read().decode('utf-8', 'replace')[:300])

    # ואימות אמיתי: לא רק שהשורות שם, אלא שה**תוכן** הוחלף.
    # ספירת ההדגשות היא המדד הישיר — היא בדיוק מה שהתיקון הזה מוסיף.
    time.sleep(4)
    hdr2, after = read_now()
    if len(after) != len(rows):
        print('אזהרה: אחרי הכתיבה יש %d שורות ולא %d' % (len(after), len(rows)))
        return 1
    want = bolds(rows)
    got = bolds(after)
    print('אומת: %d שורות · הדגשות בגיליון %d, ציפיתי %d' % (len(after), got, want))
    if got != want:
        print('הכתיבה לא נכנסה. הגיבוי ב-docs/marks-backup.json.')
        return 1
    return 0


def bolds(rows):
    import re
    n = 0
    for r in rows:
        b = next((c for c in r if c.strip().startswith('{')), '')
        if not b:
            continue
        try:
            o = json.loads(b)
        except Exception:
            continue
        for s in (o.get('steps') or []):
            n += len(re.findall(r'<b>', (s.get('c') or {}).get('h') or ''))
    return n


if __name__ == '__main__':
    sys.exit(main())
