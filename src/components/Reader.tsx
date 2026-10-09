import { useEffect, useState } from "react";
import { sheet, stored, store, writeRow, type Person } from "../lib/client";
import { dafKey, parseLesson, segmentRects, marksQuery } from "../lib/lesson";
import { weekIndex, type Track } from "../lib/calendar";
import { hebrewText } from "../lib/copy";
import Reminders from "./Reminders";
type Lesson = ReturnType<typeof parseLesson>;
type Library = Record<string, Record<string, string[]>>;
type Images = Record<
  string,
  { responsive: string; width: number; height: number }
>;
type Manifest = { library: Library; pages: Images };
/* RTL chevron: "back" points to the start (right), "forward" to the end (left). */
function Chevron({ direction }: { direction: "back" | "forward" }) {
  return (
    <svg
      className={"chevron chevron-" + direction}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={direction === "back" ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Reader({
  tracks,
  startDate,
  libraryUrl,
}: {
  tracks: Track[];
  startDate: string;
  libraryUrl: string;
}) {
  const [library, setLibrary] = useState<Library>({});
  const [images, setImages] = useState<Images>({});
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selected, setSelected] = useState({ track: "", daf: "", amud: 0 });
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const track =
      tracks.find((item) => item.id === params.get("mas")) || tracks[0];
    const row = track.cal[Math.min(weekIndex(startDate), track.cal.length - 1)];
    const daf = dafKey(params.get("daf") || row[2] || "");
    const amud = Number(params.get("amud")) || 0;
    setSelected({ track: track.id, daf, amud });
    let active = true;
    setError("");
    setLesson(null);
    setImageError(false);
    setLocked(false);
    const raw =
      track.cal.find((row) => dafKey(row[2] || "") === daf)?.[2] || daf;
    const position = track.cal.findIndex((row) => dafKey(row[2] || "") === daf);
    const following =
      track.cal
        .slice(position + 1)
        .find(
          (row) => row[2] && row[2] !== "סיום" && dafKey(row[2]) !== daf,
        )?.[2] || "";
    const query = marksQuery(track.id, [raw, following]);
    const manifest = fetch(libraryUrl, {
      signal: AbortSignal.timeout(10000),
    }).then(async (response) => {
      if (!response.ok) throw new Error("Library unavailable");
      return (await response.json()) as Manifest;
    });
    Promise.all([
      manifest,
      sheet("דפים פתוחים", attempt > 0),
      sheet("סימוני הדף", attempt > 0, query).then((rows) =>
        rows.some((row) => row[0] === track.id)
          ? rows
          : sheet("סימוני הדף", attempt > 0),
      ),
    ])
      .then(([manifest, openRows, rows]) => {
        if (!active) return;
        setLibrary(manifest.library);
        setImages(manifest.pages);
        const opens = new Set(
          openRows
            .slice(1)
            .filter((row) => row[0] && row[1])
            .map((row) => row[0] + "|" + dafKey(row[1])),
        );
        const openKey =
          track.id + "|" + daf + (amud === 1 ? "." : amud === 2 ? ":" : "");
        const isOpen =
          opens.has(openKey) || (amud === 1 && opens.has(track.id + "|" + daf));
        if (!isOpen) {
          setLocked(true);
          setLesson({ pages: [], segments: [], groups: 0 });
          return;
        }
        const result = parseLesson(rows, track.id, daf, amud);
        setLesson(result);
        const position = stored<{ index: number; id: string; part?: number }>(
          "reader:" + track.id + "|" + daf + "|" + amud,
          { index: 0, id: "" },
        );
        const stable = position.id
          ? result.segments.findIndex(
              (segment) =>
                segment.id === position.id &&
                (!position.part || segment.part === position.part),
            )
          : -1;
        setIndex(
          stable >= 0
            ? stable
            : Math.min(position.index, Math.max(0, result.segments.length - 1)),
        );
      })
      .catch(() => {
        if (active)
          setError("לא הצלחנו לטעון את הדף. בדקו את החיבור ונסו שוב.");
      });
    return () => {
      active = false;
    };
  }, [tracks, startDate, attempt, libraryUrl]);
  const segment = lesson?.segments[index];
  const page = segment && lesson!.pages[segment.page];
  useEffect(() => {
    if (!lesson || !segment) return;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData || /2g/.test(connection?.effectiveType || ""))
      return;
    const next = lesson.segments
      .slice(index + 1, index + 4)
      .find((item) => item.page !== segment.page);
    if (!next) return;
    const nextPage = lesson.pages[next.page];
    const nextImage =
      images[
        selected.track +
          "|" +
          dafKey(nextPage.daf) +
          "|" +
          (nextPage.page === 1 ? "a" : "b")
      ];
    if (!nextImage) return;
    const timer = window.setTimeout(() => {
      const preview = new Image();
      preview.fetchPriority = "low";
      preview.decoding = "async";
      preview.src = nextImage.responsive;
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [lesson, segment, index, images, selected.track]);
  const track = tracks.find((item) => item.id === selected.track);
  const title =
    (track?.name || "הלימוד") + (selected.daf ? " · דף " + selected.daf : "");
  function move(next: number) {
    if (!lesson) return;
    setIndex(next);
    setImageError(false);
    const segment = lesson.segments[next];
    store(
      "reader:" + selected.track + "|" + selected.daf + "|" + selected.amud,
      { index: next, id: segment.id, part: segment.part },
    );
  }
  async function complete() {
    if (!track) return;
    setBusy(true);
    setError("");
    const week = track.cal.findIndex(
      (row) =>
        dafKey(row[2] || "") === selected.daf &&
        (!selected.amud || row[3] === (selected.amud === 1 ? "א" : "ב")),
    );
    const me = stored<Person | null>("me", null);
    const completed = stored<Record<string, string>>("learned", {});
    completed[selected.track + "|" + (week + 1)] = new Date().toISOString();
    store("learned", completed);
    try {
      if (me && week >= 0)
        await writeRow("לימוד", [
          ["מזהה", me.id],
          ["קוד ישיבה", me.inst],
          ["מסלול", selected.track],
          ["שבוע", String(week + 1)],
          ["דף", selected.daf],
          ["קטע", String(lesson?.groups || 1)],
          ["מתוך", String(lesson?.groups || 1)],
        ]);
      setDone(true);
    } catch {
      setError("הסיום נשמר במכשיר, אך העדכון לישיבה לא אושר. אפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }
  const available =
    !!page &&
    library[selected.track]?.[dafKey(page.daf)]?.includes(
      page.page === 1 ? "a" : "b",
    );
  const original = page
    ? "/daf/" +
      selected.track +
      "/" +
      encodeURIComponent(dafKey(page.daf)) +
      "-" +
      (page.page === 1 ? "a" : "b") +
      ".webp"
    : "";
  const image = page
    ? images[
        selected.track +
          "|" +
          dafKey(page.daf) +
          "|" +
          (page.page === 1 ? "a" : "b")
      ]
    : null;
  const rects = page && segment ? segmentRects(page.data, segment.mark) : [];
  return (
    <section className="workspace reader">
      <div className="reader-heading">
        <a className="secondary-link reader-back" href="/app">
          <Chevron direction="back" />
          הלימוד שלי
        </a>
        <h1>{title}</h1>
        <a
          className="secondary-link"
          href={
            "/lesson-tools?" +
            new URLSearchParams({
              mas: selected.track,
              daf: selected.daf,
              ...(selected.amud ? { amud: String(selected.amud) } : {}),
            })
          }
        >
          מצגת, שמע ואפשרויות נוספות
        </a>
      </div>
      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button
            className="button button-outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            ניסיון נוסף
          </button>
        </div>
      )}
      {!lesson && !error && (
        <p className="notice" role="status">
          טוענים את הלימוד…
        </p>
      )}
      {locked && (
        <div className="surface">
          <h2>הדף עוד לא נפתח</h2>
          <p>הרכז מכין את הלימוד. אפשר לבקש הודעה כשהדף ייפתח.</p>
          <Reminders
            lessonKey={
              selected.track +
              "|" +
              selected.daf +
              (selected.amud === 1 ? "." : selected.amud === 2 ? ":" : "")
            }
          />
          <a className="secondary-link" href="/calendar">
            בחירת דף אחר
          </a>
        </div>
      )}
      {lesson && !locked && !lesson.segments.length && (
        <div className="surface">
          <h2>הדף עדיין לא מוכן ללימוד</h2>
          <p>אפשר לבחור דף אחר בתוכנית הלימוד.</p>
          <a className="button button-blue" href="/calendar">
            לתוכנית הלימוד
          </a>
          {library[selected.track]?.[selected.daf] && (
            <a
              className="secondary-link"
              href={
                "/daf/" +
                selected.track +
                "/" +
                encodeURIComponent(selected.daf) +
                "-a.webp"
              }
            >
              צורת הדף המקורית
            </a>
          )}
        </div>
      )}
      {done ? (
        <div className="surface completion" role="status">
          <span aria-hidden="true">✓</span>
          <h2>עוד דף בדרך לסיום המסכת.</h2>
          <p>ההתקדמות שלכם נשמרה.</p>
          <a className="button button-blue" href="/app">
            חזרה ללימוד שלי
          </a>
        </div>
      ) : (
        segment &&
        page && (
          <>
            <div className="reader-progress">
              <span className="segment-indicator" aria-live="polite">
                קטע {index + 1} מתוך {lesson!.segments.length}
              </span>
              <span>עמוד {page.page === 1 ? "א" : "ב"}</span>
              <progress
                value={index + 1}
                max={lesson!.segments.length}
                aria-label="התקדמות בדף"
              />
            </div>
            <div className="reader-grid">
              <section className="reader-page surface">
                <div className="panel-top">
                  <h2>צורת הדף</h2>
                  <button
                    className="text-button"
                    onClick={() => setZoom((value) => !value)}
                  >
                    {zoom ? "תצוגה רגילה" : "הגדלה"}
                  </button>
                </div>
                {available && !imageError ? (
                  <div className="page-image">
                    <div
                      className="page-canvas"
                      style={{
                        width: zoom ? image?.width || 1600 : "100%",
                        aspectRatio:
                          (image?.width || page.data.w) +
                          "/" +
                          (image?.height || page.data.h),
                      }}
                    >
                      <img
                        src={zoom ? original : image?.responsive || original}
                        fetchPriority="high"
                        alt={title + " עמוד " + (page.page === 1 ? "א" : "ב")}
                        width={image?.width || page.data.w}
                        height={image?.height || page.data.h}
                        decoding="async"
                        onError={() => setImageError(true)}
                      />
                      <svg
                        className="swap"
                        key={segment.id + ":" + index}
                        viewBox="0 0 1 1"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        {rects.map((rect, i) => (
                          <rect
                            x={rect.left}
                            y={rect.top}
                            width={rect.width}
                            height={rect.height}
                            key={i}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <p className="notice">
                    תמונת העמוד אינה זמינה. הפירוש זמין כאן, ואפשר לנסות לטעון
                    שוב.
                  </p>
                )}
                <a
                  href={original}
                  className="secondary-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  פתיחת המקור ברזולוציה מלאה
                </a>
              </section>
              <section
                className="reader-explanation surface swap"
                key={segment.id + ":" + index}
              >
                <h2 id="explanation-title">פירוש חברותא</h2>
                <div
                  className="lesson-text"
                  role="region"
                  aria-labelledby="explanation-title"
                  tabIndex={0}
                >
                  {segment.continuation && (
                    <p className="form-hint">המשך הקטע מהעמוד הקודם</p>
                  )}
                  {hebrewText(
                    segment.mark.c?.text || "הפירוש לקטע זה עדיין לא נוסף.",
                  )}
                </div>
              </section>
            </div>
            <nav className="reader-controls" aria-label="מעבר בין קטעים">
              <button
                className="button button-outline"
                disabled={index === 0 || busy}
                onClick={() => move(index - 1)}
              >
                <Chevron direction="back" />
                הקטע הקודם
              </button>
              {index < lesson!.segments.length - 1 ? (
                <button
                  className="button button-blue"
                  onClick={() => move(index + 1)}
                >
                  הקטע הבא
                  <Chevron direction="forward" />
                </button>
              ) : (
                <button
                  className="button button-blue"
                  disabled={busy}
                  onClick={complete}
                >
                  {busy ? "שומרים…" : "סיימתי את הדף"}
                </button>
              )}
            </nav>
          </>
        )
      )}
    </section>
  );
}
