import { useEffect, useState } from "react";
import { action } from "../lib/client";
type Health = {
  backend?: string;
  tabs?: { name: string; rows: number }[];
  privTabs?: { name: string; rows: number }[];
};
export default function AdminOverview({
  adminKey,
  onOpen,
}: {
  adminKey: string;
  onOpen: (tab: string) => void;
}) {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setHealth(null);
    setError(false);
    action<Health>("read", { health: "1", key: adminKey })
      .then((result) => {
        if (active) setHealth(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [adminKey, attempt]);
  const tables = [...(health?.tabs || []), ...(health?.privTabs || [])];
  const metrics = [
    ["לומדים", "משתתפים", "משתתפים"],
    ["הרשמות", "הרשמות ישיבה", "ישיבות"],
    ["סימוני הדף", "דפים עם סימונים", "תוכן"],
  ];
  const shortcuts = [
    [
      "ישיבות",
      "הרשמות ופרטי קשר",
      "M3 21V7l9-4 9 4v14M8 21v-5h8v5M7 9v3m5-3v3m5-3v3",
    ],
    [
      "הזמנות",
      "גמרות וכמויות",
      "M3 5c4-2 6-2 9 0 3-2 5-2 9 0v15c-4-2-6-2-9 0-3-2-5-2-9 0V5Zm9 0v15",
    ],
    ["תוכן", "דפים, ביאורים ומצגות", "M4 4h16v16H4zM8 9h8m-8 5h5"],
    [
      "הגדרות",
      "אפשרויות התוכנית",
      "M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    ],
  ];
  return (
    <section className="admin-overview admin-panel" aria-label="סקירה">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">התוכנית שלכם</p>
          <h2>מה צריך לעשות היום?</h2>
        </div>
        <span className="admin-connection">
          {health
            ? health.backend === "neon"
              ? "Neon · מחובר"
              : "מחובר"
            : error
              ? "החיבור לא זמין"
              : "בודקים חיבור…"}
        </span>
      </div>
      {error && (
        <div className="notice error" role="alert">
          לא הצלחנו לטעון את הסקירה. אפשר לפתוח את כלי הניהול או{" "}
          <button
            className="text-button"
            onClick={() => setAttempt(attempt + 1)}
          >
            לנסות שוב
          </button>
          .
        </div>
      )}
      <div className="admin-metrics" aria-busy={!health && !error}>
        {metrics.map(([table, label, tab]) => (
          <button key={table} onClick={() => onOpen(tab)}>
            <strong>
              {health
                ? (tables.find((item) => item.name === table)?.rows ?? 0)
                : "…"}
            </strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="admin-shortcuts">
        {shortcuts.map(([tab, note, path]) => (
          <button key={tab} onClick={() => onOpen(tab)}>
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d={path} />
            </svg>
            <span>
              <b>{tab}</b>
              <small>{note}</small>
            </span>
            <span aria-hidden="true">←</span>
          </button>
        ))}
      </div>
      <div className="admin-tools">
        <a href="/studio">סטודיו התוכן</a>
        <a href="/management#reg">הרשמת ישיבה</a>
      </div>
    </section>
  );
}
