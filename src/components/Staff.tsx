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
  const [inst, setInst] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setInst(new URLSearchParams(location.search).get("inst") || "");
  }, []);
  const query = inst ? "?inst=" + encodeURIComponent(inst) : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.origin + "/join" + query);
      setCopied(true);
    } catch {
      setError("אפשר להעתיק את כתובת ההרשמה המוצגת כאן.");
    }
  }
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
          value={inst}
          onChange={(event) => {
            setInst(event.target.value);
            setCopied(false);
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
        <section className="surface">
          <h2>מצרפים את התלמידים</h2>
          <p>שלחו את הקישור בכיתה או בקבוצת הישיבה.</p>
          <a className="button button-blue" href={"/join" + query}>
            פתיחת ההרשמה
          </a>
          <button className="button button-outline" onClick={copy}>
            {copied ? "✓ הקישור הועתק" : "העתקת קישור לתלמידים"}
          </button>
          <code className="share-url" dir="ltr">
            /join{query}
          </code>
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
