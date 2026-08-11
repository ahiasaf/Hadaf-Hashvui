#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
בדיקת מאגר הדפים — האם כל קישור מצביע על הקובץ הנכון.

למה
---
המערכת אינה מחזיקה עותק של הגמרא. `links.js` הוא כל המאגר: לכל
מסכת ולכל דף שני קישורי דרייב — צורת הדף והחברותא — והסטודיו
ומסך הלימוד מושכים מהם.

מכאן שתקלה של "מסכת מגילה מציגה דפי תענית" אינה יכולה להיות בקוד.
היא או קישור שהועתק לשורה הלא נכונה, או — וזה מה שקשה לראות —
קובץ בדרייב ששמו אומר מגילה ותוכנו תענית, או להפך.

הכלי הזה מושך את **שם** הקובץ בדרייב לכל קישור ומשווה אותו למקום
שבו הוא רשום. הוא אינו קורא את הקובץ עצמו, ולכן הוא מהיר וזול —
מה שהוא מוצא זה שם שאינו תואם, וזה בדיוק סוג התקלה שקרתה.

מה הוא בודק
-----------
    · קישור ריק או שאין ממנו מזהה
    · אותו קובץ רשום בשני מקומות
    · שם הקובץ אינו מזכיר את המסכת שבה הוא רשום
    · שם הקובץ אינו מזכיר את הדף שבו הוא רשום

שימוש
-----
    python3 tools/check-links.py                # הכול
    python3 tools/check-links.py megila         # מסכת אחת

הקבצים בדרייב צריכים להיות משותפים כ"כל מי שיש לו הקישור — מציג",
וזה ממילא המצב, אחרת האפליקציה לא הייתה מצליחה לפתוח אותם.
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# איך נקראת כל מסכת בשם קובץ. כמה כתיבים, כי הקבצים נאספו ביד.
MAS_WORDS = {
    'taanit': ['תענית', 'תעניות'],
    'megila': ['מגילה', 'מגלה', 'מגילא'],
}


def js_value(path, name):
    """שולף ערך מקובץ js בלי להריץ אותו."""
    src = open(path, encoding='utf-8').read()
    i = src.index('var ' + name)
    j = src.index('=', i) + 1
    head = src[j:j + 400].lstrip()
    if head[0] in '\'"':
        q = head[0]
        return head[1:head.index(q, 1)]
    open_c, close_c = ('{', '}') if head[0] == '{' else ('[', ']')
    k = src.index(open_c, j)
    depth, m = 0, k
    while m < len(src):
        if src[m] == open_c:
            depth += 1
        elif src[m] == close_c:
            depth -= 1
            if depth == 0:
                break
        m += 1
    return json.loads(src[k:m + 1])


def file_id(url):
    m = re.search(r'/d/([-\w]{20,})', str(url or ''))
    return m.group(1) if m else None


def drive_name(fid):
    """שם הקובץ, מתוך כותרת עמוד הצפייה של דרייב."""
    url = 'https://drive.google.com/file/d/%s/view' % fid
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=25) as r:
            page = r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return None, 'HTTP %s' % e.code
    except Exception as e:
        return None, str(e)[:60]

    m = re.search(r'<title>(.*?)</title>', page, re.S)
    if not m:
        return None, 'אין כותרת'
    name = html.unescape(m.group(1)).strip()
    # "שם הקובץ - Google Drive"
    name = re.sub(r'\s*-\s*Google Drive\s*$', '', name)
    if 'Sign in' in name or 'התחברות' in name:
        return None, 'לא משותף לצפייה'
    return name, None


# אותה נורמליזציה שבאפליקציה
def daf_key(d):
    return re.sub(r'["\'׳״\s]', '', str(d))


def daf_in(name, daf):
    """האם שם הקובץ מזכיר את הדף.

    ההשוואה היא על מילים שלמות ולא על הכלה, אחרת דף ב׳ נמצא בתוך
    כ״ב וכל שם עובר. הגרשיים מוסרים — כ״ב וכב הם אותו דף — אבל
    הרווחים נשמרים, כי הם הגבול."""
    words = [w for w in re.split(r'[^א-ת]+', re.sub(r'["\'׳״]', '', name)) if w]
    return daf_key(daf) in words


def main():
    links = js_value(os.path.join(ROOT, 'links.js'), 'DAF_LINKS')
    only = sys.argv[1] if len(sys.argv) > 1 else None

    seen, problems, checked = {}, [], 0

    for mas, dapim in links.items():
        if only and mas != only:
            continue
        words = MAS_WORDS.get(mas, [])
        print('\n%s' % mas)
        for daf, urls in dapim.items():
            for i, url in enumerate(urls):
                where = '%s · דף %s · %s' % (mas, daf, 'חברותא' if i else 'צורת הדף')
                fid = file_id(url)
                if not fid:
                    problems.append((where, 'אין קישור' if not url else 'קישור לא תקין'))
                    print('  ✗ %-28s אין קישור' % ('דף %s · %s' % (daf, 'חברותא' if i else 'צורת הדף')))
                    continue
                if fid in seen:
                    problems.append((where, 'אותו קובץ כמו: ' + seen[fid]))
                    print('  ✗ %-28s אותו קובץ כמו %s' % ('דף %s' % daf, seen[fid]))
                    continue
                seen[fid] = where

                name, err = drive_name(fid)
                checked += 1
                if err:
                    problems.append((where, err))
                    print('  ? %-28s %s' % ('דף %s' % daf, err))
                    continue

                bad = []
                if words and not any(w in name for w in words):
                    bad.append('לא כתובה בו המסכת')
                if not daf_in(name, daf):
                    bad.append('לא כתוב בו דף %s' % daf)
                if bad:
                    problems.append((where, '%s — "%s"' % (' · '.join(bad), name)))
                    print('  ✗ דף %-4s %-9s %s → "%s"' %
                          (daf, 'חברותא' if i else 'צורת הדף', ' · '.join(bad), name))
                else:
                    print('  ✓ דף %-4s %-9s %s' % (daf, 'חברותא' if i else 'צורת הדף', name))

    print('\n' + '=' * 52)
    print('נבדקו %d קבצים · %d בעיות' % (checked, len(problems)))
    if problems:
        print('\nמה לתקן:')
        for where, why in problems:
            print('  · %s\n      %s' % (where, why))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
