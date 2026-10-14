import { useEffect, useMemo, useState } from "react";
import { action, stored, store, type Person } from "../lib/client";
import { lessonHref, studyUnits, weekIndex, type Track } from "../lib/calendar";
import Install from "./Install";
type ReadingSpot = {
  mas: string;
  daf: string;
  am: number;
  i: number;
  n: number;
};

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
  const [syncFailed, setSyncFailed] = useState(false);
  const [lessonPage, setLessonPage] = useState(0);
  useEffect(() => {
    const savedSpot = stored<ReadingSpot | null>("spot", null);
    const selected = stored("track", savedSpot?.mas || tracks[0].id);
    if (tracks.some((track) => track.id === selected)) setTrackId(selected);
    const existing = stored<Person | null>("me", null);
    setPerson(existing);
    setCompleted(stored("learned", {}));
    if (!existing) return;
    let active = true;
    // One account reconciliation, followed by the station's lightweight completion read.
    action<{ id?: string; learned?: string[] }>("read", { idFor: existing.id })
      .then(async (result) => {
        if (!active || stored<Person | null>("me", null)?.id !== existing.id)
          return;
        const person = result.id ? { ...existing, id: result.id } : existing;
        store("me", person);
        setPerson(person);
        const station = await action<{ learned?: string[] }>("read", {
          amdaFor: person.id,
        });
        if (!active || stored<Person | null>("me", null)?.id !== person.id)
          return;
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
        if (active) setSyncFailed(true);
      });
    return () => {
      active = false;
    };
  }, [tracks]);
  const track = tracks.find((item) => item.id === trackId)!;
  const current = Math.min(weekIndex(startDate), track.cal.length - 1);
  const units = useMemo(
    () =>
      track.cal
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row[2] && row[2] !== "סיום"),
    [track],
  );
  const pageSize = 6;
  const pages = Math.ceil(units.length / pageSize);
  const shown = units.slice(lessonPage * pageSize, (lessonPage + 1) * pageSize);
  useEffect(() => {
    const position = units.findIndex(({ index }) => index >= current);
    setLessonPage(
      Math.floor((position < 0 ? units.length - 1 : position) / pageSize),
    );
  }, [units, current]);
  const count = track.cal.filter(
    (row, index) =>
      row[2] && row[2] !== "סיום" && completed[track.id + "|" + (index + 1)],
  ).length;
  const total = studyUnits(track);
  const percent = Math.round((count / total) * 100);
  useEffect(() => {
    const refresh = () => {
      const selected = stored("track", tracks[0].id);
      if (tracks.some((track) => track.id === selected)) setTrackId(selected);
      setPerson(stored<Person | null>("me", null));
      setCompleted(stored("learned", {}));
    };
    addEventListener("df-track-change", refresh);
    addEventListener("df-account-change", refresh);
    addEventListener("pageshow", refresh);
    const sync = (event: StorageEvent) => {
      if (
        ["df:track", "df:me", "df:learned"].includes(event.key || "") ||
        event.key === null
      )
        refresh();
    };
    addEventListener("storage", sync);
    return () => {
      removeEventListener("df-track-change", refresh);
      removeEventListener("df-account-change", refresh);
      removeEventListener("pageshow", refresh);
      removeEventListener("storage", sync);
    };
  }, [tracks]);
  return (
    <section className="workspace dashboard-details">
      <div className="progress-overview swap" key={"progress-" + trackId}>
        <div className="progress-summary">
          <div className="progress-count">
            <strong>
              <bdi>{count}</bdi>
            </strong>
            <span>
              מתוך <bdi>{total}</bdi> יחידות הושלמו
            </span>
          </div>
          <span className="progress-percent">
            <bdi>{percent}%</bdi>
          </span>
        </div>
        <progress max={total} value={count} aria-label="התקדמות במסכת" />
      </div>
      {!person && (
        <p className="notice">
          ההתקדמות נשמרת במכשיר. <a href="/join">הצטרפות לתוכנית</a> מאפשרת
          לעדכן גם את הישיבה.
        </p>
      )}
      {syncFailed && (
        <p className="notice" role="status">
          ההתקדמות במכשיר זמינה. העדכון מהישיבה לא הגיע, ננסה שוב בכניסה הבאה.
        </p>
      )}
      {person && <Install />}
      <section className="lesson-picker" aria-label="בחירת דף">
        <div className="lesson-picker-heading">
          <h2>בחירת דף</h2>
          <span aria-live="polite">
            <bdi>
              {lessonPage * pageSize + 1}-
              {Math.min((lessonPage + 1) * pageSize, units.length)}
            </bdi>{" "}
            מתוך <bdi>{units.length}</bdi>
          </span>
        </div>
        <div
          className="lesson-grid swap"
          key={"list-" + trackId + "-" + lessonPage}
        >
          {shown.map(({ row, index }) => {
            const done = !!completed[track.id + "|" + (index + 1)];
            return (
              <a
                className={
                  "lesson-tile" +
                  (index === current ? " is-current" : "") +
                  (done ? " is-done" : "")
                }
                key={index}
                href={lessonHref(track, row)}
                aria-current={index === current ? "true" : undefined}
              >
                <span>
                  שבוע <bdi>{index + 1}</bdi>
                </span>
                <strong>
                  דף {row[2]} {row[3] ? "ע״" + row[3] : ""}
                </strong>
                <small>
                  {done
                    ? "✓ הושלם"
                    : index === current
                      ? "השבוע"
                      : index > current
                        ? "בהמשך"
                        : "ללימוד"}
                </small>
              </a>
            );
          })}
        </div>
        <div className="lesson-picker-nav">
          <button
            type="button"
            disabled={lessonPage === 0}
            onClick={() => setLessonPage((page) => page - 1)}
            aria-label="דפים קודמים"
          >
            <span aria-hidden="true">→</span> הקודמים
          </button>
          <span>
            <bdi>
              {lessonPage + 1} / {pages}
            </bdi>
          </span>
          <button
            type="button"
            disabled={lessonPage + 1 >= pages}
            onClick={() => setLessonPage((page) => page + 1)}
            aria-label="דפים הבאים"
          >
            הבאים <span aria-hidden="true">←</span>
          </button>
        </div>
      </section>
      {person && (
        <a className="secondary-link" href="/join?edit=1">
          פרטי ההרשמה שלי
        </a>
      )}
    </section>
  );
}
