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
    found = {}
    for label, path, pat in (
            ('index.html', 'index.html', r"APP_VERSION\s*=\s*'([^']+)'"),
            ('sw.js', 'sw.js', r"CACHE_NAME\s*=\s*'hadaf-v([^']+)'"),
            # הסטודיו מחזיק מספר משלו, והוא היחיד שהרכז רואה על המסך.
            # כשהוא נשאר מאחור הוא משקר בדיוק ברגע שבו בודקים איזו
            # גרסה רצה — וזה כבר שלח אותנו לחפש באג במקום הלא נכון.
            ('studio.html', 'studio.html', r"STUDIO_VER\s*=\s*'([^']+)'"),
            # נדבק לכתובת של כל תמונת דף. כשהוא נשאר מאחור, מכשיר
            # שכבר פתח את הדף ממשיך להציג את התמונה הישנה — ואת
            # הסימונים החדשים עליה, במקום הלא נכון.
            ('data.js', 'data.js', r"DAF_REV\s*=\s*'([^']+)'")):
        m = re.search(pat, read(path))
        if not m:
            BAD.append('לא מצאתי מספר גרסה ב-%s' % label)
            return
        found[label] = m.group(1)
    if len(set(found.values())) > 1:
        BAD.append('גרסה לא מסונכרנת: %s — מכשירים יישארו על הקוד הישן'
                   % ' · '.join('%s=%s' % kv for kv in sorted(found.items())))
    else:
        OK.append('גרסה מסונכרנת בארבעת הקבצים (%s)'
                  % list(found.values())[0])


def check_dupe_vars():
    """שני `var` באותו שם באותו קובץ — משתנה אחד, וזה תמיד באג.

    קרה בפועל: `GONE` היה צבע ההבהוב של "שורה יצאה", ומאוחר יותר
    נוספה בשם הזה גם מפת המפתחות שנמחקו מהגיליון. ההצהרה השנייה
    ניצחה, הצבע נעשה אובייקט, ו-fill="[object Object]" פשוט לא
    צויר. שום שגיאה, שום סימן — פשוט הבהוב שלא הופיע.

    נבדקות רק הצהרות בעמודה הראשונה. `var` בתוך פונקציה הוא
    מקומי, וחזרה עליו לגיטימית.
    """
    for f in ('index.html', 'studio.html', 'learn.html', 'join.html'):
        path = os.path.join(ROOT, f)
        if not os.path.exists(path):
            continue
        seen, dupes = {}, []
        for i, line in enumerate(read(f).split('\n'), 1):
            m = re.match(r'var ([A-Za-z_$][\w$]*)\s*=', line)
            if not m:
                continue
            name = m.group(1)
            if name in seen:
                dupes.append('%s (שורות %d ו-%d)' % (name, seen[name], i))
            else:
                seen[name] = i
        if dupes:
            BAD.append('%s — שם מוצהר פעמיים: %s' % (f, ' · '.join(dupes)))
        else:
            OK.append('%s — אין שמות כפולים (%d משתנים)' % (f, len(seen)))


# שמות שמופיעים ב-class= ואין להם כלל CSS — וזה בסדר.
# חלקם ערכי השוואה בתוך ביטוי JS שנכנסו למחרוזת ("state.filter
# === 'warm'"), וחלקם מחלקות שמשמשות רק כמזהה ל-querySelector
# ואינן מעצבות דבר. הרשימה קפואה בכוונה: כל שם **חדש** שנופל
# לכאן הוא כנראה כלל שנמחק, ולכן הוא נכשל.
KNOWN_CLASSLESS = {
    'index.html': {'all', 'ce-n', 'ce-r', 'cls', 'current', 'new', 'pi',
                   'raffle', 's-', 'tone', 'warm'},
    'join.html': {'dad', 'kid', 'cls'},
    'studio.html': {'mh', 'ml'},
}


def check_orphan_classes():
    """מחלקה שמופיעה ב-HTML ואין לה כלל CSS — סימן לכלל שנמחק.

    קרה בפועל, ובגדול. מחיקה של `.linkbox` נעשתה בחיתוך בין שני
    עוגנים, והטווח בלע איתו שבעה כללים אחרים: `.fold`, `.wantbar`,
    `.byline`, `.foldh`, `.cp`, `.qas`, `.qback`.

    שום דבר לא זרק שגיאה. `.fold` הוא מה שמחזיק את מגירת הגמרות
    סגורה (max-height:0 · overflow:hidden), ובלעדיו היא נפתחה על
    פני כל מסך ההרשמה — תמונות הכריכה, המחירים והשדות זה על גבי
    זה. הקוד רץ נקי, בדיקת העשן עברה, והמסך היה הרוס.

    בדיקה סטטית וזולה, ותופסת בדיוק את המקרה הזה.
    """
    ident = re.compile(r'^[a-z][a-z0-9-]*$')
    for f in ('index.html', 'join.html', 'board.html', 'learn.html',
              'studio.html', 'rights.html', 'masa.html'):
        if not os.path.exists(os.path.join(ROOT, f)):
            continue
        t = read(f)
        if '<style>' not in t:
            continue
        css = t[t.index('<style>'):t.index('</style>')]
        rules = set(re.findall(r'\.([A-Za-z][\w-]*)', css))
        used = set()
        for m in re.findall(r'class="([^"]*)"', t):
            for c in re.split(r"[\s']+", m):
                if ident.match(c or ''):
                    used.add(c)
        gone = sorted(used - rules - KNOWN_CLASSLESS.get(f, set()))
        if gone:
            BAD.append('%s — מחלקה בלי שום כלל CSS (כלל שנמחק?): %s'
                       % (f, ', '.join(gone)))
        else:
            OK.append('%s — כל המחלקות מעוצבות' % f)


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


def check_shared_globals():
    """קובץ משותף שנשען על משהו שקיים רק בעמוד אחד.

    זו התקלה שעלתה ביוקר: `stage.js` בונה את הבאנר גם בעמוד הראשי
    וגם במסך התלמיד, והוא קרא ל-`weekIndex()` — פונקציה שמוגדרת
    **רק ב-index.html**. במסך התלמיד היא לא קיימת, הנפילה לאחור
    החזירה שבוע 1, ולכן התלמיד היה רואה לנצח את הדף של השבוע
    הראשון בעוד שכל שאר המסך מדבר על השבוע האמיתי.

    שום דבר לא נזרק, שום דבר לא נצבע באדום, ואי אפשר לראות את זה
    בקריאת הקוד — צריך לדעת איזה עמוד טוען מה.

    הבדיקה: לכל קובץ .js משותף, אוספים על מי הוא נשען דרך
    `typeof X === 'function'` — הדפוס שמסמן "אולי לא קיים" — ואז
    בודקים שהשם הזה מוגדר באחד הקבצים ש**כל** העמודים הטוענים
    אותו טוענים גם כן. שם שאינו כזה הוא נפילה שקטה שמחכה.
    """
    pages = [f for f in os.listdir(ROOT) if f.endswith('.html')]
    loads, inline = {}, {}
    for pg in pages:
        try:
            html = read(pg)
        except Exception:
            continue
        loads[pg] = re.findall(r'<script src="([a-z0-9_-]+\.js)"', html)
        inline[pg] = set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', html))

    shared = sorted({j for v in loads.values() for j in v})
    defs = {}
    for j in shared:
        try:
            defs[j] = set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(', read(j)))
        except Exception:
            defs[j] = set()

    holes = []
    for j in shared:
        src = read(j)
        used = set(re.findall(r"typeof\s+([A-Za-z_$][\w$]*)\s*===\s*'function'", src))
        if not used:
            continue
        users = [pg for pg, lst in loads.items() if j in lst]
        if not users:
            continue
        for name in sorted(used):
            if name in defs[j]:
                continue
            # באילו קבצים משותפים השם מוגדר
            where = [o for o in shared if name in defs[o]]
            # האם כל עמוד שטוען את j טוען גם אחד מהם
            missing = [pg for pg in users
                       if name not in inline.get(pg, set())
                       and not any(o in loads[pg] for o in where)]
            if missing:
                holes.append((j, name, sorted(missing)))

    if holes:
        for j, name, missing in holes:
            WARN.append('%s נשען על %s() — אינו נטען ב: %s'
                        % (j, name, ', '.join(missing)))
    else:
        OK.append('קבצים משותפים — אין תלות בפונקציה שחסרה בעמוד כלשהו')


def main():
    for fn in (check_version, check_dupe_vars, check_orphan_classes,
               check_shared_globals,
               check_decks, check_daf_index,
               check_calendar):
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
