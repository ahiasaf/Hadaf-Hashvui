import { useCallback, useEffect, useState } from "react";
import {
  loadTeam,
  logTeamAction,
  phoneDigits,
  saveMember,
  savedMember,
  teamMembers,
  whatsappNumber,
  type TeamAction,
  type TeamCard,
} from "../lib/team";

type Board =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; cards: TeamCard[] };

type LogState = { state: "pending" | "failed"; act: TeamAction };

export default function TeamBoard() {
  const [who, setWho] = useState("");
  const [key, setKey] = useState("");
  const [started, setStarted] = useState(false);
  const [board, setBoard] = useState<Board>({ phase: "loading" });
  // One log entry per contact action; a failed write keeps a retry beside the button.
  const [logs, setLogs] = useState<Record<string, LogState>>({});
  useEffect(() => {
    setWho(savedMember());
    setKey(new URLSearchParams(location.search).get("k") || "");
    setStarted(true);
  }, []);
  const load = useCallback(async () => {
    setBoard({ phase: "loading" });
    try {
      setBoard({ phase: "ready", cards: await loadTeam(key) });
    } catch {
      setBoard({
        phase: "error",
        message:
          "לא הצלחנו לטעון את הלוח. אם הקישור ישן, בקשו קישור חדש; אחרת בדקו את החיבור ונסו שוב.",
      });
    }
  }, [key]);
  useEffect(() => {
    if (started && who && key) void load();
  }, [started, who, key, load]);
  function choose(member: string) {
    saveMember(member);
    setWho(member);
  }
  function log(id: string, institution: string, act: TeamAction) {
    setLogs((current) => ({ ...current, [id]: { state: "pending", act } }));
    logTeamAction(key, who, institution, act).then(
      () =>
        setLogs((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        }),
      () =>
        setLogs((current) => ({ ...current, [id]: { state: "failed", act } })),
    );
  }
  if (!started)
    return <section className="workspace narrow" aria-busy="true" />;
  if (!who)
    return (
      <section className="workspace narrow team-board">
        <div className="page-intro">
          <h1>מי אתם?</h1>
          <p>כדי שאחיאסף ידע מי התקשר למי.</p>
        </div>
        <div className="member-pick" role="group" aria-label="מי אתם">
          {teamMembers.map((member) => (
            <button
              type="button"
              className="button button-outline"
              key={member}
              onClick={() => choose(member)}
            >
              {member}
            </button>
          ))}
        </div>
      </section>
    );
  return (
    <section className="workspace narrow team-board">
      <div className="page-intro">
        <h1>מוקד השיחות</h1>
        <p className="member-line">
          {who} ·{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => choose("")}
          >
            לא אני?
          </button>
        </p>
      </div>
      {!key && (
        <p className="notice error" role="alert">
          הקישור הזה חסר את קוד הגישה.
        </p>
      )}
      {key && board.phase === "loading" && (
        <p className="notice" role="status">
          טוענים את הלוח…
        </p>
      )}
      {key && board.phase === "error" && (
        <div className="notice error" role="alert">
          {board.message}
          <button
            type="button"
            className="button button-outline"
            onClick={load}
          >
            ניסיון נוסף
          </button>
        </div>
      )}
      {board.phase === "ready" && !board.cards.length && (
        <p className="notice">
          אין כרגע שום ישיבה שסומנה להצגה כאן. זה מתעדכן ממוקד השיחות.
        </p>
      )}
      {board.phase === "ready" &&
        board.cards.map((card, index) => (
          <section className="surface team-card" key={index}>
            <h2>{card.name}</h2>
            {card.update && <p className="team-update">{card.update}</p>}
            {card.tags.length > 0 && (
              <ul className="tag-list">
                {card.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
            {!card.people.length && (
              <p className="notice error">אין כאן מספר טלפון</p>
            )}
            {card.people.map((person, at) => {
              const id = index + ":" + at;
              return (
                <div className="contact" key={id}>
                  <strong>{person.name || "חייג"}</strong>
                  <div className="contact-actions">
                    <a
                      className="button button-blue"
                      href={"tel:" + phoneDigits(person.phone)}
                      onClick={() => log(id, card.name, "שיחה")}
                    >
                      📞 שיחה
                    </a>
                    <a
                      className="button button-whatsapp"
                      href={"https://wa.me/" + whatsappNumber(person.phone)}
                      target="_blank"
                      rel="noopener"
                      onClick={() => log(id, card.name, "וואטסאפ")}
                    >
                      וואטסאפ
                    </a>
                  </div>
                  <div className="contact-feedback" aria-live="polite">
                    {logs[id]?.state === "pending" && (
                      <span className="form-hint" role="status">
                        רושמים ביומן…
                      </span>
                    )}
                    {logs[id]?.state === "failed" && (
                      <span className="form-hint log-failed" role="alert">
                        הפעולה לא נרשמה ביומן.{" "}
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => log(id, card.name, logs[id].act)}
                        >
                          רישום חוזר
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
    </section>
  );
}
