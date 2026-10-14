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
      <Install guided onComplete={complete} />
    </div>
  );
}
