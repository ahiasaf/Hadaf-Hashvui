#!/usr/bin/env python3
from project_paths import project_path, SOURCE
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
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OK, BAD, WARN = [], [], []


def read(*p):
    return io.open(project_path( *p), encoding='utf-8').read()


def check_version():
    """גרסת האפליקציה וגרסת המטמון חייבות להיות זהות.

    זו התקלה היקרה ביותר כאן, והיא שקטה לחלוטין: `CACHE_NAME` הוא
    מה שמוחק את המטמון הישן. אם הוא נשאר מאחור, מכשיר שכבר ביקר
    באתר ימשיך להגיש את הקוד הישן מהמטמון — ובחיבור איטי זה קורה
    תמיד, כי ל"מהרשת קודם" יש פסק זמן של 2.5 שניות.
    """
    found = {}
    for label, path, pat in (
            ('index.html', 'index.html', r"APP_VERSION\s*=\s*[\"']([^\"']+)[\"']"),
            ('sw.js', 'sw.js', r"CACHE_NAME\s*=\s*'hadaf-v([^']+)'"),
            # הסטודיו מחזיק מספר משלו, והוא היחיד שהרכז רואה על המסך.
            # כשהוא נשאר מאחור הוא משקר בדיוק ברגע שבו בודקים איזו
            # גרסה רצה — וזה כבר שלח אותנו לחפש באג במקום הלא נכון.
            ('studio.html', 'studio.html', r"STUDIO_VER\s*=\s*[\"']([^\"']+)[\"']"),
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
        path = project_path( f)
        if not os.path.exists(path):
            continue
        seen, dupes = {}, []
        for i, line in enumerate(read(f).split('\n'), 1):
            # `var X =` וגם `function X(` — שניהם מצהירים על אותו שם
            # גלובלי, והשני דורס את הראשון. זה קרה בפועל: `myInst`
            # היה מחרוזת (קוד הישיבה של הרכז), ונוספה פונקציה באותו
            # שם. ההצהרה של הפונקציה הורמה, ההשמה של המחרוזת רצה
            # אחריה ודרסה אותה — וכל קריאה יצאה
            # "myInst is not a function", בעמוד אחר לגמרי.
            m = (re.match(r'var ([A-Za-z_$][\w$]*)\s*=', line) or
                 re.match(r'function ([A-Za-z_$][\w$]*)\s*\(', line))
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
                   'raffle', 's-', 'tone', 'warm',
                   # ניהול תגיות — אותו דפוס בדיוק כמו ce-n/ce-r
                   # למעלה: מזהה ל-querySelector בלבד, מתעצב דרך
                   # ce-row/ce-x הקיימים.
                   'tg-row', 'tg-t', 'tg-team-c'},
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
              'studio.html', 'rights.html', 'masa.html', 'tiul.html', 'tzevet.html',
              'shlach.html', 'team.html', 'kishurim.html'):
        if not os.path.exists(project_path( f)):
            continue
        t = read(f)
        if '<style>' not in t:
            continue
        css = t[t.index('<style>'):t.index('</style>')]
        rules = set(re.findall(r'\.([A-Za-z][\w-]*)', css))
        if 'href="/mobile.css"' in t:
            rules.update(re.findall(r'\.([A-Za-z][\w-]*)', read('src/styles/mobile.css')))
        used = set()
        for m in re.findall(r'class="([^"]*)"', t):
            # מחלקה שנבנית בקוד — class="sw' + (showRow('plan') ? …
            # הביטוי כולו נלכד עד הגרש הבא, ומתוכו נשלפו "מחלקות"
            # שהן בעצם ארגומנטים של פונקציה. `plan` הוא מזהה ושם
            # מתג, לא מחלקה, והבודק צעק עליו בלי סיבה.
            # לכן: בערך שיש בו ביטוי — רק מה שלפניו.
            if '+' in m or '(' in m:
                m = re.split(r"['+(]", m)[0]
            for c in m.split():
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
                if not os.path.exists(project_path( d, '%02d.jpg' % i))]
        # **אזהרה, לא כישלון.** המחיקה לצמיתות בעורך המצגות (🗑, ghdel)
        # מותרת רק לשקף שכבר הוצא מהמצגת — כלומר כשיש לשבוע שורה
        # בלשונית "מצגות", והיא גוברת על הרשימה שבקוד. הבדיקה כאן
        # אינה רואה את הגיליון, ולכן שקף שנמחק כך נראה לה "חסר" —
        # והפילה את הפריסה חמש פעמים ב-8.10 על מחיקה תקינה.
        if miss and not os.path.exists(project_path( 'tools', 'prepare.mjs')):
            WARN.append('%s — הרשימה שבקוד מונה שקפים שנמחקו (%s). תקין אם '
                        'לשבוע יש שורה בלשונית "מצגות"'
                        % (d, ', '.join('%02d.jpg' % i for i in miss)))
        else:
            OK.append('%s — %d שקפים קיימים (רשימת הבנייה מאומתת בבדיקות)' % (d, n - len(miss)))


def check_daf_index():
    """daf/index.json הוא מה ש-learn.html שואל לפני שהוא מבקש תמונה.

    ערך שאין מאחוריו קובץ שולח את התלמיד למסלול הדרייב האיטי, או
    למסך ריק. וקובץ שקיים בלי ערך באינדקס פשוט לא ייראה לעולם.
    """
    p = project_path( 'daf', 'index.json')
    if not os.path.exists(p):
        WARN.append('אין daf/index.json')
        return
    idx = json.loads(io.open(p, encoding='utf-8').read())
    miss, orphan = [], []
    for mas, dapim in idx.items():
        for daf, amudim in dapim.items():
            for a in amudim:
                f = project_path( 'daf', mas, '%s-%s.webp' % (daf, a))
                if not os.path.exists(f):
                    miss.append('%s/%s-%s' % (mas, daf, a))
        d = project_path( 'daf', mas)
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
            for daf, a in dapim.items() if len(a) < 2 and not (mas == 'megila' and daf == 'לב' and a == ['a'])]
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
    p = project_path( 'daf', 'index.json')
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


def check_prog_start():
    """תחילת שבוע 1 כתובה פעמיים: ב-data.js (האפליקציה) וב-apps-script.gs
    (הסימנייה של "לימוד"). כשהן נפרדות, הלוח של הצוות קורא שבוע אחר
    מזה שהאפליקציה מציגה — ומי שסיים נעלם ממנו.
    """
    a = re.search(r"startDate:\s*'([^']+)'", read('data.js'))
    b = re.search(r"PROG_START\s*=\s*'([^']+)'", read('apps-script.gs'))
    if not a or not b:
        BAD.append('לא מצאתי את תחילת התוכנית ב-data.js או ב-apps-script.gs')
    elif a.group(1) != b.group(1):
        BAD.append('תחילת התוכנית שונה: data.js=%s · apps-script.gs=%s'
                   % (a.group(1), b.group(1)))
    else:
        OK.append('תחילת התוכנית זהה בשני הקבצים (%s)' % a.group(1))


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
    pages = [f for f in os.listdir(SOURCE) if f.endswith('.html')]
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
                # Optional capability guards are deliberate in the shared tour.
                # These guarded calls are capabilities, not mandatory dependencies.
                if j == 'trip.js' and name in ('show', 'myInstRow'):
                    continue
                holes.append((j, name, sorted(missing)))

    if holes:
        for j, name, missing in holes:
            WARN.append('%s נשען על %s() — אינו נטען ב: %s'
                        % (j, name, ', '.join(missing)))
    else:
        OK.append('קבצים משותפים — אין תלות בפונקציה שחסרה בעמוד כלשהו')


def check_inst_manifests():
    """מניפסט לכל ישיבה — אחרת ההתקנה מוחקת את הישיבה.

    האייקון שנוסף למסך הבית פותח את start_url שבמניפסט. אם אין
    מניפסט לישיבה, ההתקנה נופלת חזרה על זה הכללי — והתלמיד
    מקבל בורר ישיבות במקום הישיבה שלו. זה כבר קרה בשטח.

    ישיבה שנוספה ל-INSTITUTIONS בלי מניפסט היא בדיוק התקלה
    השקטה הזאת, ולכן הבדיקה כאן ולא בראש של מישהו.
    """
    d = read('data.js')
    blk = d[d.index('var INSTITUTIONS = ['):]
    blk = blk[:blk.index('\n];')]
    codes = re.findall(r"code:'([a-z]+)'", blk)
    if not codes:
        BAD.append('לא נמצאו קודי ישיבות ב-data.js')
        return
    miss, wrong = [], []
    for c in codes:
        path = project_path( 'm', c + '.json')
        if not os.path.exists(path):
            miss.append(c)
            continue
        m = json.loads(read('m', c + '.json'))
        if m.get('start_url') != '/join?inst=' + c:
            wrong.append(c + ' → ' + str(m.get('start_url')))
        # כתובת יחסית במניפסט שיושב ב-/m נפתרת מולו, לא מהשורש.
        for ic in m.get('icons', []):
            if not str(ic.get('src', '')).startswith('/'):
                wrong.append(c + ' — אייקון בכתובת יחסית')
    # ---- ואותו דבר לראש החטיבה. אותה תקלה בדיוק, עמוד אחר ----
    for c in codes:
        for suf, start in (('', '/?m=' + c),
                           ('-masa', '/?m=' + c + '&masa=go')):
            path = project_path( 'mh', c + suf + '.json')
            if not os.path.exists(path):
                miss.append('mh/' + c + suf)
                continue
            m = json.loads(read('mh', c + suf + '.json'))
            if m.get('start_url') != start:
                wrong.append('mh/' + c + suf + ' → ' + str(m.get('start_url')))
            for ic in m.get('icons', []):
                if not str(ic.get('src', '')).startswith('/'):
                    wrong.append('mh/' + c + suf + ' — אייקון בכתובת יחסית')

    # ומי שמתקין מתוך המסע לפני שהישיבה ידועה
    if not os.path.exists(project_path( 'manifest-masa.json')):
        miss.append('manifest-masa.json')
    elif json.loads(read('manifest-masa.json')).get('start_url') != '/?masa=go':
        wrong.append('manifest-masa.json')

    # **כל קוד גישה שנכנס למניפסט הוא קוד שפורסם.** הקבצים
    # האלה בריפו ציבורי, ומאחורי הקוד יושבים שמות של תלמידים.
    leaked = []
    for path in sorted(glob.glob(project_path( 'mh', '*.json')) +
                       glob.glob(project_path( 'm', '*.json'))):
        if 'k=' in json.loads(io.open(path, encoding='utf-8').read())\
                .get('start_url', ''):
            leaked.append(os.path.basename(path))
    if leaked:
        BAD.append('קוד גישה במניפסט ציבורי: ' + ', '.join(leaked))

    if miss:
        BAD.append('ישיבות בלי מניפסט: ' + ', '.join(miss) +
                   ' (הריצו tools/make-manifests.py)')
    if wrong:
        BAD.append('מניפסט שגוי: ' + ' · '.join(wrong))
    if not miss and not wrong:
        OK.append('מניפסט לכל ישיבה — %d לתלמיד, %d לראש החטיבה, '
                  'וכולם מצביעים נכון' % (len(codes), len(codes) * 2))


FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'


def check_share_card():
    """כל עמוד שנשלח בוואטסאפ — עם תצוגה מקדימה, ועם תמונה שקיימת.

    וואטסאפ אינו מריץ את הקוד של העמוד; הוא קורא את תגיות
    ה-og בלבד. עמוד בלי התגיות האלה מופיע בהודעה כשורת כתובת
    אפורה — וזה היה המצב של **כל** הקישורים שהתוכנית שולחת:
    ההצטרפות, הצוות, הלוח, המסע. רק `index.html` נשא כותרת
    ותיאור, וגם הוא בלי תמונה.

    הבדיקה תופסת את העמוד הבא שייווצר וישלח בלי הבלוק, ואת
    היום שבו התמונה תזוז ממקומה ואיש לא ישים לב — כי בהודעה
    שנשלחה כבר אי אפשר לתקן.
    """
    shared = ['index.html', 'join.html', 'tzevet.html', 'shlach.html', 'kishurim.html',
              'board.html', 'learn.html', 'masa.html', 'team.html', 'hitraot.html']
    card = 'share-card.jpg'
    if not os.path.exists(project_path( card)):
        BAD.append('%s — תמונת התצוגה המקדימה חסרה' % card)
        return
    bad = []
    for f in shared:
        if not os.path.exists(project_path( f)):
            continue
        t = read(f)
        missing = [k for k in ('og:title', 'og:description', 'og:image', 'og:url')
                   if 'property="%s"' % k not in t]
        if missing:
            bad.append('%s (%s)' % (f, ', '.join(missing)))
        elif card not in t:
            bad.append('%s (מצביע על תמונה אחרת)' % f)
    if bad:
        BAD.append('תצוגה מקדימה בוואטסאפ — חסרה ב: %s' % ' · '.join(bad))
    else:
        OK.append('תצוגה מקדימה בוואטסאפ — %d עמודים, כולם עם הכרטיס'
                  % len(shared))


def check_font():
    """גופן אחד לכל האפליקציה.

    היו כאן שלוש ערימות שונות: אחת עם "Noto Sans Hebrew", אחת עם
    Arial, ואחת בלי שתיהן. באייפון שלושתן נופלות על גופן המערכת
    ונראות זהות — ובאנדרואיד הן שלושה גופנים שונים, כי שם גם
    Noto וגם Arial באמת מותקנים. כלומר ההבדל היה בלתי נראה בדיוק
    למי שבדק, ונראה היטב לחצי מהשטח.

    זה נדרש יותר מפעם אחת ונסוג יותר מפעם אחת, ולכן הוא נבדק.
    """
    bad, n = [], 0
    for f in sorted(os.listdir(SOURCE)):
        if not f.endswith('.html'):
            continue
        src = read(f)
        # הערימות נכתבות לפעמים על שתי שורות — משטחים לפני ההשוואה
        flat = re.sub(r'\s*\n\s*', '', src)
        for m in re.finditer(r'font(?:-family)?\s*:\s*([^;}]*system-ui[^;}]*)', flat):
            stack = m.group(1)
            # `font:` מקוצר נושא גם גודל ורווח־שורה לפני הערימה
            fam = stack[stack.index('system-ui'):].strip()
            # `system-ui` לבדו אינו ערימה אלא ברירת מחדל מקומית —
            # קישור ב-noscript, שכבת ניפוי. מה שנבדק הוא ערימה
            # אמיתית, כלומר כזו שיש בה נפילה לגופן אחר.
            if ',' not in fam:
                continue
            n += 1
            if fam != FONT:
                bad.append('%s → %s' % (f, fam[:70]))
    if bad:
        BAD.append('ערימות גופן שונות מהתקן: ' + ' · '.join(bad))
    else:
        OK.append('גופן אחיד בכל העמודים (%d הצהרות)' % n)


# ---------------------------------------------------------------
# כל נוסח ניתן לעריכה בניהול
# ---------------------------------------------------------------
# זו הייתה תלונה אמיתית: "פה ושם אני מוצא שעמוד כזה לא מופיע".
# נוסח שנוסף ל-data.js בלי שורה ב-`TEXT_FIELDS` לא היה קיים
# בניהול כלל, וכל תיקון ניסוח קטן חייב לעבור דרך מתכנת.
#
# `textedit.js` כבר מוסיף שורה אוטומטית לכל מפתח שאין לו אחת,
# ולכן שום נוסח כבר אינו נעלם. הבדיקה כאן היא על הדרגה השנייה:
# מפתח שמופיע בניהול בשם המפתח שבקוד במקום בתיאור בעברית.
# אזהרה, לא כישלון.
def check_texts():
    import subprocess
    try:
        out = subprocess.check_output(
            ['node', project_path( 'tools', 'textcheck.mts')],
            stderr=subprocess.STDOUT).decode('utf-8')
    except Exception as e:                    # noqa: BLE001
        WARN.append('בדיקת המלל לא רצה (צריך node): %s' % e)
        return
    tot, nolabel, ghost, miss = 0, [], [], []
    for line in out.splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == 'TOTAL':
            tot = int(parts[1])
        elif parts[0] == 'NOLABEL':
            nolabel = parts[2:]
        elif parts[0] == 'GHOST':
            ghost = parts[2:]
        elif parts[0] == 'MISSING-ROOT':
            miss.append(' '.join(parts[1:]))
    if miss:
        BAD.append('שורש מלל שאינו קיים ב-data.js: ' + ' · '.join(miss))
    if ghost:
        # שורה בניהול שאין לה נוסח בקוד — תיבה ריקה שאי־אפשר לדעת
        # מה היא עושה, ופרסום שלה דורס בכלום.
        BAD.append('שורות בניהול בלי נוסח בקוד: ' + ' · '.join(ghost[:12]))
    if nolabel:
        WARN.append('%d נוסחים מופיעים בניהול בשם המפתח ולא בתיאור: %s'
                    % (len(nolabel), ' · '.join(nolabel[:10])))
    if not miss and not ghost and not nolabel:
        OK.append('כל %d הנוסחים ניתנים לעריכה בניהול, וכולם מתוארים' % tot)

# מספרי דוגמה שמופיעים בהערות ובשדות "לדוגמה" — לא של אף אחד.
PII_DUMMY = set(['1234567', '7654321', '9998888', '0000000', '1111111'])
# שמות "ממלאי מקום" שמותר לכתוב בקוד ובבדיקות.
PII_PLACEHOLDER = set(['דוגמה', 'לדוגמה', 'בדיקה', 'ישראל', 'ישראלי', 'פלוני', 'אלמוני',
                       'הורה', 'תלמיד', 'משה', 'כהן', 'לוי', 'רכז', 'התוכנית'])


def check_pii():
    """אין בריפו טלפונים או שמות של תלמידים והורים. הריפו ציבורי.

    שלוש בדיקות:
    · טלפון נייד ישראלי (05X, ‎+972 5X, ‎9725X) בכל קובץ טקסט. מספר
      דוגמה מובהק (1234567 וכו') מותר.
    · שם בדפוס של נתונים — first/last/parentName או 'שם'/'משפחה'
      ולצידם ערך עברי — חוץ מממלאי מקום (PII_PLACEHOLDER).
    · קובץ טבלה (csv/tsv/xlsx/vcf) שבכותרת שלו טלפון או משפחה.

    ושמות אמיתיים: אם קיים קובץ מקומי — בנתיב שב-HADAF_NAMES, או
    ‎~/.hadaf-names — שם אחד בכל שורה, הוא נסרק גם הוא. הקובץ הזה
    לעולם אינו נכנס לריפו.
    """
    import subprocess
    try:
        files = [x for x in subprocess.check_output(
            ['git', '-c', 'core.quotepath=off', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0') if x]
    except Exception:                         # noqa: BLE001
        WARN.append('בדיקת פרטים אישיים לא רצה (אין git)')
        return
    skip = re.compile(r'\.(png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|otf|mp3|m4a|mp4|zip)$', re.I)
    phone = re.compile(r'(?<![\w/=.%-])(?:\+?972[- ]?|0)(5\d)[- ]?(\d{3})[- ]?(\d{4})(?!\d)')
    name = re.compile(u"(?:(?<![\\w.])(?:first|last|parentName|fullName)\\s*:|['\"](?:שם|משפחה|שם ההורה)['\"]\\s*:|\\[\\s*['\"](?:שם|משפחה|שם ההורה)['\"]\\s*,)"
                      u"\\s*['\"]([\u0590-\u05FF][\u0590-\u05FF\"' -]{1,30})['\"]")
    real = []
    npath = os.environ.get('HADAF_NAMES') or os.path.expanduser('~/.hadaf-names')
    if os.path.exists(npath):
        # מילה שלמה בלבד — "רועי" אינו "ארועים". ולא בטקסטי הגמרא.
        real = [re.compile(u'(?<![\u0590-\u05FF])' + re.escape(x.strip()) + u'(?![\u0590-\u05FF])')
                for x in io.open(npath, encoding='utf-8') if len(x.strip()) > 2]
    corpus = re.compile(r'(chav|sfarim|daf|sugya|slides)/')
    hits = []
    for f in files:
        if skip.search(f) or f == 'tools/preflight.py':
            continue
        full = os.path.join(ROOT, f)
        if not os.path.isfile(full):
            continue
        if os.path.getsize(full) > 3000000:
            continue
        try:
            txt = io.open(full, encoding='utf-8').read()
        except Exception:                     # noqa: BLE001
            continue
        if re.search(r'\.(csv|tsv|vcf)$', f, re.I):
            head = txt.split('\n', 1)[0]
            if re.search(u'טלפון|משפחה|phone|tel', head, re.I):
                hits.append('%s — טבלה עם טלפון/משפחה' % f)
        for i, line in enumerate(txt.split('\n'), 1):
            for m in phone.finditer(line):
                if m.group(2) + m.group(3) not in PII_DUMMY and \
                        len(set(m.group(2) + m.group(3))) > 1:
                    hits.append('%s:%d — טלפון' % (f, i))
            for m in name.finditer(line):
                if any(w not in PII_PLACEHOLDER for w in m.group(1).split()):
                    hits.append(u'%s:%d — שם בנתונים (%s)' % (f, i, m.group(1)))
            for r in ([] if corpus.match(f) else real):
                if r.search(line):
                    hits.append('%s:%d — שם מהרשימה המקומית' % (f, i))
    for f in files:
        if re.search(r'\.(xlsx|xls)$', f, re.I):
            hits.append('%s — גיליון בריפו' % f)
    if hits:
        BAD.append('פרטים אישיים בריפו (הריפו ציבורי): ' + ' · '.join(hits[:12]))
    else:
        OK.append('אין טלפונים או שמות בריפו%s' % (' (גם מול הרשימה המקומית)' if real else ''))


def check_pub_files():
    """הרשימה של קבצי הדרייב הציבוריים בסקריפט תואמת ל-links.js."""
    import subprocess
    r = subprocess.call([sys.executable, project_path( 'tools', 'pub-files.py'), '--check'],
                        stdout=subprocess.DEVNULL)
    if r:
        BAD.append('PUB_FILES ב-apps-script.gs אינו תואם ל-links.js — '
                   'הריצו python3 tools/pub-files.py')
    else:
        OK.append('קבצי הלמידה הציבוריים בסקריפט תואמים ל-links.js')


def main():
    for fn in (check_version, check_font, check_texts,
               check_dupe_vars, check_orphan_classes,
               check_shared_globals, check_inst_manifests,
               check_share_card,
               check_decks, check_daf_index,
               check_calendar, check_prog_start, check_pii, check_pub_files):
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
