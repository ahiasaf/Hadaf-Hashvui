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
// A parent arriving from the coordinator's push invites the son by WhatsApp.
export default function InvitePanel({
  me,
  copy,
  onSent,
}: {
  me: Person;
  copy: InviteCopy;
  onSent: (next: Person) => void;
}) {
  const known = !!me.dadFirst;
  const hasPhone = phoneReady(me.dadPhone || "");
  const [name, setName] = useState(me.dadFirst || "");
  const [phone, setPhone] = useState(me.dadPhone || "");
  const [edited, setEdited] = useState("");
  const [sent, setSent] = useState(false);
  const next: Person = { ...me, dadFirst: name.trim(), dadPhone: phone };
  const url = inviteUrl(location.origin, next);
  const draft = inviteMessage(copy.invMsg, {
    me: me.first,
    them: name.trim() || "בן",
    url,
  });
  const message = edited || draft;
  const ready = phoneReady(phone) && !!name.trim();
  const them = name.trim();
  function send() {
    if (!ready) return;
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
      <div className="invite swap" role="status">
        <p className="notice success">{copy.invSent}</p>
        <a className="button button-blue" href="/app">
          ללימוד שלי
        </a>
      </div>
    );
  return (
    <div className="invite flow-form">
      <h2>{them ? copy.invTitle.replace("{them}", them) : copy.invTitleAny}</h2>
      <p>{copy.invBody}</p>
      {!known && (
        <label>
          {copy.invNameKid}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            maxLength={60}
          />
        </label>
      )}
      {!hasPhone && (
        <label>
          {them ? copy.invPhone.replace("{them}", them) : copy.invPhoneAny}
          <input
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="05XXXXXXXX"
          />
          {!phoneReady(phone) && (
            <span className="form-hint">{copy.invNeed}</span>
          )}
        </label>
      )}
      <label>
        {copy.invEdit}
        <textarea
          rows={6}
          value={message}
          onChange={(event) => setEdited(event.target.value)}
        />
      </label>
      <p className="invite-tip">{copy.invTip}</p>
      <button
        className="button button-whatsapp"
        type="button"
        onClick={send}
        aria-disabled={!ready}
      >
        {copy.invBtn}
      </button>
    </div>
  );
}
