import { parseCsv } from "./csv";
export type Person = {
  id: string;
  inst: string;
  instName: string;
  first: string;
  last: string;
  phone: string;
  role: string;
  way: string;
  grade: string;
  klass: string;
  dadFirst?: string;
  dadLast?: string;
  dadPhone?: string;
  rel?: string;
};
export function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem("df:" + key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function store(key: string, value: unknown) {
  try {
    localStorage.setItem("df:" + key, JSON.stringify(value));
  } catch {
    /* Private mode can disable storage. */
  }
}
// Only these validated public tables may be retained across page navigation.
const publicTables = new Set([
  "מוסדות",
  "מצגות",
  "דפים פתוחים",
  "מונים",
  "מוני-לימוד",
  "טקסטים",
  "הגדרות",
  "נוסחים",
  "סימוני הדף",
  "פירוש",
  "שאלות בדף",
  "מצגת",
]);
const pending = new Map<
  string,
  { task: Promise<string[][]>; expires: number }
>();
const publicCachePrefix = "df:public:";
const refreshKey = "df:public-refresh-until";
let publicGeneration = 0;
export function clearPublicCache() {
  publicGeneration++;
  pending.clear();
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(publicCachePrefix)) sessionStorage.removeItem(key);
    }
    sessionStorage.setItem(refreshKey, String(Date.now() + 300000));
  } catch {
    /* Storage is optional. */
  }
}
export function sheet(tab: string, fresh = false, query = "") {
  if (!publicTables.has(tab))
    return Promise.reject(new Error("Not a public table"));
  const cacheKey = tab + "|" + query;
  const storageKey = publicCachePrefix + cacheKey;
  const lifetime = ["דפים פתוחים", "מונים", "מוני-לימוד"].includes(tab)
    ? 30000
    : 300000;
  const cached = pending.get(cacheKey);
  if (!fresh && cached && cached.expires > Date.now()) return cached.task;
  if (!fresh) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved?.expires > Date.now() && Array.isArray(saved.rows)) {
        return Promise.resolve(saved.rows as string[][]);
      }
    } catch {
      /* Continue with a validated network read. */
    }
  }
  let bypass = fresh;
  try {
    bypass ||= Number(sessionStorage.getItem(refreshKey)) > Date.now();
  } catch {
    /* Storage is optional. */
  }
  const generation = publicGeneration;
  const task = fetch(
    "/api/sheets?" +
      new URLSearchParams({
        tab,
        ...(query ? { tq: query } : {}),
        ...(bypass ? { fresh: String(Date.now()) } : {}),
      }),
    {
      signal: AbortSignal.timeout(10000),
      ...(bypass ? { cache: "no-store" as const } : {}),
    },
  ).then(async (response) => {
    if (!response.ok) throw new Error("Read failed");
    const rows = parseCsv(await response.text());
    try {
      if (generation === publicGeneration)
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ rows, expires: Date.now() + lifetime }),
        );
    } catch {
      /* Storage is optional. */
    }
    return rows;
  });
  pending.set(cacheKey, { task, expires: Date.now() + lifetime });
  task.catch(() => {
    if (pending.get(cacheKey)?.task === task) pending.delete(cacheKey);
  });
  return task;
}
const privateReads = new Map<string, Promise<string>>();
async function sendAction(
  operation: "read" | "write",
  payload: Record<string, string>,
) {
  const response = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, payload }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Action failed");
  const result = await response.json();
  if (!["ok", "success"].includes(result.status))
    throw new Error("Action was not acknowledged");
  if (operation === "write") clearPublicCache();
  return JSON.stringify(result);
}
export async function action<T = Record<string, unknown>>(
  operation: "read" | "write",
  payload: Record<string, string>,
): Promise<T> {
  if (operation === "write")
    return JSON.parse(await sendAction(operation, payload));
  const key = JSON.stringify(
    Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)),
  );
  let task = privateReads.get(key);
  if (!task) {
    task = sendAction(operation, payload);
    privateReads.set(key, task);
  }
  try {
    return JSON.parse(await task);
  } finally {
    if (privateReads.get(key) === task) privateReads.delete(key);
  }
}
export function writeRow(tab: string, cols: [string, string][], key = "") {
  return action("write", {
    action: "row",
    tab,
    cols: JSON.stringify(cols),
    ...(key ? { key } : {}),
  });
}
export function joinColumns(person: Person): [string, string][] {
  return [
    ["מזהה", person.id],
    ["ישיבה", person.instName],
    ["קוד ישיבה", person.inst],
    ["שם", person.first],
    ["משפחה", person.last],
    ["טלפון", person.phone],
    ["תפקיד", person.role === "dad" ? "הורה" : "תלמיד"],
    ["שכבה", person.grade],
    ["כיתה", person.klass],
    [
      "מסגרת",
      (
        {
          solo: "לימוד עצמי",
          dad: "אבות ובנים",
          chav: "חבורת לימוד",
        } as Record<string, string>
      )[person.way] || person.way,
    ],
    [
      "לומד עם",
      person.rel === "friend" ? "חבר" : person.role === "dad" ? "בן" : "אבא",
    ],
    ["שם ההורה", person.dadFirst || ""],
    ["משפחת ההורה", person.dadLast || ""],
    ["טלפון ההורה", person.dadPhone || ""],
  ];
}
