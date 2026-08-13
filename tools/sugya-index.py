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
היחידה אינה "סוגיה" אלא **חצי דף**. סוגיה אחת יכולה לכסות גם ע"א
וגם ע"ב, ואז שני חצאי הדף מקבלים **נקודות פתיחה שונות**:

    ע"א  →  העמוד שבו הכותרת של הסוגיה מופיעה
    ע"ב  →  העמוד שבו ע"ב באמת מתחיל, גם אם זה באמצע הסוגיה

לזה משמש `AMUD_MARK` למטה: סימון של מעבר עמוד בתוך גוף החוברת.

ומה שלא נמצא — לא מנוחש. הוא נרשם ב-audit עם [אזהרה] והקישור נשאר
ריק. חצי דף בלי קישור עדיף על חצי דף שנפתח במקום הלא נכון.

הפלט
----
    sugya/<חוברת>.csv         daf,amud,sugya,pdf_page,link,confidence
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
import io
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'sugya')
PDFS = os.path.join(OUT, 'pdf')

UA = {'User-Agent': 'Mozilla/5.0'}

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

# סימון מעבר עמוד בתוך גוף החוברת: "עב" בפני עצמו, בלי שם דף לפניו.
# זה מה שמאפשר לתת ל-ע"ב נקודת פתיחה משלו כשהוא באמצע סוגיה.
AMUD_MARK = re.compile(r'(?<![א-ת])ע\s*([אב])(?![א-ת])')


# ============================================================
# הורדה וקריאה
# ============================================================
def fetch(url, dst=None):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    if dst:
        open(dst, 'wb').write(data)
    return data


def flip_id(book):
    """מזהה ה-Flipbook מעמוד האתר. לא מניחים שהוא זהה בין החוברות."""
    try:
        html = fetch(book['page']).decode('utf-8', 'replace')
    except Exception as e:
        return book['df'], 'לא הצלחתי לפתוח את עמוד האתר (%s)' % str(e)[:50]
    ids = re.findall(r'df_\d+', html)
    if not ids:
        return book['df'], 'לא נמצא מזהה Flipbook בעמוד'
    best = max(set(ids), key=ids.count)
    if book['df'] and best != book['df']:
        return best, 'מזהה שונה מהצפוי — נמצא %s, ציפיתי %s' % (best, book['df'])
    return best, None


def get_pdf(book):
    os.makedirs(PDFS, exist_ok=True)
    dst = os.path.join(PDFS, book['key'] + '.pdf')
    if not os.path.exists(dst) or os.path.getsize(dst) < 10000:
        fetch(book['pdf'], dst)
    return dst


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
    out = []
    for t in raw:
        out.append('\n'.join(ln[::-1] for ln in t.split('\n')))
    return out, True


# ============================================================
# הזיהוי
# ============================================================
def find_sugyot(pages, names):
    """כל סוגיה: מספר, טווח חצאי הדף, ועמוד ה-PDF שבו הכותרת מופיעה.

    הכותרת פרושה על יותר משורה אחת — מספר הסוגיה בשורה אחת והטווח
    בשורה שלידה, ולא תמיד באותו סדר. לכן מחפשים את המספר, ואז את
    ההפניה הקרובה אליו בחלון של שתי שורות לכל צד."""
    rx = ref_re(names)
    out, hdr = [], set()
    for pno, text in enumerate(pages, 1):
        lines = strip_q(text).split('\n')
        for i, ln in enumerate(lines):
            m = SUGYA_RE.search(ln)
            if not m:
                continue
            refs = []
            for j in range(max(0, i - 2), min(len(lines), i + 3)):
                hdr.add((pno, j))     # שורות הכותרת — לא נקודות התחלה
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
    return sorted(uniq, key=lambda s: s['page']), hdr


def half_index(names, daf, amud):
    return names.index(daf) * 2 + (0 if amud == 'א' else 1)


def amud_start_page(pages, names, hdr, frm, to, daf, amud):
    """העמוד שבו מתחיל חצי דף שנמצא **בתוך** סוגיה.

    מחפשים קודם את ההפניה המלאה (הדף והצד יחד), ורק אם אין —
    סימון של הצד לבדו. חיפוש הצד לבדו מוגבל לטווח העמודים של
    הסוגיה, אחרת הוא היה תופס כל 'עב' בחוברת.

    שורות הכותרת מוחרגות, וזה העיקר: הכותרת של סוגיה 4 כתוב בה
    "ב ע"א - ב ע"ב", ובלי ההחרגה ע"ב היה מקבל את עמוד הכותרת —
    כלומר בדיוק את הטעות שהכלי נועד למנוע."""
    def scan(match_full):
        rx = ref_re(names)
        for pno in range(frm, to + 1):
            if pno - 1 >= len(pages):
                break
            for i, ln in enumerate(strip_q(pages[pno - 1]).split('\n')):
                if (pno, i) in hdr:
                    continue
                if match_full:
                    for m in rx.finditer(ln):
                        if m.group(1) == daf and m.group(2) == amud:
                            return pno
                else:
                    # הפניות מלאות שכבר נבדקו — סימון בתוכן אינו סימון
                    # עצמאי אלא הצד של דף אחר.
                    full = [(m.start(), m.end()) for m in rx.finditer(ln)]
                    for m in AMUD_MARK.finditer(ln):
                        if m.group(1) != amud:
                            continue
                        if any(a <= m.start() < b for a, b in full):
                            continue
                        return pno
        return None

    p = scan(True)
    if p:
        return p, 'ref'
    p = scan(False)
    return (p, 'mark') if p else (None, None)


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

    sug, hdr = find_sugyot(pages, names)
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

    rows, warns = [], []
    for daf in names:
        if want_daf and daf not in want_daf:
            continue
        for amud in ('א', 'ב'):
            k = half_index(names, daf, amud)
            hit = [s for s in spans if s['lo'] <= k <= s['hi']]
            if not hit:
                continue                       # לא בחוברת הזאת — לא אזהרה
            s = hit[0]
            if k == s['lo']:
                page, how = s['page'], 'כותרת'
            else:
                page, kind = amud_start_page(pages, names, hdr, s['page'],
                                             s['end'], daf, amud)
                how = {'ref': 'הפניה', 'mark': 'סימון צד'}.get(kind, '')
            if not page:
                warns.append('%s ע"%s — בתוך סוגיה %d, לא נמצאה נקודת ההתחלה'
                             % (daf, amud, s['n']))
                rows.append([daf, 'ע"' + amud, s['n'], '', '', 'אזהרה'])
                continue
            link = '%s#flipbook-%s/%d/' % (book['page'], df, page)
            rows.append([daf, 'ע"' + amud, s['n'], page, link, how])

    if warns:
        log.append('')
        for w in warns:
            log.append('[אזהרה] ' + w)
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
        w.writerow(['daf', 'amud', 'sugya', 'pdf_page', 'link', 'confidence'])
        w.writerows(rows)

    md = ['# %s' % book['title'], '',
          '| דף | צד | מספר סוגיה | קישור |', '| --- | --- | ---: | --- |']
    for r in rows:
        md.append('| %s | %s | %s | %s |'
                  % (r[0], r[1], r[2],
                     ('[עמוד %s](%s)' % (r[3], r[4])) if r[4] else '**חסר**'))
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
        bad = len([r for r in rows if r[5] == 'אזהרה'])
        print('\n'.join(log[:60]))
        print('  → %d שורות · %d אזהרות · sugya/%s.csv'
              % (len(rows), bad, book['key']))


if __name__ == '__main__':
    main()
