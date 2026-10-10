import { useEffect, useState } from "react";
import { stored, type Person } from "../lib/client";
import { nextStep, readDevice, type InstallStep } from "../lib/install";
import Reminders from "./Reminders";

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

// The app on the home screen, then reminders: one short step at a time, skipping what is done.
export default function Install() {
  const [step, setStep] = useState<InstallStep | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => setStep(currentStep());
    refresh();
    addEventListener("df-install-ready", refresh);
    addEventListener("appinstalled", refresh);
    return () => {
      removeEventListener("df-install-ready", refresh);
      removeEventListener("appinstalled", refresh);
    };
  }, []);
  async function install() {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        window.__installPrompt = undefined;
        setStep("notify");
      }
    } catch {
      /* The browser closed the prompt; the button stays available. */
    } finally {
      setBusy(false);
    }
  }
  if (!step || step === "done") return null;
  if (step === "notify")
    return (
      <div className="install swap">
        <p className="install-title">תזכורת קטנה בכל שבוע?</p>
        <p className="install-text">
          הודעה אחת כשהדף החדש נפתח. אפשר לבטל בכל רגע.
        </p>
        <Reminders />
      </div>
    );
  return (
    <div className="install swap">
      <p className="install-title">
        {step === "install-prompt" || step === "install-ios"
          ? "האפליקציה על מסך הבית"
          : "פותחים בדפדפן"}
      </p>
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
      {step === "install-ios" && (
        <ol className="install-steps">
          <li>
            <ShareIcon />
            <span>
              לוחצים על <b>שיתוף</b> בסרגל של ספארי
            </span>
          </li>
          <li>
            <PlusIcon />
            <span>
              בוחרים <b>הוספה למסך הבית</b>
            </span>
          </li>
        </ol>
      )}
      {step === "open-safari" && (
        <p className="install-text">
          באייפון ההתקנה אפשרית רק מספארי. פתחו את הכתובת הזו בספארי, ומשם שתי
          לחיצות.
        </p>
      )}
      {step === "open-browser" && (
        <p className="install-text">
          הקישור נפתח בתוך אפליקציה אחרת. לחצו על התפריט ובחרו "פתיחה בדפדפן",
          ומשם ההתקנה קצרה.
        </p>
      )}
    </div>
  );
}
