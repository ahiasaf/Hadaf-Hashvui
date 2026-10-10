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
const ownCachePrefix = "df:own:";
const refreshKey = "df:public-refresh-until";
const day = 86400000;
let publicGeneration = 0;
type Saved<T> = { value: T; at: number };
// Device cache for validated public tables and the device's own progress lookups only.
function saved<T>(key: string): Saved<T> | null {
  try {
    const entry = JSON.parse(localStorage.getItem(key) || "null");
    return entry && typeof entry.at === "number" && "value" in entry
      ? entry
      : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  const text = JSON.stringify({ value, at: Date.now() });
  try {
    localStorage.setItem(key, text);
  } catch {
    // A full device drops this cache, never other app data, then tries once more.
    try {
      for (const name of Object.keys(localStorage))
        if (name.startsWith(publicCachePrefix)) localStorage.removeItem(name);
      localStorage.setItem(key, text);
    } catch {
      /* Storage is optional. */
    }
  }
}
export function clearPublicCache() {
  publicGeneration++;
  pending.clear();
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(publicCachePrefix)) localStorage.removeItem(key);
    }
    sessionStorage.setItem(refreshKey, String(Date.now() + 300000));
  } catch {
    /* Storage is optional. */
  }
}
// Stale-while-revalidate: a stored copy answers instantly while one network read refreshes it.
export function sheet(tab: string, fresh = false, query = "") {
  if (!publicTables.has(tab))
    return Promise.reject(new Error("Not a public table"));
  const cacheKey = tab + "|" + query;
  const storageKey = publicCachePrefix + cacheKey;
  const live = ["דפים פתוחים", "מונים", "מוני-לימוד"].includes(tab);
  const lifetime = live ? 30000 : 300000;
  let bypass = fresh;
  try {
    bypass ||= Number(sessionStorage.getItem(refreshKey)) > Date.now();
  } catch {
    /* Storage is optional. */
  }
  const generation = publicGeneration;
  const load = () => {
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
      if (generation === publicGeneration) save(storageKey, rows);
      return rows;
    });
    pending.set(cacheKey, { task, expires: Date.now() + lifetime });
    task.catch(() => {
      if (pending.get(cacheKey)?.task === task) pending.delete(cacheKey);
    });
    return task;
  };
  const cached = fresh ? undefined : pending.get(cacheKey);
  const current = cached && cached.expires > Date.now() ? cached.task : null;
  const stored = fresh ? null : saved<string[][]>(storageKey);
  if (stored && Array.isArray(stored.value)) {
    const age = Date.now() - stored.at;
    if (age < lifetime) return Promise.resolve(stored.value);
    if (age < (live ? day : 7 * day)) {
      if (!current) load().catch(() => undefined);
      return Promise.resolve(stored.value);
    }
  }
  return current || load();
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
// Keyless lookups of this device's own progress; staff and private reads are never stored.
function ownLookup(payload: Record<string, string>) {
  const keys = Object.keys(payload);
  return keys.length === 1 && ["idFor", "amdaFor"].includes(keys[0])
    ? ownCachePrefix + keys[0] + ":" + payload[keys[0]]
    : "";
}
export async function action<T = Record<string, unknown>>(
  operation: "read" | "write",
  payload: Record<string, string>,
): Promise<T> {
  if (operation === "write")
    return JSON.parse(await sendAction(operation, payload));
  const own = ownLookup(payload);
  if (own) {
    const refresh = sendAction(operation, payload).then((text) => {
      save(own, JSON.parse(text));
      return text;
    });
    const stored = saved<T>(own);
    if (stored) {
      refresh.catch(() => undefined);
      return stored.value;
    }
    return JSON.parse(await refresh);
  }
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
