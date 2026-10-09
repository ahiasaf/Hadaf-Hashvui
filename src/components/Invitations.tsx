import { useEffect, useState } from "react";
import {
  gradeList,
  institutionCode,
  institutionName,
  invitationMessage,
  saveGrade,
  savedGrade,
  sendKeys,
  type Audience,
  type Institution,
  type SendCopy,
} from "../lib/invitations";
import {
  fillTemplate,
  whatsappHref,
  type RetiredCopy,
} from "../lib/share-links";
import { CopyEditor, useCopy } from "./ShareLinks";

export type Flyer = { display: string; file: string; download: string };

type Outcome =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "shared"; copied: boolean }
  | { kind: "whatsapp"; copied: boolean }
  | { kind: "error"; href: string };

const audiences: Audience[] = ["sons", "par"];

function shareFile(file: File | null) {
  if (!file || !("canShare" in navigator) || !navigator.share) return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export default function Invitations({
  copy: base,
  institutions,
  flyers,
  retired,
}: {
  copy: SendCopy;
  institutions: Institution[];
  flyers: Record<Audience, Flyer>;
  retired: RetiredCopy;
}) {
  const { copy, editing, edit, changed } = useCopy(base, "send", retired);
  const grades = gradeList(copy);
  const [grade, setGrade] = useState("");
  const [origin, setOrigin] = useState("");
  const [code, setCode] = useState("lapid");
  const [files, setFiles] = useState<Record<Audience, File | null>>({
    sons: null,
    par: null,
  });
  const [open, setOpen] = useState<Record<Audience, boolean>>({
    sons: false,
    par: false,
  });
  const [outcome, setOutcome] = useState<Record<Audience, Outcome>>({
    sons: { kind: "idle" },
    par: { kind: "idle" },
  });
  useEffect(() => {
    setOrigin(location.origin);
    setCode(institutionCode(location.search));
    setGrade(savedGrade(gradeList(base)));
    // The original JPEG is what WhatsApp receives; a missing flyer only removes the attachment.
    let active = true;
    for (const audience of audiences) {
      fetch(flyers[audience].file)
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => {
          if (!active || !blob) return;
          const file = new File([blob], audience + ".jpg", {
            type: "image/jpeg",
          });
          setFiles((current) => ({ ...current, [audience]: file }));
        })
        .catch(() => {
          /* Sharing falls back to the WhatsApp link. */
        });
    }
    return () => {
      active = false;
    };
  }, [base, flyers]);
  const name = institutionName(institutions, code);
  const message = (audience: Audience) =>
    invitationMessage(copy, audience, grade, origin, code);
  function pickGrade(value: string) {
    setGrade(value);
    saveGrade(value);
  }
  function setResult(audience: Audience, result: Outcome) {
    setOutcome((current) => ({ ...current, [audience]: result }));
  }
  function send(audience: Audience) {
    if (!grade || !origin) return;
    const text = message(audience);
    const copying = navigator.clipboard
      ? navigator.clipboard.writeText(text).then(
          () => true,
          () => false,
        )
      : Promise.resolve(false);
    const file = files[audience];
    if (file && shareFile(file)) {
      setResult(audience, { kind: "busy" });
      navigator
        .share({ files: [file], text })
        .then(async () => {
          const copied = await copying;
          setResult(audience, { kind: "shared", copied });
          if (!copied) setOpen((current) => ({ ...current, [audience]: true }));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError")
            setResult(audience, { kind: "idle" });
          else setResult(audience, { kind: "error", href: whatsappHref(text) });
        });
      return;
    }
    // Same user gesture, so the new window is not blocked.
    window.open(whatsappHref(text), "_blank", "noopener");
    setOpen((current) => ({ ...current, [audience]: true }));
    copying.then((copied) => setResult(audience, { kind: "whatsapp", copied }));
  }
  return (
    <section className="workspace narrow invitations">
      <div className="page-intro">
        {name && <p className="eyebrow">{name}</p>}
        <h1>{copy.h1}</h1>
      </div>
      <section className="surface">
        <h2>
          <span className="step-number">1</span>
          {copy.g1}
        </h2>
        <p>{copy.g1b}</p>
        <div className="grade-grid" role="group" aria-label={copy.g1}>
          {grades.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={value === grade}
              onClick={() => pickGrade(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </section>
      <section className="surface">
        <h2>
          <span className="step-number">2</span>
          {copy.g2}
        </h2>
        {!grade && (
          <p className="notice" role="status">
            {copy.pick}
          </p>
        )}
        {audiences.map((audience) => {
          const state = outcome[audience];
          const flyer = flyers[audience];
          return (
            <div className="invitation" key={audience}>
              <button
                type="button"
                className={
                  "button " +
                  (audience === "sons" ? "button-blue" : "button-gold")
                }
                disabled={!grade || !origin || state.kind === "busy"}
                onClick={() => send(audience)}
              >
                <span>
                  <strong>{audience === "sons" ? copy.sons : copy.par}</strong>
                  <small>
                    {audience === "sons"
                      ? grade
                        ? fillTemplate(copy.sonsB, { g: grade })
                        : copy.sonsAny
                      : copy.parB}
                  </small>
                </span>
              </button>
              {state.kind === "busy" && (
                <p className="form-hint" role="status">
                  חלון השיתוף פתוח. בחרו בוואטסאפ ואת איש הקשר.
                </p>
              )}
              {(state.kind === "shared" || state.kind === "whatsapp") && (
                <p className="notice success swap" role="status">
                  {state.kind === "shared" ? copy.okShare : copy.okWa}
                  {!state.copied &&
                    " ההעתקה ללוח לא הצליחה, לכן ההודעה פתוחה למטה להעתקה ידנית."}
                </p>
              )}
              {state.kind === "error" && (
                <p className="notice error swap" role="alert">
                  השיתוף לא הושלם.{" "}
                  <a href={state.href} target="_blank" rel="noopener">
                    פתיחת ההודעה בוואטסאפ
                  </a>{" "}
                  ושמירת הפלייר מהתצוגה.
                </p>
              )}
              {grade && (
                <button
                  type="button"
                  className="text-button"
                  aria-expanded={open[audience]}
                  onClick={() =>
                    setOpen((current) => ({
                      ...current,
                      [audience]: !current[audience],
                    }))
                  }
                >
                  {open[audience] ? copy.peekOff : copy.peek}
                </button>
              )}
              {grade && open[audience] && (
                <div className="invitation-preview swap">
                  <img
                    src={flyer.display}
                    alt={
                      audience === "sons" ? "הפלייר לתלמידים" : "הפלייר להורים"
                    }
                    loading="lazy"
                  />
                  <p className="invitation-message">
                    {origin && message(audience)}
                  </p>
                  <a
                    className="button button-outline"
                    href={flyer.file}
                    download={flyer.download}
                  >
                    {copy.save}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </section>
      <p className="whatsapp-hint">
        <svg viewBox="0 0 24 24" aria-hidden="true" width="26" height="26">
          <path
            fill="#25d366"
            d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01c-1.77 0-3.5-.48-5.02-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.9 9.88zM20.52 3.45A11.8 11.8 0 0012.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.24-1.64a11.9 11.9 0 005.8 1.48h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.46-8.46z"
          />
        </svg>
        <strong>{copy.open}</strong>
      </p>
      {name && (
        <p className="form-hint invitation-target">
          {fillTemplate(copy.inst, { inst: name })}
        </p>
      )}
      {editing && (
        <CopyEditor
          title="עריכת הנוסחים בעמוד"
          copy={copy}
          keys={sendKeys}
          changed={changed}
          edit={edit}
        />
      )}
    </section>
  );
}
