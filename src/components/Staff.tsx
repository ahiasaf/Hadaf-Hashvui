import { useEffect, useState } from "react";
import { lessonHref, weekIndex, type Track } from "../lib/calendar";
export default function Staff({
  institutions,
  tracks,
  startDate,
}: {
  institutions: { code: string; name: string }[];
  tracks: Track[];
  startDate: string;
}) {
  const [ready, setReady] = useState(false);
  const [inst, setInst] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    setInst(new URLSearchParams(location.search).get("inst") || "");
    setReady(true);
  }, []);
  const query = inst ? "?inst=" + encodeURIComponent(inst) : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.origin + "/join" + query);
      setCopied(true);
    } catch {
      setFallback(true);
      setError("אפשר לבחור ולהעתיק את הקישור בשדה שנפתח.");
    }
  }
  async function share() {
    const url = location.origin + "/join" + query;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "הדף השבועי",
          text: "מצטרפים ללימוד השבועי",
          url,
        });
      } catch (failure) {
        if (!(failure instanceof DOMException && failure.name === "AbortError"))
          await copy();
      }
    } else await copy();
  }
  const name = institutions.find((item) => item.code === inst)?.name;
  return (
    <section className="workspace">
      <div className="page-intro">
        <h1>הלימוד מתחיל בכיתה.</h1>
        <p>הדף השבועי, קישור לתלמידים והתקדמות הישיבה במקום אחד.</p>
      </div>
      <label className="institution-select">
        הישיבה שלי
        <select
          aria-label="הישיבה שלי"
          disabled={!ready}
          value={inst}
          onChange={(event) => {
            setInst(event.target.value);
            setCopied(false);
            setError("");
            setFallback(false);
          }}
        >
          <option value="">בחירת ישיבה</option>
          {institutions.map((item) => (
            <option value={item.code} key={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="workspace-grid">
        <section className="surface">
          <h2>הדף השבועי</h2>
          {tracks.map((track) => {
            const row =
              track.cal[Math.min(weekIndex(startDate), track.cal.length - 1)];
            return (
              <a
                className="lesson-row"
                href={lessonHref(track, row)}
                key={track.id}
              >
                <strong>
                  {track.name} · {row[2] ? "דף " + row[2] : "שבוע הפסקה"}
                </strong>
                <span>פתיחת הלימוד</span>
              </a>
            );
          })}
          <a className="secondary-link" href="/calendar">
            כל תוכנית הלימוד
          </a>
        </section>
        <section className="surface school-invitation">
          <span className="invitation-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M4 5h16v14H4zM4 6l8 7 8-7" />
              <path d="M8 19v2m8-2v2" />
            </svg>
          </span>
          <h2>מצרפים את התלמידים</h2>
          <p>{name ? "הזמנה ללימוד של " + name : "הזמנה ללימוד השבועי"}</p>
          <div className="invitation-actions">
            <button
              className="button button-blue"
              disabled={!ready}
              onClick={share}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8" />
              </svg>
              שיתוף הזמנה
            </button>
            <button
              className="button button-outline"
              disabled={!ready}
              onClick={copy}
            >
              {copied ? "הקישור הועתק" : "העתקת קישור לתלמידים"}
            </button>
          </div>
          <div className="invitation-secondary">
            <a
              href={
                "https://wa.me/?text=" +
                encodeURIComponent(
                  "מצטרפים לדף השבועי " +
                    (typeof location !== "undefined" ? location.origin : "") +
                    "/join" +
                    query,
                )
              }
              target="_blank"
              rel="noopener"
            >
              שליחה בוואטסאפ
            </a>
            <a href={"/join" + query}>פתיחת ההרשמה</a>
          </div>
          <p className="invitation-feedback" role="status">
            {copied
              ? "מוכן לשליחה בכיתה או בקבוצת הישיבה."
              : "ההזמנה תפתח את ההרשמה עם הישיבה שבחרתם."}
          </p>
          {fallback && (
            <label>
              קישור להעתקה
              <input
                readOnly
                dir="ltr"
                value={location.origin + "/join" + query}
                onFocus={(event) => event.target.select()}
              />
            </label>
          )}
          {error && <p role="alert">{error}</p>}
        </section>
        <section className="surface">
          <h2>התקדמות התלמידים</h2>
          <p>לוח הישיבה מוגן בקוד הגישה שקיבלתם מהרכז.</p>
          <a className="button button-outline" href={"/board" + query}>
            פתיחת לוח הישיבה
          </a>
        </section>
        <section className="surface">
          <h2>ניהול התוכנית</h2>
          <p>לרכז: משתתפים, תוכן והגדרות התוכנית.</p>
          <a className="button button-outline" href="/admin">
            כניסה לניהול
          </a>
        </section>
      </div>
    </section>
  );
}
