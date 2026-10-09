import { notificationStates } from "./notification-state.ts";
import { publicRowColumns } from "./action-policy.ts";
import {
  authorized,
  database,
  readDatabaseTable,
  stringRecord,
  invalidateDatabaseCache,
  appendDatabaseRecord,
} from "./database.ts";
type Payload = Record<string, string>;
type PersonRow = {
  id: string;
  school_code: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  grade: string;
  class_name: string;
  is_test: boolean;
  details: Record<string, string>;
};
function person(value: Record<string, unknown>): PersonRow {
  const details = stringRecord(value.details);
  if (
    [
      "id",
      "school_code",
      "role",
      "first_name",
      "last_name",
      "phone",
      "grade",
      "class_name",
    ].some((key) => typeof value[key] !== "string") ||
    typeof value.is_test !== "boolean"
  )
    throw new Error("Invalid person record");
  return {
    id: String(value.id),
    school_code: String(value.school_code),
    role: String(value.role),
    first_name: String(value.first_name),
    last_name: String(value.last_name),
    phone: String(value.phone),
    grade: String(value.grade),
    class_name: String(value.class_name),
    is_test: value.is_test,
    details,
  };
}
function columns(text: string): [string, string][] {
  const input: unknown = JSON.parse(text);
  if (
    !Array.isArray(input) ||
    !input.length ||
    !input.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((value) => typeof value === "string") &&
        pair[0].length > 0 &&
        pair[1].length < 12000,
    )
  )
    throw new Error("Invalid columns");
  return input;
}
function requireAdmin(payload: Payload) {
  if (!authorized(payload.key, process.env.READ_KEY))
    throw new Error("Access denied");
}
async function learned(id: string) {
  const result =
    await database()`SELECT track,week FROM learning_progress WHERE person_id=${id} AND is_complete ORDER BY track,week`;
  return result.map((row) => String(row.track) + "|" + String(row.week));
}
async function canonical(id: string) {
  const rows =
    await database()`SELECT person_id FROM person_aliases WHERE alias_id=${id}`;
  return rows.length ? String(rows[0].person_id) : "";
}
async function schoolCode(inst: string) {
  const rows =
    await database()`SELECT cells->>1 AS code FROM sheet_rows WHERE table_name='קודים' AND cells->>0=${inst} ORDER BY ordinal DESC LIMIT 1`;
  return rows.length ? String(rows[0].code || "") : "";
}
async function relationships(ids: string[], includeTest: boolean) {
  const rows =
    await database()`WITH me AS (SELECT * FROM people WHERE id=ANY(${ids}::text[])), candidates AS (
 SELECT me.id AS owner_id,p.* FROM me JOIN people p ON phone_key(p.phone)=phone_key(me.details->>'טלפון ההורה') WHERE phone_key(p.phone)<>''
 UNION SELECT me.id AS owner_id,p.* FROM me JOIN people p ON phone_key(p.details->>'טלפון ההורה')=phone_key(me.phone) WHERE phone_key(me.phone)<>''
 UNION SELECT me.id AS owner_id,p.* FROM me JOIN person_aliases a ON a.alias_id=me.details->>'מזהה המזמין' JOIN people p ON p.id=a.person_id
 UNION SELECT me.id AS owner_id,p.* FROM me JOIN person_aliases a ON a.person_id=me.id JOIN people p ON p.details->>'מזהה המזמין'=a.alias_id
 ) SELECT DISTINCT p.* FROM candidates p JOIN me ON me.id=p.owner_id WHERE p.role<>me.role AND (${includeTest} OR NOT p.is_test) ORDER BY p.owner_id,p.id`;
  const grouped = new Map<string, PersonRow[]>();
  for (const row of rows) {
    const owner = String(row.owner_id),
      list = grouped.get(owner) || [];
    list.push(person(row));
    grouped.set(owner, list);
  }
  return grouped;
}
function personIds(p: PersonRow) {
  return [
    p.id,
    ...(p.details["מזהים נוספים"] || "").split(/\s+/).filter(Boolean),
  ];
}
async function boardNotifications(people: PersonRow[]) {
  const ids = people.flatMap(personIds);
  const rows =
    await database()`SELECT table_name,record FROM sheet_rows WHERE (table_name='התראות' AND record->>'מזהה'=ANY(${ids}::text[])) OR (table_name='נשלחו' AND record->>'מפתח' ~ '^פג[|:]') ORDER BY ordinal`;
  const events: Record<string, string>[] = [],
    expired = new Set<string>();
  for (const row of rows) {
    const record = stringRecord(row.record);
    if (row.table_name === "התראות") events.push(record);
    else if (record["מפתח"]?.startsWith("פג|"))
      expired.add(record["מפתח"].slice(3));
  }
  return notificationStates(events, expired);
}
async function board(payload: Payload) {
  const scope = payload.board.trim(),
    admin = authorized(payload.key, process.env.READ_KEY),
    all = scope === "*";
  if (all && !admin) throw new Error("Access denied");
  if (!all && !admin) {
    const code = await schoolCode(scope);
    if (!code) return { status: "nocode" };
    if (!authorized(payload.k, code)) throw new Error("Access denied");
  }
  const includeTest = payload.test === "1";
  const rows =
    await database()`SELECT * FROM people WHERE (${all} OR school_code=${scope}) AND (${includeTest} OR NOT is_test) ORDER BY id`;
  const selected = rows.map(person);
  // One bounded query returns progress for the selected people, including merged devices.
  const [progress, related, notification] = await Promise.all([
    database()`SELECT person_id,track,week,bool_or(is_complete) AS is_complete,CASE WHEN bool_or(is_complete) THEN 1 ELSE max(fraction) END AS fraction FROM learning_progress WHERE person_id=ANY(${selected.map((p) => p.id)}::text[]) GROUP BY person_id,track,week`,
    relationships(
      selected.map((p) => p.id),
      includeTest,
    ),
    all ? boardNotifications(selected) : Promise.resolve(null),
  ]);
  const states = new Map<
    string,
    { weeks: string[]; pos: Record<string, number> }
  >();
  for (const row of progress) {
    const id = String(row.person_id),
      tag = String(row.track) + "|" + String(row.week);
    const state = states.get(id) || { weeks: [], pos: {} };
    if (row.is_complete) state.weeks.push(tag);
    else state.pos[tag] = Math.round(Number(row.fraction) * 100) / 100;
    states.set(id, state);
  }
  const students = [];
  for (const p of selected.filter((p) => p.role === "kid")) {
    const parents = related.get(p.id) || [];
    students.push({
      id: p.id,
      inst: p.school_code,
      instName: p.details["ישיבה"] || "",
      first: p.first_name,
      last: p.last_name,
      grade: p.grade,
      klass: p.class_name,
      way: p.details["מסגרת"] || "",
      role: "תלמיד",
      with: parents[0]?.first_name || p.details["שם ההורה"] || "",
      withOk: parents.length ? 1 : 0,
      test: p.is_test ? 1 : 0,
      nodev: /^Am/.test(p.id) && !p.details["מזהים נוספים"] ? 1 : 0,
      ...(states.get(p.id) || { weeks: [], pos: {} }),
      ...(all
        ? {
            phone: p.phone,
            ids: personIds(p),
            pars: parents.filter((p) => !p.is_test).map((p) => p.id),
            ...notification!(personIds(p)),
            parPush: parents.some((p) => notification!(personIds(p)).push)
              ? 1
              : 0,
            ...(parents[0]
              ? {
                  par: {
                    id: parents[0].id,
                    first: parents[0].first_name,
                    last: parents[0].last_name,
                    phone: parents[0].phone,
                    push: notification!(personIds(parents[0])).push,
                  },
                }
              : {}),
          }
        : {}),
    });
  }
  const parents = [];
  if (all)
    for (const p of selected.filter((p) => p.role === "dad")) {
      if (!(related.get(p.id) || []).length)
        parents.push({
          id: p.id,
          first: p.first_name,
          last: p.last_name,
          phone: p.phone,
          inst: p.school_code,
          instName: p.details["ישיבה"] || "",
          test: p.is_test ? 1 : 0,
          ids: personIds(p),
          ...notification!(personIds(p)),
        });
    }
  return { status: "ok", inst: scope, students, ...(all ? { parents } : {}) };
}
export async function databaseAction(
  operation: "read" | "write",
  payload: Payload,
): Promise<unknown> {
  if (operation === "write") {
    if (payload.action === "teamlog") {
      if (!authorized(payload.key, process.env.TEAM_KEY))
        throw new Error("Access denied");
      return appendDatabaseRecord("פעולות צוות", columns(payload.cols));
    }
    if (payload.action === "row") {
      if (payload.key) requireAdmin(payload);
      const cols = payload.key
        ? columns(payload.cols)
        : publicRowColumns(payload);
      return appendDatabaseRecord(payload.tab, cols);
    }
    requireAdmin(payload);
    if (payload.action === "table") {
      if (["מצב ישיבות", "הוספות יומן"].includes(payload.tab))
        throw new Error("Source-owned table cannot be replaced");
      const headers: unknown = JSON.parse(payload.cols),
        rows: unknown = JSON.parse(payload.rows);
      if (
        !Array.isArray(headers) ||
        !headers.every((h) => typeof h === "string") ||
        new Set(headers).size !== headers.length ||
        !Array.isArray(rows) ||
        !rows.every(
          (row) =>
            Array.isArray(row) &&
            row.length <= headers.length &&
            row.every((cell) => typeof cell === "string"),
        )
      )
        throw new Error("Invalid table");
      const result =
        await database()`SELECT replace_sheet_table(${payload.tab},${JSON.stringify(headers)}::jsonb,${JSON.stringify(rows)}::jsonb) AS result`;
      invalidateDatabaseCache();
      return result[0].result;
    }
    throw new Error("Unsupported database write");
  }
  if (payload.board) return board(payload);
  if (payload.read) {
    requireAdmin(payload);
    return {
      status: "ok",
      tab: payload.read,
      rows: await readDatabaseTable(payload.read),
    };
  }
  if (payload.team) {
    if (!authorized(payload.key, process.env.TEAM_KEY))
      throw new Error("Access denied");
    return { status: "ok", rows: await readDatabaseTable("תצוגת צוות") };
  }
  if (payload.codes) {
    requireAdmin(payload);
    const rows = await readDatabaseTable("קודים");
    return {
      status: "ok",
      codes: Object.fromEntries(
        rows
          .slice(1)
          .filter((row) => row[0])
          .map((row) => [row[0], row[1] || ""]),
      ),
    };
  }
  if (payload.idFor) {
    const id = await canonical(payload.idFor);
    return {
      status: "ok",
      id,
      learned: id && id !== payload.idFor ? await learned(id) : [],
    };
  }
  if (payload.whoIs) {
    const matches =
      await database()`SELECT * FROM people WHERE phone_key(phone)=phone_key(${payload.whoIs}) AND phone_key(phone)<>'' AND name_key(first_name)=name_key(${payload.first || ""}) AND name_key(last_name)=name_key(${payload.last || ""}) AND (${!["dad", "kid"].includes(payload.role)} OR role=${payload.role}) ORDER BY role DESC,id LIMIT 1`;
    if (!matches.length) return { status: "ok", me: null, learned: [] };
    const p = person(matches[0]);
    return {
      status: "ok",
      me: {
        id: p.id,
        role: p.role,
        rel:
          p.details["לומד עם"] === "חבר"
            ? "friend"
            : p.role === "dad"
              ? "kid"
              : "dad",
        inst: p.school_code,
        instName: p.details["ישיבה"] || "",
        first: p.first_name,
        last: p.last_name,
        grade: p.grade,
        klass: p.class_name,
        way:
          (
            {
              "אבות ובנים": "dad",
              "חבורת לימוד": "chav",
              "לימוד עצמי": "solo",
            } as Record<string, string>
          )[p.details["מסגרת"]] ||
          p.details["מסגרת"] ||
          "",
        dadFirst: p.details["שם ההורה"] || "",
        dadLast: p.details["משפחת ההורה"] || "",
        from: p.details["הוזמן על ידי"] || "",
        withId: p.details["מזהה המזמין"] || "",
      },
      learned: await learned(p.id),
    };
  }
  if (payload.amdaFor) {
    const rows =
      await database()`SELECT record FROM sheet_rows WHERE table_name='עמדה — שיוך' AND record->>'מזהה'=${payload.amdaFor}`;
    return {
      status: "ok",
      learned: rows.map((row) => {
        const r = stringRecord(row.record);
        return (r["מסלול"] || "") + "|" + (r["שבוע"] || "");
      }),
    };
  }
  throw new Error("Unsupported database read");
}
