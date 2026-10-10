import { useState } from "react";
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
  const [edited, setEdited] = useState("");
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
  const message = edited || draft;
  const them = name.trim();
  const valid =
    current === "name"
      ? !!them
      : current === "phone"
        ? phoneReady(phone)
        : true;
  function advance(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) {
      setTouched(true);
      return;
    }
    setTouched(false);
    if (current === "message") send();
    else setStep(step + 1);
  }
  function send() {
    if (!them || !phoneReady(phone)) return;
    store("me", next);
    writeRow("לומדים", joinColumns(next)).catch(() => {
      /* The device keeps the son's details even if the sheet is offline. */
    });
    try {
      localStorage.setItem("df:inv-sent", "1");
    } catch {
      /* Storage is optional. */
    }
    window.open(
      whatsappInvite(phone, withInviteUrl(message, url)),
      "_blank",
      "noopener",
    );
    setSent(true);
    onSent(next);
  }
  if (sent)
    return (
      <div className="celebrate" role="status">
        <span className="done-mark" aria-hidden="true">
          ✓
        </span>
        <h1>ההזמנה בדרך</h1>
        <p>{copy.invSent}</p>
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
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setEdited(event.target.value)}
              />
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
        >
          {current === "message" ? copy.invBtn : "המשך"}
        </button>
      </form>
    </Stepper>
  );
}
