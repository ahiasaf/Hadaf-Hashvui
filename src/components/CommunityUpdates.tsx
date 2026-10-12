import { useEffect, useState } from "react";
import { stored, type Person } from "../lib/client";
import {
  communityGroup,
  groupJoined,
  confirmGroup,
  remindersEnabled,
} from "../lib/community";
import Reminders from "./Reminders";
import "../styles/community.css";

export default function CommunityUpdates() {
  const [group, setGroup] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [joined, setJoined] = useState(
    () => typeof window !== "undefined" && groupJoined(),
  );
  const [notified, setNotified] = useState(
    () => typeof window !== "undefined" && remindersEnabled(),
  );
  const [person, setPerson] = useState<Person | null>(null);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    let active = true;
    communityGroup()
      .then((url) => {
        if (active) {
          setGroup(url);
          setJoined(groupJoined(url));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      setPerson(stored<Person | null>("me", null));
      setJoined(groupJoined(group));
      setNotified(remindersEnabled());
    };
    refresh();
    const events = [
      "storage",
      "pageshow",
      "df-account-change",
      "df-community-change",
      "df-reminders-change",
    ];
    events.forEach((event) => window.addEventListener(event, refresh));
    return () =>
      events.forEach((event) => window.removeEventListener(event, refresh));
  }, [group]);
  const visible = [!joined ? 0 : -1, !notified ? 1 : -1].filter(
    (index) => index >= 0,
  );
  if (!visible.length) return null;
  const current = visible.includes(selected) ? selected : visible[0];
  const canEnable =
    !!person?.id &&
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator &&
    Notification.permission !== "denied";
  function keyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    if (event.key === "Home") next = visible[0];
    else if (event.key === "End") next = visible[visible.length - 1];
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const forward =
        event.key ===
        (document.documentElement.dir === "rtl" ? "ArrowLeft" : "ArrowRight");
      const offset = visible.indexOf(index) + (forward ? 1 : -1);
      next = visible[(offset + visible.length) % visible.length];
    } else return;
    event.preventDefault();
    setSelected(next);
    document
      .getElementById(
        next === 0 ? "community-whatsapp-tab" : "community-reminders-tab",
      )
      ?.focus();
  }
  function focusNext() {
    requestAnimationFrame(() => {
      const next =
        document.querySelector<HTMLButtonElement>(
          '.community [role="tab"]:not([hidden])',
        ) ||
        document.querySelector<HTMLAnchorElement>(
          '[data-continue], .celebrate > a[href="/app"]',
        );
      next?.focus();
    });
  }
  return (
    <section
      className="community is-in"
      aria-label="עדכונים מהדף השבועי"
      data-community-tabs
    >
      <div
        className="community-tabs"
        role="tablist"
        aria-label="איך מקבלים עדכונים"
        data-single={visible.length === 1 ? "true" : undefined}
      >
        {["קבוצת הוואטסאפ", "עדכונים ותזכורות"].map((label, index) => (
          <button
            key={label}
            id={
              index === 0 ? "community-whatsapp-tab" : "community-reminders-tab"
            }
            type="button"
            role="tab"
            aria-controls={
              index === 0 ? "community-whatsapp" : "community-reminders"
            }
            aria-selected={current === index}
            tabIndex={current === index ? 0 : -1}
            hidden={!visible.includes(index)}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => keyboard(event, index)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              {index === 0 ? (
                <>
                  <path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5Z" />
                  <path d="M8 9h8M8 13h5" />
                </>
              ) : (
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4M12 2V1" />
              )}
            </svg>
            {label}
          </button>
        ))}
      </div>
      <div
        id="community-whatsapp"
        className="community-panel"
        role="tabpanel"
        aria-labelledby="community-whatsapp-tab"
        tabIndex={0}
        hidden={current !== 0}
      >
        <div>
          <p className="community-kicker">הדף של השבוע, ישר לוואטסאפ</p>
          <h2>נשארים בעניינים</h2>
          <p>עדכוני התוכנית והשאלון השבועי בקבוצה השקטה של הדף השבועי.</p>
        </div>
        <div className="community-action">
          <a
            className="button button-whatsapp"
            data-community
            href={group || undefined}
            hidden={!group}
            target="_blank"
            rel="noopener"
          >
            מצטרפים לקבוצה <span aria-hidden="true">↗</span>
          </a>
          {group && (
            <button
              type="button"
              className="community-confirm"
              onClick={() => {
                confirmGroup(group);
                setJoined(true);
                focusNext();
              }}
            >
              כבר בקבוצה
            </button>
          )}
          {!group && (
            <p role="status">
              {loaded
                ? "קישור הקבוצה אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר."
                : "טוענים את קישור הקבוצה…"}
            </p>
          )}
        </div>
      </div>
      <div
        id="community-reminders"
        className="community-panel"
        role="tabpanel"
        aria-labelledby="community-reminders-tab"
        tabIndex={0}
        hidden={current !== 1}
      >
        <div>
          <p className="community-kicker">התזכורת שלכם ללימוד</p>
          <h2>זוכרים לפתוח את הדף</h2>
          <p>מפעילים התראות במכשיר כדי לקבל עדכון כשהדף נפתח.</p>
        </div>
        <div className="community-action">
          {canEnable && (
            <Reminders
              key={person!.id}
              onEnabled={() => {
                if (stored<Person | null>("me", null)?.id === person!.id) {
                  setNotified(true);
                  focusNext();
                }
              }}
            />
          )}
          <a
            className={canEnable ? "community-help" : "button button-gold"}
            href="/hitraot"
          >
            {canEnable ? "עזרה בהפעלת ההתראות" : "הגדרת התראות"}
          </a>
        </div>
      </div>
    </section>
  );
}
