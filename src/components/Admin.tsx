import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { action } from "../lib/client";
import Roster from "./Roster";
import AdminOverview from "./AdminOverview";
import AdminRegistrations from "./AdminRegistrations";
import { parseCsv } from "../lib/csv";
const tabs = ["סקירה", "משתתפים", "ישיבות", "הזמנות", "תוכן", "מלל", "הגדרות"];
const contentTabs = [
  "סימוני הדף",
  "פירוש",
  "שאלות בדף",
  "מצגת",
  "מצגות",
  "דפים פתוחים",
];
export default function Admin({
  institutions,
  startDate,
}: {
  institutions: { code: string; name: string }[];
  startDate: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [key, setKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [tab, setTab] = useState("סקירה");
  const [sheetName, setSheetName] = useState(contentTabs[0]);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(1);
  const [listPage, setListPage] = useState(1);
  const requestVersion = useRef(0);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function login(event: SubmitEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await action("read", { codes: "1", key: inputKey });
      setKey(inputKey);
      setInputKey("");
    } catch {
      setError("הכניסה לא אושרה. בדקו את סיסמת הרכז והחיבור.");
    } finally {
      setBusy(false);
    }
  }
  async function load(name: string, discard = false) {
    if (
      dirty &&
      !discard &&
      !window.confirm("לטעון מחדש בלי לשמור את השינויים?")
    )
      return;
    const version = ++requestVersion.current;
    setBusy(true);
    setRows(null);
    setError("");
    setMessage("");
    setDirty(false);
    try {
      const result = await action<{ rows: string[][] }>("read", {
        read: name,
        key,
      });
      if (!Array.isArray(result.rows)) throw new Error("Invalid rows");
      if (version !== requestVersion.current) return;
      setRows(result.rows);
      setSelected(1);
      setSearch("");
      setListPage(1);
    } catch {
      if (version === requestVersion.current)
        setError("לא הצלחנו לקרוא את התוכן. אפשר לנסות שוב.");
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  async function save() {
    if (!rows?.length || !dirty) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await action("write", {
        action: "table",
        tab: sheetName,
        key,
        cols: JSON.stringify(rows[0]),
        rows: JSON.stringify(rows.slice(1)),
      });
      setDirty(false);
      setMessage("השינויים נשמרו ואושרו על ידי השרת.");
    } catch {
      setError("השמירה לא אושרה. הטיוטה נשארה כאן ואפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }
  function changeTab(next: string) {
    if (dirty && !window.confirm("יש שינויים שלא נשמרו. לעבור בלי לשמור?"))
      return;
    requestVersion.current++;
    setTab(next);
    setRows(null);
    setMessage("");
    setError("");
    setDirty(false);
    if (["תוכן", "מלל", "הגדרות"].includes(next)) {
      const name =
        next === "מלל"
          ? "טקסטים"
          : next === "הגדרות"
            ? "הגדרות"
            : contentTabs[0];
      setSheetName(name);
      void load(name, true);
    }
  }
  function update(row: number, column: number, value: string) {
    setRows((previous) =>
      previous!.map((cells, i) =>
        i === row
          ? previous![0].map((_, j) => (j === column ? value : cells[j] || ""))
          : cells,
      ),
    );
    setDirty(true);
    setMessage("");
  }
  async function importCsv(file?: File) {
    if (!file) return;
    const next = parseCsv(await file.text());
    if (
      !next.length ||
      (rows?.[0] && JSON.stringify(next[0]) !== JSON.stringify(rows[0]))
    ) {
      setError("כותרות הקובץ אינן תואמות לתוכן שנפתח.");
      return;
    }
    setRows(next);
    setSelected(1);
    setSearch("");
    setListPage(1);
    setDirty(true);
  }
  function exportCsv() {
    if (!rows) return;
    const csv = rows
      .map((row) =>
        row.map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "content-export.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const visibleRows = (rows?.slice(1) || [])
    .map((cells, index) => ({ cells, index: index + 1 }))
    .filter(({ cells }) => !search || cells.join(" ").includes(search));
  const pages = Math.max(1, Math.ceil(visibleRows.length / 12));
  const currentPage = Math.min(listPage, pages);
  const selectedRow = rows?.[selected];
  return (
    <section
      className={
        "workspace admin-workspace" + (!key ? " admin-login-workspace" : "")
      }
    >
      {!key ? (
        <div className="admin-login">
          <div className="admin-login-intro">
            <p className="eyebrow">לצוות התוכנית</p>
            <h1>ניהול הדף השבועי</h1>
            <svg
              className="admin-login-art"
              viewBox="0 0 180 140"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 32c30-10 45-10 70 3 25-13 40-13 70-3v82c-30-10-45-10-70 3-25-13-40-13-70-3V32Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M90 35v82M36 53h34M36 68h34m40-15h34m-34 15h34"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="90" cy="116" r="6" fill="currentColor" />
            </svg>
          </div>
          <form
            className="flow-form admin-login-form"
            onSubmit={login}
            aria-busy={!ready || busy}
          >
            <h2>כניסה לניהול</h2>
            <label>
              סיסמת הקריאה
              <div className="admin-password">
                <input
                  type={visiblePassword ? "text" : "password"}
                  value={inputKey}
                  onChange={(event) => setInputKey(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={!ready || busy}
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  aria-label={visiblePassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
                  disabled={!ready || busy}
                  aria-pressed={visiblePassword}
                  onClick={() => setVisiblePassword(!visiblePassword)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </label>
            <button
              className={"button button-blue" + (busy ? " is-busy" : "")}
              disabled={!ready || busy}
            >
              {!ready ? (
                "טוענים…"
              ) : busy ? (
                <>
                  <span className="admin-spinner" aria-hidden="true" />
                  בודקים גישה…
                </>
              ) : (
                "כניסה לניהול"
              )}
            </button>
            {error && (
              <p role="alert" className="notice error">
                {error}
              </p>
            )}
            <a className="secondary-link" href="/app">
              חזרה ללימוד
            </a>
          </form>
        </div>
      ) : (
        <>
          <header className="admin-header">
            <div>
              <p className="eyebrow">מרכז הניהול</p>
              <h1>הדף השבועי</h1>
            </div>
            <button
              className="button button-outline"
              disabled={busy}
              onClick={() => {
                if (!dirty || window.confirm("לצאת בלי לשמור?")) {
                  requestVersion.current++;
                  setKey("");
                  setRows(null);
                  setDirty(false);
                  setError("");
                  setMessage("");
                  setVisiblePassword(false);
                }
              }}
            >
              יציאה
            </button>
          </header>
          <div className="admin-layout">
            <nav className="admin-sidebar" aria-label="ניהול">
              <div className="admin-section-nav">
                {tabs.map((value, index) => (
                  <button
                    key={value}
                    aria-pressed={tab === value}
                    disabled={busy}
                    onClick={() => changeTab(value)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <path
                        d={
                          index === 0
                            ? "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"
                            : index === 1
                              ? "M16 21v-3a4 4 0 0 0-8 0v3M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-3a4 4 0 0 0-3-4M3 21v-3a4 4 0 0 1 3-4"
                              : index === 2
                                ? "M3 21V7l9-4 9 4v14M8 21v-5h8v5M7 9v3m5-3v3m5-3v3"
                                : index === 3
                                  ? "M3 5c4-2 6-2 9 0 3-2 5-2 9 0v15c-4-2-6-2-9 0-3-2-5-2-9 0V5Zm9 0v15"
                                  : "M4 4h16v16H4zM8 9h8m-8 5h5"
                        }
                      />
                    </svg>
                    {value}
                  </button>
                ))}
              </div>
              <a href="/management?legacy=1#admin" className="admin-extra">
                כלי ניהול נוספים
              </a>
            </nav>
            <div className="admin-main" key={tab}>
              {tab === "סקירה" ? (
                <AdminOverview adminKey={key} onOpen={changeTab} />
              ) : tab === "משתתפים" ? (
                <div className="admin-panel">
                  <h2>התקדמות המשתתפים</h2>
                  <Roster
                    institutions={institutions}
                    startDate={startDate}
                    adminKey={key}
                  />
                </div>
              ) : tab === "ישיבות" || tab === "הזמנות" ? (
                <AdminRegistrations adminKey={key} orders={tab === "הזמנות"} />
              ) : (
                <section className="admin-panel admin-editor">
                  <div className="admin-panel-heading">
                    <div>
                      <p className="eyebrow">
                        {tab === "תוכן" ? "הלימוד השבועי" : "התוכנית"}
                      </p>
                      <h2>{tab === "תוכן" ? "תוכן הלימוד" : tab}</h2>
                    </div>
                    {tab === "תוכן" && (
                      <label>
                        סוג תוכן
                        <select
                          aria-label="סוג תוכן"
                          value={sheetName}
                          disabled={busy}
                          onChange={(event) => {
                            if (dirty && !window.confirm("לעבור בלי לשמור?"))
                              return;
                            setSheetName(event.target.value);
                            void load(event.target.value, true);
                          }}
                        >
                          {contentTabs.map((name) => (
                            <option key={name}>{name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  {error && (
                    <p className="notice error" role="alert">
                      {error}
                    </p>
                  )}
                  {message && (
                    <p className="notice success" role="status">
                      {message}
                    </p>
                  )}
                  {busy && !rows && (
                    <div className="admin-loading" role="status">
                      <span className="admin-spinner" aria-hidden="true" />
                      טוענים את התוכן…
                    </div>
                  )}
                  {!rows && !busy && (
                    <button
                      className="button button-outline"
                      onClick={() => load(sheetName)}
                    >
                      טעינת התוכן
                    </button>
                  )}
                  {rows && (
                    <>
                      <div className="admin-editor-toolbar">
                        <button
                          className={
                            "button button-blue" + (busy ? " is-busy" : "")
                          }
                          disabled={busy || !dirty}
                          onClick={save}
                        >
                          {busy
                            ? "שומרים…"
                            : dirty
                              ? "שמירת השינויים"
                              : "אין שינויים לשמירה"}
                        </button>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => load(sheetName)}
                        >
                          רענון
                        </button>
                        <details className="admin-file-tools">
                          <summary>ייבוא וייצוא</summary>
                          <button
                            className="text-button"
                            onClick={exportCsv}
                            disabled={busy}
                          >
                            ייצוא CSV
                          </button>
                          <label className="file-input">
                            ייבוא CSV
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              disabled={busy}
                              onChange={(event) =>
                                void importCsv(event.target.files?.[0])
                              }
                            />
                          </label>
                        </details>
                      </div>
                      <div className="admin-editor-layout">
                        <div className="admin-record-picker">
                          <label>
                            חיפוש רשומה
                            <input
                              type="search"
                              value={search}
                              onChange={(event) => {
                                setSearch(event.target.value);
                                setListPage(1);
                              }}
                            />
                          </label>
                          <p className="form-hint">
                            {visibleRows.length} מתוך{" "}
                            {Math.max(0, rows.length - 1)} רשומות
                          </p>
                          <div className="admin-record-list">
                            {visibleRows
                              .slice((currentPage - 1) * 12, currentPage * 12)
                              .map(({ cells, index }) => (
                                <button
                                  key={index}
                                  aria-pressed={selected === index}
                                  onClick={() => setSelected(index)}
                                >
                                  <b>{cells[0] || "רשומה חדשה"}</b>
                                  <small>{cells[1] || "שורה " + index}</small>
                                </button>
                              ))}
                          </div>
                          {pages > 1 && (
                            <div className="admin-pagination">
                              <button
                                className="text-button"
                                disabled={currentPage === 1}
                                onClick={() => setListPage(currentPage - 1)}
                              >
                                הקודם
                              </button>
                              <span>
                                {currentPage} / {pages}
                              </span>
                              <button
                                className="text-button"
                                disabled={currentPage === pages}
                                onClick={() => setListPage(currentPage + 1)}
                              >
                                הבא
                              </button>
                            </div>
                          )}
                          <button
                            className="button button-outline"
                            disabled={busy || !rows[0]?.length}
                            onClick={() => {
                              setSelected(rows.length);
                              setRows((previous) => [
                                ...previous!,
                                previous![0].map(() => ""),
                              ]);
                              setDirty(true);
                            }}
                          >
                            הוספת רשומה
                          </button>
                        </div>
                        <div className="admin-record-fields" key={selected}>
                          {selectedRow ? (
                            <>
                              <div className="admin-record-heading">
                                <h3>{selectedRow[0] || "רשומה חדשה"}</h3>
                                <span>שורה {selected}</span>
                              </div>
                              {rows[0]?.map((header, column) => (
                                <label key={column}>
                                  {header}
                                  <textarea
                                    aria-label={header + ", שורה " + selected}
                                    value={selectedRow[column] || ""}
                                    disabled={busy}
                                    onChange={(event) =>
                                      update(
                                        selected,
                                        column,
                                        event.target.value,
                                      )
                                    }
                                    spellCheck={false}
                                    rows={column === 0 ? 2 : 4}
                                  />
                                </label>
                              ))}
                            </>
                          ) : (
                            <p className="notice">
                              {rows.length > 1
                                ? "בחרו רשומה לעריכה."
                                : "אין רשומות עדיין. אפשר להוסיף את הראשונה."}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
