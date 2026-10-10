import { useEffect, useState } from "react";
import {
  deviceState,
  resetDevice,
  setTester,
  type DeviceState,
} from "../lib/device-reset";
import Stepper from "./Stepper";

export const resetKeys = [
  "rstT",
  "rstB",
  "rstNow",
  "rstNone",
  "rstAdm",
  "rstMe",
  "rstHead",
  "rstTestOn",
  "rstAdmWarn",
  "rstTest",
  "rstGo",
  "rstAsk",
  "rstBusy",
  "rstDone",
  "rstNext",
  "rstMark",
  "rstUnmark",
] as const;
export type ResetCopy = Record<(typeof resetKeys)[number], string>;

type Phase = "idle" | "confirm" | "busy" | "done";
const labels = ["המכשיר", "אישור", "סיום"];

function describe(state: DeviceState, copy: ResetCopy) {
  const bits = [];
  if (state.admin) bits.push(copy.rstAdm);
  if (state.name) bits.push(copy.rstMe.replace("{name}", state.name));
  if (state.head) bits.push(copy.rstHead);
  if (state.tester) bits.push(copy.rstTestOn);
  return bits.length ? bits.join(" · ") : copy.rstNone;
}

// Three screens: what the device holds, one confirmation, done.
export default function DeviceReset({ copy }: { copy: ResetCopy }) {
  const [state, setState] = useState<DeviceState | null>(null);
  const [keepTester, setKeepTester] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => {
    const current = deviceState();
    setState(current);
    setKeepTester(!(current.admin && !current.tester));
  }, []);
  async function run() {
    setPhase("busy");
    const problems = await resetDevice(keepTester);
    setFailed(problems);
    setState(deviceState());
    setPhase(problems.length ? "confirm" : "done");
  }
  function toggleTester() {
    if (!state) return;
    setTester(!state.tester);
    setState(deviceState());
  }
  if (!state) return <section className="workspace narrow" aria-busy="true" />;
  if (phase === "done")
    return (
      <section className="workspace narrow celebrate" role="status">
        <span className="done-mark" aria-hidden="true">
          ✓
        </span>
        <h1>{copy.rstDone}</h1>
        <p>{copy.rstNext}</p>
        <a className="button button-gold" href="/join">
          הרשמה מחדש
        </a>
        <a className="secondary-link" href="/">
          לדף הבית
        </a>
      </section>
    );
  const step = phase === "idle" ? 1 : 2;
  return (
    <section className="workspace narrow">
      <Stepper
        step={step}
        labels={labels}
        title={step === 1 ? copy.rstT : copy.rstAsk}
        lead={step === 1 ? copy.rstB : undefined}
        onBack={step === 2 ? () => setPhase("idle") : undefined}
      >
        <form
          className="flow-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (phase === "confirm") void run();
            else setPhase("confirm");
          }}
        >
          <p className="notice">
            {copy.rstNow} {describe(state, copy)}
          </p>
          {step === 1 && (
            <>
              <label className="choice">
                <input
                  type="checkbox"
                  style={{ width: 20, minHeight: 20 }}
                  checked={keepTester}
                  onChange={(event) => setKeepTester(event.target.checked)}
                />
                <span>{copy.rstTest}</span>
              </label>
              <button className="button button-blue" type="submit">
                {copy.rstGo}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={toggleTester}
              >
                {state.tester ? copy.rstUnmark : copy.rstMark}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              {state.admin && (
                <p className="notice error" role="alert">
                  {copy.rstAdmWarn}
                </p>
              )}
              {failed.length > 0 && (
                <p className="notice error" role="alert">
                  הניקוי לא הושלם. נכשל: {failed.join(", ")}. אפשר לנסות שוב.
                </p>
              )}
              <button
                className={
                  "button button-blue" + (phase === "busy" ? " is-busy" : "")
                }
                type="submit"
                disabled={phase === "busy"}
                autoFocus
              >
                {phase === "busy"
                  ? copy.rstBusy
                  : failed.length
                    ? "ניסיון נוסף"
                    : copy.rstGo}
              </button>
            </>
          )}
        </form>
      </Stepper>
    </section>
  );
}
