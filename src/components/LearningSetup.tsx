import { useCallback, useEffect, useState } from "react";
import { stored, store, type Person } from "../lib/client";
import { setupNext, readDevice } from "../lib/install";
import Install from "./Install";

export default function LearningSetup({ person }: { person?: Person }) {
  const [ready, setReady] = useState(false);
  const [next, setNext] = useState("/app");
  useEffect(() => {
    const target = setupNext(
      new URLSearchParams(location.search).get("next") ||
        stored("setupNext", "/app"),
    );
    setNext(target);
    const me = person || stored<Person | null>("me", null);
    if (!me?.id) {
      location.replace("/join?next=" + encodeURIComponent(target));
      return;
    }
    const device = readDevice(navigator, false, false, "unsupported", false);
    if (!device.mobile) {
      location.replace(target);
      return;
    }
    store("setupNext", target);
    setReady(true);
  }, [person]);
  const complete = useCallback(() => {
    try {
      localStorage.removeItem("df:setupNext");
    } catch {
      /* Storage is optional. */
    }
    location.replace(next);
  }, [next]);
  if (!ready) return <p role="status">פותחים את הלימוד…</p>;
  return (
    <div className="learning-setup swap" data-update-draft>
      <ol className="setup-progress" aria-label="שלבי תחילת הלימוד">
        <li className="is-done">
          <span aria-hidden="true">✓</span>פרטים
        </li>
        <li aria-current="step">
          <span aria-hidden="true">2</span>התקנה
        </li>
        <li>
          <span aria-hidden="true">3</span>לימוד
        </li>
      </ol>
      <h1>מכינים את הדף ללימוד</h1>
      <p>הפרטים נשמרו. עכשיו מוסיפים את הדף למסך הבית, ומשם מתחילים.</p>
      {ready ? (
        <Install guided onComplete={complete} />
      ) : (
        <p role="status">מכינים את ההמשך…</p>
      )}
    </div>
  );
}
