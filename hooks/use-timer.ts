import { useState, useEffect, useCallback, useRef } from "react";
import { loadTimerState, saveTimerState } from "@/lib/timer-storage";

export type TimerStatus = "idle" | "running" | "expired";

export const useTimer = (duration: number, date: string) => {
  const [remaining, setRemaining] = useState(duration);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  // Cargar estado persistente al montar (solo si el juego ya había empezado)
  useEffect(() => {
    const { startedAt, remaining: loadedRemaining } = loadTimerState(date, duration);
    startedAtRef.current = startedAt;

    if (startedAt) {
      hasStartedRef.current = true;
      setRemaining(loadedRemaining);
      setStatus(loadedRemaining > 0 ? "running" : "expired");
    }
  }, [date, duration]);

  // Countdown cuando está corriendo
  useEffect(() => {
    if (status !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  // Guardar persistencia cada vez que cambia el estado
  useEffect(() => {
    if (status === "running" && startedAtRef.current) {
      saveTimerState(date, startedAtRef.current, duration);
    }
    if (status === "idle" && hasStartedRef.current) {
      saveTimerState(date, null, duration);
    }
    if (status === "expired" && startedAtRef.current) {
      saveTimerState(date, startedAtRef.current, duration);
    }
  }, [status, remaining, date, duration]);

  const startTimer = useCallback(() => {
    if (status === "idle") {
      startedAtRef.current = Date.now();
      hasStartedRef.current = true;
      setStatus("running");
      saveTimerState(date, startedAtRef.current, duration);
    }
  }, [status, date, duration]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startedAtRef.current = null;
    hasStartedRef.current = false;
    setRemaining(duration);
    setStatus("idle");
    saveTimerState(date, null, duration);
  }, [duration, date]);

  const adjustRemaining = useCallback(
    (seconds: number) => {
      setRemaining((prev) => {
        const newRemaining = Math.max(0, Math.min(prev + seconds, duration));
        if (newRemaining === 0 && status === "running") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setStatus("expired");
        }
        return newRemaining;
      });
    },
    [duration, status],
  );

  return { remaining, status, startTimer, resetTimer, isExpired: status === "expired", adjustRemaining };
};
