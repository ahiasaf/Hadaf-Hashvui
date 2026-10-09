import { useEffect, useState } from "react";
import { action, stored, store, type Person } from "../lib/client";
import { lessonHref, studyUnits, weekIndex, type Track } from "../lib/calendar";
import Reminders from "./Reminders";
export default function StudentHome({
  tracks,
  startDate,
}: {
  tracks: Track[];
  startDate: string;
}) {
  const [person, setPerson] = useState<Person | null>(null);
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [trackId, setTrackId] = useState(tracks[0].id);
  useEffect(() => {
    const existing = stored<Person | null>("me", null);
    setPerson(existing);
    setCompleted(stored("learned", {}));
    if (!existing) return;
    let active = true;
    // One account reconciliation, followed by the station's lightweight completion read.
    action<{ id?: string; learned?: string[] }>("read", { idFor: existing.id })
      .then(async (result) => {
        if (!active) return;
        const person = result.id ? { ...existing, id: result.id } : existing;
        store("me", person);
        setPerson(person);
        const station = await action<{ learned?: string[] }>("read", {
          amdaFor: person.id,
        });
        if (!active) return;
        const progress = stored<Record<string, string>>("learned", {});
        for (const tag of [
          ...(result.learned || []),
          ...(station.learned || []),
        ]) {
          if (/^(taanit|megila)\|[1-9]\d?$/.test(tag))
            progress[tag] ||= new Date().toISOString();
        }
        store("learned", progress);
        setCompleted(progress);
      })
      .catch(() => {
        /* Existing local progress stays available while offline. */
      });
    return () => {
      active = false;
    };
  }, []);
  const track = tracks.find((item) => item.id === trackId)!;
  const current = Math.min(weekIndex(startDate), track.cal.length - 1);
  const count = track.cal.filter(
    (row, index) => row[2] && completed[track.id + "|" + (index + 1)],
  ).length;
  return (
    <section className="workspace">
      <div className="page-intro">
        {person && <p className="eyebrow">{person.instName}</p>}
        <h1>{person ? "שלום, " + person.first : "הלימוד שלי"}</h1>
        <p>דף אחד בכל שבוע. ממשיכים מהמקום שבו עצרתם.</p>
      </div>
      <div className="track-tabs" role="group" aria-label="מסלול לימוד">
        {tracks.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === trackId}
            onClick={() => setTrackId(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="progress-overview swap" key={"progress-" + trackId}>
        <strong>{count}</strong>
        <span>יחידות הושלמו מתוך {studyUnits(track)}</span>
        <progress
          max={studyUnits(track)}
          value={count}
          aria-label="התקדמות במסכת"
        />
      </div>
      {!person && (
        <p className="notice">
          ההתקדמות נשמרת במכשיר. <a href="/join">הצטרפות לתוכנית</a> מאפשרת
          לעדכן גם את הישיבה.
        </p>
      )}
      <div className="lesson-list swap" key={"list-" + trackId}>
        {track.cal.map((row, index) =>
          !row[2] || row[2] === "סיום" ? null : (
            <a
              className={
                "lesson-row " + (index === current ? "is-current" : "")
              }
              key={index}
              href={lessonHref(track, row)}
              aria-current={index === current ? "true" : undefined}
            >
              <span className="week-label">שבוע {index + 1}</span>
              <strong>
                דף {row[2]} {row[3] ? "ע״" + row[3] : ""}
              </strong>
              <span>
                {completed[track.id + "|" + (index + 1)]
                  ? "✓ הושלם"
                  : index === current
                    ? "הדף השבועי"
                    : index > current
                      ? "בהמשך התוכנית"
                      : "ללימוד"}
              </span>
            </a>
          ),
        )}
      </div>
      {person && <Reminders />}
      <a className="secondary-link" href="/join">
        פרטי ההרשמה שלי
      </a>
    </section>
  );
}
