import { useEffect, useState, type SubmitEvent } from "react";
import {
  driveFileId,
  driveImageForms,
  type DriveImageForm,
} from "../lib/share-links";

type Result =
  | { state: "pending" }
  | { state: "ok"; url: string }
  | { state: "failed"; reason: string };

const timeoutMs = 30000;

// Each URL form loads as a real image; a tiny or missing picture counts as a failure.
function probe(form: DriveImageForm, signal: AbortSignal) {
  return new Promise<Result>((resolve) => {
    const image = new Image();
    const timer = setTimeout(
      () => resolve({ state: "failed", reason: "לא ענה" }),
      timeoutMs,
    );
    const finish = (result: Result) => {
      clearTimeout(timer);
      resolve(result);
    };
    signal.addEventListener("abort", () =>
      finish({ state: "failed", reason: "בוטל" }),
    );
    image.onload = () =>
      finish(
        image.naturalWidth < 20 || image.naturalHeight < 20
          ? { state: "failed", reason: "תמונה ריקה" }
          : { state: "ok", url: form.url },
      );
    image.onerror = () => finish({ state: "failed", reason: "נכשל" });
    image.src = form.url;
  });
}

export default function SlidePreview({ defaultId }: { defaultId: string }) {
  const [input, setInput] = useState(defaultId);
  const [id, setId] = useState(defaultId);
  const [results, setResults] = useState<Result[]>([]);
  const forms = driveImageForms(id);
  useEffect(() => {
    const controller = new AbortController();
    const list = driveImageForms(id);
    setResults(list.map(() => ({ state: "pending" })));
    list.forEach((form, index) =>
      probe(form, controller.signal).then((result) => {
        if (controller.signal.aborted) return;
        setResults((current) =>
          current.map((item, at) => (at === index ? result : item)),
        );
      }),
    );
    return () => controller.abort();
  }, [id]);
  function run(event: SubmitEvent) {
    event.preventDefault();
    const next = driveFileId(input);
    if (!next) return;
    setInput(next);
    setId(next);
  }
  const done =
    results.length > 0 && results.every((r) => r.state !== "pending");
  const working = forms.filter((_, index) => results[index]?.state === "ok");
  return (
    <section className="workspace narrow slide-preview">
      <div className="page-intro">
        <p className="eyebrow">בדיקה טכנית</p>
        <h1>האם שקף מדרייב נטען אצל תלמיד?</h1>
        <p>
          העמוד הזה יושב באתר שלנו, ולכן מה שנטען כאן ייטען גם במסך הלימוד.{" "}
          <b>בדקו על קובץ JPG</b>, מסמך אינו בדיקה נכונה.
        </p>
      </div>
      <p
        className={
          "notice verdict " +
          (!done ? "" : working.length ? "success" : "error")
        }
        role="status"
        aria-live="polite"
      >
        <span className="eyebrow">התוצאה</span>
        <strong>
          {!done
            ? "בודקים…"
            : working.length
              ? "עובד: " + working.map((form) => form.name).join(" · ")
              : "אף אחת מהשלוש לא נטענה"}
        </strong>
      </p>
      <ul className="probe-list">
        {forms.map((form, index) => {
          const result = results[index] || { state: "pending" };
          return (
            <li className="probe" key={form.url}>
              <div className="probe-head">
                <strong>{form.name}</strong>
                <span className={"chip is-" + result.state}>
                  {result.state === "pending"
                    ? "בודקים…"
                    : result.state === "ok"
                      ? "נטען"
                      : result.reason}
                </span>
              </div>
              <code dir="ltr">{form.url}</code>
              <div className="probe-shot">
                {result.state === "ok" ? (
                  <img src={result.url} alt={"התוצאה של " + form.name} />
                ) : (
                  <span className="form-hint">
                    {result.state === "pending" ? "טוענים…" : "התמונה לא הוצגה"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <form className="flow-form" onSubmit={run}>
        <label>
          קישור לקובץ בדרייב, או המזהה שלו
          <input
            type="text"
            dir="ltr"
            value={input}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <button className="button button-blue" type="submit">
          בדיקה
        </button>
      </form>
      <div className="surface">
        <h2>כדי שהבדיקה תהיה אמיתית</h2>
        <ol className="checklist">
          <li>
            העלו לדרייב <b>שקף אחד כ-JPG</b>, לא מסמך, ורצוי <b>קטן מ-2 מגה</b>.
            קובץ כבד ייכשל על פסק הזמן ולא על דרייב.
          </li>
          <li>
            חכו <b>כמה דקות</b> אחרי ההעלאה. גוגל מייצרת את התצוגה המקדימה ברקע,
            ולקובץ טרי היא עוד לא קיימת.
          </li>
          <li>
            שיתוף, גישה כללית, <b>כל מי שיש לו הקישור</b>.
          </li>
          <li>
            פתחו את העמוד הזה <b>בגלישה בסתר</b>. שם אינכם מחוברים, וזה בדיוק
            המצב של תלמיד.
          </li>
        </ol>
      </div>
    </section>
  );
}
