export function deckCovers(rows: string[][]) {
  const covers: Record<string, { src: string; title: string }> = {};
  for (const row of rows.slice(1)) {
    const track = String(row[0] || "").trim(),
      week = Number(row[1]);
    if (
      !["taanit", "megila"].includes(track) ||
      !Number.isInteger(week) ||
      week < 1
    )
      continue;
    const directory = String(row[2] || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");
    const files = String(row[3] || "")
      .split(",")
      .map((file) => file.trim())
      .filter(Boolean);
    const file = String(row[5] || "").trim() || files[0] || "";
    const path = file.includes("/")
      ? file.replace(/^\//, "")
      : directory + "/" + file;
    const valid =
      /^slides\/[a-z]+-\d+\/[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/i.test(path) &&
      !path.includes("..");
    covers[track + "-" + week] = {
      src: valid ? "/" + path : "",
      title: String(row[4] || "").trim(),
    };
  }
  return covers;
}
