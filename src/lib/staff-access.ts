import { stored } from "./client";
export type StaffIdentity = {
  id: string;
  inst: string;
  first?: string;
  last?: string;
  phone?: string;
};
export function staffIdentity(school: string): StaffIdentity | null {
  if (stored("stuLock", "") === school) return null;
  for (const key of ["head", "ram"]) {
    const person = stored<StaffIdentity | null>(key, null);
    if (person?.id && person.inst === school) return person;
  }
  return null;
}
export function clearStaffCaches() {
  try {
    const keys = Array.from(
      { length: localStorage.length },
      (_, i) => localStorage.key(i) || "",
    );
    for (const key of keys)
      if (
        /^df:(rosterCache:|instCodes$|attR$)/.test(key) ||
        /^boardKey:/.test(key)
      )
        localStorage.removeItem(key);
  } catch {
    /* Storage is optional. */
  }
}
export async function staffRequest(
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      operation: "legacy",
      payload: { method: "GET", query: new URLSearchParams(params).toString() },
    }),
  });
  if (!response.ok) throw new Error("Staff request failed");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("status" in result))
    throw new Error("Invalid staff response");
  return result as Record<string, unknown>;
}
