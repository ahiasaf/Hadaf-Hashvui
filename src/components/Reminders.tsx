import { useEffect, useState } from "react";
import { stored, type Person } from "../lib/client";
import { enableReminders, waitForLesson } from "../lib/notifications";
export default function Reminders({ lessonKey = "" }: { lessonKey?: string }) {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const me = stored<Person | null>("me", null);
      setDone(
        lessonKey
          ? localStorage.getItem("df:wait:" + lessonKey) === "1"
          : !!me && localStorage.getItem("df:noteOn") === me.id,
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
    } catch {
      setError(
        "הבקשה לא אושרה. אפשר לבדוק את הרשאת ההתראות והחיבור ולנסות שוב. באייפון יש לפתוח מהאפליקציה שנוספה למסך הבית.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reminders">
      {done ? (
        <p role="status" className="notice success swap">
          {lessonKey
            ? "הבקשה נשמרה. נודיע לכם כשהדף ייפתח."
            : "התזכורות נרשמו ואושרו."}
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
