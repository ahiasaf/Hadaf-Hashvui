import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { action, stored, store, type Person } from "../lib/client";
import { lessonHref, studyUnits, weekIndex, type Track } from "../lib/calendar";
import Install from "./Install";
import { requestEffectEntrance } from "../lib/effect-motion";
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
  initialWeek,
}: {
  tracks: Track[];
  startDate: string;
  initialWeek: number;
}) {
  const [person, setPerson] = useState<Person | null>(null);
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lessonPage, setLessonPage] = useState(0);
  const [week, setWeek] = useState(initialWeek);
  const [direction, setDirection] = useState(1);
  const grid = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (grid.current) requestEffectEntrance(grid.current);
  }, [lessonPage, trackId]);
  useEffect(() => {
    setWeek(weekIndex(startDate));
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
  }, [tracks, startDate]);
  const track = tracks.find((item) => item.id === trackId)!;
  const current = Math.min(week, track.cal.length - 1);
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
    if (progress.current) requestEffectEntrance(progress.current);
  }, [count, trackId]);
  useEffect(() => {
    const refresh = () => {
      setWeek(weekIndex(startDate));
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
  }, [tracks, startDate]);
  return (
    <section className="workspace dashboard-details">
      {!person && (
        <p className="notice dashboard-guest">
          ההתקדמות נשמרת במכשיר. <a href="/join">הצטרפות לתוכנית</a> מאפשרת
          לעדכן גם את הישיבה.
        </p>
      )}
      {syncFailed && (
        <p className="notice" role="status">
          ההתקדמות במכשיר זמינה. העדכון מהישיבה לא הגיע, ננסה שוב בכניסה הבאה.
        </p>
      )}
      <section className="lesson-picker" aria-label="בחירת דף">
        <div className="lesson-picker-heading">
          <h2>הדפים במסכת {track.name}</h2>
          {/* The masechet's completion ledger heads its own index: one tick per daf. */}
          <div className="progress-overview" ref={progress}>
            <div className="progress-summary">
              <div className="progress-count">
                <strong>
                  <bdi>{count}</bdi>
                </strong>
                <span>
                  מתוך <bdi>{total}</bdi> דפים הושלמו
                </span>
              </div>
              <span className="progress-percent">
                <bdi>{percent}%</bdi>
              </span>
            </div>
            <progress
              max={total}
              value={count}
              aria-label="התקדמות במסכת"
              style={{ "--units": total } as CSSProperties}
            />
          </div>
        </div>
        <div className="lesson-grid" ref={grid} data-direction={direction}>
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
                aria-label={`שבוע ${index + 1}, מסכת ${track.name}, דף ${row[2]}${row[3] ? " עמוד " + row[3] : ""}${done ? ", הושלם" : ""}${index === current ? ", השבוע" : ""}`}
              >
                <span className="tile-week" aria-hidden="true">
                  <bdi>{index + 1}</bdi>
                </span>
                <span className="tile-main">
                  <strong>דף {row[2]}</strong>
                  <span>{row[3] ? "עמוד " + row[3] : row[1]}</span>
                </span>
                <span className="tile-state">
                  {done ? (
                    <svg
                      viewBox="0 0 20 20"
                      width="18"
                      height="18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m4 10 4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                  <small>
                    {index === current ? "השבוע" : done ? "הושלם" : ""}
                  </small>
                </span>
              </a>
            );
          })}
        </div>
        <div className="lesson-picker-nav">
          <button
            type="button"
            disabled={lessonPage === 0}
            onClick={() => {
              setDirection(-1);
              setLessonPage((page) => page - 1);
            }}
            aria-label="דפים קודמים"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m14 7 5 5-5 5M19 12H5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span aria-live="polite">
            <bdi>
              {lessonPage * pageSize + 1}-
              {Math.min((lessonPage + 1) * pageSize, units.length)}
            </bdi>{" "}
            מתוך <bdi>{units.length}</bdi>
          </span>
          <button
            type="button"
            disabled={lessonPage + 1 >= pages}
            onClick={() => {
              setDirection(1);
              setLessonPage((page) => page + 1);
            }}
            aria-label="דפים הבאים"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m10 7-5 5 5 5M5 12h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>
      {person && <Install />}
    </section>
  );
}
