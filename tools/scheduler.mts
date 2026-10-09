import { createHash } from "node:crypto";
import { databaseEnabled, stringRows } from "../src/server/database.ts";
import {
  operationalAsk,
  operationalWrite,
  claimOperationalNotification,
  settleOperationalNotification,
  SourceUnavailable,
} from "../src/server/operational-store.ts";
export {
  operationalAsk as ask,
  scriptUrl,
} from "../src/server/operational-store.ts";
export const HOURS = 14,
  SENT_TAB = "נשלחו",
  GONE = "פג:";
export type IsraelTime = {
  date: string;
  day: number;
  hour: number;
  min: number;
};
export type Slot = { date: string; day: number; t: string };
export function two(value: number) {
  return String(value).padStart(2, "0");
}
export function israelNow(when = new Date()): IsraelTime {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(when)
      .map((part) => [part.type, part.value]),
  );
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    date: values.year + "-" + values.month + "-" + values.day,
    day: days[values.weekday],
    hour: Number(values.hour),
    min: Number(values.minute),
  };
}
export function slotsDue(now: IsraelTime, hours = HOURS): Slot[] {
  const current = now.hour * 60 + Math.floor(now.min / 30) * 30,
    out: Slot[] = [];
  for (
    let minute = current;
    minute >= 0 && current - minute <= hours * 60;
    minute -= 30
  )
    out.push({
      date: now.date,
      day: now.day,
      t: two(Math.floor(minute / 60)) + ":" + two(minute % 60),
    });
  return out.reverse();
}
export function byHead(rows: string[][]): Record<string, string>[] {
  const headers = rows[0] || [];
  return rows
    .slice(1)
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header.trim(),
          (row[index] || "").trim(),
        ]),
      ),
    );
}
export async function rows(tab: string, key: string) {
  const result = await operationalAsk({ read: tab, key });
  if (!("rows" in result)) throw new Error("Operational response has no rows");
  return stringRows(result.rows);
}
export function quitIfGoogle(error: unknown) {
  if (error instanceof SourceUnavailable)
    console.warn(
      "::warning::Operational source unavailable; no notification was sent from this read",
    );
  // A source outage remains a failed run, so monitoring can detect it.
  return false;
}
export type LedgerStore = {
  read: (tab: string, key: string) => Promise<string[][]>;
  write: (tab: string, cols: [string, string][]) => Promise<void>;
  isNeon: () => boolean;
  claim: (key: string) => Promise<boolean>;
  settle: (key: string, state: string) => Promise<boolean>;
};
export function createScheduler(store: LedgerStore) {
  const uncertain = new Set<string>();
  async function sentRaw(key: string): Promise<Record<string, string>> {
    return Object.fromEntries(
      byHead(await store.read(SENT_TAB, key))
        .filter((row) => row["מפתח"])
        .map((row) => [row["מפתח"], row["מצב"] || ""]),
    );
  }
  async function markOne(key: string, state: string) {
    try {
      await store.write(SENT_TAB, [
        ["מפתח", key],
        ["מצב", state],
        ["מתי", new Date().toISOString()],
      ]);
      return true;
    } catch {
      console.warn("::warning::Notification ledger write was not acknowledged");
      return false;
    }
  }
  async function once<T>(
    key: string,
    send: () => Promise<T>,
    failState?: (error: unknown) => string,
  ): Promise<T | { skipped: true }> {
    let claimed: boolean;
    try {
      claimed = store.isNeon()
        ? await store.claim(key)
        : await markOne(key, "ממתין");
    } catch {
      uncertain.add(key);
      return { skipped: true };
    }
    if (!claimed) {
      if (!store.isNeon()) uncertain.add(key);
      return { skipped: true };
    }
    let value: T;
    try {
      value = await send();
    } catch (error) {
      const state = failState?.(error) || "נכשל";
      try {
        if (
          !(store.isNeon()
            ? await store.settle(key, state)
            : await markOne(key, state))
        )
          uncertain.add(key);
      } catch {
        uncertain.add(key);
      }
      throw error;
    }
    try {
      if (
        !(store.isNeon()
          ? await store.settle(key, "נשלח")
          : await markOne(key, "נשלח"))
      )
        uncertain.add(key);
    } catch {
      uncertain.add(key);
    }
    return value;
  }
  function finish() {
    if (!uncertain.size) return;
    console.error(
      uncertain.size +
        " notification deliveries remain uncertain; automatic duplicate delivery is blocked",
    );
    process.exitCode = 1;
  }
  async function sentMark(keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (await markOne(key, "נשלח")) count++;
      else uncertain.add(key);
    }
    return count;
  }
  async function logRun(
    title: string,
    text: string,
    audience: string,
    n: number,
    bad: number,
    waiting: number,
    gone = 0,
  ) {
    if (!n && !bad && !waiting && !gone) return false;
    const result =
      (n
        ? (bad || gone ? "חלקית: " : "") + "התקבלה אצל שירות ההתראות ל-" + n
        : bad
          ? "נכשלה ל-" + bad
          : gone
            ? "המנוי פג ל-" + gone
            : "אין נמענים עם התראות") +
      (n && bad ? " · נכשלה ל-" + bad : "") +
      ((n || bad) && gone ? " · המנוי פג ל-" + gone : "") +
      (waiting ? " · ממתינים ל-" + waiting : "");
    try {
      await store.write("הודעות", [
        ["מי", "מערכת"],
        ["ישיבה", ""],
        ["קהל", audience],
        ["כותרת", title],
        ["הטקסט", text],
        ["תוצאה", result],
      ]);
      return true;
    } catch {
      console.warn("::warning::Notification summary was not acknowledged");
      return false;
    }
  }
  async function markGone(
    states: Record<string, string>,
    sub: { endpoint: string },
  ) {
    const key = goneKey(sub);
    if (states[key]) return true;
    const saved = await markOne(key, "פג");
    if (saved) states[key] = "פג";
    return saved;
  }
  return {
    sentRaw,
    sentLoad: async (key: string) =>
      Object.fromEntries(
        Object.entries(await sentRaw(key))
          .filter(([, state]) => state !== "נכשל")
          .map(([key]) => [key, 1]),
      ),
    markOne,
    once,
    finish,
    sentMark,
    logRun,
    markGone,
  };
}
export function subPrint(sub: { endpoint: string }) {
  return createHash("sha1").update(sub.endpoint).digest("hex").slice(0, 12);
}
export function goneKey(sub: { endpoint: string }) {
  return "פג|" + subPrint(sub);
}
export function isGone(
  states: Record<string, string>,
  key: string,
  sub: { endpoint: string },
) {
  return !!(
    states[goneKey(sub)] ||
    (key && states[key] === GONE + subPrint(sub))
  );
}
export function sentFrom(states: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(states)
      .filter(
        ([key, state]) =>
          state !== "נכשל" && !state.startsWith(GONE) && !key.startsWith("פג|"),
      )
      .map(([key]) => [key, 1]),
  );
}
export function failGone(sub: { endpoint: string }) {
  return (error: unknown) =>
    error && typeof error === "object" && "gone" in error && error.gone
      ? GONE + subPrint(sub)
      : "נכשל";
}
const scheduler = createScheduler({
  read: rows,
  write: operationalWrite,
  isNeon: databaseEnabled,
  claim: claimOperationalNotification,
  settle: settleOperationalNotification,
});
export const {
  sentRaw,
  sentLoad,
  markOne,
  once,
  finish,
  sentMark,
  logRun,
  markGone,
} = scheduler;
