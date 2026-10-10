import { lazy, Suspense, useEffect, useState, type SubmitEvent } from "react";
import {
  action,
  joinColumns,
  stored,
  store,
  writeRow,
  type Person,
} from "../lib/client";
import Install from "./Install";
import Stepper from "./Stepper";
import { inviteDraft, type InviteCopy } from "../lib/invite";
import {
  emptyAnswers,
  parseDraft,
  phonePattern,
  restoreSteps,
  stepLabels,
  stepValid,
  stepsFor,
  type Answers,
  type StepId,
} from "../lib/signup-flow";
type Institution = { code: string; name: string };
// The invitation panel is only needed by parents arriving from a push.
const InvitePanel = lazy(() => import("./InvitePanel"));
const draftKey = "signup-draft";
const ways = [
  ["solo", "לבד", "בקצב שלי"],
  ["dad", "עם ההורים", "אבא או אמא"],
  ["chav", "עם חבר", "חברותא"],
];
const grades = ["ז", "ח", "ט", "י", "יא", "יב"];
export default function Signup({
  institutions,
  invite,
}: {
  institutions: Institution[];
  invite: InviteCopy;
}) {
  const [ready, setReady] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [existingId, setExistingId] = useState("");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState(1);
  const [restore, setRestore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [inviting, setInviting] = useState(false);
  useEffect(() => {
    const existing = stored<Person | null>("me", null);
    const params = new URLSearchParams(location.search);
    setPerson(existing);
    setInviting(
      location.hash === "#invite" &&
        !!existing &&
        ["dad", "parent"].includes(existing.role),
    );
    const saved = existing ? null : parseDraft(stored(draftKey, null));
    if (saved) {
      setAnswers(saved.answers);
      setStep(saved.step);
      setRestore(saved.restore);
    } else {
      // A son opening the parent's personal link starts with both names filled in.
      const invited = existing ? null : inviteDraft(location.search);
      setAnswers({
        ...emptyAnswers,
        ...(existing || {}),
        ...(invited || {}),
        role: existing?.role || (params.get("for") === "dad" ? "dad" : "kid"),
        inst: existing?.inst || params.get("inst") || "",
        way: existing?.way || (invited ? "dad" : ""),
      });
      if (existing) setStep(1);
    }
    setExistingId(existing?.id || "");
    setReady(true);
  }, []);
  // Every answer and the current step are kept so a reload resumes in place.
  useEffect(() => {
    if (ready && !person) store(draftKey, { step, answers, restore });
  }, [ready, person, step, answers, restore]);
  const steps: StepId[] = restore ? restoreSteps : stepsFor(answers);
  const current = steps[Math.min(step, steps.length) - 1];
  const parent = answers.role === "dad";
  function set(patch: Partial<Answers>) {
    setAnswers((previous) => ({ ...previous, ...patch }));
  }
  function go(target: number) {
    setTouched(false);
    setError("");
    setStep(Math.max(1, Math.min(target, steps.length)));
  }
  // Big choices answer and advance in one tap.
  function pick(patch: Partial<Answers>) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    setTouched(false);
    setError("");
    const list = restore ? restoreSteps : stepsFor(next);
    setStep(Math.min(step + 1, list.length));
  }
  function next(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!stepValid(current, answers)) {
      setTouched(true);
      return;
    }
    go(step + 1);
  }
  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (restore) {
        const result = await action<{
          status: string;
          me?: Person;
          person?: Person;
          id?: string;
          learned?: string[];
        }>("read", {
          whoIs: answers.phone.trim(),
          first: answers.first.trim(),
          last: answers.last.trim(),
          role: answers.role,
        });
        const recovered = result.me || result.person;
        if (!recovered?.id) throw new Error("Not found");
        recovered.phone = answers.phone.replace(/[^0-9]/g, "");
        store("me", recovered);
        const completed = stored<Record<string, string>>("learned", {});
        for (const tag of result.learned || []) {
          if (/^(taanit|megila)\|[1-9]\d?$/.test(tag))
            completed[tag] ||= new Date().toISOString();
        }
        store("learned", completed);
        setPerson(recovered);
      } else {
        const inst = institutions.find((item) => item.code === answers.inst);
        const phone = answers.phone.replace(/[^0-9]/g, "");
        if (!inst || !/^0[2-9]\d{7,8}$/.test(phone))
          throw new Error("Invalid phone");
        const nextPerson: Person = {
          id:
            existingId ||
            Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) =>
              byte.toString(16).padStart(2, "0"),
            ).join(""),
          inst: inst.code,
          instName: inst.name,
          first: answers.first.trim(),
          last: answers.last.trim(),
          phone,
          grade: answers.grade,
          klass: answers.klass.trim(),
          role: answers.role,
          way: answers.way,
          dadFirst: answers.dadFirst.trim(),
          dadLast: answers.dadLast.trim(),
          dadPhone: answers.dadPhone.trim(),
          rel:
            answers.way === "chav"
              ? "friend"
              : answers.role === "dad"
                ? "kid"
                : "dad",
        };
        const acknowledgement = await writeRow(
          "לומדים",
          joinColumns(nextPerson),
        );
        if (typeof acknowledgement.id === "string" && acknowledgement.id)
          nextPerson.id = acknowledgement.id;
        store("me", nextPerson);
        setExistingId(nextPerson.id);
        setPerson(nextPerson);
      }
      store(draftKey, null);
    } catch {
      setError(
        restore
          ? "לא הצלחנו לשחזר את ההרשמה. בדקו את הפרטים ונסו שוב."
          : "ההרשמה לא אושרה. בדקו את מספר הטלפון והחיבור ונסו שוב.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <section className="workspace narrow" aria-busy="true" />;
  if (person && inviting)
    return (
      <section className="workspace narrow swap" key="invite">
        <Suspense
          fallback={
            <p className="notice" role="status">
              טוענים…
            </p>
          }
        >
          <InvitePanel
            me={person}
            copy={invite}
            onSent={(sent) => {
              setPerson(sent);
              history.replaceState(
                null,
                "",
                location.pathname + location.search,
              );
            }}
          />
        </Suspense>
      </section>
    );
  if (person)
    return (
      <section className="workspace narrow celebrate" key="done">
        <span className="done-mark" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow">{person.instName}</p>
        <h1>שלום, {person.first}</h1>
        <p>
          {restore
            ? "ההרשמה שוחזרה. ההתקדמות שלכם חזרה למכשיר הזה."
            : "ההרשמה נשמרה. הדף של השבוע כבר מחכה לכם."}
        </p>
        <a className="button button-gold" href="/app">
          לדף של השבוע
        </a>
        <Install />
        <button
          className="text-button"
          onClick={() => {
            setRestore(false);
            setStep(1);
            setPerson(null);
          }}
        >
          עדכון פרטי ההרשמה
        </button>
      </section>
    );
  const invalid = touched && !stepValid(current, answers);
  const labels = steps.map((id) => stepLabels[id]);
  const back = step > 1 ? () => go(step - 1) : undefined;
  const nextButton = (label = "המשך") => (
    <button className="button button-blue" type="submit">
      {label}
    </button>
  );
  const field = (
    name: keyof Answers,
    label: string,
    extra: Record<string, unknown> = {},
  ) => (
    <label>
      {label}
      <input
        name={name}
        value={answers[name]}
        onChange={(event) => set({ [name]: event.target.value })}
        maxLength={60}
        {...extra}
      />
    </label>
  );
  return (
    <section className="workspace narrow" key={restore ? "restore" : "form"}>
      {current === "role" && (
        <Stepper
          step={step}
          labels={labels}
          title="מי מצטרף?"
          lead="דקה אחת, ואתם בפנים."
        >
          <div className="choice-list" role="group" aria-label="נרשמים בתור">
            {[
              ["kid", "תלמיד", "לומד את הדף בעצמי או עם חברותא"],
              ["dad", "הורה", "לומד עם הבן שלי"],
            ].map(([value, label, hint]) => (
              <button
                type="button"
                key={value}
                className="choice-big"
                aria-pressed={answers.role === value}
                onClick={() => pick({ role: value })}
              >
                <strong>{label}</strong>
                <small>{hint}</small>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setRestore(true);
              go(1);
            }}
          >
            כבר נרשמתם? שחזור ההרשמה
          </button>
          <a className="secondary-link" href="/">
            חזרה לדף הבית
          </a>
        </Stepper>
      )}
      {current === "name" && (
        <Stepper
          step={step}
          labels={labels}
          title={
            restore
              ? "שחזור ההרשמה"
              : parent
                ? "איך קוראים לכם?"
                : "איך קוראים לך?"
          }
          lead={
            restore
              ? "אותם פרטים שנרשמתם איתם, והדף שלכם חוזר."
              : "השם שיופיע בלוח של הישיבה."
          }
          onBack={restore ? () => setRestore(false) : back}
        >
          <form className="flow-form" onSubmit={next}>
            {field("first", "שם פרטי", {
              autoComplete: "given-name",
              autoFocus: true,
            })}
            {field("last", "שם משפחה", { autoComplete: "family-name" })}
            <p className="field-note" hidden={!invalid} role="alert">
              צריך שם פרטי ושם משפחה.
            </p>
            {nextButton()}
          </form>
        </Stepper>
      )}
      {current === "phone" && (
        <Stepper
          step={step}
          labels={labels}
          title="מה הטלפון?"
          lead={
            restore
              ? "המספר שנרשמתם איתו."
              : "בשביל הקישור האישי והתזכורות. לא נשלח ספאם."
          }
          onBack={back}
        >
          <form className="flow-form" onSubmit={next}>
            {field("phone", "טלפון", {
              type: "tel",
              dir: "ltr",
              inputMode: "tel",
              autoComplete: "tel-national",
              placeholder: "05XXXXXXXX",
              autoFocus: true,
              "aria-invalid": invalid || undefined,
              "aria-describedby": "phone-note",
            })}
            <p className="field-note" id="phone-note" hidden={!invalid}>
              המספר צריך להתחיל ב-0 ולהכיל 9 או 10 ספרות.
            </p>
            {nextButton()}
          </form>
        </Stepper>
      )}
      {current === "inst" && (
        <Stepper step={step} labels={labels} title="באיזו ישיבה?" onBack={back}>
          <div className="choice-list" role="group" aria-label="ישיבה">
            {institutions.map((item) => (
              <button
                type="button"
                key={item.code}
                className="choice-big is-slim"
                aria-pressed={answers.inst === item.code}
                onClick={() => pick({ inst: item.code })}
              >
                {item.name}
              </button>
            ))}
          </div>
        </Stepper>
      )}
      {current === "grade" && (
        <Stepper
          step={step}
          labels={labels}
          title={parent ? "באיזו שכבה הבן?" : "באיזו שכבה?"}
          onBack={back}
        >
          <form className="flow-form" onSubmit={next}>
            <div className="chip-grid" role="group" aria-label="שכבה">
              {grades.map((grade) => (
                <button
                  type="button"
                  key={grade}
                  className="chip-big"
                  aria-pressed={answers.grade === grade}
                  onClick={() => set({ grade })}
                >
                  {grade}
                </button>
              ))}
            </div>
            {field("klass", "כיתה (לא חובה)", {
              maxLength: 15,
              autoComplete: "off",
            })}
            <p className="field-note" hidden={!invalid} role="alert">
              בוחרים שכבה כדי להמשיך.
            </p>
            {nextButton()}
          </form>
        </Stepper>
      )}
      {current === "way" && (
        <Stepper
          step={step}
          labels={labels}
          title="איך לומדים?"
          lead="אפשר לשנות בכל שלב."
          onBack={back}
        >
          <div className="choice-list" role="group" aria-label="דרך לימוד">
            {ways.map(([value, label, hint]) => (
              <button
                type="button"
                key={value}
                className="choice-big"
                aria-pressed={answers.way === value}
                onClick={() => pick({ way: value })}
              >
                <strong>
                  {value === "dad" && parent ? "עם הילדים" : label}
                </strong>
                <small>{hint}</small>
              </button>
            ))}
          </div>
        </Stepper>
      )}
      {current === "partner" && (
        <Stepper
          step={step}
          labels={labels}
          title={
            answers.way === "chav"
              ? "מי החבר?"
              : parent
                ? "מי הבן?"
                : "מי ההורה?"
          }
          lead="לא חובה. אפשר להשלים אחר כך ולשלוח לו הזמנה."
          onBack={back}
        >
          <form className="flow-form" onSubmit={next}>
            {field("dadFirst", "שם פרטי", { autoFocus: true })}
            {field("dadLast", "שם משפחה")}
            {field("dadPhone", "טלפון", {
              type: "tel",
              dir: "ltr",
              inputMode: "tel",
              autoComplete: "off",
            })}
            {nextButton()}
            <button
              type="button"
              className="text-button"
              onClick={() => go(step + 1)}
            >
              דילוג בינתיים
            </button>
          </form>
        </Stepper>
      )}
      {current === "confirm" && (
        <Stepper
          step={step}
          labels={labels}
          title={restore ? "הכול מוכן?" : "רגע לפני הסיום"}
          lead={restore ? undefined : "בודקים שהכול נכון, ושומרים."}
          onBack={back}
        >
          <form
            className="flow-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <dl className="summary">
              {restore ? null : (
                <div>
                  <dt>נרשמים בתור</dt>
                  <dd>{parent ? "הורה" : "תלמיד"}</dd>
                </div>
              )}
              <div>
                <dt>שם</dt>
                <dd>
                  {answers.first.trim()} {answers.last.trim()}
                </dd>
              </div>
              <div>
                <dt>טלפון</dt>
                <dd dir="ltr">{answers.phone.trim()}</dd>
              </div>
              {!restore && (
                <>
                  <div>
                    <dt>ישיבה</dt>
                    <dd>
                      {institutions.find((item) => item.code === answers.inst)
                        ?.name || ""}
                    </dd>
                  </div>
                  <div>
                    <dt>שכבה</dt>
                    <dd>
                      {answers.grade}
                      {answers.klass.trim() ? " · " + answers.klass.trim() : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>לומדים</dt>
                    <dd>
                      {answers.way === "dad" && parent
                        ? "עם הילדים"
                        : ways.find(([value]) => value === answers.way)?.[1]}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            {error && (
              <p role="alert" className="notice error">
                {error}
              </p>
            )}
            <button
              className={"button button-gold" + (busy ? " is-busy" : "")}
              disabled={busy}
            >
              {busy
                ? "בודקים ושומרים…"
                : restore
                  ? "שחזור ההרשמה"
                  : "שמירת ההרשמה"}
            </button>
            {!restore && (
              <p className="form-hint">
                הפרטים נשמרים במערכת הפרטית של התוכנית.{" "}
                <a href="/info#privacy">מידע על פרטיות</a>
              </p>
            )}
            {!phonePattern.test(answers.phone) && (
              <p className="field-note" role="alert">
                הטלפון לא תקין. חזרו לשלב הטלפון.
              </p>
            )}
          </form>
        </Stepper>
      )}
    </section>
  );
}
