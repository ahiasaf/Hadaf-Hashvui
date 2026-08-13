#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מיפוי "הסוגיה היומית" — מאיזה עמוד בחוברת מתחיל כל חצי דף.

למה
---
באתר הסוגיה היומית החוברות מוצגות כספר מתהפך (Flipbook). היום
הקישור שלנו מוביל לתחילת החוברת, והתלמיד מדפדף ידנית עשרות עמודים
עד שהוא מגיע לדף שלו. אחרי הכלי הזה כל דף בלוח מקבל קישור שנפתח
בדיוק במקום הנכון.

הכלל שקובע
----------
היחידה אינה "סוגיה" אלא **חצי דף**, והכלל פשוט:

    ההופעה הראשונה של חצי הדף בכותרת — שם הוא מתחיל.

ולא משנה אם הכותרת מזכירה אותו לבדו ("ב ע"ב") או בטווח יחד עם
מה שקדם לו ("ב ע"א - ב ע"ב"). בשני המקרים זו הפעם הראשונה שהחוברת
מגיעה לחצי הדף הזה, ולכן זו הסוגיה שאליה מפנים.

זה נלמד מהחוברת עצמה ולא מהקוד. הייתה כאן גרסה שחיפשה "איפה ע"ב
מתחיל בתוך הסוגיה" ודילגה על הכותרת המשותפת — היא הפנתה את ב ע"ב
לסוגיה 3 במקום לסוגיה 2, וגם ייצרה אזהרות על לא כלום.

הפלט
----
    sugya/<חוברת>.csv         daf,amud,sugya,pdf_page,link
    sugya/index.json          מיפוי אחד לכל המסכתות — מה שהאפליקציה קוראת
    sugya/<חוברת>.md          טבלה לקריאה
    sugya/<חוברת>.audit.txt   כל הסוגיות שזוהו והטווחים שלהן
    sugya/probe-<חוברת>.txt   מה הכלי ראה בפועל ב-PDF

קובץ ה-probe הוא העיקר בריצה הראשונה: הוא מראה איך נראה הטקסט
באמת, וממנו מכווננים את הזיהוי. הוא נכתב תמיד, גם כשהכל עבד.

שימוש
-----
    python3 tools/sugya-index.py                    # הכול
    python3 tools/sugya-index.py taanit_a_b         # חוברת אחת
    python3 tools/sugya-index.py taanit_a_b ב ג ד   # דגימה

צריך pdfplumber. הכלי מוריד את החוברות בעצמו ושומר אותן ב-sugya/pdf/
(מוחרג מהריפו), ולכן ריצה שנייה מהירה.
"""
import csv
import json
import http.cookiejar
import io
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sugya')
PDFS = os.path.join(OUT, 'pdf')

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ' (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/pdf,*/*',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'}

# ============================================================
# החוברות.
#
# `df` הוא מזהה ה-Flipbook באתר. הוא **אינו** זהה בין החוברות, ולכן
# הוא נשלף מעמוד האתר בכל ריצה; הערך שכאן הוא רק גיבוי אם השליפה
# נכשלה. אחת ידועה מראש (df_6714), השאר יימצאו.
# ============================================================
UP = 'https://www.sugiayomit.co.il/wp-content/uploads/2022/07/'

BOOKS = [
    {'key': 'taanit_a_b', 'mas': 'taanit', 'title': 'תענית פרקים א-ב',
     'pdf': UP + '%D7%AA%D7%A2%D7%A0%D7%99%D7%AA-%D7%90-%D7%91.pdf',
     'page': 'https://www.sugiayomit.co.il/'
             '%d7%9e%d7%a1%d7%9b%d7%aa-%d7%aa%d7%a2%d7%a0%d7%99%d7%aa-'
             '%d7%a4%d7%a8%d7%a7-%d7%90-%d7%91/',
     'df': 'df_6714'},

    {'key': 'taanit_c_d', 'mas': 'taanit', 'title': 'תענית פרקים ג-ד',
     'pdf': UP + '%D7%AA%D7%A2%D7%A0%D7%99%D7%AA-%D7%92-%D7%93.pdf',
     'page': 'https://www.sugiayomit.co.il/'
             '%d7%9e%d7%a1%d7%9b%d7%aa-%d7%aa%d7%a2%d7%a0%d7%99%d7%aa-'
             '%d7%a4%d7%a8%d7%a7-%d7%92-%d7%93/',
     'df': ''},

    {'key': 'megila_1a', 'mas': 'megila', 'title': 'מגילה פרק א חלק א',
     'pdf': UP + '%D7%9E%D7%92%D7%99%D7%9C%D7%94-%D7%A4%D7%A8%D7%A7-'
                 '%D7%A8%D7%90%D7%A9%D7%95%D7%9F-%D7%97%D7%9C%D7%A7-%D7%90.pdf',
     'page': 'https://www.sugiayomit.co.il/'
             '%d7%9e%d7%a1%d7%9b%d7%aa-%d7%9e%d7%92%d7%99%d7%9c%d7%94-'
             '%d7%90-%d7%97%d7%9c%d7%a7-%d7%a8%d7%90%d7%a9%d7%95%d7%9f/',
     'df': ''},

    {'key': 'megila_1b', 'mas': 'megila', 'title': 'מגילה פרק א חלק ב',
     'pdf': UP + '%D7%9E%D7%92%D7%99%D7%9C%D7%94-%D7%A4%D7%A8%D7%A7-'
                 '%D7%A8%D7%90%D7%A9%D7%95%D7%9F-%D7%97%D7%9C%D7%A7-%D7%91.pdf',
     'page': 'https://www.sugiayomit.co.il/'
             '%d7%9e%d7%a1%d7%9b%d7%aa-%d7%9e%d7%92%d7%99%d7%9c%d7%94-'
             '%d7%90-%d7%97%d7%9c%d7%a7-%d7%a9%d7%a0%d7%99/',
     'df': ''},

    {'key': 'megila_b_d', 'mas': 'megila', 'title': 'מגילה פרקים ב-ד',
     'pdf': UP + '%D7%9E%D7%92%D7%99%D7%9C%D7%94-%D7%A4%D7%A8%D7%A7%D7%99%D7%9D-'
                 '%D7%91-%D7%93-.pdf',
     'page': 'https://www.sugiayomit.co.il/'
             '%d7%9e%d7%a1%d7%9b%d7%aa-%d7%9e%d7%92%d7%99%d7%9c%d7%94-'
             '%d7%91-%d7%93/',
     'df': ''},
]

# ============================================================
# שמות הדפים.
#
# הזיהוי אינו מחפש "אות עברית כלשהי" אלא שם דף מהרשימה. אחרת כל
# מילה בת שתי אותיות הייתה נראית כמו דף, ובעברית יש הרבה כאלה.
# ============================================================
ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']
TENS = ['', 'י', 'כ', 'ל']


def gematria(n):
    # ט"ו וט"ז ולא י"ה וי"ו, שלא לכתוב שם שמים. בלי זה דפי טו–טז
    # פשוט אינם ברשימה, וכל הסוגיות שעליהם יוצאות בלי טווח.
    if n in (15, 16):
        return {15: 'טו', 16: 'טז'}[n]
    t, o = divmod(n, 10)
    return TENS[t] + ONES[o]


DAPIM = {'taanit': [gematria(n) for n in range(2, 32)],    # ב–לא
         'megila': [gematria(n) for n in range(2, 33)]}    # ב–לב

# גרשיים בכל וריאציה — מוסרים לפני הזיהוי, ואז כ״א ו-כא הם אותו דבר,
# ו-ע"א הוא פשוט עא.
QUOTES = re.compile(r'["׳״‘’“”\']')


def strip_q(t):
    return QUOTES.sub('', t)


def ref_re(names):
    """הפניה לחצי דף: שם דף, ואחריו עא או עב."""
    alt = '|'.join(sorted(map(re.escape, names), key=len, reverse=True))
    return re.compile(r'(?<![א-ת])(' + alt + r')\s*ע\s*([אב])(?![א-ת])')


SUGYA_RE = re.compile(r'סוגי[הא]\s*[:\-]?\s*(\d{1,3})')


# ============================================================
# הורדה וקריאה
# ============================================================
# עוגיות אחת לכל הריצה, ולא לכל בקשה. האתר בודק שהמבקר כבר היה
# בעמוד לפני שהוא מוריד ממנו קובץ — בדיוק כמו דפדפן, שמבקר בעמוד,
# מקבל עוגייה, ורק אז מושך את ה-PDF. בלי זה הוא החזיר עמוד חסימה
# במקום הקובץ, ו-pdfplumber נפל על "Is this really a PDF?".
JAR = http.cookiejar.CookieJar()
OPENER = None


def fetch(url, dst=None, referer=None):
    """הורדה עם טיפול ידני בהפניות.

    האתר החזיר "infinite loop" ל-urllib. שתי סיבות אפשריות, ושתיהן
    מטופלות כאן: עוגייה שנקבעת בביקור הראשון ובלעדיה חוזרים לאותו
    מקום, וכתובת Location שיש בה עברית לא מקודדת ש-urllib אינו
    מזהה כזהה לקודמתה.

    ולכן ההפניות נעשות ביד: עוגיות נשמרות, כל Location מקודד, והשרשרת
    נרשמת — כדי שכישלון יגיד למה נכשל ולא רק שנכשל."""
    global OPENER
    op = OPENER
    if op is None:
        op = OPENER = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(JAR), _NoRedirect())
    head = dict(UA)
    if referer:
        head['Referer'] = referer
    chain, seen = [], set()
    for _ in range(12):
        req = urllib.request.Request(url, headers=head)
        try:
            r = op.open(req, timeout=120)
        except urllib.error.HTTPError as e:
            if e.code not in (301, 302, 303, 307, 308):
                raise
            r = e
        loc = r.headers.get('Location')
        if not loc:
            data = r.read()
            if dst:
                open(dst, 'wb').write(data)
            return data
        # הכותרת נקראת כ-latin-1, ולכן היא מחזיקה את הבתים הגולמיים.
        # מקודדים את הבתים עצמם; קידוד המחרוזת היה מקודד פעמיים.
        raw = loc.encode('latin-1', 'replace')
        nxt = urllib.parse.urljoin(url, urllib.parse.quote(raw, safe=":/?#[]@!$&'()*+,;=%~"))
        chain.append('%s → %s' % (url[-60:], nxt[-60:]))
        if nxt in seen:
            raise RuntimeError('הפניה במעגל:\n    ' + '\n    '.join(chain))
        seen.add(nxt)
        url = nxt
    raise RuntimeError('יותר מדי הפניות:\n    ' + '\n    '.join(chain))


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """ההפניות מטופלות ביד למעלה, ולכן urllib לא נוגע בהן."""
    def redirect_request(self, *a):
        return None


def flip_id(book):
    """מזהה ה-Flipbook מעמוד האתר. לא מניחים שהוא זהה בין החוברות."""
    try:
        html = fetch(book['page']).decode('utf-8', 'replace')
    except Exception as e:
        return book['df'], 'לא הצלחתי לפתוח את עמוד האתר (%s)' % str(e)[:50]
    ids = re.findall(r'df_\d+', html)
    if not ids:
        # מה כן חזר — כדי שיהיה ברור אם זה עמוד חסימה ולא תקלת זיהוי
        t = re.search(r'<title>(.*?)</title>', html, re.S)
        return book['df'], ('לא נמצא מזהה Flipbook בעמוד · %d תווים · "%s"'
                            % (len(html), (t.group(1).strip()[:60]) if t else '?'))
    best = max(set(ids), key=ids.count)
    if book['df'] and best != book['df']:
        return best, 'מזהה שונה מהצפוי — נמצא %s, ציפיתי %s' % (best, book['df'])
    return best, None


def get_pdf(book):
    """הורדת החוברת, כמו דפדפן שהגיע אליה מעמוד האתר.

    ה-Referer ועוגיות הביקור הקודם הם מה שמבדיל בין הורדה שמתקבלת
    לבין עמוד חסימה. ואם בכל זאת חזר משהו שאינו PDF — עדיף להגיד
    את זה במילים מאשר להעביר HTML ל-pdfplumber ולקבל ממנו
    "Is this really a PDF?", שאינו מרמז על הסיבה."""
    os.makedirs(PDFS, exist_ok=True)
    dst = os.path.join(PDFS, book['key'] + '.pdf')
    if os.path.exists(dst) and os.path.getsize(dst) > 10000:
        return dst
    last = ''
    for i in range(3):
        try:
            data = fetch(book['pdf'], referer=book['page'])
        except Exception as e:
            last = str(e)[:120]
            data = b''
        if data[:5] == b'%PDF-':
            open(dst, 'wb').write(data)
            return dst
        if data:
            t = re.search(rb'<title>(.*?)</title>', data[:4000], re.S)
            last = ('לא PDF · %d בתים · "%s"'
                    % (len(data), (t.group(1).decode('utf-8', 'replace').strip()[:60])
                       if t else data[:40].decode('utf-8', 'replace')))
        time.sleep(4 * (i + 1))
    raise RuntimeError('האתר לא מסר את הקובץ — ' + last)


def read_pages(path):
    """טקסט לכל עמוד, אחרי טיפול בכיוון.

    ב-PDF בעברית הטקסט לא תמיד יוצא בסדר הקריאה — תלוי איך הקובץ
    נוצר. במקום לנחש, בודקים על הקובץ כולו: אם המילה 'סוגיה' מופיעה
    הפוכה יותר פעמים מאשר ישרה, הופכים כל שורה."""
    import pdfplumber
    raw = []
    with pdfplumber.open(path) as pdf:
        for p in pdf.pages:
            raw.append(p.extract_text() or '')
    join = '\n'.join(raw)
    flipped = join.count('היגוס') > join.count('סוגיה')
    if not flipped:
        return raw, False
    return ['\n'.join(unflip(ln) for ln in t.split('\n')) for t in raw], True


def unflip(ln):
    """הופכים את השורה — ואז מחזירים את המספרים למקומם.

    בקובץ העברית שמורה בסדר הפוך אבל המספרים שמורים ישר. היפוך של
    השורה כולה מתקן את העברית ומקלקל אותם: 'סוגיה 10' הפכה ל'סוגיה
    01', ומכאן ש-10 נקראה כ-1 והתנגשה עם סוגיה 1 — כלומר סוגיה
    שלמה נעלמה מהטבלה."""
    return re.sub(r'[0-9A-Za-z]+', lambda m: m.group(0)[::-1], ln[::-1])


# ============================================================
# הזיהוי
# ============================================================
def find_sugyot(pages, names):
    """כל סוגיה: מספר, טווח חצאי הדף, ועמוד ה-PDF שבו הכותרת מופיעה.

    הכותרת פרושה על יותר משורה אחת — מספר הסוגיה בשורה אחת והטווח
    בשורה שלידה, ולא תמיד באותו סדר. לכן מחפשים את המספר, ואז את
    ההפניה הקרובה אליו בחלון של שתי שורות לכל צד."""
    rx = ref_re(names)
    out = []
    for pno, text in enumerate(pages, 1):
        lines = strip_q(text).split('\n')
        for i, ln in enumerate(lines):
            m = SUGYA_RE.search(ln)
            if not m:
                continue
            refs = []
            for j in range(max(0, i - 2), min(len(lines), i + 3)):
                for r in rx.finditer(lines[j]):
                    refs.append((r.group(1), r.group(2)))
            out.append({'n': int(m.group(1)), 'page': pno, 'refs': refs,
                        'line': ln.strip()[:70]})
    # אותה סוגיה יכולה להופיע גם בתוכן העניינים; שומרים את המופע הראשון
    seen, uniq = set(), []
    for s in out:
        if s['n'] in seen:
            continue
        seen.add(s['n'])
        uniq.append(s)
    return sorted(uniq, key=lambda s: s['page'])


def half_index(names, daf, amud):
    return names.index(daf) * 2 + (0 if amud == 'א' else 1)


def build(book, want_daf, log):
    names = DAPIM[book['mas']]
    df, warn = flip_id(book)
    if warn:
        log.append('[אזהרה] %s' % warn)
    log.append('Flipbook: %s' % df)

    path = get_pdf(book)
    pages, flipped = read_pages(path)
    log.append('עמודי PDF: %d%s' % (len(pages), '  (הטקסט היה הפוך ותוקן)'
                                    if flipped else ''))

    sug = find_sugyot(pages, names)
    log.append('סוגיות שזוהו: %d' % len(sug))
    log.append('')
    log.append('%-6s %-6s %s' % ('סוגיה', 'עמוד', 'טווח'))
    for s in sug:
        if not s['refs']:
            log.append('%-6d %-6d [אזהרה] לא זוהה טווח · "%s"'
                       % (s['n'], s['page'], s['line']))
        else:
            rng = ' - '.join('%s ע"%s' % r for r in s['refs'])
            log.append('%-6d %-6d %s' % (s['n'], s['page'], rng))

    # טווח כל סוגיה כאינדקס של חצי דף, ועמוד הסיום שלה ב-PDF
    spans = []
    for i, s in enumerate(sug):
        if not s['refs']:
            continue
        a = s['refs'][0]
        b = s['refs'][-1]
        try:
            lo = half_index(names, a[0], a[1])
            hi = half_index(names, b[0], b[1])
        except ValueError:
            log.append('[אזהרה] סוגיה %d — דף שאינו ברשימת המסכת (%s/%s)'
                       % (s['n'], a[0], b[0]))
            continue
        end = (sug[i + 1]['page'] if i + 1 < len(sug) else len(pages))
        spans.append({'n': s['n'], 'lo': min(lo, hi), 'hi': max(lo, hi),
                      'page': s['page'], 'end': end})

    rows = []
    for daf in names:
        if want_daf and daf not in want_daf:
            continue
        for amud in ('א', 'ב'):
            k = half_index(names, daf, amud)
            # ההופעה הראשונה בכותרת — שם חצי הדף מתחיל. הסוגיות
            # מסודרות לפי עמוד, ולכן הראשונה שמכסה אותו היא התשובה.
            hit = [s for s in spans if s['lo'] <= k <= s['hi']]
            if not hit:
                continue          # החוברת אינה מגיעה לדף הזה — לא אזהרה
            s = hit[0]
            rows.append([daf, 'ע"' + amud, s['n'], s['page'],
                         '%s#flipbook-%s/%d/' % (book['page'], df, s['page'])])
    return rows, pages, flipped, df


# ============================================================
# כתיבה
# ============================================================
def probe(book, pages, flipped, df, names):
    """מה הכלי ראה בפועל. זה הקובץ שמכוונים לפיו כשמשהו לא מזוהה."""
    rx = ref_re(names)
    out = ['חוברת: %s' % book['title'],
           'Flipbook: %s' % df,
           'עמודים: %d   הטקסט הפוך: %s' % (len(pages), 'כן' if flipped else 'לא'),
           '', '=== שתי השורות הראשונות בכל עמוד ===']
    for i, t in enumerate(pages, 1):
        lines = [l.strip() for l in t.split('\n') if l.strip()][:2]
        out.append('%3d | %s' % (i, ' ⏎ '.join(lines)[:110] or '(ריק)'))
    out += ['', '=== כל מופע של "סוגיה N" ===']
    for i, t in enumerate(pages, 1):
        for ln in strip_q(t).split('\n'):
            if SUGYA_RE.search(ln):
                out.append('%3d | %s' % (i, ln.strip()[:110]))
    out += ['', '=== כל הפניה לחצי דף ===']
    for i, t in enumerate(pages, 1):
        hits = ['%s ע"%s' % (m.group(1), m.group(2))
                for m in rx.finditer(strip_q(t))]
        if hits:
            out.append('%3d | %s' % (i, ' · '.join(hits[:14])))
    return '\n'.join(out)


def write_out(book, rows, log, probe_txt):
    os.makedirs(OUT, exist_ok=True)
    k = book['key']

    with io.open(os.path.join(OUT, k + '.csv'), 'w', encoding='utf-8-sig',
                 newline='') as f:
        w = csv.writer(f)
        w.writerow(['daf', 'amud', 'sugya', 'pdf_page', 'link'])
        w.writerows(rows)

    md = ['# %s' % book['title'], '',
          '| דף | צד | מספר סוגיה | קישור |', '| --- | --- | ---: | --- |']
    for r in rows:
        md.append('| %s | %s | %s | [עמוד %s](%s) |' % (r[0], r[1], r[2], r[3], r[4]))
    io.open(os.path.join(OUT, k + '.md'), 'w', encoding='utf-8').write(
        '\n'.join(md) + '\n')

    io.open(os.path.join(OUT, k + '.audit.txt'), 'w', encoding='utf-8').write(
        '\n'.join(log) + '\n')
    io.open(os.path.join(OUT, 'probe-' + k + '.txt'), 'w',
            encoding='utf-8').write(probe_txt + '\n')


def main():
    args = [a for a in sys.argv[1:]]
    want_key = args[0] if args and not re.match(r'^[א-ת]{1,3}$', args[0]) else None
    want_daf = set(a for a in args if re.match(r'^[א-ת]{1,3}$', a)) or None

    merged, ran = {}, []
    for book in BOOKS:
        if want_key and book['key'] != want_key:
            continue
        print('\n=== %s ===' % book['title'])
        log = ['חוברת: %s' % book['title'], '']
        try:
            rows, pages, flipped, df = build(book, want_daf, log)
        except Exception as e:
            print('  ✗ %s' % e)
            log.append('[אזהרה] נפילה: %s' % e)
            os.makedirs(OUT, exist_ok=True)
            io.open(os.path.join(OUT, book['key'] + '.audit.txt'), 'w',
                    encoding='utf-8').write('\n'.join(log) + '\n')
            continue
        write_out(book, rows, log, probe(book, pages, flipped, df,
                                        DAPIM[book['mas']]))
        ran.append(book)
        for r in rows:
            # חוברות חופפות בקצוות; הראשונה שמכסה קובעת
            merged.setdefault(book['mas'], {}).setdefault(r[0], {}).setdefault(
                'ב' if r[1].endswith('ב') else 'א', r[4])
        print('\n'.join(log[:60]))
        print('  → %d שורות · sugya/%s.csv' % (len(rows), book['key']))

    if len(ran) == len(BOOKS) and not want_daf:
        write_index(merged)


def write_index(merged):
    """מיפוי אחד לכל המסכתות — זה מה שהאפליקציה תקרא.

    וגם דוח של חצאי דף שאף חוברת לא מכסה: זה הדבר היחיד שיכול
    להשאיר תלמיד בלי קישור, וכדאי לדעת עליו מראש."""
    io.open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8').write(
        json.dumps(merged, ensure_ascii=False, indent=1) + '\n')
    miss = []
    for mas, names in DAPIM.items():
        for daf in names:
            for amud in ('א', 'ב'):
                if not merged.get(mas, {}).get(daf, {}).get(amud):
                    miss.append('%s · דף %s ע"%s' % (mas, daf, amud))
    io.open(os.path.join(OUT, 'MISSING.txt'), 'w', encoding='utf-8').write(
        ('\n'.join(miss) if miss else 'אין חצי דף בלי קישור.') + '\n')
    write_js(merged)
    print('\nsugya/index.json · %d חצאי דף בלי קישור' % len(miss))


def write_js(merged):
    """הליטרל שנכנס ל-data.js, מוכן להעתקה.

    לא נכתב לתוך data.js ישירות בכוונה: אין שלב בנייה בפרויקט,
    data.js נערך ביד, וכלי שכותב לתוכו היה עלול למחוק עריכות.
    כאן הוא יושב לצד התוצאות, ומי שמעדכן מעתיק אותו פנימה.

    הצורה דחוסה — קידומת אחת לכל חוברת, ולכל דף [חוברת, עמוד] —
    כי data.js נטען בכל פתיחה, ו-120 כתובות מלאות היו מכפילות אותו."""
    out = []
    for mas in sorted(merged):
        pref, order, rows = {}, [], []
        for daf in DAPIM[mas]:
            u = merged[mas].get(daf, {}).get('א')   # הדף השבועי מתחיל בע"א
            if not u:
                continue
            m = re.match(r'^(.*/)(\d+)/$', u)
            if not m:
                continue
            p, n = m.group(1), int(m.group(2))
            if p not in pref:
                pref[p] = 'abcde'[len(pref)]
                order.append(p)
            rows.append((daf, pref[p], n))
        out.append('  %s: {' % mas)
        out.append('    books: {')
        out.append(',\n'.join("      %s: '%s'" % (pref[p], p) for p in order))
        out.append('    },')
        out.append('    pages: {')
        line, wrapped = '      ', []
        for r in rows:
            part = "'%s':['%s',%d], " % r
            if len(line) + len(part) > 94:
                wrapped.append(line.rstrip())
                line = '      '
            line += part
        wrapped.append(line.rstrip().rstrip(','))
        out.append('\n'.join(wrapped))
        out.append('    }')
        out.append('  },')
    io.open(os.path.join(OUT, 'SUGYA.js'), 'w', encoding='utf-8').write(
        'var SUGYA = {\n' + '\n'.join(out).rstrip(',') + '\n};\n')


if __name__ == '__main__':
    main()
