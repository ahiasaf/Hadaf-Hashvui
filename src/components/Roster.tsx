import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SubmitEvent,
} from "react";
import {
  staffIdentity,
  clearStaffCaches,
  staffRequest,
} from "../lib/staff-access";
import { action } from "../lib/client";
import { weekIndex } from "../lib/calendar";
type Student = {
  id: string;
  first: string;
  last: string;
  grade: string;
  klass?: string;
  way?: string;
  phone?: string;
  inst?: string;
  learned?: string[];
  weeks?: string[];
  pos?: Record<string, number>;
  test?: boolean;
  push?: boolean;
  with?: string;
  withOk?: boolean;
};
export default function Roster({
  institutions,
  startDate,
  adminKey = "",
}: {
  institutions: { code: string; name: string }[];
  startDate: string;
  adminKey?: string;
}) {
  const [code, setCode] = useState("");
  const [key, setKey] = useState(adminKey);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [accessState, setAccessState] = useState("");
  const [phone, setPhone] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inst = params.get("inst") || "";
    setCode(inst);
    if (!adminKey) {
      let saved = "";
      try {
        saved = localStorage.getItem("boardKey:" + inst) || "";
      } catch {
        /* Storage is optional. */
      }
      setKey(params.get("k") || saved);
    }
  }, [adminKey]);
  const load = useCallback(
    async (event?: SubmitEvent) => {
      event?.preventDefault();
      const request = ++generation.current;
      setBusy(true);
      setError("");
      setStudents(null);
      try {
        const identity = staffIdentity(code);
        const result = await action<{ status: string; students?: Student[] }>(
          "read",
          adminKey
            ? { board: "*", key: adminKey }
            : { board: code, k: key, dev: identity?.id || "" },
        );
        if (request !== generation.current) return;
        if (["wait", "locked", "unknown"].includes(result.status)) {
          setAccessState(result.status);
          if (result.status === "locked") clearStaffCaches();
          return;
        }
        if (!Array.isArray(result.students)) throw new Error("Invalid roster");
        setAccessState("ok");
        setStudents(result.students);
      } catch {
        if (request === generation.current)
          setError("לא הצלחנו לפתוח את הלוח. בדקו את החיבור ונסו שוב.");
      } finally {
        if (request === generation.current) setBusy(false);
      }
    },
    [code, key, adminKey],
  );
  useEffect(() => {
    if (accessState !== "wait") return;
    const refresh = () => {
      if (document.visibilityState !== "hidden") void load();
    };
    const timer = setInterval(refresh, 30000);
    addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [accessState, load]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  async function chooseRole(pick: string) {
    const identity = staffIdentity(code);
    if (!identity) return;
    if (pick === "kid" && !window.confirm("לעבור להרשמה כתלמיד?")) return;
    setBusy(true);
    setError("");
    try {
      const reply = await staffRequest({
        acc: code,
        dev: identity.id,
        pick,
        ...(phone ? { ph: phone } : {}),
      });
      if (reply.status === "wait") setAccessState("wait");
      else if (reply.status === "kid") {
        clearStaffCaches();
        localStorage.setItem("df:stuLock", JSON.stringify(code));
        localStorage.setItem(
          "df:lockPre",
          JSON.stringify({ ...identity, phone: phone || identity.phone || "" }),
        );
        location.assign("/join?inst=" + encodeURIComponent(code));
      } else throw new Error("Role request not acknowledged");
    } catch {
      setError("הבקשה לא אושרה. אפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }
  const week = weekIndex(startDate) + 1;
  const done = (student: Student) =>
    (student.weeks || student.learned || []).some(
      (tag) => tag.split("|")[1] === String(week),
    );
  const filtered = useMemo(
    () =>
      (students || []).filter(
        (student) =>
          (!grade || student.grade === grade) &&
          (!search || (student.first + " " + student.last).includes(search)),
      ),
    [students, grade, search],
  );
  return (
    <section className={adminKey ? "roster" : "workspace"}>
      {!adminKey && (
        <div className="page-intro">
          <h1>התקדמות התלמידים</h1>
          <p>רשימת התלמידים זמינה לאיש צוות שהרכז אישר לישיבה הזו.</p>
        </div>
      )}
      <form onSubmit={load} className="access-form">
        {!adminKey && (
          <>
            <label>
              ישיבה
              <select
                aria-label="ישיבה"
                value={code}
                onChange={(event) => {
                  generation.current++;
                  setCode(event.target.value);
                  setStudents(null);
                  setAccessState("");
                  setError("");
                }}
                required
              >
                <option value="">בחירת ישיבה</option>
                {institutions.map((inst) => (
                  <option value={inst.code} key={inst.code}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              קוד ישיבה (אם קיבלתם)
              <input
                type="password"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                autoComplete="current-password"
              />
            </label>
          </>
        )}
        <button
          className={"button button-blue" + (busy ? " is-busy" : "")}
          disabled={busy}
        >
          {busy ? "טוענים את הלוח…" : students ? "רענון הלוח" : "פתיחת הלוח"}
        </button>
      </form>
      {!adminKey && accessState && accessState !== "ok" && (
        <section className="notice" role="status">
          <h2>
            {accessState === "wait"
              ? "ממתינים לאישור הרכז"
              : accessState === "locked"
                ? "איש צוות או תלמיד?"
                : "כניסה לצוות הישיבה"}
          </h2>
          {accessState === "wait" ? (
            <p>הבקשה אצל רכז התוכנית. הלוח ייפתח כאן כשיאשר.</p>
          ) : accessState === "locked" ? (
            <div className="flow-form">
              <label>
                טלפון (לא חובה)
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <button
                className="button button-blue"
                disabled={busy}
                onClick={() => void chooseRole("staff")}
              >
                אני איש צוות
              </button>
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => void chooseRole("kid")}
              >
                אני תלמיד
              </button>
            </div>
          ) : (
            <a
              className="button button-blue"
              href={"/management?staff=" + encodeURIComponent(code) + "#phone"}
            >
              הרשמה כאיש צוות
            </a>
          )}
        </section>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {students && (
        <>
          <div className="stats">
            <div>
              <strong>{students.length}</strong>
              <span>תלמידים רשומים</span>
            </div>
            <div>
              <strong>{students.filter(done).length}</strong>
              <span>סיימו השבוע</span>
            </div>
            <div>
              <strong>
                {students.filter((student) => student.push).length}
              </strong>
              <span>עם התראות</span>
            </div>
          </div>
          <div className="roster-filters">
            <label>
              חיפוש תלמיד
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="שם פרטי או משפחה"
              />
            </label>
            <label>
              שכבה
              <select
                aria-label="שכבה"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              >
                <option value="">כל השכבות</option>
                {[
                  ...new Set(
                    students.map((student) => student.grade).filter(Boolean),
                  ),
                ]
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
          </div>
          <p className="form-hint">
            מוצגים {filtered.length} מתוך {students.length}
          </p>
          <div className="roster-list">
            {filtered.map((student) => (
              <details className="student-row" key={student.id}>
                <summary>
                  <span>
                    <strong>
                      {student.first} {student.last}
                    </strong>
                    <small>
                      {student.grade} {student.klass} · {student.way || ""}
                    </small>
                  </span>
                  <span className={done(student) ? "status-done" : ""}>
                    {done(student) ? "✓ סיים השבוע" : "עוד לא סיים"}
                  </span>
                </summary>
                <div className="student-details">
                  <p>
                    {student.with
                      ? "לומד עם " +
                        student.with +
                        (student.withOk ? " (הרשמה מאומתת)" : " (לפי ההרשמה)")
                      : ""}
                  </p>
                  {adminKey && student.phone && (
                    <a
                      className="secondary-link"
                      href={"tel:" + student.phone}
                      dir="ltr"
                    >
                      {student.phone}
                    </a>
                  )}
                  <p>
                    יחידות לימוד שהושלמו:{" "}
                    {(student.weeks || student.learned || []).length}
                  </p>
                </div>
              </details>
            ))}
          </div>
          {!filtered.length && (
            <p className="notice">
              {students.length
                ? "לא נמצאו תלמידים בחיפוש הזה."
                : "עדיין אין תלמידים רשומים בישיבה."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
