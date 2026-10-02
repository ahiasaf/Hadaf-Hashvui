#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
אילו קבצי דרייב הסקריפט מוכן להגיש בלי סיסמה (`?file=<id>`).

הענף `file` ב-doGet מחזיר בייטים מהדרייב של הרכז. בלי רשימה,
כל מי שהחזיק מזהה של קובץ כלשהו בדרייב — גם פרטי — קיבל אותו.
עכשיו רק מה שמופיע כאן: צורת הדף ופירוש החברותא מ-links.js,
שהם נכסי הלמידה הציבוריים. עם סיסמת הסקריפט (READ_KEY) — הכול,
כמו קודם.

הרשימה נכתבת לתוך apps-script.gs בין שני הסמנים, ולכן שינוי
ב-links.js מחייב להריץ את זה — וזה נוגע ב-apps-script.gs, מה
שפורס את הסקריפט מחדש. `tools/preflight.py` נופל כשהם לא תואמים.

    python3 tools/pub-files.py          # כותב
    python3 tools/pub-files.py --check  # רק בודק
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GS = os.path.join(ROOT, 'apps-script.gs')
BEGIN, END = '/* PUB_FILES:BEGIN', '/* PUB_FILES:END */'


def wanted():
    src = io.open(os.path.join(ROOT, 'links.js'), encoding='utf-8').read()
    return sorted(set(re.findall(r'/d/([-\w]{20,})', src)))


def block(ids):
    return (BEGIN + ' — נוצר ע"י tools/pub-files.py מתוך links.js. לא לערוך ביד. */\n'
            'var PUB_FILES = {\n' +
            ',\n'.join("  '%s':1" % i for i in ids) + '\n};\n' + END)


def current(gs):
    m = re.search(re.escape(BEGIN) + r'.*?' + re.escape(END), gs, re.S)
    return m


def main():
    gs = io.open(GS, encoding='utf-8').read()
    m = current(gs)
    want = block(wanted())
    if '--check' in sys.argv:
        ok = bool(m) and m.group(0) == want
        print('OK' if ok else 'STALE')
        sys.exit(0 if ok else 1)
    if not m:
        sys.exit('לא מצאתי את הסמנים ב-apps-script.gs')
    gs = gs[:m.start()] + want + gs[m.end():]
    io.open(GS, 'w', encoding='utf-8').write(gs)
    print('נכתבו %d מזהים' % len(wanted()))


if __name__ == '__main__':
    main()
