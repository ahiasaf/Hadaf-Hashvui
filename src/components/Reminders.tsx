import { useEffect, useState } from "react";
import { remindersEnabled } from "../lib/community";
import { enableReminders, waitForLesson } from "../lib/notifications";
export default function Reminders({
  lessonKey = "",
  onEnabled,
}: {
  lessonKey?: string;
  onEnabled?: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      setDone(
        lessonKey
          ? localStorage.getItem("df:wait:" + lessonKey) === "1"
          : remindersEnabled(),
      );
    } catch {
      /* Storage is optional. */
    }
  }, [lessonKey]);
  async function enable() {
    setBusy(true);
    setError("");
    try {
      if (lessonKey) await waitForLesson(lessonKey);
      else await enableReminders();
      setDone(true);
      onEnabled?.();
    } catch {
      setError(
        "הבקשה לא אושרה. אפשר לבדוק את הרשאת ההתראות והחיבור ולנסות שוב. באייפון יש לפתוח מהאפליקציה שנוספה למסך הבית.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (done && !lessonKey) return null;
  return (
    <div className="reminders">
      {done ? (
        <p role="status" className="notice success swap">
          הבקשה נשמרה. נודיע לכם כשהדף ייפתח.
        </p>
      ) : (
        <button
          className="button button-outline"
          disabled={busy}
          onClick={enable}
        >
          {busy
            ? "בודקים ושומרים…"
            : lessonKey
              ? "הודיעו לי כשהדף נפתח"
              : "הפעלת תזכורות לדף השבועי"}
        </button>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
