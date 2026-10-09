// Pure helpers for copy layering, WhatsApp share links and Drive preview URLs.
export type CopyMap = Record<string, string>;
export type RetiredCopy = Record<string, string[]>;

export function fillTemplate(text: string, values: CopyMap) {
  return text.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] ?? "");
}

export function whatsappHref(text: string) {
  return "https://wa.me/?text=" + encodeURIComponent(text);
}

// Narrow a classic-script object to the string keys a screen needs. Missing values become "".
export function pickStrings<K extends string>(
  source: unknown,
  keys: readonly K[],
): Record<K, string> {
  const record =
    source && typeof source === "object"
      ? (source as Record<string, unknown>)
      : {};
  const picked = {} as Record<K, string>;
  for (const key of keys) {
    const value = record[key];
    picked[key] = typeof value === "string" ? value : "";
  }
  return picked;
}

export function pickRetired(source: unknown): RetiredCopy {
  const retired: RetiredCopy = {};
  if (!source || typeof source !== "object") return retired;
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value))
      retired[key] = value.filter(
        (item): item is string => typeof item === "string",
      );
  }
  return retired;
}

// Rows of the published copy sheet. A table without the key header is not copy.
export function copyOverrides(rows: string[][]): CopyMap {
  const map: CopyMap = {};
  if (!rows.length || !rows[0].join("|").includes("מפתח")) return map;
  for (const row of rows.slice(1)) {
    const key = (row[0] || "").trim();
    const value = (row[1] || "").trim();
    if (key && value) map[key] = value;
  }
  return map;
}

export function draftTexts(config: unknown): CopyMap {
  const texts =
    config && typeof config === "object"
      ? (config as { texts?: unknown }).texts
      : null;
  const map: CopyMap = {};
  if (!texts || typeof texts !== "object") return map;
  for (const [key, value] of Object.entries(texts)) {
    if (typeof value === "string") map[key] = value;
  }
  return map;
}

function usable(value: string | undefined, key: string, retired: RetiredCopy) {
  return (
    typeof value === "string" && value !== "" && !retired[key]?.includes(value)
  );
}

// Code copy, then the published sheet, then the local draft. Always from the base, never cumulative.
export function layerCopy<T extends CopyMap>(
  base: T,
  prefix: string,
  published: CopyMap,
  draft: CopyMap,
  retired: RetiredCopy = {},
): T {
  const layered = { ...base };
  for (const key of Object.keys(base) as (keyof T & string)[]) {
    const full = prefix + "." + key;
    for (const layer of [published, draft]) {
      const value = layer[full];
      if (usable(value, full, retired)) layered[key] = value as T[typeof key];
    }
  }
  return layered;
}

// The layer under the draft decides whether an edit is a change.
export function publishedValue<T extends CopyMap>(
  base: T,
  prefix: string,
  key: keyof T & string,
  published: CopyMap,
  retired: RetiredCopy = {},
) {
  const full = prefix + "." + key;
  return usable(published[full], full, retired) ? published[full] : base[key];
}

export const kishurimKeys = [
  "h1",
  "lead",
  "headH",
  "headSub",
  "headBtn",
  "headWa",
  "rmH",
  "rmSub",
  "rmBtn",
  "rmWa",
  "kidsH",
  "kidsSub",
  "kidsBtn",
  "kidsInst",
  "parH",
  "parSub",
  "parBtn",
  "copy",
  "copied",
] as const;
export type KishurimCopy = Record<(typeof kishurimKeys)[number], string>;
export type InviteCopy = { linkWa: string; dadWa: string };

export type ShareLink = {
  key: "head" | "rm" | "kids" | "par";
  title: string;
  description: string;
  button: string;
  url: string;
  message: string;
};

// One page sent to a school head, who forwards each link to its audience.
export function siteLinks(
  copy: KishurimCopy,
  invites: InviteCopy,
  origin: string,
): ShareLink[] {
  const base = origin.replace(/\/$/, "") + "/";
  const head = base + "?masa=1";
  const rm = base + "tzevet";
  const kids = base + "join";
  const par = base + "join?for=dad";
  return [
    {
      key: "head",
      title: copy.headH,
      description: copy.headSub,
      button: copy.headBtn,
      url: head,
      message: fillTemplate(copy.headWa, { קישור: head }),
    },
    {
      key: "rm",
      title: copy.rmH,
      description: copy.rmSub,
      button: copy.rmBtn,
      url: rm,
      message: fillTemplate(copy.rmWa, { קישור: rm }),
    },
    {
      key: "kids",
      title: copy.kidsH,
      description: copy.kidsSub,
      button: copy.kidsBtn,
      url: kids,
      message: fillTemplate(invites.linkWa, { inst: copy.kidsInst, url: kids }),
    },
    {
      key: "par",
      title: copy.parH,
      description: copy.parSub,
      button: copy.parBtn,
      url: par,
      message: fillTemplate(invites.dadWa, { url: par }),
    },
  ];
}

// Accepts a Drive share URL, a ?id= URL or a bare file ID.
export function driveFileId(raw: string) {
  const text = raw.trim();
  const match =
    /\/d\/([A-Za-z0-9_-]{20,})/.exec(text) ||
    /[?&]id=([A-Za-z0-9_-]{20,})/.exec(text);
  return match ? match[1] : text;
}

export type DriveImageForm = { name: string; note: string; url: string };

export function driveImageForms(id: string): DriveImageForm[] {
  const file = encodeURIComponent(id);
  return [
    {
      name: "תצוגה מקדימה (thumbnail)",
      note: "כל סוג קובץ",
      url: "https://drive.google.com/thumbnail?id=" + file + "&sz=w1600",
    },
    {
      name: "הקובץ עצמו (uc)",
      note: "תמונות בלבד",
      url: "https://drive.google.com/uc?export=view&id=" + file,
    },
    {
      name: "שרת התמונות (lh3)",
      note: "תמונות בלבד",
      url: "https://lh3.googleusercontent.com/d/" + file + "=w1600",
    },
  ];
}
