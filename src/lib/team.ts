// The private team board: a key from the link, cards from the call center and acknowledged logs.
import { action } from "./client";

export type TeamContact = { name: string; phone: string };
export type TeamCard = {
  name: string;
  update: string;
  tags: string[];
  people: TeamContact[];
};
export type TeamAction = "שיחה" | "וואטסאפ";

export const teamMembers = ["אחיאסף", "הרב פלתי", "אלחנן"];

export function phoneDigits(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export function whatsappNumber(phone: string) {
  const digits = phoneDigits(phone);
  return digits.startsWith("972") ? digits : "972" + digits.replace(/^0/, "");
}

function parseList(text: string): unknown[] {
  try {
    const value: unknown = JSON.parse(text || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// The first row is the header. Broken JSON in a cell means an empty list, not a broken board.
export function parseTeamRows(rows: unknown): TeamCard[] {
  if (!Array.isArray(rows)) throw new Error("Invalid team rows");
  return rows.slice(1).map((row: unknown) => {
    const cells = Array.isArray(row)
      ? row.map((cell) => (typeof cell === "string" ? cell : ""))
      : [];
    return {
      name: cells[0] || "",
      update: cells[1] || "",
      tags: parseList(cells[2]).filter(
        (tag): tag is string => typeof tag === "string",
      ),
      people: parseList(cells[3]).flatMap((person) => {
        if (!person || typeof person !== "object") return [];
        const { name, phone } = person as { name?: unknown; phone?: unknown };
        return [
          {
            name: typeof name === "string" ? name : "",
            phone: typeof phone === "string" ? phone : "",
          },
        ];
      }),
    };
  });
}

export async function loadTeam(key: string) {
  const result = await action<{ rows?: unknown }>("read", { team: "1", key });
  return parseTeamRows(result.rows);
}

// Append-only log; the promise resolves only after the backend acknowledges the row.
export async function logTeamAction(
  key: string,
  who: string,
  institution: string,
  act: TeamAction,
) {
  await action("write", {
    action: "teamlog",
    key,
    cols: JSON.stringify([
      ["מי", who || "לא ידוע"],
      ["ישיבה", institution],
      ["פעולה", act],
    ]),
  });
}

const memberKey = "df:teamWho";

export function savedMember() {
  try {
    const who = localStorage.getItem(memberKey) || "";
    return teamMembers.includes(who) ? who : "";
  } catch {
    return "";
  }
}

export function saveMember(who: string) {
  try {
    if (who) localStorage.setItem(memberKey, who);
    else localStorage.removeItem(memberKey);
  } catch {
    /* Storage is optional. */
  }
}
