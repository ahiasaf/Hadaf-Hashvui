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
  return (
    <div className="install swap" key={step + (awaiting ? "-finishing" : "")}>
      <p className="install-title">
        {step === "install-prompt" ||
        step === "install-ios" ||
        step === "install-browser"
          ? "האפליקציה על מסך הבית"
          : step === "open-app"
            ? "ממשיכים מהאפליקציה"
            : "פותחים בדפדפן"}
      </p>
      {step === "open-app" && (
        <div className="install-reopen" role="status">
          <PlusIcon />
          <h2>הדף מחכה לכם במסך הבית</h2>
          <p className="install-text">
            כרגע אתם עדיין בדפדפן. סגרו את הכרטיסייה הזו, חזרו למסך הבית ופתחו
            את הדף השבועי מהסמל החדש.
          </p>
          <p className="install-text">הלימוד שבחרתם ייפתח באפליקציה.</p>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              store("installed", false);
              setStep(currentStep());
            }}
          >
            לא מוצאים את הסמל? חזרה להוראות ההתקנה
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
