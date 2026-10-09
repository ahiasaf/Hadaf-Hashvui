import { pathToFileURL } from "node:url";
import {
  reportOperationalMessage,
  type Report,
} from "../src/server/operational-store.ts";
export async function report(value: Report) {
  const sid = process.env.SID?.trim();
  if (!sid || !process.env.READ_KEY) return false;
  try {
    return await reportOperationalMessage(sid, value);
  } catch {
    console.error("Notification report was not acknowledged");
    return false;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const mode = process.argv[2];
  if (mode !== "why" && mode !== "crash")
    throw new Error("Usage: node tools/push-report.mts why REASON | crash");
  void report({
    why: mode === "crash" ? "ההרצה ב-GitHub נפלה" : process.argv[3] || "",
  }).then((saved) => {
    if (!saved && process.env.SID) process.exitCode = 1;
  });
}
