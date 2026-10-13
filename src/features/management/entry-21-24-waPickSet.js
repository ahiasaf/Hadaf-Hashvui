var waPick = "";          /* '' כללי · '~out' מחוץ לרשת · אחרת קוד ישיבה */
var waEdit = '';          /* מפתח ההודעה שפתוחה לעריכה */
var waTxt  = null;        /* מה שמוקלד בה - שורד ציור מחדש ברקע */
var waSay  = {};

function waPickSet(v) {
    waPick = v;
    admPane();
}
function waEditSet(k) {
  waEdit = waEdit === k ? '' : k;
  waTxt = null;
  delete waSay[k];
  admPane();
}

function waMsgs() {
    return [ {
        k: "ui.teamWa",
        lbl: "לר״מים ולראשי חטיבות",
        url: function(c) {
            return tzevetUrl(c);
        }
    }, {
        k: "ui.linkWa",
        lbl: "לתלמידים",
        url: function(c, out) {
            return out ? outUrl() : joinUrl(c);
        }
    }, {
        k: "ui.dadWa",
        lbl: "להורים",
        url: function(c) {
            return c ? joinUrl(c) + "&for=dad" : dadUrl();
        }
    } ];
}

function waInst() {
  for (var i = 0; i < INSTITUTIONS.length; i++)
    if (INSTITUTIONS[i].code === waPick) return INSTITUTIONS[i];
  return null;
}
/* ההודעה כמו שתצא. */
function waOut(m, raw) {
  var row = waInst(), url = m.url(row ? row.code : '', waPick === '~out');
  return row ? fill(raw, { inst:row.name, url:url })
             : fill(noInst(raw), { url:url });
}
function waMsg(k) { return waMsgs().filter(function (m) { return m.k === k; })[0]; }

function admWaCard() {
  var row = waInst();
  var opt = function (v, t) {
    return '<option value="' + esc(v) + '"' + (v === waPick ? ' selected' : '') + '>' + esc(t) + '</option>';
  };
  return '<div class="adm-card" style="margin-bottom:11px">' +
    '<h4>ההודעות שאני שולח</h4>' +
    '<div class="fld"><div class="label">לאיזו ישיבה</div>' +
    '<select onchange="waPickSet(this.value)">' +
    opt('', 'כללי - בלי ישיבה') + opt('~out', 'מחוץ לרשת - בלי בחירת ישיבה') +
    INSTITUTIONS.map(function (o) { return opt(o.code, o.name); }).join('') +
    '</select></div>' +
    (row ? '<a class="wa-ed" target="_blank" rel="noopener" href="' + esc(tzevetUrl(row.code)) +
           '">לראות את עמוד הצוות של הישיבה ↗</a>' : '') +
    waMsgs().map(function (m) {
      var raw = textGet(m.k), open = waEdit === m.k;
      var say = waSay[m.k];
      var txt = open && waTxt != null ? waTxt : raw;
      return '<div class="wamsg">' +
        '<div class="wa-row"><b>' + esc(m.lbl) + '</b>' +
        '<button class="wa-ed" onclick="waEditSet(\'' + m.k + '\')">' +
        (open ? 'סגירה' : 'עריכה') + '</button>' +
        '<a class="btn gr" target="_blank" rel="noopener" ' +
        'href="https://wa.me/?text=' + encodeURIComponent(waOut(m, raw)) +
        '">שליחה</a></div>' +
        (say ? '<div class="' + say[0] + '" style="margin-top:8px">' + say[1] + '</div>' : '') +
        (open
          ? '<textarea id="wa-ta" rows="7" oninput="waPrev(\'' + m.k + '\',this.value)">' +
            esc(txt) + '</textarea>' +
            '<div class="label" style="margin-top:9px">כך זה ייראה</div>' +
            '<div class="wa-prev" id="wa-prev">' + esc(waOut(m, txt)) + '</div>' +
            '<div class="wa-act">' +
            '<button class="btn p" onclick="waSave(\'' + m.k + '\')">שמירה - אצל כולם</button>' +
            (raw !== TX.base(m.k)
              ? '<button class="wa-ed" onclick="waSave(\'' + m.k + '\',1)">חזרה למקור</button>'
              : '') +
            '</div>'
          : '') +
        '</div>';
    }).join('') + '</div>';
}
function waPrev(k, v) {
  waTxt = v;
  var el = document.getElementById('wa-prev');
  if (el) el.textContent = waOut(waMsg(k), v);
}

/* שמירה - לכולם, מיד. קוראים את הלשונית כמו שהיא עכשיו בגיליון
   (ולא מה שהמכשיר זוכר), משנים שורה אחת, כותבים, וקוראים שוב
   לוודא - `no-cors` "מצליח" תמיד. טיוטות של נוסחים אחרים במכשיר
   הזה אינן נשלחות בדרך אגב. `orig` = חזרה לנוסח שבקוד. */
function waSave(k, orig) {
  if (orig && !confirm('להחזיר את ההודעה לנוסח המקורי? מה שערכת בה יימחק.')) return;
  var ta = document.getElementById('wa-ta');
  var v = orig ? '' : String(ta ? ta.value : '').trim();
  if (v === TX.base(k)) v = '';                 /* כמו המקור = חזרה למקור */
  var say = function (cls, h) { waSay[k] = [cls, h]; admPane(); };
  var key = (CFG.readKey || '').trim();
  if (!API) return say('cond', 'אין כתובת שרת במכשיר הזה.');
  if (!key) return say('cond', 'חסרה סיסמת הקריאה. הגדרות ← שרת ההרשמות.');
  waTxt = ta ? ta.value : waTxt;
  say('cond', 'שומר…');
  var id = CFG.sheetId || SHEET_ID, tries = 0;
  var good = function (map) { return map && (v ? map[k] === v : map[k] == null); };
  var check = function () {
    return new Promise(function (ok) { setTimeout(ok, tries ? 4000 : 2200); })
      .then(function () { return fetchSheet(id, 'טקסטים'); })
      .then(function (back) {
        var map = textsFromRows(back);
        if (good(map)) {
          Store.set('textCache', map);
          PUBLISHED = map;
          var t = CFG.texts || {};
          delete t[k];
          cfgSet('texts', t);
          relayerTexts(); repaintTexts();
          waEdit = ''; waTxt = null;
          return say('done-box', v ? 'נשמר אצל כולם.' : 'חזר לנוסח המקורי אצל כולם.');
        }
        if (++tries < 4) return check();
        say('cond', 'לא הצלחתי לוודא שזה נשמר בגיליון. נסו שוב בעוד רגע.');
      });
  };
  fetchSheet(id, 'טקסטים').then(function (rows) {
    var map = textsFromRows(rows);
    if (!map) throw new Error('read');
    if (v) map[k] = v; else delete map[k];
    var out = [], x;
    for (x in map) if (map.hasOwnProperty(x)) out.push({ key:x, value:map[x] });
    queue({ action:'texts', key:key, rows:JSON.stringify(out), at:new Date().toISOString() });
    return check();
  }).catch(function () {
    say('cond', 'לא הצלחתי לקרוא את הגיליון. נסו שוב בעוד רגע.');
  });
}

function tripUrl() {
    return joinUrl("").replace("join.html", "") + "?masa=1";
}

function tourUrl() {
    return tripUrl().replace("?masa=1", "?masa=see");
}

function admShowCard() {
    var big = "margin:0;flex:1;text-decoration:none;text-align:center";
    return '<div class="adm-card" style="margin-bottom:11px"><h4>להציג</h4>' + '<div class="wa-act">' + '<a class="btn p" style="' + big + '" target="_blank" rel="noopener" href="' + esc(demoUrl()) + '">פתיחת ההדגמה</a>' + '<a class="btn p" style="' + big + '" target="_blank" rel="noopener" href="' + esc(tripUrl()) + '">פתיחת המסע</a></div>' + '<div class="wa-more">' + '<button class="wa-ed" onclick="copyAny(this, tripUrl())">העתקת הקישור למסע</button>' + '<a class="wa-ed" target="_blank" rel="noopener" href="' + esc(demoUrl("rec")) + '">הקלטת הדגמה</a>' + '<a class="wa-ed" target="_blank" rel="noopener" href="' + esc(tourUrl()) + '">סיור בכל השלבים</a>' + "</div>" + '<details class="wa-how"><summary>איך זה עובד?</summary>' + '<p class="h"><b>ההדגמה</b> - הדף האינטראקטיבי מנגן את עצמו: תענית ב׳ - קטע ' + "עם החברותא, המצגת נפתחת, ועוד שני קטעים. ואז הוא עוצר " + "ומזמין לגעת. כעשרים שניות. <b>כל נגיעה עוצרת אותו ומעבירה " + "את השליטה.</b> על מקרן בכיתה, או מגישים את הטלפון.</p>" + '<p class="h"><b>הקלטת הדגמה</b> - הקצב וסדר הלחיצות נקבעים בהקלטה: ' + "עושים את ההדגמה ביד, וכל לחיצה נשמרת עם הזמן שלה. מה שהוקלט " + "נשמר <b>במכשיר הזה</b> ומתנגן במקום ברירת המחדל.</p>" + '<p class="h"><b>המסע</b> - לראשי החטיבות. לא מצגת: האפליקציה עצמה, ' + "עם רצועה בראש המסך שאומרת בכל שלב מה לעשות. שמונה שלבים - " + 'הצטרפות, מילוי הטופס, שליחה לר"מים, התקנה, ואז הלוח, מילה ' + "לתלמידים, והדף עצמו. כל כפתור אמיתי ועובד. הנוסח נערך " + 'ב"מה מוצג" ← "מלל" ← "המסע".</p>' + '<p class="h"><b>סיור בכל השלבים</b> - למי שכבר רשום ומותקן: המסע ' + "הרגיל ידלג לו על ההתחלה. הסיור מראה את כל השלבים לפי הסדר, " + 'בכפתור "הבא", בלי לשנות כלום במכשיר.</p>' + "</details></div>";
}


function admLinks(el) {
    el.innerHTML = admWaCard() + admShowCard();
}


/* ============================================================
   רשימת הישיבות - ב"ישיבות וצוות", רשימה אחת.
   ============================================================
   קודם היו כאן שתי רשימות של אותן ישיבות זו אחר זו (קודים,
   ואז מתג "בפנים"), ושתיהן ב"קישורים להפצה". עכשיו כל ישיבה
   מופיעה פעם אחת עם המתג, ומקופלת מתחת לסיכום. */
var instOpen = false;
function instOpenSet() { instOpen = !instOpen; instPaint(); }
/* "ישיבות וצוות" אינו מצויר מחדש כולו (ראו admPane), ולכן הרשימה
   מציירת את עצמה. */
function instPaint() {
  var el = document.getElementById('in-codes');
  if (el) el.innerHTML = admInstInner(); else admPane();
}
function admInstInner() {
  var n = INSTITUTIONS.filter(function (i) { return i.joined; }).length;
  var head = '<div class="row" style="padding:0">' +
    '<b>' + esc(UI.instJoined.replace('{n}', n)) + '</b>' +
    '<button class="ppl-back" onclick="instOpenSet()">' +
    esc(instOpen ? UI.instClose : UI.instEdit) + '</button></div>';
  if (!instOpen) return head;
  var src = INST_SRC === 'sheet' ? '' :
    '<div class="cond" style="margin-top:9px"><b>' + INSTITUTIONS.length +
    ' מוסדות · מהרשימה שבקוד.</b><br>' +
    esc(INST_SRC.indexOf(':') > 0 ? INST_SRC.split(':').slice(1).join(':') : 'הגיליון טרם נקרא') +
    ' - הרשימה שבקוד מוצגת, ושום דבר לא אבד.' +
    '<div style="margin-top:8px"><button class="btn g" style="margin:0" ' +
    'onclick="loadInstitutions().then(function(){renderHome();instPaint();})">' +
    'ניסיון טעינה מחדש</button></div></div>';
  return head + src +
    '<p class="h" style="margin-top:9px">המתג קובע מי מופיע כ"בפנים" ' +
    'בעמוד הראשי ובעיגול המונה.</p>' +
    /* בלי קודים: אנשי הצוות נרשמים, והרכז מאשר כל אחד. */
    INSTITUTIONS.map(function (i) {
      return '<div class="row"><div>' + esc(i.name) +
        (i.last ? '<div class="sub">למדו בתשפ"ו</div>' : '') + '</div>' +
        '<button class="sw' + (i.joined ? ' on' : '') +
        '" onclick="admToggle(\'' + i.code + '\')" aria-label="שיוך"></button></div>';
    }).join('');
}
