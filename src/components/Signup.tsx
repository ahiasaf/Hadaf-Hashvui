import { useEffect, useState, type SubmitEvent } from "react";
import {
  action,
  joinColumns,
  stored,
  store,
  writeRow,
  type Person,
} from "../lib/client";
import Reminders from "./Reminders";
import InvitePanel from "./InvitePanel";
import { inviteDraft, type InviteCopy } from "../lib/invite";
type Institution = { code: string; name: string };
const ways = [
  ["solo", "לבד, בקצב שלי"],
  ["dad", "עם אבא או אמא"],
  ["chav", "עם חבר"],
];
export default function Signup({
  institutions,
  invite,
}: {
  institutions: Institution[];
  invite: InviteCopy;
}) {
  const [person, setPerson] = useState<Person | null>(null);
  const [draft, setDraft] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restore, setRestore] = useState(false);
  const [initialInst, setInitialInst] = useState("");
  const [role, setRole] = useState("kid");
  const [inviting, setInviting] = useState(false);
  useEffect(() => {
    const existing = stored<Person | null>("me", null);
    // A son opening the parent's personal link starts with both names filled in.
    const invited = existing ? null : inviteDraft(location.search);
    setPerson(existing);
    setDraft(
      existing || (invited ? ({ ...invited, way: "dad" } as Person) : null),
    );
    const params = new URLSearchParams(location.search);
    setInitialInst(params.get("inst") || "");
    setRole(existing?.role || (params.get("for") === "dad" ? "dad" : "kid"));
    setInviting(
      location.hash === "#invite" &&
        !!existing &&
        ["dad", "parent"].includes(existing.role),
    );
  }, []);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "").trim();
    try {
      if (restore) {
        const result = await action<{
          status: string;
          me?: Person;
          person?: Person;
          id?: string;
          learned?: string[];
        }>("read", {
          whoIs: value("phone"),
          first: value("first"),
          last: value("last"),
          role: value("role"),
        });
        const recovered = result.me || result.person;
        if (!recovered?.id) throw new Error("Not found");
        recovered.phone = value("phone").replace(/[^0-9]/g, "");
        store("me", recovered);
        const completed = stored<Record<string, string>>("learned", {});
        for (const tag of result.learned || []) {
          if (/^(taanit|megila)\|[1-9]\d?$/.test(tag))
            completed[tag] ||= new Date().toISOString();
        }
        store("learned", completed);
        setPerson(recovered);
      } else {
        const inst = institutions.find((item) => item.code === value("inst"));
        const phone = value("phone").replace(/[^0-9]/g, "");
        if (!inst || !/^0[2-9]\d{7,8}$/.test(phone))
          throw new Error("Invalid phone");
        const next: Person = {
          id:
            draft?.id ||
            Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) =>
              byte.toString(16).padStart(2, "0"),
            ).join(""),
          inst: inst.code,
          instName: inst.name,
          first: value("first"),
          last: value("last"),
          phone,
          grade: value("grade"),
          klass: value("klass"),
          role: value("role"),
          way: value("way"),
          dadFirst: value("dadFirst"),
          dadLast: value("dadLast"),
          dadPhone: value("dadPhone"),
          rel:
            value("way") === "chav"
              ? "friend"
              : value("role") === "dad"
                ? "kid"
                : "dad",
        };
        const acknowledgement = await writeRow("לומדים", joinColumns(next));
        if (typeof acknowledgement.id === "string" && acknowledgement.id)
          next.id = acknowledgement.id;
        store("me", next);
        setPerson(next);
        setDraft(next);
      }
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
  if (person && inviting)
    return (
      <section className="workspace narrow swap" key="invite">
        <p className="eyebrow">{person.instName}</p>
        <InvitePanel
          me={person}
          copy={invite}
          onSent={(next) => {
            setPerson(next);
            setDraft(next);
            history.replaceState(null, "", location.pathname + location.search);
          }}
        />
      </section>
    );
  if (person)
    return (
      <section className="workspace narrow swap" key="done">
        <p className="eyebrow">{person.instName}</p>
        <h1>שלום, {person.first}</h1>
        <p>ההרשמה נשמרה. הדף של השבוע כבר מחכה לכם.</p>
        <a className="button button-blue" href="/app">
          ללימוד שלי
        </a>
        <button
          className="text-button"
          onClick={() => {
            setPerson(null);
          }}
        >
          עדכון פרטי ההרשמה
        </button>
        <Reminders />
      </section>
    );
  return (
    <section
      className="workspace narrow swap"
      key={restore ? "restore" : "form"}
    >
      <h1>
        {restore
          ? "שחזור ההרשמה"
          : role === "dad"
            ? "מצטרפים ללימוד עם הילדים"
            : "מצטרפים ללימוד"}
      </h1>
      {!restore && (
        <button className="text-button" onClick={() => setRestore(true)}>
          כבר נרשמתם? שחזור ההרשמה
        </button>
      )}
      <form onSubmit={submit} className="flow-form">
        <fieldset>
          <legend>נרשמים בתור</legend>
          {[
            ["kid", "תלמיד"],
            ["dad", "הורה"],
          ].map(([value, label]) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                name="role"
                value={value}
                checked={value === role}
                onChange={() => setRole(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="form-grid">
          <label>
            שם פרטי
            <input
              name="first"
              defaultValue={draft?.first}
              autoComplete="given-name"
              required
              maxLength={60}
            />
          </label>
          <label>
            שם משפחה
            <input
              name="last"
              defaultValue={draft?.last}
              autoComplete="family-name"
              required
              maxLength={60}
            />
          </label>
        </div>
        <label>
          טלפון
          <input
            name="phone"
            defaultValue={draft?.phone}
            type="tel"
            dir="ltr"
            autoComplete="tel-national"
            inputMode="tel"
            required
            pattern="0[2-9][0-9 \-]{7,12}"
            placeholder="05XXXXXXXX"
          />
        </label>
        {!restore && (
          <>
            <label>
              ישיבה
              <select
                name="inst"
                aria-label="ישיבה"
                defaultValue={draft?.inst || initialInst}
                required
              >
                <option value="">בחירת ישיבה</option>
                {institutions.map((inst) => (
                  <option value={inst.code} key={inst.code}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                שכבה
                <select
                  aria-label="שכבה"
                  name="grade"
                  defaultValue={draft?.grade || ""}
                  required
                >
                  <option value="">בחירת שכבה</option>
                  {["ז", "ח", "ט", "י", "יא", "יב"].map((grade) => (
                    <option key={grade}>{grade}</option>
                  ))}
                </select>
              </label>
              <label>
                כיתה
                <input
                  name="klass"
                  defaultValue={draft?.klass}
                  maxLength={15}
                />
              </label>
            </div>
            <label>
              דרך לימוד
              <select
                aria-label="דרך לימוד"
                name="way"
                key={role}
                defaultValue={draft?.way || (role === "dad" ? "dad" : "solo")}
              >
                {ways.map((way) => (
                  <option value={way[0]} key={way[0]}>
                    {way[0] === "dad" && role === "dad" ? "עם הילדים" : way[1]}
                  </option>
                ))}
              </select>
            </label>
            <details>
              <summary>פרטי השותף ללימוד (אפשר למלא בהמשך)</summary>
              <div className="form-grid">
                <label>
                  שם פרטי
                  <input
                    name="dadFirst"
                    defaultValue={draft?.dadFirst}
                    maxLength={60}
                  />
                </label>
                <label>
                  שם משפחה
                  <input
                    name="dadLast"
                    defaultValue={draft?.dadLast}
                    maxLength={60}
                  />
                </label>
              </div>
              <label>
                טלפון השותף
                <input
                  type="tel"
                  name="dadPhone"
                  defaultValue={draft?.dadPhone}
                  dir="ltr"
                />
              </label>
            </details>
            <p className="form-hint">
              הפרטים נשמרים במערכת הפרטית של התוכנית.{" "}
              <a href="/info#privacy">מידע על פרטיות</a>
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <button className="button button-blue" disabled={busy}>
          {busy ? "בודקים ושומרים…" : restore ? "שחזור ההרשמה" : "שמירת ההרשמה"}
        </button>
        {restore ? (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setRestore(false);
              setError("");
            }}
          >
            חזרה להרשמה
          </button>
        ) : (
          <a className="secondary-link" href="/">
            חזרה לדף הבית
          </a>
        )}
      </form>
    </section>
  );
}
