// Read-only Google Sheets capture shared by the encrypted export and the production cutover.
type Json = Record<string, unknown>;
type Sheet = { name: string; rows: string[][]; metadata: Json };
function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid service response");
  return value as Json;
}
export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error("Missing " + name);
  return value;
}
async function json(url: string, init?: RequestInit): Promise<Json> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok)
    throw new Error(
      "Service request failed: " +
        new URL(url).hostname +
        " HTTP " +
        response.status,
    );
  return object(await response.json());
}
export async function googleToken(): Promise<string> {
  const raw = object(JSON.parse(required("CLASPRC_JSON")));
  const settings = raw.oauth2ClientSettings
    ? object(raw.oauth2ClientSettings)
    : {};
  const tokens = raw.tokens ? object(raw.tokens) : {};
  const token = object(raw.token || tokens.default || raw.tokens || raw);
  if (!token.refresh_token)
    throw new Error("Google refresh credential missing");
  const response = await json("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: String(token.refresh_token),
      client_id: String(token.client_id || settings.clientId || ""),
      client_secret: String(token.client_secret || settings.clientSecret || ""),
    }),
  });
  if (typeof response.access_token !== "string")
    throw new Error("Google refresh failed");
  return response.access_token;
}
function rows(value: unknown): string[][] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (row) =>
        Array.isArray(row) && row.every((cell) => typeof cell === "string"),
    )
  )
    throw new Error("Invalid source rows");
  return value;
}
export async function capture(
  api: string,
  token: string,
  metadata: Json,
): Promise<Sheet[]> {
  const tables: Sheet[] = [];
  const headers = { Authorization: "Bearer " + token };
  const privateId = String(metadata.privId || "");
  if (!privateId || !metadata.privateOn)
    throw new Error("Private source is unavailable");
  const books = [
    ["public", String(metadata.sheetId || "")],
    ["private", privateId],
  ];
  for (const [kind, id] of books) {
    const book = await json(
      "https://sheets.googleapis.com/v4/spreadsheets/" +
        encodeURIComponent(id) +
        "?fields=sheets.properties(title,sheetId,gridProperties),properties.timeZone",
      { headers },
    );
    if (!Array.isArray(book.sheets)) throw new Error("Missing source tabs");
    const sheets = book.sheets.map((sheet) => object(object(sheet).properties));
    // Batch formatted cells preserves leading zeros and exact visible source values.
    for (let start = 0; start < sheets.length; start += 15) {
      const batch = sheets.slice(start, start + 15);
      const url = new URL(
        "https://sheets.googleapis.com/v4/spreadsheets/" +
          encodeURIComponent(id) +
          "/values:batchGet",
      );
      url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
      for (const sheet of batch)
        url.searchParams.append(
          "ranges",
          "'" + String(sheet.title).replaceAll("'", "''") + "'",
        );
      const values = await json(url.href, { headers });
      if (
        !Array.isArray(values.valueRanges) ||
        values.valueRanges.length !== batch.length
      )
        throw new Error("Source range count mismatch");
      for (const [index, range] of values.valueRanges.entries()) {
        const name = String(batch[index].title);
        tables.push({
          name,
          rows: rows(object(range).values || []),
          metadata: {
            source: kind,
            sheetId: batch[index].sheetId,
            timeZone: object(book.properties).timeZone,
          },
        });
      }
    }
  }
  // The call center may reside in a third private workbook. Its router owns these tabs.
  for (const name of [
    "אנשי קשר",
    "יומן שיחות",
    "תצוגת צוות",
    "הגדרות תגיות",
    "פעולות צוות",
  ]) {
    const url = new URL(api);
    url.searchParams.set("read", name);
    url.searchParams.set("key", required("READ_KEY"));
    const result = await json(url.href);
    if (result.status !== "ok")
      throw new Error("Call-center export was denied");
    for (const table of tables.filter((table) => table.name === name))
      table.name = String(table.metadata.source) + ":" + name;
    tables.push({
      name,
      rows: rows(result.rows),
      metadata: { source: "contacts-router" },
    });
  }
  // Canonical private tables supersede legacy copies, which remain intact in the export.
  const privateNames = new Set(
    tables
      .filter((table) => table.metadata.source === "private")
      .map((table) => table.name),
  );
  for (const table of tables)
    if (table.metadata.source === "public" && privateNames.has(table.name))
      table.name = "public:" + table.name;
  return tables.sort((a, b) => a.name.localeCompare(b.name));
}
export type SourceSnapshot = {
  version: 1;
  capturedAt: string;
  tables: Sheet[];
};
// Two identical consecutive captures prove that no write landed while the snapshot was taken.
export async function stableSnapshot(api: string): Promise<SourceSnapshot> {
  const url = new URL(api);
  url.searchParams.set("key", required("READ_KEY"));
  const metadata = await json(url.href);
  if (metadata.status !== "ok") throw new Error("Source metadata unavailable");
  const token = await googleToken();
  let tables = await capture(api, token, metadata);
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await capture(api, token, metadata);
    if (JSON.stringify(next) === JSON.stringify(tables))
      return { version: 1, capturedAt: new Date().toISOString(), tables };
    tables = next;
  }
  throw new Error("Source changed during export; retry in a quiet window");
}
