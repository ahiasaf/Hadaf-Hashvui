import { isSampleInstitution } from "../lib/institution-visibility";
import { useEffect, useMemo, useState } from "react";
import { action } from "../lib/client";
export default function AdminRegistrations({
  adminKey,
  orders = false,
}: {
  adminKey: string;
  orders?: boolean;
}) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    setRows(null);
    setError(false);
    action<{ rows: string[][] }>("read", { read: "הרשמות", key: adminKey })
      .then((result) => {
        if (!Array.isArray(result.rows))
          throw new Error("Invalid registrations");
        if (active) setRows(result.rows);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [adminKey, attempt]);
  const headers = useMemo(() => rows?.[0] || [], [rows]);
  const cell = (row: string[], name: string) =>
    row[headers.indexOf(name)] || "";
  const latest = useMemo(() => {
    const seen = new Map<string, string[]>();
    for (const [index, row] of (rows?.slice(1) || []).entries()) {
      const name = row[headers.indexOf("ישיבה")] || "";
      if (isSampleInstitution(name)) continue;
      const code = (row[headers.indexOf("קוד")] || "").trim();
      const identity =
        code && code !== "other"
          ? "code:" + code
          : name.trim()
            ? "name:" + name.trim()
            : "row:" + index;
      seen.delete(identity);
      seen.set(identity, row);
    }
    return [...seen.values()].reverse();
  }, [rows, headers]);
  const quantity = (row: string[]) =>
    Math.max(0, Number(cell(row, 'סה"כ גמרות')) || 0);
  const records = latest.filter(
    (row) =>
      (!orders || quantity(row) > 0) &&
      (!query || row.join(" ").includes(query)),
  );
  const pages = Math.max(1, Math.ceil(records.length / 12));
  const currentPage = Math.min(page, pages);
  function exportRows() {
    const csv = [headers, ...records]
      .map((row) =>
        row.map((value) => '"' + value.replaceAll('"', '""') + '"').join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = orders ? "book-orders.csv" : "school-registrations.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="admin-panel"
      aria-label={orders ? "הזמנות גמרות" : "ישיבות רשומות"}
    >
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">
            {orders ? "הזמנות גמרות" : "הישיבות בתוכנית"}
          </p>
          <h2>{orders ? "כל ההזמנות במקום אחד" : "ההרשמה של כל ישיבה"}</h2>
        </div>
        <button
          className="button button-outline"
          onClick={() => setAttempt(attempt + 1)}
          disabled={!rows && !error}
        >
          רענון
        </button>
      </div>
      {error && (
        <p className="notice error" role="alert">
          לא הצלחנו לקרוא את ההרשמות. אפשר לנסות שוב.
        </p>
      )}
      {!rows && !error && (
        <div className="admin-loading" role="status">
          <span className="admin-spinner" aria-hidden="true" />
          טוענים {orders ? "הזמנות" : "ישיבות"}…
        </div>
      )}
      {rows && (
        <>
          <div className="admin-record-toolbar">
            <label>
              חיפוש ישיבה או איש קשר
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <button className="button button-outline" onClick={exportRows}>
              ייצוא CSV
            </button>
          </div>
          <p className="form-hint">
            {records.length} ישיבות
            {orders
              ? " · " +
                records.reduce((sum, row) => sum + quantity(row), 0) +
                " גמרות"
              : ""}
          </p>
          <div className="admin-registration-list">
            {records
              .slice((currentPage - 1) * 12, currentPage * 12)
              .map((row, index) => (
                <details className="admin-school-record" key={index}>
                  <summary>
                    <span>
                      <b>{cell(row, "ישיבה") || cell(row, "קוד")}</b>
                      <small>
                        {cell(row, "איש קשר") || "לא נמסרו פרטי קשר"}
                      </small>
                    </span>
                    <span className="admin-order-count">
                      {quantity(row) > 0
                        ? quantity(row) + " גמרות"
                        : "ללא הזמנה"}
                    </span>
                  </summary>
                  <div className="admin-school-details">
                    {headers.map(
                      (header, i) =>
                        row[i] &&
                        !["קוד", "ישיבה"].includes(header) && (
                          <div key={i}>
                            <span>{header}</span>
                            {header.includes("טלפון") ? (
                              <a
                                dir="ltr"
                                href={"tel:" + row[i].replace(/[^+0-9]/g, "")}
                              >
                                {row[i]}
                              </a>
                            ) : (
                              <b>{row[i]}</b>
                            )}
                          </div>
                        ),
                    )}
                    <a
                      className="secondary-link"
                      href={
                        "/tzevet?inst=" + encodeURIComponent(cell(row, "קוד"))
                      }
                    >
                      פתיחת עמוד הישיבה
                    </a>
                  </div>
                </details>
              ))}
          </div>
          {!records.length && (
            <p className="notice">
              {query
                ? "לא נמצאו תוצאות בחיפוש הזה."
                : orders
                  ? "עדיין אין הזמנות גמרות."
                  : "עדיין אין הרשמות ישיבה."}
            </p>
          )}
          {pages > 1 && (
            <div className="admin-pagination">
              <button
                className="text-button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                הקודם
              </button>
              <span>
                {currentPage} מתוך {pages}
              </span>
              <button
                className="text-button"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
