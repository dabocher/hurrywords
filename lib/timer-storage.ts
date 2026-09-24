const TIMER_STORAGE_KEY = (date: string) => `hurrywords_timer_${date}`;

export const saveTimerState = (date: string, startedAt: number | null, timeCap: number) => {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY(date), JSON.stringify({ startedAt, timeCap }));
  } catch {
    // Silently fail — if localStorage is full or unavailable, we just lose persistence
  }
};

export const loadTimerState = (date: string, timeCap: number): { startedAt: number | null; remaining: number } => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY(date));
    if (!raw) return { startedAt: null, remaining: timeCap };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.startedAt !== "number") return { startedAt: null, remaining: timeCap };

    const storedTimeCap = typeof parsed.timeCap === "number" ? parsed.timeCap : timeCap;
    const remaining = storedTimeCap - Math.floor((Date.now() - parsed.startedAt) / 1000);

    return { startedAt: parsed.startedAt, remaining: remaining < 0 ? 0 : remaining };
  } catch {
    return { startedAt: null, remaining: timeCap };
  }
};

export const clearTimerState = (date: string) => {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY(date));
  } catch {
    // Silently fail
  }
};
