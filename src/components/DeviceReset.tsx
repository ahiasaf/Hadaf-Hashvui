import { useEffect, useState } from "react";
import {
  deviceState,
  resetDevice,
  setTester,
  type DeviceState,
} from "../lib/device-reset";

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

function describe(state: DeviceState, copy: ResetCopy) {
  const bits = [];
  if (state.admin) bits.push(copy.rstAdm);
  if (state.name) bits.push(copy.rstMe.replace("{name}", state.name));
  if (state.head) bits.push(copy.rstHead);
  if (state.tester) bits.push(copy.rstTestOn);
  return bits.length ? bits.join(" · ") : copy.rstNone;
}

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
    setPhase(problems.length ? "idle" : "done");
  }
  function toggleTester() {
    if (!state) return;
    setTester(!state.tester);
    setState(deviceState());
  }
  if (!state) return <section className="workspace narrow" aria-busy="true" />;
  return (
    <section className="workspace narrow">
      <div className="page-intro">
        <h1>{copy.rstT}</h1>
        <p>{copy.rstB}</p>
      </div>
      <p className="notice">
        {copy.rstNow} {describe(state, copy)}
      </p>
      {phase === "done" ? (
        <div className="swap">
          <p className="notice success" role="status">
            {copy.rstDone}
          </p>
          <p>{copy.rstNext}</p>
        </div>
      ) : (
        <form
          className="flow-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (phase === "confirm") void run();
            else setPhase("confirm");
          }}
        >
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
          <label className="choice">
            <input
              type="checkbox"
              style={{ width: 20, minHeight: 20 }}
              checked={keepTester}
              disabled={phase === "busy"}
              onChange={(event) => setKeepTester(event.target.checked)}
            />
            <span>{copy.rstTest}</span>
          </label>
          {phase === "confirm" ? (
            <div className="swap">
              <p className="notice" role="status">
                {copy.rstAsk}
              </p>
              <button className="button button-blue" type="submit" autoFocus>
                {copy.rstGo}
              </button>
              <button
                className="button button-outline"
                type="button"
                onClick={() => setPhase("idle")}
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              className="button button-blue"
              type="submit"
              disabled={phase === "busy"}
            >
              {phase === "busy"
                ? copy.rstBusy
                : failed.length
                  ? "ניסיון נוסף"
                  : copy.rstGo}
            </button>
          )}
        </form>
      )}
      <button
        className="text-button"
        type="button"
        disabled={phase === "busy"}
        onClick={toggleTester}
      >
        {state.tester ? copy.rstUnmark : copy.rstMark}
      </button>
    </section>
  );
}
