import { useState, useRef, useEffect } from "react";
import { Session, UpdateSessionInput, DiceRollResult } from "@rpg/shared";

interface Props {
  session: Session;
  onChange: (updates: UpdateSessionInput) => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const ANIMATION_MS = 600;
const ANIMATION_INTERVAL = 60;

export default function DiceRoller({ session, onChange }: Props) {
  const [die1, setDie1] = useState(0);
  const [die2, setDie2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyLenRef = useRef(session.diceHistory?.length ?? 0);

  // Sync dice faces when diceHistory changes from a remote WebSocket update
  useEffect(() => {
    const len = session.diceHistory?.length ?? 0;
    if (len > historyLenRef.current && !rolling) {
      const last = session.diceHistory[len - 1];
      const finalDie1 = last.die1 - 1;
      const finalDie2 = last.die2 - 1;

      // Play animation for remote rolls too
      setRolling(true);
      setHasRolled(true);
      const anim = setInterval(() => {
        setDie1(Math.floor(Math.random() * 6));
        setDie2(Math.floor(Math.random() * 6));
      }, ANIMATION_INTERVAL);

      setTimeout(() => {
        clearInterval(anim);
        setDie1(finalDie1);
        setDie2(finalDie2);
        setRolling(false);
      }, ANIMATION_MS);
    }
    historyLenRef.current = len;
  }, [session.diceHistory, rolling]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);

    // Animate random faces
    intervalRef.current = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6));
      setDie2(Math.floor(Math.random() * 6));
    }, ANIMATION_INTERVAL);

    // Stop and set final result
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const final1 = Math.floor(Math.random() * 6);
      const final2 = Math.floor(Math.random() * 6);
      setDie1(final1);
      setDie2(final2);
      setRolling(false);

      const result: DiceRollResult = {
        die1: final1 + 1,
        die2: final2 + 1,
        total: final1 + final2 + 2,
        timestamp: Date.now(),
      };

      // Advance the ref BEFORE calling onChange so the diceHistory useEffect
      // doesn't mistake this local roll for a remote one and re-animate.
      historyLenRef.current = (session.diceHistory?.length ?? 0) + 1;

      onChange({
        diceHistory: [...(session.diceHistory || []), result],
      });
    }, ANIMATION_MS);
  };

  const lastRoll =
    session.diceHistory && session.diceHistory.length > 0
      ? session.diceHistory[session.diceHistory.length - 1]
      : null;

  return (
    <div className="section dice-roller">
      <h3 className="section__title">Dice Roller — 2d6</h3>
      <div className="dice-roller__area">
        <div className="dice-roller__dice">
          <span
            className={`dice-roller__die ${rolling ? "dice-roller__die--rolling" : ""}`}
          >
            {hasRolled ? DICE_FACES[die1] : "⚀"}
          </span>
          <span
            className={`dice-roller__die ${rolling ? "dice-roller__die--rolling" : ""}`}
          >
            {hasRolled ? DICE_FACES[die2] : "⚀"}
          </span>
        </div>
        <button
          className="dice-roller__throw"
          onClick={roll}
          disabled={rolling}
        >
          {rolling ? "Rolling…" : "🎲 Throw"}
        </button>
        {lastRoll && !rolling && (
          <div className="dice-roller__result">
            <strong>
              {lastRoll.die1} + {lastRoll.die2} = {lastRoll.total}
            </strong>
          </div>
        )}
      </div>

      {/* History (last 5) */}
      {session.diceHistory && session.diceHistory.length > 0 && (
        <div className="dice-roller__history">
          <span className="dice-roller__history-label">History:</span>
          {session.diceHistory
            .slice(-5)
            .reverse()
            .map((r, i) => (
              <span key={i} className="dice-roller__history-item">
                {r.total}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
