import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Session, UpdateSessionInput, DiceRollResult } from "@rpg/shared";

interface Props {
  session: Session;
  onChange: (updates: UpdateSessionInput) => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const ANIMATION_MS = 600;
const ANIMATION_INTERVAL = 60;
const RESULT_EXPIRE_MS = 10_000;

/* ── helpers to count pros (+1) / cons (-1) ── */

function tallyGlowCons(arr: any[] | undefined): number {
  let t = 0;
  for (const x of arr ?? []) {
    if (x?.isGlowing) t += 1;
    if (x?.isCons) t -= 1;
  }
  return t;
}

function countSceneBonus(session: Session): number {
  let total = 0;
  for (const scene of session.scenes ?? []) {
    for (const item of scene.items ?? []) {
      if (item.sourceType === "character") continue;
      const snap = item.snapshot as Record<string, unknown>;
      total += tallyGlowCons(snap.statuses as any[]);
      total += tallyGlowCons(snap.tags as any[]);
      // moves (threats)
      for (const m of (snap.moves as any[] ?? [])) {
        total += tallyGlowCons(m?.statuses);
        total += tallyGlowCons(m?.tags);
      }
      // boxes (locations) — statuses, tags, and nested npcs
      for (const b of (snap.boxes as any[] ?? [])) {
        total += tallyGlowCons(b?.statuses);
        total += tallyGlowCons(b?.tags);
        for (const n of (b?.npcs ?? [])) {
          total += tallyGlowCons(n?.statuses);
          total += tallyGlowCons(n?.tags);
        }
      }
      // top-level npcs
      for (const n of (snap.npcs as any[] ?? [])) {
        total += tallyGlowCons(n?.statuses);
        total += tallyGlowCons(n?.tags);
      }
    }
  }
  return total;
}

function countCharacterBonus(session: Session): number {
  let total = 0;
  for (const sc of session.characters ?? []) {
    total += tallyGlowCons(sc.sceneStatuses as any[]);
    total += tallyGlowCons(sc.currentStatuses as any[]);
    for (const tc of sc.themeCards ?? []) {
      for (const ab of tc.abilities ?? []) {
        const a = typeof ab === "string" ? null : ab;
        if (a?.isMarked) total += 1;
        if ((a as any)?.isCons) total -= 1;
      }
    }
  }
  return total;
}

/** Count crossed-out abilities across all session characters */
function countScratchBonus(session: Session): number {
  let count = 0;
  for (const sc of session.characters ?? []) {
    for (const tc of sc.themeCards ?? []) {
      for (const ab of tc.abilities ?? []) {
        const a = typeof ab === "string" ? null : ab;
        if (a?.isCrossed) count += 1;
      }
    }
  }
  return count * 3;
}

export default function DiceRoller({ session, onChange }: Props) {
  const [die1, setDie1] = useState(0);
  const [die2, setDie2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expireRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyLenRef = useRef(session.diceHistory?.length ?? 0);

  // Modifier checkboxes (6 green, 6 red) — local to this roll
  const [greenChecks, setGreenChecks] = useState([false, false, false, false, false, false]);
  const [redChecks, setRedChecks] = useState([false, false, false, false, false, false]);

  // Computed bonuses
  const sceneBonus = useMemo(() => countSceneBonus(session), [session]);
  const charBonus = useMemo(() => countCharacterBonus(session), [session]);
  const scratchBonus = useMemo(() => countScratchBonus(session), [session]);
  const greenCount = greenChecks.filter(Boolean).length;
  const redCount = redChecks.filter(Boolean).length;
  const modifierBonus = greenCount - redCount;

  /** Start the 10-second expiry timer for showing result */
  const startExpiry = useCallback(() => {
    if (expireRef.current) clearTimeout(expireRef.current);
    setShowResult(true);
    expireRef.current = setTimeout(() => {
      setShowResult(false);
      expireRef.current = null;
    }, RESULT_EXPIRE_MS);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (expireRef.current) clearTimeout(expireRef.current); }, []);

  // Sync dice faces when diceHistory changes from a remote WebSocket update
  useEffect(() => {
    const len = session.diceHistory?.length ?? 0;
    if (len > historyLenRef.current && !rolling) {
      const last = session.diceHistory[len - 1];
      const finalDie1 = last.die1 - 1;
      const finalDie2 = last.die2 - 1;

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
        startExpiry();
      }, ANIMATION_MS);
    }
    historyLenRef.current = len;
  }, [session.diceHistory, rolling, startExpiry]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);
    setShowResult(false);

    intervalRef.current = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6));
      setDie2(Math.floor(Math.random() * 6));
    }, ANIMATION_INTERVAL);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const final1 = Math.floor(Math.random() * 6);
      const final2 = Math.floor(Math.random() * 6);
      setDie1(final1);
      setDie2(final2);
      setRolling(false);
      startExpiry();

      const result: DiceRollResult = {
        die1: final1 + 1,
        die2: final2 + 1,
        total: final1 + final2 + 2,
        timestamp: Date.now(),
      };

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

  // Final result calculation (only meaningful when showing)
  const d1 = lastRoll?.die1 ?? 0;
  const d2 = lastRoll?.die2 ?? 0;
  const diceTotal = d1 + d2;
  const totalCharBonus = charBonus + scratchBonus;
  const grandTotal = diceTotal + sceneBonus + totalCharBonus + modifierBonus;

  // Critical overrides
  const isCritSuccess = lastRoll ? d1 === 6 && d2 === 6 : false;
  const isCritFail = lastRoll ? d1 === 1 && d2 === 1 : false;

  let tier: "success" | "mixed" | "consequences" | null = null;
  if (showResult && lastRoll && !rolling) {
    if (isCritSuccess || grandTotal >= 10) tier = "success";
    else if (isCritFail || grandTotal <= 6) tier = "consequences";
    else tier = "mixed";
  }

  const toggleGreen = (i: number) =>
    setGreenChecks((g) => {
      const filled = g[i] && g.slice(0, i).every(Boolean);
      return g.map((_, j) => (filled ? j < i : j <= i));
    });
  const toggleRed = (i: number) =>
    setRedChecks((r) => {
      const filled = r[i] && r.slice(0, i).every(Boolean);
      return r.map((_, j) => (filled ? j < i : j <= i));
    });

  /* ── Format a signed bonus for the formula display ── */
  const formatBonus = (val: number) => (val >= 0 ? `+ ${val}` : `- ${Math.abs(val)}`);

  return (
    <div className="section dice-roller">
      <h3 className="section__title">Dice Roller — 2d6</h3>

      <div className="dice-roller__area">
        <div className="dice-roller__dice">
          <span className={`dice-roller__die ${rolling ? "dice-roller__die--rolling" : ""}`}>
            {hasRolled ? DICE_FACES[die1] : "⚀"}
          </span>
          <span className={`dice-roller__die ${rolling ? "dice-roller__die--rolling" : ""}`}>
            {hasRolled ? DICE_FACES[die2] : "⚀"}
          </span>
        </div>
        <button className="dice-roller__throw" onClick={roll} disabled={rolling}>
          {rolling ? "Rolling…" : "🎲 Throw"}
        </button>
      </div>

      {/* Modifier checkboxes */}
      <div className="dice-roller__modifier">
        <span className="dice-roller__modifier-label">Modifier</span>
        <div className="dice-roller__modifier-row">
          {greenChecks.map((v, i) => (
            <button
              key={`g${i}`}
              className={`dice-roller__mod-cb dice-roller__mod-cb--green${v ? " dice-roller__mod-cb--active" : ""}`}
              onClick={() => toggleGreen(i)}
            />
          ))}
        </div>
        <div className="dice-roller__modifier-row">
          {redChecks.map((v, i) => (
            <button
              key={`r${i}`}
              className={`dice-roller__mod-cb dice-roller__mod-cb--red${v ? " dice-roller__mod-cb--active" : ""}`}
              onClick={() => toggleRed(i)}
            />
          ))}
        </div>
      </div>

      {/* Formula display — only while result is visible */}
      {showResult && lastRoll && !rolling && (
        <div className="dice-roller__formula">
          <span className="dice-roller__formula-dice">{d1} + {d2}</span>
          {sceneBonus !== 0 && (
            <span className="dice-roller__formula-scene"> {formatBonus(sceneBonus)}</span>
          )}
          {totalCharBonus !== 0 && (
            <span className="dice-roller__formula-char"> {formatBonus(totalCharBonus)}</span>
          )}
          {modifierBonus !== 0 && (
            <span className="dice-roller__formula-mod"> {formatBonus(modifierBonus)}</span>
          )}
          <span className="dice-roller__formula-eq"> = </span>
          <span className={`dice-roller__formula-total dice-roller__formula-total--${tier}`}>
            {grandTotal}
          </span>
        </div>
      )}

      {/* Result tier — only while result is visible */}
      {tier && (
        <div className={`dice-roller__tier dice-roller__tier--${tier}`}>
          {tier === "success" && (
            <span>⭐ Success!{isCritSuccess ? " (6 & 6 — Critical!)" : ""}</span>
          )}
          {tier === "mixed" && <span>⚠️ Success & Consequences</span>}
          {tier === "consequences" && (
            <span>💀 Consequences{isCritFail ? " (1 & 1 — Critical Fail!)" : ""}</span>
          )}
        </div>
      )}

      {/* Bonus summary */}
      <div className="dice-roller__bonuses">
        <span className="dice-roller__bonus-item dice-roller__bonus-item--scene" title="From scene board (non-character items)">
          Scene: {sceneBonus >= 0 ? "+" : ""}{sceneBonus}
        </span>
        <span className="dice-roller__bonus-item dice-roller__bonus-item--char" title="From session characters (statuses, tags, abilities, scratched)">
          Character: {totalCharBonus >= 0 ? "+" : ""}{totalCharBonus}
        </span>
        <span className="dice-roller__bonus-item dice-roller__bonus-item--mod" title="Green checkboxes - Red checkboxes">
          Modifier: {modifierBonus >= 0 ? "+" : ""}{modifierBonus}
        </span>
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
