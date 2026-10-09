import { sheet } from "./client";
export function hebrewText(value: string) {
  return value
    .replace(/(?<=\S)[\u2013\u2014](?=\S)/g, "-")
    .replace(/[ \t]*[\u2013\u2014][ \t]*/g, ", ");
}
export async function refreshCopy() {
  const elements = [...document.querySelectorAll<HTMLElement>("[data-copy]")];
  if (!elements.length) return;
  try {
    const rows = await sheet("טקסטים");
    const map = new Map(rows.slice(1).map((row) => [row[0], row[1] || ""]));
    for (const element of elements) {
      const value = map.get(element.dataset.copy!);
      if (value === undefined) continue;
      // Published copy is text. Strip markup rather than executing spreadsheet HTML.
      const template = document.createElement("template");
      template.innerHTML = value;
      const text = hebrewText(template.content.textContent || "");
      if (element.textContent === text) continue;
      element.textContent = text;
      element.classList.add("swap");
    }
  } catch {
    /* Prerendered copy remains available if the sheet cannot be read. */
  }
}
