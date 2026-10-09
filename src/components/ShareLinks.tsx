import { useEffect, useMemo, useState } from "react";
import { sheet, store, stored } from "../lib/client";
import {
  copyOverrides,
  draftTexts,
  layerCopy,
  publishedValue,
  siteLinks,
  whatsappHref,
  type CopyMap,
  type InviteCopy,
  type KishurimCopy,
  type RetiredCopy,
} from "../lib/share-links";

// Only a device with the management area open, sent here with ?tedit=1, edits copy in place.
function canEditCopy() {
  try {
    return (
      localStorage.getItem("df:admOk") === "1" &&
      new URLSearchParams(location.search).get("tedit") === "1"
    );
  } catch {
    return false;
  }
}

// Code copy, then the published sheet, then this device's draft. Shared by every copy-driven screen.
export function useCopy<T extends CopyMap>(
  base: T,
  prefix: string,
  retired: RetiredCopy,
) {
  const [published, setPublished] = useState<CopyMap>({});
  const [draft, setDraft] = useState<CopyMap>({});
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setDraft(draftTexts(stored("cfg", {})));
    setEditing(canEditCopy());
    let active = true;
    sheet("טקסטים")
      .then((rows) => {
        if (active) setPublished(copyOverrides(rows));
      })
      .catch(() => {
        /* The copy shipped with the page stays in place. */
      });
    return () => {
      active = false;
    };
  }, []);
  const copy = useMemo(
    () => layerCopy(base, prefix, published, draft, retired),
    [base, prefix, published, draft, retired],
  );
  function edit(key: keyof T & string, value: string) {
    const full = prefix + "." + key;
    const below = publishedValue(base, prefix, key, published, retired);
    const next = { ...draft };
    if (!value.trim() || value === below) delete next[full];
    else next[full] = value;
    setDraft(next);
    store("cfg", {
      ...stored<Record<string, unknown>>("cfg", {}),
      texts: next,
    });
  }
  const changed = (key: keyof T & string) => prefix + "." + key in draft;
  return { copy, editing, edit, changed };
}

export function CopyEditor<T extends CopyMap>({
  title,
  copy,
  keys,
  changed,
  edit,
}: {
  title: string;
  copy: T;
  keys: readonly (keyof T & string)[];
  changed: (key: keyof T & string) => boolean;
  edit: (key: keyof T & string, value: string) => void;
}) {
  return (
    <details className="copy-editor surface" open>
      <summary>{title}</summary>
      <p className="form-hint">
        כל הקלדה נשמרת כטיוטה במכשיר הזה ומוצגת מיד. הפרסום לגיליון נעשה
        מהניהול.
      </p>
      {keys.map((key) => (
        <label key={key}>
          <span dir="ltr">
            {key}
            {changed(key) && <em> · שונה, טרם פורסם</em>}
          </span>
          <textarea
            rows={copy[key].length > 70 ? 4 : 2}
            value={copy[key]}
            onChange={(event) => edit(key, event.target.value)}
          />
          {changed(key) && (
            <button
              type="button"
              className="text-button"
              onClick={() => edit(key, "")}
            >
              שחזור
            </button>
          )}
        </label>
      ))}
    </details>
  );
}

const whatsappIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"
    />
  </svg>
);

export default function ShareLinks({
  copy: base,
  invites: inviteBase,
  retired,
}: {
  copy: KishurimCopy;
  invites: InviteCopy;
  retired: RetiredCopy;
}) {
  const kish = useCopy(base, "kish", retired);
  const ui = useCopy(inviteBase, "ui", retired);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  const links = siteLinks(kish.copy, ui.copy, origin);
  async function copyUrl(key: string, url: string) {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
    } catch {
      setCopied("");
      setCopyError(
        "ההעתקה לא הצליחה. אפשר להעתיק את הכתובת המוצגת מתחת לכפתור.",
      );
    }
  }
  return (
    <section className="workspace narrow share-links">
      <div className="page-intro">
        <h1>{kish.copy.h1}</h1>
        <p>{kish.copy.lead}</p>
      </div>
      {links.map((link) => (
        <section className="surface share-link" key={link.key}>
          <h2>{link.title}</h2>
          <p>{link.description}</p>
          <a
            className="button button-whatsapp"
            href={origin ? whatsappHref(link.message) : undefined}
            aria-disabled={!origin}
            target="_blank"
            rel="noopener"
          >
            {whatsappIcon}
            {link.button}
          </a>
          <button
            type="button"
            className="text-button"
            disabled={!origin}
            onClick={() => copyUrl(link.key, link.url)}
          >
            {copied === link.key ? kish.copy.copied : kish.copy.copy}
          </button>
          {copyError && copied !== link.key && (
            <code className="share-url" dir="ltr">
              {link.url}
            </code>
          )}
        </section>
      ))}
      {copyError && (
        <p className="notice error" role="alert">
          {copyError}
        </p>
      )}
      {kish.editing && (
        <>
          <CopyEditor
            title="עריכת הנוסחים בעמוד"
            copy={kish.copy}
            keys={Object.keys(base) as (keyof KishurimCopy)[]}
            changed={kish.changed}
            edit={kish.edit}
          />
          <CopyEditor
            title="ההודעות המשותפות לתלמידים ולהורים"
            copy={ui.copy}
            keys={["linkWa", "dadWa"]}
            changed={ui.changed}
            edit={ui.edit}
          />
        </>
      )}
    </section>
  );
}
