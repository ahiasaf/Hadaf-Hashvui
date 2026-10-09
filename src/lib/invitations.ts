// Teacher invitations: the grade decides the wording, the institution decides the link.
import { fillTemplate } from "./share-links";

export const sendKeys = [
  "h1",
  "inst",
  "grades",
  "young",
  "g1",
  "g1b",
  "g2",
  "sons",
  "sonsAny",
  "sonsB",
  "par",
  "parB",
  "pick",
  "open",
  "okShare",
  "okWa",
  "save",
  "peek",
  "peekOff",
  "mPar",
  "mSonsA",
  "mSonsB",
] as const;
export type SendCopy = Record<(typeof sendKeys)[number], string>;
export type Audience = "sons" | "par";
export type Institution = { code: string; name: string };

const words = (text: string) => text.split(/\s+/).filter(Boolean);

export function gradeList(copy: Pick<SendCopy, "grades">) {
  return words(copy.grades);
}

export function isYoung(copy: Pick<SendCopy, "young">, grade: string) {
  return words(copy.young).includes(grade);
}

// Only a code made of safe characters reaches a URL. The historic default school is lapid.
export function institutionCode(search: string) {
  const raw = new URLSearchParams(search).get("inst") || "lapid";
  return raw.replace(/[^a-z0-9_-]/gi, "") || "lapid";
}

export function institutionName(institutions: Institution[], code: string) {
  return institutions.find((item) => item.code === code)?.name || "";
}

export function joinUrl(origin: string, code: string) {
  return origin + "/join?inst=" + encodeURIComponent(code);
}

export function parentJoinUrl(origin: string) {
  return origin + "/join?for=dad";
}

export function invitationMessage(
  copy: Pick<SendCopy, "young" | "mPar" | "mSonsA" | "mSonsB">,
  audience: Audience,
  grade: string,
  origin: string,
  code: string,
) {
  const template =
    audience === "par"
      ? copy.mPar
      : isYoung(copy, grade)
        ? copy.mSonsA
        : copy.mSonsB;
  return fillTemplate(template, {
    קישור: audience === "par" ? parentJoinUrl(origin) : joinUrl(origin, code),
    שכבה: grade,
  });
}

// The legacy page stored the grade as a raw string, so the key is read directly.
const gradeKey = "df:shlachG";

export function savedGrade(grades: string[]) {
  try {
    const grade = localStorage.getItem(gradeKey) || "";
    return grades.includes(grade) ? grade : "";
  } catch {
    return "";
  }
}

export function saveGrade(grade: string) {
  try {
    localStorage.setItem(gradeKey, grade);
  } catch {
    /* Storage is optional. */
  }
}
