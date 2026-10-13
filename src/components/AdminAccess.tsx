import { useEffect, useState } from "react";
import { action } from "../lib/client";
import { staffRequest } from "../lib/staff-access";
import copy from "../config/copy.json";
export default function AdminAccess({ adminKey }: { adminKey: string }) {
  const [rows, setRows] = useState<string[][] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [query, setQuery] = useState(""),
    [attempt, setAttempt] = useState(0),
    [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    setRows(null);
    setError("");
    action<{ rows: string[][] }>("read", { read: "גישה", key: adminKey })
      .then((result) => {
        if (!Array.isArray(result.rows)) throw new Error("Invalid access list");
        if (active) setRows(result.rows);
      })
      .catch(() => {
        if (active) setError("רשימת הבקשות לא נטענה. אפשר לנסות שוב.");
      });
    return () => {
      active = false;
    };
  }, [adminKey, attempt]);
  const headers = rows?.[0] || [];
  const cell = (row: string[], name: string) =>
    row[headers.indexOf(name)] || "";
  const latest = new Map<string, string[]>();
  for (const row of rows?.slice(1) || [])
    if (cell(row, "מזהה")) latest.set(cell(row, "מזהה"), row);
  const records = [...latest.values()]
    .filter((row) => !query || row.join(" ").includes(query))
    .sort(
      (a, b) =>
        Number(cell(b, "מצב") === "ממתין") - Number(cell(a, "מצב") === "ממתין"),
    );
  const pages = Math.max(1, Math.ceil(records.length / 12)),
    current = Math.min(page, pages);
  async function decide(row: string[], state: string) {
    const id = cell(row, "מזהה");
    setBusy(id);
    setError("");
    try {
      const reply = await staffRequest({
        accset: id,
        st: state,
        key: adminKey,
        ...(state === "אושר" ? { t: copy.UI.accOkT, b: copy.UI.accOkB } : {}),
      });
      if (reply.status !== "ok")
        throw new Error("Access change not acknowledged");
      setAttempt((value) => value + 1);
    } catch {
      setError("השינוי לא אושר. הבקשה נשארה זמינה לניסיון נוסף.");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">צוותי הישיבות</p>
          <h2>בקשות גישה</h2>
        </div>
        <button
          className="text-button"
          disabled={!!busy}
          onClick={() => setAttempt((value) => value + 1)}
        >
          רענון
        </button>
      </div>
      <label>
        חיפוש איש צוות
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!rows && !error && <p role="status">טוענים את הבקשות…</p>}
      <div className="admin-school-list">
        {records.slice((current - 1) * 12, current * 12).map((row) => (
          <article
            className="admin-school access-record"
            key={cell(row, "מזהה")}
          >
            <div className="admin-panel-heading">
              <div>
                <h3>{cell(row, "שם") || "איש צוות"}</h3>
                <p>
                  {cell(row, "ישיבה")} · {cell(row, "תפקיד")}
                </p>
              </div>
              <span className="admin-quantity">
                {cell(row, "מצב") || "ממתין"}
              </span>
            </div>
            {cell(row, "טלפון") && (
              <a
                dir="ltr"
                href={"tel:" + cell(row, "טלפון").replace(/[^+0-9]/g, "")}
              >
                {cell(row, "טלפון")}
              </a>
            )}
            <div className="access-record-actions">
              <button
                className="button button-blue"
                disabled={!!busy || cell(row, "מצב") === "אושר"}
                onClick={() => void decide(row, "אושר")}
                aria-label={"אישור " + cell(row, "שם")}
              >
                {busy === cell(row, "מזהה") ? "שומרים…" : "אישור גישה"}
              </button>
              <button
                className="button button-outline"
                disabled={!!busy || cell(row, "מצב") === "נעול"}
                onClick={() => void decide(row, "נעול")}
                aria-label={"נעילת " + cell(row, "שם")}
              >
                נעילה
              </button>
            </div>
          </article>
        ))}
      </div>
      {rows && !records.length && (
        <p className="notice">
          {query ? "לא נמצאו בקשות בחיפוש הזה." : "אין בקשות גישה כרגע."}
        </p>
      )}
      {pages > 1 && (
        <div className="admin-pagination">
          <button
            className="text-button"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            הקודם
          </button>
          <span>
            {current} מתוך {pages}
          </span>
          <button
            className="text-button"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            הבא
          </button>
        </div>
      )}
    </section>
  );
}
