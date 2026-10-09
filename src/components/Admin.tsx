import { useState, type SubmitEvent } from "react";
import { action } from "../lib/client";
import Roster from "./Roster";
import { parseCsv } from "../lib/csv";
const tabs = ["משתתפים", "תוכן", "מלל", "הגדרות"];
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
  const [key, setKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [tab, setTab] = useState("משתתפים");
  const [sheetName, setSheetName] = useState(contentTabs[0]);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
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
  async function load(name: string) {
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
      setRows(result.rows);
    } catch {
      setError("לא הצלחנו לקרוא את התוכן. השינויים בגיליון לא נפגעו.");
    } finally {
      setBusy(false);
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
    setTab(next);
    setRows(null);
    setMessage("");
    setError("");
    setDirty(false);
    if (next === "מלל" || next === "הגדרות") {
      const name = next === "מלל" ? "טקסטים" : "הגדרות";
      setSheetName(name);
      void load(name);
    }
  }
  function update(row: number, column: number, value: string) {
    setRows((previous) =>
      previous!.map((cells, i) =>
        i === row
          ? cells.map((cell, j) => (j === column ? value : cell))
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
  return (
    <section className="workspace">
      <div className="page-intro">
        <h1>ניהול הדף השבועי</h1>
      </div>
      {!key ? (
        <form className="flow-form narrow surface" onSubmit={login}>
          <label>
            סיסמת הקריאה
            <input
              type="password"
              value={inputKey}
              onChange={(event) => setInputKey(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <p className="form-hint">הסיסמה נבדקת בשרת ואינה נשמרת במכשיר.</p>
          <button className="button button-blue" disabled={busy}>
            {busy ? "בודקים גישה…" : "כניסה לניהול"}
          </button>
          <a className="secondary-link" href="/management#admin">
            כניסה עם קוד הניהול
          </a>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
        </form>
      ) : (
        <>
          <div className="admin-nav">
            <div className="track-tabs" role="group" aria-label="ניהול">
              {tabs.map((value) => (
                <button
                  key={value}
                  aria-pressed={tab === value}
                  onClick={() => changeTab(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              className="text-button"
              onClick={() => {
                if (!dirty || window.confirm("לצאת בלי לשמור?")) {
                  setKey("");
                  setRows(null);
                  setDirty(false);
                }
              }}
            >
              יציאה
            </button>
          </div>
          {tab === "משתתפים" ? (
            <Roster
              institutions={institutions}
              startDate={startDate}
              adminKey={key}
            />
          ) : (
            <section className="surface swap" key={tab}>
              <div className="panel-top">
                <h2>{tab === "תוכן" ? "תוכן הלימוד" : tab}</h2>
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
                        void load(event.target.value);
                      }}
                    >
                      {contentTabs.map((name) => (
                        <option key={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => load(sheetName)}
                >
                  {busy ? "טוענים…" : "טעינת התוכן"}
                </button>
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
              {rows && (
                <>
                  <div className="editor-actions">
                    <button
                      className="button button-blue"
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
                      className="button button-outline"
                      onClick={exportCsv}
                    >
                      ייצוא CSV
                    </button>
                    <label className="file-input">
                      ייבוא CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(event) =>
                          void importCsv(event.target.files?.[0])
                        }
                      />
                    </label>
                  </div>
                  <p className="form-hint">
                    {Math.max(0, rows.length - 1)} רשומות. טיוטה נשמרת במסך עד
                    לאישור מהשרת.
                  </p>
                  <div className="table-scroll">
                    <table className="content-table">
                      <thead>
                        <tr>
                          {rows[0]?.map((cell, i) => (
                            <th key={i}>{cell}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(1).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>
                                <textarea
                                  aria-label={
                                    String(rows[0][j]) + ", שורה " + (i + 1)
                                  }
                                  value={cell}
                                  onChange={(event) =>
                                    update(i + 1, j, event.target.value)
                                  }
                                  spellCheck={false}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      setRows((previous) => [
                        ...previous!,
                        previous![0].map(() => ""),
                      ]);
                      setDirty(true);
                    }}
                  >
                    הוספת רשומה
                  </button>
                </>
              )}
            </section>
          )}
          <p className="form-hint">
            סימונים על צורת הדף והקלטות: <a href="/studio">סטודיו התוכן</a>.
            הזמנות גמרות, דוחות וכלי הניהול הקודמים:{" "}
            <a href="/management#admin">הניהול המלא</a>.
          </p>
        </>
      )}
    </section>
  );
}
