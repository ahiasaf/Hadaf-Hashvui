import { useEffect, useState } from "react";
import type { RetiredCopy } from "../lib/share-links";
import { CopyEditor, useCopy } from "./ShareLinks";

export const notificationKeys = [
  "hitT",
  "hitB",
  "hitDroid",
  "hitIos",
  "hitA1",
  "hitA2",
  "hitA3",
  "hitA4",
  "hitI1",
  "hitI2",
  "hitI3",
  "hitI4",
  "hitTestH",
  "hitTestB",
  "hitTestGo",
  "hitTestOk",
  "hitTestNo",
] as const;
export type NotificationCopy = Record<
  (typeof notificationKeys)[number],
  string
>;

type Os = "android" | "ios";

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// A notification shown through the worker, the only form that works once installed.
async function showTestNotification(title: string, body: string) {
  if (!("serviceWorker" in navigator) || !("Notification" in window))
    throw new Error("Unsupported notifications");
  if (Notification.permission !== "granted")
    throw new Error("Notifications not granted");
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "df-demo",
  });
}

function Illustration({
  os,
  step,
  logo,
  appName,
}: {
  os: Os;
  step: number;
  logo: string;
  appName: string;
}) {
  const icon = (
    <span className="phone-icon">
      <img src={logo} alt="" width="32" height="32" />
    </span>
  );
  const toggle = (
    <div className="phone-row is-target">
      <span>אפשר התראות</span>
      <span className="phone-toggle" aria-hidden="true" />
    </div>
  );
  if (os === "android") {
    if (step === 1)
      return (
        <div className="phone-screen is-centered">
          {icon}
          <span>{appName}</span>
          <span className="phone-hint">👆 ···</span>
        </div>
      );
    if (step === 2)
      return (
        <div className="phone-screen">
          <div className="phone-popup">
            <span>{appName}</span>
            <span className="phone-info">i</span>
          </div>
          {icon}
        </div>
      );
    if (step === 3)
      return (
        <div className="phone-screen">
          <div className="phone-row is-target">
            <span>
              התראות
              <small>חסום</small>
            </span>
          </div>
          <div className="phone-row">הרשאות</div>
          <div className="phone-row">אחסון</div>
        </div>
      );
    return <div className="phone-screen">{toggle}</div>;
  }
  if (step === 1)
    return (
      <div className="phone-screen is-centered">
        <span className="phone-icon is-settings">⚙</span>
        <span>הגדרות</span>
      </div>
    );
  if (step === 2)
    return (
      <div className="phone-screen">
        <div className="phone-row">ספארי</div>
        <div className="phone-row is-target">{appName}</div>
        <div className="phone-row">שעון</div>
      </div>
    );
  if (step === 3)
    return (
      <div className="phone-screen">
        <div className="phone-row is-target">
          <span>התראות</span>
          <span>›</span>
        </div>
      </div>
    );
  return <div className="phone-screen">{toggle}</div>;
}

export default function NotificationCheck({
  copy: base,
  logo,
  appName,
  retired,
}: {
  copy: NotificationCopy;
  logo: string;
  appName: string;
  retired: RetiredCopy;
}) {
  const { copy, editing, edit, changed } = useCopy(base, "ui", retired);
  const [os, setOs] = useState<Os>("android");
  const [test, setTest] = useState<"idle" | "busy" | "ok" | "no">("idle");
  useEffect(() => setOs(isIos() ? "ios" : "android"), []);
  const steps = [1, 2, 3, 4].map(
    (step) =>
      copy[
        `${os === "android" ? "hitA" : "hitI"}${step}` as keyof NotificationCopy
      ],
  );
  async function runTest() {
    setTest("busy");
    try {
      await showTestNotification(appName, copy.hitTestOk);
      setTest("ok");
    } catch {
      setTest("no");
    }
  }
  return (
    <section className="workspace narrow notification-check">
      <div className="page-intro">
        <h1>{copy.hitT}</h1>
        <p>{copy.hitB}</p>
      </div>
      <div className="track-tabs" role="group" aria-label="סוג הטלפון">
        <button
          type="button"
          aria-pressed={os === "android"}
          onClick={() => setOs("android")}
        >
          {copy.hitDroid}
        </button>
        <button
          type="button"
          aria-pressed={os === "ios"}
          onClick={() => setOs("ios")}
        >
          {copy.hitIos}
        </button>
      </div>
      <ol className="phone-steps swap" key={os}>
        {steps.map((text, index) => (
          <li key={index}>
            <span className="step-number">{index + 1}</span>
            <strong>{text}</strong>
            <Illustration
              os={os}
              step={index + 1}
              logo={logo}
              appName={appName}
            />
          </li>
        ))}
      </ol>
      <section className="surface">
        <h2>{copy.hitTestH}</h2>
        <p>{copy.hitTestB}</p>
        <button
          type="button"
          className="button button-blue"
          disabled={test === "busy"}
          onClick={runTest}
        >
          {test === "busy" ? "שולחים…" : copy.hitTestGo}
        </button>
        {test === "ok" && (
          <p className="notice success swap" role="status">
            {copy.hitTestOk}
          </p>
        )}
        {test === "no" && (
          <p className="notice error swap" role="alert">
            {copy.hitTestNo}
          </p>
        )}
      </section>
      {editing && (
        <CopyEditor
          title="עריכת הנוסחים בעמוד"
          copy={copy}
          keys={notificationKeys}
          changed={changed}
          edit={edit}
        />
      )}
    </section>
  );
}
