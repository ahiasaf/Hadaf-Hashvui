import { useEffect, useState } from "react";
import { stored, store, type Person } from "../lib/client";
import { nextStep, readDevice, type InstallStep } from "../lib/install";
import CommunityUpdates from "./CommunityUpdates";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
declare global {
  interface Window {
    __installPrompt?: PromptEvent;
  }
}

function currentStep() {
  let remindersOn = false;
  try {
    const me = stored<Person | null>("me", null);
    remindersOn = !!me && localStorage.getItem("df:noteOn") === me.id;
  } catch {
    /* Storage is optional. */
  }
  const permission =
    "Notification" in window && "PushManager" in window
      ? Notification.permission
      : "unsupported";
  return nextStep(
    readDevice(
      navigator as Navigator & { standalone?: boolean },
      matchMedia("(display-mode: standalone)").matches,
      !!window.__installPrompt,
      permission,
      remindersOn,
      stored("installed", false),
    ),
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 3v12M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8v8M8 12h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Installation is a setup step; reminders remain a separate choice.
export default function Install({
  guided = false,
  onComplete,
}: {
  guided?: boolean;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState<InstallStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [awaiting, setAwaiting] = useState(false);
  useEffect(() => {
    const refresh = () => {
      const next = currentStep();
      setStep(next);
      if (guided && (next === "notify" || next === "done")) onComplete?.();
    };
    refresh();
    addEventListener("df-install-ready", refresh);
    const installed = () => {
      store("installed", true);
      setAwaiting(false);
      setMessage("");
      refresh();
    };
    const mode = matchMedia("(display-mode: standalone)");
    mode.addEventListener("change", refresh);
    addEventListener("pageshow", refresh);
    addEventListener("appinstalled", installed);
    return () => {
      removeEventListener("df-install-ready", refresh);
      removeEventListener("appinstalled", installed);
      removeEventListener("pageshow", refresh);
      mode.removeEventListener("change", refresh);
    };
  }, [guided, onComplete]);
  async function install() {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    setBusy(true);
    setAwaiting(false);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted" && !stored("installed", false)) {
        setAwaiting(true);
        setMessage("מסיימים את ההתקנה. לאחר מכן פותחים מהסמל במסך הבית.");
      }
    } catch {
      setMessage("ההתקנה לא הסתיימה. אפשר להתקין גם מתפריט הדפדפן.");
    } finally {
      if (window.__installPrompt === prompt) window.__installPrompt = undefined;
      setStep(currentStep());
      setBusy(false);
    }
  }
  if (!step) return null;
  if (step === "notify" || step === "done")
    return guided ? null : <CommunityUpdates />;
  const Title = guided ? "h1" : "p";
  return (
    <div
      className={
        "install swap" +
        (guided ? " install-guided" : "") +
        (step === "open-app" ? " install-launch" : "")
      }
      key={step + (awaiting ? "-finishing" : "")}
    >
      {guided && (
        <div className="install-stage">
          <span>✓ הפרטים נשמרו</span>
          <span>2 מתוך 3</span>
        </div>
      )}
      {step === "open-app" && (
        <div className="install-launch-icon" aria-hidden="true">
          <svg
            viewBox="0 0 32 32"
            width="36"
            height="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="8" y="3" width="16" height="26" rx="4" />
            <path d="m12 14 3 3 6-6M14 25h4" />
          </svg>
        </div>
      )}
      <Title className="install-title">
        {step === "open-app"
          ? "פותחים ומתחילים"
          : step === "open-browser"
            ? "פותחים בדפדפן"
            : "הדף על מסך הבית"}
      </Title>
      {step === "open-app" && (
        <div className="install-reopen" role="status">
          <p className="install-text">
            הסמל נוסף למסך הבית. עכשיו פותחים ממנו את הדף השבועי.
          </p>
          <ol className="install-handoff">
            <li>
              <span className="install-handoff-number">1</span>
              <div>
                <b>סוגרים את הכרטיסייה</b>
                <small>כרגע אתם עדיין בדפדפן</small>
              </div>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </li>
            <li>
              <span className="install-handoff-number">2</span>
              <div>
                <b>פותחים ממסך הבית</b>
                <small>לוחצים על הסמל של הדף השבועי</small>
              </div>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" />
              </svg>
            </li>
          </ol>
          <p className="install-handoff-note">הדף שבחרתם ייפתח אוטומטית.</p>
          <button
            className="install-retry"
            type="button"
            onClick={() => {
              store("installed", false);
              setStep(currentStep());
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
            </svg>
            לא מוצאים את הסמל? הוראות התקנה
          </button>
        </div>
      )}
      {step === "install-prompt" && (
        <>
          <p className="install-text">לחיצה אחת, והדף תמיד במרחק הקשה.</p>
          <button
            className={"button button-blue" + (busy ? " is-busy" : "")}
            type="button"
            disabled={busy}
            onClick={install}
          >
            {busy ? "פותחים את ההתקנה…" : "התקנה במסך הבית"}
          </button>
        </>
      )}
      {step === "install-browser" && !awaiting && (
        <p className="install-text">
          בתפריט הדפדפן בוחרים <b>התקנת האפליקציה</b> או <b>הוספה למסך הבית</b>,
          ואז פותחים את הדף מהסמל החדש.
        </p>
      )}
      {message && (
        <p className="install-text" role="status">
          {message}
        </p>
      )}
      {step === "install-ios" && (
        <ol className="install-steps">
          <li>
            <ShareIcon />
            <span>
              לוחצים על <b>שיתוף</b> בסרגל הדפדפן
            </span>
          </li>
          <li>
            <PlusIcon />
            <span>
              בוחרים <b>הוספה למסך הבית</b>
            </span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM10 11l4 2-4 2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              פותחים את הדף מהסמל החדש <b>במסך הבית</b>
            </span>
          </li>
        </ol>
      )}
      {(step === "install-ios" || step === "install-browser") && !awaiting && (
        <button
          className="button button-blue"
          type="button"
          onClick={() => {
            store("installed", true);
            setStep(currentStep());
          }}
        >
          הוספתי למסך הבית
        </button>
      )}
      {step === "open-browser" && (
        <p className="install-text">
          לצורך ההתקנה פותחים את הקישור ב־Chrome או ב־Safari. מתוך אפליקציה
          אחרת, בוחרים בתפריט "פתיחה בדפדפן".
        </p>
      )}
    </div>
  );
}
