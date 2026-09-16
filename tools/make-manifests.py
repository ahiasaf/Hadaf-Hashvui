# -*- coding: utf-8 -*-
"""מניפסט לכל ישיבה — לתלמיד (m/) ולראש החטיבה (mh/).

האייקון שנוסף למסך הבית פותח את start_url שבמניפסט. מניפסט אחד
קבוע פירושו start_url אחד קבוע — בלי הישיבה — ולכן תלמיד שהתקין
איבד אותה. ניסינו לפצות בשמירה באחסון המכשיר, וזה נכשל דווקא
באייפון: לאפליקציה שנוספה למסך הבית יש שם אחסון נפרד מספארי.

mh/ הוא אותו פתרון לראש החטיבה, שעד עכשיו לא קיבל אותו: הוא
נרשם בספארי, הוסיף למסך הבית, פתח את האייקון — ומצא אפליקציה
שאינה מכירה אותו. עכשיו האייקון שלו נפתח על הישיבה שלו.

**קוד הגישה ללוח אינו נכנס לכאן.** הקבצים האלה יושבים בריפו
ציבורי, ומאחורי הקוד יושבים שמות של תלמידים. הישיבה בלבד.

הגרסה עם -masa נבחרת כשמתקינים מתוך המסע, והיא פותחת אותו שוב
בתוך האפליקציה — פעם אחת, ראו df:tripDone ב-trip.js.

הרצה אחרי כל שינוי ב-INSTITUTIONS:
    python3 tools/make-manifests.py
preflight בודק שזה נעשה.
"""
import glob
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    d = io.open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
    blk = d[d.index('var INSTITUTIONS = ['):]
    blk = blk[:blk.index('\n];')]
    codes = re.findall(r"code:'([a-z]+)'", blk)

    base = json.load(io.open(os.path.join(ROOT, 'join-manifest.json'),
                             encoding='utf-8'))
    out = os.path.join(ROOT, 'm')
    if not os.path.isdir(out):
        os.makedirs(out)
    for old in glob.glob(os.path.join(out, '*.json')):
        os.remove(old)

    for c in codes:
        man = dict(base)
        # כתובות מוחלטות: הקובץ יושב ב-/m/, וכתובת יחסית הייתה
        # נפתרת מולו — "./join" היה הופך ל-/m/join.
        man['id'] = '/join'
        man['start_url'] = '/join?inst=' + c
        man['scope'] = '/'
        man['icons'] = [dict(i, src='/' + i['src']) for i in base['icons']]
        io.open(os.path.join(out, c + '.json'), 'w', encoding='utf-8').write(
            json.dumps(man, ensure_ascii=False, indent=2) + '\n')

    # ---- ולראש החטיבה, עם אותו היגיון בדיוק ----
    home = json.load(io.open(os.path.join(ROOT, 'manifest.json'),
                             encoding='utf-8'))
    outh = os.path.join(ROOT, 'mh')
    if not os.path.isdir(outh):
        os.makedirs(outh)
    for old in glob.glob(os.path.join(outh, '*.json')):
        os.remove(old)

    def head_manifest(start):
        man = dict(home)
        man['id'] = '/'
        man['start_url'] = start
        man['scope'] = '/'
        man['icons'] = [dict(i, src='/' + i['src']) for i in home['icons']]
        return man

    for c in codes:
        io.open(os.path.join(outh, c + '.json'), 'w', encoding='utf-8').write(
            json.dumps(head_manifest('/?m=' + c), ensure_ascii=False,
                       indent=2) + '\n')
        io.open(os.path.join(outh, c + '-masa.json'), 'w',
                encoding='utf-8').write(
            json.dumps(head_manifest('/?m=' + c + '&masa=go'),
                       ensure_ascii=False, indent=2) + '\n')

    # ומי שמתקין מתוך המסע בלי שהישיבה ידועה עדיין — וזה הרוב,
    # כי באייפון ההתקנה קודמת להרשמה.
    io.open(os.path.join(ROOT, 'manifest-masa.json'), 'w',
            encoding='utf-8').write(
        json.dumps(head_manifest('/?masa=go'), ensure_ascii=False,
                   indent=2) + '\n')

    print('%d מניפסטים נכתבו ל-m/, %d ל-mh/' % (len(codes), len(codes) * 2))


if __name__ == '__main__':
    main()
