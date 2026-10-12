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
  if (done && !lessonKey && !onEnabled) return null;
  return (
    <div className="reminders">
      {done && lessonKey ? (
        <p role="status" className="notice success swap">
          הבקשה נשמרה. נודיע לכם כשהדף ייפתח.
        </p>
      ) : (
        <button
          className="button button-outline"
          disabled={busy || done}
          onClick={enable}
        >
          {!lessonKey && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d={
                  done
                    ? "m5 12 4 4 10-10"
                    : "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                }
              />
            </svg>
          )}
          <span>
            {busy
              ? "בודקים ושומרים…"
              : lessonKey
                ? "הודיעו לי כשהדף נפתח"
                : "הפעלת התראות"}
          </span>
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
