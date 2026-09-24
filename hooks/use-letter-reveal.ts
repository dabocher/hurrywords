import { useState, useEffect, useCallback, useRef } from "react";

export type RevealPhase =
  | "hidden"
  | "countdown"
  | "revealing"
  | "all-visible"
  | "disappearing";

const COUNTDOWN_DURATION = 5;
const REVEAL_INTERVAL = 5;
const DISAPPEAR_INTERVAL = 5;
const DISAPPEAR_TRIGGER_REMAINING = 30;
const TOTAL_OUTER = 6;
const COUNTDOWN_REVEAL_COUNT = 3;

const shuffleIndices = (): number[] => {
  const indices = [0, 1, 2, 3, 4, 5];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

const computeProgressiveRevealCount = (elapsedMs: number): number => {
  const reveals = Math.floor(elapsedMs / (REVEAL_INTERVAL * 1000));
  return Math.min(reveals, TOTAL_OUTER - COUNTDOWN_REVEAL_COUNT);
};

const computeDisappearCount = (elapsedMs: number): number => {
  const hides = Math.floor(elapsedMs / (DISAPPEAR_INTERVAL * 1000));
  return Math.min(hides, TOTAL_OUTER);
};

const computeVisibleFromSchedule = (
  letterOrder: number[],
  revealCount: number,
  disappearCount: number,
): number[] => {
  const revealed = new Set<number>();
  for (let i = 0; i < revealCount; i++) {
    revealed.add(letterOrder[i]);
  }
  const hidden = new Set<number>();
  for (let i = 0; i < disappearCount; i++) {
    hidden.add(letterOrder[i]);
  }
  const visible: number[] = [];
  for (let i = 0; i < revealCount; i++) {
    const idx = letterOrder[i];
    if (!hidden.has(idx)) {
      visible.push(idx);
    }
  }
  return visible;
};

export interface UseLetterRevealReturn {
  phase: RevealPhase;
  visibleExteriorIndices: number[];
  countdownSeconds: number;
  gameStarted: boolean;
  onStart: () => void;
  triggerDisappear: (timerRemaining: number) => void;
}

export const useLetterReveal = (): UseLetterRevealReturn => {
  const [phase, setPhase] = useState<RevealPhase>("hidden");
  const [visibleExteriorIndices, setVisibleExteriorIndices] = useState<number[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const letterOrder = useRef(shuffleIndices());
  const elapsedSinceRevealRef = useRef(0);
  const elapsedSinceDisappearRef = useRef(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountdownRevealRef = useRef(-1);
  const hasTriggeredDisappearRef = useRef(false);

  const clearAllIntervals = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
  }, []);

  const onStart = useCallback(() => {
    clearAllIntervals();
    letterOrder.current = shuffleIndices();
    elapsedSinceRevealRef.current = 0;
    elapsedSinceDisappearRef.current = 0;
    lastCountdownRevealRef.current = -1;
    setVisibleExteriorIndices([]);
    setCountdownSeconds(COUNTDOWN_DURATION);
    setGameStarted(false);
    setPhase("countdown");

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const next = prev - 1;

        // Revelados en countdown: 4s, 2s, 0s
        if (next === 4 || next === 2 || next === 0) {
          const revealCount = COUNTDOWN_REVEAL_COUNT - (next === 0 ? 0 : next === 2 ? 1 : 2);
          const actualRevealCount = next === 4 ? 1 : next === 2 ? 2 : 3;
          lastCountdownRevealRef.current = actualRevealCount;

          setVisibleExteriorIndices((current) => {
            const disappearCount = computeDisappearCount(elapsedSinceDisappearRef.current);
            return computeVisibleFromSchedule(
              letterOrder.current,
              actualRevealCount,
              disappearCount,
            );
          });
        }

        if (next <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setPhase("revealing");
          setGameStarted(true);
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearAllIntervals]);

  // Revelado progresivo y desaparición
  useEffect(() => {
    if (!gameStarted && phase !== "disappearing") return;

    const interval = setInterval(() => {
      if (gameStarted) {
        elapsedSinceRevealRef.current += REVEAL_INTERVAL * 1000;
      }
      if (phase === "disappearing" && !hasTriggeredDisappearRef.current) {
        elapsedSinceDisappearRef.current += DISAPPEAR_INTERVAL * 1000;
      }

      const revealCount = Math.min(COUNTDOWN_REVEAL_COUNT + computeProgressiveRevealCount(elapsedSinceRevealRef.current), TOTAL_OUTER);
      const disappearCount = computeDisappearCount(elapsedSinceDisappearRef.current);

      setVisibleExteriorIndices((current) => {
        const newVisible = computeVisibleFromSchedule(
          letterOrder.current,
          revealCount,
          disappearCount,
        );
        return newVisible;
      });

      if (revealCount >= TOTAL_OUTER && disappearCount === 0) {
        setPhase("all-visible");
      } else if (disappearCount > 0) {
        setPhase("disappearing");
      } else if (gameStarted) {
        setPhase("revealing");
      }
    }, Math.max(REVEAL_INTERVAL, DISAPPEAR_INTERVAL) * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [gameStarted, phase]);

  const triggerDisappear = useCallback((timerRemaining: number) => {
    if (timerRemaining >= DISAPPEAR_TRIGGER_REMAINING) return;
    const elapsed = (DISAPPEAR_TRIGGER_REMAINING - timerRemaining) * 1000;
    elapsedSinceDisappearRef.current = elapsed;
    hasTriggeredDisappearRef.current = true;

    if (phase !== "disappearing") {
      setPhase("disappearing");
    }

    const revealCount = Math.min(COUNTDOWN_REVEAL_COUNT + computeProgressiveRevealCount(elapsedSinceRevealRef.current), TOTAL_OUTER);
    const disappearCount = computeDisappearCount(elapsed);

    setVisibleExteriorIndices((current) => {
      return computeVisibleFromSchedule(
        letterOrder.current,
        revealCount,
        disappearCount,
      );
    });
  }, [phase]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return {
    phase,
    visibleExteriorIndices,
    countdownSeconds,
    gameStarted,
    onStart,
    triggerDisappear,
  };
};
