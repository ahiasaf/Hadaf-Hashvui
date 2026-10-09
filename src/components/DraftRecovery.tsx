import { useEffect, useRef, useState } from "react";
import {
  copyText,
  draftText,
  loadDrafts,
  type Draft,
} from "../lib/draft-recovery";

type CopyState = "idle" | "copied" | "failed";

function DraftCard({ draft }: { draft: Draft }) {
  const [copied, setCopied] = useState<CopyState>("idle");
  const body = useRef<HTMLParagraphElement>(null);
  const text = draftText(draft);
  async function copy() {
    const ok = await copyText(text);
    setCopied(ok ? "copied" : "failed");
    // When the clipboard is blocked, the text is selected for a manual copy.
    if (!ok && body.current) {
      const range = document.createRange();
      range.selectNodeContents(body.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  return (
    <section className="surface document">
      <h2>
        דף {draft.daf} · קטע {draft.segment} ({draft.track})
      </h2>
      {draft.at > 0 && (
        <p className="form-hint">
          נכתב: {new Date(draft.at).toLocaleString("he-IL")}
        </p>
      )}
      <p ref={body}>{text || "(ריק)"}</p>
      <button
        className="button button-outline"
        type="button"
        disabled={!text}
        onClick={copy}
      >
        {copied === "copied" ? "הועתק ✓" : "העתקה"}
      </button>
      {copied === "failed" && (
        <p className="notice error" role="alert">
          ההעתקה נחסמה בדפדפן. הטקסט סומן, אפשר להעתיק אותו ידנית.
        </p>
      )}
    </section>
  );
}

export default function DraftRecovery() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    try {
      setDrafts(loadDrafts());
    } catch {
      setError(true);
    }
  }, []);
  if (error)
    return (
      <section className="workspace narrow">
        <p className="notice error" role="alert">
          לא הצלחנו לקרוא את הטיוטות. אל תנקו את המכשיר. נסו לפתוח שוב או פנו
          לרכז התוכנית.
        </p>
      </section>
    );
  if (!drafts) return <section className="workspace narrow" aria-busy="true" />;
  return (
    <section className="workspace narrow swap">
      <div className="page-intro">
        <h1>טיוטות שנשמרו במכשיר</h1>
        <p>
          פירושים שנכתבו כאן ועוד לא הגיעו לגיליון. הטיוטות נשארות במכשיר עד
          שהעורך ישמור אותן.
        </p>
      </div>
      {drafts.length ? (
        drafts.map((draft) => <DraftCard key={draft.key} draft={draft} />)
      ) : (
        <p className="notice" role="status">
          אין במכשיר הזה פירוש שלא נשמר.
        </p>
      )}
    </section>
  );
}
