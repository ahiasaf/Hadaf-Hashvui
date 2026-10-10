import { useEffect, useRef, type ReactNode } from "react";
// One screen per step: a filling state bar, dots with labels, a live announcement
// and focus on the step heading so keyboard and screen reader users follow along.
export default function Stepper({
  step,
  labels,
  title,
  lead,
  onBack,
  children,
  compact,
}: {
  step: number;
  labels: string[];
  title: string;
  lead?: string;
  onBack?: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(step);
  const direction = step < previous.current ? "is-back" : "";
  useEffect(() => {
    if (previous.current !== step) heading.current?.focus();
    previous.current = step;
  }, [step]);
  const total = labels.length;
  return (
    <div className={"flow" + (compact ? " flow-compact" : "")}>
      <div className="flow-bar">
        {onBack ? (
          <button
            type="button"
            className="flow-back"
            onClick={onBack}
            aria-label="חזרה לשלב הקודם"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            חזרה
          </button>
        ) : (
          <span />
        )}
        <p className="flow-count" aria-live="polite">
          שלב {step} מתוך {total}
        </p>
      </div>
      <div
        className="flow-track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label="התקדמות"
      >
        <i style={{ "--p": step / total } as React.CSSProperties} />
      </div>
      <ol className="flow-dots" aria-hidden="true">
        {labels.map((label, index) => (
          <li
            key={label}
            className={
              index + 1 < step ? "is-done" : index + 1 === step ? "is-now" : ""
            }
          >
            <i />
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <div className={"flow-step " + direction} key={step}>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {lead && <p className="flow-lead">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
