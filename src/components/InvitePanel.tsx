import { useRef, useState, type SubmitEvent } from "react";
import { joinColumns, store, writeRow, type Person } from "../lib/client";
import {
  inviteMessage,
  inviteUrl,
  phoneReady,
  whatsappInvite,
  withInviteUrl,
  type InviteCopy,
} from "../lib/invite";
import Stepper from "./Stepper";
type StepId = "name" | "phone" | "message";
// A parent arriving from the coordinator's push invites the son by WhatsApp, one question at a time.
export default function InvitePanel({
  me,
  copy,
  onSent,
}: {
  me: Person;
  copy: InviteCopy;
  onSent: (next: Person) => void;
}) {
  const [name, setName] = useState(me.dadFirst || "");
  const [phone, setPhone] = useState(me.dadPhone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const steps: StepId[] = [
    ...(me.dadFirst ? [] : (["name"] as StepId[])),
    ...(phoneReady(me.dadPhone || "") ? [] : (["phone"] as StepId[])),
    "message",
  ];
  const [step, setStep] = useState(1);
  const current = steps[step - 1];
  const next: Person = { ...me, dadFirst: name.trim(), dadPhone: phone };
  const url = inviteUrl(location.origin, next);
  const draft = inviteMessage(copy.invMsg, {
    me: me.first,
    them: name.trim() || "בן",
    url,
  });
  const message = draft;
  const them = name.trim();
  const valid =
    current === "name"
      ? !!them
      : current === "phone"
        ? phoneReady(phone)
        : true;
  function advance(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) {
      setTouched(true);
      return;
    }
    setTouched(false);
    if (current === "message") void send();
    else setStep(step + 1);
  }
  async function send() {
    if (!them || !phoneReady(phone) || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      await writeRow("לומדים", joinColumns(next));
      store("me", next);
      try {
        localStorage.setItem("df:inv-sent", "1");
      } catch {
        /* Storage is optional. */
      }
      const target = whatsappInvite(phone, withInviteUrl(message, url));
      if (popup) popup.location.href = target;
      else location.assign(target);
      setSent(true);
      onSent(next);
    } catch {
      popup?.close();
      setError("פרטי ההזמנה לא נשמרו. אפשר לנסות שוב.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div className="celebrate" role="status">
        <span className="done-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="36" height="36">
            <path
              d="M7 16.5l6 6L25 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1>ההזמנה מוכנה</h1>
        <p>הפרטים נשמרו. משלימים את השליחה בוואטסאפ.</p>
        <a
          className="button button-whatsapp"
          href={whatsappInvite(phone, withInviteUrl(message, url))}
          target="_blank"
          rel="noopener"
        >
          פתיחה שוב בוואטסאפ
        </a>
        <a className="button button-gold" href="/app">
          לדף של השבוע
        </a>
      </div>
    );
  const labels = steps.map((id) =>
    id === "name" ? "שם" : id === "phone" ? "טלפון" : "הודעה",
  );
  return (
    <Stepper
      step={step}
      labels={labels}
      title={
        current === "message"
          ? them
            ? copy.invTitle.replace("{them}", them)
            : copy.invTitleAny
          : current === "name"
            ? copy.invTitleAny
            : them
              ? copy.invPhone.replace("{them}", them)
              : copy.invPhoneAny
      }
      lead={current === "message" ? copy.invBody : undefined}
      onBack={step > 1 ? () => setStep(step - 1) : undefined}
    >
      <form className="flow-form invite" onSubmit={advance}>
        {current === "name" && (
          <>
            <label>
              {copy.invNameKid}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
                maxLength={60}
                autoFocus
              />
            </label>
            <p
              className="field-note"
              hidden={!(touched && !valid)}
              role="alert"
            >
              צריך את השם שלו כדי לפנות אליו.
            </p>
          </>
        )}
        {current === "phone" && (
          <>
            <label>
              טלפון
              <input
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="05XXXXXXXX"
                autoFocus
              />
            </label>
            <p
              className="field-note"
              hidden={!(touched && !valid)}
              role="alert"
            >
              {copy.invNeed}
            </p>
          </>
        )}
        {current === "message" && (
          <>
            <label>
              {copy.invEdit}
              <textarea rows={6} value={message} readOnly />
            </label>
            <p className="invite-tip">{copy.invTip}</p>
          </>
        )}
        <button
          className={
            current === "message"
              ? "button button-whatsapp"
              : "button button-blue"
          }
          type="submit"
          disabled={busy}
        >
          {busy
            ? "שומרים את ההזמנה…"
            : current === "message"
              ? copy.invBtn
              : "המשך"}
        </button>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Stepper>
  );
}
