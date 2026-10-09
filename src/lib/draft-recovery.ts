// Read-only view of explanation drafts the lesson editor keeps under df:ownDraft.
export type Piece = { tag: string; text: string; audio: string };
export type Draft = {
  key: string;
  track: string;
  daf: string;
  segment: string;
  at: number;
  pieces: Piece[];
};

function toPiece(raw: unknown): Piece {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    tag: typeof item.tag === "string" ? item.tag : "",
    text: typeof item.text === "string" ? item.text : "",
    audio: typeof item.audio === "string" ? item.audio : "",
  };
}

// Same track and daf: segments compare as numbers. Otherwise keys compare as text.
function compare(a: Draft, b: Draft) {
  if (a.track === b.track && a.daf === b.daf) {
    const diff = Number(a.segment) - Number(b.segment);
    if (!Number.isNaN(diff)) return diff;
  }
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

export function loadDrafts(): Draft[] {
  let all: Record<string, unknown>;
  try {
    all = JSON.parse(localStorage.getItem("df:ownDraft") || "{}") || {};
  } catch {
    throw new Error("Draft storage is unreadable");
  }
  if (typeof all !== "object" || Array.isArray(all))
    throw new Error("Invalid draft storage");
  return Object.entries(all)
    .map(([key, raw]) => {
      const [track = "", daf = "", segment = ""] = key.split("|");
      const item = (raw && typeof raw === "object" ? raw : {}) as Record<
        string,
        unknown
      >;
      return {
        key,
        track,
        daf,
        segment,
        at: typeof item.at === "number" ? item.at : 0,
        pieces: Array.isArray(item.pieces) ? item.pieces.map(toPiece) : [],
      };
    })
    .sort(compare);
}

// Editor pieces hold HTML; only their text survives here.
export function plainText(html: string) {
  const source = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n");
  const body = new DOMParser().parseFromString(
    "<body>" + source + "</body>",
    "text/html",
  ).body;
  return (body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

export function draftText(draft: Draft) {
  return draft.pieces
    .map((piece) => {
      const head =
        draft.pieces.length > 1 && piece.tag ? `[${piece.tag}]\n` : "";
      const text = plainText(piece.text);
      if (text) return head + text;
      if (piece.audio) return head + "(הקלטה קולית בלבד: " + piece.audio + ")";
      return head.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* Fall back to a selection copy below. */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let done: boolean;
  try {
    done = document.execCommand("copy");
  } catch {
    done = false;
  }
  area.remove();
  return done;
}
