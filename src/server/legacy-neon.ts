import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  authorized,
  database,
  readDatabaseTable,
  stringRecord,
  withTransaction,
  type Query,
} from "./database.ts";
import { publicTabs } from "./public-schema.ts";
import {
  contactCells,
  contactKey,
  markProgress,
  pairMap,
  pairSeen,
  pendingFor,
  planStationSync,
  privateTabs,
  publicRowTabs,
  rowIds,
  rowKey,
  sheetOf,
  sourceOwnedTabs,
  stationAttended,
  stationDirectory,
  stationKey,
  stationLinkTab,
  stationTab,
  value,
  type Sheet,
} from "./legacy-policy.ts";
import {
  schoolGrant,
  networkRoster,
  attendanceCells,
  pageKey,
  removeAnchorPaths,
  stableIdColumns,
  stableIdPlan,
} from "./upstream-policy.ts";
type Params = Record<string, string>;
type Body = Record<string, unknown>;
type Reply = Record<string, unknown>;
type Columns = [string, string][];
export class UnsupportedLegacyAction extends Error {}
// Matches SCRIPT_VERSION, so existing clients treat the typed backend as current.
export const legacyApiVersion = 60;
const now = () => new Date().toISOString();
const isAdmin = (params: { key?: unknown }) =>
  authorized(
    typeof params.key === "string" ? params.key : "",
    process.env.READ_KEY,
  );
const denied = (message = "אין הרשאה"): Reply => ({
  status: "denied",
  message,
});
const failure = (message: string): Reply => ({ status: "error", message });
function columns(input: unknown): Columns {
  const value = typeof input === "string" ? JSON.parse(input || "[]") : input;
  if (!Array.isArray(value)) throw new Error("Invalid columns");
  return value
    .filter(
      (pair): pair is [unknown, unknown] =>
        Array.isArray(pair) && pair.length >= 2 && String(pair[0] ?? "") !== "",
    )
    .map(([name, cell]) => [String(name), String(cell ?? "")]);
}
type Loaded = Sheet & { exists: boolean };
async function load(query: Query, tab: string): Promise<Loaded> {
  const result = await query(
    `SELECT headers,coalesce((SELECT jsonb_agg(jsonb_build_array(ordinal,cells) ORDER BY ordinal) FROM sheet_rows WHERE table_name=$1),'[]'::jsonb) AS rows FROM sheet_tables WHERE name=$1`,
    [tab],
  );
  if (!result.length)
    return { headers: [], rows: [], ordinals: [], exists: false };
  const rows = result[0].rows as [number, unknown[]][];
  return {
    headers: (result[0].headers as unknown[]).map((header) =>
      String(header).trim(),
    ),
    rows: rows.map(([, cells]) => cells.map((cell) => String(cell ?? ""))),
    ordinals: rows.map(([ordinal]) => Number(ordinal)),
    exists: true,
  };
}
const readQuery: Query = async (text, parameters = []) =>
  (await database().query(text, parameters)) as Record<string, unknown>[];
function table(sheet: Sheet) {
  return sheet.headers.length ? [sheet.headers, ...sheet.rows] : sheet.rows;
}
async function append(query: Query, tab: string, cols: Columns) {
  const result = await query(
    "SELECT append_sheet_record($1,$2::jsonb) AS result",
    [tab, JSON.stringify(cols)],
  );
  return result[0].result as Reply;
}
async function update(
  query: Query,
  tab: string,
  ordinal: number,
  cols: Columns,
) {
  await query("SELECT update_sheet_record($1,$2,$3::jsonb)", [
    tab,
    ordinal,
    JSON.stringify(cols),
  ]);
}
async function remove(query: Query, tab: string, ordinals: number[]) {
  if (!ordinals.length) return;
  await query(
    "DELETE FROM sheet_rows WHERE table_name=$1 AND ordinal=ANY($2::int[])",
    [tab, ordinals],
  );
  await query("UPDATE sheet_tables SET revision=revision+1 WHERE name=$1", [
    tab,
  ]);
}
async function ensure(query: Query, tab: string, headers: string[]) {
  await query(
    "INSERT INTO sheet_tables(name,headers,metadata,source_hash,captured_at) VALUES($1,$2::jsonb,'{}','runtime',now()) ON CONFLICT DO NOTHING",
    [tab, JSON.stringify(headers)],
  );
}
async function setHeaders(query: Query, tab: string, headers: string[]) {
  await query(
    "UPDATE sheet_tables SET headers=$2::jsonb,revision=revision+1 WHERE name=$1",
    [tab, JSON.stringify(headers)],
  );
}
// Positional rows mirror Apps Script appendRow and range writes on sheets without named columns.
async function insertCells(query: Query, tab: string, cells: string[]) {
  await query(
    "INSERT INTO sheet_rows(table_name,ordinal,cells) SELECT $1::text,coalesce(max(ordinal),0)+1,$2::jsonb FROM sheet_rows WHERE table_name=$1::text",
    [tab, JSON.stringify(cells)],
  );
  await query("UPDATE sheet_tables SET revision=revision+1 WHERE name=$1", [
    tab,
  ]);
}
async function setCells(
  query: Query,
  tab: string,
  ordinal: number,
  cells: string[],
) {
  await query(
    "UPDATE sheet_rows SET cells=$3::jsonb WHERE table_name=$1 AND ordinal=$2",
    [tab, ordinal, JSON.stringify(cells)],
  );
  await query("UPDATE sheet_tables SET revision=revision+1 WHERE name=$1", [
    tab,
  ]);
}
// Inserts a named record without identity merging, as a raw Sheets append does.
async function insertRecord(
  query: Query,
  tab: string,
  record: Record<string, string>,
) {
  await ensure(query, tab, Object.keys(record));
  const sheet = await load(query, tab);
  const headers = [...sheet.headers];
  for (const name of Object.keys(record))
    if (!headers.includes(name)) headers.push(name);
  if (headers.length !== sheet.headers.length)
    await setHeaders(query, tab, headers);
  await insertCells(
    query,
    tab,
    headers.map((name) => record[name] || ""),
  );
}
async function upsert(
  query: Query,
  tab: string,
  cols: Columns,
  keyName: string,
) {
  const key = cols.find(([name]) => name === keyName)?.[1].trim() || "";
  const sheet = await load(query, tab);
  const index = key
    ? sheet.rows.findIndex((row) => value(sheet, row, keyName) === key)
    : -1;
  if (index < 0) return append(query, tab, cols);
  await update(query, tab, sheet.ordinals[index], [["תאריך", now()], ...cols]);
  return { status: "success", tab, updated: true };
}
// Apps Script ignores failed side marks so they cannot block a registration.
async function bestEffort(query: Query, work: () => Promise<unknown>) {
  await query("SAVEPOINT best_effort");
  try {
    await work();
    await query("RELEASE SAVEPOINT best_effort");
  } catch {
    await query("ROLLBACK TO SAVEPOINT best_effort");
  }
}
function newCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return [...randomBytes(6)]
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}
async function setCode(query: Query, school: string, code: string) {
  school = school.trim();
  if (!school) return "";
  code = code.trim() || newCode();
  await ensure(query, "קודים", ["קוד ישיבה", "קוד גישה", "נוצר"]);
  const sheet = await load(query, "קודים");
  const index = sheet.rows.findIndex(
    (row) => String(row[0] || "").trim() === school,
  );
  if (index < 0) await insertCells(query, "קודים", [school, code, now()]);
  else {
    const cells = [...sheet.rows[index]];
    cells[0] ||= school;
    cells[1] = code;
    cells[2] = now();
    await setCells(query, "קודים", sheet.ordinals[index], cells);
  }
  return code;
}
async function ensureCode(query: Query, school: string, wanted: string) {
  const sheet = await load(query, "קודים");
  const row = sheet.rows.find(
    (row) => String(row[0] || "").trim() === school.trim(),
  );
  return row?.[1]?.trim() || setCode(query, school, wanted);
}
async function markJoined(query: Query, school: string, books: string) {
  school = school.trim();
  if (!school || school === "other") return;
  const sheet = await load(query, "מוסדות");
  const index = sheet.rows.findIndex(
    (row) => String(row[0] || "").trim() === school,
  );
  if (index < 0) return;
  const cells = [...sheet.rows[index]];
  while (cells.length < 4) cells.push("");
  if (!["TRUE", "כן"].includes(cells[3].trim().toUpperCase()))
    cells[3] = "TRUE";
  if (books) {
    if (sheet.headers[4] !== "מסכתות") {
      const headers = [...sheet.headers];
      while (headers.length < 5) headers.push("");
      headers[4] = "מסכתות";
      await setHeaders(query, "מוסדות", headers);
    }
    while (cells.length < 5) cells.push("");
    cells[4] = books;
  }
  await setCells(query, "מוסדות", sheet.ordinals[index], cells);
}
async function flagRegistrationConflict(query: Query, body: Body) {
  const code = String(body.code || "").trim(),
    who = String(body.who || "").trim();
  if (!code || !who || code === "other") return;
  const sheet = await load(query, "הרשמות");
  let previous: string[] | undefined;
  for (const row of sheet.rows) {
    const other = value(sheet, row, "איש קשר");
    if (value(sheet, row, "קוד") === code && other && other !== who)
      previous = row;
  }
  if (!previous) return;
  const cell = (name: string) => value(sheet, previous!, name);
  await append(query, "התנגשויות הרשמה", [
    ["קוד ישיבה", code],
    [
      "ישיבה",
      sheet.headers.includes("ישיבה") ? cell("ישיבה") : String(body.inst || ""),
    ],
    ["איש קשר קודם", cell("איש קשר")],
    ["טלפון קודם", cell("טלפון")],
    ['סה"כ גמרות קודם', cell('סה"כ גמרות')],
    ["נרשם קודם", cell("תאריך")],
    ["איש קשר חדש", who],
    ["טלפון חדש", String(body.phone || "")],
    ['סה"כ גמרות חדש', String(body.total || 0)],
  ]);
}
export async function coordinatorPing(
  title: string,
  body: string,
  url: string,
) {
  try {
    const { immediateNotificationsEnabled, enqueueNotification } =
      await import("./notification-outbox.ts");
    if (!(await immediateNotificationsEnabled())) return false;
    const { selectRecipients } = await import("./notification-recipients.ts");
    const recipients = selectRecipients(await readDatabaseTable("התראות"), {
      role: "רכז",
    }).recipients;
    if (!recipients.length) return false;
    const sid = "c" + randomUUID().replaceAll("-", "").slice(0, 24);
    await enqueueNotification(
      sid,
      recipients,
      { title, body, url },
      false,
      createHash("sha256").update(sid).digest("hex"),
      "מערכת",
    );
    return true;
  } catch {
    // A coordinator alert is best effort in the source as well.
    return false;
  }
}
async function stationSync(query: Query) {
  const [station, links, learners, network, phones] = await Promise.all(
    [stationTab, stationLinkTab, "לומדים", "תלמידי הרשת", "טלפוני תלמידים"].map(
      (tab) => load(query, tab),
    ),
  );
  const plan = planStationSync(
    table(station),
    table(links),
    table(learners),
    stationDirectory(table(network), table(phones)),
  );
  for (const cols of plan.learners)
    await insertRecord(
      query,
      "לומדים",
      Object.fromEntries([["תאריך", now()], ...cols]),
    );
  for (const cols of plan.progress) {
    const track = cols.find(([name]) => name === "מסלול")?.[1] || "",
      week = cols.find(([name]) => name === "שבוע")?.[1] || "";
    // PostgreSQL validates progress identities; malformed station rows stay linked only.
    if (["taanit", "megila"].includes(track) && /^[1-9]\d*$/.test(week))
      await append(query, "לימוד", cols);
  }
  for (const cols of plan.quizzes) await append(query, "חידות", cols);
  for (const cols of plan.links) await append(query, stationLinkTab, cols);
  return plan.progress.length;
}
async function stationUnlink(query: Query, keys: Set<string>) {
  const links = await load(query, stationLinkTab),
    gone = new Set<string>(),
    drop: number[] = [];
  links.rows.forEach((row, index) => {
    if (!keys.has(value(links, row, "מפתח"))) return;
    gone.add(
      ["מזהה", "מסלול", "שבוע"]
        .map((name) => value(links, row, name))
        .join("|"),
    );
    drop.push(links.ordinals[index]);
  });
  await remove(query, stationLinkTab, drop);
  if (!drop.length) return;
  const progress = await load(query, "לימוד");
  await remove(
    query,
    "לימוד",
    progress.ordinals.filter((_, index) => {
      const row = progress.rows[index];
      return (
        value(progress, row, "מקור") === "עמדת לימוד" &&
        gone.has(
          ["מזהה", "מסלול", "שבוע"]
            .map((name) => value(progress, row, name))
            .join("|"),
        )
      );
    }),
  );
}
const learnedAtStation = (sheet: Sheet, row: string[]) =>
  value(sheet, row, "סוג") === "דף" &&
  value(sheet, row, "רמה") !== stationAttended;
async function stationKind(body: Body) {
  const day = String(body.day || "").trim(),
    slot = String(body.slot || "").trim(),
    page = body.kind === "d",
    level = String(body.lvl || "").trim();
  if (!day || !slot) return failure("חסר יום או מועד");
  return withTransaction(async (query) => {
    const station = await load(query, stationTab),
      drop = new Set<string>();
    let count = 0;
    for (const [index, row] of station.rows.entries()) {
      if (
        value(station, row, "יום") !== day ||
        value(station, row, "קוד עמדה") !== slot
      )
        continue;
      const was = learnedAtStation(station, row);
      if (was && !(page && level !== stationAttended))
        drop.add(stationKey(station, row));
      await update(query, stationTab, station.ordinals[index], [
        ["סוג", page ? "דף" : "שיעור"],
        [
          "מסלול",
          page ? String(body.track || value(station, row, "מסלול")) : "",
        ],
        ["דף", page ? String(body.daf || value(station, row, "דף")) : ""],
        ["רמה", level],
      ]);
      count++;
    }
    if (drop.size) {
      const current = await load(query, stationTab);
      for (const row of current.rows)
        if (learnedAtStation(current, row))
          drop.delete(stationKey(current, row));
      await stationUnlink(query, drop);
    }
    await stationSync(query);
    return { status: "ok", rows: count };
  });
}
export async function readLegacyTable(params: Params): Promise<Reply> {
  const tab = String(params.read || "");
  if (params.ss) return failure("Custom sheets are unsupported");
  // Unknown and legacy-copy tables are private unless explicitly approved as public.
  if ((privateTabs.has(tab) || !publicTabs.has(tab)) && !isAdmin(params))
    return { status: "error", tab, message: "סיסמת קריאה שגויה" };
  if (tab === stationTab) await withTransaction(stationSync);
  const sheet = await load(readQuery, tab);
  const rows = sheet.exists
    ? table(sheet)
    : sourceOwnedTabs[tab]
      ? [sourceOwnedTabs[tab]]
      : [];
  return {
    status: "ok",
    tab,
    rows,
    ...(tab === "לומדים" ? { pairs: pairMap(rows) } : {}),
  };
}
async function health(params: Params): Promise<Reply> {
  const tabs = (
    await readQuery(
      "SELECT t.name,(SELECT count(*)::int FROM sheet_rows r WHERE r.table_name=t.name) AS rows FROM sheet_tables t ORDER BY t.name",
    )
  ).map((row) => ({ name: String(row.name), rows: Number(row.rows) }));
  const github = !!(process.env.GH_TOKEN && process.env.GH_REPO);
  return {
    status: "ok",
    version: legacyApiVersion,
    backend: "neon",
    sheet: "Neon PostgreSQL",
    tabs: tabs.filter((tab) => publicTabs.has(tab.name)),
    privateOn: true,
    readKeyOn: !!process.env.READ_KEY,
    privSrc: "props",
    keySrc: "props",
    teamOn: !!process.env.TEAM_KEY,
    autoOn: true,
    gh: {
      ok: github,
      message: github ? "GitHub מוגדר" : "לא הוגדר GH_TOKEN או GH_REPO",
    },
    ...(isAdmin(params)
      ? {
          privId: "neon",
          privSheet: "Neon PostgreSQL",
          privTabs: tabs.filter((tab) => !publicTabs.has(tab.name)),
        }
      : {}),
  };
}
async function dispatchDigest(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied();
  const token = process.env.GH_TOKEN,
    repository = process.env.GH_REPO;
  if (!token) return denied("לא הוגדר GH_TOKEN");
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository))
    return denied("לא הוגדר GH_REPO");
  const sid =
    "s" + Date.now().toString(36) + randomBytes(2).readUInt16BE().toString(36);
  const response = await fetch(
    "https://api.github.com/repos/" + repository + "/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "push-digest",
        client_payload: { mode: params.mode || "joined", all: "1", sid },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (response.status !== 204)
    return {
      status: "error",
      code: response.status,
      message: "GitHub החזיר " + response.status,
    };
  await withTransaction((query) =>
    append(query, "הודעות", [
      ["מי", "רכז"],
      ["ישיבה", "כל הצוות"],
      ["קהל", "כל הצוות"],
      ["כותרת", "כמה מכיתתך הצטרפו"],
      ["הטקסט", 'עדכון אישי — כל ר"ם והמספר שלו'],
      ["מזהה שליחה", sid],
      ["תוצאה", "ממתין"],
    ]),
  );
  return { status: "ok" };
}
async function markHandled(params: Params, tab: string, row: string) {
  if (!isAdmin(params)) return denied();
  const number = Number.parseInt(row, 10);
  if (!(number > 1)) return failure("שורה לא תקינה");
  return withTransaction(async (query) => {
    const sheet = await load(query, tab);
    if (number - 2 >= sheet.rows.length) return failure("אין שורה כזו");
    await update(query, tab, sheet.ordinals[number - 2], [["טופל", now()]]);
    return { status: "ok" };
  });
}
async function notify(params: Params): Promise<Reply> {
  const { queueNotificationRequest } =
    await import("./notification-request.ts");
  const fields = [
    "inst",
    "dev",
    "k",
    "key",
    "title",
    "body",
    "only",
    "grade",
    "klass",
    "who",
    "aud",
    "flt",
    "url",
    "role",
    "wait",
    "test",
  ];
  const payload: Params = { requestId: params.requestId || randomUUID() };
  for (const field of fields) if (params[field]) payload[field] = params[field];
  return { ...(await queueNotificationRequest(payload)), notified: 1 };
}
async function resend(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied();
  const sheet = await load(readQuery, "הודעות");
  const row = sheet.rows.findLast(
    (row) => value(sheet, row, "מזהה שליחה") === params.resend,
  );
  if (!row) return failure("ההודעה לא נמצאה ביומן");
  const get = (name: string) => value(sheet, row, name);
  const result = await notify({
    key: params.key,
    title: get("כותרת"),
    body: get("הטקסט"),
    only: get("יעד"),
    grade: get("שכבה"),
    klass: get("כיתה"),
    who: get("מי"),
    url: get("קישור"),
    role: get("תפקיד"),
    wait: get("ממתינים"),
    flt: get("פילוח"),
  });
  await withTransaction(async (query) => {
    const sheet = await load(query, "הודעות");
    const index = sheet.rows.findLastIndex(
      (row) => value(sheet, row, "מזהה שליחה") === params.resend,
    );
    if (index >= 0)
      await update(query, "הודעות", sheet.ordinals[index], [
        ["תוצאה", value(sheet, sheet.rows[index], "תוצאה") + " · נשלחה שוב"],
      ]);
  });
  return result;
}
async function rowsWhere(tab: string, column: string, id: string) {
  const result = await readQuery(
    "SELECT headers,coalesce((SELECT jsonb_agg(cells ORDER BY ordinal) FROM sheet_rows WHERE table_name=$1 AND record->>$2=$3),'[]'::jsonb) AS rows FROM sheet_tables WHERE name=$1",
    [tab, column, id],
  );
  if (!result.length) return [];
  return [result[0].headers as string[], ...(result[0].rows as string[][])];
}
async function arrived(params: Params): Promise<Reply> {
  const id = params.arrived.trim();
  if (params.push) {
    const rows = sheetOf(await rowsWhere("התראות", "מזהה", id));
    return {
      status: "ok",
      has: rows.rows.some((row) => !!value(rows, row, "מנוי")),
      push: 1,
    };
  }
  const known = await readQuery(
    "SELECT 1 FROM person_aliases WHERE alias_id=$1 UNION ALL SELECT 1 FROM sheet_rows WHERE table_name='לומדים' AND record->>'מזהה'=$1 LIMIT 1",
    [id],
  );
  return { status: "ok", has: known.length > 0 };
}
async function pairConfirm(params: Params): Promise<Reply> {
  const id = params.pairok.trim(),
    tag = params.wk || "",
    answer = params.yes === "1" ? "כן" : "לא";
  return withTransaction(async (query) => {
    const sheet = await load(query, "זוגות");
    let set = 0;
    for (const [index, row] of sheet.rows.entries()) {
      if (value(sheet, row, "מזהה") !== id) continue;
      if (value(sheet, row, "מסלול") + "|" + value(sheet, row, "שבוע") !== tag)
        continue;
      await update(query, "זוגות", sheet.ordinals[index], [["אושר", answer]]);
      set++;
    }
    return { status: "ok", set };
  });
}
async function access(params: Params): Promise<Reply> {
  const school = String(params.acc || "").trim(),
    device = String(params.dev || "").trim();
  if (!school || !device || device.length < 6) return { status: "none" };
  const outcome = await withTransaction(async (query) => {
    const subscriptions = await load(query, "התראות");
    const index = subscriptions.rows.findLastIndex(
      (row) =>
        value(subscriptions, row, "מזהה") === device &&
        value(subscriptions, row, "קוד ישיבה") === school,
    );
    if (index < 0) return null;
    const me = subscriptions.rows[index],
      get = (name: string) => value(subscriptions, me, name);
    await ensure(query, "גישה", [
      "מזהה",
      "שם",
      "טלפון",
      "ישיבה",
      "קוד ישיבה",
      "תפקיד",
      "מצב",
      "קוד במכשיר",
      "ביקש",
      "נראה",
      "הוחלט",
    ]);
    const grants = await load(query, "גישה");
    const grant = grants.rows.find(
      (row) => value(grants, row, "מזהה") === device,
    );
    let state = grant ? value(grants, grant, "מצב") : "";
    const cols: Columns = [
      ["מזהה", device],
      ["שם", get("שם")],
      ["טלפון", get("טלפון") || (grant ? value(grants, grant, "טלפון") : "")],
      ["ישיבה", get("ישיבה")],
      ["קוד ישיבה", school],
      ["תפקיד", get("תפקיד")],
      ["קוד במכשיר", params.has === "1" ? "כן" : ""],
      ["נראה", now()],
    ];
    const moved =
      !!grant &&
      state === "אושר" &&
      value(grants, grant, "קוד ישיבה") !== school;
    if (!grant || moved) {
      state = "ממתין";
      cols.push(["מצב", state], ["ביקש", now()]);
    }
    await upsert(query, "גישה", cols, "מזהה");
    const reply: Reply =
      state === "נעול"
        ? { status: "locked", phone: !!get("טלפון") }
        : state !== "אושר"
          ? { status: "wait", phone: !!get("טלפון") }
          : { status: "ok", k: await ensureCode(query, school, newCode()) };
    return { reply, ping: !grant || moved, get };
  });
  if (!outcome) return { status: "none" };
  if (
    outcome.ping &&
    (await coordinatorPing(
      "🔑 לאימות: " + (outcome.get("שם") || "איש צוות"),
      (outcome.get("ישיבה") || school) +
        (outcome.get("תפקיד") ? " · " + outcome.get("תפקיד") : "") +
        (outcome.get("טלפון") ? " · " + outcome.get("טלפון") : ""),
      "./#admin-acc",
    ))
  )
    return { ...outcome.reply, notified: 1 };
  return outcome.reply;
}
export async function checkStaffAccess(
  school: string,
  device: string,
): Promise<Reply> {
  if (!school || !device || device.length < 6)
    return {
      status: "unknown",
      message: "הירשמו כאיש צוות והמתינו לאישור הרכז.",
    };
  const state = schoolGrant(
    table(await load(readQuery, "גישה")),
    school,
    device,
  );
  if (state === "ok") return { status: "ok" };
  if (!device)
    return {
      status: "unknown",
      message: "הירשמו כאיש צוות והמתינו לאישור הרכז.",
    };
  const result = await access({ acc: school, dev: device });
  return result.status === "none"
    ? { status: "unknown", message: "הירשמו כאיש צוות והמתינו לאישור הרכז." }
    : result;
}
async function pickAccess(params: Params): Promise<Reply> {
  if (!["staff", "kid"].includes(params.pick || ""))
    return failure("בחירה לא מוכרת");
  const current = await access(params);
  if (current.status !== "locked") return current;
  let notifyAgain = false;
  const result = await withTransaction(async (query) => {
    const sheet = await load(query, "גישה");
    const row = sheet.rows.find(
      (row) =>
        value(sheet, row, "מזהה") === params.dev &&
        value(sheet, row, "קוד ישיבה") === params.acc,
    );
    if (!row || value(sheet, row, "מצב") !== "נעול") return { status: "wait" };
    if (params.pick === "staff") {
      const phone =
        value(sheet, row, "טלפון") ||
        String(params.ph || "")
          .replace(/[^0-9+]/g, "")
          .slice(0, 16);
      await upsert(
        query,
        "גישה",
        [
          ["מזהה", params.dev],
          ["מצב", "ממתין"],
          ["ביקש", now()],
          ...(phone ? [["טלפון", phone] as [string, string]] : []),
        ],
        "מזהה",
      );
      notifyAgain = true;
      return { status: "wait", phone: !!phone };
    }
    await upsert(
      query,
      "גישה",
      [
        ["מזהה", params.dev],
        ["תפקיד", "תלמיד"],
      ],
      "מזהה",
    );
    const subscriptions = await load(query, "התראות");
    for (let i = 0; i < subscriptions.rows.length; i++) {
      const row = subscriptions.rows[i];
      if (
        value(subscriptions, row, "מזהה") === params.dev &&
        value(subscriptions, row, "קוד ישיבה") === params.acc
      )
        await update(query, "התראות", subscriptions.ordinals[i], [
          ["תפקיד", "תלמיד"],
        ]);
    }
    const help = await load(query, "תקועים");
    const ownPhone = value(sheet, row, "טלפון")
      .replace(/[^0-9]/g, "")
      .slice(-9);
    for (let i = 0; i < help.rows.length; i++) {
      const entry = help.rows[i];
      if (value(help, entry, "טופל")) continue;
      const same = ownPhone
        ? value(help, entry, "טלפון")
            .replace(/[^0-9]/g, "")
            .slice(-9) === ownPhone
        : value(sheet, row, "שם") &&
          value(help, entry, "שם") === value(sheet, row, "שם") &&
          value(help, entry, "קוד ישיבה") === params.acc;
      if (same)
        await update(query, "תקועים", help.ordinals[i], [["טופל", now()]]);
    }
    return { status: "kid" };
  });
  if (notifyAgain)
    await coordinatorPing(
      "ביקש שוב אימות",
      "איש צוות ביקש אימות חוזר לישיבה.",
      "./#admin-acc",
    );
  return result;
}
const rosterCache = new Map<
  string,
  { revision: string; expires: number; rows: string[][] }
>();
async function networkRead(params: Params, marks = false): Promise<Reply> {
  const school = (marks ? params.netmarks : params.netroster).trim();
  if (!isAdmin(params)) {
    const access = await checkStaffAccess(school, params.dev || "");
    if (access.status !== "ok") return access;
  }
  if (marks) {
    await withTransaction(stationSync);
    return {
      status: "ok",
      rows: await rowsWhere(stationTab, "קוד ישיבה", school),
    };
  }
  const meta = await readQuery(
    "SELECT headers,revision FROM sheet_tables WHERE name=$1",
    ["תלמידי הרשת"],
  );
  let rows: string[][] = [];
  if (meta.length) {
    const headers = meta[0].headers as string[],
      revision = String(meta[0].revision);
    const cached = rosterCache.get(school);
    if (cached && cached.revision === revision && cached.expires > Date.now())
      rows = cached.rows;
    else {
      const indices = ["קוד ישיבה", "שכבה", "כיתה", "משפחה", "פרטי"].map(
        (name) => headers.indexOf(name),
      );
      if (indices.every((i) => i >= 0)) {
        const selected = await readQuery(
          "SELECT jsonb_build_array($2::text,cells->>$3::int,cells->>$4::int,cells->>$5::int,cells->>$6::int) AS cells FROM sheet_rows WHERE table_name=$1 AND cells->>$7::int=$2 ORDER BY ordinal",
          [
            "תלמידי הרשת",
            school,
            indices[1],
            indices[2],
            indices[3],
            indices[4],
            indices[0],
          ],
        );
        rows = networkRoster(
          [
            ["קוד ישיבה", "שכבה", "כיתה", "משפחה", "פרטי"],
            ...selected.map((r) => r.cells as string[]),
          ],
          school,
        );
      }
      if (rosterCache.size >= 32)
        rosterCache.delete(rosterCache.keys().next().value!);
      rosterCache.set(school, {
        revision,
        expires: Date.now() + 21600000,
        rows,
      });
    }
  }
  await withTransaction((query) =>
    append(query, "יומן מאגר", [
      ["מתי", now()],
      ["מזהה", params.dev || "רכז"],
      ["קוד ישיבה", school],
      ["תלמידים", String(rows.length)],
    ]),
  );
  return { status: "ok", inst: school, rows };
}
async function writeDeck(body: Body): Promise<Reply> {
  if (!isAdmin(body)) return denied();
  return withTransaction(async (query) => {
    await ensure(query, "מצגת", ["מסכת", "דף", "עוגנים"]);
    const sheet = await load(query, "מצגת");
    if (body.action === "deckDrop") {
      const raw =
        typeof body.paths === "string" ? JSON.parse(body.paths) : body.paths;
      if (!Array.isArray(raw) || raw.some((path) => typeof path !== "string"))
        return failure("Invalid slide paths");
      const paths = new Set<string>(raw),
        removed: Record<string, string>[] = [];
      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i],
          changes = removeAnchorPaths(value(sheet, row, "עוגנים"), paths);
        if (!changes?.removed.length) continue;
        await update(query, "מצגת", sheet.ordinals[i], [
          ["עוגנים", changes.next],
        ]);
        removed.push(
          ...changes.removed.map((item) => ({
            mas: value(sheet, row, "מסכת"),
            daf: value(sheet, row, "דף"),
            ...item,
          })),
        );
      }
      return { status: "ok", removed };
    }
    const mas = String(body.mas || ""),
      daf = String(body.daf || ""),
      val = String(body.val ?? "");
    if (!["taanit", "megila"].includes(mas) || !pageKey(daf))
      return failure("חסרים מסכת או דף");
    const index = sheet.rows.findIndex(
      (row) =>
        value(sheet, row, "מסכת") === mas &&
        pageKey(value(sheet, row, "דף")) === pageKey(daf),
    );
    const current = index < 0 ? "" : value(sheet, sheet.rows[index], "עוגנים");
    if (body.base !== undefined && current !== String(body.base))
      return { status: "changed" };
    if (index < 0) {
      if (val)
        await append(query, "מצגת", [
          ["מסכת", mas],
          ["דף", daf],
          ["עוגנים", val],
        ]);
    } else if (val !== current)
      await update(query, "מצגת", sheet.ordinals[index], [["עוגנים", val]]);
    return {
      status: "ok",
      ...(index < 0 ? { added: !!val } : { row: sheet.ordinals[index] + 1 }),
    };
  });
}
async function help(params: Params): Promise<Reply> {
  const name = String(params.name || "").trim(),
    phone = String(params.phone || "").trim();
  if (!name || phone.replace(/[^0-9]/g, "").length < 9)
    return failure("חסר שם או טלפון");
  await withTransaction((query) =>
    append(query, "תקועים", [
      ["שם", name],
      ["טלפון", phone],
      ["ישיבה", params.instName || ""],
      ["קוד ישיבה", params.inst || ""],
      ["שכבה", params.grade || ""],
      ["כיתה", params.klass || ""],
      ["מכשיר", params.dev || ""],
      ["מה קרה", params.what || ""],
      ["אבחון", params.diag || ""],
      ["טופל", ""],
    ]),
  );
  const notified = await coordinatorPing(
    "🙋 ביקשו עזרה בהתקנה",
    name +
      (params.instName ? " · " + params.instName : "") +
      (params.what ? " — " + params.what.slice(0, 80) : ""),
    "./#admin-help",
  );
  return { status: "ok", ...(notified ? { notified: 1 } : {}) };
}
async function deleteRows(input: Body): Promise<Reply> {
  if (!isAdmin(input)) return denied("סיסמה שגויה");
  if (input.ss) return failure("Custom sheets are unsupported");
  const tab = String(input.clear || input.delrow || input.tab || "");
  const clearing = !!input.clear || input.action === "clear";
  return withTransaction(async (query) => {
    const sheet = await load(query, tab);
    if (!sheet.exists) return failure("אין לשונית בשם " + tab);
    if (clearing) {
      await remove(query, tab, sheet.ordinals);
      return { status: "success", tab, removed: sheet.rows.length, left: 0 };
    }
    const column = String(input.col || "");
    if (!sheet.headers.includes(column))
      return failure("אין עמודה בשם " + column);
    const raw =
      typeof input.vals === "string"
        ? JSON.parse(input.vals || "[]")
        : input.vals;
    const wanted = new Set(
      (Array.isArray(raw) ? raw : []).map((item) => String(item).trim()),
    );
    const hits = sheet.ordinals.filter((_, index) =>
      wanted.has(value(sheet, sheet.rows[index], column)),
    );
    await remove(query, tab, hits);
    return {
      status: "success",
      tab,
      removed: hits.length,
      left: sheet.rows.length - hits.length,
    };
  });
}
async function saveContact(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied("סיסמה שגויה");
  const input = JSON.parse(params.contactSave || "{}") as {
    name?: string;
    people?: { name?: string; phone?: string; phone2?: string }[];
    last?: boolean;
  };
  const name = String(input.name || "").trim();
  if (!name) return failure("חסר שם ישיבה");
  const people = (input.people || []).filter(
    (person) => person && (person.name || person.phone),
  );
  return withTransaction(async (query) => {
    const tab = "אנשי קשר";
    await ensure(query, tab, []);
    const sheet = await load(query, tab),
      wanted = contactKey(name);
    const index = sheet.rows.findIndex((row) =>
      row.slice(0, 3).some((cell) => contactKey(cell) === wanted),
    );
    if (index < 0) {
      await insertCells(query, tab, [
        name,
        ...contactCells(people),
        ...(input.last ? ["TRUE"] : []),
      ]);
      return { status: "ok", saved: 1, created: 1, added: people.length };
    }
    const row = sheet.rows[index],
      added = contactCells(people, row);
    if (added.length) {
      let last = 0;
      row.forEach((cell, position) => {
        if (String(cell).trim()) last = position + 1;
      });
      await setCells(query, tab, sheet.ordinals[index], [
        ...row.slice(0, last),
        ...added,
      ]);
    }
    return { status: "ok", saved: 1, created: 0, added: added.length ? 1 : 0 };
  });
}
const archiveHeaders = [
  "מתי",
  "מזהה",
  "שם",
  "משפחה",
  "ישיבה",
  "תפקיד",
  "לשונית",
  "שורה",
];
async function archive(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied("סיסמה שגויה");
  if (params.archive || params.unarchive) {
    const id = String(params.archive || params.unarchive).trim();
    if (!id) return failure("חסר מזהה");
    return withTransaction(async (query) => {
      if (params.archive) {
        const people = await load(query, "לומדים");
        const hits = people.rows
          .map((row, index) => ({ row, ordinal: people.ordinals[index] }))
          .filter(({ row }) => value(people, row, "מזהה") === id);
        if (!hits.length) return { status: "success", moved: 0 };
        await ensure(query, "ארכיון", archiveHeaders);
        for (const { row } of hits) {
          const record = Object.fromEntries(
            people.headers.flatMap((header, index) =>
              header ? [[header, row[index] || ""]] : [],
            ),
          );
          await insertRecord(query, "ארכיון", {
            מתי: now(),
            מזהה: id,
            שם: value(people, row, "שם"),
            משפחה: value(people, row, "משפחה"),
            ישיבה: value(people, row, "ישיבה"),
            תפקיד: value(people, row, "תפקיד"),
            לשונית: "לומדים",
            שורה: JSON.stringify(record),
          });
        }
        await remove(
          query,
          "לומדים",
          hits.map(({ ordinal }) => ordinal),
        );
        return { status: "success", moved: hits.length };
      }
      const stored = await load(query, "ארכיון");
      const hits = stored.ordinals.filter((_, index) => {
        const row = stored.rows[index];
        return (
          value(stored, row, "מזהה") === id &&
          value(stored, row, "לשונית") === "לומדים"
        );
      });
      if (!hits.length) return failure("אין בארכיון שורה כזו");
      for (const ordinal of hits) {
        const row = stored.rows[stored.ordinals.indexOf(ordinal)];
        await insertRecord(
          query,
          "לומדים",
          stringRecord(JSON.parse(value(stored, row, "שורה") || "{}")),
        );
      }
      await remove(query, "ארכיון", hits);
      return { status: "success", restored: hits.length };
    });
  }
  const stored = sheetOf(table(await load(readQuery, "ארכיון")));
  const seen = new Set<string>(),
    people = [];
  for (let index = stored.rows.length - 1; index >= 0; index--) {
    const row = stored.rows[index],
      id = value(stored, row, "מזהה");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    people.push({
      id,
      first: value(stored, row, "שם"),
      last: value(stored, row, "משפחה"),
      instName: value(stored, row, "ישיבה"),
      role: value(stored, row, "תפקיד"),
      at: value(stored, row, "מתי"),
    });
  }
  return { status: "ok", people };
}
async function dedupe(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied("סיסמה שגויה");
  return withTransaction(async (query) => {
    const first = await load(query, "לומדים");
    const lastOf = new Map<string, number>();
    first.rows.forEach((row, index) => {
      const id = value(first, row, "מזהה");
      if (id) lastOf.set(id, index);
    });
    const duplicates = first.ordinals.filter((_, index) => {
      const id = value(first, first.rows[index], "מזהה");
      return id && lastOf.get(id) !== index;
    });
    await remove(query, "לומדים", duplicates);
    // Same person registered from several devices: keep the newest details under the first ID.
    const sheet = await load(query, "לומדים"),
      groups = new Map<string, number[]>();
    sheet.rows.forEach((row, index) => {
      const key = rowKey(sheet, row);
      if (key) groups.set(key, [...(groups.get(key) || []), index]);
    });
    let merged = 0;
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const canonical = value(sheet, sheet.rows[group[0]], "מזהה"),
        keep = group[group.length - 1],
        keepId = value(sheet, sheet.rows[keep], "מזהה");
      const ids = [
        ...new Set(group.flatMap((index) => rowIds(sheet, sheet.rows[index]))),
      ].filter((id) => id !== canonical);
      await remove(
        query,
        "לומדים",
        group.slice(0, -1).map((index) => sheet.ordinals[index]),
      );
      if (keepId !== canonical) {
        await query("DELETE FROM person_aliases WHERE person_id=$1", [keepId]);
        await query("DELETE FROM people WHERE id=$1", [keepId]);
      }
      await update(query, "לומדים", sheet.ordinals[keep], [
        ["מזהה", canonical],
        ["מזהים נוספים", ids.join(" ")],
      ]);
      merged++;
    }
    return { status: "ok", removed: duplicates.length, merged };
  });
}
async function writeRow(body: Body): Promise<Reply> {
  const tab = String(body.tab || "");
  let cols = columns(body.cols);
  if (!isAdmin(body)) {
    if (tab === stationTab && body.dev && body.inst && !body.ss) {
      const access = await checkStaffAccess(
        String(body.inst),
        String(body.dev),
      );
      if (access.status !== "ok") return access;
      cols = attendanceCells(cols, String(body.inst));
      return withTransaction(async (query) => {
        if (
          schoolGrant(
            table(await load(query, "גישה")),
            String(body.inst),
            String(body.dev),
          ) !== "ok"
        )
          return denied("הגישה לישיבה לא אושרה");
        const sheet = await load(query, tab),
          id = cols.find(([name]) => name === "מזהה")?.[1];
        const index = id
          ? sheet.rows.findIndex(
              (row) =>
                value(sheet, row, "מזהה") === id &&
                value(sheet, row, "קוד ישיבה") === String(body.inst),
            )
          : -1;
        if (index < 0) return append(query, tab, cols);
        await update(query, tab, sheet.ordinals[index], cols);
        return { status: "ok" };
      });
    }
    if (body.ss || !publicRowTabs[tab])
      return denied("כתיבה ללשונית " + tab + " דורשת את סיסמת הסקריפט");
    cols = cols.filter(([name]) => publicRowTabs[tab].includes(name));
    if (
      tab === "התראות" &&
      cols.some(([name, cell]) => name === "תפקיד" && cell.trim() === "רכז")
    )
      return denied("רישום כרכז דורש את סיסמת הסקריפט");
  } else if (body.ss) return failure("Custom sheets are unsupported");
  return withTransaction(async (query) => {
    if (tab === "לומדים")
      await bestEffort(query, () =>
        markJoined(
          query,
          cols.find(([name]) => name === "קוד ישיבה")?.[1] || "",
          "",
        ),
      );
    return append(query, tab, cols);
  });
}
async function writeTable(body: Body): Promise<Reply> {
  if (!isAdmin(body))
    return denied(
      "כתיבה ללשונית " + String(body.tab) + " דורשת את סיסמת הסקריפט",
    );
  if (body.ss) return failure("Custom sheets are unsupported");
  const tab = String(body.tab || "");
  if (sourceOwnedTabs[tab])
    return denied("הלשונית " + tab + " נכתבת רק בגיליון — לא נדרסת מהאפליקציה");
  const headers = (
    typeof body.cols === "string" ? JSON.parse(body.cols) : body.cols
  ) as unknown[];
  const rows = (
    typeof body.rows === "string" ? JSON.parse(body.rows) : body.rows
  ) as unknown[][];
  if (!Array.isArray(headers) || !Array.isArray(rows))
    return failure("Invalid table");
  return replace(tab, headers.map(String), rows);
}
async function replace(tab: string, headers: string[], rows: unknown[][]) {
  const cells = rows.map((row) =>
    headers.map((_, index) =>
      Array.isArray(row) && row[index] != null ? String(row[index]) : "",
    ),
  );
  const result = await withTransaction((query) =>
    query("SELECT replace_sheet_table($1,$2::jsonb,$3::jsonb) AS result", [
      tab,
      JSON.stringify(headers),
      JSON.stringify(cells),
    ]),
  );
  return { ...(result[0].result as Reply), count: cells.length };
}
async function stableIdStep(body: Body): Promise<Reply> {
  if (!isAdmin(body)) return denied();
  const tab = String(body.tab || ""),
    backup = "גיבוי מזהים · " + tab;
  if (stableIdColumns[tab] === undefined) return failure("לשונית לא מוכרת");
  const parsed = (name: string): string[][] => {
    const raw =
      typeof body[name] === "string"
        ? JSON.parse(String(body[name]))
        : body[name];
    if (
      !Array.isArray(raw) ||
      raw.some(
        (row) =>
          !Array.isArray(row) || row.some((cell) => typeof cell !== "string"),
      )
    )
      throw new Error("Invalid stable ID rows");
    return raw;
  };
  const put = async (
    query: Query,
    name: string,
    headers: string[],
    rows: string[][],
  ) => {
    await query("SELECT replace_sheet_table($1,$2::jsonb,$3::jsonb)", [
      name,
      JSON.stringify(headers),
      JSON.stringify(rows),
    ]);
  };
  let result: Reply;
  try {
    result = await withTransaction(async (query) => {
      const current = await load(query, tab),
        saved = await load(query, backup);
      const aside = tab + " · קודם " + now() + " " + randomUUID().slice(0, 8);
      if (body.mode === "restore") {
        const meta = await query(
          "SELECT metadata->>'sidVerified' AS verified FROM sheet_tables WHERE name=$1",
          [backup],
        );
        if (!saved.exists || meta[0]?.verified !== "true")
          return { status: "nobak", message: "אין גיבוי מאומת" };
        if (current.exists)
          await put(query, aside, current.headers, current.rows);
        await put(query, tab, saved.headers, saved.rows);
        if (
          JSON.stringify(table(await load(query, tab))) !==
          JSON.stringify(table(saved))
        )
          throw new Error("Restore verification failed");
        return {
          status: "ok",
          restored: true,
          aside: current.exists ? aside : "",
        };
      }
      const head =
        typeof body.head === "string" ? JSON.parse(body.head) : body.head;
      if (!Array.isArray(head) || head.some((cell) => typeof cell !== "string"))
        throw new Error("Invalid stable ID headers");
      const plan = parsed("plan"),
        base = parsed("base");
      const prepared = stableIdPlan(tab, table(current), base, plan, head);
      if (prepared.status === "changed") {
        if (
          saved.exists &&
          JSON.stringify(current.rows) === JSON.stringify(plan)
        )
          return { status: "ok", already: true, cells: 0, added: 0, backup };
        return prepared;
      }
      if (
        saved.exists &&
        JSON.stringify(table(saved)) !== JSON.stringify(table(current))
      )
        await put(
          query,
          backup + " · קודם " + now() + " " + randomUUID().slice(0, 8),
          saved.headers,
          saved.rows,
        );
      await put(query, backup, prepared.headers, current.rows);
      if (
        JSON.stringify(table(await load(query, backup))) !==
        JSON.stringify([prepared.headers, ...current.rows])
      )
        throw new Error("Backup verification failed");
      await query(
        "UPDATE sheet_tables SET metadata=jsonb_set(metadata,'{sidVerified}','true'::jsonb) WHERE name=$1",
        [backup],
      );
      await put(query, tab, prepared.headers, prepared.rows);
      if (
        JSON.stringify((await load(query, tab)).rows) !==
        JSON.stringify(prepared.rows)
      )
        throw new Error("Stable ID verification failed");
      return {
        status: "ok",
        cells: prepared.cells,
        added: prepared.added,
        backup,
      };
    });
  } catch {
    result = {
      status: "error",
      message: "הפעולה לא אומתה. השינוי בוטל והמקור נשמר.",
    };
  }
  result = {
    ...result,
    rid: String(body.rid || ""),
    tab,
    mode: String(body.mode || "write"),
    t: now(),
  };
  await withTransaction(async (query) => {
    await ensure(query, "__sid_step", ["מזהה", "תוצאה"]);
    await upsert(
      query,
      "__sid_step",
      [
        ["מזהה", "last"],
        ["תוצאה", JSON.stringify(result)],
      ],
      "מזהה",
    );
  });
  return result;
}
async function register(body: Body): Promise<Reply> {
  const books = Array.isArray(body.mas)
    ? body.mas.join(",")
    : String(body.mas || "");
  return withTransaction(async (query) => {
    await bestEffort(query, () =>
      markJoined(query, String(body.code || ""), books),
    );
    if (body.access)
      await ensureCode(query, String(body.code || ""), String(body.access));
    if (body.code && body.who)
      await bestEffort(query, () => flagRegistrationConflict(query, body));
    const text = (name: string, fallback: unknown = "") =>
      String(body[name] ?? fallback);
    return append(
      query,
      "הרשמות",
      body.cols
        ? columns(body.cols)
        : [
            ["ישיבה", text("inst")],
            ["קוד", text("code")],
            ["איש קשר", text("who")],
            ["טלפון", text("phone")],
            ["רכז צוות", text("who2")],
            ["טלפון הרכז", text("phone2")],
            ["תענית · ושננתם", text("taanit-veshinantam", 0)],
            ["תענית · הסוגיה היומית", text("taanit-sugya", 0)],
            ["מגילה · ושננתם", text("megila-veshinantam", 0)],
            ["מגילה · הסוגיה היומית", text("megila-sugya", 0)],
            ['סה"כ גמרות', text("total", 0)],
            ["פירוט", text("seferName")],
          ],
    );
  });
}
async function quiz(body: Body): Promise<Reply> {
  return withTransaction((query) =>
    append(
      query,
      "חידות",
      body.cols
        ? columns(body.cols)
        : [
            ["שבוע", String(body.week ?? "")],
            ["ישיבה", String(body.inst ?? "")],
            ["שם", String(body.name ?? "")],
            ["טלפון", String(body.phone ?? "")],
            ["תשובה", String(Number(body.answer) + 1)],
            ["נכון", body.correct ? "נכון" : "לא נכון"],
          ],
    ),
  );
}
async function delegate(operation: "read" | "write", payload: Params) {
  const { databaseAction } = await import("./database-actions.ts");
  try {
    return (await databaseAction(operation, payload)) as Reply;
  } catch (error) {
    if (error instanceof Error && error.message === "Access denied")
      return denied();
    throw error;
  }
}
const strings = (input: Body): Params =>
  Object.fromEntries(
    Object.entries(input).flatMap(([key, item]) =>
      typeof item === "string" ? [[key, item]] : [],
    ),
  );
async function clockState(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied();
  const sheet = await load(readQuery, "פעילות השעון"),
    row = sheet.rows.at(-1);
  const configured = !!(process.env.GH_TOKEN && process.env.GH_REPO);
  return {
    status: "ok",
    backend: "neon",
    clock: configured || !!row,
    last: row
      ? {
          at: value(sheet, row, "מתי"),
          code: Number(value(sheet, row, "קוד")),
          err: value(sheet, row, "שגיאה"),
        }
      : null,
    message: "התזמון מנוהל ב-GitHub Actions.",
  };
}
async function clockFire(params: Params): Promise<Reply> {
  if (!isAdmin(params)) return denied();
  const repository = process.env.GH_REPO,
    token = process.env.GH_TOKEN;
  if (!token || !repository || !/^[\w.-]+\/[\w.-]+$/.test(repository))
    return failure("GitHub אינו מוגדר");
  const response = await fetch(
    "https://api.github.com/repos/" + repository + "/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ event_type: "push-clock" }),
      signal: AbortSignal.timeout(15000),
    },
  );
  return response.status === 204
    ? { ...(await clockState(params)), message: "הבקשה להרצה התקבלה ב-GitHub." }
    : failure("GitHub לא אישר את הבקשה להרצה");
}
export async function neonLegacyGet(
  name: string,
  params: Params,
): Promise<Reply> {
  switch (name) {
    case "health":
      return health(params);
    case "help":
      return help(params);
    case "setup":
      return params.setup === "clockfire"
        ? clockFire(params)
        : clockState(params);
    case "digest":
      return dispatchDigest(params);
    case "helpdone":
      return markHandled(params, "תקועים", params.helpdone);
    case "conflictdone":
      return markHandled(params, "התנגשויות הרשמה", params.conflictdone);
    case "sayDone": {
      if (!isAdmin(params)) return denied();
      const { reportOperationalMessage } =
        await import("./operational-store.ts");
      const found = await reportOperationalMessage(params.sayDone, {
        n: Number(params.n) || 0,
        bad: Number(params.bad) || 0,
        gone: Number(params.gone) || 0,
        why: params.why,
        none: params.none === "1",
        run: params.run === "1",
      });
      return found ? { status: "ok" } : { status: "ok", none: 1 };
    }
    case "resend":
      return resend(params);
    case "say":
      return notify(params);
    case "mark":
      return {
        status: "ok",
        ...markProgress(
          await rowsWhere("לימוד", "מזהה", params.mark),
          params.mark,
          params.wk || "",
        ),
      };
    case "funnel":
    case "trails":
      // The rewritten join flow no longer records entry analytics; history stays in its Drive file.
      if (!isAdmin(params)) return failure("סיסמת קריאה שגויה");
      return name === "funnel"
        ? { status: "ok", people: [], errs: {}, jserrs: {}, at: now() }
        : { status: "ok", rows: [], at: now() };
    case "arrived":
      return arrived(params);
    case "pair": {
      const sheet = sheetOf(await rowsWhere("זוגות", "מזהה", params.pair));
      return {
        status: "ok",
        has: sheet.rows.some(
          (row) =>
            value(sheet, row, "מסלול") + "|" + value(sheet, row, "שבוע") ===
            params.wk,
        ),
      };
    }
    case "pairok":
      return pairConfirm(params);
    case "pairSeen":
      return {
        status: "ok",
        seen: pairSeen(
          await readDatabaseTableOrEmpty("זוגות"),
          params.pairSeen,
          params.wk || "",
          params.side || "",
        ),
      };
    case "pendingFor":
      return {
        status: "ok",
        pending: pendingFor(
          await readDatabaseTableOrEmpty("זוגות"),
          params.pendingFor,
        ),
      };
    case "idFor":
    case "amdaFor":
    case "whoIs":
    case "board":
    case "team":
      return delegate("read", params);
    case "codes":
      if (!params.newcode) return delegate("read", params);
      if (!isAdmin(params)) return denied("סיסמה שגויה");
      return {
        status: "ok",
        inst: params.newcode,
        code: await withTransaction((query) =>
          setCode(query, params.newcode, newCode()),
        ),
      };
    case "acc":
      return params.pick ? pickAccess(params) : access(params);
    case "netroster":
      return networkRead(params);
    case "netmarks":
      return networkRead(params, true);
    case "sidStep": {
      if (!isAdmin(params)) return denied();
      const sheet = await load(readQuery, "__sid_step");
      const row = sheet.rows.find(
        (row) => value(sheet, row, "מזהה") === "last",
      );
      return {
        status: "ok",
        version: legacyApiVersion,
        sid: row ? JSON.parse(value(sheet, row, "תוצאה")) : null,
      };
    }
    case "accset": {
      if (!isAdmin(params)) return denied();
      if (!["אושר", "נעול", "ממתין"].includes(params.st || ""))
        return failure("מצב לא מוכר");
      const previous = await withTransaction(async (query) => {
        const sheet = await load(query, "גישה");
        const row = sheet.rows.find(
          (row) => value(sheet, row, "מזהה") === params.accset,
        );
        if (!row) throw new Error("Unknown staff request");
        const previous = {
          state: value(sheet, row, "מצב"),
          school: value(sheet, row, "קוד ישיבה"),
        };
        await upsert(
          query,
          "גישה",
          [
            ["מזהה", params.accset],
            ["מצב", params.st],
            ["הוחלט", now()],
          ],
          "מזהה",
        );
        return previous;
      });
      let pushed = false;
      if (
        params.st === "אושר" &&
        previous.state !== "אושר" &&
        params.t &&
        params.b
      ) {
        try {
          const reply = await notify({
            key: params.key,
            only: previous.school,
            title: params.t.slice(0, 120),
            body: params.b.slice(0, 400),
            who: "מערכת",
            url: "/management#phone",
            flt: JSON.stringify({ ids: [params.accset] }),
          });
          pushed = reply.status === "ok";
        } catch {
          /* Approval remains valid even when notification delivery is unavailable. */
        }
      }
      return { status: "ok", pushed, ...(pushed ? { notified: 1 } : {}) };
    }
    case "recount":
      // Public counters are live views over people and progress, so there is nothing to rebuild.
      return isAdmin(params) ? { status: "ok" } : denied("סיסמה שגויה");
    case "delete":
      return deleteRows(params);
    case "contactSave":
      return saveContact(params);
    case "archive":
      return archive(params);
    case "dedupe":
      return dedupe(params);
    case "read":
      return readLegacyTable(params);
  }
  throw new UnsupportedLegacyAction("Unsupported legacy read");
}
async function readDatabaseTableOrEmpty(tab: string) {
  return table(await load(readQuery, tab));
}
export async function neonLegacyPost(body: Body): Promise<Reply> {
  switch (body.action) {
    case "hit":
    case "trail":
      return { status: "ignored" };
    case "row":
      return writeRow(body);
    case "table":
      return writeTable(body);
    case "teamlog":
    case "ghput":
    case "ghdel":
      return delegate("write", strings(body));
    case "clear":
    case "delrow":
      return deleteRows({ ...body, [String(body.action)]: body.tab });
    case "register":
      return register(body);
    case "quiz":
      return quiz(body);
    case "amdakind":
      return isAdmin(body)
        ? stationKind(body)
        : denied("דורש את סיסמת הסקריפט");
    case "sidStep":
      return stableIdStep(body);
    case "deckRow":
    case "deckDrop":
      return writeDeck(body);
    case "texts": {
      if (!isAdmin(body)) return denied("פרסום המלל דורש את סיסמת הסקריפט");
      const raw =
        typeof body.rows === "string" ? JSON.parse(body.rows) : body.rows;
      const rows = (Array.isArray(raw) ? raw : []).map((row) =>
        row && typeof row === "object" && "key" in row
          ? [row.key, row.value]
          : row,
      );
      return replace("טקסטים", ["מפתח", "נוסח"], rows);
    }
  }
  return { status: "ignored", action: String(body.action || "") };
}
