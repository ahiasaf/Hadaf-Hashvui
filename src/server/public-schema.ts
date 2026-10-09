export const publicTabs = new Set([
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
export function validatePublicRows(tab: string, rows: string[][]) {
  const header = rows[0] || [];
  if (
    !header.length ||
    /טלפון|איש קשר|phone|contact|מנוי/i.test(header.join("|"))
  )
    throw new Error("Unexpected private schema");
  if (
    tab === "מוסדות" &&
    (!/^(code|קוד)$/i.test(header[0]) ||
      !/^(name|שם|ישיבה)$/i.test(header[1] || ""))
  )
    throw new Error("Unexpected institutions schema");
  if (
    ["טקסטים", "הגדרות"].includes(tab) &&
    !header.some((value) => /^(מפתח|key)$/i.test(value))
  )
    throw new Error("Unexpected settings schema");
  if (
    tab === "נוסחים" &&
    (!header.includes("קטגוריה") || !header.includes("נוסח"))
  )
    throw new Error("Unexpected templates schema");
  if (["מונים", "מוני-לימוד"].includes(tab) && !header.includes("קוד ישיבה"))
    throw new Error("Unexpected counts schema");
  if (
    [
      "מצגות",
      "דפים פתוחים",
      "סימוני הדף",
      "פירוש",
      "שאלות בדף",
      "מצגת",
    ].includes(tab) &&
    (!header.some((value) => value === "מסכת") ||
      (tab !== "מצגות" && !header.some((value) => value === "דף")))
  )
    throw new Error("Unexpected lesson schema");
  const required: Record<string, string[]> = {
    "דפים פתוחים": ["נפתח"],
    "סימוני הדף": ["עמוד", "נתונים"],
    מצגות: ["שבוע", "קבצים"],
  };
  if ((required[tab] || []).some((value) => !header.includes(value)))
    throw new Error("Unexpected public schema");
}
