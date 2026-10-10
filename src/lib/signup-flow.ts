// Signup wizard: which steps apply, and the draft that lets a reload resume.
export type Answers = {
  role: string;
  first: string;
  last: string;
  phone: string;
  inst: string;
  grade: string;
  klass: string;
  way: string;
  dadFirst: string;
  dadLast: string;
  dadPhone: string;
};
export type StepId =
  "role" | "name" | "phone" | "inst" | "grade" | "way" | "partner" | "confirm";
export const emptyAnswers: Answers = {
  role: "kid",
  first: "",
  last: "",
  phone: "",
  inst: "",
  grade: "",
  klass: "",
  way: "",
  dadFirst: "",
  dadLast: "",
  dadPhone: "",
};
export const phonePattern = /^0[2-9][0-9 -]{7,12}$/;

export function stepsFor(answers: Pick<Answers, "way">): StepId[] {
  const steps: StepId[] = [
    "role",
    "name",
    "phone",
    "inst",
    "grade",
    "way",
    "confirm",
  ];
  if (answers.way && answers.way !== "solo") steps.splice(6, 0, "partner");
  return steps;
}

export const stepLabels: Record<StepId, string> = {
  role: "מי",
  name: "שם",
  phone: "טלפון",
  inst: "ישיבה",
  grade: "שכבה",
  way: "איך",
  partner: "שותף",
  confirm: "סיום",
};

export const restoreSteps: StepId[] = ["name", "phone", "confirm"];

// A step is complete when its answers are present and valid.
export function stepValid(step: StepId, answers: Answers) {
  switch (step) {
    case "role":
      return answers.role === "kid" || answers.role === "dad";
    case "name":
      return !!answers.first.trim() && !!answers.last.trim();
    case "phone":
      return phonePattern.test(answers.phone.trim());
    case "inst":
      return !!answers.inst;
    case "grade":
      return !!answers.grade;
    case "way":
      return !!answers.way;
    default:
      return true;
  }
}

export type SignupDraft = { step: number; answers: Answers; restore: boolean };

export function parseDraft(raw: unknown): SignupDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<SignupDraft>;
  if (!item.answers || typeof item.answers !== "object") return null;
  const answers = { ...emptyAnswers };
  for (const key of Object.keys(emptyAnswers) as (keyof Answers)[]) {
    const value = (item.answers as Record<string, unknown>)[key];
    if (typeof value === "string") answers[key] = value;
  }
  const restore = item.restore === true;
  const steps = restore ? restoreSteps : stepsFor(answers);
  const step = Math.min(Math.max(1, Number(item.step) || 1), steps.length);
  return { step, answers, restore };
}
