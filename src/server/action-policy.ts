export const publicColumns: Record<string, string[]> = {
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
export function publicRowColumns(
  payload: Record<string, string>,
): [string, string][] {
  if (
    payload.action !== "row" ||
    !publicColumns[payload.tab] ||
    Object.keys(payload).some((key) => !["action", "tab", "cols"].includes(key))
  )
    throw new Error("Authentication required");
  const cols: unknown = JSON.parse(payload.cols);
  if (
    !Array.isArray(cols) ||
    !cols.length ||
    !cols.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === "string" &&
        typeof pair[1] === "string" &&
        publicColumns[payload.tab].includes(pair[0]) &&
        pair[1].length < 12000 &&
        !(
          payload.tab === "התראות" &&
          pair[0] === "תפקיד" &&
          pair[1].trim() === "רכז"
        ),
    )
  )
    throw new Error("Invalid public columns");
  if (new Set(cols.map((pair) => pair[0])).size !== cols.length)
    throw new Error("Duplicate columns");
  return cols;
}
