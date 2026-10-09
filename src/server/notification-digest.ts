import type { Recipient } from "./notification-recipients.ts";
import type { notificationProgram } from "./notification-program.ts";
import { fillTemplate } from "./notification-program.ts";
export type When = { d: string; t: string };
export type Student = {
  id: string;
  grade?: string;
  klass?: string;
  weeks?: string[];
};
export function parseWhen(raw: string): When[] {
  const old: Record<string, When[]> = {
    fri: [{ d: "5", t: "09:00" }],
    day: [{ d: "012345", t: "07:00" }],
    sat: [{ d: "6", t: "21:00" }],
    off: [],
  };
  if (old[raw]) return old[raw].map((slot) => ({ ...slot }));
  return raw.split(";").flatMap((part) => {
    const match = /^([0-6]{1,7})@([0-2]?\d:[0-5]\d)$/.exec(part.trim());
    if (!match || Number(match[2].split(":")[0]) > 23) return [];
    return [{ d: match[1], t: match[2].padStart(5, "0") }];
  });
}
export function digestMessage(
  program: ReturnType<typeof notificationProgram>,
  recipient: Recipient,
  students: Student[],
  week: number,
  mode: "learn" | "joined",
  next: boolean,
) {
  const mine = students.filter(
    (student) =>
      (!recipient.grade || student.grade === recipient.grade) &&
      (!recipient.klass || student.klass === recipient.klass),
  );
  const cls =
      recipient.grade + (recipient.klass ? "\u200e" + recipient.klass : ""),
    copy = program.digest;
  if (mode === "joined") {
    if (!mine.length) return null;
    const values = { cls, n: mine.length };
    return {
      title: fillTemplate(copy.joinedT, values),
      body:
        fillTemplate(copy.joined, values) +
        (parseWhen(recipient.schedule).length ? "" : " " + copy.joinedAsk),
    };
  }
  if (!mine.length)
    return {
      title: fillTemplate(copy.title, { cls }),
      body: fillTemplate(copy.empty, { cls }),
    };
  const keys = program.tracks
    .filter((track) => track.cal[week]?.[2] && track.cal[week][2] !== "סיום")
    .map((track) => track.id + "|" + (week + 1));
  const done = mine.filter((student) =>
    student.weeks?.some((key) => keys.includes(key)),
  ).length;
  const row = program.tracks
    .map((track) => track.cal[week])
    .find((row) => row?.[2] && row[2] !== "סיום");
  const daf =
    (row?.[2] || "") + (row?.[3] === "א" ? "." : row?.[3] === "ב" ? ":" : "");
  const values = { cls, n: mine.length, done, daf, parasha: row?.[1] || "" };
  return {
    title: fillTemplate(copy.title, values),
    body: fillTemplate(
      next
        ? copy.fresh
        : done === 0
          ? copy.none
          : done >= mine.length
            ? copy.all
            : copy.some,
      values,
    ),
  };
}
export function parseStudents(value: unknown): Student[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (student) =>
        student &&
        typeof student === "object" &&
        typeof student.id === "string" &&
        (student.weeks === undefined ||
          (Array.isArray(student.weeks) &&
            student.weeks.every((week: unknown) => typeof week === "string"))),
    )
  )
    throw new Error("Roster response invalid");
  return value;
}
