import settings from "../generated/settings.json" with { type: "json" };
const publicColumns: Record<string, string[]> = {
  לומדים: [
    "מזהה",
    "שם",
    "משפחה",
    "טלפון",
    "ישיבה",
    "קוד ישיבה",
    "שכבה",
    "כיתה",
    "מסגרת",
    "תפקיד",
    "שם ההורה",
    "משפחת ההורה",
    "טלפון ההורה",
    "לומד עם",
    "הוזמן על ידי",
    "מזהה המזמין",
    "בדיקה",
  ],
  לימוד: ["מזהה", "קוד ישיבה", "מסלול", "שבוע", "דף", "קטע", "מתוך", "בדיקה"],
  התראות: [
    "מזהה",
    "שם",
    "טלפון",
    "ישיבה",
    "קוד ישיבה",
    "תפקיד",
    "שכבה",
    "כיתה",
    "מכשיר",
    "מנוי",
    "תוצאה",
    "מועד",
    "מתי",
    "דפדפן",
  ],
};
const reads = new Set([
  "board",
  "key",
  "k",
  "test",
  "read",
  "whoIs",
  "first",
  "last",
  "role",
  "idFor",
  "amdaFor",
  "codes",
  "team",
]);
export async function forwardAction(input: unknown, request = fetch) {
  if (!input || typeof input !== "object") throw new Error("Invalid action");
  const envelope = input as {
    operation?: string;
    payload?: Record<string, unknown>;
  };
  const payload = envelope.payload;
  if (
    !payload ||
    Object.values(payload).some((value) => typeof value !== "string") ||
    JSON.stringify(payload).length > 2200000
  )
    throw new Error("Invalid payload");
  let response: Response;
  if (envelope.operation === "read") {
    if (
      Object.keys(payload).some((key) => !reads.has(key)) ||
      !["board", "read", "whoIs", "idFor", "amdaFor", "codes", "team"].some(
        (key) => payload[key],
      )
    )
      throw new Error("Invalid read");
    if (
      (payload.read ||
        payload.codes ||
        payload.team ||
        payload.board === "*") &&
      !payload.key
    )
      throw new Error("Authentication required");
    const url = new URL(settings.api);
    for (const [key, value] of Object.entries(payload))
      url.searchParams.set(key, String(value));
    response = await request(url, { signal: AbortSignal.timeout(18000) });
  } else if (envelope.operation === "write") {
    if (!["row", "table", "ghput"].includes(String(payload.action)))
      throw new Error("Invalid write");
    if (!payload.key) {
      if (
        payload.action !== "row" ||
        typeof payload.tab !== "string" ||
        !publicColumns[payload.tab] ||
        Object.keys(payload).some(
          (key) => !["action", "tab", "cols"].includes(key),
        )
      )
        throw new Error("Authentication required");
      const cols: unknown = JSON.parse(String(payload.cols));
      if (
        !Array.isArray(cols) ||
        !cols.length ||
        !cols.every(
          (pair) =>
            Array.isArray(pair) &&
            pair.length === 2 &&
            publicColumns[String(payload.tab)].includes(pair[0]) &&
            typeof pair[1] === "string" &&
            pair[1].length < 12000 &&
            !(
              payload.tab === "התראות" &&
              pair[0] === "תפקיד" &&
              pair[1] === "רכז"
            ),
        )
      )
        throw new Error("Invalid columns");
    }
    if (payload.ss) throw new Error("Custom sheets are unsupported");
    response = await request(settings.api, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(18000),
    });
  } else throw new Error("Invalid operation");
  if (!response.ok) throw new Error("Upstream action failed");
  const result = await response.json();
  if (!["ok", "success"].includes(result.status))
    throw new Error(
      result.status === "denied"
        ? "Access denied"
        : "Action was not acknowledged",
    );
  return result;
}
